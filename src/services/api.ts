import { API_BASE_URL } from "../utils/constants";
import type { CommentaryResponse, MatchResponse } from "../utils/types";

export const fetchMatches = async (limit = 50): Promise<MatchResponse> => {
  const response = await fetch(`${API_BASE_URL}/matches?limit=${limit}`, { method: "GET" });
  if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
  return response.json();
};

export const fetchMatchCommentary = async (matchId: string | number, limit = 100): Promise<CommentaryResponse> => {
  const response = await fetch(`${API_BASE_URL}/matches/${matchId}/commentary?limit=${limit}`, { method: "GET" });
  if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
  return response.json();
};
