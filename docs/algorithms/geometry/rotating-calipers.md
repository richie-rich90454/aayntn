---
id: geometry.rotating-calipers
title: Rotating calipers
summary: Answer every extreme-pair question about a convex polygon in linear time by sweeping two antipodal calipers around the hull, and find the diameter of a point set.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: advanced-technique
keywords:
    [
        rotating calipers,
        antipodal points,
        antipodal pairs,
        diameter,
        convex polygon,
        farthest pair,
        support line,
        minimum enclosing rectangle,
    ]
prerequisites:
    required: [geometry.convex-hull]
    recommended: [foundations.sorting, searching.binary-search]
complexity:
    time: "O(n log n) for the whole algorithm"
    space: "O(n)"
assumptions:
    - The points are distinct, or duplicates are removed before the hull is computed.
    - The coordinates are integers small enough that the cross product fits in the chosen integer type.
reviewed: false
---

## At a glance

Two parallel lines that touch a convex polygon on opposite sides are **calipers**. Rotate them together, and the pair of points they touch traces a small number of configurations. Every extreme-pair question about the polygon is answered in one of those configurations.

| Property            | Value                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| **Problem**         | Find the farthest pair of points, and the other extreme-pair questions   |
| **Key object**      | The antipodal pair: two vertices with parallel supporting lines          |
| **Sweep**           | The antipodal index advances monotonically, so the whole sweep is $O(h)$ |
| **Time**            | $O(n \log n)$ with the hull, then $O(h)$ for the calipers                |
| **Auxiliary space** | $O(n)$ for the hull                                                      |
| **Requires**        | A convex polygon, in counterclockwise order                              |
| **Fails when**      | The shape is not convex, in which case the hull must be computed first   |

The diameter of a point set is the standard example, and it is the one to learn first, because the proof that it works is the proof that the technique works.

## Problem motivation

A warehouse has $n \le 10^5$ pallets on the floor, given as points. The supervisor wants to know the greatest distance between any two pallets, because that distance is the length of the longest rod that has to fit between them.

The naive baseline checks every pair. There are $\binom{n}{2}$ pairs, which is $5 \times 10^9$ at $n = 10^5$, and each check is a subtraction, a multiplication and a comparison. The program runs for minutes.

The second baseline computes the convex hull first, which costs $O(n \log n)$, and then checks every pair of hull vertices. That is a real improvement when the hull is small, and it is still $O(h^2)$, which is $10^{10}$ at $h = 10^5$.

The third baseline is the right one. Once the points are on a convex polygon, the farthest pair is one of a small number of special pairs, and those pairs can be enumerated in one pass around the polygon. The pass costs $O(h)$, and the whole algorithm is $O(n \log n)$.

The improvement from $O(h^2)$ to $O(h)$ is not a constant factor. At $h = 10^5$ it is the difference between $10^{10}$ and $10^5$ operations.

## Recognition patterns

Rotating calipers is the right tool when the statement contains some of these phrases.

- "The farthest pair", "the greatest distance between two points", "the diameter".
- "The smallest rectangle that contains", "the minimum area bounding box of a rotated rectangle".
- "The largest triangle inside", "the maximum area triangle in a convex polygon".
- "The longest distance between two convex polygons", "the maximum distance between a point and a polygon".
- "The minimum width", "the maximum width", "the width of the convex shape".
- Two shapes, and a question about the extreme distance between them.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 10^5$ and the hull is computed | $O(n \log n)$ in total, which is instant |
| $h \le 10^5$ and the hull is given | $O(h)$ for the calipers |
| The shape is not convex | The hull must be computed first, and the result is the hull's answer, not the shape's |
| Only one pair of points is needed | A single pass over the hull is enough; the full sweep is $O(h)$ anyway |
| The answer is a distance and the coordinates are integers | Compare the squared distances and take the square root at the end |
| The coordinates reach $10^9$ | The cross product reaches $2 \times 10^{18}$, so a 64-bit type is needed and a 128-bit type is safer |
| The shape is a general simple polygon | The calipers do not apply, and the answer is not the hull's answer |
| The question is about the closest pair | The closest pair is not a hull question, and the answer is in the [closest pair](/algorithms/geometry/closest-pair) article |

The last row is the trap that the geometry index warns about. The farthest pair of a point set is a pair of hull vertices; the closest pair usually is not.

## Naive approach

The baseline is the double loop over the pairs.

```python
def diameter_quadratic(points):
    best = 0
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            d = (points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2
            best = max(best, d)
    return best
```

This is correct and it is the reference implementation for a differential test. It is $O(n^2)$ and it is the answer when $n \le 2000$.

The second baseline is the hull followed by the double loop over the hull vertices, which is the same argument with a smaller $n$.

The third baseline is the one that is tempting and wrong: take the point with the smallest $x$ and the point with the largest $x$, and call the distance between them the diameter. It is cheap and it is wrong, and the counterexample is in the failure section below.

## Key insight

The insight is that **the farthest pair of a convex polygon is an antipodal pair, and there are only linearly many of those.**

Two vertices $u$ and $v$ of a convex polygon are **antipodal** when there are two parallel supporting lines of the polygon, one through $u$ and one through $v$. A supporting line is a line that touches the polygon and has the whole polygon on one side of it.

Why is the diameter antipodal? Let $p$ and $q$ be the farthest pair, and draw the line through $q$ perpendicular to the segment $pq$. If that line were not a supporting line, some vertex $r$ of the polygon would lie beyond it, on the side away from $p$, and then $|r - q| > |p - q|$, contradicting that $p$ and $q$ are the farthest pair. The same argument applied at $p$ shows that the line through $p$ perpendicular to $pq$ is also a supporting line. The two lines are parallel, so $p$ and $q$ are antipodal.

The second insight is that **the antipodal vertex advances monotonically as the edge advances.** For each edge of the polygon, there is one vertex directly opposite it, the one that maximizes the distance to the line through the edge. As the edge moves around the polygon, the opposite vertex also moves around the polygon, and it never moves backward. The proof is geometric: as a line rotates while staying a supporting line, the point of contact moves around the polygon in one direction, and so does the point of contact of the parallel line on the other side.

The third insight is that **the diameter is found among the antipodal pairs, and there are only $O(h)$ of them to look at.** For each edge $v_i v_{i+1}$ and its opposite vertex $v_j$, the pairs $(v_i, v_j)$ and $(v_{i+1}, v_j)$ are antipodal, and the farthest pair of the polygon is one of them.

## Formal model

Let $P$ be a convex polygon with vertices $v_0, v_1, \ldots, v_{h-1}$ in counterclockwise order.

::: math definition Definition
A line is a **supporting line** of $P$ when it meets $P$ and the whole polygon lies in one of its closed half-planes. Two vertices $u$ and $v$ of $P$ are an **antipodal pair** when there are two parallel supporting lines of $P$, one through $u$ and the other through $v$. The vertex $\operatorname{opp}(i)$ opposite the edge $v_i v_{i+1}$ is the vertex that maximizes the distance to the line through that edge, that is, the vertex maximizing $\operatorname{cross}(v_i, v_{i+1}, v_j)$.
:::

::: math definition Definition
The **diameter** of a set of points is the greatest distance between any two of them, and the **diameter pair** is a pair attaining it.
:::

::: math lemma Lemma
If $p$ and $q$ are a diameter pair of a convex polygon, then they are an antipodal pair.
:::

::: math proof Proof
Draw the line $\ell_q$ through $q$ perpendicular to the segment $pq$. If $\ell_q$ were not a supporting line, there would be a vertex $r$ of the polygon strictly on the other side of $\ell_q$ from $p$. The distance from $r$ to $q$ would then exceed the distance from $p$ to $q$, because $p$ lies on the perpendicular to $\ell_q$ through $q$ and the distance from a point to $q$ grows as the point moves away from that perpendicular. That contradicts the fact that $p$ and $q$ are a diameter pair, so $\ell_q$ is a supporting line.

The same argument at $p$ shows that the line $\ell_p$ through $p$ perpendicular to $pq$ is a supporting line. The lines $\ell_p$ and $\ell_q$ are both perpendicular to $pq$, so they are parallel, and each passes through one of the two vertices. Hence $p$ and $q$ are an antipodal pair. $\square$
:::

::: math lemma Lemma
As the edge index $i$ advances around the polygon, the opposite index $\operatorname{opp}(i)$ never decreases, once the indices are read on a circle. Equivalently, the total number of steps taken by the opposite pointer over a full turn of the edge pointer is at most $2h$.
:::

::: math proof Proof
The line through $v_i v_{i+1}$ rotates monotonically as $i$ advances, because the edges of a convex polygon turn in one direction. The supporting line parallel to it on the other side of the polygon touches a vertex whose index moves in the same direction, because the contact point of a rotating supporting line moves around a convex boundary in one direction and never reverses. The contact can only change when the rotating line passes a vertex, and at that moment the two candidate vertices are adjacent, so the index advances by one. Over a full turn of the edge pointer the line turns through $2\pi$, and the opposite pointer makes one full turn as well, so the total number of steps is at most $h$ per direction and at most $2h$ in total. $\square$
:::

::: math invariant Invariant
At the start of the iteration for the edge $v_i v_{i+1}$, the opposite pointer $j$ satisfies $\operatorname{cross}(v_i, v_{i+1}, v_j) \ge \operatorname{cross}(v_i, v_{i+1}, v_{j-1})$ and $\operatorname{cross}(v_i, v_{i+1}, v_{j+1}) \le \operatorname{cross}(v_i, v_{i+1}, v_j)$, so $j$ is a maximizer of the distance to the line through the edge. The inner loop restores this invariant for the next edge, and the loop is the only place where $j$ moves, so the total movement of $j$ over the whole sweep is $O(h)$.
:::

## Algorithm derivation

The sweep keeps two pointers. The first walks over the edges, the second walks over the opposite vertices.

```python
def diameter_calipers(hull):
    h = len(hull)
    best = 0
    j = 1
    for i in range(h):
        ni = (i + 1) % h
        while cross(hull[ni] - hull[i], hull[(j + 1) % h] - hull[i]) > \
              cross(hull[ni] - hull[i], hull[j] - hull[i]):
            j = (j + 1) % h
        best = max(best, dist2(hull[i], hull[j]), dist2(hull[ni], hull[j]))
    return best
```

The `while` loop advances the opposite pointer while the area of the triangle grows. The area of the triangle $v_i v_{i+1} v_j$ is $\frac{1}{2} \operatorname{cross}(v_i, v_{i+1}, v_j)$, so the comparison is a comparison of doubled areas, and no division is needed.

The initialization `j = 1` is safe because the loop only advances, and the areas around the polygon are unimodal in $j$ for a fixed edge, so the loop finds the maximum. The loop must be written so that it stops: the area function is unimodal, so the strict inequality eventually fails.

The two distance checks per edge are the two antipodal pairs that the edge generates. One of them is the diameter pair, and the theorem below proves it.

The whole sweep is linear because both pointers move forward. The first pointer moves $h$ times and the second moves at most $2h$ times, so the number of iterations of the inner loop over the whole run is $O(h)$.

## Step-by-step execution

Take the convex quadrilateral with vertices $v_0 = (0,0)$, $v_1 = (4,0)$, $v_2 = (5,3)$ and $v_3 = (1,4)$, in counterclockwise order. The squared distances between the pairs are $16$, $34$, $17$, $10$, $25$ and $17$, so the diameter is $\sqrt{34}$, from $v_0$ to $v_2$.

**Edge 0**, from $v_0 = (0,0)$ to $v_1 = (4,0)$. The doubled areas are $\operatorname{cross}(v_0, v_1, v_2) = 12$ and $\operatorname{cross}(v_0, v_1, v_3) = 16$. The opposite vertex is $v_3$, and the candidate distances are $|v_0 v_3|^2 = 17$ and $|v_1 v_3|^2 = 25$.

**Edge 1**, from $v_1 = (4,0)$ to $v_2 = (5,3)$. The doubled areas are $\operatorname{cross}(v_1, v_2, v_3) = 13$ and $\operatorname{cross}(v_1, v_2, v_0) = 12$. The opposite vertex is still $v_3$, and the candidates are $|v_1 v_3|^2 = 25$ and $|v_2 v_3|^2 = 17$.

**Edge 2**, from $v_2 = (5,3)$ to $v_3 = (1,4)$. The doubled areas are $\operatorname{cross}(v_2, v_3, v_0) = 17$ and $\operatorname{cross}(v_2, v_3, v_1) = 13$. The opposite vertex is now $v_0$, and the candidates are $|v_2 v_0|^2 = 34$ and $|v_3 v_0|^2 = 17$. The value $34$ is the largest seen so far.

**Edge 3**, from $v_3 = (1,4)$ to $v_0 = (0,0)$. The doubled areas are $\operatorname{cross}(v_3, v_0, v_1) = 16$ and $\operatorname{cross}(v_3, v_0, v_2) = 17$. The opposite vertex is $v_2$, and the candidates are $|v_3 v_2|^2 = 17$ and $|v_0 v_2|^2 = 34$. The value $34$ is confirmed.

The opposite pointer visited the indices $3$, $3$, $4$ and $6$, counting $v_0$ as the index $4$ and $v_2$ as the index $6$ after the wrap. It moved forward five steps in total, over four edges, and that is the monotonicity that makes the sweep linear.

## Correctness proof

::: math theorem Theorem
The rotating calipers sweep returns the squared diameter of the convex polygon.
:::

::: math proof Proof
**The loop finds the opposite vertex.** Fix an edge $v_i v_{i+1}$. The values $\operatorname{cross}(v_i, v_{i+1}, v_j)$ over the vertices $j$ are proportional to the signed distances from the vertices to the line through the edge, and for a convex polygon in counterclockwise order these values are unimodal in $j$: they increase to a maximum and then decrease, with no local maximum before the global one. The inner loop advances $j$ while the next value is larger, so it stops exactly at a maximizer, which is the opposite vertex. By the invariant in the panel, the pointer is at a maximizer for every edge.

**The examined pairs include the diameter pair.** Let $p$ and $q$ be a diameter pair. By the lemma they are antipodal, so there are two parallel supporting lines through them. Rotate this pair of parallel lines continuously. The two contact points move along the boundary of the polygon and remain at vertices, except at the finitely many angles at which one of the lines lies along an edge. Because the normal cones of $p$ and $q$ are angular intervals and the direction perpendicular to $pq$ lies in both of them, a rotation of the lines stays with $p$ and $q$ as the contact points until one of the lines reaches an edge of the polygon. At that moment the first line lies along the edge $v_i v_{i+1}$ with $p$ one of its endpoints, and the second line still touches $q$, so $q$ is the opposite vertex of that edge. The pair $(p, q)$ is therefore one of the two pairs examined for that edge, and the algorithm computes its distance.

**The maximum is the diameter.** Every examined pair is a pair of vertices, so its distance is at most the diameter. The diameter pair is among the examined pairs, so the maximum over the examined distances is exactly the diameter. $\square$
:::

## Complexity analysis

Let $n$ be the number of input points and $h$ the number of hull vertices.

| Stage               | Time          | Space  |
| ------------------- | ------------- | ------ |
| Sorting the points  | $O(n \log n)$ | $O(n)$ |
| Building the hull   | $O(n)$        | $O(h)$ |
| The calipers sweep  | $O(h)$        | $O(1)$ |
| The whole algorithm | $O(n \log n)$ | $O(n)$ |

The sweep is linear because both pointers move forward, and the total movement of the opposite pointer is at most $2h$. The inner loop therefore does not make the algorithm quadratic even though it looks like a nested loop: the same vertex can be tested many times, but the pointer only moves forward, and each of its moves is charged to one of the $h$ edges.

The arithmetic is the other bound worth naming. The cross product reaches $2C^2$ for coordinates of magnitude $C$, and the squared distance reaches $2C^2$ as well. For $C = 10^9$ that is $2 \times 10^{18}$, which is close to the limit of a signed 64-bit integer, and a 128-bit intermediate is the safe choice.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The diameter of a point set | The hull, then rotating calipers |
| The minimum enclosing rectangle | The hull, then rotating calipers over the edges |
| The largest triangle inside a convex polygon | Rotating calipers over the edges |
| The maximum distance between two convex polygons | Two caliper sweeps, one per polygon |
| The minimum width of a convex shape | Rotating calipers over the edges |
| The closest pair of points | The divide and conquer algorithm, not the calipers |
| The extreme points of a set | The [convex hull](/algorithms/geometry/convex-hull) alone |
| A non-convex shape | The hull, and the answer is the hull's answer |
| Many queries about the same hull | The hull once, and then the calipers per query |

The eighth row is the one to be careful about. The diameter of a non-convex shape is not the diameter of its hull in general, and when the problem gives a non-convex shape the hull's answer is an upper bound rather than the answer.

## Recursion decision

The calipers sweep is a pair of pointers walking around an array, and it should stay that way.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; there is no recursion in the sweep at all |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative; a recursive version would need $h$ frames and would overflow at once |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The sweep has no recursion whatsoever, and the theorem is a statement about the state of two pointers rather than about a call stack. The hull itself is built by the monotone chain of the [convex hull](/algorithms/geometry/convex-hull) article, which is also iterative, and the divide-and-conquer hull that article describes has depth $O(\log n)$ and is a safe recursive form.

The one thing to avoid is a recursive version of the calipers that calls itself for the next edge. It would have depth $h$, and it would rebuild the state at every level, which is exactly the state the two pointers already hold.

## Implementation walkthrough

Three lines decide whether the sweep is right.

```python
while cross(hull[ni] - hull[i], hull[(j + 1) % h] - hull[i]) > \
      cross(hull[ni] - hull[i], hull[j] - hull[i]):
    j = (j + 1) % h
```

The comparison must be a strict inequality. With a non-strict one, the loop runs forever on a polygon with a flat side, because two adjacent vertices can have the same area against the edge.

The `cross` here is a function of two difference vectors, and it is $\frac{1}{2} \operatorname{cross}(v_i, v_{i+1}, v_j)$, which is the same thing up to a positive factor. Using the difference vectors avoids computing three absolute coordinates when two differences would do.

The `best = max(best, dist2(hull[i], hull[j]), dist2(hull[ni], hull[j]))` line checks two pairs and not one. The diameter pair may be $(v_i, v_j)$ or $(v_{i+1}, v_j)$, and the algorithm does not know which in advance. Checking only one of them misses the diameter on half of the polygons.

The squared distance is used rather than the distance, so that the comparison is exact and no square root is taken until the very end.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Checking only one of the two pairs per edge | The diameter is missed on some polygons | Check both $(v_i, v_j)$ and $(v_{i+1}, v_j)$ |
| Using a non-strict inequality in the inner loop | The loop never ends on a flat side | Use a strict comparison |
| Forgetting the wrap around | The pointer stops at the end of the array | Index with a modulo |
| Taking the distance instead of the squared distance | The square root loses precision, and the comparison is slower | Compare the squares and take the root at the end |
| Applying the technique to a non-convex shape | The answer is the hull's answer | Compute the hull first and say so |
| Assuming the closest pair is a hull pair | The answer is wrong | The closest pair needs its own algorithm |
| Assuming the diameter pair is opposite by index | The answer is wrong on an irregular polygon | Use the antipodal sweep |
| Computing the cross product in `double` | A rounding error changes which vertex is opposite | Use integers and a 64-bit or 128-bit type |

### Why this fails: the extreme coordinates are not the extreme pair

The plausible wrong approach is to find the point with the smallest $x$ and the point with the largest $x$, and to report their distance as the diameter. It is cheap, it uses two linear scans, and it is the shape of the argument that "the farthest points are the ones that are furthest apart in some direction".

The smallest counterexample is three points: $(0,0)$, $(1,10)$ and $(2,0)$. The extreme $x$ points are $(0,0)$ and $(2,0)$, whose distance is $2$. The diameter is the distance from $(0,0)$ to $(1,10)$, which is $\sqrt{101}$, about $10.05$. The middle point in $x$ is the farthest point from both of the others, and the extreme-coordinate rule misses it entirely.

Two points is not enough to expose the bug, because with two points they are always both the extreme-coordinate pair and the diameter pair. Three is the smallest number of points at which the two can differ, and the example above is the smallest configuration in which they do.

The second failure in the same family is the "longest diagonal" rule. The plausible argument is that the diameter of a convex polygon is realized by two non-adjacent vertices, so the answer is the longest diagonal, and the "opposite by index" version of the same argument pairs $v_i$ with $v_{i + h/2}$.

Both are wrong on the same example. Take the convex quadrilateral with vertices $(-50,0)$, $(50,0)$, $(40,1)$ and $(-40,1)$, in counterclockwise order. The sides have lengths $100$, $\sqrt{101}$, $80$ and $\sqrt{101}$, and the two diagonals have length $\sqrt{8101}$, about $90.006$. The diameter is $100$, between $(-50,0)$ and $(50,0)$, and those two vertices are **adjacent**. The longest diagonal and the opposite-by-index pair both report about $90$, which is wrong by a factor of more than ten percent.

The lesson generalizes: **an extreme of a projection is not an extreme of a distance, and the diameter of a convex polygon need not be a diagonal.** The same distinction separates the farthest pair, which the calipers find, from the closest pair, which is not a hull question at all. The [closest pair](/algorithms/geometry/closest-pair) article exists because the hull does not answer it.

## Variants and extensions

- **The minimum enclosing rectangle.** Every minimum-area enclosing rectangle of a convex polygon has one side flush with an edge of the polygon, so the sweep over the edges gives $h$ candidate rectangles, and the smallest area is the answer.
- **The largest inscribed triangle.** Every largest triangle in a convex polygon has a side along an edge of the polygon, so the same sweep gives $h$ candidates, and the largest area is the answer.
- **The minimum width.** The width of a polygon in a direction is the distance between the two supporting lines in that direction, and the minimum over all directions is attained at a direction parallel to an edge, so the sweep gives the answer.
- **The maximum distance between two convex polygons.** Two sweeps, one for each polygon, and then a merge of the two antipodal sequences.
- **The farthest point from a query point.** The same sweep, with the query point replacing the distance function.
- **The maximum perimeter triangle.** The same structure with the perimeter instead of the area, which is a common contest variant.
- **The convex hull trick.** A different technique that shares the name and nothing else; it is the lower envelope of a set of functions, and it is in [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- **The antipodal pairs as a stream.** The sweep produces the antipodal pairs in order, which is what lets it be used inside a sweep line.

## Contest strategy

1. Compute the convex hull first, unless the shape is already given as a convex polygon. The hull is the input the calipers need.
2. Make sure the hull vertices are in counterclockwise order. The calipers sweep depends on the direction, and a clockwise hull gives the wrong monotonicity and a wrong answer.
3. Use the squared distance for the comparison and take the square root at the end.
4. Check both pairs per edge.
5. Initialize the opposite pointer to a vertex that is not the current edge, and be ready for the wrap around: the modulo on the indices is not optional.
6. Compare the result against the quadratic version on random point sets of at most $200$ points. A disagreement is a direction error or a missing pair.
7. Size the type for $2C^2$. With coordinates of magnitude $10^9$, use a 64-bit type and check that the intermediate does not exceed it; with larger coordinates use a 128-bit type.

## Worked problems

### Problem 1: the diameter of a point set

**Restatement.** Given $n \le 10^5$ points, report the greatest distance between any two of them, and the pair attaining it.

**Naive baseline.** The quadratic double loop, $O(n^2)$ time, which is $5 \times 10^9$ pairs.

**Insight.** The diameter pair is a pair of hull vertices, and it is an antipodal pair of the hull.

**Derivation.** Compute the convex hull, then sweep: for each edge, advance the opposite pointer to the vertex maximizing the area, and check the two candidate pairs.

**Correctness.** The theorem above proves that the sweep examines the diameter pair, and the hull lemma proves that the diameter of the point set is the diameter of its hull.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, against $O(n^2)$.

**Common wrong approach.** Taking the two points with the extreme $x$ coordinates, which misses the diameter whenever the farthest point is not one of them.

### Problem 2: the minimum enclosing rectangle

**Restatement.** Given a convex polygon, find the axis-aligned rectangle of smallest area that contains it, and report the rectangle.

**Naive baseline.** For every direction, compute the bounding box of the polygon in that direction and take the smallest, which is $O(h^2)$ over all pairs of directions.

**Insight.** A minimum-area enclosing rectangle has one side flush with an edge of the polygon, so only $h$ directions have to be tried.

**Derivation.** For each edge $v_i v_{i+1}$, take the direction of the edge as the $x$-axis, project every vertex onto that axis and onto the perpendicular, and form the bounding box of the projections. The smallest of the $h$ boxes is the answer. The projection extremes can be maintained with the calipers, which is what makes the whole thing $O(h)$ rather than $O(h^2)$.

**Correctness.** The theorem that a minimum enclosing rectangle has a side flush with an edge is the standard result for convex polygons, and the bounding box in the edge's frame is the smallest rectangle with that orientation.

**Complexity.** $O(n \log n)$ with the hull, then $O(h)$ for the sweep.

**Common wrong approach.** Returning the axis-aligned bounding box, which is a valid enclosing rectangle but is not the smallest one unless the polygon is axis-aligned.

### Problem 3: the largest triangle inside a convex polygon

**Restatement.** Given a convex polygon with $h$ vertices, find the triangle of largest area whose vertices are vertices of the polygon.

**Naive baseline.** Enumerate all $\binom{h}{3}$ triangles, which is $O(h^3)$.

**Insight.** A largest inscribed triangle has a side along an edge of the polygon, so for each edge the third vertex is the one opposite it, and the opposite vertex is exactly what the calipers sweep produces.

**Derivation.** For each edge $v_i v_{i+1}$, the opposite pointer gives the vertex $v_j$ maximizing $\operatorname{cross}(v_i, v_{i+1}, v_j)$, which is the area of the triangle times two. The maximum over the edges is the answer.

**Correctness.** The same theorem that gives the diameter says that the largest inscribed triangle has a side along an edge, and the opposite vertex maximizes the area for that edge.

**Complexity.** $O(h)$ after the hull.

**Common wrong approach.** Taking the triangle with vertices at the extreme $x$ and $y$ values, which is the same mistake as the extreme-coordinate version of the diameter.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is an extreme-pair question about a convex shape, and check whether the shape is convex.
2. **Direct application.** Implement the calipers sweep for the diameter, and check it against the quadratic version on random point sets of at most $200$ points.
3. **Adaptation.** Write the sweep for the minimum enclosing rectangle and for the largest inscribed triangle, and for the minimum width.
4. **Combination.** Combine the calipers with the [convex hull](/algorithms/geometry/convex-hull) to get the diameter of a point set, and with a [sweep line](/algorithms/geometry/sweep-line) to answer a question about two moving shapes.
5. **Challenge.** Solve the maximum distance between two convex polygons, where two antipodal sequences have to be merged, and check the answer against the quadratic version.
6. **Transfer.** Recognize the technique in another subject: the width of a convex shape, the maximum distance in a point set, the largest perimeter polygon, and the sliding window maximum, which is the same monotone pointer idea in one dimension.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Define an antipodal pair and a supporting line. (Formal model)
2. Prove that a diameter pair is antipodal. (Formal model)
3. Why does the opposite pointer never move backward? (Formal model)
4. What invariant does the inner loop maintain? (Formal model)
5. Why does the algorithm check two pairs per edge? (Implementation walkthrough)
6. Why is the sweep linear even though it has a nested loop? (Complexity analysis)
7. Give the smallest counterexample to the extreme-coordinate rule for the diameter. (Common mistakes)
8. Why is the closest pair not a hull question? (Algorithm selection)
9. Trace the sweep on the four-vertex example and name the opposite vertex for each edge. (Step-by-step execution)
10. What theorem makes the minimum enclosing rectangle a sweep problem? (Variants and extensions)
11. What type does the cross product need, and why? (Complexity analysis)
12. Why must the hull be in counterclockwise order? (Contest strategy)

## Further reading

- The convex hull that the calipers sweep over, and the monotone chain that builds it, are in [convex hull](/algorithms/geometry/convex-hull).
- The sweep line whose active set is a similar structure, and whose monotone pointer idea is the same one, is in [sweep line](/algorithms/geometry/sweep-line).
- The closest pair of points, which is the extreme-pair question that the hull does not answer, is in [closest pair](/algorithms/geometry/closest-pair).
- The convex hull trick, a different technique that shares the name, is in [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The monotone two-pointer technique in one dimension, which is the direct ancestor of the calipers, is in [two pointers](/algorithms/searching/two-pointers).
- The sliding window maximum, which is the same monotone pointer idea in a different setting, is in [sliding window](/algorithms/searching/sliding-window).
- The subject index lists this technique, [rotating calipers](/algorithms/geometry/rotating-calipers), beside the geometry it does not yet cover: [the computational geometry](/algorithms/geometry/).
