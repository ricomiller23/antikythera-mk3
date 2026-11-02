export interface HistoricalEclipse {
  sarosSeries: number;
  dateStr: string;
  yearBCE_CE: number; // Negative for BCE (e.g. -205 = 205 BCE)
  month: number;
  day: number;
  timeUTC: string;
  type: 'SOLAR_TOTAL' | 'SOLAR_ANNULAR' | 'SOLAR_PARTIAL' | 'SOLAR_HYBRID' | 'LUNAR_TOTAL' | 'LUNAR_PARTIAL' | 'LUNAR_PENUMBRAL';
  sarosCellIndex: number; // 0 to 222 in 223-month cycle
  glyphType: 'H' | 'Σ';   // H = Helios (Sun), Σ = Selene (Moon)
  hourGlyphGreek: string; // e.g. "A", "B", "Γ"... "IB" (1 to 12)
  exeligmosShiftHours: 0 | 8 | 16;
  notes: string;
}

// Representative historical anchor catalog verified against NASA / Espenak 5-Millennium Catalog
// Specifically covering key Hellenistic epochs (c. 205 BCE - 60 BCE) and modern validation anchors
export const HISTORICAL_ECLIPSES: HistoricalEclipse[] = [
  // Anchor 1: Carman & Evans 2014 proposed epoch solar eclipse
  {
    sarosSeries: 44,
    dateStr: '-0205-05-12',
    yearBCE_CE: -205,
    month: 5,
    day: 12,
    timeUTC: '14:32',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 13,
    glyphType: 'H',
    hourGlyphGreek: 'H (8)',
    exeligmosShiftHours: 0,
    notes: 'Carman & Evans 2014 epoch anchor; Saros cell 13 total solar eclipse'
  },
  {
    sarosSeries: 39,
    dateStr: '-0205-10-06',
    yearBCE_CE: -205,
    month: 10,
    day: 6,
    timeUTC: '21:14',
    type: 'LUNAR_TOTAL',
    sarosCellIndex: 18,
    glyphType: 'Σ',
    hourGlyphGreek: 'I (10)',
    exeligmosShiftHours: 0,
    notes: 'Total lunar eclipse visible in Mediterranean'
  },
  // Voulgaris et al. 2022 proposed epoch
  {
    sarosSeries: 48,
    dateStr: '-0178-12-23',
    yearBCE_CE: -178,
    month: 12,
    day: 23,
    timeUTC: '08:45',
    type: 'SOLAR_ANNULAR',
    sarosCellIndex: 44,
    glyphType: 'H',
    hourGlyphGreek: 'Γ (3)',
    exeligmosShiftHours: 8,
    notes: 'Voulgaris/FRAMe 2022 winter solstice eclipse'
  },
  // Historic Hellenistic Battle of Pydna Lunar Eclipse (Polybius/Livy)
  {
    sarosSeries: 43,
    dateStr: '-0168-06-21',
    yearBCE_CE: -168,
    month: 6,
    day: 21,
    timeUTC: '19:40',
    type: 'LUNAR_TOTAL',
    sarosCellIndex: 65,
    glyphType: 'Σ',
    hourGlyphGreek: 'A (1)',
    exeligmosShiftHours: 16,
    notes: 'Battle of Pydna omen predicted by Roman military tribune Sulpicius Gallus'
  },
  {
    sarosSeries: 50,
    dateStr: '-0150-03-29',
    yearBCE_CE: -150,
    month: 3,
    day: 29,
    timeUTC: '11:12',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 92,
    glyphType: 'H',
    hourGlyphGreek: 'E (5)',
    exeligmosShiftHours: 8,
    notes: 'Hipparchan observation window in Rhodes'
  },
  {
    sarosSeries: 55,
    dateStr: '-0129-11-20',
    yearBCE_CE: -129,
    month: 11,
    day: 20,
    timeUTC: '13:05',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 118,
    glyphType: 'H',
    hourGlyphGreek: 'Z (7)',
    exeligmosShiftHours: 16,
    notes: 'Total eclipse used by Hipparchus to compute Earth-Moon distance'
  },
  {
    sarosSeries: 62,
    dateStr: '-0074-04-18',
    yearBCE_CE: -74,
    month: 4,
    day: 18,
    timeUTC: '16:50',
    type: 'SOLAR_ANNULAR',
    sarosCellIndex: 172,
    glyphType: 'H',
    hourGlyphGreek: 'Θ (9)',
    exeligmosShiftHours: 0,
    notes: 'Posidonius of Rhodes teaching era'
  },
  // Modern Benchmarks
  {
    sarosSeries: 145,
    dateStr: '2017-08-21',
    yearBCE_CE: 2017,
    month: 8,
    day: 21,
    timeUTC: '18:26',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 13,
    glyphType: 'H',
    hourGlyphGreek: 'H (8)',
    exeligmosShiftHours: 16,
    notes: 'Great American Solar Eclipse (Saros 145, modern counterpart)'
  },
  {
    sarosSeries: 139,
    dateStr: '2024-04-08',
    yearBCE_CE: 2024,
    month: 4,
    day: 8,
    timeUTC: '18:18',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 82,
    glyphType: 'H',
    hourGlyphGreek: 'Z (7)',
    exeligmosShiftHours: 8,
    notes: 'North American Total Solar Eclipse'
  },
  {
    sarosSeries: 126,
    dateStr: '2026-08-12',
    yearBCE_CE: 2026,
    month: 8,
    day: 12,
    timeUTC: '17:47',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 110,
    glyphType: 'H',
    hourGlyphGreek: 'Z (7)',
    exeligmosShiftHours: 0,
    notes: 'Total Solar Eclipse across Greenland, Iceland, and Northern Spain'
  },
  {
    sarosSeries: 136,
    dateStr: '2027-08-02',
    yearBCE_CE: 2027,
    month: 8,
    day: 2,
    timeUTC: '10:07',
    type: 'SOLAR_TOTAL',
    sarosCellIndex: 123,
    glyphType: 'H',
    hourGlyphGreek: 'Δ (4)',
    exeligmosShiftHours: 8,
    notes: 'Great Mediterranean/Egypt Solar Eclipse (6m23s totality over Luxor)'
  }
];

export function findNearestEclipse(yearFraction: number): {
  previous: HistoricalEclipse;
  next: HistoricalEclipse;
} {
  let prev = HISTORICAL_ECLIPSES[0];
  let next = HISTORICAL_ECLIPSES[HISTORICAL_ECLIPSES.length - 1];

  for (let i = 0; i < HISTORICAL_ECLIPSES.length - 1; i++) {
    const cur = HISTORICAL_ECLIPSES[i];
    const nxt = HISTORICAL_ECLIPSES[i + 1];
    if (cur.yearBCE_CE <= yearFraction && nxt.yearBCE_CE >= yearFraction) {
      prev = cur;
      next = nxt;
      break;
    }
  }

  return { previous: prev, next: next };
}
