---
id: range-queries.persistent-segment-tree
title: Persistent segment trees
summary: Keep one frequency segment tree per prefix of a static array, copying only the changed path, so the k-th smallest value in any subarray is found by subtracting two versions.
division: [gold, platinum]
subjects: [range-queries]
level: advanced
importance: advanced-technique
keywords:
    [
        persistent segment tree,
        chairman tree,
        functional segment tree,
        prefix versions,
        k-th smallest,
        order statistic,
        range query,
        coordinate compression,
    ]
prerequisites:
    required: [range-queries.segment-tree, arrays.coordinate-compression]
    recommended: [foundations.sorting, searching.binary-search, range-queries.merge-sort-tree]
complexity:
    time: "O(n log n) to build; O(log n) per query"
    space: "O(n log n)"
assumptions:
    - The array is static, so a version is never modified after it is built.
    - The values are coordinate-compressed, so the leaves index ranks rather than native values.
    - The queries are order statistics over a contiguous subarray, which the difference of two prefix versions represents.
implementations: range-queries.persistent-segment-tree
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/range-queries.persistent-segment-tree.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

A persistent segment tree keeps every historical state of a segment tree and shares the parts that did not change. In the range-query setting the states are the prefixes of a static array, so there is one version per prefix. The version for prefix $i$ is a frequency tree over the ranks of $a_1, \ldots, a_i$: each leaf counts how many times its value occurs in that prefix, and each internal node stores the sum of its children.

The version is built from the previous one by a single point increment. Only the root-to-leaf path of the new value changes, so only that path is copied; every untouched sibling is linked back into the previous version and reused. One insertion therefore allocates $O(\log m)$ nodes rather than $O(m)$, where $m$ is the number of distinct values.

The query uses two versions at once. The frequency tree of $a_l, \ldots, a_r$ is the node-wise difference of version $r$ and version $l - 1$, because the earlier prefix cancels. A single descent follows that difference: at each node, the number of range values in the left half decides whether the $k$-th smallest lies left or right, and the right branch subtracts that number from $k$.

The build costs $O(n \log m)$ time and allocates $O(n \log m)$ nodes, and a query costs $O(\log m)$. Persistence is what removes the extra logarithmic factors that a [merge sort tree](/algorithms/range-queries/merge-sort-tree) pays, and its memory is the price. This is the standard structure for the $k$-th smallest value in a subarray when the queries must be answered online.

## Problem motivation

A laboratory keeps a fixed log of $n$ measurements, one per day, and never edits the log. A reviewer asks a stream of questions of the form "what was the $k$-th smallest measurement between day $l$ and day $r$?" The questions arrive one at a time, and each one may be encrypted with the previous answer, so they cannot be sorted or answered out of order.

The constraints decide the technique.

- $1 \le n \le 200\,000$ measurements.
- $1 \le q \le 200\,000$ questions.
- $|a_i| \le 10^9$, so a frequency array indexed by the measurement itself cannot be allocated.
- The questions are online, so an offline sweep is not available.

Copying the queried segment and sorting it costs $O(n \log n)$ per question in the worst case, which is roughly $7 \cdot 10^{11}$ comparisons when $n = q = 200\,000$. That is far beyond a contest time limit. A prefix-sum table answers a sum immediately, but an order statistic is not a sum and cannot be recovered by subtraction of two totals.

A [segment tree](/algorithms/range-queries/segment-tree) over the positions stores one aggregate per node. An order statistic needs the whole multiset of the range, not one aggregate, so each node would have to store its sorted values, which is exactly the merge sort tree and costs $O(\log^2 n)$ per rank query and another logarithmic factor for the binary search over values. A [Fenwick tree](/algorithms/range-queries/fenwick-tree) over the values answers a global rank in $O(\log n)$, but it has forgotten where the values were, so it cannot restrict the count to $[l, r]$.

The query has two independent axes: a position interval and a value order. A structure that indexes one axis with versions and the other with a segment tree is the smallest object that answers both in logarithmic time. That object is the persistent segment tree over prefixes.

## Recognition patterns

A persistent segment tree over prefixes is the right tool when all of the following hold.

- The array is **static**: no point updates, no range updates, no deletions.
- The query is an **order statistic** in a contiguous range: the $k$-th smallest, the $k$-th largest, or a value at a given rank.
- The query can be phrased as a **difference of two prefixes**, so that two versions contain everything the answer needs.
- The queries must be answered **online**, or the intended solution is a persistent structure rather than an offline sweep.
- The values are **not bounded by a small constant**, so the leaves must index compressed ranks rather than native values.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Any point update between queries | A prefix version is frozen, so a dynamic structure is needed instead |
| Only range sums | A Fenwick tree is smaller and faster |
| Only range minima or maxima | A plain segment tree or a sparse table is enough |
| All queries known in advance | Parallel binary search with a Fenwick tree uses less memory |
| $n \le 2\,000$ | Copying and sorting each range is fast enough |
| Values form a small dense set and $n$ is small | A prefix count table is simpler |
| Memory is tight at $n = 200\,000$ | A wavelet tree stores the same information in fewer bits |
| The query asks for a count at most $x$ | The same versions answer it, but a merge sort tree also works |
| The query is a range minimum with a depth limit | The persistent tree can be built over depths instead of prefixes |

The phrases in a statement that signal this technique are "the $k$-th smallest number in $a_l, \ldots, a_r$", "the median of the subarray", "answer the queries online", and "the queries are encrypted with the previous answer". The phrase that rules it out is "change the value at position $i$", because that would create a new version in the middle of the history rather than at the end.

<Synonyms terms="persistent segment tree, chairman tree, functional segment tree, prefix persistent segment tree, k-th smallest in range" />

## Naive approach

The baseline copies the queried range and sorts it.

```cpp
long long kthSmallest(std::vector<long long> range, int k) {
    std::sort(range.begin(), range.end());
    return range[k - 1];
}
```

Copying costs $O(r - l + 1)$ and sorting costs $O((r - l + 1) \log(r - l + 1))$. The method is correct for any values, including duplicates and negatives, and it is the reference implementation for a differential test. It is also the method to use when $n$ is small, because it needs no preprocessing at all.

The second baseline is a merge sort tree. Every node of a segment tree over the positions stores the sorted values of its interval, and a rank query binary searches the nodes that cover the range. Finding the $k$-th smallest then binary searches the value axis and calls the rank query at every step, which costs $O(\log C \log^2 n)$ for a value range of width $C$. It is a good baseline and a good fallback, but it pays more than one logarithm for every query.

The third baseline is a table of prefix counts. For every value and every prefix, store how many times the value occurs. The table has $O(nm)$ entries, which is $4 \cdot 10^{10}$ for the stated constraints, and even if it fit, finding the $k$-th smallest would still require a scan over the values.

## Key insight

The first observation is that the frequency tree of a prefix can be built incrementally. Going from prefix $i - 1$ to prefix $i$ changes exactly one leaf: the count of $\rho(a_i)$ increases by one, where $\rho$ maps a value to its rank among the distinct values. Every ancestor of that leaf increases by one, and nothing else changes.

The second observation is that the change is a single root-to-leaf path. If the tree is copied only along that path, the previous version remains intact and can still be queried. This is the persistence trick: the new version shares every subtree that the update did not touch.

The third observation is that the difference of two versions is the tree of the range. If $\operatorname{cnt}_i(v)$ is the count stored at node $v$ in version $i$, then

$$
\operatorname{cnt}_r(v) - \operatorname{cnt}_{l-1}(v) \;=\; \#\{\, p \in [l, r] : \rho(a_p) \in I(v) \,\},
$$

where $I(v)$ is the interval of ranks covered by $v$. Values inserted before $l$ appear in both versions and cancel; values inserted after $r$ appear in neither. What remains is exactly the multiset of the range.

Now the query is one descent. At a node covering ranks $[lo, hi]$ with midpoint $mid$, the left child covers $[lo, mid]$, and the number of range values in that half is

$$
d \;=\; \operatorname{cnt}_r(\operatorname{left}(v)) - \operatorname{cnt}_{l-1}(\operatorname{left}(v)).
$$

If $k \le d$, the $k$-th smallest is in the left half. Otherwise it is the $(k - d)$-th smallest in the right half. The descent reaches a leaf in $\lceil \log_2 m \rceil$ steps, and the leaf identifies the answer's rank.

The point that is easy to miss is that the two versions are not merged or rebuilt. They are walked down together, with one pointer per version, and the subtraction happens at every node. Persistence turns the position interval into a difference of two roots, and the segment tree turns the value order into one root-to-leaf walk.

## Visual intuition

Draw the versions as a chain of roots, with each new root pointing at a freshly copied path and at subtrees borrowed from earlier roots.

```text
root_1 -> [1,4] count 1
            |-- left  [1,2] count 1 (new) -> leaf 2 (new)
            `-- right [3,4] count 0 (empty)

root_2 -> [1,4] count 2
            |-- left  [1,2] count 2 (new) -> leaf 1 (new), leaf 2 (shared)
            `-- right [3,4] count 0 (shared with root_1)

root_3 -> [1,4] count 3
            |-- left  [1,2] count 2 (shared with root_2)
            `-- right [3,4] count 1 (new) -> leaf 3 (new)
```

The sharing is visible in the diagram: the right subtree of `root_2` is the same object as the right subtree of `root_1`, and the left subtree of `root_3` is the same object as the left subtree of `root_2`. A query that touches a shared subtree reads the counts of the version that owns the root, because the subtree is never modified again.

The second picture is the query. Imagine the two versions as two copies of the same skeleton, one drawn above the other. The query holds one finger on each skeleton and moves both fingers to the left child or both to the right child. At every node it looks at the difference of the left counts under the fingers, and that difference is the number of range values in the left half. The fingers never separate: they always visit the same node position in the two versions, even though the nodes themselves are different objects.

The worked example below makes the picture concrete. The array is $a = [3, 1, 4, 1, 5]$, whose distinct values are $1, 3, 4, 5$, so the ranks are $2, 1, 3, 1, 4$. The tree over ranks has four leaves and three levels.

| Version $i$ | Inserted rank | Root count | Left half $[1,2]$ | Right half $[3,4]$ |
| ----------- | ------------- | ---------- | ----------------- | ------------------ |
| 0           | none          | 0          | 0                 | 0                  |
| 1           | 2             | 1          | 1                 | 0                  |
| 2           | 1             | 2          | 2                 | 0                  |
| 3           | 3             | 3          | 2                 | 1                  |
| 4           | 1             | 4          | 3                 | 1                  |
| 5           | 4             | 5          | 3                 | 2                  |

Read the table down the last two columns and the prefix frequencies are visible. The jump from version 3 to version 4 changes only the left half, because rank $1$ lies there; the right half stays at $1$ and its nodes are shared. The jump from version 4 to version 5 changes only the right half, so the left half is shared instead.

## Formal model

Let $v_1 < v_2 < \cdots < v_m$ be the distinct values of the array, sorted. The **rank** of a value $x$ is $\rho(x) = 1 + \#\{\, j : v_j < x \,\}$, so equal values receive equal ranks and every rank lies in $[1, m]$.

::: math definition Definition
A **persistent node** is a triple $(\operatorname{left}, \operatorname{right}, \operatorname{cnt})$, where $\operatorname{left}$ and $\operatorname{right}$ are node indices and $\operatorname{cnt}$ is a nonnegative integer. Node $0$ is the **empty node**, with $\operatorname{left}(0) = \operatorname{right}(0) = 0$ and $\operatorname{cnt}(0) = 0$.
:::

::: math definition Definition
A **version** $T_i$ is a binary tree of persistent nodes whose root is $r_i$. It covers the rank interval $[1, m]$, and every node $u$ in it covers a subinterval $[lo, hi]$. A leaf has $lo = hi$. The node's count is the number of positions $p \le i$ with $\rho(a_p)$ in its interval.
:::

::: math definition Definition
For a query $(l, r, k)$ with $1 \le l \le r \le n$ and $1 \le k \le r - l + 1$, the **answer** is the value $v_j$ such that exactly $k - 1$ positions $p \in [l, r]$ have $\rho(a_p) < j$ and at least one has $\rho(a_p) = j$.
:::

::: math lemma Lemma
For every $i \ge 0$ and every node $u$ of $T_i$ covering $[lo, hi]$,

$$
\operatorname{cnt}_i(u) \;=\; \#\{\, p \le i : lo \le \rho(a_p) \le hi \,\}.
$$
:::

::: math lemma Lemma
For every $1 \le l \le r \le n$ and every node position $u$ that exists in both $T_r$ and $T_{l-1}$,

$$
\operatorname{cnt}_r(u) - \operatorname{cnt}_{l-1}(u) \;=\; \#\{\, p \in [l, r] : lo(u) \le \rho(a_p) \le hi(u) \,\}.
$$
:::

::: math lemma Lemma
Let $u$ be a node covering $[lo, hi]$ with $lo < hi$, and let $d$ be the difference of the left-child counts of the two versions at $u$. If $k \le d$, the $k$-th smallest rank of the range lies in $[lo, mid]$; otherwise the $(k - d)$-th smallest rank of the range lies in $[mid + 1, hi]$.
:::

The three lemmas are the whole model. The first is the build invariant, the second is the subtraction that turns prefixes into a range, and the third is the descent. The next sections prove them and turn them into code.

## Algorithm derivation

The state is an array of persistent nodes. The build starts with the empty version, whose root is node $0$, and inserts the values one at a time.

```text
build:
    roots[0] = 0
    for i = 1 to n:
        roots[i] = update(roots[i - 1], 1, m, rank(a[i]))

update(previous, lo, hi, position):
    node = allocate()
    left[node] = left[previous]
    right[node] = right[previous]
    count[node] = count[previous] + 1
    if lo < hi:
        mid = (lo + hi) / 2
        if position <= mid:
            left[node] = update(left[previous], lo, mid, position)
        else:
            right[node] = update(right[previous], mid + 1, hi, position)
    return node

kth(before, after, k):
    lo = 1
    hi = m
    while lo < hi:
        mid = (lo + hi) / 2
        d = count[left[after]] - count[left[before]]
        if k <= d:
            before = left[before]
            after = left[after]
            hi = mid
        else:
            k = k - d
            before = right[before]
            after = right[after]
            lo = mid + 1
    return lo
```

The update copies the previous node before changing anything. The copy inherits both children, so the untouched child is shared with the previous version, and the touched child is replaced by the result of the recursive call. The count of the copy is the previous count plus one, because exactly one new value has entered its interval. At the leaf, `lo = hi`, and the recursion stops.

The query never allocates. It subtracts the counts of the two roots at each level, and the difference of the two versions is what makes the range appear. The `before` version is $T_{l-1}$, and the `after` version is $T_r$.

::: math invariant Invariant
After the insertion of $a_i$, version $T_i$ satisfies Lemma 1 for every node it contains, and every node of $T_{i-1}$ still satisfies the lemma for $i - 1$.
:::

The invariant has two halves, and the second half is the persistence obligation. The new version must be correct for the new prefix, and the old version must remain correct for the old prefix. Copying before mutating is what preserves the second half. A single mutation of a shared node would satisfy the first half and destroy the second.

### Why a single tree over the positions is not enough

A normal segment tree over the positions can answer a range sum because a sum is associative and has an inverse: the range sum is the difference of two prefix sums. An order statistic has no inverse in that sense. Knowing the total of $a_1, \ldots, a_r$ and the total of $a_1, \ldots, a_{l-1}$ says nothing about which values lie between them; the counts of the individual values must be subtracted one by one.

The persistent tree stores a separate frequency tree per prefix, so the subtraction is done at every node of the value tree, where the counts live. The price is the $n$ versions; the sharing keeps that price at $O(n \log m)$ rather than $O(nm)$.

## Step-by-step execution

Continue with $a = [3, 1, 4, 1, 5]$ and the ranks $[2, 1, 3, 1, 4]$. The distinct values are $[1, 3, 4, 5]$, so $m = 4$ and each insertion copies three nodes: the root $[1,4]$, one half $[1,2]$ or $[3,4]$, and one leaf.

1. Insert rank $2$. The path is $[1,4] \to [1,2] \to$ leaf $2$. Three nodes are allocated, and each receives count $1$; the other child of the left half is the empty node. `roots[1]` is the new root.
2. Insert rank $1$. The path is $[1,4] \to [1,2] \to$ leaf $1$. The root and the left half are copied and their counts become $2$; the new leaf $1$ has count $1$; the right half of the root is shared with version $1$ and still has count $0$. `roots[2]` is the new root.
3. Insert rank $3$. The path is $[1,4] \to [3,4] \to$ leaf $3$. The root count becomes $3$, the right half becomes $1$, the new leaf $3$ becomes $1$, and the left half is shared with version $2$. `roots[3]` is the new root.
4. Insert rank $1$. The path is again $[1,4] \to [1,2] \to$ leaf $1$. The root count becomes $4$, the left half becomes $3$, and leaf $1$ becomes $2$; the right half is shared with version $3$. `roots[4]` is the new root.
5. Insert rank $4$. The path is $[1,4] \to [3,4] \to$ leaf $4$. The root count becomes $5$, the right half becomes $2$, and leaf $4$ becomes $1$; the left half is shared with version $4$. `roots[5]` is the new root.

The total allocation is $1 + 5 \cdot 3 = 16$ nodes for five insertions, whereas five independent trees would need $5 \cdot 7 = 35$ nodes for a complete tree of four leaves.

Now query $(l, r, k) = (2, 5, 3)$, which asks for the third smallest of $[1, 4, 1, 5]$. The sorted range is $[1, 1, 4, 5]$, so the answer is $4$.

1. Start with `before = roots[1]` and `after = roots[5]`, covering $[1,4]$. The difference of the left-child counts is $3 - 1 = 2$, the number of range values in $\{1, 3\}$. Since $k = 3 > 2$, the answer is in the right half, and $k$ becomes $3 - 2 = 1$.
2. Move both pointers to their right children, covering $[3,4]$. The difference of the left-child counts is $1 - 0 = 1$, the number of range values equal to $4$. Since $k = 1 \le 1$, the answer is in the left half.
3. Move both pointers to their left children, which are the leaves for rank $3$. The interval is a single rank, so the descent stops. Rank $3$ is the value $4$, which is the answer.

A second query, $(2, 4, 2)$, asks for the second smallest of $[1, 4, 1]$. The sorted range is $[1, 1, 4]$, so the answer is $1$.

1. `before = roots[1]`, `after = roots[4]`, covering $[1,4]$. The left difference is $3 - 1 = 2$, the two range values in $\{1, 3\}$. Since $k = 2 \le 2$, go left.
2. At $[1,2]$, the left-child difference is $2 - 0 = 2$, the two range values equal to $1$. Since $k = 2 \le 2$, go left.
3. The leaf is rank $1$, whose value is $1$.

A third query, $(3, 3, 1)$, asks for the only value at position $3$, which is $4$. The descent goes right at the root because the left difference is $0$, then goes left at $[3,4]$ because the difference at rank $3$ is $1$, and stops at the leaf for rank $3$.

## Correctness proof

::: math theorem Theorem
For every query $(l, r, k)$ with $1 \le l \le r \le n$ and $1 \le k \le r - l + 1$, the procedure above returns the $k$-th smallest value of $a_l, \ldots, a_r$.
:::

::: math proof Proof
The proof has three parts: the versions are correct, the subtraction is correct, and the descent is correct.

_First, version $T_i$ satisfies Lemma 1._ The proof is induction on $i$. Version $T_0$ is the empty node and satisfies the claim vacuously. Suppose $T_{i-1}$ satisfies it. The update copies the path to the leaf of $\rho(a_i)$ and increments the count of every node on that path. A node on the path covers an interval containing $\rho(a_i)$, so its set of counted positions gains exactly the new position $i$, and its count increases by one. A node off the path is shared with $T_{i-1}$ and its interval does not contain $\rho(a_i)$, so its set of counted positions does not change and its count is unchanged. Every node of $T_i$ therefore counts exactly the positions of the new prefix in its interval. Because the update copies before writing, no node of $T_{i-1}$ is modified, so the old version still satisfies the claim for $i - 1$.

_Second, the difference of two versions is the range._ By the first part, the count at a node $u$ in $T_r$ is the number of positions $p \le r$ whose rank lies in the interval of $u$, and the count in $T_{l-1}$ is the same count for $p \le l - 1$. The difference is the number of positions $p$ with $l \le p \le r$ whose rank lies in that interval, which is the range count. This is Lemma 2.

_Third, the descent returns the answer._ The descent maintains the invariant that $k$ is at most the number of range values in the current rank interval, and the proof is induction on the length of that interval. At a leaf, the interval is a single rank $j$, and the range count at the leaf is the number of positions in the range with rank $j$. If the descent has reached this leaf with $k \ge 1$ and $k$ no larger than the count at the leaf, then the $k$-th smallest is $v_j$. At an internal node, let $d$ be the difference of the left-child counts. By Lemma 2, $d$ is the number of range positions whose rank lies in the left half. If $k \le d$, the $k$-th smallest of the range lies in the left half, and the left child is entered with the same $k$. If $k > d$, the first $d$ values of the sorted range lie in the left half, so the answer is the $(k - d)$-th smallest of the right half, and the right child is entered with $k - d$. The interval shrinks at every step, so the descent terminates at the correct leaf.

Combining the three parts, the leaf returned by the descent is the rank of the $k$-th smallest range value, and the table lookup prints the corresponding value. $\square$
:::

::: math proof Proof of Lemma 3
The left child of a node covering $[lo, hi]$ covers $[lo, mid]$, and the right child covers $[mid + 1, hi]$. By Lemma 2, the difference of the left-child counts is the number of range positions in $[lo, mid]$. If $k \le d$, those $d$ values are the first $d$ values of the sorted range restricted to $[lo, hi]$, so the $k$-th smallest is among them. If $k > d$, the answer is beyond them, and removing the $d$ values leaves a range whose $k - d$-th smallest is the original $k$-th smallest. $\square$
:::

The persistence obligation deserves one more sentence. The proof of the first part uses the fact that a shared node is never modified after it is created. In the implementation, every update allocates a fresh node, copies the two child indices, and writes only to the fresh node. No code path writes to a node that already existed, so the shared subtrees are immutable.

## Complexity analysis

**Build: $O(n \log m)$.** Each insertion follows one root-to-leaf path of length at most $\lceil \log_2 m \rceil + 1$, and each step allocates one node and does constant work. Coordinate compression costs $O(n \log n)$ for the sort, which is dominated by the build when $m$ is close to $n$.

**Query: $O(\log m)$.** The descent halves the rank interval at every step and never branches. It reads two child counts and two node indices per level, so the constant is small.

**Space: $O(n \log m)$.** The node pool holds

$$
1 + n \left( \lceil \log_2 m \rceil + 1 \right)
$$

nodes, where the extra one is the empty node. For $n = 200\,000$ and $m = 200\,000$, the height is $18$, so the pool holds about $3.8$ million nodes. Three 32-bit arrays over that pool occupy about $45.6$ MB, plus the roots and the compressed values. The bound is $O(n \log n)$ because $m \le n$.

**Stack: $O(\log m)$.** The recursive update uses one frame per level, so the depth is at most $19$ for the largest stated input.

::: math complexity Complexity
A persistent segment tree over the prefixes of an array of $n$ values with $m$ distinct values builds in $O(n \log m)$ time and space, and answers a $k$-th smallest range query in $O(\log m)$ time.
:::

The width of the counters is part of the analysis. A node count never exceeds $n$, so a 32-bit signed integer is enough for every realistic input; the original values may reach $10^9$ in absolute value, which also fits a 32-bit signed integer, but the implementations store them in 64-bit types so that the same code can be reused when the value range grows. The rank, not the value, is what the tree indexes.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| $k$-th smallest, static, online | Persistent segment tree or wavelet tree |
| $k$-th smallest, static, offline | Parallel binary search with a Fenwick tree |
| Count of values at most $x$ in a range | Wavelet tree, persistent segment tree, or merge sort tree |
| Sum of values at most $x$ in a range | Persistent segment tree with sums, or merge sort tree with prefix sums |
| Range minimum or maximum | Sparse table or plain segment tree |
| Point updates and range sums | Fenwick tree |
| Point updates and $k$-th smallest | Fenwick tree of dynamic segment trees |
| Distinct values in a range | Persistent tree over last occurrences, or offline Fenwick sweep |
| $n \le 2\,000$ | Copy and sort each range |
| Memory is the binding constraint | Wavelet tree |

The choice between the persistent tree and the [merge sort tree](/algorithms/range-queries/merge-sort-tree) is a choice between one logarithm and memory. The merge sort tree stores $O(n \log n)$ values as sorted lists and answers a rank query in $O(\log^2 n)$; the persistent tree stores $O(n \log n)$ nodes and answers the order statistic in $O(\log n)$. The persistent tree is faster and uses three integers per node, which is often more than the merge sort tree's payload, so the memory limit decides the winner.

The choice against a wavelet tree is similar. A wavelet tree answers the same queries in $O(\log \sigma)$ with a compact level structure, but its construction and its rank bookkeeping are more intricate. When the persistent tree fits in memory, it is the shorter program; when it does not, the wavelet tree is the next tool to reach for.

## Reference implementations

The manifest publishes one `program` variant per language, and every variant implements the same contract.

- The first line holds $n$ and $q$.
- The second line holds the $n$ values.
- Each of the next $q$ lines holds $l$, $r$, and $k$, with $1 \le l \le r \le n$ and $1 \le k \le r - l + 1$.
- For each query, the program prints the $k$-th smallest value in $a_l, \ldots, a_r$ on its own line.

The six programs build the same version chain. They compress the values, allocate a node pool of $(n + 1)(\lceil \log_2 m \rceil + 2) + 1$ entries, and treat node $0$ as the empty node. The update copies one path and returns the new root; the query is an iterative descent over the two roots.

The C variant uses `calloc` for the three node arrays, `qsort` and a hand-written lower bound for the compression, and frees every array after the last query. The C++ variant uses `std::vector`, `std::sort`, `std::unique`, and `std::lower_bound`, and keeps the update inside a small class. The Java variant uses `int` arrays, a byte scanner instead of `java.util.Scanner`, and a `StringBuilder`; `System.lineSeparator()` keeps its output identical to the other five. The Python variant uses lists, `sorted(set(...))`, and `bisect_left`, and the recursive update stays below the default recursion limit. The Pascal variant uses dynamic arrays, a bottom-up merge sort, one `Read` argument per value, and `Int64` values, so it compiles under pas2js without `IOResult` or 128-bit integers. The JavaScript variant uses `Int32Array` buffers and reads standard input through the stream events; it carries the educational note required of a language that is not a USACO submission language, as does the Pascal variant.

The `program` variants are marked `unverified` in the manifest. The fixture file beside the article supplies three cases: duplicates and interior order statistics, negative values and both boundaries, and a single position queried repeatedly. The test harness compiles every variant, runs all three cases, and requires the six outputs to agree.

## Recursion decision

The update is recursive in all six implementations. It walks one root-to-leaf path and must return the new node index to the parent, so a loop would need an explicit path stack to relink the parents on the way back. The recursion is the shorter and clearer form, and its depth is the height of the tree.

The query is a loop in all six implementations. It is a single descent with two pointers and no return value, and every level does the same subtraction, so a loop is the natural shape. The query is also the hotter of the two operations, and the loop keeps it free of call overhead.

The depth bound is what makes the recursion safe. A tree over $m \le 200\,000$ ranks has height at most $18$, so the update uses at most $19$ frames. That is far below the default stack of every language in the set and below Python's default recursion limit of $1000$. The Pascal implementations are compiled by pas2js, which supports recursion, and the depth is small enough that the compiled JavaScript cannot exhaust the stack either.

| Language | Update | Query | Reason |
| --- | --- | --- | --- |
| C and C++ | Recursive | Loop | The path copy needs the return value; the query does not |
| Java | Recursive | Loop | The JIT inlines the short recursion, and the loop keeps the hot query flat |
| Python | Recursive | Loop | Depth $19$ is far below the limit, and the loop avoids a function call per level |
| Pascal | Recursive | Loop | pas2js supports the recursion, and the bottom-up sort keeps the build iterative |
| JavaScript | Recursive | Loop | V8 handles depth $19$ easily, and the loop keeps the query allocation-free |

The only place where recursion could become a problem is the compression sort. The implementations avoid it: C and C++ use library sorts, Java uses `Arrays.sort`, Python uses `sorted`, JavaScript uses the built-in sort, and Pascal uses a bottom-up merge sort that never recurses.

## Implementation walkthrough

Five details decide whether the structure is correct and whether it fits in memory.

**The empty node.** Node $0$ is a real array position with count $0$ and both children equal to $0$. Every array is zero-initialized, so the empty node needs no setup. The first insertion calls `update(0, 1, m, position)`, copies node $0$, and works without a special case. The same convention makes the leaf children of a real leaf harmless: they are never read by the query because the descent stops at `lo = hi`.

**The capacity.** The pool must hold every node that will ever be allocated. With $m$ distinct values, one insertion allocates $\lceil \log_2 m \rceil + 1$ nodes, and the empty version owns node $0$. The formula used by the implementations is

```cpp
int height = 0;
while ((1LL << height) < m) {
    ++height;
}
int capacity = static_cast<int>((n + 1LL) * (height + 2) + 1);
```

The extra term is deliberate slack. An off-by-one in the height formula is the most common cause of a crash or a silent memory corruption, and the slack costs a few thousand integers.

**The compression.** The tree indexes ranks, not values. Sorting a copy and erasing the duplicates produces the rank table; `lower_bound` maps each value to its rank. The original array must be kept, because the leaf returns a rank and the output is the value at that rank.

```python
ordered = sorted(set(values))
position = bisect_left(ordered, value) + 1
```

**The version indexing.** `roots[0]` is the empty version, and `roots[i]` is the version after inserting the first $i$ values. A query on $[l, r]$ uses `roots[l - 1]` and `roots[r]`. The `l - 1` is not optional: using `roots[l]` drops the value at position $l$ from the range.

**The branch arithmetic.** When the descent goes right, it subtracts the left count from $k$. Forgetting the subtraction makes every answer that lands in a right subtree too large, and the mistake is invisible when all values are distinct and $k$ happens to be small enough that the left count is zero.

The query itself is short enough to read in one screen:

```cpp
while (low < high) {
    int middle = low + (high - low) / 2;
    int inLeft = count[leftChild[after]] - count[leftChild[before]];
    if (k <= inLeft) {
        before = leftChild[before];
        after = leftChild[after];
        high = middle;
    } else {
        k -= inLeft;
        before = rightChild[before];
        after = rightChild[after];
        low = middle + 1;
    }
}
```

The two pointers `before` and `after` always denote the same rank interval, but they are different nodes in the two versions. The subtraction of their left counts is the only place where the range enters the computation.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `roots[l]` instead of `roots[l - 1]` | The value at position $l$ is dropped from the range | Subtract the prefix of length $l - 1$ |
| Forgetting to subtract the left count when going right | Every answer in a right subtree is too large | Subtract `inLeft` from $k$ before moving |
| Mutating a shared node instead of copying it | An older version changes and later queries read corrupted counts | Allocate a fresh node before writing |
| Allocating only $n$ nodes | The pool overflows during the build | Use the height formula and add slack |
| Treating node $0$ as a real leaf | The empty version has no null child | Keep node $0$ zeroed and never write to it |
| Building one tree per prefix without sharing | The build costs $O(nm)$ time and memory | Copy only the root-to-leaf path |
| Forgetting coordinate compression | The leaf interval is indexed by values, not ranks | Sort, deduplicate, and map with lower bound |
| Printing the rank instead of the value | The answer is an index into the sorted values | Print `values[rank - 1]` |
| Using a 32-bit type for the original values | Values near $10^9$ still fit, but a sum or a widened bound does not | Use 64-bit values and 32-bit counts |
| Recursing over the whole value universe | The depth becomes the value range, not the tree height | Recurse only on ranks $[1, m]$ |

### Why this fails: mutating a shared node

The persistence bug is subtle because the first version answers correctly and only the second one is wrong. Take $a = [1, 1, 2]$, whose ranks are $[1, 1, 2]$, and build version $1$ by inserting rank $1$. Its root covers $[1, 2]$ with count $1$, and its left leaf has count $1$.

Version $2$ inserts rank $1$ again. The correct update copies the root and the left leaf, gives the new root count $2$ and the new leaf count $2$, and shares the right subtree with version $1$. Suppose instead that the update mutates the existing root and the existing left leaf, because they happen to be the nodes on the path. Then version $1$ now claims two values equal to $1$ even though its prefix contains only one.

Query the range $[2, 3]$ with $k = 1$. The correct answer is $1$, the smallest of $[1, 2]$. With the corrupted version $1$, the difference of the root counts is $3 - 2 = 1$ instead of $2$, and the difference of the left counts is $2 - 2 = 0$ instead of $1$. The descent sees an empty left half, goes right, and returns $2$. The structure is not broken; it answered a question about the wrong multiset, because the earlier version was silently edited.

The fix is structural, not a patch: every write in `update` must target a node allocated by that call. A useful discipline is to allocate first, copy the two child indices from the previous node, and only then modify the fresh node's count. If a line of code writes through a node index that was not allocated in the current call, the version chain is already broken.

A second failure has the same flavor and a simpler diagnosis. Using `roots[l]` instead of `roots[l - 1]` subtracts the prefix that already includes position $l$. On $a = [1, 1, 2]$, the query $[1, 2]$ with $k = 2$ should return $1$, the larger of the two ones. The wrong subtraction leaves only position $2$, whose length is one, so $k = 2$ is beyond the effective range and the descent returns $2$. An out-of-range $k$ is the signature of this off-by-one, and it is worth asserting $1 \le k \le r - l + 1$ while testing.

## Variants and extensions

- **The $k$-th largest.** Replace $k$ by $(r - l + 1) - k + 1$ and run the same descent. The tree does not change.
- **The count of values at most $x$.** Let $j$ be the number of distinct values at most $x$. Walk both versions to the leaf for rank $j$, summing the left counts along the path, then add the count at that leaf. The query is $O(\log m)$ and uses the same versions.
- **The sum of values at most $x$.** Store a second aggregate at every node: the sum of the original values in its rank interval. The difference of two versions then gives both a count and a sum, and a prefix walk answers the query in $O(\log m)$. This is the structure behind "sum of the values not greater than $x$ in a range".
- **Distinct values in a range.** Build the versions over right endpoints. At position $i$, add $1$ at $i$ and subtract $1$ at the previous occurrence of $a_i$. The count in version $r$ over $[l, r]$ is the number of distinct values in that range.
- **Subtree queries with a depth limit.** Linearize the tree with an Euler tour, build one version per depth, and query the Euler interval of a subtree. This is the idea behind Codeforces 893F, where a persistent tree over depths answers a subtree minimum.
- **Persistent lazy propagation.** A range update has to copy every node it touches and carry a lazy tag in each copy. The cost becomes $O(\log n)$ new nodes per range update, and the old versions remain queryable. This is the structure behind the "historical sums" family of problems.
- **A persistent array.** Point assignments become $O(\log n)$ new nodes, and the version roots address the whole array. The same copy-on-write idea applies without any frequency interpretation.
- **The wavelet tree.** The compact cousin. It answers the same order-statistic queries in $O(\log \sigma)$ and stores prefix counts per level, which is usually less memory than three integers per node. The trade is a more intricate build.
- **Offline parallel binary search.** When the queries are known in advance, binary search all answers together and use a Fenwick tree for the counts. The complexity is $O((n + q) \log n \log V)$ and the memory is linear, which is often the better contest choice.
- **Dynamic updates.** A Fenwick tree whose cells hold dynamic segment trees, or a segment tree of balanced search trees, supports point updates and $k$-th smallest queries in $O(\log^2 n)$.

## Contest strategy

Under contest pressure, the following procedure avoids the mistakes that cost the most time.

1. Decide whether the array is static and whether the queries are online. If both are true, the persistent tree is a strong candidate; if the queries can be reordered, compare it with parallel binary search.
2. Compress the values before writing the tree. Keep the original array for the output, and never index a leaf by a native value.
3. Compute the height from the number of distinct values, allocate the node pool with slack, and initialize node $0$ to zero.
4. Write `update` once, with the allocate-copy-write order. Write `kth` once, with the subtraction on the right branch. Do not duplicate either routine.
5. Test the boundary cases explicitly: $l = r$, $k = 1$, $k = r - l + 1$, a range that is the whole array, all values equal, and values that are all negative.
6. Write the copy-and-sort baseline and compare on random small arrays. A disagreement is a counterexample, and a single counterexample is worth more than an hour of reading the tree.
7. Check the memory arithmetic before submitting. Three integer arrays of $3.8$ million entries are about $45$ MB, which fits a $64$ MB limit only if the rest of the program is small; if the limit is tighter, switch to a wavelet tree or to the offline method.
8. Use fast input. At $q = 200\,000$, `cin` without synchronization is usually acceptable, but a byte scanner is safer in Java, and Python should read all input at once.

## Worked problems

### Problem 1: K-th Number

**Restatement.** Given an array of $n$ distinct integers and $m$ questions $Q(i, j, k)$, print the $k$-th number in the sorted version of $a_i, \ldots, a_j$. Constraints: $n \le 100\,000$, $m \le 5\,000$, and $|a_i| \le 10^9$.

**Naive baseline.** Copy the subarray and sort it for every question, at a cost of $O(n \log n)$ per question, which is about $8.5 \cdot 10^9$ comparisons in the worst case.

**Insight.** The sorted subarray is the difference of the prefix multisets of $j$ and $i - 1$. A persistent frequency tree over the compressed values stores every prefix multiset in $O(n \log n)$ nodes, and the difference is read by descending the two roots together.

**Derivation.** Compress the values, build `roots[0..n]`, and answer each question with `kth(roots[i - 1], roots[j], 1, m, k)`. The descent compares $k$ with the difference of the left counts and moves left or right.

**Correctness.** The version invariant gives the prefix counts, the difference gives the range counts, and the descent lemma gives the order statistic. The full argument is the correctness proof above.

**Complexity.** $O(n \log n)$ preprocessing, $O(\log n)$ per question, $O(n \log n)$ memory.

**Common wrong approach.** Using `roots[i]` instead of `roots[i - 1]`. The range then starts at $i + 1$, and the first value of every queried range is missing.

### Problem 2: Feed the dogs

**Restatement.** Given $n$ pretty values and $m$ feedings, each feeding chooses an interval $[i, j]$ and an order $k$, and asks for the $k$-th prettiest dog in that interval. The intervals never contain one another completely. Constraints: $n < 100\,001$, $m < 50\,001$, and the values are not distinct.

**Naive baseline.** Copy the interval and sort it for every feeding, at a cost of $O(n \log n)$ per feeding.

**Insight.** The order statistic is over a multiset with duplicates, and the persistent tree stores counts rather than a set, so equal values are handled without any change. The non-nesting condition also permits an offline sweep with a balanced tree, but the persistent structure answers the feedings in the input order and needs no ordering assumption.

**Derivation.** Compress the values, build the prefix versions, and answer each feeding with the same two-root descent. The leaf count is the number of occurrences of that value in the interval, so duplicates are counted correctly.

**Correctness.** The same three lemmas apply. The only difference from Problem 1 is that the leaf count may exceed one, and the descent still lands on the leaf whose cumulative count first reaches $k$.

**Complexity.** $O(n \log n + m \log n)$ time and $O(n \log n)$ memory.

**Common wrong approach.** Deduplicating the values and treating the tree as a set. That silently drops the second and later copies of a repeated value, so the returned order statistic is too large whenever duplicates are present.

### Problem 3: Kth number

**Restatement.** The input starts with the number of test cases. Each case gives an array of $n$ integers and $m$ questions $[s, t, k]$, and asks for the $k$-th smallest number in $a_s, \ldots, a_t$. Constraints: $n, m \le 100\,000$, and the values are not necessarily distinct.

**Naive baseline.** Sort each queried interval. With up to $100\,000$ values and $100\,000$ questions per case, the worst case is far beyond the time limit.

**Insight.** The structure is the same as in the previous two problems, but the node pool and the roots are reused across test cases. Resetting the node counter is enough; the arrays do not have to be reallocated, because every node that is read is written before it is used in the new case.

**Derivation.** For each case, read the values, compress that case's values, reset the node counter to zero, and build the versions from the empty node. Answer the questions with the two-root descent and print the value at the returned rank.

**Correctness.** Each case is an independent instance of the theorem above. Resetting the counter makes the empty node the only reachable node at the start of the case, so the induction starts from a valid empty version.

**Complexity.** $O((n + m) \log n)$ per case and $O(n \log n)$ memory for the largest case.

**Common wrong approach.** Forgetting to reset the node counter between cases. The second case then builds its versions on top of the first case's nodes, and the counts include values that are not in the second array. The answers drift upward and the bug looks like an arithmetic error rather than a reset error.

## Practice progression

1. **Recognition.** Read a statement and decide whether it asks for an order statistic on a static range. Check that the queries are online or that the intended structure is persistent, and rule out a plain segment tree.
2. **Direct application.** Implement the compression, the update, and the query, and verify against copy-and-sort on arrays of length at most ten with duplicates and negatives.
3. **Adaptation.** Answer the $k$-th largest, then the count of values at most $x$, without rebuilding the tree. The same versions should serve all three queries.
4. **Combination.** Add a sum aggregate and answer "the sum of the values at most $x$ in $[l, r]$". Then solve the distinct-values query with a persistent tree over last occurrences.
5. **Memory.** Measure the node count on $n = 200\,000$ and compare it with the formula. Reduce the pool or switch to a wavelet tree when the limit is tight.
6. **Transfer.** Apply the persistence idea to a tree: build versions over depths and answer subtree queries on an Euler tour. Then apply it to a persistent array with point assignments.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does version $i$ store, and how is it obtained from version $i - 1$? (Key insight)
2. Why does one insertion allocate only $O(\log m)$ nodes? (Algorithm derivation)
3. Why is the difference of two versions the frequency tree of a range? (Formal model)
4. What does the descent compare $k$ with, and what does it do on each branch? (Algorithm derivation)
5. Why is node $0$ special, and what would break if it were treated as a real leaf? (Implementation walkthrough)
6. Why does the update copy a node before writing to it? (Correctness proof)
7. How many nodes does the pool need, and where does the formula come from? (Complexity analysis)
8. Why is the array required to be static, and what changes if it is not? (Recognition patterns)
9. When is a merge sort tree preferable to a persistent segment tree? (Algorithm selection)
10. What goes wrong if `roots[l]` is used instead of `roots[l - 1]`? (Common mistakes)

## Further reading

- The structure that this one makes persistent is the [segment tree](/algorithms/range-queries/segment-tree), whose node-and-interval model is the base of the build.
- The static structure with sorted lists at every node is the [merge sort tree](/algorithms/range-queries/merge-sort-tree); it answers the same order statistic with an extra logarithm and often with less memory.
- The compression that maps values to ranks is described in [coordinate compression](/algorithms/arrays/coordinate-compression), and it is the preprocessing step that makes the leaves small.
- The one-logarithm alternative for dynamic prefix sums is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), which is what an offline parallel binary search uses in place of the persistent tree.
- The static range-minimum structure is the [sparse table](/algorithms/range-queries/sparse-table), and the contrast with order statistics shows why a minimum has no inverse.
- The value-axis binary search that a merge sort tree uses is an application of [binary search](/algorithms/searching/binary-search), and the same monotonicity argument underlies the descent here.
- The offline alternative for range queries that can be reordered is [Mo's algorithm](/algorithms/range-queries/mos-algorithm), which maintains a multiset as the interval moves.
- The range-update variant of persistence is described with [lazy propagation](/algorithms/range-queries/lazy-propagation), and the version that allocates nodes only on demand is the [implicit segment tree](/algorithms/range-queries/implicit-segment-tree).
- The block-based alternative that answers order statistics without persistence is [square root decomposition](/algorithms/range-queries/sqrt-decomposition).
