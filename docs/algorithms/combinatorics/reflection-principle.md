---
id: combinatorics.reflection-principle
title: The reflection principle
summary: Count the lattice paths from (0,0) to (n,n) that never rise above the diagonal by reflecting the tail of every bad path at its first touch, then evaluate the resulting Catalan number modulo a prime.
division: [gold, platinum]
subjects: [combinatorics]
level: advanced
importance: common-contest-technique
keywords:
    [
        reflection principle,
        andre reflection,
        catalan number,
        lattice paths,
        ballot sequence,
        dyck path,
        first touch,
        bad path bijection,
        modular counting,
    ]
prerequisites:
    required: [combinatorics.binomial-coefficients, number-theory.modular-arithmetic]
    recommended:
        [combinatorics.stars-and-bars, combinatorics.inclusion-exclusion, foundations.complexity]
complexity:
    time: "O(n + log p)"
    space: "O(1)"
assumptions:
    - The path uses only east and north steps, so the only forbidden behavior is a prefix with more north steps than east steps.
    - The boundary is a single straight line, so one reflection accounts for every bad path exactly once.
    - The modulus is the prime 10^9 + 7 and 2n is smaller than it, so every denominator in the binomial product is invertible.
implementations: combinatorics.reflection-principle
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/combinatorics.reflection-principle.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A monotone lattice path from $(0,0)$ to $(n,n)$ uses only east steps $(1,0)$ and north steps $(0,1)$. The path is **ballot-admissible** when every prefix has at least as many east steps as north steps, which is the same as saying that the path never rises above the line $y = x$. The number of admissible paths is the Catalan number $C_n$.

The reflection principle counts them in three moves.

1. Every path has exactly $2n$ steps, $n$ east and $n$ north, so there are $\binom{2n}{n}$ paths in total, with no restriction.
2. A path is bad exactly when it first touches the line $y = x + 1$. Reflect the part of the path **after** that first touch across the line. East becomes north and north becomes east, and the endpoint $(n,n)$ becomes $(n-1,n+1)$. The map is a bijection, so the number of bad paths is the number of unrestricted paths from $(0,0)$ to $(n-1,n+1)$, which is $\binom{2n}{n-1}$.
3. Subtract the bad paths from all paths:
    $$
    C_n = \binom{2n}{n} - \binom{2n}{n-1} = \frac{1}{n+1}\binom{2n}{n}.
    $$

The reflection is a bijection rather than an approximation. The first touch is the part that makes the inverse unique: reflecting the whole bad path instead of its tail loses the constraint and counts too many paths.

The answer is enormous. $C_{10^6}$ has hundreds of thousands of digits, so the problem asks for it modulo $10^9 + 7$. The binomial coefficients are evaluated as products modulo that prime, and the divisions are replaced by multiplications by modular inverses. The whole program is two product loops of length at most $n$, two exponentiations of about thirty squarings each, and one subtraction.

## Problem motivation

A robot stands at the southwest corner of an $n \times n$ grid. It moves one cell east or one cell north at a time and ends at the northeast corner. The robot carries a cargo that must never be lifted above the main diagonal, so after every move its east coordinate is at least its north coordinate. The program has to report the number of routes, modulo $10^9 + 7$.

The constraints are the reason the problem is interesting:

- $n \le 10^6$, so the grid has up to $10^{12}$ vertices.
- The answer is counted modulo the prime $10^9 + 7$, because the exact count does not fit in any fixed-width integer.
- The time limit is one second and the memory limit is 512 MB, so an $O(n^2)$ table of the grid does not fit, even if every entry took one byte.

A dynamic program over the grid is the first correct solution. It fills one row of $n+1$ entries for each of $n+1$ rows, so it costs $O(n^2)$ time and $O(n)$ space. At $n = 10^6$ that is $10^{12}$ additions, which is far beyond one second.

A second baseline enumerates the paths. There are $\binom{2n}{n}$ of them, which is about $4^n / \sqrt{\pi n}$. At $n = 10^6$ that is a number with more than six hundred thousand digits, and the enumeration would need to visit every one of them.

The count has a closed form, and the closed form is what the reflection principle supplies. The rest of the problem is arithmetic: produce the closed form modulo a prime without ever forming a factorial that overflows.

The same count appears under several disguises. A valid bracket sequence is a path where `(` is east and `)` is north, and the balance never goes negative. A ballot count is a path where one candidate never trails the other. A stack-sortable permutation and a triangulation of a convex polygon are counted by the same Catalan number. Recognizing the disguised grid is often the hardest step.

## Recognition patterns

The reflection principle is the right tool when the statement contains one of these phrases:

- "Never rises above the diagonal", "stays on one side of the line", "does not cross the boundary".
- "For every prefix", "at every moment", "the balance is never negative".
- "A ballot", "an election", "one candidate never trails".
- "A valid bracket sequence", "balanced parentheses", "a well-formed sequence".
- "The first time it touches", "the first crossing", "count the paths that avoid".
- "Catalan number", "Dyck path", "stack-sortable".

The structural conditions matter more than the words:

| Situation | What it rules in or out |
| --- | --- |
| One straight forbidden boundary, steps swap under reflection | Reflection applies directly |
| A boundary parallel to a grid line, steps do not swap | Reflect the endpoint instead, or use a rotation |
| Two parallel boundaries | Reflect repeatedly; the images form an alternating sum |
| Two non-parallel boundaries | The reflection group is finite but the sum is longer; use the method of images |
| Obstacles or blocked cells inside the grid | Reflection does not apply; use a dynamic program |
| More than one kind of step with different weights | Count with generating functions or a dynamic program |
| The boundary depends on the path's history | Reflection does not apply |
| Only the numerical answer is needed, $n \le 10^6$ | Product form and a modular inverse |

The technique requires that the forbidden region be the mirror image of something countable. A single line does that because reflecting a point across the line is an involution and it exchanges the two step directions. Two lines can still be handled, because reflecting across either line generates a small group, but the images overlap and the count becomes an alternating sum. A path-dependent boundary has no such group, and the dynamic program is the honest answer.

## Naive approach

The first baseline is the grid dynamic program. Let `dp[i][j]` be the number of admissible paths from `(0,0)` to `(i,j)`, with `dp[i][j] = 0` when `j > i`. Every admissible path to `(i,j)` arrives either from `(i-1,j)` or from `(i,j-1)`, so

$$
dp[i][j] = dp[i-1][j] + dp[i][j-1],
\qquad dp[0][0] = 1.
$$

Only one row of the table is needed, because row $i$ depends only on row $i-1$:

```python
def count_paths(n):
    row = [0] * (n + 1)
    row[0] = 1
    for i in range(n + 1):
        for j in range(1, i + 1):
            row[j] += row[j - 1]
    return row[n]
```

The loop never writes `row[j]` for `j > i`, which is how the diagonal constraint enters: an entry above the diagonal stays zero and can never contribute. The two-dimensional version is the same recurrence with an explicit table, and it is easier to read but uses $O(n^2)$ memory.

The cost is $O(n^2)$ time. At $n = 10^6$ the inner loop runs about $5 \cdot 10^{11}$ times. Even if the compiler vectorized the addition, the program would need minutes, and the judge allows one second.

The second baseline enumerates the paths:

```python
from itertools import combinations

def enumerate_paths(n):
    count = 0
    for north in combinations(range(2 * n), n):
        north = set(north)
        east = 0
        height = 0
        ok = True
        for step in range(2 * n):
            if step in north:
                height += 1
            else:
                east += 1
                height -= 1
            if height > 0:
                ok = False
                break
        count += ok
    return count
```

This is correct and it is useful as a reference on small inputs, but it costs exactly the number of paths it is counting. The point of the subject is to stop paying that cost.

A third baseline computes the Catalan recurrence $C_{n+1} = \sum_{i=0}^{n} C_i C_{n-i}$ with exact integers. It is also correct, and it is even slower: the integers grow to hundreds of thousands of digits, so each multiplication is no longer a machine operation.

## Key insight

The insight is that **every bad path has a first touch, and the part after that touch can be reflected to turn the bad path into an unrestricted path to a different endpoint**.

Take a path from $(0,0)$ to $(n,n)$ that rises above the diagonal. Since it starts on the diagonal and ends on it, and since the steps change the height $y - x$ by $+1$ or $-1$, the first time it goes above the diagonal it must land exactly on the line $y = x + 1$. Call that vertex the **first touch**.

The first touch has two useful properties:

- The prefix before it stays on or below the diagonal. That is what "first" means.
- It lies on the mirror line, so reflecting the suffix across the line leaves the prefix and the touch point unchanged.

Reflect the suffix across $y = x + 1$. The reflection swaps the two step directions: an east step becomes a north step and a north step becomes an east step. The reflected suffix still has the same length, so the whole reflected path has $2n$ steps, but its endpoint is now

$$
(n,n) \longmapsto (n-1, n+1).
$$

A path from $(0,0)$ to $(n-1,n+1)$ has $n-1$ east steps and $n+1$ north steps. There are $\binom{2n}{n-1}$ such paths, and the reflection is a bijection, so that is exactly the number of bad paths.

The inverse is the same reflection. Start with any path from $(0,0)$ to $(n-1,n+1)$. It begins below the line $y = x + 1$ and ends above it, so it has a first vertex on the line. Reflect the suffix after that vertex; the endpoint returns to $(n,n)$, and the prefix is still below the line. The two maps undo each other, so no bad path is counted twice and no good path is counted at all.

A small example makes the map concrete. For $n = 2$, the path with steps `N E E N` reaches $(0,1)$ first, which is the first touch. Reflecting the remaining `E E N` gives `N N E`, so the image is `N N N E`, ending at $(1,3)$. The path `E N N E` first touches at $(1,2)$; reflecting its last `E` gives `N`, so the image is `E N N N`, also ending at $(1,3)$.

## Visual intuition

The reflection is a fold of the grid along the forbidden line. The prefix is the part that already happened and cannot change. The suffix is the part that is folded over, and the fold exchanges the two directions.

For $n = 2$ there are six paths. Two stay on or below the diagonal, and four are bad:

| Steps     | First touch | Stays admissible? |
| --------- | ----------- | ----------------- |
| `E E N N` | none        | yes               |
| `E N E N` | none        | yes               |
| `E N N E` | $(1,2)$     | no                |
| `N E E N` | $(0,1)$     | no                |
| `N E N E` | $(0,1)$     | no                |
| `N N E E` | $(0,1)$     | no                |

The four bad paths correspond to the four paths from $(0,0)$ to $(1,3)$, which are exactly the strings with one `E` and three `N`s. The count is therefore $6 - 4 = 2$.

The counts grow row by row, and the gap between the total column and the bad column is the answer.

| $n$ | Total paths | Bad paths | Admissible paths |
| --- | ----------- | --------- | ---------------- |
| 0   | 1           | 0         | 1                |
| 1   | 2           | 1         | 1                |
| 2   | 6           | 4         | 2                |
| 3   | 20          | 15        | 5                |
| 4   | 70          | 56        | 14               |
| 5   | 252         | 210       | 42               |
| 6   | 924         | 792       | 132              |

The shape of the table is the shape of the proof: the total column is a binomial coefficient, the bad column is the neighboring binomial coefficient, and the difference is the Catalan number in the last column.

## Formal model

Let a **lattice path** be a sequence of vertices $v_0, v_1, \ldots, v_{2n}$ with $v_0 = (0,0)$, and with each difference $v_t - v_{t-1}$ equal to either $(1,0)$ or $(0,1)$. The path is **monotone** because both steps increase a coordinate.

Define the **height** of a vertex $(x,y)$ as $h = y - x$. The diagonal is the line $h = 0$, and the forbidden line is $h = 1$.

::: math definition Definition
A path from $(0,0)$ to $(n,n)$ is **admissible** when $h(v_t) \le 0$ for every $t$. It is **bad** when some $t$ has $h(v_t) = 1$. A **first touch** of a bad path is the smallest $t$ with $h(v_t) = 1$.
:::

::: math definition Definition
The **reflection** across the line $y = x + 1$ is the map

$$
\sigma(x,y) = (y-1, x+1).
$$

It is an involution: $\sigma(\sigma(x,y)) = (x,y)$. It fixes every point of the line and exchanges the two step directions, $\sigma((x,y)+(1,0)) = \sigma(x,y)+(0,1)$.
:::

::: math theorem Reflection bijection
For every $n \ge 0$, the bad monotone paths from $(0,0)$ to $(n,n)$ are in bijection with the monotone paths from $(0,0)$ to $(n-1,n+1)$.
:::

::: math theorem Catalan count
The number of admissible paths from $(0,0)$ to $(n,n)$ is

$$
C_n = \binom{2n}{n} - \binom{2n}{n-1} = \frac{1}{n+1}\binom{2n}{n}.
$$
:::

The generalized version, which is the form that solves ballot and offset problems, is worth stating separately.

::: math theorem Generalized ballot
Let $a \ge b \ge 0$. The number of monotone paths from $(0,0)$ to $(a,b)$ that stay on or below the diagonal is

$$
\binom{a+b}{b} - \binom{a+b}{b-1},
$$

with the convention that the second term is $0$ when $b = 0$.
:::

For $a = b = n$ this is the Catalan count. For $a = b + k$ it is the ballot theorem: one candidate finishes $k$ votes ahead and never trails.

There is also a modular form. Let $p = 10^9 + 7$, and let $\operatorname{inv}(x)$ denote the multiplicative inverse of $x$ modulo $p$, which exists for every $x \not\equiv 0 \pmod p$ because $p$ is prime. Then

$$
C_n \bmod p = \left(\binom{2n}{n} \bmod p\right) \cdot \operatorname{inv}(n+1) \bmod p.
$$

The product form is what the programs use for each binomial coefficient, so the only inverse is the one for the factorial in the denominator.

## Algorithm derivation

### Step 1: count all paths

A path from $(0,0)$ to $(n,n)$ has $n$ east steps and $n$ north steps, in some order. Choosing which of the $2n$ positions hold the east steps determines the path, so the total is $\binom{2n}{n}$.

### Step 2: identify the bad paths

A bad path has a first vertex with $h = 1$. That vertex exists because the path starts at $h = 0$, ends at $h = 0$, and uses steps that change $h$ by exactly $1$ or $-1$. The first time $h$ is positive, it is exactly $1$.

### Step 3: reflect the suffix

Reflect every vertex after the first touch across $y = x + 1$. The prefix and the touch point stay fixed, and every later step changes direction. The endpoint $(n,n)$ becomes $(n-1,n+1)$, so the image is a path from $(0,0)$ to $(n-1,n+1)$.

### Step 4: prove the map is a bijection

The inverse map is the same reflection applied to the suffix after the first touch of a path to $(n-1,n+1)$. Every such path must touch the line, because it starts below and ends above. The prefix before the touch is unchanged, and the reflected endpoint is $(n,n)$.

### Step 5: subtract

The number of bad paths is the number of paths to $(n-1,n+1)$:

$$
\binom{2n}{n-1}.
$$

Therefore

$$
C_n = \binom{2n}{n} - \binom{2n}{n-1}.
$$

### Step 6: evaluate modulo the prime

The program computes the two binomial coefficients modulo $p$ and subtracts. A binomial coefficient is evaluated as a product of $k$ terms over a product of $k$ terms:

$$
\binom{N}{K} \equiv \left(\prod_{i=0}^{K-1}(N-i)\right) \cdot \left(\prod_{i=0}^{K-1}(i+1)\right)^{-1} \pmod p.
$$

The pseudo-code is short enough to keep in view:

```text
read n
total = binom(2 * n, n)
bad   = binom(2 * n, n - 1)
print (total - bad + MOD) mod MOD

binom(N, K):
    if K < 0 or K > N: return 0
    K = min(K, N - K)
    num = 1
    den = 1
    for i = 0 to K - 1:
        num = num * (N - i) mod MOD
        den = den * (i + 1) mod MOD
    return num * pow(den, MOD - 2) mod MOD
```

The `min(K, N - K)` line is the symmetry $\binom{N}{K} = \binom{N}{N-K}$. For the total it does nothing, because $K = n$ and $N-K = n$. For the bad term it matters: $K = n-1$ and $N-K = n+1$, so the loop runs $n-1$ times. The guard `K < 0` is what handles $n = 0$, where the bad term is $\binom{0}{-1} = 0$.

The exponentiation by squaring computes the inverse by Fermat's little theorem: for a prime $p$ and an $x$ not divisible by $p$, $x^{p-2} \equiv x^{-1} \pmod p$.

### Step 7: the Catalan shortcut

The subtraction form and the division form are the same number. The division form uses one binomial coefficient and one extra inverse:

$$
C_n \equiv \binom{2n}{n} \cdot \operatorname{inv}(n+1) \pmod p.
$$

It runs $n$ product iterations instead of $2n$, so it is about twice as fast. The programs use the subtraction form because it is the direct statement of the reflection principle, and the difference between $n$ and $2n$ iterations at $n = 10^6$ is negligible.

## Step-by-step execution

### A small case by hand

For $n = 3$:

1. The total is $\binom{6}{3} = 20$.
2. The bad count is $\binom{6}{2} = 15$.
3. The answer is $20 - 15 = 5$.

The five admissible paths are `E E E N N N`, `E E N E N N`, `E E N N E N`, `E N E E N N`, and `E N E N E N`. Every other ordering of three `E`s and three `N`s touches $y = x + 1$.

### The binomial loops

Computing $\binom{6}{3}$ modulo $p = 10^9 + 7$:

| Step    | `num`              | `den`           |
| ------- | ------------------ | --------------- |
| start   | 1                  | 1               |
| $i = 0$ | $1 \cdot 6 = 6$    | $1 \cdot 1 = 1$ |
| $i = 1$ | $6 \cdot 5 = 30$   | $1 \cdot 2 = 2$ |
| $i = 2$ | $30 \cdot 4 = 120$ | $2 \cdot 3 = 6$ |

The inverse of $6$ modulo $10^9 + 7$ is $166666668$, because $6 \cdot 166666668 = 1000000008 = 10^9 + 7 + 1$. Then $120 \cdot 166666668 \equiv 20 \pmod p$.

Computing $\binom{6}{2}$:

| Step    | `num`            | `den` |
| ------- | ---------------- | ----- |
| start   | 1                | 1     |
| $i = 0$ | $1 \cdot 6 = 6$  | 1     |
| $i = 1$ | $6 \cdot 5 = 30$ | 2     |

The inverse of $2$ is $500000004$, and $30 \cdot 500000004 \equiv 15 \pmod p$. The answer is $20 - 15 = 5$.

### The edge case $n = 0$

For $n = 0$, the total is $\binom{0}{0} = 1$ and the bad term is $\binom{0}{-1} = 0$. The answer is $1$, which is the empty path. The guard `K < 0` is what makes this work; without it, the loop would have to iterate a negative number of times.

### The large case

For $n = 10^6$, each binomial loop does about one million iterations and two million multiplications, each inverse costs about thirty squarings, and the output is $70646122$. The program never stores a table, so its memory use is constant.

## Correctness proof

::: math lemma Lemma (first touch)
Every bad path from $(0,0)$ to $(n,n)$ has exactly one first touch, and that vertex lies on $y = x + 1$.
:::

::: math proof Proof
The height starts at $0$ and ends at $0$. A bad path has a vertex with positive height. Let $t$ be the smallest index with $h(v_t) > 0$. The previous vertex has $h(v_{t-1}) \le 0$, and one step changes the height by exactly $1$ or $-1$, so $h(v_t) = h(v_{t-1}) + 1 \le 1$. Combined with $h(v_t) > 0$, this gives $h(v_t) = 1$. The index $t$ is unique because it is the smallest one. $\square$
:::

::: math lemma Lemma (reflection is a bijection)
The suffix reflection is a bijection from the bad paths to $(n,n)$ onto all paths to $(n-1,n+1)$.
:::

::: math proof Proof
Let $P$ be a bad path and let $v_t$ be its first touch. Reflect every vertex $v_s$ with $s \ge t$ by $\sigma$. The prefix $v_0, \ldots, v_t$ is unchanged, and the reflected suffix starts at $v_t$ because $\sigma$ fixes the line. The concatenation is a path from $(0,0)$ to $\sigma(n,n) = (n-1,n+1)$.

Conversely, let $Q$ be a path from $(0,0)$ to $(n-1,n+1)$. Its height starts at $0$ and ends at $(n+1)-(n-1) = 2$, so it has a first vertex $w$ with height $1$. Reflect the suffix of $Q$ after $w$. The prefix of $Q$ before $w$ has height at most $0$, and the reflected suffix starts at $w$, so the result is a path to $\sigma(n-1,n+1) = (n,n)$ whose first touch is $w$. The two constructions are inverse because $\sigma$ is an involution and the first touch is preserved. $\square$
:::

::: math theorem Theorem (bad count)
The number of bad paths from $(0,0)$ to $(n,n)$ is $\binom{2n}{n-1}$.
:::

::: math proof Proof
By the bijection lemma, the bad paths are in bijection with the paths from $(0,0)$ to $(n-1,n+1)$. Such a path has $(n-1)$ east steps and $(n+1)$ north steps, for a total of $2n$ steps. Choosing which $n-1$ of the $2n$ positions are east determines it, so there are $\binom{2n}{n-1}$ of them. $\square$
:::

::: math theorem Theorem (Catalan count)
The number of admissible paths from $(0,0)$ to $(n,n)$ is $\binom{2n}{n} - \binom{2n}{n-1}$, which equals $\binom{2n}{n}/(n+1)$.
:::

::: math proof Proof
Every path is either admissible or bad, and the two classes are disjoint. The total is $\binom{2n}{n}$ and the bad count is $\binom{2n}{n-1}$, so the admissible count is their difference.

For the division form, use the ratio

$$
\frac{\binom{2n}{n-1}}{\binom{2n}{n}}
= \frac{n!\,n!}{(n-1)!\,(n+1)!}
= \frac{n}{n+1}.
$$

Therefore

$$
\binom{2n}{n} - \binom{2n}{n-1}
= \binom{2n}{n}\left(1 - \frac{n}{n+1}\right)
= \frac{\binom{2n}{n}}{n+1}.
$$

The value is an integer because it counts paths, even though the expression contains a division. $\square$
:::

::: math theorem Theorem (modular evaluation)
For $p = 10^9 + 7$ and $0 \le n \le 10^6$, the program returns $C_n \bmod p$.
:::

::: math proof Proof
The loop computes

$$
\text{num} \equiv \prod_{i=0}^{K-1}(N-i) \equiv \frac{N!}{(N-K)!} \pmod p,
\qquad
\text{den} \equiv K! \pmod p.
$$

Every factor of $\text{den}$ is at most $K \le 2n < p$, so no factor is divisible by $p$ and $\text{den} \not\equiv 0 \pmod p$. Fermat's little theorem gives $\text{den}^{p-2} \equiv \text{den}^{-1} \pmod p$, so the returned value is $\binom{N}{K} \bmod p$. Applying this to $N = 2n$ with $K = n$ and $K = n-1$, then subtracting modulo $p$, gives the Catalan number modulo $p$. $\square$
:::

::: math invariant Invariant
After iteration $i$ of the binomial loop, $\text{num} \equiv N(N-1)\cdots(N-i+1) \pmod p$ and $\text{den} \equiv i! \pmod p$.
:::

## Complexity analysis

| Method | Time | Space | Requirement |
| --- | --- | --- | --- |
| Enumeration | $\binom{2n}{n}$ | $O(1)$ | Nothing, but it never finishes at $n = 10^6$ |
| Grid dynamic program | $O(n^2)$ | $O(n)$ with one row | The grid must fit in memory |
| Reflection, factorial arrays | $O(n)$ | $O(n)$ | The arrays must fit in memory |
| Reflection, product form | $O(n + \log p)$ | $O(1)$ | The modulus is prime and $2n < p$ |
| Catalan shortcut | $O(n + \log p)$ | $O(1)$ | The modulus is prime and $n+1 < p$ |

The product form is the one the implementations use. It performs at most $4n$ multiplications for the two binomial coefficients, plus the two exponentiations, each about thirty squarings and a few selected multiplications. At $n = 10^6$ that is roughly four million modular multiplications, which is comfortable in every language in the encyclopedia.

The space bound is the surprising part. A program that fills factorials up to $2n$ needs about $16$ MB for 64-bit entries or $8$ MB for 32-bit entries, which is affordable, but it is not necessary. The product form keeps two running residues, so it uses a constant number of words no matter how large $n$ is. The only price is that each binomial coefficient is recomputed from scratch, which the $2n$ bound already accounts for.

The $\log p$ term is about $30$ squarings per inverse, because $p - 2 < 2^{30}$. If the modulus were a 61-bit prime, the same code would need about $61$ squarings, and the product of two residues would no longer fit in a signed 64-bit integer. That is the point at which a 128-bit intermediate or a `mulmod` routine becomes necessary.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Paths from $(0,0)$ to $(n,n)$ that stay on or below $y = x$ | Reflection, giving $C_n$ |
| Paths from $(0,0)$ to $(a,b)$ with $a \ge b$ that stay on or below $y = x$ | Generalized ballot, $\binom{a+b}{b} - \binom{a+b}{b-1}$ |
| A boundary $y = x + k$ with $k > 0$ | Shift the line and use the generalized ballot with $b - k - 1$ |
| A strict boundary, where touching is also forbidden | Move the line by one and recount |
| A fixed prefix of a bracket sequence | Check the prefix, then count the remaining suffix with the generalized ballot |
| Two parallel forbidden lines | Reflect across both; the images alternate, so the count is an alternating sum |
| Obstacles or blocked cells | Dynamic programming over the grid |
| Weighted steps or a generating function | Coefficient extraction, not reflection |
| Only the numerical value and $n$ small | The Catalan recurrence or the grid dynamic program |
| $n$ large and the modulus is prime with $2n < p$ | Product form plus a Fermat inverse |
| $2n \ge p$ | Lucas's theorem or a factorial table with care; the simple inverse may not exist |

The first row is the subject of this article. The second row is the version that most contest statements actually use, because the two candidates rarely have exactly the same number of votes. The fifth row is the version with a prefix, which is the shape of the second CSES problem in the worked examples.

## Reference implementations

The manifest publishes one `program` variant per language, and all six solve exactly the stated problem: read one integer $n$ with $0 \le n \le 10^6$, and print $C_n \bmod (10^9 + 7)$ on one line.

| Language | File | Implementation note |
| --- | --- | --- |
| C | `c/program.c` | `long long` products and a Fermat inverse |
| C++17 | `cpp17/program.cpp` | `std::int64_t` with the same product form |
| Java | `java/Main.java` | `long` products and a buffered reader |
| Python | `python/program.py` | `pow(den, MOD - 2, MOD)` for the inverse |
| Pascal | `pascal/program.pas` | `Int64` plus a doubling `MulMod`, because pas2js maps `Int64` to a double-precision number |
| JavaScript | `javascript/program.js` | `Number` for the small products and a doubling `mulMod` for the inverse |

The C, C++, and Java versions can multiply two residues directly, because $(10^9+6)^2 \approx 10^{18}$ is below the signed 64-bit maximum of about $9.22 \cdot 10^{18}$. The Python version has arbitrary-precision integers and does not care. The Pascal and JavaScript versions cannot: their `Int64` or `Number` arithmetic is exact only below $2^{53} \approx 9 \cdot 10^{15}$, so the exponentiation uses a doubling multiplication where every intermediate is below $2 \cdot 10^9$.

The main product loops are safe in all six languages because one factor is at most $2n \le 2 \cdot 10^6$ and the other is a residue below $10^9 + 7$. Their product is below $2.1 \cdot 10^{15}$, which is still exact in a double. Only the inverse needs the slower multiplication.

The input and output contract is the same everywhere: whitespace-separated integers, the first token is $n$, one line of output, and a trailing newline. The Pascal version reads with one argument per `Read` call, which is what the repository's pas2js console unit supports.

## Recursion decision

The reflection principle is a bijection, not a recursive decomposition, so the final program has no recursion at all. There are only two loops: one for each binomial coefficient, and the exponentiation loop inside the inverse.

The grid dynamic program can be written recursively, with a call for each vertex. Its depth is $2n$, and without memoization it visits every path. With memoization it visits every vertex, which is $O(n^2)$ states, and the stack still has depth $2n$. Neither version is competitive with the closed form.

| Language | Practical recursion depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative, since $n$ can be $10^6$ |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative |
| Pascal | The operating system stack, and pas2js has its own limit | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The iterative product loop also has a better constant factor: it touches two variables and never allocates a frame. For $n = 10^6$, the difference is not academic.

## Implementation walkthrough

Three lines decide whether the answer is correct.

```c
num = num * (n - i) % MOD;              /* residue times a factor at most 2n */
den = den * (i + 1) % MOD;              /* the factorial in the denominator */
answer = (total - bad + MOD) % MOD;     /* normalize after the subtraction */
```

**Multiplying before reducing.** The multiplication and the reduction are one expression, and the product is below $2.1 \cdot 10^{15}$. If the factor were a second full residue instead of a number at most $2n$, the product would exceed $2^{53}$ in JavaScript and Pascal, and the result would be silently rounded.

**The final subtraction.** In C, C++, and Java, `(total - bad) % MOD` can be negative when the residue of the total is smaller than the residue of the bad count. Adding `MOD` before the final reduction keeps the result in $[0, \text{MOD})$. In Python the `%` operator already returns a non-negative value, but the same expression is used for uniformity. In JavaScript the `%` operator can return a negative value, so the addition is required there too.

**The absent term.** The bad count is $\binom{2n}{n-1}$, and for $n = 0$ the lower index is $-1$. The binomial function must return $0$ for a negative lower index rather than entering a loop with a negative bound. Every language in the manifest has that guard.

**The modulus type.** `1000000007` fits in a signed 32-bit integer, but every product must be formed in 64-bit arithmetic. In C and C++ the constant is written with an `LL` suffix or as `std::int64_t`. In Java the constant is a `long` literal with `L`. In Pascal the constant is an untyped integer constant and the surrounding expressions are `Int64`. In JavaScript every number is a double, which is why the product bound matters.

**The inverse.** Fermat's little theorem gives the inverse as `pow(den, MOD - 2, MOD)`. The exponent has about thirty bits, so the loop runs thirty times. Each squaring is a multiplication of two residues, which is the only place where the 64-bit product bound can be exceeded.

**The output.** One line, one number, a newline. No trailing space. The six programs agree byte for byte on every fixture.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Printing $\binom{2n}{n}$ without subtracting the bad paths | The answer is the total, not the Catalan number | Subtract $\binom{2n}{n-1}$ |
| Reflecting the whole bad path instead of its suffix | The image count is too large, and the answer can become $0$ | Reflect only the part after the first touch |
| Subtracting a bad term with the wrong lower index | The count is off by a binomial coefficient | For $a = b = n$, the bad term is $\binom{2n}{n-1}$ |
| Forgetting `+ MOD` before the final reduction | A negative residue is printed | Normalize into $[0, \text{MOD})$ |
| Dividing by $n+1$ with integer division | The residue is not the Catalan number | Multiply by the modular inverse |
| Multiplying two residues in JavaScript or Pascal | The product exceeds $2^{53}$ and is rounded | Use a doubling `mulMod` for the inverse |
| Treating the boundary as strict | Paths that touch the diagonal are wrongly removed | Decide whether "above" means $h = 1$ or $h = 0$ |
| Using Catalan$(n/2)$ for an odd bracket length | The answer should be $0$ | Check parity first |
| Indexing the grid from $1$ in the DP | The first row and column are mishandled | Use a $(n+1) \times (n+1)$ table and seed `dp[0][0]` |
| Forgetting the $n = 0$ case | The bad binomial receives a negative index | Return $0$ for $K < 0$ |

### Why this fails: reflecting the whole path

The most tempting wrong proof says: "Reflect the entire bad path across $y = x + 1$. The start $(0,0)$ becomes $(-1,1)$ and the end $(n,n)$ becomes $(n-1,n+1)$, so the bad paths are counted by the paths from $(-1,1)$ to $(n-1,n+1)$." That count is $\binom{2n}{n}$, because the displacement is $n$ east and $n$ north. Subtracting it from the total gives $0$ for every $n$, which is obviously wrong.

The flaw is that the reflection of the whole path does not preserve the "bad" property in the inverse direction. The image of a bad path is a path from $(-1,1)$ to $(n-1,n+1)$, but not every such path is the image of a bad path. The map is injective but not surjective, so counting the whole target set overcounts.

The smallest counterexample is $n = 2$. There are six paths in total and two admissible paths, so the answer must be $2$. The whole-path reflection produces paths from $(-1,1)$ to $(1,3)$, of which there are $\binom{4}{2} = 6$, and the subtraction gives $6 - 6 = 0$. Reflecting only the suffix produces paths from $(0,0)$ to $(1,3)$, of which there are $\binom{4}{1} = 4$, and $6 - 4 = 2$, which is correct.

The first touch is not a technical detail. It is the part of the construction that makes the target set exactly the image.

### Why this fails: the product that is rounded

The second failure is silent and platform-specific. In JavaScript and in pas2js, an `Int64` is represented by a double-precision number, and a double holds every integer only up to $2^{53}$. The main product loops stay below that bound, but the inverse multiplies two residues and can reach $10^{18}$.

A concrete case: $123456789 \cdot 987654321 = 121932631112635269$. A double rounds the product to $121932631112635260$, which is $9$ too small. The remainder modulo $10^9 + 7$ is then $259106854$ instead of the correct $259106859$. The program prints a plausible number, the sample may still pass, and the error appears only on an input that reaches the large products.

The fix is a doubling multiplication that keeps every intermediate below $2^{53}$:

```text
mulmod(a, b):
    r = 0
    while b > 0:
        if b is odd: r = (r + a) mod MOD
        a = (a + a) mod MOD
        b = b / 2
    return r
```

The additions are below $2 \cdot 10^9$, so they are exact. The loop runs about thirty times per call and is used only inside the exponentiation, so its cost is negligible next to the $2n$ product steps.

### Why this fails: the division that is not a modular division

A third failure replaces the inverse with ordinary integer division. For $n = 17$, the total is $\binom{34}{17} = 2333606220$, whose residue modulo $10^9 + 7$ is $333606206$. Dividing that residue by $18$ gives $18533678$, but the Catalan number is $129644790$. The integer division is exact as a division of integers, and it is still wrong, because the residue is not the number being divided. Modular division means multiplication by an inverse, and nothing else.

## Variants and extensions

- **The offset boundary.** For paths from $(0,0)$ to $(a,b)$ that stay on or below $y = x + k$, reflect across $y = x + k + 1$. The bad term becomes $\binom{a+b}{b-k-1}$, with a guard that returns $0$ when the index is negative or the endpoint is already above the boundary.
- **The strict boundary.** If touching the line is also forbidden, the boundary moves by one: paths that stay strictly below $y = x$ are paths that stay on or below $y = x - 1$, and the generalized ballot theorem applies after the shift. The endpoint must lie strictly below the line, or the count is $0$.
- **A fixed prefix.** When a prefix of a bracket sequence is given, check that its balance never goes negative. Then start the remaining count at the prefix's balance and use the generalized ballot formula with the remaining numbers of opening and closing brackets.
- **Two parallel boundaries.** Reflect across both lines repeatedly. The images alternate in sign, and the count becomes an alternating sum of binomial coefficients. This is the method of images, and it is the same reflection idea applied to a group of two reflections.
- **Two non-parallel boundaries.** The reflections generate a finite group, and the sum has one term per group element. This is the reflection principle for Weyl chambers, and it is the advanced form of the same theorem.
- **Catalan interpretations.** The same number counts binary trees with $n$ internal nodes, triangulations of a convex $(n+2)$-gon, Dyck words of length $2n$, and stack-sortable permutations of length $n$. A bijection between any two of these transports the reflection argument.
- **The cyclic lemma.** For paths that may start and end anywhere, the number of cyclic shifts that stay above the boundary is proportional to the final height. It is the reflection principle's cousin and is useful when the starting point is not fixed.
- **Weighted paths.** When each step carries a weight, reflection still gives a bijection on the underlying paths, but the weights of a path and its image need not be equal unless the weight is symmetric. Check that symmetry before subtracting weighted counts.

## Contest strategy

1. **Draw the grid.** Mark the start, the end, and the forbidden line. Decide whether the condition is $y \le x$, $y < x$, or $y \le x + k$. Most errors are born in this step.
2. **Count the total.** Without the boundary, the count is a single binomial coefficient. Write it down before thinking about the bad paths.
3. **Find the first touch.** The bad paths are those that reach the forbidden line. The first touch is the unique vertex where the prefix stops being safe.
4. **Reflect the suffix.** Exchange the two step directions after the touch and compute the new endpoint. The target count should be another binomial coefficient.
5. **Check the inverse.** Every path to the reflected endpoint must touch the line exactly once. If the endpoint is already on the forbidden side at the start, the bijection fails and a guard is needed.
6. **Decide how to evaluate.** If $2n$ is below the modulus, use the product form and one Fermat inverse. If not, use Lucas's theorem or a factorial table with the modulus factored out.
7. **Test the boundaries.** Run $n = 0$, $n = 1$, and a value where the modular residues wrap. Compare against the grid dynamic program for every $n \le 10$.

## Worked problems

### Problem 1: bracket sequences of a given length

**Restatement.** Given a length $n$, count the valid bracket sequences of length $n$ modulo $10^9 + 7$. A sequence is valid when every prefix has at least as many opening brackets as closing brackets, and the total numbers are equal. This is CSES Bracket Sequences I.

**Naive baseline.** Enumerate all $2^n$ strings of brackets and test each one. At $n = 10^6$ the enumeration is hopeless, and even the $O(n^2)$ grid dynamic program is too slow.

**Insight.** Map `(` to an east step and `)` to a north step. A prefix with more closing than opening brackets is a prefix above the diagonal, so when $n$ is even the valid sequences are exactly the admissible paths from $(0,0)$ to $(n/2,n/2)$, and the count is $C_{n/2}$.

**Derivation.** The total is $\binom{n}{n/2}$ and the bad count is $\binom{n}{n/2-1}$, so the answer is their difference. If $n$ is odd, the numbers of opening and closing brackets cannot be equal, and the answer is $0$.

**Correctness.** The bracket-to-path map is a bijection: every bracket sequence of length $n$ is a path of $n$ steps, and the prefix balance is the negative of the height. The reflection theorem then counts the paths that never go above the diagonal.

**Complexity.** $O(n + \log p)$ time and $O(1)$ space, with $p = 10^9 + 7$.

**Common wrong approach.** Computing $C_n$ instead of $C_{n/2}$. The input is the length of the string, not the number of pairs, so the index is halved.

### Problem 2: bracket sequences with a prefix

**Restatement.** Given a length $n$ and a prefix of length $k$, count the valid bracket sequences of length $n$ that begin with that prefix. This is CSES Bracket Sequences II. The prefix may already be invalid.

**Naive baseline.** Try every completion of the remaining $n-k$ positions. That is $2^{n-k}$ candidates, which is impossible at $n = 10^6$.

**Insight.** If $n$ is odd, the numbers of opening and closing brackets cannot agree, so the answer is $0$. Otherwise walk the prefix and track its balance. If the balance ever becomes negative, or if the prefix uses more than $n/2$ opening or closing brackets, the answer is $0$. The remaining suffix is a path from height $b$ to height $0$ that must never go below $0$.

**Derivation.** Let $O$ be the number of opening brackets still available and $C$ the number of closing brackets still available. The number of suffixes that stay non-negative is

$$
\binom{O+C}{O} - \binom{O+C}{O+b+1},
$$

where $b$ is the prefix balance. The second term is the reflection of the suffixes that first reach balance $-1$.

**Correctness.** The reflection is the same first-touch bijection, translated so that the start height is $b$. The reflected start becomes $-b-2$, and counting the paths from there gives the second binomial coefficient.

**Complexity.** $O(n + \log p)$ time and $O(1)$ space, plus the pass over the prefix.

**Common wrong approach.** Skipping the prefix validation and subtracting the reflected term from a negative balance. The formula assumes $b \ge 0$; a negative balance means the prefix is already invalid and the answer is $0$.

### Problem 3: white and black balls

**Restatement.** Given $N$ white balls, $M$ black balls, and an integer $K$, count the arrangements in a row such that every prefix has at most $K$ more white balls than black balls, modulo $10^9 + 7$. This is AtCoder ABC205 E.

**Naive baseline.** Enumerate the $\binom{N+M}{N}$ arrangements and test every prefix, which is exponential in the length.

**Insight.** Map a white ball to an east step and a black ball to a north step. The condition $w_i \le b_i + K$ says that the path stays on or above the line $y = x - K$, or equivalently that it never touches $y = x - K - 1$. If $N > M + K$, every arrangement violates the condition and the answer is $0$.

**Derivation.** The total is $\binom{N+M}{N}$. Reflect the prefix up to the first touch of $y = x - K - 1$; the start moves to $(K+1, -K-1)$, and the reflected paths have $N-K-1$ east steps among $N+M$. The bad count is therefore $\binom{N+M}{N-K-1}$, and the answer is the difference.

**Correctness.** The reflection is an involution between the bad arrangements and the paths from the shifted start. The guard $N \le M + K$ ensures that the endpoint is on the allowed side, so every path that touches the line has a unique first touch and the bijection is exact.

**Complexity.** $O(N+M+\log p)$ time and $O(1)$ space.

**Common wrong approach.** Forgetting the guard. When $N > M + K$, the formula can produce a negative number, because the reflected set is larger than the set of all paths.

## Practice progression

1. **Recognition.** Given a statement, decide whether the boundary is one line, whether the steps swap under reflection, and whether the condition is strict or non-strict.
2. **Direct application.** Implement the grid dynamic program and the reflection formula, and compare them for every $n \le 10$.
3. **Adaptation.** Solve the offset boundary $y \le x + k$ and the strict boundary, and check the guard conditions on small grids.
4. **Combination.** Add a fixed prefix to the bracket problem and derive the remaining-count formula from the generalized ballot theorem.
5. **Generalization.** Handle two parallel boundaries with the method of images and check the alternating signs against a dynamic program.
6. **Transfer.** Recognize the same count in a tree, a triangulation, or a permutation, and decide whether reflection or a bijection is the shorter proof. Where the count must be reduced, use [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the total number of monotone paths from $(0,0)$ to $(n,n)$ and the number of steps in such a path. (At a glance)
2. What is a first touch, and why does it lie exactly on $y = x + 1$? (Formal model)
3. Describe the reflection of the suffix and the endpoint it produces. (Key insight)
4. Why is the reflection a bijection, and what is its inverse? (Correctness proof)
5. Why is the bad count $\binom{2n}{n-1}$ rather than $\binom{2n}{n+1}$? Are the two equal? (Formal model)
6. Derive the identity $\binom{2n}{n} - \binom{2n}{n-1} = \binom{2n}{n}/(n+1)$. (Correctness proof)
7. Why does the reflection fail if it is applied to the whole path instead of the suffix? (Common mistakes)
8. What condition makes the Fermat inverse valid, and what breaks when $2n \ge p$? (Complexity analysis)
9. Why can JavaScript and Pascal not multiply two residues directly, and what replaces the multiplication? (Implementation walkthrough)
10. How does the answer change when the input length is odd, and how does the offset boundary change the bad term? (Worked problems, Variants and extensions)

## Further reading

- The binomial coefficient, its product form, and the modular inverse that this article uses are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The arithmetic of residues, Fermat's little theorem, and the inverse are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The stars-and-bars bijection is the counting argument behind the generalized ballot formula, and it is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The alternating sums that handle two boundaries are the same tool as [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion).
- The Catalan generating function and its coefficient extraction are in [generating functions](/algorithms/combinatorics/generating-functions).
- The dynamic program that counts paths on a grid, and the one-row optimization, is the subject of [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) and its grid relatives.
- The enumeration that the closed form replaces is in [backtracking](/algorithms/enumeration/backtracking).
- The same first-touch argument appears in string matching as the failure function of [KMP](/algorithms/strings/kmp), where a prefix is reused after a mismatch.
- The discrete mathematics behind the bijection and the Catalan recurrence is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index lists this technique, [the reflection principle](/algorithms/combinatorics/reflection-principle), beside the other counting arguments in [the combinatorics](/algorithms/combinatorics/).
