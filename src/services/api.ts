import { API_BASE_URL } from '../utils/constants';
import type { CommentaryResponse, MatchResponse } from '../utils/types';

const readJson = async <T>(response: Response, resource: string): Promise<T> => {
  const body = await response.text();
  let parsed: unknown;
  try { parsed = body ? JSON.parse(body) : null; } catch { throw new Error(`Invalid JSON from ${resource}`); }
  if (!response.ok) {
    const detail = typeof parsed === 'object' && parsed !== null && 'error' in parsed ? String(parsed.error) : response.statusText;
    throw new Error(`API error: ${response.status} ${detail}`);
  }
  return parsed as T;
};

const normalizeListResponse = <T>(payload: unknown, resource: string): { data: T[] } => {
  const data = Array.isArray(payload) ? payload : typeof payload === 'object' && payload !== null && 'data' in payload ? payload.data : null;
  if (!Array.isArray(data)) throw new Error(`Unexpected response from ${resource}: expected data array`);
  return { data: data as T[] };
};

export const fetchMatches = async (limit = 100): Promise<MatchResponse> => {
  const resource = `${API_BASE_URL}/matches`;
  return normalizeListResponse(await readJson<unknown>(await fetch(`${resource}?limit=${Math.min(limit, 100)}`), resource), resource);
};

export const fetchMatchCommentary = async (matchId: string | number, limit = 100): Promise<CommentaryResponse> => {
  const resource = `${API_BASE_URL}/matches/${encodeURIComponent(String(matchId))}/commentary`;
  return normalizeListResponse(await readJson<unknown>(await fetch(`${resource}?limit=${Math.min(limit, 100)}`), resource), resource);
};
