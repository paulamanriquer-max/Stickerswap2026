export interface Team {
  name: string;
  code: string;
  flag: string;
  owned: number;
  missing: number;
  duplicates: number;
  total: number;
}

// Panini FIFA World Cup 2026 official sticker album sections.
// Ordered to support page-by-page review against the printed album.
export const worldCupTeams: Team[] = [
  { name: "FWC", code: "FWC", flag: "🏆", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Mexico", code: "MEX", flag: "🇲🇽", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "South Africa", code: "RSA", flag: "🇿🇦", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Korea Republic", code: "KOR", flag: "🇰🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Czechia", code: "CZE", flag: "🇨🇿", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Canada", code: "CAN", flag: "🇨🇦", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Bosnia and Herzegovina", code: "BIH", flag: "🇧🇦", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Qatar", code: "QAT", flag: "🇶🇦", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Switzerland", code: "SUI", flag: "🇨🇭", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Brazil", code: "BRA", flag: "🇧🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Morocco", code: "MAR", flag: "🇲🇦", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Haiti", code: "HAI", flag: "🇭🇹", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Scotland", code: "SCO", flag: "🏴", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "United States", code: "USA", flag: "🇺🇸", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Paraguay", code: "PAR", flag: "🇵🇾", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Australia", code: "AUS", flag: "🇦🇺", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Turkey", code: "TUR", flag: "🇹🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Germany", code: "GER", flag: "🇩🇪", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Curaçao", code: "CUW", flag: "🇨🇼", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Côte d'Ivoire", code: "CIV", flag: "🇨🇮", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Ecuador", code: "ECU", flag: "🇪🇨", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Netherlands", code: "NED", flag: "🇳🇱", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Japan", code: "JPN", flag: "🇯🇵", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Sweden", code: "SWE", flag: "🇸🇪", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Tunisia", code: "TUN", flag: "🇹🇳", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Belgium", code: "BEL", flag: "🇧🇪", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Coca-Cola", code: "CC", flag: "🥤", owned: 0, missing: 14, duplicates: 0, total: 14 },
  { name: "Egypt", code: "EGY", flag: "🇪🇬", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Iran", code: "IRN", flag: "🇮🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "New Zealand", code: "NZL", flag: "🇳🇿", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Spain", code: "ESP", flag: "🇪🇸", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Cape Verde", code: "CPV", flag: "🇨🇻", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Uruguay", code: "URU", flag: "🇺🇾", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "France", code: "FRA", flag: "🇫🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Senegal", code: "SEN", flag: "🇸🇳", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Iraq", code: "IRQ", flag: "🇮🇶", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Norway", code: "NOR", flag: "🇳🇴", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Argentina", code: "ARG", flag: "🇦🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Algeria", code: "ALG", flag: "🇩🇿", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Austria", code: "AUT", flag: "🇦🇹", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Jordan", code: "JOR", flag: "🇯🇴", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Portugal", code: "POR", flag: "🇵🇹", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "DR Congo", code: "COD", flag: "🇨🇩", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Uzbekistan", code: "UZB", flag: "🇺🇿", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Colombia", code: "COL", flag: "🇨🇴", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "England", code: "ENG", flag: "🏴", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Croatia", code: "CRO", flag: "🇭🇷", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Ghana", code: "GHA", flag: "🇬🇭", owned: 0, missing: 20, duplicates: 0, total: 20 },
  { name: "Panama", code: "PAN", flag: "🇵🇦", owned: 0, missing: 20, duplicates: 0, total: 20 }
];

export const getTeamByCode = (code: string) => {
  return worldCupTeams.find(team => team.code === code) || {
    name: 'Unknown',
    code,
    flag: '🏳️',
    owned: 0,
    missing: 0,
    duplicates: 0,
    total: 0,
  };
};
