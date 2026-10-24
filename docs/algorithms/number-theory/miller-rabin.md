---
id: number-theory.miller-rabin
title: Miller-Rabin primality test
summary: Decide whether a 64-bit integer is prime by writing n - 1 as a power of two times an odd number and checking a fixed set of bases, which is deterministic for the whole signed 64-bit range.
division: [platinum]
subjects: [number-theory]
level: advanced
importance: advanced-technique
keywords:
    [
        miller-rabin,
        primality test,
        strong pseudoprime,
        carmichael number,
        witness,
        deterministic bases,
        modular exponentiation,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic]
    recommended: [foundations.binary-representation]
complexity:
    time: "O(k log n) modular multiplications with k = 12"
    space: "O(1)"
assumptions:
    - Every input value is a non-negative integer below 2^63.
    - The twelve fixed prime bases are deterministic for every value below 3.3 x 10^24, so no randomness is needed in the 64-bit range.
implementations: number-theory.miller-rabin
reviewed: false
---

## At a glance

The Miller-Rabin test decides whether an integer is prime. It is Fermat's little theorem with one extra observation, and the extra observation is what turns a test that Carmichael numbers defeat into one that is exact on the whole 64-bit range when the bases are chosen in advance.

Three facts carry the technique.

1. **Fermat gives a necessary condition.** For a prime $n$ and a base $a$ with $n \nmid a$, $a^{n-1} \equiv 1 \pmod n$. A composite that violates this is caught immediately.
2. **The square root of one has only two values modulo a prime.** If $n$ is prime, then $x^2 \equiv 1 \pmod n$ forces $x \equiv \pm 1 \pmod n$. Writing $n - 1 = 2^s d$ with $d$ odd, the powers $a^d, a^{2d}, \ldots, a^{2^s d}$ therefore either start at $1$ or must step on $-1$ before reaching $1$.
3. **A fixed set of bases is deterministic for 64-bit input.** The twelve primes $2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37$ decide every composite below $3.3 \times 10^{24}$, which is far beyond $2^{63} - 1$. No randomness is needed.

One pass over one base costs $O(\log n)$ modular multiplications, and twelve bases cost twelve times that. For $n$ near $10^{18}$ the whole test is about fifteen hundred multiplications, which is the difference between a timeout and an answer.

## Problem motivation

A program must answer whether $n = 9\,223\,372\,036\,854\,775\,783$ is prime. The number fits in a signed 64-bit integer, but its square root is about $3 \times 10^9$. Trial division therefore runs three billion iterations for this one value. With $10^5$ values of that size, the total is $3 \times 10^{14}$ divisions, which no contest time limit accommodates.

A sieve does not rescue the situation either. Sieving to $3 \times 10^9$ needs a bitset of about 375 megabytes before any marking begins, and the marking itself is far more work than the problem deserves. The sieve is the right tool when there are many small queries, not when there are a few huge ones.

What makes the large case tractable is that primality has a short certificate of compositeness. A single congruence can prove that $n$ is not prime, and a small number of congruences can prove that it is prime for every value below $2^{64}$. The Miller-Rabin test finds those congruences by raising a base to powers derived from $n - 1$, and each raising is a modular exponentiation with about sixty squarings.

The same test sits inside larger algorithms. Pollard's rho factors a number by splitting it into primes and calls a primality test at every node of its recursion. A hash table chooses a modulus and wants it prime. A cryptographic routine generates a prime by sampling odd numbers and testing them. In each case the test is the same, and the deterministic base set removes the only source of doubt.

## Recognition patterns

Miller-Rabin is the right tool when the statement contains some of these phrases.

- "Determine whether $n$ is prime", with $n$ up to $10^{18}$ or $2^{63} - 1$.
- "The input contains $10^5$ integers, each up to $10^{18}$; print YES or NO for each."
- "Find a prime $p$ with $L \le p \le R$", where the interval is short and the endpoints are large.
- "Factor $n$", where $n$ is a product of two primes near $10^9$, so trial division to $\sqrt{n}$ is too slow and a primality test is needed to stop the recursion.
- "Split $n$ into two primes", or any Goldbach-style construction, which reduces to a few primality tests.
- "The modulus is prime", when the program must verify that claim rather than assume it.

The constraint values that decide the technique:

| Constraint | What it rules |
| --- | --- |
| $n \le 10^9$, one value | Trial division is fine, and the test is unnecessary |
| $n \le 10^7$, many queries | A sieve answers every query in constant time |
| $n \le 10^{12}$, many queries | A sieve to $10^6$ plus a lookup or a test of the cofactor |
| $n \le 2^{63} - 1$, any number of queries | Deterministic Miller-Rabin with the twelve fixed bases |
| $n > 2^{64}$ | This base set no longer applies; use Baillie-PSW or a cryptographic library |
| A proof of primality is required | A certificate method such as ECPP, not a probabilistic test |
| Many small queries below $10^6$ | A sieve, because the test's constant is larger than a table lookup |

The trap is the phrase "the answer may be large". A number can be large and still be tested for primality without factoring it. The test never computes a divisor; it only computes residues, and residues stay below $n$.

## Naive approach

The baseline divides by every candidate up to the square root.

```python
def is_prime_trial(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True
```

The loop runs about $\sqrt{n}$ times, so $n = 10^{18}$ costs $10^9$ iterations. Skipping even candidates halves the constant and changes nothing asymptotically.

A second baseline is Fermat's test.

```python
def fermat(n, a):
    return pow(a, n - 1, n) == 1
```

This is fast, and it is wrong as a primality test. The smallest counterexample is $561 = 3 \ast 11 \ast 17$. For every base $a$ with $\gcd(a, 561) = 1$, $a^{560} \equiv 1 \pmod{561}$, so Fermat's test reports a prime no matter which coprime base is chosen. Numbers with this property are Carmichael numbers, and there are infinitely many of them. The Miller-Rabin test exists precisely to close this hole.

A third baseline sieves once and answers from a table. It is the right answer for a million queries below $10^7$ and the wrong answer for one query near $10^{18}$, because the table would need $10^9$ entries.

## Key insight

The insight is that Fermat's congruence can be refined by looking at the _path_ to the exponent $n - 1$, not only at its endpoint.

Write

$$
n - 1 = 2^s d, \qquad d \text{ odd}.
$$

For a base $a$, define

$$
x_0 = a^d \bmod n, \qquad x_{r+1} = x_r^2 \bmod n.
$$

Then $x_r = a^{2^r d} \bmod n$, and the last value is $x_s = a^{n-1} \bmod n$. If $n$ is prime and $n \nmid a$, Fermat says $x_s = 1$. The refinement is that the step _before_ the first $1$ must be $-1$, because a prime modulus has no nontrivial square root of one: if $x^2 \equiv 1 \pmod n$ and $n$ is prime, then $n \mid (x-1)(x+1)$, so $n \mid x-1$ or $n \mid x+1$.

So a prime must satisfy one of two patterns:

- $x_0 = 1$, and the ladder is $1$ from the start, or
- some $x_r = -1$ with $0 \le r < s$, and every value after it is $1$.

A base that produces neither pattern is a **witness** to compositeness. The test checks all twelve bases; a single witness is enough to answer COMPOSITE, and when no base is a witness the answer is PRIME.

The difference from Fermat is visible on $561$. The endpoint $2^{560}$ is $1$, so Fermat is fooled. The ladder from the same base is

$$
2^{35} \equiv 263, \quad 263^2 \equiv 166, \quad 166^2 \equiv 67, \quad 67^2 \equiv 1 \pmod{561}.
$$

The first $1$ is preceded by $67$, which is neither $1$ nor $-1$. The nontrivial square root of one exposes the composite immediately.

## Visual intuition

Draw the test as a ladder of squarings. The exponent doubles at every rung, and the top rung is fixed by Fermat.

```text
x_0 = a^d          the starting rung
  | square
x_1 = a^(2d)
  | square
x_2 = a^(4d)
  ...
  | square
x_s = a^(2^s d) = a^(n-1) = 1     the top rung
```

A prime climbs this ladder in one of two ways: it starts at $1$, or it reaches $-1$ and then climbs to $1$. The rung just below the first $1$ is the one that matters.

For $n = 561$ and $a = 2$, the rungs are $263, 166, 67, 1$. The first $1$ is at the top, and the rung below it is $67$, which is not congruent to $-1$ modulo $561$. That single mismatch proves that $561$ is composite without finding a factor.

For $n = 41$ and $a = 2$: $n - 1 = 40 = 2^3 \ast 5$, so the rungs are $2^5 = 32$, then $32^2 \equiv 40 \equiv -1$, then $(-1)^2 = 1$. The ladder reaches $-1$ before $1$, which is exactly what a prime is allowed to do.

The picture also explains why the test cannot prove primality by itself. A composite can climb the same ladder for a particular base; $2047 = 23 \ast 89$ returns $1$ immediately for base $2$. Such a base is called a strong liar. The test survives because a composite has few strong liars, and the fixed twelve bases include a witness for every composite below the 64-bit bound.

## Formal model

::: math definition Definition
An integer $n > 1$ is **prime** when its only positive divisors are $1$ and $n$. An integer greater than $1$ that is not prime is **composite**.
:::

::: math definition Definition
For an odd integer $n > 2$, write $n - 1 = 2^s d$ with $s \ge 1$ and $d$ odd. This decomposition is unique.
:::

::: math definition Definition
Let $n > 2$ be odd and let $a$ be an integer with $1 \le a \le n - 1$. Write $x_0 = a^d \bmod n$ and $x_{r+1} = x_r^2 \bmod n$. The base $a$ is a **strong witness** for $n$ when

$$
x_0 \ne 1, \qquad x_0 \ne n - 1, \qquad x_r \ne n - 1 \text{ for every } 1 \le r \le s - 1.
$$

When $n$ is composite and $a$ is not a strong witness, $a$ is a **strong liar** for $n$, and $n$ is a **strong pseudoprime** to base $a$.
:::

::: math lemma Lemma
If $n$ is prime, then no base $a$ with $1 \le a \le n - 1$ is a strong witness for $n$.
:::

::: math proof Proof
Let $x_r = a^{2^r d} \bmod n$. Fermat's little theorem gives $x_s = a^{n-1} \equiv 1 \pmod n$, because $n$ is prime and $n \nmid a$.

Let $j$ be the smallest index with $x_j = 1$. Such an index exists because $x_s = 1$. If $j = 0$, then $x_0 = 1$ and the base is not a witness.

Otherwise $j \ge 1$. Then $x_{j-1} \ne 1$ by the minimality of $j$, and

$$
x_{j-1}^2 \equiv x_j \equiv 1 \pmod n.
$$

Since $n$ is prime, the polynomial $t^2 - 1 = (t - 1)(t + 1)$ has no root modulo $n$ other than $1$ and $-1$: a product divisible by the prime $n$ has a factor divisible by $n$. Therefore $x_{j-1} \equiv -1 \pmod n$.

The index $j - 1$ lies between $0$ and $s - 1$, so the algorithm sees the value $-1$ either at $x_0$ or during the squaring loop. The base is not a witness. $\square$
:::

::: math lemma Lemma
If a base $a$ is a strong witness for $n$, then $n$ is composite.
:::

::: math proof Proof
The previous lemma is the contrapositive: a prime has no strong witness, so the existence of a witness rules out primality. $\square$
:::

::: math theorem Theorem
Let $n$ be an odd integer with $37 < n < 2^{63}$, and let $B = \{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$. Then $n$ is prime if and only if no base in $B$ is a strong witness for $n$.
:::

::: math proof Proof
If $n$ is prime, the first lemma says that no base is a witness, so the test passes.

Conversely, suppose $n$ is composite. A finite verification, carried out over every composite below $3.3 \times 10^{24}$, shows that at least one of the twelve primes in $B$ is a strong witness for $n$. Since $2^{63} - 1 < 3.3 \times 10^{24}$, that verification covers the stated range. The test therefore finds a witness and reports COMPOSITE.

The verification is a computation, not a proof of a general theorem. It is the reason the base set is fixed rather than random, and it is the only part of the argument that does not follow from the two lemmas above. $\square$
:::

For a composite that is not covered by the fixed bound, the guarantee becomes probabilistic: at most one quarter of the bases in $[2, n-2]$ are strong liars for an odd composite $n$, so $k$ independent random bases give an error probability below $4^{-k}$. Contest solutions use the deterministic set and avoid the randomness entirely.

## Algorithm derivation

The derivation has five steps.

**Step 1: handle the small values.** No value below $2$ is prime, and every even value is composite except $2$. The small prime factors are worth removing before the main loop because they are cheap, and because they guarantee that the remaining $n$ is greater than every base.

**Step 2: decompose $n - 1$.** Strip the factors of two.

```cpp
long long d = n - 1;
int s = 0;
while ((d & 1) == 0) {
    d >>= 1;
    ++s;
}
```

After the loop, $n - 1 = 2^s d$ with $d$ odd, and $s \ge 1$ for every odd $n > 2$.

**Step 3: compute $a^d \bmod n$.** Binary exponentiation does it in $O(\log d)$ modular multiplications.

```cpp
long long mul_mod(long long a, long long b, long long m) {
    return static_cast<long long>((__int128)a * b % m);
}

long long pow_mod(long long a, long long e, long long m) {
    long long result = 1 % m;
    a %= m;
    while (e > 0) {
        if (e & 1) {
            result = mul_mod(result, a, m);
        }
        a = mul_mod(a, a, m);
        e >>= 1;
    }
    return result;
}
```

The multiplication needs a wide type. Two residues below $2^{63}$ have a product below $2^{126}$, which does not fit in a signed 64-bit integer. The `__int128` cast forms the full product before the modulo reduces it.

**Step 4: climb the ladder.** Start from $x = a^d \bmod n$. If $x$ is $1$ or $n - 1$, the base passes. Otherwise square at most $s - 1$ times, looking for $n - 1$. If it never appears, the base is a witness.

**Step 5: repeat for the twelve bases.** A witness ends the test with COMPOSITE. Surviving all twelve bases means PRIME.

```cpp
bool is_prime(long long n) {
    if (n < 2) return false;
    for (int p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        if (n % p == 0) return n == p;
    }

    long long d = n - 1;
    int s = 0;
    while ((d & 1) == 0) { d >>= 1; ++s; }

    for (int a : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        long long x = pow_mod(a, d, n);
        if (x == 1 || x == n - 1) continue;
        bool passed = false;
        for (int r = 1; r < s; ++r) {
            x = mul_mod(x, x, n);
            if (x == n - 1) { passed = true; break; }
        }
        if (!passed) return false;
    }
    return true;
}
```

The pre-check does double duty. It answers the case $n = 2$ and the other small primes correctly, and it ensures that every value reaching the ladder is odd, greater than $37$, and coprime to every base. That last property is what lets the proof use Fermat's theorem without a separate $\gcd$ test.

## Step-by-step execution

**$n = 561$.** Factor $560 = 2^4 \ast 35$, so $s = 4$ and $d = 35$. With base $2$:

| Rung  | Power     | Value modulo $561$ |
| ----- | --------- | ------------------ |
| $x_0$ | $2^{35}$  | $263$              |
| $x_1$ | $2^{70}$  | $166$              |
| $x_2$ | $2^{140}$ | $67$               |
| $x_3$ | $2^{280}$ | $1$                |

The first $1$ appears at $x_3$, and the rung below it is $67$, not $560$. Base $2$ is a witness, so the answer is COMPOSITE. Notice that the top rung, $x_4 = 2^{560}$, is $1$; Fermat alone would have accepted the number.

**$n = 2047$.** Factor $2046 = 2 \ast 1023$, so $s = 1$ and $d = 1023$. With base $2$, $x_0 = 2^{1023} \equiv 1 \pmod{2047}$, so base $2$ passes. With base $3$, $x_0 = 3^{1023} \equiv 1565 \pmod{2047}$, and because $s = 1$ there is no rung to climb. Since $1565$ is neither $1$ nor $2046$, base $3$ is a witness and the answer is COMPOSITE.

**$n = 41$.** Factor $40 = 2^3 \ast 5$, so $s = 3$ and $d = 5$. With base $2$:

| Rung  | Power    | Value modulo $41$ |
| ----- | -------- | ----------------- |
| $x_0$ | $2^5$    | $32$              |
| $x_1$ | $2^{10}$ | $40 \equiv -1$    |
| $x_2$ | $2^{20}$ | $1$               |

The ladder reaches $-1$ before $1$, so base $2$ passes. Every other base passes as well, and the answer is PRIME.

**Small values.** $0$ and $1$ are not prime, so the program prints COMPOSITE for both. $2$ is caught by the pre-check, which sees $2 \mid 2$ and returns $2 = 2$. $4$ is caught by the same pre-check, which sees $2 \mid 4$ and returns $4 = 2$, which is false.

## Correctness proof

::: math theorem Theorem
For every integer $n$ with $0 \le n < 2^{63}$, the procedure returns true if and only if $n$ is prime.
:::

::: math proof Proof
The case $n < 2$ is handled directly and is correct by the definition of prime.

For $n \ge 2$, the pre-check tests divisibility by each base $p \in B$. If $n$ is divisible by $p$, the procedure returns $n = p$. This is correct: a prime $p$ is divisible by itself, and any larger multiple of $p$ is composite. If no base divides $n$, then $n > 37$: a composite $n \le 37$ has a prime factor in $B$, and a prime $n \le 37$ is itself in $B$. The procedure therefore proceeds to the ladder.

Assume $n > 37$ and no base divides $n$. If the procedure returns false, some base produced a strong witness, and the second lemma shows that $n$ is composite.

If the procedure returns true, no base is a witness. Suppose for contradiction that $n$ is composite. The deterministic base theorem says that at least one base in $B$ is a witness for every composite below $3.3 \times 10^{24}$, and $n < 2^{63} < 3.3 \times 10^{24}$. That base would have been tested, so the procedure would have returned false. The contradiction shows that $n$ is prime.

The two directions together give the equivalence. $\square$
:::

::: math invariant Invariant
At the start of each iteration of the witness loop, $x = a^{2^r d} \bmod n$, where $r$ is the number of squarings performed since $x_0 = a^d \bmod n$. The invariant holds initially with $r = 0$, and each squaring replaces $x$ by $x^2 \bmod n$, which advances $r$ by one.
:::

The invariant is what makes the loop's negative answer trustworthy: if the loop ends without seeing $n - 1$, the program has examined every rung $x_1, \ldots, x_{s-1}$ and found none of them equal to $-1$, so the base really is a witness.

## Complexity analysis

| Operation                       | Time                                   | Space       |
| ------------------------------- | -------------------------------------- | ----------- |
| One modular power $a^e \bmod n$ | $O(\log e)$ modular multiplications    | $O(1)$      |
| One base of Miller-Rabin        | $O(\log n)$ modular multiplications    | $O(1)$      |
| Twelve bases                    | $O(12 \log n)$ modular multiplications | $O(1)$      |
| Trial division to $\sqrt{n}$    | $O(\sqrt{n})$ divisions                | $O(1)$      |
| Sieve up to $N$                 | $O(N \log \log N)$                     | $O(N)$ bits |

Each modular multiplication is constant time on a machine with a 128-bit intermediate, so the test is $O(\log n)$ word operations per base and $O(\log n)$ overall for the fixed twelve bases. In bit complexity, a multiplication of two $\log n$-bit numbers costs $O(\log^2 n)$, and $O(\log n)$ of them cost $O(\log^3 n)$.

The constant is small. For $n$ near $2^{63}$, the decomposition has $s \le 62$, each modular power performs at most 63 squarings and at most 63 multiplications, and twelve bases therefore stay below about $1\,500$ modular multiplications. That is the reason the test replaces three billion trial divisions with a few thousand operations.

The reference implementation in Pascal multiplies by doubling because the browser Pascal compiler has no 128-bit integer. That changes the cost of one multiplication to $O(\log n)$ additions, so the Pascal variant is $O(\log^2 n)$ per base. It is still exact, and it is still fast enough for the few values in a reference test.

## Algorithm selection

| Situation                      | What to use                                                |
| ------------------------------ | ---------------------------------------------------------- |
| One value below $10^9$         | Trial division                                             |
| Many values below $10^7$       | A sieve                                                    |
| Many values below $10^{12}$    | A sieve to $10^6$, then a lookup or a test of the cofactor |
| Values below $2^{63} - 1$      | Deterministic Miller-Rabin with the twelve fixed bases     |
| Values beyond $2^{64}$         | Baillie-PSW, or a library's probable-prime routine         |
| A primality proof is required  | ECPP or AKS                                                |
| Factor a 64-bit number         | Pollard's rho, with Miller-Rabin at every node             |
| Split a number into two primes | Miller-Rabin, then a search over the small prime           |
| Compute a modular inverse      | The extended Euclidean algorithm, not a primality test     |
| Count the primes below $N$     | A sieve or a prime-counting method, not one test per value |

The fourth and fifth rows are the boundary of this article. The twelve-base theorem stops at $3.3 \times 10^{24}$, which covers the 64-bit range with room to spare, but it says nothing about a 128-bit input. A program that accepts an arbitrary-size integer as decimal text and feeds it to these bases would answer confidently and incorrectly.

## Reference implementations

All six programs share one contract.

- **Input:** $t$ on the first line, then $t$ lines, each holding one non-negative integer below $2^{63}$.
- **Output:** one line per integer, holding `PRIME` or `COMPOSITE`.

The one-value-per-line layout is deliberate: the Pascal variant parses the decimal text into two 32-bit limbs so that no value above $2^{53}$ is ever stored in a floating-point number.

| Language   | File                    | Exact multiplication                     |
| ---------- | ----------------------- | ---------------------------------------- |
| C          | `c/program.c`           | `unsigned __int128`                      |
| C++17      | `cpp17/program.cpp`     | `unsigned __int128`                      |
| Java       | `java/Main.java`        | `long` when safe, `BigInteger` otherwise |
| Python     | `python/program.py`     | Arbitrary-precision integers             |
| Pascal     | `pascal/program.pas`    | Two 32-bit limbs and repeated doubling   |
| JavaScript | `javascript/program.js` | `BigInt`                                 |

The C and C++ variants set the standard output to binary mode, so their line feeds match the other four byte for byte. The Java variant uses a byte-array scanner rather than `java.util.Scanner`, because a contest input can be large and `Scanner` is slow. The JavaScript and Pascal variants are educational references, not USACO submission languages, and the Pascal variant in particular trades speed for exactness under the browser compiler.

## Recursion decision

Modular exponentiation has a natural recursive form:

```cpp
long long pow_mod(long long a, long long e, long long m) {
    if (e == 0) return 1 % m;
    long long half = pow_mod(a, e / 2, m);
    long long square = mul_mod(half, half, m);
    return (e & 1) ? mul_mod(square, a, m) : square;
}
```

The recursion halves the exponent at each level, so the depth is $\lfloor \log_2 e \rfloor + 1$, at most 63 for a 64-bit exponent. Every language in this encyclopedia can hold 63 frames.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames | Iterative, for speed and for one fewer thing to explain |
| Java | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | Iterative |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The iterative form is not a safety measure here; it is a clarity measure. The loop keeps the accumulator and the running square in local variables, it has no per-call overhead in the innermost computation, and it makes the invariant obvious: the accumulator times the running square is always the original power. The Miller-Rabin outer loop is also iterative, and the Pascal limb arithmetic is a set of small loops. None of the six reference programs uses recursion.

## Implementation walkthrough

The first detail is the decomposition of $n - 1$.

```cpp
long long d = n - 1;
int s = 0;
while ((d & 1) == 0) {
    d >>= 1;
    ++s;
}
```

The loop must run before the bases are tested, because both the starting rung and the number of squarings depend on $s$ and $d$. A common slip is to compute $s$ but forget to use $d$; the test then raises the base to $n - 1$ directly and degenerates into Fermat's test.

The second detail is the bound on the squaring loop.

```cpp
for (int r = 1; r < s; ++r) {
    x = mul_mod(x, x, n);
    if (x == n - 1) { passed = true; break; }
}
```

The loop runs $s - 1$ times, reaching $x_{s-1}$ at most. It must not run $s$ times: the final squaring produces $x_s = a^{n-1}$, and for a composite that is a Fermat liar, that value is $1$, not $-1$. Accepting the top rung would accept exactly the numbers that Fermat's test already accepts.

The third detail is the widening of the product. In C and C++ the cast to `unsigned __int128` happens before the multiplication, not after it. In Java the overflow test is

```java
if (a == 0 || b <= Long.MAX_VALUE / a) {
    return (a * b) % m;
}
return BigInteger.valueOf(a).multiply(BigInteger.valueOf(b))
        .mod(BigInteger.valueOf(m)).longValue();
```

The division in the condition is the safe way to ask whether the product fits; multiplying first and then checking is too late. In JavaScript the operands are `BigInt`, and the `%` operator is exact. In Python the integers are already arbitrary precision. In Pascal the two limbs are added with an explicit carry and the product is formed by doubling, which never exceeds 64 bits.

The fourth detail is the pre-check.

```cpp
for (int p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
    if (n % p == 0) return n == p;
}
```

Returning `false` here would report $2$, $3$, $5$ and the rest as composite. Returning `n == p` is the correct answer for every multiple of a small prime.

The fifth detail is the input. The largest signed 64-bit value is $9\,223\,372\,036\,854\,775\,807$, which is $2^{63} - 1$ and is composite. A parser that accumulates into a signed 64-bit integer reaches this value exactly, but a parser that stores the digits in a `double` rounds it to $9\,223\,372\,036\,854\,775\,808$. That is why the Pascal variant reads one value per line and builds the limbs from the decimal characters, and why the JavaScript variant uses `BigInt` rather than `Number`.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using Fermat's test alone | $561$ and every other Carmichael number pass | Add the strong-test ladder |
| Omitting the $x_0 = 1$ check | A prime such as $31$ is rejected when $a^d \equiv 1$ | Check both $1$ and $n - 1$ before squaring |
| Running the squaring loop to $s$ | A Fermat liar is accepted at the top rung | Stop at $r = s - 1$ |
| Multiplying residues in 64 bits | The product wraps and the residue is wrong | Use a 128-bit type or an exact fallback |
| Returning `false` on a small factor | $2$, $3$, $5$ and the other bases are called composite | Return `n == p` |
| Using only bases $2, 3, 5, 7$ | $3\,215\,031\,751$ passes all four | Use twelve prime bases or the seven special 64-bit bases |
| Storing $n$ in a 32-bit integer | Values above $2^{31} - 1$ are truncated | Use a 64-bit type throughout |
| Choosing random bases with a fixed seed | An adversarial input can be built to pass the chosen bases | Use the deterministic set |
| Treating $1$ as prime | Every count is off by one | Return false for $n < 2$ |
| Forgetting that the pre-check changes $n$ | The proof's $\gcd$ condition is not checked later | Handle small values before the ladder |

### Why this fails: Fermat's test on 561

The plausible wrong solution is to test $a^{n-1} \equiv 1 \pmod n$ and stop there. It is fast, it is simple, and it is correct on every prime. The smallest number that exposes it is $561$.

The factorization is $561 = 3 \ast 11 \ast 17$. For a base coprime to $561$, the Carmichael property gives $a^{560} \equiv 1 \pmod{561}$, so the test reports a prime. The smallest base that shows the failure is $2$: $2^{560} \bmod 561 = 1$. The program returns PRIME for a number whose factors are $3$, $11$ and $17$.

The strong test catches it because the ladder for $560 = 2^4 \ast 35$ is $263, 166, 67, 1$. The endpoint is still $1$, but the step before the first $1$ is $67$, and $67^2 \equiv 1 \pmod{561}$ with $67 \not\equiv \pm 1 \pmod{561}$. A nontrivial square root of one cannot exist modulo a prime, so the number is composite.

The lesson generalizes: **Fermat's congruence is necessary but not sufficient.** The strong test adds the structure of the group of units, and that structure is what Carmichael numbers cannot imitate for every base.

### Why this fails: a 64-bit product

The second mistake is writing the modular multiplication with a plain 64-bit product.

```cpp
long long bad_mul(long long a, long long b, long long m) {
    return a * b % m;   // overflows before the modulo
}
```

Take $a = 4 \times 10^9$ and $b = 4 \times 10^9$. The true product is $1.6 \times 10^{19}$, which is larger than $2^{63} - 1 \approx 9.22 \times 10^{18}$. The multiplication wraps modulo $2^{64}$, and the value that reaches the `%` is unrelated to the true product. The resulting residue is wrong, so the ladder is wrong, and the verdict is unreliable in both directions: a prime can be rejected, and a composite can be accepted.

The boundary is sharp. The largest prime whose square fits in a signed 64-bit integer is $3\,037\,000\,493$, and its square is $9\,223\,371\,994\,482\,243\,049$, which is just below $2^{63} - 1$. A residue of $4 \times 10^9$ already overflows, and residues near $9 \times 10^{18}$ overflow by a wide margin.

The fix is to form the product in a wider type before reducing. C and C++ have `__int128`, Java has `BigInteger` or `Math.multiplyHigh`, JavaScript has `BigInt`, Python has native big integers, and Pascal can double-and-add in 32-bit limbs. The rule is the same in every language: **the modulo must see the full product, not its low 64 bits.**

## Variants and extensions

- **The Fermat test.** The one-congruence version. It is faster by a constant and weaker by a theorem; Carmichael numbers defeat it.
- **The Euler test.** Uses the Legendre symbol and a congruence modulo $n$ that also involves $a^{(n-1)/2}$. It is stronger than Fermat and weaker than the strong test.
- **The strong Lucas test.** The Lucas analogue of Miller-Rabin, based on a recurrence rather than a power. It has its own strong pseudoprimes.
- **Baillie-PSW.** A strong base-2 test followed by a strong Lucas test. No composite is known to pass both, which makes it the standard choice above 64 bits, where no deterministic base set of this size is available.
- **Deterministic base sets.** The first four prime bases suffice below $3\,215\,031\,751$, and the first twelve suffice below $3.3 \times 10^{24}$. For 64-bit input the seven bases $2, 325, 9375, 28178, 450775, 9780504, 1795265022$ are a popular alternative.
- **Random bases.** For arbitrary-size input, $k$ independent bases give an error below $4^{-k}$ for an odd composite. The randomness is what makes the bound meaningful; a fixed seed does not.
- **Montgomery multiplication.** Represents residues in a form that replaces the division in the modulo by a multiply and a shift, which is the standard optimization in cryptographic libraries.
- **Pollard's rho.** Factors a composite by following a pseudorandom sequence until a difference shares a factor with $n$, and uses Miller-Rabin to recognize the prime factors it extracts.
- **Prime generation.** Sample an odd candidate, test it, and repeat. The prime number theorem says that about $\ln n$ candidates are expected near $n$, so the loop is short.
- **AKS and ECPP.** Deterministic and certificate-based methods that prove primality for arbitrary sizes. They are the answer when a proof, rather than a verdict, is required.

## Contest strategy

1. Read the bound before choosing the tool. A value below $10^{12}$ with many queries wants a sieve; a value near $10^{18}$ wants Miller-Rabin.
2. Use the deterministic bases. There is no reason to randomize a judged solution when twelve fixed bases cover the whole 64-bit range.
3. Strip the small prime factors first, and return `n == p` rather than `false`. This handles $2$, $3$, and every other base, and it makes the ladder's $\gcd$ condition automatic.
4. Widen the multiplication before the modulo. A 64-bit product is the single most common source of silent wrong answers in this technique.
5. Stop the squaring loop at $s - 1$. Squaring once more reaches the Fermat endpoint and can accept a liar.
6. Test the boundaries: $0$, $1$, $2$, $3$, $4$, $2^{63} - 1$, the largest prime below $2^{63}$, the Carmichael numbers $561$ and $1105$, and the strong pseudoprimes $2047$ and $3215031751$.
7. When the problem asks for a factor or a split rather than a verdict, put the test inside Pollard's rho or inside the Goldbach search; the test itself never finds a factor.

## Worked problems

### Problem 1: T-primes

**Restatement.** A positive integer is T-prime when it has exactly three distinct positive divisors. Given $n \le 10^5$ values $x_i \le 10^{12}$, print YES or NO for each.

**Naive baseline.** Count the divisors of every $x_i$ by trial division, which costs $O(\sqrt{x_i})$ per value and about $10^{11}$ operations in total.

**Insight.** A number has exactly three divisors exactly when it is $p^2$ for a prime $p$: the divisors are $1$, $p$ and $p^2$, and no other number has that shape.

**Derivation.** Take the integer square root $r = \lfloor \sqrt{x} \rfloor$. If $r \ast r \ne x$, the answer is NO. Otherwise the answer is YES exactly when $r$ is prime. The root is at most $10^6$, so a sieve to $10^6$ answers every query, or deterministic Miller-Rabin answers each root without preprocessing.

**Correctness.** The divisor argument above is the whole proof. The integer square root is exact, and the comparison $r \ast r = x$ removes the rounding error of the floating-point square root.

**Complexity.** $O(n \log x)$ with Miller-Rabin, or $O(10^6 \log \log 10^6 + n)$ with a sieve. The space is $O(10^6)$ for the sieve and $O(1)$ for the test.

**Common wrong approach.** Trusting `sqrt` without adjusting it. For $x = 10^{12}$, the floating-point root can land one below the true root, and the program then reports NO for a perfect square. Adjust the candidate up or down until its square brackets $x$.

### Problem 2: Taxes

**Restatement.** An income $n$ with $2 \le n \le 2 \times 10^9$ is split into parts $n_1 + \cdots + n_k = n$, each at least $2$. The tax on a part $m$ is the largest divisor of $m$ other than $m$ itself. Minimize the total tax.

**Naive baseline.** Enumerate every split and every divisor, which is exponential in the number of parts.

**Insight.** A prime part pays $1$, and splitting a composite part into its prime factors never increases the total. So the answer is the minimum number of primes that sum to $n$.

**Derivation.** If $n$ is prime, the answer is $1$. If $n$ is even, Goldbach writes it as the sum of two primes, so the answer is $2$. If $n$ is odd, then either $n - 2$ is prime and $n = 2 + (n - 2)$ gives $2$, or $n - 3$ is even and Goldbach splits it, giving $3$. The three decisions are primality tests on $n$, $n - 2$ and $n - 3$.

**Correctness.** The answer cannot be $0$, it is $1$ exactly for a prime, and it is $2$ exactly when $n$ is even or $n - 2$ is prime, because the only even prime is $2$. In the remaining case the construction $n = 3 + (n - 3)$ uses three primes, and no two-prime split exists, so the minimum is $3$.

**Complexity.** A constant number of primality tests, each $O(\log n)$ modular multiplications with the twelve bases, and $O(1)$ space.

**Common wrong approach.** Testing only whether $n$ is even and forgetting $n - 2$. For $n = 9$, $n - 2 = 7$ is prime, so the answer is $2$, not $3$; the split is $9 = 2 + 7$.

### Problem 3: Prime Problem

**Restatement.** The houses $1, 2, \ldots, n$ with $2 \le n \le 6000$ are painted so that the sum of the numbers of the houses of each color is prime. Use the minimum number of colors and print a coloring.

**Naive baseline.** Try every partition of the houses, of which there are exponentially many.

**Insight.** The total sum $S = n(n+1)/2$ is fixed. One color works exactly when $S$ is prime. Two colors work exactly when $S$ is even, by Goldbach, or when $S - 2$ is prime. Otherwise three colors always work.

**Derivation.** If $S$ is prime, paint every house color $1$. If $S$ is even, find a prime $p$ with $S - p$ also prime, choose a subset of houses summing to $p$, and give the subset color $1$ and the rest color $2$. If $S$ is odd and $S - 2$ is prime, give house $2$ color $1$ and every other house color $2$. Otherwise give house $3$ color $1$, split the even number $S - 3$ into two primes, and use those sums for colors $2$ and $3$. The subset with a prescribed sum is built greedily from $n$ down to $1$.

**Correctness.** Each color's sum is prime by construction. The number of colors is minimal because a one-color solution requires $S$ prime, and a two-color solution requires two primes summing to $S$, which for odd $S$ forces one of them to be $2$.

**Complexity.** $O(n)$ to build the coloring, plus a constant number of primality tests on values below $18\,003\,000$, each $O(\log S)$ modular multiplications.

**Common wrong approach.** Assuming every odd total needs three colors. For $n = 9$, $S = 45$ and $S - 2 = 43$ is prime, so two colors suffice: house $2$ alone and the other eight houses, whose sum is $43$.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a verdict, a factor, or a construction, and whether the input bound is small enough for trial division or a sieve.
2. **Direct application.** Implement binary exponentiation and the strong test. Check every value up to $10^6$ against trial division.
3. **Adversarial cases.** Test $561$, $1105$, $2047$, $1\,373\,653$ and $3\,215\,031\,751$. The last one passes bases $2$, $3$, $5$ and $7$, so it shows why twelve bases are used.
4. **Widening.** Replace the 64-bit product with a 128-bit one, and test the values near $2^{63} - 1$: the square $3\,037\,000\,493^2$, the largest prime below $2^{63}$, and $2^{63} - 1$ itself.
5. **Combination.** Use the test inside Pollard's rho to factor a 64-bit number, or inside the Goldbach search of the Taxes problem.
6. **Transfer.** Recognize the same congruence in a hashing problem that needs a prime modulus, in a cryptographic exercise that generates a prime, and in a counting problem whose modulus must be checked before Fermat's inverse is used.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the strong-test condition in terms of $x_0, \ldots, x_{s-1}$, and explain why a prime always satisfies it. (Formal model)
2. Why does $x_0 = 1$ count as a pass, and why does a nontrivial square root of one prove compositeness? (Key insight)
3. What is a strong witness, and what is a strong liar? (Formal model)
4. Why is the twelve-base test deterministic, and what is the exact bound on that statement? (Correctness proof)
5. Trace the ladder for $n = 561$ and base $2$. Which rung exposes the composite? (Step-by-step execution)
6. Why must the squaring loop stop at $s - 1$ rather than $s$? (Implementation walkthrough)
7. What is the largest prime whose square fits in a signed 64-bit integer, and what happens to a larger product? (Common mistakes)
8. Why does the pre-check return `n == p` instead of `false`? (Implementation walkthrough)
9. When is trial division preferable to Miller-Rabin, and when is a sieve preferable to both? (Algorithm selection)
10. Why is the iterative modular power preferred even though the recursion depth is only 63? (Recursion decision)

## Further reading

- The modular arithmetic behind the test, including binary exponentiation and Fermat's little theorem, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The sieve that answers the small-query version, and the factorization that Miller-Rabin supports, are in [sieve of Eratosthenes](/algorithms/number-theory/sieve) and [prime factorization](/algorithms/number-theory/prime-factorization).
- The inverse that Fermat's theorem provides for a prime modulus, and the composite-modulus alternative, are in [extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean) and [Chinese remainder theorem](/algorithms/number-theory/chinese-remainder).
- The exact square root used by the T-primes solution is an instance of the monotone search in [binary search](/algorithms/searching/binary-search).
- The divisibility, gcd and proof techniques that the lemmas rely on are in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index places this test beside the other arithmetic in [number theory](/algorithms/number-theory/).
- The original papers are Miller's "Riemann's hypothesis and tests for primality" (1976) and Rabin's "Probabilistic algorithm for testing primality" (1980).
- The deterministic base bounds and the analysis of strong pseudoprimes are in the computational number theory literature, notably Crandall and Pomerance, _Prime Numbers: A Computational Perspective_, and the tables of Sorenson and Webster.
