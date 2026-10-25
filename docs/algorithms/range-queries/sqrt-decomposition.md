---
id: range-queries.sqrt-decomposition
title: Square-root decomposition
summary: Split an array into blocks of about the square root of its length, so that a point update changes one block and a range query reads whole blocks plus the two partial blocks at the ends.
division: [gold, platinum]
subjects: [range-queries]
level: intermediate
importance: common-contest-technique
keywords:
    [
        sqrt decomposition,
        square root decomposition,
        block decomposition,
        blocking,
        range query,
        point update,
    ]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [range-queries.fenwick-tree, range-queries.segment-tree]
complexity:
    time: "O(n) to build, O(1) per point update, O(sqrt n) per range query"
    space: "O(n)"
assumptions:
    - The combining operation is associative, so the contents of a whole block may be replaced by one stored aggregate.
    - The block size is fixed at about the square root of the array length, which balances the boundary work against the number of whole blocks.
implementations: range-queries.sqrt-decomposition
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/range-queries.sqrt-decomposition.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

Square-root decomposition splits an array of $n$ values into blocks of $B$ consecutive positions, where $B$ is about $\sqrt{n}$. It keeps the values themselves and one aggregate per block. A point update writes one value and one block aggregate, which is $O(1)$. A range query adds the whole blocks that lie inside the range and scans the elements in the at most two partial blocks at the ends, which is $O(B + n/B)$.

Setting $B = \lceil \sqrt{n} \rceil$ makes both terms about $\sqrt{n}$, so a query costs $O(\sqrt{n})$. The structure is not asymptotically optimal, since a [Fenwick tree](/algorithms/range-queries/fenwick-tree) or a [segment tree](/algorithms/range-queries/segment-tree) answers the same queries in $O(\log n)$. Its advantages are a small constant, a short implementation, and a flexibility that the trees do not have: the block aggregate can be any associative value, whole blocks can carry lazy tags, and the same split works when the operation is not invertible or when the memory limit is far below $O(n)$.

The technique is also called blocking, and it is the first rung of a family of square-root methods that includes [Mo's algorithm](#variants-and-extensions), batching, and heavy-light decomposition by frequency.

## Problem motivation

A toll road has $n$ gantries. Each gantry records the number of vehicles that passed it, and the record is corrected from time to time. The operator asks two kinds of questions:

- "Add $\delta$ to the count at gantry $i$," because a vehicle was counted twice or missed.
- "How many vehicles passed between gantry $l$ and gantry $r$," over an inclusive range.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ gantries.
- $1 \le q \le 200\,000$ operations, each one a correction or a range total.
- $|a_i| \le 10^9$, so a total can reach $2 \cdot 10^{14}$.

Scanning the range for every query costs $O(nq)$, which is $4 \cdot 10^{10}$ additions. [Prefix sums](/algorithms/arrays/prefix-sums) repair the query, but they break on the correction: changing one count changes every later prefix, so a single update costs $O(n)$. The two operations pull in opposite directions, and the naive structures serve one of them at the expense of the other.

The Fenwick tree and the segment tree break the tie in $O(\log n)$, and in a contest they are the first tools to reach for. Square-root decomposition is the tool to understand before them, and the one to reach for when a tree is awkward. It accepts any associative block aggregate, its constants are small, and it extends naturally to range updates, to offline queries, and to problems where the data does not fit the tree-shaped mold.

There is a second reason to study it. The balance between the two costs, $B$ against $n/B$, is the simplest example of a time-memory tradeoff in the encyclopedia. The same balance reappears in Mo's algorithm, in batching, and in the small-and-large split of graph algorithms.

## Recognition patterns

Square-root decomposition is the right tool when most of the following hold.

- The array has **point updates and range queries**, or **range updates and point queries**, or range updates and range queries with a simple aggregate.
- The combining operation is **associative**: sums, counts, minima, maxima, gcds, bitwise OR, matrix products. It does not need an inverse.
- The statement allows **$O(\sqrt{n})$ per operation**, typically because $n$ and $q$ are at most $2 \cdot 10^5$ and the time limit is at least a second.
- The operation is **awkward for a tree**: a range assignment with a nontrivial merge, a bucket of counters, a value that has to be recomputed from a whole block, or an update whose effect on a node is not local.
- The memory limit is **much smaller than $O(n)$**, so the algorithm has to summarize the input in blocks, as in Train Tracking below.
- The queries are **offline** and can be reordered, which opens the door to Mo's algorithm.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The array never changes | [Prefix sums](/algorithms/arrays/prefix-sums) or a [sparse table](/algorithms/range-queries/sparse-table) is simpler and faster |
| Point updates and range sums only | A [Fenwick tree](/algorithms/range-queries/fenwick-tree) is shorter and asymptotically faster |
| Point updates and range minima or maxima | A [segment tree](/algorithms/range-queries/segment-tree) is asymptotically faster and equally simple |
| $n, q \le 10^3$ | A plain scan per query is fast enough; blocks are needless machinery |
| $n, q \ge 10^6$ | $q\sqrt{n}$ reaches $10^9$; use an $O(\log n)$ structure or a linear-time special case |
| The quantity is a running maximum with range assignment | A segment tree with lazy propagation is the safer choice |
| The operation is not associative | No block or tree can replace a full scan |
| The input arrives as a stream and cannot be stored | Blocks can summarize it, but only if the query can be answered from the summaries |

The phrases in a statement that signal this technique are "divide the array into blocks", "at most $O(\sqrt{n})$ memory", "for each block", "the values are too large to store individually", and "answer the queries offline". The phrase that rules it out is "the answer must be computed in $O(\log n)$ per query" with $n = 10^6$.

<Synonyms terms="square root decomposition, sqrt decomposition, block decomposition, blocking" />

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

This is $O(n)$ per query and $O(1)$ per update. With $n = q = 200\,000$ it performs $4 \cdot 10^{10}$ additions in the worst case, which is far beyond a second.

The second baseline is prefix sums with a rebuild after every update. The build is $O(n)$, a query is $O(1)$, and an update is $O(n)$ because every later prefix moves. If all the updates arrive first and all the queries afterwards, this is optimal; if they alternate, it is as slow as the scan.

The third baseline is a [segment tree](/algorithms/range-queries/segment-tree), which answers both operations in $O(\log n)$. It is the strongest baseline, and it is the structure to write when the operation is a minimum, a maximum, or a product with a lazy assignment. Square-root decomposition does not beat it asymptotically; it competes on implementation time, on constants, and on the cases where the operation does not fit a tree node neatly.

The naive scan is still worth writing. It is the reference implementation for the differential test, and a disagreement between the block version and the scan is a counterexample worth more than an hour of reading.

## Key insight

The insight has two halves, and the second half is the one that is usually missed.

**First half.** A range is mostly made of whole blocks. If every block stored its total, a query could add one stored value per whole block and only inspect the elements at the two ends, where the range cuts a block in half.

**Second half.** The block size is a free parameter, and the two costs move in opposite directions. A larger block means fewer whole blocks but longer boundary scans; a smaller block means the reverse. The sum of the two costs is minimized when they are comparable, which happens at $B \approx \sqrt{n}$.

Make the costs precise. A query touches at most $B - 1$ elements before the first block boundary, at most $B - 1$ elements after the last full block, and at most $\lceil n/B \rceil$ whole blocks. With $T(B) = 2B + n/B$, the derivative is $-n/B^2 + 2$, so the minimum is at $B = \sqrt{n/2}$. The usual choice $B = \lceil \sqrt{n} \rceil$ is within about six percent of the optimum in this cost model and is easier to remember.

A point update is cheaper than either: it changes one value and one block total, both in constant time. This asymmetry is the reason the structure is often described as "point updates for free, range queries for $\sqrt{n}$".

The worked example makes the split concrete. Take the array

$$
a = [3,\; 2,\; 5,\; 1,\; 7,\; 4,\; 9]
$$

and choose $B = 3$. There are three blocks:

| Block | Positions | Values    | Stored total |
| ----- | --------- | --------- | ------------ |
| 0     | $0, 1, 2$ | $3, 2, 5$ | 10           |
| 1     | $3, 4, 5$ | $1, 7, 4$ | 12           |
| 2     | $6$       | $9$       | 9            |

The last block is short, which is normal: the number of blocks is $\lceil n/B \rceil$, and every block except the last has exactly $B$ positions.

A query for the inclusive range $[1, 5]$ in zero-based indexing reads the two boundary elements $a_1 + a_2 = 7$, then the whole block $1$ with one addition, for a total of $19$. A query for the whole array reads three block totals instead of seven values. An update at position $2$ writes $a_2$ and the total of block $0$, and touches nothing else.

## Visual intuition

Draw the array as a row of boxes and put a fence around every block. A query is then a contiguous stretch that starts somewhere inside one block, covers zero or more whole blocks, and ends somewhere inside another block.

```text
index    0 1 2 | 3 4 5 | 6
value    3 2 5 | 1 7 4 | 9
block        0 |     1 | 2
total       10 |    12 | 9

query [1, 5]
         . x x | x x x | .
           ^^^   ^^^^^
         partial  full
```

The two partial pieces are scanned element by element. The full blocks in the middle are read from their stored totals, one addition each. The picture also shows why the last block needs care: it may be shorter than $B$, and a query that ends inside it must not treat it as a full block of length $B$.

An update is a single box and a single total:

```text
add 10 at index 2
value    3 2 15 | 1 7 4 | 9
total       20  |    12 | 9
                ^
          one value and one total changed
```

The width of the middle section is what the block size controls. Making the blocks wider shrinks the number of totals but widens the two boundary scans; making them narrower does the reverse. The balance point is the square root, which is why the technique is named after it.

## Formal model

Let $a_0, a_1, \ldots, a_{n-1}$ be the values, indexed from zero. Let $B \ge 1$ be the block size and $m = \lceil n/B \rceil$ the number of blocks.

::: math definition Definition

For $0 \le b < m$, **block** $b$ is the set of indices

$$
\{ i : bB \le i < \min((b+1)B,\; n) \}.
$$

The **block total** is

$$
S_b = \sum_{i \in \text{block } b} a_i.
$$

:::

::: math definition Definition

For an inclusive range $[l, r]$ with $0 \le l \le r < n$, a block $b$ is **full** for the range when $l \le bB$ and $(b+1)B - 1 \le r$. The range is **aligned** on the left when $l$ is a multiple of $B$, and aligned on the right when $r + 1$ is a multiple of $B$.

:::

::: math lemma Lemma

For every $0 \le b < m$, block $b$ contains at least one index and at most $B$ indices. The blocks are pairwise disjoint, and their union is $\{0, 1, \ldots, n-1\}$.

:::

::: math lemma Lemma

Every range $[l, r]$ is the disjoint union of at most two partial blocks and zero or more full blocks. The partial blocks contribute at most $2(B-1)$ individual elements, and the full blocks number at most $\lceil n/B \rceil$.

:::

::: math invariant Invariant

After every update, $S_b$ equals the sum of the values in block $b$ for every $0 \le b < m$.

:::

The invariant is the only state the structure maintains. The values are stored separately because a partial block has to be scanned element by element, and a block total alone cannot answer a query that cuts the block.

## Algorithm derivation

The state is the array $a$ of $n$ values, all zero at the start, and the array $S$ of $m$ block totals.

The build is one pass:

```text
for i = 0 to n - 1:
    S[i div B] += a[i]
```

The update is two writes:

```text
update(i, delta):
    a[i] += delta
    S[i div B] += delta
```

The query uses three loops. The first moves the left end to the next block boundary, the second consumes whole blocks, and the third consumes the tail.

```text
query(l, r):
    total = 0
    while l <= r and l mod B != 0:
        total += a[l]
        l += 1
    while l + B - 1 <= r:
        total += S[l div B]
        l += B
    while l <= r:
        total += a[l]
        l += 1
    return total
```

The first loop stops at the first multiple of $B$ at or after the original $l$. The second loop only takes a block when its last index $l + B - 1$ is still inside the range, so a short last block never satisfies the test and is always handled by the third loop. The third loop scans the remainder, which is a prefix of a block and therefore has fewer than $B$ elements.

The update is correct because a position belongs to exactly one block, so exactly one total changes. The query is correct because the three loops partition the range and each visits a disjoint set of indices.

The block size follows from the cost. A query performs at most $B - 1$ steps in the first loop, at most $\lfloor (r-l+1)/B \rfloor$ steps in the second, and at most $B - 1$ in the third. For a full-length range the total is at most

$$
2(B-1) + \frac{n}{B},
$$

which is minimized near $B = \sqrt{n/2}$. Choosing $B = \lceil \sqrt{n} \rceil$ gives at most about $3\sqrt{n}$ steps, and the constant is small because the middle loop is a single array read and addition.

The same derivation covers the range-update variant. A full-block update adds $\delta$ to a lazy tag and to the block total in $O(1)$; a partial block is pushed and scanned in $O(B)$. A query adds the stored total for a full block and pushes the tag before scanning a partial block. Both operations are $O(B + n/B)$.

::: math invariant Invariant

After every operation, for every block $b$, the value $S_b$ equals the sum of the stored values in block $b$, and the lazy tag $T_b$ is the amount that has been added to every element of the block but not yet written into the individual elements.

:::

## Step-by-step execution

Continue with $a = [3, 2, 5, 1, 7, 4, 9]$, $B = 3$, and block totals $S = [10, 12, 9]$.

1. Query $[1, 5]$ in zero-based indexing. The left end $1$ is not a multiple of $3$, so the first loop adds $a_1 = 2$ and then $a_2 = 5$, leaving $l = 3$. The middle loop sees $3 + 2 = 5 \le 5$, adds $S_1 = 12$, and leaves $l = 6$. The last loop does not run because $6 > 5$. The answer is $2 + 5 + 12 = 19$, which is $2 + 5 + 1 + 7 + 4$.

2. Add $10$ at position $2$. The value becomes $a_2 = 15$, and the block total becomes $S_0 = 20$. No other block total changes.

3. Query the whole array $[0, 6]$. The left end is aligned, so the middle loop adds $S_0 = 20$ and $S_1 = 12$ and leaves $l = 6$. The last loop adds the short block's only element $a_6 = 9$. The answer is $41$, which is $3 + 2 + 15 + 1 + 7 + 4 + 9$.

4. Query $[1, 5]$ again. The first loop adds $a_1 = 2$ and $a_2 = 15$; the middle loop adds $S_1 = 12$; the answer is $29$, which is $2 + 15 + 1 + 7 + 4$.

5. Subtract $9$ at position $6$. The value becomes $a_6 = 0$ and the total becomes $S_2 = 0$. A query for $[5, 6]$ scans $a_5 = 4$ and $a_6 = 0$ and returns $4$, because the short block $2$ is never treated as full.

Notice in step 2 that the update touched neither $S_1$ nor $S_2$. That is correct: position $2$ belongs to block $0$ only. A hand-written update that adds $\delta$ to a different block, or to every block, is the most common source of a wrong answer.

## Correctness proof

::: math theorem Theorem

The array $S$ maintained by the algorithm satisfies $S_b = \sum_{i \in \text{block } b} a_i$ after every update, and `query(l, r)` returns $\sum_{i=l}^{r} a_i$ for every $0 \le l \le r < n$.

:::

::: math proof Proof

The invariant holds at the start, because every value is zero and every block total is zero.

Suppose the invariant holds and `update(i, delta)` runs. The value $a_i$ increases by $\delta$, and only the block $b$ with $i \in \text{block } b$ has its total increased, by the same $\delta$. Blocks that do not contain $i$ are untouched, and their totals are still correct because none of their values changed. The invariant is preserved.

Now the query. The first loop removes elements from the left until $l$ is a multiple of $B$ or the range is empty, adding each removed element exactly once. The second loop takes a whole block exactly when its last index is at most $r$, so every element of that block is inside the range, and the block total is exactly their sum by the invariant. The loop then jumps over the block, so no element is counted twice. The third loop adds the remaining elements up to $r$, each exactly once.

The three loops stop when $l > r$, and every index in $[l, r]$ is visited by exactly one of them. Therefore the returned total is the sum of the requested range. $\square$

:::

::: math proof Proof

The block lemma follows from the definition. For $b < m - 1$, block $b$ is $[bB, (b+1)B)$, which has exactly $B$ indices; the last block is $[(m-1)B, n)$, which has between $1$ and $B$ indices. The intervals are adjacent and disjoint, and their union is $[0, n)$.

For the range lemma, the first loop stops at a multiple of $B$, so the remaining range starts at a block boundary. The second loop removes only blocks that are entirely inside the range, and it stops at the first block whose end is beyond $r$. What remains is a prefix of one block, of length less than $B$. The removed pieces are therefore two partial blocks at most, plus the full blocks between them. $\square$

:::

## Complexity analysis

**Build: $O(n)$.** The array is read once, and each value is added to one block total.

**Point update: $O(1)$.** One value and one block total change. There is no loop over the block or over the array.

**Range query: $O(B + n/B)$.** The first and third loops scan at most $B - 1$ elements each, and the middle loop visits at most $\lceil n/B \rceil$ blocks. With $B = \lceil \sqrt{n} \rceil$ this is $O(\sqrt{n})$.

**Range update and range query with lazy tags: $O(B + n/B)$ each.** A full block is updated in $O(1)$ through its tag, and a partial block costs $O(B)$ to push and rebuild. A query costs $O(1)$ per full block and $O(B)$ for the boundary blocks.

**Space: $O(n)$.** The values need $n$ entries and the block totals need $\lceil n/B \rceil$ entries, which is $O(\sqrt{n})$ extra. A lazy variant adds one tag per block.

::: math complexity Complexity

Square-root decomposition over $n$ values with block size $B = \lceil \sqrt{n} \rceil$: $O(n)$ to build, $O(1)$ per point update, $O(\sqrt{n})$ per range query, and $O(n)$ space.

:::

The total cost over $q$ operations is $O(n + q\sqrt{n})$. With $n = q = 200\,000$, $\sqrt{n} \approx 448$, so the query work is about $9 \cdot 10^{7}$ block and element operations. A compiled language handles that comfortably in a second or two; Python needs the boundary loops to run in C, which is why the reference implementation uses slicing and `sum` for the partial blocks.

The block size is a tuning parameter, not a law. If a point update is more expensive than a query, make the blocks larger; if queries dominate, make them smaller. With costs $c_u B$ per update and $c_q n/B$ per query, the balance is at

$$
B = \sqrt{\frac{c_q n}{c_u}}.
$$

The constant factors matter more than the exponent here, because $\sqrt{n}$ is small at contest sizes. Measuring two or three block sizes is usually worth more than deriving the exact optimum.

The accumulator width is part of the complexity statement. With $n = 200\,000$ values of magnitude $10^9$, a total can reach $2 \cdot 10^{14}$, which does not fit in a 32-bit signed integer. The reference implementations use 64-bit accumulators in C, C++, Java, and Pascal. Python integers are arbitrary precision. JavaScript numbers represent every integer up to $2^{53}$ exactly, and $2 \cdot 10^{14}$ is far below that bound.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static array, many range-sum queries | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Static array, range minima or maxima | [Sparse table](/algorithms/range-queries/sparse-table) |
| Point updates and range sums | [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Point updates and range minima or maxima | [Segment tree](/algorithms/range-queries/segment-tree) |
| Range updates and point queries | [Difference array](/algorithms/arrays/difference-arrays) |
| Range updates and range sums | Lazy segment tree, or square-root decomposition with block tags |
| Many range queries on an unusual associative aggregate | Square-root decomposition |
| Offline range queries that can be reordered | Mo's algorithm, a square-root decomposition of the queries |
| Memory far below $O(n)$ | Block decomposition of a stream |
| $n, q \ge 10^6$ and a strict time limit | An $O(\log n)$ structure, not blocks |

The table is a ladder, not a set of equals. Prefix sums and sparse tables are the static rungs. Fenwick trees and segment trees are the dynamic rungs. Square-root decomposition sits between the naive scan and the trees: it is asymptotically worse, but it is easier to adapt to a new operation, and its constants are often better at $n = 10^5$.

The decision between a tree and blocks is usually made by the operation, not by the constant. If the operation is a sum with point updates, a Fenwick tree is shorter than a block structure and wins outright. If the operation is a maximum with range assignments, a segment tree with lazy propagation is the only one of the two that handles the assignment cleanly. If the operation is "count the distinct values in the range" or "maintain a bucket of frequencies while the range moves", a tree node does not summarize it in $O(1)$, and Mo's algorithm, which is block decomposition applied to the queries, is the natural answer.

## Reference implementations

The manifest publishes six `program` variants, one per language. All six implement the same contract and print the same bytes for the same input.

| Language   | File                    | Storage and notes                                         |
| ---------- | ----------------------- | --------------------------------------------------------- |
| C          | `c/program.c`           | `calloc` and `free` own the values and the block totals   |
| C++17      | `cpp17/program.cpp`     | A class owns two `std::vector` objects                    |
| Java       | `java/program.java`     | Heap arrays and a byte-buffer scanner; `long` totals      |
| Python     | `python/program.py`     | A class owns two lists; boundary sums use slicing         |
| Pascal     | `pascal/program.pas`    | Dynamic arrays of `Int64`; integer square root            |
| JavaScript | `javascript/program.js` | A class owns two arrays; `Number` is exact below $2^{53}$ |

The contract is:

- The first line holds `n q`.
- Each of the next $q$ lines is either `1 i delta`, which adds `delta` to the 1-based position `i`, or `2 l r`, which asks for the sum of the inclusive range `[l, r]`.
- The array starts as `n` zeros.
- A query prints one line with the range sum.

Every variant computes the block size with integer arithmetic rather than a floating-point square root. This avoids a dependency on the math library in C, avoids the rounding surprises of `sqrt` at large $n$, and keeps the six programs consistent. The manifest marks each variant as `unverified`; compilation and agreement with the shared fixtures are recorded separately when the variants are promoted.

The C variant owns its storage explicitly through a `calloc` and `free` pair, but the ownership is simpler than in a hand-written tree: there is no per-node allocation, only two flat arrays. The Pascal variant allocates two dynamic arrays and lets the runtime release them at the end of the program, the C++ and Java variants release theirs through their normal object lifetime, and Python and JavaScript rely on the garbage collector.

## Recursion decision

Square-root decomposition does not recurse. Both operations are loops over a flat array, and the recursion depth would be at most two: one level for the block and one for the element inside it.

The recursive reformulation is instructive even so:

```python
def block_sum(b):
    if b == number_of_blocks:
        return 0
    return stored[b] + block_sum(b + 1)
```

It computes the same total as a loop, and it has no advantage. The number of blocks is at most $\lceil \sqrt{n} \rceil$, so the recursion is shallow, but every call still costs more than the addition it performs, and the call stack adds a failure mode that the loop does not have.

The version that does recurse is a different structure: build a segment tree over the block totals, and recurse on that tree. That is exactly the [segment tree](/algorithms/range-queries/segment-tree) with a different base-case size, and it replaces the block scan with a logarithmic descent. It is worth knowing as a bridge between the two techniques, but it is not an implementation of blocking.

| Form | Depth | Verdict |
| --- | --- | --- |
| Three loops over values and blocks | 0 calls | Use this; the depth is constant and the constants are small |
| Recursion over blocks | $O(\log(n/B))$ | Becomes a segment tree; use the tree directly if you need it |

The rule of thumb from the [recursion](/algorithms/foundations/recursion) article applies: when the loop is a fixed, shallow walk, write the loop.

## Implementation walkthrough

Five details decide whether a block implementation is right.

**The block size.** Compute $B = \lceil \sqrt{n} \rceil$ with integer arithmetic:

```cpp
int block = 1;
while (1LL * block * block < n) {
    ++block;
}
```

For $n = 0$ and $n = 1$ this leaves $B = 1$, which keeps every division valid. A floating-point `sqrt` that is truncated can return $B = \lfloor \sqrt{n} \rfloor$, which is also correct but makes the last block longer; the integer loop is easier to reason about and does not need `-lm`.

**The number of blocks.** It is `(n + B - 1) / B`, not `n / B`. The ceiling matters for the last short block, and an off-by-one here allocates one block too few and writes past the end of the totals array.

**The boundary formulas.** In zero-based indexing, the first full block is

```cpp
int firstFull = (left + block - 1) / block;
int lastFull = (right + 1) / block - 1;
```

The first formula rounds $l$ up to the next multiple of $B$. The second asks which block ends at or before $r$: block $b$ ends at $(b+1)B - 1$, so the condition is $(b+1)B - 1 \le r$, which is $b \le (r+1)/B - 1$. The last block may be short, and this formula never treats a short block as full because its end is beyond $r$.

If `firstFull > lastFull`, the range lies inside one block or in two adjacent partial blocks, and a direct scan is both correct and faster.

**The update.** Write the value and the total together:

```cpp
value[index] += delta;
blockSum[index / block] += delta;
```

Writing only the value is the most common bug in the whole technique. The query still works for single elements, so the mistake survives small tests and appears only when a full block is queried.

**The accumulator.** Use `long long` in C and C++, `long` in Java, `Int64` in Pascal, and an unbounded integer in Python. In JavaScript, `Number` is exact up to $2^{53}$, so the stated $2 \cdot 10^{14}$ bound is safe, but a problem with larger values would need `BigInt` and a different output path.

The reference C++ query is the three-loop derivation written with the boundary formulas:

```cpp
long long rangeSum(int left, int right) const {
    --left;
    --right;
    if (left < 0) left = 0;
    if (right >= n_) right = n_ - 1;
    if (left > right) return 0;

    const int firstFull = (left + block_ - 1) / block_;
    const int lastFull = (right + 1) / block_ - 1;
    if (firstFull > lastFull) {
        long long total = 0;
        for (int i = left; i <= right; ++i) total += value_[i];
        return total;
    }

    long long total = 0;
    for (int i = left; i < firstFull * block_; ++i) total += value_[i];
    for (int b = firstFull; b <= lastFull; ++b) total += sum_[b];
    for (int i = (lastFull + 1) * block_; i <= right; ++i) total += value_[i];
    return total;
}
```

The clamping is defensive. A contest statement normally guarantees $1 \le l \le r \le n$, but the cost of the two `if` statements is negligible and they make the implementation safe to reuse.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Computing $B = 0$ for $n = 0$ | Division by zero in the update or the query | Start at $B = 1$ and only grow it |
| Using `n / B` blocks instead of `(n + B - 1) / B` | The last block has no total slot, or the totals array is too short | Round the block count up |
| Using `lastFull = right / B` | The block containing $r$ is treated as full and its elements outside the range are added | Use $(right + 1) / B - 1$ |
| Forgetting to update the block total | Whole-block queries return stale values; single-element queries still work | Update the value and the total together |
| Using a 32-bit accumulator | Sums above $2.1 \cdot 10^9$ overflow silently | Use a 64-bit type and check the maximum sum |
| Recomputing the block totals for every query | The query becomes $O(n)$ and the structure loses its point | Recompute a block only when an element in it changes |
| Treating a block as full when only part of it is in the range | The boundary elements are counted twice or outside elements are added | Use the two boundary formulas, and test a range that cuts both ends |
| Recomputing $B$ with a floating-point `sqrt` inside the loop | Rounding can make $B$ one too small, and the cost is repeated per operation | Compute $B$ once with integer arithmetic |
| Using one fixed block size for every $n$ | The boundary scan and the block count are unbalanced, so the running time is several times the optimum | Compute $B$ from $n$ at run time, or tune it deliberately |
| Adding a lazy tag to a partial block without pushing it | Some elements get the tag twice, or none at all | Push before a partial update or a partial query |

### Why this fails: the block that is only half inside the range

The mistake that survives review most often is the boundary formula for the right end. Take the array $a = [5, 1, 4, 2]$, block size $B = 2$, and ask for the inclusive range $[1, 2]$ in zero-based indexing. The correct answer is $a_1 + a_2 = 1 + 4 = 5$.

The block totals are $S_0 = 6$ and $S_1 = 6$. A tempting implementation uses `lastFull = right / B`, which is $2 / 2 = 1$. It also computes `firstFull = (left + B - 1) / B = 1`. The left boundary loop adds $a_1 = 1$, the middle loop adds $S_1 = 6$, and the right boundary loop adds nothing. The answer is $7$, not $5$.

One thing went wrong: block $1$ contains positions $2$ and $3$, and position $3$ is outside the query, so the block is not full and its total must not be added. The boundary loop correctly adds $a_1 = 1$, but the middle loop adds $S_1 = 6$, which includes the out-of-range $a_3 = 2$. The total is $1 + 6 = 7$, not $5$. The formula `lastFull = (right + 1) / B - 1` gives $3 / 2 - 1 = 0$, so `firstFull > lastFull` and the implementation scans the range directly, returning $5$.

The same failure appears in a different disguise when the range ends exactly on a block boundary. There the block is full, and the formula is supposed to include it. Testing one query that ends on a boundary and one that ends one position before it catches both cases.

## Variants and extensions

- **Range add and range sum.** Each block stores a total and a lazy tag. A full-block add changes the tag and the total in $O(1)$; a partial add pushes the tag, updates the elements, and rebuilds the total. A query adds the total of a full block and pushes before scanning a partial one. Both operations are $O(\sqrt{n})$.
- **Range assignment and range sum.** The tag becomes "this whole block is equal to $x$", and a partial update pushes it before writing the elements. The block total of a full assignment is $x$ times the block length.
- **Range minima, maxima, and gcds.** The block total becomes the block minimum, maximum, or gcd. The query combines whole blocks with the same operation and scans the boundaries. No inverse is needed, which is exactly the property a Fenwick tree lacks.
- **Mo's algorithm.** The queries are sorted by the block of their left endpoint and then by their right endpoint, and a moving window maintains the answer. The cost is $O((n + q)\sqrt{n})$ for the movement plus the cost of updating the window. The block decomposition is applied to the queries rather than to the array.
- **Batching updates.** Keep a buffer of the most recent updates and a prefix-sum table built from the older ones. A query reads the table and scans the buffer; when the buffer reaches $B$ entries, rebuild the table. This is $O(\sqrt{n})$ per operation and is useful when the updates are rare but the queries are frequent.
- **Square-root decomposition on trees.** Divide the tree into blocks of nodes, or divide the operations into blocks and rebuild a heavy structure every $B$ operations. Train Tracking and Cow at Large are both instances of the second idea: the block is a group of operations that can be summarized once.
- **Heavy-light by frequency.** Split the values into frequent ("heavy") and rare ("light") ones. Precompute the answers for the heavy values and scan for the light ones. The threshold is again about $\sqrt{n}$, and the total work is $O(n\sqrt{n})$.
- **Two-dimensional blocking.** Divide a grid into square blocks of side $\sqrt{n}$ and store the aggregate of each block. A rectangle query reads full blocks and scans the boundary strips, which costs $O(\sqrt{n})$ per side.
- **A square-root decomposition of the value range.** When the values are large but the number of distinct values is small, blocks of values replace blocks of positions. This is the same balance with a different index set.

The common thread is the choice of a block size that makes two opposing costs comparable. The blocks do not have to be contiguous positions, and the aggregate does not have to be a sum.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Estimate $q\sqrt{n}$ before writing anything. For $n = q = 2 \cdot 10^5$ it is about $9 \cdot 10^{7}$ operations, which is safe in C++ and Java and tight in Python. If the estimate is above $10^{9}$, look for an $O(\log n)$ structure.
2. Choose $B = \lceil \sqrt{n} \rceil$ first, and only tune it after the solution is correct. Keep it in a variable so that a single change retunes the whole program.
3. Write the brute-force scan first. It is the reference for the differential test, and it takes two minutes.
4. Decide the indexing convention before writing the loops. The input is usually 1-based and the implementation is usually 0-based; write the shift once, at the read.
5. Use a 64-bit accumulator. Compute the largest possible sum from the constraints and compare it with the type's maximum before submitting.
6. Test the four boundary cases explicitly: a query of one element, a query of the whole array, a query that starts at the first position of a block, and a query that ends at the last position of a block. Add a query that ends inside the short last block.
7. If the operation is a range update, decide whether a lazy tag is needed before writing the query. Adding the tag later means rewriting both functions.
8. Keep the brute force and compare on random small inputs. A single disagreement is a counterexample; the random test finds the boundary bug that the samples miss.
9. Measure two block sizes if the time limit is close. The theoretical optimum ignores cache behavior, and the measured optimum is often a little larger.
10. Do not force blocks when a Fenwick tree or a segment tree is equally easy. The purpose of the technique is to solve the problems the trees cannot, not to replace them everywhere.

## Worked problems

### Problem 1: the toll-road ledger

**Restatement.** An array of $n$ vehicle counts starts at zero. Then $q$ operations follow: `1 i delta` adds a delta at position $i$, and `2 l r` prints the total over positions $l$ through $r$. Constraints: $1 \le n \le 200\,000$, $1 \le q \le 200\,000$, and $|a_i| \le 10^9$.

**Naive baseline.** Add up the range for every query, at a cost of $O(nq) = 4 \cdot 10^{10}$ additions.

**Insight.** The range is a few whole blocks plus two partial blocks. If each block stores its total, the whole blocks cost one addition each and the partial blocks cost at most $B$ additions each.

**Derivation.** Build the block totals. On an update, write the value and the total of its block. On a query, scan the left boundary, add the totals of the full blocks, and scan the right boundary.

**Correctness.** The three loops partition the range, and the block totals equal the sums of their blocks by the invariant.

**Complexity.** $O(1)$ per update, $O(\sqrt{n})$ per query, $O(n)$ space, 64-bit totals.

**Common wrong approach.** Using the block containing $r$ as a full block. The range ends inside that block, so its total includes elements outside the query; the formula for `lastFull` is what prevents it.

### Problem 2: Train Tracking

**Restatement.** A train has $N \le 10^6$ carriages with IDs $c_0, \ldots, c_{N-1}$, and an integer $K \le N$. Find the minimum ID in every window of $K$ consecutive carriages. The train passes twice, and the notebook holds only 5500 integers, so the algorithm may use $O(\sqrt{N})$ memory but not $O(N)$. The problem is interactive: the implementation provides `helpBessie(int ID)` and calls `get`, `set`, and `shoutMinimum`.

**Naive baseline.** Store every window minimum, which needs $N - K + 1$ integers and exceeds the notebook. Recompute each window from scratch, which is $O(NK)$ time, and still needs the whole window in memory unless it is streamed.

**Insight.** Let $f(i)$ be the index of the minimum in the window starting at $i$. The values $f(i)$ are nondecreasing, because the window slides right and the old minimum either stays or is replaced by something to its right. Record $f$ only at multiples of $B = \lceil \sqrt{N} \rceil$; those boundary minima divide the windows into groups of at most $B$ consecutive windows.

**Derivation.** In the first pass, maintain a monotonic queue over the last $K$ carriages and record the minimum at every multiple of $B$. There are $O(N/B) = O(\sqrt{N})$ recorded values, so the notebook fits. In the second pass, keep one running minimum for each of the next $B$ windows. When the carriage at the next recorded boundary arrives, every window in the group is complete, so its answer can be shouted and the group can be replaced by the next one.

**Correctness.** The nondecreasing property of $f$ means that the minimum of a group of windows cannot move left past the group's recorded boundary. Every window in a group is finalized when the scan reaches the boundary at the end of the group, and no window is skipped because the boundaries are spaced by $B$.

**Complexity.** $O(N)$ time and $O(\sqrt{N})$ memory once each pass uses a monotonic queue. The block boundaries are what reduce the state to $O(\sqrt{N})$. Without the queue, the same decomposition takes $O(N\sqrt{N})$ time.

**Common wrong approach.** Keeping all $N - K + 1$ minima in the notebook. The memory limit is the point of the problem; the block boundaries are what reduce the state to $O(\sqrt{N})$.

### Problem 3: Minimizing Haybales

**Restatement.** There are $N \le 100\,000$ stacks of haybales with heights $h_i$. Adjacent stacks may be swapped when their heights differ by at most $K$. Find the lexicographically smallest sequence reachable by any number of swaps.

**Naive baseline.** Repeatedly search the suffix for the smallest stack that can reach the current position, and move it there. The search is $O(N)$ per position, so the construction is $O(N^2)$.

**Insight.** The final sequence can be built from left to right, one input stack at a time, while the answer is kept in a list of blocks. A block stores its minimum and maximum height and its elements in the order they will appear. A new stack can pass over an entire block exactly when its height is within $K$ of both the block's minimum and maximum; then it belongs somewhere to the left of that block.

**Derivation.** Start with one empty block. For each new height $x$, walk left over the blocks that $x$ can pass over, then insert $x$ into the block where it belongs and rotate it left across the elements it can cross. A block that grows beyond about $\sqrt{N}$ elements is split in half, so there are $O(\sqrt{N})$ blocks and each block has $O(\sqrt{N})$ elements. The min and max of a block are recomputed when it is built and updated on insertion.

**Correctness.** A swap across a boundary is legal exactly when the two heights differ by at most $K$. If $x$ is within $K$ of every element of a block, it can cross the whole block; if it is outside the block's min-max range, at least one element blocks it. The algorithm maintains the invariant that concatenating the blocks gives the lexicographically smallest prefix that can be formed from the stacks read so far. When $x$ arrives, the walk stops at the block where $x$ belongs, and inserting $x$ there and rotating it left over the elements it can cross preserves the invariant, because no element that $x$ must stay to the right of is crossed. Splitting a block in half changes only the representation, not the sequence.

**Complexity.** $O(N\sqrt{N})$ time and $O(N)$ space. Each insertion inspects $O(\sqrt{N})$ blocks, each block has $O(\sqrt{N})$ elements, and a split happens only after $\sqrt{N}$ insertions into the same block.

**Common wrong approach.** Sorting the array globally. The swaps are local, so a small stack cannot cross a neighbor whose height differs by more than $K$; the block min and max are what encode that restriction.

## Practice progression

1. **Recognition.** Given a statement, decide whether blocks apply. Look for point updates mixed with range queries, an associative aggregate, and a constraint that permits $O(\sqrt{n})$ per operation.
2. **Direct application.** Implement the block totals, the point update, and the three-loop range query, and compare against a brute-force scan on random arrays of size at most 100.
3. **Boundary work.** Test the short last block, a query that ends on a block boundary, a query that ends one position before it, and the empty and single-element arrays.
4. **Adaptation.** Implement range add and range sum with lazy block tags. Push the tag before every partial update and every partial query.
5. **Combination.** Use the same decomposition for a range minimum or a gcd, then implement Mo's algorithm and observe that the block size now controls the movement of two pointers rather than the length of a scan.
6. **Transfer.** Solve a problem where the memory limit forbids storing the array, and a problem where the blocks are blocks of operations rather than positions. Train Tracking and Minimizing Haybales are the two models.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a block store, and what does the implementation store beside it? (Formal model)
2. Why is a point update $O(1)$ while a range query is $O(\sqrt{n})$? (Key insight)
3. How is the block size chosen, and what happens to the two costs when it is doubled? (Key insight)
4. Why does the query need three loops rather than two? (Algorithm derivation)
5. State the invariant and say which operation preserves it. (Correctness proof)
6. What is the exact formula for the last full block, and why is `right / B` wrong? (Common mistakes)
7. How many blocks are there, and why is the count rounded up? (Implementation walkthrough)
8. What changes when the update is a range add instead of a point add? (Variants and extensions)
9. When is a segment tree the better tool, and when are blocks the better tool? (Algorithm selection)
10. Why does Train Tracking need blocks, and what does the block boundary represent? (Worked problems)

## Further reading

- The dynamic structure that answers point updates and range sums in logarithmic time is the [Fenwick tree](/algorithms/range-queries/fenwick-tree); the article explains why its prefix trick needs an invertible operation.
- The structure that answers range minima and maxima without an inverse is the [segment tree](/algorithms/range-queries/segment-tree); it is the natural next step after blocking.
- The static structure that answers range queries in constant time is the [sparse table](/algorithms/range-queries/sparse-table), which trades a logarithmic build for constant queries and no updates.
- The technique that makes a range sum constant-time when nothing changes is [prefix sums](/algorithms/arrays/prefix-sums), and the article explains why a single point update defeats it.
- The reverse operation, in which a range update becomes two point changes, is described under [difference arrays](/algorithms/arrays/difference-arrays).
- The [complexity](/algorithms/foundations/complexity) article states the asymptotic notation used throughout, and the [sorting](/algorithms/foundations/sorting) article covers the comparison bounds that Mo's algorithm and block sorting rely on.
