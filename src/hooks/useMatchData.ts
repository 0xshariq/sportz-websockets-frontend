import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMatchCommentary, fetchMatches, isAbortError } from '../services/api';
import type { Commentary, Match, WSMessage } from '../utils/types';
import { useWebSocket } from './useWebSocket';

interface UseMatchData { matches: Match[]; isLoading: boolean; error: string | null; commentary: Commentary[]; isCommentaryLoading: boolean; wsError: string | null; status: ReturnType<typeof useWebSocket>['status']; activeMatchId: number | null; newMatchesCount: number; dismissNewMatches: () => void; watchMatch: (id: string | number) => void; unwatchMatch: (id: string | number) => void; reloadMatches: () => void; }

export const useMatchData = (): UseMatchData => {
  const [matches, setMatches] = useState<Match[]>([]); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<Commentary[]>([]); const [isCommentaryLoading, setIsCommentaryLoading] = useState(false); const [wsError, setWsError] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null); const [newMatchesCount, setNewMatchesCount] = useState(0);
  const activeRef = useRef<number | null>(null); const matchesRef = useRef<Match[]>([]); const knownIdsRef = useRef(new Set<number>()); const liveScoresRef = useRef(new Map<number, Pick<Match, 'homeScore' | 'awayScore'>>());
  const subscribedRef = useRef(new Set<number>()); const requestRef = useRef(0); const pollRef = useRef(0); const pollAbortRef = useRef<AbortController | null>(null); const commentaryAbortRef = useRef<AbortController | null>(null);
  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === 'match_created') setMatches(current => { if (knownIdsRef.current.has(message.data.id) || current.some(match => match.id === message.data.id)) return current; knownIdsRef.current.add(message.data.id); setNewMatchesCount(count => count + 1); return [message.data, ...current]; });
    else if (message.type === 'score_update') { liveScoresRef.current.set(message.matchId, message.data); setMatches(current => current.map(match => match.id === message.matchId ? { ...match, ...message.data } : match)); }
    else if (message.type === 'commentary' && message.data.matchId === activeRef.current) setCommentary(current => current.some(item => item.id === message.data.id) ? current : [message.data, ...current]);
    else if (message.type === 'error') setWsError(`${message.code}: ${message.message}`);
  }, []);
  const { status, subscribeMatch, unsubscribeMatch } = useWebSocket(handleMessage);
  const loadMatches = useCallback(async () => {
    const sequence = ++pollRef.current; pollAbortRef.current?.abort(); const controller = new AbortController(); pollAbortRef.current = controller; setError(null);
    try { const next = (await fetchMatches(100, controller.signal)).data; if (sequence !== pollRef.current) return; const nextIds = new Set(next.map(match => match.id)); const added = [...nextIds].filter(id => !knownIdsRef.current.has(id)); if (knownIdsRef.current.size) setNewMatchesCount(count => count + added.length); knownIdsRef.current = new Set([...knownIdsRef.current, ...nextIds]); const merged = next.map(match => ({ ...match, ...liveScoresRef.current.get(match.id) })); matchesRef.current = merged; setMatches(merged); }
    catch (cause) { if (!isAbortError(cause) && sequence === pollRef.current) setError(cause instanceof Error ? cause.message : 'Failed to load matches'); }
    finally { if (sequence === pollRef.current) setIsLoading(false); }
  }, []);
  useEffect(() => { const initialLoad = setTimeout(() => void loadMatches(), 0); const interval = setInterval(() => void loadMatches(), 5000); return () => { clearTimeout(initialLoad); clearInterval(interval); pollAbortRef.current?.abort(); commentaryAbortRef.current?.abort(); }; }, [loadMatches]);
  useEffect(() => { const id = activeMatchId; const match = id == null ? undefined : matches.find(item => item.id === id); const shouldSubscribe = !!id && match?.status.toLowerCase() === 'live'; if (id && shouldSubscribe && !subscribedRef.current.has(id)) { subscribedRef.current.add(id); subscribeMatch(id); } if (id && !shouldSubscribe && subscribedRef.current.has(id)) { subscribedRef.current.delete(id); unsubscribeMatch(id); } }, [activeMatchId, matches, subscribeMatch, unsubscribeMatch]);
  const watchMatch = useCallback((rawId: string | number) => { const id = Number(rawId); if (!Number.isInteger(id)) return; const requestId = ++requestRef.current; commentaryAbortRef.current?.abort(); const controller = new AbortController(); commentaryAbortRef.current = controller; activeRef.current = id; setActiveMatchId(id); setCommentary([]); setWsError(null); setIsCommentaryLoading(true); fetchMatchCommentary(id, 100, controller.signal).then(result => { if (requestRef.current === requestId) setCommentary(result.data); }).catch(cause => { if (!isAbortError(cause) && requestRef.current === requestId) setCommentary([]); }).finally(() => { if (requestRef.current === requestId) setIsCommentaryLoading(false); }); }, []);
  const unwatchMatch = useCallback((rawId: string | number) => { const id = Number(rawId); if (!Number.isInteger(id)) return; requestRef.current += 1; commentaryAbortRef.current?.abort(); if (subscribedRef.current.has(id)) { subscribedRef.current.delete(id); unsubscribeMatch(id); } if (activeRef.current === id) { activeRef.current = null; setActiveMatchId(null); setCommentary([]); setIsCommentaryLoading(false); } }, [unsubscribeMatch]);
  return { matches, isLoading, error, commentary, isCommentaryLoading, wsError, status, activeMatchId, newMatchesCount, dismissNewMatches: () => setNewMatchesCount(0), watchMatch, unwatchMatch, reloadMatches: loadMatches };
};
