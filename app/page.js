"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, Key } from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data from cookies
    const userName = Cookies.get("userName");
    const userEmail = Cookies.get("userEmail");
    const userRole = Cookies.get("userRole");
    const userCreatedAt = Cookies.get("userCreatedAt");

    if (userName && userEmail && userRole && userCreatedAt) {
      setUser({
        name: userName,
        email: userEmail,
        role: userRole,
        joinedDate: new Date(userCreatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        lastLogin: new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        }),
        permissions: [
          { name: "Project Management", access: userRole === "admin" || userRole === "developer" },
          { name: "Analytics Dashboard", access: userRole === "admin" || userRole === "executive" },
          { name: "Team Collaboration", access: true },
          { name: "API Access", access: userRole === "developer" },
          { name: "Billing Management", access: userRole === "admin" },
          { name: "User Management", access: userRole === "admin" },
        ],
      });
    } else {
      // Redirect to login if user data is not available
      router.push("/login");
    }
  }, [router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6 grid gap-8">
          {/* User Profile Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/assets/user-avatar.png" alt={`${user.name}'s avatar`} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="mt-2">
                {user.role}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Joined:</strong> {user.joinedDate}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Last Login:</strong> {user.lastLogin}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">
              Your Access & Features
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-center">Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.permissions?.map((permission, index) => (
                  <TableRow key={index}>
                    <TableCell>{permission.name}</TableCell>
                    <TableCell className="text-center">
                      {permission.access ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGoToDashboard}
              className="w-full max-w-xs"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}