---
id: strings.suffix-array
title: Suffix array
summary: Sort all the suffixes of a string in order, so that any two substrings can be compared in constant time and the longest common substring of two strings can be found in n log n time.
division: [gold, platinum]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords:
    [
        suffix array,
        suffix sort,
        prefix doubling,
        rank array,
        lcp array,
        longest common substring,
        kasai,
        radix sort,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity, strings.kmp]
    recommended: [foundations.binary-representation, range-queries.sparse-table, graphs.dfs]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The string is static, so that the suffix array can be built once and queried many times.
    - The alphabet is ordered, so that the suffixes have a lexicographic order.
    - The length of the string fits in a machine word for the purposes of the doubling construction.
reviewed: false
---

## At a glance

The suffix array of a string is the list of the starting positions of its suffixes, sorted. For the string `banana` it is $[5, 3, 1, 0, 4, 2]$, because the suffixes in lexicographic order are `a`, `ana`, `anana`, `banana`, `na`, `nana`.

The array is the answer to a surprising number of questions, because it turns the "compare two substrings" operation into a comparison of two integers. The longest common substring of two strings, the longest repeated substring, the number of occurrences of a substring, and the lexicographically smallest suffix all become short questions about the array.

The construction is **prefix doubling**. Start by ranking the suffixes by their first character, then rank them by their first two characters, then by their first four, and so on. Each round doubles the length of the prefix that distinguishes the suffixes, so there are $\lceil \log_2 n \rceil$ rounds, and each round is a linear counting sort. The total is $O(n \log n)$ time and $O(n)$ space, against $O(n^2 \log n)$ for sorting the suffixes with a comparison sort.

The rank array is the heart of the construction, and the longest common prefix array, which Kasai's algorithm computes in linear time, is the heart of the queries.

## Problem motivation

A plagiarism checker holds two documents of length $n \le 10^5$ and must report the longest substring that appears in both, together with its position in each.

The naive approach compares every substring of the first document with every substring of the second, which is $\Theta(n^4)$ and is hopeless. A better approach compares the two documents suffix by suffix, computing the longest common prefix of each pair of suffixes, which is $O(n^2)$ character comparisons. At $n = 10^5$ that is $10^{10}$, which is also hopeless.

The suffix array makes it linear in the number of suffixes. Sort the suffixes of the first document and the suffixes of the second document. Then the longest common substring is the longest common prefix of two suffixes that are adjacent across the two arrays, and the maximum of the longest common prefix over the adjacent pairs is the answer. The sorting costs $O(n \log n)$ and the scan costs $O(n)$.

The same array answers the other questions in this family. "How many times does this substring occur?" is a range query on the suffix array. "What is the longest repeated substring?" is the maximum of the longest common prefix array of one string. "What is the lexicographically smallest suffix?" is the first entry.

## Recognition patterns

The suffix array is the right tool when all of the following hold.

- The question is about **order**: the lexicographic order of suffixes, the comparison of substrings, or the order of the strings that start at a given set of positions.
- The question is about a **shared substring**, a **repeated substring**, or a **count of occurrences**.
- There are **many** substring comparisons, so that the $O(n \log n)$ preprocessing pays for itself.
- The answer must be **exact**, which is a difference from the [rolling hash](/algorithms/strings/rolling-hash).

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One comparison of two substrings | Rules out the technique; a direct comparison is simpler |
| $n \le 2000$ | A quadratic program is fine and is the reference implementation |
| $n \le 10^5$ | The suffix array is the right tool |
| $n \le 10^6$ | The suffix array is the right tool, and the memory matters |
| The question is about a single pattern's occurrences | Either this or [KMP](/algorithms/strings/kmp); KMP is linear and simpler |
| The question is about a longest common **prefix** of the string with its suffixes | The [Z algorithm](/algorithms/strings/z-algorithm) is linear and simpler |
| The alphabet is large and unordered | Requires a preliminary sorting step |

The last row is worth a sentence. The suffix array sorts the suffixes, so the alphabet must be ordered. When the characters are bytes, they are ordered already. When the "characters" are arbitrary objects with a comparison function, the first step is to sort the distinct values and replace each by its rank, which makes the alphabet an ordered set of small integers.

## Naive approach

The baseline sorts the suffixes with a comparison sort.

```python
def suffix_array_naive(s):
    n = len(s)
    return sorted(range(n), key=lambda i: s[i:])
```

This is correct, and it is the reference implementation for the differential test on strings of length at most ten.

Its cost is not what it looks like. The comparison sort performs $O(n \log n)$ comparisons, but each comparison of two suffixes walks the strings character by character, and for the string of $n$ identical characters every comparison walks $O(n)$ characters. The total is $O(n^2 \log n)$, which at $n = 10^5$ is about $10^{11}$ character comparisons.

The second baseline is the one that is instructive, because it has the right shape and the wrong constant. It sorts the suffixes by their first character, then by their first two characters, then by their first four, which is the doubling construction, but it uses a comparison sort in every round.

```python
def suffix_array_slow(s):
    n = len(s)
    order = sorted(range(n), key=lambda i: s[i])
    k = 1
    while k < n:
        order.sort(key=lambda i: s[i:i + k])
        k *= 2
    return order
```

The problem is the `s[i:i+k]` slice: it copies $k$ characters for each of the $n$ suffixes in each round, and there are $\log n$ rounds. The total cost is $O(n^2 \log n)$, the same as the naive version. The fix is to replace the character comparison with a comparison of two integers, the **ranks**, and to sort the integers with a counting sort.

## Key insight

The insight is that **the rank of a suffix's first $k$ characters determines everything needed to rank its first $2k$ characters**.

Suppose the suffixes are sorted by their first $k$ characters, and `rank[i]` is the position of the suffix starting at $i$ in that order. The first $2k$ characters of the suffix starting at $i$ are the first $k$ characters of that suffix, followed by the first $k$ characters of the suffix starting at $i + k$.

So the pair

$$
\bigl(\operatorname{rank}[i],\; \operatorname{rank}[i+k]\bigr)
$$

determines the first $2k$ characters of the suffix at $i$, and comparing two such pairs compares the two $2k$-character prefixes. When the pairs are equal, the tie is broken by the characters beyond $2k$, which are settled in the next round.

That is the whole construction. The rank array is the state, and the doubling is the update.

## Formal model

Let $s$ be a string of length $n$ over an ordered alphabet.

<MathPanel type="definition" title="Definition">
For a string $s$ of length $n$, the **suffix** $S_i$ is the string
$s[i \dots n)$. The **suffix array** $\operatorname{SA}$ is the array of
length $n$ with $\operatorname{SA}[j] = i$ when $S_i$ is the $j$-th
suffix in lexicographic order. The **inverse suffix array**, or **rank
array**, is $\operatorname{rank}[i] = j$, so that $\operatorname{rank}$ and
$\operatorname{SA}$ are inverses of each other.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **longest common prefix array** is the array $\operatorname{lcp}$ of
length $n$ with $\operatorname{lcp}[0] = 0$ and, for $j \ge 1$,
$\operatorname{lcp}[j]$ the length of the longest common prefix of the
suffixes $\operatorname{SA}[j-1]$ and $\operatorname{SA}[j]$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $\operatorname{rank}$ be the ranks of the suffixes by their first $k$
characters, where $k \ge 1$, and let the rank of a position past the end
of the string be $-1$. Then the order of the suffixes by their first $2k$
characters is the order of the pairs
$\bigl(\operatorname{rank}[i], \operatorname{rank}[i+k]\bigr)$.
</MathPanel>

<MathPanel type="proof" title="Proof">
Take two positions $i$ and $j$. The first $2k$ characters of the suffix
at $i$ are the first $k$ characters of the suffix at $i$, followed by the
first $k$ characters of the suffix at $i + k$; the same holds for $j$.
The lexicographic comparison of two strings first compares their first
$k$ characters and, if those are equal, their next $k$ characters. The
first comparison is decided by $\operatorname{rank}[i]$ against
$\operatorname{rank}[j]$, and the second by $\operatorname{rank}[i+k]$
against $\operatorname{rank}[j+k]$. So the comparison of the pairs decides
the comparison of the $2k$-character prefixes. The rank of a position past
the end is $-1$ because a shorter prefix is a proper prefix of a longer
one and therefore comes first. $\square$
</MathPanel>

<MathPanel type="invariant" title="Invariant">
After a round that ranks the suffixes by their first $k$ characters, the
rank array satisfies: $\operatorname{rank}[i] < \operatorname{rank}[j]$
exactly when the first $k$ characters of the suffix at $i$ are lexicographically
smaller than the first $k$ characters of the suffix at $j$, with a shorter
prefix that is a proper prefix of the other coming first.
</MathPanel>

## Algorithm derivation

### The doubling rounds

The construction starts with the ranks of the single characters and doubles the length of the distinguished prefix in every round.

```text
rank[i] = the rank of s[i] among the single characters
k = 1
while k < n and not every rank is distinct:
    sort the positions by the pair (rank[i], rank[i + k])
    assign new ranks, equal pairs receiving equal new ranks
    k = k * 2
```

The loop stops when every rank is distinct, because then the order is fully determined, or when $k \ge n$, because then every suffix is distinguished by its whole length.

### The counting sort

The pairs are sorted with a counting sort, and the second key is the one that is already sorted.

The standard trick sorts by the **second** key first, using the order from the previous round, and then by the **first** key with a stable counting sort. The reason the second key is already sorted is that the positions $i$ with a given value of $\operatorname{rank}[i+k]$ are exactly the positions of the suffixes whose first $k$ characters are that value, and those are consecutive in the previous order.

Concretely, the algorithm is:

```text
// the previous order, sorted by the first k characters
y = the positions in the previous order, taken from the end
// shift each position back by k, so that the list is sorted by rank[i + k]
for each position i in the previous order, from last to first:
    y[--bucket[rank[i + k]]] = i
// now y is sorted by the second key; sort it by the first key, stably
count the occurrences of rank[i] for i in 0 .. n-1
for each position i in y, from last to first:
    z[--bucket[rank[i]]] = i
```

The whole sort is two counting sorts, each $O(n)$, so each round is $O(n)$ and the construction is $O(n \log n)$.

### The longest common prefix array

Kasai's algorithm computes the longest common prefix array in $O(n)$.

```text
k = 0
for i from 0 to n - 1:
    if rank[i] == 0:
        k = 0
        continue
    j = SA[rank[i] - 1]
    while i + k < n and j + k < n and s[i + k] == s[j + k]:
        k = k + 1
    lcp[rank[i]] = k
    if k > 0:
        k = k - 1
```

The amortization is the same idea as the Z algorithm's. The value $k$ carries over from one position to the next, and it is decremented by one rather than reset, because the longest common prefix of the suffix at $i$ and its predecessor in the order is at least one less than the longest common prefix of the suffix at $i-1$ and its predecessor. The total number of increments of $k$ is therefore $O(n)$.

<MathPanel type="invariant" title="Invariant">
At the start of the iteration for position $i$, the value $k$ is a lower
bound on the length of the longest common prefix of the suffix at $i$ and
the suffix that precedes it in the order. The extension loop then raises
$k$ until the two suffixes differ, so the value written into
$\operatorname{lcp}$ is exact.
</MathPanel>

## Step-by-step execution

Take the string `banana`, of length $6$. Its suffixes, in the order they are compared, are

| Position | Suffix   |
| -------- | -------- |
| 0        | `banana` |
| 1        | `anana`  |
| 2        | `nana`   |
| 3        | `ana`    |
| 4        | `na`     |
| 5        | `a`      |

**Round one, $k = 1$.** The suffixes are ranked by their first character.

| Position | Character | Rank |
| -------- | --------- | ---- |
| 5        | `a`       | 0    |
| 3        | `a`       | 0    |
| 1        | `a`       | 0    |
| 0        | `b`       | 1    |
| 4        | `n`       | 2    |
| 2        | `n`       | 2    |

The order is $[5, 3, 1, 0, 4, 2]$ and the rank array is $[1, 0, 2, 0, 2, 0]$.

**Round two, $k = 1$.** The pair for a position $i$ is $\bigl(\operatorname{rank}[i], \operatorname{rank}[i+1]\bigr)$, because the first two characters of the suffix at $i$ are its first character followed by the first character of the suffix at $i + 1$. The rank of a position past the end of the string is $-1$.

| Position $i$ | $\operatorname{rank}[i]$ | $\operatorname{rank}[i+1]$ | Pair      |
| ------------ | ------------------------ | -------------------------- | --------- |
| 0            | 1                        | 0                          | $(1, 0)$  |
| 1            | 0                        | 2                          | $(0, 2)$  |
| 2            | 2                        | 0                          | $(2, 0)$  |
| 3            | 0                        | 2                          | $(0, 2)$  |
| 4            | 2                        | 0                          | $(2, 0)$  |
| 5            | 0                        | $-1$                       | $(0, -1)$ |

Sorting the pairs puts the position $5$ first, because the pair $(0, -1)$ is the only one whose second key is the sentinel. The positions $1$ and $3$ tie on the pair $(0, 2)$, and so do the positions $2$ and $4$ on the pair $(2, 0)$. The ties are real: the suffixes `ana` and `anana` agree on their first two characters, and so do `nana` and `na`. The construction breaks the ties in the next round.

With the order $[5, 3, 1, 0, 4, 2]$ the new ranks are $[2, 1, 3, 1, 3, 0]$, and the rank array now distinguishes the first two characters of every suffix.

**Round three, $k = 2$.** The pair for a position $i$ is $\bigl(\operatorname{rank}[i], \operatorname{rank}[i+2]\bigr)$, because the first four characters of the suffix at $i$ are its first two characters followed by the first two characters of the suffix at $i + 2$.

| Position $i$ | $\operatorname{rank}[i]$ | $\operatorname{rank}[i+2]$ | Pair      |
| ------------ | ------------------------ | -------------------------- | --------- |
| 0            | 2                        | 3                          | $(2, 3)$  |
| 1            | 1                        | 1                          | $(1, 1)$  |
| 2            | 3                        | 3                          | $(3, 3)$  |
| 3            | 1                        | 0                          | $(1, 0)$  |
| 4            | 3                        | $-1$                       | $(3, -1)$ |
| 5            | 0                        | $-1$                       | $(0, -1)$ |

Sorting the pairs gives the order $[5, 3, 1, 0, 4, 2]$, and the new ranks are $[3, 2, 5, 1, 4, 0]$. Every rank is now distinct, so the construction stops: the first four characters of the suffixes already tell them apart.

The final suffix array is $\operatorname{SA} = [5, 3, 1, 0, 4, 2]$ and the final rank array is $\operatorname{rank} = [3, 2, 5, 1, 4, 0]$.

The longest common prefix array is then

| $j$ | $\operatorname{SA}[j-1]$ | $\operatorname{SA}[j]$ | $\operatorname{lcp}[j]$ |
| --- | ------------------------ | ---------------------- | ----------------------- |
| 1   | 5                        | 3                      | 1                       |
| 2   | 3                        | 1                      | 3                       |
| 3   | 1                        | 0                      | 0                       |
| 4   | 0                        | 4                      | 0                       |
| 5   | 4                        | 2                      | 2                       |

so $\operatorname{lcp} = [0, 1, 3, 0, 0, 2]$. The entry $\operatorname{lcp}[2] = 3$ says that the suffixes `ana` and `anana` share the prefix `ana`, and the entry $\operatorname{lcp}[5] = 2$ says that `na` and `nana` share the prefix `na`.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The doubling construction computes the suffix array of the string.
</MathPanel>

<MathPanel type="proof" title="Proof">
The proof is an induction on the number of rounds.

**Base case.** After the first round, the suffixes are ranked by their first character, which is exactly the invariant with $k = 1$.

**Inductive step.** Suppose the invariant holds with $k$: the rank array orders the suffixes by their first $k$ characters. By the lemma, the order of the suffixes by their first $2k$ characters is the order of the pairs $\bigl(\operatorname{rank}[i], \operatorname{rank}[i+k]\bigr)$, so sorting those pairs and assigning new ranks establishes the invariant with $2k$. The counting sort computes exactly that order, because it sorts by the second key using the previous order and then, stably, by the first key.

**Termination.** The loop ends when every rank is distinct or when $2k \ge n$. In the first case, two suffixes with equal ranks would have equal prefixes of length $k$, which is impossible when the ranks are distinct, so the order is the full lexicographic order of the suffixes. In the second case, $k \ge n$, so the prefixes are the whole suffixes, and the order is again the full lexicographic order. In both cases the array produced is the suffix array. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
Kasai's algorithm computes the longest common prefix array correctly.
</MathPanel>

<MathPanel type="proof" title="Proof">
Two facts are needed.

First, the carry-over is sound. Suppose the longest common prefix of the suffixes at $i-1$ and $j-1$, where $j-1$ precedes $i-1$ in the order, has length $h$. The suffixes at $i$ and $j$ are the suffixes at $i-1$ and $j-1$ with their first characters removed, so they agree on their first $h - 1$ characters, provided $h \ge 1$. Hence the longest common prefix of the suffixes at $i$ and $j$ is at least $h - 1$. So the value $k$ carried into the iteration is a valid starting point.

Second, the extension loop is exact. Starting from a lower bound $k$ on the common prefix, the loop compares the next pair of characters and continues while they are equal, stopping at the first difference or at the end of one of the suffixes. The value at the end is therefore the exact length of the longest common prefix.

The special case $\operatorname{rank}[i] = 0$ is the first suffix in the order, which has no predecessor, so its entry is $0$ by definition, and the carry-over is reset. $\square$
</MathPanel>

## Complexity analysis

| Quantity | Cost |
| --- | --- |
| Sorting the suffixes with a comparison sort | $O(n^2 \log n)$ time |
| One doubling round with a counting sort | $O(n)$ time |
| The doubling construction, $\lceil \log_2 n \rceil$ rounds | $O(n \log n)$ time |
| The longest common prefix array, by Kasai's algorithm | $O(n)$ time |
| The suffix array, the rank array, and the longest common prefix array | $O(n)$ space |
| A substring comparison using the two arrays | $O(1)$ |
| The longest common substring of two strings | $O(n + m)$ after the arrays are built |

The comparison between the naive and the doubling costs is the point of the article. The naive sort performs $O(n \log n)$ comparisons, each of which costs $O(n)$ in the worst case, because a comparison of two suffixes walks the characters. The doubling performs $O(n \log n)$ work per round in _total_, because the counting sort is linear, and it never compares two strings. The factor of $n$ is removed.

The space is three arrays of $n$ integers, so $12n$ bytes with 32-bit entries, or $24n$ bytes with 64-bit entries. At $n = 10^6$ that is $24$ megabytes, which is inside every limit.

The linear-time constructions are worth knowing about. The **DC3** and **skew** algorithms build the suffix array in $O(n)$ time by a divide-and-conquer on the positions modulo three, and the suffix automaton is a different structure that answers the substring questions in $O(n)$ time without sorting anything. Both are beyond the scope of this article, and both are worth learning when a suffix array is too slow.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The lexicographic order of the suffixes | The suffix array |
| The longest common substring of two strings | Two suffix arrays, or one over the concatenation, plus the longest common prefix array |
| The longest repeated substring of one string | The maximum of the longest common prefix array |
| The number of occurrences of a substring | A range query on the suffix array |
| The lexicographically smallest or largest suffix | The first or the last entry of the suffix array |
| Find every occurrence of a pattern | [KMP](/algorithms/strings/kmp), which is linear and shorter |
| The longest common prefix of the string with each suffix | The [Z algorithm](/algorithms/strings/z-algorithm), which is linear and shorter |
| Substring equality, with no error chance | The suffix array, or the [rolling hash](/algorithms/strings/rolling-hash) with verification |
| Substring equality, with speed the priority | The rolling hash |
| The longest palindromic substring | The [Manacher algorithm](/algorithms/strings/manacher) |

The last three rows are the ones that decide between three techniques that answer overlapping questions. The suffix array is the general one and the only one of the three that is exact and that supports order queries. The [Z algorithm](/algorithms/strings/z-algorithm) is linear and answers the prefix questions. The [rolling hash](/algorithms/strings/rolling-hash) answers equality in constant time but can collide.

## Recursion decision

The doubling construction is iterative, and it should be. Each round depends on the previous one, and there is nothing to recurse.

There is one recursive construction worth knowing, and it is the reason the linear-time algorithms exist. The **DC3** algorithm splits the positions by their residue modulo three, recursively constructs the suffix array of each of the three classes, and combines them. Its depth is $O(\log_3 n)$, which is at most $13$ for a string of $10^6$ characters.

| Language   | Practical depth                      | Recommendation                          |
| ---------- | ------------------------------------ | --------------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative; a recursive DC3 is also safe |
| Java       | About $10^4$ frames                  | Iterative                               |
| Python     | The interpreter limit of $1000$      | Iterative; a recursive DC3 is also safe |
| Pascal     | The operating system stack           | Iterative                               |
| JavaScript | About $10^4$ frames                  | Iterative                               |

The recursive form of the _doubling_ algorithm is not the one to write, and the reason is worth naming. A recursive doubling that sorts the suffixes by their first $2k$ characters by comparing the pairs would need the pairs sorted by a comparison sort, and the comparison of two pairs would need to compare the ranks, which is a comparison of integers, so the recursion buys nothing. The counting sort is what makes the construction linear per round, and a counting sort is a loop.

So the answer is uniform: use the iterative doubling construction, and reach for a recursive divide and conquer only when the linear-time construction is needed.

## Implementation walkthrough

The second key of the counting sort is what makes the round linear, and the way it is obtained is the part that is hard to reinvent.

```cpp
// The previous order is sorted by rank, so the positions sa[i] - k are
// already sorted by their second key, rank[sa[i] - k + k] = rank[sa[i]].
// Walking the previous order backwards makes the sort stable.
int p = 0;
for (int i = n - 1; i >= 0; --i) {
    int j = sa[i] - k;
    if (j >= 0) y[p++] = j;   // the positions with j + k past the end are left out
}
```

The list `y` is now sorted by the second key, and it is stable with respect to the first key, because the previous order was sorted by the first key.

The stable counting sort by the first key is the second part.

```cpp
for (int i = 0; i < n; ++i) count[rank[i]]++;
for (int i = 1; i <= n; ++i) count[i] += count[i - 1];
for (int i = p - 1; i >= 0; --i) {
    int j = y[i];
    sa[--count[rank[j]]] = j;
}
```

The loop over `y` runs **backwards**, and that is what makes the sort stable. A forward loop would place the elements of a tie in the reverse order, and the stability is exactly what the two-stage construction relies on.

The sentinel, the position $n$ past the end of the string, is the position whose rank is $-1$. The implementation that stores the sentinel at index $n$ of the rank array, with the value $-1$, avoids the conditional in the inner loops; the implementation that numbers the real ranks from $1$ and gives the sentinel $0$ does the same thing. The common mistakes section has the counterexample for getting the sentinel wrong.

The ranks are then recomputed.

```cpp
int classes = 0;
rank[sa[0]] = 0;
for (int i = 1; i < n; ++i) {
    if (rank[sa[i]] != rank[sa[i-1]] or
        (sa[i] + k < n ? rank[sa[i]+k] : -1) != (sa[i-1] + k < n ? rank[sa[i-1]+k] : -1)) {
        classes++;
    }
    rank[sa[i]] = classes;
}
```

The comparison of two positions must compare the **pairs**, not just the first keys. Comparing only `rank[sa[i]]` against `rank[sa[i-1]]` would give the same rank to suffixes that agree on the first $k$ characters but differ beyond, and the construction would not make progress.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Giving the empty suffix the rank $0$ when the real ranks are $0$-based | A suffix that is a proper prefix of another is ordered after it | Give the sentinel the rank $-1$, or use $1$-based ranks with a sentinel of $0$ |
| Comparing only the first key when recomputing the ranks | Suffixes that agree on the first $k$ characters get the same rank | Compare the whole pair |
| Using a forward loop in the stable counting sort | The sort is not stable and the construction breaks | Loop backwards |
| Sorting by the first key before the second | The second key is no longer sorted and the trick does not apply | Sort by the second key first |
| Stopping the doubling when $k$ reaches $n$ without checking the ranks | A tie remains and the order is not the suffix array | Stop when the ranks are distinct |
| Using a comparison sort in every round | The construction is $O(n^2 \log n)$ | Use a counting sort |
| Forgetting the sentinel in the rank array | A read past the end of the string | Handle the position $p + k \ge n$ explicitly |
| Assuming the longest common prefix array can be read off the rank array | The answer is wrong | Compute it with Kasai's algorithm |
| Off-by-one in the longest common prefix array | The entry for the first suffix is not zero | Set the first entry to zero |

### Why this fails: the sentinel that ties with a real rank

The plausible wrong approach is to use ranks that start at $0$ and to give the empty suffix the rank $0$ as well, on the reasoning that the empty suffix is the smallest thing there is and therefore deserves the smallest rank.

The problem is that the real ranks also start at $0$, so the empty suffix does not merely come first; it **ties** with the smallest real suffix, and a tie is broken by the sort's ordering rather than by the comparison.

The smallest counterexample is the string `aa`, of length $2$.

**Round one**, $k = 1$. Both characters are `a`, so both positions get the rank $0$, and the order is $[0, 1]$.

**Round two**, $k = 1$. The pair for a position $i$ is $\bigl(\operatorname{rank}[i], \operatorname{rank}[i+1]\bigr)$, because the first two characters of the suffix at $i$ are its first character followed by the first character of the suffix at $i + 1$.

| Position $i$ | $\operatorname{rank}[i]$ | Second key         | Pair     |
| ------------ | ------------------------ | ------------------ | -------- |
| 0            | 0                        | $0$ (the sentinel) | $(0, 0)$ |
| 1            | 0                        | $0$ (the sentinel) | $(0, 0)$ |

The second key of the position $0$ is the rank of the position $1$, which is a real rank and happens to be $0$, and the second key of the position $1$ is the sentinel, which the buggy code also makes $0$. The two pairs are equal, so the order is decided by the stability of the sort. The previous order was $[0, 1]$, and the construction preserves it, so the program produces the suffix array $[0, 1]$.

With a correct sentinel of $-1$, the pair for the position $1$ would be $(0, -1)$, which is smaller than the pair $(0, 0)$ of the position $0$, and the order would be $[1, 0]$, which is right.

The correct suffix array of `aa` is $[1, 0]$, because the suffix `a` is a proper prefix of the suffix `aa` and therefore comes **first**.

The mechanism is exact. The suffix `a` ends where the suffix `aa` continues, and the comparison of the two is decided by the fact that one of them has run out of characters. The sentinel rank is what encodes "has run out", and a sentinel of $0$ does not encode it: the rank $0$ is also the rank of the genuine suffix `a`, so the two are indistinguishable, and the tie is broken arbitrarily rather than correctly.

The fix is to make the sentinel strictly smaller than every real rank, which is what the rank $-1$ does, or to number the real ranks from $1$ and give the sentinel $0$.

The same bug is visible in a longer string, and it is worth testing the construction on `aa` and on `aaaa` specifically, because those are the strings in which a suffix is a proper prefix of another.

The lesson generalizes: **a sentinel must be strictly ordered with respect to the real values, not merely included among them.** A tie is not an order.

## Variants and extensions

- **The suffix automaton.** A different structure that answers the substring questions directly and in $O(n)$ time, without sorting. It is the natural successor to the suffix array.
- **The suffix tree.** The tree form of the same information, with the longest common prefix array implicit in the edges.
- **The DC3 and skew algorithms.** Linear-time suffix array constructions, based on a divide and conquer on the positions modulo three. The depth is $O(\log n)$ and the constant is much better than the doubling.
- **The suffix array of several strings.** Concatenate the strings with distinct separators, and the array of the concatenation answers the questions across the strings, as long as the separators are chosen so that no match runs across a boundary.
- **The suffix array of an integer array.** The same construction works on any ordered alphabet, and it is the standard tool for the "distinct subarray" questions on arrays.
- **The range minimum query over the longest common prefix array.** The number of occurrences of a substring is the number of suffixes in a range of the suffix array, and the range is found by two binary searches over the array.
- **The suffix automaton for the longest common substring.** An alternative to the suffix array, with a smaller constant and no sorting.

## Contest strategy

1. Decide between the suffix array and its siblings before writing any code. The [Z algorithm](/algorithms/strings/z-algorithm) answers the prefix questions, [KMP](/algorithms/strings/kmp) answers the pattern questions, and the [rolling hash](/algorithms/strings/rolling-hash) answers the equality questions. The suffix array answers the order questions.
2. Write the sentinel rule down first, and get it right before anything else. The sentinel must be strictly smaller than every real rank.
3. Compare the whole pair when recomputing the ranks, not just the first key.
4. Use a counting sort, and sort by the second key first.
5. Loop backwards in the stable counting sort.
6. Write the naive version for strings of length at most ten and keep it. A disagreement on a random string of length ten is the fastest way to find a broken round.
7. Test `aa` and `aaaa` explicitly. They are the strings in which the sentinel rule matters, and they are the strings on which the wrong answer is subtle.
8. If the time limit is tight, remember that the DC3 construction is linear and the doubling is not.
9. Compute the longest common prefix array with Kasai's algorithm rather than by comparing adjacent suffixes, which is quadratic.

## Worked problems

### Problem 1: the longest common substring

**Restatement.** Given two strings $S$ and $T$ of length $n$ and $m \le 10^5$, report the length of the longest substring that appears in both, and one position of it in each.

**Naive baseline.** Compare every suffix of $S$ with every suffix of $T$, computing the longest common prefix of each pair, which is $O(nm)$ character comparisons.

**Insight.** Suffixes that share a common prefix are consecutive in the suffix order, so the longest common prefix of two strings is attained by two suffixes that are adjacent across the two arrays.

**Derivation.** Build the suffix array of $S + \# + T$, where $\#$ is a separator. Compute the longest common prefix array with Kasai's algorithm. Scan the array for the largest entry, and take the maximum over the entries whose two positions lie on different sides of the separator.

**Correctness.** If a substring of length $L$ occurs in both strings, there is a suffix of $S$ and a suffix of $T$ that begin with it, and all the suffixes beginning with that substring form a contiguous block in the suffix order. The block therefore contains an adjacent pair, one from $S$ and one from $T$, whose longest common prefix is at least $L$. Conversely, a longest common prefix of at least $L$ between a suffix of $S$ and a suffix of $T$ is a shared substring of length $L$.

**Complexity.** $O((n + m) \log(n + m))$ time for the construction and $O(n + m)$ for the scan.

**Common wrong approach.** Taking the maximum of the whole longest common prefix array without checking that the two positions are on different sides of the separator, which reports a match that runs across the boundary.

### Problem 2: the repeated substring

**Restatement.** Given a string $S$ of length $n \le 10^5$, report the length of the longest substring that occurs at least twice, and one pair of positions at which it occurs.

**Naive baseline.** Compare every pair of suffixes, which is $O(n^2)$.

**Insight.** The longest common prefix of two suffixes that are adjacent in the order is the length of the longest substring occurring at both of them, and the maximum over the array is the answer.

**Derivation.** Build the suffix array and the longest common prefix array. The answer is the maximum of the longest common prefix array, and the pair of positions is the adjacent pair that achieves it.

**Correctness.** Two occurrences of a substring of length $L$ start at two positions whose suffixes share the prefix of length $L$, and the suffixes beginning with that substring form a contiguous block, so an adjacent pair inside the block has a longest common prefix of at least $L$. Conversely, an adjacent pair with a longest common prefix of length $L$ gives two occurrences of that substring.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Reporting the longest common prefix of the two longest suffixes by length of the suffix, rather than the maximum of the array. The suffixes that start with the repeated substring are not the longest ones.

### Problem 3: the count of occurrences

**Restatement.** Given a string $S$ of length $n \le 10^5$ and a pattern $P$ of length $k$, report the number of occurrences of $P$ in $S$.

**Naive baseline.** Compare the pattern at every position, which is $O(nk)$.

**Insight.** The suffixes that begin with $P$ form a contiguous range of the suffix array, and the range is found by two binary searches.

**Derivation.** Build the suffix array of $S$. The occurrences of $P$ are exactly the positions $\operatorname{SA}[j]$ with $P$ a prefix of $S[\operatorname{SA}[j] \dots)$. All of the suffixes beginning with $P$ are between the suffix that is the smallest one beginning with $P$ and the one that is the largest. The lower bound is found by comparing $P$ against the suffixes in the order, and the upper bound similarly. The count is the difference of the two bounds.

**Correctness.** The comparison of a suffix against $P$ in the suffix order is the comparison of two strings, and the suffixes that begin with $P$ are exactly those that compare greater than or equal to $P$ and less than $P$ followed by anything, which is a contiguous range. The two binary searches find the ends of that range, and the range contains exactly the occurrences.

**Complexity.** $O(n \log n)$ for the construction and $O(k \log n)$ for the two searches. The [KMP](/algorithms/strings/kmp) alternative is $O(n + k)$ and is shorter to write, so it is the better choice when the pattern is given separately.

**Common wrong approach.** Assuming the count is the number of suffixes between the position of $P$ and the end, which ignores that the suffixes beginning with $P$ are not the last ones.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about order, about a shared substring, or about a count, and write down which of the three queries on the suffix array the question reduces to.
2. **Direct application.** Build the suffix array with the doubling construction, and check it against the naive sort on every string of length at most ten over the alphabet `{a, b}`.
3. **Adaptation.** Write the longest common prefix array with Kasai's algorithm, and write the construction for an integer array rather than a string.
4. **Combination.** Combine the suffix array with a [segment tree](/algorithms/range-queries/segment-tree) or a [sparse table](/algorithms/range-queries/sparse-table) over the longest common prefix array, to answer the range minimum queries that the occurrence counts need.
5. **Challenge.** Implement the DC3 construction, and check that it produces the same array as the doubling construction on random inputs.
6. **Transfer.** Recognize a suffix array question in a different shape: the number of distinct substrings, the lexicographically smallest rotation, the longest common substring of many strings, or the smallest suffix that is greater than a given pattern.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the definition of the suffix array and of the rank array. (Formal model)
2. State the doubling lemma, and explain the role of the rank of the position past the end. (Formal model)
3. Why is the comparison of the naive sort quadratic while the doubling is $O(n \log n)$? (Complexity analysis)
4. Why is the second key of the counting sort already sorted? (Algorithm derivation)
5. Why must the counting sort be stable, and how is the stability achieved? (Implementation walkthrough)
6. What is the smallest counterexample that breaks the sentinel rule, and what does the buggy program report? (Common mistakes)
7. Why must the ranks be recomputed by comparing the whole pair? (Implementation walkthrough)
8. When does the doubling construction stop, and why is each stopping condition sufficient? (Correctness proof)
9. How does Kasai's algorithm avoid the quadratic number of character comparisons? (Algorithm derivation)
10. When is the Z algorithm or KMP the better tool than the suffix array? (Algorithm selection)
11. What is the recursion depth of a DC3 construction, and is it safe in Python? (Recursion decision)

## Further reading

- The subject index lists this technique, [the suffix array](/algorithms/strings/suffix-array), beside the other string algorithms in the encyclopedia.
- The exact linear-time algorithm for the prefix questions is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The exact linear-time pattern search is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The faster but less certain tool for equality is in [the rolling hash](/algorithms/strings/rolling-hash).
- The linear-time palindrome algorithm is in [the Manacher algorithm](/algorithms/strings/manacher).
- The subject overview, which lists the string techniques that are not yet covered, is at [the strings](/algorithms/strings/).
- The range queries that the occurrence counts need are in [a segment tree](/algorithms/range-queries/segment-tree) and in [a sparse table](/algorithms/range-queries/sparse-table).
- The counting sort that makes the construction linear is the same technique as the counting sort in the [merge sort](/algorithms/foundations/sorting), which the subject index lists under sorting.
