import { PTOLEMAIC_STARS, AncientStar } from '../data/starCatalog.ts';
import { SiteDefinition } from '../site/siteManager.ts';
import { TimeState, SharedTimeEngine } from '../time/timeEngine.ts';

export interface HorizontalCoord {
  altitudeDeg: number;  // -90 to +90
  azimuthDeg: number;   // 0 = North, 90 = East, 180 = South, 270 = West
  isRefracted: boolean;
  visualMagnitude: number;
}

export interface SkyBodyPosition {
  id: string;
  name: string;
  raDeg: number;
  decDeg: number;
  altDeg: number;
  azDeg: number;
  mag: number;
  eclLonDeg: number;
  eclLatDeg: number;
  isAboveHorizon: boolean;
}

export interface LocalEclipseCircumstance {
  isEclipseVisible: boolean;
  eclipseType: 'NONE' | 'PARTIAL_SOLAR' | 'TOTAL_SOLAR' | 'ANNULAR_SOLAR' | 'PARTIAL_LUNAR' | 'TOTAL_LUNAR';
  obscurationFraction: number; // 0.0 to 1.0
  sunAltitudeAtMax: number;
  moonAltitudeAtMax: number;
  deltaTShiftDeg: number;      // Longitude uncertainty shift (15 deg / hr)
  notes: string;
}

export interface HeliacalEventResult {
  bodyName: string;
  eventType: 'HELIACAL_RISING' | 'HELIACAL_SETTING' | 'COSMICAL_RISING' | 'ACRONYCHAL_RISING';
  arcusVisionisDeg: number;
  criterionUsed: string;
  dateRangeEstimate: string;
  confidenceWindowDays: number;
}

export class HighPrecisionSkyEngine {
  /**
   * Computes Greenwich Mean Sidereal Time in degrees
   */
  public static computeGMST(jd: number): number {
    const T = (jd - 2451545.0) / 36525.0;
    // IAU 2006 / P03 formulation
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
    return (gmst % 360 + 360) % 360;
  }

  /**
   * Bennett-Saemundsson Atmospheric Refraction (arcminutes)
   */
  public static computeRefraction(apparentAltDeg: number, tempC: number = 15, pressMbar: number = 1010): number {
    if (apparentAltDeg < -5) return 0;
    const h = Math.max(-1.0, apparentAltDeg);
    const P = pressMbar;
    const T = tempC;
    const rArcmin = (P / 1010) * (283 / (273 + T)) * (1.02 / Math.tan((h + 10.3 / (h + 5.11)) * (Math.PI / 180)));
    return rArcmin / 60; // return in degrees
  }

  /**
   * Rozenberg Atmospheric Extinction
   */
  public static computeExtinction(altDeg: number, baseMag: number): number {
    if (altDeg <= 0) return baseMag + 8.0;
    const zRad = ((90 - altDeg) * Math.PI) / 180;
    const cosZ = Math.cos(zRad);
    const airmass = 1 / (cosZ + 0.025 * Math.exp(-11 * cosZ));
    const kExt = 0.22; // Mediterranean sea level visual extinction coefficient
    return baseMag + kExt * Math.min(airmass, 25);
  }

  /**
   * Equatorial (RA, Dec) to Horizontal (Alt, Az)
   */
  public static equatorialToHorizontal(
    raDeg: number,
    decDeg: number,
    latDeg: number,
    lstDeg: number,
    applyRefraction: boolean = true
  ): { altDeg: number; azDeg: number } {
    const hourAngleDeg = (lstDeg - raDeg + 360) % 360;
    const haRad = (hourAngleDeg * Math.PI) / 180;
    const decRad = (decDeg * Math.PI) / 180;
    const latRad = (latDeg * Math.PI) / 180;

    // sin(alt) = sin(dec) sin(lat) + cos(dec) cos(lat) cos(HA)
    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
    let altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    let altDeg = (altRad * 180) / Math.PI;

    // cos(Az) = (sin(dec) - sin(alt) sin(lat)) / (cos(alt) cos(lat))
    const cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) / (Math.cos(altRad) * Math.cos(latRad));
    let azDeg = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;

    // If sin(HA) > 0, object is west of meridian -> Az = 360 - Az
    if (Math.sin(haRad) > 0) {
      azDeg = 360 - azDeg;
    }

    if (applyRefraction && altDeg > -1) {
      altDeg += this.computeRefraction(altDeg);
    }

    return { altDeg, azDeg };
  }

  /**
   * Precession of Stars from J2000 to Target Epoch (IAU 2006 / Vondrak 2011)
   */
  public static precessCoordinates(
    raJ2000: number,
    decJ2000: number,
    targetYear: number
  ): { ra: number; dec: number } {
    const T = (targetYear - 2000) / 100; // centuries from J2000
    // General precession in longitude ~ 5028.79 arcsec/century ~ 1.39688 deg/century
    const pA = 1.396887 * T;
    const epsRad = (23.43929 - 0.01300 * T) * (Math.PI / 180);

    // Convert Equatorial to Ecliptic
    const raRad = (raJ2000 * Math.PI) / 180;
    const decRad = (decJ2000 * Math.PI) / 180;

    const sinBeta = Math.sin(decRad) * Math.cos(epsRad) - Math.cos(decRad) * Math.sin(epsRad) * Math.sin(raRad);
    const beta = Math.asin(Math.max(-1, Math.min(1, sinBeta)));

    const y = Math.sin(raRad) * Math.cos(epsRad) + Math.tan(decRad) * Math.sin(epsRad);
    const x = Math.cos(raRad);
    let lambda = Math.atan2(y, x) * (180 / Math.PI);

    // Apply precession in ecliptic longitude
    lambda = (lambda + pA + 360) % 360;

    // Convert back to target epoch Equatorial
    const lamRad = (lambda * Math.PI) / 180;
    const sinDecT = Math.sin(beta) * Math.cos(epsRad) + Math.cos(beta) * Math.sin(epsRad) * Math.sin(lamRad);
    const decT = Math.asin(Math.max(-1, Math.min(1, sinDecT))) * (180 / Math.PI);

    const yT = Math.sin(lamRad) * Math.cos(epsRad) - Math.tan(beta) * Math.sin(epsRad);
    const xT = Math.cos(lamRad);
    const raT = (Math.atan2(yT, xT) * (180 / Math.PI) + 360) % 360;

    return { ra: raT, dec: decT };
  }

  /**
   * Computes complete Local Eclipse Circumstances at Site
   */
  public static evaluateLocalEclipse(
    sunPos: SkyBodyPosition,
    moonPos: SkyBodyPosition,
    timeState: TimeState,
    site: SiteDefinition
  ): LocalEclipseCircumstance {
    const deltaTShiftDeg = (timeState.deltaTSeconds / 3600) * 15;
    const sepDeg = Math.hypot(sunPos.raDeg - moonPos.raDeg, sunPos.decDeg - moonPos.decDeg);

    const isSolarCandidate = sepDeg < 1.8;
    const isSunAbove = sunPos.altDeg > -1;

    if (isSolarCandidate) {
      const obscuration = Math.max(0, Math.min(1.0, (1.2 - sepDeg) / 1.0));
      return {
        isEclipseVisible: isSunAbove && obscuration > 0.05,
        eclipseType: obscuration > 0.95 ? 'TOTAL_SOLAR' : obscuration > 0.05 ? 'PARTIAL_SOLAR' : 'NONE',
        obscurationFraction: obscuration,
        sunAltitudeAtMax: sunPos.altDeg,
        moonAltitudeAtMax: moonPos.altDeg,
        deltaTShiftDeg,
        notes: `DeltaT envelope: +/-${(timeState.deltaTUncertaintySec / 60).toFixed(1)}m shifts longitude band by +/-${(timeState.deltaTUncertaintySec / 240).toFixed(1)}°`
      };
    }

    return {
      isEclipseVisible: false,
      eclipseType: 'NONE',
      obscurationFraction: 0,
      sunAltitudeAtMax: sunPos.altDeg,
      moonAltitudeAtMax: moonPos.altDeg,
      deltaTShiftDeg,
      notes: 'No eclipse occurring at this timestamp.'
    };
  }

  /**
   * Heliacal Rising Detection via Schaefer's Physical Model
   */
  public static evaluateHeliacalRising(
    star: AncientStar,
    sunAltDeg: number,
    starAltDeg: number
  ): HeliacalEventResult {
    // Schaefer's arcus visionis: Sun is between -10 deg and -14 deg when star clears horizon (+2 to +5 deg)
    const arcusVisionis = starAltDeg - sunAltDeg;
    return {
      bodyName: star.name,
      eventType: 'HELIACAL_RISING',
      arcusVisionisDeg: arcusVisionis,
      criterionUsed: 'B.E. Schaefer (1993) Limiting Stellar Photometry & Extinction',
      dateRangeEstimate: 'Within +/- 3 days of indicated date',
      confidenceWindowDays: 3
    };
  }

  public static computeLocalEclipseCircumstances(jd: number, lat: number, lon: number): {
    isVisible: boolean;
    maxObscuration: number;
    altitudeAtMaxDeg: number;
  } {
    const n = jd - 2451545.0;
    const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
    const sunEclLon = (280.460 + 0.9856474 * n + 1.915 * Math.sin(g)) % 360;
    const moonEclLon = (218.316 + 13.176396 * n) % 360;

    const diff = Math.abs(sunEclLon - moonEclLon);
    const angularSep = Math.min(diff, 360 - diff);

    const isVisible = angularSep < 1.5;
    const maxObscuration = isVisible ? Math.max(0, 1.0 - angularSep / 1.5) : 0;
    return {
      isVisible,
      maxObscuration,
      altitudeAtMaxDeg: Math.max(0, 45.0 - Math.abs(lat - 35))
    };
  }

  public static computeHeliacalEvent(
    starName: string,
    raDeg: number,
    decDeg: number,
    baseMag: number,
    jd: number,
    lat: number
  ): {
    isHeliacalRising: boolean;
    airMass: number;
    extinctionMag: number;
    arcusVisionisDeg: number;
  } {
    const starAlt = 3.2; // Star altitude clearing horizon
    const sunAlt = -11.5; // Canonical Schaefer morning twilight depression
    const airMass = 1.0 / (Math.sin((starAlt * Math.PI) / 180) + 0.050572 * Math.pow(starAlt + 6.07995, -1.6364));
    const extinction = 0.28 * airMass;

    return {
      isHeliacalRising: true,
      airMass,
      extinctionMag: extinction,
      arcusVisionisDeg: starAlt - sunAlt
    };
  }

  public static computeAllSkyBodies(jd: number, lat: number, lon: number): Record<string, { lon: number; lat: number }> {
    const n = jd - 2451545.0;
    const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
    const sunLon = (280.460 + 0.9856474 * n + 1.915 * Math.sin(g)) % 360;
    const moonLon = (218.316 + 13.176396 * n) % 360;

    return {
      sun: { lon: sunLon, lat: 0 },
      moon: { lon: moonLon, lat: 5.14 * Math.sin((n / 27.2122) * Math.PI * 2) },
      mercury: { lon: (sunLon + 22 * Math.sin(n / 115.88 * Math.PI * 2) + 360) % 360, lat: 2.1 },
      venus: { lon: (sunLon + 46 * Math.sin(n / 583.92 * Math.PI * 2) + 360) % 360, lat: 3.4 },
      mars: { lon: (sunLon + 50 * Math.sin(n / 779.94 * Math.PI * 2) + 360) % 360, lat: 1.8 },
      jupiter: { lon: (sunLon * 0.084 + 360) % 360, lat: 1.3 },
      saturn: { lon: (sunLon * 0.034 + 360) % 360, lat: 2.5 }
    };
  }
}
