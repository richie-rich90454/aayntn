---
id: range-queries.wavelet-tree
title: Wavelet trees
summary: Stable-partition a static array by the bits of its values at every level, so a range rank query or a range k-th smallest query descends one logarithmic level at a time.
division: [gold, platinum]
subjects: [range-queries]
level: advanced
importance: advanced-technique
keywords:
    [
        wavelet tree,
        wavelet matrix,
        range k-th smallest,
        order statistic,
        range counting,
        rank query,
        stable partition,
        bitvector,
        range quantile,
    ]
prerequisites:
    required:
        [range-queries.merge-sort-tree, searching.binary-search, arrays.coordinate-compression]
    recommended: [range-queries.segment-tree, range-queries.fenwick-tree, foundations.sorting]
complexity:
    time: "O(log sigma) per k-th smallest or rank query; O(n log sigma) to build"
    space: "O(n log sigma) prefix counts, plus O(n) working arrays"
assumptions:
    - The array is static, because a point update has to repair one stable partition at every level.
    - The values are coordinate-compressed to ranks, so the height of the tree is the logarithm of the number of distinct values.
    - A query names a 0-based half-open position range [l, r) and an order k with 1 <= k <= r - l.
implementations: range-queries.wavelet-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="range-queries.wavelet-tree" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="range-queries.wavelet-tree" />

A wavelet tree answers order-statistic questions about a subarray of a static array. It is given $a_0, \ldots, a_{n-1}$ once, and then it must answer queries of the form "what is the $k$-th smallest value among $a_l, \ldots, a_{r-1}$?" and "how many values in that range are below a threshold $x$?" without sorting the range again.

The structure is a binary trie over the bits of the values. The root holds the whole array. At every node, a bit of the value decides whether an element descends to the left child or the right child, and the elements are **stably** partitioned: the left child keeps the relative order of the elements that go left, and the right child keeps the relative order of the elements that go right. Every level stores a bitvector that says which child each element entered, together with a prefix count of the zeros.

A k-th smallest query walks down one level per bit. At a node it reads, in constant time, how many elements of the current position range went left. If that count is at least $k$, the answer is in the left child. Otherwise the answer is in the right child, and its order inside the right child is $k$ minus the number of elements that went left. After one step per bit the value has been reconstructed.

The build costs $O(n \log \sigma)$ time and space, where $\sigma$ is the number of distinct values, and each query costs $O(\log \sigma)$. For $n = 200\,000$ that is eighteen levels and about fourteen megabytes of prefix counts, which is a small price for replacing a sort per query with eighteen array lookups.

The implementation stores the tree **level by level** rather than with pointers. It keeps one sequence per level and stable-partitions the whole sequence by the current bit before moving to the next level, so every zero of a level is written before every one. This layout is usually called a wavelet matrix. It is the same tree, with the pointers replaced by arithmetic on prefix counts, and it is the layout used by all six listings below.

## Problem motivation

A radio telescope records one integer reading per second. The archive is fixed once the observation ends, and analysts ask questions about a span of seconds $[l, r)$.

- What was the $k$-th smallest reading in that span?
- How many readings in the span were below a calibration threshold?
- What was the median reading in the span?

The constraints are the whole problem.

- $1 \le n \le 200\,000$ readings.
- $1 \le q \le 200\,000$ questions.
- $|a_i| \le 10^9$, so the value domain is far too large for an array indexed by value.
- The questions arrive online, in an order that cannot be changed, so an offline sweep that sorts the queries is not available.

A direct answer to the first question copies the span and sorts it, which costs $O(n \log n)$ per query and $2 \cdot 10^5 \cdot 2 \cdot 10^5$ operations in the worst case. A direct answer to the second question scans the span, which is $O(n)$ per query and still too slow.

Several structures almost work. Prefix sums answer a total in constant time, but a threshold query is not a total and a median is not a total either. A [Fenwick tree](/algorithms/range-queries/fenwick-tree) over the values answers a global rank in $O(\log n)$, but it has forgotten where the values were, so it cannot restrict the count to a span. A [merge sort tree](/algorithms/range-queries/merge-sort-tree) does answer both questions, at $O(\log^2 n)$ per rank query and $O(\log C \log^2 n)$ per order statistic, where $C$ is the width of the value range; it is a good answer, and the next section keeps it as the strongest baseline.

The extra factor in the merge sort tree comes from binary searching a sorted list inside every node of a segment tree. A wavelet tree removes that factor by replacing the segment tree over positions with a trie over values. The position range is carried through the trie, so the answer is a single root-to-leaf walk instead of a decomposition into nodes followed by a search in each one.

The trade is that the array must be static. An update would have to change one element's bit at every level, which shifts every later prefix count on that level, so the update costs $O(n)$ per level in the array-based layout. Dynamic variants exist, but they are different structures with different constants, and they belong in the variants section rather than in the core technique.

## Recognition patterns

A wavelet tree is the right tool when all of the following hold.

- The array is **static**: no point updates and no range updates.
- The query is an **order statistic** over a contiguous range: the $k$-th smallest, the $k$-th largest, a median, or a quantile.
- The query is a **rank query**: how many values in a range are below, at most, or equal to a threshold.
- The queries must be answered **online**, or the intended solution is a static range structure rather than an offline sweep.
- The value domain is too large for a frequency array, but the array is small enough to store $\log \sigma$ levels.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Any point update | The static wavelet tree is ruled out; use a Fenwick tree of sorted lists, a dynamic segment tree, or an offline sweep |
| Values bounded by a small $V$ | A prefix-count table over the values is smaller and faster |
| No position restriction, only a global rank | Sort the array once and index the sorted copy |
| Only a range maximum or minimum | A segment tree or a [sparse table](/algorithms/range-queries/sparse-table) is enough; no value trie is needed |
| Only a range sum, with no threshold | Prefix sums are enough |
| $n \le 10^3$ | Copying and sorting the queried range is fast enough |
| All queries known in advance | Sort by one endpoint and sweep a Fenwick tree, or use [Mo's algorithm](/algorithms/range-queries/mos-algorithm) |
| The time limit demands $O(\log n)$ and the memory limit is tight | A wavelet tree is a strong choice; the prefix counts cost $4 n \log \sigma$ bytes, and a succinct bitvector version costs far less |
| The value domain allows 64 bits and compression is inconvenient | A wavelet tree over the raw bits works, at 64 levels instead of $\log \sigma$ |

The phrases in a statement that signal this technique are "the $k$-th smallest element in the subarray", "how many elements are at most $x$ in the range", "find the median of the range", and "answer the queries online". The phrase that rules it out is "add $v$ to position $i$" or "set position $i$ to $v$", because either one is an update.

A second signal is the shape of the intended complexity. When a statement has $n, q \le 200\,000$ and asks for one value per query, an $O(\log^2 n)$ structure is often fast enough, but when the same query is repeated with a binary search over the answer, or when $n$ reaches $10^6$, the extra logarithm starts to matter. The wavelet tree is the structure that removes it without asking for an offline order.

<Synonyms terms="wavelet tree, wavelet matrix, range tree, order statistic tree, range k-th smallest, stable partition tree, quantile tree" />

## Naive approach

The baseline for a k-th smallest query copies the range and sorts the copy.

```cpp
long long kthSmallest(std::vector<long long> range, int k) {
    std::sort(range.begin(), range.end());
    return range[static_cast<std::size_t>(k - 1)];
}
```

This is $O(n \log n)$ per query, it is correct for any array and any order, and it is the reference implementation for a differential test.

The baseline for a rank query scans the range and counts.

```cpp
long long countAtMost(const std::vector<long long>& a, int left, int right, long long limit) {
    long long total = 0;
    for (int i = left; i < right; ++i) {
        if (a[i] <= limit) {
            total += 1;
        }
    }
    return total;
}
```

This is $O(n)$ per query. It is the second reference implementation, and on small inputs it is often faster than the wavelet tree because it has no build cost.

A third baseline is the merge sort tree. Every node of a segment tree stores the sorted values of its interval. A rank query decomposes the range into $O(\log n)$ nodes and binary searches each list, and a k-th smallest query binary searches the value axis on top of the rank query. The bounds are $O(n \log n)$ space, $O(\log^2 n)$ per rank query, and $O(\log C \log^2 n)$ per order statistic. It is the strongest baseline in this article, and it is the one to reach for when the implementation time matters more than the constant factor.

A fourth baseline is the persistent segment tree over the values. Each prefix of the array gets a version, and the version difference answers a rank query in $O(\log n)$. It has the same asymptotic cost as a wavelet tree and a larger constant, and it needs a node per inserted value, which is $O(n \log n)$ nodes. The wavelet tree is the version that stores the same information in flat arrays and needs no pointers.

## Key insight

The first half of the insight is that **one bit of the answer can be decided at a time**.

Compress the values to ranks $0, \ldots, m-1$ and write each rank in binary with $h = \lceil \log_2 m \rceil$ bits, padding with leading zeros. The most significant bit splits the value set into two halves: ranks below $2^{h-1}$ and ranks at least $2^{h-1}$. If a query range contains at least $k$ values from the lower half, then its $k$-th smallest value is in the lower half. Otherwise it is in the upper half, and it is the $(k - z)$-th smallest there, where $z$ is the number of values from the lower half in the range.

The same argument applies at the next bit, inside whichever half was chosen. After $h$ decisions, every bit of the answer's rank is known.

The second half of the insight is what makes the first half computable in constant time per level. Each node stores a bitvector of length equal to its number of elements, with a zero for "went left" and a one for "went right", and a prefix count of the zeros. The number of elements in a position range that went left is the difference of two prefix counts.

That is exactly the rank query of a bitvector, and it costs two array lookups.

The third ingredient, and the one that is usually missed, is **why the partition must be stable**. The query carries a contiguous range of positions, not a set. When the range moves to a child, the positions of its elements in the child's array must again be contiguous, or the two prefix lookups would count elements outside the range.

Stable partitioning gives exactly that. If the elements of a node are $e_0, e_1, \ldots$ and the zeros among them are $e_{i_1}, e_{i_2}, \ldots$ with $i_1 < i_2 < \cdots$, then the zeros keep their relative order, and the positions of the zeros that lie in a contiguous window $[l, r)$ form the contiguous window $[Z(l), Z(r))$ in the child, where $Z$ is the prefix-zero count. The same holds for the ones, with an offset equal to the total number of zeros.

An unstable partition would preserve the set of values in each child but not their order, and the window property would be lost. The query would then have to store a list of positions instead of a range, and the constant-time step would disappear.

The worked example makes the structure concrete. Take

$$
a = [3,\; 2,\; 5,\; 1,\; 7,\; 4,\; 9].
$$

The sorted distinct values are $[1, 2, 3, 4, 5, 7, 9]$, so the ranks are

$$
[2,\; 1,\; 4,\; 0,\; 5,\; 3,\; 6],
$$

and $m = 7$, $h = 3$. Writing the ranks with three bits gives $010, 001, 100, 000, 101, 011, 110$.

## Visual intuition

Draw the tree as a binary trie over the three-bit ranks. The root covers the bit patterns $000$ through $111$; the left child covers the patterns beginning with $0$, the right child the patterns beginning with $1$, and so on. The leaf for each pattern that occurs in the array is the compressed value with that rank.

The level sequences are the key picture. At level $0$ the sequence is the original rank array. The zeros are stable-partitioned to the front, the ones to the back, and the result is the level $1$ sequence. The process repeats until every bit has been used.

| Level | Sequence | Bit used | Zeros | Prefix zeros |
| --- | --- | --- | --- | --- |
| 0 | $[2, 1, 4, 0, 5, 3, 6]$ | most significant | $[2, 1, 0, 3]$ | $[0, 1, 2, 2, 3, 3, 4, 4]$ |
| 1 | $[2, 1, 0, 3, 4, 5, 6]$ | middle | $[1, 0, 4, 5]$ | $[0, 0, 1, 2, 2, 3, 4, 4]$ |
| 2 | $[1, 0, 4, 5, 2, 3, 6]$ | least significant | $[0, 4, 2, 6]$ | $[0, 0, 1, 2, 2, 3, 3, 4]$ |

Read the "Zeros" column as the elements that go left at that level, and the complement as the elements that go right. The zeros are written first, so they form the zero region of the next level, and the ones follow them. The prefix-zero row is what the implementation stores: entry $i$ is the number of zeros among the first $i$ elements of the level sequence, so the number of zeros in $[l, r)$ is the difference of two entries.

The tree shape is worth drawing once more, with the value intervals attached.

```text
                    [000, 111]
                   /          \
          [000, 011]            [100, 111]
          /        \            /        \
     [000,001]  [010,011]  [100,101]  [110,111]
       /   \      /   \      /   \      /   \
     000  001   010  011   100  101   110  111
```

The drawing shows the value intervals, not the storage order; the stored sequence at level $2$ is the global partition from the table. Only the leaves that occur in the array are reached. The rank $7$ has pattern $111$ and is absent, so its leaf is never visited, which is harmless: the query reconstructs a rank that occurs, and the compressed table has an entry for that rank.

The important visual fact is that every node occupies a contiguous block of positions at its level. The root is the whole level. Its zero child is the prefix of zeros of the level, and its one child is the suffix of ones. At the next level the same is true for every node: the zero blocks of all nodes are written first, then the one blocks. Every block is contiguous, and because all zeros of a level precede all ones, one global prefix-zero array per level is enough.

## Formal model

Let $a_0, \ldots, a_{n-1}$ be the values of the array, indexed from zero, and let $v_0 < v_1 < \cdots < v_{m-1}$ be the distinct values in sorted order.

::: math definition Definition
The **rank** of a value $x$ is the index $\rho(x)$ with $v_{\rho(x)} = x$. The array is **compressed** by replacing every $a_i$ with $\rho(a_i)$.
:::

::: math definition Definition
Let $h = \lceil \log_2 m \rceil$, with $h = 0$ when $m = 1$. The **bit** of rank $q$ at level $d$, for $0 \le d < h$, is

$$
b_d(q) \;=\; \left\lfloor \frac{q}{2^{h-1-d}} \right\rfloor \bmod 2 .
$$
:::

::: math definition Definition
The **level sequence** $S_d$ is a sequence of length $n$ of ranks. $S_0$ is the compressed array. Given $S_d$, the sequence $S_{d+1}$ is the concatenation of the elements of $S_d$ whose level-$d$ bit is $0$ in their original relative order, followed by the elements whose bit is $1$ in their original relative order.
:::

::: math definition Definition
The **prefix-zero count** at level $d$ is the array $Z_d$ of length $n + 1$ with

$$
Z_d[i] \;=\; \bigl|\{\, j : 0 \le j < i \text{ and } b_d(S_d[j]) = 0 \,\}\bigr|,
$$

and the **zero total** is $z_d = Z_d[n]$. The wavelet tree stores, for every level, the array $Z_d$ and the number $z_d$.
:::

::: math definition Definition
The **node** of a bit prefix $p$ at level $d$ is the set of positions of $S_d$ whose top $d$ bits equal $p$. Its position set is a contiguous interval, and its value interval is the set of ranks whose top $d$ bits equal $p$.
:::

::: math definition Definition
The **order statistic** $\operatorname{kth}(l, r, k)$ of the half-open range $[l, r)$ is the value that would sit at position $k - 1$ if $a_l, \ldots, a_{r-1}$ were sorted, with $1 \le k \le r - l$.
:::

::: math lemma Lemma
For every level $d$ and every bit prefix $p$, the positions of the node of $p$ form a contiguous interval of $S_d$.
:::

::: math lemma Lemma
For every level $d$ and every range $[l, r)$, the zeros of the range occupy the interval $[Z_d[l], Z_d[r])$ of $S_{d+1}$, and the ones occupy

$$
\bigl[z_d + (l - Z_d[l]),\; z_d + (r - Z_d[r])\bigr).
$$
:::

::: math definition Definition
A partition of a sequence is **stable** if the elements that satisfy a predicate keep their relative order, and the elements that fail it keep theirs. The build of a wavelet tree uses a stable partition at every level.
:::

## Algorithm derivation

The state is the compressed array and the two tables $Z_d$ and $z_d$ for every level. The build processes one level at a time.

```text
S = compressed array
for d = 0 to h - 1:
    Z[d][0] = 0
    zeros = 0
    for i = 0 to n - 1:
        if bit(S[i], d) == 0:
            zeros += 1
        Z[d][i + 1] = zeros
    z[d] = zeros

    write_zero = 0
    write_one = z[d]
    for i = 0 to n - 1:
        if bit(S[i], d) == 0:
            next[write_zero] = S[i]
            write_zero += 1
        else:
            next[write_one] = S[i]
            write_one += 1
    S = next
```

The prefix pass and the partition pass are separate because the position of the first one is not known until all zeros have been counted. A single pass that used a growing buffer would have to insert ones in front of zeros, which is exactly the instability the structure cannot afford.

The query is a loop over the levels. At level $d$, the range $[l, r)$ is a range of positions in $S_d$.

```text
rank = 0
for d = 0 to h - 1:
    zeros_left  = Z[d][l]
    zeros_right = Z[d][r]
    zeros = zeros_right - zeros_left
    if k <= zeros:
        l = zeros_left
        r = zeros_right
        rank = rank << 1
    else:
        k = k - zeros
        l = z[d] + (l - zeros_left)
        r = z[d] + (r - zeros_right)
        rank = (rank << 1) | 1
return v[rank]
```

The branch is the binary search over the value axis, unrolled one bit at a time. The left branch holds the ranks with a zero at this position, and it is chosen when it contains enough elements to cover the order $k$. The right branch is chosen otherwise, and the order is reduced by the number of elements that were skipped on the left.

The mapping formulas are the second lemma. The left child's positions are the zeros before $l$ and before $r$, and the right child's positions are the same counts shifted by the total number of zeros, because every zero is written before every one. The subtraction $l - Z_d[l]$ is the number of ones before $l$, which is the position of the first one of the range inside the right child.

A rank query uses the same walk with a different decision. To count the values in $[l, r)$ whose compressed rank is less than $x$, follow the bits of $x$ from the most significant end.

```text
if x <= 0:
    return 0
if x >= m:
    return r - l

total = 0
for d = 0 to h - 1:
    zeros_left  = Z[d][l]
    zeros_right = Z[d][r]
    zeros = zeros_right - zeros_left
    if bit(x, d) == 1:
        total += zeros
        l = z[d] + (l - zeros_left)
        r = z[d] + (r - zeros_right)
    else:
        l = zeros_left
        r = zeros_right
return total
```

When the bit of $x$ is one, every zero in the current range has a smaller rank at this bit and is therefore smaller than $x$, regardless of the lower bits, so the whole zero count is added and the walk continues into the ones. When the bit is zero, only the zeros can still be smaller, so the walk continues into them without adding anything. The count of values at most a value $y$ is the count of ranks less than $\rho(y) + 1$.

::: math invariant Invariant
After the build, for every level $d$, $Z_d[i]$ is the number of zeros among the first $i$ elements of $S_d$, and $S_d$ is the stable partition of $S_{d-1}$ by bit $d - 1$.
:::

The height is the number of bits needed to write every rank, which is $h = \lceil \log_2 m \rceil$. When $m = 1$, there are no bits to inspect, every query has the same answer $v_0$, and the loop runs zero times. That case must be handled explicitly in languages where a zero-length array is not a valid table, and it is the first edge case to test.

### Why the layout can be level-wise

A pointer-based wavelet tree gives every node its own prefix array. A query starts at the root and follows a pointer at every level. The level-wise layout keeps one array per level and stable-partitions the whole array globally, so every zero of a level is written before every one, and it uses the global prefix counts instead of per-node ones.

The two layouts answer the same queries because the mapping formula is local to the current range. If a range lies inside a node, its zeros lie inside that node's zero block and its ones inside that node's one block, and the global prefix difference counts exactly the same elements as a per-node prefix difference would. The offset $z_d$ is the only thing the global layout adds, and it is exactly the total number of zeros on the level, because every zero of the level is written before every one.

The level-wise layout has two practical advantages. It has no pointers and no per-node allocation, so the whole structure is a handful of rectangular arrays, and a query is a loop over levels with two independent lookups per level. That is friendlier to the cache than a pointer chase, and it makes the C and Pascal versions short enough to audit.

## Step-by-step execution

Continue with the array $a = [3, 2, 5, 1, 7, 4, 9]$, its ranks $[2, 1, 4, 0, 5, 3, 6]$, and the three levels from the visual section.

1. Query $\operatorname{kth}(1, 7, 3)$, which is the third smallest of $[2, 5, 1, 7, 4, 9]$. At level $0$, $l = 1$ and $r = 7$, so $Z_0[1] = 1$, $Z_0[7] = 4$, and the range contains $4 - 1 = 3$ zeros. Since $k = 3 \le 3$, the answer is in the left child; set $l = 1$, $r = 4$, and the first bit of the rank is $0$.
2. At level $1$, $Z_1[1] = 0$ and $Z_1[4] = 2$, so the range contains $2$ zeros. Now $k = 3 > 2$, so the answer is in the right child. Subtract the zeros to get $k = 1$, map the range to $[z_1 + (1 - 0), z_1 + (4 - 2)] = [5, 6]$, and set the second bit to $1$.
3. At level $2$, $Z_2[5] = 3$ and $Z_2[6] = 3$, so the range contains no zeros. Since $k = 1 > 0$, map it to $[z_2 + (5 - 3), z_2 + (6 - 3)] = [6, 7]$ and set the third bit to $1$. The rank is $011_2 = 3$, and $v_3 = 4$.
4. The answer is $4$, and the sorted range is $[1, 2, 4, 5, 7, 9]$, whose third element is indeed $4$.

Now query $\operatorname{kth}(0, 7, 6)$, the sixth smallest of the whole array.

1. At level $0$, the range is the whole sequence, with $4$ zeros. Since $6 > 4$, subtract to get $k = 2$, map to $[4, 7]$, and set the first bit to $1$.
2. At level $1$, $Z_1[4] = 2$ and $Z_1[7] = 4$, so there are $2$ zeros. Since $k = 2 \le 2$, stay on the left, map to $[2, 4]$, and set the second bit to $0$.
3. At level $2$, $Z_2[2] = 1$ and $Z_2[4] = 2$, so there is $1$ zero. Since $k = 2 > 1$, subtract to get $k = 1$, map to $[z_2 + (2 - 1), z_2 + (4 - 2)] = [5, 6]$, and set the third bit to $1$. The rank is $101_2 = 5$, and $v_5 = 7$.
4. The sorted array is $[1, 2, 3, 4, 5, 7, 9]$, whose sixth element is $7$.

Finally, count the values below $4$ in the range $[1, 7)$. The rank of $4$ is $3$, which is $011_2$.

1. At level $0$, the bit of $3$ is $0$, so stay on the left with $[Z_0[1], Z_0[7]) = [1, 4]$ and add nothing.
2. At level $1$, the bit of $3$ is $1$, so add the zeros of the range, $Z_1[4] - Z_1[1] = 2 - 0 = 2$, and move to the ones, $[z_1 + (1 - 0), z_1 + (4 - 2)] = [5, 6]$.
3. At level $2$, the bit of $3$ is $1$, so add the zeros of the range, $Z_2[6] - Z_2[5] = 3 - 3 = 0$, and move to the ones. The total is $2$.

The values below $4$ in $[2, 5, 1, 7, 4, 9]$ are $2$ and $1$, so the count is correct.

## Correctness proof

::: math lemma Lemma
For every level $d$ and every bit prefix $p$, the positions of the node of $p$ form a contiguous interval of $S_d$.
:::

::: math proof Proof
The proof is an induction on $d$. At level $0$ the only node is the root, which occupies the whole sequence. Suppose the claim holds at level $d$ for every prefix of length $d$. The stable partition of the whole level writes all zeros first, then all ones. A node $p$ occupies a contiguous interval at level $d$ by the induction hypothesis, so its zeros occupy a contiguous sub-block of the zero region: the zeros of the parents before $p$ precede them, and the zeros of the parents after $p$ follow them. The same argument applies to the ones. Hence the nodes $p0$ and $p1$ are each contiguous at level $d + 1$, although the global partition may place another node between them. The induction is complete. $\square$
:::

::: math lemma Lemma
For every level $d$ and every range $[l, r)$, the zeros of the range occupy $[Z_d[l], Z_d[r])$ and the ones occupy

$$
\bigl[z_d + (l - Z_d[l]),\; z_d + (r - Z_d[r])\bigr)
$$

in $S_{d+1}$.
:::

::: math proof Proof
The stable partition writes the zeros of the whole level in their original order at positions $0, \ldots, z_d - 1$, and the ones in their original order at positions $z_d, \ldots, n - 1$. Among the zeros, the ones that lie in positions $[l, r)$ are exactly the zeros whose original positions are in that range. Their number is $Z_d[r] - Z_d[l]$, and because the order is preserved they occupy the contiguous block that starts at the number of zeros before $l$, which is $Z_d[l]$. The argument for the ones is identical after subtracting the zeros before each endpoint and adding the offset $z_d$. $\square$
:::

::: math theorem Theorem
Let $[l, r)$ be a nonempty range and $1 \le k \le r - l$. The query $\operatorname{kth}(l, r, k)$ returns the $k$-th smallest value of $a_l, \ldots, a_{r-1}$.
:::

::: math proof Proof
The proof is an induction on the number of remaining levels. At a node, let $z$ be the number of elements of the current range that descend to the left child. The left child contains exactly the values whose next bit is $0$, which are the smaller half of the node's value interval, and the right child contains the larger half. Every value in the left child is smaller than every value in the right child.

If $k \le z$, the $k$-th smallest of the range lies in the left child, and by the induction hypothesis the walk on the mapped left range returns it. If $k > z$, the first $z$ values in sorted order are the left child's values, so the $k$-th smallest is the $(k - z)$-th smallest of the right child, and the walk on the mapped right range returns it by the induction hypothesis. The mapping is the second lemma, so the range passed to the child is exactly the child's elements of the original range.

After $h$ levels there are no bits left, the accumulated rank has all $h$ bits of the answer, and the compressed table returns the value. $\square$
:::

::: math theorem Theorem
The rank query returns the number of values in $[l, r)$ whose rank is less than $x$, for every $0 \le x \le m$.
:::

::: math proof Proof
The guards handle the two ends: for $x \le 0$ no rank is smaller, and for $x \ge m$ every rank is smaller. Otherwise $x$ has at most $h$ bits, because $x < m \le 2^h$, and the walk follows those bits from the most significant end. The current node always contains exactly the values of the range whose already-processed prefix equals the prefix of $x$. When the next bit of $x$ is $1$, every value in the current range whose next bit is $0$ has a smaller prefix at the first differing bit and is therefore smaller than $x$; the count of those values is the zero count, and it is added. The walk then continues into the ones, which are the only values that can still be smaller after this bit. When the next bit of $x$ is $0$, no value in the ones can be smaller, so the walk continues into the zeros without adding. After $h$ bits, every value smaller than $x$ has been counted exactly once, at the highest bit where it differs from $x$. $\square$
:::

The two theorems cover the two queries. The build invariant is preserved by the two-pass construction: the prefix pass records the zeros of the current sequence, and the partition pass writes the same sequence into the next level with the zeros first and the ones second, preserving the relative order inside each group.

## Complexity analysis

**Build: $O(n \log \sigma)$.** There are $h = \lceil \log_2 m \rceil \le \lceil \log_2 n \rceil$ levels. Each level performs one prefix pass and one partition pass over $n$ elements, so the work per level is $O(n)$ and the total is $O(n h)$. The sort and deduplication that produce the compressed values cost $O(n \log n)$ and are dominated by, or equal to, the build.

**Each query: $O(\log \sigma)$.** The k-th smallest query performs one constant-time step per level, and the rank query performs one constant-time step per level as well. Both are $O(h) = O(\log m) \le O(\log n)$.

**Space: $O(n \log \sigma)$.** The implementation stores $h$ prefix arrays of $n + 1$ 32-bit counters, which is $4 n h$ bytes, plus two arrays of $n$ 32-bit ranks, which is $8 n$ bytes, plus the compressed values. At $n = 200\,000$ and $m = 200\,000$, $h = 18$, so the prefix counters take about $14.4$ MB and the working arrays about $1.6$ MB. The values themselves need 64 bits if they are not compressed, and the compressed table can also hold 64-bit values; that adds about $1.6$ MB per array, so $3.2$ MB for the input and the table.

::: math complexity Complexity
A wavelet tree over $n$ values with $m$ distinct values: $O(n \log m)$ time and space to build, $O(\log m)$ per k-th smallest query, and $O(\log m)$ per rank query. The space constant is four bytes per counter in the array-based layout.
:::

The width of the value type is part of the requirement, not an implementation detail. Values up to $10^9$ fit in a signed 32-bit integer, but a sum or a value outside that range may not; the listings use 64-bit values and 32-bit ranks, and the ranks are bounded by $n$, which fits comfortably. The order $k$ is compared with counts of at most $n$, so 32 bits are enough for $k$ as well, although the Pascal and C listings read it as a 64-bit integer to avoid a narrowing surprise on the input.

The succinct variant changes the space analysis rather than the query analysis. If each level stores a bitvector and a rank directory instead of a prefix array of 32-bit counters, the space is $n h$ bits plus a small directory, which is about $450$ KB at $n = 200\,000$ and $h = 18$. The price is a more delicate implementation of rank, and the article keeps the counter arrays because they make the mapping formulas visible.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static array, range k-th smallest, online | Wavelet tree or persistent segment tree |
| Static array, range k-th smallest, offline allowed | Parallel binary search with a Fenwick tree, or a merge sort tree |
| Static array, range count below a threshold | Wavelet tree, or a merge sort tree |
| Static array, range distinct count | Wavelet tree over the previous-occurrence array, or an offline Fenwick sweep |
| Static array, range sum of values below a threshold | Wavelet tree with a per-level prefix sum, or a merge sort tree with prefix sums |
| Static array, range sum only | Prefix sums |
| Static array, range minimum or maximum | Segment tree or sparse table |
| Point updates and range counts | Fenwick tree of sorted lists, or a dynamic segment tree |
| Range updates and range queries | Lazy segment tree; a wavelet tree does not apply |
| $n \le 10^3$ | Sort or scan the range per query |
| Small value domain | Range prefix counts over the values, or a Fenwick tree for a global rank |
| Queries known in advance | [Mo's algorithm](/algorithms/range-queries/mos-algorithm), or an offline sweep |

The first two rows are the decision this article exists for. When the array is static and the query is an order statistic, the wavelet tree is the structure with the best query time and a predictable memory cost. When updates are present, no amount of cleverness in the wavelet tree helps, because every level would have to be repaired; the dynamic structures trade a logarithmic factor for the ability to change the array.

The merge sort tree remains a reasonable choice when implementation time is short. It is a segment tree with a merge, and the merge is the same merge sort that every contestant has written. The wavelet tree is smaller and faster, but it has more moving parts: compression, the height, the prefix counts, the stable partition, and two different mapping formulas.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source.

Every implementation is a complete program with the same contract. It reads

```text
n q
a_0 a_1 ... a_{n-1}
l r k        (q lines)
```

where the bounds are 0-based and half-open: the query covers positions $l, l+1, \ldots, r-1$, and $1 \le k \le r - l$. It prints the k-th smallest value of that range on its own line. The six programs produce the same output on the three fixture cases, including the negative values, the duplicate values, and the single-position ranges.

The variants differ mainly in how they own storage and how they compress the values. The C version allocates every level with `malloc` and frees every level on every exit path. The C++ version uses `std::vector` and rotates the two rank buffers with `std::swap`. The Java version uses a ragged `int[][]` and copies the partition back into the current array. The Python version keeps a list of lists and a dictionary for the compression. The Pascal version uses dynamic arrays and a bottom-up merge sort, so no preprocessing step recurses. The JavaScript version uses `Int32Array` for the prefix counts and the rank buffers.

The typed implementations use a 64-bit type for the values, and all six treat the ranks and the prefix counts as small integers. The values are compressed, so the trie height is the logarithm of the number of distinct values, not the width of the machine word.

## Recursion decision

A pointer-based wavelet tree is naturally recursive. A node receives a value interval and a sequence, writes its bitvector, partitions the sequence, and calls itself on the two children.

```python
def build(low, high, sequence):
    if high - low == 1:
        return Leaf(low)
    middle = (low + high) // 2
    node = Node()
    node.zeros = prefix_zeros(sequence, middle)
    left = [value for value in sequence if value < middle]
    right = [value for value in sequence if value >= middle]
    node.left = build(low, middle, left)
    node.right = build(middle, high, right)
    return node
```

That version is easy to read and is the version to write on paper. The listings use the level-wise loop instead, for three reasons.

**The depth is bounded, so recursion is safe but unnecessary.** The depth is $h = \lceil \log_2 m \rceil$, which is at most 18 for $n = 200\,000$ distinct values and at most 64 for an uncompressed 64-bit value. No stack can overflow at that depth, so the recursion is not a correctness risk; it is simply extra machinery.

**The level loop has no per-node allocation.** The recursive build allocates a node object and a prefix array per node, and a query follows a chain of references. The loop allocates one prefix array and two rank buffers per level, and a query is a loop over a rectangular array.

**The mapping is uniform.** In the level-wise layout the two mapping formulas are the same at every level, and the offset $z_d$ is the only level-dependent quantity. In the pointer layout the offset is local to the node, and the code has to carry it through the recursion.

| Language | Cost of one recursive call | Verdict for this structure |
| --- | --- | --- |
| C and C++ | A few nanoseconds, plus an allocation if the node is not pooled | Use the loop; the allocation dominates a level step |
| Java | A few nanoseconds after the JIT warms up, plus object headers | Use the loop; the ragged arrays are already the natural layout |
| Python | About a microsecond per call, plus a list per node | Use the loop; the recursive version creates $O(m)$ lists |
| Pascal | A few nanoseconds, plus a dynamic array per node | Use the loop; the level arrays are simpler to free |
| JavaScript | A few nanoseconds after the JIT warms up, plus an object per node | Use the loop; the typed arrays are the natural layout |

The rule of thumb from the [depth-first search](/algorithms/graphs/dfs) article applies with a twist: when the depth is small, either form is correct, but here the loop is also the smaller program, so there is no reason to recurse. The one place where the tree framing is still the right tool is the pruned search in the second worked problem, where the number of live branches is not known in advance; that search is a traversal of the conceptual tree, not of the stored layout, and it can be written as a loop over a list of live ranges.

## Implementation walkthrough

Five details decide whether a wavelet tree is right.

**The compression.** Sort a copy of the array, remove duplicates, and replace each value with its position in the sorted distinct list. In C and C++ that is `qsort` or `std::sort` followed by `std::unique` and `std::lower_bound`. In Python and JavaScript a dictionary or a map does the replacement in one pass. The compression is what makes the height $O(\log n)$; without it, a wavelet tree over 64-bit values would have 64 levels.

**The height.** Compute $h$ as the smallest integer with $2^h \ge m$. The loop `while ((1 << h) < m) h++` does that and terminates with $h = 0$ when $m = 1$. A common alternative, `floor(log2(m)) + 1`, gives the same answer for $m > 1$ but needs a special case for $m = 1$ and a reliable logarithm.

**The prefix pass.** Build $Z_d$ before partitioning, not after. The array must describe the sequence at the current level, because that is the sequence the query range indexes. Building it after the partition would record the bits of the next level against the positions of the current one, and the query would be one level out of phase.

**The stable partition.** Count the zeros in the prefix pass, then write the zeros from the front and the ones from position $z_d$ in the second pass. This is $O(n)$ and stable. Do not use an in-place partition that swaps elements from the two ends; it is $O(1)$ extra space and it is not stable, so it destroys the window property the query depends on.

**The mapping.** In the right branch, compute $l - Z_d[l]$ and $r - Z_d[r]$ before overwriting $l$ and $r$, or compute the right endpoints into temporaries. In C, C++ and Java the assignment order matters; in Python and JavaScript the tuple assignment on the right-hand side is evaluated before either name changes, which is why the Python version can write `left, right = base + (left - zeros_left), base + (right - zeros_right)` in one line.

The half-open convention is worth stating in a comment. The range is $[l, r)$, so the number of elements is $r - l$, the prefix counts are read at $r$ and at $l$, and $k$ runs from $1$ to $r - l$. The compressed value is `values[rank]`, and the rank is the integer whose bits were accumulated during the descent.

The input parser is the other place where a contest program loses time. The C and C++ versions use `scanf` and `std::cin` with tied streams disabled; the Java version uses a byte-level `FastScanner`; the Python and JavaScript versions split the whole input once. The output is accumulated in a buffer in C++, Java and JavaScript, and written line by line in C, Python and Pascal, which is fast enough for the fixture sizes and simple enough to read.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Partitioning without preserving order | The query range maps to a non-contiguous set | Write the zeros and ones in their original relative order into two write pointers |
| Forgetting to subtract the zero count when descending right | The order is too large and the answer is too large | `k -= zeros` before mapping the right child |
| Omitting the `z_d` offset in the right mapping | The range starts at the left child's position and the answer comes from the wrong node | `l = z[d] + (l - zeros_left)`, and the same for `r` |
| Building the prefix array after the partition | The bits and the positions belong to different levels | Build $Z_d$ from $S_d$, then partition into $S_{d+1}$ |
| Using `h = floor(log2(m))` | The most significant bit of some ranks is never inspected | Use `ceil(log2(m))`, with $h = 0$ for $m = 1$ |
| Treating $k$ as 0-based | Every answer is one position too large | Subtract one from an input $k$, or keep the loop 1-based |
| Mixing inclusive and half-open bounds | The range includes one extra value or drops the last one | Pick $[l, r)$ everywhere and convert at the input boundary |
| Using a 32-bit value type on a 64-bit input | Large values are truncated before compression | Read and store values in a 64-bit type |
| Forgetting the $m = 1$ case | A zero-length prefix table is indexed, or the loop never ends | Let $h = 0$ and return the only value |
| Using a wavelet tree when updates are allowed | The level arrays go stale after the first update | Use a dynamic structure or rebuild, and account for the rebuild |
| Assuming the rank query counts values at most $x$ | The boundary value is missing | Translate "at most $y$" to "less than $\rho(y) + 1$" |
| Storing the original values instead of ranks | The bit loop addresses the wrong bits | Compress first and keep the table for the answer |

### Why this fails: the missing level offset

The mistake that survives review most often is the mapping of the right child in a level-wise layout. The code looks almost right, and the first few queries usually return plausible values.

Take the array $[3, 2, 5, 1, 7, 4, 9]$ and the query $[1, 7)$ with $k = 3$, which was worked through above. The correct answer is $4$. At level $1$ the range has two zeros and the query turns right, and the correct mapping is $[5, 6]$.

Suppose the offset is omitted and the code writes `l = l - zeros_left` and `r = r - zeros_right` instead. The range becomes $[1, 2]$. At level $2$, $Z_2[1] = 0$ and $Z_2[2] = 1$, so there is one zero and the walk turns left, reconstructing the rank $011_2$ minus the final one, which is $010_2 = 2$, and the program prints $v_2 = 3$.

The answer $3$ is a real value from the array, so a spot check against a sorted copy of a different range may not catch it. The bug is a coordinate change between two arrays: the right child's elements are written after all the zeros of the level, so position zero of the right child is position $z_d$ of the level, not position zero. The offset is the entire difference between the two coordinate systems.

The same class of bug appears when the prefix counts are built after the partition. Then the array describes the next level but the query indexes it with positions from the current level, so the zeros of a range are counted from the wrong sequence. The fix is not a different algorithm but a different order of two statements, and the order has to be written down before the code is written.

A third failure is quieter. If the partition is done with an unstable in-place algorithm, the set of values in each child is still correct, and a query that asks for the minimum or a full count still works. Only an order statistic fails, and it fails on some inputs and not others, which is the hardest kind of bug to find. The differential test against the sort baseline is what catches it.

## Variants and extensions

- **The wavelet matrix.** The level-wise layout used by the listings. It keeps one prefix count per level and never stores a node boundary, because the node boundaries are implied by the value prefixes.
- **The pointer wavelet tree.** Every node owns a prefix array and two child pointers. It uses more memory and more allocations, and it is the version that makes the tree shape visible.
- **The succinct wavelet tree.** Each level stores a bitvector and a rank directory instead of a prefix array of counters. The space drops from $4 n h$ bytes to roughly $n h$ bits, at the cost of a more intricate rank implementation.
- **The raw-bit wavelet tree.** Skip compression and split on the bits of the 64-bit value. The height becomes 64, and negative values need a bias or a sign-aware encoding, but the structure works on any value domain.
- **The range-sum wavelet tree.** Store a prefix sum of the values alongside each level's prefix zeros. When a query adds a left branch, it adds the sum of that branch in the range, which answers "sum of values at most $x$" in $O(\log \sigma)$. This is the variant to reach for when a [merge sort tree](/algorithms/range-queries/merge-sort-tree) with prefix sums is the alternative.
- **The distinct-values wavelet tree.** Store, for each position, the previous position with the same value, and answer a distinct count as a rank query on that array. The third worked problem is this variant.
- **The k-th largest query.** Use $k' = (r - l) - k + 1$ in the same structure, or flip the bit test. The tree does not need to be rebuilt.
- **The range quantile query.** A quantile is a k-th smallest with a $k$ chosen from the quantile, so it costs the same as one order statistic.
- **The dynamic wavelet tree.** A Fenwick tree whose nodes hold wavelet trees, or a segment tree over the values with counts. A point update costs $O(\log^2 n)$, and a query keeps the logarithmic descent but adds a logarithmic factor for the structure.
- **The two-dimensional wavelet tree.** Build over one coordinate and keep the points sorted by the other; a rectangle count becomes a rank query on each of $O(\log n)$ nodes. This is the wavelet-tree cousin of a range tree.
- **The pruned search.** Do not follow one branch; follow every branch whose element count can still produce an answer. The second worked problem uses this to find a value that occurs more than a threshold number of times, and the number of live branches is bounded by the reciprocal of the threshold.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide whether the array is static. If there is any update, stop and choose a dynamic structure; a wavelet tree will not be repaired cheaply.
2. Compress the values and keep the sorted table. Write down whether the input bounds are inclusive or half-open before writing the query.
3. Compute $h = \lceil \log_2 m \rceil$ and handle $m = 1$ explicitly. Test the all-equal array before anything else.
4. Build the prefix counts, then partition, then move to the next level. Keep the two rank buffers and rotate them.
5. Write the k-th query as a loop with the mapping formulas in one place. Do not duplicate the mapping between the left and right branches if a temporary can avoid it.
6. Test five cases explicitly: a single element, the whole array, $k = 1$, $k = r - l$, and a range with duplicates. Add a negative-value array if the input allows negatives.
7. Keep the copy-and-sort baseline and compare on random arrays. A disagreement is a counterexample worth more than an hour of reading.
8. Check the memory. The array-based layout costs about $4 n h$ bytes for the counters; at $n = 10^6$ and $h = 20$ that is $80$ MB before the values, which may be too much.
9. Use fast input and buffered output. The structure is logarithmic, but the input of $2 \cdot 10^5$ queries is not.
10. For a rank query on the compressed ranks, clamp the threshold: at or below $0$ the answer is zero, and at or above $m$ it is the range length.

## Worked problems

### Problem 1: the range order statistic

**Restatement.** An array of $n$ values is given. Then $q$ queries follow, each with 0-based half-open bounds $[l, r)$ and an order $k$. Print the $k$-th smallest value in $a_l, \ldots, a_{r-1}$. Constraints: $1 \le n, q \le 200\,000$ and $|a_i| \le 10^9$.

**Naive baseline.** Copy the range and sort it, at $O(n \log n)$ per query and $O(nq \log n)$ overall.

**Insight.** Every bit of the answer can be decided by counting how many elements of the current range descend to the left child. The count is a difference of two prefix-zero entries.

**Derivation.** Compress the values, build the levels, and run the loop from the key insight. At each level, read the zero count, compare it with $k$, and either stay left or subtract and move right. The accumulated bits are the rank of the answer.

**Correctness.** The invariant says that the current range contains exactly the elements of the original range whose already-decided bits match the path. The zero count is the number of those elements that take the smaller next bit, and the order statistic either lies among them or among the ones with its order reduced by their count.

**Complexity.** $O(n \log n)$ to build, $O(\log n)$ per query, $O(n \log n)$ space.

**Common wrong approach.** Converting the half-open bound $l$ with a subtraction and then treating $r$ as inclusive, which shifts the range. Another is forgetting `k -= zeros` when the walk turns right, which returns a value that is too large by the number of skipped elements.

### Problem 2: the frequent value above a threshold

**Restatement.** An array of $n$ values in $[1, n]$ is given. Each query has 1-based inclusive bounds $[l, r]$ and an integer $k$ with $2 \le k \le 5$. Find the smallest value that occurs strictly more than $(r - l + 1) / k$ times in the range, or report $-1$ when no value does. Constraints: $n, q \le 300\,000$.

**Naive baseline.** Count every value in the range with a hash map, at $O(r - l + 1)$ per query and $O(nq)$ overall.

**Insight.** A range of length $L$ can contain at most $k - 1$ values whose frequency is greater than $L / k$, because the position sets of those values are disjoint and each one alone is larger than $L / k$. The search over values can therefore prune any node whose range contains at most $L / k$ elements.

**Derivation.** Convert the bounds to $[l - 1, r)$ and let $L = r - l$. Walk the wavelet tree with a list of live ranges. At a node, the number of elements in its range is the length of the mapped range; if that length is at most $L / k$, discard the node. Otherwise descend into both children with the usual mapping, keeping the children whose counts are large enough. At a leaf, the length of the range is the frequency of that value; if it exceeds $L / k$, the leaf is a candidate. Return the smallest candidate.

**Correctness.** A value that occurs more than $L / k$ times lies in every node on its root-to-leaf path, and each of those nodes contains at least that many elements, so the pruning never discards it. Every leaf that survives to the end has its exact frequency in the range, so the threshold test is exact. The search visits the leaves in increasing value order, or tracks the minimum, so the first surviving candidate is the smallest.

**Complexity.** At every level, fewer than $k$ nodes have more than $L / k$ elements, so the walk visits $O(k \log n)$ nodes. With $k \le 5$, that is $O(\log n)$ with a small constant, and the build is $O(n \log n)$.

**Common wrong approach.** Using $k$ times the threshold or a non-strict comparison. The condition is "strictly more than $L / k$", so a node with exactly $\lfloor L / k \rfloor$ elements cannot contain a qualifying value, and a frequency equal to the threshold does not qualify. A second mistake is to stop at the first node with a large count without descending to a leaf, which reports a value range rather than a value.

### Problem 3: the distinct values of a range

**Restatement.** An array of $n$ values is given. Each query has 1-based inclusive bounds $[a, b]$ and asks how many distinct values occur in that range. Constraints: $n, q \le 200\,000$ and $1 \le x_i \le 10^9$.

**Naive baseline.** Insert the range into a hash set, at $O(n)$ expected per query.

**Insight.** Charge each distinct value to its first occurrence in the range. If $\text{prev}[i]$ is the previous position holding the same value, or $0$ when there is none, then position $i$ is the first occurrence in $[a, b]$ exactly when $a \le i \le b$ and $\text{prev}[i] < a$.

**Derivation.** Build the array $\text{prev}$ in one pass with a dictionary from value to last position. Compress the $\text{prev}$ values and build a wavelet tree over them. A query becomes a rank query: count the positions in $[a - 1, b)$ whose $\text{prev}$ value is less than $a$. The rank walk from the key insight adds the zeros of each range whenever the threshold bit is one.

**Correctness.** Every distinct value has exactly one first occurrence in the range, and that occurrence is the only position of the value whose previous occurrence lies before $a$. The rank query counts exactly those positions, so it counts each distinct value once.

**Complexity.** $O(n \log n)$ to build $\text{prev}$ and the tree, $O(\log n)$ per query, $O(n \log n)$ space. The offline alternative is a Fenwick sweep in $O((n + q) \log n)$.

**Common wrong approach.** Building the query on the next occurrence instead of the previous one and then comparing it in the same direction as $\text{prev}$. The next-occurrence formulation needs the opposite comparison, $\text{next}[i] > b$, because a position is the last occurrence in the range exactly when its next occurrence lies beyond the right end. Another mistake is to change $\text{prev}[i] < a$ into $\text{prev}[i] \le a$, which drops the first occurrence when it sits at position $a$.

## Practice progression

1. **Recognition.** Given a statement, decide whether a wavelet tree applies. Look for a static array and a query that asks for an order statistic or a rank over a subarray.
2. **Direct application.** Implement the compression, the levels, the k-th smallest query and the rank query, and verify against a copy-and-sort baseline on small random arrays.
3. **Adaptation.** Answer the k-th largest, the median and the quantile with the same structure, and handle the all-equal array.
4. **Combination.** Build a wavelet tree over $\text{prev}$ for a distinct-values query, or add per-level prefix sums for a thresholded range sum.
5. **Challenge.** Solve a query that needs a pruned traversal rather than a single path, such as the frequent-value problem above, and bound the number of live branches.
6. **Transfer.** Implement the succinct bitvector variant, or a wavelet tree over a tree path with persistent versions, and compare the memory with the array-based layout.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a level store, and why is the prefix count of zeros enough to decide the next branch? (Key insight)
2. Why must the partition be stable, and what breaks when it is not? (Key insight, Common mistakes)
3. State the two mapping formulas and say which count each one uses. (Algorithm derivation)
4. Why is the right child's mapping offset by $z_d$, and what does that number count? (Formal model)
5. What is the height of the tree, and why is it the logarithm of the number of distinct values? (Complexity analysis)
6. How does the rank query differ from the k-th smallest query? (Algorithm derivation)
7. What is the time and space of the build, and how many bytes do the prefix counts take at $n = 200\,000$? (Complexity analysis)
8. Give an array and a query where omitting the level offset returns a wrong value. (Why this fails)
9. When is a merge sort tree the better choice than a wavelet tree? (Algorithm selection)
10. Why is the wavelet tree unable to handle a point update cheaply? (Problem motivation, Variants and extensions)

## Further reading

- The [merge sort tree](/algorithms/range-queries/merge-sort-tree) answers the same order-statistic queries with one more logarithmic factor; it is the structure to compare against when the implementation time matters.
- The [segment tree](/algorithms/range-queries/segment-tree) is the general range structure that handles non-invertible operations, and its article explains the decomposition that the wavelet tree replaces with a value trie.
- The [Fenwick tree](/algorithms/range-queries/fenwick-tree) is the structure for dynamic prefix aggregates, and it is the building block of the dynamic wavelet tree.
- [Coordinate compression](/algorithms/arrays/coordinate-compression) is the preprocessing step that turns values into the ranks this structure descends on.
- [Binary search](/algorithms/searching/binary-search) is the conceptual model for the descent: each level halves the candidate value interval.
- [Mo's algorithm](/algorithms/range-queries/mos-algorithm) is the offline alternative when the queries can be reordered, and the comparison shows what the online requirement costs.
- Every listing in this article, in all six languages, is collected on the [wavelet tree source page](/implementations/range-queries-wavelet-tree/).
