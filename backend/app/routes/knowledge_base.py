import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.rag import rag_service

router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge_base"])


@router.post("/", response_model=schemas.KnowledgeBaseResponse)
async def create_knowledge_base(
    name: str = Form(...),
    source_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Create a new knowledge base"""
    kb_id = str(uuid.uuid4())
    
    # Read file content if provided
    content = ""
    if file:
        content = await file.read()
        content = content.decode("utf-8")
    
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
