import React from 'react';
import { SearchX, ArrowRight } from 'lucide-react';

export default function EmptyState({ 
  title = 'No records found', 
  description = 'Try adjusting your search criteria or filters.',
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-pl-border bg-pl-card/40 py-16 px-6 text-center backdrop-blur-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pl-navy border border-pl-border text-slate-400 mb-4">
        <SearchX className="h-7 w-7 text-pl-pink" />
      </div>
      <h3 className="font-display text-xl font-bold text-white mb-2">{title}</h3>
      <p className="max-w-md text-sm text-pl-lavender mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-pl-pink px-5 py-2.5 text-sm font-semibold text-white shadow-glow-pink hover:bg-pl-pinkLight transition-all"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
