---
id: geometry.convex-hull
title: Convex hull
summary: Find the extreme points of a set of points in O(n log n) time with Andrew's monotone chain, and prove that the chain it builds is convex.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: common-contest-technique
keywords:
    [convex hull, monotone chain, cross product, orientation, extreme points, andrew's algorithm]
prerequisites:
    required: [foundations.sorting]
    recommended: [foundations.complexity, searching.binary-search]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The coordinates are integers small enough that the cross product of two difference vectors fits in the chosen integer type.
    - Points are distinct, or duplicates are removed before the algorithm runs.
reviewed: false
---

## At a glance

The convex hull of a set of points is the smallest convex set containing them. Andrew's monotone chain computes it in $O(n \log n)$ time: sort the points, sweep them from left to right maintaining one chain, sweep them from right to left maintaining the other, and join the two.

The whole method rests on one arithmetic test, the **orientation test**, which decides whether three points turn left, turn right, or lie on a line. It is derived from the cross product of two difference vectors and has exactly three cases.

The chain is kept convex by a single rule: when the last three points of the chain do not turn left, the middle one is removed. The proof that this is safe is the proof that the popped point lies on or above the segment between its two neighbors, and therefore cannot be a vertex of the lower boundary.

## Problem motivation

A drone must fly around every tree in a forest, and the flight plan that encloses all of them with the shortest perimeter is the boundary of the convex hull of the tree positions. A game engine must know which sprites can be seen from outside the map. A warehouse must place a camera so that every shelf is visible, and the extreme shelves are the hull vertices.

In each case the question is the same: **which of these points can never be inside the shape formed by the others?** A point that is not extreme can be discarded entirely, because the shape does not change when it is removed.

There are $n$ points and the hull has at most $n$ vertices, so the size of the answer is not the difficulty. The difficulty is finding which points those are without testing every point against every other point. The naive test, "is this point on the same side of the line through every other pair as all the rest", costs $O(n^3)$ and is hopeless for $n = 10^5$.

The monotone chain reduces this to one sort and one sweep. The sort is $O(n \log n)$ and the sweep is $O(n)$, and the sweep is linear because each point is added to the chain once and removed from it at most once.

## Recognition patterns

The convex hull is the right tool when the statement contains some of these phrases.

- "Points", "coordinates", "a lattice", "vertices".
- "The smallest shape containing", "the outermost", "the boundary of the set", "the extreme point", "the convex hull".
- "Clockwise", "counterclockwise", "the order of the vertices around".
- "The area of the polygon", "the perimeter of the enclosing shape".
- "Is the point inside", "is the point outside", "can the point be seen from outside".

The constraint values that decide the technique:

| Situation | What it rules |
| --- | --- |
| $n \le 200$ and $O(n^3)$ is affordable | The naive side test works |
| $n \le 10^5$ | Only the monotone chain works |
| The points are already sorted by $x$ | The sweep is $O(n)$ and the sort is free |
| The points lie on a grid with bounded coordinates | A counting sort works and the whole algorithm becomes $O(n)$ |
| All the points are collinear | The hull degenerates to two vertices and every area is zero |
| The question is about a subset of the points | The hull of the subset is a different object |

The last row matters more than it looks. The hull of the whole set says nothing about which points are extreme within a subset, and a problem that asks for the hull of every prefix of a sequence of points is a different problem entirely.

## Naive approach

The baseline tests every triple. For each pair of points, ask whether all the other points lie on the same side of the line through that pair; the pairs for which the answer is yes are the edges of the hull.

```cpp
bool same_side(const Point& a, const Point& b, const Point& c, const Point& d) {
    long long s1 = cross(a, b, c);
    long long s2 = cross(a, b, d);
    return (s1 >= 0 && s2 >= 0) || (s1 <= 0 && s2 <= 0);
}
```

For every pair $(a, b)$ this checks every other point, so the cost is $\binom{n}{2}$ pairs times $n$ checks, which is $O(n^3)$. At $n = 500$ that is about $6 \times 10^7$ operations, which is a few seconds. At $n = 10^5$ it is $5 \times 10^{14}$, which is not.

A second baseline is the gift wrapping, or Jarvis march: start at the leftmost point, find the next hull vertex by scanning all the other points for the most counterclockwise turn, and repeat. It costs $O(nh)$ for a hull with $h$ vertices, so it is competitive only when the hull is small.

## Key insight

The insight is that **the lower boundary of the hull can be built from left to right, and a point that does not turn left cannot be a vertex of it**.

Sort the points by $x$. Consider three points $a$, $b$, $c$ of the chain, in that order, so that $a_x \le b_x \le c_x$. If the turn from $a$ to $b$ to $c$ is not a left turn, then $b$ lies on or above the segment from $a$ to $c$. A point on or above a segment between two other points is inside the shape they span, so it is not a vertex of the lower boundary. It can be removed without changing the shape, and the chain stays convex.

That gives the whole algorithm. Start with an empty chain. Add the sorted points one at a time. Before adding a point, remove the last point of the chain while the last three points do not turn left. Then add the point.

The removal is safe because it never removes a point that could be a hull vertex, and it keeps the chain convex, so the chain is a valid lower boundary at every moment. The sweep from right to left produces the upper boundary by the same argument with the roles reversed.

## Formal model

Let $S$ be a finite set of points in the plane.

::: math definition Definition
A set $C$ is **convex** if, for any two points $p$ and $q$ in $C$, the whole segment from $p$ to $q$ lies in $C$. The **convex hull** of $S$ is the smallest convex set containing $S$. It is a convex polygon whose vertices are exactly the **extreme points** of $S$, that is, the points of $S$ that are not in the convex hull of the remaining points.
:::

::: math definition Definition
For points $A$, $B$, $C$, put $u = B - A$ and $v = C - A$ and define

$$
\operatorname{cross}(A, B, C) = u_x v_y - u_y v_x
= (B_x - A_x)(C_y - A_y) - (B_y - A_y)(C_x - A_x).
$$

The **orientation** of the triple is one of three cases:

- $\operatorname{cross}(A, B, C) > 0$: $C$ lies strictly to the **left** of the directed line from $A$ to $B$, and the turn $A \to B \to C$ is counterclockwise.
- $\operatorname{cross}(A, B, C) < 0$: $C$ lies strictly to the **right** of that line, and the turn is clockwise.
- $\operatorname{cross}(A, B, C) = 0$: the three points are **collinear**.
:::

::: math definition Definition
A **chain** of points is **convex** if every three consecutive points of the chain make a strict left turn, that is, if $\operatorname{cross}(p_{i-1}, p_i, p_{i+1}) > 0$ for every applicable index $i$. The **lower hull** of $S$ is the convex chain from the leftmost point of $S$ to the rightmost point of $S$ such that every point of $S$ lies on or above it.
:::

::: math lemma Lemma
Let $a$, $b$, $c$ be points with $a_x \le b_x \le c_x$ and $c_x > a_x$. Then

$$
\operatorname{cross}(a, b, c) = (c_x - a_x)\bigl(h(b_x) - b_y\bigr),
$$

where $h$ is the height of the line through $a$ and $c$ at the abscissa $b_x$. Consequently $\operatorname{cross}(a, b, c) \le 0$ if and only if $b$ lies on or above the segment from $a$ to $c$.
:::

::: math proof Proof
Expand the definition:

$$
\operatorname{cross}(a, b, c)
= (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x).
$$

The height of the line through $a$ and $c$ at $b_x$ is $h(b_x) = a_y + \frac{c_y - a_y}{c_x - a_x}(b_x - a_x)$, so

$$
(c_x - a_x)\bigl(h(b_x) - b_y\bigr)
= (c_x - a_x)(a_y - b_y) + (c_y - a_y)(b_x - a_x)
= (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x),
$$

which is the cross product. Since $c_x - a_x > 0$, the sign of the cross product is the sign of $h(b_x) - b_y$, and $b$ lies on or above the line exactly when $h(b_x) - b_y \ge 0$. $\square$
:::

## Algorithm derivation

The algorithm has four lines of substance, and each of them is the consequence of one of the statements above.

```cpp
long long cross(const Point& a, const Point& b, const Point& c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

std::vector<Point> convex_hull(std::vector<Point> pts) {
    std::sort(pts.begin(), pts.end(), by_xy);
    std::vector<Point> lower, upper;
    for (const Point& p : pts) {
        while (lower.size() >= 2 && cross(lower[lower.size() - 2], lower.back(), p) <= 0) {
            lower.pop_back();
        }
        lower.push_back(p);
    }
    for (auto it = pts.rbegin(); it != pts.rend(); ++it) {
        const Point& p = *it;
        while (upper.size() >= 2 && cross(upper[upper.size() - 2], upper.back(), p) <= 0) {
            upper.pop_back();
        }
        upper.push_back(p);
    }
    lower.pop_back();
    upper.pop_back();
    lower.insert(lower.end(), upper.begin(), upper.end());
    return lower;
}
```

The comparison `<= 0` is the pop rule. It removes a point when the turn is not a strict left turn, which covers both the right-turn case and the collinear case.

The comparison `< 0` is the same algorithm with a different convention. It removes a point only when the turn is strictly right, so points that lie on a straight edge of the hull are kept and become vertices of the answer. The problem statement decides which convention is wanted.

The final two `pop_back` calls remove the endpoints that the two chains share. The leftmost point is the first element of `lower` and the last element of `upper`, and the rightmost point is the last element of `lower` and the first of `upper`, so each of them appears twice.

## Step-by-step execution

Take the six points $(0,0)$, $(1,1)$, $(2,0)$, $(2,3)$, $(3,1)$ and $(4,0)$. Sorted by $x$ and then by $y$ they are already in the order $(0,0)$, $(1,1)$, $(2,0)$, $(2,3)$, $(3,1)$, $(4,0)$.

**The lower sweep.**

| Point added | Chain before | Test | Chain after |
| --- | --- | --- | --- |
| $(0,0)$ |  |  | $(0,0)$ |
| $(1,1)$ | $(0,0)$ |  | $(0,0), (1,1)$ |
| $(2,0)$ | $(0,0), (1,1)$ | $\operatorname{cross} = -2 \le 0$, remove $(1,1)$ | $(0,0), (2,0)$ |
| $(2,3)$ | $(0,0), (2,0)$ | $\operatorname{cross} = 6 > 0$ | $(0,0), (2,0), (2,3)$ |
| $(3,1)$ | $(0,0), (2,0), (2,3)$ | $\operatorname{cross} = -3 \le 0$, remove $(2,3)$; then $\operatorname{cross} = 2 > 0$ | $(0,0), (2,0), (3,1)$ |
| $(4,0)$ | $(0,0), (2,0), (3,1)$ | $\operatorname{cross} = -2 \le 0$, remove $(3,1)$; then $\operatorname{cross} = 0 \le 0$, remove $(2,0)$ | $(0,0), (4,0)$ |

The lower hull is the segment from $(0,0)$ to $(4,0)$. Note the last row: the point $(2,0)$ lies exactly on that segment, and the rule removes it because the turn is collinear rather than strictly left. A problem that counts hull vertices has to say whether it wants that point.

**The upper sweep**, over the reversed order $(4,0)$, $(3,1)$, $(2,3)$, $(2,0)$, $(1,1)$, $(0,0)$.

| Point added | Chain before | Test | Chain after |
| --- | --- | --- | --- |
| $(4,0)$ |  |  | $(4,0)$ |
| $(3,1)$ | $(4,0)$ |  | $(4,0), (3,1)$ |
| $(2,3)$ | $(4,0), (3,1)$ | $\operatorname{cross} = -1 \le 0$, remove $(3,1)$ | $(4,0), (2,3)$ |
| $(2,0)$ | $(4,0), (2,3)$ | $\operatorname{cross} = 6 > 0$ | $(4,0), (2,3), (2,0)$ |
| $(1,1)$ | $(4,0), (2,3), (2,0)$ | $\operatorname{cross} = -3 \le 0$, remove $(2,0)$; then $\operatorname{cross} = 7 > 0$ | $(4,0), (2,3), (1,1)$ |
| $(0,0)$ | $(4,0), (2,3), (1,1)$ | $\operatorname{cross} = -1 \le 0$, remove $(1,1)$; then $\operatorname{cross} = 12 > 0$ | $(4,0), (2,3), (0,0)$ |

**The join.** Removing the shared endpoints leaves `lower` as $[(0,0)]$ and `upper` as $[(4,0), (2,3)]$, and the hull is

$$
[(0,0), (4,0), (2,3)].
$$

That is a triangle, traversed counterclockwise, and the other three points are inside it. The point $(1,1)$ is above the segment from $(0,0)$ to $(2,3)$ but below the segment from $(4,0)$ to $(2,3)$, so it is inside; the point $(3,1)$ is below the segment from $(4,0)$ to $(2,3)$ and below the segment from $(2,3)$ to $(0,0)$'s line, so it is inside as well.

## Correctness proof

::: math theorem Theorem
The monotone chain algorithm returns the convex hull of its input, in counterclockwise order, starting at the point with the smallest $x$ and then the smallest $y$.
:::

::: math proof Proof
Let the points be sorted by $x$ and then by $y$, and let the sweep build the chain `lower`.

**The invariant.** After the sweep has processed the first $t$ points:

1. `lower` is a convex chain, that is, every three consecutive points make a strict left turn.
2. Every one of the first $t$ points lies on or above the chain.
3. Every vertex of `lower` is a vertex of the lower hull of the first $t$ points.

**Initialization.** For $t = 1$ the chain has one point and every claim is trivially true.

**Maintenance.** Suppose the invariant holds and the next point $p$ is added. While the last three points of the chain do not make a strict left turn, the middle one of those three is removed.

Let those three points be $a$, $b$, $c$, where $b$ is the last point of the chain and $c = p$. They are in sorted order, so $a_x \le b_x \le c_x$, and by the lemma $\operatorname{cross}(a, b, c) \le 0$ means that $b$ lies on or above the segment from $a$ to $c$. The segment from $a$ to $c$ is contained in the region below the old chain at that point, so removing $b$ keeps every processed point on or above the chain, which preserves claim 2. It also keeps the chain convex, because the only new triple is the one formed by the point before $a$, $a$ and $c$, and the loop continues until that triple turns left. Finally, $b$ lies on or above the segment from $a$ to $c$, so $b$ is inside the convex hull of the remaining points and is not an extreme point, which preserves claim 3. The loop terminates because each removal shortens the chain.

When the loop stops, the triple formed by the last two points of the chain and $p$ turns left, so the chain is still convex after $p$ is appended. This proves the maintenance.

**Termination.** At the end of the sweep, claim 1 says the chain is convex, claim 2 says every input point lies on or above it, and claim 3 says every vertex of the chain is a vertex of the lower hull. A convex chain from the leftmost point to the rightmost point with every point on or above it is exactly the lower hull: any lower boundary must be convex, must start and end at the extreme points, and must lie below or on every input point, and there is exactly one such chain. So `lower` is the lower hull.

The same argument applied to the reversed order produces the upper hull. Joining the two chains, with the shared endpoints removed so that they are not counted twice, gives the boundary of the convex hull, traversed counterclockwise. $\square$
:::

## Complexity analysis

| Stage              | Time          | Space                |
| ------------------ | ------------- | -------------------- |
| Sorting the points | $O(n \log n)$ | $O(n)$ for the sort  |
| Each sweep         | $O(n)$        | $O(n)$ for the chain |
| Joining the chains | $O(n)$        | $O(n)$               |

The sweep is linear because each point is pushed onto the chain once and popped at most once, so the total number of pops is at most the total number of pushes. The inner `while` loop is therefore not quadratic, even though it looks like a nested loop: the same point can be tested many times, but it is removed only once, and the removal is charged to the push that put it there.

The total is $O(n \log n)$ time and $O(n)$ space, and the space is dominated by the sorted copy of the points, which the algorithm needs because the upper sweep runs in reverse.

The arithmetic is the other bound worth naming. The cross product multiplies two coordinate differences, so with coordinates of magnitude $C$ the intermediate value is of magnitude $2C^2$. For $C = 10^9$ that is about $2 \times 10^{18}$, which is close to the limit of a signed 64-bit integer, and a 128-bit intermediate is required.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The hull of a point set | Andrew's monotone chain |
| The points are already sorted | The monotone chain without the sort |
| The hull of a set that changes by insertion | A dynamic hull, which is a different structure |
| The diameter of a point set | Rotating calipers over the hull |
| The closest pair of points | The divide-and-conquer closest-pair algorithm |
| Is a point inside a convex polygon | A binary search over the fan from a hull vertex |
| The area of the hull | The shoelace formula over the hull vertices |
| The number of lattice points inside | The hull, then Pick's theorem |
| A one-sided envelope of a set of lines | The convex hull trick, which is in [dynamic programming](/algorithms/dynamic-programming/convex-hull-trick) |

The last row is a genuine trap, because the name is the same and the objects are different. The convex hull trick is about the lower envelope of a set of functions and is used to optimize a dynamic program. This article is about the lower envelope of a set of points in the plane.

## Recursion decision

Andrew's monotone chain is iterative, and it should stay that way. The sweep has no recursion at all, and the theorem above is a statement about the state of a loop rather than about a call stack.

Two recursive alternatives exist and both have a bounded depth.

The **divide-and-conquer hull** splits the sorted points at the median, builds the hull of each half, and merges the two chains. Its depth is $O(\log n)$ and its merge step is the delicate part.

The **Quickhull** picks a point on the hull, splits the remaining points by the line through it, and recurses on the two halves. Its average depth is small, but its worst case is $O(n)$, because a configuration can make each recursive call remove only one point.

| Language   | Practical depth                      | Recommendation                        |
| ---------- | ------------------------------------ | ------------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative; the sweep has no recursion |
| Java       | About $10^4$ frames                  | Iterative                             |
| Python     | The interpreter limit of 1000        | Iterative; Quickhull can exceed it    |
| Pascal     | The operating system stack           | Iterative                             |
| JavaScript | About $10^4$ frames                  | Iterative                             |

## Implementation walkthrough

The three lines that decide whether the hull is right.

```cpp
while (lower.size() >= 2 && cross(lower[lower.size() - 2], lower.back(), p) <= 0) {
    lower.pop_back();
}
lower.pop_back();
upper.pop_back();
```

The first line must test the **last three** points of the chain, not the last two, and it must compare `<= 0` rather than `< 0` when the problem wants the extreme vertices only. Testing the last two is not even a meaningful question, because two points do not make a turn.

The two `pop_back` calls at the end are what join the chains without duplicating the endpoints. They are the lines most often forgotten, and their absence is discussed in the failure case below.

The comparator `by_xy` must sort by $x$ and then by $y$, and both sweeps must use the same order. Sorting by $x$ alone leaves the relative order of points with the same $x$ unspecified, and the chain then depends on the sort algorithm's internal choices rather than on the geometry.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Joining the chains without removing the shared endpoints | The hull lists the first and last point twice | Pop the last point of each chain before joining |
| Using `< 0` where the problem wants `<= 0` | Collinear points on an edge become extra vertices | Read the statement's convention |
| Computing the cross product with `double` | A rounding error changes the orientation of nearly collinear points | Use integers and `long long` or `__int128` |
| Overflowing the cross product | The sign is wrong and the chain is corrupted | Size the type for $2C^2$ |
| Sorting by $x$ only | The result depends on the sort's tie-breaking | Sort by $x$ and then by $y$ |
| Forgetting to remove duplicate points | The hull has zero-length edges | Deduplicate the input first |
| Assuming the hull is counterclockwise | The output order does not match the statement | Fix the order and check the statement |
| Ignoring the all-collinear case | The hull has two vertices and every area is zero | Test for it explicitly |

### Why this fails: the endpoints that are counted twice

The plausible wrong approach is to think of the lower chain and the upper chain as two separate pieces of the boundary and to concatenate them. They are not separate: they share both of their endpoints, because both chains run from the leftmost point of the set to the rightmost point of the set.

The smallest counterexample is three points that are not collinear, say $(0,0)$, $(1,1)$ and $(2,0)$. The lower chain is $[(0,0), (2,0)]$ and the upper chain is $[(2,0), (0,0)]$. Concatenating them without removing the shared endpoints gives

$$
[(0,0), (2,0), (2,0), (0,0)],
$$

which has four entries. The correct hull is $[(0,0), (2,0), (1,1)]$, which has three.

The symptom is a zero-length edge in the middle of the reported polygon. The area computed by the shoelace formula is still right, because the repeated point contributes nothing, so a program that only prints the area is unaffected. Every other use of the hull is broken: the vertex count is too large, a point-in-polygon test that assumes three distinct vertices per edge misbehaves, and the output of a problem that asks for the vertices fails to match the expected answer.

Two points is not enough to expose the bug, because with two points the chains are degenerate. One point cannot produce a hull at all. Three points is the smallest set whose hull has an interior, and it is the smallest set on which the two chains share an endpoint that matters.

The lesson generalizes: **the two chains are the two halves of one closed curve, and a closed curve has one copy of each endpoint.** The same instinct applies in other places: a polygon described by a start vertex and a direction has to say which direction it is traversed, and a cycle in a graph has one copy of each vertex.

A second failure in the same area is the collinear convention. The three collinear points $(0,0)$, $(1,1)$ and $(2,2)$ have a hull with two vertices under the rule `<= 0`, which discards the middle point, and three vertices under the rule `< 0`, which keeps it. A problem that asks "how many vertices does the convex hull have" has two possible answers, and the statement has to say which one it means. A program that picks the wrong convention is wrong on the smallest possible input.

## Variants and extensions

- **Rotating calipers.** Two pointers walking around the hull answer every extreme-pair question in $O(h)$ time, and the diameter of a point set is the standard example.
- **The Graham scan.** Sort by angle around an extreme point and sweep, which is the other classical hull algorithm.
- **The gift wrapping.** Start at the leftmost point and repeatedly find the most counterclockwise next point. It costs $O(nh)$ and is the simplest algorithm to state.
- **The divide-and-conquer hull.** Merge two half hulls, which is linear once the points are sorted.
- **The point-in-convex-polygon test.** With the hull in hand, a point is inside exactly when it is to the left of every edge, and the edges can be searched with a binary search over the fan from one hull vertex.
- **The convex hull trick.** The lower envelope of a set of functions, used to optimize a dynamic program. It shares the name and nothing else, and it is described in [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- **Pick's theorem.** The hull of a lattice polygon gives its area and its boundary count, and hence the number of lattice points inside it.
- **The minimum enclosing rectangle.** Every minimum enclosing rectangle of a convex polygon has one side flush with an edge of the polygon, which reduces the problem to $h$ candidate rectangles.

## Contest strategy

1. Use integer arithmetic for the cross product. A `double` coordinate is a bug waiting for a test case with three nearly collinear points.
2. Size the type for the coordinates. With coordinates of magnitude $C$, the cross product reaches $2C^2$, and `long long` is enough only up to $C$ around $2 \times 10^9$.
3. Read the statement for the output order: counterclockwise or clockwise, which vertex first, and whether collinear points count.
4. Handle the degenerate cases explicitly: $n \le 2$, all points collinear, and duplicate points.
5. Deduplicate the input. Two identical points make the chain contain a zero-length edge, and the zero-length edge then fails the cross product test in a way that is hard to read.
6. Write the naive side test for small inputs and compare it against the monotone chain on random sets. A disagreement is either a wrong orientation or a wrong convention, and both are worth finding before the contest rather than during it.

## Worked problems

### Problem 1: the hull vertices

**Restatement.** Given $n \le 10^5$ points, output the vertices of the convex hull in counterclockwise order, starting at the point with the smallest $x$ and then the smallest $y$.

**Naive baseline.** The triple test, $O(n^3)$.

**Insight.** The lower boundary is built left to right, and a point that does not turn left cannot be on it.

**Derivation.** Sort the points, sweep twice, and join the chains without duplicating the endpoints.

**Correctness.** The theorem above proves that each sweep produces the corresponding half of the hull and that the join produces the boundary in the required order.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Joining the chains without removing the shared endpoints, which reports the first and last point twice.

### Problem 2: the area of the hull

**Restatement.** Given $n$ points, report the area of their convex hull.

**Naive baseline.** The area by the triangle-fan formula from a fixed vertex, which is $O(n^2)$ if the hull is not computed first.

**Insight.** The shoelace formula over the hull vertices gives the area in $O(h)$ time once the hull is known, and the hull is the boundary of the region, so the interior points contribute nothing.

**Derivation.** Compute the hull, then sum $\frac{1}{2}\sum_i (x_i y_{i+1} - x_{i+1} y_i)$ over the hull vertices.

**Correctness.** The shoelace formula computes the signed area of a simple polygon, and the hull is a simple polygon whose interior is exactly the convex hull of the set.

**Complexity.** $O(n \log n)$ time, dominated by the hull, and $O(n)$ space. The area of a lattice polygon is a half-integer, so the program should accumulate twice the area and divide at the end.

**Common wrong approach.** Summing the shoelace formula over all the input points rather than over the hull vertices, which counts the interior points as extra crossings and produces an area that is too large.

### Problem 3: is a point inside the hull

**Restatement.** Given $n$ points and one query point, decide whether the query point lies inside the convex hull, on its boundary, or outside it.

**Naive baseline.** For every edge of the hull, test which side the query point is on. That is $O(h)$, which is fine, but it needs the hull first.

**Insight.** With the hull in hand the test is one cross product per edge, and the answer is the sign of the sum of the signs: inside exactly when the query point is to the left of every edge of the counterclockwise hull.

**Derivation.** Compute the hull, then for each edge $(a, b)$ compute $\operatorname{cross}(a, b, q)$. The point is strictly inside when every value is positive, on the boundary when they are all non-negative and one is zero, and outside otherwise.

**Correctness.** The hull is convex, so the intersection of the half-planes to the left of its counterclockwise edges is exactly the hull. The cross product is positive exactly when the query point is in that half-plane, so the conjunction of the tests is exactly membership.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, of which $O(h)$ is the query.

**Common wrong approach.** Testing whether the query point is to the left of every edge of the _input_ points rather than of the hull, which rejects points that are plainly inside the shape.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about the extreme points of a set, and write down the output order and the collinear convention the statement requires.
2. **Direct application.** Implement the cross product and the monotone chain, and compare the result against a brute-force side test on random sets of ten points.
3. **Adaptation.** Write the version that keeps collinear points, the version that outputs clockwise order, and the version that returns the hull area.
4. **Combination.** Combine the hull with the shoelace formula for the area, with the point-in-polygon test for a query, and with Pick's theorem for the number of lattice points inside.
5. **Challenge.** Implement rotating calipers over the hull and compute the diameter of a point set, then compare the answer against the $O(n^2)$ double loop on small inputs.
6. **Transfer.** Recognize a problem in another subject as a hull problem: the convex hull trick for a dynamic program, the one-sided envelope of a set of lines, or the rotating calipers in an offline geometry problem. Where a count has to be reduced, the arithmetic is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the three cases of the orientation test, and derive the sign of the cross product from the height of the line through two of the points. (Formal model)
2. Why does the chain remove the middle point of a triple that does not turn left? (Key insight)
3. State the three claims of the sweep invariant. (Correctness proof)
4. Trace the lower sweep on the six-point example and say which point is removed at each step. (Step-by-step execution)
5. Why must the two chains be joined without their shared endpoints, and what does the smallest counterexample look like? (Common mistakes)
6. What is the difference between the rules `<= 0` and `< 0`, and which one does the problem statement choose? (Common mistakes)
7. Why is the sweep linear even though it contains a nested loop? (Complexity analysis)
8. What type must the cross product use, and how does it depend on the coordinate range? (Complexity analysis)
9. How does the convex hull trick differ from this article's subject? (Algorithm selection)
10. Which degenerate cases must be handled explicitly? (Common mistakes)

## Further reading

- The subject index lists this technique, [convex hull](/algorithms/geometry/convex-hull), beside the geometry it does not yet cover: [the computational geometry](/algorithms/geometry/).
- The sorting that the monotone chain begins with is described in [sorting](/algorithms/foundations/sorting).
- A boundary is the subject of more than one field. The prefix function of [KMP](/algorithms/strings/kmp) is a table of the borders of a string, and it is the string version of the same idea that this page applies to a set of points.
- The binary search that answers a point-in-convex-polygon query in logarithmic time is in [binary search](/algorithms/searching/binary-search).
- The convex hull trick, which is a different technique that shares the name, is in [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The offline sweep that resembles a hull sweep, and the technique that answers many questions at once, is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The arithmetic that keeps a count exact when the coordinates are large is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The counting formula for the number of arrangements of a hull's boundary, when the count is what the problem asks for, is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The discrete mathematics of vectors, determinants and the sign of an area is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The search over a tree of choices, which is the alternative when the points must be chosen rather than the shape, is in [backtracking](/algorithms/enumeration/backtracking).
- The monotone subsequence problem, which is the one-dimensional counterpart of this one, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The dynamic program whose answer is usually reported modulo a prime is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
