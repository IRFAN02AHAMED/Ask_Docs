"""
schemas.py — Pydantic Request & Response Schemas
=================================================
Defines the shape of data coming IN (requests) and going OUT (responses).
FastAPI uses these for automatic validation and OpenAPI docs generation.

NAMING CONVENTION:
  - <Model>Create  → fields required to create a record
  - <Model>Update  → fields for partial update (all Optional)
  - <Model>Out     → fields returned to the client
  - <Model>ListOut → lightweight version for list views
"""

from datetime import datetime
from typing import Any, Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


# ─────────────────────────────────────────────────────────────────────────────
# BASE CONFIG
# ─────────────────────────────────────────────────────────────────────────────

class BaseSchema(BaseModel):
    """Base schema with ORM mode enabled so SQLAlchemy models serialize properly."""
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# AUTH SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class LoginRequest(BaseSchema):
    """Payload sent by client when logging in."""
    email:    EmailStr = Field(..., description="Registered email address")
    password: str      = Field(..., min_length=6, description="Account password")


class TokenResponse(BaseSchema):
    """Tokens returned after successful login."""
    access_token:  str = Field(..., description="Short-lived JWT access token")
    refresh_token: str = Field(..., description="Long-lived JWT refresh token")
    token_type:    str = Field(default="bearer")


class RefreshTokenRequest(BaseSchema):
    """Payload to get a new access token using a refresh token."""
    refresh_token: str = Field(..., description="Valid refresh token")


# ─────────────────────────────────────────────────────────────────────────────
# ROLE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class RoleOut(BaseSchema):
    """Role data returned to client."""
    id:          UUID
    name:        str
    description: Optional[str]
    is_active:   bool


# ─────────────────────────────────────────────────────────────────────────────
# USER SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class UserCreate(BaseSchema):
    """Fields required to register a new user."""
    name:      str      = Field(..., min_length=2, max_length=150)
    email:     EmailStr
    password:  str      = Field(..., min_length=6, max_length=128)
    role_id:   UUID

class UserUpdate(BaseSchema):
    """All fields are optional for partial update."""
    name:      Optional[str]  = Field(None, min_length=2, max_length=150)
    is_active: Optional[bool] = None
    role_id:   Optional[UUID] = None

class UserOut(BaseSchema):
    """User record returned to client (no password hash)."""
    id:         UUID
    name:       str
    email:      str
    is_active:  bool
    role:       Optional[RoleOut]
    created_at: datetime

class UserListOut(BaseSchema):
    """Lightweight user for list views."""
    id:        UUID
    name:      str
    email:     str
    is_active: bool
    role:      Optional[RoleOut]
    created_at: Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT CATEGORY SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class CategoryCreate(BaseSchema):
    name:        str           = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "description")
    @classmethod
    def validate_no_html(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if "<" in v or ">" in v:
                raise ValueError("Category name and description cannot contain HTML or script tags.")
            if not v and cls.__name__ == "CategoryCreate" and v == "":
                # We handle empty string explicitly if it's name. Actually, let pydantic min_length handle name after trim.
                pass
        return v

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        return v


class CategoryUpdate(BaseSchema):
    name:        Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active:   Optional[bool] = None

    @field_validator("name", "description")
    @classmethod
    def validate_no_html(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if "<" in v or ">" in v:
                raise ValueError("Category name and description cannot contain HTML or script tags.")
        return v

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters long.")
        return v

class CategoryOut(BaseSchema):
    id:          UUID
    name:        str
    description: Optional[str]
    is_active:   bool
    document_count: Optional[int] = 0
    created_at:  datetime


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT STATUS SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class DocumentStatusOut(BaseSchema):
    id:          UUID
    status_name: str
    is_active:   bool


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class DocumentCreate(BaseSchema):
    """Fields to create a document (file is uploaded separately via multipart)."""
    title:       str           = Field(..., min_length=2, max_length=500)
    category_id: UUID
    tags:        Optional[str] = Field(None, description="Comma-separated tags e.g. 'api,setup'")

class DocumentUpdate(BaseSchema):
    title:       Optional[str]  = Field(None, min_length=2, max_length=500)
    category_id: Optional[UUID] = None
    tags:        Optional[str]  = None
    is_active:   Optional[bool] = None

class VersionCreate(BaseSchema):
    """Metadata for uploading a new document version. File/text comes from multipart form."""
    title:         Optional[str] = Field(None, min_length=2, max_length=500)
    version_label: Optional[str] = Field(None, max_length=50)
    change_note:   Optional[str] = None

class SourceChunkOut(BaseSchema):
    chunk_id:            UUID
    chunk_text:          str
    chunk_no:            int
    document_id:         Optional[UUID] = None
    document_title:      Optional[str] = None
    file_name:           Optional[str] = None
    document_version_id: Optional[UUID] = None
    version_no:          Optional[int] = None
    version_label:       Optional[str] = None

class DocumentVersionOut(BaseSchema):
    id:            UUID
    version_no:    int
    version_label: Optional[str]
    title:         str
    file_name:     Optional[str]
    file_type:     Optional[str]
    page_count:    Optional[int]
    token_count:   Optional[int]
    summary:       Optional[str] = None
    qa_test_status:str
    qa_tested_at:  Optional[datetime]
    qa_question:   Optional[str] = None
    qa_answer:     Optional[str] = None
    qa_sources:    Optional[List[SourceChunkOut]] = []
    is_current:    bool
    status:        Optional[DocumentStatusOut]
    created_at:    datetime

class DocumentOut(BaseSchema):
    id:                 UUID
    title:              str
    tags:               Optional[str]
    current_version_no: int
    is_active:          bool
    category:           Optional[CategoryOut]
    status:             Optional[DocumentStatusOut]
    uploader:           Optional[UserListOut]
    question_count:     int = 0
    summary:            Optional[str] = None
    current_version:    Optional[DocumentVersionOut] = None
    created_at:         datetime
    updated_at:         datetime

class DocumentListOut(BaseSchema):
    id:                 UUID
    title:              str
    tags:               Optional[str]
    current_version_no: int
    is_active:          bool
    category:           Optional[CategoryOut]
    status:             Optional[DocumentStatusOut]
    question_count:     int = 0
    current_version:    Optional[DocumentVersionOut] = None
    created_at:         datetime


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT CHUNK SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class ChunkOut(BaseSchema):
    id:           UUID
    chunk_no:     int
    chunk_text:   str
    keyword_text: str
    has_embedding: Optional[bool] = None
    created_at:   datetime


# ─────────────────────────────────────────────────────────────────────────────
# PROCESSING LOG SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class ProcessingLogOut(BaseSchema):
    id:           UUID
    status:       str
    error_message: Optional[str]
    processed_at: Optional[datetime]
    created_at:   datetime


# ─────────────────────────────────────────────────────────────────────────────
# QA SESSION SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class SessionCreate(BaseSchema):
    title: str = Field(default="New Session", max_length=500)

class SessionUpdate(BaseSchema):
    title:     Optional[str]  = Field(None, max_length=500)
    is_active: Optional[bool] = None

class SessionOut(BaseSchema):
    id:         UUID
    title:      str
    is_active:  bool
    user:       Optional[UserListOut]
    created_at: datetime

class SessionListOut(BaseSchema):
    id:         UUID
    title:      str
    is_active:  bool
    created_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# QA MESSAGE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class AskQuestionRequest(BaseSchema):
    """Payload to ask the AI a question.

    Optional filters:
      - category_id: ask only from one category
      - document_ids: ask only from selected documents

    If both are empty, the system searches all published documents.
    """
    question:     str            = Field(..., min_length=5, description="User's question")
    session_id:   Optional[UUID] = Field(None, description="Existing session ID. Creates new if omitted.")
    category_id:  Optional[UUID] = Field(None, description="Ask only from one category")
    document_ids: Optional[List[UUID]] = Field(None, description="Ask only from selected documents")
    allow_unpublished: Optional[bool] = Field(False, description="Allow unpublished documents (admin only)")

class FeedbackRequest(BaseSchema):
    """Mark answer as helpful or not."""
    helpful: bool = Field(..., description="True = helpful, False = not helpful")

class ValidationRequest(BaseSchema):
    """Admin validates an AI answer."""
    validation_status: str           = Field(..., pattern="^(approved|rejected)$")
    validation_note:   Optional[str] = None


class QAMessageOut(BaseSchema):
    id:                UUID
    question:          str
    answer:            str
    helpful:           Optional[bool]
    confidence_score:  Optional[float]
    is_unanswered:     bool
    validation_status: str
    validated_at:      Optional[datetime]
    validation_note:   Optional[str]
    source_chunks:     List[SourceChunkOut] = []
    user:              Optional[UserListOut] = None
    document:          Optional[DocumentListOut] = None
    category:          Optional[CategoryOut] = None
    created_at:        datetime

class QAStatusUpdate(BaseModel):
    status: str
    question: Optional[str] = None
    answer: Optional[str] = None
    sources: Optional[List[dict]] = None

class QAMessageListOut(BaseSchema):
    id:                UUID
    question:          str
    answer:            str
    helpful:           Optional[bool]
    confidence_score:  Optional[float]
    is_unanswered:     bool
    validation_status: str
    user:              Optional[UserListOut] = None
    document:          Optional[DocumentListOut] = None
    category:          Optional[CategoryOut] = None
    source_chunks:     List[SourceChunkOut] = []
    created_at:        datetime


# ─────────────────────────────────────────────────────────────────────────────
# AI LOG SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class AILogOut(BaseSchema):
    id:               UUID
    ai_provider:      str
    model_name:       str
    status:           str
    response_time_ms: Optional[int]
    input_tokens:     Optional[int]
    output_tokens:    Optional[int]
    total_tokens:     Optional[int]
    confidence_score: Optional[float]
    error_message:    Optional[str]
    created_at:       datetime
    user:             Optional[UserListOut] = None
    question:         Optional[str] = None
    answer:           Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class DashboardStats(BaseSchema):
    total_documents:     int
    total_questions:     int
    helpful_answers:     int
    unanswered_sessions: int
    total_chunks:        int
    total_users:         int


# ─────────────────────────────────────────────────────────────────────────────
# PAGINATION QUERY PARAMS
# ─────────────────────────────────────────────────────────────────────────────

class PaginationParams(BaseSchema):
    """
    Reusable query parameters for all list endpoints.
    FastAPI can inject these from query string automatically.
    """
    page:       int = Field(default=1, ge=1, description="Page number (starts at 1)")
    page_size:  int = Field(default=10, ge=1, le=100, description="Records per page")
    search:     Optional[str] = Field(None, description="Full-text search keyword")
    sort_by:    Optional[str] = Field(None, description="Column name to sort by")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")



class AIParsedResponse(BaseModel):

    answer: str = ""

    sources: List[Any] = Field(default_factory=list) #If sources is not given, create a new empty list automatically.

    confidence_score: float = 0.5

    follow_up_questions: List[str] = Field(default_factory=list)

    has_answer: bool = True



class AIAnswerFromChunksResponse(BaseModel):

    answer: str

    sources: list[Any] = Field(default_factory=list)

    confidence_score: float = 0.0

    follow_up_questions: list[str] = Field(default_factory=list)

    has_answer: bool = True

    retrieved_chunks: list[dict] = Field(default_factory=list)

    prompt_text: str

    raw_response: Optional[str] = None