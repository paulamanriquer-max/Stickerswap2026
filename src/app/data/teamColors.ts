// Team brand colors for personalized UI
export interface TeamColors {
  primary: string;
  secondary: string;
  gradient: string;
}

export const teamColors: Record<string, TeamColors> = {
  BRA: {
    primary: '#FFDF00',
    secondary: '#009739',
    gradient: 'linear-gradient(135deg, #009739 0%, #006B28 100%)',
  },
  ARG: {
    primary: '#75AADB',
    secondary: '#3B7BA7',
    gradient: 'linear-gradient(135deg, #75AADB 0%, #1a4d6d 100%)',
  },
  POR: {
    primary: '#FF0000',
    secondary: '#006600',
    gradient: 'linear-gradient(135deg, #8B0000 0%, #004400 100%)',
  },
  FRA: {
    primary: '#0055A4',
    secondary: '#EF4135',
    gradient: 'linear-gradient(135deg, #0055A4 0%, #003366 100%)',
  },
  ENG: {
    primary: '#CE1124',
    secondary: '#8B0A14',
    gradient: 'linear-gradient(135deg, #CE1124 0%, #5a0610 100%)',
  },
  ESP: {
    primary: '#C60B1E',
    secondary: '#8B0814',
    gradient: 'linear-gradient(135deg, #C60B1E 0%, #5a0610 100%)',
  },
  GER: {
    primary: '#DD0000',
    secondary: '#000000',
    gradient: 'linear-gradient(135deg, #DD0000 0%, #8B0000 50%, #1a1a1a 100%)',
  },
  USA: {
    primary: '#B22234',
    secondary: '#3C3B6E',
    gradient: 'linear-gradient(135deg, #3C3B6E 0%, #1e1d37 100%)',
  },
  MEX: {
    primary: '#006847',
    secondary: '#CE1126',
    gradient: 'linear-gradient(135deg, #006847 0%, #003d29 100%)',
  },
  CAN: {
    primary: '#FF0000',
    secondary: '#8B0000',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #5a0000 100%)',
  },
  COL: {
    primary: '#FCD116',
    secondary: '#003893',
    gradient: 'linear-gradient(135deg, #003893 0%, #CE1126 50%, #8B0814 100%)',
  },
  NED: {
    primary: '#FF4F00',
    secondary: '#8B2A00',
    gradient: 'linear-gradient(135deg, #FF4F00 0%, #5a1c00 100%)',
  },
  BEL: {
    primary: '#EF3340',
    secondary: '#000000',
    gradient: 'linear-gradient(135deg, #EF3340 0%, #8B0814 50%, #1a1a1a 100%)',
  },
  URU: {
    primary: '#0038A8',
    secondary: '#001f5c',
    gradient: 'linear-gradient(135deg, #0038A8 0%, #001133 100%)',
  },
  ITA: {
    primary: '#0066CC',
    secondary: '#003d7a',
    gradient: 'linear-gradient(135deg, #0066CC 0%, #002447 100%)',
  },
};

export const getTeamColors = (teamCode: string): TeamColors => {
  return teamColors[teamCode] || {
    primary: '#3b82f6',
    secondary: '#6366f1',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  };
};
