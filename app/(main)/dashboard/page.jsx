"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import BarChart1 from "./bar-chart";
import dynamic from "next/dynamic"; // Import dynamic for client-side-only loading
import DeviceAlerts from "./alerts";

// Dynamically import DeviceLocationMap with SSR disabled
const DeviceLocationMap = dynamic(() => import("./map"), {
  ssr: false, // Disable server-side rendering for this component
});

export default function Page() {
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("User"); // Default fallback name
  
  // Function to determine greeting based on hour
  const getGreeting = (hour) => {
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };
  
  // Update greeting and time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setGreeting(getGreeting(now.getHours()));
    };
    
    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  
  // Get username from cookies on component mount
  useEffect(() => {
    const cookieUserName = Cookies.get("userName");
    if (cookieUserName) {
      setUserName(cookieUserName);
    }
  }, []);
  
  // Format time as HH:MM:SS AM/PM
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  
  return (
    <div className="flex flex-1 flex-col gap-4 container mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-2xl font-bold text-secondary">Hi {userName},</p>
          <h1 className="text-4xl font-semibold">{greeting}</h1>
        </div>
        <h2 className="text-2xl font-normal ml-2 text-muted-foreground">
          {formatTime(currentTime)}
        </h2>
      </div>
      <div className="flex lg:flex-row flex-col gap-4 h-full">
        <BarChart1 />
        <DeviceLocationMap />
      </div>
      <DeviceAlerts />
    </div>
  );
}