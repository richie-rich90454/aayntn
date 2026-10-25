---
id: combinatorics.multinomial-coefficients
title: Multinomial coefficients and the hypergeometric distribution
summary: Count the distinct arrangements of a multiset with one factorial ratio, and count samples drawn without replacement with the same ratio, then evaluate both modulo a prime with inverse factorials.
division: [silver, gold]
subjects: [combinatorics]
level: intermediate
importance: common-contest-technique
keywords:
    [
        multinomial coefficient,
        distinct permutations,
        anagram counting,
        hypergeometric distribution,
        sampling without replacement,
        factorial,
        inverse factorial,
        modular arithmetic,
    ]
prerequisites:
    required: [combinatorics.binomial-coefficients]
    recommended: [foundations.complexity, foundations.recursion]
complexity:
    time: "O(n + log p) per word"
    space: "O(n)"
assumptions:
    - The word has n lowercase letters and n < p, so every factorial that is inverted is nonzero modulo p.
    - The modulus p = 1000000007 is prime, so Fermat's little theorem supplies every inverse.
    - Two arrangements are equal exactly when they produce the same string, so letters with the same value are indistinguishable.
implementations: combinatorics.multinomial-coefficients
reviewed: false
---

<AlgorithmSummary algorithm="combinatorics.multinomial-coefficients" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="combinatorics.multinomial-coefficients" />

## At a glance

A multinomial coefficient counts the ways to split $n$ labeled positions into groups of fixed sizes. The same ratio counts the arrangements of a word whose letters repeat, the coefficient of one monomial in a multinomial expansion, and the numerator of a sample drawn without replacement.

| Object | Count |
| --- | --- |
| Arrangements of a multiset with counts $n_1, n_2, \ldots, n_k$ | $\frac{n!}{n_1!\,n_2!\cdots n_k!}$ |
| Coefficient of $x_1^{n_1}\cdots x_k^{n_k}$ in $(x_1+\cdots+x_k)^n$ | The same coefficient |
| Ways to draw $k$ marked items from $N$ with $K$ marked | $\binom{K}{k}\binom{N-K}{n-k}$ favorable samples out of $\binom{N}{n}$ |
| Time for one word of length $n$ | $O(n+\log p)$ |
| Auxiliary space | $O(n)$ for the factorial and inverse factorial tables |
| Requires | A prime modulus with $n < p$ |
| Fails when | The modulus is composite, or $n \ge p$ |

The counting argument is the same in the three counting rows: label everything, count the labeled objects, and divide by the number of labelings that produce the same unlabeled object. The algorithm is the arithmetic that evaluates the ratio without ever forming the unlabeled object.

The word "multinomial" hides the ordinary binomial coefficient. A multinomial coefficient with two groups is $\binom{n}{n_1}$, because the second group is forced once the first is chosen. Three or more groups are where the new behavior appears, and a program that computes only $\binom{n}{n_1}$ is wrong exactly when the input has at least three distinct letters.

## Problem motivation

The first problem is to count the distinct permutations of a word. The word `BANANA` has six letters, so there are $6! = 720$ orderings of its positions, but only $60$ distinct strings, because swapping the three `A` letters or the two `N` letters does not change the string. The answer is

$$
\frac{6!}{3!\,2!\,1!} = \frac{720}{6 \ast 2 \ast 1} = 60.
$$

The second problem is to count a sample drawn without replacement. An urn holds $N = 12$ balls, $K = 5$ of them marked. Draw $n = 4$ balls without replacement. What is the probability that exactly $k = 2$ are marked? The answer is

$$
\frac{\binom{5}{2}\binom{7}{2}}{\binom{12}{4}}
= \frac{10 \ast 21}{495}
= \frac{14}{33}
\approx 0.4242.
$$

The naive baseline enumerates. For the word, a program generates all $n!$ orderings and puts them in a set; for `BANANA` that is 720 orderings, which is harmless, but a word of $10^6$ letters has more orderings than there are atoms in the observable universe. For the urn, a program generates all $\binom{12}{4} = 495$ samples, which is also harmless, but a population of $10^6$ and a sample of $10^3$ has about $10^{3000}$ samples.

The formula is not an optimization of the enumeration. It is a different object: it counts the shapes that the arrangements can have, and the number of shapes is small enough to compute with arithmetic. The entire difficulty is to get the division right, because the numerator and the denominator are both enormous and the quotient is the only part that has to be represented.

## Recognition patterns

The technique is the right tool when the statement contains some of these phrases.

- "How many distinct permutations", "how many different strings", "how many anagrams", "how many arrangements of the letters".
- "The letters may repeat", "the word has repeated letters", "two arrangements are the same when they produce the same string".
- "Split $n$ people into groups of sizes $a$, $b$, and $c$", "assign each item to one of $k$ labeled boxes", "count the sequences with prescribed frequencies".
- "The coefficient of $x^a y^b z^c$", "the multinomial expansion", "the number of terms of a given type".
- "Draw without replacement", "a sample of $n$ from $N$", "exactly $k$ defectives", "a hand of cards", "a committee with a fixed composition".
- "The answer may be large", "modulo $10^9+7$", together with a count.

The constraints decide which formula and which arithmetic are legal.

| Situation | What it rules |
| --- | --- |
| Letters repeat and the order of positions matters | A multinomial coefficient, not $n!$ |
| The groups are labeled and their sizes are fixed | A multinomial coefficient |
| The groups are unlabeled | Divide by the factorial of the number of equal-sized groups |
| Items are identical and the boxes matter | Stars and bars, not a multinomial coefficient |
| Sampling is without replacement from a finite population | The hypergeometric distribution |
| Sampling is with replacement | The binomial or multinomial distribution |
| A count is wanted exactly and $n \le 20$ | Factorials fit in a 64-bit integer |
| A count is wanted modulo a prime and $n < p$ | Inverse factorials |
| A count is wanted modulo a composite number | Pascal's identity or prime factorization, not inverse factorials |
| $n \ge p$ and the modulus is the prime $p$ | Lucas's theorem, or a $p$-adic argument |

The distinction between the last four rows is where most wrong answers come from. A formula that is correct over the integers can be illegal over the residues, and a formula that is legal over a prime can be illegal over a composite modulus. The statement's modulus is part of the problem, not a detail of the output format.

## Naive approach

The first baseline enumerates the permutations of the word and counts the distinct ones.

```python
from itertools import permutations

def count_distinct_naive(word):
    return len(set(permutations(word)))
```

This is correct, and it is the reference implementation for a differential test. It costs $n!$ generated tuples, each of length $n$, so its time is $O(n! \ast n)$ and its memory is at least the number of distinct arrangements. At $n = 10$ it is already 3.6 million tuples; at $n = 12$ it is 479 million.

The second baseline forms the factorials exactly and divides at the end.

```python
from math import factorial

def count_distinct_exact(word):
    counts = [word.count(c) for c in set(word)]
    answer = factorial(len(word))
    for count in counts:
        answer //= factorial(count)
    return answer
```

In Python this is correct for every word, because integers are arbitrary-precision. In C, C++, Java, or JavaScript with ordinary numbers, it is correct only while every intermediate fits, and the numerator overflows long before the answer does.

The hypergeometric baseline enumerates the samples.

```python
from itertools import combinations

def hypergeometric_naive(N, K, n, k):
    total = 0
    favorable = 0
    for sample in combinations(range(N), n):
        total += 1
        marked = sum(1 for index in sample if index < K)
        if marked == k:
            favorable += 1
    return favorable / total
```

This counts the favorable samples exactly, and the final division is a floating-point approximation. Its cost is $\binom{N}{n}$ samples, each inspected in $O(n)$ time, so it is unusable as soon as the sample space is large. The formula replaces the enumeration of the samples with the enumeration of the two choices that build a favorable sample.

## Key insight

The insight is that **labeling the identical items turns an arrangement into a class of permutations, and every class has the same size.**

Take a word of length $n$ with letter counts $n_1, n_2, \ldots, n_k$, where $n_1 + \cdots + n_k = n$. Label the copies of the first letter $1$ through $n_1$, the copies of the second letter $1$ through $n_2$, and so on. There are $n!$ permutations of the $n$ labeled items.

Now forget the labels and read only the letter of each item. Every distinct word is the image of exactly

$$
n_1! \ast n_2! \ast \cdots \ast n_k!
$$

labeled permutations: the labels inside each letter class can be permuted independently, and no other permutation produces the same word. The map from labeled permutations to words therefore has fibers of equal size, so the number of words is

$$
\frac{n!}{n_1!\,n_2!\cdots n_k!}.
$$

The same argument has a sequential form that is easier to implement. Choose which $n_1$ of the $n$ positions receive the first letter: $\binom{n}{n_1}$ ways. Choose which $n_2$ of the remaining $n-n_1$ positions receive the second letter: $\binom{n-n_1}{n_2}$ ways. Continue until the last letter takes the remaining positions. The product is the multinomial coefficient, and the last choice is forced.

For the urn, the insight is that **all samples of size $n$ are equally likely, and a favorable sample is built by choosing its marked part and its unmarked part independently.** There are $\binom{N}{n}$ samples in total. A favorable sample contains $k$ of the $K$ marked balls and $n-k$ of the $N-K$ unmarked balls, so there are $\binom{K}{k}\binom{N-K}{n-k}$ of them. The probability is the ratio.

The modular form needs one more insight: **division by a factorial is multiplication by its inverse, and the inverse exists when the modulus is prime and the factorial is not a multiple of it.** For $p = 10^9+7$ and $n < p$, none of $1, 2, \ldots, n$ is divisible by $p$, so $n!$ is invertible modulo $p$. Fermat's little theorem gives the inverse as $n!^{p-2} \bmod p$, and the inverse factorials for every smaller number follow from one downward pass.

## Visual intuition

The word `BANANA` has six positions. The multinomial coefficient is the number of ways to paint each position with one of the letters, using exactly three `A`s, two `N`s, and one `B`.

```text
position   1   2   3   4   5   6
letter     A   A   A   N   N   B

choose 3 positions for A:  C(6, 3) = 20
choose 2 positions for N:  C(3, 2) = 3
choose 1 position for B:   C(1, 1) = 1

20 * 3 * 1 = 60
```

The same picture read in reverse is the labeling argument. Start with the 720 permutations of six labeled items. Each word is produced by $3! \ast 2! \ast 1! = 12$ of them, because the three `A` labels can be rearranged in $3!$ ways and the two `N` labels in $2!$ ways. The 720 permutations collapse into $720 / 12 = 60$ words.

The urn picture is a rectangle of $N$ balls split into a marked block of size $K$ and an unmarked block of size $N-K$. A sample of size $n$ is a choice of $n$ balls from the rectangle. A favorable sample takes $k$ balls from the marked block and $n-k$ from the unmarked block. The denominator counts all choices of $n$ balls, and the numerator counts the choices with the required split.

```text
population:  [ K marked ][ N - K unmarked ]   total N
sample:      [ k marked ][ n - k unmarked ]   total n

numerator:   C(K, k) * C(N - K, n - k)
denominator: C(N, n)
```

For $N = 12$, $K = 5$, $n = 4$, and $k = 2$, the marked block contributes $\binom{5}{2} = 10$ choices, the unmarked block contributes $\binom{7}{2} = 21$, and the denominator is $\binom{12}{4} = 495$. The favorable region is $210$ of the $495$ samples.

The modular evaluation has no picture beyond the factorial table, but the table itself is worth drawing. For $n = 4$, the factorials and their inverses modulo $10^9+7$ are:

| $i$ | $i!$ | $(i!)^{-1} \bmod 10^9+7$ |
| --- | ---- | ------------------------ |
| 0   | 1    | 1                        |
| 1   | 1    | 1                        |
| 2   | 2    | 500000004                |
| 3   | 6    | 166666668                |
| 4   | 24   | 41666667                 |

The inverse factorial table is built from the top: invert $4!$ once, then multiply by $4$ to get the inverse of $3!$, by $3$ to get the inverse of $2!$, and by $2$ to get the inverse of $1!$. The recurrence is exact because $(i!)^{-1} \ast i = ((i-1)!)^{-1}$.

## Formal model

Let $n$ be a nonnegative integer and let $n_1, n_2, \ldots, n_k$ be nonnegative integers with $n_1 + \cdots + n_k = n$.

::: math definition Definition
A **multiset** over an alphabet of $k$ symbols is a function that assigns a nonnegative count to each symbol. The **multinomial coefficient** of the counts is

$$
\binom{n}{n_1, n_2, \ldots, n_k}
= \frac{n!}{n_1!\,n_2!\cdots n_k!}.
$$

It is the number of words of length $n$ that contain the $i$-th symbol exactly $n_i$ times.
:::

::: math theorem Multinomial count
The number of distinct arrangements of a multiset with counts $n_1, \ldots, n_k$ is the multinomial coefficient above.
:::

::: math proof Proof
Label the copies of symbol $i$ from $1$ to $n_i$. There are $n!$ permutations of the $n$ labeled items. The map that erases the labels sends a permutation to its word. For a fixed word, the labels inside each symbol class can be permuted independently, which gives $n_1!\,n_2!\cdots n_k!$ labeled permutations per word. Every labeled permutation maps to exactly one word, so the fibers all have that size. The number of words is therefore the number of labeled permutations divided by the fiber size. $\square$
:::

::: math theorem Sequential product
For every choice of counts with $n_1 + \cdots + n_k = n$,

$$
\binom{n}{n_1}\binom{n-n_1}{n_2}\cdots\binom{n-n_1-\cdots-n_{k-1}}{n_k}
= \binom{n}{n_1, n_2, \ldots, n_k}.
$$
:::

::: math proof Proof
Expand each binomial coefficient as a factorial ratio. The numerator is

$$
\frac{n!}{n_1!\,(n-n_1)!}
\ast
\frac{(n-n_1)!}{n_2!\,(n-n_1-n_2)!}
\ast \cdots
\ast
\frac{n_k!}{n_k!\,0!}.
$$

Every intermediate factorial cancels with the denominator of the previous factor, leaving $n!/(n_1!\,n_2!\cdots n_k!)$. $\square$
:::

::: math theorem Multinomial theorem
For a positive integer $n$,

$$
(x_1 + x_2 + \cdots + x_k)^n
= \sum_{n_1+\cdots+n_k=n}
\binom{n}{n_1,\ldots,n_k} x_1^{n_1} x_2^{n_2}\cdots x_k^{n_k},
$$

where the sum is over all tuples of nonnegative integers with the given total.
:::

::: math proof Proof
A term of the product is formed by choosing one variable from each of the $n$ factors. A term with exponents $n_1, \ldots, n_k$ arises from every sequence of choices in which variable $i$ is chosen $n_i$ times. The number of such sequences is exactly the number of words with those letter counts, which is the multinomial coefficient. $\square$
:::

::: math definition Definition
A **hypergeometric experiment** draws $n$ items without replacement from a population of $N$ items, of which $K$ are marked. The random variable $X$ is the number of marked items in the sample.
:::

::: math theorem Hypergeometric probability
For every integer $k$ in the range

$$
\max(0, n-(N-K)) \le k \le \min(n,K),
$$

the probability that the sample contains exactly $k$ marked items is

$$
\Pr(X=k)
= \frac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}.
$$
:::

::: math proof Proof
Every sample of size $n$ is equally likely, and there are $\binom{N}{n}$ samples. A sample with $k$ marked items is determined by choosing $k$ of the $K$ marked items and $n-k$ of the $N-K$ unmarked items. These choices are independent, so the number of favorable samples is the product. The range is exactly the set of $k$ for which both binomial coefficients are nonzero. $\square$
:::

::: math theorem Multivariate hypergeometric probability
Suppose the population is split into $m$ classes of sizes $N_1, \ldots, N_m$ with $N = N_1+\cdots+N_m$, and a sample of size $n$ is drawn without replacement. If $k_i$ items of class $i$ are drawn, with $k_1+\cdots+k_m=n$, then

$$
\Pr(K_1=k_1,\ldots,K_m=k_m)
= \frac{\prod_{i=1}^{m}\binom{N_i}{k_i}}{\binom{N}{n}}.
$$
:::

::: math proof Proof
Choose $k_i$ items from each class independently; the product counts the favorable samples. The denominator counts every sample of size $n$ once. The classes partition the population, so the choices determine the sample uniquely. Summing the numerator over all compositions of $n$ gives $\binom{N}{n}$ by the general form of Vandermonde's identity, so the probabilities sum to one. $\square$
:::

::: math invariant Invariant
While the inverse factorial table is built downwards, after the step for $i$ the entry $\text{invfact}[i-1]$ equals $((i-1)!)^{-1} \bmod p$. While the answer is accumulated, after processing the first $j$ letters the running value equals

$$
n! \ast \prod_{i=1}^{j}(n_i!)^{-1} \bmod p.
$$

At the end, the value is the multinomial coefficient modulo $p$.
:::

## Algorithm derivation

The input is one word of lowercase letters. The output is the number of its distinct permutations modulo $p = 10^9+7$.

1. Count how many times each of the 26 letters appears. Call the counts $c_0, c_1, \ldots, c_{25}$.
2. Let $n$ be the length of the word. Build the factorial table $0!, 1!, \ldots, n!$ modulo $p$.
3. Compute $\text{invfact}[n] = (n!)^{p-2} \bmod p$ with binary exponentiation.
4. Fill the inverse factorial table downwards: $\text{invfact}[i-1] = \text{invfact}[i] \ast i \bmod p$.
5. Start with $n!$ and multiply by $\text{invfact}[c_j]$ for every letter. The result is the answer.

The reason a single inverse is enough is that the denominator is a product of factorials. In a field, the inverse of a product is the product of the inverses, and the downward recurrence produces every inverse from the single one at the top. The binary exponentiation costs $O(\log p)$ multiplications, and the two loops cost $O(n)$ each.

The derivation also works exactly, without a modulus, if the language has arbitrary-precision integers. The exact version multiplies the numerator and divides by each $c_i!$ in some order. The division is exact only after all the factors of $c_i!$ have been multiplied in, so the order matters: dividing early truncates.

For the hypergeometric probability, precompute factorials up to $N$ and evaluate each binomial coefficient as

$$
\binom{a}{b} = \frac{a!}{b!\,(a-b)!}
$$

in $O(1)$ time. For a single $k$, the probability is the product of three binomial coefficients and one inverse. For a sum over a range of $k$, the denominator is shared, so sum the numerators and divide once. If the probability is wanted as a rational number, keep the numerator and denominator as integers and reduce by their greatest common divisor. If it is wanted modulo a prime, the same inverse factorial table works, provided $N < p$.

The composite-modulus case is different enough to deserve its own route. When the modulus $M$ is not prime, a factorial may share a factor with $M$ and have no inverse. The safe options are:

- Build Pascal's triangle modulo $M$ with $\binom{a}{b} = \binom{a-1}{b-1} + \binom{a-1}{b}$, and multiply the binomial coefficients of the sequential product.
- Factor $M$ into prime powers, compute the answer modulo each prime power by tracking the exponent of the prime, and combine the residues with the Chinese remainder theorem.

The first option is simpler when the total count is at most a few thousand, which is the usual constraint on a problem that asks for a multinomial coefficient under an arbitrary modulus.

## Step-by-step execution

The word `BANANA` has $n = 6$ and counts $c_A = 3$, $c_N = 2$, $c_B = 1$.

| Step        | Value                                       |
| ----------- | ------------------------------------------- |
| Factorials  | $6! = 720$                                  |
| Denominator | $3! \ast 2! \ast 1! = 6 \ast 2 \ast 1 = 12$ |
| Answer      | $720 / 12 = 60$                             |

The sequential view gives the same number. Choose the three `A` positions from six: $\binom{6}{3} = 20$. Choose the two `N` positions from the remaining three: $\binom{3}{2} = 3$. The `B` takes the last position. The product is $20 \ast 3 = 60$.

For the modular evaluation, take the word `aabb`, so $n = 4$ and the counts are $2$ and $2$. With $p = 10^9+7$, the factorial table is $1, 1, 2, 6, 24$ and the inverse factorial table is the one shown in the visual section.

| Step                          | Running value                 |
| ----------------------------- | ----------------------------- |
| Start                         | $4! = 24$                     |
| Multiply by $(2!)^{-1}$       | $24 \ast 500000004 \equiv 12$ |
| Multiply by $(2!)^{-1}$ again | $12 \ast 500000004 \equiv 6$  |

The answer is $6$, which agrees with $4!/(2!\,2!) = 24/4 = 6$.

For the hypergeometric example with $N = 12$, $K = 5$, $n = 4$, and $k = 2$:

| Quantity          | Value                            |
| ----------------- | -------------------------------- |
| Marked choices    | $\binom{5}{2} = 10$              |
| Unmarked choices  | $\binom{7}{2} = 21$              |
| Favorable samples | $10 \ast 21 = 210$               |
| All samples       | $\binom{12}{4} = 495$            |
| Probability       | $210/495 = 14/33 \approx 0.4242$ |

The complete distribution for the same experiment is worth checking, because the five probabilities must sum to one.

| $k$ | Favorable samples                | Probability |
| --- | -------------------------------- | ----------- |
| 0   | $\binom{5}{0}\binom{7}{4} = 35$  | $35/495$    |
| 1   | $\binom{5}{1}\binom{7}{3} = 175$ | $175/495$   |
| 2   | $\binom{5}{2}\binom{7}{2} = 210$ | $210/495$   |
| 3   | $\binom{5}{3}\binom{7}{1} = 70$  | $70/495$    |
| 4   | $\binom{5}{4}\binom{7}{0} = 5$   | $5/495$     |

The numerators sum to $35 + 175 + 210 + 70 + 5 = 495$, so the probabilities sum to one.

## Correctness proof

::: math theorem Theorem
The algorithm that counts letter frequencies, builds factorials and inverse factorials modulo the prime $p$, and multiplies $n!$ by the inverse factorial of every frequency returns the number of distinct permutations of the word modulo $p$, provided $n < p$.
:::

::: math proof Proof
Let the nonzero frequencies be $c_1, \ldots, c_k$, with sum $n$. The multinomial theorem and the labeling argument show that the exact count is $n!/(c_1!\cdots c_k!)$.

Because $n < p$ and $p$ is prime, none of the integers $1, 2, \ldots, n$ is divisible by $p$, so $n!$ and every $c_i!$ are nonzero modulo $p$. Fermat's little theorem gives $a^{p-1} \equiv 1 \pmod p$ for every $a \not\equiv 0$, so $a^{p-2}$ is the inverse of $a$. Therefore $\text{invfact}[n] = (n!)^{-1}$.

The downward loop maintains the invariant $\text{invfact}[i-1] = \text{invfact}[i] \ast i$. If $\text{invfact}[i] = (i!)^{-1}$, then

$$
\text{invfact}[i] \ast i
= (i!)^{-1} \ast i
= ((i-1)!)^{-1},
$$

because $i! = i \ast (i-1)!$. By induction every entry is the inverse of its factorial. The final product is

$$
n! \ast \prod_{j=1}^{k}(c_j!)^{-1}
\equiv \frac{n!}{c_1!\cdots c_k!} \pmod p,
$$

which is the multinomial coefficient modulo $p$. $\square$
:::

::: math theorem Theorem
The hypergeometric formula returns the probability of exactly $k$ marked items in a sample of size $n$ drawn without replacement from a population of $N$ items with $K$ marked.
:::

::: math proof Proof
The sample space is the family of all $n$-element subsets of the population, and every subset is equally likely, so the denominator is $\binom{N}{n}$. A sample with exactly $k$ marked items is determined by its marked subset, which is a $k$-element subset of the $K$ marked items, and its unmarked subset, which is an $(n-k)$-element subset of the $N-K$ unmarked items. The choices are independent and every pair gives a distinct sample, so the numerator is $\binom{K}{k}\binom{N-K}{n-k}$. The range in the theorem is exactly the set of $k$ for which both factors are defined and nonzero. $\square$
:::

::: math theorem Theorem
The sequential product of binomial coefficients equals the multinomial coefficient.
:::

::: math proof Proof
The product is telescoping. The denominator of each factor cancels the numerator of the next, and the final factor has denominator $n_k!$. The only surviving numerator is $n!$, and the surviving denominator is the product of all the group factorials. This is the same count as the labeling argument, with the groups chosen in order. $\square$
:::

## Complexity analysis

Let $n$ be the length of the word and let $\sigma = 26$ be the size of the alphabet.

| Method | Time | Space | Requirement |
| --- | --- | --- | --- |
| Enumerate permutations into a set | $O(n! \ast n)$ | $O(n! \ast n)$ | Only tiny $n$ |
| Generate distinct arrangements by backtracking | $O(D \ast n)$ | $O(n)$ | $D$ is the number of distinct arrangements |
| Exact factorial ratio | $O(n)$ multiplications | $O(n)$ for the factorial table | The exact answer must fit |
| Modular factorial and inverse factorial | $O(n+\log p)$ | $O(n)$ | $p$ prime and $n < p$ |
| Hypergeometric single term | $O(N+\log p)$ preprocessing, $O(1)$ per query | $O(N)$ | $N < p$ for modular arithmetic |
| Hypergeometric sum over $k$ | $O(N+\log p+r)$ | $O(N)$ | $r$ is the number of terms in the range |

The modular method has no dependence on the size of the answer. The answer is a residue below $p$, and every intermediate product is below $p^2$. For $p = 10^9+7$, $p^2 \approx 10^{18}$, which fits in a signed 64-bit integer, so C, C++, Java, and a native Free Pascal compiler can use `long long` or `Int64`. JavaScript cannot: its ordinary numbers are doubles with 53 bits of exact integer precision, and $p^2$ needs 60 bits, so the JavaScript program uses `BigInt`. The Pascal listing is also compiled by a browser-based compiler that represents `Int64` with JavaScript numbers, so it multiplies through three 10-bit limbs to keep every partial product below $2^{53}$.

The exact method is a different story. The answer $n!/(c_1!\cdots c_k!)$ has about $n\log_{10} n - n\log_{10} e$ digits in the worst case, which is about 5.5 million digits at $n = 10^6$. No fixed-width type holds it, and the cost of multiplying numbers that large is far above $O(n)$. A statement that gives no modulus is therefore either a small-$n$ problem or a problem that expects a different representation, such as a logarithm, a prime factorization, or a floating-point probability.

The hypergeometric denominator $\binom{N}{n}$ is the largest number the method forms. When the probability is evaluated modulo a prime, the inverse exists only if $N < p$, because otherwise $\binom{N}{n}$ can be divisible by $p$. When the probability is evaluated as a rational number, the integers can be reduced by the greatest common divisor, or the ratio can be computed in floating point if the statement accepts a relative error.

## Algorithm selection

| The situation | What to use |
| --- | --- |
| Count distinct arrangements of a word with repeated letters | The multinomial coefficient and inverse factorials |
| List the distinct arrangements as well as count them | Backtracking over the frequency array |
| Split $n$ labeled items into labeled groups of fixed sizes | The multinomial coefficient |
| Split into unlabeled groups of equal size | Divide the multinomial coefficient by the factorial of the number of groups |
| Find one coefficient of $(x_1+\cdots+x_k)^n$ | The multinomial coefficient |
| Draw without replacement from two classes | The hypergeometric distribution |
| Draw without replacement from several classes | The multivariate hypergeometric distribution |
| Draw with replacement | The multinomial distribution, with probabilities $p_i = N_i/N$ |
| Modulus is prime and $n < p$ | Inverse factorials |
| Modulus is prime and $n \ge p$ | Lucas's theorem, or track the exponent of $p$ |
| Modulus is composite | Pascal's identity, prime factorization, or the Chinese remainder theorem |
| Items are identical and only the box counts matter | [Stars and bars](/algorithms/combinatorics/stars-and-bars) |
| The count is a sum over many shapes | [Generating functions](/algorithms/combinatorics/generating-functions) or [counting dynamic programming](/algorithms/combinatorics/counting-dp) |

The row that is most often missed is the composite modulus. The inverse factorial method is not a general fact about division; it is a fact about fields. A modulus such as $10^9$ or $12$ has zero divisors, and a factorial that shares a factor with the modulus has no inverse. The repair is not to add a fallback branch to the inverse function. The repair is to change the method to one that never divides.

The second row that is missed is the distinction between labeled and unlabeled groups. The multinomial coefficient counts assignments to labeled groups. If the groups are not labeled, arrangements that permute whole groups are the same configuration, and the count must be divided by the factorial of the number of groups of each size.

## Reference implementations

The six programs implement the same contract: read one word of lowercase letters from standard input, and print the number of its distinct permutations modulo $10^9+7$ on one line. All six count the 26 letter frequencies, build the factorial table, build the inverse factorial table from one modular exponentiation, and multiply the inverse factorials of the frequencies.

| Language | File | Storage | Notes |
| --- | --- | --- | --- |
| C | `c/program.c` | `long long` arrays | Reads the word into a growable buffer, so the length is limited by memory rather than a fixed array |
| C++17 | `cpp17/program.cpp` | `std::vector<long long>` | Uses `std::string` and `std::vector`, and a binary exponentiation function |
| Java | `java/Main.java` | `long[]` | The class is `Main`, and a `BufferedReader` reads the single token |
| Python | `python/program.py` | Lists of ints | Uses the built-in three-argument `pow` for the inverse |
| Pascal | `pascal/program.pas` | `array of Int64` | One argument per `Read`, no `IOResult`, and a 10-bit limb helper because the browser compiler stores `Int64` in a JavaScript number |
| JavaScript | `javascript/program.js` | `BigInt` arrays | Ordinary numbers cannot hold $p^2$ exactly, so every modular product uses `BigInt` |

The time and space bounds are the same in every language: $O(n+\log p)$ time and $O(n)$ space for one word. The constant differs because Python and JavaScript allocate objects for large integers, while C, C++, Java, and a native Pascal compiler use machine words.

The C program reads until whitespace rather than into a fixed-size array, so a word longer than the buffer of a simpler implementation does not overflow it. The Java program reads a line and takes its first token, so a trailing newline or a leading blank line does not change the answer. The Pascal program reads the line and trims it, because the console unit used by the online runner treats the rest of the line as a string.

The JavaScript and Pascal files begin with the educational-reference notice required by this encyclopedia. They are readable implementations of the same algorithm, not submissions to a judge that accepts those languages.

## Recursion decision

The counting algorithm has no recursion. The factorial table is a loop from $1$ to $n$, the inverse factorial table is a loop from $n$ down to $1$, and the final product is a loop over 26 letters. The depth of the call stack is constant, so the word length is limited by memory rather than by the stack.

The enumeration algorithm is recursive, and its depth is $n$, one frame per position. Its branching factor is the number of letters with a positive remaining count, which is at most 26. The number of leaves is the number of distinct arrangements, so the recursion is only appropriate when that number is small enough to print.

| Language | Practical recursion depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative for the count; recursion only for enumeration when the output is small |
| Java | About $10^4$ frames | Iterative for the count; recursion only for enumeration when the output is small |
| Python | The interpreter limit of 1000 | Iterative for the count; rewrite the enumeration as an explicit stack if $n$ can approach the limit |
| Pascal | The operating system stack | Iterative for the count; recursion only for enumeration when the output is small |
| JavaScript | About $10^4$ frames | Iterative for the count; recursion only for enumeration when the output is small |

The recursion is also the wrong shape for the count even where it fits, because the number of recursive calls is the number of arrangements. A count that is computed by visiting every arrangement has not used the formula at all.

## Implementation walkthrough

The implementation is five lines of arithmetic around two loops.

```cpp
std::array<int, 26> freq{};
for (char c : word) {
    ++freq[c - 'a'];
}

std::vector<long long> fact(n + 1, 1);
std::vector<long long> invFact(n + 1, 1);
for (int i = 1; i <= n; ++i) {
    fact[i] = fact[i - 1] * i % MOD;
}
invFact[n] = modPow(fact[n], MOD - 2);
for (int i = n; i >= 1; --i) {
    invFact[i - 1] = invFact[i] * i % MOD;
}

long long answer = fact[n];
for (int count : freq) {
    answer = answer * invFact[count] % MOD;
}
```

The first line that decides correctness is `invFact[n] = modPow(fact[n], MOD - 2);`. It is an inverse only because the modulus is prime and `fact[n]` is nonzero. If the modulus were composite, this line would silently produce a number that is not an inverse, and the final answer would be wrong.

The second line that decides correctness is `invFact[i - 1] = invFact[i] * i % MOD;`. It runs downwards, from the known inverse of $n!$ to the inverse of $(n-1)!$. Running it upwards would use an entry that has not been initialized yet. The recurrence is not the same as `invFact[i - 1] = invFact[i] * (i - 1)`, which is the most common off-by-one error in the table.

The third line is `answer = answer * invFact[count] % MOD;`. The count of a letter can be zero, and `invFact[0]` is $1$, so the loop over all 26 letters is safe. The loop must cover the letters that do not appear as well as the letters that do, but multiplying by $1$ changes nothing, so only the nonzero counts matter.

For an empty word, $n = 0$, the tables have one entry, `fact[0] = invFact[0] = 1`, and the answer is $1$. The empty word has exactly one arrangement, the empty string. A single-letter word also has answer $1$, because every arrangement is the same string. These are the two edge cases that a loop starting at $1$ must not mishandle.

In Java, every modular product must be stored in a `long`, not an `int`. In C and C++, the same is true. In JavaScript, `Number` is a double, so `1000000006 * 1000000006` is not exact; the program converts every operand to `BigInt` before multiplying. In Pascal, a native `Int64` holds the product because $(10^9+7)^2$ is below $2^{63}-1$, but the browser compiler represents `Int64` with JavaScript numbers, so the listing uses a small limb helper instead of a single product.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using $n!$ and ignoring repeated letters | The answer is too large by the product of the frequencies' factorials | Divide by every frequency factorial |
| Using $\binom{n}{c_1}$ for a word with three or more letters | The other letters are not accounted for | Use the full multinomial coefficient |
| Dividing residues with ordinary integer division | The quotient is not the modular quotient | Multiply by the modular inverse |
| Inverting a factorial when $n \ge p$ | The factorial is zero modulo $p$ and has no inverse | Use Lucas's theorem or track the exponent of $p$ |
| Inverting a factorial modulo a composite number | The inverse may not exist | Use Pascal's identity or factor the modulus |
| Building the inverse factorial table upwards | Uninitialized entries are used | Build it downwards from $n$ |
| Using `invFact[i - 1] = invFact[i] * (i - 1)` | The table is off by one | Multiply by $i$, because $i! = i \ast (i-1)!$ |
| Using 32-bit integers for modular products | The product overflows | Use 64-bit integers for $p \approx 10^9$ |
| Using JavaScript `Number` for modular products | The product loses precision above $2^{53}$ | Use `BigInt` |
| Treating the hypergeometric draw as a binomial draw | The probability is wrong because the draws are not independent | Use the hypergeometric denominator $\binom{N}{n}$ |
| Choosing the failures from all $N$ items | The numerator double-counts and can exceed the denominator | Choose them from $N-K$ |
| Summing hypergeometric terms outside the valid range | Impossible terms are included | Clamp $k$ to $\max(0,n-(N-K))$ through $\min(n,K)$ |
| Dividing groups that are not labeled | The count is too large by the permutations of the groups | Divide by the factorial of the number of equal groups |

### Why this fails: counting every permutation as distinct

The plausible wrong approach is to observe that there are $n!$ orderings of the positions and to report $n!$. It is correct only when every letter is different.

The smallest counterexample is the word `aa`. The formula $2! = 2$ counts `aa` twice, once for each ordering of the two identical letters, but there is only one distinct string. The next one is `aab`: $3! = 6$, while the distinct strings are `aab`, `aba`, and `baa`, so the correct answer is $3$. The overcount is exactly $2!$, the number of ways to permute the two `a` labels.

The same failure appears in a more convincing form when the word has three distinct letters. For `abcabc`, the correct answer is $6!/(2!\,2!\,2!) = 90$, while $6! = 720$. A program that reports 720 is not slightly off; it has counted each string eight times, and the factor depends on the frequencies, so no constant correction can fix it.

The lesson generalizes: **a permutation of positions is not a distinct arrangement unless the items in those positions are distinguishable.** The multinomial coefficient is the exact correction, and it is a division rather than an approximation.

### Why this fails: dividing residues with integer division

The plausible wrong approach is to compute the factorial modulo $p$, compute the denominator modulo $p$, and divide with the language's integer division operator. This is wrong because the residue of a quotient is not the quotient of the residues.

Take $p = 7$, $n = 4$, and a word with counts $2$ and $2$. The exact answer is $4!/(2!\,2!) = 6 \equiv 6 \pmod 7$. The numerator residue is $24 \bmod 7 = 3$, the denominator residue is $2! \ast 2! = 4$, and integer division gives $3/4 = 0$, while the correct residue is $6$. The inverse of $4$ modulo $7$ is $2$, and $3 \ast 2 = 6$, which is the right answer.

With $p = 5$ the same input gives $4/4 = 1$, which happens to be correct, so the bug survives some moduli. The $p = 7$ case is the smallest one where the quotient of the residues differs from the residue of the quotient.

### Why this fails: the binomial model for a sample without replacement

The plausible wrong approach is to treat each draw as independent with success probability $K/N$, which gives the binomial probability

$$
\binom{n}{k}\left(\frac{K}{N}\right)^k\left(1-\frac{K}{N}\right)^{n-k}.
$$

The draws are not independent, because each draw removes an item and changes the composition of the population.

The smallest counterexample is $N = 4$, $K = 2$, $n = 2$, $k = 1$. The hypergeometric answer is

$$
\frac{\binom{2}{1}\binom{2}{1}}{\binom{4}{2}} = \frac{4}{6} = \frac{2}{3},
$$

while the binomial answer is $2 \ast (1/2) \ast (1/2) = 1/2$. The difference is not a rounding error: the hypergeometric probability is larger, because drawing a marked item first makes the next draw less likely to be marked, and the symmetric cases compensate in a way the independent model does not capture.

The second failure in the same family is choosing the failures from the whole population. For $N = 12$, $K = 5$, $n = 4$, $k = 2$, the wrong numerator $\binom{5}{2}\binom{12}{2}$ gives $660/495 > 1$, which is impossible for a probability. The failures must come from the $N-K$ unmarked items, not from all $N$ items.

## Variants and extensions

- **The multinomial theorem.** The coefficient of $x_1^{n_1}\cdots x_k^{n_k}$ in $(x_1+\cdots+x_k)^n$ is the multinomial coefficient. This is the algebraic restatement of the counting argument.
- **The multivariate hypergeometric distribution.** With $m$ classes of sizes $N_1, \ldots, N_m$, the probability of drawing $k_i$ from class $i$ is $\prod_i\binom{N_i}{k_i}/\binom{N}{n}$. The two-class case is the hypergeometric distribution.
- **The multinomial distribution.** With replacement, the probability of counts $k_1, \ldots, k_m$ is the multinomial coefficient times $\prod_i p_i^{k_i}$, where $p_i = N_i/N$. The coefficient counts the orders of the draws, and the product gives the probability of each order.
- **Constrained arrangements.** If a prefix of the word is fixed, remove those letters from the counts and count the remaining multiset. If two letters must alternate, count the positions for one letter and test the gaps.
- **Unlabeled groups.** The number of ways to split $n$ labeled items into $g$ unlabeled groups of size $s$ is $\frac{n!}{(s!)^g\,g!}$. The extra $g!$ removes the order of the groups.
- **Exact big-integer evaluation.** When the answer must be exact, compute factorials with arbitrary-precision integers, or cancel the factors of each $c_i!$ against the numerator before multiplying. The latter keeps the intermediate values smaller.
- **The $p$-adic route.** When $n \ge p$, the factorial is zero modulo $p$, but the multinomial coefficient may not be. Track the exponent of $p$ in the numerator and denominator, remove those factors, and use Lucas's theorem for the remaining residue.
- **Composite moduli.** Factor the modulus, compute the answer modulo each prime power, and combine the results with the Chinese remainder theorem. For a small total count, Pascal's identity is simpler.
- **Cumulative hypergeometric probabilities.** Sum the numerator over a range of $k$ and divide by the shared denominator. The range must be clamped to the possible values, because terms outside it are impossible, not merely small.
- **The mean of the hypergeometric distribution.** The expected number of marked items is $nK/N$, by linearity of expectation, even though the draws are dependent.
- **Logarithms of factorials.** For very large $n$, the logarithm of $n!$ can be approximated with Stirling's formula, which is enough for a probability comparison but not for an exact residue.

## Contest strategy

1. Decide whether the items are distinguishable. If the word has repeated letters, the count is a multinomial coefficient, not $n!$.
2. Decide whether the groups are labeled. If they are not, the count needs an extra division by the factorial of the number of groups.
3. Count the frequencies before writing any formula. The frequencies are the only input to the multinomial coefficient.
4. Check the modulus. A prime modulus larger than the total count permits inverse factorials; a composite modulus, or a prime not larger than the count, forbids them.
5. If the modulus is composite, switch to Pascal's identity or factor the modulus. Do not add a fallback to the inverse function.
6. If the problem asks for a sample without replacement, use the hypergeometric denominator $\binom{N}{n}$ and choose the failures from $N-K$.
7. Clamp the range of $k$ before summing. The valid range is $\max(0,n-(N-K))$ through $\min(n,K)$.
8. Test the edge cases: a single letter, a word with one repeated letter, a word with all letters distinct, and a sample with $k=0$.
9. When the code is short, write the brute-force reference for small inputs and compare the two on every word up to length 8.
10. Use 64-bit arithmetic for products modulo $10^9+7$, and use `BigInt` in JavaScript.

## Worked problems

### Problem 1: the distinct arrangements of BANANA

**Restatement.** How many distinct strings can be formed by rearranging the letters of `BANANA`?

**Constraints.** The word has six letters, with three `A`s, two `N`s, and one `B`.

**Naive baseline.** Generate all $6! = 720$ permutations and put them in a set, which produces 60 distinct strings.

**Insight.** The positions are labeled, but the three `A` copies are not, and neither are the two `N` copies. The count is the multinomial coefficient of the frequencies.

**Derivation.** $6!/(3!\,2!\,1!) = 720/(6 \ast 2 \ast 1) = 60$.

**Correctness.** Every string with three `A`s, two `N`s, and one `B` is an arrangement counted by the multinomial coefficient, and the labeling argument shows that each string is counted exactly once after the division.

**Complexity.** $O(n+\log p)$ time and $O(n)$ space with the modular method, or $O(n)$ exact multiplications with arbitrary-precision integers.

**Common wrong approach.** Reporting $6! = 720$, which counts each string $3! \ast 2! = 12$ times.

### Problem 2: a sample without replacement

**Restatement.** An urn contains $N = 50$ balls, $K = 5$ of them marked. Draw $n = 10$ balls without replacement. What is the probability that exactly $k = 4$ are marked?

**Constraints.** The population is finite, the draws are without replacement, and the sample is a substantial fraction of the population, so the binomial model does not apply.

**Naive baseline.** Enumerate all $\binom{50}{10} = 10{,}272{,}278{,}170$ samples and count the favorable ones. The enumeration is far too large.

**Insight.** A favorable sample is a choice of 4 of the 5 marked balls and 6 of the 45 unmarked balls. The denominator is the number of all samples of size 10.

**Derivation.** The numerator is $\binom{5}{4}\binom{45}{6} = 5 \ast 8{,}145{,}060 = 40{,}725{,}300$. The denominator is $10{,}272{,}278{,}170$. The probability is $40{,}725{,}300/10{,}272{,}278{,}170 \approx 0.003964583$.

**Correctness.** Every sample of size 10 is equally likely. The favorable samples are exactly the pairs consisting of a 4-element subset of the marked balls and a 6-element subset of the unmarked balls, and the product counts those pairs once each.

**Complexity.** $O(N+\log p)$ preprocessing and $O(1)$ per query with factorial tables, or $O(1)$ with exact binomial coefficients for this small case. The enumeration is $O(\binom{N}{n} \ast n)$.

**Common wrong approach.** Using the binomial probability $\binom{10}{4}(0.1)^4(0.9)^6 \approx 0.0111$, which assumes replacement and is about 2.8 times too large.

### Problem 3: a multinomial coefficient under a composite modulus

**Restatement.** Given $N$ and positive counts $C_1, \ldots, C_N$, report

$$
\frac{(C_1+\cdots+C_N)!}{C_1!\,C_2!\cdots C_N!} \bmod M,
$$

where $M$ is an arbitrary integer between 2 and $10^9$. There are up to $10^5$ test cases, the sum of the counts in one case is at most 5000, and the sum of $N$ over all cases is at most $300{,}000$.

**Naive baseline.** Compute factorials modulo $M$ and multiply by the inverse factorials. This is wrong when $M$ is composite, because a factorial can share a factor with $M$.

**Insight.** The count is the product of binomial coefficients that choose the positions of each group in order:

$$
\prod_{i=1}^{N}\binom{C_1+\cdots+C_i}{C_i}.
$$

Pascal's identity computes every binomial coefficient modulo $M$ without division.

**Derivation.** Precompute $\binom{a}{b} \bmod M$ for every $0 \le b \le a \le S$, where $S = 5000$, using

$$
\binom{a}{b} = \binom{a-1}{b-1} + \binom{a-1}{b}.
$$

Then process each test case from left to right, multiplying $\binom{\text{prefix}_i}{C_i}$ into the answer.

**Correctness.** The sequential product equals the multinomial coefficient by the telescoping argument. Pascal's identity is valid over the integers, so reducing every addition modulo $M$ preserves the residue. No division is performed, so the composite modulus causes no problem.

**Complexity.** $O(S^2)$ preprocessing time and $O(S^2)$ memory for the table, plus $O(N)$ per test case. With $S = 5000$, the table has about 25 million entries; a 32-bit integer per entry is 100 MB, which fits the stated memory limit.

**Common wrong approach.** Using Fermat's little theorem with $M$ composite. For example, with $M = 4$ and the word `ab`, the exact answer is $2$, the factorial residue is $2$, and $2$ has no inverse modulo $4$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the items are distinguishable, whether the groups are labeled, and whether the sampling is with or without replacement. Write down the frequencies and the modulus.
2. **Direct application.** Implement the multinomial coefficient for a word, first with exact factorials and then modulo $10^9+7$. Check both against the enumeration for every word of length at most 8 over a two-letter alphabet.
3. **Adaptation.** Add the hypergeometric probability for a sample without replacement, and check the sum of the probabilities over all $k$ equals one.
4. **Combination.** Solve a problem where the answer is a product of binomial coefficients, such as choosing positions for each group in sequence, and compare it with the direct multinomial evaluation.
5. **Challenge.** Solve a problem with a composite modulus, where inverse factorials are illegal, and implement Pascal's identity or the prime-factorization route.
6. **Transfer.** Recognize the same ratio in another subject: the number of ways to interleave two sequences, the number of distinct paths with repeated step types, or the probability of a hand with a fixed composition. Where the count must be reduced, use [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the multinomial coefficient and give the labeling argument that proves it counts the arrangements of a multiset. (Key insight)
2. Why is the division by $n_1!\,n_2!\cdots n_k!$ exact? (Formal model)
3. Derive the sequential product of binomial coefficients and show that it telescopes. (Formal model)
4. Trace the count for `BANANA` and say what each factorial cancels. (Step-by-step execution)
5. What does the inverse factorial table store, and why does one exponentiation produce the whole table? (Algorithm derivation)
6. What condition on the modulus and on $n$ makes the inverse factorial method legal, and what fails when the condition is violated? (Common mistakes)
7. State the hypergeometric probability and the valid range of $k$. (Formal model)
8. Give the smallest input on which the binomial model is wrong for a sample without replacement, and say both probabilities. (Common mistakes)
9. Why is the multinomial coefficient with two groups just a binomial coefficient, and when does a three-group input expose a program that uses only $\binom{n}{c_1}$? (Key insight)
10. Why does the JavaScript program use `BigInt`, and what is the corresponding type in C, C++, Java, and Pascal? (Complexity analysis)
11. What is the extra factor when the groups are unlabeled rather than labeled? (Variants and extensions)
12. What changes when the modulus is composite, and which method replaces the inverse factorial? (Algorithm selection)

## Further reading

- The binomial coefficient, its Pascal recurrence, and the modular product that this article generalizes are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The distribution of identical items into distinct boxes, which is the multiset coefficient rather than the multinomial one, is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The inclusion and exclusion that handles upper bounds on the counts is in [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion).
- The coefficient interpretation of a count, and the product of generating functions that produces multinomial coefficients, is in [generating functions](/algorithms/combinatorics/generating-functions).
- The arithmetic that reduces a count modulo a prime, and the inverse that the modular method needs, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The enumeration that the formula replaces, and the reference implementation that catches a wrong count, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The dynamic program that counts arrangements when no closed form captures the constraints is in [counting dynamic programming](/algorithms/combinatorics/counting-dp).
- The discrete mathematics of bijections, permutations, and multisets is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index lists this technique beside the counting arguments it extends: [the combinatorics](/algorithms/combinatorics/).
