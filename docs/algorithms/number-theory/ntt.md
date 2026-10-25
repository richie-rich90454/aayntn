---
id: number-theory.ntt
title: The number-theoretic transform
summary: Multiply two polynomials in O(n log n) by evaluating them at the powers of a primitive root of unity modulo 998244353, multiplying the values pointwise, and interpolating back.
division: [platinum]
subjects: [number-theory]
level: advanced
importance: advanced-technique
keywords:
    [
        number-theoretic transform,
        ntt,
        polynomial multiplication,
        convolution,
        primitive root,
        roots of unity,
        cooley-tukey,
        998244353,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic, foundations.complexity]
    recommended: [foundations.binary-representation, foundations.recursion]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The modulus is the prime 998244353, whose factorization p - 1 = 119 x 2^23 supplies roots of unity for every power of two up to 2^23.
    - The transform length is a power of two at least as large as the number of coefficients in the product.
    - Every coefficient is a residue in [0, p), so a product of two coefficients is below p^2 and fits in a signed 64-bit integer.
implementations: number-theory.ntt
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/number-theory.ntt.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

The number-theoretic transform is the fast Fourier transform carried out in the integers modulo a prime. It turns a polynomial into its values at the powers of a primitive root of unity, multiplies two such value tables pointwise, and turns the result back into coefficients. A convolution that costs $O(nm)$ directly costs $O(n \log n)$ this way.

Three facts carry the technique.

1. **A primitive root supplies roots of unity of every usable length.** Modulo the prime $p = 998244353$, the factorization
    $$
    p - 1 = 119 \ast 2^{23}
    $$
    gives a root of unity of order $2^k$ for every $k \le 23$. A transform of length $2^{23} = 8388608$ is therefore possible, which covers polynomials with several million coefficients.
2. **Evaluation turns convolution into multiplication.** If $C(x) = A(x)B(x)$, then $C(\omega^k) = A(\omega^k)B(\omega^k)$ at every point. The two value tables multiply index by index, and the product table is the evaluation of the answer.
3. **The transform is invertible.** The inverse transform uses $\omega^{-1}$ and multiplies by the inverse of the length, so the coefficients come back exactly. There is no rounding step, because every value is a residue modulo $p$.

A complex FFT has to bound its rounding error. The NTT does not, because every operation is an exact modular multiplication, and for this modulus the product of two residues is below $2^{60}$.

## Problem motivation

A problem gives two arrays of $10^5$ integers and asks for the convolution

$$
c_k = \sum_{i+j=k} a_i b_j \bmod 998244353
$$

for every $k$ from $0$ to $n + m - 2$. The direct computation performs $10^{10}$ multiplications. At a few hundred million operations per second, that is minutes, not the one or two seconds the problem allows.

The same shape appears whenever two families of objects are combined and only the sum of their labels matters. Multiplying two polynomials is the definition. Counting pairs with a prescribed sum is a convolution of frequency tables. Multiplying two big integers is a convolution of their base-$10^9$ digits, followed by a carry pass. Matching a pattern with wildcards reduces to three convolutions. A dynamic program whose transition sums over every split point is a convolution when the transition depends only on the split.

The modulus is not an accident. For the transform to have length $L$, the field must contain an element of order $L$, so $L$ must divide $p - 1$. The prime $998244353$ was chosen because

$$
998244353 = 119 \ast 2^{23} + 1,
$$

which makes it friendly to power-of-two transforms and small enough that a product of two residues fits in a signed 64-bit integer. The number $3$ is a primitive root modulo this prime, which means its powers visit every nonzero residue before returning to $1$.

A complex FFT would also compute the convolution, but its intermediate values grow with $n$, and a double holds only 53 bits exactly. The NTT replaces the complex roots of unity with modular ones and the rounding analysis with a congruence.

## Recognition patterns

The number-theoretic transform is the right tool when the statement contains some of these phrases.

- "Multiply the two polynomials", "compute the convolution", "print $c_0, c_1, \ldots, c_{n+m-2}$".
- "For every $k$, count the pairs $(i, j)$ with $a_i + b_j = k$".
- "The answer is taken modulo $998244353$", or modulo another prime of the form $c \ast 2^k + 1$.
- "The arrays have up to $10^5$ or $5 \ast 10^5$ elements", with a time limit that rules out $O(nm)$.
- "Multiply two integers with up to $10^5$ digits", where the digit-by-digit products form a convolution.
- "Match a pattern with wildcards", where each wildcard position contributes zero to a convolution.

The constraints that decide whether the transform applies at all:

| Condition | What it rules |
| --- | --- |
| $p = 998244353$ | $2^{23}$ divides $p - 1$; the primitive root $3$ supports lengths up to $2^{23}$ |
| $p = 469762049$ | $2^{26}$ divides $p - 1$; longer power-of-two transforms are available |
| $p = 10^9 + 7$ | $p - 1 = 2 \ast 500000003$; only length $2$ is available, so one NTT cannot do the job |
| An arbitrary prime $p$ | Factor $p - 1$; a length $L$ works exactly when $L$ divides $p - 1$ |
| Real or complex coefficients | A complex FFT is the natural tool |
| $n$ and $m$ below a few thousand | The direct convolution is simpler and fast enough |
| A min-plus or max-plus convolution | The transform does not apply, because the operation is not addition followed by multiplication |
| An exact integer answer without a modulus | Use several NTT primes and the Chinese remainder theorem, or arbitrary-precision integers |

The modulus $10^9 + 7$ is the trap in that table. It is prime, and modular arithmetic works modulo it, but $10^9 + 6$ has only one factor of two. A length-$4$ transform needs an element of order $4$, and no such element exists. A program that computes $(p - 1)/4$ with integer division gets a wrong root and silently returns wrong coefficients.

## Naive approach

The direct convolution is two nested loops.

```cpp
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        c[i + j] = (c[i + j] + (long long)a[i] * b[j]) % mod;
    }
}
```

It is correct for every modulus, it needs no roots of unity, and it is $O(nm)$. For $n = m = 10^5$ it performs $10^{10}$ iterations. Even at a billion iterations per second, that is ten seconds, and the modular reduction makes each iteration more expensive than a plain multiply.

The naive route through evaluation is no better. A polynomial of degree $d$ is determined by its values at $d + 1$ points, so one could evaluate $A$ and $B$ at $n + m - 1$ points, multiply the values, and interpolate. Evaluating one polynomial at $N$ arbitrary points by Horner's rule costs $O(N)$ per point, which is $O(N^2)$ overall, and interpolation by Lagrange's formula is also $O(N^2)$. The evaluation route becomes fast only when the points are the powers of a root of unity, because then all the evaluations share their subcomputations.

That sharing is the entire idea of the transform. The naive code is still worth writing, because it is the reference implementation against which the transform is tested on small random cases.

## Key insight

The insight has two halves.

**Values determine a polynomial, and values multiply pointwise.** A polynomial of degree at most $d$ is determined by its values at $d + 1$ distinct points. The product $C = AB$ has degree at most $n + m - 2$, so $n + m - 1$ points suffice. At each point $x$,

$$
C(x) = A(x)B(x).
$$

If the value tables are already known, the product table costs one multiplication per point.

**The powers of a root of unity make the evaluation fast.** Choose a length $L$ that is a power of two, at least $n + m - 1$, and dividing $p - 1$. Let $\omega$ be an element of order $L$. The transform evaluates $A$ at $1, \omega, \omega^2, \ldots, \omega^{L-1}$. The even-indexed coefficients and the odd-indexed coefficients can be separated:

$$
A(x) = A_{\text{even}}(x^2) + x \ast A_{\text{odd}}(x^2).
$$

At $x = \omega^j$, the two half-size polynomials are evaluated at $\omega^{2j}$, and $\omega^2$ has order $L/2$. The same problem therefore reappears at half the size, twice, and the work satisfies

$$
T(L) = 2T(L/2) + O(L).
$$

That recurrence solves to $O(L \log L)$. The inverse works because the powers of $\omega$ are orthogonal: the sum $\sum_k \omega^{k(j - j')}$ is $L$ when $j = j'$ and $0$ otherwise.

The length must be a power of two because the halving has to reach $1$ exactly. If $L$ is not a power of two, the even and odd split still works, but the recursion needs a root of order $L/2$ that may not exist, and the bookkeeping acquires mixed-radix cases.

## Visual intuition

The transform is a change of basis. Coefficients become values, the values multiply, and the inverse changes the basis back.

```text
coefficients a                 values A
[a_0, a_1, ..., a_{L-1}] --NTT--> [A(1), A(w), ..., A(w^(L-1))]
                                        |
                                        | pointwise product
                                        v
coefficients c <--inverse NTT-- [A(1)B(1), ..., A(w^(L-1))B(w^(L-1))]
```

The fast transform is a butterfly network with $\log_2 L$ stages. At a stage of length $\ell$, two values at distance $\ell/2$ are combined with a twiddle factor $w$:

```text
u -------------------------> u + w v
v --(multiply by w)--------> u - w v
```

Every stage halves the number of independent blocks and doubles the length of each block. After $\log_2 L$ stages there is one block, and it holds the transform.

A concrete picture uses the small field modulo $5$, where $2$ has order $4$. The fourth roots of unity are $1, 2, 4, 3$, which are $2^0, 2^1, 2^2, 2^3$. For

$$
A(x) = 1 + 2x + 3x^2 + 4x^3,
$$

the values at those roots are:

| $k$ | $\omega^k$ | $A(\omega^k) \bmod 5$ |
| --- | ---------- | --------------------- |
| $0$ | $1$        | $0$                   |
| $1$ | $2$        | $4$                   |
| $2$ | $4$        | $3$                   |
| $3$ | $3$        | $2$                   |

The four values $0, 4, 3, 2$ contain exactly the same information as the four coefficients. The transform is a reversible rearrangement, not a compression.

The bit-reversal permutation is the other half of the picture. The recursive split by even and odd indices produces the leaves in the order

$$
a_0, a_4, a_2, a_6, a_1, a_5, a_3, a_7
$$

for $L = 8$. That order is the index order with the three bits reversed. The iterative algorithm writes the coefficients in that order once, then combines adjacent blocks from the bottom up. Reading the permutation as a tree makes the stage order obvious: the two halves of every block are the even and odd subsequences of the block above them.

## Formal model

::: math definition Definition
For a prime $p$, a **polynomial** of length $n$ is a vector $a = (a_0, a_1, \ldots, a_{n-1})$ representing

$$
A(x) = \sum_{i=0}^{n-1} a_i x^i
$$

with coefficients in the field $\mathbb{F}_p$ of residues modulo $p$. Its **convolution** with a polynomial $b$ of length $m$ is the vector $c$ of length $n + m - 1$ with

$$
c_k = \sum_{i+j=k} a_i b_j \bmod p.
$$
:::

::: math definition Definition
The **order** of an element $g \in \mathbb{F}_p^{\ast}$ is the smallest positive integer $t$ with $g^t \equiv 1 \pmod p$. A **primitive root** modulo $p$ is an element of order $p - 1$.
:::

::: math definition Definition
Let $L$ divide $p - 1$, let $g$ be a primitive root modulo $p$, and let $\omega = g^{(p-1)/L}$. The **number-theoretic transform** of a length-$L$ polynomial $a$ is the vector $\hat a$ with

$$
\hat a_k = \sum_{j=0}^{L-1} a_j \omega^{jk} \bmod p
$$

for $0 \le k < L$. The **inverse transform** is

$$
a_j = L^{-1} \sum_{k=0}^{L-1} \hat a_k \omega^{-jk} \bmod p.
$$
:::

::: math lemma Lemma
If $g$ is a primitive root modulo $p$ and $L$ divides $p - 1$, then $\omega = g^{(p-1)/L}$ has order exactly $L$.
:::

::: math proof Proof
The power $\omega^L$ equals $g^{p-1} \equiv 1 \pmod p$, so the order of $\omega$ divides $L$. Suppose $\omega^t \equiv 1$ for some $0 < t < L$. Then

$$
g^{(p-1)t/L} \equiv 1 \pmod p.
$$

The order of $g$ is $p - 1$, so $p - 1$ divides $(p - 1)t/L$. Dividing both sides by $(p - 1)/L$ gives that $L$ divides $t$, which contradicts $0 < t < L$. Therefore no smaller positive exponent works, and the order is $L$. $\square$
:::

::: math lemma Orthogonality Lemma
Let $\omega$ have order $L$. For integers $t$,

$$
\sum_{k=0}^{L-1} \omega^{kt} =
\begin{cases}
L, & L \mid t, \\
0, & L \nmid t.
\end{cases}
$$
:::

::: math proof Proof
If $L$ divides $t$, every term is $\omega^{kt} = (\omega^t)^k = 1$, and the sum is $L$.

Otherwise let $r = \omega^t$. Since $L$ does not divide $t$ and $\omega$ has order $L$, $r \ne 1$. The sum is a finite geometric series:

$$
(1 - r) \sum_{k=0}^{L-1} r^k = 1 - r^L = 1 - \omega^{tL} = 1 - 1 = 0.
$$

Because $1 - r \ne 0$, the sum itself is zero. $\square$
:::

::: math theorem Convolution theorem
Let $a$ and $b$ be arrays of length $L$ whose nonzero coefficients occupy the first $n$ and $m$ positions, with $n + m - 1 \le L$. Let $c$ be the length-$L$ vector of product coefficients, padded with zeros. For every $k$,

$$
\hat c_k = \hat a_k \hat b_k \bmod p.
$$
:::

::: math proof Proof
By definition,

$$
\hat c_k = \sum_{r=0}^{L-1} c_r \omega^{rk}
= \sum_{r=0}^{L-1} \sum_{i+j=r} a_i b_j \omega^{rk}.
$$

Every pair $(i, j)$ with $0 \le i, j < L$ and $i + j < L$ appears exactly once in the sum over $r$. A pair with $i + j \ge L$ contributes zero, because $i + j \ge L \ge n + m - 1$ forces $i \ge n$ or $j \ge m$, and the padding makes that coefficient zero. The double sum can therefore be rewritten as a product:

$$
\hat c_k = \sum_{i=0}^{L-1} \sum_{j=0}^{L-1} a_i b_j \omega^{(i+j)k}
= \left( \sum_{i=0}^{L-1} a_i \omega^{ik} \right) \left( \sum_{j=0}^{L-1} b_j \omega^{jk} \right)
= \hat a_k \hat b_k.
$$

Terms with $i + j \ge L$ are zero by the padding, so every pair with $i + j \ge L$ contributes nothing. $\square$
:::

::: math theorem Inversion theorem
The inverse formula recovers the coefficients of $a$ from $\hat a$.
:::

::: math proof Proof
Substitute the definition of $\hat a_k$ into the inverse formula:

$$
L^{-1} \sum_{k=0}^{L-1} \hat a_k \omega^{-jk}
= L^{-1} \sum_{k=0}^{L-1} \sum_{r=0}^{L-1} a_r \omega^{rk} \omega^{-jk}
= L^{-1} \sum_{r=0}^{L-1} a_r \sum_{k=0}^{L-1} \omega^{k(r-j)}.
$$

The inner sum is $L$ when $r = j$ and $0$ otherwise, by the orthogonality lemma. The whole expression is therefore $L^{-1} \ast a_j \ast L = a_j$. $\square$
:::

## Algorithm derivation

### Padding

Choose the smallest power of two $L$ with $L \ge n + m - 1$. Append zeros to both coefficient arrays until they have length $L$. The padding does not change the product, and it makes the length divisible by every smaller power of two, so the halving recursion reaches $1$.

### The Cooley-Tukey split

Write $L = 2h$. Split the coefficients by parity:

$$
A(x) = \sum_{r=0}^{h-1} a_{2r} x^{2r} + x \sum_{r=0}^{h-1} a_{2r+1} x^{2r+1}
= E(x^2) + x \ast O(x^2).
$$

Let $\omega$ be a primitive $L$-th root of unity, so $\omega^2$ is a primitive $h$-th root. For $0 \le j < h$,

$$
A(\omega^j) = E(\omega^{2j}) + \omega^j O(\omega^{2j}),
$$

and

$$
A(\omega^{j+h}) = E(\omega^{2j+2h}) + \omega^{j+h} O(\omega^{2j+2h})
= E(\omega^{2j}) - \omega^j O(\omega^{2j}),
$$

because $\omega^{2h} = \omega^L = 1$ and $\omega^h = -1$.

The two values on the right are computed from the same pair $E(\omega^{2j})$ and $O(\omega^{2j})$. The transform of length $L$ therefore needs two transforms of length $h$ plus $h$ butterflies, which is the recurrence $T(L) = 2T(L/2) + O(L)$.

### From recursion to butterflies

The recursive version writes the even and odd coefficients into two new arrays at every level. The iterative version avoids the copies by permuting the input once.

At the bottom of the recursion, the coefficients appear in the order produced by repeatedly splitting by parity. For $L = 8$, that order is

$$
a_0, a_4, a_2, a_6, a_1, a_5, a_3, a_7.
$$

An index written in binary, read from the least significant bit, gives this position: $1 = 001$ becomes $100 = 4$, $2 = 010$ stays $2$, $3 = 011$ becomes $110 = 6$, and so on. The permutation is the bit reversal of the index.

After the permutation, the algorithm runs the recursion from the bottom up. At a stage with block length $\ell = 2h$, two adjacent blocks of length $h$ hold the even and odd half-transforms. The butterfly with twiddle $w = \omega_\ell^j$ computes

$$
u + wv \quad \text{and} \quad u - wv,
$$

where $\omega_\ell$ is a primitive $\ell$-th root. That is exactly the pair of formulas derived above, and it produces the length-$\ell$ transform of the combined block.

### The inverse transform

The inverse uses the same network with $\omega^{-1}$ in place of $\omega$, followed by one multiplication by $L^{-1} \bmod p$. The roots still satisfy the orthogonality lemma, because $\omega^{-1}$ also has order $L$. The final scaling is what turns the unnormalized inverse into the exact coefficients.

### The root at every stage

At a stage of length $\ell$, the twiddle is

$$
\omega_\ell = g^{(p-1)/\ell} \bmod p.
$$

For the inverse, the code replaces $\omega_\ell$ by its modular inverse $\omega_\ell^{p-2} \bmod p$. Computing it from scratch at every stage costs $O(\log p)$ per stage, which is $O(\log p \log L)$ overall and negligible against the transform. A program that runs many transforms of the same length can precompute the roots once.

## Step-by-step execution

The arithmetic is easier to follow in the field modulo $5$, where $2$ is a primitive root. The same code runs modulo $998244353$ with $3$ in place of $2$.

Multiply

$$
A(x) = 1 + 2x, \qquad B(x) = 3 + 4x.
$$

The exact product is $3 + 10x + 8x^2$, which is $3 + 0x + 3x^2$ modulo $5$. The transform length is $4$, because the product has three coefficients and $4$ is the next power of two.

**Padding and bit reversal.** Pad both arrays to length $4$:

$$
a = (1, 2, 0, 0), \qquad b = (3, 4, 0, 0).
$$

The bit reversal of the indices $0, 1, 2, 3$ is $0, 2, 1, 3$, so the permuted arrays are

$$
a' = (1, 0, 2, 0), \qquad b' = (3, 0, 4, 0).
$$

**Forward transform of $a$.** At length $2$, the root is $\omega_2 = 2^{4/2} = 4 \equiv -1$, so the butterfly is $u + v$ and $u - v$.

| Block    | Before           | After    |
| -------- | ---------------- | -------- |
| $(1, 0)$ | $u = 1$, $v = 0$ | $(1, 1)$ |
| $(2, 0)$ | $u = 2$, $v = 0$ | $(2, 2)$ |

The array is now $(1, 1, 2, 2)$. At length $4$, the root is $\omega_4 = 2$, and the twiddles are $1$ and $2$:

| $j$ | $u$ | $v$            | $u + v$ | $u - v$ |
| --- | --- | -------------- | ------- | ------- |
| $0$ | $1$ | $2 \ast 1 = 2$ | $3$     | $4$     |
| $1$ | $1$ | $2 \ast 2 = 4$ | $0$     | $2$     |

The result is $(3, 0, 4, 2)$. These are exactly

$$
A(1) = 3, \quad A(2) = 0, \quad A(4) = 4, \quad A(8) = 2
$$

modulo $5$, in the order of the powers $1, 2, 4, 3$.

**Forward transform of $b$.** The same stages give

$$
b' = (3, 0, 4, 0) \longrightarrow (3, 3, 4, 4) \longrightarrow (2, 1, 4, 0).
$$

The four values are $B(1) = 2$, $B(2) = 1$, $B(4) = 4$, $B(8) = 0$.

**Pointwise product.** Multiply the tables index by index:

$$
(3 \ast 2, \; 0 \ast 1, \; 4 \ast 4, \; 2 \ast 0) = (6, 0, 16, 0) \equiv (1, 0, 1, 0) \pmod 5.
$$

**Inverse transform.** Bit-reverse $(1, 0, 1, 0)$ to get $(1, 1, 0, 0)$. The inverse roots are $\omega_2^{-1} = 4$ and $\omega_4^{-1} = 3$. At length $2$, the pairs become $(2, 0)$ and $(0, 0)$, so the array is $(2, 0, 0, 0)$. At length $4$:

| $j$ | $u$ | $v$ | $u + v$ | $u - v$ |
| --- | --- | --- | ------- | ------- |
| $0$ | $2$ | $0$ | $2$     | $2$     |
| $1$ | $0$ | $0$ | $0$     | $0$     |

The array is $(2, 0, 2, 0)$. Multiply by $L^{-1} = 4^{-1} \equiv 4 \pmod 5$:

$$
(8, 0, 8, 0) \equiv (3, 0, 3, 0) \pmod 5.
$$

The first three entries are $3, 0, 3$, which is the product $3 + 0x + 3x^2$.

The calculation also shows why the length is the next power of two and not $n + m - 1$ itself. With length $3$, the halving would stop at a block of length $3$ with no further split, and the root of order $3$ would have to be handled by a different recursion.

## Correctness proof

::: math theorem Theorem
The iterative transform, after the bit-reversal permutation and $\log_2 L$ butterfly stages, stores the values $\hat a_0, \hat a_1, \ldots, \hat a_{L-1}$ in natural order.
:::

::: math proof Proof
The bit-reversal permutation is the leaf order of the recursion that repeatedly splits the current subsequence into its even-indexed and odd-indexed elements. At the bottom, each leaf is a single coefficient. The iterative stages process blocks from length $2$ upward.

The invariant is this: after the stage with block length $\ell = 2h$, each block of $\ell$ positions holds, in natural frequency order, the length-$\ell$ transform of the subsequence that the recursion assigned to that block.

For $\ell = 1$ the invariant is trivial, because a single coefficient is its own length-one transform.

Suppose it holds for $h$. Take a block of length $\ell = 2h$. By the bit-reversal order, its first half holds the transform of the even-indexed elements of the subsequence that the block represents, and its second half holds the transform of the odd-indexed elements. Write those two half-transforms as $E_j$ and $O_j$ for $0 \le j < h$. The stage computes

$$
E_j + \omega_\ell^j O_j, \qquad E_j - \omega_\ell^j O_j.
$$

By the Cooley-Tukey identities derived earlier, these are the length-$\ell$ transform of the combined subsequence at the frequencies $j$ and $j + h$. The invariant therefore holds after the stage.

At the final stage there is one block of length $L$, which is the whole array, so the output is the length-$L$ transform of $a$. $\square$
:::

::: math theorem Theorem
Let $\hat c$ be the pointwise product of the forward transforms of the padded arrays $a$ and $b$. The inverse transform of $\hat c$ returns the convolution coefficients $c_0, \ldots, c_{n+m-2}$ in the first $n + m - 1$ positions.
:::

::: math proof Proof
The convolution theorem says that the forward transform of the padded convolution equals the pointwise product of the forward transforms. The forward transform is injective by the inversion theorem, so the pointwise product is the transform of the convolution and of nothing else. Applying the inverse transform recovers the convolution. The padding contributes zeros to every coefficient of index at least $n + m - 1$, so those positions are zero and the first $n + m - 1$ positions are the answer. $\square$
:::

::: math invariant Invariant
After each stage of the iterative transform, each block of length $\ell$ contains the length-$\ell$ transform of the subsequence assigned to it by the parity recursion, and the blocks are in the order of the bit-reversal permutation.
:::

## Complexity analysis

| Operation                           | Time          | Space      |
| ----------------------------------- | ------------- | ---------- |
| One forward transform of length $L$ | $O(L \log L)$ | $O(L)$     |
| Pointwise multiplication            | $O(L)$        | $O(1)$     |
| Inverse transform                   | $O(L \log L)$ | $O(L)$     |
| Full convolution                    | $O(L \log L)$ | $O(L)$     |
| Direct convolution                  | $O(nm)$       | $O(n + m)$ |

The transform has $\log_2 L$ stages, and each stage performs $L/2$ butterflies. A butterfly is one modular multiplication for $wv$, one for the next twiddle, and a constant number of additions and reductions, so the total is $\Theta(L \log L)$. Three transforms (two forward and one inverse) plus the pointwise product keep the same asymptotic bound.

For $n = m = 10^5$, the padded length is $L = 262144$. One transform performs about $L/2 \ast \log_2 L = 131072 \ast 18 = 2.36$ million butterflies, and three transforms about seven million. The direct convolution performs $10^{10}$ multiplications. The ratio is more than a thousand.

The length bound follows from the factorization of $p - 1$. Since $2^{23}$ is the largest power of two dividing $998244352$, the largest power-of-two transform length is $2^{23} = 8388608$. A length beyond that has no root of unity in this field. The arrays are two vectors of $L$ signed 64-bit integers, which is about $16L$ bytes, plus the output; for the maximum length that is roughly 134 megabytes before any other storage.

The twiddle computations cost $O(\log p)$ modular multiplications per stage. Over $\log L$ stages that is negligible, but a program that performs thousands of transforms should precompute the roots or cache them per length.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Convolution modulo $998244353$ | One NTT with primitive root $3$ |
| Convolution modulo another NTT-friendly prime | One NTT with a primitive root of that prime |
| Convolution modulo $10^9 + 7$ | Three NTT primes and the Chinese remainder theorem |
| Convolution with an arbitrary modulus | Factor the modulus or use three NTT primes and CRT |
| Exact integer convolution, no modulus | Three NTT primes with a product larger than the coefficient bound, then CRT |
| Real-valued convolution | Complex FFT, with a rounding-error bound |
| $n$ and $m$ up to a few thousand | Direct convolution, which is shorter and has no root bookkeeping |
| Min-plus or max-plus convolution | The transform does not apply; use the structure of the cost function |
| Many convolutions of the same length | Precompute the roots and reuse the transform of the fixed operand |
| A polynomial inverse, logarithm, or exponential | Newton iteration with an NTT at every doubling step |
| A cyclic convolution of length $L$ | NTT of length $L$ without padding beyond $L$ |
| A linear convolution longer than $2^{23}$ | Split the polynomials, or use a larger NTT-friendly prime |

The choice between one NTT and three NTTs is decided by the modulus, not by the size of the input. If the required answer is modulo $10^9 + 7$, a single NTT modulo $998244353$ computes the right convolution modulo $998244353$, and reducing that value modulo $10^9 + 7$ is meaningless. The three-prime route recovers the exact integer coefficient, which is then reduced modulo the target.

## Reference implementations

All six programs share one contract.

- **Input:** $n$, $m$, and the modulus $p$ on the first line, then the $n$ coefficients of the first polynomial, then the $m$ coefficients of the second polynomial.
- **Output:** the $n + m - 1$ coefficients of the product modulo $p$, separated by spaces on one line.

The modulus is $998244353$ in every test. The programs read it rather than hard-coding it so that the same source can be adapted to another NTT-friendly prime, but the primitive root $3$ is specific to this modulus.

| Language | File | Exact multiplication | Note |
| --- | --- | --- | --- |
| C | `c/program.c` | Signed 64-bit | The product of two residues is below $2^{60}$ |
| C++17 | `cpp17/program.cpp` | Signed 64-bit | The same bound, with `std::vector` storage |
| Java | `java/Main.java` | Signed 64-bit | A byte-array scanner replaces `Scanner` |
| Python | `python/program.py` | Arbitrary precision | The built-in `pow` computes the roots |
| Pascal | `pascal/program.pas` | 15-bit halves | The browser compiler stores `Int64` as a double |
| JavaScript | `javascript/program.js` | `BigInt` | A `Number` loses precision above $2^{53}$ |

The C, C++, and Java variants can use a plain 64-bit product because $998244353^2 \approx 9.96 \ast 10^{17}$, which is below $2^{63} - 1 \approx 9.22 \ast 10^{18}$. The Pascal variant cannot rely on that, because the browser compiler represents `Int64` as a JavaScript number. It splits each residue into 15-bit halves, so every partial product stays below $2^{46}$ and is exact in a double. The JavaScript variant uses `BigInt` for the same reason.

## Recursion decision

The Cooley-Tukey derivation is recursive, and a recursive implementation is short:

```cpp
void ntt(vector<long long> &a, bool invert) {
    int n = a.size();
    if (n == 1) return;
    vector<long long> even(n / 2), odd(n / 2);
    for (int i = 0; i < n / 2; i++) {
        even[i] = a[2 * i];
        odd[i] = a[2 * i + 1];
    }
    ntt(even, invert);
    ntt(odd, invert);
    long long w = 1;
    long long wlen = root_for(n, invert);
    for (int k = 0; k < n / 2; k++) {
        a[k] = (even[k] + w * odd[k]) % mod;
        a[k + n / 2] = (even[k] - w * odd[k] + mod) % mod;
        w = w * wlen % mod;
    }
}
```

It allocates two arrays at every level, and the total allocation is $O(L \log L)$ rather than $O(L)$. The iterative version allocates the two padded arrays once, performs the bit reversal in place, and runs the butterflies in place. It is not longer, and it is faster.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames | Iterative, because the depth is only 23 but the allocations are not |
| Java | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | Iterative |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The recursion depth is at most $23$, because the length cannot exceed $2^{23}$. Depth is not the reason to iterate here; the reason is that the recursive form copies the coefficients at every level and the iterative form does not. The bit-reversal permutation replaces the copies with one permutation of the original array.

## Implementation walkthrough

The first decision is the transform length.

```cpp
int total = n + m - 1;
int size = 1;
while (size < total) {
    size <<= 1;
}
```

The length must be at least the number of product coefficients and a power of two. Using `n + m` instead of `n + m - 1` is harmless, because it only makes the transform one step larger in the worst case, but using a non-power-of-two is not: the stage loop doubles the block length and would skip the final block.

The second decision is the stage root.

```cpp
long long wlen = mod_pow(3, (mod - 1) / len, mod);
if (invert) {
    wlen = mod_pow(wlen, mod - 2, mod);
}
```

The exponent is $(p - 1)/\ell$, not $p/\ell$ and not $(\ell - 1)$. The root must have order exactly $\ell$. When the modulus is not $998244353$, the base $3$ must be replaced by a primitive root of that modulus; using $3$ blindly is the most common way a correct-looking transform returns wrong values.

The third decision is the butterfly.

```cpp
long long u = a[start + k];
long long v = a[start + k + half] * w % mod;
a[start + k] = (u + v) % mod;
a[start + k + half] = (u - v + mod) % mod;
w = w * wlen % mod;
```

The subtraction needs the `+ mod` because $u - v$ can be negative. In C and C++, a negative value reduced with `%` stays negative; in Python it becomes positive, which hides the bug on the reference implementation and exposes it in the port. The addition `u + v` is below $2p$, so one conditional subtraction or one `%` restores the range.

The fourth decision is the inverse scaling.

```cpp
long long inv_n = mod_pow(n, mod - 2, mod);
for (int i = 0; i < n; i++) {
    a[i] = a[i] * inv_n % mod;
}
```

The inverse transform uses the inverse root at every stage and one final multiplication by $n^{-1}$. Forgetting the final scaling is easy because the forward transform still looks correct; the output is then off by a factor of $n$ at every position.

The Pascal variant adds one more decision. A full product of two residues does not fit exactly in the browser compiler's `Int64`, so the multiplication is split into 15-bit halves:

```pascal
R := (AHigh * BHigh) mod M;
R := (R * LimbBase + AHigh * BLow + ALow * BHigh) mod M;
R := (R * LimbBase + ALow * BLow) mod M;
```

The largest intermediate is below $2^{46}$, which is well inside the exact integer range of a double. The JavaScript variant takes the simpler route and uses `BigInt`, which is slower but never rounds.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Choosing a length that is not a power of two | The stage loop skips blocks or the recursion cannot halve | Round up to the next power of two |
| Choosing a length that does not divide $p - 1$ | No root of the required order exists | Factor $p - 1$ and check the power of two |
| Using $3$ as a primitive root for another modulus | The stage root has the wrong order | Find a primitive root of that modulus |
| Forgetting the inverse scale $n^{-1}$ | Every coefficient is multiplied by $n$ | Scale once after the inverse stages |
| Using $\omega$ instead of $\omega^{-1}$ in the inverse | The inverse is another forward transform | Invert the root at every stage |
| Leaving a negative subtraction unreduced | The value is negative or the next multiplication is wrong | Add the modulus before reducing |
| Printing the whole padded array | The output has trailing zeros | Print only $n + m - 1$ coefficients |
| Overflowing the product in JavaScript or Pascal | Silent wrong low bits | Use `BigInt` or split into 15-bit halves |
| Reusing one array for both operands | The pointwise product overwrites the wrong table | Keep two transforms or copy before multiplying |
| Precomputing roots for the wrong length | The transform of a different length uses the wrong twiddles | Key the cache by the stage length |

### Why this fails: a modulus without a large power of two

The plausible wrong approach is to keep the code and change only the modulus, on the theory that every prime supports the same transform. Take $p = 10^9 + 7$, whose factorization is

$$
p - 1 = 2 \ast 500000003.
$$

The largest power of two dividing $p - 1$ is $2$. A length-$4$ transform needs an element of order $4$, and no such element exists: every element of order $4$ would have to satisfy $x^2 \equiv -1 \pmod p$, and the existence of such an $x$ would make $p - 1$ divisible by $4$.

The code does not notice. It computes

$$
\omega_4 = 3^{(p - 1)/4} = 3^{250000001}
$$

because integer division discards the remainder, and uses that value as if it had order $4$. The forward transform still produces some numbers, and the inverse still produces some numbers, but the orthogonality lemma fails and the coefficients do not come back. The failure is silent: no exception, no negative value, just wrong output.

The smallest counterexample in the same family is $p = 7$ with length $4$. Here $p - 1 = 6$, and the nonzero residues have orders $1, 3, 6, 3, 6, 2$: the element $1$ has order $1$, $2$ and $4$ have order $3$, $3$ and $5$ have order $6$, and $6$ has order $2$. No element has order $4$. If the code computes $\omega = 3^{(7-1)/4} = 3^1 = 3$, it uses an element of order $6$ in a length-$4$ transform. On the input $(1, 0, 0, 0)$, the forward transform is $(1, 1, 1, 1)$, and the inverse formula with $\omega^{-1} = 5$ and $4^{-1} = 2$ gives

$$
2 \ast (1 + 5^j + 5^{2j} + 5^{3j}),
$$

which is $4$ at $j = 1$, not $1$. The round trip does not return the input.

The lesson is that the transform is a statement about the multiplicative group of the field. The length must divide the group order, and the root must have exactly that order. Checking $p - 1$ before writing the transform is cheaper than debugging a wrong answer.

## Variants and extensions

- **The inverse transform.** The same network with the inverse root and a final scaling. It is the only extra piece needed for convolution.
- **Arbitrary modulus convolution.** Run the transform modulo three NTT-friendly primes, recover the exact integer coefficient by the Chinese remainder theorem, and reduce modulo the target. The product of the three primes must exceed the largest possible coefficient.
- **Arbitrary length transform.** Bluestein's algorithm rewrites a length-$L$ transform as a convolution of a larger power-of-two length, which handles lengths that do not divide $p - 1$.
- **Multidimensional transform.** Apply the one-dimensional transform along each axis. The cost is the product of the dimensions times the sum of their logarithms.
- **Formal power series.** Newton iteration computes polynomial inverses, logarithms, exponentials, and square roots, with an NTT at every doubling step. This is the standard toolbox behind generating-function solutions.
- **String matching with wildcards.** Encode the pattern and the text as polynomials whose product has a zero coefficient exactly where the match is valid. Three convolutions handle the usual wildcard formulation.
- **Big integer multiplication.** Split each integer into base-$2^{15}$ or base-$10^4$ digits, convolve the digit arrays, and propagate the carries.
- **Online convolution.** CDQ divide and conquer schedules the transforms so that a recurrence whose next term depends on all previous terms can still be evaluated in $O(n \log^2 n)$.
- **Cyclic convolution.** A transform of length $L$ computes the convolution modulo $x^L - 1$, which is the natural operation in many counting problems on a circle.
- **The complex FFT.** The same butterfly network over the complex numbers, with floating-point roots and a rounding-error analysis. It is the right tool when the coefficients are real and the modulus is absent.

## Contest strategy

1. **Read the modulus first.** Factor $p - 1$ and find the largest power of two that divides it. If that power is smaller than the transform length, the one-prime NTT is not available.
2. **Find a primitive root.** For $998244353$, the root is $3$. For another prime, test candidates by checking $g^{(p-1)/q} \ne 1$ for every prime $q$ dividing $p - 1$.
3. **Round the length up.** The length is the next power of two at least $n + m - 1$, not the next power of two at least $n + m$.
4. **Write the direct convolution first.** Test it against the transform on random arrays of length at most ten, with coefficients near $0$ and near $p - 1$. A disagreement is almost always a negative subtraction, a wrong root, or a missing inverse scale.
5. **Use 64-bit products.** For $p \approx 10^9$, the product of two residues is below $2^{60}$ and a signed 64-bit integer holds it. For a larger modulus, use 128-bit arithmetic or splitting.
6. **Scale once.** The inverse transform applies $n^{-1}$ at the end, not at every stage.
7. **Print only the answer.** The padded array has extra zeros, and a program that prints all of it fails the comparison.
8. **Watch the memory.** Two arrays of length $2^{19}$ at 8 bytes each are 8 megabytes; at $2^{23}$ they are 128 megabytes, before the output and the runtime overhead.
9. **Precompute when the length repeats.** If the same transform length is used many times, precompute the roots and, when one operand is fixed, its transform.

## Worked problems

### Problem 1: convolution modulo a friendly prime

**Restatement.** Given arrays $a$ of length $n$ and $b$ of length $m$, print the $n + m - 1$ coefficients of their convolution modulo $998244353$. The constraints are $1 \le n, m \le 524288$ and $0 \le a_i, b_i < 998244353$.

**Naive baseline.** The double loop performs up to $524288^2 \approx 2.7 \ast 10^{11}$ multiplications, which is far beyond the time limit.

**Insight.** The convolution is a polynomial product, and the modulus supports a transform of length $2^{20}$, which is enough for $n + m - 1 \le 1048575$.

**Derivation.** Pad both arrays to $L = 2^{20}$, transform each, multiply the tables pointwise, and apply the inverse transform. Print the first $n + m - 1$ entries.

**Correctness.** The convolution theorem and the inversion theorem from the formal model apply directly. The padding contributes only zeros, so the first $n + m - 1$ coefficients are unchanged and the rest are zero.

**Complexity.** $O(L \log L)$ time and $O(L)$ space, with $L = 2^{20}$.

**Common wrong approach.** Using $L = n + m$ when that value is a power of two, then padding one element too few. The last coefficient of the product is lost. The correct length is the next power of two at least $n + m - 1$.

### Problem 2: counting pairs with a prescribed sum

**Restatement.** Given two arrays $a$ and $b$ of length at most $10^5$ with values between $0$ and $10^5$, count the ordered pairs $(i, j)$ with $a_i + b_j = k$ for every $k$ from $0$ to $2 \ast 10^5$.

**Naive baseline.** Try every pair, which is $10^{10}$ tests.

**Insight.** Let $f[t]$ be the number of occurrences of $t$ in $a$, and $g[t]$ the number of occurrences of $t$ in $b$. The number of pairs with sum $k$ is the convolution

$$
(f \ast g)[k] = \sum_{i+j=k} f[i] g[j].
$$

**Derivation.** Build the two frequency arrays, pad them to a power of two, and run the transform. The coefficient at $k$ is the count. Reduce every coefficient modulo the prime after the inverse transform.

**Correctness.** Each pair $(i, j)$ with $a_i = u$ and $b_j = v$ contributes exactly once to the term $f[u]g[v]$ with $u + v = k$, and the convolution sums exactly those terms. The frequency arrays count the pairs, not the indices, so the result is the number of ordered index pairs.

**Complexity.** $O(V + L \log L)$ time and $O(L)$ space, where $V$ is the value range and $L$ is the next power of two above $2V + 1$.

**Common wrong approach.** Counting unordered pairs by dividing the answer by two. The task asks for ordered pairs, and the division is wrong when $i = j$ is allowed. If the task forbids $i = j$, subtract one for every index $i$ with $a_i + b_i = k$.

### Problem 3: convolution modulo an unfriendly prime

**Restatement.** The same convolution as Problem 1, but the answer is required modulo $10^9 + 7$, with $n, m \le 10^5$ and coefficients below $10^9 + 7$.

**Naive baseline.** The direct convolution is $O(nm)$ and also overflows a 64-bit integer on the intermediate products.

**Insight.** The modulus $10^9 + 7$ has no large power of two in $p - 1$, but three NTT-friendly primes do. Recover the exact integer coefficient from the three residues, then reduce modulo $10^9 + 7$.

**Derivation.** Choose the primes $998244353$, $1004535809$, and $469762049$, whose product is about $4.7 \ast 10^{26}$. Run the convolution modulo each prime with its own primitive root. For each coefficient, combine the three residues with the Chinese remainder theorem. The largest possible coefficient is at most $10^5 \ast (10^9 + 7)^2 \approx 1.0 \ast 10^{23}$, which is below the product of the three primes, so the recovered integer is exact.

**Correctness.** The Chinese remainder theorem gives a unique residue modulo the product of the primes. The true coefficient is a non-negative integer below that product, so the recovered residue is the coefficient itself, and reducing it modulo $10^9 + 7$ gives the required answer.

**Complexity.** Three transforms of length $L$ per operand, plus the inverse transforms, for $O(L \log L)$ time and $O(L)$ space, with a constant factor of about three.

**Common wrong approach.** Running one NTT modulo $998244353$ and reducing the result modulo $10^9 + 7$. The convolution modulo $998244353$ loses all information about the quotient, and the reduced value is unrelated to the true coefficient modulo $10^9 + 7$.

## Practice progression

1. **Recognition.** Read a statement and decide whether it asks for a convolution, a pointwise product, or something else. Write down the modulus and the factorization of $p - 1$.
2. **Direct application.** Implement the iterative transform for a fixed length and verify it against the naive transform on all arrays of length $4$ and $8$ over a small prime such as $5$ or $17$.
3. **Adaptation.** Add the inverse transform and the final scaling, then check the round trip on random arrays. Test the convolution against the direct one for lengths up to fifty.
4. **Combination.** Solve a counting problem with frequency arrays, such as the pair-sum problem above, and compare against a brute force over the pairs for small inputs.
5. **Challenge.** Implement the three-prime convolution for an unfriendly modulus and verify it against a direct convolution with 128-bit or arbitrary-precision intermediates.
6. **Transfer.** Use the transform inside another technique: a formal power series inverse by Newton iteration, a wildcard string match, a big integer product, or an online convolution scheduled by divide and conquer.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why must the transform length divide $p - 1$, and what is the largest power-of-two length for $998244353$? (Formal model, Complexity analysis)
2. Prove that $\omega = g^{(p-1)/L}$ has order exactly $L$. (Formal model)
3. State and prove the orthogonality lemma for the powers of a root of unity. (Formal model)
4. Derive the two Cooley-Tukey butterfly formulas from the even-odd split. (Algorithm derivation)
5. Why does the bit-reversal permutation put the coefficients in the order the iterative stages expect? (Correctness proof)
6. Why does the convolution theorem require padding both arrays to length $L$? (Formal model, Worked problems)
7. Why does the inverse transform need the final multiplication by $L^{-1}$? (Algorithm derivation, Implementation walkthrough)
8. What goes wrong when the modulus is $10^9 + 7$, and what is the smallest prime that shows the failure? (Common mistakes)
9. How does the code avoid overflow in C, Java, Pascal, and JavaScript? (Reference implementations)
10. When is the direct convolution the better choice than the transform? (Algorithm selection)

## Further reading

- The modular arithmetic that supplies the roots, the inverses, and the reduction is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The three-prime reconstruction used for an unfriendly modulus is in [the Chinese remainder theorem](/algorithms/number-theory/chinese-remainder).
- The polynomial toolbox built on the transform, including Newton iteration for formal power series, is introduced from [generating functions](/algorithms/combinatorics/generating-functions).
- The factorial and inverse-factorial computations that pair with convolution in combinatorial problems are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The complex-number version of the same butterfly network, with the rounding analysis that the modular transform avoids, is in [the fast Fourier transform](/algorithms/number-theory/fft).
- The matrix power that solves a linear recurrence in logarithmic time is a different use of the same doubling idea, in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).
- The exact string search that the wildcard convolution generalizes is in [KMP](/algorithms/strings/kmp).
- The divide-and-conquer optimization of dynamic programs, which schedules work by ranges, is in [divide-and-conquer optimization](/algorithms/dynamic-programming/divide-and-conquer-optimization).
- The subject index lists this technique beside the rest of [number theory](/algorithms/number-theory/).
