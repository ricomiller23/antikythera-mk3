import { PlanetId, PLANETS_DATA, PlanetDefinition, PlanetLandmark } from '../data/planetsData.ts';

export type EngineMode = 'TRANSPLANT' | 'NATIVE';
export type AcousticsMode = 'REALISTIC' | 'FUN';

export interface VantageSite {
  id: string;
  name: string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationMeters: number;
  isPlanetocentric: boolean;
  isEastLongitude: boolean;
}

export interface VantageState {
  bodyId: PlanetId;
  planet: PlanetDefinition;
  site: VantageSite;
  engineMode: EngineMode;
  cloudPierce: boolean;
  acousticsMode: AcousticsMode;
  opticalDepthDust: number; // For Mars: 0.1 to 3.0
  isFictionalMode: boolean; // true for any non-Earth world
}

export class SharedVantageManager {
  private currentBodyId: PlanetId = 'earth';
  private currentMode: EngineMode = 'TRANSPLANT';
  private currentSite: VantageSite;
  private cloudPierce: boolean = false;
  private acousticsMode: AcousticsMode = 'REALISTIC';
  private opticalDepthDust: number = 0.5;

  // Saved prior Earth site state
  private savedEarthSite: VantageSite;
  private listeners: ((state: VantageState) => void)[] = [];

  constructor() {
    const earthDef = PLANETS_DATA.earth;
    this.savedEarthSite = {
      id: earthDef.landmarks[0].id,
      name: earthDef.landmarks[0].name,
      latitudeDeg: earthDef.landmarks[0].latitude,
      longitudeDeg: earthDef.landmarks[0].longitude,
      elevationMeters: 15,
      isPlanetocentric: true,
      isEastLongitude: true
    };
    this.currentSite = { ...this.savedEarthSite };

    this.initFromHash();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => this.initFromHash());
    }
  }

  public getState(): VantageState {
    const planet = PLANETS_DATA[this.currentBodyId];
    return {
      bodyId: this.currentBodyId,
      planet,
      site: this.currentSite,
      engineMode: this.currentMode,
      cloudPierce: this.cloudPierce,
      acousticsMode: this.acousticsMode,
      opticalDepthDust: this.opticalDepthDust,
      isFictionalMode: this.currentBodyId !== 'earth'
    };
  }

  public setBody(bodyId: PlanetId) {
    if (this.currentBodyId === bodyId) return;

    if (this.currentBodyId === 'earth') {
      this.savedEarthSite = { ...this.currentSite };
    }

    this.currentBodyId = bodyId;
    const planet = PLANETS_DATA[bodyId];

    if (bodyId === 'earth') {
      this.currentSite = { ...this.savedEarthSite };
    } else {
      const defaultLandmark = planet.landmarks[0] || {
        id: 'center',
        name: `${planet.name} Equator`,
        latitude: 0,
        longitude: 0,
        description: 'Default coordinate origin'
      };
      this.currentSite = {
        id: defaultLandmark.id,
        name: defaultLandmark.name,
        latitudeDeg: defaultLandmark.latitude,
        longitudeDeg: defaultLandmark.longitude,
        elevationMeters: 0,
        isPlanetocentric: true,
        isEastLongitude: true
      };
    }

    this.updateHash();
    this.notify();
  }

  public setEngineMode(mode: EngineMode) {
    this.currentMode = mode;
    this.updateHash();
    this.notify();
  }

  public setSite(siteOrLandmark: PlanetLandmark | VantageSite) {
    const lat = 'latitude' in siteOrLandmark ? siteOrLandmark.latitude : (siteOrLandmark as VantageSite).latitudeDeg;
    const lon = 'longitude' in siteOrLandmark ? siteOrLandmark.longitude : (siteOrLandmark as VantageSite).longitudeDeg;
    this.currentSite = {
      id: siteOrLandmark.id,
      name: siteOrLandmark.name,
      latitudeDeg: lat ?? 0,
      longitudeDeg: lon ?? 0,
      elevationMeters: ('elevationMeters' in siteOrLandmark ? siteOrLandmark.elevationMeters : 0) ?? 0,
      isPlanetocentric: true,
      isEastLongitude: true
    };
    this.updateHash();
    this.notify();
  }

  public setCloudPierce(enabled: boolean) {
    this.cloudPierce = enabled;
    this.notify();
  }

  public setAcousticsMode(mode: AcousticsMode) {
    this.acousticsMode = mode;
    this.notify();
  }

  public setDustOpticalDepth(tau: number) {
    this.opticalDepthDust = Math.max(0.1, Math.min(3.0, tau));
    this.notify();
  }

  public onVantageChange(cb: (state: VantageState) => void) {
    this.listeners.push(cb);
    cb(this.getState());
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach(fn => fn(s));
  }

  private updateHash() {
    if (typeof window === 'undefined') return;
    const hash = `#planet=${this.currentBodyId}&mode=${this.currentMode.toLowerCase()}&site=${this.currentSite.id}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash);
    }
  }

  private initFromHash() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || !hash.includes('planet=')) return;

    const params = new URLSearchParams(hash.substring(1));
    const p = params.get('planet') as PlanetId;
    const mode = params.get('mode');
    const siteId = params.get('site');

    if (p && PLANETS_DATA[p]) {
      this.currentBodyId = p;
      if (mode === 'native') this.currentMode = 'NATIVE';
      else if (mode === 'transplant') this.currentMode = 'TRANSPLANT';

      const planet = PLANETS_DATA[p];
      if (siteId) {
        const found = planet.landmarks.find(l => l.id === siteId);
        if (found) {
          this.currentSite = {
            id: found.id,
            name: found.name,
            latitudeDeg: found.latitude,
            longitudeDeg: found.longitude,
            elevationMeters: 0,
            isPlanetocentric: true,
            isEastLongitude: true
          };
        }
      }
      this.notify();
    }
  }
}

export const vantageManager = new SharedVantageManager();
