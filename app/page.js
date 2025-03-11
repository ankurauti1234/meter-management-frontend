"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to dashboard on load
    router.push("/dashboard");
  }, [router]);

  // Return a minimal loading state during the brief redirect period
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  );
}