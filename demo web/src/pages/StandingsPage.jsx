import React, { useEffect, useState } from "react";
import StandingsTable from "../components/standings/StandingsTable";
import { API_BASE_URL } from "../config/api";

const sortStandings = (rows) => {
  return [...rows]
    .sort((a, b) => {
      const pointsDiff =
        Number(b.points || 0) - Number(a.points || 0);

      if (pointsDiff !== 0) return pointsDiff;

      const goalDifferenceDiff =
        Number(b.goalDifference || 0) -
        Number(a.goalDifference || 0);

      if (goalDifferenceDiff !== 0) {
        return goalDifferenceDiff;
      }

      const goalsForDiff =
        Number(b.goalsFor || 0) -
        Number(a.goalsFor || 0);

      if (goalsForDiff !== 0) {
        return goalsForDiff;
      }

      const winsDiff =
        Number(b.won || 0) -
        Number(a.won || 0);

      if (winsDiff !== 0) {
        return winsDiff;
      }

      return (
        Number(a.originalPosition || a.position || 999) -
        Number(b.originalPosition || b.position || 999)
      );
    })
    .map((team, index) => ({
      ...team,
      position: index + 1,
    }));
};

const StandingsPage = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/standings`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch standings");
        }

        const data = await response.json();

        const formatted = data.map((team) => ({
          ...team,

          originalPosition: Number(
            team.position || 0
          ),

          position: Number(team.position || 0),

          played: Number(team.played || 0),
          won: Number(team.won || 0),
          drawn: Number(team.drawn || 0),
          lost: Number(team.lost || 0),

          goalsFor: Number(team.goalsFor || 0),
          goalsAgainst: Number(
            team.goalsAgainst || 0
          ),
          goalDifference: Number(
            team.goalDifference || 0
          ),

          points: Number(team.points || 0),
        }));

        const ranked = sortStandings(formatted);

        setStandings(ranked);
      } catch (err) {
        console.error("Error fetching standings:", err);
        setError(err.message || "Unable to load standings");
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  /*
    Because standings are now sorted before these calculations,
    the leader and safety line always match the displayed table.
  */
  const leader = standings.length > 0
    ? standings[0]
    : null;

  const totalGoals = standings.reduce(
    (sum, team) =>
      sum + Number(team.goalsFor || 0),
    0
  );

  const totalPlayed = standings.reduce(
    (sum, team) =>
      sum + Number(team.played || 0),
    0
  );

  const averageGoals =
    totalPlayed > 0
      ? (totalGoals / totalPlayed).toFixed(2)
      : "0.00";

  const bestGoalDifference =
    standings.length > 0
      ? Math.max(
          ...standings.map((team) =>
            Number(team.goalDifference || 0)
          )
        )
      : 0;

  /*
    Position 17 is currently the highest position
    that is still inside the relegation zone boundary.
  */
  const safetyLine =
    standings.find(
      (team) => Number(team.position) === 17
    ) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">

            <div className="h-10 bg-gray-200 rounded-lg w-64" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 bg-gray-200 rounded-2xl"
                />
              ))}
            </div>

            <div className="h-96 bg-gray-200 rounded-2xl" />

          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">
              Unable to Load Standings
            </h2>

            <p className="text-gray-500 mt-2">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      <div className="max-w-7xl mx-auto px-4">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Premier League Standings
          </h1>

          <p className="text-gray-500 mt-2">
            2026/27 Season
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* LEADER */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Current Leader
            </p>

            {leader ? (
              <div className="flex items-center gap-3 mt-4">

                {leader.logo ? (
                  <img
                    src={leader.logo}
                    alt={leader.teamName}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="font-bold text-gray-500">
                      {leader.teamName
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <p className="font-bold text-gray-900">
                    {leader.teamName}
                  </p>

                  <p className="text-sm text-gray-500">
                    {leader.points} points
                  </p>
                </div>

              </div>
            ) : (
              <p className="text-gray-400 mt-4">
                No data
              </p>
            )}

          </div>

          {/* TOTAL GOALS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Total Goals
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-3">
              {totalGoals}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Across all teams
            </p>

          </div>

          {/* AVERAGE GOALS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Avg. Goals / Game
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-3">
              {averageGoals}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              League average
            </p>

          </div>

          {/* SAFETY LINE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Safety Line
            </p>

            {safetyLine ? (
              <>
                <p className="text-3xl font-bold text-gray-900 mt-3">
                  {safetyLine.points}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {safetyLine.teamName}
                </p>
              </>
            ) : (
              <p className="text-gray-400 mt-4">
                No data
              </p>
            )}

          </div>

        </div>

        {/* BEST GD */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Best Goal Difference
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {bestGoalDifference > 0
                  ? `+${bestGoalDifference}`
                  : bestGoalDifference}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Ranked by
              </p>

              <p className="text-sm font-medium text-gray-700">
                Points → GD → GF → Wins
              </p>
            </div>

          </div>

        </div>

        {/* FULL TABLE */}
        <StandingsTable
          showLegend={true}
          allowTabs={true}
          compact={false}
        />

      </div>
    </div>
  );
};

export default StandingsPage;