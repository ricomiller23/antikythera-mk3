import { vantageManager, VantageState } from '../vantage/vantageManager.ts';
import { PlanetSkyEngine, PlanetSkyCircumstances } from '../sky/planetSkyEngine.ts';
import { TimeState } from '../time/timeEngine.ts';

export class PassportPanel {
  private container: HTMLElement;
  private earthWeightKg: number = 70;
  private earthAgeYears: number = 30;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(timeState: TimeState) {
    const vantage = vantageManager.getState();
    const p = vantage.planet;
    const skyCirc: PlanetSkyCircumstances = PlanetSkyEngine.computeLocalSky(vantage, timeState.skyJD);

    // Calculations
    const weightLocal = (this.earthWeightKg * (p.gravityMPerS2 / 9.80665)).toFixed(1);
    const weightRatio = (p.gravityMPerS2 / 9.80665).toFixed(2);
    const ageLocal = (this.earthAgeYears / p.orbitalPeriodYears).toFixed(2);

    // Escape speed approximate: v = sqrt(2 * g * R)
    // We compute empirical escape velocities for the 9 bodies
    const escapeVelMap: Record<string, number> = {
      mercury: 4.25,
      venus: 10.36,
      earth: 11.19,
      mars: 5.03,
      jupiter: 59.5,
      saturn: 35.5,
      uranus: 21.3,
      neptune: 23.5,
      pluto: 1.21
    };
    const escapeVel = escapeVelMap[p.id] || 11.2;

    // Local Date formatting
    let localDateString = '';
    if (p.id === 'earth') {
      localDateString = `JD ${timeState.skyJD.toFixed(1)} (Callippic Cycle IV, Year 1)`;
    } else if (p.id === 'mars') {
      const msd = (timeState.skyJD - 2405522.0028779) / 1.027491252;
      const daranSol = Math.floor(msd % 668.6);
      localDateString = `Mars Sol Date: ${msd.toFixed(1)} (Sol ${daranSol} of 668 Martian Year)`;
    } else if (p.id === 'venus') {
      const venusDays = (timeState.skyJD - 2451545.0) / (p.solarDayHours / 24.0);
      localDateString = `Venusian Diurnal Sol ${venusDays.toFixed(1)} (Retrograde West-Rise)`;
    } else if (p.id === 'mercury') {
      const mercDays = (timeState.skyJD - 2451545.0) / (p.solarDayHours / 24.0);
      localDateString = `Mercurian Solar Day ${mercDays.toFixed(1)} (3:2 Spin-Orbit Resonance)`;
    } else {
      localDateString = `Local Diurnal Sol: ${skyCirc.localSolarSolNumber} (Epoch J2000.0)`;
    }

    const earthInSky = skyCirc.earthInSky;

    this.container.innerHTML = `
      <div class="space-y-4 text-xs font-sans">
        
        <!-- HEADER CARD: PLANETARY IDENTITY & PASSPORT BADGE -->
        <div class="p-3 rounded-lg border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🛂</span>
              <div>
                <h3 class="text-sm font-bold font-serif text-amber-400 tracking-wide">
                  INTERPLANETARY PASSPORT
                </h3>
                <p class="text-[11px] font-mono text-slate-400">
                  Vantage: <span class="text-slate-200 font-semibold">${p.name}</span> (${p.greekName}) • Site: <span class="text-amber-300">${vantage.site.name}</span>
                </p>
              </div>
            </div>
            <div class="mt-2 text-[11px] font-mono text-slate-300">
              ${localDateString}
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${vantage.isFictionalMode ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'}">
              ${vantage.isFictionalMode ? 'FICTIONAL VANTAGE' : 'EARTH BASELINE'}
            </span>
            <div class="text-[10px] text-slate-400 font-mono mt-1">
              Mode: <strong class="text-slate-200">${vantage.engineMode}</strong>
            </div>
          </div>
        </div>

        <!-- TWO COLUMN GRID: USER PHYSICAL BIOMETRICS ON THIS WORLD -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <!-- WEIGHT ON WORLD -->
          <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>⚖️</span> Weight on ${p.name}
                </span>
                <span class="font-mono text-[10px] text-amber-400/80">${weightRatio}g</span>
              </div>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-amber-400" id="val-passport-weight">${weightLocal}</span>
                <span class="text-slate-400 font-mono text-xs">kg</span>
                <span class="text-slate-500 text-[10px]">(${Math.round(parseFloat(weightLocal) * 2.20462)} lbs)</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">
                Calculated from local surface gravity <span class="font-mono text-slate-300">${p.gravityMPerS2} m/s²</span>.
              </p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[10px]">
              <span class="text-slate-400">Earth Weight:</span>
              <input
                id="input-earth-weight"
                type="number"
                value="${this.earthWeightKg}"
                min="10"
                max="300"
                class="w-16 bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-300 font-mono text-right"
              />
              <span class="text-slate-400">kg</span>
            </div>
          </div>

          <!-- AGE IN LOCAL YEARS -->
          <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>🎂</span> Age in ${p.name} Years
                </span>
                <span class="font-mono text-[10px] text-amber-400/80">Period: ${p.orbitalPeriodYears.toFixed(2)} Earth yrs</span>
              </div>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-amber-400" id="val-passport-age">${ageLocal}</span>
                <span class="text-slate-400 font-mono text-xs">${p.name} yrs</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">
                Orbital period = <span class="font-mono text-slate-300">${p.orbitalPeriodDays.toFixed(1)} days</span> (${p.orbitalPeriodYears.toFixed(2)} Earth yr).
              </p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[10px]">
              <span class="text-slate-400">Earth Age:</span>
              <input
                id="input-earth-age"
                type="number"
                value="${this.earthAgeYears}"
                min="1"
                max="120"
                class="w-16 bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-amber-300 font-mono text-right"
              />
              <span class="text-slate-400">years</span>
            </div>
          </div>
        </div>

        <!-- "FIND EARTH" RADAR CARD -->
        <div class="p-3 rounded-lg border border-sky-900/40 bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">🌍</span>
              <h4 class="font-serif font-bold text-sky-400 text-xs tracking-wide">
                "FIND EARTH" TELEMETRY & LIGHT-TIME RADAR
              </h4>
            </div>
            <span class="font-mono text-[10px] px-2 py-0.5 rounded ${earthInSky.isAboveHorizon ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}">
              ${p.id === 'earth' ? 'TERRESTRIAL GROUND' : earthInSky.isAboveHorizon ? 'ABOVE HORIZON' : 'BELOW HORIZON'}
            </span>
          </div>

          ${p.id === 'earth' ? `
            <p class="text-slate-400 text-[11px] py-1">
              Currently observing from Earth. To see Earth in the sky as a celestial wandering star, select Mars, Venus, Jupiter, Saturn, Uranus, Neptune, or Pluto in the Planet Bar above.
            </p>
          ` : `
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <span class="text-slate-400 text-[10px] block">Light-Time Delay:</span>
                <span class="text-amber-400 font-bold text-sm">${earthInSky.lightTimeMinutes}</span>
                <span class="text-slate-500 text-[10px] block">minutes (1-way)</span>
              </div>
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <span class="text-slate-400 text-[10px] block">Distance:</span>
                <span class="text-slate-200 font-bold text-sm">${earthInSky.distanceAU.toFixed(2)}</span>
                <span class="text-slate-500 text-[10px] block">AU (${(earthInSky.distanceAU * 149.6).toFixed(0)}M km)</span>
              </div>
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <span class="text-slate-400 text-[10px] block">Apparent Visual Mag:</span>
                <span class="text-cyan-300 font-bold text-sm">${earthInSky.apparentMagnitude.toFixed(1)}</span>
                <span class="text-slate-500 text-[10px] block">${earthInSky.apparentMagnitude < 0 ? 'Brilliant beacon' : 'Modest star'}</span>
              </div>
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <span class="text-slate-400 text-[10px] block">Local Horizon:</span>
                <span class="text-slate-200 font-bold text-sm">Alt ${earthInSky.altDeg.toFixed(1)}°</span>
                <span class="text-slate-500 text-[10px] block">Az ${earthInSky.azDeg.toFixed(0)}° (Phase ${earthInSky.phaseAngleDeg.toFixed(0)}°)</span>
              </div>
            </div>
            <div class="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Earth-Moon separation as seen from here: <strong class="text-slate-300">${earthInSky.separationFromMoonArcmin.toFixed(1)}'</strong> (resolvable binary pair)</span>
              <button id="btn-point-earth" class="px-2 py-0.5 rounded bg-sky-800 hover:bg-sky-700 text-sky-100 font-sans font-medium text-[10px] transition-colors active:scale-95">
                Target Earth in Sky
              </button>
            </div>
          `}
        </div>

        <!-- PLANETARY ENVIRONMENT & ATMOSPHERE TELEMETRY -->
        <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
          <h4 class="font-serif font-bold text-amber-400 text-xs tracking-wide border-b border-slate-800 pb-1.5 mb-2 flex items-center gap-2">
            <span>🌡️</span> LOCAL ENVIRONMENT & ATMOSPHERE
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div class="p-2 rounded bg-slate-950/40 border border-slate-800/60">
              <span class="text-slate-400 text-[10px] block">Surface Pressure:</span>
              <span class="text-slate-200 font-semibold">${p.surfacePressureBar} bar</span>
              <span class="text-[9px] text-slate-500 block">(${p.surfacePressureBar > 10 ? 'Crushing dense' : p.surfacePressureBar < 0.01 ? 'Near vacuum' : 'Atmospheric'})</span>
            </div>
            <div class="p-2 rounded bg-slate-950/40 border border-slate-800/60">
              <span class="text-slate-400 text-[10px] block">Temperature Range:</span>
              <span class="text-slate-200 font-semibold">${p.tempRangeC[0]}°C to ${p.tempRangeC[1]}°C</span>
              <span class="text-[9px] text-slate-500 block">(Mean ${p.meanTempC}°C)</span>
            </div>
            <div class="p-2 rounded bg-slate-950/40 border border-slate-800/60">
              <span class="text-slate-400 text-[10px] block">Escape Velocity:</span>
              <span class="text-slate-200 font-semibold">${escapeVel.toFixed(2)} km/s</span>
              <span class="text-[9px] text-slate-500 block">(Surface ballistic escape)</span>
            </div>
            <div class="p-2 rounded bg-slate-950/40 border border-slate-800/60">
              <span class="text-slate-400 text-[10px] block">Solar Irradiance:</span>
              <span class="text-slate-200 font-semibold">${(p.solarIrradianceFraction * 100).toFixed(1)}% of Earth</span>
              <span class="text-[9px] text-slate-500 block">(Flux at ${p.semiMajorAxisAU.toFixed(2)} AU)</span>
            </div>
            <div class="p-2 rounded bg-slate-950/40 border border-slate-800/60">
              <span class="text-slate-400 text-[10px] block">Sun Angular Size:</span>
              <span class="text-slate-200 font-semibold">${p.solarAngularDiameterDeg.toFixed(3)}°</span>
              <span class="text-[9px] text-slate-500 block">(${((p.solarAngularDiameterDeg / 0.533) * 100).toFixed(0)}% Earth Sun size)</span>
            </div>
            <div class="p-2 rounded bg-slate-950/40 border border-slate-800/60">
              <span class="text-slate-400 text-[10px] block">Obliquity (Tilt):</span>
              <span class="text-slate-200 font-semibold">${p.obliquityDeg}°</span>
              <span class="text-[9px] text-slate-500 block">${p.obliquityDeg > 90 ? 'Extreme / Retrograde' : 'Seasonal tilt'}</span>
            </div>
          </div>
        </div>

        <!-- CLEPSYDRA FLUID DRIVE STATUS & ACOUSTICS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <!-- FLUID DRIVE DIAGNOSIS -->
          <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-serif font-bold text-xs text-amber-400 flex items-center gap-1.5">
                <span>💧</span> Clepsydra Fluid Drive
              </span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${p.fluidDriveState === 'WORKS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}">
                ${p.fluidDriveState}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
              ${p.fluidFailureReason}
            </p>
            <p class="text-[10px] text-slate-400 mt-2">
              Ancient water clocks require liquid water at ~1 bar pressure and 0–100°C.
            </p>
          </div>

          <!-- ACOUSTIC ENVIRONMENT & GONG -->
          <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-serif font-bold text-xs text-amber-400 flex items-center gap-1.5">
                <span>🔔</span> Acoustic Gong & Sound
              </span>
              <span class="font-mono text-[10px] text-slate-400">
                ${p.speedOfSoundMPerS > 0 ? `${p.speedOfSoundMPerS} m/s` : 'Vacuum (0 m/s)'}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
              ${p.speedOfSoundMPerS === 0 ? 'Vacuum: No atmospheric medium to transmit acoustic sound waves.' : `Atmosphere supports sound at ${p.speedOfSoundMPerS} m/s.`}
            </p>
            <div class="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
              <span class="text-slate-400">Audio Simulation Mode:</span>
              <button
                id="btn-toggle-acoustics"
                class="px-2 py-0.5 rounded border ${vantage.acousticsMode === 'REALISTIC' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-amber-600 text-slate-950 border-amber-500 font-bold'}"
              >
                ${vantage.acousticsMode === 'REALISTIC' ? 'Realistic (Physics Silent)' : 'Engine Fun (Audible)'}
              </button>
            </div>
          </div>
        </div>

        <!-- LOCAL LIVE EVENTS FEED -->
        <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
          <h4 class="font-serif font-bold text-amber-400 text-xs tracking-wide border-b border-slate-800 pb-1.5 mb-2 flex items-center gap-2">
            <span>📡</span> LOCAL LIVE ASTRONOMICAL EVENT FEED
          </h4>
          ${skyCirc.activeEvents.length > 0 ? `
            <div class="space-y-1.5">
              ${skyCirc.activeEvents.map(evt => `
                <div class="p-2 rounded bg-amber-950/40 border border-amber-800/50 text-[11px] font-mono text-amber-200 flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <span class="animate-pulse text-amber-400">●</span>
                    <strong>${evt.replace(/_/g, ' ')}</strong>
                  </span>
                  <span class="text-[10px] text-amber-300/80">IN PROGRESS</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-2.5 rounded bg-slate-950/40 border border-slate-800/60 text-[11px] font-mono text-slate-400">
              No occultation or solar transit currently active from this landmark coordinates. Check orbital phase advances using the Time Crank.
            </div>
          `}

          <!-- MOONS OF THIS BODY -->
          ${skyCirc.moons.length > 0 ? `
            <div class="mt-3">
              <span class="text-slate-400 text-[10px] font-mono uppercase tracking-wider block mb-1">Local Satellites:</span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                ${skyCirc.moons.map(m => `
                  <div class="p-1.5 rounded bg-slate-950/50 border border-slate-800/80">
                    <div class="flex items-center justify-between text-slate-200 font-semibold">
                      <span>${m.name}</span>
                      <span class="${m.isAboveHorizon ? 'text-emerald-400' : 'text-slate-500'}">${m.isAboveHorizon ? 'Visible' : 'Set'}</span>
                    </div>
                    <div class="text-[9px] text-slate-400 mt-0.5">
                      Alt: ${m.altDeg.toFixed(1)}° • Dia: ${m.apparentDiameterArcmin.toFixed(1)}'
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

      </div>
    `;

    this.bindEvents(vantage);
  }

  private bindEvents(vantage: VantageState) {
    const inputWeight = this.container.querySelector('#input-earth-weight') as HTMLInputElement;
    inputWeight?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(val) && val > 0) {
        this.earthWeightKg = val;
        const weightLocal = (this.earthWeightKg * (vantage.planet.gravityMPerS2 / 9.80665)).toFixed(1);
        const el = this.container.querySelector('#val-passport-weight');
        if (el) el.textContent = weightLocal;
      }
    });

    const inputAge = this.container.querySelector('#input-earth-age') as HTMLInputElement;
    inputAge?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(val) && val > 0) {
        this.earthAgeYears = val;
        const ageLocal = (this.earthAgeYears / vantage.planet.orbitalPeriodYears).toFixed(2);
        const el = this.container.querySelector('#val-passport-age');
        if (el) el.textContent = ageLocal;
      }
    });

    const btnAcoustics = this.container.querySelector('#btn-toggle-acoustics');
    btnAcoustics?.addEventListener('click', () => {
      const nextMode = vantage.acousticsMode === 'REALISTIC' ? 'FUN' : 'REALISTIC';
      vantageManager.setAcousticsMode(nextMode);
    });

    const btnPointEarth = this.container.querySelector('#btn-point-earth');
    btnPointEarth?.addEventListener('click', () => {
      // Direct call to center camera on Earth in the 3D Sky Window if available
      const sky = (window as any).__skyWindow;
      if (sky && sky.pointAtEarth) {
        sky.pointAtEarth();
      }
    });
  }
}
