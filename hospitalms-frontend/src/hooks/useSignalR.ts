import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5004/hubs/hospital';

export interface SignalREvent {
  event: string;
  handler: (...args: unknown[]) => void;
}

export const useSignalR = (events: SignalREvent[], enabled = true) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const connect = useCallback(async () => {
    const token = localStorage.getItem('hms_token');
    if (!token || !enabled) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?access_token=${token}`, {
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    events.forEach(({ event, handler }) => {
      connection.on(event, handler);
    });

    try {
      await connection.start();
      connectionRef.current = connection;
    } catch (err) {
      console.warn('SignalR connection failed:', err);
    }
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (connectionRef.current) connectionRef.current.stop();
    };
  }, [connect]);

  return connectionRef;
};
