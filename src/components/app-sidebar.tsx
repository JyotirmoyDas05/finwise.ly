"use client"

import { useState } from "react"
import { Home, Wallet, BookOpen, Target, MessageSquare, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AppSidebar() {
  const { theme, setTheme } = useTheme()
  const [activeItem, setActiveItem] = useState("home")

  const menuItems = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "finances", label: "My Finances", icon: Wallet, href: "/finances" },
    { id: "learn", label: "Learn Finance", icon: BookOpen, href: "/learn" },
    { id: "goals", label: "Set Goals & Track", icon: Target, href: "/goals" },
    { id: "ask", label: "Ask AI", icon: MessageSquare, href: "/ask" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1 rounded">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">FinEasy</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                isActive={activeItem === item.id}
                onClick={() => setActiveItem(item.id)}
                tooltip={item.label}
              >
                <a href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Rahul</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
        <div className="text-xs text-center text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="#" className="text-primary underline">
              Contact Support
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
} 