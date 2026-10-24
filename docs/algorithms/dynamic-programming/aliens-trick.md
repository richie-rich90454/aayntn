---
id: dynamic-programming.aliens-trick
title: The aliens trick
summary: Split an array into exactly k contiguous groups with minimum total squared group sum by charging a penalty per group and binary searching for the penalty that makes the optimum use k groups.
division: [platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    - aliens trick
    - Lagrangian optimization
    - WQS binary search
    - penalty method
    - discrete convexity
    - partition dynamic programming
prerequisites:
    required: [dynamic-programming.0-1-knapsack, foundations.complexity]
    recommended: [arrays.prefix-sums, dynamic-programming.li-chao-tree, searching.binary-search]
complexity:
    time: "O(n log n log(S_n^2))"
    space: "O(n)"
assumptions:
    - Every array element is a nonnegative integer, so the prefix sums never decrease and the optimal cost is an integer.
    - The array is split into exactly k contiguous nonempty groups, and the cost of a group is the square of its sum.
implementations: dynamic-programming.aliens-trick
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="dynamic-programming.aliens-trick" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="dynamic-programming.aliens-trick" />

The aliens trick removes one dimension from a dynamic program. The dimension is a count: exactly $k$ groups, exactly $k$ operations, exactly $k$ photos. Instead of paying a factor of $k$ to track that count, the trick charges a price $\lambda$ for every group, solves the problem with no count constraint at all, and then searches for the price at which the unconstrained optimum happens to use $k$ groups.

The price is a Lagrangian penalty, and the search works because the optimal cost is a convex function of the group count. If $f(g)$ is the minimum cost with exactly $g$ groups, then the marginal saving from one more group never increases as $g$ grows. Each penalty $\lambda$ finds a point where a line of slope $-\lambda$ supports the graph of $f$. Raising $\lambda$ moves that point to the left, toward fewer groups.

For the array problem in this article, the count-free dynamic program is one-dimensional and each transition is a line query. A Li Chao tree evaluates it in $O(n \log n)$ per penalty, and about fifty penalties are enough under the stated constraints. The result is $O(n \log n \log(S_n^2))$ time and $O(n)$ space, with no layer indexed by the number of groups.

The technique is named after the IOI 2016 problem [Aliens](https://oj.uz/problem/view/IOI16_aliens), whose solution combines the penalty search with a convex hull trick. The same idea is called Lagrangian optimization or WQS binary search in other write-ups.

## Problem motivation

A batch processor receives $n$ jobs in a fixed order. The jobs are split into exactly $k$ consecutive batches, and every batch runs on one machine. A machine that receives a batch of total size $s$ finishes it in time proportional to $s^2$, because the work queues up before it drains. The scheduler wants the smallest possible sum of squared batch sizes.

The input is an array of nonnegative integers $a_1, \ldots, a_n$ and a number $k$. A valid solution chooses cut positions

$$
0 = j_0 < j_1 < \cdots < j_k = n
$$

and pays

$$
\sum_{t=1}^{k} \bigl(S_{j_t} - S_{j_{t-1}}\bigr)^2,
$$

where $S_i = a_1 + \cdots + a_i$ is the prefix sum. The groups are the intervals $(j_{t-1}, j_t]$, so every group is contiguous and nonempty, and there are exactly $k$ of them.

The constraints are what make the problem interesting:

- $1 \le n \le 2000$ jobs.
- $1 \le k \le n$ batches.
- $0 \le a_i \le 10^4$, so $S_n \le 2 \ast 10^7$ and the largest possible cost is $S_n^2 \le 4 \ast 10^{14}$.
- The answer fits in a signed 64-bit integer.

The straightforward dynamic program has $k$ layers and tries every split point in every layer, so it costs $O(k n^2)$. At $n = k = 2000$ a direct count of the inner-loop iterations gives about $1.3 \ast 10^9$ transitions. The aliens trick removes the $k$ layers entirely: each penalty evaluation is a single one-dimensional DP, and the search over penalties adds only a logarithmic factor.

The same shape appears far beyond batch scheduling. A compression format chooses $k$ blocks, a delivery plan chooses $k$ routes, and a photo mission chooses $k$ square photos. In every case the count is a constraint on the number of pieces, and the cost is additive over the pieces.

## Recognition patterns

The aliens trick is the right tool when all of the following hold.

- The problem asks for **exactly $k$** groups, segments, operations, or pieces.
- The cost is **additive over the pieces**, so a partition has a well-defined total cost.
- The optimal cost $f(g)$ is **discrete convex** in the number of pieces: the saving from one more piece never increases.
- Dropping the count constraint produces a dynamic program that is **much faster** than the layered one, usually because the count was a state dimension.

The technique is not a general-purpose replacement for a layered DP. The convexity condition is the load-bearing assumption, and it fails for many cost functions.

| Signal | What it means |
| --- | --- |
| "Split into exactly $k$ contiguous groups" | The canonical setting; the groups form a partition of a sequence |
| "Use exactly $k$ operations" with an additive cost | The count is the dimension to remove |
| The cost of a group depends only on its contents | The layered DP has the form $\mathrm{dp}[g][i] = \min_j \mathrm{dp}[g-1][j] + w(j,i)$ |
| The marginal cost of one more group decreases | Convexity; the penalty search can recover every $k$ |
| "At most $k$" and extra groups never hurt | Often equivalent to exactly $k$; otherwise add a boundary case |
| The cost has negative or alternating terms | Convexity usually fails; test small cases before trusting the trick |
| $k$ is tiny, at most $50$ | A layered DP with divide-and-conquer or convex hull optimization may be simpler |
| The count constraint is on a different quantity than the pieces | The penalty must be attached to the counted quantity, not to the pieces |

Two phrases are strong signals. "Exactly $k$ parts" is the definition of the constrained problem. "The cost of a part is convex in its size" is the property that usually makes the sequence $f(g)$ convex. The article on [divide-and-conquer optimization](/algorithms/dynamic-programming/divide-and-conquer-optimization) covers the layered DP that the aliens trick is trying to avoid; when $k$ is small, that technique is often the better choice.

<Synonyms terms="aliens trick, Lagrangian optimization, WQS binary search, penalty method" />

## Naive approach

The baseline enumerates every choice of $k - 1$ cut positions and keeps the cheapest partition.

```python
from itertools import combinations

best = None
for cuts in combinations(range(1, n), k - 1):
    previous = 0
    total = 0
    for cut in cuts + (n,):
        difference = prefix[cut] - prefix[previous]
        total += difference ** 2
        previous = cut
    if best is None or total < best:
        best = total
```

The number of partitions is $\binom{n-1}{k-1}$, which is exponential in $n$ when $k$ is near $n/2$. The enumeration is useful only as a reference implementation for differential testing.

The standard dynamic program is much better and is the object that the aliens trick transforms.

```python
infinity = float("inf")
dp = [[infinity] * (n + 1) for _ in range(k + 1)]
dp[0][0] = 0

for groups in range(1, k + 1):
    for i in range(groups, n + 1):
        for j in range(groups - 1, i):
            difference = prefix[i] - prefix[j]
            candidate = dp[groups - 1][j] + difference ** 2
            if candidate < dp[groups][i]:
                dp[groups][i] = candidate
```

This is $O(k n^2)$ time and $O(k n)$ space, or $O(n)$ space if only the previous layer is kept. At $n = 2000$ and $k = 2000$ the transition count is about $1.3 \ast 10^9$, because the inner loop only runs for $j < i$; it is still far too slow.

The recurrence can be sped up without removing the count. The cost $w(j,i) = (S_i - S_j)^2$ satisfies the quadrangle inequality, so the best split point is monotone in $i$, and divide-and-conquer optimization evaluates one layer in $O(n \log n)$. That gives $O(k n \log n)$, which is still linear in $k$. The aliens trick is the next step: it removes $k$ from the exponent of the running time altogether.

## Key insight

The insight is to stop treating the number of groups as a state and start treating it as something that can be bought.

Charge a price $\lambda$ for every group. A partition into $g$ groups now costs

$$
\text{cost of the partition} + \lambda g.
$$

The modified problem has no count constraint. The dynamic program only needs to know the best penalized value for each prefix, not the best value for each prefix and each group count. If the unconstrained optimum uses $c$ groups, then the original cost of that partition is the penalized value minus $\lambda c$.

The second half of the insight is that the count moves monotonically with the price. When groups are expensive, the optimum uses few of them; when groups are free, it uses many. If $c(\lambda)$ is the number of groups in the penalized optimum, then $c(\lambda)$ is non-increasing in $\lambda$. A binary search can therefore find the price at which the count crosses $k$.

The third half, and the one that is easy to miss, is that the original cost must be convex in the count. Convexity is what guarantees that the crossing price actually reproduces $f(k)$ rather than some point on the lower convex hull of a non-convex sequence. For squared group sums, the quadrangle inequality supplies the convexity, and the proof is in the correctness section.

Put together: penalize, solve without the count, binary search the penalty, and subtract the penalty from the answer. The $k$ layers are gone; the price of removing them is a logarithmic number of penalty evaluations and a tie-breaking rule.

## Visual intuition

The picture is a graph of the optimal cost $f(g)$ against the number of groups $g$. For the array $[3, 1, 4, 1]$ the values are

| $g$             | 1   | 2   | 3   | 4   |
| --------------- | --- | --- | --- | --- |
| $f(g)$          | 81  | 41  | 33  | 27  |
| $f(g) - f(g+1)$ | 40  | 8   | 6   | —   |

The marginal savings are $40, 8, 6$, which decrease as $g$ grows. That is discrete convexity. The graph bends upward: the first extra group saves a lot, the next saves less, and the last saves least.

Now draw a line of slope $-\lambda$ and raise it until it touches the graph from below. The contact point is the group count that minimizes $f(g) + \lambda g$. At $\lambda = 0$ the contact is at $g = 4$, because all savings are nonnegative. At $\lambda = 7$ it is at $g = 3$. At $\lambda = 9$ it is at $g = 2$, and at $\lambda = 41$ it is at $g = 1$. Raising the price slides the contact point left.

```
f(g)
  |
  |\
  | \        slope -lambda
  |  \      /
  |   \____/     contact point = c(lambda)
  |        \
  +---------+------------ g
            4
```

A flat piece of the graph is a tie: several group counts have the same penalized value. The tie is not a nuisance; it is exactly the interval of prices on which $f$ is linear. The binary search must sit at the right end of that interval, which is why the dynamic program breaks ties toward more groups.

The same picture explains the answer formula. If the contact point is $c$, then

$$
f(c) + \lambda c = v(\lambda),
$$

where $v(\lambda)$ is the penalized optimum. When $c = k$, the original cost is $v(\lambda) - \lambda k$. When $c > k$, the contact point sits on a flat segment that contains $k$, and the same subtraction still gives $f(k)$ as long as $\lambda$ is the largest price whose count is at least $k$.

## Formal model

Let $n \ge 1$ and let $a_1, \ldots, a_n$ be nonnegative integers. Define the prefix sums

$$
S_0 = 0, \qquad S_i = \sum_{t=1}^{i} a_t \quad (1 \le i \le n).
$$

::: math definition Definition
A **$g$-partition** of the array is a sequence of cut positions $0 = j_0 < j_1 < \cdots < j_g = n$. Its **cost** is

$$
C(j_0, \ldots, j_g) = \sum_{t=1}^{g} \bigl(S_{j_t} - S_{j_{t-1}}\bigr)^2.
$$

The optimal cost with exactly $g$ groups is

$$
f(g) = \min_{\substack{0 = j_0 < j_1 < \cdots < j_g = n}} C(j_0, \ldots, j_g).
$$

:::

::: math definition Definition
For a penalty $\lambda$, the **penalized cost** of a $g$-partition is its cost plus $\lambda g$. Let $F_\lambda(i)$ be the minimum penalized cost over partitions of the prefix $a_1, \ldots, a_i$, and let $G_\lambda(i)$ be the largest number of groups among the partitions that attain $F_\lambda(i)$. Write $v(\lambda) = F_\lambda(n)$ and $c(\lambda) = G_\lambda(n)$.
:::

::: math recurrence Recurrence
For $i \ge 1$ and $0 \le j < i$,

$$
F_\lambda(i) = \min_{0 \le j < i} \Bigl(F_\lambda(j) + \bigl(S_i - S_j\bigr)^2 + \lambda\Bigr),
$$

with $F_\lambda(0) = 0$ and $G_\lambda(0) = 0$. The pair $(F_\lambda(i), G_\lambda(i))$ is compared lexicographically: first by smaller value, then by larger group count. Equivalently, $G_\lambda(i) = G_\lambda(j) + 1$ for the candidate $j$ with the smallest value and, among ties, the largest $G_\lambda(j) + 1$.
:::

::: math lemma Lemma
For every $2 \le g \le n-1$,

$$
f(g-1) + f(g+1) \ge 2 f(g).
$$

Equivalently, the differences $d_g = f(g) - f(g+1)$ satisfy $d_1 \ge d_2 \ge \cdots \ge d_{n-1}$.
:::

::: math lemma Lemma
The function $c(\lambda)$ is non-increasing in $\lambda$.
:::

::: math theorem Theorem
Let

$$
\lambda^\ast = \max\{\lambda \in \{0, 1, \ldots, S_n^2 + 1\} : c(\lambda) \ge k\}.
$$

Then

$$
f(k) = v(\lambda^\ast) - \lambda^\ast k.
$$

:::

The recurrence is the count-free dynamic program. The two lemmas are the convexity of $f$ and the monotonicity of the count. The theorem is the recovery formula. The rest of the article proves all three and shows how to evaluate the recurrence quickly.

## Algorithm derivation

Start with the layered dynamic program. Let $\mathrm{dp}[g][i]$ be the minimum cost of splitting the first $i$ elements into exactly $g$ groups. The last group starts at some position $j+1$, so

$$
\mathrm{dp}[g][i] = \min_{g-1 \le j < i} \Bigl(\mathrm{dp}[g-1][j] + \bigl(S_i - S_j\bigr)^2\Bigr).
$$

The answer is $\mathrm{dp}[k][n]$. The array has $k$ layers, and every layer scans all split points.

Now charge $\lambda$ for a group. If the last group starts at $j+1$, the penalized value of the prefix is the penalized value of the first $j$ elements, plus the cost of the last group, plus $\lambda$. The layer index disappears because the penalty already accounts for the number of groups:

$$
F_\lambda(i) = \min_{0 \le j < i} \Bigl(F_\lambda(j) + \bigl(S_i - S_j\bigr)^2 + \lambda\Bigr).
$$

This is one array of $n+1$ states instead of a table with $k$ rows.

The count has not disappeared completely: it is needed to decide where the binary search goes. Carry the pair $(F_\lambda(i), G_\lambda(i))$ and compare values first, counts second. If two transitions have the same penalized value, the one with more groups wins. This choice is deliberate. It makes $G_\lambda(n)$ the right endpoint of a flat segment, which is the endpoint that the binary search needs.

The binary search range is $0 \le \lambda \le S_n^2 + 1$. At $\lambda = 0$, every extra group is free or beneficial, so the optimum uses all $n$ groups and $c(0) = n$. At $\lambda = S_n^2 + 1$, one group is strictly better than any partition into two or more groups: the one-group cost is $S_n^2 + \lambda = 2S_n^2 + 1$, while a partition into $g \ge 2$ groups costs at least $g\lambda \ge 2S_n^2 + 2$. So $c(S_n^2 + 1) = 1$. The count therefore crosses every $k$ between $1$ and $n$.

The search looks for the **largest** $\lambda$ with $c(\lambda) \ge k$. The opposite predicate, the smallest $\lambda$ with $c(\lambda) \le k$, is wrong on flat segments and is examined in Common mistakes.

What remains is the inner transition. It has the form

$$
F_\lambda(j) + \bigl(S_i - S_j\bigr)^2 + \lambda
= \bigl(-2S_j\bigr) S_i + \bigl(F_\lambda(j) + S_j^2\bigr) + S_i^2 + \lambda.
$$

For a fixed $j$, this is a line in the variable $x = S_i$:

$$
y = m_j x + b_j, \qquad m_j = -2S_j, \qquad b_j = F_\lambda(j) + S_j^2.
$$

The DP at position $i$ queries all lines with $j < i$ at $x = S_i$, adds $S_i^2 + \lambda$, and inserts the line for $i$ after its value is known. The lines have decreasing slopes because the prefix sums are non-decreasing. Queries are also non-decreasing. A monotone convex hull trick would work, but equal prefix sums create equal slopes and make the tie handling delicate. The reference implementations use a Li Chao tree, which handles arbitrary slopes, equal slopes, and the count tie-break uniformly.

::: math invariant Invariant
After the line for position $j$ is inserted, the Li Chao tree contains exactly the lines of positions $0, 1, \ldots, j$, and a query at $S_i$ returns the best pair among those lines for the penalized value, breaking ties toward more groups.
:::

The invariant is maintained by inserting each line once, immediately after its DP value is computed. Querying before inserting the line for $i$ is what keeps the last group nonempty: position $i$ cannot be both the end of the previous prefix and the start of the last group.

## Step-by-step execution

Take the array $[3, 1, 4, 1]$, so $n = 4$ and $S = [0, 3, 4, 8, 9]$. The total is $S_4 = 9$. The optimum for $k = 2$ is

$$
[3, 1] \mid [4, 1] = 4^2 + 5^2 = 16 + 25 = 41.
$$

The full sequence of optimal costs is $f(1) = 81$, $f(2) = 41$, $f(3) = 33$, and $f(4) = 27$. The marginal savings are $40$, $8$, and $6$, in that order.

**The binary search.** The upper bound is $9^2 + 1 = 82$.

| Step | $\lambda$ | $c(\lambda)$ | Decision                                 |
| ---- | --------- | ------------ | ---------------------------------------- |
| 1    | 41        | 1            | $1 < 2$, so the upper bound becomes 40   |
| 2    | 20        | 2            | $2 \ge 2$, so the lower bound becomes 20 |
| 3    | 30        | 2            | $2 \ge 2$, so the lower bound becomes 30 |
| 4    | 35        | 2            | $2 \ge 2$, so the lower bound becomes 35 |
| 5    | 38        | 2            | $2 \ge 2$, so the lower bound becomes 38 |
| 6    | 39        | 2            | $2 \ge 2$, so the lower bound becomes 39 |
| 7    | 40        | 2            | $2 \ge 2$, so the lower bound becomes 40 |

The search stops at $\lambda^\ast = 40$. At that price the penalized optimum is $121$ with two groups, and the answer is $121 - 40 \ast 2 = 41$.

**The penalized DP at $\lambda = 40$.** The line for position $j$ has slope $-2S_j$ and intercept $F(j) + S_j^2$.

| $j$ | $S_j$ | $F(j)$ | slope | intercept |
| --- | ----- | ------ | ----- | --------- |
| 0   | 0     | 0      | 0     | 0         |
| 1   | 3     | 49     | -6    | 58        |
| 2   | 4     | 56     | -8    | 72        |
| 3   | 8     | 104    | -16   | 168       |

The DP values come out as follows.

- $i = 1$, $x = 3$: the only line is $j = 0$, with value $0$. Then $F(1) = 0 + 9 + 40 = 49$ and $G(1) = 1$.
- $i = 2$, $x = 4$: $j = 0$ gives $16 + 40 = 56$ with one group; $j = 1$ gives $49 + 1 + 40 = 90$ with two groups. The best is $(56, 1)$.
- $i = 3$, $x = 8$: $j = 0$ gives $64 + 40 = 104$; $j = 1$ gives $49 + 25 + 40 = 114$; $j = 2$ gives $56 + 16 + 40 = 112$. The best is $(104, 1)$.
- $i = 4$, $x = 9$: $j = 0$ gives $81 + 40 = 121$ with one group; $j = 1$ gives $49 + 36 + 40 = 125$; $j = 2$ gives $56 + 25 + 40 = 121$ with two groups; $j = 3$ gives $104 + 1 + 40 = 145$. The tie at $121$ is broken toward two groups, so the final pair is $(121, 2)$.

The line values at $i = 4$ make the tie visible: $j = 0$ evaluates to $0$ and $j = 2$ evaluates to $0$, so both reach $121$ after adding $S_4^2 + 40 = 81 + 40$. The first has one group, the second has two. The DP keeps two, and the subtraction $121 - 40 \ast 2$ recovers $41$.

## Correctness proof

::: math theorem Theorem
For every $\lambda \ge 0$, the recurrence computes $F_\lambda(n)$ and the largest group count among the optimal partitions.
:::

::: math proof Proof
Induct on $i$. The base is $F_\lambda(0) = 0$ with zero groups, which is the only partition of the empty prefix.

For $i \ge 1$, every partition of the first $i$ elements has a last group that starts at some $j + 1$ with $0 \le j < i$. The prefix before that group is a partition of the first $j$ elements, and the last group costs $(S_i - S_j)^2$. Conversely, every choice of $j$ and every partition of the first $j$ elements produces a valid partition of the first $i$ elements. By the induction hypothesis, the best pair for the prefix $j$ is $(F_\lambda(j), G_\lambda(j))$. For a fixed $j$, adding $(S_i - S_j)^2 + \lambda$ and one group to every partition of that prefix preserves the order between them, so the best pair with last cut $j$ is obtained from $(F_\lambda(j), G_\lambda(j))$. Taking the lexicographic minimum over $j$ gives the correct pair for $i$. $\square$
:::

::: math lemma Lemma
For $a \le b \le c \le d$,

$$
\bigl(S_c - S_a\bigr)^2 + \bigl(S_d - S_b\bigr)^2
\le
\bigl(S_d - S_a\bigr)^2 + \bigl(S_c - S_b\bigr)^2.
$$

:::

::: math proof Proof
Move the right-hand side to the left and expand. The difference is

$$
-2\bigl(S_b - S_a\bigr)\bigl(S_d - S_c\bigr),
$$

which is nonpositive because both factors are nonnegative. $\square$
:::

The inequality is the quadrangle inequality for the cost $w(j,i) = (S_i - S_j)^2$. It says that two nested intervals are cheaper than two crossing intervals with the same outer endpoints.

::: math lemma Lemma
The optimal costs satisfy $f(g-1) + f(g+1) \ge 2f(g)$ for every $2 \le g \le n-1$.
:::

::: math proof Proof
Take an optimal partition $A$ into $g-1$ groups and an optimal partition $B$ into $g+1$ groups. List the internal cuts of $A$ and $B$ together in sorted order and alternate them: the first, third, fifth, and so on become the cuts of a partition $C$ with $g$ groups, and the second, fourth, sixth, and so on become the cuts of a partition $D$ with $g$ groups.

The partitions $C$ and $D$ interlace the original ones. Whenever a cut of $A$ and a cut of $B$ cross, the two blocks involved can be replaced by the two nested blocks, and the quadrangle inequality says the total cost does not increase. Repeating this uncrossing for every pair of cuts turns $A$ and $B$ into $C$ and $D$ without ever increasing the total cost. Therefore

$$
\operatorname{cost}(C) + \operatorname{cost}(D) \le \operatorname{cost}(A) + \operatorname{cost}(B) = f(g-1) + f(g+1).
$$

Both $C$ and $D$ are valid $g$-partitions, so $f(g) \le \operatorname{cost}(C)$ and $f(g) \le \operatorname{cost}(D)$. Adding the two bounds gives $2f(g) \le f(g-1) + f(g+1)$. $\square$
:::

The alternating-cut construction is the standard uncrossing argument for Monge costs. The only property it uses is the quadrangle inequality proved above.

::: math lemma Lemma
The count $c(\lambda)$ is non-increasing in $\lambda$.
:::

::: math proof Proof
Let $\lambda < \mu$, and let $g = c(\lambda)$ and $h = c(\mu)$. Optimality at $\lambda$ gives

$$
f(g) + \lambda g \le f(h) + \lambda h,
$$

and optimality at $\mu$ gives

$$
f(h) + \mu h \le f(g) + \mu g.
$$

Adding the two inequalities yields

$$
(\lambda - \mu)(g - h) \le 0.
$$

Since $\lambda - \mu < 0$, this forces $g - h \ge 0$, so $g \ge h$. $\square$
:::

::: math theorem Theorem
Let $\lambda^\ast$ be the largest integer in $[0, S_n^2 + 1]$ with $c(\lambda^\ast) \ge k$. Then $f(k) = v(\lambda^\ast) - \lambda^\ast k$.
:::

::: math proof Proof
Let $d_g = f(g) - f(g+1)$ for $1 \le g < n$. By the convexity lemma, $d_1 \ge d_2 \ge \cdots \ge d_{n-1}$.

For a fixed penalty $\lambda$, moving from a $g$-partition to the best $(g+1)$-partition changes the penalized value by $d_g - \lambda$. A count $g < n$ is optimal exactly when $d_g \ge \lambda$, and $g = n$ is always a candidate because there is no $g+1$. With the tie-break toward more groups,

$$
c(\lambda) = \max\{g : g = n \text{ or } d_g \ge \lambda\}.
$$

Now consider $\lambda^\ast$. If $c(\lambda^\ast) = k$, then the optimum itself has $k$ groups and

$$
v(\lambda^\ast) = f(k) + \lambda^\ast k,
$$

so the formula holds.

Suppose $c(\lambda^\ast) > k$. Since $\lambda^\ast$ is the largest price with count at least $k$, the count at $\lambda^\ast + 1$ is less than $k$. (The case $\lambda^\ast = S_n^2 + 1$ cannot occur here, because at the upper bound the count is $1$, which is not greater than $k$ when $k \ge 1$.) The count at $\lambda^\ast$ is greater than $k$, so $d_k \ge \lambda^\ast$. The count at $\lambda^\ast + 1$ is less than $k$, so $d_k < \lambda^\ast + 1$. Both $d_k$ and $\lambda^\ast$ are integers, hence $d_k = \lambda^\ast$.

For every $g$ with $k \le g < c(\lambda^\ast)$, the count $c(\lambda^\ast)$ is optimal, so $d_g \ge \lambda^\ast$. The sequence $d_g$ is non-increasing and $d_k = \lambda^\ast$, so all those differences equal $\lambda^\ast$. Therefore

$$
f(k) = f(c(\lambda^\ast)) + \bigl(c(\lambda^\ast) - k\bigr)\lambda^\ast.
$$

The penalized value at $\lambda^\ast$ is

$$
v(\lambda^\ast) = f(c(\lambda^\ast)) + \lambda^\ast c(\lambda^\ast)
= f(k) + \lambda^\ast k.
$$

Subtracting $\lambda^\ast k$ gives $f(k)$. $\square$
:::

::: math theorem Theorem
The algorithm prints $f(k)$.
:::

::: math proof Proof
The recurrence computes $v(\lambda)$ and $c(\lambda)$ for every price by the first theorem, and the binary search finds $\lambda^\ast$ because the count is non-increasing and the range contains a price with count $n$ and a price with count $1$. The previous theorem then gives $f(k) = v(\lambda^\ast) - \lambda^\ast k$. $\square$
:::

The Li Chao tree is correct independently of the aliens trick: each node stores a line that is best at the midpoint of its interval, and the line that loses at the midpoint is sent to the only side where it can still be best. A query checks every line on the path to its leaf, so it sees the best line for that prefix. The [Li Chao tree](/algorithms/dynamic-programming/li-chao-tree) article proves the insertion rule in full.

## Complexity analysis

**One penalty evaluation.** The DP has $n$ states. Each state performs one Li Chao query and one insertion, both $O(\log n)$, plus constant-time arithmetic. The penalty evaluation therefore costs $O(n \log n)$ time and $O(n)$ space.

**The binary search.** The upper bound is $S_n^2 + 1$, so the number of iterations is

$$
O\bigl(\log(S_n^2 + 1)\bigr) = O(\log S_n).
$$

With $S_n \le 2 \ast 10^7$, that is at most 49 iterations.

**Total.** $O(n \log n \log S_n)$ time and $O(n)$ auxiliary space. The layered DP it replaces is $O(k n^2)$ time and $O(n)$ space with rolling rows, or $O(k n \log n)$ with divide-and-conquer optimization. The aliens trick wins whenever $k$ is large enough that the logarithmic factor is cheaper than the layer count.

The arithmetic has three separate bounds, and they deserve separate checks.

- The original cost is at most $S_n^2 \le 4 \ast 10^{14}$.
- The penalized value is at most $f(1) + \lambda \le 2S_n^2 + 1 \le 8 \ast 10^{14}$, because the one-group partition is always available.
- A line has a slope of magnitude at most $2S_n$ and an intercept of at most $3S_n^2 + 1$, so a line evaluation has magnitude at most $5S_n^2 + 1 \le 2 \ast 10^{15}$.
- The final subtraction contains $\lambda^\ast k$, which can reach $S_n^2 n \approx 8 \ast 10^{17}$. It fits in a signed 64-bit integer, but it is above $2^{53}$, so JavaScript must use `BigInt` for that one subtraction.

::: math complexity Complexity
Splitting an array of $n$ nonnegative integers into exactly $k$ contiguous groups with minimum total squared group sum: $O(n \log n \log S_n)$ time and $O(n)$ auxiliary space, using a Li Chao tree for the inner one-dimensional DP and an integer binary search over the penalty.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Exactly $k$ contiguous groups, squared group sums | The aliens trick in this article |
| Exactly $k$ groups and $k$ is at most about 50 | A layered DP, possibly with divide-and-conquer optimization |
| Exactly $k$ groups and the cost is not convex | The layered DP; the aliens trick does not apply |
| At most $k$ groups and extra groups never hurt | Treat it as exactly $k$, or take the best count up to $k$ |
| Two independent count constraints | One penalty per constraint, with a nested search; see Gosha is hunting |
| Real-valued costs | Binary search a real penalty and keep enough precision |
| The inner DP has a monotone split point | Divide-and-conquer optimization instead of a Li Chao tree |
| The transition is a line query with monotone slopes | A convex hull trick; use Li Chao when equal slopes or ties are awkward |
| The problem asks for the partition, not only its cost | Store a parent pointer in the penalized DP and resolve ties consistently |
| $k = 1$ or $k = n$ | Return the whole-array cost or the sum of squares directly |

The boundary cases are worth taking seriously. When $k = 1$, the binary search runs to its upper bound and the answer is $S_n^2$. When $k = n$, the price is often zero and the answer is the sum of the individual squares. Both are handled by the general algorithm, but a direct check is a cheap way to catch an off-by-one in the search range.

## Reference implementations

The six programs in the manifest all use the same plan.

- Read $n$, $k$, and the array.
- Build the prefix sums.
- Binary search the penalty over $[0, S_n^2 + 1]$, keeping the largest price whose optimum uses at least $k$ groups.
- Evaluate the penalized DP with a Li Chao tree, carrying the pair (value, groups) and breaking ties toward more groups.
- Print $v(\lambda^\ast) - \lambda^\ast k$.

The implementations differ only in how they store the tree and how they handle large integers. The C version owns a flat array of records. The C++ version wraps the tree in a class over a `std::vector`. The Java version uses a heap array of `Line` objects whose empty entries are `null`. The Python version uses four parallel lists. The JavaScript version uses typed arrays and ordinary numbers, with one `BigInt` subtraction at the end. The Pascal version uses an array of records and `Int64` throughout, and it follows the pas2js rules: one argument per `Read`, `SysUtils` in the uses clause, no `IOResult`, and no 128-bit arithmetic.

The manifest records the time and space bounds, the input and output contract, and the role of the tie-break. All six listings are unverified in the manifest until a reviewer promotes them; the article's tests cover three cases, including the all-zero array where every partition ties.

## Recursion decision

The only recursive routine is the Li Chao insertion. Its depth is the height of a balanced segment tree over $n + 1$ prefix positions, which is $O(\log n)$. At $n = 2000$ the depth is about 12, far below every language's limit. The query is iterative, and the binary search is iterative, so there is no path through the program that recurses $n$ times.

| Language   | Default stack              | Depth here      | Recommendation              |
| ---------- | -------------------------- | --------------- | --------------------------- |
| C and C++  | 8 MB on Linux              | About 12 frames | Recursive insertion is safe |
| Java       | 512 KB to 1 MB per thread  | About 12 frames | Recursive insertion is safe |
| Python     | Interpreter limit of 1000  | About 12 frames | Recursive insertion is safe |
| Pascal     | The operating system stack | About 12 frames | Recursive insertion is safe |
| JavaScript | The V8 engine limit        | About 12 frames | Recursive insertion is safe |

The depth does not depend on $k$. That is the point of removing the layer dimension: the recursion follows the tree over positions, not the number of groups. A layered implementation with a recursive search over the split points would still have depth $k$, which can be 2000.

## Implementation walkthrough

The Li Chao tree insertion is the only delicate part. The version below is the C++ shape used by the reference program.

```cpp
void insert(int node, int left, int right, Line line) {
    if (!tree[node].present) {
        tree[node] = line;
        tree[node].present = true;
        return;
    }
    int mid = left + (right - left) / 2;
    if (better(line, tree[node], prefix[mid])) {
        std::swap(line, tree[node]);
    }
    if (left == right) return;
    if (better(line, tree[node], prefix[left])) {
        insert(2 * node, left, mid, line);
    } else if (better(line, tree[node], prefix[right])) {
        insert(2 * node + 1, mid + 1, right, line);
    }
}
```

**The comparison.** `better` compares the line values at a point. If the values are equal, it prefers the line with more groups. That single sentence is what makes the binary search's predicate consistent.

**The midpoint swap.** After the swap, the node holds the line that is better at the midpoint. The losing line can only be better on one side of the midpoint, so it is sent to that side. The two endpoint comparisons decide which side, and equal values at an endpoint are treated as not better, which keeps the recursion finite.

**The empty line.** The line for position $0$ must be inserted before the first query. Without it, the first prefix has no candidate, and a program that initializes its answer to a sentinel prints the sentinel.

**The insert-after-query order.** The line for position $i$ is inserted after $F(i)$ is computed. Inserting it first would allow an empty last group, and the count would be too large.

**The final subtraction.** In C, C++, Java, and Pascal the expression `value - penalty * k` is a 64-bit operation. In Python it is exact by construction. In JavaScript it must be `BigInt(value) - BigInt(penalty) * BigInt(k)`, because the product can exceed $2^{53}$ even though every value inside the DP is exact.

**The penalty range.** The upper bound is $S_n^2 + 1$, not $S_n$ or $10^{18}$. A bound that is too small leaves the count above $1$, and the binary search returns a price that is too low. A bound that is too large is safe but wastes iterations.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Binary searching the smallest price with count at most $k$ | Flat segments cause the price to overshoot and the answer to be too small | Search for the largest price with count at least $k$ |
| Breaking ties toward fewer groups | The count at price zero can be one, so the predicate never covers $k$ | Prefer more groups on equal penalized values |
| Forgetting the penalty in the transition | The DP solves the unpenalized problem and ignores the count | Add $\lambda$ once per new group |
| Using a floating-point price for integer costs | Rounding moves the contact point off the integer breakpoint | Binary search an integer price |
| Setting the upper bound to $S_n$ or to $10^{18}$ | Too small gives a wrong count; too large is merely slow | Use $S_n^2 + 1$ |
| Computing $\lambda k$ in JavaScript `Number` | The product loses low bits above $2^{53}$ | Use `BigInt` for the final subtraction |
| Assuming convexity for negative values | The marginal savings can increase, and the formula misses $f(k)$ | Require nonnegative elements, or test convexity directly |
| Inserting the line for $i$ before querying $i$ | Empty groups are allowed and the count is wrong | Query first, insert after |
| Omitting the empty-prefix line | The first state has no transition | Insert the line for position $0$ |
| Reconstructing a partition from a tied price | The chosen count may differ from $k$ | Store parents for the price that matches $k$, or recompute with the tie-break fixed |

### Why this fails: the all-zero array and the wrong search direction

The all-zero array is the cleanest counterexample to the wrong predicate. Take $n = 4$, $k = 2$, and $a = [0, 0, 0, 0]$. Every partition costs zero, so $f(1) = f(2) = f(3) = f(4) = 0$. The marginal sequence is $0, 0, 0$.

At price $\lambda = 0$, every partition is optimal, and the tie-break toward more groups gives $c(0) = 4$ and $v(0) = 0$. At price $\lambda = 1$, the penalized cost is just the number of groups, so the optimum is one group, $c(1) = 1$ and $v(1) = 1$.

The incorrect rule "find the smallest $\lambda$ with $c(\lambda) \le k$" returns $\lambda = 1$, then computes $v(1) - 1 \ast 2 = 1 - 2 = -1$. The correct answer is $0$. The correct rule "find the largest $\lambda$ with $c(\lambda) \ge k$" returns $\lambda = 0$, and $0 - 0 \ast 2 = 0$.

The same example exposes the tie-break. If the DP prefers fewer groups, then at $\lambda = 0$ it returns $c(0) = 1$, which is already below $k = 2$. The predicate then fails at the very price that should produce the answer. Ties are not an edge case to ignore; they are the mechanism by which the algorithm represents a whole interval of prices.

The general lesson: a flat segment of $f$ means several counts are optimal at the same price. The binary search must select the endpoint of the segment that corresponds to the recovery formula, and the DP must report that same endpoint.

## Variants and extensions

- **At most $k$ groups.** If adding a group never increases the cost, an optimal solution with at most $k$ groups can be padded to exactly $k$ without changing the cost, so the same algorithm applies. If padding is impossible, take the best answer over the counts that the prices reach, or add a second dimension.
- **Real-valued costs.** The recovery formula uses a real price and enough binary-search iterations to meet the required precision. The USACO problem [Building a Tall Barn](https://usaco.org/index.php?page=viewproblem2&cpid=697) is of this type: the price is a marginal benefit, and the answer is rounded to the nearest integer.
- **Two count constraints.** Charge two independent prices and search them together, usually with a nested binary search. [Gosha is hunting](https://codeforces.com/problemset/problem/739/E) has one count for Poke Balls and one for Ultra Balls and is the standard example.
- **A different inner optimization.** The transition only needs to be a line query if the cost is quadratic. For a general Monge cost, divide-and-conquer optimization evaluates the penalized DP when the best split is monotone, and a convex hull trick applies when the transition can be written as a line query.
- **The convex hull trick instead of Li Chao.** When slopes and queries are both monotone and no equal slopes occur, a deque-based hull is faster and shorter. Equal prefix sums produce equal slopes, so the implementation must keep only the line with the better intercept and the better tie-break.
- **Reconstruction.** Store the predecessor $j$ of every state in the penalized DP. After the search, recompute at $\lambda^\ast$ and follow the parents from $n$. If the chosen price is tied, fix the tie-break and recompute; do not mix parents from different prices.
- **A penalty on something other than groups.** The trick works for any additive count: the number of photos, the number of machines, or the number of operations. The penalty must be charged exactly once per counted object.
- **Tree and matroid versions.** The same Lagrangian idea applies when the pieces form a tree partition or a matroid basis, provided the optimal value is convex in the rank or the number of components.

## Contest strategy

Under contest pressure, the following procedure avoids the errors that cost points.

1. **Check convexity first.** Compute $f(g)$ by brute force for small $n$ and verify that the differences $f(g) - f(g+1)$ are non-increasing. If they are not, stop; the trick does not apply.
2. **Write the penalized DP before optimizing it.** Keep the pair (value, groups), add the penalty once per group, and make the tie-break explicit.
3. **Choose the predicate and the range.** Search for the largest integer price in $[0, S_n^2 + 1]$ with count at least $k$. Write the predicate in one line and test it on the all-zero array.
4. **Verify against the layered DP.** On random instances with $n \le 12$, compare the penalized answer with the $O(k n^2)$ DP. This catches tie-breaking errors that hand tests miss.
5. **Optimize the inner DP last.** A quadratic inner DP is fine for the differential test. Replace it with Li Chao or a convex hull only after the answers agree.
6. **Check the arithmetic.** Compute the largest possible cost, penalized value, and $\lambda k$. Pick 64-bit types, and use `BigInt` in JavaScript for the final subtraction.
7. **Handle the boundaries.** Test $k = 1$, $k = n$, an array of zeros, and a single element.

## Worked problems

### Problem 1: Aliens

**Restatement.** There are $n$ points of interest in an $m \times m$ grid. A photo is a square whose two opposite corners lie on the main diagonal. Taking at most $k$ photos, minimize the number of grid cells that are photographed at least once. After transposing the points below the diagonal and removing dominated points, the remaining points can be ordered along the diagonal, and a photo covers a contiguous block of that order at a cost equal to the square of the block's span.

**Naive baseline.** A partition DP over the sorted points with $k$ layers and a quadratic transition, which is hopeless at $n = 100000$.

**Insight.** Charge a price for every photo. The penalized problem is one-dimensional, and its transition is a line query because the block cost is a squared distance.

**Derivation.** Sort and deduplicate the transformed points. Let $x_1 \le \cdots \le x_n$ be their coordinates. Then $\mathrm{dp}[g][i] = \min_j \mathrm{dp}[g-1][j] + (x_i - x_j)^2$. Penalize each photo, evaluate the resulting one-dimensional DP with a convex hull trick, and binary search the price until the optimum uses at least $k$ photos. The answer is the penalized optimum minus the price times $k$.

**Correctness.** The block cost satisfies the quadrangle inequality, so $f$ is convex, and the penalty recovery theorem applies. The preprocessing is safe because a point dominated by another point is already covered by any photo that covers the dominating point.

**Complexity.** $O(n \log n \log X)$ time for the sort, the hull, and the price search, where $X$ is the coordinate range; $O(n)$ space.

**Common wrong approach.** Using the price search without the hull trick. The penalized DP is still correct but quadratic, and it times out at $n = 100000$.

### Problem 2: Levels and Regions

**Restatement.** There are $n$ levels with token counts $t_i$. The levels are split into exactly $k$ contiguous regions. A region's expected completion time is a sum of ratios over its levels, and the total expected time is minimized.

**Naive baseline.** The layered partition DP with $k$ layers and $O(n^2)$ transitions per layer, which is far too slow at $n = 200000$.

**Insight.** The expected cost of a region is available in constant time from prefix sums of $t_i$ and $1/t_i$. Charge a real price for every region; the penalized DP is one-dimensional, and its transition is a line query.

**Derivation.** Build the prefix sums, write the region cost as a function of its endpoints, and rearrange the penalized transition into the form (line at the previous endpoint) evaluated at the current endpoint. A convex hull trick evaluates each price in $O(n)$. Binary search the price until the optimum uses $k$ regions, then subtract the price times $k$.

**Correctness.** The region cost satisfies the quadrangle inequality, so the optimal cost is convex in the number of regions, and the penalty recovery theorem applies. The real arithmetic is controlled by the 1e-4 tolerance.

**Complexity.** $O(n \log n \log(1/\varepsilon))$ time with a fixed number of price iterations, and $O(n)$ space.

**Common wrong approach.** Using an integer price. The costs are real, so the contact point generally lies between integers; the search must run on doubles, not on the integer breakpoints of a different problem.

### Problem 3: Building a Tall Barn

**Restatement.** There are $N$ floors and $K$ cows, with $N \le K \le 10^{12}$. Every floor gets at least one cow, and a floor with $c$ cows takes $a_i / c$ hours. Minimize the total time.

**Naive baseline.** Start with one cow per floor and add the remaining cows greedily by marginal benefit. The marginal benefit of one more cow on a floor is $a_i / (c(c+1))$, so the greedy step is easy, but $K - N$ can be $10^{12}$.

**Insight.** The marginal benefits are decreasing, so a price per cow makes each floor's optimal count independent. Binary search the price, compute the number of cows each floor wants, and adjust the total by the unused or excess cows at that price.

**Derivation.** For a price $\lambda$, a floor takes the largest $c$ with $a_i / (c(c+1)) \ge \lambda$. The total number of cows used is non-increasing in $\lambda$. Find the price at which the usage crosses $K$, compute the total time with that allocation, subtract $(K - \text{used}) \ast \lambda$, and round to the nearest integer.

**Correctness.** The marginal benefit sequence is decreasing, which is the convexity condition. The Lagrangian adjustment is exact up to the rounding guarantee in the statement.

**Complexity.** $O(N \log K \log A)$ with a per-floor binary search, or $O(N \log A)$ with the quadratic formula, and $O(1)$ extra space.

**Common wrong approach.** Applying the greedy step $K - N$ times. It is correct but cannot finish when $K$ is $10^{12}$.

## Practice progression

1. **Recognition.** Given a partition problem, identify the count constraint and check whether the cost is additive over the pieces.
2. **Brute force the convexity.** Compute $f(g)$ for every $g$ on small arrays and verify that the differences are non-increasing.
3. **Layered DP.** Implement the $O(k n^2)$ recurrence and use it as the reference answer.
4. **First aliens implementation.** Use a quadratic inner DP and an integer price search. Compare with the layered DP on random instances with $n \le 12$ and on the all-zero array.
5. **Tie-breaking.** Change the tie-break to prefer fewer groups and observe the failure on the all-zero array. Change the search predicate and observe the negative answer.
6. **Inner optimization.** Replace the quadratic scan with a Li Chao tree, then with a monotone convex hull, and compare the running times and the answers.
7. **Real prices.** Solve Building a Tall Barn or a probability-based partition problem, where the price is real and the answer needs rounding.
8. **Two constraints.** Attempt Gosha is hunting, where two counts require two prices and a nested search.
9. **Proof.** For a new cost function, prove the quadrangle inequality and derive the convexity of $f$ before writing the code.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the penalty $\lambda$ represent, and why does adding it remove the group count from the state? (Key insight)
2. State the penalized recurrence and say what the pair (value, groups) is compared by. (Formal model)
3. Why is $c(\lambda)$ non-increasing, and which two optimality inequalities prove it? (Correctness proof)
4. Why is the search for the smallest price with count at most $k$ wrong? Give the zero-array answer it produces. (Common mistakes)
5. Why must ties be broken toward more groups? (Algorithm derivation)
6. Give the upper bound on the price and prove that the count there is one. (Algorithm derivation)
7. State the quadrangle inequality for squared sums and expand the difference. (Correctness proof)
8. How does the alternating-cut construction prove that $f$ is convex? (Correctness proof)
9. What is the complexity of one penalized DP, and what does the binary search add? (Complexity analysis)
10. Which intermediate value can exceed $2^{53}$, and how does the JavaScript version handle it? (Implementation walkthrough)
11. Why is the line for position $i$ inserted after the query for position $i$? (Implementation walkthrough)
12. How would you recover the actual partition, and what happens if the price is tied? (Variants and extensions)
13. What changes when the costs are real rather than integer? (Variants and extensions)

## Further reading

- The layered partition DP and its monotone split points are covered in [divide-and-conquer optimization](/algorithms/dynamic-programming/divide-and-conquer-optimization).
- The line container used by the reference implementations is the [Li Chao tree](/algorithms/dynamic-programming/li-chao-tree); the monotone version is the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The search over the price is an application of [binary search](/algorithms/searching/binary-search) to a monotone predicate, and the general pattern is [parametric search](/algorithms/searching/parametric-search).
- The prefix sums that make the group cost constant time are in [prefix sums](/algorithms/arrays/prefix-sums).
- The count-free dynamic program is a close relative of [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack): both replace a large search by a table over a compact state.
- The namesake problem is [IOI 2016 Aliens](https://oj.uz/problem/view/IOI16_aliens), and its official solutions are in the [IOI 2016 solutions](https://ioinformatics.org/files/ioi2016solutions.pdf).
- Two further applications are [Levels and Regions](https://codeforces.com/problemset/problem/673/E) and [Gosha is hunting](https://codeforces.com/problemset/problem/739/E).
- The USACO guide to the marginal-benefit form is the official solution to [Building a Tall Barn](https://usaco.org/current/data/sol_tallbarn_platinum_jan17.html).
