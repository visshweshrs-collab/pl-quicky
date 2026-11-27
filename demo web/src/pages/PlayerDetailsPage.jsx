import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  Trophy, 
  Award, 
  Target, 
  Sparkles, 
  Compass, 
  Zap, 
  TrendingUp,
  Users
} from 'lucide-react';
import { getPlayerById } from '../data/players';
import { getTeamById, getTeamByApiId } from '../data/teams';
import { API_BASE_URL } from '../config/api';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';

export default function PlayerDetailsPage() {
  const { id } = useParams();
  const initialLocal = getPlayerById(id);

  const [player, setPlayer] = useState(initialLocal || null);
  const [team, setTeam] = useState(() => {
    if (!initialLocal) return null;
    return getTeamById(initialLocal.teamId) || getTeamByApiId(initialLocal.teamId) || null;
  });
  const [loading, setLoading] = useState(!initialLocal);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPlayer() {
      if (!id) return;
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE_URL}/api/players/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.player) {
            const p = data.player;
            setPlayer(p);

            // Resolve team details
            const resolvedTeam =
              data.team ||
              getTeamByApiId(p.teamId) ||
              getTeamById(p.teamId) ||
              {
                id: p.teamId,
                name: p.teamName || 'Premier League Club',
                logo: p.teamLogo || '',
                primaryColor: '#00A8E8'
              };

            setTeam(resolvedTeam);
            setLoading(false);
            return;
          }
        }

        // Fallback to local data if API did not return player
        if (!cancelled) {
          const local = getPlayerById(id);
          if (local) {
            setPlayer(local);
            setTeam(getTeamById(local.teamId) || getTeamByApiId(local.teamId) || null);
          } else if (!player) {
            setError('Player was not found.');
          }
        }
      } catch (err) {
        console.warn('Live player details fetch failed, falling back to local:', err.message);
        if (!cancelled && !player) {
          const local = getPlayerById(id);
          if (local) {
            setPlayer(local);
            setTeam(getTeamById(local.teamId) || getTeamByApiId(local.teamId) || null);
          } else {
            setError('Failed to load player details.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlayer();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center text-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-pl-pink border-t-transparent" />
        <p className="text-sm font-semibold text-pl-lavender">Loading player profile...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="space-y-6 pb-12">
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Player Directory</span>
        </Link>
        <EmptyState
          title="Player Not Found"
          description={error || "We couldn't find the player profile you requested."}
          actionLabel="Back to Players"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const teamData = team || {
    id: player.teamId,
    name: player.teamName || 'Premier League Club',
    logo: player.teamLogo || '',
    primaryColor: '#00A8E8'
  };

  const appearancesDisplay = player.appearances != null ? player.appearances : '—';
  const goalsDisplay = player.goals != null ? player.goals : '—';
  const assistsDisplay = player.assists != null ? player.assists : '—';
  const minutesDisplay = player.minutes != null ? `${player.minutes}'` : '—';
  const shotsDisplay = player.shots != null ? player.shots : '—';
  const passAccuracyDisplay = player.passAccuracy != null ? player.passAccuracy : '—';

  return (
    <div className="space-y-12 pb-12">
      {/* Back link */}
      <div>
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Player Directory</span>
        </Link>
      </div>

      {/* Hero Player Header */}
      <div className="relative overflow-hidden rounded-3xl border border-pl-border bg-gradient-to-br from-pl-navy via-pl-card to-pl-dark p-6 sm:p-10 shadow-card">
        <div 
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: teamData.primaryColor || '#00A8E8' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Large Player Image */}
          <div className="relative h-44 w-44 sm:h-52 sm:w-52 flex-shrink-0 overflow-hidden rounded-3xl border-2 border-pl-border/80 bg-pl-dark shadow-2xl">
            {player.image ? (
              <img
                src={player.image}
                alt={player.name}
                className="h-full w-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-pl-muted">
                <Users size={64} />
              </div>
            )}
            {(player.squadNumber || player.shirtNumber) && (
              <div className="absolute bottom-2 right-2 rounded-xl bg-pl-dark/90 px-2.5 py-1 text-xs font-mono font-black text-white border border-pl-border">
                #{player.squadNumber || player.shirtNumber}
              </div>
            )}
          </div>

          {/* Info Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="rounded-lg bg-pl-purple px-3 py-1 text-xs font-bold uppercase tracking-wider text-pl-pinkLight border border-pl-pink/30">
                {player.position || 'Player'}
              </span>
              <Link
                to={teamData.id ? `/teams/${teamData.id}` : '#'}
                className="flex items-center gap-2 rounded-lg bg-pl-dark px-3 py-1 text-xs font-bold text-white border border-pl-border hover:border-pl-pink/50 transition-colors"
              >
                {teamData.logo && (
                  <img src={teamData.logo} alt={teamData.name} className="h-4 w-4 object-contain" />
                )}
                <span>{teamData.name}</span>
              </Link>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white">
              {player.name}
            </h1>

            <p className="text-sm text-pl-lavender">
              {[
                player.nationality,
                player.age ? `${player.age} years old` : null,
                player.height || null
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>

            {player.bio && (
              <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-pl-muted">
                {player.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Core Statistics Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-pl-pink" />
            <span>Season 2026/27 Metrics</span>
          </h2>
          <span className="text-xs text-pl-muted">Official Premier League Data</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Trophy}
            label="Appearances"
            value={appearancesDisplay}
            subtitle="Premier League"
            color="purple"
          />
          <StatCard
            icon={Target}
            label="Goals"
            value={goalsDisplay}
            subtitle="Scored this term"
            color="pink"
            highlight={typeof player.goals === 'number' && player.goals > 10}
          />
          <StatCard
            icon={Zap}
            label="Assists"
            value={assistsDisplay}
            subtitle="Chances set up"
            color="pink"
            highlight={typeof player.assists === 'number' && player.assists > 8}
          />
          <StatCard
            icon={Clock}
            label="Minutes"
            value={minutesDisplay}
            subtitle="On pitch duty"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Shots"
            value={shotsDisplay}
            subtitle={player.shotAccuracy ? `${player.shotAccuracy} on target` : 'Season total'}
            color="pink"
          />
          <StatCard
            icon={Award}
            label="Pass Accuracy"
            value={passAccuracyDisplay}
            subtitle="Midfield distribution"
            color="purple"
          />
        </div>
      </div>

      {/* Visual Attribute Radar & Advanced Metrics (rendered if available) */}
      {player.radar && player.radar.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Attributes Bars */}
          <div className="rounded-2xl border border-pl-border bg-pl-card/85 p-6 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-pl-border/60 pb-3">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pl-pink" />
                <span>Skill Profile & Performance Attributes</span>
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider text-pl-muted">Index / 100</span>
            </div>

            <div className="space-y-4">
              {player.radar.map((attr, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-pl-lavender">{attr.stat}</span>
                    <span className="font-mono text-sm font-bold text-white">{attr.value}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-pl-dark border border-pl-border/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        attr.value >= 90
                          ? 'bg-gradient-to-r from-pl-pink to-pl-violet shadow-glow-pink'
                          : attr.value >= 80
                          ? 'bg-gradient-to-r from-pl-violet to-pl-purpleLight'
                          : 'bg-gradient-to-r from-pl-purple to-pl-violet'
                      }`}
                      style={{ width: `${attr.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Tactical Telemetry */}
          <div className="rounded-2xl border border-pl-border bg-pl-card/85 p-6 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-pl-border/60 pb-3">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-pl-pink" />
                <span>Tactical & Possession Telemetry</span>
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider text-pl-muted">Advanced Analytics</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-pl-dark/80 border border-pl-border/50 text-xs">
                <span className="text-pl-lavender font-medium">Expected Goals (xG)</span>
                <span className="font-display text-sm font-bold text-pl-pink">{player.xg || '—'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-pl-dark/80 border border-pl-border/50 text-xs">
                <span className="text-pl-lavender font-medium">Chances Created</span>
                <span className="font-display text-sm font-bold text-white">{player.chancesCreated || '—'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-pl-dark/80 border border-pl-border/50 text-xs">
                <span className="text-pl-lavender font-medium">Dribble Success Rate</span>
                <span className="font-display text-sm font-bold text-pl-pinkLight">{player.dribblesSuccess || '—'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-pl-dark/80 border border-pl-border/50 text-xs">
                <span className="text-pl-lavender font-medium">Aerial Duels Won</span>
                <span className="font-display text-sm font-bold text-white">{player.aerialDuelsWon || '—'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-pl-dark/80 border border-pl-border/50 text-xs">
                <span className="text-pl-lavender font-medium">Shots On Target Accuracy</span>
                <span className="font-display text-sm font-bold text-pl-pink">{player.shotAccuracy || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
