---
id: combinatorics.index
title: The Combinatorics
summary: Count the configurations rather than listing them, and compute the counts exactly without enumerating anything.
division: []
subjects: [combinatorics]
level: intermediate
importance: common-contest-technique
keywords: [combinatorics, counting, binomial coefficients, permutations, arrangements]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Combinatorics is the subject of problems that ask how many ways something can be done. The answers are large, the input is small, and the approach is arithmetic rather than algorithmic: you count instead of enumerating.

The distinction is worth holding onto. A problem that asks "how many subsets of size three have a sum of ten" can be answered by enumerating them if $n$ is small, but the answer is a count, and a count that requires $O(2^n)$ work is usually a problem that expects a formula. The combinatorial method finds the count in $O(1)$ or $O(n)$ instead.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Binomial coefficients | $O(\min(k, n-k))$ per value | `foundations.complexity` | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |

The binomial coefficient is the counting primitive that everything else in the subject is built from, because almost every other count is a sum of binomial coefficients or a product of them. The article derives it three ways, computes it without overflow, and shows the factorial formula's failure when the answer exceeds the machine word.

## Recognition signals

- **"in how many ways"**, **"how many arrangements"**, **"how many distinct orders"**, **"count the number of"**.
- **"choose"**, **"select"**, **"pick"**, with a number attached: choose $k$ items from $n$, in order or not.
- **"distinct"**, which usually means the items may repeat, which changes the formula from a falling factorial to a multiset coefficient.
- **"the answer is at most"**, **"the answer fits in"**, **"the answer may exceed"**, and a modulus.
- **"the same as"** with two objects and a bijection, which is the way a combinatorial count is often recognized: the number of paths on a grid equals the number of ways to arrange steps.
- **"how many subsets"**, **"how many sequences"**, **"how many arrangements of $n$ items"**.

The signal that rules the subject out is a question whose answer is a configuration to be produced rather than a number. "Find an arrangement" is a [searching](/algorithms/searching/) or [greedy](/algorithms/greedy/) problem, even though "how many arrangements" is a counting one.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Choose $k$ items from $n$, order does not matter | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| Choose $k$ items from $n$, order matters | A falling factorial, $n(n-1)\cdots(n-k+1)$ |
| Items may repeat | A multiset coefficient |
| Distribute identical items into distinct boxes | Stars and bars |
| Count with several overlapping conditions | Inclusion and exclusion |
| A count that depends on a recurrence over positions | [Dynamic programming](/algorithms/dynamic-programming/) |
| A count that is a coefficient of a generating function | A generating function, and its coefficient extraction |
| A count that must be computed modulo a prime | The same formula, computed with [modular arithmetic](/algorithms/number-theory/modular-arithmetic) |

The bottom row is the standard way a combinatorial problem becomes a number-theoretic one. Whenever a count is enormous, the statement almost always supplies a modulus, and the count is then computed with the same formula under a different set of rules.

## What this subject implies but does not yet cover

- **Stars and bars.** The formula for distributing $n$ identical items into $k$ distinct boxes, derived from the binomial coefficient by a bijection. It is the answer to every problem of the form "how many ways to make change" and "how many nonnegative solutions are there".
- **Inclusion and exclusion.** The principle that counts a union of sets by subtracting the intersections, and the tool behind nearly every "count the things that satisfy all of these conditions" problem. It is the technique that turns a counting problem into a formula when the conditions overlap.
- **Generating functions.** Encoding a sequence of counts as the coefficients of a polynomial, and multiplying the polynomials to combine the counts. The technique behind counting tilings, compositions, and coin-change problems in one line of algebra.
- **Matrix exponentiation.** Raising a matrix to a power to compute the number of walks of a given length in $O(n^3 \log k)$ instead of $O(nk)$ dynamic programming steps. It is the general answer to "count the ways over a long time", and it has no article in the encyclopedia.
- **Burnside's lemma**, for counting configurations up to rotation and reflection, and the Pólya enumeration that generalizes it.
- **Multinomial coefficients and the hypergeometric distribution**, for the counting problems that involve drawing without replacement.

## Related subjects

- [Dynamic programming](/algorithms/dynamic-programming/) counts the configurations that no closed form captures, and it is often the fallback when a combinatorial formula does not exist.
- [Number theory](/algorithms/number-theory/) supplies the modular arithmetic that a large count is usually reduced with.
- [Enumeration](/algorithms/enumeration/) is the brute-force version of the same counts, and it is the reference implementation you should write before believing a formula.
- [Foundations](/algorithms/foundations/) supplies the arithmetic that a formula needs in order to be computed without overflow.
