import React from 'react';

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  trend, 
  highlight = false, 
  color = 'pink' 
}) {
  const accentColors = {
    pink: 'from-[#FA007B]/25 to-transparent border-[#FA007B]/40 text-pl-pink',
    purple: 'from-[#6B145F]/30 to-transparent border-[#6B145F]/50 text-purple-300',
    lavender: 'from-purple-500/20 to-transparent border-purple-500/30 text-pl-lavender',
    amber: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-300'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-pl-card/90 p-5 backdrop-blur-md transition-all duration-300 hover:border-pl-pink/40 hover:shadow-card ${highlight ? 'border-pl-pink/60 shadow-glow-subtle' : 'border-pl-border'}`}>
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accentColors[color] || accentColors.pink} opacity-30 blur-2xl`} />
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-pl-muted">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {value}
            </h3>
            {trend && (
              <span className={`text-xs font-semibold ${trend > 0 ? 'text-pl-pink' : 'text-rose-400'}`}>
                {trend > 0 ? `+${trend}` : trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-pl-lavender/80">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-pl-border bg-pl-navy text-pl-pink">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
