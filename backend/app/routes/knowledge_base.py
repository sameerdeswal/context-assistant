import uuid
from io import BytesIO
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session
from pypdf import PdfReader
from app.database import get_db
from app import models, schemas
from app.rag import rag_service

router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge_base"])


@router.post("/", response_model=schemas.KnowledgeBaseResponse)
async def create_knowledge_base(
    name: str = Form(...),
    source_type: str = Form(...),
    description: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Create a new knowledge base"""
    kb_id = str(uuid.uuid4())
    
    # Read content depending on selected source type
    content = ""
    source_type = source_type.lower()

    if source_type == "text":
        content = (text_content or "").strip()
        if not content:
            raise HTTPException(status_code=400, detail="text_content is required for text source type")
    else:
        if not file:
            raise HTTPException(status_code=400, detail=f"file is required for {source_type} source type")

        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        if source_type == "pdf":
            try:
                reader = PdfReader(BytesIO(raw))
                pages = [page.extract_text() or "" for page in reader.pages]
                content = "\n".join(pages).strip()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")
        elif source_type in {"csv", "txt"}:
            try:
                content = raw.decode("utf-8").strip()
            except UnicodeDecodeError:
                content = raw.decode("latin-1").strip()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported source_type: {source_type}")

        if not content:
            raise HTTPException(status_code=400, detail="No readable text content found in uploaded file")
    
    # Create knowledge base record
    db_kb = models.KnowledgeBase(
        id=kb_id,
        name=name,
        description=description,
        source_type=source_type,
    )
    db.add(db_kb)
    db.commit()
    db.refresh(db_kb)
    
    # Add to RAG system
    if content:
        chunks = rag_service.add_knowledge_base(kb_id, content)
        # Create chunk records in database
        for chunk_data in chunks:
            chunk = models.KnowledgeBaseChunk(
                id=chunk_data["id"],
                knowledge_base_id=kb_id,
                content=chunk_data["content"],
                chunk_index=chunk_data["chunk_index"],
                embedding=chunk_data["embedding"],
            )
            db.add(chunk)
        db.commit()
    
    return db_kb


@router.get("/", response_model=list[schemas.KnowledgeBaseResponse])
def list_knowledge_bases(db: Session = Depends(get_db)):
    """List all knowledge bases"""
    kbs = db.query(models.KnowledgeBase).all()
    return kbs


@router.get("/{kb_id}", response_model=schemas.KnowledgeBaseResponse)
def get_knowledge_base(kb_id: str, db: Session = Depends(get_db)):
    """Get a specific knowledge base"""
    kb = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb


@router.delete("/{kb_id}")
def delete_knowledge_base(kb_id: str, db: Session = Depends(get_db)):
    """Delete a knowledge base"""
    kb = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    # Delete from RAG system
    rag_service.delete_knowledge_base(kb_id)
    
    # Delete from database
    db.delete(kb)
    db.commit()
    
    return {"message": "Knowledge base deleted"}
