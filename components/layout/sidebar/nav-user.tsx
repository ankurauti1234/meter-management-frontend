// components/NavUser.tsx
"use client";

import Cookies from "js-cookie";
import { BadgeCheck, Bell, ChevronsUpDown, LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import authService from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;        // UUID as string
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const userCookie = Cookies.get("user");

      if (userCookie) {
        try {
          const parsed = JSON.parse(userCookie);
          // Validate required fields
          if (parsed.id && parsed.name && parsed.email && parsed.role) {
            setUser({
              id: String(parsed.id),
              name: parsed.name,
              email: parsed.email,
              role: parsed.role,
              avatar: parsed.avatar,
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Invalid user cookie:", err);
        }
      }

      // Fallback: fetch from API
      try {
        const res = await authService.getMe();
        if (res.success && res.data.user) {
          const userData: User = {
            id: String(res.data.user.id),
            name: res.data.user.name,
            email: res.data.user.email,
            role: res.data.user.role,
            // avatar: res.data.user.avatar,
          };
          setUser(userData);
          Cookies.set("user", JSON.stringify(userData), { expires: 7 });
        } else {
          Cookies.remove("user");
        }
      } catch (err) {
        console.error("getMe failed:", err);
        Cookies.remove("user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    Cookies.remove("user");
    router.push("/login");
  };


  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="ml-3 h-4 w-32 rounded bg-muted" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent border data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* Non-clickable role display */}
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm opacity-60 cursor-default">
                <Shield className="h-4 w-4" />
                <div className="flex items-center justify-between w-full">
                  <span>Role</span>
                  <span className="text-xs font-medium capitalize bg-muted px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>
              </div>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Theme switcher */}
           
            <DropdownMenuItem onClick={handleLogout} className="text-destructive group hover:bg-destructive/50">
              <LogOut className="mr-2 h-4 w-4 text-destructive group-hover:text-foreground" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}