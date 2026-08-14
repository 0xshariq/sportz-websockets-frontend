import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY, WS_BASE_URL } from '../utils/constants';
import type { ConnectionStatus, WSClientMessage, WSMessage } from '../utils/types';

interface UseWebSocketReturn {
  status: ConnectionStatus;
  subscribeMatch: (matchId: string | number) => void;
  unsubscribeMatch: (matchId: string | number) => void;
  disconnect: () => void;
}

export const useWebSocket = (onMessage: (message: WSMessage) => void): UseWebSocketReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const subscriptionsRef = useRef(new Set<string>());
  const onMessageRef = useRef(onMessage);
  const connectRef = useRef<() => void>(() => undefined);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const send = useCallback((message: WSClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }, []);

  const connect = useCallback(() => {
    if (intentionalCloseRef.current) return;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    socketRef.current?.close();
    setStatus(attemptsRef.current ? 'reconnecting' : 'connecting');

    const socket = new WebSocket(WS_BASE_URL);
    socketRef.current = socket;
    socket.onopen = () => {
      attemptsRef.current = 0;
      setStatus('connected');
      subscriptionsRef.current.forEach((id) => socket.send(JSON.stringify({ type: 'subscribe', matchId: Number(id) })));
    };
    socket.onmessage = (event) => {
      try { onMessageRef.current(JSON.parse(event.data) as WSMessage); }
      catch { setStatus('error'); }
    };
    socket.onerror = () => setStatus('error');
    socket.onclose = () => {
      if (socketRef.current !== socket || intentionalCloseRef.current) return;
      socketRef.current = null;
      setStatus('disconnected');
      const delay = Math.min(INITIAL_RECONNECT_DELAY * (2 ** attemptsRef.current), MAX_RECONNECT_DELAY);
      attemptsRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
    };
  }, []);

  useEffect(() => { connectRef.current = connect; connect(); return () => {
    intentionalCloseRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    socketRef.current?.close();
  }; }, [connect]);

  const subscribeMatch = useCallback((matchId: string | number) => {
    const id = String(matchId);
    subscriptionsRef.current.add(id);
    send({ type: 'subscribe', matchId: Number(matchId) });
  }, [send]);

  const unsubscribeMatch = useCallback((matchId: string | number) => {
    subscriptionsRef.current.delete(String(matchId));
    send({ type: 'unsubscribe', matchId: Number(matchId) });
  }, [send]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    socketRef.current?.close();
    socketRef.current = null;
    setStatus('disconnected');
  }, []);

  return { status, subscribeMatch, unsubscribeMatch, disconnect };
};
