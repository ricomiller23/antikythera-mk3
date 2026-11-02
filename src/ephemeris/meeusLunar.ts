/**
 * Analytical Lunar Ephemeris Engine (Jean Meeus, Astronomical Algorithms 2nd Ed., Chapter 47)
 * Computes apparent lunar longitude, first anomaly, phase, illuminated fraction, and age.
 */

export interface LunarEphemeris {
  meanLongitudeDeg: number;
  trueLongitudeDeg: number;
  anomalyDeg: number;
  elongationDeg: number;
  phaseAngleDeg: number;
  illuminatedFraction: number; // 0.0 = New Moon, 1.0 = Full Moon
  phaseName: string;
  ageDays: number;
  nextNewMoonDays: number;
  nextFullMoonDays: number;
}

export function computeMeeusLunar(jdn: number): LunarEphemeris {
  const T = (jdn - 2451545.0) / 36525.0;

  // Moon's mean longitude (Meeus eq 47.1)
  let Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + (T * T * T) / 538841.0;
  Lp = ((Lp % 360) + 360) % 360;

  // Moon's mean elongation (Meeus eq 47.2)
  let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + (T * T * T) / 545868.0;
  D = ((D % 360) + 360) % 360;
  const Drad = (D * Math.PI) / 180;

  // Sun's mean anomaly
  let M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  M = ((M % 360) + 360) % 360;
  const Mrad = (M * Math.PI) / 180;

  // Moon's mean anomaly (Meeus eq 47.4)
  let Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + (T * T * T) / 69699.0;
  Mp = ((Mp % 360) + 360) % 360;
  const Mprad = (Mp * Math.PI) / 180;

  // Moon's argument of latitude (Meeus eq 47.5)
  let F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - (T * T * T) / 3526000.0;
  F = ((F % 360) + 360) % 360;
  const Frad = (F * Math.PI) / 180;

  // Major periodic terms in lunar longitude (Table 47.A truncated to primary terms):
  // 1. Equation of Center: 6.288774 * sin(Mp)
  // 2. Evection: 1.274027 * sin(2D - Mp)
  // 3. Variation: 0.658314 * sin(2D)
  // 4. Yearly perturbation: -0.185116 * sin(M)
  // 5. Reduction to ecliptic: -0.114332 * sin(2F)
  const lPerturbations =
    6.288774 * Math.sin(Mprad) +
    1.274027 * Math.sin(2 * Drad - Mprad) +
    0.658314 * Math.sin(2 * Drad) +
    0.213618 * Math.sin(2 * Mprad) -
    0.185116 * Math.sin(Mrad) -
    0.114332 * Math.sin(2 * Frad) +
    0.058793 * Math.sin(2 * Drad - 2 * Mprad) +
    0.057066 * Math.sin(2 * Drad - Mrad - Mprad);

  let trueLong = Lp + lPerturbations;
  trueLong = ((trueLong % 360) + 360) % 360;

  // Phase angle & illuminated fraction k
  // Phase angle i ≈ 180 - D
  const phaseAngleDeg = ((180 - D) % 360 + 360) % 360;
  const illuminatedFraction = (1 + Math.cos(Drad)) / 2;

  // Moon age in days (synodic cycle 29.5305888 days)
  const synodicPeriod = 29.5305888;
  const ageDays = (D / 360) * synodicPeriod;

  let phaseName = 'New Moon';
  if (ageDays < 1.5) phaseName = 'New Moon (Νουμηνία)';
  else if (ageDays < 6.5) phaseName = 'Waxing Crescent';
  else if (ageDays < 8.5) phaseName = 'First Quarter (Διχοτόμος)';
  else if (ageDays < 13.5) phaseName = 'Waxing Gibbous';
  else if (ageDays < 16.0) phaseName = 'Full Moon (Πανσέληνος)';
  else if (ageDays < 21.0) phaseName = 'Waning Gibbous';
  else if (ageDays < 23.5) phaseName = 'Last Quarter (Διχοτόμος)';
  else if (ageDays < 28.0) phaseName = 'Waning Crescent';
  else phaseName = 'New Moon (Νουμηνία)';

  const nextNewMoonDays = (synodicPeriod - ageDays) % synodicPeriod;
  const nextFullMoonDays = ageDays < 14.765 ? (14.765 - ageDays) : (synodicPeriod + 14.765 - ageDays);

  return {
    meanLongitudeDeg: Lp,
    trueLongitudeDeg: trueLong,
    anomalyDeg: Mp,
    elongationDeg: D,
    phaseAngleDeg,
    illuminatedFraction,
    phaseName,
    ageDays,
    nextNewMoonDays,
    nextFullMoonDays
  };
}
