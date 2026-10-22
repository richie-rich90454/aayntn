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

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Modular arithmetic | $O(\log m)$ per operation | $O(1)$ | `foundations.complexity` | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |
| Sieve | $O(n \log \log n)$ | $O(n)$ | `foundations.complexity` | [Sieve](/algorithms/number-theory/sieve) |
| Extended Euclidean algorithm | $O(\log \min(a, b))$ | $O(1)$ | `number-theory.modular-arithmetic` | [Extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean) |
| Matrix exponentiation | $O(n^3 \log k)$ | $O(n^2)$ | `number-theory.modular-arithmetic` | [Matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) |
| Prime factorization | $O(\sqrt{n})$ | $O(1)$ | `foundations.complexity` | [Prime factorization](/algorithms/number-theory/prime-factorization) |
| Chinese remainder theorem | $O(k \log M)$ | $O(1)$ | `number-theory.modular-arithmetic` | [Chinese remainder theorem](/algorithms/number-theory/chinese-remainder) |

The modular arithmetic article covers the reduction of every operation modulo $m$, the modular inverse through the extended Euclidean algorithm, the fast exponentiation by squaring, and the reason a value congruent to zero modulo a prime is invertible while a value congruent to zero modulo a composite is not.

The extended Euclidean algorithm and the Chinese remainder theorem are the two pieces of machinery that the first article leans on. The extended Euclid returns the gcd along with the Bezout coefficients, which is what makes the modular inverse computable for every modulus rather than only for a prime. The Chinese remainder theorem is what lets a computation that needs a division run modulo each prime power separately.

Two bounds are worth reading carefully. The sieve is $O(n \log \log n)$ with the plain sieve of Eratosthenes and $O(n)$ with the linear sieve, and its space is $O(n)$ as an array of smallest prime factors or $O(n)$ bits as a flag array. The Chinese remainder theorem costs $O(k \log M)$, where $M$ is the product of the moduli, and the space is $O(1)$ only because the intermediate products fit in a machine word.

## Recognition signals

- **"modulo"**, **"mod"**, **"remainder"**, **"the answer modulo $10^9 + 7$"**. The single strongest signal in the subject.
- **"$10^9 + 7$"**, **"$998\,244\,353$"**, **"mod $p$ for a prime $p$"**. A modulus that is prime is a promise that every nonzero value has an inverse.
- **"the number of ways"** combined with **"the answer may be large"**. Counting problems where the answer is enormous and the modulus is given.
- **"divides"**, **"divisible by"**, **"greatest common divisor"**, **"coprime"**, **"relatively prime"**.
- **"the last $k$ digits"**, **"the remainder when divided by"**.
- **"primes up to"**, **"which numbers are prime"**, **"the smallest prime factor of"**. That is the sieve when there are many numbers and trial division when there is one.
- **"$a^b$ with a huge exponent"**, **"the number of ways to walk $k$ steps"**, **"the $n$-th term of the recurrence"**. That is matrix exponentiation, and it is the only technique here that turns a linear number of steps into a logarithmic one.
- **"$2^{64}$"**, **"$10^{18}$"**, or any value that exceeds what a 64-bit integer can hold. This is a signal about the width of the arithmetic rather than about the number theory, and it is handled in [binary representation](/algorithms/foundations/binary-representation).

The signal that rules the subject out is a question whose answer is a configuration rather than a count. "List the triples that satisfy the equation" is a [searching](/algorithms/searching/) problem, not a counting one.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| A power or a product that overflows | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic), with fast exponentiation |
| Divide by a number modulo a prime | The modular inverse, computed by the extended Euclidean algorithm |
| Divide by a number modulo a composite | The [extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean), or work modulo each prime power |
| Count the integers in a range satisfying a divisibility condition | A floor division, $\lfloor b/k \rfloor - \lfloor (a-1)/k \rfloor$ |
| Count satisfying several conditions | [Inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) over the conditions |
| Find all the primes up to a limit | [Sieve](/algorithms/number-theory/sieve) |
| Find the smallest prime factor of one number | [Prime factorization](/algorithms/number-theory/prime-factorization) by trial division |
| Decide whether a number is prime | Trial division up to the square root, or a deterministic Miller-Rabin test |
| The modulus is not prime and a division is required | Work modulo each prime power and combine with the [Chinese remainder theorem](/algorithms/number-theory/chinese-remainder) |
| Count the walks of a given length, or the $k$-th term of a recurrence | [Matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) |
| The answer is an exact integer with no modulus | Compute it exactly, with a wide type or an arbitrary-precision integer |

The last row is the one people get wrong most often. A problem that does not say "modulo" usually wants the exact answer, and returning a reduced value is wrong. If the exact answer does not fit, the problem will say so.

## What this subject implies but does not yet cover

- **The fast Fourier transform.** Converting a polynomial product into a convolution in $O(n \log n)$, which is the standard way to count the number of ways to write a number as a sum.
- **The number-theoretic transform.** The same idea over a finite field, which is what makes it usable when the answer must be taken modulo a prime. It is the engine of most competitive programming convolution problems.
- **Miller-Rabin.** The primality test built on Fermat's little theorem with a random base. The [modular arithmetic article](/algorithms/number-theory/modular-arithmetic) names it in its variants section, but the test itself has no article.
- **Pollard's rho.** The randomized factorization algorithm that finds a prime factor of a large composite in roughly the fourth root of the number, which is the standard tool once trial division and sieving stop being fast enough.
- **Euler's totient function and Euler's theorem.** The count of the residues coprime to a modulus and the periodicity theorem that follows from it, which is the standard route to a modular inverse for a composite modulus.
- **The discrete logarithm.** Solving for the exponent in a multiplicative group, which is the reason the number-theoretic transform and the discrete logarithm are the reason the RSA assumptions are believed hard.

## Related subjects

- [Foundations](/algorithms/foundations/) supplies the binary representation that decides how wide every intermediate value must be.
- [Combinatorics](/algorithms/combinatorics/) supplies the counts that modular arithmetic then reduces.
- [Dynamic programming](/algorithms/dynamic-programming/) is often the counting method that number theory then reduces modulo a prime.
- [Advanced algorithms](/algorithms/advanced/) contains the randomized techniques, several of which are number-theoretic in origin.
- The [academy](/start/) introduces modular arithmetic and the sieve as the two ideas that make large counting problems tractable, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
