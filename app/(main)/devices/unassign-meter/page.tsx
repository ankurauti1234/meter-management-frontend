"use client";

import { useState } from "react";
import { Unlink, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

import api from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UnassignedMeter {
  meterId: string;
  assignedHouseholdId: string | null;
  isAssigned: boolean;
  updatedAt: string;
}

type ResultState =
  | { status: "idle" }
  | { status: "success"; message: string; meter: UnassignedMeter }
  | { status: "error"; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

const HHID_PATTERN = /^HH\d+$/i;
const METER_ID_PATTERN = /^IM\d+$/i;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UnassignMeterPage() {
  const [hhid, setHhid]       = useState("");
  const [meterId, setMeterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult]   = useState<ResultState>({ status: "idle" });

  const hhidValid    = HHID_PATTERN.test(hhid.trim());
  const meterIdValid = METER_ID_PATTERN.test(meterId.trim());
  const canSubmit     = hhidValid && meterIdValid && !loading;

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setResult({ status: "idle" });

    try {
      const res = await api.post("/meters/unassign", {
        hhid: hhid.trim().toUpperCase(),
        meterId: meterId.trim().toUpperCase(),
      });

      const data = res.data;

      if (data.success) {
        setResult({ status: "success", message: data.message, meter: data.meter });
        toast.success("Meter unassigned successfully");
      } else {
        setResult({ status: "error", error: data.error ?? "Unassign failed" });
        toast.error(data.error ?? "Unassign failed");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Network error — could not reach the server.";
      setResult({ status: "error", error: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult({ status: "idle" });
    setHhid("");
    setMeterId("");
  };

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <PageHeader
        title="Unassign Meter"
        description="Remove a meter-to-household binding from the database"
        size="sm"
      />

      <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            This is a destructive, irreversible action. It deletes the active assignment record,
            clears the meter's household link, and logs the change to history. Double-check the
            HHID and Meter ID before proceeding.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlink className="h-5 w-5 text-muted-foreground" />
            Unassign Details
          </CardTitle>
          <CardDescription>Enter the household and meter to unbind.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="hhid">Household ID (HHID)</Label>
            <Input
              id="hhid"
              placeholder="e.g. HH2122"
              value={hhid}
              onChange={(e) => setHhid(e.target.value)}
              disabled={loading}
              spellCheck={false}
              autoComplete="off"
              className="font-mono uppercase"
            />
            {hhid.trim() !== "" && !hhidValid && (
              <p className="text-xs text-destructive">Expected format: HH followed by digits (e.g. HH2122)</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meterId">Meter ID</Label>
            <Input
              id="meterId"
              placeholder="e.g. IM000101"
              value={meterId}
              onChange={(e) => setMeterId(e.target.value)}
              disabled={loading}
              spellCheck={false}
              autoComplete="off"
              className="font-mono uppercase"
            />
            {meterId.trim() !== "" && !meterIdValid && (
              <p className="text-xs text-destructive">Expected format: IM followed by digits (e.g. IM000101)</p>
            )}
          </div>

          <Button
            variant="destructive"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => setConfirmOpen(true)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Unlink className="mr-2 h-4 w-4" />
                Unassign Meter
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Result panels ── */}
      {result.status === "success" && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Operation Successful
            </div>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            <div className="rounded-md border bg-background divide-y text-sm">
              <Row label="meter_id" value={result.meter.meterId} />
              <Row label="assigned_household_id" value={result.meter.assignedHouseholdId ?? "NULL"} />
              <Row label="is_assigned" value={
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  {String(result.meter.isAssigned)}
                </Badge>
              } />
              <Row label="updated_at" value={new Date(result.meter.updatedAt).toLocaleString()} />
            </div>
            <Button variant="outline" className="w-full" onClick={handleReset}>
              ← New Operation
            </Button>
          </CardContent>
        </Card>
      )}

      {result.status === "error" && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              Operation Failed
            </div>
            <p className="text-sm text-muted-foreground">{result.error}</p>
            <Button variant="outline" className="w-full" onClick={handleReset}>
              ← Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Targets: <code className="font-mono">households</code>, <code className="font-mono">meters</code>,{" "}
        <code className="font-mono">meter_assignments</code>, <code className="font-mono">household_meter_history</code>
        {" "}· Action: DELETE + UPDATE + INSERT
      </p>

      {/* ── Confirmation dialog ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm meter unassignment</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to unassign meter <strong>{meterId.trim().toUpperCase()}</strong> from
              household <strong>{hhid.trim().toUpperCase()}</strong>. This cannot be undone. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmSubmit}
            >
              Yes, unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-muted-foreground font-mono text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}