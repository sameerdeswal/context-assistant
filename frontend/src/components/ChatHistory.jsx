import { useState, useEffect } from 'react'
import { MessageSquare, Calendar, Trash2 } from 'lucide-react'
import { API } from '../services/api'
import './ChatHistory.css'

function ChatHistory({ onSelectChat }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      setLoading(true)
      const chats = await API.getChats()
      setChats(chats)
      setError(null)
    } catch (err) {
      setError('Failed to load chats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (chatId, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this chat?')) return

    try {
      await API.deleteChat(chatId)
      await loadChats()
    } catch (err) {
      setError('Failed to delete chat')
      console.error(err)
    }
  }

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={32} />
          Chat History
        </h1>
      </div>

      <div className="chat-history-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-600 text-center py-8">Loading chats...</p>}

        {!loading && chats.length === 0 && (
          <p className="text-gray-500 text-center py-8">No chats yet. Start a new chat to get started!</p>
        )}

        {!loading && chats.length > 0 && (
          <div className="chats-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="chat-item"
              >
                <div className="chat-item-left">
                  <div className="chat-icon">
                    <MessageSquare size={20} />
                  </div>
                  <div className="chat-item-info">
                    <h3 className="chat-item-title">{chat.title}</h3>
                    <div className="chat-item-meta">
                      <Calendar size={14} />
                      <span>
                        {new Date(chat.created_at).toLocaleDateString()} at{' '}
                        {new Date(chat.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="chat-item-actions">
                  <span className="message-count">
                    {chat.messages?.length || 0} messages
                  </span>
                  <button
                    onClick={(e) => handleDelete(chat.id, e)}
                    className="btn-delete-chat"
                    title="Delete chat"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatHistory
