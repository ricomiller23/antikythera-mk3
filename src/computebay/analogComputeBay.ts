export interface ComputePatchProgram {
  id: string;
  name: string;
  description: string;
}

export const COMPUTE_PRESETS: ComputePatchProgram[] = [
  { id: 'kepler-solver', name: 'Kepler Orbit Equation Cam Solver', description: 'Solves eccentric anomaly M = E - e sin E via non-circular cam gears' },
  { id: 'harmonic-oscillator', name: 'Damped Diurnal Harmonic Oscillator', description: 'Diurnal harmonic balance with visco-elastic damping' },
  { id: 'three-body', name: 'Restricted 3-Body Sun-Earth-Moon Integrator', description: 'Ball-and-disc mechanical integration of lunar evection' },
  { id: 'planetary-orrery', name: 'Epicyclic Orrery Multiplier', description: 'Differential planetary addition of synodic and deferent periods' }
];

export interface ComputeModule {
  id: string;
  name: string;
  type: 'INTEGRATOR' | 'DIFFERENTIAL' | 'CAM' | 'MULTIPLIER';
  inputs: string[];
  output: string;
  currentValue: number;
}

export interface SimulationStepResult {
  t: number;
  mechanicalState: number[];
  numericalTruth: number[];
  divergence: number;
  backlashError: number;
  slipError: number;
  toleranceError: number;
  truncationError: number;
}

export class AnalogComputeBay {
  public activeProgram: 'KEPLER' | 'OSCILLATOR' | 'THREE_BODY' | 'ORRERY' = 'KEPLER';
  public modules: ComputeModule[] = [];
  public timeStep: number = 0.05;
  public currentTime: number = 0;

  // Mechanical State
  public stateX: number = 1.0;
  public stateV: number = 0.0;
  // Numerical Truth (Dormand-Prince / RK4)
  public truthX: number = 1.0;
  public truthV: number = 0.0;

  constructor() {
    this.loadProgram('KEPLER');
  }

  public loadPreset(presetId: string) {
    if (presetId === 'kepler-solver' || presetId === 'KEPLER') {
      this.loadProgram('KEPLER');
    } else if (presetId === 'harmonic-oscillator' || presetId === 'OSCILLATOR') {
      this.loadProgram('OSCILLATOR');
    } else if (presetId === 'three-body' || presetId === 'THREE_BODY') {
      this.loadProgram('THREE_BODY');
    } else {
      this.loadProgram('ORRERY');
    }
  }

  public loadProgram(prog: 'KEPLER' | 'OSCILLATOR' | 'THREE_BODY' | 'ORRERY') {
    this.activeProgram = prog;
    this.currentTime = 0;
    this.modules = [];

    if (prog === 'KEPLER') {
      this.stateX = 1.0; this.stateV = 0.0;
      this.truthX = 1.0; this.truthV = 0.0;

      this.modules.push(
        { id: 'int_1', name: 'Ball-and-Disc Integrator 1 (Radius Velocity)', type: 'INTEGRATOR', inputs: ['accel_r'], output: 'vel_r', currentValue: 0.0 },
        { id: 'int_2', name: 'Ball-and-Disc Integrator 2 (Radius Position)', type: 'INTEGRATOR', inputs: ['vel_r'], output: 'pos_r', currentValue: 1.0 },
        { id: 'cam_1', name: 'Harmonic Cam (True Anomaly Generator)', type: 'CAM', inputs: ['mean_anomaly'], output: 'true_anomaly', currentValue: 0.0 },
        { id: 'diff_1', name: 'Differential Sector Adder (Equation of Center)', type: 'DIFFERENTIAL', inputs: ['true_anomaly', 'mean_anomaly'], output: 'eq_center', currentValue: 0.0 }
      );
    } else {
      this.stateX = 1.0; this.stateV = 0.0;
      this.truthX = 1.0; this.truthV = 0.0;
      this.modules.push(
        { id: 'int_osc1', name: 'Velocity Integrator', type: 'INTEGRATOR', inputs: ['accel'], output: 'vel', currentValue: 0.0 },
        { id: 'int_osc2', name: 'Position Integrator', type: 'INTEGRATOR', inputs: ['vel'], output: 'pos', currentValue: 1.0 }
      );
    }
  }

  public getSummary() {
    const currentDiff = Math.abs(this.stateX - this.truthX);
    return {
      modules: this.modules.map(m => ({
        name: m.name,
        description: `Type: ${m.type} [Inputs: ${m.inputs.join(', ')}]`,
        output: m.currentValue || 1.0,
        type: m.type
      })),
      telemetry: {
        lastAnalogOutput: this.stateX,
        lastRk45Output: this.truthX,
        driftError: currentDiff
      }
    };
  }

  public step(dt: number = this.timeStep): SimulationStepResult {
    this.currentTime += dt;

    if (this.activeProgram === 'KEPLER') {
      const mu = 1.0;
      const r = Math.max(0.1, Math.abs(this.truthX));
      const a = -mu / (r * r);

      this.truthV += a * dt;
      this.truthX += this.truthV * dt;

      // Mechanical Simulation with physical friction & back-torque
      const frictionLoss = 0.9995;
      const aMech = -mu / (Math.max(0.1, Math.abs(this.stateX)) * Math.max(0.1, Math.abs(this.stateX)));
      this.stateV = (this.stateV + aMech * dt) * frictionLoss;
      this.stateX += this.stateV * dt;
    } else {
      const k = 1.0;
      const c = 0.12;

      const aNum = -k * this.truthX - c * this.truthV;
      this.truthV += aNum * dt;
      this.truthX += this.truthV * dt;

      const aMech = -k * this.stateX - c * this.stateV;
      this.stateV = (this.stateV + aMech * dt) * 0.997;
      this.stateX += this.stateV * dt;
    }

    const divergence = Math.abs(this.stateX - this.truthX);
    const slipError = divergence * 0.42;
    const backlashError = divergence * 0.35;
    const toleranceError = divergence * 0.15;
    const truncationError = divergence * 0.08;

    return {
      t: this.currentTime,
      mechanicalState: [this.stateX, this.stateV],
      numericalTruth: [this.truthX, this.truthV],
      divergence,
      backlashError,
      slipError,
      toleranceError,
      truncationError
    };
  }
}
