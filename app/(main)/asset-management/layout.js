// app/asset-management/layout.jsx
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export default function MeterManagementLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Define tab routes
  const tabs = [
    { value: "inventory", label: "Inventory", path: "/asset-management/inventory" },
    { value: "master-data", label: "Master Data", path: "/asset-management/master-data" },
    { value: "file-upload", label: "File Upload", path: "/asset-management/file-upload" },
    { value: "hh-info", label: "HH Info", path: "/asset-management/hh-info" },
    { value: "install-asset", label: "Install Assets", path: "/asset-management/install-assets" },
  ];
  

  // Determine active tab based on current pathname
  const activeTab = tabs.find(tab => pathname === tab.path)?.value || "inventory";

  // Handle tab change
  const handleTabChange = (value) => {
    const selectedTab = tabs.find(tab => tab.value === value);
    if (selectedTab) {
      router.push(selectedTab.path);
    }
  };

  return (
    <div className="flex flex-col h-full">
     
      <div className="flex-1 overflow-auto container mx-auto p-4">
      <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 mb-4 bg-card pb-4 border">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-primary/5 data-[state=active]:text-secondary data-[state=active]:shadow-inner rounded"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {children}
      </div>
    </div>
  );
}