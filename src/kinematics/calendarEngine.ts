export interface CalendarConversion {
  julianDay: number;
  gregorianStr: string;
  julianStr: string;
  egyptianDate: {
    monthNameGreek: string;
    monthNameEn: string;
    monthNumber: number;
    day: number;
    isEpagomenal: boolean;
  };
  metonicDate: {
    cycleYear: number;       // 1 to 19
    monthInYear: number;     // 1 to 12 or 13 (intercalary)
    overallMonthIndex: number; // 0 to 234
    monthNameGreek: string;
    monthNameTranslit: string;
    isIntercalary: boolean;
    spiralTurn: number;      // 1 to 5
    cellNumber: number;      // 1 to 235
  };
  calendarRingDay: number;   // 1 to 354 (or 365)
  leapOffsetDays: number;
}

export const EGYPTIAN_MONTHS = [
  { greek: 'Θώθ', en: 'Thoth' },
  { greek: 'Φαωφί', en: 'Phaophi' },
  { greek: 'Ἁθύρ', en: 'Athyr' },
  { greek: 'Χοιάκ', en: 'Choiak' },
  { greek: 'Τῦβι', en: 'Tybi' },
  { greek: 'Μεχείρ', en: 'Mecheir' },
  { greek: 'Φαμενώθ', en: 'Phamenoth' },
  { greek: 'Φαρμουθί', en: 'Pharmouthi' },
  { greek: 'Παχών', en: 'Pachon' },
  { greek: 'Παϋνί', en: 'Payni' },
  { greek: 'Ἐπιφί', en: 'Epiphi' },
  { greek: 'Μεσορή', en: 'Mesore' },
  { greek: 'Ἐπαγόμεναι', en: 'Epagomenae (5 days)' }
];

export const CORINTHIAN_METONIC_MONTHS = [
  { greek: 'ΦΟΙΝΙΚΑΙΟΣ', translit: 'Phoinikaios', season: 'Autumn (Sept/Oct)' },
  { greek: 'ΚΡΑΝΕΙΟΣ', translit: 'Kraneios', season: 'Autumn (Oct/Nov)' },
  { greek: 'ΛΑΝΟΤΡΟΠΙΟΣ', translit: 'Lanotropios', season: 'Winter (Nov/Dec)' },
  { greek: 'ΜΑΧΑΝΕΥΣ', translit: 'Machaneus', season: 'Winter (Dec/Jan)' },
  { greek: 'ΔΩΔΕΚΑΤΕΥΣ', translit: 'Dodekateus', season: 'Winter (Jan/Feb)' },
  { greek: 'ΕΥΚΛΕΙΟΣ', translit: 'Eukleios', season: 'Spring (Feb/Mar)' },
  { greek: 'ΑΡΤΕΜΙΤΙΟΣ', translit: 'Artemitios', season: 'Spring (Mar/Apr)' },
  { greek: 'ΨΥΔΡΕΥΣ', translit: 'Psydreus', season: 'Spring (Apr/May)' },
  { greek: 'ΓΑΜΕΙΛΙΟΣ', translit: 'Gameilios', season: 'Summer (May/Jun)' },
  { greek: 'ΑΓΡΙΑΝΙΟΣ', translit: 'Agrianios', season: 'Summer (Jun/Jul)' },
  { greek: 'ΠΑΝΑΜΟΣ', translit: 'Panamos', season: 'Summer (Jul/Aug)' },
  { greek: 'ΑΠΕΛΛΑΙΟΣ', translit: 'Apellaios', season: 'Late Summer (Aug/Sept)' }
];

// 7 Intercalary months in the 19-year Metonic cycle (years 3, 6, 8, 11, 14, 17, 19)
export const METONIC_INTERCALARY_YEARS = [3, 6, 8, 11, 14, 17, 19];

export function dateToJulianDay(year: number, month: number, day: number, hourFraction: number = 0.5): number {
  // Astronomical year numbering: 1 BCE = 0, 205 BCE = -204
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = (year > 1582 || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15))
    ? 2 - a + Math.floor(a / 4)
    : 0;

  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + hourFraction;
  return jd;
}

export function julianDayToDate(jd: number): { year: number; month: number; day: number; hour: number } {
  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const hour = f * 24;

  return { year, month, day, hour };
}

export function computeCalendarConversions(
  currentJDN: number,
  epochJDN: number = 1646274.0, // May 12, 205 BCE (Carman & Evans epoch)
  calendarMode: 'lunar_354' | 'solar_365' = 'lunar_354'
): CalendarConversion {
  const dt = julianDayToDate(currentJDN);
  const yearDisp = dt.year <= 0 ? `${Math.abs(dt.year - 1)} BCE` : `${dt.year} CE`;
  const gregorianStr = `${yearDisp}-${String(dt.month).padStart(2, '0')}-${String(dt.day).padStart(2, '0')}`;
  const julianStr = `JD ${currentJDN.toFixed(2)}`;

  // Egyptian Calendar (365 days fixed, 12 months x 30 days + 5 epagomenae)
  // Nabonassar Epoch = 1448638.0 (Feb 26, 747 BCE)
  const daysSinceNabonassar = currentJDN - 1448638.0;
  const egyptYearDay = ((daysSinceNabonassar % 365) + 365) % 365;
  const egyptMonthIndex = Math.floor(egyptYearDay / 30);
  const egyptDay = Math.floor(egyptYearDay % 30) + 1;
  const isEpagomenal = egyptMonthIndex >= 12;

  const egyptInfo = {
    monthNameGreek: isEpagomenal ? EGYPTIAN_MONTHS[12].greek : EGYPTIAN_MONTHS[egyptMonthIndex].greek,
    monthNameEn: isEpagomenal ? EGYPTIAN_MONTHS[12].en : EGYPTIAN_MONTHS[egyptMonthIndex].en,
    monthNumber: isEpagomenal ? 13 : egyptMonthIndex + 1,
    day: isEpagomenal ? Math.floor(egyptYearDay - 360) + 1 : egyptDay,
    isEpagomenal
  };

  // Metonic Calendar (235 synodic months in 19 tropical years)
  // Mean synodic month = 29.5305888 days
  const daysSinceEpoch = currentJDN - epochJDN;
  const synodicMonthLength = 29.5305888;
  const elapsedMonths = daysSinceEpoch / synodicMonthLength;
  const metonicCellRaw = ((elapsedMonths % 235) + 235) % 235;
  const metonicCellIndex = Math.floor(metonicCellRaw); // 0 to 234
  const cellNumber = metonicCellIndex + 1;             // 1 to 235

  const spiralTurn = Math.floor(metonicCellIndex / 47) + 1; // 5 turns of 47 months
  const monthNameObj = CORINTHIAN_METONIC_MONTHS[metonicCellIndex % 12];
  
  // Approximate Metonic 19-year cycle position
  const cycleYear = (Math.floor(metonicCellIndex / 12.368) % 19) + 1;
  const monthInYear = (metonicCellIndex % 12) + 1;
  const isIntercalary = METONIC_INTERCALARY_YEARS.includes(cycleYear) && monthInYear === 12;

  const metonicInfo = {
    cycleYear,
    monthInYear,
    overallMonthIndex: metonicCellIndex,
    monthNameGreek: monthNameObj.greek,
    monthNameTranslit: monthNameObj.translit,
    isIntercalary,
    spiralTurn,
    cellNumber
  };

  // Front Calendar Ring
  const totalDays = calendarMode === 'lunar_354' ? 354 : 365;
  const calendarRingDay = Math.floor(((daysSinceEpoch % totalDays) + totalDays) % totalDays) + 1;
  const leapOffsetDays = Math.floor(daysSinceEpoch / (4 * 365.25));

  return {
    julianDay: currentJDN,
    gregorianStr,
    julianStr,
    egyptianDate: egyptInfo,
    metonicDate: metonicInfo,
    calendarRingDay,
    leapOffsetDays
  };
}
