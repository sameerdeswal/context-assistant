import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Send, Plus, ArrowUpIcon, DotIcon, CircleEllipsisIcon } from 'lucide-react'
import API, {
  type Chat,
  type KnowledgeBase,
  type Message,
  type WebSocketChatMessage,
} from '@/services/api'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import useApp from '@/stores/appStore'
import { useNavigate, useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatWindowProps {
  chatId: string | null
  knowledgeBaseId: string | null
  onNewChat: () => void
}

function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { chatId } = useParams();
  const navigate = useNavigate()
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId || undefined)
  // const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  // const [selectedKb, setSelectedKb] = useState<string | null>(knowledgeBaseId)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const appStore = useApp()

  useEffect(() => {
    appStore.setHeading(currentChatId ? 'Chat Conversation' : 'New Chat')
  }, [])

  useEffect(() => {
    setCurrentChatId(chatId)
  }, [chatId])

  // useEffect(() => {
  //   setSelectedKb(knowledgeBaseId)
  // }, [knowledgeBaseId])

  // useEffect(() => {
  //   loadKnowledgeBases()
  // }, [])

  useEffect(() => {
    if (currentChatId) {
      loadChatMessages()
    } else {
      setMessages([])
    }
  }, [currentChatId])

  // const loadKnowledgeBases = async () => {
  //   try {
  //     const kbs = await API.getKnowledgeBases()
  //     setKbs(kbs)
  //   } catch (err) {
  //     console.error('Failed to load knowledge bases:', err)
  //   }
  // }

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

      {/* Messages Area */}
      <div className="flex flex-col flex-1 w-full overflow-y-auto">
        {messages.length === 0 && !currentChatId && (
          <div className="flex-1 text-center items-center justify-center flex-col flex gap-3 ">
            <h2 className="font-semibold text-lg">Welcome to Context Assistant</h2>
            <p className="empty-state-subtitle">
              Ask questions and get answers based on your knowledge base.
            </p>
          </div>
        )}

        {(messages.length > 0 || currentChatId) && (
          <div className='mt-auto'></div>
        )}


        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 w-full mt-2">
            <div className={`flex w-[90%] p-2 rounded-lg ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start bg-muted'} `}>
              <div className="max-w-none text-sm leading-6 break-words [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_code]:bg-background/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-background/70 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}


        <div className=' p-2'>
          {loading && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style={{ opacity: 1 }}><circle cx="4" cy="12" r="3" fill="currentColor"><animate id="SVG7x14Dcom" fill="freeze" attributeName="opacity" begin="0;SVGqSjG0dUp.end-0.25s" dur="0.75s" values="1;.2" /></circle><circle cx="12" cy="12" r="3" fill="currentColor" opacity=".4"><animate fill="freeze" attributeName="opacity" begin="SVG7x14Dcom.begin+0.15s" dur="0.75s" values="1;.2" /></circle><circle cx="20" cy="12" r="3" fill="currentColor" opacity=".3"><animate id="SVGqSjG0dUp" fill="freeze" attributeName="opacity" begin="SVG7x14Dcom.begin+0.3s" dur="0.75s" values="1;.2" /></circle></svg>
          )}
        </div>


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
          placeholder="Type your message..."
          disabled={loading}
          className='border-none focus:ring-0 focus-visible:ring-0 resize-none'
        />
        <Button
          variant="default"
          size="icon-sm"
          title="Send message" className={`rounded-full ${!input.trim() ? "opacity-0" : 'opacity-100'}`}>
          <ArrowUpIcon />
        </Button>
      </form>
    </div>
  )
}
export default ChatWindow
