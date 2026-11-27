import React from 'react';

export default function FilterBar({ 
  options = [], 
  activeFilter, 
  onSelectFilter, 
  label = null,
  className = '' 
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-pl-muted mr-1">
          {label}:
        </span>
      )}
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const optLabel = typeof option === 'string' ? option : option.label;
        const count = typeof option === 'object' && option.count !== undefined ? option.count : null;
        const isActive = activeFilter === value;

        return (
          <button
            key={value}
            onClick={() => onSelectFilter(value)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-pl-purple text-white shadow-glow-pink border border-pl-pink'
                : 'bg-pl-card/80 text-pl-lavender border border-pl-border hover:border-pl-pink/50 hover:text-white'
            }`}
          >
            <span>{optLabel}</span>
            {count !== null && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? 'bg-pl-pink text-pl-dark' : 'bg-pl-dark text-pl-muted'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
