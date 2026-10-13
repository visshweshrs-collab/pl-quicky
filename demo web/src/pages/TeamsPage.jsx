import React, { useState, useMemo } from 'react';
import { Shield, Search, ArrowUpDown, Sparkles } from 'lucide-react';
import { teams } from '../data/teams';
import TeamCard from '../components/team/TeamCard';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('position'); // 'position', 'name', 'points'

  const filteredTeams = useMemo(() => {
    let result = teams.filter((team) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        team.name.toLowerCase().includes(q) ||
        team.shortName.toLowerCase().includes(q) ||
        team.city.toLowerCase().includes(q) ||
        team.stadium.toLowerCase().includes(q) ||
        team.manager.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'position') {
      result.sort((a, b) => a.position - b.position);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'points') {
      result.sort((a, b) => b.points - a.points);
    }

    return result;
  }, [searchQuery, sortBy]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-pl-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-pl-pink/40 bg-pl-purple/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pl-pinkLight mb-2">
            <Shield className="h-3.5 w-3.5 text-pl-pink" />
            <span>Club Directory</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white">
            PREMIER LEAGUE CLUBS
          </h1>
          <p className="mt-1 text-sm text-pl-muted">
            Explore club profiles, stadiums, tactical records, and key personnel across all 20 teams
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search club, city, manager..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-pl-border bg-pl-card py-2.5 px-3 text-xs font-semibold text-white focus:outline-none focus:border-pl-pink"
            >
              <option value="position">Sort by Position</option>
              <option value="points">Sort by Points</option>
              <option value="name">Sort Alphabetically (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 20 Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clubs found"
          description={`No Premier League teams matched your search for "${searchQuery}".`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      )}

    </div>
  );
}
