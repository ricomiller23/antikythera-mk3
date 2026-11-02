import { describe, it, expect, beforeEach } from 'vitest';
import { PLANETS_DATA, PlanetId } from '../data/planetsData.ts';
import { SharedVantageManager } from '../vantage/vantageManager.ts';
import { PlanetSkyEngine } from '../sky/planetSkyEngine.ts';

describe('Antikythera Mk III Planet Mode & Vantage Abstraction Verification Suite', () => {
  let vantage: SharedVantageManager;

  beforeEach(() => {
    vantage = new SharedVantageManager();
  });

  describe('1. IAU WGCCRE Planetary Data & Ephemeris Constants', () => {
    const requiredPlanets: PlanetId[] = [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto'
    ];

    it('contains all 9 planetary bodies with complete physics constants', () => {
      requiredPlanets.forEach(pId => {
        const p = PLANETS_DATA[pId];
        expect(p).toBeDefined();
        expect(p.name).toBeTruthy();
        expect(p.greekName).toBeTruthy();
        expect(p.gravityMPerS2).toBeGreaterThan(0);
        expect(p.orbitalPeriodDays).toBeGreaterThan(0);
        expect(p.landmarks.length).toBeGreaterThan(0);
      });
    });

    it('validates Mars solar day (sol) is 24.6597 hours (within 0.01h)', () => {
      const mars = PLANETS_DATA.mars;
      expect(mars.solarDayHours).toBeCloseTo(24.6597, 2);
      expect(mars.orbitalPeriodDays).toBeCloseTo(686.98, 1);
    });

    it('validates Venus retrograde rotation and solar day length', () => {
      const venus = PLANETS_DATA.venus;
      expect(venus.siderealDayHours).toBeLessThan(0); // Retrograde spin
      expect(venus.solarDayHours).toBeCloseTo(2802.0, 0); // ~116.75 days
    });

    it('validates Mercury 3:2 spin-orbit resonance', () => {
      const merc = PLANETS_DATA.mercury;
      // 3 sidereal rotations = 2 orbital revolutions
      // 3 * 58.646 = 175.938 days = 2 * 87.969 days
      const ratio = (merc.siderealDayHours * 3) / (merc.orbitalPeriodDays * 24 * 2);
      expect(ratio).toBeCloseTo(1.0, 2);
    });

    it('validates Pluto-Charon mutual tidal lock', () => {
      const pluto = PLANETS_DATA.pluto;
      expect(pluto.isDwarfPlanet).toBe(true);
      const charon = pluto.moons.find(m => m.id === 'charon');
      expect(charon).toBeDefined();
      expect(charon?.isTidallyLocked).toBe(true);
      expect(charon?.orbitalPeriodDays).toBeCloseTo(Math.abs(pluto.siderealDayHours) / 24, 2);
    });
  });

  describe('2. Vantage State Transitions & Epistemological Honesty', () => {
    it('defaults to Earth in historical baseline mode', () => {
      const state = vantage.getState();
      expect(state.bodyId).toBe('earth');
      expect(state.isFictionalMode).toBe(false);
      expect(state.engineMode).toBe('TRANSPLANT');
    });

    it('flags fictional mode when switching to an alien world', () => {
      vantage.setBody('mars');
      let state = vantage.getState();
      expect(state.bodyId).toBe('mars');
      expect(state.isFictionalMode).toBe(true);
      expect(state.planet.name).toBe('Mars');

      // Restores historical baseline when returning to Earth
      vantage.setBody('earth');
      state = vantage.getState();
      expect(state.bodyId).toBe('earth');
      expect(state.isFictionalMode).toBe(false);
    });

    it('toggles Engine Mode between TRANSPLANT and NATIVE', () => {
      expect(vantage.getState().engineMode).toBe('TRANSPLANT');
      vantage.setEngineMode('NATIVE');
      expect(vantage.getState().engineMode).toBe('NATIVE');
      vantage.setEngineMode('TRANSPLANT');
      expect(vantage.getState().engineMode).toBe('TRANSPLANT');
    });

    it('clamps Mars dust optical depth tau between 0.1 and 3.0', () => {
      vantage.setDustOpticalDepth(0.01);
      expect(vantage.getState().opticalDepthDust).toBe(0.1);
      vantage.setDustOpticalDepth(10.0);
      expect(vantage.getState().opticalDepthDust).toBe(3.0);
      vantage.setDustOpticalDepth(1.4);
      expect(vantage.getState().opticalDepthDust).toBe(1.4);
    });
  });

  describe('3. Real Planetary Sky Phenomena & Ephemeris Physics', () => {
    it('computes Phobos rising in the West with period < 1 Martian sol', () => {
      vantage.setBody('mars');
      const marsState = vantage.getState();
      const phobos = marsState.planet.moons.find(m => m.id === 'phobos');
      expect(phobos).toBeDefined();
      expect(phobos!.orbitalPeriodDays * 24).toBeLessThan(marsState.planet.solarDayHours);
      expect(phobos!.risesInWest).toBe(true);
    });

    it('computes Charon tidal locking on Pluto: fixed altitude at Sputnik Planitia and invisible on far side', () => {
      vantage.setBody('pluto');
      // Landmark 1: Sputnik Planitia (0° lon)
      const pluto = PLANETS_DATA.pluto;
      const sputnik = pluto.landmarks.find(l => l.id === 'sputnik_planitia');
      expect(sputnik).toBeDefined();

      vantage.setSite({
        id: sputnik!.id,
        name: sputnik!.name,
        latitudeDeg: sputnik!.latitude,
        longitudeDeg: sputnik!.longitude,
        elevationMeters: 0,
        isPlanetocentric: true,
        isEastLongitude: true
      });

      const jd = 2451545.0; // J2000
      const sky1 = PlanetSkyEngine.computeLocalSky(vantage.getState(), jd);
      const sky2 = PlanetSkyEngine.computeLocalSky(vantage.getState(), jd + 3.0); // 3 days later

      const charon1 = sky1.moons.find(m => m.id === 'charon');
      const charon2 = sky2.moons.find(m => m.id === 'charon');

      expect(charon1).toBeDefined();
      expect(charon2).toBeDefined();
      expect(charon1!.isAboveHorizon).toBe(true);
      expect(charon2!.isAboveHorizon).toBe(true);
      // Fixed altitude and azimuth due to tidal lock
      expect(charon1!.altDeg).toBeCloseTo(charon2!.altDeg, 1);
      expect(charon1!.azDeg).toBeCloseTo(charon2!.azDeg, 1);
    });

    it('computes Find Earth telemetry: positive light-time delay and valid distance from Mars', () => {
      vantage.setBody('mars');
      const jd = 2451545.0;
      const sky = PlanetSkyEngine.computeLocalSky(vantage.getState(), jd);

      expect(sky.earthInSky).toBeDefined();
      expect(sky.earthInSky.distanceAU).toBeGreaterThan(0.3);
      expect(sky.earthInSky.distanceAU).toBeLessThan(3.0);
      expect(sky.earthInSky.lightTimeMinutes).toBeGreaterThan(3.0); // > 3 minutes (1-way light speed)
      expect(sky.earthInSky.lightTimeMinutes).toBeLessThan(25.0); // < 25 minutes
    });
  });

  describe('4. Clepsydra Fluid Drive & Acoustic Modes', () => {
    it('accurately reports water clock failure states across worlds', () => {
      expect(PLANETS_DATA.earth.fluidDriveState).toBe('WORKS');
      expect(PLANETS_DATA.mars.fluidDriveState).toBe('FREEZES');
      expect(PLANETS_DATA.venus.fluidDriveState).toBe('BOILS');
      expect(PLANETS_DATA.mercury.fluidDriveState).toBe('EVAPORATES');
      expect(PLANETS_DATA.pluto.fluidDriveState).toBe('FREEZES');
    });

    it('enforces vacuum acoustic silence for airless bodies in realistic mode', () => {
      expect(PLANETS_DATA.mercury.speedOfSoundMPerS).toBe(0);
      expect(PLANETS_DATA.pluto.speedOfSoundMPerS).toBe(0);
      expect(PLANETS_DATA.earth.speedOfSoundMPerS).toBe(343);
      expect(PLANETS_DATA.mars.speedOfSoundMPerS).toBe(240);
      expect(PLANETS_DATA.venus.speedOfSoundMPerS).toBe(410);
    });
  });
});
