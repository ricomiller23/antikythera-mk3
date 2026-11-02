export type VeracityStatus = 'ATTESTED' | 'INFERRED' | 'CONJECTURAL' | 'SPECULATIVE-NEW';
export type FeasibilityTier = 'TIER_1_HELLENISTIC' | 'TIER_2_MEDIEVAL' | 'TIER_3_IDEAL';
export type SubsystemType = 
  | 'DRIVE' 
  | 'SOLAR' 
  | 'LUNAR' 
  | 'NODAL_DRACONIC' 
  | 'ECLIPSE_STAGE' 
  | 'PLANETARY' 
  | 'PRECESSIONAL' 
  | 'ANAPHORIC_SKY' 
  | 'PIN_DRUM_GONG' 
  | 'CALENDAR_CYCLES' 
  | 'COMETS_OVERLAY';

export interface GearMk2Definition {
  id: string;
  name: string;
  teeth: number;
  pitchRadius: number;
  axle: string;
  axialZ: number;
  subsystem: SubsystemType;
  parentGearId?: string;
  ratioFromParent?: number;
  ratioToInput?: number;
  thickness?: number;
  status: VeracityStatus;
  tier: FeasibilityTier;
  precedent: string;
  feasibilityRating: string;
  description: string;
}

export const MK2_GEAR_CATALOG: GearMk2Definition[] = [
  // --- MK I BASELINE (ATTESTED / INFERRED / CONJECTURAL) ---
  {
    id: 'B1',
    name: 'Contrate Crown Wheel B1',
    teeth: 48,
    pitchRadius: 24.0,
    axle: 'B',
    axialZ: 0.0,
    subsystem: 'DRIVE',
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (AMRP / Price 1974)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Primary input crown gear meshed with input crank arbor.'
  },
  {
    id: 'B2',
    name: 'Great Sun Wheel B2',
    teeth: 64,
    pitchRadius: 32.0,
    axle: 'B',
    axialZ: 4.0,
    subsystem: 'SOLAR',
    parentGearId: 'B1',
    ratioFromParent: 1.0,
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (AMRP 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Main solar drive gear; rotates once per tropical year.'
  },
  {
    id: 'C1',
    name: 'Compound Arbor Pinion C1',
    teeth: 38,
    pitchRadius: 19.0,
    axle: 'C',
    axialZ: 4.0,
    subsystem: 'LUNAR',
    parentGearId: 'B2',
    ratioFromParent: -64 / 38,
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Engages B2; transfers solar drive to axle C.'
  },
  {
    id: 'C2',
    name: 'Compound Wheel C2',
    teeth: 48,
    pitchRadius: 24.0,
    axle: 'C',
    axialZ: 8.0,
    subsystem: 'LUNAR',
    parentGearId: 'C1',
    ratioFromParent: 1.0,
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Fixed to C1; drives D1.'
  },
  {
    id: 'D1',
    name: 'Intermediate Pinion D1',
    teeth: 24,
    pitchRadius: 12.0,
    axle: 'D',
    axialZ: 8.0,
    subsystem: 'LUNAR',
    parentGearId: 'C2',
    ratioFromParent: -48 / 24,
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Engages C2; step-up pinion on axle D.'
  },
  {
    id: 'D2',
    name: 'Intermediate Wheel D2',
    teeth: 127,
    pitchRadius: 63.5,
    axle: 'D',
    axialZ: 12.0,
    subsystem: 'LUNAR',
    parentGearId: 'D1',
    ratioFromParent: 1.0,
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Prime-factor 127 wheel encoding 254 sidereal months.'
  },
  {
    id: 'E2',
    name: 'Epicyclic Sun/Moon Pinion E2',
    teeth: 32,
    pitchRadius: 16.0,
    axle: 'E',
    axialZ: 12.0,
    subsystem: 'LUNAR',
    parentGearId: 'D2',
    ratioFromParent: -127 / 32,
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Final sidereal Moon driver: (64/38)*(48/24)*(127/32) = 254/19.'
  },
  {
    id: 'E3',
    name: 'Turntable Wheel E3',
    teeth: 223,
    pitchRadius: 111.5,
    axle: 'E',
    axialZ: -6.0,
    subsystem: 'LUNAR',
    parentGearId: 'E2',
    status: 'CONJECTURAL',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Wright (2005) & Freeth (2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Rotating turntable precessing lunar apogee once in 8.85 years.'
  },
  {
    id: 'K1',
    name: 'Pin Wheel K1',
    teeth: 50,
    pitchRadius: 25.0,
    axle: 'K',
    axialZ: -10.0,
    subsystem: 'LUNAR',
    parentGearId: 'E3',
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Carries bronze driving pin on rotating turntable E3.'
  },
  {
    id: 'K2',
    name: 'Slotted Wheel K2',
    teeth: 50,
    pitchRadius: 25.0,
    axle: 'K_eccentric',
    axialZ: -14.0,
    subsystem: 'LUNAR',
    parentGearId: 'K1',
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2006)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Slotted wheel eccentric by 1.1mm; generates Hipparchan 1st lunar anomaly.'
  },
  {
    id: 'N1',
    name: 'Metonic Drive Pinion N1',
    teeth: 15,
    pitchRadius: 7.5,
    axle: 'N',
    axialZ: 6.0,
    subsystem: 'CALENDAR_CYCLES',
    status: 'INFERRED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment B (Freeth 2008)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Drives Metonic 235-month 5-turn spiral dial.'
  },
  {
    id: 'G1',
    name: 'Saros Drive Wheel G1',
    teeth: 54,
    pitchRadius: 27.0,
    axle: 'G',
    axialZ: -18.0,
    subsystem: 'CALENDAR_CYCLES',
    status: 'ATTESTED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2008)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Drives Saros 223-month 4-turn eclipse spiral dial.'
  },
  {
    id: 'I1',
    name: 'Exeligmos Wheel I1',
    teeth: 60,
    pitchRadius: 30.0,
    axle: 'I',
    axialZ: -24.0,
    subsystem: 'CALENDAR_CYCLES',
    status: 'INFERRED',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Fragment A (Freeth 2008)',
    feasibilityRating: 'HISTORICAL ARTIFACT',
    description: 'Drives Exeligmos 54-year subdial (+0h, +8h, +16h).'
  },

  // --- MK II SPECULATIVE EXTRAPOLATIONS (SPECULATIVE-NEW) ---
  // 1. Ctesibian Clepsydra Hydraulic Drive Subsystem
  {
    id: 'W1',
    name: 'Clepsydra Diurnal Pinion W1',
    teeth: 12,
    pitchRadius: 6.0,
    axle: 'W',
    axialZ: 28.0,
    subsystem: 'DRIVE',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Vitruvius IX.8; Ctesibius of Alexandria c.250 BCE',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Engaged by linear float rack; executes exactly 1 revolution per 24 hours.'
  },
  {
    id: 'W2',
    name: 'Day-to-Year Step-Down Wheel W2',
    teeth: 48,
    pitchRadius: 24.0,
    axle: 'W',
    axialZ: 32.0,
    subsystem: 'DRIVE',
    parentGearId: 'W1',
    ratioFromParent: 1.0,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Vitruvius IX.8 & Heron Pneumatica',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Compound wheel on diurnal arbor driving annual reduction train.'
  },
  {
    id: 'W3',
    name: 'Annual Reduction Pinion W3',
    teeth: 12,
    pitchRadius: 6.0,
    axle: 'WA',
    axialZ: 32.0,
    subsystem: 'DRIVE',
    parentGearId: 'W2',
    ratioFromParent: -48 / 12,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Heron Automata',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Step-up transfer pinion in clepsydra transmission.'
  },
  {
    id: 'W4',
    name: 'Calendar Sync Wheel W4',
    teeth: 73,
    pitchRadius: 36.5,
    axle: 'WA',
    axialZ: 36.0,
    subsystem: 'DRIVE',
    parentGearId: 'W3',
    ratioFromParent: 1.0,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Archimedes / Vitruvius',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Prime factor 73 (73 * 5 = 365) encoding the 365-day Egyptian year.'
  },
  {
    id: 'W5',
    name: 'Clepsydra Master Clutch Pinion W5',
    teeth: 15,
    pitchRadius: 7.5,
    axle: 'B',
    axialZ: 28.0,
    subsystem: 'DRIVE',
    parentGearId: 'W4',
    ratioFromParent: -73 / 15,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ctesibian gear-train extrapolation',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Engages B1 via dog clutch when hydraulic water drive is activated.'
  },

  // 2. Draconic Nodal & Lunar Latitude Subsystem
  {
    id: 'ND1',
    name: 'Draconic Differential Input ND1',
    teeth: 59,
    pitchRadius: 29.5,
    axle: 'ND',
    axialZ: -28.0,
    subsystem: 'NODAL_DRACONIC',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemy Almagest IV.6; Richard of Wallingford Albion',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Derived from Saros relation: 223 synodic = 242 draconic months.'
  },
  {
    id: 'ND2',
    name: 'Nodal Precession Wheel ND2',
    teeth: 54,
    pitchRadius: 27.0,
    axle: 'ND_node',
    axialZ: -32.0,
    subsystem: 'NODAL_DRACONIC',
    parentGearId: 'ND1',
    ratioFromParent: -59 / 54,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemaic eclipse theory',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Drives retrograde lunar node arbor (1 rev in 18.613 years).'
  },
  {
    id: 'ND_CAM',
    name: 'Inclined Latitude Swashplate ND_CAM',
    teeth: 0,
    pitchRadius: 20.0,
    axle: 'ND_node',
    axialZ: -36.0,
    subsystem: 'NODAL_DRACONIC',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemy Almagest V.13 & Heron Pneumatica linkages',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Swashplate tilted at 5.145 deg; generates true physical lunar latitude.'
  },

  // 3. Precession Differential Subsystem
  {
    id: 'PR1',
    name: 'Precession Worm Arbor PR1',
    teeth: 1,
    pitchRadius: 5.0,
    axle: 'PR_worm',
    axialZ: 42.0,
    subsystem: 'PRECESSIONAL',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Hipparchus On the Displacement of the Solstices c.130 BCE',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Worm gear driven by century reduction train.'
  },
  {
    id: 'PR2',
    name: 'Precession Century Wheel PR2',
    teeth: 100,
    pitchRadius: 50.0,
    axle: 'PR_century',
    axialZ: 42.0,
    subsystem: 'PRECESSIONAL',
    parentGearId: 'PR1',
    ratioFromParent: 1 / 100,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemy Almagest VII.2 (1 deg per century)',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Rotates 1 rev in 100 tropical years.'
  },
  {
    id: 'PR3',
    name: 'Precession Differential Ring PR3',
    teeth: 360,
    pitchRadius: 120.0,
    axle: 'B',
    axialZ: 46.0,
    subsystem: 'PRECESSIONAL',
    parentGearId: 'PR2',
    ratioFromParent: 1 / 360,
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Hipparchus / Ptolemy celestial globe precession',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: 'Precesses anaphoric star rete against tropical zodiac (1 deg / 100y or 1 deg / 72y).'
  },

  // 4. Ptolemaic Equant & Planetary Latitude Subsystems
  {
    id: 'EQ_MARS',
    name: 'Mars Equant Pin-and-Slot EQ_MARS',
    teeth: 79,
    pitchRadius: 39.5,
    axle: 'EQ_mars',
    axialZ: 22.0,
    subsystem: 'PLANETARY',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemy Almagest IX.5; Dondi Astrarium',
    feasibilityRating: 'FEASIBLE c.200 CE',
    description: 'Double pin-and-slot with 2e eccentricity offset solving Mars non-uniformity.'
  },
  {
    id: 'EQ_JUP',
    name: 'Jupiter Equant Pin-and-Slot EQ_JUP',
    teeth: 83,
    pitchRadius: 41.5,
    axle: 'EQ_jup',
    axialZ: 24.0,
    subsystem: 'PLANETARY',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemy Almagest IX.5',
    feasibilityRating: 'FEASIBLE c.200 CE',
    description: 'Jupiter equant linkage; reproduces 12-year synodic cycle with true anomaly.'
  },
  {
    id: 'EQ_SAT',
    name: 'Saturn Equant Pin-and-Slot EQ_SAT',
    teeth: 59,
    pitchRadius: 29.5,
    axle: 'EQ_sat',
    axialZ: 26.0,
    subsystem: 'PLANETARY',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Ptolemy Almagest IX.5',
    feasibilityRating: 'FEASIBLE c.200 CE',
    description: 'Saturn equant linkage; reproduces 29.5-year cycle with true anomaly.'
  },

  // 5. Heron / al-Jazari Programmable Pin Drum & Acoustic Gong
  {
    id: 'DRUM_MAIN',
    name: 'Programmable Pin Drum DRUM_MAIN',
    teeth: 72,
    pitchRadius: 36.0,
    axle: 'DRUM',
    axialZ: 50.0,
    subsystem: 'PIN_DRUM_GONG',
    status: 'SPECULATIVE-NEW',
    tier: 'TIER_1_HELLENISTIC',
    precedent: 'Heron Automata & al-Jazari Castle Clock',
    feasibilityRating: 'FEASIBLE c.100 BCE',
    description: '12-track bronze barrel with interchangeable pegs tripping bronze gong hammer.'
  }
];
