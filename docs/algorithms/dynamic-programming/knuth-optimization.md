---
id: dynamic-programming.knuth-optimization
title: Knuth optimization
summary: Narrow the split search of an interval dynamic program to a monotone window, turning the cubic table into a quadratic one when the range cost satisfies the quadrangle inequality.
division: [platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        knuth optimization,
        knuth-yao optimization,
        quadrangle inequality,
        monotone split,
        opt table,
        interval dp,
        matrix chain,
        optimal binary search tree,
    ]
prerequisites:
    required: [dynamic-programming.interval-dp, foundations.complexity]
    recommended: [dynamic-programming.0-1-knapsack, dynamic-programming.convex-hull-trick]
complexity:
    time: "O(n^2)"
    space: "O(n^2)"
assumptions:
    - The cost of a range is independent of the split point.
    - The range cost satisfies the quadrangle inequality and is monotone.
    - The optimal split obeys opt[i][j - 1] <= opt[i][j] <= opt[i + 1][j].
implementations: dynamic-programming.knuth-optimization
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="dynamic-programming.knuth-optimization" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="dynamic-programming.knuth-optimization" />

Knuth optimization speeds up an interval dynamic program whose recurrence has the form

$$
dp[i][j] \;=\; \min_{i \le k < j} \bigl(dp[i][k] + dp[k+1][j]\bigr) + w(i,j),
$$

where the added cost $w(i,j)$ depends on the range but not on the split $k$. The direct table evaluates every split for every range, which costs $O(n^3)$. The optimization records the split that achieved each minimum and searches only a window of splits for the next range.

The window is

$$
\text{opt}[i][j-1] \;\le\; k \;\le\; \text{opt}[i+1][j],
$$

where $\text{opt}[i][j]$ is the best split of the range from $i$ to $j$. The two bounds are the best splits of the two ranges that are one element shorter. When the range cost satisfies the quadrangle inequality and a monotonicity condition, the best split of the larger range cannot leave that window.

The saving is not a constant factor. The windows of the ranges of one length overlap, so the total number of split evaluations at that length is $O(n)$ rather than $O(n^2)$. Over all lengths the table costs $O(n^2)$ time and $O(n^2)$ space. The price is a second table for the splits and a condition on the cost that has to be checked rather than assumed.

Matrix chain multiplication is the running example, and the optimal binary search tree and the merging of adjacent piles are the other two standard applications. All three have the same shape: a range, a split, and a cost that is paid once per range.

## Problem motivation

A compiler has to emit code for a product of $n$ matrices. The matrices arrive in a fixed order and cannot be reordered, but the compiler may choose any parenthesization. Matrix multiplication is associative, so every parenthesization computes the same result, and the number of scalar multiplications is what differs.

Matrix $i$ has dimensions $p_{i-1} \times p_i$. Multiplying an $a \times b$ matrix by a $b \times c$ matrix costs $a \cdot b \cdot c$ scalar multiplications. If the last multiplication joins the product of matrices $i$ through $k$ with the product of matrices $k+1$ through $j$, the cost of that last multiplication is

$$
p_{i-1} \cdot p_k \cdot p_j.
$$

The constraints of the instance are what make the technique necessary:

- $1 \le n \le 2\,000$ matrices.
- $1 \le p_i \le 1\,000$ for every dimension.
- The answer fits in a 64-bit integer, because at most $n$ multiplications each contribute at most $10^9$.

The number of parenthesizations is the Catalan number $C_{n-1}$, which is about $4^n / n^{3/2}$. At $n = 2000$ it is far beyond any search. The interval table removes the enumeration, but the obvious table still tries every split:

$$
dp[i][j] \;=\; \min_{i \le k < j} \bigl(dp[i][k] + dp[k+1][j] + p_{i-1} \cdot p_k \cdot p_j\bigr).
$$

That is $O(n^3)$ work. At $n = 2000$ the number of split evaluations is about $1.3 \times 10^9$, which is too slow for a one-second limit and unpleasant even with a generous one.

The question is not whether the interval table is correct. It is whether every split of every range has to be examined. The answer is no: the best split of a range is constrained by the best splits of the two ranges that are one element shorter, and the constraint is what this technique exploits.

## Recognition patterns

Knuth optimization is the right tool when all of the following hold.

- The subproblems are **contiguous ranges** of a sequence, and the state is a pair of endpoints.
- The recurrence splits a range into two adjacent ranges and adds a cost that depends only on the range, not on the split.
- The range cost satisfies the **quadrangle inequality** and a **monotonicity** condition.
- The best split is recorded and is monotone in both endpoints.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| $n \le 500$ | The cubic table is about $2 \times 10^7$ split evaluations and passes easily |
| $n \le 3\,000$ | The cubic table is about $4.5 \times 10^9$ split evaluations; the quadratic form is needed |
| The added cost depends on the split | The range-cost form does not apply; an extra parameter or a different optimization is needed |
| The range cost fails the quadrangle inequality | The best split can leave the window; the windowed table can be wrong |
| Only one of the two monotonicities holds | A weaker bound or a divide-and-conquer optimization may still apply |
| The cost is linear in the split | The convex hull trick may be the better tool |
| The table is already small | The cubic table is shorter to write and less error-prone |

Two phrases in a statement are strong signals. "The cost of merging a range is the sum of the range" and "the root splits the range into a left and a right subtree" both describe a range cost that is paid once per range. The second phrase is the definition of the optimal binary search tree; the first is the definition of stone merging.

The condition is not decoration. A recurrence can look like an interval dynamic program and still fail the quadrangle inequality, and then the window silently returns a value that is too large. The section on common mistakes gives the smallest counterexample, and the contest strategy makes the verification a required step.

<Synonyms terms="Knuth optimization, Knuth-Yao optimization, quadrangle inequality optimization, monotone split, opt table" />

## Naive approach

The baseline is the cubic interval dynamic program. It is correct, it is short, and it is the reference against which the optimized version must be tested.

```cpp
for (int length = 2; length <= n; ++length) {
    for (int i = 0; i + length <= n; ++i) {
        const int j = i + length - 1;
        dp[i][j] = INFINITY;
        for (int k = i; k < j; ++k) {
            const long long candidate =
                dp[i][k] + dp[k + 1][j] + cost(i, k, j);
            if (candidate < dp[i][j]) {
                dp[i][j] = candidate;
                opt[i][j] = k;
            }
        }
    }
}
```

The loop order matters. The outer loop is the length, because every range of length $\ell$ reads only ranges of length less than $\ell$. An outer loop over $i$ and an inner loop over $j$ would read `dp[k + 1][j]` before that row has been computed.

The number of split evaluations is

$$
\sum_{\ell=2}^{n} (n-\ell+1)(\ell-1) \;=\; \frac{n(n-1)(n+1)}{6},
$$

which is $O(n^3)$. At $n = 2000$ it is $1.33 \times 10^9$. At $n = 3000$ it is $4.5 \times 10^9$.

The second baseline is the brute-force enumeration of parenthesizations. It is worth writing once, because it is the specification of the problem, and because it is the only independent check on a table that has been optimized.

```python
def cost(lo, hi):
    if lo == hi:
        return 0
    best = None
    for mid in range(lo, hi):
        candidate = cost(lo, mid) + cost(mid + 1, hi) + weight(lo, hi)
        if best is None or candidate < best:
            best = candidate
    return best
```

Without memoization this explores the Catalan number of trees. With memoization on the pair of endpoints it becomes the cubic table. The optimized table is the same table with a smaller split range, so the brute-force value is the value it has to reproduce.

## Key insight

The insight is that the best split of a range is **monotone**. When a range grows at its right end, its best split never moves left; when it grows at its left end, its best split never moves right. The two statements together pin the best split between the best splits of the two shorter ranges.

Write $\text{opt}[i][j]$ for the smallest split that attains the minimum of $dp[i][j]$. The bound is

$$
\text{opt}[i][j-1] \;\le\; \text{opt}[i][j] \;\le\; \text{opt}[i+1][j].
$$

The left inequality says that removing the last element cannot move the split right. The right inequality says that removing the first element cannot move the split left. Both are consequences of the quadrangle inequality, and the correctness proof below derives them by an exchange argument.

**Why the total work is quadratic.** Fix a length $\ell$. For every range of that length, the number of splits examined is at most

$$
\text{opt}[i+1][i+\ell-1] - \text{opt}[i][i+\ell-2] + 1.
$$

Summing over $i$ telescopes: the positive terms of one range cancel the negative terms of the next range, and the sum is at most $n$. So one length costs $O(n)$ split evaluations, and the $n$ lengths cost $O(n^2)$ in total. The windows overlap heavily; they do not each have length $O(n)$.

**What the bound does not say.** It does not say that the best split of every range is near the middle, and it does not say that the cost is convex in the split. It says only that the argmin moves in one direction as the endpoints move. That is enough, because the table is filled by increasing length and the argmins of the shorter ranges are already known.

The next sections turn this into a table, a recurrence, and a proof. The proof is the part worth reading twice, because the condition on the cost is exactly what the exchange argument uses.

## Visual intuition

The table has one row per left endpoint and one column per right endpoint. Only the cells with $i \le j$ are used. The cells are filled by diagonals: first all ranges of length two, then all ranges of length three, and so on.

Beside the cost table there is a split table of the same shape. The cell $\text{opt}[i][j]$ holds the split that achieved $dp[i][j]$. The split table is the only extra memory the technique needs, and it is what makes the window computable.

For the six-matrix chain with dimensions $30, 35, 15, 5, 10, 20, 25$, the split table is:

| $i$ \ $j$ | 1   | 2   | 3   | 4   | 5   | 6   |
| --------- | --- | --- | --- | --- | --- | --- |
| 1         | 1   | 1   | 1   | 3   | 3   | 3   |
| 2         |     | 2   | 2   | 3   | 3   | 3   |
| 3         |     |     | 3   | 3   | 3   | 3   |
| 4         |     |     |     | 4   | 4   | 5   |
| 5         |     |     |     |     | 5   | 5   |
| 6         |     |     |     |     |     | 6   |

Read a row from left to right: the split never decreases. Read a column from top to bottom: the split never decreases. Those two monotonicities are the picture behind the bound.

The window for the cell $(i,j)$ is the rectangle corner formed by the cell to its left and the cell below it. In the table, the left cell is $(i, j-1)$ and the cell below is $(i+1, j)$. The window is the interval between their stored splits. The window of a longer range is therefore never wider than the distance between two already computed splits, and the total width of one diagonal is linear.

The laboratory is not available for this technique, because the interesting object is the table rather than a graph. The two tables above are the visualization: the cost table gives the answer, and the split table gives the window.

## Formal model

Let the sequence have $n$ elements indexed $1$ through $n$. Let $w(i,j)$ be the cost added when the range from $i$ to $j$ is combined, defined for $1 \le i \le j \le n$.

::: math definition Definition
The **interval dynamic program** is

$$
dp[i][j] \;=\;
\begin{cases}
0, & i = j, \\[4pt]
\displaystyle \min_{i \le k < j} \bigl(dp[i][k] + dp[k+1][j]\bigr) + w(i,j), & i < j.
\end{cases}
$$

The **best split** $\text{opt}[i][j]$ is the smallest $k$ that attains the minimum.
:::

::: math definition Definition
The cost $w$ satisfies the **quadrangle inequality** if, for all $a \le b \le c \le d$,

$$
w(a,c) + w(b,d) \;\le\; w(a,d) + w(b,c).
$$

It is **monotone** if, for all $a \le b \le c \le d$,

$$
w(b,c) \;\le\; w(a,d).
$$
:::

::: math lemma Lemma
If $w$ satisfies the quadrangle inequality and is monotone, then the cost table satisfies the same inequality: for all $a \le b \le c \le d$,

$$
dp[a][c] + dp[b][d] \;\le\; dp[a][d] + dp[b][c].
$$
:::

The lemma is proved by induction on the length of the ranges, using the quadrangle inequality of $w$ and the optimal splits of the four ranges. The exchange argument is the same one that proves the split bound; the next section gives the part that matters.

::: math theorem Theorem (Knuth bound)
If $w$ satisfies the quadrangle inequality and is monotone, then for every range with $i < j$,

$$
\text{opt}[i][j-1] \;\le\; \text{opt}[i][j] \;\le\; \text{opt}[i+1][j].
$$
:::

::: math definition Definition
A range cost is **Knuth-admissible** when it is independent of the split, satisfies the quadrangle inequality, and is monotone. The interval dynamic program with a Knuth-admissible cost is the setting in which the bound holds.
:::

The definition is deliberately narrow. It excludes any cost that depends on $k$, and it excludes costs that violate either inequality. The optimal binary search tree and stone merging fit after their costs are written in range form; matrix chain multiplication is the running example, and the article returns to the exact cost of each one in the worked problems.

::: math complexity Complexity
With a Knuth-admissible range cost, the interval table costs $O(n^2)$ time and $O(n^2)$ space, compared with $O(n^3)$ time for the full split search.
:::

## Algorithm derivation

The state is two tables. `dp[i][j]` holds the minimum cost of the range, and `opt[i][j]` holds the smallest split that attains it. Both are indexed from $0$ to $n-1$ in the programs, and from $1$ to $n$ in the formulas.

The base case is a range of one element. There is nothing to combine, so `dp[i][i] = 0`, and the only split is the element itself, so `opt[i][i] = i`. The value `i` is a sentinel that makes the window of the first two-element range nonempty.

For a range of length at least two:

1. Set `lo = opt[i][j - 1]` and `hi = opt[i + 1][j]`.
2. Clamp `lo` to at least `i` and `hi` to at most `j - 1`.
3. Scan every `k` from `lo` to `hi`, compute the candidate, and keep the smallest.
4. Store the winning candidate in `dp[i][j]` and the winning `k` in `opt[i][j]`.

::: math invariant Invariant
When the loop for length $\ell$ begins, every range of length less than $\ell$ has its final cost and its final best split. The window for a range of length $\ell$ is therefore built only from values that will not change.
:::

The invariant is what makes the bound usable. The window reads two cells of the split table, and both belong to shorter ranges, so both are already final.

The clamping is not cosmetic. The split of `[i][j-1]` is at most `j - 2`, and the split of `[i+1][j]` is at least `i + 1`, so the raw window is inside `[i, j - 1]` whenever the bound holds. If a bug or an inadmissible cost makes `lo > hi`, the scan would examine nothing and leave the cell at its initial value. The programs widen the window to the full range in that case, which turns a silent wrong answer into a slower but defined one. It is a safety net, not a substitute for the condition.

The tie-breaking rule is to keep the first split that attains the minimum. Keeping the last one would also produce the correct cost, but it could break the monotonicity of the split table, because the set of optimal splits of adjacent ranges need not be ordered at its right end. The smallest split is the choice that the proof uses.

The recurrence in the programs, with zero-based indices, is

```cpp
const long long cost = dp[i][k] + dp[k + 1][j] +
                       p[i] * p[k + 1] * p[j + 1];
```

The dimensions are shifted because matrix $i$ has dimensions `p[i]` by `p[i + 1]`. In the one-based formula, the same term is $p_{i-1} \cdot p_k \cdot p_j$. The shift is the most common source of an off-by-one error in this technique, and the second most common is forgetting that `opt[i][i]` must be initialized.

## Step-by-step execution

Take the three-matrix chain with dimensions $10, 30, 5, 60$. The matrices are $A_1$ of size $10 \times 30$, $A_2$ of size $30 \times 5$, and $A_3$ of size $5 \times 60$. The table is indexed from $1$ to $3$, and the dimensions are $p_0 = 10$, $p_1 = 30$, $p_2 = 5$, $p_3 = 60$.

**Base case.** `dp[1][1] = dp[2][2] = dp[3][3] = 0`, and `opt[1][1] = 1`, `opt[2][2] = 2`, `opt[3][3] = 3`.

**Length two.** The window is the full range because both endpoints are base cases.

- Range $[1,2]$: the only split is $k = 1$. The cost is $p_0 \cdot p_1 \cdot p_2 = 10 \cdot 30 \cdot 5 = 1500$. So `dp[1][2] = 1500` and `opt[1][2] = 1`.
- Range $[2,3]$: the only split is $k = 2$. The cost is $p_1 \cdot p_2 \cdot p_3 = 30 \cdot 5 \cdot 60 = 9000$. So `dp[2][3] = 9000` and `opt[2][3] = 2`.

**Length three.** For the range $[1,3]$, the window is `[opt[1][2], opt[2][3]] = [1, 2]`.

- $k = 1$: $dp[1][1] + dp[2][3] + p_0 \cdot p_1 \cdot p_3 = 0 + 9000 + 10 \cdot 30 \cdot 60 = 27000$.
- $k = 2$: $dp[1][2] + dp[3][3] + p_0 \cdot p_2 \cdot p_3 = 1500 + 0 + 10 \cdot 5 \cdot 60 = 4500$.

The minimum is $4500$, attained at $k = 2$, so `dp[1][3] = 4500` and `opt[1][3] = 2`. The answer is $4500$, which is the cost of $(A_1 A_2) A_3$.

The full split search would have examined the same two candidates here. The difference appears on longer chains, where the window is much narrower than the range.

For the six-matrix chain with dimensions $30, 35, 15, 5, 10, 20, 25$, the cost table is:

| $i$ \ $j$ | 1   | 2     | 3    | 4    | 5     | 6     |
| --------- | --- | ----- | ---- | ---- | ----- | ----- |
| 1         | 0   | 15750 | 7875 | 9375 | 11875 | 15125 |
| 2         |     | 0     | 2625 | 4375 | 7125  | 10500 |
| 3         |     |       | 0    | 750  | 2500  | 5375  |
| 4         |     |       |      | 0    | 1000  | 3500  |
| 5         |     |       |      |      | 0     | 5000  |
| 6         |     |       |      |      |       | 0     |

The answer is `dp[1][6] = 15125`. The split table from the previous section gives the windows. For example, the window for $[1,5]$ is `[opt[1][4], opt[2][5]] = [3, 3]`, so only one split is examined instead of four. The window for $[1,6]$ is `[opt[1][5], opt[2][6]] = [3, 3]`, again one split instead of five.

The number of split evaluations on this instance is 23, while the cubic table performs 35. The gap grows with $n$: at $n = 2000$ the cubic table performs about $1.3 \times 10^9$ evaluations, while the windowed table performs about $4 \times 10^6$.

## Correctness proof

::: math theorem Theorem
The recurrence computes the minimum cost of every range. That is, for $i < j$,

$$
dp[i][j] \;=\; \min_{i \le k < j} \bigl(dp[i][k] + dp[k+1][j]\bigr) + w(i,j),
$$

and for $i = j$ the cost is zero.
:::

::: math proof Proof
Induct on the length of the range. The base case is a range of one element, where the only construction is the element itself and its cost is zero.

For a range of length at least two, every construction has a last operation that combines the result of a prefix $[i,k]$ with the result of the suffix $[k+1,j]$ for exactly one split $k$. The two results cost at least $dp[i][k]$ and $dp[k+1][j]$ by the induction hypothesis, and the last operation adds $w(i,j)$. So every construction costs at least the candidate for its split, and the candidate for every split is achievable by using the optimal constructions of the two parts. Taking the minimum over the splits gives exactly the optimum. $\square$
:::

::: math lemma Lemma
If $w$ satisfies the quadrangle inequality and is monotone, then $dp$ satisfies the quadrangle inequality

$$
dp[a][c] + dp[b][d] \;\le\; dp[a][d] + dp[b][c]
$$

for all $a \le b \le c \le d$.
:::

::: math proof Proof
Induct on $d - a$. When $a = b$ or $c = d$, both sides are equal, so the claim holds. For the general case, take the optimal splits of $[a,d]$ and $[b,c]$ and compare the four ranges that they induce. If the two splits are ordered consistently, the induction hypothesis applies to the two smaller pairs of ranges; if they cross, the quadrangle inequality of $w$ supplies the missing comparison. The monotonicity of $w$ handles the boundary case in which one split is at an endpoint. The details are the standard exchange argument for Monge costs, and the conclusion is the displayed inequality. $\square$
:::

::: math theorem Theorem (monotone split)
Under the same hypotheses, for every $i < j$,

$$
\text{opt}[i][j-1] \;\le\; \text{opt}[i][j] \;\le\; \text{opt}[i+1][j].
$$
:::

::: math proof Proof
Let $k = \text{opt}[i][j]$ and suppose first that $k > \text{opt}[i+1][j] = k'$. The split $k'$ is optimal for $[i+1,j]$, so replacing $k$ by $k'$ there cannot increase the cost:

$$
dp[i+1][k'] + dp[k'+1][j] \;\le\; dp[i+1][k] + dp[k+1][j].
$$

The split $k$ is optimal for $[i,j]$, so replacing $k$ by $k'$ there cannot decrease the cost:

$$
dp[i][k] + dp[k+1][j] \;\le\; dp[i][k'] + dp[k'+1][j].
$$

Adding the two inequalities and canceling the two common suffix terms gives

$$
dp[i][k] + dp[i+1][k'] \;\le\; dp[i][k'] + dp[i+1][k].
$$

But $i < i+1 \le k' < k$, so the quadrangle inequality of $dp$ with $a = i$, $b = i+1$, $c = k'$, $d = k$ says

$$
dp[i][k'] + dp[i+1][k] \;\le\; dp[i][k] + dp[i+1][k'].
$$

The last two inequalities are opposite, so they can both hold only if they are equalities. The tie-breaking rule chooses the smallest optimal split, so $k$ cannot be strictly larger than $k'$; therefore $k \le k'$.

The other inequality is symmetric. Suppose $k = \text{opt}[i][j] < \text{opt}[i][j-1] = k'$. The optimality of $k'$ for $[i,j-1]$ and of $k$ for $[i,j]$ gives the same pair of inequalities with the roles of the two ranges exchanged, and the quadrangle inequality of $dp$ contradicts them in the same way. Hence $k \ge \text{opt}[i][j-1]$. $\square$
:::

::: math theorem Theorem
The windowed table computes the same cost as the full table.
:::

::: math proof Proof
By induction on the length. The base case is a single element. For a longer range, the monotone-split theorem says that the best split lies in the window, so the windowed scan examines the split that the full scan would choose. The candidate values are computed from shorter ranges, which are correct by the induction hypothesis. Therefore the stored cost is the minimum, and the stored split is the smallest split that attains it. $\square$
:::

The two proofs depend on different things. The first depends only on the recurrence and the fact that the split is exhaustive. The second depends on the quadrangle inequality and monotonicity of the range cost. If the cost fails either condition, the first theorem still holds and the second does not, which is exactly why the window can be wrong while the recurrence is right.

## Complexity analysis

**Time: $O(n^2)$.** There are $n$ lengths, and for each length the sum of the window widths telescopes to at most $n$. The arithmetic per split is a constant number of additions and multiplications. The base cases and the initialization of the split table are $O(n)$.

The telescoping deserves one line of algebra. For a fixed length $\ell$, the ranges are indexed by $i$ and the window width is at most

$$
\text{opt}[i+1][i+\ell-1] - \text{opt}[i][i+\ell-2] + 1.
$$

The first terms form a sum over $i+1$, the second terms form a sum over $i$, and the difference is the last split minus the first split plus the number of ranges. That difference is at most $n$. So the length costs $O(n)$, not $O(n^2)$.

**Auxiliary space: $O(n^2)$.** The cost table has $n(n+1)/2$ used cells, and the split table has the same. Storing both as full $n \times n$ arrays is the simplest layout, and it costs $n^2$ entries of each type. With 64-bit costs and 32-bit splits, $n = 2000$ costs about 48 MB; $n = 3000$ costs about 108 MB. Neither table can be reduced to one diagonal without recomputation, because a range reads ranges that start at many different positions.

**Arithmetic.** The largest intermediate value is the cost of the whole chain. Under the stated constraints it is at most $n \cdot p_{\max}^3 = 2 \cdot 10^{12}$, which fits in a signed 64-bit integer. A 32-bit accumulator overflows long before that. The split table is 32-bit because it stores an index.

::: math complexity Complexity
Knuth optimization on an interval table of $n$ elements: $O(n^2)$ time and $O(n^2)$ auxiliary space, with a 64-bit cost accumulator and a 32-bit split table. The full split search is $O(n^3)$.
:::

The constant hidden by the bound is small. On a random instance the average window is much narrower than the worst case, and the loop body is a handful of arithmetic operations. The technique is therefore useful well before the cubic table becomes impossible, and it is usually the first optimization to try on an interval dynamic program that is too slow.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Range cost independent of the split, quadrangle inequality holds | Knuth optimization, $O(n^2)$ |
| Range cost independent of the split, only one monotonicity holds | A weaker bound or divide-and-conquer optimization, $O(n \log n)$ per layer |
| Range cost depends on the split | The range-cost theorem does not apply; reformulate or use the full table |
| The cost fails the quadrangle inequality | The full cubic table, or a different state |
| The transition is linear in the split | The convex hull trick, $O(n)$ or $O(n \log n)$ |
| The table is totally monotone and the row maxima are wanted | The SMAWK algorithm, $O(n)$ |
| The number of layers is small and the transition is a partition | Divide-and-conquer optimization, $O(k n \log n)$ |
| $n \le 500$ | The cubic table is short enough to be the safer choice |

The rows are ordered from the most specific condition to the most general fallback. The important distinction is between a **range cost** and a **split cost**. A range cost is paid once per range and is the same for every split; a split cost depends on where the range is cut. The quadrangle inequality is a statement about the range cost, and the exchange proof uses it on the four ranges induced by two splits. A cost that changes with the split is outside the proof.

The convex hull trick and Knuth optimization are complementary rather than competing. The hull removes a linear scan over earlier states when the transition is a line; Knuth removes a scan over split points when the transition is a range cost. A problem can need both, in different layers of the same dynamic program.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes one `program` variant in each of the six languages.

The program reads `n` and then the `n + 1` dimensions `p[0]` through `p[n]`. Matrix `i` has dimensions `p[i]` by `p[i + 1]`. It prints one number: the minimum number of scalar multiplications needed to evaluate the chain in the given order.

The six versions share the same table layout, the same loop order and the same tie-breaking rule, so their output agrees on every fixture. The C, C++ and Java versions use flat or two-dimensional 64-bit arrays; the Python version uses lists of lists and arbitrary-precision integers; the Pascal version uses dynamic arrays of `Int64`; and the JavaScript version uses nested arrays of numbers. The JavaScript and Pascal variants are educational references, not USACO submission languages.

The programs use the window exactly as the derivation describes. They do not verify the quadrangle inequality at run time, because the condition is a property of the recurrence and not of a particular input. The verification belongs in the derivation and in the differential test against the cubic program, not in the inner loop.

## Recursion decision

The table is filled by increasing length, and the loops are the natural form. A recursive formulation is useful for deriving the recurrence but not for shipping it.

```python
def solve(i, j):
    if i == j:
        return 0
    best = None
    for k in range(i, j):
        candidate = solve(i, k) + solve(k + 1, j) + w(i, j)
        if best is None or candidate < best:
            best = candidate
    return best
```

Without memoization this visits every parenthesization, which is exponential. With memoization on the pair $(i,j)$ it becomes the cubic table, and the recursion depth is $n$, because each call reduces the length by at least one.

The optimized form is harder to write recursively. The window for a range needs the best splits of the two shorter ranges, and those splits are known only after those ranges have been solved. A memoized recursion can compute them, but the order in which the subproblems are solved is then determined by the recursion, and the split table has to be filled before it is read. The iterative order by length makes that dependency explicit and costs no stack at all.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; the depth here is only $n$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative; the table is large and belongs on the heap |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; $n$ can exceed the limit |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the nested arrays dominate the cost |

The depth of $n = 2000$ is inside the C, C++, Java and JavaScript limits, but it is outside the Python default limit. The iterative form is the recommendation in every language, for the usual reasons: no stack to overflow, no memoization dictionary, and a loop order that matches the proof.

## Implementation walkthrough

Four decisions carry the implementation. Each one is a place where a correct derivation can turn into a wrong program.

**The base of the split table.** Every diagonal cell must be initialized before the length loop begins:

```cpp
for (int i = 0; i < n; ++i) {
    opt[i][i] = i;
}
```

Without this line, `opt[i][i]` is zero, and the first two-element range gets the window `[0, 0]` instead of `[i, i]`. The cost is still computed for some ranges by accident, which makes the bug hard to see on a small test.

**The window and the clamp.** The two bounds come from the cell to the left and the cell below:

```cpp
int lo = opt[i][j - 1];
int hi = opt[i + 1][j];
if (lo < i) lo = i;
if (hi > j - 1) hi = j - 1;
```

The clamp makes the program safe even if a future change weakens the condition. The fallback to the full range when `lo > hi` is a second safety net; it is not a license to skip the condition, because a window that is nonempty but wrong cannot be detected this way.

**The cost of the last multiplication.** With zero-based dimensions, the left block `[i, k]` has outer dimensions `p[i]` and `p[k + 1]`, and the right block `[k + 1, j]` has outer dimensions `p[k + 1]` and `p[j + 1]`. The product is

```cpp
p[i] * p[k + 1] * p[j + 1]
```

The one-based formula writes the same product as $p_{i-1} \cdot p_k \cdot p_j$. Mixing the two conventions is the most common off-by-one error in matrix chain code.

**The type of the accumulator.** The cost is 64-bit. The split is 32-bit. The dimensions can stay 32-bit, but the multiplication must be done in 64-bit, so the programs store the dimensions as 64-bit values as well. In JavaScript, a plain number is exact below $2^{53}$, which covers the stated constraints; a larger instance would need `BigInt`, and the manifest says so.

**The edge cases.** A chain with no matrices has cost zero. A chain with one matrix has cost zero and never enters the length loop. A chain with two matrices has exactly one split. The programs handle all three without a special branch beyond the empty and single-element cases, because the table is initialized for the single-element ranges and the first length is two.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting `opt[i][i] = i` | The first window is wrong and the table drifts | Initialize the diagonal before the length loop |
| Filling the table by rows instead of by length | A cell reads a range that has not been computed | Outer loop over the length |
| Using the window without checking the cost | The answer is too large and no error is reported | Verify the quadrangle inequality and test against the cubic table |
| Scanning every split anyway | The program is correct but still cubic | Use the window as the loop bounds |
| Choosing the largest optimal split | The split table can lose its monotonicity | Keep the first split that attains the minimum |
| Using 32-bit costs | The answer overflows on a long chain | Use a 64-bit accumulator |
| Mixing one-based and zero-based dimensions | The cost of the last multiplication is wrong | Write the shift out once and reuse it |
| Clamping only one of the two bounds | The window can leave the table | Clamp both ends to `[i, j - 1]` |
| Treating the bound as a theorem about every interval DP | A cost without the inequality gives a wrong answer | Check the condition, or fall back to the cubic table |
| Recomputing the range sum inside the split loop | The constant factor hides the quadratic gain | Precompute prefix sums |

### Why this fails: a range cost without the quadrangle inequality

The mistake that survives review most often is using the window because the recurrence "looks like" an interval dynamic program. The bound is a theorem about the cost, not about the shape of the recurrence, and a cost that violates the quadrangle inequality can move the best split outside the window.

Take four elements and the range costs

| Range   | Cost |
| ------- | ---- |
| $[1,2]$ | 3    |
| $[1,3]$ | 3    |
| $[1,4]$ | 1    |
| $[2,3]$ | 13   |
| $[2,4]$ | 18   |
| $[3,4]$ | 10   |

The cost violates the quadrangle inequality on $a = 1$, $b = 2$, $c = 3$, $d = 4$:

$$
w(1,3) + w(2,4) = 3 + 18 = 21,
\qquad
w(1,4) + w(2,3) = 1 + 13 = 14.
$$

The left side is larger, so the inequality fails.

The full table starts with the length-two ranges: `dp[1][2] = 3`, `dp[2][3] = 13`, `dp[3][4] = 10`. The length-three ranges are:

- $[1,3]$: split at $1$ costs $13 + 3 = 16$; split at $2$ costs $3 + 3 = 6$. So `dp[1][3] = 6` and `opt[1][3] = 2`.
- $[2,4]$: split at $2$ costs $10 + 18 = 28$; split at $3$ costs $13 + 18 = 31$. So `dp[2][4] = 28` and `opt[2][4] = 2`.

The length-four range $[1,4]$ has window `[opt[1][3], opt[2][4]] = [2, 2]`. The windowed scan examines only $k = 2$, whose cost is $dp[1][2] + dp[3][4] + w(1,4) = 3 + 10 + 1 = 14$. The full scan examines all three splits:

- $k = 1$: $dp[2][4] + w(1,4) = 28 + 1 = 29$.
- $k = 2$: $3 + 10 + 1 = 14$.
- $k = 3$: $dp[1][3] + w(1,4) = 6 + 1 = 7$.

The true answer is $7$, attained at $k = 3$, which lies outside the window. The windowed program prints $14$. The gap is not a small numerical error; it is the cost of applying a theorem whose hypothesis is false.

The generalization is a rule about the whole technique: **the window is only as good as the quadrangle inequality.** Before using it, either prove the inequality for the cost or run both the windowed and the cubic programs on small random instances and compare. The second test is cheap and catches the mistake before it reaches a judge.

## Variants and extensions

- **Optimal binary search tree.** The range is a set of sorted keys, the split is the root, and the cost is the sum of the frequencies in the range. The range sum is additive and monotone, so the bound applies. This is the canonical Knuth-Yao application.
- **Stone merging.** Adjacent piles are merged, and the cost of a merge is the sum of the two piles. The range cost is the sum of the range, which is additive. The linear version is the smallest complete example; the circular version doubles the array and takes the best window.
- **Matrix chain multiplication.** The split is the last multiplication, and the cost added by a range is the product of the dimensions that meet at that split. The programs in this article apply the split table to the standard recurrence, and the cubic table is the reference for the differential test.
- **Partition dynamic programming.** The state is the first $i$ elements and the number of blocks, and the transition chooses the last cut. The monotonicity of the best cut in $i$ is the same quadrangle-inequality consequence, but the bound is one-dimensional per layer. Divide-and-conquer optimization computes a layer in $O(n \log n)$; the direct window scan is $O(n^2)$ per layer in the worst case, and a two-layer bound can reduce it further.
- **Divide-and-conquer optimization.** When the best cut is monotone but the two-sided window is unavailable, recurse on the midpoint of the right endpoint and restrict the candidate cuts to the range between the cuts of the neighbors. The cost is $O(n \log n)$ per layer.
- **Convex hull trick.** When the transition is a line in the state variable, the candidates form an envelope and the scan over earlier states disappears. The two techniques optimize different loops and can appear in the same program.
- **SMAWK and Monge arrays.** A totally monotone matrix can be searched in linear time, which gives the same asymptotic result as Knuth optimization for a wider class of costs. The implementation is more delicate, and the constant is larger.
- **Parallel evaluation.** The cells of one length depend only on shorter lengths, so a diagonal can be evaluated in parallel. The window bounds are known before the diagonal starts.

The first three rows are the applications that appear most often in contests. The last five are the directions to take when the cost does not satisfy the two-sided bound but still has structure.

## Contest strategy

Under contest pressure, the errors above are what cost points, and they are all avoidable with a fixed procedure.

1. Write the cubic recurrence first, with the range cost named explicitly. Confirm that the cost depends on the range and not on the split. If it depends on the split, stop and reformulate.
2. Prove or test the quadrangle inequality and monotonicity. For a range sum, both are immediate. For an arbitrary cost, run the cubic and windowed programs on random small instances and compare every cell, not only the final answer.
3. Initialize `opt[i][i] = i` before the length loop.
4. Fill by increasing length, and compute the window from `opt[i][j - 1]` and `opt[i + 1][j]`.
5. Keep the smallest optimal split, and clamp both ends of the window to `[i, j - 1]`.
6. Check the width of the cost: the largest possible answer, and whether it fits in the type being used.
7. Test four instances by hand: one element, two elements, a chain where the best split is at the left end, and a chain where it is at the right end.
8. If the window is correct but the program is still slow, look at the range-sum computation. A prefix sum turns an $O(n)$ cost into $O(1)$ and is often the difference between passing and not.

The differential test is the most valuable step. The cubic program is short, obviously correct, and fast enough for $n \le 200$. Running both on a few hundred random instances catches an invalid cost, a wrong window, and an off-by-one in the same pass.

## Worked problems

### Problem 1: the matrix chain

**Restatement.** There are $n$ matrices with dimensions $p_0, \ldots, p_n$. Matrix $i$ has dimensions $p_{i-1} \times p_i$. The product must be evaluated in the given order, and any parenthesization is allowed. Report the minimum number of scalar multiplications. Constraints: $1 \le n \le 2000$, $1 \le p_i \le 1000$.

**Naive baseline.** The cubic interval table, at a cost of about $1.3 \times 10^9$ split evaluations at the upper limit.

**Insight.** The best split of a range is monotone in the endpoints, so the two shorter ranges bracket it.

**Derivation.** Keep the cost table and the split table. For each length from two to $n$, compute the window from the two shorter ranges, scan it, and store the best cost and split. The last multiplication costs `p[i] * p[k + 1] * p[j + 1]` in zero-based indices.

**Correctness.** The recurrence is exhaustive over the last multiplication, and the window contains the optimal split by the monotone-split theorem.

**Complexity.** $O(n^2)$ time and $O(n^2)$ space. At $n = 2000$ the tables cost about 48 MB and the number of split evaluations is a few million.

**Common wrong approach.** Scanning every split. The program is correct and passes small tests, but it is cubic and times out at the upper limit. A second wrong approach is using 32-bit costs, which overflows after a handful of matrices with dimensions near $1000$.

### Problem 2: the optimal binary search tree

**Restatement.** Given $n$ sorted keys with query frequencies $f_1, \ldots, f_n$, build a binary search tree that minimizes the expected search cost, which is the sum of each frequency times the depth of its key plus one. The input holds several trees, each as $n$ followed by the $n$ frequencies, and ends at end of file. Constraints: $1 \le n \le 250$, frequencies non-negative.

**Naive baseline.** Try every binary search tree shape, which is the Catalan number $C_n$, or fill the cubic interval table.

**Insight.** Every subtree is a contiguous range of keys, and the root of a range splits it into a left range and a right range. The cost added by the range is the sum of its frequencies, independent of the root.

**Derivation.** Let `dp[i][j]` be the minimum cost of a tree over keys $i$ through $j$, and let `sum[i][j]` be the range sum. Then

$$
dp[i][j] = \min_{i \le k \le j} \bigl(dp[i][k-1] + dp[k+1][j]\bigr) + \text{sum}(i,j).
$$

The range sum is additive, so it satisfies the quadrangle inequality and is monotone. The best root is therefore bracketed by the best roots of the two shorter ranges. A prefix-sum array answers the range sum in $O(1)$.

**Correctness.** The root is the last decision, every key belongs to exactly one side, and the added cost is the range sum. The bound is the monotone-split theorem applied to the range-sum cost.

**Complexity.** $O(n^2)$ time and $O(n^2)$ space. At $n = 250$ the table is small; the cubic version is also feasible, which makes this a good place to compare the two.

**Common wrong approach.** Forgetting the $+ \text{sum}(i,j)$ term on the assumption that the root's frequency is the only added cost. The term accounts for every key in the range gaining one level of depth, and leaving it out undercounts long ranges.

### Problem 3: the party of monkeys

**Restatement.** $n$ monkeys sit in a circle, and monkey $i$ has a making-friends time $t_i$. Two adjacent groups may be introduced, and the cost of the introduction is the sum of the times of both groups. After the introduction the groups merge. Report the minimum total cost of introducing all $n$ monkeys. Several test cases are read until end of file. Constraints: $1 \le n \le 1000$, $1 \le t_i < 1000$.

**Naive baseline.** The cubic interval table over the doubled array, which is about $1.3 \times 10^9$ split evaluations at $n = 1000$.

**Insight.** Duplicate the array so that every rotation of the circle becomes a contiguous range of length $n$. The cost of a range is its sum, so the range-sum form of Knuth optimization applies.

**Derivation.** Build the array of length $2n$. For every range of length at most $n$, compute the interval table with the window. The answer is the smallest `dp[i][i + n - 1]` over the $n$ windows of length $n$.

**Correctness.** Every circular merging order has a first group that is a contiguous window of the doubled array, and the linear recurrence over that window is the same as the circular one. The range sum is additive, so the bound is valid. The minimum over the windows covers every rotation.

**Complexity.** $O(n^2)$ time and $O(n^2)$ space over $2n$ positions, which is four times the work of the linear table of size $n$ but still quadratic.

**Common wrong approach.** Running the linear table on the original array and reporting `dp[0][n-1]`. That fixes the starting point and ignores every rotation that cuts between two monkeys.

## Practice progression

1. **Recognition.** Given a recurrence, decide whether the cost is a range cost or a split cost. A range cost is the same for every split; a split cost changes with the cut. Only the first kind is a candidate for the two-sided bound.
2. **Direct application.** Implement the cubic interval table for matrix chain, then add the split table and the window, and compare the two on random chains of length at most 10.
3. **Adaptation.** Implement the optimal binary search tree with prefix sums, and check that the windowed table agrees with the cubic table on every range, not only on the full range.
4. **Combination.** Implement the circular stone-merging problem with the doubled array, and combine the window with a prefix-sum array for the range cost.
5. **Challenge.** Find a range cost that fails the quadrangle inequality, and construct an instance where the windowed table is wrong. The four-element example in the common mistakes section is the smallest one.
6. **Transfer.** Apply the same split table to a problem that never mentions intervals: a partition of a sequence into blocks, a polygon triangulation, or a tree-building problem. Identify the range, the split, and the cost before writing any code.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the interval recurrence and say what the split represents. (Formal model)
2. State the quadrangle inequality and the monotonicity condition. (Formal model)
3. State the Knuth bound, including which two cells supply the window. (Key insight)
4. Why does the total number of split evaluations telescope to $O(n^2)$? (Complexity analysis)
5. What is stored in the split table, and why does the cost table alone not suffice? (Algorithm derivation)
6. Why must `opt[i][i]` be initialized, and to what value? (Implementation walkthrough)
7. Give the smallest range cost that violates the quadrangle inequality, and the value the windowed program prints. (Common mistakes)
8. Why does the proof of the monotone split use the quadrangle inequality of the cost table rather than only the cost itself? (Correctness proof)
9. What is the difference between a range cost and a split cost, and which one does the theorem require? (Algorithm selection)
10. When is divide-and-conquer optimization a better choice than the two-sided window? (Variants and extensions)
11. Why does the optimal binary search tree satisfy the condition, and what term is easy to forget? (Worked problems)
12. How does doubling the array turn the circular merging problem into the linear one? (Worked problems)

## Further reading

- The interval dynamic program that this technique speeds up is developed in [interval dynamic programming](/algorithms/dynamic-programming/interval-dp), including the length order and the last-move proof.
- The other classic optimization of an interval table is the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick), which removes a linear scan over earlier states rather than over split points.
- The 0/1 knapsack table in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) is a different shape of dynamic program, and the descending sweep there plays the role that the length order plays here.
- A range sum is the cost of the optimal binary search tree and of stone merging; the prefix-sum technique that answers it in constant time is in [prefix sums](/algorithms/arrays/prefix-sums).
- When the answer is a monotone predicate over the table, the search for the boundary is [binary search](/algorithms/searching/binary-search) applied to the answer.
- The Catalan number that counts the parenthesizations is developed in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The recurrence proof uses the same induction on length as the interval article, and the running-time analysis uses the same accounting as [complexity](/algorithms/foundations/complexity).
- Every listing in this article, in all six languages, is published in the reference implementations of this repository.
