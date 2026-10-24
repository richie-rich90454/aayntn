---
id: number-theory.euler-totient
title: Euler's totient function and Euler's theorem
summary: Count the integers coprime to n from its prime factorization, and use Euler's theorem to reduce a power modulo a modulus that shares no factor with the base.
division: [silver, gold, platinum]
subjects: [number-theory]
level: intermediate
importance: common-contest-technique
keywords:
    [
        euler's totient function,
        phi function,
        euler's theorem,
        coprime,
        exponent reduction,
        prime factorization,
        modular inverse,
    ]
prerequisites:
    required: [foundations.complexity, number-theory.modular-arithmetic]
    recommended:
        [
            number-theory.prime-factorization,
            number-theory.sieve,
            number-theory.extended-euclidean,
            foundations.binary-representation,
        ]
complexity:
    time: "O(sqrt n) for one totient, O(log m) for one power"
    space: "O(1)"
assumptions:
    - The inputs n and m are positive integers, and the base of the power is reduced modulo m before it is exponentiated.
    - The exponent is at most m - 1, so the product of two residues stays below m squared and a signed 64-bit integer holds it for m at most 10^9.
    - Euler's theorem is applied only when the base is coprime to the modulus, unless the exponent is corrected by the extra totient term described in the article.
implementations: number-theory.euler-totient
reviewed: false
---

## At a glance

Euler's totient function $\varphi(n)$ counts the integers in $[1, n]$ that are coprime to $n$. It is the size of the group of units modulo $n$, and that single fact produces almost every application of the function.

Four facts carry the technique.

1. **The totient follows from the factorization.** If $n = p_1^{a_1} \cdots p_k^{a_k}$, then $\varphi(n) = n \prod_{i=1}^{k} (1 - 1/p_i)$, and only the distinct primes matter, not their exponents.

2. **Euler's theorem.** When $\gcd(a, m) = 1$, $a^{\varphi(m)} \equiv 1 \pmod m$. Fermat's little theorem is the case where $m$ is prime, because $\varphi(p) = p - 1$.

3. **An exponent can be reduced.** For a base coprime to $m$, $a^{e} \equiv a^{e \bmod \varphi(m)} \pmod m$. This is the reason a power whose exponent is $10^{18}$ can still be computed.

4. **One totient costs $O(\sqrt n)$.** Trial division over the distinct prime factors is enough, and a sieve computes every totient up to a limit in nearly linear time.

The function is small, the theorem is short, and the mistakes are subtle: the coprimality condition, the convention $\varphi(1) = 1$, and the leftover prime factor are where submissions fail.

## Problem motivation

A counting problem asks how many fractions $x / n$ with $1 \le x \le n$ are already in lowest terms. The fraction is reduced exactly when $\gcd(x, n) = 1$, so the answer is $\varphi(n)$.

The same function answers a different-looking question. A problem asks for $3^{10^{18}} \bmod (10^9 + 7)$. The answer has about $4.8 \times 10^{17}$ digits, and the exponent itself is $10^{18}$, so the repeated-multiplication loop cannot run. Yet $10^9 + 7$ is prime, so $\varphi(10^9 + 7) = 10^9 + 6$, and Euler's theorem says the powers of $3$ repeat with period $10^9 + 6$. The exponent can be replaced by $10^{18} \bmod (10^9 + 6) = 36$ without changing the answer, and a binary exponentiation finishes in a handful of multiplications.

The problem is therefore not the size of the answer, which is below $10^9 + 7$. The problem is the size of the exponent, and a modulus whose structure is known is what makes the exponent smaller.

The reference program does both halves in one run. It reads three integers $n$, $m$ and $a$, prints $\varphi(n)$, and then prints $a^{\varphi(m)} \bmod m$. The second line is the smallest instance of the reduction: the exponent is already the period, so a base coprime to $m$ must produce $1$.

## Recognition patterns

The totient is the right tool when the statement contains some of these phrases.

- "Coprime", "relatively prime", "in lowest terms", "shares no factor with".
- "How many integers up to $n$ are not divisible by any prime factor of $n$".
- An exponent that is itself a power, a tower, or a number with more than eighteen digits.
- "Reduce the exponent", "period modulo $m$", "the powers repeat".
- A modulus $m$ that is composite and a division by a value that is coprime to $m$.
- RSA, primitive roots, or a count of residues with a given order.

The constraint values decide the algorithm.

| Constraint | What it rules |
| --- | --- |
| One $n \le 10^{12}$ | Trial division up to $\sqrt n$ costs at most $10^6$ iterations |
| Many queries, $n \le 10^7$ | A sieve of the totients is required |
| $n \le 10^{18}$ | Trial division is too slow; factor with a Miller-Rabin test first |
| The exponent is a power $b^{c}$ | Reduce $b^{c}$ modulo $\varphi(m)$, not modulo $m$ |
| The base is coprime to $m$ | Euler's theorem applies directly |
| The base shares a factor with $m$ | The plain reduction is invalid; the corrected exponent is needed |
| The modulus is prime | $\varphi(m) = m - 1$, and Fermat's little theorem is the short route |
| The modulus is a product of two known primes | $\varphi(m) = (p-1)(q-1)$, which is the RSA setting |
| The sum of all totients up to $N$ is needed | A sieve is too large for $N = 10^{10}$; a sublinear sum is required |

The sixth row is the one that costs submissions. Euler's theorem has two hypotheses, that the base is coprime to the modulus and that the modulus is a positive integer, and only the second is usually obvious. A problem with a base of $0$, or with a base equal to a prime factor of the modulus, silently leaves the theorem's domain.

## Naive approach

The definition gives the first baseline directly.

```python
def phi_naive(n):
    count = 0
    for x in range(1, n + 1):
        if math.gcd(x, n) == 1:
            count += 1
    return count
```

This is correct, and it is $O(n \log n)$. For $n = 10^{12}$ it performs a trillion iterations, so it is useful only as a reference for small values.

The second baseline computes the power by repeated multiplication.

```python
def power_naive(base, exponent, modulus):
    result = 1 % modulus
    for _ in range(exponent):
        result = result * base % modulus
    return result
```

This is also correct, and it is $O(e)$. For $e = 10^{18}$ it does not finish either.

Both baselines are worth keeping, because they are the fastest way to find a bug in the fast versions. A disagreement between the naive totient and the factored totient on every $n$ up to a thousand localizes a mistake to one of four lines.

## Key insight

The first insight is that **the numbers not coprime to $n$ are exactly the multiples of the distinct prime factors of $n$**.

Write $n = p_1^{a_1} \cdots p_k^{a_k}$. An integer $x$ is not coprime to $n$ exactly when some $p_i$ divides $x$. Inclusion and exclusion over the $k$ primes gives

$$
\varphi(n) = n - \sum_i \frac{n}{p_i} + \sum_{i<j} \frac{n}{p_i p_j} - \cdots = n \prod_i \left(1 - \frac{1}{p_i}\right).
$$

The exponents $a_i$ never appear. That is why a number such as $2^{40}$ has $\varphi(2^{40}) = 2^{39}$, not something proportional to the exponent.

The second insight is that **the residues coprime to $m$ form a group of size $\varphi(m)$**. Call them the units. A unit multiplied by a unit is a unit, every unit has an inverse modulo $m$, and there are $\varphi(m)$ of them. Multiplying all the units by a fixed unit permutes them, because the map $x \mapsto ax$ is injective: $ax \equiv ay$ implies $x \equiv y$ after multiplying by $a^{-1}$.

That permutation is the whole proof of Euler's theorem. The product of all the units equals the product of all of them multiplied by $a$, so the two products differ by the factor $a^{\varphi(m)}$, and the product of the units can be canceled because every factor in it is invertible.

The third insight is that the exponent reduction needs the base to be invertible. When $\gcd(a, m) \ne 1$, multiplying by $a$ does not permute the units, and $a^{\varphi(m)}$ need not be $1$. The correction that repairs the reduction is stated later, and it costs one extra totient.

## Visual intuition

The totients of the first twelve integers are small enough to list by hand.

| $n$ | Integers in $[1, n]$ coprime to $n$ | $\varphi(n)$ |
| --- | ----------------------------------- | ------------ |
| 1   | 1                                   | 1            |
| 2   | 1                                   | 1            |
| 3   | 1, 2                                | 2            |
| 4   | 1, 3                                | 2            |
| 5   | 1, 2, 3, 4                          | 4            |
| 6   | 1, 5                                | 2            |
| 7   | 1, 2, 3, 4, 5, 6                    | 6            |
| 8   | 1, 3, 5, 7                          | 4            |
| 9   | 1, 2, 4, 5, 7, 8                    | 6            |
| 10  | 1, 3, 7, 9                          | 4            |
| 11  | 1, 2, ..., 10                       | 10           |
| 12  | 1, 5, 7, 11                         | 4            |

Draw a circle with $n$ equally spaced points, one per residue, and keep the points whose index is coprime to $n$. For $n = 12$ there are twelve points and four survivors: $1$, $5$, $7$ and $11$. The two primes $2$ and $3$ remove the multiples of $2$ and the multiples of $3$, and a point such as $6$ is removed twice, so inclusion and exclusion adds it back once. That is the product formula in geometric form.

A second picture is the $n \times n$ grid. Color the cell $(x, y)$ when $\gcd(x, y) = 1$. The picture is symmetric about the diagonal, and the colored cells in the column $x = n$ are exactly the values $y$ with $\gcd(n, y) = 1$, so that column counts $\varphi(n)$ directly. The same grid is the standard picture of the Farey sequence: the fractions $y / n$ that survive in lowest terms are one column of it.

The most useful picture is the sieve. Initialize a table with $\varphi(i) = i$. For every prime $p$, walk through the multiples of $p$ and subtract $\varphi(i) / p$ from each one. The primes are recognized because their entry is still equal to their index. After the prime $2$ has been processed, every even entry has lost half its value, and after every prime has been processed, the entry for $i$ is exactly $i \prod (1 - 1/p)$ over the primes dividing $i$.

## Formal model

::: math definition Definition
For a positive integer $n$, the **totient** $\varphi(n)$ is the number of integers $k$ with $1 \le k \le n$ and $\gcd(k, n) = 1$. By convention, $\varphi(1) = 1$.
:::

::: math definition Definition
A residue $a$ modulo $m$ is a **unit** when $\gcd(a, m) = 1$. The units in $[1, m]$ form a group under multiplication modulo $m$, and that group has $\varphi(m)$ elements.
:::

::: math lemma Lemma
For a prime $p$ and an exponent $k \ge 1$,

$$
\varphi(p^{k}) = p^{k} - p^{k-1} = p^{k-1}(p - 1).
$$
:::

::: math proof Proof
The integers in $[1, p^k]$ that are not coprime to $p^k$ are exactly the multiples of $p$, and there are $p^{k-1}$ of them. Subtracting them gives $p^k - p^{k-1}$. $\square$
:::

::: math lemma Lemma
If $\gcd(m, n) = 1$, then $\varphi(mn) = \varphi(m)\varphi(n)$.
:::

::: math proof Proof
The Chinese remainder theorem gives a bijection between the residues modulo $mn$ and the pairs of residues modulo $m$ and modulo $n$. A residue is coprime to $mn$ exactly when its two components are coprime to $m$ and to $n$, because a prime divides $mn$ exactly when it divides one of the two factors. The number of such pairs is $\varphi(m)\varphi(n)$. $\square$
:::

Combining the two lemmas with the factorization $n = p_1^{a_1} \cdots p_k^{a_k}$ gives the product formula

$$
\varphi(n) = \prod_{i=1}^{k} p_i^{a_i - 1}(p_i - 1) = n \prod_{i=1}^{k} \left(1 - \frac{1}{p_i}\right).
$$

::: math theorem Euler's theorem
Let $m \ge 1$ and let $a$ be an integer with $\gcd(a, m) = 1$. Then

$$
a^{\varphi(m)} \equiv 1 \pmod m.
$$
:::

::: math proof Proof
Let $U$ be the set of units in $[1, m]$, with $|U| = \varphi(m)$. Multiplication by $a$ maps $U$ into $U$: if $\gcd(x, m) = 1$ then $\gcd(ax, m) = 1$. The map is injective, because $ax \equiv ay \pmod m$ implies $x \equiv y$ after multiplying by the inverse of $a$. A finite set with an injective self-map has a bijective self-map, so the residues $ax \bmod m$ for $x \in U$ are a permutation of $U$. Multiplying them,

$$
a^{\varphi(m)} \prod_{x \in U} x \equiv \prod_{x \in U} x \pmod m.
$$

Every $x \in U$ is invertible modulo $m$, so the product $\prod_{x \in U} x$ is invertible and can be canceled. What remains is $a^{\varphi(m)} \equiv 1 \pmod m$. $\square$
:::

::: math theorem Corollary
If $\gcd(a, m) = 1$, then for every integer $e \ge 0$,

$$
a^{e} \equiv a^{e \bmod \varphi(m)} \pmod m,
$$

and, for $m > 1$, the inverse of $a$ modulo $m$ is $a^{\varphi(m) - 1} \bmod m$.
:::

::: math proof Proof
Write $e = q\varphi(m) + r$ with $0 \le r < \varphi(m)$. Then $a^{e} = (a^{\varphi(m)})^{q} a^{r} \equiv a^{r} \pmod m$. For the inverse, multiply $a^{\varphi(m)} \equiv 1$ by $a^{-1}$, which exists because $a$ is a unit. $\square$
:::

::: math lemma Lemma
Let $m \ge 1$, let $a$ be any integer, and let $e \ge \log_2 m$. Then

$$
a^{e} \equiv a^{e \bmod \varphi(m) + \varphi(m)} \pmod m.
$$
:::

::: math proof Proof
It is enough to prove the congruence modulo every prime power $p^{k}$ that divides $m$, because the moduli are coprime and the Chinese remainder theorem combines the results.

If $p \mid a$, then both sides are divisible by $p^{k}$ as soon as their exponent is at least $k$. The exponent $e$ is at least $\log_2 m \ge k$ because $p^{k} \le m$, and the exponent $e \bmod \varphi(m) + \varphi(m)$ is at least $\varphi(m) \ge \varphi(p^{k}) = p^{k-1}(p-1) \ge k$. Both sides are therefore $0$ modulo $p^{k}$.

If $p \nmid a$, then $a$ is a unit modulo $p^{k}$, and $\varphi(p^{k})$ divides $\varphi(m)$ because $\varphi$ is multiplicative over the prime powers of $m$. The two exponents are congruent modulo $\varphi(m)$, hence modulo $\varphi(p^{k})$, and Euler's theorem makes the powers of $a$ depend only on the exponent modulo $\varphi(p^{k})$. Both sides are equal modulo $p^{k}$. $\square$
:::

The lemma is the reason a power tower can be evaluated modulo $m$ even when its base is not coprime to $m$. The extra $+\varphi(m)$ is not decoration: without it the reduced exponent can be $0$ when the true exponent is large, and $a^{0} = 1$ is generally not the answer.

::: math lemma Lemma
For $m \ge 3$, $\varphi(m)$ is even.
:::

::: math proof Proof
If $m$ has an odd prime factor $p$, then $\varphi(p^{k}) = p^{k-1}(p-1)$ is even and divides $\varphi(m)$, so $\varphi(m)$ is even. Otherwise $m = 2^{k}$ with $k \ge 2$ because $m \ge 3$, and $\varphi(m) = 2^{k-1}$ is even. $\square$
:::

## Algorithm derivation

### The totient by trial division

The product formula is evaluated directly while the factorization is found.

```cpp
long long phi(long long n)
{
    long long result = n;
    long long rest = n;

    for (long long p = 2; p * p <= rest; ++p) {
        if (rest % p == 0) {
            while (rest % p == 0) {
                rest /= p;
            }
            result -= result / p;
        }
    }
    if (rest > 1) {
        result -= result / rest;
    }
    return result;
}
```

Three details make it correct.

- `result` starts at $n$, because the formula is $n$ times a product of factors below $1$.
- The update is `result -= result / p`, not `result -= n / p`. After the first prime, $n$ is no longer the value the formula multiplies.
- The loop condition uses `rest`, not `n`. Once a factor has been divided out, the remaining number is smaller and the loop can stop earlier.

The final `if (rest > 1)` is the leftover prime. A prime $n$ such as $10^9 + 7$ has no factor at or below $\sqrt n$, so the loop never finds one, and the only prime factor appears as the value of `rest` after the loop. It must receive its own factor $(1 - 1 / \text{rest})$, or the function returns $n$ instead of $n - 1$.

### The totient by sieve

When every totient up to a limit is needed, the sieve is the standard tool.

```cpp
std::vector<int> totient_table(int n)
{
    std::vector<int> phi(n + 1);
    for (int i = 0; i <= n; ++i) {
        phi[i] = i;
    }
    for (int p = 2; p <= n; ++p) {
        if (phi[p] == p) {                    // p is still untouched, so p is prime
            for (int k = p; k <= n; k += p) {
                phi[k] -= phi[k] / p;
            }
        }
    }
    return phi;
}
```

The test `phi[p] == p` recognizes a prime because only a prime has not been touched by an earlier prime's multiples. Entry $0$ stays $0$, which is convenient inside the loops; entry $1$ stays $1$, which is the convention.

### The power

Binary exponentiation computes $a^{e} \bmod m$ in $O(\log e)$ multiplications.

```cpp
long long mod_pow(long long base, long long exponent, long long modulus)
{
    long long result = 1 % modulus;
    base %= modulus;

    while (exponent > 0) {
        if (exponent & 1) {
            result = result * base % modulus;
        }
        base = base * base % modulus;
        exponent >>= 1;
    }
    return result;
}
```

`1 % modulus` is the initial value rather than `1`, because the modulus $1$ has exactly one residue, $0$. The base is reduced before the first multiplication, and every product is reduced immediately, so no intermediate exceeds $m^2$.

### The program

The reference program combines the pieces: read $n$, $m$, $a$; print $\varphi(n)$; then print `mod_pow(a, phi(m), m)`. The exponent is at most $m - 1$, so the width argument for the power is the same as in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Step-by-step execution

**The totient of $36$.** The factorization is $36 = 2^2 \cdot 3^2$, so the formula gives $36 \cdot \frac{1}{2} \cdot \frac{2}{3} = 12$.

| Step          | `p` | `rest` after division | `result`       |
| ------------- | --- | --------------------- | -------------- |
| start         |     | 36                    | 36             |
| first factor  | 2   | 9                     | $36 - 18 = 18$ |
| second factor | 3   | 1                     | $18 - 6 = 12$  |
| loop exit     | 4   | 1                     | 12             |

The loop stops when $p$ reaches $4$, because $4 \cdot 4 = 16 > 1$. The leftover test does nothing, because `rest` is $1$. The coprime residues of $36$ are $1, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35$, and there are twelve of them.

**The totient of $1000$.** Since $1000 = 2^3 \cdot 5^3$, the formula gives $1000 \cdot \frac{1}{2} \cdot \frac{4}{5} = 400$. The exponents $3$ and $3$ never enter the computation.

**The totient of $1$.** The loop body never runs and the leftover test is false, so the result is the initial value $1$.

**The power $3^{6} \bmod 7$.** The exponent $6$ is $110$ in binary.

| Iteration | `exponent` | Low bit | `result`                | `base` |
| --------- | ---------- | ------- | ----------------------- | ------ |
| start     | 6          |         | 1                       | 3      |
| 1         | 6          | 0       | 1                       | 2      |
| 2         | 3          | 1       | 2                       | 4      |
| 3         | 1          | 1       | $2 \cdot 4 \bmod 7 = 1$ | 2      |
| 4         | 0          |         | 1                       | 2      |

The answer is $1$, which is Euler's theorem for $m = 7$: $\varphi(7) = 6$ and $\gcd(3, 7) = 1$.

**A composite check.** For $m = 36$, $\varphi(36) = 12$ and $\gcd(5, 36) = 1$, so $5^{12} \bmod 36$ must be $1$. Direct computation gives $244{,}140{,}625$, and $244{,}140{,}625 = 6{,}781{,}684 \cdot 36 + 1$. For $m = 1000$ and $a = 7$, the theorem predicts $7^{400} \equiv 1 \pmod{1000}$, and the last three digits of $7^{400}$ are indeed $001$.

**A case where the theorem does not apply.** With $m = 36$ and $a = 2$, $\gcd(2, 36) = 2$, and $2^{12} \bmod 36 = 28$, not $1$. The theorem is not false; its hypothesis fails.

## Correctness proof

::: math theorem Theorem
The function `phi(n)` returns $\varphi(n)$ for every integer $n \ge 1$.
:::

::: math proof Proof
Write $n = p_1^{a_1} \cdots p_k^{a_k}$ with distinct primes $p_1 < \cdots < p_k$.

**The processed values are prime.** At the start of an iteration with candidate $p$, every prime smaller than $p$ has already been divided out of `rest` completely. If $p$ divides `rest`, then $p$ has no smaller prime factor, so $p$ is prime. If `rest` has a composite value at the end of the loop, it has a prime factor $q \le \sqrt{\text{rest}} < p$, and that prime would have been removed earlier, a contradiction. Hence `rest` is either $1$ or a prime at every point where it matters.

**The invariant.** After some set $S$ of distinct primes has been processed,

$$
\text{result} = n \prod_{p \in S} \left(1 - \frac{1}{p}\right), \qquad \text{rest} = n \prod_{p \in S} p^{-a_p}.
$$

The invariant holds initially with $S$ empty and `result` $= n$. When the loop processes a new prime $p$, it divides all copies of $p$ out of `rest` and replaces `result` by `result - result / p`, which is `result` times $(1 - 1/p)$. Primes already processed do not divide `rest` again, so each distinct prime is processed exactly once.

**The leftover.** If `rest` is $1$, every prime factor has been processed and the invariant gives the product formula. If `rest > 1`, the argument above shows that `rest` is prime, and it is the one prime factor that the loop did not reach because it is larger than $\sqrt{\text{rest}}$. The final update multiplies the result by $(1 - 1/\text{rest})$, which completes the product formula.

In both cases the returned value is $n \prod_{p \mid n} (1 - 1/p) = \varphi(n)$. $\square$
:::

::: math theorem Theorem
`mod_pow(a, e, m)` returns the residue of $a^{e}$ modulo $m$ in $[0, m)$.
:::

::: math proof Proof
The loop maintains the invariant that `result` times `base` raised to the remaining exponent is congruent to $a^{e}$ modulo $m$. Initially `result` is $1$ and `base` is $a \bmod m$, so the invariant holds. When the low bit of the remaining exponent is $1$, `result` is multiplied by `base`, which accounts for that power of two; when the bit is $0$, the factor is absent. Squaring `base` and halving the exponent preserves the invariant in both cases. When the exponent reaches $0$, the invariant reads $\text{result} \equiv a^{e} \pmod m$, and `result` is already in $[0, m)$ because every assignment reduces modulo $m$. $\square$
:::

::: math invariant Invariant
Throughout the loop, `result` and the running square satisfy

$$
\text{result} \cdot \text{base}^{e_{\text{remaining}}} \equiv a^{e_{\text{initial}}} \pmod m.
$$
:::

## Complexity analysis

| Operation                                      | Time                        | Space  |
| ---------------------------------------------- | --------------------------- | ------ |
| Totient by trial division                      | $O(\sqrt n)$                | $O(1)$ |
| Totient by sieve up to $N$                     | $O(N \log \log N)$          | $O(N)$ |
| Totient by linear sieve up to $N$              | $O(N)$                      | $O(N)$ |
| Power $a^{e} \bmod m$                          | $O(\log e)$ multiplications | $O(1)$ |
| Totient and power, as in the reference program | $O(\sqrt n + \log m)$       | $O(1)$ |

The trial division bound is reached when $n$ is prime: the loop runs until `p * p > n`, which is about $\sqrt n$ iterations. For $n = 10^{12}$ that is at most $10^6$ iterations, and each iteration is one remainder and, for the few factors, a short division loop. A composite number is faster because `rest` shrinks.

The sieve processes each prime $p$ and touches $N/p$ multiples, so the total is $N \sum_{p \le N} 1/p = O(N \log \log N)$. The linear sieve records the smallest prime factor and writes each composite exactly once, which removes the $\log \log N$ factor at the cost of a larger constant and more memory traffic.

The power costs $\lfloor \log_2 e \rfloor + 1$ squarings and at most that many multiplications. For $e \le 10^9$ that is at most thirty of each. The width of one multiplication is the modulus: two residues below $10^9$ have a product below $10^{18}$, which a signed 64-bit integer holds; a modulus near $2^{61}$ needs a 128-bit intermediate, exactly as in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

For the sum of the totients up to $N = 10^{10}$, neither the sieve nor the per-number trial division is available, and the standard solution is the sublinear recurrence described in the last worked problem. Its cost is about $O(N^{2/3})$ with a tuned cutoff, which is the largest totient problem in the usual contest range.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One value $n \le 10^{12}$ | Trial division |
| Many values up to $N \le 10^7$ | Sieve of the totients |
| Every totient up to $N$ with a tight time limit | Linear sieve |
| $n \le 10^{18}$, one value | Miller-Rabin to test primality, or Pollard-Rho to factor it |
| A power with $\gcd(a, m) = 1$ | Reduce the exponent modulo $\varphi(m)$ |
| A power with $\gcd(a, m) \ne 1$ | The corrected exponent $e \bmod \varphi(m) + \varphi(m)$ |
| A power tower modulo $m$ | Recursion on $m, \varphi(m), \varphi(\varphi(m)), \ldots$ |
| An inverse modulo a composite $m$ | $a^{\varphi(m)-1}$, or the extended Euclidean algorithm |
| The smallest period of every unit | The Carmichael function $\lambda(m)$, not $\varphi(m)$ |
| The sum of $\varphi(i)$ for $i \le N$ | The Dirichlet recurrence over $\lfloor N / i \rfloor$ |
| $\varphi(n!)$ | $n! \prod_{p \le n} (1 - 1/p)$ over the primes up to $n$ |
| The number of primitive roots modulo a prime $p$ | $\varphi(p - 1)$ |

The difference between the fifth and sixth rows is the whole subject in one line. Reducing modulo $\varphi(m)$ requires a unit. A non-unit needs the extra totient added back, and the extra term is a fixed cost rather than an approximation.

The extended Euclidean algorithm and Euler's theorem compute the same inverse when the modulus is composite and the value is coprime. The extended Euclidean algorithm is the one to prefer, because it does not need the factorization of $m$; Euler's route needs $\varphi(m)$, which is as hard to compute as the factorization when $m$ is large. When $m$ is a prime already in the problem, Fermat's route is shorter.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal, and JavaScript. There is no reusable minimal variant, because the algorithm is two short loops and a few lines of normalization, and the complete program is the clearest reference.

The contract is fixed across all six files.

- **Input:** `n m a` on one line, with $1 \le n \le 10^{12}$, $1 \le m \le 10^9$, and $0 \le a \le 10^9$.
- **Output:** two lines. The first is $\varphi(n)$. The second is $a^{\varphi(m)} \bmod m$, in the range $[0, m)$.
- **Edge cases:** $n = 1$ prints $1$, and $m = 1$ prints $0$ for the second line, because every residue modulo $1$ is $0$.

The language-specific choices are narrow.

| Language | File | Notable choice |
| --- | --- | --- |
| C | `c/program.c` | `long long` for the totient and for every product |
| C++17 | `cpp17/program.cpp` | The same arithmetic with `iostream` |
| Java | `java/Main.java` | `Scanner`, because the input is three tokens, and `long` throughout |
| Python | `python/program.py` | Arbitrary-precision integers, so no width argument |
| Pascal | `pascal/program.pas` | `Int64`; the three values are read one call at a time |
| JavaScript | `javascript/program.js` | `BigInt` for the power, because $10^{18}$ is past $2^{53}$ |

The C, C++, Java and Pascal versions rely on the bound $m \le 10^9$ for the product of two residues to fit in a signed 64-bit integer. Python has no such bound. JavaScript is the exception in the other direction: a double holds every integer up to $2^{53}$, which covers the totient but not the $10^{18}$ products inside the power, so the power converts its arguments to `BigInt`.

The JavaScript and Pascal listings carry the educational note in the manifest, because neither is a USACO submission language. All six variants are marked `unverified` until the validation job compiles them and compares their output on the shared fixtures.

## Recursion decision

Both algorithms have a recursive form, and both should be written iteratively.

The totient loop can be written recursively as `phi(n, p)`: test whether $p$ divides $n$, recurse on the reduced $n$, and stop when $p^2$ exceeds the remainder. The depth is the number of candidate divisors below $\sqrt n$, at most about $10^6$ in the worst case, which is not a recursion depth any language should be asked to hold.

The power can be written recursively as `power(base, exponent) = power(base * base, exponent / 2)` with an extra factor when the exponent is odd. Its depth is $O(\log e)$, at most thirty for the stated bounds, so the stack is not a concern. The iterative form is still shorter to read and carries no call overhead.

The one place recursion is natural is the power tower, where the modulus itself changes at every level. The recurrence goes from $m$ to $\varphi(m)$ to $\varphi(\varphi(m))$, and the chain reaches $1$ in $O(\log m)$ steps because $\varphi(m)$ is even for $m \ge 3$ and the totient of an even number is at most half of it, so two steps at least halve the modulus. That depth is about thirty for $m \le 10^9$, which is safe in every language.

| Language | Default stack | Practical depth | Verdict for the totient loop |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterate; the trial division can reach $10^6$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterate |
| Python | Interpreter limit of 1000 | 1000 frames | Iterate |
| Pascal | The operating system stack | Depends on the platform | Iterate |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterate |

## Implementation walkthrough

Four lines decide whether the program is right.

```cpp
long long result = n;
result -= result / p;
if (rest > 1) result -= result / rest;
long long result = 1 % modulus;
```

The first line starts the product at $n$. The second applies one factor $(1 - 1/p)$ to the current value, not to $n$. The third applies the factor of the prime that the loop never reached. The fourth is the initial value of the power, and the `% modulus` is what makes $m = 1$ return $0$ instead of $1$.

Two more details are not optional.

**The loop bound uses the shrinking remainder.** Writing `p * p <= n` keeps the loop running to $\sqrt n$ even after the number has been reduced to a small prime, which is slower but still correct. The more dangerous version is `p * p <= rest` with a 32-bit `p`: for $n$ near $10^{12}$, `p * p` overflows a 32-bit integer around $p = 46{,}341$, and the loop either stops early or reads a negative bound. The reference programs use a 64-bit `p`, so the product stays below $10^{12}$.

**The base is reduced before it is used.** If $a$ is larger than $m$, the first squaring can overflow even when the modulus itself is small. `base %= modulus` fixes it, and `1 % modulus` handles the modulus $1$ without a special case.

In JavaScript, the mix of `Number` and `BigInt` is a type error at run time: `result * square` throws if one side is a `BigInt` and the other is a number, because the language does not coerce between the two. The reference program converts `base`, `exponent` and `modulus` to `BigInt` at the top of the power, and prints the result with `toString`.

In Pascal, `Read(N, M, A)` is not accepted by the compiler used by the validation job, which takes one argument per call. The reference program reads the three values with three `Read` calls; the calls consume whitespace, so the input can be on one line or on three.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Returning $0$ for $\varphi(1)$ | Every problem with $n = 1$ is off by one | Use $\varphi(1) = 1$, the empty product |
| Forgetting the leftover prime | $\varphi(p)$ returns $p$ instead of $p - 1$ | Apply the final `if (rest > 1)` |
| Using $n / p$ instead of `result / p` | The count is wrong when $n$ has several primes | Apply the factor to the current result |
| Computing `p * p` in 32 bits | Overflow near $p = 46{,}341$ | Use a 64-bit loop variable |
| Reducing the exponent without checking the gcd | The answer is wrong whenever the base shares a factor with $m$ | Add $\varphi(m)$ when the exponent is large |
| Assuming $\varphi(m) = m - 1$ | True only for a prime modulus | Factor $m$, or check primality |
| Using $\varphi(m)$ as the minimal period | Not every unit has order $\varphi(m)$ | Use the Carmichael function $\lambda(m)$ when the statement asks for the period |
| Returning $1$ for the initial power when $m = 1$ | The value is outside $[0, m)$ | Initialize with `1 % m` |
| Calling $0^0 = 0$ | The statement may define it as $1$ | Read the convention before handling a zero exponent |
| Counting $0$ as coprime to $n$ | The count is one too large for every $n$ | Count $k$ with $1 \le k \le n$, not $0 \le k < n$ |

### Why this fails: reducing an exponent without checking its hypotheses

The plausible wrong approach is to remember the corollary $a^{e} \equiv a^{e \bmod \varphi(m)} \pmod m$ and to use it for every base, without checking $\gcd(a, m) = 1$.

Take $m = 4$ and $a = 2$. Since $\varphi(4) = 2$, the exponent $e = 2$ reduces to $2 \bmod 2 = 0$, and the program returns $2^{0} = 1$. The true value is $2^{2} = 4 \equiv 0 \pmod 4$. The program is confidently, silently wrong.

The smallest modulus that shows the failure is actually $m = 2$ with $a = 2$: $\varphi(2) = 1$, every exponent reduces to $0$, and $2^{0} = 1$ while $2^{1} \equiv 0 \pmod 2$. That case is degenerate because the reduced base is $0$. The modulus $4$ is the smallest one with a nonzero base below the modulus, and it is the one to remember.

A second failure appears when the corrected reduction is applied without checking that the exponent is large enough. For $m = 8$ and $a = 2$, $\varphi(8) = 4$. With the true exponent $e = 2$, the corrected exponent is $2 \bmod 4 + 4 = 6$, and $2^{6} \equiv 0 \pmod 8$, while the true value is $2^{2} = 4$. The correction is valid only once $e \ge \log_2 m$, which here is $3$. The uncorrected failure is about the gcd; the corrected one is about the size of the exponent, and the two conditions are different parts of the same lemma.

The lesson generalizes: **Euler's theorem is a statement about units, not about arbitrary residues.** The checked condition is one line, `if (std::gcd(a, m) != 1)`, and skipping it works on every test case whose base happens to be coprime, which is precisely why the bug survives.

## Variants and extensions

- **The totient sieve.** Every $\varphi(i)$ up to $N$ in $O(N \log \log N)$ with the table described above. The technique is in [the sieve of Eratosthenes](/algorithms/number-theory/sieve).
- **The linear sieve.** Computes the smallest prime factor and the totient of every number in $O(N)$, using the recurrence $\varphi(ip) = \varphi(i)p$ when $p \mid i$ and $\varphi(ip) = \varphi(i)(p-1)$ otherwise.
- **The Carmichael function.** $\lambda(m)$ is the least positive integer with $a^{\lambda(m)} \equiv 1$ for every unit $a$. It divides $\varphi(m)$ and is strictly smaller for numbers such as $8$, where $\varphi(8) = 4$ but $\lambda(8) = 2$. Use $\lambda$ when a problem asks for the exact period.
- **The Jordan totient.** $J_k(n)$ counts the $k$-tuples of residues whose gcd with $n$ is $1$, and $J_1 = \varphi$.
- **Möbius inversion.** $\varphi = \mu \ast \operatorname{id}$, where $\ast$ is Dirichlet convolution. The identity $\sum_{d \mid n} \varphi(d) = n$ is the same statement without the Möbius function and is the key to the sublinear prefix sum.
- **RSA.** The modulus $N = pq$ has $\varphi(N) = (p-1)(q-1)$, and the private exponent is the inverse of the public exponent modulo $\varphi(N)$.
- **Primitive roots.** A prime $p$ has $\varphi(p-1)$ primitive roots, and they exist exactly for $m \in \{1, 2, 4, p^k, 2p^k\}$ with $p$ an odd prime.
- **Exponent towers.** The corrected reduction turns a tower into a recursion on the totient chain, which is the Kattis problem below.
- **Generalized Euler reduction.** For a modulus with a known factorization, the exponent can be reduced modulo $\lambda(m)$ instead of $\varphi(m)$, and the correction term becomes the largest exponent in the prime powers.
- **Divisor sums.** The same convolution that gives the prefix sum of $\varphi$ gives the prefix sums of other multiplicative functions, which is the domain of Dirichlet hyperbola methods.

## Contest strategy

1. Factor the modulus before anything else. The factorization gives $\varphi(m)$, and it also tells you whether the modulus is prime.
2. Decide whether the base is coprime to the modulus. If it is, reduce the exponent modulo $\varphi(m)$. If it is not, add $\varphi(m)$ and check that the exponent is large enough for the correction.
3. Compute $\varphi$ from the distinct primes only. Repeating a prime in the product is the most common arithmetic slip.
4. Check $n = 1$ and $m = 1$ by hand. The convention $\varphi(1) = 1$ and the residue range $[0, m)$ both have to survive.
5. Use a 64-bit type for the loop variable of the trial division, and for every product inside the power. The bound on the modulus decides whether 128 bits are needed.
6. Write the naive totient and the naive power first when the values are small. They are the reference that catches a sign error or a missing factor before the fast version hides it.
7. For many queries, switch to the sieve before optimizing the trial division. The asymptotic difference is larger than any constant-factor work on the loop.

## Worked problems

### Problem 1: a power whose exponent is a power

**Restatement.** This is [CSES Exponentiation II](https://cses.fi/problemset/task/1712): given $n$ triples $(a, b, c)$ with $0 \le a, b, c \le 10^9$, print $a^{b^{c}} \bmod (10^9 + 7)$, under the convention $0^0 = 1$.

**Naive baseline.** Build $b^{c}$ and then exponentiate, which is impossible because the exponent has up to $9 \cdot 10^9$ digits.

**Insight.** The modulus is the prime $p = 10^9 + 7$, so every nonzero base below $p$ is a unit and the exponent may be reduced modulo $p - 1$.

**Derivation.** Compute $e = b^{c} \bmod (p-1)$ with binary exponentiation, then compute $a^{e} \bmod p$. When $a = 0$, the reduction does not apply: the answer is $1$ exactly when $b = 0$ and $c > 0$, because then the exponent $b^{c}$ is $0$ and the statement defines $0^0 = 1$. Every other case with $a = 0$ has a positive exponent and gives $0$.

**Correctness.** For $a \ne 0$, Euler's theorem with $\varphi(p) = p - 1$ gives $a^{b^{c}} \equiv a^{e} \pmod p$, because the exponents differ by a multiple of $p - 1$. The zero base is decided by the exponent itself: it is zero exactly when $b = 0$ and $c > 0$, and positive otherwise.

**Complexity.** $O(\log c + \log p)$ per query, with $O(1)$ space.

**Common wrong approach.** Reducing the exponent modulo $p - 1$ for $a = 0$ as well, which returns $1$ for $0^{\text{positive}}$ whenever the reduced exponent is $0$.

### Problem 2: a tower modulo a composite

**Restatement.** This is [Kattis Exponial](https://open.kattis.com/problems/exponial): compute $\operatorname{exponial}(n) = n^{(n-1)^{(n-2)^{\cdots^{1}}}} \bmod m$ with $1 \le n, m \le 10^9$.

**Naive baseline.** Evaluate the tower, which has more digits than the observable universe holds.

**Insight.** The modulus chain $m, \varphi(m), \varphi(\varphi(m)), \ldots$ reaches $1$ in $O(\log m)$ steps. At each level the exponent is reduced modulo the next totient and then increased by that totient to repair the non-coprime case.

**Derivation.** Define $F(n, m)$ as the tower $n^{(n-1)^{\cdots}}$ modulo $m$. For $n \ge 5$, the true exponent is at least $F(4) = 262144$, which is at least $\log_2 m$ for every $m \le 10^9$, so the corrected reduction gives

$$
F(n, m) = n^{F(n-1, \varphi(m)) + \varphi(m)} \bmod m.
$$

For $n \le 4$ the whole tower is $1, 2, 9, 262144$ respectively, which is below $10^9$, so those values are computed directly.

**Correctness.** The corrected reduction is the lemma proved above. The base cases are the literal tower values. Each recursive call strictly decreases the modulus because $\varphi(m) < m$ for $m \ge 2$, so the recursion terminates at $m = 1$, where every value is $0$.

**Complexity.** $O(\log^2 m)$ multiplications and $O(\log m)$ stack frames.

**Common wrong approach.** Reducing the exponent modulo $\varphi(m)$ without adding $\varphi(m)$, which fails as soon as $n$ shares a factor with $m$.

### Problem 3: the sum of all totients

**Restatement.** This is [Library Checker Sum of Totient Function](https://judge.yosupo.jp/problem/sum_of_totient_function): given $N \le 10^{10}$, print $\sum_{i=1}^{N} \varphi(i) \bmod 998244353$.

**Naive baseline.** Sieve the totients up to $N$, which needs $40$ gigabytes for the table and $10^{10}$ steps.

**Insight.** The identity $\sum_{d \mid n} \varphi(d) = n$ turns the prefix sum $S(N)$ into a recurrence over the quotients $\lfloor N / d \rfloor$, and there are only $O(\sqrt N)$ distinct quotients.

**Derivation.** Sum the identity over $n \le N$ and reverse the order of summation:

$$
\frac{N(N+1)}{2} = \sum_{n \le N} \sum_{d \mid n} \varphi(d) = \sum_{d \le N} S\!\left(\left\lfloor \frac{N}{d} \right\rfloor\right).
$$

Isolating the $d = 1$ term gives

$$
S(N) = \frac{N(N+1)}{2} - \sum_{d=2}^{N} S\!\left(\left\lfloor \frac{N}{d} \right\rfloor\right).
$$

The values of $\lfloor N/d \rfloor$ are constant on blocks, so each block is handled in one step, and the prefix sums of the distinct arguments are memoized. A sieve up to a cutoff supplies the small arguments directly.

**Correctness.** The recurrence is an exact rearrangement of a finite sum, and the block decomposition groups equal quotients without changing the sum. Every argument passed to $S$ is at most $N$, so the recursion is well founded and the memo table returns an exact value.

**Complexity.** About $O(N^{2/3})$ time and $O(N^{2/3})$ memory with a tuned cutoff; the number of distinct arguments is $O(\sqrt N)$.

**Common wrong approach.** Computing $N(N+1)/2$ in a signed 64-bit integer, which overflows at $N = 10^{10}$ because the value reaches $5 \cdot 10^{19}$. Reduce each factor modulo $998244353$ before multiplying, or use a 128-bit intermediate.

## Practice progression

1. **Recognition.** Given a statement, decide whether the answer is a totient, a count of coprime pairs, or a power that needs its exponent reduced.
2. **Direct application.** Implement the trial division totient and check it against a gcd-based brute force for every $n$ up to a thousand. Then implement the sieve and check that the two agree.
3. **Adaptation.** Implement the exponent reduction and verify Euler's theorem for every unit modulo every $m$ up to fifty. Then verify the corrected reduction for every base and every exponent from $\lceil \log_2 m \rceil$ upward.
4. **Combination.** Use the totient inside a number-theoretic count: the number of reduced fractions with denominator at most $N$, or the number of pairs $(x, y)$ with $\gcd(x, y) = 1$ inside a square. The sieve supplies the totients, and the count is a prefix sum.
5. **Challenge.** Solve [Exponial](https://open.kattis.com/problems/exponial) with the corrected reduction, and check the small cases against a brute-force tower. The correction term is the part that a plain Euler reduction misses.
6. **Transfer.** Solve [Sum of Totient Function](https://judge.yosupo.jp/problem/sum_of_totient_function) with the recurrence above, then compare it against a sieve for $N \le 10^6$. Finally solve [Exponentiation II](https://cses.fi/problemset/task/1712) and check that the zero base is the only case the exponent reduction does not cover.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of $\varphi(n)$ and explain why $\varphi(1) = 1$. (Formal model)
2. Derive the product formula from inclusion and exclusion. (Key insight)
3. Prove that $\varphi(p^k) = p^{k-1}(p - 1)$ and that $\varphi$ is multiplicative over coprime arguments. (Formal model)
4. State Euler's theorem with both hypotheses and prove it by permuting the units. (Formal model)
5. Derive the exponent reduction from Euler's theorem, and state the convention for a reduced exponent of zero. (Formal model)
6. Why does the reduction fail when the base is not coprime, and what is the corrected exponent? (Common mistakes)
7. Trace the trial division totient on $36$ and on a prime near $10^{12}$. (Step-by-step execution)
8. What does the leftover `rest > 1` test represent, and when is it skipped? (Algorithm derivation)
9. Why must the loop variable of the trial division be 64-bit? (Implementation walkthrough)
10. When is the sieve preferred to trial division, and when is neither enough? (Algorithm selection)
11. What is the smallest modulus with a nonzero base that shares a factor with it, and what does the uncorrected reduction return there? (Common mistakes)
12. Why is $\varphi(m)$ not always the minimal period, and what replaces it? (Variants and extensions)

## Further reading

- The arithmetic that the exponent reduction lives in is [modular arithmetic](/algorithms/number-theory/modular-arithmetic), and the power loop is binary exponentiation there.
- The algorithm that computes the same inverse without factoring the modulus is [the extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean).
- The table that computes every totient up to a limit is [the sieve of Eratosthenes](/algorithms/number-theory/sieve), and the factorization it supports is [prime factorization](/algorithms/number-theory/prime-factorization).
- The combination of congruences used in the corrected reduction is [the Chinese remainder theorem](/algorithms/number-theory/chinese-remainder).
- The exponentiation used here has a matrix analogue in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).
- The modular inverse that Euler's theorem provides is what makes division safe in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients), where a prime modulus keeps every factorial below it invertible.
- The inclusion and exclusion behind the product formula is developed in [inclusion-exclusion](/algorithms/combinatorics/inclusion-exclusion).
- The discrete mathematics of divisibility, the greatest common divisor, and the proof techniques used here is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index places this technique beside the rest of [the number theory](/algorithms/number-theory/).
