"""
models.py — SQLAlchemy ORM Models
===================================
Defines all database tables as Python classes.
Each class = one PostgreSQL table.
Each class attribute = one column.

These models are imported by:
  - Repositories (for queries)
  - Migration script (for table creation)
  - Seeder (for inserting seed data)

IMPORTANT: Never write business logic in models.
           Models only describe table structure.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric,
    String, Text, UniqueConstraint, CheckConstraint, text, inspect
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.core.config import settings
from app.core.database import Base


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: current UTC timestamp
# ─────────────────────────────────────────────────────────────────────────────

def _now() -> datetime:
    """Returns current UTC datetime. Used as column default."""
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# ROLES
# ─────────────────────────────────────────────────────────────────────────────

class Role(Base):
    """
    Stores user roles: admin,  viewer.
    Seeded once at startup — not user-editable via API.
    """
    __tablename__ = "roles"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name:        Mapped[str]       = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active:   Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    updated_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Relationship — back reference from User
    users: Mapped[List["User"]] = relationship("User", back_populates="role", lazy="selectin")


# ─────────────────────────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────────────────────────

class User(Base):
    """
    Application users. Password is stored as a bcrypt hash.
    role_id is a FK to the roles table.
    """
    __tablename__ = "users"

    id:            Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name:          Mapped[str]       = mapped_column(String(150), nullable=False)
    email:         Mapped[str]       = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str]       = mapped_column(String(255), nullable=False)
    role_id:       Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    is_active:     Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:    Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:    Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at:    Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:    Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users", lazy="selectin")
    documents:         Mapped[List["Document"]]   = relationship("Document", foreign_keys="Document.uploaded_by", back_populates="uploader", lazy="noload")
    qa_sessions:       Mapped[List["QASession"]]  = relationship("QASession", foreign_keys="QASession.user_id", back_populates="user", lazy="noload")
    ai_response_logs:  Mapped[List["AIResponseLog"]] = relationship("AIResponseLog", foreign_keys="AIResponseLog.user_id", back_populates="user", lazy="noload")


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT STATUSES
# ─────────────────────────────────────────────────────────────────────────────

class DocumentStatus(Base):
    """
    Lookup table for document statuses:
    pending | processing | processed | published | failed | archived
    Seeded at startup.
    """
    __tablename__ = "document_statuses"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_name: Mapped[str]       = mapped_column(String(50), nullable=False, unique=True)
    is_active:   Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    documents:         Mapped[List["Document"]]        = relationship("Document", back_populates="status", lazy="noload")
    document_versions: Mapped[List["DocumentVersion"]] = relationship("DocumentVersion", back_populates="status", lazy="noload")


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT CATEGORIES
# ─────────────────────────────────────────────────────────────────────────────

class DocumentCategory(Base):
    """
    Categories for grouping documents:
    e.g. Setup Guide, API Guide, User Manual, FAQ ...
    """
    __tablename__ = "document_categories"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name:        Mapped[str]       = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active:   Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="category", lazy="noload")


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS
# ─────────────────────────────────────────────────────────────────────────────

class Document(Base):
    """
    Main document record. Stores document identity and metadata.
    Actual file content is stored in document_versions.
    """
    __tablename__ = "documents"

    id:                 Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title:              Mapped[str]       = mapped_column(String(500), nullable=False)
    category_id:        Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_categories.id"), nullable=False)
    tags:               Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # comma-separated
    uploaded_by:        Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status_id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_statuses.id"), nullable=False)
    current_version_no: Mapped[int]       = mapped_column(Integer, nullable=False, default=1)
    is_active:          Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:         Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at:         Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:         Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    category:  Mapped["DocumentCategory"] = relationship("DocumentCategory", back_populates="documents", lazy="selectin")
    status:    Mapped["DocumentStatus"]   = relationship("DocumentStatus", back_populates="documents", lazy="selectin")
    uploader:  Mapped["User"]             = relationship("User", foreign_keys=[uploaded_by], back_populates="documents", lazy="selectin")
    versions:  Mapped[List["DocumentVersion"]] = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan", lazy="selectin")
    qa_messages: Mapped[List["QAMessage"]] = relationship("QAMessage", back_populates="linked_document", lazy="noload")

    @property
    def current_version(self):
        """
        Returns the current document version only if versions are already loaded.

        Important:
        In async SQLAlchemy, Pydantic must not trigger lazy loading.
        If versions are not loaded, return None instead of causing MissingGreenlet.
        """
        state = inspect(self)

        if "versions" in state.unloaded:
            return None

        for v in self.versions:
            if v.is_current:
                return v

        return None


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT VERSIONS
# ─────────────────────────────────────────────────────────────────────────────

class DocumentVersion(Base):
    """
    Stores each uploaded version of a document.
    A document can have multiple versions (v1, v2, ...).
    Only one version is current at a time (is_current=True).
    """
    __tablename__ = "document_versions"
    __table_args__ = (
        UniqueConstraint("document_id", "version_no", name="uq_doc_version_no"),
        CheckConstraint("version_no > 0", name="ck_version_no_positive"),
    )

    id:            Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id:   Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_no:    Mapped[int]       = mapped_column(Integer, nullable=False)
    version_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    title:         Mapped[str]       = mapped_column(String(500), nullable=False)
    content_text:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_name:     Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_type:     Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    file_path:     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    change_note:   Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_current:    Mapped[bool]      = mapped_column(Boolean, nullable=False, default=False)
    status_id:     Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_statuses.id"), nullable=False)
    page_count:    Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    token_count:   Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    summary:       Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qa_test_status:Mapped[str]       = mapped_column(String(50), nullable=False, default="not_tested")
    qa_tested_at:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    qa_tested_by:  Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    qa_question:   Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qa_answer:     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qa_sources_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active:     Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:    Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:    Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at:    Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:    Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    document: Mapped["Document"]          = relationship("Document", back_populates="versions", lazy="selectin")
    status:   Mapped["DocumentStatus"]    = relationship("DocumentStatus", back_populates="document_versions", lazy="selectin")
    chunks:   Mapped[List["DocumentChunk"]] = relationship("DocumentChunk", back_populates="version", cascade="all, delete-orphan", lazy="noload")
    processing_logs: Mapped[List["DocumentProcessingLog"]] = relationship("DocumentProcessingLog", back_populates="document_version", cascade="all, delete-orphan", lazy="noload")

    @property
    def qa_sources(self) -> List[dict]:
        import json
        if self.qa_sources_json:
            try:
                return json.loads(self.qa_sources_json)
            except Exception:
                return []
        return []


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT CHUNKS
# ─────────────────────────────────────────────────────────────────────────────

class DocumentChunk(Base):
    """
    Stores text chunks extracted from a document version.

    The embedding is stored directly in PostgreSQL using pgvector.
    Because we use Google text-embedding-004, the vector size is 768.
    """
    __tablename__ = "document_chunks"
    __table_args__ = (
        UniqueConstraint("document_version_id", "chunk_no", name="uq_chunk_version_no"),
        CheckConstraint("chunk_no > 0", name="ck_chunk_no_positive"),
    )

    id:                  Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    chunk_no:            Mapped[int]       = mapped_column(Integer, nullable=False)
    chunk_text:          Mapped[str]       = mapped_column(Text, nullable=False)
    keyword_text:        Mapped[str]       = mapped_column(Text, nullable=False, default="")
    embedding:           Mapped[Optional[List[float]]] = mapped_column(Vector(settings.EMBEDDING_DIMENSIONS), nullable=True)
    is_active:           Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:          Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at:          Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:          Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    version:       Mapped["DocumentVersion"]   = relationship("DocumentVersion", back_populates="chunks", lazy="selectin")
    source_usages: Mapped[List["QAMessageSourceChunk"]] = relationship("QAMessageSourceChunk", back_populates="chunk", lazy="noload")

    @property
    def has_embedding(self) -> bool:
        return self.embedding is not None and len(self.embedding) > 0


# ─────────────────────────────────────────────────────────────────────────────
# QA SESSIONS
# ─────────────────────────────────────────────────────────────────────────────

class QASession(Base):
    """
    One chat session per user per topic.
    A user can have many sessions, each with many messages.
    """
    __tablename__ = "qa_sessions"

    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:    Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title:      Mapped[str]       = mapped_column(String(500), nullable=False, default="New Session")
    is_active:  Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    user:     Mapped["User"]           = relationship("User", foreign_keys=[user_id], back_populates="qa_sessions", lazy="selectin")
    messages: Mapped[List["QAMessage"]] = relationship("QAMessage", back_populates="session", cascade="all, delete-orphan", lazy="noload")


# ─────────────────────────────────────────────────────────────────────────────
# QA MESSAGES
# ─────────────────────────────────────────────────────────────────────────────

class QAMessage(Base):
    """
    Stores one question + AI answer pair inside a QA session.
    Also stores user feedback (helpful/not helpful) and admin validation.
    """
    __tablename__ = "qa_messages"
    __table_args__ = (
        CheckConstraint(
            "validation_status IN ('pending','approved','rejected')",
            name="ck_validation_status"
        ),
    )

    id:                Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id:        Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("qa_sessions.id", ondelete="CASCADE"), nullable=False)
    document_id:       Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    question:          Mapped[str]       = mapped_column(Text, nullable=False)
    answer:            Mapped[str]       = mapped_column(Text, nullable=False)
    helpful:           Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    confidence_score:  Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    is_unanswered:     Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    validation_status: Mapped[str]       = mapped_column(String(20), nullable=False, default="pending")
    validated_by:      Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at:      Mapped[Optional[datetime]]  = mapped_column(DateTime(timezone=True), nullable=True)
    validation_note:   Mapped[Optional[str]]       = mapped_column(Text, nullable=True)
    is_active:         Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:        Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:        Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at:        Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:        Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    session:         Mapped["QASession"]  = relationship("QASession", back_populates="messages", lazy="selectin")
    linked_document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[document_id], back_populates="qa_messages", lazy="selectin")
    source_chunks:   Mapped[List["QAMessageSourceChunk"]] = relationship("QAMessageSourceChunk", back_populates="message", cascade="all, delete-orphan", lazy="selectin")
    ai_logs:         Mapped[List["AIResponseLog"]]        = relationship("AIResponseLog", back_populates="message", lazy="noload")

    @property
    def user(self):
        return self.session.user if self.session else None

    @property
    def document(self):
        if self.linked_document:
            return self.linked_document
        if self.source_chunks and len(self.source_chunks) > 0:
            return self.source_chunks[0].chunk.version.document
        return None

    @property
    def category(self):
        if self.document:
            return self.document.category
        return None


# ─────────────────────────────────────────────────────────────────────────────
# QA MESSAGE SOURCE CHUNKS (junction table)
# ─────────────────────────────────────────────────────────────────────────────

class QAMessageSourceChunk(Base):
    """
    Junction table: links each AI answer to the document chunks that were used.
    One answer can cite multiple chunks; one chunk can appear in many answers.
    """
    __tablename__ = "qa_message_source_chunks"
    __table_args__ = (
        UniqueConstraint("message_id", "chunk_id", name="uq_msg_src_chunk"),
    )

    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("qa_messages.id", ondelete="CASCADE"), nullable=False)
    chunk_id:   Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_chunks.id"), nullable=False)
    is_active:  Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    message: Mapped["QAMessage"]     = relationship("QAMessage", back_populates="source_chunks", lazy="selectin")
    chunk:   Mapped["DocumentChunk"] = relationship("DocumentChunk", back_populates="source_usages", lazy="selectin")

    @property
    def chunk_text(self) -> str:
        """Allows Pydantic SourceChunkOut to read the cited chunk text."""
        return self.chunk.chunk_text if self.chunk else ""

    @property
    def chunk_no(self) -> int:
        """Allows Pydantic SourceChunkOut to read the cited chunk number."""
        return self.chunk.chunk_no if self.chunk else 0

    @property
    def document_id(self) -> Optional[uuid.UUID]:
        """Parent document ID for the source chunk."""
        if self.chunk and self.chunk.version and self.chunk.version.document:
            return self.chunk.version.document.id
        return None

    @property
    def document_title(self) -> Optional[str]:
        """Parent document title for displaying source references."""
        if self.chunk and self.chunk.version and self.chunk.version.document:
            return self.chunk.version.document.title
        return None

    @property
    def document_version_id(self) -> Optional[uuid.UUID]:
        """Document version ID that produced this chunk."""
        if self.chunk and self.chunk.version:
            return self.chunk.version.id
        return None

    @property
    def version_no(self) -> Optional[int]:
        """Document version number that produced this chunk."""
        if self.chunk and self.chunk.version:
            return self.chunk.version.version_no
        return None

    @property
    def version_label(self) -> Optional[str]:
        """Human-friendly version label, for example v1.0."""
        if self.chunk and self.chunk.version:
            return self.chunk.version.version_label
        return None

    @property
    def file_name(self) -> Optional[str]:
        """Original file name of the document version."""
        if self.chunk and self.chunk.version:
            return self.chunk.version.file_name
        return None


# ─────────────────────────────────────────────────────────────────────────────
# AI RESPONSE LOGS
# ─────────────────────────────────────────────────────────────────────────────

class AIResponseLog(Base):
    """
    Logs every AI API call — whether it succeeded or failed.
    Used for monitoring, debugging, and token usage tracking.
    message_id is nullable because the AI call might fail before the message is saved.
    """
    __tablename__ = "ai_response_logs"
    __table_args__ = (
        CheckConstraint("status IN ('success','failed')", name="ck_ai_log_status"),
    )

    id:               Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id:       Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("qa_messages.id", ondelete="SET NULL"), nullable=True)
    user_id:          Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ai_provider:      Mapped[str]        = mapped_column(String(100), nullable=False)
    model_name:       Mapped[str]        = mapped_column(String(150), nullable=False)
    prompt_text:      Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_text:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status:           Mapped[str]        = mapped_column(String(20), nullable=False)
    error_message:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    input_tokens:     Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    output_tokens:    Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_tokens:     Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    is_active:        Mapped[bool]       = mapped_column(Boolean, nullable=False, default=True)
    created_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:       Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:       Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    message: Mapped[Optional["QAMessage"]] = relationship("QAMessage", back_populates="ai_logs", lazy="selectin")
    user:    Mapped["User"]                = relationship("User", foreign_keys=[user_id], back_populates="ai_response_logs", lazy="selectin")

    @property
    def question(self):
        return self.message.question if self.message else None

    @property
    def answer(self):
        return self.message.answer if self.message else None


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT PROCESSING LOGS
# ─────────────────────────────────────────────────────────────────────────────

class DocumentProcessingLog(Base):
    """
    Records the processing lifecycle of a document version:
    queued → processing → success | failed

    One version can have multiple log entries (retry scenario).
    """
    __tablename__ = "document_processing_logs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued','processing','success','failed')",
            name="ck_proc_log_status"
        ),
    )

    id:                  Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    status:              Mapped[str]       = mapped_column(String(20), nullable=False)
    error_message:       Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processed_at:        Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active:           Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    created_at:          Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    created_by:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at:          Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
    updated_by:          Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    document_version: Mapped["DocumentVersion"] = relationship("DocumentVersion", back_populates="processing_logs", lazy="selectin")
