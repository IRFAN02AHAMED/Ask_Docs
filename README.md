# AI Knowledge Base Q&A System — Ask Docs

A full-stack AI-powered Knowledge Base Q&A system built with React, FastAPI, PostgreSQL, pgvector, and AI models.

This project allows users to upload project documents and ask questions from those documents. The system retrieves relevant source chunks from the uploaded documents and generates accurate AI answers with source references.

---

## Problem Statement

A new fresher joining a project often struggles to understand the setup process, modules, database tables, API flow, and project structure.

Asking seniors repeatedly for these basic details can waste time and slow down the onboarding process.

---

## Proposed Solution

The AI Knowledge Base Q&A System solves this problem by allowing users to ask project-related questions and receive accurate AI-generated answers with source snippets from uploaded project documents.

Admins can upload and process documents, test answer quality, publish documents, manage document versions, view indexed chunks, and monitor document workflow.

Users can view published documents, ask questions, view AI answers with source chunks, and provide feedback.

---

# Tech Stack

## Backend Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy Async |
| Vector Search | PostgreSQL pgvector |
| Main AI LLM | Google Gemini 2.5 Flash |
| Gemini Embedding Model | models/gemini-embedding-001 |
| Hugging Face Embedding Model | sentence-transformers/all-mpnet-base-v2 |
| Hugging Face Chat Model | Qwen/Qwen3-8B |
| Authentication | JWT access token + refresh token + bcrypt |
| File Parsing | pypdf, python-docx, UTF-8 TXT decoding |
| Environment Config | .env + pydantic-settings |
| API Docs | Swagger UI / ReDoc |

## Frontend Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React + Vite |
| API Calls | Axios |
| State Management | Zustand |
| Routing | React Router DOM |
| UI Library | Material UI |
| Styling | MUI `sx` props + CSS |
| Authentication | JWT token stored in frontend |
| Development Server | Vite dev server |

---

# AI Models Used

This project uses 4 AI models.

| Provider | Model | Purpose |
|---|---|---|
| Gemini | gemini-2.5-flash | Main answer generation model |
| Gemini | models/gemini-embedding-001 | Converts text into embeddings for semantic search |
| Hugging Face | sentence-transformers/all-mpnet-base-v2 | Alternative embedding model |
| Hugging Face | Qwen/Qwen3-8B | Alternative chat/generative model |

## Why Gemini 2.5 Flash?

Gemini 2.5 Flash is used as the main generative model. After retrieving relevant document chunks, this model generates the final answer in a clear natural language format.

## Why Gemini Embedding?

Gemini embedding is used to convert both document chunks and user questions into vector embeddings. These vectors are compared using pgvector to retrieve the most relevant chunks.

## Why all-mpnet-base-v2?

`sentence-transformers/all-mpnet-base-v2` is an embedding model from the Sentence Transformers organization, hosted on Hugging Face. It converts text into 768-dimensional vectors and is useful for semantic search.

## Why Qwen3-8B?

`Qwen/Qwen3-8B` is a chat/generative model from Qwen by Alibaba Cloud, hosted on Hugging Face. It can be used as an alternative or fallback chat model for answer generation.

---

# Important AI / RAG Flow

This project follows a RAG flow.

```text
Document chunks
↓
Embedding model
↓
Vector storage in PostgreSQL pgvector

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

# Project Structure

```text
Ask_Docs/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_add_document_id_to_qa_messages.sql
│   │
│   └── app/
│       ├── main.py
│       ├── migration.py
│       ├── seeder.py
│       │
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── security.py
│       │   └── logger.py
│       │
│       ├── models/
│       │   └── models.py
│       │
│       ├── schemas/
│       │   └── schemas.py
│       │
│       ├── repositories/
│       │   ├── base_repository.py
│       │   ├── user_repository.py
│       │   ├── document_repository.py
│       │   └── qa_repository.py
│       │
│       ├── ai/
│       │   ├── ai_agent.py
│       │   └── prompts/
│       │       ├── system_prompt.py
│       │       ├── assistant_prompt.py
│       │       └── validation_prompt.py
│       │
│       ├── services/
│       │   ├── auth_service.py
│       │   ├── document_service.py
│       │   └── qa_service.py
│       │
│       ├── routers/
│       │   ├── auth_router.py
│       │   ├── document_router.py
│       │   ├── qa_router.py
│       │   ├── dashboard_router.py
│       │   └── user_router.py
│       │
│       ├── middleware/
│       │   ├── exception_handler.py
│       │   └── request_logger.py
│       │
│       └── utils/
│           └── response.py
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        │
        ├── routes/
        │   └── AppRoutes.jsx
        │
        ├── pages/
        │   ├── auth/
        │   │   └── LoginPage.jsx
        │   │
        │   ├── user/
        │   │   ├── UserDocumentsContainer.jsx
        │   │   ├── AskDocsContainer.jsx
        │   │   └── UserHistoryContainer.jsx
        │   │
        │   └── admin/
        │       ├── DashboardPage.jsx
        │       ├── UploadDocumentPage.jsx
        │       ├── DocumentDetailsPage.jsx
        │       ├── AdminHistoryPage.jsx
        │       └── UnansweredQuestionsPage.jsx
        │
        ├── components/
        │   ├── common/
        │   │   ├── AppCard.jsx
        │   │   ├── AppDialog.jsx
        │   │   ├── AppLoader.jsx
        │   │   ├── EmptyState.jsx
        │   │   ├── PageHeader.jsx
        │   │   ├── SearchBar.jsx
        │   │   ├── SourceChunkCard.jsx
        │   │   ├── AIAnswerCard.jsx
        │   │   └── InfoStatCard.jsx
        │   │
        │   ├── documents/
        │   │   ├── DocumentAIAnswerCard.jsx
        │   │   ├── DocumentInfoStatCard.jsx
        │   │   ├── DocumentMetadataCard.jsx
        │   │   ├── DocumentQATestingCard.jsx
        │   │   ├── DocumentStatusTracker.jsx
        │   │   ├── IndexedChunksDialog.jsx
        │   │   └── VersionHistoryDialog.jsx
        │   │
        │   └── layout/
        │       └── SharedLayout.jsx
        │
        ├── services/
        │   ├── apiClient.js
        │   ├── authService.js
        │   ├── documentService.js
        │   └── qaService.js
        │
        ├── store/
        │   ├── authStore.js
        │   ├── documentStore.js
        │   ├── qaStore.js
        │   └── uiStore.js
        │
        ├── hooks/
        │   ├── usePagination.js
        │   └── useDebounce.js
        │
        └── utils/
            ├── helpers.js
            ├── qaHelpers.js
            └── documentHelpers.js
```

---

# Backend Architecture

The backend follows:

```text
Router → Service → Repository → Database
```

## Router

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

## Service

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

## Repository

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

# Frontend Architecture

The frontend follows this flow:

```text
Page / Container
↓
Zustand Store
↓
Frontend Service
↓
apiClient / Axios
↓
FastAPI Backend
```

Example Q&A flow:

```text
AskDocsContainer.jsx
↓
qaStore.js
↓
qaService.js
↓
apiClient.js
↓
POST /api/v1/qa/ask
↓
FastAPI backend
```

---

# Why Frontend Has Services

Frontend services are used only for API calls.

They are different from backend services.

| Area | Meaning |
|---|---|
| Frontend service | Calls backend APIs using Axios |
| Backend service | Contains actual business logic |

Example frontend service functions:

```text
login()
fetchDocuments()
uploadDocument()
askQuestion()
sendFeedback()
publishDocument()
```

Frontend services make the code cleaner because API URLs and API logic are not written directly inside page components.

---

# API Response Format

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

# Environment Files

This project uses both `.env` and `.env.example`.

## `.env`

`.env` contains real private values.

Example:

```env
DB_PASSWORD=12345
JWT_SECRET_KEY=actual_secret_key
GEMINI_API_KEY=actual_api_key
HUGGINGFACE_API_KEY=actual_api_key
```

This file should not be committed to GitHub.

## `.env.example`

`.env.example` is a sample template file.

It shows what environment variables are required to run the project.

```bash
cp .env.example .env
```

---

# Backend Environment Variables

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

# Frontend Environment Variables

Create `.env` inside the frontend folder.

```env
VITE_API_BASE_URL=http://localhost:8000
```

In Vite, frontend environment variables should start with:

```text
VITE_
```

Example usage:

```js
const baseURL = import.meta.env.VITE_API_BASE_URL;
```

---

# Setup Instructions

## Prerequisites

```text
Python 3.11+
PostgreSQL 15+
pgvector extension
Node.js 18+
npm
Google Gemini API key
Hugging Face API key
```

---

# Backend Setup

## 1. Go to backend folder

```bash
cd backend
```

## 2. Create virtual environment

For Mac/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

For Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

## 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

## 4. Configure environment

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

## 5. Create PostgreSQL database

```sql
CREATE DATABASE ask_docs_db;
```

Connect to the database and enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 6. Database Setup

This project uses SQLAlchemy `create_all()` during backend startup to create the required tables automatically.

So normally, you do not need to run SQL migration files manually for the first setup.

Just make sure the PostgreSQL database is created before starting the backend.

```sql

CREATE DATABASE ask_docs_db;

## 7. Run seeder

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

## 8. Run backend

```bash
python main.py
```

Or with auto reload:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at:

```text
http://localhost:8000
```

API documentation:

```text
Swagger UI: http://localhost:8000/docs
ReDoc:      http://localhost:8000/redoc
```

---

# Frontend Setup

Open a new terminal.

## 1. Go to frontend folder

```bash
cd frontend
```

## 2. Install frontend dependencies

```bash
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Add backend URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 4. Run frontend

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

# Default Admin Credentials

```text
Email:    admin@kbsystem.com
Password: Admin@1234
```

---

# Key API Endpoints

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login and get access/refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/register` | Register user |
| GET | `/api/v1/auth/me` | Get current logged-in user profile |

## Documents

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

## Q&A

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/qa/ask` | Ask a question |
| GET | `/api/v1/qa/sessions` | List my Q&A sessions |
| PATCH | `/api/v1/qa/messages/{id}/feedback` | Mark answer as helpful/not helpful |
| GET | `/api/v1/qa/history` | View Q&A history |
| GET | `/api/v1/qa/unanswered` | View unanswered or low-confidence questions |

## Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard` | Get dashboard statistics |

---

# Main Frontend Routes

| Route | Page | Purpose |
|---|---|---|
| `/login` | LoginPage | User login |
| `/user/documents` | UserDocumentsContainer | View published documents |
| `/user/ask?document_id=<id>` | AskDocsContainer | Ask questions from selected document |
| `/user/history` | UserHistoryContainer | View user's Q&A history |
| `/admin/dashboard` | DashboardPage | Admin dashboard |
| `/admin/upload` | UploadDocumentPage | Upload document |
| `/admin/documents/:id` | DocumentDetailsPage | Process, test, publish document |
| `/admin/history` | AdminHistoryPage | View all Q&A history |
| `/admin/unanswered` | UnansweredQuestionsPage | Review unanswered questions |

---

# Main Frontend Features

## User Module

```text
View available published documents
Search documents
View document cards
Select a document
Ask AI questions
View AI answers
View source chunks used by AI
Click source chunk to view full text
Mark answer as Helpful / Not Helpful
Copy answer
Clear chat
Maintain same Q&A session until logout
View Q&A history
```

## Admin Module

```text
Upload PDF/DOCX/TXT documents
Add document title, description, category, and tags
Process documents
View processing status
View indexed chunks
Ask test questions before publishing
Mark answer as Helpful / Not Helpful
Publish documents after QA approval
Upload new document versions
View version history
View unanswered / low-confidence questions
Manage document workflow
```

---

# Important Frontend Files

## `apiClient.js`

Common Axios setup.

Used for:

```text
Base API URL
Authorization token
Refresh token handling
Common error handling
```

Authorization header:

```http
Authorization: Bearer <token>
```

## `authStore.js`

Handles authentication state.

Used for:

```text
Logged-in user
Access token
Refresh token
Login
Logout
Current user profile
```

## `documentStore.js`

Handles document-related frontend state.

Used for:

```text
Document list
Selected document
Document upload
Process document
Publish document
Fetch chunks
Fetch versions
Loading and error states
```

## `qaStore.js`

Handles Q&A-related frontend state.

Used for:

```text
Ask question
Current AI answer
Q&A history
Feedback
Unanswered questions
Q&A session
Loading and error states
```

## `uiStore.js`

Handles common UI state.

Used for:

```text
Snackbar messages
Global UI notifications
```

---

# User Documents Page

Route:

```text
http://localhost:5173/user/documents
```

Main file:

```text
UserDocumentsContainer.jsx
```

Features:

```text
Available documents list
Search documents
Published document cards
Featured first document
Category and tags display
Document title and description
Version display
Created date display
Ask Questions button
Navigate to Ask page with document_id
Loading state
Empty state
Pagination
```

The first document is shown as a featured card using:

```jsx
const isFeatured = index === 0;
```

Material UI Grid is used for responsive layout:

```jsx
<Grid item xs={12} sm={isFeatured ? 12 : 6} md={isFeatured ? 12 : 4}>
```

Meaning:

```text
xs = mobile
sm = tablet
md = desktop
12 = full width
6 = half width
4 = one-third width
```

---

# Ask Questions Page

Route:

```text
http://localhost:5173/user/ask?document_id=<document_id>
```

Main file:

```text
AskDocsContainer.jsx
```

Features:

```text
Select a document
Question input
Ask AI button
AI answer display
Sources used
Click source chunk to view full text
Helpful / Not Helpful
Copy answer
Clear chat
Auto scroll
Same QA session until logout
```

The selected document id is passed in the URL:

```text
/user/ask?document_id=<document_id>
```

Payload sent to backend:

```js
{
  question: currentQuestion,
  session_id: activeSessionId,
  document_ids: [documentId]
}
```

---

# Admin Document Details Page

Main file:

```text
DocumentDetailsPage.jsx
```

Features:

```text
Document metadata
Document status tracker
Process document
View indexed chunks
Test AI answer
Helpful / Not Helpful QA approval
Publish document
Upload new version
View version history
Copy AI answer
```

Admin document workflow:

```text
Pending
↓
Processing
↓
Processed
↓
QA Testing
↓
Published
```

The Admin Document Details page uses document-specific components from:

```text
frontend/src/components/documents
```

---

# Document Components

The document components are used to keep the document UI clean, reusable, and easy to maintain.

| Component | Purpose |
|---|---|
| `DocumentStatusTracker.jsx` | Shows document status flow: Pending, Processing, Processed, Published, and Failed |
| `DocumentMetadataCard.jsx` | Shows document metadata like ID, category, current version, uploader, upload date, and tags |
| `DocumentInfoStatCard.jsx` | Shows small document stat cards like file type and tokens processed |
| `DocumentQATestingCard.jsx` | Shows admin QA testing input and Ask Test Question button |
| `DocumentAIAnswerCard.jsx` | Shows AI answer, confidence badge, feedback buttons, copy button, and source chunks |
| `IndexedChunksDialog.jsx` | Shows indexed chunks modal for processed documents |
| `VersionHistoryDialog.jsx` | Shows document version history modal |

## `DocumentStatusTracker.jsx`

Responsible for showing the document processing lifecycle.

It shows:

```text
Pending
Processing
Processed
Published
Failed
```

This component helps admin understand the current document state visually.

## `DocumentMetadataCard.jsx`

Responsible for showing document basic details.

It shows:

```text
Document ID
Category
Current Version
Uploaded By
Upload Date
Tags
```

## `DocumentInfoStatCard.jsx`

Responsible for showing small document information cards.

Used for:

```text
File Type
Tokens Processed
```

## `DocumentQATestingCard.jsx`

Responsible for the admin testing section.

It allows admin to:

```text
Enter test question
Ask AI test question
Check response before publishing
See QA test status
```

## `DocumentAIAnswerCard.jsx`

Responsible for showing the AI generated answer.

It shows:

```text
Question
AI answer
Confidence score
Helpful button
Not Helpful button
Copy button
Source chunks
```

## `IndexedChunksDialog.jsx`

Responsible for showing indexed document chunks.

It helps admin verify:

```text
Chunk number
Chunk text
Whether embedding exists or not
```

## `VersionHistoryDialog.jsx`

Responsible for showing document version history.

It shows:

```text
Version label
Version number
File name
File type
Token count
Uploaded date
Current version badge
Change note
```

---

# Reusable Common Components

## `AppCard.jsx`

Used for common card UI.

Used in:

```text
Published document cards
Q&A history cards
Other repeated card sections
```

Purpose:

```text
Avoid repeating MUI Card styling
Keep all cards visually consistent
```

## `AIAnswerCard.jsx`

Used to show AI answer UI.

Used in:

```text
AskDocsContainer.jsx
DocumentDetailsPage.jsx
```

Contains:

```text
Question
AI Analysis label
Confidence badge
Answer text
Helpful / Not Helpful buttons
Copy button
Sources Used section
```

## `SourceChunkCard.jsx`

Used to display source chunks.

Contains:

```text
Document title
Chunk number
Short chunk preview
Optional click to view full text
```

## `InfoStatCard.jsx`

Used for small statistics cards.

Examples:

```text
File Type
Tokens Processed
```

---

# Utility Files

## `helpers.js`

Contains common frontend helper functions.

Used for:

```text
Date formatting
Date-time formatting
Relative time formatting
Text truncation
File size formatting
Number formatting
Initials generation
Tag parsing
Capitalization
```

## `qaHelpers.js`

Contains helper functions related to Q&A UI.

Used for:

```text
Formatting token count
Confidence badge display
Source text extraction
Source document name extraction
```

## `documentHelpers.js`

Contains helper functions related to document UI.

Used for:

```text
Token count formatting
Confidence badge display
Document status handling
Version label handling
Document UI helper logic
```

---

# File Upload and Parsing

Supported file types:

```text
PDF
DOCX
TXT
```

## TXT Parsing

TXT files are already plain text.

The backend decodes bytes using UTF-8:

```python
content.decode("utf-8", errors="replace")
```

`errors="replace"` means invalid characters are replaced instead of crashing the app.

## PDF Parsing

PDF files are parsed using:

```text
pypdf
```

The backend extracts text page by page.

## DOCX Parsing

DOCX files are parsed using:

```text
python-docx
```

The backend extracts paragraph text.

## Image / Scanned PDF Support

Current project does not support image files or scanned PDFs.

Image-based documents require OCR, but OCR is not implemented in the current project.

---

# File Saving Flow

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

# Document Processing Flow

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

# Semantic Search Flow

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

# Q&A Flow

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

# Authentication Flow

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

OAuth login like Google/GitHub login is not implemented currently.

---

# JWT vs OAuth

| Feature | JWT | OAuth |
|---|---|---|
| Used in this project | Yes | No |
| Purpose | Protect backend APIs | External login provider |
| Example | Email/password login → JWT token | Login with Google |
| Who creates token? | Our backend | External provider + backend flow |

---

# Role Permissions

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

# Database Concepts

## SQLAlchemy Models

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

## Pydantic Schemas

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

# Main Database Tables

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
| document_processing_logs | Stores document processing status and errors |

---

# Important Database Tables Explanation

## `document_chunks`

Stores extracted document text in smaller chunks along with embeddings.

Used for:

```text
Semantic search
RAG retrieval
Finding relevant content for user questions
```

## `qa_message_source_chunks`

Links each AI answer with the document chunks used to generate that answer.

Used for:

```text
Showing source snippets
Tracking which chunks supported the AI answer
Improving answer transparency
```

## `document_processing_logs`

Stores document processing status and error information.

Used for:

```text
Tracking processing success/failure
Debugging document extraction/chunking/embedding issues
Recording processed time and error messages
```

---

# Migration Files

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

# Zustand, localStorage, and PostgreSQL Usage

| Data | Stored where? | Why? |
|---|---|---|
| Access token | localStorage + authStore | Needed for protected API calls and to keep login after refresh |
| Refresh token | localStorage + authStore | Used to get new access token |
| Logged-in user details | localStorage + authStore | To show current user after refresh |
| Active QA session id | localStorage | To continue same Q&A session after refresh |
| Documents list | Zustand memory | Temporary UI data fetched from backend |
| Categories list | Zustand memory | Temporary UI data fetched from backend |
| Dashboard stats | Zustand memory | Temporary UI data fetched from backend |
| Q&A current answer/messages | Zustand memory | Temporary UI state |
| Q&A history | PostgreSQL | Permanent history |
| Uploaded documents/chunks | PostgreSQL | Permanent backend data |

---

# Common Commands

## Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Windows:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# GitHub Setup Note

`node_modules` and Python virtual environment folders such as `venv` are not included in GitHub.

After cloning the project, install dependencies again using:

```bash
npm install
```

for frontend and:

```bash
pip install -r requirements.txt
```

for backend.

---

# UI Design Approach

The UI uses Material UI components with custom `sx` styling.

Design style:

```text
Clean white cards
Light gray borders
Green primary action color
Rounded corners
Minimal shadows
Clear status chips
Responsive grid layout
```

---

# Responsive Layout

Material UI Grid uses a 12-column system.

Example:

```jsx
<Grid item xs={12} sm={6} md={4}>
```

Meaning:

```text
xs={12} → full width on mobile
sm={6} → half width on tablet
md={4} → one-third width on desktop
```

---

# Important Notes

```text
Frontend does not parse files.
Frontend only uploads files using FormData.
Backend receives the file using UploadFile.
Frontend does not call Gemini or Hugging Face directly.
AI API keys are stored only in backend .env.
Frontend only sends questions and displays answers.
Backend handles embeddings, semantic search, AI generation, and database storage.
This project uses JWT authentication, not OAuth login.
PostgreSQL pgvector is used for vector similarity search.
Uploaded documents and Q&A history are permanently stored in PostgreSQL.
Zustand is used for temporary frontend state.
localStorage is used for auth/session values that should survive refresh.
```

---

# Architecture Principles

```text
Router → Service → Repository → Database layering
Routers handle API request/response
Services handle business logic
Repositories handle database queries
AI agent handles embedding and answer generation
Pydantic schemas validate API data
SQLAlchemy models define database tables
All main endpoints use async/await
PostgreSQL pgvector is used for semantic search
JWT is used for authentication
bcrypt is used for password hashing
.env is used for private configuration
.env.example is used as a public setup template
Uniform response envelope is used for API responses
Soft delete is used where applicable using is_active=False
```
