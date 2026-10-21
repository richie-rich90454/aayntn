---
id: geometry.index
title: The Computational geometry
summary: Answer questions about points and shapes, using arithmetic on coordinates rather than drawing anything.
division: []
subjects: [geometry]
level: advanced
importance: advanced-technique
keywords: [geometry, convex hull, points, polygons, cross product, orientation]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Computational geometry is the subject of problems about points, lines, and shapes. The word "computational" is the important word: no picture is drawn, and no diagram is trusted. Every question is answered by arithmetic on coordinates, and the whole difficulty is in finding an arithmetic formulation that is correct in every case, including the degenerate ones.

The foundational operation is the orientation test. Given three points, the cross product of two difference vectors says whether they turn left, turn right, or lie on a line. Nearly every algorithm in this subject is built on it, and nearly every bug in this subject is a failure to handle the third case.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Convex hull | $O(n \log n)$ | `foundations.sorting` | [Convex hull](/algorithms/geometry/convex-hull) |

The convex hull is the starting point because it is the geometry analog of the prefix sum: it discards the points that can never be extremal, leaving a structure of size at most $h$ that answers a surprising number of questions about the original set.

## Recognition signals

- **"points"**, **"coordinates"**, **"$x$ and $y$"**, **"a lattice"**, **"vertices"**, **"a polygon"**.
- **"the smallest shape containing"**, **"the outermost"**, **"the boundary of the set"**, **"the extreme point"**. A hull is defined by containment, and the phrase is a reliable signal.
- **"clockwise"**, **"counterclockwise"**, **"to the left of"**, **"the turn"**, **"the area of the polygon"**. The signed area and the orientation test are the two formulas every other formula is derived from.
- **"the closest pair"**, **"the farthest pair"**, **"the smallest enclosing circle"**.
- **"is the point inside"**, **"does the segment cross"**.
- **"the distance"** with an explicit metric: Euclidean, squared Euclidean, Manhattan, or Chebyshev. Contest geometry problems rarely say which one they mean, and the difference changes the answer.

The signal that rules the subject out is a problem about shapes whose exact coordinates do not matter, such as a combinatorial count of polyominoes. That is a [combinatorics](/algorithms/combinatorics/) problem, and the geometry is only the story.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| The extreme points of a set | [Convex hull](/algorithms/geometry/convex-hull) |
| Whether three points turn left or right | A cross product, with the zero case handled separately |
| The area of a polygon given by its vertices | The shoelace formula, using the signed area |
| Whether a point is inside a convex polygon | Binary search over the hull's fan |
| The closest pair of points | The divide-and-conquer closest-pair algorithm |
| The pair of points that is farthest apart | Rotating calipers over the hull |
| Whether two segments cross | Orientation tests on the four endpoints |
| Whether a point is inside an arbitrary polygon | A crossing-number test over the edges |

The convex hull is the common first step: the closest pair of points is not necessarily a pair of hull vertices, but the extreme point questions almost always are, and any question about the shape of a point set becomes simpler once the hull has been computed.

## What this subject implies but does not yet cover

- **Rotating calipers.** The technique that answers every extreme-pair question about a convex polygon in $O(h)$ time by sweeping two pointers around the hull. It is the standard route to the diameter of a point set and to the longest distance between two convex polygons.
- **The closest pair of points.** The divide-and-conquer algorithm that finds the closest pair in $O(n \log n)$, with the strip argument and the packing bound that make it work.
- **Sweep-line geometry.** The technique of sweeping a line across a set of events and maintaining the active set, which answers the closest pair, the rectangle overlap, and the tangency questions. It is the geometry analog of [parallel binary search](/algorithms/advanced/parallel-binary-search) and it is not covered.
- **The point-in-polygon test.** The crossing-number test for a point against an arbitrary polygon, and the winding number test as an alternative, and the logarithmic-time version for a convex polygon.
- **Integer geometry.** The lattice-specific techniques: the Pick's theorem for the area and the boundary count of a lattice polygon, and the gcd-based formula for the number of lattice points on a segment.
- **Line arrangements and the half-plane intersection**, and the problem of finding the region that satisfies a set of linear constraints.

## Related subjects

- [Foundations](/algorithms/foundations/) supplies the sorting that a hull computation begins with, and the exact integer arithmetic that the cross product needs.
- [Advanced algorithms](/algorithms/advanced/) contains the offline techniques that sweep-line geometry resembles.
- [Searching](/algorithms/searching/) supplies the binary search that answers a point-in-convex-polygon query.
- [Combinatorics](/algorithms/combinatorics/) counts the configurations that a geometry problem sometimes asks for rather than the shape itself.
