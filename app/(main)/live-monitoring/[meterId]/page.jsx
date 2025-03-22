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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowClockwise } from "@phosphor-icons/react";
import { fetchEvents } from "@/utils/events-apis";

export default function LiveMonitoringMeterId() {
  const { meterId } = useParams();
  const [type29Events, setType29Events] = useState([]);
  const [type28Events, setType28Events] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState("30"); // Default 30 seconds

  const formatTimestamp = (ts) => {
    if (typeof ts === "string") return new Date(ts).toLocaleString();
    if (typeof ts === "number") return new Date(ts * 1000).toLocaleString();
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
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchMeterEvents(29, setType29Events),
        fetchMeterEvents(28, setType28Events),
      ]);
      setIsLoading(false);
      console.log('Initial data loaded at:', new Date().toLocaleTimeString());
    };
    loadInitialData();
  
    // Set up 5-second refresh interval
    const interval = setInterval(() => {
      fetchMeterEvents(29, setType29Events);
      fetchMeterEvents(28, setType28Events);
      console.log('Data refreshed at:', new Date().toLocaleTimeString());
    }, 5000); // 5000 milliseconds = 5 seconds
  
    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
      console.log('Interval cleared at:', new Date().toLocaleTimeString());
    };
  }, [meterId]);

  return (
    <div className="mx-auto container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Live Monitoring - Meter ID: {meterId}
        </h1>
        <div className="flex items-center gap-2">
          <ArrowClockwise size={16} className="text-muted-foreground" />
          <Select
            value={refreshInterval}
            onValueChange={setRefreshInterval}
          >
            <SelectTrigger className="h-9 w-24 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 sec</SelectItem>
              <SelectItem value="10">10 sec</SelectItem>
              <SelectItem value="30">30 sec</SelectItem>
              <SelectItem value="60">60 sec</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type 29 Table */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Detection</CardTitle>
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
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : type29Events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No Logo Detection events available
                    </TableCell>
                  </TableRow>
                ) : (
                  type29Events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>
                        {formatTimestamp(event.timestamp || event.TS)}
                      </TableCell>
                      <TableCell>
                        {event.Details?.Channel_name || "-"}
                      </TableCell>
                      <TableCell>{event.Details?.score || "-"}</TableCell>
                      <TableCell>{event.Event_Name || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Type 28 Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audio Detection Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Detection</TableHead>
                  <TableHead>Event Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : type28Events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      No Audio Detection events available
                    </TableCell>
                  </TableRow>
                ) : (
                  type28Events.map((event) => (
                    <TableRow key={event.ID || event._id}>
                      <TableCell>{formatTimestamp(event.TS)}</TableCell>
                      <TableCell>
                        {event.Details 
                          ? Object.entries(event.Details)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ') 
                          : '-'}
                      </TableCell>
                      <TableCell>{event.Event_Name || "-"}</TableCell>
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