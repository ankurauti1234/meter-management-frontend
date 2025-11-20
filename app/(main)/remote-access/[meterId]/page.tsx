/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import remoteAccessService, {
  ActiveMeter,
} from "@/services/remote-access.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { RefreshCw, X, AlertCircle } from "lucide-react";

// import "xterm/css/xterm.css";

export default function TerminalPage() {
  const params = useParams();
  const router = useRouter();
  const meterId = params.meterId as string;

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meterInfo, setMeterInfo] = useState<ActiveMeter | null>(null);

  useEffect(() => {
    const fetchMeterInfo = async () => {
      try {
        const response = await remoteAccessService.listMeters();
        const meter = response.data.find((m) => m.meterId === meterId);

        if (!meter) {
          setError("Meter not found or no longer active");
          setIsConnecting(false);
          return;
        }

        setMeterInfo(meter);
        initializeTerminal(meter);
      } catch (err: any) {
        setError(
          err.response?.data?.msg || err.message || "Failed to load meter"
        );
        setIsConnecting(false);
      }
    };

    fetchMeterInfo();

    return () => {
      if (wsRef.current) {
        remoteAccessService.disconnect(wsRef.current);
        wsRef.current.close();
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }
    };
  }, [meterId]);

  const initializeTerminal = async (meter: ActiveMeter) => {
    if (!terminalRef.current) return;

    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.dispose();
    }

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "monospace",
      theme: {
        background: "#000000",
        foreground: "#d7d7d7",
        cursor: "#ffffff",
        selectionBackground: "#ffffff22",

        black: "#101010",
        red: "#ff4b4b",
        green: "#7fe081",
        yellow: "#ffd789",
        blue: "#6ba3ff",
        magenta: "#d57bff",
        cyan: "#71e7ff",
        white: "#cfcfcf",

        brightBlack: "#5a5a5a",
        brightRed: "#ff6d6d",
        brightGreen: "#98f29a",
        brightYellow: "#ffe6a7",
        brightBlue: "#95bbff",
        brightMagenta: "#e2aaff",
        brightCyan: "#9ff3ff",
        brightWhite: "#ffffff",
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    fit.fit();

    terminalInstanceRef.current = term;
    fitAddonRef.current = fit;

    // Resize handler
    const handleResize = () => {
      try {
        fit.fit();
        if (
          wsRef.current?.readyState === WebSocket.OPEN &&
          terminalInstanceRef.current
        ) {
          remoteAccessService.resizeTerminal(
            wsRef.current,
            terminalInstanceRef.current.rows,
            terminalInstanceRef.current.cols
          );
        }
      } catch (e) {}
    };

    window.addEventListener("resize", handleResize);

    // WebSocket setup
    try {
      const ws = remoteAccessService.createWebSocket();

      ws.onopen = async () => {
        const userCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user="));
        let userId = "anonymous";
        if (userCookie) {
          try {
            const userData = JSON.parse(
              decodeURIComponent(userCookie.split("=")[1])
            );
            userId = userData.id || userData.email || "user";
          } catch (e) {}
        }

        try {
          await remoteAccessService.connectToMeter(
            ws,
            meter.meterId,
            meter.port,
            userId
          );
          setIsConnected(true);
          setIsConnecting(false);
          term.writeln(
            "\x1b[32mConnected to meter: \x1b[1m" + meter.meterId + "\x1b[0m"
          );
          term.writeln("Type 'help' or 'exit' to disconnect.\r\n");
        } catch (err: any) {
          setError(err.message || "Failed to connect");
          setIsConnecting(false);
          term.writeln("\x1b[31mConnection failed: " + err.message + "\x1b[0m");
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "output") {
            term.write(data.data);
          } else if (data.type === "disconnected") {
            setIsConnected(false);
            term.writeln("\r\n\x1b[33mDisconnected from meter\x1b[0m");
          } else if (data.type === "error") {
            term.writeln("\r\n\x1b[31mError: " + data.error + "\x1b[0m");
          }
        } catch {
          term.write(event.data);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!error) {
          term.writeln("\r\n\x1b[33mConnection closed\x1b[0m");
        }
      };

      ws.onerror = () => {
        setError("Connection error");
        setIsConnecting(false);
      };

      wsRef.current = ws;

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          remoteAccessService.sendInput(ws, data);
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to establish connection");
      setIsConnecting(false);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      remoteAccessService.disconnect(wsRef.current);
      wsRef.current.close();
    }
    router.push("/remote-access");
  };

  const handleReconnect = () => {
    window.location.reload();
  };

  // Loading state
  if (isConnecting && !meterInfo) {
    return (
      <div className="space-y-6 p-4">
        <PageHeader
          title="Terminal"
          description="Connecting to meter..."
          size="sm"
        />
        <div className="flex-1 px-6">
          <Card className="h-full shadow-lg border bg-black/95 gap-0 p-0 outline-1 outline-offset-1  outline-border">
            <CardContent className="p-2 h-full">
              <Skeleton className="h-96 w-full rounded-lg overflow-hidden" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4">
      {/* Reusable Page Header */}
      <PageHeader
        size="sm"
        title={meterId}
        description={
          meterInfo ? (
            <span className="font-mono text-sm">
              Port: <span className="text-primary">{meterInfo.port}</span> •
              PID: {meterInfo.pid}
            </span>
          ) : (
            "Loading meter info..."
          )
        }
        // badge={
        //   <Badge
        //     variant={isConnecting ? "secondary" : isConnected ? "default" : "destructive"}
        //     className="gap-1.5"
        //   >
        //     <Activity className={`h-3 w-3 ${isConnecting ? "animate-pulse" : ""}`} />
        //     {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}
        //   </Badge>
        // }
        actions={
          <>
            {!isConnected && !isConnecting && (
              <Button onClick={handleReconnect} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
            )}
            <Button onClick={handleDisconnect} size="sm" variant="destructive">
              <X className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </>
        }
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-6 border-x-0 rounded-none">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Terminal */}
      <div className="flex-1 px-6">
        <Card className="h-full shadow-lg border bg-black/95 gap-0 p-0 outline-1 outline-offset-1  outline-border">
          <CardContent className="p-2 h-full">
            <div
              ref={terminalRef}
              className="h-full w-full rounded-lg overflow-hidden"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
