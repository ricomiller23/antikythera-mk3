import { VantageState } from '../vantage/vantageManager.ts';
import { PLANETS_DATA, PlanetMoonTheory } from '../data/planetsData.ts';

export interface LocalMoonPosition {
  id: string;
  name: string;
  altDeg: number;
  azDeg: number;
  isAboveHorizon: boolean;
  phaseAngleDeg: number;
  apparentDiameterArcmin: number;
  isTransitingSun: boolean;
}

export interface EarthInSkyView {
  altDeg: number;
  azDeg: number;
  isAboveHorizon: boolean;
  distanceAU: number;
  lightTimeMinutes: number;
  apparentMagnitude: number;
  phaseAngleDeg: number;
  separationFromMoonArcmin: number;
}

export interface PlanetSkyCircumstances {
  sunAltDeg: number;
  sunAzDeg: number;
  isSunAboveHorizon: boolean;
  sunApparentDiameterDeg: number;
  skyBackgroundHex: string;
  isCloudOpaque: boolean;
  localMeanSolarTimeHours: number;
  localSolarSolNumber: number;
  earthInSky: EarthInSkyView;
  moons: LocalMoonPosition[];
  activeEvents: string[];
}

export class PlanetSkyEngine {
  public static computeLocalSky(vantage: VantageState, jd: number): PlanetSkyCircumstances {
    const p = vantage.planet;
    const daysSinceEpoch = jd - 2451545.0; // J2000.0
    const lat = vantage.site.latitudeDeg;
    const lon = vantage.site.longitudeDeg;

    // 1. Local Planetary Rotation & Solar Hour
    const solarDayDays = Math.abs(p.solarDayHours) / 24.0;
    const totalLocalSols = daysSinceEpoch / solarDayDays;
    const solFrac = ((totalLocalSols % 1.0) + 1.0) % 1.0;
    const localHour = solFrac * 24.0;

    // Solar Elevation & Azimuth
    let sunAltDeg = 0;
    let sunAzDeg = 0;

    if (p.id === 'venus') {
      // Retrograde rotation: Sun moves East to West in coordinate space, rises in West
      const ha = (localHour / 24.0) * 360 - 180;
      sunAltDeg = Math.sin((lat * Math.PI) / 180) * 0.05 + Math.cos((ha * Math.PI) / 180) * 60.0;
      sunAzDeg = (180 - ha + 360) % 360;
    } else if (p.id === 'mercury') {
      // 3:2 Spin-Orbit resonance with perihelion loop
      const M = ((daysSinceEpoch % p.orbitalPeriodDays) / p.orbitalPeriodDays) * Math.PI * 2;
      const trueAnomaly = M + 2 * 0.2056 * Math.sin(M);
      const rotAngle = ((daysSinceEpoch / (p.siderealDayHours / 24)) * Math.PI * 2) % (Math.PI * 2);
      const diff = ((rotAngle - trueAnomaly + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      sunAltDeg = Math.cos(diff) * (90 - Math.abs(lat));
      sunAzDeg = (diff * 180 / Math.PI + 180 + 360) % 360;
    } else if (p.id === 'uranus') {
      // 97.8 deg extreme obliquity: spiral polar track
      const seasonFrac = ((daysSinceEpoch % (84.02 * 365.25)) / (84.02 * 365.25)) * Math.PI * 2;
      const subSolarLat = 97.77 * Math.sin(seasonFrac);
      sunAltDeg = 90 - Math.abs(lat - subSolarLat) + Math.cos((localHour / 24.0) * Math.PI * 2) * 15;
      sunAzDeg = (localHour * 15 + 360) % 360;
    } else {
      // Standard planetary diurnal arc (Mars, Earth, Jupiter, Saturn, Neptune, Pluto)
      const ha = (localHour / 24.0) * 360 - 180;
      const haRad = (ha * Math.PI) / 180;
      const latRad = (lat * Math.PI) / 180;
      const sinAlt = Math.cos(latRad) * Math.cos(haRad);
      sunAltDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * (180 / Math.PI);
      sunAzDeg = ((ha + 180) + 360) % 360;
    }

    const isSunAboveHorizon = sunAltDeg > 0;
    const activeEvents: string[] = [];

    // 2. Local Sky Color
    let skyBackgroundHex = p.skyColorHex;
    let isCloudOpaque = p.hasOpaqueClouds && !vantage.cloudPierce;

    if (p.id === 'earth') {
      skyBackgroundHex = sunAltDeg > 0 ? '#0c2444' : sunAltDeg > -6 ? '#181e36' : '#050811';
    } else if (p.id === 'mars') {
      if (sunAltDeg > 0) {
        skyBackgroundHex = vantage.opticalDepthDust > 1.5 ? '#9c6644' : '#c99a6b'; // Butterscotch
      } else if (sunAltDeg > -8) {
        skyBackgroundHex = '#1e3a8a'; // Blue sunset twilight!
      } else {
        skyBackgroundHex = '#050811';
      }
    } else if (p.id === 'venus') {
      skyBackgroundHex = isCloudOpaque ? '#d97706' : '#181e36';
    } else if (p.id === 'mercury') {
      skyBackgroundHex = '#000000'; // Airless vacuum
    } else if (p.id === 'pluto') {
      skyBackgroundHex = '#030712'; // Cryogenic deep dark
    }

    // 3. Moons
    const moons: LocalMoonPosition[] = [];
    for (const m of p.moons) {
      let mAlt = 0;
      let mAz = 0;
      let isAbove = false;
      let isTransiting = false;

      if (p.id === 'mars' && m.id === 'phobos') {
        // Phobos: rises in West (orbital speed faster than Mars rotation)
        const phobosCycle = (daysSinceEpoch / m.orbitalPeriodDays) * Math.PI * 2;
        const relativeHa = (phobosCycle - ((localHour / 24) * Math.PI * 2)) % (Math.PI * 2);
        mAlt = Math.sin(relativeHa) * 65.0;
        mAz = 270 - (relativeHa * 180 / Math.PI); // Rising in west
        isAbove = mAlt > 0;

        // Check solar transit
        if (isSunAboveHorizon && isAbove && Math.abs(mAlt - sunAltDeg) < 1.2 && Math.abs((mAz - sunAzDeg + 360) % 360) < 1.2) {
          isTransiting = true;
          activeEvents.push('PHOBOS_SOLAR_TRANSIT');
        }
      } else if (p.id === 'mars' && m.id === 'deimos') {
        // Deimos: slow eastward progression
        const deimosCycle = (daysSinceEpoch / m.orbitalPeriodDays) * Math.PI * 2;
        const relativeHa = (((localHour / 24) * Math.PI * 2) - deimosCycle) % (Math.PI * 2);
        mAlt = Math.sin(relativeHa) * 55.0;
        mAz = (90 + (relativeHa * 180 / Math.PI)) % 360;
        isAbove = mAlt > 0;
      } else if (p.id === 'pluto' && m.id === 'charon') {
        // Charon: mutually tidally locked at Sputnik Planitia (19.5 N, 175.8 E)
        const distFromSubCharonDeg = Math.hypot(lat - 19.5, ((lon - 175.8 + 540) % 360) - 180);
        if (distFromSubCharonDeg < 90) {
          mAlt = 90 - distFromSubCharonDeg;
          mAz = 180;
          isAbove = true;
        } else {
          mAlt = -45;
          mAz = 0;
          isAbove = false; // Never visible on far side
        }
      } else {
        // General satellite Kepler motion (Io, Europa, Titan, Triton)
        const orbCycle = (daysSinceEpoch / m.orbitalPeriodDays) * Math.PI * 2;
        mAlt = Math.sin(orbCycle) * 50;
        mAz = (orbCycle * 180 / Math.PI) % 360;
        isAbove = mAlt > 0;
        if (p.id === 'jupiter' && isSunAboveHorizon && isAbove && Math.abs(mAlt - sunAltDeg) < 0.5) {
          isTransiting = true;
          activeEvents.push(`${m.name.toUpperCase()}_JOVIAN_SHADOW_TRANSIT`);
        }
      }

      moons.push({
        id: m.id,
        name: m.name,
        altDeg: mAlt,
        azDeg: (mAz + 360) % 360,
        isAboveHorizon: isAbove,
        phaseAngleDeg: Math.abs((mAz - sunAzDeg + 540) % 360 - 180),
        apparentDiameterArcmin: (m.radiusKm / m.semiMajorAxisKm) * (180 / Math.PI) * 60,
        isTransitingSun: isTransiting
      });
    }

    // 4. "Find Earth" in Local Sky
    const earthDistAU = Math.abs(p.semiMajorAxisAU - 1.0) + 0.3 * Math.sin(daysSinceEpoch / 100);
    const lightTimeMinutes = (earthDistAU * 149597870.7) / (299792.458 * 60);
    const earthPhaseAngle = ((daysSinceEpoch / (p.orbitalPeriodDays * 1.5)) * 360) % 360;
    const earthAltDeg = Math.max(-30, Math.sin((localHour / 24.0) * Math.PI * 2 + 1.2) * 55.0);
    const earthAzDeg = (localHour * 14 + 45) % 360;

    const earthInSky: EarthInSkyView = {
      altDeg: earthAltDeg,
      azDeg: earthAzDeg,
      isAboveHorizon: earthAltDeg > 0,
      distanceAU: earthDistAU,
      lightTimeMinutes: Math.round(lightTimeMinutes * 10) / 10,
      apparentMagnitude: -2.5 + 5 * Math.log10(earthDistAU),
      phaseAngleDeg: earthPhaseAngle,
      separationFromMoonArcmin: 15.0 / earthDistAU
    };

    return {
      sunAltDeg,
      sunAzDeg,
      isSunAboveHorizon,
      sunApparentDiameterDeg: p.solarAngularDiameterDeg,
      skyBackgroundHex,
      isCloudOpaque,
      localMeanSolarTimeHours: localHour,
      localSolarSolNumber: Math.floor(totalLocalSols),
      earthInSky,
      moons,
      activeEvents
    };
  }
}
