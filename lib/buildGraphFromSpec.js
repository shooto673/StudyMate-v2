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
      // Render the triangle; the exterior ∠ACD is described in the prompt.
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
    default:
      return null
  }
}
