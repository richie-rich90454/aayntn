---
id: range-queries.fenwick-tree
title: Fenwick tree
summary: Keep the prefix sums of an array up to date in a binary indexed tree, so a point update and a range sum both cost logarithmic time.
division: [gold, platinum]
subjects: [range-queries]
level: intermediate
importance: common-contest-technique
keywords: [fenwick tree, binary indexed tree, bit, prefix sum, point update, range sum]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [searching.binary-search, range-queries.segment-tree]
complexity:
    time: "O(log n) per operation"
    space: "O(n)"
assumptions:
    - The combining operation is addition, which is invertible, so a range sum is the difference of two prefix sums.
implementations: range-queries.fenwick-tree
visualization: range-queries.fenwick-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="range-queries.fenwick-tree" />

A Fenwick tree, also called a binary indexed tree, keeps a set of running totals for an array in a single array of $n + 1$ entries. Each entry holds the total of one block of positions, and the blocks are chosen by the binary representation of their indices.

The whole structure is three lines of arithmetic per operation. An update walks up the tree by repeatedly adding the lowest set bit of the index. A prefix query walks down by repeatedly subtracting it. A range query is the difference of two prefix queries.

The interesting part is not the arithmetic but the shape of the blocks. The lowest set bit of an index is the size of its block, so the blocks nest the way a binary counter nests, and that is what makes both walks visit only $O(\log n)$ blocks while covering exactly the positions they must cover.

The tree costs $O(n)$ space and $O(\log n)$ per operation, which is the same as a [segment tree](/algorithms/range-queries/segment-tree). The difference is the requirement: a Fenwick tree needs an _invertible_ combining operation, so it answers sums but not maxima, while a segment tree needs only an associative one.

## Problem motivation

A warehouse records the weight of every parcel that passes through it. The manager asks, many times a day, "how much weight went through between parcel $l$ and parcel $r$?" and occasionally "parcel $i$ was actually misweighed, correct it by $\delta$".

The constraints are the whole problem.

- $1 \le n \le 200\,000$ parcels.
- $1 \le q \le 200\,000$ operations, each one an update or a query.
- $|a_i| \le 10^9$, so a range sum can reach $2 \cdot 10^{14}$.

Adding up the range for every query costs $O(nq)$, which is $4 \cdot 10^{10}$ additions. Prefix sums fix the query, but they break on the update: changing one value changes every later prefix, so repairing the table costs $O(n)$ per correction, which is the same $O(n)$ the naive scan was already paying.

The statement has both halves, "correct it" and "how much between $l$ and $r$", and the structure has to serve both. That combination is what rules out prefix sums and points at a Fenwick tree.

Notice what the problem is _not_ asking. It never asks for the largest weight in a range, or the smallest. It asks for a total, and a total is the one quantity that can be taken apart again.

## Recognition patterns

A Fenwick tree is the right tool when all of the following hold.

- The array is **1-indexed** in the statement, or can be made so with one offset.
- The operations are **point updates** and **range queries**, in any mix and in any order.
- The quantity is **additive**: a sum of weights, a count of events, a total score.
- The values may be **negative**, because a signed sum is still a sum.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $q = 1$ and no updates | Prefix sums are enough; a Fenwick tree is needless machinery |
| Values are only assigned, never added to | A segment tree is equally good and more flexible |
| The quantity is a maximum or a minimum over a range | A Fenwick tree is ruled out; use a segment tree |
| $n \le 10^3$ | A plain array of prefix sums rebuilt per query is fast enough |
| $n \ge 10^6$ | The tree costs $8n$ bytes, so 8 MB; check the memory limit |
| Updates are range updates rather than point updates | A Fenwick tree is ruled out; use a difference array or a lazy segment tree |

The phrases in a statement that signal this technique are "after each operation", "add $\delta$ to the value at position $i$", and "the sum of the elements from $l$ to $r$". The phrase that rules it out is "the maximum value in the range", because a maximum cannot be undone.

<Synonyms terms="fenwick tree, binary indexed tree, bit, fenwick, lowbit tree" />

## Naive approach

The baseline is a linear scan of the range for every query.

```cpp
long long rangeSum(const std::vector<long long>& a, int left, int right) {
    long long total = 0;
    for (int i = left; i <= right; ++i) {
        total += a[i];
    }
    return total;
}
```

This is $O(n)$ per query and $O(n)$ per update, because the update writes one element and the query reads a range. It is correct for any array, and it is the reference implementation for the differential test.

The second baseline is prefix sums with a rebuild after every update, which is $O(n)$ per update and $O(1)$ per query. It is better on queries and identical on updates, which is why it fails: the update cost dominates.

The third baseline is a segment tree, which is $O(\log n)$ for both. It is the strongest baseline here, and it is the one to write when the statement mentions a maximum, a minimum, or a product.

## Key insight

The insight has two halves, and the second half is the one that is usually missed.

**First half.** The set of positions $1, \ldots, i$ can be partitioned into $O(\log n)$ blocks, each of which is an interval whose length is a power of two, such that the blocks are exactly the ones stored in the tree. If the tree stored the sum of each block, a prefix query would be the sum of $O(\log n)$ stored values.

**Second half.** The blocks are not chosen freely. They are determined by the binary representation of the index, and that is what makes the _update_ logarithmic as well.

Define $\operatorname{lowbit}(i)$ as the largest power of two that divides $i$, which is the same as the lowest set bit of $i$ in binary:

$$
\operatorname{lowbit}(i) \;=\; i \mathbin{\&} (-i) \qquad\text{for } i \ge 1.
$$

The tree stores, for every $i \ge 1$, the sum of the block

$$
\bigl(i - \operatorname{lowbit}(i),\; i\bigr],
$$

which is the interval of positions $i - \operatorname{lowbit}(i) + 1$ through $i$, inclusive. The block always ends at $i$ and always has a power-of-two length.

Now the two walks. Starting at $i$ and replacing $i$ by $i + \operatorname{lowbit}(i)$ visits exactly the blocks that _contain_ position $i$. Starting at $i$ and replacing $i$ by $i - \operatorname{lowbit}(i)$ visits exactly the blocks that _partition_ $1, \ldots, i$.

The worked example makes the structure concrete. Take the array

$$
a = [3,\; 2,\; 5,\; 1,\; 7,\; 4,\; 9]
$$

and build the tree from it. The block of each index and the stored total are:

| Index $i$ | $\operatorname{lowbit}(i)$ | Block   | Stored total |
| --------- | -------------------------- | ------- | ------------ |
| 1         | 1                          | $(0,1]$ | 3            |
| 2         | 2                          | $(0,2]$ | 5            |
| 3         | 1                          | $(2,3]$ | 5            |
| 4         | 4                          | $(0,4]$ | 11           |
| 5         | 1                          | $(4,5]$ | 7            |
| 6         | 2                          | $(4,6]$ | 11           |
| 7         | 1                          | $(6,7]$ | 9            |

Read the table down the middle column and the binary structure is visible: the sizes are $1, 2, 1, 4, 1, 2, 1$, which is exactly the sequence of lowest set bits of $1, 2, \ldots, 7$.

A prefix query for $1, \ldots, 7$ walks $7 \to 6 \to 4 \to 0$ and adds $\text{tree}[7] + \text{tree}[6] + \text{tree}[4] = 9 + 11 + 11 = 31$, which is the sum of the whole array. The three blocks are $(6,7]$, $(4,6]$ and $(0,4]$, and they are disjoint and together cover $1, \ldots, 7$.

The update walk is the mirror image. Adding $\delta$ to position $5$ walks $5 \to 6 \to 8$ and stops, because $8 > n$. The blocks touched are $(4,5]$, $(4,6]$ and $(0,8]$, and position $5$ lies in all three of them and in no other block of the tree.

## Visual intuition

Draw the tree as a row of boxes, one per index, and put a box around every block. The boxes nest the way a binary counter nests, and two facts become visible.

The first fact is that every position belongs to exactly one block of every size. Position $p$ belongs to the block of size $1$ ending at $p$, to the block of size $2$ ending at the next even number, and so on. The update walk visits those blocks in increasing size, which is why it terminates at the first index beyond the array.

The second fact is that the blocks visited by a prefix walk tile the prefix without overlap. The block of size $2^k$ at index $i$ covers the positions from $i - 2^k + 1$ to $i$, and the next block in the walk covers exactly the positions before it. Nothing is counted twice and nothing is skipped.

The laboratory below shows the tree with the current block highlighted and the running total printed beside it.

<AlgorithmPlayer algorithm="range-queries.fenwick-tree" />

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, indexed from one.

<MathPanel type="definition" title="Definition">
For $i \ge 1$, the **lowest set bit** of $i$ is
$\operatorname{lowbit}(i) = i \mathbin{\&} (-i)$. It is the largest power of
two that divides $i$, and it satisfies
$\operatorname{lowbit}(i) = 2^k$ exactly when the $k$-th bit of $i$ is the
lowest bit that is set.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **block** of an index $i$ is the interval
$B(i) = \bigl(i - \operatorname{lowbit}(i),\; i\bigr]$. A Fenwick tree over
$a$ is an array $\text{tree}$ with $\text{tree}[i] = \sum_{p \in B(i)} a_p$
for every $1 \le i \le n$, and $\text{tree}[0]$ unused.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **prefix sum** $P(i)$ is the total of the first $i$ values,
$P(i) = \sum_{p=1}^{i} a_p$, with $P(0) = 0$. The **range sum** of the
inclusive range $[l, r]$ is $P(r) - P(l - 1)$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
For every $1 \le i \le n$, the indices visited by the walk
$i, \; i - \operatorname{lowbit}(i), \; \ldots$ down to $0$ are exactly the
indices whose blocks partition $\{1, \ldots, i\}$. The blocks are pairwise
disjoint and their union is $\{1, \ldots, i\}$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
For every position $p$, the indices visited by the walk
$p, \; p + \operatorname{lowbit}(p), \; \ldots$ are exactly the indices
whose blocks contain $p$.
</MathPanel>

<MathPanel type="definition" title="Definition">
A binary operation $\odot$ on a set is **invertible** if there is an
operation $\oslash$ such that $a \oslash (a \odot b) = b$ for every
$a$ and $b$. Addition of integers is invertible, with subtraction as the
inverse; taking a maximum is not.
</MathPanel>

## Algorithm derivation

The state is the array $\text{tree}$ of $n + 1$ entries, all zero at the start. The update rule for adding $\delta$ at position $p$ is:

```text
for i = p; i <= n; i += lowbit(i):
    tree[i] += delta
```

The update is correct because, by the second lemma, the walk visits exactly the blocks that contain $p$. Adding $\delta$ to the total of a block that contains $p$ is exactly what the value at $p$ increased by, and adding it to a block that does not contain $p$ would be wrong.

The query rule for the prefix sum $P(i)$ is:

```text
total = 0
for j = i; j > 0; j -= lowbit(j):
    total += tree[j]
```

The query is correct because, by the first lemma, the blocks visited are pairwise disjoint and cover $\{1, \ldots, i\}$, so each value is added exactly once.

The range rule is the difference of two prefix sums:

$$
\operatorname{sum}(l, r) \;=\; P(r) - P(l - 1),
$$

and this is the step that imposes the algebraic requirement. The prefix totals can only be taken apart again if the combining operation has an inverse. For sums the inverse is subtraction. For a maximum there is no inverse, so $P(r) - P(l-1)$ is not even a well-formed expression, and the Fenwick tree cannot answer the query at all.

<MathPanel type="invariant" title="Invariant">
After every update, $\text{tree}[i]$ equals the total of the values at the
positions in $B(i)$ for every $1 \le i \le n$.
</MathPanel>

### Why the algebraic requirement is not negotiable

The requirement can be stated precisely. The Fenwick tree maintains a _prefix aggregate_ under an operation $\odot$. A range query needs to recover the aggregate of $[l, r]$ from the aggregates of $[1, r]$ and $[1, l-1]$, which means it needs an operation $\oslash$ with

$$
P(r) \oslash P(l - 1) \;=\; \operatorname{aggregate}(l, r).
$$

Subtraction satisfies this for addition because $\sum_{p=l}^{r} a_p = \sum_{p=1}^{r} a_p - \sum_{p=1}^{l-1} a_p$. Division satisfies it for multiplication of nonzero values. Nothing satisfies it for a maximum, because there is no way to recover the maximum of a suffix from the maxima of two nested prefixes.

This is exactly the difference between a Fenwick tree and a [segment tree](/algorithms/range-queries/segment-tree). A segment tree never takes a prefix apart; it merges the totals of disjoint blocks, and merging needs only associativity and an identity. A Fenwick tree does take a prefix apart, so it needs an inverse as well.

## Step-by-step execution

Continue with the array $a = [3, 2, 5, 1, 7, 4, 9]$ and its tree.

1. Query the range $[2, 6]$. The prefix $P(6)$ walks $6 \to 4 \to 0$ and adds $\text{tree}[6] + \text{tree}[4] = 11 + 11 = 22$. The prefix $P(1)$ walks $1 \to 0$ and adds $\text{tree}[1] = 3$. The answer is $22 - 3 = 19$, which is $2 + 5 + 1 + 7 + 4$.
2. Add $10$ at position $3$. The walk is $3 \to 4 \to 8$, and $8 > 7$ stops it. The tree becomes $\text{tree}[3] = 15$ and $\text{tree}[4] = 21$.
3. Query the prefix $P(7)$ again. The walk $7 \to 6 \to 4 \to 0$ adds $9 + 11 + 21 = 41$, which is $3 + 2 + 15 + 1 + 7 + 4 + 9$.
4. Query the range $[2, 6]$ again. $P(6) = \text{tree}[6] + \text{tree}[4] = 11 + 21 = 32$, and $P(1) = 3$, so the answer is $29$, which is $2 + 15 + 1 + 7 + 4$.

Notice in step 2 that the update touched neither $\text{tree}[5]$ nor $\text{tree}[6]$. That is correct: position $3$ is not in the block $(4,5]$ nor in the block $(4,6]$. It is the single most common source of a wrong implementation, because a hand-written update that walks to $n$ by some other rule will touch the wrong entries.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The Fenwick tree maintains the invariant that $\text{tree}[i]$ is the total
of the values at the positions in $B(i)$, and every range query returns the
sum of the values in the requested range.
</MathPanel>

<MathPanel type="proof" title="Proof">
The invariant holds before any update, because every value is zero and
every block total is zero.

Suppose the invariant holds and a value $\delta$ is added at position $p$. By the second lemma, the walk $p, p + \operatorname{lowbit}(p), \ldots$ visits exactly the indices whose blocks contain $p$. The update adds $\delta$ to the total of exactly those blocks, so each block total stays equal to the sum of the values it covers. Blocks that do not contain $p$ are not touched, and their totals are still correct because the values in them did not change. The invariant is therefore preserved.

Now the query. By the first lemma, the blocks visited by the downward walk from $i$ are pairwise disjoint and their union is $\{1, \ldots, i\}$. By the invariant, $\text{tree}[j]$ is the total of the values in the block of $j$, so summing the visited entries adds every value in $\{1, \ldots, i\}$ exactly once. The result is $P(i)$.

Finally, the range query returns $P(r) - P(l - 1)$, which by the definition of the prefix sums is $\sum_{p=l}^{r} a_p$, the sum of the requested range. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The two lemmas about the walks hold because of the binary representation.
Every positive integer $j$ has a unique decomposition $j = 2^{k_1} +
2^{k_2} + \cdots$ into distinct powers of two, with $k_1 > k_2 > \cdots$.
The block of $j$ has length $2^{k_1}$, and $j - \operatorname{lowbit}(j)$ is
the sum of the remaining powers. The blocks visited by the downward walk
therefore cover successively smaller suffixes of $1, \ldots, j$, and the
next block ends exactly where the previous one begins, so they are disjoint
and their union is the whole prefix.

For the upward walk, position $p$ lies in the block of $j$ exactly when $j - \operatorname{lowbit}(j) < p \le j$. Writing $j$ in binary, that condition says that the lowest set bit of $j$ is the lowest set bit of $p$ raised to the position of the next set bit of $j$ above $p$, which is precisely the description of the walk $p, p + \operatorname{lowbit}(p), \ldots$. $\square$
</MathPanel>

## Complexity analysis

**Each update: $O(\log n)$.** The walk adds the lowest set bit of the current index at every step. Every step clears the lowest set bit and carries into the next one, so the index at least doubles at every step. There are at most $\lfloor \log_2 n \rfloor + 1$ steps.

**Each query: $O(\log n)$.** A range query is two prefix queries, and each prefix walk clears the lowest set bit at every step, so it has at most $\lfloor \log_2 n \rfloor + 1$ steps.

**Building the tree: $O(n)$**, by adding each value at its own position. An $O(n \log n)$ build that inserts the values one by one is also correct and is usually fast enough, but the linear build is the one to reach for when $n$ is large.

**Space: $O(n)$** for the tree of $n + 1$ entries. With 64-bit entries that is $8(n+1)$ bytes, so $1.6$ MB at $n = 200\,000$.

<MathPanel type="complexity" title="Complexity">
Fenwick tree over $n$ values: $O(n)$ to build, $O(\log n)$ per update,
$O(\log n)$ per range query, and $O(n)$ extra space.
</MathPanel>

The width of the accumulator is part of the complexity statement, because it decides whether the answer is even correct. With $n = 200\,000$ values of magnitude up to $10^9$, a total can reach $2 \cdot 10^{14}$, which does not fit in a 32-bit signed integer, whose largest value is about $2.1 \cdot 10^9$. The reference implementations therefore use a 64-bit type.

## Algorithm selection

| Situation                                | What to use                     |
| ---------------------------------------- | ------------------------------- |
| Static array, many range-sum queries     | Prefix sums                     |
| Static array, range minimum or maximum   | Sparse table                    |
| Point updates and range sums             | Fenwick tree                    |
| Point updates and range minima or maxima | Segment tree                    |
| Range updates and point queries          | Difference array                |
| Range updates and range sums             | Lazy segment tree               |
| Count of subarrays with a given sum      | Prefix sums and a frequency map |
| Sum of a range on a grid                 | Two-dimensional prefix sums     |

The third and fourth rows are the decision that this article exists for. When the operation is a sum, the Fenwick tree is smaller and simpler than the segment tree. When the operation is anything else, the segment tree is the only one of the two that works.

## Reference implementations

<CodeViewer algorithm="range-queries.fenwick-tree" />

The manifest publishes two variants. The `minimal` variant is a reusable structure with an `add`, a `prefix_sum` and a `range_sum`, and it performs no input and output. In C and Pascal it owns its storage through an explicit init and destroy pair, so every successful init must be matched by exactly one destroy. The `program` variant reads `n q` and then $q$ operations, where `1 i delta` adds a delta and `2 l r` prints the range sum.

## Recursion decision

The Fenwick tree does not recurse. Both walks are loops, and the reason is structural rather than stylistic: the depth of the walk is the number of set bits in the index, which is at most 20 for a 32-bit index and at most 64 for a 64-bit one.

The recursive reformulation is instructive even so:

```python
def prefix_sum(i):
    if i <= 0:
        return 0
    return tree[i] + prefix_sum(i - lowbit(i))
```

It computes the same value, and it has the two problems that the loop does not. The recursion depth is the number of set bits of $i$, which is small, so the stack is not the issue; the issue is that the function call overhead dominates a loop that is already only a few dozen operations, and the recursion is at the mercy of the language's limit for no benefit.

| Language | Loop cost per step | Recursive verdict |
| --- | --- | --- |
| C and C++ | A few nanoseconds | Do not recurse; the call overhead is larger than the arithmetic |
| Java | A few nanoseconds after the JIT warms up | Do not recurse; the same argument applies |
| Python | About a microsecond per call | Do not recurse; the loop is an order of magnitude faster |
| Pascal | A few nanoseconds | Do not recurse |
| JavaScript | A few nanoseconds after the JIT warms up | Do not recurse |

The rule of thumb from the depth-first article applies unchanged: when the depth is provably small, either form is correct, but the loop is never worse.

## Implementation walkthrough

Three details decide whether a Fenwick tree is right.

**The indexing.** The tree is 1-indexed and `tree[0]` is never read. The loop `for (i = index; i <= n; i += i & (-i))` uses `i & -i` rather than `lowbit(i)`, because the bit trick is the definition and any helper function is a call in the hot loop.

**The sign.** The expression `i & (-i)` relies on two's complement arithmetic, which every language in this repository's implementation set provides. The alternative, `i & (~i + 1)`, is the same thing spelled out and is harder to read.

**The overflow.** The update `i += i & (-i)` can jump past the end of the array. In C and C++ with a signed 32-bit `int`, if `i` is close to $2^{31}$ then `i + lowbit(i)` overflows and is undefined behavior. The reference implementation uses an `int` index with `n` bounded by the statement, which keeps `i` well inside the range, and the guard `i <= n_` stops the walk before it can reach the overflow.

The range query is written as a subtraction of two prefix sums, and the subtraction is the whole reason the operation must be invertible:

```cpp
long long rangeSum(int left, int right) const {
    return prefixSum(right) - prefixSum(left - 1);
}
```

There is no `left - 1` guard, because `prefixSum(0)` returns zero by construction: the loop `for (i = 0; i > 0; ...)` does not execute.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using a 0-indexed array without the offset | Every answer is off by one position | Shift the input by one, or keep the tree 1-indexed |
| Computing `prefixSum(left)` instead of `prefixSum(left - 1)` | The value at `left` is dropped from the answer | Subtract the prefix of length `left - 1` |
| Writing `i += lowbit(i)` as `i += i` | The update loop never terminates | Use the lowest set bit |
| Using `lowbit(i) = i & (~i)` | The bits are inverted and the walk is wrong | Use `i & (-i)` |
| Forgetting that the tree is 1-indexed | `tree[0]` is read and the result is wrong | Start the walks at the given index, never at `index - 1` |
| Using a 32-bit accumulator | Large answers are silently wrong | Use a 64-bit type |
| Storing the value at `tree[i]` instead of the block total | Every prefix query is wrong | Store the total of the block |
| Reaching for a Fenwick tree to answer a range maximum | The subtraction is meaningless | Use a segment tree |
| Updating `tree[i]` for every $i$ in the range | The update becomes $O(n)$ | Update one position at a time |

### Why this fails: the range maximum a Fenwick tree cannot answer

The mistake that survives review most often is assuming that a Fenwick tree is a segment tree with a different shape, and applying it to a quantity that cannot be inverted.

Take the smallest possible array, $a = [2, 1]$, and ask for the maximum of the range $[2, 2]$. The correct answer is $1$.

Build a Fenwick tree over it. $\text{tree}[1] = 2$ and $\text{tree}[2] = \max(2, 1) = 2$. The prefix maximum of the first two positions is $\text{tree}[2] = 2$, and the prefix maximum of the first one position is $\text{tree}[1] = 2$. The range answer, computed the only way a Fenwick tree computes one, is $2 - 2 = 0$.

The answer is $0$, and the correct answer is $1$. The structure is not broken; it answered a different question. There is no way to subtract a prefix maximum from another prefix maximum and get the maximum of the difference, because the maximum is not invertible. A prefix maximum of $2$ and a prefix maximum of $2$ say nothing about the second position alone: the first position alone already has a maximum of $2$.

The generalization is a condition on the whole technique: **a Fenwick tree answers range queries only for invertible combining operations.** Addition and multiplication of nonzero values qualify. Maximum, minimum, and the gcd of a set of numbers do not, and the moment a statement asks for one of those, the structure to reach for is a [segment tree](/algorithms/range-queries/segment-tree), which merges disjoint blocks and never has to take a prefix apart.

There is a second failure with the same root, and it is a silent one rather than a wrong one. If the tree is built 0-indexed to match the array in memory, then every walk starts one position too early: the update walk begins at `index - 1` and touches the blocks of the wrong positions, and the prefix walk stops one position short. On the array above with the value $5$ added at position $1$, the prefix query for $P(3)$ returns the total of positions $1$ and $2$ rather than $1$, $2$ and $3$. The fix is not a different algorithm but a different convention, and the convention has to be written down in a comment before the code is written.

## Variants and extensions

- **A multiplicative Fenwick tree.** When the operation is multiplication of nonzero values, the inverse is division, and the range product is $\text{prefix}(r) / \text{prefix}(l-1)$. The arithmetic changes and the structure does not.
- **A Fenwick tree over a difference array.** Storing the differences turns a range update into two point updates and a point query into a prefix sum, which is the mirror image of the technique.
- **Two-dimensional Fenwick trees.** The same idea over a grid, where a rectangle sum is four prefix queries. The update walks in two directions at once.
- **A Fenwick tree of Fenwick trees.** Used for offline two-dimensional queries: sort by one coordinate, sweep, and maintain a second tree over the other.
- **The offline variant.** When all the updates are known in advance and all the queries are known in advance, sorting the queries by their right endpoint and sweeping the array with a plain running total answers them in $O((n + q) \log(n + q))$ time and $O(n)$ space, with no tree at all.
- **Finding a value by its prefix sum.** The walk that finds the largest index whose prefix sum is at most a given value is the Fenwick tree's search operation, and it is $O(\log n)$ on the same structure.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the indexing convention in a comment before writing the loops. The tree is 1-indexed; the input may not be.
2. Decide the accumulator width from the constraints. A sum of $10^5$ values of magnitude $10^9$ needs 64 bits.
3. Write the range query as the difference of two prefix sums, and write the prefix query as a single function used by both.
4. Test the four cases explicitly: an update at position $1$, an update at position $n$, a query of the whole array, and a query of a single element.
5. If the statement mentions a maximum or a minimum anywhere, stop and use a segment tree.
6. Keep the naive scan as a reference implementation and compare on random inputs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the parcel weights

**Restatement.** An array of $n$ parcel weights is given. Then $q$ operations follow: `1 i delta` adds a delta to the weight at position $i$, and `2 l r` prints the total weight of positions $l$ through $r$. Constraints: $1 \le n \le 200\,000$, $1 \le q \le 200\,000$, and $|a_i| \le 10^9$.

**Naive baseline.** Add up the range for every query, at a cost of $O(nq) = 4 \cdot 10^{10}$ additions.

**Insight.** The blocks of the Fenwick tree partition any prefix, so a prefix total is the sum of $O(\log n)$ stored values, and an update touches $O(\log n)$ blocks.

**Derivation.** Build the tree. On an update, walk up by the lowest set bit and add the delta. On a query, walk down by the lowest set bit twice, once for $r$ and once for $l - 1$, and subtract.

**Correctness.** The invariant proof shows that every block total is the sum of the values it covers, and that a prefix walk adds each value in the prefix exactly once.

**Complexity.** $O(\log n)$ per operation, $O(n)$ space, 64-bit totals.

**Common wrong approach.** Subtracting the prefix of length $l$ instead of $l - 1$, which silently drops the weight at position $l$ from every answer.

### Problem 2: counting the inversions of a permutation

**Restatement.** A permutation of $1, \ldots, n$ is given. Count the pairs $(i, j)$ with $i < j$ and $p_i > p_j$. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Check every pair, at a cost of $O(n^2)$.

**Insight.** Sweep from left to right and count, for each new value, how many earlier values are larger than it. The number of earlier values is the prefix count up to a threshold, and the thresholds arrive in decreasing order.

**Derivation.** Use a Fenwick tree over the _values_ rather than over the positions. Keep a second counter of how many values have been inserted. When the value $v$ arrives, the number of earlier values greater than $v$ is $j - \operatorname{prefix}(v)$, where $j$ is the number of values already inserted and $\operatorname{prefix}(v)$ counts those at most $v$. Add that to the answer, then insert $v$.

**Correctness.** Every inversion is counted exactly once, when its second element is processed, and the tree gives the exact count of earlier elements at most $v$ because it holds the counts of the inserted values.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Inserting $v$ before querying, which counts the element itself and makes every answer one too large.

### Problem 3: the running maximum after each update

**Restatement.** An array of $n$ values is given. Each operation sets a position to a value or reports the maximum of a range. Constraints: $1 \le n, q \le 200\,000$.

**Naive baseline.** Scan the range for every query, at a cost of $O(nq)$.

**Insight.** The maximum cannot be inverted, so the prefix trick of the Fenwick tree does not apply. A segment tree stores the maximum of each block directly, and a query merges the maxima of $O(\log n)$ disjoint blocks.

**Derivation.** Build a segment tree over the array. A point assignment descends to the leaf and merges the two children on the way back up. A range query descends into the children that overlap the range and merges the maxima of the nodes that are fully covered.

**Correctness.** The block argument of the segment tree article shows that the value at every node is the maximum of the range it covers, and that the query merges a set of disjoint blocks that cover exactly the queried range.

**Complexity.** $O(\log n)$ per operation and $O(n)$ space.

**Common wrong approach.** Using a Fenwick tree and subtracting two prefix maxima, which is the failure this article's "Why this fails" passage works through.

## Practice progression

1. **Recognition.** Given a statement, decide whether a Fenwick tree applies. Look for point updates mixed with range sums, and check that the quantity is additive.
2. **Direct application.** Implement the tree, the update, the prefix sum and the range sum, and verify against a brute-force scan on small random arrays.
3. **Adaptation.** Implement the multiplicative version, and the version that counts elements rather than summing them.
4. **Combination.** Use a Fenwick tree to count inversions, to count subarrays with a given sum, and to answer offline two-dimensional rectangle queries.
5. **Challenge.** Solve a problem where the quantity is a maximum and discover that the prefix trick does not apply; solve it again with a segment tree, and explain the difference in terms of invertibility.
6. **Transfer.** Use the tree for something that is not a range sum at all: the search operation that finds the largest index whose prefix sum is at most a given value, or a Fenwick tree over a difference array that turns range updates into point updates.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does $\operatorname{lowbit}(i)$ compute, and what does $\text{tree}[i]$ hold? (Key insight)
2. Why does the update walk go up by the lowest set bit and the query walk go down? (Algorithm derivation)
3. What algebraic property does a Fenwick tree need that a segment tree does not? (Why this fails)
4. Why is the tree 1-indexed, and what breaks if it is not? (Common mistakes)
5. State the invariant and say which part of the proof uses it. (Correctness proof)
6. How many blocks does the update walk touch, and why? (Complexity analysis)
7. What is the largest sum the stated constraints allow, and what type does that force? (Complexity analysis)
8. Give a two-element array and a query that a Fenwick tree answers wrongly when the quantity is a maximum. (Why this fails)
9. When is a segment tree the better tool than a Fenwick tree? (Algorithm selection)
10. Why is the naive scan still worth writing? (Contest strategy)

## Further reading

- The static sibling of this structure, which trades updates for constant time queries, is the [sparse table](/algorithms/range-queries/sparse-table).
- The structure that handles a quantity without an inverse is the [segment tree](/algorithms/range-queries/segment-tree), and the article states the monoid framing that the two structures differ on.
- The technique that answers a range sum in constant time when nothing changes is [prefix sums](/algorithms/arrays/prefix-sums), and the article explains why a point update defeats it.
- The reverse operation, in which a range update becomes two changes, is described under difference arrays, which the prefix sums article covers as a variant.
- Every listing in this article, in all six languages, is collected on the [Fenwick tree source page](/implementations/range-queries-fenwick-tree).
