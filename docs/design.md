# Antikythera Mk III: "The Engine" — System Architecture & Design Specification

**Classification:** Speculative Engineering Design Specification  
**Status:** Approved for Implementation  
**Date:** 2026-11-01  

---

## 1. System Overview & Philosophy

Antikythera Mk III ("The Engine") is a speculative, physically-simulated successor to the Antikythera Mechanism that merges ancient Greek gear kinematics with early modern mechanical analog computing (Kelvin/Bush differential integration), modern computational ephemerides (VSOP87, ELP-2000, IAU 2006 precession), an interactive **Standing Sky Window**, an inverse Bayesian dating engine, and an ancient observation reconciliation suite.

### Core Architectural Mandates
1. **Single Source of Truth**:
   - `SharedTimeEngine`: One engine maps dial readings $\leftrightarrow$ Julian Day $\leftrightarrow$ UTC/TT $\leftrightarrow$ calendar dates across all modules.
   - `SharedSiteManager`: One geographic site (lat, lon, elev, horizon profile) drives the Sky Window, the Mk II latitude plate, seasonal hours, local eclipse circumstances, and observation fits.
2. **Two-Way Crank Link**:
   - The Sky Window is locked to the machine's date by default.
   - Scrubbing the sky's time-of-day slider physically rotates the machine's diurnal and annual arbors.
   - Unlocking the sky displays a persistent "differs from machine" banner with a one-click resync.
3. **Ghost Overlay Comparison**:
   - Renders the machine's mechanical pointer positions (Sun, Moon, planets) directly onto the real sky dome with error vectors to true ephemeris positions.
4. **Epistemological Honesty**:
   - All historical dating posteriors show credible intervals and prior sensitivity toggles.
   - Eclipse visibilities and heliacal risings display date/geographic ranges accounting for multi-millennial $\Delta T$ uncertainty bands ($15^\circ/\text{hr}$).

---

## 2. Master System Architecture Diagram

```
                                +-----------------------------+
                                |      SharedTimeEngine       |
                                |  (JD, Epoch, DeltaT Spline) |
                                +--------------+--------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
      +-----------------------------+                     +-----------------------------+
      |  AntikytheraKinematicsCore  | <--- Two-Way Link ->|          SkyWindow          |
      |   (Mk I, Mk II, Mk III)     |   (Crank & Diurnal) |   (Stereo, Horizon, Dome)   |
      +--------------+--------------+                     +--------------+--------------+
                     |                                                   |
        +------------+------------+                         +------------+------------+
        |                         |                         |                         |
        v                         v                         v                         v
+---------------+         +---------------+         +---------------+         +---------------+
| AnalogCompute |         | InverseEngine |         | Reconciliation|         |  LifeOfObject |
|  - Ball & Disc|         |  - Bayesian   |         |  - Babylonian |         |  - Seabed     |
|  - Cam Gen    |         |    Dating     |         |    Diaries    |         |    Corrosion  |
|  - ODE Solver |         |  - Gear Search|         |  - DeltaT Fit |         |  - Fragments  |
+---------------+         +---------------+         +---------------+         +---------------+
```

---

## 3. Module Specifications

### 3.1 The Standing Sky Window (`src/sky/`)
- **Projections**:
  - `DOME`: Stereographic zenith-centered projection of the full upper hemisphere with horizon cutoff.
  - `HORIZON`: Rectilinear panorama focused along the horizon for rise/set and heliacal observation.
  - `ALL_SKY`: Flat celestial chart showing both hemispheres with ecliptic, equator, and galactic plane.
- **Atmospheric Physics**:
  - Refraction: Bennett-Saemundsson algorithm adjusting apparent altitude.
  - Extinction: Rozenberg airmass model dimming objects near the horizon.
  - Sky Brightness: Rayleigh twilight model computing daylight, civil ($-6^\circ$), nautical ($-12^\circ$), and astronomical ($-18^\circ$) twilight.
- **Ptolemaic Constellations**:
  - 48 ancient constellations with Greek names, English translations, and line segment geometry.
  - 80+ bright navigational stars with proper motion and B-V color temperatures.
- **Heliacal & Crescent Engine**:
  - Computes visibility windows for Sirius, Arcturus, Pleiades, Spica, and the 5 visible planets using Schaefer's physical model.
  - First visible lunar crescent calculated via Babylonian, Yallop, and Odeh criteria.
- **Precession Mode**:
  - Animates the path of the north celestial pole over a 25,772-year cycle (Thuban $\to$ Kochab $\to$ Polaris $\to$ Gamma Cephei $\to$ Vega).

### 3.2 Analog Compute Bay (`src/computebay/`)
- **Mechanical Modules**:
  1. `BallAndDiscIntegrator`: Continuous mechanical integrator $z = \frac{1}{R} \int y \, dx$.
  2. `DifferentialAdder`: Bevel-gear differential adder $z = \frac{1}{2}(x \pm y)$.
  3. `CamFunctionGenerator`: Cylindrical cam evaluating $z = \sin(x)$ or Kepler anomalies.
  4. `GearMultiplier`: Constant ratio multiplication via tooth pairs.
- **Preset Programs**:
  - Kepler orbit integration ($r(\theta)$ and orbital energy conservation).
  - Damped harmonic oscillator ($\ddot{x} + 2\zeta\omega\dot{x} + \omega^2 x = 0$).
  - Restricted three-body system.
- **Numerical Reference & Error Breakdown**:
  - Executes simultaneous Dormand-Prince (RK45) integration.
  - Dynamically decomposes mechanical divergence into backlash, friction slip, manufacturing tolerance, and truncation error.

### 3.3 Inverse Bayesian Dating Engine (`src/inverse/`)
- Evaluates likelihood functions across candidate calibration epochs:
  - Saros eclipse glyph sequence match likelihood.
  - Metonic calendar month alignment likelihood.
  - Games dial quadrant match likelihood.
  - Parapegma stellar phase concordance.
- Generates Markov Chain Monte Carlo (MCMC) posterior distributions over epoch years ($-300$ to $-50$ BCE) and candidate latitudes ($31^\circ$ to $38^\circ\text{N}$).

### 3.4 Ancient-Sky Reconciliation (`src/reconciliation/`)
- Database of 30+ historical astronomical observations (Babylonian lunar and solar eclipses, Ptolemy's Almagest occultations, Stephenson & Morrison records).
- Real-time residual calculator determining the implied $\Delta T$ and identifying historical dating or calendar discrepancies.

### 3.5 Life of the Object & Seabed Corrosion (`src/life/`)
- Interactive timeline spanning 150 BCE to 2026 CE.
- Multi-layer corrosion growth model:
  - Uncorroded bronze core ($88\%\text{ Cu}, 12\%\text{ Sn}$).
  - Nantokite ($\text{CuCl}$) inner layer.
  - Cuprite ($\text{Cu}_2\text{O}$) intermediate layer.
  - Malachite / paratacamite outer crust with $2.1\times$ volumetric expansion and gear tooth fusion.
- Fragment A–G provenance and 3D coverage mapping.

---

## 4. UI Layout & View Modes
- **Left ~60% Area**: Master WebGL canvas. Switchable between:
  - `SPLIT` (50% 3D Machine, 50% Sky Window side by side).
  - `INSET` (Full 3D Machine with floating resizable Sky Window PiP).
  - `FULL_MACHINE` (100% 3D Machine).
  - `FULL_SKY` (100% Sky Dome).
- **Right ~40% Area**: Scrollable tabbed control suite (Machine Transport, Sky Window Controls, Astronomical Lab, Compute Bay, Inverse Dating, Reconciliation, Life of Object, Foundry, Fabrication, Modern Comets, Provenance).

*(Proceeding to Milestone Implementation)*
