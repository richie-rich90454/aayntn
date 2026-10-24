---
id: geometry.half-plane-intersection
title: Line arrangements and the half-plane intersection
summary: Intersect a family of integer linear inequalities exactly, keep the feasible polygon as a list of its supporting lines, and report twice its area or prove that the region is unbounded.
division: [platinum]
subjects: [geometry]
level: advanced
importance: advanced-technique
keywords:
    [
        half-plane intersection,
        linear inequalities,
        feasible region,
        kernel,
        convex polygon,
        exact rational arithmetic,
        line arrangement,
    ]
prerequisites:
    required: [geometry.convex-hull, foundations.sorting]
    recommended: [geometry.robust-predicates, geometry.integer-geometry, foundations.complexity]
complexity:
    time: "O(n^2) for the reference clipping, O(n log n) with the angular sweep"
    space: "O(n)"
assumptions:
    - Every constraint is a closed half-plane $a x + b y \le c$ with integer coefficients.
    - The coefficients satisfy $|a|, |b| \le 100$ and $|c| \le 10^4$, so every clipping predicate fits in a signed 64-bit integer.
    - An empty feasible region is reported as zero, because it is bounded and has no area, and twice the area of a nonempty bounded region is an integer on the judge data.
implementations: geometry.half-plane-intersection
reviewed: false
---

## At a glance

A **half-plane** is the set of points on one side of a line. With integer coefficients $a$, $b$ and $c$, the closed half-plane is

$$
H(a,b,c) = \lbrace (x,y) : a x + b y \le c \rbrace .
$$

The **feasible region** of a family of half-planes is their intersection

$$
P = \bigcap_{i=1}^{n} H(a_i,b_i,c_i).
$$

Each inequality is a wall, and $P$ is the set of points that is on the allowed side of every wall. The intersection of convex sets is convex, so $P$ is either empty, a single point, a segment, a ray, or a convex polygon. The problem is to find which of those cases holds and, when $P$ is a bounded polygon, to compute its area.

The page develops three ideas.

1. **The boundary is made of input lines.** If $P$ has positive area, every edge of $P$ lies on one of the $n$ lines $a_i x + b_i y = c_i$. The lines that actually support an edge are the **active** lines; all the others are redundant.
2. **The active lines appear in angular order.** Sort the lines by the direction of their boundary, and the active lines form a contiguous block in that circular order. An angular sweep with a deque adds and removes each line once, which gives $O(n \log n)$ time.
3. **The area is rational and can be kept exact.** A vertex is the intersection of two integer lines, so its coordinates are rationals with integer numerators and denominators. The shoelace sum therefore stays rational, and a program that reduces fractions with the gcd never rounds.

The reference programs use a fourth, equivalent view. A convex polygon can be stored **in the dual**: as the cyclic list of the lines that support its edges, with the vertices implicit as the intersections of consecutive lines. Clipping the polygon by a new half-plane then becomes a walk over that list, with no coordinate arithmetic at all. The six listings use this dual clip because it handles the empty case, the degenerate case and the bounded case with one invariant.

Boundedness is not an afterthought. A feasible region can be empty, a point, a segment, a ray, a strip, a wedge, or a bounded polygon, and the answer for an unbounded region is not an area. The page gives an exact test: the region is unbounded exactly when there is a nonzero direction $d$ that satisfies every homogeneous inequality $a_i d_x + b_i d_y \le 0$. That direction is a ray along which the whole region can escape.

## Problem motivation

A gallery has walls made of straight segments, and a security camera has to see every point of every wall. A point $p$ sees the whole gallery exactly when, for every wall, $p$ is on the same side of the wall's line as the gallery's interior. Each wall therefore forbids one half-plane, and the set of good camera positions is the intersection of the allowed half-planes. That intersection is the **kernel** of the polygon. If it is empty, no single camera works; if it has positive area, the camera can be placed anywhere in it.

The same shape appears under many names.

- A linear program with two variables asks for a point satisfying $a_i x + b_i y \le c_i$, which is a half-plane intersection. The feasible set of a two-variable linear program is exactly the object of this page.
- A robot that must stay on one side of each of several fences has a feasible region that is a half-plane intersection.
- A polygon is **star-shaped** when it has a nonempty kernel, and the kernel is the intersection of the half-planes of its edges.
- Two convex polygons intersect in a convex polygon, and the intersection can be computed by clipping one of them with the half-planes of the other.
- A set of linear constraints with an objective asks for the vertex of the feasible region that is extreme in a direction, which is linear programming rather than pure feasibility.

The naive approach is to enumerate all intersections of pairs of lines, keep the ones that satisfy every constraint, and sort the survivors by angle. There are $\binom{n}{2}$ pairs, and testing each candidate against all $n$ constraints costs $O(n^3)$ time. For $n = 1500$, as in the gallery problem, that is about $3 \times 10^9$ tests, which is too many. The structure of the answer is much smaller than the number of pairs: the boundary has at most $n$ edges, and each input line contributes at most one of them.

There is a second reason the problem is not just a pair enumeration. The number of vertices is not the only output; the area requires the vertices in cyclic order, and a boundedness test requires knowing whether the polygon closes at all. A program that computes a set of vertices without their order has thrown away the information that makes the area and the boundedness check easy.

## Recognition patterns

The half-plane intersection is the right tool when the statement contains some of these phrases.

- "Satisfy all of the following inequalities", "the feasible region", "the set of allowed points".
- "On one side of every line", "the inward side of each edge", "the kernel of the polygon".
- "A point from which the whole polygon is visible", "a camera position", "a guard that sees every wall".
- "The area of the region defined by the constraints", "the polygon cut out by the lines".
- "Intersect the convex polygons", "clip the polygon by the line".
- "Two-variable linear program", "the constraints have the form $a x + b y \le c$".
- "The region is unbounded", "there is no finite answer", "report that no placement exists".

The constraint values that decide the technique:

| Situation | What it rules |
| --- | --- |
| $n \le 200$ | The $O(n^2)$ clip or the $O(n^3)$ pair enumeration is affordable |
| $n \le 10^5$ | Only the $O(n \log n)$ angular sweep is fast enough |
| The coefficients are small integers | Exact integer arithmetic and a fraction accumulator are practical |
| The coefficients are large integers | The determinants need 64-bit or 128-bit arithmetic |
| The coordinates are decimals | Scale them to integers first, or use a tolerant floating-point version |
| The region may be empty | The clip and the area routine need an explicit empty case |
| The region may be unbounded | The area is undefined and the program needs a separate boundedness test |
| The region may be a point or a segment | The area is zero, but the feasibility answer may still be yes |
| The answer is a decimal area | The exact fraction has to be rounded at the end |
| The answer is twice the area | The shoelace sum can be kept as a fraction and printed exactly |

The last two rows are different problems. A judge that wants the area to two decimal places can use the rational core and round once; a judge that wants twice the area as an integer can avoid the division entirely. The reference programs follow the second convention, and they also print the exact fraction when the value is not integral, so the same code answers both questions.

The phrase that rules the technique out is "the constraints are nonlinear". A circle, a parabola or a product of variables does not define a half-plane, and the intersection is no longer a polygon. The phrase that rules it in, quietly, is "each wall is straight": a straight wall has one line, and one line has two sides.

## Naive approach

The baseline enumerates every pair of boundary lines, computes the intersection of the two, and keeps the point when it satisfies every inequality.

```cpp
std::vector<Point> candidate_vertices(const std::vector<Line>& lines) {
    std::vector<Point> vertices;
    for (std::size_t i = 0; i < lines.size(); i++) {
        for (std::size_t j = i + 1; j < lines.size(); j++) {
            if (cross(lines[i].a, lines[i].b, lines[j].a, lines[j].b) == 0) {
                continue;
            }
            Point p = intersect(lines[i], lines[j]);
            bool feasible = true;
            for (const Line& line : lines) {
                if (line.a * p.x + line.b * p.y > line.c) {
                    feasible = false;
                    break;
                }
            }
            if (feasible) {
                vertices.push_back(p);
            }
        }
    }
    return vertices;
}
```

The cost is $\binom{n}{2}$ pairs times $n$ checks, which is $O(n^3)$. At $n = 200$ it is about $4 \times 10^6$ checks and is fine. At $n = 1500$ it is about $1.7 \times 10^9$ checks, and at $n = 10^5$ it is $10^{15}$, which is hopeless.

The output of the baseline is also not yet the answer. The surviving points are the vertices of the feasible region, but they are in no particular order. Sorting them by angle around their centroid gives the cyclic order, and then the shoelace sum gives the area, but the sort is another $O(n \log n)$ step and the centroid has to be chosen carefully when the region is degenerate. The baseline is a useful differential test on small inputs, not a solution.

A second baseline clips a large bounding box by the half-planes one at a time. That is the algorithm the reference programs use, and it costs $O(n^2)$ because each clip walks the current polygon. The difference between the two baselines is the difference between enumerating the vertices and maintaining them.

A third baseline treats the problem as a linear program and runs the simplex method. That is correct and fast in practice, but it is a much larger piece of machinery than a two-dimensional intersection needs, and the exactness of the output is harder to guarantee.

## Key insight

The insight is that **the boundary of the feasible region is a contiguous arc of the input lines, and a line that is not on the boundary can be discarded once and for all**.

Take a bounded region $P$ with positive area. Walk around its boundary counterclockwise. Every edge lies on one of the input lines. The lines appear in the order of their directions, which is the order of the angles of the vectors $d_i = (-b_i, a_i)$ that run along them. A line that is not active never appears, and an active line appears exactly once. The active set is therefore a subsequence of the circular order, and it is contiguous in the sense that the sweep meets the lines in that order and keeps a window of them.

The window is a deque. When a new line arrives, it can make the previous line obsolete: if the intersection of the last two lines of the window is on the forbidden side of the new line, the middle line cannot be on the final boundary. That line is removed from the back. The same test at the front removes a line made obsolete at the other end. Each line is pushed once and popped at most once, so the whole sweep is linear after the sort.

The second form of the same insight is the **dual clip**. Instead of maintaining vertices, maintain the cyclic list of supporting lines. A vertex is the intersection of two consecutive lines. When a new half-plane cuts the polygon, it cuts away a contiguous block of the boundary: some vertices are outside, some are inside, and the boundary crosses the new line exactly twice. The lines whose both endpoints are outside disappear, the lines with at least one endpoint inside survive, and the new line is inserted at the exit. This is the same "each line enters and leaves once" statement, written without coordinates.

The third piece is exactness. A vertex of the intersection is the solution of a $2 \times 2$ linear system with integer coefficients, so it is a rational point. The shoelace sum of rational points is rational, and the gcd keeps every fraction in lowest terms. The program never needs a square root, a decimal approximation, or an epsilon. This is what makes the answer trustworthy even when the polygon is nearly degenerate.

## Visual intuition

Start with the square $0 \le x \le 4$ and $0 \le y \le 4$. Its four supporting lines are the bottom, right, top and left edges, in counterclockwise order. Every vertex is the intersection of two consecutive lines.

Add the constraint $x + y \le 5$. The line crosses the top edge at $(1,4)$ and the right edge at $(4,1)$, so it cuts off the corner triangle with legs of length $3$. The remaining polygon has five vertices:

$$
(0,0), \quad (4,0), \quad (4,1), \quad (1,4), \quad (0,4).
$$

Its shoelace double area is $23$. The new line is inserted between the right edge and the top edge in the cyclic list, and the corner vertex $(4,4)$ disappears. Nothing else changes.

The normal $(a,b)$ of the line $a x + b y = c$ points toward the forbidden side, because increasing $a x + b y$ leaves the half-plane. The boundary direction $d = (-b,a)$ has the allowed side on its left. That is the convention the programs use: a line is a wall, the feasible side is the left side of $d$, and the orientation of $d$ is what the angular sweep sorts.

| Picture | What it means |
| --- | --- |
| One line | The region is a half-plane, which is unbounded |
| Two nonparallel lines | The region is a wedge, a strip or a half-plane, all unbounded |
| Two opposite parallel lines | The region is a strip, which is unbounded unless the strip has zero width |
| Three lines around a triangle | The region is bounded if the triangle is on the allowed side of all three |
| A line that cuts off a corner | The corner vertex disappears and one new edge appears |
| A line that misses the polygon | The line is redundant and is not inserted |
| A line that leaves only a point | The polygon collapses to a point, with area zero |
| A line that leaves nothing | The region is empty, and the area is zero |

The bounded case has a useful visual test: stand at a vertex and look along each incident edge. If the region is bounded, every direction is blocked by some line. If there is a direction that leaves every constraint satisfied, the region escapes to infinity along that direction. The recession test in the article is exactly this picture, written as a dot product.

## Formal model

A **line** is a triple $(a,b,c)$ of integers with $(a,b) \ne (0,0)$. Its **supporting line** is the set of points satisfying $a x + b y = c$. The **closed half-plane** of the line is $H(a,b,c) = \lbrace (x,y) : a x + b y \le c \rbrace$. The **direction** of the line is $d = (-b,a)$, and the normal is $n = (a,b)$.

::: math definition Definition
A set $C \subseteq \mathbb{R}^2$ is **convex** when the segment between any two of its points lies in $C$. A **half-plane intersection** is a set of the form

$$
P = \bigcap_{i=1}^{n} H(a_i,b_i,c_i).
$$

The region is **bounded** when it is contained in some disc, and **unbounded** otherwise. A **vertex** of $P$ is a point of $P$ that is the intersection of two supporting lines and is not in the interior of a segment of $P$.
:::

::: math definition Definition
The **recession cone** of $P$ is

$$
R(P) = \lbrace d \in \mathbb{R}^2 : a_i d_x + b_i d_y \le 0 \text{ for every } i \rbrace .
$$

A nonzero $d \in R(P)$ is called a **recession direction**. It is the direction of a ray that starts at any point of $P$ and stays in $P$ forever.
:::

::: math lemma Lemma
Every half-plane is convex. The intersection of any family of convex sets is convex. Hence every half-plane intersection is convex.
:::

::: math proof Proof
If $p$ and $q$ are in $H(a,b,c)$ and $0 \le t \le 1$, then

$$
a(t p_x + (1-t) q_x) + b(t p_y + (1-t) q_y)
= t(a p_x + b p_y) + (1-t)(a q_x + b q_y)
\le t c + (1-t)c = c,
$$

so the segment from $p$ to $q$ is in the half-plane. For an intersection, a point of every set is a point of each set, and the same argument applies to each one. $\square$
:::

::: math lemma Lemma
Let $L_i$ and $L_{i+1}$ be two lines with $D = a_i b_{i+1} - a_{i+1} b_i \ne 0$. Their intersection is

$$
x = \frac{c_i b_{i+1} - c_{i+1} b_i}{D},
\qquad
y = \frac{a_i c_{i+1} - a_{i+1} c_i}{D}.
$$

The sign of the value of a third line $H(a,b,c)$ at that point is the sign of

$$
a(c_i b_{i+1} - c_{i+1} b_i) + b(a_i c_{i+1} - a_{i+1} c_i) - c D
$$

multiplied by the sign of $D$.
:::

::: math proof Proof
Cramer's rule on the system $a_i x + b_i y = c_i$, $a_{i+1} x + b_{i+1} y = c_{i+1}$ gives the displayed coordinates. Multiplying the inequality $a x + b y \le c$ by $D$ gives the displayed expression when $D > 0$, and reverses it when $D < 0$. $\square$
:::

::: math theorem Theorem
Let $P$ be a nonempty half-plane intersection. Then $P$ is bounded if and only if $R(P) = \lbrace 0 \rbrace$.
:::

::: math proof Proof
If $d \ne 0$ is in $R(P)$ and $p \in P$, then $p + t d \in P$ for every $t \ge 0$, so $P$ is unbounded. Conversely, if $P$ is unbounded, take a sequence $p_k \in P$ with $\lVert p_k \rVert \to \infty$. The directions $p_k / \lVert p_k \rVert$ lie on the unit circle, which is compact, so a subsequence converges to a unit vector $d$. For each $i$,

$$
a_i d_x + b_i d_y = \lim_{k} \frac{a_i (p_k)_x + b_i (p_k)_y}{\lVert p_k \rVert}
\le \lim_{k} \frac{c_i}{\lVert p_k \rVert} = 0,
$$

so $d \in R(P)$ and $d \ne 0$. $\square$
:::

The theorem is the reason the programs can decide boundedness without drawing a box. The naive test, "does the polygon touch the box", is only a test of the box, and it fails when the polygon is a segment or when the box is chosen too small. The recession cone is a property of the constraints themselves.

## Algorithm derivation

The angular sweep has four stages: normalize, sort, sweep, and read the answer. The reference programs replace the sort and the deque with the dual clip, but the invariants are the same.

**Normalize.** Divide $a$ and $b$ by $g = \gcd(|a|,|b|)$ and fix the sign so that either $b > 0$, or $b = 0$ and $a > 0$. The inequality becomes

$$
a' x + b' y \le \frac{c}{g},
$$

where $(a',b')$ is primitive and the offset is the rational $c/g$. Keep the pair $(c,g)$ instead of dividing, so the comparison of two parallel lines stays integral. Two lines with the same primitive normal are parallel and point the same way; the one with the smaller offset $c/g$ is the more restrictive, and the other can be dropped.

**Sort.** Sort the lines by the angle of $d = (-b,a)$. With the canonical sign, every direction lies in the half-open interval from $(0,1)$ to $(0,-1)$ going counterclockwise, so the cross product

$$
d_1 \times d_2 = d_{1x} d_{2y} - d_{1y} d_{2x}
$$

is a strict weak order on that interval and no half-plane split is needed. The comparator must be exact: comparing angles with `atan2` or with a floating-point slope loses the order of two nearly parallel lines.

**Sweep.** Keep a deque of line indices. For each new line $h$:

- While the deque has at least two lines and the intersection of its last two lines is strictly outside $h$, pop the back.
- While the deque has at least two lines and the intersection of its first two lines is strictly outside $h$, pop the front.
- Push $h$.

After all lines have been processed, repeat the same two tests with the first and last lines to close the polygon. The surviving lines are the active lines, in counterclockwise order.

**Read the answer.** Compute the vertices as the intersections of consecutive surviving lines. If there are fewer than three lines, the region is empty or degenerate. Otherwise the shoelace sum gives twice the area. The boundedness test is the recession cone, applied to the original constraints rather than to the surviving lines, because a redundant constraint can still block a direction.

```cpp
std::vector<Line> half_plane_intersection(std::vector<Line> lines) {
    normalize_and_sort(lines);
    std::deque<int> window;
    for (int i = 0; i < static_cast<int>(lines.size()); i++) {
        while (window.size() >= 2 && outside(lines[i], lines[window[window.size() - 2]], lines[window.back()])) {
            window.pop_back();
        }
        while (window.size() >= 2 && outside(lines[i], lines[window[0]], lines[window[1]])) {
            window.pop_front();
        }
        window.push_back(i);
    }
    while (window.size() >= 3 && outside(lines[window[0]], lines[window[window.size() - 2]], lines[window.back()])) {
        window.pop_back();
    }
    while (window.size() >= 3 && outside(lines[window.back()], lines[window[0]], lines[window[1]])) {
        window.pop_front();
    }
    return collect(lines, window);
}
```

The helper `outside(h, u, v)` is true when the intersection of $u$ and $v$ is strictly on the forbidden side of $h$. The word "strictly" matters: a point on the boundary is allowed, and a strictly outside test keeps the closed region closed.

**The dual clip used by the reference programs.** The box is the initial polygon. Its lines are the four edges, in counterclockwise order: bottom, right, top, left. A polygon is a cyclic list $L_0,\ldots,L_{k-1}$ of lines, and the vertex $v_i$ is $L_i \cap L_{i+1}$, with indices modulo $k$. The edge from $v_{i-1}$ to $v_i$ lies on $L_i$. To clip by a new half-plane $H$:

1. Classify every vertex $v_i$ as inside when $a x_i + b y_i \le c$.
2. If every vertex is outside, the new region is empty.
3. Otherwise build a new list. For each $i$, with $j = i+1$ modulo $k$:
    - If $v_i$ or $v_j$ is inside, keep $L_j$. The edge on $L_j$ has a surviving piece.
    - If $v_i$ is inside and $v_j$ is outside, the boundary leaves the old polygon on this edge, so append $H$ after $L_j$.
4. The new list is again a cyclic list of supporting lines. A line that is completely outside is never appended; a line with a surviving piece is appended once; the new line is appended once, at the exit.

The clip does not compute a single coordinate. It only evaluates the sign of a linear function at an intersection of two lines, which is the determinant expression from the formal model. The area is computed once, at the end, from the vertices of the final list.

The box has to be large enough to contain every bounded answer. A vertex of a bounded region is the intersection of two input lines, so

$$
|x| \le \frac{|c_i b_j - c_j b_i|}{|a_i b_j - a_j b_i|}
\le 2 \max|a| \max|c|.
$$

Set

$$
M = 2 \max|a| \max|c| + 2.
$$

The box $[-M,M]^2$ contains every bounded feasible region, and it contains at least one point of every nonempty unbounded one. The clip therefore detects emptiness exactly. It does not detect boundedness; the recession test does that.

## Step-by-step execution

Take the three constraints

$$
x \ge 0, \qquad y \ge 0, \qquad x + 2y \le 6,
$$

written as half-planes:

$$
(-1,0,0), \qquad (0,-1,0), \qquad (1,2,6).
$$

The true region is the triangle with vertices $(0,0)$, $(6,0)$ and $(0,3)$, whose double area is $18$. The box is $[-M,M]^2$ with $M = 2 \ast 1 \ast 6 + 2 = 14$; the exact value of $M$ does not matter as long as it is larger than $6$.

**Start.** The line list is the box in counterclockwise order:

| Index | Line       | Edge             |
| ----- | ---------- | ---------------- |
| 0     | $(0,-1,M)$ | bottom, $y = -M$ |
| 1     | $(1,0,M)$  | right, $x = M$   |
| 2     | $(0,1,M)$  | top, $y = M$     |
| 3     | $(-1,0,M)$ | left, $x = -M$   |

The vertices are $(M,-M)$, $(M,M)$, $(-M,M)$ and $(-M,-M)$.

**Clip by $x \ge 0$.** The vertices on the right half are inside; the two left vertices are outside. The exit is on the top edge and the entry is on the bottom edge. The new list is right, top, the new line, bottom:

| List after the clip                          | Vertices                             |
| -------------------------------------------- | ------------------------------------ |
| $(1,0,M)$, $(0,1,M)$, $(-1,0,0)$, $(0,-1,M)$ | $(M,M)$, $(0,M)$, $(0,-M)$, $(M,-M)$ |

**Clip by $y \ge 0$.** The top two vertices are inside, the bottom two are outside. The list becomes top, the first new line, the second new line, right:

| List after the clip                          | Vertices                           |
| -------------------------------------------- | ---------------------------------- |
| $(0,1,M)$, $(-1,0,0)$, $(0,-1,0)$, $(1,0,M)$ | $(0,M)$, $(0,0)$, $(M,0)$, $(M,M)$ |

**Clip by $x + 2y \le 6$.** The vertex $(0,0)$ is inside. The vertices $(0,M)$, $(M,0)$ and $(M,M)$ are outside. There is one exit and one entry, both on the new line. The box lines disappear, and the list is exactly the three input lines:

| List after the clip               | Vertices                  |
| --------------------------------- | ------------------------- |
| $(-1,0,0)$, $(0,-1,0)$, $(1,2,6)$ | $(0,0)$, $(6,0)$, $(0,3)$ |

**Boundedness.** The recession test tries the directions of the three lines: $(0,-1)$, $(0,1)$, $(1,0)$, $(-1,0)$, $(-2,1)$ and $(2,-1)$. For each candidate, some constraint has a positive dot product. For example, the candidate $(1,0)$ gives $1$ on the constraint $(1,2,6)$, so the region cannot escape to the right. The region is bounded.

**Area.** The shoelace sum over the three vertices is

$$
(0 \ast 0 - 0 \ast 6) + (6 \ast 3 - 0 \ast 0) + (0 \ast 0 - 3 \ast 0) = 18.
$$

The program prints `18`.

**An unbounded example.** Keep only $x \ge 0$ and $y \ge 0$. After the first two clips the list is top, the first new line, the second new line, right, and the vertices are $(0,M)$, $(0,0)$, $(M,0)$ and $(M,M)$. The clip did not empty the polygon, so the region is not empty. The recession test tries the direction $(0,-1)$ from the first constraint; the second constraint gives $1$, so this direction is blocked. It tries $(1,0)$ from the second constraint; the first gives $-1$ and the second gives $0$, so every dot product is at most zero. The direction $(1,0)$ is a recession direction, and the program prints `UNBOUNDED`. The box edges on the right and the top are an artifact of the clip, not part of the answer.

## Correctness proof

The proof has two layers: the geometry of the clip, and the numerical facts about the area and the boundedness test.

::: math lemma Lemma
Let $Q$ be a convex polygon that is the intersection of the half-planes of a cyclic line list $L_0,\ldots,L_{k-1}$, with $v_i = L_i \cap L_{i+1}$. Let $H$ be a closed half-plane. If at least one vertex $v_i$ is in $H$, then the list rebuilt by the clip describes $Q \cap H$. If no vertex is in $H$, then $Q \cap H$ is empty.
:::

::: math proof Proof
The polygon $Q$ is the intersection of the half-planes of its lines, because it is convex and each line supports an edge. The clip keeps exactly the parts of the boundary that lie in $H$: an edge with both endpoints in $H$ is kept whole, an edge with one endpoint in $H$ is cut at its crossing with the boundary line of $H$, and an edge with both endpoints outside is removed. The crossing points are the intersections of the edge's line with the new line, which is why the new line is inserted in the list at the exit and at the entry. The rebuilt list is the boundary of the old polygon intersected with $H$, traversed in the same cyclic order, so it describes $Q \cap H$.

If no vertex is in $H$, then every vertex satisfies $a x + b y > c$. The function $a x + b y$ is linear, so on the convex polygon $Q$ it attains its maximum at a vertex. Every vertex has a value greater than $c$, so every point of $Q$ does, and $Q \cap H$ is empty. $\square$
:::

::: math lemma Lemma
Let $P$ be the intersection of the input half-planes, and let $B = [-M,M]^2$ with $M = 2 \max|a| \max|c| + 2$. If $P$ is nonempty, then $P \cap B$ is nonempty. If $P$ is bounded, then $P \subseteq B$.
:::

::: math proof Proof
Take a point $p \in P$ closest to the origin; such a point exists because $P$ is closed. If $p$ is the origin, it is in $B$. If $p$ lies in the relative interior of an edge of $P$, then the segment from the origin to $p$ is perpendicular to that edge, because moving along the edge would otherwise reduce the distance while staying in $P$. The edge lies on a supporting line $a x + b y = c$, so $p = c(a,b)/(a^2+b^2)$ and

$$
\lVert p \rVert = \frac{|c|}{\sqrt{a^2+b^2}} \le |c| \le \max|c| < M.
$$

In the remaining case $p$ is a vertex, or an endpoint of a degenerate feasible set, so it is the intersection of two input lines and both coordinates are at most $2 \max|a| \max|c| < M$ in absolute value. Hence $P \cap B$ is nonempty.

If $P$ is bounded, it is the convex hull of its vertices, together with the lower-dimensional cases in which it is a single point or a segment whose endpoints are vertices. Every vertex is the intersection of two input lines, so every point of $P$ has both coordinates in $[-M,M]$. $\square$
:::

::: math lemma Lemma
For a nonempty $P$, the recession test returns true if and only if $P$ is unbounded.
:::

::: math proof Proof
If the test returns true, it has found a nonzero $d$ with $a_i d_x + b_i d_y \le 0$ for every $i$. For any $p \in P$ and any $t \ge 0$,

$$
a_i(p_x + t d_x) + b_i(p_y + t d_y)
= a_i p_x + b_i p_y + t(a_i d_x + b_i d_y)
\le c_i + 0 = c_i,
$$

so the ray stays in $P$ and $P$ is unbounded.

Conversely, if $P$ is unbounded, the recession cone contains a nonzero $d$ by the theorem of the formal model. The cone is an intersection of closed half-planes through the origin. If it has an extreme ray, that ray is the intersection of two of the boundary lines $a_i d_x + b_i d_y = 0$, so it is parallel to the line $L_i$ and the test tries it. If the cone is a half-plane, its boundary ray is parallel to a constraint line and the test tries it. If the cone is the whole plane, every constraint has $a_i = b_i = 0$, which is the case handled separately as unbounded. Therefore the test finds a direction whenever one exists. $\square$
:::

::: math lemma Lemma
The shoelace sum of the vertices of a counterclockwise convex polygon, computed as a reduced fraction, is exactly twice its area.
:::

::: math proof Proof
The shoelace formula is the signed area of a polygon, and for a counterclockwise simple polygon the signed area equals the ordinary area. The polygon is convex, so it is simple and its boundary is traversed exactly once. Each vertex is a rational point with denominator $D_i$, so each cross term is a rational number, and the program adds the terms as reduced fractions. The result is the exact rational value of twice the area; no rounding occurs. $\square$
:::

::: math theorem Theorem
For the documented coefficient range, the reference program prints the exact twice-area of the feasible region when it is bounded, prints `UNBOUNDED` when it is unbounded and nonempty, and prints `0` when it is empty or has zero area.
:::

::: math proof Proof
The box contains a point of every nonempty $P$ and contains every bounded $P$ by the second lemma. The clip maintains the line-list invariant by the first lemma, so the final list is empty exactly when $P$ is empty. If the list is nonempty, the recession test decides boundedness by the third lemma. If the region is unbounded, the program prints `UNBOUNDED`. If it is bounded, the final list is the boundary of $P$, its vertices are the intersections of consecutive lines, and the fourth lemma gives twice the area. If the list has fewer than three lines, the region is a point or a segment, and its area is zero. $\square$
:::

The proof of the area lemma assumes the vertices are in counterclockwise order. The initial box is counterclockwise, and the clip preserves the cyclic order, so the assumption holds. The program takes the absolute value anyway, which costs nothing and protects against a line list that is traversed in the opposite direction.

The proof also exposes the arithmetic assumption. The geometry is exact over the rationals, but the machine arithmetic is exact only while every numerator, denominator and product fits in the chosen type. The complexity section states the bound.

## Complexity analysis

| Stage | Time | Space |
| --- | --- | --- |
| Reading the constraints | $O(n)$ | $O(n)$ |
| Normalizing and sorting (angular sweep) | $O(n \log n)$ | $O(n)$ |
| Deque sweep | $O(n)$ | $O(n)$ for the deque |
| Dual clipping (reference) | $O(n^2)$ worst case | $O(n)$ |
| Recession test | $O(n^2)$ in the reference, $O(n \log n)$ after sorting the normals | $O(n)$ |
| Area of the final polygon | $O(n)$ | $O(n)$ |

The angular sweep is $O(n \log n)$ because the sort dominates; the deque is linear because each line is pushed once and popped at most once. The dual clip is $O(n^2)$ in the worst case because each of the $n$ clips can walk a polygon with $O(n)$ edges. The worst case is real: a polygon with many edges can stay large for many clips. The clip is nevertheless the shorter program, and it is fast when the polygon stays small or when $n$ is only a few hundred.

The reference programs also run the recession test in $O(n^2)$ time, which does not change the overall $O(n^2)$. A production version sorts the normals by angle and scans them once, or uses the deque's active set, which reduces this stage to $O(n \log n)$.

The arithmetic bound is the part that a contestant must check before submitting.

| Quantity | Bound | With $\max|a| = 100$, $\max|c| = 10^4$ | | --- | --- | --- | | Box coordinate $M$ | $2 \max|a| \max|c| + 2$ | $2 \ast 10^6 + 2$ | | Determinant $D$ | $2 \max|a|^2$ | $2 \ast 10^4$ | | Vertex numerator $X$ or $Y$ | $2 \max|a| \max|c|$ | $2 \ast 10^6$ | | Clipping predicate | about $2 \max|a| \max|c| \max|a|$ | $2 \ast 10^8$ | | One shoelace term | about $8 \max|a|^2 \max|c|^2$ | $8 \ast 10^{12}$ |

A signed 64-bit integer holds about $9.2 \ast 10^{18}$, so the determinants and the predicates have several orders of magnitude to spare. The shoelace terms are also safe with the stated bounds. The running fraction is the one quantity that does not have a simple bound in terms of $n$: its denominator is the lcm of the denominators of the terms, and a constructed input can make that lcm large. The programs reduce after every addition, and the documented range and the curated fixtures keep the reduced numerator and denominator below $2^{63}$. A judge with larger coefficients, or an adversarial polygon whose area denominator has many distinct prime factors, needs a 128-bit accumulator, a big integer, or the modular reconstruction described below.

The Python variant is exact for every input because Python integers are unbounded. The JavaScript variant uses `BigInt`, which is also exact and does not have the $2^{53}$ limitation of `Number`. The C, C++, Java and Pascal variants use signed 64-bit integers and rely on the stated bound. Pascal's `Int64` is the narrowest of the four, and it is the reason the coefficient bound is stated explicitly rather than left implicit.

If the answer is only needed modulo a prime, the fraction accumulator can be replaced by a modular one. The [modular arithmetic](/algorithms/number-theory/modular-arithmetic) article covers the inverses, and the shoelace terms can be reduced at every step. That variant is useful when the area is a huge rational and the judge asks for a residue rather than the exact value.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The extreme points of a set of points | The [convex hull](/algorithms/geometry/convex-hull), which is a different problem |
| The intersection of half-planes, small $n$ | The dual clip of this page |
| The intersection of half-planes, large $n$ | The angular sweep with a deque |
| Only feasibility, no area | The same intersection, with an early exit when the list is empty |
| Only the kernel of a simple polygon | One half-plane per directed edge, then the kernel test |
| A two-variable linear program with an objective | The intersection, then evaluate the objective at every vertex |
| A point-in-convex-polygon query | The half-plane test of [point in polygon](/algorithms/geometry/point-in-polygon) |
| Is a point on the correct side of one line? | One cross product, described in [robust predicates](/algorithms/geometry/robust-predicates) |
| The area of a lattice polygon | The shoelace sum and Pick's theorem in [integer geometry](/algorithms/geometry/integer-geometry) |
| The smallest circle containing a set of points | [Smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle) |
| A convex polygon moving through a set of obstacles | The Minkowski sum, which is a different construction |
| A three-dimensional intersection of half-spaces | A polyhedron intersection, which is much harder and is not this technique |
| A dynamic set of half-planes with insertions and deletions | A dynamic convex hull or an offline divide-and-conquer, not the static sweep |

The first row is the most common confusion. The convex hull takes a set of points and returns the smallest convex set containing them. The half-plane intersection takes a set of inequalities and returns the set of points satisfying all of them. They are dual to each other, in the sense that a convex polygon can be described either by its vertices or by its supporting lines, but the input and the output are different.

The last row is the second trap. The static sweep assumes that all constraints are known in advance. If constraints are inserted and deleted online, the deque no longer has a monotone lifetime, and a dynamic structure or an offline segment tree over time is required.

## Reference implementations

The manifest `implementations/geometry/half-plane-intersection/algorithm.yaml` publishes one `program` variant per language:

- `c/program.c`
- `cpp17/program.cpp`
- `java/Main.java`
- `python/program.py`
- `pascal/program.pas`
- `javascript/program.js`

All six read the same input and write the same output.

```text
n
a1 b1 c1
...
an bn cn
```

Each triple describes the closed half-plane $a x + b y \le c$. The program prints twice the area of the bounded feasible region as an exact integer. If the exact value is a fraction, it prints `p/q` in lowest terms, which is an extension that the integer contract does not need but that makes the exact arithmetic visible. If the region is unbounded, it prints `UNBOUNDED`. If the region is empty, it prints `0`, because the empty set is bounded and its area is zero.

The C, C++ and Java versions keep the line list in arrays of 64-bit integers, classify vertices with the determinant predicate, and reduce the shoelace fraction with the gcd. The Python version uses the same structure with unbounded integers and `math.gcd`. The JavaScript version uses `BigInt` so that the products are exact even beyond $2^{53}$, and it writes the platform line ending so that its bytes match the other five. The Pascal version uses `Int64`, reads every input number with a separate `Read`, and uses `SysUtils` for `IntToStr`; it compiles under both Free Pascal and the browser Pascal compiler used by the repository's test runner.

The dual clip is a deliberate choice for the reference. It never stores a coordinate during the intersection, so the only rational arithmetic is the final area. It handles the empty polygon by an empty list and the degenerate polygon by a list of one or two lines. The box is not the boundedness test: the box only gives the clip a finite starting polygon, and the recession test is what decides whether the input region is bounded. A program that confuses the two prints a finite area for a wedge or `UNBOUNDED` for a triangle.

The manifest records every variant as unverified until the continuous integration run compiles it and compares the output on the shared fixtures. The fixtures cover a square, a triangle with an integer double area, and an unbounded quadrant.

## Recursion decision

The algorithm is iterative. The angular sweep is a loop over the sorted lines with a deque, the dual clip is a loop over the constraints with an inner loop over the current polygon, and the area is a single loop over the final vertices. No step needs a call stack.

Two recursive alternatives exist, and both are worse for this problem.

The **divide-and-conquer intersection** splits the constraints into two halves, intersects each half, and merges the two convex polygons. The merge is linear in the number of edges, so the recurrence is $T(n) = 2T(n/2) + O(n)$, which solves to $O(n \log n)$ only if the merge is linear; the depth is $O(\log n)$. The merge is the delicate part: the intersection of two convex polygons needs a careful walk of the two boundaries, and the constant is larger than the deque's.

The **randomized incremental linear program** adds the constraints in random order and repairs the optimum when a constraint is violated. Its expected time is linear, and its depth is the number of repairs, which can be $O(n)$ in the worst case. It is the right tool when the problem has an objective and the dimension is small, but it is more machinery than a pure feasibility intersection needs.

| Language | Practical recursion depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the loops have no natural recursion |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative; the divide-and-conquer depth is small but the merge is not worth it |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The only place where recursion is tempting is the gcd. Euclid's algorithm in recursive form has depth $O(\log C)$, which is at most about 90 for 64-bit inputs, so any of the six languages can afford it. The listings still use a loop, because the gcd sits inside the area loop and the loop has no call overhead.

## Implementation walkthrough

The three pieces that decide whether the program is correct are the inside predicate, the rebuild rule, and the boundedness test.

**The inside predicate.** The vertex between lines $u$ and $v$ is the solution of a $2 \times 2$ system. The determinant is $w = u_a v_b - v_a u_b$. With $X = u_c v_b - v_c u_b$ and $Y = u_a v_c - v_a u_c$, the point is $(X/w, Y/w)$. The sign of $h$ at that point is the sign of

$$
h_a X + h_b Y - h_c w
$$

multiplied by the sign of $w$. The code uses the product form so that no division is needed:

```c
static int inside(const line *u, const line *v, const line *h) {
    long long w = u->a * v->b - v->a * u->b;
    if (w == 0) {
        return 1;
    }
    long long x = u->c * v->b - v->c * u->b;
    long long y = u->a * v->c - v->a * u->c;
    long long numerator = h->a * x + h->b * y - h->c * w;
    return w > 0 ? numerator <= 0 : numerator >= 0;
}
```

The `w == 0` case cannot occur in a well-formed polygon, because consecutive supporting lines meet at a vertex. It is handled as "inside" so that a degenerate input does not divide by zero. A production version can assert it instead.

**The rebuild rule.** The code classifies every vertex first, because the rule for edge $i$ needs both endpoints. The new list appends the edge's line when at least one endpoint is inside, and appends the new line only on an exit:

```c
for (int i = 0; i < poly_count; i++) {
    int j = (i + 1) % poly_count;
    if (ins[i] || ins[j]) {
        next[count++] = poly[j];
    }
    if (ins[i] && !ins[j]) {
        next[count++] = h;
    }
}
```

The asymmetry is the part that is easy to get wrong. Appending the new line on both the exit and the entry puts it in the list twice, which creates a zero-length edge and a duplicated vertex. Appending it only on the entry puts it in the wrong position when the entry is at the wrap around the end of the array. The exit is the unique place where the boundary leaves the old polygon, so it is the place to insert the chord.

**The boundedness test.** The test runs on the original constraints, not on the active lines. A constraint that is redundant for the area can still be the only wall that blocks a direction. The code tries both directions of every nonzero normal:

```c
for (long long i = 0; i < n; i++) {
    if (planes[i].a == 0 && planes[i].b == 0) {
        continue;
    }
    for (int direction = 0; direction < 2; direction++) {
        long long dx = direction == 0 ? -planes[i].b : planes[i].b;
        long long dy = direction == 0 ? planes[i].a : -planes[i].a;
        int feasible = 1;
        for (long long j = 0; j < n; j++) {
            if (planes[j].a * dx + planes[j].b * dy > 0) {
                feasible = 0;
                break;
            }
        }
        if (feasible) {
            return UNBOUNDED;
        }
    }
}
```

The test is $O(n^2)$, which is the same order as the clip and is fast enough for the reference range. A production version sorts the normals and scans the circular order, which answers the question in $O(n \log n)$.

**The area.** The vertices are reduced homogeneous triples $(X,Y,W)$ with $W > 0$. The cross term is

$$
\frac{X_i Y_{i+1} - Y_i X_{i+1}}{W_i W_{i+1}},
$$

and the program adds it to a fraction accumulator with a gcd reduction after every addition. The absolute value is taken once at the end, so a line list traversed clockwise still produces the correct area.

The box bound is computed from the input before the first clip. If the input contains only zero normals, the box is $[-2,2]^2$, the clip leaves it unchanged, and the recession test reports `UNBOUNDED` because the whole plane is feasible. That is the correct answer for an empty set of effective constraints.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the normal $(a,b)$ as the boundary direction | Every half-plane is rotated by 90 degrees and the region is wrong | The boundary direction is $(-b,a)$, and the feasible side is its left |
| Sorting by angle with `atan2` or a slope | Two nearly parallel lines swap order and the deque pops a valid line | Compare with the cross product of the direction vectors |
| Forgetting to keep the most restrictive parallel line | A weaker duplicate is kept and the region is too large | Compare the offsets $c/g$ exactly, or keep every parallel line and let the deque handle them |
| Treating the boundary as outside | A feasible point on a wall is rejected and a valid kernel is reported empty | Use closed half-planes: inside means at most, not strictly less |
| Testing the new line against the wrong pair | A valid line is popped, or an invalid one survives | Pop the back with the last two lines and the front with the first two |
| Forgetting the final front and back cleanup | The first and last lines do not close the polygon | Repeat the outside tests with the first and last lines after the loop |
| Using the box as the boundedness test | A thin wedge that touches the box is called unbounded, or a segment is called empty | Use the recession cone on the original constraints |
| Choosing a box that is too small | A bounded region is clipped and reported as unbounded | Use $M = 2 \max | a | \max | c | + 2$ |
| Dividing coordinates with integer division | Every rational vertex is rounded and the area is wrong | Keep the homogeneous triple and divide only when printing |
| Accumulating the area in floating point | A nearly degenerate polygon loses the exact answer | Keep the fraction and reduce with the gcd |
| Taking the area without the absolute value | A clockwise line list produces a negative answer | Take the absolute value once, at the end |
| Forgetting the empty case | An empty region is reported as unbounded or as a negative area | Stop when the line list is empty and print zero |
| Assuming the input polygon is counterclockwise | The kernel is the complement of the intended region | Read the winding or orient every edge explicitly |
| Mixing the two conventions for the area | Twice the area is printed where the area is expected | Print twice the area, or divide by two only when the contract asks for it |

### Why this fails: the segment that is called empty

The most instructive failure is the degenerate unbounded region. Take the three constraints

$$
x \le 0, \qquad -x \le 0, \qquad y \le 0.
$$

The first two force $x = 0$, and the third allows every $y \le 0$. The feasible region is the ray from the origin downward along the $y$-axis. It is not empty, it is not bounded, and its area is zero.

The dual clip starts with the box and clips by $x \le 0$, then by $-x \le 0$. After the second clip the polygon is a segment of the box: its line list has four entries, but two pairs of vertices coincide. A program that checks "does the polygon have at least three distinct vertices" before doing anything else sees only two distinct points and concludes that the region is empty or that its area is zero. It prints `0`, but the correct answer is `UNBOUNDED`.

The smallest fix is not a bigger box. A bigger box makes the segment longer but does not create a third distinct vertex. The fix is to separate the two questions: emptiness is "the line list is empty after the clip", and boundedness is "the recession cone contains a nonzero direction". The segment has a nonempty line list and a recession direction, so it is unbounded even though its area is zero.

A second failure in the same area is the empty region. Take $x \le 0$ and $x \ge 1$. The clip by the second constraint finds every vertex outside and empties the list. A program that runs the recession test first finds the direction $(0,1)$, which satisfies both homogeneous inequalities, and reports `UNBOUNDED`. That is wrong: the region is empty, and the empty set is bounded. The order matters: test emptiness first, then boundedness.

The lesson generalizes: **boundedness is a property of the recession cone, and emptiness is a property of the intersection.** A single test on the vertices cannot answer both, because the degenerate cases move the vertices to the boundary of the box without changing the cone.

A third failure is the box bound. If $M$ is chosen as the largest input coefficient instead of $2 \max|a| \max|c| + 2$, a bounded triangle with a shallow slope can have a vertex outside the box. The clip then cuts the triangle and the program reports a smaller area or `UNBOUNDED`. The bound comes from the Cramer's rule formula, not from the size of the coefficients alone.

## Variants and extensions

- **The kernel of a polygon.** For each directed edge, take the inward half-plane. The kernel is their intersection. A polygon is star-shaped exactly when the kernel is nonempty, and the area of the kernel is the area of the set of camera positions.
- **Two-variable linear programming.** The optimum of a linear objective over a bounded feasible region is attained at a vertex. Enumerating the vertices of the half-plane intersection gives the answer, and the angular sweep gives the vertices in linear time after the sort.
- **Randomized incremental linear programming.** Add constraints in random order and repair the optimum when one is violated. The expected time is linear in fixed dimension, and the method extends to higher dimensions where the explicit intersection is too large.
- **Three-dimensional half-space intersection.** The boundary is a polyhedron, and the intersection can have quadratic complexity. The two-dimensional deque does not generalize directly; a randomized incremental construction or a duality to convex hulls is used instead.
- **Line arrangements.** The arrangement of $n$ lines has $\binom{n}{2}$ vertices and $O(n^2)$ cells. The half-plane intersection is one cell of the arrangement, the cell that is on the allowed side of every line, and the angular sweep walks only the lines that bound it.
- **Minkowski sums.** The Minkowski sum of two convex polygons is computed by merging their edge directions, which is the same angular-order idea applied to edge vectors rather than to half-planes.
- **Voronoi diagrams.** A Voronoi cell is the intersection of the half-planes that are closer to one site than to another, so each cell is a small half-plane intersection. The whole diagram is the arrangement of the bisectors.
- **Half-plane intersection with equality constraints.** An equality $a x + b y = c$ is two opposite half-planes. Keeping both in the list is correct, but the region becomes lower-dimensional, and the area routine has to handle a degenerate polygon.
- **Dynamic half-plane intersection.** Insertions and deletions break the monotone deque. An offline segment tree over time, or a fully dynamic convex hull, is the usual replacement.
- **The modular area.** If the answer is required modulo a prime, the fraction accumulator is replaced by modular inverses, and the denominators must be nonzero modulo the prime. The [modular arithmetic](/algorithms/number-theory/modular-arithmetic) page develops the inverses.

## Contest strategy

1. **Write the constraints in the standard form.** Every inequality must be $a x + b y \le c$, with the allowed side on the left of $(-b,a)$. A statement that gives the allowed side as "above" or "inside" has to be converted before anything else.
2. **Decide whether the region can be empty.** Add the empty check before the area. The empty set has area zero, but it is not unbounded, and a program that conflates the two fails on the smallest contradictory pair.
3. **Decide whether the region can be unbounded.** If it can, implement the recession test or the box test with the correct $M$. Do not use the box alone.
4. **Choose the algorithm by $n$.** For $n$ up to a few hundred, the dual clip is short and reliable. For $n$ in the hundreds of thousands, the angular sweep is required.
5. **Keep the arithmetic exact.** Use integers for the determinants and a fraction or a homogeneous triple for the vertices. A floating-point version is acceptable only when the statement has a tolerance and the geometry is not nearly degenerate.
6. **Check the area convention.** Twice the area avoids a division and is the natural output for an integer judge. If the judge wants the area, divide by two only at the end and print the required number of digits.
7. **Test the degenerate cases explicitly.** One constraint, two opposite constraints, three lines through one point, a region that is a single point, a region that is empty, and a region that is a strip. These are the cases that a random test rarely generates.
8. **Compare against a brute force on small inputs.** The $O(n^3)$ pair enumeration is easy to write and is an independent check on the order, the sign and the area.

## Worked problems

### Problem 1: the area of the kernel

**Restatement.** A simple polygon with up to 1500 vertices is given. Find the area of the set of points from which the whole polygon is visible.

**Naive baseline.** Test every pair of edges for a candidate vertex, keep the points that see every edge, and sort them by angle. That is $O(n^3)$ and is too slow at 1500.

**Insight.** The set of points that see the whole polygon is the intersection of the inward half-planes of its edges. The intersection is convex, and its boundary is a subsequence of the edge lines in angular order.

**Derivation.** Orient every edge so that the polygon is on its left, build the half-plane $a x + b y \le c$ for that edge, and run the angular sweep. The surviving lines give the kernel. If the kernel is empty, the area is zero; otherwise the shoelace sum over its vertices gives the area.

**Correctness.** A point sees the whole polygon exactly when it is on the inward side of every edge, because the polygon is the intersection of those half-planes. The sweep computes exactly that intersection by the theorem of this page.

**Complexity.** $O(n \log n)$ time and $O(n)$ space with the sweep, or $O(n^2)$ with the dual clip. At 1500 either is fast.

**Common wrong approach.** Forgetting to orient the edges. A clockwise input reverses every half-plane, and the program returns the complement of the kernel, which is usually empty or unbounded.

### Problem 2: is there a camera position

**Restatement.** A simple rectilinear polygon with at most 100 vertices is given in clockwise order. Decide whether there is a point from which the whole floor is visible.

**Naive baseline.** The same $O(n^3)$ vertex enumeration, followed by a check that at least one candidate exists.

**Insight.** This is the feasibility half of the previous problem. The kernel is the intersection of the inward half-planes, and the answer is yes exactly when the intersection is nonempty.

**Derivation.** Build the half-planes from the edges, clip the box, and stop as soon as the line list becomes empty. If it never becomes empty, the answer is yes. A kernel that is a single point or a segment still counts as a valid camera position.

**Correctness.** The clip maintains the intersection invariant. The list is empty exactly when the intersection is empty, so a nonempty list is a witness point and an empty list is a proof that no point works.

**Complexity.** $O(n^2)$ time and $O(n)$ space, which is trivial at 100 vertices.

**Common wrong approach.** Requiring three distinct vertices. A kernel that is a point or a segment is a valid answer, and the distinct-vertex test rejects it.

### Problem 3: the rotating scoreboard

**Restatement.** A simple polygon with at most 100 vertices is given. Decide whether there is a point inside it from which every boundary point is visible, with tangency allowed.

**Naive baseline.** The same kernel enumeration, with the extra work of checking the boundary cases.

**Insight.** Tangency is the boundary of the half-plane: a point on a wall's line is still on the allowed side. The kernel is the intersection of the closed half-planes, and the answer is whether it is nonempty.

**Derivation.** Orient each edge by the polygon's order, build the closed half-plane on the polygon's side, and clip. The closed convention keeps the boundary points, so a scoreboard on a wall or at a vertex is accepted. The answer is yes exactly when the final list is nonempty.

**Correctness.** The same intersection theorem applies, with closed half-planes. The only difference from the previous problem is the treatment of the boundary, which the closed inequality already provides.

**Complexity.** $O(n^2)$ time and $O(n)$ space.

**Common wrong approach.** Using strict inequalities. A scoreboard that sits exactly on a wall is visible from every point under the statement's tangency rule, and a strict test rejects it.

## Practice progression

1. **Recognition.** Given a statement, decide whether the feasible set is an intersection of half-planes, and write the inequalities in the standard form with the allowed side on the left.
2. **Direct application.** Implement the determinant predicate and the dual clip for a rectangle and a triangle, and check twice the area against the shoelace formula computed by hand.
3. **Degenerate cases.** Add the empty region, the single point, the segment, the ray, the strip and the wedge to the test set. Check that the empty region prints zero and the others print `UNBOUNDED`.
4. **Adaptation.** Replace the dual clip with the angular sweep and compare the two on random small inputs. A disagreement is either a sorting convention or a pop condition, and both are worth finding on small cases.
5. **Combination.** Compute the kernel of a simple polygon, then combine it with the point-in-polygon test to check that a candidate camera position really sees every vertex.
6. **Challenge.** Implement the randomized incremental linear program for the same constraints and compare its optimum with the vertex enumeration of the half-plane intersection.
7. **Transfer.** Recognize the same object in a linear program, in a Voronoi cell, in a Minkowski sum and in a robot-motion problem. The constraints change, the intersection does not.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Write the half-plane $a x + b y \le c$ in terms of its boundary direction and its normal, and state which side is feasible. (Formal model)
2. Why is the intersection of half-planes convex, and why does that make the boundary a convex polygon? (Formal model)
3. State the three stages of the angular sweep and the two pop conditions. (Algorithm derivation)
4. Why is it safe to pop a line whose intersection with its neighbor is outside the new line? (Key insight)
5. Trace the dual clip on the triangle $x \ge 0$, $y \ge 0$, $x + 2y \le 6$ and give the line list after each clip. (Step-by-step execution)
6. Why does the clip append the new line only on an exit, and what goes wrong if it is appended on both the exit and the entry? (Implementation walkthrough)
7. State the recession cone test and prove that it decides boundedness for a nonempty region. (Correctness proof)
8. Why is the empty region printed as zero rather than `UNBOUNDED`, and why must the empty test come first? (Common mistakes)
9. What is the box coordinate $M$, and where does the factor $2 \max|a| \max|c|$ come from? (Algorithm derivation)
10. What type does the area accumulator need, and when does the documented 64-bit range stop being enough? (Complexity analysis)
11. How do the angular sweep and the dual clip differ in time, space and implementation length? (Complexity analysis)
12. What is the difference between the convex hull of a point set and the intersection of a set of half-planes? (Algorithm selection)

## Further reading

- The subject index places this technique beside the rest of [computational geometry](/algorithms/geometry/).
- The convex hull of a point set is the dual object to a convex polygon described by its supporting lines, and it is developed in [convex hull](/algorithms/geometry/convex-hull).
- The half-plane test for a point inside a convex polygon is the local version of the same predicate, and it is in [point in polygon](/algorithms/geometry/point-in-polygon).
- The exact orientation test that the clip uses is the subject of [robust predicates](/algorithms/geometry/robust-predicates).
- The shoelace sum and the lattice version of the area are in [integer geometry](/algorithms/geometry/integer-geometry).
- The sorting that the angular sweep begins with is in [sorting](/algorithms/foundations/sorting).
- The sweep-line paradigm that shares the angular order but maintains a different invariant is in [sweep line](/algorithms/geometry/sweep-line).
- The rotating calipers walk around a convex polygon in the same cyclic order, and it is in [rotating calipers](/algorithms/geometry/rotating-calipers).
- The smallest circle problem is another incremental convex construction, and it is in [smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle).
- The binary search that answers a monotone question about a convex region is in [binary search](/algorithms/searching/binary-search).
- The offline sweep that answers many queries at once is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The dynamic programming technique that shares the name "convex hull" but not the object is in [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The modular alternative for a huge exact area is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The discrete mathematics of determinants, vectors and the sign of an area is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
