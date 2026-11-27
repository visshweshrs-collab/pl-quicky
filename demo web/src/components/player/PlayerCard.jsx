import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Sparkles } from 'lucide-react';

export default function PlayerCard({ player }) {
  const [imageError, setImageError] = useState(false);

  const getPositionBadge = (pos) => {
    if (!pos) return 'PLAYER';

    const position = pos.toLowerCase();

    if (
      position.includes('goal') ||
      position === 'gk' ||
      position.includes('keeper')
    ) {
      return 'GK';
    }

    if (
      position.includes('def') ||
      position === 'cb' ||
      position === 'lb' ||
      position === 'rb'
    ) {
      return 'DEF';
    }

    if (
      position.includes('mid') ||
      position === 'cm' ||
      position === 'dm' ||
      position === 'am'
    ) {
      return 'MID';
    }

    if (
      position.includes('forward') ||
      position.includes('attack') ||
      position.includes('striker') ||
      position.includes('wing')
    ) {
      return 'FWD';
    }

    return pos.toUpperCase();
  };

  const initials = player?.name
    ? player.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PL';

  const playerId = player?.id ?? player?.playerId;

  const cardContent = (
    <div className="group relative overflow-hidden rounded-2xl border border-pl-border bg-pl-card transition-all duration-300 hover:-translate-y-1 hover:border-pl-pink/40 hover:bg-pl-navy">
      <div className="relative h-64 overflow-hidden bg-gradient-to-b from-pl-navy/50 to-pl-dark/20">
        {player?.image && !imageError ? (
          <img
            src={player.image}
            alt={player.name || 'Player'}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pl-violet/30 via-pl-card to-pl-magenta/20">
            <span className="text-5xl font-black text-pl-muted">
              {initials}
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span className="rounded-lg border border-pl-border bg-pl-dark/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {getPositionBadge(player?.position)}
          </span>
        </div>

        {player?.number !== undefined &&
          player?.number !== null &&
          player.number !== '' && (
            <div className="absolute right-3 top-3">
              <span className="rounded-lg bg-pl-pink px-2.5 py-1 text-xs font-black text-pl-dark">
                #{player.number}
              </span>
            </div>
          )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-pl-dark to-transparent" />
      </div>

      <div className="p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-pl-pink">
          2026/27 Season
        </div>

        <h3 className="truncate text-lg font-black text-white">
          {player?.name || 'Unknown Player'}
        </h3>

        <p className="mt-1 truncate text-xs text-pl-lavender">
          {player?.nationality || 'Nationality unavailable'}
          {player?.age ? ` • ${player.age} yrs` : ''}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-pl-border pt-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-pl-muted">
              Apps
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {player?.appearances !== null && player?.appearances !== undefined ? player.appearances : '—'}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-pl-muted">
              Goals
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {player?.goals !== null && player?.goals !== undefined ? player.goals : '—'}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-pl-muted">
              Assists
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {player?.assists !== null && player?.assists !== undefined ? player.assists : '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-bold text-pl-lavender transition-colors group-hover:text-pl-pink">
          <span>View player</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {player?.isHot && (
        <div className="absolute right-3 top-3">
          <div className="flex items-center gap-1 rounded-lg bg-pl-magenta px-2 py-1 text-[10px] font-black text-white">
            <Flame size={12} />
            HOT
          </div>
        </div>
      )}

      {player?.isStar && (
        <div className="absolute left-3 top-3">
          <div className="flex items-center gap-1 rounded-lg bg-pl-violet px-2 py-1 text-[10px] font-black text-white">
            <Sparkles size={12} />
            STAR
          </div>
        </div>
      )}
    </div>
  );

  if (playerId !== undefined && playerId !== null) {
    return (
      <Link to={`/players/${playerId}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}