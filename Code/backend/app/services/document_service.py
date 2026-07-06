"""
document_service.py — Document Business Logic
==============================================
Handles:
  - Document CRUD (create, list, get, update, delete)
  - File upload (validate extension, extract text from PDF/DOCX/TXT)
  - Text chunking (split into ~800 char chunks with overlap)
  - Embedding generation using Google text-embedding-004
  - Document reprocessing
  - Category and Status management

RULES:
  - Calls Repository for DB operations
  - Calls ai_agent for embedding generation
  - No direct DB queries
  - No HTTP concerns
"""

import io
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logger import logger
from app.models.models import (
    Document, DocumentVersion, DocumentChunk,
    DocumentProcessingLog, DocumentCategory
)
from app.repositories.document_repository import (
    DocumentRepository, DocumentVersionRepository,
    DocumentChunkRepository, DocumentProcessingLogRepository,
    DocumentCategoryRepository, DocumentStatusRepository,
)
from app.schemas.schemas import DocumentCreate, DocumentUpdate, CategoryCreate, CategoryUpdate
from app.ai import ai_agent


# ─────────────────────────────────────────────────────────────────────────────
# TEXT EXTRACTION UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

async def _extract_text_from_file(file: UploadFile) -> str:
    """
    Extracts plain text from uploaded PDF, DOCX, or TXT file.

    Args:
        file: FastAPI UploadFile object.

    Returns:
        Tuple of (Extracted text as a string, Page count).

    Raises:
        HTTPException 400: If file type is unsupported or extraction fails.
    """
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower()

    logger.debug(f"[DocumentService] Extracting text from .{ext} file: {file.filename}")

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '.{ext}'. Allowed: {settings.ALLOWED_EXTENSIONS}",
        )

    try:
        if ext == "txt":
            return content.decode("utf-8", errors="replace"), 1

        elif ext == "pdf":
            import pypdf

            # The uploaded file content is in memory as bytes.
            # pypdf.PdfReader() expects a file-like object.

            # So this converts bytes into a file-like object:
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text.strip())
            return "\n\n".join(pages), len(reader.pages)
        
#         It combines all page texts into one clean document text.
# The double new line keeps page content separated.

        elif ext == "docx":
            import docx
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs), None

    except Exception as exc:
        logger.error(f"[DocumentService] Text extraction failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from the file: {str(exc)}",
        )

    return "", None


def _chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
    """
    Splits a long text into overlapping chunks for better retrieval quality.
    Overlap ensures that context spanning chunk boundaries is not lost.

    Args:
        text:       Full document text to split.
        chunk_size: Max characters per chunk (default from settings).
        overlap:    Overlap in characters between consecutive chunks.

    Returns:
        List of text chunk strings.

    Example:
        Text: "ABCDEFGHIJ" with chunk_size=4, overlap=1
        Result: ["ABCD", "DEFG", "GHIJ"]
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap    = overlap    or settings.CHUNK_OVERLAP

    if not text:
        return []

    chunks = []
    start  = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        # Move forward by (chunk_size - overlap) so next chunk overlaps
        start += chunk_size - overlap

    logger.debug(f"[DocumentService] Chunked text into {len(chunks)} chunks")
    return chunks


async def _save_file_to_disk(file: UploadFile, file_content: bytes) -> str:
    """
    Saves the uploaded file to the local uploads directory.

    Args:
        file:         UploadFile object (for filename).
        file_content: Raw bytes of the file.

    Returns:
        Relative file path where the file was saved.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path   = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(file_content)

    logger.debug(f"[DocumentService] File saved to: {file_path}")
    return file_path


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class CategoryService:
    """Handles document category CRUD operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._repo = DocumentCategoryRepository(db)

    async def create_category(self, data: CategoryCreate, user_id: UUID) -> DocumentCategory:
        """
        Creates a new document category.

        Args:
            data:    CategoryCreate schema.
            user_id: UUID of the creating admin.

        Returns:
            Created DocumentCategory.

        Raises:
            HTTPException 409: If category name already exists.
        """
        existing = await self._repo.get_by_name(data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category '{data.name}' already exists.",
            )
        cat = DocumentCategory(
            name=        data.name,
            description= data.description,
            created_by=  user_id,
        )
        return await self._repo.create(cat)

    async def list_categories(self, page, page_size, search, is_active, sort_by, sort_order):
        return await self._repo.list_categories(page, page_size, search, is_active, sort_by, sort_order)

    async def get_category(self, cat_id: UUID) -> DocumentCategory:
        cat = await self._repo.get_by_id(cat_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found.")
        return cat

    async def update_category(self, cat_id: UUID, data: CategoryUpdate, user_id: UUID) -> DocumentCategory:
        cat = await self.get_category(cat_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_by"] = user_id
        return await self._repo.update(cat, update_data)

    async def delete_category(self, cat_id: UUID) -> DocumentCategory:
        cat = await self.get_category(cat_id)
        return await self._repo.soft_delete(cat)


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class DocumentService:
    """
    Core service for document upload, processing, and management.
    Coordinates between repositories and the AI agent layer.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: Injected async database session.
        """
        self._db          = db
        self._doc_repo    = DocumentRepository(db)
        self._ver_repo    = DocumentVersionRepository(db)
        self._chunk_repo  = DocumentChunkRepository(db)
        self._log_repo    = DocumentProcessingLogRepository(db)
        self._status_repo = DocumentStatusRepository(db)

    # ── Create ────────────────────────────────────────────────────────────────

    async def upload_document(
        self,
        metadata: DocumentCreate,
        file: Optional[UploadFile],
        text_content: Optional[str],
        user_id: UUID,
    ) -> Document:
        """
        Uploads a new document and creates Version 1.

        Accepts either:
          - A file upload (PDF/DOCX/TXT)
          - Pasted plain text (text_content)

        Args:
            metadata:     DocumentCreate with title, category_id, tags.
            file:         UploadFile (optional if text_content is provided).
            text_content: Plain text (optional if file is provided).
            user_id:      UUID of the uploading user.

        Returns:
            Created Document ORM instance.

        Raises:
            HTTPException 400: If neither file nor text_content is provided.
        """
        logger.info(f"[DocumentService] Uploading document: '{metadata.title}'")

        if not file and not text_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide either a file upload or paste text content.",
            )

        # Check file size limit
        if file:
            file_bytes = await file.read()
            await file.seek(0)   # reset read pointer
            size_mb = len(file_bytes) / (1024 * 1024)
            if size_mb > settings.MAX_UPLOAD_SIZE_MB:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
                )

        # Get 'pending' status
        pending_status = await self._status_repo.get_by_name("pending")
        if not pending_status:
            raise HTTPException(status_code=500, detail="'pending' status not seeded in DB.")

        # Create Document record
        doc = Document(
            title=              metadata.title,
            category_id=        metadata.category_id,
            tags=               metadata.tags,
            uploaded_by=        user_id,
            status_id=          pending_status.id,
            current_version_no= 1,
            created_by=         user_id,
        )
        doc = await self._doc_repo.create(doc)

        extracted_text = text_content
        page_count = None if not text_content else 1
        file_name = None
        file_type = None
        file_path = None

        if file:
            extracted_text, page_count = await _extract_text_from_file(file)
            file_name = file.filename
            file_type = file.filename.rsplit(".", 1)[-1].lower()
            await file.seek(0)
            file_bytes = await file.read()
            file_path  = await _save_file_to_disk(file, file_bytes)

        token_count = None
        if extracted_text:
            token_count = max(1, round(len(extracted_text.split()) * 1.3))

        # Create Version 1
        version = DocumentVersion(
            document_id=   doc.id,
            version_no=    1,
            version_label= "v1.0",
            title=         metadata.title,
            content_text=  extracted_text,
            file_name=     file_name,
            file_type=     file_type,
            file_path=     file_path,
            page_count=    page_count,
            token_count=   token_count,
            is_current=    True,
            status_id=     pending_status.id,
            created_by=    user_id,
        )
        await self._ver_repo.create(version)

        logger.info(f"[DocumentService] Document created: {doc.id}")
        return await self.get_document(doc.id)

    async def upload_new_version(
        self,
        document_id: UUID,
        title: Optional[str],
        version_label: Optional[str],
        change_note: Optional[str],
        file: Optional[UploadFile],
        text_content: Optional[str],
        user_id: UUID,
    ) -> DocumentVersion:
        """
        Adds a new version for an existing document.

        This is used when admin updates the document content. The new
        version starts as pending, then admin must call /process again.
        """
        doc = await self.get_document(document_id)

        if not file and not text_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide either a file upload or paste text content for the new version.",
            )

        if file:
            file_bytes = await file.read()
            await file.seek(0)
            size_mb = len(file_bytes) / (1024 * 1024)
            if size_mb > settings.MAX_UPLOAD_SIZE_MB:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
                )

        pending_status = await self._status_repo.get_by_name("pending")
        if not pending_status:
            raise HTTPException(status_code=500, detail="'pending' status not seeded in DB.")

        extracted_text = text_content
        page_count = None if not text_content else 1
        file_name = None
        file_type = None
        file_path = None

        if file:
            extracted_text, page_count = await _extract_text_from_file(file)
            file_name = file.filename
            file_type = file.filename.rsplit(".", 1)[-1].lower()
            await file.seek(0)
            file_bytes = await file.read()
            file_path = await _save_file_to_disk(file, file_bytes)
            
        token_count = None
        if extracted_text:
            token_count = max(1, round(len(extracted_text.split()) * 1.3))

        next_version_no = (await self._ver_repo.get_max_version_no(document_id)) + 1

        await self._ver_repo.set_all_non_current(document_id)

        version = DocumentVersion(
            document_id=   document_id,
            version_no=    next_version_no,
            version_label= version_label or f"v{next_version_no}.0",
            title=         title or doc.title,
            content_text=  extracted_text,
            file_name=     file_name,
            file_type=     file_type,
            file_path=     file_path,
            page_count=    page_count,
            token_count=   token_count,
            change_note=   change_note,
            is_current=    True,
            status_id=     pending_status.id,
            created_by=    user_id,
        )
        version = await self._ver_repo.create(version)

        await self._doc_repo.update(doc, {
            "title": title or doc.title,
            "status_id": pending_status.id,
            "current_version_no": next_version_no,
            "updated_by": user_id,
        })

        refreshed_version = await self._ver_repo.get_current_version(document_id)
        return refreshed_version or version

    # ── Process (chunk + embed) ───────────────────────────────────────────────

    async def process_document(self, document_id: UUID, user_id: UUID) -> dict:
        """
        Processes the current version of a document:
          1. Get current version
          2. Split text into chunks
          3. Generate embeddings using Google text-embedding-004
          4. Store chunks and embeddings in PostgreSQL pgvector
          5. Update document status to 'processed'

        Args:
            document_id: UUID of the Document to process.
            user_id:     UUID of the user triggering processing.

        Returns:
            Dict with processing summary.

        Raises:
            HTTPException 404: If document not found.
            HTTPException 422: If document has no text content.
        """
        logger.info(f"[DocumentService] Processing document: {document_id}")

        doc = await self._doc_repo.get_with_relations(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        version = await self._ver_repo.get_current_version(document_id)
        if not version or not version.content_text:
            raise HTTPException(
                status_code=422,
                detail="Document version has no text content to process.",
            )

        # Create a processing log entry
        processing_status = await self._status_repo.get_by_name("processing")
        proc_log = DocumentProcessingLog(
            document_version_id= version.id,
            status=              "queued",
            created_by=          user_id,
        )
        proc_log = await self._log_repo.create(proc_log)

        start_time = time.time()
        try:
            # Update log to 'processing'
            await self._log_repo.update(proc_log, {"status": "processing"})

            # Update doc and version status to 'processing'
            await self._doc_repo.update(doc, {"status_id": processing_status.id, "updated_by": user_id})
            await self._ver_repo.update(version, {"status_id": processing_status.id, "updated_by": user_id})

            # 1. Clear old chunks (for re-processing)
            old_chunks = await self._chunk_repo.get_chunks_by_version(version.id)
            if old_chunks:
                await self._chunk_repo.delete_chunks_by_version(version.id)

            # 2. Split text into chunks
            text_chunks = _chunk_text(version.content_text)
            if not text_chunks:
                raise ValueError("No text extracted after chunking.")

            # 3. Generate embeddings for every chunk
            # Google text-embedding-004 returns 768-dimension vectors.
            embeddings = await ai_agent.generate_embeddings(text_chunks)

            # 4. Store chunk text + embedding directly in PostgreSQL pgvector
            db_chunks = []
            for i, chunk_text in enumerate(text_chunks, start=1):
                db_chunks.append(
                    DocumentChunk(
                        document_version_id= version.id,
                        chunk_no=            i,
                        chunk_text=          chunk_text,
                        keyword_text=        " ".join(chunk_text.lower().split()[:20]),
                        embedding=           embeddings[i - 1],
                        created_by=          user_id,
                    )
                )

            await self._chunk_repo.create_many(db_chunks)

            # 5. Update statuses to 'processed'
            processed_status = await self._status_repo.get_by_name("processed")
            now = datetime.now(timezone.utc)
            await self._doc_repo.update(doc, {"status_id": processed_status.id, "updated_by": user_id})
            await self._ver_repo.update(version, {"status_id": processed_status.id, "updated_by": user_id})
            await self._log_repo.update(proc_log, {"status": "success", "processed_at": now})

            elapsed = round((time.time() - start_time) * 1000)
            logger.info(f"[DocumentService] Document {document_id} processed: {len(db_chunks)} chunks in {elapsed}ms")

            return {
                "document_id":   str(document_id),
                "version_no":    version.version_no,
                "chunk_count":   len(db_chunks),
                "time_taken_ms": elapsed,
            }

        except Exception as exc:
            logger.error(f"[DocumentService] Processing failed for {document_id}: {exc}", exc_info=True)
            failed_status = await self._status_repo.get_by_name("failed")
            await self._log_repo.update(proc_log, {
                "status":        "failed",
                "error_message": str(exc),
                "processed_at":  datetime.now(timezone.utc),
            })
            await self._doc_repo.update(doc, {"status_id": failed_status.id, "updated_by": user_id})
            raise HTTPException(
                status_code=500,
                detail=f"Document processing failed: {str(exc)}",
            )

    async def publish_document(self, document_id: UUID, user_id: UUID) -> Document:
        """
        Publishes a processed document so normal users can ask questions from it.

        Processed = chunks and embeddings are ready for admin testing.
        Published = admin approved it for user Q&A.
        """
        doc = await self.get_document(document_id)
        version = await self._ver_repo.get_current_version(document_id)
        if not version:
            raise HTTPException(status_code=404, detail="Current document version not found.")

        processed_status = await self._status_repo.get_by_name("processed")
        published_status = await self._status_repo.get_by_name("published")
        if not processed_status or not published_status:
            raise HTTPException(status_code=500, detail="Document statuses are not seeded correctly.")

        if version.status_id != processed_status.id and doc.status_id != processed_status.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only processed documents can be published. Process the document first.",
            )

        if version.qa_test_status == 'not_tested':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ask a test question before publishing this document.",
            )
            
        if version.qa_test_status == 'needs_fix':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This document needs fixes before publishing.",
            )

        if version.qa_test_status != 'looks_good':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mark the test answer as Looks Good before publishing.",
            )

        # Check if it has chunks
        chunks = await self._chunk_repo.get_chunks_by_version(version.id)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has no chunks. Processing might have failed or the document is empty.",
            )

        await self._ver_repo.update(version, {
            "status_id": published_status.id,
            "updated_by": user_id,
        })
        await self._doc_repo.update(doc, {
            "status_id": published_status.id,
            "updated_by": user_id,
        })
        return await self.get_document(document_id)

    async def update_qa_status(
        self,
        document_id: UUID,
        status: str,
        user_id: UUID,
        qa_question: Optional[str] = None,
        qa_answer: Optional[str] = None,
        qa_sources: Optional[List[dict]] = None
    ) -> Document:
        """
        Updates the QA test status, question, answer, and sources of the current document version.
        status should be one of 'looks_good', 'needs_fix'
        """
        doc = await self.get_document(document_id)
        version = await self._ver_repo.get_current_version(document_id)
        if not version:
            raise HTTPException(status_code=404, detail="Current document version not found.")
            
        if status not in ["looks_good", "needs_fix"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'looks_good' or 'needs_fix'")
            
        import json
        from datetime import datetime, timezone
        update_data = {
            "qa_test_status": status,
            "qa_tested_at": datetime.now(timezone.utc),
            "qa_tested_by": user_id,
        }
        if qa_question is not None:
            update_data["qa_question"] = qa_question
        if qa_answer is not None:
            update_data["qa_answer"] = qa_answer
        if qa_sources is not None:
            update_data["qa_sources_json"] = json.dumps(qa_sources)
            
        await self._ver_repo.update(version, update_data)
        
        return await self.get_document(document_id)

    # ── List / Get ────────────────────────────────────────────────────────────

    async def list_documents(self, page, page_size, search, category_id, status_id, sort_by, sort_order):
        return await self._doc_repo.list_documents(page, page_size, search, category_id, status_id, sort_by, sort_order)

    async def get_document(self, document_id: UUID) -> Document:
        doc = await self._doc_repo.get_with_relations(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        return doc

    async def list_versions(self, document_id: UUID) -> List[DocumentVersion]:
        await self.get_document(document_id)   # existence check
        return await self._ver_repo.list_versions(document_id)

    async def get_chunks(self, version_id: UUID) -> List[DocumentChunk]:
        return await self._chunk_repo.get_chunks_by_version(version_id)

    async def get_processing_logs(self, version_id: UUID):
        return await self._log_repo.list_logs_by_version(version_id)

    # ── Update / Delete ───────────────────────────────────────────────────────

    async def update_document(self, document_id: UUID, data: DocumentUpdate, user_id: UUID) -> Document:
        doc = await self.get_document(document_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["updated_by"] = user_id
        return await self._doc_repo.update(doc, update_data)

    async def delete_document(self, document_id: UUID) -> Document:
        doc = await self.get_document(document_id)
        return await self._doc_repo.soft_delete(doc)
