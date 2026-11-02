export type PlanetId = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export interface PlanetLandmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface PlanetMoonTheory {
  id: string;
  name: string;
  radiusKm: number;
  orbitalPeriodDays: number;
  semiMajorAxisKm: number;
  isRetrograde?: boolean;
  isTidallyLocked?: boolean;
  risesInWest?: boolean;
  source: string;
  theoryName: string;
}

export interface PlanetDefinition {
  id: PlanetId;
  name: string;
  greekName: string;
  ancientTitle: string;
  isAncient: boolean;
  isDwarfPlanet?: boolean;
  orderFromSun: number;
  semiMajorAxisAU: number;
  orbitalPeriodDays: number;
  orbitalPeriodYears: number;
  siderealDayHours: number;
  solarDayHours: number;
  obliquityDeg: number;
  gravityMPerS2: number;
  surfacePressureBar: number;
  meanTempC: number;
  tempRangeC: [number, number];
  speedOfSoundMPerS: number;
  solarIrradianceFraction: number; // vs Earth = 1.0
  solarAngularDiameterDeg: number; // vs Earth = 0.533 deg
  skyColorHex: string;
  skyHorizonHex: string;
  sunsetGradientHex: [string, string];
  hasOpaqueClouds: boolean;
  fluidDriveState: 'WORKS' | 'FREEZES' | 'BOILS' | 'EVAPORATES';
  fluidFailureReason: string;
  landmarks: PlanetLandmark[];
  moons: PlanetMoonTheory[];
  disputedParameters?: { parameter: string; valueA: string; valueB: string; note: string }[];
  funFact: string;
}

export const PLANETS_DATA: Record<PlanetId, PlanetDefinition> = {
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    greekName: 'Ἑρμῆς',
    ancientTitle: 'Στίλβων (Stilbon — "The Gleaming One")',
    isAncient: true,
    orderFromSun: 1,
    semiMajorAxisAU: 0.3871,
    orbitalPeriodDays: 87.969,
    orbitalPeriodYears: 0.2408,
    siderealDayHours: 1407.5, // 58.6462 days
    solarDayHours: 4222.6,    // 175.942 days (3:2 spin-orbit resonance)
    obliquityDeg: 0.034,
    gravityMPerS2: 3.70,
    surfacePressureBar: 1e-14, // near vacuum
    meanTempC: 167,
    tempRangeC: [-180, 430],
    speedOfSoundMPerS: 0, // vacuum: silent acoustics
    solarIrradianceFraction: 6.67,
    solarAngularDiameterDeg: 1.38,
    skyColorHex: '#000000',
    skyHorizonHex: '#080808',
    sunsetGradientHex: ['#000000', '#000000'],
    hasOpaqueClouds: false,
    fluidDriveState: 'EVAPORATES',
    fluidFailureReason: 'Sublimes to space instantaneously in daylight vacuum and freezes solid in darkness.',
    landmarks: [
      { id: 'caloris', name: 'Caloris Basin', latitude: 30.5, longitude: 189.8, description: 'Massive impact basin with thermal peak.' },
      { id: 'beethoven', name: 'Beethoven Basin', latitude: -20.8, longitude: 123.6, description: 'Flooded impact structure near perihelion sub-solar track.' }
    ],
    moons: [],
    funFact: 'At perihelion, Mercury moves faster along its orbit than it rotates on its axis, causing the Sun to temporarily reverse direction in the sky.'
  },

  venus: {
    id: 'venus',
    name: 'Venus',
    greekName: 'Ἀφροδίτη',
    ancientTitle: 'Ἑωσφόρος / Ἕσπερος (Phosphoros / Hesperos)',
    isAncient: true,
    orderFromSun: 2,
    semiMajorAxisAU: 0.7233,
    orbitalPeriodDays: 224.701,
    orbitalPeriodYears: 0.6152,
    siderealDayHours: -5832.5, // 243.02 days retrograde
    solarDayHours: 2802.0,     // 116.75 days (Sun rises in the West)
    obliquityDeg: 177.36,      // 2.64 deg tilt, inverted spin
    gravityMPerS2: 8.87,
    surfacePressureBar: 92.0,
    meanTempC: 464,
    tempRangeC: [440, 480],
    speedOfSoundMPerS: 410,
    solarIrradianceFraction: 1.91,
    solarAngularDiameterDeg: 0.737,
    skyColorHex: '#e8c872',
    skyHorizonHex: '#c79c3f',
    sunsetGradientHex: ['#b38128', '#8a5c17'],
    hasOpaqueClouds: true,
    fluidDriveState: 'BOILS',
    fluidFailureReason: 'Supercritical water flash-boils into high-density vapor at 92 bar and 464°C.',
    landmarks: [
      { id: 'maxwell', name: 'Maxwell Montes', latitude: 65.2, longitude: 3.3, description: 'Highest point on Venus (11 km above mean radius).' },
      { id: 'aphrodite', name: 'Aphrodite Terra', latitude: -5.8, longitude: 104.8, description: 'Continent-sized highland region.' }
    ],
    moons: [],
    funFact: 'Venus rotates in the opposite direction to most planets; a solar day on Venus lasts 116.75 Earth days and the Sun rises in the West.'
  },

  earth: {
    id: 'earth',
    name: 'Earth',
    greekName: 'Γῆ',
    ancientTitle: 'Γῆ / Γαῖα (Ge / Gaia — Origin World)',
    isAncient: true,
    orderFromSun: 3,
    semiMajorAxisAU: 1.000,
    orbitalPeriodDays: 365.256,
    orbitalPeriodYears: 1.000,
    siderealDayHours: 23.934,
    solarDayHours: 24.000,
    obliquityDeg: 23.44,
    gravityMPerS2: 9.807,
    surfacePressureBar: 1.013,
    meanTempC: 15,
    tempRangeC: [-89, 57],
    speedOfSoundMPerS: 343,
    solarIrradianceFraction: 1.00,
    solarAngularDiameterDeg: 0.533,
    skyColorHex: '#0c2444',
    skyHorizonHex: '#38bdf8',
    sunsetGradientHex: ['#f59e0b', '#dc2626'],
    hasOpaqueClouds: false,
    fluidDriveState: 'WORKS',
    fluidFailureReason: 'Nominal Ctesibian clepsydra hydraulic operation under Hellenistic conditions.',
    landmarks: [
      { id: 'rhodes', name: 'Rhodes (Hipparchus Observatory)', latitude: 36.43, longitude: 28.22, description: 'Hellenistic astronomical calibration center.' },
      { id: 'alexandria', name: 'Alexandria (Library & Ctesibius)', latitude: 31.20, longitude: 29.92, description: 'Hellenistic mechanical clockmaking center.' }
    ],
    moons: [
      {
        id: 'moon',
        name: 'Moon (Σελήνη)',
        radiusKm: 1737.4,
        orbitalPeriodDays: 27.32166,
        semiMajorAxisKm: 384400,
        source: 'Chapront-Touzé & Chapront (ELP 2000-82B)',
        theoryName: 'ELP-2000/82'
      }
    ],
    funFact: 'The birthplace of the Antikythera Mechanism; all historical calendar gears were calibrated to Earth’s solar year and lunar synodic month.'
  },

  mars: {
    id: 'mars',
    name: 'Mars',
    greekName: 'Ἄρης',
    ancientTitle: 'Πυρόεις (Pyroeis — "The Fiery One")',
    isAncient: true,
    orderFromSun: 4,
    semiMajorAxisAU: 1.5237,
    orbitalPeriodDays: 686.98,
    orbitalPeriodYears: 1.8808,
    siderealDayHours: 24.62296,
    solarDayHours: 24.65979, // 1 sol = 88775.244s
    obliquityDeg: 25.19,
    gravityMPerS2: 3.72,
    surfacePressureBar: 0.0061,
    meanTempC: -63,
    tempRangeC: [-125, 20],
    speedOfSoundMPerS: 240,
    solarIrradianceFraction: 0.43,
    solarAngularDiameterDeg: 0.35,
    skyColorHex: '#c99a6b',
    skyHorizonHex: '#e8be89',
    sunsetGradientHex: ['#38bdf8', '#0284c7'], // Blue sunset!
    hasOpaqueClouds: false,
    fluidDriveState: 'FREEZES',
    fluidFailureReason: 'Low atmospheric pressure (6.1 mbar) causes water to freeze or boil away below triple point.',
    landmarks: [
      { id: 'jezero', name: 'Jezero Crater (Perseverance)', latitude: 18.38, longitude: 77.58, description: 'Ancient delta sediment site.' },
      { id: 'gale', name: 'Gale Crater (Curiosity)', latitude: -4.59, longitude: 137.44, description: 'Mount Sharp stratified sediment basin.' },
      { id: 'olympus', name: 'Olympus Mons', latitude: 18.65, longitude: 226.2, description: 'Tallest volcano in the solar system (21.9 km).' }
    ],
    moons: [
      {
        id: 'phobos',
        name: 'Phobos',
        risesInWest: true,
        radiusKm: 11.26,
        orbitalPeriodDays: 0.3189, // 7.6538 hours
        semiMajorAxisKm: 9376,
        source: 'Lainey et al. (ESAPHO)',
        theoryName: 'ESAPHO Orbital Theory'
      },
      {
        id: 'deimos',
        name: 'Deimos',
        radiusKm: 6.2,
        orbitalPeriodDays: 1.263, // 30.31 hours
        semiMajorAxisKm: 23463,
        source: 'Jacobson (JPL MAR097)',
        theoryName: 'JPL MAR097'
      }
    ],
    funFact: 'Phobos orbits faster than Mars spins, rising in the West and setting in the East 2-3 times every Martian sol, with blue twilight sunsets.'
  },

  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    greekName: 'Ζεύς',
    ancientTitle: 'Φαέθων (Phaethon — "The Radiant One")',
    isAncient: true,
    orderFromSun: 5,
    semiMajorAxisAU: 5.2044,
    orbitalPeriodDays: 4332.59,
    orbitalPeriodYears: 11.862,
    siderealDayHours: 9.925,
    solarDayHours: 9.9259,
    obliquityDeg: 3.13,
    gravityMPerS2: 24.79, // at 1-bar level
    surfacePressureBar: 1.0, // 1-bar floating platform assumption
    meanTempC: -110,
    tempRangeC: [-130, -90],
    speedOfSoundMPerS: 890,
    solarIrradianceFraction: 0.037,
    solarAngularDiameterDeg: 0.102,
    skyColorHex: '#d4a373',
    skyHorizonHex: '#faedcd',
    sunsetGradientHex: ['#d97706', '#92400e'],
    hasOpaqueClouds: true,
    fluidDriveState: 'FREEZES',
    fluidFailureReason: 'Ambient temperature of -110°C freezes water clock solid; requires liquid ammonia.',
    landmarks: [
      { id: 'grs', name: 'Great Red Spot Platform', latitude: -22.0, longitude: 0.0, description: '1-bar floating platform above 300-year anticyclonic storm.' },
      { id: 'equator', name: 'Equatorial Jet Stream', latitude: 0.0, longitude: 90.0, description: 'Rapid 100 m/s atmospheric zonal flow.' }
    ],
    moons: [
      { id: 'io', name: 'Io', radiusKm: 1821.6, orbitalPeriodDays: 1.769, semiMajorAxisKm: 421700, source: 'Lieske (E5 Theory)', theoryName: 'Lieske E5' },
      { id: 'europa', name: 'Europa', radiusKm: 1560.8, orbitalPeriodDays: 3.551, semiMajorAxisKm: 670900, source: 'Lieske (E5 Theory)', theoryName: 'Lieske E5' },
      { id: 'ganymede', name: 'Ganymede', radiusKm: 2634.1, orbitalPeriodDays: 7.155, semiMajorAxisKm: 1070400, source: 'Lieske (E5 Theory)', theoryName: 'Lieske E5' },
      { id: 'callisto', name: 'Callisto', radiusKm: 2410.3, orbitalPeriodDays: 16.689, semiMajorAxisKm: 1882700, source: 'Lieske (E5 Theory)', theoryName: 'Lieske E5' }
    ],
    funFact: 'Io, Europa, and Ganymede locked in a 4:2:1 Laplace orbital resonance, enabling mechanical gear integration of their mutual eclipses.'
  },

  saturn: {
    id: 'saturn',
    name: 'Saturn',
    greekName: 'Κρόνος',
    ancientTitle: 'Φαίνων (Phainon — "The Shiner")',
    isAncient: true,
    orderFromSun: 6,
    semiMajorAxisAU: 9.5826,
    orbitalPeriodDays: 10759.22,
    orbitalPeriodYears: 29.457,
    siderealDayHours: 10.556, // 10h 33m 38s (Mankovich 2019)
    solarDayHours: 10.557,
    obliquityDeg: 26.73,
    gravityMPerS2: 10.44,
    surfacePressureBar: 1.0,
    meanTempC: -140,
    tempRangeC: [-170, -120],
    speedOfSoundMPerS: 820,
    solarIrradianceFraction: 0.011,
    solarAngularDiameterDeg: 0.055,
    skyColorHex: '#e0c080',
    skyHorizonHex: '#fef3c7',
    sunsetGradientHex: ['#d97706', '#78350f'],
    hasOpaqueClouds: true,
    fluidDriveState: 'FREEZES',
    fluidFailureReason: 'Ambient -140°C temperature freezes water clock solid.',
    disputedParameters: [
      { parameter: 'Rotation Period', valueA: '10h 33m 38s (Mankovich et al. 2019 ring seismology)', valueB: '10h 39m 24s (Voyager radio)', note: 'Ring kronoseismology measures bulk interior rotation directly.' }
    ],
    landmarks: [
      { id: 'hexagon', name: 'North Polar Hexagon', latitude: 78.0, longitude: 0.0, description: 'Persistent 6-sided jet stream wave pattern.' },
      { id: 'ring_view', name: 'Equatorial Ring Arch', latitude: 0.0, longitude: 0.0, description: 'View directly in the plane of the main rings.' }
    ],
    moons: [
      { id: 'titan', name: 'Titan', radiusKm: 2574.7, orbitalPeriodDays: 15.945, semiMajorAxisKm: 1221870, source: 'Vienne & Duriez (TASS17)', theoryName: 'TASS17' },
      { id: 'rhea', name: 'Rhea', radiusKm: 763.8, orbitalPeriodDays: 4.518, semiMajorAxisKm: 527108, source: 'Vienne & Duriez (TASS17)', theoryName: 'TASS17' },
      { id: 'enceladus', name: 'Enceladus', radiusKm: 252.1, orbitalPeriodDays: 1.370, semiMajorAxisKm: 237948, source: 'Vienne & Duriez (TASS17)', theoryName: 'TASS17' }
    ],
    funFact: 'Saturn’s rings cast colossal shadows across the cloud deck, and ring plane crossings occur once every 14.7 Earth years.'
  },

  uranus: {
    id: 'uranus',
    name: 'Uranus',
    greekName: 'Οὐρανός',
    ancientTitle: 'Οὐρανός (Modern Naming — Adopted 1850)',
    isAncient: false,
    orderFromSun: 7,
    semiMajorAxisAU: 19.2184,
    orbitalPeriodDays: 30685.4,
    orbitalPeriodYears: 84.02,
    siderealDayHours: -17.24, // retrograde
    solarDayHours: 17.24,
    obliquityDeg: 97.77, // Extreme axial tilt
    gravityMPerS2: 8.69,
    surfacePressureBar: 1.0,
    meanTempC: -195,
    tempRangeC: [-210, -180],
    speedOfSoundMPerS: 650,
    solarIrradianceFraction: 0.0027,
    solarAngularDiameterDeg: 0.028,
    skyColorHex: '#4ade80',
    skyHorizonHex: '#a7f3d0',
    sunsetGradientHex: ['#059669', '#064e3b'],
    hasOpaqueClouds: true,
    fluidDriveState: 'FREEZES',
    fluidFailureReason: 'Deep cryogenic temperature (-195°C) solidifies water into rock-hard ice.',
    landmarks: [
      { id: 'uranus_pole', name: 'North Celestial Pole Platform', latitude: 85.0, longitude: 0.0, description: '42 years of continuous sunlight followed by 42 years of night.' },
      { id: 'uranus_eq', name: 'Equatorial Platform', latitude: 0.0, longitude: 90.0, description: 'Sun sweeps horizontally across the horizon at equinox.' }
    ],
    moons: [
      { id: 'miranda', name: 'Miranda', radiusKm: 235.8, orbitalPeriodDays: 1.413, semiMajorAxisKm: 129390, source: 'Laskar & Jacobson (GUST86)', theoryName: 'GUST86' },
      { id: 'titania', name: 'Titania', radiusKm: 788.4, orbitalPeriodDays: 8.706, semiMajorAxisKm: 435910, source: 'Laskar & Jacobson (GUST86)', theoryName: 'GUST86' },
      { id: 'oberon', name: 'Oberon', radiusKm: 761.4, orbitalPeriodDays: 13.463, semiMajorAxisKm: 583520, source: 'Laskar & Jacobson (GUST86)', theoryName: 'GUST86' }
    ],
    funFact: 'With its 97.8° tilt, the Sun spirals in tight coils around the celestial pole during polar summer, never setting for 42 Earth years.'
  },

  neptune: {
    id: 'neptune',
    name: 'Neptune',
    greekName: 'Ποσειδῶν',
    ancientTitle: 'Ποσειδῶν (Modern Naming — Adopted 1846)',
    isAncient: false,
    orderFromSun: 8,
    semiMajorAxisAU: 30.1104,
    orbitalPeriodDays: 60189.0,
    orbitalPeriodYears: 164.79,
    siderealDayHours: 16.11,
    solarDayHours: 16.11,
    obliquityDeg: 28.32,
    gravityMPerS2: 11.15,
    surfacePressureBar: 1.0,
    meanTempC: -201,
    tempRangeC: [-215, -190],
    speedOfSoundMPerS: 600,
    solarIrradianceFraction: 0.0011,
    solarAngularDiameterDeg: 0.018,
    skyColorHex: '#2563eb',
    skyHorizonHex: '#93c5fd',
    sunsetGradientHex: ['#1d4ed8', '#1e3a8a'],
    hasOpaqueClouds: true,
    fluidDriveState: 'FREEZES',
    fluidFailureReason: 'Deep cryogenic temperature (-201°C) freezes water solid.',
    landmarks: [
      { id: 'great_dark_spot', name: 'Great Dark Spot Platform', latitude: -22.0, longitude: 0.0, description: 'Super-sonic wind field up to 600 m/s.' },
      { id: 'south_pole', name: 'South Polar Warm Spot', latitude: -88.0, longitude: 0.0, description: 'Methane leakage thermal anomaly.' }
    ],
    moons: [
      { id: 'triton', name: 'Triton', radiusKm: 1353.4, orbitalPeriodDays: 5.877, semiMajorAxisKm: 354759, isRetrograde: true, source: 'Jacobson (JPL NEP081)', theoryName: 'JPL NEP081' }
    ],
    funFact: 'Triton is the only large moon in the solar system with a retrograde orbit, captured from the Kuiper belt, moving backwards across Neptune’s sky.'
  },

  pluto: {
    id: 'pluto',
    name: 'Pluto',
    greekName: 'Πλούτων',
    ancientTitle: 'Πλούτων (Dwarf Planet IAU 2006 — Modern 1930)',
    isAncient: false,
    isDwarfPlanet: true,
    orderFromSun: 9,
    semiMajorAxisAU: 39.482,
    orbitalPeriodDays: 90560.0,
    orbitalPeriodYears: 248.00,
    siderealDayHours: -153.29, // 6.3872 days retrograde
    solarDayHours: 153.29,
    obliquityDeg: 122.53,
    gravityMPerS2: 0.62,
    surfacePressureBar: 0.00001, // 10 microbar
    meanTempC: -229,
    tempRangeC: [-233, -223],
    speedOfSoundMPerS: 0, // near vacuum
    solarIrradianceFraction: 0.00064,
    solarAngularDiameterDeg: 0.014, // pin-point Sun
    skyColorHex: '#0f172a',
    skyHorizonHex: '#1e293b',
    sunsetGradientHex: ['#334155', '#0f172a'],
    hasOpaqueClouds: false,
    fluidDriveState: 'FREEZES',
    fluidFailureReason: 'Water ice acts as structural rock at -229°C; near vacuum vaporizes any exposed liquid.',
    landmarks: [
      { id: 'sputnik_planitia', name: 'Sputnik Planitia (Heart of Pluto)', latitude: 19.5, longitude: 175.8, description: 'Nitrogen ice glacier directly facing Charon.' },
      { id: 'farside', name: 'Far-Side Hemisphere', latitude: 0.0, longitude: 0.0, description: 'Hemisphere where Charon is never visible.' }
    ],
    moons: [
      { id: 'charon', name: 'Charon', radiusKm: 606.0, orbitalPeriodDays: 6.3872, semiMajorAxisKm: 19596, isTidallyLocked: true, source: 'Brozovic et al. (JPL PLU055)', theoryName: 'JPL PLU055' }
    ],
    funFact: 'Pluto and Charon are mutually tidally locked; from Sputnik Planitia, Charon hangs permanently stationary at the exact same spot in the sky.'
  }
};
