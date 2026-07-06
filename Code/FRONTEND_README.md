# AI Knowledge Base Q&A System — Frontend

A React + Vite frontend for the AI Knowledge Base Q&A System.

This frontend provides separate user and admin modules. Users can view published documents, ask questions, view answers with source chunks, and check Q&A history. Admins can upload documents, process them, test AI quality, publish documents, manage versions, and review unanswered questions.

---

## Problem Statement

A new fresher joining a project often struggles to understand setup steps, modules, database tables, and API flow.

Asking seniors repeatedly can waste time and slow down onboarding.

## Proposed Solution

The Knowledge Base Q&A system allows users to ask project-related questions and receive accurate answers with source snippets from uploaded project documents.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React + Vite |
| API Calls | Axios |
| State Management | Zustand |
| Routing | React Router DOM |
| UI Library | Material UI |
| Styling | MUI `sx` props + CSS |
| Authentication | JWT token stored in frontend |
| Backend API | FastAPI |
| Development Server | Vite dev server |

---

## Main Frontend Features

### User Module

- View available published documents
- Search documents
- View document cards
- Select a document
- Ask AI questions
- View AI answers
- View source chunks used by AI
- Click source chunk to view full text
- Mark answer as Helpful / Not Helpful
- Copy answer
- Clear chat
- Maintain same Q&A session until logout
- View Q&A history

### Admin Module

- Upload PDF/DOCX/TXT documents
- Add document title, description, category, and tags
- Process documents
- View processing status
- View indexed chunks
- Ask test questions before publishing
- Mark answer as Helpful / Not Helpful
- Publish documents after QA approval
- Upload new document versions
- View version history
- View unanswered / low-confidence questions
- Manage document workflow

---

## Project Structure

```text
ai_kb_frontend/
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
    │   │   ├── DocumentMetadataCard.jsx
    │   │   └── DocumentStatusTracker.jsx
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
        └── qaHelpers.js
```

---

## Frontend Layering

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

## Why Frontend Has Services

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

## Important Frontend Files

### `apiClient.js`

Common Axios setup.

Used for:

```text
Base API URL
Authorization token
Refresh token handling
Common error handling
```

Example:

```http
Authorization: Bearer <token>
```

### `authStore.js`

Handles authentication state.

Used for:

```text
Logged-in user
Access token
Login
Logout
Current user profile
```

### `documentStore.js`

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

### `qaStore.js`

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

### `uiStore.js`

Handles common UI state.

Used for:

```text
Snackbar messages
Global UI notifications
```

---

## Main Routes

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

## User Documents Page

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

## Ask Questions Page

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

## Admin Document Details Page

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

---

## Reusable Components

### `AppCard.jsx`

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

### `AIAnswerCard.jsx`

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

### `SourceChunkCard.jsx`

Used to display source chunks.

Contains:

```text
Document title
Chunk number
Short chunk preview
Optional click to view full text
```

### `InfoStatCard.jsx`

Used for small statistics cards.

Examples:

```text
File Type
Tokens Processed
```

### `DocumentStatusTracker.jsx`

Used in admin document details page.

Shows:

```text
Pending
Processing
Processed
Published
```

### `DocumentMetadataCard.jsx`

Used in admin document details page.

Shows:

```text
Document ID
Category
Current Version
Uploaded By
Upload Date
Tags
```

---

## Authentication Flow

This frontend uses JWT authentication.

```text
User enters email/password
↓
Frontend sends login request
↓
Backend returns access token and refresh token
↓
Frontend stores token
↓
Frontend sends token in Authorization header
↓
Protected APIs work
```

Authorization header:

```http
Authorization: Bearer <token>
```

This project uses JWT only.

OAuth login like Google/GitHub is not implemented currently.

---

## Environment Variables

Create a `.env` file from `.env.example`.

Example:

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

## Setup Instructions

### 1. Prerequisites

```text
Node.js 18+
npm
Backend running on port 8000
```

### 2. Install Dependencies

```bash
cd ai_kb_frontend
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Add backend URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Run Frontend

```bash
npm run dev
```

Frontend will usually run on:

```text
http://localhost:5173
```

---

## Common Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

---

## Frontend and Backend Connection

Frontend calls backend APIs using Axios.

Example flow:

```text
React page
↓
Zustand store action
↓
Frontend service function
↓
apiClient
↓
FastAPI backend endpoint
```

Example:

```text
Ask AI button
↓
askQuestion(payload)
↓
POST /api/v1/qa/ask
↓
AI answer returned
↓
Display answer and sources
```

---

## UI Design Approach

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

## Responsive Layout

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

## Important Notes

- Frontend does not parse files.
- Frontend only uploads files using FormData.
- Backend receives the file using UploadFile.
- Frontend does not call Gemini or Hugging Face directly.
- AI API keys are stored only in backend `.env`.
- Frontend only sends questions and displays answers.
- Backend handles embeddings, semantic search, AI generation, and database storage.

---

## Future Enhancements

- OAuth login with Google/GitHub
- Better role-based UI hiding
- Dark mode
- Rich document preview
- Real-time streaming answers
- Better admin analytics charts
- Better notification system
- Unit tests for components
- E2E testing with Playwright
