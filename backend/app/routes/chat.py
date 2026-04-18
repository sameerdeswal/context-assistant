import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.rag import rag_service

router = APIRouter(prefix="/api/chats", tags=["chat"])


class ConnectionManager:
    """WebSocket connection manager"""
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, chat_id: str):
        await websocket.accept()
        self.active_connections[chat_id] = websocket

    def disconnect(self, chat_id: str):
        self.active_connections.pop(chat_id, None)

    async def broadcast(self, chat_id: str, message: dict):
        if chat_id in self.active_connections:
            await self.active_connections[chat_id].send_json(message)


manager = ConnectionManager()


@router.post("/", response_model=schemas.ChatResponse)
def create_chat(chat: schemas.ChatCreate, db: Session = Depends(get_db)):
    """Create a new chat"""
    chat_id = str(uuid.uuid4())
    db_chat = models.Chat(
        id=chat_id,
        title=chat.title,
        knowledge_base_id=chat.knowledge_base_id,
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat


@router.get("/", response_model=list[schemas.ChatResponse])
def list_chats(db: Session = Depends(get_db)):
    """List all chats"""
    chats = db.query(models.Chat).order_by(models.Chat.updated_at.desc()).all()
    return chats


@router.get("/{chat_id}", response_model=schemas.ChatDetailResponse)
def get_chat(chat_id: str, db: Session = Depends(get_db)):
    """Get a specific chat with all messages"""
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, db: Session = Depends(get_db)):
    """Delete a chat"""
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted"}


@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: str, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket, chat_id)
    
    # Verify chat exists
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        await websocket.close(code=1008, reason="Chat not found")
        return
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            user_message = message_data.get("message", "").strip()
            if not user_message:
                continue
            
            # Save user message to database
            user_msg_id = str(uuid.uuid4())
            user_msg = models.Message(
                id=user_msg_id,
                chat_id=chat_id,
                role="user",
                content=user_message,
            )
            db.add(user_msg)
            db.commit()
            
            # Send user message to client
            await manager.broadcast(chat_id, {
                "type": "message",
                "role": "user",
                "content": user_message,
                "id": user_msg_id,
            })
            
            # Get conversation history
            messages = db.query(models.Message).filter(
                models.Message.chat_id == chat_id
            ).all()
            history = [{"role": msg.role, "content": msg.content} for msg in messages[:-1]]
            
            # Generate response using RAG
            try:
                if chat.knowledge_base_id:
                    response = rag_service.query_rag(
                        user_message,
                        chat.knowledge_base_id,
                        db,
                        history
                    )
                else:
                    response = rag_service.query_general(user_message, history)
            except Exception as e:
                response = f"Error: {str(e)}"
            
            # Save assistant message to database
            assistant_msg_id = str(uuid.uuid4())
            assistant_msg = models.Message(
                id=assistant_msg_id,
                chat_id=chat_id,
                role="assistant",
                content=response,
            )
            db.add(assistant_msg)
            db.commit()
            
            # Send assistant response to client
            await manager.broadcast(chat_id, {
                "type": "message",
                "role": "assistant",
                "content": response,
                "id": assistant_msg_id,
            })
            
            # Update chat title if it's the first message
            if len(messages) == 1:
                chat.title = user_message[:50]
                db.commit()
    
    except WebSocketDisconnect:
        manager.disconnect(chat_id)
    except Exception as e:
        manager.disconnect(chat_id)
        raise
