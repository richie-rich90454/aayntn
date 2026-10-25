---
id: enumeration.meet-in-the-middle
title: Meet in the middle
summary: Split an exponential search into two halves, enumerate the states of each half, and combine them with sorting and binary search.
division: [gold, platinum]
subjects: [enumeration]
level: advanced
importance: common-contest-technique
keywords: [meet in the middle, split and list, half enumeration, subset sums, bidirectional search]
prerequisites:
    required: [enumeration.subset-enumeration, searching.binary-search]
    recommended: [foundations.sorting, foundations.complexity]
complexity:
    time: "O(n 2^(n/2))"
    space: "O(2^(n/2))"
assumptions:
    - The predicate can be decided from a summary of each half, so the halves can be summarized independently.
    - Each half has at most about 20 items, so the complete enumeration of a half fits in memory.
implementations: enumeration.meet-in-the-middle
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/enumeration.meet-in-the-middle.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

Meet in the middle pays for an exponential search in two installments. Split the $n$ decisions into two halves of about $n/2$ each, enumerate every state of each half on its own, and then match the two lists against each other. The enumeration cost falls from $2^n$ to $2^{n/2}$, and the matching is usually a sort followed by a binary search.

The technique is four decisions, and every variant in this article changes one of them.

1. **Where to split.** The halves must be a partition of the original choices, so that every complete state is exactly one pair of half-states.
2. **What to record.** Each half must be summarized by the value that the matching condition needs: a sum, a signed sum, a remainder, a mask.
3. **How to store the right half.** Sorting turns "how many satisfy $b \le t$" into a prefix length; hashing turns "which entries equal $t$" into a lookup.
4. **How to combine.** A counting problem needs a count of partners, an optimization problem needs the best partner, and an existence problem can stop at the first one.

The arithmetic is the reason to learn it. $2^{40} \approx 1.1 \times 10^{12}$ and $2^{20} = 1\,048\,576$. Halving the exponent divides the work by about a million, which is the difference between three hours and a fraction of a second at $10^8$ states per second.

Meet in the middle is neither pruning nor reuse. [Backtracking](/algorithms/enumeration/backtracking) removes branches that cannot succeed; a dynamic program such as [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) reuses overlapping subproblems. Meet in the middle does neither. It reorganizes the same complete search so that the two halves can be solved separately, and it wins whenever the condition on a complete state can be checked from one summary of each half.

## Problem motivation

Given $n \le 40$ integers $a_0, \ldots, a_{n-1}$ with $0 \le a_i \le 10^9$, and a limit $W \le 4 \cdot 10^{10}$, count the subsets whose sum is at most $W$. The empty subset is a subset, and its sum is $0$.

The direct method tests all $2^{40}$ subsets. At $10^8$ subset tests per second, that is about $11\,000$ seconds, or three hours, and the program would be killed by the time limit long before it finished.

The dynamic program does not rescue the problem either. A table indexed by the achievable sums has $W + 1$ entries, and $W$ can be $4 \cdot 10^{10}$, so the table is far larger than memory: at $8$ bytes per counter it is about $320$ GB.

Split the values into a left half of $20$ and a right half of $20$. Enumerate the $2^{20}$ subset sums of each half, sort the right list, and for every left sum $a$ count the right sums $b$ with $b \le W - a$. The work is two enumerations of about a million states, one sort of a million values, and a million binary searches. That finishes comfortably in one second in C++ and in a few seconds in Python, and the answer is exact.

The problem is the contract of the six programs in this topic. Every later variant changes the summary or the combination, never the shape of the split.

## Recognition patterns

Meet in the middle is the right tool when all of the following hold.

- **The count of complete states is too large, but its square root is not.** The typical bound is $30 \le n \le 46$, where $2^n$ is hopeless and $2^{n/2}$ is between $3 \cdot 10^4$ and $8 \cdot 10^6$.
- **The choices are independent per item.** Each item is taken or not, assigned to one of two groups, or given one of a small number of labels.
- **The condition decomposes.** A sum, an XOR, a difference, or a count of chosen items can be computed from one summary of each half and combined with an associative operation.
- **One half can be indexed.** The relation between the two summaries is equality, a bound, or a nearest-value query, so sorting or hashing the second list answers each query quickly.

The table below is the arithmetic that decides the technique before any code is written.

| $n$ | $2^n$ | $2^{n/2}$ | Verdict |
| --- | --- | --- | --- |
| $20$ | $1.05 \times 10^6$ | $1\,024$ | Plain subset enumeration is enough |
| $30$ | $1.07 \times 10^9$ | $32\,768$ | Meet in the middle is comfortable |
| $40$ | $1.10 \times 10^{12}$ | $1\,048\,576$ | The canonical meet in the middle range |
| $44$ | $1.76 \times 10^{13}$ | $4\,194\,304$ | Feasible, but memory becomes the limit |
| $46$ | $7.04 \times 10^{13}$ | $8\,388\,608$ | Near the practical limit of a 256 MB budget |
| $50$ | $1.13 \times 10^{15}$ | $33\,554\,432$ | Too large for two full lists; look for another structure |

The phrases in a statement that signal the technique are "at most 40", "count the subsets with sum $x$", "the maximum total not exceeding $T$", "choose two groups with equal sums", and "closest to". The phrase that rules it out is a condition that needs the whole subset at once, such as "the chosen cells must be connected" or "no two chosen intervals may overlap": a per-half summary cannot carry that.

Three other situations rule the technique out.

- **$n \le 20$.** A single enumeration of $2^n$ states is smaller than two enumerations plus a sort, and the code is shorter.
- **The target is small.** If $W \le 10^6$, the $O(nW)$ [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) is polynomial and beats an exponential search.
- **Every solution must be listed.** Meet in the middle counts or optimizes well, but reconstructing all solutions from the halves multiplies the output size by the number of combinations, and [backtracking](/algorithms/enumeration/backtracking) is the natural tool.

## Naive approach

The baseline enumerates every subset with a mask and tests it at the leaf.

```python
def count_subsets(values, limit):
    total = 0
    for mask in range(1 << len(values)):
        running = 0
        for i, value in enumerate(values):
            if (mask >> i) & 1:
                running += value
        if running <= limit:
            total += 1
    return total
```

This is correct for every input and costs $O(n\,2^n)$. At $n = 40$ the outer loop runs $1.1 \times 10^{12}$ times, so the program does not finish.

The second baseline is a recursive search that prunes a branch when the partial sum has already exceeded the limit. With non-negative values this is often fast, and for some instances it beats meet in the middle. It has two problems. The worst case is still $2^n$, because a limit larger than the total sum prunes nothing, and the pruning is unsound when the values may be negative, because a negative value can bring an already oversized partial sum back below the limit. A technique that is fast on the test data and exponential in the statement is not a solution.

The third baseline is the dynamic program over the achievable sums. It is the right answer whenever the limit is small, and it is unavailable here because the limit is $4 \cdot 10^{10}$.

## Key insight

Every subset $S$ of the $n$ items has exactly one decomposition

$$
S = S_L \cup S_R, \qquad S_L \subseteq L, \quad S_R \subseteq R,
$$

where $L$ is the first half of the indices and $R$ is the second half. The two parts are disjoint, so the sum splits as well:

$$
\sigma(S) = \sigma(S_L) + \sigma(S_R).
$$

Therefore "count the subsets with sum at most $W$" is the same question as "count the pairs of a left subset and a right subset whose sums add to at most $W$". The number of pairs is still $2^n$, but the pairs are no longer enumerated together. Each half is enumerated once, and the pairing is a query against a sorted list.

That is the whole idea. The left half produces a list of $2^{20}$ sums, the right half produces another list of $2^{20}$ sums, and for each left sum $a$ the number of valid right sums is the number of entries at most $W - a$. Sorting the right list makes that number a boundary, and a binary search finds the boundary in $20$ comparisons.

Two details carry the correctness. The left list has **one entry per subset**, not one entry per distinct sum, so duplicate sums from different subsets remain separate entries and are counted separately. And the split is by **index**, not by value, so equal values in different halves stay distinguishable and no subset is lost or counted twice.

The exponent is what changed, and it changed from $n$ to $n/2$. No constant-factor optimization of the naive loop can compete with that.

## Visual intuition

Draw the $40$ items as one row and cut the row in the middle.

```text
items      0 .................... 19 | 20 .................... 39
subsets              2^20            |            2^20
sums       0, ..., a, ...            |   0, ..., b, ...  (sorted)

for each left sum a:
           a  --------------------------->  how many right sums are <= W - a?
                                             ^
                                             the boundary found by binary search
```

The left list is unsorted and is read once, in any order. The right list is sorted once and then queried $2^{20}$ times. Each query is a threshold $t = W - a$, and the answer is the length of the prefix of the right list whose entries are at most $t$.

The boundary has a monotonicity that is easy to see in the picture. If the left sums are visited in increasing order, the threshold $W - a$ decreases, so the boundary only moves left. That is the two-pointer combine: one pass over the left list and one backward pass over the right list count the same pairs without any binary search. It needs both lists sorted, and it is the faster combine when sorting both is affordable.

The picture also shows why the sorted list must keep duplicates. If the right half contains two different subsets with sum $5$, the value $5$ appears twice, and a threshold of $5$ must count both. Replacing the list with a set erases one of them and the final count is too small.

## Formal model

Let $A = (a_0, a_1, \ldots, a_{n-1})$ be the values, and let $m = \lfloor n/2 \rfloor$. Define the index sets

$$
L = \{0, 1, \ldots, m-1\}, \qquad R = \{m, m+1, \ldots, n-1\}.
$$

For a set $X$ of indices, write $\sigma(X) = \sum_{i \in X} a_i$, with $\sigma(\varnothing) = 0$.

::: math definition Definition
A **split** of the instance is the pair $(L, R)$. A **half-state** is a subset of one half, and its **summary** is $\sigma(X)$. The **left list** is $\Lambda = (\sigma(X))_{X \subseteq L}$ and the **right list** is $B = (\sigma(Y))_{Y \subseteq R}$, each with one entry per subset, so that $|\Lambda| = 2^{|L|}$ and $|B| = 2^{|R|}$.
:::

::: math definition Definition
A predicate $P$ on subsets is **separable** over the split if there is a predicate $Q$ with

$$
P(S) \iff Q\bigl(\sigma(S \cap L),\; \sigma(S \cap R)\bigr)
$$

for every subset $S \subseteq \{0, \ldots, n-1\}$. For the count-at-most problem, $Q(a, b)$ is $a + b \le W$.
:::

Some variants carry an identifier next to the summary: a bitmask of the chosen items, a multiplicity, or the position of a split. The bijection and the matching argument do not change; only the amount of data stored per entry grows.

::: math lemma Lemma
The map $S \mapsto (S \cap L,\; S \cap R)$ is a bijection between the subsets of $\{0, \ldots, n-1\}$ and the pairs $(X, Y)$ with $X \subseteq L$ and $Y \subseteq R$.
:::

::: math definition Definition
For a sorted list $B = (b_0 \le b_1 \le \cdots \le b_{k-1})$ and a threshold $t$, let

$$
\rho_B(t) = \bigl|\{\, j : b_j \le t \,\}\bigr|.
$$

This is the length of the prefix of $B$ that is at most $t$, which is exactly what `upper_bound` returns.
:::

::: math invariant Invariant
Before the $i$-th iteration of the combine loop, with the left list visited in its stored order, the accumulated total equals

$$
\sum_{j < i} \rho_{B}\bigl(W - \Lambda[j]\bigr).
$$

After the last iteration the total is the sum over every left entry, which the theorem below identifies with the answer.
:::

## Algorithm derivation

The algorithm is three loops: build the left list, build the right list, and combine. The builds are the same function on different halves.

```text
function count_at_most(values, limit):
    m = length(values) / 2
    left  = subset_sums(values[0 : m])
    right = subset_sums(values[m : length(values)])
    sort(right)
    answer = 0
    for a in left:
        answer += upper_bound(right, limit - a)
    return answer
```

The enumeration of one half uses doubling rather than a mask loop.

```python
def subset_sums(values):
    sums = [0]
    for value in values:
        sums += [s + value for s in sums]
    return sums
```

The doubling is correct because the list always holds one entry per subset of the items processed so far. When the next item arrives, every old subset either excludes it, keeping its old sum, or includes it, contributing the old sum plus the item. The old entries are the exclude branch, the appended entries are the include branch, and together they are every subset of the larger prefix exactly once.

The combine uses `upper_bound`, which returns the first index whose entry is strictly greater than the threshold. All entries before that index are at most the threshold, so the index itself is $\rho_{B}(t)$.

The same skeleton answers the other common questions by changing one line.

- **Exactly $T$:** `upper_bound(right, T - a) - lower_bound(right, T - a)`, which counts the entries equal to the threshold. The list must keep duplicates.
- **The maximum sum at most $W$:** for each $a$, find the largest $b \le W - a$ with a predecessor search, and keep the maximum of $a + b$.
- **The sum closest to $W$:** find the insertion point of $W - a$, then check that entry and the one before it.
- **Does a pair exist:** stop at the first non-empty range or the first hit.

::: math invariant Invariant
At the start of each build step, the list holds one entry per subset of the items already processed, and the entry for a subset is its sum. At the start of each combine iteration, the answer holds the number of valid pairs whose left entry has already been processed.
:::

## Step-by-step execution

Take $n = 5$, $W = 5$, and values $[1, 2, 3, 4, 5]$. The split is $L = [1, 2]$ and $R = [3, 4, 5]$.

1. **Build the left list.** Start with $[0]$. After $1$: $[0, 1]$. After $2$: $[0, 1, 2, 3]$. The four entries are the sums of $\varnothing$, $\{1\}$, $\{2\}$ and $\{1,2\}$.
2. **Build the right list.** Start with $[0]$. After $3$: $[0, 3]$. After $4$: $[0, 3, 4, 7]$. After $5$: $[0, 3, 4, 7, 5, 8, 9, 12]$.
3. **Sort the right list.** It becomes $[0, 3, 4, 5, 7, 8, 9, 12]$. The order of equal sums does not matter; when equal sums occur, they stay as separate entries, one per right subset.
4. **Combine with $a = 0$.** The threshold is $5$. The entries $0, 3, 4, 5$ are at most $5$, so `upper_bound` returns $4$.
5. **Combine with $a = 1$.** The threshold is $4$. The entries $0, 3, 4$ qualify, so the count is $3$.
6. **Combine with $a = 2$.** The threshold is $3$. The entries $0, 3$ qualify, so the count is $2$. Note that the entry equal to the threshold is included.
7. **Combine with $a = 3$.** The threshold is $2$. Only $0$ qualifies, so the count is $1$.
8. **Total.** $4 + 3 + 2 + 1 = 10$.

The direct count agrees. The thirty-two subsets of $[1,2,3,4,5]$ have subset-sum multiplicities

$$
1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1
$$

for sums $0, 1, \ldots, 15$, so the number of sums at most $5$ is $1 + 1 + 1 + 2 + 2 + 3 = 10$.

Two moments in the trace are worth naming. At step 6 the threshold equals an entry, and `upper_bound` includes it while `lower_bound` would not; that single equality is the difference between the correct answer and the failure worked through below. At step 4 the left entry $0$ represents the empty left subset, and the four right entries counted are all the right subsets that fit under the limit on their own; the empty subset of the whole instance is the pair of two empty halves and is counted exactly once.

## Correctness proof

::: math theorem Theorem
For the count-at-most predicate $P(S) \iff \sigma(S) \le W$, the algorithm returns the number of subsets with sum at most $W$ in $O(n\,2^{n/2})$ time and $O(2^{n/2})$ space.
:::

::: math proof Proof
**The enumeration is complete and duplicate-free.** By induction on the number of processed items, the list contains one entry per subset of the processed prefix. The base case is the empty prefix, whose only subset is $\varnothing$ with sum $0$. For the step, let the old list be $\Lambda$ over the subsets of the first $k$ items. The new list is $\Lambda$ followed by $\Lambda + a_k$. A subset of the first $k+1$ items either excludes item $k$, in which case it is an old subset with its old sum, or includes item $k$, in which case removing item $k$ leaves an old subset and the sum is the old sum plus $a_k$. The two cases are disjoint and cover every subset exactly once, so the new list has one entry per subset and the right sum.

**Soundness.** Each pair counted by the combine consists of a left subset $X$ and a right subset $Y$ with $\sigma(X) + \sigma(Y) \le W$. By the bijection, $S = X \cup Y$ is a subset of the instance, and $\sigma(S) = \sigma(X) + \sigma(Y)$, so $S$ satisfies the predicate.

**Completeness.** Let $S$ be a subset with $\sigma(S) \le W$. Its left part $X = S \cap L$ appears in the left list with sum $a = \sigma(X)$, and its right part $Y = S \cap R$ appears in the right list with sum $b = \sigma(Y)$. The threshold at that iteration is $W - a$, and $b \le W - a$, so $Y$'s entry lies in the prefix that `upper_bound` counts. The pair is therefore counted.

**No double counting.** By the bijection, distinct subsets give distinct pairs, and distinct pairs give distinct unions $X \cup Y$. The combine visits each left entry exactly once and, for each, counts each qualifying right entry exactly once. Hence every valid subset contributes exactly one to the total.

**The binary search.** On a sorted list, the loop maintains that every index below `lo` is at most the threshold and every index at or above `hi` is greater. When `lo = hi`, the indices below it are exactly the qualifying prefix, so the returned index is $\rho(t)$. $\square$
:::

::: math proof Proof
The combine loop terminates because the left list is finite, and the invariant is preserved by adding $\rho(W - \Lambda[i])$ at iteration $i$. After the final iteration the invariant covers every index of the left list. The bijection and the two directions above turn that sum into the number of valid subsets. $\square$
:::

## Complexity analysis

**Building one list.** If a half has $k$ items, the doubling loop performs $1 + 2 + 4 + \cdots + 2^{k-1} = 2^k - 1$ additions and stores $2^k$ values. Both halves together cost $O(2^{n/2})$ additions.

**Sorting.** The right list has $2^{\lceil n/2 \rceil}$ entries, so comparison sorting costs $O(2^{n/2} \log 2^{n/2}) = O(n\,2^{n/2})$.

**Combining.** There are $2^{\lfloor n/2 \rfloor}$ left entries, and each binary search costs $O(\log 2^{n/2}) = O(n)$, so the combine costs $O(n\,2^{n/2})$.

**Total.** $O(n\,2^{n/2})$ time and $O(2^{n/2})$ space. For $n = 40$ that is about $40$ million elementary comparisons and two lists of $1\,048\,576$ 64-bit values, which is $16$ MB of payload.

The table gives the numbers that decide whether the technique fits the judge.

| $n$  | Entries per half | Payload of both lists | Sort plus searches  | Comment                  |
| ---- | ---------------- | --------------------- | ------------------- | ------------------------ |
| $30$ | $32\,768$        | $0.5$ MB              | About $1$ million   | Trivial                  |
| $40$ | $1\,048\,576$    | $16$ MB               | About $40$ million  | Comfortable              |
| $44$ | $4\,194\,304$    | $64$ MB               | About $180$ million | Watch the memory limit   |
| $46$ | $8\,388\,608$    | $128$ MB              | About $390$ million | Near the practical limit |
| $48$ | $16\,777\,216$   | $256$ MB              | About $800$ million | Usually too much         |

The width of the accumulator is part of the complexity statement. With $40$ values of magnitude $10^9$, a subset sum reaches $4 \cdot 10^{10}$, which does not fit in a signed 32-bit integer, and the count of subsets reaches $2^{40} \approx 1.1 \times 10^{12}$, which does not fit either. The reference programs use a 64-bit type for both the sums and the answer. JavaScript is the exception: its `Number` holds every integer up to $2^{53}$, so both quantities are exact.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| $n \le 20$, count or enumerate the subsets | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| $n \le 40$, an additive condition on subsets | Meet in the middle |
| $n \le 40$, every solution must be printed | [Backtracking](/algorithms/enumeration/backtracking) |
| $n \le 40$, an optimization with a bound | Meet in the middle with a predecessor search |
| $n \le 40$, an existence question | Meet in the middle with early exit, or a hash set |
| $n$ larger and the target small | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| The chosen elements must be contiguous | [Two pointers](/algorithms/arrays/two-pointers) or prefix sums |
| The condition involves pair sums of four lists | Pair-sum meet in the middle over the four lists |
| The search is over graph states with a known target | Bidirectional breadth-first search |
| A bound can rule out partial solutions cheaply | [Branch and bound](/algorithms/enumeration/branch-and-bound) |

The distinction between the fourth and the last row matters. Branch and bound explores one search tree and uses a bound to skip subtrees; it is the right tool when the bound is strong and the tree is sparse. Meet in the middle builds two complete lists and has no bound at all; it is the right tool when the two lists are affordable even though the whole search is not.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal, and JavaScript. There is no reusable minimal variant, because the algorithm is short enough that the whole program is the reference: each file reads the same input, performs the same doubling enumeration, sorts the right half, and prints the same line.

The contract is fixed across all six files.

- **Input:** `n W` on the first line, then $n$ integers.
- **Output:** one integer on one line, the number of subsets whose sum is at most $W$.
- **Assumptions:** $1 \le n \le 40$, $0 \le a_i \le 10^9$, $0 \le W \le 4 \cdot 10^{10}$, and the empty subset is counted.

The language-specific choices are narrow. C uses `qsort` and two static arrays of $2^{20}$ `long long` values. C++17 uses `std::vector`, `std::sort` and `std::upper_bound`. Java reads with `Scanner`, uses `long[]`, `Arrays.sort` and a hand-written `upperBound` that shifts with `>>>`. Python uses list doubling, `list.sort` and `bisect_right`, which keeps the million searches inside the C implementation of the module. Pascal uses dynamic arrays of `Int64`, a merge sort with a reusable buffer, and a binary search. JavaScript uses a numeric comparison in `sort` and a hand-written `upperBound`, because the default sort compares strings.

All six are marked `unverified` until the validation job compiles them and compares their output on the shared fixtures. The C, C++, Java and Pascal versions use 64-bit integers for the running sums and for the answer; Python integers and JavaScript `Number` are exact at these bounds.

## Recursion decision

The enumeration of one half has depth at most $20$, so the recursive include-or-exclude form is safe in every language. The listed programs use the iterative doubling form instead, and the reason is the number of calls rather than the stack.

| Language   | Default stack              | Practical depth         | Verdict for depth $20$ |
| ---------- | -------------------------- | ----------------------- | ---------------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Recursion is safe      |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Recursion is safe      |
| Python     | Interpreter limit of 1000  | 1000 frames             | Recursion is safe      |
| Pascal     | The operating system stack | Depends on the platform | Recursion is safe      |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Recursion is safe      |

The stack is not the problem. The recursive form visits $2^{k+1} - 1$ call nodes for a half of $k$ items, while the doubling loop writes $2^k$ values and performs $2^k - 1$ additions. At $k = 20$ the recursion makes about two million calls instead of one million additions, and the call overhead is the whole cost difference.

The recursive form is still worth writing once, because it makes the subset structure obvious:

```python
def subset_sums(values, index=0, running=0, out=None):
    if out is None:
        out = []
    if index == len(values):
        out.append(running)
        return out
    subset_sums(values, index + 1, running, out)
    subset_sums(values, index + 1, running + values[index], out)
    return out
```

The combine loop has no recursive form worth writing. It is a single pass over the left list, and the binary search is already a loop.

## Implementation walkthrough

Three details decide whether the program is right.

**The doubling write must not overlap the read.** The old entries occupy `[0, size)` and the new entries occupy `[size, 2 * size)`, so the loop reads a value and writes to a position that has not been read yet:

```cpp
std::vector<long long> sums{0};
for (long long value : half) {
    const std::size_t size = sums.size();
    sums.resize(size * 2);
    for (std::size_t i = 0; i < size; ++i) {
        sums[size + i] = sums[i] + value;
    }
}
```

Growing the vector one element at a time, or writing into the same range that the loop is reading, turns the enumeration into a different and wrong recurrence.

**The combine uses `upper_bound` for "at most".** `upper_bound` returns the first entry strictly greater than the threshold, so the entries before it are at most the threshold. `lower_bound` returns the first entry at least the threshold, which drops the entries equal to it:

```cpp
std::sort(right.begin(), right.end());
long long answer = 0;
for (long long a : left) {
    answer += std::upper_bound(right.begin(), right.end(), limit - a) - right.begin();
}
```

The threshold `limit - a` may be negative when the values are large and the limit is small. That is not an error: a sorted list of non-negative sums has no entry at most a negative threshold, so `upper_bound` returns $0$ and the loop adds nothing. The subtraction itself must not overflow, which the 64-bit type guarantees for the stated bounds.

**The sorted list must retain duplicates.** The list has one entry per right subset, so two subsets with the same sum contribute two equal entries. A `set` or a `unique` call would merge them and undercount every problem that counts subsets rather than distinct sums. When the problem really does count distinct sums, the correct compression is a run-length encoding of `(sum, count)` and the combine adds the counts, not the entries.

Two smaller details are worth a line in the code. In Java, `(low + high) >>> 1` avoids the signed overflow of `(low + high) / 2` for large indices, even though the indices here are below $2^{21}$. In JavaScript, `sort()` without a comparator orders numbers as strings, so `[10, 2, 1].sort()` gives `[1, 10, 2]`; the comparator `(x, y) => x - y` is mandatory.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `lower_bound` for "at most" | Entries equal to the threshold are dropped | Use `upper_bound`, or add the equal range explicitly |
| Forgetting to sort the right list | The binary search returns an arbitrary boundary | Sort before the combine |
| Rebuilding the right list inside the loop over the left list | The program returns to $2^n$ work | Build each half exactly once |
| Reusing one list for both halves | The second build overwrites or appends to the first | Allocate a separate list for each half |
| Using a 32-bit sum or answer | Large tests are silently wrong | Use 64-bit for sums and counts |
| Counting the empty subset when the statement forbids it | The answer is one too large | Subtract one, or start the count from non-empty subsets |
| Treating the halves as equal when $n$ is odd | One side has $\lceil n/2 \rceil$ items and the other $\lfloor n/2 \rfloor$ | Compute the split point as `n / 2` and let the right side take the extra item |
| Computing `1 << n` as a list size | For $n \ge 31$ the shift overflows in Java and C++ | Size each list by its own half, never by $n$ |
| Using a set for the right half | Duplicate sums collapse and the count is too small | Keep a list, or store counts with each distinct sum |
| Assuming the technique works with negative values and pruning | The prune becomes unsound | Keep the full enumeration, or check the sign condition |

### Why this fails: the boundary that drops equality

The plausible wrong approach is to reach for `lower_bound` because it is the first binary search one learns, and to write

```python
answer += bisect_left(right, limit - a)
```

A small example that exposes the difference is $n = 2$, $W = 4$ and values $[2, 2]$. The correct answer is $4$: the empty subset, the first singleton, the second singleton, and the pair all have sum at most $4$.

The split is $L = [2]$ and $R = [2]$, so the left list is $[0, 2]$ and the right list is $[0, 2]$, already sorted. With `upper_bound` the counts are $2$ for $a = 0$ (both right entries are at most $4$) and $2$ for $a = 2$ (both are at most $2$), for a total of $4$. With `lower_bound` the count for $a = 2$ is $1$, because `lower_bound` stops at the first entry equal to $2$ instead of passing it, and the total is $3$.

The wrong answer is not absurd. It is one less than the correct answer on this equality case, and on a large test the shortfall is exactly the number of subsets whose sum lands on the boundary. The failure is silent, because the program prints a number and exits normally.

The fix is one word: use `upper_bound` for "at most" and `lower_bound` for "strictly less". If the statement asks for a strict inequality, the same example shows that `lower_bound` is then the correct function and `upper_bound` is the bug. The function is not better or worse in general; it must match the inequality in the statement, and the test suite must contain a case where the sum equals the threshold.

## Variants and extensions

- **Exact equality.** Count the entries equal to $T - a$ with two binary searches over the range $[T - a, T - a]$, or keep a frequency map from sum to count. The list must retain duplicates.
- **Optimization under a bound.** For each left sum $a$, find the largest right sum at most $W - a$ and keep the best $a + b$. This is the "Programming Contest" form, where the goal is the largest total time that fits.
- **Closest sum.** Find the insertion point of the target and check the entry there and the one before it; the nearest pair is one of those two.
- **Two-pointer combine.** Sort both lists and walk the left list upward while a pointer into the right list moves downward. The count is the sum of the pointer positions, and the combine becomes linear after the sorts.
- **Frequency compression.** Replace equal summaries with `(value, count)` pairs. This reduces the list when many subsets share a sum, and it keeps the combine exact because the counts are added.
- **Signed sums.** Give each item a coefficient of $-1$, $0$, or $1$, enumerate the signed sums of each half, and match $d$ with $-d$. This is the shape of the balanced-subset problem, where the enumeration is $3^{n/2}$ rather than $2^{n/2}$.
- **Pair sums.** For a four-list equality, enumerate the sums of pairs from the first two lists and from the last two lists, then use the ordinary two-list combine on the pair sums. The same idea solves the four-sum problem with hashing.
- **Modular sums.** Reduce every summary modulo $m$ before sorting and handle the wrap-around with two pointers. The equality is then modulo $m$, not over the integers.
- **Bidirectional search.** Run breadth-first search from the start and from the goal, and stop when the frontiers meet. The state space is split in time rather than in items, but the meeting argument is the same.
- **More than two parts.** A $k$-way split reduces the enumeration to $k \cdot 2^{n/k}$ and the memory to $2^{n/k}$, at the cost of more complicated combination. Schroeppel and Shamir's four-list method is the classical example.

## Contest strategy

1. **Count before coding.** Compute $2^n$ and $2^{n/2}$. If the first is above $10^8$ and the second is below $5 \cdot 10^6$, meet in the middle is a candidate.
2. **Write the split predicate.** State $Q(a, b)$ in one line. If $Q$ needs anything beyond one summary from each half, the technique does not apply.
3. **Choose the combine before the loop.** Counting uses `upper_bound`, exact equality uses two bounds or a map, optimization uses a predecessor search, and existence uses a hash set.
4. **Fix the widths.** A sum of $40$ values of magnitude $10^9$ needs 64 bits, and so does the count of $2^{40}$ subsets.
5. **Enumerate with doubling.** It is shorter than the mask loop and avoids the $1 \ll n$ trap for large $n$.
6. **Test the degenerate inputs.** Half of size zero, all values zero, a threshold below every sum, and a threshold equal to a sum.
7. **Differential test.** Compare with the $O(n\,2^n)$ program for every $n \le 20$ on random values. A disagreement is a counterexample and usually points at the boundary or at the split.
8. **Measure the memory.** Two arrays of $2^{20}$ 64-bit values are $16$ MB; at $2^{23}$ they are $128$ MB and the judge may refuse.
9. **Sort once.** Sorting the right list inside the left loop is the most common way to turn a fast program into a slow one.
10. **Stop early when only one witness is needed.** The first qualifying pair is a complete answer, and the rest of the combine is wasted work.

## Worked problems

### Problem 1: count the subsets with sum at most $W$

**Restatement.** Given $n \le 40$ values $0 \le a_i \le 10^9$ and a limit $W$, count the subsets whose sum is at most $W$. The empty subset counts.

**Naive baseline.** Test all $2^n$ subsets with a mask loop, at a cost of $O(n\,2^n)$, which is about $4 \cdot 10^{13}$ operations at $n = 40$.

**Insight.** Every subset is a left subset plus a right subset. The left sums and the right sums can be enumerated separately, and the condition $a + b \le W$ becomes a prefix count in a sorted right list.

**Derivation.** Split at $m = n/2$. Build both lists by doubling. Sort the right list. For each left sum $a$, add `upper_bound(right, W - a)`. The total is the answer.

**Correctness.** The bijection gives every subset exactly one pair, and the sorted prefix count gives exactly the right partners with $b \le W - a$. Soundness, completeness, and the absence of double counting are the three parts of the theorem.

**Complexity.** $O(n\,2^{n/2})$ time and $O(2^{n/2})$ space. At $n = 40$, two lists of $1\,048\,576$ values and about $40$ million comparisons.

**Common wrong approach.** Using `lower_bound`, which drops the subsets whose sum is exactly $W$; the failure is silent and is exactly the equality case in the section above.

### Problem 2: count the subsets with sum exactly $x$

**Restatement.** This is [CSES Meet in the Middle](https://cses.fi/problemset/task/1628): given $n \le 40$ positive values and a target $x$, count the subsets whose sum is exactly $x$.

**Naive baseline.** Enumerate all $2^{40}$ subsets and compare each sum with $x$, which does not finish.

**Insight.** Equality is the range query $[x - a, x - a]$, so the answer for a left sum $a$ is the number of right entries equal to $x - a$. Duplicate sums must be counted with their multiplicity, because they come from different right subsets.

**Derivation.** Build and sort the right list. For each left sum $a$, add

```python
bisect_right(right, x - a) - bisect_left(right, x - a)
```

The difference is the length of the equal range, and the two searches cost $O(\log 2^{n/2})$ each.

**Correctness.** A pair contributes exactly when $a + b = x$. The equal range counts every right subset with the needed sum, including duplicates, and the split bijection makes every subset exactly one pair.

**Complexity.** $O(n\,2^{n/2})$ time and $O(2^{n/2})$ space.

**Common wrong approach.** Storing the right sums in a set. With values $[1,1,1,1]$ and target $2$, the correct count is $6$, one for each pair of chosen positions. A set reduces the right list to $\{0,1,2\}$ and the combine counts only $3$ pairs, so the answer is half the truth.

### Problem 3: count the balanced subsets of cows

**Restatement.** This is [USACO 2012 US Open, Gold: Balanced Cow Subsets](https://usaco.org/index.php?page=viewproblem2&cpid=139). Given $N \le 20$ milk outputs, count the non-empty subsets that can be partitioned into two groups of equal total output.

**Naive baseline.** Try all $3^N$ assignments of each cow to the left group, the right group, or neither, and count the assignments with equal group sums. At $N = 20$ that is $3^{20} \approx 3.5 \times 10^9$ assignments, and the same subset is reached by several assignments, so the count is also wrong without deduplication.

**Insight.** Assign each cow a coefficient of $-1$, $0$, or $1$. A subset is balanced exactly when some assignment of coefficients to its cows has signed sum $0$, and the signed sum splits into a left difference and a right difference that must be opposites. The subset itself is identified by the mask of cows with a non-zero coefficient, not by the signed sum, because different assignments can select the same subset.

**Derivation.** Split the cows into halves of at most $10$. Enumerate the $3^{10} = 59\,049$ states of each half, recording the signed difference and the selection mask. Group the right states by difference. For each left state with difference $d$ and mask $p$, visit the right states with difference $-d$ and mark the union mask $p \mid q$ in a boolean array of size $2^N$. At the end, count the marked masks other than the empty mask.

**Correctness.** A marked mask has a left assignment and a right assignment whose signed sums cancel, so the selected cows can be split into two equal groups. Conversely, every balanced subset has such a pair of assignments, one per half, so its mask is marked. The boolean array makes the count a count of distinct subsets rather than of assignments.

**Complexity.** Each half has $3^{N/2}$ states. Sorting or hashing them costs $O(3^{N/2} \log 3^{N/2})$, and the marking loop costs one step per matched pair, so the total is $O(3^{N/2} \log 3^{N/2} + M)$, where $M$ is the number of pairs with opposite differences. The mask array costs $O(2^N)$ bits or bytes. On degenerate inputs with many equal outputs, $M$ can be much larger than $3^{N/2}$, which is the cost to watch.

**Common wrong approach.** Counting matched pairs instead of distinct masks. One balanced subset can have many equal-sum partitions, so the pair count overcounts it; the mask array is what turns the pair enumeration into a subset count.

## Practice progression

1. **Recognition.** Given $n$ and the statement, write down $2^n$ and $2^{n/2}$ and decide whether the condition splits. If you cannot write the two summaries, stop and choose another technique.
2. **Direct application.** Implement the count-at-most program in your contest language. Verify it against the mask loop for every $n \le 18$ on random values, including zero values and thresholds equal to subset sums.
3. **Adaptation.** Change the combine to exact equality, then to the maximum under a bound, then to the closest sum. Each change should touch only the query function, not the enumeration.
4. **Combination.** Solve the balanced-subset problem, where the summary is a signed sum and the subset identity must be carried separately. Then solve the pair-sum version of four-sum with the same two-list combine.
5. **Challenge.** Solve a modular variant where the summaries are reduced modulo $m$ and the matching wraps around. Compare the sorted two-pointer combine with the binary-search combine on the largest input you can generate.
6. **Transfer.** Recognize the same idea in a graph search: bidirectional breadth-first search expands two frontiers and meets in the middle. Write down what the "summary" of a frontier state is and why the meeting test is exact.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four decisions every meet-in-the-middle solution makes? (At a glance)
2. Why does every subset correspond to exactly one pair of half-subsets? (Formal model)
3. What does the doubling enumeration do to the list, and why does it visit every subset once? (Algorithm derivation)
4. Which binary search implements "at most", and what does the other one implement? (Implementation walkthrough)
5. In the five-value trace, what is the count for $a = 2$, and which entry tests the equality boundary? (Step-by-step execution)
6. State the soundness and completeness halves of the proof and the role of the bijection in each. (Correctness proof)
7. What is the time and space cost at $n = 40$, and how many bytes do the two lists occupy? (Complexity analysis)
8. Why is a set the wrong container for the right half of a counting problem? (Common mistakes)
9. When is a dynamic program better than meet in the middle? (Algorithm selection)
10. Why is the recursive enumeration easy to write but slower to run? (Recursion decision)
11. In the balanced-subset problem, why must the state carry a mask as well as a signed sum? (Worked problems)
12. What changes when the split is three-way or the summaries are taken modulo $m$? (Variants and extensions)

## Further reading

- The mask loop and the brief version of this split are in [subset enumeration](/algorithms/enumeration/subset-enumeration), which is the prerequisite for the enumeration half of the technique.
- The two bounds used by the combine, and the difference between them, are in [binary search](/algorithms/searching/binary-search).
- The cost of sorting the right list is analyzed in [sorting](/algorithms/foundations/sorting), and the exponential arithmetic that decides whether the technique fits is in [complexity](/algorithms/foundations/complexity).
- The pruning alternative, which explores one tree instead of building two lists, is [backtracking](/algorithms/enumeration/backtracking); the version with a bound is [branch and bound](/algorithms/enumeration/branch-and-bound).
- The polynomial replacement when the target is small is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The linear combine over two sorted lists is the counting form of [two pointers](/algorithms/arrays/two-pointers).
- The exact-sum exercise is [CSES Meet in the Middle](https://cses.fi/problemset/task/1628), the optimization exercise is [AtCoder ABC 184 F](https://atcoder.jp/contests/abc184/tasks/abc184_f), and the signed-sum exercise is [USACO 2012 US Open Gold, Balanced Cow Subsets](https://usaco.org/index.php?page=viewproblem2&cpid=139).
