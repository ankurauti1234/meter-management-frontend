"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
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

interface LeafletMapInnerProps {
  cities: CityLocation[];
  selectedCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
}

// Custom Marker Creator using Leaflet divIcon
function createCustomIcon(isSelected: boolean, name: string, count: number) {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span style="position: absolute; display: inline-flex; height: ${isSelected ? '24px' : '16px'}; width: ${isSelected ? '24px' : '16px'}; border-radius: 9999px; background-color: #34d399; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; height: ${isSelected ? '18px' : '14px'}; width: ${isSelected ? '18px' : '14px'}; border-radius: 9999px; background-color: ${isSelected ? '#059669' : '#10b981'}; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"></div>
        <div style="position: absolute; top: 18px; white-space: nowrap; background: rgba(15, 23, 42, 0.85); color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; font-family: monospace; border: 1px solid rgba(255,255,255,0.15); pointer-events: none; transform: translateX(-50%); left: 50%;">
          ${name} (${count})
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Controller to handle smooth pan/zoom when city selected
function MapController({ selectedCity }: { selectedCity: CityLocation }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([selectedCity.lat, selectedCity.lng], 9, { duration: 1.2 });
  }, [selectedCity, map]);
  return null;
}

export default function LeafletMapInner({
  cities,
  selectedCity,
  onSelectCity,
}: LeafletMapInnerProps) {
  // Center of Armenia: ~40.0691, 45.0382
  const center: [number, number] = [40.0691, 45.0382];

  return (
    <MapContainer
      center={center}
      zoom={8}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedCity={selectedCity} />

      {cities.map((city) => {
        const isSelected = selectedCity.id === city.id;
        const icon = createCustomIcon(isSelected, city.name, city.activeDevices);

        return (
          <Marker
            key={city.id}
            position={[city.lat, city.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectCity(city),
            }}
          >
            <Popup>
              <div className="p-1 font-sans text-xs space-y-1">
                <p className="font-bold text-foreground text-sm">{city.name}</p>
                <p className="text-muted-foreground">{city.region}</p>
                <div className="pt-1 flex items-center justify-between font-mono">
                  <span>Active Meters:</span>
                  <span className="font-bold text-emerald-600">{city.activeDevices} / {city.totalMeters}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

