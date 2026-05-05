"use client";
import { useEffect, useState } from "react";
import { Mail, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import alertsService, { AlertRecipient } from "@/services/alerts.service";

export function RecipientsDialog() {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<AlertRecipient[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecipients = async () => {
    try {
      const data = await alertsService.getRecipients();
      setRecipients(data);
    } catch { toast.error("Failed to load recipients"); }
  };

  useEffect(() => { if (open) fetchRecipients(); }, [open]);

  const handleAdd = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await alertsService.addRecipient(email, name || undefined);
      toast.success("Recipient added");
      setEmail(""); setName("");
      fetchRecipients();
    } catch (e: any) {
      toast.error(e?.response?.data?.msg || "Failed to add");
    } finally { setLoading(false); }
  };

  const handleRemove = async (id: number) => {
    try {
      await alertsService.removeRecipient(id);
      toast.success("Recipient removed");
      fetchRecipients();
    } catch { toast.error("Failed to remove"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="mr-2 h-4 w-4" /> Recipients
          {recipients.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">{recipients.length}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Email Recipients</DialogTitle>
          <DialogDescription>Manage who receives inactivity alert emails.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label>Email</Label>
              <Input placeholder="user@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="w-32 space-y-1">
              <Label>Name</Label>
              <Input placeholder="Optional" value={name}
                onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button size="icon" onClick={handleAdd} disabled={loading || !email}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recipients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recipients configured</p>
            ) : recipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{r.email}</p>
                  {r.name && <p className="text-xs text-muted-foreground">{r.name}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => handleRemove(r.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
