import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Trophy } from 'lucide-react';
import FormIndicator from '../common/FormIndicator';

export default function TeamCard({ team }) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-pl-border/80 bg-pl-card/90 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-pl-pink/60 hover:shadow-card-hover"
    >
      {/* Top row: Position badge & Points */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
            team.position <= 4 
              ? 'bg-pl-purple text-pl-pinkLight border border-pl-pink/40 shadow-glow-subtle'
              : team.position === 5
              ? 'bg-pl-purple text-pl-violetLight border border-pl-violet/40'
              : team.position >= 18
              ? 'bg-pl-magenta/60 text-pl-magenta border border-pl-magenta/40'
              : 'bg-pl-navy text-slate-300 border border-pl-border'
          }`}>
            {team.position}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pl-muted">
            POS
          </span>
        </div>

        <div className="text-right">
          <span className="font-display text-lg font-black text-white">
            {team.points}
          </span>
          <span className="ml-1 text-[11px] font-medium text-pl-muted">PTS</span>
        </div>
      </div>

      {/* Center: Crest, Name, Stadium */}
      <div className="my-6 flex flex-col items-center text-center">
        <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-pl-navy/90 p-3 shadow-inner border border-pl-border/80 group-hover:scale-110 transition-transform duration-300">
          <img
            src={team.logo}
            alt={team.name}
            className="h-full w-full object-contain filter drop-shadow"
          />
        </div>
        <h3 className="font-display text-lg font-bold text-white group-hover:text-pl-pink transition-colors">
          {team.name}
        </h3>
        <p className="flex items-center gap-1 mt-1 text-xs text-pl-muted">
          <MapPin className="h-3 w-3 text-pl-pink/70" />
          <span>{team.stadium}</span>
        </p>
      </div>

      {/* Bottom: Form & CTA */}
      <div className="border-t border-pl-border/50 pt-3 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pl-muted">
            Recent Form
          </span>
          <FormIndicator form={team.form} size="sm" />
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-pl-pink group-hover:translate-x-1 group-hover:text-pl-pinkLight transition-all">
          <span>Profile</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
