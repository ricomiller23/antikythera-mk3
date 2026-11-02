import * as THREE from 'three';
import { AntikytheraMaterialsMk2 } from './materialsMk2.ts';

export class ClepsydraModel {
  public group: THREE.Group;
  private materials: AntikytheraMaterialsMk2;
  private waterMesh: THREE.Mesh;
  private floatGroup: THREE.Group;
  private rackMesh: THREE.Mesh;

  constructor(materials: AntikytheraMaterialsMk2) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'clepsydraModelGroup';

    // 1. Transparent Glass/Bronze Reservoir Tank
    const tankGeom = new THREE.CylinderGeometry(18, 18, 80, 32, 1, true);
    const tankMesh = new THREE.Mesh(tankGeom, this.materials.glassReservoir);
    tankMesh.position.set(0, 0, 0);
    this.group.add(tankMesh);

    // Bronze tank rims (top & base)
    const rimGeom = new THREE.TorusGeometry(18, 1.2, 16, 32);
    const topRim = new THREE.Mesh(rimGeom, this.materials.caseBronze);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 40;

    const baseRim = new THREE.Mesh(rimGeom, this.materials.caseBronze);
    baseRim.rotation.x = Math.PI / 2;
    baseRim.position.y = -40;

    const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 2, 32), this.materials.caseBronze);
    bottomCap.position.y = -41;

    this.group.add(topRim, baseRim, bottomCap);

    // 2. Dynamic Water Level
    const waterGeom = new THREE.CylinderGeometry(17.5, 17.5, 40, 32);
    this.waterMesh = new THREE.Mesh(waterGeom, this.materials.waterMaterial);
    this.waterMesh.position.y = -20;
    this.group.add(this.waterMesh);

    // 3. Regulated Conical Float & Vertical Gear Rack
    this.floatGroup = new THREE.Group();
    const floatGeom = new THREE.ConeGeometry(12, 16, 24);
    const floatMesh = new THREE.Mesh(floatGeom, this.materials.bronzeBase);
    floatMesh.rotation.x = Math.PI; // Inverted cone per Vitruvius
    this.floatGroup.add(floatMesh);

    // Vertical toothed rack extending upwards to engage W1 pinion
    const rackGeom = new THREE.BoxGeometry(2.5, 90, 2.5);
    this.rackMesh = new THREE.Mesh(rackGeom, this.materials.goldFoil);
    this.rackMesh.position.y = 45;
    this.floatGroup.add(this.rackMesh);

    this.group.add(this.floatGroup);

    // 4. Siphon Outflow Pipe
    const pipeGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 16);
    const pipeMesh = new THREE.Mesh(pipeGeom, this.materials.caseBronze);
    pipeMesh.position.set(20, -25, 0);
    this.group.add(pipeMesh);

    // Position entire clepsydra to the left side of the Antikythera case
    this.group.position.set(-110, 0, 0);
  }

  public update(waterHeightMm: number, refillPct: number) {
    // Water height 0 to 80 scale
    const normHeight = (waterHeightMm / 250) * 60;
    this.waterMesh.scale.y = Math.max(0.1, normHeight / 40);
    this.waterMesh.position.y = -40 + normHeight / 2;

    // Float rides on water surface
    this.floatGroup.position.y = -40 + normHeight;
  }
}
