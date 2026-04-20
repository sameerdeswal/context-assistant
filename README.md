# Context Assistant

![Chat Demo](https://github.com/sameerdeswal/context-assistant/blob/main/assets/demo_chat.png?raw=true)
![Knowledge Base Demo](https://github.com/sameerdeswal/context-assistant/blob/main/assets/demo_kb.png?raw=true)
![New Chat Demo](https://github.com/sameerdeswal/context-assistant/blob/main/assets/demo_new_chat.png?raw=true)

Context Assistant is a full-stack RAG (Retrieval-Augmented Generation) chat application.

It lets you:
- Upload or paste knowledge sources (text, PDF, CSV, TXT)
- Store embeddings in PostgreSQL + pgvector
- Ask questions in a chat UI and receive context-aware answers from Gemini

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL with pgvector extension
- LLM and Embeddings: Google Gemini via LangChain

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── rag.py
│   │   └── routes/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend run)
- Python 3.11+ (for local backend run)
- A Google Gemini API key

## Environment Setup

1. Create your environment file:

```bash
cp .env.example .env
```

2. Open `.env` and set:

- `GEMINI_API_KEY=...`

You can keep the default DB values for local development unless you need custom credentials.

## Run With Docker (Recommended)

From the project root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- Postgres: localhost:5432

To stop:

```bash
docker compose down
```

To stop and remove DB volume:

```bash
docker compose down -v
```

## Run Locally (Without Docker)

### 1) Start PostgreSQL with pgvector

You need PostgreSQL with the `vector` extension enabled. The easiest option is running only DB via Docker:

```bash
docker compose up postgres -d
```

### 2) Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Run frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at http://localhost:5173.

## How To Use

1. Open the app at http://localhost:5173
2. Go to Knowledge Base section
3. Create a knowledge base:
	 - Source type `text`: paste content directly
	 - Source type `pdf`, `csv`, or `txt`: upload a file
4. Open or create a chat
5. Ask questions related to your uploaded knowledge
6. The assistant retrieves relevant chunks and responds using Gemini

## API Overview

Base URL: `http://localhost:8000`

Health and docs:
- `GET /health`
- `GET /docs`

Knowledge base endpoints:
- `POST /api/knowledge-base` (multipart form)
- `GET /api/knowledge-base`
- `GET /api/knowledge-base/{kb_id}`
- `DELETE /api/knowledge-base/{kb_id}`

Chat endpoints:
- `POST /api/chats`
- `GET /api/chats`
- `GET /api/chats/{chat_id}`
- `DELETE /api/chats/{chat_id}`
- `WS /api/chats/ws/{chat_id}`

## Notes

- If `GEMINI_API_KEY` is not set, chat replies will indicate Gemini is not configured.
- On startup, backend initializes database tables and ensures pgvector extension exists.
- CORS is configured for local frontend origins (`localhost:5173`, etc.).

## Troubleshooting

- Backend cannot connect to DB:
	- Ensure Postgres is running and `.env` credentials match
	- Verify `DATABASE_URL` is correct
- Upload/parsing issues:
	- Confirm file type matches selected source type
	- For CSV/TXT, ensure file is text-readable
- WebSocket issues:
	- Ensure backend is running on port `8000`
	- Ensure frontend `VITE_WS_URL` points to `ws://localhost:8000`
