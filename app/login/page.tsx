import { Cpu } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-8 py-6 border-b">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <Cpu className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Indirex Studio</h2>
            <p className="text-xs text-muted-foreground">Device Management Portal</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 Inditronics Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Visual/Image */}
      <div className="relative hidden lg:flex bg-muted items-center justify-center overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[48px_48px]" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        {/* Content Overlay - Replace with your image */}
        <div className="relative z-10 max-w-md text-center space-y-6 px-8">
          {/* Option 1: Use an image */}
          {/* <img
            src="/dashboard-preview.png"
            alt="Indirex Studio Dashboard"
            className="rounded-lg shadow-2xl border"
          /> */}

          {/* Option 2: Text content (current) */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl">
              <Cpu className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-bold">
              Manage Your Fleet
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Monitor, update, and manage thousands of Inditronics people meters 
              in real-time from a single unified platform.
            </p>
          </div>

          {/* Stats or Features */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-1">
              <p className="text-2xl font-bold">5K+</p>
              <p className="text-xs text-muted-foreground">Active Meters</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-muted-foreground">Monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}