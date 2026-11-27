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
        return 'bg-pl-pink/20 text-pl-pink border border-pl-pink/40 shadow-[0_0_8px_rgba(0,168,232,0.25)]';
      case 'D':
        return 'bg-pl-violet/20 text-pl-violetLight border border-pl-violet/40';
      case 'L':
        return 'bg-pl-magenta/20 text-pl-magenta border border-pl-magenta/40 shadow-[0_0_8px_rgba(230,28,120,0.25)]';
      default:
        return 'bg-pl-navy text-slate-400 border border-pl-border';
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
