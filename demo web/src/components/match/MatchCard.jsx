import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';

import { getTeamById, getTeamByApiId, getTeamByName } from '../../data/teams';

export default function MatchCard({ match }) {
  if (!match) return null;

  // =====================================================
  // REAL MATCH ID
  // =====================================================
  const matchId =
    match.matchId ??
    match.match_id ??
    match.id;

  if (!matchId || String(matchId).startsWith('match-')) {
    return null;
  }

  // =====================================================
  // TEAM DATA
  // =====================================================
  const homeTeam =
    getTeamById(match.homeTeamId) ||
    getTeamByApiId(match.homeTeamId || match.homeApiId) ||
    getTeamByName(match.homeTeam || match.homeTeamName) || {
      id: match.homeTeamId,
      name:
        match.homeTeam ||
        match.homeTeamName ||
        'Home Team',
      shortName:
        match.homeTeamShortName ||
        '',
      logo:
        match.homeTeamLogo ||
        match.homeLogo ||
        ''
    };

  const awayTeam =
    getTeamById(match.awayTeamId) ||
    getTeamByApiId(match.awayTeamId || match.awayApiId) ||
    getTeamByName(match.awayTeam || match.awayTeamName) || {
      id: match.awayTeamId,
      name:
        match.awayTeam ||
        match.awayTeamName ||
        'Away Team',
      shortName:
        match.awayTeamShortName ||
        '',
      logo:
        match.awayTeamLogo ||
        match.awayLogo ||
        ''
    };

  // =====================================================
  // STATUS
  // =====================================================
  const isCompleted =
    match.status === 'COMPLETED' ||
    match.status === 'FT' ||
    match.status === 'Finished' ||
    match.status === 'FINISHED';

  const isLive =
    match.status === 'LIVE' ||
    match.status === '1H' ||
    match.status === '2H' ||
    match.status === 'HT';

  // =====================================================
  // TEAM LOGOS
  // =====================================================
  const homeLogo =
    homeTeam?.logo ||
    match.homeTeamLogo ||
    match.homeLogo ||
    '';

  const awayLogo =
    awayTeam?.logo ||
    match.awayTeamLogo ||
    match.awayLogo ||
    '';

  // =====================================================
  // MATCH CARD
  // =====================================================
  return (
    <Link
      to={`/matches/${encodeURIComponent(String(matchId))}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl border border-pl-border bg-[#120318] p-5 transition-all duration-300 hover:border-pl-pink/50 hover:bg-[#18051E] hover:-translate-y-0.5">

        {/* Top gradient */}
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-purple-700 via-pl-pink to-purple-400" />

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="mb-5 flex items-center justify-between">

          <div className="flex items-center gap-2 text-xs text-pl-muted">

            <span className="font-bold uppercase tracking-wider text-pl-pinkLight">
              {match.competition || 'Premier League'}
            </span>

            <span>•</span>

            <span>
              GW {match.gameweek ?? '-'}
            </span>

          </div>

          <span
            className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              isCompleted
                ? 'bg-white/5 text-slate-300'
                : isLive
                  ? 'bg-red-500/10 text-red-300'
                  : 'bg-pl-pink/10 text-pl-pink'
            }`}
          >
            {isCompleted
              ? 'Full Time'
              : isLive
                ? 'Live'
                : 'Upcoming'}
          </span>

        </div>

        {/* =================================================
            TEAMS + SCORE
        ================================================= */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">

          {/* HOME */}
          <div className="flex min-w-0 flex-col items-center text-center">

            {homeLogo ? (
              <img
                src={homeLogo}
                alt={homeTeam?.name || 'Home Team'}
                className="mb-3 h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-sm font-black text-white">
                {(homeTeam?.shortName ||
                  homeTeam?.name ||
                  'H')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <span className="line-clamp-2 text-sm font-bold text-white">
              {homeTeam?.name ||
                match.homeTeam ||
                match.homeTeamName ||
                'Home Team'}
            </span>

          </div>

          {/* SCORE */}
          <div className="flex flex-col items-center">

            <div className="flex items-center gap-2 font-display text-2xl font-black text-white">

              <span>
                {isCompleted || isLive
                  ? match.homeScore ?? 0
                  : '-'}
              </span>

              <span className="text-sm text-pl-muted">
                -
              </span>

              <span>
                {isCompleted || isLive
                  ? match.awayScore ?? 0
                  : '-'}
              </span>

            </div>

            {isLive && (
              <span className="mt-1 text-[10px] font-bold uppercase text-red-300">
                Live
              </span>
            )}

          </div>

          {/* AWAY */}
          <div className="flex min-w-0 flex-col items-center text-center">

            {awayLogo ? (
              <img
                src={awayLogo}
                alt={awayTeam?.name || 'Away Team'}
                className="mb-3 h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-sm font-black text-white">
                {(awayTeam?.shortName ||
                  awayTeam?.name ||
                  'A')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <span className="line-clamp-2 text-sm font-bold text-white">
              {awayTeam?.name ||
                match.awayTeam ||
                match.awayTeamName ||
                'Away Team'}
            </span>

          </div>

        </div>

        {/* =================================================
            DATE / TIME / VENUE
        ================================================= */}
        <div className="mt-5 grid grid-cols-1 gap-2 border-t border-pl-border/60 pt-4 text-[11px] text-pl-muted sm:grid-cols-3">

          <div className="flex items-center justify-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{match.date || '-'}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{match.time || '-'}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">
              {match.venue || 'Venue TBA'}
            </span>
          </div>

        </div>

        {/* =================================================
            VIEW MATCH
        ================================================= */}
        <div className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider text-pl-muted opacity-0 transition-opacity group-hover:opacity-100">
          View Match Centre →
        </div>

      </div>
    </Link>
  );
}