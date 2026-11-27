import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Search, 
  Heart, 
  Shield, 
  ChevronDown, 
  User, 
  Sparkles,
  Calendar,
  Table,
  Users,
  Compass
} from 'lucide-react';
import plLogo from '../../assets/pl-logo.svg';
import { teams } from '../../data/teams';

export default function Navbar({ favouriteTeamId, onSelectFavouriteTeam }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favDropdownOpen, setFavDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const selectedFavTeam = teams.find(t => t.id === favouriteTeamId) || teams[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFavDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Fixtures', path: '/fixtures' },
    { name: 'Standings', path: '/standings' },
    { name: 'Teams', path: '/teams' },
    { name: 'Players', path: '/players' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    
    // Check if query matches a team
    const matchedTeam = teams.find(t => t.name.toLowerCase().includes(query) || t.shortName.toLowerCase().includes(query));
    if (matchedTeam) {
      navigate(`/teams/${matchedTeam.id}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
      return;
    }

    // Default to players or fixtures
    navigate(`/players?search=${encodeURIComponent(searchQuery)}`);
    setSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-pl-border/80 bg-pl-dark/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-pl-purple via-pl-purpleLight to-pl-pink p-2 shadow-glow-pink/30 transition-transform group-hover:scale-105">
              <img src={plLogo} alt="PL Quicky Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl font-black tracking-tight text-white">
                  PL<span className="text-pl-pink">QUICKY</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-pl-purple/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pl-lavender border border-pl-borderLight">
                  2026/27
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wider text-pl-muted -mt-1 hidden sm:block">
                PREMIER LEAGUE DASHBOARD
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-white bg-pl-purple/60 border border-pl-pink shadow-[0_0_15px_rgba(0,168,232,0.35)] rounded-full px-4 py-1.5'
                      : 'text-slate-300 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-pl-card/60'
                  }`
                }
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Tools: Search, Favourite Team, Profile, Mobile Toggle */}
        <div className="flex items-center gap-3">
          
          {/* Search Trigger */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search club, player..."
                  autoFocus
                  className="w-48 sm:w-64 rounded-xl border border-pl-pink/50 bg-pl-card py-2 pl-9 pr-8 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pl-pink"
                />
                <Search className="absolute left-3 h-3.5 w-3.5 text-pl-pink" />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-pl-border bg-pl-card/60 text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                title="Search clubs or players"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Favourite Team Selector Dropdown */}
          <div className="relative hidden lg:block" ref={dropdownRef}>
            <button
              onClick={() => setFavDropdownOpen(!favDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-pl-border bg-pl-card/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-pl-purple hover:bg-pl-card transition-all"
              title="Change your favourite club"
            >
              <Heart className="h-3.5 w-3.5 fill-pl-pink text-pl-pink" />
              <img src={selectedFavTeam.logo} alt={selectedFavTeam.name} className="h-5 w-5 object-contain" />
              <span className="max-w-[90px] truncate">{selectedFavTeam.shortName}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${favDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {favDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border border-pl-border bg-pl-card p-2 shadow-2xl backdrop-blur-2xl z-50">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-pl-border/60">
                  Select Favourite Team
                </div>
                <div className="py-1">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectFavouriteTeam(t.id);
                        setFavDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                        t.id === favouriteTeamId 
                          ? 'bg-pl-purple text-white shadow-sm' 
                          : 'text-slate-300 hover:bg-pl-navy hover:text-white'
                      }`}
                    >
                      <img src={t.logo} alt={t.name} className="h-5 w-5 object-contain" />
                      <span className="flex-1 truncate">{t.name}</span>
                      <span className="text-[10px] text-slate-400">{t.shortName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Placeholder */}
          <div className="hidden sm:flex items-center gap-2 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pl-border bg-pl-dark text-slate-300 shadow-inner">
              <User className="h-4 w-4 text-pl-pinkLight" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 md:hidden items-center justify-center rounded-xl border border-pl-border bg-pl-card text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pl-border bg-pl-dark/95 backdrop-blur-2xl px-4 py-5 shadow-2xl transition-all">
          <nav className="flex flex-col space-y-2 mb-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-pl-purple text-white border border-pl-pink shadow-glow-subtle'
                      : 'text-slate-300 hover:bg-pl-card hover:text-white'
                  }`
                }
              >
                <span>{link.name}</span>
                <span className="text-xs text-pl-pink">→</span>
              </NavLink>
            ))}
          </nav>

          {/* Favourite Team Picker on Mobile */}
          <div className="rounded-xl border border-pl-border bg-pl-card/90 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Heart className="h-4 w-4 text-pl-pink fill-pl-pink" />
                <span>Favourite Club</span>
              </div>
              <span className="text-xs text-pl-pink font-semibold">{selectedFavTeam.name}</span>
            </div>
            <select
              value={favouriteTeamId}
              onChange={(e) => onSelectFavouriteTeam(e.target.value)}
              className="w-full rounded-lg border border-pl-border bg-pl-navy py-2 px-3 text-xs font-medium text-white focus:outline-none focus:border-pl-pink"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
