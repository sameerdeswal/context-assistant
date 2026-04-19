import { useState } from 'react'
import { FileText, MessageSquare, History } from 'lucide-react'
import { Button } from './ui/button'

export type AppView = 'knowledge_base' | 'new_chat' | 'chat_history' | 'chat_detail'

interface SidebarProps {
  currentView: AppView
  onViewChange: (view: AppView) => void
}

type SidebarMenuView = Exclude<AppView, 'chat_detail'>

interface MenuItem {
  id: SidebarMenuView
  icon: typeof FileText
  label: string
  title: string
}

function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isHovering, setIsHovering] = useState<SidebarMenuView | null>(null)

  const menuItems: MenuItem[] = [
    { id: 'knowledge_base', icon: FileText, label: 'Knowledge Base', title: 'Manage Knowledge Bases' },
    { id: 'new_chat', icon: MessageSquare, label: 'New Chat', title: 'Start a new chat' },
    { id: 'chat_history', icon: History, label: 'Chat History', title: 'View previous chats' },
  ]

  return (
    <div className="w-20 flex flex-col items-center p-3 border-r">
      <nav className="flex flex-col space-y-6 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <div key={item.id} className="relative">
              <Button
                onClick={() => onViewChange(item.id)}
                onMouseEnter={() => setIsHovering(item.id)}
                onMouseLeave={() => setIsHovering(null)}
                variant={isActive ? 'default' : 'ghost'}
                size="icon"
                title={item.title}>
                <Icon className='size-8'   />
              </Button>
              
              {isHovering === item.id && (
                <div className="tooltip absolute left-14 top-0 bg-zinc-800 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
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
