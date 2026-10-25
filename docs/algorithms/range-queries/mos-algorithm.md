---
id: range-queries.mos-algorithm
title: Mo's algorithm
summary: Answer a batch of range queries on a static array by sorting the queries into blocks and moving the two endpoints of one maintained window instead of rescanning every range.
division: [gold, platinum]
subjects: [range-queries]
level: advanced
importance: specialized-technique
keywords:
    [
        mo's algorithm,
        mo algorithm,
        offline queries,
        sqrt decomposition,
        block sort,
        distinct values,
        endpoint movement,
    ]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity, foundations.sorting]
    recommended:
        [arrays.coordinate-compression, range-queries.fenwick-tree, range-queries.segment-tree]
complexity:
    time: "O((n + q) sqrt n) for the batch, plus O(q log q) to sort"
    space: "O(n + q)"
assumptions:
    - The array never changes, and every query is known before the first answer is produced.
    - The answer can be maintained in constant time when one element is added to or removed from either end of the current range.
implementations: range-queries.mos-algorithm
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/range-queries.mos-algorithm.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

Mo's algorithm is an offline technique for a batch of range queries on an array that never changes. It does not build a tree and it does not precompute an aggregate. It maintains one window over the array and moves the two ends of that window from one query to the next, updating the answer as elements enter and leave.

The idea is that the answer to a query is often easy to repair when the range changes by one element. The expensive part is getting from one query's range to an unrelated query's range. If the queries are processed in a clever order, the total distance the two endpoints travel is only $O((n + q)\sqrt{n})$, even though a single query may still require a long move.

That is the whole algorithm: one state, two indices, four loops, and a sort. The sort is what turns $q$ independent scans into one sweep with $O((n + q)\sqrt{n})$ endpoint steps.

The cost is paid by the batch, not by the query. A single query can be answered after $O(n)$ moves, so Mo's algorithm is unsuitable when the answers must be produced online, in the order they arrive.

## Problem motivation

A logger records one identifier per minute, and an analyst asks thousands of questions about contiguous stretches of the log: "how many different identifiers appear between minute $l$ and minute $r$?" The log is complete before the first question, and no minute is ever rewritten.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ minutes.
- $1 \le q \le 200\,000$ questions.
- Each identifier is a signed 32-bit integer, and the identifiers are sparse.

Scanning the range for every question costs $O(nq) = 4 \cdot 10^{10}$ inspections. A hash set rebuilt per question costs the same in the worst case, and clearing the set between questions adds another $O(n)$ per question.

For this particular function there is a faster offline sweep with a [Fenwick tree](/algorithms/range-queries/fenwick-tree): sort the questions by their right endpoint and count the last occurrence of every value. That special-purpose solution is worth knowing, but it depends on the answer being a count of distinct values. Change the question to "how many pairs of equal identifiers are in the range?" or "how many identifiers occur exactly twice?" and the sweep no longer applies unchanged.

Mo's algorithm is the general answer to that family. It asks only that the answer be repairable when one element enters or leaves the current range, and it gets the order of the questions out of the way with a square-root decomposition of the left endpoint.

The technique is _offline_: every question is read first, then reordered, then answered. That is acceptable here because the log never changes. It is not acceptable when the answer to a question determines the next question, or when the questions must be answered as they arrive.

## Recognition patterns

Mo's algorithm is the right tool when all of the following hold.

- The array is **static**. No updates arrive between the queries.
- The queries are **known in advance**, so they can be reordered.
- Every query is a **contiguous range** $[l, r]$.
- The answer is a function of the **multiset of values** in the range, and that function can be updated in $O(1)$ when one value is added or removed.
- The number of queries is large enough that $O((n + q)\sqrt{n})$ is comfortable and $O(nq)$ is not.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $q \le 100$ and $n \le 10^5$ | A direct scan per query is $10^7$ operations; Mo's algorithm is unnecessary |
| Updates interleaved with queries | Plain Mo's algorithm is ruled out; the queries no longer share one array |
| Queries must be answered online | Mo's algorithm is ruled out; it needs the whole batch |
| Each query asks for a range maximum and removals are not supported | Ruled out unless a multiset or a frequency table makes removal logarithmic |
| $n, q \le 2 \cdot 10^5$ and the state supports add and remove | Mo's algorithm fits comfortably |
| $n, q \le 10^6$ | The movement count grows to about $2 \cdot 10^9$; check the time limit carefully |
| The answer is a simple prefix-decomposable sum | A Fenwick tree answers offline in $O((n+q)\log n)$ and is faster |

The phrases in a statement that signal this technique are "for each of the $q$ ranges", "the array does not change", "count the number of distinct values in the range", and "the queries are independent". The phrase that rules it out is "the value at position $i$ changes to $v$ between queries", unless the modification variant of the technique is intended.

<Synonyms terms="mo's algorithm, mo algorithm, offline range queries, sqrt decomposition on queries" />

## Naive approach

The baseline rebuilds the answer for every query.

```cpp
int distinctInRange(const std::vector<int>& a, int left, int right) {
    std::unordered_set<int> seen;
    for (int i = left; i <= right; ++i) {
        seen.insert(a[i]);
    }
    return static_cast<int>(seen.size());
}
```

This is $O(n)$ expected time per query and $O(n)$ temporary space, so the batch costs $O(nq)$. At the stated limits that is $4 \cdot 10^{10}$ insertions, which is far beyond a contest time limit.

The second baseline keeps a frequency array and clears it after every query. The per-query work is still $O(n)$ for the scan, and the clearing is another $O(n)$ unless the touched positions are recorded, which is more bookkeeping for the same asymptotic cost.

The third baseline answers distinct-value queries with a Fenwick tree over the last occurrence of each value. It costs $O((n + q)\log n)$ and is the right answer for that exact question. It is listed here because it shows the boundary of Mo's algorithm: the Fenwick sweep exploits a decomposition that most range functions do not have.

The brute-force scan remains useful as the reference implementation. On small random arrays it is the oracle that catches every off-by-one error in the optimized solution.

## Key insight

The insight has two halves.

**First half.** Moving one endpoint of a range by one position adds or removes exactly one element. If the answer can be updated in constant time when an element is added or removed, then the cost of answering a query is proportional to the distance between its range and the previous range, not to the length of the range.

**Second half.** The queries can be reordered so that the total distance between consecutive ranges is small. The order is not arbitrary: the left endpoint is bucketed into blocks of size about $\sqrt{n}$, and within a block the right endpoint is swept monotonically.

Write a query as the point $(l, r)$ in the plane. Moving from one query to the next costs

$$
d\bigl((l_1, r_1), (l_2, r_2)\bigr) = |l_1 - l_2| + |r_1 - r_2|,
$$

which is the number of single-element additions and removals. The naive order can make this sum $O(nq)$, because consecutive points can be arbitrarily far apart.

The block order changes the picture. Divide the left endpoints into blocks of width $B$. All queries with $l$ in the same block are answered consecutively. Within one block, $l$ moves by at most $B$ per query, so the left endpoint's jitter contributes $O(qB)$ over the batch, and the crossings between blocks add $O(n^2/B)$. The right endpoint, within one block, moves in one direction only, so it also contributes $O(n)$ per block and $O(n^2/B)$ over the $n/B$ blocks. The total is

$$
O\left(qB + \frac{n^2}{B}\right),
$$

and choosing $B \approx \sqrt{n}$ makes both terms $O((n + q)\sqrt{n})$.

The alternating direction of the right endpoint is a constant-factor improvement, not a change in the bound. In an even-numbered block the right endpoint sweeps upward; in an odd-numbered block it sweeps downward. That way the endpoint ends a block near the position where the next block begins, instead of jumping back across the whole array.

The worked example makes the mechanics concrete. Take the array

$$
a = [3,\; 2,\; 3,\; 1,\; 2]
$$

and the three queries $[1,3]$, $[2,4]$ and $[1,5]$. With $B = 2$ all three left endpoints fall in the first block, so the queries stay in increasing right-endpoint order. The window starts empty at $[1, 0]$.

- Query $[1,3]$: add positions $1, 2, 3$. The window holds $\{3, 2, 3\}$, and the number of distinct values is $2$.
- Query $[2,4]$: remove position $1$, then add position $4$. The window holds $\{2, 3, 1\}$, and the answer is $3$.
- Query $[1,5]$: add position $1$, then add position $5$. The window holds $\{3, 2, 3, 1, 2\}$, and the answer is $3$.

The three answers are $2, 3, 3$, which match a direct scan. The window moved $3 + 2 + 2 = 7$ endpoint steps, while three independent scans would have inspected $3 + 3 + 5 = 11$ elements. The difference is small at this size and becomes decisive at $n = q = 200\,000$.

## Visual intuition

Draw the queries as points in a grid whose horizontal axis is $l$ and whose vertical axis is $r$. Every query is a point, and the cost of a processing order is the Manhattan length of the path that visits every point.

The naive order is the order of the input, and the path can zigzag across the whole grid. The block order visits the points in vertical strips: first every point whose $l$ lies in the first block, then every point in the second block, and so on.

Within a strip the right endpoint is swept from one end of the grid to the other. That sweep is the long vertical line in the picture. The left endpoint only has to cover the width of one strip, which is short. When the strip is finished, the path crosses to the next strip, and the alternating direction of the right sweep means that the crossing starts where the previous sweep ended rather than at the opposite edge.

The two costs are visible in this picture. The vertical sweeps cost $O(n)$ per strip, and there are $n/B$ strips. The horizontal jitter costs $O(B)$ per query, and there are $q$ queries. Neither term depends on the length of a query, only on how far the window has to move.

The table below shows the same three queries sorted by the block key, with the window and the answer after each step.

| Step | Query   | Added     | Removed | Window  | Distinct |
| ---- | ------- | --------- | ------- | ------- | -------- |
| 0    | none    | none      | none    | $[1,0]$ | 0        |
| 1    | $[1,3]$ | $3, 2, 3$ | none    | $[1,3]$ | 2        |
| 2    | $[2,4]$ | $1$       | $3$     | $[2,4]$ | 3        |
| 3    | $[1,5]$ | $3, 2$    | none    | $[1,5]$ | 3        |

The window is never rebuilt. Every entry is an addition on the right, an addition on the left, a removal on the left, or a removal on the right.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array. A query is a pair $(l, r)$ with $1 \le l \le r \le n$, and the answer is a function of the multiset

$$
S(l, r) = \{a_l, a_{l+1}, \ldots, a_r\}.
$$

::: math definition Definition
For a multiset $S$ and a value $x$, let $c_S(x)$ be the number of occurrences of $x$ in $S$. The **distinct count** is

$$
D(S) = \bigl|\{\, x : c_S(x) > 0 \,\}\bigr|.
$$
:::

::: math definition Definition
The **add** operation inserts one copy of $x$ into $S$. The **remove** operation deletes one copy of $x$ from $S$, and is defined only when $c_S(x) > 0$.
:::

::: math lemma Lemma
For a multiset $S$ and a value $x$,

$$
D(S \cup \{x\}) = D(S) + [c_S(x) = 0],
\qquad
D(S \setminus \{x\}) = D(S) - [c_S(x) = 1],
$$

where the bracket is $1$ when the condition holds and $0$ otherwise.
:::

::: math definition Definition
Fix a block width $B \ge 1$. The **block key** of a query $(l, r)$ is the pair

$$
\left(\left\lfloor \frac{l - 1}{B} \right\rfloor,\; r\right)
$$

if the block number is even, and

$$
\left(\left\lfloor \frac{l - 1}{B} \right\rfloor,\; -r\right)
$$

if the block number is odd. Queries are processed in increasing block key, which means increasing block number, and within one block increasing $r$ for an even block and decreasing $r$ for an odd block.
:::

::: math definition Definition
A **processing order** is a permutation $\pi$ of the $q$ queries. Its **movement cost** is

$$
C(\pi) = \sum_{i=1}^{q} \Bigl( |l_{\pi(i)} - l_{\pi(i-1)}| + |r_{\pi(i)} - r_{\pi(i-1)}| \Bigr),
$$

where the previous range is the empty range $(1, 0)$ for $i = 1$.
:::

The state kept by the algorithm is exactly the multiset $S$ of the current window and the current value of $D(S)$. The order changes only the cost of reaching each window; it does not change the window that is required for a query.

## Algorithm derivation

The algorithm has three parts: coordinate compression, ordering, and endpoint movement. Compression is not part of Mo's algorithm itself, but the frequency table needs a dense index, so it is included in the reference implementations.

**Compression.** Sort a copy of the array and remove duplicates. Replace every value by its rank, a number from $0$ to $m - 1$, where $m$ is the number of distinct values. Equal values receive equal ranks and unequal values receive unequal ranks, so the distinct count is unchanged. The rank table and the frequency table both have $m$ entries; reserve one extra slot if the ranks start at one.

**Ordering.** Compute the block of each left endpoint and sort the queries by the block key from the formal model. The block width is

$$
B = \max\left(1, \left\lfloor \sqrt{n} \right\rfloor\right),
$$

with the guard required because $n = 0$ or $n = 1$ would otherwise produce a block width of zero and a division by zero.

**Movement.** Keep two indices `curL` and `curR` and the invariant that the current window is `[curL, curR]`. Start with `curL = 1` and `curR = 0`, which is the empty range. For each query in sorted order, perform four adjustments:

```text
while curL > l:  curL -= 1;  add(a[curL])
while curR < r:  curR += 1;  add(a[curR])
while curL < l:  remove(a[curL]); curL += 1
while curR > r:  remove(a[curR]); curR -= 1
answer[id] = D
```

The first two loops grow the window, and the last two shrink it. The order of the four loops does not matter for the final state, because each loop only touches positions that are outside the target range on one side and inside the current range on the other. The order does matter for one edge case: when the current window is empty, the two shrinking loops must not remove anything, and they do not, because `curL = 1` and `curR = 0` make their conditions false for every valid target range.

The correctness of each adjustment is the lemma above. Adding a value that already occurs leaves the distinct count unchanged; adding a value that is absent increases it by one. Removing a value that occurs more than once leaves the count unchanged; removing the last copy decreases it by one.

The answer is stored by the query's original index, not by its position in sorted order. That single line is what allows the output to be reported in the input order even though the processing order is different.

::: math invariant Invariant
Before each query is processed, `curL` and `curR` delimit a subarray of $a$, the frequency table records the number of occurrences of every value in that subarray, and `D` equals the number of values whose frequency is positive.
:::

### Why the block order is the right order

A cost of $O(n)$ per query would be no better than rescanning. The block order is chosen to make the two endpoints' contributions balance.

The left endpoint never moves more than $B$ inside one block, because two left endpoints in the same block differ by less than $B$. Across all $q$ queries that is $O(qB)$. The crossings between blocks add $O(n)$ per block, which is $O(n^2/B)$ over $n/B$ blocks.

The right endpoint is monotone inside one block. It traverses at most the whole array once per block, so it contributes $O(n)$ per block, also $O(n^2/B)$. The only remaining cost is the sort, $O(q \log q)$.

Setting the two terms equal gives $qB = n^2/B$, or $B = n/\sqrt{q}$. When $q$ is close to $n$ this is $\sqrt{n}$, and the total is $O(n\sqrt{q})$. When $q$ is much smaller than $n$, the tuned width $B = n/\sqrt{q}$ is better than $\sqrt{n}$; when $q$ is much larger, the guard $B \ge 1$ takes over and the cost is $O(q + n^2)$ endpoint moves at width one. The reference implementations use the simple $\sqrt{n}$ width because it is robust and its bound is easy to state.

The alternating direction of the right endpoint does not change the asymptotic bound. It removes a factor of about two in practice, because an ascending sweep that ends at $n$ would otherwise force the next block's descending sweep to start with a jump of nearly $n$.

## Step-by-step execution

Use the array $a = [3, 2, 3, 1, 2]$ and the queries $(1,3)$, $(2,4)$, $(1,5)$, with $B = 2$. The compression maps the distinct values $1, 2, 3$ to the ranks $0, 1, 2$; the steps below name the original values so that the frequencies stay readable.

1. Compute the block of each query. The left endpoint $1$ lies in block $0$, and so does the left endpoint $2$, because $\lfloor (1-1)/2 \rfloor = 0$ and $\lfloor (2-1)/2 \rfloor = 0$. All three queries land in block $0$, which is even, so they are ordered by increasing $r$: $(1,3)$, $(2,4)$, $(1,5)$.
2. Start with `curL = 1`, `curR = 0`, and `D = 0`. The frequency table is empty.
3. Process $(1,3)$. Grow the right endpoint from $0$ to $3$: add $a_1 = 3$, add $a_2 = 2$, add $a_3 = 3$. The frequencies are $c(2)=1$ and $c(3)=2$, so $D = 2$. Store $2$ at the query's original index.
4. Move to $(2,4)$. The left endpoint must increase from $1$ to $2$, so remove $a_1 = 3$. Its frequency drops from $2$ to $1$, and $D$ stays $2$. The right endpoint grows from $3$ to $4$, so add $a_4 = 1$. That value was absent, so $D$ becomes $3$. Store $3$.
5. Move to $(1,5)$. The left endpoint must decrease from $2$ to $1$, so add $a_1 = 3$. Its frequency rises from $1$ to $2$, and $D$ stays $3$. The right endpoint grows from $4$ to $5$, so add $a_5 = 2$. Its frequency rises from $1$ to $2$, and $D$ stays $3$. Store $3$.
6. Report the stored answers in the original query order: $2$, $3$, $3$.

The total number of endpoint moves is $3 + 2 + 2 = 7$. A direct scan of the three ranges inspects $3 + 3 + 5 = 11$ elements. The saving grows with the number of queries: for one hundred thousand queries of average length fifty thousand, the direct scan inspects $5 \cdot 10^{9}$ elements while the block order moves the endpoints about $6 \cdot 10^{7}$ times.

The step that is easiest to get wrong is step 4. The four loops in the order shown are safe even when the current window starts empty, because the grow loops run before the shrink loops. What is not safe is changing `curL` without adding or removing the element at the position that is being included or excluded.

## Correctness proof

::: math theorem Theorem
For every query, after the four adjustment loops finish, the stored answer equals the number of distinct values in the queried range.
:::

::: math proof Proof
The proof has three parts: the invariant is preserved by every adjustment, the adjustments reach the target range, and every query is processed exactly once.

**The invariant is preserved.** Initially the window is empty, the frequency table is zero, and $D = 0$, which is the distinct count of the empty multiset. Suppose the invariant holds for the current window. An `add` of a value $x$ increments $c(x)$. If $c(x)$ was zero, the number of positive frequencies increases by one and the algorithm increments $D$; otherwise it stays the same. A `remove` decrements $c(x)$. If $c(x)$ was one, the number of positive frequencies decreases by one and the algorithm decrements $D$; otherwise it stays the same. Each case is exactly the lemma, so the invariant holds after every single endpoint move.

**The adjustments reach the target.** Consider the left endpoint. If `curL > l`, the first loop decreases `curL` one position at a time and adds each new position, until `curL = l`. If `curL < l`, the third loop removes the position at `curL` and then increments it, until `curL = l`. The right endpoint is handled symmetrically by the second and fourth loops. Each loop terminates because its condition moves the index strictly toward the target. When all four loops finish, `curL = l` and `curR = r`.

**Every query is answered once.** The processing order is a permutation of the query set, so each query appears exactly once. Since the algorithm stores the answer at the query's original index, and the invariant gives the distinct count of the window that equals that query's range, every stored answer is correct. The output step reads the answers by original index, so it reports them in input order. $\square$
:::

::: math lemma Lemma
The movement cost of the block order with block width $B$ is $O(qB + n^2/B)$.
:::

::: math proof Proof
Partition the queries by the block of their left endpoint. Within one block, two left endpoints differ by less than $B$, so the total left movement inside the block is at most $(q_k + 1)B$, where $q_k$ is the number of queries in the block. Summing over all blocks gives $O(qB)$ plus at most $O(n)$ for each of the $n/B$ blocks.

Inside one block, the right endpoints are sorted monotonically, either upward or downward. A monotone sequence of values in $[1, n]$ has total variation at most $n - 1$, so each block contributes at most $n$ right-endpoint moves. There are at most $n/B + 1$ blocks, so the right endpoint contributes $O(n^2/B + n)$. Adding the two contributions gives $O(qB + n^2/B)$. $\square$
:::

## Complexity analysis

**Sorting: $O(q \log q)$.** The queries are sorted by a two-field key. Any comparison sort achieves this bound.

**Endpoint movement: $O(qB + n^2/B)$.** The lemma above partitions the movement into the left endpoint's jitter inside a block and the right endpoint's monotone sweep across a block. The bound is worst-case and does not assume anything about the distribution of the queries.

**Choice of block width.** With $B = \lfloor\sqrt{n}\rfloor$, the bound becomes $O((n + q)\sqrt{n})$. With $B = n/\sqrt{q}$, it becomes $O(n\sqrt{q})$, which is better when $q \ll n$. The reference implementations use the first choice with a guard against zero.

**Total time.** $O(q \log q + (n + q)\sqrt{n})$. For $q = n = 200\,000$, the movement term is about $1.8 \cdot 10^{8}$ steps, and each step is a constant number of array operations. The sort is negligible by comparison.

**Space.** $O(n + q)$: the rank table for the compressed values, the frequency table over the distinct values, the sorted query list, and the answer array. The window itself needs no storage beyond the two indices.

::: math complexity Complexity
Mo's algorithm over an array of $n$ values and a batch of $q$ queries: $O(q \log q + (n + q)\sqrt{n})$ time and $O(n + q)$ extra space.
:::

The width of the maintained statistic is a separate decision. The distinct count fits in a 32-bit integer because it never exceeds $n$. A statistic such as the number of equal pairs, or the sum of squared frequencies multiplied by a value, can exceed $2^{31}$ and must use a 64-bit accumulator. The complexity is unchanged, but the answer is wrong without the wider type.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static array, many range queries, answer maintainable under add and remove | Mo's algorithm |
| Point updates and range sums | [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Point updates and range minima, maxima, or arbitrary associative aggregates | [Segment tree](/algorithms/range-queries/segment-tree) |
| Static array, range minimum or maximum, no updates | [Sparse table](/algorithms/range-queries/sparse-table) |
| Static array, range sum, no updates | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Static array, distinct values, only distinct-count queries | Offline sweep with a Fenwick tree |
| Range $k$-th smallest element | Wavelet tree, merge sort tree, or persistent segment tree |
| Range mode with updates | Square-root decomposition, or Mo's algorithm with a frequency-of-frequencies table |
| Queries must be answered online | A persistent or indexed structure, not Mo's algorithm |
| Very few queries | Direct scan |

The first row is this article's case. The sixth row is the important comparison: for the single function that the reference program computes, a Fenwick sweep is asymptotically faster. Mo's algorithm earns its place by handling the whole family of functions that have an $O(1)$ add and remove, including several that no prefix sweep can express.

The last two rows are the boundary. Mo's algorithm is offline by construction, and it is only worth its constant factors when the batch is large enough that $O(nq)$ is impossible.

## Reference implementations

The six implementations are listed above with their language, file, recommendation, verification status, and a link to the raw source. All six are the `program` variant: they read the same input, produce the same output, and are byte-identical after the line endings are normalized.

The input contract is

```text
n q
a_1 a_2 ... a_n
l_1 r_1
...
l_q r_q
```

where $1 \le l_i \le r_i \le n$. The output is one line per query, holding the number of distinct values in $a_{l_i}, \ldots, a_{r_i}$, in the original query order.

Each program compresses the values, builds the block order, moves the window, and stores the answers by the original query index. The C, C++, Java, Pascal, and JavaScript versions use a fixed-width integer for the values; Python uses its arbitrary-precision integers. The frequency table is indexed by rank, so its size is the number of distinct values, not the range of the input.

The implementations are educational references for the technique, not submissions for a particular judge. The C version owns its arrays through `malloc` and `free`; the C++ version uses `std::vector`; Java and JavaScript rely on garbage collection; Pascal uses dynamic arrays; Python uses lists.

## Recursion decision

Mo's algorithm does not recurse. The endpoint adjustment is four `while` loops, and the ordering is a library sort or an iterative merge sort.

The reason is structural rather than stylistic. The state transition for one endpoint step is constant time and has no subproblem. Recursion would add a call frame to a step that is already only a few array reads and writes, and it would make the four adjustments harder to read without changing what they compute.

The only place recursion could appear is the sort. The implementations use the standard library where one exists, and Pascal uses an iterative merge sort because its run-time library has no general-purpose comparison sort for records. That sort is bottom-up: it doubles the merge width on every pass and never calls itself.

| Language | Cost of one endpoint step | Recursive verdict |
| --- | --- | --- |
| C and C++ | A few nanoseconds | Do not recurse; the loop is the whole operation |
| Java | A few nanoseconds after the JIT warms up | Do not recurse; the call overhead is larger than the step |
| Python | Tens of nanoseconds for a list update | Do not recurse; the interpreter overhead already dominates |
| Pascal | A few nanoseconds | Do not recurse; the loop is clearer and faster |
| JavaScript | A few nanoseconds after the JIT warms up | Do not recurse; the call overhead is avoidable |

The rule of thumb from the recursion article applies unchanged: when the depth is provably one and the work per level is constant, a loop is the natural form.

## Implementation walkthrough

Five details decide whether the implementation is correct and fast.

**The indexing.** The statement uses 1-based inclusive ranges, while every program stores the values in a 0-indexed array. A window index such as `curLeft` is 1-based, and the array access is `rank[curLeft - 1]`. The conversion happens at exactly one point in each adjustment loop, and nowhere else. Mixing a 1-based window index with a 1-based array access is the source of most off-by-one errors.

**The compression.** The frequency table must be indexed by value, and the input values can be as large as $10^9$ or negative. Sorting a copy and binary-searching each value costs $O(n \log n)$ and produces ranks that are dense. The alternative, a hash map inside the add and remove operations, adds a hash lookup to every endpoint step and is measurably slower at the stated limits.

**The order.** The comparator is the heart of the algorithm:

```cpp
int blockOf(int l) {
    return (l - 1) / block;
}

bool before(const Query& x, const Query& y) {
    int bx = blockOf(x.l);
    int by = blockOf(y.l);
    if (bx != by) {
        return bx < by;
    }
    if (bx % 2 == 0) {
        return x.r < y.r;
    }
    return x.r > y.r;
}
```

The block is computed from `l - 1`, not from `l`, so that the first block contains exactly $l = 1, \ldots, B$. Computing it from `l` shifts every block boundary by one position and changes the constant factor but not the asymptotic bound; either choice is defensible, and the reference implementations use `l - 1`.

**The updates.** The distinct count is maintained with the two rules from the lemma. The order of the check and the increment matters: `if (freq[x] == 0) { distinct += 1; } freq[x] += 1;` is correct, and `freq[x] += 1; if (freq[x] == 1) ...` is also correct, but `if (freq[x] == 1) ...; freq[x] += 1;` counts the second copy instead of the first. The removal is the mirror image: decrement first, then test for zero.

**The output.** The answers must be printed in the original order. Store them in an array indexed by the query's original `id`, then print that array from first to last. Printing directly while processing the sorted order is the mistake that produces a correct multiset of answers in the wrong sequence.

The block width has one guard that is easy to omit:

```cpp
int block = static_cast<int>(std::sqrt(static_cast<double>(n)));
if (block < 1) {
    block = 1;
}
```

Without the guard, `n = 1` gives `block = 1` by luck on most platforms, but `n = 0` gives `block = 0` and the division inside the comparator is undefined. The guard costs one comparison and removes a crash.

The four adjustment loops are best written in the grow-then-shrink order shown earlier. When the current window is empty, the grow loops add the target range and the shrink loops do nothing. Every intermediate state is a valid subarray, so the frequency table and the distinct count remain correct after each individual move, not only after a query is finished.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Printing answers while processing the sorted order | The answers are correct but in the wrong sequence | Store by original query index, then print in input order |
| Forgetting the `l - 1` in the block number | Block boundaries are shifted, and the first block has one extra position | Use `(l - 1) / B` consistently |
| Using `B = 0` when $n = 0$ or $n = 1$ | Division by zero in the comparator | Clamp the block width to at least one |
| Removing before checking the frequency | The last copy is missed, and the distinct count is one too high | Decrement, then test for zero |
| Adding before checking the frequency | The first copy is missed, and the count is one too low | Test for zero, then increment |
| Rebuilding the frequency table per query | The batch costs $O(nq)$ again | Clear nothing; move the endpoints |
| Sorting only by the left block | The right endpoint is not monotone, and the constant factor is much worse | Alternate the right endpoint's direction by block parity |
| Using a hash map for the frequencies | Every endpoint step pays a hash lookup | Compress the values to dense ranks |
| Applying the technique with updates present | The sorted queries see the wrong array | Use the modification variant, or an online structure |
| Using a 32-bit accumulator for a pair count | The answer overflows silently | Choose the accumulator width from the maximum possible answer |

### Why this fails: the update that the ordering cannot absorb

The mistake that survives review most often is treating Mo's algorithm as a general range-query engine and applying it to a problem whose array changes between queries.

Start with the array $[5, 1]$ and apply two updates: "set position $1$ to $9$", then "report the maximum of $[1,2]$", then "set position $2$ to $-1$", then "report the maximum of $[1,2]$". The correct answers are $9$ and $9$. If the two queries are sorted by their block key, the sort may place the second query before the first, and the window will be evaluated on an array state that belongs to the wrong moment. The answers are then wrong even though the window logic is perfect.

The root cause is that the query is not a function of the array alone. It is a function of the array _at a particular time_. Sorting the queries destroys the time order, which is the one thing the algorithm cannot reconstruct. The repair is not a different comparator; it is a third dimension. The modification variant of Mo's algorithm includes the update time in the sort key and uses a block width of about $n^{2/3}$, which raises the total cost to $O(n^{5/3})$ when $q$ is about $n$.

There is a second failure with the same shape but no updates. Suppose the maintained statistic is the range maximum. Adding an element is easy: compare it with the current maximum. Removing the element that happens to be the maximum is not, because after the removal the maximum may be the second-largest value, and a single scalar does not remember it. On the array $[5, 1]$, the window $[1,2]$ has maximum $5$; shrinking it to $[2,2]$ requires recovering $1$ from a state that stored only $5$.

A multiset repairs this particular case at a cost of $O(\log n)$ per endpoint move, which turns the batch into $O((n + q)\sqrt{n}\log n)$. That is sometimes fast enough and sometimes not. The structural condition for plain Mo's algorithm is stronger than "the answer is computable": the answer must be maintainable under both insertion and deletion. Counts, sums, frequency-of-frequency tables, and prefix-xor counts satisfy it. A bare maximum, a bare minimum, or an order statistic does not.

## Variants and extensions

- **Mo's algorithm with modifications.** Add a third coordinate, the number of updates applied so far, and sort by the block of the left endpoint and then by the block of the time. The window also has to apply and undo updates. The cost rises to about $O(n^{5/3})$ for $n$ queries and $n$ updates.
- **Hilbert order.** Replace the block key with the position of the query on a Hilbert curve. The asymptotic bound is the same, but the path visits nearby queries more consistently, and the constant factor is often smaller on adversarial inputs.
- **Rollback Mo's algorithm.** When removal is hard but insertion is easy, process the queries block by block. For each block, handle the ranges that lie entirely inside it directly, and for the others move only the right endpoint, then roll the left endpoint back after each query. The state is restored from a stack, and the cost stays $O((n + q)\sqrt{n})$.
- **Mo's algorithm on trees.** Flatten the tree with an Euler tour that records each vertex twice. A path query becomes a range query on the tour, with a parity rule that says whether a vertex appears an odd number of times and therefore belongs to the path.
- **Range mode.** Keep a frequency table and a second table indexed by frequency. The mode is the largest frequency with a positive count, and both tables update in constant time per endpoint move.
- **Mo's algorithm with a Fenwick tree inside the window.** When the maintained state needs an order statistic, a Fenwick tree over the compressed values supplies it at a logarithmic cost per move. This is the fallback when the state is not constant-time maintainable.
- **Tuned block width.** Use $B = n/\sqrt{q}$ rather than $\sqrt{n}$ when $q$ is much smaller or much larger than $n$, and measure on the judge rather than trusting the asymptotic constant.
- **Two-dimensional Mo's algorithm.** For queries on a matrix, both endpoints of both dimensions move, and the block decomposition is applied to one of the four coordinates.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each is avoidable with a fixed procedure.

1. Confirm that the array is static and that the queries can be read before any is answered. If either condition fails, stop and choose a different technique.
2. Write the add and remove operations first, and prove that each is $O(1)$. If either needs a logarithmic structure, the total cost changes and the block width may need tuning.
3. Compress the values before writing the window loops. A dense rank array makes the frequency table a plain array and removes every hash lookup from the hot path.
4. Write the comparator with the block parity and test it on a small batch by printing the sorted order. A wrong comparator produces correct answers and a slow program, which is harder to diagnose than a wrong answer.
5. Store the answers by original index, and print them in input order.
6. Test the edge cases explicitly: a single-element array, a query of length one, a query of the whole array, repeated identical queries, and $q = 0$.
7. Compare against the brute-force scan on random small arrays. A disagreement is a counterexample worth more than an hour of reading.
8. Check the accumulator width against the largest possible answer, not against the largest input value.

## Worked problems

### Problem 1: distinct values in a range

**Restatement.** An array of $n$ signed integers is given, followed by $q$ queries. For each query $[l, r]$, report the number of distinct values in that range. Constraints: $1 \le n, q \le 200\,000$ and $|a_i| \le 10^9$.

**Naive baseline.** Insert the range into a hash set for every query, at a cost of $O(nq) = 4 \cdot 10^{10}$ expected insertions.

**Insight.** Adding an element changes the distinct count only when its frequency was zero. Removing one changes it only when its frequency becomes zero. Both updates are constant time, so the window can be moved one position at a time.

**Derivation.** Compress the values. Sort the queries by the block of $l$ and then by $r$, alternating the direction of $r$ between blocks. Start with an empty window and apply the four adjustment loops. Store each answer by the query's original index.

**Correctness.** The invariant says that the frequency table and the distinct count always describe the current window. The add and remove lemmas preserve the invariant, and the four loops transform the current window into the queried one. Every query is processed once, and the stored answer is therefore the distinct count of its range.

**Complexity.** $O(q \log q + (n + q)\sqrt{n})$ time and $O(n + q)$ space.

**Common wrong approach.** Printing the answers in sorted order instead of restoring the original order. The values are all correct, so the mistake survives a casual check and fails the judge.

### Problem 2: the power of a subarray

**Restatement.** An array of positive integers is given. For each query $[l, r]$, let $K_s$ be the number of occurrences of the value $s$ in the range, and report

$$
\sum_s K_s^2 \cdot s.
$$

Constraints: $1 \le n, q \le 200\,000$ and $1 \le a_i \le 10^6$.

**Naive baseline.** Count the frequencies in the range for every query, at a cost of $O(nq)$.

**Insight.** The statistic is a sum of independent contributions, one per value. When a value $x$ is added and its current frequency is $c$, its contribution changes from $c^2 x$ to $(c+1)^2 x$, an increase of $(2c+1)x$. When it is removed, the contribution decreases by $(2c-1)x$. Both are computed from the frequency before the change.

**Derivation.** Compress the values to ranks, or use a direct table because $a_i \le 10^6$ is small enough. Maintain the frequency table and the running power. On an add of rank $x$, first add $(2c+1)\cdot x$ to the answer, where $c$ is the current frequency, then increment the frequency. On a remove, first decrement the frequency, then subtract $(2c-1)\cdot x$, where $c$ is the frequency before the decrement.

**Correctness.** Each add or remove changes the contribution of exactly one value by exactly the amount shown, and leaves every other value's contribution untouched. The running sum therefore equals the power of the current window after every update, and the window argument of Problem 1 carries over unchanged.

**Complexity.** $O(q \log q + (n + q)\sqrt{n})$ time and $O(n + q)$ space. The answer can reach $4 \cdot 10^{16}$, so the accumulator must be 64-bit.

**Common wrong approach.** Using a 32-bit accumulator. The sample answers are small, and the overflow appears only on the large tests where every element is the same value.

### Problem 3: subarrays with a fixed xor

**Restatement.** An array of $n$ nonnegative integers and a target $k$ are given. For each query $[l, r]$, count the pairs $(i, j)$ with $l \le i \le j \le r$ whose subarray xor is $k$. Constraints: $1 \le n, q \le 100\,000$ and $0 \le a_i, k \le 10^6$.

**Naive baseline.** Enumerate every subarray of every query, at a cost of $O(n^2 q)$ in the worst case, or $O(nq)$ with a prefix-xor table and a frequency map rebuilt per query.

**Insight.** Let $P_0 = 0$ and $P_i = a_1 \oplus \cdots \oplus a_i$. The xor of $a_i, \ldots, a_j$ is $P_{i-1} \oplus P_j$, so the query $[l, r]$ asks for the number of pairs of prefix indices $(u, v)$ with $l - 1 \le u < v \le r$ and $P_u \oplus P_v = k$. This is a range query over the prefix array, and the pair count is maintainable in constant time when the window gains or loses one prefix index.

**Derivation.** Build the prefix-xor array of length $n + 1$. For a query $[l, r]$, the window is the prefix indices $[l - 1, r]$. Maintain a frequency table of the prefix values currently in the window and the number of valid pairs. When a new index $v$ enters on the right, the number of new pairs is `count[P[v] ^ k]`; add that to the answer, then increment `count[P[v]]`. When an index leaves, decrement its count first, then subtract `count[P[v] ^ k]` from the answer. A window that grows on the left is the same operation with the new index's prefix value, and a window that shrinks on the left is the same removal. Sort the queries by the block order and apply the four loops.

**Correctness.** Every pair with $u < v$ is counted when the later of its two indices enters the window, and is uncounted when that index leaves. Pairs whose xor is not $k$ contribute zero because the lookup asks for exactly $P[v] \oplus k$. After the window equals $[l - 1, r]$, the accumulator is exactly the number of qualifying pairs, which is the number of subarrays with xor $k$.

**Complexity.** $O(q \log q + (n + q)\sqrt{n})$ time and $O(n + q)$ space. The pair count can reach $n(n+1)/2 \approx 5 \cdot 10^9$, so it needs 64 bits.

**Common wrong approach.** Using the query endpoints $[l, r]$ directly instead of the prefix indices $[l - 1, r]$. The subarray $[l, l]$ is then lost, because it corresponds to the single pair $(l - 1, l)$ and the prefix index $l - 1$ lies just outside the window.

## Practice progression

1. **Recognition.** Given a statement, decide whether the array is static, whether the queries can be reordered, and whether the answer is maintainable under add and remove.
2. **Direct application.** Implement the distinct-value version, with compression, the block order, and the four loops. Verify it against a brute-force scan on random small arrays.
3. **Adaptation.** Replace the distinct count with a statistic that has a non-obvious update, such as the number of equal pairs or the sum of squared frequencies. Derive the add and remove deltas before writing them.
4. **Transformation.** Solve a problem where the query is not directly over the array, as in the prefix-xor problem. The transformation is the hard part; the Mo skeleton is unchanged.
5. **Combination.** Add a Fenwick tree or a frequency-of-frequencies table inside the window when the maintained state cannot be updated in constant time, and measure whether the extra logarithm still fits.
6. **Challenge.** Implement rollback Mo's algorithm for a state that supports insertion but not deletion, and compare its movement count with the standard version on the same input.
7. **Transfer.** Implement the modification variant with a third block coordinate, or the tree version on an Euler tour. Both reuse the same ordering argument with one more dimension.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the two halves of the key insight, and which one is the ordering argument? (Key insight)
2. Why does adding an element change the distinct count only when its frequency was zero? (Formal model)
3. What is the block key, and why does the direction of the right endpoint alternate? (Formal model)
4. State the invariant and say which operations preserve it. (Algorithm derivation)
5. Why does the block order cost $O(qB + n^2/B)$, and what block width balances the terms? (Complexity analysis)
6. Why must the answers be stored by original index? (Implementation walkthrough)
7. What happens if the array receives an update between two queries, and how does the modification variant repair it? (Why this fails)
8. Give a statistic that is easy to add but hard to remove, and explain why a bare scalar is not enough. (Why this fails)
9. When is a Fenwick sweep a better choice than Mo's algorithm for distinct values? (Algorithm selection)
10. Why is the brute-force scan still worth writing? (Contest strategy)

## Further reading

- The structure that answers distinct-value queries offline with a last-occurrence sweep is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and its article derives the update and prefix rules.
- The structure that handles a quantity without an inverse is the [segment tree](/algorithms/range-queries/segment-tree), which never has to remove an element from a maintained aggregate.
- The static structure with constant-time queries is the [sparse table](/algorithms/range-queries/sparse-table), and its article shows what is gained and lost by giving up updates.
- The technique that answers a static range sum in constant time is [prefix sums](/algorithms/arrays/prefix-sums), which is the special case that Mo's algorithm generalizes away from.
- The compression step that makes the frequency table dense is described in [coordinate compression](/algorithms/arrays/coordinate-compression).
- The ordering argument is a reuse of the comparison-sort machinery from [sorting](/algorithms/foundations/sorting), and the two-pointer movement is the same idea as [two-pointers](/algorithms/arrays/two-pointers) without the monotone predicate.
- The subject index lists the neighboring structures under [range queries](/algorithms/range-queries/).
