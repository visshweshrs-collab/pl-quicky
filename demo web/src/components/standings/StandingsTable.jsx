import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../../config/api";


/*
|--------------------------------------------------------------------------
| FORM INDICATOR
|--------------------------------------------------------------------------
*/

const FormIndicator = ({ form = [] }) => {
  if (!Array.isArray(form) || form.length === 0) {
    return (
      <span className="text-xs text-pl-muted">
        —
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {form.slice(-5).map((result, index) => {
        const value =
          typeof result === "string"
            ? result.toUpperCase()
            : result?.result?.toUpperCase?.() || "";

        let className =
          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold";

        if (value === "W") {
          className += " bg-pl-pink/15 text-pl-pink";
        } else if (value === "D") {
          className += " bg-pl-navy text-slate-300";
        } else if (value === "L") {
          className += " bg-pl-magenta/15 text-pl-magenta";
        } else {
          className += " bg-pl-navy text-pl-lavender";
        }

        return (
          <span
            key={index}
            className={className}
            title={value}
          >
            {value || "—"}
          </span>
        );
      })}
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| SORT STANDINGS
|--------------------------------------------------------------------------
*/

const sortStandings = (rows) => {
  return [...rows]
    .sort((a, b) => {
      const pointsDiff =
        Number(b.points || 0) -
        Number(a.points || 0);

      if (pointsDiff !== 0) {
        return pointsDiff;
      }

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
        Number(a.originalPosition || 999) -
        Number(b.originalPosition || 999)
      );
    })
    .map((team, index) => ({
      ...team,
      position: index + 1,
    }));
};


/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const StandingsTable = ({
  limit = null,
  compact = false,
  showLegend = true,
  allowTabs = true,
}) => {
  const [standings, setStandings] = useState([]);
  const [activeTab, setActiveTab] = useState("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | FETCH STANDINGS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        const url =
          `${API_BASE_URL}/api/standings?type=${activeTab}`;

        console.log("Fetching standings from:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch standings (${response.status})`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid standings response from server"
          );
        }

        const formatted = data.map((team) => ({
          position: Number(team.position || 0),

          originalPosition: Number(
            team.originalPosition ||
            team.position ||
            999
          ),

          teamId: team.teamId,

          teamName:
            team.teamName || "",

          shortName:
            team.shortName || "",

          logo:
            team.logo || "",

          played: Number(
            team.played || 0
          ),

          won: Number(
            team.won || 0
          ),

          drawn: Number(
            team.drawn || 0
          ),

          lost: Number(
            team.lost || 0
          ),

          goalsFor: Number(
            team.goalsFor || 0
          ),

          goalsAgainst: Number(
            team.goalsAgainst || 0
          ),

          goalDifference: Number(
            team.goalDifference || 0
          ),

          points: Number(
            team.points || 0
          ),

          form: Array.isArray(team.form)
            ? team.form
            : [],
        }));

        if (!cancelled) {
          setStandings(
            sortStandings(formatted)
          );
        }

      } catch (err) {
        console.error(
          "Error fetching standings:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load standings"
          );
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStandings();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);


  /*
  |--------------------------------------------------------------------------
  | POSITION COLOUR
  |--------------------------------------------------------------------------
  */

  const getPositionClass = (position) => {
    if (position <= 4) {
      return "text-pl-pink";
    }

    if (position >= 18) {
      return "text-pl-magenta";
    }

    if (
      position >= 5 &&
      position <= 7
    ) {
      return "text-pl-violetLight";
    }

    return "text-slate-200";
  };


  /*
  |--------------------------------------------------------------------------
  | DISPLAY DATA
  |--------------------------------------------------------------------------
  */

  const displayData = limit
    ? standings.slice(0, limit)
    : standings;


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-pl-card rounded-2xl shadow-sm border border-pl-border overflow-hidden">

          <div className="p-6">

            <div className="animate-pulse space-y-4">

              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="h-12 bg-pl-navy rounded-lg"
                  />
                )
              )}

            </div>

          </div>

        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="w-full">

        <div className="bg-pl-card rounded-2xl shadow-sm border border-pl-magenta/30 p-6">

          <div className="text-center">

            <p className="text-pl-magenta font-medium">
              Unable to load standings
            </p>

            <p className="text-sm text-pl-lavender mt-1 break-words">
              {error}
            </p>

            <p className="text-xs text-pl-muted mt-3">
              API: {API_BASE_URL}
            </p>

          </div>

        </div>

      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | TABLE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="w-full">

      <div className="bg-pl-card rounded-2xl shadow-sm border border-pl-border overflow-hidden">


        {/* HEADER */}

        <div
          className={`${
            compact ? "p-4" : "p-6"
          } border-b border-pl-border`}
        >

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h2
                className={`font-bold text-pl-text ${
                  compact
                    ? "text-lg"
                    : "text-xl"
                }`}
              >
                Premier League Standings
              </h2>

              {!compact && (
                <p className="text-sm text-pl-lavender mt-1">
                  2026/27 Season
                </p>
              )}

            </div>


            {/* TABS */}

            {allowTabs && (
              <div className="flex items-center gap-1 bg-pl-navy p-1 rounded-lg">

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("overall")
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    activeTab === "overall"
                      ? "bg-pl-navy text-pl-pink shadow-sm"
                      : "text-pl-lavender hover:text-pl-text"
                  }`}
                >
                  Overall
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("home")
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    activeTab === "home"
                      ? "bg-pl-navy text-pl-pink shadow-sm"
                      : "text-pl-lavender hover:text-pl-text"
                  }`}
                >
                  Home
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("away")
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    activeTab === "away"
                      ? "bg-pl-navy text-pl-pink shadow-sm"
                      : "text-pl-lavender hover:text-pl-text"
                  }`}
                >
                  Away
                </button>

              </div>
            )}

          </div>

        </div>


        {/* TABLE TYPE */}

        <div className="px-6 py-3 bg-pl-dark/40 border-b border-pl-border">

          <p className="text-xs font-semibold text-pl-lavender uppercase tracking-wide">

            {activeTab === "overall"
              ? "Overall Standings"
              : activeTab === "home"
              ? "Home Standings"
              : "Away Standings"}

          </p>

        </div>


        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px]">

            <thead>

              <tr className="bg-pl-dark/40 border-b border-pl-border">

                <th className="px-4 py-3 text-left text-xs font-semibold text-pl-lavender uppercase tracking-wide w-16">
                  #
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  Team
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  P
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  W
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  D
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  L
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  GF
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  GA
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  GD
                </th>

                <th className="px-3 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  Pts
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-pl-lavender uppercase tracking-wide">
                  Form
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-pl-border">

              {displayData.map((row) => (

                <tr
                  key={
                    row.teamId ||
                    row.teamName
                  }
                  className="hover:bg-pl-navy/60 transition-colors"
                >

                  {/* POSITION */}

                  <td className="px-4 py-4">

                    <span
                      className={`font-bold text-sm ${getPositionClass(
                        row.position
                      )}`}
                    >
                      {row.position}
                    </span>

                  </td>


                  {/* TEAM */}

                  <td className="px-4 py-4">

                    <Link
                      to={`/teams/${row.teamId}`}
                      className="flex items-center gap-3 group"
                    >

                      <div className="w-8 h-8 flex items-center justify-center shrink-0">

                        {row.logo ? (

                          <img
                            src={row.logo}
                            alt={row.teamName}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <div className="w-7 h-7 rounded-full bg-pl-navy flex items-center justify-center">

                            <span className="text-xs font-bold text-pl-lavender">
                              {row.teamName
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </span>

                          </div>

                        )}

                      </div>


                      <div className="min-w-0">

                        <p className="font-semibold text-pl-text group-hover:text-pl-pink transition-colors truncate">
                          {row.teamName}
                        </p>

                        {row.shortName &&
                          row.shortName !==
                            row.teamName && (

                            <p className="text-xs text-pl-muted">
                              {row.shortName}
                            </p>

                          )}

                      </div>

                    </Link>

                  </td>


                  {/* PLAYED */}

                  <td className="px-3 py-4 text-center text-sm text-slate-200">
                    {row.played}
                  </td>


                  {/* WON */}

                  <td className="px-3 py-4 text-center text-sm text-slate-200">
                    {row.won}
                  </td>


                  {/* DRAWN */}

                  <td className="px-3 py-4 text-center text-sm text-slate-200">
                    {row.drawn}
                  </td>


                  {/* LOST */}

                  <td className="px-3 py-4 text-center text-sm text-slate-200">
                    {row.lost}
                  </td>


                  {/* GF */}

                  <td className="px-3 py-4 text-center text-sm text-slate-200">
                    {row.goalsFor}
                  </td>


                  {/* GA */}

                  <td className="px-3 py-4 text-center text-sm text-slate-200">
                    {row.goalsAgainst}
                  </td>


                  {/* GD */}

                  <td className="px-3 py-4 text-center text-sm font-medium">

                    <span
                      className={
                        row.goalDifference > 0
                          ? "text-pl-pink"
                          : row.goalDifference < 0
                          ? "text-pl-magenta"
                          : "text-slate-300"
                      }
                    >

                      {row.goalDifference > 0
                        ? `+${row.goalDifference}`
                        : row.goalDifference}

                    </span>

                  </td>


                  {/* POINTS */}

                  <td className="px-3 py-4 text-center">

                    <span className="font-bold text-pl-text">
                      {row.points}
                    </span>

                  </td>


                  {/* FORM */}

                  <td className="px-4 py-4">

                    <FormIndicator
                      form={row.form}
                    />

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* EMPTY */}

        {displayData.length === 0 && (

          <div className="p-10 text-center">

            <p className="text-pl-lavender">
              No standings data available.
            </p>

          </div>

        )}


        {/* LEGEND */}

        {showLegend && (

          <div className="px-6 py-4 border-t border-pl-border bg-pl-dark/40">

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-pl-lavender">

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pl-pink" />
                <span>
                  Champions League
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pl-violet" />
                <span>
                  European Competition
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pl-magenta" />
                <span>
                  Relegation
                </span>
              </div>

              <div className="ml-auto">
                <span>
                  P = Played · W = Won · D = Drawn · L = Lost
                </span>
              </div>

            </div>

          </div>

        )}


        {/* VIEW FULL TABLE */}

        {limit &&
          standings.length > limit && (

            <div className="px-6 py-4 border-t border-pl-border">

              <Link
                to="/standings"
                className="inline-flex items-center gap-2 text-sm font-semibold text-pl-pink hover:text-pl-pinkLight"
              >
                View Full Standings
                <ChevronRight className="w-4 h-4" />
              </Link>

            </div>

          )}

      </div>

    </div>
  );
};

export default StandingsTable;