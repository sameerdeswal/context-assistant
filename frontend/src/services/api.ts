import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export type SourceType = 'text' | 'pdf' | 'csv' | 'txt'

export interface KnowledgeBaseChunk {
  id: string
  content: string
  chunk_index: number
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  source_type: SourceType
  created_at: string
  updated_at: string
  chunks: KnowledgeBaseChunk[]
}

export interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

export interface Chat {
  id: string
  title: string
  knowledge_base_id: string | null
  created_at: string
  updated_at: string
  messages: Message[]
}

export interface WebSocketChatMessage {
  type: string
  role: string
  content: string
  id: string
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let activeWebSocket: WebSocket | null = null

const API = {
  // Knowledge Base endpoints
  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const response = await axiosInstance.get<KnowledgeBase[]>('/api/knowledge-base')
    return response.data
  },

  async createKnowledgeBase(
    name: string,
    sourceType: SourceType,
    file: File | null,
    textContent = ''
  ): Promise<KnowledgeBase> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('source_type', sourceType)
    formData.append('description', `Created on ${new Date().toLocaleDateString()}`)
    if (sourceType === 'text' && textContent) {
      formData.append('text_content', textContent)
    }
    if (file) {
      formData.append('file', file)
    }

    const response = await axiosInstance.post<KnowledgeBase>('/api/knowledge-base', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getKnowledgeBase(kbId: string): Promise<KnowledgeBase> {
    const response = await axiosInstance.get<KnowledgeBase>(`/api/knowledge-base/${kbId}`)
    return response.data
  },

  async deleteKnowledgeBase(kbId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/api/knowledge-base/${kbId}`)
    return response.data
  },

  // Chat endpoints
  async getChats(): Promise<Chat[]> {
    const response = await axiosInstance.get<Chat[]>('/api/chats')
    return response.data
  },

  async createChat(title: string, knowledgeBaseId: string | null = null): Promise<Chat> {
    const response = await axiosInstance.post<Chat>('/api/chats', {
      title,
      knowledge_base_id: knowledgeBaseId,
    })
    return response.data
  },

  async getChat(chatId: string): Promise<Chat> {
    const response = await axiosInstance.get<Chat>(`/api/chats/${chatId}`)
    return response.data
  },

  async deleteChat(chatId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/api/chats/${chatId}`)
    return response.data
  },

  // WebSocket chat
  sendChatMessage(
    chatId: string,
    message: string,
    onMessage: (response: WebSocketChatMessage) => void
  ): void {
    const wsUrl = `${WS_URL}/api/chats/ws/${chatId}`

    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      // Reuse existing connection
      const socket = activeWebSocket
      socket.send(JSON.stringify({ message }))
    } else {
      // Create new connection
      activeWebSocket = new WebSocket(wsUrl)

      activeWebSocket.onopen = () => {
        activeWebSocket?.send(JSON.stringify({ message }))
      }

      activeWebSocket.onmessage = (event: MessageEvent<string>) => {
        const data: WebSocketChatMessage = JSON.parse(event.data)
        onMessage(data)
      }

      activeWebSocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      activeWebSocket.onclose = () => {
        activeWebSocket = null
      }
    }
  },

  closeWebSocket() {
    if (activeWebSocket) {
      activeWebSocket.close()
      activeWebSocket = null
    }
  },
}


export default API