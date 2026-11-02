import { vantageManager, VantageState, EngineMode } from '../vantage/vantageManager.ts';
import { PLANETS_DATA, PlanetId } from '../data/planetsData.ts';

export class PlanetBar {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupListeners();
    this.setupKeyShortcuts();

    vantageManager.onVantageChange((state) => {
      this.updateState(state);
    });
  }

  private render() {
    const planets: PlanetId[] = [
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

    this.container.innerHTML = `
      <div class="flex flex-col border-b border-slate-800 bg-slate-950 text-xs">
        <!-- TOP ROW: PLANET BUTTONS & VANTAGE ENGINE CONTROLS -->
        <div class="flex flex-wrap items-center justify-between px-3 py-1.5 gap-2 border-b border-slate-900">
          
          <!-- BRAND / MODE INDICATOR -->
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-serif font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <span>🪐</span> <span class="hidden sm:inline">PLANET MODE:</span>
            </span>
            <span id="planet-bar-active-title" class="font-mono text-slate-300 font-semibold text-[11px]">Earth (Gaia)</span>
          </div>

          <!-- 9 PLANET DISK BUTTONS (SHORTCUTS 1-9) -->
          <div class="flex items-center gap-1 overflow-x-auto py-0.5" id="planet-buttons-container">
            ${planets.map((pId, idx) => {
              const p = PLANETS_DATA[pId];
              const shortcutKey = idx + 1;
              return `
                <button
                  class="planet-btn px-2 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono border transition-all duration-150 active:scale-95"
                  data-planet="${pId}"
                  title="${p.name} (${p.greekName}) — Press '${shortcutKey}' to switch"
                >
                  <span class="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style="background-color: ${p.skyColorHex};"></span>
                  <span class="font-medium">${p.name}</span>
                  <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">${shortcutKey}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- ENGINE MODE SWITCHER: TRANSPLANT VS NATIVE -->
          <div class="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-md border border-slate-800 shrink-0">
            <span class="text-slate-400 text-[10px] uppercase font-mono px-1">Engine:</span>
            <button
              id="btn-engine-transplant"
              class="px-2 py-0.5 rounded text-[11px] font-mono transition-colors active:scale-95 font-semibold"
              title="Earth-tuned gears running against local day train (drifts out of step)"
            >
              Transplant
            </button>
            <button
              id="btn-engine-native"
              class="px-2 py-0.5 rounded text-[11px] font-mono transition-colors active:scale-95 font-semibold"
              title="Foundry-derived gear trains tailored specifically to local astronomical cycles"
            >
              Native
            </button>
          </div>
        </div>

        <!-- CONTEXT ROW: SPECIAL CONTROLS & HONESTY BANNER -->
        <div class="flex flex-wrap items-center justify-between px-3 py-1 gap-2 bg-slate-900/40 text-[11px] font-mono">
          <!-- CONTEXTUAL CONTROLS FOR ACTIVE BODY -->
          <div id="planet-bar-context-controls" class="flex items-center gap-3">
            <!-- Injected dynamically based on active planet -->
          </div>

          <!-- HONESTY BANNER (PERSISTENT & TRUTHFUL) -->
          <div id="planet-bar-honesty-banner" class="flex items-center gap-1.5 text-[10px] text-amber-400/90 font-mono">
            <span>⚠️</span>
            <span id="honesty-text">Fictional extension: no historical mechanism ran on this planet. Physics is real; the build is speculative.</span>
          </div>
        </div>
      </div>
    `;
  }

  private setupListeners() {
    // Planet buttons
    const btns = this.container.querySelectorAll('.planet-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = (e.currentTarget as HTMLElement).dataset.planet as PlanetId;
        if (pId) {
          vantageManager.setBody(pId);
        }
      });
    });

    // Transplant vs Native
    const btnTransplant = this.container.querySelector('#btn-engine-transplant');
    const btnNative = this.container.querySelector('#btn-engine-native');

    btnTransplant?.addEventListener('click', () => {
      vantageManager.setEngineMode('TRANSPLANT');
    });

    btnNative?.addEventListener('click', () => {
      vantageManager.setEngineMode('NATIVE');
    });
  }

  private setupKeyShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore if inside text input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key;
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 9) {
        const planets: PlanetId[] = [
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
        const targetPlanet = planets[num - 1];
        if (targetPlanet) {
          vantageManager.setBody(targetPlanet);
        }
      }
    });
  }

  private updateState(state: VantageState) {
    const { bodyId, planet, engineMode, isFictionalMode, cloudPierce, opticalDepthDust } = state;

    // 1. Update Title
    const titleEl = this.container.querySelector('#planet-bar-active-title');
    if (titleEl) {
      titleEl.textContent = `${planet.name} (${planet.greekName}) ${planet.isDwarfPlanet ? '[Dwarf Planet]' : ''}`;
    }

    // 2. Update Planet Buttons Active Styling
    const btns = this.container.querySelectorAll('.planet-btn');
    btns.forEach(btn => {
      const p = (btn as HTMLElement).dataset.planet;
      if (p === bodyId) {
        btn.className = 'planet-btn px-2 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono border transition-all duration-150 bg-amber-500/20 text-amber-300 border-amber-500/60 shadow';
      } else {
        btn.className = 'planet-btn px-2 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono border transition-all duration-150 bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700';
      }
    });

    // 3. Update Engine Mode Buttons
    const btnTransplant = this.container.querySelector('#btn-engine-transplant');
    const btnNative = this.container.querySelector('#btn-engine-native');

    if (btnTransplant && btnNative) {
      if (engineMode === 'TRANSPLANT') {
        btnTransplant.className = 'px-2 py-0.5 rounded text-[11px] font-mono bg-sky-600 text-white shadow font-semibold';
        btnNative.className = 'px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 font-normal';
      } else {
        btnTransplant.className = 'px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 font-normal';
        btnNative.className = 'px-2 py-0.5 rounded text-[11px] font-mono bg-amber-600 text-slate-950 shadow font-semibold';
      }
    }

    // 4. Update Honesty Banner
    const honestyEl = this.container.querySelector('#honesty-text');
    const honestyBanner = this.container.querySelector('#planet-bar-honesty-banner');
    if (honestyEl && honestyBanner) {
      if (isFictionalMode) {
        honestyBanner.className = 'flex items-center gap-1.5 text-[10px] text-amber-400 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50';
        honestyEl.textContent = 'Fictional extension: no historical mechanism ran on this planet. Physics is real; the build is speculative.';
      } else {
        honestyBanner.className = 'flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-900/40 px-2 py-0.5 rounded border border-slate-800';
        honestyEl.textContent = 'Historical baseline: Earth coordinate frame, Hipparchus & Ptolemy astronomical cycles.';
      }
    }

    // 5. Update Context Controls
    const contextContainer = this.container.querySelector('#planet-bar-context-controls');
    if (contextContainer) {
      let html = '';

      // Landmark dropdown for active planet
      html += `
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400">Site:</span>
          <select id="planet-site-select" class="bg-slate-800 text-slate-200 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">
            ${planet.landmarks.map(l => `
              <option value="${l.id}" ${l.id === state.site.id ? 'selected' : ''}>
                ${l.name} (${l.latitude > 0 ? '+' : ''}${l.latitude.toFixed(1)}°, ${l.longitude.toFixed(1)}°)
              </option>
            `).join('')}
          </select>
        </div>
      `;

      if (bodyId === 'venus') {
        html += `
          <button
            id="btn-cloud-pierce"
            class="px-2 py-0.5 rounded text-[10px] font-mono border ${cloudPierce ? 'bg-amber-600 text-slate-950 border-amber-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700'}"
            title="Toggle cloud piercing to view celestial sky through opaque sulfuric acid cloud deck"
          >
            ${cloudPierce ? '☁️ Cloud-Pierce: ON' : '☁️ Cloud-Pierce: OFF (Opaque)'}
          </button>
        `;
      } else if (bodyId === 'mars') {
        html += `
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400" title="Atmospheric dust optical depth affecting sky scattering and blue sunsets">Dust τ:</span>
            <input
              id="slider-dust-tau"
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value="${opticalDepthDust}"
              class="w-16 accent-amber-500 cursor-pointer"
            />
            <span class="text-amber-400 font-mono text-[10px]">${opticalDepthDust.toFixed(1)}</span>
          </div>
        `;
      } else if (bodyId === 'saturn') {
        html += `
          <div class="flex items-center gap-1 text-[10px]">
            <span class="text-slate-400">Rotation:</span>
            <span class="text-amber-400" title="Disputed rotation period: Cassini 10h 47m 06s vs Voyager 10h 39m 22s">10h 47m (Cassini)</span>
          </div>
        `;
      }

      contextContainer.innerHTML = html;

      // Bind contextual controls
      const siteSelect = contextContainer.querySelector('#planet-site-select') as HTMLSelectElement;
      siteSelect?.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        const landmark = planet.landmarks.find(l => l.id === val);
        if (landmark) {
          vantageManager.setSite({
            id: landmark.id,
            name: landmark.name,
            latitudeDeg: landmark.latitude,
            longitudeDeg: landmark.longitude,
            elevationMeters: 0,
            isPlanetocentric: true,
            isEastLongitude: true
          });
        }
      });

      const btnCloud = contextContainer.querySelector('#btn-cloud-pierce');
      btnCloud?.addEventListener('click', () => {
        vantageManager.setCloudPierce(!cloudPierce);
      });

      const sliderDust = contextContainer.querySelector('#slider-dust-tau') as HTMLInputElement;
      sliderDust?.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        vantageManager.setDustOpticalDepth(val);
      });
    }
  }
}
