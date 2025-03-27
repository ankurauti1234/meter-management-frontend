"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic"; // Use dynamic import for Leaflet components
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "@phosphor-icons/react";

// Dynamically import react-leaflet components with SSR disabled
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });

// Enhanced Pune locations with status
const locations = [
  { lat: 18.5934673, lng: 73.9490801, name: "Shiv Colony, Sr. No. 84, Pawar Wasti Rd, near Trimurti Lawns, Lohegaon, Pune, Maharashtra 411047", status: "active", deviceId: "1100006", lastPing: "unknown" },
  { lat: 18.5978404, lng: 73.9366586, name: "HWXP+6PM, Adarsh Nagar, Sant Nagar, Lohegaon, Pune, Maharashtra 411047", status: "active", deviceId: "1100007", lastPing: "unknown" },
  { lat: 18.5516145, lng: 73.9445414, name: "Marvel Citrine, Rakshak Nagar, Kharadi, Pune, Maharashtra 411014", status: "active", deviceId: "1100008", lastPing: "unknown" },
  { lat: 18.5518714, lng: 73.9447167, name: "Marvel Citrine, Rakshak Nagar, Kharadi, Pune, Maharashtra 411014", status: "active", deviceId: "1100009", lastPing: "unknown" },
  { lat: 18.5887872, lng: 73.9091094, name: "K-57, Khese Park, Lohegaon, Pune, Maharashtra 411032", status: "active", deviceId: "1100010", lastPing: "unknown" },
  { lat: 18.5585257, lng: 73.9321773, name: "Shop no.10, Sai Rishi Plaza, Kharadi Rd, Preet Nagar, Wadgaon Sheri, Pune, Maharashtra 411014", status: "active", deviceId: "5500006", lastPing: "unknown" },
  { lat: 18.6083681, lng: 73.9070001, name: "United Arise, Dighi, Pune, Maharashtra 411047", status: "active", deviceId: "5500007", lastPing: "unknown" },
  { lat: 18.5595171, lng: 73.9487621, name: "S. No.58/2/ 1A/1A/2, D P Rd, Near Near Eon IT Park, Tulaja Bhawani Nagar, Kharadi, Pune, Maharashtra 411014", status: "active", deviceId: "5500008", lastPing: "unknown" },
  { lat: 18.5409197, lng: 73.9278429, name: "GWRH+F52, Wadgaon Sheri - Sainath Nagar Rd, Sainath Nagar, Wadgaon Sheri, Pune, Maharashtra 411014", status: "active", deviceId: "5500010", lastPing: "unknown" }
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

  return (
    <div className="w-full h-full flex-1">
      <Card className="w-full rounded-lg h-full">
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="h-[30.75rem] w-full relative">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              className="rounded-lg z-10"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
              />
              {filteredLocations.map((location, index) => (
                <Marker
                  key={index}
                  position={[location.lat, location.lng]}
                  icon={createCustomMarker(location.status)}
                >
                  <Tooltip direction="top" offset={[0, -36]} opacity={1} permanent={false}>
                    <div>
                      <div className="text-xs font-semibold">{location.name}</div>
                      <div className="text-xs text-muted-foreground">Meter ID: {location.deviceId}</div>
                    </div>
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