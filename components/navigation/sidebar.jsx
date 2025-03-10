"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Broadcast,
  Gauge,
  Layout,
  UsersThree,
  GearSix,
  SignOut,
  ArrowRight,
  FileText,
  ShieldCheck,
  Question,
  Package,
  PlugsConnected,
  CaretDoubleLeft,
  CaretDoubleRight,
} from "@phosphor-icons/react";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    if (storedTheme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleTheme = (checked) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  const mainNavItems = [
    { 
      icon: (isActive) => <Layout className="size-5" weight={isActive ? "fill" : "duotone"} />, 
      label: "Dashboard", 
      href: "/dashboard" 
    },
    { 
      icon: (isActive) => <Package className="size-5" weight={isActive ? "fill" : "duotone"} />, 
      label: "Asset Management", 
      href: "/asset-management" 
    },
    { 
      icon: (isActive) => <Broadcast className="size-5" weight={isActive ? "fill" : "duotone"} />, 
      label: "Live Monitoring", 
      href: "/live-monitoring" 
    },
    { 
      icon: (isActive) => <Gauge className="size-5" weight={isActive ? "fill" : "duotone"} />, 
      label: "Meter Management", 
      href: "/meter-management" 
    },
    { 
      icon: (isActive) => <PlugsConnected className="size-5" weight={isActive ? "fill" : "duotone"} />, 
      label: "Remote Connection", 
      href: "/remote-connection" 
    },
    { 
      icon: (isActive) => <UsersThree className="size-5" weight={isActive ? "fill" : "duotone"} />, 
      label: "User Management", 
      href: "/user-management" 
    },
  ];

  const handleLogout = () => {
    const clearCookies = () => {
      const cookies = document.cookie.split("; ");
      for (let cookie of cookies) {
        const [name] = cookie.split("=");
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    };
    clearCookies();
    router.push("/login");
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside 
      className={`h-screen flex flex-col bg-card border-r-[1px] border-foreground/15 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Logo Section */}
      <div className={`flex items-center justify-center h-20 transition-all duration-300 ${
        isExpanded ? "px-2" : ""
      }`}>
        <img 
          src="/assets/logos/rex.svg"
          alt="logo" 
          className={`transition-all duration-300  object-fill ${
            isExpanded 
              ? "w-full h-12  object-cover" 
              : "w-20 -rotate-90"
          }`}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col">
        <ul className="space-y-1 px-2">
          <TooltipProvider delayDuration={200}>
            {mainNavItems.map((item, index) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={index}>
                  {isExpanded ? (
                    <button
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-muted/30 text-secondary shadow-inner"
                          : "bg-card hover:bg-accent text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      {item.icon(isActive)}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => router.push(item.href)}
                          className={`w-full flex items-center justify-center h-12 rounded transition-all duration-150 ${
                            isActive
                              ? "bg-muted/30 text-secondary shadow-inner"
                              : "bg-card hover:bg-accent"
                          }`}
                        >
                          {item.icon(isActive)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={10}
                        className="bg-foreground text-background font-semibold"
                      >
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </li>
              );
            })}
          </TooltipProvider>
        </ul>
      </nav>

      {/* Expand/Collapse Button and Settings */}
      <div className="px-2 space-y-1 pb-2">


        {/* Settings */}
        <DropdownMenu>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`w-full flex items-center h-12 rounded bg-card hover:bg-accent transition-all duration-150 ${
                      isExpanded ? "px-3 space-x-3" : "justify-center"
                    }`}
                  >
                    <GearSix className="size-5" weight="duotone" />
                    {isExpanded && <span className="text-sm">Settings</span>}
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent
                  side="right"
                  sideOffset={10}
                  className="bg-foreground text-background"
                >
                  <p>Settings</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent side="right" sideOffset={10} className="w-56">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex justify-between items-center cursor-pointer" onClick={() => router.push("/settings")}>
              <div className="flex items-center">
                <GearSix className="mr-2 h-4 w-4" weight="duotone" />
                <span>Settings</span>
              </div>
              <ArrowRight className="h-4 w-4" weight="duotone" />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between items-center cursor-pointer" onClick={() => router.push("/terms-and-conditions")}>
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4" weight="duotone" />
                <span>Terms and Conditions</span>
              </div>
              <ArrowRight className="h-4 w-4" weight="duotone" />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between items-center cursor-pointer" onClick={() => router.push("/privacy-policy")}>
              <div className="flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" weight="duotone" />
                <span>Privacy Policy</span>
              </div>
              <ArrowRight className="h-4 w-4" weight="duotone" />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between items-center cursor-pointer" onClick={() => router.push("/help-center")}>
              <div className="flex items-center">
                <Question className="mr-2 h-4 w-4" weight="duotone" />
                <span>Help Center</span>
              </div>
              <ArrowRight className="h-4 w-4" weight="duotone" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex justify-between items-center cursor-pointer">
              <span>Dark Mode</span>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                className="border border-foreground/50"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <SignOut className="mr-2 h-4 w-4" weight="duotone" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

                {/* Expand/Collapse Button */}
                <button
          onClick={toggleSidebar}
          className={`w-full flex items-center h-12 rounded bg-card hover:bg-accent transition-all duration-150 ${
            isExpanded ? "px-3 space-x-3" : "justify-center"
          }`}
        >
          {isExpanded ? (
            <>
              <CaretDoubleLeft className="size-5" weight="duotone" />
              <span className="text-sm">Collapse</span>
            </>
          ) : (
            <CaretDoubleRight className="size-5" weight="duotone" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;