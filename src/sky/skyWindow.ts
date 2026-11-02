import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HighPrecisionSkyEngine, SkyBodyPosition } from './skyEngine.ts';
import { PTOLEMAIC_STARS, AncientStar } from '../data/starCatalog.ts';
import { SiteDefinition } from '../site/siteManager.ts';
import { TimeState } from '../time/timeEngine.ts';
import { vantageManager } from '../vantage/vantageManager.ts';
import { PlanetSkyEngine } from './planetSkyEngine.ts';

export type SkyViewMode = 'DOME' | 'HORIZON' | 'ALL_SKY';

export class SkyWindow {
  public container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private starMesh!: THREE.Points;
  private constellationLines!: THREE.LineSegments;
  private sunMesh!: THREE.Mesh;
  private moonMesh!: THREE.Mesh;
  private earthMesh!: THREE.Mesh;
  private planetMeshes: Map<string, THREE.Mesh> = new Map();
  private ghostMarkers: Map<string, THREE.Mesh> = new Map();
  private errorVectors: Map<string, THREE.Line> = new Map();
  private polePathLine!: THREE.Line;
  private horizonMesh!: THREE.Mesh;

  private viewMode: SkyViewMode = 'DOME';
  public showGhostOverlay: boolean = true;
  public showPrecessionPole: boolean = false;
  public showConstellations: boolean = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050811);

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 2000);
    this.camera.position.set(0, 15, 35);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 150;
    this.controls.minDistance = 5;

    // 1. Build Sky Elements
    this.buildStars();
    this.buildConstellationLines();
    this.buildSunAndMoon();
    this.buildPlanets();
    this.buildGhostOverlay();
    this.buildPrecessionPolePath();
    this.buildHorizon();

    // Register global handle for controls
    (window as any).__skyWindow = this;

    // ResizeObserver
    const ro = new ResizeObserver(() => this.onResize());
    ro.observe(this.container);
  }

  private buildStars() {
    const starGeom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    PTOLEMAIC_STARS.forEach(s => {
      // Celestial sphere radius 80
      const r = 80;
      const phi = (s.dec * Math.PI) / 180;
      const theta = (s.ra * Math.PI) / 180;
      positions.push(r * Math.cos(phi) * Math.cos(theta), r * Math.sin(phi), r * Math.cos(phi) * Math.sin(theta));

      const c = new THREE.Color(s.mag < 0.5 ? 0xbae6fd : s.mag < 1.5 ? 0xfef08a : 0xf8fafc);
      colors.push(c.r, c.g, c.b);
    });

    starGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    this.starMesh = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starMesh);
  }

  private buildConstellationLines() {
    // Basic classical constellation connector lines
    const linePositions: number[] = [];
    const r = 79.5;

    // Connect prominent asterisms (Ursa Major, Orion, Cassiopeia, Taurus)
    const connectPairs: [number, number][] = [
      [27, 28], // Polaris vicinity
      [31, 32], // Orion belt
      [32, 33],
      [30, 31],
      [33, 34],
      [14, 15], // Ursa Major dipper
      [15, 16],
      [16, 17],
      [17, 18],
      [18, 19],
      [19, 20]
    ];

    connectPairs.forEach(([i1, i2]) => {
      const s1 = PTOLEMAIC_STARS[i1 % PTOLEMAIC_STARS.length];
      const s2 = PTOLEMAIC_STARS[i2 % PTOLEMAIC_STARS.length];
      if (s1 && s2) {
        const p1 = (s1.dec * Math.PI) / 180;
        const t1 = (s1.ra * Math.PI) / 180;
        const p2 = (s2.dec * Math.PI) / 180;
        const t2 = (s2.ra * Math.PI) / 180;

        linePositions.push(
          r * Math.cos(p1) * Math.cos(t1), r * Math.sin(p1), r * Math.cos(p1) * Math.sin(t1),
          r * Math.cos(p2) * Math.cos(t2), r * Math.sin(p2), r * Math.cos(p2) * Math.sin(t2)
        );
      }
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.6
    });

    this.constellationLines = new THREE.LineSegments(geom, mat);
    this.scene.add(this.constellationLines);
  }

  private buildSunAndMoon() {
    // Sun Mesh (Radiant Gold)
    const sunGeom = new THREE.SphereGeometry(2.4, 24, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // Moon Mesh (Silver Pearl)
    const moonGeom = new THREE.SphereGeometry(1.8, 20, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);
  }

  private buildPlanets() {
    const pNames = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const pColors: Record<string, number> = {
      mercury: 0x14b8a6,
      venus: 0xf43f5e,
      mars: 0xef4444,
      jupiter: 0xf59e0b,
      saturn: 0xa855f7
    };

    pNames.forEach(name => {
      const geom = new THREE.SphereGeometry(1.2, 16, 12);
      const mat = new THREE.MeshBasicMaterial({ color: pColors[name] });
      const mesh = new THREE.Mesh(geom, mat);
      this.planetMeshes.set(name, mesh);
      this.scene.add(mesh);
    });

    // Earth Mesh (Visible when vantage point is on another planet)
    const earthGeom = new THREE.SphereGeometry(1.6, 20, 16);
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.earthMesh = new THREE.Mesh(earthGeom, earthMat);
    this.earthMesh.visible = false;
    this.scene.add(this.earthMesh);
  }

  private buildGhostOverlay() {
    const names = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    names.forEach(name => {
      const ghostGeom = new THREE.RingGeometry(0.8, 1.4, 24);
      const ghostMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const marker = new THREE.Mesh(ghostGeom, ghostMat);
      this.ghostMarkers.set(name, marker);
      this.scene.add(marker);

      // Line connecting ghost to real position
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.5,
        gapSize: 0.3
      });
      const line = new THREE.Line(lineGeom, lineMat);
      this.errorVectors.set(name, line);
      this.scene.add(line);
    });
  }

  private buildPrecessionPolePath() {
    // 25,772-year circle around Ecliptic Pole
    const points: THREE.Vector3[] = [];
    const r = 80;
    const eclipticLat = 66.56 * (Math.PI / 180); // Distance to pole ~ 23.44°
    const coneRadius = Math.sin(23.44 * (Math.PI / 180)) * r;
    const coneHeight = Math.cos(23.44 * (Math.PI / 180)) * r;

    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(
        coneRadius * Math.cos(angle),
        coneHeight,
        coneRadius * Math.sin(angle)
      ));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.7
    });

    this.polePathLine = new THREE.Line(geom, mat);
    this.polePathLine.visible = false;
    this.scene.add(this.polePathLine);
  }

  private buildHorizon() {
    // Compass Horizon Ring & Cardinal Markers
    const geom = new THREE.RingGeometry(72, 73, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    this.horizonMesh = new THREE.Mesh(geom, mat);
    this.horizonMesh.rotation.x = Math.PI / 2;
    this.scene.add(this.horizonMesh);

    // Ground plane disc
    const groundGeom = new THREE.CircleGeometry(72, 48);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x090d16,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const groundDisc = new THREE.Mesh(groundGeom, groundMat);
    groundDisc.rotation.x = Math.PI / 2;
    groundDisc.position.y = -0.1;
    this.scene.add(groundDisc);
  }

  public setViewMode(mode: SkyViewMode) {
    this.viewMode = mode;
    if (mode === 'HORIZON') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 4, 38);
    } else if (mode === 'ALL_SKY') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 95, 0);
    } else {
      // DOME
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 20, 45);
    }
    this.controls.update();
  }

  public pointAtEarth() {
    if (this.earthMesh && this.earthMesh.visible) {
      const pos = this.earthMesh.position.clone();
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(-pos.x * 0.45, -pos.y * 0.45 + 5, -pos.z * 0.45);
      this.controls.update();
    }
  }

  private altAzToVector(altDeg: number, azDeg: number, radius: number = 75): THREE.Vector3 {
    const phi = (altDeg * Math.PI) / 180;
    const theta = ((azDeg + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      radius * Math.cos(phi) * Math.cos(theta),
      radius * Math.sin(phi),
      radius * Math.cos(phi) * Math.sin(theta)
    );
  }

  public updateSky(
    timeState: TimeState,
    site: SiteDefinition,
    planets: Record<string, { lon: number; lat: number }>,
    mechanismPredictions: Record<string, { lon: number; lat: number }>
  ) {
    const vantage = vantageManager.getState();
    const epsRad = (23.439 * Math.PI) / 180;

    if (vantage.bodyId !== 'earth') {
      // NON-EARTH PLANETARY VANTAGE
      const pCirc = PlanetSkyEngine.computeLocalSky(vantage, timeState.skyJD);

      // 1. Position Sun at local planetary coordinates
      const sunPos = this.altAzToVector(pCirc.sunAltDeg, pCirc.sunAzDeg, 76);
      this.sunMesh.position.copy(sunPos);

      // 2. Set Sky Background tone
      if (vantage.bodyId === 'venus' && !vantage.cloudPierce) {
        this.scene.background = new THREE.Color(0x9a8532); // Sulfuric opaque clouds
      } else {
        this.scene.background = new THREE.Color(pCirc.skyBackgroundHex);
      }

      // 3. Show Earth as a brilliant wandering star in the local sky
      this.earthMesh.visible = true;
      const earthPos = this.altAzToVector(pCirc.earthInSky.altDeg, pCirc.earthInSky.azDeg, 77);
      this.earthMesh.position.copy(earthPos);

      // Hide terrestrial moon mesh when not on Earth
      this.moonMesh.visible = false;

      // Update positions of other planets
      for (const [pName, pMesh] of this.planetMeshes) {
        if (pName === vantage.bodyId) {
          pMesh.visible = false; // Don't render active planet in its own sky
        } else {
          pMesh.visible = true;
          const p = planets[pName];
          if (p) {
            const pRaRad = Math.atan2(Math.sin((p.lon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((p.lon * Math.PI) / 180));
            const pDecRad = Math.asin(Math.sin(epsRad) * Math.sin((p.lon * Math.PI) / 180));
            const pHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(pRaRad * 180 / Math.PI, pDecRad * 180 / Math.PI, site.latitude, 0);
            const pos = this.altAzToVector(pHoriz.altDeg, pHoriz.azDeg, 77);
            pMesh.position.copy(pos);
          }
        }
      }

    } else {
      // TERRESTRIAL BASELINE VANTAGE
      this.earthMesh.visible = false;
      this.moonMesh.visible = true;

      const gmst = HighPrecisionSkyEngine.computeGMST(timeState.skyJD);
      const lst = (gmst + site.longitude + 360) % 360;

      // 1. Update Sun Position
      const n = timeState.skyJD - 2451545.0;
      const L = (280.460 + 0.9856474 * n) % 360;
      const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
      const sunEclLon = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360;
      const sunRaRad = Math.atan2(Math.sin((sunEclLon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((sunEclLon * Math.PI) / 180));
      const sunDecRad = Math.asin(Math.sin(epsRad) * Math.sin((sunEclLon * Math.PI) / 180));
      const sunRaDeg = (sunRaRad * 180 / Math.PI + 360) % 360;
      const sunDecDeg = (sunDecRad * 180 / Math.PI);

      const sunHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(sunRaDeg, sunDecDeg, site.latitude, lst);
      const sunPos = this.altAzToVector(sunHoriz.altDeg, sunHoriz.azDeg, 76);
      this.sunMesh.position.copy(sunPos);

      // Dynamic Twilight / Sky background color
      if (sunHoriz.altDeg > 0) {
        this.scene.background = new THREE.Color(0x0c2444); // Daytime sky
      } else if (sunHoriz.altDeg > -6) {
        this.scene.background = new THREE.Color(0x181e36); // Civil twilight
      } else if (sunHoriz.altDeg > -12) {
        this.scene.background = new THREE.Color(0x0e1322); // Nautical twilight
      } else {
        this.scene.background = new THREE.Color(0x050811); // Deep night
      }

      // 2. Update Moon Position
      const moonEclLon = (218.316 + 13.176396 * n) % 360;
      const moonRaRad = Math.atan2(Math.sin((moonEclLon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((moonEclLon * Math.PI) / 180));
      const moonDecRad = Math.asin(Math.sin(epsRad) * Math.sin((moonEclLon * Math.PI) / 180));
      const moonHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(moonRaRad * 180 / Math.PI, moonDecRad * 180 / Math.PI, site.latitude, lst);
      const moonPos = this.altAzToVector(moonHoriz.altDeg, moonHoriz.azDeg, 75);
      this.moonMesh.position.copy(moonPos);

      // 3. Update Planets
      for (const [pName, pMesh] of this.planetMeshes) {
        pMesh.visible = true;
        const p = planets[pName];
        if (p) {
          const pRaRad = Math.atan2(Math.sin((p.lon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((p.lon * Math.PI) / 180));
          const pDecRad = Math.asin(Math.sin(epsRad) * Math.sin((p.lon * Math.PI) / 180) + Math.cos(epsRad) * Math.sin((p.lat * Math.PI) / 180));
          const pHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(pRaRad * 180 / Math.PI, pDecRad * 180 / Math.PI, site.latitude, lst);
          const pos = this.altAzToVector(pHoriz.altDeg, pHoriz.azDeg, 77);
          pMesh.position.copy(pos);
        }
      }
    }

    // 4. Ghost Overlay (Mechanism Predictions vs Real Sky)
    if (this.showGhostOverlay) {
      for (const [name, marker] of this.ghostMarkers) {
        const mech = mechanismPredictions[name];
        if (mech) {
          const mRaRad = Math.atan2(Math.sin((mech.lon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((mech.lon * Math.PI) / 180));
          const mDecRad = Math.asin(Math.sin(epsRad) * Math.sin((mech.lon * Math.PI) / 180));
          const mHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(mRaRad * 180 / Math.PI, mDecRad * 180 / Math.PI, site.latitude, 0);
          const ghostPos = this.altAzToVector(mHoriz.altDeg, mHoriz.azDeg, 74);

          marker.visible = true;
          marker.position.copy(ghostPos);
          marker.lookAt(0, 0, 0);

          // Update error line vector
          const errLine = this.errorVectors.get(name);
          if (errLine) {
            let targetPos: THREE.Vector3 | null = null;
            if (name === 'sun') targetPos = this.sunMesh.position;
            else if (name === 'moon') targetPos = this.moonMesh.position;
            else if (this.planetMeshes.has(name)) targetPos = this.planetMeshes.get(name)!.position;

            if (targetPos) {
              errLine.visible = true;
              const posAttr = errLine.geometry.attributes.position as THREE.BufferAttribute;
              posAttr.setXYZ(0, ghostPos.x, ghostPos.y, ghostPos.z);
              posAttr.setXYZ(1, targetPos.x, targetPos.y, targetPos.z);
              posAttr.needsUpdate = true;
              (errLine.material as THREE.LineDashedMaterial).needsUpdate = true;
            }
          }
        }
      }
    } else {
      this.ghostMarkers.forEach(m => m.visible = false);
      this.errorVectors.forEach(l => l.visible = false);
    }

    // 5. Precession Pole Path
    if (this.polePathLine) {
      this.polePathLine.visible = this.showPrecessionPole;
    }

    // 6. Constellation lines
    if (this.constellationLines) {
      this.constellationLines.visible = this.showConstellations;
    }

    this.render();
  }

  public render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
      this.render();
    }
  }

  public fitToHorizon() {
    this.setViewMode('HORIZON');
  }

  public fitToZenith() {
    this.setViewMode('ALL_SKY');
  }
}
