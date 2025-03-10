"use client";
import { LoginForm } from "@/components/login/login-form";

export default function Page() {
  return (
    <div className="flex h-screen w-full flex-col p-6 overflow-hidden">
      {/* Logo Container - Absolute positioned at top left */}
      <div className="absolute top-6 left-6 ">
      <img
            src="/assets/logos/rex.svg"
            alt="logo"
            className="rounded-lg h-10"
          />
      </div>
      
      {/* Login Form Container - Centered */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-3xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
} 