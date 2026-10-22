---
id: geometry.closest-pair
title: Closest pair
summary: Find the two closest of a set of points in O(n log n) time by dividing the set in half and searching a narrow strip around the dividing line.
division: [gold, platinum]
subjects: [geometry]
level: advanced
importance: advanced-technique
keywords:
    [
        closest pair,
        divide and conquer,
        strip,
        packing argument,
        constant number of candidates,
        euclidean distance,
        squared distance,
        balanced splitting,
    ]
prerequisites:
    required: [geometry.convex-hull]
    recommended: [foundations.sorting, foundations.recursion, number-theory.modular-arithmetic]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The coordinates are integers, so that the squared distance is exact and can be compared without a square root.
    - The distance is the Euclidean distance and the problem says so.
reviewed: false
---

## At a glance

The closest pair of $n$ points can be found in $O(n \log n)$ time, which matches the cost of sorting, and the whole technique is one strip argument applied at every level of a divide and conquer.

| Property | Value |
| --- | --- |
| **Problem** | Find the two points of a set that are nearest to each other |
| **Split** | Sort by $x$, cut in half, solve each half, and merge |
| **Strip** | Width $\delta$ on each side of the dividing line, where $\delta$ is the smaller of the two answers |
| **Candidates** | At most seven per point, by a packing argument |
| **Time** | $O(n \log n)$ when the merge is linear, $O(n \log^2 n)$ when it re-sorts |
| **Auxiliary space** | $O(n)$ |
| **Requires** | The points sorted by $x$ |
| **Fails when** | The metric is not Euclidean, or the strip width is not updated after the merge finds a closer pair |

The last row is the one that produces a wrong answer rather than a slow one, and it is the subject of the failure section.

## Problem motivation

A radio tower wants to place a receiver in the densest region of a set of $n \le 10^5$ radio transmitters, and the densest region is the pair of transmitters that are closest to each other.

The naive baseline checks every pair. There are $\binom{n}{2}$ pairs, about $5 \times 10^9$ at $n = 10^5$, and each check is three subtractions, two multiplications and a comparison. The program runs for minutes.

The second baseline is a grid. Bucket the points into squares of side $L$, where $L$ is chosen to be the answer, and check each bucket against its neighbors. That is linear, but $L$ is the answer, so the bucket size is not known in advance, and choosing a size that is too large makes the buckets long and the algorithm quadratic in the worst case.

The divide and conquer removes the guess. Split the points in half, solve each half, and take the smaller of the two answers as a working distance $\delta$. The key observation is that a pair closer than $\delta$ can only exist in a narrow strip around the line where the set was split, and inside that strip the packing is so tight that only a constant number of points can be close to any given point.

The result is $O(n \log n)$, the same as sorting, and the constant is small. The whole point of the article is the packing argument that produces the constant.

## Recognition patterns

The closest pair is the right tool when the statement contains some of these phrases.

- "The closest pair", "the minimum distance between two points", "the nearest two".
- "The two points that are closest", "the minimum separation".
- "The densest cluster", "the smallest circle covering two of the points".
- "The distance to the nearest neighbor of each point".
- "Two antennas and interference", "a point and the closest of a set of obstacles".

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 10^5$ | The quadratic version is $5 \times 10^9$ pairs and is too slow |
| $n \le 2000$ | The quadratic version is fast enough and is the reference implementation |
| The points are already sorted by $x$ | The sort is free and the algorithm is $O(n \log n)$ |
| The points come in a random order | The sort is $O(n \log n)$ and the algorithm is still $O(n \log n)$ |
| The metric is the Manhattan distance or the Chebyshev distance | The strip argument needs a different form, and the constant changes |
| The coordinates reach $10^9$ | The squared distance reaches $2 \times 10^{18}$ and needs a 64-bit type |
| The coordinates reach $10^{18}$ | The squared distance does not fit in 64 bits and needs a 128-bit type |
| Many queries, each asking for the nearest neighbor of one point | The divide and conquer answers all of them in the same $O(n \log n)$ |
| The points are in three dimensions | The same algorithm works with a wider strip and a larger constant |

The third row is worth remembering. A problem that hands over the points in $x$-sorted order is telling you that the sort is not the interesting part.

## Naive approach

The baseline is the double loop.

```python
def closest_pair_quadratic(points):
    best = float("inf")
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            d = (points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2
            if d < best:
                best = d
    return best
```

This is correct and it is the reference implementation for a differential test. It is $O(n^2)$ time and $O(1)$ space, and it is the right answer when $n$ is small.

The second baseline is the grid with a guessed bucket size, which is linear in the average case and quadratic in the worst case. It is worth naming because it is the right answer for a problem where the points are uniformly distributed and the answer is known approximately in advance.

## Key insight

The insight is that **a pair closer than $\delta$ can only be near the line where the set was split, and the strip around that line is so crowded that only a constant number of points can compete.**

Take the set of points, sorted by $x$, and cut it in half with a vertical line at $x = L$. Solve the left half and the right half recursively, and let $\delta$ be the smaller of the two answers.

Now consider a pair $(a, b)$ with $a$ in the left half and $b$ in the right half, and with $|a - b| < \delta$. Since $a_x \le L \le b_x$ and $|a - b| < \delta$, the horizontal distance $b_x - a_x$ is less than $\delta$, so $a$ is within $\delta$ of the line on the left and $b$ is within $\delta$ of the line on the right. **Both points are in the strip.**

The second part of the insight is a packing argument. Inside the strip, split the region around a point $p$ into squares of side $\delta/2$. Two points in the same square are at distance at most $\delta/\sqrt{2} < \delta$, and they are in the same half of the split, so by the definition of $\delta$ they must be at distance at least $\delta$. Contradiction. So each square holds at most one point.

The strip is $2\delta$ wide, so it is four columns of squares of side $\delta/2$, and the region of the strip within a vertical distance $\delta$ of $p$ is two rows of such squares. That is eight squares, so at most eight points of the strip are within a vertical distance $\delta$ of $p$. One of them is $p$ itself, so **at most seven candidates**.

Seven is a constant, and that is the entire reason the algorithm is $O(n \log n)$ rather than $O(n \log n)$ times a factor of $n$.

The third insight is that **the answer can only improve, so the strip width can be shrunk as the scan proceeds.** If a closer pair is found while scanning the strip, the strip narrows and fewer points remain in it. This is an optimization, and it is also the source of the most common bug.

## Formal model

Let $S$ be a set of $n$ points in the plane.

<MathPanel type="definition" title="Definition">
For a finite set $S$, the **closest pair distance** is
$$
\delta(S) = \min_{\{a, b\} \subseteq S} |a - b|,
$$
and a **closest pair** is a pair attaining it. The **split** of $S$ at
$x = L$ divides it into $S_{\text{left}} = \{p \in S : p_x \le L\}$ and
$S_{\text{right}} = \{p \in S : p_x > L\}$. The **strip** at $L$ with width
$\delta$ is the set of points with $|p_x - L| \le \delta$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $S$ be split at $x = L$, let $\delta = \min(\delta(S_{\text{left}}),
\delta(S_{\text{right}}))$, and let $(a, b)$ be a pair with $a$ in the left
half, $b$ in the right half and $|a - b| < \delta$. Then both $a$ and $b$
lie in the strip at $L$ with width $\delta$.
</MathPanel>

<MathPanel type="proof" title="Proof">
The distance satisfies $|a - b| \ge |a_x - b_x| = b_x - a_x$, because the
horizontal difference is one of the two components of the distance. Hence
$b_x - a_x < \delta$. Since $a_x \le L \le b_x$, it follows that
$a_x > b_x - \delta \ge L - \delta$ and $b_x < a_x + \delta \le L + \delta$.
So $L - \delta < a_x$ and $b_x < L + \delta$, and both points are in the
strip. $\square$
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $p$ be a point of the strip, and consider the part of the strip whose
$y$-coordinate is within $\delta$ of $p_y$. It contains at most eight
points of $S$, one of which is $p$, so at most seven of them are closer to
$p$ than $\delta$.
</MathPanel>

<MathPanel type="proof" title="Proof">
The region in question is a rectangle of width $2\delta$ and height
$\delta$. Divide it into eight squares of side $\delta/2$, four across and
two down. Each square lies entirely in one half of the split, because the
splitting line is one of the four vertical boundaries of the squares.

Suppose two points $u$ and $v$ of $S$ lie in the same square. Their horizontal separation is at most $\delta/2$ and their vertical separation is at most $\delta/2$, so their distance is at most $\sqrt{(\delta/2)^2 + (\delta/2)^2} = \delta/\sqrt{2} < \delta$. But they are in the same half, and every pair of points in the same half is at distance at least $\delta$, by the definition of $\delta$ as the smaller of the two closest pair distances. This is a contradiction, so each square contains at most one point. There are eight squares, so there are at most eight points in the region. $\square$
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At the start of the merge for the split at $x = L$, the value `best` is the
squared closest pair distance of the two halves, and the strip is defined by
$|p_x - L| \le \sqrt{\text{best}}$. Every time `best` is reduced, the strip
narrows, so the invariant that `best` is the squared distance of the
closest pair found so far, and that the strip contains every point that
could still form a closer pair, is preserved.
</MathPanel>

## Algorithm derivation

The recursion returns the points sorted by $y$, so that the merge step is linear.

```python
def closest_pair(points_by_x):
    n = len(points_by_x)
    if n <= 3:
        best = brute_force(points_by_x)
        return best, sorted(points_by_x, key=lambda p: p[1])
    mid = n // 2
    left = points_by_x[:mid]
    right = points_by_x[mid:]
    best_left, left_by_y = closest_pair(left)
    best_right, right_by_y = closest_pair(right)
    best = min(best_left, best_right)
    merged = merge_by_y(left_by_y, right_by_y)
    strip = [p for p in merged if abs(p[0] - split_line) <= math.sqrt(best)]
    for i in range(len(strip)):
        for j in range(i + 1, min(i + 8, len(strip))):
            d = dist2(strip[i], strip[j])
            if d < best:
                best = d
    return best, merged
```

Three things make it work.

The **base case** handles at most three points by brute force and returns them sorted by $y$. The sort in the base case is what makes the whole recursion return a $y$-sorted list.

The **merge** is the ordinary merge of two sorted lists, and it is what keeps the total time at $O(n \log n)$ rather than $O(n \log^2 n)$. A version that sorts the merged list from scratch at every level is still correct and is still fast enough for most contests, and it is the version to write when the merge is easy to get wrong.

The **inner loop** runs over the next seven points of the strip in $y$-order, which is exactly the constant that the packing argument produced. The `min(i + 8, len(strip))` bound is the seven.

The squared distance is compared throughout, and the square root is taken only when the strip width is needed, and only for the comparison with the $x$-coordinate.

## Step-by-step execution

Take six points, already sorted by $x$: $P_0 = (0,0)$, $P_1 = (1,6)$, $P_2 = (2,1)$, $P_3 = (3,0)$, $P_4 = (4,5)$, $P_5 = (5,1)$.

**The split.** The dividing line is at $x = 2.5$. The left half is $\{P_0, P_1, P_2\}$ and the right half is $\{P_3, P_4, P_5\}$.

**The recursive answers.** In the left half the three distances are $\sqrt{37}$, $\sqrt{5}$ and $\sqrt{26}$, so $\delta_{\text{left}} = \sqrt{5}$ with the pair $P_0, P_2$. In the right half they are $\sqrt{26}$, $\sqrt{5}$ and $\sqrt{17}$, so $\delta_{\text{right}} = \sqrt{5}$ with the pair $P_3, P_5$.

The working distance is $\delta = \sqrt{5}$, about $2.236$.

**The strip.** The strip is $|x - 2.5| \le 2.236$, that is, $0.264 \le x \le 4.736$. The points $P_0$ at $x = 0$ and $P_5$ at $x = 5$ are outside it. The strip holds $P_1 = (1,6)$, $P_2 = (2,1)$, $P_3 = (3,0)$ and $P_4 = (4,5)$, and sorted by $y$ that is $P_3, P_2, P_4, P_1$.

**The scan.** For $P_3$, the next points in $y$-order are $P_2$, $P_4$ and $P_1$. The distance to $P_2$ is $\sqrt{(3-2)^2 + (0-1)^2} = \sqrt{2} \approx 1.414$, which is smaller than $\delta$, so the answer becomes $\sqrt{2}$ and the strip narrows to $|x - 2.5| \le 1.414$. The distance to $P_4$ is $\sqrt{(4-3)^2 + (5-0)^2} = \sqrt{26}$, and the distance to $P_1$ is $\sqrt{40}$; both are larger than $\sqrt{2}$.

For $P_2$, the next points in $y$-order are $P_4$ and $P_1$, at distances $\sqrt{20}$ and $\sqrt{26}$, both larger. The remaining points have no partner left to check.

**The answer.** The closest pair is $P_2 = (2,1)$ and $P_3 = (3,0)$, at distance $\sqrt{2}$.

Notice that the closest pair straddles the dividing line at $x = 2.5$, so it was found by the merge and not by either recursive call. Both halves reported $\sqrt{5}$, and the cross pair improved the answer to $\sqrt{2}$. This is exactly the case that the strip exists to catch, and a program that only compares the two recursive answers reports $\sqrt{5}$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The divide and conquer algorithm returns the closest pair of a set of
points.
</MathPanel>

<MathPanel type="proof" title="Proof">
**The invariant.** At every level of the recursion, the call returns the
closest pair of its set and the set sorted by $y$.

**The base case.** For at most three points the brute force examines every pair, so the closest pair is found, and the list is sorted by $y$ before it is returned.

**The induction step.** Assume the recursive calls are correct. The value `best` is then the squared closest pair distance within the left half or within the right half, whichever is smaller. By the first lemma, any pair with one point in each half and squared distance less than `best` has both of its points in the strip, so the merge only has to look inside the strip.

By the second lemma, at most seven points of the strip are within a vertical distance of $\delta$ of any given point, and every pair closer than $\delta$ has a vertical separation of less than $\delta$. The strip is sorted by $y$, so the partners of a point are among the next seven points of the strip in that order, and the inner loop examines all of them. The number seven is exactly the bound from the lemma, so no candidate is missed.

The scan therefore finds the smallest squared distance among all the pairs of the strip, and combined with `best` from the two halves, which covers every pair inside a half, the result is the closest pair of the whole set.

The merge of the two $y$-sorted halves is $y$-sorted, so the invariant is preserved. $\square$
</MathPanel>

## Complexity analysis

Let $n$ be the number of points.

- **Sorting by $x$:** $O(n \log n)$ time and $O(n)$ space, done once.
- **Each level of the recursion:** $O(n)$ time. The merge is linear, the strip is built by one pass over the merged list, and the inner loop performs at most $7n$ distance computations.
- **The recursion has $O(\log n)$ levels**, so the total is $O(n \log n)$ time.
- **Auxiliary space:** $O(n)$, dominated by the lists that the recursion holds alive. A version that returns the $y$-sorted list and does not keep the $x$-sorted one at every level uses $O(n)$ as well, because the recursion's total live memory is $n + n/2 + n/4 + \cdots = 2n$.

The comparison that matters is:

| Version                                                 | Time            |
| ------------------------------------------------------- | --------------- |
| The quadratic double loop                               | $O(n^2)$        |
| Divide and conquer, re-sorting the strip at every level | $O(n \log^2 n)$ |
| Divide and conquer, merging the halves by $y$           | $O(n \log n)$   |

The second row is correct and is often what people write first, because sorting a list is one line. The third row is the one to write in a contest where the time limit is tight.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The closest pair of a point set | The divide and conquer algorithm |
| The closest pair of a small set | The quadratic double loop |
| The nearest neighbor of every point | The same recursion, with the answer kept per point |
| The $k$ closest pairs | The divide and conquer plus a heap of size $k$ |
| The closest pair in three dimensions | The same algorithm with a wider strip and a larger constant |
| The closest pair between two different sets | Two sweeps, or the divide and conquer with a bichromatic merge |
| Many queries for the nearest neighbor of a query point | The divide and conquer, with a query at each level |
| The pair that is farthest apart | The [convex hull](/algorithms/geometry/convex-hull) and the [rotating calipers](/algorithms/geometry/rotating-calipers) |
| The smallest circle covering the points | A different problem, with a randomized algorithm |

The eighth row is the one that catches people. The farthest pair is a hull question and the closest pair is not, and a program that computes the hull and then looks for the closest pair of hull vertices is wrong whenever the closest pair involves an interior point.

## Recursion decision

The recursion here is the point of the algorithm, and it is a balanced one.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Recursive; the depth is at most $\lceil \log_2 n \rceil$, which is $17$ for $n = 10^5$ |
| Java | About $10^4$ frames | Recursive |
| Python | The interpreter limit of 1000 | Recursive; the depth is at most $17$, so the limit is never reached |
| Pascal | The operating system stack | Recursive |
| JavaScript | About $10^4$ frames | Recursive |

The depth is $\lceil \log_2 n \rceil$ because the set is halved at every level, so the recursion is safe in every language, and it is the one algorithm in this subject where that is worth saying out loud.

The space is the thing to think about instead. A recursive version that keeps the $x$-sorted list alive at every level uses $O(n \log n)$ space, because each level holds a copy of its slice. The version that passes slices of one shared array, or that returns the $y$-sorted list and lets the $x$-sorted one be released, uses $O(n)$.

The language choice does matter for one thing: in Python, a recursive solution with a helper for the merge is noticeably slower than the iterative version, because every call frame costs more than a loop iteration. For $n = 10^5$ the difference is a factor of two or three, which is usually worth caring about.

## Implementation walkthrough

Three lines decide whether the algorithm is right.

```python
strip = [p for p in merged if abs(p[0] - split_line) <= math.sqrt(best)]
```

The strip must be built from the **current** `best`, not from the value that `best` had when the strip was first computed. If a closer pair is found during the scan, the strip should narrow, and a program that keeps the old width still finds the right answer but does more work than it needs to. A program that uses the old width as a lower bound on the distance to check is also correct, and is the safer form: check `dist2 < best` rather than relying on the strip to have the right width.

```python
for j in range(i + 1, min(i + 8, len(strip))):
```

The bound of eight is the seven candidates plus the point itself. Checking only the next six is a common off-by-one, and it fails on configurations where eight points sit in the strip within a vertical distance of $\delta$, which is exactly the configuration that the packing argument says is possible.

```python
if d < best:
    best = d
```

The comparison uses the squared distance, and `best` is a squared distance throughout. Mixing a squared distance with an unsquared one is a bug that produces an answer that is roughly a square root of the right one, and it is not obvious from the output.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the squared distance against an unsquared $\delta$ | The comparison is wrong and pairs are missed | Keep `best` squared throughout |
| Checking the next six points instead of seven | A closer pair is missed in the crowded case | Use seven |
| Building the strip with the old width after finding a closer pair | The answer is right but the work is wasted | Rebuild the strip when `best` shrinks |
| Not checking the pairs that cross the dividing line | The answer is the closest pair within a half, which may be too large | The strip scan is the merge step |
| Dividing the set arbitrarily rather than by $x$ | The strip argument does not apply and the answer may be wrong | Sort by $x$ and split at the median |
| Comparing the unsquared distances with a square root each time | It is slow and it is less exact | Compare the squares |
| Forgetting the base case, and letting a one-point set reach the merge | A crash or a wrong answer | Handle at most three points by brute force |
| Using a floating point square root for the strip width | A point on the boundary is excluded or included by rounding | Compare the squared horizontal distance against `best` |

### Why this fails: the pair that is adjacent in $x$ but not close

The plausible wrong approach is to argue that the closest pair must be adjacent in the $x$-sorted order, so it is enough to check the $n-1$ consecutive pairs. The argument sounds right: a pair that is close has a small horizontal separation, and any point between them in $x$ would be even closer to one of them. The argument is false because the point between them in $x$ can be far away in $y$.

The smallest counterexample is three points: $A = (0,0)$, $B = (1,10)$ and $C = (2,0)$. Sorted by $x$ the order is $A, B, C$, and the consecutive pairs are $(A, B)$ and $(B, C)$, each at distance $\sqrt{101}$, about $10.05$. The true closest pair is $(A, C)$, at distance $2$. The program reports $\sqrt{101}$ where the answer is $2$, which is wrong by a factor of five.

Two points is not enough to expose the bug, because with two points the only pair is both the consecutive pair and the closest pair. Three is the smallest number of points at which a point can sit between two close points in the $x$-order while being far from both of them in the plane, and the example above is the smallest such configuration.

The second failure in the same area is the strip width. The plausible approach is to compute the strip once, using the $\delta$ that came out of the recursion, and to scan it once. That is correct, provided the scan updates $\delta$ as it goes and the strip is not rebuilt. The failure comes from the version that computes the strip with the recursive $\delta$ and then uses the updated $\delta$ as the width of the candidate list without re-filtering: the candidate list then contains points that are farther away than the new $\delta$, and the constant of seven no longer holds, because the packing argument used the old, larger $\delta$. The symptom is a program that is correct on random inputs and occasionally wrong on inputs with a very uneven spread.

The lesson generalizes: **the packing argument is only valid with respect to the distance that was used to define the packing.** The same care is needed in the [rotating calipers](/algorithms/geometry/rotating-calipers) sweep, where the monotone pointer is only monotone with respect to the convexity of the polygon, and in the [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) formula, where each term has to be counted with the weight that the argument assigned to it.

## Variants and extensions

- **The nearest neighbor of every point.** Run the same recursion and, at every level, use the strip to update the answer for the points in that half. The result is the nearest neighbor of every point in $O(n \log n)$.
- **The $k$ closest pairs.** Keep a heap of size $k$ of the best pairs found, and in the strip compare each point against the next $2k$ points rather than the next seven. The time is $O(n \log n + k \log k)$.
- **Three dimensions.** The same algorithm with a strip of width $\delta/\sqrt{3}$ and a constant of about $15$ candidates, because the packing region becomes a cube.
- **A randomized grid.** Hash the points into a grid of side $\delta$ and examine the nine cells around each point, shrinking $\delta$ as the answer improves. The expected time is $O(n)$, and the randomness is what makes the expected bound hold.
- **A sweep line version.** The [sweep line](/algorithms/geometry/sweep-line) technique answers the same problem, with a set of the recent points ordered by $y$ and a shrinking threshold.
- **The Manhattan metric.** The strip argument still works, with a square instead of a circle and a different constant, because the same packing bound holds for the $L_1$ ball.
- **A decision version.** "Is there a pair at distance less than $d$?" is the same algorithm with the strip width fixed at $d$, and it is the question that packing bounds are usually asked for.
- **The closest pair between two sets.** Run the algorithm on the union and discard the pairs that lie within one set, or use a bichromatic variant whose merge only compares the cross pairs.

## Contest strategy

1. Sort by $x$ once, at the top. The recursion assumes the input is sorted, and sorting inside the recursion is a common source of confusion.
2. Keep the squared distance throughout, and take the square root only for the output.
3. Use the seven-candidate bound, and check the next seven points, not six.
4. Rebuild the strip when the answer improves, or check the distance explicitly against the current best so that the width does not matter.
5. Return the $y$-sorted list from the recursion and merge the halves. It is the difference between $O(n \log n)$ and $O(n \log^2 n)$.
6. Write the quadratic version first and use it as the reference. The two must agree on every random set, and a disagreement is a constant that is off by one.
7. Size the type for the squared distance. With coordinates of magnitude $10^9$ the square reaches $2 \times 10^{18}$, and with larger coordinates a 128-bit type is needed.

## Worked problems

### Problem 1: the closest pair

**Restatement.** Given $n \le 10^5$ points, report the squared distance between the closest two of them, and the pair.

**Naive baseline.** The quadratic double loop, $O(n^2)$ time.

**Insight.** A pair closer than $\delta$ lies in the strip around the dividing line, and at most seven points of the strip can compete with any given point.

**Derivation.** Sort by $x$, recurse on the two halves, take the smaller answer as $\delta$, merge the halves by $y$, filter the strip, and scan each point against the next seven.

**Correctness.** The theorem above proves that the scan examines every pair that could improve the answer, and the two lemmas prove that such a pair is in the strip and within seven positions of its partner.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Checking only the consecutive pairs in the $x$-sorted order, which misses the answer on the three-point counterexample.

### Problem 2: the $k$ closest pairs

**Restatement.** Given $n$ points and an integer $k$, report the $k$ smallest pairwise distances, in increasing order.

**Naive baseline.** The quadratic enumeration of all pairs, keeping the $k$ smallest, which is $O(n^2 \log k)$.

**Insight.** The strip argument generalizes: if there are $k$ pairs closer than $\delta$, the packing gives a constant of about $2k$ candidates per point rather than seven.

**Derivation.** Run the divide and conquer with a heap of size $k$ that holds the best pairs found so far. In the strip, compare each point against the next $2k$ points in $y$-order, and insert a pair into the heap when it is better than the largest pair in the heap.

**Correctness.** The same argument as Problem 1, with the packing bound replaced by the observation that the $k$ closest pairs are all within a strip of width equal to the $k$-th smallest distance, and the constant doubling because each point can have a partner above and below it.

**Complexity.** $O(n \log n + k \log k)$ time and $O(k)$ extra space beyond the recursion's $O(n)$.

**Common wrong approach.** Using the constant seven from the $k = 1$ case, which misses pairs when $k$ is large.

### Problem 3: the nearest neighbor of every point

**Restatement.** Given $n$ points, report for each point the distance to its nearest neighbor.

**Naive baseline.** The quadratic double loop, recording the answer for both endpoints of every pair, which is $O(n^2)$.

**Insight.** The same recursion answers all the queries at once, because the nearest neighbor of a point is either in the same half, which the recursive call already knows, or across the dividing line, which the strip scan finds.

**Derivation.** The recursion returns, in addition to the closest pair distance, the nearest neighbor of every point in its set. At each level, after the strip scan, every point in the strip updates its answer using the candidates in the strip, and the points that were already resolved in the recursive calls keep their answers.

**Correctness.** The nearest neighbor of a point is at most the closest pair distance of its half, so it is either inside the half, where the recursive call found it, or across the line, where the strip lemma applies.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, against $O(n^2)$.

**Common wrong approach.** Running the closest pair algorithm once per point, which is $O(n^2 \log n)$ and does not reuse any work.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about the closest pair, the nearest neighbor of each point, or the $k$ closest pairs, and write down the metric.
2. **Direct application.** Implement the divide and conquer with the seven-candidate scan, and check it against the quadratic version on random sets of up to $200$ points.
3. **Adaptation.** Write the version that returns the nearest neighbor of every point, the version for the $k$ closest pairs, and the version for the decision problem with a fixed threshold.
4. **Combination.** Combine the strip argument with the [rotating calipers](/algorithms/geometry/rotating-calipers) for the farthest pair, and with the [sweep line](/algorithms/geometry/sweep-line) for the offline version.
5. **Challenge.** Solve the problem in three dimensions, where the strip is wider and the constant is larger, and check the answer against the quadratic version.
6. **Transfer.** Recognize the technique in another subject: the closest pair of a set of numbers, the minimum gap in a sorted array, the closest pair of intervals, and the "does any two overlap" question that the sweep line answers.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the strip lemma and prove it. (Formal model)
2. State the packing lemma and prove it. (Formal model)
3. Where does the constant seven come from? (Key insight)
4. What invariant does the merge maintain, and what happens when the answer improves? (Formal model)
5. Why does the algorithm sort by $x$ before splitting? (Algorithm derivation)
6. Why is the merge by $y$ needed, and what does it cost to skip it? (Complexity analysis)
7. Give the smallest counterexample to the consecutive-in-$x$ rule. (Common mistakes)
8. What is the depth of the recursion, and is the stack ever a problem? (Recursion decision)
9. Why is the squared distance compared rather than the distance? (Implementation walkthrough)
10. How many candidates does the scan need in the $k$-closest-pairs version, and why? (Variants and extensions)
11. Why is the closest pair not a hull question? (Algorithm selection)
12. What type does the squared distance need? (Complexity analysis)

## Further reading

- The convex hull that answers the farthest-pair question, which this article deliberately does not use, is in [convex hull](/algorithms/geometry/convex-hull).
- The rotating calipers that answer the farthest-pair question in linear time, is in [rotating calipers](/algorithms/geometry/rotating-calipers).
- The sweep line that answers the same problem in a different way, and the active set that it maintains, are in [sweep line](/algorithms/geometry/sweep-line).
- The sorting that the algorithm begins with is in [sorting](/algorithms/foundations/sorting).
- The recursion whose depth and space this algorithm's recursion is measured against is in [recursion](/algorithms/foundations/recursion).
- The subject index lists this technique, [closest pair](/algorithms/geometry/closest-pair), beside the geometry it does not yet cover: [the computational geometry](/algorithms/geometry/).
