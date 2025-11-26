'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, Gauge, Cloud, Shield } from 'lucide-react';

export default function IndirexLanding() {
  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex items-center justify-center">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Gradient Orbs - Very Subtle */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-12">
        
        {/* Badge */}
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-normal">
          Internal Operations Platform
        </Badge>

        {/* Hero Text */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            Indirex Studio
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Device Management Portal for Inditronics People Meters
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: <Gauge className="h-4 w-4" />, text: 'Real-time Telemetry' },
            { icon: <Cloud className="h-4 w-4" />, text: 'OTA Updates' },
            { icon: <Shield className="h-4 w-4" />, text: 'AWS IoT Core' }
          ].map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm"
            >
              <span className="text-primary">{feature.icon}</span>
              <span className="text-foreground/80">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-6">
          <Button size="lg" className="text-base px-10 h-12">
            <LogIn className="mr-2 h-5 w-5" />
            Login to Studio
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground pt-4">
          Restricted access • For authorized Inditronics personnel only
        </p>
      </div>
    </div>
  );
}