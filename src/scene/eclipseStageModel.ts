import * as THREE from 'three';
import { AntikytheraMaterialsMk2 } from './materialsMk2.ts';

export class EclipseStageModel {
  public group: THREE.Group;
  private materials: AntikytheraMaterialsMk2;
  private earthMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private sunMesh: THREE.Mesh;
  private shadowCone: THREE.Mesh;

  constructor(materials: AntikytheraMaterialsMk2) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'eclipseStageModelGroup';

    // 1. Stage Housing Frame
    const baseGeom = new THREE.BoxGeometry(70, 24, 18);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.caseBronze);
    this.group.add(baseMesh);

    // 2. Central Earth Globe
    const earthGeom = new THREE.SphereGeometry(4.5, 24, 16);
    this.earthMesh = new THREE.Mesh(earthGeom, new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.6,
      metalness: 0.2
    }));
    this.earthMesh.position.set(0, 0, 10);
    this.group.add(this.earthMesh);

    // 3. Mini Gold Sun Sphere
    const sunGeom = new THREE.SphereGeometry(3.5, 24, 16);
    this.sunMesh = new THREE.Mesh(sunGeom, this.materials.goldFoil);
    this.sunMesh.position.set(-24, 0, 10);
    this.group.add(this.sunMesh);

    // 4. Mini Silver Moon Sphere (Articulated on Nodal Arm)
    const moonGeom = new THREE.SphereGeometry(2.0, 24, 16);
    this.moonMesh = new THREE.Mesh(moonGeom, this.materials.silverFoil);
    this.moonMesh.position.set(-10, 0, 10);
    this.group.add(this.moonMesh);

    // 5. Translucent Umbral Shadow Cone
    const coneGeom = new THREE.ConeGeometry(5, 24, 24, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    this.shadowCone = new THREE.Mesh(coneGeom, coneMat);
    this.shadowCone.rotation.z = -Math.PI / 2;
    this.shadowCone.position.set(5, 0, 10);
    this.group.add(this.shadowCone);

    // Position in lower section of Antikythera Mk II front
    this.group.position.set(0, -68, 20);
  }

  public update(moonPhaseDeg: number, moonLatitude: number, isSolar: boolean, isLunar: boolean) {
    // Moon orbits around Earth
    const moonPhaseRad = (moonPhaseDeg * Math.PI) / 180;
    const moonDist = 12;
    const mx = -Math.cos(moonPhaseRad) * moonDist;
    const mz = 10 + Math.sin(moonPhaseRad) * moonDist * 0.4;
    const my = (moonLatitude / 5.145) * 5.0; // vertical inclination per lunar latitude

    this.moonMesh.position.set(mx, my, mz);

    // Highlight shadow cone when an eclipse is geometrically possible
    if (isSolar || isLunar) {
      this.shadowCone.visible = true;
      (this.shadowCone.material as THREE.MeshBasicMaterial).opacity = 0.75;
    } else {
      (this.shadowCone.material as THREE.MeshBasicMaterial).opacity = 0.25;
    }
  }
}
