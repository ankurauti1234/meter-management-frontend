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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash, CheckCircle, XCircle, Plus, StackMinus } from "@phosphor-icons/react";
import { fetchDecommissionLogs, decommissionDevices } from "@/utils/config-apis";

export default function DecommissionPage() {
  const [form, setForm] = useState({
    deviceIds: "",
    deviceRangeMin: "",
    deviceRangeMax: "",
    targetType: "single",
  });
  const [logs, setLogs] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTargetTypeChange = (value) => {
    setForm({
      ...form,
      targetType: value,
      deviceIds: "",
      deviceRangeMin: "",
      deviceRangeMax: "",
    });
  };

  const fetchLogs = async () => {
    try {
      const logsData = await fetchDecommissionLogs();
      setLogs(logsData);
    } catch (error) {
      console.error("Error fetching decommission logs:", error);
    }
  };

  const handleConfirm = async () => {
    try {
      const payload = {};
      if (form.targetType === "single" && form.deviceIds) {
        payload.deviceIds = Number(form.deviceIds);
      } else if (form.targetType === "multiple" && form.deviceIds) {
        payload.deviceIds = form.deviceIds.split(",").map((id) => Number(id.trim()));
      } else if (form.targetType === "range" && form.deviceRangeMin && form.deviceRangeMax) {
        payload.deviceRange = {
          min: Number(form.deviceRangeMin),
          max: Number(form.deviceRangeMax),
        };
      } else if (form.targetType === "remaining") {
        payload.remaining = true;
      }

      if (!payload.deviceIds && !payload.deviceRange && !payload.remaining) {
        toast({
          title: "Error",
          description: "Please specify at least one device to decommission",
          variant: "destructive",
        });
        setIsDialogOpen(false);
        return;
      }

      const response = await decommissionDevices(payload);
      toast({
        title: "Success",
        description: response.message,
      });
      fetchLogs();
      setIsDialogOpen(false);
      setForm({
        deviceIds: "",
        deviceRangeMin: "",
        deviceRangeMax: "",
        targetType: "single",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error decommissioning devices",
        variant: "destructive",
      });
      setIsDialogOpen(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="mx-auto container">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <StackMinus className="text-primary" size={20} weight="duotone" />
              Device Decommissioning
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="animate-pulse">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto container">
      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <StackMinus className="text-primary" size={20} weight="duotone" />
              Device Decommissioning
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {logs.length} decommission logs shown
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary hover:bg-primary/90 flex items-center gap-2">
                  <Plus size={16} weight="duotone" />
                  Decommission Devices
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] rounded-xl shadow-xl">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold text-primary">
                    Decommission Devices
                  </DialogTitle>
                  <DialogDescription>
                    Select the devices to decommission. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Target Type</label>
                    <Select onValueChange={handleTargetTypeChange} value={form.targetType}>
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select target type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Device</SelectItem>
                        <SelectItem value="multiple">Multiple Devices</SelectItem>
                        <SelectItem value="range">Device Range</SelectItem>
                        <SelectItem value="remaining">Remaining Devices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.targetType === "single" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                      <Input
                        name="deviceIds"
                        value={form.deviceIds}
                        onChange={handleChange}
                        placeholder="e.g., 123"
                        type="number"
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                  )}
                  {form.targetType === "multiple" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Device IDs (comma-separated)
                      </label>
                      <Input
                        name="deviceIds"
                        value={form.deviceIds}
                        onChange={handleChange}
                        placeholder="e.g., 123, 124, 125"
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                  )}
                  {form.targetType === "range" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Min Device ID
                        </label>
                        <Input
                          name="deviceRangeMin"
                          value={form.deviceRangeMin}
                          onChange={handleChange}
                          placeholder="e.g., 100"
                          type="number"
                          className="h-10 rounded-lg border-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Max Device ID
                        </label>
                        <Input
                          name="deviceRangeMax"
                          value={form.deviceRangeMax}
                          onChange={handleChange}
                          placeholder="e.g., 110"
                          type="number"
                          className="h-10 rounded-lg border-primary/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-lg border-muted/30 hover:bg-muted/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="rounded-lg bg-primary hover:bg-primary/90 transition-all"
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Decommission ID</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No decommission logs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-muted/10">
                      <TableCell className="font-medium">{log._id}</TableCell>
                      <TableCell>
                        {log.devices
                          .slice(0, 10)
                          .map((d) => d.deviceId)
                          .join(", ")}
                        {log.devices.length > 10 && " ..."}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.completedAt ? "default" : "outline"}
                          className="flex items-center gap-1"
                        >
                          {log.completedAt ? (
                            <CheckCircle size={16} />
                          ) : (
                            <XCircle size={16} />
                          )}
                          {log.completedAt ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {logs.length} decommission logs
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}