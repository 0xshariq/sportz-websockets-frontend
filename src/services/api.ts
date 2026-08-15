import { API_BASE_URL } from '../utils/constants';
import type { CommentaryResponse, Match, MatchResponse } from '../utils/types';
import { normalizeMatches } from '../utils/matches';

const clampLimit = (value: number) => Number.isFinite(value) ? Math.min(100, Math.max(1, Math.trunc(value))) : 100;
const FIRST_REQUEST_TIMEOUT_MS = 45_000;
const FIRST_REQUEST_RETRIES = 2;
let hasCompletedInitialRequest = false;

const readJson = async <T>(response: Response, resource: string): Promise<T> => {
  const body = await response.text();
  const parsed: unknown = (() => {
    try { return body ? JSON.parse(body) : null; }
    catch { throw new Error(`API error: ${response.status} ${response.statusText || 'Invalid JSON'} (${resource})`); }
  })();
  if (!response.ok) {
    const detail = typeof parsed === 'object' && parsed !== null && 'error' in parsed ? String(parsed.error) : response.statusText || 'Request failed';
    throw new Error(`API error: ${response.status} ${detail}`);
  }
  return parsed as T;
};

const request = async (url: string, signal?: AbortSignal) => {
  const isInitialRequest = !hasCompletedInitialRequest;
  const timeoutMs = isInitialRequest ? FIRST_REQUEST_TIMEOUT_MS : 10_000;
  const maxAttempts = isInitialRequest ? FIRST_REQUEST_RETRIES + 1 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok || !isInitialRequest || response.status < 500) {
        hasCompletedInitialRequest = true;
        return response;
      }
      lastError = new Error(`API error: ${response.status} ${response.statusText || 'Request failed'}`);
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('The backend is starting. Please retry shortly.');
};

const normalizeListResponse = <T>(payload: unknown, resource: string): { data: T[] } => {
  const data = Array.isArray(payload) ? payload : typeof payload === 'object' && payload !== null && 'data' in payload ? payload.data : null;
  if (!Array.isArray(data)) throw new Error(`Unexpected response from ${resource}: expected data array`);
  return { data: data as T[] };
};

export const fetchMatches = async (limit = 100, signal?: AbortSignal): Promise<MatchResponse> => {
  const resource = `${API_BASE_URL}/matches`;
  const response = normalizeListResponse<Match>(await readJson<unknown>(await request(`${resource}?limit=${clampLimit(limit)}`, signal), resource), resource);
  return { data: normalizeMatches(response.data) };
};

export const fetchMatchCommentary = async (matchId: string | number, limit = 100, signal?: AbortSignal): Promise<CommentaryResponse> => {
  const resource = `${API_BASE_URL}/matches/${encodeURIComponent(String(matchId))}/commentary`;
  return normalizeListResponse(await readJson<unknown>(await request(`${resource}?limit=${clampLimit(limit)}`, signal), resource), resource);
};

export const isAbortError = (cause: unknown) => cause instanceof DOMException && cause.name === 'AbortError';
