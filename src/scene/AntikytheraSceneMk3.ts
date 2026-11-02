import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AntikytheraMaterialsMk3 } from './materialsMk3.ts';
import { createAntikytheraGearGeometry } from './gearGeometry.ts';
import { FrontDials } from './dialsFront.ts';
import { BackDials } from './dialsBack.ts';
import { ClepsydraModel } from './clepsydraModel.ts';
import { AnaphoricPlateModel } from './anaphoricPlateModel.ts';
import { PinDrumModel } from './pinDrumModel.ts';
import { EclipseStageModel } from './eclipseStageModel.ts';
import { CometVisualizer } from './cometVisualizer.ts';
import { GearMk2Definition } from '../data/gearsMk2.ts';
import { AntikytheraKinematicsEngineMk3, KinematicStateMk3 } from '../kinematics/gearGraphMk3.ts';

// Axle physical 2D coordinates on the central frame plate (in mm)
const AXLE_COORDINATES: Record<string, { x: number; y: number }> = {
  B: { x: 0, y: 0 },
  B_fixed: { x: 0, y: 0 },
  C: { x: 0, y: 38 },
  D: { x: -32, y: 38 },
  E: { x: 0, y: -24 },
  K: { x: 18, y: -24 },
  K_eccentric: { x: 19.1, y: -24 },
  N: { x: 0, y: 48 },
  G: { x: 0, y: -48 },
  I: { x: 0, y: -48 },
  W: { x: -80, y: -10 },
  WA: { x: -65, y: 15 },
  ND: { x: 28, y: -38 },
  ND_node: { x: 42, y: -38 },
  PR_worm: { x: -28, y: 55 },
  PR_century: { x: -28, y: 72 },
  EQ_mars: { x: 38, y: 22 },
  EQ_jup: { x: 50, y: 0 },
  EQ_sat: { x: 38, y: -22 },
  DRUM: { x: 80, y: 0 }
};

export class AntikytheraSceneMk3 {
  private container: HTMLElement;
  private scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public materials: AntikytheraMaterialsMk3;
  private kinematicsEngine: AntikytheraKinematicsEngineMk3;

  // Scene Subsystems
  public frontDials: FrontDials;
  public backDials: BackDials;
  public clepsydra: ClepsydraModel;
  public anaphoricSky: AnaphoricPlateModel;
  public pinDrum: PinDrumModel;
  public eclipseStage: EclipseStageModel;
  public comets: CometVisualizer;
  public computeBayGroup: THREE.Group;

  private gearMeshes: Map<string, THREE.Mesh> = new Map();
  private gearGroups: Map<string, THREE.Group> = new Map();
  private caseGroup: THREE.Group;
  private framePlatesGroup: THREE.Group;
  private ghostOverlayGroup: THREE.Group;

  // Toggles & State
  public explodedSpread: number = 0.0;
  public showCase: boolean = true;
  public showGhostOverlay: boolean = false;
  private colorCodeGears: boolean = false;
  private showPlanets: boolean = true;
  private selectedGearId: string | null = null;
  public onGearSelect?: (gear: GearMk2Definition | null) => void;

  constructor(container: HTMLElement, kinematics: AntikytheraKinematicsEngineMk3) {
    this.container = container;
    this.kinematicsEngine = kinematics;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f17);

    const initialW = Math.max(container.clientWidth, 400);
    const initialH = Math.max(container.clientHeight, 400);
    const aspect = initialW / initialH;

    this.camera = new THREE.PerspectiveCamera(40, aspect, 1, 3000);

    // 2. High-Performance PBR Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(initialW, initialH, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.0;
    this.controls.minDistance = 60;
    this.controls.maxDistance = 1400;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.target.set(0, 0, 0);

    // 4. Materials & Lighting
    this.materials = new AntikytheraMaterialsMk3();
    this.setupLighting();

    // 5. Build Case & Frames
    this.caseGroup = new THREE.Group();
    this.framePlatesGroup = new THREE.Group();
    this.ghostOverlayGroup = new THREE.Group();
    this.ghostOverlayGroup.visible = false;
    this.computeBayGroup = new THREE.Group();

    this.scene.add(this.caseGroup);
    this.scene.add(this.framePlatesGroup);
    this.scene.add(this.ghostOverlayGroup);
    this.scene.add(this.computeBayGroup);

    this.buildCaseAndFramePlates();
    this.buildGears();
    this.buildGhostOverlay();
    this.buildComputeBayModel();

    // 6. Mount Modules
    this.frontDials = new FrontDials(this.materials as any);
    this.frontDials.group.position.z = 18;
    this.scene.add(this.frontDials.group);

    this.backDials = new BackDials(this.materials as any);
    this.backDials.group.position.z = -18;
    this.scene.add(this.backDials.group);

    this.clepsydra = new ClepsydraModel(this.materials as any);
    this.scene.add(this.clepsydra.group);

    this.anaphoricSky = new AnaphoricPlateModel(this.materials as any);
    this.scene.add(this.anaphoricSky.group);

    this.pinDrum = new PinDrumModel(this.materials as any);
    this.scene.add(this.pinDrum.group);

    this.eclipseStage = new EclipseStageModel(this.materials as any);
    this.scene.add(this.eclipseStage.group);

    this.comets = new CometVisualizer();
    this.scene.add(this.comets.group);

    // 7. Initial Frame & Event Listeners
    this.fitToFrame();
    this.setupEventListeners();
  }

  private setupLighting() {
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(150, 180, 200);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.5);
    rimLight.position.set(-160, -120, -200);
    this.scene.add(rimLight);

    const ambLight = new THREE.AmbientLight(0x2a241f, 0.9);
    this.scene.add(ambLight);

    const frontDialLight = new THREE.PointLight(0xfef08a, 1.1, 380);
    frontDialLight.position.set(0, 0, 100);
    this.scene.add(frontDialLight);

    const clepsydraLight = new THREE.PointLight(0x38bdf8, 1.2, 250);
    clepsydraLight.position.set(-110, 0, 50);
    this.scene.add(clepsydraLight);

    const drumLight = new THREE.PointLight(0xf59e0b, 1.0, 250);
    drumLight.position.set(110, 0, 50);
    this.scene.add(drumLight);
  }

  private buildGears() {
    for (const mesh of this.gearMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.gearMeshes.clear();
    this.gearGroups.clear();

    const gearCatalog = this.kinematicsEngine.getGearDefinitions();

    for (const gear of gearCatalog) {
      if (gear.teeth <= 0) continue;
      const geom = createAntikytheraGearGeometry(gear as any);
      const mat = this.materials.getMaterialForGear(gear.subsystem, this.colorCodeGears);

      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = gear.id;
      mesh.userData = { gearDef: gear };

      const group = new THREE.Group();
      group.name = `gear_group_${gear.id}`;

      const coords = AXLE_COORDINATES[gear.axle] || { x: 0, y: 0 };
      group.position.set(coords.x, coords.y, gear.axialZ);

      group.add(mesh);
      this.scene.add(group);

      this.gearMeshes.set(gear.id, mesh);
      this.gearGroups.set(gear.id, group);
    }
  }

  private buildCaseAndFramePlates() {
    const plateWidth = 150;
    const plateHeight = 230;
    const plateThickness = 1.4;

    const plateGeom = new THREE.BoxGeometry(plateWidth, plateHeight, plateThickness);

    const frontPlate = new THREE.Mesh(plateGeom, this.materials.caseBronze);
    frontPlate.position.set(0, 0, 16);
    this.framePlatesGroup.add(frontPlate);

    const backPlate = new THREE.Mesh(plateGeom, this.materials.caseBronze);
    backPlate.position.set(0, 0, -16);
    this.framePlatesGroup.add(backPlate);

    // Outer wooden cabinet
    const caseDepth = 64;
    const caseGeom = new THREE.BoxGeometry(plateWidth + 20, plateHeight + 20, caseDepth);
    const caseWire = new THREE.BoxHelper(new THREE.Mesh(caseGeom), 0x92400e);
    this.caseGroup.add(caseWire);

    const wallMat = this.materials.caseWood;
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(6, plateHeight + 18, caseDepth), wallMat);
    leftWall.position.set(-(plateWidth / 2 + 7), 0, 0);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(6, plateHeight + 18, caseDepth), wallMat);
    rightWall.position.set(plateWidth / 2 + 7, 0, 0);

    const topWall = new THREE.Mesh(new THREE.BoxGeometry(plateWidth + 20, 6, caseDepth), wallMat);
    topWall.position.set(0, plateHeight / 2 + 7, 0);

    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(plateWidth + 20, 6, caseDepth), wallMat);
    bottomWall.position.set(0, -(plateHeight / 2 + 7), 0);

    this.caseGroup.add(leftWall, rightWall, topWall, bottomWall);
  }

  private buildGhostOverlay() {
    const mk1BoxGeom = new THREE.BoxGeometry(140, 220, 56);
    const mk1Mesh = new THREE.Mesh(mk1BoxGeom, this.materials.ghostMaterial);
    this.ghostOverlayGroup.add(mk1Mesh);
  }

  private buildComputeBayModel() {
    // 3D representation of Thomson Ball-and-Disc Integrator module mounted beneath the main chassis
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(120, 30, 2), this.materials.caseBronze);
    basePlate.position.set(0, -95, 0);
    this.computeBayGroup.add(basePlate);

    // Rotating Disc
    const discGeom = new THREE.CylinderGeometry(14, 14, 2, 32);
    const discMesh = new THREE.Mesh(discGeom, this.materials.goldFoil);
    discMesh.rotation.x = Math.PI / 2;
    discMesh.position.set(-35, -95, 6);
    this.computeBayGroup.add(discMesh);

    // Output Cylinder
    const cylGeom = new THREE.CylinderGeometry(4, 4, 32, 24);
    const cylMesh = new THREE.Mesh(cylGeom, this.materials.silverFoil);
    cylMesh.rotation.z = Math.PI / 2;
    cylMesh.position.set(30, -95, 6);
    this.computeBayGroup.add(cylMesh);

    // Ball carriage sphere
    const ballGeom = new THREE.SphereGeometry(2.5, 16, 16);
    const ballMesh = new THREE.Mesh(ballGeom, this.materials.silverFoil);
    ballMesh.position.set(-2, -95, 6);
    this.computeBayGroup.add(ballMesh);
  }

  public setGhostOverlay(visible: boolean) {
    this.showGhostOverlay = visible;
    this.ghostOverlayGroup.visible = visible;
  }

  public setExplodedView(spread: number) {
    this.explodedSpread = spread;
    const gearCatalog = this.kinematicsEngine.getGearDefinitions();
    for (const gear of gearCatalog) {
      const group = this.gearGroups.get(gear.id);
      if (group) {
        const baseZ = gear.axialZ;
        group.position.z = baseZ + Math.sign(baseZ || 1) * spread * 20.0;
      }
    }

    this.frontDials.group.position.z = 18 + spread * 45;
    this.backDials.group.position.z = -18 - spread * 45;
    this.anaphoricSky.group.position.z = 22 + spread * 55;
    this.eclipseStage.group.position.z = 20 + spread * 50;
    this.computeBayGroup.position.z = -spread * 30;
  }

  public setShowCase(show: boolean) {
    this.showCase = show;
    this.caseGroup.visible = show;
    this.framePlatesGroup.visible = show;
  }

  public setColorCodeGears(enabled: boolean) {
    this.colorCodeGears = enabled;
    const gearCatalog = this.kinematicsEngine.getGearDefinitions();
    for (const gear of gearCatalog) {
      const mesh = this.gearMeshes.get(gear.id);
      if (mesh) {
        mesh.material = this.materials.getMaterialForGear(gear.subsystem, enabled);
      }
    }
  }

  public calculateFrameDistance(): number {
    const aspect = this.camera.aspect || 1.0;
    const fovRad = (this.camera.fov * Math.PI) / 180;
    
    // Main Antikythera Mechanism & Full Assembly:
    // Main Cabinet: 250mm H x 170mm W
    // Flanking Modules: Clepsydra (left) to Pin Drum (right) = 275mm W
    const totalHeight = 250; // mm
    const totalWidth = 275;  // mm
    const margin = 1.25;     // Fills ~80% of viewport with clean framing margins

    const distForHeight = (totalHeight * margin) / (2 * Math.tan(fovRad / 2));
    const distForWidth = (totalWidth * margin) / (2 * Math.tan(fovRad / 2) * aspect);

    return Math.max(distForHeight, distForWidth);
  }

  public fitToFrame() {
    const dist = this.calculateFrameDistance();
    // True center of Antikythera Mechanism main cabinet and dials: X = 0, Y = 0, Z = 0
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, 0, dist);
    this.controls.update();
  }

  public zoomIn(factor: number = 0.8) {
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const newLen = Math.max(this.controls.minDistance, offset.length() * factor);
    offset.setLength(newLen);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  public zoomOut(factor: number = 1.25) {
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const newLen = Math.min(this.controls.maxDistance, offset.length() * factor);
    offset.setLength(newLen);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  public setCameraPreset(preset: 'front' | 'back' | 'side' | 'clepsydra' | 'sky' | 'drum' | 'compute' | 'exploded' | 'ghost') {
    const dist = this.calculateFrameDistance();

    switch (preset) {
      case 'front':
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(0, 0, dist);
        this.setExplodedView(0.0);
        this.setGhostOverlay(false);
        break;
      case 'back':
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(0, 0, -dist);
        this.setExplodedView(0.0);
        this.setGhostOverlay(false);
        break;
      case 'side':
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(dist, 0, 0);
        this.setExplodedView(0.0);
        break;
      case 'clepsydra':
        this.controls.target.set(-110, 0, 0);
        this.camera.position.set(-110, 10, 180);
        break;
      case 'sky':
        this.controls.target.set(0, 52, 22);
        this.camera.position.set(0, 52, 160);
        break;
      case 'drum':
        this.controls.target.set(110, -10, 0);
        this.camera.position.set(110, 0, 180);
        break;
      case 'compute':
        this.controls.target.set(0, -95, 0);
        this.camera.position.set(0, -95, 140);
        break;
      case 'exploded':
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(dist * 0.55, dist * 0.45, dist * 0.95);
        this.setShowCase(false);
        this.setExplodedView(1.8);
        break;
      case 'ghost':
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(dist * 0.4, dist * 0.3, dist * 0.9);
        this.setGhostOverlay(true);
        break;
    }
    this.controls.update();
  }

  public onResize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const w = Math.floor(rect.width) || this.container.clientWidth;
    const h = Math.floor(rect.height) || this.container.clientHeight;

    if (w <= 0 || h <= 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.controls.update();
  }

  private setupEventListeners() {
    const ro = new ResizeObserver(() => this.onResize());
    ro.observe(this.container);

    window.addEventListener('resize', () => this.onResize());
    requestAnimationFrame(() => {
      this.onResize();
      this.fitToFrame();
    });
    setTimeout(() => {
      this.onResize();
      this.fitToFrame();
    }, 150);

    const dom = this.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    dom.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointerup', (e) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const meshes = Array.from(this.gearMeshes.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const gearDef = hit.userData.gearDef as GearMk2Definition;
        this.selectGear(gearDef.id);
      } else {
        this.selectGear(null);
      }
    });

    // Viewport HUD buttons
    const bindBtn = (id: string, fn: () => void) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    bindBtn('btn-zoom-in', () => this.zoomIn());
    bindBtn('btn-zoom-out', () => this.zoomOut());
    bindBtn('btn-fit-frame', () => this.fitToFrame());
    bindBtn('btn-hud-front', () => this.setCameraPreset('front'));
    bindBtn('btn-hud-back', () => this.setCameraPreset('back'));
    bindBtn('btn-hud-clepsydra', () => this.setCameraPreset('clepsydra'));
    bindBtn('btn-hud-sky', () => this.setCameraPreset('sky'));
    bindBtn('btn-hud-drum', () => this.setCameraPreset('drum'));
    bindBtn('btn-hud-compute', () => this.setCameraPreset('compute'));
    bindBtn('btn-hud-ghost', () => this.setCameraPreset('ghost'));
  }

  public selectGear(gearId: string | null) {
    if (this.selectedGearId && this.gearMeshes.has(this.selectedGearId)) {
      const prevMesh = this.gearMeshes.get(this.selectedGearId)!;
      (prevMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = this.colorCodeGears ? 0.25 : 0.0;
    }

    this.selectedGearId = gearId;

    if (gearId && this.gearMeshes.has(gearId)) {
      const mesh = this.gearMeshes.get(gearId)!;
      (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x38bdf8);
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9;
      if (this.onGearSelect) {
        this.onGearSelect(mesh.userData.gearDef as GearMk2Definition);
      }
    } else {
      if (this.onGearSelect) {
        this.onGearSelect(null);
      }
    }
  }

  public update(state: KinematicStateMk3, yearsElapsed: number) {
    for (const [id, angle] of Object.entries(state.gearAngles)) {
      const mesh = this.gearMeshes.get(id);
      if (mesh) {
        mesh.rotation.z = angle;
      }
    }

    this.frontDials.update(state as any, this.showPlanets);
    this.backDials.update(state as any);
    this.clepsydra.update(state.clepsydra.waterHeightMm, state.clepsydra.reservoirRefillPct);
    this.anaphoricSky.update(state.siderealDayAngle, state.precessionAngle, this.kinematicsEngine.getLatitude());
    this.pinDrum.update(state.drumAngleRad, state.activeEvents);
    this.eclipseStage.update(state.moonPhaseAngle, state.moonLatitude, state.isSolarEclipsePossible, state.isLunarEclipsePossible);
    this.comets.update(yearsElapsed);
  }

  public render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
