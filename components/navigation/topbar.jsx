// components/navigation/topbar.jsx
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Bell, MagnifyingGlass, House } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import Cookies from "js-cookie";

const Topbar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState({ name: "", role: "", avatarUrl: "" });

  useEffect(() => {
    // Fetch user data from cookies
    const userName = Cookies.get("userName");
    const userRole = Cookies.get("userRole");

    // Set user data
    setUser({
      name: userName || "Guest",
      role: userRole || "User",
      avatarUrl: "/avatars/default-avatar.jpg", // Replace with actual path or URL
    });
  }, []);

  // Convert pathname to breadcrumb items, excluding the root
  const pathSegments = pathname.split("/").filter((segment) => segment);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const isLast = index === pathSegments.length - 1;
    return { label: segment.charAt(0).toUpperCase() + segment.slice(1), href, isLast };
  });

  return (
    <header className=" z-10 bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center justify-between h-12 px-4">
        {/* Breadcrumbs */}
        <Breadcrumb className="bg-card p-1 px-3 border rounded-lg">
          <BreadcrumbList>
            {/* Home Icon as first item */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1">
                  <House className="h-4 w-4" weight="duotone" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {/* Separator after Home */}
            {breadcrumbs.length > 0 && <BreadcrumbSeparator />}

            {/* Rest of the breadcrumbs */}
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem className="font-semibold">
                  {crumb.isLast ? (
                    <BreadcrumbPage className="text-foreground font-semibold">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side with search, bell, and avatar */}
        <div className="flex items-center gap-4">
          <div className="relative bg-card border rounded-lg">
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-8"
            />
            <MagnifyingGlass
              weight="duotone"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50"
            />
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" weight="duotone" />
          </Button>
          {/* Avatar with Dropdown */}
          <div className="flex items-center gap-2 p-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-foreground/70">{user.role}</p>
                </div>
              </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;