---
id: advanced.parallel-binary-search
title: Parallel binary search
summary: Answer many monotone searches over one shared data structure at the same time, by running their rounds together and scheduling the checks offline.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        parallel binary search,
        offline,
        divide and conquer,
        monotone predicate,
        fenwick tree,
        overall binary search,
    ]
prerequisites:
    required: [searching.binary-search]
    recommended: [range-queries.fenwick-tree, foundations.complexity, graphs.dsu]
complexity:
    time: "O((N + Q) log^2 N)"
    space: "O(N + Q)"
assumptions:
    - Every query is independent of the answers of the other queries, so that all of them may be reordered and answered together.
    - The predicate of each query is monotone in the position being searched, so that a binary search over the positions is valid.
reviewed: false
---

## At a glance

Parallel binary search runs many binary searches at once. Instead of finishing one search and starting the next, every search performs its first step, then every search performs its second step, and so on. At each round the checks are answered together, in a single sweep over the data structure.

The saving comes from the data structure, not from the searches. A search that needs the structure in a particular state would otherwise have to build that state on its own, and building it is the expensive part. When the searches share their rounds, the structure is built once per round and the checks read it in order.

For $N$ updates, $Q$ queries, and an answer range of size $N$, the cost is $O((N + Q)\log^2 N)$, against $O(QN\log N)$ for the independent searches.

## Problem motivation

A warehouse has $N$ shelves. Over the course of a day, $N$ deliveries arrive, each adding one unit to a shelf. A customer asks, at several moments during the day, "which shelf holds the $k$-th unit of stock that had arrived by then?"

Concretely, delivery $j$ puts one unit on shelf $p_j$, and a query asks for the smallest shelf $k$ such that the number of units on shelves $1$ through $k$, counting only the deliveries up to a given time $y$, is at least $x$.

Each query on its own is a binary search: the count on the first $k$ shelves is non-decreasing in $k$, so the search finds the boundary in $O(\log N)$ steps. The difficulty is the count itself. To evaluate it, a Fenwick tree must hold the deliveries up to the query's time $y$.

Now the problem: each binary search visits its midpoints in the order $2, 1, 3, 4$ or some such, while the Fenwick tree must hold the state at time $y$, which is a fixed point in time. There is no order in which the searches can be interleaved that lets the tree move forward monotonically, because each individual search needs the tree at its own time $y$ at every one of its steps. Rebuilding the tree for every query costs $O(QN \log N)$.

Parallel binary search removes the rebuild. It runs the searches in rounds, and inside a round it sorts the checks by time, so the tree moves forward once and never backward.

## Recognition patterns

Parallel binary search is the right tool when the statement contains some of these phrases.

- "For every query", "for each of the $Q$ queries", "answer all the questions".
- "The smallest $k$ such that", "the first position where", repeated with different parameters.
- "After the first $y$ operations", "considering the updates up to time $y$", a mixture of updates and questions.
- "The operations are given in advance", "the queries can be reordered", "process everything offline".

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| One query | Ordinary binary search; the machinery is pure overhead |
| $Q \le 10$ | The independent searches are fine |
| $Q \ge 10^5$ and the checks are expensive | The offline sweep is the whole point |
| The predicate is an $O(1)$ lookup in a precomputed array | Nothing is gained; the independent searches already cost $O(Q \log N)$ |
| The queries must be answered before the next is read | The offline transformation does not apply |

The fourth row is the honest limit of the technique, and it is worth checking first. If the check at position $k$ can be evaluated by reading one entry of an array, then $Q$ independent binary searches cost $O(Q\log N)$ and no offline machinery can beat that by more than a constant factor. The technique earns its keep when the check is genuinely expensive, which in practice means the check reads a mutable structure whose state depends on the query.

## Naive approach

The baseline answers the queries one at a time.

```cpp
for (const Query& q : queries) {
    fenwick.reset();
    for (int j = 0; j < q.y; ++j) fenwick.add(update[j]);   // rebuild the state
    int lo = 1, hi = n;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (fenwick.sum(mid) >= q.x) hi = mid;
        else lo = mid + 1;
    }
    answer[q.id] = lo;
}
```

This is correct, and it is the reference implementation for the differential test. Its cost is $O(QN \log N)$, and the dominating term is the rebuild: the tree is put into the state at time $y$ once per query.

The second baseline is the independent searches with a shared sweep, which is better but still not enough. Sorting the queries by $y$ lets the tree move forward once for the whole set, and then each query does its own $O(\log N)$ checks. That is $O(N\log N + Q\log^2 N)$, which is already close to the parallel version.

That baseline is the right answer whenever the check is cheap. It is the wrong answer when the checks are expensive, and it is the baseline to beat.

## Key insight

The insight is that **the binary searches all proceed in the same rounds, and inside a round the checks can be ordered by the state they need.**

Write the predicate of query $i$ as $P_i(k)$, which is true exactly when the answer of query $i$ is at most $k$. A binary search over the positions maintains a range $[lo, hi]$ for each query and halves it at each round, so after $\ell$ rounds every query is at the same depth of the recursion tree over the answer range.

At round $\ell$, each query needs one evaluation of its predicate, at the midpoint of its own range. If those evaluations are sorted by the state they need, then the data structure can be advanced from one state to the next in order, and each evaluation reads the structure in the state it wants. The structure is touched once per round instead of once per query.

The second insight is that the predicate must be monotone. The binary search's halving step is only valid when the predicate is false for every position below the answer and true for every position at or above it, which is what makes the range shrink to the answer.

The third insight is that the queries are independent. Nothing in the answer of one query appears in the check of another, so the queries may be reordered freely, and reordering is exactly what the offline sweep needs.

## Formal model

Let there be $N$ positions. Update $j$ adds a non-negative weight $w_j$ to position $p_j$, and the updates are applied in time order $1, 2, \ldots, N$. Query $i$ gives a threshold $x_i$ and a time $y_i$ with $0 \le y_i \le N$.

::: math definition Definition
The **prefix count** is
$$
f(k, y) = \sum_{p=1}^{k} \sum_{\substack{j \le y \\ p_j = p}} w_j,
$$
the total weight in positions $1$ through $k$ after the first $y$ updates.
The **answer** of query $i$ is the smallest $k$ with $f(k, y_i) \ge x_i$,
or $N+1$ when no such $k$ exists.
:::


::: math definition Definition
A predicate $P$ on the positions is **monotone** if there is an index $k$
such that $P(j)$ is false for every $j < k$ and true for every $j \ge k$.
The predicate of query $i$ is $P_i(j) = [f(j, y_i) \ge x_i]$.
:::


::: math lemma Lemma
The predicate $P_i$ is monotone in $j$.
:::


::: math proof Proof
Because every weight $w_j$ is non-negative, the prefix count
$f(j, y_i)$ is non-decreasing in $j$: adding position $j+1$ adds a
non-negative amount. Therefore the set $\{j : f(j, y_i) \ge x_i\}$ is a
suffix of $\{1, \ldots, N\}$, which is exactly the definition of a
monotone predicate. $\square$
:::


::: math lemma Lemma
Let the answer of query $i$ be $k^\ast$, let $[lo, hi]$ be a range that
contains $k^\ast$, and let $mid = \lfloor (lo + hi)/2 \rfloor$. Then:

- if $P_i(mid)$ is true then $k^\ast \le mid$;
- if $P_i(mid)$ is false then $k^\ast > mid$.
:::


::: math proof Proof
If $P_i(mid)$ is true, that is $f(mid, y_i) \ge x_i$, and the answer is
the smallest position satisfying that inequality, so $k^\ast \le mid$.

If $P_i(mid)$ is false, then $f(mid, y_i) < x_i$. Suppose $k^\ast \le mid$. Since $k^\ast$ is the smallest position with $f(k^\ast, y_i) \ge x_i$ and $f$ is non-decreasing, every position from $k^\ast$ to $mid$ also satisfies the inequality, in particular $f(mid, y_i) \ge x_i$, which is a contradiction. Therefore $k^\ast > mid$. $\square$
:::


## Algorithm derivation

The algorithm is a breadth-first traversal of the recursion tree over the answer range. Each query carries its own range, and every round does the same three things.

1. **Compute the midpoints.** Each query gets the midpoint of its range.
2. **Sweep.** The queries are visited in increasing order of $y$, and the updates are applied in time order. When the sweep reaches a query, the structure holds exactly the first $y_i$ updates, so the check $f(mid_i, y_i)$ can be read directly.
3. **Partition.** Each query's range is narrowed according to its check, and the queries are regrouped into the nodes of the next level.

```cpp
// Each query carries lo, hi and the current midpoint.
std::vector<Query> queries = all_queries;
std::sort(queries.begin(), queries.end(), by_y);   // once, the order is preserved

int answer_range_hi = n;
while (!queries.empty()) {
    for (Query& q : queries) {
        q.mid = (q.lo + q.hi) / 2;
        if (q.lo == q.hi) continue;      // already answered
    }
    fenwick.clear();
    int applied = 0;
    for (Query& q : queries) {           // the list is in increasing y
        if (q.lo == q.hi) continue;
        while (applied < q.y) {
            fenwick.add(update[applied].pos, update[applied].weight);
            ++applied;
        }
        q.goes_left = (fenwick.sum(q.mid) >= q.x);
    }
    for (Query& q : queries) {
        if (q.lo == q.hi) continue;
        if (q.goes_left) q.hi = q.mid;
        else q.lo = q.mid + 1;
    }
    queries.erase(std::remove_if(queries.begin(), queries.end(),
                                 [](const Query& q) { return q.lo == q.hi; }),
                  queries.end());
}
```

The sort by $y$ is done once. The partition in step 3 narrows the ranges in place and never reorders the list, so the list stays sorted by $y$ forever, and every round reads the queries in the order the sweep needs.

The sweep pointer only moves forward within a round, because $y$ is non-decreasing along the list. Between rounds the structure is cleared and the sweep starts again, because the queries at the next level need a different state.

## Step-by-step execution

Four positions and four deliveries. Delivery $j$ puts weight $w_j$ on position $p_j$:

| Delivery $j$ | Position $p_j$ | Weight $w_j$ |
| ------------ | -------------- | ------------ |
| 1            | 1              | 1            |
| 2            | 3              | 2            |
| 3            | 2              | 4            |
| 4            | 4              | 8            |

And four queries, listed with their $x$ and $y$.

| Query | $x$ | $y$ | The values after $y$ deliveries | $f(\cdot, y)$ | Answer |
| ----- | --- | --- | ------------------------------- | ------------- | ------ |
| A     | 1   | 1   | $[1,0,0,0]$                     | $[1,1,1,1]$   | 1      |
| B     | 3   | 2   | $[1,0,2,0]$                     | $[1,1,3,3]$   | 3      |
| C     | 6   | 3   | $[1,4,2,0]$                     | $[1,5,7,7]$   | 3      |
| D     | 8   | 4   | $[1,4,2,8]$                     | $[1,5,7,15]$  | 4      |

**Round 1.** Every query has the range $[1,4]$ and the midpoint $2$. The queries are visited in the order A, B, C, D, which is increasing in $y$, and the deliveries are applied as the sweep advances.

| Query | State of the tree             | $f(2, y)$ | $f(2, y) \ge x$ | New range |
| ----- | ----------------------------- | --------- | --------------- | --------- |
| A     | after delivery 1: $[1,0,0,0]$ | 1         | yes             | $[1,2]$   |
| B     | after delivery 2: $[1,0,2,0]$ | 1         | no              | $[3,4]$   |
| C     | after delivery 3: $[1,4,2,0]$ | 5         | no              | $[3,4]$   |
| D     | after delivery 4: $[1,4,2,8]$ | 5         | no              | $[3,4]$   |

The tree was written four times and read four times. The independent searches would have rebuilt the tree for every query at every step.

**Round 2.** A is in the node $[1,2]$ with midpoint $1$; B, C and D are in the node $[3,4]$ with midpoint $3$. The tree is cleared and the sweep starts again, still in increasing $y$.

| Query | Midpoint | State of the tree             | $f(mid, y)$ | $\ge x$ | New range |
| ----- | -------- | ----------------------------- | ----------- | ------- | --------- |
| A     | 1        | after delivery 1              | 1           | yes     | $[1,1]$   |
| B     | 3        | after delivery 2: $[1,0,2,0]$ | 3           | yes     | $[3,3]$   |
| C     | 3        | after delivery 3: $[1,4,2,0]$ | 7           | yes     | $[3,3]$   |
| D     | 3        | after delivery 4: $[1,4,2,8]$ | 7           | no      | $[4,4]$   |

**Round 3.** Only A remains, with the range $[1,1]$, so its answer is $1$. B and C have the range $[3,3]$ and D has $[4,4]$.

The answers are $1$, $3$, $3$ and $4$, which agree with the table above.

Note the second row of round 2. B and C share the same midpoint $3$ and the same node, and the checks are read against the tree in the state each of them needs. Two different states of the same structure, read in order, cost two Fenwick queries and no rebuilds.

## Correctness proof

::: math theorem Theorem
The parallel binary search returns the correct answer for every query.
:::


::: math proof Proof
Maintain the invariant that the range $[lo_i, hi_i]$ of query $i$ contains
its answer $k^\ast_i$.

The invariant holds at the start, because the range of every query begins as $[1, N]$ and $k^\ast_i \in [1, N+1]$, with $N+1$ handled by an explicit check.

In a round, the midpoint $mid_i$ of query $i$'s range is computed, and the predicate is evaluated at $mid_i$. By the lemma, $P_i(mid_i)$ being true means $k^\ast_i \le mid_i$, and being false means $k^\ast_i > mid_i$. The query's range is narrowed accordingly to $[lo_i, mid_i]$ or $[mid_i + 1, hi_i]$, so the invariant is preserved.

Every range shrinks by at least a factor of two each round, so after at most $\lceil \log_2 N \rceil$ rounds every non-empty range is a single point, and the lemma forces that point to be $k^\ast_i$. The query whose predicate is false at every position is reported as having no answer. $\square$
:::


## Complexity analysis

| Method | Time | Space |
| --- | --- | --- |
| One independent search per query, tree rebuilt each time | $O(QN\log N)$ | $O(N + Q)$ |
| One independent search per query, tree swept once over all queries | $O(N\log N + Q\log^2 N)$ | $O(N + Q)$ |
| Parallel binary search | $O((N + Q)\log^2 N)$ | $O(N + Q)$ |

The parallel bound is a sum over $\lceil \log_2 N \rceil$ rounds. In one round, the sweep applies each of the $N$ deliveries once, at a cost of $O(N \log N)$, and each of the $Q$ queries performs one check at a cost of $O(\log N)$, so a round costs $O((N + Q)\log N)$. The rounds multiply the bound by $O(\log N)$.

The space is $O(N + Q)$: the Fenwick tree, the updates, and the queries with their ranges. The recursion tree is never materialized, because the rounds are processed one at a time.

The comparison with the first row is the whole point. At $N = Q = 10^5$, the independent searches cost about $10^{11}$ Fenwick operations and the parallel version costs about $6 \times 10^7$, a factor of about two thousand.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One query | Ordinary [binary search](/algorithms/searching/binary-search) |
| Many queries, cheap checks | Independent searches, $O(Q\log N)$ |
| Many queries, expensive checks, one shared structure | Parallel binary search |
| Many queries, checks read a mutable structure | Parallel binary search |
| The answer is a time rather than a position | The overall binary search, the mirror image |
| The checks need connectivity | A rollback [disjoint set union](/algorithms/graphs/dsu) |
| The checks need prefix sums | A [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| The queries are online and each answer affects the next | Nothing offline applies |

The third row is the condition to check first. If the check at position $k$ reads an entry of a precomputed array, the independent searches already cost $O(Q\log N)$ and the parallel version cannot beat it.

## Recursion decision

The recursion tree over the answer range has depth $\lceil \log_2 N \rceil$, which is at most about 20 for any $N$ that fits in memory. That is harmless in every language.

The reason to write the algorithm as rounds rather than as a recursion is not the stack. It is the sweep. A recursive implementation that sweeps the deliveries inside each node of the tree pays for the sweep once per node, and the nodes at one level have overlapping time ranges, so the sweep work at a level is the number of nodes times $N$. Only the level-by-level formulation sweeps the deliveries once per level.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative rounds, for the sweep rather than the stack |
| Java | About $10^4$ frames | Iterative rounds |
| Python | The interpreter limit of 1000 | Iterative rounds; the per-round Python overhead is the real cost |
| Pascal | The operating system stack | Iterative rounds |
| JavaScript | About $10^4$ frames | Iterative rounds |

The rule is general: **an offline algorithm should be organized so that the shared work happens once per round, not once per subproblem.** That is what separates the parallel binary search from the overall binary search, which does use a recursion and pays for it with a rollback structure.

## Implementation walkthrough

Three lines decide whether the technique actually pays off.

```cpp
std::sort(queries.begin(), queries.end(), by_y);   // once, before the rounds
while (applied < q.y) { fenwick.add(...); ++applied; }   // the pointer never moves back
q.goes_left = (fenwick.sum(q.mid) >= q.x);
```

The sort happens once, and the partition never reorders the list. If the partition sorted or rebuilt the query list, the list would no longer be in increasing $y$ order and the sweep would have to reset its pointer backwards, which is the whole cost the technique removes.

The sweep pointer must never move backwards within a round. The queries are visited in increasing $y$, so the pointer only ever advances, and each delivery is applied exactly once per round.

The check reads `fenwick.sum(q.mid)` and not the value at a single position. The predicate is about the prefix, and the prefix sum is what the Fenwick tree returns directly.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sending the true queries to the right group | Every answer is at least one too large | True means the answer is at most the midpoint |
| Reordering the query list between rounds | The sweep pointer has to move backwards | Keep the list sorted by $y$ for the whole run |
| Sweeping inside each node of the recursion | The sweep work is multiplied by the number of nodes | Sweep once per level |
| Assuming the predicate is monotone | The answer is wrong, and every query at that node is wrong | Check that the weights are non-negative |
| Forgetting the queries with no answer | A query with $x$ larger than the total reports a position | Test the predicate at the last position first |
| Clearing the tree between rounds | The answers are computed against a wrong state | Clear at the start of each round, not during |
| Using an $O(1)$ check anyway | The whole machinery is overhead | Use the independent searches |

### Why this fails: the query that goes to the wrong half

The plausible wrong approach is to reason about the split the way one reasons about a search for the _last_ position satisfying a condition: "the condition holds at the midpoint, so the answer is at or after it". The answer here is the _first_ position satisfying the condition, so a true predicate means the answer is at or _before_ the midpoint, and the true queries belong in the left group.

The smallest counterexample is two positions, one delivery that puts weight $1$ on position $1$, and one query with $x = 1$ and $y = 1$. The answer is the smallest $k$ with $f(k, 1) \ge 1$, and $f(1, 1) = 1$, so the answer is $1$.

The parallel search starts with the range $[1, 2]$ and the midpoint $1$. The check is $f(1, 1) = 1 \ge 1$, which is true, so the query belongs in the left group $[1, 1]$ and the answer is $1$. The program that sends the true queries to the right group reports $2$.

One position is not enough to expose the bug, because the range $[1,1]$ is already a single point and the recursion never asks a question. Two positions with one unit of stock is the smallest instance in which the split can be made at all.

The bug is silent and it is systematic. Every query is sent to the wrong half, so every answer is at least one position too large, and a program that only checks "is the answer in range" finds nothing wrong.

A second failure in the same area is the assumption of monotonicity. The weights must be non-negative, and the statement does not always say so. The smallest counterexample is three positions with the deliveries $(1, +10)$, $(2, -20)$ and $(3, +15)$, and the query $x = 5$, $y = 3$. The prefix counts are $f(1, 3) = 10$, $f(2, 3) = -10$ and $f(3, 3) = 5$, so the smallest position with a count of at least $5$ is $1$. The parallel search asks at the midpoint $2$, where the count is $-10$, which is less than $5$, so the query is sent to the right group and the program reports $3$. The predicate is not monotone, because the prefix count decreased between positions $1$ and $2$.

This second failure is much worse in the parallel setting than in the ordinary one. An independent binary search that splits wrongly corrupts one query. A parallel search that splits wrongly corrupts **every query that shares the node**, because all the queries at a node are asked at the same midpoint and are all sent to the same half. One wrong split, one batch of wrong answers.

The lesson generalizes: **the split is only as safe as the monotonicity of the predicate, and batching the queries multiplies the cost of a wrong split by the size of the batch.**

## Variants and extensions

- **The overall binary search.** The mirror image, where the answer is a time rather than a position. The recursion runs over the time axis, the check reads a prefix count over the positions, and the sweep is over the positions. It answers "the earliest moment at which something accumulated".
- **A rollback disjoint set union.** When the check is about connectivity, the structure cannot be swept, so it is undone and redone. The rollback is the price of the offline transformation.
- **Parallel binary search with a segment tree.** The same shape, with the check reading a segment tree instead of a Fenwick tree.
- **Parallel binary search with a wavelet tree or a merge sort tree.** When the check is a range count rather than a prefix count, the structure answers it in $O(\log N)$ and the same rounds apply.
- **Divide and conquer on the answer.** The same recursion, applied to a problem where the check is a function of the whole range rather than of a single prefix.
- **Offline connectivity.** A different family that uses the same principle: segment the timeline and answer the connectivity queries with a rollback structure.

## Contest strategy

1. Check that the offline transformation applies at all. If a query's answer is needed before the next query is read, nothing offline works.
2. Write the independent version first, even if it is too slow. It is the reference implementation, and a disagreement between it and the parallel version is the fastest way to find a wrong split.
3. Sort the queries by the state they need, once, before the rounds begin. Everything after that preserves the order.
4. Decide which half a true predicate goes to, and write it down. The direction depends on whether the answer is the first or the last position that satisfies the condition.
5. Check the monotonicity of the predicate explicitly. In most problems this means checking that the values are non-negative, and a negative value in the input is the bug.
6. Count the rounds. If the answer range has size $N$, there are $\lceil \log_2 N \rceil$ rounds, and every query participates in all of them. The work per round is the number of updates plus the number of queries.

## Worked problems

### Problem 1: the position of the k-th unit

**Restatement.** There are $N$ positions and $N$ deliveries; delivery $j$ adds weight $w_j \ge 0$ to position $p_j$. Each query gives $x$ and $y$, and asks for the smallest position $k$ such that the total weight in positions $1$ through $k$, counting only the first $y$ deliveries, is at least $x$.

**Naive baseline.** One binary search per query, with the tree rebuilt for every query, which is $O(QN\log N)$.

**Insight.** The searches share their rounds, and inside a round the checks can be ordered by the time they need.

**Derivation.** Sort the queries by $y$, then run the rounds. In each round compute the midpoints, sweep the deliveries forward while checking the queries in the order of their $y$, and narrow the ranges.

**Correctness.** The lemma about the split preserves the invariant that each range contains its answer, and the ranges shrink to a point, which forces the answer.

**Complexity.** $O((N + Q)\log^2 N)$ time and $O(N + Q)$ space.

**Common wrong approach.** Sending the true queries to the right group, which reports every answer too large.

### Problem 2: the position of the k-th distinct value

**Restatement.** The deliveries put values on positions, and each query gives $x$ and $y$ and asks for the smallest position $k$ such that the first $k$ positions contain at least $x$ distinct values, counting only the first $y$ deliveries.

**Naive baseline.** One binary search per query, where the check is a distinct-count query. The check needs a Fenwick tree over the values that tracks the last occurrence of each value, so it costs $O(\log N)$, and the independent searches cost $O(Q\log^2 N)$ with the tree swept once, or $O(QN\log N)$ with the tree rebuilt per query.

**Insight.** The same rounds apply. The check at the midpoint needs the tree in the state at time $y$, and the sweep supplies it.

**Derivation.** Maintain a Fenwick tree over the compressed values, where the tree holds one unit at the last occurrence of each value seen so far. The distinct count in a prefix is the sum over that prefix. Insert the deliveries in time order, removing the previous last occurrence of a value when it is delivered again.

**Correctness.** The tree holds exactly one unit per distinct value, at its latest occurrence, so the prefix sum counts the distinct values in the prefix exactly. The rest of the argument is the argument of the theorem.

**Complexity.** $O((N + Q)\log^2 N)$ time, where the compression of the values costs $O(N \log N)$ first.

**Common wrong approach.** Forgetting to remove the previous occurrence of a value, which makes the tree count occurrences rather than distinct values.

### Problem 3: the earliest moment of a threshold

**Restatement.** The deliveries add weight to positions, and each query gives a position $p$ and a threshold $x$, and asks for the earliest time $t$ at which the total weight at position $p$ is at least $x$.

**Naive baseline.** One binary search per query over the time axis, where the check reads the weight at a single position after a given number of deliveries. That check needs a structure indexed by time, rebuilt per query, so the cost is again $O(QN\log N)$.

**Insight.** The mirror image of the first problem. The recursion is over the time axis and the check is over the positions, so the sweep is over the positions and the structure is indexed by time.

**Derivation.** Build a Fenwick tree indexed by time. The sweep visits the queries in increasing order of $p$ and applies each delivery as a unit update at its time index. The check at the midpoint of the time range is the prefix sum over the time indices up to the midpoint, which is the weight at position $p$ by that time.

**Correctness.** The prefix sum over time of the units at position $p$ is exactly the weight accumulated at $p$ by that time, and that weight is non-decreasing in the time, so the predicate is monotone. The rest is the argument of the theorem.

**Complexity.** $O((N + Q)\log^2 N)$ time and $O(N + Q)$ space.

**Common wrong approach.** Building the tree over positions and sweeping over time, which answers the query for the total weight in a prefix rather than the weight at one position, and therefore reports a time rather than the correct answer to a different question.

## Practice progression

1. **Recognition.** Given a statement, decide whether the queries can be reordered, whether the check is monotone, and whether the check is expensive enough to be worth batching.
2. **Direct application.** Implement the independent searches, with the tree swept once over the queries sorted by $y$, and record the time.
3. **Adaptation.** Implement the parallel version and check that it agrees with the independent version on every query of a random instance.
4. **Combination.** Add a rollback disjoint set union in place of the Fenwick tree, so that the check becomes a connectivity question, and compare the two structures.
5. **Challenge.** Implement the overall binary search, where the answer is a time rather than a position, and check that the two implementations agree on the same instances with the roles of time and position exchanged.
6. **Transfer.** Recognize the offline pattern in another subject: the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) for a dynamic program, an offline connectivity problem, or a counting problem whose count must be reduced with [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. What makes the parallel version faster than the independent searches? (Key insight)
2. State the two conditions on the predicate that the split relies on. (Formal model)
3. Prove that a true predicate at the midpoint means the answer is at most the midpoint. (Formal model)
4. Why must the weights be non-negative? (Formal model)
5. Trace round 1 of the four-position example. (Step-by-step execution)
6. Which queries go into the left group, and why? (Algorithm derivation)
7. Why is the sort by $y$ done once and never repeated? (Implementation walkthrough)
8. What is the cost of one round, and how many rounds are there? (Complexity analysis)
9. What is the smallest instance on which sending the true queries to the wrong half changes the answer, and what does the buggy program report? (Common mistakes)
10. Why is a wrong split worse in the parallel version than in the independent one? (Common mistakes)

## Further reading

- The subject index lists this technique, [parallel binary search](/algorithms/advanced/parallel-binary-search), beside the offline techniques it does not yet cover: [the advanced algorithms](/algorithms/advanced/).
- The binary search that every one of these searches is a run of is in [binary search](/algorithms/searching/binary-search).
- The Fenwick tree that the checks read is in [the Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The disjoint set union that the rollback variant replaces the Fenwick tree with is in [the disjoint set union](/algorithms/graphs/dsu).
- The counting formula that a counting problem reduces with, and the arithmetic that reduces it, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients) and [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The geometry sweep, which is the same offline principle applied to a different structure, is in [convex hull](/algorithms/geometry/convex-hull).
- The string search whose prefix function is the same reuse of matched work that the offline sweep performs is in [KMP](/algorithms/strings/kmp).
- The search over a tree of choices, which is what the overall binary search becomes when the structure cannot be swept, is in [backtracking](/algorithms/enumeration/backtracking).
- The dynamic program whose count is usually reduced modulo a prime is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The monotone subsequence problem, which is the other standard example of a monotone predicate, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The discrete mathematics of divisibility and the congruences that the reduced counts are computed in is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
