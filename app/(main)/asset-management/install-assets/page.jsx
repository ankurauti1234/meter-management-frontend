"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAllMeters } from "@/utils/events-apis";
import { decommissionDevices } from "@/utils/config-apis";

export default function DecommissionMeters() {
  const [meters, setMeters] = useState([]);
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeters, setTotalMeters] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [decommissionStatus, setDecommissionStatus] = useState(null);
  const limit = 20;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAllMeters({ page, limit });
        setMeters(response.meters || []);
        setTotalMeters(response.totalMeters || 0);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error("Error fetching meters:", error);
        setMeters([]);
        setTotalMeters(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleCheckboxChange = (meterId) => {
    setSelectedMeters((prev) =>
      prev.includes(meterId)
        ? prev.filter((id) => id !== meterId)
        : [...prev, meterId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMeters(meters.map((meter) => meter.deviceId));
    } else {
      setSelectedMeters([]);
    }
  };

  const handleDecommission = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    try {
      const payload = { deviceIds: selectedMeters };
      const response = await decommissionDevices(payload);
      setDecommissionStatus({
        type: "success",
        message: `Decommissioning initiated successfully. Decommission ID: ${response.decommissionId}`,
      });
      setSelectedMeters([]); // Clear selection after success
      // Refresh meter list
      const updatedMeters = await fetchAllMeters({ page, limit });
      setMeters(updatedMeters.meters || []);
    } catch (error) {
      setDecommissionStatus({
        type: "error",
        message: error.message || "Failed to decommission devices",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setSelectedMeters([]); // Clear selection when changing pages
    }
  };

  return (
    <div className="mx-auto container">
      <Card className="w-full rounded-lg">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            Uninstall Meters
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {meters.length} meters shown of {totalMeters} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          {decommissionStatus && (
            <div
              className={`mb-4 p-3 rounded-md ${
                decommissionStatus.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {decommissionStatus.message}
            </div>
          )}
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <Checkbox
                      checked={selectedMeters.length === meters.length && meters.length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={isLoading}
                    />
                  </TableHead>
                  <TableHead>Meter ID</TableHead>
                  <TableHead>Household ID</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>SIM 1</TableHead>
                  <TableHead>SIM 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading meters...</div>
                    </TableCell>
                  </TableRow>
                ) : meters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No meters available
                    </TableCell>
                  </TableRow>
                ) : (
                  meters.map((meter) => (
                    <TableRow key={meter.deviceId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMeters.includes(meter.deviceId)}
                          onCheckedChange={() => handleCheckboxChange(meter.deviceId)}
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{meter.deviceId}</TableCell>
                      <TableCell>{meter.hhid || "-"}</TableCell>
                      <TableCell>{meter.isAssigned ? "Yes" : "No"}</TableCell>
                      <TableCell>{meter.sim1Pass ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{meter.sim2Pass ? "Active" : "Inactive"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {meters.length} of {totalMeters} meters
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1 || isLoading}
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
                disabled={page >= totalPages || isLoading}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Next
              </Button>
              {selectedMeters.length > 0 && (
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isLoading}
                  className="h-8 bg-destructive hover:bg-destructive/90"
                >
                  {isLoading ? "Decommissioning..." : "Send Decommission"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Decommission</DialogTitle>
            <DialogDescription>
              Are you sure you want to decommission {selectedMeters.length}{" "}
              meter{selectedMeters.length > 1 ? "s" : ""}? This action cannot be undone.
              <ul className="mt-2 list-disc pl-5">
                {selectedMeters.map((id) => (
                  <li key={id}>Meter ID: {id}</li>
                ))}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecommission}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}