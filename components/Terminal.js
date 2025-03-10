'use client';

import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XSquare } from 'lucide-react';
import { createWebSocket } from '@/utils/ssh-apis';

export default function Terminal({ meterId, port, onClose }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const xterm = new XTerm({
      rows: 36,
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: '#0A0A0A',
        foreground: '#28BD66',
        cursor: '#ffffff',
      },
      scrollback: 1000,
    });
    xtermRef.current = xterm;

    if (terminalRef.current) {
      xterm.open(terminalRef.current);
      xterm.focus();
    }

    const websocket = createWebSocket();
    wsRef.current = websocket;

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: 'connect', meterId, port }));
      xterm.write(`Connecting to meter ${meterId}...\r\n`);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'output') {
        xterm.write(data.data);
      } else if (data.type === 'connected') {
        xterm.write(`Connected to meter ${meterId}\r\n`);
      } else if (data.type === 'disconnected') {
        xterm.write('Disconnected\r\n');
      } else if (data.type === 'error') {
        xterm.write(`Error: ${data.error}\r\n`);
      }
    };

    websocket.onerror = (error) => {
      xterm.write(`WebSocket error: ${error.message}\r\n`);
    };

    websocket.onclose = () => {
      xterm.write('WebSocket connection closed\r\n');
    };

    xterm.onData((data) => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'disconnect' }));
        websocket.close();
      }
      xterm.dispose();
    };
  }, [meterId, port]);

  const handleDisconnect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
      wsRef.current.close();
    }
    onClose();
  };

  return (
    <Card className="h-fit flex flex-col bg-background">
      <CardHeader className="py-3 px-4 border-b border-border">
        <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>Terminal Connection: Meter {meterId}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDisconnect}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted"
          >
            <XSquare className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden bg-[#0A0A0A]">
        <div ref={terminalRef} className="w-full h-full overflow-hidden" />
      </CardContent>
      <CardFooter className="px-4 py-3 border-t border-border flex justify-between items-center bg-muted rounded-b-lg">
        <div className="text-xs text-muted-foreground">Port: {port}</div>
        <Button onClick={handleDisconnect} variant="destructive" size="sm">
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
}