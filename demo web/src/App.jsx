import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import FixturesPage from './pages/FixturesPage';
import StandingsPage from './pages/StandingsPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailsPage from './pages/TeamDetailsPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailsPage from './pages/PlayerDetailsPage';
import MatchDetailsPage from './pages/MatchDetailsPage';

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

export default function App() {
  // Persist favourite team in state & localStorage
  const [favouriteTeamId, setFavouriteTeamId] = useState(() => {
    return localStorage.getItem('pl_quicky_favourite_team') || localStorage.getItem('pl_pulse_favourite_team') || 'arsenal';
  });

  const handleSelectFavouriteTeam = (teamId) => {
    setFavouriteTeamId(teamId);
    localStorage.setItem('pl_quicky_favourite_team', teamId);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-pl-dark text-slate-100 selection:bg-pl-pink selection:text-white bg-premier-geometric">
        
        {/* Navigation */}
        <Navbar
          favouriteTeamId={favouriteTeamId}
          onSelectFavouriteTeam={handleSelectFavouriteTeam}
        />

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  favouriteTeamId={favouriteTeamId}
                  onSelectFavouriteTeam={handleSelectFavouriteTeam}
                />
              }
            />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route
              path="/teams/:id"
              element={
                <TeamDetailsPage
                  favouriteTeamId={favouriteTeamId}
                  onSelectFavouriteTeam={handleSelectFavouriteTeam}
                />
              }
            />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/players/:id" element={<PlayerDetailsPage />} />
            <Route path="/matches/:id" element={<MatchDetailsPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

      </div>
    </BrowserRouter>
  );
}
