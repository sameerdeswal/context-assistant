import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Send, Plus, ArrowUpIcon } from 'lucide-react'
import API, {
  type Chat,
  type KnowledgeBase,
  type Message,
  type WebSocketChatMessage,
} from '@/services/api'
import { Button } from './ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import useApp from '@/stores/appStore'

interface ChatWindowProps {
  chatId: string | null
  knowledgeBaseId: string | null
  onNewChat: () => void
}

function ChatWindow({ chatId, knowledgeBaseId, onNewChat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId)
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [selectedKb, setSelectedKb] = useState<string | null>(knowledgeBaseId)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const appStore = useApp()

  useEffect(() => {
    appStore.setHeading(currentChatId ? 'Chat Conversation' : 'New Chat')
  },[])

  useEffect(() => {
    setCurrentChatId(chatId)
  }, [chatId])

  useEffect(() => {
    setSelectedKb(knowledgeBaseId)
  }, [knowledgeBaseId])

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
    if (!currentChatId) {
      return
    }

    try {
      setLoading(true)
      const chat: Chat = await API.getChat(currentChatId)
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

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
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
      API.sendChatMessage(targetChatId, userMessage, (response: WebSocketChatMessage) => {
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
    <div className="flex flex-col flex-1 w-full px-3 pb-3">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="font-semibold flex flex-row gap-2 items-center flex-1">
          <Select onValueChange={(value) => setSelectedKb(value)} value={selectedKb || ""}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue placeholder="General Chat" />
            </SelectTrigger>
            <SelectContent className='focus-visible:right-0'>
              <SelectGroup>
                {kbs.map((kb) => (
                  <SelectItem key={kb.id} value={kb.id} className='focus-visible:ring-0'>
                    {kb.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {currentChatId && (
          <Button
            onClick={onNewChat}
            variant="outline"
          >
            <Plus size={18} />
            New Chat
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex flex-colp-3 items-center justify-center flex-1 w-full gap-3 overflow-y-auto">
        {messages.length === 0 && !currentChatId && (
          <div className="text-center">
            <h2 className="font-semibold text-lg">Welcome to Context Assistant</h2>
            <p className="empty-state-subtitle">
              Select a knowledge base and send a message to start chatting
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            {msg.role !== 'user' ? '🤖' : ''}
            <div className="message-content">
              <p className="message-text">{msg.content}</p>
            </div>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : ''}
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
      <form onSubmit={handleSendMessage} className="flex gap-1 items-end w-full border rounded-lg justify-end p-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={currentChatId ? "Type your message..." : "Select KB and start chatting..."}
          disabled={loading}
          className='border-none focus:ring-0 focus-visible:ring-0 resize-none'
        />
        <Button
          variant="default"
          size="icon-sm"
          title="Send message" className={`rounded-full ${!input.trim() ? "opacity-0":'opacity-100'}`}>
          <ArrowUpIcon />
        </Button>
      </form>
    </div>
  )
}

export default ChatWindow
