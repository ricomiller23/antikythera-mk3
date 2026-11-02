import * as THREE from 'three';
import { MODERN_COMET_OVERLAYS } from '../data/comets.ts';

export class CometVisualizer {
  public group: THREE.Group;
  private cometObjects: Array<{
    id: string;
    orbitLine: THREE.Line;
    nucleus: THREE.Mesh;
    tailPoints: THREE.Points;
  }> = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'cometVisualizerOverlay';
    this.group.visible = false; // Off by default to preserve ancient historical integrity

    this.buildCometTracks();
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public isVisible(): boolean {
    return this.group.visible;
  }

  private buildCometTracks() {
    const scaleFactor = 6.0; // Scale 1 AU to 6 Three.js units for mechanism visibility

    for (const comet of MODERN_COMET_OVERLAYS) {
      const a = comet.semiMajorAxisAU * scaleFactor;
      const e = comet.eccentricity;
      const iRad = (comet.inclinationDeg * Math.PI) / 180;
      const nodeRad = (comet.longitudeAscendingNodeDeg * Math.PI) / 180;
      const periRad = (comet.argumentPerihelionDeg * Math.PI) / 180;

      // Sample Keplerian ellipse points
      const points: THREE.Vector3[] = [];
      const numSegments = 128;
      for (let s = 0; s <= numSegments; s++) {
        const theta = (s / numSegments) * Math.PI * 2;
        // In orbital plane (focus at origin x = 0, y = 0)
        // r = a(1 - e^2) / (1 + e cos(theta))
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
        const xOrb = r * Math.cos(theta);
        const yOrb = r * Math.sin(theta);

        // Rotate by argument of perihelion in orbital plane
        const xPeri = xOrb * Math.cos(periRad) - yOrb * Math.sin(periRad);
        const yPeri = xOrb * Math.sin(periRad) + yOrb * Math.cos(periRad);

        // Apply inclination
        const xInc = xPeri;
        const yInc = yPeri * Math.cos(iRad);
        const zInc = yPeri * Math.sin(iRad);

        // Rotate by longitude of ascending node
        const x = xInc * Math.cos(nodeRad) - yInc * Math.sin(nodeRad);
        const y = xInc * Math.sin(nodeRad) + yInc * Math.cos(nodeRad);
        const z = zInc;

        // Cap extreme coordinates for Hale-Bopp display
        const maxDist = 180.0;
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (dist > maxDist) {
          const factor = maxDist / dist;
          points.push(new THREE.Vector3(x * factor, y * factor, z * factor));
        } else {
          points.push(new THREE.Vector3(x, y, z));
        }
      }

      const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMat = new THREE.LineDashedMaterial({
        color: new THREE.Color(comet.colorHex),
        dashSize: 3,
        gapSize: 2,
        opacity: 0.65,
        transparent: true
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      orbitLine.computeLineDistances();
      this.group.add(orbitLine);

      // Glowing Comet Nucleus
      const nucleusGeom = new THREE.SphereGeometry(1.5, 12, 12);
      const nucleusMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(comet.colorHex)
      });
      const nucleus = new THREE.Mesh(nucleusGeom, nucleusMat);
      // Place near perihelion for visualization
      nucleus.position.copy(points[0]);
      this.group.add(nucleus);

      // Solar-wind pointing ion tail particles
      const tailCount = 24;
      const tailPositions = new Float32Array(tailCount * 3);
      for (let p = 0; p < tailCount; p++) {
        const spread = (p / tailCount) * 12.0;
        tailPositions[p * 3] = points[0].x + (Math.random() - 0.5) * spread;
        tailPositions[p * 3 + 1] = points[0].y + (Math.random() - 0.5) * spread;
        tailPositions[p * 3 + 2] = points[0].z + spread * 1.5;
      }
      const tailGeom = new THREE.BufferGeometry();
      tailGeom.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
      const tailMat = new THREE.PointsMaterial({
        color: new THREE.Color(comet.colorHex),
        size: 2.0,
        transparent: true,
        opacity: 0.5
      });
      const tailPoints = new THREE.Points(tailGeom, tailMat);
      this.group.add(tailPoints);

      this.cometObjects.push({
        id: comet.id,
        orbitLine,
        nucleus,
        tailPoints
      });
    }
  }

  public update(yearsElapsed: number) {
    if (!this.group.visible) return;

    for (let i = 0; i < MODERN_COMET_OVERLAYS.length; i++) {
      const comet = MODERN_COMET_OVERLAYS[i];
      const obj = this.cometObjects[i];
      if (!obj) continue;

      // Orbit animation angle
      const meanMotion = (2 * Math.PI) / comet.periodYears;
      const M = (yearsElapsed * meanMotion) % (2 * Math.PI);
      const orbitPoints = (obj.orbitLine.geometry as THREE.BufferGeometry).attributes.position;
      const idx = Math.floor((((M % (2 * Math.PI)) + 2 * Math.PI) / (2 * Math.PI)) * (orbitPoints.count - 1));
      
      const x = orbitPoints.getX(idx);
      const y = orbitPoints.getY(idx);
      const z = orbitPoints.getZ(idx);
      obj.nucleus.position.set(x, y, z);
      obj.tailPoints.position.set(x, y, z);
    }
  }
}
