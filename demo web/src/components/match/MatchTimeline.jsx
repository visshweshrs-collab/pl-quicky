import React from 'react';

export default function MatchTimeline({
  timeline = [],
  homeTeam,
  awayTeam,
  isCompleted = false,
  isUpcoming = false,
  homeScore = null,
  awayScore = null,
}) {
  const isZeroZero =
    isCompleted &&
    homeScore !== null &&
    awayScore !== null &&
    Number(homeScore) === 0 &&
    Number(awayScore) === 0;

  if (isZeroZero) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18051E] border border-pl-border text-slate-400 mb-3 shadow-inner">
          <span className="text-xl">⚽</span>
        </div>
        <p className="font-display text-sm font-bold text-white">
          Match ended 0 – 0
        </p>
        <p className="text-xs text-pl-muted mt-1">
          No goal events recorded for this match.
        </p>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    if (isCompleted) {
      return (
        <div className="py-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18051E] border border-pl-border text-slate-400 mb-3 shadow-inner">
            <span className="text-xl">⚽</span>
          </div>
          <p className="font-display text-sm font-bold text-white">
            Goal events unavailable
          </p>
          <p className="text-xs text-pl-muted mt-1">
            Event breakdown is currently unavailable for this match.
          </p>
        </div>
      );
    }

    return (
      <div className="py-12 text-center text-sm text-slate-400">
        Goal events will be updated once the match gets underway.
      </div>
    );
  }

  // Ensure chronological order: base minute first, then stoppage/extra minute
  const sortedEvents = [...timeline].sort((a, b) => {
    const minA = a.minute ?? (parseInt(a.rawTime || a.displayMinute, 10) || 0);
    const minB = b.minute ?? (parseInt(b.rawTime || b.displayMinute, 10) || 0);
    if (minA !== minB) return minA - minB;
    const extA = a.extraMinute || 0;
    const extB = b.extraMinute || 0;
    return extA - extB;
  });

  return (
    <div className="relative py-4">
      {/* Team column headers */}
      <div className="flex items-center justify-between pb-6 border-b border-pl-border/50 text-xs font-bold uppercase tracking-wider text-pl-pinkLight">
        <div className="w-[45%] text-right truncate">
          {homeTeam?.name || 'Home'}
        </div>
        <div className="w-[10%] text-center text-slate-500 font-normal">
          Min
        </div>
        <div className="w-[45%] text-left truncate">
          {awayTeam?.name || 'Away'}
        </div>
      </div>

      {/* Central vertical divider line */}
      <div className="absolute left-1/2 top-14 bottom-0 w-px -translate-x-1/2 bg-pl-border/80" />

      <div className="mt-6 space-y-4">
        {sortedEvents.map((event, idx) => {
          const side = String(event.teamSide || event.team || '').toLowerCase();
          const isHome = side === 'home';
          const playerName = event.playerName || event.player || 'Player';
          const isOg =
            event.isOwnGoal === true ||
            String(event.detail || '').toLowerCase().includes('own goal');
          const displayName = isOg ? `${playerName} (OG)` : playerName;
          const displayMinute =
            event.displayMinute ||
            (event.extraMinute
              ? `${event.minute}+${event.extraMinute}'`
              : `${event.minute || 0}'`);

          return (
            <div key={idx} className="relative flex items-center justify-between">
              {/* Home Team Event (Left) */}
              <div
                className={`w-[44%] text-right ${
                  isHome ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {isHome && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-pl-border bg-pl-card/90 px-3.5 py-2.5 shadow-md hover:border-pl-pink/50 transition-colors">
                    <span className="font-mono text-xs font-black text-pl-pinkLight">
                      {displayMinute}
                    </span>
                    <span
                      className="text-sm select-none"
                      role="img"
                      aria-label="goal"
                    >
                      ⚽
                    </span>
                    <div className="text-right">
                      <p className="font-display text-xs sm:text-sm font-bold text-white">
                        {displayName}
                      </p>
                      {event.detail && !isOg && (
                        <p className="text-[10px] text-pl-muted">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Minute badge in center */}
              <div className="z-10 flex flex-col items-center">
                <span className="rounded-full bg-[#18051E] px-2 py-0.5 text-[10px] font-extrabold text-pl-pinkLight border border-pl-border shadow-sm">
                  {displayMinute}
                </span>
              </div>

              {/* Away Team Event (Right) */}
              <div
                className={`w-[44%] text-left ${
                  !isHome ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {!isHome && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-pl-border bg-pl-card/90 px-3.5 py-2.5 shadow-md hover:border-pl-pink/50 transition-colors">
                    <div className="text-left">
                      <p className="font-display text-xs sm:text-sm font-bold text-white">
                        {displayName}
                      </p>
                      {event.detail && !isOg && (
                        <p className="text-[10px] text-pl-muted">
                          {event.detail}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-sm select-none"
                      role="img"
                      aria-label="goal"
                    >
                      ⚽
                    </span>
                    <span className="font-mono text-xs font-black text-pl-pinkLight">
                      {displayMinute}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
