---
id: dynamic-programming.interval-dp
title: Interval dynamic programming
summary: Solve a problem over a sequence by solving every contiguous subproblem and combining two shorter ones, in order of increasing length.
division: [gold]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        interval dp,
        interval dynamic programming,
        matrix chain multiplication,
        last move,
        split point,
        length ordering,
        palindrome subsequence,
    ]
prerequisites:
    required: [foundations.complexity, foundations.recursion]
    recommended:
        [
            dynamic-programming.0-1-knapsack,
            dynamic-programming.longest-increasing-subsequence,
            searching.two-pointers,
        ]
complexity:
    time: "O(n^3)"
    space: "O(n^2)"
assumptions:
    - The answer for a range depends only on the answers for shorter ranges of the same sequence, so that the state is a pair of endpoints.
    - The structure admits a decomposition in which the last operation splits the range into two shorter ranges.
    - The cost of combining the two answers depends only on the endpoints of the range and on the split point.
reviewed: false
---

## At a glance

Interval dynamic programming solves problems whose subproblems are **contiguous ranges** of a sequence. The state is a pair of endpoints, $dp[i][j]$ for the range from index $i$ to index $j$, and the recurrence combines two shorter ranges of the same array.

The shape of the recurrence is always the same:

$$
dp[i][j] = \min_{i \le k < j} \bigl(dp[i][k] + dp[k+1][j] + \operatorname{cost}(i, k, j)\bigr).
$$

The three parts are the two halves and the price of merging them. The last operation of any construction on $[i, j]$ splits the range at some $k$, so the recurrence is exhaustive, and the proof is a single argument about the last move.

The order of evaluation is by **increasing length**, which is what makes the table computable. The cost is $O(n^3)$ time and $O(n^2)$ space, and the space figure is the one that usually decides whether the technique fits.

The technique is the right one for matrix chain multiplication, for the minimum cost of merging adjacent files, for the longest palindromic subsequence, and for the whole family of "the last operation splits the range" problems.

## Problem motivation

A print shop cuts a poster. The poster is a row of $n$ panels, and consecutive panels must be printed together, on one sheet. A sheet that carries panels $i$ through $j$ costs the area of those panels, and the shop may print a group of consecutive panels on a sheet, but a group may not be split.

The constraints are $n \le 5000$ panels, with a width and a height for each.

The naive approach is to try every way of splitting the poster in half, recursively. That is the number of binary trees with $n$ leaves, which is the Catalan number $C_{n-1}$, and $C_{4999}$ is more than $10^{3000}$. The search does not terminate.

The dynamic program computes the answer for every range once. There are $n(n+1)/2 \approx 1.25 \times 10^7$ ranges, and each one tries every split, so the cost is about $2 \times 10^{10}$ basic operations. That is still large, and the honest answer is that a range of $5000$ needs the $O(n^3)$ program to be written carefully. A range of $500$ is $2 \times 10^7$ operations, which is comfortable.

The gain over the search is a factor of $10^{2995}$. The reason is exactly one thing: **two different splittings that produce the same range can be compared by their costs alone, so the program keeps the best one and never looks at the other again.** That is the Bellman principle applied to ranges, and it is the same principle as everywhere else in this encyclopedia.

## Recognition patterns

Interval dynamic programming is the right tool when all of the following hold.

- The input is a **sequence**, and the subproblems are **contiguous ranges** of it.
- The answer for a range can be **decomposed**: the last operation on the range leaves two smaller ranges and a price that depends on the range and on where the split was.
- The price of the last operation is **additive**, so that the total cost of a construction is the sum of the costs of its parts.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| $n \le 200$ | The cubic program is $1.3 \times 10^6$ split evaluations and passes easily |
| $n \le 1000$ | The cubic program is $1.7 \times 10^8$ split evaluations; it needs a fast implementation |
| $n \le 3000$ | The cubic program is $4.5 \times 10^9$ split evaluations; it needs the linear-space form or a better algorithm |
| The answer is a **count** rather than a cost | The same technique applies, with a sum in place of a minimum |
| The subproblems are **not** contiguous, such as subsequences of a set | Rules out the technique; the state is a bitmask instead |
| The last operation does **not** split the range | Rules out the technique; the structure is different |
| The ranges overlap rather than nest | Rules out the technique; try a segment tree instead |

The last two rows are the ones that catch people. "The longest subsequence of the array" is not an interval problem, because a subsequence skips elements and the state would have to record which elements were skipped. "The longest subsequence that is also contiguous" is, and the wording matters: the word _subsequence_ without _contiguous_ rules the technique out.

A phrase in a statement that points at this technique is "**consecutive**", "**contiguous**", "**a run of**", or "**merge the adjacent**". A phrase that points away from it is "**choose any**" or "**in any order**", because then the subproblem is not a range.

## Naive approach

The baseline is the recursive search over splittings.

```python
def merge_naive(lo, hi):
    if lo == hi:
        return 0
    best = float("inf")
    for k in range(lo, hi):
        best = min(best, merge_naive(lo, k) + merge_naive(k + 1, hi) + cost(lo, k, hi))
    return best
```

This is correct, and it is the reference implementation for the differential test on small ranges. Its cost is the Catalan number, and the reason is visible in the code: the same range is reached by many different paths, and each path recomputes it.

The second baseline computes the same recurrence but fills the table in the wrong order.

```python
for i in range(n):              # increasing left endpoint
    for j in range(i, n):       # increasing right endpoint
        for k in range(i, j):
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k+1][j] + cost(i, k, j))
```

The order is wrong. The state $dp[i][j]$ reads $dp[i][k]$ with $k < j$ and $dp[k+1][j]$ with $k+1 > i$, and the inner loop over $j$ does not guarantee that $dp[k+1][j]$ has been computed: when $k+1 > i$, the row $k+1$ has not been visited at all. The program reads uninitialized memory, and the value it produces depends on what happened to be in the table. The fix is to order the loops by length, and the next section explains why.

## Key insight

The insight is that **every construction on a range has a last operation, and the last operation splits the range into two shorter ranges.**

The last operation might be a merge of two adjacent groups, a matrix multiplication of two blocks, a pairing of the two ends, or a choice of a pivot. In every case, before that last operation there were two independent constructions on two adjacent ranges, and the ranges together are exactly the original range.

Three consequences follow.

1. The state is a **pair of endpoints**, because the subproblem is a range.
2. The recurrence **splits the range** at every possible point and takes the best.
3. The proof is a **last-move argument**: any construction has a last operation, the recurrence considers its split, and the two sub-constructions are covered by the induction.

The third consequence is what makes the technique feel airtight rather than lucky. There is no heuristic about which split is promising, and no reason to prefer a particular one. The recurrence tries all of them, and the proof says that is sufficient.

::: math invariant Invariant
At the moment the program computes $dp[i][j]$, every $dp[i][k]$ with
$i \le k < j$ and every $dp[k+1][j]$ with $i \le k < j$ already holds its
final value, because both have a smaller length. Every value stored in the
table is the cost of an actual construction on its range, and the table
entry is the minimum over all such constructions.
:::


## Formal model

Let $a_1, a_2, \ldots, a_n$ be the sequence, and let $C(i, j)$ be the cost of performing the final operation on the range $[i, j]$ when the range has been split at $k$, where the final operation merges the block $[i, k]$ with the block $[k+1, j]$.

::: math definition Definition
The **optimal cost** $D(i, j)$ of a range $[i, j]$ is the minimum, over all
constructions on that range, of the total cost of the construction. A
construction is a sequence of final operations, each of which joins two
adjacent blocks.
:::


::: math definition Definition
A **split** of the range $[i, j]$ is an index $k$ with $i \le k < j$. The
split separates the range into the left block $[i, k]$ and the right block
$[k+1, j]$.
:::


::: math lemma Lemma
Every construction on a range $[i, j]$ with $i < j$ has a last operation
that joins two adjacent blocks $[i, k]$ and $[k+1, j]$ for some split $k$,
and the cost of the construction is the cost of the construction on the
left block, plus the cost of the construction on the right block, plus
$C(i, k, j)$.
:::


::: math proof Proof
The last operation of the construction joins two blocks, and the blocks
must be adjacent and must together cover the range, because the last
operation is the only one that remains and the range was produced by the
earlier operations. Write the two blocks as $[i, k]$ and $[k+1, j]$ for
some $k$. The earlier operations split into the operations that built the
left block and the operations that built the right block, and their costs
add to the cost of the construction, because every operation of the
construction is charged exactly once. $\square$
:::


::: math recurrence Recurrence
$$
D(i, j) = \min_{i \le k < j} \bigl(D(i, k) + D(k+1, j) + C(i, k, j)\bigr),
\qquad D(i, i) = 0.
$$
:::


::: math lemma Lemma
The splits of $[i, j]$ are exhaustive: for every construction on the range,
one of the splits in the recurrence produces a cost no larger than the cost
of that construction.
:::


::: math proof Proof
Take any construction on $[i, j]$ and let $k$ be the split of its last
operation, which exists by the previous lemma. The construction's cost is
$D(i,k) + D(k+1,j) + C(i,k,j)$ with the two $D$ values replaced by the
costs of its own sub-constructions, and those costs are at least $D(i,k)$
and $D(k+1,j)$ by the definition of $D$. So the construction's cost is at
least the value of the term of the recurrence at $k$, and therefore at
least the minimum over all $k$. $\square$
:::


## Algorithm derivation

### The order of evaluation

The recurrence reads $D(i, k)$ and $D(k+1, j)$, both of which have a strictly smaller length than $j - i + 1$. So the table must be filled in **increasing order of length**.

```python
for length in range(2, n + 1):
    for i in range(0, n - length + 1):
        j = i + length - 1
        for k in range(i, j):
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k+1][j] + cost(i, k, j))
```

The outer loop over the length is the point. Looping over the left endpoint instead does not work, because the state reads rows to the right of the current one.

### The space

The table has $n(n+1)/2$ entries, and the recurrence reads only the diagonals of shorter length. The **linear-space form** keeps only the previous diagonal, which has $n$ entries, and it computes the same answer in the same $O(n^3)$ time and $O(n)$ space. It is worth knowing when the memory limit is tight, and it is not much harder to write, because the diagonal index is $j - i$.

The length-ordered loop also has a cache-friendly variant: iterate over the length in the outer loop and the left endpoint in the inner loop, so that each diagonal is written contiguously.

### The reconstruction

To output the actual construction rather than its cost, keep a parallel array `split[i][j]` recording the $k$ that achieved the minimum, and then walk the table: the construction on $[i, j]$ is the construction on $[i, k]$, the construction on $[k+1, j]$, and the final operation joining them. The walk is a recursion on the length, so it terminates.

## Step-by-step execution

Take the matrix chain multiplication problem. Four matrices are given:

| Matrix | Rows | Columns |
| ------ | ---- | ------- |
| $A_1$  | 2    | 3       |
| $A_2$  | 3    | 4       |
| $A_3$  | 4    | 5       |
| $A_4$  | 5    | 6       |

Multiplying $A_i A_j \cdots A_k$ costs the sum, over the multiplications, of the product of the two inner dimensions, the rows of the left operand and the columns of the right operand. The goal is the cheapest parenthesization.

The table $D(i, j)$ holds the cost of the cheapest parenthesization of $A_i \cdots A_j$, and $C(i, k, j)$ is the cost of the final multiplication, which joins a $p_i \times p_{k+1}$ block with a $p_{k+1} \times p_{j+1}$ block and costs $p_i \cdot p_{k+1} \cdot p_{j+1}$.

The base cases are $D(i, i) = 0$: a single matrix is already computed.

The length-two ranges are one multiplication each.

| Range    | Split $k$ | $C$                       | $D$ |
| -------- | --------- | ------------------------- | --- |
| $D(1,2)$ | 1         | $2 \cdot 3 \cdot 4 = 24$  | 24  |
| $D(2,3)$ | 2         | $3 \cdot 4 \cdot 5 = 60$  | 60  |
| $D(3,4)$ | 3         | $4 \cdot 5 \cdot 6 = 120$ | 120 |

The length-three ranges try both splits.

| Range    | $k$ | $D(1,k) + D(k+1,3) + C$               | Value | Best    |
| -------- | --- | ------------------------------------- | ----- | ------- |
| $D(1,3)$ | 1   | $0 + 60 + (2 \cdot 3 \cdot 5) = 90$   | 90    |         |
| $D(1,3)$ | 2   | $24 + 0 + (2 \cdot 4 \cdot 5) = 64$   | 64    | $k = 2$ |
| $D(2,4)$ | 2   | $0 + 120 + (3 \cdot 4 \cdot 6) = 192$ | 192   |         |
| $D(2,4)$ | 3   | $60 + 0 + (3 \cdot 5 \cdot 6) = 150$  | 150   | $k = 3$ |

The full range tries three splits.

| Range    | $k$ | $D(1,k) + D(k+1,4) + C$                | Value |
| -------- | --- | -------------------------------------- | ----- |
| $D(1,4)$ | 1   | $0 + 150 + (2 \cdot 3 \cdot 6) = 186$  | 186   |
| $D(1,4)$ | 2   | $24 + 120 + (2 \cdot 4 \cdot 6) = 192$ | 192   |
| $D(1,4)$ | 3   | $64 + 0 + (2 \cdot 5 \cdot 6) = 124$   | 124   |

The answer is $124$, achieved by the parenthesization $((A_1 A_2) A_3) A_4$, whose cost is $24 + 40 + 60 = 124$: the first multiplication costs $2 \cdot 3 \cdot 4 = 24$, the second costs $2 \cdot 4 \cdot 5 = 40$, and the third costs $2 \cdot 5 \cdot 6 = 60$.

The competing parenthesization $A_1 (A_2 (A_3 A_4))$ costs $120 + 72 + 36 = 228$, and $(A_1 A_2)(A_3 A_4)$ costs $24 + 120 + 48 = 192$. Neither is cheaper, and the table found the cheapest without trying them all.

The last row is the interesting one. The split $k = 3$ is the last split tried, so a program that computed the splits in a different order and stopped early would miss it. Trying all of them is not a waste.

## Correctness proof

::: math theorem Theorem
For every range $[i, j]$, the table entry $D(i, j)$ computed by the
algorithm is the cost of the cheapest construction on that range.
:::


::: math proof Proof
The proof is an induction on the length of the range.

**Base case.** A range of length $1$ contains a single item, and no operation is needed, so the cheapest construction costs $0$. The algorithm sets $D(i, i) = 0$, which is correct.

**Inductive step.** Let the range $[i, j]$ have length $L > 1$, and suppose the claim holds for every range of length less than $L$.

First, every value the recurrence considers is the cost of an actual construction. For a split $k$, take the cheapest construction on $[i, k]$ and the cheapest construction on $[k+1, j]$, which exist by the induction hypothesis, and join them with the final operation. The result is a construction on $[i, j]$ of cost $D(i, k) + D(k+1, j) + C(i, k, j)$. So the minimum the recurrence takes is attained by some construction, and $D(i,j)$ is at least the optimal cost.

Second, take any construction on $[i, j]$. By the last-move lemma, its last operation joins two blocks $[i, k]$ and $[k+1, j]$ for some split $k$, and its cost is the cost of its sub-constructions plus $C(i, k, j)$. By the induction hypothesis the sub-constructions cost at least $D(i,k)$ and $D(k+1,j)$, so the construction costs at least $D(i,k) + D(k+1,j) + C(i,k,j)$, which is at least $D(i,j)$ because the recurrence takes the minimum over all splits and $k$ is one of them.

So $D(i,j)$ is at most the cost of every construction and at least the cost of one, and it is the optimal cost. $\square$
:::


::: math theorem Theorem
The algorithm computes the table correctly, because every state it reads
has already been computed.
:::


::: math proof Proof
The state $D(i,j)$ reads $D(i,k)$ and $D(k+1,j)$, whose lengths are
$k - i + 1$ and $j - k$, and both are strictly less than $j - i + 1$
because $i \le k < j$. The outer loop of the algorithm processes the
lengths in increasing order, so both states have been computed and will
not be changed again. $\square$
:::


## Complexity analysis

The table has $n(n+1)/2$ entries. Each entry tries $j - i$ splits, so the total number of split evaluations is

$$
\sum_{L=2}^{n} (n - L + 1)(L - 1) = \frac{n(n-1)(n+1)}{6} = \Theta(n^3).
$$

| Form | Time | Space |
| --- | --- | --- |
| The full table | $O(n^3)$ | $O(n^2)$ |
| The full table, with a parent pointer for reconstruction | $O(n^3)$ | $O(n^2)$ |
| The linear-space form, one diagonal at a time | $O(n^3)$ | $O(n)$ |
| The linear-space form, with reconstruction | $O(n^3)$ | $O(n^2)$ for the parents alone |

The constant matters. At $n = 500$, the number of split evaluations is about $2 \times 10^7$, which is a fraction of a second in C++ and a few seconds in Python. At $n = 3000$ it is about $4.5 \times 10^9$, which is a minute in C++ and hopeless in Python.

The matrix chain variant of the recurrence has a special structure: the cost $C(i,k,j)$ is monotone in $k$ in a way that allows the **Knuth optimization**, which reduces the number of splits tried to $O(n)$ per entry and the total time to $O(n^2)$. The condition it needs is that the split interval $[opt(i,j-1), opt(i+1,j)]$ contains the optimal split, and the matrix chain recurrence satisfies it. The optimization does not apply to a general interval dynamic program, and it is worth knowing about because it turns a cubic program into a quadratic one on a large family of problems.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The cheapest parenthesization of a matrix chain | Interval dynamic programming, $O(n^3)$ |
| The cheapest parenthesization of a large matrix chain | The same, with the Knuth optimization, $O(n^2)$ |
| The minimum cost of merging adjacent files or stones | Interval dynamic programming, $O(n^3)$ |
| The longest palindromic subsequence | Interval dynamic programming, $O(n^2)$ |
| The minimum number of insertions to make a string a palindrome | Interval dynamic programming, $O(n^2)$ |
| The longest common subsequence of two strings | A different technique: a two-dimensional table indexed by two positions |
| The cheapest way to cut a rod | A one-dimensional program, because the price does not depend on the cut position |
| The best partition into contiguous groups | Interval dynamic programming, with a different $C$ |
| The subproblems are subsequences rather than ranges | Rules out the technique; use a bitmask or a different state |
| $n > 5000$ and the split cost is arbitrary | Rules out the cubic program; the problem probably has extra structure |

The seventh row is a trap worth naming. The rod-cutting problem, where a rod of length $i$ sells for a price $p_i$ and a cut is free, is often quoted as an interval dynamic program, but it is really a one-dimensional program, because the price of a piece does not depend on where the cut was. If the cost of the final operation does not depend on the split point, the split is not needed, and the state can collapse to a single index.

The reverse trap is the **longest common subsequence** of two strings. It looks like an interval problem and it is not: the two ranges advance independently, so the state is a pair of positions rather than a pair of endpoints of one sequence, and the table is indexed $[i][j]$ over the two strings. The technique is the same, and the state is different.

## Recursion decision

The recursive formulation of this problem is the naive approach in the section above, and it is exponential without memoization. With memoization it has the same time and space as the iterative form, and its recursion depth is the length of the range, which is at most $n$.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; a range of $10^4$ is already uncomfortable recursively |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of $1000$ | Iterative; the recursive form overflows for a range longer than $1000$ |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The iterative form is better for three reasons beyond the stack. The table is laid out in one flat array, so the memory is predictable. The order of evaluation is stated in the program rather than discovered by the interpreter, so the program is easier to reason about. And the linear-space form, which keeps only one diagonal, is not expressible in the recursive form at all, because the recursive form needs every subinterval to remain available.

The one case where the recursive form is worth writing is the **reconstruction**, where the parent pointers are followed to rebuild the construction. That walk has depth $O(\log n)$ in the best case and $O(n)$ in the worst case, and it is short enough to write recursively in every language.

## Implementation walkthrough

The order of the loops is the whole implementation.

```cpp
for (int length = 2; length <= n; ++length) {
    for (int i = 0; i + length <= n; ++i) {
        const int j = i + length - 1;
        long long best = LLONG_MAX;
        for (int k = i; k < j; ++k) {
            best = min(best, dp[i][k] + dp[k+1][j] + cost(i, k, j));
        }
        dp[i][j] = best;
    }
}
```

The `length` loop is outermost. Moving it inside makes the program read states that have not been computed, and the failure is silent: the table holds whatever was in memory before.

The half-open convention for the split is worth stating. The split $k$ runs from $i$ to $j-1$, so the left block is $[i, k]$ and the right block is $[k+1, j]$, and the two blocks together are $[i, j]$ with no overlap and no gap. A program that uses $k$ from $i$ to $j$ instead has a split with an empty right block, and it reads $dp[j+1][j]$, which is out of bounds.

The third detail is the parent pointer.

```cpp
split[i][j] = k;   // the k that achieved the minimum
```

It costs one more array of $n^2$ entries, and it is the difference between a program that prints the cost and a program that prints the construction.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Looping over the left endpoint instead of the length | The program reads states that have not been computed | Put the length loop outermost |
| Using a half-open split range that includes $k = j$ | An out-of-bounds read of $dp[j+1][j]$ | Split over $i \le k < j$ |
| Forgetting the base case $D(i,i) = 0$ | Every range is too large by a constant | Initialize the diagonal to zero |
| Using a global $n \times n$ table for a $10^5$-element input | The program cannot allocate the memory | Check the memory figure before writing |
| Using 32-bit integers for the costs | The cost of a long chain overflows | Use a 64-bit type |
| Assuming the split can be chosen greedily | The answer is wrong; the common mistakes section has the counterexample |
| Applying the technique to a subsequence problem | The state is wrong | Check that the subproblems are contiguous |
| Forgetting that the linear-space form cannot reconstruct | The construction is lost | Keep the parents, or use the full table |
| Computing $C(i,k,j)$ inside the innermost loop with divisions | The program is several times slower | Precompute the $C$ values, or hoist the invariants out |

### Why this fails: the greedy split

The plausible wrong approach is to pick the split without trying all of them, on the reasoning that the best final multiplication should involve the smallest intermediate matrix. The argument sounds reasonable: a multiplication is cheaper when its inner dimensions are small, and the inner dimension at a split is the number of rows of the right block.

The smallest counterexample is a chain of three matrices:

| Matrix | Rows | Columns |
| ------ | ---- | ------- |
| $A_1$  | 2    | 3       |
| $A_2$  | 3    | 4       |
| $A_3$  | 4    | 5       |

There are exactly two parenthesizations.

- $(A_1 A_2) A_3$ costs $2 \cdot 3 \cdot 4 = 24$ for the first multiplication and $2 \cdot 4 \cdot 5 = 40$ for the second, for a total of $64$.
- $A_1 (A_2 A_3)$ costs $3 \cdot 4 \cdot 5 = 60$ for the first and $2 \cdot 3 \cdot 5 = 30$ for the second, for a total of $90$.

The optimal parenthesization is the first, and it costs $64$.

The greedy rule picks the split whose **final** multiplication is cheapest. The final multiplication of $(A_1 A_2) A_3$ is $2 \cdot 4 \cdot 5 = 40$, and the final multiplication of $A_1 (A_2 A_3)$ is $2 \cdot 3 \cdot 5 = 30$. The greedy rule therefore chooses the split at $k = 1$, which is $A_1 (A_2 A_3)$, and the program reports $90$ instead of $64$.

The mechanism is exact. The greedy rule optimizes the **last** multiplication in isolation, but the last multiplication's operands were already paid for. Making the final multiplication cheap by choosing a small inner dimension forces the earlier multiplications to be expensive, and the recurrence exists precisely to weigh those two effects against each other.

The lesson generalizes: **the cost of a range is not a local property of its endpoints, so no local rule can pick the split.** The recurrence tries every split precisely because the answer to "which split" depends on the sub-answers, and those are exactly what the table holds.

## Variants and extensions

- **The Knuth optimization.** When the split function satisfies the monotonicity condition $opt(i,j-1) \le opt(i,j) \le opt(i+1,j)$, the number of splits tried per entry drops to $O(1)$ amortized, and the whole program becomes $O(n^2)$. The matrix chain recurrence satisfies it.
- **The linear-space form.** Keeping only the previous diagonal reduces the space to $O(n)$ at the same time cost, at the price of not being able to reconstruct.
- **The palindromic variants.** The longest palindromic subsequence uses the recurrence $dp[i][j] = \max(dp[i+1][j], dp[i][j-1], dp[i+1][j-1] + 2)$ when $a_i = a_j$, and the same table shape.
- **Interval dynamic programming on trees.** The subproblems are subtrees rather than ranges, and the "split" is a choice of a root. The shape is the same, and it is covered in [tree dynamic programming](/algorithms/trees/tree-dp).
- **Two-dimensional tables.** The longest common subsequence is the same technique with the state indexed by a position in each of two sequences, and it is a special case of the general $dp[i][j]$ over two independent indices.
- **The divide and conquer optimization.** When the cost is a maximum rather than a sum, the monotone-split condition often still holds, and the same $O(n^2)$ improvement is available.
- **Counting rather than minimizing.** Replacing the minimum with a sum of the counts gives the number of constructions, and it is the same program with one line changed.

## Contest strategy

1. Write the last operation down in one sentence before writing any code. "The last operation joins two adjacent blocks at some split" is the sentence that produces the recurrence.
2. Decide the range convention: inclusive endpoints, and the split range $i \le k < j$. Write it as a comment, because it is the thing that goes wrong.
3. Put the length loop outermost. It is the difference between a program and a program that reads uninitialized memory.
4. Compute the memory figure before writing the table. $n^2$ entries at $n = 10^5$ is $10^{10}$ bytes, which is not a table.
5. Use 64-bit integers. A chain of a thousand items can cost more than $2^{31}$.
6. Write the brute-force version for a range of ten and keep it. A disagreement on a random range of ten is the fastest way to find a broken split.
7. If the cost of the final operation does not depend on the split point, the split is probably unnecessary and the program can collapse to one dimension. Check before writing the cubic loop.
8. If $n$ is in the thousands, look for the monotone split property before trying to optimize the constant.

## Worked problems

### Problem 1: the matrix chain

**Restatement.** There are $n \le 500$ matrices with given dimensions. Report the minimum number of scalar multiplications needed to multiply the chain in the given order, and the parenthesization that achieves it.

**Naive baseline.** Enumerate the parenthesizations, which is the Catalan number $C_{n-1}$, about $10^{295}$ at $n = 500$.

**Insight.** The last multiplication of any parenthesization joins two contiguous blocks, and it is the only thing that distinguishes one parenthesization from another at the top level.

**Derivation.** Fill the table $D(i, j)$ in increasing order of length. For each range, try every split $k$ and take the minimum of $D(i,k) + D(k+1,j) + p_i p_{k+1} p_{j+1}$. Record the split that achieved the minimum.

**Correctness.** The induction on the length in the correctness proof applies, with $C(i,k,j) = p_i p_{k+1} p_{j+1}$.

**Complexity.** $O(n^3)$ time and $O(n^2)$ space, which at $n = 500$ is about $2 \times 10^7$ split evaluations.

**Common wrong approach.** Picking the split greedily by the size of the final multiplication, which reports $90$ instead of $64$ on the three-matrix instance in the common mistakes section.

### Problem 2: the adjacent merge

**Restatement.** There are $n \le 2000$ files in a row with sizes $s_1, \ldots, s_n$. A move merges two adjacent files into one file whose size is their sum, and costs that sum. Report the minimum total cost of merging everything into one file.

**Naive baseline.** The recursive search over the merges, which is the Catalan number of the range lengths and is astronomical.

**Insight.** The last merge joins two adjacent blocks of the row, and the cost of the last merge is the total size of the row, which does not depend on the split. The split still matters, because the two blocks cost different amounts to build.

**Derivation.** Fill $D(i,j)$ in increasing length. For each split $k$, the candidate is $D(i,k) + D(k+1,j) + \sum_{t=i}^{j} s_t$, where the sum is a prefix-sum difference, so it is $O(1)$ to compute. The answer is $D(0, n-1)$.

**Correctness.** The same last-move argument applies, with $C(i,k,j)$ being the size of the whole range. The prefix sums are what make the $O(n^3)$ program fit, since a naive sum inside the innermost loop makes it $O(n^4)$.

**Complexity.** $O(n^3)$ time and $O(n^2)$ space. At $n = 2000$ that is about $1.3 \times 10^9$ split evaluations, which needs a fast implementation and a 64-bit type.

**Common wrong approach.** Using a priority queue to merge the two smallest files greedily, in the way the Huffman algorithm does. Huffman is optimal when **any** two files may be merged, and it is not optimal here, because the queue ignores the adjacency. The smallest counterexample is three files of sizes $1, 3, 1$ in a row. The queue merges the two smallest, which are the two files of size $1$, for a cost of $2$, and then merges the resulting file of size $2$ with the file of size $3$, for a cost of $5$, reporting a total of $7$. The two files of size $1$ are not adjacent, so no legal merge produces that sequence, and the only legal merges give $4 + 5 = 9$. The correct answer is $9$.

Even a greedy that respects the adjacency is not optimal. The counterexample is four files of sizes $3, 2, 2, 3$. The smallest adjacent pair is the middle $2, 2$, so the greedy merges it for a cost of $4$, leaving $3, 4, 3$; the next merge costs $7$ and the last costs $10$, for a total of $21$. The interval program gives $20$, achieved by merging the leading $3, 2$ for $5$, then the trailing $2, 3$ for $5$, and finally the two blocks for $10$. Every tie-break of the greedy gives $21$, because the middle pair is the unique smallest adjacent pair.

### Problem 3: the longest palindromic subsequence

**Restatement.** Given a string of length $n \le 10^4$, report the length of the longest subsequence of the string that is a palindrome.

**Naive baseline.** Enumerate the subsequences, which is $2^n$.

**Insight.** The first and last characters of a range either match, in which case the answer is two more than the answer for the interior, or they do not, in which case the answer is the better of the two ranges obtained by dropping one end.

**Derivation.** Fill $D(i,j)$ in increasing length. The base case is $D(i,i) = 1$. For a range of length two or more,

$$
D(i,j) = \begin{cases}
D(i+1,j-1) + 2 & \text{if } s_i = s_j, \\
\max(D(i+1,j), D(i,j-1)) & \text{otherwise},
\end{cases}
$$

with $D(i, j) = 0$ when $i > j$.

**Correctness.** A palindromic subsequence of $[i, j]$ either uses both ends, in which case $s_i = s_j$ must hold and the interior contributes $D(i+1,j-1)$, or it uses at most one of them, in which case it is a subsequence of one of the two shorter ranges. The recurrence takes the best of exactly these cases, so it is exhaustive.

**Complexity.** $O(n^2)$ time and $O(n^2)$ space, or $O(n)$ space with the linear-space form.

**Common wrong approach.** Using the same table for a **substring** question, where the answer is the longest palindromic substring. The substring version is not an interval dynamic program in this shape; it is the [Manacher algorithm](/algorithms/strings/manacher), which is linear.

## Practice progression

1. **Recognition.** Given a statement, decide whether the subproblems are contiguous ranges, and write the last operation down in one sentence.
2. **Direct application.** Implement the matrix chain program, and check it against a brute-force enumeration of the parenthesizations for a chain of ten matrices.
3. **Adaptation.** Write the adjacent-merge version with prefix sums, the palindromic-subsequence version, and the counting version that replaces the minimum with a sum.
4. **Combination.** Combine an interval dynamic program with a [segment tree](/algorithms/range-queries/segment-tree) for a version with point updates, and with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) for a version with a prefix query in the cost.
5. **Challenge.** Implement the Knuth optimization on the matrix chain program, and verify that it produces the same costs as the cubic program on random chains.
6. **Transfer.** Recognize an interval structure in a different problem: a tiling of a strip, a bracket-matching problem, or an edit-distance variant with a cost that depends on the gap.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the recurrence of an interval dynamic program and name its three parts. (Algorithm derivation)
2. Why must the table be filled in increasing order of length? (Algorithm derivation)
3. State the last-move lemma and say why the recurrence is exhaustive. (Formal model)
4. How many split evaluations does the cubic program perform, and what is that at $n = 500$? (Complexity analysis)
5. What is the smallest counterexample that breaks the greedy split, and what does the greedy program report? (Common mistakes)
6. Why does the greedy rule fail? What does it optimize in isolation? (Common mistakes)
7. When is the linear-space form unusable, and what does it cost? (Complexity analysis)
8. What is the condition for the Knuth optimization, and which recurrence satisfies it? (Variants and extensions)
9. Why is the longest common subsequence not an interval dynamic program over one string? (Algorithm selection)
10. When is the recursion depth a problem, and in which languages? (Recursion decision)
11. What does the invariant of the computation say, and why is it maintained? (Key insight)

## Further reading

- The subject index lists this technique, [interval dynamic programming](/algorithms/dynamic-programming/interval-dp), beside the other dynamic programs in the encyclopedia.
- The same technique applied to subtrees rather than to ranges is in [tree dynamic programming](/algorithms/trees/tree-dp).
- The dynamic program that replaces a backtracking search when the constraints involve a global property is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The other subproblem-shaped dynamic program, over subsequences of a set, is in [bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp).
- The linear algorithm for the palindromic substring questions that this article deliberately leaves aside is in [the Manacher algorithm](/algorithms/strings/manacher).
- The prefix sums that make the merge cost computable in constant time are in [prefix sums](/algorithms/arrays/prefix-sums).
- The monotonicity that makes the divide and conquer optimization possible is the same idea as the sorted arrays in [binary search](/algorithms/searching/binary-search).
- The tree of choices that the naive search explores is in [backtracking](/algorithms/enumeration/backtracking).
