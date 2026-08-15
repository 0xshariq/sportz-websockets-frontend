import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY, WS_BASE_URL } from '../utils/constants';
import type { ConnectionStatus, WSClientMessage, WSMessage } from '../utils/types';

interface UseWebSocketReturn { status: ConnectionStatus; subscribeMatch: (matchId: string | number) => void; unsubscribeMatch: (matchId: string | number) => void; disconnect: () => void; }

const isWSMessage = (value: unknown): value is WSMessage => {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;
  const type = (value as { type?: unknown }).type;
  if (type === 'welcome') return true;
  if (type === 'error') return typeof (value as { code?: unknown }).code === 'string' && typeof (value as { message?: unknown }).message === 'string';
  if (type === 'match_created' || type === 'commentary') return typeof (value as { data?: unknown }).data === 'object';
  if (type === 'score_update' || type === 'subscribed' || type === 'unsubscribed') return Number.isInteger((value as { matchId?: unknown }).matchId);
  return false;
};

export const useWebSocket = (onMessage: (message: WSMessage) => void): UseWebSocketReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null); const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0); const intentionalCloseRef = useRef(false); const subscriptionsRef = useRef(new Set<number>());
  const onMessageRef = useRef(onMessage); const connectRef = useRef<() => void>(() => undefined);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  const send = useCallback((message: WSClientMessage) => { const socket = socketRef.current; if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }, []);
  const connect = useCallback(() => {
    if (intentionalCloseRef.current) return;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    socketRef.current?.close(); setStatus(attemptsRef.current ? 'reconnecting' : 'connecting');
    const socket = new WebSocket(WS_BASE_URL); socketRef.current = socket;
    socket.onopen = () => { attemptsRef.current = 0; setStatus('connected'); subscriptionsRef.current.forEach(matchId => socket.send(JSON.stringify({ type: 'subscribe', matchId }))); };
    socket.onmessage = event => { try { const parsed: unknown = JSON.parse(event.data); if (isWSMessage(parsed)) onMessageRef.current(parsed); } catch { /* malformed frames do not change connection status */ } };
    socket.onerror = () => {
      // onclose owns reconnect scheduling; keep the UI in a recoverable state during transient failures.
      setStatus('reconnecting');
    };
    socket.onclose = () => { if (socketRef.current !== socket || intentionalCloseRef.current) return; socketRef.current = null; setStatus('reconnecting'); const delay = Math.min(INITIAL_RECONNECT_DELAY * (2 ** attemptsRef.current), MAX_RECONNECT_DELAY); attemptsRef.current += 1; reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay); };
  }, []);
  useEffect(() => { intentionalCloseRef.current = false; connectRef.current = connect; connect(); return () => { intentionalCloseRef.current = true; if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current); socketRef.current?.close(); }; }, [connect]);
  const subscribeMatch = useCallback((rawId: string | number) => { const id = Number(rawId); if (!Number.isInteger(id)) return; subscriptionsRef.current.add(id); send({ type: 'subscribe', matchId: id }); }, [send]);
  const unsubscribeMatch = useCallback((rawId: string | number) => { const id = Number(rawId); if (!Number.isInteger(id)) return; subscriptionsRef.current.delete(id); send({ type: 'unsubscribe', matchId: id }); }, [send]);
  const disconnect = useCallback(() => { intentionalCloseRef.current = true; if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current); socketRef.current?.close(); socketRef.current = null; setStatus('disconnected'); }, []);
  return { status, subscribeMatch, unsubscribeMatch, disconnect };
};
