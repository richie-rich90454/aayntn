---
id: geometry.integer-geometry
title: Integer geometry
summary: Keep a lattice polygon's area, boundary count and interior count exact with the shoelace sum, a gcd on every edge and Pick's theorem.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: common-contest-technique
keywords:
    [lattice polygon, shoelace formula, pick's theorem, boundary lattice points, gcd, exact area]
prerequisites:
    required: [number-theory.extended-euclidean, foundations.complexity]
    recommended: [geometry.convex-hull, geometry.point-in-polygon]
complexity:
    time: "O(n log C)"
    space: "O(n)"
assumptions:
    - The vertices are lattice points given in order around a simple polygon.
    - Consecutive vertices are distinct, so every edge has a nonzero direction vector.
    - With coordinates at most $10^4$ in absolute value and $n \le 10^5$, twice the area stays below $2^{53}$, which keeps the JavaScript and Pascal variants exact.
    - The polygon is simple, because a self-intersecting boundary has no well-defined interior for Pick's theorem.
implementations: geometry.integer-geometry
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/geometry.integer-geometry.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A polygon whose vertices are lattice points has three integer quantities that are easy to confuse and easy to compute: twice its area, the number of lattice points on its boundary, and the number of lattice points strictly inside it.

All three come from a walk over the edges. With vertices $(x_1, y_1), \ldots, (x_n, y_n)$ in order and $(x_{n+1}, y_{n+1}) = (x_1, y_1)$,

$$
2A = \left| \sum_{i=1}^{n} \bigl(x_i y_{i+1} - x_{i+1} y_i\bigr) \right|,
\qquad
B = \sum_{i=1}^{n} \gcd\bigl(|x_{i+1} - x_i|,\; |y_{i+1} - y_i|\bigr),
\qquad
I = \frac{2A - B + 2}{2}.
$$

The first is the **shoelace formula**. It is a sum of integer products, so it needs no square root and no floating point, and it produces twice the area, which is always an integer even when the area itself is a half-integer.

The second counts boundary lattice points one edge at a time. The segment from a lattice point to a lattice point with difference vector $(\Delta x, \Delta y)$ contains exactly $\gcd(|\Delta x|, |\Delta y|) + 1$ lattice points, endpoints included. Charging $\gcd$ to each edge counts the start of the edge but not its end, and the end is the start of the next edge, so every vertex is counted exactly once.

The third is **Pick's theorem**, rearranged: a lattice polygon with area $A$, $B$ boundary points and $I$ interior points satisfies $A = I + B/2 - 1$. Multiplying by two turns the statement into the integer identity $2A = 2I + B - 2$, which is why the interior count is computed from twice the area and needs only one exact division.

The whole technique is one pass over the vertices. The pass costs $O(n)$ multiplications and $n$ gcd computations, so $O(n \log C)$ time when $C$ bounds the coordinates, and no geometry library is involved.

## Problem motivation

A surveyor records a plot by walking its fence and writing down the grid coordinates of every corner. The county wants three numbers: the area of the plot, how many fence posts stand on the boundary, and how many grid posts fall inside the plot. The area must be exact because it is used for a tax assessment, and the counts must be exact because they are integers by definition.

The constraints make a direct count impossible.

- $3 \le n \le 10^5$ corners.
- Every coordinate is an integer with absolute value at most $10^4$.
- The plot is simple: the fence never crosses or touches itself except at the first and last corner.

The bounding box can hold $4 \ast 10^8$ grid points. Testing each one against the polygon costs more than the whole contest's time budget, and the answer is already determined by the boundary: once the area and the boundary count are known, the interior count follows from one linear relation.

That relation is the reason the problem is not three problems. The area is a sum over edges. The boundary count is a sum over edges. Pick's theorem ties them to the interior count without looking at a single interior point. The three quantities are three views of the same boundary.

The same computation answers questions that do not look like geometry at all: the number of visible lattice points from the origin inside a triangle, the number of unit squares a diagonal crosses, and the number of tiles a robot covers while tracing a path on a grid. Each is a shoelace sum, a gcd sum, or both.

## Recognition patterns

Integer geometry is the right tool when the statement contains some of these phrases.

- "Lattice points", "grid points", "integer coordinates", "unit squares".
- "The area of the polygon", "the exact area", "twice the area".
- "Points on the boundary", "points inside the polygon", "points strictly inside".
- "The vertices are given in order", "clockwise or counterclockwise", "a simple polygon".
- "The polygon does not intersect itself", "no self-intersections".

The constraint values that decide the technique:

| Situation | What it rules |
| --- | --- |
| All coordinates are integers | The shoelace sum is exact, and Pick's theorem applies |
| Coordinates are decimals or rationals with different denominators | Scale the plane first, or use floating point and lose exactness |
| The bounding box holds at most $10^6$ points | Enumerating the points and testing each one is affordable |
| The bounding box is large but the polygon has few edges | The edge walk is the only practical method |
| The polygon may self-intersect | The shoelace sum is still a signed sum, but Pick's theorem is false |
| The polygon has holes | Pick's theorem gains one term per hole |
| The question asks for a count modulo a prime | The divisions disappear, and the shoelace sum can be reduced at every step |
| The question asks for a real-valued area | The shoelace sum is still the right core, but the output needs a decimal format |

The phrase that rules the technique out is "the boundary may cross itself". A self-intersecting polygon has an interior that is not a single region, and the counts that Pick's theorem relates are not defined for it. The phrase that rules it in, quietly, is "the corners are on a grid": it says that every edge difference is an integer vector, so the gcd applies.

The word "area" alone is not enough. A polygon with arbitrary real vertices has an area, and the shoelace formula still computes it, but the gcd and Pick's theorem are gone. The lattice is the assumption that makes the counts exact.

## Naive approach

The baseline puts the polygon's bounding box on the grid and tests every grid point against every edge.

```cpp
long long countInside(const std::vector<Point>& poly, long long x, long long y) {
    bool inside = false;
    for (size_t i = 0, j = poly.size() - 1; i < poly.size(); j = i++) {
        const Point& a = poly[i];
        const Point& b = poly[j];
        if ((a.y > y) != (b.y > y) &&
            x < (double)(b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) {
            inside = !inside;
        }
    }
    return inside ? 1 : 0;
}
```

The test is a ray crossing test, and it is correct, but it is also the wrong tool here: it needs a division, it visits every grid point, and its cost is proportional to the area rather than to the number of edges. With a $10^4$ by $10^4$ box that is $10^8$ tests, each of which walks $n$ edges, which is hopeless.

A second baseline triangulates the polygon from its first vertex:

$$
A = \frac{1}{2} \sum_{i=2}^{n-1} \bigl| (p_i - p_1) \times (p_{i+1} - p_1) \bigr|.
$$

This is $O(n)$ and it computes the area, but it computes the area as a floating-point number unless the cross products are kept as integers, and it says nothing about the boundary or the interior. It is a good differential test for the shoelace sum and a poor solution to the whole problem.

A third baseline counts the boundary points by walking each edge one unit step at a time. That is $O(\sum |\Delta x| + |\Delta y|)$ work, which is $O(nC)$ rather than $O(n \log C)$, and at $C = 10^9$ it is unusable. The gcd replaces the walk with a logarithm.

## Key insight

The insight is that **the polygon is a closed walk, so every quantity that can be charged to an edge can be summed without looking at the interior**.

Three separate facts make that useful.

**The shoelace sum is exact.** Each term $x_i y_{i+1} - x_{i+1} y_i$ is an integer, and the sum is twice the signed area of the polygon. The signed area is positive for a counterclockwise boundary and negative for a clockwise one, and the absolute value removes the convention. No square root appears anywhere, so the result is exact even though the area itself may be a half-integer.

**The gcd counts the points on a segment.** If the difference vector is $(\Delta x, \Delta y)$ and $g = \gcd(|\Delta x|, |\Delta y|)$, then the lattice points on the segment are exactly

$$
(x, y) + \frac{k}{g}\,(\Delta x, \Delta y), \qquad k = 0, 1, \ldots, g,
$$

and there are $g + 1$ of them. The step vector $(\Delta x / g, \Delta y / g)$ is primitive: its two coordinates are coprime, so no smaller step can land on another lattice point. Charging $g$ to each edge therefore counts every boundary point once, not twice, because the endpoint of an edge is the starting point of the next one.

**Pick's theorem is a conservation law.** For a lattice polygon, $A = I + B/2 - 1$. Once two of the three quantities are known, the third is arithmetic. The theorem is not an approximation and it is not asymptotic: it is an identity, exact for every simple lattice polygon.

The interior count is not $2A - B + 2$ but half of it: the shoelace sum gives twice the area, and substituting into Pick's theorem leaves $2I = 2A - B + 2$. Keeping twice the area keeps the arithmetic integral, and Pick's theorem guarantees that the final division is exact.

## Visual intuition

Draw the grid, draw the polygon on it, and mark every lattice point that lies on an edge. The marked points divide the boundary into segments of equal step, one per unit of gcd. The boundary count is the number of marks, and the interior count is the number of unmarked grid points inside the curve.

Three pictures make the formulas believable.

**The unit triangle.** The triangle with vertices $(0,0)$, $(1,0)$, $(0,1)$ has area $1/2$, three boundary points and no interior points. Pick's theorem reads $1/2 = 0 + 3/2 - 1$, which is true. This triangle is the atom of the theory: every lattice polygon can be cut into primitive lattice triangles, and each primitive triangle has the same area and the same two counts as this one, so the cuts preserve the theorem.

**The shear.** Take any lattice triangle and apply a map $(x, y) \mapsto (x + ky, y)$ for an integer $k$. The map sends lattice points to lattice points, it is invertible over the integers, and it has determinant $1$, so it preserves every area. A triangle and its sheared image have the same area and the same number of lattice points in every region, so Pick's theorem cannot distinguish them. That is why the theorem can be proved by reducing a triangle to a right triangle: shears are free.

**The fence posts.** The boundary count is a count of posts, not of fence panels. On a segment from $(0,0)$ to $(6,4)$, the gcd is $2$, so the posts are at $(0,0)$, $(3,2)$ and $(6,4)$: three posts and two panels. Summing $2$ for that edge and $4$ for the next edge counts the shared corner exactly once, because the corner is the end of the first edge and the start of the second, and the convention charges only the start.

The polygon below is used throughout the next sections. It is a $5$ by $4$ rectangle with a $2$ by $3$ notch removed from its upper left, so its area is $20 - 6 = 14$.

```text
y
4      +--------+
       |        |
3      |        |
       |        |
2      |        |
       |        |
1  +---+        |
   |            |
0  +------------+
   0  1  2  3  4  5   x
```

Its vertices, counterclockwise from the lower left, are $(0,0)$, $(5,0)$, $(5,4)$, $(2,4)$, $(2,1)$, $(0,1)$. The lattice points on the boundary are the marks on the six edges; the interior points are the six grid points that lie strictly inside.

## Formal model

::: math definition Definition
A **lattice point** is a point whose two coordinates are integers. A **lattice polygon** is a simple polygon all of whose vertices are lattice points. A polygon is **simple** if its boundary is a closed curve that does not cross or touch itself except at the first and last vertex.
:::

::: math definition Definition
For a lattice polygon with vertices $p_1, \ldots, p_n$ in order, $p_{n+1} = p_1$, the **signed double area** is

$$
S = \sum_{i=1}^{n} \bigl(x_i y_{i+1} - x_{i+1} y_i\bigr),
$$

and the **area** is $A = |S| / 2$.
:::

::: math definition Definition
The **boundary count** $B$ is the number of lattice points on the boundary of the polygon, and the **interior count** $I$ is the number of lattice points strictly inside it.
:::

::: math lemma Lemma
For lattice points $p$ and $q$ with difference $(\Delta x, \Delta y)$ and $g = \gcd(|\Delta x|, |\Delta y|)$, the segment from $p$ to $q$ contains exactly $g + 1$ lattice points, including both endpoints.
:::

::: math proof Proof
Write $\Delta x = g u$ and $\Delta y = g v$, where $\gcd(u, v) = 1$. A point of the segment is $p + t(\Delta x, \Delta y)$ for some real $t$ in $[0, 1]$. It is a lattice point exactly when $t g u$ and $t g v$ are both integers. For $t = k/g$ with integer $k$, both are the integers $k u$ and $k v$. Conversely, if $t g u$ and $t g v$ are integers, Bézout's identity writes $1 = a u + b v$ for integers $a$ and $b$, so $t g = a(t g u) + b(t g v)$ is an integer as well. So the lattice points are exactly the $g + 1$ points with $k = 0, 1, \ldots, g$. $\square$
:::

::: math lemma Lemma
The shoelace sum $S$ equals twice the signed area of the polygon.
:::

::: math proof Proof
The signed area of the triangle with vertices $(0,0)$, $p_i$ and $p_{i+1}$ is $\frac{1}{2}(x_i y_{i+1} - x_{i+1} y_i)$. Summing these signed triangles over all edges is the standard proof of the shoelace formula: the triangles that fall outside the polygon cancel in pairs, and the ones inside it cover it exactly once. The sum is therefore twice the signed area, with the sign given by the orientation of the boundary. $\square$
:::

::: math definition Definition
For a lattice polygon $P$, define the **defect**

$$
F(P) = A - I - \frac{B}{2} + 1.
$$

Pick's theorem says that $F(P) = 0$ for every simple lattice polygon.
:::

::: math lemma Lemma
**(Additivity.)** Suppose a lattice polygon $P$ is cut into two lattice polygons $P_1$ and $P_2$ along a common lattice segment, and that segment contains $m$ lattice points including its endpoints. Then $F(P) = F(P_1) + F(P_2)$.
:::

::: math proof Proof
The areas add. Count the lattice points on the cut. The $m - 2$ interior points of the cut are on the boundary of both pieces and become interior points of $P$, so

$$
I(P) = I_1 + I_2 + (m - 2).
$$

The two endpoints of the cut are vertices of both pieces and remain on the boundary of $P$, while the $m - 2$ interior cut points are no longer boundary points, so

$$
B(P) = B_1 + B_2 - 2(m - 2) - 2.
$$

Substituting into $F(P)$ gives

$$
F(P) = A - I - \frac{B}{2} + 1
= A - I_1 - I_2 - (m - 2) - \frac{B_1 + B_2 - 2m + 2}{2} + 1
= F(P_1) + F(P_2).
$$

The terms in $m$ cancel. $\square$
:::

::: math lemma Lemma
A lattice triangle with no lattice point other than its three vertices has area $1/2$.
:::

::: math proof Proof
Translate one vertex to the origin and let the other two be the integer vectors $u$ and $v$. The area is $|\det(u, v)| / 2$. Apply unimodular integer column operations, which preserve both the lattice and the absolute determinant. They put the pair in the form $u' = (g, 0)$ and $v' = (a, b)$, where $g = \gcd(|u'_x|, |u'_y|)$ is the gcd of the coordinates of one vector. If $g > 1$, the point $(1, 0)$ lies on the edge from $(0,0)$ to $(g,0)$ and is not a vertex, so the triangle was not primitive. Hence $g = 1$. A shear $(x, y) \mapsto (x - ay, y)$ then sends $v'$ to $(0, b)$ without changing the lattice or the area. If $|b| > 1$, the point $(0, 1)$ lies on the edge from $(0,0)$ to $(0,b)$ and is not a vertex, again a contradiction. So $|b| = 1$ and the area is $1/2$. $\square$
:::

::: math theorem Theorem (Pick)
For every simple lattice polygon, $A = I + B/2 - 1$.
:::

::: math proof Proof
Start from any triangulation of $P$ into lattice triangles, which exists because a diagonal between two vertices splits the polygon and the process terminates. Refine each triangle of area greater than $1/2$ by cutting it at a lattice point that is not one of its vertices; the lemma above guarantees that such a point exists. Repeating the cut produces a triangulation of the polygon into lattice triangles, every one of which is primitive, that is, has area $1/2$ with no lattice points other than its three vertices. The process terminates because each cut strictly decreases the area of the piece being cut, and the area is always a positive multiple of $1/2$.

For a primitive triangle, $A = 1/2$, $I = 0$ and $B = 3$, so

$$
F = \frac{1}{2} - 0 - \frac{3}{2} + 1 = 0.
$$

By the additivity lemma, gluing the triangles back together adds their defects, so the defect of the whole polygon is the sum of zeros. Hence $F(P) = 0$, which is Pick's theorem. $\square$
:::

## Algorithm derivation

The algorithm is two accumulations and one subtraction.

Read $n$ and the $n$ vertices. For each index $i$, let $j$ be the next index, wrapping from $n - 1$ back to $0$. Add the signed product $x_i y_j - x_j y_i$ to a running total, and add the gcd of the two coordinate differences to a second running total. After the loop, take the absolute value of the first total, and compute the interior count from the second.

```cpp
long long twiceArea = 0;
long long boundary = 0;
for (int i = 0; i < n; ++i) {
    int j = (i + 1) % n;
    twiceArea += x[i] * y[j] - x[j] * y[i];
    boundary += std::gcd(std::llabs(x[j] - x[i]), std::llabs(y[j] - y[i]));
}

twiceArea = std::llabs(twiceArea);
long long interior = (twiceArea - boundary + 2) / 2;
```

Each line is the direct statement of one lemma. The first accumulates the shoelace terms; the absolute value is taken once, at the end, because taking it term by term would destroy the cancellation between the terms outside the polygon and the terms inside it. The second accumulates the gcd of each edge; it charges the start of the edge and not its end, so the vertex that closes the polygon is counted exactly once. The last line is Pick's theorem with the factor of two cleared.

The addition of $2$ is not cosmetic. Pick's theorem gives $2I = 2A - B + 2$, so that numerator is exactly twice the interior count and the single division is exact for every lattice polygon.

Two implementation choices follow from the problem, not from the mathematics.

The vertices can be read and processed streaming, so the algorithm needs $O(1)$ auxiliary space beyond the input. The reference programs store the vertices anyway, because the six-language contract is easier to keep identical when each program parses the whole input before it computes.

The coordinates can be negative. The shoelace sum handles that without a change, and the gcd needs the absolute value of each difference: a gcd is non-negative by definition, and the C and C++ standard library functions have undefined behavior on the most negative value of a signed type, so the safe call is on the absolute differences, which are bounded.

## Step-by-step execution

Take the notched rectangle from the visual section: $(0,0)$, $(5,0)$, $(5,4)$, $(2,4)$, $(2,1)$, $(0,1)$.

The table walks the six edges in order. The `cross` column is $x_i y_{i+1} - x_{i+1} y_i$; the `gcd` column is the boundary charge of that edge.

| Edge | From | To | $\Delta x, \Delta y$ | Cross | GCD | Boundary so far | Double area so far |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | $(0,0)$ | $(5,0)$ | $5, 0$ | $0 \ast 0 - 5 \ast 0 = 0$ | $5$ | $5$ | $0$ |
| 2 | $(5,0)$ | $(5,4)$ | $0, 4$ | $5 \ast 4 - 5 \ast 0 = 20$ | $4$ | $9$ | $20$ |
| 3 | $(5,4)$ | $(2,4)$ | $-3, 0$ | $5 \ast 4 - 2 \ast 4 = 12$ | $3$ | $12$ | $32$ |
| 4 | $(2,4)$ | $(2,1)$ | $0, -3$ | $2 \ast 1 - 2 \ast 4 = -6$ | $3$ | $15$ | $26$ |
| 5 | $(2,1)$ | $(0,1)$ | $-2, 0$ | $2 \ast 1 - 0 \ast 1 = 2$ | $2$ | $17$ | $28$ |
| 6 | $(0,1)$ | $(0,0)$ | $0, -1$ | $0 \ast 0 - 0 \ast 1 = 0$ | $1$ | $18$ | $28$ |

The double area is $28$, so the area is $14$, which agrees with the rectangle minus the notch. The boundary count is $18$. Pick's theorem gives

$$
I = \frac{28 - 18 + 2}{2} = \frac{12}{2} = 6.
$$

The six interior points can be checked by hand. Rows $y = 1$, $y = 2$ and $y = 3$ contain two interior points each, at $x = 3$ and $x = 4$, and the rows $y = 0$ and $y = 4$ are entirely on the boundary. Nothing else is inside, because the notch removes the columns $x \le 2$ above $y = 1$.

The table also shows why the gcd convention matters. The first edge has $5$ boundary points if its endpoints are counted, but the charge is $5$, not $6$: the point $(5,0)$ is charged again by the second edge. Summing $g + 1$ instead would count every vertex twice and inflate $B$ by $n$, which changes the interior count by $-n/2$.

## Correctness proof

::: math theorem Theorem
The program prints $2A$, $B$ and $I$ for the input lattice polygon.
:::

::: math proof Proof
Let the vertices be $p_1, \ldots, p_n$.

**Double area.** By the shoelace lemma, the running total after the loop is the signed double area $S$. The program prints $|S|$, which is $2A$ by the definition of the area. All terms are integers, so no rounding occurs.

**Boundary count.** By the segment lemma, edge $i$ contains $g_i + 1$ lattice points, where $g_i = \gcd(|\Delta x_i|, |\Delta y_i|)$. The program adds $g_i$. The $g_i$ points other than $p_i$ are exactly the lattice points of the edge that have not been counted by an earlier edge, because the edges of a simple polygon meet only at shared vertices, and each vertex is the start of exactly one edge. Hence the total is the number of distinct lattice points on the boundary.

**Interior count.** Pick's theorem gives $A = I + B/2 - 1$. Multiplying by two and rearranging, $2I = 2A - B + 2$. The program prints $(2A - B + 2)/2$, and the numerator is exactly $2I$ by the theorem, so the division is exact and the printed value is $I$. $\square$
:::

The proof depends on simplicity only in the boundary argument. For a self-intersecting polygon, the edges are not disjoint, so a lattice point where two edges meet without being a shared vertex is charged by both edges; the equality $B(P) = \sum g_i$ fails, and Pick's theorem does not apply. The shoelace total is still a signed sum of the winding numbers, but it is not the area of a well-defined interior.

The proof also exposes the one place where the coordinate bound enters. The algebra is exact over the integers. The machine arithmetic is exact only while the products and sums fit in the type, which the complexity section quantifies.

## Complexity analysis

| Stage                 | Time          | Space                        |
| --------------------- | ------------- | ---------------------------- |
| Reading the vertices  | $O(n)$        | $O(n)$ for the stored points |
| Shoelace accumulation | $O(n)$        | $O(1)$ extra                 |
| Boundary count        | $O(n \log C)$ | $O(1)$ extra                 |
| Pick's theorem        | $O(1)$        | $O(1)$                       |

The shoelace loop performs one multiplication and one subtraction per edge. The gcd dominates: each call costs $O(\log \min(|\Delta x|, |\Delta y|))$, which is $O(\log C)$ when $C$ bounds the coordinates, so the total is $O(n \log C)$. Replacing the gcd with a unit-step walk along each edge would cost $O(nC)$ and is the reason the gcd is not optional at large coordinates.

The space is $O(n)$ in the reference programs, which store the vertices so that the six language versions have the same shape. A streaming version reads one vertex, keeps the previous one, and closes the polygon at the end, which reduces the auxiliary space to $O(1)$.

The arithmetic width needs its own statement, because an exact formula is worthless if the intermediate values overflow.

| Quantity                  | Bound   | With $C = 10^4$, $n = 10^5$ |
| ------------------------- | ------- | --------------------------- |
| One coordinate difference | $2C$    | $2 \ast 10^4$               |
| One cross term            | $2C^2$  | $2 \ast 10^8$               |
| Twice the area            | $2nC^2$ | $2 \ast 10^{13}$            |
| Boundary count            | $2nC$   | $2 \ast 10^9$               |

A signed 64-bit integer holds up to about $9.2 \ast 10^{18}$, so the cross terms and the double area are safe with five orders of magnitude to spare. The reference programs state the tighter bound $2^{53} \approx 9.0 \ast 10^{15}$ because JavaScript numbers and the browser Pascal compiler's `Int64` are both doubles under the hood: both represent every integer below $2^{53}$ exactly and lose the low bits above it. At $C = 10^4$ and $n = 10^5$ the double area is $2 \ast 10^{13}$, which is comfortably inside that range.

A statement with coordinates of magnitude $10^9$ changes the picture. One cross term is then $2 \ast 10^{18}$, two of them already exceed the signed 64-bit range, and the sum over $n$ edges needs a 128-bit accumulator or a big integer. The change is local: widen the accumulator, keep the edges in 64-bit products, and the rest of the algorithm is unchanged. The [modular arithmetic](/algorithms/number-theory/modular-arithmetic) article covers the variant where only the answer modulo a prime is needed.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| A lattice polygon's area, exactly | The shoelace sum, with the factor of two kept |
| The number of lattice points on a lattice polygon's boundary | The gcd sum over the edges |
| The number of lattice points strictly inside a lattice polygon | Pick's theorem after the two sums above |
| A self-intersecting polygon's area | The shoelace sum still gives the signed winding area, but Pick's theorem is invalid |
| A lattice polygon with $h$ holes | Pick with holes: $A = I + B/2 - 1 + h$ |
| A polygon with non-lattice vertices | Scale the coordinates to integers, or use floating-point geometry |
| The lattice points inside a triangle with a large bounding box | A floor-sum or Euclidean-style counting algorithm, not Pick alone |
| A point-in-polygon query | The ray crossing test in [point in polygon](/algorithms/geometry/point-in-polygon) |
| The area of a convex hull | The shoelace sum over the hull vertices from [convex hull](/algorithms/geometry/convex-hull) |
| The number of lattice points on a segment | The same gcd lemma, applied to that one segment |
| A count modulo a prime | Reduce the shoelace terms modulo the prime and use a modular inverse of two |

The fourth row is outside the technique: a self-intersecting boundary has no single interior, and Pick's theorem has no plain form for it. The fifth row needs a one-term correction: the boundary of each hole contributes its own points to $B$, and the area the hole removes is no longer part of $A$, so the formula becomes $A = I + B/2 - 1 + h$, where $h$ is the number of holes.

The seventh row is the trap. A triangle with vertices at the origin, $(a, 0)$ and $(0, b)$ has an area of $ab/2$, but the number of lattice points inside it is not a closed-form expression in $a$ and $b$; it is a sum of floors, and the sum is computed by an algorithm that resembles the Euclidean algorithm. Pick's theorem gives the count only after the boundary count, which for that triangle is $a + b + \gcd(a,b)$, so the interior count is $(ab - a - b - \gcd(a,b) + 2)/2$. That is a formula for a right triangle with legs on the axes, not for a general triangle.

## Reference implementations

The manifest `implementations/geometry/integer-geometry/algorithm.yaml` publishes one `program` variant per language: `c/program.c`, `cpp17/program.cpp`, `java/Main.java`, `python/program.py`, `pascal/program.pas` and `javascript/program.js`.

All six read the same input and write the same output.

```text
n
x1 y1
...
xn yn
```

The polygon's vertices are in order, clockwise or counterclockwise, and $n \ge 3$. The output is three lines: twice the area, the boundary count and the interior count. Printing twice the area instead of the area keeps the contract free of decimal formatting and makes the six programs agree byte for byte.

The C, C++ and Java versions accumulate in 64-bit signed integers and compute the gcd with a loop. The Python version uses `math.gcd`, which accepts negative arguments and returns a non-negative result, so the explicit absolute values are not required there; they keep the six listings parallel. The JavaScript version uses ordinary numbers and relies on the stated bound below $2^{53}$; it is an educational reference, not a USACO submission language. The Pascal version uses `Int64` for the cross products and the sums, reads each coordinate with a separate `Read`, and uses `SysUtils` for `IntToStr`; it compiles under the browser Pascal compiler used by the repository's test runner as well as under Free Pascal.

The manifest records the variants as unverified until the continuous integration run compiles them and compares their output on the shared fixtures. The fixtures cover a counterclockwise square, a right triangle whose hypotenuse carries no interior lattice point beyond its endpoints, and a clockwise unit square with no interior point at all.

## Recursion decision

The algorithm does not recurse. The shoelace sum is a loop over edges, and the gcd is a loop over remainders. The only place where a recursive formulation suggests itself is the gcd itself.

Euclid's algorithm in recursive form is

```text
gcd(a, b):
    if b == 0: return a
    return gcd(b, a mod b)
```

and its depth is $O(\log C)$, which is at most about $90$ for 64-bit inputs and at most about $45$ for the 32-bit coordinates in most statements. Any language in the reference set can afford that stack. The loop is still the better choice: it has no call overhead inside the per-edge loop, and it cannot hit a recursion limit that a statement did not promise.

| Language | Recursive gcd depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $90$ frames at 64 bits | Either form; the loop is conventional |
| Java | About $90$ frames | Either form; the loop avoids a call per edge |
| Python | About $90$ frames, below the limit of $1000$ | Either form; the loop is faster |
| Pascal | About $90$ frames | Either form; the loop is what the listings use |
| JavaScript | About $90$ frames | Either form; the loop is faster |

The polygon itself has no recursive structure. The proof is an induction on cuts, but the computation never performs a cut: it reads the boundary and sums local quantities. A recursive solution to this problem would be a recursive reformulation of a flat loop, and it would add a stack frame per edge for no gain.

The one recursion that does appear in the wider subject is the triangulation in the proof of Pick's theorem. It is an existence argument, not an algorithm: the program never constructs the triangulation, because the defect is additive and the boundary already encodes the answer.

## Implementation walkthrough

Six lines carry the technique. They are worth reading one at a time.

```cpp
int j = (i + 1) % n;
twiceArea += x[i] * y[j] - x[j] * y[i];
boundary += std::gcd(std::llabs(x[j] - x[i]), std::llabs(y[j] - y[i]));
twiceArea = std::llabs(twiceArea);
long long interior = (twiceArea - boundary + 2) / 2;
```

**The index wrap.** The last edge runs from $p_{n-1}$ back to $p_0$. Writing `% n` in the loop is the smallest correct form, and it avoids a duplicated closing edge outside the loop that would double-count the first vertex.

**The sign.** The shoelace terms must be accumulated before the absolute value is taken. Taking the absolute value of each term destroys the cancellation between the terms that lie outside the polygon, and the result is not the area. A clockwise polygon produces a negative total, and one `llabs` at the end is the whole orientation handling.

**The gcd arguments.** Both differences are taken before the gcd, and both are made absolute. `std::gcd` in C++17 already returns a non-negative value for the usual inputs, but the explicit absolute values document the intent and keep the C version, which has no standard gcd, identical to the others. `gcd(0, k) = k` is the case of an axis-parallel edge, and it is handled by the same loop without a special case.

**The division.** The numerator is $2A - B + 2$, which is exactly $2I$, so the division is exact. The constant is not decoration: dropping the $+2$ shifts every interior count down by one, and no amount of care with the division recovers it. The dangerous variant is not integer truncation, because $2A$ and $B$ always have the same parity and the two halves would cancel; the dangerous variant is a floating-point area used after $2A$ passes $2^{53}$, where the low bits are gone before the subtraction starts.

**The width.** The products are formed in the widest type available before they are added. Multiplying two 32-bit values and only then widening the result is the classic overflow, and it is invisible on the small fixtures. The reference programs declare the coordinates and the accumulators as 64-bit values from the start.

**The input check.** A polygon needs at least three vertices, and a missing coordinate means the input is truncated. The programs return without printing rather than reading uninitialized values; the fixtures never exercise that path, but a panic on malformed input is worse than a silent exit.

A streaming variant replaces the two arrays with the first vertex and the previous vertex:

```text
read n
read first
previous = first
for k = 2 .. n:
    read current
    accumulate(previous, current)
    previous = current
accumulate(previous, first)
```

It uses $O(1)$ memory and produces the same sums. The reference programs keep the arrays because the closing edge is easier to see, and because the six versions are meant to be read side by side.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Summing $g + 1$ per edge | Every vertex is counted twice and $B$ is too large by $n$ | Sum $g$, or sum $g + 1$ and subtract $n$ |
| Summing $g - 1$ per edge | The vertices are dropped, so the boundary count is too small | The charge is the gcd itself |
| Dropping the $+ 2$ when rearranging Pick | Every interior count is one too small | Keep $2I = 2A - B + 2$ and divide once |
| Taking the absolute value of each shoelace term | The signed cancellation is destroyed | Sum first, take the absolute value once |
| Using 32-bit products | Large coordinates overflow and the area has the wrong sign or magnitude | Widen before multiplying |
| Forgetting the sign of the shoelace sum | A clockwise polygon reports a negative area | Take the absolute value of the total |
| Applying Pick's theorem to a self-intersecting polygon | The boundary is not a simple closed curve and the interior is not a single region | Check that the polygon is simple |
| Applying Pick's theorem with a hole | The interior count is off by the number of holes | Add the number of holes to the defect |
| Counting a zero-length edge | The gcd is zero and the boundary is undercounted | Require distinct consecutive vertices |
| Using a gcd that assumes non-negative arguments | A negative difference leaks into the boundary count, and the most negative value is undefined behavior | Pass the absolute differences |

### Why this fails: the fence posts inside the edges

The mistake that survives review most often is summing $\gcd - 1$, the lattice points strictly between the endpoints of each edge, and then treating that total as the boundary count. It looks careful, because it avoids counting the vertices twice, and it produces a plausible number.

Take the smallest lattice polygon, the unit right triangle with vertices $(0,0)$, $(1,0)$ and $(0,1)$. Each edge has $\gcd = 1$, so the sum of $\gcd - 1$ is $0$. The shoelace sum is $1$, so $2A = 1$. Pick's theorem then gives

$$
I = \frac{1 - 0 + 2}{2} = \frac{3}{2},
$$

which is not an integer. The correct boundary count is $3$, and the correct interior count is $0$, because the triangle contains no lattice point other than its vertices.

The unit square is the next smallest counterexample and the one that shows the size of the error. Its four edges each have $\gcd = 1$, so the wrong count is $0$ and the correct count is $4$. The shoelace sum is $2$, and the wrong formula gives $I = (2 - 0 + 2)/2 = 2$: it claims two interior points in a square that has none.

The generalization is a convention, not a formula: **a boundary count charges each edge for its starting vertex and for every interior point of the edge, and the gcd is exactly that number.** The endpoints belong to the edges on both sides of them, so exactly one of the two charges may include them, and the start-of-edge convention does. Summing the strict interior points is the same as deleting all the vertices from the boundary, which changes the polygon's combinatorics and breaks Pick's theorem.

A second failure in the same area is the half-integer. Take the same unit triangle and compute the area as a floating-point number $0.5$, then apply $I = A - B/2 + 1$; the answer is correct. Now take a polygon with an odd shoelace sum and a large coordinate, so that $2A$ is an odd integer above $2^{53}$. The double cannot represent it, and both the area and the interior count are off by an amount that depends on the coordinate. The fix is not a different formula but a different type: keep the integer $2A$ and divide only the final expression, where Pick's theorem guarantees the division is exact.

## Variants and extensions

- **Polygons with holes.** Every hole adds one to the defect: $A = I + B/2 - 1 + h$, where $h$ is the number of holes. The boundary sum includes the hole boundaries, traversed in the opposite direction for the shoelace part.
- **The generalized Pick theorem.** For a lattice polytope of dimension $d$, the Ehrhart polynomial counts the lattice points in dilations, and its leading coefficient is the volume. Pick's theorem is the two-dimensional case at dilation one.
- **Triangles with no lattice points on an edge.** The primitive triangles of the proof have area $1/2$, and the number of primitive triangles in a triangulation is $2A$. This is the discrete analog of the area formula.
- **Counting lattice points in a triangle by a floor sum.** When the boundary count is not enough, or the triangle is not aligned with the axes, the count is a sum of floors computed by an algorithm that mirrors the Euclidean algorithm. Pick's theorem is the shortcut when the boundary is known.
- **Visible lattice points.** A lattice point is visible from the origin exactly when its coordinates are coprime, so the primitive step vectors are the visible points. The gcd in the boundary count is the same coprimality condition.
- **The shoelace sum modulo a prime.** If only the area modulo $p$ is needed, every term can be reduced modulo $p$ and the factor of two replaced by a modular inverse. This is the version used when the coordinates are too large for 128-bit integers.
- **The shoelace sum in three dimensions.** A polygonal face has an area vector equal to half the sum of the cross products of its consecutive vertices; the same edge walk generalizes, but Pick's theorem does not survive in three dimensions.
- **Lattice polygons and convex hulls.** The hull of a set of lattice points is a lattice polygon, so the shoelace sum and Pick's theorem apply to it after the hull is built by [convex hull](/algorithms/geometry/convex-hull). Rotating calipers over the hull answer extreme-distance questions without changing the arithmetic.

## Contest strategy

1. Check that every vertex is a lattice point and that the polygon is simple. If either fails, stop and use a floating-point geometry library, or scale the input to integers.
2. Decide what the statement wants: the area, the boundary count, the interior count, or all three. The three formulas share one loop, so computing all three costs almost nothing.
3. Keep the factor of two. Do not divide the area by two until the final expression, and do not print a half-integer area as a decimal unless the statement asks for one.
4. Size the accumulator from the constraints before writing the loop. A single cross term is $2C^2$; the sum is $2nC^2$. If that exceeds the signed 64-bit range, widen the accumulator rather than the coordinates.
5. Use a gcd that handles zero and takes absolute values. `gcd(0, k) = k` covers axis-parallel edges, and the absolute value covers edges that run left or down.
6. Take the sign at the end. A statement that asks for orientation wants the sign of the shoelace sum; a statement that asks for area wants its absolute value; a statement that asks for both wants the sign and the absolute value from the same sum.
7. Test the four edge cases explicitly: a triangle with three vertices, an axis-parallel square, a clockwise polygon, and a thin polygon with no interior points.
8. Compare against a brute-force point-in-polygon count on small random polygons. A disagreement is either a boundary convention or an overflow, and both are cheap to find before the contest.

## Worked problems

### Problem 1: the polygon lattice points

**Restatement.** Given a simple polygon with $n$ vertices at integer coordinates, print the number of lattice points strictly inside it and the number on its boundary. Constraints: $3 \le n \le 10^5$ and $|x_i|, |y_i| \le 10^9$. This is CSES problem 2193, [Polygon Lattice Points](https://cses.fi/problemset/task/2193).

**Naive baseline.** Enumerate the points of the bounding box and test each one against the polygon. The box can hold $4 \ast 10^{18}$ points, so this is not a baseline that finishes.

**Insight.** The boundary count is a sum of edge gcds, and Pick's theorem turns the boundary count and the shoelace sum into the interior count.

**Derivation.** Accumulate the shoelace sum and the gcd sum in one pass. Print $(2A - B + 2)/2$ and then $B$, in the order the statement asks.

**Correctness.** The segment lemma gives the boundary count and Pick's theorem gives the interior count, exactly as in the proof above.

**Complexity.** $O(n \log C)$ time and $O(n)$ space. The stated coordinate bound of $10^9$ makes $2A$ as large as $2 \ast 10^{23}$, so the accumulator must be a 128-bit integer, a big integer, or a modular value; a 64-bit accumulator is not enough at the top of the range.

**Common wrong approach.** Using a 64-bit accumulator because the coordinates fit in 64 bits. The coordinates do fit; the sum over $10^5$ edges does not.

### Problem 2: the robot's area

**Restatement.** A robot walks around a building on a grid and reports each move as a pair $(\Delta x, \Delta y)$. The path is closed, simple and counterclockwise, and the building fits in a $100$ by $100$ square. For each scenario, print the number of interior grid points $I$, the number of boundary grid points $E$, and the area $A$ to one decimal place. This is POJ 1265, [Area](http://poj.org/problem?id=1265).

**Naive baseline.** Reconstruct the vertices, then test every grid point in the $100$ by $100$ bounding box. The box has $10^4$ points, so this is affordable, and it is a good differential test for the formula.

**Insight.** The moves are edge vectors, so the gcd of a move is the boundary charge of the edge, and the shoelace sum over the moves gives twice the area without reconstructing a single absolute coordinate if the partial sums are accumulated as the walk proceeds.

**Derivation.** Start at $(0,0)$. For each move, add the shoelace contribution of the current point and the next point, add the gcd of the move, and advance the current point. At the end, the area is half the double area and the interior count is $(2A - E + 2)/2$.

**Correctness.** The walk is a closed lattice polygon, so the three formulas apply. The counterclockwise direction makes the shoelace sum positive, which is consistent with the statement's convention.

**Complexity.** $O(m \log C)$ time for $m$ moves and $O(1)$ space, because the absolute positions never need to be stored.

**Common wrong approach.** Formatting the area from the integer double area with a division that truncates, so a half-integer area prints as an integer. The statement asks for one digit after the decimal point, and the exact double area is the value to format.

### Problem 3: the polygon's orientation

**Restatement.** Given up to $25$ simple polygons with integer vertices, print for each one whether its vertices are clockwise or counterclockwise and its area to one decimal place. The input ends with a line containing $0$. This is the Kattis problem [Polygon Area](https://open.kattis.com/problems/polygonarea).

**Naive baseline.** Compute the area by triangulating from the first vertex with floating-point cross products, and decide the orientation by comparing the first nonzero cross product of consecutive edges with the sign of the total.

**Insight.** The shoelace sum carries both answers at once: its sign is the orientation and its absolute value is twice the area. No separate orientation test is needed.

**Derivation.** Accumulate $S = \sum (x_i y_{i+1} - x_{i+1} y_i)$. If $S > 0$ the boundary is counterclockwise, if $S < 0$ it is clockwise, and the area is $|S|/2$. Format the area with one decimal digit by printing $|S|/2$ as a rational with denominator two.

**Correctness.** The shoelace lemma identifies $S$ with twice the signed area, and the signed area of a simple polygon is positive exactly when its boundary is counterclockwise.

**Complexity.** $O(n)$ time per polygon and $O(1)$ extra space. The coordinate bound of $10^4$ and the vertex bound of $1000$ keep every product and sum inside a 64-bit integer.

**Common wrong approach.** Deciding the orientation from the first three vertices. The first turn can be a reflex corner of a clockwise polygon, so the local turn is not the global orientation; only the signed total is.

## Practice progression

1. **Recognition.** Given a statement, decide whether the polygon is a lattice polygon, whether it is simple, and whether the question is about the area, the boundary, or the interior. Write down which of the three formulas is needed.
2. **Direct application.** Implement the shoelace sum for the area and the gcd sum for the boundary, and check both against a brute-force point-in-polygon count on small random polygons.
3. **Adaptation.** Handle a clockwise polygon without a special case, a polygon with an axis-parallel edge, and a polygon with a collinear vertex in the middle of an edge.
4. **Combination.** Compute the convex hull of a set of lattice points and then apply Pick's theorem to it; count the lattice points in a union of polygons by adding the pieces and subtracting the shared boundaries.
5. **Challenge.** Implement the version that prints the area modulo a prime for coordinates of magnitude $10^9$, and the version that uses 128-bit accumulation for the exact area at the same bound. Compare the two on random inputs.
6. **Transfer.** Use the gcd lemma on its own for a segment-crossing problem, and Pick's theorem as a counting argument in a proof: the number of lattice points in a triangle, the number of primitive vectors, or the impossibility of an equilateral triangle with lattice vertices.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the shoelace formula, and explain why it is kept as twice the area rather than the area. (At a glance)
2. Why does an edge with difference $(\Delta x, \Delta y)$ contribute $\gcd(|\Delta x|, |\Delta y|)$ boundary points, and not $\gcd + 1$? (Key insight)
3. State Pick's theorem and derive the formula for $I$ used by the program. (Formal model)
4. Why is the shoelace sum exact for a lattice polygon even when the area is a half-integer? (Key insight)
5. Prove that a lattice segment contains $\gcd + 1$ lattice points. (Formal model)
6. What does the additivity lemma say, and which terms cancel when two polygons are glued along a segment? (Formal model)
7. Why is a primitive lattice triangle's area exactly $1/2$? (Correctness proof)
8. What is the smallest counterexample to the boundary rule that sums $\gcd - 1$? (Common mistakes)
9. How large can a cross term and the total shoelace sum be, given coordinates of magnitude $C$ and $n$ edges? (Complexity analysis)
10. What changes when the polygon is clockwise, self-intersecting, or has a hole? (Algorithm selection)

## Further reading

- The subject index lists this technique beside the geometry it extends: [the computational geometry](/algorithms/geometry/).
- The shoelace sum is applied to the hull in [convex hull](/algorithms/geometry/convex-hull), and the hull of a lattice point set is itself a lattice polygon.
- The ray crossing test that the naive baseline uses is described in [point in polygon](/algorithms/geometry/point-in-polygon).
- The gcd that counts boundary points is a special case of the Euclidean algorithm in [extended Euclidean](/algorithms/number-theory/extended-euclidean).
- The area of a polygon with non-integer vertices, and the orientation tests that go with it, are in [rotating calipers](/algorithms/geometry/rotating-calipers).
- The modular version of the area, for coordinates beyond 128 bits, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The sweep that answers many polygon queries at once is in [sweep line](/algorithms/geometry/sweep-line).
- The quadratic-time baseline for a related geometric question is in [closest pair](/algorithms/geometry/closest-pair).
- The discrete mathematics of determinants, vectors and signed areas is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The counting arguments that turn an exact formula into a proof are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The dynamic program that uses a lattice as its state space is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
