---
id: number-theory.index
title: The Number theory
summary: Compute with numbers too large to store, count with arithmetic instead of enumeration, and reason about divisibility.
division: []
subjects: [number-theory]
level: intermediate
importance: common-contest-technique
keywords: [number theory, modular arithmetic, primes, gcd, modular inverse, overflow]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Number theory is the subject of problems whose answers are numbers rather than configurations. They divide into two kinds. Some ask for the value of an expression whose intermediate results overflow: "compute $a^b \bmod m$". Others ask how many objects satisfy a condition, and the answer is a number rather than a list: "how many integers between $1$ and $n$ are divisible by $k$".

Both kinds are solved by arithmetic that keeps every intermediate value inside a machine word. Modular arithmetic is the tool for the first kind, and counting with the inclusion and exclusion principle is the tool for the second.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Modular arithmetic | $O(\log m)$ per operation | `foundations.complexity` | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |

The article covers the reduction of every operation modulo $m$, the modular inverse through the extended Euclidean algorithm, the fast exponentiation by squaring, and the reason a value congruent to zero modulo a prime is invertible while a value congruent to zero modulo a composite is not.

## Recognition signals

- **"modulo"**, **"mod"**, **"remainder"**, **"the answer modulo $10^9 + 7$"**. The single strongest signal in the subject.
- **"$10^9 + 7$"**, **"$998\,244\,353$"**, **"mod $p$ for a prime $p$"**. A modulus that is prime is a promise that every nonzero value has an inverse.
- **"the number of ways"** combined with **"the answer may be large"**. Counting problems where the answer is enormous and the modulus is given.
- **"divides"**, **"divisible by"**, **"greatest common divisor"**, **"coprime"**, **"relatively prime"**.
- **"the last $k$ digits"**, **"the remainder when divided by"**.
- **"$2^{64}$"**, **"$10^{18}$"**, or any value that exceeds what a 64-bit integer can hold. This is a signal about the width of the arithmetic rather than about the number theory, and it is handled in [binary representation](/algorithms/foundations/binary-representation).

The signal that rules the subject out is a question whose answer is a configuration rather than a count. "List the triples that satisfy the equation" is a [searching](/algorithms/searching/) problem, not a counting one.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| A power or a product that overflows | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic), with fast exponentiation |
| Divide by a number modulo a prime | The modular inverse, computed by the extended Euclidean algorithm |
| Count the integers in a range satisfying a divisibility condition | A floor division, $\lfloor b/k \rfloor - \lfloor (a-1)/k \rfloor$ |
| Count satisfying several conditions | Inclusion and exclusion over the conditions |
| Find the smallest prime factor of a number | Trial division, or a sieve when there are many numbers |
| Decide whether a number is prime | Trial division up to the square root, or a deterministic Miller-Rabin test |
| The modulus is not prime and a division is required | Work modulo each prime power and combine with the Chinese remainder theorem |
| The answer is an exact integer with no modulus | Compute it exactly, with a wide type or an arbitrary-precision integer |

The last row is the one people get wrong most often. A problem that does not say "modulo" usually wants the exact answer, and returning a reduced value is wrong. If the exact answer does not fit, the problem will say so.

## What this subject implies but does not yet cover

- **Sieves.** The sieve of Eratosthenes and the linear sieve, which find all primes up to a limit in $O(n \log \log n)$ and $O(n)$ respectively, and which extend to counting the numbers coprime to a limit.
- **Factorization.** Finding the prime factors of an integer by trial division, by a sieve, or by Pollard's rho, and the many contest problems whose real subject is the factorization rather than the arithmetic.
- **The extended Euclidean algorithm.** It appears inside the [modular arithmetic article](/algorithms/number-theory/modular-arithmetic) as the way the inverse is computed, but it does not have an article of its own, and the Bezout identity is not derived anywhere.
- **The Chinese remainder theorem.** Combining a solution modulo each prime power into a solution modulo their product, which is the standard answer when the modulus is composite.
- **The fast Fourier transform.** Converting a polynomial product into a convolution in $O(n \log n)$, which is the standard way to count the number of ways to write a number as a sum.
- **The number-theoretic transform.** The same idea over a finite field, which is what makes it usable when the answer must be taken modulo a prime. It is the engine of most competitive programming convolution problems.

## Related subjects

- [Foundations](/algorithms/foundations/) supplies the binary representation that decides how wide every intermediate value must be.
- [Combinatorics](/algorithms/combinatorics/) supplies the counts that modular arithmetic then reduces.
- [Dynamic programming](/algorithms/dynamic-programming/) is often the counting method that number theory then reduces modulo a prime.
- [Advanced algorithms](/algorithms/advanced/) contains the randomized techniques, several of which are number-theoretic in origin.
