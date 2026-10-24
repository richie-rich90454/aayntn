---
id: combinatorics.integer-partitions
title: Integer partitions
summary: Count the ways to write n as a sum of positive integers with Euler's recurrence, whose terms sit at the generalized pentagonal numbers and whose sign alternates in pairs.
division: [silver, gold]
subjects: [combinatorics]
level: intermediate
importance: common-contest-technique
keywords:
    [
        integer partition,
        partition function,
        generating function,
        Euler's pentagonal number theorem,
        generalized pentagonal numbers,
        coin change,
        modular arithmetic,
    ]
prerequisites:
    required: [foundations.complexity, combinatorics.binomial-coefficients]
    recommended:
        [
            combinatorics.generating-functions,
            number-theory.modular-arithmetic,
            dynamic-programming.0-1-knapsack,
        ]
complexity:
    time: "O(n sqrt n)"
    space: "O(n)"
assumptions:
    - A partition is an unordered multiset of positive parts, so the order of the parts is not counted.
    - The answer is reported modulo 1000000007, so every update is performed in that residue class.
implementations: combinatorics.integer-partitions
reviewed: false
---

## At a glance

A partition of a positive integer $n$ is a way to write $n$ as a sum of positive integers in which the order of the summands does not matter. The number of partitions is written $p(n)$, with $p(0) = 1$ for the empty sum.

For example, $p(5) = 7$, because

$$
5,\quad 4+1,\quad 3+2,\quad 3+1+1,\quad 2+2+1,\quad 2+1+1+1,\quad 1+1+1+1+1
$$

are all the partitions of $5$. The sequence begins $1, 1, 2, 3, 5, 7, 11, 15, 22, 30, 42$ for $n = 0, 1, \ldots, 10$.

| Property | Value |
| --- | --- |
| **Problem** | Count the unordered sums of positive integers with total $n$ |
| **Count** | $p(n)$, with $p(0) = 1$ |
| **Generating function** | $P(x) = \sum_{n \ge 0} p(n)x^n = \prod_{i \ge 1} \frac{1}{1-x^i}$ |
| **Euler's theorem** | $\prod_{i \ge 1}(1-x^i) = \sum_{k \in \mathbb{Z}} (-1)^k x^{k(3k-1)/2}$ |
| **Recurrence** | $p(n) = p(n-1) + p(n-2) - p(n-5) - p(n-7) + p(n-12) + p(n-15) - \cdots$ |
| **Time** | $O(n \sqrt{n})$ |
| **Auxiliary space** | $O(n)$ |
| **Requires** | Parts that are all positive integers, and a modulus or an integer type that holds the count |
| **Fails when** | The order matters, because then the objects are compositions, not partitions |

The row that decides most problems is the last one. The number of compositions of $n$ is $2^{n-1}$, which is a completely different count from $p(n)$, and a program that reports one when the statement asks for the other is wrong by an enormous factor.

## Problem motivation

A puzzle asks for the number of ways to split $n$ identical coins into piles, where two splits that differ only by the order of the piles are the same. This is exactly $p(n)$.

The constraints are what make the problem interesting. A direct enumeration visits every partition, and there are $p(10^5)$ of them. That number has about $347$ decimal digits, so an enumeration that visits one partition per nanosecond would still outlast the universe. At $n = 100$ the count is already $190569292$, and at $n = 1000$ it is

$$
24061467864032622473692149727991,
$$

which no enumerator will ever reach.

The natural dynamic program is better. Process the possible parts in increasing order and keep a table of the number of ways to reach every total. That costs $O(n^2)$ time, which is $10^{10}$ updates at $n = 10^5$ and is still too slow.

The generating-function recurrence costs $O(n \sqrt{n})$ time. At $n = 10^5$ it performs about $3.4 \times 10^7$ term visits, which is small enough for every language in this encyclopedia. The whole technique is the observation that the reciprocal of the infinite product $\prod (1-x^i)$ has only $O(\sqrt{n})$ nonzero coefficients up to degree $n$, and that those coefficients are the generalized pentagonal numbers.

## Recognition patterns

Integer partitions are the right tool when the statement contains some of these phrases.

- "Split $n$ identical items into piles", "write $n$ as a sum of positive integers", "the order of the parts does not matter".
- "How many ways can $n$ cents be made from coins of every denomination", where each denomination is available without limit.
- "Partition function", "$p(n)$", "Euler's pentagonal number theorem".
- "At least two parts", which is $p(n) - 1$ when the one-part partition is the only excluded one.
- "The answer may be large", "modulo $10^9 + 7$", together with a count of sums.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 100$, and the exact count is wanted | The $O(n^2)$ coin-change dynamic program is already enough |
| $n \le 10^5$, and the answer is reduced modulo a prime | The pentagonal recurrence is the intended method |
| $n \le 10^6$ with a tight time limit | The recurrence is borderline; the inverse of the generating function with a number-theoretic transform is faster |
| The allowed parts are a given set of denominations | A coin-change dynamic program over that set, not the pentagonal recurrence |
| The order of the parts matters | Compositions, whose count is $2^{n-1}$ |
| The parts must be distinct | The product $\prod (1+x^i)$, a different dynamic program |
| The number of parts is fixed at $k$ | A dynamic program over the number of parts, or a Gaussian binomial coefficient |
| The modulus is composite | The recurrence still works, because it uses only addition and subtraction |

The last row is a useful contrast with [binomial coefficients](/algorithms/combinatorics/binomial-coefficients). A binomial coefficient computed modulo a prime needs a modular inverse, so the modulus must be prime and the denominator must be invertible. The partition recurrence never divides, so it works modulo any integer, including the $10^6$ that a divisibility question asks about.

## Naive approach

The first baseline enumerates the partitions directly. Fix the largest part and recurse on the remainder, allowing only parts that are no larger than the one just chosen.

```python
def count_partitions(n, largest):
    if n == 0:
        return 1
    total = 0
    for part in range(min(n, largest), 0, -1):
        total += count_partitions(n - part, part)
    return total
```

The non-increasing order is what prevents double counting: every partition has exactly one listing in non-increasing order, so the recursion generates it once. The call tree has one leaf per partition, which is $p(n)$ leaves, so the cost is exactly the number being computed. That is the definition of an enumeration that cannot finish.

The second baseline is the coin-change dynamic program. Let `ways[s]` be the number of ways to reach the total `s` using the parts processed so far. Processing the parts in increasing order and iterating the totals upward allows each part to be used any number of times.

```python
ways = [0] * (n + 1)
ways[0] = 1
for part in range(1, n + 1):
    for total in range(part, n + 1):
        ways[total] = (ways[total] + ways[total - part]) % MODULUS
```

This is correct and it is the reference implementation for a differential test. It costs $O(n^2)$ time and $O(n)$ space. At $n = 120$, the largest input of the first worked problem, it is instant. At $n = 10^5$ it performs $10^{10}$ updates, which is the barrier the recurrence removes.

## Key insight

The insight is that **the partition function is the coefficient sequence of an infinite product, and the reciprocal of that product is sparse.**

Every partition is a multiset of positive parts. For each part size $i$, a partition may use that part zero times, once, twice, and so on, and the choice contributes $1 + x^i + x^{2i} + \cdots = \frac{1}{1-x^i}$ to the generating function. Multiplying the independent choices gives

$$
P(x) = \sum_{n \ge 0} p(n)x^n = \prod_{i \ge 1} \frac{1}{1-x^i}.
$$

The product has one factor for every positive integer, so multiplying the factors naively and reading the coefficient of $x^n$ costs $O(n^2)$: each factor is a geometric series with $n/i$ relevant terms, and the sum of $n/i$ over $i$ is $O(n \log n)$ per convolution, or $O(n^2)$ for the whole table.

Euler's pentagonal number theorem describes the reciprocal of that product. It says

$$
\prod_{i \ge 1}(1-x^i) = \sum_{k \in \mathbb{Z}} (-1)^k x^{k(3k-1)/2}
= 1 - x - x^2 + x^5 + x^7 - x^{12} - x^{15} + \cdots.
$$

The right-hand side has only two nonzero terms for each integer $k$, and the exponents grow quadratically. Up to degree $n$ there are only $O(\sqrt{n})$ nonzero terms, not $n$ of them.

Because $P(x)$ and this product are reciprocals, their product is $1$. The coefficient of $x^n$ in that product is $p(n)$ plus a signed sum of earlier values at the pentagonal offsets, and it must be zero for every $n \ge 1$. Moving $p(n)$ to the other side gives the recurrence. The sparsity of Euler's series is the whole saving: the recurrence reads only $O(\sqrt{n})$ earlier entries instead of all $n$ of them.

## Visual intuition

A partition is usually drawn as a Ferrers diagram, with one row of dots for each part, the rows sorted from longest to shortest. The partition $10 = 4 + 3 + 2 + 1$ is

```text
....
...
..
.
```

The rows are left-aligned and the column heights are non-increasing, which is the visual form of the statement that the order does not matter.

The first values of the partition function are worth memorizing, because they are the fastest check on a new implementation.

| $n$    | 0   | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $p(n)$ | 1   | 1   | 2   | 3   | 5   | 7   | 11  | 15  | 22  | 30  | 42  |

The generalized pentagonal numbers are the exponents in Euler's series. Each positive integer $k$ contributes two of them, and the two share a sign.

| $k$ | $k(3k-1)/2$ | $k(3k+1)/2$ | Sign |
| --- | ----------- | ----------- | ---- |
| 1   | 1           | 2           | $+$  |
| 2   | 5           | 7           | $-$  |
| 3   | 12          | 15          | $+$  |
| 4   | 22          | 26          | $-$  |
| 5   | 35          | 40          | $+$  |

Now compute $p(10)$ from the table. The offsets that do not exceed $10$ are $1, 2, 5, 7$, and the next pair starts at $12$, so the recurrence reads four earlier values:

$$
p(10) = p(9) + p(8) - p(5) - p(3) = 30 + 22 - 7 - 3 = 42.
$$

As $n$ grows, the number of offsets grows like $\sqrt{n}$, not like $n$. The picture is a window over the old values whose width grows slowly, and every entry in the window is either added or subtracted according to the parity of the pair's index.

## Formal model

::: math definition Definition
A **partition** of a non-negative integer $n$ is a non-increasing sequence of positive integers

$$
\lambda = (\lambda_1, \lambda_2, \ldots, \lambda_k),
\qquad
\lambda_1 \ge \lambda_2 \ge \cdots \ge \lambda_k \ge 1,
\qquad
\sum_{i=1}^{k} \lambda_i = n.
$$

The **partition function** $p(n)$ is the number of partitions of $n$, with $p(0) = 1$ for the empty partition.
:::

::: math definition Definition
The **generating function** of the partition function is the formal power series

$$
P(x) = \sum_{n \ge 0} p(n)x^n = \prod_{i \ge 1} \frac{1}{1-x^i}.
$$

The **generalized pentagonal numbers** are

$$
g_k = \frac{k(3k-1)}{2}
\quad\text{for } k \ge 1,
\qquad
g_{-k} = \frac{k(3k+1)}{2}
\quad\text{for } k \ge 1.
$$
:::

The first generalized pentagonal numbers are $1, 2, 5, 7, 12, 15, 22, 26, 35, 40, \ldots$, in that order. The name comes from the pentagonal numbers $k(3k-1)/2$ for positive $k$; the negative index adds the second number of each pair.

::: math theorem Euler's pentagonal number theorem
As formal power series,

$$
\prod_{i \ge 1}(1-x^i)
= \sum_{k \in \mathbb{Z}} (-1)^k x^{k(3k-1)/2}
= 1 - x - x^2 + x^5 + x^7 - x^{12} - x^{15} + \cdots.
$$
:::

::: math proof Proof sketch
The coefficient of $x^m$ in $\prod_{i \ge 1}(1-x^i)$ is the signed count

$$
\sum_{\lambda} (-1)^{|\lambda|},
$$

where the sum runs over the partitions of $m$ into distinct parts. Franklin's involution pairs the partitions in this sum with a move on the Ferrers diagram, and the only unpaired ones are the two families

$$
(2k-1, 2k-2, \ldots, k)
\quad\text{and}\quad
(2k, 2k-1, \ldots, k+1),
$$

whose sums are $k(3k-1)/2$ and $k(3k+1)/2$ and whose number of parts is $k$. The unpaired terms therefore contribute $(-1)^k$ at exactly those two exponents, which is the displayed series. $\square$
:::

::: math theorem Partition recurrence
For every $n \ge 1$,

$$
p(n) = \sum_{k \ge 1} (-1)^{k+1}
\left(
p\left(n - \frac{k(3k-1)}{2}\right)
+
p\left(n - \frac{k(3k+1)}{2}\right)
\right),
$$

where $p(m) = 0$ for $m < 0$.
:::

::: math proof Proof
The product of $P(x)$ and Euler's series is $1$, because the two factors are reciprocals. The coefficient of $x^n$ in that product is

$$
\sum_{k \in \mathbb{Z}} (-1)^k
p\left(n - \frac{k(3k-1)}{2}\right) = 0
\qquad\text{for } n \ge 1.
$$

The $k = 0$ term is $p(n)$. Moving it to the right-hand side and changing the sign gives

$$
p(n) = \sum_{k \ne 0} (-1)^{k+1}
p\left(n - \frac{k(3k-1)}{2}\right).
$$

Pair each positive $k$ with $-k$. Both terms have the same sign $(-1)^{k+1}$, and their offsets are $k(3k-1)/2$ and $k(3k+1)/2$. Terms whose offset exceeds $n$ are zero by the convention $p(m) = 0$ for $m < 0$. $\square$
:::

::: math lemma Lemma
The generalized pentagonal numbers are strictly increasing:

$$
1 = g_1 < g_{-1} = 2 < g_2 = 5 < g_{-2} = 7 < g_3 = 12 < g_{-3} = 15 < \cdots.
$$
:::

::: math proof Proof
Within a pair, $g_{-k} - g_k = k > 0$. Between pairs,

$$
g_{k+1} - g_{-k}
= \frac{(k+1)(3k+2)}{2} - \frac{k(3k+1)}{2}
= \frac{3k^2 + 5k + 2 - 3k^2 - k}{2}
= 2k + 1 > 0.
$$

So the sequence increases at every step, and the two offsets of a pair are adjacent in it. $\square$
:::

::: math lemma Lemma
For a fixed $i$, the number of generalized pentagonal numbers not exceeding $i$ is $O(\sqrt{i})$.
:::

::: math proof Proof
For $k \ge 1$, the first offset of the pair satisfies

$$
\frac{k(3k-1)}{2} \ge k^2,
$$

because $3k - 1 \ge 2k$ for every $k \ge 1$. So an offset not exceeding $i$ has $k \le \sqrt{i}$. There are at most $\sqrt{i}$ values of $k$, each contributing at most two offsets, so at most $2\sqrt{i}$ terms. $\square$
:::

The tighter count is about $2\sqrt{2i/3}$ terms per row, but the lemma's bound is enough for the complexity analysis and it is simpler to prove.

## Algorithm derivation

The state is a table `p` of length $n + 1$, where `p[i]` will hold $p(i)$ modulo the modulus. The base case is `p[0] = 1`.

The transition for `i` from $1$ to $n$ is:

1. Set `total = 0` and `k = 1`.
2. Compute `first = k(3k - 1) / 2`. If `first > i`, stop, because the sequence of offsets is increasing and every later offset is also too large.
3. Compute `second = k(3k + 1) / 2`.
4. If `k` is odd, add `p[i - first]` to `total`; otherwise subtract it.
5. If `second <= i`, apply the same sign to `p[i - second]`.
6. Increment `k` and continue from step 2.
7. Store `total` in `p[i]`.

The sign rule is worth restating: the pair with index $k$ contributes with sign $(-1)^{k+1}$, which is positive for $k = 1, 3, 5, \ldots$ and negative for $k = 2, 4, 6, \ldots$.

```cpp
const long long modulus = 1000000007LL;
std::vector<int> p(n + 1, 0);
p[0] = 1;

for (long long i = 1; i <= n; ++i) {
    long long total = 0;
    for (long long k = 1;; ++k) {
        const long long first = k * (3 * k - 1) / 2;
        if (first > i) break;
        const long long second = k * (3 * k + 1) / 2;
        if ((k & 1LL) != 0) {
            total += p[i - first];
            if (total >= modulus) total -= modulus;
            if (second <= i) {
                total += p[i - second];
                if (total >= modulus) total -= modulus;
            }
        } else {
            total -= p[i - first];
            if (total < 0) total += modulus;
            if (second <= i) {
                total -= p[i - second];
                if (total < 0) total += modulus;
            }
        }
    }
    p[i] = static_cast<int>(total);
}
```

The modular correction is one conditional add or subtract per term, not a remainder operation. That works because `total` is kept in $[0, M)$ and every table entry is also in $[0, M)$: an addition is below $2M$, and a subtraction is above $-M$. One correction brings the value back into the interval.

The table is filled from the smallest index upward, so every value the transition reads has already been computed. The transition reads only earlier indices, because both offsets are positive.

## Step-by-step execution

The first twelve values, with the offsets that actually fit, show how the signs enter.

| $i$ | Terms that fit                | Arithmetic     | `p[i]` |
| --- | ----------------------------- | -------------- | ------ |
| 1   | $+p(0)$                       | $1$            | 1      |
| 2   | $+p(1)+p(0)$                  | $1+1$          | 2      |
| 3   | $+p(2)+p(1)$                  | $2+1$          | 3      |
| 4   | $+p(3)+p(2)$                  | $3+2$          | 5      |
| 5   | $+p(4)+p(3)-p(0)$             | $5+3-1$        | 7      |
| 6   | $+p(5)+p(4)-p(1)$             | $7+5-1$        | 11     |
| 7   | $+p(6)+p(5)-p(2)-p(0)$        | $11+7-2-1$     | 15     |
| 8   | $+p(7)+p(6)-p(3)-p(1)$        | $15+11-3-1$    | 22     |
| 9   | $+p(8)+p(7)-p(4)-p(2)$        | $22+15-5-2$    | 30     |
| 10  | $+p(9)+p(8)-p(5)-p(3)$        | $30+22-7-3$    | 42     |
| 11  | $+p(10)+p(9)-p(6)-p(4)$       | $42+30-11-5$   | 56     |
| 12  | $+p(11)+p(10)-p(7)-p(5)+p(0)$ | $56+42-15-7+1$ | 77     |

Row $5$ is the first row in which the second offset of a pair does not fit: $g_1(2) = 5$ fits, but $g_{-2} = 7$ does not, so the loop adds the first term and skips the second. Row $12$ is the first row in which a third pair enters, and its sign is positive.

Trace the loop for $i = 5$ in detail.

| Step  | `k` | `first` | `second` | Action                         | `total` |
| ----- | --- | ------- | -------- | ------------------------------ | ------- |
| Start | 1   | 1       | 2        | Add `p[4]` and `p[3]`          | 8       |
| Next  | 2   | 5       | 7        | Subtract `p[0]`, skip `second` | 7       |
| Next  | 3   | 12      | 15       | `first > 5`, stop              | 7       |

The loop performs three iterations, two of which contribute terms, and the result is $7$. The number of iterations is one more than the number of pairs that fit, because the final iteration is the one that discovers the first offset is too large.

## Correctness proof

::: math theorem Theorem
For every $n \ge 0$, the algorithm prints $p(n) \bmod M$, where $M = 1000000007$.
:::

::: math proof Proof
The proof has three parts: the recurrence computes the true partition numbers, the table computes the recurrence, and the modular arithmetic preserves the residue.

**The recurrence is exact.** Euler's theorem gives the series $E(x) = \prod_{i \ge 1}(1-x^i) = \sum_{k \in \mathbb{Z}} (-1)^k x^{g_k}$, where $g_k = k(3k-1)/2$. Since $P(x)E(x) = 1$ and the constant term of $P$ is $p(0) = 1$, the coefficient of $x^n$ in the product is zero for every $n \ge 1$. That coefficient is $\sum_{k} (-1)^k p(n - g_k)$, so

$$
p(n) = \sum_{k \ne 0} (-1)^{k+1} p(n - g_k).
$$

Pairing $k$ with $-k$ gives the displayed recurrence. This is an identity of integers, independent of any algorithm.

**The table computes the recurrence.** The proof is by induction on $i$. The base case is `p[0] = 1 = p(0)`. Suppose `p[j] = p(j)` for every $j < i$. By the increasing-offset lemma, the inner loop visits exactly the pairs with $g_k \le i$, in increasing order of $k$, and stops at the first pair whose first offset exceeds $i$. For each visited pair it adds or subtracts the two entries at $i - g_k$ and $i - g_{-k}$, skipping the second when it exceeds $i$. Those are exactly the terms of the recurrence whose offset is at most $i$. Every other term has a negative index and is zero. So the sum equals $p(i)$.

**The modular arithmetic preserves the residue.** Each `p[j]` is stored as $p(j) \bmod M$. Adding two residues in $[0, M)$ gives a value below $2M$, and one conditional subtraction returns it to $[0, M)$. Subtracting gives a value above $-M$, and one conditional addition returns it to $[0, M)$. So after every term the stored total is congruent to the corresponding partial sum modulo $M$, and after the last term `p[i]` is congruent to $p(i)$ modulo $M$. The final print reads `p[n]`, which is the required residue. $\square$
:::

The induction also covers $n = 0$: the loop from $1$ to $0$ is empty in every language used here, and the program prints `p[0] = 1`.

## Complexity analysis

| Method | Time | Space | Requirement |
| --- | --- | --- | --- |
| Enumerate the partitions | $O(p(n))$ | $O(n)$ | Never finishes for large $n$ |
| Coin-change dynamic program | $O(n^2)$ | $O(n)$ | $n$ small enough for $10^{10}$ updates |
| Pentagonal recurrence | $O(n \sqrt{n})$ | $O(n)$ | The modulus fits the integer type |
| Memoized recurrence | $O(n \sqrt{n})$ | $O(n)$ plus $O(n)$ stack | The stack holds $n$ frames |
| Inverse of the generating function | $O(n \log n)$ | $O(n)$ | A number-theoretic transform and a suitable modulus |

**Time.** For a fixed $i$, the inner loop runs once for each pair whose first offset is at most $i$, plus one final iteration. By the lemma there are at most $2\sqrt{i}$ contributing terms, so the inner loop is $O(\sqrt{i})$. Summing over $i = 1, \ldots, n$ gives $O(n \sqrt{n})$.

The constant is small. The exact number of contributing terms is about

$$
\sum_{i=1}^{n} 2\sqrt{\frac{2i}{3}}
\approx \frac{4}{3}\sqrt{\frac{2}{3}}\, n^{3/2}
\approx 1.09\, n^{3/2}.
$$

At $n = 10^5$ that is about $3.4 \times 10^7$ term visits. At $n = 10^6$ it is about $1.1 \times 10^9$, which is the point where the $O(n \log n)$ method becomes worth the extra code.

**Space.** The table has $n + 1$ entries of 32 bits each, so it needs about $400$ KB at $n = 10^5$ and about $4$ MB at $n = 10^6$. No other array is needed; the offsets and the loop counters are a constant number of machine words.

**Why the enumeration row is not a fallback.** The enumeration cost is the answer itself. A program that enumerates partitions cannot be rescued by a faster machine, because the number of objects grows exponentially in $\sqrt{n}$. The dynamic program and the recurrence are both polynomial, and the recurrence is the smaller polynomial.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One value $p(n)$ with $n \le 10^5$ | The pentagonal recurrence |
| Every value $p(0), \ldots, p(N)$ | The same pass, storing all of them |
| $n \le 5000$ and the simplest possible code | The $O(n^2)$ coin-change dynamic program |
| The allowed parts are an arbitrary given set | A coin-change dynamic program over that set |
| The order of the parts matters | Compositions, counted by $2^{n-1}$ |
| The parts must be distinct | A $0/1$ dynamic program over the parts |
| Exactly $k$ parts | A dynamic program over the number of parts, or a Gaussian binomial coefficient |
| $n$ up to $10^6$ with a strict time limit | The inverse of the generating function with a number-theoretic transform |
| The exact value is needed and it is enormous | Big integers with the same recurrence, or an asymptotic estimate if an approximation is acceptable |
| The modulus is composite | The recurrence, because it uses no division |
| Several queries with different $n$ | Precompute once up to the largest query |

The rows that are easy to confuse are the partition rows and the composition row. "Split $n$ identical items into piles" ignores order, so it is a partition. "Arrange $n$ distinct items in a sequence" counts order, so it is a permutation or a composition, and no partition table helps. A statement that says "the order of the parts matters" is the one to read twice.

The restricted-parts row is the other common confusion. If the statement allows only the parts $1, 3, 4$, then the answer is the coefficient of $x^n$ in $\frac{1}{(1-x)(1-x^3)(1-x^4)}$, and the pentagonal recurrence does not apply, because Euler's theorem is about the product over all positive integers. Use the coin-change dynamic program instead. The generating-function article develops that view in [generating functions](/algorithms/combinatorics/generating-functions).

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read one integer $n$.
2. Print $p(n)$ modulo $1000000007$ on one line.

The value $n = 0$ is valid and prints $1$. The input is a single token, so a line break after it is optional. All six variants produce the same output on the shared fixtures, and the comparison normalizes the platform line ending.

The variants differ only in how they store the table and the running total:

- The C variant uses a `calloc` array of `int` and a `long long` total. The offset products use `long long` because `k(3k - 1)` is formed before the division.
- The C++ variant uses `std::vector<int>` and a `long long` total, with the stream untied because there is no interleaved input and output.
- The Java variant uses an `int` array and a `long` total. A sum of two residues can exceed the `int` range even though the stored residue cannot.
- The Python variant reads the whole input once and uses a list of arbitrary-precision integers.
- The Pascal variant uses a dynamic array of `LongInt`. It gives every `Read` exactly one argument, uses no `IOResult`, and includes `SysUtils`, which keeps it inside the subset that compiles under pas2js.
- The JavaScript variant uses an `Int32Array`, which holds every residue because the modulus is below $2^{31}$, and a `Number` total, whose intermediate sums are exact.

The manifest publishes only the `program` variant. There is no reusable `minimal` variant because the technique is a single loop over a table: a class or a function would have to expose the table, the modulus, and the loop bound, and the caller would still write the same loop. The program is the smallest complete statement of the method.

## Recursion decision

The recurrence is recursive in appearance: $p(n)$ is written in terms of earlier values. A memoized recursive version is therefore tempting.

```python
def partitions(n, memo):
    if n < 0:
        return 0
    if n == 0:
        return 1
    if n in memo:
        return memo[n]
    total = 0
    k = 1
    while True:
        first = k * (3 * k - 1) // 2
        if first > n:
            break
        second = k * (3 * k + 1) // 2
        sign = 1 if k & 1 else -1
        total += sign * partitions(n - first, memo)
        if second <= n:
            total += sign * partitions(n - second, memo)
        k += 1
    memo[n] = total % MODULUS
    return memo[n]
```

This computes the same values, but it has two problems. The first is the stack. The chain $n \to n-1 \to n-2 \to \cdots$ has depth $n$, so a Python program hits the interpreter limit of 1000 frames at $n = 1000$. The second is that the memoized recursion still fills the same table, so it saves no work; it only moves the table from an array to a dictionary and adds call overhead.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | About 8 MB of stack | About $10^5$ frames | The loop; recursion at $n = 10^5$ is unsafe |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

The iterative version also handles the negative indices naturally. The recursive version needs the `n < 0` base case, and the iterative version gets the same effect from the loop bound `first > i`, which stops before any negative index is read.

## Implementation walkthrough

Four details decide whether the program is correct.

**The two offsets of a pair share a sign.** The pair with index $k$ contributes at $g_k = k(3k-1)/2$ and $g_{-k} = k(3k+1)/2$, and both terms use $(-1)^{k+1}$. The sign is positive for odd $k$ and negative for even $k$. Computing the sign once per pair and applying it to both offsets is the simplest way to keep the two terms consistent.

**Test the first offset, then the second separately.** The loop stops when `first > i`, because the offsets are increasing. It must not stop when `second > i`, because the first offset may still fit. At $i = 5$, `first = 5` and `second = 7`; the loop adds `p[0]` and skips the second term. A loop that tests `second` before adding `first` loses the term at $i = 5$ and reports $4$ instead of $7$.

**Form the product before dividing.** The offset is $k(3k-1)/2$, and the product must be computed in a type wide enough to hold it. With a 32-bit `int`, the product overflows once $k$ is about $2.7 \times 10^4$, which corresponds to $n$ around $10^9$; the table cannot be that large, but the multiplication is still worth writing in 64 bits. In C, C++, and Java the code uses `long long` or `long`. In Pascal the stated input range keeps `LongInt` safe. Python and JavaScript need no special type because their numbers are wide enough for these products.

**Keep the total reduced after every term.** The total stays in $[0, M)$. An addition of a residue is below $2M$, so one conditional subtraction restores the range. A subtraction is above $-M$, so one conditional addition restores it. Reducing only at the end of the inner loop is also correct in a 64-bit type, because the sum of $O(\sqrt{n})$ residues is far below $2^{63}$ for the stated bounds, but the per-term correction is cheaper and it removes the question entirely.

A compact Python core is:

```python
p = [0] * (n + 1)
p[0] = 1
for i in range(1, n + 1):
    total = 0
    k = 1
    while True:
        first = k * (3 * k - 1) // 2
        if first > i:
            break
        second = k * (3 * k + 1) // 2
        sign = 1 if k & 1 else -1
        total += sign * p[i - first]
        if second <= i:
            total += sign * p[i - second]
        k += 1
    p[i] = total % MODULUS
```

This version reduces once per row with `%`, which is fine in Python because the intermediate is a small multiple of the modulus. The C, C++, Java, Pascal, and JavaScript variants use the conditional correction instead, because a remainder operation is slower there and the conditional form states the invariant.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting `p[0] = 1` | Every entry stays zero | Set the base case before the loop |
| Using the sign $(-1)^k$ instead of $(-1)^{k+1}$ | The first pair is subtracted, and $p(2)$ becomes $0$ | Positive for odd $k$, negative for even $k$ |
| Adding only the first offset of each pair | $p(2)$ becomes $1$ instead of $2$ | Apply both offsets, with the same sign |
| Breaking when `second > i` before adding `first` | $p(5)$ becomes $4$ instead of $7$ | Test `first` first, then test `second` |
| Using a 32-bit product for $k(3k-1)$ | The offset is wrong for large $k$ | Multiply in 64 bits before dividing |
| Reducing only at the very end in a 32-bit type | The running sum overflows | Keep the total reduced after each term |
| Counting compositions | The answer is $2^{n-1}$, not $p(n)$ | Decide whether order matters before writing code |
| Forgetting the `at least two parts` condition | The answer is one too large | Subtract the one-part partition |
| Using the wrong modulus for a divisibility question | The zero residue never appears at the right $n$ | Use the divisor named by the problem |
| Recomputing the table for every query | The cost is multiplied by the number of queries | Precompute once to the largest query |

### Why this fails: the missing second offset

The plausible wrong approach is to read the sequence $1, 2, 5, 7, 12, 15, \ldots$ as one offset per index and to write a recurrence with a single term per $k$. The sequence looks like a list of pairs, but a programr who is moving quickly may treat it as a list of individual offsets and use only $k(3k-1)/2$.

The smallest counterexample is $n = 2$. The correct recurrence is

$$
p(2) = p(1) + p(0) = 1 + 1 = 2,
$$

because the two partitions of $2$ are $2$ and $1+1$. The one-offset version computes $p(2) = p(1) = 1$, which misses the partition $1+1$. At $n = 5$ the same bug reports $p(4) - p(0) = 5 - 1 = 4$ instead of $7$, and the error has already spread to every later value.

The sign is the second-smallest way to break the recurrence. Using $(-1)^k$ instead of $(-1)^{k+1}$ gives

$$
p(2) = p(1) - p(0) = 1 - 1 = 0,
$$

so the whole table is wrong from the first nontrivial row. The correct sign is positive for the first pair, and the first pair contains the offsets $1$ and $2$.

A third failure is specific to the divisibility problem. Project Euler 78 asks for the least $n$ with $p(n)$ divisible by $1000000$. Computing modulo $10^9 + 7$ instead produces a valid residue of $p(n)$, but it says nothing about divisibility by $10^6$, and the search never stops at the correct $n$. The modulus must match the question.

## Variants and extensions

- **Coin change with arbitrary denominations.** Replace the product over all positive integers with the product over the allowed set. The dynamic program costs $O(n \cdot |S|)$ and is the right tool when the parts are restricted.
- **Distinct parts.** The generating function is $\prod_{i \ge 1}(1+x^i)$, and the count equals the number of partitions into odd parts. The pentagonal recurrence does not apply directly, because the reciprocal of this product is not sparse in the same way.
- **Exactly $k$ parts.** The generating function is $\frac{x^k}{(1-x)(1-x^2)\cdots(1-x^k)}$, and the count is a Gaussian binomial coefficient. A dynamic program over the number of parts is the usual contest solution.
- **Largest part at most $k$.** By conjugating the Ferrers diagram, this is the same as at most $k$ parts. The conjugation is the bijection that swaps rows and columns.
- **Inverse of the generating function.** The coefficient list of $1/\prod(1-x^i)$ can be computed by a formal power series inverse with a number-theoretic transform in $O(n \log n)$. This is the method for $n$ near $10^6$ and the reason the $O(n \sqrt{n})$ recurrence is not the final word.
- **The Hardy-Ramanujan asymptotic.** $p(n) \sim \frac{1}{4n\sqrt{3}}\exp\left(\pi\sqrt{2n/3}\right)$, which explains the exponential growth and gives a fast estimate, though not an exact count.
- **Ramanujan's congruences.** $p(5k+4) \equiv 0 \pmod{5}$, $p(7k+5) \equiv 0 \pmod{7}$, and $p(11k+6) \equiv 0 \pmod{11}$. They are a different family of results and do not replace the recurrence.
- **Plane partitions.** A plane partition is a two-dimensional array with non-increasing rows and columns, counted by a product formula rather than by this recurrence. The Ferrers diagram becomes a stack of diagrams.
- **Signed partitions and $q$-series.** Euler's theorem is the first identity in the theory of $q$-series, and the same product appears in the study of modular forms.
- **Several queries.** Build the table once up to the largest query and answer each one in constant time. The recurrence is a preprocessing algorithm as much as a single-value algorithm.

## Contest strategy

1. Decide whether the order of the parts matters. If it does, the answer is a composition count, and the partition recurrence is the wrong tool.
2. Decide whether the parts are all positive integers or a restricted set. The pentagonal recurrence applies only to the unrestricted product.
3. Read the modulus. The recurrence works modulo any integer, so a composite modulus is not a problem; a divisibility question should use its own divisor as the modulus.
4. Build the table from $p(0) = 1$ upward. If there are several queries, read them all first and precompute to the largest one.
5. Handle the wording. "At least two parts" subtracts the one-part partition, and "at least one part" is the full count.
6. Form the offsets in a wide enough type. Multiply before dividing, and use 64-bit arithmetic in C, C++, and Java.
7. Test against the $O(n^2)$ dynamic program for every $n \le 200$. The two methods share no code, so a disagreement localizes the bug immediately.

## Worked problems

### Problem 1: Ignatius and the Princess III

**Restatement.** Given several test cases, each a positive integer $n \le 120$, report the number of equations $n = a_1 + a_2 + \cdots + a_m$ with positive parts, where two equations that differ only in the order of the parts are the same. The input ends at end of file.

**Naive baseline.** Enumerate the non-increasing partitions of each $n$. At $n = 120$ the count is $1844349560$, so the enumeration is far too large.

**Insight.** The answer is $p(n)$, and the pentagonal recurrence fills the table from $1$ to the largest query in one pass.

**Derivation.** Read every query and record the maximum. Build `p[0..maximum]` with the recurrence. Answer each query by reading the table.

**Correctness.** The recurrence computes the true partition numbers by the theorem, and the lookup returns the value for the queried $n$. The non-increasing convention in the restatement is exactly the definition of a partition.

**Complexity.** $O(N \sqrt{N})$ time and $O(N)$ space for $N \le 120$, plus $O(1)$ per query. The exact counts fit in a signed 64-bit integer; the largest, $p(120) = 1844349560$, also fits in a signed 32-bit integer, but $p(122) = 2291320912$ does not, so a 64-bit counter is the safe choice.

**Common wrong approach.** Counting compositions. The number of compositions of $n$ is $2^{n-1}$, which is $2^{119}$ at $n = 120$, and it has nothing to do with the requested count.

### Problem 2: Counting Summations

**Restatement.** How many different ways can one hundred be written as a sum of at least two positive integers?

**Naive baseline.** Enumerate the partitions of $100$ and discard the one-part partition. There are $p(100) = 190569292$ partitions, so the enumeration is already at the edge of feasibility and is unnecessary.

**Insight.** The answer is $p(100) - 1$, because the only partition with fewer than two parts is the single part $100$.

**Derivation.** Fill the table to $100$ with the pentagonal recurrence and subtract one from the final entry. No modular reduction is needed, because the answer is below $2^{31}$.

**Correctness.** $p(100)$ counts every partition, and the single part $100$ is the unique partition of $100$ with one part. Removing it leaves exactly the sums of at least two positive integers.

**Complexity.** $O(100 \sqrt{100})$ time and $O(100)$ space, which is a few thousand term visits.

**Common wrong approach.** Reporting $p(100) = 190569292$ without subtracting the one-part partition. The statement says "at least two", and the difference is exactly one.

### Problem 3: Coin Partitions

**Restatement.** Let $p(n)$ be the number of ways to separate $n$ coins into piles. Find the least $n$ for which $p(n)$ is divisible by one million.

**Naive baseline.** Compute the exact values with big integers and test each one for divisibility. The exact value at the answer has more than $250$ decimal digits, and the big-integer arithmetic makes the scan much slower than it needs to be.

**Insight.** Divisibility by $1000000$ depends only on the residue modulo $1000000$. The recurrence uses only addition and subtraction, so it can be evaluated modulo $1000000$ from the start.

**Derivation.** Set the modulus to $1000000$. Compute $p(1), p(2), \ldots$ in order with the pentagonal recurrence and stop at the first index whose residue is zero. The answer is $55374$.

**Correctness.** For every $n$, the stored value is congruent to $p(n)$ modulo $1000000$, so it is zero exactly when $p(n)$ is divisible by $1000000$. The scan tests the indices in increasing order, so the first zero is the least such $n$.

**Complexity.** $O(N \sqrt{N})$ time and $O(N)$ space with $N = 55374$, which is about $2.5 \times 10^7$ term visits. The exact big-integer version needs hundreds of digits per entry and is far slower.

**Common wrong approach.** Using $10^9 + 7$ as the modulus because that is the modulus of the previous problem. A residue modulo $10^9 + 7$ carries no information about divisibility by $10^6$, and the search will not stop at $55374$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the order of the parts matters, whether the parts are unrestricted, and whether the answer is exact or reduced.
2. **Direct application.** Implement the $O(n^2)$ coin-change dynamic program and the pentagonal recurrence, and check that they agree for every $n \le 200$.
3. **Adaptation.** Add the "at least two parts" condition, change the modulus to $10^6$, and compute the least $n$ with a zero residue.
4. **Combination.** Precompute one table for many queries, then use the same table to answer a range of values and a single large value.
5. **Challenge.** Replace the recurrence with the inverse of the generating function and a number-theoretic transform, and check the $O(n \log n)$ values against the recurrence for $n \le 5000$.
6. **Transfer.** Recognize the same product in restricted coin change, in distinct-part partitions, and in the Gaussian binomial coefficients that count partitions with a fixed number of parts. Where the count must be reduced, use [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is a partition, and why is $5 = 3 + 2$ the same partition as $5 = 2 + 3$? (Formal model)
2. Write the generating function of $p(n)$ and explain where each factor comes from. (Key insight)
3. State Euler's pentagonal number theorem and list the first six exponents with their signs. (Formal model)
4. Derive the recurrence from the product $P(x)E(x) = 1$. (Formal model)
5. Why does the recurrence need only $O(\sqrt{n})$ terms per value? (Formal model)
6. Trace the computation of $p(10)$ and say which offsets fit. (Step-by-step execution)
7. What is the smallest $n$ at which dropping the second offset of a pair gives a wrong answer, and what does it report? (Common mistakes)
8. Why must the loop test the first offset before the second? (Implementation walkthrough)
9. Why does the recurrence work modulo a composite number, while the modular binomial coefficient does not? (Recognition patterns)
10. What changes when the problem asks for divisibility by $10^6$ rather than a count modulo $10^9 + 7$? (Worked problems)

## Further reading

- The formal power series that turns the counting argument into the recurrence is [generating functions](/algorithms/combinatorics/generating-functions), which develops coefficient extraction and the product over parts.
- The dynamic program that counts the configurations directly is [counting dynamic programming](/algorithms/combinatorics/counting-dp), and its coin-change pattern is the reference implementation for this technique.
- The counting argument that chooses a subset is [binomial coefficients](/algorithms/combinatorics/binomial-coefficients), which is the other half of elementary enumerative combinatorics.
- The bijection that distributes identical items into distinct boxes is [stars and bars](/algorithms/combinatorics/stars-and-bars); it counts compositions of a total, which is the ordered cousin of a partition.
- The dynamic program over a set of items with a total weight is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack), and the restricted-part variant is the same table without the item limit.
- The arithmetic that reduces a count modulo a prime, and the inverse that the faster method needs, is [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The convolution that computes the inverse of the generating function is the [number-theoretic transform](/algorithms/number-theory/ntt), which is the $O(n \log n)$ extension of this technique.
- The subject index lists this technique, [integer partitions](/algorithms/combinatorics/integer-partitions), beside the other counting methods in [the combinatorics](/algorithms/combinatorics/).
- The discrete mathematics behind the product and the involution is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The cost model that separates the $O(n^2)$ dynamic program from the $O(n \sqrt{n})$ recurrence is in [complexity](/algorithms/foundations/complexity).
