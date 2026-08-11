import React, { useEffect, useMemo, useState } from 'react';
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
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  const pagedMatches = useMemo(() => matches.slice((currentPage - 1) * pageSize, currentPage * pageSize), [matches, currentPage]);

  return <div className="app-shell">
    <header className="header">
      <div className="brand"><h1>Sportz</h1><p>Real-time match data demo</p></div>
      <div className="status-wrap"><StatusIndicator status={status} />{wsError && <span className="mono" style={{ fontSize: 10 }}>WS: {wsError}</span>}</div>
    </header>
    <div className="dashboard">
      <main>
        <div className="section-heading"><h2>Current Matches</h2><span className="api-count">API: {isLoading ? '…' : matches.length}</span></div>
        {newMatchesCount > 0 && <div className="notice"><span>{newMatchesCount} new match{newMatchesCount > 1 ? 'es' : ''} added</span><button className="small-btn" onClick={dismissNewMatches}>Dismiss</button></div>}
        {isLoading && <div className="empty-box">Loading matches…</div>}
        {error && <div className="error-box"><strong>Connection Error</strong><p>{error}</p><button className="small-btn" onClick={reloadMatches}>Retry Connection</button></div>}
        {!isLoading && !error && matches.length === 0 && <div className="empty-box">No matches found</div>}
        <div className="match-grid">{pagedMatches.map(match => <MatchCard key={match.id} match={match} isActive={activeMatchId == match.id} onWatch={watchMatch} onUnwatch={unwatchMatch} />)}</div>
        {!isLoading && !error && matches.length > pageSize && <div className="pagination"><span>Page {currentPage} of {totalPages}</span><div className="action-row"><button className="small-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button><button className="small-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button></div></div>}
      </main>
      <aside><LiveFeed messages={commentary} isActive={!!activeMatchId} isLoading={isCommentaryLoading} /></aside>
    </div>
    <section className="verification"><h3>● &nbsp;Testing &amp; Verification</h3><div className="verification-grid"><div><h4>Configuration</h4><ul><li>REST URL: <code>{API_BASE_URL}</code></li><li>WS URL: <code>{WS_BASE_URL}</code></li><li>Modify these in <code>constants.ts</code></li></ul></div><div><h4>How to Verify</h4><p>1. Click an action button on any card.</p><p>2. The status indicator will turn green.</p><p>3. Wait for <code>score_update</code> or <code>commentary</code> events. Scores update instantly and commentary appears in the right panel.</p></div></div></section>
  </div>;
};
export default App;
