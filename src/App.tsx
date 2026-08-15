import React, { useMemo, useState } from 'react';
import { useMatchData } from './hooks/useMatchData';
import { MatchCard } from './components/MatchCard';
import { LiveFeed } from './components/LiveFeed';
import { StatusIndicator } from './components/StatusIndicator';
import { API_BASE_URL, WS_BASE_URL } from './utils/constants';

const App: React.FC = () => {
  const pageSize = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const { matches, isLoading, error, commentary, isCommentaryLoading, wsError, status, activeMatchId, newMatchesCount, dismissNewMatches, watchMatch, unwatchMatch, reloadMatches } = useMatchData();
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const pagedMatches = useMemo(() => matches.slice((effectivePage - 1) * pageSize, effectivePage * pageSize), [matches, effectivePage]);

  return <div className="app-shell font-sans">
    <header className="flex items-center justify-between gap-5 rounded-[18px] border-[3px] border-[#171717] bg-[#ffdc3e] px-5 py-6 shadow-[5px_5px_0_#171717] sm:px-[26px]">
      <div><h1 className="m-0 text-[30px] font-extrabold leading-none tracking-[-1.5px]">Sportz</h1><p className="mt-2 mb-0 text-[13px] font-bold">Real-time match data demo</p></div>
      <div className="flex flex-col items-end gap-1"><StatusIndicator status={status} /></div>
    </header>
    {error && <div role="status" aria-live="polite" className="mt-5 rounded-[14px] border-2 border-[#df3d48] bg-[#fff0f0] p-4 text-sm font-bold text-[#a51e2a]"><strong>Backend unavailable</strong><p className="mt-1 mb-0 font-semibold">The match list will retry automatically.</p></div>}
    {wsError && <div role="status" aria-live="polite" className="mt-5 rounded-[14px] border-2 border-[#d39b00] bg-[#fff8d8] p-4 text-sm font-bold text-[#684d00]"><strong>Live update notice</strong><p className="mt-1 mb-0 font-semibold">{wsError}. The dashboard will continue reconnecting automatically.</p></div>}
    <div className="dashboard mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(310px,.95fr)]">
      <main>
        <div className="mb-4 flex items-center justify-between"><h2 className="m-0 border-l-[5px] border-[#a9dff7] pl-3 text-xl font-bold">Current Matches</h2><span className="mono rounded bg-[#171717] px-2 py-1 text-xs font-bold text-white">API: {isLoading ? '…' : matches.length}</span></div>
        {newMatchesCount > 0 && <div role="status" aria-live="polite" className="mb-4 flex items-center justify-between rounded-[14px] border-2 border-[#171717] bg-[#ffdc3e] p-4 text-[13px] font-extrabold"><span>{newMatchesCount} new match{newMatchesCount > 1 ? 'es' : ''} added</span><button className="rounded-md border-2 border-[#171717] bg-white px-2 py-1 text-[11px] font-extrabold" onClick={dismissNewMatches}>Dismiss</button></div>}
        {isLoading && <div className="rounded-[14px] border-2 border-[#171717] bg-white p-4 text-center font-bold">Loading matches…</div>}
        {error && <div role="alert" className="mb-4 rounded-[14px] border-2 border-[#df3d48] bg-[#fff0f0] p-4 text-center text-[#a51e2a]"><strong>Connection Error</strong><p>{error}</p><button className="rounded-md border-2 border-[#171717] bg-white px-2 py-1 text-[11px] font-extrabold" onClick={reloadMatches}>Retry Connection</button></div>}
        {!isLoading && !error && matches.length === 0 && <div className="rounded-[14px] border-2 border-[#171717] bg-white p-4 text-center font-bold">No matches found</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{pagedMatches.map(match => <MatchCard key={match.id} match={match} isActive={activeMatchId == match.id} onWatch={watchMatch} onUnwatch={unwatchMatch} />)}</div>
        {!isLoading && !error && matches.length > pageSize && <div className="mt-4 flex items-center justify-between text-xs text-[#666]"><span>Page {effectivePage} of {totalPages}</span><div className="flex gap-2"><button className="rounded-md border-2 border-[#171717] bg-white px-2 py-1 text-[11px] font-extrabold disabled:cursor-default disabled:opacity-40" disabled={effectivePage === 1} onClick={() => setCurrentPage(Math.max(1, effectivePage - 1))}>Prev</button><button className="rounded-md border-2 border-[#171717] bg-white px-2 py-1 text-[11px] font-extrabold disabled:cursor-default disabled:opacity-40" disabled={effectivePage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button></div></div>}
      </main>
      <aside><LiveFeed messages={commentary} isActive={!!activeMatchId} isLoading={isCommentaryLoading} /></aside>
    </div>
    {import.meta.env.DEV && <section className="mt-11 rounded-[14px] border-2 border-[#171717] bg-white p-4 sm:p-5"><h3 className="mb-4 mt-0 text-[17px]">● &nbsp;Testing &amp; Verification</h3><div className="grid gap-8 text-[13px] text-[#555] sm:grid-cols-2"><div><h4 className="m-0 mb-2 text-[#171717]">Configuration</h4><ul className="m-0 pl-5 leading-7"><li>REST URL: <code>{API_BASE_URL}</code></li><li>WS URL: <code>{WS_BASE_URL}</code></li><li>Modify these in <code>constants.ts</code></li></ul></div><div><h4 className="m-0 mb-2 text-[#171717]">How to Verify</h4><p>1. Click an action button on any card.</p><p>2. The status indicator will turn green.</p><p>3. Wait for <code>score_update</code> or <code>commentary</code> events.</p></div></div></section>}
    <footer className="mt-12 flex flex-col gap-2 border-t-[3px] border-[#171717] pt-5 text-[12px] font-bold text-[#555] sm:flex-row sm:items-center sm:justify-between"><span>Sportz Live Dashboard</span><span className="mono">REST + WebSocket updates</span></footer>
  </div>;
};
export default App;
