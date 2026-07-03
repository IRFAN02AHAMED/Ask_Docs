# AI Knowledge Base Q&A System — Backend

A production-structured FastAPI backend for an AI-powered document knowledge base.
Users upload documents; AI answers questions using those documents with source references.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI (async) |
| Database | PostgreSQL + SQLAlchemy 2.0 (async) |
| AI LLM | Google Gemini 2.5 Flash |
| Embeddings | Google text-embedding-004 |
| Vector Search | PostgreSQL pgvector |
| Authentication | JWT (access + refresh tokens) + bcrypt |
| File Parsing | pypdf, python-docx |

---

## Project Structure

```
ai_kb_backend/
├── main.py                         # Entry point — uvicorn run
├── requirements.txt
├── .env.example                    # Copy to .env and fill values
│
└── app/
    ├── main.py                     # FastAPI app + lifespan
    ├── migration.py                # Auto DB migration (create_all)
    ├── seeder.py                   # Master data seeder
    │
    ├── core/
    │   ├── config.py               # Settings from .env (pydantic-settings)
    │   ├── database.py             # Async engine + session + get_db dependency
    │   ├── security.py             # JWT + bcrypt + role-based auth dependencies
    │   └── logger.py               # File + terminal logger
    │
    ├── models/
    │   └── models.py               # All SQLAlchemy ORM models
    │
    ├── schemas/
    │   └── schemas.py              # All Pydantic request/response schemas
    │
    ├── repositories/
    │   ├── base_repository.py      # Generic CRUD + pagination
    │   ├── user_repository.py      # User queries
    │   ├── document_repository.py  # Document, version, chunk, category queries
    │   └── qa_repository.py        # Session, message, AI log queries
    │
    ├── ai/
    │   ├── ai_agent.py             # Gemini answer + embedding helper
    │   └── prompts/
    │       ├── system_prompt.py    # AI personality + rules
    │       ├── assistant_prompt.py # Q&A prompt template
    │       └── validation_prompt.py# Answer validation + evaluation prompts
    │
    ├── services/
    │   ├── auth_service.py         # Login, register, token refresh
    │   ├── document_service.py     # Upload, chunk, embed, process
    │   └── qa_service.py           # Ask question, feedback, dashboard stats
    │
    ├── routers/
    │   ├── auth_router.py          # /api/v1/auth/*
    │   ├── document_router.py      # /api/v1/documents/*, /categories/*, /statuses
    │   ├── qa_router.py            # /api/v1/qa/*
    │   ├── dashboard_router.py     # /api/v1/dashboard
    │   └── user_router.py          # /api/v1/users/*
    │
    ├── middleware/
    │   ├── exception_handler.py    # Global error → standard response envelope
    │   └── request_logger.py       # Log every request + response time
    │
    └── utils/
        └── response.py             # ResponseBuilder — uniform API responses
```

---

## API Response Format

Every endpoint returns the same envelope:

```json
{
  "success": true,
  "status_code": 200,
  "message": "Request completed successfully.",
  "data": {},
  "timestamp": "2025-01-01T12:00:00Z"
}
```

Paginated list responses include:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "page_size": 10,
      "total_pages": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## Setup Instructions

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 2. Create PostgreSQL Database

```sql
CREATE DATABASE ai_kb_db;
```

### 3. Clone & Install

```bash
cd ai_kb_backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DB credentials and Gemini API key
```

### 5. Run the Application

```bash
python main.py
# OR for development with auto-reload:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On first startup:
- All database tables are created automatically
- Seed data is inserted (roles, statuses, categories, admin user)
- PostgreSQL pgvector is used for semantic search

### 6. Access API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc

---

## Default Admin Credentials

```
Email:    admin@kbsystem.com
Password: Admin@1234
```

**Change this immediately in production!**

---

## Key API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login → get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/register` | Register user (admin only) |
| GET | `/api/v1/auth/me` | Current user profile |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/documents` | Upload document (multipart) |
| GET | `/api/v1/documents` | List documents (paginated) |
| POST | `/api/v1/documents/{id}/process` | Chunk + embed document |
| PATCH | `/api/v1/documents/{id}/publish` | Publish after admin testing |
| POST | `/api/v1/documents/{id}/versions` | Upload a new version |
| GET | `/api/v1/documents/{id}/versions` | List document versions |
| GET | `/api/v1/documents/{id}/chunks` | View indexed chunks |

### Q&A
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/qa/ask` | Ask a question; optional category/document filters |
| GET | `/api/v1/qa/ask/stream` | Streaming answer (SSE) |
| GET | `/api/v1/qa/sessions` | List my sessions |
| PATCH | `/api/v1/qa/messages/{id}/feedback` | Rate as helpful |
| GET | `/api/v1/qa/history` | All Q&A history (admin) |
| GET | `/api/v1/qa/unanswered` | Questions needing admin review |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard` | KB stats summary |

---

## Document Processing Flow

```
Upload File (PDF/DOCX/TXT)
        ↓
  Validate Extension
        ↓
   Extract Text
        ↓
 Split into ~800-char chunks (with 100-char overlap)
        ↓
  Generate Embeddings (Gemini text-embedding-004)
        ↓
  Store 768-dimension embeddings in PostgreSQL pgvector
        ↓
 Store Chunk Metadata in PostgreSQL
        ↓
  Update Document Status → "processed"
        ↓
 Admin tests sample questions
        ↓
 Admin publishes document
        ↓
 Document Status → "published"
        ↓
   Log Processing Details
```

## Q&A Flow

```
User asks a question
        ↓
  Embed question (Gemini)
        ↓
  Search only published documents for normal users
        ↓
  Optional filters: selected category or selected documents
        ↓
  Semantic search in PostgreSQL pgvector (top-5 chunks)
        ↓
  Build prompt with retrieved context
        ↓
  Call Gemini 2.5 Flash
        ↓
  Parse JSON response
        ↓
  Save QAMessage + source chunk links
        ↓
  Log AI call (tokens, response time)
        ↓
  Return answer with source references
```

---

## Role Permissions

| Endpoint | viewer | editor | admin |
|---|---|---|---|
| Ask questions | ✓ | ✓ | ✓ |
| Upload documents | ✗ | ✓ | ✓ |
| Process documents | ✗ | ✓ | ✓ |
| Publish documents | ✗ | ✓ | ✓ |
| Upload new document versions | ✗ | ✓ | ✓ |
| Manage categories | ✗ | ✗ | ✓ |
| Validate answers | ✗ | ✗ | ✓ |
| View AI logs | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✓ |

---

## Architecture Principles

- **Router → Service → Repository → DB** (strict layering)
- **Repository** only: CRUD, filtering, pagination, sorting
- **Service** only: business logic, orchestration, AI calls
- **Router** only: request validation, response wrapping
- **AI agent** only: Gemini answer generation and Google embeddings
- All endpoints use `async/await`
- All DB queries use async SQLAlchemy
- Dependency Injection via `FastAPI.Depends()`
- Soft deletes (`is_active=False`) on all main tables
- Uniform response envelope on every endpoint
