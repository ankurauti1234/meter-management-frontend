"use client"; // Required for client-side interactivity in App Router

import { useState, useEffect, Suspense } from "react"; // Add Suspense
import { useSearchParams } from "next/navigation"; // For App Router query params
import axios from "axios";
import { Button } from "@/components/ui/button"; // shadcn/ui Button
import { Input } from "@/components/ui/input"; // shadcn/ui Input
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // shadcn/ui Card
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // shadcn/ui Alert
import { Loader2 } from "lucide-react"; // Icon from shadcn/ui

// Inner component that uses useSearchParams
function ActivateForm() {
  const searchParams = useSearchParams(); // Get query params in App Router
  const [token, setToken] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Extract token from URL on mount
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("No activation token provided.");
    }
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/activate", {
        token,
        otp,
        newPassword,
      });
      setMessage(response.data.message);
      // Optionally redirect to login page after success
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activate Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert variant="success" className="mb-4">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Default export with Suspense boundary
export default function ActivatePage() {
  return (
    <Suspense fallback={<div>Loading activation form...</div>}>
      <ActivateForm />
    </Suspense>
  );
}