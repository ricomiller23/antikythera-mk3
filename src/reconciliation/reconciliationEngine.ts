export interface HistoricalObservation {
  id: string;
  source: 'BABYLONIAN_DIARY' | 'ALMAGEST' | 'STEPHENSON_MORRISON';
  dateBCE: number;
  siteId: string;
  siteName: string;
  eventType: 'SOLAR_ECLIPSE' | 'LUNAR_ECLIPSE' | 'PLANETARY_CONJUNCTION' | 'EQUINOX';
  description: string;
  recordedLocalTime: string;
  modernEphemerisJD: number;
  publishedDeltaTSeconds: number;
  impliedDeltaTSeconds: number;
  residualMinutes: number;
  isOutlier: boolean;
  outlierReason?: string;
}

export const HISTORICAL_OBSERVATIONS: HistoricalObservation[] = [
  {
    id: 'bab_ecl_568',
    source: 'BABYLONIAN_DIARY',
    dateBCE: 568,
    siteId: 'babylon',
    siteName: 'Babylon',
    eventType: 'LUNAR_ECLIPSE',
    description: 'Year 37 of Nebuchadnezzar II (VAT 4956 diary). Total lunar eclipse observed at dawn.',
    recordedLocalTime: 'At morning watch',
    modernEphemerisJD: 1514418.6,
    publishedDeltaTSeconds: 17800,
    impliedDeltaTSeconds: 17650,
    residualMinutes: -2.5,
    isOutlier: false
  },
  {
    id: 'gau_ecl_331',
    source: 'BABYLONIAN_DIARY',
    dateBCE: 331,
    siteId: 'babylon',
    siteName: 'Babylon',
    eventType: 'LUNAR_ECLIPSE',
    description: 'Battle of Gaugamela lunar eclipse (11 days before Alexander defeated Darius III).',
    recordedLocalTime: '1.5 double-hours after sunset',
    modernEphemerisJD: 1600862.3,
    publishedDeltaTSeconds: 13900,
    impliedDeltaTSeconds: 13960,
    residualMinutes: +1.0,
    isOutlier: false
  },
  {
    id: 'ptol_ecl_201',
    source: 'ALMAGEST',
    dateBCE: 201,
    siteId: 'alexandria',
    siteName: 'Alexandria',
    eventType: 'LUNAR_ECLIPSE',
    description: 'Almagest IV.6: Total lunar eclipse observed in Alexandria; year 54 of the Second Callippic cycle.',
    recordedLocalTime: 'Midnight',
    modernEphemerisJD: 1648028.9,
    publishedDeltaTSeconds: 11150,
    impliedDeltaTSeconds: 11200,
    residualMinutes: +0.8,
    isOutlier: false
  },
  {
    id: 'hipp_eq_130',
    source: 'ALMAGEST',
    dateBCE: 130,
    siteId: 'rhodes',
    siteName: 'Rhodes',
    eventType: 'EQUINOX',
    description: 'Almagest III.1: Autumnal equinox measured by Hipparchus with equatorial bronze ring.',
    recordedLocalTime: 'Midday',
    modernEphemerisJD: 1673898.5,
    publishedDeltaTSeconds: 9700,
    impliedDeltaTSeconds: 9620,
    residualMinutes: -1.3,
    isOutlier: false
  },
  {
    id: 'bab_sol_136',
    source: 'BABYLONIAN_DIARY',
    dateBCE: 136,
    siteId: 'babylon',
    siteName: 'Babylon',
    eventType: 'SOLAR_ECLIPSE',
    description: 'Total solar eclipse recorded in Babylonian diary (BM 45745). Stars visible; 24 deg past noon.',
    recordedLocalTime: 'Early afternoon',
    modernEphemerisJD: 1671746.1,
    publishedDeltaTSeconds: 9850,
    impliedDeltaTSeconds: 9880,
    residualMinutes: +0.5,
    isOutlier: false
  }
];

export class AncientObservationReconciler {
  public static getAllRecords(): HistoricalObservation[] {
    return HISTORICAL_OBSERVATIONS;
  }

  public static getResidualStats(): { meanResidualMin: number; rmsResidualMin: number; outlierCount: number } {
    const residuals = HISTORICAL_OBSERVATIONS.map(r => r.residualMinutes);
    const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const rms = Math.sqrt(residuals.reduce((a, b) => a + b * b, 0) / residuals.length);
    const outliers = HISTORICAL_OBSERVATIONS.filter(r => r.isOutlier).length;
    return { meanResidualMin: mean, rmsResidualMin: rms, outlierCount: outliers };
  }
}

export { HISTORICAL_OBSERVATIONS as HISTORICAL_RECONCILIATION_RECORDS, type HistoricalObservation as HistoricalRecord };
