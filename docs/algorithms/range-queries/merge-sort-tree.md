---
id: range-queries.merge-sort-tree
title: Merge sort trees
summary: Store the sorted values of every segment in a segment tree, so a rank query binary searches the nodes that cover a range and a k-th smallest query binary searches the values.
division: [gold, platinum]
subjects: [range-queries]
level: intermediate
importance: common-contest-technique
keywords:
    [
        merge sort tree,
        range tree,
        segment tree of sorted arrays,
        range counting,
        order statistic,
        k-th smallest,
        rank query,
        binary search,
    ]
prerequisites:
    required: [range-queries.segment-tree, searching.binary-search, foundations.sorting]
    recommended: [arrays.coordinate-compression, range-queries.fenwick-tree]
complexity:
    time: "O(log^2 n) per rank query; O(log C log^2 n) per k-th smallest query"
    space: "O(n log n)"
assumptions:
    - The array is static, because repairing a node's sorted list after a point update costs the size of that list.
    - The queries are range counts, range sums below a threshold, or order statistics over a contiguous range, so the range decomposes into segment tree nodes.
implementations: range-queries.merge-sort-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="range-queries.merge-sort-tree" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="range-queries.merge-sort-tree" />

A merge sort tree is a [segment tree](/algorithms/range-queries/segment-tree) over the positions of a static array in which every node stores the sorted values of its interval. The root stores the whole array sorted, the leaves store single values, and an internal node stores the merge of its two children's lists. The build is exactly the merge step of merge sort, once per internal node, which is where the structure gets its name.

The structure answers two questions. A **rank query** counts the values in a range that are at most a threshold $x$. It decomposes the range into $O(\log n)$ nodes, binary searches each node's sorted list, and adds the counts. A **k-th smallest query** asks for the value in position $k$ of the sorted range. It is the least value whose rank in the range reaches $k$, so it is found by binary searching the value axis and calling the rank query at every step.

The array is static. A point update would have to repair every sorted list on the path from the leaf to the root, and the total length of those lists is proportional to $n$, so the update would cost $O(n)$. The tree trades updates for a simple, cache-friendly index of the value dimension.

The costs are $O(n \log n)$ space, $O(\log^2 n)$ per rank query, and $O(\log C \log^2 n)$ per k-th smallest query, where $C$ is the width of the value range. The bounds are worse than a wavelet tree's, but the code is a segment tree with a merge, and that is often the difference between a solution written in time and a solution not written at all.

## Problem motivation

An observatory publishes a fixed table of daily temperatures. A reader asks two kinds of question about a span of days $[l, r]$.

- How many days in the span were at most $x$ degrees?
- What was the $k$-th coldest day in the span?

The table never changes, and the questions arrive in order. The constraints decide the technique.

- $1 \le n \le 200\,000$ days.
- $1 \le q \le 200\,000$ questions.
- $|a_i| \le 10^9$, so a value range indexed by temperature cannot be allocated.
- The questions are encrypted with the previous answer, so they cannot be sorted or answered out of order.

A linear scan answers the first question in $O(n)$ by counting the values at most $x$, and the second by copying the span and sorting it in $O(n \log n)$. With $q = 200\,000$ the first costs $4 \cdot 10^{10}$ comparisons, which is far beyond a contest time limit.

The obvious repairs each fail on one half of the problem. Prefix sums answer a sum in constant time but cannot answer "at most $x$" for an arbitrary $x$, because the threshold is not known when the table is built. A [Fenwick tree](/algorithms/range-queries/fenwick-tree) over the values answers a global rank in $O(\log n)$, but it has forgotten where the values were, so it cannot restrict the count to $[l, r]$. A segment tree over the positions stores sums, minima, or maxima, but a sum of a range cannot be filtered by a threshold after the fact.

The query has two independent axes: a position interval and a value threshold. A structure that indexes one axis and sorts the other is the smallest object that can answer both. That object is the merge sort tree.

## Recognition patterns

The technique applies when all of the following hold.

- The array is **static**: there are no point updates and no range updates.
- The query is a **count** of values below a threshold, a **sum** of values below a threshold, or an **order statistic** in a contiguous range.
- The threshold or the order $k$ is part of the query, not fixed in advance.
- The queries must be answered **online**, or the intended solution is a static range structure rather than an offline sweep.
- The value domain is too large for a frequency array, but the array itself is small enough to index in $O(n \log n)$.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Any point update | A static merge sort tree is ruled out; use a Fenwick tree of order-statistic trees or a dynamic segment tree |
| Values bounded by a small $V$ | A Fenwick tree over the values, or a prefix-count table, is smaller and faster |
| No position restriction, only a global rank | Sort the array once and index it |
| Only a range maximum or minimum | A plain segment tree or a sparse table is enough; no sorting is needed |
| $n \le 10^3$ | Copying and sorting each queried range is fast enough |
| All queries known in advance | Sort by threshold and sweep a Fenwick tree over the positions in $O((n + q) \log n)$ |
| The time limit demands $O(\log n)$ per query | Use a wavelet tree or a persistent segment tree |
| $n \ge 10^6$ and the memory limit is tight | The $n \log n$ lists may not fit; prefer a wavelet tree or an offline sweep |

The phrases that signal the technique are "how many elements in the subarray are at most $x$", "the $k$-th smallest element in the range", "the sum of the elements not greater than $x$", and "answer the queries online". The phrase that rules it out is "add $v$ to position $i$", because that is an update.

<Synonyms terms="merge sort tree, merge-sort tree, range tree, segment tree of sorted arrays, sorted-list segment tree" />

## Naive approach

The baseline for a rank query scans the range and counts.

```cpp
long long countAtMost(const std::vector<long long>& a, int left, int right, long long limit) {
    long long total = 0;
    for (int i = left; i <= right; ++i) {
        if (a[i] <= limit) {
            total += 1;
        }
    }
    return total;
}
```

This is $O(n)$ per query and $O(1)$ per update, and it is the reference implementation for a differential test.

The baseline for a k-th smallest query copies the range, sorts the copy, and reads the entry at $k - 1$.

```cpp
long long kthSmallest(std::vector<long long> range, int k) {
    std::sort(range.begin(), range.end());
    return range[static_cast<std::size_t>(k - 1)];
}
```

This is $O(n \log n)$ per query. It is correct for any array and any $k$, and it is the second reference implementation.

A third baseline works when the value domain is small. Build a table of prefix counts over the values, so that the count of values at most $x$ in a prefix is one lookup, and a range count is the difference of two lookups. The table costs $O(n + V)$ time and space, where $V$ is the number of distinct values or the width of the value range. It is the fastest of the three baselines, and it is the one that fails when $V$ reaches $10^9$.

A fourth baseline is the offline sweep. Sort the queries by their threshold, sort the array by value, and activate positions in a [Fenwick tree](/algorithms/range-queries/fenwick-tree) as the threshold grows. A rank query becomes a prefix-sum difference. The cost is $O((n + q) \log n)$ and the answers must be stored by original index. It is the best of the four when the queries are known in advance, and it is unavailable when the queries are encrypted or must be answered online.

## Key insight

The position range $[l, r]$ can be partitioned into $O(\log n)$ disjoint segment tree nodes. That is the standard decomposition of a segment tree query, and it is independent of the values.

If every node stores its values in sorted order, the number of values in that node that are at most $x$ is one binary search. The answer to the rank query is the sum of those counts over the nodes of the decomposition. Nothing is counted twice, because the nodes are disjoint, and nothing is missed, because they cover the range.

The build is the second half of the insight. A node's sorted list is the merge of its two children's sorted lists, exactly as in merge sort. Every value appears once per level of the tree, so the total size of all lists is $O(n \log n)$, and the total build time is $O(n \log n)$.

The same lists answer an order statistic with one more idea. Define the rank of a value $x$ in the range as the count of values at most $x$. The rank is a nondecreasing step function of $x$: it starts at $0$ below the minimum, reaches the length of the range at the maximum, and never decreases. The $k$-th smallest value is the smallest $x$ whose rank is at least $k$. A binary search over the value axis finds that $x$ in $O(\log C)$ rank queries.

The value axis can be the raw range from the minimum to the maximum, or the sorted distinct values of the array after [coordinate compression](/algorithms/arrays/coordinate-compression). The raw range costs $\log C$ steps and no preprocessing; the compressed axis costs $\log n$ steps and one sort. The implementations use the raw range, because it keeps the contract simple and the stated values fit comfortably in 64 bits.

## Visual intuition

Take the eight values

$$
a = [5,\; 2,\; 8,\; 1,\; 9,\; 3,\; 7,\; 4]
$$

and place them in the eight leaves of a complete tree. The nodes and their sorted lists are:

```text
                    [1, 8]
              1 2 3 4 5 7 8 9
             /               \
        [1, 4]               [5, 8]
      1 2 5 8              3 4 7 9
       /   \                /   \
   [1,2]   [3,4]        [5,6]   [7,8]
   2 5     1 8          3 9     4 7
   / \     / \          / \     / \
  5   2   8   1        9   3   7   4
```

Read the tree from the bottom up and the merge is visible. The list of $[1,4]$ is the merge of $[2,5]$ and $[1,8]$, which is $1, 2, 5, 8$. The list of the root is the merge of $[1,4]$ and $[5,8]$, which is the whole array sorted.

Now query the range $[2, 7]$ with the threshold $5$. The decomposition is

$$
[2, 7] = [2, 2] \cup [3, 4] \cup [5, 6] \cup [7, 7].
$$

The four nodes, their lists, and the counts of values at most $5$ are:

| Node    | Interval | Sorted list | Count at most $5$ |
| ------- | -------- | ----------- | ----------------- |
| $[2,2]$ | $2$      | $2$         | $1$               |
| $[3,4]$ | $3, 4$   | $1, 8$      | $1$               |
| $[5,6]$ | $5, 6$   | $3, 9$      | $1$               |
| $[7,7]$ | $7$      | $7$         | $0$               |

The total is $3$, and the subarray is $2, 8, 1, 9, 3, 7$, whose values at most $5$ are $2, 1, 3$. The count is correct, and the four binary searches are visible as the four rows of the table.

The order statistic uses the same decomposition. For $k = 3$ in the same range, the sorted subarray is $1, 2, 3, 7, 8, 9$, so the answer is $3$. The binary search over the value axis tries the middle value, computes the rank with the table, and narrows the interval until only $3$ survives.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array. Build a segment tree whose leaves are the positions and whose internal nodes cover the union of their children's intervals.

::: math definition Definition
For a node $v$, let $I(v)$ be its interval of positions and let $S(v)$ be the multiset of values $\{a_i : i \in I(v)\}$, stored as a sorted array. The **merge sort tree** is the segment tree together with the arrays $S(v)$ for every node.
:::

::: math definition Definition
A **canonical decomposition** of a range $[l, r]$ is a set $\mathcal{D}(l, r)$ of nodes whose intervals are pairwise disjoint and whose union is exactly $[l, r]$. The standard segment tree query builds such a set with at most $2 \lceil \log_2 n \rceil$ nodes.
:::

::: math definition Definition
The **rank** of a value $x$ in the range $[l, r]$ is

$$
\operatorname{rank}(l, r, x) = \bigl|\{\, i : l \le i \le r \text{ and } a_i \le x \,\}\bigr|.
$$

The **k-th smallest** value of the range, written $\operatorname{kth}(l, r, k)$, is the value at position $k$ of the range sorted in nondecreasing order, with $1 \le k \le r - l + 1$.
:::

::: math lemma Lemma
For every node $v$, the array $S(v)$ is sorted and contains every value of $I(v)$ exactly once, with multiplicity.
:::

::: math lemma Lemma
For every range $[l, r]$, the intervals of the nodes in $\mathcal{D}(l, r)$ partition $[l, r]$.
:::

::: math lemma Lemma
For every value $x$,

$$
\operatorname{rank}(l, r, x) = \sum_{v \in \mathcal{D}(l, r)} \bigl|\{\, y \in S(v) : y \le x \,\}\bigr|.
$$
:::

::: math lemma Lemma
The function $x \mapsto \operatorname{rank}(l, r, x)$ is nondecreasing, and it increases by the multiplicity of $x$ when $x$ crosses a value that occurs in the range. Consequently, the least $x$ with $\operatorname{rank}(l, r, x) \ge k$ is $\operatorname{kth}(l, r, k)$.
:::

## Algorithm derivation

The state is the array of sorted lists, one per node. The build is a postorder traversal.

```text
build(node, left, right):
    if right - left == 1:
        S(node) = [a[left]]
        return
    middle = left + (right - left) / 2
    build(2 * node, left, middle)
    build(2 * node + 1, middle, right)
    S(node) = merge(S(2 * node), S(2 * node + 1))
```

The merge is the standard two-pointer merge of merge sort. It is linear in the total size of the two lists, so the build costs $O(n \log n)$.

The rank query is the standard segment tree traversal with a binary search at every fully covered node.

```text
rank(node, left, right, ql, qr, x):
    if qr <= left or right <= ql:
        return 0
    if ql <= left and right <= qr:
        return upper_bound(S(node), x)
    middle = left + (right - left) / 2
    return rank(2 * node, left, middle, ql, qr, x)
         + rank(2 * node + 1, middle, right, ql, qr, x)
```

`upper_bound(S, x)` is the number of entries of the sorted list that are at most $x$, which is the length of the prefix ending at the last entry $\le x$. The name is the one used by the C++ standard library; the other languages implement the same loop.

The iterative form used by the reference implementations replaces the recursion with the standard bottom-up walk.

```text
total = 0
l = ql + size
r = qr + size
while l < r:
    if l is odd:
        total += upper_bound(S(l), x)
        l += 1
    if r is odd:
        r -= 1
        total += upper_bound(S(r), x)
    l = l / 2
    r = r / 2
```

The order statistic is a binary search over the value axis with the rank query as the predicate.

```text
kth(ql, qr, k):
    low = minimum of a
    high = maximum of a
    while low < high:
        middle = low + (high - low) / 2
        if rank(ql, qr, middle) >= k:
            high = middle
        else:
            low = middle + 1
    return low
```

The invariant of the binary search is that the answer always lies in $[low, high]$. If the rank at `middle` reaches $k$, the answer is at most `middle`; otherwise it is greater than `middle`. The loop stops when the interval has one value, and that value is the answer.

::: math invariant Invariant
After the build, $S(v)$ is the sorted multiset of the values in $I(v)$ for every node $v$.
:::

::: math invariant Invariant
At the start of every iteration of the order-statistic binary search, $\operatorname{kth}(l, r, k)$ lies in the closed interval $[low, high]$.
:::

The subtraction in `middle = low + (high - low) / 2` is not a stylistic preference. The expression `(low + high) / 2` can overflow a signed 64-bit integer when both bounds are large, and with negative bounds it can fail to make progress. The guard is written once and used everywhere.

## Step-by-step execution

Continue with the array $a = [5, 2, 8, 1, 9, 3, 7, 4]$ and its tree from the visual section.

**The rank query.** Take the range $[2, 7]$ and the threshold $5$. The decomposition visits the nodes in this order.

1. The root $[1,8]$ is not contained in $[2,7]$, so the traversal splits into its children.
2. The node $[1,4]$ is not contained, so the traversal splits again.
3. The node $[1,2]$ is not contained, but its right child $[2,2]$ is. The list is $[2]$, and `upper_bound([2], 5) = 1`.
4. The node $[3,4]$ is contained. The list is $[1,8]$, and `upper_bound([1,8], 5) = 1`, because $1 \le 5$ and $8 > 5$.
5. The node $[5,8]$ is not contained, so the traversal splits.
6. The node $[5,6]$ is contained. The list is $[3,9]$, and `upper_bound([3,9], 5) = 1`.
7. The node $[7,8]$ is not contained, but its left child $[7,7]$ is. The list is $[7]$, and `upper_bound([7], 5) = 0`.
8. The remaining child $[8,8]$ is outside the range and contributes nothing.

The total is $1 + 1 + 1 + 0 = 3$. The four nodes that contributed are exactly the canonical decomposition, and the ones that did not are exactly the nodes outside the range.

**The order statistic.** Now ask for $k = 3$ in the same range. The minimum of the whole array is $1$ and the maximum is $9$.

| Iteration | $low$ | $high$ | $middle$ | Rank at $middle$ | New interval |
| --------- | ----- | ------ | -------- | ---------------- | ------------ |
| 1         | $1$   | $9$    | $5$      | $3$              | $[1, 5]$     |
| 2         | $1$   | $5$    | $3$      | $3$              | $[1, 3]$     |
| 3         | $1$   | $3$    | $2$      | $2$              | $[3, 3]$     |

The answer is $3$. The rank at $5$ is $3$ because $2, 1, 3$ are at most $5$; the rank at $3$ is also $3$; the rank at $2$ is $2$, so the least value with rank at least $3$ is $3$.

**A negative case.** Take $a = [-5, -1, 0, -3, 2]$ and ask for the second smallest in $[2, 4]$. The subarray is $-1, 0, -3$, whose sorted order is $-3, -1, 0$, so the answer is $-1$. The value search runs with $low = -5$ and $high = 2$. At $middle = -2$, the rank in $[2,4]$ is $1$ (only $-3$), which is below $2$, so $low$ becomes $-1$. At $middle = 0$, the rank is $3$, so $high$ becomes $0$. At $middle = -1$, the rank is $2$, so $high$ becomes $-1$, and the loop stops at $-1$. The arithmetic with negative bounds is the same as with positive ones because `high - low` is always positive inside the loop.

## Correctness proof

::: math theorem Theorem
The merge sort tree stores the sorted multiset of every node's interval, and the rank query returns the number of values in the requested range that are at most the threshold.
:::

::: math proof Proof
The build is an induction on the height of the node. A leaf stores its single value, which is the sorted multiset of its interval. An internal node merges the sorted lists of its two children. By the induction hypothesis, the children's lists are the sorted multisets of their intervals, and the merge of two sorted lists is the sorted multiset of their union. The union of the children's intervals is the node's interval, so the node's list is the sorted multiset of its interval. The invariant holds at every node. $\square$
:::

::: math proof Proof
For the query, let $\mathcal{D}(l, r)$ be the nodes visited as fully covered. Their intervals are pairwise disjoint and their union is $[l, r]$ by the standard segment tree decomposition. For a node $v$, `upper_bound(S(v), x)` counts exactly the entries of $S(v)$ that are at most $x$, because $S(v)$ is sorted and the binary search returns the first position whose value is greater than $x$. By the previous lemma, $S(v)$ contains each value of $I(v)$ with its multiplicity. Summing over the disjoint intervals counts every position of $[l, r]$ exactly once and no position outside it. The total is the rank. $\square$
:::

::: math theorem Theorem
The order-statistic binary search returns $\operatorname{kth}(l, r, k)$.
:::

::: math proof Proof
The rank function is nondecreasing in $x$, and it reaches at least $k$ at the $k$-th smallest value of the range by definition: at most $k - 1$ values are strictly smaller, so the rank at the $k$-th smallest value is at least $k$, and the rank at any smaller value is at most $k - 1$. Therefore the set of values with rank at least $k$ is a suffix of the value axis, and its least element is the $k$-th smallest value.

The binary search maintains the invariant that the answer lies in $[low, high]$. If the rank at `middle` is at least $k$, then `middle` is in the suffix, so the answer is at most `middle` and the new interval is $[low, middle]$. Otherwise `middle` is below the suffix, so the answer is greater than `middle` and the new interval is $[middle + 1, high]$. Both intervals are strictly smaller than the old one, and the loop terminates with `low == high`, which must be the answer. $\square$
:::

::: math theorem Theorem
The whole structure uses $O(n \log n)$ space, and the rank query uses $O(\log^2 n)$ binary-search steps.
:::

::: math proof Proof
Each value appears in exactly one node per level of the tree, and the tree has $\lceil \log_2 n \rceil + 1$ levels, so the sum of the list lengths is at most $n(\lceil \log_2 n \rceil + 1) = O(n \log n)$. A rank query visits at most two nodes per level, hence $O(\log n)$ nodes, and each binary search costs $O(\log n)$ because a node's list has at most $n$ entries. The total is $O(\log^2 n)$. $\square$
:::

## Complexity analysis

**Build: $O(n \log n)$.** Every level of the tree merges a partition of the array into lists whose total length is exactly $n$, so one level costs $O(n)$ and the height is $O(\log n)$. The padding to a power of two adds at most a factor of two in the number of leaves and does not change the bound.

**Rank query: $O(\log^2 n)$.** The range decomposes into at most $2 \lceil \log_2 n \rceil$ nodes. The binary search in a node costs $O(\log |S(v)|) \le O(\log n)$. The product is $O(\log^2 n)$.

**K-th smallest: $O(\log C \log^2 n)$.** The value binary search performs $\lceil \log_2 C \rceil$ rank queries, where $C = \text{maximum} - \text{minimum} + 1$. For the stated values $C \le 2 \cdot 10^9 + 1$, so there are at most $31$ iterations. If the distinct values are compressed first, the count is at most $\lceil \log_2 n \rceil$, and the bound becomes $O(\log^3 n)$.

**Sum below a threshold: $O(\log^2 n)$.** Every node stores the prefix sums of its sorted list beside the list. A fully covered node contributes the prefix sum at the `upper_bound` position, which is one extra array read. The asymptotics are unchanged.

**Space: $O(n \log n)$.** The number of stored entries is at most $n(\lceil \log_2 n \rceil + 1)$. At $n = 200\,000$ the tree has $262\,144$ leaves after padding and about $3.8$ million entries. With 64-bit entries that is about $30$ MB of values, plus the node objects. In C++ the `std::vector` headers add about $12$ MB; in Java the `long[]` headers add a similar amount; Python and JavaScript add more per list and per number. The structure fits a 256 MB limit comfortably and a 64 MB limit only with care.

::: math complexity Complexity
Merge sort tree over $n$ static values: $O(n \log n)$ to build, $O(\log^2 n)$ per rank query, $O(\log C \log^2 n)$ per k-th smallest query, and $O(n \log n)$ space.
:::

The width of the value type matters for the sum variant, not for the count. A sum of $n$ values of magnitude $10^9$ reaches $2 \cdot 10^{14}$, which needs a 64-bit accumulator. The counts themselves are at most $n$, which fits a 32-bit integer, but the reference programs use 64-bit values throughout so that the same code works for negative and large inputs.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static array, online rank queries | Merge sort tree |
| Static array, online k-th smallest queries | Wavelet tree or persistent segment tree; a merge sort tree plus binary search is the simplest correct version |
| Static array, sum of values at most $x$ | Merge sort tree with a prefix sum beside every sorted list |
| Static array, range minimum or maximum | Sparse table or segment tree; no sorting is needed |
| Point updates and range counts | Fenwick tree of order-statistic trees, or a dynamic segment tree |
| All queries known in advance | Sort by threshold and sweep a Fenwick tree over the positions |
| Global order statistic, no position range | Sort the array once and index it |
| Small value domain | Prefix counts over the values, or a Fenwick tree over the values |
| Rectangle count over points | A two-dimensional range tree, of which the merge sort tree is the one-dimensional case |
| Range mode or range distinct with no simple transform | Mo's algorithm, or a specialized structure |

The first row is the case this article exists for. The second row is a warning about the constant: a merge sort tree answers a k-th smallest query in $O(\log^3 n)$ with binary search, while a wavelet tree answers it in $O(\log \sigma)$, where $\sigma$ is the number of distinct values. When a problem asks for many order statistics, the wavelet tree is the better tool even though it is harder to write.

The sixth row is the practical alternative. If the queries are not encrypted, the offline sweep is shorter, faster, and uses $O(n)$ memory. The merge sort tree is for the online case, or for the case where the offline sweep would have to be rebuilt for every possible threshold.

## Reference implementations

The manifest publishes one `program` variant per language. Every variant implements the same contract.

- The first line holds $n$ and $q$.
- The second line holds the $n$ values.
- Each of the next $q$ lines holds $l$, $r$, and $k$, with $1 \le l \le r \le n$ and $1 \le k \le r - l + 1$.
- For each query, the program prints the $k$-th smallest value in $a_l, \ldots, a_r$ on its own line.

The six programs build the same tree. They pad the array to a power of two, place the leaves at the bottom of an array of size $2 \cdot \text{size}$, merge the children bottom-up, and answer each query with the iterative decomposition. The rank query is internal; the output is the value found by the binary search over the value range.

The C variant owns the tree through one allocation per nonempty node and frees every list after the last query, so a failed allocation on the way up also frees the partial tree. The C++ variant uses `std::vector` and `std::merge`, so the destructors release the storage. The Java variant uses a ragged `long[][]`, a fast byte scanner, and a `StringBuilder` for the output. The Python variant uses `bisect_right` and a list of sorted lists. The Pascal variant uses dynamic arrays and `SetLength`, and the JavaScript variant uses arrays and a hand-written upper bound. The last two carry the educational note required of languages that are not USACO submission languages.

The `program` variants are marked `unverified` in the manifest. The fixture file beside the article supplies three cases: duplicates and interior order statistics, negative values, and a single position with repeated extremes. The test harness compiles every variant, runs all three cases, and requires the six outputs to agree.

## Recursion decision

The concept is recursive: a node's list is the merge of its children's lists, and a range query splits until a node is fully covered. The implementations do not recurse, for two reasons.

The first is that the build visits every node exactly once. An iterative postorder pass over the array of nodes is shorter than a recursive function, and it does not need the node boundaries to be passed down. With a power-of-two padding, the leaves are the last `size` entries, and the internal nodes are filled by one loop from `size - 1` down to `1`.

The second is that the query is a walk over the same array. The iterative decomposition uses two indices, `l` and `r`, and needs no stack. It also makes the padding harmless: a query within $[0, n)$ never selects a node that contains only padding.

The recursion would be safe if it were used. The depth is $\lceil \log_2 n \rceil$, which is at most $18$ for $n = 200\,000$, far below the default stack and below Python's default recursion limit.

| Language | Recursive build verdict | Reason |
| --- | --- | --- |
| C and C++ | Iterative is better | One loop replaces about $2n$ calls, and the compiler can keep the node arrays in cache |
| Java | Iterative is better | The JIT may inline the recursion, but the loop is still smaller and allocation-free |
| Python | Iterative is better | A function call costs about a microsecond, so $2n$ calls dominate the merge work |
| Pascal | Iterative is better | The loop avoids the call overhead and the need for a nested procedure |
| JavaScript | Iterative is better | The JIT optimizes the loop more reliably than a deep recursive helper |

The order-statistic binary search is a loop in every language. It calls the rank query, which is itself a loop, so the only recursion left in the design is the conceptual one in the definition.

## Implementation walkthrough

Four details decide whether the tree is correct and fast.

**The padding.** The programs choose the smallest power of two `size` with `size >= n`, place the value $a_i$ at the leaf `size + i`, and leave the leaves from `size + n` to `2 * size - 1` empty. Every internal node then covers a contiguous interval of positions, and the standard bottom-up decomposition works without special cases. A query within the array never selects an empty leaf.

**The merge.** Each internal node merges its two children's lists with two pointers, not with a comparison sort. The merge is linear and is the reason the build is $O(n \log n)$ rather than $O(n \log^2 n)$.

```cpp
std::vector<long long>& node = tree[i];
const std::vector<long long>& left = tree[2 * i];
const std::vector<long long>& right = tree[2 * i + 1];
node.resize(left.size() + right.size());
std::merge(left.begin(), left.end(), right.begin(), right.end(), node.begin());
```

**The binary search in a node.** The count of values at most $x$ is the first index whose value is greater than $x$. The loop must use `<=` in the comparison, not `<`, or every duplicate of $x$ is dropped.

```cpp
int upperBound(const std::vector<long long>& values, long long limit) {
    int low = 0;
    int high = static_cast<int>(values.size());
    while (low < high) {
        int middle = low + (high - low) / 2;
        if (values[middle] <= limit) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}
```

**The value binary search.** The bounds are the minimum and the maximum of the whole array, not of the queried range. Using the range bounds would also work, but it would require a second structure to find them, and the whole-array bounds are already available after the build. The middle is computed as `low + (high - low) / 2`, which is safe for negative values and for large magnitudes.

The count returned by the rank query is at most $n$, so a 32-bit counter is enough in C, C++, Java, and Pascal. The values and the sums in the variants that store prefix sums need 64 bits, and the typed reference programs use 64-bit values throughout. Python uses unbounded integers, and the JavaScript version uses `Number`, which represents every integer up to $2^{53}$ exactly; the stated constraints are far below that limit.

The input readers follow the repository's convention. The C variant uses `scanf`, the C++ variant turns off synchronization, the Java variant reads bytes into a buffer, the Python variant reads all of standard input and splits it, the Pascal variant uses `Read`, and the JavaScript variant collects the input chunks and splits them. The output is buffered in Java and JavaScript and written line by line in the other languages.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `lower_bound` for "at most $x$" | The duplicates equal to $x$ are dropped from the count | Use `upper_bound`, which returns the first entry greater than $x$ |
| Sorting the whole array and forgetting the position range | The answer is the global rank, not the range rank | Build the tree over the positions, not over the values |
| Sorting each node with a comparison sort | The build becomes $O(n \log^2 n)$ and the constant grows | Merge the children's sorted lists |
| Forgetting to sort a node's list | The binary search is invalid and the answer is arbitrary | The merge guarantees the order; a leaf is already sorted |
| Using a 0-indexed left endpoint without converting | The range is shifted by one and the first value is dropped | Convert $[l, r]$ to the half-open $[l - 1, r)$ |
| Binary searching the k-th over positions | The predicate is not monotone, so the search is meaningless | Binary search the value axis with the rank as the predicate |
| Writing `(low + high) / 2` | Overflow for large bounds, and no progress for some negative pairs | Write `low + (high - low) / 2` |
| Using a 32-bit accumulator for sums | The sum overflows silently | Use 64 bits for values and sums |
| Assuming a point update is supported | The node lists become stale and the answers are wrong | Treat the structure as static, or use a dynamic structure |
| Allocating $4n$ nodes but indexing a power-of-two layout | Half the array is unused, or an index runs past the end | Pick one layout and use its size consistently |
| Recursing once per element in Python | The call overhead dominates the merge | Use the iterative build |

### Why this fails: the point update that cannot be repaired cheaply

The mistake that looks harmless on paper is treating the tree as a segment tree that happens to have sorted lists, and applying a point update to it.

Take $a = [4, 1]$, pad to two leaves, and build the tree. The leaves are $[4]$ and $[1]$, and the root is $[1, 4]$. A rank query for values at most $0$ in $[1, 2]$ walks the root's list and returns $0$, which is correct.

Now set $a_1 = 0$. The first leaf becomes $[0]$, which is still sorted. The root, however, still holds $[1, 4]$. The next query for values at most $0$ reads the root and returns $0$, while the correct answer is $1$, because the array is now $[0, 1]$ and the value $0$ is in the range.

Repairing the root is not a constant-time operation. Its list is the merge of $[0]$ and $[1]$, and rebuilding it costs time proportional to its length. In a tree of height $h$, the path from the leaf to the root has lists of sizes $1, 2, 4, \ldots, n$, whose sum is $2n - 1$, so one update costs $O(n)$. Inserting the new value into each list instead of rebuilding costs the length of the list as well, because a sorted array has no room for a logarithmic insertion.

The conclusion is a condition on the whole technique: **a merge sort tree answers queries about a static array.** When the array changes, the structure to reach for is a Fenwick tree of order-statistic trees, a segment tree of balanced trees, or a dynamic segment tree over the values. Each of those spends more memory and more code to buy an $O(\log^2 n)$ update, and none of them is a small edit to the static tree.

There is a second failure with the same root, and it is easy to miss. If the query bounds are taken from the range instead of the whole array in the order-statistic binary search, the minimum and maximum of the range are not known without another structure. Using the global bounds is correct but costs a few extra iterations; using the first and last values of the range is wrong, because they are not the extremes.

## Variants and extensions

- **A prefix sum beside every list.** Store `prefix[j] = sum of the first j values of S(v)`. A fully covered node contributes `prefix[upper_bound(S(v), x)]`, which answers the sum of the values at most $x$ in the range in $O(\log^2 n)$. The count is the same query with every value replaced by one.
- **A count in a value interval.** The number of values in $[x, y]$ is $\operatorname{rank}(l, r, y) - \operatorname{rank}(l, r, x - 1)$. Two rank queries answer it without a second structure.
- **The k-th smallest by value-axis descent.** Build a segment tree over the compressed values instead, and store in each node the sorted positions whose values lie in that node's value range. At each level, count the positions of the left child that fall in $[l, r]$ with two binary searches; if the count reaches $k$, descend left, otherwise subtract it and descend right. This answers the query in $O(\log^2 n)$ and is the value-axis mirror of the position-axis tree.
- **Fractional cascading.** Augment each node's list with pointers into the children's lists, so that a rank query follows a pointer per level after the first binary search. The rank query becomes $O(\log n)$, at the cost of a considerably more delicate build.
- **A wavelet tree.** Partition the positions by value at every level instead of partitioning the positions by index. A rank query and a k-th smallest query both cost $O(\log \sigma)$, and the space is $O(n \log \sigma)$ bits. It is the structure to use when the order-statistic query is the main event.
- **A persistent segment tree.** Build a new version of a value-indexed segment tree for every prefix of the array. The k-th smallest in $[l, r]$ is a descent on the difference of two versions, in $O(\log n)$ time and $O(n \log n)$ nodes. It is the standard alternative when updates are absent and memory is available.
- **A Fenwick tree of sorted lists.** Replace the segment tree with a Fenwick tree over the positions and store a sorted list in every Fenwick node. The rank query is still $O(\log^2 n)$, and the structure is the starting point for the dynamic variants; with balanced trees instead of lists, a point update becomes $O(\log^2 n)$.
- **The offline sweep.** Sort the queries by threshold and activate the positions in a Fenwick tree as the threshold grows. The cost is $O((n + q) \log n)$ and the answers must be stored by original index. It is the fastest option when the queries are known in advance.
- **A merge sort tree on an Euler tour.** Flatten a tree into an array with a depth-first search, so a subtree becomes a contiguous interval. A rank query over the interval becomes a subtree query, and a second key such as depth or value can be indexed by the sorted lists.
- **Two-dimensional range counting.** A point $(i, a_i)$ is counted by the rectangle $l \le i \le r$ and $a_i \le x$. The merge sort tree is the $x$-axis range tree with a sorted $y$-list at every node; a two-dimensional range tree or a Fenwick tree of lists extends the same idea to a grid.

## Contest strategy

Under contest pressure, the decisions that matter are made before the code is written.

1. **Check for updates.** If the statement contains "add", "set", or "swap" on the array, stop: the static tree is the wrong tool.
2. **Check whether the queries are online.** If they are encrypted, or the statement says they must be answered in order, the offline sweep is unavailable. If they are not, the sweep is shorter and faster.
3. **Identify the query.** A count below a threshold needs only the lists. A sum below a threshold needs the lists and their prefix sums. A k-th smallest query needs the lists and a binary search over the values.
4. **Write the rank query first.** Test it against a brute-force count on small random arrays. The rest of the structure is a wrapper around it.
5. **Use `upper_bound` for "at most".** Write down the comparison as `value <= limit` before writing the loop, and check it with a list of duplicates.
6. **Use 64-bit types for values and sums.** Counts fit in 32 bits, but a single shared type avoids a conversion mistake in the sum variant.
7. **Test the edges.** A single element, all values equal, negative values, $k = 1$, $k = r - l + 1$, $l = r$, $l = 1$, and $r = n$ cover almost every off-by-one.
8. **Check memory before submitting.** The tree stores $n \log n$ entries. At $n = 200\,000$ that is about $3.8$ million entries; if the limit is 64 MB, consider the wavelet tree or the offline sweep.
9. **Stress test.** Keep the copy-and-sort baseline and compare on random inputs. A disagreement is a counterexample, and a counterexample is worth more than an hour of reading.
10. **Do not optimize the constant before the correctness.** A merge sort tree with a clean rank query is fast enough for the stated limits; the first priority is that the binary searches use the right comparison.

## Worked problems

### Problem 1: the sum of the values at most a threshold

**Restatement.** An array of $n$ values is given. Each query holds an encrypted triple $(\alpha, \beta, \gamma)$. With $B_0 = 0$ and $B_i$ the answer to query $i$, the real query is $L_i = \alpha \oplus B_{i-1}$, $R_i = \beta \oplus B_{i-1}$, and $X_i = \gamma \oplus B_{i-1}$. Print the sum of the values in $A_{L_i}, \ldots, A_{R_i}$ that are at most $X_i$. Constraints: $1 \le n, q \le 200\,000$, $0 \le A_i \le 10^9$.

**Naive baseline.** Decrypt the query and scan the range, adding the values at most $X_i$. The cost is $O(n)$ per query and $O(nq) = 4 \cdot 10^{10}$ operations in the worst case.

**Insight.** The array is static, and the query asks for a sum over a subset selected by value. A node's sorted list can carry the prefix sums of its values, so the subset "values at most $X$" is a prefix of the list, and its sum is one array read.

**Derivation.** Build the merge sort tree and, for every node, build `prefix` beside the sorted list. For a query, decompose $[L_i, R_i]$ into nodes. For each fully covered node, find the upper-bound position $p$ of $X_i$ in the node's sorted list and add `prefix[v][p]`. The sum of those contributions is the answer. Decrypt the next query with the previous answer, using 64-bit arithmetic for the XOR.

**Correctness.** The nodes of the decomposition partition the range. Within a node, the sorted list contains exactly the values of that node's interval, and the prefix at the `upper_bound` position contains exactly the values at most $X_i$, each once. Summing over a partition counts every qualifying value once and no other value.

**Complexity.** The build is $O(n \log n)$, each query is $O(\log^2 n)$, and the space is $O(n \log n)$.

**Common wrong approach.** Using a segment tree of sums and trying to subtract two range sums. A range sum cannot be filtered by a threshold after it has been added, because the sum has forgotten the individual values. The sorted lists are what keep the threshold meaningful.

### Problem 2: the number of distinct values in a range

**Restatement.** An array of $n$ values is given. Each query asks how many distinct values occur in the inclusive range $[a, b]$. Constraints: $1 \le n, q \le 200\,000$ and $1 \le x_i \le 10^9$.

**Naive baseline.** Copy the range into a hash set and report its size. The cost is $O(n)$ expected per query and $O(nq)$ in total.

**Insight.** A value is counted once, at its first occurrence in the range. That occurrence is characterized by the previous position that holds the same value. If `prev[i]` is that position, or zero when there is none, then position $i$ is the first occurrence of its value in $[a, b]$ exactly when $i$ is in $[a, b]$ and `prev[i] < a`.

**Derivation.** Compute `prev` in one left-to-right pass with a table from value to last position; the values have to be compressed or stored in a hash map because they reach $10^9$. Build a merge sort tree over the array `prev`. Each query becomes the count of entries in $[a, b]$ that are strictly smaller than $a$, which is $\operatorname{rank}(a, b, a - 1)$.

**Correctness.** Every distinct value has exactly one first occurrence in the range. A position $i$ is that first occurrence exactly when no earlier position in the range holds the same value, which is exactly `prev[i] < a`. The rank query counts those positions and no others, so its result is the number of distinct values.

**Complexity.** The pass over the array is $O(n)$ expected with a hash map, the build is $O(n \log n)$, each query is $O(\log^2 n)$, and the space is $O(n \log n)$.

**Common wrong approach.** Using `prev[i] <= a` instead of `prev[i] < a`. If the previous occurrence is exactly at $a$, then the value occurs at $a$, so position $i$ is the second occurrence in the range, not the first, and the count is one too large for that value. The strict comparison is the whole condition.

### Problem 3: the largest balanced army

**Restatement.** An array of $n$ warrior types is given, together with a cap $k$. A query $[l, r]$ asks for the largest number of warriors that can be chosen from that range with no type appearing more than $k$ times. The queries are decoded with the previous answer: $l = ((x + last) \bmod n) + 1$, $r = ((y + last) \bmod n) + 1$, and the two are swapped when $l > r$. Constraints: $1 \le n, k, q \le 100\,000$.

**Naive baseline.** Decode the query, count the frequency of every type in the range, and sum the smaller of each frequency and $k$. The cost is $O(n)$ per query and $O(nq)$ in total.

**Insight.** The answer is a sum of caps, and each cap is decided by the first $k$ occurrences of a type in the range. If `prev[i]` is the position of the $k$-th occurrence of $a_i$ strictly before $i$, or zero when there are fewer than $k$, then position $i$ is among the first $k$ occurrences of its type in $[l, r]$ exactly when `prev[i] < l`.

**Derivation.** Compute `prev` with one queue of the last $k$ positions for every type. When position $i$ is processed, the front of the queue, if it holds $k$ entries, is the $k$-th previous occurrence. Push $i$ and drop the front when the queue exceeds $k$. Build a merge sort tree over `prev`, and answer each query as the count of entries in $[l, r]$ that are strictly smaller than $l$. Decode the next query with the previous answer modulo $n$, and swap the bounds when the decoded left is greater than the decoded right.

**Correctness.** For a fixed type with $c$ occurrences in the range, exactly the first $\min(c, k)$ occurrences have fewer than $k$ occurrences before them inside the range, so their `prev` value is below $l$. The remaining occurrences have at least $k$ occurrences before them inside the range, so their `prev` value is at least $l$ and they are not counted. Summing over the types gives the sum of the caps, which is the largest balanced army. The rank query counts exactly those first occurrences because the nodes partition the range.

**Complexity.** The `prev` array is $O(n)$ expected with a hash map from type to queue, the build is $O(n \log n)$, each query is $O(\log^2 n)$, and the space is $O(n \log n)$.

**Common wrong approach.** Decoding the left and right bounds and then forgetting to swap them when the decoded left is greater than the decoded right. The statement requires the swap, and without it a query can be empty or reversed. A second common error is using the $k$-th next occurrence instead of the $(k + 1)$-th and counting `> r`; that drops one occurrence per type, because the $k$-th next occurrence is still inside the range whenever the type reaches the cap.

## Practice progression

1. **Recognition.** Given a statement, decide whether a merge sort tree applies. Look for a static array, a threshold in the query, and a count or an order statistic over a contiguous range.
2. **Direct application.** Implement the build and the rank query. Verify against a brute-force count on small random arrays, including duplicates and negative values.
3. **Order statistics.** Add the binary search over the value axis. Check $k = 1$, $k = r - l + 1$, and a range whose values are all equal.
4. **Aggregation.** Add the prefix sums beside each sorted list and answer "the sum of the values at most $x$". Check the 64-bit boundary with values near $10^9$ and $n$ near $200\,000$.
5. **Transformation.** Solve the distinct-values problem with the `prev` array, then the capped-frequency problem with the $k$-th previous occurrence. Both reduce to a rank query over a transformed array.
6. **Comparison.** Solve the same order-statistic problem with a wavelet tree or a persistent segment tree, and compare the code size, the memory, and the constant factor. The comparison is the lesson: the merge sort tree is the version that is easy to write, and the other structures are the versions that are fast at scale.
7. **Transfer.** Use the tree on an Euler tour to answer subtree queries, or on a grid to count points in a rectangle. The position axis changes; the sorted lists do not.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does each node of a merge sort tree store, and how is it built? (Key insight, Algorithm derivation)
2. Why does the rank query visit $O(\log n)$ nodes, and why does each node cost a binary search? (Complexity analysis)
3. Why is `upper_bound` the right search for "at most $x$", and what changes for "less than $x$"? (Implementation walkthrough)
4. Why is the k-th smallest the least value whose rank reaches $k$? (Correctness proof)
5. What is the total size of all the sorted lists, and why? (Complexity analysis)
6. Why is the array required to be static, and what does a point update cost? (Why this fails)
7. When is the offline sweep better than the tree, and what makes it unavailable? (Naive approach, Algorithm selection)
8. How do you answer the sum of the values at most $x$ with the same tree? (Variants and extensions)
9. How does the distinct-values problem become a rank query? (Worked problems)
10. What goes wrong with `(low + high) / 2` for negative bounds? (Step-by-step execution, Common mistakes)
11. Why does the value-axis variant descend in $O(\log^2 n)$ while the position-axis tree needs a binary search over values? (Variants and extensions)
12. What are the two memory costs of the tree, and how large are they at $n = 200\,000$? (Complexity analysis)

## Further reading

- The structure that the merge sort tree extends is the [segment tree](/algorithms/range-queries/segment-tree), and its article develops the decomposition that the rank query reuses.
- The structure for invertible range sums with point updates is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), which is smaller but cannot filter by a value threshold.
- The constant-time static structure for minima and maxima is the [sparse table](/algorithms/range-queries/sparse-table), and its article explains why it cannot count above a threshold.
- The query that the order statistic depends on is [binary search](/algorithms/searching/binary-search), including the boundary conventions for duplicates and negative values.
- The preprocessing that turns large values into ranks is [coordinate compression](/algorithms/arrays/coordinate-compression), which reduces the value binary search from $\log C$ steps to $\log n$.
- The offline alternative for many threshold queries is [parallel binary search](/algorithms/advanced/parallel-binary-search), which combines a Fenwick tree with a round of queries instead of a sorted-list tree.
- The offline alternative for unusual range queries is [Mo's algorithm](/algorithms/range-queries/mos-algorithm), which moves the endpoints instead of indexing the values.
- The sum that the first worked problem generalizes is the [prefix sum](/algorithms/arrays/prefix-sums), which answers the unfiltered version in constant time.
- Every listing in this article, in all six languages, is collected on the [merge sort tree source page](/implementations/range-queries-merge-sort-tree/).
