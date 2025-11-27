"use client";

import { useRouter } from "next/navigation";
import PixelBlast from "@/components/PixelBlast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, Link } from "lucide-react";

export default function IndirexLanding() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-screen PixelBlast background */}
      <PixelBlast
        variant="circle"
        pixelSize={6}
        color="#3AF16D"
        patternScale={3}
        patternDensity={0.75}
        pixelSizeJitter={0.75}
        speed={0.25}
        edgeFade={0.75}
      />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          {/* Hero */}
          <div className="space-y-4">
            <Badge variant="secondary" className="text-xs font-normal">
              Internal Operations Platform
            </Badge>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              Indirex <span className="text-primary">Studio</span>
            </h1>
            <p className="text-base max-w-2xl mx-auto">
              Device Management Portal for Inditronics People Meters
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="pt-6 gap-4 flex justify-center flex-wrap">
            <Button onClick={handleLogin}>
              <LogIn className="mr-2 h-5 w-5" />
              Login to Studio
            </Button>

            <Button asChild variant="secondary">
              <a
                href="https://inditronics.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link className="mr-2 h-5 w-5" />
                Explore Indivisual
              </a>
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs pt-4 fixed bottom-5 left-1/2 -translate-x-1/2 text-center">
            Restricted access • For authorized Inditronics personnel only
          </p>
        </div>
      </div>
    </div>
  );
}