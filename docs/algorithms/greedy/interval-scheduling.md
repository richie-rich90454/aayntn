---
id: greedy.interval-scheduling
title: Interval scheduling
summary: Choose the largest possible set of non-overlapping intervals by repeatedly taking the one that finishes earliest.
division: [silver, gold]
subjects: [greedy]
level: intermediate
importance: common-contest-technique
keywords:
    [
        interval scheduling,
        activity selection,
        greedy,
        earliest finish time,
        exchange argument,
        meeting rooms,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [searching.binary-search, arrays.prefix-sums]
assumptions:
    - Each interval has a start time and an end time, and two intervals are compatible when they do not overlap.
reviewed: false
---

## At a glance

Interval scheduling asks for the largest set of intervals that do not overlap each other. The answer comes from one rule: **always take the interval that finishes earliest.**

The rule sounds trivial and it is easy to state, and it is one of the few greedy rules in this encyclopedia that can be proved correct rather than merely defended by intuition. The proof is an exchange argument: the earliest-finishing interval can be swapped into an optimal solution without making that solution worse, so taking it is safe. The exchange argument is the article.

The rule is also one of the most often misremembered. Sorting by the **shortest** interval, or by the **earliest start**, or by the **largest value** without a proof, all produce answers that are wrong on small inputs, and the article works through the shortest-interval mistake with a three-interval counterexample.

The algorithm costs $O(n \log n)$ to sort and $O(n)$ to scan, or $O(n)$ when the intervals arrive sorted by finish time. The greedy choice is not the only correct one; it is the one that can be proved correct with a short argument.

## Problem motivation

A university has one lecture hall and a list of invited talks. Each talk has a start time and an end time, the hall can hold only one talk at a time, and the department wants to schedule as many talks as possible.

The constraints:

- $1 \le n \le 500\,000$ talks.
- The start and end times are given in minutes, with $0 \le s_i < e_i \le 10^9$.
- Two talks conflict when their intervals overlap, and a talk that starts exactly when the previous one ends is allowed.
- Every talk is worth exactly one talk to the count; there are no weights.

The naive answer tries every subset of talks, which is $2^n$ and hopeless. A greedy answer is possible, and the interesting part is knowing which greedy rule is the right one.

The problem is worth a full article because the same structure appears with different names: choosing meeting rooms for interviews, choosing satellite broadcast slots, choosing non-overlapping jobs on one machine, and choosing which pages to keep when a printer's job queue is cleared.

## Recognition patterns

Interval scheduling is the right tool when all of the following hold.

- Every item is an **interval** with a start and an end.
- Every interval is worth the **same**, so the objective is a count and not a total.
- The intervals are **static**: they are not generated one at a time by a greedy process.
- At most **one** interval can be active at a time.

The phrases that signal it are "one room", "one machine", "one camera", "no two at a time", "maximize the number", "schedule as many as possible". The phrase that rules it out is "maximize the total value", because a weighted version of this problem does not have a greedy solution.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Every interval is worth 1 | Rules in the greedy rule; a weighted version needs a dynamic program |
| Several rooms are available | Rules in this algorithm; the $k$-room version needs a different technique |
| Intervals are generated in order of start time | Rules in a one-pass sweep instead of a sort by finish time |
| The end times are already sorted | The sort disappears and the algorithm is $O(n)$ |
| $n \le 10^3$ | A quadratic search is acceptable, but the greedy rule is shorter |

## Naive approach

The baseline is to try every subset.

```python
best = 0
for mask in range(1 << n):
    chosen = [i for i in range(n) if mask & (1 << i)]
    chosen.sort(key=lambda i: ends[i])
    if all(starts[chosen[k + 1]] >= ends[chosen[k]] for k in range(len(chosen) - 1)):
        best = max(best, len(chosen))
```

This is $O(n 2^n)$ and it is a correct specification of the problem, in the same way that the subset enumeration is a correct specification of knapsack. It is not a solution to anything.

The second baseline is the greedy rule written wrongly, and it is worth writing down because the wrong version is so common:

```python
chosen.sort(key=lambda i: ends[i] - starts[i])   # shortest first: wrong
```

Sorting by length and taking greedily is a plausible guess, and it fails. The counterexample is in the "Why this fails" section below.

## Key insight

The insight is that the earliest-finishing interval is the one that leaves the most room behind it.

Every other interval ends at or after it does. So after taking the earliest-finishing interval, at least as much of the day remains as would remain after taking any other interval. Whatever schedule follows it, a schedule that follows any other interval can also follow this one, and the two are the same length. That is the whole intuition, and it is what the exchange argument makes precise.

The consequence is that the choice of the next interval depends only on the finish time, and only on the earliest one. The rest of the algorithm is bookkeeping: sort by finish time, then sweep.

<MathPanel type="invariant" title="Invariant">
After the greedy algorithm has chosen $k$ intervals, there is an optimal
solution for the sub-problem of the intervals that start at or after the
finish time of the last chosen interval, and that optimal solution has
$k$ more intervals.
</MathPanel>

The invariant is the statement that the greedy choice never costs anything. The proof is in the correctness section.

## Visual intuition

Draw the intervals on a timeline and sort them by their right edge. The greedy algorithm is the picture of a cursor that jumps to the next interval whose left edge is at or beyond the end of the last one.

```text
   [A====]
        [B=====]
   [C===]
             [D======]
```

Sorted by finish time, that is A, C, B, D. The greedy algorithm takes A, whose end is the earliest; then it skips B, whose start is before A ends; then it takes C, which starts after A ends; then it skips D, whose start is before C ends. The chosen set is A and C.

The picture to hold is that of a "greedy cursor" that only ever moves right and always lands as early as it can. A rule that picks a _long_ interval, however valuable it looks, parks that cursor further to the right and costs everything that happens afterwards.

## Formal model

Let $\{I_1, I_2, \ldots, I_n\}$ be a family of intervals, where $I_i = [s_i, e_i)$ with $s_i < e_i$.

<MathPanel type="definition" title="Definition">
Two intervals $I$ and $J$ are **compatible** if they do not overlap, that
is, if $s_J \ge e_I$ or $s_I \ge e_J$. A **schedule** is a set of pairwise
compatible intervals. The **optimum** is the largest number of intervals
in a schedule.
</MathPanel>

<MathPanel type="definition" title="Definition">
The interval with the **earliest finish time** is the interval $I^*$ with
$s_i \le e_{I^*}$ for every $i$, that is, the one whose right edge is
leftmost. The **greedy rule** is: among the intervals that are still
available, take the one with the earliest finish time, and repeat.
</MathPanel>

<MathPanel type="definition" title="Definition">
An interval $I_j$ is **compatible with a prefix** ending at time $t$ if
$s_j \ge t$. After the greedy algorithm has chosen a set of intervals, the
remaining candidate intervals are exactly those that are compatible with
the prefix.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $I^*$ be the interval with the earliest finish time, and let $O$ be
any optimal schedule. There is an optimal schedule that contains $I^*$.
</MathPanel>

The lemma is the exchange statement, and it is proved below.

## Algorithm derivation

The state is the time $t$ at which the hall becomes free, initialized to the time before the first talk.

The update rule is: among the intervals that are still available, take the one with the earliest finish time, set $t$ to that finish time, and repeat.

Sorting by finish time turns "the earliest finish time among the available intervals" into "the first interval in the list that starts at or after $t$", and a single forward scan finds all of them. The scan never goes backwards, because the intervals are sorted by finish time and an interval that was skipped is skipped forever.

The sort key is the part that people get wrong. Sorting by start time, by length, or by value produces a different scan, and only one of them is correct.

<MathPanel type="invariant" title="Invariant">
During the scan, the intervals that have been examined are exactly the
intervals that finish at or before the current time $t$, plus the ones
skipped because they start before $t$.
</MathPanel>

## Step-by-step execution

Take four interviews, with the half-open intervals written as start and end times.

| Interview | Start | End |
| --------- | ----- | --- |
| A         | 1     | 4   |
| B         | 3     | 5   |
| C         | 5     | 7   |
| D         | 2     | 8   |

Sorted by finish time, the order is A (ends 4), B (ends 5), C (ends 7), D (ends 8).

- The free time is $t = 0$. The first interval in the sorted list is A, which starts at 1, and $1 \ge 0$, so A is taken. The free time becomes 4, and the count is 1.
- The next interval is B, which starts at 3. Since $3 < 4$, B is skipped.
- The next is C, which starts at 5. Since $5 \ge 4$, C is taken. The free time becomes 7, and the count is 2.
- The next is D, which starts at 2. Since $2 < 7$, D is skipped.

The schedule is A and C, with 2 interviews.

The same four interviews sorted by length would be A and D first, since both have length 3, then B, then C. Taking A gives a free time of 4; B starts at 3 and is skipped; C starts at 5 and is taken; D is skipped. That happens to give the same answer, which is exactly why the shortest-interval rule is dangerous: it fails only on inputs that are not obviously the same.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The greedy algorithm that repeatedly takes the compatible interval with the
earliest finish time produces a schedule of maximum size.
</MathPanel>

<MathPanel type="proof" title="Proof">
We prove the exchange lemma first.

Let $I^*$ be the interval with the earliest finish time, and let $O$ be an optimal schedule. Write $O$ as $O_1, O_2, \ldots, O_k$ in order of increasing finish time.

Because $I^*$ finishes no later than any interval, it finishes no later than $O_1$ does:

$$
e_{I^*} \le e_{O_1}.
$$

If $I^* = O_1$, the schedule already contains $I^*$ and there is nothing to prove. Otherwise, consider the schedule

$$
O' = \{I^*\} \cup \{O_2, O_3, \ldots, O_k\}.
$$

The intervals $O_2, \ldots, O_k$ are pairwise compatible, since they were compatible inside $O$. The interval $I^*$ is compatible with each of them: for every $j \ge 2$, the intervals of a schedule are ordered so that $s_{O_j} \ge e_{O_{j-1}}$, and therefore

$$
s_{O_j} \ge e_{O_{j-1}} \ge e_{O_1} \ge e_{I^*},
$$

where the middle inequality holds because the finish times increase along the schedule and the last holds because $e_{I^{\star}} \le e\_{O_1}$. So $I^{\star}$ ends before each of $O_2, \ldots, O_k$ begins, and $O'$ is a schedule.

The schedule $O'$ has exactly $k$ intervals, and $k$ is the size of an optimal schedule, so $O'$ is optimal. It contains $I^{\star}$. Therefore an optimal schedule containing $I^{\star}$ exists. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The greedy algorithm is optimal, by induction on the number of available
intervals.

If there are no available intervals, the greedy algorithm returns the empty schedule, which is trivially optimal.

Otherwise, let $I^{\star}$ be the available interval with the earliest finish time. By the exchange lemma there is an optimal schedule $O$ that contains $I^{\star}$. Every other interval of $O$ starts at or after $e_{I^{\star}}$, so the intervals of $O$ other than $I^{\star}$ form a schedule of the sub-problem consisting of the intervals that start at or after $e_{I^*}$.

That sub-problem has fewer available intervals than the original, so by the induction hypothesis the greedy algorithm applied to it produces an optimal schedule of it. The greedy algorithm takes $I^{\star}$ first, because $I^{\star}$ is the compatible interval with the earliest finish time, and then proceeds on exactly that sub-problem. Its schedule therefore has $1 + \text{(the size of the optimal schedule of the sub-problem)}$ intervals, which is the size of the optimal schedule $O$.

Therefore the greedy algorithm is optimal. $\square$
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Two intervals $I = [s_I, e_I)$ and $J = [s_J, e_J)$ are compatible if and
only if $s_J \ge e_I$ or $s_I \ge e_J$.
</MathPanel>

The lemma is what the "one ends exactly when the next begins" convention rests on. A talk that starts exactly when the previous one ends is allowed, and the implementation uses `start >= free_time` rather than `start > free_time`.

## Complexity analysis

**Time: $O(n \log n)$**, dominated by the sort by finish time. The scan itself is $O(n)$, because every interval is examined once and the pointer never moves backwards.

**Time: $O(n)$** when the intervals are already sorted by finish time, which is the case when they are generated in that order.

**Auxiliary space: $O(n)$** for the sorted array, or $O(1)$ extra space beyond the input if the sort is done in place.

<MathPanel type="complexity" title="Complexity">
Interval scheduling: $O(n \log n)$ time for the sort and $O(n)$ for the
scan, so $O(n \log n)$ in total. $O(n)$ space for the sorted intervals, or
$O(1)$ extra space with an in-place sort.
</MathPanel>

The sort dominates, and that is worth remembering when the time limit is tight. When the intervals arrive in order of start time, one can avoid the sort by keeping a small heap of the intervals currently in progress, and the algorithm becomes $O(n \log n)$ with a smaller constant, or $O(n)$ if a counting arrangement on the time axis is possible.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One room, maximize the number of intervals | Earliest finish time |
| One room, maximize the total value of the intervals | Weighted interval scheduling, a dynamic program |
| One room, minimize the number of rooms needed | Sort by start time and sweep with a heap of finish times |
| $k$ rooms, assign every interval to a room | A maximum matching, or a flow network |
| Intervals arrive one at a time, accept or reject each | An online variant, which needs a different argument |
| Maximize the number of jobs on one machine with deadlines | Sort by deadline and use a disjoint set union to assign the latest free slot |
| One camera, intervals on a circle | Cut the circle at a chosen point and run the same algorithm |
| Maximize the number of non-overlapping intervals, each worth $v_i$ | A dynamic program over the sorted finish times |

The second row is the one that catches people, because the weighted problem looks exactly like the unweighted one and the greedy rule does not work on it. A short interval of high value and a long interval of low value trade against each other, and the earliest-finish rule resolves the trade in favor of the short interval regardless of the value.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sorting by start time instead of finish time | The cursor is left too far right and intervals are lost | Sort by finish time |
| Choosing the shortest interval | A long interval is chosen instead of a short one that ends earlier | Sort by finish time |
| Choosing the interval with the largest value | The answer is not even optimal for the unweighted problem | Sort by finish time |
| Using `start > free_time` instead of `start >= free_time` | An interval that begins exactly when the previous ends is dropped | Use `>=` |
| Treating the intervals as closed | Two intervals that touch at one point are treated as overlapping | Use half-open intervals |
| Forgetting that the greedy rule needs equal weights | A weighted problem is solved by the wrong algorithm | Check whether the intervals have values |
| Assuming the greedy rule works for $k$ rooms | The answer is wrong and no obvious reason shows | Use matching or a flow network |
| Scanning the sorted list from the beginning after each choice | The algorithm becomes $O(n^2)$ | Keep one pointer that only moves forward |

### Why this fails: the shortest interval that is not the earliest finish

The mistake that survives review most often is sorting by length. It is a reasonable-sounding rule: a short interval uses up the least room, so it ought to leave the most room for the others.

The smallest counterexample has three intervals.

| Interval | Start | End | Length |
| -------- | ----- | --- | ------ |
| A        | 10    | 11  | 1      |
| B        | 1     | 5   | 4      |
| C        | 5     | 11  | 6      |

The correct answer is 2.

- **Earliest finish first.** The earliest finish is B, which ends at 5. Take B. The free time is 5. The next interval with the earliest finish that starts at or after 5 is C, which starts at 5 and ends at 11. Take C. The free time is 11. Interval A starts at 10, which is before 11, so it is skipped. The schedule is B and C, with 2 intervals.
- **Shortest first.** A is the shortest, with length 1. Take A. The free time is 11. Neither B nor C starts at or after 11, so nothing else can be taken. The schedule is A alone, with 1 interval.

The shortest-interval rule returns 1 where the correct answer is 2. Note that A is not even the earliest-finishing interval; it is the latest-finishing one. Sorting by length says nothing at all about where the interval sits on the timeline, and the position is what determines what can follow.

Two intervals are never enough to break the rule, and that is worth seeing. With two intervals, either they are compatible, in which case both rules take both, or they overlap, in which case both rules take exactly one. So three intervals is the smallest counterexample, and this one is it.

There is a second failure with the same root, and it is the one that matters in practice: the rule only works because every interval is worth one. The family

| Interval | Start | End | Value |
| -------- | ----- | --- | ----- |
| A        | 0     | 10  | 100   |
| B        | 0     | 3   | 1     |
| C        | 3     | 6   | 1     |

has an unweighted optimum of 2, which the greedy rule finds by taking B and C. Its weighted optimum is 100, by taking A alone. A greedy rule that maximizes the count has failed on the weighted problem, and the two problems differ by a single word in the statement.

## Variants and extensions

- **Weighted interval scheduling.** Give each interval a value and maximize the total. The greedy rule fails, and the replacement is a dynamic program over the intervals sorted by finish time, with a binary search for the last compatible interval. The state is one number per interval.
- **The $k$-room version.** When $k$ rooms are available, the assignment of intervals to rooms is a maximum matching in an interval graph, and the greedy rule does not extend. The standard construction is a flow network with one node per interval and one node per room.
- **The minimum number of rooms.** Here the greedy rule does work, but it is a different rule: sort by start time and keep a heap of the finish times of the rooms currently in use. The number of rooms is the maximum size of the heap.
- **The earliest start time rule.** Taking the interval that starts earliest is wrong, and it fails for a reason that is worth stating separately: an interval that starts earliest may end latest. The counterexample is a single long interval that starts at 0 and ends at 100, together with many short intervals that start at 1.
- **The latest start time rule for profit maximization.** When each job has a deadline and a profit, the right greedy rule is to take the job with the latest start time among those that fit the current slot, which is the mirror image of the earliest-finish rule.
- **The circle.** For a circular timeline, cut the circle at each candidate point and run the algorithm; the best result over all cuts is the answer.
- **The online version.** When the intervals arrive one at a time and each must be accepted or rejected immediately, the greedy rule is no longer optimal, and the standard counterexample has four intervals.
- **The unrelated-machines version.** When the intervals can be assigned to any of several machines with different speeds, the problem stops being a greedy problem entirely.
- **The connection to the knapsack.** The weighted version and the 0/1 knapsack are the same shape of computation: a state per item, and a decision between taking the item and skipping it. The [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) article develops that shape in full.

## Contest strategy

Under contest pressure, the errors above are what cost points, and the rule can be applied with a fixed procedure.

1. Check that every interval is worth the same. If the intervals have values, stop: the greedy rule is wrong and a dynamic program is needed.
2. Check that at most one interval can be active at a time. If there are $k$ resources, the problem is a matching, not a greedy sweep.
3. Sort by finish time, and write the comparison in the code as `end` and not as `end - start`.
4. Use `start >= free_time`, and decide the convention on touching intervals once.
5. Initialize the free time to the smallest possible start, or to negative infinity, and not to zero, unless the statement says the day starts at zero.
6. Test three inputs by hand: one interval, two overlapping intervals, and two intervals that touch exactly at one point.

## Worked problems

### Problem 1: the single lecture hall

**Restatement.** $n$ talks have start and end times. One hall is available. Maximize the number of talks scheduled, with a talk allowed to start exactly when the previous one ends. Constraints: $1 \le n \le 500\,000$.

**Naive baseline.** Enumerate the subsets, at a cost of $O(n 2^n)$.

**Insight.** The earliest-finishing interval leaves the most room behind it, so the greedy choice costs nothing.

**Derivation.** Sort the talks by end time. Scan them with a free-time variable, and take a talk whenever its start is at or after the free time, then set the free time to that talk's end.

**Correctness.** The exchange argument shows that an optimal schedule exists that contains the greedy choice, and the induction in the second proof shows the whole schedule is optimal.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, dominated by the sort.

**Common wrong approach.** Sorting by the length of each talk. The counterexample in the "Why this fails" section loses an interval.

### Problem 2: the minimum number of meeting rooms

**Restatement.** $n$ interviews have start and end times. Report the smallest number of rooms that can hold all of them. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Try each number of rooms from 1 upward, which is $O(n^2)$ at best.

**Insight.** The answer is the largest number of interviews that overlap at one moment, and the events that start a meeting are counted with a sweep.

**Derivation.** Sort the interviews by start time and sweep with a heap of the finish times of the interviews currently in progress. For each interview, remove the finish times that are at or before its start, push its own finish time, and record the size of the heap. The answer is the largest size seen.

**Correctness.** At the moment the heap has $k$ entries, there are $k$ interviews in progress, so $k$ rooms are necessary. The intervals that are removed have already ended, so a room is free for the new interview. The maximum size of the heap is therefore both necessary and sufficient.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Reusing the earliest-finish rule and counting how many times the free time has to be pushed forward. That counts the number of interviews in a maximal schedule, which is not the number of rooms.

### Problem 3: the interview room with the most interviews

**Restatement.** $n$ interviews have start and end times, and $k$ rooms are available. Assign every interview to a room so that no two interviews in a room overlap, and report the largest number of interviews that can be scheduled. Constraints: $1 \le n \le 10^5$, $1 \le k \le 100$.

**Naive baseline.** Assign the interviews greedily to the room that frees up first, which is $O(n \log k)$ and is not always optimal.

**Insight.** The problem is a maximum bipartite matching, and the graph is an interval graph, so the matching can be found by a sweep.

**Derivation.** Sort the interviews by start time. Assign each one to the room whose current occupant ends at or before its start, choosing the room that ends latest among those that qualify. If no room qualifies, the interview is dropped.

**Correctness.** The exchange argument for the assignment to a single room extends to $k$ rooms by treating the $k$ rooms as $k$ copies of the single-room problem and arguing that the choice of the room that ends latest leaves the most flexibility.

**Complexity.** $O(n \log k)$ time and $O(k)$ space.

**Common wrong approach.** Believing that the earliest-finish greedy rule extends to $k$ rooms. It does not, and the failure appears as soon as $k \ge 2$ and the intervals are arranged so that a different assignment schedules more interviews.

## Practice progression

1. **Recognition.** Given a statement, decide whether interval scheduling applies. Look for intervals, a single resource, and equal weights, and check the weight condition first.
2. **Direct application.** Implement the sort by finish time and the scan, and verify it against a brute-force enumeration on random small inputs.
3. **Adaptation.** Implement the minimum-room version with a heap, and the circle version by trying every cut point.
4. **Combination.** Combine the greedy rule with a binary search to find the last compatible interval, which is the inner step of the weighted version, and with a disjoint set union to assign jobs to slots.
5. **Challenge.** Solve the weighted version, discover that the greedy rule fails, and replace it with the dynamic program, then compare the two on the unweighted version to see what the greedy rule was doing.
6. **Transfer.** Recognize the same shape in a scheduling problem that is not about intervals: choosing the order of jobs on one machine, and choosing which pages to evict from a cache.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the greedy rule in one sentence, and say which end of the interval it sorts on. (Key insight)
2. What is the exchange lemma, and what does it guarantee? (Formal model)
3. Why does replacing the first interval of an optimal schedule with the earliest-finishing interval preserve the rest of the schedule? (Correctness proof)
4. Give the smallest counterexample to the shortest-interval rule, and the answer it produces. (Common mistakes)
5. Why does the greedy rule need every interval to be worth the same? (Algorithm selection)
6. How many intervals does the greedy algorithm choose in the worked example, and which? (Step-by-step execution)
7. What is the time bound, and which part of it is the sort? (Complexity analysis)
8. Why is the comparison `start >= free_time` rather than `start > free_time`? (Common mistakes)
9. What is the minimum number of rooms problem, and why does it need a different rule? (Variants and extensions)
10. Which dynamic program replaces the greedy rule when the intervals have values? (Variants and extensions)
11. Why is the pointer in the scan never moved backwards? (Algorithm derivation)
12. How does the two-pointer technique relate to the scan? (Further reading)

## Further reading

- The technique that solves the same problem with values attached to the intervals is a dynamic program, and its shape is developed in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The other half of the family, where the same greedy rule solves a different question, is the [two pointers](/algorithms/searching/two-pointers) scan over intervals sorted by finish time.
- The window technique that solves a related "longest stretch" problem is in [sliding window](/algorithms/searching/sliding-window).
- The structure used to assign jobs to slots is the [disjoint set union](/algorithms/graphs/dsu).
- The search that finds the last compatible interval is [binary search](/algorithms/searching/binary-search).
- The running totals that answer a different question about the same intervals are in [prefix sums](/algorithms/arrays/prefix-sums).
