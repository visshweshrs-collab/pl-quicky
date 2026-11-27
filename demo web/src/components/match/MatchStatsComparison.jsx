import React from 'react';

export default function MatchStatsComparison({
  stats,
  homeTeam,
  awayTeam
}) {
  if (!stats) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Statistical telemetry will be available after kickoff.
      </div>
    );
  }

  // =====================================================
  // NORMALIZE DIFFERENT POSSIBLE API SHAPES
  // =====================================================
  const source =
    stats?.stats ||
    stats?.statistics ||
    stats?.data?.stats ||
    stats?.data ||
    stats ||
    {};

  // =====================================================
  // SAFE PAIR HELPER
  // =====================================================
  const getPair = (
    value,
    fallback = ['-', '-']
  ) => {
    if (Array.isArray(value)) {
      return [
        value[0] ?? fallback[0],
        value[1] ?? fallback[1]
      ];
    }

    if (
      value &&
      typeof value === 'object'
    ) {
      return [
        value.home ??
          value.homeTeam ??
          value.home_value ??
          value.homeValue ??
          fallback[0],

        value.away ??
          value.awayTeam ??
          value.away_value ??
          value.awayValue ??
          fallback[1]
      ];
    }

    return fallback;
  };

  // =====================================================
  // EXTRACT STATS SAFELY
  // =====================================================
  const possession = getPair(
    source.possession ??
      source.ball_possession ??
      source.ballPossession
  );

  const shots = getPair(
    source.shots ??
      source.total_shots ??
      source.totalShots
  );

  const shotsOnTarget = getPair(
    source.shotsOnTarget ??
      source.shots_on_target ??
      source.shots_on_target_total
  );

  const corners = getPair(
    source.corners ??
      source.corner_kicks ??
      source.cornerKicks
  );

  const fouls = getPair(
    source.fouls ??
      source.fouls_committed ??
      source.foulsCommitted
  );

  const yellowCards = getPair(
    source.yellowCards ??
      source.yellow_cards ??
      source.yellow
  );

  const offsides = getPair(
    source.offsides ??
      source.offside
  );

  const passAccuracy = getPair(
    source.passAccuracy ??
      source.pass_accuracy ??
      source.pass_accuracy_percentage
  );

  // =====================================================
  // NUMERIC VALUE HELPER
  // =====================================================
  const numericValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === '-'
    ) {
      return 0;
    }

    const parsed = Number(
      String(value).replace('%', '')
    );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  };

  // =====================================================
  // STAT ITEMS
  // =====================================================
  const statItems = [
    {
      label: 'Ball Possession',
      home: `${possession[0]}%`,
      away: `${possession[1]}%`,
      hVal: numericValue(possession[0]),
      aVal: numericValue(possession[1])
    },

    {
      label: 'Total Shots',
      home: shots[0],
      away: shots[1],
      hVal: numericValue(shots[0]),
      aVal: numericValue(shots[1])
    },

    {
      label: 'Shots on Target',
      home: shotsOnTarget[0],
      away: shotsOnTarget[1],
      hVal: numericValue(shotsOnTarget[0]),
      aVal: numericValue(shotsOnTarget[1])
    },

    {
      label: 'Corner Kicks',
      home: corners[0],
      away: corners[1],
      hVal: numericValue(corners[0]),
      aVal: numericValue(corners[1])
    },

    {
      label: 'Fouls Committed',
      home: fouls[0],
      away: fouls[1],
      hVal: numericValue(fouls[0]),
      aVal: numericValue(fouls[1])
    },

    {
      label: 'Yellow Cards',
      home: yellowCards[0],
      away: yellowCards[1],
      hVal: numericValue(yellowCards[0]),
      aVal: numericValue(yellowCards[1])
    },

    {
      label: 'Offsides',
      home: offsides[0],
      away: offsides[1],
      hVal: numericValue(offsides[0]),
      aVal: numericValue(offsides[1])
    },

    {
      label: 'Pass Accuracy',
      home: `${passAccuracy[0]}${String(passAccuracy[0]).includes('%') ? '' : '%'}`,
      away: `${passAccuracy[1]}${String(passAccuracy[1]).includes('%') ? '' : '%'}`,
      hVal: numericValue(passAccuracy[0]),
      aVal: numericValue(passAccuracy[1])
    }
  ];

  // =====================================================
  // LOGOS
  // =====================================================
  const homeLogo =
    homeTeam?.logo || '';

  const awayLogo =
    awayTeam?.logo || '';

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}
      <div className="flex items-center justify-between border-b border-pl-border/60 pb-3">

        <div className="flex items-center gap-2">

          {homeLogo ? (
            <img
              src={homeLogo}
              alt={homeTeam?.name || 'Home'}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-pl-navy" />
          )}

          <span className="font-display text-sm font-bold text-white">
            {homeTeam?.shortName ||
              homeTeam?.name ||
              'Home'}
          </span>

        </div>

        <span className="text-center text-[11px] font-bold uppercase tracking-wider text-pl-muted">
          Match Statistics
        </span>

        <div className="flex items-center gap-2">

          <span className="font-display text-sm font-bold text-white">
            {awayTeam?.shortName ||
              awayTeam?.name ||
              'Away'}
          </span>

          {awayLogo ? (
            <img
              src={awayLogo}
              alt={awayTeam?.name || 'Away'}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-pl-navy" />
          )}

        </div>

      </div>

      {/* =================================================
          COMPARISON ROWS
      ================================================= */}
      <div className="space-y-5">

        {statItems.map(
          (item, idx) => {

            const total =
              (item.hVal || 0) +
              (item.aVal || 0);

            const homePercent =
              total > 0
                ? Math.round(
                    ((item.hVal || 0) /
                      total) *
                      100
                  )
                : 50;

            const awayPercent =
              100 - homePercent;

            const isHomeHigher =
              item.hVal > item.aVal;

            const isAwayHigher =
              item.aVal > item.hVal;

            return (
              <div
                key={idx}
                className="space-y-1.5"
              >

                {/* VALUES + LABEL */}
                <div className="flex items-center justify-between text-xs font-semibold">

                  <span
                    className={`font-display text-sm ${
                      isHomeHigher
                        ? 'font-black text-pl-pink'
                        : 'text-white'
                    }`}
                  >
                    {item.home}
                  </span>

                  <span className="text-[11px] font-medium uppercase tracking-wider text-pl-muted">
                    {item.label}
                  </span>

                  <span
                    className={`font-display text-sm ${
                      isAwayHigher
                        ? 'font-black text-pl-violetLight'
                        : 'text-white'
                    }`}
                  >
                    {item.away}
                  </span>

                </div>

                {/* PROGRESS BARS */}
                <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full border border-pl-border/60 bg-pl-dark p-0.5">

                  {/* HOME */}
                  <div className="flex w-1/2 justify-end">

                    <div
                      className="h-full rounded-l-full bg-gradient-to-r from-pl-pink to-pl-pinkLight transition-all duration-500"
                      style={{
                        width: `${homePercent}%`
                      }}
                    />

                  </div>

                  {/* AWAY */}
                  <div className="flex w-1/2 justify-start">

                    <div
                      className="h-full rounded-r-full bg-gradient-to-r from-pl-violet to-pl-magenta transition-all duration-500"
                      style={{
                        width: `${awayPercent}%`
                      }}
                    />

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}