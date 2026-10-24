---
id: strings.suffix-array-palindrome
title: The suffix-array-based palindrome method
summary: Build the suffix array and longest-common-prefix array of a string and its reverse, then binary search the mirrored match at every center to find the longest palindromic substring in n log n time.
division: [gold, platinum]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords:
    [
        longest palindromic substring,
        suffix array,
        lcp array,
        reversed string,
        palindrome radius,
        binary search,
        kasai,
        sparse table,
    ]
prerequisites:
    required: [strings.suffix-array, searching.binary-search]
    recommended: [range-queries.sparse-table, strings.manacher]
complexity:
    time: "O(n log n)"
    space: "O(n log n)"
assumptions:
    - The input is one static string of lowercase Latin letters, with at most 100000 characters.
    - The separator is smaller than every letter, so a common prefix cannot run from the string into its reverse.
    - The longest-common-prefix array is indexed by the suffix array, and its first entry is zero.
implementations: strings.suffix-array-palindrome
reviewed: false
---

## At a glance

A palindrome reads the same forwards and backwards. That symmetry is a statement about two halves of one interval: the right half, read forwards, equals the left half, read backwards. If $R$ is the reverse of $S$, the left half read backwards is a forward substring of $R$. The longest palindrome at a center is therefore the longest common prefix of two suffixes, one starting in $S$ and one starting in $R$.

The suffix-array method makes that observation operational. Build one suffix array over

$$
U = S \mathbin{\#} R,
$$

where $\#$ is a separator smaller than every letter. Build the longest-common-prefix array of $U$ with Kasai's algorithm, and put a sparse table over it so that the longest common prefix of any two suffixes is a range minimum. Then, for every center, binary search the palindrome radius: the predicate is that the longest common prefix of the two mirrored suffixes reaches the radius.

For an odd center $c$ with radius $k$, the palindrome is $S[c-k \dots c+k]$, and the two suffixes are the one at $c$ in $S$ and the one at $n-1-c$ in $R$. For an even center $c$ with radius $k$, the palindrome is $S[c-k \dots c+k-1]$, and the suffixes are the one at $c$ in $S$ and the one at $n-c$ in $R$. The longest common prefix includes the center for the odd case and excludes it for the even case, which is the only difference between the two formulas.

The construction costs $O(n \log n)$ time and $O(n \log n)$ space, dominated by the suffix array and the sparse table. The scan performs $O(n)$ binary searches of $O(\log n)$ steps, each step a constant-time range minimum. A naive expansion costs $O(n^2)$ time in the worst case, and the linear-time [Manacher algorithm](/algorithms/strings/manacher) is faster for a single string; the suffix-array method is the one to use when the suffix array is already needed for other queries, or when the mirrored comparison is only one part of a larger string-index problem.

The programs in this article read one nonempty string of lowercase Latin letters, and print two lines: the length of the longest palindromic substring, then its first 0-based starting position. The first occurrence is the smallest starting position among all palindromes of maximum length.

## Problem motivation

A text service holds a fixed document of $n = 10^5$ characters and receives questions about mirrored regions: the longest palindrome anywhere in the document, the longest palindrome centered at a given position, and the longest palindromic prefix or suffix. The document never changes, so the answers should come from an index rather than from a fresh scan.

Expanding around every center is the first thing to try, and it is the right thing for a single short string. For every center it walks outwards while the characters match. On a string of one repeated character, every center walks to the edge, so the total is $\Theta(n^2)$. At $n = 10^5$ that is about $10^{10}$ character comparisons, far beyond a one-second limit.

The second baseline hashes the string and its reverse. A candidate radius is checked in constant time by comparing two substring hashes, so the search per center is $O(\log n)$ and the whole scan is $O(n \log n)$. It is fast and short, but a hash collision turns a correct answer into a wrong one, and a contestant who uses hashing has to defend the modulus or use double hashing. The suffix array gives the same asymptotic bound with no probability of error.

The third baseline is [Manacher's algorithm](/algorithms/strings/manacher), which computes every palindrome radius in $O(n)$ time and $O(n)$ space. It is the best tool for this exact problem, and this article does not pretend otherwise. The suffix-array method earns its place in a different situation: the suffix array is already being built for another part of the task, such as the lexicographic order of suffixes, the longest repeated substring, or the number of occurrences of a pattern. Once the array and the longest-common-prefix array exist, the mirrored comparison is one more query on the same structure, and the palindrome question comes almost for free.

That situation is common in harder string problems. A statement may ask for the longest palindrome that is also a prefix of some suffix, the longest mirrored region inside a range, or the lexicographically smallest suffix that starts with a palindrome. All of those need order or range information around the palindrome check, and the suffix array supplies both.

The method also has a practical advantage over Manacher when the answer must be reconstructed. Manacher gives the radius at every center, and the reconstruction of the first occurrence is a second scan. The suffix-array scan already knows the center and the radius, so the length and the starting position come out together, and the tie rule is one comparison.

## Recognition patterns

The suffix-array palindrome method is the right tool when the statement has some of these shapes.

- "Find the longest palindromic substring", especially when the statement also asks for its position or its first occurrence.
- "For every center, how far does the palindrome extend", and the centers are queried many times on one fixed string.
- "Compare a substring with its reverse", or "find the longest interval that equals its own reversal".
- "Find the longest palindromic prefix or suffix", which is the same mirrored comparison with one endpoint fixed.
- "Find the longest palindrome inside a range", where the suffix array is combined with a range structure.
- "The suffix array is already built for another query", which is the strongest reason to prefer this method over Manacher.
- "The answer must be exact", which rules out a bare rolling hash.

The constraints that decide between this method and its neighbors:

| Constraint or shape | What it rules |
| --- | --- |
| $n \le 2000$ | Expanding around every center is simpler and fast enough |
| $n \le 10^5$, one longest palindrome | Manacher is linear and is the better default |
| $n \le 10^5$, many mirrored queries on one string | The suffix array amortizes the preprocessing |
| $n \le 10^6$, one query | Manacher, with $O(n)$ memory and no sparse table |
| The suffix array is already built | This method adds only the mirrored centers |
| The first occurrence must be reported exactly | This method, or Manacher with a second scan |
| The string is built online | An eertree or Manacher, not a static suffix array |
| The alphabet is large or unordered | Compress the alphabet to ranks first |
| The palindrome comparison is one clause of a larger order query | This method, because the suffix array answers both |

Two rows deserve a sentence. The first is the comparison with Manacher. Manacher is not a special case of this method and this method is not a generalization of Manacher; they are different uses of the same symmetry. Manacher reuses the rightmost palindrome to avoid comparisons, while the suffix-array method reuses a precomputed index to make each comparison a range minimum. For one string and one question, Manacher wins. For a string index that answers several kinds of questions, the suffix array wins.

The second is the alphabet. The suffix array orders suffixes, so the characters must be comparable. Lowercase letters already are. If the "characters" are arbitrary objects, sort the distinct values and replace each by its rank before building the array. The palindrome method then works on the integer array without any change.

## Naive approach

The direct solution expands around every center. It is correct, it uses constant extra space, and it is the reference implementation for a differential test on short strings.

```python
def longest_palindrome_naive(s):
    n = len(s)
    best_len = 0
    best_start = 0

    for c in range(n):
        radius = 0
        while c - radius >= 0 and c + radius < n and s[c - radius] == s[c + radius]:
            length = 2 * radius + 1
            if length > best_len:
                best_len = length
                best_start = c - radius
            radius += 1

    for c in range(1, n):
        radius = 0
        while c - 1 - radius >= 0 and c + radius < n and s[c - 1 - radius] == s[c + radius]:
            length = 2 * radius + 2
            if length > best_len:
                best_len = length
                best_start = c - 1 - radius
            radius += 1

    return best_len, best_start
```

The two loops are the odd and the even centers. The odd loop starts with radius $0$, which always succeeds; the even loop starts with radius $0$, which corresponds to the empty palindrome between $c-1$ and $c$, and the first successful step gives length $2$.

The worst case is a string of one repeated character. At center $c$, the odd loop walks $\min(c, n-1-c)$ steps, and the sum over the centers is $\Theta(n^2)$. For $n = 10^5$ that is about $5 \cdot 10^9$ iterations, which is too slow in every language. The best case is a random string, where almost every expansion stops after one or two comparisons, but a contest cannot rely on the input being random.

The brute-force baseline enumerates every substring and tests whether it is a palindrome.

```python
def longest_palindrome_brute(s):
    best_len = 0
    best_start = 0
    for i in range(len(s)):
        for j in range(i + 1, len(s) + 1):
            t = s[i:j]
            if t == t[::-1] and (len(t) > best_len or (len(t) == best_len and i < best_start)):
                best_len = len(t)
                best_start = i
    return best_len, best_start
```

Its cost is $\Theta(n^3)$ character work, because there are $\Theta(n^2)$ substrings and each test copies and reverses a substring of length up to $n$. It is useless beyond $n \approx 200$, and it is exactly the oracle that the small differential tests need.

A rolling hash removes the cubic factor but not the probabilistic one. Precompute the hash of $S$ and of $R$; to test a radius $k$ at a center, compare the hash of the right half with the hash of the reversed left half in constant time, and binary search $k$. The total is $O(n \log n)$ time and $O(n)$ space, and it is a good solution when a collision is acceptable or when double hashing is used. The suffix array replaces the hash comparison with an exact longest-common-prefix query, which is the reason to learn the method even when the hash version is shorter.

Manacher's algorithm is the linear-time alternative. It computes the radius of every odd and even center in one pass by mirroring inside the rightmost palindrome already found. It is the recommended solution to the standalone problem, and the [Manacher article](/algorithms/strings/manacher) develops it. The rest of this article uses the suffix array because the goal is the shared index, not the fastest standalone palindrome scan.

## Key insight

The insight is that a palindrome centered at $c$ is a common prefix of two suffixes of $S \mathbin{\#} R$.

Let $R = \operatorname{reverse}(S)$, so $R[i] = S[n-1-i]$. Take an odd center $c$ and a radius $k$. The interval $S[c-k \dots c+k]$ is a palindrome exactly when

$$
S[c+j] = S[c-j]
$$

for every $j$ with $0 \le j \le k$. Rewrite the left character at the mirrored position of $R$:

$$
R[n-1-c+j] = S[n-1-(n-1-c+j)] = S[c-j].
$$

So the palindrome condition is

$$
S[c+j] = R[n-1-c+j]
$$

for $0 \le j \le k$. The left side is the suffix of $S$ starting at $c$; the right side is the suffix of $R$ starting at $n-1-c$. Their longest common prefix is therefore the largest $k+1$ for which the radius $k$ works. The radius is one less than that length, because the common prefix includes the center character.

The even case is the same computation with one index shifted. The interval $S[c-k \dots c+k-1]$ is a palindrome exactly when $S[c+j] = S[c-1-j]$ for $0 \le j < k$. Since

$$
R[n-c+j] = S[n-1-(n-c+j)] = S[c-1-j],
$$

the condition is that the suffix of $S$ at $c$ and the suffix of $R$ at $n-c$ agree for $k$ characters. Their longest common prefix is exactly the even radius, and the palindrome length is twice that radius.

That is the whole reduction. Every center becomes one longest-common-prefix question:

$$
L_{\text{odd}}(c) = \operatorname{LCP}(S[c \dots],\; R[n-1-c \dots]),
\qquad
L_{\text{even}}(c) = \operatorname{LCP}(S[c \dots],\; R[n-c \dots]).
$$

The odd palindrome has length $2L_{\text{odd}}(c)-1$ and starts at $c-L_{\text{odd}}(c)+1$. The even palindrome has length $2L_{\text{even}}(c)$ and starts at $c-L_{\text{even}}(c)$.

The suffix array of $U = S \mathbin{\#} R$ contains both suffixes. The longest common prefix of two suffixes is the minimum of the longest-common-prefix array over the range between their ranks. A sparse table makes that minimum a constant-time query. The remaining question is how to find the largest radius at a center without testing every radius, and the answer is binary search: if radius $k$ is a palindrome, every smaller radius is a palindrome too, because it is a subinterval of the same palindrome. The predicate is monotone, so the largest radius can be found in $O(\log n)$ queries.

## Visual intuition

Take $S = \texttt{banana}$, so $n = 6$ and $R = \texttt{ananab}$. The suffixes that meet at each odd center are below. The longest common prefix includes the center, so the palindrome length is $2 \cdot \operatorname{LCP} - 1$.

| Center $c$ | Suffix $S[c \dots]$ | Suffix $R[n-1-c \dots]$ | LCP | Length | Start |
| ---------- | ------------------- | ----------------------- | --- | ------ | ----- |
| 0          | `banana`            | `b`                     | 1   | 1      | 0     |
| 1          | `anana`             | `ab`                    | 1   | 1      | 1     |
| 2          | `nana`              | `nab`                   | 2   | 3      | 1     |
| 3          | `ana`               | `anab`                  | 3   | 5      | 1     |
| 4          | `na`                | `nanab`                 | 2   | 3      | 3     |
| 5          | `a`                 | `ananab`                | 1   | 1      | 5     |

The interesting row is $c = 3$. The center character is the `a` at position 3, and the two suffixes begin

```text
S:  b a n a n a
        ^
R:  a n a n a b
      ^
```

The suffix of $S$ at 3 is `ana`, and the suffix of $R$ at $n-1-3 = 2$ is `anab`. They agree on `ana`, so the common prefix has length 3. The first character of the common prefix is the center, and the other two are the pairs `n`/`n` and `a`/`a` around it. The palindrome is `anana`, of length $2 \cdot 3 - 1 = 5$, starting at $3 - 3 + 1 = 1$.

The binary search at $c = 3$ has radius bounds $0$ and $\min(3, 2) = 2$. It tests radius $1$ first: the predicate asks whether the common prefix reaches $1+1 = 2$, and it does, so the lower bound becomes $1$. It then tests radius $2$: the predicate asks whether the common prefix reaches $2+1 = 3$, and it does, so the lower bound becomes $2$. The search ends with radius $2$, length $5$, start $1$.

The even case is easiest to see on $S = \texttt{abba}$, where $R = \texttt{abba}$. The only nontrivial even center is $c = 2$, between the two `b` characters. The suffix of $S$ at 2 is `ba`, and the suffix of $R$ at $n-c = 2$ is `ba`; the common prefix has length 2, so the palindrome is `abba`, of length 4, starting at $2-2=0$. The other even centers fail on their first character.

```text
S:  a b b a
      ^ ^
      c=2
left half  S[0..1] = a b
right half S[2..3] = b a
reverse of the left half = b a
```

The reverse of the left half is the right half, which is exactly what the common prefix checks. For an even center the common prefix does not include a center character, so its length is the radius directly.

A tie is resolved by the starting position. On `aaaa`, the odd center at 1 gives `aaa` starting at 0, and the even center at 2 gives `aaaa` starting at 0. The even result is longer. On a string with two disjoint copies of the same longest palindrome, the scan keeps the smaller start; the code does that explicitly rather than relying on the order of the centers.

## Formal model

Let $S$ be a string of length $n$ over a lowercase alphabet, and let $R = \operatorname{reverse}(S)$.

::: math definition Definition
The concatenation is $U = S \mathbin{\#} R$, where $\#$ is a character smaller than every letter of the alphabet. Its length is $N = 2n+1$.
:::

::: math definition Definition
The suffix array $\operatorname{SA}$ of $U$ is the array of starting positions of the suffixes of $U$ in lexicographic order. The rank array is its inverse, $\operatorname{rank}[\operatorname{SA}[j]] = j$.

The longest-common-prefix array is $\operatorname{lcp}[0] = 0$ and, for $j \ge 1$,

$$
\operatorname{lcp}[j] = \operatorname{LCP}\bigl(U[\operatorname{SA}[j-1] \dots],\; U[\operatorname{SA}[j] \dots]\bigr).
$$
:::

::: math definition Definition
For two positions $i$ and $j$ in $U$, let

$$
\operatorname{LCP}_U(i,j) =
\min_{\operatorname{rank}[i] < t \le \operatorname{rank}[j]} \operatorname{lcp}[t]
$$

when $\operatorname{rank}[i] < \operatorname{rank}[j]$, and symmetrically otherwise. This is the length of the longest common prefix of the suffixes at $i$ and $j$.
:::

::: math definition Definition
For an odd center $c$ with $0 \le c < n$, define

$$
L_{\text{odd}}(c) = \operatorname{LCP}_U(c,\; 2n-c).
$$

For an even center $c$ with $1 \le c < n$, define

$$
L_{\text{even}}(c) = \operatorname{LCP}_U(c,\; 2n+1-c).
$$

The positions $2n-c$ and $2n+1-c$ are the starts of $R[n-1-c \dots]$ and $R[n-c \dots]$ inside $U$.
:::

::: math lemma Lemma
For every odd center $c$,

$$
L_{\text{odd}}(c) - 1 = \max\{\, k : 0 \le k \le \min(c, n-1-c),\; S[c-k \dots c+k] \text{ is a palindrome} \,\}.
$$

For every even center $c$,

$$
L_{\text{even}}(c) = \max\{\, k : 0 \le k \le \min(c, n-c),\; S[c-k \dots c+k-1] \text{ is a palindrome} \,\}.
$$
:::

::: math proof Proof
For the odd case, the identity $R[n-1-c+j] = S[c-j]$ holds for every $j$. The two suffixes agree on their first $L$ characters exactly when $S[c+j] = R[n-1-c+j]$ for $0 \le j < L$, which is exactly $S[c+j] = S[c-j]$ for $0 \le j < L$. That is the palindrome condition for radius $L-1$. The boundary is automatic: the suffix of $R$ has length $c+1$, so $L \le c+1$, and the suffix of $S$ has length $n-c$, so $L \le n-c$. Hence $L-1 \le \min(c, n-1-c)$ and the start $c-L+1$ is nonnegative.

For the even case, the identity is $R[n-c+j] = S[c-1-j]$. Agreement on $L$ characters is exactly $S[c+j] = S[c-1-j]$ for $0 \le j < L$, which is the even palindrome condition for radius $L$. The suffix of $R$ has length $c$ and the suffix of $S$ has length $n-c$, so $L \le \min(c, n-c)$ and the start $c-L$ is nonnegative. $\square$
:::

::: math invariant Invariant
At a fixed center, let $P(k)$ be the predicate "the common prefix of the two mirrored suffixes has length at least the threshold for radius $k$". If $P(k)$ holds, then $P(k-1)$ holds, because a prefix of a palindrome is a palindrome. The binary search maintains an interval $[lo, hi]$ that contains the largest $k$ with $P(k)$, and it halves the interval on every step.
:::

## Algorithm derivation

The derivation has five parts: build the concatenation, build the suffix array, build the longest-common-prefix array, build the range-minimum structure, and scan the centers.

### The concatenation

Prepend nothing and append nothing; just put the reverse after the original with a separator:

```text
U = S + '#' + reverse(S)
```

The separator must be smaller than every letter, so that a suffix that starts in $S$ compares as smaller than a suffix that starts in $R$ at the moment the separator is reached. For lowercase letters, `#` has code 35 and every letter has a code of at least 97, so `#` works. If the alphabet is arbitrary, compress it first and use a separator with rank $-1$ or a distinct smallest rank.

The separator also prevents a common prefix from running from the end of $S$ into the start of $R$. Without it, a suffix that reaches the end of $S$ could continue into the reverse copy and match characters that have no counterpart in the original palindrome. The boundary lengths in the lemma show that the relevant common prefixes never reach the separator anyway, but the separator makes the suffix array well defined and keeps unrelated suffixes apart.

### The suffix array

The suffix array of $U$ is built by prefix doubling. The details are in [the suffix array article](/algorithms/strings/suffix-array); the part that matters here is the interface.

```text
rank[i] = the rank of U[i] among the characters, compressed to 0 .. classes
k = 1
while k < N and classes < N - 1:
    sort the positions by the pair (rank[i], rank[i + k])
    assign new ranks, equal pairs receiving equal ranks
    k = 2k
```

The sort is two stable counting sorts, one for each key. The rank of a position past the end is $-1$, which is strictly smaller than every real rank; this is the sentinel rule that makes a suffix that is a proper prefix of another come first. The construction is $O(N \log N)$ time and $O(N)$ space.

### The longest-common-prefix array

Kasai's algorithm fills the array in linear time.

```text
h = 0
for i from 0 to N - 1:
    r = rank[i]
    if r == 0:
        h = 0
        continue
    j = SA[r - 1]
    while i + h < N and j + h < N and U[i + h] == U[j + h]:
        h = h + 1
    lcp[r] = h
    if h > 0:
        h = h - 1
```

The carried value $h$ is a lower bound on the common prefix of the current suffix and its predecessor. The extension loop raises it to the exact value, and the decrement at the end is what makes the total number of increments linear. The first entry is zero because the first suffix has no predecessor.

### The range-minimum structure

The longest common prefix of two suffixes is the minimum of the LCP array between their ranks. A sparse table answers that minimum in constant time.

```text
lg[1] = 0
for i from 2 to N:
    lg[i] = lg[i / 2] + 1
st[0][i] = lcp[i]
for j from 1 while 2^j <= N:
    for i while i + 2^j <= N:
        st[j][i] = min(st[j - 1][i], st[j - 1][i + 2^(j - 1)])
```

The query takes the two overlapping blocks of length $2^{\lfloor \log_2 L \rfloor}$ that cover the range of length $L$:

```text
a = min(rank[i], rank[j]) + 1
b = max(rank[i], rank[j])
L = b - a + 1
k = lg[L]
answer = min(st[k][a], st[k][b - 2^k + 1])
```

The two blocks overlap, which is allowed for a minimum. The table costs $O(N \log N)$ time and space. A segment tree is the alternative when memory is tight; it answers a query in $O(\log N)$ and makes the whole scan $O(n \log^2 n)$.

### The binary search at each center

For an odd center $c$, the largest radius is at most $\min(c, n-1-c)$. The predicate for radius $k$ is

$$
\operatorname{LCP}_U(c,\; 2n-c) \ge k+1.
$$

The search keeps a lower bound that is known to work and an upper bound that is known to work or is the maximum allowed radius. It uses the upper-middle midpoint, so the loop ends with the largest working radius.

```text
lo = 0
hi = min(c, n - 1 - c)
while lo < hi:
    mid = (lo + hi + 1) / 2
    if LCP(c, 2n - c) >= mid + 1:
        lo = mid
    else:
        hi = mid - 1
length = 2 * lo + 1
start = c - lo
```

For an even center $c$, the radius is at most $\min(c, n-c)$, and the predicate is

$$
\operatorname{LCP}_U(c,\; 2n+1-c) \ge k.
$$

```text
lo = 0
hi = min(c, n - c)
while lo < hi:
    mid = (lo + hi + 1) / 2
    if LCP(c, 2n + 1 - c) >= mid:
        lo = mid
    else:
        hi = mid - 1
length = 2 * lo
start = c - lo
```

The odd predicate uses $k+1$ because the common prefix includes the center character. The even predicate uses $k$ because the center is between two characters and no character is shared.

### The tie-break

The scan visits the odd centers from $0$ to $n-1$, then the even centers from $1$ to $n-1$. For a fixed length, the starting position increases with the center, so the first center that attains a length also gives the earliest start of that length. The implementation still compares the start explicitly:

```text
if length > best_length or (length == best_length and start < best_start):
    best_length = length
    best_start = start
```

The explicit comparison makes the rule independent of the order in which the two center loops are written, and it is the rule the problem statements expect.

## Step-by-step execution

Take $S = \texttt{banana}$, so $U = \texttt{banana\#ananab}$ and $N = 13$. The suffix array and the longest-common-prefix array of $U$ are

| $j$ | $\operatorname{SA}[j]$ | Suffix          | $\operatorname{lcp}[j]$ |
| --- | ---------------------- | --------------- | ----------------------- |
| 0   | 6                      | `#ananab`       | 0                       |
| 1   | 5                      | `a#ananab`      | 0                       |
| 2   | 11                     | `ab`            | 1                       |
| 3   | 3                      | `ana#ananab`    | 1                       |
| 4   | 9                      | `anab`          | 3                       |
| 5   | 1                      | `anana#ananab`  | 3                       |
| 6   | 7                      | `ananab`        | 5                       |
| 7   | 12                     | `b`             | 0                       |
| 8   | 0                      | `banana#ananab` | 1                       |
| 9   | 4                      | `na#ananab`     | 0                       |
| 10  | 10                     | `nab`           | 2                       |
| 11  | 2                      | `nana#ananab`   | 2                       |
| 12  | 8                      | `nanab`         | 4                       |

The rank array is the inverse: $\operatorname{rank}[0]=8$, $\operatorname{rank}[1]=5$, $\operatorname{rank}[2]=11$, $\operatorname{rank}[3]=3$, $\operatorname{rank}[4]=9$, $\operatorname{rank}[5]=1$, $\operatorname{rank}[6]=0$, $\operatorname{rank}[7]=6$, $\operatorname{rank}[8]=12$, $\operatorname{rank}[9]=4$, $\operatorname{rank}[10]=10$, $\operatorname{rank}[11]=2$, $\operatorname{rank}[12]=7$.

**Center $c = 3$.** The odd query compares the suffix at 3 with the suffix at $2n-c = 9$. Their ranks are 3 and 4, so the LCP is the minimum of $\operatorname{lcp}[4 \dots 4]$, which is 3. The common prefix is `ana`. The radius bound is $\min(3, 2) = 2$.

| Binary-search step | Interval | `mid` | Predicate | Result         |
| ------------------ | -------- | ----- | --------- | -------------- |
| 1                  | $[0, 2]$ | 1     | $3 \ge 2$ | true, $lo = 1$ |
| 2                  | $[1, 2]$ | 2     | $3 \ge 3$ | true, $lo = 2$ |

The search ends with radius 2, so the palindrome has length $2 \cdot 2 + 1 = 5$ and starts at $3 - 2 = 1$. It is `anana`.

**Center $c = 2$.** The query compares the suffix at 2 with the suffix at $10$. Their ranks are 11 and 10, so the range is $\operatorname{lcp}[11 \dots 11]$, whose value is 2. The radius bound is $\min(2, 3) = 2$. The binary search tests radius 1: $2 \ge 2$ is true, so $lo=1$; it then tests radius 2: $2 \ge 3$ is false, so $hi=1$. The result is radius 1, length 3, start 1, the palindrome `ana`.

**Center $c = 4$.** The query compares the suffix at 4 with the suffix at 8. Their ranks are 9 and 12, so the range is $\operatorname{lcp}[10 \dots 12]$, whose minimum is 2. The radius bound is $\min(4, 1) = 1$. The result is radius 1, length 3, start 3, the other occurrence of `ana`.

The odd scan therefore reports length 5 at start 1. The even scan finds no palindrome longer than one character, because every even query at this string returns 0. The final answer is $5$ and $1$.

For an even example, take $S = \texttt{abba}$, so $U = \texttt{abba\#abba}$. The suffix array is $[4, 8, 3, 5, 0, 7, 2, 6, 1]$ and the LCP array is $[0, 0, 1, 1, 4, 0, 2, 1, 3]$. At the even center $c = 2$, the query compares the suffix at 2 with the suffix at $2n+1-c = 7$. Their ranks are 6 and 5, so the LCP is $\operatorname{lcp}[6] = 2$. The radius is 2, the length is 4, and the start is 0, giving `abba`.

The first-occurrence rule matters when the maximum length is attained more than once. On `aaaa`, the odd center at 1 gives `aaa` at start 0 and the even center at 2 gives `aaaa` at start 0; the latter is longer. On a string such as `abacaba`, the maximum is the whole string and there is no tie. On `abac`, every palindrome has length 1, and the scan keeps start 0 because it is the smallest start among all length-1 candidates.

## Correctness proof

::: math theorem Theorem
The mirrored longest-common-prefix values computed at the odd and even centers are exactly the maximum palindrome radii at those centers.
:::

::: math proof Proof
This is the lemma of the formal model. The odd identity $R[n-1-c+j]=S[c-j]$ turns agreement of the suffixes into the equality of the two sides of the palindrome, and the even identity $R[n-c+j]=S[c-1-j]$ does the same with the center shifted by one. The suffix lengths bound the common prefix by the distance to the nearest end, so no match can leave the original string. $\square$
:::

::: math theorem Theorem
The binary search at a center returns the largest radius that is a palindrome.
:::

::: math proof Proof
Let $P(k)$ be the predicate used by the search. If $P(k)$ holds, the interval of radius $k$ is a palindrome, and every subinterval of a palindrome is a palindrome, so $P(k-1)$ holds. The predicate is therefore monotone.

The loop maintains that $lo$ is a working radius and that no radius greater than $hi$ works. Initially $lo=0$ works (a single character or an empty interval) and $hi$ is the largest radius that fits inside the string. The midpoint is chosen with the upper bias, so a successful test sets $lo$ to a strictly larger value, and a failed test sets $hi$ strictly below the tested midpoint. The interval shrinks on every iteration, so the loop terminates. At termination $lo=hi$, and it is the largest working radius. $\square$
:::

::: math theorem Theorem
The complete scan reports the length and the first starting position of a longest palindromic substring.
:::

::: math proof Proof
Every palindromic substring has a unique center: an odd palindrome has a middle character, and an even palindrome has a gap between two characters. The scan visits every center exactly once. At a center, the binary search returns the largest radius by the previous theorem, and the length and start are computed from that radius. The candidate is therefore a palindrome, and it is the longest palindrome at that center.

Conversely, every palindrome is considered at its own center, and the search returns a radius at least as large as that palindrome's radius. So the maximum candidate length is at least the maximum palindrome length, and since every candidate is a palindrome, the two maxima are equal.

For the starting position, the scan keeps the smallest start among all candidates of the maximum length. The tie comparison is explicit, so it does not depend on the order of the center loops. The reported start is therefore the first occurrence. $\square$
:::

The suffix array and the LCP array themselves are supplied by the constructions in [the suffix array article](/algorithms/strings/suffix-array): prefix doubling sorts the suffixes correctly by induction on the doubled prefix length, and Kasai's algorithm computes the exact adjacent longest common prefixes with the carried lower bound. The sparse table is a standard range-minimum structure, and the query formula covers the rank interval with two overlapping blocks of the same power-of-two length.

## Complexity analysis

| Step                                 | Time                        | Space                       |
| ------------------------------------ | --------------------------- | --------------------------- |
| Building $U = S \mathbin{\#} R$      | $O(n)$                      | $O(n)$                      |
| Suffix array by prefix doubling      | $O(N \log N) = O(n \log n)$ | $O(N) = O(n)$               |
| Longest-common-prefix array by Kasai | $O(N) = O(n)$               | $O(n)$                      |
| Sparse table over the LCP array      | $O(N \log N) = O(n \log n)$ | $O(N \log N) = O(n \log n)$ |
| Binary search at all $2n-1$ centers  | $O(n \log n)$               | $O(1)$                      |
| Total                                | $O(n \log n)$               | $O(n \log n)$               |

The suffix array is built in $\lceil \log_2 N \rceil$ rounds, and each round is two stable counting sorts of $N$ integers, so the construction is linear per round and $O(N \log N)$ overall. Kasai's algorithm is linear because the carried value $h$ increases by at most one per character position and decreases by at most one per iteration. The sparse table has $\lfloor \log_2 N \rfloor + 1$ levels of $N$ integers.

The scan is the smallest part of the cost. There are $2n-1$ centers, and each binary search performs at most $\lceil \log_2 n \rceil$ longest-common-prefix queries, each of which is two array reads and a minimum. The scan therefore performs $O(n \log n)$ queries and takes $O(n \log n)$ time, because each query is constant time.

The memory is dominated by the sparse table. With 32-bit integers and $n = 10^5$, $N = 200001$, the table has 18 levels and about $3.6 \cdot 10^6$ entries, which is about 14.4 megabytes. The suffix array, rank array, temporary arrays, and LCP array add roughly five megabytes, so the whole program sits near 20 megabytes. At $n = 10^6$, $N = 2 \cdot 10^6$, the table has 21 levels and about $4.2 \cdot 10^7$ entries, which is about 168 megabytes; that does not fit in a 64-megabyte limit, and a segment tree or Manacher is the better choice.

The comparison with the other methods is the point of the analysis:

| Method | Time | Space | Exact |
| --- | --- | --- | --- |
| Expansion around every center | $O(n^2)$ | $O(1)$ | yes |
| Rolling hash plus binary search | $O(n \log n)$ | $O(n)$ | no, with a small collision probability |
| This suffix-array method | $O(n \log n)$ | $O(n \log n)$ | yes |
| Manacher | $O(n)$ | $O(n)$ | yes |
| DC3 suffix array plus the direct readout | $O(n)$ | $O(n)$ | yes |

The last row is the theoretical optimum for this approach. The DC3 or skew construction builds the suffix array in linear time, and the LCP array and the scan are linear, but the sparse table for arbitrary LCP queries would still be $O(n \log n)$ space. A direct readout of the LCP at each center removes the binary search and makes the scan linear; the preprocessing is then the only superlinear part.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One longest palindrome, $n \le 10^5$ | Manacher, which is linear and shorter |
| One longest palindrome and the suffix array is already built | This method |
| Many palindrome queries on one fixed string | This method with a sparse table |
| Longest palindromic prefix or suffix | This method, with one LCP query per position |
| Longest palindrome inside many ranges | A range structure over the LCP array, or hashing |
| The string is appended to online | An eertree, not a static suffix array or a rebuilt Manacher |
| $n \le 2000$ | Expansion around every center |
| $n \le 10^6$, one query | Manacher |
| The alphabet is large or unordered | Compress to ranks, then build the suffix array |
| The answer must be exact and no hash is acceptable | This method |
| The answer may collide and speed is the priority | Rolling hash plus binary search |

The central decision is Manacher against this method. If the task is only "find the longest palindrome", Manacher is the better answer: it is linear, it uses linear space, and it does not need a suffix array or a sparse table. The suffix-array method is the better answer when the palindrome check is one query among many on a string index. It is also the better answer when the statement asks for the palindrome together with an order property, such as "the lexicographically smallest suffix whose prefix is a palindrome", because the suffix array already encodes that order.

The second decision is the range-minimum structure. A sparse table gives constant-time queries and $O(n \log n)$ space; a segment tree gives logarithmic queries and $O(n)$ space. At $n \le 10^5$ the sparse table is comfortable. At $n = 10^6$ the segment tree is the safer choice, at the cost of an extra logarithm. The direct readout of the LCP array avoids the binary search entirely for the simple longest-palindrome problem, but the decision form is what generalizes to bounded queries and to the variants in the next sections.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal, and JavaScript. They implement the same contract.

- The input is one line holding a nonempty string of lowercase Latin letters, at most 100000 characters.
- The program prints two lines.
- The first line holds the length of the longest palindromic substring.
- The second line holds its first 0-based starting position.

Every version builds $U = S \mathbin{\#} R$ with `#` as the separator, constructs the suffix array by prefix doubling with a stable counting sort, computes the LCP array with Kasai's algorithm, builds a sparse table, and binary searches the radius at every odd and even center. The only differences are storage and input handling.

C uses static arrays sized for a combined string of 200001 characters. C++ uses `std::vector` and `std::min`. Java uses one-dimensional `int` arrays and a two-dimensional `int` table. Python reads bytes so that a character is already an integer, and stores the sparse-table levels in `array('i')` objects. Pascal uses 1-based string indexing, a flat dynamic array for the sparse table, `SysUtils`, one `ReadLn`, and a carriage-return strip. JavaScript stores the suffix array, the ranks, and every sparse-table level in `Int32Array`.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and are validated on the same fixtures as the other four. The manifest records the time and space of every variant, the input and output contract, and the verification status.

The sources are under `implementations/strings/suffix-array-palindrome/`, with one directory per language and the source file named in the manifest. The shared fixtures are in `tests/fixtures/parts/strings.suffix-array-palindrome.yaml`.

## Recursion decision

Every part of the method is iterative.

- The suffix array construction is a loop over the doubling rounds. Each round reads the ranks of the previous round and writes the ranks of the next one; there is no natural recursive substructure.
- Kasai's algorithm is a loop over the positions, with a while loop that extends the current match. The carried value $h$ is the state, and it moves by at most one per iteration.
- The sparse table is a loop over levels and a loop over positions. Each level depends only on the previous one.
- The center scan is a loop, and the binary search is a loop.

| Language   | Practical recursion depth            | Recommendation                            |
| ---------- | ------------------------------------ | ----------------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative, for uniformity                 |
| Java       | About $10^4$ frames                  | Iterative, because the string can be long |
| Python     | The interpreter limit of 1000        | Iterative, without exception              |
| Pascal     | The operating system stack           | Iterative, for the same reason            |
| JavaScript | About $10^4$ frames                  | Iterative, to stay below the limit        |

The recursive alternative is the DC3 construction, which splits the positions by their residue modulo three, recursively builds the suffix array of the reduced string, and merges the three classes. Its depth is $O(\log_3 n)$, at most 13 for $n = 10^6$, so a recursive DC3 is safe in every language in the table, including Python at its default limit. The article does not implement DC3; the doubling construction is short enough to write from a template and fast enough for the published bound.

The expansion baseline has the opposite recursion profile. A recursive expansion around a center uses one frame per matched character, so on a string of one repeated character it reaches depth $n$ and overflows the stack in Python and often in Java. The iterative expansion in the naive section avoids that, and the suffix-array method avoids it entirely.

## Implementation walkthrough

Five details decide whether the implementation is correct.

### The concatenation and the separator

```cpp
std::string u = s;
u.push_back('#');
for (int i = n - 1; i >= 0; --i) u.push_back(s[i]);
```

The separator has to be smaller than every letter. With lowercase letters, `#` is safe. If the input can contain `#`, use a different sentinel and state the alphabet in the problem. The combined length is $2n+1$, and every suffix array index is an index of this string.

### The suffix array doubling

The second key of the counting sort is already sorted if the positions are taken from the previous suffix order. Walking the previous order backwards and shifting each position by $k$ produces a list sorted by the second key, and the stable counting sort by the first key preserves that order.

```cpp
int p = 0;
for (int i = N - k; i < N; ++i) y[p++] = i;
for (int i = 0; i < N; ++i) {
    if (sa[i] >= k) y[p++] = sa[i] - k;
}
for (int i = N - 1; i >= 0; --i) {
    sa[--cnt[rank[y[i]]]] = y[i];
}
```

The positions $N-k \dots N-1$ have no second key; they are the shortest suffixes and are placed first. The rank of a position past the end is $-1$ when the new ranks are recomputed, which keeps a suffix that is a proper prefix of another strictly first. The new-rank comparison must compare the whole pair, not only the first key.

### Kasai's algorithm

```cpp
int h = 0;
for (int i = 0; i < N; ++i) {
    int r = rank[i];
    if (r == 0) {
        h = 0;
        continue;
    }
    int j = sa[r - 1];
    while (i + h < N && j + h < N && u[i + h] == u[j + h]) ++h;
    lcp[r] = h;
    if (h > 0) --h;
}
```

The value $h$ is carried from one position to the next. It is decremented rather than reset because the suffix at $i$ and its predecessor share at least one fewer character than the suffix at $i-1$ and its predecessor. Resetting it would make the algorithm quadratic.

### The longest-common-prefix query

```cpp
int a = rank[i];
int b = rank[j];
if (a > b) std::swap(a, b);
++a;
int len = b - a + 1;
int k = lg[len];
return std::min(st[k][a], st[k][b - (1 << k) + 1]);
```

The range is from $\operatorname{rank}[i]+1$ to $\operatorname{rank}[j]$, not from $\operatorname{rank}[i]$ to $\operatorname{rank}[j]$. The first LCP entry describes the pair of adjacent suffixes before the interval, and including it would report a value that is too small. The two blocks overlap, and the minimum of the two block minima is the minimum of the whole range.

### The centers and the threshold

```cpp
// odd center c
int radius = std::min(c, n - 1 - c);
int lo = 0, hi = radius;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    if (lcp_query(c, 2 * n - c) >= mid + 1) lo = mid;
    else hi = mid - 1;
}
int length = 2 * lo + 1;
int start = c - lo;

// even center c
int radius = std::min(c, n - c);
int lo = 0, hi = radius;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    if (lcp_query(c, 2 * n + 1 - c) >= mid) lo = mid;
    else hi = mid - 1;
}
int length = 2 * lo;
int start = c - lo;
```

The odd second position is $2n-c$; the even second position is $2n+1-c$. The odd threshold is $mid+1$; the even threshold is $mid$. Those two differences are the source of most off-by-one errors. The upper-middle midpoint is required because the search is for the largest working value; the lower-middle midpoint would loop forever when $hi = lo+1$.

The language-specific details follow the same pattern. Python reads bytes, so `s + b"#" + s[::-1]` gives an integer array without decoding. JavaScript uses `Int32Array`; a plain array works too but uses more memory at the published bound. Pascal uses 1-based strings, so the character at 0-based position $p$ is `U[p+1]`. Java reads one line with a `BufferedReader` and prints once with a `StringBuilder`. C uses static arrays and a `scanf` width that matches the published bound.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Comparing $S[c \dots]$ with $R[c \dots]$ instead of $R[n-1-c \dots]$ | The comparison mirrors around the middle of the whole string, not around $c$ | Use the mirrored index $n-1-c$ |
| Omitting the separator | A match can run from the end of $S$ into the reverse copy | Insert `#`, smaller than every letter |
| Swapping the odd and even mirrored positions | The center is off by one character | Odd uses $2n-c$, even uses $2n+1-c$ |
| Using threshold $mid$ for the odd center | The common prefix includes the center, so a prefix of length $mid$ only guarantees radius $mid-1$ | Odd needs $mid+1$ |
| Using threshold $mid+1$ for the even center | The radius is one too small | Even needs $mid$ |
| Comparing only the first key when recomputing suffix ranks | Suffixes that agree on the first $k$ characters get the same rank and the order stalls | Compare the pair, with $-1$ past the end |
| Giving the sentinel the rank $0$ when real ranks start at $0$ | A suffix that is a prefix of another is ordered after it | Use $-1$, or 1-based ranks with a sentinel of 0 |
| Looping forward in the stable counting sort | The tie order is reversed and the doubling breaks | Loop backwards |
| Taking the LCP range from $\operatorname{rank}[i]$ instead of $\operatorname{rank}[i]+1$ | The answer is too small when the first entry is not part of the range | Start at $\operatorname{rank}[i]+1$ |
| Forgetting $\operatorname{lcp}[0]=0$ | The first suffix has a spurious predecessor | Set the first entry to zero |
| Updating the best only when the length is greater | A tie can lose the earliest start if the scan order changes | Compare the start explicitly |
| Assuming a 64-bit type is needed for the length | The length fits in 32 bits at the published bound | Use `int`, but use 64 bits if the bound grows |
| Testing only random strings | The all-equal and single-character cases hide boundary errors | Test `a`, `aa`, `aaaa`, `abba`, and `banana` by hand |

### Why this fails: the suffix that is compared at the wrong mirror

The plausible wrong approach is to compare the suffix of $S$ at $c$ with the suffix of $R$ at $c$, on the reasoning that both sides start at the same index and the reverse does the mirroring.

That compares the wrong positions. On `banana`, take the odd center $c = 3$. The correct comparison is with $R[n-1-3] = R[2]$, which is `anab`, and the common prefix with `ana` is 3, giving the length-5 palindrome `anana`. The wrong comparison uses $R[3]$, which is `nab`, and the common prefix is 0. The program reports a length of 1 and misses the longest palindrome entirely.

The reason is the reversal identity. The correct relation is

$$
R[n-1-c+j] = S[c-j],
$$

because the index $n-1-c$ is the position in $R$ that corresponds to the center $c$ in $S$. The wrong relation,

$$
R[c+j] = S[n-1-c-j],
$$

mirrors around the middle of the whole string. It is the right relation only when $c = n-1-c$, that is, when the center is the middle of the string. For every other center it measures a different symmetry.

The fix is to write the mirrored index once, as a named quantity, and to use it in both the query and the boundary:

```text
odd_mirror(c)  = n - 1 - c
even_mirror(c) = n - c
```

With those names, the odd suffix in $U$ starts at $c$ and the even suffix starts at $c$; the two reverse suffixes start at $n+1+\text{odd\_mirror}(c)$ and $n+1+\text{even\_mirror}(c)$, which simplify to $2n-c$ and $2n+1-c$. Writing the simplification in the code without the names is where the off-by-one enters.

The same failure appears in the even case. For `abba` and $c=2$, the correct reverse suffix starts at $R[n-c] = R[2]$, which is `ba`. Comparing with $R[2]$ happens to be correct here because $c=2$ is the middle of a length-4 string. Test a string with an off-center even palindrome, such as `xabba`, where the center is $c=3$ and the correct mirror is $R[2]$; the same-index comparison uses $R[3]$ and fails.

The lesson is the same as the suffix array's sentinel lesson: a boundary rule has to be derived once and named, not reconstructed at every use.

## Variants and extensions

- **Direct readout instead of binary search.** For the plain longest-palindrome problem, the LCP value at a center is already the maximum radius. Replace the binary search with one query per center and get an $O(n)$ scan after the $O(n \log n)$ preprocessing. The binary-search form is retained in this article because the predicate is the part that generalizes to bounded and approximate variants.
- **Segment tree instead of sparse table.** A segment tree over the LCP array uses $O(n)$ memory and answers a query in $O(\log n)$. The total becomes $O(n \log n)$ preprocessing plus $O(n \log^2 n)$ queries. At $n = 10^6$ with a 64-megabyte limit, this is the difference between fitting and not fitting.
- **Rolling hash plus binary search.** Replace the LCP query with two substring hashes. The method is shorter and uses $O(n)$ memory, but a collision can produce a false palindrome. Double hashing or a random modulus reduces the risk; the suffix array removes it.
- **Manacher.** The linear-time alternative for the standalone problem. It computes both radius arrays in one pass and is the recommended solution when no other suffix query is needed.
- **The eertree, or palindrome tree.** It stores every distinct palindromic substring in linear space and answers questions about distinct palindromes, occurrences, and palindromic suffixes. It is the natural tool when the problem is about all palindromes rather than one longest interval.
- **Longest palindrome with at most $k$ mismatches.** Binary search the radius, and use repeated LCP queries to skip matching blocks and count mismatches. The same suffix-array index supports the skip, and the decision version is monotone.
- **Longest common palindromic substring of two strings.** Concatenate the two strings with distinct separators, build the suffix array, and look for a mirrored pair whose two halves come from different strings. The occurrences must be checked against the separator boundaries.
- **Palindromic range queries.** For a fixed string and many range queries, a wavelet tree or a range-minimum structure over the radius arrays answers the query. The suffix array is static, so it does not support updates.
- **Suffix automaton and suffix tree.** They answer the same substring questions with different trade-offs. The suffix automaton is online and linear-space; the suffix tree exposes the longest repeated structures directly. The suffix array is the simplest of the three to combine with a range-minimum structure.
- **Integer alphabets.** Replace each distinct value by its rank and use a separator with the smallest rank. The palindrome method itself is unchanged.

## Contest strategy

1. Decide whether Manacher is enough. If the task is only the longest palindrome, write Manacher and stop. The suffix-array method is for tasks that need the index for something else.
2. If the suffix array is needed anyway, write it from a tested template. Do not re-derive the counting sort under time pressure.
3. Write the separator rule down before the code: `#`, smaller than every input character.
4. Write the suffix array and Kasai first, and check the LCP array on `banana` against the table in this article.
5. Build the sparse table, and test one query by brute force on a short string.
6. Write the odd and even centers as separate loops. Keep the mirrored indices in named variables while deriving them, then simplify.
7. Use the upper-middle midpoint. Check the odd threshold $mid+1$ and the even threshold $mid$ on a single-character and a two-character string.
8. Track the earliest start explicitly. Do not assume the loop order will stay the same after debugging.
9. Test `a`, `aa`, `aaaa`, `abba`, `banana`, and a random string against the quadratic expansion. The all-equal and single-character cases catch the boundary and sentinel bugs.
10. Check the memory at the maximum $n$. If the sparse table does not fit, switch to a segment tree or to Manacher.

## Worked problems

### Problem 1: the longest palindrome of a long string

**Restatement.** Given a string $S$ of length $n \le 10^6$ over lowercase letters, print one longest palindromic substring of $S$. If there are several, any of them is accepted.

**Naive baseline.** Expand around every center. On a string of one repeated character every center reaches an edge, so the cost is $\Theta(n^2)$, which is $10^{12}$ character comparisons at the top bound.

**Insight.** At every center, the longest palindrome is the longest common prefix of the suffix of $S$ at the center and the suffix of $R$ at the mirrored position. The suffix array of $S \mathbin{\#} R$ and a range-minimum structure make each of those prefixes a constant-time query.

**Derivation.** Build $U$, its suffix array, its LCP array, and a sparse table. Scan the odd centers and then the even centers, binary search the radius at each, and keep the best pair of length and start. The answer is $S[\text{start} \dots \text{start}+\text{length})]$.

**Correctness.** The mirrored LCP lemma gives the exact radius at every center, and every palindrome has a center. The maximum over the centers is therefore the maximum over all palindromic substrings.

**Complexity.** $O(n \log n)$ time and $O(n \log n)$ space for the suffix array and the sparse table. At $n = 10^6$ the sparse table is about 168 megabytes, so the implementation has to either use a segment tree, use the direct readout, or switch to Manacher. The statement's time limit is the reason Manacher is the usual solution at this bound.

**Common wrong approach.** Building the suffix array of $S$ alone and comparing suffixes of $S$ with each other. Two suffixes of $S$ can share a prefix without that prefix being a palindrome; the reverse copy is what supplies the mirror.

### Problem 2: the first longest palindrome of a short string

**Restatement.** Given a string of at most 1000 Latin letters, print the first occurrence of a longest palindromic substring. If several longest palindromes exist, the one with the smallest starting position is required.

**Naive baseline.** Expand around every center and keep the first best. The cost is $O(n^2)$, which is at most about $5 \cdot 10^5$ operations at $n = 1000$ and is the intended solution at this bound.

**Insight.** The suffix-array method is exact here too, and it exposes the tie rule cleanly: the odd and even centers are scanned left to right, and the start is compared explicitly when the length ties.

**Derivation.** Build the suffix array and LCP array of $S \mathbin{\#} R$, build the sparse table, run the same center scan, and output $S[\text{start} \dots \text{start}+\text{length})]$. The first occurrence is the smallest start among the maximum-length candidates.

**Correctness.** The mirrored LCP lemma gives the maximum radius at each center. If two centers produce the same maximum length, the smaller start is the earlier occurrence. The scan visits every center, so no occurrence is missed.

**Complexity.** $O(n \log n)$ time and $O(n \log n)$ space, against $O(n^2)$ time and $O(1)$ space for the expansion. At $n = 1000$ the expansion is simpler and faster in practice; the suffix-array version is the one to use when the same index answers other queries.

**Common wrong approach.** Printing the first longest palindrome found by an arbitrary scan order without comparing starting positions. The judge asks for the first one, and the scan order is part of the specification.

### Problem 3: extending a string to a palindrome

**Restatement.** Given a string $S$, find the shortest palindrome that begins with $S$. The input may contain several lines, each with up to 100000 lowercase letters.

**Naive baseline.** Try every possible extension length, build the candidate, and test whether it is a palindrome. Each test is $O(n)$, and there are $O(n)$ candidates, so the cost is $O(n^2)$ per line.

**Insight.** Appending characters can only repair a suffix. The characters that stay unchanged form a palindromic suffix of $S$, and the shortest extension comes from the longest such suffix. If the longest palindromic suffix starts at $p$, the answer is

$$
S + \operatorname{reverse}(S[0 \dots p)).
$$

**Derivation.** A suffix $S[p \dots n)$ is a palindrome exactly when it equals the prefix of $R = \operatorname{reverse}(S)$ of length $n-p$. In $U = S \mathbin{\#} R$, that prefix starts at $n+1$, so the condition is

$$
\operatorname{LCP}_U(p,\; n+1) \ge n-p.
$$

Scan $p$ from $0$ upwards and stop at the first $p$ that satisfies the condition. That $p$ is the start of the longest palindromic suffix, because a smaller $p$ means a longer suffix. The answer is the input followed by the reverse of the prefix before $p$.

**Correctness.** Let $p$ be the first position for which the suffix is a palindrome. Any valid extension must keep a palindromic suffix intact, so its unchanged suffix cannot start before $p$; the extension using $p$ is therefore the shortest. The constructed string is a palindrome because the appended reverse mirrors the prefix before the palindromic suffix, and it begins with $S$ because only characters are appended.

**Complexity.** $O(n \log n)$ time and $O(n \log n)$ space to build the index, then $O(n)$ LCP checks to find $p$, plus $O(n)$ to build the output. The naive test is $O(n^2)$ per line. If the input has several lines, rebuild the index for each line; the lines are independent.

**Common wrong approach.** Finding the longest palindromic prefix and prepending its reverse, which solves the opposite problem. The extension is at the end, so the relevant part is the suffix, not the prefix. A second common error is to stop at the first $p$ whose suffix has length one; every single character is a palindrome, so the scan must check the full suffix length, not just the first character.

## Practice progression

1. **Recognition.** Given a statement, decide whether the palindrome question is standalone or whether it is one clause of a larger suffix-order query. If it is standalone, write down Manacher as the baseline and explain why the suffix array is or is not worth building.
2. **Direct application.** Build the suffix array and the LCP array of `banana#ananab` by hand or by code, and reproduce the table in the step-by-step section. Check every LCP entry against the suffixes.
3. **Adaptation.** Write the odd and even center scans with the direct LCP readout, without binary search. Verify the result on `abba`, `aaaa`, and `banana` against the quadratic expansion.
4. **Combination.** Replace the direct readout with a binary search over the radius and a sparse table. Check that the two versions agree on every string of length at most ten over the alphabet `{a, b}`.
5. **Challenge.** Solve the longest palindromic suffix problem by scanning $p$ and comparing the suffix with the prefix of the reverse. Then solve the longest palindrome with at most one mismatch, using LCP queries to skip matching blocks.
6. **Transfer.** Use the same index for a different question: the lexicographically smallest suffix whose prefix is a palindrome, or the longest palindromic substring that lies inside a given range. The suffix array answers the order part, and the mirrored LCP answers the palindrome part.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the reversal identity that turns a palindrome at $c$ into a common prefix of two suffixes. (Key insight)
2. Why does the odd case use $L-1$ as the radius while the even case uses $L$? (Formal model)
3. Why must the separator be smaller than every letter? (Algorithm derivation)
4. What are the two mirrored positions in $U$ for an odd and an even center? (Formal model)
5. Why is the common prefix of two suffixes a range minimum over the LCP array, and which range is it? (Algorithm derivation)
6. Why is the binary-search predicate monotone? (Correctness proof)
7. Why is the upper-middle midpoint required, and what happens with the lower-middle one? (Implementation walkthrough)
8. How does the code keep the first occurrence when two centers produce the same length? (Algorithm derivation)
9. Why is the sparse table $O(n \log n)$ space, and when should a segment tree replace it? (Complexity analysis)
10. When is Manacher the better choice than this method? (Algorithm selection)
11. What is the counterexample for comparing $S[c \dots]$ with $R[c \dots]$? (Common mistakes)
12. How does the longest-palindromic-suffix problem reduce to one LCP query per position? (Worked problems)

## Further reading

- The suffix array itself, including the doubling construction and Kasai's algorithm, is in [the suffix array article](/algorithms/strings/suffix-array).
- The linear-time alternative for the standalone problem is [the Manacher algorithm](/algorithms/strings/manacher).
- The probabilistic alternative for substring equality is [the rolling hash](/algorithms/strings/rolling-hash).
- The structure for distinct palindromes and palindromic suffixes is [the palindrome tree](/algorithms/strings/palindrome-tree).
- The online structure for substring queries is [the suffix automaton](/algorithms/strings/suffix-automaton).
- The range-minimum structure used for the LCP queries is [a sparse table](/algorithms/range-queries/sparse-table).
- The prefix-function technique that answers a different family of string questions is [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The linear-time prefix-matching technique is [the Z algorithm](/algorithms/strings/z-algorithm).
- The subject overview, which lists the string techniques in the encyclopedia, is at [the strings](/algorithms/strings/).
