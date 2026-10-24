---
id: number-theory.sieve
title: Sieve of Eratosthenes
summary: Find all the primes up to a limit, and the smallest prime factor of every number up to a limit, in time nearly linear or exactly linear in the limit.
division: [silver, gold]
subjects: [number-theory]
level: intermediate
importance: common-contest-technique
keywords:
    [
        sieve of eratosthenes,
        linear sieve,
        smallest prime factor,
        primes,
        totient,
        segmented sieve,
        factorization,
    ]
prerequisites:
    required: [foundations.complexity, number-theory.modular-arithmetic]
    recommended: [foundations.binary-representation, foundations.sorting, arrays.prefix-sums]
complexity:
    time: "O(n log log n)"
    space: "O(n)"
assumptions:
    - The limit is known in advance, so that the whole table can be allocated before the computation starts.
    - The limit is at most a few times ten million, so that a table of that size fits in memory.
    - The values being sieved are integers, and the division needed to find a prime factor is exact.
reviewed: false
---

## At a glance

A sieve finds all the primes up to a limit in one pass, and it answers every question that depends on the factorization of the numbers up to that limit.

Two sieves matter.

- The **sieve of Eratosthenes** marks the multiples of each prime. It costs $O(n \log \log n)$ time and $O(n)$ space, and it is the one to write first.
- The **linear sieve** computes the **smallest prime factor** of every number in $O(n)$ time, and it is the one to use when the problem asks for a factorization rather than only for the primes.

The smallest prime factor array is the payload. With it, a number is prime exactly when its smallest prime factor is itself, a number factors by repeatedly dividing by its smallest prime factor, and the number of divisors of a number follows from its factorization.

The constraint that decides the technique is simple: the limit must be small enough for the table to fit. At $n = 10^7$ a table of 32-bit integers is $40$ megabytes, which fits; at $n = 10^9$ it is $4$ gigabytes, which does not, and the segmented sieve is the answer.

## Problem motivation

A number theory competition asks: for a given $n \le 10^7$, how many integers between $2$ and $n$ are divisible by no prime greater than $\sqrt n$? Equivalently, how many of them are prime? And, for a second part, what is the smallest prime factor of every integer up to $n$?

The constraints are $n \le 10^7$ and $q \le 10^5$ queries of the form "what is the smallest prime factor of $x$".

The naive approach tests each number for divisibility by each integer up to its square root. That is $O(n\sqrt n)$ divisibility tests, which at $n = 10^7$ is about $3 \times 10^{10}$ tests, and each one is a division. It does not fit.

The sieve of Eratosthenes costs $O(n \log \log n)$, which at $n = 10^7$ is about $3 \times 10^7$ operations, a thousand times fewer, and it answers every query in constant time.

The linear sieve is a refinement that costs $O(n)$ and produces the smallest prime factor of every number as a by-product, which is exactly what the second part of the problem needs.

## Recognition patterns

A sieve is the right tool when all of the following hold.

- The question is about **primes**, or about the **factorization** of the numbers up to a limit.
- The limit is **known in advance** and is small enough for a table.
- There are **many** questions about the range, or the range is large enough that the per-number cost dominates.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One number $x \le 10^9$ | Rules out the sieve; use trial division or a primality test |
| $n \le 10^6$ | A trial division over a prime list is competitive |
| $n \le 10^7$ | The sieve is required |
| $n \le 10^8$ | The sieve is at the edge of a memory limit; a bitset helps |
| A single very large number, $x \le 10^{18}$ | Rules out the sieve; use a Miller-Rabin test |
| A range such as $[10^9, 10^9 + 10^6]$ | Rules out the plain sieve; use the segmented sieve |
| The modulus of a number theory problem is at most $10^6$ | The sieve of the primes up to the modulus is usually needed |

The sixth row is the one that surprises people. The segmented sieve computes the primes in a narrow window of a huge range, using a small table and a list of the primes up to the square root of the window's end. It is the standard tool for the factorization of a large integer, and it is worth knowing even though it is not developed here.

The last row is the commonest reason a contestant needs a sieve at all. A problem that says "modulo $p$ for a prime $p \le 10^6$" usually needs the primes up to $p$, or at least the smallest prime factors, and the sieve is how they are produced.

## Naive approach

The baseline is trial division.

```python
def smallest_prime_factor(x):
    if x < 2:
        return x
    d = 2
    while d * d <= x:
        if x % d == 0:
            return d
        d += 1
    return x
```

This is correct, and it is $O(\sqrt x)$ per number, which is about $3162$ tests for a number of size $10^7$. Running it for every number up to $10^7$ is $3 \times 10^{10}$ tests.

The second baseline tests only the primes, which is a factor of $\log n$ better.

```python
def smallest_prime_factor_with_primes(x, primes):
    for p in primes:
        if p * p > x:
            break
        if x % p == 0:
            return p
    return x
```

This is the right baseline for a single number, and it is the right technique for a number of size $10^{18}$, where trial division over the primes up to $10^9$ is still too slow and a primality test is needed instead.

## Key insight

The insight is that **every composite number has a prime factor at most its square root**.

If $n = a \cdot b$ with $a \le b$, then $a^2 \le n$, so $a \le \sqrt n$. And $a$ has a prime factor at most $a$. So every composite number $n$ has a prime factor at most $\sqrt n$.

This is the fact that makes the sieve work at all. The sieve only has to consider the primes up to $\sqrt n$ as the source of composite numbers, and it can stop its outer loop there.

The second insight is the one that distinguishes the linear sieve. Every composite number $m$ has a **unique** smallest prime factor $p$, and then $m = p \cdot (m / p)$ with $m / p \ge p$. So every composite is generated by multiplying a smaller number by its smallest prime factor, and by nothing else.

## Formal model

Let $n$ be a positive integer, and let the numbers $2, 3, \ldots, n$ be the objects the sieve ranges over.

::: math definition Definition
The **smallest prime factor** of an integer $m \ge 2$ is the smallest prime
$p$ that divides $m$. It is written $\operatorname{spf}(m)$, and
$\operatorname{spf}(m) = m$ exactly when $m$ is prime.
:::


::: math definition Definition
The **sieve of Eratosthenes** produces the array of smallest prime factors
by, for each prime $p$ in increasing order, writing $\operatorname{spf}(m)
= p$ for every multiple $m$ of $p$ that has not been marked yet.
:::


::: math lemma Lemma
Every composite number $m$ has a prime factor at most $\sqrt m$.
:::


::: math proof Proof
Write $m = a \cdot b$ with $a \le b$ and $a, b \ge 2$. Then
$a^2 \le a \cdot b = m$, so $a \le \sqrt m$. The number $a$ has a prime
factor $p$, and $p \le a \le \sqrt m$, and $p$ divides $m$. $\square$
:::


::: math invariant Invariant
In the sieve of Eratosthenes, at the moment the outer loop reaches the
prime $p$, every composite number whose smallest prime factor is at most
$p$ has been marked, and no prime has been marked. The first prime that
marks a number is therefore its smallest prime factor.
:::


## Algorithm derivation

### The sieve of Eratosthenes

```text
spf = an array of n + 1 entries, all zero
for p from 2 to n:
    if spf[p] == 0:            // p is prime
        for m from p * p to n, stepping by p:
            if spf[m] == 0:
                spf[m] = p
```

The inner loop starts at $p \cdot p$ rather than at $p$, because every multiple of $p$ below $p^2$ has a smaller prime factor and has already been marked. The `if spf[m] == 0` test is what makes the entry the _smallest_ prime factor rather than merely _a_ prime factor.

The outer loop runs to $n$, and the inner loop runs at most $n/p$ times for each prime $p$, so the total is

$$
n \sum_{p \le \sqrt n} \frac{1}{p} = O(n \log \log n),
$$

using the fact that the sum of the reciprocals of the primes grows like $\log \log n$.

### The linear sieve

The linear sieve keeps a list of the primes it has found, and for each number $i$ it multiplies $i$ by the primes in increasing order, stopping as soon as the prime exceeds the smallest prime factor of $i$.

```text
spf = an array of n + 1 entries, all zero
primes = the empty list
for i from 2 to n:
    if spf[i] == 0:
        spf[i] = i
        primes.append(i)
    for p in primes:
        if p > spf[i] or (long long) p * i > n:
            break
        spf[p * i] = p
```

Two details carry the whole technique.

- The loop over the primes stops when $p > \operatorname{spf}(i)$. That is what makes each composite be generated exactly once: the number $p \cdot i$ is generated with $p$ as its smallest prime factor, and the condition $p \le \operatorname{spf}(i)$ says that $p$ is the smallest prime factor of $i$ as well, so $p$ is the smallest prime factor of $p \cdot i$.
- The loop also stops when $p \cdot i > n$, which is the bound on the array.

Because the loop over the primes runs at most $\operatorname{spf}(i)$ times for each $i$, and the sum of the smallest prime factors over all $i$ is $O(n)$, the total number of inner iterations is $O(n)$.

::: math invariant Invariant
In the linear sieve, when the outer loop reaches the number $i$, the array
holds the smallest prime factor of every number at most $i$, and the list
holds exactly the primes at most $i$. Every composite number at most $i$
has been generated exactly once, by the multiplication of its quotient by
its smallest prime factor.
:::


### The amortization of the linear sieve

The inner loop for the number $i$ runs once for each prime $p$ with $p \le \operatorname{spf}(i)$ and $p \cdot i \le n$. Each such iteration generates the number $p \cdot i$ and marks it, and by the invariant each composite is generated exactly once. There are $O(n)$ composites, so the total number of iterations is $O(n)$.

That is the whole proof of linearity, and it is a counting argument rather than a potential argument: **each iteration does one unit of useful work, and there is only $O(n)$ useful work to do.**

## Step-by-step execution

The linear sieve on the numbers up to $12$.

| $i$ | $\operatorname{spf}[i]$ | The primes tried | The numbers marked | The prime list |
| --- | --- | --- | --- | --- |
| 2 | 2, and $2$ is added | $2 \le \operatorname{spf}(2) = 2$, and $2 \cdot 2 = 4 \le 12$ | $\operatorname{spf}[4] = 2$ | $[2]$ |
| 3 | 3, and $3$ is added | $2 \le 3$, $2 \cdot 3 = 6 \le 12$; then $3 \le 3$, $3 \cdot 3 = 9 \le 12$ | $\operatorname{spf}[6] = 2$, $\operatorname{spf}[9] = 3$ | $[2, 3]$ |
| 4 | 2 | $2 \le \operatorname{spf}(4) = 2$, $2 \cdot 4 = 8 \le 12$ | $\operatorname{spf}[8] = 2$ | $[2, 3]$ |
| 5 | 5, and $5$ is added | $2 \le 5$, $10 \le 12$; then $3 \le 5$, $15 > 12$, stop | $\operatorname{spf}[10] = 2$ | $[2, 3, 5]$ |
| 6 | 2 | $2 \le 2$, $12 \le 12$ | $\operatorname{spf}[12] = 2$ | $[2, 3, 5]$ |
| 7 | 7, and $7$ is added | $2 \le 7$, $14 > 12$, stop | none | $[2, 3, 5, 7]$ |
| 8 | 2 | $2 \le 2$, $16 > 12$, stop | none | $[2, 3, 5, 7]$ |
| 9 | 3 | $2 \le 3$, $18 > 12$, stop | none | $[2, 3, 5, 7]$ |
| 10 | 2 | $2 \le 2$, $20 > 12$, stop | none | $[2, 3, 5, 7]$ |
| 11 | 11, and $11$ is added | $2 \le 11$, $22 > 12$, stop | none | $[2, 3, 5, 7, 11]$ |
| 12 | 2 | $2 \le 2$, $24 > 12$, stop | none | $[2, 3, 5, 7, 11]$ |

The final array of smallest prime factors is

| $m$                     | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  |
| ----------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $\operatorname{spf}(m)$ | 2   | 3   | 2   | 5   | 2   | 7   | 2   | 3   | 2   | 11  | 2   |

and the primes are $2, 3, 5, 7, 11$.

Two rows are worth pausing on.

The row for $i = 3$ shows the stop condition doing its work. The prime $2$ generates $6$, and the prime $3$ generates $9$. The number $6$ is generated once, by $3 \cdot 2$, and it will not be generated again by $2 \cdot 3$, because when the outer loop reaches $6$ the condition $p \le \operatorname{spf}(6) = 2$ permits only the prime $2$, and $2 \cdot 6 = 12$, which is a different number.

The row for $i = 4$ shows the same thing from the other side. The number $4$ has smallest prime factor $2$, so only the prime $2$ is tried, and $2 \cdot 4 = 8$ is marked. The number $8$ is generated by $4 \cdot 2$ and not by $2 \cdot 4$, because when the loop reaches $8$ only the prime $2$ is tried and $2 \cdot 8 = 16$ is out of range. The number $12$ is generated by $6 \cdot 2$, and not by $4 \cdot 3$ or by $3 \cdot 4$, because the condition $p \le \operatorname{spf}(i)$ stops the inner loop at the first prime that exceeds the smallest prime factor.

Every composite from $2$ to $12$ was generated exactly once: $4 = 2 \cdot 2$, $6 = 3 \cdot 2$, $8 = 4 \cdot 2$, $9 = 3 \cdot 3$, $10 = 5 \cdot 2$, $12 = 6 \cdot 2$.

## Correctness proof

::: math theorem Theorem
The sieve of Eratosthenes computes the smallest prime factor of every
number up to $n$, and the primes are exactly the numbers whose smallest
prime factor is themselves.
:::


::: math proof Proof
**No prime is marked.** A number is marked only if it is a multiple of
some prime $p$ with $p \ge 2$, and it is marked only if it has not been
marked before. A prime $q$ is a multiple of $p$ only when $p = q$, so the
only marking that could touch $q$ is by $q$ itself, and the inner loop for
$q$ starts at $q \cdot q > q$. So a prime is never marked.

**Every composite is marked.** Let $m$ be composite and let $p$ be its smallest prime factor. By the lemma, $p \le \sqrt m$, so the outer loop reaches $p$. The inner loop for $p$ starts at $p \cdot p \le m$ and steps by $p$, so it reaches $m$ and marks it, unless $m$ was already marked, in which case it is marked anyway.

**The mark is the smallest prime factor.** The number $m$ is first marked by the smallest prime $q$ that divides it and satisfies $q \cdot q \le m$. Every prime $q' < q$ that divides $m$ has $q' \le q \le \sqrt m$, so $q' \cdot q' \le m$, and the inner loop for $q'$ would have marked $m$ earlier. So the first prime to mark $m$ is its smallest prime factor. $\square$
:::


::: math theorem Theorem
The linear sieve computes the smallest prime factor of every number up to
$n$, in $O(n)$ time.
:::


::: math proof Proof
**The values written are correct.** The algorithm writes
$\operatorname{spf}(p \cdot i) = p$ only when $p \le \operatorname{spf}(i)$.
Since $p$ divides $p \cdot i$ and every prime factor of $i$ is at least
$\operatorname{spf}(i) \ge p$, the smallest prime factor of $p \cdot i$ is
exactly $p$. So every value written is correct.

**Every composite is written.** Let $m$ be composite, let $p = \operatorname{spf}(m)$, and let $i = m / p$. Then $p \le i$ because $p$ is the smallest prime factor of $m$ and $p \le \sqrt m$; and $\operatorname{spf}(i) \ge p$, because every prime factor of $i$ is a prime factor of $m$ and is at least $p$. So when the outer loop reaches $i$, the inner loop tries the prime $p$, the condition $p \le \operatorname{spf}(i)$ holds, and $p \cdot i = m$ is written, provided $m \le n$.

**Each composite is written once.** The number $m$ is written only by the pair $(i, p)$ with $i = m / p$ and $p$ a prime with $p \le \operatorname{spf}(i)$. If $m$ were written by two different pairs, then $m$ would have two distinct prime factors $p < q$ both of which satisfy $p \le \operatorname{spf}(m / p)$ and $q \le \operatorname{spf}(m / q)$. But $p < q$ and $p$ divides $m$ imply $p$ divides $m / q$ when $q$ divides $m$ and $p \ne q$, so $\operatorname{spf}(m/q) \le p < q$, a contradiction for the pair $(m / q, q)$. So $m$ is written once.

**The time bound.** Each iteration of the inner loop writes a distinct composite, and there are at most $n$ composites, so the inner loop performs at most $n$ iterations in total. The outer loop performs $n$ iterations. The total is $O(n)$. $\square$
:::


::: math invariant Invariant
After the linear sieve has processed the number $i$, the array holds the
smallest prime factor of every number at most $i$, and every composite
number at most $i$ was marked exactly once.
:::


## Complexity analysis

| Technique | Time | Space | Extra output |
| --- | --- | --- | --- |
| Trial division for every number | $O(n \sqrt n)$ | $O(1)$ | none |
| Trial division over a prime list | $O(n \log n / \log \log n)$-ish | $O(\pi(\sqrt n))$ | none |
| Sieve of Eratosthenes | $O(n \log \log n)$ | $O(n)$ | the smallest prime factors |
| Linear sieve | $O(n)$ | $O(n)$ | the smallest prime factors and the prime list |
| The same, with a bitset of flags | $O(n \log \log n)$ | $O(n / 8)$ bytes | the primes only |

The memory figures are the ones that decide the technique. An array of 32-bit integers for $n = 10^7$ is $40$ megabytes. An array of 64-bit integers is $80$ megabytes. A bitset of flags is $1.25$ megabytes, which is why the plain sieve with a boolean array is the right choice when only the primes are wanted.

The number of primes up to $n$ is about $n / \ln n$, so the prime list itself is small: $10^7 / 16.1 \approx 620\,000$ primes, which is $2.5$ megabytes as 32-bit integers.

The **segmented sieve** deserves a row of its own, because it is the answer when the limit does not fit.

| Technique           | Range                             | Space                |
| ------------------- | --------------------------------- | -------------------- |
| The segmented sieve | any range $[L, R]$, however large | $O(\sqrt R + R - L)$ |

The segmented sieve computes the primes up to $\sqrt R$ with an ordinary sieve, and then sieves the window $[L, R]$ using those primes. The memory is the size of the window plus the prime list, and the range may be anywhere in the integers.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| All the primes up to $n \le 10^7$ | The sieve of Eratosthenes |
| The smallest prime factor of every number up to $n$ | The linear sieve |
| The factorization of every number up to $n$ | The linear sieve, then divide |
| Is one number $x \le 10^{18}$ prime | A Miller-Rabin test, not a sieve |
| The smallest prime factor of one number $x \le 10^9$ | Trial division over the primes up to $\sqrt x$ |
| The primes in $[10^9, 10^9 + 10^6]$ | The segmented sieve |
| The number of integers up to $n$ coprime to $m$ | A sieve, with the totient computed in the same pass |
| The number of divisors of every number up to $n$ | The linear sieve, then a divisor count from the factorization |
| The prime factorization of a number of size $10^{18}$ | Pollard's rho, or the segmented sieve for small factors |

The totient row deserves a mention, because it is the most common sieve-based competition problem. Euler's totient function satisfies

$$
\varphi(n) = n \prod_{p \mid n, \; p \text{ prime}} \left(1 - \frac{1}{p}\right),
$$

and the sieve computes it for every number in one pass: initialize $\varphi(m) = m$ for every $m$, and for each prime $p$ set $\varphi(m) \gets \varphi(m) / p \cdot (p - 1)$ for every multiple $m$ of $p$. The count of the integers up to $n$ that are coprime to a given $m$ is then $\sum_{k=1}^{n} [\gcd(k, m) = 1]$, and the sieve computes that too, by marking the multiples of each prime factor of $m$.

## Recursion decision

Neither sieve is recursive, and neither should be. The sieve of Eratosthenes is a double loop, and the linear sieve is a double loop with a list.

There is one recursive sieve, and it is worth naming because it is a real technique with a real property: the **Sundaram sieve**, which generates the primes by a recursion whose depth is the number of primes at most $\sqrt n$.

```text
sieve(i):                       // the i-th prime, starting from 2
    for j from i + 1 to infinity:
        if (i + j) is not marked and (2j + 1) is not marked:
            mark (2j + 1)
            if i + j is prime:
                yield i + j
```

The recursion depth is the number of primes at most $\sqrt n$, which is small: for $n = 10^7$ it is $\pi(3162) = 446$.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | The recursive Sundaram sieve is safe, at a depth of $446$ |
| Java | About $10^4$ frames | Safe |
| Python | The interpreter limit of $1000$ | Safe, but only just; the depth is $446$ at $n = 10^7$ |
| Pascal | The operating system stack | Safe |
| JavaScript | About $10^4$ frames | Safe |

So the recursive sieve is safe in every language, which is a rare and pleasant result. It is nevertheless not the right answer in a contest, because the iterative sieve is faster: the recursive version allocates a generator frame per prime and does more work per candidate.

The recommendation is therefore: write the iterative sieve of Eratosthenes, and the linear sieve when the smallest prime factors are needed. Know that the recursive version exists and is safe, in case a problem asks for the primes in an unusual order.

## Implementation walkthrough

The overflow in the multiplication is the line that decides whether the program works.

```cpp
for (int p = 2; p <= n; ++p) {
    if (spf[p] != 0) continue;         // p is not prime
    for (long long m = 1LL * p * p; m <= n; m += p) {
        if (spf[m] == 0) spf[m] = p;    // the first prime to arrive wins
    }
}
```

The `1LL * p * p` is not optional. With $p$ up to $3163$ for $n = 10^7$, the product fits in a 32-bit integer, but a program written for a larger limit, or one where the inner loop starts at $p$ rather than at $p \cdot p$, overflows. The multiplication must be done in 64 bits, and the loop variable must be 64 bits as well.

The condition in the linear sieve is the second thing that matters.

```cpp
for (int p : primes) {
    if (p > spf[i] || 1LL * p * i > n) break;
    spf[p * i] = p;
}
```

The two tests must both be there. Without the first, the inner loop continues past the smallest prime factor of $i$, and the numbers it generates get the wrong smallest prime factor. Without the second, the program writes past the end of the array.

The order of the tests is worth choosing deliberately. Testing `p > spf[i]` first exits as soon as the prime list is exhausted for that $i$, which is the common case for a number with a large smallest prime factor. Testing the bound first would compute the product for every prime in the list, which is wasted work.

The initialization is the third detail.

```cpp
std::vector<int> spf(n + 1, 0);
std::vector<int> primes;
for (int i = 2; i <= n; ++i) {
    if (spf[i] == 0) {                 // i has no smaller prime factor
        spf[i] = i;
        primes.push_back(i);
    }
    ...
}
```

The convention that $0$ means "not yet marked" and that a prime gets $\operatorname{spf}(p) = p$ is what the `if (spf[i] == 0)` test relies on. An alternative convention marks the primes with $-1$ and the composites with their smallest prime factor, and it is equally good; the important thing is that the convention is consistent.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Overflowing `p * p` | The loop starts at a wrong place or runs away | Compute the product in 64 bits |
| Forgetting the `if (spf[m] == 0)` test | The array holds a prime factor, not the smallest one | Keep the test |
| Starting the inner loop at $p$ instead of $p \cdot p$ | Correct but about twice as slow | Start at $p \cdot p$ |
| Omitting the `p > spf[i]` break in the linear sieve | The smallest prime factors are wrong, and the loop is slower | Keep the break |
| Treating $0$ and $1$ as primes | The prime list and the counts are wrong | Start the loop at $2$ |
| Using a sieve for a number of size $10^{18}$ | The table cannot be allocated | Use a primality test |
| Forgetting to reduce the counts modulo the modulus | The count overflows | Reduce after every addition |
| Assuming the prime list is sorted | The linear sieve breaks | The list is built in increasing order, so it is |

### Why this fails: the sieve that starts at three

The plausible wrong approach is to start the outer loop at $3$, on the reasoning that the even numbers are obvious and can be handled separately. It is a common optimization to reach for, and it is easy to get wrong: the loop must start at $2$, and if it starts at $3$ then the even composites are never marked.

The smallest counterexample is $n = 10$.

With the outer loop starting at $2$, the primes found are $2, 3, 5, 7$, so the answer is $4$.

With the outer loop starting at $3$, the number $2$ is never used as a source of multiples, so $4, 6, 8, 10$ are never marked, and the program reports the list $2, 3, 4, 5, 6, 7, 8, 10$ as the primes, which is $8$ of them. The count is off by a factor of two.

The mechanism is exact. The sieve marks the multiples of each prime, and the number $2$ is itself a prime, so it is one of the sources. Skipping the source skips everything it would have marked, and the skipped numbers are exactly the even composites: $4, 6, 8, 10$. The odd composite $9$ is still marked, by the prime $3$, so the bug removes precisely the even composites and nothing else.

The fix is to start the loop at $2$. The optimization that people are actually trying to reach, a sieve that stores only the odd numbers, is a different construction: it halves the memory by storing the odd values only, and it handles the prime $2$ as a special case. That construction is correct, and it is not the same as starting the loop at $3$.

The lesson generalizes: **a sieve has no special cases, and the prime $2$ is not one.** Every prime is a source of multiples, and dropping one of them drops its entire contribution.

A second failure of the same kind is the linear sieve's outer loop. If it starts at $3$ rather than at $2$, the number $2$ is never used as a factor, so $4$ is never marked and is treated as a prime when the loop reaches it, and the prime list then contains the composite $4$. The same happens to $8$ and $12$, which are never marked either.

## Variants and extensions

- **The segmented sieve.** Sieve a window $[L, R]$ of a huge range using the primes up to $\sqrt R$. It is the standard way to factor a large integer.
- **The totient sieve.** Compute $\varphi(m)$ for every $m$ in one pass, by dividing by each prime factor and multiplying by $p - 1$.
- **The divisor count sieve.** Compute the number of divisors of every $m$, either by a divisor-pair counting pass or from the factorization that the linear sieve provides.
- **The Möbius function.** The sieve computes the Möbius function in the same pass as the totient, and it is the engine of the inclusion and exclusion counts.
- **The wheel sieve.** Mark only the numbers coprime to a small product such as $2 \cdot 3 \cdot 5 = 30$, which removes seven tenths of the work before the sieve even starts.
- **The bitset sieve.** A sieve whose flags are bits rather than bytes, which divides the memory by eight and fits the sieve of Eratosthenes into a much larger range.
- **The Miller-Rabin test.** The right tool for a single number of size $10^{18}$, and the reason a sieve is not a universal answer. It is a probabilistic test, and it is deterministic for the ranges that matter with a fixed set of bases.
- **The smallest prime factor of a single large number.** Pollard's rho, which finds a factor of a number in about the square root of the time a trial division would take.

## Contest strategy

1. Compute the memory figure before writing the sieve. $n = 10^7$ with 32-bit entries is $40$ megabytes, and that decides the technique.
2. Use the linear sieve when the problem asks for the smallest prime factors, and the ordinary sieve when it asks only for the primes.
3. Write the multiplication in 64 bits.
4. Start the outer loop at $2$, and remember that the number $2$ is not special.
5. Keep the `if (spf[m] == 0)` test in the ordinary sieve. Without it, the array holds a prime factor rather than the smallest one, and the difference shows up in the factorization.
6. Keep the `p > spf[i]` break in the linear sieve. Without it, the smallest prime factors are wrong.
7. When the problem asks for a count modulo a prime, reduce the count as it is accumulated, not at the end.
8. When the range is a window of a huge interval, use the segmented sieve, and not a table of size $10^9$.
9. When the number is a single large integer, stop and use a primality test. A sieve is the wrong tool for one number.

## Worked problems

### Problem 1: the count of the primes

**Restatement.** Given $n \le 10^7$, report the number of primes at most $n$, modulo $10^9 + 7$.

**Naive baseline.** Test every number for primality by trial division, which is $O(n \sqrt n)$ and reaches $3 \times 10^{10}$ tests.

**Insight.** Every composite number has a prime factor at most its square root, so the primes up to $\sqrt n$ mark all the composites.

**Derivation.** Run the sieve of Eratosthenes with a boolean array, counting the unmarked numbers above $1$. Reduce the count modulo $10^9 + 7$ as it is accumulated, or count exactly and reduce at the end, since the count is at most $n$.

**Correctness.** The theorem of the correctness proof shows that the sieve marks exactly the composites and no prime, so the unmarked numbers above $1$ are exactly the primes.

**Complexity.** $O(n \log \log n)$ time and $O(n)$ space, or $O(n / 8)$ bytes with a bitset. At $n = 10^7$ that is about $3 \times 10^7$ marking operations.

**Common wrong approach.** Starting the outer loop at $3$, which reports $9$ primes instead of $4$ on the instance $n = 10$.

### Problem 2: the smallest prime factor

**Restatement.** Given $n \le 10^7$ and $q \le 10^5$ queries, each a number $x \le n$, report the smallest prime factor of $x$.

**Naive baseline.** Trial division for each query, which is $O(q \sqrt n)$ and reaches $3 \times 10^8$ tests.

**Insight.** The linear sieve produces the smallest prime factor of every number at once, in linear time.

**Derivation.** Run the linear sieve, keeping the array of smallest prime factors and the list of primes. Each query is an array lookup.

**Correctness.** The theorem of the correctness proof shows that every value written is the true smallest prime factor, and that every composite is written.

**Complexity.** $O(n)$ time and $O(n)$ space, with $O(1)$ per query. The total is $O(n + q)$, against $O(q \sqrt n)$ for the baseline.

**Common wrong approach.** Omitting the `p > spf[i]` break, which writes the wrong smallest prime factor for the numbers whose smallest prime factor is not the largest prime tried.

### Problem 3: the totient sum

**Restatement.** Given $n \le 10^6$ and $m \le 10^6$, report the number of integers $k$ with $1 \le k \le n$ and $\gcd(k, m) = 1$, modulo $10^9 + 7$.

**Naive baseline.** Compute the greatest common divisor of each pair, which is $O(n \log m)$ and reaches $2 \times 10^7$ operations, or is slow in Python.

**Insight.** An integer is coprime to $m$ exactly when it is divisible by none of the prime factors of $m$, and the prime factors of $m$ are found with a sieve.

**Derivation.** Sieve the smallest prime factor up to $m$, and factor $m$ into its distinct primes $p_1, \ldots, p_r$. Then count with the inclusion and exclusion principle: the count of the integers up to $n$ not divisible by any $p_i$ is

$$
n - \sum_i \left\lfloor \frac{n}{p_i} \right\rfloor + \sum_{i < j} \left\lfloor \frac{n}{p_i p_j} \right\rfloor - \cdots,
$$

with every term reduced modulo $10^9 + 7$.

**Correctness.** The sets of the multiples of the $p_i$ inside $[1, n]$ are exactly the sets of the integers that fail the coprimality test, and the inclusion and exclusion principle counts the complement exactly.

**Complexity.** $O(m \log \log m)$ for the sieve and $O(2^r)$ for the inclusion and exclusion, where $r$ is the number of distinct prime factors of $m$. Since $r \le 7$ for $m \le 10^6$, the second part is trivial. The total is $O(m \log \log m + 2^r)$.

**Common wrong approach.** Counting the multiples of $m$ itself rather than of each of its prime factors, which counts the integers coprime to $m$ as $n - \lfloor n/m \rfloor$ and is wrong whenever $m$ has a square factor, such as $m = 12$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about a range of numbers or about one large number, and compute the memory figure for the range.
2. **Direct application.** Implement the sieve of Eratosthenes with a boolean array, and check it against trial division for every number up to a thousand.
3. **Adaptation.** Write the linear sieve, the totient sieve, and the segmented sieve.
4. **Combination.** Combine the sieve with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) for a version that counts the primes in a range, and with a [prefix sum](/algorithms/arrays/prefix-sums) array for a version that counts the coprime integers in a range.
5. **Challenge.** Implement a bitset sieve that handles $n = 10^8$ inside a $16$-megabyte limit, and measure the difference against the byte array.
6. **Transfer.** Recognize a sieve problem in a different shape: the number of primitive necklaces, the multiplicative order modulo a prime, or the number of numbers up to $n$ with a given number of distinct prime factors.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. Why does every composite number have a prime factor at most its square root? (Formal model)
2. What is the time bound of the sieve of Eratosthenes, and how is it derived? (Complexity analysis)
3. Why is the linear sieve linear? (Correctness proof)
4. What is the role of the condition $p \le \operatorname{spf}(i)$? (Algorithm derivation)
5. Why does the inner loop of the ordinary sieve start at $p \cdot p$? (Algorithm derivation)
6. What is the smallest counterexample that breaks a sieve whose outer loop starts at $3$? (Common mistakes)
7. How much memory does the array of smallest prime factors take at $n = 10^7$? (Complexity analysis)
8. When is the segmented sieve the right tool? (Algorithm selection)
9. Why is a sieve the wrong tool for a single number of size $10^{18}$? (Recognition patterns)
10. How is the totient computed in the same pass as the sieve? (Variants and extensions)
11. What is the recursion depth of the Sundaram sieve, and is it safe in Python? (Recursion decision)

## Further reading

- The subject index lists this technique, [the sieve of Eratosthenes](/algorithms/number-theory/sieve), beside the other number theory articles.
- The subject overview, which lists the number theory techniques that are not yet covered, is at [the number theory](/algorithms/number-theory/).
- The arithmetic that reduces a large count modulo a prime is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The inverse that the factorization of a number modulo a prime needs is in [the extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean).
- The prime list that the trial division baseline needs is what the sieve produces, and the range queries over it are in [a Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The counting that the totient belongs to is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The bit operations that the bitset sieve uses are in [binary representation](/algorithms/foundations/binary-representation).
