export interface CometOrbitalElements {
  id: string;
  name: string;
  designation: string;
  semiMajorAxisAU: number; // a
  eccentricity: number;    // e
  inclinationDeg: number;  // i
  longitudeAscendingNodeDeg: number; // Omega
  argumentPerihelionDeg: number;     // omega
  periodYears: number;
  perihelionDistanceAU: number; // q = a * (1 - e)
  lastPerihelionDate: string;
  nextPerihelionDate: string;
  historicApparitionsBCE: Array<{ yearBCE: number; record: string }>;
  colorHex: string;
  notes: string;
}

export const MODERN_COMET_OVERLAYS: CometOrbitalElements[] = [
  {
    id: '1p-halley',
    name: '1P/Halley',
    designation: 'Halley\'s Comet',
    semiMajorAxisAU: 17.834,
    eccentricity: 0.96714,
    inclinationDeg: 162.26,
    longitudeAscendingNodeDeg: 58.42,
    argumentPerihelionDeg: 111.33,
    periodYears: 75.32,
    perihelionDistanceAU: 0.586,
    lastPerihelionDate: '1986-02-09',
    nextPerihelionDate: '2061-07-28',
    historicApparitionsBCE: [
      { yearBCE: 240, record: 'First recorded sighting in Chinese Shiji (Records of the Grand Historian)' },
      { yearBCE: 164, record: 'Babylonian astronomical diary tablet (British Museum BM 41462 / LBAT 1437)' },
      { yearBCE: 87, record: 'Babylonian cuneiform tablet BM 41628; Roman omen' },
      { yearBCE: 12, record: 'Observed by Dio Cassius in Rome before Agrippa\'s death' }
    ],
    colorHex: '#38bdf8',
    notes: 'Historic retrograde comet with verified ancient Mesopotamian observations during the Antikythera era.'
  },
  {
    id: '2p-encke',
    name: '2P/Encke',
    designation: 'Encke\'s Comet',
    semiMajorAxisAU: 2.215,
    eccentricity: 0.848,
    inclinationDeg: 11.78,
    longitudeAscendingNodeDeg: 334.57,
    argumentPerihelionDeg: 186.54,
    periodYears: 3.30,
    perihelionDistanceAU: 0.336,
    lastPerihelionDate: '2023-10-22',
    nextPerihelionDate: '2027-02-08',
    historicApparitionsBCE: [],
    colorHex: '#34d399',
    notes: 'Shortest known orbital period of any comet in the solar system; parent body of Taurid meteor stream.'
  },
  {
    id: '109p-swift-tuttle',
    name: '109P/Swift-Tuttle',
    designation: 'Swift-Tuttle',
    semiMajorAxisAU: 26.09,
    eccentricity: 0.963,
    inclinationDeg: 113.45,
    longitudeAscendingNodeDeg: 139.44,
    argumentPerihelionDeg: 153.00,
    periodYears: 133.28,
    perihelionDistanceAU: 0.958,
    lastPerihelionDate: '1992-12-12',
    nextPerihelionDate: '2126-07-12',
    historicApparitionsBCE: [
      { yearBCE: 68, record: 'Chinese Book of Han records a broom star passing during the Han Dynasty' }
    ],
    colorHex: '#fbbf24',
    notes: 'Parent of the Perseid meteor shower; largest solar system object making repeated close passes to Earth.'
  },
  {
    id: 'c1995-o1-hale-bopp',
    name: 'C/1995 O1',
    designation: 'Hale-Bopp',
    semiMajorAxisAU: 186.0,
    eccentricity: 0.995,
    inclinationDeg: 89.4,
    longitudeAscendingNodeDeg: 282.47,
    argumentPerihelionDeg: 130.59,
    periodYears: 2534.0,
    perihelionDistanceAU: 0.914,
    lastPerihelionDate: '1997-04-01',
    nextPerihelionDate: '4531-01-01',
    historicApparitionsBCE: [
      { yearBCE: 2215, record: 'Estimated previous perihelion in early Bronze Age / 6th Dynasty of Egypt' }
    ],
    colorHex: '#f43f5e',
    notes: 'One of the brightest and most observed comets of the 20th century.'
  }
];
