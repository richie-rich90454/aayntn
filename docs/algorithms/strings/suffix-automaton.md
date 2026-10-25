---
id: strings.suffix-automaton
title: The suffix automaton
summary: Store every substring of a fixed string in a linear-size automaton whose states are end-position classes, so distinct substrings and occurrence counts come from one pass over the string.
division: [gold, platinum]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords:
    [
        suffix automaton,
        suffix link,
        endpos,
        end positions,
        distinct substrings,
        occurrence count,
        minimal automaton,
        online construction,
    ]
prerequisites:
    required: [strings.trie, foundations.complexity]
    recommended: [strings.suffix-array, strings.kmp]
complexity:
    time: "O(26n) for a lowercase alphabet"
    space: "O(26n) for the transition table"
assumptions:
    - The string is fixed before the queries, so the automaton is built once and reused.
    - The alphabet is small and fixed, so a state can carry one transition per symbol.
    - The number of distinct substrings is accumulated in 64 bits, because it can exceed 2^31.
implementations: strings.suffix-automaton
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/strings.suffix-automaton.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

The suffix automaton of a string $s$ is the smallest deterministic automaton whose paths from the initial state spell exactly the substrings of $s$. Every state is an accepting state, because accepting a path means "this path is a substring", and the automaton exists to answer questions about all substrings at once rather than about one pattern.

The construction is online. Reading $s$ from left to right, each character creates one new state and, only when a class has to be split, one clone. A string of length $n$ therefore has at most $2n$ states, and at most $3n-4$ transitions for $n \ge 3$, so the structure is linear in the string, not quadratic. Building it costs $O(26n)$ time and space with a dense transition table over a lowercase alphabet, and $O(n)$ with a sparse representation and a larger constant per transition.

Each state $v$ stores the length $\operatorname{len}[v]$ of the longest string in its class and a suffix link $\operatorname{link}[v]$ to the class of the longest proper suffix that is not in the class. The number of distinct substrings is

$$
\sum_{v \ne \text{root}} \bigl(\operatorname{len}[v] - \operatorname{len}[\operatorname{link}[v]]\bigr),
$$

and the number of occurrences of every string in the class of $v$ is the size of the end-position set of $v$, which one pass over the suffix-link tree computes. Neither answer enumerates a substring, which is what makes the technique usable at $n = 10^5$ and beyond.

## Problem motivation

A query engine holds a fixed document of $n = 10^5$ characters and receives many questions about its substrings: how many distinct substrings it has, how often a given substring occurs, which distinct substring is the $k$-th in lexicographic order, and what the longest repeated substring is. The document never changes, and the questions arrive one at a time.

Writing down every substring is the first thing that comes to mind, and it is also the first thing that fails. A string of length $n$ has $n(n+1)/2$ substrings counted with multiplicity, which is about $5 \cdot 10^9$ for $n = 10^5$. Even if every substring were one byte, the table would not fit in memory, and building it costs time proportional to the total length of the substrings, which is $\Theta(n^3)$.

A suffix array is a correct alternative. It sorts the $n$ suffixes in $O(n \log n)$ time, and the number of distinct substrings is $n(n+1)/2$ minus the sum of the longest-common-prefix array. Counting the occurrences of a query needs a binary search over the array and a range length. That is a good solution, but it has three costs: the build is $O(n \log n)$, the queries need the longest-common-prefix machinery, and appending one character forces a rebuild.

The suffix automaton removes all three costs. It represents all $5 \cdot 10^9$ substrings with at most $2 \cdot 10^5$ states, it counts occurrences by a tree sum instead of a range query, and it is built by appending characters, so the same code handles a string that grows. The price is conceptual: the states are equivalence classes of substrings rather than substrings, and the construction has one delicate case, the clone.

The same structure is the standard tool for the harder variants: the $k$-th smallest distinct substring, the sum of a function over all distinct substrings, the longest common substring of two strings, and the shortest substring that occurs at least $k$ times.

## Recognition patterns

The suffix automaton is the right tool when the statement has some of these shapes.

- "Given a string, count its distinct substrings", or "how many different substrings does it have".
- "For a substring that appears in the text, how many times does it occur", with many queries over one fixed text.
- "Find the $k$-th lexicographically smallest distinct substring".
- "Compute a sum over all distinct substrings", where the summand depends on the substring's length and its number of occurrences.
- "Find the longest substring that appears in at least two places", or "the longest common substring of two strings".
- "The text is fixed and the queries are substrings of it", which is the inverse of the pattern-matching setting.
- "The string is built online and queries are interleaved with appends", where a suffix array would have to be rebuilt.

The constraints that decide between the suffix automaton and its neighbors:

| Constraint | What it rules |
| --- | --- |
| One fixed string, many substring queries | The suffix automaton |
| One fixed string, queries about suffix order or longest common prefixes | The suffix array, which stores order directly |
| One text and a large dictionary of patterns | Aho-Corasick, which indexes the patterns |
| One pattern and one text | KMP, with a smaller constant and less memory |
| Every appending step is followed by a query | The suffix automaton, which is built online |
| Many strings whose total length is $L$ | A generalized suffix automaton over the concatenation |
| The alphabet is large or unknown | A sparse transition map, with a logarithmic lookup |
| The alphabet is a small fixed set | A dense table, one row per state |
| The answer needs the positions of every occurrence | A suffix array with range reporting, or end-position sets stored explicitly |
| The string is tiny | A hash set of substrings, which is shorter to write |

The row that is easiest to get wrong is the first one against the second. Both structures index a fixed string. The suffix automaton wins when the queries are "does this substring occur and how often", because the answer is one walk and one stored count. The suffix array wins when the queries are about order, because the sorted suffixes are the order, while the suffix automaton would need an extra traversal to enumerate substrings in lexicographic order.

## Naive approach

The direct solution inserts every substring into a hash set. It is correct, it is short, and it is the reference implementation for a differential test.

```cpp
std::unordered_set<std::string> seen;
for (int i = 0; i < n; ++i) {
    for (int j = i; j < n; ++j) {
        seen.insert(s.substr(i, j - i + 1));
    }
}
std::cout << seen.size() << '\n';
```

The number of insertions is $n(n+1)/2$, and each insertion copies a string of length up to $n$, so the character work is $\Theta(n^3)$ even though the number of distinct strings is only $\Theta(n^2)$. At $n = 10^5$ the table has billions of entries, and the program runs out of memory long before it runs out of time.

If the string is fixed and the only question is the number of distinct substrings, a suffix array gives a much better baseline. Sorting the suffixes and computing the longest common prefix array yields

```cpp
long long distinct = 1LL * n * (n + 1) / 2;
for (int i = 1; i < n; ++i) {
    distinct -= lcp[i];
}
```

This is $O(n \log n)$ time and $O(n)$ space, and it is a legitimate solution to the counting problem. Its weakness is the query model: counting the occurrences of a pattern needs a binary search over the suffix array plus the length of the matching range, and the longest common prefix array is a second structure to build and explain.

The third baseline answers occurrence queries by scanning. For every distinct substring, walk the text and count the matches, which costs $O(n)$ per substring and $O(n^3)$ overall. It is useful only as an oracle for strings of length at most ten.

The suffix automaton improves the count to $O(n)$ construction and $O(\lvert p \rvert)$ per occurrence query, without storing a single substring.

## Key insight

The insight is to group substrings by where they end.

For a nonempty substring $t$ of $s$, let $\operatorname{endpos}(t)$ be the set of positions where an occurrence of $t$ ends. Two substrings are **end-position equivalent** when their sets are equal. The equivalence classes are the states of the suffix automaton.

The grouping is useful because two strings with the same end positions behave identically under every extension. If $\operatorname{endpos}(x) = \operatorname{endpos}(y)$ and $c$ is a character, then

$$
\operatorname{endpos}(xc) = \{i + 1 : i \in \operatorname{endpos}(x),\; s[i+1] = c\},
$$

and the same formula holds for $y$. So $xc$ is a substring exactly when $yc$ is, and the two extensions land in the same class. A state can therefore carry one transition per character for the whole class, and the transition is well defined on classes rather than on individual strings.

The second half of the insight is that a class is a chain of suffixes. If two strings end at the same position, the shorter is a suffix of the longer. A class therefore contains a longest string and a set of its suffixes, and those suffixes have consecutive lengths. The state stores the longest length; the suffix link points to the next class down the chain, which is the longest proper suffix that has a different end-position set. The number of strings in the class is the difference of the two lengths.

The third half is the construction. When a new character $c$ is appended, the new substrings are exactly the suffixes of the new prefix. The algorithm walks up the suffix links from the previous whole string, adding a $c$-transition to every state that does not have one. If it reaches a state whose $c$-transition already exists, that transition points to a class $q$. When the length of $q$ is exactly one more than the length of the state, the new suffix belongs to $q$ and the walk stops. Otherwise $q$ contains strings that are too long to end at the new position, so $q$ has to split: a clone takes the shorter part, and both $q$ and the new state link to it.

That split is the only case that is not obvious, and it is the reason the state count stays linear: every clone removes a length interval from an existing class, and there can be at most $n-1$ clones.

## Visual intuition

Take $s = \texttt{abb}$. The finished automaton has five states. The table records the longest string of each class, the interval of lengths in the class, the suffix link, and the end positions.

| State | Longest string | Lengths in class | Suffix link | End positions  |
| ----- | -------------- | ---------------- | ----------- | -------------- |
| 0     | empty          | 0                | none        | all boundaries |
| 1     | `a`            | 1                | 0           | 0              |
| 2     | `ab`           | 2                | 4           | 1              |
| 3     | `abb`          | 2 to 3           | 4           | 2              |
| 4     | `b`            | 1                | 0           | 1, 2           |

The end positions are 0-indexed. State 3 is the interesting one. Its longest string is `abb`, and its class also contains `bb`, because both strings end only at position 2. The suffix link of state 3 goes to state 4, whose class is `b`. That is the longest proper suffix of `abb` with a different end-position set: `b` ends at positions 1 and 2, while `abb` ends only at 2.

The suffix links form a tree rooted at the initial state, drawn here with the class labels:

```text
0 (empty)
├── 1 (a)
└── 4 (b)
    ├── 2 (ab)
    └── 3 (abb, bb)
```

The transitions form a directed acyclic graph. Reading a string from state 0 follows the edges, and the state reached is the class of that string.

```text
0 --a--> 1
0 --b--> 4
1 --b--> 2
2 --b--> 3
4 --b--> 3
```

The clone appears while the third character is inserted. Before it, the string is `ab`, and the class of state 2 contains both `b` and `ab`, because both end only at position 1. When the second `b` arrives, `b` gains end position 2 but `ab` does not. The class splits: state 4 becomes the class of `b` alone, the root's `b`-transition is redirected to state 4, and state 2 keeps `ab` with a suffix link to state 4. The split is exactly the observation that `b` and `ab` no longer share their end positions.

Counting occurrences is a bottom-up pass over the suffix-link tree. Seed one unit at each state that represents a whole prefix: state 1 for `a`, state 2 for `ab`, state 3 for `abb`, and nothing at the clone. Then add each state's count to its suffix link, processing longer classes first.

| State processed | Count before | Receives                       | Count after |
| --------------- | ------------ | ------------------------------ | ----------- |
| 3               | 1            | nothing                        | 1           |
| 2               | 1            | nothing                        | 1           |
| 4               | 0            | 1 from state 3, 1 from state 2 | 2           |
| 1               | 1            | nothing                        | 1           |

The final counts are the sizes of the end-position sets: `a` and `ab` and `abb` occur once, `b` occurs twice, and `bb` occurs once. The distinct-substring count is $1 + 1 + 2 + 1 = 5$, which matches the enumeration `a`, `b`, `ab`, `bb`, `abb`.

## Formal model

Let $\Sigma$ be a finite alphabet, let $s$ be a string of length $n$ over $\Sigma$, and let $\varepsilon$ be the empty string. Positions are indexed from $0$, so $s[i]$ is the character at position $i$.

::: math definition Definition
For a nonempty substring $t$ of $s$, the **end-position set** is

$$
\operatorname{endpos}(t) = \{\, i : 0 \le i < n \text{ and } t \text{ ends at position } i \,\}.
$$

Two substrings $x$ and $y$ are **end-position equivalent**, written $x \equiv y$, when $\operatorname{endpos}(x) = \operatorname{endpos}(y)$.
:::

::: math definition Definition
The **states** are the equivalence classes of nonempty substrings under $\equiv$, plus one initial state for $\varepsilon$. For a state $v \ne \varepsilon$, the **longest length** $\operatorname{len}[v]$ is the maximum length of a string in the class, and the **suffix link** $\operatorname{link}[v]$ is the state of the longest proper suffix of the longest string of $v$ that is not in the class. The initial state has $\operatorname{len} = 0$ and no suffix link.
:::

::: math definition Definition
The **transition function** $\delta(v, c)$ is the state of the class containing $x c$, where $x$ is any string of $v$ and $x c$ is a substring of $s$. If no such substring exists, the transition is undefined. The automaton accepts every path that starts at the initial state, so its language is the set of all substrings of $s$.
:::

::: math lemma Lemma
If $\operatorname{endpos}(x) \cap \operatorname{endpos}(y) \ne \varnothing$, then one of $x$ and $y$ is a suffix of the other. In particular, if $x$ is a suffix of $y$, then $\operatorname{endpos}(y) \subseteq \operatorname{endpos}(x)$, and the equivalence classes are chains of suffixes.
:::

::: math proof Proof
If both strings end at the same position $i$, their last characters occupy the same index, and the shorter string is the suffix of the longer one ending at $i$. The containment follows because every occurrence of $y$ contains an occurrence of its suffix $x$ ending at the same position. Two strings in the same class are therefore suffix-related, and the class is totally ordered by length. $\square$
:::

::: math lemma Lemma
Let $v$ be a non-initial state and let $L$ be its longest string. The strings of $v$ are exactly the suffixes of $L$ whose lengths lie in the interval

$$
\operatorname{len}[\operatorname{link}[v]] + 1 \le \lvert t \rvert \le \operatorname{len}[v].
$$

The interval is nonempty, and the number of distinct strings in the class is $\operatorname{len}[v] - \operatorname{len}[\operatorname{link}[v]]$.
:::

::: math proof Proof
Every string of the class is a suffix of $L$ by the previous lemma, and it is no longer than $L$. If two suffixes of $L$ with lengths $a \le b$ share the end-position set of $L$, then every suffix with length between $a$ and $b$ also shares it, because its end-position set is sandwiched between the sets of the two. So the lengths form an interval. The suffix link points to the class of the longest proper suffix outside the interval, so the smallest length in the class is one more than the longest length of that link. $\square$
:::

::: math lemma Lemma
The transition function is well defined on classes. If $x \equiv y$ and $x c$ is a substring, then $y c$ is a substring, $x c \equiv y c$, and following the characters of any substring from the initial state ends in the class of that substring.
:::

::: math proof Proof
The formula for $\operatorname{endpos}(xc)$ in the previous section depends only on $\operatorname{endpos}(x)$ and $c$, so equal end-position sets produce equal sets after appending $c$. Induction on the length of a substring shows that reading its characters follows the transitions of its classes and ends in the class of the whole substring. Conversely, every transition follows a character that actually occurs after an occurrence of the class, so every path spells a substring. $\square$
:::

::: math lemma Lemma
A suffix automaton for a string of length $n \ge 2$ has at most $2n - 1$ states, and for $n \ge 3$ it has at most $3n - 4$ transitions.
:::

::: math proof Proof
Each extension creates one state for the new prefix and at most one clone. The prefix states are distinct, and a clone splits a class into two nonempty parts, so there are at most $n - 1$ clones and at most $2n - 1$ states. The transition bound is the standard edge count of the minimal automaton; the linear-time argument below needs only the state bound, because at most $2n$ states with 26 letters each already give at most $52n$ transitions. $\square$
:::

## Algorithm derivation

### Extending by one character

The automaton is built by a single loop over the characters of $s$. The variable `last` is the state of the whole prefix read so far, and `size` is the number of states allocated.

```cpp
struct State {
    int len = 0;
    int link = -1;
    std::array<int, 26> next;

    State() { next.fill(-1); }
};

std::vector<State> st(2 * n + 2);
std::vector<long long> cnt(2 * n + 2, 0);
int size = 1;
int last = 0;

for (char ch : s) {
    int c = ch - 'a';
    int cur = size++;
    st[cur].len = st[last].len + 1;
    cnt[cur] = 1;

    int p = last;
    while (p != -1 && st[p].next[c] == -1) {
        st[p].next[c] = cur;
        p = st[p].link;
    }

    if (p == -1) {
        st[cur].link = 0;
    } else {
        int q = st[p].next[c];
        if (st[p].len + 1 == st[q].len) {
            st[cur].link = q;
        } else {
            int clone = size++;
            st[clone].len = st[p].len + 1;
            st[clone].next = st[q].next;
            st[clone].link = st[q].link;
            cnt[clone] = 0;

            while (p != -1 && st[p].next[c] == q) {
                st[p].next[c] = clone;
                p = st[p].link;
            }
            st[q].link = clone;
            st[cur].link = clone;
        }
    }
    last = cur;
}
```

The first loop walks up the suffix links and installs the new transition wherever it is missing. Every state on that walk represents a suffix of the previous prefix, and appending $c$ turns it into a suffix of the new prefix, so the transition is genuinely new.

When the walk stops at a state $p$ that already has a $c$-transition, the target $q$ is the class of the string $x c$, where $x$ is the longest string of $p$. If $\operatorname{len}[q] = \operatorname{len}[p] + 1$, then $x c$ is the longest string of $q$ and the new prefix simply links to $q$. If not, $q$ also contains longer strings that do not end at the new position, so the class has to be split.

The clone receives the shorter part of $q$: length $\operatorname{len}[p] + 1$, the transitions of $q$, and the suffix link of $q$. The clone is not a prefix, so its occurrence counter starts at zero. The second loop redirects every transition that used to point to $q$ and whose source is on the suffix chain, because those transitions now belong to the shorter class. Finally, both $q$ and the new state link to the clone.

### Counting occurrences

Every state that is created as `cur` represents a whole prefix of $s$ and receives one unit. Clones receive nothing: a clone only splits an existing class, and its end positions are supplied by the new prefix state and by the states that link to it.

The suffix links form a tree whose parent is the link. For a state $v$, the end positions of $v$ are exactly the seed positions in the subtree of $v$: a prefix ending at position $i$ visits every suffix-link ancestor of its own state, and those ancestors are precisely the classes whose strings end at $i$. The counts are therefore computed by pushing every state's count to its link in decreasing order of length.

```cpp
std::vector<int> bucket(n + 1, 0);
for (int v = 1; v < size; ++v) ++bucket[st[v].len];
for (int i = 1; i <= n; ++i) bucket[i] += bucket[i - 1];

std::vector<int> order(size - 1);
for (int v = size - 1; v >= 1; --v) {
    order[--bucket[st[v].len]] = v;
}
for (int i = size - 2; i >= 0; --i) {
    int v = order[i];
    cnt[st[v].link] += cnt[v];
}
```

A counting sort by length avoids a comparison sort and keeps the pass linear. The order is valid because a suffix link always points to a strictly shorter string, so every child is processed before its parent in decreasing length.

### Distinct substrings and the reference query

The distinct-substring count is one sum over the states. State $v$ contributes every length in its interval, and the intervals of different states are disjoint because they are different equivalence classes.

```cpp
long long distinct = 0;
for (int v = 1; v < size; ++v) {
    distinct += static_cast<long long>(st[v].len - st[st[v].link].len);
}
```

The reference programs also answer one occurrence query: the number of occurrences of the lexicographically smallest nonempty substring. The smallest nonempty substring of a string is always its smallest character, because every substring starts with some character and a one-character string is smaller than every longer string that starts with the same character. If $c$ is that character, the transition from the initial state by $c$ reaches the class of $c$. The class has $\operatorname{len}[\operatorname{link}] = 0$, so its shortest member is $c$, and every member shares the end-position set. The count at that state is therefore the frequency of $c$.

```cpp
int smallest = 25;
for (char ch : s) smallest = std::min(smallest, ch - 'a');
int target = st[0].next[smallest];
std::cout << distinct << '\n' << cnt[target] << '\n';
```

### Why the build is linear

The first loop installs a transition only when it was missing, so its total number of iterations over the whole build is bounded by the number of transitions, which is $O(n)$. The second loop redirects a transition only when a class splits, and after a transition from $p$ by $c$ points to a clone of length $\operatorname{len}[p] + 1$, that transition can never be redirected again: a later split would need a target longer than $\operatorname{len}[p] + 1$, and the current target is already the shortest possible class for that extension. Each transition is therefore redirected at most once.

Copying the transition row of $q$ into a clone costs 26 operations, and there are at most $n - 1$ clones, so the cloning work is $O(26n)$. The counting sort and the propagation are $O(n)$. With a fixed alphabet the whole build is $O(n)$; with the 26 letters written explicitly it is $O(26n)$.

## Step-by-step execution

Build the automaton for $s = \texttt{abb}$ one character at a time. The trace records the new state, the suffix-link walk, and whether a clone was needed.

| Step | Character | New state | Walk | Existing target | Clone | Last after |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | `a` | 1 | 0 has no `a`, set it | none | none | 1 |
| 1 | `b` | 2 | 1 has no `b`, then 0 has no `b` | none | none | 2 |
| 2 | `b` | 3 | 2 has no `b`, set it; 0 has `b` | 2 | 4 | 3 |

At step 2 the walk stops at the root because the root already has a `b`-transition to state 2. The new state 3 has length 3, while state 2 has length 2 and its longest string `ab` does not end at position 2. The class of state 2 therefore splits. The clone gets length $\operatorname{len}[0] + 1 = 1$, copies the transitions of state 2, and takes its suffix link. The root's `b`-transition is redirected to the clone, and states 2 and 3 both link to the clone.

The resulting arrays are:

| State | `len` | `link` | `next[a]` | `next[b]` | Seed count |
| ----- | ----- | ------ | --------- | --------- | ---------- |
| 0     | 0     | none   | 1         | 4         | 0          |
| 1     | 1     | 0      | none      | 2         | 1          |
| 2     | 2     | 4      | none      | 3         | 1          |
| 3     | 3     | 4      | none      | none      | 1          |
| 4     | 1     | 0      | none      | 3         | 0          |

The counting sort groups the states by length: length 1 holds states 1 and 4, length 2 holds state 2, and length 3 holds state 3. Processing them from longest to shortest:

| State | `cnt` before | Link | `cnt` after the addition |
| ----- | ------------ | ---- | ------------------------ |
| 3     | 1            | 4    | `cnt[4] = 1`             |
| 2     | 1            | 4    | `cnt[4] = 2`             |
| 4     | 2            | 0    | `cnt[0] = 2`             |
| 1     | 1            | 0    | `cnt[0] = 3`             |

The useful counts are `cnt[1] = 1`, `cnt[2] = 1`, `cnt[3] = 1`, and `cnt[4] = 2`. They match the end-position sets in the visual table. The distinct count is $(1-0) + (2-1) + (3-1) + (1-0) = 5$.

A few queries against the same automaton:

| Query | Path                           | State | Answer            |
| ----- | ------------------------------ | ----- | ----------------- |
| `a`   | `0 --a--> 1`                   | 1     | occurs once       |
| `b`   | `0 --b--> 4`                   | 4     | occurs twice      |
| `ab`  | `0 --a--> 1 --b--> 2`          | 2     | occurs once       |
| `bb`  | `0 --b--> 4 --b--> 3`          | 3     | occurs once       |
| `abb` | `0 --a--> 1 --b--> 2 --b--> 3` | 3     | occurs once       |
| `ba`  | no transition                  | none  | occurs zero times |

The query `bb` is the one that shows why the clone matters. Without the split, state 2 would still contain both `b` and `ab`, and the path for `bb` would end in a state whose suffix chain no longer contains the class of `b`. The occurrence count of `bb` would survive by accident, but the count of `ab` would be inflated, and the distinct-substring sum would lose the string `b`.

## Correctness proof

::: math theorem Theorem
After the construction finishes, the automaton has the following properties.

1. The paths from the initial state spell exactly the substrings of $s$.
2. The distinct nonempty substrings number $\sum_{v \ne 0}(\operatorname{len}[v] - \operatorname{len}[\operatorname{link}[v]])$.
3. After the propagation, $\operatorname{cnt}[v] = \lvert \operatorname{endpos}(v) \rvert$ for every state $v$.
4. The transition from the initial state by the smallest character of $s$ reaches a state whose count is the number of occurrences of the lexicographically smallest nonempty substring.
:::

::: math proof Proof
**Part 1.** The proof is an induction on the prefix length. Before any character is read, the only path is the empty one and the only substring of the empty prefix is the empty string. Suppose the automaton for the prefix $s[0..i-1]$ is correct, and append $c = s[i]$. Every new substring is a suffix of the new prefix. The first loop adds a $c$-transition to every state on the suffix chain that lacks one, so every new suffix has a path. If the walk reaches a state $p$ with an existing transition to $q$ and the length condition holds, the new suffix is the longest string of $q$, and linking the new state to $q$ keeps the class intervals correct. If the length condition fails, the strings of $q$ longer than $\operatorname{len}[p] + 1$ do not end at the new position, so they form a class of their own; the clone takes the shorter part, the redirect loop moves every transition that belonged to the shorter part, and the two links are set to the clone. This is exactly the split required by the definition, and no other class changes. By induction, part 1 holds for the whole string.

**Part 2.** By Lemma 2, the strings of state $v$ are the suffixes of its longest string with lengths in the interval from $\operatorname{len}[\operatorname{link}[v]] + 1$ to $\operatorname{len}[v]$. There are $\operatorname{len}[v] - \operatorname{len}[\operatorname{link}[v]]$ of them. The classes partition the nonempty substrings, because every substring belongs to exactly one end-position equivalence class. Summing the interval sizes over all states therefore counts every distinct substring exactly once.

**Part 3.** A state created as a prefix state is seeded with 1 at the position where that prefix ends. A clone is seeded with 0, because its end positions are already accounted for by the new prefix state and by the states that link to it after the split; the clone adds no seed of its own. In the suffix-link tree, the descendants of a state $v$ are the classes whose longest strings have $v$'s longest string as a suffix. A prefix ending at position $i$ contributes to exactly the states on the suffix-link chain of its own state, which are exactly the states whose strings end at $i$. The decreasing-length pass adds each subtree to its parent, so the final count at $v$ is the number of prefix positions in the subtree, which is $\lvert \operatorname{endpos}(v) \rvert$.

**Part 4.** The lexicographically smallest nonempty substring is the smallest character $c$ of $s$, as argued in the derivation. The transition from the initial state by $c$ exists because $c$ occurs. Its target $v$ has $\operatorname{len}[\operatorname{link}[v]] = 0$, so the class interval starts at length 1, and the only string of length 1 in the class is $c$. All strings in the class share the end-position set, so $\operatorname{cnt}[v] = \lvert \operatorname{endpos}(c) \rvert$, which is the number of occurrences of $c$. $\square$
:::

## Complexity analysis

| Phase                              | Cost                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| Extending by one character         | Amortized $O(26)$ with a dense row, plus $O(26)$ per clone |
| Whole construction                 | $O(26n)$ time and $O(26n)$ space                           |
| Counting sort by length            | $O(n)$ time and $O(n)$ space                               |
| Propagating the occurrence counts  | $O(n)$ time                                                |
| Distinct-substring sum             | $O(n)$ time                                                |
| Occurrence query for a pattern $p$ | $O(\lvert p \rvert)$ time                                  |
| $k$-th substring walk              | $O(n)$ preprocessing and $O(n)$ worst-case walk            |

The space is dominated by the transition table. With 26 letters per state and at most $2n$ states, the table holds about $52n$ integers. For $n = 10^5$ that is about $5.2 \cdot 10^6$ integers, or 20.8 megabytes at four bytes each, plus the length, link, count and order arrays. For $n = 10^6$ it is about 208 megabytes, which fits a 512-megabyte limit but not a 128-megabyte one.

The alphabet factor is a constant but it is not free. A sparse representation stores only the transitions that exist, follows suffix links during a query when an edge is absent, and uses a hash map or a sorted edge list per state. The space drops to $O(n)$ states plus $O(n)$ transitions, while a query becomes $O(\lvert p \rvert \log \sigma)$ or $O(\lvert p \rvert)$ amortized with a two-pointer walk. The build cost is $O(n \log \sigma)$ with a map and $O(n)$ expected with a hash map. This is the right trade for a large alphabet or a tight memory limit.

The state and transition bounds are what make the representation linear. There are at most $2n - 1$ states for $n \ge 2$, at most $3n - 4$ transitions for $n \ge 3$, and the counting sort and the propagation each visit every state once. No phase is allowed to iterate over the substrings, because there are $\Theta(n^2)$ of them.

The $k$-th substring query needs a second dynamic program, described in Problem 2. Its values count paths and can reach $n(n+1)/2$, so they are stored in 64 bits. If $k$ itself can be larger than $2^{63} - 1$, the path counts are capped at $k$ during the computation; the reference problems stay well below that limit.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Fixed string, count distinct substrings | A suffix automaton, or a suffix array with the prefix-sum formula |
| Fixed string, many occurrence queries | A suffix automaton, one walk and one count per query |
| Fixed string, $k$-th smallest substring | A suffix automaton with a path-counting dynamic program |
| Fixed string, longest repeated substring | A suffix automaton, or a suffix array with the longest-common-prefix maximum |
| Two strings, longest common substring | A suffix automaton of one string, scan the other |
| Suffix order, longest common prefixes, range queries | A suffix array, which stores the order directly |
| One text, a large set of patterns | Aho-Corasick, which indexes the patterns |
| One pattern, one text | KMP, with less code and less memory |
| Online appends with interleaved queries | A suffix automaton, which is built incrementally |
| Many strings, total length $L$ | A generalized suffix automaton over the concatenation |
| A large or unbounded alphabet | A sparse transition map |
| Need every occurrence position, not just the count | A suffix array with range reporting, or explicit end-position sets |

The first two rows are the common case. The suffix automaton is the better fit when the query is "how many times", because the answer is stored at the state and the suffix-link tree is already built. The suffix array is the better fit when the query is "in what order", because the sorted suffixes are the order; enumerating substrings in lexicographic order in a suffix automaton is possible, but it needs a traversal and a path-counting array.

The choice against Aho-Corasick is a choice about which side is fixed. Aho-Corasick indexes the patterns and scans the text, so it wins when the dictionary is large and the text is read once. The suffix automaton indexes the text and walks the pattern, so it wins when the text is fixed and the patterns are the queries.

The generalized suffix automaton handles many strings by resetting `last` to the initial state before each string. The state count is bounded by twice the total length, and the occurrence counts need one seed per prefix of each string; a clone still receives zero. A separator character between strings is an alternative, but it adds states and must be excluded from the answers.

When the alphabet is large, the dense row becomes the bottleneck rather than the asymptotics. Coordinate compression of the characters that actually occur restores a small alphabet, and a sparse map avoids the compression step. For a string of Chinese characters or arbitrary Unicode, the sparse map is the only practical choice.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal and JavaScript. They implement the same contract.

- The only input line holds a nonempty string of lowercase Latin letters.
- The first output line holds the number of distinct nonempty substrings.
- The second output line holds the number of occurrences of the lexicographically smallest nonempty substring.

The second query is a small exercise in reading the automaton. The lexicographically smallest substring is the smallest character $c$, and the transition from the initial state by $c$ reaches a class whose shortest member is $c$. All members of the class share the end-position set, so the stored count is the frequency of $c$. For `ababa` the program prints `9` and `3`: there are nine distinct substrings, and the smallest one, `a`, occurs three times.

Every version stores the transitions with 26 entries per state, seeds each prefix state with one, gives every clone a zero, counting-sorts the states by length, propagates the counts in decreasing length, and sums the length differences. C, C++, Java and Pascal use a signed 64-bit integer for the distinct count. Python uses an arbitrary-precision integer. JavaScript stores the counts in 32-bit integers, which suffice because an occurrence count is at most $n$, and uses `BigInt` for the distinct count.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and are compiled and run by the same validation as the other four.

| Language   | File                    | Transition storage     | Distinct count      |
| ---------- | ----------------------- | ---------------------- | ------------------- |
| C          | `c/program.c`           | flat `int` array       | `long long`         |
| C++17      | `cpp17/program.cpp`     | `std::array` per state | `long long`         |
| Java       | `java/Main.java`        | flat `int` array       | `long`              |
| Python     | `python/program.py`     | flat list              | arbitrary precision |
| Pascal     | `pascal/program.pas`    | flat dynamic array     | `Int64`             |
| JavaScript | `javascript/program.js` | `Int32Array`           | `BigInt`            |

The sources are under `implementations/strings/suffix-automaton/`, with one directory per language and the source file named in the manifest. The manifest carries the time and space of every variant, its input and output contract, and the verification status.

## Recursion decision

The construction is iterative and should stay that way. The suffix-link walk in the extension loop can take $n$ steps for a string of one repeated character, and a recursive formulation of the walk would use one stack frame per step and overflow the default stack long before reaching the end.

The counting pass has the same constraint for a different reason. The suffix-link tree can be a path of $n$ states, so a recursive depth-first traversal of the tree has depth $n$. The decreasing-length order replaces the traversal entirely: every link points to a strictly shorter string, so sorting the states by length gives a topological order of the tree, and one array iteration is enough.

The $k$-th substring walk is also written iteratively. A recursive version follows a path of length up to $n$, which is again a stack overflow on a string of one repeated character.

| Language   | Practical recursion depth            | Recommendation                   |
| ---------- | ------------------------------------ | -------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative walks and length order |
| Java       | About $10^4$ frames                  | Iterative walks and length order |
| Python     | The interpreter limit of 1000        | Iterative walks and length order |
| Pascal     | The operating system stack           | Iterative walks and length order |
| JavaScript | About $10^4$ frames                  | Iterative walks and length order |

Recursion is acceptable only in the brute-force baseline, where the string is short enough that the depth is irrelevant.

## Implementation walkthrough

Five details decide whether the implementation is correct.

**The clone's counter is zero.** A clone is created from an existing class and gets no seed of its own. Its end positions are supplied by the new prefix state and by the states that link to it, so seeding the clone counts those positions a second time.

**The clone's length.** The clone takes $\operatorname{len}[p] + 1$, not $\operatorname{len}[q]$. The length is the length of the suffix that just became a member of the shorter class. Using $\operatorname{len}[q]$ makes the clone a duplicate of $q$ and leaves the class interval empty.

**The redirect condition.** The second loop runs while the transition from $p$ by $c$ is exactly $q$. A loop that redirects every transition of $p$ destroys the transitions that point to other classes and silently changes the language.

**The propagation order.** The counts must be pushed from longer states to shorter states. Insertion order is not a valid order, because a clone is created after states that may link to it, and a state can link to a state that was created earlier or later. The counting sort by length is the order that the suffix links guarantee.

**The distinct count is 64-bit.** The answer for $n = 10^5$ can reach $5 \cdot 10^9$, which overflows a 32-bit signed integer. The sum of the length differences is the place to use `long long`, `long`, `Int64` or `BigInt`.

A compact version of the critical clone block:

```cpp
int q = st[p].next[c];
if (st[p].len + 1 == st[q].len) {
    st[cur].link = q;
} else {
    int clone = size++;
    st[clone].len = st[p].len + 1;
    st[clone].next = st[q].next;
    st[clone].link = st[q].link;
    cnt[clone] = 0;
    while (p != -1 && st[p].next[c] == q) {
        st[p].next[c] = clone;
        p = st[p].link;
    }
    st[q].link = clone;
    st[cur].link = clone;
}
```

The two assignments at the end are easy to reverse. Both $q$ and the new state must link to the clone, because the clone is now the class of the shorter suffix that both of them share. Setting only one of them leaves the other class pointing at a state whose interval starts too low, and the occurrence counts of the shorter substrings become wrong.

For multiple test cases, every array has to be reset: the transition rows, the lengths, the links, the counts, the order and the bucket array. Rebuilding the whole automaton per case is simpler and is the safer choice when the total input is small.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Seeding a clone with one | Occurrence counts are too large, because the clone is counted twice | Set the clone's count to zero |
| Summing the state lengths for distinct substrings | Every class contributes its longest length instead of its interval size | Sum `len[v] - len[link[v]]` |
| Setting `link[cur] = q` without checking the length condition | The class interval of `q` becomes inconsistent and suffixes are lost | Clone when `len[p] + 1 < len[q]` |
| Giving the clone length `len[q]` | The clone duplicates `q` and the shorter class is empty | Use `len[p] + 1` |
| Propagating in insertion order | Counts reach parents before all children and are undercounted | Counting-sort by length and iterate downward |
| Using a 32-bit distinct count | The sum overflows at $n \approx 65536$ | Use 64 bits or arbitrary precision |
| Redirecting every transition on the suffix chain | Transitions to other classes are destroyed | Redirect only while the target is `q` |
| Forgetting to copy `q`'s transitions into the clone | The clone has no outgoing edges, so longer substrings disappear | Copy the whole row before redirecting |
| Assuming the state reached from the root by `c` has length 1 | The class may also contain longer strings, although its count is still the frequency of `c` | Identify the class by `len[link[v]] = 0`, and read its count |
| Querying a missing transition | The program reads index `-1` | Check for absence and answer zero |

### Why this fails: the clone that is counted

Take $s = \texttt{abb}$ and seed the clone at state 4 with one instead of zero. The seed counts are then state 1: 1, state 2: 1, state 3: 1, state 4: 1. The decreasing-length pass adds state 3 to state 4 and state 2 to state 4, so the count of state 4 becomes three.

The correct count of `b` in `abb` is two, at positions 1 and 2. The extra unit is the phantom end position that the clone was never supposed to own. The distinct-substring sum is unaffected, because it reads lengths rather than counts, so the bug survives the first output line and appears only in the second. That is exactly the kind of failure that a test on a string with a clone must catch.

The second classic failure is skipping the clone when the length condition fails. On the same string, linking the new state directly to state 2 gives the suffix chain `abb`, `ab`, and then the root, so `bb` loses its suffix `b`. The distinct count becomes four instead of five, missing `b` as a separate class, and the count of `ab` becomes two instead of one. Both output lines are wrong, and the error is visible on a three-character string.

## Variants and extensions

- **Generalized suffix automaton.** Reset `last` to the initial state before each string, keep one seed per prefix, and clone counts at zero. This indexes a set of strings with the same state bound in the total length.
- **End-position sets.** Store a sorted list or a balanced tree of positions at every state and merge the children's sets into the parent with small-to-large merging. The total size is $O(n \log n)$ in the worst case, and the structure answers "where does this substring occur".
- **Suffix-link tree queries.** The suffix links form a tree. An Euler tour plus a Fenwick tree answers subtree sums, which become occurrence counts for a class or a group of classes.
- **$k$-th substring.** A path-counting dynamic program over the transitions, as in Problem 2, finds the $k$-th distinct substring in lexicographic order in $O(n)$ preprocessing.
- **Longest common substring of two strings.** Build the automaton of the first string, then scan the second while maintaining the current state and the length of the current match. A missing transition follows suffix links, which is the same amortized walk as the build.
- **Shortest substring occurring at least $k$ times.** Binary search the length and count the states whose end-position set has size at least $k$ and whose interval contains that length, or scan the states directly.
- **Suffix automaton of the reversed string.** It is the suffix tree of the original string in disguise, which is why the automaton is also called the directed acyclic word graph.
- **Sparse transitions.** Store a sorted edge list or a hash map per state. The state count stays linear, the memory drops, and queries pay a logarithmic factor for the lookup.
- **Alphabet compression.** Map the characters that occur to $0, 1, \ldots, \sigma - 1$ before building, which shrinks the dense table and improves the cache behavior.
- **Online occurrence queries with link-cut trees.** A dynamic tree over the suffix links supports adding a character and querying the end-position count of a state without rebuilding.

## Contest strategy

1. Decide which side is fixed. A fixed text with substring queries calls for a suffix automaton or a suffix array; a fixed dictionary with a long text calls for Aho-Corasick.
2. Estimate the memory before writing the dense table. At $n = 10^5$ it is about 21 megabytes, at $n = 10^6$ about 208 megabytes, and a 128-megabyte limit forces a sparse representation.
3. Build by extending characters in one pass and never store a substring. The moment a solution stores `s.substr(i, j)`, it has lost the memory argument.
4. Seed each prefix state with one and every clone with zero, then counting-sort by length and propagate downward. This is the only counting pass.
5. Use a 64-bit accumulator for the distinct-substring sum and for sums over all substrings. The bounds are quadratic and cubic, not linear.
6. For an occurrence query, walk the pattern from the initial state; if an edge is missing, the answer is zero; otherwise read the count at the final state.
7. For a $k$-th substring query, compute the number of strings reachable from each state, then walk the characters in alphabetical order and subtract whole blocks until $k$ falls inside one.
8. Test the four small shapes explicitly: a one-character string, a string with all characters equal, a string with all characters distinct, and a string with a clone such as `abb`. Check both output lines against a brute force.
9. Differential-test against the hash-set baseline on a thousand random strings of length at most ten. The baseline shares no code, so a disagreement localizes the bug immediately.
10. If the problem has multiple test cases, rebuild the automaton per string unless the total length is bounded and a single generalized automaton is clearly intended.

## Worked problems

### Problem 1: counting the distinct substrings

**Restatement.** Given a string of length $n \le 10^5$ over the lowercase letters, print the number of distinct substrings. This is CSES "Distinct Substrings".

**Naive baseline.** Insert every substring into a hash set. There are $n(n+1)/2$ insertions and each copies a string of length up to $n$, so the character work is $\Theta(n^3)$ and the memory is $\Theta(n^2)$.

**Insight.** The states of the suffix automaton partition the distinct substrings, and each state contributes exactly the lengths in its class interval.

**Derivation.** Build the automaton in one pass. For every non-initial state $v$, add $\operatorname{len}[v] - \operatorname{len}[\operatorname{link}[v]]$ to a 64-bit accumulator. No substring is stored or enumerated.

**Correctness.** By Lemma 2 the strings of state $v$ are exactly the suffixes of its longest string with lengths in the interval, and there are $\operatorname{len}[v] - \operatorname{len}[\operatorname{link}[v]]$ of them. The classes partition the nonempty substrings, so the sum counts each distinct substring once. This is part 2 of the correctness theorem.

**Complexity.** $O(26n)$ time and $O(26n)$ space with a dense table, or $O(n)$ time with a sparse table under a hash map.

**Common wrong approach.** Summing $\operatorname{len}[v]$ over the states counts the longest string of every class and misses every shorter member of every interval. The answer for `abb` becomes $1 + 2 + 3 + 1 = 7$ instead of $5$, and the error grows with the number of classes.

### Problem 2: the $k$-th smallest substring

**Restatement.** Given a string of length $n \le 10^5$ and an integer $k$ with $1 \le k \le n(n+1)/2$, print the $k$-th smallest distinct substring in lexicographic order. This is CSES "Substring Order I".

**Naive baseline.** Enumerate all distinct substrings, sort them, and index the result. There are $\Theta(n^2)$ strings, so the memory alone is prohibitive at the limit.

**Insight.** Every distinct substring is a unique path from the initial state. Let $f[v]$ be the number of paths that start at $v$, counting the zero-length path, so that

$$
f[v] = 1 + \sum_{\delta(v, c) \text{ defined}} f[\delta(v, c)].
$$

The one counts the path that stops at $v$. For a non-initial state reached by a prefix $x$, stopping spells $x$; the initial state is never a stopping point in the walk below. Each outgoing edge starts a block of $f[\delta(v, c)]$ strings that share the next character.

**Derivation.** The transitions always go to a state of strictly larger length, so decreasing length order computes $f$ after all of its successors. Then start at the initial state with the required $k$. For each character in alphabetical order, let $u = \delta(v, c)$. If $k > f[u]$, subtract $f[u]$ and try the next character. Otherwise append $c$; if $k = 1$, stop; else subtract one for the string that ends here and move to $u$.

**Correctness.** Lexicographic order groups all strings by their first character, and within a group by the remainder. The block of strings that begin with $c$ has size $f[\delta(v, c)]$, because every one of them is $c$ followed by a path from $\delta(v, c)$, and the zero-length path accounts for $c$ itself. Subtracting whole blocks preserves the rank of $k$ inside the chosen block, and the walk stops at the string of rank $k$. This is a standard order-statistic argument on a trie; the automaton is a deterministic acyclic graph in which every distinct substring is a unique path, so the same argument applies.

**Complexity.** $O(26n)$ time and space to build, $O(n)$ to compute the path counts, and $O(n)$ for the walk in the worst case. The counts reach $n(n+1)/2$, so they are stored in 64 bits.

**Common wrong approach.** Forgetting the plus one in $f[v]$ makes every block one string too small, so the answer is shifted by the number of prefixes on the path. Another common error is subtracting one before checking $k = 1$, which skips the string that ends at the current state.

### Problem 3: ordering substrings with multiplicity

**Restatement.** Given a string of length $n \le 10^5$ and an integer $k$ with $1 \le k \le n(n+1)/2$, order all substrings of $s$ lexicographically, counting equal substrings once per occurrence, and print the $k$-th one. This is CSES "Substring Order II".

**Naive baseline.** Generate all $n(n+1)/2$ substrings with multiplicity, sort them, and index the result. The generation and the sort are both $\Theta(n^2 \log n)$ in the worst case, and the list alone is quadratic in memory.

**Insight.** The path-counting dynamic program of Problem 2 counts each distinct string once. Counting occurrences instead weights every string by $\operatorname{cnt}[v]$, the number of times it occurs. At a state $v$ reached by a prefix $x$, the multiset of strings that are $x$ or have $x$ as a prefix has

$$
\operatorname{ways}[v] = \operatorname{cnt}[v] + \sum_{\delta(v, c) \text{ defined}} \operatorname{ways}[\delta(v, c)]
$$

entries. The first term counts the $\operatorname{cnt}[v]$ copies of $x$ itself. Every copy is the same string, and $x$ is a prefix of all its proper extensions, so those copies occupy the first $\operatorname{cnt}[v]$ positions of the block. The value at the initial state is never read by the walk; only the values of its children are used.

**Derivation.** Build the automaton and propagate the occurrence counts over the suffix-link tree as usual. Compute `ways` by decreasing length, because every transition goes to a longer state. Then start at the initial state. For each character in alphabetical order, let $u = \delta(v, c)$. If $k > \operatorname{ways}[u]$, subtract the whole block and try the next character. Otherwise append $c$: if $k \le \operatorname{cnt}[u]$, the answer is the current prefix, because all its copies are identical and consecutive; otherwise subtract $\operatorname{cnt}[u]$ and move to $u$ with the remaining rank.

**Correctness.** Lexicographic order groups the strings by their first character, and a string comes before all of its proper extensions. The block of entries that begin with $c$ has size $\operatorname{ways}[\delta(v, c)]$, by the same argument as Problem 2 with the multiplicity added. Inside that block, the $\operatorname{cnt}[u]$ copies of the string that stops at $u$ come first, and the continuations follow in the same order. Subtracting a block that does not contain rank $k$ and descending into the one that does therefore preserves the rank, and the walk stops at the $k$-th entry. The sample `baabaa` with $k = 10$ gives `ab`.

**Complexity.** $O(26n)$ time and space to build, $O(n)$ for the counts and the weighted path counts, and $O(n)$ for the walk. The weights reach $n(n+1)/2$, so they are stored in 64 bits.

**Common wrong approach.** Reusing the distinct path counts of Problem 2 ignores the multiplicity and returns the $k$-th distinct substring instead. Another error is descending into $u$ without first subtracting $\operatorname{cnt}[u]$, which double-counts the copies of the string that stops at the current state.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks about a fixed text or a fixed dictionary, then whether the queries are about existence, count, order or a sum over all substrings.
2. **Direct application.** Build the automaton for `abb` by hand, check the clone, and verify the five distinct substrings and the occurrence counts against the table in this article.
3. **Implementation.** Write the extension loop, the counting sort, and the propagation from memory. Test on `a`, `aaaa`, `abcd`, and `abb`, comparing both output lines with a brute force.
4. **Adaptation.** Answer an occurrence query by walking a pattern, and answer the $k$-th substring query with the path-counting dynamic program. Check the CSES samples.
5. **Combination.** Solve the $k$-th substring problem both without multiplicity and with multiplicity, and confirm that the second walk reduces to the first when every occurrence count is replaced by one.
6. **Transfer.** Recognize the suffix-link tree inside another problem: subtree sums for occurrence counts, an Euler tour for range queries, or a dynamic program whose state is a class. The automaton is often a component rather than the whole solution.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is an end-position set, and when are two substrings in the same state? (Formal model)
2. Why do all strings in a state share the same transitions, and why is the transition function well defined on classes? (Key insight, Lemma 3)
3. What does the suffix link point to, and what does the class interval represent? (Formal model, Lemma 2)
4. Why does a state contribute `len[v] - len[link[v]]` distinct substrings? (Algorithm derivation)
5. When does the extension need a clone, and what length does the clone receive? (Algorithm derivation)
6. Why does a clone start with a count of zero? (Algorithm derivation, Implementation walkthrough)
7. Why must the occurrence counts be propagated in decreasing length order? (Algorithm derivation)
8. What is the state bound, and where does the factor of two come from? (Complexity analysis)
9. Why is the lexicographically smallest substring the smallest character, and why is its count the count at the root's transition? (Correctness proof)
10. How does the $k$-th substring walk use the path-counting array? (Worked problems, Problem 2)
11. What is the smallest string on which seeding a clone gives a wrong answer, and which output line exposes it? (Common mistakes)
12. When is a suffix array a better choice than a suffix automaton? (Algorithm selection)

## Further reading

- The pattern-matching algorithm that computes the longest border of every prefix is in [Knuth-Morris-Pratt](/algorithms/strings/kmp), and its failure function is the one-pattern version of a suffix link.
- The structure that stores common prefixes explicitly is in [the trie](/algorithms/strings/trie); a suffix automaton can be read as a trie of all substrings with shared suffixes.
- The sorted-suffix alternative, with the longest-common-prefix array and its counting formula, is in [the suffix array](/algorithms/strings/suffix-array).
- The inverse indexing problem, where the dictionary is fixed and the text is scanned, is in [Aho-Corasick](/algorithms/strings/aho-corasick).
- The subject index places this technique beside the other string algorithms, in [the strings](/algorithms/strings/).
- The amortized argument that bounds the suffix-link walks is in [complexity analysis](/algorithms/foundations/complexity).
- The tree traversal that visits a state after all of its children is in [depth-first search](/algorithms/graphs/dfs), and the same tree is traversed iteratively here.
- The technique for merging the end-position sets of two states without quadratic copying is in [small-to-large merging](/algorithms/trees/small-to-large-merging).
- The range-sum structure that answers subtree queries over the suffix-link tree is in [the Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The probabilistic alternative for substring equality, which is easier to write but has collision risk, is in [rolling hash](/algorithms/strings/rolling-hash).
- The structure that stores palindromic substrings rather than all substrings is in [the palindrome tree](/algorithms/strings/palindrome-tree).
