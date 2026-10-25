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

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Binomial coefficients | $O(\min(k, n-k))$ per value | $O(1)$ per value, $O(k)$ for a Pascal table | `foundations.complexity` | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| Stars and bars | $O(\min(k-1, n))$ | $O(1)$ | `combinatorics.binomial-coefficients` | [Stars and bars](/algorithms/combinatorics/stars-and-bars) |
| Inclusion and exclusion | $O(2^m)$ | $O(1)$ to $O(m)$ | `combinatorics.binomial-coefficients` | [Inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) |
| Counting dynamic programming | $O(S \cdot T)$, and $O(nm)$ for a grid | $O(S)$, and $O(nm)$ for a grid | `dynamic-programming.0-1-knapsack` | [Counting dynamic programming](/algorithms/combinatorics/counting-dp) |
| Generating functions | $O(nk)$ for the dynamic program | $O(n)$ | `combinatorics.binomial-coefficients` | [Generating functions](/algorithms/combinatorics/generating-functions) |

The binomial coefficient is the counting primitive that everything else in the subject is built from, because almost every other count is a sum of binomial coefficients or a product of them. The article derives it three ways, computes it without overflow, and shows the factorial formula's failure when the answer exceeds the machine word.

The stars and bars is the binomial coefficient under a bijection, and the inclusion and exclusion is the general rule for counting a union of sets. The generating function is the algebraic restatement of the same counts, in which a sequence of counts becomes a list of coefficients and a combination becomes a multiplication. The counting dynamic program is the fallback for the counts that no closed form captures.

Two bounds are worth reading carefully. The binomial coefficient's multiplicative form needs only the answer to fit, and the answer fits far longer than the factorial does: $\binom{66}{33}$ is the largest that fits in a signed 64-bit integer. The inclusion and exclusion costs $O(2^m)$ terms, which is a million at $m = 20$ and a billion at $m = 30$, so the sieve form is the only one of the two that finishes on a problem with a thousand conditions.

## Recognition signals

- **"in how many ways"**, **"how many arrangements"**, **"how many distinct orders"**, **"count the number of"**.
- **"choose"**, **"select"**, **"pick"**, with a number attached: choose $k$ items from $n$, in order or not.
- **"distinct"**, which usually means the items may repeat, which changes the formula from a falling factorial to a multiset coefficient.
- **"the answer is at most"**, **"the answer fits in"**, **"the answer may exceed"**, and a modulus.
- **"the same as"** with two objects and a bijection, which is the way a combinatorial count is often recognized: the number of paths on a grid equals the number of ways to arrange steps.
- **"how many subsets"**, **"how many sequences"**, **"how many arrangements of $n$ items"**.
- **"distribute"**, **"how many ways to make change"**, **"nonnegative solutions to"**. That is stars and bars, and the number of boxes matters as much as the number of items.
- **"and"** between two conditions, or **"at least one of"**. Overlapping conditions are what the inclusion and exclusion is for.

The signal that rules the subject out is a question whose answer is a configuration to be produced rather than a number. "Find an arrangement" is a [searching](/algorithms/searching/) or [greedy](/algorithms/greedy/) problem, even though "how many arrangements" is a counting one.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Choose $k$ items from $n$, order does not matter | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| Choose $k$ items from $n$, order matters | A falling factorial, $n(n-1)\cdots(n-k+1)$ |
| Items may repeat | A multiset coefficient |
| Distribute identical items into distinct boxes | [Stars and bars](/algorithms/combinatorics/stars-and-bars) |
| Count with several overlapping conditions | [Inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) |
| A count that depends on a recurrence over positions | [Counting dynamic programming](/algorithms/combinatorics/counting-dp) |
| A count that is a coefficient of a generating function | [Generating functions](/algorithms/combinatorics/generating-functions), and its coefficient extraction |
| A count that must be computed modulo a prime | The same formula, computed with [modular arithmetic](/algorithms/number-theory/modular-arithmetic) |
| A count over a long time, such as the number of walks of length $k$ | [Matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) |

The bottom row is the standard way a combinatorial problem becomes a number-theoretic one. Whenever a count is enormous, the statement almost always supplies a modulus, and the count is then computed with the same formula under a different set of rules.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Binomial coefficients | O(min(k, n-k)) per value | O(1) per value, O(k) for a Pascal table | `foundations.complexity` | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) | Prose only |
| Burnside's lemma | O(sqrt(n) * (sqrt(n) + log n)) | O(1) | `number-theory.modular-arithmetic` | [Burnside's lemma](/algorithms/combinatorics/burnside-lemma) | [Source](/implementations/combinatorics-burnside-lemma/) |
| Counting dynamic programming | O(S * T) | O(S) | `dynamic-programming.0-1-knapsack` | [Counting dynamic programming](/algorithms/combinatorics/counting-dp) | Prose only |
| Generating functions | O(nk) for the dynamic program | O(n) | `combinatorics.binomial-coefficients` | [Generating functions](/algorithms/combinatorics/generating-functions) | Prose only |
| Inclusion and exclusion | O(2^m) | O(1) to O(m) | `combinatorics.binomial-coefficients` | [Inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) | Prose only |
| Integer partitions | O(n sqrt n) | O(n) | `foundations.complexity` | [Integer partitions](/algorithms/combinatorics/integer-partitions) | [Source](/implementations/combinatorics-integer-partitions/) |
| Multinomial coefficients and the hypergeometric distribution | O(n + log p) per word | O(n) | `combinatorics.binomial-coefficients` | [Multinomial coefficients and the hypergeometric distribution](/algorithms/combinatorics/multinomial-coefficients) | [Source](/implementations/combinatorics-multinomial-coefficients/) |
| Stars and bars | O(min(k-1, n)) | O(1) | `combinatorics.binomial-coefficients` | [Stars and bars](/algorithms/combinatorics/stars-and-bars) | Prose only |
| The hook-length formula | O(n + w) for a diagram of n cells and width w, plus O(log M) for the inverse | O(k + w) for k row lengths and w column heights | `foundations.complexity` | [The hook-length formula](/algorithms/combinatorics/hook-length-formula) | [Source](/implementations/combinatorics-hook-length-formula/) |
| The reflection principle | O(n + log p) | O(1) | `combinatorics.binomial-coefficients` | [The reflection principle](/algorithms/combinatorics/reflection-principle) | [Source](/implementations/combinatorics-reflection-principle/) |

<!-- aayntn:subject:end -->

## Related subjects

- [Dynamic programming](/algorithms/dynamic-programming/) counts the configurations that no closed form captures, and it is often the fallback when a combinatorial formula does not exist.
- [Number theory](/algorithms/number-theory/) supplies the modular arithmetic that a large count is usually reduced with.
- [Enumeration](/algorithms/enumeration/) is the brute-force version of the same counts, and it is the reference implementation you should write before believing a formula.
- [Foundations](/algorithms/foundations/) supplies the arithmetic that a formula needs in order to be computed without overflow.
- The [academy](/start/) introduces counting as a way of answering a question without listing the answers, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
