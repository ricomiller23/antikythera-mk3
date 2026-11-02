export interface HorizonObstruction {
  azimuthDeg: number; // 0 = North, 90 = East, 180 = South, 270 = West
  altitudeDeg: number;// obstruction altitude in degrees
}

export interface SiteDefinition {
  id: string;
  name: string;
  ancientName?: string;
  latitude: number;   // deg North (-90 to +90)
  longitude: number;  // deg East (-180 to +180)
  elevationMeters: number;
  significance: string;
  source: string;
  horizonType: 'sea' | 'flat' | 'mountain' | 'custom';
  customHorizon?: HorizonObstruction[];
}

export const GAZETTEER_SITES: SiteDefinition[] = [
  {
    id: 'antikythera',
    name: 'Antikythera Island',
    ancientName: 'Αἰγιλία (Aigilia)',
    latitude: 35.861,
    longitude: 23.305,
    elevationMeters: 40,
    significance: 'Shipwreck recovery site of the original mechanism (1900-1901).',
    source: 'Hellenic Navy Hydrographic Service / AMRP',
    horizonType: 'sea'
  },
  {
    id: 'rhodes',
    name: 'Rhodes',
    ancientName: 'Ῥόδος',
    latitude: 36.433,
    longitude: 28.217,
    elevationMeters: 15,
    significance: 'Astronomical school of Hipparchus and Posidonius.',
    source: 'Ptolemy Almagest & Strabo Geographica XIV.2',
    horizonType: 'sea'
  },
  {
    id: 'alexandria',
    name: 'Alexandria',
    ancientName: 'Ἀλεξάνδρεια',
    latitude: 31.200,
    longitude: 29.917,
    elevationMeters: 5,
    significance: 'Library of Alexandria; Ctesibius, Heron, and Claudius Ptolemy.',
    source: 'Ptolemy Almagest & Vitruvius De Architectura',
    horizonType: 'sea'
  },
  {
    id: 'athens',
    name: 'Athens',
    ancientName: 'Ἀθῆναι',
    latitude: 37.971,
    longitude: 23.726,
    elevationMeters: 70,
    significance: 'Tower of the Winds (Andronikos of Kyrrhos) & Meton\'s Pnyx observatory.',
    source: 'Vitruvius IX.8 & Pausanias Description of Greece I.28',
    horizonType: 'flat'
  },
  {
    id: 'olympia',
    name: 'Olympia',
    ancientName: 'Ὀλυμπία',
    latitude: 37.638,
    longitude: 21.630,
    elevationMeters: 45,
    significance: 'Sanctuary of Zeus and quadrennial Olympic Games dial cycle.',
    source: 'Pausanias V.10 & Antikythera Games Dial reading (Jones 2016)',
    horizonType: 'flat'
  },
  {
    id: 'delphi',
    name: 'Delphi',
    ancientName: 'Δελφοί',
    latitude: 38.482,
    longitude: 22.501,
    elevationMeters: 570,
    significance: 'Pythian Games sanctuary (Year 3 on the Games dial).',
    source: 'Pausanias X.5 & Antikythera Games Dial',
    horizonType: 'mountain'
  },
  {
    id: 'syracuse',
    name: 'Syracuse',
    ancientName: 'Συράκουσαι',
    latitude: 37.067,
    longitude: 15.283,
    elevationMeters: 15,
    significance: 'Mechanical planetarium sphere of Archimedes.',
    source: 'Cicero De Re Publica I.14 & Ovid Fasti VI',
    horizonType: 'sea'
  },
  {
    id: 'rome',
    name: 'Rome',
    ancientName: 'Roma',
    latitude: 41.893,
    longitude: 12.492,
    elevationMeters: 21,
    significance: 'Vitruvius water clocks and Julian calendar reform of 46 BCE.',
    source: 'Vitruvius IX.8 & Suetonius Divus Julius 40',
    horizonType: 'flat'
  },
  {
    id: 'carthage',
    name: 'Carthage',
    ancientName: 'Qart-ḥadašt',
    latitude: 36.853,
    longitude: 10.323,
    elevationMeters: 20,
    significance: 'Phoenician/Punic navigational astronomy center.',
    source: 'Appian Punic Wars & Pliny Natural History',
    horizonType: 'sea'
  },
  {
    id: 'babylon',
    name: 'Babylon',
    ancientName: 'Bābili',
    latitude: 32.536,
    longitude: 44.421,
    elevationMeters: 28,
    significance: 'Astronomical Diaries (Sachs-Hunger), Saros cycle records.',
    source: 'British Museum cuneiform tablets & Ptolemy Almagest',
    horizonType: 'flat'
  },
  {
    id: 'uruk',
    name: 'Uruk',
    ancientName: 'Unug',
    latitude: 31.322,
    longitude: 45.667,
    elevationMeters: 18,
    significance: 'Late Babylonian / Seleucid mathematical astronomy.',
    source: 'Neugebauer ACT (Astronomical Cuneiform Texts)',
    horizonType: 'flat'
  },
  {
    id: 'giza',
    name: 'Giza',
    ancientName: 'Rostau',
    latitude: 29.979,
    longitude: 31.134,
    elevationMeters: 65,
    significance: 'Cardinal pyramid astronomical alignments.',
    source: 'Petrie & Spence (Nature 2000)',
    horizonType: 'flat'
  },
  {
    id: 'stonehenge',
    name: 'Stonehenge',
    latitude: 51.179,
    longitude: -1.826,
    elevationMeters: 102,
    significance: 'Megalithic midsummer sunrise & midwinter sunset alignment.',
    source: 'Hawkins Stonehenge Decoded & English Heritage',
    horizonType: 'flat'
  },
  {
    id: 'miletus',
    name: 'Miletus',
    ancientName: 'Μίλητος',
    latitude: 37.530,
    longitude: 27.278,
    elevationMeters: 10,
    significance: 'Thales, Anaximander, and early Ionian parapegmata.',
    source: 'Diels-Kranz Die Fragmente der Vorsokratiker',
    horizonType: 'sea'
  }
];

export class SharedSiteManager {
  private currentSite: SiteDefinition;
  private listeners: ((site: SiteDefinition) => void)[] = [];

  constructor(defaultSiteId: string = 'rhodes') {
    this.currentSite = GAZETTEER_SITES.find(s => s.id === defaultSiteId) || GAZETTEER_SITES[1];
  }

  public getSite(): SiteDefinition {
    return this.currentSite;
  }

  public setSiteById(siteId: string) {
    const s = GAZETTEER_SITES.find(item => item.id === siteId);
    if (s) {
      this.currentSite = s;
      this.notifyListeners();
    }
  }

  public setCustomCoordinates(lat: number, lon: number, name: string = 'Custom Site', elev: number = 0) {
    this.currentSite = {
      id: 'custom',
      name,
      latitude: Math.max(-90, Math.min(90, lat)),
      longitude: Math.max(-180, Math.min(180, lon)),
      elevationMeters: elev,
      significance: 'User-specified geographic coordinates',
      source: 'User Input',
      horizonType: 'flat'
    };
    this.notifyListeners();
  }

  public subscribe(fn: (site: SiteDefinition) => void) {
    this.listeners.push(fn);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.currentSite));
  }
}

// Convenience aliases and singleton instance
export const ANCIENT_GAZETTEER = GAZETTEER_SITES;

export class SiteManagerProxy extends SharedSiteManager {
  public getCurrentSite(): SiteDefinition {
    return this.getSite();
  }
  public selectGazetteerSite(id: string) {
    this.setSiteById(id);
  }
  public setCustomSite(lat: number, lon: number, name: string = 'Custom Site') {
    this.setCustomCoordinates(lat, lon, name);
  }
  public onSiteChange(fn: (site: SiteDefinition) => void) {
    this.subscribe(fn);
  }
}

export const siteManager = new SiteManagerProxy();
