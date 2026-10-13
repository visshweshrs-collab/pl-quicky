// ==========================================
// PREMIER LEAGUE 2026/27 TEAMS
// ==========================================

// Existing club crest SVGs
import arsenalLogo from '../assets/teams/arsenal.svg';
import astonVillaLogo from '../assets/teams/aston-villa.svg';
import bournemouthLogo from '../assets/teams/bournemouth.svg';
import brentfordLogo from '../assets/teams/brentford.svg';
import brightonLogo from '../assets/teams/brighton.svg';
import chelseaLogo from '../assets/teams/chelsea.svg';
import crystalPalaceLogo from '../assets/teams/crystal-palace.svg';
import evertonLogo from '../assets/teams/everton.svg';
import fulhamLogo from '../assets/teams/fulham.svg';
import leedsLogo from '../assets/teams/leeds.svg';
import liverpoolLogo from '../assets/teams/liverpool.svg';
import manCityLogo from '../assets/teams/man-city.svg';
import manUnitedLogo from '../assets/teams/man-united.svg';
import newcastleLogo from '../assets/teams/newcastle.svg';
import nottinghamForestLogo from '../assets/teams/nottingham-forest.svg';
import sunderlandLogo from '../assets/teams/sunderland.svg';
import tottenhamLogo from '../assets/teams/tottenham.svg';

// Official crest URLs for the newly promoted clubs.
const coventryLogo = 'https://footballdata.io/img/team/coventry-city-fc.png';
const hullLogo = 'https://footballdata.io/img/team/hull-city-afc.png';
const ipswichLogo = 'https://footballdata.io/img/team/ipswich-town-fc.png';


// ==========================================
// TEAM DATA
// ==========================================

export const teams = [
  {
    id: 'arsenal',
    apiId: 57,
    name: 'Arsenal',
    shortName: 'ARS',
    logo: arsenalLogo,
    primaryColor: '#EF0107',
    secondaryColor: '#023474',
    stadium: 'Emirates Stadium',
    capacity: 60704,
    city: 'London',
    founded: 1886,
    manager: 'Mikel Arteta'
  },

  {
    id: 'man-city',
    apiId: 87,
    name: 'Manchester City',
    shortName: 'MCI',
    logo: manCityLogo,
    primaryColor: '#6CABDD',
    secondaryColor: '#1C2C5B',
    stadium: 'Etihad Stadium',
    capacity: 53400,
    city: 'Manchester',
    founded: 1880,
    manager: 'Pep Guardiola'
  },

  {
    id: 'liverpool',
    apiId: 135,
    name: 'Liverpool',
    shortName: 'LIV',
    logo: liverpoolLogo,
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    stadium: 'Anfield',
    capacity: 61276,
    city: 'Liverpool',
    founded: 1892,
    manager: 'Arne Slot'
  },

  {
    id: 'chelsea',
    apiId: 136,
    name: 'Chelsea',
    shortName: 'CHE',
    logo: chelseaLogo,
    primaryColor: '#034694',
    secondaryColor: '#DBA111',
    stadium: 'Stamford Bridge',
    capacity: 40341,
    city: 'London',
    founded: 1905,
    manager: 'Enzo Maresca'
  },

  {
    id: 'aston-villa',
    apiId: 142,
    name: 'Aston Villa',
    shortName: 'AVL',
    logo: astonVillaLogo,
    primaryColor: '#670E36',
    secondaryColor: '#95BFE5',
    stadium: 'Villa Park',
    capacity: 42785,
    city: 'Birmingham',
    founded: 1874,
    manager: 'Unai Emery'
  },

  {
    id: 'newcastle',
    apiId: 141,
    name: 'Newcastle United',
    shortName: 'NEW',
    logo: newcastleLogo,
    primaryColor: '#241F20',
    secondaryColor: '#41B6E6',
    stadium: "St James' Park",
    capacity: 52305,
    city: 'Newcastle',
    founded: 1892,
    manager: 'Eddie Howe'
  },

  {
    id: 'tottenham',
    apiId: 86,
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    logo: tottenhamLogo,
    primaryColor: '#132257',
    secondaryColor: '#FFFFFF',
    stadium: 'Tottenham Hotspur Stadium',
    capacity: 62850,
    city: 'London',
    founded: 1882,
    manager: 'Ange Postecoglou'
  },

  {
    id: 'brighton',
    apiId: 180,
    name: 'Brighton & Hove Albion',
    shortName: 'BHA',
    logo: brightonLogo,
    primaryColor: '#0057B8',
    secondaryColor: '#FFCD00',
    stadium: 'Amex Stadium',
    capacity: 31800,
    city: 'Brighton',
    founded: 1901,
    manager: 'Fabian Hürzeler'
  },

  {
    id: 'nottingham-forest',
    apiId: 182,
    name: 'Nottingham Forest',
    shortName: 'NFO',
    logo: nottinghamForestLogo,
    primaryColor: '#DD0000',
    secondaryColor: '#FFFFFF',
    stadium: 'The City Ground',
    capacity: 30445,
    city: 'Nottingham',
    founded: 1865,
    manager: 'Nuno Espírito Santo'
  },

  {
    id: 'bournemouth',
    apiId: 132,
    name: 'AFC Bournemouth',
    shortName: 'BOU',
    logo: bournemouthLogo,
    primaryColor: '#DA291C',
    secondaryColor: '#000000',
    stadium: 'Vitality Stadium',
    capacity: 11307,
    city: 'Bournemouth',
    founded: 1899,
    manager: 'Andoni Iraola'
  },

  {
    id: 'fulham',
    apiId: 146,
    name: 'Fulham',
    shortName: 'FUL',
    logo: fulhamLogo,
    primaryColor: '#FFFFFF',
    secondaryColor: '#CC0000',
    stadium: 'Craven Cottage',
    capacity: 29600,
    city: 'London',
    founded: 1879,
    manager: 'Marco Silva'
  },

  {
    id: 'brentford',
    apiId: 189,
    name: 'Brentford',
    shortName: 'BRE',
    logo: brentfordLogo,
    primaryColor: '#E30613',
    secondaryColor: '#FDB913',
    stadium: 'Gtech Community Stadium',
    capacity: 17250,
    city: 'London',
    founded: 1889,
    manager: 'Thomas Frank'
  },

  {
    id: 'man-united',
    apiId: 133,
    name: 'Manchester United',
    shortName: 'MUN',
    logo: manUnitedLogo,
    primaryColor: '#DA291C',
    secondaryColor: '#FBE122',
    stadium: 'Old Trafford',
    capacity: 74310,
    city: 'Manchester',
    founded: 1878,
    manager: 'Rúben Amorim'
  },

  {
    id: 'crystal-palace',
    apiId: 127,
    name: 'Crystal Palace',
    shortName: 'CRY',
    logo: crystalPalaceLogo,
    primaryColor: '#1B458F',
    secondaryColor: '#C4122E',
    stadium: 'Selhurst Park',
    capacity: 25486,
    city: 'London',
    founded: 1905,
    manager: 'Oliver Glasner'
  },

  {
    id: 'everton',
    apiId: 128,
    name: 'Everton',
    shortName: 'EVE',
    logo: evertonLogo,
    primaryColor: '#003399',
    secondaryColor: '#FFFFFF',
    stadium: 'Hill Dickinson Stadium',
    capacity: 52888,
    city: 'Liverpool',
    founded: 1878,
    manager: 'Sean Dyche'
  },

  {
    id: 'leeds',
    apiId: 193,
    name: 'Leeds United',
    shortName: 'LEE',
    logo: leedsLogo,
    primaryColor: '#1D428A',
    secondaryColor: '#FFCD00',
    stadium: 'Elland Road',
    capacity: 37608,
    city: 'Leeds',
    founded: 1919,
    manager: 'Daniel Farke'
  },

  {
    id: 'sunderland',
    apiId: 140,
    name: 'Sunderland',
    shortName: 'SUN',
    logo: sunderlandLogo,
    primaryColor: '#EB172B',
    secondaryColor: '#000000',
    stadium: 'Stadium of Light',
    capacity: 49000,
    city: 'Sunderland',
    founded: 1879,
    manager: 'Régis Le Bris'
  },

  // ==========================================
  // PROMOTED CLUBS
  // ==========================================

  {
    id: 'coventry',
    apiId: 209,
    name: 'Coventry City',
    shortName: 'COV',
    logo: coventryLogo,
    primaryColor: '#67B2E8',
    secondaryColor: '#FFFFFF',
    stadium: 'Coventry Building Society Arena',
    capacity: 32609,
    city: 'Coventry',
    founded: 1883,
    manager: ''
  },

  {
    id: 'hull',
    apiId: 134,
    name: 'Hull City',
    shortName: 'HUL',
    logo: hullLogo,
    primaryColor: '#F5A800',
    secondaryColor: '#000000',
    stadium: 'MKM Stadium',
    capacity: 25586,
    city: 'Hull',
    founded: 1904,
    manager: ''
  },

  {
    id: 'ipswich',
    apiId: 191,
    name: 'Ipswich Town',
    shortName: 'IPS',
    logo: ipswichLogo,
    primaryColor: '#0044A8',
    secondaryColor: '#FFFFFF',
    stadium: 'Portman Road',
    capacity: 30311,
    city: 'Ipswich',
    founded: 1878,
    manager: ''
  }
];


// ==========================================
// GET TEAM BY LOCAL ID
// ==========================================

export const getTeamById = (id) => {
  return teams.find(
    (team) => team.id === id
  ) || null;
};


// ==========================================
// GET TEAM BY API ID
// ==========================================

export const getTeamByApiId = (apiId) => {
  return teams.find(
    (team) => team.apiId === Number(apiId)
  ) || null;
};


// ==========================================
// GET TEAM BY NAME
// ==========================================

export const getTeamByName = (name) => {
  if (!name) {
    return null;
  }

  const normalizedName = name
    .toLowerCase()
    .trim();

  return teams.find(
    (team) =>
      team.name.toLowerCase() === normalizedName
  ) || null;
};