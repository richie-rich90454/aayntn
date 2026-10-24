---
id: geometry.point-in-polygon
title: Point in polygon
summary: Decide whether a point lies inside a polygon by counting the crossings of a ray, using only integer arithmetic and handling the boundary separately.
division: [gold, platinum]
subjects: [geometry]
level: intermediate
importance: common-contest-technique
keywords:
    [
        point in polygon,
        ray casting,
        crossing number,
        winding number,
        boundary case,
        cross product,
        simple polygon,
        convex polygon,
    ]
prerequisites:
    required: [geometry.convex-hull]
    recommended: [foundations.sorting, arrays.prefix-sums]
complexity:
    time: "O(n) per query"
    space: "O(1) per query"
assumptions:
    - The polygon is simple, that is, its boundary does not cross itself.
    - The coordinates are integers, so that the orientation test is exact.
reviewed: false
---

## At a glance

A point is inside a polygon exactly when a ray from that point crosses the boundary an odd number of times. The test needs no division and no floating point, and it needs one extra rule for the boundary.

| Property | Value |
| --- | --- |
| **Problem** | Decide whether a query point is inside a polygon |
| **Rule** | Cast a ray to the right and count the crossings; odd means inside |
| **Time** | $O(n)$ per query, $O(1)$ space |
| **Requires** | A simple polygon, and the orientation test |
| **Fails when** | The polygon is self-intersecting, where the winding number is the better measure |

The rule is a parity argument, and the boundary case is a separate computation rather than a special case of the parity argument. That separation is the whole difficulty of the article.

## Problem motivation

A game engine has a map drawn as a polygon with $n \le 10^5$ vertices, and a mouse that moves over it. Every frame, the engine must know whether the mouse is inside the map or outside it, because the behavior of the mouse differs.

The naive baseline is a test for each edge: is the point on the same side of the line through this edge as the rest of the polygon? That test is correct only for a convex polygon, and a map is not convex in general, so the baseline is not merely slow, it is wrong.

The baseline that is correct is the crossing-number test. Draw a ray from the point in some direction and count how many times it crosses the boundary. The point is inside exactly when that count is odd. The test is $O(n)$ per query, and for a single query on a map of $10^5$ vertices it costs $10^5$ operations, which is far too slow at $60$ frames a second.

The way to make it fast is to batch the queries. Sort the queries and the polygon's edges by their vertical extent, sweep a line across them, and maintain the set of edges the line currently crosses. Each query is then answered by a count from that set, and the whole batch costs $O((n + q) \log(n + q))$ rather than $O(nq)$. That batch is an instance of the [sweep line](/algorithms/geometry/sweep-line) technique.

## Recognition patterns

Point in polygon is the right tool when the statement contains some of these phrases.

- "Is the point inside", "inside or outside", "contained in the polygon", "inside the region".
- "A point and a polygon", "a point and a shape", "the fence and the cow".
- "Count the points inside the polygon", "how many of the given points lie inside".
- "On the boundary", "strictly inside", "inside or on the edge".
- A non-convex shape given as a list of vertices in order.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| One query, $n \le 10^5$ vertices | The linear test is $10^5$ operations and is instant |
| $q \le 1000$ queries and $n \le 10^5$ | The linear test is $10^8$ operations and is too slow |
| $q \ge 10^5$ queries | The offline sweep or a range-counting structure is required |
| The polygon is convex | A binary search over the fan from a vertex answers each query in $O(\log n)$ |
| The polygon is given as a union of rectangles | A different algorithm entirely, a sweep with a segment tree |
| The coordinates are integers | The orientation test is exact, and the whole test can be integer-only |
| The coordinates are real | A tolerance is needed, and the boundary case becomes a decision to make |
| The polygon is self-intersecting | The winding number, not the crossing number, is the standard measure |
| The query point is guaranteed not to be on the boundary | The boundary test can be skipped |

The third row is the one that decides the shape of the solution. A single query is a loop; a million queries are a sweep.

## Naive approach

The baseline is the crossing-number test written directly with a division.

```python
def inside_floating(polygon, p):
    crossings = 0
    n = len(polygon)
    for i in range(n):
        a = polygon[i]
        b = polygon[(i + 1) % n]
        if (a[1] > p[1]) != (b[1] > p[1]):
            t = (p[1] - a[1]) / (b[1] - a[1])
            x_int = a[0] + t * (b[0] - a[0])
            if x_int > p[0]:
                crossings += 1
    return crossings % 2 == 1
```

This is correct, and it is the reference implementation for a differential test. It has two problems. The division by $b_y - a_y$ is a division by zero when the edge is horizontal, which the half-open test prevents, and the floating-point arithmetic is exact only when the coordinates are chosen so that the intersection lands exactly on a representable value, which they do not in general.

The second baseline is the convex test.

```python
def inside_convex(polygon, p):
    n = len(polygon)
    for i in range(n):
        a = polygon[i]
        b = polygon[(i + 1) % n]
        if cross(a, b, p) < 0:
            return False
    return True
```

This is $O(n)$ and it is correct for a convex polygon, and it is wrong for every other polygon. It is the fastest test to write and the one that produces the most wrong answers, because a polygon that looks convex in a diagram is very often not.

## Key insight

The insight is that **the boundary of a region separates the plane into two parts, and a path from one part to the other must cross the boundary.**

Draw a ray from the query point $p$ heading to the right, that is, in the direction of increasing $x$. It runs to infinity, and it crosses the boundary of the polygon some number of times, say $c$.

If $p$ is inside, the ray starts inside and ends outside, since the polygon is bounded. Every crossing moves the ray from inside to outside or from outside to inside, so the crossings alternate, and the number of them is odd.

If $p$ is outside, the ray starts outside and ends outside, so the crossings alternate between even and odd counts, and the number of them is even.

So the point is inside exactly when the count is odd.

The second insight is that **the crossing can be detected with the orientation test alone, and the intersection point never has to be computed.** The edge from $a$ to $b$ crosses the horizontal line through $p$ exactly when $a$ and $b$ are on opposite sides of that line, which is the half-open test

$$
(a_y > p_y) \ne (b_y > p_y).
$$

When it does, the edge crosses the ray to the right exactly when the intersection point is to the right of $p$, and that is decided by the sign of the cross product $\operatorname{cross}(a, b, p)$ compared with the sign of $b_y - a_y$. No division, no square root, and no floating point.

The third insight is that **the boundary is a different question and needs a different answer.** The parity argument says nothing about a point that lies exactly on an edge, because a ray starting on the boundary has an ambiguous number of crossings. The boundary test is a separate check: $p$ is on the edge from $a$ to $b$ when $\operatorname{cross}(a, b, p) = 0$ and $p$ is inside the bounding box of $a$ and $b$.

## Formal model

Let $P$ be a polygon with vertices $v_0, v_1, \ldots, v_{n-1}$ in order, and let $p$ be a query point.

::: math definition Definition
The polygon $P$ is **simple** when its boundary is a closed curve that does
not cross itself. A point $p$ is **strictly inside** $P$ when a small disk
around $p$ is contained in the interior of $P$, **on the boundary** when
$p$ lies on one of the edges, and **outside** otherwise. The **crossing
number** of $p$ with respect to $P$ is the number of times the ray
$\{(p_x + t, p_y) : t > 0\}$ meets the boundary of $P$.
:::


::: math definition Definition
For points $a, b, c$, the **orientation test** is
$$
\operatorname{cross}(a, b, c) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x).
$$
It is positive when $c$ is to the left of the directed line from $a$ to
$b$, negative when $c$ is to the right, and zero when the three points are
collinear.
:::


::: math lemma Lemma
Let $a$ and $b$ be the endpoints of an edge and let $p$ not lie on the
line through them. If the edge crosses the horizontal line through $p$ and
$x_{\text{int}}$ is the $x$-coordinate of the crossing, then
$$
(x_{\text{int}} - p_x) \cdot (b_y - a_y) = \operatorname{cross}(a, b, p).
$$
:::


::: math proof Proof
The crossing point is $a + t(b - a)$ where
$t = \frac{p_y - a_y}{b_y - a_y}$, so
$x_{\text{int}} = a_x + t(b_x - a_x)$. Then
$$
(b_y - a_y)(x_{\text{int}} - p_x)
= (b_y - a_y)(a_x - p_x) + (p_y - a_y)(b_x - a_x)
= (b_x - a_x)(p_y - a_y) - (b_y - a_y)(p_x - a_x),
$$
which is the cross product. $\square$
:::


::: math invariant Invariant
After the loop has processed the first $j$ edges, the variable `crossings`
equals the number of those edges that cross the ray from $p$ to the right.
Each edge either crosses the line through $p$ or does not, and in the first
case the lemma decides whether it also crosses to the right of $p$. The
invariant is preserved by each iteration, and the parity of `crossings` at
the end is the crossing number of $p$ with respect to $P$.
:::


## Algorithm derivation

The integer-only test is the whole algorithm.

```python
def point_in_polygon(polygon, p):
    n = len(polygon)
    crossings = 0
    for i in range(n):
        a = polygon[i]
        b = polygon[(i + 1) % n]
        c = cross(a, b, p)
        if c == 0 and on_segment(a, b, p):
            return "boundary"
        if (a[1] > p[1]) != (b[1] > p[1]):
            if (c > 0) == (b[1] > a[1]):
                crossings += 1
    return "inside" if crossings % 2 == 1 else "outside"
```

Three decisions are packed into the loop.

The **half-open test** `(a[1] > p[1]) != (b[1] > p[1])` decides whether the edge crosses the horizontal line through $p$. It is half-open because it counts a vertex exactly at $p_y$ once rather than twice or not at all, which is what keeps the parity correct when the ray passes through a vertex.

The **sign comparison** `(c > 0) == (b[1] > a[1])` decides whether the crossing is to the right of $p$. By the lemma, the sign of $x_{\text{int}} - p_x$ is the sign of the cross product divided by the sign of $b_y - a_y$, so the crossing is to the right exactly when the two signs agree.

The **boundary test** `c == 0 and on_segment(a, b, p)` is checked before the crossing count, because a point on the boundary is a different answer from a point inside. The bounding box test is what stops a point that is merely collinear with the edge from being reported as on it.

## Step-by-step execution

Take the concave polygon with vertices $(0,0)$, $(8,0)$, $(2,2)$ and $(0,8)$, and the query point $p = (1,3)$.

The edges are $e_0 = ((0,0), (8,0))$, $e_1 = ((8,0), (2,2))$, $e_2 = ((2,2), (0,8))$ and $e_3 = ((0,8), (0,0))$.

| Edge  | $\operatorname{cross}$ | Half-open test                 | Crosses to the right |
| ----- | ---------------------- | ------------------------------ | -------------------- |
| $e_0$ | $24$                   | $(0 > 3) \ne (0 > 3)$ is false | no                   |
| $e_1$ | $-4$                   | $(0 > 3) \ne (2 > 3)$ is true  | no, the signs differ |
| $e_2$ | $4$                    | $(2 > 3) \ne (8 > 3)$ is true  | yes, the signs agree |
| $e_3$ | $8$                    | $(8 > 3) \ne (0 > 3)$ is true  | no, the signs differ |

No edge gives $\operatorname{cross} = 0$, so the point is not on the boundary. One edge crosses the ray to the right, so the crossing count is $1$, which is odd, and the point is **inside**.

The point is inside even though the "left of every edge" test would call it outside. The test that says "outside" is the convex test, and the polygon is concave at the vertex $(2,2)$: the turn from $e_1$ to $e_2$ is a right turn while the other three turns are left turns.

## Correctness proof

::: math theorem Theorem
The algorithm reports `boundary` exactly when the query point lies on the
boundary of the polygon, and reports `inside` exactly when the point lies
strictly inside it, for every simple polygon and every query point.
:::


::: math proof Proof
**The boundary.** The point $p$ lies on the boundary exactly when it lies
on one of the edges. The point lies on the segment from $a$ to $b$ exactly
when it is collinear with $a$ and $b$ and it is between them, and being
between them is exactly being inside their bounding box, because the
segment is the intersection of the line with the box. The test
$\operatorname{cross}(a, b, p) = 0$ gives the collinearity and the bounding
box test gives the between-ness, so the boundary answer is exact.

**The crossing count.** Consider one edge from $a$ to $b$. The edge meets the horizontal line through $p$ if and only if $a$ and $b$ are on opposite sides of it, and the half-open test $(a_y > p_y) \ne (b_y > p_y)$ is exactly that condition, with the half-open convention ensuring that a vertex exactly at height $p_y$ is counted once. When the edge meets the line, the lemma gives $(x_{\text{int}} - p_x)(b_y - a_y) = \operatorname{cross}(a, b, p)$, so the crossing is to the right of $p$ exactly when the cross product and $b_y - a_y$ have the same sign, which is the test $(c > 0) == (b_y > a_y)$ since neither is zero when $p$ is not on the edge. The loop therefore counts exactly the edges that cross the ray, and the invariant holds.

**The parity.** The polygon is simple, so its boundary is a closed curve and the interior of the polygon is a single connected region. The ray from $p$ to the right starts at $p$ and ends outside the polygon, since the polygon is bounded. Each crossing moves the ray between the interior and the exterior, and the ray cannot cross the boundary at a place where it touches it and turns back, because the ray is a straight line and the boundary of a simple polygon is a closed curve, so the crossings are transversal except at the finitely many vertices, which the half-open convention handles exactly once each. Hence the number of crossings is odd when $p$ is inside and even when $p$ is outside. The algorithm reports `inside` exactly when the count is odd. $\square$
:::


## Complexity analysis

Let $n$ be the number of vertices and $q$ the number of queries.

- **Time per query:** $O(n)$, one pass over the edges, with a constant amount of arithmetic per edge.
- **Auxiliary space per query:** $O(1)$.
- **All queries, naively:** $O(nq)$ time and $O(n)$ space for the polygon.
- **All queries, batched:** $O((n + q) \log(n + q))$ time with the offline sweep, because the queries and the edge events are sorted once and the sweep answers each query in $O(\log n)$.
- **Convex polygon:** $O(\log n)$ per query with the binary search over the fan, because the vertices to one side of the fan are found by a binary search rather than a scan.

The arithmetic is exact and cheap. The cross product multiplies two coordinate differences, so with coordinates of magnitude $C$ the intermediate value is of magnitude $2C^2$. For $C = 10^9$ that is $2 \times 10^{18}$, which fits in a signed 64-bit integer, and for larger coordinates a 128-bit type is required. There is no division anywhere in the algorithm, so there is nothing to normalize and no rounding to reason about.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One query, arbitrary simple polygon | The ray casting test |
| Many queries, arbitrary simple polygon | The offline sweep, or a bounding box index |
| Many queries, convex polygon | The binary search over the fan |
| A point guaranteed off the boundary | The ray casting test with the boundary check removed |
| A self-intersecting polygon | The winding number, or an explicit planar subdivision |
| A polygon given as a union of rectangles | A sweep with a segment tree over the vertical edges |
| A point and a convex hull | The half-plane test, one cross product per hull edge |
| A point and a set of points | Whether the point is in the convex hull, which is the same half-plane test |

The seventh row is the shortcut worth knowing. If the shape is a convex hull of a point set, the point is inside exactly when it is to the left of every hull edge, and the hull is usually much smaller than the point set.

## Recursion decision

The ray casting test is a scan, and it should stay a scan.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; a recursive version would need $n$ frames and buys nothing |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative; a polygon with $10^5$ vertices overflows a recursive version at once |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

A recursive formulation that returns the parity of the crossings would have a depth of $n$, one frame per edge, and there is no reason to write it. The one place a recursion is natural is a divide and conquer that returns the parity of the crossings in a range of edges, which is a way of avoiding the per-query scan when there are many queries, and it still has a depth of $O(\log n)$ because the range is halved.

The batched version is the one that needs a data structure, and the data structure is a balanced search tree, whose depth is $O(\log n)$ and whose operations are the reason the batched version is fast.

## Implementation walkthrough

Two lines decide whether the answer is right.

```python
if (a[1] > p[1]) != (b[1] > p[1]):
    if (c > 0) == (b[1] > a[1]):
        crossings += 1
```

The half-open test is the first line. A test written as `a[1] <= p[1] <= b[1]` or `min(a[1], b[1]) <= p[1] <= max(a[1], b[1])` counts a vertex exactly at the height of $p$ twice when the vertex is a local extremum, and the parity is then wrong for every point whose ray passes through a vertex.

The second line is the sign comparison, and it depends on the first line being correct. If the edge does not cross the line, the sign comparison is meaningless, and the two tests must be nested rather than combined with a logical "and" on separate lines.

The order of the two tests is also a choice. Testing the sign first and the half-open condition second gives the same answer, and both are correct as long as the nesting is right.

```python
if c == 0 and on_segment(a, b, p):
    return "boundary"
```

This line must come before the crossing count, or the point on the boundary is reported with a parity that depends on which side the ray happened to leave from.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the convex test on a general polygon | Points inside the notches are reported outside | Use the crossing number |
| Using a closed interval on $y$ | The parity is wrong whenever the ray passes through a vertex | Use the half-open test |
| Reporting a point on the boundary as inside or outside | The answer depends on which side the ray left from | Test the boundary separately |
| Testing only the cross product for the boundary | Points on the line but outside the segment are reported on the boundary | Add the bounding box test |
| Using `double` for the coordinates | A rounding error changes the answer near an edge | Use integers |
| Dividing by $b_y - a_y$ | A division by zero on a horizontal edge | Use the half-open test, which excludes horizontal edges |
| Forgetting that the polygon must be simple | The parity counts a self-crossing twice | Use the winding number, or split the polygon |
| Reading the vertices in the wrong order | The polygon is traversed backwards and the crossings are wrong | Read the statement for the order |

### Why this fails: the convex test on a polygon that is not convex

The plausible wrong approach is to use the test from the [convex hull](/algorithms/geometry/convex-hull) article: a point is inside the polygon exactly when it is to the left of every edge. It is $O(n)$, it uses one cross product per edge, and it is right for a convex polygon, which is the shape most people picture.

The smallest counterexample is a concave quadrilateral. Take the polygon with vertices $(0,0)$, $(8,0)$, $(2,2)$ and $(0,8)$ in that order, and the query point $p = (1,3)$.

The point is inside the polygon. The ray to the right from $p$ at height $3$ meets the edge from $(2,2)$ to $(0,8)$ exactly once, and it meets the other three edges not at all, so the crossing count is $1$ and the point is inside by the parity rule.

The convex test says otherwise. The edge from $(8,0)$ to $(2,2)$ gives $\operatorname{cross}((8,0), (2,2), (1,3)) = -4$, which is negative, so the point is to the right of that edge and the test reports **outside**.

The polygon is concave at the vertex $(2,2)$, and the concavity is what breaks the test. The region that the convex test excludes is exactly the notch, and a point in the notch is genuinely inside the polygon.

Three vertices is not enough to expose the bug, because every triangle is convex and the two tests agree on it. Four vertices is the smallest possible polygon that is concave, and the quadrilateral above is the simplest one whose notch contains an integer point.

The lesson generalizes: **a test that is valid for a subclass is not valid for the whole class, and the subclass is easy to overlook because the examples in a diagram are usually convex.** The same trap appears in the [convex hull](/algorithms/geometry/convex-hull) article, where the half-plane test is correct for the hull and only for the hull.

## Variants and extensions

- **The winding number.** Instead of counting the parity of the crossings, count them with a sign: an upward crossing adds one and a downward crossing subtracts one. The winding number is nonzero exactly when the point is inside, and it is the standard answer for a self-intersecting polygon.
- **A ray in an arbitrary direction.** The direction does not matter, as long as it is not parallel to an edge and does not pass through a vertex. The horizontal ray is chosen because the test then reduces to a comparison of $y$-coordinates.
- **The convex case.** A point is inside a convex polygon exactly when it is to the left of every edge, and the edges can be searched with a binary search over the fan from one vertex, giving $O(\log n)$ per query.
- **Many queries.** The offline sweep processes the queries and the edge events together, and the answer to a query is a count from the active set. See [sweep line](/algorithms/geometry/sweep-line).
- **Points inside a polygon.** The same sweep, with the count of the active edges at the height of the point, answers the "how many points are inside" question in a batch.
- **A polygon with holes.** The parity rule handles holes correctly, because a point inside a hole is outside the outer boundary, and the crossing count of the outer boundary is even.
- **Tolerance.** With real coordinates, the boundary test needs a tolerance, and the choice of tolerance becomes part of the problem statement's meaning.
- **A half-plane test.** A point is inside a convex polygon exactly when it is to the left of every edge, and the test generalizes to the intersection of half-planes.

## Contest strategy

1. Decide whether the polygon is convex before choosing the test. If it is, use the half-plane test or the fan binary search, which are faster.
2. Use integer arithmetic throughout. The crossing test needs no division at all, and the boundary test needs nothing but comparisons.
3. Use the half-open $y$ test, and write it as `(a.y > p.y) != (b.y > p.y)` so that the half-open convention is visible.
4. Test the boundary separately, and check the bounding box.
5. Size the type for the cross product, which reaches $2C^2$ for coordinates of magnitude $C$.
6. When there are many queries, do not multiply the cost by the number of queries. Sort the queries and the edge events, and sweep.
7. Write the floating-point version first as the reference implementation, and check the integer version against it on random polygons and random points. A disagreement is either a parity convention or a boundary rule.

## Worked problems

### Problem 1: a point and a simple polygon

**Restatement.** A simple polygon with $n \le 10^5$ vertices is given in counterclockwise order. Decide whether the point $p$ is inside, outside, or on the boundary.

**Naive baseline.** The floating-point crossing test, $O(n)$ time and $O(1)$ space.

**Insight.** A ray from $p$ to the right crosses the boundary an odd number of times exactly when $p$ is inside, and the crossing is detected with the orientation test.

**Derivation.** Scan the edges. For each edge, compute the cross product; if it is zero and $p$ is in the bounding box, report the boundary. If the half-open $y$ test says the edge crosses the line through $p$, then compare the sign of the cross product with the sign of $b_y - a_y$ to decide whether the crossing is to the right. Count the crossings and report the parity.

**Correctness.** The theorem above proves that the boundary answer and the parity answer are both exact.

**Complexity.** $O(n)$ time and $O(1)$ space.

**Common wrong approach.** Using the convex test, which reports the points in the notches of a concave polygon as outside.

### Problem 2: many queries, batched

**Restatement.** A simple polygon with $n$ vertices and $q$ query points are given, with $n, q \le 10^5$. Count the queries that are strictly inside.

**Naive baseline.** The scan for each query, $O(nq)$ time, which is $10^{10}$ operations.

**Insight.** The answer to a query is the parity of the number of polygon edges crossing the horizontal line through the query, to the right of the query. That is exactly a counting query about a set of intervals, and it can be batched with a sweep.

**Derivation.** Turn each edge into an event: an edge enters the active set at the height of its lower endpoint and leaves at the height of its upper endpoint, and the sweep line rises through the plane. Each query is an event too, and at the height of a query the active edges are exactly the ones that cross the horizontal line through it, so the answer is the parity of the number of active edges to the right of the query. The active edges are kept in a balanced search tree ordered by their $x$-coordinate at the current sweep height, and the number of them to the right of the query is the size of a suffix of that tree, which an order-statistic tree reports in $O(\log n)$.

**Correctness.** The parity rule of Problem 1 applies unchanged, and the sweep maintains exactly the set of edges that the current height crosses.

**Complexity.** $O((n + q) \log n)$ time and $O(n)$ space, against $O(nq)$.

**Common wrong approach.** Running the scan for each query, which is the answer to Problem 1 applied $q$ times and is too slow.

### Problem 3: a convex polygon with many queries

**Restatement.** A convex polygon with $n \le 10^5$ vertices and $q$ queries are given. Decide for each query whether it is inside.

**Naive baseline.** The half-plane test for each query, $O(nq)$ time.

**Insight.** For a convex polygon, the test "to the left of every edge" is correct, and the edges can be searched instead of scanned.

**Derivation.** Fix the vertex $v_0$. The polygon is the union of the triangles $v_0 v_i v_{i+1}$. A query $p$ is inside exactly when it is to the left of the edge $v_0 v_1$, to the right of the edge $v_0 v_{n-1}$, and inside the fan triangle $v_0 v_i v_{i+1}$ for some $i$. The index $i$ is found by a binary search over the angles, because the fan triangles are ordered around $v_0$ and the polygon is convex.

**Correctness.** The fan decomposition of a convex polygon is exact, and the binary search finds the right triangle because the triangles are ordered by angle.

**Complexity.** $O(n)$ to build the polygon and $O(\log n)$ per query, so $O(n + q \log n)$ in total.

**Common wrong approach.** Using the ray casting test, which is correct but linear per query, and which is the answer to the previous problem rather than this one.

## Practice progression

1. **Recognition.** Given a statement, decide whether the shape is convex, whether the point may be on the boundary, and how many queries there are.
2. **Direct application.** Implement the integer crossing test and the boundary test, and check them against the floating-point version on random polygons and random points.
3. **Adaptation.** Write the winding number version, the convex half-plane version, and the version that reports the answer as `inside`, `outside` or `boundary` separately.
4. **Combination.** Combine the crossing test with the offline sweep for many queries, and with the [convex hull](/algorithms/geometry/convex-hull) when the shape is the hull of a point set.
5. **Challenge.** Solve a problem with a self-intersecting polygon, where the winding number replaces the parity, and check the two on a self-intersecting example.
6. **Transfer.** Recognize the technique in another subject: the number of lattice points inside a polygon, the [closest pair](/algorithms/geometry/closest-pair) algorithm's strip argument, the [rotating calipers](/algorithms/geometry/rotating-calipers) antipodal test, or the [sweep line](/algorithms/geometry/sweep-line) that answers the batched version.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the ray casting rule and explain why the parity is the right answer. (Key insight)
2. Why is the test on $y$ half-open, and what goes wrong with a closed interval? (Implementation walkthrough)
3. State the lemma relating the cross product to the intersection point, and prove it. (Formal model)
4. What is the boundary test, and why does it need the bounding box? (Key insight)
5. What invariant does the edge loop maintain? (Formal model)
6. Give the smallest concave polygon and a point that the convex test misplaces. (Common mistakes)
7. Why must the polygon be simple for the parity rule? (Correctness proof)
8. What is the time per query, and what is the time for a million queries? (Complexity analysis)
9. When is the half-plane test correct, and when is it not? (Algorithm selection)
10. Why is the winding number the right measure for a self-intersecting polygon? (Variants and extensions)
11. What type does the cross product need, and why? (Complexity analysis)
12. How does the offline sweep answer a batch of queries? (Worked problems)

## Further reading

- The orientation test that the whole article is built on, and the monotone chain that produces a convex polygon, are in [convex hull](/algorithms/geometry/convex-hull).
- The offline sweep that answers a batch of queries, and the active set that it maintains, are in [sweep line](/algorithms/geometry/sweep-line).
- The binary search that answers a point-in-convex-polygon query in logarithmic time is in [binary search](/algorithms/searching/binary-search).
- The offline batch of binary searches, which is the other way to answer many queries at once, is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The strip argument of the closest-pair algorithm, which is a parity argument about a vertical line, is in [closest pair](/algorithms/geometry/closest-pair).
- The subject index lists this technique, [point in polygon](/algorithms/geometry/point-in-polygon), beside the geometry it does not yet cover: [the computational geometry](/algorithms/geometry/).
