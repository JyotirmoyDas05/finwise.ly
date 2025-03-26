"use client"

import { useState, useEffect } from "react"
import { Home, Wallet, BookOpen, Target, MessageSquare, Settings, Moon, Sun, LogOut } from "lucide-react"
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

  const menuItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "finances", label: "My Finances", icon: Wallet, href: "/dashboard/finances" },
    { id: "learn", label: "Learn Finance", icon: BookOpen, href: "/dashboard/learn" },
    { id: "goals", label: "Set Goals & Track", icon: Target, href: "/dashboard/goals" },
    { id: "ask", label: "Ask AI", icon: MessageSquare, href: "/dashboard/ask" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]

  const handleMenuClick = (href: string) => {
    router.push(href);
  };

  // Determine active item based on current pathname
  const getActiveItem = () => {
    const currentPath = pathname || "/dashboard";
    const item = menuItems.find(item => currentPath === item.href);
    return item?.id || "home";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-normal text-lg">F</div>
          <h2 className="font-semibold text-lg">FinWise.ly</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleMenuClick(item.href)}
                isActive={getActiveItem() === item.id}
                className="w-full"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData?.profile.image || "/placeholder.svg"} alt={userData?.profile.name} />
              <AvatarFallback>{userData?.profile.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{userData?.profile.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="rounded-xl hover:bg-accent"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
              aria-label="Logout"
              className="rounded-xl hover:bg-accent"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-center text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="#" className="text-primary underline hover:text-primary/90 rounded-lg">
              Contact Support
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}