/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-unused-vars */
// services/remote-access.service.ts
import api from "./api";

export interface ActiveMeter {
  meterId: string;
  port: number;
  pid: number;
}

export interface MetersResponse {
  success: boolean;
  data: ActiveMeter[];
  msg: string;
}

class RemoteAccessService {
  /**
   * Get list of active meters
   */
  async listMeters(): Promise<MetersResponse> {
    const res = await api.get("/remote-access/meters");
    return res.data;
  }

  /**
   * Create WebSocket connection for remote access
   */
  createWebSocket(): WebSocket {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
    const ws = new WebSocket(`${wsUrl}/ws/remote-access`);
    return ws;
  }

  /**
   * Connect to a meter via WebSocket
   */
  connectToMeter(
    ws: WebSocket,
    meterId: string,
    port: number,
    userId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected") {
            clearTimeout(timeout);
            ws.removeEventListener("message", onMessage);
            resolve();
          } else if (data.type === "error") {
            clearTimeout(timeout);
            ws.removeEventListener("message", onMessage);
            reject(new Error(data.error));
          }
        } catch (e) {
          // Ignore parsing errors for other messages
        }
      };

      ws.addEventListener("message", onMessage);

      ws.send(
        JSON.stringify({
          type: "connect",
          meterId,
          port,
          userId,
        })
      );
    });
  }

  /**
   * Send input to the terminal
   */
  sendInput(ws: WebSocket, data: string): void {
    ws.send(
      JSON.stringify({
        type: "input",
        data,
      })
    );
  }

  /**
   * Resize terminal
   */
  resizeTerminal(ws: WebSocket, rows: number, cols: number): void {
    ws.send(
      JSON.stringify({
        type: "resize",
        rows,
        cols,
      })
    );
  }

  /**
   * Disconnect from meter
   */
  disconnect(ws: WebSocket): void {
    ws.send(
      JSON.stringify({
        type: "disconnect",
      })
    );
  }
}

export default new RemoteAccessService();