"""
document_repository.py — Document Table Queries
================================================
All DB operations for documents, document_versions, document_chunks,
document_categories, document_statuses, and document_processing_logs.
"""

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, asc, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, aliased

from app.models.models import (
    Document, DocumentVersion, DocumentChunk,
    DocumentCategory, DocumentStatus, DocumentProcessingLog
)
from app.repositories.base_repository import BaseRepository
from app.core.logger import logger


class DocumentStatusRepository(BaseRepository[DocumentStatus]):
    """Queries for the document_statuses lookup table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, DocumentStatus)

    async def get_by_name(self, status_name: str) -> Optional[DocumentStatus]:
        """
        Fetches a status row by its name string.

        Args:
            status_name: e.g. 'pending', 'processed', 'failed'

        Returns:
            DocumentStatus or None.
        """
        stmt = select(DocumentStatus).where(
            DocumentStatus.status_name == status_name,
            DocumentStatus.is_active == True,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


class DocumentCategoryRepository(BaseRepository[DocumentCategory]):
    """Queries for the document_categories table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, DocumentCategory)

    async def get_by_name(self, name: str) -> Optional[DocumentCategory]:
        """Finds a category by exact name."""
        stmt = select(DocumentCategory).where(
            DocumentCategory.name == name,
            DocumentCategory.is_active == True,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_categories(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> tuple[List[DocumentCategory], int]:
        """
        Paginated list of categories with optional name search and document count.

        Returns:
            (list_of_categories, total_count)
        """
        from app.models.models import Document
        
        conditions = []
        if is_active is not None:
            conditions.append(DocumentCategory.is_active == is_active)
            
        if search:
            conditions.append(DocumentCategory.name.ilike(f"%{search}%"))

        count_stmt = select(func.count()).select_from(DocumentCategory).where(*conditions)
        total = (await self.db.execute(count_stmt)).scalar_one()

        sort_map = {"name": DocumentCategory.name, "created_at": DocumentCategory.created_at}
        col = sort_map.get(sort_by, DocumentCategory.name)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            select(DocumentCategory, func.count(Document.id).label('doc_count'))
            .outerjoin(Document, Document.category_id == DocumentCategory.id)
            .where(*conditions)
            .group_by(DocumentCategory.id)
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        categories = []
        for cat, doc_count in rows:
            cat.document_count = doc_count
            categories.append(cat)
            
        return categories, total


class DocumentRepository(BaseRepository[Document]):
    """Queries for the documents table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, Document)

    async def get_with_relations(self, document_id: UUID) -> Optional[Document]:
        """
        Fetches a document with its category, status, and uploader loaded.

        Args:
            document_id: UUID of the document.

        Returns:
            Document ORM instance with relationships loaded.
        """
        stmt = (
            select(Document)
            .where(Document.id == document_id, Document.is_active == True)
            .options(
                selectinload(Document.category),
                selectinload(Document.status),
                selectinload(Document.uploader),
                selectinload(Document.versions),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_documents(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        category_id: Optional[UUID] = None,
        status_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[Document], int]:
        """
        Returns paginated list of documents with optional filters.

        Args:
            page:        Page number.
            page_size:   Records per page.
            search:      Partial match on title or tags.
            category_id: Filter by category.
            status_id:   Filter by status.
            sort_by:     Column to sort on.
            sort_order:  'asc' or 'desc'.

        Returns:
            (list_of_documents, total_count)
        """
        logger.debug(f"[DocumentRepository] list_documents page={page} search={search}")

        conditions = [Document.is_active == True]

        if search:
            conditions.append(
                or_(   #Search text can match title OR tags.
                    Document.title.ilike(f"%{search}%"),
                    Document.tags.ilike(f"%{search}%"),
                )
            )
        if category_id:
            conditions.append(Document.category_id == category_id)
        if status_id:
            conditions.append(Document.status_id == status_id)

        count_stmt = select(func.count()).select_from(Document).where(*conditions)
        total = (await self.db.execute(count_stmt)).scalar_one()

        sort_map = {
            "title":      Document.title,
            "created_at": Document.created_at,
            "updated_at": Document.updated_at,
        }
        col = sort_map.get(sort_by, Document.created_at)
        order_fn = asc if sort_order == "asc" else desc

        from app.models.models import DocumentVersion, DocumentChunk, QAMessageSourceChunk, QAMessage
        
        
        """
        Get documents from database.
        For each document, count how many Q&A messages/questions are connected to it.
        Also load category, status, and uploader details.
        Apply filters, sorting, pagination.
        
        """
        stmt = (
            select(
                Document,
                func.count(func.distinct(QAMessage.id)).label('question_count')
            )
            .outerjoin(DocumentVersion, DocumentVersion.document_id == Document.id)
            .outerjoin(DocumentChunk, DocumentChunk.document_version_id == DocumentVersion.id)
            .outerjoin(QAMessageSourceChunk, QAMessageSourceChunk.chunk_id == DocumentChunk.id)
            .outerjoin(QAMessage, QAMessage.id == QAMessageSourceChunk.message_id)
            .where(*conditions)
            .group_by(Document.id)
            .options(
                selectinload(Document.category),
                selectinload(Document.status),
                selectinload(Document.uploader),
                selectinload(Document.versions),
            )
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        docs = []
        for row in result.all():
            doc = row[0]   #document object
            doc.question_count = row[1]
            docs.append(doc)
        return docs, total

    async def list_published_documents(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        category_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[Document], int]:
        """
        Returns paginated list of strictly published documents for normal users.
        """
        from app.models.models import DocumentVersion, DocumentChunk, QAMessageSourceChunk, QAMessage, DocumentStatus
        from sqlalchemy.orm import aliased
        
        DocStatus = aliased(DocumentStatus)
        VerStatus = aliased(DocumentStatus)
        
        conditions = [
            Document.is_active == True,
            DocumentVersion.is_active == True,
            DocumentVersion.is_current == True,
            DocStatus.status_name == 'published',
            VerStatus.status_name == 'published',
        ]
        
        if search:
            conditions.append(
                or_(
                    Document.title.ilike(f"%{search}%"),
                    Document.tags.ilike(f"%{search}%"),
                )
            )
        if category_id:
            conditions.append(Document.category_id == category_id)
            
        count_stmt = (
            select(func.count())
            .select_from(Document)
            .join(DocumentVersion, DocumentVersion.document_id == Document.id)
            .join(DocStatus, Document.status_id == DocStatus.id)
            .join(VerStatus, DocumentVersion.status_id == VerStatus.id)
            .where(*conditions)
        )
        total = (await self.db.execute(count_stmt)).scalar_one()
        
        sort_map = {
            "title":      Document.title,
            "created_at": Document.created_at,
            "updated_at": Document.updated_at,
        }
        col = sort_map.get(sort_by, Document.created_at)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            select(
                Document,
                func.count(func.distinct(QAMessage.id)).label('question_count')
            )
            .join(DocumentVersion, DocumentVersion.document_id == Document.id)
            .join(DocStatus, Document.status_id == DocStatus.id)
            .join(VerStatus, DocumentVersion.status_id == VerStatus.id)
            .outerjoin(DocumentChunk, DocumentChunk.document_version_id == DocumentVersion.id)
            .outerjoin(QAMessageSourceChunk, QAMessageSourceChunk.chunk_id == DocumentChunk.id)
            .outerjoin(QAMessage, QAMessage.id == QAMessageSourceChunk.message_id)
            .where(*conditions)
            .group_by(Document.id)
            .options(
                selectinload(Document.category),
                selectinload(Document.status),
                selectinload(Document.uploader),
                selectinload(Document.versions).selectinload(DocumentVersion.status),
            )
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        docs = []
        for row in result.all():
            doc = row[0]
            doc.question_count = row[1]
            docs.append(doc)
        return docs, total


class DocumentVersionRepository(BaseRepository[DocumentVersion]):
    """Queries for the document_versions table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, DocumentVersion)

    async def get_current_version(self, document_id: UUID) -> Optional[DocumentVersion]:
        """
        Returns the current active version of a document (is_current=True).

        Args:
            document_id: UUID of the parent document.

        Returns:
            DocumentVersion or None.
        """
        stmt = (
            select(DocumentVersion)
            .where(
                DocumentVersion.document_id == document_id,
                DocumentVersion.is_current == True,
                DocumentVersion.is_active == True,
            )
            .options(
                selectinload(DocumentVersion.status),
                selectinload(DocumentVersion.document),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_max_version_no(self, document_id: UUID) -> int:
        """
        Returns the highest version number for a document.
        Used to calculate the next version number on upload.

        Args:
            document_id: UUID of the parent document.

        Returns:
            Max version_no as integer (0 if none exist yet).
        """
        stmt = select(func.max(DocumentVersion.version_no)).where(
            DocumentVersion.document_id == document_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one() or 0

    async def list_versions(self, document_id: UUID) -> List[DocumentVersion]:
        """
        Returns all versions for a document, newest first.

        Args:
            document_id: UUID of the parent document.

        Returns:
            List of DocumentVersion ORM instances.
        """
        stmt = (
            select(DocumentVersion)
            .where(
                DocumentVersion.document_id == document_id,
                DocumentVersion.is_active == True,
            )
            .options(selectinload(DocumentVersion.status))
            .order_by(desc(DocumentVersion.version_no))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def set_all_non_current(self, document_id: UUID) -> None:
        """
        Sets is_current=False on all versions of a document.
        Call this before marking the new version as current.

        Args:
            document_id: UUID of the parent document.
        """
        from sqlalchemy import update
        stmt = (
            update(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .values(is_current=False)
        )
        await self.db.execute(stmt)
        await self.db.commit()

    async def update_version_summary(self, version_id: UUID, summary: str) -> Optional[DocumentVersion]:
        from sqlalchemy import update
        stmt = (
            update(DocumentVersion)
            .where(DocumentVersion.id == version_id)
            .values(summary=summary)
            .returning(DocumentVersion)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one_or_none()


class DocumentChunkRepository(BaseRepository[DocumentChunk]):
    """Queries for the document_chunks table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, DocumentChunk)

    async def get_chunks_by_version(self, version_id: UUID) -> List[DocumentChunk]:
        """
        Returns all active chunks for a document version, in order.

        Args:
            version_id: UUID of the DocumentVersion.

        Returns:
            List of chunks sorted by chunk_no ascending.
        """
        stmt = (
            select(DocumentChunk)
            .where(
                DocumentChunk.document_version_id == version_id,
                DocumentChunk.is_active == True,
            )
            .order_by(asc(DocumentChunk.chunk_no))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_chunks_by_ids(self, chunk_ids: List[UUID]) -> List[DocumentChunk]:
        """
        Fetches multiple chunks by their UUIDs.
        Used to build source references for AI answers.

        Args:
            chunk_ids: List of chunk UUIDs.

        Returns:
            List of matching DocumentChunk instances.
        """
        if not chunk_ids:
            return []
        stmt = select(DocumentChunk).where(
            DocumentChunk.id.in_(chunk_ids),
            DocumentChunk.is_active == True,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


    async def search_similar_chunks(
        self,
        query_embedding: List[float],
        limit: int = 5,
        category_id: Optional[UUID] = None,
        document_ids: Optional[List[UUID]] = None,
        allowed_statuses: Optional[List[str]] = None,
    ) -> List[DocumentChunk]:
        """
        Finds the most relevant chunks using PostgreSQL pgvector.

        Only chunks from current document versions are searched. For normal
        users, pass allowed_statuses=["published"] so they only get answers
        from approved documents. Admin can pass ["processed", "published"]
        while testing a document before publishing.

        Optional filters:
          - category_id: ask from one category
          - document_ids: ask from selected documents
        """
        if not query_embedding:
            return []

        allowed_statuses = allowed_statuses or ["published"]
        distance = DocumentChunk.embedding.cosine_distance(query_embedding)

        DocStatus = aliased(DocumentStatus)
        VerStatus = aliased(DocumentStatus)

        conditions = [
            DocumentChunk.is_active == True,
            DocumentChunk.embedding.is_not(None),
            DocumentVersion.is_active == True,
            DocumentVersion.is_current == True,
            Document.is_active == True,
            DocStatus.status_name.in_(allowed_statuses),
            VerStatus.status_name.in_(allowed_statuses),
        ]

        if category_id:
            conditions.append(Document.category_id == category_id)
        if document_ids:
            conditions.append(Document.id.in_(document_ids))

        stmt = (
            select(DocumentChunk)
            .join(DocumentVersion, DocumentChunk.document_version_id == DocumentVersion.id)
            .join(Document, DocumentVersion.document_id == Document.id)
            .join(DocStatus, Document.status_id == DocStatus.id)
            .join(VerStatus, DocumentVersion.status_id == VerStatus.id)
            .where(*conditions)
            .options(
                selectinload(DocumentChunk.version)
                .selectinload(DocumentVersion.document),
                selectinload(DocumentChunk.version)
                .selectinload(DocumentVersion.status),
            )
            .order_by(distance)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_chunks_by_version(self, version_id: UUID) -> int:
        """Returns the number of chunks stored for a version."""
        stmt = select(func.count()).select_from(DocumentChunk).where(
            DocumentChunk.document_version_id == version_id,
            DocumentChunk.is_active == True,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def delete_chunks_by_version(self, version_id: UUID) -> None:
        """
        Soft-deletes all chunks for a given version.
        Called before re-processing to clear stale chunks.

        Args:
            version_id: UUID of the DocumentVersion.
        """
        from sqlalchemy import update
        stmt = (
            update(DocumentChunk)
            .where(DocumentChunk.document_version_id == version_id)
            .values(is_active=False)
        )
        await self.db.execute(stmt)
        await self.db.commit()


class DocumentProcessingLogRepository(BaseRepository[DocumentProcessingLog]):
    """Queries for the document_processing_logs table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, DocumentProcessingLog)

    async def get_latest_log(self, version_id: UUID) -> Optional[DocumentProcessingLog]:
        """
        Returns the most recent processing log for a version.

        Args:
            version_id: UUID of the DocumentVersion.

        Returns:
            Latest DocumentProcessingLog or None.
        """
        stmt = (
            select(DocumentProcessingLog)
            .where(
                DocumentProcessingLog.document_version_id == version_id,
                DocumentProcessingLog.is_active == True,
            )
            .order_by(desc(DocumentProcessingLog.created_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_logs_by_version(self, version_id: UUID) -> List[DocumentProcessingLog]:
        """Returns all processing logs for a document version, newest first."""
        stmt = (
            select(DocumentProcessingLog)
            .where(
                DocumentProcessingLog.document_version_id == version_id,
                DocumentProcessingLog.is_active == True,
            )
            .order_by(desc(DocumentProcessingLog.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
