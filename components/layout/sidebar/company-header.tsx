"use client";

import * as React from "react";
import Image from "next/image";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function CompanyHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 h-8"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-white">
            <Image
              src="/indi-logo.png"
              alt="Inditronics Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold">
              Indirex Studio
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Device Management
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}