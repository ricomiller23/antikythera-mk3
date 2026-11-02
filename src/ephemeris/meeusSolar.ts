/**
 * Analytical Solar Ephemeris Engine (Jean Meeus, Astronomical Algorithms 2nd Ed.)
 * Computes geometric mean and true apparent ecliptic longitude of the Sun
 */

export interface SolarEphemeris {
  meanLongitudeDeg: number;
  meanAnomalyDeg: number;
  equationOfCenterDeg: number;
  trueLongitudeDeg: number;
  apparentLongitudeDeg: number;
  radiusVectorAU: number;
}

export function computeMeeusSolar(jdn: number): SolarEphemeris {
  // Centuries from J2000.0 (JD 2451545.0)
  const T = (jdn - 2451545.0) / 36525.0;

  // Geometric mean longitude of the Sun (Meeus eq 25.2)
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = ((L0 % 360) + 360) % 360;

  // Sun mean anomaly (Meeus eq 25.3)
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = ((M % 360) + 360) % 360;
  const Mrad = (M * Math.PI) / 180;

  // Sun's Equation of Center C (Meeus eq 25.4)
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // Sun true longitude
  let sunTrueLong = L0 + C;
  sunTrueLong = ((sunTrueLong % 360) + 360) % 360;

  // Apparent longitude (corrected for aberration and nutation)
  const omega = 125.04 - 1934.136 * T;
  const omegaRad = (omega * Math.PI) / 180;
  const sunApparentLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(omegaRad);

  // Radius vector (Earth-Sun distance in AU)
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const nu = (M + C) * Math.PI / 180;
  const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(nu));

  return {
    meanLongitudeDeg: L0,
    meanAnomalyDeg: M,
    equationOfCenterDeg: C,
    trueLongitudeDeg: sunTrueLong,
    apparentLongitudeDeg: ((sunApparentLong % 360) + 360) % 360,
    radiusVectorAU: R
  };
}
