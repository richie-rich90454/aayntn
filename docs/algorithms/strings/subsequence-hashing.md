---
id: strings.subsequence-hashing
title: String hashing of subsequences
summary: Compare the strings obtained by deleting a character in constant time by recombining a prefix hash and a suffix hash, instead of rebuilding either string.
division: [gold]
subjects: [strings]
level: intermediate
importance: specialized-technique
keywords:
    [
        subsequence hashing,
        deletion hash,
        prefix hash,
        suffix hash,
        string comparison,
        character removal,
        concatenation hash,
    ]
prerequisites:
    required: [foundations.complexity, strings.rolling-hash]
    recommended: [number-theory.modular-arithmetic, foundations.binary-representation]
complexity:
    time: "O(n + q) for one string and q queries"
    space: "O(n) for the prefix, suffix and power tables"
assumptions:
    - The string is static, so the prefix and suffix tables are built once and reused by every query.
    - The modulus is prime and larger than the largest normalized character value, so the polynomial hash is well defined.
    - A collision is either accepted as negligible, made negligible with a double hash, or removed by comparing the two candidates directly.
implementations: strings.subsequence-hashing
reviewed: false
---

## At a glance

A **subsequence** of a string is what remains after some characters are deleted. The simplest subsequence deletes exactly one character. Given a string $s$ of length $n$ and an index $i$, write $D_i$ for the string obtained by deleting $s_i$:

$$
D_i = s_0 s_1 \dots s_{i-1} s_{i+1} \dots s_{n-1}.
$$

The question is whether $D_i = D_j$ for a pair of indices. Rebuilding both strings takes $O(n)$ time per query, which is too slow when there are $q$ queries and both $n$ and $q$ reach $10^6$.

The fix is to notice that $D_i$ is a **concatenation of two pieces of the original string**, a prefix and a suffix. A polynomial hash does not preserve concatenation by addition, but it does obey a simple rule:

$$
\operatorname{hash}(XY) = \bigl(\operatorname{hash}(X) \cdot B^{\lvert Y \rvert} + \operatorname{hash}(Y)\bigr) \bmod M.
$$

Build a table of prefix hashes and a table of suffix hashes. The hash of $D_i$ is then

$$
\Delta(i) = \bigl(H[i] \cdot B^{n-1-i} + R[i+1]\bigr) \bmod M,
$$

where $H[i]$ is the hash of $s[0 \dots i)$ and $R[i+1]$ is the hash of $s[i+1 \dots n)$. Both are table lookups, the power is a table lookup, and each side of the query becomes one multiplication and one addition. Preprocessing is $O(n)$ and each query is $O(1)$, for $O(n+q)$ total time and $O(n)$ memory.

This is the natural extension of the [rolling hash](/algorithms/strings/rolling-hash) from substrings to subsequences. A substring is a contiguous window, and its hash is a subtraction of two prefix hashes. A subsequence has a hole, and its hash is a recombination of a prefix hash and a suffix hash. The price is the same: a hash can collide, so the equality test is probabilistic unless the candidates are verified.

## Problem motivation

A version control system stores two revisions of a text and asks whether one can be turned into the other by deleting a single character. A spell checker asks whether a typed word is one missing letter away from a dictionary word. A genome pipeline asks whether two reads become identical after removing one noisy base. Each of these is a deletion query, and each arrives many times against the same reference string.

The direct method writes down $D_i$ and $D_j$ and compares them. That is two copies of $n-1$ characters per query, so the total is $O(nq)$ characters copied. With $n = q = 10^6$ that is $10^{12}$ characters, far beyond any contest limit. Even avoiding the copies does not help: comparing the two strings character by character is still $O(n)$ per query in the worst case, because the two results can agree until their last position.

The amount of **useful state** is small. Both $D_i$ and $D_j$ are almost the same string; they differ only in the region between the two deleted positions. The query is really about that region, and the region has length $\lvert i - j \rvert$, which can be large, but its hash can be assembled from the tables in constant time. The whole technique is a way of exposing that state without copying anything.

There is a second motivation that appears in harder problems. A program that repeatedly deletes a substring, as in [Censoring](/algorithms/strings/kmp), keeps a shrinking string. Its current contents are a subsequence of the input, and every deletion joins a prefix to a suffix. A hash of the surviving string that can be maintained across those joins turns the repeated search into a linear scan. The one-character query is the smallest instance of that larger pattern.

## Recognition patterns

Subsequence hashing is the right tool when the statement has most of these features.

- The question asks whether two strings become equal after **deleting one character**, or after deleting the same number of characters from known positions.
- The question asks whether two strings are **one substitution apart**. Deleting the mismatching position from both turns the substitution into an equality of subsequences.
- A string is built or destroyed by **joining a prefix to a suffix**, and the join is repeated many times.
- There are **many queries** against one static string, so an $O(n)$ preprocessing step is amortized.
- The two pieces around the hole are long, so rebuilding or comparing them directly is expensive.
- The answer tolerates a negligible collision probability, or the candidate matches can be verified.

The constraint values that decide the technique:

| Constraint | What it rules |
| --- | --- |
| One query, or a handful | Rules out the technique; rebuild the string and compare |
| $q$ in the thousands and $n$ in the hundreds | Rules out the technique; the direct comparison is simpler |
| $q$ and $n$ both around $10^5$ | Rules in the technique |
| The string changes between queries | Rules out the static tables; a segment tree or a rebuild is required |
| Deletions at many arbitrary positions per query | Requires a structure over the complement, not one table |
| The answer must be exact with no verification | Requires a double hash, a verification step, or a deterministic structure |
| The alphabet is large or the text is Unicode | Requires normalization to integer values first |

The last row is the same warning as for a rolling hash. A polynomial hash is defined over the **character values**, and a multi-byte character contributes several values if the program hashes raw bytes. Normalize the alphabet before building the tables.

The row about exactness deserves emphasis. This technique answers "are the hashes equal", which is not the same question as "are the strings equal". The gap is a collision, and the collision analysis below says when the gap is negligible and when it is not.

## Naive approach

The baseline builds both results and compares them.

```python
def delete_at(text, index):
    return text[:index] + text[index + 1:]

def same(text, i, j):
    return delete_at(text, i) == delete_at(text, j)
```

This is correct, and it is the reference implementation for a differential test. The slicing allocates two strings of length $n-1$, so a query costs $O(n)$ time and $O(n)$ temporary memory, and $q$ queries cost $O(nq)$.

The second baseline avoids the copies but not the comparisons. For $i < j$, the two results share the prefix before $i$ and the suffix after $j$, so the only part that can differ is the middle:

```python
def same_without_copy(text, i, j):
    if i > j:
        i, j = j, i
    return text[i + 1:j + 1] == text[i:j]
```

This is the shifted-window form of the query. It is correct, it uses $O(1)$ extra space beyond the slices, and it still costs $O(j-i)$ character comparisons. When the two indices are far apart, that is $O(n)$ per query.

The third baseline is the hash computed from scratch. It walks the $n-1$ characters of $D_i$ and evaluates the polynomial, which is $O(n)$ per query and buys nothing over a direct comparison. It is useful for checking the formula on small cases:

```python
def slow_deletion_hash(text, index, base, mod):
    value = 0
    for position, character in enumerate(text):
        if position == index:
            continue
        value = (value * base + ord(character)) % mod
    return value
```

The point of the rolling construction is that the hash of the long middle is assembled from the hashes of two short prefixes, not recomputed from its characters. The next section states the rule that makes that possible.

## Key insight

A hash is not linear, but it is **multiplicative in the length of the concatenation**. If $X$ has length $a$ and $Y$ has length $b$, then

$$
\operatorname{hash}(XY) = \operatorname{hash}(X) \cdot B^{b} + \operatorname{hash}(Y) \pmod M.
$$

The reason is visible in the definition. Every character of $X$ moves $b$ places to the left when $Y$ is appended, so its weight is multiplied by $B^b$, and the characters of $Y$ keep their original weights. Expanding both sides gives the identity.

Deleting $s_i$ is exactly a concatenation: the prefix before $i$ is followed by the suffix after $i$. The prefix hash is available in a table, and the suffix hash is available in a second table. The only missing ingredient is the multiplier $B^{n-1-i}$, because the suffix has length $n-1-i$ and the prefix must be shifted past it. That multiplier is available in a table of powers.

So the whole query is a recombination of three table entries. The hash of the deleted string is

$$
\Delta(i) = H[i] \cdot B^{n-1-i} + R[i+1] \pmod M.
$$

For two indices $i < j$, the result has an even simpler reading. Write the two deleted strings as three pieces:

$$
D_i = s[0 \dots i) + s[i+1 \dots j+1) + s[j+1 \dots n),
$$

$$
D_j = s[0 \dots i) + s[i \dots j) + s[j+1 \dots n).
$$

The first and last pieces are identical in both strings. The middle pieces have the same length, $j-i$. Therefore

$$
D_i = D_j \quad \text{if and only if} \quad s[i+1 \dots j+1) = s[i \dots j).
$$

This is the **shifted-window** view: deleting the left index slides the middle window one position to the right. The hash of each window comes from the same prefix table, and the comparison is constant time. The two views are equivalent; the suffix-table view is the one that generalizes to deleting blocks and to concatenating pieces that do not come from the same string.

A consequence worth noticing is that if $i < j$ and $D_i = D_j$, then every character from $s_i$ to $s_j$ is equal. The shifted-window equality compares $s_{i+1+t}$ with $s_{i+t}$ for every $t$, which is exactly the statement that adjacent characters in the range agree. So the answer to this particular query is SAME exactly when the range from $i$ to $j$ is a block of one repeated character. This gives a deterministic shortcut for the single-character version, and [Algorithm selection](#algorithm-selection) returns to it. The hash is what handles the general case, where the deleted pieces are longer, the two strings do not come from the same source, or the query asks for a whole family of deletions.

## Visual intuition

Take $s = \texttt{aabbaa}$ and the three pairs $(0, 1)$, $(2, 3)$ and $(0, 2)$.

```text
s         a  a  b  b  a  a
indices   0  1  2  3  4  5

delete 0  a  b  b  a  a
delete 1  a  b  b  a  a

delete 2  a  a  b  a  a
delete 3  a  a  b  a  a

delete 0  a  b  b  a  a
delete 2  a  a  b  a  a
```

The first two pairs delete one of two adjacent equal characters, and the results are the same. The third pair deletes an `a` and a `b`, and the results differ at the second position.

The piece decomposition shows why. For the pair $(0, 2)$:

| Piece                 | $D_0$                        | $D_2$                        |
| --------------------- | ---------------------------- | ---------------------------- |
| prefix $s[0 \dots 0)$ | empty                        | empty                        |
| middle                | $s[1 \dots 3) = \texttt{ab}$ | $s[0 \dots 2) = \texttt{aa}$ |
| suffix $s[3 \dots 6)$ | $\texttt{baa}$               | $\texttt{baa}$               |

The two results are the same length, and their outer pieces are identical, so the comparison reduces to the two middle strings. The middle window for $D_0$ starts at $1$, and the middle window for $D_2$ starts at $0$. Both have length $2$.

The same picture in terms of the tables:

```text
H:   H[0]  H[1]  H[2]  H[3]  H[4]  H[5]  H[6]
     0     1     32    ...   ...   ...   ...

R:   R[0]  R[1]  R[2]  R[3]  R[4]  R[5]  R[6]
     ...   ...   ...   ...   ...   1     0
```

The deletion hash takes the prefix entry on the left, multiplies it by the power that matches the length of the remaining suffix, and adds the suffix entry on the right. The hole moves the cut between the two tables, but neither table is modified.

The pair $(2, 3)$ is the same picture with the cut one position to the right. The prefix before $2$ is `aa`, the middle is the single `b` on either side of the cut, and the suffix after $3$ is `aa`. The deletion hashes agree because the middle strings agree.

## Formal model

Let $s$ be a string of length $n$ over an alphabet whose characters have normalized values $v(s_0), \dots, v(s_{n-1})$, all smaller than the modulus $M$. Let $B$ be the base, with $1 < B < M$.

::: math definition Definition
For a string $t$ of length $m$, the **polynomial hash** is

$$
\operatorname{hash}(t) = \sum_{k=0}^{m-1} v(t_k) \, B^{m-1-k} \bmod M.
$$

The hash of the empty string is zero.
:::

::: math definition Definition
The **prefix hash** table $H$ and the **power** table $P$ are

$$
H[0] = 0, \qquad H[i+1] = \bigl(H[i] \cdot B + v(s_i)\bigr) \bmod M,
$$

$$
P[0] = 1, \qquad P[i+1] = \bigl(P[i] \cdot B\bigr) \bmod M.
$$

The **suffix hash** table $R$ is

$$
R[n] = 0, \qquad R[i] = \bigl(v(s_i) \cdot P[n-1-i] + R[i+1]\bigr) \bmod M.
$$
:::

The suffix table is not the prefix table of the reversed string. It stores the hash of $s[i \dots n)$ with $s_i$ at the top weight $B^{n-1-i}$. The prefix table of the reversed string puts $s_i$ at the bottom weight instead, so the two tables differ in the order of their characters and in their alignment. Building $R$ backward with the same powers avoids both differences, and it is what makes the concatenation formula a plain addition instead of a division by a power.

::: math definition Definition
The **deletion** at index $i$ is the string

$$
D_i = s[0 \dots i) + s[i+1 \dots n),
$$

and its hash is written $\Delta(i) = \operatorname{hash}(D_i)$.
:::

::: math lemma Lemma
For strings $X$ and $Y$ of lengths $a$ and $b$,

$$
\operatorname{hash}(XY) = \bigl(\operatorname{hash}(X) \cdot B^{b} + \operatorname{hash}(Y)\bigr) \bmod M.
$$
:::

::: math proof Proof
Unrolling the definition of the hash of $XY$ splits the sum at the boundary between $X$ and $Y$:

$$
\operatorname{hash}(XY) = \sum_{k=0}^{a-1} v(X_k) B^{a+b-1-k} + \sum_{k=0}^{b-1} v(Y_k) B^{b-1-k}.
$$

The first sum is $B^b$ times $\sum_{k} v(X_k) B^{a-1-k}$, which is $B^b \operatorname{hash}(X)$. The second sum is $\operatorname{hash}(Y)$. $\square$
:::

::: math lemma Lemma
For every $0 \le i < n$,

$$
\Delta(i) = \bigl(H[i] \cdot P[n-1-i] + R[i+1]\bigr) \bmod M.
$$
:::

::: math proof Proof
$D_i$ is the concatenation of the prefix of length $i$ and the suffix of length $n-1-i$. By the concatenation lemma, its hash is the prefix hash times $B^{n-1-i}$, plus the suffix hash. The table $H[i]$ holds the prefix hash by definition, $P[n-1-i]$ holds the power, and $R[i+1]$ holds the suffix hash by definition. $\square$
:::

::: math lemma Lemma
For $0 \le i < j < n$, the strings $D_i$ and $D_j$ are equal if and only if

$$
s[i+1 \dots j+1) = s[i \dots j).
$$
:::

::: math proof Proof
The common prefix $s[0 \dots i)$ occupies the first $i$ positions of both results. The common suffix $s[j+1 \dots n)$ occupies the last $n-1-j$ positions of both results. What remains of $D_i$ is $s[i+1 \dots j+1)$ and what remains of $D_j$ is $s[i \dots j)$, both of length $j-i$. Two strings of equal length are equal exactly when their remaining middle pieces are equal. $\square$
:::

::: math lemma Corollary
For $0 \le i < j < n$, the strings $D_i$ and $D_j$ are equal if and only if

$$
s_i = s_{i+1} = \dots = s_j.
$$
:::

::: math proof Proof
The middle equality of the previous lemma compares $s_{i+1+t}$ with $s_{i+t}$ for every $0 \le t < j-i$. Those are exactly the adjacent pairs inside the range from $i$ to $j$. $\square$
:::

::: math lemma Lemma
If $D_i = D_j$, then $\Delta(i) = \Delta(j)$.
:::

::: math proof Proof
Equal strings have equal characters at every position, so the two polynomial expressions are identical term by term, and their residues modulo $M$ are equal. $\square$
:::

::: math definition Definition
Two distinct strings $u$ and $v$ of the same length **collide** under the parameters $(B, M)$ when $\operatorname{hash}(u) = \operatorname{hash}(v)$.
:::

::: math theorem Theorem
Let $M$ be prime, let $B$ be chosen uniformly at random from $\{1, 2, \dots, M-1\}$, and let $u \ne v$ be two strings of length $L$ whose character values are all smaller than $M$. The probability that $u$ and $v$ collide is at most

$$
\frac{L-1}{M-1}.
$$
:::

::: math proof Proof
The difference of the two hashes is the polynomial $Q(B) = \sum_{k=0}^{L-1} (v(u_k) - v(v_k)) B^{L-1-k}$ evaluated at the chosen base. Since $u \ne v$, at least one coefficient is nonzero, so $Q$ is a nonzero polynomial of degree at most $L-1$ over the field of residues modulo the prime $M$. A nonzero polynomial of degree $d$ over a field has at most $d$ roots, so at most $L-1$ of the $M-1$ possible bases make $Q(B) = 0$. $\square$
:::

The bound is per comparison, and it grows with the length of the compared strings. That is the important difference from the naive "one in $M$" intuition. For a deletion query at $n = 10^6$, a single hash with $M$ near $10^9$ has a per-query collision probability of about $10^{-3}$, and a program that answers $q = 10^6$ queries has a union bound of about $10^3$. A single $10^9$ modulus is therefore not safe at the extreme limits, no matter how the base is chosen. A double hash makes the per-query probability roughly the square, which brings the union bound back to about one at those limits, and a verification step removes the risk entirely.

## Algorithm derivation

The construction has three loops and one query expression.

### Building the powers and prefix hashes

```text
P[0] = 1
for i from 1 to n:
    P[i] = P[i - 1] * B mod M

H[0] = 0
for i from 0 to n - 1:
    H[i + 1] = (H[i] * B + value(s[i])) mod M
```

Both loops are $O(n)$. The power table is needed because the query multiplies a prefix hash by $B^{n-1-i}$; without it, every query would need a modular exponentiation and the technique would lose its point.

### Building the suffix hashes

```text
R[n] = 0
for i from n - 1 down to 0:
    R[i] = (value(s[i]) * P[n - 1 - i] + R[i + 1]) mod M
```

This loop is also $O(n)$, and it is the only place where the alignment is decided. The character $s_i$ is at the top of the suffix $s[i \dots n)$, whose length is $n-i$, so its weight is $B^{n-1-i}$. A backward loop is enough; the string is never reversed.

### Answering a query

```text
difference(i) = (H[i] * P[n - 1 - i] + R[i + 1]) mod M
answer = SAME if difference(i) == difference(j) else DIFFERENT
```

Each query performs two multiplications, two additions, and one comparison. The indices are the only input that changes between queries.

### The shifted-window alternative

For $i < j$, the same question can be answered with one range comparison:

```text
range(l, r) = (H[r] - H[l] * P[r - l]) mod M
answer = SAME if range(i + 1, j + 1) == range(i, j) else DIFFERENT
```

This version needs only the prefix and power tables, so it saves one table. It has a subtraction, and a subtraction modulo $M$ can produce a negative residue in C, C++, Java and Pascal, so the implementation must add $M$ when the value is negative. The implementations in this article use the suffix-table form because it is the form that extends to deleting a block and to concatenating arbitrary pieces; the shifted-window form is a useful cross-check.

### Choosing the parameters

The base must be larger than the largest normalized character value, or the polynomial can collide for a trivial reason. For a lowercase alphabet with values $1$ through $26$, any base above $26$ works. The base also has to be smaller than $M$, so that its residues are not reduced before the first multiplication.

The modulus should be a large prime. A prime modulus makes the collision theorem exact, because the residues form a field. The size of the modulus is a separate decision, and it interacts with the language. A modulus near $10^9$ keeps every product inside a signed 64-bit integer, but the product of two residues is near $10^{18}$, which is not exactly representable in a JavaScript `Number` and is not exactly representable in the emulated `Int64` of a Pascal-to-JavaScript compiler. The reference implementations therefore use $M = 90\,000\,049$ and $B = 8\,000\,011$, so that $(M-1)^2 \approx 8.1 \times 10^{15}$ stays below $2^{53} \approx 9.0 \times 10^{15}$. That makes every product exact in all six languages without a wider integer type. The price is a smaller residue space, which is another reason to use a double hash on a large input.

::: math invariant Invariant
After the build, $H[i]$ is the polynomial hash of $s[0 \dots i)$, $R[i]$ is the polynomial hash of $s[i \dots n)$, and $P[i]$ is $B^i \bmod M$. The three tables are never modified, so every query sees the same values that the definitions give.
:::

## Step-by-step execution

Take $s = \texttt{aab}$, $n = 3$, base $B = 31$ and modulus $M = 1\,000\,000\,007$. The character values are $a = 1$ and $b = 2$. The base is small so the arithmetic can be checked by hand; the programs use a larger base and a smaller modulus, for the reason given above.

The power table:

| $i$ | $P[i]$  |
| --- | ------- |
| 0   | 1       |
| 1   | 31      |
| 2   | 961     |
| 3   | 29\,791 |

The prefix table, built left to right:

| $i$ | $H[i]$ | How it was computed |
| --- | ------ | ------------------- |
| 0   | 0      | the empty prefix    |
| 1   | 1      | $0 \cdot 31 + 1$    |
| 2   | 32     | $1 \cdot 31 + 1$    |
| 3   | 994    | $32 \cdot 31 + 2$   |

The suffix table, built right to left:

| $i$ | $R[i]$ | How it was computed   |
| --- | ------ | --------------------- |
| 3   | 0      | the empty suffix      |
| 2   | 2      | $2 \cdot 31^{0} + 0$  |
| 1   | 33     | $1 \cdot 31^{1} + 2$  |
| 0   | 994    | $1 \cdot 31^{2} + 33$ |

Now the three deletion hashes:

$$
\Delta(0) = H[0] \cdot P[2] + R[1] = 0 \cdot 961 + 33 = 33,
$$

$$
\Delta(1) = H[1] \cdot P[1] + R[2] = 1 \cdot 31 + 2 = 33,
$$

$$
\Delta(2) = H[2] \cdot P[0] + R[3] = 32 \cdot 1 + 0 = 32.
$$

The results are the strings $D_0 = \texttt{ab}$, $D_1 = \texttt{ab}$ and $D_2 = \texttt{aa}$, whose hashes are $1 \cdot 31 + 2 = 33$, $33$ and $1 \cdot 31 + 1 = 32$. The table values agree with the direct computation.

The queries:

| Query    | $\Delta(i)$ | $\Delta(j)$ | Output    |
| -------- | ----------- | ----------- | --------- |
| $(0, 1)$ | 33          | 33          | SAME      |
| $(0, 2)$ | 33          | 32          | DIFFERENT |
| $(1, 2)$ | 33          | 32          | DIFFERENT |
| $(2, 2)$ | 32          | 32          | SAME      |

The shifted-window check gives the same answers. For $(0, 1)$, compare $s[1 \dots 2) = \texttt{a}$ with $s[0 \dots 1) = \texttt{a}$: equal. For $(0, 2)$, compare $s[1 \dots 3) = \texttt{ab}$ with $s[0 \dots 2) = \texttt{aa}$: different. For $(1, 2)$, compare $s[2 \dots 3) = \texttt{b}$ with $s[1 \dots 2) = \texttt{a}$: different.

The point of the trace is not the number $33$. It is that the query used one multiplication and one addition per deletion, while the naive rebuild copied two characters per query and would copy $n-1$ characters on a larger input. The preprocessing paid for all of it.

## Correctness proof

::: math theorem Theorem
The prefix table satisfies $H[i] = \operatorname{hash}(s[0 \dots i))$ for every $0 \le i \le n$, and the suffix table satisfies $R[i] = \operatorname{hash}(s[i \dots n))$ for every $0 \le i \le n$.
:::

::: math proof Proof
The prefix claim is an induction on $i$. For $i = 0$ both sides are the hash of the empty string, which is zero. If $H[i] = \sum_{k=0}^{i-1} v(s_k) B^{i-1-k}$, then

$$
H[i+1] = \Bigl(\sum_{k=0}^{i-1} v(s_k) B^{i-1-k}\Bigr) B + v(s_i)
= \sum_{k=0}^{i} v(s_k) B^{i-k},
$$

which is the hash of the first $i+1$ characters. The suffix claim is the same induction read from the other end: $R[n]$ is zero, and prepending $s_i$ to a string of length $n-1-i$ multiplies the old hash by $B$ and adds $v(s_i) B^{n-1-i}$, which is exactly the definition of $R[i]$. $\square$
:::

::: math theorem Theorem
For every index $i$, the value $\Delta(i)$ computed by the program is the polynomial hash of $D_i$.
:::

::: math proof Proof
By the table theorem, $H[i]$ is the hash of the prefix and $R[i+1]$ is the hash of the suffix. The concatenation lemma applies to the prefix and the suffix, whose total length is $n-1$, and gives $H[i] B^{n-1-i} + R[i+1]$, which is the formula the program evaluates. $\square$
:::

::: math theorem Theorem
If $D_i = D_j$, the program prints `SAME`. If the hash of $D_i$ differs from the hash of $D_j$, the program prints `DIFFERENT` and the two strings are indeed different.
:::

::: math proof Proof
If the strings are equal, the hash theorem gives $\Delta(i) = \Delta(j)$, so the comparison succeeds and the program prints `SAME`. If the hashes differ, the strings cannot be equal, because equal strings would have equal hashes; so the program prints `DIFFERENT` correctly. The only case the theorem does not settle is equal hashes with different strings, which is a collision. $\square$
:::

The program is therefore correct **unless a collision occurs**. The collision theorem bounds the probability of that event for a random base, and the discussion below says what to do when the bound is not good enough.

::: math invariant Invariant
Before the query loop starts, the three tables hold exactly the values in the definitions, and their length is $n+1$. Every query reads only entries with indices between $0$ and $n$, because $i$ and $j$ are at least $0$ and at most $n-1$, so $i+1 \le n$ and $n-1-i \ge 0$.
:::

## Complexity analysis

| Quantity                  | Cost                        |
| ------------------------- | --------------------------- |
| Building the power table  | $O(n)$ time                 |
| Building the prefix table | $O(n)$ time                 |
| Building the suffix table | $O(n)$ time                 |
| One deletion hash         | $O(1)$ time                 |
| One query                 | $O(1)$ time                 |
| $q$ queries               | $O(q)$ time                 |
| Total                     | $O(n + q)$ time             |
| Space                     | $O(n)$ for the three tables |
| Output                    | $O(q)$ characters           |

The memory is three arrays of $n+1$ 64-bit values, which is about $24$ megabytes at $n = 10^6$. The shifted-window form needs only the prefix and power tables, which is about $16$ megabytes, at the cost of a subtraction and the negative-residue handling. A double hash doubles the table memory and the query work; a 64-bit overflow hash keeps two tables, the prefix and the power, and avoids the modulus entirely.

The comparison with the naive method is the reason the technique exists. Rebuilding both strings is $O(n)$ per query, so $q$ queries cost $O(nq)$, which is $10^{12}$ character operations at the upper limits. The hash preprocessing is $O(n)$ once, and every query is a constant number of arithmetic operations. The constant is small but not free: the query does two modular multiplications, and modular multiplication is the expensive operation on most machines.

There is also a deterministic alternative for the exact query of this article: since $D_i = D_j$ exactly when the range from $i$ to $j$ is a block of one repeated character, a table that records the nearest position to the left with a different character answers each query in $O(1)$ with no collision probability. That table is built in $O(n)$ time and $O(n)$ space, with one integer per position. It is the better choice when the problem is **only** the single-character query. The hash is the better choice when the deletion is longer, when the comparison is against a different string, or when the same machinery has to serve several kinds of query.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Compare two single-character deletions, many queries | This technique, or the run-length table for an exact answer |
| Delete a block $[l, r)$ and compare the results | The same formula with $\Delta(l, r) = H[l] P[n-r] + R[r]$ |
| Compare every deletion against one fixed target string | Hash the target once, then compare it with each $\Delta(i)$ |
| Decide whether two strings are one substitution apart | Delete the mismatching position from both and compare the deletion hashes |
| Find the longest suffix of one string equal to a prefix of another | Compare a suffix hash with a prefix hash, as in Compress Words |
| Delete many separate characters in one query | A segment tree over the string with a hash monoid, or $O(k)$ pieces for $k$ deletions |
| The string changes between queries | A segment tree or a balanced tree that maintains the hash, not a static table |
| One query, or a few | Rebuild the string and compare directly |
| The answer must be exact with no verification | A double hash and a verification step, or a deterministic structure |
| The comparison is between substrings of the same string | The ordinary rolling hash, which needs only the prefix table |

The first row is the honest caveat. The run-length table is exact and simpler for the exact query of this article, so a contestant who recognizes the corollary should use it. The hash earns its place in the other rows, where the deleted region is not a single character or the second string is not a deletion of the first.

The row about one substitution is the bridge to dictionary problems. Two equal-length strings differ in exactly one position when deleting that position from both leaves the same string, and the deletion hash of each is a prefix-suffix recombination. Watto and Mechanism is the standard example, and it is worked below.

The row about a segment tree is the dynamic version. A node stores the length of its segment and the hash of its characters. Merging two adjacent nodes uses the concatenation formula, so the root hash is maintained under point updates in $O(\log n)$. The same structure answers a query that deletes a block by hashing the two remaining pieces and merging them. This is more code than the static tables, but it is the only option when the string changes.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal and JavaScript. They implement the same contract.

- The first line holds the string $s$, a nonempty string of lowercase Latin letters, with $\lvert s \rvert \le 10^6$.
- The second line holds the number of queries $q$.
- The next $q$ lines each hold two integers $i$ and $j$, with $0 \le i, j < \lvert s \rvert$. The indices are **0-based**: index $0$ is the first character.
- The program prints $q$ lines. Line $k$ holds `SAME` when deleting $s_i$ and deleting $s_j$ give the same string, and `DIFFERENT` otherwise.

Every version builds the power table, the prefix table and the suffix table, then answers each query with the formula $\Delta(i) = H[i] P[n-1-i] + R[i+1]$. C, C++ and Java use signed 64-bit integers. Python uses arbitrary-precision integers. Pascal uses `Int64` and 1-based string indexing, and JavaScript uses `Float64Array`.

The parameters are $M = 90\,000\,049$ and $B = 8\,000\,011$. The modulus is prime, and $(M-1)^2$ is below $2^{53}$, so the product of two residues is an exact integer in a JavaScript `Number` and in the emulated `Int64` of pas2js. That choice keeps all six programs free of a wider integer type. It also means the single hash is weaker than a $10^9$ modulus; the programs are reference implementations of the arithmetic, not a claim that one hash is enough at the upper limits.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and are compiled and run by the same validation as the other four. The Pascal variant strips a carriage return from the input line, reads one argument per `Read`, and uses dynamic arrays of `Int64`. The JavaScript variant collects the standard input with the stream events and writes all answers at once.

The sources are under `implementations/strings/subsequence-hashing/`, with one directory per language and the source file named in the manifest. The manifest carries the time and space of every variant, its input and output contract, and the verification status.

## Recursion decision

The construction is iterative, and there is no recursive formulation that helps. The prefix table is a fold over the characters, the suffix table is the same fold from the other end, and both have a natural depth of $n$. A recursive version would use one stack frame per character, which is a guarantee of failure at $n = 10^6$ in every language.

| Language   | Practical recursion depth            | Recommendation |
| ---------- | ------------------------------------ | -------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative      |
| Java       | About $10^4$ frames                  | Iterative      |
| Python     | The interpreter limit of 1000        | Iterative      |
| Pascal     | The operating system stack           | Iterative      |
| JavaScript | About $10^4$ frames                  | Iterative      |

The recursive formulation that does work is the **segment tree** for a dynamic string. Its depth is $\lceil \log_2 n \rceil$, which is at most $20$ for any input a contest will give, and it is safe in every language. A node stores the length and the hash of its segment, and the merge is the concatenation formula. That recursion is worth writing when the string changes; for a static string, the flat tables are shorter, faster, and use less memory.

The other tempting recursion is the naive one: recurse on every possible deletion and compare the results. That version has depth one and branching $n$, so it is $O(n^2)$ work, and it is exactly what the hash removes. The loop is both shorter and faster.

## Implementation walkthrough

Four quantities decide whether the implementation is correct.

**The alignment.** The prefix before the hole has length $i$, and the suffix after the hole has length $n-1-i$. The prefix must be shifted past the whole suffix, so its multiplier is $B^{n-1-i}$. The suffix table already stores its characters at those weights, so it is added without a multiplier.

**The table indices.** The prefix hash of the first $i$ characters is $H[i]$, not $H[i+1]$. The suffix after the deleted character starts at $i+1$, so its entry is $R[i+1]$, not $R[i]$. Including the deleted character in either piece produces the hash of the original string, or a hash of the wrong length.

**The arithmetic type.** The product of two residues is near $M^2$. With $M$ near $10^9$, that is near $10^{18}$, which fits a signed 64-bit integer but not a 32-bit one. JavaScript `Number` is exact only below $2^{53}$, and the emulated `Int64` of pas2js has the same limit, so a $10^9$ modulus needs `BigInt` in JavaScript and a split multiplication in Pascal. The reference implementations avoid both by choosing $M$ below $\sqrt{2^{53}}$.

**The negative residue.** The suffix-table formula adds only nonnegative values, so it never produces a negative residue. The shifted-window formula subtracts, and C, C++, Java and Pascal return a value with the sign of the dividend, so the result must be normalized by adding $M$ when it is negative. A program that skips the normalization compares a negative hash with a positive one and reports every query as different.

A compact version of the build and the query:

```cpp
for (int i = 0; i < n; ++i) {
    prefix[i + 1] = (prefix[i] * base + (s[i] - 'a' + 1)) % mod;
}
for (int i = n - 1; i >= 0; --i) {
    suffix[i] = ((s[i] - 'a' + 1) * power[n - 1 - i] + suffix[i + 1]) % mod;
}

long long deletion_hash(int i) {
    return (prefix[i] * power[n - 1 - i] + suffix[i + 1]) % mod;
}
```

The query loop is then two calls and a comparison. The input indices are used directly when they are 0-based; if the statement numbers positions from $1$, subtract one at the input boundary and keep the rest of the code 0-based. Mixing the two conventions inside the tables is the most common source of an index that is off by one.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Rebuilding $D_i$ for every query | $O(n)$ work per query, $O(nq)$ total | Build the tables once |
| Using $P[n-i]$ instead of $P[n-1-i]$ | The prefix is shifted one place too far, so the hash is of the wrong length | Count the remaining suffix: $n-1-i$ characters |
| Using $H[i+1]$ for the prefix | The deleted character is included in the prefix | The prefix ends just before $i$ |
| Using $R[i]$ for the suffix | The deleted character is included at the top of the suffix | The suffix starts just after $i$ |
| Mixing 1-based input with 0-based tables | Every query reads the wrong characters, often without crashing | Convert at the input boundary |
| Multiplying two residues in 32 bits | Silent overflow when $M$ is near $10^9$ | Use a 64-bit type for the product |
| Using a JavaScript `Number` with a $10^9$ modulus | The product loses precision and the hashes drift | Use `BigInt`, or a modulus below $\sqrt{2^{53}}$ |
| Building the suffix hash of the reversed string directly | The alignment is reversed, so the weights are wrong | Build $R$ backward with $P[n-1-i]$ |
| Trusting a single hash at $n = q = 10^6$ | The union bound is above one, so a wrong answer is likely | Use a double hash or verify the match |
| Comparing deletion hashes of different lengths | The hashes are of different strings, so the comparison is meaningless | Every deletion from the same string has length $n-1$ |

### Why this fails: the power that is off by one

Take $s = \texttt{aab}$, $B = 31$ and a modulus large enough that no reduction occurs. The correct hash of $D_1 = \texttt{ab}$ is $1 \cdot 31 + 2 = 33$.

Three plausible wrong formulas give three different values.

| Wrong formula | Value at $i = 1$ | What it hashes |
| --- | --- | --- |
| $H[i] P[n-i] + R[i+1]$ | $1 \cdot 961 + 2 = 963$ | a length-3 hash with a zero in the middle |
| $H[i+1] P[n-1-i] + R[i+1]$ | $32 \cdot 31 + 2 = 994$ | the original string `aab` |
| $H[i] P[n-1-i] + R[i]$ | $1 \cdot 31 + 33 = 64$ | a malformed sum that counts the deleted character twice |

The first formula shifts the prefix by one character too many. The second includes the deleted character in the prefix, so the result is the hash of the whole string. The third includes it again in the suffix, so the deleted character is counted twice. Each of the three is off by exactly one table entry, and each produces a value that looks like a hash, which is why the bug survives a quick inspection.

The fix is to say the sentence out loud before writing the expression: **the prefix has $i$ characters, the remaining suffix has $n-1-i$ characters, and the prefix is shifted past all of them.** That sentence determines both indices and the exponent.

A second failure mode is the reversed string. It is tempting to compute the prefix hash of `reverse(s)` and use it as $R$. That table is a hash of the reversed string, so its index $k$ corresponds to $s[n-1-k]$, not $s[k]$, and its powers run in the opposite direction. It can be converted, but the conversion has to flip the index and adjust the power, and the result is longer than the backward loop that builds $R$ directly. Build $R$ backward and the alignment is correct by construction.

## Variants and extensions

- **Double hashing.** Use two independent primes and two independent bases, and compare the pair of hashes. The per-query collision probability is roughly the product of the two single-hash probabilities, and the table memory and query work double. This is the standard repair when the limits make a single hash unsafe.
- **Hashing with 64-bit overflow.** Use the natural overflow of an unsigned 64-bit integer instead of a modulus. The analysis is weaker because the modulus is a power of two, but the implementation is short and fast. It is not available in the emulated `Int64` of pas2js, which loses precision above $2^{53}$.
- **The Mersenne prime.** The modulus $2^{61}-1$ gives a large residue space and a cheap reduction, but the products need 128-bit arithmetic. It is the usual choice when a single strong hash is wanted in C++.
- **Deleting a block.** For a block $[l, r)$, the result is $s[0 \dots l) + s[r \dots n)$, and its hash is $H[l] P[n-r] + R[r]$. The formula is the same recombination with a longer hole.
- **Several deletions.** Deleting $k$ characters leaves $k+1$ pieces. Their hashes are table lookups, and the result is assembled left to right with the concatenation formula in $O(k)$. When $k$ is large, a segment tree over the string answers the complement of the deleted set in $O(\log n)$ per piece.
- **One substitution.** Two equal-length strings differ in exactly one position when deleting that position from both gives the same string. The deletion hash of each is a prefix-suffix recombination, so a dictionary of strings can be indexed by length and hash.
- **Overlap hashing.** The longest suffix of $A$ that equals a prefix of $B$ is the largest $k$ with a suffix hash of $A$ equal to a prefix hash of $B$. This is the concatenation formula without a deletion, and it is the core of Compress Words.
- **Verification.** When the hashes match and the answer must be exact, compare the two deletion results directly. The number of true matches is usually small, so the total verification cost is much smaller than the cost of comparing every query.
- **A randomized base.** A fixed base can be attacked with a string built for that base. Choosing the base at random at run time makes the collision theorem apply, at the cost of a few random bits and a non-reproducible run.

## Contest strategy

1. Decide whether the answer tolerates a probability of error. If it does not, plan the double hash or the verification step before writing the query loop.
2. Use two independent hashes when $n$ and $q$ both reach $10^5$ or more. The union bound for a single $10^9$ hash is already above one at the top of that range.
3. Choose the modulus to match the language. A $10^9$ modulus is fine in C, C++, Java and Python, needs `BigInt` or a split multiplication in JavaScript and Pascal, and a modulus below $\sqrt{2^{53}}$ avoids both.
4. Normalize the characters to $1, 2, \dots, \Sigma$ and choose a base strictly larger than $\Sigma$ and smaller than the modulus.
5. Build the power, prefix and suffix tables once. Do not compute a power inside a query.
6. Use 0-based tables and convert the input once. Write the conversion next to the input, not inside the query.
7. Handle $i = j$ and $n = 1$ without a special case if the formula already does. Check both by hand.
8. Differential-test the hash program against the rebuild program on random strings of length up to $20$, including strings with repeated characters and strings where the two indices are adjacent.
9. When a query returns `SAME`, the two strings are equal unless a collision occurred. If the problem demands certainty, compare the strings on that branch.

## Worked problems

### Problem 1: Censoring (Silver)

**Restatement.** A text $S$ of length at most $10^6$ and a word $T$ are given. Repeatedly find the first occurrence of $T$ in $S$, delete it, and continue until $T$ no longer occurs. Print the final text. A deletion can create a new occurrence that crosses the seam.

**Naive baseline.** Search the current string for $T$ with a fresh scan, delete the occurrence, and repeat. Each search is $O(\lvert S \rvert)$, and there can be $O(\lvert S \rvert)$ deletions, so the total is $O(\lvert S \rvert^2)$.

**Insight.** Process the text from left to right and keep the surviving characters in a buffer. After appending one character, the only occurrence of $T$ that can be new ends at the end of the buffer. If the last $\lvert T \rvert$ characters equal $T$, delete them; the deletion can expose another occurrence that ends at the new end, so test again. The buffer is a subsequence of the original text, and its hash is maintained across the appends and the deletions.

**Derivation.** Keep the buffer as a list of characters and a prefix-hash table of the buffer. Appending $c$ updates the table with one multiplication and one addition. To test the suffix of length $m = \lvert T \rvert$, take the range hash

$$
\bigl(h[L] - h[L-m] \cdot B^{m}\bigr) \bmod M
$$

and compare it with the precomputed hash of $T$. If they match, shorten the buffer and the table by $m$. Each character is appended once and removed at most once, so the whole scan is linear.

**Correctness.** Every occurrence in the buffer after an append must end at the last character, because the buffer had no occurrence before the append and the only new character is the last one. Deleting the suffix can only create an occurrence that also ends at the new end, which is why the test is repeated at the same position. The buffer after the scan is exactly the text after all possible deletions.

**Complexity.** $O(\lvert S \rvert + \lvert T \rvert)$ time and $O(\lvert S \rvert)$ space. The hash comparison is $O(1)$ per appended character.

**Common wrong approach.** Rebuilding the string after every deletion, which is quadratic on a text that alternates between creating and removing occurrences. A second wrong approach is to search only forward from the last cut and never recheck the seam; a deletion can join two pieces that form a new occurrence.

### Problem 2: Watto and Mechanism

**Restatement.** A dictionary of $n$ strings and $m$ queries are given. For each query $s$, answer `YES` when the dictionary contains a string $t$ of the same length that differs from $s$ in exactly one position, and `NO` otherwise. The total input length is at most $6 \times 10^5$, and the alphabet is `a`, `b`, `c`.

**Naive baseline.** Compare the query with every dictionary string of the same length, character by character. The total is quadratic in the input length in the worst case.

**Insight.** Two equal-length strings differ in exactly one position precisely when deleting that position from both gives the same string. For a query, the deleted position is unknown, but it is one of the query's own positions. If the dictionary string is $t$ and the difference is at position $p$, then $t$ with position $p$ deleted equals $s$ with position $p$ deleted. The deletion hash of $s$ at $p$ is a prefix-suffix recombination of the query's own tables, and the hash of $t$ is precomputed.

**Derivation.** Index the dictionary by length and hash. For a query $s$ of length $L$, build its prefix and suffix tables. For each position $p$ and each of the two letters $c \ne s_p$, the string $s$ with $s_p$ replaced by $c$ has hash

$$
\bigl(H[p] \cdot B^{L-p} + v(c) \cdot B^{L-1-p} + R[p+1]\bigr) \bmod M.
$$

Check that hash in the set for length $L$. If any of the $2L$ candidates is present, the answer is `YES`. There is no need to build the modified string; the two tables supply its hash in constant time.

**Correctness.** If the dictionary contains $t$ at Hamming distance one from $s$, let $p$ be the differing position and $c = t_p$. The formula computes the hash of $t$, so the lookup succeeds. Conversely, a successful lookup means some dictionary string of length $L$ has the same hash as the modified query; if there is no collision, that string is the modified query, which differs from $s$ at exactly $p$. A string equal to $s$ is not found, because $c \ne s_p$.

**Complexity.** $O(L)$ preprocessing and $O(L)$ lookups per query, with $O(1)$ expected per lookup, for $O(\text{total length})$ expected time and $O(\text{total length})$ space. The factor of two comes from the alphabet size minus one.

**Common wrong approach.** Hashing each modified string from scratch, which is $O(L^2)$ per query. A second wrong approach is to store only the full hashes of the dictionary strings and compare them with the query's full hash; a string at Hamming distance one has a different full hash, so every answer becomes `NO`.

### Problem 3: Compress Words

**Restatement.** Given $n$ words with total length at most $10^6$, merge them from left to right. When merging the current answer $A$ with the next word $W$, remove the longest prefix of $W$ that coincides with a suffix of $A$, and append the rest. Print the final string.

**Naive baseline.** For each word, compare every possible overlap character by character, from the longest down. Each comparison can cost the length of the overlap, so the total can be quadratic.

**Insight.** The overlap of length $k$ is a suffix of $A$ and a prefix of $W$, so its hash is one range hash of $A$ and one prefix hash of $W$. The predicate is not monotone in $k$, so binary search is not valid, but the loop from the largest $k$ downward stops at the first match, which is by definition the longest overlap.

**Derivation.** Maintain the answer as a growing string and its prefix-hash table. For each new word, build its prefix-hash table. For $k$ from $\min(\lvert A \rvert, \lvert W \rvert)$ down to $1$, compare

$$
\operatorname{range}_A(\lvert A \rvert - k, \lvert A \rvert)
\quad \text{with} \quad
H_W[k].
$$

The first $k$ that matches is the overlap. Append $W[k \dots \lvert W \rvert)$ to the answer and extend the answer's hash table one character at a time.

**Correctness.** The loop tests the overlap lengths in decreasing order and stops at the first success, so no longer overlap exists. The range hash is the hash of the suffix of $A$ by the prefix table, and $H_W[k]$ is the hash of the prefix of $W$ by construction. With no collision, equality of hashes is equality of strings.

**Complexity.** The number of hash comparisons for one word is at most $\min(\lvert A \rvert, \lvert W \rvert) \le \lvert W \rvert$, and the sum of the word lengths is at most $10^6$. So the total is $O(\text{total length})$ expected time, and the space is $O(\text{total length})$ for the answer and its table.

**Common wrong approach.** Binary-searching the overlap length. A matching overlap of length $k$ does not imply a matching overlap of length $k-1$, because the shorter suffix is aligned with a different prefix of $W$. A second wrong approach is to compare only the full length of the shorter string, which misses shorter overlaps.

## Practice progression

1. **Recognition.** Given a statement, decide whether the operation is a deletion, a block deletion, a substitution, or a concatenation, and identify the two pieces that survive.
2. **Direct application.** Build the power, prefix and suffix tables and implement $\Delta(i)$. Check it against the rebuild program on every pair of indices of a random string of length up to $20$.
3. **Adaptation.** Implement the shifted-window check, the block deletion formula, and the one-substitution query. Compare all three with their direct versions.
4. **Verification.** Add a double hash, then add a direct comparison on a hash hit, and measure how often the verification runs on random and on repetitive inputs.
5. **Combination.** Solve Censoring with a stack and range hashes, then solve Compress Words with the same tables. Both use the concatenation formula in a loop rather than in a single query.
6. **Transfer.** Replace the static string with a segment tree that stores (length, hash) per node, and answer a deletion query by merging the two remaining ranges. This is the dynamic version of the same identity.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Write the concatenation formula for the hash of $XY$. (Formal model)
2. Write the deletion hash $\Delta(i)$ in terms of $H$, $R$ and $P$. (Formal model)
3. Why is the multiplier $B^{n-1-i}$ and not $B^{n-i}$? (Implementation walkthrough)
4. Why does the suffix table use the same weights as a substring of the original string, rather than the weights of the reversed string? (Formal model)
5. For $i < j$, which two windows must be equal? (Key insight)
6. What does the equality of those windows imply about the characters between $i$ and $j$? (Key insight)
7. What is the collision probability for one comparison, and what does it depend on? (Formal model)
8. Why is a single $10^9$ hash unsafe for $10^6$ queries on a string of length $10^6$? (Formal model)
9. What are the three ways to make the answer exact when a hash match is not enough? (Variants and extensions)
10. Why does the shifted-window form need a negative-residue correction, and the suffix-table form does not? (Implementation walkthrough)
11. When is the run-length table a better choice than the hash? (Algorithm selection)
12. How does the formula extend to deleting a block $[l, r)$? (Variants and extensions)

## Further reading

- The foundation of this technique, which compares substrings of a static string in constant time, is in [rolling hash](/algorithms/strings/rolling-hash).
- The deterministic structure that answers substring and repeat questions exactly is in [the suffix array](/algorithms/strings/suffix-array).
- The exact linear-time pattern search, which is the right tool for the repeated deletion in Censoring, is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The other exact linear-time string scan, which computes the longest match at every position, is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The arithmetic behind the modulus, the powers and the collision bound is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The bit-level behavior of the overflow variant is in [binary representation](/algorithms/foundations/binary-representation).
- The subject overview, which lists the string techniques beside this one, is at [the strings](/algorithms/strings/).
