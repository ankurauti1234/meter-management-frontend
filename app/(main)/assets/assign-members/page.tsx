/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, UserPlus, Users, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";

import HouseholdService from "@/services/household.service";

interface MemberRow {
  id: string;
  memberCode: string;
  age: string;
  gender: string;
  dob: string;
  errors: { age?: string; gender?: string };
}

function makeMemberRow(code: string): MemberRow {
  return { id: crypto.randomUUID(), memberCode: code, age: "", gender: "", dob: "", errors: {} };
}

function deriveDob(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().split("T")[0];
}

function EmailAutocomplete({
  value, onChange, allEmails, error,
}: {
  value: string; onChange: (v: string) => void; allEmails: string[]; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = allEmails.filter((e) => e.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          placeholder="installer@example.com"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={error ? "border-destructive pr-9" : "pr-9"}
        />
        {allEmails.length > 0 && (
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
            onClick={() => setOpen((o) => !o)}
          />
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
          {filtered.slice(0, 10).map((email) => (
            <div
              key={email}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
              onMouseDown={(e) => { e.preventDefault(); onChange(email); setOpen(false); }}
            >
              {email}
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function MemberCard({
  row, total, onChange, onRemove,
}: {
  row: MemberRow; total: number;
  onChange: (id: string, field: keyof MemberRow, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card className="relative border-border/60">
      <div className="absolute -top-3 left-4">
        <Badge variant="secondary" className="text-xs font-mono px-2 py-0.5">{row.memberCode}</Badge>
      </div>
      <CardContent className="pt-5 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Age <span className="text-destructive">*</span></Label>
            <Input
              type="number" min={0} max={120} placeholder="e.g. 35"
              value={row.age}
              onChange={(e) => onChange(row.id, "age", e.target.value)}
              className={row.errors.age ? "border-destructive" : ""}
            />
            {row.errors.age && <p className="text-xs text-destructive">{row.errors.age}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Gender <span className="text-destructive">*</span></Label>
            <Select value={row.gender} onValueChange={(v) => onChange(row.id, "gender", v)}>
              <SelectTrigger className={row.errors.gender ? "border-destructive" : ""}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {row.errors.gender && <p className="text-xs text-destructive">{row.errors.gender}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date of Birth <span className="text-[10px] italic">(optional)</span>
            </Label>
            <Input type="date" value={row.dob} onChange={(e) => onChange(row.id, "dob", e.target.value)} />
          </div>
        </div>
        {total > 1 && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost" size="sm"
              className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
              onClick={() => onRemove(row.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AssignMembersPage() {
  const [hhid, setHhid] = useState("");
  const [hhidError, setHhidError] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([makeMemberRow("M1")]);
  const [preregisteredEmails, setPreregisteredEmails] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    HouseholdService.getPreregisteredEmails().then(setPreregisteredEmails).catch(() => {});
  }, []);

  const handleAddMember = () =>
    setMembers((prev) => [...prev, makeMemberRow(`M${prev.length + 1}`)]);

  const handleRemoveMember = (id: string) =>
    setMembers((prev) =>
      prev.filter((m) => m.id !== id).map((m, i) => ({ ...m, memberCode: `M${i + 1}` }))
    );

  const handleFieldChange = (id: string, field: keyof MemberRow, value: string) =>
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const errors = { ...m.errors };
        if (field === "age") delete errors.age;
        if (field === "gender") delete errors.gender;
        return { ...m, [field]: value, errors };
      })
    );

  const validate = (): boolean => {
    let valid = true;

    if (!hhid.trim()) { setHhidError("HHID is required"); valid = false; }
    else setHhidError("");

    if (!contactEmail.trim()) { setEmailError("Installer email is required"); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) { setEmailError("Enter a valid email address"); valid = false; }
    else setEmailError("");

    const updated = members.map((m) => {
      const errors: MemberRow["errors"] = {};
      if (!m.age.trim() || isNaN(Number(m.age)) || Number(m.age) < 0 || Number(m.age) > 120) {
        errors.age = "Valid age (0–120) is required"; valid = false;
      }
      if (!m.gender) { errors.gender = "Gender is required"; valid = false; }
      return { ...m, errors };
    });
    setMembers(updated);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error("Please fix the highlighted errors before submitting."); return; }
    setSubmitting(true);
    try {
      const payload = members.map((m) => {
        const age = Number(m.age);
        return { memberCode: m.memberCode, age, gender: m.gender, dob: m.dob || deriveDob(age) };
      });
      const result = await HouseholdService.assignMembersManually(
        hhid.trim(), contactEmail.trim(), payload
      );
      toast.success(`Assigned ${result.saved} member(s) to ${hhid}`);
      setSubmitSuccess(true);
      setHhid(""); setContactEmail(""); setMembers([makeMemberRow("M1")]);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      const msg: string = err?.response?.data?.msg ?? err?.message ?? "An error occurred";
      if (msg.toLowerCase().includes("already has members")) {
        setHhidError(`HHID "${hhid}" already has members assigned.`);
        toast.error("HHID already assigned", {
          description: `${hhid} already has members. Each HHID can only be assigned once.`,
        });
      } else if (msg.toLowerCase().includes("not found")) {
        setHhidError(`HHID "${hhid}" does not exist in the system.`);
        toast.error("Household not found");
      } else {
        toast.error("Failed to assign members", { description: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setHhid(""); setHhidError(""); setContactEmail(""); setEmailError("");
    setMembers([makeMemberRow("M1")]); setSubmitSuccess(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Household Members"
        description="Enter the HHID, the installer's contact email, then add each household member."
        actions={
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            {members.length} member{members.length !== 1 ? "s" : ""}
          </Badge>
        }
      />

      {/* Step 1 — HHID + Installer Email */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            Household Details
          </CardTitle>
          <CardDescription className="text-xs">
            The installer email is saved to <code className="text-[10px]">preregistered_contacts</code> against this HHID.
            The installer receives the OTP on this address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">HHID <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  placeholder="e.g. HH1001"
                  value={hhid}
                  onChange={(e) => { setHhid(e.target.value.toUpperCase()); if (hhidError) setHhidError(""); }}
                  className={hhidError ? "border-destructive pr-9" : "pr-9"}
                  style={{}}
                />
                {hhidError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
              </div>
              {hhidError && (
                <p className="text-xs text-destructive flex items-start gap-1">
                  <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" />{hhidError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Installer Email <span className="text-destructive">*</span></Label>
              <EmailAutocomplete
                value={contactEmail}
                onChange={(v) => { setContactEmail(v); if (emailError) setEmailError(""); }}
                allEmails={preregisteredEmails}
                error={emailError}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            Household Members
          </CardTitle>
          <CardDescription className="text-xs">
            Member codes (M1, M2, …) are assigned automatically. DOB is optional — derived from age if blank.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-5">
          {members.map((row) => (
            <MemberCard
              key={row.id} row={row} total={members.length}
              onChange={handleFieldChange} onRemove={handleRemoveMember}
            />
          ))}
          <Button
            variant="outline" size="sm"
            className="w-full border-dashed gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleAddMember}
          >
            <Plus className="h-4 w-4" /> Add Member (M{members.length + 1})
          </Button>
        </CardContent>
      </Card>

      {submitSuccess && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Members successfully assigned! The form has been reset for a new entry.
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{members.length}</span> member{members.length !== 1 ? "s" : ""} ready to assign
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={submitting}>Reset</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <><Spinner className="h-4 w-4" />Submitting…</> : <><UserPlus className="h-4 w-4" />Assign Members</>}
          </Button>
        </div>
      </div>
    </div>
  );
}