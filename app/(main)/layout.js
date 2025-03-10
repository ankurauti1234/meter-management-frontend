"use client"
import Sidebar from "@/components/navigation/sidebar";
import Topbar from "@/components/navigation/topbar";
import { Toaster } from "@/components/ui/toaster";

export default function MainLayout({ children }) {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar />
        <main className="flex-1 overflow-auto  container-grid dark:container-grid-dark">
        <Topbar />
         <div className="p-4">
         {children}
         </div>
        </main>
    
      <Toaster />
    </div>
  );
}