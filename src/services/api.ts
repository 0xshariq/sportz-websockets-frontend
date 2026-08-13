import { API_BASE_URL } from "../utils/constants";
import type { CommentaryResponse, MatchResponse } from "../utils/types";

const readJson = async <T>(response: Response, resource: string): Promise<T> => {
  const body = await response.text();
  let parsed: unknown;

  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    throw new Error(`Invalid JSON from ${resource}`);
  }

  if (!response.ok) {
    const detail = typeof parsed === "object" && parsed !== null && "message" in parsed
      ? String(parsed.message)
      : response.statusText;
    throw new Error(`API error: ${response.status} ${detail}`);
  }

  return parsed as T;
};

const normalizeListResponse = <T>(payload: unknown, resource: string): { data: T[] } => {
  const data = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null && "data" in payload
      ? (payload as { data: unknown }).data
      : null;

  if (!Array.isArray(data)) {
    throw new Error(`Unexpected response from ${resource}: expected an array in data`);
  }

  return { data: data as T[] };
};

export const fetchMatches = async (limit = 50): Promise<MatchResponse> => {
  const resource = `${API_BASE_URL}/matches`;
  const response = await fetch(`${resource}?limit=${limit}`, { method: "GET" });
  return normalizeListResponse(await readJson<unknown>(response, resource), resource);
};

export const fetchMatchCommentary = async (matchId: string | number, limit = 100): Promise<CommentaryResponse> => {
  const resource = `${API_BASE_URL}/matches/${encodeURIComponent(String(matchId))}/commentary`;
  const response = await fetch(`${resource}?limit=${limit}`, { method: "GET" });
  return normalizeListResponse(await readJson<unknown>(response, resource), resource);
};
