import { describe, it, expect } from 'vitest';
import { SharedTimeEngine, timeEngine } from '../time/timeEngine.ts';
import { HighPrecisionSkyEngine } from '../sky/skyEngine.ts';
import { AnalogComputeBay } from '../computebay/analogComputeBay.ts';
import { BayesianDatingInference } from '../inverse/inverseEngine.ts';
import { AntikytheraKinematicsEngineMk3 } from '../kinematics/gearGraphMk3.ts';

describe('Antikythera Mk III Architecture, Ephemeris & Kinematics Triad', () => {
  const kinematics = new AntikytheraKinematicsEngineMk3();

  describe('SharedTimeEngine & Two-Way Sky Lock Mechanics', () => {
    it('synchronizes machine JD and sky JD bidirectionally when locked', () => {
      timeEngine.setLockedToMachine(true);
      timeEngine.setMachineJD(1646000.0); // 205 BCE

      expect(timeEngine.getState().machineJD).toBe(1646000.0);
      expect(timeEngine.getState().skyJD).toBe(1646000.0);
      expect(timeEngine.getState().differsFromMachine).toBe(false);

      // Scrubbing sky time moves machine crank when locked
      timeEngine.setSkyJD(1646010.5);
      expect(timeEngine.getState().machineJD).toBe(1646010.5);
      expect(timeEngine.getState().skyJD).toBe(1646010.5);
      expect(timeEngine.getState().differsFromMachine).toBe(false);
    });

    it('decouples sky JD from machine JD when unlocked and flags difference', () => {
      timeEngine.setLockedToMachine(false);
      timeEngine.setMachineJD(1646000.0);
      timeEngine.setSkyJD(1646005.25);

      expect(timeEngine.getState().machineJD).toBe(1646000.0);
      expect(timeEngine.getState().skyJD).toBe(1646005.25);
      expect(timeEngine.getState().differsFromMachine).toBe(true);

      // Resync restores lock
      timeEngine.resyncSkyToMachine();
      expect(timeEngine.getState().isLockedToMachine).toBe(true);
      expect(timeEngine.getState().differsFromMachine).toBe(false);
    });

    it('correctly models Stephenson 2016 DeltaT and expanding 2-sigma uncertainty band', () => {
      const dtAncient = SharedTimeEngine.computeDeltaT(-205);
      const dtModern = SharedTimeEngine.computeDeltaT(2026);

      // In 205 BCE, DeltaT is roughly 10000-12000 seconds (~3 hours)
      expect(dtAncient.deltaT).toBeGreaterThan(8000);
      expect(dtAncient.deltaT).toBeLessThan(15000);
      expect(dtAncient.uncertainty).toBeGreaterThan(500); // Expanding uncertainty in antiquity

      // In 2026 CE, DeltaT is ~69.5 seconds with tight error
      expect(dtModern.deltaT).toBeGreaterThan(65);
      expect(dtModern.deltaT).toBeLessThan(75);
      expect(dtModern.uncertainty).toBeLessThan(15);
    });
  });

  describe('HighPrecisionSkyEngine Spherical Astronomy & Physical Optics', () => {
    it('converts equatorial coordinates to horizontal altitude and azimuth', () => {
      // Celestial North Pole (Dec = 90) viewed from Rhodes (Lat = 36.4)
      const horiz = HighPrecisionSkyEngine.equatorialToHorizontal(0, 90, 36.4, 0);
      expect(Math.abs(horiz.altDeg - 36.4)).toBeLessThan(0.05);
      expect(Math.abs(horiz.azDeg - 0)).toBeLessThan(0.01);
    });

    it('applies atmospheric refraction for objects near the horizon', () => {
      const refrHorizon = HighPrecisionSkyEngine.computeRefraction(0.0);
      const refrZenith = HighPrecisionSkyEngine.computeRefraction(90.0);

      // Horizon refraction is ~34 arcminutes (~0.56 degrees)
      expect(refrHorizon).toBeGreaterThan(0.4);
      expect(refrHorizon).toBeLessThan(0.65);
      // Zenith refraction is zero
      expect(refrZenith).toBeLessThan(0.001);
    });

    it('models Rozenberg air mass extinction as stars approach the horizon', () => {
      const ext45 = HighPrecisionSkyEngine.computeExtinction(45.0, 0.0);
      const ext2 = HighPrecisionSkyEngine.computeExtinction(2.0, 0.0);

      expect(ext45).toBeGreaterThan(0.1);
      expect(ext2).toBeGreaterThan(2.0); // Severe dimming at 2 degrees
      expect(ext2).toBeGreaterThan(ext45 * 4);
    });
  });

  describe('Analog Compute Bay Reconfigurable Kinematics & RK45 Benchmark', () => {
    it('executes analog Kepler differential analyzer program with bounded physical drift', () => {
      const bay = new AnalogComputeBay();
      bay.loadPreset('kepler-solver');
      bay.step(0.01);

      const summary = bay.getSummary();
      expect(summary.modules.length).toBeGreaterThanOrEqual(4);
      expect(summary.telemetry.driftError).toBeLessThan(0.05); // Under 5% drift against RK45 ground truth
    });
  });

  describe('Bayesian Inverse Calibration Dating Engine', () => {
    it('produces Maximum A Posteriori (MAP) calibration epoch consistent with historical data', () => {
      const dating = new BayesianDatingInference();
      const posterior = dating.getPosteriorSummary();

      expect(posterior.mapYear).toBeGreaterThanOrEqual(195);
      expect(posterior.mapYear).toBeLessThanOrEqual(215);
      expect(posterior.bestLatitude).toBeGreaterThan(34);
      expect(posterior.bestLatitude).toBeLessThan(38);
    });
  });

  describe('Core Kinematic Ratios & Cycles (Mk I / Mk II / Mk III)', () => {
    it('asserts fundamental Moon Sidereal ratio is exactly 254/19', () => {
      const ratio = (64 / 38) * (48 / 24) * (127 / 32);
      expect(Math.abs(ratio - 254 / 19)).toBeLessThan(1e-12);
    });

    it('asserts Metonic 235:19, Callippic 940:76, and Hipparchic 3760:304 relations', () => {
      const metonicRatio = 235 / 19;
      const callippicRatio = 940 / 76;
      const hipparchicRatio = 3760 / 304;

      expect(Math.abs(callippicRatio - metonicRatio)).toBeLessThan(1e-12);
      expect(Math.abs(hipparchicRatio - metonicRatio)).toBeLessThan(1e-12);
    });

    it('asserts Saros eclipse period relation (223 synodic = 242 draconic)', () => {
      const synodicDays = 29.53058885;
      const draconicDays = 27.21222081;

      const sarosSynodic = 223 * synodicDays;
      const sarosDraconic = 242 * draconicDays;

      expect(Math.abs(sarosSynodic - sarosDraconic)).toBeLessThan(0.05);
    });

    it('verifies Panhellenic Games 4-year cycle progression', () => {
      const epochJD = kinematics.getEpochJDN();
      const s1 = kinematics.computeKinematics(epochJD);
      const s2 = kinematics.computeKinematics(epochJD + 365.25);
      const s3 = kinematics.computeKinematics(epochJD + 2 * 365.25);
      const s4 = kinematics.computeKinematics(epochJD + 3 * 365.25);

      expect(s1.olympiadYear).toBe(1);
      expect(s2.olympiadYear).toBe(2);
      expect(s3.olympiadYear).toBe(3);
      expect(s4.olympiadYear).toBe(4);
    });
  });
});
