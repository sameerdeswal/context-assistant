import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import API, { Chat } from "@/services/api"
import { FileText, MessageSquare, History, BrainIcon, BrainCogIcon, Trash2, Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { useTheme } from "./theme-provider"

const menuItems: MenuItem[] = [
  { id: 'new_chat', icon: MessageSquare, label: 'New Chat', title: 'Start a new chat', path: '/' },
  { id: 'knowledge_base', icon: BrainCogIcon, label: 'Knowledge Base', title: 'Manage Knowledge Bases', path: '/knowledge-base' },
  // { id: 'chat_history', icon: History, label: 'Chat History', title: 'View previous chats', path: '/history' },
]

export function AppSidebar() {
  const path = window.location.pathname
  const [chats, setChats] = useState<Chat[]>([])

  const { open } = useSidebar();
  const { setTheme } = useTheme()

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const chats = await API.getChats()
      setChats(chats)
    } catch (err) {
      setChats([])
      console.error('Failed to load chats:', err)
    }
  }

  function deleteChat(chatId: string) {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      API.deleteChat(chatId)
        .then(() => {
          loadChats()
          if (path === `/chats/${chatId}`) {
            window.location.href = '/'
          }
        })
        .catch((err) => {
          console.error('Failed to delete chat:', err)
        })
    }
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Context Assistant">
              <a href="/">
                <BrainIcon className="" />
                <span className="font-semibold" >Context Assistant</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
       
        <SidebarGroup >
           <SidebarGroupContent>
             <SidebarMenu>
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
               
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={item.path === path}>
                    <a href={`${item.path}`}>
                      <Icon type={item.icon} ></Icon>
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
              )
            })
            }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {
          chats.length > 0 && open && (
            <SidebarGroup >
              <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                {chats.slice(0, 5).map((chat: any) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild tooltip={chat.title} isActive={path === `/chats/${chat.id}`}>
                      <a href={`/chats/${chat.id}`}>
                        <span>{chat.title}</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuAction onClick={() => deleteChat(chat.id)}>
                      <Trash2></Trash2>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        }
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}