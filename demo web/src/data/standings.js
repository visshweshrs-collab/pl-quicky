import { teams } from './teams';

// Generate clean standings directly connected to teams
export const standings = teams.map((team, index) => {
  const homeWins = Math.round(team.won * 0.58);
  const homeDraws = Math.round(team.drawn * 0.5);
  const homeLosses = Math.round(team.lost * 0.38);
  const homePlayed = homeWins + homeDraws + homeLosses;
  const awayPlayed = team.played - homePlayed;
  const awayWins = team.won - homeWins;
  const awayDraws = team.drawn - homeDraws;
  const awayLosses = team.lost - homeLosses;

  // Qualification status
  let qualification = null;
  if (team.position <= 4) {
    qualification = 'Champions League';
  } else if (team.position === 5) {
    qualification = 'Europa League';
  } else if (team.position >= 18) {
    qualification = 'Relegation';
  }

  return {
    position: team.position,
    teamId: team.id,
    teamName: team.name,
    shortName: team.shortName,
    logo: team.logo,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalDifference: team.goalDifference,
    points: team.points,
    form: team.form,
    qualification,
    home: {
      played: homePlayed,
      won: homeWins,
      drawn: homeDraws,
      lost: homeLosses,
      points: homeWins * 3 + homeDraws
    },
    away: {
      played: awayPlayed,
      won: awayWins,
      drawn: awayDraws,
      lost: awayLosses,
      points: awayWins * 3 + awayDraws
    }
  };
});

export const getTop5Standings = () => standings.slice(0, 5);
