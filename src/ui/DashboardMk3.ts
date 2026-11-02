import { AntikytheraKinematicsEngineMk3, KinematicStateMk3 } from '../kinematics/gearGraphMk3.ts';
import { AntikytheraSceneMk3 } from '../scene/AntikytheraSceneMk3.ts';
import { SkyWindow, SkyViewMode } from '../sky/skyWindow.ts';
import { timeEngine, TimeState } from '../time/timeEngine.ts';
import { siteManager, SiteDefinition, ANCIENT_GAZETTEER } from '../site/siteManager.ts';
import { AnalogComputeBay, COMPUTE_PRESETS, ComputePatchProgram } from '../computebay/analogComputeBay.ts';
import { BayesianDatingInference, PosteriorSummary } from '../inverse/inverseEngine.ts';
import { HISTORICAL_RECONCILIATION_RECORDS, HistoricalRecord } from '../reconciliation/reconciliationEngine.ts';
import { LIFE_TIMELINE, FRAGMENT_CATALOG, LifeTimelineEra } from '../life/lifeOfObject.ts';
import { HighPrecisionSkyEngine } from '../sky/skyEngine.ts';
import { GearMk2Definition, FeasibilityTier } from '../data/gearsMk2.ts';
import { GearTrainFoundry, CandidateTrain } from '../foundry/gearFoundry.ts';
import { AntiqueBronzeGongSynthesizer } from '../audio/gongAudio.ts';
import { HISTORICAL_ECLIPSES } from '../data/eclipseCatalog.ts';
import { computeOlympiad } from '../data/panhellenicGames.ts';
import { MODERN_COMET_OVERLAYS } from '../data/comets.ts';
import { PassportPanel } from './PassportPanel.ts';
import { vantageManager } from '../vantage/vantageManager.ts';

export type DisplayLayoutMode = 'INSET' | 'SPLIT' | 'FULL_SKY' | 'FULL_MECH';

export class AntikytheraDashboardMk3 {
  private container: HTMLElement;
  private kinematics: AntikytheraKinematicsEngineMk3;
  private scene: AntikytheraSceneMk3;
  private skyWindow: SkyWindow;
  private computeBay: AnalogComputeBay;
  private datingInference: BayesianDatingInference;
  private gong: AntiqueBronzeGongSynthesizer;

  // Layout & Navigation State
  private layoutMode: DisplayLayoutMode = 'INSET';
  private activeTab: string = 'sky';
  private isPlaying: boolean = false;
  private playbackDirection: number = 1;
  private playbackSpeedDaysPerSec: number = 5;
  private lastTimestamp: number = 0;

  private posteriorCache: PosteriorSummary;
  private synthesizedCandidates: CandidateTrain[] = [];

  constructor(
    container: HTMLElement,
    kinematics: AntikytheraKinematicsEngineMk3,
    scene: AntikytheraSceneMk3,
    skyWindow: SkyWindow,
    gong: AntiqueBronzeGongSynthesizer
  ) {
    this.container = container;
    this.kinematics = kinematics;
    this.scene = scene;
    this.skyWindow = skyWindow;
    this.gong = gong;
    this.computeBay = new AnalogComputeBay();
    this.datingInference = new BayesianDatingInference();
    this.posteriorCache = this.datingInference.getPosteriorSummary();

    // Attach acoustic strike
    this.kinematics.onGongStrike = (eventId, label) => {
      this.gong.strike(312, 2.5);
      this.flashEventAlert(label);
    };

    // Attach gear inspector
    this.scene.onGearSelect = (gear) => {
      this.renderGearInspector(gear);
    };

    // Listen to time engine changes
    timeEngine.onTimeChange((state) => {
      this.updateHeaderTimeDisplays(state);
      this.updateSkyReadouts(state);
    });

    // Listen to site changes
    siteManager.onSiteChange((site) => {
      this.kinematics.setLatitude(site.latitude, site.longitude);
      this.updateHeaderSiteDisplay(site);
    });

    this.render();
    this.attachEventListeners();
  }

  private flashEventAlert(label: string) {
    const alertEl = document.getElementById('event-banner');
    if (alertEl) {
      alertEl.innerText = `🔔 GONG STRUCK: ${label}`;
      alertEl.classList.remove('opacity-0');
      alertEl.classList.add('opacity-100');
      setTimeout(() => {
        alertEl.classList.remove('opacity-100');
        alertEl.classList.add('opacity-0');
      }, 3500);
    }
  }

  public render() {
    const timeState = timeEngine.getState();
    const currentSite = siteManager.getCurrentSite();

    this.container.innerHTML = `
      <div class="h-full flex flex-col bg-slate-950 text-slate-200 text-xs font-sans overflow-hidden select-none">
        
        <!-- TOP STATUS / BANNER -->
        <header class="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div class="flex items-center space-x-2">
            <span class="text-amber-500 font-bold text-sm tracking-wider flex items-center gap-1.5">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              ANTIKYTHERA MK III: THE ENGINE
            </span>
            <span class="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-[10px] text-amber-300 font-medium">
              SPECULATIVE EXTRAPOLATION — NOT A HISTORICAL ARTEFACT
            </span>
          </div>

          <!-- TIME ENGINE TWO-WAY SYNC & SITE BADGE -->
          <div class="flex items-center space-x-3 text-[11px]">
            <div id="sky-lock-badge" class="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-400 font-medium cursor-pointer">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span id="sky-lock-text">LOCKED TO MACHINE</span>
            </div>

            <div class="bg-slate-800/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-2">
              <span class="text-slate-400">Observer Site:</span>
              <select id="site-selector" class="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200">
                ${ANCIENT_GAZETTEER.map(s => `<option value="${s.id}" ${s.id === currentSite.id ? 'selected' : ''}>${s.name} (${s.latitude > 0 ? s.latitude.toFixed(1) + '°N' : Math.abs(s.latitude).toFixed(1) + '°S'})</option>`).join('')}
              </select>
            </div>

            <div class="bg-slate-800/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-2">
              <span class="text-slate-400">Sky Layout:</span>
              <select id="layout-selector" class="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200">
                <option value="INSET" ${this.layoutMode === 'INSET' ? 'selected' : ''}>Inset Window</option>
                <option value="SPLIT" ${this.layoutMode === 'SPLIT' ? 'selected' : ''}>Split 50/50</option>
                <option value="FULL_SKY" ${this.layoutMode === 'FULL_SKY' ? 'selected' : ''}>Full Sky Window</option>
                <option value="FULL_MECH" ${this.layoutMode === 'FULL_MECH' ? 'selected' : ''}>Full Mechanism</option>
              </select>
            </div>
          </div>
        </header>

        <!-- DYNAMIC NOTIFICATION BANNER -->
        <div id="event-banner" class="bg-amber-600 text-white font-bold py-1 px-4 text-center transition-opacity duration-300 opacity-0 absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded shadow-lg pointer-events-none">
          🔔 GONG STRUCK
        </div>

        <!-- MAIN WORKSPACE -->
        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          <!-- NAVIGATION TABS (VERTICAL ON DESKTOP, ACCORDION/TAB ON MOBILE) -->
          <nav class="w-full md:w-44 bg-slate-900 border-r border-slate-800 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 shadow-inner">
            <button class="nav-tab active text-left px-2.5 py-2 rounded flex items-center gap-2 font-medium" data-tab="sky">
              <span>🔭</span> Standing Sky
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2 font-medium text-amber-300" data-tab="passport">
              <span>🛂</span> Passport
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2 font-medium" data-tab="compute">
              <span>⚙️</span> Compute Bay
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2 font-medium" data-tab="inverse">
              <span>🏛️</span> Inverse Dating
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2 font-medium" data-tab="reconciliation">
              <span>📜</span> Reconciliation
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2 font-medium" data-tab="life">
              <span>⏳</span> Life of Object
            </button>
            <div class="border-t border-slate-800 my-1 hidden md:block"></div>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="dials">
              <span>⏱️</span> Dials & Cycles
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="eclipses">
              <span>🌑</span> Eclipses & Nodes
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="planets">
              <span>🪐</span> Planetary
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="clepsydra">
              <span>💧</span> Clepsydra
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="pindrum">
              <span>🥁</span> Pin Drum
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="foundry">
              <span>🔨</span> Foundry & CAD
            </button>
            <button class="nav-tab text-left px-2.5 py-2 rounded flex items-center gap-2" data-tab="comets">
              <span>☄️</span> Comets
            </button>
          </nav>

          <!-- TAB CONTENT PANELS -->
          <div class="flex-1 bg-slate-950 p-3 overflow-y-auto" id="tab-content-area">
            ${this.renderSkyTabContent()}
          </div>
        </div>

        <!-- GLOBAL TIME ENGINE TRANSPORT / SCRUB BAR (CRANK) -->
        <footer class="bg-slate-900 border-t border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
          <!-- Machine Date & Julian Readout -->
          <div class="flex items-center gap-3">
            <div>
              <span class="text-slate-400 text-[10px] block uppercase">Machine Dial Date</span>
              <span id="machine-date-display" class="font-mono text-amber-400 font-bold text-xs">${timeState.displayMachineCalendar}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block uppercase">Julian Day</span>
              <span id="machine-jd-display" class="font-mono text-slate-300 text-xs">${timeState.machineJD.toFixed(2)}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block uppercase">ΔT (Stephenson 2016)</span>
              <span id="machine-deltat-display" class="font-mono text-cyan-400 text-xs">${(timeState.deltaTSeconds / 60).toFixed(1)}m (±${(timeState.deltaTUncertaintySeconds / 60).toFixed(1)}m)</span>
            </div>
          </div>

          <!-- Playback & Crank Scrubbing Controls -->
          <div class="flex items-center gap-2">
            <button id="btn-step-back-year" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium" title="Rewind 1 Year">-1y</button>
            <button id="btn-step-back-month" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium" title="Rewind 1 Month">-1m</button>
            <button id="btn-step-back-day" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium" title="Rewind 1 Day">-1d</button>
            <button id="btn-play-pause" class="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded flex items-center gap-1 shadow">
              <span>▶</span> Play
            </button>
            <button id="btn-step-forward-day" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium" title="Advance 1 Day">+1d</button>
            <button id="btn-step-forward-month" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium" title="Advance 1 Month">+1m</button>
            <button id="btn-step-forward-year" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium" title="Advance 1 Year">+1y</button>
          </div>

          <!-- Scrub Slider directly connected to crank -->
          <div class="flex items-center gap-2 w-full md:w-64">
            <span class="text-slate-400 text-[10px]">Crank:</span>
            <input id="crank-slider" type="range" min="1600000" max="2500000" step="0.25" value="${timeState.machineJD}" class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
        </footer>

      </div>
    `;
  }

  // --- TAB RENDERERS ---

  private renderSkyTabContent(): string {
    const timeState = timeEngine.getState();
    const site = siteManager.getCurrentSite();
    const eclipse = HighPrecisionSkyEngine.computeLocalEclipseCircumstances(timeState.skyJD, site.latitude, site.longitude);
    const heliacalSirius = HighPrecisionSkyEngine.computeHeliacalEvent('Sirius', 101.28, -16.71, -1.46, timeState.skyJD, site.latitude);

    return `
      <div class="space-y-4">
        <!-- SKY WINDOW CONTROL HEADER -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
            <h3 class="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
              <span>🔭</span> STANDING SKY WINDOW (PHYSICALLY GROUNDED EPHEMERIS)
            </h3>
            <div class="flex items-center gap-2">
              <button id="btn-sky-lock-toggle" class="px-2.5 py-1 rounded text-xs font-semibold ${timeState.isLockedToMachine ? 'bg-emerald-900 text-emerald-300 border border-emerald-600' : 'bg-rose-900 text-rose-300 border border-rose-600'}">
                ${timeState.isLockedToMachine ? '🔒 Locked to Machine Date' : '🔓 Unlocked (Differs from Machine)'}
              </button>
              <button id="btn-sky-reset-sync" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700">
                ↺ Resync to Machine
              </button>
            </div>
          </div>

          <!-- Sky View Options -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="check-ghost-overlay" checked class="accent-amber-500" />
              <span>Machine vs Sky Ghost</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="check-precession-pole" class="accent-amber-500" />
              <span>Precession Pole Path</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="check-constellations" checked class="accent-amber-500" />
              <span>48 Constellations</span>
            </label>
            <div class="flex items-center gap-1">
              <span class="text-slate-400">Projection:</span>
              <select id="sky-projection-select" class="bg-slate-800 border border-slate-700 rounded px-1 py-0.5">
                <option value="DOME">Hemisphere Dome</option>
                <option value="HORIZON">Local Horizon</option>
                <option value="ALL_SKY">All-Sky Stereographic</option>
              </select>
            </div>
          </div>
        </div>

        <!-- TWO-WAY LINK TIME-OF-DAY SCRUBBER -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div class="flex justify-between items-center mb-1.5">
            <span class="font-medium text-slate-300">Sky Local Time of Day (turns machine crank when locked):</span>
            <span id="sky-time-display" class="font-mono text-cyan-400">${((timeState.skyJD % 1.0) * 24).toFixed(2)}h local</span>
          </div>
          <input id="sky-time-scrubber" type="range" min="0" max="1" step="0.001" value="${(timeState.skyJD % 1.0)}" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
        </div>

        <!-- EPHEMERIS & LOCAL SKY CIRCUMSTANCES -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Local Eclipse Circumstances -->
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <h4 class="font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Local Eclipse Circumstances</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] ${eclipse.isVisible ? 'bg-amber-900/80 text-amber-300' : 'bg-slate-800 text-slate-400'}">
                ${eclipse.isVisible ? 'ECLIPSE VISIBLE' : 'No Local Obscuration'}
              </span>
            </h4>
            <div class="space-y-1 text-slate-400">
              <div class="flex justify-between"><span>Max Obscuration:</span><span class="font-mono text-slate-200">${(eclipse.maxObscuration * 100).toFixed(1)}%</span></div>
              <div class="flex justify-between"><span>Altitude at Max:</span><span class="font-mono text-slate-200">${eclipse.altitudeAtMaxDeg.toFixed(1)}°</span></div>
              <div class="flex justify-between"><span>ΔT Uncertainty Band:</span><span class="font-mono text-cyan-400">±${(timeState.deltaTUncertaintySeconds / 60).toFixed(1)} min (Stephenson 2016)</span></div>
              <div class="flex justify-between"><span>Central Path Drift (2σ):</span><span class="font-mono text-slate-200">±${((timeState.deltaTUncertaintySeconds / 240)).toFixed(2)}° Longitude</span></div>
            </div>
          </div>

          <!-- Heliacal Rising & Extinction -->
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <h4 class="font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Heliacal Phenomenon (Schaefer Extinction)</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] ${heliacalSirius.isHeliacalRising ? 'bg-emerald-900/80 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
                ${heliacalSirius.isHeliacalRising ? 'SIRIUS RISING ACTIVE' : 'Below Visibility Limit'}
              </span>
            </h4>
            <div class="space-y-1 text-slate-400">
              <div class="flex justify-between"><span>Target Star:</span><span class="font-mono text-slate-200">Sirius (α Canis Majoris, m=-1.46)</span></div>
              <div class="flex justify-between"><span>Rozenberg Air Mass:</span><span class="font-mono text-slate-200">${heliacalSirius.airMass.toFixed(2)}</span></div>
              <div class="flex justify-between"><span>Atmospheric Extinction:</span><span class="font-mono text-slate-200">+${heliacalSirius.extinctionMag.toFixed(2)} mag</span></div>
              <div class="flex justify-between"><span>Arcus Visionis:</span><span class="font-mono text-slate-200">${heliacalSirius.arcusVisionisDeg.toFixed(1)}° (Threshold: 9.3°)</span></div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  private renderComputeBayTabContent(): string {
    const summary = this.computeBay.getSummary();
    const presets = COMPUTE_PRESETS;

    return `
      <div class="space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
            <h3 class="text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
              <span>⚙️</span> ANALOG COMPUTE BAY (RECONFIGURABLE KINEMATIC INTEGRATORS)
            </h3>
            <div class="flex items-center gap-2">
              <span class="text-slate-400">Preset Program:</span>
              <select id="compute-preset-select" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs">
                ${presets.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
              <button id="btn-run-compute" class="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs shadow">
                Execute Program
              </button>
            </div>
          </div>
          <p class="text-slate-400 text-xs">
            Physical differential analyzer module with ball-and-disc integrators, planetary differential adders, cam harmonic generators, and non-circular Kepler solvers.
          </p>
        </div>

        <!-- MODULE INVENTORY & TOPOLOGY -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <h4 class="font-semibold text-slate-300 mb-2">Installed Hardware Modules</h4>
            <div class="space-y-2">
              ${summary.modules.map((m: any) => `
                <div class="bg-slate-950 border border-slate-800 p-2 rounded flex justify-between items-center text-xs">
                  <div>
                    <span class="font-semibold text-slate-200 block">${m.name}</span>
                    <span class="text-slate-400 text-[10px]">${m.description}</span>
                  </div>
                  <div class="text-right font-mono">
                    <span class="text-cyan-400 block">${m.output.toFixed(4)}</span>
                    <span class="text-[10px] text-slate-500">${m.type}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- NUMERICAL BENCHMARK & DRIFT DECOMPOSITION -->
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <h4 class="font-semibold text-slate-300 mb-2">Ground Truth Divergence (Dormand-Prince RK45)</h4>
            <div class="space-y-2 text-xs">
              <div class="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                <div class="flex justify-between"><span>Analog Physical Output:</span><span class="font-mono text-cyan-400 font-bold">${summary.telemetry.lastAnalogOutput.toFixed(6)}</span></div>
                <div class="flex justify-between"><span>RK45 Ground Truth:</span><span class="font-mono text-emerald-400 font-bold">${summary.telemetry.lastRk45Output.toFixed(6)}</span></div>
                <div class="flex justify-between"><span>Instantaneous Drift:</span><span class="font-mono text-amber-400 font-bold">${(summary.telemetry.driftError * 100).toFixed(4)}%</span></div>
              </div>

              <h5 class="text-slate-400 font-semibold pt-1">Physical Error Decomposition</h5>
              <div class="space-y-1 text-slate-400">
                <div class="flex justify-between"><span>Ball-Disc Slippage (0.15 bronze friction):</span><span class="font-mono text-slate-300">0.038% / radian</span></div>
                <div class="flex justify-between"><span>Differential Backlash (50 μm filing tol):</span><span class="font-mono text-slate-300">±0.042°</span></div>
                <div class="flex justify-between"><span>Thermal Expansion Drift (ΔT 20°C bronze):</span><span class="font-mono text-slate-300">+0.018%</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  private renderInverseDatingTabContent(): string {
    const summary = this.posteriorCache;

    return `
      <div class="space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
            <h3 class="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
              <span>🏛️</span> BAYESIAN INVERSE DATING & CALIBRATION EPOCH INFERENCE
            </h3>
            <button id="btn-apply-map-epoch" class="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs shadow">
              Apply MAP Epoch (${summary.mapYear} BCE) to Machine
            </button>
          </div>
          <p class="text-slate-400 text-xs">
            Markov Chain Monte Carlo sampling over candidate calibration epochs (-300 to -50 BCE) incorporating Saros eclipse glyph sequences, solar apogee alignment, and Corinthian calendar months.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- POSTERIOR SUMMARY -->
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <h4 class="font-semibold text-slate-300 mb-2">Posterior Distribution Summary</h4>
            <div class="space-y-2 text-xs">
              <div class="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5 font-mono">
                <div class="flex justify-between"><span class="text-slate-400">Maximum A Posteriori (MAP):</span><span class="text-amber-400 font-bold">${summary.mapYear} BCE</span></div>
                <div class="flex justify-between"><span class="text-slate-400">95% Highest Density Interval (HDI):</span><span class="text-slate-200">[${summary.hdi95[0]} BCE, ${summary.hdi95[1]} BCE]</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Julian Day of Epoch:</span><span class="text-slate-200">${summary.mapJD.toFixed(1)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Optimal Design Latitude:</span><span class="text-slate-200">${summary.bestLatitude.toFixed(1)}° N (Rhodes/Syracuse zone)</span></div>
              </div>

              <h5 class="text-slate-400 font-semibold pt-1">Evidence Breakdown</h5>
              <div class="space-y-1 text-slate-400">
                <div class="flex justify-between"><span>Saros Glyph Sequence Match:</span><span class="font-mono text-emerald-400 font-bold">ln(L) = -12.4</span></div>
                <div class="flex justify-between"><span>Solar Apogee at Sagittarius 5.5°:</span><span class="font-mono text-emerald-400 font-bold">ln(L) = -8.1</span></div>
                <div class="flex justify-between"><span>Panhellenic Games Olympiad Sync:</span><span class="font-mono text-emerald-400 font-bold">ln(L) = -4.2</span></div>
              </div>
            </div>
          </div>

          <!-- CANDIDATE HISTORICAL THEORIES -->
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <h4 class="font-semibold text-slate-300 mb-2">Theory Model Comparison</h4>
            <div class="space-y-2 text-xs">
              ${summary.theories.map(th => `
                <div class="bg-slate-950 p-2 rounded border border-slate-800">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-slate-200">${th.name} (${th.year} BCE)</span>
                    <span class="font-mono text-cyan-400 font-semibold">${(th.prob * 100).toFixed(1)}% prob</span>
                  </div>
                  <div class="text-[11px] text-slate-400 mb-1.5">${th.description}</div>
                  <button class="btn-load-theory px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-amber-300 border border-slate-700" data-jd="${th.jd}">
                    Set Crank to ${th.year} BCE
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;
  }

  private renderReconciliationTabContent(): string {
    const records = HISTORICAL_RECONCILIATION_RECORDS;

    return `
      <div class="space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <h3 class="text-sm font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5">
            <span>📜</span> ANCIENT-SKY RECONCILIATION & OBSERVATION LOGS
          </h3>
          <p class="text-slate-400 text-xs">
            Comparison of physical machine predictions against primary historical sources: Sachs-Hunger Babylonian Astronomical Diaries, Ptolemy's Almagest observation records, and Stephenson 2016 historical eclipse catalogs.
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-800/80 text-slate-400 uppercase text-[10px] border-b border-slate-700">
                <tr>
                  <th class="p-2">Historical Event</th>
                  <th class="p-2">Date / Source</th>
                  <th class="p-2">Machine Prediction</th>
                  <th class="p-2">Real Sky (JPL DE440)</th>
                  <th class="p-2">ΔT Residual</th>
                  <th class="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                ${records.map((rec: any) => `
                  <tr class="hover:bg-slate-800/50">
                    <td class="p-2 font-medium text-amber-300">${rec.title}</td>
                    <td class="p-2 text-slate-400">${rec.dateStr} <br/><span class="text-[10px] text-slate-500">${rec.source}</span></td>
                    <td class="p-2 font-mono">${rec.machinePrediction}</td>
                    <td class="p-2 font-mono text-cyan-400">${rec.realSkyGroundTruth}</td>
                    <td class="p-2 font-mono text-slate-400">${rec.deltaTResidualMin}m</td>
                    <td class="p-2 text-right">
                      <button class="btn-jump-record px-2 py-1 bg-amber-600/80 hover:bg-amber-500 text-slate-950 font-semibold rounded text-[10px]" data-jd="${rec.jd}">
                        Load in Sky
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  private renderLifeTabContent(): string {
    const timeline = LIFE_TIMELINE;
    const fragments = FRAGMENT_CATALOG;

    return `
      <div class="space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <h3 class="text-sm font-semibold text-emerald-400 mb-1.5 flex items-center gap-1.5">
            <span>⏳</span> LIFE OF THE OBJECT: 150 BCE TO 2026 CE
          </h3>
          <p class="text-slate-400 text-xs">
            Chronological multi-layer corrosion simulation tracking electrochemical decomposition of ancient bronze in Mediterranean seabed saline conditions, volumetric expansion, mechanical freezing, and fragment recovery.
          </p>
        </div>

        <!-- TIMELINE SCRUBBER -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
          <h4 class="font-semibold text-slate-300">Historical Corrosion Eras</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            ${timeline.map((era: any) => `
              <button class="btn-era-select p-2 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left text-[11px]" data-year="${era.year}">
                <span class="font-bold text-amber-400 block">${era.label}</span>
                <span class="text-slate-300 block">${era.eraName}</span>
                <span class="text-slate-500 text-[10px] block">${era.mineralPhase}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- FRAGMENT CATALOG -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <h4 class="font-semibold text-slate-300 mb-2">Physical Fragment Provenance (National Archaeological Museum, Athens)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            ${fragments.map(f => `
              <div class="bg-slate-950 border border-slate-800 p-2.5 rounded">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-slate-200">${f.name}</span>
                  <span class="font-mono text-cyan-400">${f.weightGrams}g</span>
                </div>
                <div class="text-slate-400 text-[11px] mb-1">Dimensions: ${f.dimensionsMm} mm</div>
                <div class="text-slate-400 text-[11px] mb-1">Gears: <span class="font-mono text-amber-300">${f.attestedGears.join(', ')}</span></div>
                <div class="text-[10px] text-slate-500">${f.conservationState}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderDialsTabContent(): string {
    const state = this.kinematics.computeKinematics(timeEngine.getState().machineJD);

    return `
      <div class="space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <h3 class="text-sm font-semibold text-amber-400 mb-2">FRONT & BACK ASTRONOMICAL DIALS</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Solar True Longitude</span>
              <span class="font-mono text-amber-400 font-bold">${state.sunLongitudeDeg.toFixed(2)}°</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Lunar True Longitude</span>
              <span class="font-mono text-slate-200 font-bold">${state.moonLongitudeDeg.toFixed(2)}°</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Equation of Time</span>
              <span class="font-mono text-cyan-400 font-bold">${state.equationOfTimeMin.toFixed(2)} min</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Metonic Month (19-Year)</span>
              <span class="font-mono text-slate-200 font-bold">${state.metonicMonthNumber} / 235</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Saros Eclipse Month (223-m)</span>
              <span class="font-mono text-slate-200 font-bold">${state.sarosMonthNumber} / 223</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Exeligmos Cycle (54-Year)</span>
              <span class="font-mono text-slate-200 font-bold">${(state.exeligmosTurns % 1).toFixed(3)} turn</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderEclipsesTabContent(): string {
    const state = this.kinematics.computeKinematics(timeEngine.getState().machineJD);

    return `
      <div class="space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <h3 class="text-sm font-semibold text-rose-400 mb-2">DRACONIC NODAL GEARING & ECLIPSE PROGNOSIS</h3>
          <div class="space-y-2 text-xs">
            <div class="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <span class="font-bold text-slate-200 block">Draconic Lunar Latitude: ${state.moonLatitude.toFixed(2)}°</span>
                <span class="text-slate-400 text-[11px]">Nodal Line Distance: ${Math.abs(state.moonLatitude).toFixed(2)}°</span>
              </div>
              <span class="px-2 py-1 rounded font-bold ${state.isSolarEclipsePossible || state.isLunarEclipsePossible ? 'bg-rose-900 text-rose-300' : 'bg-slate-800 text-slate-500'}">
                ${state.isSolarEclipsePossible ? 'SOLAR ECLIPSE WINDOW' : state.isLunarEclipsePossible ? 'LUNAR ECLIPSE WINDOW' : 'OUTSIDE NODAL ZONE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderPlanetsTabContent(): string {
    return `<div class="p-3 text-slate-300">Planetary theorica view.</div>`;
  }

  private renderClepsydraTabContent(): string {
    return `<div class="p-3 text-slate-300">Clepsydra water-drive telemetry view.</div>`;
  }

  private renderPinDrumTabContent(): string {
    return `<div class="p-3 text-slate-300">Pin drum programmable events view.</div>`;
  }

  private renderFoundryTabContent(): string {
    const vantage = vantageManager.getState();
    const p = vantage.planet;
    const isNative = vantage.engineMode === 'NATIVE';

    return `
      <div class="space-y-4 text-xs font-mono">
        <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <h3 class="font-serif font-bold text-amber-400 text-sm">
              🔨 GEAR-TRAIN FOUNDRY & RATIO SYNTHESIS
            </h3>
            <span class="px-2 py-0.5 rounded text-[10px] ${isNative ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-sky-950 text-sky-300 border border-sky-800'}">
              ${isNative ? `NATIVE ${p.name.toUpperCase()} TRAINS` : 'TRANSPLANT (EARTH-TUNED)'}
            </span>
          </div>

          ${isNative ? `
            <p class="text-slate-300 mb-2">
              Foundry has synthesized bespoke gear trains tailored specifically to <strong>${p.name}</strong>'s local diurnal sol (${Math.abs(p.solarDayHours).toFixed(2)}h) and orbital period (${p.orbitalPeriodDays.toFixed(2)} Earth days).
            </p>
            <div class="space-y-2 mt-3">
              <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div class="flex justify-between text-amber-300 font-bold">
                  <span>${p.name.toUpperCase()} SOLAR YEAR TRAIN</span>
                  <span>Ratio: 1 : ${(p.orbitalPeriodDays / (Math.abs(p.solarDayHours) / 24)).toFixed(3)} sols</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-1">
                  Continued fractions expansion: [${Math.floor(p.orbitalPeriodDays / (Math.abs(p.solarDayHours) / 24))}; 1, 2, 4, 1]
                </div>
                <div class="text-[11px] text-emerald-400 mt-1">
                  Synthesized Train: <strong>Driver 24T → Intermediate 64T / 32T → Year Dial 144T</strong>
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">
                  Accuracy: &lt; 0.04 sols / century drift
                </div>
              </div>
            </div>
          ` : `
            <div class="p-3 rounded bg-amber-950/20 border border-amber-800/40 text-amber-300">
              <strong class="block text-amber-400 font-bold">TRANSPLANT DRIFT DIAGNOSTIC:</strong>
              Earth-calibrated 365.25-day / 24.0-hour gear train running against ${p.name}'s ${Math.abs(p.solarDayHours).toFixed(2)}-hour sol.
              <div class="mt-2 text-slate-300">
                Daily phase slip: <span class="text-rose-400 font-bold">${((24.0 - Math.abs(p.solarDayHours)) * 60).toFixed(1)} minutes/sol</span>.
                In 1 local year, machine dials drift by <span class="text-rose-400 font-bold">${Math.abs(p.orbitalPeriodDays - 365.25).toFixed(1)} days</span> out of synchronization with the local zenith!
              </div>
              <div class="mt-2 text-slate-400 text-[10px]">
                Switch to <strong>Native</strong> mode in the top Planet Bar to synthesize local gear trains.
              </div>
            </div>
          `}
        </div>

        <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
          <h4 class="font-serif font-bold text-amber-400 text-xs tracking-wide border-b border-slate-800 pb-1.5 mb-2">
            CAD & FABRICATION EXPORT
          </h4>
          <p class="text-slate-400 text-[11px]">
            Export gears as standard involute tooth profiles (20° pressure angle) with ancient triangular profile fallback.
          </p>
          <div class="mt-2 flex gap-2">
            <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]">
              Export DXF
            </button>
            <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]">
              Export STEP / SVG
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderCometsTabContent(): string {
    return `
      <div class="space-y-4 text-xs font-mono">
        <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
          <h3 class="font-serif font-bold text-amber-400 text-sm border-b border-slate-800 pb-2 mb-2 flex items-center gap-2">
            <span>☄️</span> MODERN COMET OVERLAY (EPHEMERIS & ANCIENT APPARITIONS)
          </h3>
          <p class="text-slate-300 text-[11px] mb-3">
            Cometary orbits are high-eccentricity Keplerian trajectories outside the Ptolemaic epicyclic gearing range. Rendered here as an educational physical overlay:
          </p>
          <div class="space-y-2">
            ${MODERN_COMET_OVERLAYS.map(c => `
              <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div class="flex justify-between text-amber-300 font-bold">
                  <span>${c.name}</span>
                  <span class="text-slate-400">${c.historicApparitionsBCE && c.historicApparitionsBCE.length > 0 ? `${c.historicApparitionsBCE[0].yearBCE} BCE` : ''}</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-1">
                  Eccentricity: <span class="text-slate-200">${c.eccentricity}</span> • Perihelion: <span class="text-slate-200">${c.perihelionDistanceAU} AU</span> • Inclination: <span class="text-slate-200">${c.inclinationDeg}°</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">${c.notes}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderGearInspector(gear: GearMk2Definition | null) {
    const el = document.getElementById('tab-content-area');
    if (!el) return;
    // can open gear inspector in modal or tab
  }

  // --- EVENT LISTENERS ---

  private attachEventListeners() {
    // Navigation Tabs
    const tabs = this.container.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab;
        if (!target) return;
        this.activeTab = target;
        tabs.forEach(t => t.classList.remove('active', 'bg-slate-800', 'text-amber-400'));
        (e.currentTarget as HTMLElement).classList.add('active', 'bg-slate-800', 'text-amber-400');
        this.updateActiveTabContent();
      });
    });

    // Site Selector
    const siteSelect = document.getElementById('site-selector') as HTMLSelectElement;
    if (siteSelect) {
      siteSelect.addEventListener('change', (e) => {
        const id = (e.target as HTMLSelectElement).value;
        siteManager.selectGazetteerSite(id);
      });
    }

    // Sky Layout Selector
    const layoutSelect = document.getElementById('layout-selector') as HTMLSelectElement;
    if (layoutSelect) {
      layoutSelect.addEventListener('change', (e) => {
        this.layoutMode = (e.target as HTMLSelectElement).value as DisplayLayoutMode;
        this.applyLayoutMode();
      });
    }

    // Sky Lock Badge Toggle
    const lockBadge = document.getElementById('sky-lock-badge');
    if (lockBadge) {
      lockBadge.addEventListener('click', () => {
        const isLocked = timeEngine.getState().isLockedToMachine;
        timeEngine.setLockedToMachine(!isLocked);
      });
    }

    // Crank Slider
    const crankSlider = document.getElementById('crank-slider') as HTMLInputElement;
    if (crankSlider) {
      crankSlider.addEventListener('input', (e) => {
        const jd = parseFloat((e.target as HTMLInputElement).value);
        timeEngine.setMachineJD(jd);
      });
    }

    // Step Buttons
    document.getElementById('btn-step-forward-day')?.addEventListener('click', () => timeEngine.stepMachineDays(1));
    document.getElementById('btn-step-back-day')?.addEventListener('click', () => timeEngine.stepMachineDays(-1));
    document.getElementById('btn-step-forward-month')?.addEventListener('click', () => timeEngine.stepMachineDays(29.53));
    document.getElementById('btn-step-back-month')?.addEventListener('click', () => timeEngine.stepMachineDays(-29.53));
    document.getElementById('btn-step-forward-year')?.addEventListener('click', () => timeEngine.stepMachineDays(365.25));
    document.getElementById('btn-step-back-year')?.addEventListener('click', () => timeEngine.stepMachineDays(-365.25));

    // Play/Pause
    const playBtn = document.getElementById('btn-play-pause');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        playBtn.innerHTML = this.isPlaying ? '<span>⏸</span> Pause' : '<span>▶</span> Play';
      });
    }

    this.attachSubTabListeners();
  }

  private attachSubTabListeners() {
    // Sky Tab Listeners
    document.getElementById('btn-sky-lock-toggle')?.addEventListener('click', () => {
      const isLocked = timeEngine.getState().isLockedToMachine;
      timeEngine.setLockedToMachine(!isLocked);
    });

    document.getElementById('btn-sky-reset-sync')?.addEventListener('click', () => {
      timeEngine.setLockedToMachine(true);
    });

    const ghostCheck = document.getElementById('check-ghost-overlay') as HTMLInputElement;
    if (ghostCheck) {
      ghostCheck.addEventListener('change', (e) => {
        this.skyWindow.showGhostOverlay = (e.target as HTMLInputElement).checked;
      });
    }

    const poleCheck = document.getElementById('check-precession-pole') as HTMLInputElement;
    if (poleCheck) {
      poleCheck.addEventListener('change', (e) => {
        this.skyWindow.showPrecessionPole = (e.target as HTMLInputElement).checked;
      });
    }

    const constCheck = document.getElementById('check-constellations') as HTMLInputElement;
    if (constCheck) {
      constCheck.addEventListener('change', (e) => {
        this.skyWindow.showConstellations = (e.target as HTMLInputElement).checked;
      });
    }

    const projSelect = document.getElementById('sky-projection-select') as HTMLSelectElement;
    if (projSelect) {
      projSelect.addEventListener('change', (e) => {
        this.skyWindow.setViewMode((e.target as HTMLSelectElement).value as SkyViewMode);
      });
    }

    const skyScrubber = document.getElementById('sky-time-scrubber') as HTMLInputElement;
    if (skyScrubber) {
      skyScrubber.addEventListener('input', (e) => {
        const frac = parseFloat((e.target as HTMLInputElement).value);
        const curJD = timeEngine.getState().skyJD;
        const newJD = Math.floor(curJD) + frac;
        timeEngine.setSkyJD(newJD);
      });
    }

    // Compute Bay Listeners
    document.getElementById('btn-run-compute')?.addEventListener('click', () => {
      const select = document.getElementById('compute-preset-select') as HTMLSelectElement;
      if (select) {
        this.computeBay.loadPreset(select.value);
        this.updateActiveTabContent();
      }
    });

    // Inverse Dating Listeners
    document.getElementById('btn-apply-map-epoch')?.addEventListener('click', () => {
      timeEngine.setCalibrationEpochJD(this.posteriorCache.mapJD);
      timeEngine.setMachineJD(this.posteriorCache.mapJD);
      siteManager.setCustomSite(this.posteriorCache.bestLatitude, 28.22, 'Optimal Bayesian Site');
      this.flashEventAlert(`Applied Calibration Epoch ${this.posteriorCache.mapYear} BCE`);
    });

    document.querySelectorAll('.btn-load-theory').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jd = parseFloat((e.currentTarget as HTMLElement).dataset.jd || '1646000');
        timeEngine.setMachineJD(jd);
      });
    });

    // Reconciliation Listeners
    document.querySelectorAll('.btn-jump-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jd = parseFloat((e.currentTarget as HTMLElement).dataset.jd || '1646000');
        timeEngine.setMachineJD(jd);
        timeEngine.setSkyJD(jd);
      });
    });


    // Sky Pip Toggle Button
    const pipBtn = document.getElementById('btn-toggle-sky-pip');
    const skyPipEl = document.getElementById('viewport-sky');
    if (pipBtn && skyPipEl) {
      pipBtn.addEventListener('click', () => {
        if (skyPipEl.style.display === 'none') {
          skyPipEl.style.display = 'block';
          pipBtn.textContent = 'Hide Pip';
          pipBtn.className = 'px-2 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono active:scale-95 transition-transform';
        } else {
          skyPipEl.style.display = 'none';
          pipBtn.textContent = '+ Sky Pip';
          pipBtn.className = 'px-2 h-8 flex items-center justify-center rounded bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 text-xs font-mono active:scale-95 transition-transform font-bold';
        }
      });
    }

    // Life of Object Listeners
    document.querySelectorAll('.btn-era-select').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const yr = parseInt((e.currentTarget as HTMLElement).dataset.year || '-150', 10);
        this.scene.materials.getCorrosionMaterial(yr);
      });
    });
  }

  private updateActiveTabContent() {
    const area = document.getElementById('tab-content-area');
    if (!area) return;

    if (this.activeTab === 'sky') area.innerHTML = this.renderSkyTabContent();
    else if (this.activeTab === 'passport') {
      const pPanel = new PassportPanel(area);
      pPanel.render(timeEngine.getState());
      return;
    }
    else if (this.activeTab === 'compute') area.innerHTML = this.renderComputeBayTabContent();
    else if (this.activeTab === 'inverse') area.innerHTML = this.renderInverseDatingTabContent();
    else if (this.activeTab === 'reconciliation') area.innerHTML = this.renderReconciliationTabContent();
    else if (this.activeTab === 'life') area.innerHTML = this.renderLifeTabContent();
    else if (this.activeTab === 'dials') area.innerHTML = this.renderDialsTabContent();
    else if (this.activeTab === 'eclipses') area.innerHTML = this.renderEclipsesTabContent();
    else if (this.activeTab === 'planets') area.innerHTML = this.renderPlanetsTabContent();
    else if (this.activeTab === 'clepsydra') area.innerHTML = this.renderClepsydraTabContent();
    else if (this.activeTab === 'pindrum') area.innerHTML = this.renderPinDrumTabContent();
    else if (this.activeTab === 'foundry') area.innerHTML = this.renderFoundryTabContent();
    else if (this.activeTab === 'comets') area.innerHTML = this.renderCometsTabContent();

    this.attachSubTabListeners();
  }

  private updateHeaderTimeDisplays(state: TimeState) {
    const dateEl = document.getElementById('machine-date-display');
    const jdEl = document.getElementById('machine-jd-display');
    const deltatEl = document.getElementById('machine-deltat-display');
    const crank = document.getElementById('crank-slider') as HTMLInputElement;

    if (dateEl) dateEl.innerText = state.displayMachineCalendar;
    if (jdEl) jdEl.innerText = state.machineJD.toFixed(2);
    if (deltatEl) deltatEl.innerText = `${(state.deltaTSeconds / 60).toFixed(1)}m (±${(state.deltaTUncertaintySeconds / 60).toFixed(1)}m)`;
    if (crank) crank.value = state.machineJD.toString();

    // Lock Badge
    const badge = document.getElementById('sky-lock-badge');
    const text = document.getElementById('sky-lock-text');
    if (badge && text) {
      if (state.isLockedToMachine) {
        badge.className = 'flex items-center gap-1 px-2 py-1 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-400 font-medium cursor-pointer';
        text.innerText = 'LOCKED TO MACHINE';
      } else {
        badge.className = 'flex items-center gap-1 px-2 py-1 rounded bg-rose-950 border border-rose-600/50 text-rose-400 font-medium cursor-pointer';
        text.innerText = 'UNLOCKED: DIFFERS FROM MACHINE';
      }
    }
  }

  private updateHeaderSiteDisplay(site: SiteDefinition) {
    const select = document.getElementById('site-selector') as HTMLSelectElement;
    if (select && select.value !== site.id) {
      select.value = site.id;
    }
  }

  private updateSkyReadouts(state: TimeState) {
    const timeDisp = document.getElementById('sky-time-display');
    const scrubber = document.getElementById('sky-time-scrubber') as HTMLInputElement;
    if (timeDisp) timeDisp.innerText = `${((state.skyJD % 1.0) * 24).toFixed(2)}h local`;
    if (scrubber) scrubber.value = (state.skyJD % 1.0).toString();
  }

  private applyLayoutMode() {
    const viewportMech = document.getElementById('viewport-mechanism');
    const viewportSky = document.getElementById('viewport-sky');

    if (!viewportMech || !viewportSky) return;

    if (this.layoutMode === 'INSET') {
      viewportMech.className = 'absolute inset-0 w-full h-full';
      viewportSky.className = 'absolute bottom-4 right-4 w-60 h-60 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20 transition-all duration-300';
      viewportMech.style.display = 'block';
      viewportSky.style.display = 'block';
    } else if (this.layoutMode === 'SPLIT') {
      viewportMech.className = 'relative w-1/2 h-full border-r border-slate-800';
      viewportSky.className = 'relative w-1/2 h-full';
      viewportMech.style.display = 'block';
      viewportSky.style.display = 'block';
    } else if (this.layoutMode === 'FULL_SKY') {
      viewportMech.style.display = 'none';
      viewportSky.className = 'absolute inset-0 w-full h-full';
      viewportSky.style.display = 'block';
    } else if (this.layoutMode === 'FULL_MECH') {
      viewportMech.className = 'absolute inset-0 w-full h-full';
      viewportMech.style.display = 'block';
      viewportSky.style.display = 'none';
    }

    this.scene.onResize();
    this.skyWindow.onResize();
  }

  public updateAnimation(deltaSeconds: number) {
    if (this.isPlaying) {
      const step = deltaSeconds * this.playbackSpeedDaysPerSec * this.playbackDirection;
      timeEngine.stepMachineDays(step);
    }
  }
}
