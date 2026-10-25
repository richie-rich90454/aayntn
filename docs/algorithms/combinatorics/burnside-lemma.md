---
id: combinatorics.burnside-lemma
title: Burnside's lemma
summary: Count the necklaces with n beads and k colors up to rotation by averaging the colorings that each rotation leaves fixed, grouping the rotations by gcd, and replacing the division by n with a modular inverse.
division: [silver, gold]
subjects: [combinatorics]
level: intermediate
importance: common-contest-technique
keywords:
    [
        burnside's lemma,
        orbit counting,
        necklaces,
        bracelets,
        rotations,
        group action,
        fixed points,
        euler totient,
        modular inverse,
        cycle index,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic, number-theory.euler-totient]
    recommended: [combinatorics.binomial-coefficients, foundations.complexity]
complexity:
    time: "O(sqrt(n) * (sqrt(n) + log n))"
    space: "O(1)"
assumptions:
    - Two necklaces are equal exactly when one is a rotation of the other, so the group is the cyclic group of order n and reflections are not counted.
    - The bead count satisfies 1 <= n <= 1000000, so n is smaller than the prime modulus and has a modular inverse.
    - A rotation fixes a coloring exactly when the coloring is constant on every cycle of the rotation.
implementations: combinatorics.burnside-lemma
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/combinatorics.burnside-lemma.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A necklace is a circular string of $n$ beads, each painted with one of $k$ colors. Two necklaces are the same when a rotation of the circle turns one into the other. The question is how many different necklaces exist.

The naive count is $k^n$, the number of colorings of $n$ labeled positions. That count is wrong, because a coloring and its rotations are the same necklace. Dividing $k^n$ by $n$ is also wrong, because a symmetric coloring has fewer than $n$ distinct rotations. The all-one-color necklace is the extreme case: it is one coloring, and all $n$ rotations of it are the same coloring.

Burnside's lemma replaces the division by an average over the rotations themselves:

$$
\text{necklaces}(n,k)
= \frac{1}{n}\sum_{r=0}^{n-1} k^{\gcd(n,r)}
= \frac{1}{n}\sum_{d \mid n} \varphi(d)\, k^{n/d}.
$$

| Quantity | Value |
| --- | --- |
| Objects being counted | The $k^n$ colorings of $n$ labeled positions |
| Symmetry group | The $n$ rotations, which form the cyclic group $C_n$ |
| Fixed colorings of a rotation by $r$ | $k^{\gcd(n,r)}$ |
| Grouped form | One term per divisor of $n$, weighted by Euler's totient |
| Time | $O(\sqrt{n} \ast (\sqrt{n} + \log n))$ with trial-division totients |
| Space | $O(1)$ |
| Modular division | Multiply by $n^{p-2}$ modulo the prime $p$ |

The first equality is the lemma. The second is a grouping of the rotations by the value of $\gcd(n,r)$, and it is the form the programs use, because it visits one rotation per divisor of $n$ instead of all $n$ rotations.

The count is enormous: $k^n$ has about $n\log_{10}k$ digits, which is nine million digits at $n = 10^6$ and $k = 10^9$. The problem therefore asks for the answer modulo $10^9 + 7$. The sum is computed modulo that prime, and the division by $n$ becomes a multiplication by the inverse of $n$. The inverse exists because $n \le 10^6 < 10^9 + 7$.

## Problem motivation

A workshop makes necklaces from $n$ beads and $k$ available colors. The beads are identical except for their color, and a necklace has no clasp, so rotating the finished necklace does not produce a new product. The catalog has to list the number of distinct products.

The constraints are what make the problem interesting:

- $n \le 10^6$, so the necklace can have a million beads.
- $k \le 10^9$, so the number of raw colorings is astronomical.
- The answer is reported modulo $10^9 + 7$, because the exact count does not fit in any fixed-width integer.
- The time limit is one second, so an $O(n)$ loop is acceptable in C++ but an $O(n^2)$ loop is not.

The first baseline enumerates the $k^n$ colorings and puts each one in canonical form. It is correct, and it is hopeless: at $n = 20$ and $k = 3$ there are already $3^{20} \approx 3.49 \times 10^9$ colorings, and the real constraints are a million beads.

The second baseline divides $k^n$ by $n$. It is the formula most people write first, and it fails on the smallest symmetric examples. Take $n = 4$ and $k = 2$. There are $2^4 = 16$ colorings and four rotations, so the division predicts $4$ necklaces. The correct answer is $6$: the six necklaces are `0000`, `0001`, `0011`, `0101`, `0111`, and `1111`. The prediction is two short, and the shortfall comes from the colorings whose orbits are shorter than four.

The failure is structural rather than arithmetic. A coloring with a period of two has only two distinct rotations, not four, so orbits can have different sizes. Burnside's lemma is the statement that averaging the number of fixed colorings over the group counts the orbits anyway, without ever grouping the colorings into orbits.

The second difficulty is the modulus. The average contains a division by $n$, and a residue cannot be divided as an ordinary integer. The division has to become a multiplication by the modular inverse of $n$, which exists because the modulus is prime and $n$ is smaller than it.

## Recognition patterns

Burnside's lemma is the right tool when the statement contains some of these phrases.

- "How many different necklaces", "how many distinct circular arrangements", "beads on a ring".
- "Two arrangements are the same if one can be rotated into the other", "up to rotation", "cyclic shifts are considered equal".
- "Colorings of the vertices of a regular polygon", "a cycle of $n$ positions".
- "How many ways to paint a cube", "the faces of a cube may be rotated".
- "How many grids are the same after a quarter turn", "the board may be rotated".
- "The answer may be large", "modulo $10^9 + 7$", together with a symmetry condition.

The structural conditions decide which group is being averaged:

| Situation | What it means |
| --- | --- |
| Rotations of a cycle only | The group is $C_n$, with $n$ elements, and the divisor form applies directly |
| Rotations and reflections | The group is dihedral, with $2n$ elements; reflections need their own fixed counts |
| A square grid under quarter turns | The group has four rotations, and each rotation fixes a different number of cells |
| A cube under rotations | The group has 24 elements in five cycle types |
| A labeled string with no symmetry | Burnside is unnecessary; the answer is $k^n$ |
| Reflections allowed but the statement says "necklace" | Read carefully: a necklace is usually rotations only, a bracelet adds reflections |
| The modulus shares a factor with the group size | The inverse does not exist; divide exactly before reducing |
| Colors are limited per bead or must all appear | The fixed count is no longer a pure power; use a cycle index or a dynamic program |

The last two rows are the ones that produce wrong answers rather than crashes. "Necklace" and "bracelet" are not synonyms in contest statements, and a modulus of $30000$ is not prime, so the inverse of $n$ may not exist.

## Naive approach

The baseline enumerates every coloring and canonicalizes it.

```python
def canonical(colors):
    rotations = [colors[i:] + colors[:i] for i in range(len(colors))]
    return min(rotations)


def count_necklaces(n, k):
    seen = set()
    for code in range(k ** n):
        colors = []
        value = code
        for _ in range(n):
            colors.append(value % k)
            value //= k
        seen.add(canonical(tuple(colors)))
    return len(seen)
```

The canonical form is the lexicographically smallest rotation. Every orbit contributes exactly one canonical form, so the size of the set is the number of necklaces. The cost is $k^n$ colorings, and each one builds $n$ rotations of length $n$, so the canonicalization alone is $\Theta(n^2 k^n)$.

The second baseline is the direct Burnside sum over all $n$ rotations:

```python
from math import gcd

def count_necklaces(n, k):
    total = 0
    for r in range(n):
        total += k ** gcd(n, r)
    return total // n
```

This is correct, and it is the reference implementation for the divisor form. Its cost is $O(n \log n)$ modular multiplications, because each of the $n$ terms needs a power. At $n = 10^6$ that is about twenty million multiplications, which is fast enough in C++ but wasteful when the same value of $\gcd(n,r)$ repeats.

The third baseline is the wrong one: $k^n / n$. It is not an approximation of the answer; it is a different quantity. For $n = 4$ and $k = 2$ it returns $4$ while the answer is $6$, and for $n = 6$ and $k = 2$ it gives $64/6 \approx 10.67$, whose integer part is $10$, while the answer is $14$. The error grows as the necklaces become more symmetric.

## Key insight

The insight is that **counting orbits is the same as averaging fixed points over the group**.

Instead of asking "how many necklaces are there", ask a question that is easy for one symmetry at a time: "how many colorings does this rotation leave unchanged?" The average of those answers is the number of necklaces.

For a rotation by $r$ positions, draw an arrow from each position to the position it moves to. Following the arrows partitions the $n$ positions into cycles. A coloring is fixed by the rotation exactly when every position in a cycle has the same color, because the rotation moves it to another position and the color must not change. If the rotation has $c$ cycles, each cycle can choose its color independently, so the number of fixed colorings is $k^c$.

The number of cycles of a rotation by $r$ is $\gcd(n,r)$. The positions are the residues modulo $n$, and adding $r$ repeatedly visits the residue class of the starting position modulo $g = \gcd(n,r)$. There are $g$ residue classes modulo $g$, and each class is one cycle of length $n/g$.

Substituting into Burnside's lemma gives the necklace formula:

$$
\text{necklaces}(n,k) = \frac{1}{n}\sum_{r=0}^{n-1} k^{\gcd(n,r)}.
$$

For $n = 4$ and $k = 2$, the four rotations have $\gcd$ values $4, 1, 2, 1$, so the fixed counts are $16, 2, 4, 2$. The average is

$$
\frac{16 + 2 + 4 + 2}{4} = \frac{24}{4} = 6,
$$

which is the correct count.

The second insight is that the sum can be grouped. The value $\gcd(n,r)$ is always a divisor $g$ of $n$, and the number of rotations with $\gcd(n,r) = g$ is $\varphi(n/g)$. Writing $d = n/g$ turns the sum into

$$
\sum_{d \mid n} \varphi(d)\, k^{n/d}.
$$

The sum now has one term per divisor of $n$. For $n = 10^6$ there are 49 divisors, so the loop is thousands of times shorter than the direct sum.

The third insight is the modular one. The integer sum is divisible by $n$ because it counts orbits, but its residue modulo $p$ need not be divisible by $n$. The division must therefore happen in the field of residues: multiply by $n^{-1} \equiv n^{p-2} \pmod p$. This is legal because $p = 10^9 + 7$ is prime and $n < p$.

## Visual intuition

Take four positions around a circle, labeled $0, 1, 2, 3$, and two colors. The four rotations act as follows.

| Rotation | Mapping | Cycles | Fixed colorings |
| --- | --- | --- | --- |
| $0$ | identity | $\{0\}, \{1\}, \{2\}, \{3\}$ | $2^4 = 16$ |
| $1$ | $0 \to 1 \to 2 \to 3 \to 0$ | $\{0,1,2,3\}$ | $2^1 = 2$ |
| $2$ | $0 \leftrightarrow 2$, $1 \leftrightarrow 3$ | $\{0,2\}, \{1,3\}$ | $2^2 = 4$ |
| $3$ | $0 \to 3 \to 2 \to 1 \to 0$ | $\{0,1,2,3\}$ | $2^1 = 2$ |

The identity fixes everything. Each quarter-turn fixes only the two monochromatic colorings, because every bead must have the same color. The half-turn fixes the four colorings that are constant on each opposite pair, which are `0000`, `0101`, `1010`, and `1111`.

The average is $(16 + 2 + 4 + 2)/4 = 6$. The six orbits are represented by

```text
0000   0001   0011   0101   0111   1111
```

The representative `0011` stands for the four colorings `0011`, `0110`, `1100`, and `1001`. The representative `0101` stands for `0101` and `1010`, an orbit of size two. The two monochromatic necklaces have orbit size one.

The same table for $n = 6$ and $k = 2$ has six rotations with $\gcd$ values $6, 1, 2, 3, 2, 1$:

| $r$             | $0$  | $1$ | $2$ | $3$ | $4$ | $5$ |
| --------------- | ---- | --- | --- | --- | --- | --- |
| $\gcd(6,r)$     | $6$  | $1$ | $2$ | $3$ | $2$ | $1$ |
| fixed colorings | $64$ | $2$ | $4$ | $8$ | $4$ | $2$ |

The sum is $84$, and $84/6 = 14$. Grouping by divisors gives the same sum:

| $d$ | $\varphi(d)$ | $k^{6/d}$  | term |
| --- | ------------ | ---------- | ---- |
| $1$ | $1$          | $2^6 = 64$ | $64$ |
| $2$ | $1$          | $2^3 = 8$  | $8$  |
| $3$ | $2$          | $2^2 = 4$  | $8$  |
| $6$ | $2$          | $2^1 = 2$  | $4$  |

The grouped table is the shape of the program: four rows instead of six, and only 49 rows at $n = 10^6$.

## Formal model

Let $[k] = \{0, 1, \ldots, k-1\}$ be the set of colors, and let $X = [k]^n$ be the set of colorings of $n$ labeled positions. Let $G = C_n = \mathbb{Z}/n\mathbb{Z}$ be the cyclic group of rotations. The rotation $r$ acts on a coloring $x$ by

$$
(r \cdot x)_i = x_{(i-r) \bmod n}.
$$

Two colorings are equivalent when they are in the same orbit of this action, and a necklace is an orbit.

::: math definition Definition
For a group $G$ acting on a set $X$ and an element $g \in G$, the **fixed-point set** is

$$
\operatorname{Fix}(g) = \{x \in X : g \cdot x = x\}.
$$

The **orbit** of $x$ is $G \cdot x = \{g \cdot x : g \in G\}$, and the set of orbits is written $X/G$.
:::

::: math theorem Burnside's lemma
Let a finite group $G$ act on a finite set $X$. Then

$$
\lvert X/G \rvert = \frac{1}{\lvert G \rvert}\sum_{g \in G}\lvert \operatorname{Fix}(g) \rvert.
$$
:::

::: math proof Proof
Count the pairs $(g,x)$ with $g \cdot x = x$ in two ways.

By grouping the pairs by $g$, the number of pairs is $\sum_{g} \lvert \operatorname{Fix}(g) \rvert$.

By grouping the pairs by $x$, the number is $\sum_{x} \lvert \operatorname{Stab}(x) \rvert$, where $\operatorname{Stab}(x) = \{g : g \cdot x = x\}$.

The orbit-stabilizer theorem says $\lvert G \rvert = \lvert \operatorname{Stab}(x) \rvert \ast \lvert G \cdot x \rvert$ for every $x$. On one orbit $O$, the sum of the stabilizer sizes is therefore

$$
\sum_{x \in O}\lvert \operatorname{Stab}(x) \rvert
= \sum_{x \in O}\frac{\lvert G \rvert}{\lvert O \rvert}
= \lvert G \rvert.
$$

Summing over the orbits gives $\lvert G \rvert \ast \lvert X/G \rvert$. Equating the two counts and dividing by $\lvert G \rvert$ proves the lemma. $\square$
:::

::: math lemma Lemma (cycles of a rotation)
The permutation of the $n$ positions induced by a rotation through $r$ positions has exactly $\gcd(n,r)$ cycles, each of length $n/\gcd(n,r)$.
:::

::: math proof Proof
Let $g = \gcd(n,r)$. The positions visited from a starting position $i$ are $i, i+r, i+2r, \ldots$ modulo $n$. The first repeat is the smallest $t > 0$ with $t r \equiv 0 \pmod n$, which is $t = n/g$. So every cycle has length $n/g$, and there are $n/(n/g) = g$ cycles. $\square$
:::

::: math lemma Lemma (divisor grouping)
For every $n \ge 1$,

$$
\sum_{r=0}^{n-1} k^{\gcd(n,r)}
= \sum_{d \mid n}\varphi(d)\, k^{n/d}.
$$
:::

::: math proof Proof
Group the rotations by the value $g = \gcd(n,r)$. For a fixed divisor $g$ of $n$, write $r = g s$ with $0 \le s < n/g$. Then $\gcd(n/g, s) = 1$, so the number of such $r$ is $\varphi(n/g)$. Substituting $d = n/g$ and $g = n/d$ gives the right-hand sum. $\square$
:::

::: math theorem Theorem (necklace count)
The number of $k$-color necklaces with $n$ beads up to rotation is

$$
N(n,k) = \frac{1}{n}\sum_{d \mid n}\varphi(d)\, k^{n/d}.
$$
:::

::: math proof Proof
Apply Burnside's lemma to the action of $C_n$ on $[k]^n$. There are $n$ rotations, and the rotation by $r$ fixes $k^{\gcd(n,r)}$ colorings by the cycle lemma. The divisor lemma rewrites the sum, and the division by $n$ is exact because the sum counts the orbits times $n$. $\square$
:::

For the modular version, let $p = 10^9 + 7$. Since $p$ is prime and $1 \le n < p$, the inverse $n^{-1} \equiv n^{p-2} \pmod p$ exists, and

$$
N(n,k) \bmod p
= \left(\sum_{d \mid n}\varphi(d)\, k^{n/d} \bmod p\right) \ast n^{p-2} \bmod p.
$$

The exponent $n/d$ is an integer for every divisor $d$, and $k$ may be reduced modulo $p$ before the powers are taken.

## Algorithm derivation

### Step 1: read the input

Read $n$ and $k$. The contract is $1 \le n \le 10^6$ and $1 \le k \le 10^9$.

### Step 2: enumerate the divisors of n

Every divisor $d$ of $n$ appears exactly once in the pair $\{i, n/i\}$ for some $i \le \sqrt{n}$. The loop

```text
for i = 1 to floor(sqrt(n)):
    if n mod i == 0:
        add the term for d = i
        if i != n / i:
            add the term for d = n / i
```

visits every divisor once. The guard `i != n / i` prevents the square root from being counted twice.

### Step 3: compute Euler's totient

For a divisor $d$, factor it by trial division. Start with `result = d`, and for every prime $q$ that divides $d$, remove all factors of $q$ and apply

$$
\varphi(d) = d \prod_{q \mid d}\left(1 - \frac{1}{q}\right).
$$

In code the product is accumulated as `result -= result / q`, which is integer arithmetic and never overflows because `result <= d <= n`.

### Step 4: add the term for d

The term is

$$
\varphi(d) \ast k^{n/d} \bmod p.
$$

The power is computed by binary exponentiation in $O(\log n)$ multiplications. The totient is at most $n \le 10^6$, and the power is below $p$, so their product is below about $10^{15}$, which fits in a signed 64-bit integer.

### Step 5: divide by n

After the loop, `sum` is the numerator. The answer is

```text
answer = sum * power(n, p - 2) mod p
```

because Fermat's little theorem gives $n^{p-2} \equiv n^{-1} \pmod p$.

The complete pseudo-code is:

```text
read n, k
sum = 0
for i = 1 to floor(sqrt(n)):
    if n mod i == 0:
        sum = (sum + phi(i) * k^(n/i)) mod p
        if i != n / i:
            sum = (sum + phi(n/i) * k^i) mod p
answer = sum * n^(p-2) mod p
print answer
```

The C++ core is short enough to keep in view:

```cpp
std::int64_t sum = 0;
for (std::int64_t i = 1; i * i <= n; ++i) {
    if (n % i != 0) continue;
    sum = (sum + Term(i, n, k)) % kModulo;
    if (i != n / i) {
        sum = (sum + Term(n / i, n, k)) % kModulo;
    }
}
sum = sum * ModPow(n, kModulo - 2) % kModulo;
```

The function `Term(d, n, k)` returns `EulerPhi(d) * ModPow(k, n / d) % kModulo`.

### Step 6: the edge cases

For $n = 1$, the only divisor is $1$, the only term is $k$, and the inverse of $1$ is $1$. Every coloring of a single bead is its own necklace, so the answer is $k$.

For $k = 1$, every power is $1$, and the sum is $\sum_{d \mid n}\varphi(d) = n$, so the answer is $1$. This is the all-one-color necklace, and it is consistent with the orbit picture: the single orbit has size one.

For a prime $n$, the divisors are $1$ and $n$, and the answer is

$$
\frac{k^n + (n-1)k}{n},
$$

which is the primitive necklaces plus the $k$ constant necklaces.

## Step-by-step execution

### The direct sum for n = 4 and k = 3

There are four rotations. Their fixed counts are:

| $r$ | $\gcd(4,r)$ | $3^{\gcd(4,r)}$ |
| --- | ----------- | --------------- |
| $0$ | $4$         | $81$            |
| $1$ | $1$         | $3$             |
| $2$ | $2$         | $9$             |
| $3$ | $1$         | $3$             |

The sum is $81 + 3 + 9 + 3 = 96$, and $96/4 = 24$.

### The divisor form for the same input

The divisors of $4$ are $1$, $2$, and $4$:

| $d$ | $\varphi(d)$ | $n/d$ | $3^{n/d}$ | term |
| --- | ------------ | ----- | --------- | ---- |
| $1$ | $1$          | $4$   | $81$      | $81$ |
| $2$ | $1$          | $2$   | $9$       | $9$  |
| $4$ | $2$          | $1$   | $3$       | $6$  |

The sum is again $96$. The inverse of $4$ modulo $10^9 + 7$ is $250000002$, because

$$
4 \ast 250000002 = 1000000008 = 10^9 + 7 + 1 \equiv 1 \pmod{10^9 + 7}.
$$

Then

$$
96 \ast 250000002 \equiv 24 \pmod{10^9 + 7}.
$$

### n = 6 and k = 2

The divisors are $1, 2, 3, 6$ and the totients are $1, 1, 2, 2$. The terms are $64, 8, 8, 4$, the sum is $84$, and the answer is $84/6 = 14$. In modular arithmetic the last step is $84 \ast 6^{-1}$. The inverse of $6$ is $166666668$, because $6 \ast 166666668 = 1000000008$.

### The edge case n = 1

For $n = 1$, the loop runs with $i = 1$, adds $\varphi(1) \ast k^1 = k$, and stops. The inverse of $1$ is $1$, so the answer is $k \bmod p$. For $k = 10^9$ that is $1000000000$.

### The large case n = 1000000 and k = 2

The factorization $10^6 = 2^6 \ast 5^6$ gives 49 divisors. The totient loop handles each divisor, and the powers are computed in about twenty multiplications each. The program prints $757897407$, which is the count modulo $10^9 + 7$. The exact count has about 301024 digits, so the reduction is not optional.

## Correctness proof

::: math lemma Lemma (orbit-stabilizer)
For a finite group $G$ acting on a set $X$ and an element $x \in X$,

$$
\lvert G \rvert = \lvert \operatorname{Stab}(x) \rvert \ast \lvert G \cdot x \rvert.
$$
:::

::: math proof Proof
The map $g \mapsto g \cdot x$ from $G$ to the orbit $G \cdot x$ is surjective. Two elements $g$ and $h$ have the same image exactly when $g^{-1}h \in \operatorname{Stab}(x)$, so every fiber is a coset of the stabilizer and has size $\lvert \operatorname{Stab}(x) \rvert$. The orbit therefore has $\lvert G \rvert / \lvert \operatorname{Stab}(x) \rvert$ elements. $\square$
:::

::: math theorem Theorem (Burnside, restated)
With the notation above,

$$
\lvert X/G \rvert = \frac{1}{\lvert G \rvert}\sum_{g \in G}\lvert \operatorname{Fix}(g) \rvert.
$$
:::

::: math proof Proof
Count the pairs $(g,x)$ with $g \cdot x = x$. Grouping by $g$ gives $\sum_g \lvert \operatorname{Fix}(g) \rvert$. Grouping by $x$ gives $\sum_x \lvert \operatorname{Stab}(x) \rvert$. By orbit-stabilizer, the contribution of one orbit $O$ is

$$
\sum_{x \in O}\lvert \operatorname{Stab}(x) \rvert
= \sum_{x \in O}\frac{\lvert G \rvert}{\lvert O \rvert}
= \lvert G \rvert.
$$

There are $\lvert X/G \rvert$ orbits, so the pair count is $\lvert G \rvert \ast \lvert X/G \rvert$. Equating the two expressions and dividing by $\lvert G \rvert$ gives the lemma. $\square$
:::

::: math theorem Theorem (program correctness)
For $1 \le n \le 10^6$ and $1 \le k \le 10^9$, the program prints $N(n,k) \bmod 10^9 + 7$.
:::

::: math proof Proof
The divisor loop visits every divisor of $n$ exactly once. For each divisor $d$, the program computes $\varphi(d)$ correctly: trial division finds every prime factor, and the update `result -= result / q` applies the factor $1 - 1/q$ exactly once per distinct prime. It multiplies by $k^{n/d}$ computed by binary exponentiation, which agrees with the mathematical power modulo $p$. The sum is therefore the numerator of the necklace formula modulo $p$.

The final multiplication is by $n^{p-2}$. Since $p$ is prime and $1 \le n < p$, Fermat's little theorem gives $n^{p-2} \equiv n^{-1} \pmod p$, so the multiplication is division by $n$ in the field of residues. The exact integer numerator is divisible by $n$, and reducing before or after the exact division gives the same residue modulo $p$. Therefore the printed value is $N(n,k) \bmod p$. $\square$
:::

::: math invariant Invariant
After the divisor loop has processed every divisor up to the current index, `sum` is congruent modulo $p$ to the sum of $\varphi(d) \ast k^{n/d}$ over the divisors processed so far. In `ModPow`, after each iteration, `result` is congruent to the product of the selected powers of the base, and `base` is congruent to the original base raised to the current bit position.
:::

## Complexity analysis

| Method | Time | Space | Requirement |
| --- | --- | --- | --- |
| Enumerate and canonicalize | $O(n^2 k^n)$ | $O(n k^n)$ | Only for tiny inputs |
| Divide $k^n$ by $n$ | $O(\log n)$ | $O(1)$ | Wrong whenever a coloring has symmetry |
| Direct Burnside sum | $O(n \log n)$ | $O(1)$ | $n$ rotations, each with a power |
| Divisor form, totients by trial division | $O(\sqrt{n} \ast (\sqrt{n} + \log n))$ | $O(1)$ | The modulus is prime and $n < p$ |
| Divisor form, factor $n$ once | $O(\sqrt{n} + \tau(n)\log n)$ | $O(\tau(n))$ | Requires storing the divisors |

The implemented method is the fourth row. The outer loop runs $\lfloor\sqrt{n}\rfloor$ times. Each divisor found costs at most $O(\sqrt{d})$ for the totient and $O(\log n)$ for the power, so the worst-case bound is $O(\sqrt{n} \ast (\sqrt{n} + \log n))$. At $n = 10^6$ the outer loop has 1000 iterations and the largest totient computation has about 1000 divisions, so the real cost is far below the bound.

The number of divisors is the reason the divisor form wins. A number below $10^6$ has at most 240 divisors, and $10^6$ itself has 49. The direct sum would do one million power computations; the divisor form does 49.

The space is constant. The program stores the current divisor, the running sum, and the two arguments of the power. It never stores a table of totients or a table of powers, so the memory does not grow with $n$.

The arithmetic bounds matter in the two languages without exact 64-bit integers. The product $\varphi(d) \ast k^{n/d}$ is below $10^6 \ast (10^9 + 6) \approx 10^{15}$, which is below $2^{53} \approx 9.01 \times 10^{15}$, so it is exact in a JavaScript `Number` and in pas2js `Int64`. The exponentiation multiplies two residues, whose product approaches $10^{18}$, which is not exact in either language, so both use a doubling multiplication instead.

The final inverse costs $O(\log p)$ multiplications, about thirty squarings. That is negligible next to the divisor loop.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Necklaces under rotations only | The cyclic formula, with the divisor grouping |
| Bracelets under rotations and reflections | The dihedral formula, adding the reflection terms |
| A square grid under quarter turns | Burnside over the four rotations, with the fixed-cell count for each |
| A cube under rotations | Burnside over the 24 rotations, grouped by cycle type |
| A general finite symmetry group | Burnside, one fixed count per group element, often a cycle index |
| Colors have limited supplies | A cycle index with a variable per color, or a dynamic program over cycles |
| Only the exact count is needed and $n$ is small | Big integers and the same formula |
| The modulus is not prime | Divide the exact numerator by $n$ before reducing, or work modulo $n p$ |
| The modulus divides the group size | The inverse does not exist; use the exact division or a different modulus |
| $n$ is up to $10^9$ | Factor $n$ and enumerate its divisors; do not loop over the rotations |
| $n$ is up to $10^{18}$ | Factor $n$ with Pollard's rho, then enumerate the divisors |
| The statement says "arrangements in a row" | There is no rotation symmetry; use a linear count |

The first row is the subject of this article. The second row is the most common variant, and it is the one that punishes a reader who treats "necklace" and "bracelet" as synonyms. The eighth row is the trap in problems such as POJ 2154, where the modulus is deliberately composite.

## Reference implementations

The manifest publishes one `program` variant per language, and all six solve the stated problem: read $n$ and $k$, and print the number of necklaces modulo $10^9 + 7$ on one line.

| Language | File | Implementation note |
| --- | --- | --- |
| C | `c/program.c` | `long long` residues, trial-division totient, Fermat inverse |
| C++17 | `cpp17/program.cpp` | `std::int64_t` with the same divisor loop |
| Java | `java/Main.java` | `long` throughout, with a `StringTokenizer` over the input |
| Python | `python/program.py` | `pow(base, exponent, MODULO)` for both the power and the inverse |
| Pascal | `pascal/program.pas` | `Int64` plus a doubling `MulMod`, because pas2js maps `Int64` to a double |
| JavaScript | `javascript/program.js` | `Number` for the small term products and `mulMod` for the exponentiation |

The C, C++, and Java versions can multiply two residues directly, because $(10^9 + 6)^2 \approx 10^{18}$ is below the signed 64-bit maximum of about $9.22 \times 10^{18}$. The Python version has arbitrary-precision integers. The Pascal and JavaScript versions cannot: their `Int64` or `Number` arithmetic is exact only below $2^{53}$, so the exponentiation uses a doubling multiplication where every intermediate stays below $2 \ast (10^9 + 6)$.

The main term $\varphi(d) \ast k^{n/d}$ is safe in all six languages because one factor is at most $10^6$ and the other is a residue below $10^9 + 7$.

The input and output contract is the same everywhere: two whitespace-separated integers, one line of output, and a trailing newline. The Pascal version reads each integer with one argument per `Read` call, which is what the repository's pas2js console unit supports.

## Recursion decision

Burnside's lemma is an average, not a recursive decomposition, so the program has no recursion. There are three loops: the divisor loop, the trial-division loop inside the totient, and the exponentiation loop inside the power.

The divisor loop can be written recursively, with one call per divisor pair. Its depth is the number of divisors, which is at most 240 for $n \le 10^6$, and each call does the same work as one iteration. The iterative version is simpler and allocates no frames.

| Language | Practical recursion depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative, since $n$ can be $10^6$ |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative |
| Pascal | The operating system stack, and pas2js has its own limit | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

A recursive implementation of the direct Burnside sum would have depth $n$, which is a million frames at the largest input. That is the form to avoid even in C++, because the iterative sum is both shorter and faster.

## Implementation walkthrough

Five lines decide whether the answer is correct.

```c
for (i = 1; i * i <= n; ++i) {          /* one divisor pair per iteration */
    if (n % i != 0) continue;
    sum = (sum + term(i, n, k)) % MODULO;
    if (i != n / i) sum = (sum + term(n / i, n, k)) % MODULO;
}
sum = sum * mod_pow(n, MODULO - 2) % MODULO;
```

**The divisor pairing.** The loop bound `i * i <= n` visits the smaller member of every divisor pair. Adding both `i` and `n / i`, with the equality guard, visits every divisor once. At $n = 10^6$, the loop has 1000 iterations and finds 49 divisors.

**The totient.** The update `result -= result / p` is the integer form of multiplying by $1 - 1/p$. It must run after all factors of $p$ have been removed from `remaining`, so that the same prime is not counted twice. The leftover `remaining > 1` is the last prime factor, and it gets the same update.

**The term.** The power is $k^{n/d}$, not $k^d$. The exponent is the number of cycles of a rotation whose gcd with $n$ is $n/d$. Confusing $d$ with $n/d$ is the most common algebraic error, and the two sums agree only when every divisor equals its partner, which happens only for $n = 1$ and $n = 2$.

**The division.** `sum * mod_pow(n, MODULO - 2)` is the modular inverse. Writing `sum / n` divides the residue, which is a different operation. The counterexample in the next section shows how far apart the two answers can be.

**The edge case.** For $n = 1$, the loop adds the term for $d = 1$ and the inverse is $1$, so the answer is $k$. No special branch is needed. For $n = 0$ there is no necklace defined by the formula, so the programs reject it.

**The overflow.** In JavaScript and Pascal, the exponentiation must use the doubling multiplication. The term product is safe, but `base * base` in the power loop is not. The doubling routine keeps every intermediate below $2 \ast 10^9$.

**The output.** One line, one number, a newline. The six programs agree byte for byte on every fixture.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Dividing the residue by $n$ | The answer is unrelated to the necklace count | Multiply by $n^{p-2}$ |
| Using $k^d$ instead of $k^{n/d}$ | The answer is wrong except when $n = 1$ or $n = 2$ | The exponent is the number of cycles, $n/d$ |
| Forgetting the totient weight | The sum counts divisors, not rotations | Each divisor $d$ gets $\varphi(d)$ rotations |
| Counting reflections | The answer is the bracelet count, which is smaller | Read whether the object may be flipped |
| Adding $i$ twice at the square root | The answer is too large when $n$ is a perfect square | Guard with `i != n / i` |
| Computing $\varphi$ before removing all factors | A prime is counted more than once | Remove every factor, then update |
| Using a composite modulus as if it were prime | The inverse may not exist | Divide exactly, or work modulo $n p$ |
| Multiplying two residues in JavaScript or Pascal | The product is rounded | Use a doubling multiplication |
| Looping over all $n$ rotations at $n = 10^9$ | The program never finishes | Enumerate divisors after factoring $n$ |
| Treating a linear arrangement as a necklace | The answer is too small | Decide whether positions wrap around |

### Why this fails: the division that is not a modular division

Take $n = 3$ and $k = 1000$. The exact numerator is

$$
k^3 + 2k = 1000000000 + 2000 = 1000002000,
$$

and the exact answer is $1000002000/3 = 333334000$.

Modulo $10^9 + 7$, the numerator is $1000002000 - 1000000007 = 1993$. An ordinary integer division of that residue by $3$ gives $664$, which is wrong by five orders of magnitude. The correct operation is multiplication by the inverse of $3$, which gives

$$
1993 \ast 333333336 \equiv 333334000 \pmod{10^9 + 7}.
$$

The residue of a quotient is not the quotient of the residues. The division by $n$ must happen in the field, and the field operation is multiplication by the inverse.

### Why this fails: the wrong symmetry group

Take $n = 6$ and $k = 2$. The rotation-only count is $14$. If the program also averages the six reflections, it gets the bracelet count $13$, because the reflection terms are not zero and the group has twice as many elements.

The full dihedral average is

$$
\frac{84 + 3 \ast 16 + 3 \ast 8}{12}
= \frac{84 + 48 + 24}{12}
= \frac{156}{12}
= 13.
$$

The rotation sum is $84$, the three reflections through opposite beads fix $2^4 = 16$ colorings each, and the three reflections through opposite edges fix $2^3 = 8$ each. A necklace problem that mentions rotations only must not include those terms.

### Why this fails: the product that is rounded

In JavaScript and in pas2js, a number is a double, and a double holds every integer only up to $2^{53} \approx 9.01 \times 10^{15}$. The term product is below $10^{15}$ and is safe, but the exponentiation squares residues and reaches $10^{18}$.

A concrete case: $123456789 \ast 987654321 = 121932631112635269$. A double stores the product as a nearby value and prints it as $121932631112635260$. The residue modulo $10^9 + 7$ becomes $259106854$ instead of the correct $259106859$. The program still prints a plausible number, and the sample may still pass.

The fix is the doubling multiplication:

```text
mulmod(a, b):
    r = 0
    while b > 0:
        if b is odd: r = (r + a) mod p
        a = (a + a) mod p
        b = b / 2
    return r
```

The additions are below $2 \ast (10^9 + 6)$, so they are exact. The loop runs about thirty times per call and is used only inside the exponentiation.

## Variants and extensions

- **Bracelets.** When reflections are also identified, the group is dihedral of order $2n$. For an odd $n$, every reflection fixes $k^{(n+1)/2}$ colorings. For an even $n$, $n/2$ reflections fix $k^{n/2+1}$ and $n/2$ fix $k^{n/2}$. Add the reflection sum and divide by $2n$.
- **Grids under quarter turns.** A square grid has four rotations. The identity fixes $2^{n^2}$ colorings, the half-turn fixes $2^{n^2/2}$ or $2^{(n^2+1)/2}$ depending on parity, and the quarter-turns fix $2^{n^2/4}$ or the appropriate count with the center cell. Burnside averages the four.
- **Cubes under rotations.** The rotation group of the cube has 24 elements in five cycle types. A face coloring is fixed by a rotation when it is constant on every cycle, so the fixed count is a product over cycles, not a single power.
- **Pólya enumeration.** When the colors carry weights, replace $k^c$ by the cycle index polynomial evaluated at the color variables. The coefficient of a monomial counts the necklaces with a prescribed number of beads of each color.
- **Primitive necklaces.** A necklace is primitive when its period is exactly $n$. Möbius inversion on the divisor sum gives the primitive count, and the same divisor enumeration computes it.
- **Huge $n$.** When $n$ is up to $10^{18}$, factor it with Pollard's rho, generate the divisors from the factorization, and evaluate the same sum. The totient of each divisor follows from its prime factorization.
- **Composite modulus.** When the modulus is not prime, the inverse of $n$ may not exist. Compute the sum modulo $n p$ and divide by $n$ before reducing, or use exact big integers.
- **Limited color supplies.** When each color may be used only a fixed number of times, the fixed count is no longer $k^c$; it is the number of ways to assign the available counts to the cycles, which is a multinomial coefficient or a dynamic program.
- **Linear arrangements.** When the positions do not wrap around, there is no rotation group, and the answer is $k^n$ or a binomial coefficient, not a Burnside average.

## Contest strategy

1. **Decide what the symmetry is.** Rotations only, rotations and reflections, a square, or a cube. The group determines every term in the sum.
2. **Count the fixed objects for one group element.** For a cycle of $c$ positions, the count is $k^c$. For a cycle type with several cycles, multiply the choices of the cycles.
3. **Write the average.** The answer is the sum of the fixed counts divided by the group size. Do not divide individual orbits by their sizes.
4. **Group equal terms.** For the cyclic group, the fixed count depends only on $\gcd(n,r)$, so group the rotations by gcd and weight each divisor by Euler's totient.
5. **Handle the modulus.** If the modulus is prime and the group size is smaller than it, multiply by the inverse. Otherwise divide exactly before reducing.
6. **Test against brute force.** For $n \le 10$ and $k \le 3$, enumerate the colorings, canonicalize the rotations, and compare the number of orbits with the formula.
7. **Check the edge cases.** $n = 1$, $k = 1$, a prime $n$, a perfect square $n$, and a value where the modular sum wraps past $p$.

## Worked problems

### Problem 1: Color

**Restatement.** Count the necklaces with $N$ beads and $N$ available colors, where rotations are identified, for up to 3500 cases with $N \le 10^9$ and a modulus $P \le 30000$ that is not necessarily prime. This is POJ 2154.

**Naive baseline.** Iterate over all $N$ rotations for each case. At $N = 10^9$ that is a billion terms per case.

**Insight.** The count is

$$
\frac{1}{N}\sum_{d \mid N}\varphi(d)\, N^{N/d} \bmod P.
$$

The divisor form needs only the divisors of $N$, which are at most a few thousand after factoring $N$. The difficulty is the division: $P$ may share a factor with $N$, so $N^{-1}$ may not exist modulo $P$.

**Derivation.** Factor $N$ by trial division, generate the divisors, and evaluate each term with binary exponentiation. Accumulate the sum modulo $N \ast P$, where the sum is a multiple of $N$, then divide by $N$ exactly and reduce modulo $P$.

**Correctness.** Burnside gives the exact integer sum over the divisor terms, and the cycle-count lemma gives the exponent $N/d$. Working modulo $N \ast P$ preserves the residue modulo $P$ and also preserves the divisibility by $N$, so the exact division after the accumulation is legal.

**Complexity.** Factoring $N$ costs $O(\sqrt{N})$ per case, and the divisor sum costs $O(\tau(N)\log N)$. At $N = 10^9$ the trial division has about 31623 iterations, which is fine for 3500 cases.

**Common wrong approach.** Using a Fermat inverse modulo $P$. When $P$ is not prime, or when $P$ divides $N$, the inverse does not exist, and the program either crashes or returns a residue that does not correspond to any integer.

### Problem 2: Cube

**Restatement.** Write a positive integer on each face of a cube so that the six numbers sum to $S$, where two writings are the same when a rotation of the cube maps one to the other. Report the count modulo $998244353$, with $S \le 10^{18}$. This is AtCoder ABC198 F.

**Naive baseline.** A dynamic program over the sum is impossible because $S$ can be $10^{18}$. Even a table of the six face values is out of reach.

**Insight.** The rotation group of the cube has 24 elements in five cycle types on the faces:

| Cycle type                     | Count | Cycle lengths |
| ------------------------------ | ----- | ------------- |
| Identity                       | 1     | $1,1,1,1,1,1$ |
| Quarter-turn about a face axis | 6     | $1,1,4$       |
| Half-turn about a face axis    | 3     | $1,1,2,2$     |
| Turn about a body diagonal     | 8     | $3,3$         |
| Half-turn about an edge axis   | 6     | $2,2,2$       |

A cycle of length $L$ whose faces share the value $v$ contributes $L v$ to the sum. The generating function for one cycle is $x^L + x^{2L} + \cdots = x^L/(1-x^L)$, so each cycle type gives a product of such factors.

**Derivation.** Burnside averages the coefficient of $x^S$ in the five generating functions, weighted by the number of rotations of each type, and divides by 24. Each coefficient is a binomial coefficient or a short sum of them, because the number of cycles is at most six. At $S = 8$ the five coefficients are $21$, $3$, $5$, $0$, and $3$, so the average is $(21 + 18 + 15 + 0 + 18)/24 = 3$, which is the sample output.

**Correctness.** Every rotation fixes exactly the writings that are constant on its cycles, and every writing fixed by a rotation contributes one to the coefficient of $x^S$. Burnside counts the orbits, and the 24 rotations exhaust the rotation group of the cube.

**Complexity.** The classification is constant, and the coefficient extraction is constant time in $S$, so the whole program is $O(1)$ arithmetic operations plus the cost of a few binomial coefficients of small arguments.

**Common wrong approach.** Forgetting the three half-turns about a face axis, or merging them with the quarter-turns. The five cycle types have different counts, and dropping one type gives an answer that is off by a rational factor.

### Problem 3: Necklace of Beads

**Restatement.** Count the bracelets with $n < 24$ beads and three colors, where rotations and reflections are both identified. The input holds several cases and ends with $-1$. This is POJ 1286.

**Naive baseline.** Enumerate $3^n$ colorings for each case, which is about $9.4 \times 10^{10}$ at $n = 23$.

**Insight.** The group is dihedral of order $2n$. The rotation sum is the usual divisor sum, and the reflection sum depends on the parity of $n$.

**Derivation.** For odd $n$, every reflection passes through one bead and one opposite edge, so it fixes $3^{(n+1)/2}$ colorings and there are $n$ reflections. For even $n$, $n/2$ reflections pass through two opposite beads and fix $3^{n/2+1}$ colorings, while $n/2$ pass through two opposite edges and fix $3^{n/2}$. The answer is the sum of the rotation and reflection sums divided by $2n$.

For $n = 4$ and three colors, the rotation sum is $81 + 3 + 9 + 3 = 96$, the reflection sum is $2 \ast 27 + 2 \ast 9 = 72$, and the total is

$$
\frac{96 + 72}{8} = \frac{168}{8} = 21,
$$

which is the sample output.

**Correctness.** The dihedral group consists of the $n$ rotations and the $n$ reflections, and the two cases above exhaust the reflection types. Burnside then counts the orbits.

**Complexity.** $O(n)$ per case with exact integer arithmetic, or $O(\sqrt{n}\log n)$ with the divisor form. Both are trivial at $n < 24$.

**Common wrong approach.** Using the rotation-only formula and reporting $96/4 = 24$ for $n = 4$. The reflections identify additional bracelets, so the correct answer is smaller, $21$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the symmetry is rotations only, rotations and reflections, or a larger group.
2. **Direct application.** Implement the direct Burnside sum and compare it with a brute-force canonicalization for every $n \le 8$ and $k \le 3$.
3. **Divisor grouping.** Replace the direct sum with the divisor sum, compute Euler's totient by trial division, and check that both versions agree for every $n \le 100$.
4. **Modular arithmetic.** Add the modular inverse, and test values where the numerator wraps past the modulus.
5. **Bracelets.** Add the reflection terms and match the dihedral count against a brute force for small $n$.
6. **Transfer.** Recognize Burnside in a cube, a grid, or a weighted coloring, and decide whether the fixed count is a power, a product, or a coefficient of a generating function. Where the count must be reduced, use [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State Burnside's lemma and name the two quantities it averages. (At a glance, Formal model)
2. Why is $k^n/n$ wrong, and what is the smallest example that shows it? (Problem motivation)
3. How many cycles does a rotation by $r$ positions have, and how many colorings does it fix? (Key insight)
4. Derive the divisor form from the rotation sum. (Formal model)
5. Why is the division by $n$ replaced by multiplication by $n^{p-2}$? (Algorithm derivation)
6. Trace the divisor form for $n = 4$ and $k = 3$, including the totients. (Step-by-step execution)
7. What changes when reflections are identified, and how do the reflection counts depend on parity? (Variants and extensions, Worked problems)
8. What goes wrong when the modulus is composite, and how does POJ 2154 avoid it? (Worked problems)
9. Why can JavaScript and Pascal not square two residues directly, and what replaces the squaring? (Implementation walkthrough)
10. Why is the exponent in the divisor term $n/d$ rather than $d$? (Common mistakes)

## Further reading

- The modular inverse, Fermat's little theorem, and the arithmetic of residues are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- Euler's totient, its product formula, and the divisor identities used by the grouping are in [Euler's totient](/algorithms/number-theory/euler-totient).
- The cycle-count argument is a counting argument of the same kind as [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The reflection that counts paths by folding them is a different use of symmetry, and it is in [the reflection principle](/algorithms/combinatorics/reflection-principle).
- The multinomial coefficient is the fixed count when the cycles have prescribed sizes, and it is in [multinomial coefficients](/algorithms/combinatorics/multinomial-coefficients).
- The stars-and-bars bijection counts the positive labels that appear in the cube problem, and it is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The alternating sums that handle overlapping symmetries are the same tool as [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion).
- The cycle index and the coefficient extraction used by weighted colorings are in [generating functions](/algorithms/combinatorics/generating-functions).
- The enumeration that Burnside replaces is in [permutations](/algorithms/enumeration/permutations), and the canonical-form idea is the same as the one in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The discrete mathematics behind group actions and the orbit-stabilizer theorem is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index lists this technique, [Burnside's lemma](/algorithms/combinatorics/burnside-lemma), beside the other counting arguments in [the combinatorics](/algorithms/combinatorics/).
