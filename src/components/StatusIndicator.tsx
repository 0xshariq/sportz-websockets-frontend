import React from 'react';
import type { ConnectionStatus } from '../utils/types';
interface StatusIndicatorProps { status: ConnectionStatus; }
const STATUS_CONFIG: Partial<Record<ConnectionStatus, [string, string]>> = { connected: ['#4caf50', 'LIVE'], connecting: ['#ffdc3e', 'CONNECTING'], reconnecting: ['#f59e0b', 'RECONNECTING'], error: ['#e7444d', 'ERROR'] };
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => { const current = STATUS_CONFIG[status] ?? ['#d1d1d1', 'OFFLINE']; return <div className="text-[13px] font-bold"><span className="mr-1.5 inline-block size-2.5 rounded-full border border-[#171717]" style={{ background: current[0] }} />{current[1]}</div>; };
