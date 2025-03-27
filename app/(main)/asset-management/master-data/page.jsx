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
import { useState, useEffect } from "react";
import metersData from "./meters.json"; // Adjust the path according to your file location

export default function MasterData() {
  const [meters, setMeters] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10; // Items per page

  // Load data from JSON file when component mounts
  useEffect(() => {
    setMeters(metersData);
  }, []);

  const totalMeters = meters.length;
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
                  <TableHead>Baseboard Sr. No</TableHead>
                  <TableHead>IMSI 1 Sr No</TableHead>
                  <TableHead>IMSI 2 Sr No</TableHead>
                  <TableHead>POWER PCB Sr No</TableHead>
                  <TableHead>Firmware Version</TableHead>
                  <TableHead>S/W Version</TableHead>
                  <TableHead>Ethernet MAC</TableHead>
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
                      <TableCell>{meter.baseboardSerial}</TableCell>
                      <TableCell>{meter.imsiSerial}</TableCell>
                      <TableCell>{meter.imsiSerial2}</TableCell>
                      <TableCell>{meter.powerPcbSerial}</TableCell>
                      <TableCell>{meter.firmwareVersion}</TableCell>
                      <TableCell>{meter.softwareVersion}</TableCell>
                      <TableCell>{meter.ethernetMac}</TableCell>
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