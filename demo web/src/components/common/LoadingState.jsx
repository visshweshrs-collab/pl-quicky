import React from 'react';
import plLogo from '../../assets/pl-logo.svg';

export default function LoadingState({ message = 'Loading match data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="h-16 w-16 animate-ping rounded-full bg-pl-purple/40" />
        <img
          src={plLogo}
          alt="Loading"
          className="absolute inset-0 m-auto h-12 w-12 animate-pulse"
        />
      </div>
      <p className="font-display text-lg font-semibold text-white">{message}</p>
      <p className="mt-1 text-xs text-slate-400">Fetching the latest action from the Premier League</p>
    </div>
  );
}
