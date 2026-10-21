---
id: range-queries.sparse-table
title: Sparse table
summary: Precompute the aggregate of every block of power-of-two length, so that a static range query is answered in constant time by combining two blocks.
division: [gold, platinum]
subjects: [range-queries]
level: advanced
importance: common-contest-technique
keywords:
    [sparse table, static range query, idempotent operation, minimum query, maximum query, gcd]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [range-queries.segment-tree, range-queries.fenwick-tree]
assumptions:
    - The array never changes after the table is built.
    - The combining operation is idempotent, so that the two overlapping blocks of a query may be combined.
reviewed: false
---

## Problem motivation

A game has $n$ stages. The player must pass through a contiguous stretch of stages, and the question is "how hard is the hardest stage in the stretch from $l$ to $r$?". The difficulty of a stage never changes.

The constraints are the whole problem.

- $1 \le n \le 100\,000$ stages.
- $1 \le q \le 100\,000$ queries, each naming a range.
- The difficulties are fixed before the first query.

Scanning the range for every query costs $O(nq) = 10^{10}$ comparisons. Prefix sums do not help, because a maximum cannot be taken apart again: the [Fenwick tree](/algorithms/range-queries/fenwick-tree) needs an invertible operation and a maximum has none.

There is one more possibility, and it comes from reading the constraints carefully. The array **never changes**. That single fact removes the need to maintain anything, and it allows a structure that is far better than the [segment tree](/algorithms/range-queries/segment-tree) for this particular question: a table of every block of power-of-two length, which answers a query with a single combination of two entries.

## Recognition patterns

A sparse table is the right tool when all of the following hold.

- The array is **static**. Nothing changes after the queries are known.
- There are **many** queries, so that a linear preprocessing pays for itself.
- The quantity is combined by an operation that is **idempotent**, so that $x \star x = x$. Minimum, maximum, gcd, lcm, bitwise or, and bitwise and all qualify.
- A **constant time** query matters, for instance because the time limit is tight or because the query is inside a larger loop.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The array changes between queries | A sparse table is ruled out; use a segment tree |
| The quantity is a sum | A sparse table is ruled out, because the overlapping blocks double count; use prefix sums |
| $q = 1$ | A single scan is enough |
| $n \ge 10^6$ | The table costs $n \log_2 n$ entries, so about 160 MB at 32 bits each; check the limit |
| Memory is tight and $q$ is small | A segment tree costs $O(n)$ memory; a sparse table costs $O(n \log n)$ |
| The quantity is associative but not idempotent | A sparse table is ruled out; use a segment tree |

The phrases in a statement that signal this technique are "the array does not change", "the values are fixed", and "for each query report the maximum over the range". The phrase that rules it out is "after each operation, change the value at position $i$".

<Synonyms terms="sparse table, static range query, idempotent range query" />

## Naive approach

The baseline is a linear scan of the range for every query.

```python
def range_max(a, left, right):
    best = a[left]
    for i in range(left + 1, right + 1):
        if a[i] > best:
            best = a[i]
    return best
```

This is $O(n)$ per query, and it is correct for any array. It is also the reference implementation for the differential test.

The second baseline is the segment tree, which is $O(\log n)$ per query and $O(n)$ memory. It is the strongest baseline here, and it is what to use when the array changes.

The third baseline is a _sorting_ baseline, which is worth naming because it is often overlooked. If the queries are known in advance and the array is static, the maximum of a range can be found by sorting the queries by their right endpoint and sweeping the array once with a running maximum. That costs $O(n + q \log q)$ time and $O(n + q)$ memory, and it beats the sparse table when $q$ is small relative to $n \log n$. The sparse table is the better answer when the queries arrive online or when $q$ is large.

## Key insight

The insight is that a range of length $L$ can be covered by two blocks of power-of-two length that are _equal_ or _overlapping_, and that for an idempotent operation the overlap is harmless.

Write $L = r - l + 1$ and let $k = \lfloor \log_2 L \rfloor$, so that $2^k \le L < 2^{k+1}$. Take the two blocks

$$
[l,\; l + 2^k - 1] \qquad\text{and}\qquad [r - 2^k + 1,\; r].
$$

Each has length $2^k$. Because $2 \cdot 2^k > L$, the two blocks overlap or touch, and together they cover the whole range. The blocks are stored in the table, so the answer is one combination of two entries.

The overlap is the point that needs care. If the operation is idempotent, combining a value with itself changes nothing, so the elements in the overlap are counted twice in the combination and the result is unchanged. Minimum, maximum, gcd, and lcm are all idempotent:

$$
\min(x, x) = x, \qquad \max(x, x) = x, \qquad \gcd(x, x) = x.
$$

Addition is not idempotent, so the same construction computes the wrong answer for a sum. That is the entire difference between a sparse table and a segment tree: a segment tree can merge disjoint blocks and needs only associativity, while a sparse table merges two overlapping blocks and needs idempotence.

The second half of the insight is that the table is built from itself. The block of length $2^k$ starting at $i$ is the union of the block of length $2^{k-1}$ starting at $i$ and the block of length $2^{k-1}$ starting at $i + 2^{k-1}$, so

$$
\text{st}[k][i] \;=\; \text{st}[k-1][i] \star \text{st}[k-1][i + 2^{k-1}].
$$

There are $O(\log n)$ rows, and each row has $O(n)$ entries, so the table costs $O(n \log n)$ to build.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, indexed from one.

<MathPanel type="definition" title="Definition">
A binary operation $\star$ on a set is **idempotent** if $x \star x = x$
for every $x$ in the set. It is **associative** if
$(x \star y) \star z = x \star (y \star z)$ for every triple.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **sparse table** of $a$ under $\star$ is the array $\text{st}$ with
$\text{st}[k][i]$ equal to the aggregate of the block
$[i, i + 2^k - 1]$, for every $0 \le k \le \lfloor \log_2 n \rfloor$ and
every $1 \le i \le n - 2^k + 1$. The row $k = 0$ holds the values
themselves.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **log table** is $\text{lg}[1] = 0$ and
$\text{lg}[i] = \text{lg}[\lfloor i/2 \rfloor] + 1$ for $i \ge 2$, so that
$\text{lg}[i] = \lfloor \log_2 i \rfloor$. It is built in $O(n)$ time and
lets a query find its row in $O(1)$ time without a floating point
computation.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $k = \lfloor \log_2(r - l + 1) \rfloor$. The blocks
$[l, l + 2^k - 1]$ and $[r - 2^k + 1, r]$ are contained in $[l, r]$, and
their union is $[l, r]$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If $\star$ is associative and idempotent, then the aggregate of the union
of two overlapping blocks is the combination of the aggregates of the
blocks. That is, if the blocks overlap in a set $I$ and
$B_1 \cap B_2 = I$, then

$$
\bigstar_{x \in B_1 \cup B_2} x
\;=\;
\left(\bigstar_{x \in B_1} x\right) \star
\left(\bigstar_{x \in B_2} x\right).
$$

</MathPanel>

## Algorithm derivation

The state is the table $\text{st}$ and the log table $\text{lg}$.

The build rule, row by row. Row $0$ holds the values. For every later row $k$ and every valid index $i$, set

$$
\text{st}[k][i] \;=\; \text{st}[k-1][i] \star \text{st}[k-1][i + 2^{k-1}].
$$

The build is correct because the two blocks on the right are disjoint and together form the block on the left, so by associativity their combination is the aggregate of the whole block.

The query rule for the inclusive range $[l, r]$ is:

```text
k = lg[r - l + 1]
answer = st[k][l] star st[k][r - 2^k + 1]
```

The query is correct by the two lemmas. The two blocks cover the range, and their overlap is harmless because $\star$ is idempotent.

There is no update rule, and that absence is the defining feature of the structure. A change at position $p$ invalidates every entry of row $k$ whose block contains $p$, of which there are up to $2^k$, and the rows sum to $O(n)$. Repairing the table therefore costs $O(n)$ per change, which is more than the $O(\log n)$ of a segment tree and much more than the $O(1)$ of a prefix sum.

<MathPanel type="invariant" title="Invariant">
After the build, $\text{st}[k][i]$ is the aggregate of the block
$[i, i + 2^k - 1]$ for every valid $k$ and $i$.
</MathPanel>

## Step-by-step execution

Take the array $a = [5, 2, 7, 1, 6, 3]$ with $n = 6$, and the operation minimum. The table has three rows, because $\lfloor \log_2 6 \rfloor + 1 = 3$.

Row $0$ is the array itself. Row $1$ holds the minimum of each block of length two, and row $2$ holds the minimum of each block of length four:

| $i$ | $\text{st}[0][i]$ | $\text{st}[1][i]$ | $\text{st}[2][i]$ |
| --- | ----------------- | ----------------- | ----------------- |
| 1   | 5                 | 2                 | 1                 |
| 2   | 2                 | 2                 | 1                 |
| 3   | 7                 | 1                 | 1                 |
| 4   | 1                 | 1                 |                   |
| 5   | 6                 | 3                 |                   |
| 6   | 3                 |                   |                   |

The entries are empty where the block would run past the end of the array.

The log table is $\text{lg} = [0, 0, 1, 1, 2, 2]$ for the indices $1$ through $6$.

Now query the range $[2, 6]$. The length is $5$, so $k = \text{lg}[5] = 2$ and $2^k = 4$. The two blocks are $[2, 5]$ and $[3, 6]$, whose aggregates are $\text{st}[2][2] = 1$ and $\text{st}[2][3] = 1$. The answer is $\min(1, 1) = 1$, which is the minimum of $2, 7, 1, 6, 3$.

Query the range $[1, 3]$. The length is $3$, so $k = 1$ and $2^k = 2$. The two blocks are $[1, 2]$ and $[2, 3]$, whose aggregates are $\text{st}[1][1] = 2$ and $\text{st}[1][2] = 2$. The answer is $\min(2, 2) = 2$, which is the minimum of $5, 2, 7$.

Query the range $[4, 4]$. The length is $1$, so $k = 0$. Both blocks are $[4, 4]$, so the answer is $\text{st}[0][4] = 1$.

Notice in the second query that the two blocks overlap in the single position $2$, and that the answer is still right. The value at position $2$ is $2$, and it is combined with itself: $\min(2, 2) = 2$. If the operation were a sum, the answer would be $\text{st}[1][1] + \text{st}[1][2] = 2 + 2 = 4$, while the true sum of $5 + 2 + 7$ is $14$ in the original values, or $2 + 2 = 4$ against the correct $2 + 7 = 9$. The overlap is counted twice.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The sparse table answers every range query with the aggregate of the
requested range.
</MathPanel>

<MathPanel type="proof" title="Proof">
First the build. The claim is by induction on $k$. For $k = 0$ the entry
is the value of a single-element block, which is its aggregate. Suppose
the row $k - 1$ is correct. The block $[i, i + 2^k - 1]$ is the disjoint
union of the blocks $[i, i + 2^{k-1} - 1]$ and
$[i + 2^{k-1}, i + 2^k - 1]$, and by the induction hypothesis their
aggregates are $\text{st}[k-1][i]$ and $\text{st}[k-1][i + 2^{k-1}]$. By
associativity their combination is the aggregate of the whole block, which
is what the build stores.

Now the query. Let $k = \lfloor \log_2(r - l + 1) \rfloor$. By the first lemma, the blocks $B_1 = [l, l + 2^k - 1]$ and $B_2 = [r - 2^k + 1, r]$ lie inside the range and together cover it. By the second lemma, and because the operation is idempotent, the combination of their aggregates is the aggregate of their union, which is the aggregate of the range. The program prints exactly that combination. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The two lemmas hold as follows. For the first, $2^k \le r - l + 1$ gives
$l + 2^k - 1 \le r$ and $r - 2^k + 1 \ge l$, so both blocks lie inside the
range; and $2 \cdot 2^k > r - l + 1$ gives
$r - 2^k + 1 \le l + 2^k - 1$, so the blocks overlap or touch, and since
each ends inside the range, their union is the whole range.

For the second, list the elements of $B_1 \cup B_2$ as a concatenation of the elements of $B_1$ and the elements of $B_2$ with the elements of the intersection removed from the second block. The combination of the first list is the aggregate of $B_1$ and the combination of the second is the aggregate of $B_2$ with the intersection removed. Combining the two lists in order is the aggregate of the union, and it equals $\text{aggregate}(B_1) \star \text{aggregate}(B_2)$ because the elements of the intersection appear twice in the right hand side and combining a value with itself leaves it unchanged.
</MathPanel>

## Complexity analysis

**Building: $O(n \log n)$ time.** There are $\lfloor \log_2 n \rfloor + 1$ rows and each row has at most $n$ entries.

**Each query: $O(1)$ time.** One table lookup for the row, one table lookup for each block, and one combination.

**Space: $O(n \log n)$** for the table, plus $O(n)$ for the log table. The entries hold a value each, so at $n = 100\,000$ and $17$ rows the table holds $1.7 \cdot 10^6$ entries, which is $6.8$ MB at 32 bits each.

<MathPanel type="complexity" title="Complexity">
Sparse table over $n$ values: $O(n \log n)$ time to build, $O(1)$ time per
query, and $O(n \log n)$ extra space.
</MathPanel>

The memory is the price of the constant time query. A segment tree over the same array costs $O(n)$ memory and answers a query in $O(\log n)$, which is a good trade when memory is tight and the queries are few.

## Algorithm selection

This is the table that decides which structure to reach for.

| Situation | What to use | Why |
| --- | --- | --- |
| Static array, sum queries | Prefix sums | $O(n)$ memory, $O(1)$ query, and the sum does not need idempotence because the blocks are subtracted, not overlapped |
| Static array, minimum, maximum, gcd, or lcm queries, many queries | Sparse table | $O(1)$ query, and idempotence makes the overlap harmless |
| Static array, one or two queries | A segment tree, or a scan | The $O(n \log n)$ build is not worth it for a single query |
| Static array, non-idempotent operation, few queries | A segment tree | Associativity is enough when the blocks are disjoint |
| Point updates, sum queries | Fenwick tree | $O(\log n)$ per operation, $O(n)$ memory |
| Point updates, minimum, maximum, or gcd queries | Segment tree | The operation has no inverse, so the Fenwick trick does not apply |
| Range updates and range queries | Lazy segment tree | A sparse table cannot be maintained under a change |

The third row is the one people get wrong most often. The sparse table is not automatically the best answer for a static array; it is the best answer for a static array when the queries are numerous and the memory is available. A single maximum query on a static array is answered by one scan, and a segment tree answers a handful of queries without the $O(n \log n)$ build.

The two rows that decide the operation are the first and the fifth. A sum is invertible, so the prefix trick of the Fenwick tree applies and no overlap is ever needed. A maximum is not invertible but is idempotent, so the sparse table applies. A sum is not idempotent, so the sparse table does not.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the table for a sum | The overlapping elements are counted twice | Use prefix sums for sums |
| Forgetting that the second block starts at $r - 2^k + 1$ | The wrong block is read, and the answer is wrong | Write the two blocks down before coding |
| Using $2^k$ instead of the floor of the logarithm | The blocks do not cover the range | Use the log table |
| Computing the floor of the logarithm with floating point | It is wrong for large indices near a power of two | Use the precomputed log table |
| Filling row $k$ with a block of length $2^k + 1$ | Every entry above row zero is wrong | Recurse exactly one level |
| Assuming the table can be updated | A change invalidates $O(n)$ entries | Use a segment tree when there are changes |
| Reading entries near the end of the array | The table is not defined there | Check the index range, or pad the array |
| Choosing the wrong row when the length is a power of two | The answer is still right, but the two blocks are identical | Nothing to fix, but know why it works |

### Why this fails: the sum that is counted twice

The mistake that survives review most often is treating the sparse table as a general range-query structure and using it for a quantity that is not idempotent.

Take the smallest array there is, $a = [1, 2]$, and query the whole range $[1,2]$. The length is $2$, so $k = 1$ and $2^k = 2$. The two blocks are $[1, 2]$ and $[2 - 2 + 1, 2] = [1, 2]$. They are the same block. The table holds $\text{st}[1][1] = 1 + 2 = 3$, so the answer the program prints is $3 + 3 = 6$.

The true sum of the range is $1 + 2 = 3$. The program is off by a factor of two, because the two blocks are the same block and every element of the range was added twice.

Two elements is the smallest possible counterexample, and the failure is not even in the overlap: the two blocks coincide exactly. The single element case $a = [1]$ with a query $[1,1]$ fails the same way, with $k = 0$ and both blocks equal to $[1,1]$, giving $2$ instead of $1$.

The generalization is a condition on the whole technique: **the sparse table may only combine overlapping blocks when the operation is idempotent.** The overlap of the two blocks is not a detail of the construction that happens to be harmless; it is the reason the operation has to be idempotent. Minimum, maximum, gcd, lcm, bitwise or, and bitwise and are idempotent and the table is correct for them. Addition, multiplication, and xor are not, and the table is wrong for them.

There is a second failure with the same root, and this one is about the structure rather than the operation: the sparse table cannot answer a question about an array that changed. Take $a = [1, 2]$ with the operation maximum, and the query $[1,2]$. The table holds $\text{st}[1][1] = \max(1, 2) = 2$. Now set $a_1 = 5$. The correct answer is $\max(5, 2) = 5$, and the table still says $2$.

Repairing the table is not free. The entry $\text{st}[0][1]$ has to be rewritten, and so does $\text{st}[1][1]$, and in general the entries of row $k$ whose block contains the changed position, of which there are up to $2^k$. Summing over the rows gives $O(n)$ work per change, which is worse than the $O(\log n)$ of a segment tree and far worse than the $O(1)$ of a prefix sum.

The generalization is a condition on the whole technique: **a sparse table is a structure for a fixed array.** The moment the array changes, the table has to be rebuilt, and the structure that answers both is the [segment tree](/algorithms/range-queries/segment-tree).

## Variants and extensions

- **A range maximum query with a different tie rule.** The table is unchanged; only the comparison is.
- **The count of elements above a threshold.** Use the operation "the count of elements at least $t$", which is not idempotent, so the sparse table does not apply; use a merge-sort tree instead.
- **A sparse table over an Euler tour.** The tree of the article [lowest common ancestor](/algorithms/trees/lca) becomes a table over the depth array of the tour, which answers ancestor queries in constant time.
- **Two sparse tables, one for each direction.** A range minimum and a range maximum at the same time cost two tables and two lookups.
- **The Fischer and Heun construction.** There is a table with $O(n)$ entries that answers range minimum queries in $O(1)$ time, at the price of a much harder implementation and a larger constant.
- **Disjoint sparse tables.** Instead of overlapping blocks, the table is built so that the two blocks of a query are disjoint, which removes the idempotence requirement and lets the table answer sums in $O(1)$.
- **A sparse table with a different block size.** Blocks of length $b$ instead of $2^k$ give $O(n^2 / b)$ entries and a query time of $O(b)$, which is a different point on the same trade-off curve.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Check the assumption first: the array must not change. If the statement contains "after each operation", stop and use a segment tree.
2. Check the operation: it must be idempotent. If it is a sum, use prefix sums; if it is a maximum, use a sparse table.
3. Write the two blocks down before coding: $[l, l + 2^k - 1]$ and $[r - 2^k + 1, r]$.
4. Build the log table rather than computing the logarithm with floating point, and build it before the queries.
5. Estimate the memory: $n \log_2 n$ entries, and compare that with the limit before committing.
6. Test the ranges explicitly: the whole array, a single element, a range of length exactly a power of two, and a range of length one more than a power of two. The last one is the case where the two blocks differ.

## Worked problems

### Problem 1: the hardest stage in a stretch

**Restatement.** An array of $n$ stage difficulties is given. Each query names an inclusive range and asks for the maximum difficulty in it. Constraints: $1 \le n \le 100\,000$, $1 \le q \le 100\,000$, and the difficulties never change.

**Naive baseline.** Scan the range for every query, at a cost of $O(nq)$.

**Insight.** The maximum is idempotent, so two overlapping blocks of power-of-two length may be combined, and the table turns each block into a single entry.

**Derivation.** Build the table with the recurrence $\text{st}[k][i] = \max(\text{st}[k-1][i], \text{st}[k-1][i + 2^{k-1}])$. Answer a query with $k = \text{lg}[r - l + 1]$ and the maximum of the two entries.

**Correctness.** The build is correct by induction on the row, and the query is correct because the two blocks cover the range and the overlap is harmless under the maximum.

**Complexity.** $O(n \log n)$ to build, $O(1)$ per query, and $O(n \log n)$ space.

**Common wrong approach.** Using the table for a sum, which double counts the overlap.

### Problem 2: the gcd of a range

**Restatement.** An array of $n$ positive integers is given. Each query names an inclusive range and asks for the gcd of its elements. Constraints: $1 \le n \le 100\,000$ and $1 \le q \le 100\,000$.

**Naive baseline.** Scan the range and fold the gcd, at a cost of $O(n \log V)$ per query where $V$ is the largest value.

**Insight.** The gcd is associative and idempotent, so the sparse table applies exactly as it does for the maximum.

**Derivation.** Build the table with the merge $\gcd$, and answer each query with the gcd of the two entries.

**Correctness.** The same argument as Problem 1, with the gcd in place of the maximum.

**Complexity.** $O(n \log n)$ to build, $O(1)$ per query, and $O(n \log n)$ space.

**Common wrong approach.** Forgetting that $\gcd(0, x) = x$, so the identity of the operation is $0$ and not $1$.

### Problem 3: the best subarray of a fixed length

**Restatement.** An array of $n$ values is given. For each length $k$ from $1$ to $n$, report the maximum sum of a subarray of exactly that length. Constraints: $1 \le n \le 100\,000$, and the values never change.

**Naive baseline.** For each length, slide a window and keep the best, at a cost of $O(n^2)$ over all lengths.

**Insight.** The values are fixed, so the sums of the windows can be precomputed once, and each length then costs a single scan over a precomputed array.

**Derivation.** Build the prefix sums of the array. For each length $k$, the sum of the window starting at $i$ is $P[i + k - 1] - P[i - 1]$, which is $O(1)$. Scan all $n - k + 1$ windows for that length and keep the maximum. The total cost is $O(n^2)$.

**Better insight.** The windows of a fixed length have sums that differ by a single difference, so the maximum can be carried along, and the whole family of lengths can be answered in $O(n \log n)$ by a divide and conquer that splits the array in the middle: every subarray either lies inside one half or straddles the middle, and the straddling ones are handled with prefix and suffix maxima.

**Correctness.** The divide and conquer partitions the subarrays into the three disjoint families, and the prefix and suffix maxima give the best straddling subarray in $O(1)$ once the two halves are known.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Trying to use a sparse table for the window sums, which requires the operation to be idempotent and a sum is not.

## Practice progression

1. **Recognition.** Given a statement, decide whether a sparse table applies. Look for a static array, many queries, and an idempotent operation.
2. **Direct application.** Build the table for the maximum and for the gcd, and verify against a brute-force scan on small random arrays.
3. **Adaptation.** Answer a range minimum and a range maximum with two tables, and answer the range bitwise or.
4. **Combination.** Build a sparse table over the depth array of an Euler tour to answer ancestor queries in constant time, and use a merge-sort tree for the range counting queries that a sparse table cannot answer.
5. **Challenge.** Solve a problem with a static array but only a handful of queries, and discover that the $O(n \log n)$ build is not worth it; then solve the version with many queries, where it is.
6. **Transfer.** Use the same idea in a different place: precompute every answer that only depends on a power-of-two-sized window, and answer every other question from two of them.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does $\text{st}[k][i]$ hold, and what recurrence fills the row? (Algorithm derivation)
2. Why does the query combine two overlapping blocks, and what property of the operation makes that safe? (Key insight)
3. Give the smallest array for which the table answers a sum wrongly. (Why this fails)
4. Why can the table not answer a query about an array that changed, and what does repairing it cost? (Why this fails)
5. How is the row of a query found in constant time, and why is the log table better than a floating point logarithm? (Formal model)
6. What are the build time, the query time, and the space of the table? (Complexity analysis)
7. When is a segment tree better than a sparse table, and what single property of the operation decides it? (Algorithm selection)
8. When is a prefix sum better than a sparse table? (Algorithm selection)
9. Why must the two blocks of a query be of length exactly $2^k$? (Step-by-step execution)
10. What is the difference between the condition a sparse table needs and the condition a segment tree needs? (Formal model)

## Further reading

- The structure to reach for when the array changes is the [segment tree](/algorithms/range-queries/segment-tree), and the difference between the two is the associativity and idempotence requirement.
- The structure to reach for when the quantity is a sum is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), which needs an invertible operation instead of an idempotent one.
- The technique that answers a range sum in constant time on a static array is [prefix sums](/algorithms/arrays/prefix-sums).
- The tree traversal that produces the Euler tour a sparse table can be built over is [depth-first search](/algorithms/graphs/dfs).
- The ancestor queries that a sparse table over an Euler tour answers in constant time are described in [lowest common ancestor](/algorithms/trees/lca).
