import * as THREE from 'three';
import { AntikytheraMaterialsMk2 } from './materialsMk2.ts';
import { KinematicStateMk2 } from '../kinematics/gearGraphMk2.ts';

export class BackDials {
  public group: THREE.Group;
  private materials: AntikytheraMaterialsMk2;

  // Upper Dial Elements (Metonic, Games, Callippic)
  private metonicGroup: THREE.Group;
  private metonicPointer: THREE.Group;
  private gamesPointer: THREE.Group;
  private callippicPointer: THREE.Group;

  // Lower Dial Elements (Saros, Exeligmos)
  private sarosGroup: THREE.Group;
  private sarosPointer: THREE.Group;
  private exeligmosPointer: THREE.Group;

  constructor(materials: AntikytheraMaterialsMk2) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'backDialsGroup';

    // Position back dials facing opposite z (-Z direction, rotated 180° around Y)
    this.group.rotation.y = Math.PI;

    // 1. Upper Back Dial (Metonic Spiral + Subdials)
    this.metonicGroup = new THREE.Group();
    this.metonicGroup.position.set(0, 48, 0);
    this.buildMetonicSpiral();
    this.metonicPointer = this.createSpiralPointer('metonicPointer', 16, 42);
    this.metonicGroup.add(this.metonicPointer);

    this.gamesPointer = this.createSubdial(22, 0, 11, 'gamesSubdial');
    this.metonicGroup.add(this.gamesPointer);

    this.callippicPointer = this.createSubdial(-22, 0, 11, 'callippicSubdial');
    this.metonicGroup.add(this.callippicPointer);

    this.group.add(this.metonicGroup);

    // 2. Lower Back Dial (Saros Spiral + Exeligmos)
    this.sarosGroup = new THREE.Group();
    this.sarosGroup.position.set(0, -48, 0);
    this.buildSarosSpiral();
    this.sarosPointer = this.createSpiralPointer('sarosPointer', 16, 42);
    this.sarosGroup.add(this.sarosPointer);

    this.exeligmosPointer = this.createSubdial(0, 0, 12, 'exeligmosSubdial', 3);
    this.sarosGroup.add(this.exeligmosPointer);

    this.group.add(this.sarosGroup);
  }

  private buildMetonicSpiral() {
    // 5-turn Archimedean spiral groove (235 cells)
    const points: THREE.Vector3[] = [];
    const turns = 5;
    const rStart = 16;
    const rEnd = 44;
    const totalAngle = turns * 2 * Math.PI;
    const segments = 235;

    for (let i = 0; i <= segments; i++) {
      const frac = i / segments;
      const angle = frac * totalAngle;
      const r = rStart + (rEnd - rStart) * frac;
      points.push(new THREE.Vector3(r * Math.cos(angle), r * Math.sin(angle), 0.1));
    }

    const spiralGeom = new THREE.BufferGeometry().setFromPoints(points);
    const spiralLine = new THREE.Line(
      spiralGeom,
      new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 })
    );
    this.metonicGroup.add(spiralLine);

    // Bronze dial back plate
    const plateGeom = new THREE.CircleGeometry(48, 48);
    const plate = new THREE.Mesh(plateGeom, this.materials.dialPlateMaterial);
    plate.position.z = 0.0;
    this.metonicGroup.add(plate);
  }

  private buildSarosSpiral() {
    // 4-turn Archimedean spiral groove (223 cells)
    const points: THREE.Vector3[] = [];
    const turns = 4;
    const rStart = 16;
    const rEnd = 44;
    const totalAngle = turns * 2 * Math.PI;
    const segments = 223;

    for (let i = 0; i <= segments; i++) {
      const frac = i / segments;
      const angle = frac * totalAngle;
      const r = rStart + (rEnd - rStart) * frac;
      points.push(new THREE.Vector3(r * Math.cos(angle), r * Math.sin(angle), 0.1));
    }

    const spiralGeom = new THREE.BufferGeometry().setFromPoints(points);
    const spiralLine = new THREE.Line(
      spiralGeom,
      new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 })
    );
    this.sarosGroup.add(spiralLine);

    // Bronze dial back plate
    const plateGeom = new THREE.CircleGeometry(48, 48);
    const plate = new THREE.Mesh(plateGeom, this.materials.dialPlateMaterial);
    plate.position.z = 0.0;
    this.sarosGroup.add(plate);
  }

  private createSpiralPointer(name: string, rMin: number, rMax: number): THREE.Group {
    const group = new THREE.Group();
    group.name = name;

    // Slotted pointer arm
    const length = rMax + 4;
    const armGeom = new THREE.BoxGeometry(0.8, length, 0.4);
    armGeom.translate(0, length / 2, 0);
    const arm = new THREE.Mesh(armGeom, this.materials.bronzeBase);
    group.add(arm);

    // Sliding pointer pin (moves along slot with spiral radius)
    const pinGeom = new THREE.SphereGeometry(1.4, 12, 12);
    const pin = new THREE.Mesh(pinGeom, this.materials.goldFoil);
    pin.name = 'slidingPin';
    pin.position.y = rMin;
    pin.position.z = 0.4;
    group.add(pin);

    group.position.z = 0.6;
    return group;
  }

  private createSubdial(x: number, y: number, radius: number, name: string, divisions: number = 4): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, 0.2);
    group.name = name;

    // Subdial bronze ring
    const ringGeom = new THREE.RingGeometry(radius - 0.3, radius, 32);
    const ring = new THREE.Mesh(ringGeom, this.materials.oxidizedDark);
    group.add(ring);

    // Sector divider tick marks
    for (let d = 0; d < divisions; d++) {
      const ang = (d * 2 * Math.PI) / divisions;
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0.02),
        new THREE.Vector3(radius * Math.cos(ang), radius * Math.sin(ang), 0.02)
      ]);
      const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x0f172a }));
      group.add(line);
    }

    // Pointer hand
    const ptrArmGeom = new THREE.BoxGeometry(0.5, radius * 0.85, 0.3);
    ptrArmGeom.translate(0, (radius * 0.85) / 2, 0);
    const ptrArm = new THREE.Mesh(ptrArmGeom, this.materials.goldFoil);
    ptrArm.name = 'pointerHand';
    ptrArm.position.z = 0.05;
    group.add(ptrArm);

    return group;
  }

  public update(state: KinematicStateMk2) {
    // 1. Metonic Pointer
    this.metonicPointer.rotation.z = -state.metonicPointerAngleRad;
    const metonicPin = this.metonicPointer.getObjectByName('slidingPin');
    if (metonicPin) {
      const r = 16 + (42 - 16) * state.metonicPointerRadius;
      metonicPin.position.y = r;
    }

    // 2. Games Dial (Anticlockwise! - Greek sign convention: positive Z rotation)
    const gamesHand = this.gamesPointer.getObjectByName('pointerHand');
    if (gamesHand) {
      gamesHand.rotation.z = state.gamesDialAngleRad;
    }

    // 3. Callippic Dial (76 years)
    const calHand = this.callippicPointer.getObjectByName('pointerHand');
    if (calHand) {
      calHand.rotation.z = -state.callippicDialAngleRad;
    }

    // 4. Saros Pointer
    this.sarosPointer.rotation.z = -state.sarosPointerAngleRad;
    const sarosPin = this.sarosPointer.getObjectByName('slidingPin');
    if (sarosPin) {
      const r = 16 + (42 - 16) * state.sarosPointerRadius;
      sarosPin.position.y = r;
    }

    // 5. Exeligmos Dial (3 sectors)
    const exHand = this.exeligmosPointer.getObjectByName('pointerHand');
    if (exHand) {
      exHand.rotation.z = -state.exeligmosDialAngleRad;
    }
  }
}
