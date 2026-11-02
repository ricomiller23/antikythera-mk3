import * as THREE from 'three';
import { AntikytheraMaterialsMk2 } from './materialsMk2.ts';

export class PinDrumModel {
  public group: THREE.Group;
  private materials: AntikytheraMaterialsMk2;
  public drumCylinder: THREE.Group;
  private hammerMesh: THREE.Mesh;
  private gongMesh: THREE.Mesh;
  private hammerAngle: number = 0;

  constructor(materials: AntikytheraMaterialsMk2) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'pinDrumModelGroup';

    // 1. Rotating Pin Drum Barrel
    this.drumCylinder = new THREE.Group();
    const barrelGeom = new THREE.CylinderGeometry(14, 14, 46, 32);
    const barrelMesh = new THREE.Mesh(barrelGeom, this.materials.caseBronze);
    this.drumCylinder.add(barrelMesh);

    // Decorative circumferential guide grooves (12 channels)
    for (let c = -5; c <= 5; c++) {
      const grooveGeom = new THREE.TorusGeometry(14.2, 0.4, 8, 32);
      const groove = new THREE.Mesh(grooveGeom, this.materials.oxidizedDark);
      groove.rotation.x = Math.PI / 2;
      groove.position.y = c * 3.8;
      this.drumCylinder.add(groove);
    }

    // Placeable bronze pegs on drum surface
    const pegGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
    for (let p = 0; p < 8; p++) {
      const peg = new THREE.Mesh(pegGeom, this.materials.goldFoil);
      const angle = (p * Math.PI) / 4;
      peg.rotation.z = Math.PI / 2;
      peg.position.set(15 * Math.cos(angle), (p - 3.5) * 4, 15 * Math.sin(angle));
      this.drumCylinder.add(peg);
    }

    this.group.add(this.drumCylinder);

    // 2. Articulated Bronze Escapement Hammer
    const hammerGeom = new THREE.BoxGeometry(2, 22, 2);
    this.hammerMesh = new THREE.Mesh(hammerGeom, this.materials.bronzeBase);
    this.hammerMesh.position.set(17, 12, 0);
    this.group.add(this.hammerMesh);

    // 3. Antique Hammered Bronze Gong Basin
    const gongGeom = new THREE.SphereGeometry(12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.gongMesh = new THREE.Mesh(gongGeom, this.materials.goldFoil);
    this.gongMesh.position.set(24, 24, 0);
    this.gongMesh.rotation.x = Math.PI;
    this.group.add(this.gongMesh);

    // Position on right flank of Antikythera case
    this.group.position.set(110, -10, 0);
  }

  public update(drumAngleRad: number, activeEvents: string[]) {
    // Drum rotates continuously
    this.drumCylinder.rotation.y = drumAngleRad;

    // Hammer trips when event triggers
    if (activeEvents.length > 0) {
      this.hammerAngle = 0.35;
      this.gongMesh.scale.set(1.08, 1.08, 1.08); // Acoustic vibration pulse
    } else {
      this.hammerAngle = Math.max(0, this.hammerAngle - 0.05);
      this.gongMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
    this.hammerMesh.rotation.z = -this.hammerAngle;
  }
}
