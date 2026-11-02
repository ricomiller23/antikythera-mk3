import * as THREE from 'three';
import { AntikytheraMaterialsMk2 } from './materialsMk2.ts';
import { PTOLEMAIC_STARS } from '../data/starCatalog.ts';

export class AnaphoricPlateModel {
  public group: THREE.Group;
  private materials: AntikytheraMaterialsMk2;
  public reteGroup: THREE.Group;
  private horizonMesh: THREE.Mesh;
  private starPoints: THREE.Points;

  constructor(materials: AntikytheraMaterialsMk2) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'anaphoricPlateModelGroup';

    // 1. Static Bronze Dial Surround & Seasonal Hour Ring
    const dialRingGeom = new THREE.RingGeometry(38, 48, 64);
    const dialRing = new THREE.Mesh(dialRingGeom, this.materials.caseBronze);
    this.group.add(dialRing);

    // 2. Rotating Celestial Star Rete (Rotates Diurnally & Precesses)
    this.reteGroup = new THREE.Group();
    this.reteGroup.name = 'celestialRete';

    const retePlateGeom = new THREE.CircleGeometry(38, 64);
    const retePlateMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.8,
      metalness: 0.2
    });
    const retePlate = new THREE.Mesh(retePlateGeom, retePlateMat);
    retePlate.position.z = -0.5;
    this.reteGroup.add(retePlate);

    // Stereographic projection of Ptolemaic stars
    const starGeom = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    const starColors: number[] = [];

    PTOLEMAIC_STARS.forEach(s => {
      // Stereographic polar projection: r = R * tan((90 - dec)/2)
      const r = Math.min(36, Math.max(2, 34 * Math.tan(((90 - s.dec) * Math.PI) / 360)));
      const th = (s.ra * Math.PI) / 180;
      const x = r * Math.cos(th);
      const y = r * Math.sin(th);
      starPositions.push(x, y, 0.2);

      // Star color & brightness by magnitude
      const c = new THREE.Color(s.mag < 0 ? 0x93c5fd : s.mag < 1.0 ? 0xfef08a : 0xf1f5f9);
      starColors.push(c.r, c.g, c.b);
    });

    starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

    const starPointMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });
    this.starPoints = new THREE.Points(starGeom, starPointMat);
    this.reteGroup.add(this.starPoints);

    this.group.add(this.reteGroup);

    // 3. Static Bronze Horizon Plate Cutout (Specific to Latitude)
    const horizonGeom = new THREE.RingGeometry(0.1, 38, 64, 1, 0, Math.PI);
    const horizonMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.horizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
    this.horizonMesh.position.z = 0.5;
    this.group.add(this.horizonMesh);

    // Position in upper section of Mk II case
    this.group.position.set(0, 52, 22);
  }

  public update(siderealDayAngle: number, precessionAngle: number, latitude: number) {
    // Rete rotates diurnally once per sidereal day + precessional drift
    this.reteGroup.rotation.z = siderealDayAngle + (precessionAngle * Math.PI) / 180;

    // Horizon cutout shape updates with observer latitude
    const latRad = (latitude * Math.PI) / 180;
    this.horizonMesh.scale.set(1.0, Math.sin(latRad) * 0.9 + 0.1, 1.0);
  }
}
