---
id: geometry.smallest-enclosing-circle
title: The smallest enclosing circle
summary: Find the smallest circle that contains a set of points with a deterministic incremental construction, using exact integer predicates and an O(n^3) worst-case bound.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: common-contest-technique
keywords:
    [
        smallest enclosing circle,
        minimum enclosing circle,
        incremental construction,
        welzl,
        circumcircle,
        incircle test,
        exact arithmetic,
    ]
prerequisites:
    required: [geometry.convex-hull]
    recommended: [foundations.complexity, foundations.sorting]
complexity:
    time: "O(n^3) worst case; O(n) expected with a random shuffle"
    space: "O(n) for the points, O(1) auxiliary"
assumptions:
    - The coordinates are integers whose squared differences and incircle determinants fit in a signed 64-bit integer.
    - The squared radius of the answer is an integer, which the problem statement guarantees.
implementations: geometry.smallest-enclosing-circle
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/geometry.smallest-enclosing-circle.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

The **smallest enclosing circle** of a finite set of points $S$ is the circle of least radius whose closed disk contains every point of $S$. It is unique, and it is fixed by at most three points of $S$ on its boundary: either two points at opposite ends of a diameter, or three points that form an acute triangle.

The **incremental construction** processes the points in a fixed order and keeps one circle. When a new point lies outside the current circle, the new smallest circle must have that point on its boundary. The algorithm then rechecks the earlier points with one and then two boundary points pinned, and each violation replaces the circle by the circle through the pinned points and the violator.

The implementation is short, but the details decide whether it is correct: the containment test uses exact integer arithmetic, a triple of collinear points has no circumcircle and falls back to the farthest pair, and the final squared radius is computed from the defining pair or triple.

| Property                     | Value                                     |
| ---------------------------- | ----------------------------------------- |
| Input                        | $n$ integer points                        |
| Output                       | the squared radius, an exact integer      |
| Deterministic time           | $O(n^3)$ worst case                       |
| Expected time with a shuffle | $O(n)$                                    |
| Space                        | $O(n)$ for the points, $O(1)$ auxiliary   |
| Deciding set                 | two diameter points or three acute points |

The reference program reads $n$, then $n$ lines with an integer $x_i$ and an integer $y_i$, where $1 \le n \le 500$ and $|x_i|,|y_i| \le 100$. It prints the squared radius as one integer, and the statement guarantees that this squared radius is an integer. The deterministic order is the input order; no shuffle is used.

## Problem motivation

A radio tower must reach a set of sensors, and the cheapest tower that reaches all of them stands at the center of the smallest circle that contains the sensors. A telescope must fit every star of a constellation into one circular field of view, and the tightest field is the smallest enclosing circle of the star positions. A robot must turn inside a round arena that contains every obstacle it might touch, and the arena's radius is again this circle.

In each case the question is the same: **what is the smallest disk that covers all the points?** The object is a disk, so it has three parameters, the center and the radius, but the minimum is unique. The difficulty is not the number of parameters. The difficulty is that a circle can be fixed by many different subsets, and testing every subset is hopeless.

The naive enumeration tries every pair and every triple of points, builds the circle they determine, and keeps the smallest one that contains all the points. It is correct, and it costs $O(n^4)$ because each of the $O(n^3)$ candidates is checked against all $n$ points. At $n=50$ that is a few million operations; at $n=10^5$ it is $10^{20}$.

The constraints decide the method.

| Situation                         | What it rules                                            |
| --------------------------------- | -------------------------------------------------------- |
| $n \le 50$                        | Enumerating pairs and triples is affordable              |
| $n \le 500$                       | The deterministic construction is affordable in C or C++ |
| $n \le 10^5$                      | A randomized or linear-time method is needed             |
| Integer coordinates, exact output | Integer predicates and exact division                    |
| Floating output with tolerance    | Doubles are enough, but degeneracies still matter        |
| All points collinear              | The answer is half the distance between the two extremes |

## Recognition patterns

The smallest enclosing circle is the right tool when the statement contains some of these phrases.

- "The smallest circle", "the minimum radius", "the tightest circular bound".
- "A circle that contains all the points", "a disk that covers every point".
- "The center and the radius", "the diameter of the smallest circle", "the squared radius".
- "A tower that reaches every house", "a lamp that lights every point", "a fence that encloses the herd".
- "The farthest point should be as close as possible", which is the 1-center formulation.

The constraint values and the surrounding objects rule other techniques in and out.

| Signal | Technique |
| --- | --- |
| The smallest circle containing all points | This article |
| The smallest convex polygon containing all points | [Convex hull](/algorithms/geometry/convex-hull) |
| The smallest rectangle containing all points | [Rotating calipers](/algorithms/geometry/rotating-calipers) |
| The farthest pair of points | [Rotating calipers](/algorithms/geometry/rotating-calipers) |
| The maximum number of points in a circle of fixed radius | An angular sweep, not the smallest enclosing circle |
| Cover all points with $k$ circles | Clustering; the general problem is hard |
| The closest pair of points | [Closest pair](/algorithms/geometry/closest-pair) |

The distinctions matter. A problem that asks for the maximum number of points that fit in a circle of radius $r$ is a coverage problem; the smallest enclosing circle answers a different question. A problem that asks for the smallest circle whose center lies on a given line is a constrained 1-center problem, and the unconstrained construction does not apply directly.

## Naive approach

The baseline enumerates every circle that can possibly be minimal. A circle is determined by two points when the points are the ends of a diameter, and by three points when they are not collinear. So the candidates are:

1. For every pair $(a,b)$, the circle with $ab$ as a diameter.
2. For every triple $(a,b,c)$ with $\operatorname{cross}(a,b,c) \ne 0$, the circumcircle of the triple.
3. For every candidate, test whether every input point lies inside or on it.
4. Keep the candidate of minimum radius among those that pass the test.

The characterization theorem in the formal model below proves that the smallest enclosing circle is one of these candidates, so the enumeration is correct.

```cpp
long long d2(const Point& a, const Point& b) {
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    return dx * dx + dy * dy;
}

bool contains_all(const Circle& c, const std::vector<Point>& pts) {
    for (const Point& p : pts) {
        if (!inside(c, p)) return false;
    }
    return true;
}
```

The cost is $O(n^3)$ candidates times $O(n)$ containment checks, which is $O(n^4)$. With $n=200$ that is already $1.6 \times 10^9$ checks in the worst case. The incremental construction avoids the enumeration: it generates only the candidates it is forced to generate.

A second baseline is a numerical search. Ternary search on the center coordinates, or gradient descent on the maximum distance, finds an approximate answer, and it is easy to write. It is not exact: a narrow feasible region or a boundary case can make it converge to the wrong circle, and an exact integer output cannot be recovered from a double. The enumeration is exact and remains the reference for small inputs.

## Key insight

The insight is that **a point that is outside the current circle must lie on the boundary of the new smallest circle**.

Suppose the current circle is the smallest circle containing a set $P$, and a new point $p$ lies outside it. Let $C'$ be the smallest circle containing $P \cup \{p\}$. If $p$ were strictly inside $C'$, then $C'$ would be determined by points of $P$ alone. The same circle would then be the smallest circle containing $P$, which is the old circle, but $p$ is outside the old circle and inside $C'$. That is a contradiction, so $p$ is on the boundary of $C'$.

That gives the whole algorithm. Keep one circle. Add the points one at a time. When a point is outside, pin it on the boundary and recompute:

- Pin the new point $p_i$. Scan the earlier points. If none is outside, the pinned circle is the answer for the prefix.
- If a point $p_j$ is outside, pin $p_j$ as well. The smallest circle with $p_i$ and $p_j$ on its boundary is the one with $p_ip_j$ as a diameter.
- If a point $p_k$ is outside that diameter circle, pin $p_k$ as well. Three boundary points determine the circumcircle, unless they are collinear; in that case the smallest circle containing them is the diameter of the farthest pair.

The nested loops are exactly these three levels of pinning.

```cpp
Circle c = point_circle(p[0]);
for (int i = 0; i < n; i++) {
    if (!inside(c, p[i])) {
        c = point_circle(p[i]);
        for (int j = 0; j < i; j++) {
            if (!inside(c, p[j])) {
                c = diameter_circle(p[i], p[j]);
                for (int k = 0; k < j; k++) {
                    if (!inside(c, p[k])) {
                        c = circumcircle_or_diameter(p[i], p[j], p[k]);
                    }
                }
            }
        }
    }
}
```

The order is fixed and no shuffle is used. A random shuffle would make the expected running time linear, but it would also make the trace depend on a random seed. A fixed order keeps the six language versions identical and makes the step-by-step execution reproducible. The price is the $O(n^3)$ worst-case bound, which is the honest bound for this deterministic version.

## Visual intuition

Picture the points as pins on a board and the circle as a rubber band that is allowed to be a circle. Shrink the band until it catches on the points.

- A circle that touches only one point can be moved and shrunk, so it is not minimal unless there is only one point.
- A circle that touches two points that are not opposite leaves a gap of more than half the circle between the contacts. It can be rotated and shrunk, so it is not minimal.
- A circle that touches two opposite points is held by a diameter and cannot be improved.
- A circle that touches three points that surround its center is held in place. If the three points form an obtuse or right triangle, the longest side is a diameter of a smaller circle, so the three-point circle is not minimal.
- A circle that touches three collinear points is held by the farthest pair, and the middle point is redundant.

The three levels of the algorithm follow the same picture: pin one point, then two, then three. A fourth contact is redundant, because a circle is fixed by three points and a fourth point on the same circle adds no information.

| Contact points         | What the circle is              | How the code tests it             |
| ---------------------- | ------------------------------- | --------------------------------- |
| One                    | Never minimal for $n > 1$       | Radius $0$                        |
| Two, not opposite      | Can be shrunk                   | Not a candidate                   |
| Two, opposite          | The diameter circle             | Dot product at most $0$           |
| Three, obtuse or right | The longest side is a diameter  | The circumcircle is not needed    |
| Three, acute           | The circumcircle                | Incircle determinant at least $0$ |
| Three, collinear       | The farthest pair is a diameter | No circumcircle exists            |

## Formal model

::: math definition Definition
For a point $c$ and a real number $r \ge 0$, the **closed disk** is

$$
D(c,r) = \{ p \in \mathbb{R}^2 : \lVert p - c \rVert \le r \}.
$$

Its boundary is the **circle** $S(c,r)$. A circle **encloses** a set $S$ when $S \subseteq D(c,r)$. The **smallest enclosing circle** of $S$ is the enclosing circle of minimum radius.
:::

::: math definition Definition
A circle is **determined** by a set $B$ of its boundary points when it is the unique circle that has every point of $B$ on its boundary. Three non-collinear points determine exactly one circle, the **circumcircle** of the triple. Two distinct points do not determine a unique circle; among the circles through them, the one with the segment between them as a diameter has the least radius.
:::

::: math definition Definition
For points $a$, $b$, $c$, the **orientation** is

$$
\operatorname{cross}(a,b,c)
= (b_x-a_x)(c_y-a_y) - (b_y-a_y)(c_x-a_x).
$$

It is positive when $a \to b \to c$ turns left, negative when the turn is right, and zero when the three points are collinear.
:::

::: math definition Definition
For a counterclockwise triple $a,b,c$ and a query point $p$, put $u = a-p$, $v = b-p$, $w = c-p$ and define the **incircle determinant**

$$
I(p) = \det
\begin{pmatrix}
u_x & u_y & u_x^2+u_y^2 \\
v_x & v_y & v_x^2+v_y^2 \\
w_x & w_y & w_x^2+w_y^2
\end{pmatrix}.
$$
:::

::: math lemma Lemma
The incircle determinant satisfies $I(p) \ge 0$ exactly when $p$ lies inside or on the circumcircle of the counterclockwise triple $a,b,c$. It is zero exactly when the four points are concyclic.
:::

::: math proof Proof
The equation of a circle is linear in $x$, $y$, and $x^2+y^2$:

$$
x^2+y^2 + \alpha x + \beta y + \gamma = 0.
$$

The determinant vanishes exactly when there are coefficients that put $a$, $b$, $c$, and $p$ on one such circle, which is the concyclicity condition. Its zero set is therefore the circumcircle, and the sign is constant on each side of that circle. At the circumcenter, the three lifted entries are all $R^2$, so the determinant is $R^2$ times the determinant of the rows $(u_x,u_y,1)$, which is twice the signed area of the counterclockwise triangle and is positive. Hence the inside of the circle is the positive side. $\square$
:::

::: math lemma Lemma
For a set with at least two points, every smallest enclosing circle is either the diameter circle of two of its boundary points or the circumcircle of three of its boundary points that form an acute triangle.
:::

::: math proof Proof
Let $C$ be the smallest enclosing circle. If its boundary contains no point of $S$, shrink the circle. If it contains one point, move the center slightly toward that point and shrink. If it contains two points that are not antipodal, the two contacts leave a gap of more than half the circle; rotate the center around the chord and shrink. The only remaining two-point case is the antipodal one, which is a diameter.

If the boundary contains at least three points, choose three of them whose triangle contains the center. If that triangle is acute, its circumcircle is $C$. If it is right, the longest side is a diameter of $C$ itself, so a boundary pair determines $C$. If it is obtuse, the longest side is a diameter of a strictly smaller circle that still contains the three points, and moving the center slightly covers the remaining boundary points as well, contradicting minimality. So some acute triple, or some diameter pair, determines $C$. $\square$
:::

::: math lemma Lemma
If $C$ is the smallest enclosing circle of a finite set $P$ and a point $p$ lies outside $C$, then $p$ lies on the boundary of the smallest enclosing circle of $P \cup \{p\}$.
:::

::: math proof Proof
Let $C'$ be the smallest enclosing circle of $P \cup \{p\}$. By the characterization lemma, $C'$ is determined by a basis $B$ of at most three boundary points. Suppose $p \notin B$. Then $B \subseteq P$, and $C'$ is the smallest circle containing $B$. Every circle that contains $P$ also contains $B$, so every enclosing circle of $P$ has radius at least the radius of $C'$. Since $C'$ encloses $P$, it is the smallest enclosing circle of $P$, namely $C$. But $p$ is outside $C$ and inside $C'$, a contradiction. Hence $p \in B$, so $p$ is on the boundary of $C'$. $\square$
:::

::: math lemma Lemma
The smallest circle with two distinct points $a$ and $b$ on its boundary is the circle with $ab$ as a diameter. Its radius is $\lVert a-b \rVert / 2$, and a point $p$ is inside it exactly when

$$
(p-a) \cdot (p-b) \le 0.
$$
:::

::: math proof Proof
Any circle through $a$ and $b$ has a chord of length $\lVert a-b \rVert$, so its radius is at least half that length. The diameter circle attains the bound. The dot product is the cosine of the angle at $p$ multiplied by the two side lengths; it is at most zero exactly when the angle at $p$ is at least a right angle, which is exactly the Thales condition for $p$ to lie inside or on the diameter circle. $\square$
:::

::: math lemma Lemma
If $a$, $b$, $c$ are distinct, the following holds. If they are not collinear, the only circle through all three is their circumcircle. If they are collinear, no circle passes through all three, and the smallest circle containing them is the diameter of the farthest pair.
:::

::: math proof Proof
Three non-collinear points determine a unique circle. For distinct collinear points, a circle intersects a line in at most two points, so no circle contains all three on its boundary. The smallest disk containing the three is the one whose diameter is the segment between the two extreme points, and the middle point lies on that segment. $\square$
:::

::: math theorem Theorem
The smallest enclosing circle of a finite nonempty set $S$ is unique.
:::

::: math proof Proof
Suppose two circles of the same minimum radius $r$ enclose $S$, with centers $c_1 \ne c_2$. Let $m$ be the midpoint of $c_1c_2$ and let $a = \lVert c_1-c_2 \rVert / 2 > 0$. Every point of $S$ lies in both disks, so it lies in their intersection, which is contained in the disk centered at $m$ with radius $\sqrt{r^2-a^2} < r$. That contradicts minimality. Hence the center is unique, and so is the circle. $\square$
:::

## Algorithm derivation

The algorithm keeps a circle in one of three forms:

- a point, which is the degenerate circle of radius $0$;
- a diameter pair $a,b$;
- a counterclockwise triple $a,b,c$, which stands for the circumcircle.

The containment test is the only geometric predicate the algorithm needs.

```cpp
bool inside(const Circle& c, const Point& p) {
    if (c.kind == 0) {
        return c.a.x == p.x && c.a.y == p.y;
    }
    if (c.kind == 1) {
        Point u{p.x - c.a.x, p.y - c.a.y};
        Point v{p.x - c.b.x, p.y - c.b.y};
        return dot(u, v) <= 0;
    }
    long long ax = c.a.x - p.x, ay = c.a.y - p.y;
    long long bx = c.b.x - p.x, by = c.b.y - p.y;
    long long cx = c.c.x - p.x, cy = c.c.y - p.y;
    long long al = ax * ax + ay * ay;
    long long bl = bx * bx + by * by;
    long long cl = cx * cx + cy * cy;
    long long det = ax * (by * cl - bl * cy)
                  - ay * (bx * cl - bl * cx)
                  + al * (bx * cy - by * cx);
    return det >= 0;
}
```

The triple form must be counterclockwise. If a triple is given in clockwise order, swapping two of its points reverses the sign of the determinant, so the setter normalizes the order before storing it.

```cpp
void set_circumcircle(Circle& c, Point a, Point b, Point d) {
    if (cross(a, b, d) < 0) std::swap(b, d);
    if (cross(a, b, d) == 0) {
        long long ab = d2(a, b), ad = d2(a, d), bd = d2(b, d);
        if (ab >= ad && ab >= bd) c = diameter_circle(a, b);
        else if (ad >= bd) c = diameter_circle(a, d);
        else c = diameter_circle(b, d);
        return;
    }
    c = Circle{2, a, b, d};
}
```

The driver is the three nested loops. The outer loop adds a point; the middle loop pins it; the inner loop pins a second point and fixes the third.

```cpp
Circle c = point_circle(p[0]);
for (int i = 0; i < n; i++) {
    if (inside(c, p[i])) continue;
    c = point_circle(p[i]);
    for (int j = 0; j < i; j++) {
        if (inside(c, p[j])) continue;
        c = diameter_circle(p[i], p[j]);
        for (int k = 0; k < j; k++) {
            if (!inside(c, p[k])) {
                set_circumcircle(c, p[i], p[j], p[k]);
            }
        }
    }
}
```

The final answer comes from the defining pair or triple. For a diameter pair, the squared radius is $|ab|^2/4$. For a triple, the circumradius satisfies

$$
R^2 = \frac{a^2 b^2 c^2}{16A^2}
    = \frac{a^2 b^2 c^2}{4 \operatorname{cross}(a,b,c)^2},
$$

where $a,b,c$ are the three side lengths and $A$ is the area of the triangle. The code accumulates the three squared side lengths and the squared cross product, and divides once at the end.

```cpp
long long squared_radius(const Circle& c) {
    if (c.kind == 0) return 0;
    if (c.kind == 1) return d2(c.a, c.b) / 4;
    long long ab = d2(c.a, c.b);
    long long bc = d2(c.b, c.c);
    long long ca = d2(c.c, c.a);
    long long cr = cross(c.a, c.b, c.c);
    return (ab * bc * ca) / (4 * cr * cr);
}
```

The division is exact because the statement guarantees that the squared radius is an integer. Without that guarantee, the answer would be a rational number, and the program would have to print a fraction or a scaled integer instead.

## Step-by-step execution

Take the three points $p_0=(5,0)$, $p_1=(0,5)$, and $p_2=(-3,-4)$. The final circle is the one centered at the origin with radius $5$, but the intermediate circles are smaller and have fractional squared radii.

Start with $C = \{p_0\}$.

**Point $p_1$.** It is outside the point circle. Reset $C=\{p_1\}$, then scan $j=0$. The point $p_0$ is outside $\{p_1\}$, so $C$ becomes the diameter circle of $p_1$ and $p_0$. Its squared radius is

$$
\frac{(5-0)^2+(0-5)^2}{4} = \frac{50}{4} = 12.5.
$$

There is no $k$ loop because $j=0$.

**Point $p_2$.** Its dot product against the diameter $p_0p_1$ is

$$
(p_2-p_0) \cdot (p_2-p_1) = (-8,-4) \cdot (-3,-9) = 24+36 = 60 > 0,
$$

so it is outside. Reset $C=\{p_2\}$ and scan.

| Step  | Current circle    | Test                           | Result                        |
| ----- | ----------------- | ------------------------------ | ----------------------------- |
| $j=0$ | $\{p_2\}$         | $p_0 \ne p_2$                  | Diameter $p_2p_0$, $R^2=20$   |
| $j=1$ | Diameter $p_2p_0$ | $(p_1-p_2)\cdot(p_1-p_0)=30>0$ | Diameter $p_2p_1$, $R^2=22.5$ |
| $k=0$ | Diameter $p_2p_1$ | $(p_0-p_2)\cdot(p_0-p_1)=20>0$ | Circumcircle $p_2,p_1,p_0$    |

The triple $p_2,p_1,p_0$ has

$$
\operatorname{cross}(p_2,p_1,p_0)
= (3,9) \times (8,4) = 3 \ast 4 - 9 \ast 8 = -60 < 0,
$$

so the setter swaps $p_1$ and $p_0$ and stores the counterclockwise triple $p_2,p_0,p_1$. Its squared radius is

$$
R^2 = \frac{90 \ast 50 \ast 80}{4 \ast (-60)^2} = \frac{360000}{14400} = 25.
$$

The three side lengths are $\sqrt{90}$, $\sqrt{50}$, and $\sqrt{80}$, and the final circle is the one through all three. The point $(0,0)$ lies at distance $5$ from the center, on the boundary as well, and any additional point at distance at most $5$ from the origin leaves the circle unchanged.

## Correctness proof

::: math theorem Theorem
The incremental construction returns the smallest enclosing circle of the input points.
:::

::: math proof Proof
Let $P_i$ be the first $i+1$ points. The outer invariant is that after iteration $i$, the current circle is the smallest enclosing circle of $P_i$.

**Base.** After iteration $0$, the circle is the point $p_0$, which is the smallest enclosing circle of one point.

**Outer step.** Suppose the invariant holds for $P_{i-1}$ and the current circle is $C$. If $p_i$ is inside $C$, then $C$ still encloses $P_i$, and no smaller circle can enclose $P_i$ because it would also enclose $P_{i-1}$. So $C$ remains minimal.

If $p_i$ is outside $C$, the forcing lemma says that $p_i$ lies on the boundary of the new smallest circle. The middle loop computes the smallest circle that encloses $P_{i-1}$ and has $p_i$ on its boundary. Its invariant is: before testing $p_j$, the current circle is the smallest circle that has $p_i$ on its boundary and encloses $p_0,\ldots,p_{j-1}$.

For $j=0$, the circle is the point $p_i$, which satisfies the invariant because the set of earlier points is empty. If $p_j$ is inside, the circle remains the smallest for the larger set with $p_i$ pinned, because any smaller circle for the larger set would also be a smaller circle for the smaller set. If $p_j$ is outside, the constrained forcing lemma says that the new constrained circle has $p_j$ on its boundary. The smallest circle with both $p_i$ and $p_j$ on its boundary is the diameter circle, and the inner loop restores the invariant by scanning $k < j$.

The inner invariant is: before testing $p_k$, the current circle is the smallest circle that has $p_i$ and $p_j$ on its boundary and encloses $p_0,\ldots,p_{k-1}$. If $p_k$ is inside, nothing changes. If it is outside, the constrained forcing lemma says that the new constrained circle has $p_k$ on its boundary. Three boundary points determine the circumcircle, which the setter stores after normalizing the orientation. When the three points are collinear, the constrained circle through $p_i$ and $p_j$ cannot enclose $p_k$ at all, because a disk through a chord meets the chord's line exactly in the chord. The setter then uses the farthest pair as a diameter, which is the smallest circle containing the three. This is the standard degenerate branch; the loop continues, and the final circle still encloses every input point.

When the inner loop ends, the circle is the smallest circle enclosing $P_j$ with $p_i$ and $p_j$ on its boundary. When the middle loop ends, the circle is the smallest circle enclosing $P_{i-1}$ with $p_i$ on its boundary, which is the smallest enclosing circle of $P_i$ because $p_i$ is forced onto the boundary. This proves the outer step.

**Termination.** The loops are finite, and after the last outer iteration the current circle is the smallest enclosing circle of the whole input. Uniqueness follows from the uniqueness theorem. $\square$
:::

The proof uses the constrained form of the forcing lemma: if a point is outside the smallest circle satisfying a set of boundary constraints, then the new constrained smallest circle has that point on its boundary. The proof is the same basis argument as before, with the pinned points added to every basis; a basis of the constrained problem has at most three points in total, and the pinned points are among them whenever they are feasible.

The collinear case is the one place where the constrained problem can be infeasible. The fallback is not an approximation: the farthest pair is the smallest circle containing the three collinear points, and it is the correct circle at that level. The outer loop then continues with the remaining points, and the final invariant is restored.

## Complexity analysis

| Stage                | Time                                 | Space  |
| -------------------- | ------------------------------------ | ------ |
| Outer loop           | $n$ iterations                       | $O(1)$ |
| Middle loop          | Up to $n$ iterations per outer step  | $O(1)$ |
| Inner loop           | Up to $n$ iterations per middle step | $O(1)$ |
| Containment test     | $O(1)$ integer operations            | $O(1)$ |
| Storing the points   | $O(n)$                               | $O(n)$ |
| Final squared radius | $O(1)$                               | $O(1)$ |

The deterministic worst case is $O(n^3)$: every level of pinning can scan almost the whole prefix. The bound is tight for an adversarial order, which is why the deterministic version is used here only for small inputs and for reproducible traces.

With a random permutation of the input, the same code runs in $O(n)$ expected time. The standard backward analysis observes that the smallest enclosing circle is determined by at most three points, so the probability that deleting a random point changes the circle is at most $3/i$. The expected work at level $i$ is therefore constant, and the three levels sum to $O(n)$. The shuffle is what turns the worst case into an expected bound; the answer itself does not depend on the order.

The arithmetic bound is the other cost. With coordinates of magnitude $C$, a squared difference is $O(C^2)$, the incircle determinant is $O(C^4)$, and the numerator of the circumradius is $O(C^6)$. For the reference contract $C \le 100$, the largest intermediate values are about $8 \times 10^4$, $2 \times 10^{10}$, and $5 \times 10^{14}$, all within a signed 64-bit integer. Larger coordinates require a wider type or a scaled rational representation, and the Pascal version deliberately avoids 128-bit integers.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The smallest circle around a point set | The incremental construction in this article |
| The smallest circle around the vertices of a convex polygon | The same construction on the hull vertices |
| The smallest circle around $10^5$ points | A randomized incremental method, expected $O(n)$ |
| A deterministic linear-time method | Megiddo's prune-and-search algorithm, which is complex |
| The smallest enclosing sphere in three dimensions | The same incremental idea with four boundary points |
| The smallest enclosing rectangle | Rotating calipers over the hull |
| The farthest pair of points | Rotating calipers, not the enclosing circle |
| The farthest-point Voronoi diagram | A vertex of the diagram gives the smallest enclosing circle |
| A circle of fixed radius that covers the most points | An angular sweep around each point |
| Covering with $k$ circles | A clustering problem; the general case is hard |

The choice between the deterministic and randomized versions is a contest decision. A deterministic order is easier to debug and produces a reproducible trace, but $O(n^3)$ is only safe for a few hundred points. A shuffle costs one line and gives the expected linear bound, and the answer is the same because the smallest circle is unique.

## Reference implementations

The six programs share one contract: read $n$, read $n$ integer points, and print the squared radius as one integer. They use the same deterministic order, the same exact predicates, and the same final formula, so they produce byte-identical output on every fixture.

| Language | File | Role |
| --- | --- | --- |
| C | `c/program.c` | The canonical C implementation, with an explicit struct and a dynamic point array |
| C++17 | `cpp17/program.cpp` | The same algorithm with `std::vector` and `std::swap` |
| Java | `java/Main.java` | The class `Main`, with a token scanner and `long` arithmetic |
| Python | `python/program.py` | The same algorithm with arbitrary-precision integers |
| Pascal | `pascal/program.pas` | The same algorithm with `Int64` records, written for pas2js |
| JavaScript | `javascript/program.js` | The same algorithm with safe integer arithmetic |

The JavaScript and Pascal listings carry the banner that they are educational reference implementations and not USACO submission languages. The Pascal listing uses `uses SysUtils;`, reads one argument per `Read`, and avoids `IOResult` and 128-bit integers so that it compiles under pas2js as well as Free Pascal.

## Recursion decision

The construction is iterative and should stay that way. The three nested loops are the iterative form of Welzl's recursive `minidisk` procedure, and they need no call stack at all.

A recursive formulation is shorter to state but has a depth of up to $n$ in the worst case, because each point can add one level to the recursion. The recursion is only safe when the input is shuffled and the expected depth is logarithmic, or when the language has a generous stack.

| Language   | Practical depth                      | Recommendation                               |
| ---------- | ------------------------------------ | -------------------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative; the loops have no recursion       |
| Java       | About $10^4$ frames                  | Iterative                                    |
| Python     | The interpreter limit of 1000        | Iterative; a recursive version can exceed it |
| Pascal     | The operating system stack           | Iterative                                    |
| JavaScript | About $10^4$ frames                  | Iterative                                    |

The iterative version also makes the boundary-pinning structure visible: the three loops are the three pinned points, and a recursive version hides that structure behind the call stack.

## Implementation walkthrough

The first decision is the representation. A circle is stored as its defining points, not as a center and a radius. The center and radius of a circumcircle are rational, and storing them would force rational arithmetic into every containment test. Storing the points keeps every test in integers.

```cpp
struct Point {
    long long x;
    long long y;
};

struct Circle {
    int kind;   // 0 point, 1 diameter, 2 circumcircle
    Point a;
    Point b;
    Point c;
};
```

The second decision is the containment test. Each form has its own predicate: equality for a point, a dot product for a diameter, and the incircle determinant for a triple. The determinant uses differences from the query point, which keeps the entries small and makes the sign convention independent of the absolute coordinates.

```cpp
Point u{p.x - c.a.x, p.y - c.a.y};
Point v{p.x - c.b.x, p.y - c.b.y};
return dot(u, v) <= 0;          // diameter
```

The third decision is the orientation. The circumcircle setter swaps two points when the cross product is negative, so the stored triple is always counterclockwise. The inside test then uses `det >= 0` without a conditional sign adjustment.

The fourth decision is the collinear fallback. A zero cross product means that no circumcircle exists. The setter compares the three squared side lengths and keeps the farthest pair as the diameter. The comparisons use `>=` so that ties are resolved in a fixed order.

The fifth decision is the final formula. For a diameter, divide the squared distance by $4$. For a triple, multiply the three squared side lengths and divide by four times the squared cross product. Both divisions are exact under the contract, and both fit in a signed 64-bit integer for the stated coordinate range.

The driver must reset the circle to a point before the middle loop and to a diameter before the inner loop. A common bug is to reset only the outer circle; the inner levels then test against a circle that still contains the old boundary constraints.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Testing containment with `double` | A boundary point is classified on the wrong side | Use integer predicates for integer input |
| Forgetting the collinear triple | The circumcircle divides by a zero cross product | Fall back to the farthest pair |
| Storing a clockwise triple | The incircle sign is reversed and the circle shrinks | Normalize the orientation before storing |
| Dividing the squared radius too early | The integer division truncates a fractional intermediate | Divide only at the end |
| Using the farthest pair as the answer | An acute triple needs a larger circle | Check three-point candidates |
| Not rechecking earlier points after a reset | A point processed before the reset is lost | Run the full nested loops from the reset |
| Resetting only the outer circle | The inner loop keeps stale boundary points | Reset at every level |
| Overflowing the circumradius numerator | The answer is negative or wrong | Bound the coordinates or use a wider type |

### Why this fails: the farthest pair is not the smallest circle

The plausible wrong approach is to take the two points that are farthest apart and use their diameter as the answer. It is correct when the farthest pair is antipodal in the smallest circle, but an acute triangle is a counterexample.

Take the three points $(0,0)$, $(4,0)$, and $(2,3)$. The farthest pair is $(0,0)$ and $(4,0)$, and their diameter circle has center $(2,0)$ and squared radius $4$. The third point is at distance $3$ from the center, so it lies outside that circle. The smallest enclosing circle is the circumcircle of the three points, which has squared radius

$$
\frac{16 \ast 13 \ast 13}{4 \ast 12^2} = \frac{2704}{576} = \frac{169}{36} \approx 4.69,
$$

which is larger than $4$. A program that returns the farthest pair is wrong on the smallest interesting input, three points in an acute triangle.

The same counterexample breaks a related shortcut: taking the diameter of the convex hull with rotating calipers and calling it the smallest enclosing circle. The hull's diameter is a lower bound, not the answer.

### Why this fails: the obtuse circumcircle

A second plausible wrong approach is to take the circumcircle of every triple and keep the largest one. The smallest enclosing circle is the largest of the smallest circles determined by a pair or a triple, but only if each candidate is the _smallest_ circle of its subset, not its circumcircle. For an obtuse triangle, the circumcircle is larger than the diameter of the longest side, so a program that uses the circumcircle of every triple overestimates the answer.

The algorithm in this article never uses the circumcircle of an obtuse triple as the final answer. It uses it only as the circle with three pinned boundary points, which is the correct constrained circle at that level. The final circle is the one left after all rechecks, and its radius is the radius of an acute triple or a diameter pair.

### Why this fails: collinear points

The naive enumeration meets collinear triples immediately. Three points on a line, such as $(0,0)$, $(1,0)$, and $(3,0)$, have no circumcircle, and the three-point formula divides by zero. The smallest circle containing them is the diameter of the extremes, with squared radius $2.25$, and the middle point is redundant. The incremental setter needs the same check for the same reason: a zero cross product means that the three-point candidate does not exist.

## Variants and extensions

- **Randomized incremental construction.** Shuffle the points before the same three loops. The expected running time becomes $O(n)$, and the answer is unchanged because the smallest circle is unique.
- **Welzl's recursive algorithm.** The recursive form of the same construction, with the boundary points passed as an explicit set. It is the cleanest proof of the expected linear bound.
- **Megiddo's algorithm.** A deterministic prune-and-search method that runs in linear time and is considerably harder to implement.
- **The farthest-point Voronoi diagram.** The center of the smallest enclosing circle can be read from the diagram, and the diagram can be built in $O(n \log n)$ time.
- **The smallest enclosing sphere.** The same incremental idea in three dimensions, with up to four boundary points. The number of pinned points grows with the dimension.
- **Convex hull reduction.** The smallest enclosing circle depends only on the convex hull, so a hull computation can reduce the input before the construction.
- **Covering with a fixed radius.** The question "how many points fit in a circle of radius $r$" is an angular sweep, not the smallest enclosing circle, and it is a useful contrast.
- **The 1-center problem.** The smallest enclosing circle is the unweighted 1-center problem; weighted and constrained variants change the objective and the algorithm.

## Contest strategy

1. Read the required output carefully. The radius, the diameter, the squared radius, and the center are four different answers, and the tolerance or the exactness requirement decides the arithmetic.
2. Use integer predicates when the input is integer. A `double` is acceptable for a tolerance output, but the containment test still needs a consistent epsilon or an exact formulation.
3. Choose the version by the constraints. The deterministic construction is enough for a few hundred points; for $10^5$ points, shuffle or use a linear-time method.
4. Handle the degenerate cases explicitly: $n=1$, $n=2$, all points collinear, duplicate points, and cocircular points.
5. Normalize the orientation of every triple before the incircle test. A clockwise triple reverses the sign and silently shrinks the circle.
6. Test the program against the $O(n^4)$ enumeration on random sets of up to ten points. A disagreement is either a containment sign, a collinear case, or a lost reset, and all three are worth finding before the contest.

## Worked problems

### Problem 1: Enclose All

**Restatement.** Given $n$ points, find the minimum radius of a circle that contains every point inside or on its boundary.

**Constraints.** $2 \le n \le 50$, $0 \le x_i,y_i \le 1000$, all points distinct, and the answer is accepted within $10^{-6}$ absolute or relative error.

**Naive baseline.** Enumerate every pair and every triple, build the candidate circle, test all points, and keep the smallest. The cost is $O(n^4)$, which is small for $n \le 50$.

**Insight.** The smallest circle is determined by a diameter pair or an acute triple, and the incremental construction finds it while generating only the candidates that a violation forces.

**Derivation.** Keep the current circle. When a point is outside, pin it, rescan the earlier points, pin a second, then a third. The final circle is the answer.

**Correctness.** The forcing lemma and the characterization theorem give the invariant proof in the correctness section.

**Complexity.** Deterministic $O(n^3)$ time and $O(n)$ space; with a shuffle, expected $O(n)$.

**Common wrong approach.** Returning the diameter of the farthest pair. The acute triangle $(0,0)$, $(4,0)$, $(2,3)$ is a counterexample, as shown above. Because the output is a radius rather than a squared radius, the final square root is needed.

### Problem 2: Minimum Enclosing Circle

**Restatement.** Given $n$ points, output the center and the radius of the smallest circle that contains all of them.

**Constraints.** $2 \le n \le 100000$ and $-10^6 \le x_i,y_i \le 10^6$. The output is a center and a radius with an error below $10^{-6}$.

**Naive baseline.** The $O(n^4)$ enumeration is far too slow, and even the deterministic incremental construction is $O(n^3)$ in the worst case.

**Insight.** A random shuffle makes the incremental construction expected linear, and the deterministic order is the only reason the worst case is cubic.

**Derivation.** Shuffle the points, run the same three loops, and recover the center from the final defining pair or triple. For a diameter pair the center is the midpoint; for a triple it is the circumcenter.

**Correctness.** The shuffle changes only the order, and the smallest circle is unique, so the output is the same as for the deterministic order.

**Complexity.** Expected $O(n)$ time and $O(n)$ space. The arithmetic must use `double` for the center and radius, or a rational representation if an exact center is required.

**Common wrong approach.** Using a ternary search over the center and stopping after a fixed number of iterations. The result depends on the iteration count and can miss a narrow feasible region; the incremental construction has a proof and a fixed expected bound.

### Problem 3: Points on the boundary

**Restatement.** Given $n$ points, find which of them lie on the circumference of the smallest enclosing circle.

**Constraints.** $n \le 100000$, integer coordinates, and the answer is a membership flag for every input point.

**Naive baseline.** Testing every point against every candidate circle is $O(n^4)$, and even testing all points against the final circle without computing it correctly is not enough.

**Insight.** Compute the smallest enclosing circle once, then test each point against the final defining pair or triple. A point is on the boundary exactly when its containment predicate is zero.

**Derivation.** Run the randomized construction to get the defining pair or triple. For a diameter pair, the boundary test is an equality in the Thales predicate; for a triple, it is a zero incircle determinant. Points strictly inside are excluded, and the defining points themselves are included.

**Correctness.** The final circle is the smallest enclosing circle, and the exact predicates classify every point as inside, on the boundary, or outside. The set of boundary points is exactly the set of input points that satisfy the equality.

**Complexity.** Expected $O(n)$ time for the construction and $O(n)$ for the boundary scan, with $O(n)$ space.

**Common wrong approach.** Using squared distances to the center with a floating-point epsilon. The boundary points of the defining circle satisfy the predicate exactly in integer arithmetic, and an epsilon can include a point that is strictly inside or exclude one that is on the boundary.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about a smallest enclosing circle, a smallest enclosing rectangle, a farthest pair, or a fixed-radius coverage, and write down whether the output is exact or a tolerance.
2. **Direct application.** Implement the exact containment predicates for a point, a diameter, and a triple, and test each one against a brute-force distance computation on small random sets.
3. **Adaptation.** Add the collinear fallback, the orientation normalization, and the exact squared-radius formula. Test the three degenerate cases: one point, two points, and three collinear points.
4. **Combination.** Compute the smallest enclosing circle, then answer a second question with it: the boundary membership of every point, the area of the circle, or the farthest distance from a query point.
5. **Challenge.** Add a shuffle and compare the deterministic and randomized versions on the same input. Then compare both against the $O(n^4)$ enumeration on random sets of ten points.
6. **Transfer.** Recognize the same construction in the smallest enclosing sphere, in the 1-center facility location problem, and in the farthest-point Voronoi diagram. The number of pinned points changes with the dimension, but the forcing argument does not.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the characterization of the smallest enclosing circle: which two kinds of boundary sets determine it? (Formal model)
2. Why does an outside point have to lie on the boundary of the new smallest circle? (Key insight and Formal model)
3. What is the smallest circle with two fixed boundary points, and which dot-product test decides containment? (Formal model)
4. Why is the incircle determinant positive inside a counterclockwise triple, and what happens if the triple is clockwise? (Formal model and Algorithm derivation)
5. What does the algorithm do when the three pinned points are collinear, and why is that not an approximation? (Algorithm derivation and Correctness proof)
6. Trace the three-point example and say which circle is current at each level. (Step-by-step execution)
7. Why is the deterministic running time $O(n^3)$, and what changes with a shuffle? (Complexity analysis)
8. What type is needed for the incircle determinant and the squared-radius numerator under the stated coordinate bound? (Complexity analysis)
9. Why is the farthest pair not the answer, and what is the smallest counterexample? (Common mistakes)
10. How do the six reference programs keep their outputs identical? (Reference implementations)

## Further reading

- The [convex hull](/algorithms/geometry/convex-hull) is the polygon analog of this circle, and its monotone chain uses the same orientation test.
- [Rotating calipers](/algorithms/geometry/rotating-calipers) answers the farthest-pair and minimum-enclosing-rectangle questions over a hull, which are useful contrasts to the smallest enclosing circle.
- [Closest pair](/algorithms/geometry/closest-pair) is the other classical divide-and-conquer problem on points, and its strip argument is a different use of geometry.
- [Point in polygon](/algorithms/geometry/point-in-polygon) covers the containment tests that surround a computed shape.
- [Sweep line](/algorithms/geometry/sweep-line) is the technique behind the fixed-radius coverage problem, which is often confused with this one.
- [Ternary search](/algorithms/searching/ternary-search) is the approximate alternative for a unimodal objective, and its limitations are worth understanding.
- [Sorting](/algorithms/foundations/sorting) is the prerequisite for every hull-based method and for the shuffle that makes the incremental construction linear in expectation.
- [Discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics) develops the vectors, determinants, and signed areas that the predicates use.
