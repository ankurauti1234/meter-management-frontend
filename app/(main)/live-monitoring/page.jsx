"use client";
import dynamic from "next/dynamic";
import LiveStream from "./live-stream";

const DeviceLocationMap = dynamic(() => import("./map"), {
  ssr: false,
});

export default function LiveMonitor() {

  return (
    <div className="mx-auto container py-8 space-y-6">
      <LiveStream/>
      <DeviceLocationMap />
    </div>
  );
}