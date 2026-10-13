import React from 'react';

export default function FormIndicator({ form = [], size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs font-bold',
    lg: 'w-8 h-8 text-sm font-extrabold'
  };

  const getResultStyle = (res) => {
    switch (res?.toUpperCase()) {
      case 'W':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]';
      case 'D':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'L':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.25)]';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="flex items-center gap-1.5" title={`Recent form: ${form.join('-')}`}>
      {form.map((res, index) => (
        <span
          key={index}
          className={`flex items-center justify-center rounded-md font-display transition-transform hover:scale-110 ${sizeClasses[size] || sizeClasses.md} ${getResultStyle(res)}`}
        >
          {res}
        </span>
      ))}
    </div>
  );
}
