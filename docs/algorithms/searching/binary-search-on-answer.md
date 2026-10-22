---
id: searching.binary-search-on-answer
title: Binary search on the answer
summary: Search the space of possible answers instead of the data, by proving that the feasibility of a candidate answer is monotone in that answer.
division: [gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords:
    [
        binary search on answer,
        search the answer,
        monotone predicate,
        feasibility check,
        parametric search,
    ]
prerequisites:
    required: [searching.binary-search, foundations.complexity]
    recommended: [searching.two-pointers]
complexity:
    time: "O(c log R)"
    space: "O(1) beyond the check's own working space"
assumptions:
    - The answer is an integer in a known range.
    - The feasibility predicate is monotone over that range, so that the feasible answers form a suffix.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find the best value of a quantity that is too large to search directly |
| **Time** | $O(c \log R)$, where $c$ is the cost of one check and $R$ is the width of the answer range |
| **Auxiliary space** | $O(1)$ beyond the check's own working space |
| **Requires** | A monotone feasibility predicate over the answer space |
| **Fails when** | The predicate is not monotone, or the check is only a heuristic rather than a decision procedure |
| **Primary technique** | Binary search over the answer, with the data searched by a separate procedure |
| **Sibling article** | The halving itself is in [binary search](/algorithms/searching/binary-search) |

The technique answers a question that no amount of searching over the data will answer directly. The answer is a number, the number is too large to enumerate, and the question "can it be done with this number?" is easier to answer than the question "what is the number?".

The whole technique is therefore two separate pieces that must both be correct: a **predicate** that says whether a candidate answer works, and a **search** over the answer space that relies on the predicate being monotone. Contest solutions that get this wrong usually have a correct predicate and a search that returns the wrong end of the range, or a predicate that is only approximately right.

## Problem motivation

A delivery office has $n$ packages waiting in a line. The van carries them in batches, and each batch must consist of consecutive packages, because the packages cannot be reordered. The van has a capacity $C$, and no batch may exceed it. The office wants the smallest capacity that lets the van deliver everything in $k$ batches.

The constraints:

- $1 \le n \le 100\,000$ packages.
- $1 \le k \le n$ batches.
- $1 \le w_i \le 10^9$ kilograms per package.

The answer is a number of kilograms, and it can be anywhere between $\max_i w_i$ and $\sum_i w_i$, a range of up to $10^{14}$ values. Searching that range is hopeless.

But the question "can the van deliver everything in $k$ batches of capacity $C$?" is a completely different question. It can be answered by simulation: fill each batch as heavily as the order allows, and count the batches. If the packages fit into $k$ batches of capacity $C$, they also fit into $k$ batches of any larger capacity, because a plan that uses less than the allowed capacity can always be stretched. That is the monotonicity, and it is what makes the answer searchable.

## Recognition patterns

Binary search on the answer is the right tool when all of the following hold.

- The answer is a **number**, usually an integer, and it is **too large to enumerate**.
- There is a **decision procedure** for "is this candidate answer acceptable?".
- The decision is **monotone**: a candidate that works implies that every larger candidate works, or the reverse.
- The bounds of the answer are **known**, or can be bounded easily.

The phrases that signal it are "the minimum value of", "the smallest $x$ such that", "the maximum number of", "the least capacity", "the fewest rounds". The phrases that rule it out are "the number of ways" (a count, not a monotone feasibility question), "the largest subarray" (a linear or quadratic problem), and "the shortest path" (a graph algorithm).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The answer range is at most about $10^6$ | A linear scan of the answer space may be acceptable |
| The answer range is at most about $10^{18}$ | The scan is fatal; the search over the answer is required |
| The check costs $O(n)$ | The total is $O(n \log R)$, which is comfortable |
| The check costs $O(n^2)$ | The total is $O(n^2 \log R)$ and the check needs improving |
| The predicate is monotone in the candidate | The technique applies |
| The predicate is true only for an isolated candidate | The technique does not apply |

The last two rows are the whole content of the technique. Everything else is bookkeeping.

<Synonyms terms="binary search on the answer, search the answer, parametric search, monotone feasibility, search over the answer space" />

## Naive approach

The baseline scans the answer space.

```python
def smallest_capacity(capacities, k):
    for candidate in range(max(capacities), sum(capacities) + 1):
        if can_split(capacities, candidate, k):
            return candidate
    return sum(capacities)
```

This is correct and it is $O(R \cdot c)$ for an answer range of width $R$ and a check of cost $c$. With $R$ up to $10^{14}$ it never finishes.

The second baseline is to solve the optimization problem directly with a greedy or a dynamic program. Sometimes that is the better answer, and it is worth saying so: if a linear greedy solves the problem exactly, it beats a logarithmic search with an expensive check. The technique earns its place when the direct solution is hard and the decision procedure is easy.

## Key insight

The insight is that **"can it be done with $k$?" is usually easier than "what is the best $k$?"**, and that the two are connected by monotonicity.

Write the answer space as the integers from $L$ to $U$, where $L$ is a lower bound on any acceptable answer and $U$ is an upper bound. Define the predicate

$$
P(k) = \text{true if the task can be completed using at most } k \text{ units}.
$$

The monotonicity requirement is

$$
P(k) \Rightarrow P(k+1),
$$

and it holds because any plan that uses at most $k$ units also uses at most $k+1$ units. It is a property of the _meaning_ of the predicate, not of the data, and it must be argued rather than assumed.

Given monotonicity, the set of acceptable answers is a suffix of the range: there is a smallest one, and the search for it is a search for a boundary. That is exactly the boundary search that [binary search](/algorithms/searching/binary-search) performs, and the same half-open convention removes the off-by-one.

The second half of the insight is about the **split of the problem into two parts**:

- The **predicate** is a decision procedure. It must be _exact_: it must return true for every candidate that is achievable and false for every candidate that is not. A check that is merely sufficient, or merely a heuristic, turns the whole technique into an approximation.
- The **search** is the halving, and it is correct as soon as the predicate is monotone.

These two parts are proved separately and compose. The search part is inherited from binary search and is not where the difficulty lies. The difficulty is always in the predicate, and in particular in whether the predicate is exact and monotone.

## Formal model

Let $A$ be the set of candidate answers, a finite totally ordered set, and let $P : A \to \{\text{true}, \text{false}\}$ be the feasibility predicate.

<MathPanel type="definition" title="Definition">
A predicate $P$ over $A$ is **monotone increasing** if there is a threshold $k^*$ in $A$ such that $P(k)$ is false for every $k < k^*$ and true for every $k \ge k^*$. The value $k^*$ is the **answer**. The predicate is **monotone decreasing** when the truth values run the other way, and then the answer is the largest acceptable value.
</MathPanel>

<MathPanel type="definition" title="Definition">
A **check** for $P$ is a function that, given a candidate $k$, returns true if and only if $k$ is acceptable. The check is **exact** when it agrees with $P$ on every candidate.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $P$ be monotone increasing on $A$, and let $k^*$ be its threshold. The condition $P(k)$ implies $P(k')$ for every $k' \ge k$ is exactly the property that allows the answer to be found by halving.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
Throughout the search, the answer $k^*$ lies in the current interval $[lo, hi]$. Every candidate below $lo$ has been proved unacceptable, and every candidate above $hi$ has been proved acceptable.
</MathPanel>

The invariant is what the halving maintains, and it is the same invariant as in binary search. The interesting part is the predicate it depends on.

## Algorithm derivation

The state is the interval $[lo, hi]$ of candidates.

1. Set $lo = L$ and $hi = U$, where $L$ and $U$ bound the answer.
2. While $lo < hi$: let $mid = lo + \lfloor (hi - lo)/2 \rfloor$ and evaluate the check at $mid$.
3. If the check is true, set $hi = mid$. Otherwise set $lo = mid + 1$.
4. Return $lo$.

The update is correct by the monotonicity: if the check is true at $mid$, the answer is at most $mid$; if it is false, the answer is greater than $mid$. Each step halves the interval, so the loop runs $\lceil \log_2 (U - L + 1) \rceil$ times.

The bounds matter and are worth getting right, because a loose bound costs checks. The lower bound is usually $\max$ over the items of a single-item requirement, and the upper bound is usually the sum of all the items or the value produced by an obviously valid plan. Tightening the range from $10^{14}$ to $10^9$ saves twenty-two checks.

### Scheduling the checks

The checks are sequential and independent. Each one is a fresh evaluation of the decision procedure on the whole data, and the answer of one check tells the search only which half to keep. Nothing is carried from one check to the next, except the interval.

That has two consequences worth planning for.

The first is the cost. If the check costs $c$, the total is $c \cdot \lceil \log_2 (U - L + 1) \rceil$, plus the cost of reading the data once. The dominant term is the product, and it is the place to optimize: a check that is $O(n)$ is far better than one that is $O(n \log n)$, and halving the number of checks is worth as much as making a check twice as fast.

The second is that the checks can be **batched**. When there are many queries over the same data, the naive plan runs a separate search for each one, which is $q$ searches and $q \log R$ checks. A batched plan sorts all the queries by the answer range and answers them together, so that the checks for many queries are shared. The classic version of this is [parallel binary search](/algorithms/advanced/parallel-binary-search), which is the same idea taken to its limit: the check for a given midpoint is evaluated once for all the queries that need it.

## Step-by-step execution

Take the array $[2, 2, 2, 2, 2]$ and $k = 3$, and find the smallest capacity $S$ such that the array can be split into at most three contiguous parts, each with sum at most $S$.

- The bounds are $L = \max a_i = 2$ and $U = \sum a_i = 10$.
- $[lo, hi] = [2, 10]$. The midpoint is $2 + \lfloor 8/2 \rfloor = 6$. The check at 6 packs $2 + 2 + 2$ into the first part and $2 + 2$ into the second, so two parts are needed and two is at most three. The check is true, so $hi = 6$.
- $[lo, hi] = [2, 6]$. The midpoint is $2 + 2 = 4$. The check at 4 packs $2 + 2$, $2 + 2$, $2$, so three parts are needed and three is at most three. The check is true, so $hi = 4$.
- $[lo, hi] = [2, 4]$. The midpoint is $2 + 1 = 3$. The check at 3 packs $2$, $2$, $2$, $2$, $2$, so five parts are needed, which is more than three. The check is false, so $lo = 4$.
- Now $lo = hi = 4$, and the answer is 4.

Three checks were made over a range of width 9, and the answer 4 is right: any capacity below 4 fits at most one $2$ per part, so three parts hold at most three of the five elements.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
If the check is exact and the predicate is monotone increasing over $[L, U]$, the search returns the smallest acceptable candidate.
</MathPanel>

<MathPanel type="proof" title="Proof">
The invariant states that the answer lies in $[lo, hi]$, that every candidate
below $lo$ has been proved unacceptable, and that every candidate above $hi$
has been proved acceptable.

The invariant holds initially: the answer lies in $[L, U]$ by assumption, and there is nothing below or above the interval.

Suppose it holds at the start of an iteration, and let $mid$ be the midpoint.

If the check is true at $mid$, then by the monotonicity every candidate at or above $mid$ is also acceptable, and the answer, which is the smallest acceptable candidate, is at most $mid$. Setting $hi = mid$ therefore keeps the answer in the interval, and every candidate above the new $hi$ was already proved acceptable.

If the check is false at $mid$, then by the monotonicity every candidate at or below $mid$ is also unacceptable, and the answer is greater than $mid$. Setting $lo = mid + 1$ therefore keeps the answer in the interval, and every candidate below the new $lo$ was already proved unacceptable.

In both cases the invariant is preserved. The interval strictly shrinks, so the loop terminates with $lo = hi$, and the invariant says the answer is that value. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The composition of the two parts is what the theorem relies on: the proof of
the search uses the monotonicity of the predicate, and the monotonicity is a
property of the meaning of the check. If the check is not exact, that is, if
it disagrees with the true feasibility somewhere, then the predicate of the
theorem is not the predicate the check implements, and the conclusion does
not follow.
</MathPanel>

## Complexity analysis

**Time: $O(c \log R)$**, where $c$ is the cost of one check and $R = U - L + 1$ is the width of the answer range. With a linear check and $R$ up to $10^{14}$, the number of checks is about 47, so the total is 47 passes over the data.

**Auxiliary space:** whatever the check itself needs, usually $O(n)$ for a copy of the data or $O(1)$ for a running state. The search itself uses $O(1)$.

<MathPanel type="complexity" title="Complexity">
Binary search on the answer: $O(c \log R)$ time and $O(1)$ auxiliary space
beyond the check's working space. The dominant term is the product of the
check cost and the number of checks, so both are worth tightening.
</MathPanel>

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Smallest capacity, minimum rounds, minimum time | Binary search on the answer |
| The same question with the data already sorted or the structure known | A direct greedy, which may be linear |
| The same question with a non-monotone feasibility check | A different formulation, or a parametric search with a different predicate |
| Many queries over the same data | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |
| The answer is an array or a set rather than a number | A greedy or a dynamic program |
| The answer is one of the input values | A sort, a binary search over the values, or a sweep |
| The predicate needs the answer to be exact | Do not use the technique until it is |

The last row is the one to remember. A search over the answer magnifies every weakness of the check: a check that is wrong on one candidate produces a wrong answer, and there is no way to notice.

## Recursion decision

The search over the answer is a loop, and the loop is the better form, because the number of iterations is known in advance and the recursion would only add frames.

A recursive version of the search has depth $O(\log R)$, which is at most 60 for a 64-bit answer range and is safe in every language.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | The loop; a recursion of depth 60 is also fine |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop; raising the limit is unnecessary at depth 60 |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

The recursion risk in this technique is not in the search but in the check. A check written recursively over the data, for example a recursive partition, has depth $O(n)$ and crashes on a large input. Write the check as a loop.

## Implementation walkthrough

The two lines that carry the technique are the bounds and the update.

```cpp
long long lo = lowerBound, hi = upperBound;
while (lo < hi) {
    long long mid = lo + (hi - lo) / 2;   // the difference first, so it cannot overflow
    if (feasible(mid)) hi = mid;           // mid works, so the answer is at most mid
    else lo = mid + 1;                    // mid does not work, so the answer is larger
}
return lo;
```

The midpoint is computed as `lo + (hi - lo) / 2` and not `(lo + hi) / 2`, because the answer range is frequently larger than $2^{31}$ and the sum of the two bounds can overflow a 64-bit integer as well.

The update is asymmetric on purpose: the true branch keeps the midpoint itself, because a feasible candidate may be the answer, and the false branch moves past it, because an infeasible candidate is definitely not the answer.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| The check is a heuristic rather than a decision procedure | The answer is feasible but not minimal | Prove the check decides exactly |
| The check says "exactly $k$" instead of "at most $k$" | The predicate is not monotone and the search is meaningless | Use "at most", or argue the monotonicity |
| The bounds are too wide | More checks than necessary | Use $\max a_i$ and $\sum a_i$, not 0 and infinity |
| The bounds are wrong | The answer is off by one or missing | Test the bounds on the extremes |
| The midpoint overflows | The search goes the wrong way on large ranges | Compute the difference first |
| The true branch sets $lo = mid$ | The loop may not terminate | Set $hi = mid$ |
| The check is recomputed from scratch every time | The constant factor is large | Make the check linear and streaming |
| The predicate is monotone in the wrong direction | The search converges on the wrong end | Write down which end is the answer before coding |

### Why this fails: the check that demands exactly $k$

The mistake that survives review is writing the check as "the task can be done in exactly $k$ units" when the problem asks for the minimum. It reads naturally, because the statement says "split the array into $k$ parts", and the coder encodes the $k$ literally.

The smallest counterexample is the array $[1, 1, 1, 1]$ with $k = 3$ parts.

The correct answer is 2. With a capacity of 2 the array splits into the parts $(1, 1)$ and $(1, 1)$, which is two parts, and two parts are at most three, so 2 is acceptable. With a capacity of 1 each part holds a single element, so four parts are needed, which is more than three, so 1 is not acceptable.

The wrong check asks whether the greedy produces _exactly_ three parts. With a capacity of 1 it produces four, with a capacity of 2 it produces two, with a capacity of 3 it produces two, and with a capacity of 4 it produces one. It never produces three, so the predicate is false everywhere and the search returns the upper bound, 4. The answer 4 is achievable and is not minimal.

The failure is not an off-by-one. The predicate "exactly $k$ parts" is not monotone at all: it is false, then true, then false again, and a binary search over a non-monotone predicate has no meaning. The truth pattern here is false everywhere, which is the mildest form of the failure; with a different array it is false, true, false, and the search lands on whichever end the first branch happened to reach.

The lesson generalizes: **the predicate must be "at most $k$", not "exactly $k$"**, and the reason it must be "at most" is that "at most" is what makes the predicate monotone. A plan that fits in $k$ always fits in $k+1$.

The second failure is a heuristic check. Suppose the check packs the parts greedily but the problem allows the parts to be non-contiguous, or allows a part to be empty. The greedy then produces a schedule that is feasible but perhaps not minimal, and the search reports the smallest capacity the greedy can manage, which is larger than the true optimum.

## Variants and extensions

- **The minimum value.** Instead of the smallest acceptable value, ask for the largest $k$ for which the check fails, or invert the predicate and keep the same loop.
- **Binary search on a real answer.** The same loop with a floating-point midpoint and a tolerance, terminated when the interval is smaller than the required precision.
- **Parallel binary search.** When there are many queries over the same data, the checks are batched so that each distinct midpoint is evaluated once, which is described in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- **Search over a discrete set of candidates.** When the answer must be one of a sorted list of values, binary search over the list instead of over the integers, and the range of candidates is the list.
- **Ternary search.** When the objective is unimodal rather than the feasibility monotone, the halving changes shape, and the technique is described in [ternary search](/algorithms/searching/ternary-search).
- **Search over the answer with a two-dimensional predicate.** When two quantities must be optimized jointly, one is binary searched and the other is handled by a nested search or by a greedy inside the check.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write the bounds down before writing the check: the smallest possible answer and the largest.
2. Write the predicate in words and decide whether it is "at most" or "exactly". Only "at most" is monotone.
3. Prove the monotonicity in one sentence: "if it is possible with $k$, then it is possible with $k+1$".
4. Prove the check is exact, not merely sufficient. If it is only sufficient, the answer will be too large.
5. Count the checks: the number is the number of bits in the range. Multiply by the cost of one check and check it against the time limit.
6. Test the bounds: the check must be false at the lower bound minus one and true at the upper bound.

## Worked problems

### Problem 1: the smallest capacity of a split

**Restatement.** Given $n$ positive numbers and an integer $k$, find the smallest capacity $S$ such that the array can be split into at most $k$ contiguous parts, each with sum at most $S$. Constraints: $1 \le n \le 100\,000$, $1 \le k \le n$, values up to $10^9$.

**Naive baseline.** A scan of the capacity range, at $O(n \cdot \sum a_i)$.

**Insight.** If the array fits into $k$ parts of capacity $S$, it fits into $k$ parts of any larger capacity, so the feasibility is monotone in $S$.

**Derivation.** Binary search $S$ between $\max a_i$ and $\sum a_i$. The check greedily packs the parts, adding each element to the current part while it fits and starting a new part otherwise, and returns whether the number of parts is at most $k$.

**Correctness.** The greedy packing uses the minimum possible number of parts, because each part is filled as much as possible, so the check decides the feasibility exactly. The monotonicity then gives the theorem.

**Complexity.** $O(n \log(\sum a_i))$ time and $O(n)$ space for the copy.

**Common wrong approach.** Checking for exactly $k$ parts, which makes the predicate non-monotone and the search meaningless.

### Problem 2: the minimum capacity per day

**Restatement.** A worker has $n$ jobs with durations $t_i$ and $d$ days left. The worker can run one job at a time on each day, and each job runs to the end of the day it is started, so a day can hold a job only if the job's duration is at most the day's capacity. What is the minimum daily capacity that lets the worker finish every job within the $d$ days? Constraints: $1 \le n \le 100\,000$, $1 \le d \le n$, $1 \le t_i \le 10^9$.

**Naive baseline.** A scan of the capacity range, at $O(n \cdot \sum t_i)$.

**Insight.** A larger daily capacity never increases the number of days needed, so the feasibility is monotone in the capacity.

**Derivation.** Binary search the capacity between $\max t_i$ and $\sum t_i$. The check sorts the durations in decreasing order and packs them greedily into days of the candidate capacity, returning true when the number of days used is at most $d$. Taking the longest jobs first is optimal, because a shorter job can always stand in for a longer one in a day that a longer job would have used.

**Correctness.** The greedy produces the minimum possible number of days for a given capacity, so the check decides the feasibility exactly. The monotonicity then gives the theorem.

**Complexity.** $O(n \log n + n \log(\sum t_i))$ time and $O(n)$ space.

**Common wrong approach.** Packing the jobs in the order they arrive instead of longest first, which can need more days than necessary and therefore reports a capacity that is too large.

### Problem 3: the smallest capacity of a circular split

**Restatement.** Given $n$ positive numbers arranged in a circle and an integer $k$, find the smallest capacity $S$ such that the circle can be cut into $k$ contiguous arcs, each with sum at most $S$. Constraints: $1 \le n \le 100\,000$, $1 \le k \le n$, values up to $10^9$.

**Naive baseline.** A scan of the capacity range with a linear check over the circle, at $O(n^2 \cdot \sum a_i)$ in the worst case.

**Insight.** The feasibility is monotone in the capacity, and a cut that starts at one place can be tested from every place at once by doubling the array.

**Derivation.** Binary search the capacity between $\max a_i$ and $\sum a_i$. The check doubles the array and, for each starting position, greedily packs the arcs and counts how many are needed; the capacity works if some starting position needs at most $k$ arcs. The greedy packing is exact for a fixed start because an arc that ends as late as possible leaves the fewest elements for the remaining arcs.

**Correctness.** The greedy is exact for a fixed starting point, and the check tests every starting point, so it decides the feasibility exactly. The monotonicity then gives the theorem.

**Complexity.** $O(n \log(\sum a_i))$ time and $O(n)$ space for the doubled array.

**Common wrong approach.** Forgetting that the cut may start anywhere, which is what the doubling is for, and testing only the first position.

## Practice progression

1. **Recognition.** Given a statement, decide whether a search over the answer applies. Look for a numeric optimum, a "minimum" or "maximum", and ask whether the feasibility is monotone.
2. **Direct application.** Implement the search with an exact check, and verify it against a brute-force scan of the answer range on small inputs.
3. **Adaptation.** Implement the variant that returns the largest acceptable value, and the variant where the answer must be one of a sorted list of candidates.
4. **Combination.** Combine the search with a greedy inside the check, and with a prefix sum so that the check can ask about a range in constant time.
5. **Challenge.** Solve a problem with two coupled parameters, where one is binary searched and the other is optimized inside the check, and prove the coupling does not break the monotonicity.
6. **Transfer.** Recognize the pattern in a different shape: the smallest capacity of a pipe, the fewest refueling stops, the least rounds for a set of jobs, and the largest radius that fits through a corridor.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What two properties must the feasibility predicate have? (Key insight)
2. Why is "exactly $k$" a broken predicate and "at most $k$" a sound one? (Common mistakes)
3. What does it mean for the check to be exact, and what happens when it is not? (Correctness proof)
4. State the invariant of the search over the answer. (Formal model)
5. How many checks are performed, and how is that number related to the bounds? (Scheduling the checks)
6. Why is the midpoint computed with the difference first? (Implementation walkthrough)
7. Give the smallest array on which the "exactly $k$" check fails, and say what it returns. (Common mistakes)
8. When does a direct greedy beat a search over the answer? (Algorithm selection)
9. How do tight bounds reduce the running time, and by how much? (Scheduling the checks)
10. What is the total time in terms of the check cost $c$ and the range width $R$? (Complexity analysis)
11. Where should the recursion be avoided in this technique, and why? (Recursion decision)
12. How do you answer many queries over the same data with fewer checks? (Scheduling the checks)

## Further reading

- The halving that the search over the answer performs is in [binary search](/algorithms/searching/binary-search).
- The variant that answers many queries with shared checks is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The halving over a unimodal objective instead of a monotone predicate is in [ternary search](/algorithms/searching/ternary-search).
- The scan that finds a boundary in a sorted sequence, which is the same idea over data instead of answers, is in [two pointers](/algorithms/searching/two-pointers).
- The greedy that a decision procedure usually wraps is described in [interval scheduling](/algorithms/greedy/interval-scheduling).
