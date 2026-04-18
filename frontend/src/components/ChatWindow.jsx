import { useState, useEffect, useRef } from 'react'
import { Send, Plus } from 'lucide-react'
import { API } from '../services/api'
import './ChatWindow.css'

function ChatWindow({ chatId, knowledgeBaseId, onNewChat }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(chatId)
  const [kbs, setKbs] = useState([])
  const [selectedKb, setSelectedKb] = useState(knowledgeBaseId)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadKnowledgeBases()
  }, [])

  useEffect(() => {
    if (currentChatId) {
      loadChatMessages()
    } else {
      setMessages([])
    }
  }, [currentChatId])

  const loadKnowledgeBases = async () => {
    try {
      const kbs = await API.getKnowledgeBases()
      setKbs(kbs)
    } catch (err) {
      console.error('Failed to load knowledge bases:', err)
    }
  }

  const loadChatMessages = async () => {
    try {
      setLoading(true)
      const chat = await API.getChat(currentChatId)
      setMessages(chat.messages || [])
      setError(null)
    } catch (err) {
      setError('Failed to load chat')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartNewChat = async () => {
    try {
      const newChat = await API.createChat(
        `Chat - ${new Date().toLocaleString()}`,
        selectedKb
      )
      setCurrentChatId(newChat.id)
      setMessages([])
      setError(null)
    } catch (err) {
      setError('Failed to create new chat')
      console.error(err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    let targetChatId = currentChatId
    if (!targetChatId) {
      try {
        const newChat = await API.createChat(
          `Chat - ${new Date().toLocaleString()}`,
          selectedKb
        )
        targetChatId = newChat.id
        setCurrentChatId(newChat.id)
      } catch (err) {
        setError('Failed to create new chat')
        return
      }
    }

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Add user message to UI immediately
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMsg])

      // Send to WebSocket
      API.sendChatMessage(targetChatId, userMessage, (response) => {
        if (response.type === 'message') {
          setMessages(prev => [...prev, {
            id: response.id,
            role: response.role,
            content: response.content,
            created_at: new Date().toISOString(),
          }])
        }
      })
    } catch (err) {
      setError('Failed to send message')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <h1 className="chat-title">
            {currentChatId ? 'Chat Conversation' : 'Start a New Chat'}
          </h1>
        </div>
        {currentChatId && (
          <button
            onClick={onNewChat}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus size={18} />
            New Chat
          </button>
        )}
      </div>

      {/* KB Selector */}
      <div className="kb-selector">
        <label className="kb-selector-label">Knowledge Base:</label>
        <select
          value={selectedKb || ''}
          onChange={(e) => setSelectedKb(e.target.value || null)}
          className="input"
          disabled={currentChatId !== null}
        >
          <option value="">None (General Chat)</option>
          {kbs.map((kb) => (
            <option key={kb.id} value={kb.id}>
              {kb.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.length === 0 && !currentChatId && (
          <div className="empty-state">
            <h2 className="empty-state-title">Welcome to Context Assistant</h2>
            <p className="empty-state-subtitle">
              Select a knowledge base and send a message to start chatting
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <p className="message-text">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={currentChatId ? "Type your message..." : "Select KB and start chatting..."}
          className="chat-input"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="chat-send-btn"
          title="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
