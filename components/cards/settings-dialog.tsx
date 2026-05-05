"use client";
import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import alertsService, { AlertSettingsData } from "@/services/alerts.service";

export function SettingsDialog({ onUpdate }: { onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AlertSettingsData | null>(null);
  const [threshold, setThreshold] = useState(48);
  const [frequency, setFrequency] = useState(48);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    alertsService.getSettings().then((s) => {
      setSettings(s);
      setThreshold(s.inactivityThresholdHours);
      setFrequency(s.emailFrequencyHours);
    }).catch(() => toast.error("Failed to load settings"));
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await alertsService.updateSettings({
        inactivityThresholdHours: threshold,
        emailFrequencyHours: frequency,
      });
      toast.success("Settings updated");
      onUpdate?.();
      setOpen(false);
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" /> Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alert Settings</DialogTitle>
          <DialogDescription>Configure inactivity detection thresholds.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Inactivity Threshold (hours)</Label>
            <Input type="number" min={1} max={720} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">
              A meter is flagged inactive if no event received within this period. Default: 48h (2 days).
            </p>
          </div>
          <div className="space-y-2">
            <Label>Email Report Frequency (hours)</Label>
            <Input type="number" min={1} max={720} value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">
              How often the inactivity report email is sent. Default: 48h (2 days).
            </p>
          </div>
          {settings?.lastCheckAt && (
            <p className="text-xs text-muted-foreground">
              Last check: {new Date(settings.lastCheckAt).toLocaleString()}
            </p>
          )}
          {settings?.lastEmailSentAt && (
            <p className="text-xs text-muted-foreground">
              Last email: {new Date(settings.lastEmailSentAt).toLocaleString()}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
