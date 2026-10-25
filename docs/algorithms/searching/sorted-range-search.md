---
id: searching.sorted-range-search
title: Search over a sorted range of indices
summary: Locate the interval that contains a point by halving a sorted array of disjoint intervals, or prove that no interval does.
division: [bronze, silver]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords: [binary search, interval containment, sorted intervals, boundary search, point location]
prerequisites:
    required: [searching.binary-search, foundations.complexity]
    recommended: [foundations.sorting]
complexity:
    time: "O(log n)"
    space: "O(1)"
assumptions:
    - The intervals are sorted by their left endpoint.
    - The intervals are pairwise disjoint, so at most one of them contains a given point.
implementations: searching.sorted-range-search
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/searching.sorted-range-search.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Given sorted disjoint intervals and a point, return the index of the interval that contains the point |
| **Time** | $O(\log n)$ |
| **Auxiliary space** | $O(1)$ beyond the input |
| **Requires** | Intervals sorted by left endpoint, and pairwise disjoint |
| **Fails when** | The intervals overlap, are unsorted, or the endpoints are compared with the wrong inclusion |
| **Primary technique** | Halving an index range, driven by two monotone comparisons |
| **Implementations** | Six languages, one program each, sharing a stdin/stdout contract |

The problem is a point-location problem, not a value-search problem. The data are ranges, the query is a point, and the answer is the index of the range that owns the point.

## Problem motivation

A file system stores blocks on a disk, a calendar stores reservations, and a router stores address ranges. Each of these services holds a sorted list of disjoint ranges and answers the same question millions of times: "which range contains this value?"

The ranges arrive already sorted by their left endpoint, and no two of them overlap. The list is long enough that a scan per query is too slow, and the values at the endpoints are large enough that an implicit table indexed by value is impossible. The only exploitable structure is the order of the ranges.

Two details separate this problem from the ordinary binary search over an array of values.

- The array element is a **pair**, so a comparison has to decide against both endpoints.
- The answer is a **range index**, not a value, and the point may fall in a gap between two ranges.

The second detail is the reason the output includes $-1$. A search that only locates the nearest endpoint would happily return a range that does not contain the point; the algorithm has to be able to say "none".

## Recognition patterns

The technique applies when all of the following hold.

- The data are **intervals** $[l_i, r_i]$, not single values.
- The intervals are **sorted by left endpoint**, so $l_0 \le l_1 \le \cdots \le l_{n-1}$.
- The intervals are **disjoint**, so at most one contains a given point. If the input may overlap, merge it first or use an interval tree.
- Each query is a **point**, and the answer is the index of the containing interval, or a negative sentinel.
- Both endpoints count as inside, unless the problem explicitly says otherwise.

The third condition is the one that is easy to overlook. Sorting is not enough. A list of overlapping intervals can be sorted and still defeat the halving argument, because a discarded half may contain a longer interval that reaches the point.

## Naive approach

The baseline is a scan over all intervals.

```cpp
int scan(const std::vector<std::pair<long long, long long>>& intervals, long long point)
{
    for (int i = 0; i < static_cast<int>(intervals.size()); ++i) {
        if (intervals[i].first <= point && point <= intervals[i].second) {
            return i;
        }
    }
    return -1;
}
```

The scan is $O(n)$ per query and it is correct whether or not the intervals are sorted, as long as it returns the first match. It is the right answer when the list is short or when the queries are few.

It is also the reference implementation for testing. Run the scan and the halving search on the same random input; a disagreement is a counterexample, and the scan is usually the one that is right.

With $q$ queries, the scan costs $O(nq)$. For $n = q = 10^5$ that is $10^{10}$ comparisons, which is far outside a contest time limit.

## Key insight

The midpoint interval splits the search space in two, and disjointness proves that one side is irrelevant.

Suppose the current interval of candidate indices is $[lo, hi]$ and $mid$ is its midpoint.

- If $point < l_{mid}$, then every interval at or after $mid$ starts at or after $l_{mid}$, so none of them can contain the point. Discard $[mid, hi]$.
- If $point > r_{mid}$, then every interval at or before $mid$ ends at or before $r_{mid}$, so none of them can contain the point. Discard $[lo, mid]$.
- Otherwise $l_{mid} \le point \le r_{mid}$, and the midpoint interval is the answer.

The second case is where disjointness does its work. Without it, an earlier interval could extend past $r_{mid}$ and still contain the point, so discarding the left half would be unsound.

The same idea has a second form that is often simpler to write. The predicate $l_i \le point$ is monotone, because the left endpoints are sorted. A boundary search finds the last index $i$ with $l_i \le point$, and one extra comparison $point \le r_i$ confirms or rejects it. Both forms use one binary search; the three-way form reads both endpoints at every step, while the boundary form reads only left endpoints until the final check.

## Visual intuition

Draw the intervals as horizontal bars on a number line, ordered from top to bottom by their left endpoint. The current candidate bars are the ones between two horizontal cut lines. A point is a vertical line through the picture.

- If the vertical line falls to the left of the midpoint bar, the cut moves up: every bar below starts even farther right.
- If the line falls to the right of the midpoint bar, the cut moves down: every bar above ends even farther left.
- If the line crosses the midpoint bar, the bar is the answer.

The picture also shows the failure mode. With overlapping bars, the vertical line can cross an early, long bar while a later, short bar starts before the line and ends before it. A comparison against the short bar would discard the long one.

## Formal model

Let the input be a sequence of intervals $I_i = [l_i, r_i]$ for $0 \le i < n$, with

$$
l_i \le r_i \quad \text{and} \quad r_i < l_{i+1}
$$

for every valid $i$. The strict inequality between $r_i$ and $l_{i+1}$ is what "disjoint" means for closed integer intervals. Adjacent intervals such as $[1, 3]$ and $[4, 6]$ are allowed; the point $3$ belongs only to the first, and $4$ belongs only to the second.

::: math definition Definition
An interval $I_i$ contains a point $x$ when $l_i \le x \le r_i$. The answer for $x$ is the unique index $i$ with $l_i \le x \le r_i$, or $-1$ when no such index exists.
:::

::: math lemma Lemma
At most one interval contains a given point.
:::

::: math proof Proof
Suppose $i < j$ and both intervals contain $x$. Then $r_i \ge x$ and $l_j \le x$. But disjointness gives $r_i < l_j$, so $r_i < l_j \le x \le r_i$, a contradiction. Therefore no two intervals contain the same point. $\square$
:::

The lemma is what makes the answer well defined. It also means a search only has to find one candidate index; there is never a tie to break.

::: math definition Definition
The predicates used by the search are

$$
P(i) = (x < l_i), \qquad Q(i) = (r_i < x).
$$

Both are **monotone**: $P$ is true on a prefix and false on a suffix, while $Q$ is false on a prefix and true on a suffix.
:::

## Algorithm derivation

Maintain an inclusive index range $[lo, hi]$ and the invariant

$$
\text{if an interval contains } x, \text{ its index lies in } [lo, hi].
$$

Start with $[0, n-1]$, which contains every index. At each iteration:

1. If $lo > hi$, the candidate range is empty and the answer is $-1$.
2. Compute $mid = lo + \lfloor (hi - lo)/2 \rfloor$.
3. If $x < l_{mid}$, set $hi \gets mid - 1$.
4. Else if $x > r_{mid}$, set $lo \gets mid + 1$.
5. Else return $mid$.

The first comparison discards the midpoint and everything after it. The second discards the midpoint and everything before it. The final case returns the midpoint because it satisfies both endpoint inequalities.

The range shrinks by at least one element per iteration, and in fact roughly by half. That is the source of the logarithmic bound.

The midpoint is written as $lo + \lfloor (hi - lo)/2 \rfloor$ rather than $\lfloor (lo + hi)/2 \rfloor$. The two are equal for small indices, but the second can overflow a signed 32-bit integer when both indices are large. Computing the difference first keeps every intermediate value within the range of an index.

## Step-by-step execution

Use the intervals

$$
[1, 3],\ [5, 7],\ [10, 12],\ [20, 20]
$$

and query $x = 11$.

| Iteration | $lo$ | $hi$ | $mid$ | $I_{mid}$  | Comparison         | Next range |
| --------- | ---- | ---- | ----- | ---------- | ------------------ | ---------- |
| 1         | 0    | 3    | 1     | $[5, 7]$   | $11 > 7$           | $[2, 3]$   |
| 2         | 2    | 3    | 2     | $[10, 12]$ | $10 \le 11 \le 12$ | return $2$ |

Query $x = 4$ exercises the gap between the first two intervals.

| Iteration | $lo$ | $hi$ | $mid$ | $I_{mid}$ | Comparison | Next range |
| --------- | ---- | ---- | ----- | --------- | ---------- | ---------- |
| 1         | 0    | 3    | 1     | $[5, 7]$  | $4 < 5$    | $[0, 0]$   |
| 2         | 0    | 0    | 0     | $[1, 3]$  | $4 > 3$    | $[1, 0]$   |

The range is now empty, so the result is $-1$.

Query $x = 20$ lands exactly on the last interval, which is a single point. The first comparison sends the range to $[2, 3]$, the second sends it to $[3, 3]$, and the third returns $3$.

On an empty list, $lo = 0$ and $hi = -1$ at the start, so the loop never runs and the result is $-1$ immediately. That case deserves a place in the test set, because it is the only one where the midpoint is never computed.

## Correctness proof

::: math theorem Theorem
The iterative procedure returns the unique index of the interval that contains $x$, or $-1$ when no interval contains $x$.
:::

::: math proof Proof
The invariant is that every containing interval has an index in $[lo, hi]$. It holds initially because $[0, n-1]$ contains every index.

Suppose it holds at the start of an iteration, and let $mid$ be the midpoint.

- If $x < l_{mid}$, then for every $j \ge mid$ we have $l_j \ge l_{mid} > x$, so no such $j$ can satisfy $l_j \le x$. Every containing interval therefore lies in $[lo, mid-1]$, which is the new range.
- If $x > r_{mid}$, then for every $j \le mid$ we have $r_j \le r_{mid} < x$, so no such $j$ can satisfy $x \le r_j$. Every containing interval therefore lies in $[mid+1, hi]$, which is the new range.
- Otherwise $l_{mid} \le x \le r_{mid}$, so $mid$ is a containing index. By the uniqueness lemma it is the only one, and the procedure returns it.

The invariant is preserved in every case. The range strictly shrinks, so the loop terminates. If it terminates because $lo > hi$, the invariant says that any containing interval would lie in an empty range, so none exists and returning $-1$ is correct. $\square$
:::

The proof uses disjointness twice: in the second case, to know that earlier intervals cannot reach past $r_{mid}$, and in the third case, to know that the midpoint is the only answer rather than merely one answer.

## Complexity analysis

Each iteration computes one midpoint and performs at most two comparisons. The candidate range has length at most $hi - lo + 1$ and becomes at most about half as long, so the number of iterations is at most $\lceil \log_2 n \rceil$ for $n \ge 1$.

- **Time:** $O(\log n)$ per query.
- **Auxiliary space:** $O(1)$ beyond the stored intervals.
- **Input storage:** $O(n)$, because every program has to read the intervals before it can search them.

If the intervals are not sorted, sorting costs $O(n \log n)$ once, after which every query is logarithmic. If they overlap, merging costs $O(n \log n)$ once. Both preprocessing costs are worth paying when the number of queries is large; neither is worth paying for a single query, where a linear scan is already optimal.

For $n = 10^5$ and $q = 10^5$, the halving search performs about $1.7 \cdot 10^6$ comparisons in total, compared with $10^{10}$ for the scan.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Sorted disjoint intervals, one point | The search in this article |
| Sorted disjoint intervals, many points | Sort the points and sweep both lists, or search each point |
| Sorted values, exact membership | Ordinary binary search |
| Sorted values, predecessor or successor | Lower bound or upper bound |
| Unsorted intervals, one point | Linear scan |
| Unsorted intervals, many points | Sort and merge, then search |
| Overlapping intervals, many points | Merge first, or build an interval tree |
| Intervals that change between queries | Balanced search tree or segment tree |

The sweep in the second row is worth remembering. Sorting $q$ points and advancing one pointer through the intervals answers all of them in $O((n + q)\log(n + q))$ time, while $q$ separate searches cost $O(q \log n)$. The sweep wins when $q$ is much larger than $n$, and the searches win when the points must be answered online.

## Reference implementations

The manifest lists six programs, one per language, all with the same contract.

| Language   | File                    | Input                               | Output            |
| ---------- | ----------------------- | ----------------------------------- | ----------------- |
| C          | `c/program.c`           | $n$, then $n$ pairs, then the point | The index or $-1$ |
| C++17      | `cpp17/program.cpp`     | Same                                | Same              |
| Java       | `java/Main.java`        | Same                                | Same              |
| Python     | `python/program.py`     | Same                                | Same              |
| Pascal     | `pascal/program.pas`    | Same                                | Same              |
| JavaScript | `javascript/program.js` | Same                                | Same              |

The contract is: the first token is $n$; the next $2n$ tokens are the intervals, each pair on its own line in the examples but whitespace-separated in general; the final token is the query point. The intervals are sorted by left endpoint and pairwise disjoint. The output is one integer followed by a newline.

The C, C++, and Java programs use 64-bit integers for the endpoints. Python integers are unbounded. JavaScript numbers represent every integer up to $2^{53}$ exactly, which covers the coordinate range used by the fixtures and by any realistic judge. Pascal uses `Int64`.

The JavaScript and Pascal listings are educational references, not USACO submission languages, and their file headers say so.

## Recursion decision

The search can be written recursively: compare the midpoint, then recurse into one half. The recursion depth is the number of halvings, so it is $O(\log n)$ and never close to a stack limit for any array that fits in memory.

The iterative form is still the better default. It cannot overflow the stack, it has no call overhead, and it makes the invariant explicit in two variables rather than in the arguments of a call. C, C++, and Java do not guarantee tail-call elimination, so the recursive form really does consume a frame per halving. The loop is also easier to inspect when a judge reports a wrong answer at a boundary.

## Implementation walkthrough

The entire algorithm is the branch structure inside the loop.

```cpp
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (point < left[mid]) {
        hi = mid - 1;          // the point is left of this interval
    } else if (point > right[mid]) {
        lo = mid + 1;          // the point is right of this interval
    } else {
        return mid;            // both endpoints bracket the point
    }
}
return -1;
```

Three details are worth checking before submitting.

1. **Both comparisons use the point on the left.** Writing `left[mid] < point` is equivalent, but keeping the point first makes the two cases read as "point is left" and "point is right".
2. **The `+ 1` and `- 1` are mandatory.** `hi = mid` or `lo = mid` can leave the range unchanged when the range has length one, which produces an infinite loop.
3. **The inclusive check is `<=`, not `<`.** A point equal to an endpoint belongs to the interval. If the problem uses half-open intervals, change both comparisons together rather than only one.

The input side matters as much as the search. Read $n$ first, then exactly $n$ pairs, then the point. If the point is read as part of the last pair by mistake, the search will run on a truncated list and return $-1$ for a point that is present. The programs in this article read the point as a separate final token and print $-1$ when the input ends early.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Treating the intervals as half-open | A point on the right endpoint is reported as outside | Use `point <= right[mid]` for closed intervals |
| Comparing only against the left endpoint | A point in a gap is assigned to the preceding interval | Check both endpoints |
| Ignoring disjointness | The proof fails and the answer can be silently wrong | Merge overlapping intervals before searching |
| Using `lo = mid` or `hi = mid` | Infinite loop when the range has length one | Move past the midpoint with `mid + 1` and `mid - 1` |
| Computing `(lo + hi) / 2` | Overflow on large index ranges | Compute `lo + (hi - lo) / 2` |
| Assuming the input is sorted | The halving discards the answer | Sort by left endpoint first |
| Returning the interval value | The judge expects an index | Read the output specification twice |
| Forgetting the empty list | The midpoint is computed on an empty range | Check `lo > hi` before the loop, or let the loop skip |

### Why this fails: overlapping intervals

Take the sorted but overlapping intervals $[0, 10]$, $[2, 3]$, $[4, 5]$ and the point $x = 9$. The three-way search starts with $mid = 1$, which is $[2, 3]$. Since $9 > 3$, it discards everything at or before index $1$ and continues with $[4, 5]$. Since $9 > 5$, it discards that too and returns $-1$. But $[0, 10]$ contains $9$ and was discarded at the first step.

The boundary-search form fails on the same input for the same reason. The last interval whose left endpoint is at most $9$ is $[4, 5]$, which does not contain $9$; the verification step rejects it and reports $-1$, while the earlier long interval still contains the point.

The lesson is that the halving argument is a statement about the data, not about the loop. Disjointness is what guarantees that the discarded half cannot hide an answer.

## Variants and extensions

- **Half-open intervals.** Represent each interval as $[l, r)$ and replace the comparisons with `point < left[mid]` and `point >= right[mid]`. Keep the two changes consistent.
- **Boundary search then verify.** Search the left endpoints for the last one at most the point, then test the right endpoint once. This is slightly faster when the intervals are wide and the point is usually inside.
- **Merge first.** Sort by left endpoint, merge every overlapping pair, and then run the search. The merge is $O(n \log n)$ and makes the disjointness assumption true by construction.
- **Many points.** Sort the points and sweep one pointer through the merged intervals. The total cost is $O((n + q)\log(n + q))$, which is better than $q$ independent searches when $q$ is large.
- **Weighted intervals.** Store prefix sums of interval weights and search the prefix array instead. The first prefix at least the target identifies the owning interval, as in the Worms problem below.
- **Nested intervals.** If intervals may contain one another, disjointness is gone. Use an interval tree, a segment tree with range updates, or a sweep, depending on whether the queries are offline.
- **Binary search over any sorted index range.** The same halving applies to arrays of pairs, tuples, or records once a monotone comparison on the index is identified. The interval problem is the two-endpoint case.

## Contest strategy

1. **Check the assumptions before writing the loop.** Are the intervals sorted? Are they disjoint? Are the endpoints inclusive? Each answer changes a comparison.
2. **Merge or sort if the input does not satisfy them.** Preprocessing once is cheaper than debugging a wrong invariant.
3. **Write the linear scan first.** It is four lines, it is obviously correct, and it becomes the reference for a differential test.
4. **Test five points explicitly:** before the first interval, inside the first, in a gap, on an endpoint, and after the last. Add the empty list as a sixth.
5. **Decide the index base.** Most judges want $0$-based indices; this article and its programs use $0$-based, and the sentinel is $-1$.
6. **Check the coordinate type.** Endpoints near $10^9$ fit in 32 bits, but sums of endpoints and midpoints may not. Use 64-bit integers when the problem allows larger values.

## Worked problems

### Problem 1: Worms

Piles of worms are labeled with consecutive integers, and each query gives one label. Return the number of the pile that contains that label.

**Observation.** Pile $i$ owns the labels from $s_{i-1} + 1$ through $s_i$, where $s$ is the prefix sum of the pile sizes. Those ranges are disjoint and sorted, and the prefix sums themselves are strictly increasing.

**Algorithm.** Build the prefix sums. For each query $q$, binary search for the first prefix sum at least $q$. That index is the pile. Because the ranges are disjoint, no second check is needed.

**Complexity.** $O(n)$ preprocessing and $O(\log n)$ per query.

### Problem 2: Queries about less or equal elements

Given an array and a list of thresholds, count how many elements are at most each threshold.

**Observation.** After sorting the array, the elements at most $x$ form a prefix. The length of that prefix is the first index whose value exceeds $x$.

**Algorithm.** Sort the array once. For every threshold, run an upper-bound search and print the resulting index. The index is the count, not the position of a specific element.

**Complexity.** $O(n \log n + m \log n)$ for an array of $n$ elements and $m$ queries.

### Problem 3: Triangles

Given stick lengths, count how many triples form a nondegenerate triangle.

**Observation.** Sort the lengths and name the chosen sides $a \le b \le c$. The only inequality that can fail is $a + b > c$, because the other two are automatic once the sides are ordered.

**Algorithm.** Fix the two shorter sticks at indices $i < j$. Every third stick at an index $k > j$ with $L_k < L_i + L_j$ completes a triangle. Those valid $k$ form a contiguous suffix range, so a boundary search for the first $L_k \ge L_i + L_j$ gives the count in $O(\log n)$.

**Complexity.** $O(n^2 \log n)$ time and $O(1)$ auxiliary space beyond the array.

## Practice progression

1. **Recognition.** Given ten problem statements, mark which ones involve point location in sorted disjoint intervals. Write down why the others do not.
2. **Direct application.** Implement the three-way search and the boundary-search variant, then compare their answers on random disjoint intervals.
3. **Boundaries.** Test points equal to every left endpoint and every right endpoint, plus one point just outside each end.
4. **Overlap.** Take a sorted overlapping input, show that both search forms can fail, then fix it by merging.
5. **Combination.** Add prefix sums so that the search runs over weighted intervals, as in the Worms problem.
6. **Scale.** Answer $10^5$ queries on $10^5$ intervals, then replace the per-query search with a sorted sweep and compare the running times.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Which two properties of the input make the halving argument valid? (Recognition patterns)
2. Why does $point > r_{mid}$ let the search discard every interval at or before $mid$? (Key insight)
3. State the loop invariant and show that each of the three cases preserves it. (Correctness proof)
4. Why is at most one interval allowed to contain the point? (Formal model)
5. What changes when the intervals are half-open? (Variants and extensions)
6. Give a sorted but overlapping input on which the search returns the wrong answer. (Common mistakes)
7. How many comparisons does the search perform for $n = 10^5$? (Complexity analysis)
8. Why is the empty list a special case in the implementations? (Step-by-step execution)

## Further reading

- [Binary search](/algorithms/searching/binary-search) develops the halving argument for a single sorted array; this article is its two-endpoint relative.
- [Binary search on the answer](/algorithms/searching/binary-search-on-answer) applies the same halving to a monotone predicate over a numeric range rather than over an index range.
- [Two pointers](/algorithms/searching/two-pointers) answers many of the same boundary questions in linear time when both ends of the data move in the same direction.
- [Fenwick tree](/algorithms/range-queries/fenwick-tree) is the structure to reach for when the intervals or their weights change between queries.
