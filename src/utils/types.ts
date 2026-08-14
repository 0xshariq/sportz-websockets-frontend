export interface Match {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: 'scheduled' | 'live' | 'finished' | string;
  startTime: string;
  endTime?: string;
  homeScore: number;
  awayScore: number;
  createdAt?: string;
}

export interface MatchResponse { data: Match[]; }
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface Commentary {
  id: number;
  matchId: number;
  minute?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  message: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdAt?: string;
}

export interface CommentaryResponse { data: Commentary[]; }
export interface WSMessageCommentary { type: 'commentary'; data: Commentary; }
export interface WSMessageScore { type: 'score_update'; matchId: number; data: { homeScore: number; awayScore: number; }; }
export interface WSMessageCreated { type: 'match_created'; data: Match; }
export interface WSMessageWelcome { type: 'welcome'; }
export interface WSMessageError { type: 'error'; code: string; message: string; }
export interface WSMessageSubscribed { type: 'subscribed'; matchId: number; }
export interface WSMessageUnsubscribed { type: 'unsubscribed'; matchId: number; }
export type WSMessage = WSMessageCommentary | WSMessageScore | WSMessageCreated | WSMessageWelcome | WSMessageError | WSMessageSubscribed | WSMessageUnsubscribed;
export type WSClientMessage = { type: 'subscribe' | 'unsubscribe'; matchId: number };
