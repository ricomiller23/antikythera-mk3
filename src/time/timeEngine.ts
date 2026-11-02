export interface TimeState {
  jd: number;                  // Machine JD
  machineJD: number;           // Machine JD alias
  skyJD: number;               // Sky Window JD (equals machineJD when locked)
  isLockedToMachine: boolean;
  differsFromMachine: boolean;
  tt: number;                  // Terrestrial Time in JD
  ut: number;                  // Universal Time in JD
  deltaTSeconds: number;       // DeltaT = TT - UT (seconds)
  deltaTUncertaintySeconds: number; // +/- 2-sigma uncertainty (seconds)
  deltaTUncertaintySec: number;
  astronomicalYear: number;    // Year with 0 = 1 BCE, -1 = 2 BCE
  historicalYear: number;      // 1 BCE, 2026 CE
  isBCE: boolean;
  month: number;               // 1 to 12
  day: number;                 // 1 to 31
  decimalHoursUT: number;      // 0.0 to 24.0
  calendarType: 'proleptic_julian' | 'gregorian';
  equationOfTimeMin: number;   // minutes
  displayMachineCalendar: string;
  displaySkyCalendar: string;
}

export class SharedTimeEngine {
  private currentMachineJD: number = 2461346.5; // Default: 2026-11-01 00:00 UT
  private isSkyLocked: boolean = true;
  private skyTimeOffsetDays: number = 0; // If unlocked, difference from machine JD
  private calibrationEpochJD: number = 1646000.0; // ~205 BCE default
  private listeners: ((state: TimeState) => void)[] = [];

  constructor(initialJD: number = 1646000.0) {
    this.currentMachineJD = initialJD;
  }

  public getMachineJD(): number {
    return this.currentMachineJD;
  }

  public setMachineJD(jd: number) {
    this.currentMachineJD = jd;
    this.notify();
  }

  public stepMachineDays(days: number) {
    this.currentMachineJD += days;
    this.notify();
  }

  public getSkyJD(): number {
    return this.isSkyLocked ? this.currentMachineJD : this.currentMachineJD + this.skyTimeOffsetDays;
  }

  public setSkyJD(jd: number) {
    if (this.isSkyLocked) {
      this.currentMachineJD = jd;
    } else {
      this.skyTimeOffsetDays = jd - this.currentMachineJD;
    }
    this.notify();
  }

  public isLocked(): boolean {
    return this.isSkyLocked;
  }

  public setLockedToMachine(locked: boolean) {
    this.isSkyLocked = locked;
    if (locked) {
      this.skyTimeOffsetDays = 0;
    }
    this.notify();
  }

  public resyncSkyToMachine() {
    this.setLockedToMachine(true);
  }

  public setCalibrationEpochJD(jd: number) {
    this.calibrationEpochJD = jd;
  }

  public getCalibrationEpochJD(): number {
    return this.calibrationEpochJD;
  }

  public onTimeChange(callback: (state: TimeState) => void) {
    this.listeners.push(callback);
    callback(this.getState());
  }

  private notify() {
    const s = this.getState();
    for (const listener of this.listeners) {
      listener(s);
    }
  }

  public static computeDeltaT(year: number): { deltaT: number; uncertainty: number } {
    const t = (year - 1820) / 100;

    if (year < -500) {
      const u = (year - 1820) / 100;
      const dt = -20 + 32 * u * u;
      return { deltaT: dt, uncertainty: Math.abs(dt * 0.15) + 300 };
    } else if (year <= 500) {
      const u = year / 100;
      const dt = 10583.6 - 1014.41 * u + 33.78311 * u * u - 5.952053 * u * u * u
        - 0.179840 * u * u * u * u + 0.022174192 * Math.pow(u, 5) + 0.0090316521 * Math.pow(u, 6);
      return { deltaT: dt, uncertainty: Math.min(2400, Math.abs(dt * 0.08) + 120) };
    } else if (year <= 1600) {
      const dt = 1574.2 - 556.01 * t + 71.23472 * t * t + 0.319781 * t * t * t
        - 0.8503463 * t * t * t * t - 0.005050998 * Math.pow(t, 5) + 0.0083572073 * Math.pow(t, 6);
      return { deltaT: dt, uncertainty: Math.abs(dt * 0.05) + 60 };
    } else if (year <= 2000) {
      const dt = 10.2 + 8.365 * t + 7.04 * t * t;
      return { deltaT: dt, uncertainty: 2.0 };
    } else {
      const dt = 63.86 + 0.3345 * (year - 2000) - 0.060374 * Math.pow(year - 2000, 2) + 0.0017275 * Math.pow(year - 2000, 3);
      return { deltaT: Math.max(69, dt), uncertainty: Math.abs(year - 2000) * 0.2 + 2 };
    }
  }

  public static jdToDate(jd: number): {
    year: number;
    month: number;
    day: number;
    decimalHours: number;
    calendarType: 'proleptic_julian' | 'gregorian';
  } {
    const jdAdjusted = jd + 0.5;
    const Z = Math.floor(jdAdjusted);
    const F = jdAdjusted - Z;
    let A = Z;

    let calendarType: 'proleptic_julian' | 'gregorian' = 'gregorian';
    if (Z >= 2299161) {
      const alpha = Math.floor((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.floor(alpha / 4);
    } else {
      calendarType = 'proleptic_julian';
    }

    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);

    const day = B - D - Math.floor(30.6001 * E);
    const month = E < 14 ? E - 1 : E - 13;
    let year = month > 2 ? C - 4716 : C - 4715;

    const decimalHours = F * 24.0;
    return { year, month, day, decimalHours, calendarType };
  }

  public static dateToJD(year: number, month: number, day: number, decimalHours: number = 0): number {
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const isGregorian = (year > 1582) || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
    let B = 0;
    if (isGregorian) {
      const A = Math.floor(y / 100);
      B = 2 - A + Math.floor(A / 4);
    }

    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + (decimalHours / 24.0);
    return jd;
  }

  public getState(): TimeState {
    const mJD = this.currentMachineJD;
    const sJD = this.getSkyJD();
    const { year, month, day, decimalHours, calendarType } = SharedTimeEngine.jdToDate(mJD);
    const { deltaT, uncertainty } = SharedTimeEngine.computeDeltaT(year);

    const isBCE = year <= 0;
    const historicalYear = isBCE ? Math.abs(year - 1) : year;
    const eraStr = isBCE ? `${historicalYear} BCE` : `${historicalYear} CE`;

    const skyDate = SharedTimeEngine.jdToDate(sJD);
    const skyEraStr = skyDate.year <= 0 ? `${Math.abs(skyDate.year - 1)} BCE` : `${skyDate.year} CE`;

    const n = mJD - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360;
    const eps = (23.439 - 0.0000004 * n) * (Math.PI / 180);
    const yVal = Math.tan(eps / 2) * Math.tan(eps / 2);
    const lRad = (lambda * Math.PI) / 180;
    const eotMin = 4 * (yVal * Math.sin(2 * lRad) - 2 * 0.0167 * Math.sin(g) + 4 * 0.0167 * yVal * Math.sin(g) * Math.cos(2 * lRad) - 0.5 * yVal * yVal * Math.sin(4 * lRad) - 1.25 * 0.0167 * 0.0167 * Math.sin(2 * g)) * (180 / Math.PI);

    return {
      jd: mJD,
      machineJD: mJD,
      skyJD: sJD,
      isLockedToMachine: this.isSkyLocked,
      differsFromMachine: !this.isSkyLocked && Math.abs(sJD - mJD) > 1e-6,
      tt: mJD + deltaT / 86400,
      ut: mJD,
      deltaTSeconds: deltaT,
      deltaTUncertaintySeconds: uncertainty,
      deltaTUncertaintySec: uncertainty,
      astronomicalYear: year,
      historicalYear,
      isBCE,
      month,
      day,
      decimalHoursUT: decimalHours,
      calendarType,
      equationOfTimeMin: eotMin,
      displayMachineCalendar: `${eraStr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} (${calendarType === 'proleptic_julian' ? 'Julian' : 'Gregorian'})`,
      displaySkyCalendar: `${skyEraStr}-${String(skyDate.month).padStart(2, '0')}-${String(skyDate.day).padStart(2, '0')}`
    };
  }
}

export const timeEngine = new SharedTimeEngine();
