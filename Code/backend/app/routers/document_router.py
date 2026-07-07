"""
document_router.py — Document Management Endpoints
====================================================
Endpoints:
  GET    /api/v1/documents                        — List documents (paginated)
  POST   /api/v1/documents                        — Upload new document
  GET    /api/v1/documents/{id}                   — Get document detail
  PATCH  /api/v1/documents/{id}                   — Update document metadata
  DELETE /api/v1/documents/{id}                   — Soft delete document
  POST   /api/v1/documents/{id}/process           — Process document (chunk + embed)
  GET    /api/v1/documents/{id}/versions          — List versions
  GET    /api/v1/documents/{id}/chunks            — List chunks for current version
  GET    /api/v1/documents/{id}/processing-logs   — Processing history

  GET    /api/v1/categories                       — List categories
  POST   /api/v1/categories                       — Create category (admin)
  PATCH  /api/v1/categories/{id}                  — Update category (admin)
  DELETE /api/v1/categories/{id}                  — Delete category (admin)

  GET    /api/v1/statuses                         — List document statuses
"""

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.schemas import (
    CategoryCreate, CategoryUpdate, CategoryOut,
    DocumentCreate, DocumentUpdate, DocumentOut, DocumentListOut,
    DocumentVersionOut, ChunkOut, ProcessingLogOut, DocumentStatusOut,
    QAStatusUpdate
)
from app.services.document_service import DocumentService, CategoryService
from app.utils.response import ResponseBuilder

router = APIRouter(tags=["Documents"])


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/categories", summary="List all document categories")
async def list_categories(
    page:       int           = Query(default=1,     ge=1),
    page_size:  int           = Query(default=10,    ge=1, le=100),
    search:     Optional[str] = Query(default=None),
    is_active:  Optional[bool] = Query(default=None),
    sort_by:    str           = Query(default="name"),
    sort_order: str           = Query(default="asc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Returns a paginated list of all active document categories."""
    service = CategoryService(db)
    items, total = await service.list_categories(page, page_size, search, is_active, sort_by, sort_order)
    out = [CategoryOut.model_validate(c).model_dump(mode="json") for c in items]
    return ResponseBuilder.paginated(items=out, total=total, page=page, page_size=page_size)


@router.post("/categories", summary="Create a document category (Admin only)")
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Creates a new document category. Requires admin role."""
    service = CategoryService(db)
    cat = await service.create_category(data, user_id=current_user.id)
    return ResponseBuilder.success(
        data=CategoryOut.model_validate(cat).model_dump(mode="json"),
        message="Category created successfully.",
        status_code=201,
    )


@router.patch("/categories/{category_id}", summary="Update a category (Admin only)")
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Updates fields on an existing category."""
    service = CategoryService(db)
    cat = await service.update_category(category_id, data, current_user.id)
    return ResponseBuilder.success(
        data=CategoryOut.model_validate(cat).model_dump(mode="json"),
        message="Category updated successfully.",
    )


@router.delete("/categories/{category_id}", summary="Delete a category (Admin only)")
async def delete_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Soft-deletes a category (sets is_active=False)."""
    service = CategoryService(db)
    await service.delete_category(category_id)
    return ResponseBuilder.success(message="Category deleted successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT STATUSES (read-only — seeded at startup)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/statuses", summary="List all document statuses")
async def list_statuses(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Returns all active document statuses (seeded lookup values)."""
    from app.repositories.document_repository import DocumentStatusRepository
    repo = DocumentStatusRepository(db)
    statuses = await repo.get_all()
    out = [DocumentStatusOut.model_validate(s).model_dump(mode="json") for s in statuses]
    return ResponseBuilder.success(data=out, message="Statuses fetched successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/documents", summary="List documents (paginated)")
async def list_documents(
    page:        int           = Query(default=1,    ge=1),
    page_size:   int           = Query(default=10,   ge=1, le=100),
    search:      Optional[str] = Query(default=None, description="Search in title or tags"),
    category_id: Optional[UUID] = Query(default=None),
    status:      Optional[str]  = Query(default=None, description="Filter by status name (e.g., published, processing)"),
    sort_by:     str           = Query(default="created_at"),
    sort_order:  str           = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Returns paginated list of documents.

    Query params:
        - page, page_size:  Pagination
        - search:           Partial match on title or tags
        - category_id:      Filter by category
        - status_id:        Filter by processing status
    """
    from app.models.models import DocumentStatus
    from sqlalchemy import select
    
    status_id = None
    if status:
        stmt = select(DocumentStatus).where(DocumentStatus.status_name.ilike(status))
        result = await db.execute(stmt)
        status_obj = result.scalar_one_or_none()
        if status_obj:
            status_id = status_obj.id

    service = DocumentService(db)
    items, total = await service.list_documents(
        page, page_size, search, category_id, status_id, sort_by, sort_order
    )
    out = [DocumentListOut.model_validate(d).model_dump(mode="json") for d in items]
    return ResponseBuilder.paginated(items=out, total=total, page=page, page_size=page_size)


@router.get("/documents/published", summary="List strictly published documents (paginated)")
async def list_published_documents(
    page:        int           = Query(default=1,    ge=1),
    page_size:   int           = Query(default=10,   ge=1, le=100),
    search:      Optional[str] = Query(default=None, description="Search in title or tags"),
    category_id: Optional[UUID] = Query(default=None),
    sort_by:     str           = Query(default="created_at"),
    sort_order:  str           = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Returns paginated list of ONLY published documents.
    Both Document and Current Version must have 'published' status.
    """
    service = DocumentService(db)
    items, total = await service.list_published_documents(
        page, page_size, search, category_id, sort_by, sort_order
    )
    out = [DocumentListOut.model_validate(d).model_dump(mode="json") for d in items]
    return ResponseBuilder.paginated(items=out, total=total, page=page, page_size=page_size)


@router.post("/documents", summary="Upload a new document")
async def upload_document(
    title:        str           = Form(...,    description="Document title"),
    category_id:  UUID          = Form(...,    description="Category UUID"),
    tags:         Optional[str] = Form(None,   description="Comma-separated tags"),
    text_content: Optional[str] = Form(None,   description="Paste document text directly"),
    file:         Optional[UploadFile] = File(None, description="Upload PDF, DOCX, or TXT"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """
    Uploads a new document to the knowledge base.

    Accepts multipart/form-data with either:
      - A file attachment (PDF, DOCX, TXT)
      - Pasted text in text_content field

    At least one of file or text_content must be provided.

    After upload, call POST /documents/{id}/process to chunk and embed.
    """
    metadata = DocumentCreate(title=title, category_id=category_id, tags=tags)
    service  = DocumentService(db)
    doc      = await service.upload_document(metadata, file, text_content, current_user.id)
    return ResponseBuilder.success(
        data=DocumentOut.model_validate(doc).model_dump(mode="json"),
        message="Document uploaded successfully. Call /process to index it for Q&A.",
        status_code=201,
    )


@router.post("/documents/{document_id}/generate-summary", summary="Generate summary for document")
async def generate_document_summary(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generates an AI summary for a document."""
    service = DocumentService(db)

    summary = await service.generate_summary_for_document(
        document_id=document_id,
        current_user=current_user,
    )

    return ResponseBuilder.success(
        message="Summary generated successfully.",
        data={"summary": summary},
    )


@router.get("/documents/{document_id}", summary="Get document details")
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Returns full details of a single document including category, status, and uploader."""
    service = DocumentService(db)
    doc     = await service.get_document(document_id)
    return ResponseBuilder.success(
        data=DocumentOut.model_validate(doc).model_dump(mode="json"),
        message="Document fetched successfully.",
    )


@router.patch("/documents/{document_id}", summary="Update document metadata")
async def update_document(
    document_id: UUID,
    data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Updates title, category, or tags on an existing document."""
    service = DocumentService(db)
    doc     = await service.update_document(document_id, data, current_user.id)
    return ResponseBuilder.success(
        data=DocumentOut.model_validate(doc).model_dump(mode="json"),
        message="Document updated successfully.",
    )


@router.delete("/documents/{document_id}", summary="Delete a document (Admin only)")
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Soft-deletes a document and its versions."""
    service = DocumentService(db)
    await service.delete_document(document_id)
    return ResponseBuilder.success(message="Document deleted successfully.")


@router.post("/documents/{document_id}/process", summary="Process document (chunk + embed)")
async def process_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """
    Processes the document's current version:
      1. Splits text into ~800-character overlapping chunks
      2. Generates embeddings using Gemini embedding model
      3. Stores 768-dimension embeddings in PostgreSQL pgvector
      4. Stores chunk metadata in PostgreSQL

    After this succeeds, status becomes processed.
    Admin can test it, then publish it for normal users.
    """
    service = DocumentService(db)
    result  = await service.process_document(document_id, current_user.id)
    return ResponseBuilder.success(data=result, message="Document processed and indexed successfully.")


@router.patch("/documents/{document_id}/publish", summary="Publish a processed document")
async def publish_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """
    Marks a processed document as published.

    Flow:
      1. Upload document
      2. Process document
      3. Admin tests sample questions
      4. Publish document
      5. Normal users can ask from this document
    """
    service = DocumentService(db)
    doc = await service.publish_document(document_id, current_user.id)
    return ResponseBuilder.success(
        data=DocumentOut.model_validate(doc).model_dump(mode="json"),
        message="Document published successfully. Users can now ask questions from it.",
    )



@router.patch("/documents/{document_id}/qa-status", summary="Update document QA test status")
async def update_document_qa_status(
    document_id: UUID,
    body: QAStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """

    Updates the QA testing status of a processed document.
    This endpoint is used after an admin tests a document by asking a sample question.
    
    The admin can mark the result as:
      - looks_good: the answer is correct and the document can be published
      - needs_fix: the answer is not good enough and the document needs changes
    
    It can also save the tested question, AI answer, and source chunks so the
    review record is available later.

    Requires:
        Admin role only.

    Args:

        document_id: UUID of the document being tested.
        body: QAStatusUpdate containing status, question, answer, and sources.
        db: Async database session.
        current_user: Logged-in admin user.

    Returns:
        Updated document details.

    """

    service = DocumentService(db)
    doc = await service.update_qa_status(
        document_id=document_id,
        status=body.status,
        user_id=current_user.id,
        qa_question=body.question,
        qa_answer=body.answer,
        qa_sources=body.sources
    )
    return ResponseBuilder.success(
        data=DocumentOut.model_validate(doc).model_dump(mode="json"),
        message="QA status updated successfully.",
    )

@router.post("/documents/{document_id}/versions", summary="Upload a new version of a document")
async def upload_document_version(
    document_id: UUID,
    title:         Optional[str] = Form(None, description="Optional title for this version"),
    version_label: Optional[str] = Form(None, description="Example: v2.0"),
    change_note:   Optional[str] = Form(None, description="What changed in this version"),
    text_content:  Optional[str] = Form(None, description="Paste updated document text"),
    file:          Optional[UploadFile] = File(None, description="Upload updated PDF, DOCX, or TXT"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """

    Uploads a new version for an existing document.
    This is used when an existing document needs correction or improvement,
    instead of uploading a completely new document.

    The new version starts as pending. After upload, admin must:
      1. Process the new version
      2. Test it with sample questions
      3. Mark QA status as looks_good
      4. Publish it

    Requires:
        Admin role only.

    Args:

        document_id: UUID of the existing document.
        title: Optional updated title for this version.
        version_label: Optional label like v2.0.
        change_note: Short note explaining what changed.
        text_content: Updated pasted text, if no file is uploaded.
        file: Updated document file.
        db: Async database session.
        current_user: Logged-in admin user.

    Returns:
        Created document version details.

    """
    service = DocumentService(db)
    version = await service.upload_new_version(
        document_id=document_id,
        title=title,
        version_label=version_label,
        change_note=change_note,
        file=file,
        text_content=text_content,
        user_id=current_user.id,
    )
    return ResponseBuilder.success(
        data=DocumentVersionOut.model_validate(version).model_dump(mode="json"),
        message="New document version uploaded. Process it before publishing.",
        status_code=201,
    )


@router.get("/documents/{document_id}/versions", summary="List document versions")
async def list_versions(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Returns all versions of a document, newest first."""
    service  = DocumentService(db)
    versions = await service.list_versions(document_id)
    out = [DocumentVersionOut.model_validate(v).model_dump(mode="json") for v in versions]
    return ResponseBuilder.success(data=out, message="Versions fetched successfully.")


@router.get("/documents/{document_id}/chunks", summary="List chunks for a document version")
async def list_chunks(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """
    Returns all text chunks for the current active version of a document.
    Useful for admin inspection of how the document was indexed.
    """
    service = DocumentService(db)
    doc     = await service.get_document(document_id)
    from app.repositories.document_repository import DocumentVersionRepository
    ver_repo = DocumentVersionRepository(db)
    version  = await ver_repo.get_current_version(document_id)
    if not version:
        return ResponseBuilder.success(data=[], message="No processed version found.")
    chunks = await service.get_chunks(version.id)
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"document_id: {document_id}, current_version_id: {version.id}, chunks_count: {len(chunks)}")
    
    out = [ChunkOut.model_validate(c).model_dump(mode="json") for c in chunks]
    return ResponseBuilder.success(data=out, message=f"{len(out)} chunks fetched.")


@router.get("/documents/{document_id}/processing-logs", summary="Get processing history")
async def get_processing_logs(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Returns the processing log history for a document's current version."""
    service = DocumentService(db)
    doc     = await service.get_document(document_id)
    from app.repositories.document_repository import DocumentVersionRepository
    ver_repo = DocumentVersionRepository(db)
    version  = await ver_repo.get_current_version(document_id)
    if not version:
        return ResponseBuilder.success(data=[], message="No version found.")
    logs = await service.get_processing_logs(version.id)
    out  = [ProcessingLogOut.model_validate(l).model_dump(mode="json") for l in logs]
    return ResponseBuilder.success(data=out, message="Processing logs fetched.")
