import { computeAllPlanetsEphemeris, PlanetEphemeris } from './meeusPlanets.ts';

export interface EphemerisResult {
  name: string;
  longitudeDeg: number;
  latitudeDeg: number;
  distanceAU: number;
  isRetrograde: boolean;
  greekName?: string;
  phaseName?: string;
}

export function calculateEphemeris(planet: string, T: number): EphemerisResult {
  const jd = 2451545.0 + T * 36525.0;
  const pMap = computeAllPlanetsEphemeris(jd);
  const p = pMap[planet.toLowerCase()];

  if (p) {
    return {
      name: p.name,
      longitudeDeg: p.trueLongitudeDeg,
      latitudeDeg: 0,
      distanceAU: 1.0,
      isRetrograde: p.isRetrograde,
      greekName: p.greekName,
      phaseName: p.synodicPhaseName
    };
  }

  return {
    name: planet.toUpperCase(),
    longitudeDeg: 0,
    latitudeDeg: 0,
    distanceAU: 1.0,
    isRetrograde: false
  };
}
