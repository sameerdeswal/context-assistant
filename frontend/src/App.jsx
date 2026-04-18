import { useState } from 'react'
import Sidebar from './components/Sidebar'
import KnowledgeBase from './components/KnowledgeBase'
import ChatWindow from './components/ChatWindow'
import ChatHistory from './components/ChatHistory'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('new_chat')
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [selectedKbId, setSelectedKbId] = useState(null)

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId)
    setCurrentView('chat_detail')
  }

  const handleNewChat = () => {
    setSelectedChatId(null)
    setCurrentView('new_chat')
  }

  return (
    <div className="flex h-screen">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="flex-1 overflow-hidden">
        {currentView === 'knowledge_base' && (
          <KnowledgeBase />
        )}
        
        {(currentView === 'new_chat' || currentView === 'chat_detail') && (
          <ChatWindow 
            chatId={selectedChatId}
            knowledgeBaseId={selectedKbId}
            onNewChat={handleNewChat}
          />
        )}
        
        {currentView === 'chat_history' && (
          <ChatHistory 
            onSelectChat={handleSelectChat}
          />
        )}
      </div>
    </div>
  )
}

export default App
