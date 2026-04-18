import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes import knowledge_base, chat

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Context Assistant API",
    description="RAG-based AI Assistant with FastAPI",
    version="1.0.0",
)

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(knowledge_base.router)
app.include_router(chat.router)


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Context Assistant API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
