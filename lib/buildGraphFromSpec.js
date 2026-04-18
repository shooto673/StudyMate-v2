// Converts a solver canonical spec into graphData for MathGraph.jsx.
// Keeping this pure/JS-only so it can be tested without React.
//
// Contract:
//   input  : spec from lib/mathSolvers.js ({problemType, given, computed, ...})
//   output : graphData object (same shape the existing renderer consumes)
//            or null if no figure is appropriate for this problemType.

/**
 * Build a graphData object from a solver spec.
 * @param {object} spec
 * @returns {object|null}
 */
export function buildGraphFromSpec(spec) {
  if (!spec || !spec.problemType) return null

  switch (spec.problemType) {
    case 'triangle_angle_sum': {
      const { angleA, angleB } = spec.given || {}
      return {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        // C is the asked angle → null
        angles: [
          angleA != null ? `${angleA}°` : null,
          angleB != null ? `${angleB}°` : null,
          null,
        ],
        sides: null,
      }
    }
    case 'exterior_angle': {
      const { angleA, angleB } = spec.given || {}
      // Render the triangle AND the extension point D on ray BC beyond C,
      // so the "外角 ∠ACD" in the question text has a visible D anchor.
      return {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        angles: [
          angleA != null ? `${angleA}°` : null,
          angleB != null ? `${angleB}°` : null,
          null,
        ],
        sides: null,
        // `through` names the two vertices that define the line; `beyond`
        // says which side D falls on. Renderer draws a dashed continuation.
        extensions: [{ through: 'BC', beyond: 'C', label: 'D' }],
      }
    }
    case 'similarity_ratio_length': {
      const { knownLabel, knownSide, askedLabel, knownIsBig } = spec.given || {}
      // △ABC ∽ △DEF side-by-side
      const firstSides = ['AB', 'BC', 'CA'].map(lbl =>
        lbl === knownLabel && knownIsBig ? `${knownSide}cm` : null
      )
      const secondSides = ['DE', 'EF', 'FD'].map(lbl =>
        lbl === knownLabel && !knownIsBig ? `${knownSide}cm`
          : (lbl === askedLabel ? null : null)
      )
      return {
        type: 'shape',
        shape: 'triangle',
        labels: ['A', 'B', 'C'],
        sides: firstSides,
        angles: null,
        secondShape: {
          shape: 'triangle',
          labels: ['D', 'E', 'F'],
          sides: secondSides,
          angles: null,
        },
      }
    }
    case 'ratio_length': {
      const { ratio, knownSide } = spec.given || {}
      const [a, b] = ratio || []
      // New shape type: 3 parallel lines with a transversal, segments AB:BC.
      return {
        type: 'shape',
        shape: 'parallel_lines',
        labels: ['A', 'B', 'C'],
        segments: [
          a != null ? `AB=${knownSide}cm` : null,
          b != null ? `BC=?` : null,
        ],
        ratio: ratio ? `${a}:${b}` : null,
      }
    }
    case 'ratio_simplify': {
      // Pure arithmetic → no figure needed.
      return null
    }
    case 'thales_theorem': {
      const { angleBAC } = spec.given || {}
      // A at 180° (left), B at 0° (right) — AB is a diameter through O.
      // ∠BAC is the inscribed angle at A looking at arc BC (not containing A).
      // Inscribed angle theorem: arc BC (not containing A) = 2 * angleBAC.
      // B is at 0°, so C is placed CCW from B by 2*angleBAC.
      const cAngle = Math.max(10, Math.min(170, 2 * (angleBAC ?? 30)))
      return {
        type: 'shape',
        shape: 'circle',
        center: 'O',
        pointsOnCircle: [
          { label: 'A', angle: 180 },
          { label: 'B', angle: 0 },
          { label: 'C', angle: cAngle },
        ],
        diameter: ['A', 'B'],
        chords: [
          { from: 'A', to: 'C' },
          { from: 'B', to: 'C' },
        ],
        rightAngleAt: 'C',
        angleLabels: angleBAC != null
          ? [{ at: 'A', value: `${angleBAC}°` }]
          : undefined,
      }
    }
    case 'cyclic_quadrilateral': {
      const { angleABC } = spec.given || {}
      const a = angleABC ?? 68
      // Place A, B, C, D CCW on the circle so ∠ABC = a.
      // Inscribed angle at B looking at arc AC (not containing B).
      // If A is at 0° and C is at γ (CCW), then arc AC not containing B = 360-γ,
      // so ∠ABC = (360-γ)/2  →  γ = 360 - 2a.
      // B sits between A and C (at γ/2). D sits between C and A (at (γ+360)/2).
      const cAng = 360 - 2 * a
      const bAng = cAng / 2
      const dAng = (cAng + 360) / 2
      return {
        type: 'shape',
        shape: 'circle',
        center: 'O',
        pointsOnCircle: [
          { label: 'A', angle: 0 },
          { label: 'B', angle: bAng },
          { label: 'C', angle: cAng },
          { label: 'D', angle: dAng },
        ],
        polygon: ['A', 'B', 'C', 'D'],
        angleLabels: [{ at: 'B', value: `${a}°` }],
      }
    }
    default:
      return null
  }
}
