"use client";

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import AppHeader from "@/components/layout/header/app-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <Content>{children}</Content>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Content({ children }: { children: React.ReactNode }) {

  return <main className="p-4">{children}</main>;
}
