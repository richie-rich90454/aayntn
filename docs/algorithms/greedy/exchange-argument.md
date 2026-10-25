---
id: greedy.exchange-argument
title: The exchange argument as a general tool
summary: Prove a greedy rule correct by swapping the greedy choice into an optimal solution, one step at a time, without making the solution worse.
division: [silver, gold]
subjects: [greedy]
level: intermediate
importance: common-contest-technique
keywords:
    [
        exchange argument,
        greedy proof,
        adjacent swap,
        sorting comparator,
        optimal substructure,
        greedy stays ahead,
        interval scheduling,
        matroid,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [greedy.interval-scheduling, searching.binary-search]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The objective is a total order on solutions, so two solutions can be compared as better, equal, or worse.
    - The greedy algorithm commits to one choice at a time, and the remaining subproblem has the same shape as the original.
implementations: greedy.exchange-argument
reviewed: false
---

<AlgorithmSummary algorithm="greedy.exchange-argument" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="greedy.exchange-argument" />

## At a glance

An exchange argument proves that a greedy algorithm is correct by transforming an optimal solution into the greedy solution, one swap at a time, without ever making the solution worse. The transformation ends at the greedy solution, so the greedy solution is optimal too.

Every exchange proof has the same four beats.

1. Name the greedy solution $G$ and an optimal solution $O$.
2. Find the first place where $O$ differs from $G$.
3. Exchange the greedy choice into $O$, and prove that the result is still feasible.
4. Prove that the exchange does not make the objective worse, and measure how much closer the result is to $G$.

The running example is the maximum disjoint-interval problem. The greedy rule takes the interval that finishes earliest, and the exchange argument replaces the first interval of an optimal schedule with that earliest-finishing interval. The rest of the optimal schedule starts after the replaced interval ends, so it also starts after the greedy interval ends. The count stays the same.

The article's reference program is a proof harness rather than a contest submission. It reads $n$ intervals and prints two numbers: the count produced by the earliest-finish greedy and the true optimum produced by exhaustive enumeration. It then prints `MATCH` or `DIFFER`. For $n \le 12$ the enumeration is small enough to run, and the exchange proof predicts that every valid input prints `MATCH`. A `DIFFER` line is a counterexample, and a counterexample is more valuable than any number of passing samples.

The method is general. The same four beats prove an adjacent-swap sorting comparator, a greedy matching rule, and the rearrangement inequality. The greedy rule changes from problem to problem; the shape of the proof does not.

## Problem motivation

A university has one lecture hall and a list of invited talks. Each talk has a start time and an end time, the hall holds one talk at a time, and the department wants to schedule as many talks as possible. Two talks conflict when their intervals overlap, and a talk that starts exactly when the previous one ends is allowed.

The constraints are typical of a contest statement.

- $1 \le n \le 500\,000$ talks.
- $0 \le s_i < e_i \le 10^9$.
- Every talk is worth exactly one talk to the count.
- At most one talk is active at any moment.

The algorithm is short. Sort the talks by finish time, keep a variable for the time at which the hall becomes free, and take each talk whose start time is at or after that variable. The scan is linear after the sort.

The hard part is not the code. The hard part is the sentence "this greedy rule is optimal." A rule that looks equally reasonable, such as taking the shortest talk first, is wrong on a three-talk input. A rule that looks even more reasonable, such as taking the talk with the largest value first, is wrong on the weighted version. Contest tests are built to find exactly those differences, so a rule without a proof is a guess.

The general problem is therefore a proof problem.

> Given a greedy rule that builds a solution one choice at a time, prove that no optimal solution is better than the one it builds.

Two proof techniques dominate. A **greedy stays ahead** proof shows that after every step the greedy partial solution is at least as good as any other partial solution of the same size. An **exchange argument** starts from a fully optimal solution and edits it until it becomes the greedy solution, preserving optimality at every edit. This article develops the second technique, because it applies to selections, orderings, and pairings with almost no change.

The reference program makes the proof empirically checkable. The greedy count is the answer under test; the exhaustive count is the oracle. The program is not a solution to the original $n = 500\,000$ problem, because enumeration is exponential. It is a solution to the meta-problem: it finds a counterexample when one exists among small inputs.

## Recognition patterns

An exchange argument is the right proof technique when all of the following hold.

- A solution is a **set, a sequence, or a pairing** of items.
- The greedy algorithm builds the solution **one commitment at a time**, and never revises an earlier commitment.
- An optimal solution can be edited **locally**: one item is replaced, one adjacent pair is swapped, or two assignments are exchanged.
- The edit **preserves feasibility** for a structural reason, not by accident.
- The objective can be compared **before and after** the edit with a short calculation.

The phrases that signal the technique are "in any order", "rearrange the array", "pair each item with at most one", "schedule as many as possible", "minimize the largest", "each item is used once", and "the answer does not depend on the original order". The phrase that rules it out is "each item has a value", because a value changes the comparison that the exchange must preserve.

The constraint values decide whether the greedy rule can even be tested.

| Constraint | What it rules |
| --- | --- |
| Every item is worth the same, and the objective is a count | Exchange arguments are usually short and decisive |
| Items have distinct values or weights | The simple exchange fails; use a dynamic program |
| One shared resource over time | Interval scheduling and its exchange lemma |
| Two or more independent resources | Matching or flow, not a one-dimensional exchange |
| A total order on items determines the cost | Adjacent exchange and a sorting comparator |
| Pairing two sets, with an interval of compatibility | Greedy matching with an urgency rule |
| Two sequences paired position by position | Rearrangement inequality, proved by exchange |
| Decisions arrive online and cannot be delayed | No exchange with the future; a different model is needed |
| The constraint couples many items at once | The local swap is unlikely to preserve feasibility |

A useful diagnostic is to ask what the exchange would have to preserve. If the answer is "the number of chosen items", the objective is probably a count and the exchange is promising. If the answer is "the total value", the exchange has to preserve a weighted sum, and a single swap of one item for another usually changes it.

## Naive approach

The baseline for the interval problem enumerates every subset of talks.

```python
best = 0
for mask in range(1 << n):
    chosen = [i for i in range(n) if (mask >> i) & 1]
    if all(
        ends[chosen[i]] <= starts[chosen[j]] or ends[chosen[j]] <= starts[chosen[i]]
        for i in range(len(chosen))
        for j in range(i + 1, len(chosen))
    ):
        best = max(best, len(chosen))
```

The enumeration is $O(n^2 2^n)$ because every subset is checked against every pair inside it. It is a correct specification of the problem: a schedule is exactly a subset of pairwise compatible intervals. It is not a solution to the stated constraints, because $2^{500000}$ does not finish.

The same baseline exists for the other shapes. For an ordering problem, enumerate all $n!$ permutations and keep the best. For a pairing problem, enumerate all matchings. Each is a correct specification and each is exponential.

The naive approach has a second use that matters more than the first. For $n \le 12$, the enumeration is a **falsification oracle**. Run the greedy and the oracle on the same input. If the answers differ, the greedy is wrong and the input is a counterexample. If the answers agree, the greedy has survived one test. Agreement on every input up to size 12 is strong evidence, but it is not a proof: the failure may appear at size 13, or at a larger value range.

That distinction is the reason this article exists. Samples and random tests can find a broken rule, but only a proof can certify a correct one. The reference program is deliberately built around both halves: the greedy is the candidate, the enumeration is the skeptic, and the `MATCH` line is the empirical part of the story rather than the conclusion.

## Key insight

The insight is to compare the greedy solution with an optimal solution that agrees with it as long as possible.

Let the greedy algorithm choose $g_1, g_2, \ldots, g_m$ in that order. Suppose $O$ is an optimal solution that contains $g_1, \ldots, g_k$. If $O$ also contains $g_{k+1}$, the common prefix grows for free. If it does not, the next choice of $O$ is some other element $x$. The exchange replaces $x$ by $g_{k+1}$.

Two facts have to be checked.

- The replacement is **feasible**: $g_{k+1}$ fits with the prefix and with everything that followed $x$.
- The replacement is **no worse**: the objective of the new solution is at least as good as the objective of $O$.

If both facts hold, the new solution is optimal and agrees with the greedy on one more choice. Repeating the argument walks an optimal solution into the greedy solution. At the end, the two are the same, so the greedy solution is optimal.

The measure of progress is the length of the common prefix. Every exchange increases it by one, and the number of choices is finite, so the process terminates. For an ordering problem the measure is the number of inversions relative to the greedy order: every adjacent swap removes one inversion, and the process terminates at the sorted order.

The local statement "the greedy choice is the best next choice" is not enough. The exchange proves something stronger: the greedy choice can be made **inside a globally optimal solution** without losing global optimality. That is why the rest of the optimal solution can be reused unchanged.

::: math invariant Invariant
After $k$ choices, there is an optimal solution that contains the greedy prefix $\{g_1, \ldots, g_k\}$.
:::

The base case is the empty prefix, which every solution contains. The inductive step is the exchange. The invariant is the entire proof in one sentence.

## Visual intuition

Draw an optimal solution and the greedy solution as two rows of boxes. The boxes before the first difference are identical. At the first difference, the optimal row contains $x$ and the greedy row contains $g$.

```text
optimal:   [ g1 ][ g2 ][ g3 ][  x  ][ ... rest of O ... ]
greedy:    [ g1 ][ g2 ][ g3 ][  g  ][ ... not built yet ... ]
                                  ^
                            first difference
```

The exchange removes $x$ and inserts $g$. The boxes before the difference are untouched, and the boxes after $x$ are untouched as well. Only one box changes, which is why the feasibility check is short.

For interval scheduling, draw the timeline. The greedy interval $g$ ends no later than the optimal interval $x$. Everything that followed $x$ begins at or after the end of $x$, so it also begins at or after the end of $g$. The picture is a cursor that moves to the earliest possible finish and then continues from there.

```text
prefix ends here
      |
      |   [ x ===== ]
      | [ g === ]
      |          [ next interval of O ===== ]
```

The greedy interval leaves at least as much room as the optimal one. That is the geometric content of $e_g \le e_x$.

For an ordering problem the picture is an adjacent swap.

```text
before:   ... [ a ][ b ] ...
after:    ... [ b ][ a ] ...
```

Only the two adjacent items change their positions. The items before the pair see the same total weight, and the items after the pair see the same total weight, so only the risks or costs of $a$ and $b$ need to be compared.

The common thread is that the exchange is **local**. A local edit is easy to verify, and a finite sequence of local edits reaches the greedy solution.

## Formal model

Let $E$ be a finite set of items. A **feasible solution** is a subset $S \subseteq E$ that satisfies the constraints, and $\mathcal{F}$ is the family of all feasible solutions. An objective is a function $f : \mathcal{F} \to \mathbb{R}$. A solution $O$ is **optimal** when $f(O) \ge f(S)$ for every feasible $S$ in a maximization problem, or $f(O) \le f(S)$ in a minimization problem.

::: math definition Definition
A family $\mathcal{F}$ is **hereditary** when every subset of a feasible solution is feasible: if $S \in \mathcal{F}$ and $T \subseteq S$, then $T \in \mathcal{F}$.
:::

Interval schedules form a hereditary family. Removing an interval from a compatible set cannot create an overlap.

::: math definition Definition
A greedy algorithm builds a chain of feasible sets

$$
P_0 = \varnothing, \qquad P_{k+1} = P_k \cup \{g_{k+1}\},
$$

where $g_{k+1}$ is chosen by a fixed rule from the items that can be added to $P_k$. It stops when no item can be added, and returns $P_m$.
:::

::: math definition Definition
A feasible solution $O$ **extends** a prefix $P_k$ when $P_k \subseteq O$. The **exchange property** holds at step $k$ when, for every optimal $O$ extending $P_k$, there is an optimal $O'$ extending $P_{k+1}$.
:::

The exchange property is the only thing an exchange proof has to establish. Everything else is induction.

::: math theorem Theorem (exchange schema)
Let $\mathcal{F}$ be hereditary, let the greedy algorithm stop only when no item can be added, and suppose the exchange property holds at every step. Then the final greedy set $P_m$ is optimal.
:::

The proof is in the correctness section. The statement is deliberately abstract: it does not mention intervals, sorting, or matching. Those problems supply their own definition of feasibility and their own proof of the exchange property.

For an ordering problem, the model changes slightly. A solution is a permutation $\pi$ of $E$, the greedy solution is the permutation produced by a comparator, and the prefix is the first $k$ positions of the permutation. The same induction applies, with "contains the prefix" replaced by "agrees with the prefix".

::: math definition Definition
A comparator $\preceq$ is **transitive** when $a \preceq b$ and $b \preceq c$ imply $a \preceq c$ for all items $a, b, c$. It is a **total preorder** when, in addition, $a \preceq b$ or $b \preceq a$ for every pair.
:::

A sorting comparator must be a total preorder. Without transitivity, the sorted order depends on the sorting algorithm, and the adjacent exchange condition can hold for every pair while no permutation is globally best.

## Algorithm derivation

Start with the algorithm, then derive its proof.

**The algorithm.** For the interval problem, sort the intervals by finish time, breaking ties by start time. Initialize the free time to a value smaller than every start. Scan the sorted intervals. If the current interval starts at or after the free time, take it and set the free time to its end. The count of taken intervals is the answer.

```text
sort intervals by (end, start)
free = -infinity
count = 0
for (start, end) in sorted intervals:
    if start >= free:
        count += 1
        free = end
return count
```

Sorting by finish time turns "the compatible interval that finishes earliest" into "the first compatible interval in the sorted order". The scan never moves backwards, because the free time only increases and every skipped interval started before the free time at the moment it was examined.

**The proof.** The exchange argument answers four questions.

1. **What does the greedy choose next?** Among the intervals compatible with the current prefix, it chooses one with the smallest end time.
2. **What does an optimal solution extending the prefix look like?** Its next interval starts at or after the free time, and the rest of its intervals are ordered after that one.
3. **Which interval of the optimal solution should be replaced?** The first interval after the prefix, because that is the only interval that can conflict with the greedy choice.
4. **Why is the replacement feasible and no worse?** The greedy interval starts after the prefix and ends no later than the replaced interval. Every later interval of the optimal solution starts after the replaced interval ends, hence after the greedy interval ends. The number of intervals is unchanged.

The four answers are the proof. The code is almost an afterthought.

::: math invariant Invariant
Before each step of the scan, every interval already examined either is in the greedy prefix or starts before the current free time. The free time is the end of the last chosen interval, or a value below every start when nothing has been chosen.
:::

The invariant explains why a skipped interval is never reconsidered. Its start is before the free time at the moment it is examined, and the free time never decreases. It will still be before the free time at every later moment.

For an ordering problem, the derivation is the same four questions with a different exchange. The greedy order is the sorted order. The optimal solution is a permutation. The first difference is an adjacent inversion. The exchange swaps the two inverted items. Feasibility is automatic because every permutation is feasible, and the objective comparison is the algebra of the two items' costs.

## Step-by-step execution

Take five interviews.

| Interview | Start | End |
| --------- | ----- | --- |
| A         | 1     | 4   |
| B         | 3     | 5   |
| C         | 5     | 7   |
| D         | 2     | 8   |
| E         | 7     | 9   |

Sorted by finish time, the order is A (ends 4), B (ends 5), C (ends 7), D (ends 8), E (ends 9).

The greedy scan runs as follows.

- The free time is below every start. A starts at 1, so A is taken. The free time becomes 4, and the count is 1.
- B starts at 3, which is before 4, so B is skipped.
- C starts at 5, which is at or after 4, so C is taken. The free time becomes 7, and the count is 2.
- D starts at 2, which is before 7, so D is skipped.
- E starts at 7, which is at or after 7, so E is taken. The free time becomes 9, and the count is 3.

The greedy schedule is A, C, E with 3 interviews.

The exhaustive enumeration checks all $2^5 = 32$ subsets. A few of them are worth looking at.

| Subset  | Compatible?         | Size |
| ------- | ------------------- | ---- |
| A, C, E | Yes                 | 3    |
| B, C, E | Yes                 | 3    |
| A, C, D | No, C and D overlap | 2    |
| A, B, C | No, A and B overlap | 2    |
| A, D, E | No, A and D overlap | 2    |
| B, D, E | No, B and D overlap | 2    |

The optimum is 3, so the program prints:

```text
3 3
MATCH
```

Now run the exchange on the alternative optimum $O = \{B, C, E\}$. The first choice of the greedy is A, while the first choice of $O$ is B. The exchange replaces B with A.

- A starts at 1, so it is compatible with the empty prefix.
- A ends at 4, and B ends at 5, so A ends no later than B.
- C starts at 5, which is at or after 4, so A and C are compatible.
- E starts at 7, which is at or after both 5 and 4, so the rest of $O$ is unaffected.

The new schedule is $\{A, C, E\}$, which is still optimal and agrees with the greedy on its first choice. The common prefix grew from zero to one. Repeating the exchange would grow it to three, but the new schedule is already the greedy schedule.

The touching case is worth a separate look. B ends at 5 and C starts at 5. The comparison is `start >= free`, not `start > free`, so B and C are compatible. If the comparison were strict, the greedy would reject C and return 2 instead of 3. The exhaustive enumeration would then print `DIFFER`, which is exactly the kind of bug the harness is designed to catch.

## Correctness proof

::: math lemma Lemma (interval exchange)
Let $P$ be a greedy prefix, let $g$ be an interval compatible with $P$ that finishes earliest among all such intervals, and let $O$ be an optimal schedule extending $P$. Then there is an optimal schedule extending $P \cup \{g\}$.
:::

::: math proof Proof
If $g \in O$, then $P \cup \{g\} \subseteq O$, so $O$ itself is the required schedule.

Otherwise, let $x$ be the first interval of $O$ after the prefix $P$. The interval $x$ is compatible with $P$. Since $g$ finishes earliest among the intervals compatible with $P$,

$$
e_g \le e_x.
$$

Replace $x$ by $g$ in $O$, obtaining

$$
O' = (O \setminus \{x\}) \cup \{g\}.
$$

The interval $g$ starts at or after the end of the prefix, because it is compatible with $P$. Every interval $y$ of $O$ that followed $x$ starts at or after $e_x$, hence at or after $e_g$, so $g$ is compatible with $y$. The intervals other than $g$ are compatible with each other because they were compatible in $O$. Therefore $O'$ is a schedule.

The schedules $O$ and $O'$ have the same number of intervals, so $O'$ is optimal and extends $P \cup \{g\}$. $\square$
:::

::: math theorem Theorem (earliest finish is optimal)
The earliest-finish greedy algorithm returns a maximum-size schedule.
:::

::: math proof Proof
Use the exchange schema. The family of schedules is hereditary, because a subset of a compatible set is compatible. The greedy algorithm stops only when no remaining interval can be added: every interval that was skipped started before the free time at the moment it was examined, and the free time never decreases.

The base case is the empty prefix, which is contained in every optimal schedule.

For the inductive step, suppose $O_k$ is an optimal schedule extending the greedy prefix $P_k$. The interval exchange lemma gives an optimal schedule $O_{k+1}$ extending $P_{k+1}$. This is exactly the exchange property.

By induction, after the last greedy choice there is an optimal schedule $O_m$ extending $P_m$. If $O_m$ contained an interval $e$ outside $P_m$, then $P_m \cup \{e\} \subseteq O_m$ would be feasible by heredity, contradicting the fact that the greedy algorithm had no interval left to add. Hence $O_m = P_m$, and the greedy schedule is optimal. $\square$
:::

::: math theorem Theorem (the enumeration is the true optimum)
For $n \le 12$, the exhaustive enumeration returns the maximum size of a pairwise compatible subset of the input intervals.
:::

::: math proof Proof
The enumeration visits every subset of the $n$ intervals exactly once. For each subset it checks every pair of intervals inside the subset, and accepts the subset exactly when no pair overlaps. A subset with no overlapping pair is a schedule, and every schedule is such a subset. Therefore the largest accepted subset has the maximum possible size. $\square$
:::

The local comparison is the hypothesis, and the global theorem needs a global measure. The measure is the number of inversions relative to the comparator.

::: math theorem Theorem (sorted order is optimal)
If every adjacent swap of an inverted pair does not make the objective worse, then the sorted order is optimal.
:::

::: math proof Proof
Start from any optimal permutation. If it has an inversion, that is, two adjacent items $b, a$ with $a \preceq b$, swap them. The hypothesis says the objective does not get worse, and the number of inversions decreases by one. Repeating this process terminates, because the number of inversions is a nonnegative integer that strictly decreases. The terminal permutation has no inversions, so it is sorted. It is optimal because every swap preserved optimality. $\square$
:::

::: math lemma Lemma (rearrangement exchange)
Let $a_1, \ldots, a_n$ and $c_1, \ldots, c_n$ be two sequences. If an assignment pairs $a_i$ with $c_i$ and there are indices $i, j$ with $a_i > a_j$ and $c_i < c_j$, then swapping the two assignments increases the sum.
:::

::: math proof Proof
The contribution of the two positions changes from $a_i c_i + a_j c_j$ to $a_i c_j + a_j c_i$. The difference is

$$
(a_i c_j + a_j c_i) - (a_i c_i + a_j c_j) = (a_i - a_j)(c_j - c_i) > 0,
$$

because both factors are positive. $\square$
:::

::: math theorem Theorem (rearrangement inequality)
The sum $\sum_{i=1}^{n} a_i c_{\pi(i)}$ is maximized when both sequences are sorted in the same order.
:::

::: math proof Proof
Take an optimal assignment with the fewest inversions between the two orders. If it has an inversion, the lemma gives a strictly better assignment, contradicting optimality. Therefore it has no inversion, which means the two sequences are paired in the same sorted order. $\square$
:::

The interval proof, the sorting proof, and the rearrangement proof are the same argument in three costumes. Each identifies an exchange that preserves feasibility, shows the exchange does not worsen the objective, and uses a finite measure to reach the greedy solution.

## Complexity analysis

**The interval greedy: $O(n \log n)$ time and $O(n)$ space.** The sort dominates. The scan is $O(n)$ because every interval is examined once and the free time never moves backwards. The sorted copy costs $O(n)$ space; an in-place sort reduces the extra space to $O(1)$.

**The exhaustive oracle: $O(n^2 2^n)$ time and $O(n)$ extra space.** There are $2^n$ subsets, and each subset is checked against at most $\binom{n}{2}$ pairs. For $n = 12$ that is $4096$ subsets and at most $4096 \ast 66 \approx 270\,000$ pair checks, which is instantaneous. For $n = 20$ the same computation is about $10^8$ pair checks, and for $n = 30$ it is hopeless.

**The proof is not part of the running time.** The exchange lemma is an argument about the algorithm, not a procedure the algorithm executes. An implementation does not try every swap; it trusts the lemma and performs one scan.

**The adjacent-swap proof: $O(n^2)$ swaps in the worst case, but the algorithm sorts in $O(n \log n)$.** The quadratic count belongs to the proof, not to the code. Bubble sort is a convenient way to describe the transformation, not a recommendation for the implementation.

**The rearrangement algorithm: $O((n + q) \log n)$ time and $O(n)$ space.** Computing the coverage counts with a difference array costs $O(n + q)$, and sorting the values and the counts costs $O(n \log n)$ and $O(n \log n)$ respectively. The dot product is $O(n)$.

The arithmetic deserves a line. Interval endpoints up to $10^9$ fit in a signed 32-bit integer, but a difference or a sum of endpoints may not, so the reference programs use 64-bit types. The rearrangement answer can reach $n \ast \max a \ast q$, which is about $8 \ast 10^{15}$ under the stated limits, well beyond a 32-bit integer and comfortably inside a signed 64-bit integer.

## Algorithm selection

The exchange argument is a proof technique, not an algorithm. The table separates the two decisions: which algorithm to run, and which proof to attempt.

| Situation | Algorithm | Proof |
| --- | --- | --- |
| Equal-value intervals, one resource, maximize the count | Sort by finish time and scan | Exchange, earliest finish |
| Equal-value intervals, one resource, minimize the number of resources | Sort by start and sweep with a heap | Lower bound on the maximum overlap |
| Weighted intervals, maximize the total value | Dynamic program over sorted finish times | Exchange fails; the value changes under the swap |
| Jobs with deadlines and profits, one machine | Sort by profit and place in the latest free slot | Exchange with a feasibility check |
| Pair two sets with compatibility intervals | Sort one side and use a heap on the other | Exchange with the most urgent item |
| Two sequences paired position by position | Sort both and pair in the same order | Rearrangement exchange |
| A total order on items determines the cost | Sort with a pairwise comparator | Adjacent exchange |
| A minimum spanning tree | Kruskal or Prim | Matroid exchange axiom |
| Two or more independent resources | Matching or flow | No one-dimensional exchange |
| Decisions arrive online | Competitive analysis | No exchange with the future |

The third row is the one that catches people. Weighted interval scheduling looks like interval scheduling with one extra field, but the exchange that proves the unweighted version replaces an interval without changing the count, while the weighted version has to preserve a sum. The replacement can lose value, so the greedy rule is no longer optimal. The replacement technique is a dynamic program with a binary search for the last compatible interval.

The fifth row is the pairing version. The exchange does not replace an arbitrary member of one set; it replaces the **most urgent** member, the one whose compatibility window closes earliest. That is the same shape as earliest finish: the item with the least room left is the one that must be served first.

## Reference implementations

The manifest publishes six `program` variants, one per language. Every variant implements the same contract.

- The first line contains $n$, with $1 \le n \le 12$.
- The next $n$ lines contain two integers, the start and the end of an interval.
- The output is two integers on the first line, the greedy count and the exhaustive optimum, followed by `MATCH` or `DIFFER` on the second line.

The bound $n \le 12$ belongs to the oracle, not to the greedy. The greedy itself handles the full $500\,000$-interval statement. The reference program is a proof harness, so it deliberately pays the exponential price to obtain a second opinion.

| Language | File | Sort | Notes |
| --- | --- | --- | --- |
| C | `c/program.c` | `qsort` | The comparator compares ends and starts with `<` and `>`, never by subtraction |
| C++ | `cpp17/program.cpp` | `std::sort` | A lambda orders by end and then by start |
| Java | `java/Main.java` | `Arrays.sort` | The class is `Main`; `Interval` implements `Comparable` |
| Python | `python/program.py` | `list.sort` | The key is the pair `(end, start)` |
| Pascal | `pascal/program.pas` | Selection sort | `Int64`, `SysUtils`, one argument per `Read`, no `IOResult` |
| JavaScript | `javascript/program.js` | `Array.prototype.sort` | A numeric comparator; the first line is the educational note |

All six programs print the same bytes on the same input. The fixture file checks three inputs: four overlapping interviews, a chain of touching intervals, and a three-interval case where the shortest-first rule would return the wrong answer while the earliest-finish rule returns the optimum. The `expected` field of each fixture is the exact output, newline included.

The exhaustive half is the same in every language. It loops over the masks from $0$ to $2^n - 1$, counts the selected intervals, and rejects a mask as soon as two selected intervals overlap. The greedy half is the same scan in every language. The differences are only in the sorting call, the input routine, and the integer type.

## Recursion decision

The algorithm is iterative in every language, and so is the oracle.

The greedy scan is a single forward loop. A recursive formulation would pass the free time and the position down the call chain and return the count, which is the same computation with more overhead. The depth would be $n$, which is small, but there is no reason to pay for it.

The exhaustive oracle is naturally described by recursion: for each interval, either take it or skip it, and at the leaf check compatibility. The reference programs use the bitmask form instead. The bitmask has three advantages. It has no call stack, it visits the subsets in a fixed order, and it is easy to transcribe into every language. With $n \le 12$ the mask fits in an `int` and the loop is trivial.

| Language   | Greedy | Oracle  | Verdict                                      |
| ---------- | ------ | ------- | -------------------------------------------- |
| C          | Loop   | Bitmask | No recursion                                 |
| C++        | Loop   | Bitmask | No recursion                                 |
| Java       | Loop   | Bitmask | No recursion                                 |
| Python     | Loop   | Bitmask | No recursion                                 |
| Pascal     | Loop   | Bitmask | No recursion, and no deep stack under pas2js |
| JavaScript | Loop   | Bitmask | No recursion                                 |

The sort may recurse internally in the library implementation. That recursion is logarithmic in practice and is not part of the algorithm's design. The Pascal variant uses a small selection sort so that the listing has no recursion at all and compiles under pas2js without surprises.

The proof itself is an induction, which is a recursive idea, but the induction is in the argument and not in the code. A reader who confuses the two will try to write a recursive greedy and discover that the recursion is not the proof.

## Implementation walkthrough

Five details decide whether the implementation matches the proof.

**The interval convention.** Use half-open intervals $[s, e)$. Two intervals are compatible when one ends at or before the other starts. The scan compares `start >= free_time`, not `start > free_time`, because an interval that starts exactly when the previous one ends is allowed. This single character is the most common source of a wrong answer on the touching case.

**The sort key.** Sort by end time and break ties by start time. The tie-break is not needed for correctness, because intervals with the same end are interchangeable for the exchange, but it makes the output deterministic across languages. The sort must not use the length, the start time alone, or the value.

**The free-time initialization.** Initialize the free time below every possible start, not to zero. A statement may allow negative times, and a zero initialization would silently drop intervals that start before zero. The C and C++ variants use the smallest 64-bit value divided by four; Java uses the same; Python uses a large negative integer; Pascal uses a literal below every possible endpoint; JavaScript uses negative infinity.

**The oracle check.** Two intervals overlap exactly when both `a.end > b.start` and `b.end > a.start`. The code uses the negation, `a.end <= b.start || b.end <= a.start`, which is shorter and avoids a double negation. The mask loop counts selected intervals and stops the pair loop as soon as it finds a conflict.

**The output.** The first line holds the two counts separated by one space. The second line holds `MATCH` or `DIFFER`. Both lines end with a newline. The reference programs do not print a trailing space, so the six outputs are byte-identical after newline normalization.

The C++ core is the shape the other languages copy.

```cpp
std::sort(sorted.begin(), sorted.end(), [](const Interval &a, const Interval &b) {
    if (a.end != b.end) {
        return a.end < b.end;
    }
    return a.start < b.start;
});

int greedy = 0;
long long freeTime = std::numeric_limits<long long>::min() / 4;
for (const Interval &interval : sorted) {
    if (interval.start >= freeTime) {
        ++greedy;
        freeTime = interval.end;
    }
}
```

The Python oracle is the shortest expression of the enumeration.

```python
best = 0
for mask in range(1 << n):
    chosen = [intervals[i] for i in range(n) if (mask >> i) & 1]
    if all(
        chosen[i][1] <= chosen[j][0] or chosen[j][1] <= chosen[i][0]
        for i in range(len(chosen))
        for j in range(i + 1, len(chosen))
    ):
        best = max(best, len(chosen))
```

The Pascal variant reads one value per `Read` call, uses `SysUtils` for `IntToStr`, and avoids `IOResult` and 128-bit integers. The fixed arrays have room for twelve intervals, which is exactly the oracle's bound. The Java variant uses a `Scanner` because the input is at most twelve pairs and readability matters more than parsing speed. The JavaScript variant starts with the required educational note and uses a numeric comparator rather than the default lexicographic one.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Exchanging an arbitrary element instead of the greedy choice | The new solution is feasible but not closer to the greedy solution | Exchange the greedy choice into the first differing position |
| Proving feasibility but not the objective | The swap preserves the constraints and loses value | Compare the objective before and after the swap |
| Proving the objective but not feasibility | The swap preserves the value and breaks a constraint | Check compatibility with the prefix and the suffix |
| Proving only the first step | The first choice is safe, later choices are not | State and use the prefix invariant |
| Using a comparator that is not transitive | The sorted order depends on the sort algorithm | Prove a total preorder before sorting |
| Sorting by the wrong key | The exchange lemma does not apply to the code | Sort by the key the proof uses |
| Treating intervals as closed | Intervals that touch at a point are rejected | Use half-open intervals and `start >= free` |
| Initializing the free time to zero | Negative start times are lost | Initialize below every possible start |
| Using a 32-bit accumulator | Large sums wrap silently | Use 64-bit types where the bounds require them |
| Trusting samples or random tests | A wrong rule passes small cases | Write the brute-force oracle and attempt the proof |

### Why this fails: the weighted interval schedule

The most instructive failure is the one where the exchange preserves the count and loses the value.

| Interval | Start | End | Value |
| -------- | ----- | --- | ----- |
| A        | 0     | 10  | 100   |
| B        | 0     | 3   | 1     |
| C        | 3     | 6   | 1     |

The earliest-finish greedy takes B, then C, and returns a count of 2. The unweighted optimum is also 2, so the count is correct. The weighted optimum is A alone, with total value 100, while the greedy total value is 2.

The exchange that proves the unweighted version replaces A with B and keeps the number of intervals. In the weighted version the same exchange changes the total value from 100 to 1, so the "no worse" step fails. The greedy choice is still the earliest-finishing choice, but the objective is no longer the count. The correct algorithm is a dynamic program over the intervals sorted by finish time, with a binary search for the last compatible interval.

The general lesson is that the exchange must preserve the **actual objective**, not a proxy for it.

### Why this fails: the shortest interval

The second classic failure is the shortest-interval rule.

| Interval | Start | End | Length |
| -------- | ----- | --- | ------ |
| A        | 10    | 11  | 1      |
| B        | 1     | 5   | 4      |
| C        | 5     | 11  | 6      |

The earliest-finish greedy takes B, then C, for a count of 2. The shortest-first rule takes A first. A ends at 11, so neither B nor C can follow, and the count is 1.

The exchange attempt fails at the feasibility step. If the optimal schedule is $\{B, C\}$ and the greedy-like choice is A, replacing B with A leaves A ending at 11, while C starts at 5. The replacement is not compatible with the rest of the schedule. The earliest-finish choice works because it ends no later than the interval it replaces; the shortest choice gives no such guarantee.

### Why this fails: a comparator without transitivity

Suppose three items have the pairwise preferences $a \prec b$, $b \prec c$, and $c \prec a$, like a rock-paper-scissors relation. Every adjacent pair can be ordered so that swapping the other way does not help, and yet there is no globally best order. A sorting algorithm may return $a, b, c$, or $b, c, a$, or $c, a, b$, depending on its internal choices.

The exchange argument assumes that the comparator is a total preorder. Without transitivity, "the first inversion" is not well-defined, the number of inversions can fail to decrease, and the proof does not terminate. The fix is to prove transitivity before writing the comparator, or to sort by a tuple of keys that is lexicographic and therefore transitive by construction.

## Variants and extensions

- **Adjacent exchange and sorting comparators.** When the solution is an ordering, the exchange swaps two adjacent items. The comparator is derived by solving the two-item case symbolically. Cow Acrobats is the canonical example: the pair contributes two risks, and the algebra reduces to comparing $w_i + s_i$ with $w_j + s_j$.
- **Greedy matching with urgency.** When two sets are paired and each item has a window of compatibility, process one set in time order and choose the available item whose window closes earliest. The exchange swaps the urgent item into the current slot and pushes the other item to a later slot, where its wider window still fits.
- **Rearrangement inequality.** When two sequences are paired position by position, the optimal pairing is sorted with sorted. The exchange swaps two assignments and factors the change into a product of differences.
- **Matroid greedy.** Kruskal's algorithm and the maximum-weight independent set in a matroid rely on the matroid exchange axiom: if one independent set is larger than another, an element can be moved from the larger to the smaller while preserving independence. The axiom is the exchange property in algebraic form.
- **Scheduling to minimize maximum lateness.** Sort jobs by deadline. The exchange swaps two adjacent jobs and shows that the maximum lateness does not increase when the earlier deadline comes first. This is the one-machine scheduling rule behind the earliest-deadline-first policy.
- **Huffman coding.** The two least frequent symbols can be exchanged to the bottom of the code tree without increasing the cost, which justifies merging them first. The exchange is on a tree rather than a sequence.
- **Greedy stays ahead.** An alternative proof compares the greedy partial solution with an arbitrary partial solution step by step. It is often easier for online-style arguments, while exchange is often easier when the final solution has a clean combinatorial description.
- **Local search.** An exchange argument also proves that a local optimum is global for certain matroids and convex objectives. The same swap is used as both a proof step and an optimization move.
- **Dynamic programming after a failed exchange.** When no swap preserves the objective, the problem usually has overlapping subproblems. Weighted interval scheduling, 0/1 knapsack, and the assignment problem are the standard destinations.
- **Online versions.** When the input arrives one item at a time, an exchange with a future choice is impossible. The analysis changes to competitive ratios against an offline optimum.

## Contest strategy

Under contest pressure, the exchange argument is a checklist as much as a proof.

1. State the greedy rule in one sentence, including the key it sorts on and the tie-break.
2. Write the brute-force oracle for small $n$ before optimizing. It is the fastest way to find a counterexample to a plausible rule.
3. Run the oracle and the greedy on every small input you can generate. A disagreement is a counterexample; study it before changing the rule.
4. Attempt the exchange: take an optimal solution, find the first difference from the greedy, and swap the greedy choice in.
5. Check feasibility first, then the objective. A swap that preserves only one of them is not an exchange proof.
6. Define the progress measure. The common prefix, the number of inversions, or the number of misplaced items must strictly improve and must be bounded.
7. If the exchange fails, identify which hypothesis fails. If it is the objective, the problem is probably weighted and needs a dynamic program. If it is feasibility, the problem probably has a second resource and needs a matching or a flow.
8. Check the comparator for transitivity, the interval convention for touching endpoints, and the accumulator for overflow.
9. Keep the oracle in the repository as a regression test. The six reference programs in this article are exactly that idea, written once per language.

The last step is the one that pays off after the contest. A proof explains why the rule works; a small oracle catches the day when a refactor breaks the implementation of the proof.

## Worked problems

### Problem 1: Cow Acrobats

**Restatement.** $n$ cows each have a weight $w_i$ and a strength $s_i$. The cows form a vertical stack. The risk of a cow is the total weight above her minus her strength. Find the ordering that minimizes the maximum risk. Constraints: $1 \le n \le 50\,000$, $1 \le w_i \le 10\,000$, $1 \le s_i \le 10^9$.

**Naive baseline.** Try all $n!$ orderings and compute the maximum risk of each. This is correct for tiny $n$ and hopeless for $n = 50\,000$.

**Insight.** Only two adjacent cows need to be compared. The total weight above the pair and the total weight below the pair do not change when the pair is swapped, so the decision is local. The pair order that puts cow $i$ above cow $j$ is no worse exactly when $w_i + s_i \le w_j + s_j$.

**Derivation.** Sort the cows by $w_i + s_i$ ascending from top to bottom. Sweep the stack from the top, keep the total weight above the current cow, and compute $\text{above} - s_i$. The answer is the largest of those risks.

**Correctness.** Let $W$ be the weight above the pair. With $i$ above $j$, the two risks are $W - s_i$ and $W + w_i - s_j$. With $j$ above $i$, they are $W - s_j$ and $W + w_j - s_i$. If $w_i + s_i \le w_j + s_j$, then $W + w_i - s_j \le W + w_j - s_i$, and both risks of the first order are at most $W + w_j - s_i$, which is one of the risks of the second order. Therefore the first order has no larger maximum. An optimal order with an adjacent inversion can be improved or kept equal by swapping the inversion, so sorting by $w_i + s_i$ is optimal.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, dominated by the sort.

**Common wrong approach.** Sorting by weight alone, or by strength alone. A very strong but light cow belongs lower than a heavy but weak cow, and neither key alone captures the trade-off.

### Problem 2: Why Did the Cow Cross the Road

**Restatement.** There are $C$ chickens, where chicken $i$ is available only at time $T_i$, and $N$ cows, where cow $j$ can cross during the interval $[A_j, B_j]$. A cow and a chicken can be paired when $A_j \le T_i \le B_j$. Each chicken and each cow can be used at most once. Maximize the number of pairs. Constraints: $1 \le C, N \le 20\,000$, times up to $10^9$.

**Naive baseline.** Enumerate all matchings, which is exponential, or try every pair repeatedly, which is $O(CN)$ and too slow at $20\,000$ each.

**Insight.** Process the chickens in increasing time. A cow becomes available when its start time is at most the current chicken time, and it expires at its end time. Among the available cows, the one that expires earliest is the most urgent, so it should get the current chicken.

**Derivation.** Sort the cows by start time and the chickens by time. Sweep the chickens. Add every cow whose start is at most the current chicken time to a min-heap keyed by end time. Remove the cows whose end is before the current time, because they have expired. If the heap is nonempty, pair the chicken with the cow at the top of the heap and increment the answer.

**Correctness.** Suppose an optimal matching agrees with the greedy on all earlier chickens, but pairs the current chicken with cow $x$ instead of the greedy cow $y$, which is available and has the smallest end time. If $y$ is unmatched, replace $x$ by $y$; $y$ is compatible with the current chicken and the number of pairs is unchanged. If $y$ is matched to a later chicken $t'$, swap the two cows: $y$ takes the current chicken, and $x$ takes $t'$. Cow $x$ is compatible with $t'$ because $A_x \le t < t'$ and $B_x \ge B_y \ge t'$. The number of pairs is unchanged. Therefore an optimal matching can be made to agree with the greedy at this chicken, and induction finishes the proof.

**Complexity.** $O((C + N) \log N)$ time and $O(N)$ space. Sorting both lists costs $O(C \log C + N \log N)$, and every cow enters and leaves the heap at most once.

**Common wrong approach.** Pair each chicken with the first available cow, or with the cow whose start is latest. The first rule wastes a cow that could have waited for a later chicken, and the second rule ignores the expiration time.

### Problem 3: Little Girl and Maximum Sum

**Restatement.** An array of $n$ values is given, together with $q$ queries $[l_i, r_i]$. The array may be permuted before the queries are answered. Maximize the sum of the answers to all queries. Constraints: $1 \le n, q \le 200\,000$, values up to $200\,000$.

**Naive baseline.** Try all $n!$ permutations and evaluate all $q$ queries for each. The number of permutations is astronomical, and even a single evaluation costs too much if repeated.

**Insight.** The total is a weighted sum. Position $p$ contributes its value once for every query that covers $p$, so its coefficient is the coverage count $c_p$. The problem is to pair the values with the coverage counts to maximize $\sum a_i c_{\pi(i)}$. By the rearrangement inequality, the largest value should get the largest coefficient.

**Derivation.** Build a difference array over the positions. For each query $[l, r]$, add one at $l$ and subtract one at $r + 1$. Take the prefix sum to obtain every $c_p$. Sort the values and the coverage counts ascending, multiply them position by position, and add the products in a 64-bit accumulator.

**Correctness.** If an assignment has $a_i > a_j$ but $c_i < c_j$, swapping the two values changes the total by $(a_i - a_j)(c_j - c_i) > 0$, so the assignment was not optimal. Therefore an optimal assignment has no such inversion, which means the values and the counts are paired in the same sorted order. The difference array computes each coverage count exactly once, because a position is covered by a query exactly when the prefix of the difference array at that position includes the query's add and not yet its subtraction.

**Complexity.** $O((n + q) \log n)$ time and $O(n)$ space. The difference array and its prefix sum are linear, the two sorts dominate, and the dot product is linear. The answer needs a 64-bit accumulator.

**Common wrong approach.** Sorting only the values and leaving the coverage counts in position order. That is the identity pairing, which can be far from optimal when the query coverage is uneven. A second common mistake is using a 32-bit accumulator, which overflows on the largest tests.

## Practice progression

1. **Recognition.** Given a statement, decide whether the solution is a set, a sequence, or a pairing, and whether a greedy commitment can be exchanged into an optimal solution. Check the objective first: counts are friendlier than weighted sums.
2. **Direct application.** Implement the earliest-finish greedy and the exhaustive oracle, and compare them on every small input. The reference program in this article is the template.
3. **Proof.** Write the exchange lemma for the interval problem from memory, including the feasibility check and the objective check. Then write the induction that turns the lemma into the theorem.
4. **Comparator.** Derive the two-item comparison for Cow Acrobats, and prove that the comparator is transitive. Sort by the resulting key and compare with the brute-force oracle on small stacks.
5. **Matching and rearrangement.** Prove the urgency rule for the chicken-and-cow problem and the rearrangement inequality for the query-coverage problem. Both are exchanges with a different feasibility argument.
6. **Transfer.** Find the exchange in Kruskal's algorithm, in earliest-deadline-first scheduling, and in Huffman coding. Each uses the same four beats with a different local edit.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four beats of an exchange proof? (At a glance)
2. What does the exchange property say, and what does the prefix invariant add? (Formal model)
3. Why does the earliest-finishing interval leave at least as much room as the interval it replaces? (Correctness proof)
4. Why is the family of schedules hereditary, and where is heredity used at the end of the proof? (Correctness proof)
5. What is the measure of progress for the interval proof, and what is it for the sorting proof? (Key insight)
6. Why does the weighted interval problem break the exchange? (Common mistakes)
7. Give the three-interval counterexample to the shortest-first rule. (Common mistakes)
8. Why must a sorting comparator be transitive? (Formal model and Common mistakes)
9. How does the Cow Acrobats comparison reduce to $w_i + s_i$? (Worked problems)
10. Why does the chicken-and-cow greedy choose the cow with the earliest end time? (Worked problems)
11. Why does the rearrangement inequality pair the largest value with the largest coefficient? (Worked problems)
12. What does the exhaustive oracle prove, and what does it fail to prove? (Naive approach and Complexity analysis)
13. Why is the oracle limited to $n \le 12$ while the greedy is not? (Reference implementations)
14. What does a `DIFFER` line tell you, and what does a `MATCH` line not tell you? (At a glance and Naive approach)

## Further reading

- The interval scheduling article develops the earliest-finish rule and its counterexamples in full: [interval scheduling](/algorithms/greedy/interval-scheduling).
- The greedy-with-a-feasibility-oracle article shows the same exchange idea for the lightest-first rule and the prefix-sum oracle: [greedy with a feasibility oracle](/algorithms/greedy/feasibility-oracle).
- The multi-key sorting article develops the comparator side of the argument: [multi-key sorting](/algorithms/greedy/multi-key-sorting).
- The deadline-and-release-time article uses an exchange to justify the latest-free-slot rule: [scheduling with deadlines and release times](/algorithms/greedy/scheduling-deadlines-and-release-times).
- The sorting article covers the ordering primitives that every comparator proof relies on: [sorting](/algorithms/foundations/sorting).
- The loop-invariants article explains the prefix invariant used in the induction: [loop invariants](/algorithms/foundations/loop-invariants).
- The minimum spanning tree article is the matroid version of the exchange argument: [minimum spanning tree](/algorithms/graphs/mst).
- The dynamic-programming alternative for the weighted version is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The binary search that finds the last compatible interval in the weighted version is [binary search](/algorithms/searching/binary-search).
- The Fenwick tree used to compute coverage counts or matching quantities in linear-ish time is [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- Every listing in this article, in all six languages, is collected on the [exchange argument source page](/implementations/greedy-exchange-argument/).
