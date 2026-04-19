import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FileText, MessageSquare, History } from "lucide-react"

const menuItems: MenuItem[] = [
  { id: 'new_chat', icon: MessageSquare, label: 'New Chat', title: 'Start a new chat', path: '/' },
  { id: 'knowledge_base', icon: FileText, label: 'Knowledge Base', title: 'Manage Knowledge Bases', path: '/knowledge-base' },
  { id: 'chat_history', icon: History, label: 'Chat History', title: 'View previous chats', path: '/history' },
]

export function AppSidebar() {
  const path = window.location.pathname
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup >
          <SidebarGroupContent>
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}