import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  MapPin,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import PlayerCard from '../components/player/PlayerCard';
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

function metricValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    const candidate =
      value.value ??
      value.total ??
      value.average ??
      value.avg ??
      value.percentage ??
      value.percent;

    if (
      candidate !== null &&
      candidate !== undefined &&
      typeof candidate !== 'object'
    ) {
      return `${candidate}${suffix}`;
    }

    return '—';
  }

  return `${value}${suffix}`;
}

function parseTeamMatchDate(date) {
  if (!date) return null;
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const text = String(date).trim();
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

function formatDate(date) {
  if (!date) return 'Date TBD';

  const parsed = parseTeamMatchDate(date);

  if (!parsed) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date) {
  if (!date) return 'Time TBD';

  const parsed = parseTeamMatchDate(date);

  if (!parsed) {
    return '';
  }

  return parsed.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function ResultBadge({ result }) {
  if (!result) return null;

  const normalized = String(result).toUpperCase();

  let label = normalized;
  let classes = 'bg-white/10 text-white/70';

  if (normalized === 'W') {
    label = 'W';
    classes = 'bg-emerald-500/20 text-emerald-400';
  } else if (normalized === 'D') {
    label = 'D';
    classes = 'bg-yellow-500/20 text-yellow-400';
  } else if (normalized === 'L') {
    label = 'L';
    classes = 'bg-red-500/20 text-red-400';
  }

  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[10px] font-black ${classes}`}
    >
      {label}
    </span>
  );
}

function MatchRow({ match, teamId }) {
  const homeTeamId = match?.homeTeamId ?? match?.home?.teamId;
  const awayTeamId = match?.awayTeamId ?? match?.away?.teamId;

  const isHome =
    homeTeamId !== undefined &&
    teamId !== undefined &&
    String(homeTeamId) === String(teamId);

  const opponent = isHome
    ? match?.awayTeam || match?.away?.name || 'Opponent'
    : match?.homeTeam || match?.home?.name || 'Opponent';

  const logo = isHome
    ? match?.awayLogo || match?.away?.logo
    : match?.homeLogo || match?.home?.logo;

  const homeScore =
    match?.homeScore ??
    match?.score?.home ??
    match?.home?.score ??
    null;

  const awayScore =
    match?.awayScore ??
    match?.score?.away ??
    match?.away?.score ??
    null;

  const rawStatus = String(match?.status || '').toLowerCase();
  const isCompleted =
    rawStatus === 'completed' ||
    rawStatus === 'finished' ||
    rawStatus === 'ft' ||
    rawStatus === 'full time' ||
    rawStatus === 'full-time';

  const isLive =
    rawStatus === 'live' ||
    rawStatus === '1h' ||
    rawStatus === '2h' ||
    rawStatus === 'ht';

  const score = (isCompleted || isLive) && homeScore !== null && awayScore !== null
    ? isHome
      ? `${homeScore} - ${awayScore}`
      : `${awayScore} - ${homeScore}`
    : null;

  const realMatchId =
    match?.matchId ??
    match?.match_id ??
    match?.id;

  const content = (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-pink-500/40 hover:bg-white/[0.06]">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/40">
          {match?.dateIST || formatDate(match?.date || match?.matchDate)}
        </p>

        <div className="mt-2 flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt=""
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/10" />
          )}

          <div>
            <p className="font-bold text-white">{opponent}</p>
            <p className="text-xs text-white/40">
              {isHome ? 'Home' : 'Away'}
            </p>
          </div>
        </div>
      </div>

      <div className="text-right">
        {score ? (
          <p className="text-xl font-black text-white">{score}</p>
        ) : (
          <p className="text-sm font-bold text-white/40">
            {match?.timeIST || formatTime(match?.date || match?.matchDate)}
          </p>
        )}

        {match?.result && <ResultBadge result={match.result} />}
      </div>
    </div>
  );

  if (realMatchId && !String(realMatchId).startsWith('match-')) {
    return (
      <Link
        to={`/matches/${encodeURIComponent(String(realMatchId))}`}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default function TeamDetailsPage({
  favouriteTeamId,
  onSelectFavouriteTeam,
}) {
  const { id } = useParams();

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_BASE}/api/teams/${encodeURIComponent(id)}/profile`
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || 'Unable to load team profile.'
          );
        }

        if (cancelled) return;

        setTeam(data.team || null);
        setPlayers(Array.isArray(data.players) ? data.players : []);
        setRecentMatches(
          Array.isArray(data.recentMatches) ? data.recentMatches : []
        );
        setUpcomingMatches(
          Array.isArray(data.upcomingMatches)
            ? data.upcomingMatches
            : []
        );
        setStats(data.stats || {});
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Something went wrong while loading the team.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeam();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isFavourite =
    favouriteTeamId !== undefined &&
    favouriteTeamId !== null &&
    team?.teamId !== undefined &&
    String(favouriteTeamId) === String(team.teamId);

  const recentForm = useMemo(() => {
    if (!team?.form) return [];

    if (Array.isArray(team.form)) {
      return team.form.slice(-5);
    }

    if (typeof team.form === 'string') {
      return team.form
        .split('')
        .filter((item) => ['W', 'D', 'L'].includes(item))
        .slice(-5);
    }

    return [];
  }, [team]);

  const toggleFavourite = () => {
    if (!onSelectFavouriteTeam || !team) return;

    if (isFavourite) {
      onSelectFavouriteTeam(null);
    } else {
      onSelectFavouriteTeam(team.teamId ?? team.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080d] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="mt-8 h-56 rounded-3xl bg-white/5" />
            <div className="mt-8 grid gap-6 lg:grid-cols-4">
              <div className="h-32 rounded-2xl bg-white/5" />
              <div className="h-32 rounded-2xl bg-white/5" />
              <div className="h-32 rounded-2xl bg-white/5" />
              <div className="h-32 rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#08080d] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Teams
          </Link>

          <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <h1 className="text-xl font-black">
              Could not load team profile
            </h1>

            <p className="mt-2 text-sm text-white/60">
              {error || 'The requested team was not found.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080d] px-4 py-8 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Teams
        </Link>

        {/* Team Header */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/60 via-[#11111a] to-pink-950/30 p-6 md:p-8">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-pink-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-3">
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Trophy className="text-white/30" size={38} />
                )}
              </div>

              <div>
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">
                  Premier League • 2026/27
                </div>

                <h1 className="text-3xl font-black md:text-5xl">
                  {team.name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/50">
                  {team.stadiumName && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {team.stadiumName}
                    </span>
                  )}

                  {team.founded && (
                    <span>Founded {team.founded}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={toggleFavourite}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition ${
                isFavourite
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isFavourite ? (
                <Check size={17} />
              ) : (
                <Star size={17} />
              )}
              {isFavourite ? 'Favourite Team' : 'Add Favourite'}
            </button>
          </div>
        </section>

        {/* Position + Record */}
        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              League Position
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {team.position ?? '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Points
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {team.points ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Record
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {team.won ?? 0}W · {team.drawn ?? 0}D · {team.lost ?? 0}L
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Goal Difference
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {(team.goalDifference ?? 0) > 0 ? '+' : ''}
              {team.goalDifference ?? 0}
            </p>
          </div>
        </section>

        {/* Advanced Stats */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-pink-500/10 p-2 text-pink-400">
              <Trophy size={18} />
            </div>
            <h2 className="text-xl font-black">Team Stats</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-white/40">Goals Scored</p>
              <p className="mt-2 text-2xl font-black">
                {team.goalsFor ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-white/40">Goals Conceded</p>
              <p className="mt-2 text-2xl font-black">
                {team.goalsAgainst ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-white/40">Possession</p>
              <p className="mt-2 text-2xl font-black">
                {metricValue(team.avgPossession, '%')}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-white/40">Pass Accuracy</p>
              <p className="mt-2 text-2xl font-black">
                {metricValue(team.passAccuracy, '%')}
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        {recentForm.length > 0 && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Recent Form
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Last {recentForm.length} matches
                </p>
              </div>

              <div className="flex gap-2">
                {recentForm.map((result, index) => (
                  <ResultBadge key={index} result={result} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Players */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <Users size={18} />
              </div>

              <div>
                <h2 className="text-xl font-black">Key Players</h2>
                <p className="text-xs text-white/40">
                  2026/27 season statistics
                </p>
              </div>
            </div>
          </div>

          {players.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {players.slice(0, 12).map((player) => (
                <PlayerCard
                  key={player.id ?? player.playerId ?? player.name}
                  player={player}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <Users
                size={32}
                className="mx-auto text-white/20"
              />
              <p className="mt-3 font-bold text-white/60">
                Player data is not available yet.
              </p>
            </div>
          )}
        </section>

        {/* Recent + Upcoming */}
        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Calendar size={18} className="text-pink-400" />
              <h2 className="text-xl font-black">Recent Matches</h2>
            </div>

            <div className="space-y-3">
              {recentMatches.length > 0 ? (
                recentMatches.slice(0, 5).map((match, index) => (
                  <MatchRow
                    key={match.matchId ?? match.id ?? index}
                    match={match}
                    teamId={team.teamId}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/40">
                  No recent matches available.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <Clock size={18} className="text-purple-400" />
              <h2 className="text-xl font-black">Upcoming Matches</h2>
            </div>

            <div className="space-y-3">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.slice(0, 5).map((match, index) => (
                  <MatchRow
                    key={match.matchId ?? match.id ?? index}
                    match={match}
                    teamId={team.teamId}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/40">
                  No upcoming matches available.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* API stats fallback/debug-safe section */}
        {stats && Object.keys(stats).length > 0 && (
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black">Season Overview</h2>
              <p className="mt-1 text-xs text-white/40">
                Data supplied by the current 2026/27 team statistics.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-white/40">Clean Sheets</p>
                <p className="mt-1 text-xl font-black">
                  {metricValue(team.cleanSheets)}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Matches Played</p>
                <p className="mt-1 text-xl font-black">
                  {team.played ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Goals For</p>
                <p className="mt-1 text-xl font-black">
                  {team.goalsFor ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Goals Against</p>
                <p className="mt-1 text-xl font-black">
                  {team.goalsAgainst ?? 0}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}