import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMatchCommentary, fetchMatches } from '../services/api';
import type { Commentary, Match, WSMessage } from '../utils/types';
import { useWebSocket } from './useWebSocket';

interface UseMatchData {
  matches: Match[]; isLoading: boolean; error: string | null; commentary: Commentary[];
  isCommentaryLoading: boolean; wsError: string | null; status: ReturnType<typeof useWebSocket>['status'];
  activeMatchId: number | null; newMatchesCount: number; dismissNewMatches: () => void;
  watchMatch: (id: string | number) => void; unwatchMatch: (id: string | number) => void; reloadMatches: () => void;
}

export const useMatchData = (): UseMatchData => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [newMatchesCount, setNewMatchesCount] = useState(0);
  const activeRef = useRef<number | null>(null);
  const knownIdsRef = useRef(new Set<number>());
  const subscribedRef = useRef(new Set<number>());
  const requestRef = useRef(0);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === 'match_created') {
      setMatches((current) => current.some((match) => match.id === message.data.id) ? current : [message.data, ...current]);
      setNewMatchesCount((count) => count + 1);
    } else if (message.type === 'score_update') {
      setMatches((current) => current.map((match) => match.id === message.matchId ? { ...match, ...message.data } : match));
    } else if (message.type === 'commentary' && message.data.matchId === activeRef.current) {
      setCommentary((current) => current.some((item) => item.id === message.data.id) ? current : [message.data, ...current]);
    } else if (message.type === 'error') {
      setWsError(`${message.code}: ${message.message}`);
    }
  }, []);

  const { status, subscribeMatch, unsubscribeMatch } = useWebSocket(handleMessage);

  const loadMatches = useCallback(async () => {
    setError(null);
    try {
      const next = (await fetchMatches(100)).data;
      const nextIds = new Set(next.map((match) => match.id));
      if (knownIdsRef.current.size) setNewMatchesCount((count) => count + [...nextIds].filter((id) => !knownIdsRef.current.has(id)).length);
      knownIdsRef.current = nextIds;
      setMatches(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to load matches'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadMatches(), 0);
    const interval = setInterval(() => void loadMatches(), 5000);
    return () => { clearTimeout(initialLoad); clearInterval(interval); };
  }, [loadMatches]);

  const watchMatch = useCallback((rawId: string | number) => {
    const id = Number(rawId);
    if (!Number.isInteger(id)) return;
    const requestId = ++requestRef.current;
    activeRef.current = id;
    setActiveMatchId(id); setCommentary([]); setWsError(null); setIsCommentaryLoading(true);
    if (subscribedRef.current.has(id)) unsubscribeMatch(id);
    const match = matches.find((item) => item.id === id);
    if (match?.status.toLowerCase() === 'live') { subscribedRef.current.add(id); subscribeMatch(id); }
    fetchMatchCommentary(id).then((result) => { if (requestRef.current === requestId) setCommentary(result.data); }).catch(() => { if (requestRef.current === requestId) setCommentary([]); }).finally(() => { if (requestRef.current === requestId) setIsCommentaryLoading(false); });
  }, [matches, subscribeMatch, unsubscribeMatch]);

  const unwatchMatch = useCallback((rawId: string | number) => {
    const id = Number(rawId);
    if (!Number.isInteger(id)) return;
    unsubscribeMatch(id); subscribedRef.current.delete(id);
    if (activeRef.current === id) { activeRef.current = null; setActiveMatchId(null); setCommentary([]); setIsCommentaryLoading(false); }
  }, [unsubscribeMatch]);

  return { matches, isLoading, error, commentary, isCommentaryLoading, wsError, status, activeMatchId, newMatchesCount, dismissNewMatches: () => setNewMatchesCount(0), watchMatch, unwatchMatch, reloadMatches: loadMatches };
};
