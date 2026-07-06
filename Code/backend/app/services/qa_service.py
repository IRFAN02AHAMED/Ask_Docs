"""
qa_service.py — Q&A Business Logic
=====================================
Handles:
  - Asking questions (orchestrates AI agent + DB persistence)
  - Session management (create/list sessions)
  - Feedback (mark answer helpful/not helpful)
  - Admin validation of answers
  - Q&A history listing

RULES:
  - Calls Repository for DB operations
  - Uses PostgreSQL pgvector for retrieval and ai_agent for generation
  - No direct DB queries
  - No HTTP concerns
"""

import time
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logger import logger
from app.models.models import (
    QASession, QAMessage, QAMessageSourceChunk, AIResponseLog
)
from app.repositories.qa_repository import (
    QASessionRepository, QAMessageRepository,
    QAMessageSourceChunkRepository, AIResponseLogRepository,
)
from app.repositories.document_repository import DocumentChunkRepository
from app.schemas.schemas import (
    AskQuestionRequest, FeedbackRequest, ValidationRequest, SessionCreate
)
from app.ai import ai_agent


class QAService:
    """
    Orchestrates the complete Q&A workflow:
      1. Resolve or create a session
      2. Create a question embedding using Google text-embedding-004
      3. Retrieve similar chunks from PostgreSQL pgvector
      4. Ask Gemini 2.5 Flash to answer using those chunks
      5. Save the message, source links, and AI log

    All DB access goes through repositories.
    All AI calls go through ai_agent module.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: Injected async database session.
        """
        self._db           = db
        self._session_repo = QASessionRepository(db)
        self._message_repo = QAMessageRepository(db)
        self._src_repo     = QAMessageSourceChunkRepository(db)
        self._ai_log_repo  = AIResponseLogRepository(db)
        self._chunk_repo   = DocumentChunkRepository(db)

    # ─────────────────────────────────────────────────────────────────────────
    # SESSION MANAGEMENT
    # ─────────────────────────────────────────────────────────────────────────

    async def create_session(self, data: SessionCreate, user_id: UUID) -> QASession:
        """
        Creates a new Q&A chat session for a user.

        Args:
            data:    SessionCreate with optional title.
            user_id: UUID of the session owner.

        Returns:
            Created QASession ORM instance.
        """
        logger.info(f"[QAService] Creating session for user: {user_id}")
        session = QASession(
            user_id=    user_id,
            title=      data.title,
            created_by= user_id,
        )
        return await self._session_repo.create(session)

    async def list_sessions(
        self,
        user_id: UUID,
        page: int,
        page_size: int,
        search: Optional[str],
        sort_by: str,
        sort_order: str,
    ) -> tuple[List[QASession], int]:
        """
        Returns paginated list of a user's Q&A sessions.

        Args:
            user_id:    UUID of the user (only their sessions).
            page:       Page number.
            page_size:  Records per page.
            search:     Partial match on session title.
            sort_by:    Column name.
            sort_order: 'asc' or 'desc'.

        Returns:
            (list_of_sessions, total_count)
        """
        return await self._session_repo.list_sessions_by_user(
            user_id, page, page_size, search, sort_by, sort_order
        )

    async def get_session(self, session_id: UUID, user_id: UUID) -> QASession:
        """
        Fetches a single session, enforcing ownership (users can only see their own).

        Args:
            session_id: UUID of the QASession.
            user_id:    UUID of the requesting user.

        Returns:
            QASession ORM instance.

        Raises:
            HTTPException 404: If session not found.
            HTTPException 403: If session belongs to another user.
        """
        session = await self._session_repo.get_session_with_user(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
        if session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this session.",
            )
        return session

    async def delete_session(self, session_id: UUID, user_id: UUID) -> QASession:
        """Soft-deletes a session after confirming ownership."""
        session = await self.get_session(session_id, user_id)
        return await self._session_repo.soft_delete(session)

    # ─────────────────────────────────────────────────────────────────────────
    # ASK A QUESTION — MAIN Q&A FLOW
    # ─────────────────────────────────────────────────────────────────────────

    async def ask_question(
        self,
        request: AskQuestionRequest,
        user_id: UUID,
        allow_unpublished: bool = False,
    ) -> QAMessage:
        """
        Full Q&A pipeline:
          1. Resolve session (use existing or create new)
          2. Generate a question embedding with Google text-embedding-004
          3. Search PostgreSQL pgvector for similar document chunks
          4. Ask Gemini 2.5 Flash to answer using only those chunks
          5. Save QAMessage to PostgreSQL
          6. Save QAMessageSourceChunk links for the retrieved sources
          7. Save AIResponseLog for monitoring
          8. Return the saved QAMessage

        Args:
            request: AskQuestionRequest with question and optional session_id.
            user_id: UUID of the asking user.

        Returns:
            Created QAMessage ORM instance with source chunks loaded.

        Raises:
            HTTPException 500: If AI call or DB save fails.
        """
        logger.info(f"[QAService] ask_question from user {user_id}: '{request.question[:80]}'")

        # Step 1.1: Validation when document_ids are provided (role-aware document ask validation)
        if request.document_ids:
            from app.models.models import Document, DocumentVersion, DocumentChunk, DocumentStatus
            from sqlalchemy import select, func
            
            allowed_statuses = ["published"]
            if allow_unpublished:
                allowed_statuses = ["processed", "published"]
                
            for doc_id in request.document_ids:
                doc_stmt = select(Document).where(Document.id == doc_id, Document.is_active == True)
                doc_res = (await self._db.execute(doc_stmt)).scalar_one_or_none()
                if not doc_res:
                    raise HTTPException(status_code=400, detail="Selected document does not exist.")
                
                status_stmt = select(DocumentStatus).where(DocumentStatus.id == doc_res.status_id)
                status_res = (await self._db.execute(status_stmt)).scalar_one_or_none()
                status_name = status_res.status_name if status_res else ""
                
                if status_name not in allowed_statuses:
                    raise HTTPException(status_code=400, detail="Please process or publish this document before asking questions.")
                
                ver_stmt = select(DocumentVersion).where(
                    DocumentVersion.document_id == doc_id,
                    DocumentVersion.is_current == True,
                    DocumentVersion.is_active == True
                )
                ver_res = (await self._db.execute(ver_stmt)).scalar_one_or_none()
                if not ver_res:
                    raise HTTPException(status_code=400, detail="Current version of the document not found.")
                
                chunk_stmt = select(func.count(DocumentChunk.id)).where(
                    DocumentChunk.document_version_id == ver_res.id,
                    DocumentChunk.is_active == True,
                    DocumentChunk.embedding.is_not(None)
                )
                chunk_count = (await self._db.execute(chunk_stmt)).scalar()
                if not chunk_count or chunk_count == 0:
                    raise HTTPException(status_code=400, detail="Please process or publish this document before asking questions. No valid text chunks found.")

        # Step 1.2: Resolve or create session
        if request.session_id:
            session = await self.get_session(request.session_id, user_id)
        else:
            session = await self.create_session(
                SessionCreate(title=request.question[:100]),
                user_id,
            )

        # Step 2: Generate embedding, retrieve chunks, and call Gemini
        start_ms = int(time.time() * 1000)
        ai_result = None
        ai_error  = None
        retrieved_chunks = []

        try:
            question_embedding = await ai_agent.generate_query_embedding(request.question)

            allowed_statuses = ["published"]
            if allow_unpublished:
                allowed_statuses = ["processed", "published"]

            logger.info(
                f"[QAService Debug] BEFORE RETRIEVAL - Question: '{request.question}', "
                f"user_id: {user_id}, document_ids: {request.document_ids}, "
                f"category_id: {request.category_id}, allow_unpublished: {allow_unpublished}, "
                f"allowed_statuses: {allowed_statuses}"
            )

            retrieved_chunks = await self._chunk_repo.search_similar_chunks(
                question_embedding,
                limit=settings.VECTOR_SEARCH_TOP_K,
                category_id=request.category_id,
                document_ids=request.document_ids,
                allowed_statuses=allowed_statuses,
            )

            logger.info(f"[QAService Debug] AFTER RETRIEVAL - Chunks count: {len(retrieved_chunks)}")
            for idx, chunk in enumerate(retrieved_chunks):
                doc_title = chunk.version.document.title if chunk.version and chunk.version.document else "Unknown"
                page_no = getattr(chunk, "page_no", None) or chunk.chunk_no
                logger.info(
                    f"  Chunk {idx + 1}: ID={chunk.id}, Doc='{doc_title}', Page/Chunk={page_no}"
                )

            if not retrieved_chunks:
                logger.warning(
                    f"[QAService Debug] No chunks retrieved. Check document status, embeddings, "
                    f"document_ids: {request.document_ids}, and allowed_statuses: {allowed_statuses}."
                )

            # If no published/allowed chunks are found, save this as unanswered.
            if not retrieved_chunks:
                fallback_msg = (
                    "I could not find enough information in this document to answer your question."
                    if request.document_ids
                    else "I could not find enough information in the published knowledge base to answer this question."
                )
                ai_result = {
                    "answer": fallback_msg,
                    "confidence_score": 0.0,
                    "prompt_text": request.question,
                    "raw_response": None,
                }
            else:
                context_chunks = self._format_chunks_for_ai(retrieved_chunks)
                ai_result = await ai_agent.answer_question_from_chunks(
                    request.question,
                    context_chunks,
                )
        except Exception as exc:
            logger.error(f"[QAService] AI call failed: {exc}", exc_info=True)
            ai_error = str(exc)

        end_ms        = int(time.time() * 1000)
        response_time = end_ms - start_ms

        # If AI failed entirely, we still log and return a graceful error
        if ai_error or not ai_result:
            await self._log_ai_call(
                message_id=    None,
                user_id=       user_id,
                prompt_text=   request.question,
                response_text= None,
                status=        "failed",
                error_message= ai_error,
                response_time= response_time,
            )
            raise HTTPException(
                status_code=500,
                detail=f"AI service is unavailable. Please try again later. ({ai_error})",
            )

        answer_text = ai_result.get("answer", "")
        confidence  = ai_result.get("confidence_score", 0.0)

        # Step 3: Save QAMessage
        is_unanswered = (not retrieved_chunks) or (float(confidence or 0) < 0.50)
        selected_document_id = request.document_ids[0] if request.document_ids else None
        
        message = QAMessage(
            session_id=        session.id,
            document_id=       selected_document_id,
            question=          request.question,
            answer=            answer_text,
            confidence_score=  confidence,
            is_unanswered=     is_unanswered,
            created_by=        user_id,
        )
        message = await self._message_repo.create(message)

        # Step 4: Save the PostgreSQL chunks that were used as sources
        # If the question was unanswered (low confidence or no chunks), do not save chunks as they weren't used to form an answer.
        pg_chunk_ids = [chunk.id for chunk in retrieved_chunks]
        if pg_chunk_ids and not is_unanswered:
            await self._src_repo.bulk_create_source_links(message.id, pg_chunk_ids, user_id)

        # Step 5: Log the AI API call
        await self._log_ai_call(
            message_id=    message.id,
            user_id=       user_id,
            prompt_text=   ai_result.get("prompt_text"),
            response_text= ai_result.get("raw_response"),
            status=        "success",
            error_message= None,
            response_time= response_time,
            confidence=    confidence,
        )

        # Step 6: Reload message with source chunks for response
        self._db.expunge(message)
        saved_message = await self._message_repo.get_message_with_sources(message.id)
        logger.info(f"[QAService] Q&A complete. message_id={message.id}")
        return saved_message

    def _format_chunks_for_ai(self, chunks: List) -> List[dict]:
        """
        Converts DocumentChunk ORM rows into simple dictionaries for the prompt.

        Keeping this small helper here makes it clear that PostgreSQL is the
        source of the retrieved chunks; PostgreSQL pgvector handles vector search.
        """
        formatted = []
        for chunk in chunks:
            document_title = "Unknown Document"
            if chunk.version and chunk.version.document:
                document_title = chunk.version.document.title

            formatted.append({
                "chunk_id": str(chunk.id),
                "document_title": document_title,
                "chunk_no": chunk.chunk_no,
                "chunk_text": chunk.chunk_text,
            })
        return formatted

    async def _log_ai_call(
        self,
        message_id: Optional[UUID],
        user_id: UUID,
        prompt_text: Optional[str],
        response_text: Optional[str],
        status: str,
        error_message: Optional[str],
        response_time: int,
        confidence: Optional[float] = None,
    ) -> None:
        """
        Saves an AI API call record to the ai_response_logs table.

        Args:
            message_id:    UUID of the QAMessage (nullable if AI failed before save).
            user_id:       UUID of the user who triggered the call.
            prompt_text:   Full prompt sent to Gemini.
            response_text: Raw text response from Gemini.
            status:        'success' or 'failed'.
            error_message: Error string if status is 'failed'.
            response_time: Response time in milliseconds.
            confidence:    Optional confidence score from AI.
        """
        log = AIResponseLog(
            message_id=       message_id,
            user_id=          user_id,
            ai_provider=      "Google",
            model_name=       settings.GEMINI_MODEL,
            prompt_text=      prompt_text,
            response_text=    response_text,
            status=           status,
            error_message=    error_message,
            response_time_ms= response_time,
            confidence_score= confidence,
            created_by=       user_id,
        )
        await self._ai_log_repo.create(log)

    # ─────────────────────────────────────────────────────────────────────────
    # MESSAGE ACTIONS
    # ─────────────────────────────────────────────────────────────────────────

    async def list_messages(
        self,
        session_id: UUID,
        user_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[List[QAMessage], int]:
        """
        Lists messages in a session (enforces ownership).

        Args:
            session_id: UUID of the QASession.
            user_id:    UUID of the requesting user.
            page:       Page number.
            page_size:  Records per page.

        Returns:
            (list_of_messages, total_count)
        """
        await self.get_session(session_id, user_id)   # ownership check
        return await self._message_repo.list_messages_by_session(session_id, page, page_size)

    async def get_message(self, message_id: UUID) -> QAMessage:
        """Fetches a single QAMessage with its source chunks."""
        msg = await self._message_repo.get_message_with_sources(message_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found.")
        return msg

    async def submit_feedback(
        self, message_id: UUID, feedback: FeedbackRequest, user_id: UUID
    ) -> QAMessage:
        """
        Records the user's feedback (helpful / not helpful) on an AI answer.

        Args:
            message_id: UUID of the QAMessage to rate.
            feedback:   FeedbackRequest with helpful=True|False.
            user_id:    UUID of the user submitting feedback.

        Returns:
            Updated QAMessage.
        """
        msg = await self.get_message(message_id)
        return await self._message_repo.update(msg, {
            "helpful":    feedback.helpful,
            "updated_by": user_id,
        })

    async def validate_message(
        self, message_id: UUID, data: ValidationRequest, admin_id: UUID
    ) -> QAMessage:
        """
        Admin validates (approves or rejects) an AI-generated answer.

        Args:
            message_id: UUID of the QAMessage.
            data:       ValidationRequest with status and optional note.
            admin_id:   UUID of the admin performing validation.

        Returns:
            Updated QAMessage with validation fields set.
        """
        msg = await self.get_message(message_id)
        return await self._message_repo.update(msg, {
            "validation_status": data.validation_status,
            "validation_note":   data.validation_note,
            "validated_by":      admin_id,
            "validated_at":      datetime.now(timezone.utc),
            "updated_by":        admin_id,
        })

    async def list_all_messages(
        self, page, page_size, search, helpful, validation_status, document_id, category_id, user_id, sort_by, sort_order
    ) -> tuple[List[QAMessage], int]:
        """Admin view — all messages."""
        return await self._message_repo.list_all_messages(
            page, page_size, search, helpful, validation_status, document_id, category_id, user_id, sort_by, sort_order
        )

    async def list_unanswered_messages(
        self, page, page_size, search, category_id=None, user_id=None, sort_by="created_at", sort_order="desc"
    ) -> tuple[List[QAMessage], int]:
        """admin view — questions that need document improvement or manual review."""
        return await self._message_repo.list_unanswered_messages(
            page, page_size, search, category_id, user_id, sort_by, sort_order
        )

    async def list_ai_logs(
        self, page, page_size, status_filter, provider_filter, sort_by, sort_order
    ) -> tuple[List[AIResponseLog], int]:
        """Lists AI response logs (admin monitoring)."""
        return await self._ai_log_repo.list_logs(page, page_size, status_filter, provider_filter, sort_by, sort_order)


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class DashboardService:
    """
    Aggregates statistics for the admin Knowledge Base dashboard.
    Calls multiple repositories to gather counts.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db           = db
        self._message_repo = QAMessageRepository(db)

    async def get_stats(self) -> dict:
        """
        Returns aggregated dashboard statistics.

        Returns:
            Dict with:
              total_documents, total_questions, helpful_answers,
              unanswered_sessions, total_chunks, total_users
        """
        from app.repositories.document_repository import DocumentRepository, DocumentChunkRepository
        from app.repositories.user_repository import UserRepository

        doc_repo   = DocumentRepository(self._db)
        chunk_repo = DocumentChunkRepository(self._db)
        user_repo  = UserRepository(self._db)

        total_docs      = await doc_repo.count_active()
        total_questions = await self._message_repo.count_active()
        helpful         = await self._message_repo.count_helpful()
        unanswered      = await self._message_repo.count_unanswered()
        total_chunks    = await chunk_repo.count_active()
        total_users     = await user_repo.count_active()

        return {
            "total_documents":     total_docs,
            "total_questions":     total_questions,
            "helpful_answers":     helpful,
            "unanswered_sessions": unanswered,
            "total_chunks":        total_chunks,
            "total_users":         total_users,
        }
