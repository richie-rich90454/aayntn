---
id: strings.z-algorithm
title: The Z algorithm
summary: Compute the length of the longest match between the whole string and each of its suffixes in linear time, by reusing the work already done inside a matched window.
division: [gold]
subjects: [strings]
level: intermediate
importance: common-contest-technique
keywords:
    [
        z algorithm,
        z function,
        z box,
        string matching,
        longest common prefix,
        linear string algorithm,
        prefix function,
    ]
prerequisites:
    required: [foundations.complexity, strings.kmp]
    recommended: [foundations.recursion, searching.two-pointers, arrays.prefix-sums]
complexity:
    time: "O(n) to build, O(n + m) for a search"
    space: "O(n)"
assumptions:
    - The whole string is available before the answer is required, so the algorithm may read the string more than once.
    - Comparing two characters takes constant time.
    - The length of the string is known, so the array of results can be allocated in advance.
reviewed: false
---

## At a glance

The Z array of a string $s$ of length $n$ is the array $z$ with $z[i]$ equal to the length of the longest common prefix of $s$ and the suffix $s[i \dots n)$. The array answers "how much of the string matches here" at every position at once.

The algorithm that computes it is linear, and its whole idea is the **Z-box**: when the algorithm has found that $s[l \dots l + z[l])$ equals the prefix $s[0 \dots z[l])$, the whole window is known to match, and the values inside it can be copied rather than recomputed.

The cost is $O(n)$ time and $O(n)$ space, against $O(n^2)$ for the naive comparison at every position. The proof of linearity is an amortized argument: every character comparison that is not a copy advances the right end of the box, and the right end never moves backward.

The Z array is the counterpart of the [prefix function](/algorithms/strings/kmp), and it is the better tool when the question is about the whole string rather than about a separate pattern.

## Problem motivation

A search engine indexes a corpus of $10^6$ documents, each of length about $10^5$. For a query word, it must find every position at which the word occurs. The naive search compares the query against every position of every document, which is $10^{11}$ positions and $10^{12}$ character comparisons.

The linear-time pattern search of [Knuth-Morris-Pratt](/algorithms/strings/kmp) solves it in $O(n + m)$ per document. There is another way, and it is the one this article describes: concatenate the query and the document with a separator that cannot occur inside either, compute the Z array of the concatenation, and read off the positions where the Z value reaches the length of the query.

The Z array is also the answer to a family of questions that do not mention a pattern at all. "What is the longest common prefix of the string and each of its suffixes?" is answered directly. "How many positions have a common prefix of length at least $k$ with the string?" is a histogram of the Z array. "Is there a rotation of the string that is a palindrome?" is a question about two Z arrays.

The constraints are $n \le 10^6$ characters, and the time limit is the usual two seconds.

## Recognition patterns

The Z algorithm is the right tool when all of the following hold.

- The question is about the **longest prefix of a string that matches at each position**, or about something reducible to it.
- The pattern, if there is one, is **concatenated** with the text, and the question becomes a question about one string.
- The string is **static**, so that the array can be built once and queried many times.
- The answer must be **exact**, which is a difference from the [rolling hash](/algorithms/strings/rolling-hash).

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One comparison of two prefixes | Rules out the technique; a direct comparison is simpler |
| $n \le 10^3$ | The naive $O(n^2)$ program is fine and is the reference implementation |
| $n \le 10^6$ | The linear program is required |
| The pattern must be found exactly, with no error chance | Rules in the Z algorithm over a rolling hash |
| The question is about a **separate** pattern, not about the string's own prefix | Either is fine; [KMP](/algorithms/strings/kmp) is the more usual choice |
| The question is about the **longest common substring** of two strings | Rules out the Z algorithm; use a suffix array |

The last two rows are the ones that decide between the Z algorithm and its sibling. The Z array is about the string's own prefix, so a separate pattern has to be glued on. When the pattern is separate and the question is only "does it occur", the prefix function is the shorter program, because it does not need the concatenation.

The second-to-last row is worth more: the Z algorithm is exact, and the rolling hash is not. A problem that demands a guaranteed answer and does not tolerate a failure mode should reach for the Z array or a suffix array before it reaches for a hash.

## Naive approach

The baseline compares the prefix with every suffix.

```python
def z_naive(s):
    n = len(s)
    z = [0] * n
    for i in range(1, n):
        k = 0
        while i + k < n and s[k] == s[i + k]:
            k += 1
        z[i] = k
    return z
```

This is correct, it is $O(n^2)$ in the worst case, and it is the reference implementation for the differential test. The string `aaaa...a` is the worst case, because every suffix matches the prefix for the whole of its length.

The second baseline is the one that shows what the Z algorithm has to beat. It is the same function with the inner loop written as a comparison against the whole prefix, and it is the same program.

The interesting question is therefore not what to replace, but where the repeated work is. In the naive program, the inner loop for position $i$ recomputes a comparison that an earlier position has already made. The Z algorithm's job is to remember that comparison and reuse it.

## Key insight

The insight is that **a match at one position tells you a lot about the positions inside that match**.

Suppose the algorithm has discovered that $s[l \dots l + L)$ equals the prefix $s[0 \dots L)$, so that $z[l] = L$. Call the range $[l, l + L)$ the **Z-box**.

Now consider a position $i$ inside the box, with $l < i < l + L$. The substring $s[i \dots l+L)$ is a suffix of the box, and the box equals the prefix, so $s[i \dots l+L)$ equals $s[i-l \dots L)$. Therefore the match starting at $i$ is at least as long as the match starting at $i - l$:

$$
z[i] \ge \min\bigl(z[i-l],\; l + L - i\bigr).
$$

The **min** is the essential part, and it is where the amortization comes from. If $i - l$ is far enough inside the box, the copy is exact. If $i$ is near the right end of the box, the copy is truncated at the right end of the box, and the algorithm must compare the remaining characters itself.

That truncation is the only place the algorithm does real work, and it is bounded, because every character it compares there advances the right end of the box.

## Formal model

Let $s$ be a string of length $n$ over an arbitrary alphabet.

::: math definition Definition
The **Z-array** of a string $s$ of length $n$ is the array $z$ of length $n$ with $z[0] = n$ and, for $1 \le i < n$,

$$
z[i] = \max\bigl(\{k : 0 \le k \le n - i,\; s[0..k-1] = s[i..i+k-1]\} \cup \{0\}\bigr).
$$

The **Z-box** at a moment of the algorithm is a range $[l, r)$ with $l < r$ such that $s[l \dots r)$ equals $s[0 \dots r-l)$, that is, $z[l] = r - l$.
:::

::: math lemma Lemma
Let $[l, r)$ be a Z-box and let $l < i < r$. Then

$$
z[i] \ge \min\bigl(z[i-l],\; r - i\bigr).
$$
:::

::: math proof Proof
The box says $s[l \dots r) = s[0 \dots r-l)$, so for every $j$ with $0 \le j < r - i$, the characters $s[l + j]$ and $s[j]$ are equal.

Write $t = i - l$, so that $0 < t < r - l$. The equality above gives $s[i + j] = s[l + (t + j)] = s[t + j]$ for every $j$ with $0 \le j < r - l - t = r - i$. So the first $r - i$ characters of the suffix at $i$ match the first $r - i$ characters of the suffix at $t = i - l$.

If $z[t] \ge r - i$, that gives $z[i] \ge r - i$ directly. Otherwise $z[t] < r - i$, and the match at $t$ has length $z[t]$, so $s[t + j] = s[j]$ for every $j < z[t]$, and therefore $s[i + j] = s[j]$ for every $j < z[t]$, which gives $z[i] \ge z[t] = \min(z[t], r-i)$. $\square$
:::

::: math invariant Invariant
At the start of every iteration, the range $[l, r)$ is a Z-box, so $z[l] = r - l$, and every $z[j]$ already computed for $l < j < i$ holds its final value. The algorithm never decreases $r$, and the value of $r$ is the sum of the lengths of all the character comparisons that were not copied.
:::

## Algorithm derivation

The algorithm keeps the Z-box $[l, r)$ and walks the position $i$ from $1$ to $n-1$.

```text
z[0] = n
l = 0, r = 0
for i from 1 to n - 1:
    if i < r:
        z[i] = min(z[i - l], r - i)
    while i + z[i] < n and s[z[i]] == s[i + z[i]]:
        z[i] = z[i] + 1
    if i + z[i] > r:
        l = i
        r = i + z[i]
```

The four steps are the whole algorithm.

1. **Copy.** If $i$ is inside the box, the lemma gives a lower bound on $z[i]$, and the value is copied rather than recomputed.
2. **Extend.** The characters beyond the copied part are compared one at a time, and the comparison stops at the first mismatch or at the end of the string.
3. **Update the box.** If the match reaches past the current right end, the box becomes the new match.
4. **Advance.** The position increases.

The copy in step 1 is the reuse argument. The comparison of $s[z[i]]$ with $s[i + z[i]]$ in step 2 is the only real work, and it happens at most once per position outside the box.

### The amortization

The right end $r$ never decreases, because the box is only updated when the new match reaches further than the old one. Every character comparison in step 2 either

- fails immediately, in which case it happens at most once per position, or
- succeeds and extends the match, in which case it advances $r$ by one.

In the second case, the comparison is charged to the advance of $r$. Since $r$ starts at $0$ and never exceeds $n$, the total number of successful comparisons is at most $n$. The failing comparisons number at most $n$, one per position. So the total number of comparisons is at most $2n$, and the algorithm is linear.

The subtlety worth stating: the copy in step 1 does **not** advance $r$, so a long copy is free, and that is where the linear bound comes from. A program that recomputed the match from scratch at every position would perform $O(n^2)$ comparisons, and the box is exactly what prevents it.

### The pattern search

To find every occurrence of a pattern $P$ in a text $T$, build $S = P + \# + T$, where $\#$ is a character that occurs in neither $P$ nor $T$. Compute the Z array of $S$. An occurrence of $P$ starts at position $|P| + 1 + j$ in $T$ exactly when $z[|P| + 1 + j] \ge |P|$.

The separator is what makes the trick work. Without it, a Z value of $|P|$ at a position inside $T$ might be matching characters that run past the end of $P$, and the test would be wrong. With the separator, the match cannot cross the boundary, so a Z value of at least $|P|$ means the pattern matched completely.

## Step-by-step execution

Take the string `abacaba`, of length $7$.

The initialization is $z[0] = 7$, $l = 0$, $r = 0$.

| $i$ | Copy | Extensions | $z[i]$ | Box after the step |
| --- | --- | --- | --- | --- |
| 1 | $i \ge r$, no copy | `s[0]=a` against `s[1]=b`, mismatch | 0 | $l = 1$, $r = 1$, an empty box |
| 2 | $i \ge r$, no copy | `s[0]=a` against `s[2]=a`, match; `s[1]=b` against `s[3]=c`, mismatch | 1 | $l = 2$, $r = 3$ |
| 3 | $i \ge r$, no copy | `s[0]=a` against `s[3]=c`, mismatch | 0 | $r$ stays $3$ |
| 4 | $i \ge r$, no copy | `s[0]=a` against `s[4]=a`, match; `s[1]=b` against `s[5]=b`, match; `s[2]=a` against `s[6]=a`, match; the string ends | 3 | $l = 4$, $r = 7$ |
| 5 | $i < r$, so $z[5] = \min(z[1], 7-5) = \min(0, 2) = 0$ | `s[0]=a` against `s[5]=b`, mismatch | 0 | $r$ stays $7$ |
| 6 | $i < r$, so $z[6] = \min(z[2], 7-6) = \min(1, 1) = 1$ | the string ends | 1 | $i + z[i] = 7$, so $r$ stays $7$ |

The final Z array is $[7, 0, 1, 0, 3, 0, 1]$.

Position 5 is where the reuse happens. The box at that moment is $[4, 7)$, and $i - l = 1$, so the algorithm copies $\min(z[1], r - i) = \min(0, 2) = 0$ and then tries to extend. The extension fails immediately, and the answer is $0$.

Position 6 is the more interesting one, because the copy is truncated. The box is still $[4, 7)$, $i - l = 2$, and $z[2] = 1$, so the copy is $\min(1, 7 - 6) = 1$. The match at position 6 is the single character `a`, because the string ends there. The truncated copy of length $1$ is exactly right.

The answer checks out by hand. The suffix at position $2$ is `acaba` and the string starts with `ab`, so they agree on the first character only, and $z[2] = 1$. The suffix at position $4$ is `aba` and the string starts with `aba`, so $z[4] = 3$. The suffix at position $6$ is `a`, so $z[6] = 1$.

## Correctness proof

::: math theorem Theorem
The algorithm computes the Z array of the string correctly.
:::

::: math proof Proof
The proof is an induction on the position $i$.

**The copy is a valid lower bound.** Suppose $i < r$. The box $[l, r)$ is a Z-box, so by the lemma $z[i] \ge \min(z[i-l], r-i)$. The algorithm assigns exactly this value to $z[i]$, so the value it starts from is a lower bound on the true one, and it never exceeds it.

**The extension reaches the true value.** After the copy, the algorithm compares $s[z[i]]$ with $s[i + z[i]]$ and increments while they are equal, stopping at the first mismatch or at the end of the string. Each successful comparison extends a match, and the match stops exactly when the next pair of characters differs or the string ends. So after the extension, $z[i]$ is the length of the longest common prefix of the string and the suffix at $i$, which is the definition of the Z value.

**The box is maintained.** The algorithm sets the box to $[i, i + z[i])$ whenever the match reaches past the old right end, and $z[i]$ was just shown to be correct, so the new range is a Z-box. When the match does not reach past the old right end, the box is left alone and remains a Z-box.

**Nothing is lost.** The induction hypothesis says the Z values before $i$ are correct, and the copy uses $z[i-l]$ with $i - l < i$, which is one of them. The proof closes. $\square$
:::

::: math theorem Theorem
The algorithm performs $O(n)$ character comparisons.
:::

::: math proof Proof
Every comparison that fails is the last comparison of its position, so there are at most $n$ of them. Every comparison that succeeds is part of the extension loop at some position, and it advances the right end of the match at that position by one. After the extension loop, the algorithm sets $r$ to $i + z[i]$ if that is larger than the old $r$. The value $r$ never decreases and never exceeds $n$, so the total number of successful comparisons is at most $n$. The total is therefore at most $2n$. $\square$
:::

## Complexity analysis

| Quantity                                   | Cost                 |
| ------------------------------------------ | -------------------- |
| Building the Z array                       | $O(n)$ time          |
| Space                                      | $O(n)$ for the array |
| One Z query                                | $O(1)$               |
| The pattern search, with the concatenation | $O(n + m)$ time      |
| The naive comparison at every position     | $O(n^2)$ time        |

The space is one array of $n$ integers, which is $4$ megabytes for a string of $10^6$ characters with 32-bit entries. The algorithm needs only two extra variables beyond the array.

The pattern search costs $O(n + m)$ rather than $O(n)$ because the concatenation has length $n + m + 1$. The separator costs one character.

There is a second way to spend the space, and it is worth knowing. The Z array and the prefix function carry the same information, and a program that needs both can compute one from the other in linear time. The [Knuth-Morris-Pratt](/algorithms/strings/kmp) article shows the prefix function and explains the border chain; the two arrays are the same data seen from two directions.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The longest prefix match at every position of a string | The Z algorithm |
| Find every occurrence of a pattern in a text | Either the Z algorithm on the concatenation or [KMP](/algorithms/strings/kmp) |
| The longest common prefix of a string and each of its suffixes | The Z array |
| The number of positions with a match of length at least $k$ | A histogram of the Z array |
| The longest common prefix of two arbitrary strings | The Z algorithm on the concatenation of the two, or the extended Z algorithm |
| The longest common **substring** of two strings | A [suffix array](/algorithms/strings/suffix-array) |
| Substring equality queries with no error chance | A suffix array, or the [rolling hash](/algorithms/strings/rolling-hash) with verification |
| The longest palindromic substring | The [Manacher algorithm](/algorithms/strings/manacher) |
| The borders of a string | The prefix function, not the Z array |

The seventh row is the one that surprises people. The rolling hash answers substring equality in constant time, which the Z array does not, so the hash is the faster tool for that question, at the cost of a failure mode. The choice between them is a choice between speed and certainty, and the Z array is the right one when the problem is a "does it occur" question rather than an "are these equal" question.

The last row is a real distinction. The borders of a string are the prefixes that are also suffixes, and the prefix function stores them directly. The Z array does not, and reading a border out of the Z array requires a different argument.

## Recursion decision

The Z algorithm is iterative, and there is no natural recursive form of it. The reason is structural: the algorithm's state is the current box, and the box is updated as the position advances. A recursive version would have to return the box to the caller, which is exactly the bookkeeping the loop does for free.

There are two recursive variants that do exist, and they are worth distinguishing.

The first is the **divide and conquer** computation, which computes the Z array of the left half, of the right half, and of the whole string, and combines them. Its depth is $O(\log n)$, which is at most $20$ for any string a contest will give, and it is safe in every language.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the divide and conquer form is also safe |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of $1000$ | Iterative; the divide and conquer form is also safe |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The second is the **binary search on the length of a longest common prefix**, which uses the Z array as the predicate. Its depth is $O(\log n)$, and it is safe everywhere, but the loop is the same length as the function.

So the answer is uniform: use the iterative form in every language. It is the shortest code, it has no stack limit, and the divide and conquer variant's extra $O(\log n)$ factor buys nothing at contest sizes.

## Implementation walkthrough

The copy is the line that matters, and the min is the part of it that is easiest to get wrong.

```cpp
if (i < r) {
    z[i] = std::min(z[i - l], r - i);   // the copy, truncated at the box
} else {
    z[i] = 0;
}
```

Omitting the `min` and writing `z[i] = z[i - l]` is the classic bug, and the common mistakes section has the counterexample. The reason the truncation is needed is that the value at $i - l$ may describe a match that runs past the right end of the box, and the box does not guarantee anything beyond its right end.

The box update is the second line that matters.

```cpp
if (i + z[i] > r) {
    l = i;
    r = i + z[i];
}
```

The condition is strictly greater, not greater or equal. With a greater-or-equal condition, a zero-length match at a position inside the box would replace the box with an empty one, and the next position would have no box to copy from. The condition as written keeps the box non-empty and keeps the right end as far right as it has ever been.

The initialization is the third detail.

```cpp
z[0] = n;      // the whole string matches itself
int l = 0, r = 0;
```

Setting `z[0] = 0` instead is not a crash, but it is wrong in a subtle way. The value $z[0]$ is read by the copy at position $i$ when $i - l = 0$, which happens when $l = i$, and that is exactly the position at which the box was created. So `z[0]` is read at the first position inside each new box, and if it is $0$ the copy starts from the wrong place.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Omitting the `min` in the copy | The Z values are too large and the program reports matches that do not exist | Write `min(z[i - l], r - i)` |
| Setting `z[0] = 0` | The copy at the first position inside a new box starts from zero | Set `z[0] = n` |
| Using `>=` in the box update | An empty box replaces a good one | Use a strict `>` |
| Comparing `s[z[i]]` with `s[i + z[i]]` past the end of the string | A read past the end, or a crash | Test `i + z[i] < n` first |
| Forgetting the separator in the concatenated pattern search | A match that runs past the end of the pattern is reported as an occurrence | Use a character that occurs in neither string |
| Forgetting that the box is half-open | Off-by-one in the truncation | Write the box as $[l, r)$ |
| Recomputing the match at every position instead of copying | The program is quadratic | Copy from the box |
| Comparing the wrong pair of characters | The Z values are meaningless | Compare `s[k]` with `s[i + k]` |
| Using the Z array to answer a longest common substring question | The answer is the longest common prefix, not the longest common substring | Use a suffix array |

### Why this fails: the copy without the truncation

The plausible wrong approach is to copy the value at $i - l$ without truncating it at the right end of the box. The reasoning is that the box says the whole range matches the prefix, so the match at $i$ should be at least the match at $i - l$, and the copy is free.

The copy is free. What is wrong is the claim that the match at $i$ is at least the match at $i - l$, without the truncation.

The smallest counterexample is the string `aaaa`, of length $4$.

| $i$ | Box before | Copy without the truncation | True $z[i]$ | Extension |
| --- | --- | --- | --- | --- |
| 1 | $[0, 0)$ | none | 3 | $s[0]=s[1]$, $s[1]=s[2]$, $s[2]=s[3]$, then the string ends, so $z[1] = 3$ and the box becomes $[1, 4)$ |
| 2 | $[1, 4)$ | $z[2-1] = z[1] = 3$ | 2 | the string ends at index $4$, so the extension cannot start, and $z[2]$ stays $3$ |
| 3 | $[1, 4)$ | $z[3-1] = z[2] = 3$ | 1 | the string ends, so $z[3]$ stays $3$ |

The correct Z array of `aaaa` is $[4, 3, 2, 1]$. The buggy program produces $[4, 3, 3, 3]$.

The mechanism is exact. The value $z[i-l]$ describes a match that runs from $i - l$ for $z[i-l]$ characters, and those characters lie inside the box only when $i - l + z[i-l] \le r$. At position $2$ in the table, the match at $i - l = 1$ has length $3$, so it covers positions $1, 2, 3$, and the box is $[1, 4)$. The match at position $2$ can only cover positions $2, 3$, because the string ends at position $4$. The value $3$ claims a third character that does not exist.

The truncated copy, $\min(z[i-l], r-i) = \min(3, 2) = 2$, is exactly right.

The lesson generalizes: **a copy is only valid over the range the source guarantees.** The box guarantees the match up to its right end and no further, and the copy must be cut at that boundary.

## Variants and extensions

- **The pattern search.** Concatenate the pattern, a separator, and the text, and read off the positions where the Z value reaches the length of the pattern. This is the standard alternative to [KMP](/algorithms/strings/kmp).
- **The extended Z algorithm.** The variant that computes, for two strings $A$ and $B$, the length of the longest common prefix of $B$ with each suffix of $A$, in $O(|A| + |B|)$ time. It is the same algorithm with two boxes, one for each string.
- **The suffix automaton.** A different linear-time structure that answers the substring questions directly, and the natural next step after the Z array. It is not covered here.
- **The Z array of a reversed string.** The Z array of the reversed string, combined with the Z array of the original, gives the longest palindromic substring in linear time, and it is the basis of a simpler version of the [Manacher algorithm](/algorithms/strings/manacher).
- **The Z array as a histogram.** The number of positions with a match of length at least $k$ is the number of entries of the Z array that are at least $k$, and the number with a match of exactly $k$ is a difference of two such counts.
- **The minimum period.** The smallest period of a string is the smallest $k$ such that $z[k]$ is at least $n - k$, and it is found in linear time from the Z array.
- **The rotations.** The Z array of the string doubled answers whether some rotation of the string is equal to a given string, which is the standard test for a string that is a rotation of another.

## Contest strategy

1. Decide between the Z array and the prefix function before writing any code. The Z array is about the string's own prefix; the prefix function is about a separate pattern and about the borders.
2. Write the box as a half-open range and keep that convention throughout. The truncation is `r - i`, not `r - i + 1`.
3. Use the min in the copy. It is the whole algorithm.
4. Set `z[0] = n` and start the box at `[0, 0)`.
5. Test the string `aaaa` explicitly. It is the case where the copy is truncated, and a program that gets it right on `abacaba` and wrong on `aaaa` has the bug in the min.
6. Use a separator character in the concatenation that cannot occur in the pattern or in the text. A character outside the input alphabet is the usual choice.
7. Do not use the Z array for a longest common substring question. It answers the prefix question, and the two are different.
8. When a question is about many substring equality checks, remember that the Z array is exact and the [rolling hash](/algorithms/strings/rolling-hash) is faster, and pick according to whether the problem tolerates a failure.

## Worked problems

### Problem 1: the pattern occurrences

**Restatement.** Given a pattern $P$ of length $m$ and a text $T$ of length $n$, report every position at which $P$ occurs in $T$. Constraints: $m, n \le 10^6$.

**Naive baseline.** Compare the pattern at every position, which is $O(nm)$ and reaches $10^{12}$.

**Insight.** A pattern occurrence is a position where the match with the pattern reaches the full length of the pattern, and the Z array of a concatenation measures exactly that.

**Derivation.** Build $S = P + \# + T$, where $\#$ is a character outside the input alphabet. Compute the Z array of $S$. Report the position $j$ in $T$ whenever $z[|P| + 1 + j] \ge |P|$.

**Correctness.** The separator guarantees that a match at a position in $T$ cannot run past the end of the pattern, so a Z value of at least $|P|$ means the whole pattern matched. Conversely, an occurrence of the pattern makes the Z value at that position at least $|P|$, because the next $|P|$ characters equal the pattern.

**Complexity.** $O(n + m)$ time and $O(n + m)$ space. At the maximum constraints that is about two million operations, which is comfortable.

**Common wrong approach.** Concatenating without a separator, so that a match that runs past the end of the pattern is reported as an occurrence, and the reported position is wrong.

### Problem 2: the common prefixes of all suffixes

**Restatement.** Given a string $S$ of length $n \le 10^6$, report $z[i]$ for every $i$, the length of the longest common prefix of $S$ and the suffix starting at $i$.

**Naive baseline.** Compare the prefix with every suffix, which is $O(n^2)$.

**Insight.** A match inside the current box is a copy of a match that has already been computed.

**Derivation.** The algorithm of the derivation section, with the box copied at each position.

**Correctness.** The theorem of the correctness proof.

**Complexity.** $O(n)$ time and $O(n)$ space. The number of character comparisons is at most $2n$.

**Common wrong approach.** Omitting the truncation in the copy, which produces the Z array $[4, 3, 3, 3]$ instead of $[4, 3, 2, 1]$ for the string `aaaa`.

### Problem 3: the number of repeated substrings

**Restatement.** Given a string $S$ of length $n \le 10^6$, report the number of pairs of positions $i < j$ such that the substrings starting at $i$ and at $j$ are equal, counting all lengths.

**Naive baseline.** Compare every pair of suffixes, which is $O(n^2)$.

**Insight.** The number of equal substrings starting at $i$ and $j$ is exactly the length of their common prefix, which is the Z value of one string relative to the other.

**Derivation.** Build the suffix array of $S$, which sorts the suffixes, and for each adjacent pair compute the length of their common prefix. The answer is the number of pairs of suffixes with a common prefix of length at least one, which is the number of adjacent pairs in the suffix array whose longest common prefix is at least one.

**Correctness.** Two suffixes share a common prefix exactly when they are adjacent or nearly adjacent in the suffix array, because all the suffixes sharing a common prefix form a contiguous block. So a pair with a common prefix of length at least one contributes a non-zero longest common prefix to exactly one adjacent pair.

**Complexity.** $O(n \log n)$ time for the suffix array and $O(n)$ for the scan. The Z array alone does not answer this question, because the question is about pairs of suffixes rather than about the prefix of the whole string.

**Common wrong approach.** Using the Z array of $S$ alone, which measures the match with the prefix of $S$ rather than the match between two arbitrary suffixes. The answer is then the number of positions with a Z value of at least one, which counts a different thing.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about the prefix of a string or about a separate pattern, and write the state down: the position, the box, and the array.
2. **Direct application.** Implement the Z algorithm, and check it against the naive $O(n^2)$ version on every string of length at most ten over the alphabet `{a, b}`.
3. **Adaptation.** Write the pattern search with the concatenation, the extended Z algorithm for two strings, and the version that finds the minimum period.
4. **Combination.** Combine the Z array with a suffix array for the longest common substring, and with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) for a query that asks how many positions have a Z value in a range.
5. **Challenge.** Compute the Z array of a string of length $10^7$ in $O(n)$ time with a flat array and no allocation inside the loop, and measure the memory bandwidth.
6. **Transfer.** Recognize a Z array question in a different shape: the minimum rotation of a string, the number of distinct rotations, or the longest prefix of a string that appears at least twice.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the definition of the Z array. (Formal model)
2. State the Z-box lemma and explain the min in it. (Formal model)
3. Why is the copy inside the box valid, and why must it be truncated? (Key insight)
4. What is the smallest counterexample that breaks the copy without the truncation? (Common mistakes)
5. How does the algorithm amortize its character comparisons? (Algorithm derivation)
6. What does the box guarantee, and what does it not guarantee? (Common mistakes)
7. Why does the pattern search need a separator character? (Algorithm derivation)
8. What does the Z array of `aaaa` look like, and what does the buggy version produce? (Step-by-step execution)
9. When is the Z array the right tool and the prefix function the better one? (Algorithm selection)
10. How do the Z array and the prefix function differ in what they store? (Complexity analysis)
11. Why is the iterative form preferred in every language? (Recursion decision)

## Further reading

- The subject index lists this technique, [the Z algorithm](/algorithms/strings/z-algorithm), beside the other string algorithms in the encyclopedia.
- The sibling algorithm, which answers the same questions from the other direction, is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The faster but less certain tool for substring equality is in [the rolling hash](/algorithms/strings/rolling-hash).
- The structure that answers the longest common substring question is in [the suffix array](/algorithms/strings/suffix-array).
- The linear-time palindrome algorithm, which shares the amortization argument, is in [the Manacher algorithm](/algorithms/strings/manacher).
- The subject overview, which lists the string techniques that are not yet covered, is at [the strings](/algorithms/strings/).
- The two-pointer technique that solves a family of similar questions in linear time is in [two pointers](/algorithms/searching/two-pointers).
- The search that a single character comparison replaces, when the search is a single value rather than a string, is in [binary search](/algorithms/searching/binary-search).
