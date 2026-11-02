export interface LifeTimelineEra {
  id: string;
  year: number;
  label: string;
  eraName: string;
  corrosionThicknessUm: number;
  volumetricExpansionPct: number;
  mineralPhase: string;
  mechanicalState: string;
  curatorialAction: string;
}

export interface FragmentProvenance {
  id: string;
  name: string;
  weightGrams: number;
  dimensionsMm: string;
  attestedGears: string[];
  inscriptions: string;
  conservationState: string;
}

export const FRAGMENT_CATALOG: FragmentProvenance[] = [
  {
    id: 'A',
    name: 'Fragment A (Main Gear Assembly)',
    weightGrams: 369.1,
    dimensionsMm: '180 × 150 × 42',
    attestedGears: ['B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'K1', 'K2'],
    inscriptions: 'Fragments of solar/lunar gearing and back dial support pillars',
    conservationState: 'Fused agglomeration with thick malachite & atacamite crust'
  },
  {
    id: 'B',
    name: 'Fragment B (Metonic Dial Spiral & Inscriptions)',
    weightGrams: 99.4,
    dimensionsMm: '125 × 60 × 20',
    attestedGears: ['N1', 'N2', 'O1'],
    inscriptions: 'Corinthian month names and Saros eclipse glyphs',
    conservationState: 'Mineralized bronze sheet with severe edge cracking'
  },
  {
    id: 'C',
    name: 'Fragment C (Zodiac Dial & Moon Phase Assembly)',
    weightGrams: 62.7,
    dimensionsMm: '120 × 110 × 15',
    attestedGears: ['B0 (Moon pointer arbor)'],
    inscriptions: 'Greek zodiac symbols (Taurus, Gemini) and Parapegma star list',
    conservationState: 'Severely oxidized plate with exposed copper core under cuprite'
  },
  {
    id: 'D',
    name: 'Fragment D (Back Cover / Gear Train E-F)',
    weightGrams: 15.2,
    dimensionsMm: '45 × 35 × 12',
    attestedGears: ['Plate bearing and contrate pinion'],
    inscriptions: 'Instructions for reading the back dials',
    conservationState: 'Highly fragile mineralized bronze flake'
  }
];

export const TIMELINE_ERAS: LifeTimelineEra[] = [
  {
    id: 'creation',
    year: -150,
    label: '150 BCE',
    eraName: 'Manufacture in Hellenistic Workshop (Rhodes or Syracuse)',
    corrosionThicknessUm: 0,
    volumetricExpansionPct: 0,
    mineralPhase: 'Uncorroded Cast Bronze (88% Cu, 12% Sn)',
    mechanicalState: 'Pristine polished gears; triangular teeth operating with <50 µm tolerance.',
    curatorialAction: 'Original fabrication and division plate indexing.'
  },
  {
    id: 'shipwreck',
    year: -70,
    label: '70 BCE',
    eraName: 'Antikythera Shipwreck Disaster',
    corrosionThicknessUm: 15,
    volumetricExpansionPct: 5,
    mineralPhase: 'Initial Anodic Chloride Attack (Nantokite CuCl)',
    mechanicalState: 'Sunk in Roman cargo vessel off Point Glyphadia, Antikythera (depth 45m).',
    curatorialAction: 'Catastrophic marine immersion.'
  },
  {
    id: 'seabed_500',
    year: 500,
    label: '500 CE',
    eraName: '500 Years Submerged in Deep Mediterranean Sediment',
    corrosionThicknessUm: 450,
    volumetricExpansionPct: 45,
    mineralPhase: 'Dense Cuprite (Cu2O) & Nantokite Hydrolysis',
    mechanicalState: 'Volumetric expansion causes adjacent gears on axle B, C, D to jam.',
    curatorialAction: 'Anaerobic benthic burial under carbonate sand.'
  },
  {
    id: 'seabed_1900',
    year: 1900,
    label: '1900 CE',
    eraName: 'Discovery by Symian Sponge Divers',
    corrosionThicknessUm: 1800,
    volumetricExpansionPct: 110,
    mineralPhase: 'Malachite Cu2CO3(OH)2 & Paratacamite Crust',
    mechanicalState: 'Gears fused solid into rock-like calcified conglomerate.',
    curatorialAction: 'Recovered by Elias Stadiatis & Captain Dimitrios Kondos.'
  },
  {
    id: 'modern_ct',
    year: 2026,
    label: '2026 CE',
    eraName: 'National Archaeological Museum & Micro-CT Tomography',
    corrosionThicknessUm: 1800,
    volumetricExpansionPct: 110,
    mineralPhase: 'Stabilized Heritage Bronze under Desiccated Nitrogen',
    mechanicalState: 'Preserved in 82 fragments; digitized via 3D X-ray tomography.',
    curatorialAction: 'Non-destructive CT scanning & virtual kinematic reconstruction.'
  }
];

export class LifeOfObjectEngine {
  public static getEras(): LifeTimelineEra[] {
    return TIMELINE_ERAS;
  }

  public static getEraForYear(year: number): LifeTimelineEra {
    if (year <= -70) return TIMELINE_ERAS[0];
    if (year <= 0) return TIMELINE_ERAS[1];
    if (year <= 1500) return TIMELINE_ERAS[2];
    if (year < 1950) return TIMELINE_ERAS[3];
    return TIMELINE_ERAS[4];
  }
}

export { TIMELINE_ERAS as LIFE_TIMELINE };
