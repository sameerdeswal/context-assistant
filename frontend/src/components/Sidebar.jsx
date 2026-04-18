import { useState } from 'react'
import { FileText, MessageSquare, History, Plus } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ currentView, onViewChange }) {
  const [isHovering, setIsHovering] = useState(null)

  const menuItems = [
    { id: 'knowledge_base', icon: FileText, label: 'Knowledge Base', title: 'Manage Knowledge Bases' },
    { id: 'new_chat', icon: MessageSquare, label: 'New Chat', title: 'Start a new chat' },
    { id: 'chat_history', icon: History, label: 'Chat History', title: 'View previous chats' },
  ]

  return (
    <div className="sidebar w-20 flex flex-col items-center py-6 space-y-8 shadow-lg">
      <div className="logo-icon w-12 h-12 bg-zinc-900 text-zinc-100 rounded-lg flex items-center justify-center font-bold text-lg">
        CA
      </div>

      <nav className="flex flex-col space-y-6 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => onViewChange(item.id)}
                onMouseEnter={() => setIsHovering(item.id)}
                onMouseLeave={() => setIsHovering(null)}
                className={`sidebar-icon w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : '  hover:bg-zinc-200'
                }`}
                title={item.title}
              >
                <Icon size={24} />
              </button>
              
              {isHovering === item.id && (
                <div className="tooltip absolute left-20 bg-zinc-800 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* <button className="settings-icon w-12 h-12 bg-gray-800 text-gray-400 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-all">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 11-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0m-9.75 0h9.75" />
        </svg>
      </button> */}
    </div>
  )
}

export default Sidebar
