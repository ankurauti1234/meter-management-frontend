"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRealtimeEventsUrl } from "@/utils/events-apis";

export default function LiveMonitoringMeterId() {
  const { meterId } = useParams();
  const [type29Events, setType29Events] = useState([]);
  const [type30Events, setType30Events] = useState([]);
  const [error, setError] = useState(null);

  const formatTimestamp = (ts) => {
    if (typeof ts === "string") return new Date(ts).toLocaleString();
    if (typeof ts === "number") return new Date(ts * 1000).toLocaleString(); // Assuming TS is in seconds
    return "-";
  };

  useEffect(() => {
    const setupEventSource = (type, setEvents) => {
      const filters = {
        deviceId: meterId, // Explicitly set deviceId to meterId
        type,             // Type 29 or 30
        limit: 10,        // Limit to 10 events
        page: 1,          // Default page
      };
      const url = getRealtimeEventsUrl(filters);
      console.log(`EventSource URL for Type ${type}: ${url}`); // Debug log to verify URL

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "initial") {
          setEvents(data.events);
        } else if (data.type === "new") {
          setEvents((prev) => [...data.events, ...prev].slice(0, 10)); // Keep latest 10
        } else if (data.type === "error") {
          setError(data.message);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setError("Failed to connect to real-time events.");
        eventSource.close();
      };

      return () => eventSource.close();
    };

    // Set up EventSource for Type 29 and Type 30
    const cleanup29 = setupEventSource(29, setType29Events);
    const cleanup30 = setupEventSource(30, setType30Events);

    return () => {
      cleanup29();
      cleanup30();
    };
  }, [meterId]);

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-2xl font-bold mb-6">Live Monitoring - Meter ID: {meterId}</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type 29 Table */}
        <Card>
          <CardHeader>
            <CardTitle>Type 29 Events (Logo Detected)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Detection</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Event Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {type29Events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No Type 29 events available
                    </TableCell>
                  </TableRow>
                ) : (
                  type29Events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>{formatTimestamp(event.timestamp || event.TS)}</TableCell>
                      <TableCell>{event.Details?.Channel_name || "-"}</TableCell>
                      <TableCell>{event.Details?.score || "-"}</TableCell>
                      <TableCell>{event.Event_Name || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Type 30 Table */}
        <Card>
          <CardHeader>
            <CardTitle>Type 30 Events (Channel Info)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Detection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {type30Events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No Type 30 events available
                    </TableCell>
                  </TableRow>
                ) : (
                  type30Events.map((event) => (
                    <TableRow key={event.ID || event._id}>
                      <TableCell>{formatTimestamp(event.TS)}</TableCell>
                      <TableCell>{event.Details?.channel_id || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}