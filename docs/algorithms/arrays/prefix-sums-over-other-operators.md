---
id: arrays.prefix-sums-over-other-operators
title: Prefix sums over other operators
summary: Keep the running fold of an associative operation, count the values that have no inverse, and answer every range query with one combination and one inverse step.
division: [silver, gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords:
    [
        prefix product,
        prefix xor,
        range product,
        zero count,
        modular inverse,
        prefix fold,
        associative operation,
    ]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [number-theory.modular-arithmetic]
complexity:
    time: "O(n + q)"
    space: "O(n)"
assumptions:
    - The array is static, so the prefix tables are built once before the queries.
    - The operation is associative and has an identity element.
    - Non-invertible values are counted separately, as zeros are for multiplication modulo a prime.
implementations: arrays.prefix-sums-over-other-operators
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/arrays.prefix-sums-over-other-operators.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

Prefix sums are usually introduced as a way to answer range sums, but addition is not the property that makes them work. What makes them work is that the array is static, the operation is associative, and the operation can be undone. Replace addition by multiplication modulo a prime and the same construction answers range products. Replace addition by XOR and the same construction answers range XOR.

In the general form, let $\odot$ be an associative operation with identity $e$, and let $P[i] = a_1 \odot a_2 \odot \cdots \odot a_i$. When every value has an inverse, the fold of a range is one inverse and one combination:

$$
a_l \odot a_{l+1} \odot \cdots \odot a_r \;=\; P[l-1]^{-1} \odot P[r].
$$

For multiplication modulo $M = 1{,}000{,}000{,}007$, the inverse is supplied by Fermat's little theorem, so a prefix product table and its inverse table answer every query. The one value that has no inverse is zero, and a single zero makes an entire range product zero. The fix is not to divide at all in that case: count the zeros in a prefix table, check the count for the query, and keep the prefix product of the nonzero values with each zero replaced by the identity $1$.

The result costs $O(n)$ preprocessing, $O(1)$ per query, and $O(n)$ memory for the prefix product, the inverse prefix product, and the zero count. It is the same trade as ordinary prefix sums, extended to any operation whose inverse exists, with an extra counter for the values whose inverse does not.

## Problem motivation

A warehouse stores $n$ batches of material. Each batch has a weight, recorded modulo $M = 1{,}000{,}000{,}007$, and an auditor asks $q$ questions of the form "what is the product of the recorded weights of batches $l$ through $r$?". A batch that failed inspection is recorded as a zero, and any range that includes it has product zero.

The constraints:

- $1 \le n \le 200{,}000$ batches.
- $1 \le q \le 200{,}000$ questions.
- Every recorded weight is given as an integer and reduced modulo $M$, so a value lies in $[0, M-1]$ after reading.
- A failed batch is a zero, and it is the only value with no multiplicative inverse.

The naive answer multiplies the values in the range for every question, at a cost of $O(r-l+1)$ per question and $O(nq) = 4 \ast 10^{10}$ multiplications over the whole run. That is too slow, and it repeats work: consecutive audits usually cover overlapping ranges, and the product of the overlap is recomputed each time.

The multiplication case exposes a difference from addition that the sum version hides. The sum of a range is the difference of two prefix sums, but the product of a range is the quotient of two prefix products. A quotient needs a division, a division needs an inverse, and zero has no inverse. The technique therefore has two parts: the prefix fold, which is the same for every associative operation, and the treatment of the values that cannot be divided out.

## Recognition patterns

Prefix folds are the right tool when all of the following hold.

- The array is **static**: no value changes between the preprocessing and the queries.
- There are **many** queries, and each query is about a **contiguous range**.
- The queried quantity is a **fold**: an associative operation applied to every value in the range.
- Every value has an inverse under the operation, or the values without one can be **counted** cheaply.

The operation decides both the identity and the inverse, and the inverse decides whether a query is a subtraction, a quotient, or something else.

| Operation | Identity | Inverse of a value | What breaks it | Usual structure |
| --- | --- | --- | --- | --- |
| Addition modulo $M$ | $0$ | $-a$ | Nothing | Prefix sums |
| Bitwise XOR | $0$ | $a$ itself | Nothing | Prefix XOR |
| Multiplication modulo prime | $1$ | $a^{M-2}$ | Zero | Prefix product and zero count |
| Multiplication modulo composite | $1$ | Only the units | Shared factors with $M$ | Block decomposition or factor counts |
| Function composition | Identity map | Inverse function | Non-bijective functions | Segment tree |
| GCD | $0$ | None | Every value | Sparse table |
| Maximum | $-\infty$ | None | Every value | Sparse table |

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $q = 1$ | A single scan costs $O(n)$, the same as preprocessing |
| $q \ge n$ | Prefixing is clearly worth it |
| Values change between queries | Rules out a static prefix table; use a Fenwick tree |
| The operation has no inverse | Rules out a quotient; use a sparse table or segment tree |
| The query asks for a maximum or a minimum | Rules out a prefix fold; extrema do not subtract |
| The operation is associative but not commutative | The order of the inverse matters; put it on the left |

The phrases in a statement that signal this technique are "the array does not change", "for each query", "the product of the elements from $l$ to $r$", and "modulo $10^9 + 7$". The phrase that rules it out is "after each operation" or "the value at position $i$ is updated".

<Synonyms terms="prefix products, prefix XOR, prefix folds, cumulative product, running product, prefix aggregation" />

## Naive approach

The baseline multiplies the range for every query.

```python
for l, r in queries:
    total = 1
    for i in range(l - 1, r):
        total = total * a[i] % MOD
    print(total)
```

This is $O(nq)$ and it is the reference implementation for the differential test. If a faster version disagrees with it on a random input, one of the two is wrong.

The first attempt at a faster version is the direct translation of the prefix-sum formula:

```python
prefix = [1]
for value in a:
    prefix.append(prefix[-1] * value % MOD)

for l, r in queries:
    print(prefix[r] * pow(prefix[l - 1], MOD - 2, MOD) % MOD)
```

This is correct as long as no prefix product is zero, and it is wrong as soon as one is. The inverse of zero does not exist, and `pow(0, MOD - 2, MOD)` returns $0$, so the program prints $0$ for ranges whose true product is nonzero. The zero count is not an optimization; it is the part that makes the division valid.

## Key insight

The insight is that a range fold is a quotient of two prefix folds, and a zero is the one obstruction to the quotient.

Write the array as a sequence of group elements. The prefix fold $P[i]$ is the fold of the first $i$ values, and the whole array up to $r$ is the fold up to $l-1$ followed by the range:

$$
P[r] \;=\; P[l-1] \odot a_l \odot a_{l+1} \odot \cdots \odot a_r.
$$

Applying $P[l-1]^{-1}$ on the left isolates the range:

$$
P[l-1]^{-1} \odot P[r] \;=\; a_l \odot a_{l+1} \odot \cdots \odot a_r.
$$

For a commutative operation the inverse can also be applied on the right, which is the form people usually write for multiplication. The left form is the one that survives when the operation is not commutative, such as matrix multiplication or function composition.

For multiplication modulo a prime, the inverse is computed by Fermat's little theorem:

$$
a^{-1} \equiv a^{M-2} \pmod M \qquad \text{for } 1 \le a \le M-1.
$$

The only residue without an inverse is $0$. So define the shadow value

$$
\hat{a}_i \;=\; \begin{cases} 1 & a_i \equiv 0 \pmod M, \\ a_i \bmod M & \text{otherwise}, \end{cases}
$$

and build two prefix arrays:

$$
Q[i] \;=\; \prod_{j=1}^{i} \hat{a}_j \bmod M,
\qquad
Z[i] \;=\; \sum_{j=1}^{i} [a_j \equiv 0 \pmod M].
$$

Then the answer to a query is

$$
R(l, r) \;=\; \begin{cases} 0 & Z[r] - Z[l-1] > 0, \\ Q[r] \ast Q[l-1]^{-1} \bmod M & \text{otherwise.} \end{cases}
$$

The shadow product never becomes zero, because every factor lies in $[1, M-1]$ and $M$ is prime. That is what makes $Q[l-1]^{-1}$ exist even when the original prefix product was zero.

Computing $Q[l-1]^{-1}$ separately for every query with an exponentiation would cost $O(q \log M)$. The inverse prefix table removes even that factor. Compute one inverse, then walk backward:

$$
I[n] \;=\; Q[n]^{M-2} \bmod M,
\qquad
I[i-1] \;=\; I[i] \ast \hat{a}_i \bmod M.
$$

Now $I[i] = Q[i]^{-1}$ for every $i$, and each query is one multiplication.

## Visual intuition

Draw the prefix products as bars above the array, one bar at each index from $0$ to $n$. The height of the bar at $i$ is $Q[i]$, plotted on a multiplicative scale so that the product of a range is the ratio of two bar heights rather than a difference. A range from $l$ to $r$ is the factor by which the bar grows between $l-1$ and $r$.

Ordinary prefix sums draw the bars on a linear scale and the range is the vertical distance between two of them. Multiplication replaces the distance by a ratio, and the inverse replaces the negative sign by a reciprocal. The picture is the same picture; only the group operation changes.

A zero is special because it collapses the true product of every range that crosses it. The shadow value keeps the bars moving as if the zero were a one, and a second strip below the bars marks the positions where a zero occurred. A query is answered from the bars only when the strip shows no mark between $l-1$ and $r$; otherwise the answer is zero. Keeping the strip separate is what allows the bars to remain invertible.

The bars are not sorted and are not monotone, because multiplication can move them up and down and a modular product can wrap around. No binary search is performed on them. The query is two array lookups and one multiplication, exactly as it is for sums.

## Formal model

Let $M = 1{,}000{,}000{,}007$. For $1 \le i \le n$, let $b_i$ be the residue of $a_i$ modulo $M$ in the interval $[0, M-1]$.

::: math definition Definition
The **shadow value** of $b_i$ is

$$
\hat{b}_i \;=\; \begin{cases} 1 & b_i = 0, \\ b_i & b_i \ne 0. \end{cases}
$$

The **prefix product** is $Q[0] = 1$ and $Q[i] = Q[i-1] \ast \hat{b}_i \bmod M$ for $1 \le i \le n$. The **prefix zero count** is $Z[0] = 0$ and $Z[i] = Z[i-1] + [b_i = 0]$.
:::

::: math definition Definition
The **inverse prefix product** is $I[i] = Q[i]^{-1} \bmod M$. The array $I$ has $n+1$ entries, and $I[0] = 1$.
:::

::: math lemma Lemma
For every $1 \le l \le r \le n$ with $Z[r] = Z[l-1]$, the product of the range satisfies

$$
\prod_{i=l}^{r} b_i \;\equiv\; Q[r] \ast I[l-1] \pmod M.
$$

When $Z[r] > Z[l-1]$, the product is $0$ modulo $M$.
:::

::: math recurrence Recurrence
The two forward tables are built by

$$
Q[0] = 1, \qquad Q[i] = Q[i-1] \ast \hat{b}_i \bmod M,
$$

$$
Z[0] = 0, \qquad Z[i] = Z[i-1] + [b_i = 0].
$$

The inverse table is built backward from a single exponentiation:

$$
I[n] = Q[n]^{M-2} \bmod M, \qquad I[i-1] = I[i] \ast \hat{b}_i \bmod M.
$$
:::

::: math invariant Invariant
After the forward loop has processed index $i$, the entry $Q[i]$ is the product of the shadow values of the first $i$ elements, and $Z[i]$ is the number of zeros among the first $i$ elements.
:::

## Algorithm derivation

The state is four arrays of $n+1$ entries: the reduced values $b$, the prefix product $Q$, the inverse prefix product $I$, and the zero count $Z$. The value array is needed only to build $I$ backward, because the backward recurrence multiplies by the shadow value of each element.

The forward update is a fold. Before the loop, $Q[0] = 1$ is the empty product and $Z[0] = 0$ is the empty count. For each element, replace a zero by $1$, multiply it into $Q$, and increment $Z$ when the element is zero. By induction, $Q[i]$ is the product of the shadow values of the first $i$ elements and $Z[i]$ is their zero count.

The inverse table is built backward. Fermat's little theorem gives $I[n] = Q[n]^{M-2}$. If $I[i]$ is the inverse of $Q[i]$, then

$$
I[i-1] \;=\; I[i] \ast \hat{b}_i
\;=\; (Q[i-1] \ast \hat{b}_i)^{-1} \ast \hat{b}_i
\;=\; Q[i-1]^{-1},
$$

because the factors commute in a product of integers modulo $M$. The induction walks from $n$ down to $1$ and fills every entry after one exponentiation.

The query rule has two cases. If $Z[r] - Z[l-1]$ is positive, the range contains a zero and its product is $0$ modulo $M$. Otherwise every element of the range is nonzero, its shadow value equals its residue, and the range product is the quotient of the two prefix products. The quotient is computed as $Q[r] \ast I[l-1] \bmod M$, with both factors already reduced.

The indexing convention is the same as for prefix sums. The prefix array has $n+1$ entries because $Q[0] = 1$ is the product of the empty prefix, and a query on $[l, r]$ combines the entries at $r$ and $l-1$. The array is one-based in the problem and the prefix array is indexed from zero, with $Q[i]$ meaning "the first $i$ values".

A pseudocode summary of the whole program:

```text
read n and the n values, reducing each modulo M
for i in 1..n:
    shadow = 1 if value[i] == 0 else value[i]
    Q[i] = Q[i-1] * shadow % M
    Z[i] = Z[i-1] + (value[i] == 0)
I[n] = power(Q[n], M - 2, M)
for i in n down to 1:
    shadow = 1 if value[i] == 0 else value[i]
    I[i-1] = I[i] * shadow % M
for each query (l, r):
    if Z[r] - Z[l-1] > 0: print 0
    else: print Q[r] * I[l-1] % M
```

## Step-by-step execution

Take the array $a = [3, 0, 4, 5, 0, 2]$ with $M = 1{,}000{,}000{,}007$. The reduced values are the same, and the shadow values are $[3, 1, 4, 5, 1, 2]$.

1. $Q[0] = 1$, $Z[0] = 0$.
2. $i = 1$: $b_1 = 3$, so $Q[1] = 3$ and $Z[1] = 0$.
3. $i = 2$: $b_2 = 0$, so $Q[2] = 3$ and $Z[2] = 1$.
4. $i = 3$: $b_3 = 4$, so $Q[3] = 12$ and $Z[3] = 1$.
5. $i = 4$: $b_4 = 5$, so $Q[4] = 60$ and $Z[4] = 1$.
6. $i = 5$: $b_5 = 0$, so $Q[5] = 60$ and $Z[5] = 2$.
7. $i = 6$: $b_6 = 2$, so $Q[6] = 120$ and $Z[6] = 2$.

The inverse table starts at $I[6] = 120^{M-2} \bmod M = 808{,}333{,}339$, and the backward pass gives the following table.

| $i$ | $b_i$ | $\hat{b}_i$ | $Q[i]$ | $Z[i]$ | $I[i]$      |
| --- | ----- | ----------- | ------ | ------ | ----------- |
| $0$ |       |             | $1$    | $0$    | $1$         |
| $1$ | $3$   | $3$         | $3$    | $0$    | $333333336$ |
| $2$ | $0$   | $1$         | $3$    | $1$    | $333333336$ |
| $3$ | $4$   | $4$         | $12$   | $1$    | $83333334$  |
| $4$ | $5$   | $5$         | $60$   | $1$    | $616666671$ |
| $5$ | $0$   | $1$         | $60$   | $2$    | $616666671$ |
| $6$ | $2$   | $2$         | $120$  | $2$    | $808333339$ |

The entries of $I$ are the inverses of the entries of $Q$. For example, $3 \ast 333{,}333{,}336 = 1{,}000{,}000{,}008 \equiv 1 \pmod M$, and $120 \ast 808{,}333{,}339 = 97{,}000{,}000{,}680 \equiv 1 \pmod M$.

Now the queries.

- The range $[1, 6]$ contains two zeros, so the answer is $0$.
- The range $[3, 4]$ contains no zero. $Q[4] \ast I[2] = 60 \ast 333{,}333{,}336 \equiv 20 \pmod M$, which is $4 \ast 5$.
- The range $[1, 1]$ is $Q[1] \ast I[0] = 3 \ast 1 = 3$.
- The range $[2, 5]$ contains two zeros, so the answer is $0$.
- The range $[6, 6]$ is $Q[6] \ast I[5] = 120 \ast 616{,}666{,}671 \equiv 2 \pmod M$.
- The range $[4, 4]$ is $Q[4] \ast I[3] = 60 \ast 83{,}333{,}334 \equiv 5 \pmod M$, which is the value at position four; the prefix before it is nonzero after shadowing.

Notice that $Q[5]$ and $Q[6]$ are not zero even though $a_2$ and $a_5$ are zero. The range $[2, 5]$ shows why the zero test is separate: its zero count is two, so the answer comes from the zero test rather than from the product table. That separation is the whole reason the quotient is safe.

## Correctness proof

::: math theorem Theorem
For every query $(l, r)$ with $1 \le l \le r \le n$, the program prints the product $b_l \ast b_{l+1} \ast \cdots \ast b_r$ modulo $M$.
:::

::: math proof Proof
First the forward table. Before the loop, $Q[0] = 1$ is the empty product and $Z[0] = 0$ is the empty count. Suppose $Q[i-1]$ is the product of the shadow values of the first $i-1$ elements and $Z[i-1]$ counts the zeros among them. The update multiplies $Q[i-1]$ by $\hat{b}_i$ and adds one to $Z[i-1]$ exactly when $b_i = 0$. That gives the product of the first $i$ shadow values and the zero count of the first $i$ elements. By induction, the claim holds for every $i$, including $i = n$.

Now the query. If the range contains a zero, one of its factors is $0$, so the product is $0$ modulo $M$, which is what the program prints.

If the range contains no zero, every element in it has an invertible residue, and the telescoping identity gives

$$
Q[r] \ast Q[l-1]^{-1}
\;\equiv\;
\Bigl(\prod_{j=1}^{r} \hat{b}_j\Bigr) \ast \Bigl(\prod_{j=1}^{l-1} \hat{b}_j\Bigr)^{-1}
\;\equiv\;
\prod_{j=l}^{r} \hat{b}_j
\;\equiv\;
\prod_{j=l}^{r} b_j \pmod M,
$$

because the shadow value and the residue agree on every element of the range. The program prints $Q[r] \ast I[l-1]$, and $I[l-1] = Q[l-1]^{-1}$ by the next argument, so the printed value is correct. $\square$
:::

::: math proof Proof
The inverse table is correct. Fermat's little theorem gives $Q[n] \ast Q[n]^{M-2} \equiv 1$, because $Q[n]$ is a product of factors in $[1, M-1]$ and is therefore not divisible by the prime $M$. Now suppose $I[i] = Q[i]^{-1}$. The backward update sets

$$
I[i-1] = I[i] \ast \hat{b}_i = Q[i]^{-1} \ast \hat{b}_i = (Q[i-1] \ast \hat{b}_i)^{-1} \ast \hat{b}_i = Q[i-1]^{-1}.
$$

By induction from $n$ down to $1$, every entry of $I$ is the inverse of the corresponding entry of $Q$, and $I[0] = 1 = Q[0]^{-1}$. $\square$
:::

## Complexity analysis

**Building the forward tables: $O(n)$ time.** The loop performs one multiplication, one modulo reduction and one zero test per element.

**Building the inverse table: $O(\log M)$ time for the exponentiation and $O(n)$ time for the backward pass.** The exponent is $M-2$, so the exponentiation performs about 30 squarings and 30 multiplications, a constant independent of $n$.

**Each query: $O(1)$ time.** The answer is one subtraction of two zero counts, one comparison, and, when no zero is present, one multiplication and one modulo reduction.

**The whole run: $O(n + q)$ time** and **$O(n)$ auxiliary space.** In the fixed-width languages, the four arrays of $n+1$ 64-bit entries cost about $32(n+1)$ bytes, which is 32 MB at $n = 10^6$; the JavaScript listing uses `BigInt` and needs more.

::: math complexity Complexity
Prefix products over an array of $n$ values: $O(n)$ time to build the prefix product, the zero count and the inverse prefix product, $O(1)$ time per query, $O(n + q)$ time in total, and $O(n)$ space. The single modular exponentiation costs $O(\log M)$, which is constant for a fixed modulus.
:::

The width of the accumulator is part of the complexity statement, because it decides whether the answer is even correct. Every product in the construction is below $(M-1)^2 \approx 1.000000012 \ast 10^{18}$, which fits in a signed 64-bit integer, whose largest value is about $9.22 \ast 10^{18}$. A 32-bit type is not enough: the product of two residues below $10^9$ already exceeds $2^{31}$.

The six implementations use `long long` in C and C++, `long` in Java, `Int64` in Pascal and `BigInt` in JavaScript. Python needs no declaration, because its integers are unbounded. Pascal under the browser compiler needs one more precaution: its `Int64` is represented as a double, so a product near $10^{18}$ loses the low bits. The Pascal listing therefore multiplies with a helper that splits one factor into 15-bit limbs, keeping every intermediate below $2^{53}$; Free Pascal receives the same helper and computes exactly.

If the inverse prefix table is omitted and each query calls a modular exponentiation instead, the query cost becomes $O(\log M)$ and the whole run $O(n + q \log M)$. That is still fast enough for many judges, but it is not linear, and it is unnecessary: one exponentiation at the end supplies every inverse prefix.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static array, many range sums | Prefix sums |
| Static array, many range XOR queries | Prefix XOR |
| Static array, range products modulo a prime | Prefix product with an inverse prefix table |
| Static array, range products with zeros | Prefix product of nonzero values, zero count, inverse prefixes |
| Static array, range products modulo a composite | Block decomposition or a disjoint sparse table |
| Point updates and range sums | Fenwick tree |
| Point updates and range products | Fenwick tree for invertible values, segment tree otherwise |
| Range minimum or maximum | Sparse table or segment tree |
| Range GCD | Sparse table |
| Count of subarrays with product zero | Last zero position or a prefix zero count |
| Range products on a grid with zeros | Two-dimensional prefix products plus a two-dimensional zero count |
| Range affine maps or matrix products | Prefix composition when invertible, segment tree otherwise |

The composite-modulus row is the boundary of this technique. When $M$ is prime and every nonzero value is smaller than $M$, every nonzero value is a unit and the inverse exists. When $M$ is composite, a value can share a factor with $M$ and have no inverse, and a prefix product can lose information that no zero count can recover. The static structure that always works is a segment tree or a block decomposition, because both combine two products without dividing. The price is a logarithmic or block-level factor per query, which is the right trade when the modulus is not prime.

The last row is a reminder that the technique is about the operation, not the array. Function composition is associative and has an identity, but it is not commutative, so the inverse is applied on the left. When the functions are not bijective, there is no inverse and a segment tree is the only general structure.

## Reference implementations

The manifest publishes one program variant per language. There is no reusable minimal variant, because the zero bookkeeping and the inverse table are the technique; a function that only builds the prefix product would leave out the part that makes the queries correct.

The programs all read the same input: $n$, then $n$ integers, then $q$, then $q$ lines with a one-based inclusive range $l$ $r$. Each value is reduced modulo $M$ on read, and a negative residue is normalized into $[0, M)$. Each query prints the range product modulo $M$, one line per query.

The six files are `c/program.c`, `cpp17/program.cpp`, `java/Main.java`, `python/program.py`, `pascal/program.pas` and `javascript/program.js`. They share the same three tables and the same query rule; they differ in how they keep the arithmetic exact.

- The C listing allocates the four arrays with `calloc`, normalizes a negative `%` result, and frees the arrays before returning.
- The C++ listing uses `std::vector<long long>` and buffers output through the standard stream.
- The Java listing names the class `Main` so the file can be submitted unchanged, uses `long` throughout, and reads with a buffered integer scanner.
- The Python listing relies on unbounded integers and calls the built-in three-argument `pow` once for the total inverse.
- The Pascal listing reads one argument per `Read`, uses `SysUtils`, and computes modular products with the 15-bit `MulMod` helper so that it is exact both in Free Pascal and under pas2js.
- The JavaScript listing uses `BigInt` for every table entry and converts only the final answer to a string.

The inverse table is built backward in every language. The only exponentiation is the one that inverts $Q[n]$; after that, each step multiplies by the shadow value of one element. No implementation divides by a prefix product, and no implementation calls an exponentiation inside the query loop.

## Recursion decision

A prefix fold is a left-to-right fold, and a fold is naturally a loop. The recursive formulation is possible:

```python
def prefix(i):
    if i == 0:
        return 1
    return prefix(i - 1) * (a[i - 1] if a[i - 1] != 0 else 1) % MOD
```

It computes the same value, but it has two problems. The first is performance: without memoization it recomputes every earlier prefix, so building the whole table costs $O(n^2)$ instead of $O(n)$. The second is the stack: the recursion depth is $n$, so on an array of $10^5$ values it needs $10^5$ frames, and Python's default limit of 1000 is exceeded after the first thousand elements.

| Language   | Default limit              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB of stack              | About $10^5$ frames     | Use the loop   |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the loop   |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the loop   |
| Pascal     | The operating system stack | Depends on the platform | Use the loop   |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the loop   |

Memoizing the recursive form turns it back into the loop, with an extra dictionary and a stack frame per element. There is no reason to pay for either.

The one place where recursion is the right tool is parallel prefix computation. When the prefix products of an array are needed on many processors at once, the work is split into an up-sweep and a down-sweep, both naturally recursive. That is a different problem from the one in this article, where one processor does all the work.

## Implementation walkthrough

Five details decide whether a range-product solution is correct.

**Reduce on read, including negatives.** The inverse formula needs a residue in $[0, M)$. In C, C++, Java and Pascal, the `%` operator can return a negative remainder, so add $M$ when the result is negative. Python's `%` already returns a nonnegative residue; JavaScript's `BigInt` `%` does not, so normalize it explicitly.

**Replace a zero by the identity in the product table.** The shadow value is $1$ for a zero and the residue otherwise. The prefix product is built from the shadow values, not from the raw residues. This is the step that keeps $Q[l-1]$ invertible even when the array before the query contains a zero.

**Count the zeros in a separate table.** The zero count is a prefix sum of indicators. A query contains a zero exactly when $Z[r] - Z[l-1] > 0$. Check this before any multiplication, because the product table deliberately hides the zero.

**Build the inverse table backward.** Compute $I[n] = Q[n]^{M-2}$ once. Then $I[i-1] = I[i] \ast \hat{b}_i \bmod M$. The backward pass is what makes the per-query cost one multiplication instead of one exponentiation.

**Keep the products inside the type.** In C, C++, Java and Pascal, the largest intermediate is $(M-1)^2 \approx 10^{18}$, which fits `long long`, `long` and `Int64` in Free Pascal. Under pas2js, `Int64` is a double, so the product must be split into limbs; the Pascal listing does that in `MulMod`. In JavaScript, use `BigInt`; a plain `Number` loses the low bits beyond $2^{53}$.

The core of the construction is short enough to read in one screen:

```python
Q = [1] * (n + 1)
Z = [0] * (n + 1)
for i in range(1, n + 1):
    shadow = 1 if value[i] == 0 else value[i]
    Q[i] = Q[i - 1] * shadow % MOD
    Z[i] = Z[i - 1] + (1 if value[i] == 0 else 0)

I = [1] * (n + 1)
I[n] = pow(Q[n], MOD - 2, MOD)
for i in range(n, 0, -1):
    shadow = 1 if value[i] == 0 else value[i]
    I[i - 1] = I[i] * shadow % MOD
```

The query loop is then three lines: read $l$ and $r$, compare the zero counts, and either print $0$ or print `Q[r] * I[l-1] % MOD`.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Dividing by a raw prefix product | The prefix is zero because of an earlier zero, so the inverse is invalid | Use the shadow prefix product for both bounds |
| Replacing a zero by one but not counting zeros | A range containing a zero prints a nonzero answer | Keep the zero count table and check it first |
| Taking the inverse of zero | The inverse does not exist; a modular power returns $0$ | Check the zero count before any inverse is needed |
| Using 32-bit products | The product of two residues overflows before the reduction | Use 64-bit types or `BigInt` |
| Forgetting to normalize a negative residue | The table holds a negative value and the inverse formula fails | Add $M$ after a negative `%` in C, C++, Java and Pascal |
| Computing an inverse per element or per query | The run becomes $O(n \log M)$ or $O(q \log M)$ | Build the inverse table backward from one exponentiation |
| Subtracting $Q[l]$ instead of $Q[l-1]$ | The element at position $l$ is left out of every answer | The prefix of length $l-1$ is the left bound |
| Allocating $n$ entries instead of $n+1$ | The last prefix or inverse is written out of bounds | Reserve the empty prefix at index zero |
| Using a prefix maximum or minimum | The operation has no inverse, so the range cannot be recovered | Use a sparse table or a segment tree |
| Treating every associative operation as invertible | The quotient is invalid for GCD, maximum, or non-bijective maps | Decide the inverse before choosing the structure |

### Why this fails: the prefix product that is already zero

The mistake that survives review most often is checking the range for zeros but still dividing by the raw prefix product.

Take the array $a = [2, 0, 3]$ and the query $[3, 3]$. The range itself contains no zero, so the zero test passes. The prefix products are $P[0] = 1$, $P[1] = 2$, $P[2] = 0$ and $P[3] = 0$, because the zero at position two has already swallowed every later prefix. The quotient $P[3] \ast P[2]^{-1}$ tries to invert zero, and the answer is lost.

The correct construction shadows the zero: $Q = [1, 2, 2, 6]$. The query is $Q[3] \ast Q[2]^{-1} = 6 \ast 2^{-1} = 3$, which is the value at position three, and the zero count for the range is zero, so the zero branch is not taken. The lesson is that the zero count decides whether the answer is zero, but the product table must still be built as if every zero were a one. The two tables answer two different questions, and neither one alone is enough.

There is a second failure with the same root. A prefix maximum cannot be divided, because a maximum has no inverse. If a range asks for the largest value, the prefix maximum of the whole array tells nothing about the maximum inside a piece of it. The structure that handles it is a sparse table, which stores the maximum of every power-of-two block and combines two overlapping blocks in constant time. Associativity alone is not enough; the inverse is what this technique spends.

## Variants and extensions

- **Prefix XOR.** The identity is $0$ and every value is its own inverse, so the range formula is $P[r] \oplus P[l-1]$ and there is no zero count. This is the cleanest example of the technique after addition.
- **Prefix counts and frequency maps.** A prefix count of marked cells answers "how many marked cells are in the range" with the same subtraction. A prefix array per alphabet symbol, or a map from value to a sorted list of positions, answers frequency queries.
- **Prefix products of factorials.** Binomial coefficients modulo a prime are built from a prefix product of factorials and a prefix product of inverse factorials. The inverse factorial table is the same backward construction as the inverse prefix product.
- **Rolling hash.** A polynomial hash is a prefix fold under multiplication and addition, and the hash of a range is the difference of two prefixes shifted by a power of the base. That is the same quotient idea with a different algebra.
- **Affine maps and matrix products.** Function composition is associative but not commutative, and the inverse is applied on the left. When every map is invertible, a prefix table of composed maps answers a range; when some maps are not invertible, a segment tree is required.
- **Composite modulus.** When the modulus is not prime, a value can share a factor with it and have no inverse. Factor the modulus, keep the exponents of its prime factors in a prefix table, and keep a prefix product of the remaining unit part; a range is zero exactly when every prime factor reaches its exponent. This is the bookkeeping that the general form of the range-product problem needs.
- **Two-dimensional products with zeros.** A two-dimensional prefix product with a two-dimensional zero count answers rectangle products when the corner prefix is invertible, and the zero count prevents a division by a corrupted corner. The same offset discipline applies in both dimensions.
- **Point updates.** A Fenwick tree supports range products when the operation is invertible; a segment tree supports them when it is not. The static prefix table is the special case where no updates occur.
- **Subarrays with product zero.** The number of subarrays with product zero is the number of subarrays that contain at least one zero, which the positions of the zeros answer directly. A prefix zero count or the last zero position is enough.
- **Difference arrays.** The mirror image stores the differences between consecutive values, so that a range update becomes two changes and a prefix fold recovers the values. Multiplication has an analogous ratio array.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the operation, its identity, and the inverse of a value. If no inverse exists, stop and choose a structure that does not divide.
2. Check that the array is static. If the statement says "after each operation", a prefix table is the wrong answer.
3. Decide the modulus and whether it is prime. For a prime modulus, reduce every value and use Fermat for the inverse; for a composite modulus, expect shared factors.
4. Identify the non-invertible values. For multiplication the only one is zero; for a composite modulus they are the values that share a factor with the modulus.
5. Build the prefix table and the inverse table once. Use one exponentiation and walk backward; do not exponentiate inside the query loop.
6. Test the four boundary cases explicitly: the whole array, a single element, a range that starts after a zero, and a range that ends before one. Add a value equal to the modulus, which reduces to zero, and a negative value, which must normalize.
7. Check the width of every product. The largest intermediate is the square of the modulus; if the language's type cannot hold it, use limbs, `BigInt` or a wider type.

## Worked problems

### Problem 1: the range product with a composite modulus

**Restatement.** CodeChef SEGPROD gives an array of $N$ integers, a modulus $P$ that is not necessarily prime, and $Q$ online queries. Each query names a range, and the answer is the product of the range modulo $P$. The queries are generated from an array $B$ and the previous answer, so they cannot be reordered or batched. Constraints: $N \le 10^6$, $Q \le 2 \ast 10^7$, $P \le 10^9$, and values in $[0, 10^9]$.

**Naive baseline.** Multiply the range for every query, at a cost of $O(NQ)$, which is far beyond the time limit at the top of the range.

**Insight.** The technique's quotient needs every factor to be invertible. The prime subtask, where $P$ is prime and every value lies in $[1, P-1]$, is exactly the construction in this article: a prefix product of the nonzero values, a prefix zero count, and an inverse prefix table. The full task removes the prime assumption, so a value may share a factor with $P$ and the quotient can fail.

**Derivation.** Reduce every value modulo $P$, count zeros, build the shadow prefix product, and build the inverse prefix table. That answers the prime subtask in $O(N + Q)$. For the general modulus, the same tables still handle the zeros, but the nonzero values are not all units. The full solution replaces the quotient with a static structure that combines two products without dividing, such as block decomposition with precomputed block-range products, or a segment tree. The online generation is the reason the queries cannot be processed in a different order.

**Correctness.** On the prime subtask, the zero count identifies the ranges whose product is zero, and on every other range the quotient of the two shadow prefix products is the range product by the telescoping identity. The general structure is correct by the associativity of multiplication.

**Complexity.** $O(N + Q)$ time and $O(N)$ space on the prime subtask. The general structure adds a logarithmic or block-level factor to the preprocessing or to the query, depending on the structure chosen.

**Common wrong approach.** Dividing by a prefix product that is zero modulo $P$ because an earlier value was zero. The zero count must be consulted first, and the product table must use shadow values.

### Problem 2: counting the subarrays by the sign of their product

**Restatement.** Codeforces 1215B gives a sequence of $n$ nonzero integers and asks for the number of subarrays whose product is negative and the number whose product is positive. Constraints: $n \le 200{,}000$ and $|a_i| \le 10^9$.

**Naive baseline.** Enumerate the $n(n+1)/2$ subarrays and multiply each one, at a cost of $O(n^2)$ or worse.

**Insight.** Only the sign of a product matters, and the sign is the parity of the number of negative factors. Multiplication of signs is a two-element group, so the prefix product of the signs is a prefix XOR in disguise.

**Derivation.** Replace each value by $+1$ or $-1$ and build the prefix products. The product of the range $[l, r]$ is negative exactly when the two prefix signs at $l-1$ and $r$ differ. Sweep the prefixes from left to right and keep two counters: the number of prefixes with sign $+1$ and the number with sign $-1$. For each new prefix, the number of negative subarrays ending at that position is the count of prefixes with the opposite sign, and the number of positive subarrays is the count with the same sign. Start the positive counter at one for the empty prefix, so subarrays that start at the first element are counted.

**Correctness.** Every subarray corresponds to exactly one pair of prefix positions, and its sign is the product of the two prefix signs. The sweep counts each pair once, when it reaches the larger index, and the empty prefix accounts for the subarrays that begin at the first element.

**Complexity.** $O(n)$ time and $O(1)$ extra space. The two counts can reach about $2 \ast 10^{10}$, so they need a 64-bit integer.

**Common wrong approach.** Multiplying the actual values and overflowing, or forgetting the empty prefix. The first makes the sign unreliable; the second loses every subarray that starts at position one.

### Problem 3: splitting a range into equal XOR parts

**Restatement.** Codeforces 1968F gives an array of $n$ values and $q$ queries. For each query $[l, r]$, decide whether the subarray can be split into $k > 1$ consecutive parts whose XOR values are all equal. Constraints: $n, q \le 200{,}000$ and $a_i < 2^{30}$.

**Naive baseline.** Try every split point or every pair of split points, which is quadratic per query.

**Insight.** XOR is its own inverse, so the XOR of a range is $P[r] \oplus P[l-1]$, and every range question becomes a question about two prefix values. Equal part XORs are equations on the prefix sequence.

**Derivation.** Let $s = P[l-1]$ and $t = P[r]$. If $s = t$, the range XOR is zero, and splitting it at any interior position gives two parts with the same XOR. If $s \ne t$, the common part XOR must be $d = s \oplus t$, and the number of parts must be odd. Three parts always suffice when any split exists: the first part must end at an index $x$ with $P[x] = t$, and the second at an index $y$ with $P[y] = s$, with $l \le x < y < r$. Keep a sorted list of the positions for each prefix value and binary search for the first $x$ after $l-1$, then for the first $y$ after $x$. If $y < r$, the three parts work; otherwise no odd split works, because any longer split would contain the same two boundaries.

**Correctness.** If the two positions are found, the three ranges have XOR $t \oplus s = d$, $s \oplus t = d$ and $t \oplus s = d$, so the split is valid. Conversely, any valid split with an odd number of parts has a first boundary with prefix $t$ and a second with prefix $s$ before $r$, so the search cannot miss one. A split with an even number of parts requires the range XOR to be zero, which is the first case.

**Complexity.** $O((n + q) \log n)$ time with position lists and binary search, and $O(n)$ space.

**Common wrong approach.** Allowing $k = 1$ and returning yes for every range, or insisting on exactly two parts when the range XOR is nonzero. The first violates the definition; the second misses every valid three-part split.

## Practice progression

1. **Recognition.** Given a statement, identify the operation, its identity, and the inverse of a value. Decide whether the array is static and whether the operation is invertible.
2. **Direct application.** Implement prefix products without zeros and answer range products with one inverse per query. Verify against a brute-force product on small random arrays.
3. **Obstruction handling.** Add the zero count and the shadow value, then test ranges that begin after a zero and ranges that end before one. Confirm that a prefix product is never inverted when it is zero.
4. **Linear inversion.** Replace the per-query exponentiation with the backward inverse table. Count the number of exponentiations in the program and confirm that it is one.
5. **Transfer.** Repeat the construction with XOR, where the inverse is free, and with prefix counts, where the operation is addition of indicators. Compare the three programs and note that only the combination step changes.
6. **Boundary.** Solve the prime subtask of a composite-modulus problem, then explain why the full task needs a structure that does not divide. This is the point where the technique stops and the range-query structures begin.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What property of the operation makes a range fold a quotient of two prefix folds, and where is that property used? (Key insight)
2. Why does the prefix product have $n+1$ entries rather than $n$, and what is the identity at index zero? (Formal model)
3. Why is the prefix product of the shadow values never zero modulo a prime? (Key insight)
4. What does the zero count decide, and why can it not be replaced by testing the prefix product? (Common mistakes)
5. Derive the backward recurrence for the inverse prefix table and say why one exponentiation is enough. (Algorithm derivation)
6. What is the largest intermediate product under a modulus near $10^9$, and which type holds it? (Complexity analysis)
7. Why does Pascal under pas2js need a limb-based multiplication when Free Pascal does not? (Implementation walkthrough)
8. Give an operation that is associative but not invertible, and the structure to use instead. (Algorithm selection)
9. In the XOR problem, why does a range with XOR zero always split into two equal parts, and why does a nonzero range need three? (Worked problems)
10. When is a single scan better than building the prefix tables? (Recognition patterns)

## Further reading

- The additive original, with the indexing and offset conventions that this article reuses, is [prefix sums](/algorithms/arrays/prefix-sums).
- The polynomial version of a prefix fold, where the range is recovered with a power of the base, is [range hashing](/algorithms/arrays/range-hashing).
- The mirror image, in which a range update becomes two changes, is [difference arrays](/algorithms/arrays/difference-arrays).
- The two-dimensional product with a zero count is the grid version of the same idea, alongside [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The structure to reach for when the array changes is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and the structure for operations without an inverse is the [segment tree](/algorithms/range-queries/segment-tree).
- The inverse that makes the quotient work is developed in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The search over prefix values in the XOR problem uses [binary search](/algorithms/searching/binary-search).
