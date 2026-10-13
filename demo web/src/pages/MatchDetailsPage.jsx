import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Activity,
  ListOrdered,
  Users,
} from 'lucide-react';

import MatchStatsComparison from '../components/match/MatchStatsComparison';
import MatchTimeline from '../components/match/MatchTimeline';
import MatchLineup from '../components/match/MatchLineup';

import { getTeamByApiId } from '../data/teams';
import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api`;

export default function MatchDetailsPage() {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [lineups, setLineups] = useState({});

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lineupsLoading, setLineupsLoading] = useState(false);

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');

  // =====================================================
  // LOAD MATCH
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    async function loadMatch(isBackground = false) {
      if (!id) {
        if (!isBackground) {
          setError('Match ID is missing.');
          setLoading(false);
        }
        return;
      }

      try {
        if (!isBackground) {
          setLoading(true);
          setError('');
        }

        const response = await fetch(
          `${API_BASE}/matches/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          throw new Error(`Match request failed: ${response.status}`);
        }

        const result = await response.json();

        const matchData =
          result?.data?.match ||
          result?.data ||
          result?.match ||
          result;

        if (!matchData) {
          throw new Error('Match was not found.');
        }

        if (!cancelled) {
          setMatch(normalizeMatch(matchData));
        }
      } catch (err) {
        console.error('Failed to load match:', err);
        if (!cancelled && !isBackground) {
          setError(err.message || 'Failed to load match.');
        }
      } finally {
        if (!cancelled && !isBackground) {
          setLoading(false);
        }
      }
    }

    loadMatch(false);
    const pollInterval = setInterval(() => {
      loadMatch(true);
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [id]);

  // =====================================================
  // LOAD STATS
  // =====================================================

  useEffect(() => {
    async function loadStats() {
      if (!id) return;

      try {
        setStatsLoading(true);

        const response = await fetch(
          `${API_BASE}/matches/${encodeURIComponent(id)}/stats`
        );

        if (!response.ok) {
          console.warn(`Stats request failed: ${response.status}`);
          return;
        }

        const result = await response.json();

        console.log('MATCH STATS RESPONSE:', result);

        const statsData =
          result?.data?.stats ||
          result?.data ||
          result?.stats ||
          result;

        setStats(statsData);
      } catch (err) {
        console.error('Failed to load match stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [id]);

  // =====================================================
  // LOAD LINEUPS
  // =====================================================

  useEffect(() => {
    async function loadLineups() {
      if (!id) return;

      try {
        setLineupsLoading(true);

        const response = await fetch(
          `${API_BASE}/matches/${encodeURIComponent(id)}/lineups`
        );

        if (!response.ok) {
          console.warn(`Lineups request failed: ${response.status}`);
          setLineups({});
          return;
        }

        const result = await response.json();

        console.log('MATCH LINEUPS RESPONSE:', result);

        const lineupData =
          result?.data?.lineups ||
          result?.lineups ||
          result?.data ||
          result;

        setLineups({
          ...(lineupData || {}),
          available:
            lineupData?.available !== false &&
            !!lineupData,
        });
      } catch (err) {
        console.error('Failed to load lineups:', err);
        setLineups({});
      } finally {
        setLineupsLoading(false);
      }
    }

    loadLineups();
  }, [id]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pl-border border-t-pl-pink" />

          <p className="text-sm font-semibold text-pl-muted">
            Loading match...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !match) {
    return (
      <div className="space-y-6 pb-12">

        <Link
          to="/fixtures"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fixtures</span>
        </Link>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">

          <h2 className="text-xl font-black text-white">
            Match not found
          </h2>

          <p className="mt-2 text-sm text-red-300">
            {error || 'Unable to load this match.'}
          </p>

          <p className="mt-4 text-xs text-pl-muted">
            Match ID: {id}
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // TEAM DATA
  // =====================================================

  const localHomeTeam = getTeamByApiId(match.homeTeamId);
  const localAwayTeam = getTeamByApiId(match.awayTeamId);

  const homeTeam = {
    id: localHomeTeam?.id || match.homeTeamId,
    name:
      match.homeTeamName ||
      localHomeTeam?.name ||
      'Home Team',
    shortName:
      match.homeTeamShortName ||
      localHomeTeam?.shortName ||
      '',
    logo:
      localHomeTeam?.logo ||
      match.homeTeamLogo ||
      '',
  };

  const awayTeam = {
    id: localAwayTeam?.id || match.awayTeamId,
    name:
      match.awayTeamName ||
      localAwayTeam?.name ||
      'Away Team',
    shortName:
      match.awayTeamShortName ||
      localAwayTeam?.shortName ||
      '',
    logo:
      localAwayTeam?.logo ||
      match.awayTeamLogo ||
      '',
  };

  const isCompleted =
    match.isCompleted ||
    match.status === 'COMPLETED';

  const isLive =
    match.status === 'LIVE';

  const matchStats =
    stats || match.stats || null;

  const timeline =
    match.timeline || [];

  const finalLineups =
    lineups && Object.keys(lineups).length > 0
      ? lineups
      : match.lineups || {};

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-10 pb-12">

      {/* BACK */}
      <div>
        <Link
          to="/fixtures"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fixtures</span>
        </Link>
      </div>

      {/* =================================================
          MATCH HERO
      ================================================= */}

      <div className="relative overflow-hidden rounded-3xl border border-pl-border bg-hero-gradient p-6 sm:p-10 shadow-card">

        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-800 via-pl-pink to-purple-400" />

        {/* TOP BAR */}

        <div className="flex items-center justify-between text-xs pb-4 border-b border-pl-border/60">

          <div className="flex items-center gap-2">

            <span className="font-extrabold uppercase tracking-wider text-pl-pinkLight">
              {match.competition}
            </span>

            <span className="text-purple-900">
              •
            </span>

            <span className="text-pl-muted">
              Matchweek {match.gameweek ?? '-'}
            </span>

          </div>

          <span className="rounded-lg bg-[#18051E] px-3 py-1 text-xs font-black tracking-wider text-pl-pink border border-pl-pink/30">
            {isCompleted
              ? 'FULL TIME'
              : match.status === 'LIVE'
                ? 'LIVE'
                : match.time || 'UPCOMING'}
          </span>

        </div>

        {/* SCOREBOARD */}

        <div className="my-8 grid grid-cols-7 items-center gap-4 text-center">

          {/* HOME TEAM */}

          <Link
            to={`/teams/${homeTeam.id}`}
            className="col-span-3 flex flex-col items-center group transition-transform hover:scale-105"
          >

            <div className="relative mb-3 flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-[#16051D] p-4 shadow-xl border border-pl-border/80">

              {homeTeam.logo ? (
                <img
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  className="h-full w-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-3xl font-black text-pl-pink">
                  {homeTeam.name?.charAt(0)}
                </span>
              )}

            </div>

            <h2 className="font-display text-base sm:text-2xl font-black text-white group-hover:text-pl-pink transition-colors">
              {homeTeam.name}
            </h2>

            <span className="text-xs font-medium text-pl-muted">
              {homeTeam.shortName}
            </span>

          </Link>

          {/* SCORE */}

          <div className="col-span-1 flex flex-col items-center justify-center">

            {isCompleted || isLive ? (

              <div className="flex flex-col items-center gap-1">

                <div className="flex items-center gap-2 sm:gap-3 font-display text-4xl sm:text-6xl font-black tracking-tight text-white bg-[#18051E] px-4 sm:px-6 py-2 rounded-2xl border border-pl-border shadow-inner">

                  <span
                    className={
                      Number(match.homeScore) >
                      Number(match.awayScore)
                        ? 'text-pl-pink'
                        : 'text-white'
                    }
                  >
                    {match.homeScore ?? 0}
                  </span>

                  <span className="text-purple-700 text-3xl font-light">
                    -
                  </span>

                  <span
                    className={
                      Number(match.awayScore) >
                      Number(match.homeScore)
                        ? 'text-pl-pink'
                        : 'text-white'
                    }
                  >
                    {match.awayScore ?? 0}
                  </span>

                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-pl-muted mt-1">
                  {isLive ? 'LIVE' : 'FT Score'}
                </span>

              </div>

            ) : (

              <div className="flex flex-col items-center gap-1">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#18051E] border border-pl-border font-display text-sm font-black text-pl-pinkLight shadow-inner">
                  VS
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-pl-muted">
                  Upcoming
                </span>

              </div>

            )}

          </div>

          {/* AWAY TEAM */}

          <Link
            to={`/teams/${awayTeam.id}`}
            className="col-span-3 flex flex-col items-center group transition-transform hover:scale-105"
          >

            <div className="relative mb-3 flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-[#16051D] p-4 shadow-xl border border-pl-border/80">

              {awayTeam.logo ? (
                <img
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  className="h-full w-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-3xl font-black text-pl-pink">
                  {awayTeam.name?.charAt(0)}
                </span>
              )}

            </div>

            <h2 className="font-display text-base sm:text-2xl font-black text-white group-hover:text-pl-pink transition-colors">
              {awayTeam.name}
            </h2>

            <span className="text-xs font-medium text-pl-muted">
              {awayTeam.shortName}
            </span>

          </Link>

        </div>

        {/* =================================================
            MATCH METADATA
        ================================================= */}

        <div className="flex flex-wrap items-center justify-center gap-6 border-t border-pl-border/60 pt-4 text-xs text-pl-lavender">

          {/* DATE */}

          <span className="flex items-center gap-1.5">

            <Calendar className="h-4 w-4 text-pl-muted" />

            <span>
              {formatDate(match.matchDate || match.date)}
            </span>

          </span>

          <span>•</span>

          {/* KICKOFF */}

          <span className="flex items-center gap-1.5">

            <Clock className="h-4 w-4 text-pl-muted" />

            <span>
              Kickoff: {match.time || 'TBD'}
            </span>

          </span>

          <span>•</span>

          {/* VENUE */}

          <span className="flex items-center gap-1.5">

            <MapPin className="h-4 w-4 text-pl-muted" />

            <span>
              {match.venue || 'Venue TBD'}
            </span>

          </span>

          {/* REFEREE */}

          {match.referee && (
            <>
              <span>•</span>

              <span className="text-pl-muted">
                Referee:{' '}

                <strong className="text-white">
                  {match.referee}
                </strong>

              </span>
            </>
          )}

        </div>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="flex items-center justify-center">

        <div className="flex flex-wrap items-center justify-center rounded-2xl bg-pl-card p-1.5 border border-pl-border shadow-inner">

          {/* STATS */}

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'stats'
                ? 'bg-pl-purple text-white shadow-glow-pink/30 border border-pl-pink'
                : 'text-pl-muted hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Match Statistics</span>
          </button>

          {/* TIMELINE */}

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'timeline'
                ? 'bg-pl-purple text-white shadow-glow-pink/30 border border-pl-pink'
                : 'text-pl-muted hover:text-white'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            <span>Timeline</span>
          </button>

          {/* LINEUPS */}

          <button
            onClick={() => setActiveTab('lineups')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'lineups'
                ? 'bg-pl-purple text-white shadow-glow-pink/30 border border-pl-pink'
                : 'text-pl-muted hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Lineups</span>
          </button>

        </div>

      </div>

      {/* =================================================
          TAB CONTENT
      ================================================= */}

      <div className="rounded-3xl border border-pl-border bg-pl-card/80 p-6 sm:p-8 backdrop-blur-md shadow-card">

        {/* STATS */}

        {activeTab === 'stats' && (

          statsLoading ? (

            <div className="flex justify-center py-10">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pl-border border-t-pl-pink" />

            </div>

          ) : (

            <MatchStatsComparison
              stats={matchStats}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />

          )

        )}

        {/* TIMELINE */}

        {activeTab === 'timeline' && (

          <MatchTimeline
            timeline={timeline}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            isCompleted={isCompleted}
            isUpcoming={match.isUpcoming}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
          />

        )}

        {/* LINEUPS */}

        {activeTab === 'lineups' && (

          lineupsLoading ? (

            <div className="flex flex-col items-center justify-center py-12">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pl-border border-t-pl-pink" />

              <p className="mt-4 text-sm font-semibold text-pl-muted">
                Loading lineups...
              </p>

            </div>

          ) : (

            <MatchLineup
              lineups={finalLineups}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />

          )

        )}

      </div>

    </div>
  );
}


// ======================================================
// MATCH NORMALIZER
// ======================================================

function normalizeMatch(raw) {

  const home =
    raw?.home ||
    raw?.homeTeam ||
    raw?.teams?.home ||
    {};

  const away =
    raw?.away ||
    raw?.awayTeam ||
    raw?.teams?.away ||
    {};

  const status = normalizeStatus(
    raw?.status ||
    raw?.matchStatus ||
    raw?.fixtureStatus ||
    raw?.rawStatus
  );

  const isPlayed = status === 'COMPLETED' || status === 'LIVE';

  const homeScore = isPlayed
    ? (raw?.homeScore ??
       raw?.home_score ??
       raw?.scores?.home ??
       raw?.score?.home ??
       home?.score ??
       0)
    : null;

  const awayScore = isPlayed
    ? (raw?.awayScore ??
       raw?.away_score ??
       raw?.scores?.away ??
       raw?.score?.away ??
       away?.score ??
       0)
    : null;

  const rawDate =
    raw?.matchDate ||
    raw?.match_date ||
    raw?.date ||
    raw?.kickoff ||
    '';

  return {

    id: raw?.id,

    matchId:
      raw?.matchId ??
      raw?.match_id ??
      raw?.id,

    competition:
      raw?.competition ||
      raw?.league?.name ||
      'Premier League',

    gameweek:
      raw?.gameweek ??
      raw?.game_week ??
      raw?.round ??
      raw?.matchweek ??
      null,

    date: rawDate,

    matchDate: rawDate,

    // IMPORTANT:
    // Convert API UTC time to India Standard Time.
    time:
      raw?.timeIST ||
      cleanTime(
        rawDate ||
        raw?.time ||
        raw?.kickoffTime ||
        raw?.kickoff
      ),

    venue: cleanText(
      raw?.venue ||
      raw?.stadium ||
      raw?.location ||
      ''
    ),

    referee: cleanText(
      typeof raw?.referee === 'object'
        ? raw?.referee?.name ||
          raw?.referee?.full_name ||
          raw?.referee?.display_name ||
          ''
        : raw?.referee ||
          raw?.official ||
          ''
    ),

    status,

    isCompleted:
      raw?.isCompleted === true ||
      status === 'COMPLETED',

    isUpcoming:
      raw?.isUpcoming === true ||
      status === 'UPCOMING',

    homeTeamId:
      raw?.homeTeamId ??
      raw?.home_team_id ??
      home?.teamId ??
      home?.team_id ??
      home?.id,

    awayTeamId:
      raw?.awayTeamId ??
      raw?.away_team_id ??
      away?.teamId ??
      away?.team_id ??
      away?.id,

    homeTeamName:
      raw?.homeTeamName ||
      home?.name ||
      home?.team_name ||
      'Home Team',

    awayTeamName:
      raw?.awayTeamName ||
      away?.name ||
      away?.team_name ||
      'Away Team',

    homeTeamShortName:
      raw?.homeTeamShortName ||
      home?.shortName ||
      home?.short_name ||
      '',

    awayTeamShortName:
      raw?.awayTeamShortName ||
      away?.shortName ||
      away?.short_name ||
      '',

    homeTeamLogo:
      raw?.homeTeamLogo ||
      raw?.homeLogo ||
      home?.logo ||
      home?.team_logo ||
      home?.logo_url ||
      '',

    awayTeamLogo:
      raw?.awayTeamLogo ||
      raw?.awayLogo ||
      away?.logo ||
      away?.team_logo ||
      away?.logo_url ||
      '',

    homeScore,
    awayScore,

    stats:
      raw?.stats ||
      raw?.statistics ||
      {},

    timeline:
      raw?.timeline ||
      raw?.goalEvents ||
      raw?.events ||
      [],

    lineups:
      raw?.lineups ||
      raw?.lineup ||
      {},
  };
}


// ======================================================
// STATUS NORMALIZER
// ======================================================

function normalizeStatus(status) {

  if (!status) {
    return 'UPCOMING';
  }

  const value = String(status).toUpperCase().trim();

  if (
    value.includes('FINISHED') ||
    (value.includes('COMPLETE') && !value.includes('INCOMPLETE')) ||
    value.includes('FULL TIME') ||
    value.includes('FULL_TIME') ||
    value === 'FT'
  ) {
    return 'COMPLETED';
  }

  if (
    value.includes('LIVE') ||
    value.includes('IN_PLAY') ||
    value.includes('INPLAY') ||
    value === '1H' ||
    value === '2H' ||
    value === 'HT' ||
    value.includes('HALF TIME') ||
    value.includes('HALF-TIME')
  ) {
    return 'LIVE';
  }

  return 'UPCOMING';
}


// ======================================================
// CLEAN TEXT
// ======================================================

function cleanText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (typeof value === 'object') {

    return (
      value.name ||
      value.title ||
      value.label ||
      value.display_name ||
      ''
    );

  }

  return String(value)
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}


// ======================================================
// TIME
// ======================================================
//
// Footballdata gives kickoff timestamps in UTC.
// This converts them to India Standard Time.
// Example:
// 2026-08-23 15:30:00 UTC
//       ↓
// 9:00 PM IST
// ======================================================

function parseMatchUtcDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const text = String(value).trim();
  if (!text) return null;
  if (text.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(text)) {
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text)) {
    const parsed = new Date(`${text.replace(/\s+/, 'T')}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function cleanTime(value) {

  if (!value) {
    return '';
  }

  const text = String(value).trim();

  // Preserve already formatted 12-hour IST time strings
  if (/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(text)) {
    return text;
  }

  // Full date/time from API
  const parsed = parseMatchUtcDate(text);

  if (parsed) {

    return parsed.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

  }

  // Fallback for an already formatted time.
  const simpleTime = text.match(
    /\b(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(am|pm))?\b/i
  );

  if (simpleTime) {

    return simpleTime[3]
      ? `${simpleTime[1]}:${simpleTime[2]} ${simpleTime[3]}`
      : `${simpleTime[1]}:${simpleTime[2]}`;

  }

  return '';
}


// ======================================================
// DATE
// ======================================================

function formatDate(value) {

  if (!value) {
    return 'Date TBD';
  }

  const parsed = parseMatchUtcDate(value);

  if (!parsed) {
    return cleanText(value);
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}