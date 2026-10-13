import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Filter, Sparkles } from 'lucide-react';
import { players as fallbackPlayers } from '../data/players';
import { teams } from '../data/teams';
import { API_BASE_URL } from '../config/api';
import PlayerCard from '../components/player/PlayerCard';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import EmptyState from '../components/common/EmptyState';

export default function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [playerList, setPlayerList] = useState(fallbackPlayers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPlayers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/players`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setPlayerList(data);
          }
        }
      } catch (err) {
        console.warn('Live players fetch failed, using fallback:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPlayers();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const positionOptions = [
    { label: 'All Positions', value: 'ALL' },
    { label: 'Forwards', value: 'Forward' },
    { label: 'Midfielders', value: 'Midfielder' },
    { label: 'Defenders', value: 'Defender' },
    { label: 'Goalkeepers', value: 'Goalkeeper' }
  ];

  const filteredPlayers = useMemo(() => {
    return playerList.filter((player) => {
      // Position filter
      if (selectedPosition !== 'ALL') {
        const pos = (player.position || '').toLowerCase();
        const sel = selectedPosition.toLowerCase();
        if (!pos.includes(sel)) return false;
      }

      // Team filter
      if (selectedTeam !== 'ALL') {
        const teamObj = teams.find(t => t.id === selectedTeam || String(t.teamId) === String(selectedTeam));
        const matchesTeam =
          String(player.teamId) === String(selectedTeam) ||
          (teamObj && String(player.teamId) === String(teamObj.teamId)) ||
          (teamObj && player.teamName && player.teamName.toLowerCase().includes(teamObj.name.toLowerCase()));
        if (!matchesTeam) return false;
      }

      // Search query (player name, nationality, or team name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          (player.name && player.name.toLowerCase().includes(q)) ||
          (player.knownName && player.knownName.toLowerCase().includes(q)) ||
          (player.teamName && player.teamName.toLowerCase().includes(q)) ||
          (player.nationality && player.nationality.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [playerList, selectedPosition, selectedTeam, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-pl-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-pl-pink/40 bg-pl-purple/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pl-pinkLight mb-2">
            <Sparkles className="h-3.5 w-3.5 text-pl-pink" />
            <span>Premier League Stars</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white">
            PLAYER DIRECTORY
          </h1>
          <p className="mt-1 text-sm text-pl-muted">
            Compare top goalscorers, midfield orchestrators, defensive giants, and goalkeepers
          </p>
        </div>

        <div className="w-full md:w-72">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setSearchParams(val ? { search: val } : {});
            }}
            placeholder="Search player, nationality..."
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border border-pl-border bg-pl-card/60 p-4 backdrop-blur-md">
        
        {/* Position Pills */}
        <FilterBar
          label="Position"
          options={positionOptions}
          activeFilter={selectedPosition}
          onSelectFilter={setSelectedPosition}
        />

        {/* Team Filter Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-pl-muted whitespace-nowrap">
            Club:
          </span>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full lg:w-48 rounded-xl border border-pl-border bg-pl-card py-1.5 px-3 text-xs font-semibold text-white focus:outline-none focus:border-pl-pink"
          >
            <option value="ALL">All Clubs</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No players found"
          description="Try broadening your position, club filter, or search keywords."
          actionLabel="Reset Player Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedPosition('ALL');
            setSelectedTeam('ALL');
            setSearchParams({});
          }}
        />
      )}

    </div>
  );
}
