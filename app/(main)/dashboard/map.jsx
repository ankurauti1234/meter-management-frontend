"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic"; // Use dynamic import for Leaflet components
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

// Dynamically import react-leaflet components with SSR disabled
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });

// Enhanced Pune locations with status
const locations = [
  { lat: 18.5204, lng: 73.8567, name: "Shaniwar Wada", status: "active", deviceId: "METER-001", lastPing: "10 mins ago" },
  { lat: 18.5123, lng: 73.8384, name: "Aga Khan Palace", status: "active", deviceId: "METER-002", lastPing: "15 mins ago" },
  { lat: 18.5529, lng: 73.7739, name: "Sinhagad Fort", status: "inactive", deviceId: "METER-003", lastPing: "3 days ago" },
  { lat: 18.5293, lng: 73.8492, name: "Pataleshwar Cave", status: "active", deviceId: "METER-004", lastPing: "5 mins ago" },
  { lat: 18.5389, lng: 73.8860, name: "Kelkar Museum", status: "active", deviceId: "METER-005", lastPing: "12 mins ago" },
  { lat: 18.5067, lng: 73.8223, name: "Parvati Hill", status: "active", deviceId: "METER-006", lastPing: "8 mins ago" },
  { lat: 18.4801, lng: 73.8910, name: "Phoenix Marketcity", status: "active", deviceId: "METER-007", lastPing: "3 mins ago" },
  { lat: 18.5626, lng: 73.9167, name: "Koregaon Park", status: "active", deviceId: "METER-008", lastPing: "7 mins ago" },
  { lat: 18.5353, lng: 73.8769, name: "Fergusson College", status: "inactive", deviceId: "METER-009", lastPing: "5 days ago" },
  { lat: 18.5196, lng: 73.8554, name: "Pune Station", status: "active", deviceId: "METER-010", lastPing: "1 min ago" },
];

// Custom marker icon based on status
const createCustomMarker = (status) => {
  const iconMarkup = renderToStaticMarkup(
    <div className="relative">
      {status === "active" ? (
        <div className="relative">
          <MapPin size={36} className="text-primary drop-shadow-md" weight="fill" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
      ) : (
        <div className="relative">
          <MapPin size={36} className="text-gray-400 drop-shadow-md" weight="fill" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></div>
        </div>
      )}
    </div>
  );

  return new L.DivIcon({
    html: iconMarkup,
    className: "custom-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const DeviceLocationMap = () => {
  const center = [18.5204, 73.8567]; // Center of Pune
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Filter locations based on selected filter
  const filteredLocations = selectedFilter === "all"
    ? locations
    : locations.filter((location) => location.status === selectedFilter);

  // Calculate statistics
  const totalLocations = locations.length;
  const activeLocations = locations.filter((loc) => loc.status === "active").length;
  const inactiveLocations = locations.filter((loc) => loc.status === "inactive").length;
  const activePercentage = Math.round((activeLocations / totalLocations) * 100);

  return (
    <div className="w-full h-full flex-1">
      {/* Map Card */}
      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin weight="duotone" className="text-primary" size={20} />
              Device Location Map
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {filteredLocations.length} devices shown on map
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Badge
              onClick={() => setSelectedFilter("all")}
              className={`cursor-pointer hover:bg-primary/90 ${selectedFilter === "all" ? "bg-primary" : "bg-muted"}`}
            >
              All ({totalLocations})
            </Badge>
            <Badge
              onClick={() => setSelectedFilter("active")}
              className={`cursor-pointer hover:bg-green-500/90 ${selectedFilter === "active" ? "bg-green-500" : "bg-muted text-foreground"}`}
            >
              Active ({activeLocations})
            </Badge>
            <Badge
              onClick={() => setSelectedFilter("inactive")}
              className={`cursor-pointer hover:bg-red-500/90 ${selectedFilter === "inactive" ? "bg-red-500" : "bg-muted text-foreground"}`}
            >
              Inactive ({inactiveLocations})
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="h-[30.75rem] w-full relative">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              className="rounded-lg z-10"
            >
              <TileLayer
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>'
              />
              {filteredLocations.map((location, index) => (
                <Marker
                  key={index}
                  position={[location.lat, location.lng]}
                  icon={createCustomMarker(location.status)}
                >
                  <Tooltip direction="top" offset={[0, -36]} opacity={1} permanent={false}>
                    <div className="text-xs font-semibold">{location.name}</div>
                  </Tooltip>
                  <Popup className="rounded-lg overflow-hidden">
                    <div className="p-1">
                      <h3 className="font-semibold text-sm mb-1">{location.name}</h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Device ID:</span>
                          <span className="font-medium">{location.deviceId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span
                            className={`font-medium ${
                              location.status === "active" ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Ping:</span>
                          <span className="font-medium">{location.lastPing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coordinates:</span>
                          <span className="font-medium">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceLocationMap;