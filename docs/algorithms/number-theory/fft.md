---
id: number-theory.fft
title: The fast Fourier transform
summary: Multiply two polynomials in O(n log n) by evaluating both at the roots of unity, multiplying the values, and interpolating back with an in-place iterative radix-2 butterfly.
division: [gold, platinum]
subjects: [number-theory]
level: advanced
importance: specialized-technique
keywords:
    [
        fast Fourier transform,
        fft,
        polynomial multiplication,
        convolution,
        roots of unity,
        butterfly,
        bit reversal,
        point-value form,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [number-theory.modular-arithmetic, foundations.recursion]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The two coefficient lists are non-empty, and the recovered coefficients are rounded to the nearest integer at the end.
    - The transform length is a power of two at least as large as the number of coefficients in the product, so the circular convolution equals the linear one.
    - The coefficients and the transform length are small enough that double-precision rounding error stays below one half.
implementations: number-theory.fft
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/number-theory.fft.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

The fast Fourier transform multiplies two polynomials in $O(n \log n)$ instead of $O(n^2)$. It changes the representation: a polynomial is written by its values at $n$ chosen points, multiplication becomes pointwise, and an inverse transform returns the coefficients.

Three facts carry the whole technique.

1. **The roots of unity are closed under halving.** Let $\omega_n = e^{2\pi i/n}$. Then $\omega_n^2$ is a primitive $(n/2)$-th root, and $\omega_n^{j+n/2} = -\omega_n^j$. The second identity is what lets one evaluation of the even part serve two coefficients of the result.
2. **Evaluation turns convolution into multiplication.** If $\hat a_j = A(\omega_n^j)$ and $\hat b_j = B(\omega_n^j)$, then the transform of the convolution $c = a \ast b$ satisfies $\hat c_j = \hat a_j \hat b_j$. Multiplying $n$ pairs of numbers replaces $n^2$ coefficient products.
3. **The transform is its own inverse up to conjugation and a scale.** Applying the same butterfly network with $\omega_n^{-1}$ in place of $\omega_n$ and dividing every entry by $n$ recovers the coefficients. The inverse costs the same as the forward transform.

The naive convolution of two lists of length $n$ performs $n^2$ multiplications. The FFT performs about $\tfrac{3}{2} n \log_2 n$ butterflies for the two forward transforms and the inverse, which is the difference between hours and milliseconds at $n = 10^6$.

## Problem motivation

A program must multiply two polynomials of degree $131\,071$, with coefficients that fit in a signed 32-bit integer. The output has $262\,143$ coefficients. The direct convolution

$$
c_k = \sum_{i=0}^{k} a_i b_{k-i}
$$

performs about $1.7 \times 10^{10}$ multiplications. At a few hundred million operations per second that is a minute or more, and it is far beyond a three-second limit.

The problem is not that the coefficients are large; they fit in 32 bits. The problem is that the _count_ of coefficient products is quadratic. Every product is cheap, and there are too many of them.

The FFT removes the quadratic factor by evaluating the polynomials instead of expanding them. Evaluating $A$ at one point costs $O(n)$ by Horner's rule, so evaluating at $n$ arbitrary points would cost $O(n^2)$ and change nothing. The roots of unity are special: the evaluations at $\omega_n^0, \ldots, \omega_n^{n-1}$ can be computed recursively from the evaluations of the even and odd halves at the $(n/2)$-th roots, so the $n$ evaluations cost $O(n \log n)$.

The same structure appears whenever a sum over pairs with a fixed difference or a fixed sum must be computed: counting pairs with a given sum, comparing a pattern against every window of a text, multiplying two big integers, and expanding a product of generating functions. In each case the answer is a convolution, and in each case the FFT is the tool that makes the convolution affordable.

## Recognition patterns

The FFT is the right tool when the statement contains some of these phrases.

- "Multiply two polynomials", or "print the coefficients of the product", with degree above a few thousand.
- "Count the pairs $(i, j)$ with $a_i + b_j = s$", for every $s$, or for one $s$ when the value range is large.
- "Count the subarrays whose sum is $k$", when the elements are replaced by indicators and the count becomes a correlation of prefix counts.
- "Find the shift of a pattern that matches a text with the fewest mismatches", especially with wildcards.
- "Multiply two integers with up to $10^5$ digits", where the grade-school algorithm is quadratic.
- "The answer is a coefficient of $\prod_i (1 + x^{a_i})$", or of any product of dense polynomials.
- "Sum over $i$ of $a_i b_{k-i}$", written either as a sum or as a convolution.

The constraint values that decide the technique:

| Constraint | What it rules |
| --- | --- |
| Both lists have at most a few thousand entries | The naive double loop is simpler and fast enough |
| The degree is around $10^5$ | The FFT or the number-theoretic transform |
| The modulus is $998\,244\,353$ and exactness is required | A number-theoretic transform, not a complex FFT |
| The coefficients are up to $10^9$ and the length is $10^5$ | Split the coefficients, or use an NTT with several moduli |
| The transform length is not a power of two | Pad upward, or use Bluestein's algorithm |
| The convolution is online, one element at a time | FFT alone does not help; use a block or relaxed scheme |
| The result is needed modulo an arbitrary prime | Three NTTs and the Chinese remainder theorem |

The third and fourth rows are the ones that decide contest solutions. A complex FFT is exact only after rounding, and the rounding is safe only when the exact coefficient is small enough relative to $2^{53}$. The number-theoretic transform works in a finite field and has no rounding error at all, but it exists only for moduli of a special shape.

## Naive approach

The baseline is the definition of convolution.

```cpp
vector<long long> multiply_naive(const vector<int>& a, const vector<int>& b) {
    vector<long long> c(a.size() + b.size() - 1, 0);
    for (size_t i = 0; i < a.size(); i++) {
        for (size_t j = 0; j < b.size(); j++) {
            c[i + j] += (long long)a[i] * b[j];
        }
    }
    return c;
}
```

It is correct, it needs no floating point, and it is $O(nm)$. For two lists of length $100$ it is the right program. For two lists of length $10^5$ it performs $10^{10}$ iterations, and the inner loop is a multiply-add that reads and writes the output array on every iteration, so the work is memory-bound as well as quadratic.

A second baseline evaluates both polynomials at $n$ points by Horner's rule and interpolates. Evaluation is $O(n)$ per point, so the total is still $O(n^2)$. The interpolation step, done by solving a linear system, is $O(n^3)$. Choosing the roots of unity is what collapses both steps, and that choice is the entire idea of the FFT.

A third baseline uses Karatsuba's algorithm, which splits each polynomial into two halves and performs three half-size multiplications instead of four. Its running time is $O(n^{1.585})$. It is a genuine improvement and the standard choice when the FFT's constants or its precision are inconvenient, but it is still polynomial in $n$ with an exponent above one, and it loses to the FFT on the large cases.

## Key insight

The insight is that **a polynomial can be represented by its values at chosen points, and convolution becomes pointwise multiplication in that representation.**

Write $A(x) = \sum a_i x^i$ and $B(x) = \sum b_j x^j$, and let $C(x) = A(x)B(x)$. At every point $x$,

$$
C(x) = A(x) B(x).
$$

That is a triviality about evaluating a product. It becomes an algorithm when the evaluation points are chosen so that both evaluations and the return to coefficients are fast.

The roots of unity provide exactly that. Let $\omega_n = e^{2\pi i/n}$, a primitive $n$-th root. The values

$$
A(\omega_n^0), \; A(\omega_n^1), \; \ldots, \; A(\omega_n^{n-1})
$$

are the **discrete Fourier transform** of the coefficient vector. The transform has a recursive structure because the even-indexed coefficients and the odd-indexed coefficients are themselves polynomials:

$$
A(x) = E(x^2) + x O(x^2), \qquad E(y) = \sum_i a_{2i} y^i, \quad O(y) = \sum_i a_{2i+1} y^i.
$$

When $x = \omega_n^j$, the square $x^2 = \omega_n^{2j} = \omega_{n/2}^j$ is a power of the half-size root. So the $n$ evaluations of $A$ are determined by the $n/2$ evaluations of $E$ and the $n/2$ evaluations of $O$ at the $(n/2)$-th roots. The recursion has two subproblems of half the size and linear work to combine them, which gives the $O(n \log n)$ bound.

The second half of the insight is that the inverse is the same transform run backwards. Conjugating every root sends $\omega_n$ to $\omega_n^{-1}$, and dividing by $n$ compensates for the fact that the forward transform multiplies the coefficient vector by a matrix whose columns are not normalized. Nothing in the inverse requires a different program, only a flag and one scale factor.

## Visual intuition

The recursion is a binary tree. At each node, the coefficient list is split into its even and odd positions, the two halves are transformed, and the results are combined with the twiddle factors.

```text
                    A: 0 1 2 3 4 5 6 7
                   /                   \
          even: 0 2 4 6            odd: 1 3 5 7
           /        \               /        \
        0 4        2 6           1 5        3 7
        / \        / \           / \        / \
       0   4      2   6         1   5      3   7
```

The leaves are single coefficients. Walking back up, each pair of leaves becomes a two-point transform, each pair of two-point transforms becomes a four-point transform, and the root is the eight-point transform.

The combining step is a **butterfly**. It takes two values $u$ and $v$ from the two child transforms, multiplies $v$ by a twiddle factor $w$, and writes the sum and the difference:

```text
u ──────────────●───────────── u + w v
                │
v ──► (× w) ────●───────────── u − w v
```

One complex multiplication, one addition, one subtraction. The upper output is the value at $\omega_n^j$, and the lower output is the value at $\omega_n^{j+n/2}$, which is the same formula with the sign of the twiddle flipped.

The iterative implementation runs this tree bottom-up. It first permutes the coefficients into the order of the leaves, which is the **bit-reversal permutation**:

| Index | Binary | Reversed | New position |
| ----- | ------ | -------- | ------------ |
| 0     | 000    | 000      | 0            |
| 1     | 001    | 100      | 4            |
| 2     | 010    | 010      | 2            |
| 3     | 011    | 110      | 6            |
| 4     | 100    | 001      | 1            |
| 5     | 101    | 101      | 5            |
| 6     | 110    | 011      | 3            |
| 7     | 111    | 111      | 7            |

After the permutation, the leaves of every subtree are contiguous, so each level of the tree is one pass over the array with a stride of the current block size. No recursion, no temporary arrays, and no pointer chasing: the whole transform is two nested loops over the same two arrays.

The picture also shows why the padding matters. A transform of length $n$ computes the convolution _cyclically_: coefficient $k$ and coefficient $k+n$ land on top of each other. If the true product has more than $n$ coefficients, the high ones wrap around and corrupt the low ones. Padding both inputs with zeros to a length at least as large as the number of coefficients in the product is what turns the cyclic convolution into the linear one.

## Formal model

::: math definition Definition
A **polynomial** of degree less than $n$ over a field is a formal sum $A(x) = \sum_{i=0}^{n-1} a_i x^i$. The vector $(a_0, \ldots, a_{n-1})$ is its **coefficient representation**.
:::

::: math definition Definition
The **convolution** of two coefficient vectors $a$ and $b$ is the vector $c$ with

$$
c_k = \sum_{i=0}^{k} a_i b_{k-i}, \qquad 0 \le k < n + m - 1,
$$

where $a_i = 0$ for $i \ge n$ and $b_j = 0$ for $j \ge m$. It is the coefficient vector of the product polynomial.
:::

::: math definition Definition
Let $n$ be a positive integer and let $\omega_n = e^{2\pi i/n}$. The **discrete Fourier transform** of $a \in \mathbb{C}^n$ is the vector $\hat a$ with

$$
\hat a_j = \sum_{k=0}^{n-1} a_k \omega_n^{jk}, \qquad 0 \le j < n.
$$

The **inverse transform** is

$$
a_k = \frac{1}{n} \sum_{j=0}^{n-1} \hat a_j \omega_n^{-jk}.
$$
:::

::: math lemma Lemma
For every $n \ge 2$, $\omega_n^2$ is a primitive $(n/2)$-th root of unity, and $\omega_n^{j+n/2} = -\omega_n^j$ for every $j$.
:::

::: math proof Proof
The first claim is $(\omega_n^2)^{n/2} = \omega_n^n = 1$, and no smaller positive power is $1$ because $\omega_n$ has order $n$. For the second, $\omega_n^{n/2} = e^{\pi i} = -1$, so $\omega_n^{j+n/2} = \omega_n^j \omega_n^{n/2} = -\omega_n^j$. $\square$
:::

::: math lemma Lemma
For an integer $d$ and an $n$-th root of unity $\omega$,

$$
\sum_{j=0}^{n-1} \omega^{jd} =
\begin{cases}
n, & \text{if } n \mid d, \\
0, & \text{otherwise.}
\end{cases}
$$
:::

::: math proof Proof
If $n \mid d$, every term is $1$ and the sum is $n$. Otherwise let $r = \omega^d \ne 1$. The sum is a finite geometric series,

$$
\sum_{j=0}^{n-1} r^j = \frac{r^n - 1}{r - 1} = \frac{(\omega^n)^d - 1}{r - 1} = 0,
$$

because $\omega^n = 1$. $\square$
:::

::: math theorem Convolution theorem
Let $a$ and $b$ have length $n$, and let $c = a \ast b$ be their cyclic convolution of length $n$. Then

$$
\hat c_j = \hat a_j \hat b_j, \qquad 0 \le j < n.
$$
:::

::: math proof Proof
Expand the transform of $c$ and substitute the definition of cyclic convolution:

$$
\hat c_j = \sum_{k=0}^{n-1} \left( \sum_{i=0}^{n-1} a_i b_{(k-i) \bmod n} \right) \omega_n^{jk}.
$$

Put $m = (k - i) \bmod n$, so $k \equiv i + m \pmod n$ and $\omega_n^{jk} = \omega_n^{j(i+m)}$ because $\omega_n^{jn} = 1$. Then

$$
\hat c_j = \sum_{i=0}^{n-1} a_i \omega_n^{ji} \sum_{m=0}^{n-1} b_m \omega_n^{jm} = \hat a_j \hat b_j.
$$

$\square$
:::

::: math theorem Inversion
The inverse formula of the definition holds for every vector $\hat a$ that is the transform of some $a$.
:::

::: math proof Proof
Substitute the forward transform into the inverse formula:

$$
\frac{1}{n} \sum_{j=0}^{n-1} \hat a_j \omega_n^{-jk}
= \frac{1}{n} \sum_{j=0}^{n-1} \sum_{l=0}^{n-1} a_l \omega_n^{jl} \omega_n^{-jk}
= \sum_{l=0}^{n-1} a_l \left( \frac{1}{n} \sum_{j=0}^{n-1} \omega_n^{j(l-k)} \right).
$$

By the geometric-sum lemma the inner sum is $1$ when $l = k$ and $0$ otherwise, so the whole expression is $a_k$. $\square$
:::

::: math theorem Linear convolution
Let $N$ be a power of two with $N \ge n + m - 1$. Pad $a$ and $b$ with zeros to length $N$. Then the cyclic convolution of the padded vectors of length $N$ equals the linear convolution, and its first $n + m - 1$ entries are the coefficients of $A(x)B(x)$.
:::

::: math proof Proof
The cyclic convolution of the padded vectors is $\sum_i a_i b_{(k-i) \bmod N}$. Since $b_j = 0$ for $j \ge m$ and $a_i = 0$ for $i \ge n$, a product can only be nonzero when $0 \le k - i < m$. When $k - i < 0$, the wrapped index is $k - i + N \ge N - n + 1 \ge m$, so $b$ is zero there as well. Hence for $0 \le k < n + m - 1$ the cyclic sum keeps only the ordinary terms and equals the linear convolution. $\square$
:::

## Algorithm derivation

The derivation has five steps.

**Step 1: pad both lists.** Choose $N$, the smallest power of two with $N \ge n + m - 1$, and extend both coefficient arrays with zeros to length $N$. The padding is not an optimization; without it the transform computes a cyclic convolution and the high coefficients wrap into the low ones.

**Step 2: write the transform recursively.** For a coefficient vector $a$ of length $n$,

```cpp
vector<complex<double>> dft(const vector<complex<double>>& a) {
    int n = a.size();
    if (n == 1) return a;
    vector<complex<double>> even(n / 2), odd(n / 2);
    for (int i = 0; i < n / 2; i++) {
        even[i] = a[2 * i];
        odd[i] = a[2 * i + 1];
    }
    even = dft(even);
    odd = dft(odd);
    vector<complex<double>> out(n);
    for (int j = 0; j < n / 2; j++) {
        complex<double> w = polar(1.0, 2.0 * PI * j / n);
        out[j] = even[j] + w * odd[j];
        out[j + n / 2] = even[j] - w * odd[j];
    }
    return out;
}
```

The two lines that write `out[j]` and `out[j + n / 2]` are the butterfly. They use the same product $w \cdot \text{odd}[j]$ twice, and the second output differs only in the sign.

**Step 3: replace the recursion with bit reversal and in-place stages.** The recursion always splits even indices from odd ones. If the coefficients are first permuted so that the leaves of the recursion tree are contiguous, the tree can be processed bottom-up. At the stage with block length $m$, every block is combined with the next block using twiddle factors of order $m$:

```cpp
for (int len = 2; len <= n; len <<= 1) {
    double angle = 2.0 * PI / len;
    complex<double> wlen(cos(angle), sin(angle));
    for (int start = 0; start < n; start += len) {
        complex<double> w(1.0, 0.0);
        for (int k = 0; k < len / 2; k++) {
            complex<double> u = a[start + k];
            complex<double> v = a[start + k + len / 2] * w;
            a[start + k] = u + v;
            a[start + k + len / 2] = u - v;
            w *= wlen;
        }
    }
}
```

The outer loop runs $\log_2 n$ times. The middle loop touches every block once, and the inner loop runs $m/2$ times per block, so each stage performs $n/2$ butterflies.

**Step 4: multiply pointwise.** After both forward transforms, replace $\hat a_j$ by $\hat a_j \hat b_j$ for every $j$. This is the only place where the two polynomials interact, and it costs $n$ complex multiplications.

**Step 5: invert and round.** Run the same butterfly network with the conjugate angle, divide every entry by $n$, and round the real parts to the nearest integer. The imaginary parts are zero up to rounding error and are discarded.

The inverse transform uses the identity $\omega_n^{-j} = \overline{\omega_n^{j}}$. In code, the angle changes sign; the butterfly itself is unchanged.

## Step-by-step execution

Multiply $A(x) = 1 + 2x$ and $B(x) = 3 + 4x$. The exact product is $C(x) = 3 + 10x + 8x^2$, with three coefficients. Pad both inputs to $N = 4$.

**Bit reversal.** For $N = 4$ the permutation sends $0, 1, 2, 3$ to $0, 2, 1, 3$, so the padded arrays become

$$
a' = (1, 0, 2, 0), \qquad b' = (3, 0, 4, 0).
$$

**Stage with block length 2.** The twiddle factor is $\omega_2^0 = 1$. Each adjacent pair is replaced by its sum and difference:

$$
a' = (1, 1, 2, 2), \qquad b' = (3, 3, 4, 4).
$$

**Stage with block length 4.** The twiddle factors are $\omega_4^0 = 1$ and $\omega_4^1 = i$. The first half holds the two-point transform of the even coefficients, and the second half holds the two-point transform of the odd coefficients:

| $j$ | $u = a'[j]$ | $v = a'[j+2]$ | $a'[j] = u + i^j v$ | $a'[j+2] = u - i^j v$ |
| --- | ----------- | ------------- | ------------------- | --------------------- |
| 0   | $1$         | $2$           | $3$                 | $-1$                  |
| 1   | $1$         | $2$           | $1 + 2i$            | $1 - 2i$              |

So the transform of $A$ is $(3, 1 + 2i, -1, 1 - 2i)$. The same computation on $B$ gives $(7, 3 + 4i, -1, 3 - 4i)$. These are, as they must be, the values of the two polynomials at $1, i, -1, -i$:

$$
A(1) = 3, \quad A(i) = 1 + 2i, \quad A(-1) = -1, \quad A(-i) = 1 - 2i.
$$

**Pointwise multiplication.**

$$
(21, \; (1 + 2i)(3 + 4i), \; 1, \; (1 - 2i)(3 - 4i))
= (21, \; -5 + 10i, \; 1, \; -5 - 10i).
$$

**Inverse transform.** Run the butterflies with $\omega_4^{-1} = -i$ and divide by $4$. The result is $(3, 10, 8, 0)$. The first three entries are the coefficients of $C$, and the fourth is the zero coefficient that the padding created.

A check is cheaper than the inverse: the exact product evaluated at the four roots gives $C(1) = 21$, $C(i) = -5 + 10i$, $C(-1) = 1$, and $C(-i) = -5 - 10i$, which are exactly the four values that were multiplied. The inverse transform is only needed because the answer has to be printed as coefficients.

**A three-coefficient product.** For $A = 1 - 2x + 3x^2$ and $B = 4 + 5x - 6x^2$, the product is $4 - 3x - 4x^2 + 27x^3 - 18x^4$. The direct convolution performs $9$ products; the transform pads to $8$, performs $3 \ast 12 = 36$ butterflies, and returns the same five coefficients. At this size the FFT is more work, which is why the naive loop is the right choice for small polynomials.

## Correctness proof

::: math lemma Lemma
The recursive `dft` returns $A(\omega_n^j)$ for every $j$ with $0 \le j < n$.
:::

::: math proof Proof
Induct on $n$. For $n = 1$ the only value is $a_0$ at $\omega_1^0 = 1$.

For $n > 1$, the even part $E$ has coefficients $a_0, a_2, \ldots$ and the odd part $O$ has coefficients $a_1, a_3, \ldots$, both of length $n/2$. By the induction hypothesis, the recursive calls return $E(\omega_{n/2}^j)$ and $O(\omega_{n/2}^j)$ for $0 \le j < n/2$.

For $0 \le j < n/2$, the algorithm writes

$$
\text{out}[j] = E(\omega_{n/2}^j) + \omega_n^j O(\omega_{n/2}^j).
$$

Since $\omega_{n/2}^j = \omega_n^{2j}$,

$$
\text{out}[j] = E(\omega_n^{2j}) + \omega_n^j O(\omega_n^{2j}) = A(\omega_n^j),
$$

by the decomposition $A(x) = E(x^2) + x O(x^2)$.

For the second half, let $j' = j + n/2$. The twiddle is $\omega_n^{j'} = \omega_n^j \omega_n^{n/2} = -\omega_n^j$, and the squared argument is $\omega_n^{2j'} = \omega_n^{2j} \omega_n^n = \omega_n^{2j}$. Therefore

$$
\text{out}[j + n/2] = E(\omega_n^{2j}) - \omega_n^j O(\omega_n^{2j}) = A(\omega_n^{j+n/2}).
$$

Both halves are correct, so the transform is correct. $\square$
:::

::: math theorem Theorem
The iterative algorithm computes the same vector as the recursive one.
:::

::: math proof Proof
The bit-reversal permutation places the leaves of every subtree of the recursion tree in a contiguous block, with the even child before the odd child. The stage with block length $m$ takes two adjacent blocks that hold the transforms of the two children of one node and writes the transform of that node, using exactly the butterfly of the recursive code. Each stage therefore processes one level of the tree, and the final stage processes the root. By induction on the level, every block holds the transform of its node when its stage finishes, so the whole array holds the transform of the input. $\square$
:::

::: math invariant Invariant
After the stage with block length $m$ finishes, every block of $m$ consecutive entries is the length-$m$ transform, in natural order, of the coefficient sequence of one node of the recursion tree. The next stage combines two sibling blocks into the length-$2m$ transform of their parent.
:::

::: math theorem Theorem
If the padded transform length is $N \ge n + m - 1$, and if every computed coefficient satisfies $|\tilde c_k - c_k| < 1/2$, then rounding the real part to the nearest integer returns the exact coefficient of $A(x)B(x)$.
:::

::: math proof Proof
The linear-convolution theorem shows that the cyclic convolution of the padded arrays is the linear convolution, so the transformed product is the coefficient vector of $A(x)B(x)$. That vector has integer entries. If a computed entry is closer than $1/2$ to its exact value, the nearest integer is unique and equals that value, so the rounding recovers it. The imaginary parts are rounding noise around zero and are discarded. $\square$
:::

The last theorem separates the algebra from the numerics. The algebra is exact: with exact arithmetic, the algorithm returns the exact integer coefficients. The hypothesis $|\tilde c_k - c_k| < 1/2$ is a statement about floating point, and it is the only part of the correctness argument that depends on the input sizes.

## Complexity analysis

| Operation                                | Time          | Space    |
| ---------------------------------------- | ------------- | -------- |
| Naive convolution of lengths $n$ and $m$ | $O(nm)$       | $O(n+m)$ |
| One FFT of length $N$                    | $O(N \log N)$ | $O(N)$   |
| Two forward transforms and one inverse   | $O(N \log N)$ | $O(N)$   |
| Pointwise product                        | $O(N)$        | $O(1)$   |
| Rounding and output                      | $O(n+m)$      | $O(1)$   |

The recursion for one transform is

$$
T(N) = 2T(N/2) + \Theta(N),
$$

which the master theorem solves as $\Theta(N \log N)$. The iterative version makes the same count visible: there are $\log_2 N$ stages, and each stage performs $N/2$ butterflies, so one transform costs $\frac{N}{2} \log_2 N$ butterflies. Three transforms and $N$ pointwise products give roughly $\frac{3N}{2} \log_2 N$ butterflies in total.

The padding at most doubles the needed length: the smallest power of two at or above $n + m - 1$ is less than $2(n + m - 1)$. For two polynomials of length $10^5$, the product has $199\,999$ coefficients, the transform length is $262\,144 = 2^{18}$, and one transform costs about $2.36$ million butterflies. The naive convolution would perform $10^{10}$ products.

The space is linear because the iterative transform works in place. The recursive version also uses $O(N)$ memory, but it allocates a fresh output vector at every node and holds $O(\log N)$ frames, so its constant is larger.

The floating-point cost is the hidden dimension of the analysis. A double has 53 bits of mantissa. The transform error grows roughly like $\varepsilon \log N$ times the magnitude of the largest intermediate sum, where $\varepsilon \approx 2.2 \times 10^{-16}$. If the largest coefficient of the product is around $10^{15}$, the absolute error is already a measurable fraction of one unit, and rounding becomes unreliable. The safe envelope for a plain complex FFT is usually quoted as coefficients up to about $10^{14}$ in absolute value; beyond that, split the coefficients into 15-bit halves or use an NTT. The Pascal variant is a reference, not a production implementation, and the same precision argument applies to it.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Both polynomials have fewer than a few thousand coefficients | The naive double loop |
| Degrees around $10^4$ and the coefficients are small | Karatsuba, or the FFT if a library is available |
| Degrees around $10^5$ or more, small coefficients | The complex FFT with padding |
| The answer is modulo $998\,244\,353$ or $469\,762\,049$ | A number-theoretic transform |
| The answer is modulo an arbitrary prime | Three NTTs and the Chinese remainder theorem |
| Coefficients up to $10^9$ and the product coefficient can reach $10^{23}$ | Split each coefficient into 15-bit halves, or use NTT |
| Multiply two big integers of $10^5$ digits | FFT in base $2^{15}$, then propagate carries |
| Match a pattern against a text with wildcards | One FFT per character class, or the $\pm 1$ encoding |
| The convolution must be produced online | A block decomposition or a relaxed convolution |
| The transform length is prime and must not be padded | Bluestein's chirp-z algorithm |

The third and fourth rows are the practical fork. The complex FFT is shorter to write and works for any length after padding, but its rounding must be controlled. The NTT is exact and usually faster, but it requires a modulus with a large power of two dividing $p - 1$, and it answers only the modular question.

The last row is the one that surprises people. Padding always works for a linear convolution, because a longer power of two is always available. Bluestein's algorithm exists for the case where the transform itself must have a prescribed prime length, for example inside a larger mixed-radix scheme. It is not needed for the problems in this article.

## Reference implementations

All six programs share one contract.

- **Input:** $n$ on the first line, then $n$ coefficients; $m$ on the next line, then $m$ coefficients. Any whitespace separates the integers.
- **Output:** the $n + m - 1$ coefficients of the product, from degree $0$ upward, separated by spaces on one line and rounded to the nearest integer.

Every program pads both lists to the same power of two, runs the iterative radix-2 transform in place, multiplies pointwise, inverts, and rounds. The rounding is identical in all six: add $0.5$ to a non-negative value or subtract $0.5$ from a negative one, then truncate toward zero. That is round-half-away-from-zero, and it avoids the three different tie rules of the languages' built-in round functions.

| Language   | File                    | Representation                                     |
| ---------- | ----------------------- | -------------------------------------------------- |
| C          | `c/program.c`           | Four `double` arrays, `malloc` and `realloc`       |
| C++17      | `cpp17/program.cpp`     | Four `std::vector<double>`                         |
| Java       | `java/Main.java`        | Four `double` arrays, `StreamTokenizer` input      |
| Python     | `python/program.py`     | Four lists of floats                               |
| Pascal     | `pascal/program.pas`    | Four dynamic `Double` arrays, one `Read` at a time |
| JavaScript | `javascript/program.js` | Four `Array` objects of `Number`                   |

The Pascal and JavaScript listings are educational references, not USACO submission languages. The Pascal variant keeps the real and imaginary parts in separate arrays because the browser compiler has no complex type, and it reads every coefficient with a single-argument `Read`.

The programs are references, not precision-hardened libraries. They are correct for coefficients and lengths whose exact product stays well below $2^{53}$, which covers every fixture and the small worked examples. A contest solution that meets 32-bit coefficients at full length needs the splitting or NTT technique described in the next sections.

## Recursion decision

The transform has an obvious recursive form, and the reference programs are iterative for speed and for simplicity.

The recursion depth is $\log_2 N$: at most $18$ for $N = 2^{18}$, and at most $20$ for a million-point transform. Every language in this encyclopedia can hold that many frames, so stack overflow is not the reason to avoid recursion. The reasons are allocation and locality. The recursive version allocates a new output vector at every node, performs $O(N \log N)$ copying in total, and jumps between memory locations that are far apart. The iterative version allocates four arrays once, writes in place, and streams through them in two nested loops.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames | Iterative, for speed and one allocation |
| Java | About $10^4$ frames | Iterative, and to avoid per-node arrays |
| Python | Interpreter limit of 1000 | Iterative, because 20 frames are safe but 20 allocations are not free |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The bit-reversal permutation is also naturally recursive, but it is written as a loop with a single index and a single bit mask. The loop version is shorter, it needs no stack, and it runs in $O(N)$ with a tiny constant. There is no part of the FFT that benefits from recursion at the sizes this encyclopedia targets.

## Implementation walkthrough

The first detail is the bit-reversal loop.

```cpp
int j = 0;
for (int i = 1; i < n; i++) {
    int bit = n >> 1;
    while (j & bit) {
        j ^= bit;
        bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
        swap(re[i], re[j]);
        swap(im[i], im[j]);
    }
}
```

The variable `j` is the bit reversal of `i`. The inner loop finds the lowest set bit of `j` and carries the increment across it, which is the binary increment applied to the reversed index. Swapping only when `i < j` performs each exchange once.

The second detail is the butterfly.

```cpp
for (int k = 0; k < half; k++) {
    double u_re = re[start + k];
    double u_im = im[start + k];
    double v_re = re[start + k + half] * w_re - im[start + k + half] * w_im;
    double v_im = re[start + k + half] * w_im + im[start + k + half] * w_re;
    re[start + k] = u_re + v_re;
    im[start + k] = u_im + v_im;
    re[start + k + half] = u_re - v_re;
    im[start + k + half] = u_im - v_im;
    double next_re = w_re * wlen_re - w_im * wlen_im;
    w_im = w_re * wlen_im + w_im * wlen_re;
    w_re = next_re;
}
```

The complex product is written out in real arithmetic, so the same code exists in all six languages. The twiddle $w$ is advanced by multiplying by $w_{\text{len}}$ rather than by calling `cos` and `sin` inside the inner loop. That one change replaces $N \log N$ trigonometric calls with $N \log N$ complex multiplications, and it is the difference between a fast program and a slow one.

The third detail is the sign and the scale of the inverse.

```cpp
double angle = (invert ? -2.0 : 2.0) * PI / len;
```

The forward transform uses the positive angle and the inverse uses the negative one, and after the inverse every entry is divided by $N$. A program that forgets the division returns every coefficient $N$ times too large; a program that uses the wrong sign returns the coefficients reversed modulo $N$, which looks plausible on symmetric inputs and is wrong on everything else.

The fourth detail is the rounding.

```cpp
long long round_half_away(double x) {
    return (long long)(x >= 0.0 ? x + 0.5 : x - 0.5);
}
```

The C cast truncates toward zero, so adding $0.5$ to a positive value and subtracting $0.5$ from a negative one gives round-half-away-from-zero. Java's cast behaves the same way. Python uses `math.floor` and `math.ceil`, JavaScript uses `Math.floor` and `Math.ceil`, and Pascal uses `Trunc`, which also truncates toward zero. The explicit rule matters because Python's `round` uses banker's rounding, JavaScript's `Math.round` breaks ties toward $+\infty$, and Pascal's `Round` uses banker's rounding as well.

The fifth detail is the output. The coefficients are stored as `double`, but they are printed as integers after rounding. Printing the raw `double` with `%f` or `FloatToStr` would show `8.000000000000002` on some inputs and expose the rounding noise that the algorithm is supposed to remove.

The sixth detail is the padding length.

```cpp
int total = n + m - 1;
int size = 1;
while (size < total) size <<= 1;
```

The loop must use `<`, not `<=`, and it must start from the number of coefficients in the product rather than the larger of the two input lengths. Two polynomials of length $n$ produce $2n - 1$ coefficients, and a transform of length $n$ wraps the last $n - 1$ of them into the first $n - 1$. That is the failure discussed next.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Padding to the larger input length | The cyclic convolution wraps and the low coefficients are wrong | Pad to at least $n + m - 1$ |
| Forgetting to divide by $N$ after the inverse | Every coefficient is $N$ times too large | Scale the inverse transform |
| Using the same sign for both transforms | The inverse produces the reversed coefficient order | Negate the angle for the inverse transform |
| Rounding inside the recursion or after each stage | The noise is amplified and the final rounding is wrong | Round only the final real parts |
| Recomputing `cos` and `sin` in the inner loop | The program is correct and many times too slow | Advance the twiddle by multiplication |
| Storing the coefficients in a 32-bit integer | The product overflows before it is printed | Use `long long` or an exact wide type |
| Trusting a complex FFT with 32-bit coefficients at full length | The rounding error exceeds one half | Split into 15-bit halves or use an NTT |
| Treating the transform as exact for every input | A silent wrong answer on the large cases | Check the magnitude bound or use an NTT |
| Using `Math.round` or `Round` for the final step | Ties and negatives can round the wrong way | Use one explicit half-away-from-zero rule |
| Transforming only one polynomial | The pointwise product is not a product of two transforms | Transform both, then multiply |

### Why this fails: padding to the wrong length

The plausible wrong solution pads both inputs to the next power of two above the longer input. For two polynomials of degree $1$, both lengths are $2$, so the transform length is $2$. Multiply $A = 1 + x$ and $B = 1 + x$: the padded vectors are $(1, 1)$ and $(1, 1)$, their transforms are $(2, 0)$ and $(2, 0)$, and the pointwise product is $(4, 0)$. The inverse of $(4, 0)$ over two points is $(2, 2)$, so the program prints $2 + 2x$.

The correct product is $1 + 2x + x^2$, whose coefficients are $(1, 2, 1)$. The coefficient $1$ of $x^2$ wrapped around and was added to the constant term, giving $2$ in position $0$ and dropping the quadratic term entirely. The output has the right length only because the program printed the length it expected, not because the transform produced it.

The fix is to pad to the smallest power of two at least $n + m - 1$. For this example that is $4$, the transforms are $(2, 1+i, 0, 1-i)$ and the same, the pointwise product is $(4, 2i, 0, -2i)$, and the inverse is $(1, 2, 1, 0)$. The last zero is the padding, and the first three values are the answer.

The same failure has a second form: padding to a power of two but forgetting that the product's degree is $n + m - 2$, not $n + m - 1$. The length of the coefficient vector is one more than the degree, and using the degree instead of the length makes the transform one entry too short whenever the degree is a power of two.

### Why this fails: an unscaled inverse

The second common failure is an inverse transform without the division by $N$. Take the same $A = 1 + x$ and $B = 1 + x$ padded to $4$. The forward transforms and the pointwise product are as above, and the inverse butterflies with the conjugate angle produce $(4, 8, 4, 0)$ before scaling. Dividing by $4$ gives $(1, 2, 1, 0)$. A program that skips the division prints $4, 8, 4, 0$, which is exactly four times the right answer.

There is no input on which this error cancels, because the scale factor is the transform length and the transform length is at least as large as the product's degree. The check is to run one constant polynomial through the program: the transform of $(c, 0, \ldots, 0)$ is the constant vector $(c, c, \ldots, c)$, the pointwise product with another constant is $(cd, \ldots, cd)$, and the inverse with the scale returns $(cd, 0, \ldots, 0)$. Without the scale it returns $(Ncd, 0, \ldots, 0)$, which is impossible to miss.

## Variants and extensions

- **The number-theoretic transform.** Replace the complex roots with powers of a primitive root modulo a prime $p$ of the form $c \cdot 2^k + 1$. The butterflies are modular arithmetic, so the result is exact, and the cost is the same $O(n \log n)$. The common moduli are $998\,244\,353 = 119 \cdot 2^{23} + 1$ and $469\,762\,049 = 7 \cdot 2^{26} + 1$.
- **Three NTTs and the Chinese remainder theorem.** To convolve modulo an arbitrary prime, run the transform under three NTT-friendly primes whose product exceeds the largest exact coefficient, then reconstruct each coefficient with the Chinese remainder theorem.
- **Coefficient splitting.** Write each coefficient as $a = a_0 + 2^{15} a_1$. A product of two such numbers is a sum of three convolutions of 15-bit pieces, which keeps every intermediate below $2^{53}$ and makes one complex FFT precise enough for 32-bit input.
- **Karatsuba multiplication.** Split each polynomial into a low and a high half and use three recursive multiplications. It is $O(n^{1.585})$, simpler than the FFT, and the right choice when the length is moderate or the coefficients are exact integers that must not be rounded.
- **Bluestein's algorithm.** Rewrites a transform of arbitrary length as a convolution, so a power-of-two FFT can compute a transform of prime length. It is the standard tool for lengths that cannot be padded.
- **The real-input FFT.** Two real transforms can be packed into one complex transform by putting one in the real part and one in the imaginary part. It halves the constant of the polynomial multiplication and is common in production libraries.
- **Multidimensional transforms.** The same butterflies apply along each axis, giving $O(N_1 N_2 (\log N_1 + \log N_2))$ for a two-dimensional convolution. Image correlation and two-dimensional pattern matching use this form.
- **Generating functions.** A product of polynomials is a convolution of their coefficients, so the FFT computes coefficients of products of generating functions: subset counts, coin-change counts, and the number of ways to reach a sum with a multiset of moves.
- **String matching.** The $\pm 1$ encoding turns the Hamming distance at every shift into one convolution, which handles wildcards and large alphabets without a per-character scan of the text.

## Contest strategy

1. Decide whether the answer is a convolution before writing any code. The phrase "for every sum" or "for every shift" is the signal; a double loop over pairs is the fallback.
2. Compute the exact product length $n + m - 1$ and pad to the next power of two. Write the length computation before the transform, so the padding cannot be forgotten.
3. If the modulus is NTT-friendly, use the NTT. It is exact and usually avoids the precision argument entirely.
4. If the coefficients are large and the answer must be exact, split them or use several NTT moduli. Do not trust a complex FFT whose largest coefficient is near $10^{15}$.
5. Use one explicit rounding rule in every language. Round-half-away-from-zero is the easiest to reproduce, and it is what the reference programs do.
6. Advance the twiddle factors by multiplication. Trigonometric calls in the inner loop dominate the running time on large inputs.
7. Test the small cases: a constant polynomial, a single-term product, a product whose length is exactly a power of two, and a product whose length is one more than a power of two. The last two catch the padding and the length errors.
8. Compare against the naive convolution on random small inputs before submitting. It is the fastest way to catch a sign, a scale, or an indexing error.

## Worked problems

### Problem 1: Polynomial Multiplication 2

**Restatement.** The input begins with the number of test cases, which is always $1$, then a degree $n \le 131\,071$ and $n + 1$ coefficients, then a degree $m$ and $m + 1$ coefficients. All coefficients fit in a signed 32-bit integer. Print the product in the same format, with its degree first.

**Naive baseline.** The double loop performs $(n+1)(m+1)$ products, about $1.7 \times 10^{10}$ at the maximum degree.

**Insight.** The product's coefficients are a convolution, and the FFT computes a convolution in $O(N \log N)$ after padding to $N = 2^{18}$.

**Derivation.** Pad both lists to $N$, transform both, multiply pointwise, invert, and round. The output degree is $n + m$.

**Correctness.** The convolution theorem gives the coefficients of the product, and the padding length $N \ge n + m + 1$ removes the cyclic wrap.

**Complexity.** $O(N \log N)$ time and $O(N)$ space, with $N = 2^{18}$ at the maximum degree.

**Common wrong approach.** Using a plain complex FFT with 32-bit coefficients at the maximum degree. The exact coefficients can reach about $6 \times 10^{23}$, far beyond the $2^{53}$ range in which a double rounds correctly. A correct solution splits the coefficients into 15-bit halves or uses an NTT with the Chinese remainder theorem.

### Problem 2: Substring 2

**Restatement.** Given binary strings $S$ and $T$ with $1 \le \lvert T \rvert \le \lvert S \rvert \le 10^6$, find the smallest number of characters of $T$ that must be changed so that $T$ becomes a substring of $S$.

**Naive baseline.** For every one of the $\lvert S \rvert - \lvert T \rvert + 1$ shifts, compare $\lvert T \rvert$ characters. The worst case is about $10^{12}$ comparisons.

**Insight.** Encode bit $0$ as $+1$ and bit $1$ as $-1$. For a window $W$ of $S$ aligned with $T$, the sum $\sum_j W_j T_j$ equals the number of matches minus the number of mismatches. Since the window and the pattern have the same length $\lvert T \rvert$, the mismatch count is $\tfrac{1}{2}(\lvert T \rvert - \sum_j W_j T_j)$.

**Derivation.** Reverse $T$ and convolve it with the $\pm 1$ encoding of $S$. The coefficient at index $\lvert T \rvert - 1 + s$ is exactly the sum for the window starting at $s$. Take the minimum of the mismatch count over the valid shifts.

**Correctness.** Each position contributes $+1$ when the bits agree and $-1$ when they differ, because the product of equal signs is $+1$ and the product of opposite signs is $-1$. The sum is matches minus mismatches, and matches plus mismatches is $\lvert T \rvert$, so the formula for the mismatch count is exact.

**Complexity.** One convolution of length about $2 \lvert S \rvert$, so $O(\lvert S \rvert \log \lvert S \rvert)$ time and $O(\lvert S \rvert)$ space.

**Common wrong approach.** Minimizing over every coefficient of the convolution instead of only the $\lvert S \rvert - \lvert T \rvert + 1$ valid shifts. The padding and the partial overlaps at the ends produce coefficients that correspond to no window, and one of them is often smaller than the true answer.

### Problem 3: Nikita and Order Statistics

**Restatement.** Given $n \le 2 \times 10^5$ integers and a threshold $x$, print $n + 1$ answers. Answer $k$ is the number of subarrays that contain exactly $k$ elements strictly less than $x$.

**Naive baseline.** For every subarray, count its elements below $x$, which is $O(n^3)$, or extend each left endpoint and maintain the count, which is $O(n^2)$.

**Insight.** Replace each element by $1$ if it is below $x$ and $0$ otherwise, and let $\text{pref}[i]$ be the prefix sum. A subarray from $l + 1$ through $r$ has exactly $k$ qualifying elements exactly when $\text{pref}[r] - \text{pref}[l] = k$. Counting such pairs for every $k$ is a cross-correlation of the histogram of prefix sums with itself.

**Derivation.** Let $\text{cnt}[v]$ be the number of indices $i$ with $\text{pref}[i] = v$, for $0 \le i \le n$. Let $R[v] = \text{cnt}[n - v]$ be the reversed histogram, and let $D = \text{cnt} \ast R$. Then

$$
D[n + k] = \sum_{i} \text{cnt}[i] \, \text{cnt}[i - k] = \sum_{l} \text{cnt}[l] \, \text{cnt}[l + k],
$$

which is the number of ordered pairs of prefixes whose sums differ by $k$. For $k > 0$ the prefix sums are nondecreasing, so every prefix with value $l + k$ comes after every prefix with value $l$, and every such pair is a non-empty subarray. For $k = 0$ the sum counts the $n + 1$ diagonal pairs once and every unordered pair of distinct prefixes twice, so the answer is $(D[n] - (n + 1))/2$.

**Correctness.** The prefix difference is exactly the number of qualifying elements in the subarray, so the pair count and the subarray count are the same number. For $k > 0$ the nondecreasing prefix sums make every ordered pair a valid subarray. For $k = 0$ the diagonal pairs are empty and every other pair is counted twice, which the subtraction and the division by two correct exactly.

**Complexity.** One convolution of two arrays of length $n + 1$, so $O(n \log n)$ time and $O(n)$ space. Every answer fits in a signed 64-bit integer because there are at most $n(n+1)/2$ subarrays.

**Common wrong approach.** Forgetting the $n + 1$ diagonal pairs or the factor of two when $k = 0$, or indexing the convolution at $k$ instead of $n + k$. The first makes every zero answer too large or too small, and the second shifts the whole output by the length of the histogram.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a convolution: a sum over pairs with a fixed difference, a product of polynomials, or a comparison of a pattern with every window.
2. **Direct application.** Implement the recursive transform and the naive convolution, and check them against each other on random polynomials of length up to $64$.
3. **Iterative form.** Replace the recursion with bit reversal and in-place stages, and verify that both versions produce the same transform on every power-of-two length up to $1024$.
4. **Inversion and rounding.** Multiply two small integer polynomials with the full pipeline, and confirm that the rounded coefficients match the naive product exactly.
5. **Adaptation.** Solve a string-matching problem with the $\pm 1$ encoding, and a counting problem with a prefix-sum histogram. Both are the same transform with different coefficient lists.
6. **Combination.** Solve a problem that needs two convolutions, such as a product of several polynomials, or a convolution followed by a search over the coefficients.
7. **Precision.** Take a case with 32-bit coefficients and compare the plain complex FFT against an NTT. The disagreement is the lesson: the transform is exact only when the rounding hypothesis holds.
8. **Transfer.** Recognize the same sum in a generating-function expansion, a big-integer multiplication, and a two-dimensional pattern match.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the convolution theorem and prove it from the definition of the transform. (Formal model)
2. Why does the transform length have to be at least $n + m - 1$? (Key insight, Common mistakes)
3. What does the bit-reversal permutation do, and why is it needed in the iterative version? (Visual intuition, Correctness proof)
4. Write the butterfly equations for the two outputs of one pair of values. (Algorithm derivation)
5. What is the invariant of the iterative stages? (Correctness proof)
6. Why is the inverse transform the forward transform with a conjugated root and a division by $N$? (Formal model)
7. Trace the four-point transform of $1 + 2x$ and $3 + 4x$ through both stages. (Step-by-step execution)
8. How many butterflies does one transform of length $N$ perform, and how many transforms does a polynomial multiplication need? (Complexity analysis)
9. When is a plain complex FFT unsafe, and what are the two alternatives? (Complexity analysis, Algorithm selection)
10. What is the rounding rule used by the reference programs, and why not use the language's built-in round? (Implementation walkthrough)
11. Why is the iterative transform preferred over the recursive one when the depth is only about twenty? (Recursion decision)
12. For the Nikita problem, why must the $k = 0$ answer be corrected? (Worked problems)

## Further reading

- The arithmetic behind the roots of unity, the inverse, and Fermat's little theorem is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The transform that replaces the complex roots with modular ones, and the exactness argument that comes with it, are covered by the same modular arithmetic and by [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation), which shares the divide-and-conquer style.
- The generating functions whose coefficients the transform multiplies are in [generating functions](/algorithms/combinatorics/generating-functions), and the counts they produce are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The pattern-matching problem that becomes a convolution under the $\pm 1$ encoding is a relative of [KMP](/algorithms/strings/kmp), which solves the exact-match version without a transform.
- The recurrence that gives the $O(n \log n)$ bound is the same one analyzed in [complexity](/algorithms/foundations/complexity) and used by [merge sort](/algorithms/foundations/sorting).
- The search over a monotone predicate, which is often combined with a convolution when the answer is a threshold, is in [binary search](/algorithms/searching/binary-search).
- The subject index places this transform beside the rest of the arithmetic in [number theory](/algorithms/number-theory/).
- The original Cooley-Tukey paper is "An algorithm for the machine calculation of complex Fourier series" (1965). A standard treatment of the numerical error and of the NTT is in Cormen, Leiserson, Rivest and Stein, _Introduction to Algorithms_, and in Crandall and Pomerance, _Prime Numbers: A Computational Perspective_.
