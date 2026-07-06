"""
qa_repository.py — QA Sessions, Messages, AI Logs Queries
==========================================================
All DB operations for:
  - qa_sessions
  - qa_messages
  - qa_message_source_chunks
  - ai_response_logs
"""

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, asc, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, aliased

from app.models.models import (
    QASession,
    QAMessage,
    QAMessageSourceChunk,
    AIResponseLog,
    DocumentChunk,
    DocumentVersion,
    Document,
)
from app.repositories.base_repository import BaseRepository
from app.core.logger import logger


class QASessionRepository(BaseRepository[QASession]):
    """Queries for the qa_sessions table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, QASession)

    async def get_session_with_user(self, session_id: UUID) -> Optional[QASession]:
        """
        Fetches a QA session with the owning user loaded.
        """
        stmt = (
            select(QASession)
            .where(QASession.id == session_id, QASession.is_active == True)
            .options(selectinload(QASession.user))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_sessions_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[QASession], int]:
        """
        Returns paginated QA sessions belonging to a specific user.
        """
        conditions = [QASession.user_id == user_id, QASession.is_active == True]

        if search:
            conditions.append(QASession.title.ilike(f"%{search}%"))

        count_stmt = select(func.count()).select_from(QASession).where(*conditions)
        total = (await self.db.execute(count_stmt)).scalar_one()

        sort_map = {
            "title": QASession.title,
            "created_at": QASession.created_at,
        }

        col = sort_map.get(sort_by, QASession.created_at)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            select(QASession)
            .where(*conditions)
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total


class QAMessageRepository(BaseRepository[QAMessage]):
    """Queries for the qa_messages table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, QAMessage)

    async def get_message_with_sources(self, message_id: UUID) -> Optional[QAMessage]:
        """
        Fetches a QA message with its linked document and source chunks loaded.
        """
        stmt = (
            select(QAMessage)
            .where(QAMessage.id == message_id, QAMessage.is_active == True)
            .options(
                selectinload(QAMessage.linked_document).selectinload(Document.category),
                selectinload(QAMessage.linked_document).selectinload(Document.status),
                selectinload(QAMessage.source_chunks)
                .selectinload(QAMessageSourceChunk.chunk)
                .selectinload(DocumentChunk.version)
                .selectinload(DocumentVersion.document),
                selectinload(QAMessage.session).selectinload(QASession.user),
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_messages_by_session(
        self,
        session_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[QAMessage], int]:
        """
        Returns paginated messages in a QA session, oldest first.
        """
        conditions = [
            QAMessage.session_id == session_id,
            QAMessage.is_active == True,
        ]

        count_stmt = select(func.count()).select_from(QAMessage).where(*conditions)
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            select(QAMessage)
            .where(*conditions)
            .options(
                selectinload(QAMessage.linked_document).selectinload(Document.category),
                selectinload(QAMessage.linked_document).selectinload(Document.status),
                selectinload(QAMessage.source_chunks)
                .selectinload(QAMessageSourceChunk.chunk)
                .selectinload(DocumentChunk.version)
                .selectinload(DocumentVersion.document),
            )
            .order_by(asc(QAMessage.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def list_all_messages(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        helpful: Optional[bool] = None,
        validation_status: Optional[str] = None,
        document_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[QAMessage], int]:
        """
        Lists QA messages with filters.

        Important:
        - New records use QAMessage.document_id directly.
        - Old records can still be found using source_chunks fallback.
        """
        conditions = [QAMessage.is_active == True]

        if search:
            conditions.append(QAMessage.question.ilike(f"%{search}%"))

        if helpful is not None:
            conditions.append(QAMessage.helpful == helpful)

        if validation_status:
            conditions.append(QAMessage.validation_status == validation_status)

            if validation_status == "pending":
                conditions.append(QAMessage.is_unanswered == False)

        stmt = select(QAMessage).where(*conditions)
        count_stmt = select(func.count(func.distinct(QAMessage.id))).select_from(QAMessage).where(*conditions)

        if user_id:
            stmt = stmt.join(QASession, QAMessage.session_id == QASession.id).where(
                QASession.user_id == user_id
            )

            count_stmt = count_stmt.join(QASession, QAMessage.session_id == QASession.id).where(
                QASession.user_id == user_id
            )

        if document_id or category_id:
            DirectDoc = aliased(Document)
            FallbackDoc = aliased(Document)

            stmt = (
                stmt.outerjoin(DirectDoc, QAMessage.document_id == DirectDoc.id)
                .outerjoin(QAMessage.source_chunks)
                .outerjoin(QAMessageSourceChunk.chunk)
                .outerjoin(DocumentChunk.version)
                .outerjoin(FallbackDoc, DocumentVersion.document_id == FallbackDoc.id)
            )

            count_stmt = (
                count_stmt.outerjoin(DirectDoc, QAMessage.document_id == DirectDoc.id)
                .outerjoin(QAMessage.source_chunks)
                .outerjoin(QAMessageSourceChunk.chunk)
                .outerjoin(DocumentChunk.version)
                .outerjoin(FallbackDoc, DocumentVersion.document_id == FallbackDoc.id)
            )

            filter_conditions = []

            if document_id:
                filter_conditions.append(
                    or_(
                        QAMessage.document_id == document_id,
                        FallbackDoc.id == document_id,
                    )
                )

            if category_id:
                filter_conditions.append(
                    or_(
                        DirectDoc.category_id == category_id,
                        FallbackDoc.category_id == category_id,
                    )
                )

            if filter_conditions:
                stmt = stmt.where(*filter_conditions).distinct()
                count_stmt = count_stmt.where(*filter_conditions)

        total = (await self.db.execute(count_stmt)).scalar_one()

        sort_map = {
            "created_at": QAMessage.created_at,
            "helpful": QAMessage.helpful,
            "confidence_score": QAMessage.confidence_score,
        }

        col = sort_map.get(sort_by, QAMessage.created_at)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            stmt.options(
                selectinload(QAMessage.linked_document).selectinload(Document.category),
                selectinload(QAMessage.linked_document).selectinload(Document.status),
                selectinload(QAMessage.source_chunks)
                .selectinload(QAMessageSourceChunk.chunk)
                .selectinload(DocumentChunk.version)
                .selectinload(DocumentVersion.document),
                selectinload(QAMessage.session).selectinload(QASession.user),
            )
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def count_helpful(self) -> int:
        """Returns count of messages marked as helpful=True."""
        stmt = (
            select(func.count())
            .select_from(QAMessage)
            .where(
                QAMessage.is_active == True,
                QAMessage.helpful == True,
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def count_unanswered(self) -> int:
        """Returns count of unanswered messages."""
        stmt = (
            select(func.count())
            .select_from(QAMessage)
            .where(
                QAMessage.is_active == True,
                QAMessage.is_unanswered == True,
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def list_unanswered_messages(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        category_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[QAMessage], int]:
        """
        Admin list of unanswered or low-confidence questions.

        Uses direct document_id for new data and source_chunks fallback for old data.
        """
        conditions = [
            QAMessage.is_active == True,
            QAMessage.is_unanswered == True,
            QAMessage.validation_status != "approved",
        ]

        if search:
            conditions.append(QAMessage.question.ilike(f"%{search}%"))

        stmt = select(QAMessage).where(*conditions)
        count_stmt = select(func.count(func.distinct(QAMessage.id))).select_from(QAMessage).where(*conditions)

        if user_id:
            stmt = stmt.join(QASession, QAMessage.session_id == QASession.id).where(
                QASession.user_id == user_id
            )

            count_stmt = count_stmt.join(QASession, QAMessage.session_id == QASession.id).where(
                QASession.user_id == user_id
            )

        if category_id:
            DirectDoc = aliased(Document)
            FallbackDoc = aliased(Document)

            stmt = (
                stmt.outerjoin(DirectDoc, QAMessage.document_id == DirectDoc.id)
                .outerjoin(QAMessage.source_chunks)
                .outerjoin(QAMessageSourceChunk.chunk)
                .outerjoin(DocumentChunk.version)
                .outerjoin(FallbackDoc, DocumentVersion.document_id == FallbackDoc.id)
            )

            count_stmt = (
                count_stmt.outerjoin(DirectDoc, QAMessage.document_id == DirectDoc.id)
                .outerjoin(QAMessage.source_chunks)
                .outerjoin(QAMessageSourceChunk.chunk)
                .outerjoin(DocumentChunk.version)
                .outerjoin(FallbackDoc, DocumentVersion.document_id == FallbackDoc.id)
            )

            category_filter = or_(
                DirectDoc.category_id == category_id,
                FallbackDoc.category_id == category_id,
            )

            stmt = stmt.where(category_filter).distinct()
            count_stmt = count_stmt.where(category_filter)

        total = (await self.db.execute(count_stmt)).scalar_one()

        sort_map = {
            "created_at": QAMessage.created_at,
            "confidence_score": QAMessage.confidence_score,
        }

        col = sort_map.get(sort_by, QAMessage.created_at)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            stmt.options(
                selectinload(QAMessage.linked_document).selectinload(Document.category),
                selectinload(QAMessage.linked_document).selectinload(Document.status),
                selectinload(QAMessage.source_chunks)
                .selectinload(QAMessageSourceChunk.chunk)
                .selectinload(DocumentChunk.version)
                .selectinload(DocumentVersion.document),
                selectinload(QAMessage.session).selectinload(QASession.user),
            )
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total


class QAMessageSourceChunkRepository(BaseRepository[QAMessageSourceChunk]):
    """Queries for the qa_message_source_chunks junction table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, QAMessageSourceChunk)

    async def bulk_create_source_links(
        self,
        message_id: UUID,
        chunk_ids: List[UUID],
        created_by: UUID,
    ) -> List[QAMessageSourceChunk]:
        """
        Creates multiple message-to-chunk links in one DB call.
        """
        instances = [
            QAMessageSourceChunk(
                message_id=message_id,
                chunk_id=cid,
                created_by=created_by,
            )
            for cid in chunk_ids
        ]

        return await self.create_many(instances)


class AIResponseLogRepository(BaseRepository[AIResponseLog]):
    """Queries for the ai_response_logs table."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, AIResponseLog)

    async def list_logs(
        self,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        provider: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[AIResponseLog], int]:
        """
        Lists AI response logs with optional filters.
        """
        conditions = [AIResponseLog.is_active == True]

        if status:
            conditions.append(AIResponseLog.status == status)

        if provider:
            conditions.append(
                or_(
                    AIResponseLog.ai_provider == provider,
                    AIResponseLog.model_name == provider,
                )
            )

        count_stmt = select(func.count()).select_from(AIResponseLog).where(*conditions)
        total = (await self.db.execute(count_stmt)).scalar_one()

        sort_map = {
            "created_at": AIResponseLog.created_at,
            "response_time_ms": AIResponseLog.response_time_ms,
        }

        col = sort_map.get(sort_by, AIResponseLog.created_at)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            select(AIResponseLog)
            .where(*conditions)
            .options(
                selectinload(AIResponseLog.message),
                selectinload(AIResponseLog.user),
            )
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total