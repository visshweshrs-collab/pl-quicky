import React from 'react';
import { Users, UserRound } from 'lucide-react';

export default function MatchLineup({
  lineups,
  homeTeam,
  awayTeam,
}) {
  const homeLineup = normalizeTeamLineup(
    lineups?.home
  );

  const awayLineup = normalizeTeamLineup(
    lineups?.away
  );

  const hasHomePlayers =
    homeLineup.startingXI.length > 0 ||
    homeLineup.substitutes.length > 0;

  const hasAwayPlayers =
    awayLineup.startingXI.length > 0 ||
    awayLineup.substitutes.length > 0;

  /*
   * If FootballData did not return lineups,
   * NEVER crash the entire match page.
   */
  if (!hasHomePlayers && !hasAwayPlayers) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center text-center">

        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-pl-border bg-pl-dark">
          <Users className="h-8 w-8 text-pl-pink" />
        </div>

        <h3 className="text-lg font-black text-white">
          Lineups unavailable
        </h3>

        <p className="mt-2 max-w-md text-sm text-pl-muted">
          Starting lineups and substitutes are not
          available for this match yet.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="text-center">

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pl-dark border border-pl-border">
          <Users className="h-6 w-6 text-pl-pink" />
        </div>

        <h2 className="font-display text-xl font-black text-white">
          Match Lineups
        </h2>

        <p className="mt-1 text-xs text-pl-muted">
          Starting XI and substitutes
        </p>

      </div>

      {/* TWO TEAM COLUMNS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <TeamLineup
          team={homeTeam}
          lineup={homeLineup}
        />

        <TeamLineup
          team={awayTeam}
          lineup={awayLineup}
        />

      </div>

    </div>
  );
}


/*
==========================================================
TEAM LINEUP
==========================================================
*/
function TeamLineup({
  team,
  lineup,
}) {
  const startingXI = lineup.startingXI;
  const substitutes = lineup.substitutes;

  return (
    <div className="rounded-2xl border border-pl-border bg-pl-dark overflow-hidden">

      {/* TEAM HEADER */}
      <div className="flex items-center gap-4 border-b border-pl-border bg-pl-dark p-5">

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-pl-border bg-pl-dark p-2">

          {team?.logo ? (
            <img
              src={team.logo}
              alt={team?.name || 'Team'}
              className="h-full w-full object-contain"
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />
          ) : (
            <span className="text-lg font-black text-pl-pink">
              {getInitials(team?.name)}
            </span>
          )}

        </div>

        <div className="min-w-0">

          <h3 className="truncate text-base font-black text-white">
            {team?.name || 'Team'}
          </h3>

          {lineup.formation && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-pl-pink">
              Formation: {lineup.formation}
            </p>
          )}

          {lineup.manager && (
            <p className="mt-1 text-xs text-pl-muted">
              Manager: {lineup.manager}
            </p>
          )}

        </div>

      </div>

      {/* STARTING XI */}
      <div className="p-5">

        <div className="mb-4 flex items-center justify-between">

          <h4 className="text-xs font-black uppercase tracking-wider text-pl-lavender">
            Starting XI
          </h4>

          <span className="rounded-lg bg-pl-purple/40 px-2 py-1 text-[10px] font-black text-pl-pinkLight">
            {startingXI.length}
          </span>

        </div>

        {startingXI.length > 0 ? (

          <div className="space-y-2">

            {startingXI.map(
              (player, index) => (
                <PlayerRow
                  key={
                    player?.id ??
                    player?.playerId ??
                    `${player?.name}-${index}`
                  }
                  player={player}
                  index={index}
                />
              )
            )}

          </div>

        ) : (

          <EmptyPlayers text="Starting XI unavailable" />

        )}

      </div>

      {/* SUBSTITUTES */}
      <div className="border-t border-pl-border p-5">

        <div className="mb-4 flex items-center justify-between">

          <h4 className="text-xs font-black uppercase tracking-wider text-pl-lavender">
            Substitutes
          </h4>

          <span className="rounded-lg bg-pl-purple/40 px-2 py-1 text-[10px] font-black text-pl-pinkLight">
            {substitutes.length}
          </span>

        </div>

        {substitutes.length > 0 ? (

          <div className="space-y-2">

            {substitutes.map(
              (player, index) => (
                <PlayerRow
                  key={
                    player?.id ??
                    player?.playerId ??
                    `sub-${player?.name}-${index}`
                  }
                  player={player}
                  index={index}
                  substitute
                />
              )
            )}

          </div>

        ) : (

          <EmptyPlayers text="Substitutes unavailable" />

        )}

      </div>

    </div>
  );
}


/*
==========================================================
PLAYER ROW
==========================================================
*/
function PlayerRow({
  player,
  index,
  substitute = false,
}) {
  const name =
    player?.name ||
    player?.player_name ||
    player?.full_name ||
    'Unknown Player';

  const number =
    player?.number ??
    player?.shirtNumber ??
    player?.shirt_number ??
    null;

  const position =
    player?.position ||
    player?.pos ||
    '';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-pl-border/60 bg-pl-card px-3 py-3 transition-colors hover:bg-pl-navy">

      {/* NUMBER */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pl-navy text-[11px] font-black text-pl-pink">

        {number !== null &&
        number !== undefined &&
        number !== '' ? (
          number
        ) : (
          index + 1
        )}

      </div>

      {/* ICON */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pl-border bg-pl-dark">

        <UserRound className="h-4 w-4 text-pl-muted" />

      </div>

      {/* PLAYER */}
      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-bold text-white">
          {name}
        </p>

        {position && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-pl-muted">
            {position}
          </p>
        )}

      </div>

      {substitute && (
        <span className="rounded-md border border-pl-border px-2 py-1 text-[9px] font-bold uppercase text-pl-muted">
          SUB
        </span>
      )}

    </div>
  );
}


/*
==========================================================
NORMALIZE TEAM LINEUP
==========================================================
*/
function normalizeTeamLineup(teamLineup) {
  if (!teamLineup) {
    return {
      formation: '',
      manager: '',
      startingXI: [],
      substitutes: [],
    };
  }

  /*
   * Possible API structures
   */
  const startingXI =
    teamLineup.startingXI ||
    teamLineup.starting_xi ||
    teamLineup.startingXIPlayers ||
    teamLineup.starting ||
    teamLineup.lineup ||
    [];

  const substitutes =
    teamLineup.substitutes ||
    teamLineup.subs ||
    teamLineup.bench ||
    [];

  return {
    formation:
      teamLineup.formation ||
      teamLineup.formation_name ||
      '',

    manager:
      teamLineup.manager?.name ||
      teamLineup.manager ||
      teamLineup.coach?.name ||
      teamLineup.coach ||
      '',

    startingXI: normalizePlayers(
      startingXI
    ),

    substitutes: normalizePlayers(
      substitutes
    ),
  };
}


/*
==========================================================
NORMALIZE PLAYER ARRAY
==========================================================
*/
function normalizePlayers(players) {
  if (!players) {
    return [];
  }

  /*
   * Sometimes APIs return an object instead
   * of an array.
   */
  if (!Array.isArray(players)) {
    if (
      typeof players === 'object'
    ) {
      players =
        players.players ||
        players.data ||
        Object.values(players);
    }
  }

  if (!Array.isArray(players)) {
    return [];
  }

  return players
    .map((item) => {

      const player =
        item?.player ||
        item;

      return {
        id:
          player?.player_id ??
          player?.playerId ??
          player?.id,

        playerId:
          player?.player_id ??
          player?.playerId ??
          player?.id,

        name:
          player?.name ||
          player?.player_name ||
          player?.full_name ||
          player?.player?.name ||
          'Unknown Player',

        number:
          player?.number ??
          player?.shirt_number ??
          player?.shirtNumber ??
          item?.number ??
          null,

        position:
          player?.position ||
          player?.position_name ||
          player?.pos ||
          item?.position ||
          '',
      };
    })
    .filter(
      (player) =>
        player.name &&
        player.name !== 'Unknown Player'
    );
}


/*
==========================================================
EMPTY PLAYERS
==========================================================
*/
function EmptyPlayers({
  text,
}) {
  return (
    <div className="rounded-xl border border-dashed border-pl-border bg-pl-card p-4 text-center">

      <p className="text-xs font-semibold text-pl-muted">
        {text}
      </p>

    </div>
  );
}


/*
==========================================================
INITIALS
==========================================================
*/
function getInitials(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase();
}