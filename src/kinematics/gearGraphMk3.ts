import { MK2_GEAR_CATALOG, GearMk2Definition, FeasibilityTier } from '../data/gearsMk2.ts';
import { calculateEphemeris, EphemerisResult } from '../ephemeris/planetaryTheory.ts';
import { timeEngine } from '../time/timeEngine.ts';
import { siteManager } from '../site/siteManager.ts';

export type DriveMode = 'crank' | 'clepsydra';

export interface KinematicStateMk3 {
  julianDay: number;
  crankTurns: number;
  yearFrac: number;

  // Gear rotation angles (radians)
  gearRotations: Map<string, number>;
  gearAngles: Record<string, number>;

  // Solar & Lunar kinematics
  sunLongitudeDeg: number;
  sunAnomalyDeg: number;
  sunMeanLongitudeDeg: number;
  sunTrueLongitudeDeg: number;
  sunLongitudeMean: number;
  sunLongitudeTrue: number;
  equationOfTimeMin: number;

  moonLongitudeDeg: number;
  moonAnomalyDeg: number;
  moonTrueLongitudeDeg: number;
  moonLongitudeSidereal: number;
  moonLongitudeTrue: number;
  moonPhaseAngle: number;
  moonPhaseAngleDeg: number;
  moonAgeDays: number;
  moonLatitude: number;
  draconicNodeDeg: number;
  nodeLongitude: number;
  nodeDistanceDeg: number;

  // Cycle Dials
  metonicCell: number;
  metonicTurn: number;
  metonicMonthNumber: number;
  metonicPointerAngleRad: number;
  metonicPointerRadius: number;
  callippicYear: number;
  callippicDialAngleRad: number;
  sarosCell: number;
  sarosTurn: number;
  sarosMonthNumber: number;
  sarosPointerAngleRad: number;
  sarosPointerRadius: number;
  exeligmosTurns: number;
  exeligmosOffsetHours: number;
  exeligmosDialAngleRad: number;
  olympiadYear: number;
  olympiadNumber: number;
  gamesCycleYear: number;
  gamesDialAngleRad: number;
  gamesPointers: {
    olympic: number;
    pythian: number;
    isthmian: number;
    nemean: number;
    naa: number;
    halieia: number;
  };

  // Ptolemaic Planets
  planets: {
    mercury: EphemerisResult;
    venus: EphemerisResult;
    mars: EphemerisResult;
    jupiter: EphemerisResult;
    saturn: EphemerisResult;
  };
  planetLongitudesDeg: {
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
    saturn: number;
  };

  // Mk II & Mk III additions
  isSolarEclipsePossible: boolean;
  isLunarEclipsePossible: boolean;
  eclipseMagnitudeEstimate: number;
  precessionAngle: number;
  siderealDayAngle: number;
  seasonalHourIndex: number;
  isDaytime: boolean;
  sunriseHour: number;
  sunsetHour: number;
  seasonalHourLengthMin: number;
  drumAngleRad: number;
  activeEvents: string[];

  clepsydra: {
    waterHeightMm: number;
    floatVelocityMmPerMin: number;
    flowRateMlPerMin: number;
    driftSecondsPerDay: number;
    reservoirRefillPct: number;
  };

  // Physics Fidelity
  cumulativeBacklashDeg: number;
  crankTorqueNm: number;
  mechanicalEfficiencyPct: number;

  // Mk III Compute Bay telemetry
  computeBayActive: boolean;
  analogIntegratorOutput?: number;
  rk45GroundTruth?: number;
  integratorDriftError?: number;
}

export class AntikytheraKinematicsEngineMk3 {
  private currentTier: FeasibilityTier = 'TIER_1_HELLENISTIC';
  private driveMode: DriveMode = 'crank';
  private calendarMode: 'lunar_354' | 'solar_365' = 'solar_365';
  private precessionTheory: 'ptolemaic' | 'true' = 'true';

  public toleranceUm: number = 50;
  public frictionCoeff: number = 0.15;
  public waterTempC: number = 20.0;
  public onGongStrike?: (event: string, label: string) => void;

  private crankTurnsTotal: number = 0;
  private lastFiredEvents: Set<string> = new Set();
  private computeBayEnabled: boolean = false;

  constructor() {
    timeEngine.onTimeChange(() => {
      // Synchronized via timeEngine
    });
  }

  public getGearDefinitions(): GearMk2Definition[] {
    return MK2_GEAR_CATALOG.filter(g => {
      if (this.currentTier === 'TIER_1_HELLENISTIC') {
        return g.tier === 'TIER_1_HELLENISTIC';
      }
      if (this.currentTier === 'TIER_2_MEDIEVAL') {
        return g.tier === 'TIER_1_HELLENISTIC' || g.tier === 'TIER_2_MEDIEVAL';
      }
      return true;
    });
  }

  public setTier(tier: FeasibilityTier) {
    this.currentTier = tier;
  }

  public getTier(): FeasibilityTier {
    return this.currentTier;
  }

  public setDriveMode(mode: DriveMode) {
    this.driveMode = mode;
  }

  public getDriveMode(): DriveMode {
    return this.driveMode;
  }

  public setCalendarMode(mode: 'lunar_354' | 'solar_365') {
    this.calendarMode = mode;
  }

  public getCalendarMode() {
    return this.calendarMode;
  }

  public setLatitude(lat: number, lon: number = 28.22) {
    siteManager.setCustomSite(lat, lon, 'Custom Horizon');
  }

  public getLatitude(): number {
    return siteManager.getCurrentSite().latitude;
  }

  public setPrecessionTheory(theory: 'ptolemaic' | 'true') {
    this.precessionTheory = theory;
  }

  public setJulianDay(jd: number) {
    timeEngine.setMachineJD(jd);
  }

  public getJulianDay(): number {
    return timeEngine.getState().machineJD;
  }

  public getEpochJDN(): number {
    return timeEngine.getCalibrationEpochJD();
  }

  public setComputeBayEnabled(enabled: boolean) {
    this.computeBayEnabled = enabled;
  }

  public computeKinematics(jd: number): KinematicStateMk3 {
    const epoch = timeEngine.getCalibrationEpochJD();
    const daysSinceEpoch = jd - epoch;
    const solarYearDays = this.calendarMode === 'lunar_354' ? 354.367 : 365.2422;
    const crankTurns = daysSinceEpoch / solarYearDays;
    this.crankTurnsTotal = crankTurns;

    const sunMeanAnomaly = ((daysSinceEpoch % 365.2596) / 365.2596) * Math.PI * 2;
    const equationOfCenterSun = 0.0334 * Math.sin(sunMeanAnomaly);
    const sunTrueAnomaly = sunMeanAnomaly + equationOfCenterSun;
    const sunLongitudeDeg = ((sunTrueAnomaly * 180) / Math.PI + 360) % 360;

    const eotMin = -7.65 * Math.sin(sunMeanAnomaly) + 9.86 * Math.sin(2 * sunMeanAnomaly + 3.59);

    const synodicMonthDays = 29.530588853;
    const anomalisticMonthDays = 27.55455;
    const draconicMonthDays = 27.21222;

    const moonMeanPhase = ((daysSinceEpoch % synodicMonthDays) / synodicMonthDays) * Math.PI * 2;
    const moonMeanAnomaly = ((daysSinceEpoch % anomalisticMonthDays) / anomalisticMonthDays) * Math.PI * 2;
    const equationOfCenterMoon = (6.289 / 180) * Math.PI * Math.sin(moonMeanAnomaly);
    const moonTrueAnomaly = moonMeanAnomaly + equationOfCenterMoon;

    const moonLongitudeDeg = ((sunLongitudeDeg + ((moonMeanPhase + equationOfCenterMoon) * 180) / Math.PI) + 720) % 360;
    const moonPhaseAngle = ((moonLongitudeDeg - sunLongitudeDeg) + 360) % 360;

    const draconicAngle = ((daysSinceEpoch % draconicMonthDays) / draconicMonthDays) * Math.PI * 2;
    const moonLatitude = 5.145 * Math.sin(draconicAngle);
    const draconicNodeDeg = ((-draconicAngle * 180) / Math.PI + 360) % 360;

    const synodicMonths = daysSinceEpoch / synodicMonthDays;
    const metonicMonthNumber = (Math.floor(synodicMonths) % 235) + 1;
    const metonicPointerAngleRad = ((synodicMonths % 235) / 47) * 2 * Math.PI;
    const metonicPointerRadius = (synodicMonths % 235) / 235;

    const sarosTotalMonths = (synodicMonths % 223 + 223) % 223;
    const sarosCell = Math.floor(sarosTotalMonths) + 1;
    const sarosTurn = Math.min(4, Math.floor(sarosTotalMonths / 55.75) + 1);
    const sarosPointerAngleRad = (sarosTotalMonths / 55.75) * 2 * Math.PI;
    const sarosPointerRadius = sarosTotalMonths / 223;

    const exeligmosCycle = Math.floor(synodicMonths / 223) % 3;
    const exeligmosOffsetHours = exeligmosCycle === 1 ? 8 : exeligmosCycle === 2 ? 16 : 0;
    const exeligmosDialAngleRad = (exeligmosCycle / 3) * 2 * Math.PI;
    const exeligmosTurns = daysSinceEpoch / (6585.3213 * 3);

    const callippicYear = Math.floor(daysSinceEpoch / 365.25) % 76 + 1;
    const callippicDialAngleRad = (((daysSinceEpoch / 365.25) % 76) / 76) * 2 * Math.PI;

    const olympiadYear = ((Math.floor(daysSinceEpoch / 365.25) % 4) + 4) % 4 + 1;
    const gamesCycleYear = olympiadYear;
    const gamesDialAngleRad = ((daysSinceEpoch / 365.25) % 4) * (Math.PI / 2);
    const olympiadNumber = Math.floor((jd - 1438171.5) / (4 * 365.25)) + 1;

    const gamesPointers = {
      olympic: (daysSinceEpoch / 1461) * Math.PI * 2,
      pythian: ((daysSinceEpoch + 730) / 1461) * Math.PI * 2,
      isthmian: (daysSinceEpoch / 730.5) * Math.PI * 2,
      nemean: ((daysSinceEpoch + 365) / 730.5) * Math.PI * 2,
      naa: (daysSinceEpoch / 1461) * Math.PI * 2,
      halieia: (daysSinceEpoch / 365.25) * Math.PI * 2
    };

    const T = (jd - 2451545.0) / 36525.0;
    const planets = {
      mercury: calculateEphemeris('mercury', T),
      venus: calculateEphemeris('venus', T),
      mars: calculateEphemeris('mars', T),
      jupiter: calculateEphemeris('jupiter', T),
      saturn: calculateEphemeris('saturn', T)
    };
    const planetLongitudesDeg = {
      mercury: planets.mercury.longitudeDeg,
      venus: planets.venus.longitudeDeg,
      mars: planets.mars.longitudeDeg,
      jupiter: planets.jupiter.longitudeDeg,
      saturn: planets.saturn.longitudeDeg
    };

    const isNodeProximity = Math.abs(moonLatitude) < 1.45;
    const isSyzygyNew = moonPhaseAngle < 12 || moonPhaseAngle > 348;
    const isSyzygyFull = Math.abs(moonPhaseAngle - 180) < 12;

    const isSolarEclipsePossible = isNodeProximity && isSyzygyNew;
    const isLunarEclipsePossible = isNodeProximity && isSyzygyFull;
    const eclipseMagnitudeEstimate = Math.max(0, 1.0 - Math.abs(moonLatitude) / 1.45);

    const yearsSinceJ2000 = (jd - 2451545.0) / 365.2422;
    const precessionRateDegPerYear = this.precessionTheory === 'ptolemaic' ? (1.0 / 100.0) : (1.0 / 71.6);
    const precessionAngle = ((yearsSinceJ2000 * precessionRateDegPerYear * Math.PI) / 180) % (Math.PI * 2);

    const siderealDayAngle = ((daysSinceEpoch * 1.00273790935 * Math.PI * 2) % (Math.PI * 2));

    const drumTurnsPerYear = 12;
    const drumAngleRad = ((daysSinceEpoch / (365.25 / drumTurnsPerYear)) * Math.PI * 2) % (Math.PI * 2);

    const activeEvents: string[] = [];
    if (isSolarEclipsePossible) activeEvents.push('SOLAR_ECLIPSE');
    if (isLunarEclipsePossible) activeEvents.push('LUNAR_ECLIPSE');
    if (Math.abs(moonPhaseAngle) < 5 || Math.abs(moonPhaseAngle - 180) < 5) activeEvents.push('SYZYGY_CHIME');

    for (const evt of activeEvents) {
      if (!this.lastFiredEvents.has(evt)) {
        if (this.onGongStrike) this.onGongStrike(evt, `Antikythera Gong: Event ${evt}`);
      }
    }
    this.lastFiredEvents = new Set(activeEvents);

    const effectiveViscosity = 1.002 * Math.exp(-0.02 * (this.waterTempC - 20.0));
    const flowRateMlPerMin = 25.0 / effectiveViscosity;
    const minutesInDay = (daysSinceEpoch % 1.0) * 1440;
    const waterHeightMm = (minutesInDay / 1440) * 150.0;
    const reservoirRefillPct = (minutesInDay / 1440) * 100.0;

    const gearRotations = new Map<string, number>();
    const gearAngles: Record<string, number> = {};
    const activeGears = this.getGearDefinitions();
    for (const gear of activeGears) {
      const rot = (crankTurns * (gear.ratioToInput || 1.0) * Math.PI * 2) % (Math.PI * 2);
      gearRotations.set(gear.id, rot);
      gearAngles[gear.id] = rot;
    }

    // Solar hours / seasonal time
    const lat = siteManager.getCurrentSite().latitude;
    const declinationSun = 23.44 * Math.sin(((daysSinceEpoch % 365.2422) / 365.2422) * Math.PI * 2);
    const haSun = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * Math.PI / 180) * Math.tan(declinationSun * Math.PI / 180)))) * (180 / Math.PI);
    const dayLengthHours = (2 * haSun) / 15.0;
    const sunriseHour = 12.0 - dayLengthHours / 2.0;
    const sunsetHour = 12.0 + dayLengthHours / 2.0;
    const localHour = (daysSinceEpoch % 1.0) * 24.0;
    const isDaytime = localHour >= sunriseHour && localHour <= sunsetHour;
    const seasonalHourLengthMin = isDaytime ? (dayLengthHours / 12.0) * 60 : ((24.0 - dayLengthHours) / 12.0) * 60;
    const seasonalHourIndex = isDaytime
      ? Math.floor(((localHour - sunriseHour) / dayLengthHours) * 12) + 1
      : Math.floor(((localHour > sunsetHour ? localHour - sunsetHour : localHour + 24.0 - sunsetHour) / (24.0 - dayLengthHours)) * 12) + 1;

    return {
      julianDay: jd,
      crankTurns,
      yearFrac: (daysSinceEpoch % 365.2422) / 365.2422,
      gearRotations,
      gearAngles,
      sunLongitudeDeg,
      sunAnomalyDeg: (sunTrueAnomaly * 180) / Math.PI,
      sunMeanLongitudeDeg: sunLongitudeDeg,
      sunTrueLongitudeDeg: sunLongitudeDeg,
      sunLongitudeMean: sunLongitudeDeg,
      sunLongitudeTrue: sunLongitudeDeg,
      equationOfTimeMin: eotMin,
      moonLongitudeDeg,
      moonAnomalyDeg: (moonTrueAnomaly * 180) / Math.PI,
      moonTrueLongitudeDeg: moonLongitudeDeg,
      moonLongitudeSidereal: moonLongitudeDeg,
      moonLongitudeTrue: moonLongitudeDeg,
      moonPhaseAngle,
      moonPhaseAngleDeg: moonPhaseAngle,
      moonAgeDays: (moonPhaseAngle / 360) * 29.530588853,
      moonLatitude,
      draconicNodeDeg,
      nodeLongitude: draconicNodeDeg,
      nodeDistanceDeg: Math.abs(moonLatitude),
      metonicCell: metonicMonthNumber,
      metonicTurn: Math.min(5, Math.floor(metonicMonthNumber / 47) + 1),
      metonicMonthNumber,
      metonicPointerAngleRad,
      metonicPointerRadius,
      callippicYear,
      callippicDialAngleRad,
      sarosCell,
      sarosTurn,
      sarosMonthNumber: sarosCell,
      sarosPointerAngleRad,
      sarosPointerRadius,
      exeligmosTurns,
      exeligmosOffsetHours,
      exeligmosDialAngleRad,
      olympiadYear,
      olympiadNumber,
      gamesCycleYear,
      gamesDialAngleRad,
      gamesPointers,
      planets,
      planetLongitudesDeg,
      isSolarEclipsePossible,
      isLunarEclipsePossible,
      eclipseMagnitudeEstimate,
      precessionAngle,
      siderealDayAngle,
      seasonalHourIndex,
      isDaytime,
      sunriseHour,
      sunsetHour,
      seasonalHourLengthMin,
      drumAngleRad,
      activeEvents,
      clepsydra: {
        waterHeightMm,
        floatVelocityMmPerMin: 150.0 / 1440,
        flowRateMlPerMin,
        driftSecondsPerDay: 1.2,
        reservoirRefillPct
      },
      cumulativeBacklashDeg: 0.12,
      crankTorqueNm: 0.45,
      mechanicalEfficiencyPct: 82.5,
      computeBayActive: this.computeBayEnabled
    };
  }
}
