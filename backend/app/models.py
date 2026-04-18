from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

Base = declarative_base()


class KnowledgeBase(Base):
    """Knowledge base document"""
    __tablename__ = "knowledge_bases"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    source_type = Column(String)  # text, pdf, csv, txt
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chunks = relationship("KnowledgeBaseChunk", back_populates="knowledge_base", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="knowledge_base")


class KnowledgeBaseChunk(Base):
    """Chunks of knowledge base documents (for vector embeddings)"""
    __tablename__ = "knowledge_base_chunks"

    id = Column(String, primary_key=True, index=True)
    knowledge_base_id = Column(String, ForeignKey("knowledge_bases.id"), index=True)
    content = Column(Text)
    embedding = Column(Vector(768), nullable=True)
    chunk_index = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    knowledge_base = relationship("KnowledgeBase", back_populates="chunks")


class Chat(Base):
    """Chat session"""
    __tablename__ = "chats"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    knowledge_base_id = Column(String, ForeignKey("knowledge_bases.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    knowledge_base = relationship("KnowledgeBase", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    """Individual message in a chat"""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chats.id"), index=True)
    role = Column(String)  # user or assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
