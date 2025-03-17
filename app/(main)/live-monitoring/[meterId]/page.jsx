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
import { fetchEvents } from "@/utils/events-apis";

export default function LiveMonitoringMeterId() {
  const { meterId } = useParams();
  const [type29Events, setType29Events] = useState([]);
  const [type30Events, setType30Events] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatTimestamp = (ts) => {
    if (typeof ts === "string") return new Date(ts).toLocaleString();
    if (typeof ts === "number") return new Date(ts * 1000).toLocaleString(); // Assuming TS is in seconds
    return "-";
  };

  const fetchMeterEvents = async (type, setEvents) => {
    try {
      const filters = {
        deviceId: meterId,
        type,
        limit: 10,
        page: 1,
      };
      const response = await fetchEvents(filters);
      setEvents(response.events || []);
    } catch (err) {
      setError(err.message || "Failed to fetch events");
    }
  };

  useEffect(() => {
    // Initial fetch
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchMeterEvents(29, setType29Events),
        fetchMeterEvents(30, setType30Events),
      ]);
      setIsLoading(false);
    };
    loadInitialData();

    // Set up 5-second refresh interval
    const interval = setInterval(() => {
      fetchMeterEvents(29, setType29Events);
      fetchMeterEvents(30, setType30Events);
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : type29Events.length === 0 ? (
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : type30Events.length === 0 ? (
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