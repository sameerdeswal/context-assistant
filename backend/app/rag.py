import os
from typing import List, Optional

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from sqlalchemy.orm import Session

from app import models

load_dotenv()


class RAGService:
    """RAG service using Gemini + PostgreSQL pgvector retrieval."""

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")

        self.llm = None
        self.embeddings = None

        self._init_gemini()

    def _init_gemini(self):
        if not self.gemini_api_key:
            print("Warning: GEMINI_API_KEY not set. AI responses are disabled.")
            return

        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-3-flash-preview",
                google_api_key=self.gemini_api_key,
                temperature=0.7,
            )
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self.gemini_api_key,
            )
        except Exception as exc:
            print(f"Warning: Failed to initialize Gemini: {exc}")

    def add_knowledge_base(self, kb_id: str, content: str, chunk_size: int = 500) -> List[dict]:
        chunks = self._chunk_content(content, chunk_size)

        vectors: List[dict] = []
        for idx, chunk in enumerate(chunks):
            embedding = None
            try:
                if self.embeddings:
                    embedding = self.embeddings.embed_query(chunk)
            except Exception as exc:
                print(f"Warning: chunk embedding failed ({idx}): {exc}")

            vectors.append(
                {
                    "id": f"{kb_id}_chunk_{idx}",
                    "content": chunk,
                    "chunk_index": idx,
                    "embedding": embedding,
                }
            )

        return vectors

    def delete_knowledge_base(self, kb_id: str):
        # Embeddings are stored in Postgres and removed via cascade delete.
        return None

    def query_rag(
        self,
        question: str,
        kb_id: str,
        db: Session,
        conversation_history: Optional[List] = None,
    ) -> str:
        if not self.llm:
            return "Gemini is not configured yet. Please set GEMINI_API_KEY in backend .env."

        history = conversation_history or []
        context_docs = self._retrieve_context(question, kb_id, db)
        context = "\n".join(doc.get("content", "") for doc in context_docs)

        messages = []
        for msg in history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg.get("content", "")))

        if context:
            prompt = (
                "You are a helpful assistant. Use the context below to answer accurately. "
                "If context does not contain the answer, clearly say you do not know.\n\n"
                f"Context:\n{context}\n\nQuestion: {question}"
            )
        else:
            prompt = f"You are a helpful assistant. Answer clearly and concisely.\n\nQuestion: {question}"

        messages.append(HumanMessage(content=prompt))

        try:
            response = self.llm.invoke(messages)
            return response.content
        except Exception as exc:
            return f"Error generating response: {exc}"

    def query_general(self, question: str, conversation_history: Optional[List] = None) -> str:
        if not self.llm:
            return "Gemini is not configured yet. Please set GEMINI_API_KEY in backend .env."

        history = conversation_history or []
        messages = []

        for msg in history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg.get("content", "")))

        messages.append(HumanMessage(content=question))

        try:
            return self.llm.invoke(messages).content
        except Exception as exc:
            return f"Error generating response: {exc}"

    def _retrieve_context(self, query: str, kb_id: str, db: Session, top_k: int = 3) -> List[dict]:
        if not self.embeddings:
            return []

        try:
            query_embedding = self.embeddings.embed_query(query)

            matches = (
                db.query(models.KnowledgeBaseChunk)
                .filter(models.KnowledgeBaseChunk.knowledge_base_id == kb_id)
                .filter(models.KnowledgeBaseChunk.embedding.is_not(None))
                .order_by(models.KnowledgeBaseChunk.embedding.cosine_distance(query_embedding))
                .limit(top_k)
                .all()
            )

            return [
                {
                    "id": match.id,
                    "content": match.content,
                    "score": 0,
                }
                for match in matches
            ]
        except Exception as exc:
            print(f"Warning: pgvector query failed: {exc}")
            return []

    @staticmethod
    def _chunk_content(content: str, chunk_size: int = 500) -> List[str]:
        words = content.split()
        chunks: List[str] = []
        current_words: List[str] = []
        current_size = 0

        for word in words:
            current_words.append(word)
            current_size += len(word) + 1
            if current_size >= chunk_size:
                chunks.append(" ".join(current_words))
                current_words = []
                current_size = 0

        if current_words:
            chunks.append(" ".join(current_words))

        return chunks


rag_service = RAGService()
