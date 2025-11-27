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
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle but clearly visible grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 select-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* Your actual page content */}
      <div className="relative z-0 p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}