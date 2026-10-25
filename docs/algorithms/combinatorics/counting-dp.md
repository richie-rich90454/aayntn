---
id: combinatorics.counting-dp
title: Counting dynamic programming
summary: Count the number of ways to satisfy a set of constraints by turning the question into a recurrence over a small state, and keep the count exact by reducing every value modulo a fixed modulus.
division: [gold, platinum]
subjects: [combinatorics]
level: advanced
importance: common-contest-technique
keywords:
    [
        counting dynamic programming,
        grid paths,
        recurrence,
        modulus,
        memoization,
        rolling array,
        number of ways,
        state compression,
    ]
prerequisites:
    required: [dynamic-programming.0-1-knapsack]
    recommended:
        [
            combinatorics.binomial-coefficients,
            number-theory.modular-arithmetic,
            foundations.recursion,
        ]
complexity:
    time: "O(S * T)"
    space: "O(S)"
assumptions:
    - The set of valid configurations is finite, so that the count is a finite integer.
    - The modulus is a positive integer, and reducing the count modulo the modulus is what the problem asks for.
reviewed: false
---

## At a glance

A counting dynamic program is a dynamic program whose table holds counts rather than optima. The table is filled from a recurrence, and the answer is the entry you read out at the end.

| Property | Value |
| --- | --- |
| **Problem** | Count the configurations of a set of objects that satisfy a set of constraints |
| **State** | The part of a configuration that the constraints still depend on |
| **Update** | The count of a state is the sum of the counts of its predecessors |
| **Time** | $O(\lvert S\rvert \cdot \lvert T\rvert)$, where $S$ is the state space and $T$ the transition cost |
| **Auxiliary space** | $O(\lvert S\rvert)$, often reduced to one slice of the table |
| **Requires** | A state small enough to index and a recurrence that closes |
| **Fails when** | The state space is exponential in the input, unless the state is compressed |

The two things that go wrong in practice are both about the state. A state that is too large does not fit in memory, and a state that is too small merges two configurations that the constraints can still tell apart, and then the count is wrong.

## Problem motivation

A robot moves on a $1000 \times 1000$ grid. Some cells are blocked. The robot may move only right or down, and the problem asks for the number of paths from the top-left cell to the bottom-right cell, modulo $10^9 + 7$.

The naive baseline enumerates the paths. Each path is a sequence of $1998$ moves, of which $999$ are rightward and $999$ are downward, so there are $\binom{1998}{999}$ of them, which is a number with about $600$ digits. The enumeration never finishes, and the number it would produce is exactly the number the problem asks for, which is why the enumeration is useless and the dynamic program is not.

The dynamic program fills a table of $10^6$ entries, one per cell, and reads out the answer. It takes a million additions and finishes in milliseconds. The reason it works is that the number of paths to a cell depends only on the numbers of paths to the two cells that can reach it, and those are already known when the cell is processed in row-major order.

The modulus is the second half of the story. The count of paths on an unblocked grid is a binomial coefficient with hundreds of digits, and the table holds such counts for every cell, so without a modulus the table itself does not fit in memory in any reasonable representation. Reducing every value modulo $10^9+7$ makes every table entry a machine word, and the addition that updates the table is exact in the residues.

## Recognition patterns

Counting dynamic programming is the right tool when the statement contains some of these phrases.

- "In how many ways", "count the number of ways", "the number of distinct".
- "Paths", "ways to reach", "routes", "sequences of moves".
- "Tiling", "placing", "arranging" with a set of allowed pieces.
- "How many strings", "how many bit strings", "how many sequences of length $n$ over an alphabet".
- "Exactly $k$ of", "at most", "at least", "no two adjacent".
- "The answer may be large", "modulo $10^9 + 7$", "modulo $998244353$".

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| The state space is at most $10^7$ states | A table of counts fits in memory and the time limit allows it |
| The state space is at most $10^9$ states | A table does not fit; the count must be computed by a formula or a matrix power |
| The state space is $2^{20}$ or less | A bitmask state is indexed directly, and the table is $10^6$ entries |
| The state space is $2^{30}$ or more | A bitmask state does not fit; a different formulation is needed |
| The modulus is $10^9 + 7$ | The product of two residues fits in a signed 64-bit integer |
| The modulus is up to $2^{63}-1$ | The product of two residues needs 128-bit arithmetic |
| No modulus is given | The exact count is wanted, and it must fit in the type being used |
| The answer is asked for exactly and is enormous | The problem is really asking for a formula, not a table |

The fifth and sixth rows are the ones that decide whether the arithmetic overflows, and they are worth checking before writing the code rather than after.

## Naive approach

The baseline enumerates the configurations.

```python
def count_paths(grid, r, c):
    if r == len(grid) - 1 and c == len(grid[0]) - 1:
        return 1
    if grid[r][c]:
        return 0
    total = 0
    if r + 1 < len(grid) and not grid[r + 1][c]:
        total += count_paths(grid, r + 1, c)
    if c + 1 < len(grid[0]) and not grid[r][c + 1]:
        total += count_paths(grid, r, c + 1)
    return total
```

This is correct and it is the reference implementation for the differential test. It is exponential in the depth of the grid, because it makes the same call from many different prefixes, and it is the version that a reader should write first so that the table version has something to be checked against.

The second baseline is the closed formula, $\binom{n+m}{n}$ for an unblocked grid, which is correct and is the right answer whenever the grid has no obstacles. It is the right answer for exactly one problem, and it does not extend.

## Key insight

The insight is that **the number of configurations reaching a state depends only on the state and on the constraints, not on how the configuration was built.**

For a grid, the number of paths to the cell $(r, c)$ is the number of paths to $(r-1, c)$ plus the number of paths to $(r, c-1)$, because a path to $(r, c)$ arrives from exactly one of those two cells, and the two classes are disjoint. That is a partition of the paths, which is the same kind of argument that gives Pascal's identity for the [binomial coefficient](/algorithms/combinatorics/binomial-coefficients), and it is the reason the same counting idea appears in both places.

The second insight is that the state must capture **everything the constraints still depend on**. For the grid, the state is the cell, because the only constraints are "do not enter a blocked cell" and "move only right or down", and neither depends on the path taken to get there. A program that adds the number of paths to $(r,c-1)$ to the number of paths to $(r-1,c)$ is right, and a program that also multiplies in the number of steps taken so far is right too but slower, because the extra factor is redundant.

The third insight is about the arithmetic. Every entry of the table is a count, and the count is a sum of two other counts. Reducing the two operands modulo $m$ and adding them modulo $m$ gives the residue of the exact sum, so the whole table can be computed in the residues of $m$ and the last entry is the residue of the exact count. This is the [modular arithmetic](/algorithms/number-theory/modular-arithmetic) property, and it is what makes the table fit in memory.

## Formal model

Let $C$ be the set of configurations, and let $v(c)$ be the number of constraints that configuration $c$ violates.

::: math definition Definition
A **state** is a description of a partial configuration that determines, for every way of completing it, whether the completion is valid. A **counting dynamic program** assigns to every state $s$ a value $D(s)$, the number of valid partial configurations that reach $s$, computed by a recurrence over a set of predecessors.
:::

::: math definition Definition
For a grid of $n$ rows and $m$ columns with a set $B$ of blocked cells, let $P(r,c)$ be the number of paths from $(0,0)$ to $(r,c)$ that move only right or down and never enter a blocked cell. Then $P$ satisfies

$$
P(r,c) = P(r-1,c) + P(r,c-1)
$$

for every cell that is neither blocked nor the origin, with $P(r,c) = 0$ on blocked cells, $P(0,0) = 1$, and $P$ taken to be $0$ outside the grid.
:::

::: math lemma Lemma
For every cell $(r,c)$, the paths counted by $P(r,c)$ partition into the paths whose last step is downward and the paths whose last step is rightward, and these two classes have sizes $P(r-1,c)$ and $P(r,c-1)$ respectively.
:::

::: math proof Proof
Every path to $(r,c)$ ends with a step from $(r-1,c)$ or from $(r,c-1)$, because those are the only cells from which a rightward or a downward step enters $(r,c)$. A path whose last step is downward is obtained uniquely by appending that step to a path counted by $P(r-1,c)$, provided the last step does not enter a blocked cell, which is excluded by the convention that $P$ is $0$ on blocked cells. The two classes are disjoint, because a path has exactly one last step, so their sizes add. $\square$
:::

::: math invariant Invariant
After the outer loop has processed the first $r$ rows, the table entry $D(r,c)$ equals the number of valid paths from the origin to $(r,c)$, taken modulo $m$, for every column $c$ of those rows. The base case holds because the only path to the origin is the empty path, and the step from row $r-1$ to row $r$ preserves the invariant by the lemma, since the two predecessor entries are already correct.
:::

## Algorithm derivation

The table is filled in row-major order, so that when a cell is processed both of its predecessors have already been filled.

```python
def count_paths(grid, mod=10**9 + 7):
    n, m = len(grid), len(grid[0])
    dp = [0] * m
    for r in range(n):
        for c in range(m):
            if grid[r][c]:
                dp[c] = 0
            elif r == 0 and c == 0:
                dp[c] = 1
            else:
                from_above = dp[c]
                from_left = dp[c - 1] if c > 0 else 0
                dp[c] = (from_above + from_left) % mod
    return dp[m - 1]
```

The table is compressed to one row. Before the cell $(r,c)$ is written, `dp[c]` still holds the value for $(r-1,c)$ and `dp[c-1]` already holds the value for $(r,c-1)$, because the inner loop has moved past it. That single observation is the whole memory optimization, and it is why the space is $O(m)$ rather than $O(nm)$.

The blocked cell resets the entry to zero. This is the line that is most often forgotten, and the symptom is a path that walks through a wall.

The modulus is applied to the addition. Because the two operands are already reduced, their sum is less than $2m$, and the reduction is one comparison and one subtraction in the common case.

## Step-by-step execution

Take a $4 \times 4$ grid with the cells $(1,2)$ and $(2,1)$ blocked. A dot is a free cell and an `X` is a blocked one.

```
. . . .
. . X .
. X . .
. . . .
```

The table of $P(r,c)$ is filled one row at a time.

**Row $r = 0$.** The only move available along the top row is rightward, so each cell has exactly one path to it. The cell $(0,0)$ is $1$ because the empty path counts as one path, and $(0,1)$, $(0,2)$ and $(0,3)$ are each $1$.

|       | $c=0$ | $c=1$ | $c=2$ | $c=3$ |
| ----- | ----- | ----- | ----- | ----- |
| $r=0$ | 1     | 1     | 1     | 1     |

**Row $r = 1$.** The cell $(1,0)$ takes its value from above, so it is $1$. The cell $(1,1)$ is $P(0,1) + P(1,0) = 1 + 1 = 2$. The cell $(1,2)$ is blocked, so it is $0$. The cell $(1,3)$ is $P(0,3) + P(1,2) = 1 + 0 = 1$.

|       | $c=0$ | $c=1$ | $c=2$ | $c=3$ |
| ----- | ----- | ----- | ----- | ----- |
| $r=1$ | 1     | 2     | 0     | 1     |

**Row $r = 2$.** The cell $(2,0)$ is $P(1,0) = 1$. The cell $(2,1)$ is blocked, so it is $0$. The cell $(2,2)$ is $P(1,2) + P(2,1) = 0 + 0 = 0$, because both ways into it are blocked. The cell $(2,3)$ is $P(1,3) + P(2,2) = 1 + 0 = 1$.

|       | $c=0$ | $c=1$ | $c=2$ | $c=3$ |
| ----- | ----- | ----- | ----- | ----- |
| $r=2$ | 1     | 0     | 0     | 1     |

**Row $r = 3$.** The cell $(3,0)$ is $P(2,0) = 1$. The cell $(3,1)$ is $P(2,1) + P(3,0) = 0 + 1 = 1$. The cell $(3,2)$ is $P(2,2) + P(3,1) = 0 + 1 = 1$. The cell $(3,3)$ is $P(2,3) + P(3,2) = 1 + 1 = 2$.

|       | $c=0$ | $c=1$ | $c=2$ | $c=3$ |
| ----- | ----- | ----- | ----- | ----- |
| $r=3$ | 1     | 1     | 1     | 2     |

The answer is $2$. The path that goes all the way right along the top row and then down the rightmost column survives, and so does the path that goes down the leftmost column and then right along the bottom row. Every other route passes through one of the two blocked cells, which is why the two blocked cells are so effective in such a small grid.

## Correctness proof

::: math theorem Theorem
The counting dynamic program computes, for every cell, the number of valid paths to that cell modulo the modulus, and in particular the number of valid paths from the origin to the target.
:::

::: math proof Proof
The invariant is the statement in the panel above.

**Initialization.** Before the first row is processed, the table is all zeros, and the cell $(0,0)$ is set to $1$, which is the number of paths from the origin to itself: the empty path. Every other cell of the first row takes its value from the cell to its left, so the invariant holds for the first row.

**Maintenance.** Suppose the invariant holds for the first $r$ rows. Consider a cell $(r,c)$ of row $r$ that is not blocked and is not the origin. By the lemma, the paths to $(r,c)$ partition into those arriving from above and those arriving from the left, and their counts are $D(r-1,c)$ and $D(r,c-1)$. Both values are the residues of the true counts, by the invariant, because row $r-1$ has been processed and the cell $(r,c-1)$ of the current row has already been written. The update stores $(D(r-1,c) + D(r,c-1)) \bmod m$, which by the compatibility of reduction with addition is the residue of the true count. A blocked cell is set to zero, which is the correct count because no path may enter it, and the invariant is preserved.

**Termination.** When the last row has been processed, the invariant says that the entry for the target cell is the residue of the number of valid paths to it, which is the answer the problem asks for. $\square$
:::

## Complexity analysis

Let $S$ be the number of states and $T$ the cost of computing one transition.

- **Time:** $O(S \cdot T)$. For the grid, $S = nm$ and $T = 1$, so the time is $O(nm)$.
- **Auxiliary space:** $O(S)$ for the full table and $O(\lvert\text{one dimension}\rvert)$ when the table is compressed to a rolling array. For the grid that is $O(m)$.
- **Bitmask states:** when the state is a subset of $k$ items, the table has $2^k$ entries and the same $O(S \cdot T)$ bound applies with $S = 2^k$.

The space term is where the modulus earns its keep. Without a modulus, each entry of the grid table holds a count with up to $2(n+m)$ bits, and the table of $nm$ such entries does not fit. With a modulus, each entry is one word and the table fits comfortably.

The time term is where the state size earns its keep. A bitmask state of $k$ items gives $2^k$ states, so $k = 20$ gives a million states and $k = 30$ gives a billion, which is too many. When the number of steps is the large parameter instead, the table is too long and the answer is a matrix power, which is in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count the paths on a grid with blocked cells | The row-major table |
| Count the paths on an unblocked grid | The binomial coefficient, which is $O(\min(n,m))$ |
| Count the paths when $n$ and $m$ are up to $10^{18}$ | [Matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) |
| Count the subsets with a given sum | A table indexed by the sum, which is a [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| Count the arrangements of a multiset | A table indexed by the counts of each value |
| Count the bit strings with $k$ ones and no two adjacent | A table indexed by the position and the number of ones |
| Count the strings avoiding a pattern | A table indexed by the prefix length, with the [KMP](/algorithms/strings/kmp) automaton as the state |
| Count the ways to place $k$ non-attacking rooks | A table indexed by the row, with a bitmask of the used columns |
| Count the solutions of a linear equation | [Stars and bars](/algorithms/combinatorics/stars-and-bars) |

The second row is the one that saves the most time when it applies, and it applies more often than people expect. Whenever the constraints are all absent, the count is a binomial coefficient, and no table is needed.

## Recursion decision

The recursive formulation with memoization is the natural way to discover the recurrence, and it is usually the wrong way to implement it.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; a grid of $10^5$ rows exceeds the depth of the grid, which is the real limit |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative, and a $1000 \times 1000$ grid overflows the limit at once |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The depth of the recursive formulation is the depth of the grid, which is the number of rows. A $1000 \times 1000$ grid needs $1000$ frames, which is exactly the Python limit, and any taller grid overflows it. A $10^5$-row grid needs $10^5$ frames, which overflows the stack in C++ and Java as well.

The iterative form has no such limit, and it is also faster: the recursive form pays for a call and a dictionary lookup on every state, while the iterative form pays for an array index. The memoized recursion is worth writing once, as a way to find the recurrence, and then replacing.

The one case where the recursion is genuinely better is when the state graph is a tree and the number of states is small, because then the table itself is the recursion's call stack and there is nothing to allocate.

## Implementation walkthrough

Four lines carry the whole algorithm.

```python
if grid[r][c]:
    dp[c] = 0
elif r == 0 and c == 0:
    dp[c] = 1
else:
    from_above = dp[c]
    from_left = dp[c - 1] if c > 0 else 0
    dp[c] = (from_above + from_left) % mod
```

The first line resets a blocked cell. Without it, the count flows through the wall.

The second line sets the origin to one. The count of paths to the origin is the empty path, and a program that leaves it at zero reports zero for every grid, which is the classic symptom.

The third line reads `dp[c]` as the count from above. This is correct only because the inner loop runs left to right and has not yet written `dp[c]` for the current row. Reversing the inner loop breaks the algorithm silently, because then `dp[c]` holds a value from the current row and `dp[c-1]` holds one from two rows back.

The fourth line is the reduction. It is applied to the sum, not to the operands, because the operands are already reduced by the previous iterations.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Leaving the origin at zero | Every count is zero | Set the origin to one |
| Not resetting a blocked cell | Paths flow through walls | Zero the entry for a blocked cell |
| Reading `dp[c-1]` at $c = 0$ | An out-of-bounds access, or a silent wraparound in C++ | Guard the left edge, or use a table with a zero column |
| Forgetting the modulus | The count overflows, or the table does not fit | Reduce after every addition |
| Assuming the count depends only on the position | The count is wrong when the constraints depend on the history | Include everything the constraints depend on in the state |
| Iterating the inner loop right to left | The table holds values from the wrong row | Run the inner loop left to right |
| Using `int` for a modulus of $10^9+7$ | The sum of two residues overflows an `int` | Use a 64-bit type for the sum |
| Computing a huge table for an unblocked grid | The program is too slow for no reason | Use the binomial coefficient |

### Why this fails: the state that forgets what the constraints remember

The plausible wrong approach is to keep the state as small as possible, because a small state means a small table. For the grid, the smallest state that seems to work is the cell, and the cell is right when the only constraints are walls and the allowed directions. The tempting next step is to shrink the state further, to "just the row", on the theory that the column cannot matter.

The smallest counterexample to a row-only state is a grid where two cells of the same row are treated differently by the constraints. Take a $2 \times 2$ grid in which the cell $(1,1)$ is blocked:

```
. .
. X
```

The two cells of the bottom row, $(1,0)$ and $(1,1)$, have different counts, namely $1$ and $0$, and a row-only state assigns them the same value. The row-only table computes $P(1,1) = P(0,1) + P(1,0) = 1 + 1 = 2$, while the correct answer is $0$, because every path to $(1,1)$ must enter it and it may not be entered.

The mistake is not the row-only state itself, which is wrong for a more basic reason: the count to a cell is not a function of the row at all. The deeper version of the same error is the state that is right in form but wrong in the update, which is the case where the blocked cell is not reset. Then the table keeps the state as the cell, which is correct, and still returns the wrong count, because the value left in the entry for the blocked cell belongs to the row above.

The lesson generalizes: **a state is correct exactly when two partial configurations with the same state have the same number of valid completions.** When that holds, the counts can be added; when it does not, the table silently merges two different problems.

## Variants and extensions

- **Exactly $k$ of something.** Add the count to the state. A table indexed by the position and by the number of ones used is the standard formulation, and the extra dimension multiplies the state count by $k$.
- **Rolling the modulus over the state.** When the state is a bitmask and the constraint is local, the state can be reduced to the last few positions, which is what makes a $2^{20}$ state space feasible.
- **The KMP automaton as the state.** A count of strings avoiding a pattern uses the automaton state, which is one of $m$ states for a pattern of length $m$, and the transition table is the failure function. See [KMP](/algorithms/strings/kmp).
- **Counting with a modulus and no inverse.** A counting dynamic program needs no division, which is why it works under a composite modulus where the multiplicative formula in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients) does not.
- **The matrix power.** When the number of steps is the large parameter, the same recurrence becomes a matrix power, and the table becomes a $d \times d$ matrix where $d$ is the number of state values rather than the number of states. See [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).
- **Counting under a modulus that is not prime.** The reduction works under any modulus, because addition is compatible with reduction under any modulus.
- **Counting the first occurrence.** A state that also records whether the pattern has been seen yet is the standard way to count the strings in which it appears exactly once.

## Contest strategy

1. Write the state down before writing any code, and check that two configurations with the same state really do have the same number of valid completions.
2. Write the recurrence on paper, with the base cases, and check the base cases by hand on the smallest input.
3. Decide the modulus before writing the arithmetic, and check the largest intermediate product. With a modulus of $10^9+7$ the sum of two residues fits in a 64-bit integer; with a modulus near $2^{63}$ it does not.
4. Use the rolling array from the start. The full table is rarely needed and the rolling form is not much harder to write.
5. Run the inner loop left to right and say so in a comment, because the algorithm depends on it.
6. Write the brute force first when the input is small. The two should agree on every small case, and a disagreement is a wrong state or a wrong base case.
7. Ask whether the grid has obstacles at all. If it does not, the answer is a binomial coefficient and the table is wasted work.

## Worked problems

### Problem 1: paths on a grid with blocked cells

**Restatement.** A robot moves on an $n \times m$ grid from $(0,0)$ to $(n-1,m-1)$, moving only right or down. Some cells are blocked. Count the paths modulo $10^9 + 7$.

**Naive baseline.** The recursive enumeration, which visits $\binom{n+m-2}{n-1}$ paths and is exponential in practice.

**Insight.** The paths to a cell partition by their last step, so the counts add.

**Derivation.** Fill the table in row-major order, with $P(r,c) = 0$ on blocked cells, $P(0,0) = 1$, and $P(r,c) = P(r-1,c) + P(r,c-1)$ elsewhere, all modulo $10^9+7$.

**Correctness.** The theorem above proves that the table entry for the target is the residue of the true count.

**Complexity.** $O(nm)$ time and $O(m)$ space with the rolling array, or $O(nm)$ space with the full table.

**Common wrong approach.** Forgetting to zero the blocked cells, which lets paths through walls and overcounts by a large factor.

### Problem 2: bit strings with no two adjacent ones

**Restatement.** Count the bit strings of length $n$ with $k$ ones and no two ones adjacent, modulo $10^9+7$, for $n \le 10^6$ and $k \le 1000$.

**Naive baseline.** Enumerating the $\binom{n}{k}$ candidate strings, which is hopeless.

**Insight.** The state is the position and the number of ones used so far, because the constraint only concerns the previous bit. The recurrence counts the strings ending in a zero and the strings ending in a one separately.

**Derivation.** Let $A(i,j)$ be the count of valid strings of length $i$ with $j$ ones. A string ending in $0$ extends any valid string of length $i-1$ with $j$ ones, and a string ending in $1$ must extend one ending in $0$, which is why the recurrence $A(i,j) = A(i-1,j) + A(i-2,j-1)$ holds, with the base cases $A(i,0) = 1$ and $A(0,j) = 0$ for $j > 0$.

**Correctness.** The two classes of strings, ending in $0$ and ending in $1$, partition the valid strings, and the second class is in bijection with the strings of length $i-2$ with $j-1$ ones, because the last two bits must be $01$.

**Complexity.** $O(nk)$ time and $O(k)$ space.

**Common wrong approach.** Using the recurrence $A(i,j) = A(i-1,j) + A(i-1,j-1)$, which is the binomial coefficient and counts the strings with no restriction on adjacency at all.

### Problem 3: many steps

**Restatement.** Count the walks of length exactly $k = 10^{18}$ on a graph with $v \le 200$ vertices, modulo $10^9+7$.

**Naive baseline.** A table indexed by the step, which needs $10^{18}$ entries and never finishes.

**Insight.** The number of walks of length $k$ from $s$ to $t$ is the $(s,t)$ entry of the $k$-th power of the adjacency matrix, and a matrix power is computed by squaring.

**Derivation.** Build the adjacency matrix $A$ of the graph, compute $A^k$ by exponentiation by squaring in $O(v^3 \log k)$ time, and read off the entry.

**Correctness.** The lemma in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) proves that the $(s,t)$ entry of $A^k$ counts the walks of length $k$.

**Complexity.** $O(v^3 \log k)$ time and $O(v^2)$ space. For $v = 200$ and $k = 10^{18}$, that is about $60 \times 8 \times 10^6$ operations, which is a few seconds.

**Common wrong approach.** Iterating the table $k$ times, which is the same recurrence written in the only way that fits in a table, and which takes $10^{18}$ steps.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is a count, write down the state, and check that the state determines the number of valid completions.
2. **Direct application.** Implement the grid table and the rolling array version, and check them against a recursive brute force on every grid up to $5 \times 5$.
3. **Adaptation.** Add a second dimension to the state, such as the number of ones used or the number of steps taken, and write the version that counts strings avoiding a pattern.
4. **Combination.** Combine a counting dynamic program with a bitmask state for a placement problem, and with the [KMP](/algorithms/strings/kmp) automaton for a string problem.
5. **Challenge.** Solve a problem where the number of steps is up to $10^{18}$ and the state space is small, by replacing the table with a matrix power, and check the two answers on small instances.
6. **Transfer.** Recognize the count in another subject: the number of lattice paths, the number of ways to place non-attacking rooks, the number of binary trees, or the number of ways to fill a grid, and see [trees](/algorithms/trees/tree-dp) for the version whose state is a tree.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the criterion a state must satisfy for a counting dynamic program to be correct. (Formal model)
2. Give the recurrence for the grid and prove it by a partition. (Formal model)
3. What invariant does the table maintain, and how is it established and preserved? (Formal model)
4. Why does the rolling array work, and what breaks if the inner loop runs right to left? (Implementation walkthrough)
5. What are the base cases, and what does the program report if the origin is left at zero? (Common mistakes)
6. How large is the state space, and what does the modulus do for the memory? (Complexity analysis)
7. When is the binomial coefficient a better answer than the table? (Algorithm selection)
8. What is the depth of the recursive formulation, and which languages does it overflow in? (Recursion decision)
9. Give the smallest grid on which a blocked cell changes the answer, and the value the buggy program reports. (Common mistakes)
10. Why does the count need no modular inverse, and what does that buy? (Variants and extensions)
11. How is the same recurrence handled when the number of steps is $10^{18}$? (Algorithm selection)
12. What is the largest intermediate value, and why does the type matter? (Implementation walkthrough)

## Further reading

- The dynamic program whose table holds optima rather than counts, and whose answer is usually reported modulo a prime, is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The binomial coefficient that the count reduces to when the grid has no obstacles, and the counting argument behind it, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The arithmetic that keeps a count exact under a modulus, and the inverse that other methods need, are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The matrix power that replaces the table when the number of steps is enormous is in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).
- The automaton state that counts the strings avoiding a pattern is in [KMP](/algorithms/strings/kmp).
- The count of the ways to place identical items into distinct boxes, which is a formula rather than a table, is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The count of the increasing subsequences, which is a table over a different state, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The tree version of the same idea, where the state is a subtree, is in [tree dynamic programming](/algorithms/trees/tree-dp).
- The subject index lists this technique, [counting dynamic programming](/algorithms/combinatorics/counting-dp), beside the rest of the subject: [the combinatorics](/algorithms/combinatorics/).
