---
id: dynamic-programming.0-1-knapsack
title: 0/1 knapsack
summary: Choose a subset of items whose total weight fits in a capacity, maximizing the total value, with every item usable at most once.
division: [gold]
subjects: [dynamic-programming]
level: intermediate
importance: common-contest-technique
keywords:
    [knapsack, 0/1 knapsack, subset sum, dynamic programming, descending order, unbounded knapsack]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.recursion, arrays.prefix-sums]
complexity:
    time: "O(nW)"
    space: "O(W)"
assumptions:
    - Each item may be taken at most once.
implementations: dynamic-programming.0-1-knapsack
visualization: dynamic-programming.0-1-knapsack
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="dynamic-programming.0-1-knapsack" />

The 0/1 knapsack problem asks for the most valuable subset of items whose total weight does not exceed a given capacity. Every item is a single physical object, so it is either in the knapsack or it is not. It cannot be in there twice. That last clause is the whole difficulty of the problem, and it is the clause that a careless implementation breaks.

The answer comes from a table with one row per item and one column per capacity. Each cell holds the best value reachable with the items above it and the capacity to its left. The update for a cell is a maximum of two candidates: the value of the cell above it, which skips the current item, and the value of the cell above and to the left, plus the value of the current item, which takes it.

The whole table can be collapsed into a single row of $W + 1$ cells, and the collapse is what makes the algorithm competitive. The price of the collapse is a rule about the direction of the sweep: **the capacity must run downwards**. The reason is that the cell that the update reads must still describe the items before the current one, and a downwards sweep is what guarantees that.

The algorithm costs $O(nW)$ time and $O(W)$ space. It is pseudo-polynomial, because the running time depends on the magnitude of the capacity rather than on the number of bits needed to write it, so it is only the right tool when the capacity is small enough to index.

## Problem motivation

A courier drone has one battery pack per trip. The battery packs come in several sizes; a large pack flies farther and carries a more valuable payload, but it also weighs more. The drone has a strict weight limit, and the dispatcher wants to fill each trip with the most valuable combination of packs that still lifts off.

The constraints are what make the problem interesting:

- $1 \le n \le 2\,000$ packs, each with a positive weight and a positive value.
- $1 \le W \le 10^6$ kilograms of weight capacity.
- Each pack may be loaded at most once, because there is one of each in the warehouse.
- The values fit in a 64-bit integer, because $n$ packs of value $10^9$ each reach $2 \cdot 10^{12}$.

The dispatcher cannot try every subset. There are $2^{2000}$ of them, and the number of subsets that respect the weight limit is a large fraction of that. Yet the answer must be found in well under a second, which means the search has to be replaced by a table.

Notice what the problem is _not_ asking. It does not ask for the ratio of value to weight, and it does not ask for a fractional pack. A greedy rule that loads the best ratio first is wrong here, and the article on [interval scheduling](/algorithms/greedy/interval-scheduling) explains why greedy rules fail in general. The problem is discrete: a pack is either loaded whole or not loaded at all.

## Recognition patterns

The 0/1 knapsack technique is the right tool when all of the following hold.

- The problem says **choose a subset**, **select some of the items**, or **each item may be used at most once**.
- Each item has a **weight** that consumes a shared budget and a **value** that the objective adds up.
- The budget $W$ is small enough to be an array index.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| $W \le 10^3$ | The table is tiny and any of the forms below works |
| $W \le 10^6$ and $n \le 10^3$ | $O(nW) = 10^9$ is too slow; look for a smaller capacity or a different formulation |
| $W$ is not given and may be $10^9$ | A table indexed by capacity is hopeless; use a meet in the middle split |
| Each item may be taken **any number of times** | Rules out 0/1 knapsack; use the ascending sweep, which solves the unbounded problem |
| Values are divisible and partial items are allowed | Rules out 0/1 knapsack; use the fractional greedy rule |
| $n \le 20$ | Enumerating the $2^n$ subsets is faster to write and just as fast to run |

Two phrases in a statement are strong signals. "At most once" and "each item may be chosen at most once" are the definition of the problem. "Unlimited copies" and "you may buy as many as you want" are the signal for the unbounded variant, which is the same code with the sweep reversed.

<Synonyms terms="knapsack, 0/1 knapsack, subset sum, backpack problem" />

## Naive approach

The baseline is to enumerate every subset and keep the best one that fits.

```python
best = 0
for mask in range(1 << n):
    weight = 0
    value = 0
    for i in range(n):
        if mask & (1 << i):
            weight += weights[i]
            value += values[i]
    if weight <= capacity:
        best = max(best, value)
```

This is $O(n 2^n)$ and it is correct for every instance. With $n = 2000$ it examines $2^{2000}$ subsets, so it is not a solution to anything; it is a specification of the problem.

A better baseline keeps a running weight and value while enumerating, which costs $O(2^n)$ rather than $O(n 2^n)$:

```python
best = 0
for mask in range(1 << n):
    low = mask & -mask          # the lowest set bit
    index = low.bit_length() - 1
    weight = total_weight[mask ^ low] + weights[index]
    value = total_value[mask ^ low] + values[index]
    if weight <= capacity:
        best = max(best, value)
```

This version is worth writing down for two reasons. It is the reference implementation for the differential test, so a faster program that disagrees with it is the one that is wrong. And it shows the combinatorial explosion clearly: the count of subsets is the problem, not the work done per subset.

The third baseline is a recursive search with a capacity parameter, which is the shape of the dynamic program without the memoization:

```python
def solve(i, remaining):
    if i == n or remaining < 0:
        return 0
    return max(solve(i + 1, remaining),
               values[i] + solve(i + 1, remaining - weights[i]))
```

This explores the same $2^n$ subsets, and it is the form the derivation below grows out of.

## Key insight

The insight is that the question "which items should I take?" decomposes into exactly two smaller questions, one for each choice about the last item.

Take item $i$, with weight $w_i$ and value $v_i$. Every feasible solution either contains item $i$ or it does not.

- If it does not contain item $i$, the problem is the original problem with one fewer item and the same capacity.
- If it does contain item $i$, removing item $i$ leaves a feasible solution of the original problem with one fewer item and capacity $W - w_i$, and the value of the original solution is that value plus $v_i$.

So the best value is the larger of two values that are both about one fewer item. The item index and the capacity are the two parameters of the state, and the recurrence is a maximum of two candidates. Nothing about the problem needs the _set_ of chosen items; it needs only the best value per (item index, capacity) pair.

That is the entire insight, and the rest of the article is the bookkeeping: how to fill the table, how to collapse it to one row, and why the collapse must be done in one particular direction.

## Visual intuition

The picture worth having in your head is a table. Rows are the items in the order they are processed, and columns are the capacities from $0$ to $W$. The cell in row $i$ and column $c$ holds the best value obtainable from the first $i$ items with a budget of $c$.

Each cell is filled from the cell above it and from the cell above and to the left. The cell above says "skip this item". The cell above and to the left says "take this item, and there is $c - w_i$ of budget left over". The new cell is the larger of the two.

The one-row version is the same picture with the old rows erased. The rows are erased as they are used, and the direction of erasure is the whole trick: erasing from the right means the cell to the left still holds the previous row, so the "take this item" candidate is still computed from the previous row. Erasing from the left means the cell to the left has already been overwritten with the current row, so the candidate includes the current item twice.

That is the picture to remember when the answer comes out wrong: a table filled in one direction solves a different problem from the table filled in the other.

The laboratory below steps through the same table one cell at a time; the description above is the version that holds in every build.

<AlgorithmPlayer algorithm="dynamic-programming.0-1-knapsack" />

## Formal model

Let $n$ be the number of items. Item $i$ has weight $w_i$ and value $v_i$, with $w_i \ge 1$. Let $W$ be the capacity.

<MathPanel type="definition" title="Definition">
A **feasible selection** is a subset $S \subseteq \{1, 2, \ldots, n\}$ such that
$\sum_{i \in S} w_i \le W$. Its **value** is $\sum_{i \in S} v_i$. The
**optimum** is the largest value of any feasible selection. The prefix
$\text{0/1}$ records that each item is either selected once or not selected
at all.
</MathPanel>

<MathPanel type="definition" title="Definition">
Let $F(i, c)$ be the optimum of the instance formed by the first $i$ items
and the capacity $c$, so that $F(i, c) = 0$ for every $c \ge 0$ when
$i = 0$.
</MathPanel>

<MathPanel type="recurrence" title="Recurrence">
For $1 \le i \le n$ and $0 \le c \le W$,

$$
F(i, c) \;=\;
\begin{cases}
F(i-1, c), & \text{if } c < w_i, \\
\max\bigl(F(i-1, c),\; F(i-1, c - w_i) + v_i\bigr), & \text{otherwise.}
\end{cases}
$$

The answer is $F(n, W)$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let `table` be an array of $W + 1$ entries, and let the sweep for item $i$
visit the capacities in the order $W, W-1, \ldots, w_i$, assigning

$$
\text{table}[c] \gets \max\bigl(\text{table}[c],\; \text{table}[c - w_i] + v_i\bigr).
$$

If every entry of `table` holds $F(i-1, \cdot)$ before the sweep begins, then every entry holds $F(i, \cdot)$ after the sweep ends.
</MathPanel>

The lemma is the heart of the article, and it is proved in the correctness proof below. The condition it assumes is exactly the condition that the direction of the sweep exists to guarantee.

## Algorithm derivation

The state is the array `table` of $W + 1$ entries, all initialized to zero. Zero is the right initial value, because the empty selection is feasible for every capacity and has value zero.

The update rule for item $i$ is: for every capacity $c$ from $W$ down to $w_i$, set `table[c] = max(table[c], table[c - w_i] + v_i)`.

The rule is correct by the recurrence, provided one thing holds: when `table[c]` is updated, the cell `table[c - w_i]` must still hold $F(i-1, c - w_i)$ and not $F(i, c - w_i)$.

<MathPanel type="invariant" title="Invariant">
At the moment the sweep for item $i$ updates the cell with capacity $c$,
the cell with capacity $c - w_i$ still holds $F(i-1, c - w_i)$.
</MathPanel>

The descending order establishes the invariant. The sweep visits capacities from $W$ downwards, so when it reaches $c$ it has already visited every capacity greater than $c$ and none that are smaller. Since $w_i \ge 1$, the capacity $c - w_i$ is strictly smaller than $c$, so that cell has not been touched during this sweep and still belongs to the previous row.

An ascending sweep destroys the invariant. It visits $c - w_i$ before $c$, so the cell it reads has already been updated to $F(i, c - w_i)$, which already accounts for item $i$. The candidate it computes is then $F(i, c - w_i) + v_i$, in which item $i$ is counted a second time.

The loop bound is $c \ge w_i$, not $c \ge 0$. A capacity smaller than the weight of the item cannot hold the item at all, so the recurrence for that capacity is the "skip" case alone and the cell is left alone. An ascending loop with the bound `c <= W` and no lower bound would also read `table[c - w_i]` out of range.

## Step-by-step execution

Take four items and a capacity of $W = 7$.

| Item | Weight $w_i$ | Value $v_i$ |
| ---- | ------------ | ----------- |
| 1    | 3            | 4           |
| 2    | 4            | 5           |
| 3    | 5            | 7           |
| 4    | 2            | 3           |

The table starts as `table = [0, 0, 0, 0, 0, 0, 0, 0]`, one entry per capacity from $0$ to $7$.

**Item 1, weight 3, value 4.** The sweep visits $c = 7, 6, 5, 4, 3$.

- $c = 7$: $\text{table}[7] = \max(0, \text{table}[4] + 4) = \max(0, 0 + 4) = 4$.
- $c = 6$: $\text{table}[6] = \max(0, \text{table}[3] + 4) = 4$.
- $c = 5$: $\text{table}[5] = \max(0, \text{table}[2] + 4) = 4$.
- $c = 4$: $\text{table}[4] = \max(0, \text{table}[1] + 4) = 4$.
- $c = 3$: $\text{table}[3] = \max(0, \text{table}[0] + 4) = 4$.

The table is now `[0, 0, 0, 4, 4, 4, 4, 4]`. Every capacity of at least three can hold item 1 and its value is 4.

**Item 2, weight 4, value 5.** The sweep visits $c = 7, 6, 5, 4$.

- $c = 7$: $\text{table}[7] = \max(4, \text{table}[3] + 5) = \max(4, 4 + 5) = 9$.
- $c = 6$: $\text{table}[6] = \max(4, \text{table}[2] + 5) = \max(4, 0 + 5) = 5$.
- $c = 5$: $\text{table}[5] = \max(4, \text{table}[1] + 5) = \max(4, 0 + 5) = 5$.
- $c = 4$: $\text{table}[4] = \max(4, \text{table}[0] + 5) = \max(4, 0 + 5) = 5$.

The table is now `[0, 0, 0, 4, 5, 5, 5, 9]`. Capacity 7 can hold items 1 and 2 together, for a value of 9. Capacity 6 can hold either item 1 or item 2 but not both.

**Item 3, weight 5, value 7.** The sweep visits $c = 7, 6, 5$.

- $c = 7$: $\text{table}[7] = \max(9, \text{table}[2] + 7) = \max(9, 0 + 7) = 9$.
- $c = 6$: $\text{table}[6] = \max(5, \text{table}[1] + 7) = \max(5, 0 + 7) = 7$.
- $c = 5$: $\text{table}[5] = \max(5, \text{table}[0] + 7) = \max(5, 0 + 7) = 7$.

The table is now `[0, 0, 0, 4, 5, 7, 7, 9]`. Item 3 alone beats items 1 and 2 at capacity 5 and 6, but not at capacity 7.

**Item 4, weight 2, value 3.** The sweep visits $c = 7, 6, 5, 4, 3, 2$.

- $c = 7$: $\text{table}[7] = \max(9, \text{table}[5] + 3) = \max(9, 7 + 3) = 10$.
- $c = 6$: $\text{table}[6] = \max(7, \text{table}[4] + 3) = \max(7, 5 + 3) = 8$.
- $c = 5$: $\text{table}[5] = \max(7, \text{table}[3] + 3) = \max(7, 4 + 3) = 7$.
- $c = 4$: $\text{table}[4] = \max(5, \text{table}[2] + 3) = \max(5, 0 + 3) = 5$.
- $c = 3$: $\text{table}[3] = \max(4, \text{table}[1] + 3) = \max(4, 0 + 3) = 4$.
- $c = 2$: $\text{table}[2] = \max(0, \text{table}[0] + 3) = 3$.

The table is now `[0, 0, 3, 4, 5, 7, 8, 10]`, and the answer is $\text{table}[7] = 10$.

The selection that achieves it is items 3 and 4: weight $5 + 2 = 7$ and value $7 + 3 = 10$. Notice that the greedy choice by value alone would have taken item 3 and then found no room for item 1, and the greedy choice by ratio would have taken item 4 and then item 3, which happens to be right here, but not by a rule that always works.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The descending sweep computes $F(n, W)$, the maximum value of any feasible
selection of the $n$ items with capacity $W$.
</MathPanel>

<MathPanel type="proof" title="Proof">
First, the two-dimensional recurrence is correct. For $i = 0$ there are no
items, so the only selection is the empty one, and $F(0, c) = 0$ is right.

Suppose $F(i-1, \cdot)$ is correct and consider $F(i, c)$. Every feasible selection of the first $i$ items either omits item $i$ or includes it.

If it omits item $i$, it is a feasible selection of the first $i - 1$ items with capacity $c$, so its value is at most $F(i-1, c)$, and the bound is attained.

If it includes item $i$, then $c \ge w_i$, and removing item $i$ from it leaves a feasible selection of the first $i - 1$ items with capacity $c - w_i$, so its value is at most $F(i-1, c - w_i) + v_i$, and the bound is attained by adding item $i$ to a selection that reaches that bound.

So the optimum is the larger of the two candidates, and when $c < w_i$ only the first is available. That is exactly the recurrence. By induction the recurrence computes $F$ correctly. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The one-dimensional sweep computes the same table as the two-dimensional
recurrence. This is the proof of the descending order.

Fix an item $i$ and suppose that before the sweep for item $i$ every entry of `table` holds $F(i-1, \cdot)$, which is the induction hypothesis.

The sweep visits the capacities in the order $W, W-1, \ldots, w_i$. Fix a capacity $c$ visited by the sweep, and consider the moment when `table[c]` is assigned. The capacities already visited are exactly those greater than $c$. Since $w_i \ge 1$, the capacity $c - w_i$ is strictly less than $c$, so the cell `table[c - w_i]` has not been visited during this sweep. It therefore still holds the value it had before the sweep began, namely $F(i-1, c - w_i)$.

The assignment is

$$
\text{table}[c] \gets \max\bigl(F(i-1, c),\; F(i-1, c - w_i) + v_i\bigr),
$$

which is the recurrence for $F(i, c)$. So the cell holds $F(i, c)$ after the assignment.

The capacities below $w_i$ are not visited. For those, $c < w_i$, and the recurrence gives $F(i, c) = F(i-1, c)$, which is the value the cell already holds.

Every cell therefore holds $F(i, \cdot)$ when the sweep ends, which establishes the induction hypothesis for the next item. After the last item, `table[W]` holds $F(n, W)$, and by the first theorem that is the optimum. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
An ascending sweep does not compute $F$, and the difference is exactly the
double counting of the current item.

In an ascending sweep, the cell `table[c - w_i]` is visited before the cell `table[c]`. If the sweep for item $i$ is the first one, then at the moment `table[c]` is assigned, `table[c - w_i]` already holds $F(i, c - w_i)$, the optimum that already includes item $i$. The candidate that is computed is therefore $F(i, c - w_i) + v_i$, which counts item $i$ twice. The sweep solves the unbounded problem, in which each item may be taken any number of times. $\square$
</MathPanel>

## Complexity analysis

**Time: $O(nW)$.** There are $n$ items, and each sweep visits at most $W + 1$ capacities, with one maximum and one addition per cell.

**Auxiliary space: $O(W)$.** The table has $W + 1$ entries. The items themselves are not counted, because they are the input; the program variant of the reference implementation reports $O(n + W)$ for the total.

The bound is pseudo-polynomial, and the distinction matters. The running time depends on the _value_ of $W$, not on the number of bits needed to write it, so the algorithm is exponential in the bit length of $W$. A capacity of $10^6$ is fine; a capacity of $10^{18}$ is not addressable at all.

Two practical details belong in this section because they decide whether the answer is right. The accumulator must be 64 bits: with $n = 2000$ items of value $10^9$ each, the optimum can reach $2 \cdot 10^{12}$, which does not fit in a 32-bit signed integer. And the table itself is $8(W + 1)$ bytes with a 64-bit entry, so at $W = 10^6$ it costs about 8 MB, which is comfortable; at $W = 10^7$ it costs 80 MB, which may not be.

<MathPanel type="complexity" title="Complexity">
0/1 knapsack with $n$ items and capacity $W$: $O(nW)$ time and $O(W)$
auxiliary space, with a 64-bit accumulator. The bound is
pseudo-polynomial in the value of $W$.
</MathPanel>

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Each item may be taken at most once | 0/1 knapsack, descending sweep |
| Each item may be taken any number of times | The same table with an ascending sweep |
| The values are the weights, and a sum of exactly $W$ is wanted | Subset sum, which is 0/1 knapsack with $v_i = w_i$ |
| Items may be split, and the ratio is what matters | Fractional knapsack, greedy by value per weight |
| $n \le 40$ and $W$ is huge | Meet in the middle: split the items, enumerate each half, and binary search the sorted halves |
| $W$ is huge and $n$ is huge | The problem is weakly NP-hard; look for extra structure in the statement |
| The items form a chain, and each one depends on the previous | Dynamic programming along the chain, with the capacity as the state |
| The capacity is $10^{18}$ and the values are small | A DP indexed by the total value instead of the capacity |

The last two rows are the ones that separate a mechanical solution from a clever one. The DP is defined by the constraint that bounds the state, and sometimes that constraint is not the capacity.

## Reference implementations

<CodeViewer algorithm="dynamic-programming.0-1-knapsack" />

The manifest publishes two variants in each of the six languages. The `minimal` variant is a reusable function that takes the weights, the values and the capacity and returns the maximum value; it performs no input and output, and in C and Pascal it fills a caller-provided buffer so that the algorithm itself never allocates. The `program` variant reads `n W` and then $n$ lines of `w v` from standard input and prints one number: the maximum achievable total value.

## Recursion decision

The recursive form is instructive and it is the form the derivation came from, but it should not be shipped.

```python
def solve(i, remaining):
    if i == n:
        return 0
    if weights[i] > remaining:
        return solve(i + 1, remaining)
    return max(solve(i + 1, remaining),
               values[i] + solve(i + 1, remaining - weights[i]))
```

Without memoization this explores every subset, so it costs $O(2^n)$ and the recursion depth is $n$. With memoization on the pair $(i, c)$ it becomes the two-dimensional table, and the depth is still $n$ because the recursion walks down the item index. The iterative form has no recursion at all.

The depth is the reason to prefer the loop, and the limit is a property of the language.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; the depth here is only $n$, but the loop is shorter |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; $n$ can be 2000 |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative |

The depth of $n = 2000$ is inside every one of those limits, so the failure is not a crash in this problem. The recommendation is the iterative form anyway, for the ordinary reason: it is shorter, it has no stack to overflow, and it is the form the correctness proof above describes.

## Implementation walkthrough

Three lines carry the whole algorithm.

```cpp
for (int c = capacity; c >= weight; --c) {
    table[c] = std::max(table[c], table[c - weight] + values[i]);
}
```

**The direction of the sweep.** `c >= weight; --c` is the rule that keeps every item usable at most once. Changing it to `c = weight; c <= capacity; ++c` produces a program that runs, prints a number, and is wrong in exactly the way the counterexample below describes.

**The lower bound of the loop.** Starting at `weight` rather than at zero is what keeps `table[c - weight]` inside the array. A loop that started at zero would index `table[-weight]`, which is a read outside the array and, in most languages, undefined behavior rather than a clean error.

**The type of the accumulator.** The reference implementations use `long long`, `long`, `Int64` and `BigInt`, because the optimum can exceed the 32-bit range. The JavaScript variant is the one to watch: a plain `Number` loses the low bits beyond $2^{53}$.

The reference implementations also clamp the two degenerate inputs. A negative capacity returns zero, because no selection fits in a negative budget, and a negative weight is clamped to zero, because a negative weight would otherwise index the table in the wrong direction and would mean the item costs nothing while adding value.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sweeping the capacity upwards | The same item is taken more than once; the program solves the unbounded problem | Sweep from $W$ down to $w_i$ |
| Reading `table[c - weight]` when $c < \text{weight}$ | A read outside the array | Start the loop at `weight` |
| Using 32-bit integers | A wrong answer with no error message | Use a 64-bit accumulator |
| Initializing the table to zero for an exact-weight problem | The answer is the best value that _fits_, not the best that matches exactly | Use a sentinel for unreachable states |
| Answering with the maximum over the table | Correct for the "at most $W$" form and wrong for the "exactly $W$" form | Decide which question is being asked |
| Forgetting to update `table` for the current item before the next one | The answer is off by the last item | Update in place, in one sweep per item |
| Swapping the roles of items and capacities | The answer is right only when $n$ and $W$ are similar | Index the table by capacity |
| Reading the items in the wrong order | The answer is right, but the reconstruction of the subset is wrong | Keep the item order stable |

### Why this fails: the ascending sweep that takes the same item twice

The mistake that survives review most often is not a logic error in the recurrence. It is the direction of the sweep, and it produces a program that runs to completion and prints a confident number.

The smallest counterexample is one item, of weight 2 and value 3, with a capacity of 4. The item fits in the knapsack twice over, but it is one item, so the correct answer is 3.

The ascending sweep starts from a table of zeros and visits $c = 2, 3, 4$:

- $c = 2$: $\text{table}[2] = \max(0, \text{table}[0] + 3) = 3$.
- $c = 3$: $\text{table}[3] = \max(0, \text{table}[1] + 3) = 3$.
- $c = 4$: $\text{table}[4] = \max(0, \text{table}[2] + 3) = \max(0, 3 + 3) = 6$.

The answer printed is 6, which is the value of the item counted twice. The descending sweep on the same instance visits $c = 4, 3, 2$:

- $c = 4$: $\text{table}[4] = \max(0, \text{table}[2] + 3) = 3$.
- $c = 3$: $\text{table}[3] = \max(0, \text{table}[1] + 3) = 3$.
- $c = 2$: $\text{table}[2] = \max(0, \text{table}[0] + 3) = 3$.

The answer printed is 3, which is correct.

The difference is one cell. In the ascending sweep, the cell read at $c = 4$ was written during the same sweep, so it already contained the item; in the descending sweep, the cell read at $c = 4$ still belonged to the previous row.

The generalizes into a rule: **a one-dimensional table may only be read from a cell that the current sweep has not yet written.** That is the whole content of the descending-order requirement, and it is the same requirement that the sliding window in [sliding window](/algorithms/searching/sliding-window) satisfies for a different reason.

## Variants and extensions

- **Unbounded knapsack.** Each item may be taken any number of times, and the sweep runs upwards. The recurrence becomes $F(i, c) = \max(F(i-1, c), F(i, c - w_i) + v_i)$, with the current row on the right-hand side, which is why the direction reverses.
- **Exact weight.** The question is "the largest value whose weight is exactly $W$". The table is initialized to a sentinel rather than to zero, and the answer is `table[W]`, not the maximum over the table. The sentinel must be small enough that adding a value to it stays below any real answer.
- **Minimum number of items.** Replace the value with the count of items taken and minimize instead of maximizing; the same table shape works.
- **Group knapsack.** When the items are partitioned into groups and at most one item may be taken from each group, the groups are processed in order and each group's row is computed from the row before the group, which is a separate table per group.
- **Reconstruction.** To recover the chosen subset, keep a second table of booleans recording whether the cell took the item, and walk backwards from $(n, W)$. The memory then doubles, from $O(W)$ to $O(nW)$.
- **Path dynamic programming.** The knapsack recurrence is a shortest path in a layered graph with $n$ layers and $W + 1$ nodes per layer, where the edges have weights $v_i$. The same table solves a widest path in a grid, which is why the technique appears in so many problems that do not mention knapsack.
- **The value-indexed form.** When the capacity is astronomically large and the values are small, swap the roles and index the table by the total value, keeping the smallest weight that achieves it.

## Contest strategy

Under contest pressure, the errors above are what cost points, and they are all avoidable with a fixed procedure.

1. Write the recurrence down before the code, and say which case is which: skip the item, or take it and reduce the capacity.
2. Decide the direction of the sweep and write it in a comment. Descending means at most once; ascending means unlimited copies.
3. Decide whether the question is "at most $W$" or "exactly $W$". The two need different initial values and different answers.
4. Check the arithmetic: the largest possible optimum, and whether it fits in the type you are about to use.
5. Test three instances by hand: a single item that fits twice, an item heavier than the capacity, and no items at all. The reference implementations assert exactly these three.
6. If $O(nW)$ is too slow, do not micro-optimize. Change the formulation: index by value, split the items in half, or find the extra structure the statement is hiding.

## Worked problems

### Problem 1: the courier drone

**Restatement.** There are $n$ battery packs with weights and values, and a drone with capacity $W$. Each pack may be loaded at most once. Report the largest total value that fits. Constraints: $1 \le n \le 2000$, $1 \le W \le 10^6$, values up to $10^9$.

**Naive baseline.** Enumerate the $2^n$ subsets, at a cost of $O(n 2^n)$, which is hopeless.

**Insight.** The best selection either takes the last pack or does not, and the two cases are the same problem with one fewer pack.

**Derivation.** Keep a table of $W + 1$ entries. For each pack, sweep the capacities from $W$ down to the weight of the pack, and replace each cell with the larger of its current value and the cell $w$ positions to the left plus the value of the pack.

**Correctness.** The recurrence argument shows that each cell holds the optimum for its prefix of items and its capacity, and the sweep-order argument shows that the one-dimensional table computes exactly that recurrence.

**Complexity.** $O(nW) = 2 \cdot 10^9$ operations at the top of the range, which is too slow for a one-second limit, so a real solution either reduces $W$ by discarding items heavier than the capacity or uses the value-indexed form. With $W = 10^5$ the bound is $2 \cdot 10^8$, which is comfortable.

**Common wrong approach.** Sweeping the capacities upwards. The answer comes out too large, and the discrepancy is exactly the value of the items that fit more than once.

### Problem 2: subset sum

**Restatement.** Given $n$ integers and a target $T$, determine whether some subset of the integers sums to exactly $T$. Constraints: $1 \le n \le 200$, $1 \le T \le 10^6$.

**Naive baseline.** Enumerate the $2^n$ subsets, which at $n = 200$ is hopeless.

**Insight.** Subset sum is knapsack in which every value equals its weight, and the question is whether the optimum for capacity $T$ is exactly $T$.

**Derivation.** Run the knapsack table. If `table[T] == T`, the answer is yes. The subtlety is the initialization: with all zeros, the table holds "the best value that fits in $c$", and a cell is reachable exactly when its value equals its capacity.

**Correctness.** The table holds $F(n, c)$ by the same argument as before, and the answer is $T$ exactly when a selection of weight $T$ exists, because a selection of weight at most $T$ with value $T$ must have weight exactly $T$ when value equals weight.

**Complexity.** $O(nT)$ time and $O(T)$ space. With $n = 200$ and $T = 10^6$ that is $2 \cdot 10^8$, which is at the edge; the usual improvement is to divide every number and the target by their greatest common divisor, which often shrinks $T$ by an order of magnitude.

**Common wrong approach.** Initializing the table to zero and then asking whether `table[T] > 0`. That is true whenever some subset sums to at most $T$, which is almost always, and it answers a different question.

### Problem 3: the widest path in a grid

**Restatement.** An $R \times C$ grid of cells holds a value in each cell. A path may move right or down. Report the largest total value of a path from the top-left cell to the bottom-right cell. Constraints: $1 \le R, C \le 1000$.

**Naive baseline.** Enumerate the $\binom{R+C}{R}$ paths, which is astronomically many.

**Insight.** The cells form a layered graph with one layer per row, and the knapsack recurrence is the shortest path recurrence on that graph, with the capacity replaced by the column.

**Derivation.** Let $F(r, c)$ be the best value of a path to the cell in row $r$ and column $c$. Then $F(r, c) = v(r, c) + \max(F(r-1, c), F(r, c-1))$, with the boundary cases handled separately. The table is rolled into one row, and the sweep runs from right to left, which is the same reason the knapsack sweep runs downwards: the cell that the update reads must belong to the previous row.

**Correctness.** The path to a cell arrives either from above or from the left, and the better of the two predecessors is the better path. Rolling the rows preserves the recurrence because of the sweep direction, for exactly the reason the knapsack lemma states.

**Complexity.** $O(RC)$ time and $O(C)$ space, since only the previous row is needed.

**Common wrong approach.** Sweeping the row from left to right, which reads a cell that has already been updated with the current row's value and therefore lets a path move right twice.

## Practice progression

1. **Recognition.** Given a statement, decide whether 0/1 knapsack applies. Look for a subset choice, a shared budget, and a capacity that is small enough to index.
2. **Direct application.** Implement the one-dimensional table with a descending sweep, and verify it against a brute-force enumeration on random instances with $n \le 12$.
3. **Adaptation.** Implement the ascending sweep and show that it solves the unbounded problem; implement the exact-weight form with a sentinel; implement the two-dimensional table and check that it agrees with the one-dimensional one.
4. **Combination.** Combine the knapsack table with a prefix sum over the items to answer a query about a sub-range of the items; combine it with binary search to find the smallest capacity that reaches a target value.
5. **Challenge.** Solve a problem where $W$ is $10^{18}$ and the values are small, by indexing the table by value instead of by capacity, and explain why the direction of the sweep does not change.
6. **Transfer.** Recognize the knapsack recurrence in a problem that never mentions a knapsack: a path on a grid, a partition of a set into bins, or a scheduling problem with a deadline.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the recurrence $F(i, c)$ and say what the two cases mean. (Key insight)
2. Why must the capacity be swept downwards in the one-dimensional form? (Algorithm derivation)
3. Give the smallest instance on which an ascending sweep is wrong, and the number it prints. (Common mistakes)
4. State the invariant of the sweep and explain which part of the proof uses it. (Correctness proof)
5. What does `table[c]` hold after the sweep for item $i$ has finished? (Formal model)
6. Why is the running time described as pseudo-polynomial, and what constraint value makes the technique useless? (Complexity analysis)
7. When is the ascending sweep the correct algorithm, and why does the recurrence change with it? (Variants and extensions)
8. How do you recover the actual subset of items from the table? (Variants and extensions)
9. What is the largest answer the stated constraints allow, and what does that do to the type of the accumulator? (Complexity analysis)
10. Which language-specific limits would break the recursive form, and how deep would the recursion get? (Recursion decision)
11. Why does the greedy rule by value per weight fail, and what does the example in the article show? (Problem motivation)
12. What changes if the question is "exactly $W$" rather than "at most $W$"? (Worked problems)

## Further reading

- The one-dimensional table and the direction of its sweep are the same idea as the window in [sliding window](/algorithms/searching/sliding-window), applied to a capacity instead of to an array.
- A dynamic program over a chain of decisions is the subject of the [interval scheduling](/algorithms/greedy/interval-scheduling) neighbor pages, where the greedy choice fails and the table succeeds.
- The running totals that turn a range into a subtraction are in [prefix sums](/algorithms/arrays/prefix-sums); the same idea on a grid is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- When the values must be added under changing constraints, the structure that supports updates is the [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The graph that the knapsack recurrence really searches is a layered graph, and the traversal of such a graph is in [graph representation](/algorithms/graphs/representation).
- The technique for finding the smallest capacity that reaches a target is [binary search](/algorithms/searching/binary-search) applied to the answer.
- Every listing in this article, in all six languages, is collected on the [0/1 knapsack source page](/implementations/dynamic-programming-0-1-knapsack).
