---
id: geometry.sweep-line
title: Sweep line
summary: Move a line across a set of segments, keep the segments it currently crosses in an ordered set, and answer every intersection question from the neighbors of that set.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: advanced-technique
keywords:
    [
        sweep line,
        active set,
        status structure,
        event ordering,
        segment intersection,
        shamos-hoey,
        bentley-ottmann,
        balanced search tree,
    ]
prerequisites:
    required: [geometry.convex-hull]
    recommended: [foundations.sorting, graphs.dsu, range-queries.fenwick-tree]
complexity:
    time: "O(n log n) for the decision version"
    space: "O(n)"
assumptions:
    - The segments are closed, so that two segments that share an endpoint are considered to intersect.
    - The coordinates are integers small enough that the comparison of two segments at the sweep line is exact.
reviewed: false
---

## At a glance

Sweep a line across the plane and process the events in the order the line meets them. The segments that the line currently crosses form the active set, kept in a balanced search tree, and the only pairs that can intersect are the neighbors in that set.

| Property | Value |
| --- | --- |
| **Problem** | Decide whether any two of a set of segments intersect, and report the intersections |
| **Events** | The two endpoints of every segment, sorted by $x$ |
| **Active set** | The segments the sweep line currently crosses, ordered by their height |
| **Reduction** | Two segments that intersect become neighbors at some point, so only neighbors are tested |
| **Time** | $O(n \log n)$ to decide, $O((n + k) \log n)$ to report $k$ intersections |
| **Auxiliary space** | $O(n)$ for the active set and the event list |
| **Requires** | A comparison that orders two segments by their height at the current sweep position |
| **Fails when** | The comparison is not a strict weak ordering, which makes the search tree misbehave |

The reduction is the heart of the technique. It says that a question about all pairs of segments can be answered by looking only at the pairs that are adjacent in the active set, and the number of such pairs over the whole sweep is linear.

## Problem motivation

A problem gives $n \le 10^5$ line segments and asks whether any two of them cross.

The naive baseline tests every pair. There are $\binom{n}{2}$ pairs, about $5 \times 10^9$ of them, and each test is a handful of orientation computations. The program runs for minutes and the answer is a single bit.

The second baseline is a grid, and it does not help here. The segments can be long and thin, so a segment can pass through many cells, and a cell can contain many segments, and the number of pairs that have to be tested is still quadratic in the worst case.

The sweep removes the quadratic factor. Move a vertical line from the left of the picture to the right. At any moment, only some of the segments cross the line, and those segments are the active set. Two segments that cross must, at the moment just before they cross, be next to each other in the vertical order, because nothing can be between them without crossing one of them first. So the only pairs worth testing are the neighbors of the active set, and there are only $O(n)$ neighbor pairs created over the whole sweep.

The technique is called the Shamos-Hoey algorithm after the two people who published it, and it is the geometry analog of the offline batch of binary searches in [parallel binary search](/algorithms/advanced/parallel-binary-search): both techniques turn a quadratic number of independent questions into a linear number of questions asked at the right moment.

## Recognition patterns

Sweep line is the right tool when the statement contains some of these phrases.

- "Do any two segments intersect", "is there a crossing", "do the roads cross".
- "The first intersection", "the leftmost crossing", "the number of intersections".
- "Report every crossing", "list the crossing points".
- "The closest pair of points", where a sweep answers the problem differently from the divide and conquer.
- "Do any two rectangles overlap", "the smallest $y$ at which a collision happens".
- A set of objects with a left and a right end, and a question about overlaps.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 10^5$ segments | $O(n \log n)$ is instant, and the quadratic version is not |
| $n \le 2000$ segments | The quadratic version is fine and is the reference implementation |
| The question is a yes or no | The Shamos-Hoey decision version, $O(n \log n)$ |
| The question asks for every intersection | The Bentley-Ottmann version, $O((n + k) \log n)$ where $k$ is the number of intersections |
| $k$ can be $\Theta(n^2)$ | The output alone is quadratic, and the running time is quadratic too |
| The segments share endpoints | The convention matters, and the event order at a shared $x$ decides whether a shared endpoint is found |
| The segments are vertical | They need a special case, because their $x$-range is a single point |
| The coordinates reach $10^9$ | The comparison of two segments at the sweep line needs 128-bit arithmetic |
| The objects are intervals on a line rather than segments in the plane | The same technique with a Fenwick tree or a segment tree over one coordinate |

The last row is worth knowing, because many problems that look like geometry are one-dimensional in disguise, and the sweep applies to them with a simpler data structure.

## Naive approach

The baseline is the double loop.

```python
def any_intersection(segments):
    for i in range(len(segments)):
        for j in range(i + 1, len(segments)):
            if segments_intersect(segments[i], segments[j]):
                return True
    return False
```

This is correct, it is $O(n^2)$ time and $O(1)$ space, and it is the reference implementation for a differential test. The intersection test itself is four orientation computations and a sign check.

The second baseline is a sweep with a linear scan for the neighbors instead of a search tree, which is $O(n^2)$ for the same reason as the double loop: finding the neighbors of a segment in an array costs a scan.

## Key insight

The insight is that **two segments that intersect must be adjacent in the active set at some moment, so only adjacent pairs need to be tested.**

Take two segments $a$ and $b$ that intersect at a point $p$, and let $p$ be the leftmost intersection point among all the segments. Sweep the line to just before the $x$-coordinate of $p$. Both $a$ and $b$ are in the active set, and their heights are converging to the height of $p$.

Suppose $a$ and $b$ are not adjacent there, so that some segment $c$ has its height strictly between theirs. As the sweep approaches $p$, the height of $c$, being between the heights of $a$ and $b$, also tends to the height of $p$. So $c$ passes through $p$ as well. Now take two segments of the group that pass through $p$ that are adjacent in the height order. The same argument shows that no other segment of the whole active set lies between them, and so they are adjacent in the active set and they intersect.

So the reduction is: **if any intersection exists, then at some moment two adjacent segments of the active set intersect.** And the algorithm tests every pair that becomes adjacent, at the moment it becomes adjacent, using the exact segment intersection test. The test is not a "do they cross right here" test; it asks whether the two segments intersect anywhere, so a pair that becomes adjacent before its intersection is still reported.

The second insight is that **the active set changes only at the endpoints of the segments.** Between two consecutive events, no segment starts and no segment ends, so the set of segments crossing the line does not change, and the only thing that changes is their order, and the order can change only if two of them intersect, which is the thing being detected.

The third insight is that **the order of two segments in the active set is their height at the current sweep position, and that comparison is the only arithmetic the sweep needs.** A segment from $(x_1, y_1)$ to $(x_2, y_2)$ has height

$$
y(X) = \frac{y_1 (x_2 - x_1) + (y_2 - y_1)(X - x_1)}{x_2 - x_1}
$$

at the sweep position $X$, and two segments are compared by comparing these fractions. With integer coordinates, the comparison is exact when it is done by cross-multiplication in a wide enough type.

## Formal model

Let $S$ be a set of line segments.

::: math definition Definition
The **sweep line** is the vertical line $x = X$. A segment is **active** at $X$ when $X$ lies between its endpoints' $x$-coordinates. The **active set** is the collection of active segments. The **status structure** is the active set ordered by the height of the segments at $X$, and the **height** of a segment is the $y$-coordinate at which the sweep line meets it.
:::

::: math definition Definition
Two segments **intersect** when they have a point in common, including a shared endpoint. The **event list** is the multiset of the two endpoints of every segment, and the **sweep** processes the events in increasing order of their $x$-coordinate, inserting a segment at its left endpoint and removing it at its right endpoint.
:::

::: math lemma Lemma
If any two segments of the set intersect, then at some moment of the sweep two segments that are adjacent in the active set intersect.
:::

::: math proof Proof
Let $p$ be the intersection point with the smallest $x$-coordinate among all intersection points, and let $T$ be the set of segments that contain $p$. Every segment of $T$ is active just before the sweep reaches the $x$-coordinate of $p$, and their heights tend to the height of $p$ as the sweep approaches it.

Order the segments of $T$ by their heights just before that moment, and take two that are adjacent in that order, say $a$ and $b$. Suppose some segment $c$ of the whole active set had its height strictly between those of $a$ and $b$ at that moment. Its height would still be between them as the sweep approaches $p$, because the order of two segments in the active set can change only at an intersection, and no intersection occurs before $p$. So the height of $c$ would also tend to the height of $p$, and $c$ would contain $p$, which puts $c$ in $T$ and contradicts the choice of $a$ and $b$ as adjacent within $T$.

Therefore $a$ and $b$ are adjacent in the whole active set, and they intersect at $p$. $\square$
:::

::: math invariant Invariant
At every moment of the sweep, the status structure contains exactly the active segments, ordered by their height at the current sweep position, and every pair of segments that has been adjacent in the status structure has been tested for intersection. The invariant is established when the first segment is inserted and preserved by the two update rules, which test the new neighbors whenever the status structure changes.
:::

## Algorithm derivation

The event list is sorted, and the sweep is a loop over the sorted events.

```python
def any_intersection(segments):
    events = []
    for i, (ax, ay, bx, by) in enumerate(segments):
        if ax > bx:
            ax, ay, bx, by = bx, by, ax, ay
        events.append((ax, 0, i))     # 0 = insert, 1 = remove
        events.append((bx, 1, i))
    events.sort()
    active = SweepTree()              # ordered by height at the current x
    for x, kind, index in events:
        active.set_x(x)
        if kind == 0:
            s = segments[index]
            above = active.successor(s)
            below = active.predecessor(s)
            if below is not None and segments_intersect(segments[below], s):
                return True
            if above is not None and segments_intersect(s, segments[above]):
                return True
            active.insert(s)
        else:
            s = segments[index]
            below = active.predecessor(s)
            above = active.successor(s)
            active.remove(s)
            if below is not None and above is not None \
                    and segments_intersect(segments[below], segments[above]):
                return True
    return False
```

The event ordering is the first thing to get right. The events are sorted by $x$, and at the same $x$ the **insertions are processed before the deletions**. The reason is a shared endpoint: two segments that meet at their common right endpoint, one ending there and one starting there, are adjacent only while both are in the tree, and processing the insertion first makes them adjacent while the ending one is still present.

The three `segments_intersect` calls are the whole reduction. At an insertion, the new segment can only intersect its two new neighbors, and at a deletion, the only new neighbor pair is the one that the deleted segment's predecessor and successor form. Every other pair that becomes adjacent later is tested when it becomes adjacent.

The status structure has to support insertion, removal, predecessor, and successor, all in $O(\log n)$. A balanced binary search tree does.

## Step-by-step execution

Take three segments:

- $A$ from $(0,0)$ to $(10,10)$, the line $y = x$,
- $B$ from $(1,3)$ to $(2,3)$, a short horizontal segment,
- $C$ from $(0,10)$ to $(10,0)$, the line $y = 10 - x$.

$A$ and $C$ cross at $(5,5)$. $B$ crosses neither of them, because at $y = 3$ the segment $A$ is at $x = 3$ and the segment $C$ is at $x = 7$, neither of which is in $[1, 2]$.

**The event list.** Sorted by $x$, the events are

| $x$  | Event                     |
| ---- | ------------------------- |
| $0$  | insert $A$ and insert $C$ |
| $1$  | insert $B$                |
| $2$  | remove $B$                |
| $10$ | remove $A$ and remove $C$ |

At $x = 0$ the two insertions are processed in some order, and each inserted segment has no neighbor, so nothing is tested. The active set is $\{A, C\}$ with $A$ below $C$.

**At $x = 1$.** The segment $B$ is inserted. Its height is $3$, and the heights of $A$ and $C$ at $x = 1$ are $1$ and $9$, so $B$ goes between them. The two new neighbor pairs are $(A, B)$ and $(B, C)$, and neither intersects, so nothing is reported. The active set is $\{A, B, C\}$.

**At $x = 2$.** The segment $B$ is removed. Its predecessor is $A$ and its successor is $C$, so the pair $(A, C)$ becomes adjacent, and the algorithm tests it. The segments $A$ and $C$ do intersect, at $(5,5)$, and the algorithm reports the intersection.

**What the deletion is worth.** The pair $(A, C)$ is never a neighbor pair at an insertion: when $A$ was inserted, $C$ was not yet in the tree, and when $C$ was inserted, $A$ was already there but $B$ had not yet been inserted, so $A$ and $C$ were adjacent at that moment and were tested. The test at $x = 0$ was performed when $A$ and $C$ were both fresh, and it found the intersection there. The deletion of $B$ is what makes them neighbors again, and the second test confirms it.

A program that tests only the neighbor pairs at insertions still finds the intersection in this example, because $A$ and $C$ were adjacent at the insertion of $C$. The deletion test is needed in the configurations where the two segments were separated at every insertion.

## Correctness proof

::: math theorem Theorem
The sweep reports an intersection if and only if two of the segments intersect. When it reports, the two segments it reports do intersect.
:::

::: math proof Proof
**The report is sound.** Every reported pair has been tested with the exact segment intersection test, which is the standard orientation test on the four endpoints, and the test is exact for integer coordinates. So every reported pair really does intersect.

**The report is complete.** Suppose two segments intersect. By the lemma, there is a moment at which two segments that are adjacent in the active set intersect. Consider the first moment at which that adjacent pair is formed. It is formed either by an insertion, in which case the algorithm tests the new segment against its new neighbors, or by a deletion, in which case the algorithm tests the two segments that become neighbors. Either way the pair is tested, and since the two segments do intersect, the algorithm reports.

**The status structure is maintained.** Between two consecutive events, no segment starts and no segment ends, so the set of active segments does not change. The order of two active segments can change only if they intersect, and the algorithm reports an intersection as soon as it finds one, so up to the moment of the report the order is the order of the heights, and the status structure stays correctly sorted. Insertions and deletions place the segment at the position its height dictates, which is what the search tree finds by comparison. $\square$
:::

## Complexity analysis

Let $n$ be the number of segments and $k$ the number of intersections.

| Stage                        | Time                | Space      |
| ---------------------------- | ------------------- | ---------- |
| Building the event list      | $O(n)$              | $O(n)$     |
| Sorting the events           | $O(n \log n)$       | $O(n)$     |
| The sweep, decision version  | $O(n \log n)$       | $O(n)$     |
| The sweep, reporting version | $O((n + k) \log n)$ | $O(n + k)$ |

The decision version has $2n$ events, and each event does a constant number of tree operations, each of which is $O(\log n)$, plus a constant number of intersection tests, each of which is $O(1)$. The total is $O(n \log n)$.

The reporting version has the same $2n$ events plus one swap event per intersection, and the swaps are scheduled through a priority queue, so the total is $O((n + k) \log n)$. The output itself has $k$ points, so the running time cannot be better than $O(k)$.

The arithmetic is the other bound. Comparing two segments at the sweep position $X$ means comparing two rational heights, and the cross-multiplied products are of magnitude $X Y^2$ for coordinates of magnitude $Y$. For $Y = 10^9$ that is about $10^{27}$, which needs a 128-bit integer. The intersection test itself needs only the orientation test, whose intermediates are of magnitude $2Y^2$, so a 64-bit integer is enough for $Y = 10^9$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Do any two segments intersect | Shamos-Hoey, $O(n \log n)$ |
| Report every intersection | Bentley-Ottmann, $O((n + k) \log n)$ |
| The leftmost intersection | Shamos-Hoey, recording the sweep position of the report |
| Do any two axis-aligned rectangles overlap | A sweep with a segment tree over the vertical edges |
| The closest pair of points | The divide and conquer, in [closest pair](/algorithms/geometry/closest-pair) |
| The smallest gap between two intervals | A sorted list and a two-pointer scan |
| Many interval overlap queries | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |
| The union area of rectangles | A sweep with a segment tree, which is the Klee's measure problem |
| The convex hull | The monotone chain, in [convex hull](/algorithms/geometry/convex-hull) |

The fourth row is the one that is genuinely different from segment intersection, and it is worth knowing why. Two axis-aligned rectangles overlap exactly when their $x$-intervals overlap and their $y$-intervals overlap, and the sweep handles the first condition by its events while the second condition is a range query answered by a segment tree over the $y$-axis. Reducing the problem to segment intersection does not work, because the overlap of two rectangles is not the intersection of two of their sides.

## Recursion decision

The sweep itself is a loop over the sorted events, and the search tree inside it is a balanced binary tree, whose own operations are iterative in every standard library.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; use `std::set` or `std::map` for the status structure |
| Java | About $10^4$ frames | Iterative; use `TreeMap` for the status structure |
| Python | The interpreter limit of 1000 | Iterative; `sortedcontainers` is not available, so a list with `bisect` is the practical choice |
| Pascal | The operating system stack | Iterative; a hand-written balanced tree is needed, since the standard library has no ordered set |
| JavaScript | About $10^4$ frames | Iterative; a sorted array with a splice is the practical choice |

The recursion is in the search tree, and its depth is $O(\log n)$, which is about $17$ for $n = 10^5$. No language is in danger.

The interesting practical note is Python and JavaScript, which have no ordered set in the standard library. A sorted list with a binary search gives $O(\log n)$ for the lookup but $O(n)$ for the insertion, because the array has to be shifted. For $n = 10^5$ and $2n$ events, that is $10^{10}$ element moves, which is too slow. The standard workaround is to use a `bisect` on a list and accept the cost, to implement a small treap, or to use a different formulation of the problem that needs a Fenwick tree over a compressed coordinate instead of a comparison-based tree.

## Implementation walkthrough

Three lines decide whether the sweep is right.

```python
events.sort()
```

The sort must be by $x$, and at equal $x$ the insertions must come before the deletions. A plain `events.sort()` on the tuple `(x, kind, index)` with `kind` equal to $0$ for an insertion and $1$ for a deletion does exactly that, because the tuple comparison breaks the tie on the second element.

```python
if below is not None and segments_intersect(segments[below], s):
```

The test at the insertion must be against **both** neighbors. A segment that is inserted between two others can intersect either of them, and the neighbor that it will actually meet first is not knowable in advance.

```python
active.set_x(x)
```

The status structure must be told where the sweep line is, because the comparison of two segments depends on the sweep position. And this is where the subtlest bug of the whole technique lives: in most standard libraries the comparator of an ordered container must be a **strict weak ordering that does not change over the life of the container**. The comparison here does change, because the sweep line moves. It is safe only because the relative order of two segments in the tree changes only when they intersect, and the algorithm reports that and stops. A program that continues the sweep after reporting, or that moves the sweep line past an intersection without stopping, produces a tree whose ordering is no longer sorted and whose subsequent searches return garbage.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Testing only the neighbors at an insertion | Intersections are missed when the pair becomes adjacent later | Test the newly adjacent pair at every deletion as well |
| Deletions processed before insertions at the same $x$ | A shared endpoint is missed | Insert first |
| The comparator uses the current $x$ but the tree is not told about it | The tree is not sorted and the searches return garbage | Set the sweep position before every event |
| The comparator is not a strict weak ordering | The tree misbehaves in ways that are hard to read | Make the comparison exact and total |
| Comparing heights with floating point | A rounding error swaps two segments | Compare the rationals by cross-multiplication |
| Forgetting the degenerate vertical segment | The segment is inserted and removed at the same $x$ | Handle the single-point $x$-range |
| Continuing the sweep after reporting | The tree's ordering becomes invalid | Stop at the first report |
| Using a sorted array with a linear insert | The program is quadratic in the number of events | Use a balanced tree, or a different formulation |

### Why this fails: the pair that only becomes adjacent after a deletion

The plausible wrong approach is to test the neighbor pairs only when a segment is inserted, on the theory that the new segment is the only one that could start a new intersection. It is true that an intersection involves a segment that was inserted at some point, but the pair that intersects may not be a neighbor pair at any insertion.

The smallest counterexample is three segments: $A$ from $(0,0)$ to $(10,10)$, $B$ from $(1,3)$ to $(2,3)$ and $C$ from $(0,10)$ to $(10,0)$. The segments $A$ and $C$ cross at $(5,5)$, and $B$ crosses neither of them.

The sweep inserts $A$ and $C$ at $x = 0$, with $A$ below $C$, so they are neighbors at that moment and the pair is tested. Then $B$ is inserted at $x = 1$ between them, and the pairs $(A, B)$ and $(B, C)$ are tested. Neither intersects. Then $B$ is deleted at $x = 2$, and the pair $(A, C)$ becomes neighbors again.

In this configuration the pair $(A, C)$ was already tested at $x = 0$, so the buggy version happens to work. To make the bug bite, the two intersecting segments must be separated at every insertion. Move the segments so that the two that cross are not both present when the other is inserted: take $A$ from $(0,0)$ to $(10,10)$, $C$ from $(2,8)$ to $(10,0)$ and $B$ from $(1,3)$ to $(2,3)$.

Now $A$ is inserted at $x = 0$ and $C$ at $x = 2$, and at $x = 2$ the segment $B$ is still in the tree, between them, so $A$ and $C$ are **not** neighbors at any insertion. Their intersection is at $x = 5$, and the only moment at which they are neighbors is after $B$ is deleted at $x = 2$. A program that tests only at insertions never tests $(A, C)$ and reports no intersection, while the truth is that they cross at $(5,5)$.

Two segments is not enough to expose the bug, because with two segments the pair is tested at the insertion of the second one. Three is the smallest number of segments in which one segment can be inserted between the two that cross, and the example above is the smallest such configuration.

The lesson generalizes: **a reduction that says "only these pairs matter" must be paired with an argument about when those pairs are examined.** The same shape appears in the [closest pair](/algorithms/geometry/closest-pair) merge, where the candidates are only the seven strip neighbors and the algorithm has to actually examine them, and in the [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) formula, where every subset of the conditions has to be counted with the right sign.

## Variants and extensions

- **Reporting every intersection.** The Bentley-Ottmann algorithm adds a swap event: when two segments are found to intersect, they are scheduled to exchange places in the status structure at the $x$-coordinate of the crossing, and the algorithm continues. The time is $O((n + k) \log n)$.
- **The first intersection.** The decision version reports a pair as soon as it finds one, and the intersection point of that pair is computed exactly from the two line equations. Note that the sweep position at the moment of the report is not the $x$-coordinate of the intersection, because the pair may have been found before the two segments actually met. Finding the **leftmost** intersection needs the reporting version, because the order of the status structure changes at every crossing.
- **The closest pair of points.** The same sweep answers it, with the active set holding the recent points and a shrinking threshold. See [closest pair](/algorithms/geometry/closest-pair) for the divide and conquer version, which is simpler to write.
- **The union area of rectangles.** A sweep in $x$ with a segment tree over $y$, which is the Klee's measure problem. The sweep supplies the events and the segment tree supplies the coverage length.
- **The smallest enclosing interval.** Sweep over the intervals and keep the maximum right end seen so far.
- **Interval overlap queries.** The one-dimensional version of the same technique, with a Fenwick tree over a compressed coordinate. See [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- **Many queries about a fixed set of segments.** A batch of queries is answered by adding the queries as events in the same sweep, which is the geometry analog of [parallel binary search](/algorithms/advanced/parallel-binary-search).
- **The maximum overlap of intervals.** The sweep with a counter over the active set, which is the simplest sweep of all.
- **Vertical segments.** A segment whose two endpoints share an $x$ is active at a single position, and it is inserted and removed at the same event, so it has to be tested against every segment active at that moment.

## Contest strategy

1. Write the event list first, and sort it. Look at the sorted list before writing the tree, because the tie order is the part that is easy to get wrong.
2. Process insertions before deletions at the same $x$, and say so in a comment.
3. Test the neighbor pairs at insertions **and** the newly adjacent pair at deletions. The second one is the step that is usually missing.
4. Use a comparison that is exact. Compare the rational heights by cross-multiplication, and size the type for $X Y^2$.
5. Make sure the comparator is a strict weak ordering that stays valid for the whole sweep, and stop the sweep at the first report.
6. Write the quadratic version first and use it as the reference. The two must agree on every random set of segments, and a disagreement is usually a missing deletion test.
7. Handle the degenerate cases explicitly: vertical segments, segments that share an endpoint, and duplicate segments.

## Worked problems

### Problem 1: do any two segments intersect

**Restatement.** Given $n \le 10^5$ closed line segments, decide whether any two of them have a point in common.

**Naive baseline.** The quadratic double loop, $O(n^2)$ time, which is $5 \times 10^9$ pairs.

**Insight.** Two segments that intersect become neighbors in the active set, so only the neighbor pairs need to be tested.

**Derivation.** Build the event list, sort it with insertions first at equal $x$, and sweep. At an insertion, test the new segment against its predecessor and its successor. At a deletion, test the two segments that become neighbors.

**Correctness.** The theorem above proves that the algorithm reports an intersection if and only if one exists.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, against $O(n^2)$.

**Common wrong approach.** Testing only the neighbor pairs at insertions, which misses the configurations in which the intersecting pair is separated at every insertion.

### Problem 2: do any two rectangles overlap

**Restatement.** Given $n \le 10^5$ axis-aligned rectangles, decide whether any two of them have a point in common.

**Naive baseline.** The quadratic enumeration of the pairs, $O(n^2)$ time.

**Insight.** Two axis-aligned rectangles overlap exactly when their $x$-intervals overlap and their $y$-intervals overlap. The sweep handles the first condition with its events, and the second condition is a range query over the $y$-axis.

**Derivation.** Sweep in $x$. Each rectangle produces two events: at its left edge it is inserted, and at its right edge it is removed. A segment tree over the compressed $y$-coordinates holds, for each elementary $y$-interval, the number of rectangles that currently cover it. At the left edge of a rectangle, insert its $y$-interval and check whether any part of it is already covered by another rectangle; if the coverage count is already at least one somewhere in the interval, two rectangles overlap. At the right edge, remove the $y$-interval.

**Correctness.** The two rectangles overlap exactly when the first one is still in the tree when the second one is inserted and their $y$-intervals share a point. The segment tree reports the coverage count of every elementary interval, so the check at the insertion finds exactly the overlapping pairs.

**Complexity.** $O(n \log n)$ time and $O(n)$ space for the segment tree and the compressed coordinates.

**Common wrong approach.** Reducing the problem to segment intersection. Two axis-aligned rectangles overlap without any of their sides crossing, so the segment intersection test does not apply.

### Problem 3: reporting every intersection

**Restatement.** Given $n$ line segments, report all their intersection points, with $k$ intersections in total.

**Naive baseline.** The quadratic enumeration, $O(n^2)$ time and $O(k)$ output.

**Insight.** When two segments are found to intersect, they will exchange places in the status structure at the $x$-coordinate of the crossing, so the crossing has to be scheduled as an event.

**Derivation.** Run the decision version, but instead of stopping at the first intersection, schedule a swap event at the crossing's $x$-coordinate and continue. The swap event moves the two segments past each other in the status structure, and the neighbors that the swap creates are tested in turn. The events are held in a priority queue keyed by $x$.

**Correctness.** The same reduction applies, with the addition that the order of the status structure is only correct between intersections, and the swap events restore it at exactly the moments it changes.

**Complexity.** $O((n + k) \log n)$ time and $O(n + k)$ space. When $k$ is $\Theta(n^2)$, the output alone is quadratic and no algorithm can do better.

**Common wrong approach.** Forgetting to schedule the swap, so that the status structure keeps the two segments in the wrong order after the crossing and every later search is wrong.

## Practice progression

1. **Recognition.** Given a statement, decide whether it is a segment intersection problem, an interval problem, or a rectangle problem, and write down whether the output is a decision or a list.
2. **Direct application.** Implement the event list, the sort and the sweep, and check it against the quadratic version on random sets of at most $200$ segments.
3. **Adaptation.** Write the version that reports the leftmost intersection, the version that counts the intersections, and the version that handles vertical segments.
4. **Combination.** Combine the sweep with a segment tree for the union area of rectangles, and with the [Fenwick tree](/algorithms/range-queries/fenwick-tree) for interval overlap queries.
5. **Challenge.** Implement the Bentley-Ottmann version that reports every intersection, including the swap events, and check it against the quadratic version on random sets with a small number of intersections.
6. **Transfer.** Recognize the technique in another subject: the maximum overlap of intervals, the union length of intervals, the smallest covering interval, and the offline batch of binary searches, which is the same idea applied to a monotone condition.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. Define the sweep line, the active set and the status structure. (Formal model)
2. Prove that an intersection implies an adjacent pair in the active set. (Formal model)
3. Why must the insertions be processed before the deletions at the same $x$? (Implementation walkthrough)
4. Which pairs are tested at an insertion, and which at a deletion? (Algorithm derivation)
5. What invariant does the sweep maintain, and why does it fail after an intersection is passed? (Formal model)
6. Give the smallest counterexample to testing only the insertion neighbors. (Common mistakes)
7. Why does the comparator of the status structure have to be exact, and what type does it need? (Implementation walkthrough)
8. What is the time of the decision version and of the reporting version? (Complexity analysis)
9. Why is a sorted array with a linear insert too slow in Python? (Recursion decision)
10. Why does the rectangle overlap problem not reduce to segment intersection? (Algorithm selection)
11. What is the swap event in the Bentley-Ottmann algorithm? (Variants and extensions)
12. Which degenerate cases must be handled explicitly? (Contest strategy)

## Further reading

- The orientation test that decides whether two segments cross is the same test that the [convex hull](/algorithms/geometry/convex-hull) article builds its whole algorithm on.
- The closest pair of points, which the sweep can also answer, is in [closest pair](/algorithms/geometry/closest-pair).
- The offline batch of binary searches, which is the same idea applied to a monotone condition over a fixed set of candidates, is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The Fenwick tree, which is the status structure for the one-dimensional version of the sweep, is in [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The union find, which answers the connectivity questions that a sweep over intervals often raises, is in [disjoint set union](/algorithms/graphs/dsu).
- The sorting that builds the event list is in [sorting](/algorithms/foundations/sorting).
- The subject index lists this technique, [sweep line](/algorithms/geometry/sweep-line), beside the rest of the subject: [the computational geometry](/algorithms/geometry/).
