// app/not-found.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-foreground/70 max-w-md">
          Oops! It seems we can&apos;t find the page you&apos;re looking for. 
          The page may have been moved or deleted.
        </p>
        <Button asChild variant="default" className="mt-4">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" weight="duotone" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}