export interface GearStage {
  drivingTeeth: number;
  drivenTeeth: number;
  ratio: number;
  centerDistanceMm: number;
}

export interface CandidateTrain {
  id: string;
  name: string;
  targetRatio: number;
  actualRatio: number;
  errorPercentage: number;
  errorDaysPerCentury: number;
  stages: GearStage[];
  toothCounts: number[];
  centerDistances: number[];
  isValidMesh: boolean;
}

export class GearTrainFoundry {
  public static solveTargetRatio(
    targetRatio: number,
    minTeeth: number = 12,
    maxTeeth: number = 140,
    module: number = 1.0,
    maxStages: number = 3
  ): CandidateTrain[] {
    const candidates: CandidateTrain[] = [];
    const seenRatios = new Set<string>();

    // 1. Single Stage Direct Search
    for (let z1 = minTeeth; z1 <= maxTeeth; z1++) {
      const z2 = Math.round(z1 * targetRatio);
      if (z2 >= minTeeth && z2 <= maxTeeth) {
        const ratio = z2 / z1;
        const errPct = Math.abs((ratio - targetRatio) / targetRatio) * 100;
        const errDays = Math.abs(ratio - targetRatio) * 36525;
        const key = `${z1}:${z2}`;

        if (!seenRatios.has(key)) {
          seenRatios.add(key);
          candidates.push({
            id: `cand_1s_${candidates.length + 1}`,
            name: `1-Stage (${z2}T / ${z1}T)`,
            targetRatio,
            actualRatio: ratio,
            errorPercentage: errPct,
            errorDaysPerCentury: errDays,
            stages: [
              {
                drivingTeeth: z1,
                drivenTeeth: z2,
                ratio,
                centerDistanceMm: (module * (z1 + z2)) / 2
              }
            ],
            toothCounts: [z1, z2],
            centerDistances: [(module * (z1 + z2)) / 2],
            isValidMesh: true
          });
        }
      }
    }

    // 2. Continued Fractions Search
    const cfConvergents = this.getContinuedFractionConvergents(targetRatio, 8);
    for (const [num, den] of cfConvergents) {
      if (num <= maxTeeth && den <= maxTeeth && num >= minTeeth && den >= minTeeth) {
        const ratio = num / den;
        const errPct = Math.abs((ratio - targetRatio) / targetRatio) * 100;
        const errDays = Math.abs(ratio - targetRatio) * 36525;
        const key = `${den}:${num}`;

        if (!seenRatios.has(key)) {
          seenRatios.add(key);
          candidates.push({
            id: `cand_cf_${candidates.length + 1}`,
            name: `Convergent (${num}T / ${den}T)`,
            targetRatio,
            actualRatio: ratio,
            errorPercentage: errPct,
            errorDaysPerCentury: errDays,
            stages: [
              {
                drivingTeeth: den,
                drivenTeeth: num,
                ratio,
                centerDistanceMm: (module * (num + den)) / 2
              }
            ],
            toothCounts: [den, num],
            centerDistances: [(module * (num + den)) / 2],
            isValidMesh: true
          });
        }
      }
    }

    // 3. 2-Stage Compound Train Factorization (z2/z1 * z4/z3)
    if (maxStages >= 2 && candidates.length < 8) {
      for (let z1 = minTeeth; z1 <= 64; z1 += 2) {
        for (let z3 = minTeeth; z3 <= 64; z3 += 2) {
          const desiredTotal = targetRatio * z1 * z3;
          // Look for clean factor pairs z2 * z4 ~= desiredTotal
          for (let z2 = minTeeth; z2 <= maxTeeth; z2++) {
            const z4 = Math.round(desiredTotal / z2);
            if (z4 >= minTeeth && z4 <= maxTeeth) {
              const actual = (z2 / z1) * (z4 / z3);
              const errPct = Math.abs((actual - targetRatio) / targetRatio) * 100;
              if (errPct < 0.25) {
                const errDays = Math.abs(actual - targetRatio) * 36525;
                const key = `${z1}:${z2}x${z3}:${z4}`;
                if (!seenRatios.has(key)) {
                  seenRatios.add(key);
                  const cd1 = (module * (z1 + z2)) / 2;
                  const cd2 = (module * (z3 + z4)) / 2;
                  candidates.push({
                    id: `cand_2s_${candidates.length + 1}`,
                    name: `2-Stage Compound (${z2}/${z1} × ${z4}/${z3})`,
                    targetRatio,
                    actualRatio: actual,
                    errorPercentage: errPct,
                    errorDaysPerCentury: errDays,
                    stages: [
                      { drivingTeeth: z1, drivenTeeth: z2, ratio: z2 / z1, centerDistanceMm: cd1 },
                      { drivingTeeth: z3, drivenTeeth: z4, ratio: z4 / z3, centerDistanceMm: cd2 }
                    ],
                    toothCounts: [z1, z2, z3, z4],
                    centerDistances: [cd1, cd2],
                    isValidMesh: Math.abs(cd1 - cd2) < 35 // workable gear cluster
                  });
                }
              }
            }
          }
        }
      }
    }

    // Sort by smallest error in days per century
    return candidates.sort((a, b) => a.errorDaysPerCentury - b.errorDaysPerCentury).slice(0, 10);
  }

  private static getContinuedFractionConvergents(val: number, maxTerms: number = 8): [number, number][] {
    const convergents: [number, number][] = [];
    let rem = val;
    let p0 = 0, p1 = 1;
    let q0 = 1, q1 = 0;

    for (let i = 0; i < maxTerms; i++) {
      const a = Math.floor(rem);
      const p2 = a * p1 + p0;
      const q2 = a * q1 + q0;

      convergents.push([p2, q2]);

      p0 = p1; p1 = p2;
      q0 = q1; q1 = q2;

      const frac = rem - a;
      if (Math.abs(frac) < 1e-9) break;
      rem = 1 / frac;
    }
    return convergents;
  }

  // --- FABRICATION EXPORTERS ---

  public static exportSVG(teeth: number, module: number = 1.0, boreRadius: number = 3.0): string {
    const pitchRadius = (module * teeth) / 2;
    const outerRadius = pitchRadius + module;
    const rootRadius = Math.max(boreRadius + 1, pitchRadius - 1.25 * module);
    const size = (outerRadius + 5) * 2;
    const center = size / 2;

    let path = '';
    const numPoints = teeth * 2;
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i * Math.PI) / teeth;
      const isTip = i % 2 === 1;
      const r = isTip ? outerRadius : rootRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      path += (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    path += ' Z';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}mm" height="${size}mm">
  <rect width="100%" height="100%" fill="#0c0f17" />
  <!-- Outer Gear Profile (Cut Path) -->
  <path d="${path}" fill="#c89658" stroke="#f59e0b" stroke-width="0.3" />
  <!-- Central Arbor Bore -->
  <circle cx="${center}" cy="${center}" r="${boreRadius}" fill="#0c0f17" stroke="#38bdf8" stroke-width="0.3" />
  <!-- Pitch Circle (Reference) -->
  <circle cx="${center}" cy="${center}" r="${pitchRadius}" fill="none" stroke="#64748b" stroke-dasharray="1,1" stroke-width="0.2" />
  <text x="${center}" y="${size - 4}" fill="#94a3b8" font-size="3" text-anchor="middle" font-family="monospace">
    Antikythera Mk II Gear: ${teeth}T | Mod ${module} | Pitch Dia ${(pitchRadius*2).toFixed(1)}mm
  </text>
</svg>`;
  }

  public static exportDXF(teeth: number, module: number = 1.0, boreRadius: number = 3.0): string {
    const pitchRadius = (module * teeth) / 2;
    const outerRadius = pitchRadius + module;
    const rootRadius = Math.max(boreRadius + 1, pitchRadius - 1.25 * module);

    let dxf = `0\nSECTION\n2\nENTITIES\n`;
    // Circle for bore
    dxf += `0\nCIRCLE\n8\nBORE\n10\n0.0\n20\n0.0\n30\n0.0\n40\n${boreRadius}\n`;

    // Lines for teeth
    const numPoints = teeth * 2;
    for (let i = 0; i < numPoints; i++) {
      const a1 = (i * Math.PI) / teeth;
      const a2 = ((i + 1) * Math.PI) / teeth;
      const r1 = i % 2 === 1 ? outerRadius : rootRadius;
      const r2 = (i + 1) % 2 === 1 ? outerRadius : rootRadius;

      const x1 = r1 * Math.cos(a1);
      const y1 = r1 * Math.sin(a1);
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);

      dxf += `0\nLINE\n8\nTEETH\n10\n${x1.toFixed(3)}\n20\n${y1.toFixed(3)}\n30\n0.0\n11\n${x2.toFixed(3)}\n21\n${y2.toFixed(3)}\n31\n0.0\n`;
    }

    dxf += `0\nENDSEC\n0\nEOF\n`;
    return dxf;
  }

  public static exportBOM(train: CandidateTrain, module: number = 1.0): string {
    let csv = `Stage,Role,Teeth,Module (mm),Pitch Dia (mm),Outer Dia (mm),Root Dia (mm),Center Dist (mm),Dividing Plate Index\n`;
    train.stages.forEach((s, idx) => {
      const pitch1 = s.drivingTeeth * module;
      const pitch2 = s.drivenTeeth * module;
      csv += `${idx + 1},Driving,${s.drivingTeeth},${module},${pitch1.toFixed(2)},${(pitch1 + 2 * module).toFixed(2)},${(pitch1 - 2.5 * module).toFixed(2)},${s.centerDistanceMm.toFixed(2)},Index hole on ${s.drivingTeeth}-hole circle\n`;
      csv += `${idx + 1},Driven,${s.drivenTeeth},${module},${pitch2.toFixed(2)},${(pitch2 + 2 * module).toFixed(2)},${(pitch2 - 2.5 * module).toFixed(2)},${s.centerDistanceMm.toFixed(2)},Index hole on ${s.drivenTeeth}-hole circle\n`;
    });
    return csv;
  }

  public static exportSTL(teeth: number, module: number = 1.0, thickness: number = 2.0): string {
    const pitchRadius = (module * teeth) / 2;
    const outerRadius = pitchRadius + module;
    const rootRadius = pitchRadius - 1.25 * module;

    // Simple ASCII STL for gear cylinder with triangular teeth
    let stl = `solid antikythera_gear_${teeth}t\n`;
    const numPoints = teeth * 2;

    for (let i = 0; i < numPoints; i++) {
      const a1 = (i * Math.PI) / teeth;
      const a2 = ((i + 1) * Math.PI) / teeth;
      const r1 = i % 2 === 1 ? outerRadius : rootRadius;
      const r2 = (i + 1) % 2 === 1 ? outerRadius : rootRadius;

      const x1 = r1 * Math.cos(a1);
      const y1 = r1 * Math.sin(a1);
      const x2 = r2 * Math.cos(a2);
      const y2 = r2 * Math.sin(a2);

      // Top face triangle (normal 0, 0, 1)
      stl += `  facet normal 0 0 1\n    outer loop\n      vertex 0 0 ${thickness / 2}\n      vertex ${x1.toFixed(3)} ${y1.toFixed(3)} ${thickness / 2}\n      vertex ${x2.toFixed(3)} ${y2.toFixed(3)} ${thickness / 2}\n    endloop\n  endfacet\n`;
      // Bottom face triangle (normal 0, 0, -1)
      stl += `  facet normal 0 0 -1\n    outer loop\n      vertex 0 0 ${-thickness / 2}\n      vertex ${x2.toFixed(3)} ${y2.toFixed(3)} ${-thickness / 2}\n      vertex ${x1.toFixed(3)} ${y1.toFixed(3)} ${-thickness / 2}\n    endloop\n  endfacet\n`;
    }

    stl += `endsolid antikythera_gear_${teeth}t\n`;
    return stl;
  }
}
