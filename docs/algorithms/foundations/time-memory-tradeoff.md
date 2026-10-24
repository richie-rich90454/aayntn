---
id: foundations.time-memory-tradeoff
title: The time-memory tradeoff
summary: Buy query time with memory by precomputing a table, and decide how much memory the table is worth by comparing the work it removes with the space it occupies.
division: [silver, gold]
subjects: [foundations]
level: intermediate
importance: common-contest-technique
keywords:
    [
        time-memory tradeoff,
        precomputation,
        block decomposition,
        square root decomposition,
        prefix sums,
        lookup table,
        block prefix,
        query cost,
        memory limit,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended:
        [arrays.prefix-sums, foundations.amortized-analysis, range-queries.sqrt-decomposition]
complexity:
    time: "O(n) preprocessing and O(1) per query for the full block table; O(n/B + B) per query for block totals alone"
    space: "O(n + n/B) = O(n) for the full table; O(n/B) = O(sqrt n) for block totals alone"
assumptions:
    - The array is static, and each query asks for the sum of an inclusive range of positions.
    - Integer addition is invertible, so a range sum is the difference of two prefix sums.
    - The block size is fixed before the table is built, and every block except the last holds exactly that many elements.
implementations: foundations.time-memory-tradeoff
reviewed: false
---

## At a glance

A time-memory tradeoff is a deliberate purchase: memory is spent on a table that has already computed something, so the program does not compute it again. The purchase is worth making when the table is queried more often than it is built, and it is worth refusing when the memory limit leaves no room for it or when the queries are too few to repay the build.

The running example in this article is the simplest one that shows every part of the decision. A static array of $n$ scores receives $q$ queries, each asking for the sum of an inclusive range. Scanning a range costs time proportional to its length. A prefix-sum table costs $n$ entries and answers every query with two prefix lookups. A **block-prefix table** splits the array into blocks of $B$ positions, stores the sum before each block and the prefix inside each block, and also answers every query with two prefix lookups. A smaller table that stores only the block totals answers in $O(n/B+B)$ time, which is $O(\sqrt{n})$ when $B$ is chosen as $\sqrt{n}$.

The same arithmetic governs sparse tables, meet in the middle, memoization, and the lookup tables inside a digit DP. The names change, but the question does not: how much memory does the table need, how much work does it remove per query, and how many queries are there? This article derives the block table, proves it correct, counts it exactly, and ends with the inequality that decides when the table pays for itself.

## Problem motivation

The input is a sequence of scores and a sequence of range-sum queries. The reference program reads $n$, then the $n$ scores, then $q$, then $q$ pairs $l$ and $r$, and prints the sum $a_l + a_{l+1} + \dots + a_r$ for each pair.

The constraints that make the problem interesting are the ones a contest statement puts next to the sizes. Take $n = 200\,000$ and $q = 200\,000$, with each score up to $10^9$. A single range can hold all $200\,000$ scores, so one scan performs $200\,000$ additions. Repeating that for every query performs about $4 \times 10^{10}$ additions, which is far past a two-second limit in every language.

The naive fix is to precompute the answer to every possible query. There are $\frac{n(n+1)}{2}$ ranges, about $2 \times 10^{10}$ for the same $n$, so the table of all answers is larger than the number of operations the scan would have performed. That is the other extreme of the same axis: it buys the fastest possible query with an impossible amount of memory.

The useful answer lies between the two extremes. A range can be covered by a few whole blocks and two partial blocks. If the whole blocks are summarized by one prefix over block totals and the partial blocks are summarized by a prefix inside each block, then the query needs two prefix lookups. The block size is the dial that trades the number of block summaries against the size of the partial scans. Choosing the dial well is the whole technique.

There is a second reason to care. A full prefix-sum table has $n$ entries, and memory limits are often stated in megabytes rather than in entries. When $n = 10^6$ and every entry is a 64-bit integer, the table alone is about eight megabytes. If the limit is six, the full table is not available, but the block totals are: about $\sqrt{n}$ entries, or a few kilobytes. The algorithm must change to fit the limit, and the block table is the standard way to change it without falling back to scanning.

## Recognition patterns

Reach for a precomputed table when the problem has the following shape.

- **Many queries over data that does not change.** The array is fixed, and the queries arrive afterwards. Nothing invalidates the table.
- **Each query can be assembled from a few precomputed pieces.** A range is two partial blocks plus a run of whole blocks; a rectangle is four prefix rectangles; a tree path is a logarithmic number of heavy-light segments.
- **The combining operation is associative.** Addition, minimum, maximum, gcd, matrix product, and bitwise or all qualify. Invertibility is a bonus, not a requirement, but it decides whether a prefix can be subtracted.
- **The query count is large compared with the square root of $n$.** If there are only a handful of queries, building a table costs more than answering them directly.
- **A slow inner loop repeats a computation whose arguments come from a small set.** Precomputing for every remainder modulo a small number, or for every step size below a threshold, turns the loop into a lookup.
- **A memory limit is stated as a number.** The limit is part of the problem, not a detail of the machine, and it should be read before the data structure is chosen.

The pattern also has a negative form. Do not build a table when any of these holds.

- **The queries are short and few.** Scanning a ten-element range is cheaper than building a table of $200\,000$ entries.
- **The data changes at every step.** A static table goes stale after the first update; a structure that repairs it in logarithmic time is usually better than rebuilding it.
- **The operation has no compact summary.** A median, a mode, or the list of distinct values cannot be merged from two summaries in constant time, so the block table does not apply without extra work.
- **The table would exceed the memory limit.** A correct algorithm that allocates past the limit fails just as surely as a wrong one.

## Naive approach

The first baseline scans every range. It stores nothing beyond the input, and its cost is the length of the range.

```cpp
long long answer = 0;
for (int i = l; i <= r; i++) {
    answer += a[i];
}
```

For short ranges this is excellent. For a query that spans the whole array it is the worst case, and a judge is free to provide only such queries.

The second baseline precomputes every range. Let `table[l][r]` hold the sum of $a_l$ through $a_r$. Filling the table by increasing length costs $O(n^2)$ time and $O(n^2)$ memory, and every query becomes one lookup. For $n = 200\,000$ the table has about $2 \times 10^{10}$ entries, which is hundreds of gigabytes. The idea is correct and unusable, and the reason is the quadratic memory.

The third baseline is the full prefix table. Let $S(i) = a_1 + \dots + a_i$ with $S(0) = 0$. Then the answer is $S(r) - S(l-1)$, which is two prefix lookups and one subtraction.

```cpp
std::vector<long long> prefix(n + 1, 0);
for (int i = 1; i <= n; i++) {
    prefix[i] = prefix[i - 1] + a[i];
}
long long answer = prefix[r] - prefix[l - 1];
```

This is the best of the three when the array is static, the operation is invertible, and $n$ entries fit in memory. It costs $O(n)$ time and space and answers in $O(1)$. It is also the table that the block table generalizes, and the one to compare every other option against.

The mistake in the naive approaches is not that they are wrong. It is that they are treated as the only choices. Scanning and the full prefix table are the two ends of a continuous tradeoff, and the block table is the part of the middle that contest problems actually use.

## Key insight

A range is not an arbitrary object. It is a suffix of one block, a run of whole blocks, and a prefix of another block. Once that decomposition is visible, each of the three pieces can be summarized independently.

The run of whole blocks is summarized by a prefix over the block totals. If $P_b$ is the sum of every block before block $b$, then the sum of the whole blocks between block $b_1$ and block $b_2$ is $P_{b_2} - P_{b_1}$. The suffix of the first block is the difference of two prefixes inside that block, and so is the prefix of the last block. Two prefix lookups and one subtraction answer the query, with no dependence on the length of the range.

The block size $B$ is the only free parameter. A large $B$ means few blocks, so the block prefix is short, but each partial block is long. A small $B$ means many blocks, so the block prefix is long, but each partial block is short. The cost $n/B + B$ is minimized when the two terms are equal, which happens at $B = \sqrt{n}$. That is the origin of the square root in square root decomposition.

The last part of the insight is economic rather than algorithmic. The table is built once and queried $q$ times, so the build is amortized over the queries. A table that costs $n$ extra writes and saves one operation per query needs more than $n$ queries to repay the writes if the scan was already cheap. The same table is a bargain in one problem and a waste in another with the same $n$, because the number of queries and the average query length are different. The decision belongs to arithmetic, not to taste.

## Visual intuition

Take $n = 10$ and $B = 3$. The blocks are positions $1$ to $3$, $4$ to $6$, $7$ to $9$, and the short block $10$ to $10$. The values and the two tables look like this.

```text
block          0          1          2          3
positions      1  2  3  | 4  5  6  | 7  8  9  | 10
values         3  1  4  | 1  5  9  | 2  6  5  |  3
inside         3  4  8  | 1  6 15  | 2  8 13  |  3
base           0         | 8         | 23        | 36
```

The `inside` row is the prefix inside each block, restarting at every block boundary. The `base` row is the sum of everything before the block. The absolute prefix at position $i$ is the sum of the two:

$$
S(i) = \text{base}\!\left[\beta(i)\right] + \text{inside}[i],
$$

where $\beta(i) = \lfloor (i-1)/B \rfloor$ is the block that contains $i$.

A query is now a subtraction. For $[2,8]$:

$$
S(8) = \text{base}[2] + \text{inside}[8] = 23 + 8 = 31,
$$

$$
S(1) = \text{base}[0] + \text{inside}[1] = 0 + 3 = 3,
$$

$$
S(8) - S(1) = 28.
$$

The direct scan gives $1 + 4 + 1 + 5 + 9 + 2 + 6 = 28$, so the two agree.

The smaller table gives up the `inside` row and keeps only the block totals.

```text
block          0          1          2          3
total          8         15         13          3
```

The query $[2,8]$ becomes the tail of block $0$, the whole of block $1$, and the head of block $2$:

$$
(1+4) + 15 + (2+6) = 5 + 15 + 8 = 28.
$$

This costs five reads: two elements, one block total, and two more elements. At $n = 10$ the saving over the seven-read scan is small. At $n = 200\,000$ with $B = 447$, a full-range query would read $200\,000$ elements in the scan, while the block version reads at most $448$ block totals and $2 \cdot 447 = 894$ elements, which is fewer than $1\,400$ reads. The gap is the tradeoff, and the gap grows with $n$.

The memory picture is just as concrete. The input has $n$ entries. The block totals add $n/B$ entries. The block prefix adds another $n/B$. The inside prefix adds $n$. The full table is the input plus the inside prefix plus the block prefix, which is $2n + n/B$ entries if the input is kept, or $n + n/B$ if the input is overwritten by the inside prefix. The reference programs take the second option: they read the scores directly into the inside table and prefix it in place.

## Formal model

Let $a_1, a_2, \dots, a_n$ be integers, and let $S(i) = a_1 + \dots + a_i$ for $1 \le i \le n$, with $S(0) = 0$.

Fix a block size $B$ with $1 \le B \le n$, and let $m = \lceil n/B \rceil$ be the number of blocks. For $1 \le i \le n$, the block index is

$$
\beta(i) = \left\lfloor \frac{i-1}{B} \right\rfloor.
$$

Block $b$ covers positions $\text{start}(b) = bB + 1$ through $\text{end}(b) = \min(n, (b+1)B)$.

::: math definition Definition
The **block total** of block $b$ is

$$
T_b = \sum_{i=\text{start}(b)}^{\text{end}(b)} a_i.
$$

The **block prefix** is $P_0 = 0$ and $P_b = T_0 + \dots + T_{b-1}$ for $1 \le b \le m$, so $P_b = S(bB)$ whenever $bB \le n$.

The **inside prefix** is $I_i = S(i) - P_{\beta(i)}$ for $1 \le i \le n$, the sum of the positions from the start of $i$'s block through $i$.
:::

::: math definition Definition
A **block-prefix table** for $a$ with block size $B$ is the pair of arrays $P$ and $I$. Its **block-totals table** is the array $T$.

The **cost model** counts one unit for reading or writing one array entry and one unit for each arithmetic operation on two entries. Under this model the block-prefix table uses $n + m + 1$ entries and the block-totals table uses $m$ entries beyond the input.
:::

The query $Q(l,r) = \sum_{i=l}^{r} a_i$ is the object both tables are built to answer.

::: math theorem Theorem
For every $1 \le l \le r \le n$,

$$
Q(l,r) = S(r) - S(l-1) = \left(P_{\beta(r)} + I_r\right) - \left(P_{\beta(l-1)} + I_{l-1}\right),
$$

where the second term is taken as $0$ when $l = 1$.
:::

The theorem is proved in the correctness section. The important consequence is that the right-hand side is evaluated with a fixed number of array reads, independent of $r-l$.

::: math definition Definition
The table **pays for its memory** when the total work of building and using it is smaller than the total work of the alternative that uses less memory, and its memory fits the limit. For a scan alternative of average length $L$ and $q$ queries, the full table pays when

$$
2n + 4q < qL,
$$

which is $q > \frac{2n}{L-4}$ for $L > 4$. The full table's per-query cost is constant, while the block-totals cost is $n/B + B$, so for large $q$ the full table wins in time; it loses only when the build is not repaid or the memory does not fit.
:::

The inequality answers whether any table is worth building. The memory comparison answers whether the larger table fits. A contest solution has to satisfy both the time limit and the memory limit, so both questions are asked.

## Algorithm derivation

### Choosing the block size

For a fixed table design, the query cost is a function of $B$. With block totals only, a query touches at most $m$ whole blocks and at most $2B$ elements, so its cost is bounded by

$$
f(B) = \frac{n}{B} + 2B.
$$

The derivative is $-n/B^2 + 2$, which is zero at $B = \sqrt{n/2}$. The simpler expression $n/B + B$, which charges one block for each partial block, has the same minimizer up to a factor of $\sqrt{2}$. The simpler choice $B = \lfloor\sqrt{n}\rfloor$ makes the two terms comparable and is the one used by the reference programs. The difference between $\sqrt{n}$ and $\sqrt{n/2}$ is a constant factor, and the exact optimum depends on the relative cost of reading a block total and reading an element, which the asymptotic model does not know.

For the full block-prefix table the query cost is constant for every $B$, so $B$ is chosen to minimize the memory $n/B$ of the block prefix and the build time. The whole table already stores $n$ inside entries, so $B = \sqrt{n}$ is a reasonable default: it keeps the block prefix at $O(\sqrt{n})$ entries and the number of blocks at $O(\sqrt{n})$.

When blocks are rebuilt after updates, the update cost is proportional to $B$ and the query cost to $n/B + B$. Minimizing $c_u B + c_q(n/B + B)$ gives

$$
B = \sqrt{\frac{c_q n}{c_u + c_q}},
$$

which reduces to $\sqrt{n}$ when the two costs are equal. This is the general rule behind every square root decomposition: put the square root where the two competing costs balance.

### Building the table

The build reads the input once and rewrites each block in place, so it is linear.

```cpp
int B = 1;
while ((B + 1) * (B + 1) <= n) {
    ++B;
}
int blocks = (n + B - 1) / B;

std::vector<long long> inside(n + 1, 0);
std::vector<long long> base(blocks + 1, 0);

for (int i = 1; i <= n; ++i) {
    std::cin >> inside[i];
}

long long total = 0;
for (int b = 0; b < blocks; ++b) {
    base[b] = total;
    long long run = 0;
    int start = b * B + 1;
    int end = std::min(n, start + B - 1);
    for (int i = start; i <= end; ++i) {
        run += inside[i];
        inside[i] = run;
    }
    total += run;
}
base[blocks] = total;
```

The integer square root avoids the floating-point rounding that makes `int(std::sqrt(n))` return one less than the true root at some perfect squares. The loop runs at most $\sqrt{n}$ times.

The in-place step is worth noticing. Before the inner loop, `inside[i]` holds $a_i$. After it, `inside[i]` holds the sum from the start of the block through $i$. The input array is gone, and the table has replaced it. That is why the memory is $n + m + 1$ entries rather than $2n + m + 1$.

### Answering a query

The absolute prefix is a helper that reads one base entry and one inside entry.

```cpp
auto prefix = [&](int i) -> long long {
    if (i == 0) {
        return 0;
    }
    return base[(i - 1) / B] + inside[i];
};

long long answer = prefix(r) - prefix(l - 1);
```

The expression `(i - 1) / B` is the block of a 1-based index. Writing `i / B` instead shifts every index at a block boundary into the wrong block, which is the most common off-by-one in the technique.

### The smaller table

If only the block totals are stored, the query has to add the partial blocks element by element.

```cpp
long long answer = 0;
int first = (l - 1) / B;
int last = (r - 1) / B;
if (first == last) {
    for (int i = l; i <= r; ++i) {
        answer += a[i];
    }
} else {
    for (int i = l; i <= std::min(n, (first + 1) * B); ++i) {
        answer += a[i];
    }
    for (int b = first + 1; b < last; ++b) {
        answer += total[b];
    }
    for (int i = last * B + 1; i <= r; ++i) {
        answer += a[i];
    }
}
```

This version keeps the input array and adds one block total per block. Its memory is $n + m$ entries, and its query cost is at most $m + 2B$. With $B = \sqrt{n}$ it is $O(\sqrt{n})$ per query.

### The decision

Three quantities decide the design. The build cost is $n$ writes for either table. The per-query cost is $2$ reads for the full table and at most $m + 2B$ reads for the block totals. The memory beyond the input is $m + 1$ entries for the full table (the inside table replaces the input) and $m$ entries for the block totals.

The full table wins in time for long ranges, because its query is a fixed number of reads while the block-totals query grows with the number of blocks. It loses in memory, because it stores $n$ inside entries. The block totals win when the memory limit is between the two sizes. The scan wins when the build cannot be repaid, which happens when the total length of all queries is comparable to $n$.

A useful rule of thumb for the last case: if $q$ times the average query length is less than $2n$, scan; otherwise build the full table. The factor two accounts for reading the input and writing the table.

## Step-by-step execution

Take the ten scores from the visual section and build the full block table by hand. The block size is $B = 3$ and the number of blocks is $m = 4$.

```text
a         3  1  4  1  5  9  2  6  5  3
inside    3  4  8  1  6 15  2  8 13  3
base      0  8 23 36
```

The build visits the blocks in order.

1. Block $0$ covers positions $1$ to $3$. `base[0] = 0`, the running sum is $3$, then $4$, then $8$, and `total` becomes $8$.
2. Block $1$ covers $4$ to $6$. `base[1] = 8`, the running sum is $1$, then $6$, then $15$, and `total` becomes $23$.
3. Block $2$ covers $7$ to $9$. `base[2] = 23`, the running sum is $2$, then $8$, then $13$, and `total` becomes $36$.
4. Block $3$ covers position $10$. `base[3] = 36`, the running sum is $3$, and `total` becomes $39$.
5. After the loop, `base[4] = 39`, which is the sum of the whole array.

Now answer $[2,8]$, which crosses all three full blocks.

1. `prefix(8)`: block $(8-1)/3 = 2$, so `base[2] + inside[8] = 23 + 8 = 31`.
2. `prefix(1)`: block $(1-1)/3 = 0$, so `base[0] + inside[1] = 0 + 3 = 3`.
3. The answer is $31 - 3 = 28$.

The direct sum is $1 + 4 + 1 + 5 + 9 + 2 + 6 = 28$.

Answer $[7,10]$.

1. `prefix(10)`: block $(10-1)/3 = 3$, so `base[3] + inside[10] = 36 + 3 = 39`.
2. `prefix(6)`: block $(6-1)/3 = 1$, so `base[1] + inside[6] = 8 + 15 = 23`.
3. The answer is $39 - 23 = 16$, which is $2 + 6 + 5 + 3$.

Answer $[3,3]$, a range inside one block.

1. `prefix(3)`: block $0$, so `base[0] + inside[3] = 0 + 8 = 8`.
2. `prefix(2)`: block $0$, so `base[0] + inside[2] = 0 + 4 = 4`.
3. The answer is $8 - 4 = 4$, which is $a_3$.

The same three queries with only the block totals take more steps. For $[2,8]$:

1. The block that contains $l$ is block $0$, so add $a_2 + a_3 = 1 + 4 = 5$.
2. The full blocks between block $0$ and block $2$ are block $1$, so add $T_1 = 15$.
3. The first block of $r$ is block $2$, so add $a_7 + a_8 = 2 + 6 = 8$.
4. The total is $5 + 15 + 8 = 28$.

That is five reads against seven for the scan. At this size the difference is noise. At $n = 200\,000$ the full table answers in four reads while the block totals answer in at most about $1\,342$, and the scan can take $200\,000$.

## Correctness proof

::: math theorem Theorem
After the build, for every $0 \le i \le n$,

$$
\text{prefix}(i) = S(i),
$$

where $\text{prefix}(0) = 0$ and $\text{prefix}(i) = P_{\beta(i)} + I_i$ for $i \ge 1$.
:::

::: math proof Proof
The case $i = 0$ is the definition. For $i \ge 1$, let $b = \beta(i)$ and $s = bB + 1$. The position $i$ lies in block $b$, so $s \le i \le \text{end}(b)$.

First, $P_b = S(bB)$ for every $b$ with $bB \le n$, and $P_m = S(n)$. The proof is by induction on $b$ for $b \le m-1$. For $b = 0$, both sides are zero. If $P_b = S(bB)$ and $b+1 \le m-1$, then $(b+1)B \le (m-1)B < n$, so $T_b$ is the sum of positions $bB + 1$ through $(b+1)B$, and the build sets $P_{b+1} = P_b + T_b = S((b+1)B)$. The last block is handled separately: $P_m = P_{m-1} + T_{m-1} = S(n)$, because $T_{m-1}$ stops at $n$ when the block is short.

Second, $I_i = S(i) - S(bB)$. The inner loop of the build starts with a running sum of zero at $s$ and adds $a_j$ for $j = s, s+1, \dots, i$, so after processing $i$ the value stored in `inside[i]` is $a_s + \dots + a_i = S(i) - S(s-1) = S(i) - S(bB)$.

Adding the two equalities gives

$$
P_b + I_i = S(bB) + S(i) - S(bB) = S(i).
$$

The query difference then telescopes:

$$
\text{prefix}(r) - \text{prefix}(l-1) = S(r) - S(l-1) = \sum_{i=l}^{r} a_i.
$$

When $l = 1$, the second term is $\text{prefix}(0) = 0 = S(0)$, so the same argument applies without a special case. $\square$
:::

::: math theorem Theorem
The block-totals query returns $Q(l,r)$.
:::

::: math proof Proof
Let $b_1 = \beta(l)$ and $b_2 = \beta(r)$.

If $b_1 = b_2$, the query adds $a_l$ through $a_r$ directly, which is the definition of $Q(l,r)$.

Otherwise the query adds three disjoint pieces: positions $l$ through the end of block $b_1$, then every whole block from $b_1 + 1$ to $b_2 - 1$, then positions from the start of block $b_2$ through $r$. The first piece ends at $\text{end}(b_1)$, the middle pieces cover consecutive complete blocks, and the last piece begins at $\text{start}(b_2)$. The three pieces are contiguous, disjoint, and together cover exactly $[l,r]$. Their sum is therefore $Q(l,r)$. $\square$
:::

The two theorems together justify both tables. The full table is exact because the prefix identity holds at every position, including the last position of a short final block. The block-totals table is exact because the decomposition of a range into a suffix, a run of whole blocks, and a prefix is a partition.

## Complexity analysis

| Structure         | Build         | Query      | Memory beyond the input |
| ----------------- | ------------- | ---------- | ----------------------- |
| Scan              | none          | $O(r-l+1)$ | $O(1)$                  |
| Block totals      | $O(n)$        | $O(n/B+B)$ | $O(n/B)$                |
| Block prefix only | $O(n)$        | $O(B)$     | $O(n/B)$                |
| Full block table  | $O(n)$        | $O(1)$     | $O(n)$                  |
| Sparse table      | $O(n \log n)$ | $O(1)$     | $O(n \log n)$           |
| All ranges        | $O(n^2)$      | $O(1)$     | $O(n^2)$                |

With $B = \lfloor\sqrt{n}\rfloor$, the block-totals query is $O(\sqrt{n})$, and the full table's block prefix has $O(\sqrt{n})$ entries. The build is $O(n)$ in every block variant because every position is read once and written once.

The constants are small enough to matter. Each entry of a 64-bit table occupies eight bytes. For $n = 200\,000$, the full table stores $200\,001$ inside entries and $449$ base entries, about $1.6$ megabytes. The block-totals table stores $448$ entries, about $3.5$ kilobytes, on top of the input. The difference is the entire memory argument in one line.

The time difference is just as large at the top of the range. With $q = 200\,000$ queries, the full table performs $800\,000$ array reads and about $600\,000$ additions and subtractions. The block-totals table performs at most $200\,000 \cdot (448 + 894) \approx 2.7 \times 10^{8}$ reads, which is a fraction of a second in optimized C++ and several seconds in Python. The full table is the only version that is comfortable in every language, which is why the reference programs build it.

The scan is competitive only when the queries are short or few. If the average query length is $L$, the scan performs $qL$ additions. The full table performs about $2n$ writes and $4q$ reads. The table wins when

$$
qL > 2n + 4q,
$$

which is approximately $q > 2n/L$ for $L$ much larger than four. For $n = 200\,000$ and $L = 10$, the threshold is about $67\,000$ queries. Below it, scanning is the better use of the machine.

The memory limit enters independently. A table that fits the time budget but not the memory budget is not a solution. The next section turns the two budgets into a decision procedure.

## Algorithm selection

| Situation | What to use | Why |
| --- | --- | --- |
| Static array, invertible operation, $O(n)$ memory allowed | Full block table or plain prefix sums | $O(n)$ build, $O(1)$ query |
| Static array, only $O(\sqrt{n})$ extra memory | Block totals | $O(\sqrt{n})$ query, tiny table |
| Static array, non-invertible operation, $O(1)$ query | Sparse table | $O(n \log n)$ memory, $O(1)$ query for idempotent operations |
| Static array, non-invertible operation, tight memory | Block totals of minima or maxima | $O(\sqrt{n})$ query, $O(\sqrt{n})$ memory |
| Point updates and range queries | Fenwick tree or segment tree | $O(\log n)$ per operation, no rebuild |
| Many offline queries with an add/remove operation | Mo's algorithm | $O((n+q)\sqrt{n})$ total |
| Few queries or short ranges | Scan | No build cost |
| Subset search with $n \le 40$ | Meet in the middle | $O(2^{n/2})$ time and memory |
| Rectangle queries on a grid | Two-dimensional prefix sums | $O(1)$ per query, $O(nm)$ memory |

The first row is the default. The second row is the fallback when the memory limit forbids the first. The third row is the fallback when the operation cannot be subtracted. The fourth row combines the two restrictions. The remaining rows are different tradeoffs with the same shape: spend a table to remove work from a query.

The choice between the full table and the block totals is not a choice between a good algorithm and a bad one. Both are correct, and both are linear to build. The difference is whether the extra $n$ entries are available. A problem with a 256 MB limit can afford the full table for $n = 10^6$ many times over. A problem with a 6 MB limit cannot, and the block totals are the only version that fits. The algorithm changes with the limit, and that is the point of stating the limit in the first place.

When two designs fit both budgets, prefer the one with the smaller constant. The full table's two prefix lookups are faster than the block-totals loop even when both are within the limit, because the loop reads a different cache line for every block. The asymptotic comparison says the full table is better; the constant says it is better by more than the asymptotic estimate suggests.

## Reference implementations

The six reference programs implement the same contract.

```text
Input:
  n
  a_1 a_2 ... a_n
  q
  l_1 r_1
  ...
  l_q r_q

Output:
  one line per query, holding a_l + ... + a_r
```

The block size is the integer square root of $n$, found by incrementing $B$ while $(B+1)^2 \le n$. The build reads the scores directly into the inside table and prefixes each block in place, so the input array is overwritten and the memory is $n + m + 1$ entries rather than $2n + m + 1$. A query is the difference of two absolute prefixes.

| Language | File | Integer type | Note |
| --- | --- | --- | --- |
| C | `c/program.c` | `long long` | Reads with `scanf`, writes with `printf` |
| C++17 | `cpp17/program.cpp` | `long long` | Uses `std::cin` and `std::cout` |
| Java | `java/Main.java` | `long` | Class `Main`, custom fast scanner |
| Python | `python/program.py` | arbitrary precision | Reads all tokens from standard input |
| Pascal | `pascal/program.pas` | `Int64` | Compiles under pas2js; one argument per `Read` |
| JavaScript | `javascript/program.js` | `Number` | Reads standard input through `process.stdin` |

All six are `program` variants: they read standard input, write standard output, and are marked unverified until a reviewer runs them. The C, C++, Java, and Pascal versions use 64-bit integers because the sum of $200\,000$ scores of $10^9$ is about $2 \times 10^{14}$, which overflows a 32-bit signed integer. Python integers are unbounded. JavaScript uses the double-precision `Number` type, which represents every integer up to $2^{53}$ exactly; the largest possible sum here is far below that bound.

The programs print one answer per line. The shared fixtures use the same format, so the six outputs are compared byte for byte after line-ending normalization. The build and the query are the same in every language, and the differences are the input routine and the integer type.

## Recursion decision

The build and the query are iterative, and they should stay that way. A recursive prefix computation `prefix(i) = prefix(i-1) + a[i]` has depth $n$, which reaches the default Python recursion limit at about a thousand positions and risks a stack overflow in C and C++ at a few hundred thousand. The loop has no such limit.

A segment tree is the recursive alternative to the block table. Its depth is $O(\log n)$, which is safe in every language, and it supports updates in $O(\log n)$. It answers queries in $O(\log n)$ rather than $O(1)$, and its constants are larger because each query visits several nodes. For a static array with many queries, the block table is simpler and faster. For an array with updates, the segment tree is the better structure.

A recursive divide-and-conquer table, such as the one used for range products, stores $O(n \log n)$ entries and answers in $O(1)$ with a depth of $O(\log n)$. It is safe, but it uses more memory than the block table. The recursion is justified only when the operation is not invertible and the sparse table's idempotence does not apply.

The decision rule is the same as everywhere else in the encyclopedia. Use recursion when the depth is logarithmic and the recursive form makes the proof or the code clearer. Use a loop when the depth is linear or the recursion would be tail-recursive anyway. The block table is a loop with a fixed number of levels, so the iterative form is the natural one.

## Implementation walkthrough

The build has three details that decide whether the program is correct: the block calculation, the last short block, and the in-place prefix.

```cpp
int B = 1;
while ((B + 1) * (B + 1) <= n) {
    ++B;
}
int blocks = (n + B - 1) / B;
std::vector<long long> inside(n + 1, 0);
std::vector<long long> base(blocks + 1, 0);

for (int i = 1; i <= n; ++i) {
    std::cin >> inside[i];
}

long long total = 0;
for (int b = 0; b < blocks; ++b) {
    base[b] = total;
    long long run = 0;
    int start = b * B + 1;
    int end = std::min(n, start + B - 1);
    for (int i = start; i <= end; ++i) {
        run += inside[i];
        inside[i] = run;
    }
    total += run;
}
base[blocks] = total;
```

The last block is short whenever $B$ does not divide $n$. The `std::min` is what keeps the inner loop from reading past the end of the array. The `base[blocks] = total` line is not used by the query formula, but it is useful for a full-range check and for the block-totals variant.

The query is two prefix lookups and a subtraction.

```cpp
auto prefix = [&](int i) -> long long {
    if (i == 0) {
        return 0;
    }
    return base[(i - 1) / B] + inside[i];
};

for (int k = 0; k < q; ++k) {
    int l, r;
    std::cin >> l >> r;
    std::cout << prefix(r) - prefix(l - 1) << '\n';
}
```

The helper handles the left endpoint without a branch in the caller. The expression `(i - 1) / B` is the block index; using `i / B` would push the first position of every block into the previous block, and the error would be invisible until a query started exactly on a boundary.

The edge cases are worth testing explicitly. For $n = 1$, $B = 1$, $m = 1$, `inside[1]` is the only value, and every query is $[1,1]$. For $n = 2$, $B = 1$, every element is its own block, and a query that spans both blocks subtracts two base entries that differ by $a_1$. For $n = 10$, $B = 3$, the last block has one element, and `end(3) = 10` rather than $12$. The reference fixtures include all three shapes.

The integer width is the last detail. The sum of the scores, not the scores themselves, is the value that overflows. A program that reads into `int`, sums into `int`, and prints an `int` is wrong for $n = 200\,000$ and $a_i = 10^9$, even though every individual value fits. The table entries must be 64-bit from the first addition.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `i / B` for a 1-based index | The first position of each block is assigned to the previous block | Use `(i - 1) / B` |
| Subtracting inside prefixes across blocks | The answer is wrong by the base of the later block | Add the base of each position before subtracting |
| Forgetting the last short block | The loop reads past the end or the last elements are missing | Bound the end with `min(n, start + B - 1)` |
| Dividing by a block size of zero | A crash on $n = 0$ or a bad integer square root | Clamp $B$ to at least one |
| Summing into a 32-bit integer | The total wraps above about $2 \times 10^9$ | Use 64-bit from the first addition |
| Building the table when the queries are few | The build costs more than the scans it replaces | Compare $qL$ with $2n$ |
| Claiming $O(1)$ for block totals | A query can still touch every block | Use $O(n/B+B)$ |
| Using the table after an update | Every answer after the update is stale | Rebuild the block or use a dynamic structure |
| Treating `sqrt` as exact | A perfect square can round down by one | Use an integer loop or adjust after the call |

### Why this fails: subtracting inside prefixes across blocks

The plausible shortcut is to treat the inside prefix as an absolute prefix and subtract two of them. The smallest counterexample has $n = 6$, $B = 3$, and $a = 1, 1, 1, 10, 10, 10$. The inside table is $1, 2, 3, 10, 20, 30$ and the base table is $0, 3$.

For the query $[4,6]$, the shortcut computes `inside[6] - inside[3] = 30 - 3 = 27`. The correct answer is $30$. The difference is the base of block $1$, which is $3$. The shortcut is correct only when the later block is block $0$, whose base is zero.

The correct computation is `prefix(6) - prefix(3)`, which is $(3 + 30) - (0 + 3) = 30$. The base of the block is what makes the inside value absolute, and omitting it is the entire error.

A second failure is a complexity claim that forgets the block loop. Saying "the block-totals table answers in $O(1)$" is false at $B = 1$: there are $n$ blocks, and a query that spans the array adds all $n$ block totals. The bound is $O(n/B+B)$, and it only becomes $O(\sqrt{n})$ when $B$ is chosen as the square root.

## Variants and extensions

- **$B = n$.** There is one block. The base is zero and the inside table is the ordinary prefix array. The query is two prefix lookups with $n$ entries, which is the full prefix sum.
- **$B = 1$.** Every position is its own block. The base is the prefix at the previous position and the inside value is the element itself. The query is still two prefix lookups, but the table uses twice the memory of the ordinary prefix array.
- **$B = \sqrt{n}$.** The balanced choice. The block prefix has $\sqrt{n}$ entries, each partial block has at most $\sqrt{n}$ elements, and the two costs meet.
- **Point updates.** Rebuilding one block costs $O(B)$; a query costs $O(n/B+B)$. Choosing $B = \sqrt{n}$ gives $O(\sqrt{n})$ per operation with $O(n)$ memory. A Fenwick tree answers both operations in $O(\log n)$ with the same memory, so it is the better choice for addition.
- **Range updates and range queries.** A difference array plus a prefix sum handles offline updates; a lazy segment tree handles online ones. The block version stores a lazy tag per block and pushes it into the partial blocks.
- **Non-invertible operations.** A block table of minima supports a range minimum in $O(n/B+B)$ by scanning the two partial blocks and taking the minimum of the full blocks. A sparse table answers in $O(1)$ at the cost of $O(n \log n)$ memory, and it works because minimum is idempotent.
- **Offline queries.** Mo's algorithm reorders the queries so that the endpoints move $O((n+q)\sqrt{n})$ times in total, and maintains the answer incrementally. It trades the table for a clever order and uses $O(n)$ memory.
- **Meet in the middle.** Splitting a search of size $2^n$ into two halves of size $2^{n/2}$ and storing one half's results turns an exponential search into a table lookup. The table is the time-memory tradeoff in its purest form: the memory is exponential, but so was the time it replaced.
- **Memoization.** A dynamic program that stores every state is the same tradeoff at the level of the recurrence. Rolling a two-dimensional table down to two rows is the same tradeoff refusing to pay for the full table.
- **Heavy-light on values.** Precompute the answer for values that occur more than $\sqrt{n}$ times and scan for the rest. The threshold is again the square root, and the split is again between a table and a scan.

## Contest strategy

A fixed procedure that survives time pressure.

1. Read $n$, $q$, and the memory limit before reading the details of the query. Write the target complexity and the target memory in the margin.
2. Estimate the scan cost: the sum of the query lengths, or $q$ times the average length. If it is below a few million operations, scan.
3. Estimate the full table in bytes: the number of entries times eight for 64-bit sums, plus the input if it is kept.
4. If the memory limit allows $O(n)$ and the operation is invertible, build the full table. The prefix-sum table is the first choice, and the block table is the same table with a block organization.
5. If the memory limit allows only $O(\sqrt{n})$, build the block totals and choose $B = \lfloor\sqrt{n}\rfloor$. Do not claim $O(1)$ for its queries.
6. If the operation is not invertible, choose between the sparse table and the block table by comparing $O(n \log n)$ memory with $O(\sqrt{n})$ query time.
7. Write the build and the query as separate functions. Test $n = 1$, $l = r$, the full range, and a range that starts on a block boundary.
8. Compare against a brute-force scan on random small arrays before submitting. The block-boundary bugs are invisible on hand-picked cases.
9. Use 64-bit sums and check the maximum possible total before choosing the type.
10. Do not rebuild the table per query, and do not sort the queries unless the algorithm calls for it.

## Worked problems

### Problem 1: the reference range-sum table

**Restatement.** Read $n$ scores, then $q$ queries $[l,r]$, and print the sum of each range. Constraints: $n, q \le 200\,000$, scores up to $10^9$.

**Naive baseline.** Scanning each range costs $O(n)$ per query and about $4 \times 10^{10}$ additions in the worst case.

**Insight.** A range is a suffix of one block, a run of whole blocks, and a prefix of another block. A prefix inside each block and a prefix over the blocks make each piece a subtraction.

**Derivation.** Choose $B = \lfloor\sqrt{n}\rfloor$. Build the inside table in place and the base table in one pass. Answer each query with `prefix(r) - prefix(l-1)`, where `prefix(i) = base[(i-1)/B] + inside[i]`.

**Correctness.** The prefix identity is proved by induction on the block and on the position within the block. The query difference telescopes to the range sum.

**Complexity.** $O(n)$ build, $O(1)$ per query, $O(n)$ memory. For the stated bounds, the table is about $1.6$ megabytes and the queries take about $1.4$ million operations.

**Common wrong approach.** Storing the inside prefix relative to the block start and then subtracting two inside values without their bases. The answer is wrong by the base of the later block.

### Problem 2: block totals under a memory cap

**Restatement.** The same array has $n = 10^6$ scores, $q = 10^4$ queries, and a memory limit of $6$ MiB. Scores fit in 32 bits, but the sums do not. The full table of 64-bit inside prefixes is about $7.6$ MiB, so it does not fit.

**Naive baseline.** Scanning costs $O(n)$ per query and about $10^{10}$ additions, which is too slow.

**Insight.** The block totals need only $\lceil n/B \rceil$ entries. With $B = 1\,000$, that is $1\,000$ entries, about $8$ kilobytes, and the input is $4$ megabytes. The total is under $5$ MiB.

**Derivation.** Store the input as 32-bit scores and the block totals as 64-bit sums. Build the totals in one pass. For a query, scan the two partial blocks and add the full block totals between them.

**Correctness.** The three pieces of the query are disjoint and cover the range, so their sum is the range sum.

**Complexity.** $O(n)$ build, $O(n/B+B)$ per query, $O(n/B)$ memory beyond the input. With $B = 1\,000$, each query reads at most about $3\,000$ entries, and $10^4$ queries read about $3 \times 10^7$, which fits the time limit.

**Common wrong approach.** Choosing $B = 1$ to make the partial blocks trivial. Then there are $n$ blocks and a full-range query adds $10^6$ block totals, which is the scan again with extra memory.

**What to notice.** If $q$ were $10^5$ instead of $10^4$, the same design would read $3 \times 10^8$ entries and would probably fail. The block totals fit the memory but not the time. The tradeoff does not guarantee a solution; it only gives the best option under one of the two budgets. At that point the right move is to change the representation, not to tune $B$.

### Problem 3: range minimum, where subtraction fails

**Restatement.** A static array of $n = 200\,000$ values receives $q = 200\,000$ queries asking for the minimum of $[l,r]$. Values fit in 32 bits, and the memory limit is $64$ MiB.

**Naive baseline.** Scanning each range costs $O(n)$ per query and about $4 \times 10^{10}$ comparisons.

**Insight.** Minimum is associative but not invertible. A prefix of minima cannot be subtracted, because knowing the minimum of $[1,r]$ and the minimum of $[1,l-1]$ says nothing about the minimum of $[l,r]$. A table of whole-block minima can still be combined with two scans of the partial blocks.

**Derivation.** Store the minimum of each block. For a query, take the minimum of the two partial blocks by scanning them, and the minimum of the full blocks by scanning the block minima. The cost is $O(n/B+B)$, and $B = \sqrt{n}$ makes it $O(\sqrt{n})$.

**Correctness.** The minimum of a union is the minimum of the minima of a partition, so the three pieces combine correctly.

**Complexity.** $O(n)$ build, $O(\sqrt{n})$ per query, $O(\sqrt{n})$ memory. For the stated bounds, a query scans at most about $1\,300$ entries and $q$ queries scan about $2.7 \times 10^{8}$, which is borderline.

**The alternative.** A sparse table stores the minimum of every interval whose length is a power of two. It uses $n \log n$ entries, about $3.6$ million, or $14.4$ megabytes for 32-bit values, which fits the $64$ MiB limit. A query takes two overlapping intervals and one comparison, which is $O(1)$. The overlap is harmless because minimum is idempotent.

**Common wrong approach.** Building a prefix of minima and subtracting. The minimum of $[1,r]$ and the minimum of $[1,l-1]$ do not determine the minimum of $[l,r]$, because the smaller prefix value may lie outside the range.

**The decision.** With $64$ MiB, the sparse table fits and is faster. With $4$ MiB, the sparse table does not fit, and the block table is the only option. The same problem has two different answers depending on a number in the statement.

## Practice progression

1. **Recognition.** Given $n$, $q$, the average query length, and a memory limit, say whether to scan, build the block totals, or build the full table. This is the skill the article exists for.
2. **Direct application.** Build the block table by hand for a ten-element array and answer five queries with it.
3. **Adaptation.** Replace addition with minimum and rebuild the table, then explain why the prefix subtraction no longer works.
4. **Combination.** Add point updates and rebuild one block per update. Compare the resulting $O(\sqrt{n})$ per operation with a Fenwick tree's $O(\log n)$.
5. **Challenge.** Derive the block size that minimizes $c_u B + c_q(n/B+B)$ when the update cost and the query cost are not equal.
6. **Transfer.** Apply the same reasoning to a meet-in-the-middle search, a memoized recurrence, or a two-dimensional prefix table, and state what the table stores and what it replaces.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the block-prefix table store, and how many entries does each part have? (Formal model)
2. Why is a range query two prefix lookups and one subtraction, independent of the range length? (Key insight)
3. Derive the block size that minimizes $n/B+B$, and say why the exact constant does not matter. (Algorithm derivation)
4. What is the query cost and the memory of the block-totals alternative? (Complexity analysis)
5. When is the full table not worth building, even though it fits in memory? (Formal model, Algorithm selection)
6. Why can the block prefix be subtracted for addition but not for minimum? (Worked problem 3)
7. What happens at $l = 1$, at $l = r$, and in the last short block? (Implementation walkthrough)
8. How many bytes does the full table need for $n = 200\,000$ with 64-bit entries? (Complexity analysis)
9. How does the design change when point updates are allowed? (Variants and extensions)
10. What is the difference between the block table and a sparse table, and when does each win? (Algorithm selection)

## Further reading

- The growth-rate notation and the constraint filter that this article assumes are in [complexity analysis](/algorithms/foundations/complexity).
- The prefix table that the block table generalizes, including the non-invertible operations, is in [prefix sums](/algorithms/arrays/prefix-sums).
- The square root decomposition that this article derives is developed further in [square root decomposition](/algorithms/range-queries/sqrt-decomposition).
- The data structure that replaces the table when the array changes is in [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The $O(n \log n)$ table for non-invertible operations is in [sparse table](/algorithms/range-queries/sparse-table).
- The exponential end of the tradeoff, where memory is spent on half of a search space, is in [meet in the middle](/algorithms/enumeration/meet-in-the-middle).
- The amortized reasoning that lets a build cost be spread over the queries is in [amortized analysis](/algorithms/foundations/amortized-analysis).
- The course treatment of algorithm analysis and the constraint filter is in [algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis).
