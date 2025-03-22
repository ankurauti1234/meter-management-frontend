// app/meter-management/layout.jsx
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
      { value: "event-stream", label: "Event Stream", path: "/meter-management/event-stream" },
      { value: "event-types", label: "Event Types", path: "/meter-management/event-types" },
      { value: "alerts", label: "Alerts", path: "/meter-management/alerts" },
      { value: "reports", label: "Reports", path: "/meter-management/reports" },
    { value: "config", label: "Configuration", path: "/meter-management/config" },
    { value: "ota", label: "OTA", path: "/meter-management/ota" },
    { value: "decommission", label: "Decommission", path: "/meter-management/decommission" },
  ];

  // Determine active tab based on current pathname
  const activeTab = tabs.find(tab => pathname === tab.path)?.value || "event-stream";

  // Handle tab change
  const handleTabChange = (value) => {
    const selectedTab = tabs.find(tab => tab.value === value);
    if (selectedTab) {
      router.push(selectedTab.path);
    }
  };

  return (
    <div className="flex flex-col h-full">
     
      <div className="flex-1 overflow-auto container mx-auto ">
      <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-7 mb-4 bg-card pb-4 border">
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