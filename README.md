# Antikythera Mk III: The Engine

> **DISCLAIMER:** *Antikythera Mk III is a speculative, physically-simulated engineered extrapolation, NOT a historical artefact.*

Antikythera Mk III is an interactive, physically grounded 3D mechanical and astronomical simulation that couples the Hellenistic Antikythera Mechanism (Mk I) and its speculative automation successor (Mk II) with a standing, physically-accurate celestial observatory window and a reconfigurable mechanical analog computer.

---

## Core Systems & Highlights

1. **Standing Sky Window (Locked to Machine Date):**
   - Direct two-way bidirectional link: scrubbing sky time of day rotates the physical crank, dials, and planetary arbors in real time.
   - Unlockable mode with explicit `[UNLOCKED: DIFFERS FROM MACHINE]` status pill.
   - 48 Ptolemaic constellations, 80+ Yale Bright Star Catalog stars with IAU 2006 precession and proper motion.
   - Bennett-Saemundsson atmospheric refraction & Rozenberg air mass photometric extinction.
   - Schaefer heliacal rising/setting visibility criterion.
   - Local eclipse circumstances with Stephenson (2016) $\Delta T$ uncertainty bands ($\pm 2\sigma$).
   - Multiple projections: Hemisphere Dome, Local Horizon, Stereographic All-Sky.
   - Layout options: Inset window, Split 50/50 screen, Fullscreen Sky, Fullscreen Mechanism.

2. **Reconfigurable Analog Compute Bay:**
   - Physical differential analyzer modules: Ball-and-disc mechanical integrators, planetary differential adders, cam harmonic generators, and non-circular Kepler solvers.
   - Ground truth numerical benchmark against Dormand-Prince (RK45) with instantaneous drift and physical error decomposition (slip, backlash, filing tolerance).

3. **Bayesian Inverse Calibration Dating Sampler:**
   - Markov Chain Monte Carlo (MCMC) posterior distribution over candidate calibration epochs (-300 to -50 BCE).
   - Maximum A Posteriori (MAP) identification (Carman & Evans 2014 benchmark at 205 BCE) with 95% Highest Density Interval (HDI).
   - One-click MAP calibration epoch application directly to the mechanism.

4. **Ancient-Sky Reconciliation Engine:**
   - Ingestion of primary historical sources: Sachs-Hunger Babylonian Astronomical Diaries, Claudius Ptolemy's Almagest observation records, and Stephenson 2016 historical eclipse catalogs.
   - One-click "Load in Sky Window" to compare physical gear predictions against actual ground-truth celestial coordinates.

5. **Life of the Object (150 BCE – 2026 CE):**
   - Multi-phase electrochemical corrosion simulation tracking nantokite, cuprite, malachite, and marine concretion in Mediterranean seabed saline conditions.
   - Physical Fragment A-G catalog from the National Archaeological Museum in Athens.

---

## Technical Stack & Architecture

- **Engine:** Vite, Three.js, TypeScript, Tailwind CSS, Web Workers.
- **Testing:** Vitest with strict prebuild assertions (`npm run prebuild`).
- **Zero Backend:** Fully client-side execution running at 60 FPS in WebGL/WebGPU.

---

## Running Locally

```bash
npm install
npm test
npm run dev
```
