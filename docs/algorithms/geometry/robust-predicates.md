---
id: geometry.robust-predicates
title: Robust predicates
summary: Decide the orientation of three integer points from the exact sign of a cross product, with a stated integer width instead of an epsilon.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: common-contest-technique
keywords:
    [
        orientation,
        cross product,
        exact arithmetic,
        collinearity,
        segment intersection,
        integer overflow,
    ]
prerequisites:
    required: [foundations.complexity, foundations.binary-representation]
    recommended: [geometry.convex-hull, geometry.integer-geometry]
complexity:
    time: "O(1) per query"
    space: "O(1)"
assumptions:
    - Every coordinate is an integer with absolute value at most 10^6, so every product and every cross product stays below 2^53 and the Pascal variant is exact; the JavaScript variant uses BigInt.
    - A query is a triple of points; duplicate points are allowed and produce the collinear answer.
implementations: geometry.robust-predicates
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/geometry.robust-predicates.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

The orientation predicate takes three points and answers one of three questions: does the path from the first point to the second to the third turn left, go straight, or turn right? The answer is the sign of a two by two determinant, and with integer coordinates that determinant is an integer.

The technique is not the formula. The formula is one line. The technique is the discipline around it: compute the determinant in an integer type wide enough for the largest value the input can produce, compare it with zero, and never replace the comparison by an epsilon or a division.

Every convex hull, every segment intersection, every point-in-polygon test and every sorting-by-angle comparator is a pile of orientation predicates. One predicate with the wrong sign turns a correct algorithm into a wrong one, and the failure appears on exactly the inputs that are closest to collinear.

## Problem motivation

Consider the CSES problem [Point Location Test](https://cses.fi/problemset/task/2189). Each query gives three integer points with coordinates between $-10^9$ and $10^9$, and asks whether the third point is to the left of the line through the first two, to the right, or on it. There are up to $10^5$ queries, so each one must be answered in constant time.

The first solution that comes to mind computes the slope of the line through the first two points and compares it with the slope of the line through the first and third. That solution divides, and division is the problem. The line can be vertical, so the slope is infinite; and even when it is not vertical, a double has 53 bits of significand while the products inside the comparison reach $4 \ast 10^{18}$. A point that lies a distance of one unit from the line can produce two slopes that are equal as doubles.

The same predicate sits inside every geometric algorithm. Andrew's monotone chain in [convex hull](/algorithms/geometry/convex-hull) removes a point from the chain when three points do not turn left. A segment intersection test asks whether the endpoints of one segment lie on opposite sides of the other. A point-in-polygon test asks whether a query point is left of an edge or exactly on it. A hull that uses a predicate with a wrong sign is not approximately right; it can be non-convex, skip a vertex, or include an interior point.

The constraints make the per-query cost trivial. The input is integral, the answer is discrete, and the only correct comparison is against exact zero. The difficulty is entirely in the arithmetic, and that is what this page is about.

## Recognition patterns

A robust orientation predicate is the right tool when the statement contains some of these phrases.

- "Left", "right", "on the line", "which side of the line".
- "Clockwise", "counterclockwise", "the turn from $A$ to $B$ to $C$".
- "Collinear", "on the same line", "the three points lie on a line".
- "Do the segments intersect", "does the segment touch the polygon".
- "Inside", "on the boundary", "outside".
- "Convex hull", "the outermost points", "the turn at a vertex".

The constraint values decide how wide the arithmetic must be.

| Situation | What it rules |
| --- | --- |
| The coordinates are integers | The determinant is an integer, so an exact sign exists |
| Coordinates at most $10^4$ in absolute value | A 32-bit product is enough for the difference form |
| Coordinates at most $10^6$ in absolute value | 64-bit integers are enough, and so are doubles that stay below $2^{53}$ |
| Coordinates up to $10^9$ in absolute value | A signed 64-bit type is needed; a JavaScript number is not enough |
| Collinearity must be distinguished from near-collinearity | No epsilon can be correct |
| The coordinates are real numbers | Scale them to integers, or use an adaptive predicate |
| The question asks only for a side | Do not compute an intersection point or a distance |
| The question asks for an intersection point | The sign predicate is only the first half; the coordinates need rational arithmetic |
| The points are sorted by angle | The comparator is the same predicate, with a half-plane tie-break |

The quiet phrase that rules the technique in is "the coordinates are integers". It says that the answer is a comparison of two integers, not an approximation of a real number. The phrase that rules the naive version out is "up to $10^9$": at that size the products no longer fit in the type that many first drafts use.

## Naive approach

The slope comparison is the usual first attempt.

```cpp
double slope_ab = (double)(b.y - a.y) / (double)(b.x - a.x);
double slope_ac = (double)(c.y - a.y) / (double)(c.x - a.x);
if (slope_ab == slope_ac) {
    // collinear
} else if (slope_ac > slope_ab) {
    // left
} else {
    // right
}
```

It is wrong in three independent ways.

- **The vertical line.** If `a.x == b.x`, the first division is by zero. The slope is infinite, and the comparison with `slope_ac` is meaningless.
- **The rounding.** The slopes are doubles. Two distinct rational slopes can round to the same double, and the program then reports collinear points that are not collinear.
- **The direction.** A slope comparison does not know the direction from $A$ to $B$. Swapping $A$ and $B$ leaves the slopes unchanged but flips the answer, so the code has to repair the convention by hand.

Computing the cross product itself in `double` is better, because it needs no division, but it is not exact.

```cpp
double d = (double)(b.x - a.x) * (c.y - a.y)
         - (double)(b.y - a.y) * (c.x - a.x);
if (std::abs(d) < 1e-9) {
    // collinear
}
```

The epsilon has no safe value. If it is large enough to absorb the rounding of a large product, it also absorbs genuine triangles whose area is small. If it is small enough to keep those triangles, it does not absorb the rounding. At coordinates of magnitude $10^8$, two products near $10^{16}$ are rounded to the same double, and a triangle of area $1/2$ is reported as flat. The failure is not a small error in a computed area; it is a different answer to the question.

A third baseline computes the determinant with exact big integers. It is correct, and Python's `int` makes it a one-liner, but it is not needed at the bounds where a 64-bit integer already holds every intermediate value. The rest of this page finds the width that is needed and keeps the arithmetic as small as that width allows.

## Key insight

The insight is that **the answer is the sign of an integer, so the program never needs the value of the determinant, only its comparison with zero**.

That changes the problem from numerical analysis to width analysis. The determinant of two integer vectors is an integer. Its sign is one of three values. There is no approximation, no tolerance, and no division. The only arithmetic way the program can be wrong is if an intermediate value does not fit in the type, so the whole technique reduces to choosing a type that holds the largest intermediate value the input can produce.

Translation is the second half of the insight. The determinant can be computed from $B - A$ and $C - A$ instead of from the raw coordinates, and the differences are bounded by $2M$ wherever the triangle sits relative to the origin. That makes the width analysis local: the bound is stated in terms of the coordinate range $M$, not in terms of the distance from the origin.

The zero case is not a nuisance. It is the exact answer to "are the points collinear", and it is the boundary case in every point-in-polygon and segment-intersection problem. A predicate that returns zero for an exact zero and a nonzero value for every other input is a complete geometric primitive. An epsilon destroys exactly that property.

## Visual intuition

Draw the directed line from $A$ to $B$. It divides the plane into a left half and a right half. The third point $C$ is in one of them, or on the line.

```text
            C  (left)
            *
            |
            |
   A *------+------* B
            |
            *
            C  (right)
```

The sign of the determinant says which half. It is also twice the signed area of the triangle $ABC$. When $C$ is above the line, the triangle is traversed counterclockwise from $A$ to $B$ to $C$ and the signed area is positive. When $C$ is below, the traversal is clockwise and the signed area is negative. When $C$ is on the line, the triangle has no area and the determinant is zero.

The sign is invariant under a cyclic relabeling of the three points, and it flips under a swap of any two of them. Write $s$ for the sign of $(A, B, C)$.

| Order of the triple | Sign of the determinant |
| ------------------- | ----------------------- |
| $(A, B, C)$         | $s$                     |
| $(B, C, A)$         | $s$                     |
| $(C, A, B)$         | $s$                     |
| $(A, C, B)$         | $-s$                    |
| $(C, B, A)$         | $-s$                    |
| $(B, A, C)$         | $-s$                    |

The picture that makes the rounding failure believable is a sliver. Take

$$
A = (0, 0), \qquad B = (10^8, 10^8 - 1), \qquad C = (10^8 - 1, 10^8 - 2).
$$

The three points are not collinear: the determinant is $-1$, so the triangle has area $1/2$. But the bounding box of the three points is $10^8$ units wide, and the middle point misses the line by a distance of about $10^{-8}$. To the eye the three points are on one line; to exact arithmetic they form a triangle with the smallest possible positive area. A drawing at any finite resolution shows a line, which is why the picture cannot replace the sign.

The determinant is twice the area of the parallelogram spanned by $B - A$ and $C - A$. That parallelogram is enormous, but its two nearly parallel sides differ by one unit of area. The sign is decided by that one unit.

## Formal model

::: math definition Definition
A **point** is an ordered pair of integers $(x, y)$. For points $A$, $B$ and $C$, put $u = B - A$ and $v = C - A$ and define the **cross product**

$$
\operatorname{cross}(A, B, C) = u_x v_y - u_y v_x
= (B_x - A_x)(C_y - A_y) - (B_y - A_y)(C_x - A_x).
$$

The **orientation** of the ordered triple $(A, B, C)$ is the sign of this integer: positive for a counterclockwise turn, negative for a clockwise turn, and zero for collinear points.
:::

::: math definition Definition
The geometry is described by the **integer model**: every coordinate is an integer in the interval $[-M, M]$, and every arithmetic operation is exact as long as its result is representable in the type used by the program. A program computes the **exact predicate** if, for every triple in the model, its output equals the sign of the mathematical cross product.
:::

::: math lemma Lemma (Translation)
For any point $T$, $\operatorname{cross}(A + T, B + T, C + T) = \operatorname{cross}(A, B, C)$.
:::

::: math proof Proof
Translation leaves $B - A$ and $C - A$ unchanged: $(B + T) - (A + T) = B - A$, and similarly for $C$. The determinant is therefore unchanged. $\square$
:::

::: math lemma Lemma (Signed area)
$\operatorname{cross}(A, B, C)$ is twice the signed area of the triangle $ABC$, positive when the vertices are traversed counterclockwise.
:::

::: math proof Proof
The shoelace sum of the triangle is

$$
A_x(B_y - C_y) + B_x(C_y - A_y) + C_x(A_y - B_y).
$$

Expanding the definition of the cross product gives

$$
(B_x - A_x)(C_y - A_y) - (B_y - A_y)(C_x - A_x)
= A_x(B_y - C_y) + B_x(C_y - A_y) + C_x(A_y - B_y),
$$

which is the shoelace sum. The shoelace sum is twice the signed area, and its sign is positive exactly for a counterclockwise traversal. $\square$
:::

::: math lemma Lemma (Collinearity)
$\operatorname{cross}(A, B, C) = 0$ if and only if $A$, $B$ and $C$ are collinear.
:::

::: math proof Proof
By the signed-area lemma, the cross product is zero exactly when the triangle has area zero. A triangle has area zero exactly when its three vertices lie on one line. Alternatively, $u$ and $v$ are linearly dependent exactly when one is a scalar multiple of the other, which is the same condition. $\square$
:::

::: math lemma Lemma (Width)
If every coordinate of $A$, $B$ and $C$ has absolute value at most $M$, then

$$
\left| \operatorname{cross}(A, B, C) \right| \le 8M^2.
$$

:::

::: math proof Proof
Each coordinate difference is at most $2M$ in absolute value, so each of the two products is at most $4M^2$ in absolute value. Their difference is at most the sum of their absolute values, which is $8M^2$. $\square$
:::

The bound is conservative. The true maximum is $4M^2$, attained by three corners of the bounding square, but the factor of two costs nothing in the widths used here. The conservative form has the advantage that it follows from the arithmetic alone.

::: math theorem Theorem (Exact sign)
Let $A$, $B$ and $C$ be points whose coordinates have absolute value at most $M$. If every intermediate value in the computation of $\operatorname{cross}(A, B, C)$ is representable in the integer type used by the program, then the program prints $1$ when $C$ is strictly left of the directed line from $A$ to $B$, $0$ when the three points are collinear, and $-1$ when $C$ is strictly right.
:::

The proof is in the correctness section, because it depends on the exact bounds of the implementation.

## Algorithm derivation

The algorithm is four differences, two products, one subtraction and two comparisons per query.

```text
read q
repeat q times:
    read ax, ay, bx, by, cx, cy
    ux = bx - ax
    uy = by - ay
    vx = cx - ax
    vy = cy - ay
    d = ux * vy - uy * vx
    if d > 0: print 1
    else if d < 0: print -1
    else: print 0
```

The corresponding C++ helper is the whole technique.

```cpp
struct Point {
    long long x;
    long long y;
};

long long cross(Point a, Point b, Point c) {
    long long ux = b.x - a.x;
    long long uy = b.y - a.y;
    long long vx = c.x - a.x;
    long long vy = c.y - a.y;
    return ux * vy - uy * vx;
}

int orientation(Point a, Point b, Point c) {
    long long d = cross(a, b, c);
    return (d > 0) - (d < 0);
}
```

The reference programs read the six coordinates into scalars and inline the same expression; the helper form keeps the worked problems readable.

Each step has a reason.

**Read into the wide type.** The coordinates are read as `long long`, not as `int`, so that the later subtraction and multiplication are already in the wide type. Reading into `int` and widening at the multiplication is a common mistake, and it is invisible until a product overflows.

**Subtract $A$ first.** By the translation lemma the sign is unchanged. Every difference is at most $2M$ in absolute value, so the width bound depends on the coordinate range and not on where the triangle sits. The difference form also needs only two products, which is the smallest number for a determinant of two vectors.

**Multiply the differences.** The two products are the only values that can grow. Their difference is compared with zero, so no division, no square root and no trigonometry appears.

**Return the sign.** The expression `(d > 0) - (d < 0)` maps a positive value to $1$, a negative value to $-1$ and zero to $0$. It relies on the conversion of `bool` to `int`; the reference programs use the explicit conditional form because it reads the same in all six languages.

The order of the arguments matters. The predicate answers a question about the directed line from the first point to the second. Swapping the first two points negates the determinant and therefore flips the answer, and a program that swaps them without saying so is wrong on every non-collinear input. The problem statement fixes the convention; the code must keep it.

## Step-by-step execution

The table walks seven triples through the formula. The columns `u` and `v` are $B - A$ and $C - A$; the columns `t1` and `t2` are $u_x v_y$ and $u_y v_x$.

| $A$ | $B$ | $C$ | $u$ | $v$ | `t1` | `t2` | $d$ | Output |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $(0,0)$ | $(1,0)$ | $(0,1)$ | $(1,0)$ | $(0,1)$ | $1$ | $0$ | $1$ | $1$ |
| $(0,0)$ | $(0,1)$ | $(1,0)$ | $(0,1)$ | $(1,0)$ | $0$ | $1$ | $-1$ | $-1$ |
| $(0,0)$ | $(1,1)$ | $(2,2)$ | $(1,1)$ | $(2,2)$ | $2$ | $2$ | $0$ | $0$ |
| $(0,0)$ | $(0,2)$ | $(-1,1)$ | $(0,2)$ | $(-1,1)$ | $0$ | $-2$ | $2$ | $1$ |
| $(3,-2)$ | $(3,-2)$ | $(5,7)$ | $(0,0)$ | $(2,9)$ | $0$ | $0$ | $0$ | $0$ |
| $(0,0)$ | $(10^6, 10^6 - 1)$ | $(10^6 - 1, 10^6 - 2)$ | $(10^6, 10^6 - 1)$ | $(10^6 - 1, 10^6 - 2)$ | $999998000000$ | $999998000001$ | $-1$ | $-1$ |
| $(-10^6,-10^6)$ | $(10^6,-10^6)$ | $(-10^6,10^6)$ | $(2 \ast 10^6, 0)$ | $(0, 2 \ast 10^6)$ | $4 \ast 10^{12}$ | $0$ | $4 \ast 10^{12}$ | $1$ |

The rows are chosen to make the cases visible.

- Rows 1 and 2 are the same three points with $B$ and $C$ swapped. The determinant changes sign, which is the antisymmetry of the predicate.
- Row 3 is the collinear case. The determinant is zero, and no epsilon is involved.
- Row 4 is a vertical line. The slope is undefined, but the determinant is $2$, so the predicate has no special case for vertical lines.
- Row 5 has $A = B$. The difference $u$ is zero, so both products are zero and the answer is collinear. Duplicate points need no test of their own.
- Row 6 is the near-collinear case at the reference bound. The two products differ by one, and the output is $-1$. The products are below $10^{12}$, so every language in the reference set computes them exactly.
- Row 7 reaches the true maximum, $4 \ast 10^{12}$, at three corners of the coordinate square, which is half of the conservative bound.

The last row also shows why the sign, and not the magnitude, is the useful output. The determinant is large, but the only thing the algorithm does with it is compare it with zero.

## Correctness proof

::: math theorem Theorem
The reference program prints $1$ for a counterclockwise triple, $0$ for a collinear triple and $-1$ for a clockwise triple, for every input whose coordinates have absolute value at most $10^6$.
:::

::: math proof Proof
Let $A$, $B$ and $C$ be one query.

**The computed value is the mathematical cross product.** The program reads the six coordinates exactly, because every integer in $[-10^6, 10^6]$ is representable in every type used by the six programs. By the translation lemma, the value it computes, $(B_x - A_x)(C_y - A_y) - (B_y - A_y)(C_x - A_x)$, is $\operatorname{cross}(A, B, C)$.

**No intermediate value overflows.** Each difference has absolute value at most $2 \ast 10^6$. Each product has absolute value at most $4 \ast 10^{12}$. Their difference has absolute value at most $8 \ast 10^{12}$ by the width lemma. This is below $2^{53} \approx 9.0 \ast 10^{15}$, so the value is exact in a signed 64-bit integer, in the double-backed integer of the browser Pascal build, and in the JavaScript `BigInt` that the reference variant uses. No operation in the computation is rounded.

**The sign is the geometric answer.** By the signed-area lemma, the computed value is twice the signed area of the triangle. A positive signed area means the traversal $A \to B \to C$ is counterclockwise, which is exactly the statement that $C$ lies strictly to the left of the directed line from $A$ to $B$. A negative value means the traversal is clockwise and $C$ lies strictly to the right. By the collinearity lemma, the value is zero exactly when the points are collinear.

**The output maps the three cases correctly.** The conditional prints $1$ for a positive value, $-1$ for a negative value and $0$ for zero. The program reads exactly six integers per query and prints one line per query, so the output order matches the input order. $\square$
:::

The proof has one hypothesis that is easy to lose: the coordinate bound. The algebra is exact over the integers for any coordinates. The machine arithmetic is exact only while every intermediate value fits. If the input bound is raised to $10^9$, the same formula is still correct, but a JavaScript number or a browser Pascal `Int64` no longer holds the products; the reference JavaScript variant uses `BigInt` for exactly this reason, and the Pascal variant stays within the bound. The program must be widened, not the formula changed. The next section quantifies the change.

## Complexity analysis

| Stage                     | Time   | Space  |
| ------------------------- | ------ | ------ |
| Reading one query         | $O(1)$ | $O(1)$ |
| Computing the determinant | $O(1)$ | $O(1)$ |
| Printing one sign         | $O(1)$ | $O(1)$ |
| All $q$ queries           | $O(q)$ | $O(1)$ |

The per-query work is four differences, two products, one subtraction and at most two comparisons. There is no loop inside a query, no division, and no recursion. With $q = 10^5$ the arithmetic is negligible and the input and output dominate, which is why the reference programs use buffered or token-based input.

The auxiliary space is $O(1)$: the predicate needs a handful of variables, and no query depends on an earlier one. The C and C++ programs stream the input, the Pascal program reads one value at a time, and the Python, Java and JavaScript programs buffer the whole input text, which costs $O(q)$ space for the input itself.

The interesting bound is the width.

| $M$ | Largest difference | Largest product | Cross product bound | 32-bit? | Below $2^{53}$? | 64-bit? |
| --- | --- | --- | --- | --- | --- | --- |
| $10^4$ | $2 \ast 10^4$ | $4 \ast 10^8$ | $8 \ast 10^8$ | Yes | Yes | Yes |
| $10^6$ | $2 \ast 10^6$ | $4 \ast 10^{12}$ | $8 \ast 10^{12}$ | No | Yes | Yes |
| $10^8$ | $2 \ast 10^8$ | $4 \ast 10^{16}$ | $8 \ast 10^{16}$ | No | No | Yes |
| $10^9$ | $2 \ast 10^9$ | $4 \ast 10^{18}$ | $8 \ast 10^{18}$ | No | No | Yes, with little margin |
| $2 \ast 10^9$ | $4 \ast 10^9$ | $1.6 \ast 10^{19}$ | $3.2 \ast 10^{19}$ | No | No | No |

The thresholds follow from the conservative bound $8M^2$.

- A signed 32-bit integer holds $8M^2$ while $M \le 16383$.
- A double holds every integer below $2^{53}$ while $M \le 3.35 \ast 10^7$.
- A signed 64-bit integer holds $8M^2$ while $M \le 1.073 \ast 10^9$.

The reference programs state $M = 10^6$, which is more than an order of magnitude below the $2^{53}$ threshold. The CSES problem's bound of $10^9$ is just below the 64-bit threshold, so the same formula needs a true 64-bit type there; a JavaScript number and a browser Pascal `Int64` are both doubles, so the reference JavaScript variant uses `BigInt` and the Pascal variant stays within the bound. A native Free Pascal build represents `Int64` exactly and is fine at $10^9$.

The comparison of the two thresholds is the practical lesson. A signed 64-bit integer is not a license to use $10^9$ coordinates everywhere: it is enough for the **products** and the **difference** in this formula, but the same coordinates in a determinant with more terms, such as the incircle test, exceed it. The width analysis must be repeated for every predicate, not copied from this one.

## Algorithm selection

| Question | Predicate or method |
| --- | --- |
| Which side of a directed line is a point on? | The sign of $\operatorname{cross}(A, B, P)$ |
| Are three points collinear? | $\operatorname{cross}(A, B, C) = 0$ |
| Does a point lie on a segment? | The cross product is zero and the point is inside the segment's bounding box |
| Do two segments intersect? | Four orientation signs, plus the collinear and endpoint cases |
| Is a point inside a polygon? | Ray crossing with exact orientation signs, or a winding number |
| Which points are the vertices of a convex hull? | The orientation test on every triple considered by the hull algorithm |
| Is a point inside a circle? | The incircle determinant, a $4 \times 4$ determinant with a larger width |
| What is the orientation of a whole polygon? | The sign of the shoelace sum in [integer geometry](/algorithms/geometry/integer-geometry) |
| Which of two vectors has the smaller angle? | The same cross product, with a half-plane tie-break |
| What are the coordinates of an intersection? | Rational arithmetic; the sign predicate alone is not enough |

The last two rows are the boundaries of the technique.

A comparator that sorts vectors by angle needs the cross product for the order, but it also needs a half-plane key. A comparator that uses only the cross product is not a strict weak ordering around the full circle: the cross product is zero for opposite vectors and changes sign when the angle passes $\pi$. The [convex hull](/algorithms/geometry/convex-hull) article uses a full-plane sort instead, which is the simpler route when the points are sorted by coordinates.

An intersection point is a pair of rational numbers, and a program that prints it needs exact rational arithmetic or a careful floating-point construction. The orientation predicate can decide **whether** the segments intersect without ever computing **where**. That is the right division of labor: use the discrete predicate for the discrete question, and use rational arithmetic only for the coordinates.

Floating point is acceptable when the answer is a real number printed with a tolerance, as in a distance or an angle. It is not acceptable when the answer is a topology: a side, a crossing, a boundary, a hull vertex. The distinction is the first thing to decide when a geometry problem is read.

## Reference implementations

The manifest `implementations/geometry/robust-predicates/algorithm.yaml` publishes one `program` variant per language: `c/program.c`, `cpp17/program.cpp`, `java/Main.java`, `python/program.py`, `pascal/program.pas` and `javascript/program.js`.

All six read the same input and write the same output.

```text
q
x1 y1 x2 y2 x3 y3
...
```

The first line is the number of triples. Each of the next $q$ lines holds the six coordinates of one triple, in the order $A$, $B$, $C$. The output is one line per triple: `1` when the turn is counterclockwise, `0` when the points are collinear, and `-1` when the turn is clockwise. The positive sign is printed as `1`, without a plus sign.

The C, C++ and Java versions use `long long` or `long`, the Python version uses arbitrary-precision integers, the Pascal version uses `Int64`, and the JavaScript version uses `BigInt`. The Pascal and JavaScript files begin with a notice that they are educational reference implementations, not USACO submission languages. The shared bound is $10^6$ in absolute value, which keeps every product below $2^{53}$ and lets all six programs compute the same exact value. The Pascal program reads each value with its own `Read` call, uses `SysUtils` for `IntToStr`, and avoids `IOResult` and 128-bit integers so that it compiles under the browser Pascal compiler used by the repository's tests.

The manifest records the variants as unverified until the continuous integration run compiles them and compares their output on the shared fixtures. The fixtures cover one triple of each orientation, a pair of near-collinear triples whose determinant is $\pm 1$ at the stated bound, and an edge case at the extreme corners of the coordinate square together with a degenerate triple.

## Recursion decision

The predicate does not recurse. It is a fixed sequence of subtractions, multiplications and comparisons, and its call depth is one frame no matter how large the input is. The loop over the queries is iterative, and each iteration is independent of the others.

A recursive formulation would gain nothing. The determinant is a closed-form expression, not a divide-and-conquer recurrence, and there is no smaller subproblem to hand to a recursive call. A recursive `sign` function that calls itself on the same value would only add stack frames.

| Language   | Stack for the predicate                | Recommendation                           |
| ---------- | -------------------------------------- | ---------------------------------------- |
| C and C++  | One frame                              | Iterative; the loop is the whole program |
| Java       | One frame                              | Iterative                                |
| Python     | One frame, far below the limit of 1000 | Iterative                                |
| Pascal     | One frame                              | Iterative                                |
| JavaScript | One frame                              | Iterative                                |

The predicate is often called from a recursive algorithm, and that algorithm's depth is the one to analyze. A divide-and-conquer convex hull has depth $O(\log n)$, and Quickhull has depth $O(n)$ in the worst case. The orientation call itself adds one frame to whatever depth the caller already has, and it returns before the recursion continues, so it cannot be the cause of a stack overflow.

## Implementation walkthrough

The core of every listing is four lines.

```cpp
long long ux = bx - ax, uy = by - ay;
long long vx = cx - ax, vy = cy - ay;
long long d = ux * vy - uy * vx;
std::cout << (d > 0 ? 1 : (d < 0 ? -1 : 0)) << '\n';
```

Read them in order.

**The subtraction.** Both differences are formed in the wide type. If the coordinates are stored in 32-bit variables, this is the line where they must be promoted, and the safest habit is to store them in the wide type from the start. The translation lemma is what makes the subtraction free: it changes the numbers but not the sign.

**The products.** `ux * vy` and `uy * vx` are the only multiplications. They are formed before any comparison, and they are not divided by two even though the determinant is twice the area. Dividing by two would introduce a fraction, and integer division could turn a determinant of $1$ into $0$.

**The difference.** The two products are subtracted, not added. A sign error here is the most common transcription error, and it flips every answer. The expanded form $A_x(B_y - C_y) + B_x(C_y - A_y) + C_x(A_y - B_y)$ is algebraically the same, but it has three products and its own width bound; the difference form has two products, is translation invariant, and matches the bound used above.

**The sign.** The comparison with zero is exact. The expression uses two comparisons and no `abs`, because the sign is the answer. `std::abs` would erase it, and a comparison with an epsilon would erase the collinear case.

The input handling differs slightly by language, and the differences are worth knowing.

- The C version reads with `scanf("%lld", ...)` and checks that six values were read. A truncated line stops the program rather than reading uninitialized values.
- The C++ version disables the synchronization with stdio and uses `'\n'` rather than `std::endl`, so that $10^5$ lines do not each flush the stream.
- The Java version uses a buffered reader and a tokenizer over the whole input, and accumulates the output in a `StringBuilder`. `long` is 64-bit on every Java platform.
- The Python version reads the whole of standard input and splits it, which is the fastest simple scanner for $6 \ast 10^5$ integers. Its integers are unbounded, so the bound is a statement about the other five languages rather than about Python.
- The Pascal version reads one value per `Read` call, because the browser compiler has no console input and the repository's replacement unit parses one token at a time. It uses `Int64`, `SysUtils` and `IntToStr`, and it does not use `IOResult` or a 128-bit type.
- The JavaScript version splits the input and uses `BigInt`, so the arithmetic is exact for any coordinate size. A number would be exact only below $2^{53}$, which is why the variant does not use one.

The output is one line per query, with no trailing spaces. That is what makes the six listings comparable byte for byte on the fixtures.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Computing the determinant in `double` | A near-collinear triple rounds to zero and the answer flips | Use integers for the sign |
| Comparing a slope or an angle | Vertical lines are undefined and near-collinear lines round together | Compare the cross product with zero |
| Using an epsilon for collinearity | Exactly collinear and nearly collinear points are confused | Test `d == 0` on an exact integer |
| Multiplying 32-bit coordinates | The product overflows above a coordinate magnitude of 46341 | Widen before multiplying |
| Casting after the multiplication | The overflow has already happened | Cast the coordinates, then multiply |
| Using an unsigned type | The wrap is defined but the sign is wrong | Use a signed type |
| Taking the absolute value | The left and right cases become the same | Keep the sign and compare with zero |
| Swapping the first two points | Every non-collinear answer flips | Fix the order from the statement |
| Forgetting duplicate points | A zero difference looks like a special case | Let the formula handle it; it returns zero |
| Assuming the points are in general position | Collinear and touching cases are missed | Handle `d == 0` explicitly in the caller |
| Using `number` above $2^{53}$ in JavaScript | The low bits are lost and the sign is wrong | Use `BigInt` above the safe range |
| Using the browser Pascal `Int64` above $2^{53}$ | The value is a double and the low bits are lost | Keep the input below $2^{53}$ or use a native 64-bit compiler |

### Why this fails: the sliver that a double calls flat

The most convincing failure is the one where the exact answer is a triangle of area $1/2$. Take

$$
A = (0, 0), \qquad B = (10^8, 10^8 - 1), \qquad C = (10^8 - 1, 10^8 - 2).
$$

The exact computation is

$$
10^8 \ast (10^8 - 2) - (10^8 - 1) \ast (10^8 - 1)
= 9999999800000000 - 9999999800000001 = -1.
$$

Both products are just above $2^{53} \approx 9.0 \ast 10^{15}$, where a double's spacing is $2$. The even value $9999999800000000$ is representable, and the odd value $9999999800000001$ is not: it rounds to the same double. The subtraction therefore gives $0$, and the program reports the three points as collinear. The true answer is $-1$, and the triangle has area $1/2$.

This is not a pathological input invented for the page. It is the ordinary shape of a test that a setter adds to separate the exact solutions from the floating-point ones. The threshold is about $\sqrt{2^{53}} \approx 9.5 \ast 10^7$: below it, a unit determinant survives; above it, it can vanish. Any statement with coordinates near $10^8$ or larger is exposed, and CSES 2189's bound of $10^9$ is well above it.

The fix is not a larger epsilon. A larger epsilon makes the program call more genuine triangles flat. The fix is to compute the determinant in an integer type and compare with exact zero.

### Why this fails: the 32-bit square

The width mistake has an equally small counterexample. Take

$$
A = (0, 0), \qquad B = (46341, 0), \qquad C = (0, 46341).
$$

The exact determinant is $46341^2 = 2147488281$. This is larger than the largest signed 32-bit integer, $2147483647$, by $4634$. In a 32-bit signed type the value is truncated to its low 32 bits, which represent a negative number, and the program prints $-1$ even though the turn is counterclockwise. In C and C++ the overflow is undefined behavior, so the result is not even guaranteed to be that negative value.

The number $46341$ is the smallest integer whose square exceeds $2^{31} - 1$: $46340^2 = 2147395600$ fits and $46341^2$ does not. A coordinate bound of $10^4$ is safe in 32-bit arithmetic under the conservative estimate, and a bound of $10^5$ is not. The reference programs use 64-bit integers and state $10^6$, which is safe for this formula but not for every determinant; the incircle test at the same coordinates needs more.

### Why this fails: the missing zero case

A caller that uses the predicate only for the strict left and strict right cases is incomplete. In segment intersection, two collinear segments that overlap have no strict turn at any endpoint, yet they intersect. In point-in-polygon, a query point exactly on an edge is not strictly inside, yet it is not outside either. The zero case is part of the answer, not an edge case to be discarded.

## Variants and extensions

- **Segment intersection.** Four orientation signs, plus a bounding-box test for each collinear endpoint. The details are in worked problem 2.
- **Point in polygon.** A ray-crossing test whose side condition is an orientation sign, with a separate exact boundary test. The details are in worked problem 3.
- **Convex hull.** Andrew's monotone chain calls the predicate once per triple and removes a point when the sign is not strictly positive. The hull is in [convex hull](/algorithms/geometry/convex-hull).
- **Sorting by angle.** The comparator uses the cross product for the order and a half-plane key for the wrap around $\pi$. A comparator that uses only the cross product is not a strict weak ordering.
- **The incircle predicate.** The determinant is $4 \times 4$, and with coordinates of magnitude $M$ its terms grow like $M^4$. At $M = 10^6$ they reach $10^{24}$ and at $M = 10^9$ they reach $10^{36}$, so a 64-bit type is not enough at either bound; a 128-bit type or a big integer is the right choice.
- **Orientation in three dimensions.** The sign of a $3 \times 3$ determinant says whether a point is above or below a plane. The same width discipline applies, with one more factor of $M$.
- **Rational coordinates.** Multiply every coordinate by the common denominator, run the integer predicate, and reduce if the exact intersection is needed.
- **Filtered predicates.** Evaluate the determinant in a double, and fall back to exact arithmetic only when the result is close to zero. This is the standard technique for real-valued inputs, and it is unnecessary for the integer inputs here because the integer path is already exact and fast.
- **Adaptive predicates.** Shewchuk's adaptive method computes a floating-point approximation with an error bound and refines it only when the sign is uncertain. It is the right tool when the inputs are floating point and cannot be scaled.
- **Symbolic perturbation.** When many points are collinear or coincident, a deterministic tie-break can remove the degeneracies without changing the answer the problem wants. It is a modeling choice, not a replacement for an exact predicate.
- **The orientation of a polygon.** The shoelace sum in [integer geometry](/algorithms/geometry/integer-geometry) is the aggregate version of the same sign.

## Contest strategy

1. Decide whether the answer is discrete or real. A side, a crossing, a boundary and a hull vertex are discrete; a distance and an area are real. Use the exact predicate for the discrete answers.
2. Read the coordinate bound before writing the arithmetic. Compute $8M^2$ and compare it with the maximum of the type. For 32-bit, the safe bound is $M \le 16383$; for 64-bit, $M \le 1.073 \ast 10^9$.
3. Store the coordinates in the wide type from the start. A cast at the multiplication is a cast after the overflow has already happened.
4. Subtract the first point before multiplying. The translation lemma makes it free, and it makes the width bound depend on the coordinate range rather than on the distance from the origin.
5. Compare with zero. Do not divide, do not take a square root, and do not use `abs` followed by an epsilon.
6. Handle the zero case explicitly in the caller. Collinear points are not a rare input; they are the input that separates a correct geometric algorithm from a nearly correct one.
7. Test the four smallest cases: a vertical line, a horizontal line, duplicate points, and three collinear points. Then test a near-collinear triple at the largest coordinate the statement allows.
8. If the bound exceeds the type, widen the type rather than the epsilon. In C++ use `__int128` or a big-integer class, in Java use `BigInteger`, in Python use `int`, and in JavaScript use `BigInt`.
9. For many queries, use fast input and output. The predicate itself is a handful of operations; at $10^5$ queries the scanner is the bottleneck.

## Worked problems

### Problem 1: the point location test

**Restatement.** The input holds $t$ triples of integer points. For each triple, decide whether the third point is to the left of the directed line from the first to the second, to the right, or on the line. Print `LEFT`, `RIGHT` or `TOUCH`. Constraints: $1 \le t \le 10^5$ and every coordinate is between $-10^9$ and $10^9$; the first two points are distinct. This is CSES problem 2189, [Point Location Test](https://cses.fi/problemset/task/2189).

**Naive baseline.** Compute the slope of the line from $p_1$ to $p_2$ and the slope from $p_1$ to $p_3$, and compare them as doubles. It fails on vertical lines and on near-collinear triples at the top of the coordinate range.

**Insight.** The sign of $\operatorname{cross}(p_1, p_2, p_3)$ is the answer, and the cross product is an integer that fits in 64 bits at this bound.

**Derivation.** Read six integers per query as 64-bit values. Compute the two differences from $p_1$, multiply, subtract, and compare with zero. A positive value prints `LEFT`, a negative value prints `RIGHT`, and zero prints `TOUCH`. The sample input

```text
3
1 1 5 3 2 3
1 1 5 3 4 1
1 1 5 3 3 2
```

gives the determinants $6$, $-6$ and $0$, and the output `LEFT`, `RIGHT`, `TOUCH`.

**Correctness.** The signed-area lemma identifies the determinant's sign with the side of the directed line, and the width lemma shows that the 64-bit computation is exact at $10^9$: $8 \ast (10^9)^2 = 8 \ast 10^{18} < 2^{63} - 1$.

**Complexity.** $O(1)$ time per query and $O(1)$ space, so $O(t)$ time overall.

**Common wrong approach.** Computing the slope. A vertical line makes the division undefined, and a near-collinear triple at $10^9$ makes two different slopes equal as doubles. A second wrong approach reverses the argument order: $\operatorname{cross}(p_1, p_3, p_2)$ is the negative of the answer, so every `LEFT` becomes `RIGHT`.

### Problem 2: the segment intersection

**Restatement.** The input holds $t$ pairs of line segments. For each pair, decide whether the two segments have at least one common point. Print `YES` or `NO`. Constraints: $1 \le t \le 10^5$, every coordinate is between $-10^9$ and $10^9$, and each segment has distinct endpoints. This is CSES problem 2190, [Line Segment Intersection](https://cses.fi/problemset/task/2190).

**Naive baseline.** Solve the two parametric equations for the intersection parameters with doubles, and accept the result when both parameters lie in $[0, 1]$. The division is unstable for nearly parallel segments, and the collinear overlap case has no unique intersection point.

**Insight.** The segments intersect exactly when each pair of endpoints straddles the other segment's supporting line, or when an endpoint of one segment lies on the other. Both conditions are orientation signs and bounding-box comparisons, so no division is needed.

**Derivation.** Write `cross(A, B, P)` for the determinant of $B - A$ and $P - A$. For segments $AB$ and $CD$, compute

$$
d_1 = \operatorname{cross}(A, B, C), \quad
d_2 = \operatorname{cross}(A, B, D), \quad
d_3 = \operatorname{cross}(C, D, A), \quad
d_4 = \operatorname{cross}(C, D, B).
$$

If $d_1$ and $d_2$ have opposite nonzero signs and $d_3$ and $d_4$ have opposite nonzero signs, the segments cross at an interior point. Otherwise, if any $d_i$ is zero and the corresponding point lies inside the other segment's bounding box, the segments touch or overlap.

```cpp
bool on_segment(Point a, Point b, Point p) {
    return cross(a, b, p) == 0
        && std::min(a.x, b.x) <= p.x && p.x <= std::max(a.x, b.x)
        && std::min(a.y, b.y) <= p.y && p.y <= std::max(a.y, b.y);
}

bool intersects(Point a, Point b, Point c, Point d) {
    long long d1 = cross(a, b, c);
    long long d2 = cross(a, b, d);
    long long d3 = cross(c, d, a);
    long long d4 = cross(c, d, b);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0))
        && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }
    return (d1 == 0 && on_segment(a, b, c))
        || (d2 == 0 && on_segment(a, b, d))
        || (d3 == 0 && on_segment(c, d, a))
        || (d4 == 0 && on_segment(c, d, b));
}
```

**Correctness.** If the endpoints of $CD$ are on opposite sides of the line $AB$, the segment $CD$ crosses that line, and the second straddle test says that $AB$ crosses the line $CD$. Two segments that cross each other's supporting lines inside both segments meet at one interior point. If either straddle fails, an intersection can only involve an endpoint of one segment on the other segment, or a collinear overlap; the four zero cases test exactly those possibilities. A collinear overlap always has an endpoint of one segment inside the other, because for two overlapping intervals on a line, at least one endpoint of one interval lies inside the other.

**Complexity.** $O(1)$ time per pair and $O(1)$ space, so $O(t)$ time overall. At $t = 10^5$ the four cross products per pair are about $4 \ast 10^5$ cross products, and the input is the bottleneck.

**Common wrong approach.** Testing only the strict straddle. The segments $(0,0)$ to $(2,0)$ and $(1,0)$ to $(3,0)$ are collinear and overlap, but no endpoint is strictly on one side of the other's line; the strict test says `NO`, and the correct answer is `YES`. A second wrong approach tests the endpoint cases with a division to see whether the endpoint lies between the other two, which reintroduces the precision problem the predicate was meant to remove.

### Problem 3: the point in polygon

**Restatement.** The input holds several test cases. Each begins with $n$, the number of vertices of a simple polygon, followed by the vertices; then $m$, the number of query points, followed by the points. The input ends with a case whose first line is $0$. For each query, print `in`, `on` or `out`. Constraints: $3 \le n \le 1000$, $m \le 100$, every coordinate has absolute value at most $10^4$, and the polygon may be clockwise or counterclockwise. This is the Kattis problem [Point in Polygon](https://open.kattis.com/problems/pointinpolygon).

**Naive baseline.** Cast a ray to the right and compute each intersection's $x$-coordinate as a double. The division is unstable when the edge is nearly vertical, a ray through a vertex is counted twice or not at all, and a point exactly on an edge is classified by rounding.

**Insight.** The ray-crossing parity test needs only the orientation sign and a half-open rule for the endpoints, and the boundary test is the zero case of the same predicate.

**Derivation.** For each edge $AB$ and query point $Q$, first test whether $Q$ lies on the segment: the cross product is zero and $Q$ is inside the edge's bounding box. If so, the answer is `on`. Otherwise, count the edges that cross the horizontal ray from $Q$ to the right. With integer arithmetic the crossing condition is a sign test.

```cpp
bool crosses_right_ray(Point a, Point b, Point q) {
    if ((a.y > q.y) == (b.y > q.y)) {
        return false;                       // the edge does not straddle the ray
    }
    long long d = cross(a, b, q);
    if (b.y > a.y) {
        return d > 0;                       // upward edge, q left of it
    }
    return d < 0;                           // downward edge, q right of it
}
```

For each edge, if `cross(a, b, q) == 0` and $Q$ is inside the bounding box of $AB$, return `on`. Otherwise, if `crosses_right_ray` is true, toggle a parity bit. After all edges, the parity says `in` or `out`.

**Correctness.** A horizontal ray from a point inside a simple polygon crosses the boundary an odd number of times, and a ray from an outside point crosses it an even number of times. The half-open condition `(a.y > q.y) != (b.y > q.y)` counts a vertex shared by two edges exactly once, so a ray through a vertex is not double-counted. The boundary test is checked first, so a point on an edge is reported as `on` rather than being classified by the parity of a ray that runs along the edge. The orientation sign decides the crossing without division, and the exact zero decides the boundary.

**Complexity.** $O(n)$ time per query and $O(nm)$ time per test case, with $O(1)$ auxiliary space. At $n = 1000$ and $m = 100$ that is $10^5$ edges per case, which is comfortable.

**Common wrong approach.** Computing the crossing with a floating-point division. A point one unit inside a nearly vertical edge can be classified as outside, and a point exactly on the edge can be classified as either. A second wrong approach omits the boundary test and reports `on` points as `in` or `out` depending on the parity. A third assumes the polygon is counterclockwise and tests only the left side of each edge, which reverses every answer for a clockwise polygon.

## Practice progression

1. **Recognition.** Given a statement, decide whether the answer is a side, a crossing, a boundary, or a real-valued distance. Write down which of those is discrete and needs an exact predicate.
2. **Direct application.** Implement `orientation` and test it on the six permutations of three points. Check that swapping two arguments flips the sign and that a cyclic shift preserves it.
3. **Adaptation.** Solve the point location test with 64-bit coordinates. Then solve the segment intersection problem, including the collinear overlap and the shared endpoint.
4. **Combination.** Build Andrew's monotone chain on top of the predicate, and compare its output with the brute-force hull on random sets of ten points. Then add the point-in-polygon test and use it to check the hull's own vertices.
5. **Challenge.** Implement the predicate with 128-bit integers or a big-integer type, test it at $10^9$, and compare it against the double version on random near-collinear triples. Count how often the double version disagrees.
6. **Transfer.** Use the same sign test in the incircle predicate, in a three-dimensional orientation test, in a sorting-by-angle comparator, and in any problem where the statement asks whether a point is on one side of a line. The formula changes; the width discipline does not.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the three cases of the orientation predicate and the sign of the cross product for each. (At a glance)
2. Why does the slope comparison fail on a vertical line and on a near-collinear triple? (Naive approach)
3. Why is the sign of an integer determinant exact even though the determinant itself may be huge? (Key insight)
4. State the translation lemma and the signed-area lemma, and explain what each one buys. (Formal model)
5. What is the largest cross product for coordinates of magnitude $M$, and why is the bound $8M^2$ conservative? (Complexity analysis)
6. Why is the reference bound $10^6$ rather than the CSES bound of $10^9$? (Reference implementations)
7. What happens at a coordinate magnitude of 46341 in 32-bit arithmetic, and what is the smallest counterexample? (Common mistakes)
8. Why does a double call the sliver of area $1/2$ collinear, and at what coordinate size does the failure begin? (Common mistakes)
9. In the segment intersection test, why is the strict straddle not enough? (Worked problems)
10. In the point-in-polygon test, why is the half-open rule needed, and why is the boundary test done first? (Worked problems)
11. Which predicates need a width larger than the orientation test at the same coordinates? (Variants and extensions)
12. When is floating point acceptable in a geometry problem, and when is it not? (Algorithm selection)

## Further reading

- The subject index places this technique beside the geometry it supports: [computational geometry](/algorithms/geometry/).
- The orientation predicate is the inner loop of [convex hull](/algorithms/geometry/convex-hull), where a single wrong turn changes the boundary.
- The exact zero case is the boundary case of [point in polygon](/algorithms/geometry/point-in-polygon), which uses the same predicate for its ray test.
- The aggregate sign of a polygon's boundary is computed by the shoelace sum in [integer geometry](/algorithms/geometry/integer-geometry).
- The rotating-calipers technique uses the same cross products to compare directions: [rotating calipers](/algorithms/geometry/rotating-calipers).
- The sweep-line technique is a sequence of orientation tests over events: [sweep line](/algorithms/geometry/sweep-line).
- The closest-pair problem is the standard example of comparing squared distances without division: [closest pair](/algorithms/geometry/closest-pair).
- The incircle predicate, and the exact arithmetic it needs, appears in [smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle).
- The integer representation that decides how wide the arithmetic must be is described in [binary representation](/algorithms/foundations/binary-representation).
- The cost model for the per-query work is in [complexity](/algorithms/foundations/complexity).
- The modular version of a geometric sum, for coordinates beyond 64 bits, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The discrete mathematics of determinants, vectors and signed areas is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
