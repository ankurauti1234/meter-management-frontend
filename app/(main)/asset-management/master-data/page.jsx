"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useState } from "react";

// Dummy data for 10 meters
const dummyMeters = Array.from({ length: 10 }, (_, i) => {
  const meterId = 50000101 + i;
  return {
    meterId,
    sim1: i % 2 === 0 ? "Active" : "Inactive",
    sim2: i % 3 === 0 ? "Active" : "Inactive",
    motherboardSerial: `MB${meterId}`,
    imeiSerial: `IMEI${meterId}`,
    powerPcbSerial: `PCB${meterId}`,
    hardwareVersion: `v${(i % 3) + 1}.0`, // v1.0, v2.0, v3.0
    softwareVersion: `v${(i % 2) + 1}.1`, // v1.1, v2.1
    ethernetMac: `00:1A:2B:${String(i + 10).padStart(2, "0")}:00:${String(i).padStart(2, "0")}`,
    bleAddress: `BLE:${meterId}`,
    wifiMac: `00:16:17:${String(i + 20).padStart(2, "0")}:00:${String(i).padStart(2, "0")}`,
    validFrom: "2025-01-01",
    validTo: i % 4 === 0 ? "2025-12-31" : "2026-12-31",
  };
});

export default function MasterData() {
  const [meters, setMeters] = useState(dummyMeters);
  const [page, setPage] = useState(1);
  const limit = 10; // Items per page
  const totalMeters = dummyMeters.length;
  const totalPages = Math.ceil(totalMeters / limit);

  // Pagination logic
  const paginatedMeters = meters.slice((page - 1) * limit, page * limit);

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="mx-auto container">
      <Card className="w-full rounded-lg">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            Master Data
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {paginatedMeters.length} meters shown of {totalMeters} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <div className="[&>div]:max-h-96 overflow-x-auto">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Meter ID</TableHead>
                  <TableHead>SIM 1</TableHead>
                  <TableHead>SIM 2</TableHead>
                  <TableHead>Motherboard S. No</TableHead>
                  <TableHead>IMEI Sr No</TableHead>
                  <TableHead>POWER PCB Sr No</TableHead>
                  <TableHead>H/W Version</TableHead>
                  <TableHead>S/W Version</TableHead>
                  <TableHead>Ethernet MAC</TableHead>
                  <TableHead>BLE Address</TableHead>
                  <TableHead>WiFi MAC</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMeters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-12 text-center text-muted-foreground">
                      No meters available
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMeters.map((meter) => (
                    <TableRow key={meter.meterId}>
                      <TableCell className="font-medium">{meter.meterId}</TableCell>
                      <TableCell>{meter.sim1}</TableCell>
                      <TableCell>{meter.sim2}</TableCell>
                      <TableCell>{meter.motherboardSerial}</TableCell>
                      <TableCell>{meter.imeiSerial}</TableCell>
                      <TableCell>{meter.powerPcbSerial}</TableCell>
                      <TableCell>{meter.hardwareVersion}</TableCell>
                      <TableCell>{meter.softwareVersion}</TableCell>
                      <TableCell>{meter.ethernetMac}</TableCell>
                      <TableCell>{meter.bleAddress}</TableCell>
                      <TableCell>{meter.wifiMac}</TableCell>
                      <TableCell>{meter.validFrom}</TableCell>
                      <TableCell>{meter.validTo}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedMeters.length} of {totalMeters} meters
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}