---
id: strings.manacher
title: The Manacher algorithm
summary: Compute the radius of every palindromic substring of a string in linear time, by reusing the palindromes already found inside the current rightmost one.
division: [gold]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords:
    [
        manacher,
        palindrome radius,
        odd palindrome,
        even palindrome,
        longest palindromic substring,
        counting palindromes,
        palindrome mirror,
    ]
prerequisites:
    required: [foundations.complexity, strings.kmp]
    recommended: [foundations.recursion, arrays.prefix-sums, dynamic-programming.0-1-knapsack]
complexity:
    time: "O(n)"
    space: "O(n)"
assumptions:
    - The string is static, so that the radius array can be built once and queried many times.
    - Comparing two characters takes constant time.
    - The length of the string is known, so that the arrays can be allocated in advance.
reviewed: false
---

## At a glance

The Manacher algorithm computes, for every position of a string, the length of the longest palindrome centered there. There are two kinds of center, and the algorithm handles both.

- An **odd** palindrome has a character at its center. Its radius at position $i$ is the number of characters from the center to the edge, so the palindrome is $s[i - d_1[i] + 1 \dots i + d_1[i] - 1]$.
- An **even** palindrome has a gap at its center, between two characters. Its radius at position $i$ is the number of characters on each side, so the palindrome is $s[i - d_2[i] \dots i + d_2[i] - 1]$.

The algorithm is linear, and its idea is the same as the [Z algorithm](/algorithms/strings/z-algorithm)'s: a palindrome that reaches further to the right than any palindrome seen so far tells you the radii of every center inside it, because the left half of a palindrome mirrors the right half.

The cost is $O(n)$ time and $O(n)$ space, against $O(n^2)$ for the expansion around every center.

The trick that makes the implementation shorter is the **interleaving** trick: insert a separator between the characters, and every palindrome becomes odd, so one pass handles both cases.

## Problem motivation

A text editor must highlight every palindromic substring as the user types. The string is $n \le 10^6$ characters, and the editor must report the longest palindromic substring in the text and, for a statistics panel, the number of palindromic substrings.

The naive approach expands around every center, comparing characters outward until they differ. The cost is $O(n^2)$ in the worst case, and the worst case is the one that matters: a string of $10^6$ identical characters has a palindrome of length $10^6$ at its center, and the expansion around that one center alone performs $5 \times 10^5$ comparisons, and the total over all centers is about $n^2 / 2 = 5 \times 10^{11}$ comparisons.

The Manacher algorithm performs about $2n$ comparisons. It gets there by not expanding around the centers that are already known: the palindrome found at the center $c$ already tells you the palindromes at every center between the left and right edges of the palindrome, and the only work left is to extend the right edge.

## Recognition patterns

The Manacher algorithm is the right tool when all of the following hold.

- The question is about **palindromes**: the longest palindromic substring, the number of palindromic substrings, the number of palindromes of a given length, the longest palindromic prefix.
- The string is **static**, so the radius array can be built once.
- The answer must be **exact** and the string is **long**, so that the quadratic expansion does not fit.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One longest palindromic substring, $n \le 5000$ | The quadratic expansion is fine and is the reference implementation |
| $n \le 10^6$ | The linear algorithm is required |
| The question is about the longest palindromic **subsequence** | Rules out the technique; use an [interval dynamic program](/algorithms/dynamic-programming/interval-dp) |
| The question is about the palindromes in a range of queries | Rules out the plain technique; the answer is not a single scan |
| The string changes between queries | Rules out the radius array; it must be rebuilt |
| The question is about the number of distinct palindromes | Rules out this technique; use a palindromic tree |

The third row is the boundary that matters most. A palindromic **substring** is contiguous, and every center has a radius. A palindromic **subsequence** skips characters, so the state is a pair of endpoints, and the technique is an interval dynamic program with $O(n^2)$ time and $O(n^2)$ space.

The last row is the structure that answers the harder questions. The **palindromic tree**, or eertree, stores one node per distinct palindromic substring, and it answers the number of distinct palindromes, the number of occurrences of each palindrome, and the longest palindromic suffix of every prefix. It is built in $O(n)$ time with a suffix-link structure that is the same idea as the failure function of [KMP](/algorithms/strings/kmp).

## Naive approach

The baseline expands around every center.

```python
def longest_palindromic_substring(s):
    n = len(s)
    best_start = 0
    best_length = 0
    for center in range(n):
        for radius in range(center, min(center, n - 1 - center) + 1):
            if s[center - radius] != s[center + radius]:
                break
        length = 2 * radius - 1
        if length > best_length:
            best_length = length
            best_start = center - radius + 1
    return best_start, best_length
```

This is correct, and it is the reference implementation for the differential test on strings of length at most a few hundred. It is $O(n^2)$ in the worst case.

The second baseline is the interval dynamic program, which computes the longest palindromic **subsequence** and is a natural thing to reach for by mistake.

```python
def longest_palindromic_subsequence(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        dp[i][i] = 1
        for j in range(i + 1, n):
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1]
```

The table has $n^2$ entries, so the space alone is a problem at $n = 10^6$, and the answer is a different quantity.

## Key insight

The insight is that **a palindrome is its own mirror image**, so the palindromes inside a palindrome are determined by the palindromes on the other side of its center.

Suppose the palindrome centered at $c$ reaches from $l$ to $r$, so that $s[l \dots r]$ is a palindrome of radius $r - c$ around $c$. Take a center $i$ with $l < i < c$. The reflection of $i$ about $c$ is $2c - i$, and the reflection of the character $s[i]$ is $s[2c - i]$. Since the big palindrome is symmetric, $s[i] = s[2c - i]$.

So the palindrome centered at $i$ is the mirror image of the palindrome centered at $2c - i$, and its radius is at least the radius of the mirrored one, **provided the mirrored palindrome does not reach past the left edge of the big palindrome**. When it does, the radius is limited by the left edge.

That is the whole reuse argument, and it is the same shape as the [Z box](/algorithms/strings/z-algorithm)'s reuse argument: copy what is known, and only compare the characters that are outside the known region.

## Formal model

Let $s$ be a string of length $n$.

::: math definition Definition
For a string $s$ of length $n$, the **odd radius** $d_1[i]$ is the largest $k \ge 1$ such that $s[i-k+1 \dots i+k-1]$ is a palindrome, and the **even radius** $d_2[i]$ is the largest $k \ge 0$ such that $s[i-k \dots i+k-1]$ is a palindrome. The even radius at position $i$ is the radius of the palindrome centered in the gap before $s[i]$.
:::

::: math definition Definition
The **rightmost palindrome** at a moment of the algorithm is a range $[l, r]$ such that $s[l \dots r]$ is a palindrome, and every palindrome already found lies inside $[l, r]$. Its **center** is $c$, so that $r - c = c - l$ for an odd palindrome and $r = 2c - l - 1$ for an even one.
:::

::: math lemma Lemma
Let $[l, r]$ be a palindrome centered at $c$, and let $i$ be a center strictly inside it. Then the radius of the palindrome at $i$ is at least $\min(\operatorname{radius}(2c - i),\; c - l)$, and it is exactly that value unless the palindrome at $i$ extends past the left edge of the big palindrome.
:::

::: math proof Proof
Reflect the center $i$ about $c$ to get $i' = 2c - i$. For every position $j$ with $l \le j \le r$, the symmetry of the palindrome gives $s[j] = s[2c - j]$. So the characters around $i$ are the mirror images of the characters around $i'$.

The palindrome at $i'$ has some radius $t$, so the characters $s[i' - t + 1 \dots i' + t - 1]$ form a palindrome. Their mirror images are $s[i - t + 1 \dots i + t - 1]$, and they too form a palindrome, because a mirror image of a palindrome is a palindrome. So the radius at $i$ is at least $t$, provided the whole reflected palindrome stays inside $[l, r]$. The reflection of $i' - t + 1$ is $2c - (i' - t + 1)$, and the leftmost position of the reflected palindrome is $2c - (i' + t - 1) = i - t + 1$. The reflected palindrome stays inside $[l, r]$ exactly when $i - t + 1 \ge l$, that is, when $t \le i - l + 1$.

So the radius at $i$ is at least $\min(t, i - l + 1)$. When the minimum is $t$, the copy is exact. When it is $i - l + 1$, the palindrome at $i$ reaches the left edge of the big palindrome, and the algorithm must compare further characters itself. $\square$
:::

::: math invariant Invariant
At the start of every iteration, the range $[l, r]$ is the palindrome with the rightmost right edge among all the palindromes already found, and every radius already computed is final. The right edge never decreases.
:::

## Algorithm derivation

### The odd case

```text
l = 0, r = -1
for i from 0 to n - 1:
    k = (i > r) ? 1 : min(d1[l + r - i], r - i + 1)
    while i - k >= 0 and i + k < n and s[i - k] == s[i + k]:
        k = k + 1
    d1[i] = k
    if i + k - 1 > r:
        l = i - k + 1
        r = i + k - 1
```

The mirror index is $l + r - i$, which is the reflection of $i$ about the center of the big palindrome, since the center is $(l + r) / 2$ for an odd palindrome.

### The even case

```text
l = 0, r = -1
for i from 0 to n - 1:
    k = (i > r) ? 0 : min(d2[l + r - i + 1], r - i + 1)
    while i - k - 1 >= 0 and i + k < n and s[i - k - 1] == s[i + k]:
        k = k + 1
    d2[i] = k
    if i + k - 1 > r:
        l = i - k
        r = i + k - 1
```

The even case differs in two places. The center of the even palindrome is in the gap before $s[i]$, so the palindrome is $s[i-k \dots i+k-1]$ and the initial radius is $0$ rather than $1$. And the mirror index is $l + r - i + 1$, because the center of the even palindrome $[l, r]$ is at the position $(l + r + 1) / 2$.

### The interleaving trick

The two cases can be merged into one by inserting a separator between the characters, and a separator at each end.

Take the string `abba`, with the separator `#`. The transformed string is `#a#b#b#a#`, and its indices run from $0$ to $8$.

The indices are $0$ for `#`, $1$ for `a`, $2$ for `#`, $3$ for `b`, $4$ for `#`, $5$ for `b`, $6$ for `#`, $7$ for `a`, $8$ for `#`.

Now every palindrome of the original string is an odd palindrome of the transformed string, centered on a character, and the even palindromes are centered on a separator. The transformed string has length $2n + 1$, and one pass of the odd-case algorithm computes every radius.

The length of the palindrome in the original string is the radius in the transformed string, because every character of the original contributes one to the radius and every separator contributes one as well, and the two cancel.

The separator must be a character that does not occur in the string. If it does occur, the transformed string has palindromes that do not correspond to palindromes of the original.

### The amortization

Every character comparison that succeeds either extends the right edge of the rightmost palindrome or does not. The comparisons that do not extend the right edge are the ones inside the known region, and they are bounded by the same argument as the Z algorithm's.

More precisely: the number of successful comparisons at position $i$ is at most the number of characters by which the new palindrome extends past the previous right edge, plus a constant. Since the right edge never decreases and never exceeds $n$, the total number of successful comparisons is $O(n)$.

## Step-by-step execution

Take the string `abba`, of length $4$.

**The odd radii.** $d_1[i]$ is the radius of the odd palindrome centered at $i$.

| $i$ | Start | Comparison | $d_1[i]$ | Palindrome | New $[l, r]$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $k = 1$, since $0 > -1$ | the left neighbor is out of bounds | 1 | `a` | $[0, 0]$ |
| 1 | $k = 1$, since $1 > 0$ | $s[0] = \texttt{a}$ against $s[2] = \texttt{b}$, mismatch | 1 | `b` | $[1, 1]$ |
| 2 | $k = 1$, since $2 > 1$ | $s[1] = \texttt{b}$ against $s[3] = \texttt{a}$, mismatch | 1 | `b` | $[2, 2]$ |
| 3 | $k = 1$, since $3 > 2$ | the right neighbor is out of bounds | 1 | `a` | $[3, 3]$ |

So the odd radii are $[1, 1, 1, 1]$, and the longest odd palindrome is a single character.

**The even radii.** $d_2[i]$ is the radius of the palindrome centered in the gap before $s[i]$.

| $i$ | Start | Comparison | $d_2[i]$ | Palindrome | New $[l, r]$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $k = 0$, since $0 > -1$ | the left neighbor is out of bounds | 0 | none | none, since $i + k - 1 = -1$ is not greater than $r = -1$ |
| 1 | $k = 0$, since $1 > -1$ | $s[0] = \texttt{a}$ against $s[1] = \texttt{b}$, mismatch | 0 | none | $l = 1$, $r = 0$, an empty range |
| 2 | $k = 0$, since $2 > 0$ | $s[1] = \texttt{b}$ against $s[2] = \texttt{b}$, match, so $k = 1$; then $s[0] = \texttt{a}$ against $s[3] = \texttt{a}$, match, so $k = 2$; then the left neighbor is out of bounds | 2 | `abba` | $[0, 3]$ |
| 3 | $i \le r = 3$, so $k = \min(d_2[0+3-3+1], 3-3+1) = \min(d_2[1], 1) = 0$ | $s[2] = \texttt{b}$ against $s[3] = \texttt{a}$, mismatch | 0 | none | none |

So the even radii are $[0, 0, 2, 0]$, and the longest even palindrome is `abba`, of length $4$.

**The answers.** The longest palindromic substring is the longer of the longest odd and the longest even, which is `abba` of length $4$. The number of palindromic substrings is the sum of the radii plus the number of odd centers, which is

$$
\sum_{i=0}^{3} d_1[i] + \sum_{i=0}^{3} d_2[i] = 4 + 2 = 6.
$$

The six palindromic substrings are `a` at index $0$, `b` at index $1$, `b` at index $2$, `a` at index $3$, `bb` at index $2$, and `abba` at index $0$. The count checks out.

The row for $i = 3$ in the even case is the only one that uses the copy, and it copies a radius of $0$ from the mirrored position, which is correct: there is no even palindrome centered before the last `a`.

## Correctness proof

::: math theorem Theorem
The algorithm computes the odd radius $d_1[i]$ correctly for every position $i$, and the even radius $d_2[i]$ correctly for every position $i$.
:::

::: math proof Proof
The two cases have the same shape, so the proof is given for the odd case and the even case is identical with the index shifts.

The proof is an induction on $i$. The invariant is that every radius already computed is final, and that $[l, r]$ is the palindrome with the rightmost right edge among the ones already found.

**The copy is a valid lower bound.** Suppose $i \le r$. By the lemma, the radius at $i$ is at least $\min(d_1[l + r - i], r - i + 1)$. The algorithm assigns exactly this value, so it starts from a value that is at most the true radius.

**The extension reaches the true radius.** After the copy, the algorithm compares $s[i - k]$ with $s[i + k]$ and increments $k$ while they are equal, stopping at the first mismatch or at the end of the string. Each successful comparison extends a palindrome, and the palindrome stops exactly when the next pair of characters differs. So the value at the end is the true radius, provided the starting value was a lower bound and no radius is missed by starting too high.

**The starting value is never too high.** The lemma gives a lower bound, so the copy is never too high. When $i > r$ there is no known palindrome containing $i$, and the algorithm starts at the smallest possible radius, which is $1$ for an odd palindrome, and that is a lower bound too.

The induction closes, and the update of $[l, r]$ keeps the invariant because the new palindrome is a palindrome and its right edge is compared against the old one. $\square$
:::

::: math theorem Theorem
The algorithm performs $O(n)$ character comparisons.
:::

::: math proof Proof
Consider the successful comparisons at position $i$. Each of them extends the palindrome at $i$ by one character on the right, so the rightmost character of the palindrome at $i$ is $i + k - 1$ where $k$ is the final radius. The number of successful comparisons at $i$ is at most $\max(0, i + k - 1 - r)$ plus the number of comparisons that stay inside the old rightmost palindrome, which is at most $1$ by the copy.

Summed over all positions, the first term telescopes: the right edge increases from its initial value to at most $n - 1$ and never decreases, so the sum of the increases is at most $n$. The second term contributes at most $n$. The failing comparisons number at most one per position. So the total is at most $3n$. $\square$
:::

## Complexity analysis

| Quantity                                    | Cost                                        |
| ------------------------------------------- | ------------------------------------------- |
| Building the odd radii                      | $O(n)$ time                                 |
| Building the even radii                     | $O(n)$ time                                 |
| The interleaving form                       | $O(n)$ time, on a string of length $2n + 1$ |
| Space                                       | $O(n)$ for the two radius arrays            |
| The longest palindromic substring           | $O(1)$ after the arrays are built           |
| The number of palindromic substrings        | $O(1)$ after the arrays are built           |
| The number of palindromes of a given length | $O(n)$                                      |
| The quadratic expansion                     | $O(n^2)$ time                               |

The space is two arrays of $n$ integers, or one array of $2n + 1$ in the interleaving form. At $n = 10^6$ that is $8$ megabytes with 32-bit entries.

The count of palindromic substrings is worth stating as a formula, because it is asked often:

$$
\#\{\text{odd palindromes}\} = \sum_{i=0}^{n-1} d_1[i],
\qquad
\#\{\text{even palindromes}\} = \sum_{i=0}^{n-1} d_2[i].
$$

Each center of radius $k$ contributes exactly $k$ palindromes, one for each radius from $1$ to $k$, and the odd centers contribute their radius count as well. The reasoning is that a center of radius $k$ has palindromes of every radius from $1$ to $k$, and no others.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The longest palindromic substring | Manacher, $O(n)$ |
| The number of palindromic substrings | Manacher, then sum the radii |
| The number of palindromes of each length | Manacher, then a histogram of the radii |
| The longest palindromic prefix | Manacher, then a scan of the odd radii |
| The longest palindromic subsequence | An [interval dynamic program](/algorithms/dynamic-programming/interval-dp), $O(n^2)$ |
| The number of distinct palindromes | A palindromic tree, which is not covered here |
| The palindromes in a range of queries | A different technique; the radii do not answer range queries directly |
| One palindrome check | A direct comparison, $O(n)$ |
| The longest common substring | A [suffix array](/algorithms/strings/suffix-array) |

The last row is worth a moment. The longest common substring of two strings is not a palindrome question, and the Manacher algorithm does not apply to it. It is a suffix array question, and the two techniques are used side by side often enough that confusing them is common.

The sixth row is the boundary of the article. The **palindromic tree** stores one node per distinct palindromic substring, and it answers the number of distinct palindromes, the number of occurrences of each palindrome, and the longest palindromic suffix of every prefix. It is built in $O(n)$ time with a suffix-link structure, and it is the natural next step.

## Recursion decision

The Manacher algorithm is iterative, and it should be. The state is the rightmost palindrome, and the algorithm walks the centers from left to right while updating it.

The recursive formulation people try first is the expansion itself: a function `expand(center, radius)` that compares the characters and calls itself with the radius increased by one. That recursion has a depth equal to the radius of the palindrome, which for a string of $10^6$ identical characters is $5 \times 10^5$ frames deep.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the recursive form is exactly at the edge |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of $1000$ | Iterative |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

So the recommendation is the iterative form in every language, and the reason is not only the stack. The recursive expansion is $O(n^2)$ even with a deep stack, because it redoes the work that the copy avoids. The copy is what makes the algorithm linear, and the copy needs the loop.

There is one recursive variant that is safe, and it is the **divide and conquer** form that computes the radii of the left half, the right half, and then the whole string, using the longest palindrome that crosses the middle. Its depth is $O(\log n)$, which is at most $20$, and it is safe in every language. It is also quadratic in time, so it is never the right answer.

## Implementation walkthrough

The mirror index is the line that matters, and the two cases use different formulas.

```cpp
// the odd case: the center is a character
int k = (i > r) ? 1 : min(d1[l + r - i], r - i + 1);
```

```cpp
// the even case: the center is a gap before s[i]
int k = (i > r) ? 0 : min(d2[l + r - i + 1], r - i + 1);
```

The difference between `l + r - i` and `l + r - i + 1` is the whole difference between the two cases, and it is a consequence of where the center is. The odd palindrome $[l, r]$ has its center at the character $(l + r) / 2$, so the reflection of $i$ is $l + r - i$. The even palindrome $[l, r]$ has its center in the gap at position $(l + r + 1) / 2$, so the reflection of the gap before $i$ is $l + r - i + 1$.

The extension loop is the second thing that matters.

```cpp
while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) {
    ++k;
}
```

The two bounds must be tested before the characters are read. A program that reads `s[i - k]` first and tests the bounds afterwards reads out of bounds on the first iteration, when $k = 1$ and $i = 0$.

The interleaving form is the third detail, and the separator is the danger.

```cpp
std::string t;
t.reserve(2 * n + 1);
for (char c : s) { t.push_back('#'); t.push_back(c); }
t.push_back('#');
```

The separator must not occur in $s$. Choosing a character that does occur is the bug in the common mistakes section, and it is invisible in a test on a lowercase string, because `#` is not a lowercase letter. It is visible the moment the string contains a `#`.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `l + r - i` in the even case | The mirror is off by one and the radii are wrong | Use `l + r - i + 1` |
| Starting the even radius at $1$ | The even radii are all shifted | Start at $0$ |
| Reading the characters before testing the bounds | A read past the end of the string | Test the bounds first |
| Using a separator that occurs in the string | Spurious palindromes | Choose a character outside the input alphabet |
| Forgetting the interleaving separator at the two ends | The first and the last palindromes are missed | Add a separator at each end |
| Assuming the radius is the length of the palindrome | The reported length is wrong for the even case | The odd palindrome has length $2k - 1$ and the even has length $2k$ |
| Counting the palindromes as the number of centers | The count is $n$ instead of the real count | Sum the radii |
| Updating `[l, r]` unconditionally | The rightmost palindrome shrinks and the amortization breaks | Update only when the right edge grows |
| Using the radii to answer a subsequence question | The answer is a different quantity | Check the statement for the word "subsequence" |

### Why this fails: the mirror without the truncation

The plausible wrong approach is to copy the mirrored radius without truncating it at the boundary of the rightmost palindrome. The reasoning is that the big palindrome is symmetric, so the radius at the mirrored center is the radius at the current center, and the copy is free.

The copy is free. What is wrong is the claim that the two radii are equal without the truncation, because the mirrored palindrome may reach past the **left** edge of the big palindrome, and there the symmetry no longer applies.

The smallest counterexample is the string `aaaa`, of length $4$.

**The odd radii.** The algorithm proceeds as follows.

| $i$ | Rightmost palindrome | The copy without the truncation | The copy with the truncation | True $d_1[i]$ |
| --- | --- | --- | --- | --- |
| 0 | none |  | $k = 1$ | 1 |
| 1 | $[0, 0]$ |  | $k = 1$ | 2 |
| 2 | $[0, 2]$ | $d_1[0 + 2 - 2] = d_1[0] = 1$ | $\min(1, 2 - 2 + 1) = 1$ | 2 |
| 3 | $[1, 3]$ | $d_1[1 + 3 - 3] = d_1[1] = 2$ | $\min(2, 3 - 3 + 1) = 1$ | 1 |

The true odd radii of `aaaa` are $[1, 2, 2, 1]$. The buggy program produces $[1, 2, 2, 2]$.

The row for $i = 3$ is the failure. The rightmost palindrome is $[1, 3]$ and the center is $2$. The mirror of $3$ is $1$, and the odd radius at $1$ is $2$, describing the palindrome `aaa` at positions $0, 1, 2$. But the current center $3$ can only reach position $2$ on the left, because position $4$ does not exist. The mirrored palindrome extends past the left edge of the rightmost palindrome, and the symmetry does not apply there.

The truncated copy, $\min(d_1[1], r - i + 1) = \min(2, 1) = 1$, is exactly right, and the extension loop then finds nothing more, because the right-hand neighbor is out of bounds.

The lesson generalizes: **a copy is only valid over the range the source guarantees.** The rightmost palindrome guarantees symmetry over its own extent and no further, and the copy must be cut at the boundary.

## Variants and extensions

- **The palindromic tree.** The structure that answers the questions about distinct palindromes, the number of occurrences of each palindrome, and the longest palindromic suffix of every prefix. It is built in $O(n)$ time with a suffix-link structure, and it is the natural successor to this article.
- **The palindromic factorization.** The minimum number of palindromic pieces into which a string can be cut, or the minimum total length of the cuts. It is computed from the radius arrays in $O(n \log n)$ time.
- **The Manacher algorithm on a transformed string.** The interleaving trick, which merges the odd and the even cases into one pass. It is the form most implementations use.
- **The Manacher algorithm on an array.** The same construction works on any sequence with an equality test, so it computes the longest palindromic subarray of an integer array.
- **The Z algorithm on the reversed string.** The longest palindromic substring can also be found by combining the Z arrays of the string and of its reversal, and the comparison is instructive: the Z array reuses work through a _prefix_ relation and the Manacher algorithm through a _mirror_ relation.
- **The palindrome radius for a specific pattern.** A specialized linear-time algorithm finds the occurrences of a pattern that are palindromes, when the pattern is fixed and the text is long.
- **The range queries over the radii.** A sparse table over the odd and even radii answers "how many palindromes of length at least $k$ start in this range" in constant time, and it is the same structure as the one in the [sparse table](/algorithms/range-queries/sparse-table) article.

## Contest strategy

1. Decide between a substring and a subsequence question before writing anything. A subsequence question is an interval dynamic program with $O(n^2)$ time and $O(n^2)$ space, and the Manacher algorithm does not answer it.
2. Write the two mirror formulas down separately: `l + r - i` for the odd case and `l + r - i + 1` for the even case.
3. Use the interleaving form unless there is a reason not to. It halves the amount of code and removes the chance of a mismatch between the two cases.
4. Choose a separator that cannot occur in the string, and put one at each end.
5. Test the bounds before reading the characters.
6. Update the rightmost palindrome only when the right edge grows.
7. Test the string `aaaa` explicitly. It is the case in which the copy is truncated, and a program that is right on `abba` and wrong on `aaaa` has the bug in the truncation.
8. Remember the length formulas: an odd palindrome of radius $k$ has length $2k - 1$ and an even palindrome of radius $k$ has length $2k$.

## Worked problems

### Problem 1: the longest palindromic substring

**Restatement.** Given a string of length $n \le 10^6$, report the length of the longest palindromic substring and one position at which it occurs.

**Naive baseline.** Expand around every center, which is $O(n^2)$ and reaches $5 \times 10^{11}$ comparisons on a string of identical characters.

**Insight.** A palindrome is symmetric, so the radii of the centers inside it are copies of the radii on the other side.

**Derivation.** Build the odd and the even radius arrays. The longest odd palindrome has length $2 \max_i d_1[i] - 1$ and the longest even has length $2 \max_i d_2[i]$. Report the larger, and the position of the center that achieves it.

**Correctness.** The theorem of the correctness proof gives the radii, and every palindrome has either an odd or an even center, so the maximum over the two arrays is the length of the longest palindrome.

**Complexity.** $O(n)$ time and $O(n)$ space. At $n = 10^6$ that is about two million comparisons.

**Common wrong approach.** Reporting the radius as the length, which gives an odd answer for every even palindrome and is wrong by one.

### Problem 2: the number of palindromic substrings

**Restatement.** Given a string of length $n \le 10^6$, report the number of palindromic substrings, counting each occurrence separately, modulo $10^9 + 7$.

**Naive baseline.** Expand around every center and count the palindromes found, which is $O(n^2)$.

**Insight.** A center of radius $k$ contributes exactly $k$ palindromes, one for each radius from $1$ to $k$.

**Derivation.** Build the radius arrays and sum them, with the sum reduced modulo $10^9 + 7$ as it is accumulated.

**Correctness.** Every palindromic substring has a unique center and a unique radius, and the palindromes at a center of radius $k$ are exactly those of radius $1$ through $k$. So the sum of the radii counts every palindrome exactly once.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Counting the centers, which gives $n$ odd palindromes and misses every even palindrome and every longer odd palindrome.

### Problem 3: the palindromes of a given length

**Restatement.** Given a string of length $n \le 10^6$, report the number of palindromic substrings of length exactly $k$.

**Naive baseline.** For each position, check whether the window of length $k$ is a palindrome, which is $O(nk)$.

**Insight.** A palindrome of length $k$ at a center means that the radius at that center reaches $k$, and the radius array already knows the largest radius at every center.

**Derivation.** Build the radius arrays. For an odd length $k$, a center $i$ gives a palindrome of length $k$ exactly when $d_1[i] \ge (k+1)/2$. For an even length $k$, a center $i$ gives one exactly when $d_2[i] \ge k/2$. Count the centers that satisfy the condition.

**Correctness.** The palindrome of length $k$ centered at $i$ exists exactly when the radius at $i$ is at least the radius of that palindrome, which is the condition above. Every palindrome of length $k$ has a unique center, so the count is exact.

**Complexity.** $O(n)$ time and $O(n)$ space, against $O(nk)$ for the direct check. The direct check is competitive when $k$ is small, which is worth knowing.

**Common wrong approach.** Using the radius as the length and testing whether any radius equals $k$, which finds the palindromes whose _maximum_ radius is $k$ rather than the palindromes of length $k$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about palindromic substrings, palindromic subsequences, or distinct palindromes, and pick the technique for each.
2. **Direct application.** Implement the odd and the even radius arrays, and check them against the quadratic expansion on every string of length at most ten over the alphabet `{a, b}`.
3. **Adaptation.** Write the interleaving form, the version that works on an integer array, and the version that computes the longest palindromic prefix.
4. **Combination.** Combine the radius arrays with a [sparse table](/algorithms/range-queries/sparse-table) for range queries about the palindromes, and with a [prefix sum](/algorithms/arrays/prefix-sums) array for the counting version.
5. **Challenge.** Build the palindromic tree over a string of length $10^6$, and check that it has at most $n$ distinct palindromes and one node for each of them.
6. **Transfer.** Recognize a palindrome question in a different shape: the minimum palindromic factorization, the palindromes in a text with wildcards, or the longest palindromic substring after several insertions.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the definitions of the odd radius and the even radius. (Formal model)
2. State the mirror lemma, and explain where the truncation comes from. (Formal model)
3. Why is the mirror index `l + r - i` in the odd case and `l + r - i + 1` in the even case? (Implementation walkthrough)
4. What is the smallest counterexample that breaks the copy without the truncation? (Common mistakes)
5. How does the amortization bound the number of character comparisons? (Correctness proof)
6. What does the interleaving trick do, and what must the separator satisfy? (Algorithm derivation)
7. Why does a center of radius $k$ contribute exactly $k$ palindromes? (Complexity analysis)
8. What is the length of an odd palindrome of radius $k$, and of an even one? (Common mistakes)
9. Which question does the palindromic tree answer that this algorithm does not? (Algorithm selection)
10. When is the recursive form dangerous, and in which languages? (Recursion decision)
11. Which constraint value rules out the quadratic expansion? (Recognition patterns)

## Further reading

- The subject index lists this technique, [the Manacher algorithm](/algorithms/strings/manacher), beside the other string algorithms in the encyclopedia.
- The sibling algorithm, which reuses work through a prefix relation rather than a mirror relation, is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The exact linear-time pattern search is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The structure that answers the questions about distinct palindromes is the palindromic tree, which is not yet covered.
- The quadratic technique that answers the palindromic **subsequence** question is in [interval dynamic programming](/algorithms/dynamic-programming/interval-dp).
- The structure that answers the longest common substring question is in [the suffix array](/algorithms/strings/suffix-array).
- The subject overview, which lists the string techniques that are not yet covered, is at [the strings](/algorithms/strings/).
- The sparse table that the range queries use is in [a sparse table](/algorithms/range-queries/sparse-table).
