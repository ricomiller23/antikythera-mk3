import * as THREE from 'three';
import { GearMk2Definition as GearDefinition } from '../data/gearsMk2.ts';

// Cache generated geometries to ensure fast startup and memory efficiency
const geometryCache = new Map<string, THREE.BufferGeometry>();

export function createAntikytheraGearGeometry(gear: any): THREE.BufferGeometry {
  const thickness = gear.thickness || 1.6;
  const cacheKey = `${gear.id}_${gear.teeth}_${gear.pitchRadius}_${thickness}`;
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!;
  }

  const N = gear.teeth;
  const R = gear.pitchRadius;
  const module_m = (2 * R) / N;
  
  // Hellenistic triangular tooth profile (approx 60° triangular teeth per Price/Freeth)
  const addendum = 0.8 * module_m;
  const dedendum = 0.9 * module_m;
  const rRoot = Math.max(2.5, R - dedendum);
  const rTip = R + addendum;
  const hubRadius = Math.min(rRoot * 0.4, 3.5);

  const shape = new THREE.Shape();
  const dTheta = (2 * Math.PI) / N;

  // Construct continuous triangular teeth perimeter
  for (let i = 0; i < N; i++) {
    const theta0 = i * dTheta;
    const thetaRoot1 = theta0;
    const thetaTip = theta0 + dTheta * 0.5;
    const thetaRoot2 = theta0 + dTheta * 0.98;

    const xRoot1 = rRoot * Math.cos(thetaRoot1);
    const yRoot1 = rRoot * Math.sin(thetaRoot1);

    const xTip = rTip * Math.cos(thetaTip);
    const yTip = rTip * Math.sin(thetaTip);

    const xRoot2 = rRoot * Math.cos(thetaRoot2);
    const yRoot2 = rRoot * Math.sin(thetaRoot2);

    if (i === 0) {
      shape.moveTo(xRoot1, yRoot1);
    } else {
      shape.lineTo(xRoot1, yRoot1);
    }
    shape.lineTo(xTip, yTip);
    shape.lineTo(xRoot2, yRoot2);
  }
  shape.closePath();

  // Central arbor hole
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, hubRadius, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  // Spoke cutouts for large wheels (e.g. B1 with 4 cross-bar spokes per Fragment A)
  if (N >= 60 && rRoot > 20) {
    const numSpokes = 4;
    const innerSpokeR = hubRadius + 3.0;
    const outerSpokeR = rRoot - 4.0;
    const spokeAngle = (Math.PI * 2) / numSpokes;
    const spokeWidthAngle = 0.25;

    for (let s = 0; s < numSpokes; s++) {
      const aStart = s * spokeAngle + spokeWidthAngle;
      const aEnd = (s + 1) * spokeAngle - spokeWidthAngle;

      const spokeHole = new THREE.Path();
      spokeHole.moveTo(innerSpokeR * Math.cos(aStart), innerSpokeR * Math.sin(aStart));
      spokeHole.lineTo(outerSpokeR * Math.cos(aStart), outerSpokeR * Math.sin(aStart));
      spokeHole.absarc(0, 0, outerSpokeR, aStart, aEnd, false);
      spokeHole.lineTo(innerSpokeR * Math.cos(aEnd), innerSpokeR * Math.sin(aEnd));
      spokeHole.absarc(0, 0, innerSpokeR, aEnd, aStart, true);
      spokeHole.closePath();

      shape.holes.push(spokeHole);
    }
  }

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.15,
    bevelThickness: 0.15
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();

  geometryCache.set(cacheKey, geometry);
  return geometry;
}
