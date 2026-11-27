import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Heart,
  ChevronRight,
} from "lucide-react";

import {
  getTeamById,
} from "../data/teams";

import {
  getTopScorers,
} from "../data/players";

import MatchCard from "../components/match/MatchCard";
import StandingsTable from "../components/standings/StandingsTable";
import PlayerCard from "../components/player/PlayerCard";
import FormIndicator from "../components/common/FormIndicator";
import { API_BASE_URL } from "../config/api";


export default function HomePage({
  favouriteTeamId,
  onSelectFavouriteTeam,
}) {

  const [liveFixtures, setLiveFixtures] =
    useState([]);

  const [liveTeams, setLiveTeams] =
    useState({});

  const [fixturesLoading, setFixturesLoading] =
    useState(true);

  const [fixturesError, setFixturesError] =
    useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD LIVE FIXTURES + TEAMS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let cancelled = false;


    async function loadFixtures(isBackground = false) {

      try {

        if (!isBackground) {
          setFixturesLoading(true);
          setFixturesError("");
        }


        const fixturesURL =
          `${API_BASE_URL}/api/fixtures/saved`;

        const teamsURL =
          `${API_BASE_URL}/api/teams`;


        console.log(
          "Loading fixtures from:",
          fixturesURL
        );

        console.log(
          "Loading teams from:",
          teamsURL
        );


        const [
          fixtureResponse,
          teamResponse,
        ] = await Promise.all([

          fetch(fixturesURL),

          fetch(teamsURL),

        ]);


        if (!fixtureResponse.ok) {

          throw new Error(
            `Fixtures request failed (${fixtureResponse.status})`
          );

        }


        const fixtureData =
          await fixtureResponse.json();


        const teamData =
          teamResponse.ok
            ? await teamResponse.json()
            : [];


        const teamsArray =
          Array.isArray(teamData)
            ? teamData
            : teamData?.teams || [];


        if (cancelled) {
          return;
        }


        /*
        |--------------------------------------------------------------------------
        | TEAM MAP
        |--------------------------------------------------------------------------
        */

        const teamMap = {};


        teamsArray.forEach((team) => {

          const id =
            team?.teamId ??
            team?.id;


          if (id != null) {

            teamMap[String(id)] =
              team;

          }

        });


        /*
        |--------------------------------------------------------------------------
        | NORMALIZE FIXTURES
        |--------------------------------------------------------------------------
        */

        const rawFixtures = Array.isArray(fixtureData)
          ? fixtureData
          : Array.isArray(fixtureData?.fixtures)
            ? fixtureData.fixtures
            : Array.isArray(fixtureData?.data)
              ? fixtureData.data
              : [];

        const normalized = rawFixtures
          .map((fixture) => {

            const dateValue =
              fixture?.matchDate ||
              fixture?.date;

            const rawDateStr =
              dateValue
                ? String(dateValue).trim()
                : "";

            const normalizedDateStr =
              /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(rawDateStr)
                ? `${rawDateStr.replace(/\s+/, "T")}Z`
                : rawDateStr;

            const dateObj =
              normalizedDateStr
                ? new Date(normalizedDateStr)
                : null;


            const status =
              String(
                fixture?.status || ""
              ).toLowerCase();

            const isLive =
              /live|in_play|inplay|1h|2h|(^|\s)ht($|\s)|half time|half-time/.test(
                status
              );

            const completed =
              !isLive &&
              (
                (/finished|complete|full time|(^|\s)ft($|\s)/.test(status) && !status.includes("incomplete"))
                ||
                (
                  !/scheduled|upcoming|not started|fixture|postponed|cancelled|canceled/.test(
                    status
                  )
                  &&
                  fixture?.homeScore !== null &&
                  fixture?.homeScore !== undefined &&
                  fixture?.awayScore !== null &&
                  fixture?.awayScore !== undefined &&
                  dateObj
                  &&
                  dateObj.getTime() < Date.now()
                )
              );


            const homeClubName =
              fixture?.homeTeam ||
              teamMap[
                String(
                  fixture?.homeTeamId
                )
              ]?.name ||
              "Home Team";

            const awayClubName =
              fixture?.awayTeam ||
              teamMap[
                String(
                  fixture?.awayTeamId
                )
              ]?.name ||
              "Away Team";

            const homeClubLogo =
              teamMap[
                String(
                  fixture?.homeTeamId
                )
              ]?.logo ||
              fixture?.homeTeamLogo ||
              "";

            const awayClubLogo =
              teamMap[
                String(
                  fixture?.awayTeamId
                )
              ]?.logo ||
              fixture?.awayTeamLogo ||
              "";

            const realMatchId =
              fixture?.matchId ??
              fixture?.match_id ??
              fixture?.id;

            return {

              id:
                realMatchId !== null &&
                realMatchId !== undefined
                  ? String(realMatchId)
                  : "",

              matchId:
                realMatchId !== null &&
                realMatchId !== undefined
                  ? String(realMatchId)
                  : "",

              homeTeamId:
                fixture?.homeTeamId,

              awayTeamId:
                fixture?.awayTeamId,

              matchDate:
                dateValue,

              homeTeam:
                homeClubName,

              homeTeamName:
                homeClubName,

              awayTeam:
                awayClubName,

              awayTeamName:
                awayClubName,

              homeTeamLogo:
                homeClubLogo,

              awayTeamLogo:
                awayClubLogo,


              date:

                fixture?.dateIST

                ||

                (
                  dateObj
                    ? dateObj.toLocaleDateString(
                        "en-IN",
                        {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "Date TBC"
                ),


              time:

                fixture?.timeIST

                ||

                (
                  dateObj
                    ? dateObj.toLocaleTimeString(
                        "en-IN",
                        {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "Time TBC"
                ),


              venue:
                fixture?.venue ||
                teamMap[
                  String(
                    fixture?.homeTeamId
                  )
                ]?.stadiumName ||
                "Venue TBC",


              gameweek:
                fixture?.gameweek ??
                null,


              competition:
                "Premier League",


              status:
                isLive
                  ? "LIVE"
                  : completed
                    ? "COMPLETED"
                    : "UPCOMING",


              homeScore:
                (completed || isLive)
                  ? fixture?.homeScore
                  : null,


              awayScore:
                (completed || isLive)
                  ? fixture?.awayScore
                  : null,


              // Goal scorers stored by the backend (FootballData events).
              // Must be forwarded or MatchCard has nothing to render.
              goalEvents:
                (completed || isLive) &&
                Array.isArray(fixture?.goalEvents)
                  ? fixture.goalEvents
                  : [],

            };

          })


          .filter(
            (match) =>
              match.matchId &&
              !String(match.matchId).startsWith("match-") &&
              match.homeTeam &&
              match.awayTeam
          );


        setLiveTeams(teamMap);

        setLiveFixtures(normalized);


      } catch (error) {

        console.error(
          "Home fixture load error:",
          error
        );


        if (!cancelled && !isBackground) {

          setFixturesError(
            error.message ||
            "Unable to load fixtures"
          );

        }

      } finally {

        if (!cancelled && !isBackground) {

          setFixturesLoading(false);

        }

      }

    }


    loadFixtures(false);
    const pollInterval = setInterval(() => {
      loadFixtures(true);
    }, 60000);


    return () => {

      cancelled = true;
      clearInterval(pollInterval);

    };

  }, []);


  /*
  |--------------------------------------------------------------------------
  | TOP SCORERS
  |--------------------------------------------------------------------------
  */

  const topScorers =
    getTopScorers().slice(0, 3);


  /*
  |--------------------------------------------------------------------------
  | COMPLETED MATCHES
  |--------------------------------------------------------------------------
  */

  const completedMatches = useMemo(() => {

    return liveFixtures

      .filter(
        (match) =>
          match.status === "COMPLETED"
      )

      .sort(
        (a, b) =>
          new Date(b.matchDate) -
          new Date(a.matchDate)
      )

      .slice(0, 3);

  }, [liveFixtures]);


  /*
  |--------------------------------------------------------------------------
  | UPCOMING MATCHES
  |--------------------------------------------------------------------------
  */

  const upcomingMatches = useMemo(() => {

    return liveFixtures

      .filter(
        (match) =>
          match.status === "LIVE" || match.status === "UPCOMING"
      )

      .sort(
        (a, b) =>
          new Date(a.matchDate) -
          new Date(b.matchDate)
      )

      .slice(0, 4);

  }, [liveFixtures]);


  /*
  |--------------------------------------------------------------------------
  | DISPLAY ARRAYS (REAL MONGODB FIXTURES ONLY)
  |--------------------------------------------------------------------------
  */

  const displayedCompleted = completedMatches;

  const displayedUpcoming = upcomingMatches;


  /*
  |--------------------------------------------------------------------------
  | FEATURED MATCH
  |--------------------------------------------------------------------------
  |
  | Always use the nearest REAL upcoming fixture.
  |
  */

  const featuredMatch =
    upcomingMatches[0] || null;


  /*
  |--------------------------------------------------------------------------
  | FEATURED HOME TEAM
  |--------------------------------------------------------------------------
  */

  const homeTeam = featuredMatch
    ? {

        ...(getTeamById(
          featuredMatch.homeTeamId
        ) || {}),

        name:
          featuredMatch.homeTeam,

        shortName:
          liveTeams[
            String(
              featuredMatch.homeTeamId
            )
          ]?.shortName

          ||

          getTeamById(
            featuredMatch.homeTeamId
          )?.shortName

          ||

          "",

        logo:
          liveTeams[
            String(
              featuredMatch.homeTeamId
            )
          ]?.logo

          ||

          getTeamById(
            featuredMatch.homeTeamId
          )?.logo

          ||

          "",

      }

    : null;


  /*
  |--------------------------------------------------------------------------
  | FEATURED AWAY TEAM
  |--------------------------------------------------------------------------
  */

  const awayTeam = featuredMatch
    ? {

        ...(getTeamById(
          featuredMatch.awayTeamId
        ) || {}),

        name:
          featuredMatch.awayTeam,

        shortName:
          liveTeams[
            String(
              featuredMatch.awayTeamId
            )
          ]?.shortName

          ||

          getTeamById(
            featuredMatch.awayTeamId
          )?.shortName

          ||

          "",

        logo:
          liveTeams[
            String(
              featuredMatch.awayTeamId
            )
          ]?.logo

          ||

          getTeamById(
            featuredMatch.awayTeamId
          )?.logo

          ||

          "",

      }

    : null;


  /*
  |--------------------------------------------------------------------------
  | FAVOURITE TEAM
  |--------------------------------------------------------------------------
  */

  const favTeam =
    getTeamById(favouriteTeamId);


  /*
  |--------------------------------------------------------------------------
  | FAVOURITE TEAM NEXT MATCH
  |--------------------------------------------------------------------------
  */

  const favNextMatch =

    displayedUpcoming.find(
      (match) =>

        String(match.homeTeamId) ===
          String(favouriteTeamId)

        ||

        String(match.awayTeamId) ===
          String(favouriteTeamId)
    )

    ||

    displayedUpcoming[0];


  /*
  |--------------------------------------------------------------------------
  | FAVOURITE OPPONENT
  |--------------------------------------------------------------------------
  */

  const favOpponent =
    favNextMatch

      ? getTeamById(

          String(
            favNextMatch.homeTeamId
          ) ===
            String(favouriteTeamId)

            ? favNextMatch.awayTeamId
            : favNextMatch.homeTeamId

        )

      : null;


  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (

    <div className="space-y-16 pb-12">


      {/* ================================================================
          HERO
      ================================================================ */}

      <section className="relative overflow-hidden rounded-3xl border border-pl-border/70 bg-gradient-to-r from-[#200527] via-[#430A4C] to-[#600D55] p-6 sm:p-10 shadow-card">


        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pl-purpleLight/40 via-transparent to-transparent pointer-events-none" />


        <div className="absolute -right-10 -bottom-10 h-80 w-80 rounded-full bg-pl-pink/15 blur-3xl pointer-events-none" />


        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">


          {/* LEFT */}

          <div className="max-w-xl space-y-4">


            <div className="inline-flex items-center gap-2 rounded-full border border-pl-pink/50 bg-[#350A3C]/70 px-4 py-1 text-xs font-bold uppercase tracking-wider text-pl-pinkLight backdrop-blur-md">

              <span className="flex items-center gap-0.5 text-pl-pink font-mono text-xs">
                •••
              </span>

              <span>
                Matchweek 30 Live Telemetry
              </span>

            </div>


            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">

              PL{" "}

              <span className="text-pl-pink">
                QUICKY
              </span>

            </h1>


            <p className="font-display text-xl sm:text-2xl font-extrabold text-white">

              Premier League{" "}

              <span className="text-pl-pink">
                2026/27
              </span>

            </p>


            <p className="text-sm sm:text-base leading-relaxed text-pl-lavender/90">

              Experience English football with
              real-time match centres,
              comprehensive standings,
              interactive lineups, and star
              telemetry.

            </p>


            <div className="flex flex-wrap items-center gap-3 pt-2">


              <Link
                to="/fixtures"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FA007B] to-[#D8006E] px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-glow-pink hover:opacity-95 transition-all"
              >

                <span>
                  Explore Fixtures
                </span>

                <ArrowRight className="h-4 w-4" />

              </Link>


              <Link
                to="/standings"
                className="inline-flex items-center gap-2 rounded-xl border border-pl-border bg-[#18051E]/80 px-6 py-3.5 text-xs sm:text-sm font-bold text-white hover:border-pl-pink/50 hover:bg-pl-card transition-all"
              >

                <Trophy className="h-4 w-4 text-pl-pink" />

                <span>
                  View Standings
                </span>

              </Link>


            </div>

          </div>


          {/* FEATURED MATCH */}

          <div className="w-full lg:max-w-md">


            <div className="relative overflow-hidden rounded-2xl border border-pl-pink/60 bg-[#16051D]/95 p-6 shadow-[0_0_25px_-5px_rgba(250,0,123,0.3)] backdrop-blur-xl">


              <div className="flex items-center justify-between pb-4 border-b border-pl-border/60">

                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-pl-pink">

                  <span className="h-2 w-2 rounded-full bg-pl-pink" />

                  FEATURED MATCH

                </span>


                <span className="text-xs font-medium text-pl-lavender/80">

                  {featuredMatch?.competition ||
                    "Premier League"}

                </span>

              </div>


              {/* LOADING */}

              {fixturesLoading ? (

                <div className="flex min-h-[280px] items-center justify-center text-center">

                  <div>

                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-pl-border border-t-pl-pink" />

                    <p className="text-sm font-bold text-white">
                      Loading next fixture...
                    </p>

                  </div>

                </div>

              ) : featuredMatch &&
                homeTeam &&
                awayTeam ? (

                <>


                  {/* TEAMS */}

                  <div className="my-6 grid grid-cols-7 items-center gap-2 text-center">


                    {/* HOME */}

                    <div className="col-span-3 flex flex-col items-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pl-navy/90 p-3 shadow-inner border border-pl-border/80 mb-2">

                        {homeTeam.logo ? (

                          <img
                            src={homeTeam.logo}
                            alt={homeTeam.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <span className="text-lg font-black text-pl-pink">

                            {homeTeam.name
                              .slice(0, 3)
                              .toUpperCase()}

                          </span>

                        )}

                      </div>


                      <h4 className="font-display text-sm font-black text-white">
                        {homeTeam.name}
                      </h4>


                      <span className="text-[11px] text-pl-muted">
                        {homeTeam.shortName}
                      </span>

                    </div>


                    {/* VS */}

                    <div className="col-span-1 flex flex-col items-center">
                      {featuredMatch.status === "LIVE" ? (
                        <span className="flex flex-col items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 px-2 py-1 text-xs font-black text-white">
                          <span className="text-[9px] text-rose-400 uppercase tracking-wider">LIVE</span>
                          <span>{featuredMatch.homeScore ?? 0}-{featuredMatch.awayScore ?? 0}</span>
                        </span>
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#27082F] border border-pl-border text-[11px] font-black uppercase text-pl-pink">
                          VS
                        </span>
                      )}
                    </div>


                    {/* AWAY */}

                    <div className="col-span-3 flex flex-col items-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pl-navy/90 p-3 shadow-inner border border-pl-border/80 mb-2">

                        {awayTeam.logo ? (

                          <img
                            src={awayTeam.logo}
                            alt={awayTeam.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <span className="text-lg font-black text-pl-pink">

                            {awayTeam.name
                              .slice(0, 3)
                              .toUpperCase()}

                          </span>

                        )}

                      </div>


                      <h4 className="font-display text-sm font-black text-white">
                        {awayTeam.name}
                      </h4>


                      <span className="text-[11px] text-pl-muted">
                        {awayTeam.shortName}
                      </span>

                    </div>

                  </div>


                  {/* DETAILS */}

                  <div className="space-y-2 rounded-xl bg-[#1F0726]/80 p-3.5 text-xs border border-pl-border/60">


                    <div className="flex items-center justify-between text-slate-300">

                      <span className="flex items-center gap-1.5">

                        <Calendar className="h-3.5 w-3.5 text-pl-pink" />

                        <span>
                          {featuredMatch.date}
                        </span>

                      </span>


                      <span className="flex items-center gap-1.5 font-bold text-slate-200">

                        <Clock className="h-3.5 w-3.5 text-pl-pink" />

                        <span>
                          {featuredMatch.time}
                        </span>

                      </span>

                    </div>


                    <div className="flex items-center gap-1.5 text-pl-lavender pt-1 border-t border-pl-border/40">

                      <MapPin className="h-3.5 w-3.5 text-pl-pink" />

                      <span>
                        {featuredMatch.venue}
                      </span>

                    </div>

                  </div>


                  {/* MATCH CENTRE */}

                  <div className="mt-5">

                    <Link
                      to={`/matches/${encodeURIComponent(String(featuredMatch.matchId ?? featuredMatch.id))}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FA007B] to-[#D8006E] py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-glow-pink hover:opacity-95 transition-all"
                    >

                      <span>
                        MATCH CENTRE
                      </span>

                      <ArrowRight className="h-4 w-4" />

                    </Link>

                  </div>

                </>

              ) : (

                /* NO FIXTURE */

                <div className="flex min-h-[280px] items-center justify-center text-center">

                  <div className="max-w-xs">

                    <p className="text-lg font-black text-white">

                      {fixturesError
                        ? "Unable to load fixture"
                        : "No upcoming fixture found"}

                    </p>


                    <p className="mt-2 text-sm text-pl-muted">

                      {fixturesError
                        ? "Make sure the backend is running and the phone is connected to the same Wi-Fi as the computer."
                        : "No future fixture is currently available in the saved 2026/27 schedule."}

                    </p>


                    <Link
                      to="/fixtures"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-pl-pink/50 px-4 py-2.5 text-xs font-bold text-pl-pink hover:bg-pl-pink/10"
                    >

                      Open Fixtures

                      <ArrowRight className="h-3.5 w-3.5" />

                    </Link>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </section>


      {/* ================================================================
          LATEST RESULTS
      ================================================================ */}

      <section className="space-y-6">


        <div className="flex items-center justify-between">

          <div className="space-y-1">

            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Latest Results
            </h2>

            <p className="text-xs sm:text-sm text-slate-400">
              Completed scores from the most recent matchweek
            </p>

          </div>


          <Link
            to="/fixtures?tab=completed"
            className="flex items-center gap-1 text-xs font-bold text-pl-pink hover:text-pl-pinkLight"
          >

            <span>
              All Results
            </span>

            <ChevronRight className="h-4 w-4" />

          </Link>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {displayedCompleted.map(
            (match) => (

              <MatchCard
                key={match.id}
                match={match}
              />

            )
          )}

        </div>

      </section>


      {/* ================================================================
          UPCOMING FIXTURES
      ================================================================ */}

      <section className="space-y-6">


        <div className="flex items-center justify-between">

          <div className="space-y-1">

            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Upcoming Fixtures
            </h2>

            <p className="text-xs sm:text-sm text-pl-lavender">
              High-stakes clashes scheduled across England
            </p>

          </div>


          <Link
            to="/fixtures?tab=upcoming"
            className="flex items-center gap-1 text-xs font-bold text-pl-pink hover:text-pl-pinkLight"
          >

            <span>
              Full Schedule
            </span>

            <ChevronRight className="h-4 w-4" />

          </Link>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {displayedUpcoming.map(
            (match) => (

              <MatchCard
                key={match.id}
                match={match}
              />

            )
          )}

        </div>

      </section>


      {/* ================================================================
          STANDINGS + FAVOURITE TEAM
      ================================================================ */}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">


        {/* STANDINGS */}

        <div className="lg:col-span-2 space-y-4">


          <div className="flex items-center justify-between">

            <div className="space-y-1">

              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                League Standings
              </h2>

              <p className="text-xs text-pl-lavender">
                Top 5 title contenders leading the race
              </p>

            </div>


            <Link
              to="/standings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-pl-purple border border-pl-pink/40 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-glow-subtle hover:border-pl-pink transition-all"
            >

              <span>
                VIEW FULL TABLE
              </span>

              <ChevronRight className="h-3.5 w-3.5" />

            </Link>

          </div>


          <StandingsTable
            limit={5}
            showLegend={false}
            allowTabs={false}
            compact={true}
          />

        </div>


        {/* FAVOURITE TEAM */}

        <div className="space-y-4">


          <div className="space-y-1">

            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">

              <Heart className="h-4 w-4 fill-pl-pink text-pl-pink" />

              <span>
                Fan's Favourite Team
              </span>

            </h2>


            <p className="text-xs text-pl-lavender">
              Personalized club monitor
            </p>

          </div>


          {favTeam ? (

            <div className="relative overflow-hidden rounded-2xl border border-pl-border bg-pl-card/90 p-6 backdrop-blur-md shadow-card">


              <div className="flex items-start justify-between">


                <div className="flex items-center gap-3">


                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pl-navy p-2 border border-pl-border shadow-inner">

                    {favTeam.logo ? (

                      <img
                        src={favTeam.logo}
                        alt={favTeam.name}
                        className="h-full w-full object-contain"
                      />

                    ) : (

                      <span className="text-sm font-black text-pl-pink">
                        {favTeam.name
                          ?.slice(0, 3)
                          .toUpperCase()}
                      </span>

                    )}

                  </div>


                  <div>

                    <h3 className="font-display text-lg font-bold text-white">
                      {favTeam.name}
                    </h3>

                    <p className="text-xs text-pl-muted">
                      {favTeam.stadium}
                    </p>

                  </div>

                </div>


                <span className="rounded-lg bg-pl-purple px-2.5 py-1 text-xs font-black text-pl-pinkLight border border-pl-pink/40">
                  #{favTeam.position}
                </span>

              </div>


              {/* QUICK METRICS */}

              <div className="my-5 grid grid-cols-3 gap-2 text-center">


                <div className="rounded-xl bg-pl-navy p-2.5 border border-pl-border/50">

                  <p className="text-[10px] uppercase font-bold text-pl-muted">
                    Points
                  </p>

                  <p className="font-display text-lg font-black text-white">
                    {favTeam.points}
                  </p>

                </div>


                <div className="rounded-xl bg-pl-navy p-2.5 border border-pl-border/50">

                  <p className="text-[10px] uppercase font-bold text-pl-muted">
                    Played
                  </p>

                  <p className="font-display text-lg font-black text-white">
                    {favTeam.played}
                  </p>

                </div>


                <div className="rounded-xl bg-pl-navy p-2.5 border border-pl-border/50">

                  <p className="text-[10px] uppercase font-bold text-pl-muted">
                    Goal Diff
                  </p>

                  <p className="font-display text-lg font-black text-pl-pink">
                    {Number(
                      favTeam.goalDifference || 0
                    ) > 0
                      ? `+${favTeam.goalDifference}`
                      : favTeam.goalDifference || 0}
                  </p>

                </div>

              </div>


              {/* FORM */}

              <div className="space-y-1.5 mb-5">

                <span className="text-[11px] font-bold uppercase tracking-wider text-pl-muted">
                  Recent Form
                </span>

                <FormIndicator
                  form={favTeam.form}
                  size="md"
                />

              </div>


              {/* NEXT MATCH */}

              {favNextMatch &&
                favOpponent && (

                  <div className="rounded-xl border border-pl-border/80 bg-pl-navy/70 p-3.5 space-y-2">


                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-pl-pink">
                      Next Scheduled Match
                    </span>


                    <div className="flex items-center justify-between text-xs">

                      <div className="flex items-center gap-2">

                        {favOpponent.logo ? (

                          <img
                            src={favOpponent.logo}
                            alt={favOpponent.name}
                            className="h-5 w-5 object-contain"
                          />

                        ) : null}


                        <span className="font-bold text-white">
                          vs {favOpponent.name}
                        </span>

                      </div>


                      <span className="text-pl-lavender">
                        {favNextMatch.time}
                      </span>

                    </div>


                    <p className="text-[11px] text-pl-muted pt-1 border-t border-pl-border/40">
                      {favNextMatch.date} •{" "}
                      {favNextMatch.venue}
                    </p>

                  </div>

                )}


              {/* CLUB HUB */}

              <div className="mt-5">

                <Link
                  to={`/teams/${favTeam.id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-pl-border bg-pl-card py-2.5 text-xs font-bold text-white hover:border-pl-pink/50 hover:bg-pl-purple/30 transition-colors"
                >

                  <span>
                    View Club Hub
                  </span>

                  <ChevronRight className="h-3.5 w-3.5 text-pl-pink" />

                </Link>

              </div>

            </div>

          ) : (

            <div className="rounded-2xl border border-pl-border bg-pl-card/60 p-6 text-center">

              <p className="text-sm font-bold text-white">
                Select a favourite team to see its next match.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ================================================================
          TOP PLAYERS
      ================================================================ */}

      <section className="space-y-6">


        <div className="flex items-center justify-between">

          <div className="space-y-1">

            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Top Players
            </h2>

            <p className="text-xs sm:text-sm text-pl-lavender">
              The Premier League's most productive talismans this campaign
            </p>

          </div>


          <Link
            to="/players"
            className="flex items-center gap-1 text-xs font-bold text-pl-pink hover:text-pl-pinkLight"
          >

            <span>
              All Players
            </span>

            <ChevronRight className="h-4 w-4" />

          </Link>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {topScorers.map(
            (player) => (

              <PlayerCard
                key={player.id}
                player={player}
              />

            )
          )}

        </div>

      </section>


    </div>
  );
}