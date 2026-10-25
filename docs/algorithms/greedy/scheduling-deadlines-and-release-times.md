---
id: greedy.scheduling-deadlines-and-release-times
title: Scheduling with deadlines and release times
summary: Maximize the profit of unit-time jobs by keeping the best set that fits before each deadline, then extend the exchange argument to jobs with release times.
division: [silver, gold]
subjects: [greedy]
level: intermediate
importance: common-contest-technique
keywords:
    [
        job sequencing,
        deadlines,
        release times,
        min-heap,
        exchange argument,
        latest free slot,
        scheduling,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [range-queries.fenwick-tree, graphs.dsu]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - Every job takes exactly one unit of time, and every job is available from time 0 unless the statement gives a release time.
    - Deadlines are positive integers, and a job with deadline d must occupy one of the slots 1, 2, ..., d.
    - Profits are nonnegative, so adding a feasible job never lowers the total, and ties may be broken arbitrarily.
implementations: greedy.scheduling-deadlines-and-release-times
reviewed: false
---

<AlgorithmSummary algorithm="greedy.scheduling-deadlines-and-release-times" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="greedy.scheduling-deadlines-and-release-times" />

## At a glance

A single machine processes unit-time jobs. Job $j$ has a deadline $d_j$ and a profit $p_j$, and the profit is earned only if the job occupies one of the slots $1, 2, \ldots, d_j$. The question is which jobs to run.

Two greedy views give the same maximum profit. Sort by profit descending and put each job in the latest free slot before its deadline, or sort by deadline ascending, keep a min-heap of profits, and discard the smallest profit whenever the heap is larger than the current deadline.

| Property                   | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| **Problem**                | Maximize the profit of unit-time jobs completed by their deadlines |
| **Greedy order**           | Profit descending, or deadline ascending                           |
| **Data structure**         | Latest-free-slot disjoint set union, or a min-heap                 |
| **Time**                   | $O(n \log n)$                                                      |
| **Auxiliary space**        | $O(n)$                                                             |
| **Requires**               | Unit processing time, integer deadlines, release time $0$          |
| **Slot greedy fails when** | Jobs have release times or arbitrary processing times              |

The second half of the title is the extension. When each job also has a release time, the count version still has a greedy solution, but it is earliest-deadline-first over the jobs that have arrived, and the profit version needs a matching instead of a slot pointer. Both are developed in Variants and extensions.

## Problem motivation

A freelance editor has $n$ one-day commissions. Commission $j$ must be finished by day $d_j$ and pays $p_j$. The editor can take one commission per day, every commission is available on day $1$, and a commission finished exactly on its deadline still counts.

The constraints are $1 \le n \le 200\,000$, $1 \le d_j \le 10^9$ and $0 \le p_j \le 10^9$. The total profit can reach $2 \cdot 10^{14}$, so the accumulator needs 64 bits even though every individual profit fits in 32.

Trying every subset is $2^n$, and trying every order is worse. The structure that saves the problem is the deadline. A job with deadline $d$ can only use the first $d$ slots, so a set of jobs fits exactly when every prefix of the timeline contains no more jobs than it has slots. That prefix condition is what the greedy maintains, and it is why the problem has a near-linear solution instead of an exponential one.

The same question appears under several names. A supermarket sells one product per unit of time and earns a profit only if the product is sold by its expiration date. A student hands in one homework per day and loses points after each deadline. A printer prints one item per microsecond and can only print an item while it is inside the machine. The last version adds release times: each item arrives at a known moment, so it cannot use the early slots.

## Recognition patterns

Scheduling with deadlines is the right tool when the statement contains these phrases.

- "Each job takes exactly one unit of time", "one day", "one microsecond".
- "Job $i$ must be completed by time $d_i$", "before its deadline", "by the end of day $d_i$".
- "Maximize the total profit", "maximize the total fee", "minimize the total penalty".
- "One machine", "one worker", "one printer", "at most one job at a time".
- "All jobs are available at time $0$", which is the signal that the deadline-only form applies.
- "Job $i$ becomes available at time $r_i$", which is the signal that release times must be handled separately.

The constraint values decide which version of the technique is needed.

| Condition | What it rules in or out |
| --- | --- |
| Every job takes one unit | The slot model and both greedy views |
| Processing times are arbitrary | A different problem: Moore-Hodgson for counts, NP-hard for weights |
| Every job is available at time $0$ | The deadline-only greedy of this article |
| Jobs have release times and equal profits | An earliest-deadline sweep over the available jobs |
| Jobs have release times and profits | A matching, not the latest-free-slot rule |
| $n \le 20$ | Subset enumeration is a correct baseline |
| Deadlines are at most $n$ | An array of slots, or a disjoint set union over them |
| Deadlines reach $10^9$ | The min-heap view, or cap every deadline at $n$ before using slots |
| The objective is a count, not a profit | The same heap with every profit equal to $1$ |
| The statement asks for a feasible order only | Earliest-deadline-first is enough |

The row that matters most is the release-time row. A job with release time $r$ cannot use a slot before $r+1$, so the set of jobs that fit is no longer described by deadlines alone. The exchange argument survives, but the data structure changes.

## Naive approach

The baseline is to try every subset of jobs.

```python
best = 0
for mask in range(1 << n):
    chosen = [i for i in range(n) if mask & (1 << i)]
    chosen.sort(key=lambda i: deadlines[i])
    if all(deadlines[chosen[k]] >= k + 1 for k in range(len(chosen))):
        best = max(best, sum(profits[i] for i in chosen))
```

The feasibility test is the slot condition: after sorting the chosen jobs by deadline, the $k$-th job must have deadline at least $k$. The enumeration costs $O(n \log n \cdot 2^n)$ because each subset is sorted before it is tested, and it is only a specification, not a solution.

A second baseline is correct but quadratic. Sort the jobs by profit descending, keep a boolean array of used slots, and for each job scan slots $d_j, d_j-1, \ldots, 1$ for the first free one.

```python
used = [False] * (max_deadline + 1)
total = 0
for deadline, profit in sorted(jobs, key=lambda job: -job[1]):
    for slot in range(deadline, 0, -1):
        if not used[slot]:
            used[slot] = True
            total += profit
            break
```

This is $O(n \cdot \max d)$ and is the version to write when the deadlines are small and the time limit is generous. The rest of the article removes the inner scan.

The tempting wrong greedy is to sort by deadline and take every job that still has a free slot, without ever reconsidering an earlier choice. Two jobs with deadline $1$ and profits $10$ and $100$ are enough to break it: the first job taken is the $10$ job, the $100$ job is skipped, and the answer is $10$ instead of $100$. The correct algorithm must be able to replace a job it has already accepted.

## Key insight

There are two equivalent ways to see the same exchange.

**The slot view.** The highest-profit job should take the latest slot it can, because early slots are the scarce resource. If an optimal schedule omits the highest-profit job, then either it leaves a slot at or before that job's deadline free, in which case the job can be added, or it fills all those slots. In the second case, replace any job in a slot at or before the deadline with the highest-profit job; the replacement meets the same deadline, and every other job keeps its slot.

**The prefix view.** Sort the jobs by deadline. After the first $i$ jobs have been considered, at most $d_i$ of them can be kept, because all of them have deadline at most $d_i$. When the current selection has more than $d_i$ jobs, one must go, and the one to remove is the least profitable, because every remaining choice is constrained by the same prefix.

The two views produce the same total. The first is the one that proves the exchange argument most directly; the second is the one that is easiest to implement with a heap.

::: math invariant Invariant
After the jobs have been processed in nondecreasing order of deadline, the selected set is feasible, and it has the largest possible total profit among all feasible subsets of the jobs seen so far.
:::

The invariant is the whole correctness statement. The heap step either adds the new job, when there is room, or replaces the weakest selected job, when there is not. Both steps preserve the invariant, and the proof is in Correctness proof.

## Visual intuition

Draw the timeline as a row of slots. A job with deadline $d$ may occupy any slot from $1$ through $d$.

```text
slot        1       2       3       4
          +-------+-------+-------+-------+
          |       |       |       |       |
          +-------+-------+-------+-------+
deadline 1  ^
deadline 2  ^^^^^^^^^
deadline 3  ^^^^^^^^^^^^^^^^^
deadline 4  ^^^^^^^^^^^^^^^^^^^^^^^^^
```

A job with a small deadline has a short row of allowed slots. The heap keeps a bag of the best jobs seen so far, and whenever the bag contains more jobs than the current deadline allows, the weakest job falls out.

For the five jobs used in the next section, the selected jobs are $30$, $60$, $40$ and $50$, and they occupy slots $1$, $2$, $3$ and $4$. The $20$ job is the one that falls out, because it has the smallest profit and it is the job that makes the selection larger than the deadline $3$ allows.

```text
time        1       2       3       4
          +-------+-------+-------+-------+
selected  |  30   |  60   |  40   |  50   |
          +-------+-------+-------+-------+
deadline    3       2       3       4
```

The picture to hold is that the machine is always busy when a job is available, and the choice of which job to run is a choice about which deadline to protect. Protecting the earliest deadline is safe; protecting the largest profit is safe only when the deadline constraint is already satisfied.

## Formal model

::: math definition Definition
A **job** is a pair $(d_j, p_j)$ with an integer deadline $d_j \ge 1$ and a nonnegative profit $p_j$. The machine provides one **slot** per unit of time, numbered $1, 2, \ldots$; slot $t$ is the interval from $t-1$ to $t$. A **schedule** is an injective assignment $\sigma$ from a subset $S$ of the jobs to positive integers such that $\sigma(j) \le d_j$ for every $j \in S$. The **profit** of the schedule is $\sum_{j \in S} p_j$.
:::

A job with deadline $d$ can be placed in any slot $t$ with $1 \le t \le d$. The deadline is inclusive: a job that finishes exactly at time $d$ is on time.

::: math lemma Lemma
A set $S$ of jobs is schedulable if and only if for every integer $t \ge 1$,

$$
\left| \{ j \in S : d_j \le t \} \right| \le t.
$$
:::

::: math proof Proof
If $S$ is schedulable, the jobs with deadline at most $t$ must all occupy distinct slots among $1, \ldots, t$, and there are only $t$ such slots.

Conversely, suppose the condition holds. Sort $S$ by deadline and schedule the $k$-th job in slot $k$. If some $k$ had $k > d_{(k)}$, then the first $k$ jobs would all have deadline at most $d_{(k)} < k$, so the condition would fail at $t = d_{(k)}$. Therefore $k \le d_{(k)}$ for every $k$, and the schedule is valid. $\square$
:::

::: math definition Definition
For a set $S$ scheduled by the latest-free-slot rule, let $\operatorname{free}(d)$ be the largest slot $t \le d$ that is not used by $S$, or $0$ when every slot $1, \ldots, d$ is used. Placing a new job $j$ in $\operatorname{free}(d_j)$ is the **latest-free-slot step**.
:::

::: math lemma Lemma
Let $S$ be a schedulable set that has been placed by the latest-free-slot rule. A new job $j$ can be added to $S$ if and only if $\operatorname{free}(d_j) \ge 1$.
:::

::: math proof Proof
If a free slot $t \le d_j$ exists, put $j$ in the largest one; the old placement of $S$ is untouched, so $S \cup \{j\}$ is schedulable.

Conversely, suppose every slot $1, \ldots, d_j$ is occupied. Each job $x$ at slot $s$ has the property that every slot $s+1, \ldots, d_x$ is occupied; otherwise $x$ would have been placed later when it was inserted, and slots never become free again. Starting from slot $1$, the intervals $[s, d_x]$ of the jobs in the occupied slots cover a contiguous prefix $[1, T]$ with $T \ge d_j$. Every job in this prefix has deadline at most $T$: if one had a larger deadline, its interval would extend past $T$, contradicting the definition of $T$. Every job in a later slot has deadline larger than $T$, because a job at slot $u$ has deadline at least $u > T$. Hence exactly $T$ jobs of $S$ have deadline at most $T$. Adding $j$, whose deadline is at most $T$, gives $T+1$ such jobs, violating the prefix condition. So $S \cup \{j\}$ is not schedulable. $\square$
:::

::: math lemma Lemma
If $A$ and $B$ are schedulable and $|A| < |B|$, then some job $b \in B \setminus A$ can be added to $A$.
:::

::: math proof Proof
View a schedule as a matching between jobs and slots. Overlay the matchings for $A$ and $B$. Because $B$ has more edges than $A$, the symmetric difference contains a path whose two endpoints are unmatched in $A$: one endpoint is a slot and the other is a job. Reassigning the jobs along that path matches that job to that slot and keeps every job of $A$ matched, so $A \cup \{b\}$ is schedulable for that job $b$. This is the exchange axiom of the scheduling matroid. $\square$
:::

The last lemma is the only matroid fact the article uses. It says that a feasible set can always be enlarged by taking a job from any larger feasible set, which is exactly what the exchange argument needs.

## Algorithm derivation

**Version 1: profit descending, latest free slot.** Sort the jobs by profit descending. Maintain a disjoint set union over the slots, where `find(t)` returns the largest free slot at or before $t$, and `find(0) = 0`. For each job in profit order, let $t = \operatorname{find}(d_j)$. If $t > 0$, accept the job, add $p_j$ to the total, and mark slot $t$ as used by setting `parent[t] = find(t - 1)`. If $t = 0$, reject the job.

The proof is the exchange argument of the previous section. The highest-profit job is placed as late as it can be, so it never consumes a slot that a later job with an earlier deadline needs. The disjoint set union only implements the search for that latest slot; it does not change the greedy rule.

**Version 2: deadline ascending, min-heap.** Sort the jobs by deadline ascending. Maintain a min-heap of the profits of the selected jobs. For each job $(d_j, p_j)$:

1. Push $p_j$ into the heap.
2. If the heap now has more than $d_j$ elements, pop the smallest profit.

After the last job, the heap contains the selected profits and the answer is their sum. The condition is exactly the prefix condition: after processing a job with deadline $d$, every selected job has deadline at most $d$, so at most $d$ of them may remain.

The heap version never allocates a slot array, so it works unchanged when deadlines reach $10^9$. The disjoint set union version is faster in practice when the deadlines can be capped at $n$, because its operations are almost constant time, but both are $O(n \log n)$ after the sort.

::: math invariant Invariant
During the deadline-ascending scan, before the heap is trimmed, the heap contains the profits of a feasible set of the jobs seen so far. After trimming, it contains a feasible set of the same jobs with the largest possible total profit.
:::

The two versions may select different sets when profits tie. They always agree on the maximum total, which is the quantity the problem asks for.

## Step-by-step execution

Take five jobs, written as $(\text{deadline}, \text{profit})$.

| Job | Deadline | Profit |
| --- | -------- | ------ |
| A   | 3        | 40     |
| B   | 1        | 20     |
| C   | 3        | 30     |
| D   | 2        | 60     |
| E   | 4        | 50     |

Sorted by deadline, the order is B $(1,20)$, D $(2,60)$, C $(3,30)$, A $(3,40)$, E $(4,50)$.

| Step | Job      | Heap after push | Heap after trim | Total |
| ---- | -------- | --------------- | --------------- | ----- |
| 1    | B (1,20) | 20              | 20              | 20    |
| 2    | D (2,60) | 20, 60          | 20, 60          | 80    |
| 3    | C (3,30) | 20, 30, 60      | 20, 30, 60      | 110   |
| 4    | A (3,40) | 20, 30, 40, 60  | 30, 40, 60      | 130   |
| 5    | E (4,50) | 30, 40, 50, 60  | 30, 40, 50, 60  | 180   |

At step 4 the heap has four jobs but the deadline is $3$, so the smallest profit, $20$, is removed. The final selection is C, A, D and E, with total $180$.

A valid schedule is D in slot $1$, C in slot $2$, A in slot $3$ and E in slot $4$. D has deadline $2$, C and A have deadline $3$, and E has deadline $4$, so every job is on time. The rejected job B has deadline $1$ and would have required slot $1$, which D now occupies.

The profit-descending version reaches the same total. Sorted by profit, the jobs are D $(2,60)$, E $(4,50)$, A $(3,40)$, C $(3,30)$, B $(1,20)$.

| Step | Job      | Latest free slot at or before deadline | Action | Total |
| ---- | -------- | -------------------------------------- | ------ | ----- |
| 1    | D (2,60) | 2                                      | take   | 60    |
| 2    | E (4,50) | 4                                      | take   | 110   |
| 3    | A (3,40) | 3                                      | take   | 150   |
| 4    | C (3,30) | 1                                      | take   | 180   |
| 5    | B (1,20) | 0                                      | reject | 180   |

The profit version fills the late slots first, so it keeps the same four jobs with a different assignment: C in slot $1$, D in slot $2$, A in slot $3$ and E in slot $4$.

## Correctness proof

::: math theorem Theorem
The profit-descending latest-free-slot algorithm returns a schedulable set of maximum total profit.
:::

::: math proof Proof
Schedulable sets are closed under deletion, and the exchange lemma above is the matroid exchange axiom, so the schedulable sets form a matroid. Let $G$ be the set produced by the greedy algorithm, and let $O$ be an optimal schedulable set chosen to agree with $G$ on the longest possible prefix of the profit order. Extend $O$ to a maximal schedulable set; because profits are nonnegative, this does not lower its weight. The greedy set is also maximal: once a job is rejected, the accepted set at that moment plus the job is dependent, and every later accepted set contains that moment's set, so the job can never be added later.

Suppose $G \ne O$, and let $j$ be the first job in the profit order on which they differ. Greedy cannot have rejected $j$: if it had, the set $A$ of jobs accepted before $j$ would have the property that $A \cup \{j\}$ is not schedulable, and since $A \subseteq O$, $O$ could not contain $j$ either, contradicting the assumption that $O$ differs from $G$ at $j$. So greedy accepted $j$ and $O$ omits it.

The set $A \cup \{j\}$ is schedulable, and $A \subseteq O$. Adding $j$ to the maximal set $O$ creates a unique circuit, and that circuit cannot be contained in $A \cup \{j\}$, which is independent. Hence the circuit contains some $y \in O \setminus (A \cup \{j\})$, and $O - y + j$ is schedulable. Every job before $j$ in the profit order is either in $A$ or absent from $O$: accepted jobs are in $A$, and a rejected job $h$ cannot be in $O$ because $A_h \cup \{h\}$ was already dependent and $A_h \subseteq A \subseteq O$. Therefore $y$ comes after $j$ in the profit order, so $p_y \le p_j$. The set $O - y + j$ is still optimal and agrees with $G$ on one more job, contradicting the choice of $O$. Hence $G = O$, and $G$ is optimal. $\square$
:::

::: math theorem Theorem
The deadline-ascending min-heap algorithm returns a schedulable set of maximum total profit.
:::

::: math proof Proof
Induct on the number of jobs processed in nondecreasing deadline order. The empty prefix is trivial. Let $H$ be the heap after the first $i$ jobs, and let $j$ be the next job, with deadline $d$. Every job seen so far has deadline at most $d$.

If $|H| < d$, then $H \cup \{j\}$ is schedulable: schedule $H$ by earliest deadline in slots $1, \ldots, |H|$, which the prefix condition permits, and put $j$ in slot $|H|+1 \le d$. Any schedulable set $O$ of the new prefix either omits $j$, in which case its weight is at most the weight of $H$ by induction, or contains $j$, in which case $O \setminus \{j\}$ is schedulable in the old prefix and its weight is at most the weight of $H$. In both cases the weight of $O$ is at most the weight of $H \cup \{j\}$.

If $|H| = d$, every schedulable set of the new prefix has at most $d$ jobs, because all deadlines are at most $d$. (The heap was trimmed after the previous job, so $|H| \le d$; the case $|H| < d$ was handled above.) Let $m$ be a job of minimum profit in $H \cup \{j\}$, and let $H' = (H \cup \{j\}) \setminus \{m\}$. If $m = j$, then $H' = H$. Otherwise schedule $H \setminus \{m\}$ by earliest deadline in slots $1, \ldots, d-1$ and put $j$ in slot $d$; both parts meet their deadlines, so $H'$ is schedulable. Now take any schedulable $O$. If $j \notin O$, its weight is at most the weight of $H$, and $H$ is no heavier than $H'$ because $p_j \ge p_m$ when $m \in H$, while $H' = H$ when $m = j$. If $j \in O$, then $O \setminus \{j\}$ is schedulable in the old prefix and has fewer than $d$ jobs. By the exchange lemma, some $x \in H \setminus (O \setminus \{j\})$ can be added to $O \setminus \{j\}$, and the result is schedulable in the old prefix, so its weight is at most the weight of $H$. Since $x \in H$, its profit is at least $p_m$. Therefore

$$
\operatorname{profit}(O) \le \operatorname{profit}(H) - p_m + p_j = \operatorname{profit}(H').
$$

The heap step preserves the invariant, so after the last job the heap is optimal. $\square$
:::

The edge cases are covered by the same argument. A job with profit $0$ can be kept or dropped without changing the total. A job with deadline $0$ is not legal input under the assumptions, and a deadline larger than $n$ simply never binds, because the heap can never contain more than $n$ jobs.

## Complexity analysis

**Time: $O(n \log n)$.** Both versions sort the jobs, which costs $O(n \log n)$ comparisons. The heap version performs one push per job and at most one pop per job, each $O(\log n)$, so its total is $O(n \log n)$. The disjoint set union version performs two finds and at most one relink per job; with path compression the finds are amortized near constant, so its total is also $O(n \log n)$, dominated by the sort.

**Auxiliary space: $O(n)$.** The heap holds at most $n$ profits. The disjoint set union holds one entry per slot, which is $O(n)$ after capping every deadline at $n$, or $O(\max d)$ without capping.

::: math complexity Complexity
Scheduling with deadlines: $O(n \log n)$ time for the sort plus the heap or disjoint set union operations, and $O(n)$ auxiliary space. The total profit fits in a signed 64-bit integer because $n \le 2 \cdot 10^5$ and $p_j \le 10^9$, so the sum is at most $2 \cdot 10^{14}$.
:::

The sort is not avoidable by the heap alone, because the deadline order is the order in which the prefix condition becomes true. If the input already arrives sorted by deadline, the sort disappears and the heap operations dominate. When the deadlines are bounded by $n$ and the profit range is small, a bucket queue can replace the heap, but that is a separate optimization and not needed for the usual constraints.

The quadratic baseline is worth naming for comparison: scanning every slot for every job costs $O(n^2)$ when the deadlines are at most $n$, which is $4 \cdot 10^{10}$ slot tests at $n = 200\,000$. The heap reduces the work to $O(n \log n)$ comparisons, about $3.6 \cdot 10^6$ at that size.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Unit jobs, deadlines, profits, release time $0$ | Profit descending with latest free slot, or deadline ascending with a min-heap |
| Unit jobs, deadlines, every profit equal | Sort by deadline and count with a slot pointer, or the same heap |
| Unit jobs, deadlines, penalties, minimize the total penalty | Total penalty minus the maximum profit of the on-time jobs |
| Unit jobs, release times, maximize the count | Earliest-deadline-first sweep with a min-heap of deadlines |
| Unit jobs, release times, maximize the profit | Profit descending with a bipartite-matching feasibility test |
| Arbitrary processing times, unit profits, minimize late jobs | Moore-Hodgson: sort by deadline and drop the longest job when late |
| Arbitrary processing times, weighted late jobs | NP-hard; use a dynamic program, branch and bound, or an approximation |
| Fixed start and end times, maximize the weighted count | Weighted interval scheduling, a dynamic program |
| Several identical machines, unit jobs, deadlines | The same prefix condition with $m$ slots per time |
| Minimize the maximum lateness, no release times | Earliest-deadline-first (Jackson's rule) |
| Preemptive scheduling with release times and deadlines | Earliest-deadline-first is optimal for feasibility |
| Jobs arrive online and must be accepted or rejected at once | A different, competitive-ratio problem |

The fourth and fifth rows are the release-time split. With equal profits, earliest-deadline-first is optimal because a job that has arrived and has the earliest deadline is always the safest one to run: swapping it with any later-deadline job that was run instead keeps both jobs inside their windows. With profits, that swap can lose a large profit, and the latest-free-slot rule can block a job that arrives later. The corrected rule is still a greedy by profit, but the feasibility test becomes a matching between jobs and slots.

The sixth row is the arbitrary-processing-time counterpart. Moore-Hodgson minimizes the number of late jobs by sorting on deadlines and, whenever the current job misses its deadline, removing the job with the largest processing time. It is not the same algorithm as this article, because the removed job can be one that was already accepted, and the processing times matter. The weighted version is NP-hard, so a statement that asks for the maximum profit with arbitrary durations is not a deadline-greedy problem.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read $n$, the number of jobs.
2. Read $n$ lines, each holding the deadline $d_j$ and the profit $p_j$ of one job.
3. Print the maximum total profit of a schedulable subset, on one line.

The input is whitespace-separated, so line breaks may appear anywhere between two numbers. Deadlines are positive, profits are nonnegative, and $n = 0$ is legal input and produces `0`. The output is a single integer followed by a newline, so the six variants can be compared byte for byte.

All six variants use the deadline-ascending min-heap algorithm. The C variant sorts with `qsort` and maintains a hand-written binary heap of `long long` profits. The C++ variant uses `std::sort` and `std::priority_queue` with `std::greater<long long>`, which is a min-heap. The Java variant uses `Arrays.sort` on a job array and `PriorityQueue<Long>`. The Python variant sorts a list of tuples and uses `heapq`. The Pascal variant uses an iterative merge sort, a hand-written heap of `Int64`, and one argument per `Read`, so it compiles under the browser build of the compiler. The JavaScript variant sorts with a comparator and maintains a hand-written array-backed min-heap, because the standard library has no priority queue.

The C, C++, Java and Pascal variants store profits in a signed 64-bit type. The Python variant uses arbitrary-precision integers. The JavaScript variant uses `Number`, which represents every integer below $2^{53}$ exactly; the largest possible answer, $2 \cdot 10^{14}$, is far below that limit. The sums are therefore exact in all six languages.

The heap stores only profits, never slots, so the variants handle deadlines up to $10^9$ without allocating an array of that size. The disjoint set union version is described in Algorithm derivation but is not published as a `program` variant, because the heap is shorter and needs no deadline capping.

## Recursion decision

Both algorithms are iterative, and no part of the reference implementations recurses. The only recursive idea in the neighborhood is the subset enumeration of the naive approach, whose depth is $n$ and whose number of leaves is $2^n$. That recursion is rejected for both the time limit and the stack.

A recursive heap operation is possible and has depth $O(\log n)$, which is safe in every language in this encyclopedia. It buys nothing, because the iterative sift-up and sift-down loops are shorter than the recursive versions and avoid a function call per level. The disjoint set union is also written iteratively; a recursive find would work at these sizes, but the iterative version avoids any question about the stack.

| Language   | Default limit              | Practical depth    | Recommendation  |
| ---------- | -------------------------- | ------------------ | --------------- |
| C and C++  | 8 MB of stack              | About $10^5$       | Iterative loops |
| Java       | 512 KB to 1 MB per thread  | About $10^4$       | Iterative loops |
| Python     | Interpreter limit of 1000  | 1000               | Iterative loops |
| Pascal     | The operating system stack | Platform dependent | Iterative loops |
| JavaScript | The V8 engine limit        | About $10^4$       | Iterative loops |

The sort in the Pascal variant is an iterative bottom-up merge sort for the same reason. A recursive quicksort would be safe at the tested depths, but the merge sort keeps the listing free of recursion entirely and its worst case stays $O(n \log n)$.

## Implementation walkthrough

Five details decide whether a deadline-scheduling program is correct.

**Sort by deadline, not by profit, in the heap version.** The heap argument relies on processing the jobs in nondecreasing deadline order. Sorting by profit and then using the heap can give a different, wrong answer, because the prefix condition is no longer the condition being maintained.

**Use a min-heap, not a max-heap.** The job that leaves when the heap is too large is the least profitable one. In C++ the default `std::priority_queue` is a max-heap, so the third template argument must be `std::greater<long long>`. In Java, `PriorityQueue` is already a min-heap. In Python, `heapq` is a min-heap. In C, Pascal and JavaScript, the comparison in the sift loops must reverse the order.

```cpp
std::priority_queue<long long, std::vector<long long>, std::greater<long long>> kept;
for (const Job &job : jobs) {
    kept.push(job.profit);
    if (static_cast<long long>(kept.size()) > job.deadline) {
        kept.pop();
    }
}
```

**Compare the heap size with the current deadline, not with the maximum deadline.** The condition is checked after every push, because a deadline can be exceeded in the middle of the scan and a later deadline does not undo the violation. If several jobs share a deadline, any order among them is fine: the heap ends the group with the largest profits that fit, and the intermediate states are also feasible.

**Use 64 bits for the total.** The number of jobs and the profit per job can both be large. A 32-bit accumulator overflows on the third job of a fixture with three profits of $10^9$, which is exactly the edge case that the fixtures include.

**Do not count a profit twice.** The heap pop removes the weakest selected job, and the total is the sum of what remains at the end. Either add each profit when it is pushed and subtract it again when it is popped, or push everything first and sum the final heap once; mixing the two counts the surviving jobs twice.

A compact Python core is:

```python
jobs.sort()
kept = []
for deadline, profit in jobs:
    heapq.heappush(kept, profit)
    if len(kept) > deadline:
        heapq.heappop(kept)
print(sum(kept))
```

The latest-free-slot version replaces the heap with a disjoint set union:

```cpp
int find(int slot) {
    while (parent[slot] != slot) {
        parent[slot] = parent[parent[slot]];
        slot = parent[slot];
    }
    return slot;
}

for (const Job &job : by_profit) {
    int slot = find(static_cast<int>(std::min<long long>(job.deadline, n)));
    if (slot > 0) {
        total += job.profit;
        parent[slot] = find(slot - 1);
    }
}
```

The cap at $n$ is safe because no schedule uses more than $n$ slots. The `find(0)` base case is what makes an exhausted prefix return $0$ instead of searching slot $0$ as if it were available.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sorting by profit and using the deadline-heap condition | The prefix invariant is lost and the total is wrong | Sort by deadline for the heap version |
| Using a max-heap instead of a min-heap | The largest profit is removed when the heap is too large | Use `greater`, or reverse the comparison |
| Taking every job that fits without replacement | A low-profit job with an early deadline blocks a high-profit one | Pop the weakest job when the prefix is too large |
| Putting the highest-profit job in the earliest free slot | A job with an early deadline loses its only slot | Use the latest free slot |
| Checking the deadline only once at the end | A violation in the middle is missed | Trim after every push |
| Using a 32-bit accumulator | The total wraps around above $2^{31}-1$ | Use `long long`, `long`, `Int64`, or Python integers |
| Treating a deadline as a zero-based index and shifting it down by one | Each job loses its last allowed slot and the answer can be too small | Slot $t$ is the $t$-th unit, and $t \le d$ |
| Capping deadlines at $n$ in the heap version | Nothing changes, but the cap hides the fact that the heap needs no slot array | Cap only when allocating a slot array |
| Applying the latest-slot rule when jobs have release times | A flexible high-profit job blocks a later arrival | Use a matching feasibility test |
| Using this heap when processing times are not unit | The prefix condition no longer describes feasibility | Use Moore-Hodgson or the appropriate DP |

### Why this fails: keeping every job that fits

The mistake that survives review most often is the one-pass acceptance rule. Sort by deadline, keep a free-slot pointer, and accept each job if a slot is free; never reconsider an accepted job.

The smallest counterexample has two jobs, both with deadline $1$.

| Job | Deadline | Profit |
| --- | -------- | ------ |
| A   | 1        | 10     |
| B   | 1        | 100    |

The correct answer is $100$, by scheduling B alone. The one-pass rule sees A first, puts it in slot $1$, finds no slot for B, and returns $10$. The repair is not to change the order, because the order by deadline is forced; the repair is to allow the new job to replace the weakest job already selected. That is exactly what the heap pop does.

The second failure is the opposite mistake in the slot view. Sort by profit, so the high-profit job comes first, and put it in the **earliest** free slot rather than the latest.

| Job | Deadline | Profit | Earliest slot | Latest slot |
| --- | -------- | ------ | ------------- | ----------- |
| A   | 2        | 100    | 1             | 2           |
| B   | 1        | 5      | none          | 1           |

The earliest-slot rule puts A in slot $1$, then B has no slot at or before $1$, and the total is $100$. The latest-slot rule puts A in slot $2$ and B in slot $1$, for $105$. The difference is not the sort order; it is which end of the allowed range is used.

Two jobs are enough to expose both bugs, which is why they belong in the first round of testing. A third failure is specific to release times and appears in Variants and extensions: the latest-slot rule itself stops being safe when a job cannot use the early slots.

## Variants and extensions

**Release times, equal profits.** Job $j$ has a release time $r_j$, a deadline $d_j$, and unit processing time; it may use any slot $t$ with $r_j < t \le d_j$. To maximize the number of jobs, sweep the slots in increasing order. At slot $t$, add every job with $r_j < t$ to a min-heap ordered by deadline, discard the jobs whose deadline is already below $t$, and run the job with the smallest deadline. If the heap is empty, jump $t$ to the next release time plus one. This is earliest-deadline-first, and it is optimal: if a schedule runs a later-deadline job at slot $t$ while an available job with an earlier deadline waits, swapping the two keeps both inside their windows.

**Release times, profits.** The feasible sets are still a transversal matroid: a set of jobs is schedulable exactly when it can be matched to distinct slots inside its windows. Therefore sorting by profit and adding a job whenever the set still has a matching is optimal. The greedy order is unchanged; the feasibility test is now a bipartite matching or a min-cost flow, not a slot pointer. The simple latest-slot rule fails here. With slots $1, 2, 3$, take A $(r=0, d=3, p=10)$, B $(r=2, d=3, p=9)$ and C $(r=0, d=2, p=9)$. Profit order puts A in slot $3$, B then has no slot in $[3,3]$, and C takes slot $2$, for $19$. The optimum is A in slot $1$, C in slot $2$ and B in slot $3$, for $28$.

**Arbitrary processing times, unit profits.** Sort by deadline and keep the selected jobs' total processing time. When the next job would finish after its deadline, remove the selected job with the largest processing time. This is Moore-Hodgson, and it minimizes the number of late jobs. The removed job is not necessarily the new one, so the heap key is the processing time, not the profit.

**Arbitrary processing times, profits.** The problem $1 \mid\mid \sum w_j U_j$ is NP-hard, so no greedy rule of this article applies. When the jobs have fixed start and end times instead of durations, the problem is weighted interval scheduling and has a dynamic program over the sorted finish times. The change from unit times to arbitrary durations is what removes the matroid structure.

**Several identical machines.** Unit jobs with deadlines and $m$ identical machines are feasible exactly when every prefix of $t$ slots contains at most $m t$ jobs. The profit-descending greedy still works, with $m$ copies of each slot, and the heap version replaces the condition $|H| \le d$ with $|H| \le m d$. The exchange argument is unchanged; only the capacity in the prefix condition changes.

**Penalties instead of profits.** When each late job costs a penalty and the goal is to minimize the total penalty, subtract the maximum profit of the on-time jobs from the sum of all penalties. Each on-time job saves its penalty, so the transformation is exact and no new algorithm is needed.

**Minimizing the maximum lateness.** With release time $0$, earliest-deadline-first minimizes the maximum lateness as well as maximizing the number of on-time jobs. With release times, the objective is harder, and the simple sort is no longer optimal. The deadline-only greedy of this article is about counts and profits, not about lateness.

**Preemption.** If a job may be interrupted and resumed, earliest-deadline-first is optimal for feasibility with release times and deadlines. Preemption changes the problem from a matching to a scheduling rule, and the unit-time slot model no longer describes it.

**Online arrivals.** If jobs arrive one at a time and each must be accepted or rejected immediately, no deterministic algorithm is optimal for every input; the problem becomes a competitive-ratio question. The offline exchange argument does not apply, because the algorithm cannot see the jobs that have not arrived.

## Contest strategy

1. Decide whether every job takes one unit of time. If not, stop: this is not the article's algorithm, and the weighted version is NP-hard.
2. Decide whether every job is available at time $0$. If release times are present, plan for the earliest-deadline sweep or a matching before writing the heap.
3. Decide whether the objective is a profit or a count. A count is the same problem with every profit equal to $1$, so the heap still works.
4. Choose the implementation: the heap if deadlines are huge or the code should be short, and the disjoint set union if you are willing to cap the deadlines at $n$ and allocate the slot array.
5. Sort by deadline for the heap, and by profit for the latest-slot version. Never mix the two orders.
6. Use a 64-bit accumulator, and print exactly one integer.
7. Test five inputs: one job, two jobs with the same deadline, two jobs whose deadlines differ, a case where the best job has the earliest deadline, and a case where the best job has the latest deadline.
8. If the statement has release times and profits, do not submit the latest-slot rule; either reduce to a matching or use the problem's additional structure.

## Worked problems

### Problem 1: the supermarket

**Restatement.** A supermarket sells products one at a time. Product $x$ earns $p_x$ if it is sold by deadline $d_x$, and each sale takes one unit of time. Several product sets are given, each ending at the end of the input. For each set, report the maximum total profit. Constraints: $N \le 10\,000$ per set.

**Naive baseline.** Enumerate the $2^N$ subsets and test each by sorting its deadlines. At $N = 10\,000$ this is far beyond any time limit.

**Insight.** Sort the products by profit descending and give each one the latest free slot at or before its deadline. If no such slot exists, the product cannot be added to the current selection.

**Derivation.** Keep a disjoint set union over the slots. `find(d)` returns the largest free slot at or before $d$; when slot $s$ is used, set `parent[s] = find(s - 1)`. The answer is the sum of the profits of the products that find a positive slot.

**Correctness.** This is the profit-descending theorem: the accepted set is a maximum-weight independent set of the scheduling matroid, and the disjoint set union implements the latest-free-slot test exactly. The prefix condition guarantees that a rejected product has no room in any schedule of the accepted higher-profit products.

**Complexity.** $O(N \log N)$ time and $O(\max d)$ space per set, or $O(N)$ after capping each deadline at $N$.

**Common wrong approach.** Sorting by deadline and taking every product that fits. The two-product counterexample in Common mistakes loses the $100$ profit.

### Problem 2: doing homework again

**Restatement.** Ignatius has $n$ homework assignments, each taking one day. Assignment $i$ has deadline $d_i$ and costs $c_i$ points if it is late. Report the smallest total penalty over all orders. Constraints: $n \le 1000$ per test case, several test cases.

**Naive baseline.** Try every order of the assignments, which is $n!$, or every subset, which is $2^n$.

**Insight.** Minimizing the penalty is the same as maximizing the penalty saved by the on-time assignments. Treat $c_i$ as the profit of assignment $i$ and reuse the deadline greedy.

**Derivation.** Sort by deadline, keep a min-heap of the penalties of the assignments selected so far, and pop the smallest whenever the heap is larger than the current deadline. The answer is the total penalty minus the sum of the heap.

**Correctness.** The heap invariant of the second theorem: after each prefix, the selected assignments form a maximum-profit feasible subset. The final sum is the largest penalty that can be saved, so the difference is the smallest penalty that must be paid.

**Complexity.** $O(n \log n)$ time and $O(n)$ space per test case.

**Common wrong approach.** Sorting by penalty descending and doing the largest penalties first without checking whether a deadline can still be met. A large penalty with a tight deadline can consume the only slot and force two smaller penalties to be late.

### Problem 3: the printing machine

**Restatement.** $n$ products move on a conveyor belt. Product $i$ is inside the printer's range from time $T_i$ to time $T_i + D_i$, inclusive. The printer can print one product instantly, but after a print it needs one microsecond before the next print. Maximize the number of products printed. Constraints: $n \le 2 \cdot 10^5$ and $T_i, D_i \le 10^{18}$.

**Naive baseline.** Simulate every integer microsecond from the first arrival to the last exit. The time axis reaches $10^{18}$, so the simulation is impossible.

**Insight.** At any moment, the printer should print the available product that leaves the range earliest. If no product is available, jump directly to the next arrival time instead of visiting the empty microseconds.

**Derivation.** Sort the products by $T_i$. Sweep a time variable $t$, add every product with $T_i \le t$ to a min-heap of exit times $T_i + D_i$, and discard the heap entries that have already expired. If the heap is empty, set $t$ to the next arrival. Otherwise pop the smallest exit time, count one print, and advance $t$ by one.

**Correctness.** Exchange argument: if an optimal schedule prints a product with a later exit time at time $t$ while an available product with an earlier exit time waits, swap the two. The earlier-exit product is still inside its window at $t$, and the later-exit product takes the later slot, which is still before its exit time. Repeating the swap turns an optimal schedule into the greedy one without reducing the count.

**Complexity.** $O(n \log n)$ time and $O(n)$ space. Each product enters and leaves the heap once.

**Common wrong approach.** Ordering the heap by arrival time or by the length $D_i$ instead of the exit time. Arrival order ignores which product is about to expire, and window length says nothing about the absolute exit time.

## Practice progression

1. **Recognition.** Given a statement, decide whether every job takes one unit and whether release times are present. Write the deadline and profit of each job in a table before choosing an algorithm.
2. **Direct application.** Implement the deadline-ascending heap version and test it against the $2^n$ enumeration on random small inputs with deadlines up to $4$ and profits up to $10$.
3. **Adaptation.** Implement the profit-descending version with a disjoint set union over slots, cap the deadlines at $n$, and compare its selected total with the heap version on the same random inputs.
4. **Combination.** Solve the penalty version by subtracting the maximum saved profit from the total penalty, and solve the multiple-machine version by replacing the capacity $1$ with $m$.
5. **Challenge.** Add release times to the equal-profit version and implement the earliest-deadline sweep; then add profits and explain why the latest-slot rule fails on the three-job counterexample.
6. **Transfer.** Recognize the same shape in a cache eviction rule, a queue of expiring coupons, and a printer that must choose which arriving item to serve next.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the two greedy orders and the data structure each one uses. (At a glance)
2. Why does a job with deadline $d$ have only $d$ allowed slots, and what does the prefix condition say? (Formal model)
3. What does the latest-free-slot lemma guarantee, and why does an occupied prefix prove that a new job does not fit? (Formal model)
4. Why is the highest-profit job safe to place in the latest free slot? (Key insight)
5. In the heap version, why is the popped job the smallest profit rather than the largest? (Algorithm derivation)
6. What is the heap state after the fourth job in the worked example, and why is $20$ removed? (Step-by-step execution)
7. What does the exchange lemma say, and where is it used in the heap proof? (Correctness proof)
8. Why does the heap proof need the condition $|H| = d$ in the second case? (Correctness proof)
9. What is the time and space bound of each version, and which operation dominates? (Complexity analysis)
10. Why does the latest-slot rule fail when jobs have release times? (Variants and extensions)
11. What changes when processing times are arbitrary instead of unit? (Algorithm selection)
12. Why is the total profit stored in 64 bits even though each profit is at most $10^9$? (Implementation walkthrough)

## Further reading

- The unweighted interval version, where the intervals have start and end times and the objective is a count, is [interval scheduling](/algorithms/greedy/interval-scheduling).
- The data structure that finds the latest free slot is the [disjoint set union](/algorithms/graphs/dsu).
- The prefix-count structure that maintains how many jobs have deadline at most $t$ is the [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The search that finds the last compatible interval in the weighted version is [binary search](/algorithms/searching/binary-search).
- The take-or-skip dynamic program that replaces the greedy rule when the jobs have durations and values has the same shape as [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The comparison and ordering rules used by the sorts in this article are developed in [sorting by several keys](/algorithms/greedy/multi-key-sorting).
