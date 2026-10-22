---
id: number-theory.prime-factorization
title: Prime factorization
summary: Break a number into its prime factors by trial division or by a sieve of smallest prime factors, and read the number of divisors off the exponents.
division: [silver, gold]
subjects: [number-theory]
level: intermediate
importance: common-contest-technique
keywords:
    [
        prime factorization,
        trial division,
        smallest prime factor,
        sieve,
        divisor count,
        divisors,
        perfect square,
        factorization sieve,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [number-theory.modular-arithmetic, foundations.binary-representation]
complexity:
    time: "O(sqrt{n})"
    space: "O(1)"
assumptions:
    - The number being factored fits in the machine word being used, and the square of the trial divisor is computed in a type that holds it.
    - When a sieve is used, the bound on the numbers being factored is known in advance.
reviewed: false
---

## At a glance

Every integer greater than one has a unique factorization into primes, and almost every question about divisors is answered by reading the exponents off that factorization.

| Property | Value |
| --- | --- |
| **Problem** | Find the prime factors of $n$, or count the divisors of $n$ |
| **Trial division** | $O(\sqrt{n})$ time, $O(1)$ space, no preprocessing |
| **Sieve of smallest prime factors** | $O(N \log \log N)$ time and $O(N)$ space for all $n \le N$, then $O(\log n)$ per query |
| **The divisor count** | $\tau(n) = \prod_i (a_i + 1)$ for $n = \prod_i p_i^{a_i}$ |
| **Requires** | A bound $N$ for the sieve, or nothing at all for trial division |
| **Fails when** | $n$ is a 64-bit number with no bound known in advance, and trial division is too slow |

The choice between the two methods is a choice about how many numbers are being factored. One number is trial division; a million numbers are a sieve.

## Problem motivation

A number theory problem asks: "How many positive divisors does $10^{12}$ have?"

The naive baseline checks every integer from $1$ to $10^{12}$ and counts the ones that divide it. That is $10^{12}$ steps, and the answer is a number of the order of $10^3$, so the program does a trillion steps to produce three digits.

The second baseline checks only up to the square root, pairing each divisor $d$ with $n/d$. That is $10^6$ steps, and it is the right shape, but it still tests a million numbers one at a time and it does not give the divisors themselves, only their count.

The insight is that $10^{12} = 2^{12} \cdot 5^{12}$, and the number of divisors is $(12+1)(12+1) = 169$. The factorization is the useful object, and once it is in hand the divisor count is a product.

The second problem in the family makes the preprocessing pay. A problem asks: "For every $n$ from $1$ to $10^7$, how many divisors does $n$ have?" Now the trial division would cost $10^{13}$ steps, and the sieve that computes the smallest prime factor of every number up to $10^7$ costs $O(10^7 \log \log 10^7)$ once, after which each query is a short walk through the factor array.

## Recognition patterns

Prime factorization is the right tool when the statement contains some of these phrases.

- "How many divisors", "how many factors", "the number of positive divisors of $n$".
- "The prime factorization of $n$", "the largest prime factor", "the smallest prime factor".
- "Is $n$ prime", "is $n$ a perfect square", "is $n$ a perfect power".
- "How many numbers up to $N$ are divisible by $d$", where the count depends on the prime factors of $d$.
- "Compute $\gcd$", "compute $\operatorname{lcm}$", "the largest $k$ such that $k$ divides $n$".
- "The smallest number with at least $k$ divisors", "the largest number with at most $k$ divisors".

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| One number, $n \le 10^{12}$ | Trial division, $O(\sqrt{n})$ |
| One number, $n \le 10^{18}$ | Trial division is $10^9$ steps and is too slow; a Miller-Rabin test plus Pollard's rho is the tool |
| Many numbers, all at most $N \le 10^7$ | The sieve of smallest prime factors |
| Many numbers, $N \le 10^8$ | The sieve needs 400 megabytes for a 32-bit array, and a linear sieve with a byte array is the alternative |
| $n$ is given in binary or in several large factors | The factorization is already known, and the divisor count is a product over the given factors |
| The number of divisors must be exact | The answer is at most $n$, and it fits in a machine word |
| The number of divisors must be reported modulo a prime | The product is taken in the residues, and it is still exact |

The second row is the honest limit of this article. Trial division runs to the square root of $n$, and for a 64-bit number that is about $3 \times 10^9$ divisors to try, which is minutes rather than milliseconds. Factoring a 64-bit number in a contest almost always means the number is small or its structure is known.

## Naive approach

The baseline is trial division by every integer.

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

This is correct and it is the algorithm to write when there is one number. The condition `d * d <= n` is what makes it $O(\sqrt{n})$ rather than $O(n)$, and it is correct because once $d > \sqrt{n}$ the remaining $n$ is either $1$ or a prime: if it were composite it would have a factor at most its square root, which would have been found.

The second baseline counts the divisors directly.

```python
def count_divisors_slow(n):
    count = 0
    for d in range(1, n + 1):
        if n % d == 0:
            count += 1
    return count
```

This is $O(n)$ and it is never the answer. It is useful only as the reference implementation for a differential test on small inputs.

## Key insight

The insight is that **the exponents in the prime factorization determine everything about the divisors.**

Write $n = p_1^{a_1} p_2^{a_2} \cdots p_k^{a_k}$. A divisor of $n$ is determined by how many copies of each prime it contains, and it can contain between $0$ and $a_i$ copies of $p_i$. The choices for the different primes are independent, so the number of divisors is

$$
\tau(n) = (a_1 + 1)(a_2 + 1) \cdots (a_k + 1).
$$

The proof is a bijection: from a divisor, read off the exponent of each prime; from the exponents, multiply the primes. No divisor is produced twice, and no divisor is missed.

The second insight is that **one prime factor can be found by trial division, and the rest follows.** If $p$ is the smallest prime dividing $n$, then $p \le \sqrt{n}$ unless $n$ is prime, because if $n$ were composite with all prime factors above $\sqrt{n}$ then $n$ would have at least two of them and would be above $n$. So dividing out the smallest prime factor repeatedly, and stopping when the remaining number falls below the square of the trial divisor, finds the whole factorization in $O(\sqrt{n})$ steps.

The third insight is that **when many numbers are factored, the smallest prime factors can be shared.** Every composite number $m$ has a smallest prime factor at most $\sqrt{m}$, and the sieve computes the smallest prime factor of every number up to $N$ in one pass by marking multiples of each prime in increasing order, keeping the first mark. The marking order is what makes the array hold the _smallest_ prime factor rather than just some prime factor.

## Formal model

<MathPanel type="definition" title="Definition">
A **prime** is an integer greater than one whose only positive divisors are
$1$ and itself. The **prime factorization** of an integer $n > 1$ is the
unique expression $n = p_1^{a_1} p_2^{a_2} \cdots p_k^{a_k}$ with distinct
primes $p_1, \ldots, p_k$ and positive integers $a_1, \ldots, a_k$. The
**divisor-count function** $\tau(n)$ is the number of positive divisors of
$n$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **smallest prime factor** of an integer $m > 1$ is the least prime that
divides $m$. The **sieve of smallest prime factors** is an array
$\operatorname{spf}[1 \ldots N]$ with $\operatorname{spf}[m]$ equal to the
smallest prime factor of $m$ for every $m$ from $2$ to $N$. It is
constructed by initializing $\operatorname{spf}[m] = m$ for all $m$, and
then, for each prime $p$ in increasing order up to $\sqrt{N}$, setting
$\operatorname{spf}[m] = p$ for the multiples $m$ of $p$ with
$p^2 \le m \le N$ whose entry is still $m$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If $n = p_1^{a_1} \cdots p_k^{a_k}$ is the prime factorization of $n$, then
$\tau(n) = \prod_{i=1}^{k} (a_i + 1)$.
</MathPanel>

<MathPanel type="proof" title="Proof">
Every positive divisor $d$ of $n$ has a unique factorization
$d = p_1^{b_1} \cdots p_k^{b_k}$ with $0 \le b_i \le a_i$, because the
exponents of a divisor cannot exceed the exponents of $n$ and the
factorization of a product is unique. The map from a divisor to the tuple
$(b_1, \ldots, b_k)$ is therefore a bijection between the divisors of $n$
and the set of tuples with $b_i \in \{0, 1, \ldots, a_i\}$. The number of
such tuples is $\prod_{i=1}^{k}(a_i + 1)$, since the choices are
independent. $\square$
</MathPanel>

<MathPanel type="invariant" title="Invariant">
In the sieve, after the primes up to $p$ have been processed, the entry
$\operatorname{spf}[m]$ is $m$ when $m$ has no prime factor at most $p$, and
otherwise it is the smallest prime factor of $m$. The invariant holds
initially, when no prime has been processed and every entry is its own
index. When the prime $p$ is processed, the multiples of $p$ from $p^2$
upward are marked, and only those whose entry is still unmarked, so a
number is marked by the first prime that divides it, which is its smallest
prime factor. The numbers below $p^2$ are not marked, because they have a
prime factor below $p$ and were marked earlier.
</MathPanel>

## Algorithm derivation

The sieve builds the array of smallest prime factors.

```python
from math import isqrt

def smallest_prime_factors(limit):
    spf = list(range(limit + 1))
    for p in range(2, isqrt(limit) + 1):
        if spf[p] == p:                      # p is prime
            for m in range(p * p, limit + 1, p):
                if spf[m] == m:              # keep the smallest factor
                    spf[m] = p
    return spf
```

The condition `spf[p] == p` detects the primes: a composite $p$ has already been marked by a smaller prime when it is reached.

The inner loop starts at $p^2$ rather than at $p$, because every multiple of $p$ below $p^2$ has a prime factor below $p$ and has already been marked by it. Starting at $p^2$ is what makes the sieve $O(N \log \log N)$ rather than $O(N \log N)$.

The factorization of a single number then walks the array.

```python
def factorize_with_spf(n, spf):
    factors = []
    while n > 1:
        p = spf[n]
        exponent = 0
        while n % p == 0:
            n //= p
            exponent += 1
        factors.append((p, exponent))
    return factors
```

Each step removes at least one factor of $2$, so the loop runs at most $\log_2 n$ times, and the total work is $O(\log n)$ divisions.

The divisor count is then a product over the factors.

```python
def count_divisors(factors):
    total = 1
    for _, exponent in factors:
        total *= exponent + 1
    return total
```

## Step-by-step execution

Take $n = 360$.

**Trial division.** The trial divisor starts at $2$. The condition $2 \cdot 2 \le 360$ holds, and $360$ is divisible by $2$, so $2$ is recorded and $n$ becomes $180$. The inner loop continues: $180$ is divisible by $2$, so $2$ is recorded again and $n$ becomes $90$; then $90 \to 45$. Now $45$ is not divisible by $2$, so the inner loop ends and the exponent of $2$ is $3$.

The trial divisor moves to $3$. The condition $3 \cdot 3 \le 45$ holds, and $45$ is divisible by $3$, so $3$ is recorded and $n$ becomes $15$; then $15 \to 5$. Now $5$ is not divisible by $3$, so the exponent of $3$ is $2$.

The trial divisor moves to $4$. The condition $4 \cdot 4 \le 5$ fails, so the loop ends. The remaining $n = 5$ is greater than $1$, so $5$ is recorded with exponent $1$.

The factorization is $360 = 2^3 \cdot 3^2 \cdot 5$, and the check is $8 \cdot 9 \cdot 5 = 360$.

**The divisor count.** $\tau(360) = (3+1)(2+1)(1+1) = 4 \cdot 3 \cdot 2 = 24$. The twenty-four divisors are

$$
1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90,
120, 180, 360.
$$

**The sieve.** With a sieve of smallest prime factors up to $360$, the factorization is read off directly: $\operatorname{spf}[360] = 2$, and $360 / 2 = 180$ still has smallest prime factor $2$, and $180 / 2 = 90$ still has smallest prime factor $2$, and $90 / 2 = 45$ has smallest prime factor $3$, and $45 / 3 = 15$ has smallest prime factor $3$, and $15 / 3 = 5$ has smallest prime factor $5$, and $5 / 5 = 1$ ends the loop. The exponents read off the walk are $3$, $2$ and $1$, exactly as above.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The trial division algorithm returns the prime factorization of its input.
The sieve computes the smallest prime factor of every integer up to its
limit. The divisor count computed from a prime factorization is the number
of positive divisors of the number.
</MathPanel>

<MathPanel type="proof" title="Proof">
**Trial division.** The loop maintains the invariant that the recorded
factors multiply to $n_{\text{original}} / n$, and that $n$ has no prime
factor smaller than the current trial divisor $d$. The invariant holds
initially, with no factors recorded and $d = 2$. The inner loop divides $n$
by $d$ while $d$ divides it; if $d$ were composite, one of its prime
factors would be smaller than $d$ and would already have been divided out,
so $d$ divides $n$ only if $d$ is prime, and every recorded factor is
prime. When the inner loop ends, $d$ does not divide $n$. The outer loop
advances $d$ to the next integer, which preserves the invariant because no
integer between the old and the new $d$ divides $n$. When the loop ends,
$d^2 > n$. If $n > 1$ then $n$ is prime, because a composite $n$ has a
prime factor at most $\sqrt{n} < d$, which would have been found and
divided out. So the recorded factors together with the leftover $n$ are the
complete prime factorization.

**The sieve.** The invariant in the panel shows that after the primes up to $p$ have been processed, every composite number has been marked by its smallest prime factor. A composite number $m$ has a smallest prime factor $q$ with $q^2 \le m$, so the loop for $q$ reaches $m$, and $m$ has not been marked before because no prime smaller than $q$ divides it. A prime number is never marked, because the only multiples of $p$ marked are those at least $p^2$, and those are composite. The loop therefore ends with $\operatorname{spf}[m]$ equal to the smallest prime factor of $m$ for every composite $m$, and equal to $m$ for every prime.

**The divisor count.** The lemma proves it.

**The sieve-based factorization.** The walk divides $n$ by $\operatorname{spf}[n]$, which is a prime factor of $n$, until the quotient is $1$. The recorded factors multiply to the original $n$, and every one of them is prime, so they are the prime factorization. $\square$
</MathPanel>

## Complexity analysis

| Method                               | Time                   | Space            |
| ------------------------------------ | ---------------------- | ---------------- |
| Trial division, one number           | $O(\sqrt{n})$          | $O(1)$           |
| Trial division, all $n \le N$        | $O(N^{3/2})$           | $O(1)$           |
| Sieve of smallest prime factors      | $O(N \log \log N)$     | $O(N)$           |
| Factorization using the sieve        | $O(\log n)$ per query  | $O(1)$ per query |
| Divisor count from the factorization | $O(\log n)$            | $O(1)$           |
| Divisor count of every $n \le N$     | $O(N)$ after the sieve | $O(N)$           |

The sieve's time is $O(N \log \log N)$ because the multiples of the $k$-th prime are marked about $N / p_k$ times, and the sum of $1/p$ over the primes up to $N$ is $O(\log \log N)$. The linear sieve, which computes the smallest prime factor of every number in $O(N)$ by using the smallest prime factor of $n / \operatorname{spf}[n]$ to avoid redundant work, is a refinement worth knowing when $N$ is large.

The space is the one to watch. A sieve over $N = 10^7$ needs an array of $10^7$ integers, which is 40 megabytes with a 32-bit type. A sieve that only needs to know whether a number is prime, and not its smallest prime factor, can use a bit array of $N$ bits instead, which is 1.25 megabytes for the same $N$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Factor one number, $n \le 10^{12}$ | Trial division |
| Factor many numbers, all at most $N$ | The sieve of smallest prime factors |
| Count the divisors of one number | Factor it, then take the product of $a_i + 1$ |
| Count the divisors of every $n \le N$ | The sieve, then a linear pass |
| Test primality of one large number | Miller-Rabin, not trial division |
| Factor one large number with no bound | Pollard's rho, which is beyond this article |
| Compute $\gcd(a, b)$ | The Euclidean algorithm, which is faster than factoring both |
| Compute $\operatorname{lcm}(a,b)$ | $\frac{ab}{\gcd(a,b)}$ |
| Count the integers up to $N$ with exactly $k$ divisors | The sieve, then a histogram over the divisor counts |
| Find the smallest number with at least $k$ divisors | The greedy construction over the primes in increasing order |

The seventh row is the one that saves the most time. A problem that asks for the greatest common divisor does not need the factorization at all, and the Euclidean algorithm answers it in $O(\log \min(a,b))$ steps. Factoring both numbers and comparing the exponents is a much longer route to the same answer.

## Recursion decision

Factoring is naturally recursive, because after removing one prime factor the problem is the same problem on a smaller number.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the depth of at most $63$ is not the issue |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative; the depth is at most $63$ so the limit is never reached, but the call overhead is |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The depth of the recursive factorization is $O(\log n)$, because every level divides the number by at least $2$. For a 64-bit number that is at most $63$ levels, and no language on the list is in danger. The sieve is a different matter entirely: it is not recursive at all, and it must be iterative, because a recursive sieve would need the array to be in a different state at every level.

The iterative form is the better one for a second reason. The recursive factorization allocates a list at every level and returns it up the chain, while the iterative form appends to a single list.

## Implementation walkthrough

Three lines decide whether the factorization is right.

```python
while d * d <= n:
    while n % d == 0:
        factors.append(d)
        n //= d
    d += 1
if n > 1:
    factors.append(n)
```

The `d * d <= n` test is what makes the algorithm quadratic-root rather than linear, and it is correct only because the inner loop has already removed every prime factor below $d$. The `if n > 1` at the end is what records the leftover prime, and without it a prime input produces an empty list.

The `d += 1` is correct but wasteful: it tests every integer, including the even ones above $2$. A version that handles $2$ and then steps by $2$ is about twice as fast, and that is worth doing when the input is a single $10^{12}$-scale number.

```python
for p in range(2, isqrt(limit) + 1):
    if spf[p] == p:
        for m in range(p * p, limit + 1, p):
            if spf[m] == m:
                spf[m] = p
```

The `if spf[m] == m` test is what keeps the _smallest_ prime factor. Without it, the last prime to mark a number would win, and the array would hold some prime factor rather than the smallest one, which is still enough for primality tests but not for the factorization walk, which relies on the factor being the smallest in order to divide out cleanly.

The `range(p * p, ...)` start is the second of the two. Marking from $p$ instead of from $p^2$ is still correct but marks each multiple of $2$ twice and each multiple of $3$ three times, which changes $O(N \log \log N)$ into $O(N \log N)$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting the leftover `if n > 1` | A prime input produces an empty factorization | Add the leftover after the loop |
| Computing `d * d` in a 32-bit `int` | The test overflows and the loop ends early | Use a 64-bit type, or test `d <= n // d` |
| Doubling the count of divisors below the square root | A perfect square is counted twice | Handle the square root separately |
| Not keeping the smallest prime factor in the sieve | The factorization walk divides out the primes in the wrong order | Only mark an entry that is still unmarked |
| Starting the sieve at `p` instead of `p * p` | The sieve is correct but $O(N \log N)$ | Start at $p^2$ |
| Dividing by every integer rather than every prime | The result is right and the time is longer than it needs to be | Step over the composites |
| Forgetting that $\tau(1) = 1$ | The count for $n = 1$ is wrong | Special-case $1$ |
| Using $a_i$ instead of $a_i + 1$ | The count is short by the divisors that use none of a prime | Remember the $+1$ |

### Why this fails: doubling the count below the square root

The plausible wrong approach to counting the divisors is to scan the integers up to the square root, count how many of them divide $n$, and double the result, on the theory that every divisor below the square root has a partner above it. The theory is right, and the doubling is wrong exactly when $n$ is a perfect square, because then the square root is its own partner and is counted once rather than twice.

The smallest counterexample is $n = 4$. The divisors of $4$ are $1$, $2$ and $4$, so the answer is $3$. The integers at most $\sqrt{4} = 2$ that divide $4$ are $1$ and $2$, so the rule gives $2 \times 2 = 4$, which is one too many.

The same rule is also wrong for $n = 1$, where the answer is $1$ and the rule gives $2 \times 1 = 2$, but $n = 1$ is a degenerate input and $n = 4$ is the smallest one on which the rule fails on a number that anyone would actually ask about. Two is the smallest number of divisors that the rule gets right, and one is the case where there is a single divisor and the pairing does not apply at all.

The symptom is subtle, because the wrong answer is only wrong by one, and only for perfect squares. A program that reports $4$ for $n = 4$ passes every test with a random $n$ and fails only on the squares.

The second failure in the same area is the overflow in the loop bound, and it is worth stating precisely. The test `d * d <= n` is computed in the type of `d`. When `d` is a 32-bit `int` and `n` is a 64-bit `long long`, the product overflows for every $d \ge 46341$, and the overflow is a negative number, so the test fails and the loop stops. The factorization then reports the remaining $n$ as a single prime factor, which is wrong for every $n$ at or above $46341^2 = 2147488281$. The condition is not "a very large number", it is "a number at or above about $2.1 \times 10^9$", which is inside the range of a signed 32-bit integer and therefore easy to reach by accident.

The lesson generalizes: **a pairing argument has to say what happens to the one element that is its own partner.** The same care is needed in the [closest pair](/algorithms/geometry/closest-pair) algorithm, where the dividing line itself has to be excluded from the strip, and in the [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) formula, where the empty intersection is the universe rather than nothing.

## Variants and extensions

- **The sum of the divisors.** $\sigma(n) = \prod_i \frac{p_i^{a_i+1} - 1}{p_i - 1}$, by the same argument applied to a sum instead of a count.
- **The number of perfect-square divisors.** $\prod_i (\lfloor a_i / 2 \rfloor + 1)$, because each exponent of a square divisor must be even.
- **The number of divisors up to $N$.** The sieve, then a prefix sum over the divisor counts, which is $O(N)$ after the sieve.
- **The largest proper divisor.** It is $n / p$ where $p$ is the smallest prime factor, and $p$ is the answer to the primality test that the sieve gives for free.
- **A linear sieve.** The smallest prime factor of every number up to $N$ in $O(N)$ time, using the already computed factor of $n / \operatorname{spf}[n]$.
- **Miller-Rabin.** A probabilistic primality test in $O(\log n)$ multiplications, which is the right tool for a single large number.
- **Pollard's rho.** A factorization algorithm in roughly $O(n^{1/4})$ time for a number with no small factors, which is the standard tool for a 64-bit number.
- **The greedy smallest number with many divisors.** To find the smallest number with at least $k$ divisors, use the primes in increasing order with non-increasing exponents, because any smaller number must use the smaller primes more heavily.
- **The factorial prime exponents.** Legendre's formula gives the exponent of a prime in $n!$ as $\sum_{j \ge 1} \lfloor n / p^j \rfloor$, which is how the number of trailing zeros of a factorial is found.

## Contest strategy

1. Work out whether the problem is about one number or about many. One number is trial division, and many numbers are a sieve.
2. If a sieve is used, decide the limit before writing the code, and size the array. A sieve over $10^7$ needs 40 megabytes as an integer array.
3. Use a 64-bit type for the trial divisor and for the `d * d` test, or test `d <= n // d` instead.
4. Remember the leftover after the trial division loop. A prime input is the case that catches a missing `if n > 1`.
5. When counting divisors, take the product of $a_i + 1$ and handle $n = 1$ separately, since it has no prime factors and one divisor.
6. When the answer is a count of divisors, check it against the brute force on every $n \le 100$. The disagreement shows up immediately on the squares, which is the point.
7. Consider whether the question needs the factorization at all. The greatest common divisor and the least common multiple are both faster without it.

## Worked problems

### Problem 1: the number of divisors of a large number

**Restatement.** How many positive divisors does $10^{12}$ have?

**Naive baseline.** Checking every integer from $1$ to $10^{12}$, which is $10^{12}$ steps.

**Insight.** The divisor count is a product over the exponents of the prime factorization.

**Derivation.** $10^{12} = (2 \cdot 5)^{12} = 2^{12} \cdot 5^{12}$, so $\tau(10^{12}) = (12+1)(12+1) = 169$.

**Correctness.** The lemma proves that the product of the exponents plus one is the number of divisors.

**Complexity.** $O(\log n)$ to factor by trial division, which for $10^{12}$ is at most $10^6$ trial divisors.

**Common wrong approach.** Doubling the count of divisors at or below the square root. $10^{12}$ is a perfect square, so the square root $10^6$ is its own partner, and the rule gives $2 \times 84 = 168$ instead of $169$. The error is one, and it appears only on the squares.

### Problem 2: the divisor count of every number up to $N$

**Restatement.** For every $n$ from $1$ to $N$, with $N \le 10^7$, report the number of positive divisors of $n$.

**Naive baseline.** Trial division for each $n$, which is $O(N^{3/2})$ and is about $3 \times 10^{10}$ steps.

**Insight.** The smallest prime factor sieve gives every number its factorization in $O(\log n)$ time, and the divisor count is then a product.

**Derivation.** Build the sieve of smallest prime factors. Then walk the numbers from $2$ to $N$, and for each one keep the exponent of its smallest prime factor in a parallel array, using $\tau(n) = \tau(n / p) \cdot \frac{a+1}{a}$ where $p$ is the smallest prime factor of $n$ and $a$ its exponent in $n$. The simpler version factors each number from the sieve in $O(\log n)$, which is $O(N \log N)$ in total.

**Correctness.** The sieve theorem proves that the array holds the smallest prime factor of every number, and the lemma converts the exponents into the divisor count.

**Complexity.** $O(N \log \log N)$ for the sieve and $O(N \log N)$ for the individual factorizations, or $O(N)$ with the exponent array. The space is $O(N)$ words, which is 40 megabytes for $N = 10^7$.

**Common wrong approach.** Using a boolean primality sieve and then re-deriving the factors by trial division, which throws away the very information the sieve already computed.

### Problem 3: the smallest number with many divisors

**Restatement.** Find the smallest positive integer with at least $10^6$ divisors, and report the number of divisors it has.

**Naive baseline.** Checking the integers in increasing order and counting the divisors of each, which is hopeless.

**Insight.** The smallest number with a given divisor count uses the smallest primes with the largest exponents, and the exponents are non-increasing.

**Derivation.** Enumerate the exponent tuples $a_1 \ge a_2 \ge \cdots \ge a_k \ge 1$ with $\prod (a_i + 1) \ge 10^6$, and for each compute $2^{a_1} 3^{a_2} 5^{a_3} \cdots$, keeping the smallest value. The number of tuples is small because the product of the $a_i + 1$ grows quickly.

**Correctness.** Any number with $k$ distinct prime factors is at least $2^{a_1} 3^{a_2} \cdots p_k^{a_k}$ for its exponents, because the $i$-th smallest prime is the $i$-th smallest available prime, and the exponents must be non-increasing because swapping a larger exponent onto a smaller prime makes the number smaller.

**Complexity.** The number of exponent tuples is a small constant for a target of $10^6$, so the whole search is instantaneous.

**Common wrong approach.** Allowing the exponents to be in any order, which produces candidates that are larger than necessary and can hide the true minimum.

## Practice progression

1. **Recognition.** Given a statement, decide whether it is about one number or about many, and write down the bound $N$ if a sieve is needed.
2. **Direct application.** Implement trial division and the sieve of smallest prime factors, and check the sieve against trial division for every number up to $10^4$.
3. **Adaptation.** Write the divisor count, the sum of the divisors, and the count of the perfect-square divisors, all from one factorization.
4. **Combination.** Combine the sieve with a prefix sum to answer "how many integers up to $N$ have exactly $k$ divisors", and with [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) to count the integers that avoid a list of primes.
5. **Challenge.** Solve a problem with a 64-bit number, where trial division is too slow, by first testing primality and then using a factorization method suited to the structure of the number.
6. **Transfer.** Recognize the technique in another subject: the period of a sequence modulo $m$, which is the order of a number in a group; the number of ways a message can be encoded; the size of the multiplicative group modulo a prime, which is $p - 1$ by the same factorization; or the square root of a number modulo a prime, which is a square root of $1$ modulo $p$.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the formula for the number of divisors, and prove it by a bijection. (Formal model)
2. Why does trial division only have to reach the square root of the remaining number? (Key insight)
3. What invariant does the sieve maintain, and why is the inner loop started at $p^2$? (Formal model)
4. Trace the trial division on $360$ and say which values of the divisor are tried. (Step-by-step execution)
5. Give the smallest counterexample to the rule that doubles the count of divisors below the square root. (Common mistakes)
6. Why must the loop bound `d * d <= n` be computed in a 64-bit type, and from what value of $n$ does it matter? (Common mistakes)
7. What is the time and the space of the sieve, and why is the space the one to watch? (Complexity analysis)
8. Why does the sieve keep the smallest prime factor rather than any prime factor? (Implementation walkthrough)
9. When is trial division better than the sieve, and when is the sieve better? (Algorithm selection)
10. What is the depth of the recursive factorization, and is the stack ever the binding constraint? (Recursion decision)
11. How is the sum of the divisors computed from the factorization? (Variants and extensions)
12. Why does the smallest number with many divisors use non-increasing exponents on the smallest primes? (Worked problems)

## Further reading

- The arithmetic that keeps a count exact under a modulus, and the inverse that other methods need, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The inclusion and exclusion step that counts the integers avoiding a list of primes, which is the other direction of the same subject, is in [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion).
- The discrete mathematics of divisibility, the greatest common divisor and the unique factorization is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The binary representation of a number, which the exponent of a prime controls, is in [binary representation](/algorithms/foundations/binary-representation).
- The subject index lists this technique, [prime factorization](/algorithms/number-theory/prime-factorization), beside the arithmetic it does not yet cover: [the number theory](/algorithms/number-theory/).
