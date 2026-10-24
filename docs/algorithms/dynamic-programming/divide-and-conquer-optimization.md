---
id: dynamic-programming.divide-and-conquer-optimization
title: Divide-and-conquer optimization
summary: Evaluate a layered dynamic program whose best split point is monotone by solving the middle entry of a range and passing its optimum as a bound to both halves.
division: [platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        divide-and-conquer optimization,
        d&c optimization,
        monotone opt,
        quadrangle inequality,
        monge array,
        partition dp,
        1d1d dp,
    ]
prerequisites:
    required: [dynamic-programming.0-1-knapsack, foundations.complexity]
    recommended: [arrays.prefix-sums, foundations.recursion]
complexity:
    time: "O(k n log n)"
    space: "O(n)"
assumptions:
    - Every array element is nonnegative, so the prefix sums never decrease.
    - The group cost satisfies the quadrangle inequality, which makes the best split point monotone.
implementations: dynamic-programming.divide-and-conquer-optimization
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="dynamic-programming.divide-and-conquer-optimization" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="dynamic-programming.divide-and-conquer-optimization" />

Divide-and-conquer optimization is a way to evaluate one layer of a dynamic program without trying every split point. It applies to recurrences of the form

$$
\mathrm{dp}[g][i] \;=\; \min_{g-1 \,\le\, j \,<\, i}
\bigl(\mathrm{dp}[g-1][j] + w(j+1, i)\bigr),
$$

where $w(l, r)$ is the cost of the contiguous group from $l$ to $r$. The whole technique rests on one property of the cost: the best split point $j$ never moves left as the prefix length $i$ grows. If that property holds, the program can solve the middle entry of a range, then tell the left half that its split points are at most the middle optimum and the right half that its split points are at least it.

The property is not an accident of the recurrence. It follows from the quadrangle inequality, which for the cost $w(l, r) = (P[r] - P[l-1])^2$ is a one-line algebraic identity. With nonnegative values the identity is immediate, and the algorithm costs $O(k n \log n)$ time and $O(n)$ auxiliary space instead of $O(k n^2)$.

The example used throughout is a partition problem: split an array into exactly $k$ contiguous nonempty groups, and minimize the sum of the squared group sums. It is small enough to trace by hand and it exposes every part of the technique, including the tie-breaking rule and the precondition that a careless solution forgets.

## Problem motivation

A regional warehouse receives $n$ pallets in a fixed order. The dispatcher must load them onto exactly $k$ trucks, and each truck takes a contiguous block of the remaining sequence, because the pallets are queued on one belt and cannot be reordered. The contract charges the square of the total weight on a truck: a heavy truck needs a reinforced crew and a second escort, so the penalty grows faster than the load itself.

The dispatcher wants the cheapest assignment. The constraints are:

- $1 \le n \le 2\,000$ pallets, each with a nonnegative weight.
- $1 \le k \le n$ trucks, and every truck must receive at least one pallet.
- $0 \le a_i \le 10^4$ for every pallet, so the total weight is at most $2 \ast 10^7$ and the largest possible cost is $4 \ast 10^{14}$.
- The pallets stay in their given order; a truck cannot skip a pallet and a later truck cannot go back for it.

The number of ways to choose the $k-1$ cuts is $\binom{n-1}{k-1}$, which is astronomical for $n = 2\,000$ and $k = 1\,000$. Even the standard dynamic program is too slow: it has $k$ layers and tries every previous cut in every layer, for hundreds of millions of transitions near the worst ratio of $k$ to $n$. The dispatcher needs a method that exploits the shape of the cost rather than the number of cuts.

Notice what the problem is _not_ asking. It does not ask for the split that minimizes the largest group sum; that objective is solved by binary search on the answer and a greedy pass, and it produces a different partition. It does not allow sorting the pallets, because the truck order is fixed. And it does not ask for a fractional allocation, because a pallet cannot be split between two trucks. The objective is a sum of convex group costs over a fixed order, which is exactly the setting where monotone split points appear.

## Recognition patterns

The technique is the right tool when all of the following hold.

- The problem says **split the array into exactly $k$ contiguous groups**, **partition the sequence into $k$ segments**, or **choose $k-1$ cut positions**.
- The total cost is the sum of a cost that depends only on each group, not on the groups before or after it.
- The best last cut for a prefix of length $i$ is nondecreasing in $i$. This is usually established by the quadrangle inequality, by a Monge cost matrix, or by an exchange argument in the statement.
- The layer being computed depends on exactly one previous layer, so the state is a pair (number of groups, prefix length) and the transition is a minimum over a split point.

The constraint values decide whether the technique is worth the proof.

| Constraint | What it rules |
| --- | --- |
| $n \le 500$ and $k \le 500$ | The $O(k n^2)$ recurrence may pass in a compiled language; the simpler code is often the better contest choice |
| $n \le 2\,000$ and $k \le 2\,000$ | $O(k n^2)$ is too slow, while $O(k n \log n)$ fits comfortably |
| $n \le 10^5$ and $k \le 20$ | The technique applies only if the group cost can be maintained in $O(1)$ per endpoint move, or answered by a segment tree |
| $n \le 10^5$ and $k$ is also large | The $k$ factor is the problem; look for a Lagrangian penalty or a different formulation |
| The cost does not satisfy the quadrangle inequality | Divide and conquer returns a confident wrong answer; use the full recurrence or another optimization |
| The array may be reordered or sorted | The problem is no longer a contiguous partition; the recurrence does not apply |
| The objective is to minimize the largest group sum | Use binary search on the answer with a greedy feasibility check |
| $k = 1$ or $k = n$ | The answer is the cost of the whole array or the sum of the individual costs; no search is needed |

Two phrases in a statement are strong signals. "The optimal cut is monotone" is the property itself, often stated as a lemma. "The cost is Monge" or "the cost satisfies the quadrangle inequality" is the usual way the property is proved. A statement that simply says "partition into $k$ parts" is not enough: the cost has to have the monotonicity, and the article's counterexample shows what happens when it does not.

<Synonyms terms="divide-and-conquer optimization, D&C optimization, monotone opt, quadrangle inequality, Monge DP, 1D1D optimization" />

## Naive approach

The first baseline enumerates the cuts directly.

```python
def cost(left, right):
    total = prefix[right] - prefix[left - 1]
    return total * total

def search(start, groups_left):
    if groups_left == 1:
        return cost(start, n)
    best = INF
    for cut in range(start, n - groups_left + 1):
        best = min(best, cost(start, cut) + search(cut + 1, groups_left - 1))
    return best
```

The recursion is correct for every instance. It also shows the combinatorial explosion: the number of leaves is $\binom{n-1}{k-1}$, and for $n = 40$ and $k = 20$ that is already about $6.9 \ast 10^{10}$.

The second baseline is the layered dynamic program. It keeps only the previous row, so its memory is linear, but it still tries every split point.

```python
prev = [INF] * (n + 1)
prev[0] = 0
for g in range(1, k + 1):
    cur = [INF] * (n + 1)
    for i in range(g, n + 1):
        for j in range(g - 1, i):
            difference = prefix[i] - prefix[j]
            cur[i] = min(cur[i], prev[j] + difference * difference)
    prev = cur
print(prev[n])
```

This is $O(k n^2)$ time and $O(n)$ space. It is the reference implementation for the differential test: a faster program that disagrees with it on a small random instance is the one that is wrong. It is also the code that the optimized version replaces, one inner loop at a time.

At $n = 2\,000$ the number of transitions is large even after the infeasible prefixes are skipped. The worst case is near $k = n/2$, where each layer has about $n/2$ feasible prefixes and each prefix has about $n/2$ candidates. That is on the order of $10^9$ candidates, which is too many for a one-second limit in most languages.

## Key insight

The insight is that the best split point is monotone.

Let $\mathrm{opt}[g][i]$ be the smallest index $j$ that attains the minimum in the recurrence for $\mathrm{dp}[g][i]$. Then for every fixed $g$,

$$
\mathrm{opt}[g][i] \;\le\; \mathrm{opt}[g][i+1].
$$

The reason is an exchange argument. Suppose the two prefixes $i_1 < i_2$ had optimal split points $j_1 = \mathrm{opt}[g][i_2]$ and $j_2 = \mathrm{opt}[g][i_1]$ with $j_2 > j_1$. The two optimality inequalities, added together, say that the cost of using the split points in the crossed order is no larger than the cost of using them in the uncrossed order. The quadrangle inequality says the opposite. Both must therefore be equalities, so $j_1$ is also optimal for $i_1$, contradicting the choice of $j_2$ as the smallest optimum.

The formal proof is in the correctness section. The algorithmic consequence is what matters here: once the middle prefix of a range has been solved, its optimal split point is a valid upper bound for every prefix to its left and a valid lower bound for every prefix to its right.

That gives a recursive procedure. Solve the middle prefix of the current range by scanning only the candidate split points between the inherited bounds. Then recurse on the left half with the upper bound set to the middle optimum, and on the right half with the lower bound set to the middle optimum. The bounds shrink as the recursion descends, and the total work per layer becomes $O(n \log n)$.

This is divide and conquer over the _candidate range_, not over the array. The array is never split into two independent subproblems, and the recursion does not compute the answer for a subarray. It computes one DP row, and the recursive calls only narrow the interval of split points that each entry has to consider.

## Visual intuition

Picture a matrix whose rows are the prefix lengths $i$ and whose columns are the candidate split points $j$. The cell in row $i$ and column $j$ holds

$$
C[j][i] \;=\; \mathrm{dp}[g-1][j] + w(j+1, i),
$$

and only the cells with $j < i$ exist. The row minimum is the value of $\mathrm{dp}[g][i]$, and the column where it occurs is $\mathrm{opt}[g][i]$.

The matrix is not arbitrary. Because the cost is Monge, the winning column of each row moves to the right as the row index grows, or stays where it is. The minima form a staircase that never turns back. For the array $[1, 2, 3, 4, 5]$ with $k = 2$, the staircase is:

| Prefix length $i$       | 2   | 3   | 4   | 5   |
| ----------------------- | --- | --- | --- | --- |
| Smallest best split $j$ | 1   | 2   | 3   | 3   |

The first three rows move one column to the right, and the last row stays at column 3 because the extra element is cheaper to attach to the previous group than to start a new one.

Divide and conquer uses the staircase directly. It evaluates the middle row over its whole allowed interval, finds the column where the minimum sits, and then splits the matrix into two smaller regions: the rows above the middle can only use columns at or to the left of that column, and the rows below can only use columns at or to the right. Each recursive call works on a triangle whose hypotenuse is shorter than its parent's, so the total number of cells examined at one depth is at most the width of the row plus the number of calls.

The picture to keep in mind when the answer is wrong is the staircase. If the computed optimal columns wander left and right, either the cost is not Monge or the bounds passed to the recursive calls are wrong. The full scan at the middle row is what makes the staircase visible; the bounds are what make the rest of the row cheap.

## Formal model

Let $n$ be the number of elements and $k$ the number of groups. Let $a_1, a_2, \ldots, a_n$ be the array, with $a_i \ge 0$, and define the prefix sums

$$
P[0] = 0, \qquad P[i] = \sum_{t=1}^{i} a_t.
$$

Because every $a_t$ is nonnegative, the sequence $P[0], P[1], \ldots, P[n]$ is nondecreasing.

::: math definition Definition
For $1 \le l \le r \le n$, the **group cost** is

$$
w(l, r) \;=\; (P[r] - P[l-1])^2.
$$

A **feasible $g$-partition of the prefix $i$** is a sequence of cuts $0 = j_0 < j_1 < \cdots < j_g = i$ with $j_{g-1} \ge g-1$. Its cost is $\sum_{t=1}^{g} w(j_{t-1}+1, j_t)$.
:::

::: math definition Definition
Let $\mathrm{dp}[g][i]$ be the minimum cost of a feasible $g$-partition of the prefix $i$. Set $\mathrm{dp}[0][0] = 0$ and $\mathrm{dp}[0][i] = \infty$ for $i > 0$.
:::

::: math recurrence Recurrence
For $1 \le g \le k$ and $g \le i \le n$,

$$
\mathrm{dp}[g][i] \;=\; \min_{g-1 \,\le\, j \,<\, i}
\bigl(\mathrm{dp}[g-1][j] + w(j+1, i)\bigr).
$$

The answer is $\mathrm{dp}[k][n]$.
:::

The recurrence is the usual "last group" decomposition. The prefix $j$ is split into $g-1$ groups, and the last group is the contiguous block $j+1, \ldots, i$. The lower bound $j \ge g-1$ is what makes the remaining $g-1$ groups nonempty.

::: math definition Definition
A cost function $w$ is **Monge**, or satisfies the **quadrangle inequality**, when for all $j_1 \le j_2 \le i_1 \le i_2$,

$$
w(j_1+1, i_1) + w(j_2+1, i_2)
\;\le\;
w(j_1+1, i_2) + w(j_2+1, i_1).
$$
:::

For the squared-sum cost, the difference between the two sides is

$$
-2 \ast (P[j_2] - P[j_1]) \ast (P[i_2] - P[i_1]),
$$

which is at most zero because both prefix differences are nonnegative. So the cost is Monge. If the array could contain negative values, either difference could be negative and the inequality could fail; that is exactly the counterexample in the common mistakes section.

::: math lemma Lemma
If $w$ is Monge, then for every fixed $g$, the smallest optimal split point $\mathrm{opt}[g][i]$ is nondecreasing in $i$.
:::

The lemma is proved in the correctness section. The algorithm below assumes it and uses it as the invariant of the recursion.

::: math invariant Invariant
Before the call `solve(g, left, right, opt_left, opt_right)`, every prefix $i$ in $[left, right]$ has $\mathrm{opt}[g][i] \in [opt\_left, opt\_right]$.
:::

The root call uses $left = g$ and $right = n - k + g$. The upper end leaves $k - g$ elements for the remaining groups, so no later layer ever needs a prefix beyond it. The initial candidate bounds are $opt\_left = g-1$ and $opt\_right = right-1$.

## Algorithm derivation

Start with the $O(k n^2)$ recurrence. The outer loop over $g$ is unavoidable: each layer depends on the previous one. The inner two loops over $i$ and $j$ are what the optimization replaces.

The recursive procedure for one layer is:

```python
def solve(g, left, right, opt_left, opt_right):
    if left > right:
        return

    mid = (left + right) // 2
    upper = min(opt_right, mid - 1)
    best = INF
    best_j = opt_left

    for j in range(opt_left, upper + 1):
        difference = prefix[mid] - prefix[j]
        candidate = previous[j] + difference * difference
        if candidate < best:
            best = candidate
            best_j = j

    current[mid] = best
    solve(g, left, mid - 1, opt_left, best_j)
    solve(g, mid + 1, right, best_j, opt_right)
```

The call scans the candidate interval of the middle prefix and records the smallest optimal split point. It then passes that point as the right end of the left half's interval and as the left end of the right half's interval.

The layer loop is the original one, with the inner loops replaced by a single call. The row is cleared to the sentinel before the call, because entries outside the feasible range must stay unreachable.

```python
previous = [INF] * (n + 1)
previous[0] = 0

for g in range(1, k + 1):
    current = [INF] * (n + 1)
    last = n - k + g
    solve(g, g, last, g - 1, last - 1)
    previous = current
```

The bound `last` is the largest prefix that can still be split into $g$ groups while leaving at least one element for each of the remaining $k-g$ groups. Computing only that prefix is not required for correctness, but it removes a triangular tail of states that no later layer can use.

The invariant is preserved by both recursive calls. At the middle prefix, the scan covers every $j$ with $opt\_left \le j \le opt\_right$ and $j \le mid-1$. The first bound is the invariant, and the second is the requirement that the last group be nonempty. The scan therefore contains $\mathrm{opt}[g][mid]$, so `best_j` is that optimum.

For a prefix $i < mid$, monotonicity gives $\mathrm{opt}[g][i] \le \mathrm{opt}[g][mid] = best\_j$, while the lower bound $opt\_left$ is inherited. For a prefix $i > mid$, monotonicity gives $\mathrm{opt}[g][i] \ge best\_j$, while the upper bound $opt\_right$ is inherited. Each recursive call therefore starts with its own invariant, and the induction closes when the range is empty.

The comparison uses strict less-than, so `best_j` is the smallest split point that attains the minimum. The choice matters for reproducibility, and it is the choice that the monotonicity lemma is stated for. A program that keeps the largest optimum can also be made correct, but it must use that rule consistently in both bounds; mixing the two rules is a good way to lose a candidate.

Do not replace `best_j` with `mid` in either recursive call. The midpoint is the row being solved, not the column where its minimum sits. The bound comes from the winning column, and that column can be far to the left of the midpoint.

## Step-by-step execution

Take $n = 5$, $k = 3$, and the array $[1, 2, 3, 4, 5]$. The prefix sums are

$$
P = [0, 1, 3, 6, 10, 15].
$$

The dynamic program fills the following rows. The entry $\infty$ marks an infeasible prefix, and the row $g = 2$ already shows a plateau in its optimal split points.

| $g \backslash i$ | 1        | 2        | 3        | 4        | 5        |
| ---------------- | -------- | -------- | -------- | -------- | -------- |
| 0                | 0        | $\infty$ | $\infty$ | $\infty$ | $\infty$ |
| 1                | 1        | 9        | 36       | 100      | 225      |
| 2                | $\infty$ | 5        | 18       | 52       | 117      |
| 3                | $\infty$ | $\infty$ | 14       | 34       | 77       |

The first row is the cost of one group: $P[i]^2$. The second row is computed by the recurrence. For example, at $i = 5$ the candidates are

- $j = 1$: $1 + (15-1)^2 = 197$,
- $j = 2$: $9 + (15-3)^2 = 153$,
- $j = 3$: $36 + (15-6)^2 = 117$,
- $j = 4$: $100 + (15-10)^2 = 125$.

The minimum is $117$ at $j = 3$, so $\mathrm{dp}[2][5] = 117$ and $\mathrm{opt}[2][5] = 3$. The optimal columns for the row are $1, 2, 3, 3$ for $i = 2, 3, 4, 5$, which is the staircase from the visual section.

Now compute the third row with the recursive procedure. The root call is `solve(3, 3, 5, 2, 4)`.

- The middle prefix is $i = 4$. The scan visits $j = 2$ and $j = 3$ because $j \le mid-1 = 3$.
    - $j = 2$: $5 + (10-3)^2 = 5 + 49 = 54$.
    - $j = 3$: $18 + (10-6)^2 = 18 + 16 = 34$. The minimum is $34$ at $j = 3$, so $\mathrm{dp}[3][4] = 34$ and the middle optimum is $3$.
- The left call is `solve(3, 3, 3, 2, 3)`. The middle is $i = 3$, and the only candidate is $j = 2$: $5 + (6-3)^2 = 14$. So $\mathrm{dp}[3][3] = 14$.
- The right call is `solve(3, 5, 5, 3, 4)`. The middle is $i = 5$, and the candidates are $j = 3$ and $j = 4$.
    - $j = 3$: $18 + (15-6)^2 = 18 + 81 = 99$.
    - $j = 4$: $52 + (15-10)^2 = 52 + 25 = 77$. The minimum is $77$ at $j = 4$, so $\mathrm{dp}[3][5] = 77$.

The answer is $77$. Reconstructing the groups from the optimal split points: the last cut is $j = 4$, so the last group is $[5]$ with cost $25$. The prefix of length $4$ was split by $j = 3$, so the second group is $[4]$ with cost $16$. The prefix of length $3$ is the first group $[1, 2, 3]$ with sum $6$ and cost $36$. The total is $36 + 16 + 25 = 77$.

A full scan of the third row would examine $1 + 2 + 3 = 6$ candidates. The recursive procedure examines $2 + 1 + 2 = 5$. The saving is small at this size, but it grows with $n$: the full scan is quadratic in the row width, while the recursion is $O(n \log n)$ and the bound does the work.

## Correctness proof

::: math theorem Theorem
The recurrence computes $\mathrm{dp}[g][i]$, the minimum cost of a feasible $g$-partition of the prefix $i$.
:::

::: math proof Proof
The proof is induction on $g$. For $g = 0$, the only feasible partition is the empty partition of the empty prefix, so $\mathrm{dp}[0][0] = 0$ and every other entry is $\infty$.

Assume the claim for $g-1$. Consider a feasible $g$-partition of the prefix $i$. Its last cut is some $j$ with $g-1 \le j < i$. The first $j$ elements form a feasible $(g-1)$-partition, whose cost is at least $\mathrm{dp}[g-1][j]$, and the last group contributes $w(j+1, i)$. So the cost of the partition is at least the candidate for that $j$, and the minimum over all $j$ is a lower bound.

Conversely, for every $j$ with $g-1 \le j < i$, take an optimal $(g-1)$-partition of the prefix $j$ and append the group $j+1, \ldots, i$. This is a feasible $g$-partition of the prefix $i$, and its cost is exactly the candidate. So the minimum over $j$ is attained by a feasible partition. The recurrence is therefore correct. $\square$
:::

::: math lemma Lemma
The squared-sum cost satisfies the quadrangle inequality.
:::

::: math proof Proof
Let $j_1 \le j_2 \le i_1 \le i_2$. Write

$$
x = P[j_2] - P[j_1], \qquad
y = P[i_1] - P[j_2], \qquad
z = P[i_2] - P[i_1].
$$

Because the prefix sums are nondecreasing, $x, y, z \ge 0$. The four costs are

$$
w(j_1+1, i_1) = (x+y)^2, \qquad
w(j_2+1, i_2) = (y+z)^2,
$$

$$
w(j_1+1, i_2) = (x+y+z)^2, \qquad
w(j_2+1, i_1) = y^2.
$$

Subtracting the right-hand side from the left-hand side gives

$$
(x+y)^2 + (y+z)^2 - (x+y+z)^2 - y^2 = -2xz \le 0.
$$

So the quadrangle inequality holds. $\square$
:::

::: math lemma Lemma
If $w$ is Monge, then $\mathrm{opt}[g][i]$ is nondecreasing in $i$.
:::

::: math proof Proof
Fix $g$ and take two prefixes $i_1 < i_2$. Let $j_2 = \mathrm{opt}[g][i_1]$ and $j_1 = \mathrm{opt}[g][i_2]$, and suppose for contradiction that $j_2 > j_1$.

Because $j_2$ is optimal for $i_1$,

$$
\mathrm{dp}[g-1][j_2] + w(j_2+1, i_1)
\;\le\;
\mathrm{dp}[g-1][j_1] + w(j_1+1, i_1).
$$

Because $j_1$ is optimal for $i_2$,

$$
\mathrm{dp}[g-1][j_1] + w(j_1+1, i_2)
\;\le\;
\mathrm{dp}[g-1][j_2] + w(j_2+1, i_2).
$$

Adding the two inequalities cancels the DP terms and yields

$$
w(j_2+1, i_1) + w(j_1+1, i_2)
\;\le\;
w(j_1+1, i_1) + w(j_2+1, i_2).
$$

The Monge inequality for $j_1 \le j_2 \le i_1 \le i_2$ gives the reverse:

$$
w(j_1+1, i_1) + w(j_2+1, i_2)
\;\le\;
w(j_1+1, i_2) + w(j_2+1, i_1).
$$

Both inequalities must therefore be equalities. In particular, the candidate at $j_1$ has the same value as the candidate at $j_2$ for the prefix $i_1$, so $j_1$ is also optimal for $i_1$. But $j_1 < j_2$ and $j_2$ was chosen as the smallest optimal split point of $i_1$, a contradiction. Hence $j_2 \le j_1$, which is $\mathrm{opt}[g][i_1] \le \mathrm{opt}[g][i_2]$. $\square$
:::

::: math theorem Theorem
The recursive procedure computes the whole row $\mathrm{dp}[g][\cdot]$ correctly.
:::

::: math proof Proof
The proof is induction on the size of the interval $[left, right]$, using the invariant. The invariant holds at the root: every feasible split point of a prefix in $[g, n-k+g]$ lies between $g-1$ and $n-k+g-1$.

Assume the invariant for a call. Let $mid$ be its middle prefix. The scan covers every $j$ from $opt\_left$ to $\min(opt\_right, mid-1)$. The invariant gives $opt\_left \le \mathrm{opt}[g][mid] \le opt\_right$, and feasibility gives $\mathrm{opt}[g][mid] \le mid-1$, so the scan contains the optimum. It may also contain other candidates, but the minimum it computes is exactly $\mathrm{dp}[g][mid]$, and `best_j` is the smallest optimal split point.

For the left call, every prefix $i$ in $[left, mid-1]$ has $\mathrm{opt}[g][i] \le \mathrm{opt}[g][mid] = best\_j$ by monotonicity, and the lower bound is inherited. For the right call, every prefix $i$ in $[mid+1, right]$ has $\mathrm{opt}[g][i] \ge best\_j$, and the upper bound is inherited. Both calls therefore satisfy the invariant, and by induction they fill their halves correctly.

When the interval is empty, there is nothing to fill. The initial call fills every feasible prefix of the row, and the layer loop repeats the argument for each $g$. The final entry $\mathrm{dp}[k][n]$ is the answer by the recurrence theorem. $\square$
:::

## Complexity analysis

**Time per layer.** Let $m = right - left + 1$ be the width of the root interval. At every depth of the recursion, the candidate intervals of the calls are disjoint except for their endpoints, so the total number of scanned candidates at that depth is at most $m$ plus the number of calls. The recursion has $O(\log m)$ depths because each call splits the prefix range in half. The cost of one layer is therefore $O(m \log m)$, and with the feasible-range trimming $m = n-k+1$.

**Total time.** There are $k$ layers, so the running time is

$$
O\bigl(k \ast (n-k+1) \ast \log n\bigr),
$$

which is at most $O(k n \log n)$ and, in the worst ratio of $k$ to $n$, about $O(n^2 \log n)$ divided by four. For $n = 2\,000$ the number of scanned candidates is on the order of ten million, not the hundreds of millions of the quadratic recurrence.

**Auxiliary space.** The program keeps the prefix sums, the previous row and the current row, each of length $n+1$, so the space is $O(n)$. The recursion depth is $O(\log n)$ and each frame holds a constant number of integers. The full $O(k n)$ table is never needed unless the actual groups must be reconstructed for every layer.

**Arithmetic.** With $n \le 2\,000$ and $a_i \le 10^4$, a group sum is at most $2 \ast 10^7$, and its square is at most $4 \ast 10^{14}$. The total cost is at most the cost of the single group, so it also fits below $4 \ast 10^{14}$. A 64-bit signed integer is comfortable. The C, C++, Java and Pascal versions use their 64-bit type; Python integers are arbitrary precision; the JavaScript version uses a Number, which is exact up to $2^{53} \approx 9 \ast 10^{15}$, so the stated bound is safe. A larger value bound would require BigInt in JavaScript or a tighter constraint.

::: math complexity Complexity
Partitioning an array of $n$ nonnegative values into $k$ contiguous groups, with a Monge group cost, takes $O(k (n-k+1) \log n)$ time and $O(n)$ auxiliary space. The squared-sum cost fits in 64 bits under $n \le 2\,000$ and $a_i \le 10^4$.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The cost is Monge and the recurrence has one previous layer | Divide-and-conquer optimization, as in this article |
| The cost is Monge and can be updated in $O(1)$ per endpoint move | The same recursion with a moving window and counts |
| The optimal split point also satisfies $opt[g][i-1] \le opt[g][i] \le opt[g+1][i]$ | Knuth optimization, which is a different recurrence and a different proof |
| The transition is a minimum of linear functions of the state | Convex hull trick or Li Chao tree |
| The number of groups is large and the cost is convex in the number of groups | Lagrangian optimization, also called the aliens trick |
| $n \le 500$ and $k \le 500$ | The $O(k n^2)$ recurrence is simpler and may be fast enough |
| The cost is arbitrary and shows no monotonicity | No divide-and-conquer optimization; use the full recurrence or a different formulation |
| The objective is the largest group sum, not the sum of group costs | Binary search on the answer with a greedy feasibility check |
| The array may be reordered | Sort first if the problem allows it, which changes the recurrence entirely |
| The recurrence is over intervals, $\mathrm{dp}[l][r]$ | Interval dynamic programming, not this technique |

The names are easy to confuse. Divide-and-conquer optimization is not the same as dividing the input array into two halves and solving each half independently. It is also not CDQ divide and conquer, which processes offline updates in time order. The recursion here is over the range of candidate split points, and the only thing it divides is the interval of columns in the cost matrix.

The choice between divide-and-conquer optimization and Knuth optimization is decided by the state. This article's state is (number of groups, prefix length), and the split point is a single index. Knuth optimization is for interval states, where the state itself is a pair of endpoints and the split point is a position between them. Both use monotonicity, but the recurrences and the bounds are different.

## Reference implementations

The six programs are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes one `program` variant in each of the six languages. Every variant reads `n k` and then the $n$ array values from standard input, and prints the minimum total cost on one line. The input is whitespace-separated, so a value may be on any line.

The programs share the same structure:

- Read the array and build the prefix sums.
- Keep two DP rows of length $n+1$, initialized to a large sentinel except for $\mathrm{dp}[0][0] = 0$.
- For each group count $g$, clear the current row and call the recursive layer procedure on the feasible prefix range.
- Print the final entry.

The integer type differs by language. C and C++ use `long long`, Java uses `long`, Pascal uses `Int64`, Python uses arbitrary-precision integers, and JavaScript uses Number. Under the stated constraints the JavaScript values are exact, because the largest cost is below $2^{53}$.

All six variants are marked `unverified` in the manifest. The status records that a human has not signed off on the listing; it does not mean the program is known to be wrong. The fixture cases in the repository exercise a two-group split, a three-group split, and the edge case where every element is its own group.

## Recursion decision

The dynamic program itself is iterative. Only the candidate search inside one layer is recursive, and that recursion splits the prefix range in half. Its depth is $O(\log n)$, not $O(n)$: for $n = 2\,000$ it is about eleven frames. Every language in the repository can handle that comfortably.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Recursive; the depth is logarithmic |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Recursive; the depth is logarithmic |
| Python | Interpreter limit of 1000 | 1000 frames | Recursive; the depth is about eleven |
| Pascal | The operating system stack | Depends on the platform | Recursive; the depth is logarithmic |
| JavaScript | The V8 engine limit | About $10^4$ frames | Recursive; the depth is logarithmic |

The depth is logarithmic because the procedure halves the index interval at every call. It is not the number of groups, and it is not the number of split points. A program that recursed on the number of groups would have depth $k$, which can be $2\,000$ in Python and is still inside the interpreter limit but is needlessly deep. A program that recursed on every candidate would be a different algorithm and would not have the bound.

If a language has a particularly small stack or a recursion limit that cannot be raised, the same procedure can be written with an explicit stack of `(left, right, opt_left, opt_right)` tuples. The order does not matter for correctness, because the calls are independent once the bounds are computed. The recursive form is shorter and is the one used in the listings.

## Implementation walkthrough

The following is the core of the C++ variant. The other languages are translations of the same three decisions.

```cpp
const int upper = std::min(opt_right, mid - 1);
long long best = INF;
int best_j = opt_left;

for (int j = opt_left; j <= upper; ++j) {
    const long long difference = prefix_[mid] - prefix_[j];
    const long long candidate = previous_[j] + difference * difference;
    if (candidate < best) {
        best = candidate;
        best_j = j;
    }
}

current_[mid] = best;
solve_layer(left, mid - 1, opt_left, best_j);
solve_layer(mid + 1, right, best_j, opt_right);
```

**The upper bound of the scan.** `upper` is the smaller of the inherited right bound and `mid - 1`. The second term enforces that the last group is nonempty. Without it, the loop would read `previous_[mid]`, which is the value of the state being computed, and the recurrence would be wrong even if the array access happened to be in range.

**The lower bound of the scan.** The loop starts at `opt_left`, which is at least $g-1$. Starting at zero would consider prefixes that cannot be split into $g-1$ nonempty groups. Those entries hold the sentinel, so they would not win, but they would waste time and they would make the invariant harder to state.

**The comparison.** The strict `<` keeps the smallest split point among ties. The bounds passed to the recursive calls are then the smallest optimal split point, which is the version of monotonicity that the lemma proves.

**The two recursive calls.** The left call receives `best_j` as its right bound, and the right call receives `best_j` as its left bound. Passing `mid` instead of `best_j` is the most common implementation error, because it looks plausible: the middle prefix is the one just solved, so it is tempting to use it as the dividing line. The correct dividing line is the column of the minimum, not the row.

**The feasible range.** The root call is `solve_layer(g, n - k + g, g - 1, n - k + g - 1)`. The upper end leaves exactly $k-g$ elements for the remaining groups. Starting the layer at $g$ skips the prefixes that cannot hold $g$ nonempty groups. Both bounds are needed for the invariant; neither changes the answer.

**The integer arithmetic.** The difference of two prefix sums can be up to $2 \ast 10^7$, and its square up to $4 \ast 10^{14}$. The multiplication must be done in the 64-bit type, not in a 32-bit `int`. The sentinel must be large enough that adding a real cost to it cannot overflow and small enough that the sum still fits; the listings use a value around $4 \ast 10^{18}$ in C and C++, which leaves room for the added cost.

**Input parsing.** The programs read tokens until the array is full, rather than reading one line at a time. The statement says the array is on the input, not that it is on a single line, and token-based parsing accepts both layouts.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Applying the technique when the cost is not Monge | A wrong answer with no error message; the split points can move left | Prove the quadrangle inequality, or check that all values are nonnegative before using the squared-sum cost |
| Passing `mid` instead of `best_j` to the right call | The right half loses candidates to the left of the midpoint and returns a value that is too large | Pass the winning column, not the middle row |
| Forgetting to clip the scan at `mid - 1` | The loop reads the state being computed, or considers an empty last group | Use `upper = min(opt_right, mid - 1)` |
| Letting the scan start below $g-1$ | The loop reads prefixes that cannot hold $g-1$ groups | Start at `opt_left`, which is initialized to $g-1$ |
| Setting every $\mathrm{dp}[0][i]$ to zero | The first group becomes free and the answer is too small | Only $\mathrm{dp}[0][0]$ is zero; the rest are the sentinel |
| Forgetting to clear the current row | Stale values from the previous layer survive and can win a minimum | Fill the row with the sentinel before each layer |
| Using 32-bit integers | The square of a group sum overflows silently | Use `long long`, `long`, `Int64`, or a Python integer |
| Using JavaScript Number beyond $2^{53}$ | The low bits are lost and the minimum is wrong | Keep the cost below $2^{53}$ or use BigInt |
| Recomputing a segment cost in $O(n)$ for every candidate | The layer becomes $O(n^2 \log n)$ or worse | Maintain a window with counts, or use a prefix structure |
| Keeping the largest optimum in one half and the smallest in the other | The two bounds no longer describe the same tie-breaking rule | Pick one rule and use it in every call |
| Treating the technique as interval DP | The recurrence and the state are different, so the bounds do not apply | Use the layered prefix state, or switch to Knuth optimization for intervals |

### Why this fails: negative values break the quadrangle inequality

The precondition is not decorative. Take the array $[100, -50, 40, 120]$ and $k = 2$. The prefix sums are

$$
P = [0, 100, 50, 90, 210].
$$

The first DP row is the square of each prefix: $0, 10000, 2500, 8100, 44100$. The second row has the following candidates:

- $i = 2$: only $j = 1$, cost $10000 + (50-100)^2 = 12500$.
- $i = 3$: $j = 1$ gives $10000 + (90-100)^2 = 10100$; $j = 2$ gives $2500 + (90-50)^2 = 4100$. The optimum is $j = 2$.
- $i = 4$: $j = 1$ gives $10000 + (210-100)^2 = 22100$; $j = 2$ gives $2500 + (210-50)^2 = 28100$; $j = 3$ gives $8100 + (210-90)^2 = 22500$. The optimum is $j = 1$.

The optimal split points for the row are $1, 2, 1$, which is not nondecreasing. The recursion solves the middle prefix $i = 3$ and finds $best\_j = 2$. It then restricts the right half to split points at least $2$, so it never examines $j = 1$ for $i = 4$. It returns $22500$, while the true answer is $22100$.

The algebraic reason is the sign of the product in the proof. With negative values, one of the prefix differences can be negative, so $-2xz$ is positive and the quadrangle inequality reverses. The squared-sum cost is still a perfectly valid cost, and the full $O(k n^2)$ recurrence still solves the problem. What fails is the monotonicity, and with it the bound that the recursion relies on.

This is why the article states $a_i \ge 0$ as an assumption and not as a convenience. A statement that allows negative values needs a different argument, or no divide-and-conquer optimization at all.

## Variants and extensions

- **Other Monge costs.** The same recursion applies to any cost that satisfies the quadrangle inequality. The pair-unfamiliarity cost of Ciel and Gondolas, the equal-pair cost of Yet Another Minimization Problem, and the distinct-count cost of The Bakery are three contest examples. The proof changes; the $O(k n \log n)$ structure does not.
- **Costs maintained by a moving window.** When the cost is not available from a prefix sum, keep a frequency array and the current cost, and move the segment endpoints one step at a time. Adding a value and removing a value must each be $O(1)$. The recursion's call order lets the total number of moves stay $O(n \log n)$ per layer, which is the standard solution for the equal-pair cost.
- **Maximization.** If the objective is a maximum rather than a minimum, the inequality reverses and the cost is called inverse Monge. The same recursion works with the comparison and the sentinel flipped. The Bakery is the canonical example: the value of a box is the number of distinct cake types, and the total is maximized.
- **SMAWK and totally monotone matrices.** A Monge matrix is totally monotone. The SMAWK algorithm finds all row minima of a totally monotone matrix in $O(n)$ time, which removes the logarithm and gives $O(k n)$ per layer. The constants and the implementation are heavier, and the divide-and-conquer version is usually enough.
- **Knuth optimization.** When the state is an interval and the optimal split point satisfies a two-sided bound involving the neighboring states, Knuth optimization computes the table in $O(n^2)$ rather than $O(n^3)$. It is a different technique with a different invariant; do not mix the two bounds.
- **Lagrangian optimization.** If the number of groups is large and the optimal cost is convex as a function of $k$, add a penalty $\lambda$ per group and solve the unconstrained problem without the group dimension. Binary search on $\lambda$ recovers the constrained answer. The penalty removes the $k$ factor but requires the convexity and an exact tie-breaking rule.
- **Reconstruction.** To recover the actual groups, store the optimal split point for every state, which costs $O(k n)$ memory, or recompute each layer backwards from the final state and keep only the current row. The second option keeps the memory at $O(n)$ and costs another $O(k n)$ time.
- **Costs that are not Monge.** A cost that depends on the positions in a non-monotone way, or on values that can be negative, may still be solvable by a different optimization, but not by this one. The quadratic recurrence remains the safe fallback.

## Contest strategy

Under contest pressure, the technique is usually lost to one of two things: a wrong monotonicity assumption or a wrong bound. A fixed procedure avoids both.

1. Write the recurrence and say what the split point means. The state is (number of groups, prefix length), and the transition is the previous layer plus the cost of the last group.
2. Write the $O(k n^2)$ version first, and test it against a brute-force enumeration on random arrays with $n \le 12$. The quadratic version is the oracle for everything that follows.
3. Prove the quadrangle inequality or state the monotonicity lemma. For the squared-sum cost, the proof is the sign of $-2xz$; for another cost, do the algebra before writing the optimized code.
4. Add the recursive layer and compare it with the oracle on thousands of random small instances. A mismatch usually means the bound is `mid` instead of `best_j`, or the scan is not clipped.
5. Check the feasible range: the root starts at $g$ and ends at $n-k+g$, and the candidate bounds start at $g-1$ and end at the last prefix minus one.
6. Check the arithmetic before submitting. The largest group sum, its square, and the total cost are three different bounds, and the largest of them decides the integer type.
7. If the optimized version is still too slow, do not micro-optimize the scan. Look for a stronger structure: SMAWK for a totally monotone matrix, a convex hull trick for linear transitions, or a Lagrangian penalty for a large $k$.
8. If the answer is wrong, print the optimal split points of the small instances and look for a decrease. A decrease is proof that the monotonicity assumption is false for the cost, not a bug in the recursion.

## Worked problems

### Problem 1: Ciel and Gondolas

**Restatement.** There are $n$ people in a queue and $k$ gondolas. The gondolas are filled in order, each with a positive contiguous block of the remaining people. The unfamiliarity of a gondola is the sum of $u_{ij}$ over every unordered pair of people inside it. Minimize the total unfamiliarity. Constraints: $1 \le n \le 4\,000$ and $1 \le k \le \min(n, 800)$.

**Naive baseline.** The layered recurrence has $O(n^2)$ transitions per layer. With $k = 800$ and $n = 4\,000$, that is over ten billion transitions even if the block cost is $O(1)$.

**Insight.** The block cost is a sum over a triangular region of a symmetric matrix, so a two-dimensional prefix sum answers it in $O(1)$. The cost is Monge: extending a block by one person adds the unfamiliarity of that person with everyone already in the block, and a larger block has at least as many such pairs. Therefore the best split point is nondecreasing.

**Derivation.** Precompute the two-dimensional prefix sums of $u$ restricted to the upper triangle, so that `cost(l, r)` is a constant-time query. Then apply the recursive layer procedure with the block cost in place of the squared sum. The DP state is the number of gondolas and the number of people assigned, and the answer is the state with $k$ gondolas and $n$ people.

**Correctness.** The recurrence is the last-group decomposition, and the block cost is exact by the prefix-sum inclusion-exclusion. The monotonicity follows from the Monge inequality for the pair-sum cost. The recursion then computes each layer correctly by the same invariant as the article's proof.

**Complexity.** The prefix sums cost $O(n^2)$ time and memory. The dynamic program costs $O(k n \log n)$ time and $O(n)$ additional memory. At $n = 4\,000$ and $k = 800$, the optimized transition count is about $800 \ast 4\,000 \ast 12 = 3.8 \ast 10^7$, which is comfortable.

**Common wrong approach.** Using divide and conquer but recomputing `cost(l, r)` by summing the matrix entries. That turns each transition into $O(n^2)$ work in the worst case and loses the entire advantage. The prefix sum is not an optimization detail; it is part of the intended solution.

### Problem 2: Yet Another Minimization Problem

**Restatement.** Given an array of $n$ integers, split it into $k$ nonempty contiguous segments. The cost of a segment is the number of unordered pairs of distinct indices inside it that hold equal values. Minimize the total cost. Constraints: $2 \le n \le 10^5$ and $2 \le k \le \min(n, 20)$.

**Naive baseline.** The layered recurrence has $O(n^2)$ transitions per layer, and recomputing a segment cost from scratch adds another factor of $n$. With $n = 10^5$, even the $O(k n^2)$ form is far too slow.

**Insight.** The cost of a segment can be maintained in $O(1)$ per endpoint move. When a value $x$ is added to a segment that already contains $c$ copies of $x$, the number of equal pairs rises by $c$. When a copy is removed, the number falls by the number of copies remaining after the removal. The cost is Monge, so the optimal split point is monotone.

**Derivation.** Keep a frequency array and the current pair count. In the recursive layer procedure, move the left and right endpoints of the shared window to the segment that the current candidate needs, updating the count one position at a time. The recursion visits the candidate ranges in an order that keeps the total movement at $O(n \log n)$ per layer. The DP transition itself is the same last-group recurrence.

**Correctness.** The window update is exact because each addition or removal changes the pair count by exactly the number of matching elements on the other side. The recurrence is the last-group decomposition, and the monotonicity follows from the Monge inequality for the pair count. The recursion computes the layer by the invariant.

**Complexity.** $O(k n \log n)$ endpoint moves and $O(n)$ memory. With $n = 10^5$ and $k = 20$, the number of moves is a few tens of millions, which is the intended scale. The answer can reach about $5 \ast 10^9$ for an array of equal values, so it must be stored in a 64-bit integer.

**Common wrong approach.** Recomputing the pair count for every candidate by scanning the segment. The resulting program has the right recurrence and the right monotonicity but a factor of $n$ too much work, and it times out on the large cases.

### Problem 3: The Bakery

**Restatement.** There are $n$ cakes in a fixed order and exactly $k$ boxes. Each box holds a nonempty contiguous segment of cakes, and its value is the number of distinct cake types inside it. Maximize the total value. Constraints: $1 \le n \le 35\,000$ and $1 \le k \le \min(n, 50)$.

**Naive baseline.** The layered recurrence tries every previous cut for every prefix, for about $3 \ast 10^{10}$ transitions at the top of the range. The direct form is hopeless.

**Insight.** The distinct-count cost is inverse Monge: extending a segment by one position can only add a type that was not already there, and the gain is smaller when the segment is larger. The optimal split point is nondecreasing in the prefix length, even though the objective is a maximum.

**Derivation.** Apply the recursive layer procedure with a maximum instead of a minimum. For a fixed right endpoint and a left endpoint moving left, the distinct count grows exactly when the new value does not already occur in the current segment. Precompute the next occurrence of each position, or maintain a segment tree, so each candidate is evaluated in constant or logarithmic time. The DP state is the number of boxes and the number of cakes assigned.

**Correctness.** The recurrence is the last-group decomposition with a maximum. The inverse Monge inequality gives monotone optimal split points, and the recursion's invariant is the same one as in the minimization case, with the comparison reversed. The distinct-count update is exact because a value contributes one to the count if and only if it has an occurrence in the segment.

**Complexity.** $O(k n \log n)$ time and $O(n)$ memory. The answer is at most $n$, so a 32-bit integer is enough for the value, although the implementation may keep the DP rows in 64 bits for uniformity.

**Common wrong approach.** Minimizing instead of maximizing. The recurrence looks almost the same, but the sentinel, the comparison, and the direction of the monotonicity all change. A program that keeps the minimum returns zero for many inputs and looks plausible on the samples only if the samples happen to have a zero-cost partition.

## Practice progression

1. **Recognition.** Given a statement, decide whether it is a contiguous partition into exactly $k$ groups with an additive group cost. Look for the words "contiguous", "segments", "boxes", "trucks", and for a cost that depends only on the group.
2. **Direct application.** Implement the $O(k n^2)$ recurrence for the squared-sum cost, then implement the recursive layer and compare the two on random arrays with $n \le 12$. The two must agree on every instance.
3. **Adaptation.** Change the cost to the number of equal pairs and maintain it with a frequency array. Change the objective to a maximum and flip the comparison. Check that the monotonicity proof still applies to each new cost.
4. **Combination.** Combine the technique with prefix sums for $O(1)$ block costs, with a moving window for costs that are not prefix-summable, and with a reconstruction pass that recovers the actual groups.
5. **Challenge.** Implement the SMAWK algorithm for a totally monotone matrix and compare its running time with the divide-and-conquer version on the same instance. Alternatively, implement the Lagrangian penalty for a large number of groups and explain why the answer is recovered by binary search.
6. **Transfer.** Recognize the recurrence in a problem that never mentions an array partition: a post-office placement on a line, a $k$-median problem with ordered clients, a compression problem that chooses $k$ dictionary blocks, or a scheduling problem with a convex cost per batch.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the recurrence for $\mathrm{dp}[g][i]$ and explain what the split point $j$ represents. (Formal model)
2. State the quadrangle inequality and prove it for the squared-sum cost. (Correctness proof)
3. Why does the quadrangle inequality imply that the optimal split point is nondecreasing? (Correctness proof)
4. What bounds does the recursive call pass to its left and right halves, and why is the bound the optimal split point rather than the midpoint? (Algorithm derivation)
5. What is the invariant of the recursive procedure, and which part of the proof uses it? (Formal model)
6. Why must the candidate scan stop at `mid - 1`, and what happens if it does not? (Implementation walkthrough)
7. Give the smallest counterexample where negative values break the monotonicity, and state the wrong answer the optimized program returns. (Common mistakes)
8. What is the running time of one layer, and why is the total at most $O(k n \log n)$? (Complexity analysis)
9. Why does the program need only $O(n)$ memory, and when would it need the full $O(k n)$ table? (Complexity analysis)
10. How do you handle a group cost that cannot be computed from prefix sums in $O(1)$? (Variants and extensions)
11. When is Knuth optimization the right choice instead of this technique? (Algorithm selection)
12. How do you recover the actual groups from the DP, and what does that do to the memory? (Variants and extensions)
13. What integer type does each language variant use, and when does JavaScript Number stop being exact? (Complexity analysis)

## Further reading

- The layered recurrence and the role of the previous row are developed in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack), which uses the same one-row-at-a-time idea for a different state.
- The interval form of dynamic programming, where the state is a pair of endpoints, is in [interval DP](/algorithms/dynamic-programming/interval-dp); Knuth optimization is the monotonicity argument for that form.
- When the transition is a minimum of linear functions rather than a split point, the tool is the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The prefix sums that turn a group sum into a subtraction are in [prefix sums](/algorithms/arrays/prefix-sums); the two-dimensional version is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- Minimizing the largest group instead of the sum of group costs is a different problem, solved by [binary search on the answer](/algorithms/searching/binary-search-on-answer).
- When the cost of a group has to be maintained under endpoint moves, the structure is usually a [segment tree](/algorithms/range-queries/segment-tree) or a pair of frequency arrays.
- The running-time and memory bounds used throughout the article are reviewed in [complexity](/algorithms/foundations/complexity).
