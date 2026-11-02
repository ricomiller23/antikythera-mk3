# Antikythera Mk III: "The Engine" — Definitive Research Dossier
## Theoretical Foundations, Analog Computing Precedents, Astronomical Datasets, and Observational Reconciliation

**Author:** Antigravity Computational Astronomy & Ancient Science Research Group  
**Status:** Canonical Foundation Specification  
**Date:** 2026-11-01  
**Project:** Antikythera Mk III — "The Engine"

---

## 1. Epistemological Framework & Provenance Taxonomy

Antikythera Mk III ("The Engine") extends the historical artifact (Mk I, c. 150–60 BCE) and its speculative hydraulic/geometric predecessor (Mk II) into a unified computational astronomy platform and mechanical analog computing laboratory.

Every variable, model, algorithm, and dataset in Antikythera Mk III is classified under strict epistemological boundaries:
1. **ATTESTED**: Physically observed in surviving fragments (A–G, 1–82) in the National Archaeological Museum in Athens (CT scans, X-ray tomography, PTM surface imaging per Freeth et al. 2006, 2008, 2012, 2021).
2. **INFERRED**: Mandated by surviving inscriptions (Front Cover Inscription, Back Cover Inscription, Parapegma star list) or exact mathematical closures (Callippic dial, Corinthian month names, 2016 Jones Games dial quadrant readings).
3. **CONJECTURAL**: Modern academic gear reconstructions closing missing sections (e.g. Freeth 2021 planetary trains, 462y Venus and 442y Saturn pinions).
4. **SPECULATIVE-NEW**: Modern or historical engineered extrapolations (Analog Compute Bay, Thomson ball-and-disc integrators, Bush differential analyzer, inverse Bayesian dating engine, real-time Sky Window, WebXR interface).

---

## 2. Mechanical Analog Computing Precedents

| Mechanism | Historical Precedent & Inventors | Era | Mathematical Function | Feasibility Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Ball-and-Disc Integrator** | James Thomson (1876); William Thomson (Lord Kelvin, 1876 *Harmonic Analyzer*) | 1876 CE | Continuous mechanical integration: $z = \frac{1}{R} \int y(x) \, dx$ via rotating disc, friction balls, and output cylinder. | **NEEDS LATER TECH (Precision Tooling c. 1870)** |
| **Mechanical Differential Adder** | James White (1788); David Napier; Mk I Antikythera turntable $E_3$ | c. 100 BCE / 1788 CE | Computes $z = \frac{1}{2}(x \pm y)$ via bevel gears or planetary carrier. | **ATTESTED in Mk I (Sun-Moon epicycle differential)** |
| **3D Cam Function Generator** | Hannibal Ford (1915); US Navy Mark I Fire Control Computer (1939) | 1915–1940 CE | Evaluates bivariate functions $z = f(x, y)$ via barrel cams with dual-axis follower pins. | **NEEDS LATER TECH (Industrial Precision)** |
| **Non-Circular Kepler Gears** | Johannes Kepler (1609); Cunningham (1960); Bair (2002) | 1609 / 1960 CE | Solves Kepler's equation $M = E - e \sin E$ mechanically via variable-pitch gear profiles. | **NEEDS LATER TECH (Numerical Gear Shaping)** |
| **Eccentric Pin-and-Slot Linkage** | Hipparchus of Nicaea (c. 130 BCE); Apollonius of Perga (c. 200 BCE) | c. 200 BCE | Generates sinusoidal anomaly $\Delta \theta = \arcsin\left(\frac{e}{r} \sin M\right)$ for lunar anomaly. | **ATTESTED in Mk I ($K_1/K_2$ pair)** |

---

## 3. Computational Astronomy, Ephemerides & Sky-Engine Formulations

### 3.1 Long-Term Precession and Obliquity Models
1. **IAU 2006 / P03 Model (Capitaine et al. 2003)**:
   - High-accuracy polynomial precession model valid for $\pm 2000$ years around J2000.0.
   - General precession in longitude: $p_A = 5028.796195'' t + 1.1054348'' t^2 + \dots$ ($t$ in Julian centuries).
2. **Vondrák, Capitaine & Wallace (2011)**:
   - Long-term precession model for multi-millennial time spans ($\pm 200,000$ years) derived from numerical integrations and Fourier-polynomial fits.
   - Valid across the full historical span from 3000 BCE to 3000 CE in Antikythera Mk III.
3. **Obliquity of the Ecliptic ($\epsilon$)**:
   - Laskar (1986) / IAU 2006 formula:
     $$\epsilon(T) = 23^\circ 26' 21.406'' - 46.836769'' T - 0.0001831'' T^2 + 0.00200340'' T^3 - \dots$$
     where $T = (\text{JD} - 2451545.0) / 36525$.

### 3.2 Terrestrial Time, Universal Time, and Historical DeltaT ($\Delta T$)
Earth's rotation rate is decelerating due to lunar tidal friction and post-glacial isostatic rebound:
$$\Delta T = \text{TT} - \text{UT}$$
Antikythera Mk III implements the canonical multi-millennial spline model of **Stephenson, Morrison & Hohenkerk (2016)** (*Proceedings of the Royal Society A*):
- For dates before 1820 CE:
  $$\Delta T \approx -20 + 32.0 \times \left(\frac{\text{year} - 1820}{1000}\right)^2 \text{ seconds}$$
- At the Antikythera calibration epoch (c. 205 BCE / year $-204$):
  $$t = (-204 - 1820)/1000 = -2.024$$
  $$\Delta T = -20 + 32.0 \times (-2.024)^2 \approx 111.1 \text{ minutes} \approx 1.85 \text{ hours}$$
- **Positional Shift on Earth**:
  Every hour of $\Delta T$ shifts the Earth's orientation by $15^\circ$ of terrestrial longitude. For ancient solar and lunar eclipses, neglecting $\Delta T$ causes eclipse paths to miss historical observation sites by thousands of kilometers.
- **Uncertainty Band ($\pm 2\sigma$)**:
  Incorporated explicitly in the Sky Window as a geographic and temporal confidence band rather than an over-confident single point.

### 3.3 Atmospheric Optics, Extinction & Visibility Criteria
1. **Atmospheric Refraction**:
   - Formula of Bennett (1982) with Saemundsson (1986) temperature and pressure correction:
     $$R = \frac{P}{1010} \frac{283}{273 + T} \times \left(\frac{1.02}{\tan\left(h_0 + \frac{10.3}{h_0 + 5.11}\right)} + 0.0019\right) \text{ arcminutes}$$
   - Near the horizon ($h = 0^\circ$), refraction raises the apparent altitude by approximately $34'$ (more than the apparent solar diameter).
2. **Atmospheric Extinction (Bemporad / Rozenberg Air Mass)**:
   - Optical air mass $X(z)$:
     $$X(z) = \frac{1}{\cos z + 0.025 \exp(-11 \cos z)}$$
   - Extinction in visual magnitude $\Delta m_V = k_V \times X(z)$ where $k_V \approx 0.15 - 0.25$ for clear Mediterranean skies.
3. **Heliacal Rising Criteria**:
   - **B.E. Schaefer (1993, 2000)** physical model: Accounts for solar depression angle, atmospheric transparency $k_V$, star magnitude $m_V$, observer visual acuity, and sky background luminance.
   - **Babylonian Empirical Rule**: Sun depression $h_{\odot} \approx -10^\circ$ to $-12^\circ$ when the star is at altitude $h_* \approx +2^\circ$ to $+5^\circ$.
4. **First Crescent (New Moon) Sighting Criteria**:
   - **Babylonian**: Moon altitude at sunset $\ge 10^\circ$, elongation $\ge 12^\circ$.
   - **Yallop (1997)**: Uses topocentric arc of vision ($ARCV$) and crescent width ($W$), computing parameter $q$:
     $$q = \frac{ARCV - (11.8371 - 6.3226 W + 0.7319 W^2 - 0.1018 W^3)}{10}$$
     with sighting classes A (easily visible) through F (not possible).
   - **Odeh (2004)**: Improved empirical formulation.

---

## 4. Historical Gazetteer & Ancient Sites

Antikythera Mk III bundles an offline, rigorously sourced dataset of ancient Mediterranean, Near-Eastern, and global astronomical observatories:
- **Antikythera Island** ($35^\circ 51' 40''\text{N}, 23^\circ 18' 18''\text{E}$, elev. 40m) — Shipwreck discovery site.
- **Alexandria, Egypt** ($31^\circ 12' 00''\text{N}, 29^\circ 55' 00''\text{E}$, elev. 5m) — Library, Ctesibius, Heron, Ptolemy.
- **Rhodes, Greece** ($36^\circ 26' 00''\text{N}, 28^\circ 13' 00''\text{E}$, elev. 15m) — Hipparchus, Posidonius.
- **Athens, Greece** ($37^\circ 58' 18''\text{N}, 23^\circ 43' 36''\text{E}$, elev. 70m) — Meton, Tower of the Winds.
- **Olympia, Greece** ($37^\circ 38' 18''\text{N}, 21^\circ 37' 51''\text{E}$, elev. 45m) — Olympic Games site.
- **Delphi, Greece** ($38^\circ 28' 56''\text{N}, 22^\circ 30' 05''\text{E}$, elev. 570m) — Pythian Games & sanctuary.
- **Syracuse, Sicily** ($37^\circ 04' 00''\text{N}, 15^\circ 17' 00''\text{E}$, elev. 15m) — Archimedes.
- **Rome, Italy** ($41^\circ 53' 36''\text{N}, 12^\circ 29' 32''\text{E}$, elev. 21m) — Vitruvius, Roman calendar reforms.
- **Babylon, Mesopotamia** ($32^\circ 32' 11''\text{N}, 44^\circ 25' 15''\text{E}$, elev. 28m) — Chaldean astronomical diaries.
- **Uruk, Mesopotamia** ($31^\circ 19' 20''\text{N}, 45^\circ 40' 00''\text{E}$, elev. 18m) — Seleucid astronomical cuneiform.
- **Stonehenge, UK** ($51^\circ 10' 44''\text{N}, 01^\circ 49' 34''\text{W}$, elev. 102m) — Megalithic solstitial alignment.
- **Chichen Itza, Mexico** ($20^\circ 40' 58''\text{N}, 88^\circ 34' 07''\text{W}$, elev. 25m) — Maya El Caracol observatory.

---

## 5. Marine Corrosion & Physical Conservation Science

Bronze artifacts submerged for two millennia in deep seawater undergo electrochemical transformation (MacLeod 1982, Robbiola et al. 1998):
1. **Primary Alloy**: Cu-Sn alloy ($\approx 88\%\text{ Cu}, 12\%\text{ Sn}, <1\%\text{ Pb}$); Fragment A mass $\approx 369\text{ g}$.
2. **Electrochemical Stages**:
   - Initial anodic oxidation: $\text{Cu} \to \text{Cu}^+ + e^-$.
   - Chloride reaction: Formation of nantokite ($\text{CuCl}$) adjacent to the uncorroded core metal.
   - Oxygen-rich diffusion: Hydrolysis of $\text{CuCl}$ into cuprite ($\text{Cu}_2\text{O}$) and hydrochloric acid ($\text{HCl}$), driving autocatalytic pitting ("bronze disease").
   - Outer crust: Precipitation of basic copper carbonates (malachite $\text{Cu}_2\text{CO}_3(\text{OH})_2$) and oxychlorides (atacamite/paratacamite $\text{Cu}_2\text{Cl}(\text{OH})_3$).
3. **Volumetric Growth Factor**:
   - Molar volume of copper: $V_m(\text{Cu}) = 7.11\text{ cm}^3/\text{mol}$.
   - Molar volume of malachite: $V_m = 55.4\text{ cm}^3/\text{mol}$.
   - Volumetric expansion factor $\approx 1.8 - 2.4\times$ the original bronze thickness, causing adjacent gear teeth in Fragment A to fuse and cement together under sea-bottom carbonate sediment.
   - Modeled dynamically in the **Life of the Object** time-lapse.

*(Proceeding to Phase 2: System Architecture & Design Specification)*
