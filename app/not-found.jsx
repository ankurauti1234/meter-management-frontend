'use client'
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full shadow-lg border-muted">
        <CardHeader className="flex flex-col items-center pt-6">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <p className="text-2xl font-semibold mt-2">Page Not Found</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>We couldn't find that page</AlertTitle>
            <AlertDescription>
              The page you're looking for may have been moved, deleted, or never existed.
            </AlertDescription>
          </Alert>

          <div className="flex w-full items-center justify-center">
            <Image
              src="/assets/Page_not_found.png"
              alt="Page not found illustration"
              width={300}
              height={200}
              className="object-cover w-96"
              priority
            />
          </div>
          
          <p className="text-muted-foreground text-center mb-4">
            You can return to our homepage or try refreshing the page.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4 pb-6">
          <Button asChild variant="default">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}