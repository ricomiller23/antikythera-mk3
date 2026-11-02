import * as THREE from 'three';
import { SubsystemType } from '../data/gearsMk2.ts';

export class AntikytheraMaterialsMk3 {
  public bronzeBase: THREE.MeshStandardMaterial;
  public caseBronze: THREE.MeshStandardMaterial;
  public caseWood: THREE.MeshStandardMaterial;
  public goldFoil: THREE.MeshStandardMaterial;
  public silverFoil: THREE.MeshStandardMaterial;
  public oxidizedDark: THREE.MeshStandardMaterial;
  public dialPlateMaterial: THREE.MeshStandardMaterial;
  public glassReservoir: THREE.MeshPhysicalMaterial;
  public waterMaterial: THREE.MeshPhysicalMaterial;
  public ghostMaterial: THREE.MeshStandardMaterial;
  public moonSilverSide: THREE.MeshStandardMaterial;
  public moonBlackSide: THREE.MeshStandardMaterial;

  // Archaeological & Corrosion Materials
  public freshBronze: THREE.MeshStandardMaterial;
  public nantokiteCorrosion: THREE.MeshStandardMaterial;
  public cupriteCorrosion: THREE.MeshStandardMaterial;
  public malachiteEncrustation: THREE.MeshStandardMaterial;
  public marineConcretion: THREE.MeshStandardMaterial;
  public museumPatina: THREE.MeshStandardMaterial;

  private subsystemColors: Record<SubsystemType, number> = {
    DRIVE: 0x38bdf8,
    SOLAR: 0xf59e0b,
    LUNAR: 0x94a3b8,
    NODAL_DRACONIC: 0xec4899,
    ECLIPSE_STAGE: 0xa855f7,
    PLANETARY: 0x10b981,
    PRECESSIONAL: 0x6366f1,
    ANAPHORIC_SKY: 0x0ea5e9,
    PIN_DRUM_GONG: 0xeab308,
    CALENDAR_CYCLES: 0xf97316,
    COMETS_OVERLAY: 0x22d3ee
  };

  private colorCodedMaterials: Map<SubsystemType, THREE.MeshStandardMaterial> = new Map();

  constructor() {
    this.bronzeBase = new THREE.MeshStandardMaterial({
      color: 0xc89658,
      metalness: 0.85,
      roughness: 0.35
    });

    this.caseBronze = new THREE.MeshStandardMaterial({
      color: 0xb48246,
      metalness: 0.88,
      roughness: 0.42
    });

    this.caseWood = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      metalness: 0.05,
      roughness: 0.85
    });

    this.goldFoil = new THREE.MeshStandardMaterial({
      color: 0xfcd34d,
      metalness: 0.95,
      roughness: 0.20,
      emissive: 0x78350f,
      emissiveIntensity: 0.25
    });

    this.silverFoil = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.25
    });

    this.oxidizedDark = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      metalness: 0.5,
      roughness: 0.7
    });

    this.dialPlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a36a,
      metalness: 0.80,
      roughness: 0.38
    });

    this.glassReservoir = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 1.0,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
      thickness: 1.5
    });

    this.waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.75,
      opacity: 0.85,
      transparent: true,
      roughness: 0.15,
      ior: 1.33
    });

    this.ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      wireframe: true
    });

    this.moonSilverSide = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffffff,
      emissiveIntensity: 0.3
    });

    this.moonBlackSide = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.9
    });

    // Life-of-Object Corrosion Stages
    this.freshBronze = new THREE.MeshStandardMaterial({
      color: 0xe8ad63,
      metalness: 0.92,
      roughness: 0.22
    });

    this.nantokiteCorrosion = new THREE.MeshStandardMaterial({
      color: 0xb58b63,
      metalness: 0.65,
      roughness: 0.55
    });

    this.cupriteCorrosion = new THREE.MeshStandardMaterial({
      color: 0x733626,
      metalness: 0.40,
      roughness: 0.75
    });

    this.malachiteEncrustation = new THREE.MeshStandardMaterial({
      color: 0x247a50,
      metalness: 0.25,
      roughness: 0.85
    });

    this.marineConcretion = new THREE.MeshStandardMaterial({
      color: 0x475e53,
      metalness: 0.15,
      roughness: 0.95
    });

    this.museumPatina = new THREE.MeshStandardMaterial({
      color: 0x2e6653,
      metalness: 0.45,
      roughness: 0.65
    });

    for (const [sub, hex] of Object.entries(this.subsystemColors)) {
      this.colorCodedMaterials.set(sub as SubsystemType, new THREE.MeshStandardMaterial({
        color: hex,
        metalness: 0.75,
        roughness: 0.35,
        emissive: hex,
        emissiveIntensity: 0.25
      }));
    }
  }

  public getMaterialForGear(subsystem: SubsystemType, colorCode: boolean): THREE.MeshStandardMaterial {
    if (colorCode) {
      return this.colorCodedMaterials.get(subsystem) || this.bronzeBase;
    }
    return this.bronzeBase;
  }

  public getCorrosionMaterial(year: number): THREE.MeshStandardMaterial {
    if (year <= -50) return this.freshBronze;
    if (year <= 100) return this.nantokiteCorrosion;
    if (year <= 800) return this.cupriteCorrosion;
    if (year <= 1500) return this.malachiteEncrustation;
    if (year <= 1900) return this.marineConcretion;
    return this.museumPatina;
  }
}
