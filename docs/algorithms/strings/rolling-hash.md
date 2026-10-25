---
id: strings.rolling-hash
title: Rolling hash
summary: Compare two substrings in constant time by hashing them, and maintain the hash of a growing window in constant time per character.
division: [gold]
subjects: [strings]
level: intermediate
importance: common-contest-technique
keywords:
    [
        rolling hash,
        polynomial hash,
        string hashing,
        hash collision,
        prefix hash,
        double hashing,
        substring comparison,
    ]
prerequisites:
    required: [foundations.complexity, foundations.binary-representation]
    recommended: [strings.kmp, number-theory.modular-arithmetic, searching.two-pointers]
complexity:
    time: "O(n) to build, O(1) per substring query"
    space: "O(n) for the two tables"
assumptions:
    - The strings are static, so that a prefix table can be built once and reused.
    - The modulus is prime and larger than the largest character value, so that the polynomial hash is well defined over the residues.
    - A collision is either impossible, which requires a deterministic comparison, or acceptable, which requires the answer to be verified.
reviewed: false
---

## At a glance

A rolling hash turns a string into a number, in such a way that the hash of a **substring** can be computed from the hashes of two **prefixes** in constant time. Two substrings can then be compared in constant time instead of in time linear in their length.

The construction is a polynomial hash. For a base $B$ and a modulus $M$,

$$
H(s) = \sum_{i=0}^{n-1} s_i B^{n-1-i} \bmod M.
$$

The prefix table stores the hash of every prefix, and the substring hash is

$$
\operatorname{hash}(s[l \dots r)) = \bigl(H[r] - H[l] \cdot B^{r-l}\bigr) \bmod M.
$$

The method is fast, and it is the standard answer to "compare two substrings in constant time". It is also the only technique in this encyclopedia that can be **wrong by design**: a hash can collide, and two different strings can have the same hash. Choosing a base, choosing a modulus, and deciding whether to use one hash or two are all real decisions, and this article explains what each of them buys.

The cost is $O(n)$ preprocessing and $O(1)$ per query, with $O(n)$ space.

## Problem motivation

A plagiarism checker holds a corpus of $m$ documents, each of length about $n$, and it must report every pair of documents that share a long substring. A document is identified by its $k$-character fingerprint at every position, and two documents share a $k$-character substring exactly when they share a fingerprint.

The constraints are $m \le 10^3$ documents of length $n \le 10^5$, and $k$ about $30$.

The naive approach compares the $k$-character substrings directly. There are about $mn = 10^8$ fingerprints to compare, and each comparison costs $k = 30$ character comparisons, so the total is $3 \times 10^9$ operations. It is within reach of a good time limit in C++, and it is not within reach in Python.

The rolling hash reduces each comparison to one integer comparison, so the total is $10^8$ comparisons, and it can be made faster still by sorting the fingerprints and looking for adjacent equal ones. The preprocessing costs $O(mn) = 10^8$ modular operations, which is the price of the speedup.

The catch is that the fingerprint is a hash, and a hash can collide. A checker that reports a collision is wrong. This article is about how the technique works, what the risk actually is, and what the honest options are when the risk is not acceptable.

## Recognition patterns

Rolling hashing is the right tool when all of the following hold.

- The question is about **equality of substrings**, or about something that can be reduced to it: duplicate detection, finding a repeated substring, matching a pattern, counting the occurrences of a substring.
- The substrings are **long**, so that a direct comparison is expensive.
- There are **many** comparisons, so that the $O(n)$ preprocessing pays for itself.
- The answer tolerates a **negligible** probability of error, or the comparisons are **verified** when the hashes match.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One comparison of two substrings | Rules out the technique; a direct comparison is simpler |
| $10^5$ or more comparisons | Rules in the technique |
| The substrings are one character long | Rules out the technique; a direct comparison is one operation |
| The answer must be exactly right, with no verification | Rules out a single hash; a deterministic technique is required |
| The strings change between queries | Rules out the prefix table; it must be rebuilt |
| The alphabet is large and the values are unbounded | Requires a normalization step before hashing |

The fifth row is worth a sentence. A rolling hash needs a prefix table over the string, and building that table is $O(n)$. A problem with one query does not amortize it.

The last row is the one that causes silent wrong answers. A program that hashes the raw character codes of a UTF-8 string is hashing bytes, not characters, and a character that is two bytes long contributes two values instead of one. The normalization has to be deliberate.

## Naive approach

The baseline compares the substrings directly.

```python
def same(text_a, a, text_b, b, length):
    return text_a[a:a + length] == text_b[b:b + length]
```

This is correct, it is $O(\text{length})$ per comparison, and it is the reference implementation for the differential test. The slicing allocates a copy, so the honest version is a loop, but the cost is the same.

The second baseline is the one that motivates the technique: a program that computes the hash of a substring from scratch.

```python
def slow_hash(text, start, length):
    value = 0
    for i in range(start, start + length):
        value = (value * BASE + ord(text[i])) % MOD
    return value
```

This is the same polynomial hash, computed the obvious way. It is correct, and it is $O(\text{length})$ per query, so it buys nothing over the direct comparison. The whole point of the rolling construction is that the hash of a long substring is assembled from the hashes of two short ones.

## Key insight

The insight is that **a polynomial hash of a suffix of a string is a polynomial multiple of the hash of the whole prefix**, and the multiplier is a power of the base.

Write the hash of the first $r$ characters as

$$
H[r] = s_0 B^{r-1} + s_1 B^{r-2} + \cdots + s_{r-1}.
$$

Then the hash of the first $l$ characters is

$$
H[l] = s_0 B^{l-1} + s_1 B^{l-2} + \cdots + s_{l-1},
$$

and multiplying it by $B^{r-l}$ gives

$$
H[l] \cdot B^{r-l} = s_0 B^{r-1} + s_1 B^{r-2} + \cdots + s_{l-1} B^{r-l},
$$

which is exactly the first $l$ terms of $H[r]$. The remaining terms of $H[r]$ are the hash of the substring, except that they are shifted by the wrong power of the base. Dividing by that power is the same as multiplying by the modular inverse of $B^{r-l}$, and the standard trick avoids the division by restructuring the definition.

The definition that avoids the division is the one to use:

$$
H[r] = H[r-1] \cdot B + s_{r-1} \bmod M.
$$

Now $H[r]$ is the hash of the prefix read as a number in base $B$, and the substring hash is

$$
\operatorname{hash}(s[l \dots r)) = \bigl(H[r] - H[l] \cdot B^{r-l}\bigr) \bmod M.
$$

The multiplication by $B^{r-l}$ shifts the hash of the prefix into the right place, and the subtraction removes it.

## Formal model

Let $s$ be a string of length $n$ over an alphabet whose characters have values $s_0, \ldots, s_{n-1}$, all less than the modulus $M$. Let $B$ be the base and $M$ the modulus.

::: math definition Definition
For a base $B$, a modulus $M$, and a string $s$ of length $n$ with character values $s_0, \ldots, s_{n-1}$, the **prefix hash** $H$ is $H[0] = 0$ and

$$
H[i+1] = (H[i] \cdot B + s_i) \bmod M.
$$

The **hash of the substring** $s[l \dots r)$ is

$$
\operatorname{hash}(s[l \dots r)) = \bigl(H[r] - H[l] \cdot B^{r-l}\bigr) \bmod M.
$$
:::

::: math lemma Lemma
For every $0 \le l \le r \le n$, the value $\bigl(H[r] - H[l] \cdot B^{r-l}\bigr) \bmod M$ is the polynomial hash of the substring $s[l \dots r)$, that is, the hash of that substring computed as if it were a string on its own.
:::

::: math proof Proof
Unrolling the definition of $H$ gives $H[r] = \sum_{i=0}^{r-1} s_i B^{r-1-i}$. Similarly $H[l] = \sum_{i=0}^{l-1} s_i B^{l-1-i}$, so $H[l] B^{r-l} = \sum_{i=0}^{l-1} s_i B^{r-1-i}$. Subtracting removes the first $l$ terms of $H[r]$ and leaves $\sum_{i=l}^{r-1} s_i B^{r-1-i}$, which is the polynomial hash of the substring of length $r - l$. $\square$
:::

## Algorithm derivation

### Building the table

```text
power[0] = 1
for i from 1 to n:
    power[i] = power[i - 1] * B mod M
H[0] = 0
for i from 0 to n - 1:
    H[i + 1] = (H[i] * B + value(s[i])) mod M
```

Both loops are $O(n)$. The `power` table holds the powers of the base, and it is the only thing that makes the substring query $O(1)$; without it, the query would need a modular exponentiation.

### Answering a query

```text
hash(l, r) = (H[r] - H[l] * power[r - l]) mod M
```

Two substrings are compared by comparing their hashes, which is one subtraction, one multiplication, and one comparison.

### The choice of base and modulus

The base must be **larger than the largest character value**, or the polynomial is not injective on the character values and the strings `AB` and `BA` can collide for a trivial reason. For a lowercase alphabet, any base at least $27$ works; $911382323$ and $31$ are the usual choices.

The modulus should be a **large prime**, for two reasons. A large modulus makes the residue space big, which is what makes the collision probability small. A prime modulus makes the analysis of the collision probability clean, because the polynomial of degree $k$ over a field has at most $k$ roots.

The standard choice for a single hash is a prime near $10^9$, such as $1\,000\,000\,007$ or $998\,244\,353$. The standard choice for a double hash is two such primes, with two independent bases, which are reduced to a single 64-bit key.

::: math invariant Invariant
At every moment, $H[i]$ is the polynomial hash of the first $i$ characters of the string, and `power[i]` is $B^i \bmod M$. The two are consistent because both are built by the same recurrence, and the lemma then makes every substring query exact as a polynomial evaluation.
:::

### The collision probability

::: math definition Definition
Two distinct strings $s$ and $t$ of the same length **collide** under the parameters $(B, M)$ when $\sum_{i} (s_i - t_i) B^{n-1-i} \equiv 0 \pmod M$.
:::

::: math theorem Theorem
Let $M$ be a prime, let $B$ be chosen uniformly at random from $\{1, 2, \ldots, M-1\}$, and let $s$ and $t$ be two distinct strings of length $k$ over an alphabet whose values are all less than $M$. Then the probability that they collide is at most $\frac{k-1}{M-1}$.
:::

::: math proof Proof
The difference of the two hashes is the polynomial $P(B) = \sum_{i=0}^{k-1} (s_i - t_i) B^{k-1-i}$ evaluated at the chosen base. Because $s \ne t$, the coefficients are not all zero, so $P$ is a nonzero polynomial of degree at most $k-1$ over the field of residues modulo $M$. A nonzero polynomial of degree $d$ over a field has at most $d$ roots, so at most $k-1$ of the $M-1$ choices of $B$ make $P(B) = 0$. The probability is therefore at most $\frac{k-1}{M-1}$. $\square$
:::

The bound is much better than the naive "the probability is one in $M$" for a single comparison, because it grows with the length of the strings being compared. The bound that matters in practice, however, is the **birthday bound**, which concerns many comparisons at once.

::: math definition Definition
The **birthday bound** says that among $m$ strings hashed into a table of size $N$, the probability that some pair collides is approximately $1 - e^{-m^2/(2N)}$.
:::

For $M \approx 10^9$ and $m = 10^6$ distinct substrings, the expected number of collisions is about

$$
\frac{m^2}{2M} = \frac{10^{12}}{2 \cdot 10^9} = 500.
$$

So a single hash of modulus $10^9$ over a million distinct substrings collides with essentially certainty. This is the number that should decide the single-hash question, and it is much larger than most people expect.

With a double hash, the effective table size is $M^2 \approx 10^{18}$, and the same $10^6$ substrings give an expected number of collisions of about $10^{12} / (2 \cdot 10^{18}) = 5 \times 10^{-7}$. That is small enough to ignore.

## Step-by-step execution

Take the string `abracadabra`, the base $B = 31$, and the modulus $M = 1\,000\,000\,007$. The character values are the ASCII codes.

The prefix hashes are built one at a time, and each one multiplies the previous by $31$ and adds the next character. The values below are already reduced modulo $M$.

| $i$ | Character | $H[i]$        | How it was computed                      |
| --- | --------- | ------------- | ---------------------------------------- |
| 0   |           | 0             | the empty prefix                         |
| 1   | `a`       | 97            | $0 \cdot 31 + 97$                        |
| 2   | `b`       | 3105          | $97 \cdot 31 + 98$                       |
| 3   | `r`       | 96\,369       | $3105 \cdot 31 + 114$                    |
| 4   | `a`       | 2\,987\,536   | $96\,369 \cdot 31 + 97$                  |
| 5   | `c`       | 92\,613\,715  | $2\,987\,536 \cdot 31 + 99$              |
| 6   | `a`       | 871\,025\,248 | $(92\,613\,715 \cdot 31 + 97) \bmod M$   |
| 7   | `d`       | 1\,782\,599   | $(871\,025\,248 \cdot 31 + 100) \bmod M$ |

Now the query for the substring `acad`, which starts at index $3$ and has length $4$, so it is the range $[3, 7)$. The formula gives

$$
\operatorname{hash}(3, 7) = \bigl(H[7] - H[3] \cdot 31^{4}\bigr) \bmod M.
$$

The powers table holds $31^4 = 923\,521$, and $H[3] = 96\,369$, so the product is $96\,369 \cdot 923\,521 = 88\,998\,795\,249$, which reduces to $998\,794\,633$ modulo $M$. And $H[7] = 1\,782\,599$.

The difference is $1\,782\,599 - 998\,794\,633 = -997\,012\,034$, which reduces to $2\,987\,973$. Computing the same hash directly, as $97 \cdot 31^3 + 99 \cdot 31^2 + 97 \cdot 31 + 100$, gives $2\,987\,973$ as well.

The point of the trace is not the number $2\,987\,973$. It is that the query used one multiplication and one subtraction, while the direct computation of the same hash used three multiplications, and the direct comparison of the two substrings would have used four character comparisons. The win is not in a single query; it is that a program with $10^8$ queries performs $10^8$ constant-time queries rather than $10^8$ linear-time comparisons.

## Correctness proof

::: math theorem Theorem
The function `hash(l, r)` returns the polynomial hash of the substring $s[l \dots r)$ under the parameters $(B, M)$.
:::

::: math proof Proof
By the lemma, the value returned is the polynomial hash of the substring, provided the tables $H$ and `power` hold the values the definitions require. The table $H$ is built by the recurrence $H[i+1] = H[i] \cdot B + s_i$, which is exactly its definition, and the table `power` is built by `power[i] = power[i-1] * B`, which gives $B^i$ by induction on $i$. Both are computed modulo $M$, and the reduction is compatible with addition and multiplication, so the reduced values satisfy the same definitions. $\square$
:::

::: math theorem Theorem
If two substrings are equal, their hashes are equal. The converse does not hold in general: two distinct substrings may have the same hash.
:::

::: math proof Proof
If the substrings are equal, their characters are equal at every position, so the two polynomial expressions are identical, and so are their residues. The converse fails exactly when the difference polynomial is zero at the chosen base, which is the definition of a collision, and the theorem on the collision probability shows that such bases exist. A concrete instance is given in the common mistakes section. $\square$
:::

::: math invariant Invariant
Every value written into the prefix table is the hash of the prefix it belongs to, and every value written into the power table is $B^i \bmod M$. Neither table is ever modified after it is written, so every query sees the same values that the definitions give.
:::

## Complexity analysis

| Quantity | Cost |
| --- | --- |
| Building the prefix table | $O(n)$ time |
| Building the power table | $O(n)$ time |
| One substring query | $O(1)$ time |
| Comparing two substrings | $O(1)$ time |
| Comparing two strings of length $n$ | $O(n)$ time, against $O(n)$ for a direct comparison |
| Space | $O(n)$ for the two tables |
| Sorting $m$ fingerprints to find duplicates | $O(m \log m)$ |

The table is the whole cost. A single hash of a string of length $n$ costs two tables of $n$ entries, so a $10^6$-character string costs about $16$ megabytes with 64-bit entries.

There is a way to halve that. The prefix table and the power table can be merged, because the powers can be recovered from the prefix table of a string of all ones, but that trades time for memory and is rarely worth it. The more useful saving is to use a single 32-bit modulus and a single 32-bit base, which halves the table and doubles the collision risk.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Compare many substrings of a static string | Rolling hash |
| Find a substring that occurs at least twice | A suffix array, or a hash plus a verification |
| Find every occurrence of a pattern | [KMP](/algorithms/strings/kmp), which is exact |
| Find the longest common prefix of two strings | A [Z algorithm](/algorithms/strings/z-algorithm) on the concatenation, which is exact |
| Find the longest common substring of two strings | A suffix array, which is exact |
| The answer must be exactly right, with no error chance | A suffix array, or a hash with a verification step |
| The strings are short, or there are few comparisons | A direct comparison |
| Detect duplicates in a large set of strings | Sort the hashes, then verify the neighbors that match |

The third and fourth rows are the important ones. When the question is "does this pattern occur", an exact linear-time algorithm exists and it is [KMP](/algorithms/strings/kmp). A rolling hash is not the right tool there, because the problem does not need the speed.

The last row is the honest way to use a hash when the answer must be correct. Sort the fingerprints, and for each pair of adjacent equal fingerprints, compare the two substrings directly. The number of verifications is the number of true duplicates, which is small, so the cost of the verification is negligible, and the answer is exact.

## Recursion decision

The rolling hash has no natural recursive form. The prefix table is built by a loop, and the query is an arithmetic expression. There is nothing to recurse.

The recursion question does arise in two places that are worth separating.

The first is **hashing a tree**. The hash of a rooted tree is often defined recursively: the hash of a node is a function of the hash of its children and of its own value. That recursive formulation has a depth equal to the height of the tree, which for a path graph is the number of nodes, and a tree of $10^5$ nodes on a path overflows in every language.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative for a path of $10^5$; the recursive form is exactly at the edge |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of $1000$ | Iterative |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The iterative form for hashing a tree is a post-order traversal with an explicit stack, and it is the same amount of code once the stack is written. The recommendation is therefore: use the recursive form for a balanced tree, whose depth is logarithmic, and the iterative form for an arbitrary tree.

The second is the **binary search on the length** of a longest common prefix, which uses the hash as the predicate. That recursion has a depth of $\lceil \log_2 n \rceil$, which is at most $20$ for any input a contest will give, and it is safe in every language without comment. Most implementations make it a loop anyway, because the loop is the same length as the function.

## Implementation walkthrough

The substring query is the whole method, and the reduction has to come at the right place.

```cpp
long long sub_hash(const std::vector<long long>& h,
                   const std::vector<long long>& power,
                   int l, int r) {
    long long value = (h[r] - h[l] * power[r - l]) % MOD;
    if (value < 0) value += MOD;   // C and C++ can produce a negative residue
    return value;
}
```

The `if (value < 0)` line is not optional in C, C++, and Java. The remainder operator there returns a value with the sign of the dividend, so `h[r] - h[l] * power[r-l]` is negative about half the time, and a negative hash is not the same as the corresponding positive residue.

The overflow is the second thing that matters.

```cpp
h[i + 1] = (h[i] * BASE + value) % MOD;
```

With `MOD` near $10^9$ and `BASE` near $10^9$, the product is near $10^{18}$, which just fits in a signed 64-bit integer. With `MOD` near $2^{61}$, the product needs 128-bit arithmetic, and the code must say so. Choosing a modulus below $10^9$ is what keeps the arithmetic in 64 bits.

The normalization of the characters is the third detail.

```cpp
int value(unsigned char c) {
    return static_cast<int>(c) + 1;   // the offset keeps 0 out of the way
}
```

The offset by one is not required for correctness, but it is a good habit, because a string of null characters then hashes to a nonzero value rather than to zero, and a zero hash is a special case that a program has to handle somewhere else.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| A base smaller than the largest character value | Trivial collisions such as `AB` and `BA` | Use a base above the alphabet size |
| Forgetting to reduce the negative residue | A negative hash, which does not match the positive one | Add the modulus when the value is negative |
| A 32-bit multiplication of two residues near $10^9$ | Silent overflow, because the product exceeds $2^{31}$ | Use a 64-bit type for the product |
| Using the same base for both hashes of a double hash | The two hashes are correlated and the collision rate is much worse than the square | Use two independent bases and two independent moduli |
| Hashing the raw bytes of a UTF-8 string | A multi-byte character contributes several values | Normalize the characters first |
| Not building the power table | Every query costs a modular exponentiation | Precompute the powers |
| Trusting a hash match without verifying | A forced collision produces a wrong answer | Verify the candidates directly, or use a deterministic technique |
| Using a single $10^9$ modulus over a million substrings | About five hundred collisions by the birthday bound | Use a double hash, or verify the neighbors |
| Comparing the hash of a prefix with the hash of a substring | The comparison is meaningless, because the hashes are of different lengths | Compare substrings of the same length only |

### Why this fails: the collision that every base produces

The plausible wrong approach is to use a single hash with a fixed base and a fixed modulus, on the reasoning that a modulus of $10^9$ makes a collision improbable.

There is a family of collisions that no modulus and no modulus choice can avoid, because they are equalities of the integer values of the polynomials, not merely of their residues.

Take the base $B = 31$, the usual first choice, and the ASCII codes for the letters. Consider the two strings `Aa` and `BB`.

| String | Polynomial value          |
| ------ | ------------------------- |
| `Aa`   | $65 \cdot 31 + 97 = 2112$ |
| `BB`   | $66 \cdot 31 + 66 = 2112$ |

The two strings are different, and their polynomial values are exactly equal as integers. So for **every** modulus $M$, including every prime, the two strings have the same hash.

The reason is the identity $97 - 65 = 66 - 66 + 32$ and $32 = 31 + 1$: the gap between an uppercase letter and its lowercase counterpart is exactly one more than the base, which is what lets the two strings trade a base worth of one character for one unit of the leading character.

So the smallest counterexample is two strings of length two, and it defeats a single hash with any modulus whatsoever. A program that reports `Aa` and `BB` as equal strings is wrong, and no amount of choosing a "large enough" prime fixes it.

The fixes are three, and they are worth knowing separately.

- **Use a double hash with two independent bases.** The collision above is forced for the base $31$, and a different base is not vulnerable to it, so two independent hashes make a forced collision into a coincidence that has to happen twice.
- **Verify the match.** When two hashes are equal, compare the two substrings directly. The number of verifications is the number of true matches, which is small, so the cost is negligible and the answer is exact.
- **Use a deterministic technique.** A suffix array answers the same questions exactly, in $O(n \log n)$ rather than $O(n)$.

The lesson generalizes: **a hash is a compression, and a compression can lose information.** A single hash loses it, and a hash can be attacked deliberately as well as by accident. When the answer must be right, the hash is a filter that finds the candidates and a comparison that settles them.

## Variants and extensions

- **Double hashing.** Two independent hashes, with two independent bases and two independent prime moduli, combined into one 64-bit key. The collision probability is roughly squared, and the table cost is doubled.
- **Hashing with 64-bit overflow.** Using the natural overflow of a 64-bit integer instead of a modulus is fast and works well in practice, but the collision analysis is weaker because the modulus is a power of two and the base must be odd. It is a common contest choice and it is what the [binary representation](/algorithms/foundations/binary-representation) article is about at the bit level.
- **Hashing with the Mersenne prime.** The modulus $2^{61} - 1$ gives a large residue space, and the modular reduction is a shift and a subtraction, so the arithmetic is fast. The products need 128-bit integers.
- **The sum of random per-element hashes.** Assign each distinct character a random 64-bit value, and hash a string as the sum of the values of its characters. The hash is then independent of the order, which makes it the right tool for comparing multisets of characters.
- **Hashing a tree.** Define the hash of a node from the hash of its children, and the whole tree can be compared in constant time. The recursive definition has a depth equal to the height of the tree.
- **The verification step.** Sort the hashes, and compare the strings behind the adjacent equal hashes. The result is exact, and the cost is the sorting.
- **The suffix array.** The deterministic alternative, which answers the same questions in $O(n \log n)$ and has no failure mode.

## Contest strategy

1. Decide whether the answer tolerates a probability of error. If it does not, use a suffix array, or plan the verification step from the start.
2. Use two independent hashes if a single hash is used, and use independent bases. Two hashes with the same base are much weaker than two hashes with different bases.
3. Choose a prime modulus below $10^9$ so that the products fit in a signed 64-bit integer without thinking about it.
4. Normalize the characters, and use a base strictly larger than the largest normalized value.
5. Build the power table. A query that calls a modular exponentiation is $O(\log n)$ and the whole technique loses its point.
6. Handle the negative residue. It is the single most common source of "the hash works on my machine".
7. When the hashes match and the answer must be right, compare the substrings directly. The verification is cheap, because the number of true matches is small.
8. Test the hash on two strings that differ in one character, and on the empty string. The empty string has hash zero, and a program that uses zero as a sentinel must know that.

## Worked problems

### Problem 1: the duplicate documents

**Restatement.** There are $m \le 1000$ documents, each of length at most $n \le 10^5$. Report every pair of documents that share a substring of length at least $k$.

**Naive baseline.** Compare every pair of documents character by character, which is $O(m^2 n)$.

**Insight.** A pair of documents shares a long substring exactly when they share a fingerprint at some position, and the fingerprint can be computed for every position in constant time.

**Derivation.** Build the prefix table and the power table for each document. For each document, compute the hash of every window of length $k$ and put it into a table that records the document and the position. Then sort the windows by their hash and report the adjacent pairs that match. Verify each candidate pair with a direct comparison of the two windows.

**Correctness.** Two equal windows have equal hashes, so they land in the same bucket or in adjacent buckets of the sorted order, and the program reports them. Two different windows may have equal hashes, and the verification step removes those. So the reported pairs are exactly the true duplicates.

**Complexity.** $O(mn)$ to build the tables, $O(mn \log(mn))$ to sort the windows, and $O(mn)$ for the verifications, since the number of true duplicate pairs is small. The memory is $O(mn)$.

**Common wrong approach.** Skipping the verification step, on the reasoning that a collision is unlikely. The birthday bound says that $10^6$ windows hashed into $10^9$ residues collide about five hundred times, so the skip is not safe.

### Problem 2: the substring equality queries

**Restatement.** There is a string of length $n \le 10^6$ and $q \le 10^6$ queries, each asking whether two substrings of the same length are equal. Report the answer to each query.

**Naive baseline.** Compare the substrings directly, which is $O(q \cdot \text{length})$.

**Insight.** The substring hash is a combination of two prefix hashes, so the query is constant time.

**Derivation.** Build the tables once. For a query about $[l_1, r_1)$ and $[l_2, r_2)$, compute the two hashes and compare them. When they match, compare the substrings directly if the answer must be exact.

**Correctness.** Equal substrings have equal hashes, so no true match is lost. A hash match is a necessary but not sufficient condition, so the verification step decides the answer when it is required.

**Complexity.** $O(n)$ preprocessing, $O(1)$ per hash query, and $O(\text{length})$ per verification. The verifications dominate only when the queries are mostly true matches.

**Common wrong approach.** Comparing a prefix hash with a substring hash, which is meaningless because the two hashes are of different strings. The program then reports every query as unequal, which is a plausible-looking answer.

### Problem 3: the single random base

**Restatement.** The same as Problem 2, but the problem statement asks for the probability of a wrong answer to be less than $10^{-9}$ over a million queries, and it will accept a randomized algorithm.

**Naive baseline.** A single hash with a fixed base, whose collision probability over the queries is about $5 \times 10^{-4}$ by the birthday bound.

**Insight.** The base must be chosen at random, because a fixed base is vulnerable to a forced collision, and the two moduli must be independent.

**Derivation.** Use two primes, $M_1 = 1\,000\,000\,007$ and $M_2 = 998\,244\,353$, and two bases $B_1, B_2$ chosen uniformly at random from the residues. The key of a window is the pair of hashes, packed into one 64-bit integer. The probability that a given pair of distinct windows collides is at most $\frac{k-1}{M_1 - 1} \cdot \frac{k-1}{M_2 - 1}$, and the probability that some pair among the $10^6$ windows collides is at most $500$ times that, which is below $10^{-9}$ for a window length below $10^4$.

**Correctness.** The collision bound above is the theorem of the formal model, applied to two independent bases. The independence is what makes the two bounds multiply, and it is why the bases must not be the same.

**Complexity.** The same as Problem 2, with two tables per string and two modular multiplications per query.

**Common wrong approach.** Using two moduli with the same base, on the reasoning that two moduli are better than one. The two hashes are then strongly correlated, and the probability of a collision is far from the square of the single-hash probability.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about substring equality, and count the number of comparisons the problem will make.
2. **Direct application.** Build the prefix and power tables and implement the substring query, and check it against a direct hash computation on random strings.
3. **Adaptation.** Write the double-hash version, the version with a randomized base, and the version that verifies a match directly.
4. **Combination.** Combine the hash with a sort to find the duplicated windows, and combine it with a [suffix array](/algorithms/strings/suffix-array) to find the exact answer.
5. **Challenge.** Implement the version with the Mersenne prime $2^{61} - 1$ and 128-bit arithmetic, and measure the difference against the $10^9$ version.
6. **Transfer.** Recognize a hash problem in a different shape: the sum of random per-element hashes for comparing multisets, the recursive hash of a tree, or the hash of a matrix.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the polynomial hash and the substring hash formula. (Algorithm derivation)
2. Why is the base required to be larger than the largest character value? (Algorithm selection)
3. What does the collision probability theorem say, and what does it depend on? (Formal model)
4. How many collisions does a single $10^9$ modulus produce over a million distinct substrings? (Formal model)
5. What are `Aa` and `BB`, and why does the collision defeat every modulus? (Common mistakes)
6. What are the three ways to make the answer exact when a single hash is used? (Common mistakes)
7. Why must the negative residue be handled, and in which languages? (Implementation walkthrough)
8. Why does a double hash need two independent bases? (Variants and extensions)
9. What is the cost of the preprocessing, and what happens if the power table is not built? (Complexity analysis)
10. When does a suffix array beat a rolling hash, and what does it cost? (Algorithm selection)
11. What is the recursion depth of the recursive hash of a tree, and when is it dangerous? (Recursion decision)

## Further reading

- The subject index lists this technique, [rolling hash](/algorithms/strings/rolling-hash), beside the other string algorithms in the encyclopedia.
- The deterministic alternative, which answers the same questions with no failure mode, is in [the suffix array](/algorithms/strings/suffix-array).
- The exact linear-time pattern search, which is the right tool when the question is "does this pattern occur", is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The other exact linear-time string algorithm, which computes the longest match with the whole string at every position, is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The arithmetic that keeps a large count inside a machine word is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The bit arithmetic that the overflow variant of the hash relies on is in [binary representation](/algorithms/foundations/binary-representation).
- The subject overview is at [the strings](/algorithms/strings/).
