// app/page.tsx
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Cloud,
  Smartphone,
  BarChart3,
  LogIn,
  Gauge,
  Cpu,
  Settings,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-muted/30 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12 py-16">
          {/* Logo + Brand */}
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-6 inline-block">
                <Cpu className="h-16 w-16 text-primary" />
              </div>
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Indirex Studio
              </h1>
              <p className="text-2xl md:text-3xl font-medium text-primary mt-4">
                APM Device Management Portal
              </p>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Internal operations platform for managing, monitoring, and updating
              Inditronics smart meters (APM series) at scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" asChild className="text-lg px-10">
                <Link href="/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  Login to Studio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Core Capabilities</Badge>
            <h2 className="text-4xl font-bold">Built for Inditronics Field Teams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Gauge className="h-10 w-10" />,
                title: "Real-time APM Telemetry",
                desc: "Live voltage, current, power factor, and tamper events from all deployed meters",
              },
              {
                icon: <Cloud className="h-10 w-10" />,
                title: "Secure OTA Updates",
                desc: "Push firmware updates to thousands of APM meters with full rollback support",
              },
              {
                icon: <Settings className="h-10 w-10" />,
                title: "Bulk Meter Provisioning",
                desc: "Upload meter inventory, assign to AWS groups, and sync registration status instantly",
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: "AWS IoT Core Integration",
                desc: "Mutual TLS, automatic cert rotation, and fine-grained policy control",
              },
              {
                icon: <BarChart3 className="h-10 w-10" />,
                title: "Event & Audit Reports",
                desc: "Download tamper, power-off, and configuration change logs in CSV/Excel",
              },
              {
                icon: <Smartphone className="h-10 w-10" />,
                title: "Field Engineer Access",
                desc: "Mobile-friendly interface for on-site meter commissioning and diagnostics",
              },
            ].map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Indirex Studio — Your APM Control Center
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Internal tool • Restricted access • For authorized Inditronics personnel only
          </p>
          <Button size="lg" asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" />
              Sign In to Indirex Studio
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Inditronics Pvt Ltd. Indirex Studio — Internal Device Management Platform</p>
        </div>
      </footer>
    </>
  );
}