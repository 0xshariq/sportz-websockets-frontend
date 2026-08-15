import type { Match } from './types';

const FINISHED_STATUSES = new Set(['finished', 'complete', 'completed', 'ended', 'final', 'closed', 'cancelled', 'canceled']);
const LIVE_STATUSES = new Set(['live', 'in_play', 'in-play', 'playing', 'ongoing']);

export const normalizeMatch = (match: Match): Match => {
  const rawStatus = String(match.status ?? '').trim().toLowerCase();
  const endTime = match.endTime ? new Date(match.endTime).getTime() : NaN;
  const startTime = new Date(match.startTime).getTime();
  const status = FINISHED_STATUSES.has(rawStatus) || (!Number.isNaN(endTime) && endTime <= Date.now())
    ? 'finished'
    : LIVE_STATUSES.has(rawStatus)
      ? 'live'
      : 'scheduled';
  return { ...match, status, startTime: Number.isNaN(startTime) ? match.startTime : new Date(startTime).toISOString(), endTime: Number.isNaN(endTime) ? match.endTime : new Date(endTime).toISOString() };
};

const parseValidDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatMatchDate = (value?: string) => {
  const date = parseValidDate(value);
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date) : 'Not provided';
};
export const formatMatchTime = (value?: string) => {
  const date = parseValidDate(value);
  return date ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).format(date) : 'Not provided';
};

export const matchStatusLabel = (status: Match['status']) => status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
export const normalizeMatches = (matches: Match[]) => matches.map(normalizeMatch);
