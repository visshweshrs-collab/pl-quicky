import React, {
  useState,
  useEffect,
  useMemo
} from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  Trophy,
  CheckCircle,
  Clock
} from 'lucide-react';

import {
  teams,
  getTeamByApiId
} from '../data/teams';

import { API_BASE_URL } from '../config/api';

import MatchCard from '../components/match/MatchCard';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';

export default function FixturesPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  // =====================================================
  // INITIAL TAB
  // =====================================================

  const initialTab =
    searchParams.get('tab') === 'completed'
      ? 'COMPLETED'
      : 'UPCOMING';

  // =====================================================
  // STATE
  // =====================================================

  const [activeTab, setActiveTab] =
    useState(initialTab);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedTeam, setSelectedTeam] =
    useState('ALL');

  const [selectedCompetition, setSelectedCompetition] =
    useState('ALL');

  const [selectedDate, setSelectedDate] =
    useState('');

  const [matches, setMatches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // =====================================================
  // FETCH FIXTURES FROM BACKEND
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const fetchFixtures = async (isBackground = false) => {
      try {
        if (!isBackground) {
          setLoading(true);
          setError('');
        }

        const response = await fetch(
          `${API_BASE_URL}/api/fixtures/saved`
        );

        if (!response.ok) {
          throw new Error(
            'Failed to fetch fixtures'
          );
        }

        const data =
          await response.json();

        // =================================================
        // CONVERT BACKEND DATA
        // =================================================

        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.fixtures)
            ? data.fixtures
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const formattedMatches = rawList.map((match) => {

                // -----------------------------------------
                // FIND LOCAL TEAMS
                // Used for existing logos and team data
                // -----------------------------------------

                const homeTeam =
                  getTeamByApiId(
                    match.homeTeamId
                  );

                const awayTeam =
                  getTeamByApiId(
                    match.awayTeamId
                  );

                // -----------------------------------------
                // STATUS
                // -----------------------------------------

                let status = 'UPCOMING';

                const rawStatus =
                  String(
                    match.status || ''
                  ).toUpperCase();

                if (
                  rawStatus === 'FT' ||
                  rawStatus === 'FINISHED' ||
                  rawStatus === 'COMPLETE' ||
                  rawStatus === 'COMPLETED' ||
                  rawStatus === 'FULL TIME' ||
                  rawStatus === 'FULL_TIME' ||
                  rawStatus === 'FINISHED_AFTER_EXTRA_TIME' ||
                  rawStatus === 'FINISHED_AFTER_PENALTY_SHOOTOUT'
                ) {
                  status = 'COMPLETED';
                }

                if (
                  rawStatus === 'LIVE' ||
                  rawStatus === '1H' ||
                  rawStatus === '2H' ||
                  rawStatus === 'HT' ||
                  rawStatus === 'HALF TIME' ||
                  rawStatus === 'IN_PLAY' ||
                  rawStatus === 'INPLAY'
                ) {
                  status = 'LIVE';
                }

                // -----------------------------------------
                // DATE
                // -----------------------------------------

                const rawDate =
                  match.matchDate ||
                  match.match_date ||
                  match.date;

                const rawDateStr =
                  rawDate
                    ? String(rawDate).trim()
                    : '';

                const normalizedDateStr =
                  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(rawDateStr)
                    ? `${rawDateStr.replace(/\s+/, 'T')}Z`
                    : rawDateStr;

                const matchDate =
                  normalizedDateStr
                    ? new Date(normalizedDateStr)
                    : null;

                const validDate =
                  matchDate &&
                  !Number.isNaN(
                    matchDate.getTime()
                  );

                // -----------------------------------------
                // REAL MATCH ID
                // -----------------------------------------

                const realMatchId =
                  match.matchId ??
                  match.match_id ??
                  match.id;

                // -----------------------------------------
                // TEAM IDs
                // -----------------------------------------

                const homeLocalId =
                  homeTeam?.id ||
                  match.homeTeamId ||
                  '';

                const awayLocalId =
                  awayTeam?.id ||
                  match.awayTeamId ||
                  '';

                // -----------------------------------------
                // TEAM NAMES
                // -----------------------------------------

                const homeTeamName =
                  homeTeam?.name ||
                  match.homeTeamName ||
                  match.homeTeam ||
                  'Home Team';

                const awayTeamName =
                  awayTeam?.name ||
                  match.awayTeamName ||
                  match.awayTeam ||
                  'Away Team';

                // -----------------------------------------
                // TEAM LOGOS
                // -----------------------------------------

                const homeTeamLogo =
                  homeTeam?.logo ||
                  match.homeTeamLogo ||
                  match.homeLogo ||
                  '';

                const awayTeamLogo =
                  awayTeam?.logo ||
                  match.awayTeamLogo ||
                  match.awayLogo ||
                  '';

                // -----------------------------------------
                // SCORES
                // -----------------------------------------

                const homeScore =
                  match.homeScore !== null &&
                  match.homeScore !== undefined
                    ? match.homeScore
                    : null;

                const awayScore =
                  match.awayScore !== null &&
                  match.awayScore !== undefined
                    ? match.awayScore
                    : null;

                // -----------------------------------------
                // TIME
                // -----------------------------------------

                let time =
                  match.timeIST ||
                  match.time ||
                  '';

                if (
                  !time &&
                  validDate
                ) {
                  time =
                    matchDate.toLocaleTimeString(
                      'en-IN',
                      {
                        timeZone:
                          'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }
                    );
                }

                // -----------------------------------------
                // DISPLAY DATE
                // -----------------------------------------

                let displayDate =
                  match.dateIST ||
                  match.date ||
                  '';

                if (
                  validDate
                ) {
                  displayDate =
                    matchDate.toLocaleDateString(
                      'en-IN',
                      {
                        timeZone:
                          'Asia/Kolkata',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }
                    );
                }

                // -----------------------------------------
                // RETURN FRONTEND FORMAT
                // -----------------------------------------

                return {
                  // IMPORTANT:
                  // Keep the REAL FootballData ID
                  // in both fields.
                  id:
                    realMatchId !== null &&
                    realMatchId !== undefined
                      ? String(realMatchId)
                      : '',

                  matchId:
                    realMatchId !== null &&
                    realMatchId !== undefined
                      ? String(realMatchId)
                      : '',

                  // ---------------------------------------
                  // LOCAL TEAM IDs
                  // ---------------------------------------

                  homeTeamId:
                    homeLocalId,

                  awayTeamId:
                    awayLocalId,

                  // ---------------------------------------
                  // API TEAM IDs
                  // ---------------------------------------

                  homeApiId:
                    match.homeTeamId,

                  awayApiId:
                    match.awayTeamId,

                  // ---------------------------------------
                  // TEAM INFORMATION
                  // ---------------------------------------

                  homeTeamName,
                  awayTeamName,

                  homeTeamShortName:
                    homeTeam?.shortName ||
                    '',

                  awayTeamShortName:
                    awayTeam?.shortName ||
                    '',

                  homeTeamLogo,
                  awayTeamLogo,

                  // ---------------------------------------
                  // COMPETITION
                  // ---------------------------------------

                  competition:
                    match.competition ||
                    'Premier League',

                  // ---------------------------------------
                  // GAMEWEEK
                  // ---------------------------------------

                  gameweek:
                    match.gameweek ??
                    match.game_week ??
                    match.gameWeek ??
                    '-',

                  // ---------------------------------------
                  // STATUS
                  // ---------------------------------------

                  status,

                  // ---------------------------------------
                  // DATE / TIME
                  // ---------------------------------------

                  time,

                  date:
                    displayDate,

                  dateIso:
                    validDate
                      ? matchDate.toLocaleDateString(
                          'en-CA',
                          { timeZone: 'Asia/Kolkata' }
                        )
                      : '',

                  matchDate:
                    rawDate || '',

                  // ---------------------------------------
                  // VENUE
                  // ---------------------------------------

                  venue:
                    match.venue ||
                    homeTeam?.stadium ||
                    'Venue TBA',

                  venueAddress:
                    match.venueAddress ||
                    '',

                  // ---------------------------------------
                  // SCORES
                  // ---------------------------------------

                  homeScore,
                  awayScore,

                  // ---------------------------------------
                  // GOAL SCORERS
                  // (stored by the backend from FootballData events;
                  //  must be forwarded so MatchCard can render them)
                  // ---------------------------------------

                  goalEvents:
                    Array.isArray(match.goalEvents)
                      ? match.goalEvents
                      : [],

                  // ---------------------------------------
                  // LIVE MINUTE
                  // ---------------------------------------

                  minute:
                    match.minute ??
                    match.elapsed ??
                    null,

                  // ---------------------------------------
                  // REFEREE
                  // ---------------------------------------

                  referee:
                    match.referee ||
                    '',

                  // ---------------------------------------
                  // EXTRA DATA
                  // ---------------------------------------

                  rawStatus:
                    match.status ||
                    '',

                  isCompleted:
                    status === 'COMPLETED',

                  isUpcoming:
                    status === 'UPCOMING',

                  isLive:
                    status === 'LIVE'
                };
              })
              .filter(
                (m) =>
                  m.matchId &&
                  !String(m.matchId).startsWith('match-')
              );

        if (!cancelled) {
          setMatches(
            formattedMatches
          );
        }

      } catch (error) {
        console.error(
          'Error fetching fixtures:',
          error
        );

        if (!cancelled && !isBackground) {
          setError(
            'Unable to load fixtures from the backend.'
          );
        }

      } finally {
        if (!cancelled && !isBackground) {
          setLoading(false);
        }
      }
    };

    fetchFixtures(false);
    const pollInterval = setInterval(() => {
      fetchFixtures(true);
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };

  }, []);

  // =====================================================
  // TAB CHANGE
  // =====================================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    setSearchParams({
      tab:
        tab === 'COMPLETED'
          ? 'completed'
          : 'upcoming'
    });
  };

  // =====================================================
  // TEAM OPTIONS
  // =====================================================

  const teamOptions = useMemo(() => {
    return [
      {
        id: 'ALL',
        name: 'All Teams'
      },
      ...teams.map((team) => ({
        id: team.id,
        name: team.name
      }))
    ];
  }, []);

  // =====================================================
  // COMPETITION OPTIONS
  // =====================================================

  const competitionOptions = useMemo(() => {
    const competitions = [
      ...new Set(
        matches.map(
          (match) =>
            match.competition
        )
      )
    ];

    return [
      'ALL',
      ...competitions
    ];
  }, [matches]);

  // =====================================================
  // DATE OPTIONS
  // =====================================================

  const dateOptions = useMemo(() => {
    const dates = [
      ...new Set(
        matches
          .map(
            (match) =>
              match.dateIso
          )
          .filter(Boolean)
      )
    ];

    return dates.sort();

  }, [matches]);

  // =====================================================
  // FILTER MATCHES
  // =====================================================

  const filteredMatches =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return matches.filter(
        (match) => {

          // ---------------------------------------------
          // TAB
          // ---------------------------------------------

          if (
            activeTab === 'COMPLETED' &&
            match.status !== 'COMPLETED'
          ) {
            return false;
          }

          if (
            activeTab === 'UPCOMING' &&
            match.status !== 'UPCOMING' &&
            match.status !== 'LIVE'
          ) {
            return false;
          }

          // ---------------------------------------------
          // SEARCH
          // ---------------------------------------------

          if (query) {
            const searchable =
              [
                match.homeTeamName,
                match.awayTeamName,
                match.competition,
                match.venue
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (
              !searchable.includes(
                query
              )
            ) {
              return false;
            }
          }

          // ---------------------------------------------
          // TEAM FILTER
          // ---------------------------------------------

          if (
            selectedTeam !== 'ALL'
          ) {
            if (
              match.homeTeamId !==
                selectedTeam &&
              match.awayTeamId !==
                selectedTeam
            ) {
              return false;
            }
          }

          // ---------------------------------------------
          // COMPETITION
          // ---------------------------------------------

          if (
            selectedCompetition !==
              'ALL' &&
            match.competition !==
              selectedCompetition
          ) {
            return false;
          }

          // ---------------------------------------------
          // DATE
          // ---------------------------------------------

          if (
            selectedDate &&
            match.dateIso !==
              selectedDate
          ) {
            return false;
          }

          return true;
        }
      );

    }, [
      matches,
      activeTab,
      searchQuery,
      selectedTeam,
      selectedCompetition,
      selectedDate
    ]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pl-border border-t-pl-pink" />

          <p className="text-sm font-semibold text-pl-muted">
            Loading fixtures...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="space-y-6 pb-12">

        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">

          <h2 className="text-xl font-black text-white">
            Unable to load fixtures
          </h2>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-xl bg-pl-pink px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-8 pb-12">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pl-pink">
            <Trophy className="h-4 w-4" />
            <span>
              Premier League
            </span>
          </div>

          <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Fixtures
          </h1>

          <p className="mt-2 text-sm text-pl-muted">
            Follow every Premier League fixture,
            result and match centre.
          </p>

        </div>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="flex justify-center">

        <div className="flex items-center rounded-2xl border border-pl-border bg-pl-card p-1.5 shadow-inner">

          <button
            onClick={() =>
              handleTabChange(
                'UPCOMING'
              )
            }
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-pl-purple text-white border border-pl-pink'
                : 'text-pl-muted hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            Upcoming
          </button>

          <button
            onClick={() =>
              handleTabChange(
                'COMPLETED'
              )
            }
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'COMPLETED'
                ? 'bg-pl-purple text-white border border-pl-pink'
                : 'text-pl-muted hover:text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Completed
          </button>

        </div>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="rounded-2xl border border-pl-border bg-pl-card/80 p-4">

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search teams, stadiums..."
        />

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* TEAM */}
        <select
          value={selectedTeam}
          onChange={(e) =>
            setSelectedTeam(
              e.target.value
            )
          }
          className="rounded-xl border border-pl-border bg-pl-card px-4 py-3 text-xs font-semibold text-white outline-none"
        >
          {teamOptions.map(
            (team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            )
          )}
        </select>

        {/* COMPETITION */}
        <select
          value={
            selectedCompetition
          }
          onChange={(e) =>
            setSelectedCompetition(
              e.target.value
            )
          }
          className="rounded-xl border border-pl-border bg-pl-card px-4 py-3 text-xs font-semibold text-white outline-none"
        >
          {competitionOptions.map(
            (competition) => (
              <option
                key={competition}
                value={competition}
              >
                {competition ===
                'ALL'
                  ? 'All Competitions'
                  : competition}
              </option>
            )
          )}
        </select>

        {/* DATE */}
        <select
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(
              e.target.value
            )
          }
          className="rounded-xl border border-pl-border bg-pl-card px-4 py-3 text-xs font-semibold text-white outline-none"
        >
          <option value="">
            All Dates
          </option>

          {dateOptions.map(
            (date) => {

              const formatted =
                new Date(
                  `${date}T00:00:00`
                ).toLocaleDateString(
                  'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }
                );

              return (
                <option
                  key={date}
                  value={date}
                >
                  {formatted}
                </option>
              );
            }
          )}

        </select>

      </div>

      {/* =================================================
          RESULT COUNT
      ================================================= */}

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-pl-muted">
          {filteredMatches.length}{' '}
          {filteredMatches.length === 1
            ? 'match'
            : 'matches'}
        </p>

        {(searchQuery ||
          selectedTeam !== 'ALL' ||
          selectedCompetition !== 'ALL' ||
          selectedDate) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTeam('ALL');
              setSelectedCompetition('ALL');
              setSelectedDate('');
            }}
            className="text-xs font-bold text-pl-pink hover:text-pl-pinkLight"
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* =================================================
          MATCH GRID
      ================================================= */}

      {filteredMatches.length === 0 ? (
        <EmptyState
          title="No matches found"
          description="Try changing your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredMatches.map(
            (match, index) => (

              <MatchCard
                key={
                  match.matchId ||
                  match.id ||
                  index
                }
                match={match}
              />

            )
          )}

        </div>
      )}

    </div>
  );
}