export const MARKET_NAME = 'Kansas City Metro';
export const PUBLIC_MARKET_ROOM_NAME = `${MARKET_NAME} Community`;
export const MARKET_RADIUS_KM = 80;

const METRO_LOCATIONS = [
  { name: 'Kansas City', latitude: 39.0997, longitude: -94.5786 },
  { name: 'Overland Park', latitude: 38.9822, longitude: -94.6708 },
  { name: 'North Kansas City', latitude: 39.1429, longitude: -94.5730 },
  { name: 'Independence', latitude: 39.0911, longitude: -94.4155 },
];

export const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isInKansasCityMetro = (latitude: number | null | undefined, longitude: number | null | undefined) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  return distanceKm(latitude, longitude, METRO_LOCATIONS[0].latitude, METRO_LOCATIONS[0].longitude) <= MARKET_RADIUS_KM;
};

export const formatMetroLocation = (latitude: number | null | undefined, longitude: number | null | undefined) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return MARKET_NAME;
  if (!isInKansasCityMetro(latitude, longitude)) return `Outside ${MARKET_NAME}`;

  const closest = METRO_LOCATIONS
    .map(location => ({
      ...location,
      distance: distanceKm(latitude, longitude, location.latitude, location.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return closest.distance <= 10 ? closest.name : MARKET_NAME;
};
