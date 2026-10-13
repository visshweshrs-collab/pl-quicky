import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  className = '' 
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-pl-border bg-pl-card/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder-pl-muted shadow-inner backdrop-blur-md transition-all focus:border-pl-pink focus:outline-none focus:ring-1 focus:ring-pl-pink"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
