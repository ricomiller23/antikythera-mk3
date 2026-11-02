import { computeMeeusSolar } from './meeusSolar.ts';

export interface PlanetEphemeris {
  name: string;
  greekName: string;
  symbol: string;
  trueLongitudeDeg: number;
  mechanismLongitudeDeg: number;
  errorDeg: number;
  isRetrograde: boolean;
  synodicPhaseName: string;
  nextStationDays: number;
  colorHex: string;
}

interface OrbitalElements {
  a: number; // Semi-major axis (AU)
  e0: number; e_rate: number; // Eccentricity
  I0: number; I_rate: number; // Inclination (deg)
  L0: number; L_rate: number; // Mean longitude (deg)
  w0: number; w_rate: number; // Longitude of perihelion (deg)
  node0: number; node_rate: number; // Longitude of ascending node (deg)
}

// Standish / JPL mean orbital elements relative to J2000.0 (T in Julian centuries)
const PLANET_ELEMENTS: Record<string, OrbitalElements> = {
  mercury: {
    a: 0.38709893,
    e0: 0.20563069, e_rate: 0.00002527,
    I0: 7.00487,    I_rate: -0.005947,
    L0: 252.25084,  L_rate: 149472.67411,
    w0: 77.45645,   w_rate: 0.160476,
    node0: 48.33167, node_rate: -0.125341
  },
  venus: {
    a: 0.72333199,
    e0: 0.00677323, e_rate: -0.00004938,
    I0: 3.39471,    I_rate: -0.0007889,
    L0: 181.97973,  L_rate: 58517.81538,
    w0: 131.57294,  w_rate: 0.002683,
    node0: 76.68069, node_rate: -0.277694
  },
  mars: {
    a: 1.52366231,
    e0: 0.09341233, e_rate: 0.00009206,
    I0: 1.85061,    I_rate: -0.000675,
    L0: 355.45332,  L_rate: 19140.30268,
    w0: 336.04084,  w_rate: 0.444411,
    node0: 49.57854, node_rate: -0.295273
  },
  jupiter: {
    a: 5.20336301,
    e0: 0.04839266, e_rate: -0.00012880,
    I0: 1.30530,    I_rate: -0.004150,
    L0: 34.40438,   L_rate: 3034.74612,
    w0: 14.75385,   w_rate: 0.212527,
    node0: 100.55615, node_rate: 0.205284
  },
  saturn: {
    a: 9.53707032,
    e0: 0.05415060, e_rate: -0.00036762,
    I0: 2.48446,    I_rate: 0.006114,
    L0: 49.94424,   L_rate: 1222.49362,
    w0: 92.43194,   w_rate: -0.418972,
    node0: 113.71504, node_rate: -0.288678
  }
};

const PLANET_METADATA: Record<string, { greek: string; symbol: string; color: string }> = {
  mercury: { greek: 'Ἑρμῆς (Hermes / Stilbon)', symbol: '☿', color: '#14b8a6' },
  venus:   { greek: 'Ἀφροδίτη (Aphrodite / Phosphoros)', symbol: '♀', color: '#f43f5e' },
  mars:    { greek: 'Ἄρης (Ares / Pyroeis)', symbol: '♂', color: '#dc2626' },
  jupiter: { greek: 'Ζεύς (Zeus / Phaethon)', symbol: '♃', color: '#d97706' },
  saturn:  { greek: 'Κρόνος (Kronos / Phainon)', symbol: '♄', color: '#8b5cf6' }
};

function computeHeliocentricCoordinates(planetKey: string, jdn: number): { x: number; y: number; z: number } {
  const T = (jdn - 2451545.0) / 36525.0;
  const p = PLANET_ELEMENTS[planetKey];

  const a = p.a;
  const e = p.e0 + p.e_rate * T;
  const I = (p.I0 + p.I_rate * T) * Math.PI / 180;
  const L = ((p.L0 + p.L_rate * T) % 360 + 360) % 360;
  const w = ((p.w0 + p.w_rate * T) % 360 + 360) % 360;
  const node = ((p.node0 + p.node_rate * T) % 360 + 360) % 360 * Math.PI / 180;

  let M = (L - w) % 360;
  if (M < 0) M += 360;
  const Mrad = M * Math.PI / 180;

  // Kepler equation solver
  let E = Mrad;
  for (let i = 0; i < 5; i++) {
    E = E - (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
  }

  // Heliocentric coordinates in orbital plane
  const xOrb = a * (Math.cos(E) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate to ecliptic coordinates
  const omega = (w - (p.node0 + p.node_rate * T)) * Math.PI / 180;
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosI = Math.cos(I);

  const x = (cosNode * cosOmega - sinNode * sinOmega * cosI) * xOrb + (-cosNode * sinOmega - sinNode * cosOmega * cosI) * yOrb;
  const y = (sinNode * cosOmega + cosNode * sinOmega * cosI) * xOrb + (-sinNode * sinOmega + cosNode * cosOmega * cosI) * yOrb;
  const z = (Math.sin(I) * sinOmega) * xOrb + (Math.sin(I) * cosOmega) * yOrb;

  return { x, y, z };
}

export function computeGeocentricLongitude(planetKey: string, jdn: number): number {
  const pHelio = computeHeliocentricCoordinates(planetKey, jdn);
  
  // Earth coordinates
  const solar = computeMeeusSolar(jdn);
  const R = solar.radiusVectorAU;
  const sunLongRad = solar.trueLongitudeDeg * Math.PI / 180;
  // Earth heliocentric = Sun + 180°
  const xEarth = -R * Math.cos(sunLongRad);
  const yEarth = -R * Math.sin(sunLongRad);

  const dx = pHelio.x - xEarth;
  const dy = pHelio.y - yEarth;

  let lambdaRad = Math.atan2(dy, dx);
  let lambdaDeg = lambdaRad * 180 / Math.PI;
  return ((lambdaDeg % 360) + 360) % 360;
}

export function computeAllPlanetsEphemeris(
  jdn: number,
  mechanismLongitudes: Record<string, number> = {}
): Record<string, PlanetEphemeris> {
  const result: Record<string, PlanetEphemeris> = {};
  const deltaDays = 0.5;

  const planetKeys = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  for (const key of planetKeys) {
    const trueLong = computeGeocentricLongitude(key, jdn);
    const prevLong = computeGeocentricLongitude(key, jdn - deltaDays);
    const nextLong = computeGeocentricLongitude(key, jdn + deltaDays);

    // Rate of elongation change
    let dLong1 = (trueLong - prevLong + 540) % 360 - 180;
    let dLong2 = (nextLong - trueLong + 540) % 360 - 180;
    const isRetrograde = dLong1 < 0 || dLong2 < 0;

    const mechLong = mechanismLongitudes[key] !== undefined ? mechanismLongitudes[key] : trueLong;
    let errorDeg = (mechLong - trueLong + 540) % 360 - 180;

    // Synodic phase
    const solar = computeMeeusSolar(jdn);
    const elongation = ((trueLong - solar.trueLongitudeDeg + 540) % 360) - 180;
    let phaseName = 'Direct Motion';

    if (key === 'mercury' || key === 'venus') {
      if (Math.abs(elongation) < 5.0) {
        phaseName = dLong1 < 0 ? 'Inferior Conjunction (Retrograde)' : 'Superior Conjunction (Direct)';
      } else if (elongation > 0) {
        phaseName = 'Evening Star (Hesperos) — Greatest Elongation';
      } else {
        phaseName = 'Morning Star (Phosphoros / Eosphoros)';
      }
    } else {
      if (Math.abs(elongation) > 170.0) {
        phaseName = 'Opposition (Ἀκρόνυχος — Retrograde loop peak)';
      } else if (Math.abs(elongation) < 15.0) {
        phaseName = 'Conjunction with Sun (Invisible)';
      } else if (Math.abs(Math.abs(elongation) - 90.0) < 10.0) {
        phaseName = 'Quadrature (Τετραγωνισμός)';
      }
    }

    const meta = PLANET_METADATA[key];

    result[key] = {
      name: key.toUpperCase(),
      greekName: meta.greek,
      symbol: meta.symbol,
      trueLongitudeDeg: trueLong,
      mechanismLongitudeDeg: mechLong,
      errorDeg: Math.round(errorDeg * 100) / 100,
      isRetrograde,
      synodicPhaseName: phaseName,
      nextStationDays: isRetrograde ? 12 : 45, // Approximation for UI badge
      colorHex: meta.color
    };
  }

  return result;
}
