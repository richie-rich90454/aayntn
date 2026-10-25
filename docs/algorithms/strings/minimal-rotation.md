---
id: strings.minimal-rotation
title: The minimal rotation of a string
summary: Find the lexicographically smallest rotation of a string in linear time, by keeping two candidate cut points and discarding a whole block of starts at the first mismatch.
division: [gold]
subjects: [strings]
level: intermediate
importance: common-contest-technique
keywords:
    [
        minimal rotation,
        Booth's algorithm,
        cyclic shift,
        necklace,
        string canonicalization,
        Lyndon factorization,
        Duval's algorithm,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [strings.kmp, searching.two-pointers]
complexity:
    time: "O(n)"
    space: "O(1) beyond the input string"
assumptions:
    - The input is one nonempty string over an ordered alphabet, and comparing two characters takes constant time.
    - The whole string is in memory, because the scan reads characters at arbitrary positions modulo its length.
    - Every rotation has the same length, so two rotations are ordered by their first differing character.
implementations: strings.minimal-rotation
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/strings.minimal-rotation.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A rotation of a string is what you get by cutting it at some position and swapping the two pieces. The string `acab` has four rotations: `acab`, `caba`, `abac` and `baca`, and the smallest of them in dictionary order is `abac`. The minimal rotation problem asks for that smallest rotation, or for the cut at which it starts.

The naive method builds every rotation and compares it with the best one so far. It is $O(n^2)$ time and $O(n)$ space, and on a string of one million characters it copies about $10^{12}$ characters. Booth's algorithm finds the same answer in $O(n)$ time and $O(1)$ space beyond the input.

The idea is elimination. Two candidate cuts are compared at the same time, and the number of characters on which they agree is tracked. When they finally differ, the loser is not the only cut that is rejected: every cut inside the matched block is rejected too, because the same offset makes each of them worse than the corresponding cut after the winner. A mismatch therefore removes a whole block of starts at once, and each cut is removed at most once.

**Output convention.** Every program in this article prints the minimal rotation itself, not its starting index. Several judges ask for the rotation, and the others ask for the index; the same routine produces both, and the only difference is the final printing loop. The index is available before that loop, and the article says when it must be reported from $0$ and when from $1$.

## Problem motivation

A circular genome has no first base. A necklace has no first bead. A hash of a cycle has no canonical starting point. In each case the object is a cycle of symbols, but the input format is a line, so the same cycle arrives in a different order depending on where the writer happened to cut it. Two records that describe the same object fail an equality test that compares the lines verbatim.

The standard repair is a canonical form: replace each cycle by one agreed representative of its rotation class. The lexicographically smallest rotation is the usual choice, because it is unique up to the cut when the string is not periodic, it is easy to describe, and it can be computed without any hashing or sorting. Once every record carries its minimal rotation, equality of records is equality of strings, and deduplication is a hash set.

The direct computation is expensive. A string of length $n$ has $n$ rotations, each of length $n$, so writing all of them down costs $n \ast n = n^2$ characters. For $n = 10^6$ that is $10^{12}$ characters, which is far beyond any time or memory limit. Even comparing the rotations without storing them costs $n^2$ character comparisons in the worst case, because two rotations can agree for almost their whole length before they differ.

There is a second, more subtle cost. Sorting the rotations with a comparison sort needs $O(n \log n)$ comparisons, and each comparison can read $n$ characters, so the worst case is $O(n^2 \log n)$. A suffix array of the doubled string removes that factor but costs $O(n \log n)$ time and $O(n)$ space, and it is much more code than the problem needs.

Booth's algorithm answers the question in one pass with five integer variables. It is the standard solution for the problem, and its elimination argument is the same argument that makes the Knuth-Morris-Pratt search linear: a failed comparison explains a whole region, not a single position.

## Recognition patterns

The technique is the right tool when the statement contains some of these phrases.

- "Rotation", "cyclic shift", "circular string", "necklace", "bracelet", "cut the string at some point and swap the pieces".
- "Lexicographically smallest rotation", "the smallest cyclic shift", "the best place to break the circle".
- "The same up to rotation", "canonical form", "normalize the string", "count the distinct necklaces".
- A string of length up to $10^5$ or $10^6$, where generating all rotations is too slow.
- The output is either the rotation itself or the position at which it starts; the algorithm produces both, so the statement decides only the printing step.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| $n \le 1000$ | The naive $O(n^2)$ program is fine and is the reference implementation |
| $n \le 10^6$ | The linear scan is required; $n^2$ is $10^{12}$ |
| The answer is the rotation itself | The linear scan plus an $O(n)$ printing loop |
| The answer is the starting position | The linear scan; add one if the judge counts from $1$ |
| Several strings must be deduplicated up to rotation | Canonicalize each one and use a hash set |
| The question is the minimum period, not a rotation | The KMP prefix function; a period is a different object |
| The question is the smallest rotation of every suffix | A suffix structure; running this scan per suffix is quadratic |
| Two circular strings must be compared without normalizing | A specialized circular comparison, not this technique |
| The alphabet is unordered | Lexicographic order is undefined; the problem cannot be stated |

The row about the minimum period is the one that catches people. A period is a shift that keeps the string compatible with its own repetition, while a rotation is a shift that moves characters from the front to the back. The string `abba` has minimum period $3$, because it is a prefix of the infinite repetition of `abb`, but its minimal rotation is `aabb`, which is a different word. The two questions share the word "cycle" and nothing else.

The last row matters too. The algorithm compares characters with `<`, so the alphabet has to carry an order. For a set of symbols with no natural order, the problem has to name the order first, and then the same algorithm applies to the sequence of ranks rather than to the characters.

## Naive approach

The baseline builds every rotation and keeps the smallest one.

```cpp
std::string naive_min_rotation(const std::string& s) {
    int n = static_cast<int>(s.size());
    std::string best = s;
    for (int k = 1; k < n; ++k) {
        std::string candidate = s.substr(k) + s.substr(0, k);
        if (candidate < best) best = candidate;
    }
    return best;
}
```

This is correct for every input, and it is the reference implementation for the differential test. It is also $O(n^2)$ in the worst case, because each of the $n$ candidates copies $n$ characters and the comparison can read all $n$ of them. The space is $O(n)$ for one candidate and the best rotation, or $O(n^2)$ if the candidates are stored in a vector for later sorting.

The second baseline is the one that people write when they notice the first character. Only the cuts whose first character equals the minimum character of the string can start the minimal rotation, so the other cuts are skipped.

```cpp
char smallest = s[0];
for (char c : s) smallest = std::min(smallest, c);
for (int k = 0; k < n; ++k) {
    if (s[k] != smallest) continue;
    std::string candidate = s.substr(k) + s.substr(0, k);
    if (candidate < best) best = candidate;
}
```

The filter is correct and it does not change the worst case. Take the string `aaaa...aab`, with $n-1$ copies of `a` followed by one `b`. Every cut except the last one starts with `a`, so the filter keeps $n-1$ candidates, and comparing the candidate at cut $k$ with the best one reads $n-k$ characters before the `b` decides it. The total is again $O(n^2)$.

The lesson is the same as in the string search: filtering by the first character is not enough, because the expensive information is in the common prefix. The linear algorithm has to exploit the prefix, not the first character.

## Key insight

Suppose two candidate cuts $i$ and $j$ have rotations that agree on their first $k$ characters and then differ. Write the first difference as

$$
R_i[k] > R_j[k].
$$

The claim is that every cut $i + t$ with $0 \le t \le k$ is worse than the cut $j + t$. The rotations at those two cuts agree on their first $k - t$ characters, because those characters are a suffix of the common prefix of $R_i$ and $R_j$. At position $k - t$ the rotation at $i + t$ reads the character $R_i[k]$, and the rotation at $j + t$ reads $R_j[k]$, and the first is larger. So the difference is decided in favor of $j + t$.

This is the whole technique. A single mismatch rejects $k + 1$ cuts, not one, and the rejected block is the segment from the loser to the point where the two rotations first differed. The winner keeps its position, the loser jumps past the block, and the scan continues from a fresh pair of candidates.

The comparison with the string search is exact. In KMP, a mismatch in state $k$ falls back to the longest border of the matched prefix, because the matched prefix is still useful. Here, a mismatch between cuts $i$ and $j$ advances the loser by $k + 1$, because the block it skips is already known to be worse. Both algorithms turn a failed comparison into a jump, and in both the total jump is bounded by the length of the string.

The two candidates are not the two smallest rotations seen so far in any obvious order. They are the two surviving cuts, and every cut before the smaller one has been proven not to start the minimum. That invariant is what the correctness proof formalizes.

## Visual intuition

Take `s = acab`. The doubled string below shows the rotations as windows of length four.

```text
s = a c a b
t = a c a b a c a b
    0 1 2 3 4 5 6 7
```

The window at cut $0$ is `acab`, and the window at cut $2$ is `abac`. The two windows agree on their first character `a`, then the window at $0$ has `c` where the window at $2$ has `b`. The cut at $0$ loses, and the cut at $1$ lies inside the matched block, so both cuts $0$ and $1$ are rejected at once. The winner is the cut $2$.

A larger block appears when the common prefix is longer. Take `s = baca`. The cuts $1$ and $3$ both start with `a`, and their rotations are `acab` and `abac`. They agree on the first `a`, then the cut $1$ has `c` and the cut $3$ has `b`, so the cut $1$ loses. The matched block is the two cuts $1$ and $2$, and both are rejected at once even though the scan compared only the rotations at $1$ and $3$.

| Candidate cut | Rotation | Fate                                                         |
| ------------- | -------- | ------------------------------------------------------------ |
| 0             | `baca`   | loses to cut 1, rejected                                     |
| 1             | `acab`   | agrees with cut 3 on `a`, loses on `c` against `b`, rejected |
| 2             | `caba`   | rejected with the block of cut 1                             |
| 3             | `abac`   | survives, answer                                             |

The block is the reason the algorithm is linear. A scan that rejected one cut per mismatch would be $O(n^2)$ on a string where every comparison matches for a long time. The block rejection removes the whole matched region, so the total number of rejected cuts is at most $n$, and each cut is charged to one comparison.

## Formal model

Let $s = s_0 s_1 \dots s_{n-1}$ be a string of length $n$ over an alphabet $\Sigma$ with a total order. Extend $s$ periodically by $s_p = s_{p \bmod n}$ for every integer $p$.

::: math definition Definition
The **rotation at cut $k$**, written $R_k$, is the length-$n$ word

$$
R_k = s_k s_{k+1} \dots s_{k+n-1}.
$$

For $0 \le k < n$ this is the ordinary rotation $s_k \dots s_{n-1} s_0 \dots s_{k-1}$. For $k \ge n$ it is the same word as $R_{k-n}$, so the periodic extension does not create new rotations.
:::

::: math definition Definition
The **minimal rotation** of $s$ is the smallest word among $R_0, R_1, \dots, R_{n-1}$ in lexicographic order. The **minimal cut** is the smallest index $m$ with $R_m \le R_q$ for every $q$. If several rotations are equal and minimal, the minimal cut is the first of them.
:::

::: math definition Definition
A cut $p$ is **eliminated** once the algorithm has exhibited a cut $q$ with $R_q < R_p$. An eliminated cut cannot be the minimal cut, because the minimum is not larger than any rotation and $R_p$ is strictly larger than $R_q$.
:::

::: math lemma Lemma
Suppose $R_i$ and $R_j$ agree on their first $k$ characters and differ at position $k$, with $R_i[k] > R_j[k]$. Then for every $t$ with $0 \le t \le k$,

$$
R_{i+t} > R_{j+t}.
$$

:::

::: math proof Proof
Fix $t$ with $0 \le t \le k$. For every $u$ with $0 \le u < k - t$, the character at position $u$ of $R_{i+t}$ is $s_{i+t+u}$, and the character at the same position of $R_{j+t}$ is $s_{j+t+u}$. Both indices are at offset $t + u < k$ inside the common prefix, so the two characters are equal.

At position $u = k - t$, the character of $R_{i+t}$ is $s_{i+k} = R_i[k]$, and the character of $R_{j+t}$ is $s_{j+k} = R_j[k]$. The first is larger by the hypothesis. The first difference between the two rotations is therefore at position $k - t$ and it favors $j + t$, so $R_{i+t} > R_{j+t}$. $\square$
:::

::: math lemma Corollary
Under the hypothesis of the lemma, every cut in the block $i, i+1, \dots, i+k$ is eliminated.
:::

The lemma is stated for the infinite periodic extension, so the indices $j + t$ and $i + t$ may exceed $n$; the definition of $R_p$ handles that without a separate case. This is the only place where the periodic view matters, and it keeps the proof free of wraparound conditions.

## Algorithm derivation

### The two candidates

Keep two cuts $i$ and $j$, initially $0$ and $1$, and a counter $k$ of the characters on which their rotations agree. The invariant is that every cut before the smaller of $i$ and $j$ is eliminated, and every cut strictly between them is eliminated too. The minimal cut is therefore the smaller candidate or something at or after the larger one.

The counter $k$ starts at $0$ and grows while the compared characters are equal. In that case neither candidate can be rejected, because the two rotations are still tied.

### The mismatch

When the characters differ, one rotation is larger. Suppose $R_i[k] > R_j[k]$. By the lemma, the cuts $i, i+1, \dots, i+k$ are eliminated. The next possible cut after that block is $i + k + 1$, so the algorithm sets $i$ to that value. If the new $i$ lands on or before $j$, it is moved to $j + 1$, because the two candidates have to stay distinct and the cut $j$ is the surviving one. The counter resets to $0$, because the new pair has not been compared yet.

The case $R_i[k] < R_j[k]$ is symmetric: $j$ jumps past its block, and if it lands on or before $i$ it moves to $i + 1$.

### The loop

The scan stops when one of the three conditions holds: $i \ge n$, $j \ge n$, or $k \ge n$. The first two mean that one candidate has left the string, so the other one is the only surviving cut. The third means that the two rotations agreed for all $n$ characters, so they are equal, and the smaller index is the answer.

```cpp
int least_rotation(const std::string& s) {
    int n = static_cast<int>(s.size());
    int i = 0, j = 1, k = 0;
    while (i < n && j < n && k < n) {
        char a = s[(i + k) % n];
        char b = s[(j + k) % n];
        if (a == b) {
            ++k;
        } else if (a > b) {
            i = i + k + 1;
            if (i <= j) i = j + 1;
            k = 0;
        } else {
            j = j + k + 1;
            if (j <= i) j = i + 1;
            k = 0;
        }
    }
    return i < j ? i : j;
}
```

The modulo is the only extra operation per comparison. It avoids building the doubled string, which is the usual implementation trick and costs $O(n)$ space. On a million characters the doubled copy is only two megabytes and either choice is fine, but the modulo version keeps the space bound honest and makes the six programs identical in structure.

### Why the scan is linear

Every iteration either increases $k$ by one or performs a mismatch. A mismatch at offset $k$ advances one candidate by $k + 1$ and resets $k$ to $0$. Charge the $k$ equal comparisons that preceded the mismatch, and the mismatch itself, to the $k + 1$ cuts that the jump skips. Those cuts are distinct for every jump, because the candidates only move forward, and there are only $n$ cuts.

The two candidates together advance at most $2n$, so the total charged work is at most $2n$. The final run of equalities, the one that can end with $k = n$, adds at most $n$ comparisons. The total is at most about $3n$ character comparisons and $O(n)$ iterations, which is $O(n)$ time.

## Step-by-step execution

Take `s = acab`, so $n = 4$. The table shows every iteration. "Left" is the character of $R_i$ at offset $k$, and "right" is the character of $R_j$ at the same offset.

| Step | $i$ | $j$ | $k$ | Left | Right | Action | New state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 1 | 0 | `a` | `c` | left is smaller, so $j$ loses | $j = 2$, $k = 0$ |
| 2 | 0 | 2 | 0 | `a` | `a` | equal | $k = 1$ |
| 3 | 0 | 2 | 1 | `c` | `b` | right is smaller, so $i$ loses | $i = 2$, then $3$ because it landed on $j$; $k = 0$ |
| 4 | 3 | 2 | 0 | `b` | `a` | right is smaller, so $i$ loses | $i = 4$, $k = 0$ |
| 5 | 4 | 2 | 0 |  |  | $i \ge n$, stop | answer $\min(4,2) = 2$ |

The answer is the rotation at cut $2$, which is `abac`. Step 3 is the only place where the collision guard matters: the jump from $i = 0$ by $k + 1 = 2$ lands exactly on $j = 2$, and the guard moves it to $3$ so that the surviving cut $2$ stays on the board.

Now take `s = abab`, where the two rotations can tie. The scan compares the cuts $0$ and $2$: the characters `a`, `b`, `a`, `b` all match, so $k$ reaches $4$ and the loop stops on $k = n$. Both rotations are `abab`, and the answer is $\min(0,2) = 0$, the smaller of the two equal starts.

A two-character example shows the wrap. For `s = ba`, the first comparison is `b` against `a`, so the cut $0$ loses and $i$ becomes $1$, then $2$ because it landed on $j = 1$. The loop stops with $i = 2$ and $j = 1$, and the answer is the rotation at cut $1$, which is `ab`. The rotation at cut $0$ is `ba`, and it is larger.

## Correctness proof

::: math theorem Theorem
The algorithm returns the minimal cut $m$ of the input string.
:::

::: math proof Proof
Let $L = \min(i,j)$ and $H = \max(i,j)$ at the top of an iteration. The invariant has two parts:

1. Every cut below $L$ is eliminated.
2. Every cut strictly between $L$ and $H$ is eliminated.

Both are vacuous at the start, because $i = 0$ and $j = 1$. An equality step does not move a pointer, so it preserves them.

Suppose a mismatch occurs with $i < j$ and $R_i[k] > R_j[k]$. By the lemma, the block $i, \dots, i+k$ is eliminated. The new $i$ is $i + k + 1$, or $j + 1$ when $i + k + 1 \le j$.

If $i + k + 1 \le j$, the block ends before $j$, so the cuts below $j$ are the cuts below $i$, the block, and the cuts strictly between the old $i$ and $j$; all three groups are eliminated by the invariant and the lemma. The new pair is $(j+1, j)$, so $L = j$ and there is no cut strictly between $L$ and $H$. Both parts hold.

If $i + k + 1 > j$, the block covers $j$ and everything up to $i + k$. The cuts below $j$ are covered by the old invariant and the block, so the first part holds for the new $L = j$. The cuts strictly between $j$ and the new $H = i + k + 1$ are inside the block, so the second part holds too. The case $j < i$ is symmetric.

The invariant implies that the minimal cut is either $L$ or at least $H$, because an eliminated cut cannot be minimal and no minimal cut lies in the eliminated range.

At termination, three cases are possible. If $i \ge n$, then $L = j < n$ and $H = i \ge n$; every cut below $j$ and every cut above $j$ is eliminated, so $m = j$. The case $j \ge n$ is symmetric.

The remaining case is $k \ge n$, where the rotations at $i$ and $j$ agree on all $n$ characters and are therefore equal. Let $d = H - L$. Equality of the two length-$n$ blocks means the string is unchanged by a cyclic shift of $d$, so $s$ is a repetition of a block of length $g = \gcd(d,n)$, and two rotations are equal exactly when their cuts are congruent modulo $g$. The smallest cut of any residue class is below $g \le d$. The cut $m \bmod g$ is a minimal cut and it is below $H$; if it were below $L$ or strictly between $L$ and $H$ it would be eliminated, so it equals $L$. Hence $R_m = R_L$. The minimal cut is the smallest index with that rotation, and every cut below $L$ is eliminated, so $m = L$.

Finally, the returned value is $\min(i,j) = L$ in every case, which is the minimal cut. The tie rule is satisfied because the returned cut is the smallest index among the minimal rotations. $\square$
:::

The proof uses only two facts about the scan: a mismatch eliminates its whole block, and the pointers never move backward. The periodicity fact in the $k \ge n$ case is the same divisibility statement that the [KMP article](/algorithms/strings/kmp) uses for the minimum period: a string of length $n$ with period $d$ is a repetition of its prefix of length $\gcd(d,n)$.

## Complexity analysis

| Phase                    | Cost                                     |
| ------------------------ | ---------------------------------------- |
| Comparing the candidates | At most about $3n$ character comparisons |
| Moving the pointers      | At most $2n$ steps in total              |
| Printing the rotation    | $O(n)$                                   |
| Whole algorithm          | $O(n)$ time and $O(1)$ extra space       |

The space bound is the interesting one. The algorithm keeps five integers and reads the input in place, so it needs no table, no doubled string and no recursion. The [KMP](/algorithms/strings/kmp) prefix function needs $O(m)$ space, the [Z array](/algorithms/strings/z-algorithm) needs $O(n)$, and a [suffix array](/algorithms/strings/suffix-array) needs $O(n)$ space and $O(n \log n)$ time. The two-candidate scan is the cheapest of the methods listed here in space, and it matches the best of them in time.

The comparison count has a small constant. Each iteration reads two characters, and each character is charged to a cut that is skipped or to the final tie run. The modulo operation is a division, which is slower than a comparison, but it is still constant time and the input sizes that matter are far below the point where the constant dominates.

The output is not free. A program that prints the rotation character by character writes $n$ characters, which is $O(n)$ and cannot be avoided, because the answer itself has length $n$. The space for the output can be avoided by printing in two pieces, as the Pascal and Python variants do, or by streaming the characters.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The minimal rotation and its cut | Booth's two-candidate scan |
| The rotation itself | The same scan, then print the two pieces around the cut |
| The maximal rotation | The same scan with the comparison reversed |
| Deduplicate strings up to rotation | Canonicalize each string and use a hash set |
| Count distinct necklaces | Canonicalize each necklace and count the distinct keys |
| The minimum period of a string | The KMP prefix function, not this scan |
| The minimal rotation of every suffix | A suffix array or a suffix automaton; this scan per suffix is quadratic |
| Compare two circular strings | Canonicalize both and compare the results |
| $n \le 1000$ | The naive program is simpler and fast enough |
| Many short strings | Canonicalize each one; the total work is linear in the input |
| A sequence of tokens instead of characters | The same scan with a comparator on the tokens |
| The alphabet has no order | The problem has to define the order first |

The first two rows are the same algorithm. The output convention is a printing decision, not an algorithmic one, and mixing the two is the most common source of wrong answers on judges that ask for the index.

The row about deduplication is where the technique pays off in practice. If there are $k$ strings of total length $L$, canonicalizing all of them costs $O(L)$, and a hash set costs $O(k)$ expected insertions. Comparing every pair instead costs $O(k^2 L)$ in the worst case, which is hopeless for ten thousand necklaces of length one hundred.

The row about the minimum period is the one that decides between two string techniques that both look at repeats. A period is a shift that leaves the string unchanged when it is repeated, while a rotation is a shift that moves the ends. The KMP prefix function answers the period question in linear time, and Booth's algorithm answers the rotation question in linear time; neither answers the other's question.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal and JavaScript. They implement the same contract.

- The input is one line holding a nonempty string without spaces. The length is at most $10^6$.
- The output is one line holding the lexicographically smallest rotation of that string.

Every version runs the same loop: two candidate cuts, a counter of the matched prefix, a jump of the loser by the counter plus one, and a reset of the counter. Every version indexes the string modulo its length, so no version allocates a doubled copy. Every version produces the rotation directly from the final cut, either by streaming its characters or by printing the two pieces around the cut, so the output is produced in linear time and constant extra space.

The six programs print the rotation, not the index. If a problem asks for the index, the same function returns it: in the C++ code it is the value of `start` before the printing loop. A judge that counts from $0$ prints `start`, and a judge that counts from $1$ prints `start + 1`. [Glass Beads](http://poj.org/problem?id=1509) is the second kind, and [the CSES problem](https://cses.fi/problemset/task/1110) wants the rotation itself.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and are compiled and run by the same validation as the other four. The Pascal variant strips a carriage return from the input line, uses 1-based string indexing, and prints the rotation in two `Write` calls; the JavaScript variant collects the standard input with the stream events and writes one line.

The sources are under `implementations/strings/minimal-rotation/`, with one directory per language and the source file named in the manifest. The manifest carries the time and space of every variant, its input and output contract, and its verification status.

## Recursion decision

The scan is iterative, and there is no natural recursive formulation that helps. A recursive version would carry the two candidates and the matched length as arguments, and its depth would be the number of mismatches, which can be $n$. It would also have to return the updated candidates, because the state is not a value that can be recomputed from a smaller subproblem.

| Language   | Practical recursion depth            | Recommendation                             |
| ---------- | ------------------------------------ | ------------------------------------------ |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative, because the depth can reach $n$ |
| Java       | About $10^4$ frames                  | Iterative                                  |
| Python     | The interpreter limit of 1000        | Iterative                                  |
| Pascal     | The operating system stack           | Iterative                                  |
| JavaScript | About $10^4$ frames                  | Iterative                                  |

The recursive alternative that people sometimes write is the naive one: recurse on every rotation and take the minimum. That version has depth $n$ and work $O(n^2)$, so it is worse than the iterative scan on both counts. The loop is shorter than the recursion and does not need a stack.

## Implementation walkthrough

Five details decide whether the implementation is correct.

**The jump uses $k$, then resets it.** The order is

```cpp
i = i + k + 1;
if (i <= j) i = j + 1;
k = 0;
```

If `k = 0` is executed before the jump, the loser advances by one and the whole block is not skipped, which turns the linear scan back into a quadratic one. The jump must read the old value of $k$.

**The guard keeps the candidates distinct.** The jump can land exactly on the other candidate, or between the two candidates. The condition `i <= j` moves the new candidate just past the other one, so the pair stays ordered and the surviving candidate stays on the board. The same guard appears on the other side with `j <= i`.

**The comparison direction.** If `a > b`, the rotation at $i$ is larger and $i$ loses. If `a < b`, the rotation at $j$ is larger and $j$ loses. Swapping the two branches is the most common transcription error, and it produces a maximal rotation instead of a minimal one.

**The modulo indexing.** The offset $k$ can be as large as $n - 1$, and $i + k$ can reach $2n - 2$, so the character is read at `(i + k) % n`. A doubled string `t = s + s` removes the modulo and costs $O(n)$ space. Both versions are correct; the modulo version is the one in the manifest because it keeps the space bound constant.

**The output.** The answer is `s[start..n-1] + s[0..start-1]`. Printing `s.substr(start) + s.substr(0, start)` builds a copy of the whole answer, which is $O(n)$ extra space. Printing the two pieces directly, or streaming the characters, keeps the extra space constant.

A compact version of the whole loop:

```cpp
while (i < n && j < n && k < n) {
    char a = s[(i + k) % n], b = s[(j + k) % n];
    if (a == b) { ++k; continue; }
    if (a > b) { i += k + 1; if (i <= j) i = j + 1; }
    else       { j += k + 1; if (j <= i) j = i + 1; }
    k = 0;
}
```

For multiple test cases, every variable has to be reset: $i = 0$, $j = 1$, $k = 0$, and $n$ is recomputed from the new string. The variables are local to the function, so a fresh call is the simplest reset. The C variant reads the string into a fixed buffer of $10^6$ characters; a problem with a larger limit needs a growable buffer, and the rest of the code does not change.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Advancing the loser by $k$ instead of $k + 1$ | The losing cut itself is never rejected; when $k = 0$ the loop does not advance at all and hangs | The block is $i$ through $i + k$, so the next cut is $i + k + 1$ |
| Resetting $k$ before the jump | The jump reads zero and the block is not skipped | Jump first, reset second |
| Swapping the comparison branches | The program returns the maximal rotation | Check one small case by hand: `acab` must give `abac` |
| Reporting the first cut with the smallest character | The first occurrence of the minimum character need not start the minimum rotation | Use the full scan; `baca` starts with `b`, and the answer is the second `a` |
| Returning the cut instead of the rotation, or the rotation instead of the cut | The judge sees the wrong type of answer | Read the output clause before writing the print statement |
| Reporting a 0-based cut where the judge counts from 1 | Every answer is off by one | Add one at the print, not inside the scan |
| Building all rotations and sorting them | $O(n^2 \log n)$ comparisons and $O(n^2)$ memory | Run the scan and print one rotation |
| Using `signed char` for the comparison in C | Characters above 127 can compare in the wrong order on some platforms | Cast to `unsigned char`, or restrict the alphabet to ASCII |
| Forgetting the tie rule when the string is periodic | The returned rotation is right but the reported position is not the smallest | Return `min(i, j)`, which is the smallest surviving cut |

### Why this fails: the loser that never moves

The smallest counterexample is `s = ba`. The cut $0$ and the cut $1$ are compared, and the character at cut $0$ is `b` while the character at cut $1$ is `a`, so the cut $0$ loses. A program that advances the loser by `k` writes `i = i + 0`, sets $k$ back to zero, and compares the same two cuts forever. The program does not print a wrong answer; it does not terminate.

The mechanism is exact. The losing block is not one cut, it is $k + 1$ cuts: the loser at offset $0$ and every cut that shares the matched prefix up to the mismatch. When $k = 0$ the block still has one element, the loser itself, and it has to be skipped. Advancing by $k$ skips nothing in that case, which is why the smallest input with two different characters is enough to expose the bug.

A second failure is the first-character shortcut. Take `s = baca`. The smallest character is `a`, and it appears at cuts $1$ and $3$. The rotation at cut $1$ is `acab`, and the rotation at cut $3$ is `abac`. The first occurrence of `a` gives `acab`, which is not the minimum. The second occurrence gives `abac`, which is. The full scan compares the two and keeps the second, while the shortcut stops at the first.

A third failure is the output convention. On [Glass Beads](http://poj.org/problem?id=1509) the answer is the 1-based position of the bead that starts the minimal rotation, and on [the CSES problem](https://cses.fi/problemset/task/1110) the answer is the rotation itself. A program that computes the right cut and prints the wrong object is indistinguishable from a program that computes the wrong cut, and the fix is in the print statement rather than in the algorithm.

## Variants and extensions

- **Duval's Lyndon factorization.** Factor the string into Lyndon words. The start of the last factor is a cut that produces the minimal rotation, though not always the smallest such cut when the string is periodic. The algorithm is also $O(n)$ and uses constant space, and it is the standard alternative to Booth's scan.
- **Shiloach's fast canonization.** A two-phase method that first rules out the cuts that cannot start the minimum and then resolves the survivors. It uses fewer comparisons than the plain scan in the worst case.
- **The maximal rotation.** Reverse the comparison: the loser is the cut whose character is smaller. The same proof applies with the order reversed.
- **The failure-function form.** Booth's original formulation computes a failure function over the doubled string, in the style of KMP, and returns the rotation counter. It costs $O(n)$ extra space for the table and is the version that appears in some textbooks.
- **Canonical forms for deduplication.** Replace every string by its minimal rotation before inserting it into a hash set. This is the standard use of the technique in string processing, and it is the third worked problem.
- **Circular string comparison.** Canonicalize both strings and compare the results, or compare the rotations directly with a circular variant of the lexicographic comparison. The canonical form is simpler and is fast enough when the strings are used more than once.
- **Rotations of sequences.** The same scan works on an array of integers, on a list of tokens, or on a string of Unicode code points, as long as the elements have a total order.
- **The minimal rotation of every suffix.** Running this scan once per suffix is $O(n^2)$. A suffix array or a suffix automaton answers the family of questions in $O(n \log n)$ or $O(n)$, and it is the right tool when the problem asks for more than one rotation.

## Contest strategy

1. Read the output clause first. Decide whether the judge wants the rotation or the cut, and whether the cut is 0-based or 1-based. The algorithm is the same in every case.
2. Write the naive program first and keep it. It is the reference implementation for random tests, and it fits in ten lines.
3. Implement the two-candidate scan with the jump by $k + 1$ and the collision guard. Test it on `acab`, `ba`, `abab`, `baca` and `z` before trusting it.
4. Test the periodic case explicitly. A string that is a power of a shorter block has several equal minimal rotations, and the answer must be the smallest cut among them.
5. Test the single-character case. It checks that the loop condition, the output length and the index arithmetic all handle $n = 1$.
6. Do not sort the rotations. A sort costs $O(n \log n)$ comparisons and each comparison can read $n$ characters, so the worst case is worse than the naive scan.
7. If the problem has many strings, canonicalize each one and use a hash set. The total work is linear in the input, and the pairwise comparison is quadratic.
8. If the string length is over $10^6$, check the reading method before the algorithm. A fixed buffer, a slow scanner or a `String` concatenation in a loop can dominate the running time.

## Worked problems

### Problem 1: the minimal rotation itself

**Restatement.** Given a string of length $n \le 10^6$ over the lowercase Latin alphabet, print its lexicographically smallest rotation. This is [CSES "Minimal Rotation"](https://cses.fi/problemset/task/1110).

**Naive baseline.** Build every rotation and keep the smallest, which is $O(n^2)$ time and copies about $10^{12}$ characters at the limit.

**Insight.** A mismatch between two candidate cuts eliminates the loser and every cut inside the matched block, so every mismatch rejects at least one cut.

**Derivation.** Run the two-candidate scan, then print the characters from the final cut to the end followed by the characters before it.

**Correctness.** The theorem above shows that the returned cut is the minimal cut, so the printed rotation is the minimal rotation. The tie rule does not change the printed string, because equal minimal rotations are the same word.

**Complexity.** $O(n)$ time and $O(1)$ extra space, plus $O(n)$ for the output itself.

**Common wrong approach.** Printing the cut instead of the rotation. The sample `acab` has the correct cut at index $2$ and the correct output `abac`; a program that prints `2` fails even though its scan is right.

### Problem 2: the necklace with the worst cut

**Restatement.** For each of several necklaces of length at most $10000$, report the 1-based position of the bead that starts the lexicographically smallest rotation. If several positions give the same rotation, report the smallest one. This is [POJ "Glass Beads"](http://poj.org/problem?id=1509).

**Naive baseline.** Try every cut and compare the rotation with the best one, which is $O(n^2)$ per necklace and too slow in the worst case.

**Insight.** The worst cut is the minimal cut, and the scan returns the smallest cut among the minimal rotations, which is exactly the tie rule.

**Derivation.** Run the scan on each necklace, take `start = min(i, j)`, and print `start + 1`.

**Correctness.** The theorem gives the minimal cut, and the tie rule is the choice of the smallest index among the minimal rotations, which the scan returns.

**Complexity.** $O(n)$ per necklace and $O(1)$ extra space per case, so $O(\sum n)$ overall.

**Common wrong approach.** Printing the 0-based cut. The sample `helloworld` has the minimal rotation at 0-based index $9$, and the judge expects `10`.

### Problem 3: counting distinct necklaces

**Restatement.** Given up to $10000$ necklaces of length at most $100$ over the alphabet `{0, 1}`, count how many distinct necklaces there are, where two necklaces are the same when one is a rotation of the other. This is [HDU "How many"](https://acm.hdu.edu.cn/showproblem.php?pid=2609).

**Naive baseline.** Compare every pair of necklaces and test whether one is a rotation of the other, which is $O(k^2 L)$ for $k$ necklaces of length $L$.

**Insight.** Two necklaces are equal up to rotation exactly when their minimal rotations are equal, so the minimal rotation is a canonical key.

**Derivation.** For each necklace, compute its minimal rotation. Insert the result into a hash set. Print the size of the set.

**Correctness.** If two necklaces are rotations of each other, they have the same set of rotations and therefore the same minimal rotation, so they produce the same key. If they are not rotations of each other, their rotation sets are disjoint, so their minima are different. The set counts the classes exactly.

**Complexity.** $O(kL)$ time for the canonical forms and $O(kL)$ expected time for the hash operations, with $O(kL)$ space for the set.

**Common wrong approach.** Inserting the original necklace as the key. Two equal necklaces that arrive at different cuts then occupy two different keys, and the count is too large. A second wrong approach is to also try the reversed necklace: the statement allows rotation only, so a reversal is a different necklace unless the string happens to be a palindrome.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a rotation, a period, or a comparison of two circular strings, and write down which of the three it is.
2. **Direct application.** Implement the naive program and the linear scan, and check that they agree on a thousand random strings of length at most ten over a three-letter alphabet.
3. **Adaptation.** Change the program to return the cut, then to return the 1-based cut, then to return the maximal rotation instead of the minimal one. Check each version on `acab`, `ba`, `abab`, `baca` and `z`.
4. **Combination.** Canonicalize a list of strings and deduplicate it with a hash set. Compare the count against the pairwise rotation test on random small lists.
5. **Challenge.** Implement Duval's Lyndon factorization and use it to find the minimal rotation, then compare its comparison count against the two-candidate scan on a million-character string.
6. **Transfer.** Recognize the same elimination pattern in another technique: a mismatch rejects a block of candidates, not one candidate. The [KMP prefix function](/algorithms/strings/kmp) and the [Z algorithm](/algorithms/strings/z-algorithm) both use a version of this idea.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is a rotation, and how is it written as a window of the periodic string? (Formal model)
2. Why does a mismatch at offset $k$ eliminate $k + 1$ cuts rather than one? (Key insight)
3. What are the two candidate cuts, and what does the counter $k$ measure? (Algorithm derivation)
4. Why must the loser jump by $k + 1$ and not by $k$? (Implementation walkthrough)
5. Why must the counter be reset after the jump rather than before it? (Implementation walkthrough)
6. What does the collision guard do, and why must the candidates stay distinct? (Implementation walkthrough)
7. What is the invariant that relates the two candidates to the minimal cut? (Correctness proof)
8. What happens when $k$ reaches $n$, and why is the smaller candidate still the answer? (Correctness proof)
9. Why is the total number of comparisons linear rather than quadratic? (Algorithm derivation)
10. What is the smallest input on which advancing by $k$ does not terminate? (Common mistakes)
11. Why is the first occurrence of the smallest character not necessarily the minimal cut? (Common mistakes)
12. When is the minimum period a better question than the minimal rotation, and which technique answers it? (Algorithm selection)

## Further reading

- The prefix function, the border chain and the linearity argument that this scan mirrors are in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The other direction of the same prefix question, where each suffix is compared with the whole string, is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The exact comparison of substrings by fingerprint, which is a faster but probabilistic alternative, is in [rolling hash](/algorithms/strings/rolling-hash).
- The structure that sorts all suffixes of a text and answers substring questions about it is in [the suffix array](/algorithms/strings/suffix-array).
- The two-pointer pattern that this scan generalizes, where two indices move forward and never backward, is in [two pointers](/algorithms/searching/two-pointers).
- The amortized argument that bounds a sequence of jumps by the number of advances is in [complexity analysis](/algorithms/foundations/complexity).
- The loop-invariant style used in the correctness proof is the same style as the proof of [binary search](/algorithms/searching/binary-search), where the invariant is an interval rather than a pair of cuts.
- The prefix sums that answer range questions after a canonical form is built are in [prefix sums](/algorithms/arrays/prefix-sums).
- The subject index places this technique beside the pattern-matching and indexing methods, in [the strings](/algorithms/strings/).
- Another linear scan that reuses work already done inside a matched window is [Manacher's algorithm](/algorithms/strings/manacher).
