---
id: number-theory.pollard-rho
title: Pollard's rho
summary: Factor a 64-bit integer by following the sequence x^2 + c modulo n until a difference shares a nontrivial factor with n, then split the cofactor and repeat.
division: [platinum]
subjects: [number-theory]
level: advanced
importance: advanced-technique
keywords:
    [
        "pollard's rho",
        integer factorization,
        birthday paradox,
        cycle detection,
        floyd,
        brent,
        gcd,
        miller-rabin,
        64-bit factorization,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic]
    recommended: [number-theory.miller-rabin, number-theory.prime-factorization]
complexity:
    time: "expected O(n^{1/4}) iterations for a semiprime, each O(log n)"
    space: "O(log n) for the stack of pending cofactors"
assumptions:
    - Every input is a positive integer below 2^63.
    - The rho sequence uses x0 = 2 and the fixed constants c = 1, 2, 3, ..., so no randomness is involved.
    - Every modular product is formed exactly, with a 128-bit intermediate or an equivalent exact representation.
    - Primality is decided by the deterministic Miller-Rabin bases 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37.
implementations: number-theory.pollard-rho
reviewed: false
---

<AlgorithmSummary algorithm="number-theory.pollard-rho" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="number-theory.pollard-rho" />

## At a glance

Pollard's rho finds a factor of a composite number by following a pseudorandom sequence modulo that number. It never divides by a trial divisor. Instead, it waits for two values of the sequence to become congruent modulo an unknown prime factor $p$, and a single gcd exposes $p$.

| Property | Value |
| --- | --- |
| **Problem** | Find a nontrivial factor of a composite $n$, then repeat on both parts |
| **Expected time** | $O(\sqrt{p})$ rho steps for the smallest prime factor $p$, so $O(n^{1/4})$ for a semiprime |
| **Space** | $O(\log n)$ for the stack of pending cofactors and the factor list |
| **Requires** | Exact modular multiplication, a gcd, and a deterministic primality test |
| **Fails when** | The product overflows, the sequence is never retried, or the input exceeds the width of the arithmetic |

Three facts carry the technique.

1. **A collision modulo a factor is likely.** If $p \mid n$, the sequence reduced modulo $p$ has only $p$ possible values. By the birthday bound, two of its first $O(\sqrt{p})$ values collide.
2. **A collision is visible through a gcd.** When $x_i \equiv x_j \pmod p$, the difference $x_i - x_j$ is divisible by $p$, so $\gcd(\lvert x_i - x_j \rvert, n)$ is a multiple of $p$. It is a proper factor unless it is also divisible by every other factor of $n$.
3. **A primality test stops the recursion.** Deterministic Miller-Rabin decides whether a cofactor is prime, so rho is only called on composite numbers, and every split makes both parts smaller.

The constants are fixed in this article: $x_0 = 2$ and $f(x) = x^2 + c$ with $c = 1, 2, 3, \ldots$ until a factor is found. The algorithm is a Las Vegas algorithm: every factor it returns is correct, and only the running time is described probabilistically.

## Problem motivation

A single 64-bit composite can defeat trial division completely. Take

$$
n = 1\,000\,000\,007 \ast 1\,000\,000\,009 = 1\,000\,000\,016\,000\,000\,063.
$$

Trial division by every integer up to $\sqrt{n} \approx 10^9$ needs about a billion iterations for this one number. With $100$ such numbers the total is $10^{11}$ divisions, which is minutes of work for an answer that a rho implementation reaches in tens of thousands of steps.

The situation gets worse at the top of the range. The largest signed 64-bit prime is $9\,223\,372\,036\,854\,775\,783$, and its square root is about $3 \times 10^9$. A sieve cannot help with a single value that large either: it would need a table of three billion entries before the first query. What makes the problem tractable is not a smaller table but a different question. Instead of asking "which number divides $n$", rho asks "when do two values of a sequence become equal modulo an unknown divisor of $n$".

The same routine sits inside larger number theory programs. Counting the divisors of a $10^{18}$ number needs its factorization; so does computing Euler's totient, finding a primitive root, or splitting an RSA modulus in a cryptography exercise. In each case the expensive step is the same, and the rho method is the standard first tool for a 64-bit input.

## Recognition patterns

Pollard's rho is the right tool when the statement contains some of these phrases.

- "Factor $n$", "print the prime factorization", "find the largest prime factor", where $n$ can reach $10^{18}$.
- "Print the number of divisors of $n$", with $n$ up to $10^{18}$, so the answer needs the exponents of the factorization.
- "The input contains up to $100$ integers, each at most $10^{18}$", which rules out trial division to the square root but not a fourth-root method.
- "Split $n$ into two factors", "find any nontrivial divisor", "recover $p$ and $q$" from a semiprime.
- "The modulus is a product of two primes near $10^9$", where the product fits in 64 bits but neither factor is small.
- "Compute $\varphi(n)$", "compute the sum of the divisors", or any multiplicative function whose value is read from the prime exponents.

The constraint values that decide the technique:

| Constraint | What it rules |
| --- | --- |
| $n \le 10^{12}$, one value | Trial division to $10^6$ is fine, and rho is unnecessary |
| Many values below $10^7$ | A sieve of smallest prime factors answers every query faster |
| $n \le 10^{18}$, a few values | Deterministic Miller-Rabin plus Pollard's rho |
| $n$ is a product of two primes near $10^9$ | Rho, with about $3 \times 10^4$ expected steps |
| $n$ has a factor below $10^6$ | Strip small factors by trial division before rho |
| $n$ is near $10^{24}$ | The same rho with a multiword or arbitrary-precision modular product |
| $n$ has more than about 30 digits | Rho is no longer the best tool; ECM or a quadratic sieve is |
| The modulus is prime | A primality test decides it, and rho is never needed |

The trap is the phrase "the number is large". A large prime is easy to recognize with Miller-Rabin and impossible to factor, while a large composite with two moderate factors is exactly what rho handles. The size of the input is less important than the size of its smallest prime factor.

## Naive approach

The baseline is trial division up to the square root.

```python
def factorize_trial(n):
    factors = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n //= d
        d += 1
    if n > 1:
        factors.append(n)
    return factors
```

This is correct and it is the right program for $n \le 10^{12}$. For $n$ near $10^{18}$ the loop reaches $10^9$, which is too slow for a single query in most contests, and hopeless for a hundred queries.

A second baseline is Fermat's factorization. It writes $n = a^2 - b^2 = (a-b)(a+b)$ and searches upward from $a = \lceil \sqrt{n} \rceil$.

```python
def factorize_fermat(n):
    a = isqrt(n)
    if a * a < n:
        a += 1
    while True:
        b2 = a * a - n
        b = isqrt(b2)
        if b * b == b2:
            return a - b, a + b
        a += 1
```

Fermat is excellent when the two factors are close, because then $b$ is small. It is terrible when they are far apart: for $n = 1\,000\,000\,007 \ast 1\,000\,000\,009$, the factors differ by $2$, so Fermat is fast, but for $n = 3 \ast 3\,000\,000\,019$ it walks about $10^9$ steps. A contest cannot rely on the factors being close.

A third baseline sieves all primes up to $10^6$ and trial divides by them. That reduces the constant by a factor of about $\ln 10^6 \approx 14$ and changes nothing asymptotically: the remaining cofactor can still be a product of two primes near $10^9$.

## Key insight

The insight is that **a sequence modulo an unknown factor collides much sooner than the factor itself can be found.**

Let $p$ be a prime factor of $n$, and define

$$
x_0 = 2, \qquad x_{i+1} = (x_i^2 + c) \bmod n.
$$

Reduce the same sequence modulo $p$:

$$
y_i = x_i \bmod p.
$$

The sequence $y_0, y_1, \ldots$ takes values in the $p$ residues modulo $p$. If it behaved like a random map, the birthday bound would say that a repeat appears after about $\sqrt{\pi p / 2}$ values, which is $O(\sqrt{p})$. The polynomial $x^2 + c$ is not random, but the heuristic is accurate in practice, and it is the reason the method is fast.

When $y_i = y_j$, the original values satisfy $x_i \equiv x_j \pmod p$, so $p \mid (x_i - x_j)$. Then

$$
\gcd(|x_i - x_j|, n)
$$

is divisible by $p$. It may be $p$ itself, which is a proper factor, or it may be $n$, which means the difference is also divisible by every other factor and the attempt failed. The gcd never returns a value that is not a divisor of $n$, so a failed attempt costs time but never correctness.

This is the step that separates rho from trial division. Trial division asks about one candidate divisor at a time. Rho asks about all divisors of $n$ at once through a gcd, and the birthday bound says the answer arrives after roughly the fourth root of a semiprime.

The sequence is called a rho because of its shape. It eventually enters a cycle, and a diagram of the path into the cycle resembles the Greek letter $\rho$: a tail leading into a loop.

## Visual intuition

Draw the sequence as a path. It starts at $x_0$, runs through a tail of length $\mu$, and then repeats a cycle of length $\lambda$.

```text
x_0 -> x_1 -> ... -> x_mu -> ... -> x_{mu+lambda-1}
                         |                   |
                         +-------------------+
                              the cycle
```

Modulo $n$ the cycle can be long. Modulo a small factor $p$, the same path is compressed into $p$ residues, so the tail and the cycle are short: their total length is $O(\sqrt{p})$. The two walkers of Floyd's algorithm move at different speeds, and the first time they meet modulo $p$ is the first time the fast walker has gone around the cycle far enough to catch the slow one.

For $n = 8051 = 83 \ast 97$ and $c = 1$, the values are

$$
2, 5, 26, 677, 7474, 2839, 871, 1848, 1481, \ldots
$$

and Floyd's walkers compare $x_i$ with $x_{2i}$:

| Step | $x_i$ | $x_{2i}$ | $\gcd(\lvert x_i - x_{2i} \rvert, 8051)$ |
| ---- | ----- | -------- | ---------------------------------------- |
| 1    | $5$   | $26$     | $1$                                      |
| 2    | $26$  | $7474$   | $1$                                      |
| 3    | $677$ | $871$    | $97$                                     |

At step 3, $677 - 871 = -194$, and $\gcd(194, 8051) = 97$. The factor appears without any trial division. The cofactor is $8051 / 97 = 83$.

The picture also explains the failure mode. If the polynomial happens to cycle modulo $p$ in a way that makes every difference also divisible by the cofactor, the gcd is $n$ and the attempt is wasted. The remedy is to change $c$ and start again. For $n = 1681 = 41^2$, the constants $c = 1$ and $c = 2$ both return $n$, and $c = 3$ returns $41$; the retry is not optional.

## Formal model

::: math definition Definition
Let $n > 1$ and let $c \ge 1$. The **rho sequence** of $n$ with constant $c$ is the sequence $(x_i)$ defined by

$$
x_0 = 2, \qquad x_{i+1} = (x_i^2 + c) \bmod n.
$$

A **collision modulo $m$** is a pair of indices $i \ne j$ with $x_i \equiv x_j \pmod m$.
:::

::: math definition Definition
A **nontrivial factor** of $n$ is an integer $d$ with $1 < d < n$ and $d \mid n$. A **prime factorization** of $n$ is the multiset of primes whose product is $n$; it is unique by the fundamental theorem of arithmetic.
:::

::: math lemma Lemma
If $d = \gcd(\lvert x_i - x_j \rvert, n)$ and $0 < d < n$, then $d$ is a nontrivial factor of $n$.
:::

::: math proof Proof
The gcd of any integer and $n$ divides $n$ by definition. The value $d$ is positive by the assumption, and it is not $n$ by the assumption, so it is a divisor of $n$ strictly between $1$ and $n$. $\square$
:::

::: math lemma Lemma
Let $p$ be a prime factor of $n$. If $x_i \equiv x_j \pmod p$ and $x_i \not\equiv x_j \pmod n$, then $\gcd(\lvert x_i - x_j \rvert, n)$ is a proper multiple of $p$.
:::

::: math proof Proof
The difference $x_i - x_j$ is divisible by $p$, so $p$ divides the gcd. The difference is not divisible by $n$, so the gcd is not $n$. Since the gcd divides $n$ and is divisible by $p$, it is a proper multiple of $p$. $\square$
:::

::: math theorem Theorem
Suppose the rho loop with constant $c$ returns a value $d \ne n$. Then $d$ is a nontrivial factor of $n$.
:::

::: math proof Proof
The loop returns only when $d \ne 1$ and $d \ne n$, and $d$ is computed as a gcd of an integer with $n$, so the first lemma applies. $\square$
:::

The theorem is the entire correctness guarantee for one split. It does not promise that a split is found; that is the job of the retry loop and of the heuristic analysis. What it does promise is that the algorithm never invents a divisor.

::: math invariant Invariant
In Floyd's version, before iteration $i$ the walkers hold $x_i$ and $x_{2i}$. Initially $i = 0$ and both hold $x_0 = 2$. Each iteration advances the slow walker by one step and the fast walker by two, so the invariant holds with $i$ increased by one.
:::

Once the sequence modulo $p$ has entered its cycle, the two walkers eventually occupy the same residue modulo $p$, because the fast walker gains one position on the slow walker per iteration around a cycle of length $\lambda$. The invariant is what makes the gcd at that moment meaningful.

## Algorithm derivation

The implementation has six parts.

**Step 1: remove small prime factors by trial division.** This is fast, it handles $2$, $3$ and the other small primes directly, and it keeps rho away from small composite numbers where the polynomial can have a fixed point.

```cpp
for (int p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
    while (n % p == 0) {
        factors.push_back(p);
        n /= p;
    }
}
```

**Step 2: test the remaining cofactor for primality.** Deterministic Miller-Rabin with the twelve fixed bases decides every value below $2^{63}$. A prime cofactor is appended and the recursion for that branch ends.

```cpp
if (is_prime(n)) {
    factors.push_back(n);
} else {
    std::uint64_t d = pollard(n);
    stack.push_back(d);
    stack.push_back(n / d);
}
```

**Step 3: advance the rho sequence.** The update is one modular square plus a constant, and the addition is reduced without overflowing.

```cpp
std::uint64_t rho_step(std::uint64_t x, std::uint64_t c, std::uint64_t n) {
    std::uint64_t square = mul_mod(x, x, n);
    std::uint64_t add = c % n;
    return square >= n - add ? square - (n - add) : square + add;
}
```

The conditional form matters in Java, where `square + add` can overflow a signed `long` when $n$ is near $2^{63}$. In C and C++ the unsigned sum of two values below $n$ fits in 64 bits, so a plain addition followed by a conditional subtraction is also correct.

**Step 4: run Floyd's cycle finding.** The slow walker takes one step and the fast walker takes two. The gcd of the difference with $n$ is computed after every pair of steps.

```cpp
std::uint64_t pollard(std::uint64_t n) {
    std::uint64_t c = 1;
    for (;;) {
        std::uint64_t x = 2, y = 2, d = 1;
        while (d == 1) {
            x = rho_step(x, c, n);
            y = rho_step(rho_step(y, c, n), c, n);
            std::uint64_t diff = x >= y ? x - y : y - x;
            d = gcd_u64(diff, n);
        }
        if (d != n) return d;
        ++c;
    }
}
```

The inner loop stops as soon as the gcd is greater than $1$. The outer loop changes the constant when the gcd is $n$, which means the attempt found the whole number rather than a proper factor.

**Step 5: split the cofactor and repeat.** The rho routine returns one factor. The other factor is $n / d$, and both are pushed onto an explicit stack. Every pop either appends a prime or produces two smaller numbers, so the process terminates.

**Step 6: sort the factors.** The factorization is unique, but the order in which the stack produces it is not. Sorting puts the factors in ascending order, which is the output contract of every reference program.

The driver is the same in all six languages:

```text
read t
for each value n:
    remove small primes
    push the remaining cofactor if it is greater than 1
    while the stack is not empty:
        pop m
        if m is prime: append m
        else: d = pollard(m); push d and m / d
    sort and print
```

## Step-by-step execution

**$n = 8051$, $c = 1$.** The first values of the sequence are $2, 5, 26, 677, 7474, 2839, 871, \ldots$. Floyd's walkers are $x_i$ and $x_{2i}$.

| Iteration | $x_i$ | $x_{2i}$ | Difference | $\gcd$ |
| --------- | ----- | -------- | ---------- | ------ |
| 1         | $5$   | $26$     | $21$       | $1$    |
| 2         | $26$  | $7474$   | $7448$     | $1$    |
| 3         | $677$ | $871$    | $194$      | $97$   |

The gcd becomes $97$, which is a proper factor. The quotient is $8051 / 97 = 83$, and both factors are prime, so the factorization is $8051 = 83 \ast 97$.

**$n = 1681 = 41^2$, retrying the constant.** The smallest prime factor is $41$, which is larger than every stripped small prime, so rho is called on $1681$ itself.

| Constant $c$ | Outcome            | Steps |
| ------------ | ------------------ | ----- |
| $1$          | gcd becomes $1681$ | $7$   |
| $2$          | gcd becomes $1681$ | $5$   |
| $3$          | gcd becomes $41$   | $8$   |

The first two attempts fail because the difference is divisible by both copies of $41$, so the gcd is the whole number. The retry with $c = 3$ separates the two copies and returns $41$. This is why a single fixed polynomial is not enough.

**$n = 2^{63} - 1 = 9\,223\,372\,036\,854\,775\,807$.** Trial division by the small primes removes $7$ twice, leaving $188\,232\,082\,384\,791\,343$. The cofactor is composite, and rho finds $73$, then $127$, then $337$, then $92737$, then $649657$. The complete factorization is

$$
2^{63} - 1 = 7^2 \ast 73 \ast 127 \ast 337 \ast 92737 \ast 649657.
$$

The example shows why the driver must keep splitting the quotient rather than stopping after the first factor.

## Correctness proof

::: math theorem Theorem
If the factorization procedure terminates on a positive integer $n < 2^{63}$, it prints exactly the prime factorization of $n$ in ascending order.
:::

::: math proof Proof
The procedure removes small primes one at a time, and each removal appends a prime and divides it out, so the product of the appended factors times the remaining value is always the original $n$. This is the loop invariant of the stripping step.

The stack starts with the remaining cofactor. Each pop either appends a value that the Miller-Rabin test has certified prime, or splits the value into $d$ and $m/d$ by the rho routine. In the second case, the previous theorem says $d$ is a nontrivial factor, so both new values are positive and smaller than $m$. The sum of the stack values therefore decreases at every split, and the stack cannot grow forever. Since a prime is never split, every branch eventually ends in prime factors.

The product of all appended primes is the original $n$ by the invariant, and every appended value is prime, so the multiset is the prime factorization. Uniqueness of the prime factorization means the multiset does not depend on the order of the splits. The final sort puts it in ascending order. $\square$
:::

The Miller-Rabin test is the other half of the proof. Its twelve fixed bases are deterministic for every value below $3.3 \times 10^{24}$, which covers $2^{63}$, so a value is certified prime only when it really is prime. The article on [Miller-Rabin](/algorithms/number-theory/miller-rabin) proves that statement.

The rho routine itself is a Las Vegas algorithm. The theorem above says that every value it returns is a factor. The retry loop says that a failed attempt is abandoned and tried again with a different constant. What is not proved is a worst-case bound on the number of attempts; the analysis below is an expectation under the birthday heuristic. This distinction matters: a rho implementation must never claim that a returned value is prime without testing it, and it must be prepared to change the constant.

## Complexity analysis

| Operation                         | Time                                         | Space       |
| --------------------------------- | -------------------------------------------- | ----------- |
| One rho step                      | $O(1)$ modular multiplications               | $O(1)$      |
| One gcd                           | $O(\log n)$ divisions                        | $O(1)$      |
| One rho attempt                   | expected $O(\sqrt{p})$ steps                 | $O(1)$      |
| Full factorization of a semiprime | expected $O(n^{1/4} \log n)$ word operations | $O(\log n)$ |
| Miller-Rabin per cofactor         | $O(\log n)$ multiplications per base         | $O(1)$      |
| Trial division by small primes    | $O(1)$ for the fixed list                    | $O(1)$      |

The expected number of rho steps is proportional to $\sqrt{p}$, where $p$ is the smallest prime factor of the current cofactor. For a semiprime $n = p q$ with $p \le q$, that is about $n^{1/4}$. For $n$ near $10^{18}$ the smallest factor can be near $10^9$, so the expectation is about $3 \times 10^4$ steps; for a factor near $10^{12}$ it is about $10^6$ steps.

Each step performs three modular squares, three additions and one gcd. The gcd is $O(\log n)$ divisions in the worst case, so the word-operation count carries an extra $\log n$. In bit complexity, a modular multiplication of two $\log n$-bit numbers costs $O(\log^2 n)$ with schoolbook multiplication, which gives $O(n^{1/4} \log^3 n)$ bit operations for a semiprime. These bounds are expectations, not worst-case guarantees.

The space is small. The stack holds at most one pending cofactor per prime factor, and a number below $2^{63}$ has at most $62$ prime factors with multiplicity, so the stack and the factor list are both $O(\log n)$.

The Pascal variant multiplies by doubling in two 32-bit limbs, so one modular multiplication costs $O(\log n)$ limb additions instead of $O(1)$ machine multiplications. Its expected time is therefore $O(n^{1/4} \log^2 n)$ limb operations for a semiprime, which is slower by a logarithmic factor but still exact.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One number, $n \le 10^{12}$ | Trial division to the square root |
| Many numbers, all at most $N \le 10^7$ | A sieve of smallest prime factors |
| One 64-bit number, a few queries | Deterministic Miller-Rabin plus Pollard's rho |
| A 64-bit number known to be a semiprime | Rho, with a primality test to stop the recursion |
| A number with many small factors | Strip the small primes first, then test the cofactor |
| A number near $10^{24}$ | The same rho with a multiword modular product |
| A number with two factors very close together | Fermat's factorization can be faster than rho |
| A number with a factor of a special form | Pollard's $p - 1$ or the elliptic curve method |
| A number beyond about 30 digits | ECM or a quadratic sieve, not rho |
| Only the gcd or the lcm is needed | Euclid's algorithm, without factoring |
| Only primality is needed | Miller-Rabin, without rho |

The choice between rho, Fermat and $p - 1$ is a choice about the shape of the unknown factor. Rho depends on the size of the smallest factor, Fermat depends on the distance between the two factors, and $p - 1$ depends on the smoothness of $p - 1$. None of them is universally best, and a robust 64-bit solution usually starts with small trial division, then Miller-Rabin, then rho.

## Reference implementations

All six programs share one contract.

- **Input:** $t$ on the first line, then $t$ lines, each holding one positive integer below $2^{63}$.
- **Output:** one line per integer, holding its prime factors in ascending order separated by single spaces. The factorization of $1$ is an empty line.

| Language   | File                    | Exact arithmetic                         |
| ---------- | ----------------------- | ---------------------------------------- |
| C          | `c/program.c`           | `unsigned __int128` for the product      |
| C++17      | `cpp17/program.cpp`     | `unsigned __int128` for the product      |
| Java       | `java/Main.java`        | `long` when safe, `BigInteger` otherwise |
| Python     | `python/program.py`     | Arbitrary-precision integers             |
| Pascal     | `pascal/program.pas`    | Two 32-bit limbs and repeated doubling   |
| JavaScript | `javascript/program.js` | `BigInt`                                 |

The C and C++ variants set the standard output to binary mode, so their line feeds match the other four byte for byte. The Java variant uses a byte-array scanner rather than `java.util.Scanner`, because a contest input can be large. The JavaScript and Pascal variants are educational references, not USACO submission languages. The Pascal listing keeps every value as two limbs in $[0, 2^{32})$, which the browser compiler represents exactly, and never relies on a 128-bit integer.

The Pascal variant also follows the browser compiler's input rules: it uses `SysUtils`, reads one value per line, and does not use `IOResult`. It is slower than the other five because each modular multiplication is a doubling loop, but it produces the same output.

## Recursion decision

The natural description of factorization is recursive: find a factor, then factor both parts. The reference programs use an explicit stack instead.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative, for uniformity and for a smaller constant |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The recursion depth is at most the number of prime factors, which is at most $62$ for a 64-bit number, so the stack is not a danger in any language. The explicit stack is still the better choice for three reasons. It keeps the pending work visible in one place, it avoids allocating a list at every recursive call, and it makes the termination argument a statement about the sum of the stack values rather than a statement about the call depth.

Floyd's cycle finding is iterative for a stronger reason: the walkers are just two values, and recursion would add nothing. Brent's variant, described below, is also iterative.

## Implementation walkthrough

Five details decide whether the program is right.

**The gcd takes the difference, not the value.** The line that matters is

```cpp
std::uint64_t diff = x >= y ? x - y : y - x;
d = gcd_u64(diff, n);
```

The gcd of $x$ with $n$ is usually $1$, because a random value of the sequence has no reason to share a factor with $n$. The difference is divisible by the unknown factor exactly when the two values collide modulo that factor. Using `gcd(x, n)` throws away the birthday argument and turns rho into a slow trial division.

**The difference must be unsigned.** In C and C++, `x - y` on two `long long` values can overflow if their signs differ, and `std::llabs` of the most negative value is undefined. The reference programs use `uint64_t` and compute `x >= y ? x - y : y - x`, which is exact for every pair of non-negative values.

**The product must be wide.** Two residues below $2^{63}$ have a product below $2^{126}$, which does not fit in 64 bits. C and C++ cast to `unsigned __int128` before the multiplication. Java uses the `long` product when it cannot overflow and `BigInteger` otherwise. Python and JavaScript use arbitrary-precision integers. Pascal splits each value into two limbs and doubles.

**A failed attempt changes the constant.** The outer loop is not decoration:

```cpp
if (d != n) return d;
++c;
```

When the gcd is $n$, the difference is divisible by every factor, and the same polynomial will keep returning $n$ if it is restarted with the same $c$. The retry with $c + 1$ is what makes $1681$ factor correctly.

**The quotient is exact.** After rho returns $d$, the cofactor is $n / d$. Since $d$ is a divisor by the gcd property, the division has no remainder. The driver pushes both parts and continues. Sorting at the end is a presentation step, not a correctness step.

The input contract also deserves a line. A value of $1$ has an empty prime factorization, so the program prints an empty line. A value of $0$ is outside the contract; the programs return an empty line for it rather than looping forever.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using $\gcd(x, n)$ instead of $\gcd(\lvert x - y \rvert, n)$ | The gcd is almost always $1$, and rho never finds a factor | Take the difference of the two walkers |
| Not retrying when the gcd is $n$ | The same polynomial cycles forever for numbers such as $1681$ | Increment $c$ and restart |
| Calling rho on a prime | The sequence has no proper factor, so the loop never ends | Run Miller-Rabin first |
| Multiplying residues in 64 bits | The product wraps and the primality test becomes unreliable | Use 128 bits or an exact wide type |
| Forgetting to strip small factors | Small composites can make the polynomial return $n$ repeatedly | Trial divide by primes up to $37$ first |
| Treating $1$ as prime | The factorization contains a spurious factor | Handle values below $2$ separately |
| Forgetting the leftover cofactor | A prime input produces an empty list | Push the remaining value if it is greater than $1$ |
| Sorting the factors in discovery order | The output order differs from the contract | Sort before printing |
| Computing $x - y$ in signed arithmetic | The difference overflows for large residues | Compare first, then subtract unsigned |
| Assuming the first factor is prime | A composite factor is printed as if it were prime | Test every cofactor with Miller-Rabin |

### Why this fails: the gcd of the value, not the difference

The plausible wrong solution is to compute $\gcd(x, n)$ at every step. It is natural, because the goal is a factor of $n$, and a gcd is exactly the operation that finds common factors. The mistake is that a single value of the sequence is essentially random modulo $n$, so it is very unlikely to share a factor with $n$.

Take $n = 8051$ and $c = 1$. The sequence begins $2, 5, 26, 677, 7474, 2839, 871, \ldots$. The gcds with $8051$ are

$$
\gcd(5, 8051) = 1, \quad \gcd(26, 8051) = 1, \quad \gcd(677, 8051) = 1,
$$

and the same is true for the next several values. The factor $97$ appears only when the difference of two values is taken: at step 3, $677 - 871 = -194$ and $\gcd(194, 8051) = 97$.

The birthday argument explains why. The chance that one random value is divisible by $97$ is about $1/97$, so the expected wait is $97$ steps. Two values collide modulo $97$ after about $\sqrt{97} \approx 10$ steps, which is the speedup the algorithm is built on. The difference is the object that becomes divisible by the unknown factor; the value itself is not.

### Why this fails: a 64-bit product in the primality test

The second mistake is to write the modular multiplication with a plain 64-bit product.

```cpp
long long bad_mul(long long a, long long b, long long m) {
    return a * b % m;   // overflows before the modulo
}
```

Take the prime $n = 9\,223\,372\,036\,854\,775\,783$, the largest prime below $2^{63}$. During Miller-Rabin, a residue near $n$ is squared, and the true product is near $2^{126}$, which is far beyond a signed 64-bit integer. The multiplication wraps modulo $2^{64}$, and the residue that reaches the primality test is unrelated to the true power. The test then reports the prime as composite.

That verdict is worse than a wrong answer, because it sends the program into rho on a prime. The sequence has no proper factor, so the gcd is always $1$ or $n$, and the rho loop never terminates. The same failure appears for a composite whose factors are large enough that the wasted rho search is effectively endless.

The fix is the one used by the reference programs: form the full product before reducing. C and C++ have `unsigned __int128`, Java has `BigInteger`, Python and JavaScript have arbitrary-precision integers, and Pascal doubles in 32-bit limbs. The rule is simple: **the modulo must see the full product, not its low 64 bits.**

## Variants and extensions

- **Brent's cycle finding.** Instead of moving two walkers, Brent saves the current value and compares it with a block of later values, which uses fewer gcds and is the standard optimization in contest libraries.
- **Batch gcd.** Accumulate the product of many differences modulo $n$ and take one gcd at the end, which replaces many gcds with one multiplication and one gcd. It is faster when the gcd is the bottleneck.
- **Other polynomials.** $f(x) = x^2 + c$ is the standard choice. A different quadratic or a cubic changes the cycle lengths, and changing $c$ is the simplest way to retry.
- **Pollard's $p - 1$.** Finds a factor $p$ when $p - 1$ is smooth, using exponentiation by a product of small prime powers. It complements rho: one depends on the size of $p$, the other on the factorization of $p - 1$.
- **Fermat's factorization.** Fast when the two factors are close. It is a one-line alternative to try before rho when the statement hints that $p$ and $q$ are near each other.
- **SQUFOF.** A deterministic method for numbers below about $10^{18}$ that is competitive with rho and sometimes faster in practice.
- **The elliptic curve method.** The natural generalization of $p - 1$ to a group of points on a curve. It is the tool of choice when $n$ has a factor much smaller than its square root but the number itself is large.
- **The quadratic sieve and the general number field sieve.** Subexponential methods for numbers beyond the reach of rho, and the algorithms used to factor RSA moduli.
- **Pollard's rho for discrete logarithms.** The same cycle-finding idea solves $a^x \equiv b \pmod p$, which is the subject of [discrete logarithm](/algorithms/number-theory/discrete-logarithm).

## Contest strategy

1. Decide the width first. A value below $2^{63}$ fits in a signed 64-bit integer, but its square does not, so every modular product needs a wider type.
2. Strip the small primes up to $37$ before anything else. It is cheap, it handles the common small cases, and it makes the remaining cofactor odd and coprime to the small bases.
3. Test the cofactor with deterministic Miller-Rabin. Never call rho on a value that has not been proved composite.
4. Write rho with a retry. A fixed $c$ is a bug waiting for the input that cycles badly; the retry costs nothing on the cases that work.
5. Use the gcd of the difference, not of the value, and compute the difference without signed overflow.
6. Push both factors and keep going until the stack is empty. Stopping after the first factor is the most common way to lose the larger prime.
7. Sort before printing, and check the output on $1$, on a prime, on a square, and on a product of two large primes.
8. If a value is near $10^{24}$ rather than $10^{18}$, widen the product beyond 128 bits; the rest of the algorithm does not change.

## Worked problems

### Problem 1: Factorize

**Restatement.** There are $Q \le 100$ queries. Each gives an integer $a_i$ with $1 \le a_i \le 10^{18}$. Factorize every value and print the number of prime factors followed by the factors themselves.

**Naive baseline.** Trial division up to $\sqrt{a_i}$ costs up to $10^9$ divisions per query, or $10^{11}$ operations for the whole input.

**Insight.** Every query is independent, and the expected cost of rho is the square root of the smallest prime factor. A value with two factors near $10^9$ needs about $3 \times 10^4$ rho steps.

**Derivation.** Strip the primes up to $37$, test the cofactor with Miller-Rabin, and split it with rho until every part is prime. Sort the factors, print their count, then the factors.

**Correctness.** The Miller-Rabin test certifies each prime, and the rho theorem certifies each split. The multiset of primes is therefore the unique factorization of $a_i$.

**Complexity.** Expected $O(a_i^{1/4} \log a_i)$ per query for a semiprime, with $O(\log a_i)$ space. The exact bound is an expectation under the birthday heuristic.

**Common wrong approach.** Using trial division up to $10^6$ and assuming the leftover cofactor is prime. A product of two primes near $10^9$ survives that bound and is printed as a single composite factor.

### Problem 2: Divisions

**Restatement.** Given $N$ with $1 \le N \le 10^{18}$, print the number of positive divisors of $N$.

**Naive baseline.** Test every integer up to $\sqrt{N}$ and pair the divisors. That is up to $10^9$ tests for one value.

**Insight.** If $N = p_1^{a_1} \cdots p_k^{a_k}$, the divisor count is $\prod_i (a_i + 1)$. The task reduces to factorization, not to enumeration.

**Derivation.** Factor $N$ with rho, count the exponent of each prime, and multiply the exponents plus one. For the sample $100\,000\,007\,700\,000\,049 = 100\,000\,007 \ast 1\,000\,000\,007$, the exponents are both $1$, so the answer is $4$. For a prime, the answer is $2$.

**Correctness.** Every divisor chooses an exponent between $0$ and $a_i$ independently for each prime, and the choices are in bijection with the divisors. The product therefore counts them exactly.

**Complexity.** The factorization dominates: expected $O(N^{1/4} \log N)$ for a semiprime, then $O(\log N)$ to multiply the exponent counts.

**Common wrong approach.** Doubling the count of divisors found below the square root. When $N$ is a perfect square, the square root is its own partner, so the doubling counts it twice. The factorization route has no such special case.

### Problem 3: Big Factoring

**Restatement.** Given one integer $n$ with $2 \le n \le 10^{24}$, print its prime factors in ascending order, repeating each factor as many times as it occurs.

**Naive baseline.** Trial division to $\sqrt{n}$ reaches $10^{12}$ for the largest input, which is far too many iterations.

**Insight.** Rho still needs only about the square root of the smallest prime factor, so a factor near $10^{12}$ costs about $10^6$ steps. The obstacle is not the algorithm but the width: $10^{24}$ does not fit in 64 bits, and a product of two residues near $10^{24}$ needs about $160$ bits.

**Derivation.** Use the same driver with a modular multiplication that handles the wider value. A 128-bit type holds $n$ itself, but two residues near $2^{80}$ have a product near $2^{160}$, so C and C++ need a multiword product or a multiprecision type; Java uses `BigInteger`, and Python and JavaScript already have arbitrary precision. The twelve Miller-Rabin bases are still proved up to $3.3 \times 10^{24}$, which covers the input, so only the arithmetic changes.

**Correctness.** The rho theorem is independent of the width: any returned proper divisor is correct, and the recursion ends when the primality test accepts a factor.

**Complexity.** Expected $O(n^{1/4} \log n)$ wide multiplications for a semiprime, with the cost of one multiplication growing with the width. For $n$ near $10^{24}$ the expected number of rho steps is around $10^6$.

**Common wrong approach.** Using 64-bit arithmetic and silently truncating the input. The value $10^{24}$ is about $2^{80}$, so a 64-bit parser wraps and the factorization is of a different number.

## Practice progression

1. **Recognition.** Given a statement, decide whether the bound is small enough for trial division, large enough to need a sieve, or large enough that the smallest factor is unknown.
2. **Direct application.** Implement Miller-Rabin and rho, and factor every number up to $10^6$. Compare against trial division, which is the reference for this range.
3. **Adversarial cases.** Test $1$, $2$, $4$, $1681 = 41^2$, $8051 = 83 \ast 97$, $2^{63} - 1$, and a product of two primes near $10^9$.
4. **Widening.** Replace the 64-bit product with a 128-bit one and test the largest prime below $2^{63}$ and a semiprime near $10^{18}$.
5. **Combination.** Use the factorization to count divisors, compute Euler's totient, or find the largest prime factor, and compare against a brute force when $n$ is small.
6. **Transfer.** Recognize the same cycle-finding idea in the discrete logarithm, in Pollard's $p - 1$, and in the birthday attack on a hash function.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does a collision modulo a prime factor $p$ appear after about $\sqrt{p}$ steps? (Key insight)
2. Why is the gcd taken on the difference of two walkers rather than on one walker and $n$? (Common mistakes)
3. What does the rho loop return when the gcd is $n$, and what must the program do next? (Algorithm derivation)
4. Prove that a returned value $d$ with $1 < d < n$ is a nontrivial factor. (Formal model)
5. Trace Floyd's algorithm on $8051$ and say at which iteration the factor appears. (Step-by-step execution)
6. Why does $1681$ fail for $c = 1$ and $c = 2$, and what does $c = 3$ change? (Step-by-step execution)
7. What is the expected time for a semiprime, and why is it the fourth root rather than the square root? (Complexity analysis)
8. Why must the modular product be formed in a wider type, and what goes wrong in the primality test when it is not? (Implementation walkthrough)
9. When is trial division better than rho, and when is a sieve better than both? (Algorithm selection)
10. Why does the driver use an explicit stack instead of recursion, even though the depth is at most $62$? (Recursion decision)
11. What changes when the input is $10^{24}$ instead of $10^{18}$? (Worked problems)
12. Why is rho called a Las Vegas algorithm rather than a Monte Carlo algorithm? (Correctness proof)

## Further reading

- The modular arithmetic that makes every step exact, including binary exponentiation, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The deterministic primality test that decides when rho must stop is in [Miller-Rabin](/algorithms/number-theory/miller-rabin).
- The trial division and sieve methods that handle small inputs, and the divisor-count formula used by the second worked problem, are in [prime factorization](/algorithms/number-theory/prime-factorization).
- The sieve that answers many small factorization queries is in [sieve of Eratosthenes](/algorithms/number-theory/sieve).
- The gcd and the extended Euclidean algorithm, which the rho loop uses on every iteration, are in [extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean).
- The same cycle-finding idea applied to exponents is in [discrete logarithm](/algorithms/number-theory/discrete-logarithm).
- The multiplicative function whose value is read from the exponents is in [Euler's totient](/algorithms/number-theory/euler-totient).
- The divisibility, gcd and unique factorization background is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index places this technique beside the other arithmetic in [number theory](/algorithms/number-theory/).
- The original paper is Pollard's "A Monte Carlo method for factorization" (1975); Brent's cycle-finding improvement is "An improved Monte Carlo factorization algorithm" (1980).
