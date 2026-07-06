# AI Knowledge Base Q&A System — Backend

A production-structured FastAPI backend for an AI-powered document knowledge base.

This backend helps users ask questions from uploaded project documents and receive AI-generated answers with source snippets.

---

## Problem Statement

A new fresher joining a project often struggles to understand the setup process, modules, database tables, and API flow.

Asking seniors repeatedly for these basic details can waste time and slow down the onboarding process.

## Proposed Solution

The Knowledge Base Q&A system solves this problem by allowing users to ask project-related questions and receive accurate answers with source snippets from uploaded project documents.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI |
| Database | PostgreSQL + SQLAlchemy Async |
| Vector Search | PostgreSQL pgvector |
| Main AI LLM | Google Gemini 2.5 Flash |
| Gemini Embedding Model | models/gemini-embedding-001 |
| Hugging Face Embedding Model | sentence-transformers/all-mpnet-base-v2 |
| Hugging Face Chat Model | Qwen/Qwen3-8B |
| Authentication | JWT access token + refresh token + bcrypt |
| File Parsing | pypdf, python-docx, UTF-8 TXT decoding |
| Environment Config | .env + pydantic-settings |
| API Docs | Swagger UI / ReDoc |

---

## AI Models Used

This project uses 4 AI models.

| Provider | Model | Purpose |
|---|---|---|
| Gemini | gemini-2.5-flash | Main answer generation model |
| Gemini | models/gemini-embedding-001 | Converts text into embeddings for semantic search |
| Hugging Face | sentence-transformers/all-mpnet-base-v2 | Alternative embedding model |
| Hugging Face | Qwen/Qwen3-8B | Alternative chat/generative model |

### Why Gemini 2.5 Flash?

Gemini 2.5 Flash is used as the main generative model. After retrieving relevant document chunks, this model generates the final answer in a clear natural language format.

### Why Gemini Embedding?

Gemini embedding is used to convert both document chunks and user questions into vector embeddings. These vectors are compared using pgvector to retrieve the most relevant chunks.

### Why all-mpnet-base-v2?

`sentence-transformers/all-mpnet-base-v2` is an embedding model from the Sentence Transformers organization, hosted on Hugging Face. It converts text into 768-dimensional vectors and is useful for semantic search.

### Why Qwen3-8B?

`Qwen/Qwen3-8B` is a chat/generative model from Qwen by Alibaba Cloud, hosted on Hugging Face. It can be used as an alternative or fallback chat model for answer generation.

---

## Important AI Flow

This project follows a RAG flow.

```text
Document chunks
↓
Embedding model
↓
Vector storage in pgvector

User question
↓
Embedding model
↓
Vector search

Top matching chunks
↓
Gemini / Qwen
↓
Final answer
```

Embedding models are used for retrieval.

Generative models are used for answer generation.

---

## Project Structure

```text
ai_kb_backend/
├── main.py
├── requirements.txt
├── .env.example
├── migrations/
│   ├── 001_initial_schema.sql
│   └── 002_add_document_id_to_qa_messages.sql
│
└── app/
    ├── main.py
    ├── migration.py
    ├── seeder.py
    │
    ├── core/
    │   ├── config.py
    │   ├── database.py
    │   ├── security.py
    │   └── logger.py
    │
    ├── models/
    │   └── models.py
    │
    ├── schemas/
    │   └── schemas.py
    │
    ├── repositories/
    │   ├── base_repository.py
    │   ├── user_repository.py
    │   ├── document_repository.py
    │   └── qa_repository.py
    │
    ├── ai/
    │   ├── ai_agent.py
    │   └── prompts/
    │       ├── system_prompt.py
    │       ├── assistant_prompt.py
    │       └── validation_prompt.py
    │
    ├── services/
    │   ├── auth_service.py
    │   ├── document_service.py
    │   └── qa_service.py
    │
    ├── routers/
    │   ├── auth_router.py
    │   ├── document_router.py
    │   ├── qa_router.py
    │   ├── dashboard_router.py
    │   └── user_router.py
    │
    ├── middleware/
    │   ├── exception_handler.py
    │   └── request_logger.py
    │
    └── utils/
        └── response.py
```

---

## Backend Layering

This backend follows:

```text
Router → Service → Repository → Database
```

### Router

Routers receive API requests and return responses.

Example files:

```text
auth_router.py
document_router.py
qa_router.py
```

Router responsibility:

```text
Receive request
Validate request using Pydantic schema
Call service
Return response
```

### Service

Services contain business logic.

Example files:

```text
document_service.py
qa_service.py
auth_service.py
```

Service responsibility:

```text
Parse document
Create chunks
Generate embeddings
Call AI model
Process Q&A logic
Handle authentication logic
```

### Repository

Repositories contain database queries.

Example files:

```text
document_repository.py
qa_repository.py
user_repository.py
```

Repository responsibility:

```text
Insert records
Update records
Fetch records
Filter records
Pagination
Sorting
```

---

## API Response Format

Every endpoint returns a standard response envelope.

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
    "items": [],
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

## Environment Files

This project uses both `.env` and `.env.example`.

### `.env`

`.env` contains real private values.

Example:

```env
DB_PASSWORD=12345
JWT_SECRET_KEY=actual_secret_key
GEMINI_API_KEY=actual_api_key
HUGGINGFACE_API_KEY=actual_api_key
```

This file should not be committed to GitHub.

### `.env.example`

`.env.example` is a sample template file.

It shows what environment variables are required to run the project.

```bash
cp .env.example .env
```

---

## Environment Variables

```env
APP_NAME="AI Knowledge Base Q&A System"
APP_VERSION="1.0.0"
APP_ENV=development
DEBUG=true

HOST=0.0.0.0
PORT=8000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ask_docs_db
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
GEMINI_MAX_RETRIES=3
GEMINI_TIMEOUT_SECONDS=60

HUGGINGFACE_API_KEY=
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
HUGGINGFACE_CHAT_MODEL=Qwen/Qwen3-8B

EMBEDDING_DIMENSIONS=768
VECTOR_SEARCH_TOP_K=5

UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=20
ALLOWED_EXTENSIONS=["pdf","docx","txt"]

CHUNK_SIZE=800
CHUNK_OVERLAP=100

LOG_FILE=app.log
LOG_LEVEL=DEBUG
```

---

## Setup Instructions

### 1. Prerequisites

```text
Python 3.11+
PostgreSQL 15+
pgvector extension
Google Gemini API key
Hugging Face API key
```

### 2. Create PostgreSQL Database

```sql
CREATE DATABASE ask_docs_db;
```

Connect to the database and enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Install Dependencies

```bash
cd ai_kb_backend

python -m venv venv

source venv/bin/activate
# Windows:
# venv\Scripts\activate

pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Then edit `.env` and fill:

```text
DB credentials
JWT secret
Gemini API key
Hugging Face API key
```

### 5. Run Database Migration

If your project uses SQL migration files, run them once in PostgreSQL.

Example:

```bash
psql -U postgres -d ask_docs_db -f migrations/001_initial_schema.sql
```

If your project uses `create_all`, tables may be created automatically on startup.

Do not delete migration files after running them. The database changes will remain, but the migration files are useful for tracking, setup on another machine, and future deployment.

### 6. Run Seeder

If seed data is not automatically inserted, run:

```bash
python -m app.seeder
```

Seeder inserts default data like:

```text
roles
statuses
categories
admin user
```

### 7. Run Backend

```bash
python main.py
```

Or with auto reload:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 8. Access API Docs

```text
Swagger UI: http://localhost:8000/docs
ReDoc:      http://localhost:8000/redoc
```

---

## Default Admin Credentials

```text
Email:    admin@kbsystem.com
Password: Admin@1234
```

Change this immediately for real production use.

---

## Key API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login and get access/refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/register` | Register user |
| GET | `/api/v1/auth/me` | Get current logged-in user profile |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/documents` | Upload document |
| GET | `/api/v1/documents` | List documents |
| GET | `/api/v1/documents/{id}` | Get document details |
| POST | `/api/v1/documents/{id}/process` | Parse, chunk, and embed document |
| PATCH | `/api/v1/documents/{id}/publish` | Publish document |
| POST | `/api/v1/documents/{id}/versions` | Upload new version |
| GET | `/api/v1/documents/{id}/versions` | List document versions |
| GET | `/api/v1/documents/{id}/chunks` | View indexed chunks |

### Q&A

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/qa/ask` | Ask a question |
| GET | `/api/v1/qa/sessions` | List my Q&A sessions |
| PATCH | `/api/v1/qa/messages/{id}/feedback` | Mark answer as helpful/not helpful |
| GET | `/api/v1/qa/history` | View Q&A history |
| GET | `/api/v1/qa/unanswered` | View unanswered or low-confidence questions |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard` | Get dashboard statistics |

---

## File Upload and Parsing

Supported file types:

```text
PDF
DOCX
TXT
```

### TXT Parsing

TXT files are already plain text.

The backend decodes bytes using UTF-8:

```python
content.decode("utf-8", errors="replace")
```

`errors="replace"` means invalid characters are replaced instead of crashing the app.

### PDF Parsing

PDF files are parsed using:

```text
pypdf
```

The backend extracts text page by page.

### DOCX Parsing

DOCX files are parsed using:

```text
python-docx
```

The backend extracts paragraph text.

### Image / Scanned PDF Support

Current project does not support image files or scanned PDFs.

Image-based documents require OCR and can be added as a future enhancement.

---

## File Saving Flow

Uploaded files are saved to the local upload directory.

```text
React uploads file
↓
FastAPI receives UploadFile
↓
Backend reads file bytes
↓
File is saved in ./uploads
↓
Text is extracted
↓
Text is chunked and embedded
```

The file is saved using a unique UUID file name to avoid overwriting files with the same name.

---

## Document Processing Flow

```text
Upload File
↓
Validate Extension
↓
Save File to Disk
↓
Extract Text
↓
Split into Chunks
↓
Generate Embeddings
↓
Store Chunks + Vectors in PostgreSQL pgvector
↓
Update Document Status to Processed
↓
Admin Tests Sample Questions
↓
Admin Approves QA Test
↓
Admin Publishes Document
↓
Document Status becomes Published
```

Chunking configuration:

```env
CHUNK_SIZE=800
CHUNK_OVERLAP=100
```

`CHUNK_SIZE=800` means text is split into chunks of around 800 characters/tokens depending on implementation.

`CHUNK_OVERLAP=100` means each chunk overlaps slightly with the previous one to avoid losing context between chunks.

---

## Semantic Search Flow

Semantic search happens using embeddings and pgvector.

```text
Document chunk
↓
Embedding model
↓
Chunk vector
↓
Stored in PostgreSQL pgvector
```

When a user asks a question:

```text
User question
↓
Embedding model
↓
Question vector
↓
Compare with chunk vectors using pgvector
↓
Retrieve top matching chunks
```

The number of retrieved chunks is controlled by:

```env
VECTOR_SEARCH_TOP_K=5
```

So the system retrieves the top 5 relevant chunks.

The AI model receives all retrieved chunks together and generates one final answer using the combined context.

---

## Q&A Flow

```text
User selects a document
↓
User asks a question
↓
Backend creates embedding for question
↓
pgvector searches relevant chunks
↓
Top 5 chunks are retrieved
↓
Prompt is built with question + chunks
↓
Gemini 2.5 Flash generates answer
↓
Answer is saved in qa_messages
↓
Source chunk links are saved
↓
Answer and source snippets are returned to frontend
```

For one normal user question:

```text
1 embedding request
+
1 chat/generation request
```

For document processing:

```text
Number of embedding requests ≈ number of chunks
```

---

## Authentication Flow

This project uses JWT authentication only.

It does not use OAuth.

```text
User logs in with email/password
↓
Backend verifies password using bcrypt
↓
Backend creates JWT access token and refresh token
↓
Frontend stores token
↓
Frontend sends token in Authorization header
↓
Backend verifies token for protected APIs
```

Authorization header:

```http
Authorization: Bearer <token>
```

OAuth login like Google/GitHub login is not implemented currently. It can be added as a future enhancement.

---

## JWT vs OAuth

| Feature | JWT | OAuth |
|---|---|---|
| Used in this project | Yes | No |
| Purpose | Protect backend APIs | External login provider |
| Example | Email/password login → JWT token | Login with Google |
| Who creates token? | Our backend | External provider + backend flow |

---

## Role Permissions

| Feature | viewer | editor | admin |
|---|---|---|---|
| Ask questions | Yes | Yes | Yes |
| View published documents | Yes | Yes | Yes |
| Upload documents | No | Yes | Yes |
| Process documents | No | Yes | Yes |
| Publish documents | No | Yes | Yes |
| Upload new versions | No | Yes | Yes |
| Manage categories | No | No | Yes |
| Validate answers | No | No | Yes |
| View AI logs | No | No | Yes |
| Manage users | No | No | Yes |

---

## Database Concepts

### SQLAlchemy Models

SQLAlchemy models define database tables.

Example models:

```text
User
Document
DocumentVersion
DocumentChunk
QASession
QAMessage
```

Used for:

```text
Creating tables
Querying database
Inserting records
Updating records
Relationships
```

### Pydantic Schemas

Pydantic schemas validate request and response data.

Used for:

```text
Request validation
Response formatting
Preventing unwanted fields from being returned
```

Simple difference:

```text
SQLAlchemy model = database table structure
Pydantic schema = API input/output structure
```

---

## Main Database Tables

| Table | Purpose |
|---|---|
| users | Stores users and login details |
| roles | Stores user roles |
| documents | Stores uploaded document records |
| document_versions | Stores each version of a document |
| document_chunks | Stores text chunks and embeddings |
| categories | Stores document categories |
| document_statuses | Stores document lifecycle status |
| qa_sessions | Stores user Q&A sessions |
| qa_messages | Stores questions, answers, confidence, feedback |
| qa_message_source_chunks | Links answers to source chunks |
| ai_response_logs | Stores AI call logs, token usage, response time |

---

## Migration Files

Migration files contain database changes.

Example:

```sql
ALTER TABLE qa_messages ADD COLUMN document_id UUID;
```

After running a migration once, the database change remains.

But the migration file should still be kept because:

```text
It records database history
It helps recreate the same database elsewhere
It helps teammates/reviewers understand DB changes
It is useful for deployment
```

Recommended structure:

```text
migrations/
├── 001_initial_schema.sql
├── 002_add_document_id_to_qa_messages.sql
└── 003_add_document_versions.sql
```

---

## Architecture Principles

- Router → Service → Repository → Database layering
- Routers handle API request/response
- Services handle business logic
- Repositories handle database queries
- AI agent handles embedding and answer generation
- Pydantic schemas validate API data
- SQLAlchemy models define database tables
- All main endpoints use async/await
- PostgreSQL pgvector is used for semantic search
- JWT is used for authentication
- bcrypt is used for password hashing
- `.env` is used for private configuration
- `.env.example` is used as a public setup template
- Uniform response envelope is used for API responses
- Soft delete is used where applicable using `is_active=False`

---

## Future Enhancements

- OAuth login using Google/GitHub
- OCR support for scanned PDFs and images
- Advanced table extraction from PDFs
- Role-based admin analytics
- Streaming answer support using SSE
- Better answer validation workflow
- Cloud file storage instead of local uploads
- Docker setup
- Alembic migration support
- CI/CD deployment pipeline
