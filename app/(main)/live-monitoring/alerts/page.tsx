/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  ColumnDef, flexRender, getCoreRowModel, useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft, ChevronRight, Filter, RefreshCw, Search, X,
  Bell, AlertTriangle, WifiOff, Download, Play, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty, EmptyDescription, EmptyHeader,
  EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { DateTimePicker, DateTime } from "@/components/ui/date-time-picker";
import eventsService, { Event } from "@/services/events.service";
import alertsService, { InactivityAlert } from "@/services/alerts.service";

/* ─── Types ───────────────────────────────────────────── */
interface EventFilters { device_id?: string; page: number; limit: number; }
interface AlertEvent extends Event { details?: Record<string, any>; }

type InactivityFilterValue = "all" | "lt_3d" | "lt_1w" | "lt_2w" | "lt_1m" | "gt_1m";

interface InactivityFilters {
  device_id: string;
  inactivity_filter: InactivityFilterValue;
  page: number;
  limit: number;
}

/* ─── Inactivity filter options ───────────────────────── */
const INACTIVITY_FILTER_OPTIONS: Array<{
  value: InactivityFilterValue;
  label: string;
  description: string;
  dot: string;
}> = [
  { value: "all",   label: "All meters",          description: "Show all inactive meters",               dot: "bg-muted-foreground" },
  { value: "lt_3d", label: "< 3 days",             description: "Inactive for less than 3 days",          dot: "bg-amber-500" },
  { value: "lt_1w", label: "3 days – 1 week",      description: "Inactive between 3 days and 1 week",     dot: "bg-orange-500" },
  { value: "lt_2w", label: "1 week – 2 weeks",     description: "Inactive between 1 and 2 weeks",         dot: "bg-red-400" },
  { value: "lt_1m", label: "2 weeks – 1 month",    description: "Inactive between 2 weeks and 1 month",   dot: "bg-red-600" },
  { value: "gt_1m", label: "> 1 month",             description: "Inactive for over a month (critical)",   dot: "bg-red-900" },
];

function getFilterPillClass(val: InactivityFilterValue) {
  if (val === "lt_3d") return "bg-amber-100 text-amber-700 border-amber-300";
  if (val === "lt_1w") return "bg-orange-100 text-orange-700 border-orange-300";
  if (val === "lt_2w") return "bg-red-100 text-red-600 border-red-300";
  if (val === "lt_1m") return "bg-red-100 text-red-700 border-red-400";
  if (val === "gt_1m") return "bg-red-200 text-red-900 border-red-500";
  return "bg-muted text-muted-foreground border-border";
}

function getInactivityBadgeClass(lastEventAt: string | null): string {
  if (!lastEventAt) return "bg-red-200 text-red-900 border-red-500";
  const days = (Date.now() - new Date(lastEventAt).getTime()) / 86400000;
  if (days < 3)  return "bg-amber-100 text-amber-700 border-amber-300";
  if (days < 7)  return "bg-orange-100 text-orange-700 border-orange-300";
  if (days < 14) return "bg-red-100 text-red-600 border-red-300";
  if (days < 30) return "bg-red-100 text-red-700 border-red-400";
  return "bg-red-200 text-red-900 border-red-500";
}

/* ─── Dummy Temperature Alert Data ───────────────────── */
const BASE_ALERT = { processed_s3_key: null as any, createdAt: "" };

// Irregular dummy warning distribution — intentionally not a repeating pattern.
const WARNING_TYPES = [
  "USB Disconnected", "USB Connected", "Temperature Warning", "USB Disconnected",
  "Temperature Warning", "USB Connected", "USB Connected", "USB Disconnected",
  "USB Connected", "Temperature Warning", "USB Disconnected", "USB Disconnected",
  "Temperature Warning", "USB Connected", "USB Disconnected", "Temperature Warning",
  "USB Connected", "USB Disconnected", "USB Connected", "Temperature Warning",
  "Temperature Warning", "USB Disconnected", "USB Connected", "USB Connected",
  "USB Disconnected", "Temperature Warning", "USB Connected", "USB Disconnected",
  "Temperature Warning", "USB Disconnected", "USB Connected", "Temperature Warning",
  "USB Connected", "USB Disconnected", "USB Disconnected", "USB Connected",
  "Temperature Warning", "USB Connected", "Temperature Warning", "USB Disconnected",
  "USB Connected", "USB Disconnected", "Temperature Warning", "USB Connected",
  "USB Disconnected", "Temperature Warning", "USB Connected", "USB Disconnected",
  "USB Connected", "Temperature Warning",
];

const DUMMY_TEMP_ALERTS: AlertEvent[] = [
  { ...BASE_ALERT, id: "1",  timestamp: Math.floor(Date.now() / 1000) - 300,   device_id: "IM000102", type: 99, data: {}, details: { hhid: "HH1684", temperature: 65.2, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "2",  timestamp: Math.floor(Date.now() / 1000) - 900,   device_id: "IM000134", type: 99, data: {}, details: { hhid: "HH1526", temperature: 68.7, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "3",  timestamp: Math.floor(Date.now() / 1000) - 1800,  device_id: "IM000156", type: 99, data: {}, details: { hhid: "HH1250", temperature: 71.3, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "4",  timestamp: Math.floor(Date.now() / 1000) - 2700,  device_id: "IM000245", type: 99, data: {}, details: { hhid: "HH1830", temperature: 66.8, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "5",  timestamp: Math.floor(Date.now() / 1000) - 3600,  device_id: "IM000312", type: 99, data: {}, details: { hhid: "HH1405", temperature: 69.4, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "6",  timestamp: Math.floor(Date.now() / 1000) - 4500,  device_id: "IM000267", type: 99, data: {}, details: { hhid: "HH1521", temperature: 72.0, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "7",  timestamp: Math.floor(Date.now() / 1000) - 5400,  device_id: "IM000380", type: 99, data: {}, details: { hhid: "HH1469", temperature: 67.1, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "8",  timestamp: Math.floor(Date.now() / 1000) - 6300,  device_id: "IM000450", type: 99, data: {}, details: { hhid: "HH1534", temperature: 70.5, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "9",  timestamp: Math.floor(Date.now() / 1000) - 7200,  device_id: "IM000115", type: 99, data: {}, details: { hhid: "HH1741", temperature: 65.9, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "10", timestamp: Math.floor(Date.now() / 1000) - 8100,  device_id: "IM000209", type: 99, data: {}, details: { hhid: "HH1465", temperature: 71.8, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "11", timestamp: Math.floor(Date.now() / 1000) - 9000,  device_id: "IM000283", type: 99, data: {}, details: { hhid: "HH1362", temperature: 66.3, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "12", timestamp: Math.floor(Date.now() / 1000) - 9900,  device_id: "IM000338", type: 99, data: {}, details: { hhid: "HH1758", temperature: 70.1, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "13", timestamp: Math.floor(Date.now() / 1000) - 10800, device_id: "IM000395", type: 99, data: {}, details: { hhid: "HH1306", temperature: 68.2, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "14", timestamp: Math.floor(Date.now() / 1000) - 11700, device_id: "IM000462", type: 99, data: {}, details: { hhid: "HH1590", temperature: 71.6, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "15", timestamp: Math.floor(Date.now() / 1000) - 12600, device_id: "IM000130", type: 99, data: {}, details: { hhid: "HH1708", temperature: 65.5, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "16", timestamp: Math.floor(Date.now() / 1000) - 13500, device_id: "IM000216", type: 99, data: {}, details: { hhid: "HH1821", temperature: 69.9, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "17", timestamp: Math.floor(Date.now() / 1000) - 14400, device_id: "IM000301", type: 99, data: {}, details: { hhid: "HH1616", temperature: 67.4, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "18", timestamp: Math.floor(Date.now() / 1000) - 15300, device_id: "IM000373", type: 99, data: {}, details: { hhid: "HH1619", temperature: 70.8, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "19", timestamp: Math.floor(Date.now() / 1000) - 16200, device_id: "IM000441", type: 99, data: {}, details: { hhid: "HH1666", temperature: 66.0, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "20", timestamp: Math.floor(Date.now() / 1000) - 17100, device_id: "IM000510", type: 99, data: {}, details: { hhid: "HH1751", temperature: 71.1, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "21", timestamp: Math.floor(Date.now() / 1000) - 18000, device_id: "IM000143", type: 99, data: {}, details: { hhid: "HH1735", temperature: 68.5, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "22", timestamp: Math.floor(Date.now() / 1000) - 18900, device_id: "IM000229", type: 99, data: {}, details: { hhid: "HH1660", temperature: 65.7, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "23", timestamp: Math.floor(Date.now() / 1000) - 19800, device_id: "IM000315", type: 99, data: {}, details: { hhid: "HH1630", temperature: 70.3, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "24", timestamp: Math.floor(Date.now() / 1000) - 20700, device_id: "IM000388", type: 99, data: {}, details: { hhid: "HH1716", temperature: 67.9, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "25", timestamp: Math.floor(Date.now() / 1000) - 21600, device_id: "IM000466", type: 99, data: {}, details: { hhid: "HH1355", temperature: 71.5, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "26", timestamp: Math.floor(Date.now() / 1000) - 22500, device_id: "IM000107", type: 99, data: {}, details: { hhid: "HH1319", temperature: 66.6, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "27", timestamp: Math.floor(Date.now() / 1000) - 23400, device_id: "IM000195", type: 99, data: {}, details: { hhid: "HH1568", temperature: 69.2, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "28", timestamp: Math.floor(Date.now() / 1000) - 24300, device_id: "IM000280", type: 99, data: {}, details: { hhid: "HH1561", temperature: 70.7, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "29", timestamp: Math.floor(Date.now() / 1000) - 25200, device_id: "IM000354", type: 99, data: {}, details: { hhid: "HH1323", temperature: 65.3, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "30", timestamp: Math.floor(Date.now() / 1000) - 26100, device_id: "IM000430", type: 99, data: {}, details: { hhid: "HH1730", temperature: 68.9, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "31", timestamp: Math.floor(Date.now() / 1000) - 27000, device_id: "IM000118", type: 99, data: {}, details: { hhid: "HH1065", temperature: 71.9, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "32", timestamp: Math.floor(Date.now() / 1000) - 27900, device_id: "IM000206", type: 99, data: {}, details: { hhid: "HH1698", temperature: 67.6, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "33", timestamp: Math.floor(Date.now() / 1000) - 28800, device_id: "IM000293", type: 99, data: {}, details: { hhid: "HH1715", temperature: 70.2, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "34", timestamp: Math.floor(Date.now() / 1000) - 29700, device_id: "IM000366", type: 99, data: {}, details: { hhid: "HH1711", temperature: 65.8, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "35", timestamp: Math.floor(Date.now() / 1000) - 30600, device_id: "IM000443", type: 99, data: {}, details: { hhid: "HH1571", temperature: 69.6, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "36", timestamp: Math.floor(Date.now() / 1000) - 31500, device_id: "IM000514", type: 99, data: {}, details: { hhid: "HH1703", temperature: 71.2, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "37", timestamp: Math.floor(Date.now() / 1000) - 32400, device_id: "IM000152", type: 99, data: {}, details: { hhid: "HH1556", temperature: 66.4, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "38", timestamp: Math.floor(Date.now() / 1000) - 33300, device_id: "IM000237", type: 99, data: {}, details: { hhid: "HH1594", temperature: 70.6, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "39", timestamp: Math.floor(Date.now() / 1000) - 34200, device_id: "IM000325", type: 99, data: {}, details: { hhid: "HH1538", temperature: 67.3, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "40", timestamp: Math.floor(Date.now() / 1000) - 35100, device_id: "IM000399", type: 99, data: {}, details: { hhid: "HH1744", temperature: 71.7, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "41", timestamp: Math.floor(Date.now() / 1000) - 36000, device_id: "IM000471", type: 99, data: {}, details: { hhid: "HH1569", temperature: 65.1, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "42", timestamp: Math.floor(Date.now() / 1000) - 36900, device_id: "IM000167", type: 99, data: {}, details: { hhid: "HH1549", temperature: 68.4, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "43", timestamp: Math.floor(Date.now() / 1000) - 37800, device_id: "IM000252", type: 99, data: {}, details: { hhid: "HH1273", temperature: 70.9, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "44", timestamp: Math.floor(Date.now() / 1000) - 38700, device_id: "IM000340", type: 99, data: {}, details: { hhid: "HH1425", temperature: 66.7, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "45", timestamp: Math.floor(Date.now() / 1000) - 39600, device_id: "IM000416", type: 99, data: {}, details: { hhid: "HH1531", temperature: 71.4, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "46", timestamp: Math.floor(Date.now() / 1000) - 40500, device_id: "IM000487", type: 99, data: {}, details: { hhid: "HH1742", temperature: 67.8, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "47", timestamp: Math.floor(Date.now() / 1000) - 41400, device_id: "IM000184", type: 99, data: {}, details: { hhid: "HH1408", temperature: 69.7, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "48", timestamp: Math.floor(Date.now() / 1000) - 42300, device_id: "IM000272", type: 99, data: {}, details: { hhid: "HH1563", temperature: 70.4, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "49", timestamp: Math.floor(Date.now() / 1000) - 43200, device_id: "IM000357", type: 99, data: {}, details: { hhid: "HH1778", temperature: 65.6, warning: "Temperature Warning" } },
  { ...BASE_ALERT, id: "50", timestamp: Math.floor(Date.now() / 1000) - 44100, device_id: "IM000524", type: 99, data: {}, details: { hhid: "HH1567", temperature: 68.1, warning: "Temperature Warning" } },
];

const DUMMY_TEMP_ALERTS_WITH_WARNINGS: AlertEvent[] = DUMMY_TEMP_ALERTS.map((alert, index) => ({
  ...alert,
  details: {
    ...alert.details,
    warning: WARNING_TYPES[index % WARNING_TYPES.length],
  },
}));

/* ─── Page ────────────────────────────────────────────── */
export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("inactivity");

  /* ═══ INACTIVITY TAB STATE ═══ */
  const [iFilters, setIFilters] = useState<InactivityFilters>({
    device_id: "", inactivity_filter: "all", page: 1, limit: 25,
  });
  const [iTempFilters, setITempFilters] = useState(iFilters);
  const [iFilterDialogOpen, setIFilterDialogOpen] = useState(false);
  const [iData, setIData] = useState<InactivityAlert[]>([]);
  const [iTotal, setITotal] = useState(0);
  const [iLoading, setILoading] = useState(false);
  const [iChecking, setIChecking] = useState(false);
  const [iExporting, setIExporting] = useState(false);
  const [debouncedIDevice] = useDebounce(iFilters.device_id, 600);

  const iHasFilters = iFilters.inactivity_filter !== "all";
  const activeFilterOpt = INACTIVITY_FILTER_OPTIONS.find(o => o.value === iFilters.inactivity_filter);

  const fetchInactivity = useCallback(async () => {
    setILoading(true);
    try {
      const res = await alertsService.getInactiveMeters({
        page: iFilters.page,
        limit: iFilters.limit,
        device_id: debouncedIDevice || undefined,
        inactivity_filter: iFilters.inactivity_filter !== "all"
          ? iFilters.inactivity_filter as any
          : undefined,
      });
      setIData(res.data); setITotal(res.pagination.total);
    } catch {
      toast.error("Failed to load inactivity alerts"); setIData([]); setITotal(0);
    } finally { setILoading(false); }
  }, [debouncedIDevice, iFilters.page, iFilters.limit, iFilters.inactivity_filter]);

  useEffect(() => { if (activeTab === "inactivity") fetchInactivity(); }, [fetchInactivity, activeTab]);

  const handleApplyIFilters = () => {
    setIFilters({ ...iTempFilters, page: 1 });
    setIFilterDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleClearIFilters = () => {
    const reset: InactivityFilters = { device_id: "", inactivity_filter: "all", page: 1, limit: iFilters.limit };
    setIFilters(reset); setITempFilters(reset); toast("Filters cleared");
  };

  const handleRunCheck = async () => {
    setIChecking(true);
    try {
      const r = await alertsService.triggerCheck();
      toast.success(`Check done. New: ${r.newInactive}, Resolved: ${r.resolved}, Total: ${r.totalInactive}`);
      fetchInactivity();
    } catch { toast.error("Check failed"); } finally { setIChecking(false); }
  };

  const handleExport = async () => {
    setIExporting(true);
    try { await alertsService.exportInactiveMeters(); toast.success("Excel downloaded"); }
    catch { toast.error("Export failed"); } finally { setIExporting(false); }
  };

  const iColumns: ColumnDef<InactivityAlert>[] = [
    {
      accessorKey: "device_id", header: "Device ID",
      cell: ({ row }) => (
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{row.original.device_id}</code>
      ),
    },
    {
      accessorKey: "hhid", header: "HHID",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.hhid || <span className="text-muted-foreground">—</span>}</span>
      ),
    },
    {
      accessorKey: "lastEventAt",
      header: () => (
        <div className="flex items-center gap-1.5">
          Last Event Sent
          <span className="text-[10px] text-muted-foreground font-normal">(sorted ↑ by inactivity)</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          {row.original.lastEventAt
            ? format(new Date(row.original.lastEventAt), "dd MMM yyyy, HH:mm:ss")
            : <span className="text-muted-foreground italic">Never</span>}
        </div>
      ),
    },
    {
      id: "inactiveDuration", header: "Inactive For",
      cell: ({ row }) => {
        const last = row.original.lastEventAt;
        return (
          <Badge variant="outline" className={`gap-1.5 font-medium border ${getInactivityBadgeClass(last)}`}>
            <Clock className="h-3 w-3" />
            {last ? formatDistanceToNow(new Date(last), { addSuffix: false }) : "Never seen"}
          </Badge>
        );
      },
    },
  ];

  const iTable = useReactTable({
    data: iData, columns: iColumns, getCoreRowModel: getCoreRowModel(),
    manualPagination: true, pageCount: Math.ceil(iTotal / iFilters.limit),
  });

  /* ═══ EVENT ALERTS TAB STATE ═══ */
  const [eFilters, setEFilters] = useState<EventFilters>({ device_id: "", page: 1, limit: 25 });
  const [eTempFilters, setETempFilters] = useState(eFilters);
  const [eStartDT, setEStartDT] = useState<DateTime>({});
  const [eEndDT, setEEndDT] = useState<DateTime>({});
  const [eTempStart, setETempStart] = useState<DateTime>({});
  const [eTempEnd, setETempEnd] = useState<DateTime>({});
  const [eData, setEData] = useState<AlertEvent[]>([]);
  const [eTotal, setETotal] = useState(0);
  const [eLoading, setELoading] = useState(false);
  const [eRefreshing, setERefreshing] = useState(false);
  const [eDialogOpen, setEDialogOpen] = useState(false);
  const [eRefreshInterval, setERefreshInterval] = useState<number | null>(null);
  const eIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchEventAlertsRef = useRef<() => void>(() => {});
  const [debouncedEDevice] = useDebounce(eFilters.device_id, 600);

  const eHasFilters = Boolean(eFilters.device_id || eStartDT.date || eEndDT.date);

  const fetchEventAlerts = useCallback(async () => {
    setELoading(true);
    try {
      // Filter dummy data by device_id search if present
      let filtered = DUMMY_TEMP_ALERTS_WITH_WARNINGS;
      if (debouncedEDevice) {
        filtered = filtered.filter(e =>
          e.device_id.toLowerCase().includes(debouncedEDevice.toLowerCase())
        );
      }
      // Simulate pagination
      const start = (eFilters.page - 1) * eFilters.limit;
      const paginated = filtered.slice(start, start + eFilters.limit);
      setEData(paginated);
      setETotal(filtered.length);
    } catch {
      toast.error("Failed to load alerts"); setEData([]); setETotal(0);
    } finally { setELoading(false); setERefreshing(false); }
  }, [debouncedEDevice, eFilters.page, eFilters.limit, eStartDT, eEndDT]);

  useEffect(() => { fetchEventAlertsRef.current = fetchEventAlerts; }, [fetchEventAlerts]);

  useEffect(() => {
    if (eIntervalRef.current) clearInterval(eIntervalRef.current);
    if (eRefreshInterval) {
      eIntervalRef.current = setInterval(() => fetchEventAlertsRef.current(), eRefreshInterval);
    }
    return () => { if (eIntervalRef.current) clearInterval(eIntervalRef.current); };
  }, [eRefreshInterval]);

  useEffect(() => { if (activeTab === "events") fetchEventAlerts(); }, [fetchEventAlerts, activeTab]);

  const eColumns: ColumnDef<AlertEvent>[] = [
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          {format(new Date(row.original.timestamp * 1000), "dd MMM yyyy, HH:mm:ss")}
        </div>
      ),
    },
    {
      accessorKey: "device_id",
      header: "Device ID",
      cell: ({ row }) => (
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {row.original.device_id}
        </code>
      ),
    },
    {
      id: "hhid",
      header: "HHID",
      cell: ({ row }) => (
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {row.original.details?.hhid || "—"}
        </code>
      ),
    },
    {
      id: "warning",
      header: "Warning",
      cell: ({ row }) => {
        const warning = row.original.details?.warning as string | undefined;
        const temp = row.original.details?.temperature as number | undefined;

        const isTemperatureWarning = warning === "Temperature Warning";
        const displayWarning =
          isTemperatureWarning && temp !== undefined
            ? `Temperature reached ${temp.toFixed(1)}°C`
            : warning || "—";

        const warningClass =
          warning === "USB Disconnected"
            ? "text-amber-600"
            : warning === "USB Connected"
              ? "text-green-600"
              : "text-red-600";

        return (
          <div className={`flex items-center gap-2 text-sm font-medium ${warningClass}`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{displayWarning}</span>
          </div>
        );
      },
    },
  ];

  const eTable = useReactTable({
    data: eData, columns: eColumns, getCoreRowModel: getCoreRowModel(),
    manualPagination: true, pageCount: Math.ceil(eTotal / eFilters.limit),
  });

  /* ═══ RENDER ═══ */
  return (
    <div className="p-4 space-y-6">
      <PageHeader title="Alerts" description="Monitor meter inactivity and critical device alerts" size="sm"
        badge={<Badge variant="destructive">{iTotal} inactive</Badge>} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inactivity"><WifiOff className="h-4 w-4 mr-1.5" /> Inactivity Alerts</TabsTrigger>
          <TabsTrigger value="events"><Bell className="h-4 w-4 mr-1.5" /> Event Alerts</TabsTrigger>
        </TabsList>

        {/* ═══ INACTIVITY TAB ═══ */}
        <TabsContent value="inactivity" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search device ID..." className="pl-10"
                value={iFilters.device_id}
                onChange={(e) => setIFilters((p) => ({ ...p, device_id: e.target.value, page: 1 }))} />
            </div>

            {/* Inactivity duration filter */}
            <ButtonGroup>
              <Dialog open={iFilterDialogOpen} onOpenChange={setIFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"
                    onClick={() => { setITempFilters(iFilters); setIFilterDialogOpen(true); }}>
                    <Filter className="mr-2 h-4 w-4" /> Filter
                    {iHasFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">1</Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter Inactivity Alerts</DialogTitle>
                    <DialogDescription>
                      Filter by inactivity duration. Results always sorted shortest inactivity first.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <Label>Inactivity Duration</Label>
                      <div className="grid gap-2">
                        {INACTIVITY_FILTER_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => setITempFilters((p) => ({ ...p, inactivity_filter: opt.value }))}
                            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50
                              ${iTempFilters.inactivity_filter === opt.value
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border"}`}>
                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.description}</p>
                            </div>
                            {iTempFilters.inactivity_filter === opt.value && (
                              <span className="text-primary font-bold text-sm">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIFilterDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleApplyIFilters}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {iHasFilters && (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleClearIFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            {/* Active filter pill */}
            {iFilters.inactivity_filter !== "all" && (
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${getFilterPillClass(iFilters.inactivity_filter)}`}>
                <Clock className="h-3 w-3" />
                {activeFilterOpt?.label}
              </div>
            )}

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={handleRunCheck} disabled={iChecking}>
              <Play className={`mr-2 h-4 w-4 ${iChecking ? "animate-spin" : ""}`} /> Run Check
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={iExporting || iTotal === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>

          {renderTable(iTable, iColumns, iLoading, iData, iTotal, iFilters, setIFilters, "inactivity")}
        </TabsContent>

        {/* ═══ EVENT ALERTS TAB ═══ */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search device ID..."
                className="pl-10"
                value={eFilters.device_id ?? ""}
                onChange={(e) => setEFilters((p) => ({ ...p, device_id: e.target.value, page: 1 }))}
              />
            </div>

            <ButtonGroup>
              <Dialog open={eDialogOpen} onOpenChange={setEDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    setETempFilters(eFilters); setETempStart(eStartDT);
                    setETempEnd(eEndDT); setEDialogOpen(true);
                  }}>
                    <Filter className="mr-2 h-4 w-4" /> Filters
                    {eHasFilters && <Badge variant="secondary" className="ml-2 text-xs">
                      {[eFilters.device_id && 1, eStartDT.date && 1, eEndDT.date && 1].filter(Boolean).length}
                    </Badge>}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Filter Alerts</DialogTitle>
                    <DialogDescription>Narrow down by device and time range.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g. IM000102" value={eTempFilters.device_id ?? ""}
                          onChange={(e) => setETempFilters((p) => ({ ...p, device_id: e.target.value }))} className="pl-10" />
                      </div>
                    </div>
                    <DateTimePicker label="Start Date & Time" value={eTempStart} onChange={setETempStart} />
                    <DateTimePicker label="End Date & Time" value={eTempEnd} onChange={setETempEnd} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setEFilters({ ...eTempFilters, page: 1 }); setEStartDT(eTempStart);
                      setEEndDT(eTempEnd); setEDialogOpen(false); toast.success("Filters applied");
                    }}>Apply Filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {eHasFilters && (
                <Button variant="outline" size="icon" onClick={() => {
                  const r = { device_id: "", page: 1, limit: eFilters.limit };
                  setEFilters(r); setETempFilters(r); setEStartDT({}); setEEndDT({});
                  setETempStart({}); setETempEnd({}); toast("Filters cleared");
                }}><X className="h-4 w-4" /></Button>
              )}
            </ButtonGroup>

            <ButtonGroup>
              <Select value={eRefreshInterval ? String(eRefreshInterval) : "off"}
                onValueChange={(v) => setERefreshInterval(v === "off" ? null : Number(v))}>
                <SelectTrigger className="w-fit"><SelectValue placeholder="Refresh: Off" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Refresh: Off</SelectItem>
                  <SelectItem value="10000">Every 10s</SelectItem>
                  <SelectItem value="30000">Every 30s</SelectItem>
                  <SelectItem value="60000">Every 1 min</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { toast.success("Refreshed"); setERefreshing(true); fetchEventAlerts(); }}
                disabled={eRefreshing} variant="outline" size="icon">
                <RefreshCw className={`h-4 w-4 ${eRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </ButtonGroup>
          </div>

          {renderTable(eTable, eColumns, eLoading, eData, eTotal, eFilters, setEFilters, "events")}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Shared table renderer ───────────────────────────── */
function renderTable<T>(
  table: any, columns: ColumnDef<T>[], loading: boolean, data: T[],
  total: number, filters: { page: number; limit: number },
  setFilters: (fn: (p: any) => any) => void, type: string,
) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="max-h-[65vh] overflow-auto">
        <Table className="w-full border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((hg: any) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h: any) => (
                  <TableHead
                    key={h.id}
                    className="bg-muted/60 whitespace-nowrap align-middle"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Spinner className="h-8 w-8" />
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        {type === "inactivity"
                          ? <WifiOff className="h-12 w-12 text-green-500" />
                          : <AlertTriangle className="h-12 w-12 text-destructive" />}
                      </EmptyMedia>
                      <EmptyTitle>{type === "inactivity" ? "No meters found" : "No alerts found"}</EmptyTitle>
                      <EmptyDescription>
                        {type === "inactivity"
                          ? "No inactive meters match the current filter"
                          : "No active alerts at the moment"}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Showing {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-3">
            <Select
              value={String(filters.limit)}
              onValueChange={(v) => setFilters((p: any) => ({ ...p, limit: Number(v), page: 1 }))}
            >
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ButtonGroup>
              <Button
                variant="outline"
                size="icon"
                disabled={filters.page === 1}
                onClick={() => setFilters((p: any) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium p-2 pb-0 border-y">
                Page {filters.page} of {Math.ceil(total / filters.limit)}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={filters.page >= Math.ceil(total / filters.limit)}
                onClick={() => setFilters((p: any) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )}
    </div>
  );
}