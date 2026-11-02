export interface AncientStar {
  id: string;
  name: string;
  greekName: string;
  constellation: string;
  mag: number;
  // Epoch J2000 coordinates (deg)
  ra: number;
  dec: number;
  eclLon: number;
  eclLat: number;
}

export const PTOLEMAIC_STARS: AncientStar[] = [
  { id: 'sirius', name: 'Sirius', greekName: 'Σείριος', constellation: 'Canis Major', mag: -1.46, ra: 101.287, dec: -16.716, eclLon: 104.2, eclLat: -39.6 },
  { id: 'canopus', name: 'Canopus', greekName: 'Κάνωβος', constellation: 'Carina', mag: -0.74, ra: 95.988, dec: -52.696, eclLon: 105.0, eclLat: -75.8 },
  { id: 'arcturus', name: 'Arcturus', greekName: 'Ἀρκτοῦρος', constellation: 'Bootes', mag: -0.05, ra: 213.915, dec: 19.182, eclLon: 204.2, eclLat: 30.7 },
  { id: 'vega', name: 'Vega', greekName: 'Βέγας (Λύρα)', constellation: 'Lyra', mag: 0.03, ra: 279.234, dec: 38.784, eclLon: 284.8, eclLat: 61.7 },
  { id: 'capella', name: 'Capella', greekName: 'Αἴξ (Αἰγοκέρως)', constellation: 'Auriga', mag: 0.08, ra: 79.172, dec: 45.998, eclLon: 81.9, eclLat: 22.8 },
  { id: 'rigel', name: 'Rigel', greekName: 'Ῥίγελ', constellation: 'Orion', mag: 0.13, ra: 78.634, dec: -8.202, eclLon: 76.9, eclLat: -31.1 },
  { id: 'procyon', name: 'Procyon', greekName: 'Προκύων', constellation: 'Canis Minor', mag: 0.38, ra: 114.825, dec: 5.225, eclLon: 115.8, eclLat: -16.0 },
  { id: 'betelgeuse', name: 'Betelgeuse', greekName: 'Βετελγόζ', constellation: 'Orion', mag: 0.50, ra: 88.793, dec: 7.407, eclLon: 88.8, eclLat: -16.0 },
  { id: 'aldebaran', name: 'Aldebaran', greekName: 'Λαμπαδίας (Ταῦρος)', constellation: 'Taurus', mag: 0.85, ra: 68.980, dec: 16.509, eclLon: 69.8, eclLat: -5.5 },
  { id: 'spica', name: 'Spica', greekName: 'Στάχυς', constellation: 'Virgo', mag: 0.98, ra: 201.298, dec: -11.161, eclLon: 203.8, eclLat: -2.0 },
  { id: 'antares', name: 'Antares', greekName: 'Ἀντάρης', constellation: 'Scorpius', mag: 1.06, ra: 247.352, dec: -26.432, eclLon: 249.8, eclLat: -4.6 },
  { id: 'pollux', name: 'Pollux', greekName: 'Πολυδεύκης', constellation: 'Gemini', mag: 1.14, ra: 116.329, dec: 28.026, eclLon: 113.2, eclLat: 6.7 },
  { id: 'fomalhaut', name: 'Fomalhaut', greekName: 'Φομαλώ', constellation: 'Piscis Austrinus', mag: 1.16, ra: 344.413, dec: -29.622, eclLon: 343.9, eclLat: -21.1 },
  { id: 'deneb', name: 'Deneb', greekName: 'Κύκνος (Οὐρά)', constellation: 'Cygnus', mag: 1.25, ra: 310.358, dec: 45.280, eclLon: 335.8, eclLat: 60.0 },
  { id: 'regulus', name: 'Regulus', greekName: 'Βασιλίσκος', constellation: 'Leo', mag: 1.36, ra: 152.093, dec: 11.967, eclLon: 149.8, eclLat: 0.5 },
  { id: 'castor', name: 'Castor', greekName: 'Κάστωρ', constellation: 'Gemini', mag: 1.58, ra: 113.650, dec: 31.888, eclLon: 110.2, eclLat: 10.1 },
  { id: 'bellatrix', name: 'Bellatrix', greekName: 'Ἀμαζών', constellation: 'Orion', mag: 1.64, ra: 81.283, dec: 6.350, eclLon: 81.0, eclLat: -16.8 },
  { id: 'polaris', name: 'Polaris (Kynosoura)', greekName: 'Κυνόσουρα', constellation: 'Ursa Minor', mag: 1.98, ra: 37.955, dec: 89.264, eclLon: 88.4, eclLat: 66.1 }
];

export interface LatitudePreset {
  id: string;
  name: string;
  latitude: number; // deg North
  longitude: number;// deg East
  significance: string;
}

export const ANCIENT_LATITUDE_PRESETS: LatitudePreset[] = [
  { id: 'alexandria', name: 'Alexandria (Egypt)', latitude: 31.20, longitude: 29.92, significance: 'Ctesibius, Heron & Ptolemy\'s Library observatory' },
  { id: 'rhodes', name: 'Rhodes (Greece)', latitude: 36.43, longitude: 28.22, significance: 'Hipparchus & Posidonius astronomical school' },
  { id: 'athens', name: 'Athens (Greece)', latitude: 37.98, longitude: 23.73, significance: 'Meton & Andronikos\' Tower of the Winds' },
  { id: 'syracuse', name: 'Syracuse (Sicily)', latitude: 37.08, longitude: 15.28, significance: 'Archimedes\' mechanical planetarium' },
  { id: 'babylon', name: 'Babylon (Mesopotamia)', latitude: 32.54, longitude: 44.42, significance: 'Chaldean goal-year & Saros observations' }
];
