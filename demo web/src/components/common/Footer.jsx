import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Trophy, Activity, Github, Twitter, Instagram, Youtube, Radio } from 'lucide-react';
import plLogo from '../../assets/pl-logo.svg';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-pl-border/80 bg-pl-dark text-pl-lavender">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          
          {/* Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-pl-purple via-pl-purpleLight to-pl-pink p-2 shadow-glow-pink/30">
                <img src={plLogo} alt="PL Quicky Logo" className="h-full w-full object-contain" />
              </div>
              <span className="font-display text-2xl font-black tracking-tight text-white">
                PL<span className="text-pl-pink">QUICKY</span>
              </span>
            </Link>
            
            <p className="font-display text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-pl-lavender to-pl-pinkLight">
              "Your Premier League. One Pulse."
            </p>
            
            <p className="max-w-sm text-xs leading-relaxed text-pl-muted">
              The premier fan-crafted dashboard offering live match centres, deep statistics, league standings, and comprehensive squad analysis for English football supporters.
            </p>

            {/* Social Icons Placeholders */}
            <div className="flex items-center gap-3 pt-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-pl-border bg-pl-card text-pl-muted hover:text-pl-pink hover:border-pl-pink/40 transition-colors cursor-pointer" title="Twitter / X">
                <Twitter className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-pl-border bg-pl-card text-pl-muted hover:text-pl-pink hover:border-pl-pink/40 transition-colors cursor-pointer" title="Instagram">
                <Instagram className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-pl-border bg-pl-card text-pl-muted hover:text-pl-magenta hover:border-pl-magenta/40 transition-colors cursor-pointer" title="YouTube">
                <Youtube className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-pl-border bg-pl-card text-pl-muted hover:text-pl-pink hover:border-pl-pink/40 transition-colors cursor-pointer" title="Discord / Community">
                <Radio className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-pl-pink transition-colors">Home Dashboard</Link>
              </li>
              <li>
                <Link to="/fixtures" className="hover:text-pl-pink transition-colors">Fixtures & Results</Link>
              </li>
              <li>
                <Link to="/standings" className="hover:text-pl-pink transition-colors">League Table</Link>
              </li>
              <li>
                <Link to="/teams" className="hover:text-pl-pink transition-colors">All 20 Clubs</Link>
              </li>
              <li>
                <Link to="/players" className="hover:text-pl-pink transition-colors">Players Directory</Link>
              </li>
            </ul>
          </div>

          {/* Key Clubs */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Featured Clubs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/teams/arsenal" className="hover:text-pl-pink transition-colors">Arsenal</Link>
              </li>
              <li>
                <Link to="/teams/man-city" className="hover:text-pl-pink transition-colors">Manchester City</Link>
              </li>
              <li>
                <Link to="/teams/liverpool" className="hover:text-pl-pink transition-colors">Liverpool</Link>
              </li>
              <li>
                <Link to="/teams/chelsea" className="hover:text-pl-pink transition-colors">Chelsea</Link>
              </li>
              <li>
                <Link to="/teams/tottenham" className="hover:text-pl-pink transition-colors">Tottenham</Link>
              </li>
            </ul>
          </div>

          {/* Season Highlights */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Matchweek Pulse
            </h4>
            <div className="rounded-xl border border-pl-border bg-pl-card p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-pl-muted">Current Gameweek</span>
                <span className="font-bold text-pl-pinkLight">GW 30</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-pl-muted">Title Race Leader</span>
                <span className="font-bold text-pl-pink">Arsenal (68 pts)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-pl-muted">Top Goalscorer</span>
                <span className="font-bold text-white">E. Haaland (23)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-12 pt-8 border-t border-pl-border/60 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-pl-muted">
            © {new Date().getFullYear()} PL QUICKY. Crafted for Premier League football supporters worldwide.
          </p>
          <div className="max-w-xl text-[11px] leading-relaxed text-pl-muted italic">
            "PL Quicky is an independent fan-made project and is not affiliated with or endorsed by the Premier League or its clubs."
          </div>
        </div>

      </div>
    </footer>
  );
}
