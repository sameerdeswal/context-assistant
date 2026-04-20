from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Knowledge Base Schemas
class KnowledgeBaseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str  # text, pdf, csv, txt


class KnowledgeBaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class KnowledgeBaseChunk(BaseModel):
    id: str
    content: str
    chunk_index: int

    class Config:
        from_attributes = True


class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    source_type: str
    created_at: datetime
    updated_at: datetime
    chunks: List[KnowledgeBaseChunk] = []

    class Config:
        from_attributes = True


# Message Schemas
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# Chat Schemas
class ChatCreate(BaseModel):
    title: str


class ChatResponse(BaseModel):
    id: str
    title: str
    knowledge_base_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class ChatDetailResponse(ChatResponse):
    """Full chat with all messages"""
    pass


# WebSocket Message Schemas
class WSMessage(BaseModel):
    type: str  # "message", "status", "error"
    data: dict


class ChatQueryRequest(BaseModel):
    message: str
    chat_id: str
    knowledge_base_id: Optional[str] = None
