---
id: number-theory.modular-arithmetic
title: Modular arithmetic
summary: Compute with numbers that do not fit in a machine word by reducing every intermediate value modulo a fixed modulus, and divide modulo that modulus by multiplying by an inverse.
division: [silver, gold, platinum]
subjects: [number-theory]
level: intermediate
importance: common-contest-technique
keywords:
    [
        modular arithmetic,
        congruence,
        modular inverse,
        extended euclidean algorithm,
        fermat's little theorem,
        binary exponentiation,
        overflow,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.binary-representation, foundations.recursion]
complexity:
    time: "O(log m) per operation"
    space: "O(1)"
assumptions:
    - The modulus is a positive integer, and reducing a value modulo the modulus never changes the required answer.
    - Every intermediate value is reduced modulo the modulus before it is used again, so that no intermediate exceeds the width of the type holding it.
reviewed: false
---

## At a glance

Modular arithmetic is arithmetic in the residue classes of a division. Two integers are congruent modulo $m$ when $m$ divides their difference, and every operation can be carried out on the residues alone.

Three facts carry the whole technique.

1. **Reduction is compatible with addition and multiplication.** If $a \equiv b \pmod m$ and $c \equiv d \pmod m$, then $a + c \equiv b + d \pmod m$ and $ac \equiv bd \pmod m$. That is what makes it safe to reduce after every operation.
2. **Division is multiplication by an inverse.** The equation $bx \equiv c \pmod m$ is solved by $x \equiv c \cdot b^{-1} \pmod m$, and $b^{-1}$ exists exactly when $\gcd(b, m) = 1$.
3. **A power is computed in logarithmic time.** Binary exponentiation evaluates $a^e \bmod m$ in $O(\log e)$ modular multiplications, and Fermat's little theorem turns the inverse into a power when the modulus is prime.

## Problem motivation

A problem asks for $2^{10^{18}} \bmod 10^9 + 7$. The number itself has about $3 \times 10^{17}$ digits. It cannot be computed, stored, or printed.

The problem is not really about the size of the answer, because the answer is a number below $10^9 + 7$. The problem is about the size of the _intermediate_ values. Every step of the naive computation produces a value far beyond the machine word, and once the values overflow, every answer is garbage.

Reducing modulo $m$ after every multiplication bounds every intermediate value by $m$. The computation then becomes sixty-odd iterations of a loop, and the answer is exact.

The same reasoning explains the second half of the subject. A problem asks for the number of paths from one vertex to another, modulo $10^9 + 7$. The count is astronomically large, and every recurrence that computes it produces astronomically large intermediate values. Modulo $m$, every value stays below $m$, and the recurrence runs unchanged.

## Recognition patterns

Modular arithmetic is the right tool when the statement contains some of these phrases.

- "Modulo", "mod", "remainder when divided by", "the last $k$ digits".
- "$10^9 + 7$", "$998\,244\,353$", "mod $p$ for a prime $p$", "mod $10^9$".
- "The answer may be large", "the answer will not fit in a 64-bit integer".
- "Coprime", "relatively prime", "divides", "divisible by", "greatest common divisor".
- A power, a factorial, or a combinatorial count that clearly exceeds any machine word.

The constraint values that decide the technique:

| Constraint | What it rules |
| --- | --- |
| The modulus is prime | Every nonzero value has an inverse, and Fermat applies |
| The modulus is composite | Inverses exist only for the coprime values, and Fermat does not apply |
| The modulus is at most $10^9 + 7$ | The product of two residues fits in a signed 64-bit integer |
| The modulus is at most $2^{61} - 1$ | The product of two residues needs 128-bit arithmetic |
| No modulus is given | The exact answer is required, and an arbitrary-precision integer is the tool |

The last row is the one that gets people. A problem that does not say "modulo" wants the exact answer. Returning a reduced value is wrong, and no amount of cleverness in the modular arithmetic will fix it.

## Naive approach

The baseline computes the value directly and reduces at the end.

```python
def power_naive(a, e, m):
    result = 1
    for _ in range(e):
        result = result * a % m
    return result
```

This is correct, and it is $O(e)$. It is also useless for $e = 10^{18}$, because the loop runs $10^{18}$ times. The reduction is right; the loop structure is wrong.

The second baseline is worse in a way that is worth naming, because it is the mistake that produces the "the answer is negative" bug reports.

```cpp
long long power(long long a, long long e, long long m) {
    long long result = 1;
    while (e > 0) {
        result = result * a % m;   // no reduction of a itself
        e--;
    }
    return result;
}
```

If $a$ is larger than $m$, then `result * a` overflows before the modulo takes effect. The reduction must happen to the multiplier as well, and it must happen before the multiplication.

## Key insight

The insight is that **congruence is a ring homomorphism**, so a computation can be carried out on the residues and the answer is unchanged.

Take $a \equiv b \pmod m$. Then $a - b = km$ for some integer $k$. For any integer $c$,

$$
ac - bc = kcm,
$$

and $kcm$ is divisible by $m$, so $ac \equiv bc \pmod m$. The same argument with $a + c$ in place of $ac$ gives $a + c \equiv b + c \pmod m$.

That is why reducing after every operation is safe: the reduction is invisible to everything that follows. And because every residue is between $0$ and $m-1$, the reduction also bounds the size of every intermediate value, which is the property that makes the technique possible at all.

Division is the one operation that does not survive the passage to the residues. In ordinary arithmetic $b$ has an inverse only when $b \ne 0$. In the residues modulo $m$, $b$ has an inverse only when $\gcd(b, m) = 1$, and when $m$ is composite that excludes many values that look perfectly reasonable.

The second insight is that a power can be computed from its own squares. Since $a^{2k} = (a^k)^2$, the binary expansion of the exponent turns the power into a chain of squarings and a handful of multiplications, and the chain has logarithmic length.

## Formal model

::: math definition Definition
For integers $a, b$ and a positive integer $m$, write $a \equiv b \pmod m$ and say that $a$ and $b$ are **congruent modulo $m$** when $m$ divides $a - b$. The **residue** of $a$ modulo $m$ is the unique integer $r$ with $0 \le r < m$ and $a \equiv r \pmod m$.
:::

::: math definition Definition
For $m > 1$, the **multiplicative inverse** of $a$ modulo $m$ is an integer $b$ with $ab \equiv 1 \pmod m$. It is written $a^{-1} \bmod m$ and is only defined when $\gcd(a, m) = 1$.
:::

::: math lemma Lemma
The inverse of $a$ modulo $m$ exists if and only if $\gcd(a, m) = 1$.
:::

::: math proof Proof
Suppose $ab \equiv 1 \pmod m$, so $ab - km = 1$ for some integer $k$. Any common divisor of $a$ and $m$ divides $ab$ and divides $km$, so it divides $ab - km = 1$, and it is therefore $1$.

Conversely, suppose $\gcd(a, m) = 1$. The extended Euclidean algorithm produces integers $x$ and $y$ with $xa + ym = \gcd(a, m) = 1$. Reducing modulo $m$ gives $xa \equiv 1 \pmod m$, so $x$ is an inverse of $a$. $\square$
:::

::: math theorem Fermat's little theorem
Let $p$ be a prime and let $a$ be an integer with $p \nmid a$. Then

$$
a^{p-1} \equiv 1 \pmod p.
$$

Consequently, when $p$ is prime, $a^{-1} \equiv a^{p-2} \pmod p$ for every $a$ with $p \nmid a$.
:::

::: math proof Proof
The numbers $a, 2a, \ldots, (p-1)a$ are a permutation of $1, 2, \ldots, p-1$ modulo $p$, because multiplication by a nonzero residue is injective modulo a prime: if $ia \equiv ja \pmod p$ then $p \mid (i-j)a$, and $p \nmid a$ so $p \mid (i-j)$, and $1 \le i, j \le p-1$ forces $i = j$. Multiplying the two lists gives

$$
a^{p-1}(p-1)! \equiv (p-1)! \pmod p.
$$

Since $p$ is prime, $(p-1)!$ is not divisible by $p$, so it can be canceled, leaving $a^{p-1} \equiv 1 \pmod p$.

Finally, multiplying that congruence by $a^{-1}$ gives $a^{p-2} \equiv a^{-1} \pmod p$, which is the stated formula. $\square$
:::

::: math theorem Theorem
The algorithm `mod_pow(a, e, m)` returns the unique residue $r$ with $0 \le r < m$ and $r \equiv a^e \pmod m$.
:::

::: math proof Proof
Write the exponent as $e = \sum_i b_i 2^i$ with $b_i \in \{0, 1\}$. The algorithm maintains an accumulator `result` and a running square `a`, and the invariant is

$$
\text{result} \cdot a^{\,e_{\text{remaining}}} \equiv a^{e_{\text{initial}}}
\pmod m.
$$

The invariant holds initially, because `result` is $1$ and $e$ is the full exponent. When the low bit of the remaining exponent is $1$, the algorithm multiplies `result` by the running square, which preserves the invariant because the square contributes exactly that factor of $a$. When the bit is $0$, `result` is unchanged and the invariant is preserved. In both cases the running square is replaced by its own square and the exponent is halved, which changes $a^{e_{\text{remaining}}}$ into $\left(a^{e_{\text{remaining}}}\right)^2$ and keeps the product unchanged. When the remaining exponent is zero the invariant reads $\text{result} \equiv a^{e_{\text{initial}}} \pmod m$, and `result` is already reduced into $[0, m)$, so it is the required residue. $\square$
:::

## Algorithm derivation

### The extended Euclidean algorithm

Euclid's algorithm computes the greatest common divisor by replacing the larger argument with the remainder. The extended version carries one extra coefficient per argument and produces the Bezout identity $xa + ym = \gcd(a, m)$.

```cpp
long long mod_inverse(long long a, long long m) {
    long long r0 = a, r1 = m;      // remainders
    long long x0 = 1, x1 = 0;      // coefficients of a
    while (r1 != 0) {
        long long q = r0 / r1;
        long long r2 = r0 - q * r1;
        r0 = r1; r1 = r2;
        long long x2 = x0 - q * x1;
        x0 = x1; x1 = x2;
    }
    if (r0 != 1) return -1;        // no inverse exists
    return ((x0 % m) + m) % m;
}
```

The single line that does the mathematics is `x2 = x0 - q * x1`. It is the same algebraic step as `r2 = r0 - q * r1`, applied to the coefficients, and it is what preserves the invariant $x_i a + y_i m = r_i$ for the coefficients $y$ that the code does not store.

The final normalization `((x0 % m) + m) % m` matters. The Bezout coefficient $x_0$ can be negative, and the residue must land in $[0, m)$.

### Binary exponentiation

```cpp
long long mul_mod(long long a, long long b, long long m) {
    return static_cast<long long>((__int128)a * b % m);
}

long long mod_pow(long long a, long long e, long long m) {
    long long result = 1 % m;
    a %= m;
    if (a < 0) a += m;
    while (e > 0) {
        if (e & 1) result = mul_mod(result, a, m);
        a = mul_mod(a, a, m);
        e >>= 1;
    }
    return result;
}
```

Two details are not optional. The `a %= m` at the top keeps the first multiplication inside the range. The `if (a < 0) a += m` handles a negative base, because in C the remainder of a negative number is negative and the residue of a negative number is not.

### Modular division

To solve $bx \equiv c \pmod m$:

1. Compute $d = \gcd(b, m)$.
2. If $d \nmid c$, there is no solution.
3. Otherwise divide through by $d$, solve $\frac{b}{d} x \equiv \frac{c}{d} \pmod{\frac{m}{d}}$, and take the inverse of $\frac{b}{d}$ modulo $\frac{m}{d}$.

When $m$ is prime and $b \not\equiv 0 \pmod p$, step 2 never triggers and the answer is simply $c \cdot b^{p-2} \bmod p$.

## Step-by-step execution

**The extended Euclidean algorithm on $a = 3$, $m = 11$.**

| Step  | $q$          | New remainder         | New coefficient of $a$ |
| ----- | ------------ | --------------------- | ---------------------- |
| start |              | $r_0 = 3$, $r_1 = 11$ | $x_0 = 1$, $x_1 = 0$   |
| 1     | $3 / 11 = 0$ | $r_2 = 3$             | $x_2 = 1$              |
| 2     | $11 / 3 = 3$ | $r_2 = 2$             | $x_2 = -3$             |
| 3     | $3 / 2 = 1$  | $r_2 = 1$             | $x_2 = 4$              |
| 4     | $2 / 1 = 2$  | $r_2 = 0$             | $x_2 = -11$            |

The loop ends with $r_0 = 1$ and $x_0 = 4$, so $4 \cdot 3 + (-1) \cdot 11 = 1$, and the inverse of $3$ modulo $11$ is $4$. The check is $3 \cdot 4 = 12 \equiv 1 \pmod{11}$.

**The same algorithm on $a = 240$, $m = 46$.** The remainders are $10, 6, 4, 2, 0$, so the loop ends with $r_0 = 2$. Since $2 \ne 1$, the function returns $-1$, and correctly so: $\gcd(240, 46) = 2$, so $240$ has no inverse modulo $46$.

**Fermat's route to the same inverse.** With the prime modulus $p = 7$, the inverse of $3$ is $3^{7-2} = 3^5 = 243 \equiv 5 \pmod 7$, and indeed $3 \cdot 5 = 15 \equiv 1 \pmod 7$.

**Binary exponentiation on $2^{10} \bmod 1000$.** The exponent $10$ is $1010$ in binary, so the loop runs four times.

| Iteration | $e$ | $e \bmod 2$ | `result`                             | running square |
| --------- | --- | ----------- | ------------------------------------ | -------------- |
| start     | 10  |             | 1                                    | 2              |
| 1         | 10  | 0           | 1                                    | 4              |
| 2         | 5   | 1           | 4                                    | 16             |
| 3         | 2   | 0           | 4                                    | 256            |
| 4         | 1   | 1           | $4 \cdot 256 = 1024 \bmod 1000 = 24$ | 536            |

The answer is $24$, and $2^{10} = 1024$ confirms it. Notice that the multiplication $4 \cdot 256 = 1024$ was reduced to $24$ immediately, and the running square was reduced to $536$ rather than being left at $65536$.

## Correctness proof

::: math theorem Theorem
`mod_inverse(a, m)` returns the inverse of $a$ modulo $m$ when one exists, and returns $-1$ when none exists.
:::

::: math proof Proof
**The invariant.** After each iteration, there are integers $x$ and $y$ with $x a + y m = r_0$, and the next remainder and coefficient satisfy $r_1 = r_0 - q r_1$ and $x_1 = x_0 - q x_1$ in the same step.

The invariant holds initially with $x_0 = 1$, $y_0 = 0$ and $r_0 = a$, because $1 \cdot a + 0 \cdot m = a$. Suppose it holds at the start of an iteration, and let the old values be $r_0, r_1, x_0, x_1$ with $x_0 a + y_0 m = r_0$ and $x_1 a + y_1 m = r_1$. The step computes $r_2 = r_0 - q r_1$ and $x_2 = x_0 - q x_1$, and then

$$
x_2 a + y_2 m = (x_0 a + y_0 m) - q (x_1 a + y_1 m) = r_0 - q r_1 = r_2,
$$

where $y_2 = y_0 - q y_1$. The invariant is preserved.

**Termination.** The remainders are strictly decreasing non-negative integers, so the loop terminates with $r_0 = \gcd(a, m)$.

**The answer.** If the loop ends with $r_0 = 1$, the invariant gives $x_0 a + y_0 m = 1$, and reducing modulo $m$ gives $x_0 a \equiv 1 \pmod m$, so the normalized value of $x_0$ is the inverse. If the loop ends with $r_0 = d > 1$, then $d = \gcd(a, m) > 1$, and by the lemma no inverse exists, so $-1$ is the correct report. $\square$
:::

::: math invariant Invariant
Throughout the extended Euclidean algorithm, the pair of coefficients satisfies $x_i a + y_i m = r_i$, and the remainders satisfy $r_{i+1} = r_{i-1} \bmod r_i$.
:::

## Complexity analysis

| Operation | Time | Space |
| --- | --- | --- |
| Binary exponentiation $a^e \bmod m$ | $O(\log e)$ modular multiplications | $O(1)$ |
| Extended Euclidean algorithm | $O(\log m)$ iterations | $O(1)$ iterative, $O(\log m)$ recursive |
| Modular inverse, prime modulus | $O(\log m)$ by Fermat | $O(1)$ |
| Modular inverse, composite modulus | $O(\log m)$ by the extended Euclid | $O(1)$ |

The number of iterations of the extended Euclidean algorithm is $O(\log \min(a, m))$ rather than $O(\log m)$, because every two iterations halve the larger remainder. The bound on the exponentiation is $\lfloor \log_2 e \rfloor + 1$ iterations, so $e = 10^{18}$ costs about sixty.

The cost of one modular multiplication depends on the modulus. Two residues below $m$ have a product below $m^2$, so for $m \le 10^9 + 7$ the product is below about $10^{18}$ and a signed 64-bit integer holds it. For the modulus $2^{61} - 1$ used by the number-theoretic transform the product can reach about $2^{122}$, and a 128-bit intermediate is required.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| $a^e \bmod m$ | Binary exponentiation |
| The inverse of $a$ modulo a prime $m$ | Fermat, $a^{m-2} \bmod m$ |
| The inverse of $a$ modulo any $m$ | The extended Euclidean algorithm |
| $b x \equiv c \pmod m$ | Divide by the gcd, then invert |
| A recurrence with huge intermediate values | Reduce after every operation |
| A count modulo a prime | The same recurrence, reduced |
| An exact answer that does not fit | Arbitrary-precision integers, not modular arithmetic |
| A composite modulus with a division | The Chinese remainder theorem over the prime powers |
| A primality test on large numbers | Miller-Rabin, which is Fermat's test plus a random base |

The fourth and the eighth rows are the ones that decide real problems. When the modulus is composite, the inverse of $b$ may not exist, and the technique that handles it is to work modulo each prime power of $m$ and combine the results.

## Recursion decision

Both algorithms have a natural recursive form, and both should be written iteratively.

The extended Euclidean algorithm recurses on the Euclidean step: $\gcd(a, m) = \gcd(m, a \bmod m)$, with a depth of $O(\log m)$ frames. The binary exponentiation recurses on the exponent, halving it at each level, with a depth of $O(\log e)$ frames.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative, because the depth is logarithmic but the code is not longer |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The depth is never the real problem here: $O(\log m)$ frames are harmless even in Python, where the limit is 1000. The real reason to iterate is that the iterative forms are the same length, they have no per-call overhead in the inner loop of a hot computation, and the recursive form of binary exponentiation has to carry a result parameter that the iterative form keeps in a register.

## Implementation walkthrough

Three lines decide whether the arithmetic is right.

```cpp
a %= m;
if (a < 0) a += m;
return ((x0 % m) + m) % m;
```

The first two normalize the input into $[0, m)$. The third normalizes the Bezout coefficient into $[0, m)$.

The negative case is not hypothetical. In C and C++ the remainder of a negative dividend is negative, so $(-1) \% 7$ is $-1$, not $6$. A program that adds a negative residue and then compares it against a positive answer will report a mismatch on a correct computation. The same problem appears in the multiplication, where two negative-looking residues produce a positive product that is then reduced against a negative modulus.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using Fermat's formula on a composite modulus | The program divides by a value that is not an inverse | Check $\gcd(b, m) = 1$ first |
| Forgetting to reduce the base before the loop | The first multiplication overflows | Reduce the base at the top |
| Leaving negative residues unreduced | The answer is negative, or the comparison fails | Normalize into $[0, m)$ |
| Using a 64-bit product with a large modulus | Silent overflow in the multiplication | Use a 128-bit intermediate |
| Dividing instead of multiplying by an inverse | Wrong answer, or a division by zero | Never divide modulo $m$ |
| Assuming a prime modulus when it is composite | The inverse does not exist for some values | Compute the gcd |
| Canceling a factor that is zero modulo $p$ | The cancellation is invalid | Check that the factor is nonzero before canceling |

### Why this fails: Fermat's formula on a composite modulus

The plausible wrong approach is to remember that the inverse of $a$ modulo $m$ is $a^{m-2}$ and to use that everywhere. The formula is taught as "the inverse" in too many places, and the condition attached to it, that $m$ must be prime, is easy to forget because most contest moduli are prime.

The smallest counterexample is the modulus $m = 4$ with the value $a = 2$. The program computes the inverse as $2^{4-2} = 4 \equiv 0 \pmod 4$, and then multiplies by zero, which is not an inverse of anything. The correct answer is that no inverse exists, because $\gcd(2, 4) = 2 \ne 1$. A program that computes the gcd first reports "no inverse" and is right; a program that uses the power formula reports a confident, silently wrong number.

No smaller modulus shows the failure. For $m = 2$ the only nonzero residue is $1$, which is its own inverse. For $m = 3$ the residues $1$ and $2$ are both invertible, and $2^{3-2} = 2$ is the correct inverse of $2$. The composite modulus $4$ is the first one with a nonzero residue that has no inverse, and $2$ is the smallest such residue.

A second counterexample in the same family shows that the failure is not only about composite moduli. Fermat's theorem also requires $p \nmid a$. If the modulus is the prime $7$ and the value is $a = 7$, the formula gives $7^{5} \bmod 7 = 0$, which is again not an inverse. The condition on $a$ and the condition on $m$ are two separate parts of the same theorem, and both have to be checked.

The lesson generalizes: **a modular inverse is a statement about the gcd, not about a formula.** The extended Euclidean algorithm answers the question for every modulus and every value, and it answers it by returning the gcd along the way. A program that uses a shortcut without checking the condition will work on every test case that uses a prime modulus, which is precisely why the bug survives.

## Variants and extensions

- **Euler's theorem.** For any modulus $m$ with $\gcd(a, m) = 1$, $a^{\varphi(m)} \equiv 1 \pmod m$, where $\varphi$ is Euler's totient function. Fermat's theorem is the case $m = p$ prime.
- **The Chinese remainder theorem.** Solving modulo each prime power of $m$ and combining, which is the standard answer when $m$ is composite and a division is needed.
- **Miller-Rabin.** A primality test built on Fermat's theorem, strengthened with a random base.
- **Linear recurrences.** A recurrence with constant coefficients can be solved in $O(\log n)$ by matrix exponentiation over the residues.
- **Finite fields.** When $p$ is prime, the residues modulo $p$ form a field, and every nonzero element is invertible. This is what makes the number-theoretic transform possible.
- **Modular division by repeated squaring.** When the modulus is fixed, the inverse of every residue can be precomputed once and reused.

## Contest strategy

1. Read the modulus before anything else. Write down whether it is prime, because that decides whether Fermat's theorem is available.
2. Never divide modulo $m$. Multiply by an inverse, and check the gcd if the modulus is composite.
3. Reduce after every operation, and reduce the multiplicand before the first multiplication.
4. Decide the width of the intermediate type from the modulus. A modulus near $10^9$ fits in a 64-bit product; a modulus near $2^{61}$ does not.
5. Normalize negative values into $[0, m)$ as soon as they are produced, not only at the end.
6. Write the naive version first when the numbers are small. It is the reference implementation, and a disagreement between it and the modular version is the fastest way to find a sign error.

## Worked problems

### Problem 1: a huge power

**Restatement.** Compute $a^e \bmod m$ with $a, e, m \le 10^{18}$.

**Naive baseline.** $e$ multiplications, which is $10^{18}$ steps.

**Insight.** The exponent's binary expansion turns the power into a chain of squarings.

**Derivation.** Run the binary exponentiation loop, reducing after every multiplication.

**Correctness.** The invariant proved above states that the accumulator and the running square always multiply to the original power, so the final value is the residue.

**Complexity.** $O(\log e)$ modular multiplications, about sixty for $e = 10^{18}$.

**Common wrong approach.** Writing `result * a % m` without reducing `a` first, which overflows when $a > m$.

### Problem 2: a linear congruence

**Restatement.** Solve $bx \equiv c \pmod m$, or report that no solution exists.

**Naive baseline.** Try every residue $x \in [0, m)$ and test the congruence, which is $O(m)$.

**Insight.** The gcd decides both whether a solution exists and how many there are.

**Derivation.** Compute $d = \gcd(b, m)$. If $d \nmid c$, there is no solution, because $d$ divides $b$ and $m$ and therefore divides every value of $bx$ reduced modulo $m$, so it must divide $c$. If $d \mid c$, divide the congruence by $d$, compute the inverse of $b/d$ modulo $m/d$, and multiply by $c/d$.

**Correctness.** The divisibility argument above shows the no-solution case is decided correctly. In the other case the divided congruence is equivalent to the original one, and the inverse exists because $\gcd(b/d, m/d) = 1$.

**Complexity.** $O(\log m)$ time and $O(1)$ space.

**Common wrong approach.** Using Fermat's formula for the inverse when the modulus is composite, which fails exactly as in the failure case above.

### Problem 3: a binomial coefficient modulo a prime

**Restatement.** Compute $\binom{n}{k} \bmod p$ where $p$ is prime, $n \le 10^6$, and $k < p$.

**Naive baseline.** The factorial formula $n! / (k!(n-k)!)$, which overflows and then divides incorrectly.

**Insight.** The multiplicative formula needs only the inverse of $k!$, which exists because $k < p$ and $p$ is prime.

**Derivation.** Accumulate the numerator $\prod_{i=0}^{k-1}(n-i)$ and the denominator $k!$ modulo $p$, then multiply the numerator by the inverse of the denominator.

**Correctness.** Every division performed is by a value that is nonzero modulo $p$, so each step is exact in the field of residues, and the final value is the residue of the exact integer. The argument is spelled out in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).

**Complexity.** $O(k + \log p)$ time and $O(1)$ space.

**Common wrong approach.** Applying the same computation when $k \ge p$, where the denominator $k!$ is divisible by $p$ and its inverse does not exist.

## Practice progression

1. **Recognition.** Given a statement, decide whether the answer is exact or reduced, and write down the modulus and whether it is prime.
2. **Direct application.** Implement the binary exponentiation and the extended Euclidean algorithm, and check the inverse against a brute force search over the residues for every modulus up to fifty.
3. **Adaptation.** Write the version that solves a linear congruence, the version that counts the solutions, and the version that works for a composite modulus by factoring it.
4. **Combination.** Combine the modular arithmetic with a dynamic program: compute the number of lattice paths modulo a prime, or the number of increasing subsequences modulo a prime, and compare against the exact answer when it is small enough to compute.
5. **Challenge.** Solve a problem where the modulus is composite and a division is required, using the Chinese remainder theorem, and verify the result against a brute force search over the residues.
6. **Transfer.** Recognize the arithmetic in another subject: a counting problem that overflows, a recurrence whose terms explode, a [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) whose answer must be reduced, or a combinatorial count that must be reported modulo a prime.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of congruence and prove that reduction preserves multiplication. (Formal model)
2. When does the modular inverse of $a$ modulo $m$ exist, and why? (Formal model)
3. State Fermat's little theorem with both of its conditions, and derive the formula for the inverse from it. (Formal model)
4. What invariant does binary exponentiation maintain? (Correctness proof)
5. What invariant does the extended Euclidean algorithm maintain, and what does the final remainder tell you? (Correctness proof)
6. Trace the extended Euclidean algorithm on $a = 3$, $m = 11$ and on $a = 240$, $m = 46$. (Step-by-step execution)
7. What is the smallest modulus and value for which Fermat's inverse formula fails, and what does the program compute? (Common mistakes)
8. Why must a negative residue be normalized, and what does the C remainder of a negative number look like? (Implementation walkthrough)
9. What is the largest intermediate product for a modulus of $10^9 + 7$, and when is a 128-bit type needed? (Complexity analysis)
10. When is a modular inverse computed by Fermat and when by the extended Euclidean algorithm? (Algorithm selection)

## Further reading

- The counting argument that produces the values modular arithmetic reduces is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The discrete mathematics of divisibility, the greatest common divisor and the proof techniques behind these theorems are in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The search that finds a monotone boundary in logarithmic time, which is the other standard way to avoid a linear scan, is in [binary search](/algorithms/searching/binary-search).
- The longest increasing subsequence, whose counting variant needs exactly this arithmetic, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The dynamic program whose answer usually has to be reduced is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The search over a tree of choices, which replaces a modular count when the constraints are local rather than global, is in [backtracking](/algorithms/enumeration/backtracking).
- The string search whose prefix function is the same border structure that makes the extended Euclidean algorithm's coefficients fall into place is in [KMP](/algorithms/strings/kmp).
- The number of lattice points inside a polygon is counted from its hull and from a congruence, so the geometry of this subject meets this arithmetic in [convex hull](/algorithms/geometry/convex-hull).
- A count that must be reduced and a search over many candidates at once are frequently the same problem, and the offline search is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The subject index lists this technique, [modular arithmetic](/algorithms/number-theory/modular-arithmetic), beside the rest of the subject: [the number theory](/algorithms/number-theory/).
