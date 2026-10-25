---
id: geometry.voronoi-diagram
title: The Voronoi diagram
summary: Partition the plane into one region per site, read the cell structure from the Delaunay dual, and answer a nearest-site query in linear time without building the diagram.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: common-contest-technique
keywords:
    [
        voronoi diagram,
        nearest site,
        delaunay triangulation,
        perpendicular bisector,
        empty circle,
        point location,
        convex cell,
    ]
prerequisites:
    required: [geometry.convex-hull]
    recommended:
        [
            geometry.robust-predicates,
            foundations.sorting,
            foundations.complexity,
            searching.binary-search,
        ]
complexity:
    time: "O(n) per nearest-site query; O(n log n) to build the full diagram"
    space: "O(1) extra for a direct query; O(n) for the full diagram"
assumptions:
    - The sites are distinct points with integer coordinates of magnitude at most 10^6, so every squared distance is below 2^53 and fits exactly in a signed 64-bit integer and in a JavaScript Number.
    - The distance is the Euclidean distance, and every comparison uses the squared distance.
    - "The full diagram is in general position when its counts are stated: no three sites are collinear and no four are cocircular."
implementations: geometry.voronoi-diagram
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/geometry.voronoi-diagram.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A **Voronoi diagram** of a set of sites is the partition of the plane into one region per site, where the region of a site contains exactly the points that are at least as close to that site as to every other site. The regions are called **Voronoi cells**, and the boundaries between them are pieces of the perpendicular bisectors of pairs of sites.

The diagram is the geometric form of the nearest-site question. It answers "which site is closest to this point" by point location instead of by a scan, and it exposes the structure of the answer: a cell is a convex polygon, a boundary is a tie between exactly two sites, and a vertex is a tie between at least three sites.

| Property                 | Value                                             |
| ------------------------ | ------------------------------------------------- |
| Input                    | $n$ sites, then $q$ query points                  |
| Cell                     | A convex polygon, possibly unbounded              |
| Diagram size             | $O(n)$ cells, edges and vertices                  |
| Construction             | $O(n \log n)$ time and $O(n)$ space               |
| Direct query             | $O(n)$ time and $O(1)$ extra space                |
| Query after construction | $O(\log n)$ with point location                   |
| Dual                     | The Delaunay triangulation                        |
| Tie rule                 | Smallest squared distance, then lowest site index |

The last two rows are the two ideas that make the technique useful in a contest. The **Delaunay dual** turns the diagram into a triangulation that is easier to construct and to reason about. The **tie rule** turns the closed cells, which overlap on their boundaries, into a partition in which every query has exactly one answer.

## Problem motivation

A city has several post offices and wants to answer, for every address, which office is nearest. A telephone company has cell towers and wants to know which tower serves each point. A robot moving through a field of obstacles wants the nearest charging station. A planner wants the point inside a region that is farthest from every site, which is the center of the largest empty circle.

All of these questions have the same shape. There is a fixed set of **sites**, and there is a **query point**. The answer is the site that minimizes the distance to the query, with a tie broken by a stated rule. The sites do not move, and there are many queries.

The naive answer is a scan. For each query, compute the distance to every site and keep the smallest. That costs $O(n)$ per query and $O(nq)$ for all queries, with no preprocessing and no extra memory. For $n = 100$ and $q = 100$ it is instant. For $n = 10^{5}$ and $q = 10^{5}$ it is $10^{10}$ distance computations and it is hopeless.

The diagram is the preprocessing that removes the per-query scan. Build the partition once, then locate each query in it. The construction is $O(n \log n)$ and a query is $O(\log n)$, so the total is $O(n \log n + q \log n)$.

There is a catch that the rest of the article keeps returning to: **the diagram is not always worth building**. If there is only one query, or if $n q$ is small enough, the scan is shorter, safer and faster. If the sites change, a static diagram is the wrong structure. The reference implementations in this article answer the defining query directly and do not build the full diagram, because that is the right choice for the single-query contract they implement.

## Recognition patterns

The Voronoi diagram is the right model when the statement contains some of these phrases.

- "The nearest site", "the closest point of the set", "which facility serves this location".
- "The region of the plane", "the service area", "the cell", "the zone of influence".
- "Perpendicular bisector", "equidistant from two sites", "a tie between three sites".
- "The largest empty circle", "the point farthest from every site", "the toxic waste dump".
- "Delaunay triangulation", "empty circumcircle", "the dual of the diagram".
- "Many queries on the same set of points", "preprocess the sites".

The constraint values that decide the technique:

| Situation | What it means |
| --- | --- |
| $n \le 2000$ and $q \le 2.5 \ast 10^{5}$ | The $O(nq)$ scan is often the intended solution |
| $n \le 10^{5}$ and $q \le 10^{5}$ | Build a diagram or a K-D tree |
| $n q \le 10^{7}$ | The scan is the shortest correct program |
| The sites are inserted and deleted | A static diagram is wrong; use a K-D tree or rebuild |
| The metric is Manhattan or graph distance | The Euclidean bisector is the wrong boundary |
| The question is only one query | The scan is optimal, and the diagram is overhead |
| The question is the farthest site | Use the farthest-point diagram, not this one |
| All sites lie on a line | The nearest site is one of the two neighbors on the line, and binary search is enough |

Two nearby techniques are easy to confuse with this one. **Closest pair** asks for the two sites that are closest to each other, which is one question about the whole set and is solved by divide and conquer without a diagram. **K-D trees** answer nearest-site queries by spatial pruning and have average logarithmic performance, but they do not expose the cells, the empty circles, or the Delaunay triangles.

## Naive approach

The baseline is the definition itself. For each query, scan every site, compute the squared distance, and keep the best pair.

```cpp
long long best = 0;
int best_index = -1;
for (int i = 0; i < n; i++) {
    long long dx = x[i] - qx;
    long long dy = y[i] - qy;
    long long d = dx * dx + dy * dy;
    if (best_index < 0 || d < best || (d == best && i < best_index)) {
        best = d;
        best_index = i;
    }
}
```

The scan costs $O(n)$ time and $O(1)$ extra space per query, so all queries cost $O(nq)$. It uses only integer arithmetic, it needs no geometry beyond a subtraction and two multiplications, and it is correct for every degenerate configuration.

A second baseline builds the diagram without exploiting its structure. For each site, intersect the $n - 1$ half-planes that are defined by its bisectors with the other sites. Each intersection costs $O(n \log n)$ with a convex polygon clip, so the whole diagram costs $O(n^{2} \log n)$. The diagram has only $O(n)$ complexity, so this baseline pays a factor of $n$ for not using the adjacency structure.

For the single-query contract of this article, the scan is the baseline and the reference. The rest of the article explains what the diagram adds, when it is worth its construction cost, and how its structure is proved.

## Key insight

The key insight is local. For two sites $p_i$ and $p_j$, the set of points that are at least as close to $p_i$ as to $p_j$ is a **half-plane**. Its boundary is the perpendicular bisector of the segment from $p_i$ to $p_j$. Therefore the cell of $p_i$ is the intersection of $n - 1$ half-planes, one for every other site:

$$
V_i = \bigcap_{j \ne i} \{ q : \operatorname{dist}(q, p_i) \le \operatorname{dist}(q, p_j) \}.
$$

An intersection of half-planes is convex, so every cell is convex. This is the first structural fact, and it is what makes the diagram a planar subdivision of polygons rather than an arbitrary partition.

The second fact is that most of the half-planes are redundant. A site contributes an edge to the cell of $p_i$ only if it is a **Delaunay neighbor**: there is an empty circle through the two sites. The number of such neighbors is constant on average and at most $n - 1$ in the worst case, but the total number of edges over all cells is only $O(n)$. The diagram is sparse even though each cell is defined by $n - 1$ inequalities.

The third fact is the duality. A vertex where three cells meet is the center of a circle through the three corresponding sites that contains no site inside. The three sites form a triangle in the Delaunay triangulation. The whole diagram is the dual of that triangulation: cells become vertices, edges become edges, and vertices become triangles. Construction algorithms usually build the triangulation and read the diagram from it, or build both at once.

For a **single query**, none of this structure is needed. The definition already gives an $O(n)$ algorithm, and the lower bound for finding the minimum of $n$ unrelated distances is $\Omega(n)$. The diagram is a preprocessing investment for many queries, not a requirement for one.

## Visual intuition

Take five sites: the four corners of a square and its center,

$$
p_1 = (0,0), \quad p_2 = (4,0), \quad p_3 = (4,4), \quad p_4 = (0,4), \quad p_5 = (2,2).
$$

The four corner cells are triangles, and the center cell is a diamond. The diamond touches the midpoint of each side of the square, because the center is equidistant from each pair of adjacent corners.

```
p4 (0,4) +-----------+ p3 (4,4)
         | \       / |
         |   \   /   |
         |     p5    |
         |   /   \   |
         | /       \ |
p1 (0,0) +-----------+ p2 (4,0)
```

The boundaries are the perpendicular bisectors. The bisector of $p_1$ and $p_5$ is the line $x + y = 2$, which runs from $(2,0)$ to $(0,2)$. The bisector of $p_2$ and $p_5$ is $y = x - 2$, from $(2,0)$ to $(4,2)$. The bisector of $p_3$ and $p_5$ is $x + y = 6$, from $(4,2)$ to $(2,4)$. The bisector of $p_4$ and $p_5$ is $y = x + 2$, from $(0,2)$ to $(2,4)$. The four bisectors meet pairwise at the four vertices of the diamond.

The Delaunay dual joins the sites whose cells share an edge. It is the square's boundary plus the four spokes from the center to the corners:

```
p4 +-----------+ p3
   | \       / |
   |   \   /   |
   |     p5    |
   |   /   \   |
   | /       \ |
p1 +-----------+ p2
```

Each triangle of the dual corresponds to one vertex of the diagram. For example, the triangle $p_1 p_2 p_5$ has circumcenter $(2,0)$, which is the bottom vertex of the diamond. The circumcircle of that triangle has radius $2$ and passes through $p_1$, $p_2$ and $p_5$ with no site inside, which is exactly the empty-circle condition.

The picture is misleading in one place. The cells are **closed**, so they overlap on their boundaries. A point on the segment from $(2,0)$ to $(0,2)$ is at equal distance from $p_1$ and $p_5$, and it belongs to both closed cells. The tie rule, smallest index, assigns it to $p_1$. The diagram as a partition is therefore a partition up to boundaries, and the tie rule is what makes the answer unique.

The second misleading case is cocircularity. If four sites lie on one circle and no other site is closer to its center, the diagram has a vertex of degree four, and the Delaunay dual is not a unique triangulation: either diagonal of the four sites can be chosen. The diagram itself is still well defined, but its counts and its dual need the general-position assumption or an explicit tie-breaking rule.

## Formal model

Let $P = \{p_1, p_2, \ldots, p_n\}$ be a set of distinct sites in the plane, with $p_i = (x_i, y_i)$.

::: math definition Definition
For a site $p_i$, the **Voronoi cell** is

$$
V_i = \{ q \in \mathbb{R}^{2} : \operatorname{dist}(q, p_i) \le \operatorname{dist}(q, p_j) \text{ for every } j \ne i \}.
$$

The **Voronoi diagram** is the collection of all cells $V_1, \ldots, V_n$ together with their boundaries. The **bisector** of $p_i$ and $p_j$ is the line of points equidistant from both sites.
:::

::: math definition Definition
For $i \ne j$, the **dominance half-plane** of $p_i$ over $p_j$ is

$$
H_{ij} = \{ q : 2 q \cdot (p_j - p_i) \le \lVert p_j \rVert^{2} - \lVert p_i \rVert^{2} \}.
$$

The inequality is the squared-distance comparison $\operatorname{dist}^{2}(q, p_i) \le \operatorname{dist}^{2}(q, p_j)$ after cancellation.
:::

::: math definition Definition
The **Delaunay graph** has one vertex per site, and it joins $p_i$ and $p_j$ exactly when the cells $V_i$ and $V_j$ share a boundary segment of positive length. When no three sites are collinear and no four are cocircular, the graph is a triangulation and is called the **Delaunay triangulation**.
:::

::: math lemma Lemma
For every $i$, $V_i = \bigcap_{j \ne i} H_{ij}$. Consequently every cell is convex, and the cells cover the plane.
:::

::: math proof Proof
The equality is a restatement of the definition: $q \in V_i$ exactly when $q \in H_{ij}$ for every $j \ne i$. Each $H_{ij}$ is a closed half-plane, so the intersection is convex. For coverage, fix $q$. The distances $\operatorname{dist}(q, p_1), \ldots, \operatorname{dist}(q, p_n)$ form a finite set of real numbers, so it has a minimum, and any site that attains the minimum satisfies the definition. $\square$
:::

::: math lemma Lemma
If no three sites are collinear, a cell $V_i$ is unbounded if and only if $p_i$ is a vertex of the convex hull of $P$.
:::

::: math proof Proof
If $p_i$ is a hull vertex, choose a supporting direction $u$ in the interior of its normal cone, so that $u \cdot p_i > u \cdot p_j$ for every $j \ne i$. For $q = t u$ with $t \to +\infty$, the squared distance to $p_i$ is $t^{2} - 2t(u \cdot p_i) + \lVert p_i \rVert^{2}$, and the linear term dominates: for large $t$, $p_i$ is strictly closer than every other site, so $V_i$ contains the whole ray.

Conversely, suppose $p_i$ is not a hull vertex. Then $p_i$ is in the convex hull of the other sites. Choose a direction $u$ that is not perpendicular to any difference $p_j - p_i$. Since $p_i$ is a convex combination of the others, some site has a strictly larger projection onto $u$, so $u \cdot p_j > u \cdot p_i$ for that $j$. For $q = t u$ with large $t$, the linear term makes $p_j$ strictly closer than $p_i$, so the ray in direction $u$ leaves $V_i$. The same argument applies in every direction, so $V_i$ is bounded. $\square$
:::

::: math lemma Lemma
In general position, sites $p_i$ and $p_j$ are joined in the Delaunay graph if and only if there is a closed disk that has $p_i$ and $p_j$ on its boundary and no site in its interior.
:::

::: math proof Proof
If the cells share a boundary segment, take a point $q$ in the relative interior of that segment. Then $q$ is equidistant from $p_i$ and $p_j$ and strictly closer to them than to every other site. The circle centered at $q$ through $p_i$ and $p_j$ has no site inside.

Conversely, suppose a disk through $p_i$ and $p_j$ has no site inside. Its center $q$ lies on the perpendicular bisector of $p_i p_j$ and satisfies $\operatorname{dist}(q, p_i) = \operatorname{dist}(q, p_j) \le \operatorname{dist}(q, p_k)$ for every other site. If $q$ is not a diagram vertex, it lies in the relative interior of a shared boundary segment, and the two cells share that segment. If $q$ is a diagram vertex, a third site lies on the boundary circle; perturb $q$ slightly along the bisector of $p_i$ and $p_j$ away from that third site. The perturbed center still has $p_i$ and $p_j$ as nearest sites, and the set of such centers is an interval, so the cells share a segment. $\square$
:::

::: math lemma Lemma
For $n \ge 3$ in general position, let $h$ be the number of sites on the convex hull. The Delaunay triangulation has

$$
3n - 3 - h \text{ edges} \quad \text{and} \quad 2n - 2 - h \text{ triangles},
$$

and the Voronoi diagram has the same number of edges and $2n - 2 - h$ vertices.
:::

::: math proof Proof
For the triangulation, Euler's formula on the sphere gives $n - E + (T + 1) = 2$, and counting edge incidences gives $3T = 2E - h$, because every interior edge is counted twice and every hull edge once. Solving the two equations gives $E = 3n - 3 - h$ and $T = 2n - 2 - h$. The diagram is the planar dual: each Delaunay triangle becomes a vertex, each Delaunay edge becomes an edge, and each site becomes a cell. The counts follow. $\square$
:::

The **lifting map** is the standard way to see the duality. Lift each site to the paraboloid,

$$
p_i^{+} = (x_i, y_i, x_i^{2} + y_i^{2}).
$$

A plane $z = 2ax + 2by + c$ cuts the paraboloid in a circle whose projection has center $(a,b)$ and squared radius $a^{2} + b^{2} + c$. A site is inside that circle exactly when its lifted point is below the plane. Therefore a triangle has an empty circumcircle exactly when its three lifted points form a face of the **lower convex hull** of the lifted points. The Delaunay triangulation is the projection of that lower hull, and the Voronoi diagram is its dual.

The tie rule is a separate convention. The closed cells overlap on their boundaries, so the diagram alone does not give one answer per query. The reference programs compare the pair $(\operatorname{dist}^{2}(q, p_i), i)$ lexicographically, which assigns every point to the lowest-indexed site among the nearest ones. This is the convention used throughout the article.

## Algorithm derivation

The direct query algorithm follows from the definition and needs no diagram. Process the sites in index order and maintain the best pair seen so far.

1. Initialize `best` to an impossible distance and `best_index` to $-1$.
2. For each site $i$, compute $d = (x_i - q_x)^{2} + (y_i - q_y)^{2}$.
3. Replace the best pair when `best_index < 0`, or when $d <$ `best`, or when $d =$ `best` and $i <$ `best_index`.
4. After the loop, output `best_index + 1`.

The invariant is that after processing the first $t$ sites, the stored pair is the lexicographic minimum of $(d_i, i)$ over those $t$ sites. The initialization is vacuous. The update compares the new pair with the stored pair in exactly the lexicographic order, so it preserves the invariant. At $t = n$ the stored pair is the global minimum. This is the algorithm that all six reference programs implement.

The full diagram needs a different derivation. There are four standard constructions.

- **Half-plane intersection per cell.** Compute $V_i$ as the intersection of the $n - 1$ half-planes $H_{ij}$. A convex polygon clip costs $O(n \log n)$ per cell, so the whole diagram costs $O(n^{2} \log n)$. This is the baseline, not the recommended method.
- **Divide and conquer.** Split the sites by $x$, build the diagram of each half, and merge the two diagrams along a monotone chain of bisectors. The merge is linear in the size of the two diagrams, so the recurrence is $T(n) = 2T(n/2) + O(n)$ and the total is $O(n \log n)$.
- **Fortune's sweep.** Sweep a horizontal line downward and maintain the **beach line**, the envelope of parabolas whose foci are the sites above the line. Site events insert a new arc, and circle events remove an arc and create a Voronoi vertex. A balanced event queue makes the sweep $O(n \log n)$.
- **Lifting and convex hull.** Lift the sites to the paraboloid, compute the lower convex hull in three dimensions, and project its faces. A three-dimensional hull costs $O(n \log n)$ with an efficient implementation, and the projection is the Delaunay triangulation; the diagram is its dual.

Once the diagram exists, a query is a **point location** problem. Draw a vertical line through every diagram vertex; the lines cut the plane into $O(n)$ slabs, and inside a slab the order of the cell boundaries does not change. A binary search over the slabs, followed by one comparison inside the slab, answers a query in $O(\log n)$ time with $O(n)$ space. A persistent sweep or a Kirkpatrick hierarchy gives the same bound with different constants.

The construction is the hard part, and it is the reason the reference programs do not attempt it. Fortune's algorithm needs a balanced event queue and careful handling of degenerate events. The divide-and-conquer merge needs a precise definition of the separating chain. The lifting method needs a robust three-dimensional hull. For one query, all of that machinery is wasted work; for many queries, it is the only way to beat the scan.

## Step-by-step execution

Use the five sites from the visual section and four queries.

| Site  | Coordinates |
| ----- | ----------- |
| $p_1$ | $(0,0)$     |
| $p_2$ | $(4,0)$     |
| $p_3$ | $(4,4)$     |
| $p_4$ | $(0,4)$     |
| $p_5$ | $(2,2)$     |

The squared distances for the four queries are:

| Query   | $p_1$ | $p_2$ | $p_3$ | $p_4$ | $p_5$ | Answer |
| ------- | ----- | ----- | ----- | ----- | ----- | ------ |
| $(1,1)$ | 2     | 10    | 18    | 10    | 2     | 1      |
| $(3,1)$ | 10    | 2     | 10    | 18    | 2     | 2      |
| $(2,3)$ | 13    | 17    | 5     | 5     | 1     | 5      |
| $(4,4)$ | 32    | 16    | 0     | 16    | 8     | 3      |

The first row is a tie between $p_1$ and $p_5$. The scan sees $p_1$ first and stores $(2, 1)$. When it reaches $p_5$ it finds the same distance, but the index $5$ is larger than $1$, so the stored pair does not change. The answer is $1$. The second row is a tie between $p_2$ and $p_5$; $p_2$ is scanned first and wins on the index.

Trace the third query, $(2,3)$, through the loop.

| Step | Site  | Squared distance | Stored pair after the step |
| ---- | ----- | ---------------- | -------------------------- |
| 1    | $p_1$ | 13               | $(13, 1)$                  |
| 2    | $p_2$ | 17               | $(13, 1)$                  |
| 3    | $p_3$ | 5                | $(5, 3)$                   |
| 4    | $p_4$ | 5                | $(5, 3)$                   |
| 5    | $p_5$ | 1                | $(1, 5)$                   |

The fourth row shows the tie update in its negative form: the distance $5$ equals the stored distance, but $4$ is greater than $3$, so the pair stays at site $3$. The fifth row improves the distance and replaces the pair. The output is $5$.

The diagram for the same sites has four vertices, at $(2,0)$, $(4,2)$, $(2,4)$ and $(0,2)$, and eight edges. The cell of $p_1$ is the triangle with vertices $(0,0)$, $(2,0)$ and $(0,2)$. The cell of $p_5$ is the diamond with the four vertices just listed. The four Delaunay triangles are $p_1 p_2 p_5$, $p_2 p_3 p_5$, $p_3 p_4 p_5$ and $p_4 p_1 p_5$. The counts agree with the lemma: $n = 5$ and $h = 4$, so the triangulation has $3 \ast 5 - 3 - 4 = 8$ edges and $2 \ast 5 - 2 - 4 = 4$ triangles, and the diagram has $8$ edges and $4$ vertices.

## Correctness proof

::: math theorem Theorem
For a query $q$, the direct scan returns the smallest index among the sites that minimize the squared distance to $q$.
:::

::: math proof Proof
Let $d_i = \operatorname{dist}^{2}(q, p_i)$, and order the pairs $(d_i, i)$ lexicographically. The loop examines the sites in increasing index order and keeps the minimum pair of the prefix. The invariant is proved by induction on the number of examined sites. The base case, no sites examined, is handled by the sentinel `best_index = -1`. In the induction step, the new pair is either smaller than the stored pair, in which case it replaces it, or it is not, in which case the stored pair is still the minimum of the larger prefix. At the end the stored pair is the minimum over all sites. The first component of the minimum is the minimum squared distance, and the second component is the smallest index among the minimizers. $\square$
:::

::: math theorem Theorem
The cells $V_i$ partition the plane up to their boundaries, and each cell is a convex polygon.
:::

::: math proof Proof
Coverage and the half-plane representation are Lemma 1. A cell is an intersection of finitely many closed half-planes, so it is a convex polygon, possibly unbounded. Two cells can overlap only where the two squared distances are equal, which is a line, and the overlap is contained in that line. Removing the boundaries leaves disjoint interiors. $\square$
:::

::: math theorem Theorem
In general position, the Delaunay graph is a triangulation of the sites, its triangles correspond one-to-one to the vertices of the Voronoi diagram, and its edges correspond one-to-one to the edges of the diagram.
:::

::: math proof Proof
Every diagram vertex is equidistant from at least three sites, and the empty-circle lemma says that those sites form a Delaunay face. Conversely, every Delaunay triangle has an empty circumcircle, and its circumcenter is equidistant from the three sites and no farther from them than from any other site, so it is a diagram vertex. The correspondence between edges is the empty-circle lemma applied to a boundary segment. The dual preserves incidences, so it is a planar graph drawn on the sites. In general position every diagram vertex has degree three, so every Delaunay face is a triangle, and the graph is a triangulation. $\square$
:::

::: math theorem Theorem
The Delaunay edges are exactly the edges of the lower convex hull of the lifted points, projected to the plane.
:::

::: math proof Proof
A plane through three lifted points corresponds to the circle through the three sites. Every other lifted point lies above the plane exactly when the corresponding site lies outside the circle, so the three lifted points form a lower face exactly when the circle is empty. The projection of the lower hull therefore has exactly the Delaunay triangles. $\square$
:::

The tie convention completes the correctness statement. The closed cells assign a boundary point to several sites, but the lexicographic pair assigns it to exactly one, the lowest index among the nearest sites. The scan computes that pair directly, so it agrees with the diagram-and-tie-rule answer on every input, including the degenerate ones.

## Complexity analysis

| Method                           | Preprocessing     | Per query                 | Space        |
| -------------------------------- | ----------------- | ------------------------- | ------------ |
| Direct scan                      | None              | $O(n)$                    | $O(1)$ extra |
| Half-plane intersection per cell | $O(n^{2} \log n)$ | $O(\log n)$ with location | $O(n)$       |
| Divide and conquer               | $O(n \log n)$     | $O(\log n)$ with location | $O(n)$       |
| Fortune's sweep                  | $O(n \log n)$     | $O(\log n)$ with location | $O(n)$       |
| Lifting and 3D hull              | $O(n \log n)$     | $O(\log n)$ with location | $O(n)$       |

The diagram itself has linear size. The lemma above gives $2n - 2 - h$ vertices and $3n - 3 - h$ edges in general position, and both are $O(n)$. The construction algorithms are all output-sensitive in the same way: they spend $O(n \log n)$ time to produce an $O(n)$-sized structure.

The arithmetic is the other bound worth naming. With coordinates of magnitude $C$, a difference is at most $2C$ in magnitude, a square is at most $4C^{2}$, and the sum of two squares is at most $8C^{2}$. The assumptions cap $C$ at $10^{6}$, so the largest squared distance is $8 \ast 10^{12}$, which is far below $2^{53}$ and therefore exact in a JavaScript `Number` and in a signed 64-bit integer. With $C = 10^{9}$ the bound becomes $8 \ast 10^{18}$, which still fits a signed 64-bit integer but no longer fits a JavaScript `Number`; a JavaScript solution for that range needs `BigInt` or a different representation.

The scan uses $O(1)$ extra space beyond the site array. The diagram uses $O(n)$ space for its vertices, edges and cells, plus the point-location structure, which is also $O(n)$ for the slab decomposition. The output is one index per query, so the output size is $O(q)$ and is not part of the preprocessing bound.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One query, or $n q$ small | The direct scan |
| Many queries on a static set | The Voronoi diagram with point location |
| Many queries, but a diagram is too much code | A K-D tree, average $O(\log n)$ per query |
| The sites change between queries | A dynamic structure, or rebuild the diagram |
| The farthest site is wanted | The farthest-point Voronoi diagram |
| The $k$ nearest sites are wanted | An order-$k$ diagram, or a K-D tree with a heap |
| The metric is Manhattan | The $L_1$ Voronoi diagram, whose edges are not perpendicular bisectors |
| The metric is graph distance | Multi-source Dijkstra, which is the graph Voronoi diagram |
| The sites are all on a line | Sort the sites and binary search the two neighbors |
| The largest empty circle is wanted | Check the diagram vertices and the hull intersections |
| The Delaunay triangulation is wanted | Lifting and a 3D hull, or divide and conquer |
| Only the closest pair is wanted | The divide-and-conquer closest-pair algorithm |

The distinction between this article and [closest pair](/algorithms/geometry/closest-pair) is worth stating plainly. Closest pair answers one question about the whole set and has a deterministic $O(n \log n)$ solution. The Voronoi diagram answers many independent nearest-site questions and has an $O(n \log n)$ construction plus a point-location structure. If the question is singular, closest pair is simpler. If the queries are many, the diagram is the right preprocessing.

The distinction between this article and [K-D trees](/algorithms/geometry/kd-trees) is a trade of guarantees for simplicity. A K-D tree is shorter, uses $O(n)$ memory, and answers a query in average $O(\log n)$ time, but it has no worst-case guarantee and it does not expose the cells. The diagram has a worst-case $O(\log n)$ query after construction, but the construction is much harder. In a contest, the K-D tree is often the pragmatic choice when the site set is static and the queries are independent.

## Reference implementations

| Language   | File                    | Notes                                           |
| ---------- | ----------------------- | ----------------------------------------------- |
| C          | `c/program.c`           | Arrays of `long long`, one scan per query       |
| C++17      | `cpp17/program.cpp`     | `std::vector` and `std::cin`                    |
| Java       | `java/Main.java`        | `long` coordinates, a buffered token scanner    |
| Python     | `python/program.py`     | A list of tuples and a linear scan              |
| Pascal     | `pascal/program.pas`    | `Int64`, one argument per `Read`, no `IOResult` |
| JavaScript | `javascript/program.js` | `Number` coordinates, exact below $2^{53}$      |

All six programs share the same contract and the same algorithmic decision.

- Read $n$ and $q$, then the $n$ sites, then the $q$ queries.
- For each query, scan every site and compute the squared distance.
- Keep the pair (squared distance, index) and replace it only when the new pair is smaller lexicographically.
- Print the 1-based index of the winning site.

The programs answer the defining query directly and **do not build the full diagram**. That is deliberate. The full diagram needs a sweep or a divide-and-conquer merge, and its code is much longer than the scan; for the single-query contract of this article, the scan is both simpler and asymptotically optimal. The article's construction sections are the map for the many-query version, and the reference programs are the smallest correct answer to the question the fixture asks.

The C++ version is the shortest starting point for a contest. The Python version is the easiest to read, but at $n = 10^{5}$ and $q = 10^{5}$ it is too slow for the $10^{10}$-operation worst case; that is the point where the diagram or a K-D tree becomes necessary. The Pascal version is written for the pas2js runner: it reads one integer per `Read`, uses `Int64` for coordinates and distances, and never touches `IOResult`. The JavaScript version relies on the coordinate bound in the assumptions; with larger coordinates, the squared distance leaves the exact integer range of `Number`.

## Recursion decision

The direct query is iterative, and it should stay that way. The loop has one level, no call stack, and no state beyond the best pair. Recursion would add overhead and depth for no benefit.

The construction algorithms are a different matter. The divide-and-conquer diagram has depth $O(\log n)$ because it splits the sites by $x$ at the median. The lifting method recurses on the 3D hull, also with depth $O(\log n)$ in a balanced implementation. Fortune's sweep is iterative, but it needs an event queue and a balanced beach-line structure; the recursion is replaced by pointers and events.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^{5}$ frames on an 8 MB stack | The balanced divide-and-conquer depth is safe |
| Java | About $10^{4}$ frames | The balanced depth is safe |
| Python | The interpreter limit of 1000 | The balanced depth is about 17 at $n = 10^{5}$, so it is safe |
| Pascal | The operating system stack | The balanced depth is safe |
| JavaScript | About $10^{4}$ frames | The balanced depth is safe |

The six reference programs contain no recursion at all. If a reader extends one of them into a full construction, the first thing to check is the depth of the divide-and-conquer merge, not the depth of the query.

## Implementation walkthrough

The lines that decide whether the query is right.

1. **Read the sizes first.** Read $n$ and $q$ before allocating anything. If the input is empty, return without printing; a program that prints a stray line fails the fixture comparison.
2. **Use a signed 64-bit type for the coordinates and the distances.** A 32-bit `int` overflows when a difference of $10^{5}$ is squared. In C and C++ use `long long`; in Java use `long`; in Pascal use `Int64`; in Python the integers are unbounded; in JavaScript use `Number` only under the stated coordinate bound.
3. **Square, do not take a square root.** The comparison only needs the order of the distances, and the square root is monotone. Keeping the squared distance avoids floating-point rounding and keeps the tie test exact.
4. **Initialize with a sentinel.** Set `best_index = -1` and treat that as "no site seen". Initializing `best` to zero makes the first site lose to a distance of zero only by accident and is a common source of wrong answers.
5. **Compare the pair, not just the distance.** The update is `best_index < 0 || d < best || (d == best && i < best_index)`. The last clause is the tie rule, and it makes the answer independent of the order in which the sites are scanned. A strict `<` alone keeps the first tied site, which is the lowest index only when the loop runs in index order.
6. **Print the 1-based index.** The stored index is zero-based, so add one at the output. This is the most common off-by-one in the whole technique.
7. **Break cleanly on a short query list.** If the input ends before $q$ queries, stop rather than reading uninitialized values. The fixtures always provide the full list, but a robust program should not print a garbage line.

The core of the C++ version is six lines.

```cpp
long long best = 0;
int best_index = -1;
for (int i = 0; i < n; i++) {
    long long dx = x[i] - qx;
    long long dy = y[i] - qy;
    long long d = dx * dx + dy * dy;
    if (best_index < 0 || d < best || (d == best && i < best_index)) {
        best = d;
        best_index = i;
    }
}
```

A useful debugging exercise is to draw the five-site example, mark the cell of every site, and check that each query's answer is the cell that contains it. If a query on a boundary gets the wrong index, the tie clause is missing. If a query far outside the square gets the wrong answer, the loop bound or the initialization is wrong.

The Pascal version deserves one extra note. It reads one integer per `Read` call, because the pas2js console shim does not implement the multi-argument form reliably. It uses `Int64` for the coordinates and for the squared distance, and it avoids `IOResult`, which the browser build does not provide. Those three choices are what keep the listing compilable in the site's runner.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `<=` for the update | A tie goes to the later, higher index | Add the index comparison, or scan in index order with `<` |
| Relying on the scan order for ties | Reordering the sites changes the answer | Compare the index explicitly |
| Taking a square root | Rounding changes the order of nearly equal distances | Compare squared distances |
| Using 32-bit integers | The square of a large difference overflows and changes the sign | Use 64-bit integers |
| Using `Number` beyond $2^{53}$ | The squared distance is rounded and the comparison is wrong | Stay under the bound or use `BigInt` |
| Initializing the best distance to zero | The first site never replaces it | Use a sentinel index or infinity |
| Printing the zero-based index | Every answer is off by one | Add one at the output |
| Treating the cells as disjoint interiors | A boundary point is assigned to the wrong site | Apply the tie rule explicitly |
| Assuming every cell is bounded | Hull sites have unbounded cells | Check the convex hull first |
| Building the diagram for one query | The construction dominates the running time | Use the scan |
| Using the Euclidean diagram for Manhattan distance | The bisectors are not perpendicular lines | Use the $L_1$ diagram or a grid BFS |

### Why this fails: the tie that goes to the later index

The smallest counterexample has two sites and one query. Put the sites in the input order

$$
p_1 = (0,0), \quad p_2 = (2,0), \quad q = (1,0).
$$

Both squared distances are $1$, and the correct answer is site $1$, because the tie rule chooses the lower index. A program that updates on a non-strict improvement, `d <= best`, stores site $1$ at distance $1$ and then replaces it with site $2$ when the equal distance appears. The program prints $2$, and the judge expects $1$.

The reverse mistake is subtler. A strict `<` update keeps the first site seen, so it is correct **only while the loop runs in index order**. If the sites are stored in a different order, for example sorted by $x$ for another part of the algorithm, and the loop follows that order, the first tied site can be the higher index. The pair comparison `(d, i) < (best, best_index)` makes the tie rule independent of the iteration order and is the safest way to state it.

The failure appears whenever a query lies on a bisector, which happens for every symmetric input, every query placed at a midpoint, and every site set with duplicate distances. The fix has two parts: the update must compare the index when the distances are equal, and the comparison must be written so that the first site cannot win by default when its index is larger. The pair comparison does both at once.

A second failure lives in the arithmetic. Suppose the coordinates reach $10^{5}$ and the program uses a 32-bit `int`. The difference between two coordinates can be $2 \ast 10^{5}$, and its square is $4 \ast 10^{10}$, which is far beyond the signed 32-bit range of about $2.1 \ast 10^{9}$. The multiplication overflows, the sign can flip, and a site that is far away can look closer than the true answer. The smallest symptom is a negative squared distance in a debug print. The fix is to widen before the subtraction: store the coordinates as `long long`, or write `long long dx = (long long)x[i] - qx;` rather than casting the product.

A third failure is conceptual rather than arithmetic. The closed cells overlap on their boundaries, so a point on a bisector belongs to two cells. A program that builds the diagram and assigns the query to the first cell whose polygon contains it can return either site, depending on the order in which the cells are tested. The diagram is a partition only after the tie rule is applied. The direct scan applies the rule by construction, which is another reason it is the simplest correct answer for one query.

## Variants and extensions

- **The farthest-point Voronoi diagram.** The cell of a site is the set of points for which that site is the farthest. Only the sites on the convex hull have nonempty cells, and the diagram answers the smallest enclosing circle and the farthest-site query.
- **The order-$k$ Voronoi diagram.** Each cell is the set of points for which a given subset of $k$ sites are the $k$ nearest. The complexity grows with $k$, and the diagram is used for $k$-nearest-neighbor queries.
- **The power diagram.** The distance is replaced by a weighted power distance, and the bisectors become radical axes. The dual is the regular triangulation, and the same divide-and-conquer and lifting ideas apply.
- **The Manhattan Voronoi diagram.** The bisectors are broken lines in the horizontal, vertical, and two diagonal directions. The diagram is not the perpendicular-bisector diagram, and a grid BFS is often simpler than a geometric construction.
- **The graph Voronoi diagram.** The sites are vertices of a weighted graph, and the distance is the shortest-path distance. Multi-source Dijkstra computes the nearest source of every vertex, and each edge is split at the point where the two endpoint sources meet.
- **The Delaunay triangulation.** The dual is a triangulation with empty circumcircles, and it is the structure to build when the application needs triangles, not cells. The lifting map and the divide-and-conquer merge are the standard constructions.
- **The largest empty circle.** The center of the largest empty circle inside the convex hull is either a Voronoi vertex or an intersection of a Voronoi edge with the hull boundary. Checking those $O(n)$ candidates gives the answer after the diagram is built.
- **Dynamic sites.** Insertions and deletions invalidate the static diagram. A K-D tree with rebuilding, or a dynamic Delaunay triangulation, is the usual alternative.
- **Point location.** A slab decomposition, a persistent sweep, or a Kirkpatrick hierarchy turns the diagram into an $O(\log n)$ query structure. The choice matters more than the asymptotic bound, because the constants of a slab decomposition are small and its code is short.
- **Centroidal Voronoi tessellation.** Lloyd's algorithm moves each site to the centroid of its cell and rebuilds. This is an application of the diagram, not a contest technique, but it explains why the cells are useful beyond nearest-site queries.

## Contest strategy

1. **Count the work before choosing the technique.** If $n q$ is at most a few times $10^{7}$, write the scan. If $n$ and $q$ are both $10^{5}$, the scan is too slow and the diagram or a K-D tree is needed.
2. **Read the tie rule from the statement.** "Lowest index", "any nearest site", and "the smallest distance only" are three different output requirements. The pair comparison is the safe default.
3. **Use integers for the geometry.** Squared distances are exact, and the tie test is exact. A square root or a floating-point comparison is a bug waiting for a symmetric input.
4. **Size the type for the coordinates.** With coordinates up to $10^{9}$, a squared distance reaches $8 \ast 10^{18}$; a signed 64-bit integer is enough, but a 32-bit one is not. In JavaScript, check the $2^{53}$ bound or use `BigInt`.
5. **Handle the degenerate inputs explicitly.** $n = 1$, $q = 0$, duplicate query points, a query equal to a site, all sites collinear, and four cocircular sites. The scan handles all of them; a diagram construction usually does not.
6. **Do not build the diagram unless the queries justify it.** A full Fortune sweep is a large amount of code and a large surface for bugs. The scan is the correct first version, and a K-D tree is the next step when the scan is too slow.
7. **Validate against brute force.** On random small sets, compare the diagram answer and the scan. A disagreement is either a tie rule or a boundary handling bug, and both are easier to find on ten sites than on $10^{5}$.
8. **Watch the metric.** The Euclidean diagram does not answer Manhattan or graph-distance queries. The grid and graph variants need their own algorithms.
9. **Keep the input and output fast.** The scan is linear with a small constant, but $10^{8}$ distance computations still need buffered I/O and a tight loop. In Java, use a custom scanner rather than `Scanner`.
10. **Test the boundary cases in the fixture.** A query exactly on a bisector, a query exactly on a site, and a repeated query are the three cases that catch most wrong answers.

## Worked problems

### Problem 1: the region of a query in a Voronoi diagram

**Restatement.** Given $n \le 2000$ sites and $q \le 250000$ query points, decide for each query whether it lies in one region, on the boundary between exactly two regions, or at a point shared by three or more regions. Output `REGION X`, `LINE X Y` with $X < Y$, or `POINT`. The statement also lists `NONE`, but the closed regions cover the plane, so it never applies.

**Naive baseline.** For each query, scan all sites and collect the minimum distance and the sites that attain it. That is $O(nq)$, which is $5 \ast 10^{8}$ distance computations at the limits. The time limit is generous, and the small $n$ is the signal that this is the intended solution.

**Insight.** The dimension of the diagram at the query is exactly the number of sites that attain the minimum distance. One site means the interior of a cell, two sites mean a shared edge, and three or more mean a vertex. The diagram itself is never built.

**Derivation.** Scan the sites once, keeping the best distance, the number of minimizers, and the two smallest indices among them. Because the scan is in index order, the first two minimizers are the two lowest indices. At the end, emit `REGION`, `LINE`, or `POINT` according to the count.

**Correctness.** A point is in the closed cell of every site that attains the minimum distance, and in no other cell. If exactly one site attains it, the point is in the interior of that cell. If exactly two attain it, the point is on their shared bisector and on no other cell boundary. If three or more attain it, the point is a diagram vertex. The count therefore classifies the point exactly.

**Complexity.** $O(n)$ time and $O(1)$ extra space per query, for $O(nq)$ total. At $n = 2000$ and $q = 250000$, the product is $5 \ast 10^{8}$, which fits the 10-second limit in C++ with fast I/O.

**Common wrong approach.** Building the full diagram and locating every query. The construction is unnecessary, and the point-location code has to handle the same degeneracies that the scan handles for free.

### Problem 2: the graph Voronoi diagram

**Restatement.** A connected weighted graph has $N$ vertices and $M$ edges, and a subset of $K$ vertices are sources. For each source, output the total length of the edges that are closer to it than to every other source, with ties going to the smaller vertex number. The graph has up to $250000$ vertices and edges, and the answer is printed with one digit after the decimal point.

**Naive baseline.** Run Dijkstra from every source, which costs $O(K (N + M) \log N)$ and is far too slow when $K$ is large.

**Insight.** The graph version of the diagram is a multi-source shortest-path problem. One Dijkstra run with all sources in the priority queue labels every vertex with its nearest source. The label comparison includes the source index, so a tie goes to the smaller source. The boundary between two sources can fall inside an edge.

**Derivation.** Push every source with distance zero and its own index. Relax edges in the usual way, and on equal distance prefer the smaller source index. After the run, each vertex has a source. For an edge $(u,v,w)$ with labels $s_u$ and $s_v$ and distances $d_u$ and $d_v$, if $s_u = s_v$ the whole edge belongs to that source. If $d_u + w \le d_v$, the whole edge is closer to $s_u$; if $d_v + w \le d_u$, it is closer to $s_v$. Otherwise the boundary point is at distance $(w + d_v - d_u)/2$ from $u$. Add that length to $s_u$ and the rest to $s_v$. Doubling every length keeps the arithmetic integral: the doubled boundary distance is $w + d_v - d_u$, and the total is printed as `total / 2` with `.0` or `.5`.

**Correctness.** Dijkstra's invariant gives every vertex the minimum distance to any source, and the tie rule gives the smallest source among the minimizers. Along an edge, the difference between the distances to the two endpoint sources is linear in the position, so the set of points closer to one source is a prefix or a suffix of the edge, and the split point is the unique solution of the linear equation. Summing the prefixes and suffixes over all edges gives exactly the total length attributed to each source.

**Complexity.** $O((N + M) \log N)$ time for the Dijkstra run, $O(N + M)$ space, and $O(M)$ time for the edge split. The doubled lengths fit in a signed 64-bit integer because the longest path is at most $2.5 \ast 10^{14}$.

**Common wrong approach.** Assigning each whole edge to the endpoint with the smaller distance. When the boundary falls inside the edge, that assignment gives one source both halves and the other source nothing, and the printed totals are wrong.

### Problem 3: the nearest excluded point on a grid

**Restatement.** Given $n$ distinct integer points, find for each point the nearest integer point that is not in the set, under Manhattan distance. Any nearest point is accepted. The coordinates are at most $2 \ast 10^{5}$ and $n$ is at most $2 \ast 10^{5}$.

**Naive baseline.** For each point, expand a diamond of radius $1, 2, 3, \ldots$ until an empty point is found. The radius can be large, and the total work is quadratic in the worst case.

**Insight.** The grid version of the diagram is a multi-source BFS on the **sites**, not on all grid cells. A site that has an empty neighbor is a boundary site, and its answer is that neighbor. Every other site has all four neighbors in the set, and its answer is the answer of a neighbor, one step farther away. The BFS propagates the boundary answers inward.

**Derivation.** Put the sites in a hash set. For each site, inspect its four neighbors. If a neighbor is missing, record it as the answer for that site and enqueue the site with distance $1$. Then run a BFS over the sites: when a site is dequeued, inspect its four neighbors; if a neighbor is a site without an answer, give it the same missing point and enqueue it. The first time a site is reached is the shortest path to a boundary site, so its recorded missing point is nearest. The missing point itself is always adjacent to the boundary site, not to the interior site.

**Correctness.** For a boundary site, an empty neighbor is at distance $1$, which is the minimum possible. For an interior site, every neighbor is a site, and the nearest empty point is reached by stepping to a neighbor and then following that neighbor's best path. The BFS explores the site graph in nondecreasing distance from the boundary, so the first answer assigned to a site is optimal. The Manhattan distance from the site to the recorded empty point is the number of BFS steps plus one, and the BFS order minimizes it.

**Complexity.** $O(n)$ expected time with a hash set, because each site is enqueued once and each of its four neighbors is inspected a constant number of times. The space is $O(n)$ for the set and the answer table. A balanced tree gives $O(n \log n)$ deterministic time.

**Common wrong approach.** Flooding every empty grid cell from the boundary. A ring of sites can enclose a large empty region, and the flood visits cells that are not adjacent to any site; the number of such cells is not bounded by $n$.

## Practice progression

1. **Recognition.** Given a statement with sites and queries, decide whether the question is nearest site, farthest site, closest pair, or a range query. Write down the tie rule before writing any code.
2. **Direct application.** Implement the scan and test it on the five-site example. Check the two ties by hand and confirm that the lower index wins.
3. **Degenerate inputs.** Add tests for $n = 1$, $q = 0$, a query equal to a site, duplicate query points, and all sites collinear. The scan should pass all of them without a special case.
4. **Diagram structure.** Draw the five-site diagram on paper, list the cell of each site, and verify the counts $4$ vertices and $8$ edges. Then add a sixth site and redraw.
5. **Delaunay dual.** Build the Delaunay triangulation of ten points by hand or with a small incremental program, and check the empty-circle condition for every triangle. Compare its edge count with $3n - 3 - h$.
6. **Construction.** Implement one full construction, either Fortune's sweep or the divide-and-conquer merge, and compare its cells with the brute-force half-plane intersection on random small sets. This is the step where the diagram stops being a picture and becomes an algorithm.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of a Voronoi cell and the half-plane representation of a cell. (Formal model)
2. Why is every cell convex, and why can a cell be unbounded? (Formal model)
3. What is the empty-circle condition, and why is it equivalent to a Delaunay edge? (Formal model)
4. How many vertices and edges does the diagram have in general position, and how does the count follow from Euler's formula? (Formal model)
5. What is the lifting map, and which face of the lifted hull corresponds to a Delaunay triangle? (Formal model)
6. Why does the direct scan use squared distances and a lexicographic pair? (Algorithm derivation)
7. Trace the four queries of the five-site example and explain each tie. (Step-by-step execution)
8. Why is the direct scan correct when the cells overlap on their boundaries? (Correctness proof)
9. Compare the direct scan, a K-D tree, and a full diagram for a static set with many queries. (Algorithm selection)
10. What is the smallest counterexample for a `<=` update that ignores the index, and why is the pair comparison independent of the scan order? (Common mistakes)

## Further reading

- The subject index places this technique beside the rest of [computational geometry](/algorithms/geometry/).
- The convex hull is the first structure in the same subject, and the hull vertices are exactly the sites with unbounded cells: [convex hull](/algorithms/geometry/convex-hull).
- The deterministic one-pair algorithm, which is the sibling of the nearest-site question, is [closest pair](/algorithms/geometry/closest-pair).
- The structure that answers nearest-site queries without a diagram is described in [K-D trees](/algorithms/geometry/kd-trees).
- The sweep that Fortune's algorithm generalizes is [sweep line](/algorithms/geometry/sweep-line).
- The exact orientation and incircle predicates that a robust construction needs are in [robust predicates](/algorithms/geometry/robust-predicates).
- The farthest-point version of the diagram is the natural tool for the [smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle).
- The one-dimensional nearest-site query is a binary search over sorted sites, described in [binary search](/algorithms/searching/binary-search).
- The sorting that a divide-and-conquer construction begins with is in [sorting](/algorithms/foundations/sorting), and the recurrence analysis is in [complexity](/algorithms/foundations/complexity).
- The graph version of the same idea is the multi-source shortest-path computation in [Dijkstra](/algorithms/graphs/dijkstra).
- The dynamic program whose lower envelope shares the word "hull" with the convex hull is the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The vectors, determinants and signed areas that the bisector algebra uses are introduced in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
