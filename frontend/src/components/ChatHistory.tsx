import { useState, useEffect, type MouseEvent } from 'react'
import { MessageSquare, Calendar, Trash2 } from 'lucide-react'
import API, { type Chat } from '@/services/api'
import useApp from '@/stores/appStore'
import { Button } from './ui/button'

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void
}

function ChatHistory({ onSelectChat }: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const appStore = useApp()
  useEffect(() => {
    loadChats()
    appStore.setHeading('Chat History')
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

  const handleDelete = async (chatId: string, e: MouseEvent<HTMLButtonElement>) => {
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
    <div className="flex flex-col h-full flex-1">

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
          <div className="flex flex-col gap-2 px-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="flex items-center justify-between  p-3 border rounded-lg cursor-pointer transition hover:bg-muted"
              >
                <div className="flex flex-col gap-1 ">
                  <div className="flex items-center gap-2 text-left">
                    <MessageSquare size={20} />
                    <div className="flex items-center gap-2 text-left">
                      <h3 className="chat-item-title">{chat.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar size={12} />
                  <span>
                    {new Date(chat.created_at).toLocaleDateString()} at{' '}
                    {new Date(chat.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-muted-foreground">
                    {chat.messages?.length || 0} messages
                  </span>
                  <Button
                    onClick={(e) => handleDelete(chat.id, e)}
                    variant="ghost"
                    size="icon"
                    title="Delete chat"
                  >
                    <Trash2 />
                  </Button>
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
