"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Signal } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface CityLocation {
  id: string;
  name: string;
  region: string;
  activeDevices: number;
  totalMeters: number;
  lat: number;
  lng: number;
}

const CITIES: CityLocation[] = [
  { id: "yerevan", name: "Yerevan", region: "Capital District", activeDevices: 284, totalMeters: 290, lat: 40.1792, lng: 44.4991 },
  { id: "gyumri", name: "Gyumri", region: "Shirak Province", activeDevices: 62, totalMeters: 65, lat: 40.7942, lng: 43.8453 },
  { id: "vanadzor", name: "Vanadzor", region: "Lori Province", activeDevices: 41, totalMeters: 45, lat: 40.8074, lng: 44.4970 },
  { id: "armavir", name: "Armavir", region: "Armavir Province", activeDevices: 23, totalMeters: 24, lat: 40.1544, lng: 44.0384 },
  { id: "kapan", name: "Kapan", region: "Syunik Province", activeDevices: 11, totalMeters: 12, lat: 39.2075, lng: 46.4058 },
  { id: "hrazdan", name: "Hrazdan", region: "Kotayk Province", activeDevices: 18, totalMeters: 20, lat: 40.5000, lng: 44.7667 },
  { id: "dilijan", name: "Dilijan", region: "Tavush Province", activeDevices: 14, totalMeters: 15, lat: 40.7417, lng: 44.8639 },
];

const LeafletMap = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[440px] rounded-lg border bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
      Loading Armenia OpenStreetMap...
    </div>
  ),
});

export function ArmeniaMap() {
  const [selectedCity, setSelectedCity] = useState<CityLocation>(CITIES[0]);

  const totalActive = CITIES.reduce((acc, c) => acc + c.activeDevices, 0);
  const totalFleet = CITIES.reduce((acc, c) => acc + c.totalMeters, 0);

  return (
    <Card className="w-full h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
            Active Devices - Armenia
          </CardTitle>
          <CardDescription className="text-xs">
            Real-time OpenStreetMap telemetry distribution across Armenia
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
            {totalActive} / {totalFleet} Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        {/* OpenStreetMap Container */}
        <div className="relative w-full h-[440px] rounded-lg border overflow-hidden shadow-xs flex-1">
          <LeafletMap
            cities={CITIES}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
          />
        </div>

        {/* Selected City Details */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Signal className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{selectedCity.name}</p>
              <p className="text-[11px] text-muted-foreground">{selectedCity.region}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-foreground text-sm">
              {selectedCity.activeDevices} <span className="text-xs text-muted-foreground font-normal">meters online</span>
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">99.2% Uptime</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
