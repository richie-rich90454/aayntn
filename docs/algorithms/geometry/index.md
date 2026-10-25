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

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Convex hull | $O(n \log n)$ | $O(n)$ | `foundations.sorting` | [Convex hull](/algorithms/geometry/convex-hull) |
| Point in polygon | $O(n)$ per query | $O(1)$ per query | `geometry.convex-hull` | [Point in polygon](/algorithms/geometry/point-in-polygon) |
| Rotating calipers | $O(n \log n)$ for the whole algorithm | $O(n)$ | `geometry.convex-hull` | [Rotating calipers](/algorithms/geometry/rotating-calipers) |
| Closest pair | $O(n \log n)$ | $O(n)$ | `geometry.convex-hull` | [Closest pair](/algorithms/geometry/closest-pair) |
| Sweep line | $O(n \log n)$ for the decision version | $O(n)$ | `geometry.convex-hull` | [Sweep line](/algorithms/geometry/sweep-line) |

The convex hull is the starting point because it is the geometry analog of the prefix sum: it discards the points that can never be extremal, leaving a structure of size at most $h$ that answers a surprising number of questions about the original set.

Three of the four techniques after it are built on the hull or on the same orientation test, and all of them are linear once a sort is done. The point-in-polygon test is a scan over the edges with a crossing count. The rotating calipers sweep two pointers around the hull. The closest pair splits the plane in half and compares only the points in a narrow strip. The sweep line moves a vertical line across a set of events and keeps the active set in a balanced tree.

The hull's own bound is $O(n \log n)$ because of the sort, and each sweep after that is $O(n)$, so the whole geometry subject is dominated by sorting.

## Recognition signals

- **"points"**, **"coordinates"**, **"$x$ and $y$"**, **"a lattice"**, **"vertices"**, **"a polygon"**.
- **"the smallest shape containing"**, **"the outermost"**, **"the boundary of the set"**, **"the extreme point"**. A hull is defined by containment, and the phrase is a reliable signal.
- **"clockwise"**, **"counterclockwise"**, **"to the left of"**, **"the turn"**, **"the area of the polygon"**. The signed area and the orientation test are the two formulas every other formula is derived from.
- **"the closest pair"**, **"the farthest pair"**, **"the smallest enclosing circle"**.
- **"is the point inside"**, **"does the segment cross"**.
- **"the distance"** with an explicit metric: Euclidean, squared Euclidean, Manhattan, or Chebyshev. Contest geometry problems rarely say which one they mean, and the difference changes the answer.
- **"for every pair of segments"**, **"do any two of these roads cross"**. That is the sweep line, and it is the answer when the number of pairs is too large to test.

The signal that rules the subject out is a problem about shapes whose exact coordinates do not matter, such as a combinatorial count of polyominoes. That is a [combinatorics](/algorithms/combinatorics/) problem, and the geometry is only the story.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| The extreme points of a set | [Convex hull](/algorithms/geometry/convex-hull) |
| Whether three points turn left or right | A cross product, with the zero case handled separately |
| The area of a polygon given by its vertices | The shoelace formula, using the signed area |
| Whether a point is inside a convex polygon | Binary search over the hull's fan, in $O(\log n)$ |
| Whether a point is inside an arbitrary polygon | [Point in polygon](/algorithms/geometry/point-in-polygon), by the crossing-number test |
| The closest pair of points | [Closest pair](/algorithms/geometry/closest-pair), by divide and conquer |
| The pair of points that is farthest apart | [Rotating calipers](/algorithms/geometry/rotating-calipers) over the hull |
| Whether two segments cross | Orientation tests on the four endpoints |
| Whether any two of many segments cross | [Sweep line](/algorithms/geometry/sweep-line) |
| The smallest circle containing the points | [The smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle) |

The convex hull is the common first step: the closest pair of points is not necessarily a pair of hull vertices, but the extreme point questions almost always are, and any question about the shape of a point set becomes simpler once the hull has been computed.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Closest pair | O(n log n) | O(n) | `geometry.convex-hull` | [Closest pair](/algorithms/geometry/closest-pair) | Prose only |
| Convex hull | O(n log n) | O(n) | `foundations.sorting` | [Convex hull](/algorithms/geometry/convex-hull) | Prose only |
| Integer geometry | O(n log C) | O(n) | `number-theory.extended-euclidean` | [Integer geometry](/algorithms/geometry/integer-geometry) | [Source](/implementations/geometry-integer-geometry/) |
| K-D trees | O(n log^2 n) build with a full sort per node; O(log n) average per query and O(n) worst case | O(n) | `foundations.sorting` | [K-D trees](/algorithms/geometry/kd-trees) | [Source](/implementations/geometry-kd-trees/) |
| Line arrangements and the half-plane intersection | O(n^2) for the reference clipping, O(n log n) with the angular sweep | O(n) | `geometry.convex-hull` | [Line arrangements and the half-plane intersection](/algorithms/geometry/half-plane-intersection) | [Source](/implementations/geometry-half-plane-intersection/) |
| Point in polygon | O(n) per query | O(1) per query | `geometry.convex-hull` | [Point in polygon](/algorithms/geometry/point-in-polygon) | Prose only |
| Robust predicates | O(1) per query | O(1) | `foundations.complexity` | [Robust predicates](/algorithms/geometry/robust-predicates) | [Source](/implementations/geometry-robust-predicates/) |
| Rotating calipers | O(n log n) for the whole algorithm | O(n) | `geometry.convex-hull` | [Rotating calipers](/algorithms/geometry/rotating-calipers) | Prose only |
| Sweep line | O(n log n) for the decision version | O(n) | `geometry.convex-hull` | [Sweep line](/algorithms/geometry/sweep-line) | Prose only |
| The smallest enclosing circle | O(n^3) worst case; O(n) expected with a random shuffle | O(n) for the points, O(1) auxiliary | `geometry.convex-hull` | [The smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle) | [Source](/implementations/geometry-smallest-enclosing-circle/) |
| The Voronoi diagram | O(n) per nearest-site query; O(n log n) to build the full diagram | O(1) extra for a direct query; O(n) for the full diagram | `geometry.convex-hull` | [The Voronoi diagram](/algorithms/geometry/voronoi-diagram) | [Source](/implementations/geometry-voronoi-diagram/) |

<!-- aayntn:subject:end -->

## Related subjects

- [Foundations](/algorithms/foundations/) supplies the sorting that a hull computation begins with, and the exact integer arithmetic that the cross product needs.
- [Advanced algorithms](/algorithms/advanced/) contains the offline techniques that sweep-line geometry resembles.
- [Searching](/algorithms/searching/) supplies the binary search that answers a point-in-convex-polygon query.
- [Combinatorics](/algorithms/combinatorics/) counts the configurations that a geometry problem sometimes asks for rather than the shape itself.
- The [academy](/start/) introduces the coordinate and the cross product as the vocabulary of every geometry problem, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
