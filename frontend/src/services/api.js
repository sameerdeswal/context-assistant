import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let activeWebSocket = null

export const API = {
  // Knowledge Base endpoints
  async getKnowledgeBases() {
    const response = await axiosInstance.get('/api/knowledge-base')
    return response.data
  },

  async createKnowledgeBase(name, sourceType, file, textContent = '') {
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

    const response = await axiosInstance.post('/api/knowledge-base', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getKnowledgeBase(kbId) {
    const response = await axiosInstance.get(`/api/knowledge-base/${kbId}`)
    return response.data
  },

  async deleteKnowledgeBase(kbId) {
    const response = await axiosInstance.delete(`/api/knowledge-base/${kbId}`)
    return response.data
  },

  // Chat endpoints
  async getChats() {
    const response = await axiosInstance.get('/api/chats')
    return response.data
  },

  async createChat(title, knowledgeBaseId = null) {
    const response = await axiosInstance.post('/api/chats', {
      title,
      knowledge_base_id: knowledgeBaseId,
    })
    return response.data
  },

  async getChat(chatId) {
    const response = await axiosInstance.get(`/api/chats/${chatId}`)
    return response.data
  },

  async deleteChat(chatId) {
    const response = await axiosInstance.delete(`/api/chats/${chatId}`)
    return response.data
  },

  // WebSocket chat
  sendChatMessage(chatId, message, onMessage) {
    const wsUrl = `${WS_URL}/api/chats/ws/${chatId}`

    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      // Reuse existing connection
      activeWebSocket.send(JSON.stringify({ message }))
    } else {
      // Create new connection
      activeWebSocket = new WebSocket(wsUrl)

      activeWebSocket.onopen = () => {
        activeWebSocket.send(JSON.stringify({ message }))
      }

      activeWebSocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
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
