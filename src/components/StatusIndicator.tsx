import React from 'react';
import type { ConnectionStatus } from '../utils/types';
interface StatusIndicatorProps { status: ConnectionStatus; }
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => { const config: Record<string, string[]> = { connected: ['#4caf50', 'LIVE'], connecting: ['#ffdc3e', 'CONNECTING'], reconnecting: ['#f59e0b', 'RECONNECTING'], error: ['#e7444d', 'ERROR'] }; const current = config[status] || ['#d1d1d1', 'OFFLINE']; return <div className="status"><span className="live-dot" style={{ background: current[0] }} />{current[1]}</div>; };
