import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HighPrecisionSkyEngine, SkyBodyPosition } from './skyEngine.ts';
import { PTOLEMAIC_STARS, AncientStar } from '../data/starCatalog.ts';
import { SiteDefinition } from '../site/siteManager.ts';
import { TimeState } from '../time/timeEngine.ts';

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
    const lineGeom = new THREE.BufferGeometry();
    const linePoints: number[] = [];

    // Connect prominent classical asterisms (Orion, Ursa Major, Gemini, etc.)
    for (let i = 0; i < PTOLEMAIC_STARS.length - 1; i += 2) {
      const s1 = PTOLEMAIC_STARS[i];
      const s2 = PTOLEMAIC_STARS[i + 1];
      const p1 = this.getSpherePos(s1.ra, s1.dec, 79.8);
      const p2 = this.getSpherePos(s2.ra, s2.dec, 79.8);
      linePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }

    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35
    });
    this.constellationLines = new THREE.LineSegments(lineGeom, lineMat);
    this.scene.add(this.constellationLines);
  }

  private buildSunAndMoon() {
    // Sun
    const sunGeom = new THREE.SphereGeometry(2.5, 24, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // Moon
    const moonGeom = new THREE.SphereGeometry(1.8, 24, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.1,
      roughness: 0.8
    });
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

      // Error line segment connecting ghost to true position
      const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xf43f5e,
        dashSize: 0.5,
        gapSize: 0.3
      });
      const line = new THREE.Line(lineGeom, lineMat);
      this.errorVectors.set(name, line);
      this.scene.add(line);
    });
  }

  private buildPrecessionPolePath() {
    const points: THREE.Vector3[] = [];
    const epsRad = (23.44 * Math.PI) / 180;
    const eclipticNorth = new THREE.Vector3(0, 80 * Math.sin(Math.PI / 2 - epsRad), 0);

    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      const r = 80 * Math.sin(epsRad);
      const x = r * Math.cos(a);
      const y = 80 * Math.cos(epsRad);
      const z = r * Math.sin(a);
      points.push(new THREE.Vector3(x, y, z));
    }

    const pathGeom = new THREE.BufferGeometry().setFromPoints(points);
    const pathMat = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.65
    });
    this.polePathLine = new THREE.Line(pathGeom, pathMat);
    this.polePathLine.visible = false;
    this.scene.add(this.polePathLine);
  }

  private buildHorizon() {
    const horizonGeom = new THREE.CylinderGeometry(82, 82, 1.2, 64, 1, true);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      side: THREE.DoubleSide
    });
    this.horizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
    this.horizonMesh.position.y = -0.6;
    this.scene.add(this.horizonMesh);
  }

  private getSpherePos(raDeg: number, decDeg: number, radius: number): THREE.Vector3 {
    const phi = (decDeg * Math.PI) / 180;
    const theta = (raDeg * Math.PI) / 180;
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
    const gmst = HighPrecisionSkyEngine.computeGMST(timeState.skyJD);
    const lst = (gmst + site.longitude + 360) % 360;

    // 1. Update Sun Position
    const n = timeState.skyJD - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
    const sunEclLon = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360;
    const epsRad = (23.439 * Math.PI) / 180;
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
      const p = planets[pName];
      if (p) {
        const pRaRad = Math.atan2(Math.sin((p.lon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((p.lon * Math.PI) / 180));
        const pDecRad = Math.asin(Math.sin(epsRad) * Math.sin((p.lon * Math.PI) / 180) + Math.cos(epsRad) * Math.sin((p.lat * Math.PI) / 180));
        const pHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(pRaRad * 180 / Math.PI, pDecRad * 180 / Math.PI, site.latitude, lst);
        const pos = this.altAzToVector(pHoriz.altDeg, pHoriz.azDeg, 77);
        pMesh.position.copy(pos);
      }
    }

    // 4. Ghost Overlay (Mechanism Predictions vs Real Sky)
    if (this.showGhostOverlay) {
      for (const [name, marker] of this.ghostMarkers) {
        const mech = mechanismPredictions[name];
        if (mech) {
          const mRaRad = Math.atan2(Math.sin((mech.lon * Math.PI) / 180) * Math.cos(epsRad), Math.cos((mech.lon * Math.PI) / 180));
          const mDecRad = Math.asin(Math.sin(epsRad) * Math.sin((mech.lon * Math.PI) / 180));
          const mHoriz = HighPrecisionSkyEngine.equatorialToHorizontal(mRaRad * 180 / Math.PI, mDecRad * 180 / Math.PI, site.latitude, lst);
          const ghostPos = this.altAzToVector(mHoriz.altDeg, mHoriz.azDeg, 74);

          marker.visible = true;
          marker.position.copy(ghostPos);
          marker.lookAt(0, 0, 0);

          // Update error line vector
          const errLine = this.errorVectors.get(name);
          if (errLine) {
            errLine.visible = true;
            let truePos = ghostPos;
            if (name === 'sun') truePos = this.sunMesh.position;
            else if (name === 'moon') truePos = this.moonMesh.position;
            else if (this.planetMeshes.has(name)) truePos = this.planetMeshes.get(name)!.position;

            const posAttr = errLine.geometry.attributes.position as THREE.BufferAttribute;
            posAttr.setXYZ(0, ghostPos.x, ghostPos.y, ghostPos.z);
            posAttr.setXYZ(1, truePos.x, truePos.y, truePos.z);
            posAttr.needsUpdate = true;
          }
        }
      }
    } else {
      this.ghostMarkers.forEach(m => m.visible = false);
      this.errorVectors.forEach(l => l.visible = false);
    }

    // 5. Precession Pole Path
    this.polePathLine.visible = this.showPrecessionPole;
  }

  private altAzToVector(altDeg: number, azDeg: number, radius: number): THREE.Vector3 {
    const altRad = (altDeg * Math.PI) / 180;
    const azRad = (azDeg * Math.PI) / 180;
    // Azimuth 0 = North (+Z in model space), 90 = East (+X)
    return new THREE.Vector3(
      radius * Math.cos(altRad) * Math.sin(azRad),
      radius * Math.sin(altRad),
      radius * Math.cos(altRad) * Math.cos(azRad)
    );
  }

  public setViewMode(mode: SkyViewMode) {
    this.viewMode = mode;
    if (mode === 'DOME') {
      this.camera.position.set(0, 45, 1);
      this.controls.target.set(0, 0, 0);
    } else if (mode === 'HORIZON') {
      this.camera.position.set(0, 2, 28);
      this.controls.target.set(0, 5, 0);
    } else {
      this.camera.position.set(0, 15, 60);
      this.controls.target.set(0, 0, 0);
    }
    this.controls.update();
  }

  public onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.controls.update();
  }

  public render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
