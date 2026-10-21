---
id: strings.kmp
title: Knuth-Morris-Pratt
summary: Find every occurrence of a pattern inside a text in time linear in the sum of their lengths, by never re-reading a character the prefix function has already explained.
division: [silver, gold]
subjects: [strings]
level: intermediate
importance: common-contest-technique
keywords:
    [kmp, string matching, prefix function, failure function, substring search, amortized analysis]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.recursion, foundations.sorting]
assumptions:
    - The pattern and the text are sequences of comparable symbols, so testing whether two symbols are equal takes constant time.
    - The whole text is available before the answer is required, so the search may read the text more than once.
reviewed: false
---

## At a glance

The Knuth-Morris-Pratt algorithm finds every occurrence of a pattern inside a text in time linear in the sum of their lengths. For a text of length $n$ and a pattern of length $m$ the cost is $O(n + m)$, where the naive search costs $O(nm)$.

The whole idea fits in one sentence: **when a comparison fails, do not start the pattern over, because the part of the pattern that was already matched tells you exactly where to resume.** A prefix function, computed once on the pattern, records that information, and a second pass over the text uses it.

The prefix function of a string is the length of the longest proper prefix of each of its prefixes that is also a suffix. That single table is what turns the quadratic search into a linear one, and it is the reusable idea behind every other string algorithm in this encyclopedia.

## Problem motivation

A search engine is given a document of one million characters and a query of five characters, and it must report every position where the query occurs. The naive approach compares the query against every starting position and resets the comparison after every mismatch, so it performs up to $1\,000\,000 \times 5 = 5\,000\,000$ comparisons here, and up to $10^{12}$ when the query is a million characters long.

The number of positions tried is not the real cost. The real cost is that the naive search re-reads the same text characters over and over. A document consisting of a million copies of the letter `a`, searched for the pattern `a` followed by a `b`, makes the naive search compare the entire pattern at every position: $10^{12}$ comparisons for a five-character pattern.

KMP performs about two comparisons per text character regardless of the pattern and regardless of the text. On that document it performs about two million.

## Recognition patterns

KMP is the right tool when the statement contains some of these phrases.

- "Find the first occurrence", "count the occurrences", "find all positions where", "does the text contain".
- "Substring", "contiguous block of characters", "the pattern". The word substring is what separates this problem from the subsequence problem, which is a dynamic program and a different question entirely.
- "The longest prefix of the string that is also a suffix", "the borders of the string", "the minimum period of the string", "how many times does this string occur in that one".
- A text and a pattern of length $10^5$ or $10^6$, where the naive search is too slow.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| $n \le 10^3$, $m \le 10^3$ | The naive search is fine and is the reference implementation |
| $n \le 10^6$, $m \le 10^6$ | The naive search is $10^{12}$ comparisons; KMP is required |
| The pattern is one character | A single scan; no technique needed |
| Many patterns, one text | Aho-Corasick, which is not covered here |
| The question is about a subsequence | A dynamic program, not a string search |

The last row is the one that catches people. "Is the sequence a subsequence of the text" is solved in $O(nm)$ by dynamic programming, and KMP does not apply to it at all, because a subsequence is not contiguous.

## Naive approach

The baseline compares the pattern against every starting position and restarts after a mismatch.

```cpp
std::vector<int> naive_search(const std::string& text, const std::string& pat) {
    std::vector<int> hits;
    int n = static_cast<int>(text.size());
    int m = static_cast<int>(pat.size());
    for (int i = 0; i + m <= n; ++i) {
        int j = 0;
        while (j < m && text[i + j] == pat[j]) ++j;
        if (j == m) hits.push_back(i);
    }
    return hits;
}
```

This is correct for every input, and it is the reference implementation for the differential test. It is also $O(nm)$ in the worst case, because the inner loop can run for $m$ steps at each of the $n$ starting positions.

The second baseline is the one that people actually write when they want to be fast, and it is instructive because it is still quadratic.

```cpp
// Shift the pattern by one, but skip positions that cannot match.
for (int i = 0; i + m <= n; ++i) {
    int j = 0;
    while (j < m && text[i + j] == pat[j]) ++j;
    if (j == m) hits.push_back(i);
    i += j - 1;   // the naive "skip" trick
}
```

The trick is right in spirit and wrong in the arithmetic. When a mismatch happens after $j$ matched characters, the last $j-1$ characters of the text are equal to the first $j-1$ characters of the pattern, so a match _could_ start inside that region. The code skips those positions by shifting the window past them, which is backwards: it skips the positions where a match is most likely. The correct amount to skip is exactly the information the prefix function provides, and the prefix function provides it in $O(1)$ per character instead of by re-comparing.

## Key insight

Suppose the search has matched $k$ characters of the pattern and the next comparison fails. The text characters that were just matched are equal to the first $k$ characters of the pattern, so the text currently ends with $P[0..k-1]$.

Any match that could still start inside that region must line up with a suffix of what has been matched. Concretely, if the new match starts $k - j$ characters later than the current one, then the text suffix of length $j$ is equal to $P[k-j..k-1]$, and that same text suffix is the prefix of the new candidate match, so it must equal $P[0..j-1]$. Therefore $P[0..j-1]$ must be a suffix of $P[0..k-1]$ as well as a prefix of it.

Such a string is called a **border**, and the longest border of $P[0..k-1]$ is exactly what the prefix function stores.

So the resume point after a mismatch is not a guess and not a fresh start. It is a table lookup: fall back to $\pi[k-1]$, the longest border of the already-matched prefix. The search never re-reads a text character, and the only extra work is a walk down a chain of border lengths.

## Formal model

Let $P$ be a pattern of length $m$ over some alphabet, indexed $0$ through $m-1$, and let $T$ be a text of length $n$.

<MathPanel type="definition" title="Definition">
A **border** of a string $S$ of length $k$ is a string of length $j < k$
that is both a prefix and a suffix of $S$. The **prefix function** of $P$ is
the array $\pi$ with
$$
\pi[i] = \max\bigl(\{j : 0 \le j \le i,\; P[0..j-1] = P[i-j+1..i]\} \cup \{0\}\bigr).
$$
In words, $\pi[i]$ is the length of the longest proper prefix of $P[0..i]$
that is also a suffix of $P[0..i]$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **state** of the search is the number $k$ of pattern characters
currently matched, meaning that the last $k$ characters of the text read so
far equal $P[0..k-1]$. The **failure function** of the pattern is the
function that sends a state $k$ with $k > 0$ to the state $\pi[k-1]$, and
sends the state $0$ to itself.
</MathPanel>

<MathPanel type="definition" title="Definition">
An occurrence of $P$ in $T$ is an index $s$ with $0 \le s \le n - m$ such
that $T[s..s+m-1] = P$. Two occurrences **overlap** when their index ranges
intersect.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If the state is $k > 0$ and the comparison fails, then the largest state
that can still be reached without re-reading a text character is
$\pi[k-1]$.
</MathPanel>

<MathPanel type="proof" title="Proof">
At the moment of the failure the text ends with $P[0..k-1]$. Suppose a new
match starts so that $j$ characters of it have already been matched, for
some $0 \le j < k$. The last $j$ characters of the text are then equal to
$P[k-j..k-1]$, and they are also the first $j$ characters of the new
candidate match, so they equal $P[0..j-1]$. Hence $P[0..j-1]$ is a suffix
of $P[0..k-1]$, and by the definition of the prefix function $j \le \pi[k-1]$.

Conversely, $j = \pi[k-1]$ is achievable: the text ends with $P[0..k-1]$, whose last $j$ characters equal $P[0..j-1]$ by the definition of the border, so the state $j$ is a consistent state of the search. $\square$
</MathPanel>

## Algorithm derivation

### Building the prefix function

The table is built with the same fallback rule. Let $j$ be the length of the current border of the prefix being processed.

```cpp
std::vector<int> prefix_function(const std::string& p) {
    int m = static_cast<int>(p.size());
    std::vector<int> pi(m, 0);
    int j = 0;
    for (int i = 1; i < m; ++i) {
        while (j > 0 && p[i] != p[j]) j = pi[j - 1];   // fall back
        if (p[i] == p[j]) ++j;                          // extend
        pi[i] = j;
    }
    return pi;
}
```

The reasoning mirrors the search. Before position $i$, the state $j$ says that $P[0..j-1]$ is the longest border of $P[0..i-1]$. If $P[i] = P[j]$, the border extends by one character and the new value is $j+1$. If not, the border must shorten, and by the lemma the longest shorter border is $\pi[j-1]$, so the loop walks down the border chain until it finds a $j$ that matches or reaches zero.

### Running the search

```cpp
std::vector<int> kmp_search(const std::string& text, const std::string& pat) {
    std::vector<int> pi = prefix_function(pat);
    int n = static_cast<int>(text.size());
    int m = static_cast<int>(pat.size());
    std::vector<int> hits;
    int j = 0;
    for (int i = 0; i < n; ++i) {
        while (j > 0 && text[i] != pat[j]) j = pi[j - 1];   // fall back
        if (text[i] == pat[j]) ++j;                          // extend
        if (j == m) {
            hits.push_back(i - m + 1);   // the occurrence starts here
            j = pi[j - 1];               // keep the border, look for overlaps
        }
    }
    return hits;
}
```

The pattern is never indexed out of bounds: when $j = m$ the occurrence is reported and $j$ immediately drops below $m$, and the `while` condition guarantees $j < m$ whenever $P[j]$ is read.

### Why the search is linear

The amortized argument is the heart of the method, and it uses a potential function. Take $\Phi = j$, the current state.

- Every text character increases $\Phi$ by at most $1$, because the only statement that raises $j$ is the single `++j`.
- Every fallback step decreases $\Phi$ by at least $1$, because $\pi[j-1] \le j-1$ always holds.
- $\Phi$ starts at $0$ and never becomes negative, so the total decrease is at most the total increase, which is at most $n$.

Therefore the total number of fallback steps over the whole search is at most $n$, the total number of extensions is at most $n$, and the search performs $O(n)$ comparisons. The identical argument on the pattern gives $O(m)$ for the prefix function, and the two together give $O(n + m)$.

## Step-by-step execution

Take the pattern `ABABCABAB`, of length $9$. The prefix function is built one row at a time. In every row the question is: what is the longest prefix of `P[0..i]` that is also a suffix of `P[0..i]`?

| Index $i$ | $P[i]$ | $P[0..i]$ | Longest border | $\pi[i]$ |
| --------- | ------ | --------- | -------------- | -------- |
| 0         | A      | A         | none           | 0        |
| 1         | B      | AB        | none           | 0        |
| 2         | A      | ABA       | A              | 1        |
| 3         | B      | ABAB      | AB             | 2        |
| 4         | C      | ABABC     | none           | 0        |
| 5         | A      | ABABCA    | A              | 1        |
| 6         | B      | ABABCAB   | AB             | 2        |
| 7         | A      | ABABCABA  | ABA            | 3        |
| 8         | B      | ABABCABAB | ABAB           | 4        |

Row 4 is the interesting one. The border chain of `ABAB` has lengths 2 and 0, and neither `A` nor `AB` matches the suffix `BC`, so the value drops to zero. Rows 5 through 8 then rebuild the same chain from scratch, which is why the table is not monotone.

The failure function for this pattern is a chain, and the chain is what the search walks down after a mismatch.

| State $k$       | Next state   | Reason                            |
| --------------- | ------------ | --------------------------------- |
| 9, a full match | $\pi[8] = 4$ | `ABAB` is a border of `ABABCABAB` |
| 4               | $\pi[3] = 2$ | `AB` is a border of `ABAB`        |
| 2               | $\pi[1] = 0$ | `B` is not a border of `AB`       |
| 0               | 0            | nothing is matched                |

Now search the text `ABABXABAB` for the pattern `ABABCABAB`. The text has nine characters and the pattern has nine, so there is no occurrence, and the trace shows why the search never even tries most positions.

| Text index $i$ | $T[i]$ | State before | Action | State after |
| --- | --- | --- | --- | --- |
| 0 | A | 0 | `P[0] = A` matches | 1 |
| 1 | B | 1 | `P[1] = B` matches | 2 |
| 2 | A | 2 | `P[2] = A` matches | 3 |
| 3 | B | 3 | `P[3] = B` matches | 4 |
| 4 | X | 4 | `P[4] = C` fails, fall back to $\pi[3] = 2$ | 2 |
| 4 | X | 2 | `P[2] = A` fails, fall back to $\pi[1] = 0$ | 0 |
| 4 | X | 0 | `P[0] = A` fails | 0 |
| 5 | A | 0 | `P[0] = A` matches | 1 |
| 6 | B | 1 | `P[1] = B` matches | 2 |
| 7 | A | 2 | `P[2] = A` matches | 3 |
| 8 | B | 3 | `P[3] = B` matches | 4 |

The search ends in state $4$, never reaches $9$, and reports nothing. The text index 4 was read once and produced three comparisons, which is exactly what the amortized argument allows.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The KMP search reports exactly the set of occurrences of the pattern in the
text, and it reads every text character exactly once.
</MathPanel>

<MathPanel type="proof" title="Proof">
**The state is always truthful.** Before the text character at index $i$ is
read, the state $j$ is such that the last $j$ characters of the text read
so far equal $P[0..j-1]$. This holds initially, because $j = 0$ and the
empty suffix equals the empty prefix.

If the fallback loop runs, it replaces $j$ by $\pi[j-1]$. By the lemma, the text suffix of length $\pi[j-1]$ is $P[0..\pi[j-1]-1]$, so the invariant survives every fallback, and the loop terminates because $j$ strictly decreases.

After the loop, either $j = 0$ or $P[j] = T[i]$. In the second case the text suffix of length $j+1$ is $P[0..j]$, so the invariant is preserved by the increment, and the state after reading $T[i]$ is $j+1$.

**Every report is an occurrence.** The search reports a position only when the state reaches $m$. At that moment the last $m$ characters of the text equal $P[0..m-1]$, that is, $P$, and they end at index $i$, so they start at index $i-m+1$. The reported index is therefore the start of a genuine occurrence.

**Every occurrence is reported.** Let an occurrence start at index $s$ and end at index $s+m-1$. Each of the characters $T[s], T[s+1], \ldots, T[s+m-1]$ equals the corresponding pattern character. We show by induction that the state after reading $T[s+i]$ is at least $i+1$.

Before $T[s]$ is read the state is some $j \ge 0$, and the text suffix of length $i = 0$ is the empty string, so the claim holds trivially. Now suppose the state before reading $T[s+i]$ is $j \ge i$. The last $j$ characters of the text read so far equal $P[0..j-1]$, so the last $i$ of them equal $P[0..i-1]$, and therefore $i$ is a border length of $P[0..j-1]$. The fallback chain $j, \pi[j-1], \pi[\pi[j-1]-1], \ldots$ enumerates the border lengths of $P[0..j-1]$ in decreasing order, so it cannot drop below $i$ without reaching $i$ exactly, and at $i$ the comparison $P[i] = T[s+i]$ succeeds because the occurrence matches. The fallback therefore stops at a state at least $i$, and the extension makes the state at least $i+1$.

After reading $T[s+m-1]$ the state is at least $m$, and the state never exceeds $m$, because a state of $m$ is reported and reset at once. The state is therefore exactly $m$ and the occurrence is reported.

**Each text character is read once.** The loop index increases by one on every iteration, and the inner fallback loop reads only $T[i]$ again. Each text character therefore costs $O(1)$ comparisons apart from the fallback steps, and the amortized argument bounds the fallback steps by $n$. The total is $O(n + m)$. $\square$
</MathPanel>

## Complexity analysis

| Quantity        | Cost                                             |
| --------------- | ------------------------------------------------ |
| Prefix function | $O(m)$ time, $O(m)$ space                        |
| Search          | $O(n)$ time, $O(1)$ extra space beyond the table |
| Whole algorithm | $O(n + m)$ time, $O(m)$ space                    |

The space bound is $O(m)$ and not $O(m|\Sigma|)$, which is the reason to prefer the failure-function form over the full automaton form. The transition-table version of KMP, which answers "given a state and a character, what is the next state" in $O(1)$ with no fallback loop, needs a table of $m \times |\Sigma|$ entries. For a lowercase alphabet and a million-character pattern that is $26$ million entries, while the failure function needs a million.

The prefix function is worth computing once and reusing for many texts. A problem with one pattern and a thousand texts pays $O(m)$ once and $O(n)$ per text, rather than $O(m)$ per text.

## Algorithm selection

| Situation                                        | What to use                                 |
| ------------------------------------------------ | ------------------------------------------- |
| One pattern, one text, first occurrence          | KMP                                         |
| One pattern, one text, all occurrences           | KMP, reporting every match                  |
| One pattern, many texts                          | KMP, with the prefix function computed once |
| Overlapping occurrences                          | KMP, with the state reset to $\pi[m-1]$     |
| Longest prefix of a string that is also a suffix | The prefix function alone                   |
| Minimum period of a string                       | $m - \pi[m-1]$                              |
| Many patterns, one text                          | Aho-Corasick, which is not covered here     |
| Longest common prefix of two strings             | A direct scan, or the Z algorithm           |
| Subsequence rather than substring                | A dynamic program, not a string search      |

## Recursion decision

The prefix function has a natural recursive form, because $\pi[i]$ depends on $\pi$ at smaller indices. It is also a bad idea. The recursion would have to walk the border chain at every position, so without memoization it costs $O(m^2)$, which is exactly the complexity the technique exists to remove. With memoization it costs $O(m)$ time but $O(m)$ stack frames, and the depth is the length of the border chain, which can be $m$ itself for a pattern of repeated characters.

| Language   | Practical recursion depth            | Recommendation                             |
| ---------- | ------------------------------------ | ------------------------------------------ |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative, because the depth can reach $m$ |
| Java       | About $10^4$ frames                  | Iterative                                  |
| Python     | The interpreter limit of 1000        | Iterative                                  |
| Pascal     | The operating system stack           | Iterative                                  |
| JavaScript | About $10^4$ frames                  | Iterative                                  |

The iterative form is also shorter than the recursive one. There is no argument for recursion here: the loop carries the state in a single variable, and the fallback chain is a walk over an array rather than a walk over the call stack.

## Implementation walkthrough

Two lines carry all the weight, and they must stay in this order.

```cpp
while (j > 0 && text[i] != pat[j]) j = pi[j - 1];   // fall back
if (text[i] == pat[j]) ++j;                          // extend
```

The fallback must come first and the extension second. If the extension came first, the code would compare `pat[j]` against the wrong character on the first iteration of a new position, and the very first mismatch would already corrupt the state.

The condition `j > 0` in the fallback is what stops the loop at the beginning of the pattern. Without it, `pi[j-1]` would read `pi[-1]`, which is out of bounds in every language.

The state reset after a match, `j = pi[j - 1]`, is the other line that matters. Resetting to zero is correct for finding non-overlapping occurrences and wrong for finding all of them, and the difference is invisible until an input with overlaps appears.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Resetting the state to 0 after a match | Overlapping occurrences are missed | Reset to $\pi[m-1]$ |
| Reading `pi[j]` instead of `pi[j-1]` | The state never shrinks on a repeated pattern, and the loop hangs | A border of a string of length $j$ is indexed by $j-1$ |
| Computing the prefix function of the text | The fallback table describes the wrong string | The table belongs to the pattern |
| Comparing the pattern against the text backwards | The match positions are wrong | Fix the index base before writing the loop |
| Forgetting the `j > 0` guard | An out-of-bounds read of `pi[-1]` | Guard the fallback loop |
| Building the automaton table for a large alphabet | The memory cost becomes $m \times | \Sigma | $ | Use the failure function |
| Treating a substring question as a subsequence question | The dynamic program answer is wrong for substrings | Check the statement for "contiguous" |

### Why this fails: the occurrence that overlaps the previous one

The plausible wrong approach is to report an occurrence and then continue the search from the next text position, on the reasoning that the next occurrence must start later than the one just found. That reasoning is false. Two occurrences can start one character apart, and a search that skips a position after a match will never see them.

The smallest counterexample is the pattern `AA` in the text `AAA`. The occurrences of `AA` inside `AAA` start at index $0$ and index $1$, so the correct answer is two occurrences. A search that resets its state to zero after reporting the first occurrence reports only one.

The mechanism is exact. After the match ending at index $1$, the search has consumed the characters `AA` and the last of them is the first character of a second, overlapping occurrence. Resetting the state to zero throws that information away. Falling back to $\pi[m-1] = \pi[1] = 1$ keeps it: the state says that one character of the pattern is still matched, so the very next text character can complete a second occurrence.

Two characters is not enough to expose the bug. With the pattern `AA` in the text `AA` there is exactly one occurrence, and the buggy program reports one as well, so the two agree. Three characters is the smallest text on which the correct answer and the buggy answer differ.

The same bug hides a second failure. A problem that asks for the number of occurrences of `a` in a run of $n$ letters `a` has answer $n-1$, and a search that resets to zero reports $1$. This is the classic failure, and it survives random tests on short inputs because random strings rarely contain overlaps.

The lesson generalizes: **after a match, the useful state is the longest border of the pattern, not zero.** The border is exactly the part of the pattern that is simultaneously a prefix and a suffix, and it is the part that can start the next match.

A second, related failure is an index shift in the fallback. Using `pi[j]` instead of `pi[j-1]` says that the border of a string of length $j$ is indexed by $j$, which describes the longer string $P[0..j]$. The smallest counterexample is the pattern `AAA`, whose table is $\pi = [0, 1, 2]$, searched in the text `AAX`. The correct program reports no occurrence. The buggy program reaches state $2$, computes $\pi[2] = 2$, and the state never shrinks, so the fallback loop never terminates.

## Variants and extensions

- **The Z algorithm.** The array $z[i]$ gives the length of the longest prefix of the string that matches the suffix starting at $i$. It answers the same questions from the other direction, and it is the better tool when the question is about the pattern rather than about the text.
- **The automaton form.** A transition table that maps a state and a character to the next state, with no fallback loop. Faster per character, but $O(m|\Sigma|)$ space.
- **Aho-Corasick.** The failure function is what turns a trie into a multi-pattern automaton. This is the standard answer when there are many patterns.
- **Counting occurrences.** The search of the pattern in the text plus the pattern in itself gives the number of occurrences of the pattern inside itself, which is the KMP analogue of the counting trick.
- **The minimum period.** The smallest $d$ such that the string is a prefix of an infinite repetition of itself is $m - \pi[m-1]$ when $m$ is a multiple of that value.
- **The concatenation trick.** Computing the prefix function of the pattern followed by a separator and the text finds every occurrence in one pass, because the separator cannot occur inside the pattern.

## Contest strategy

1. Write the naive search first and keep it. A disagreement between the naive search and KMP on random inputs is the fastest way to find the bug, exactly as the [binary search article](/algorithms/searching/binary-search) keeps its linear scan.
2. Decide whether the occurrences may overlap before you write the reset after a match. It is a one-character difference in the code and it decides whether the answer is $2$ or $1$ on the smallest test case there is.
3. Write the prefix function on paper for a pattern of length three or four before you write the search. The table is the hard part, and the search is mechanical once the table is right.
4. Test the three cases explicitly: the pattern at the very start of the text, the pattern at the very end, and the pattern longer than the text.
5. Remember that a pattern of length one needs no technique, and a pattern longer than the text has no occurrence, so the search can be skipped entirely.
6. If the problem has many patterns instead of one, stop and use Aho-Corasick. KMP does not generalize to that case by running itself once per pattern, because that costs $O(km)$ for $k$ patterns and the time limit will not allow it.

## Worked problems

### Problem 1: the first occurrence

**Restatement.** Given a text of length $n \le 10^6$ and a pattern of length $m \le 10^6$, report the first index at which the pattern occurs, or $-1$.

**Naive baseline.** Compare the pattern at every position, which is $O(nm)$ and reaches $10^{12}$.

**Insight.** The prefix function of the pattern tells the search where to resume after a mismatch.

**Derivation.** Build $\pi$, run the search, and stop at the first report.

**Correctness.** The theorem above shows that every report is an occurrence and every occurrence is reported, so the first report is the first occurrence.

**Complexity.** $O(n + m)$ time and $O(m)$ space.

**Common wrong approach.** Reporting the index of the text character where the match was detected rather than the index where the match starts. The two differ by $m-1$, and the smallest case that shows it is the pattern `AB` in the text `AB`, where the detection index is $1$ and the start index is $0$.

### Problem 2: count the occurrences

**Restatement.** Given a text of length $n \le 10^6$ and a pattern of length $m$, report how many times the pattern occurs, counting overlapping occurrences.

**Naive baseline.** The naive search, which is correct on this problem because it does not skip positions, and is $O(nm)$.

**Insight.** The same search, with the state reset to the border after each report.

**Derivation.** Run the search and count the reports.

**Correctness.** Every report is an occurrence and every occurrence is reported, so the count is exact.

**Complexity.** $O(n + m)$ time and $O(m)$ space.

**Common wrong approach.** Resetting the state to zero after a report, which drops the overlapping occurrences. The pattern `AA` in the text `AAA` gives $1$ instead of $2$.

### Problem 3: the minimum period of a string

**Restatement.** Given a string $S$ of length $m$, report the smallest positive integer $d$ such that $S$ is a prefix of the infinite repetition of its first $d$ characters. If no such $d$ exists, report $m$.

**Naive baseline.** Test every divisor of $m$ and compare, which is $O(m \sqrt m)$ at worst.

**Insight.** The longest border of the string is $m - d$, so $d$ is $m - \pi[m-1]$, and $d$ is a period exactly when $m$ is a multiple of it.

**Derivation.** Compute the prefix function, take $d = m - \pi[m-1]$, and check whether $m \bmod d = 0$. If it is not, report $m$.

**Correctness.** A string of length $m$ is a prefix of a repetition with period $d$ exactly when its first $m-d$ characters equal its last $m-d$ characters, that is, exactly when it has a border of length $m-d$. The longest such border has length $\pi[m-1]$, so the candidate is $d = m - \pi[m-1]$, and a shorter period would give a longer border, which does not exist.

**Complexity.** $O(m)$ time and $O(m)$ space.

**Common wrong approach.** Reporting $m - \pi[m-1]$ without the divisibility check. The string `ABABABA` has $\pi[6] = 5$, so the candidate period is $2$, but $7$ is not a multiple of $2$ and the string is not a repetition of `AB`. The correct answer is $7$.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a substring or a subsequence, and write down the pattern and the text lengths.
2. **Direct application.** Implement the prefix function and the search, and check that they agree with the naive search on a thousand random inputs of length at most ten.
3. **Adaptation.** Write the version that counts overlapping occurrences, the version that reports the first occurrence only, and the version that finds the longest border of a string.
4. **Combination.** Use the prefix function to answer "how many times does this string occur in that one" in one pass over the concatenation, and combine it with a prefix-sum array to answer "how many occurrences start at an index where the prefix sum is even".
5. **Challenge.** Build the KMP automaton over a small alphabet and compare its speed against the failure-function form, then explain the tradeoff in terms of space.
6. **Transfer.** Recognize a problem in another subject as a string search: a grid word search, a DNA subsequence test, or a problem about the borders of a string, and reach for KMP before reaching for a quadratic dynamic program.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the prefix function store, and why is the border the right thing to store? (Formal model)
2. After a mismatch in state $k$, what is the new state, and why? (Formal model)
3. Why is the search linear rather than quadratic? (Algorithm derivation)
4. Trace the prefix function of `ABABCABAB` and explain the drop at index 4. (Step-by-step execution)
5. What is the failure chain of the pattern `ABABCABAB`? (Step-by-step execution)
6. Why must the state be reset to $\pi[m-1]$ after a report rather than to zero? (Common mistakes)
7. What is the smallest text on which the reset bug changes the answer, and what does the buggy program report? (Common mistakes)
8. What does the fallback read, `pi[j]` or `pi[j-1]`, and what happens if the wrong one is used on `AAA` in `AAX`? (Implementation walkthrough)
9. Why is the automaton form of KMP avoided for a large alphabet? (Complexity analysis)
10. When does a statement that says "subsequence" rule this technique out entirely? (Recognition patterns)

## Further reading

- The subject index lists this technique, [Knuth-Morris-Pratt](/algorithms/strings/kmp), beside the techniques the subject does not yet cover: [the strings](/algorithms/strings/).
- The general idea of searching an ordered structure, and the predicate that makes it valid, is in [binary search](/algorithms/searching/binary-search).
- The discrete mathematics behind the divisibility and the periodicity argument of Problem 3 is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The counting argument that answers "how many ways" questions, which is the other way to avoid enumerating, is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The arithmetic that reduces a huge count modulo a prime is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The prefix function is a table of borders, in the same way that the tails array of the longest increasing subsequence is a table of minimum endings and the convex hull is a list of the extreme points of a set. The geometric version is in [convex hull](/algorithms/geometry/convex-hull).
- The offline version of the same idea, applied to binary searches rather than to character comparisons, is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The search over a tree of choices, which is what you reach for when the pattern is not a contiguous block, is in [backtracking](/algorithms/enumeration/backtracking).
- The monotone subsequence problem, which looks similar and is solved by a different structure, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The dynamic program that replaces an exponential search when the constraints involve a sum is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
