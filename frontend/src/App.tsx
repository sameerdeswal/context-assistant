import { CSSProperties, useState } from 'react'
import Sidebar, { type AppView } from './components/Sidebar'
import KnowledgeBase from './components/KnowledgeBase'
import ChatWindow from './components/ChatWindow'
import ChatHistory from './components/ChatHistory'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { BrowserRouter, Route, Routes } from "react-router";
import useApp from './stores/appStore'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('new_chat')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedKbId] = useState<string | null>(null)

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setCurrentView('chat_detail')
  }

  const handleNewChat = () => {
    setSelectedChatId(null)
    setCurrentView('new_chat')
  }

  return (
    <>
      <BrowserRouter>
        {/* <ScrollToTop /> */}
        <Routes>
          <Route index path="/" element={<Layout >
            <ChatWindow chatId={selectedChatId}
              knowledgeBaseId={selectedKbId}
              onNewChat={handleNewChat} />
          </Layout>} />
          <Route path="/history" element={<Layout>
            <ChatHistory onSelectChat={handleSelectChat} />
          </Layout>} />
          <Route path="/knowledge-base" element={<Layout>
            <KnowledgeBase />
          </Layout>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
//     <div className="flex h-screen w-full">
//       <SidebarProvider>
//         <AppSidebar />
//         <main>
//           <SidebarTrigger />
//           {children}
//         </main>
//       </SidebarProvider>


//       <div className="flex-1 overflow-hidden">
//         {currentView === 'knowledge_base' && (
//           <KnowledgeBase />
//         )}

//         {(currentView === 'new_chat' || currentView === 'chat_detail') && (
//           <ChatWindow
//             chatId={selectedChatId}
//             knowledgeBaseId={selectedKbId}
//             onNewChat={handleNewChat}
//           />
//         )}

//         {currentView === 'chat_history' && (
//           <ChatHistory
//             onSelectChat={handleSelectChat}
//           />
//         )}
//       </div>
//     </div>
//   )
// }
function Layout({ children }: { children: React.ReactNode }) {
  const appStore = useApp()
  return (
    <div className="flex h-screen w-full">
      <SidebarProvider style={{
        "--sidebar-width": "12rem",
        "--sidebar-width-mobile": "14rem",
      } as CSSProperties}>
        <AppSidebar />
        <SidebarInset>
          <div className='p-3 flex gap-2 items-center'>
            <SidebarTrigger />
            <span className=' font-bold'>{appStore.heading}</span>
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default App
