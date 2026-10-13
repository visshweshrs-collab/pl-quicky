import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorState({ 
  title = 'Something went wrong', 
  description = 'Unable to display football data right now.',
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-950/10 py-14 px-6 text-center backdrop-blur-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/30">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="font-display text-xl font-bold text-white mb-2">{title}</h3>
      <p className="max-w-md text-sm text-slate-400 mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
