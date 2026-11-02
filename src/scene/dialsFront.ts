import * as THREE from 'three';
import { AntikytheraMaterialsMk2 } from './materialsMk2.ts';
import { KinematicStateMk2 } from '../kinematics/gearGraphMk2.ts';

export class FrontDials {
  public group: THREE.Group;
  private materials: AntikytheraMaterialsMk2;
  
  // Rotating Pointers & Rings
  private sunPointer: THREE.Group;
  private moonPointer: THREE.Group;
  private mercuryPointer: THREE.Group;
  private venusPointer: THREE.Group;
  private marsPointer: THREE.Group;
  private jupiterPointer: THREE.Group;
  private saturnPointer: THREE.Group;
  
  // Calendar Ring
  private calendarRingMesh: THREE.Mesh;
  private calendarMode: 'lunar_354' | 'solar_365' = 'lunar_354';

  constructor(materials: AntikytheraMaterialsMk2) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'frontDialsGroup';

    // 1. Build Static Front Dial Plate & Zodiac Dial
    this.buildZodiacPlate();

    // 2. Build Movable Calendar Ring (354 / 365)
    this.calendarRingMesh = this.buildCalendarRing();
    this.group.add(this.calendarRingMesh);

    // 3. Build Central Pointers
    this.sunPointer = this.createSunPointer();
    this.group.add(this.sunPointer);

    const { pointer: moonPtr } = this.createMoonPointer();
    this.moonPointer = moonPtr;
    this.group.add(this.moonPointer);

    // 4. Build Freeth 2021 Planetary Ring Indicators
    this.mercuryPointer = this.createPlanetIndicator(48, 0x14b8a6, 'Mercury');
    this.venusPointer = this.createPlanetIndicator(56, 0xf43f5e, 'Venus');
    this.marsPointer = this.createPlanetIndicator(64, 0xdc2626, 'Mars');
    this.jupiterPointer = this.createPlanetIndicator(72, 0xd97706, 'Jupiter');
    this.saturnPointer = this.createPlanetIndicator(80, 0x8b5cf6, 'Saturn');

    this.group.add(this.mercuryPointer);
    this.group.add(this.venusPointer);
    this.group.add(this.marsPointer);
    this.group.add(this.jupiterPointer);
    this.group.add(this.saturnPointer);
  }

  private buildZodiacPlate() {
    // 360° Zodiac Ring Plate
    const outerRadius = 88;
    const innerRadius = 38;
    const dialGeom = new THREE.RingGeometry(innerRadius, outerRadius, 96);
    const dialMesh = new THREE.Mesh(dialGeom, this.materials.dialPlateMaterial);
    dialMesh.position.z = -1.0;
    dialMesh.receiveShadow = true;
    this.group.add(dialMesh);

    // Engraved circular division rings
    const ringLineGeom1 = new THREE.RingGeometry(outerRadius - 0.5, outerRadius, 96);
    const ringLine1 = new THREE.Mesh(ringLineGeom1, this.materials.oxidizedDark);
    ringLine1.position.z = -0.98;
    this.group.add(ringLine1);

    const ringLineGeom2 = new THREE.RingGeometry(innerRadius, innerRadius + 0.5, 96);
    const ringLine2 = new THREE.Mesh(ringLineGeom2, this.materials.oxidizedDark);
    ringLine2.position.z = -0.98;
    this.group.add(ringLine2);

    // 12 Zodiac Constellation Sectors (30° each)
    const tickGeom = new THREE.BoxGeometry(0.35, 6.0, 0.4);
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      const marker = new THREE.Mesh(tickGeom, this.materials.oxidizedDark);
      marker.position.set(
        (outerRadius - 3.5) * Math.cos(angle),
        (outerRadius - 3.5) * Math.sin(angle),
        -0.95
      );
      marker.rotation.z = angle + Math.PI / 2;
      this.group.add(marker);

      // Minor 10° degree ticks
      for (let t = 1; t <= 2; t++) {
        const subAngle = angle + (t * 10 * Math.PI) / 180;
        const subMarker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.0, 0.3), this.materials.oxidizedDark);
        subMarker.position.set(
          (outerRadius - 2.0) * Math.cos(subAngle),
          (outerRadius - 2.0) * Math.sin(subAngle),
          -0.95
        );
        subMarker.rotation.z = subAngle + Math.PI / 2;
        this.group.add(subMarker);
      }
    }
  }

  private buildCalendarRing(): THREE.Mesh {
    const rIn = 88.5;
    const rOut = 98.0;
    const ringGeom = new THREE.RingGeometry(rIn, rOut, 128);
    const ringMesh = new THREE.Mesh(ringGeom, this.materials.bronzeBase);
    ringMesh.position.z = -0.9;
    ringMesh.receiveShadow = true;

    // Procedural calendar holes (354 lunar holes default or 365)
    const numHoles = this.calendarMode === 'lunar_354' ? 354 : 365;
    const holeRadius = 0.25;
    const holeGeom = new THREE.CircleGeometry(holeRadius, 8);
    
    // Create instanced or sampled pin holes
    const holeGroup = new THREE.Group();
    const step = (2 * Math.PI) / numHoles;
    const midR = (rIn + rOut) / 2;

    for (let h = 0; h < numHoles; h += 2) { // Render half for clean visual density
      const ang = h * step;
      const hole = new THREE.Mesh(holeGeom, this.materials.oxidizedDark);
      hole.position.set(midR * Math.cos(ang), midR * Math.sin(ang), 0.05);
      holeGroup.add(hole);
    }
    ringMesh.add(holeGroup);

    return ringMesh;
  }

  public setCalendarMode(mode: 'lunar_354' | 'solar_365') {
    if (this.calendarMode !== mode) {
      this.calendarMode = mode;
      this.group.remove(this.calendarRingMesh);
      this.calendarRingMesh = this.buildCalendarRing();
      this.group.add(this.calendarRingMesh);
    }
  }

  private createSunPointer(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'sunPointer';

    // Golden pointer arm
    const armGeom = new THREE.BoxGeometry(1.2, 85, 0.6);
    armGeom.translate(0, 42.5, 0);
    const armMesh = new THREE.Mesh(armGeom, this.materials.goldFoil);
    group.add(armMesh);

    // Radiant Golden Sun Disc at tip
    const sunDiscGeom = new THREE.SphereGeometry(3.2, 16, 16);
    const sunDisc = new THREE.Mesh(sunDiscGeom, this.materials.goldFoil);
    sunDisc.position.y = 85;
    group.add(sunDisc);

    // Central hub
    const hubGeom = new THREE.CylinderGeometry(4.0, 4.0, 1.2, 24);
    const hub = new THREE.Mesh(hubGeom, this.materials.bronzeBase);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);

    group.position.z = 1.0;
    return group;
  }

  private createMoonPointer(): { pointer: THREE.Group; sphere: THREE.Mesh } {
    const group = new THREE.Group();
    group.name = 'moonPointer';

    // Pointer arm
    const armGeom = new THREE.BoxGeometry(0.9, 78, 0.5);
    armGeom.translate(0, 39, 0);
    const armMesh = new THREE.Mesh(armGeom, this.materials.bronzeBase);
    group.add(armMesh);

    // Moon phase sphere: half-silver, half-black
    // Two half-sphere geometries merged
    const sphereGroup = new THREE.Group();
    const r = 3.6;

    const silverGeom = new THREE.SphereGeometry(r, 16, 16, 0, Math.PI);
    const silverHalf = new THREE.Mesh(silverGeom, this.materials.moonSilverSide);
    silverHalf.rotation.y = Math.PI / 2;

    const blackGeom = new THREE.SphereGeometry(r, 16, 16, Math.PI, Math.PI);
    const blackHalf = new THREE.Mesh(blackGeom, this.materials.moonBlackSide);
    blackHalf.rotation.y = Math.PI / 2;

    sphereGroup.add(silverHalf);
    sphereGroup.add(blackHalf);
    sphereGroup.position.y = 78;

    // Gimbal ring cage around moon sphere
    const cageGeom = new THREE.TorusGeometry(r + 0.6, 0.3, 8, 24);
    const cage = new THREE.Mesh(cageGeom, this.materials.bronzeBase);
    cage.position.y = 78;
    group.add(cage);

    group.add(sphereGroup);
    group.position.z = 2.2;

    return { pointer: group, sphere: silverHalf }; // rotate sphereGroup for phase
  }

  private createPlanetIndicator(radius: number, colorHex: number, name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = `planet_${name.toLowerCase()}`;

    // Bronze ring track
    const ringGeom = new THREE.RingGeometry(radius - 0.4, radius + 0.4, 64);
    const ring = new THREE.Mesh(ringGeom, this.materials.oxidizedDark);
    ring.position.z = -0.5;
    group.add(ring);

    // Decorative pointer arm
    const armGeom = new THREE.BoxGeometry(0.6, radius, 0.4);
    armGeom.translate(0, radius / 2, 0);
    const arm = new THREE.Mesh(armGeom, this.materials.bronzeBase);
    group.add(arm);

    // Bead marker (jewel / stone bead per Freeth 2021)
    const beadGeom = new THREE.SphereGeometry(2.2, 16, 16);
    const beadMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.2,
      roughness: 0.1,
      emissive: colorHex,
      emissiveIntensity: 0.35
    });
    const bead = new THREE.Mesh(beadGeom, beadMat);
    bead.position.y = radius;
    group.add(bead);

    group.position.z = 0.5 + (radius - 48) * 0.08;
    return group;
  }

  public update(state: KinematicStateMk2, showPlanets: boolean) {
    // 1. Sun Pointer rotation (degrees to radians, clockwise in dial space)
    const sunRad = -state.sunMeanLongitudeDeg * Math.PI / 180;
    this.sunPointer.rotation.z = sunRad;

    // 2. Moon Pointer rotation
    const moonRad = -state.moonTrueLongitudeDeg * Math.PI / 180;
    this.moonPointer.rotation.z = moonRad;

    // 3. Moon Phase Ball rotation
    // Phase ball spins by (moon - sun) synodic elongation
    const phaseRad = state.moonPhaseAngleDeg * Math.PI / 180;
    // Rotate moon sphere group
    const moonSphereGroup = this.moonPointer.children.find(c => c.type === 'Group');
    if (moonSphereGroup) {
      moonSphereGroup.rotation.y = phaseRad;
    }

    // 4. Planets
    this.mercuryPointer.visible = showPlanets;
    this.venusPointer.visible = showPlanets;
    this.marsPointer.visible = showPlanets;
    this.jupiterPointer.visible = showPlanets;
    this.saturnPointer.visible = showPlanets;

    if (showPlanets) {
      this.mercuryPointer.rotation.z = -state.planetLongitudesDeg.mercury * Math.PI / 180;
      this.venusPointer.rotation.z = -state.planetLongitudesDeg.venus * Math.PI / 180;
      this.marsPointer.rotation.z = -state.planetLongitudesDeg.mars * Math.PI / 180;
      this.jupiterPointer.rotation.z = -state.planetLongitudesDeg.jupiter * Math.PI / 180;
      this.saturnPointer.rotation.z = -state.planetLongitudesDeg.saturn * Math.PI / 180;
    }
  }
}
