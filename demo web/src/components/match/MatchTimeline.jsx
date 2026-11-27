import React from 'react';

const UNKNOWN_NAMES = new Set(['', 'unknown player', 'player', 'unknown']);

function EventCard({ event, align }) {
  const isRight = align === 'right';

  const rawName = String(
    event.knownName || event.playerName || event.player || ''
  ).trim();
  const playerName = UNKNOWN_NAMES.has(rawName.toLowerCase())
    ? 'Scorer unavailable'
    : rawName;

  const detailText = String(event.detail || '');
  const isOg =
    event.isOwnGoal === true || detailText.toLowerCase().includes('own goal');
  const isPenalty = detailText.toLowerCase().includes('penalty');

  // Own goals and penalties get their own label; other detail strings
  // ("Left foot shot", "Header") are shown as a quiet subtitle.
  const subtitle = isOg
    ? 'Own goal'
    : isPenalty
      ? 'Penalty'
      : detailText && detailText.toLowerCase() !== 'goal'
        ? detailText
        : '';

  return (
    <div
      className={`inline-flex max-w-full items-center gap-2 rounded-xl border bg-pl-card/90 px-3 py-2 shadow-md transition-colors hover:border-pl-pink/50 ${
        isOg ? 'border-pl-pink/40' : 'border-pl-border'
      } ${isRight ? 'flex-row-reverse text-right' : 'text-left'}`}
    >
      <span className="text-sm select-none" role="img" aria-label="goal">
        ⚽
      </span>

      <div className="min-w-0">
        <p className="font-display text-xs sm:text-sm font-bold leading-snug text-white [overflow-wrap:anywhere]">
          {playerName}
          {isOg && <span className="ml-1 text-pl-pinkLight">(OG)</span>}
        </p>

        {subtitle && (
          <p className="text-[10px] leading-tight text-pl-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

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

  const eventsOnSide = (side) =>
    sortedEvents.filter(
      (event) =>
        String(event.teamSide || event.team || '').toLowerCase() === side
    ).length;

  const missingGoals =
    isCompleted && homeScore !== null && awayScore !== null
      ? Math.max(0, Number(homeScore) - eventsOnSide('home')) +
        Math.max(0, Number(awayScore) - eventsOnSide('away'))
      : 0;

  return (
    <div className="relative py-4">
      {/* Team column headers */}
      <div className="flex items-center justify-between gap-2 pb-5 border-b border-pl-border/50 text-xs font-bold uppercase tracking-wider text-pl-pinkLight">
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
          const displayMinute =
            event.displayMinute ||
            (event.extraMinute
              ? `${event.minute}+${event.extraMinute}'`
              : `${event.minute || 0}'`);

          return (
            <div
              key={idx}
              className="relative flex items-center justify-between gap-2"
            >
              {/* Home Team Event (Left) */}
              <div className="flex w-[43%] min-w-0 justify-end">
                {isHome && <EventCard event={event} align="right" />}
              </div>

              {/* Minute badge in center */}
              <div className="z-10 flex flex-col items-center">
                <span className="whitespace-nowrap rounded-full bg-[#18051E] px-2 py-0.5 text-[10px] font-extrabold text-pl-pinkLight border border-pl-border shadow-sm">
                  {displayMinute}
                </span>
              </div>

              {/* Away Team Event (Right) */}
              <div className="flex w-[43%] min-w-0 justify-start">
                {!isHome && <EventCard event={event} align="left" />}
              </div>
            </div>
          );
        })}
      </div>

      {missingGoals > 0 && (
        <p className="mt-6 text-center text-[11px] text-pl-muted">
          {missingGoals === 1
            ? '1 goal is not itemised by the data provider.'
            : `${missingGoals} goals are not itemised by the data provider.`}
        </p>
      )}
    </div>
  );
}
