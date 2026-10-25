---
id: geometry.kd-trees
title: K-D trees
summary: Build a balanced tree that splits alternately on x and y at the median, then answer nearest-neighbor queries by descending the nearer side and pruning any subtree that the splitting plane puts out of reach.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: common-contest-technique
keywords:
    [
        k-d tree,
        kd-tree,
        space partitioning,
        median split,
        nearest neighbor,
        squared euclidean distance,
        pruning,
        orthogonal range search,
    ]
prerequisites:
    required: [foundations.sorting]
    recommended: [foundations.complexity, geometry.closest-pair, searching.binary-search]
complexity:
    time: "O(n log^2 n) build with a full sort per node; O(log n) average per query and O(n) worst case"
    space: "O(n)"
assumptions:
    - The points are two-dimensional and the distance is the squared Euclidean distance.
    - The coordinates are integers of magnitude at most $10^{7}$, so every squared distance is exact below $2^{53}$ and fits in a signed 64-bit integer.
    - The point set is static; insertion and deletion are out of scope.
implementations: geometry.kd-trees
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/geometry.kd-trees.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A **K-D tree** is a binary tree that stores a set of points and partitions the plane as it is built. Each node holds one point, and the remaining points are divided by a line through that point: the points that sort before the node go to the left subtree and the points that sort after it go to the right subtree, so the two subtrees lie on opposite sides of the line, with points on the line split by their indices. The splitting axis alternates with depth, so the root splits on $x$, its children split on $y$, their children split on $x$ again, and so on.

The tree is built by **median splits**. Sort the current range by the current axis, take the middle point as the node, and recurse on the two halves. The median makes the two subtrees as equal as possible, so the depth is $O(\log n)$ and every subtree occupies a rectangle that is roughly square.

A nearest-neighbor query descends the tree. At each node it compares the query point with the node's point, then visits the child on the same side of the splitting line first. The other child is visited only if the query is close enough to the splitting line that a point beyond it could still improve the answer. That single test, applied at every level, is what turns an $O(n)$ scan into an average $O(\log n)$ query.

| Property   | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| Input      | $n$ points, then $q$ query points                                    |
| Build      | sort each range by the current axis and take the median              |
| Axis order | $x$ at the root, then $y$, then $x$, and so on                       |
| Query      | nearer child first, far child only when the plane test allows it     |
| Tie rule   | smallest squared distance, then lowest 1-based index                 |
| Build time | $O(n \log^{2} n)$ with a full sort at every node                     |
| Query time | $O(\log n)$ on average, $O(n)$ in the worst case                     |
| Space      | $O(n)$                                                               |
| Output     | one line per query with the 1-based index of the nearest input point |

The reference program reads $n$, then $n$ lines with an integer $x$ and an integer $y$, then $q$, then $q$ lines with a query point. It prints the 1-based index of the nearest input point for each query, breaking ties by the lowest index. The six versions in the manifest implement exactly that contract.

## Problem motivation

A delivery company has a map of $n$ warehouses and receives $q$ requests, each asking for the warehouse nearest to a customer. A collision detector has a list of obstacles and asks, for every moving object, which obstacle is closest. A recommendation system embeds users and products as points and asks for the nearest neighbor of a new user. The common shape is **a static set of points and many nearest-neighbor questions**.

The naive answer scans every point for every query. With $n = q = 2 \times 10^{5}$ that is $4 \times 10^{10}$ distance computations, which is far beyond a contest time limit. The scan does not reuse anything between queries, so the cost is the product of the two sizes.

A sorted array helps only in one dimension. If the points lie on a line, binary search finds the nearest one in $O(\log n)$. In the plane, sorting by $x$ is not enough: the nearest point can have a completely different $x$ from the query, and the points that are close in $x$ can be far in $y$. A second sorted order does not compose into a search either.

The K-D tree is the standard structure for this job. It costs one preprocessing pass, answers a query by following a path and a small number of side branches, and uses linear memory. It is not a worst-case guarantee, and the article is honest about that: the bound is logarithmic on average for well-distributed points and linear in the worst case. For the usual contest input, the average is what matters.

## Recognition patterns

A K-D tree is the right tool when the statement contains some of these phrases.

- "For each query point, find the nearest point of the set."
- "The closest point", "the nearest neighbor", "the point with minimum distance".
- "Many queries", "answer each query online", "the point set does not change".
- "Points in the plane", "two coordinates", "Euclidean distance", "squared distance".
- "Find all points inside this rectangle" or "count the points in this axis-aligned box", when the queries are numerous and the set is static.
- "The nearest $k$ points", which is the same descent with a heap of size $k$.

The constraint values and the surrounding objects decide between the neighboring techniques.

| Signal | Technique |
| --- | --- |
| Many nearest-neighbor queries on one static point set | This article |
| One closest pair in a static set | [Closest pair](/algorithms/geometry/closest-pair), which is deterministic $O(n \log n)$ |
| The farthest pair of a point set | [Convex hull](/algorithms/geometry/convex-hull), then [rotating calipers](/algorithms/geometry/rotating-calipers) |
| Orthogonal range counts with no updates | An offline sweep with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Orthogonal range counts with updates | A range tree or a two-dimensional Fenwick tree |
| Points arrive one at a time | A dynamic K-D tree with rebuilding, or the logarithmic method |
| Nearest neighbor on a line | [Binary search](/algorithms/searching/binary-search) |
| The metric is Manhattan or Chebyshev | A K-D tree still works, but the plane test uses the same coordinate difference and the shape of the regions changes |
| The dimension is large, say above ten | A K-D tree degrades toward a scan; use a cover tree or an approximate method |

The last row is the **curse of dimensionality**. A K-D tree divides the space into boxes whose volume shrinks slowly when the dimension is high, so the pruning test rejects fewer and fewer subtrees. In two dimensions the boxes shrink quickly, and that is the setting this article analyzes.

| Constraint | What it rules |
| --- | --- |
| $n \le 2000$ and $q \le 2000$ | The double loop is fast enough |
| $n, q \le 2 \times 10^{5}$ | A spatial index is needed |
| Coordinates up to $10^{9}$ | Squared distances reach $8 \times 10^{18}$ and need 64-bit integers |
| The point set is static | One build, many queries |
| The point set changes | A static tree must be rebuilt or replaced by a dynamic structure |
| Queries are exact and ties matter | The tie rule must be part of the comparison |
| The input is adversarial | A balanced range tree gives a worst-case bound; a K-D tree does not |

## Naive approach

The baseline is one loop over all points per query.

```cpp
long long dist2(const Point& a, const Point& b) {
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    return dx * dx + dy * dy;
}

int nearest(const std::vector<Point>& pts, const Point& q) {
    int best = -1;
    long long best_dist = LLONG_MAX;
    for (int i = 0; i < (int)pts.size(); i++) {
        long long d = dist2(pts[i], q);
        if (d < best_dist || (d == best_dist && i < best)) {
            best = i;
            best_dist = d;
        }
    }
    return best;
}
```

For one query the cost is $O(n)$. For $q$ queries it is $O(nq)$, and the memory is $O(1)$ beyond the input. This is the correct reference for small tests and the first thing to write when checking a faster solution.

A grid is a reasonable second baseline. Choose a cell size, hash each point into its cell, and for a query inspect the cell and its neighbors. The problem is the cell size: it must be related to the answer, which is not known in advance. If the cells are too large, a cell contains many points; if they are too small, a query has to inspect many empty cells. The K-D tree chooses the cell boundaries from the data and adapts them at every level.

A third baseline is to sort by $x$ and scan outward from the query's position. That is fast for one-dimensional data, but in the plane the scan must continue until the $x$ gap alone exceeds the best distance, and for points spread along a vertical line the gap stays small for many points. It can be quadratic on a bad input.

## Key insight

The insight is that **a node's splitting line separates the plane into two half-planes, and the whole far subtree lies in the half-plane the query is not in**.

Suppose a node $u$ splits on the $x$-axis at coordinate $s = x_u$, and the query $q$ has $q_x \le s$. The right subtree contains only points with $x \ge s$. For every such point $p$,

$$
(x_p - q_x)^{2} \ge (s - q_x)^{2}.
$$

The same inequality holds for the other axis and the other side. Therefore, if the squared horizontal distance from $q$ to the splitting line already exceeds the best squared distance found so far, no point in the far subtree can improve the answer. The entire subtree can be skipped without looking at any of its points.

The query visits the near subtree first because it is more likely to contain a close point, and a good answer found early makes the bound tight and prunes more of the far side. This is a branch-and-bound search: the current best distance is the bound, and the splitting-plane distance is the lower bound for the unexplored subtree.

Two details keep the search exact.

1. The comparison is on **squared** distances. A square root would introduce floating-point rounding and would not change the ordering.
2. The far side is visited when its plane distance is **equal** to the best distance, not only when it is smaller. A point at the same distance with a lower index can be the required tie-breaker, and strict pruning would lose it.

Alternating the axes is what makes the bound effective. If every level split on $x$, the subtrees would be vertical slabs, and a query far above or below a slab would still have to search it because the $y$ coordinate would never be constrained. Alternating keeps the regions compact in both directions.

## Visual intuition

Every node of the tree owns a rectangle. The root's rectangle is the whole plane; its two children are the two half-planes cut by the root's splitting line; their children are cut again by the perpendicular direction. After a few levels the rectangles are small and roughly square, and each point lives in its own leaf-sized cell.

```
root: x = 5
+-------------------+-------------------+
| x <= 5            | x >= 5            |
| child: y = 7      | child: y = 2      |
| +-------+-------+ | +-------+-------+ |
| | y<=7  | y>=7  | | | y<=2  | y>=2  | |
| | x=2   | x=3   | | | x=8   | x=9   | |
| +-------+-------+ | +-------+-------+ |
+-------------------+-------------------+
```

A query starts with an enormous circle of unknown radius. As it examines points, the best distance shrinks and the circle shrinks with it. A subtree whose rectangle does not intersect the current circle cannot contain a better point and is discarded. The splitting-plane test is a cheap conservative version of that rectangle test: it checks only one side of the rectangle, but it is enough because the far subtree lies entirely beyond the line.

In the example below the query is $(6,5)$. The first point examined is the root $(5,4)$, which gives a squared distance of $2$. The query disk of radius $\sqrt{2}$ then fails to reach the far side of several splitting lines, and those branches disappear from the search.

The tie case is the one place where the picture is misleading. If the circle has radius exactly equal to the best distance, a point on the boundary can still be the answer when its index is lower. The drawing would show the circle touching a subtree, and the algorithm must explore that subtree rather than treat the touch as a miss.

## Formal model

::: math definition Definition
A **point set** is $P = \{p_1, p_2, \ldots, p_n\}$ with $p_i = (x_i, y_i)$. For a query point $q = (q_x, q_y)$ and a point $p$, the **squared Euclidean distance** is

$$
\operatorname{dist}^{2}(q, p) = (x_p - q_x)^{2} + (y_p - q_y)^{2}.
$$

The **key** of $p$ for the query is the pair

$$
K_q(p) = \left(\operatorname{dist}^{2}(q, p),\; i\right),
$$

compared lexicographically. The nearest point is the one with the minimum key, which encodes the tie rule: first the smallest distance, then the lowest index.
:::

::: math definition Definition
A **K-D tree** on $P$ is a binary tree built by the following rule. A node at depth $d$ has axis $a(d) = d \bmod 2$, where $0$ means $x$ and $1$ means $y$. Its point is the median of the current range when the range is sorted by $(p_{a(d)}, \text{index})$. The points before the median form the left subtree and the points after it form the right subtree. A node with an empty range is absent.

For a node $u$, let $R(u)$ be the set of points stored in the subtree rooted at $u$. Let $B(u)$ be the rectangle containing $R(u)$ that is implied by the splitting lines of the ancestors of $u$.
:::

::: math lemma Lemma
Let $u$ be a node with axis $a$ and point $p_u$. Let $q$ be a query that lies on the near side of the splitting line, so the far child $v$ is the subtree on the other side. Then every $p \in R(v)$ satisfies

$$
\lvert q_a - p_a \rvert \ge \lvert q_a - p_{u,a} \rvert.
$$
:::

::: math proof Proof
The build sorts the range by coordinate $a$ and splits at the median. Every point in the far subtree is on the far side of the median, so its $a$-coordinate is at least $p_{u,a}$ when the far side is the right subtree, and at most $p_{u,a}$ when it is the left subtree. In either case the distance from $q_a$ to $p_a$ is at least the distance from $q_a$ to the boundary $p_{u,a}$. $\square$
:::

::: math lemma Lemma
Let $D$ be the current best squared distance. If the far child $v$ of $u$ satisfies

$$
(q_a - p_{u,a})^{2} > D,
$$

then every $p \in R(v)$ has $\operatorname{dist}^{2}(q,p) > D$.
:::

::: math proof Proof
By the previous lemma, $(q_a - p_a)^{2} \ge (q_a - p_{u,a})^{2} > D$. The squared distance is the sum of two non-negative terms, one of which is already greater than $D$, so the sum is greater than $D$. $\square$
:::

The theorem that the search returns the minimum key is stated and proved in the correctness section, after the algorithm has been written down.

## Algorithm derivation

The build has three decisions: which axis, which point, and how to split the range.

```cpp
int build(int lo, int hi, int depth) {
    if (lo >= hi) return -1;
    int axis = depth & 1;
    std::sort(order.begin() + lo, order.begin() + hi, [axis](int a, int b) {
        long long va = axis == 0 ? x[a] : y[a];
        long long vb = axis == 0 ? x[b] : y[b];
        if (va != vb) return va < vb;
        return a < b;
    });
    int mid = lo + (hi - lo) / 2;
    int node = order[mid];
    left[node] = build(lo, mid, depth + 1);
    right[node] = build(mid + 1, hi, depth + 1);
    return node;
}
```

The axis is `depth & 1`, which alternates $0, 1, 0, 1$ without any extra state. The range is half-open, so the left child receives `[lo, mid)` and the right child receives `[mid + 1, hi)`, and the median point is not repeated. The comparator breaks coordinate ties by index, which makes the tree deterministic even when several points share an $x$ or a $y$.

The sort at every node is the simple version. It costs $O(n \log^{2} n)$ over the whole build. Replacing the sort with a linear-time selection of the median, such as `std::nth_element` in C++, reduces the build to $O(n \log n)$ expected time. The reference programs use the sort because it is short, obviously correct, and fast enough for the stated limits.

The query is a recursive descent with two tests.

```cpp
void nearest(int node, const Point& q, int depth) {
    if (node < 0) return;
    long long d = dist2(pts[node], q);
    if (d < best_dist || (d == best_dist && node < best_index)) {
        best_dist = d;
        best_index = node;
    }

    int axis = depth & 1;
    long long delta = axis == 0 ? q.x - pts[node].x : q.y - pts[node].y;
    int near_child = delta <= 0 ? left[node] : right[node];
    int far_child = delta <= 0 ? right[node] : left[node];

    nearest(near_child, q, depth + 1);
    if (delta * delta <= best_dist) {
        nearest(far_child, q, depth + 1);
    }
}
```

The first test updates the answer. The second test is the branch-and-bound step: `delta` is the signed distance from the query to the splitting line, and `delta * delta` is its square. The far child is searched when that square is at most the best squared distance. Equality is included on purpose, for the tie rule.

The order of the two recursive calls matters for speed, not for correctness. The near child is searched first because it is more likely to contain a close point, and a close point lowers `best_dist`, which makes the far-child test reject more often. A version that always searches left first is still correct and can be several times slower on skewed queries.

The recursion returns nothing; the answer lives in `best_dist` and `best_index`. This is the same shape as a depth-first branch-and-bound search, and it is the reason the tie update must be written carefully: the best pair is mutable state shared by the whole traversal.

## Step-by-step execution

Take seven points.

| Index | Point   |
| ----- | ------- |
| 1     | $(2,3)$ |
| 2     | $(5,4)$ |
| 3     | $(9,6)$ |
| 4     | $(4,7)$ |
| 5     | $(8,1)$ |
| 6     | $(7,2)$ |
| 7     | $(3,8)$ |

**Build.** The root is at depth $0$, so it splits on $x$. Sorting all seven by $x$ and then by index gives

$$
(2,3)_1,\ (3,8)_7,\ (4,7)_4,\ (5,4)_2,\ (7,2)_6,\ (8,1)_5,\ (9,6)_3.
$$

The median is the fourth point, index $2$, so the root is $(5,4)$.

The left range is the first three points. At depth $1$ the axis is $y$. Sorting them by $y$ gives $(2,3)_1, (4,7)_4, (3,8)_7$, whose median is $(4,7)_4$. Its left child is $(2,3)_1$ and its right child is $(3,8)_7$.

The right range is the last three points. Sorting by $y$ gives $(8,1)_5, (7,2)_6, (9,6)_3$, whose median is $(7,2)_6$. Its left child is $(8,1)_5$ and its right child is $(9,6)_3$.

The tree is:

```
#2 (5,4) axis x
├── #4 (4,7) axis y
│   ├── #1 (2,3) axis x
│   └── #7 (3,8) axis x
└── #6 (7,2) axis y
    ├── #5 (8,1) axis x
    └── #3 (9,6) axis x
```

**A query.** Let $q = (6,5)$. The search starts with `best_dist = infinity` and `best_index = -1`.

| Step | Node | Squared distance | Best after the check | Decision |
| --- | --- | --- | --- | --- |
| 1 | #2 $(5,4)$ | $1 + 1 = 2$ | #2, distance 2 | `delta = 1`, near is #6; plane square $1 \le 2$, so #4 stays queued |
| 2 | #6 $(7,2)$ | $1 + 9 = 10$ | #2, distance 2 | `delta = 3`, near is #3; plane square $9 > 2$, skip #5 |
| 3 | #3 $(9,6)$ | $9 + 1 = 10$ | #2, distance 2 | leaf, return |
| 4 | #4 $(4,7)$ | $4 + 4 = 8$ | #2, distance 2 | `delta = -2`, near is #1; plane square $4 > 2$, skip #7 |
| 5 | #1 $(2,3)$ | $16 + 4 = 20$ | #2, distance 2 | leaf, return |

The answer is point #2 at $(5,4)$, with squared distance $2$. Two subtrees were skipped: #5 because the query is far from the line $y = 2$, and #7 because the query is far from the line $y = 7$. The root's left subtree was not skipped, because the query is only one unit from the root's line $x = 5$ and the best distance is $\sqrt{2} \approx 1.41$; that is close enough for a point on the other side to tie or win.

## Correctness proof

::: math theorem Theorem
For every query $q$, the search returns the point of $P$ with the minimum key $K_q$, that is, the nearest point with ties broken by the lowest index.
:::

::: math proof Proof
The proof has two parts: the build stores every point exactly once, and the search examines every point that could still have the minimum key.

**The build.** The range $[lo, hi)$ is partitioned into $[lo, mid)$, the single index `order[mid]`, and $(mid, hi)$. The recursive calls cover the first and third parts, so every index in the original range appears exactly once in the subtree. The median makes the two parts differ in size by at most one, so the depth is $\lfloor \log_2 n \rfloor + 1$ and the recursion terminates.

**The search invariant.** At the start of a call on node $u$, let $D$ be the current best squared distance and let $B$ be the best index at that distance. Every point that has not been examined lies in a subtree that is either on the call stack or has already been discarded by a pruning test. The invariant is that no discarded subtree contains a point whose key is smaller than $(D, B)$.

The invariant holds initially because nothing has been discarded. At node $u$, the node's own point is checked and the best pair is updated exactly when its key is smaller, so the invariant is preserved for that point. The near child is always searched. For the far child $v$, there are two cases.

- If $(q_a - p_{u,a})^{2} > D$, then by the pruning lemma every point of $R(v)$ has squared distance greater than $D$, so its key is greater than $(D, B)$. Discarding $v$ preserves the invariant.
- Otherwise the far child is searched. Its points are not discarded, so the invariant is preserved by the recursive call, which can only lower the best key.

The equality case $(q_a - p_{u,a})^{2} = D$ falls into the second case, so a point in the far subtree at distance exactly $D$ is still examined. If its index is lower than $B$, the tie update replaces the answer; if not, the answer stays. This is exactly the lexicographic rule.

**Termination and conclusion.** Each call either returns at an empty node or makes two smaller recursive calls, so the recursion terminates. When it does, every point has either been examined or lies in a discarded subtree that cannot contain a smaller key. Therefore the final pair $(D, B)$ is the minimum key over $P$. $\square$
:::

The theorem assumes that the tree is built from the same point set that is queried. It says nothing about the running time; a correct search can still visit every node, and the next section explains when that happens.

## Complexity analysis

| Stage                                    | Time                   | Space                 |
| ---------------------------------------- | ---------------------- | --------------------- |
| Building with a full sort per node       | $O(n \log^{2} n)$      | $O(n)$                |
| Building with median selection           | $O(n \log n)$ expected | $O(n)$                |
| One query, balanced and well distributed | $O(\log n)$ average    | $O(\log n)$ recursion |
| One query, worst case                    | $O(n)$                 | $O(\log n)$ recursion |
| All $q$ queries                          | $O(q \log n)$ average  | $O(n)$ total          |

The build analysis is level by level. At one level the ranges are disjoint and total $n$ points, but sorting a range of size $m$ costs $O(m \log m)$. Summing over the level gives at most $O(n \log n)$, and there are $O(\log n)$ levels, so the total is $O(n \log^{2} n)$. Selecting the median in linear time makes each level $O(n)$ and the total $O(n \log n)$.

The query analysis is not a simple tree bound. A balanced tree has depth $O(\log n)$, but the far-child test can send the search into both children at many levels. For points drawn independently from a bounded distribution, the expected number of visited nodes is $O(\log n)$, because the rectangles shrink geometrically and the query disk quickly becomes larger than the boxes it can still reach. For an adversarial set the expected bound disappears.

The clean worst case is a set of identical points. Every splitting line passes through the query if the query equals the point, so the plane distance is zero, the test `0 <= best_dist` is always true, and both children are visited at every node. The query examines all $n$ points. Duplicate points are therefore not just a tie-breaking curiosity; they defeat the pruning entirely. Any input that keeps the best distance at zero and puts every split coordinate equal to the query coordinate has the same effect, which is the practical reason a duplicate-heavy test is worth running before submission.

The space is linear: one point, one left pointer and one right pointer per node, plus the recursion stack of depth $O(\log n)$ for a balanced tree. If a dynamic version is allowed to become unbalanced, the stack can grow to $O(n)$ and the recursion must be replaced by an explicit stack.

The arithmetic needs the same care as every geometry technique. With coordinates of magnitude $C$, a coordinate difference is at most $2C$ and a squared distance is at most $8C^{2}$. For $C = 10^{7}$ that is $8 \times 10^{14}$, which is below $2^{53} \approx 9.007 \times 10^{15}$ and therefore exact in a JavaScript `Number` and in a signed 64-bit integer. For $C = 10^{9}$ the squared distance reaches $8 \times 10^{18}$, which fits a signed 64-bit integer but not a 32-bit one and not an exact `Number`. The comparison of squared distances is exact only while the values stay in the chosen type.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Nearest neighbor of each of $q$ queries on a static 2D set | A K-D tree, average $O(\log n)$ per query |
| One closest pair in a static set | [Closest pair](/algorithms/geometry/closest-pair), deterministic $O(n \log n)$ |
| Points on a line | Sorting and [binary search](/algorithms/searching/binary-search) |
| Farthest pair of a point set | [Convex hull](/algorithms/geometry/convex-hull) plus [rotating calipers](/algorithms/geometry/rotating-calipers) |
| Orthogonal range counting, offline | A sweep with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Orthogonal range counting, online with updates | A range tree or a two-dimensional Fenwick tree |
| Orthogonal range reporting, static | A K-D tree with subtree bounding boxes, or a range tree for a worst-case bound |
| Nearest neighbor with insertions and deletions | A dynamic K-D tree with scapegoat rebuilding, or the logarithmic method |
| Nearest neighbor in a fixed dimension, worst-case guarantee | A range tree for orthogonal queries, or a Voronoi diagram in the plane |
| Very high dimension | A cover tree, a ball tree, or an approximate nearest-neighbor index |

The distinction between this article and [closest pair](/algorithms/geometry/closest-pair) is worth stating plainly. Closest pair answers one question about the whole set and has a deterministic $O(n \log n)$ divide-and-conquer solution with a packing argument. A K-D tree answers many independent nearest-neighbor questions and has an average-case bound that depends on the geometry. Running closest pair once is the better choice when the question is singular; a K-D tree is the better choice when the queries are many or when the queries arrive with the input.

A range tree is the opposite trade. It guarantees $O(\log^{2} n)$ for an orthogonal range count and uses $O(n \log n)$ memory, while a K-D tree uses $O(n)$ memory and has no worst-case guarantee. If the problem's limits are adversarial and the queries are orthogonal, the range tree is the safe choice.

## Reference implementations

| Language | File | Build | Notes |
| --- | --- | --- | --- |
| C | `c/program.c` | `qsort` on each subrange | Arrays for the points, the order and the two children |
| C++17 | `cpp17/program.cpp` | `std::sort` on each subrange | Vectors and a lambda comparator |
| Java | `java/Main.java` | `Arrays.sort` on a subrange of `Integer[]` | Long arrays for coordinates, `FastScanner` for input |
| Python | `python/program.py` | `list.sort` on a sliced index list | Tuples for points, recursion with `nonlocal` |
| Pascal | `pascal/program.pas` | Explicit merge sort on the index array | `Int64`, one argument per `Read`, no `IOResult` |
| JavaScript | `javascript/program.js` | `slice` and `sort` on each subrange | `Int32Array` for the child arrays |

All six programs share the same contract and the same algorithmic decisions.

- Read $n$, then the $n$ input points, then $q$, then the $q$ query points.
- Build one tree with axis $= \text{depth} \bmod 2$ and the median of a sorted subrange.
- For each query, initialize the best pair, descend the near side, and visit the far side only when the squared plane distance is at most the best squared distance.
- Compare distances first and indices second, then print `best_index + 1`.

The C and C++ versions use a library sort on each subrange, the Java version sorts a boxed integer array, and the Python version sorts a list of indices. The Pascal version cannot rely on a library median selection, so it carries an explicit merge sort over the index array; the result is the same tree. The JavaScript version sorts a copy of each subrange and writes it back, which keeps the comparator simple.

The C++ version is the shortest starting point for a contest. It is also the version to modify first when the build is too slow: replace the per-node `std::sort` with `std::nth_element` on the same range. The tree shape is unchanged, the asymptotic build drops to $O(n \log n)$ expected, and the query code does not move.

## Recursion decision

Both the build and the query are recursive, and both have depth equal to the tree height.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^{5}$ frames on an 8 MB stack | The balanced depth is safe |
| Java | About $10^{4}$ frames | The balanced depth is safe |
| Python | The interpreter limit of 1000 | The balanced depth is about 18 at $n = 2 \times 10^{5}$, so it is safe; raise the limit only for a dynamic tree |
| Pascal | The operating system stack | The balanced depth is safe |
| JavaScript | About $10^{4}$ frames | The balanced depth is safe |

The median split is what keeps the depth logarithmic. A tree built by inserting points in input order can degenerate into a chain, and then both the build and the query can recurse $n$ levels deep. The static build in this article never does that, because the median is chosen from the whole range at every node.

The query recursion has two calls, not one tail call. The near call must finish before the far call can use the improved bound, so the recursion cannot be flattened into a simple loop without an explicit stack. An explicit stack is worth writing only when the tree is dynamic or when the language's recursion limit is a real constraint.

The build recursion is also two calls, with the sort before them. It is not tail recursive, but the depth is small. The Python version relies on the balanced depth and does not raise the recursion limit; a Python program that inserts points one at a time would need to.

## Implementation walkthrough

The lines that decide whether the tree and the search are right.

1. **The half-open range.** Use `[lo, hi)`, put the median at `mid`, recurse on `[lo, mid)` and `[mid + 1, hi)`, and return `-1` when `lo >= hi`. An inclusive upper bound is the usual source of a duplicated or missing point.
2. **The median.** `mid = lo + (hi - lo) / 2` chooses the lower median. For seven points the left and right subtrees have three points each; for an even number they differ by one. Either median works; the important part is that both sides are non-empty when the range has at least two points.
3. **The axis.** `depth & 1` is zero for $x$ and one for $y$. The build and the query must use the same rule, because the query's `delta` must be measured on the axis that the node actually split.
4. **The comparator.** Sort by the coordinate and then by the index. The index tie-break makes the build deterministic and makes the left and right halves well defined when several points share a coordinate.
5. **The near side.** `delta = q[axis] - p[axis]`. If `delta <= 0`, the query is on the left, so the near child is the left child and the far child is the right child. If `delta > 0`, the roles reverse.
6. **The prune.** Visit the far child when `delta * delta <= best_dist`. The left side is a squared distance and the right side is a squared distance, so the units match. A strict `<` is a tie-breaking bug, not an optimization.
7. **The update.** Replace the best pair when `d < best_dist`, or when `d == best_dist` and the new index is smaller. Both comparisons are necessary.
8. **The output.** The stored node index is zero-based, so print `best_index + 1`. An empty query list prints nothing.

The core of the query is five lines.

```cpp
int axis = depth & 1;
long long delta = axis == 0 ? q.x - pts[node].x : q.y - pts[node].y;
int near_child = delta <= 0 ? left[node] : right[node];
int far_child = delta <= 0 ? right[node] : left[node];
nearest(near_child, q, depth + 1);
if (delta * delta <= best_dist) nearest(far_child, q, depth + 1);
```

A useful debugging exercise is to draw the tree for a small input and write down the axis, the split coordinate and the rectangle of every node. Then trace one query and mark each node as "examined", "skipped by the plane test" or "outside the search". If a node is skipped while its point is closer than the final answer, either the axis is wrong or the prune is too strict.

The Pascal version deserves one extra note. It reads one integer per `Read` call, uses `Int64` for coordinates and distances, and avoids `IOResult`, which keeps it compatible with the pas2js compiler used by the site. The merge sort is iterative in its merge step but recursive in its divide step, so its depth is also logarithmic.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Pruning the far side on equality | A tied point with a lower index is lost | Use `<=`, not `<` |
| Updating only on a strictly smaller distance | The first tied point wins even if a later index is lower | Compare the index when the distances are equal |
| Comparing a squared distance with an unsquared plane distance | The prune rejects valid points or keeps useless ones | Square the plane distance before comparing |
| Using `sqrt` and floating-point distances | Rounding changes the order of nearly equal points | Keep everything in squared integers |
| Forgetting to alternate the axes | The tree is a set of slabs and the prune is weak | Use `depth & 1` in both build and query |
| Choosing the median with an inclusive upper bound | A point is duplicated or dropped | Use half-open ranges consistently |
| Rebuilding the tree for every query | The preprocessing cost is paid $q$ times | Build once, query many times |
| Initializing the best distance to zero | No point ever improves it | Initialize to infinity or use a "no answer yet" flag |
| Printing the zero-based index | Every answer is off by one | Add one at the output |
| Assuming the tree is balanced after insertions | Recursion depth and query time can both become linear | Rebuild, or use a dynamic structure |

### Why this fails: pruning the tie

The smallest counterexample has two points and one query.

$$
p_1 = (0,0), \quad p_2 = (2,0), \quad q = (1,0).
$$

The build sorts by $x$ and takes the lower median. With two points, the median is the second point, so the root is $p_2$ and its left child is $p_1$. The query examines the root first and finds a squared distance of $1$, so the best pair is index $2$.

The root's axis is $x$, and the query is one unit to the left of the splitting line: `delta = -1`. The plane square is therefore $1$. If the program prunes with

```cpp
if (delta * delta < best_dist) {
    nearest(far_child, q, depth + 1);
}
```

the test is `1 < 1`, which is false, so the left child is never visited. The program prints index $2$. The correct answer is index $1$, because $p_1$ is at the same distance and has the lower index.

The equality case is not a rare coincidence. It occurs whenever the query is the midpoint of two points that straddle a splitting line, whenever duplicate points are present, and whenever the input contains a symmetric configuration. The fix is to use `<=` and to make the tie update compare indices. Both changes are needed: `<=` makes the tied point reachable, and the index comparison makes it replace the current answer.

A second failure lives in the same line. If the program stores the **unsquared** best distance but compares it with `delta * delta`, the two sides have different units. With the points above, the best distance would be $1$ and the plane square would be $1$, so equality still works by accident. Move the query to $(0.5, 0)$ and the best distance becomes $0.5$ while the plane square is $0.25$; the comparison `0.25 <= 0.5` keeps a subtree that is actually too far, which is merely slow. The dangerous direction is the reverse: a program that stores a squared distance but compares it with `delta` prunes too aggressively and returns a wrong answer. Keep both sides squared, and name the variables so the units are visible.

## Variants and extensions

- **Range search.** Store the bounding rectangle of every subtree. A query rectangle descends a node when its box intersects the query box, and reports every point inside. The expected cost in two dimensions is $O(\sqrt{n} + k)$ for $k$ reported points.
- **$k$ nearest neighbors.** Keep a max-heap of size $k$ instead of one best point. The prune compares the plane square with the largest distance in the heap, and a full heap makes the bound tighter as the search proceeds.
- **Dynamic K-D trees.** Insert a point as a leaf and rebuild a subtree when its size is too far from balanced, in the style of a scapegoat tree. This restores amortized logarithmic depth under insertions.
- **Bounding-box pruning.** Instead of testing only the splitting plane, test the query disk against the subtree's full rectangle. The test is stronger, especially for elongated rectangles, but it costs more arithmetic per node.
- **Three and more dimensions.** The same build alternates over the coordinates and the same prune uses the current axis. The number of visited nodes grows quickly with the dimension, which is the curse of dimensionality.
- **Closest pair by queries.** Build one tree over all points and query each point, ignoring the point itself. This is the K-D tree solution to [closest pair](/algorithms/geometry/closest-pair); it is simple and fast in practice, but the deterministic divide-and-conquer version has the better guarantee.
- **Orthogonal range counting.** Each node stores the size of its subtree. A rectangle query adds the size of a subtree when its box is entirely inside the query, descends when it intersects, and stops when it is disjoint.
- **Vantage-point trees and ball trees.** These partition by distance to a chosen point instead of by a coordinate, and they behave better in moderate dimensions.
- **The Voronoi diagram.** In the plane it answers nearest-neighbor queries in $O(\log n)$ worst case after $O(n \log n)$ preprocessing, at the cost of a much more complicated construction.
- **Quadtrees and R-trees.** A quadtree splits a square into four at every level, and an R-tree groups rectangles into larger rectangles. Both are spatial indexes with different balancing and update behavior.

## Contest strategy

1. **Decide whether the set is static.** If the points change, a static median-built tree is the wrong structure unless the problem allows a rebuild.
2. **Use squared distances.** A square root is never needed for a comparison, and it is a source of rounding errors near ties.
3. **Choose the type before writing the code.** With coordinates up to $10^{9}$, the squared distance needs a signed 64-bit integer; with coordinates up to $10^{7}$, a JavaScript `Number` is still exact.
4. **Build once.** The tree is preprocessing, not part of the per-query loop.
5. **Write the tie rule into the comparator.** If the statement says "lowest index", the query must update on equal distances and must not prune equality.
6. **Check the degenerate inputs early.** One point, duplicate points, all points on a line, a query equal to an input point, and $q = 0$.
7. **Compare against brute force.** On random small cases and on a set of identical points, the fast program and the double loop must agree. The identical-point case is the one that catches an over-eager prune.
8. **Watch the worst case.** A balanced tree does not guarantee a logarithmic query. If the input can be adversarial, consider a range tree or a different decomposition.
9. **Keep the recursion shallow.** The median build is logarithmic, but a dynamic variant or an accidental unbalanced build can overflow the stack.
10. **Do not optimize the build before measuring.** The per-node sort is usually fast enough up to $2 \times 10^{5}$ points in C++ and Java; `nth_element` is the first optimization if it is not.

## Worked problems

### Problem 1: the closest pair in a static set

**Restatement.** Given $n$ points and no queries, find the minimum squared Euclidean distance between two distinct points. The coordinates reach $10^{9}$ in absolute value, $n \le 2 \times 10^{5}$, and the input guarantees that the answer is an integer.

**Naive baseline.** Compare every pair, which is $O(n^{2})$ and about $2 \times 10^{10}$ pairs at the limit.

**Insight.** A closest pair is the minimum over all points of the distance to the nearest other point. Build one K-D tree and issue $n$ nearest-neighbor queries, ignoring the point itself.

**Derivation.** Build the tree over all points. For each index $i$, initialize the best distance to infinity and search for the nearest point; when the search reaches index $i$, skip that candidate rather than accepting a distance of zero. The answer is the smallest best distance over all $i$.

**Correctness.** Every pair is considered from both of its endpoints, and the nearest-neighbor query returns the true nearest point other than the query itself. The minimum over the $n$ queries is therefore the minimum over all pairs. The self-skip is the only change to the query, and it cannot remove the actual nearest neighbor because the points are distinct.

**Complexity.** $O(n \log^{2} n)$ to build and $O(n \log n)$ expected for the $n$ queries, with $O(n)$ memory. The deterministic divide-and-conquer solution has a better worst case; this version is shorter and is the one to try when the input is well distributed.

**Common wrong approach.** Forgetting to skip the query point itself. Every point is at distance zero from itself, so the program reports zero for every input with at least one point.

### Problem 2: closest pair under a uniform promise

**Restatement.** The input holds several test cases, each with up to $100000$ points whose coordinates have at most two decimals and lie in a bounded square. The points are independent and uniform. Output any closest pair, and stop at a test case beginning with $0$.

**Naive baseline.** The quadratic pair scan, which is too slow for $100000$ points but is a useful checker for small cases.

**Insight.** The uniform promise is exactly the condition under which the K-D tree's rectangles shrink quickly. Scaling the coordinates by $100$ makes them integers and makes the squared-distance comparisons exact.

**Derivation.** For each test case, read the points, scale each coordinate, build the tree, query every point for its nearest neighbor, and keep the pair with the smallest squared distance. Store the original two-decimal coordinates alongside the scaled integers so the winning pair can be printed without reconstructing it.

**Correctness.** The scaled squared distance is $10000$ times the original squared distance, so the ordering of pairs is unchanged. The nearest-neighbor query returns the closest other point, and the minimum over the queries is the closest pair.

**Complexity.** $O(n \log^{2} n)$ expected per test case with the per-node sort, $O(n \log n)$ expected with median selection, and $O(n)$ memory. The uniform promise is what makes the expected bound meaningful; the same tree can be linear on a hostile set.

**Common wrong approach.** Reusing the tree or the best pair from the previous test case. The tree stores indices into the previous point array, so a new case requires a complete rebuild and a reset of the answer.

### Problem 3: nearest rectangle in a shooting gallery

**Restatement.** There are $n$ axis-aligned rectangles in the shooting plane, each with a distinct $z$ coordinate. A shot at $(x,y)$ hits the rectangle of smallest $z$ that contains the point, and that rectangle is removed. Process $m$ shots and report the index of the rectangle hit by each shot, or $0$ if the shot hits nothing.

**Naive baseline.** For each shot, scan every remaining rectangle and keep the one with the smallest $z$ that contains the point. That is $O(nm)$, which is $10^{10}$ at the limits.

**Insight.** The rectangles are a set of two-dimensional boxes with a priority $z$. A point query asks for the minimum-priority box containing the point, and a hit deletes that box. A K-D tree over the boxes can store the minimum $z$ of each subtree and the bounding rectangle of each subtree, so a query can discard a whole subtree when the point is outside its box or when its minimum $z$ is already worse than the best hit.

**Derivation.** Build the tree over the rectangles, splitting at the median of the rectangle centers on the current axis, and store in every node the bounding box of its subtree and the minimum $z$ in it. A query descends a node when the point lies in the node's bounding box and the subtree's minimum $z$ is at most the best $z$ found so far. When the point lies in the target rectangle stored at the node, update the best answer. After a hit, set the rectangle's $z$ to infinity and repair the minimum on the path to the root; the bounding boxes can stay unchanged because deletion only removes area.

**Correctness.** The query examines every rectangle that can still beat the current best. A subtree is discarded only when the point is outside its bounding box, so no containing rectangle is lost, or when every $z$ in it is worse than the best, so no better hit is lost. The minimum over the examined rectangles is therefore the rectangle with the smallest $z$ that contains the shot.

**Complexity.** $O(n \log^{2} n)$ expected build with the per-node sort and $O(n \log n)$ with median selection, $O(\log n)$ expected per query on well-distributed boxes, $O(n)$ memory, and $O(\log n)$ repair per hit. The worst case is linear per query, which is why the problem is at the top of the platinum division.

**Common wrong approach.** Sorting the rectangles by $z$ and then scanning from the smallest $z$ for every shot. The order is right, but the scan is still linear per shot and the deletion does not reduce the cost enough.

## Practice progression

1. **Recognition.** Given a statement with points and queries, decide whether the set is static and whether the question is nearest neighbor, range search, or a single closest pair.
2. **Direct application.** Implement the build and the query for one point and verify the tree shape by hand on five points. Print the axis and the split coordinate of every node.
3. **Tie handling.** Add the lowest-index rule, then test a query at the midpoint of two points that straddle a split. Compare the strict and non-strict prune.
4. **Brute-force validation.** Write the double loop and compare it against the tree on hundreds of random small cases, including duplicate points and queries equal to input points.
5. **Adaptation.** Add a range-count query or a $k$-nearest query. For the range count, store subtree sizes and bounding boxes; for $k$ nearest, keep a heap of size $k$.
6. **Combination.** Solve [closest pair](/algorithms/geometry/closest-pair) with the tree and compare the answer and the running time against the divide-and-conquer version. Then build the dynamic version with scapegoat rebuilding, or replace the tree with a range tree and compare the worst-case behavior.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a node store, and which axis does it split on? (Formal model)
2. Why is the median chosen, and what does it guarantee about the depth? (Algorithm derivation)
3. Why does the far subtree lie entirely beyond the splitting line? (Key insight)
4. State the pruning inequality and prove that it is safe. (Formal model)
5. Why must the prune use `<=` rather than `<` when ties are broken by index? (Common mistakes)
6. Trace the build on the seven-point example and name the root, the two children and the four grandchildren. (Step-by-step execution)
7. Trace the query $(6,5)$ and say which subtrees are skipped. (Step-by-step execution)
8. Why is the build $O(n \log^{2} n)$ with a full sort and $O(n \log n)$ with median selection? (Complexity analysis)
9. Why can a query visit every node even when the tree is balanced? (Complexity analysis)
10. When is [closest pair](/algorithms/geometry/closest-pair) a better choice than a K-D tree? (Algorithm selection)

## Further reading

- The subject index places this technique beside the rest of [computational geometry](/algorithms/geometry/).
- The deterministic one-pair algorithm, with its strip and packing argument, is [closest pair](/algorithms/geometry/closest-pair).
- The structure that the plane sweep uses for its active set is described in [sweep line](/algorithms/geometry/sweep-line).
- The extreme-point reduction that answers many farthest-pair questions is [convex hull](/algorithms/geometry/convex-hull), and its linear-time pair scan is [rotating calipers](/algorithms/geometry/rotating-calipers).
- The binary search that solves the one-dimensional nearest-neighbor problem is in [binary search](/algorithms/searching/binary-search).
- The sorting that the build begins with, and the comparison bounds that the analysis uses, are in [sorting](/algorithms/foundations/sorting) and [complexity](/algorithms/foundations/complexity).
- The recursion that the build and the query use is described in [recursion](/algorithms/foundations/recursion).
- The one-dimensional prefix structure that answers offline orthogonal range counts is the [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The offline technique that answers many queries at once, which is the usual alternative when the queries can be reordered, is [parallel binary search](/algorithms/advanced/parallel-binary-search).
