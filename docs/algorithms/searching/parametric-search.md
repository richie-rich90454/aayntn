---
id: searching.parametric-search
title: Parametric search
summary: Search the parameter of a family of instances instead of the data, using a monotone predicate to locate the boundary where the family changes from feasible to infeasible.
division: [gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords:
    [
        parametric search,
        binary search on answer,
        monotone predicate,
        capped sum,
        feasibility check,
        water level,
    ]
prerequisites:
    required: [searching.binary-search, foundations.complexity]
    recommended: [searching.two-pointers]
complexity:
    time: "O(n log U)"
    space: "O(1)"
assumptions:
    - The parameter is an integer level in the closed range from 0 to the largest value.
    - Every value and the budget are nonnegative.
    - The capped sum is nondecreasing in the level, so feasibility is a prefix.
implementations: searching.parametric-search
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find the largest level $x \in [0, \max_i a_i]$ such that the capped sum $\sum_i \min(a_i, x)$ is at most a budget $T$ |
| **Time** | $O(n \log U)$, where $U = \max_i a_i$ |
| **Auxiliary space** | $O(1)$ beyond the input |
| **Requires** | A one-dimensional parameter, a monotone predicate, and an exact decision procedure |
| **Fails when** | The predicate is not monotone, the check is not exact, or the answer range is not bounded |
| **Primary technique** | Binary search over the parameter, with a whole-data check at every step |
| **Implementations** | Six languages, one program each, sharing a stdin/stdout contract |

The problem is not to find a value in the array. It is to find the point where a family of instances stops being feasible, and that point is found by halving the parameter rather than the data.

## Problem motivation

Many contest problems hide the same shape. A shop caps the price of each item at a level $x$, and the total bill is the sum of the capped prices. A poison of duration $x$ is refreshed by every attack, so the total damage is one full duration plus the capped sum of the gaps between attacks.

In each case the input is a fixed array $a_0, \ldots, a_{n-1}$, the question introduces one number $x$, and the quantity that matters is

$$
F(x) = \sum_{i=0}^{n-1} \min(a_i, x).
$$

The task is to find the largest $x$ in the level range for which $F(x) \le T$, where $T$ is a budget.

The constraints make the naive scan fail. With $n = 2 \cdot 10^5$ values up to $10^9$, the level ranges over a billion candidates, and evaluating $F$ at every one costs about $2 \cdot 10^{14}$ operations. The array is not sorted, so an ordinary binary search over the data does not apply. What is cheap is the **decision** "is $F(x) \le T$?" for one fixed $x$: it is a single pass over the array.

That split is the whole technique. The optimization is hard, the decision is easy, and the decision's truth value changes only once as $x$ moves in one direction. The search finds the boundary between the two directions.

The level is considered in the closed range from $0$ to $U = \max_i a_i$. Above $U$ every term is already capped at $a_i$, so $F$ no longer changes and no level is larger than another in any meaningful sense. The programs report $U$ when the budget covers the whole array; the alternative would be to report an unbounded answer.

## Recognition patterns

Parametric search is the right tool when all of the following hold.

- The answer is a **single number** $x$ in a known range, not an index, a pair, or a subset.
- The question can be phrased as a **decision procedure**: "is this candidate feasible?"
- The decision is **monotone**: if a candidate is feasible, every candidate on one side of it is feasible too, or the reverse.
- The decision is **exact**: it returns true for every feasible candidate and false for every infeasible one.
- The range is **large enough that a scan is too slow**, but small enough that its logarithm is manageable, which is true for essentially every 64-bit range.

The third condition is the one that is usually missing. A predicate that is true for some candidates, false for others, and true again has no boundary, and halving it discards the answer.

The phrases that signal the technique are "the largest $x$ such that", "the smallest capacity", "the minimum number of rounds", "the least time", and "can it be done with $k$?". The phrases that rule it out are "the number of ways" (a count rather than a decision), "the longest subarray" (a window problem), and "the shortest path" (a graph algorithm).

| Constraint | What it rules |
| --- | --- |
| The answer range is at most about $10^6$ | A linear scan of the range may be acceptable when the check is cheap |
| The answer range is at most about $10^{18}$ | The scan is fatal, and the search is required |
| One check costs $O(n)$ | The total is $O(n \log R)$, which is comfortable |
| One check costs $O(n^2)$ | The total is $O(n^2 \log R)$, and the check needs improving |
| The predicate is monotone in the candidate | The technique applies |
| The predicate is true only for isolated candidates | The technique does not apply |

The last two rows are the entire content of the technique. Everything else is bookkeeping.

<Synonyms terms="parametric search, binary search on the answer, search the answer, monotone feasibility, boundary search" />

## Naive approach

The baseline scans the level from $0$ upward and returns the last feasible candidate.

```python
def largest_level(values, budget):
    best = 0
    for level in range(max(values) + 1):
        total = sum(min(value, level) for value in values)
        if total <= budget:
            best = level
        else:
            break
    return best
```

The scan is correct, and it is $O(n \cdot U)$. For $n = 2 \cdot 10^5$ and $U = 10^9$ it performs about $2 \cdot 10^{14}$ additions, which no contest time limit allows.

The scan is still useful. It is short enough to be obviously correct, and it is the reference implementation for a differential test: run the scan and the search on the same small random input. A disagreement is a counterexample, and the scan is usually the one that is right.

There is also a direct solution for this particular array, which sorts the values and uses prefix sums to compute the crossing in $O(n \log n)$. That solution is discussed in the algorithm selection section. It is faster than the search when the predicate has the cap-sum form, but it does not generalize to a check that is an opaque simulation, which is the reason the technique exists.

## Key insight

The insight is that **"is $x$ good enough?" is easier than "what is the best $x$?"**, and the two questions are connected by monotonicity.

Define the decision predicate

$$
P(x) = \bigl(F(x) \le T\bigr).
$$

Because every term $\min(a_i, x)$ is nondecreasing in $x$, the sum $F(x)$ is nondecreasing, so $P$ has the shape

$$
P(0) = \text{true}, \qquad P(1) = \text{true}, \qquad \ldots, \qquad P(x^{\ast}) = \text{true}, \qquad P(x^{\ast}+1) = \text{false}.
$$

The feasible candidates form a **prefix**, and the answer is the last element of that prefix. Finding the last true value of a monotone predicate is exactly the boundary search that ordinary binary search performs.

The parameterization is what makes the technique more general than a search over a sorted array. Each candidate $x$ defines a different **instance** of the problem: the same array, with every value capped at $x$. The predicate asks whether that instance fits the budget. Raising $x$ can only raise the instance's cost, so the family is monotone even though the array has no order at all.

This framing is why the pattern is called parametric search: the input is a family of instances indexed by the parameter, and the question is where the family crosses a threshold. Binary search on the answer is the common special case in which the parameter is the quantity being optimized.

The recipe has three separate pieces, and each must be correct on its own.

1. **The parameter and its range.** The answer is a number, and there are known lower and upper bounds on it.
2. **The decision procedure.** Given a candidate, it returns whether that candidate is acceptable, and it is exact.
3. **The search.** It assumes only that the decision is monotone, and it finds the boundary.

The search is inherited from binary search and is not where the difficulty lies. The difficulty is always in the decision procedure, and in whether it is exact and monotone.

## Visual intuition

Draw the level $x$ on the horizontal axis and the capped sum $F(x)$ on the vertical axis.

The graph starts at the origin. While $x$ is below every value, each term contributes $x$, so the graph is a straight line of slope $n$. When $x$ passes a value $a_i$, that term stops growing, and the slope drops by one. The graph is therefore a concave polyline: it rises quickly at first, then more slowly, and it becomes flat at $x = U$.

The budget $T$ is a horizontal line. The answer is the largest integer $x$ at which the polyline is at or below that line. If the line is above the flat part, every level in the range is feasible, and the answer is $U$; that is the clamping rule from the problem statement.

The same picture has a second reading. Draw the values as vertical bars of heights $a_i$ and draw a horizontal water line at height $x$. The capped sum is the total shaded area below the line: each bar contributes its full height if it is shorter than the line, and the line's height otherwise. Raising the line by one unit adds one unit of area for every bar that is still above the line, which is why the slope is the count of tall bars.

The halving keeps a window $[lo, hi]$ of candidates around the crossing. The midpoint is the current water line. If its area fits the budget, the crossing is at or above it, so the window moves up. If its area does not fit, the crossing is below it, so the window moves down. Every step discards the half that provably cannot contain the answer.

## Formal model

Let $A = (a_0, \ldots, a_{n-1})$ be a finite sequence of nonnegative integers, and let $T$ be a nonnegative integer budget. Let $U = \max_i a_i$, with $U = 0$ when the sequence is empty.

::: math definition Definition
The **capped sum** of $A$ at level $x$ is

$$
F(x) = \sum_{i=0}^{n-1} \min(a_i, x).
$$

A level $x$ is **feasible** when $F(x) \le T$. The **answer** is the largest feasible level in $[0, U]$.
:::

::: math definition Definition
A predicate $P$ on a totally ordered set is **monotone decreasing** when there is a boundary $b$ such that $P(x)$ is true for every $x < b$ and false for every $x \ge b$. The boundary is the first false value; a monotone increasing predicate has the two truth values exchanged.
:::

::: math lemma Lemma
For every integer $x \ge 0$, $F(x+1) - F(x) = \bigl|\{\, i : a_i \ge x+1 \,\}\bigr|$.
:::

::: math proof Proof
For one term, $\min(a_i, x+1) - \min(a_i, x)$ is $1$ when $a_i \ge x+1$ and $0$ otherwise. Summing over the terms counts exactly the indices that satisfy the condition. $\square$
:::

The lemma has two consequences. First, every increment is nonnegative, so $F$ is nondecreasing. Second, the increments can only decrease as $x$ grows, because the set $\{i : a_i \ge x+1\}$ shrinks. The capped sum is therefore not merely monotone; it is concave.

::: math lemma Lemma
The feasible levels of the capped-sum problem form a prefix of $[0, U]$. If $x$ is feasible and $y \le x$, then $y$ is feasible.
:::

::: math proof Proof
By the first lemma, $F$ is nondecreasing, so $F(y) \le F(x) \le T$. $\square$
:::

::: math invariant Invariant
The search maintains an inclusive window $[lo, hi]$ and two facts: $answer$ is feasible, and the largest feasible level in $[0, U]$, if it is not $answer$, lies in $[lo, hi]$. Every level below $lo$ has been decided, and every level above $hi$ is infeasible or outside $[0, U]$.
:::

The boundary is the first infeasible level, or $U+1$ when every level is feasible. The search never has to evaluate $F$ above $U$, because no level there changes the sum.

## Algorithm derivation

The bounds are $lo = 0$ and $hi = U$. The initial answer is $0$, which is always feasible because $F(0) = 0$ and $T \ge 0$.

At every iteration:

1. Compute $mid = lo + \lfloor (hi - lo)/2 \rfloor$.
2. Evaluate $F(mid)$.
3. If $F(mid) \le T$, then $mid$ is feasible, and by monotonicity every level at or below $mid$ is feasible too. Record $mid$ as the best answer so far and move the window up: $lo \gets mid + 1$.
4. Otherwise $mid$ is infeasible, and by monotonicity every level at or above $mid$ is infeasible too. Move the window down: $hi \gets mid - 1$.

The loop stops when $lo > hi$. The window is empty, so the recorded answer is the largest feasible level.

The update is asymmetric on purpose. The true branch moves past the midpoint, because the midpoint itself is a candidate answer and has already been recorded. The false branch also moves past the midpoint, because an infeasible midpoint can never be the answer. Both branches shrink the window by at least one element, and one of them usually halves it.

The midpoint is written as `lo + (hi - lo) / 2` rather than `(lo + hi) / 2`. The two agree for small values, but the second can overflow a signed integer when both bounds are large. Computing the difference first keeps every intermediate value within the range of the bounds.

There is an equivalent half-open formulation. Set $hi = U + 1$ as a sentinel, search for the first infeasible level, or the sentinel when every level is feasible, and return `lo - 1`. The loop is

```text
lo = 0, hi = U + 1
while lo < hi:
    mid = lo + (hi - lo) / 2
    if cost(mid) <= T: lo = mid + 1
    else:              hi = mid
return lo - 1
```

This form has one fewer variable, but it needs a sentinel that is one above the largest value. The inclusive form used by the implementations avoids that addition, which matters when the values can approach the limit of the integer type.

## Step-by-step execution

Take the array $[4, 9, 2, 7]$ and the budget $T = 12$. The largest value is $U = 9$, so the window starts at $[0, 9]$ and the recorded answer starts at $0$.

| Iteration | $lo$ | $hi$ | $mid$ | $F(mid)$             | Comparison  | Answer | Next window |
| --------- | ---- | ---- | ----- | -------------------- | ----------- | ------ | ----------- |
| 1         | 0    | 9    | 4     | $4 + 4 + 2 + 4 = 14$ | $14 > 12$   | 0      | $[0, 3]$    |
| 2         | 0    | 3    | 1     | $1 + 1 + 1 + 1 = 4$  | $4 \le 12$  | 1      | $[2, 3]$    |
| 3         | 2    | 3    | 2     | $2 + 2 + 2 + 2 = 8$  | $8 \le 12$  | 2      | $[3, 3]$    |
| 4         | 3    | 3    | 3     | $3 + 3 + 2 + 3 = 11$ | $11 \le 12$ | 3      | $[4, 3]$    |

The loop ends with an empty window, and the last recorded answer is $3$. The check is exact: $F(3) = 11$ fits, while $F(4) = 14$ does not, so $3$ is indeed the largest feasible level.

The trace also shows why the true branch records the midpoint. At iteration 4 the midpoint $3$ is feasible, and the window becomes empty immediately. Without the recorded answer the loop would have nothing to return.

A second trace with $T = 100$ exercises the clamping rule. The first midpoint is $4$, whose cost is $14$; the window moves to $[5, 9]$. The next midpoint is $7$, whose cost is $20$; the window moves to $[8, 9]$. The midpoint $8$ costs $21$, and the midpoint $9$ costs $22$. Every level is feasible, so the window empties above $9$ and the answer is $9 = U$. The budget is larger than the whole array's sum, and the reported level is the tallest value.

A third trace with $T = 0$ goes the other way. The midpoint $4$ costs $14$, then $1$ costs $4$, then $0$ costs $0$. The answer is $0$, which is the only level that spends nothing when every value is positive.

## Correctness proof

::: math theorem Theorem
If the decision procedure is exact and the feasible levels form a prefix of $[0, U]$, the search returns the largest feasible level.
:::

::: math proof Proof
The invariant has two parts: the recorded answer is feasible, and the true answer lies in the window $[lo, hi]$ unless it has already been recorded.

Initially, the recorded answer is $0$, and $F(0) = 0 \le T$ because the budget is nonnegative. The window is $[0, U]$, which contains every candidate, so the invariant holds.

Suppose the invariant holds at the start of an iteration, and let $mid$ be the midpoint.

- If $F(mid) \le T$, then $mid$ is feasible. By monotonicity, every level below $mid$ is feasible as well, so no level below $mid$ can be a better answer than $mid$. The recorded answer is at most $mid$, so recording $mid$ can only improve it. The recorded answer becomes $mid$, and the remaining candidates are in $[mid+1, hi]$, which is the new window.
- If $F(mid) > T$, then $mid$ is infeasible. By monotonicity, every level above $mid$ is infeasible as well, so the answer cannot be at or above $mid$. The recorded answer is unchanged, and the remaining candidates are in $[lo, mid-1]$, which is the new window.

The invariant is preserved in both cases. The window strictly shrinks, so the loop terminates. When $lo > hi$, the window is empty, so the true answer cannot be an undecided candidate; it must be the recorded answer. Therefore the returned value is the largest feasible level. $\square$
:::

The proof uses the decision procedure as a black box. The only properties it needs are that the procedure is exact and that its truth value is monotone. The first property is checked by inspecting the code: the procedure computes the definition of $F$ term by term, so it cannot disagree with the definition. The second property is proved by the increment lemma.

::: math theorem Corollary
When $T \ge \sum_i a_i$, the search returns $U$, the largest value in the array.
:::

::: math proof Proof
For every $x \ge U$, every term is capped at $a_i$, so $F(x) = \sum_i a_i \le T$. Every candidate in $[0, U]$ is feasible, so every midpoint test records its midpoint and moves $lo$ above it. The window therefore ends with $lo = U + 1$ and the last recorded candidate is $U$. $\square$
:::

## Complexity analysis

Each iteration performs one pass over the array, so one check costs $O(n)$ time and $O(1)$ auxiliary space. The window has $U+1$ candidates and is halved at every iteration, so the number of checks is at most $\lceil \log_2(U+2) \rceil$.

- **Time:** $O(n \log U)$.
- **Auxiliary space:** $O(1)$ beyond the array.
- **Input storage:** $O(n)$, because every program must read and keep the values before it can check a level.

For $n = 2 \cdot 10^5$ and $U = 10^9$, the search performs at most $30$ checks and about $6 \cdot 10^6$ additions. That is comfortably inside a one-second limit in C, C++, and Java, and within a few seconds in Python.

::: math complexity Complexity
Parametric search on the capped sum: $O(n \log U)$ time and $O(1)$ auxiliary space. The product of the check cost and the number of checks is the quantity to watch; tightening either factor improves the whole solution.
:::

The early exit in the check does not change the worst case, but it helps when the budget is small. As soon as the running sum exceeds $T$, the answer for that candidate is known, and the remaining terms cannot change it.

The accumulator must be wide enough. With $n \le 2 \cdot 10^5$ and $a_i \le 10^9$, the full sum is at most $2 \cdot 10^{14}$, which fits in a signed 64-bit integer. The early exit keeps the partial sum at most $T + \max_i a_i$, so even a budget near $10^{18}$ cannot overflow a 64-bit accumulator whose values are bounded by $10^9$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The predicate is monotone and the check is an opaque procedure | The search in this article |
| The predicate is a capped sum and the values can be sorted | Sort and use prefix sums for an $O(n \log n)$ direct solution |
| The answer is one of a known sorted list of candidates | Binary search the candidate list, not the integer range |
| The predicate is monotone but the answer is real | Binary search the real interval for a fixed number of iterations |
| The objective is unimodal rather than feasible/infeasible | Ternary search |
| The check is not monotone | Enumerate, or reformulate the decision |
| There are many queries over the same data | Parallel binary search |
| The parameter is multi-dimensional | Nested search, or a different technique |
| A direct greedy or formula solves the problem exactly | Use the direct method |

The second row deserves emphasis. For the cap-sum predicate specifically, sorting the array and building prefix sums removes the logarithmic factor over the value range. Once the values are sorted as $b_0 \le b_1 \le \cdots \le b_{n-1}$, the sum at a level between $b_{k-1}$ and $b_k$ is the prefix sum of the first $k$ values plus $(n-k)x$. The crossing can be located by scanning the sorted values once. That is $O(n \log n)$ overall and is asymptotically better than $O(n \log U)$ when $U$ is large.

The search remains the right answer when the check has no such structure. If the decision procedure is a simulation, a greedy, a graph traversal, or a dynamic program, there is no sorted form to exploit, and the generic $O(c \log U)$ bound is the best available. The technique is valuable precisely because it does not need to know what the check does.

The third row is a common practical improvement. If the problem guarantees that the answer is one of the input values, sorting the distinct values and binary searching their indices reduces the number of checks from $\log U$ to $\log n$. Each check still costs $O(n)$, so the total is $O(n \log n)$ and no longer depends on the magnitude of the values.

## Reference implementations

The manifest lists six programs, one per language, all with the same contract.

| Language | File | Input | Output |
| --- | --- | --- | --- |
| C | `c/program.c` | $n$, then $n$ values, then $T$ | The largest feasible level |
| C++17 | `cpp17/program.cpp` | Same | Same |
| Java | `java/Main.java` | Same | Same |
| Python | `python/program.py` | Same | Same |
| Pascal | `pascal/program.pas` | Same | Same |
| JavaScript | `javascript/program.js` | Same | Same |

The contract is: the first token is $n$; the next $n$ tokens are the values, whitespace-separated; the final token is the budget $T$. The output is one integer followed by a newline. The answer is in $[0, U]$, and a budget that covers the whole array produces $U$.

The C, C++, and Java programs use 64-bit integers for the values, the budget, and the accumulator. Python integers are unbounded. JavaScript numbers represent every integer up to $2^{53}$ exactly. Every running sum is at most $2 \cdot 10^{14}$, and a budget above that is effectively infinite for the comparison, so the decision is exact. The Pascal listings use `Int64`; the compiler available in this repository represents `Int64` as a JavaScript number, and the same bound keeps every running sum exact.

The JavaScript and Pascal listings are educational references, not USACO submission languages, and their file headers say so. The manifest marks all six as unverified; the three cases in the fixture file are the ones they are expected to reproduce.

## Recursion decision

The search is a loop. A recursive form would recurse once per halving, so its depth is at most $\lceil \log_2(U+2) \rceil$, which is about $30$ for $U \le 10^9$ and at most $60$ for a 64-bit range. That depth is safe in every language, but the recursion adds frames and makes the interval state harder to inspect, so there is no reason to use it.

The real recursion risk is in the **check**. A check written as a recursive traversal of the array has depth $O(n)$, and with $n = 2 \cdot 10^5$ it can exhaust the stack in Java or Python. Python's default recursion limit is $1000$, so a recursive check fails long before the array is large. Write the check as a loop over the values.

| Language   | Practical recursion depth                | Recommendation for the search          |
| ---------- | ---------------------------------------- | -------------------------------------- |
| C and C++  | About $10^5$ frames with the usual stack | The loop; a depth of $60$ is also safe |
| Java       | About $10^4$ frames                      | The loop                               |
| Python     | $1000$ frames by default                 | The loop, and an iterative check       |
| Pascal     | Depends on the host                      | The loop                               |
| JavaScript | About $10^4$ frames                      | The loop                               |

The table is about the search only. The check is the part that scales with the input, and it must be iterative in every language.

## Implementation walkthrough

The two pieces are the check and the loop.

```c
static int feasible(const long long a[], int n, long long x, long long budget)
{
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        total += a[i] < x ? a[i] : x;
        if (total > budget) {
            return 0;
        }
    }
    return 1;
}
```

The check writes `a[i] < x ? a[i] : x` instead of calling a `min` function. The conditional is the definition of the cap, it needs no header, and it makes the two cases visible. The early return does not change the asymptotic bound, but it skips the rest of the array as soon as the budget is exceeded.

The loop is short.

```c
long long lo = 0;
long long hi = max_value;
long long answer = 0;

while (lo <= hi) {
    long long mid = lo + (hi - lo) / 2;
    if (feasible(a, n, mid, budget)) {
        answer = mid;
        lo = mid + 1;
    } else {
        hi = mid - 1;
    }
}
printf("%lld\n", answer);
```

Three details are worth checking before submitting.

1. **The initial answer is $0$, not $-1$.** Level $0$ is always feasible because $F(0) = 0$ and the budget is nonnegative. The answer can never be negative.
2. **The bounds are inclusive.** `hi` starts at the largest value, not one above it, so `max_value + 1` never has to be represented. This matters when the values are near the limit of the integer type.
3. **The true branch records the midpoint before moving.** Setting `lo = mid` instead without recording would loop forever when the window has length one.

The input side is equally important. Read $n$ first, then exactly $n$ values, then the budget. If the budget is read as part of the array, the check runs on a truncated array and returns a plausible but wrong answer. The programs in this article read the budget as a separate final token and print $0$ when $n \le 0$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| The check ignores the cap | Tall values are undercounted and the answer is far too large | Compute $\min(a_i, x)$ for every value |
| The check counts only the values at most the level | Values above the level are ignored instead of contributing $x$ | Add the capped contribution of every value |
| The predicate is not monotone | The halving can discard the answer | Prove that raising $x$ never lowers the cost |
| The true branch sets `lo = mid` | Infinite loop when the window has length one | Record `mid`, then set `lo = mid + 1` |
| The false branch sets `hi = mid` | Infinite loop for the same reason | Set `hi = mid - 1` |
| The midpoint is `(lo + hi) / 2` | Overflow on large bounds | Compute `lo + (hi - lo) / 2` |
| The accumulator is 32-bit | Overflow before the comparison | Use 64-bit integers for values and sums |
| The upper bound is the largest value but the budget is huge | The answer is clamped at the wrong place | Use the problem's bound and state the clamping rule |
| The half-open form returns `lo` instead of `lo - 1` | Every answer is one too large | Return the last feasible level, not the first infeasible one |
| The check sorts at every iteration | The total becomes $O(n \log n \log U)$ and may exceed the limit | Sort once outside the loop, or keep the check linear |

### Why this fails: a check that drops the cap

Suppose the check counts only the values that are at most the level:

$$
G(x) = \sum_{i : a_i \le x} a_i.
$$

This predicate is monotone, so the search runs without complaint. It is still wrong, because it forgets that every value above the level contributes $x$, not zero.

Take $A = [1, 100]$ and $T = 10$. The correct costs are

$$
F(0) = 0, \quad F(1) = 2, \quad F(5) = 6, \quad F(9) = 10, \quad F(10) = 11, \quad F(100) = 101.
$$

The correct answer is $9$. The wrong check gives $G(x) = 1$ for $1 \le x \le 99$ and $G(100) = 101$, so every level below $100$ passes the budget. The search returns $99$, which is eleven times the correct answer and is not even close to the crossing.

The failure is not an off-by-one. The check is monotone, and the halving is correct for the predicate that the check implements. The predicate is simply not the one the problem asked for. That is why the check has to be verified against the definition, not only against the monotonicity condition.

A second failure is a check that changes direction. The capped sum is a **prefix** predicate: small levels are feasible and large levels are not. If the problem asks for the smallest level at which some quantity reaches a target, the feasible set is a **suffix** instead. The same loop update then searches for the wrong boundary. Decide which side is feasible before writing the comparison, and keep that choice visible in the variable names.

## Variants and extensions

- **The first-false form.** Search for the first infeasible level with a half-open interval and return one less. It is the same algorithm with an implicit sentinel, and it has the same shape as `std::lower_bound`.
- **A discrete candidate set.** When the answer must be one of the input values, sort and deduplicate them, then binary search the indices. The check still costs $O(n)$, so the total becomes $O(n \log n)$.
- **A real parameter.** If $x$ is a real number, run a fixed number of iterations instead of waiting for the interval to become empty. With a cap-sum check, the function is continuous, so a tolerance of $10^{-6}$ is enough for most judges.
- **A prefix-sum check.** Sort the values once, build prefix sums, and evaluate $F(x)$ with one binary search over the sorted values. The check drops from $O(n)$ to $O(\log n)$, and the total becomes $O(n \log n + \log U \log n)$.
- **Parallel binary search.** When many queries share the same data, batch the checks so that each distinct midpoint is evaluated once. This is the extension used by offline dynamic-connectivity and range problems, and it is described in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- **A penalty parameter.** The Lagrangian or aliens trick binary searches a price per unit rather than a level. The decision procedure is an unconstrained optimization, and the monotonicity is in the sign of the subgradient of the dual. It is the same halving idea applied to a different parameter.
- **Megiddo's parametric search.** In the research literature, parametric search finds the value at which an algorithm's combinatorial structure changes, without testing every candidate, by running a parallel decision algorithm symbolically. That technique is much stronger and much less common in contests than the numeric boundary search described here. The contest usage of the name refers to the binary search over a parameter.

## Contest strategy

Under contest pressure, the errors above are what cost points, and each is avoidable with a fixed procedure.

1. **Name the parameter and its range.** Write down the smallest and largest possible answers before writing any code.
2. **Write the predicate in words.** "Is the capped sum at level $x$ at most $T$?" Then write the formula.
3. **Prove monotonicity in one sentence.** "If $x$ is feasible, every smaller level is feasible because every term $\min(a_i, x)$ is nondecreasing."
4. **Prove the check is exact.** Test it on a tiny array by hand, especially a value above the level.
5. **Choose the boundary convention.** Last true or first false, inclusive or half-open. Keep the choice consistent in the initialization, the updates, and the return value.
6. **Check the width of every accumulator.** The sum, the product, and the midpoint are the three usual overflow sites.
7. **Test the extremes.** $x = 0$, $x = U$, $T = 0$, a budget that covers everything, a single element, and all values equal.
8. **Compare with the scan on small random inputs.** The scan is short enough to trust, and a disagreement localizes the bug.

## Worked problems

### Problem 1: Poisoned Dagger

**Restatement.** A dragon has $h$ hit points. Monocarp attacks at times $a_1 < a_2 < \cdots < a_n$. A poison of duration $k$ starts at each attack, deals one damage per second, and is refreshed by the next attack. Find the smallest $k$ that deals at least $h$ damage.

**Constraints.** $n \le 100$, $h \le 10^{18}$, and $a_i \le 10^9$. The number of test cases is at most $1000$.

**Naive baseline.** Simulate the battle second by second. The battle lasts $100^{500}$ seconds in the story and at least $h$ seconds in the worst case, so the simulation is hopeless.

**Insight.** The last attack contributes $k$ seconds of poison. Each earlier attack contributes $\min(k, a_{i+1} - a_i)$ seconds, because its poison either expires first or is refreshed first.

**Derivation.** Define

$$
D(k) = k + \sum_{i=1}^{n-1} \min(k, a_{i+1} - a_i).
$$

Every term is nondecreasing in $k$, so $D$ is nondecreasing. Binary search the smallest $k$ with $D(k) \ge h$, between $1$ and $h$. This is the same boundary search as the article, with the predicate reversed: the acceptable set is a suffix because a longer poison never deals less damage.

**Correctness.** The damage formula partitions the timeline at the attacks, and each interval is covered for either its full length or the poison duration, whichever is smaller. The sum is exact. The monotonicity follows term by term.

**Complexity.** $O(n \log h)$ per test case, with $O(1)$ auxiliary space.

**Common wrong approach.** Setting $k = \lceil h/n \rceil$ assumes every attack deals its full duration. When the attacks are close together, the poison is refreshed before it expires, and the estimate is too small. The check must use the gaps.

### Problem 2: Building an Aquarium

**Restatement.** There are $n$ coral columns of heights $a_i$. Build a tank of height $h$ and fill it until every column is submerged or the water reaches $h$. The water used is the sum of $\max(0, h - a_i)$. Given a budget $x$, find the largest possible $h$.

**Constraints.** The sum of $n$ over all test cases is at most $2 \cdot 10^5$, $a_i \le 10^9$, and $x \le 10^9$.

**Naive baseline.** Scan $h$ from $1$ upward and compute the water at every height. The answer can reach $2 \cdot 10^9$, so the scan is too slow.

**Insight.** The water used is nondecreasing in $h$, because raising the tank can only add water above the columns. The largest affordable height is therefore a boundary search.

**Derivation.** Define

$$
W(h) = \sum_{i=0}^{n-1} \max(0, h - a_i).
$$

Binary search the largest $h$ with $W(h) \le x$. The lower bound is $1$. A safe upper bound is $\max_i a_i + x + 1$: at that height the water is $n(\max_i a_i + x + 1) - \sum_i a_i$, which is at least $n(x+1) > x$, so the bound is infeasible. The check is one pass over the columns.

**Correctness.** For a fixed $h$, each column contributes exactly the water above it, and the sum is the total. The monotonicity follows because every term is nondecreasing in $h$.

**Complexity.** $O(n \log(\max a + x))$ time per test case and $O(n)$ space for the columns.

**Common wrong approach.** Assuming that $h$ cannot exceed the tallest column. The sample with one column of height $1$ and a budget of $10^9$ has answer $10^9 + 1$, which is far above the maximum column. The bound must include the budget.

### Problem 3: Buy an Integer

**Restatement.** An integer $N$ between $1$ and $10^9$ costs $A \cdot N + B \cdot d(N)$ yen, where $d(N)$ is the number of decimal digits of $N$. Given $X$ yen, find the largest affordable $N$, or $0$ if none is affordable.

**Constraints.** $A, B \le 10^9$ and $X \le 10^{18}$.

**Naive baseline.** Scan $N$ from $1$ to $10^9$ and compute each price. The scan is a billion iterations and is too slow.

**Insight.** The price is nondecreasing in $N$: $A \cdot N$ grows, and the digit count never decreases. The affordable integers form a prefix of $[1, 10^9]$.

**Derivation.** Binary search the largest $N$ with $A \cdot N + B \cdot d(N) \le X$. If even $N = 1$ is too expensive, return $0$. The check counts the digits with a loop of at most ten divisions, so it is effectively constant time.

**Correctness.** The price formula is evaluated exactly, and the monotonicity follows from the monotonicity of both terms. The boundary search returns the last affordable value.

**Complexity.** $O(\log 10^9 \cdot \log_{10} 10^9) = O(300)$ operations, and $O(1)$ space.

**Common wrong approach.** Computing $A \cdot N$ in 32-bit arithmetic. The product reaches $10^{18}$, which overflows a 32-bit signed integer and wraps to an arbitrary value, often negative. The second common error is returning $1$ when $X < A + B$; the correct answer is $0$.

## Practice progression

1. **Recognition.** Given ten statements, decide which ones ask for a boundary of a monotone predicate and which ones ask for a count or an optimum of a different shape. Write the predicate for each.
2. **Direct application.** Implement the capped-sum search and compare it with the linear scan on small random arrays.
3. **Adaptation.** Reverse the predicate: find the smallest level whose cost is at least the budget. Keep the same loop and change the comparison.
4. **Combination.** Add a prefix-sum check and compare the running time with the linear check on a large array.
5. **Challenge.** Solve a problem where the check is a greedy simulation rather than a formula, such as packing cows into buses with a maximum waiting time.
6. **Transfer.** Use the pattern on a different parameter: a poison duration, a tank height, a digit price, or a penalty in a Lagrangian relaxation.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the three ingredients of a parametric search? (Key insight)
2. Why is the capped sum nondecreasing in the level? (Formal model)
3. What is the loop invariant, and why does the true branch keep the midpoint? (Correctness proof)
4. Why does the inclusive form avoid the sentinel that the half-open form needs? (Algorithm derivation)
5. How many checks does the search perform for $U = 10^9$? (Complexity analysis)
6. When does sorting and prefix sums beat the search on the capped-sum problem? (Algorithm selection)
7. Give an array on which a check that drops the cap returns the wrong answer. (Common mistakes)
8. What is the answer when the budget covers the whole array, and why? (Correctness proof)
9. Why is the check the dangerous place for recursion, not the search? (Recursion decision)
10. How does the upper bound for the aquarium problem differ from the upper bound for the capped-sum problem? (Worked problems)

## Further reading

- [Binary search](/algorithms/searching/binary-search) derives the halving and the boundary search that this article reuses.
- [Binary search on the answer](/algorithms/searching/binary-search-on-answer) develops the most common special case, with an emphasis on the feasibility check.
- [Parallel binary search](/algorithms/advanced/parallel-binary-search) batches many parametric searches over shared data.
- [Ternary search](/algorithms/searching/ternary-search) replaces the monotone predicate with a unimodal objective.
- [Two pointers](/algorithms/searching/two-pointers) solves many of the same boundary questions in linear time when both ends of the data move in the same direction.
