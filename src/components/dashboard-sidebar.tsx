"use client"

import { useState, useEffect } from "react"
import { Home, Wallet, BookOpen, Target, MessageSquare, Settings, Moon, Sun, LogOut, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"
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
import { useAuth } from "@/app/context/AuthContext"
import { db } from "@/app/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface UserProfile {
  profile: {
    name: string;
    image: string;
  };
}

export function DashboardSidebar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to user document changes
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserProfile);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const menuItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "finances", label: "My Finances", icon: Wallet, href: "/dashboard/finance" },
    { id: "learn", label: "Learn Finance", icon: BookOpen, href: "/dashboard/learn" },
    { id: "goals", label: "Set Goals & Track", icon: Target, href: "/dashboard/goals" },
    { id: "ask", label: "Ask AI", icon: MessageSquare, href: "/dashboard/ask" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]

  const handleMenuClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  // Determine active item based on current pathname
  const getActiveItem = () => {
    const currentPath = pathname || "/dashboard";
    const item = menuItems.find(item => currentPath === item.href);
    return item?.id || "home";
  };

  return (
    <>
      {/* Mobile menu button - fixed to the top of the screen */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-full h-10 w-10 bg-white dark:bg-gray-900 shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar component - hidden on mobile, shown on larger screens */}
      <Sidebar 
        className={cn(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64 min-h-screen z-50 transition-all duration-300",
          "fixed md:static", // Fixed on mobile, static on desktop
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0" // Move off-screen when closed on mobile
        )}
      >
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-19 h-18 flex items-center justify-center">
              <img 
                src="/FinWise.ly_logo.svg" 
                alt="FinWise.ly" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              FinWise.ly
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleMenuClick(item.href)}
                  isActive={getActiveItem() === item.id}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 ${
                    getActiveItem() === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : ''
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${
                    getActiveItem() === item.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="text-base font-medium">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400">
                <AvatarImage src={userData?.profile.image || "/placeholder.svg"} alt={userData?.profile.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">{userData?.profile.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData?.profile.name || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600 dark:text-gray-400" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    await logout();
                    router.push('/login');
                  } catch (error) {
                    console.error('Failed to log out:', error);
                  }
                }}
                className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            <p>
              Need help?{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}