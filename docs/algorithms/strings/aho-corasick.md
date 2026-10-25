---
id: strings.aho-corasick
title: Aho-Corasick
summary: Find every occurrence of a whole dictionary of patterns in one pass over a text, by adding failure links to a trie so that the search never backs up.
division: [gold, platinum]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords: [aho-corasick, multi-pattern matching, trie, failure link, automaton, dictionary matching]
prerequisites:
    required: [strings.trie, strings.kmp, foundations.complexity]
    recommended: [graphs.bfs, foundations.recursion]
complexity:
    time: "O(26L + n) for a lowercase alphabet"
    space: "O(26L) for the transitions, where L is the total pattern length"
assumptions:
    - The patterns and the text are over a small fixed alphabet, so a node can carry one transition per symbol.
    - The whole dictionary is known before the text is scanned, so the automaton can be built once and reused.
    - The total length of the patterns fits in memory with 26 transition entries per node.
implementations: strings.aho-corasick
reviewed: false
---

<AlgorithmSummary algorithm="strings.aho-corasick" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="strings.aho-corasick" />

## At a glance

Aho-Corasick finds every occurrence of every pattern in a dictionary inside one text, in a single left-to-right pass. For patterns whose total length is $L$ and a text of length $n$, the cost is $O(26L + n)$ over a lowercase alphabet, and the memory is $O(26L)$ for the transitions.

The algorithm is two ideas stacked. The first is a trie, which stores the patterns and lets the search follow one edge per text character as long as the current suffix is a prefix of some pattern. The second is a failure link per node, which says which shorter prefix is still matched when the next character has no edge. The failure link is exactly the prefix function of Knuth-Morris-Pratt, generalized from one pattern to a whole set.

The whole method fits in one sentence: **when the next character breaks the current match, do not start over, because the suffix that is still a prefix of some pattern is recorded in the failure link.**

Aho-Corasick is the answer to "which of these words appear in that text", not to "does this one word appear". It scales with the total size of the dictionary rather than with the number of patterns times the length of the text, and that is what makes a dictionary of $10^5$ words usable.

## Problem motivation

A mail gateway carries a dictionary of $10^5$ banned phrases whose total length is $10^6$ characters, and it must classify a message of $10^6$ characters. For every phrase it needs the number of occurrences, because a phrase that appears three times is a stronger signal than a phrase that appears once.

Running KMP once per phrase is the obvious exact solution. It costs $O(kn + L)$ for $k$ phrases, which is about $10^{11}$ character comparisons here. The naive trie scan is no better: it starts a fresh walk at every text position and can follow a long pattern all the way to its end, so it costs $O(n \cdot m_{\max})$, which is $10^{11}$ when one phrase is long.

Aho-Corasick reads every text character once and performs one transition for it. The $26$ transitions per node are the price: building the automaton costs $O(26L)$, which is $2.6 \times 10^7$ operations for the dictionary above, and the scan costs $10^6$. The difference between $10^{11}$ and $3 \times 10^7$ is the difference between a time limit and no time limit.

The same structure answers the harder version in which the dictionary changes. If words arrive and leave between queries, a static automaton has to be rebuilt or grouped, which is the subject of the third worked problem.

## Recognition patterns

Aho-Corasick is the right tool when the statement contains some of these phrases.

- "Given a set of patterns and a text", "which of these words occur", "count the occurrences of each word", "how many keywords appear".
- "The total length of the patterns is at most $L$", with $L$ around $10^5$ or $10^6$, and a text of a similar size.
- "For every pattern, print the number of its occurrences", including overlapping occurrences.
- "A dictionary", "a set of forbidden words", "a list of signatures", where the dictionary is fixed and the text is long.
- "The answer counts each pattern separately", so the output is one number per pattern rather than one number for the whole text.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One pattern, one text | KMP, with a much smaller constant |
| Many patterns whose total length is $L \le 10^6$ | Aho-Corasick |
| The number of patterns is large but each one is short | Aho-Corasick, because the trie shares their prefixes |
| The alphabet is small and fixed | A dense transition table, one row of 26 per node |
| The alphabet is large or unknown | A sparse transition map, with a logarithmic lookup |
| The text is fixed and the queries are arbitrary substrings | A suffix array or a suffix automaton, not Aho-Corasick |
| The question is about prefixes of the stored words | A trie alone, with no failure links |
| Words are inserted and deleted online | Aho-Corasick plus rebuilding or binary grouping |
| The patterns contain wildcards or mismatches are allowed | A different technique, such as bitset matching or edit-distance DP |

The row that catches people is the one about a fixed text. Aho-Corasick indexes the patterns, not the text. If the text never changes and the queries are "how many times does this pattern occur", a suffix automaton or a suffix array answers each query without rebuilding anything, while Aho-Corasick would rescan the text for every query.

## Naive approach

The first baseline runs KMP once per pattern. It is correct, it is short, and it is the reference implementation for a differential test.

```cpp
std::vector<long long> naive_counts(const std::string& text,
                                    const std::vector<std::string>& pats) {
    std::vector<long long> counts;
    for (const std::string& pat : pats) {
        std::vector<int> hits = kmp_search(text, pat);
        counts.push_back(static_cast<long long>(hits.size()));
    }
    return counts;
}
```

The cost is $O(kn + L)$, where $k$ is the number of patterns and $L$ is their total length. For $k = 10^5$ and $n = 10^6$ the product is $10^{11}$, and the program does not finish.

The second baseline is the trie scan. It starts at every text position and follows the trie while the characters still match.

```cpp
std::vector<long long> trie_scan_counts(const std::string& text) {
    std::vector<long long> counts(patterns.size(), 0);
    int n = static_cast<int>(text.size());
    for (int i = 0; i < n; ++i) {
        int v = 0;
        for (int j = i; j < n; ++j) {
            int c = text[j] - 'a';
            if (go[v][c] == -1) break;
            v = go[v][c];
            for (int id : terminal_ids[v]) ++counts[id];
        }
    }
    return counts;
}
```

This one is $O(n \cdot m_{\max})$ in the worst case, because the inner walk can follow a pattern of length $m_{\max}$ from every starting position. It is the same $10^{11}$ when one pattern is long, and it is the version that looks fast until the test with a single long pattern arrives.

Both baselines are useful. The first is the correctness oracle; the second is the shape of the solution without the one idea that makes it linear.

## Key insight

After the search has read a prefix of the text, almost all of that prefix is irrelevant. What matters is the **longest suffix of the prefix that is a prefix of some pattern**, because every pattern that could start inside the prefix and end later must begin inside that suffix.

That suffix is a node of the trie. Call it the state. When the next character $c$ is read, one of three things happens.

- The state has a child by $c$, and the state moves to that child.
- The state has no child by $c$, but a shorter suffix does, and the state moves there after following failure links.
- No suffix has a child by $c$, and the state becomes the root.

The failure link of a node is the longest proper suffix of its label that is also a node. This is the exact analogue of the KMP prefix function: $\pi[k-1]$ is the longest proper border of the matched prefix, and a border is a suffix that is also a prefix. Aho-Corasick replaces "prefix of the one pattern" with "node of the trie", and every other part of the argument survives.

The second insight is that the failure links turn the trie into a deterministic automaton. If every missing transition of a node is filled with the transition of its failure link, then the scan never needs a loop: one table lookup per character, and the state is always the longest matching suffix.

The third insight is about reporting. A text position can end several patterns at once, and they are exactly the terminal nodes on the failure chain of the current state. Walking that chain per position costs the depth of the trie, which can be $L$. Counting them instead by adding a counter at the state and pushing the counters up the failure tree in reverse breadth-first order costs $O(L)$ once, and it is the version that handles a million matches without enumerating them.

## Visual intuition

Take the dictionary `he`, `she`, `his`, `hers`. The trie below marks the terminal nodes with the pattern that ends there.

```text
root
  h
    e [he]
      r
        s [hers]
    i
      s [his]
  s
    h
      e [she]
```

The failure links are drawn separately because they cut across the tree.

| Node   | Label  | Terminal | Failure link |
| ------ | ------ | -------- | ------------ |
| root   | empty  | none     | root         |
| `h`    | `h`    | none     | root         |
| `he`   | `he`   | `he`     | root         |
| `her`  | `her`  | none     | root         |
| `hers` | `hers` | `hers`   | `s`          |
| `hi`   | `hi`   | none     | root         |
| `his`  | `his`  | `his`    | `s`          |
| `s`    | `s`    | none     | root         |
| `sh`   | `sh`   | none     | `h`          |
| `she`  | `she`  | `she`    | `he`         |

Read the failure column from the bottom up. The link of `she` is `he`, because `he` is the longest proper suffix of `she` that is a node. The link of `he` is the root, because no nonempty suffix of `he` is a node. The link of `hers` is `s`, because `s` is the longest proper suffix of `hers` that is a node, even though `s` is a child of the root rather than an ancestor of `hers` in the trie.

The failure links always point to a node of smaller depth, so they form a tree rooted at the root, called the **failure tree**. Every node has exactly one parent in that tree, and the tree is the structure that makes counting possible: the patterns that end at a text position are the terminal ancestors of the state in the failure tree.

The search for the text `ushers` shows the links in motion. It ends in states `root`, `s`, `sh`, `she`, `her`, `hers`, and the terminal ancestors of `she` are `she` and `he`, while the terminal ancestors of `hers` are `hers` and `s`, of which only `hers` is terminal.

## Formal model

Let $\Sigma$ be a finite alphabet, let $P_1, P_2, \ldots, P_k$ be nonempty patterns over $\Sigma$, and let $L = \sum_{i=1}^{k} \lvert P_i \rvert$.

::: math definition Definition
The **trie** of the patterns is a rooted tree whose nodes are the distinct prefixes of the patterns. The root is the empty prefix $\varepsilon$. The **label** of a node $v$, written $\operatorname{label}(v)$, is the string spelled by the path from the root to $v$, and the **depth** of $v$ is $\lvert \operatorname{label}(v) \rvert$. The **terminal multiplicity** $\operatorname{term}(v)$ is the number of patterns equal to $\operatorname{label}(v)$.
:::

::: math definition Definition
For a node $v \ne \varepsilon$, the **failure link** $\operatorname{fail}(v)$ is the node $u$ of maximum depth such that $\operatorname{label}(u)$ is a proper suffix of $\operatorname{label}(v)$. For the root, $\operatorname{fail}(\varepsilon) = \varepsilon$.
:::

::: math definition Definition
The **transition function** $\delta(v, c)$ is the node reached from $v$ by the character $c$. It is the child of $v$ labeled $c$ when that child exists. Otherwise it is $\delta(\operatorname{fail}(v), c)$ when $v$ is not the root, and the root when $v$ is the root and no child exists.
:::

::: math definition Definition
The **occurrence count** of a pattern $P$ in a text $T$ is the number of indices $s$ with $0 \le s \le \lvert T \rvert - \lvert P \rvert$ and $T[s..s+\lvert P \rvert-1] = P$. Two occurrences may overlap, and the count includes every overlap.
:::

::: math lemma Lemma
For a non-root node $v$ with parent $p$ and edge character $c$, the failure link satisfies

$$
\operatorname{fail}(v) = \delta(\operatorname{fail}(p), c).
$$

:::

::: math proof Proof
Every nonempty proper suffix of $\operatorname{label}(v) = \operatorname{label}(p) + c$ has the form $x + c$, where $x$ is a suffix of $\operatorname{label}(p)$, possibly empty, and the empty suffix is the root, which is always a candidate. If the suffix is a node, then $x$ is a node as well, because every prefix of a trie node is a node. The longest node $x$ that is a proper suffix of $\operatorname{label}(p)$ is $\operatorname{fail}(p)$, and the longest node reachable from it by $c$ is $\delta(\operatorname{fail}(p), c)$. Every other candidate $x$ has depth at most $\lvert \operatorname{fail}(p) \rvert$, so its transition by $c$ has depth at most the depth of $\delta(\operatorname{fail}(p), c)$. Hence the latter is the deepest proper suffix, which is the definition of the failure link. $\square$
:::

::: math lemma Lemma
For every node $v$, the terminal nodes on the chain

$$
v,\; \operatorname{fail}(v),\; \operatorname{fail}(\operatorname{fail}(v)),\; \ldots,\; \varepsilon
$$

are exactly the patterns that are suffixes of $\operatorname{label}(v)$, counted with multiplicity.
:::

::: math proof Proof
Each failure step moves from a node to the deepest node whose label is a proper suffix of the current label, so every node on the chain is a suffix of $\operatorname{label}(v)$. Conversely, let $u$ be a node whose label is a suffix of $\operatorname{label}(v)$. If $u = v$ there is nothing to prove. Otherwise $\lvert \operatorname{label}(u) \rvert < \lvert \operatorname{label}(v) \rvert$, so $u$ is a suffix of $\operatorname{fail}(v)$, because $\operatorname{fail}(v)$ is the longest proper suffix and both strings end at the same position. Repeating the argument puts $u$ on the chain. A pattern is a suffix exactly when its terminal node is on the chain, and $\operatorname{term}$ supplies the multiplicity for duplicates. $\square$
:::

::: math lemma Lemma
After the first $i+1$ characters of the text have been read, the state $v_i$ is the deepest node whose label is a suffix of $T[0..i]$.
:::

::: math proof Proof
The proof is by induction on $i$. For $i = -1$ the state is the root, whose label is the empty suffix. Suppose the claim holds before reading $T[i]$, and let $c = T[i]$. Every nonempty suffix of $T[0..i]$ that is a node is either the one-character string $c$ or has the form $x + c$ for a node $x$ that is a suffix of $T[0..i-1]$. The deepest such $x$ is $v_{i-1}$ by the induction hypothesis, and $\delta(v_{i-1}, c)$ is the deepest node reachable from it by $c$. Any deeper node would come from a deeper $x$, which does not exist. Hence the new state is the deepest suffix, as claimed. $\square$
:::

## Algorithm derivation

### Inserting the patterns

Insertion is the ordinary trie insertion. Each pattern follows existing edges when it can and creates a node when it cannot, and the node where the pattern ends receives one unit of terminal multiplicity.

```cpp
int insert(const std::string& pat) {
    int v = 0;  // the root
    for (char ch : pat) {
        int c = ch - 'a';
        if (go[v][c] == -1) {
            go[v][c] = static_cast<int>(go.size());
            go.emplace_back(26, -1);
            fail.push_back(0);
            count.push_back(0);
            term.push_back(0);
        }
        v = go[v][c];
    }
    ++term[v];
    return v;
}
```

The return value is the terminal node of the pattern. It is stored once per pattern in input order, so that the final answer can be read from the count of that node. Two identical patterns return the same node, and the terminal multiplicity records that there are two of them.

### Building the failure links

The recurrence of the lemma is evaluated in breadth-first order. The root's missing transitions point to the root, and the root's existing children have failure link root. Every other node is processed after its parent's failure link has been finalized, which is exactly what breadth-first order guarantees.

```cpp
void build() {
    std::vector<int> order;
    int head = 0;
    for (int c = 0; c < 26; ++c) {
        if (go[0][c] == -1) {
            go[0][c] = 0;               // no child: stay at the root
        } else {
            fail[go[0][c]] = 0;
            order.push_back(go[0][c]);
        }
    }
    while (head < static_cast<int>(order.size())) {
        int v = order[head++];
        for (int c = 0; c < 26; ++c) {
            int u = go[v][c];
            if (u == -1) {
                go[v][c] = go[fail[v]][c];   // fill the missing transition
            } else {
                fail[u] = go[fail[v]][c];    // the lemma, evaluated once
                order.push_back(u);
            }
        }
    }
}
```

The line `fail[u] = go[fail[v]][c]` is the whole recurrence. It is safe because `fail[v]` has smaller depth than `v`, so its row was completed earlier in the breadth-first order. The same loop also fills every missing transition with the transition of the failure link, which is what turns the trie into a complete automaton.

### Scanning the text

Once the table is complete, the scan is one lookup per character and no loop.

```cpp
std::vector<long long> scan(const std::string& text) {
    int state = 0;
    for (char ch : text) {
        state = go[state][ch - 'a'];
        ++count[state];
    }
    return count;
}
```

The counter is incremented at the state reached after the character, not at the terminal node of a pattern. The terminal node may be several failure links above the state, and the next step pushes the counters to it.

### Counting without enumerating

The failure links form a tree. A pattern ending at terminal node $u$ occurs at a text position exactly when the state at that position is in the subtree of $u$ in the failure tree, because the state's label has $u$'s label as a suffix exactly when $u$ is an ancestor of the state. The reverse breadth-first order visits every node after all of its failure-tree children, so one pass adds each subtree to its parent.

```cpp
for (int i = static_cast<int>(order.size()) - 1; i >= 0; --i) {
    int v = order[i];
    count[fail[v]] += count[v];
}
```

After this loop, `count[u]` is the number of text positions whose state lies in the subtree of $u$, which is exactly the number of occurrences of the pattern ending at $u$. If the problem only asks whether a pattern appears, the same loop can propagate a boolean with logical OR instead of an integer.

### Why the build is linear

The trie has one node per distinct pattern prefix, so at most $L + 1$ nodes. Insertion visits each pattern character once, for $O(L)$. The breadth-first loop visits each node once and performs 26 operations per node, for $O(26L)$ with a constant alphabet. The scan performs one transition per text character, for $O(n)$, and the propagation performs one addition per non-root node, for $O(L)$.

No step rescans the text and no step walks a failure chain per character, so the total is $O(26L + n)$.

## Step-by-step execution

Build the automaton for `he`, `she`, `his`, `hers`. The table assigns an index to each node for reference, and the terminal column records the pattern that ends at the node.

| Index | Label  | Depth | Terminal | Failure |
| ----- | ------ | ----- | -------- | ------- |
| 0     | empty  | 0     | none     | 0       |
| 1     | `h`    | 1     | none     | 0       |
| 2     | `he`   | 2     | `he`     | 0       |
| 3     | `her`  | 3     | none     | 0       |
| 4     | `hers` | 4     | `hers`   | 7       |
| 5     | `hi`   | 2     | none     | 0       |
| 6     | `his`  | 3     | `his`    | 7       |
| 7     | `s`    | 1     | none     | 0       |
| 8     | `sh`   | 2     | none     | 1       |
| 9     | `she`  | 3     | `she`    | 2       |

Node 7 is `s`, so the failure link of `hers` is `s`, and the failure link of `his` is also `s`. The link of `sh` is `h`, and the link of `she` is `he`. These are the only nontrivial links in this dictionary.

Now scan the text `ushers`.

| Index | Character | State before | Transition used | State after | Terminal ancestors |
| --- | --- | --- | --- | --- | --- |
| 0 | `u` | 0 | root has no `u`, so root | 0 | none |
| 1 | `s` | 0 | edge to 7 | 7 | none |
| 2 | `h` | 7 | edge to 8 | 8 | none |
| 3 | `e` | 8 | edge to 9 | 9 | `she`, then `he` |
| 4 | `r` | 9 | fill: transition of `fail(9) = 2` by `r` | 3 | none |
| 5 | `s` | 3 | edge to 4 | 4 | `hers`, then `s` is not terminal |

The trace reports `she` and `he` at index 3, and `hers` at index 5. The pattern `his` is never reached. The text character at index 4 is the interesting one: `she` has no child by `r`, so the automaton follows the failure link to `he` and then takes its `r` edge, which is precisely the state `her`. A naive trie scan would have restarted at the root and lost the fact that `he` was still matched.

Counting is a second pass over the failure tree. Take the patterns `a`, `aa`, `aaa` and the text `aaaa`. The trie is a chain, and the failure links are `fail(a) = root`, `fail(aa) = a`, `fail(aaa) = aa`.

| Text index | Character | State before | State after | Direct count after |
| ---------- | --------- | ------------ | ----------- | ------------------ |
| 0          | `a`       | 0            | `a`         | `count[a] = 1`     |
| 1          | `a`       | `a`          | `aa`        | `count[aa] = 1`    |
| 2          | `a`       | `aa`         | `aaa`       | `count[aaa] = 1`   |
| 3          | `a`       | `aaa`        | `aaa`       | `count[aaa] = 2`   |

The direct count says that `aaa` ends at two positions, but it says nothing about `a` and `aa` at those positions. The reverse pass fixes that.

| Node processed | Count before | Added from its failure children | Count after |
| -------------- | ------------ | ------------------------------- | ----------- |
| `aaa`          | 2            | none                            | 2           |
| `aa`           | 1            | 2 from `aaa`                    | 3           |
| `a`            | 1            | 3 from `aa`                     | 4           |

The answers are `a = 4`, `aa = 3`, `aaa = 2`, which is correct for `aaaa`. The direct count found two occurrences of `aaa`; the propagation found the three occurrences of `aa` and the four occurrences of `a` without scanning the text again.

## Correctness proof

::: math theorem Theorem
For every pattern $P_i$, the value `count[terminal[i]]` after the propagation pass equals the number of occurrences of $P_i$ in the text, including overlapping occurrences.
:::

::: math proof Proof
**The state is the deepest suffix.** Lemma 3 shows that after reading $T[0..i]$, the state $v_i$ is the deepest node whose label is a suffix of $T[0..i]$. The proof is an induction that uses the completeness of $\delta$: every missing transition has been replaced by the transition of the failure link, so the scan always follows the deepest node reachable by the current character.

**Every occurrence is counted.** Suppose $P_i$ occurs at position $s$, ending at $s + \lvert P_i \rvert - 1$. The label of $v_{s + \lvert P_i \rvert - 1}$ is the longest suffix of the text ending at that position that is a node, so $P_i$, being a shorter suffix that is a node, is a suffix of $\operatorname{label}(v)$ and, by Lemma 2, the terminal node $u_i$ of $P_i$ lies on the failure chain of $v$. In the failure tree, $u_i$ is therefore an ancestor of $v$, so the direct count at $v$ contributes to $u_i$ during the reverse pass. Every occurrence contributes exactly one unit to the counter of $u_i$.

**No other position is counted.** Conversely, suppose the direct count at a state $v$ contributes to $u_i$. Then $u_i$ is an ancestor of $v$ in the failure tree, so $\operatorname{label}(u_i) = P_i$ is a suffix of $\operatorname{label}(v)$, and $\operatorname{label}(v)$ is a suffix of the text prefix ending at that position. Therefore $P_i$ occurs ending at that position. The contribution is one unit per text position, so the count is exact.

**Duplicates are handled.** Two identical patterns end at the same node and have the same terminal node. The direct count at a state contributes once to that node, and both pattern records read the same count, which is the number of occurrences of the shared string. The terminal multiplicity is not used in this propagation for that reason; it would multiply the count by the number of duplicates, which is not what "the number of occurrences of each pattern" asks for. The multiplicity is used in Problem 2, where the question is how many pattern records end at a position and each duplicate is a separate record.

Combining the three parts, the counter of $u_i$ is exactly the number of text positions at which $P_i$ ends, which is the number of its occurrences. $\square$
:::

## Complexity analysis

| Phase                                          | Cost                                        |
| ---------------------------------------------- | ------------------------------------------- |
| Inserting the patterns                         | $O(L)$ time, one node per distinct prefix   |
| Building the failure links and the transitions | $O(26L)$ time, 26 entries per node          |
| Scanning the text                              | $O(n)$ time, one transition per character   |
| Propagating the counts                         | $O(L)$ time, one addition per non-root node |
| Whole algorithm                                | $O(26L + n)$ time and $O(26L)$ space        |

The space is dominated by the transition table. A node stores 26 integers, so a dictionary with $L = 10^6$ characters needs about $26 \times 10^6$ integers, or 104 megabytes at four bytes per integer, plus the failure link, counter and queue arrays. That fits in a 256-megabyte limit but leaves little room, and a 128-megabyte limit forces a sparse representation or a smaller test.

The alphabet factor is a constant, not a variable, and that is why the bound is usually written $O(L + n)$ for a fixed alphabet. It is not free: with a 26-letter alphabet the build does 26 operations per node, and with a 4-letter alphabet such as DNA it does 4.

A sparse representation stores only the edges that exist and follows failure links during the scan instead of reading a filled table. The scan is still $O(n)$ amortized, because each character increases the depth by at most one and every failure step decreases it by at least one, but each transition becomes a map lookup. The space drops to $O(L)$ nodes plus the edges actually present, while the build time depends on the representation and can degrade to $O(L \lvert \Sigma \rvert)$ in the worst case. This is the right trade when the alphabet is large or when memory is tight.

If the problem asks for the positions of the matches rather than the counts, the output itself can be as large as the number of matches. Enumerating the terminal ancestors of every state costs time proportional to the output size, and no algorithm can do better because it has to write them down. The counting version avoids that cost by never enumerating them.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One pattern, one text | KMP, because the trie and the failure tree are unnecessary |
| Many patterns, one text, count each | Aho-Corasick with counter propagation |
| Many patterns, one text, report every position | Aho-Corasick with output links, cost proportional to the matches |
| Many patterns, many texts | Build the automaton once and scan every text |
| The text is fixed, the queries are arbitrary patterns | A suffix automaton or a suffix array of the text |
| The dictionary is fixed and the text changes | Aho-Corasick, rebuilt only when the dictionary changes |
| The dictionary changes online | Aho-Corasick plus binary grouping or periodic rebuilding |
| The alphabet is large or the strings are Unicode | A sparse transition map |
| The patterns are prefixes of one another | Aho-Corasick; the failure tree handles the nesting |
| The patterns contain wildcards | Bitset matching or a different automaton |

The first two rows are the decision that this article exists for. KMP is simpler and has a smaller constant, so it wins when there is one pattern. Aho-Corasick wins when the number of patterns grows, because the trie shares their common prefixes and the scan pays for the text once rather than once per pattern.

The row about many texts is worth a second look. The automaton is a function of the dictionary alone, so it can be built once and reused for every text. A problem with $10^4$ texts and a fixed dictionary pays $O(26L)$ once and $O(n)$ per text, which is the same reason KMP computes its prefix function once.

The online row is the hard case. A static automaton does not absorb an insertion, because a new pattern can create nodes that become failure targets of nodes that already exist. The two standard answers are to rebuild the automaton when the dictionary changes, or to keep a logarithmic number of static automata of different sizes and merge them like a binary counter. Deletion is handled by a second structure over the removed strings, or by the same rebuilding strategy.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal and JavaScript. They implement the same contract.

- The first line holds the number of patterns $n$.
- The next $n$ lines hold the patterns, one per line. Each pattern is a nonempty string of lowercase Latin letters.
- The last line holds the text, a nonempty string of lowercase Latin letters.
- The program prints $n$ lines. Line $i$ holds the number of occurrences of pattern $i$ in the text, counting overlapping occurrences.

Every version stores the trie as a table of $26$ transitions per node, builds the failure links in breadth-first order, fills the missing transitions, scans the text once, and propagates the counters in reverse breadth-first order. C, C++, Java and Pascal use a signed 64-bit counter. Python uses an arbitrary-precision integer, and JavaScript uses `BigInt`, so all six agree even when a count exceeds $2^{31}$.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and are compiled and run by the same validation as the other four.

The sources are under `implementations/strings/aho-corasick/`, with one directory per language and the source file named in the manifest. The manifest carries the time and space of every variant, its input and output contract, and the verification status.

## Recursion decision

The failure links are computed iteratively by breadth-first search. A recursive formulation is possible: compute the failure link of a node after recursively computing the failure link of its parent. It is a bad idea for two reasons.

The first reason is the call stack. The trie can be a path of $L$ nodes, one pattern of length $L$, and the recursion depth is then $L$. Every language in the implementation set has a smaller default stack than that for large $L$.

The second reason is the order. The recurrence needs the failure link of the parent and the completed transition row of the failure target. A depth-first traversal does not guarantee that the failure target has been processed before the child, while breadth-first order does. The iterative queue makes the required order explicit and costs one array.

| Language   | Practical recursion depth            | Recommendation                 |
| ---------- | ------------------------------------ | ------------------------------ |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative breadth-first search |
| Java       | About $10^4$ frames                  | Iterative breadth-first search |
| Python     | The interpreter limit of 1000        | Iterative breadth-first search |
| Pascal     | The operating system stack           | Iterative breadth-first search |
| JavaScript | About $10^4$ frames                  | Iterative breadth-first search |

The output chain has the same issue. A recursive walk from a state to its failure ancestors reports the matches at one position, but the depth can be $L$ and the walk is repeated at every text position. The reverse-propagation loop replaces it with one pass over the failure tree and no recursion at all. Use the loop unless the problem explicitly asks for the positions and the output is known to be small.

## Implementation walkthrough

Five details decide whether the implementation is correct.

**The root row.** Every missing transition of the root points to the root. Without this, a text character that begins no pattern sends the state to `-1`, and the next lookup reads outside the table. The fill happens before the breadth-first loop starts.

**The breadth-first order.** The failure link of a node uses the transition row of its failure target, which must already be complete. Breadth-first order guarantees that the target has smaller depth and was processed earlier. A depth-first order does not, and a loop over the nodes in insertion order does not either.

**The failure assignment.** For an existing child $u$ of $v$ by character $c$, the assignment is `fail[u] = go[fail[v]][c]`, not `fail[u] = fail[v]`. The latter ignores the character $c$ and produces the wrong link for every pattern whose failure target does not have the same outgoing character.

**The counters.** Count at the state after the transition, not at a terminal node found by walking the failure chain. Then propagate in reverse breadth-first order. The order array built during the failure construction is exactly the order needed; no second sort is necessary.

**Duplicate patterns.** The terminal multiplicity is not the occurrence count. Two identical patterns share a terminal node, and both answers are the number of occurrences of that string, not that number times two. The propagation adds one unit per text position, and every pattern record reads the same final count.

A compact version of the two critical lines:

```cpp
int u = go[v][c];
if (u == -1) {
    go[v][c] = go[fail[v]][c];       // complete the automaton
} else {
    fail[u] = go[fail[v]][c];        // the failure recurrence
    order.push_back(u);
}
```

The two assignments are the only places where the algorithm can go wrong in a way that survives the sample tests. The transition assignment is exercised by any text character that is absent from the current node but present at a failure ancestor. The failure assignment is exercised by any dictionary with a pattern that is a proper suffix of another.

For multiple test cases, every one of the six arrays has to be reset: the transition rows, the failure links, the counters, the terminal ids and the order. Allocating a fresh automaton per case is simpler and is the safer choice when the total input is small.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Counting only the state, not its failure ancestors | Patterns that are suffixes of another pattern are missed | Propagate the counters over the failure tree |
| Resetting the state to the root after a match | Overlapping occurrences and nested patterns are lost | The state already is the longest suffix; do not reset it |
| Setting `fail[u] = fail[v]` | The failure link ignores the edge character and points to the wrong node | Use `go[fail[v]][c]` |
| Leaving root transitions at `-1` | The state becomes invalid on a character that starts no pattern | Fill every missing root transition with the root |
| Processing nodes in insertion order | The failure target's row is not complete yet | Process in breadth-first order |
| Using a 32-bit counter | A text of $10^5$ characters and a short pattern can exceed $2^{31}$ | Use a 64-bit counter, or arbitrary precision |
| Multiplying by the terminal multiplicity | Duplicate patterns are counted twice per occurrence | The propagation adds one unit per text position; duplicates share the terminal node and the count |
| Building a dense table for a huge alphabet | The memory is $26L$ only for a 26-letter alphabet; a larger one explodes | Use a sparse map |
| Reusing the arrays across test cases without clearing them | Counts from the previous case leak into the next | Reset every array or rebuild the automaton per case |

### Why this fails: the pattern that ends inside another

Take the patterns `a` and `aa`, and the text `aa`. The correct counts are $2$ for `a` and $1$ for `aa`, because `a` occurs at index $0$ and index $1$, while `aa` occurs only at index $0$.

A program that increments a counter only at the terminal node of the current state reports `a = 1` and `aa = 1`. The direct counts after the scan are `count[a] = 1` at index $0$ and `count[aa] = 1` at index $1`. The occurrence of `a`at index $1$ is hidden inside the state`aa`, because `a`is a suffix of`aa`and therefore a failure ancestor of`aa`. The reverse pass adds `count[aa]`to`count[a]`and repairs the answer. Two characters is the smallest text that exposes the bug; with the text`a` the direct count is already correct.

The same bug appears in a more familiar form when the search resets to the root after every match. With the patterns `a` and `aa` and the text `aa`, the first character reaches `a` and reports it, and a reset sends the state back to the root. The second character reaches `a` again, so `aa` is never reported even though it occurs. In Aho-Corasick the state after a match is already the longest suffix of the text read so far, so there is nothing to reset. The report is a read of the failure chain or a counter, not a reason to move the state.

A third failure is subtler. Setting `fail[u] = fail[v]` instead of `go[fail[v]][c]` looks harmless when the parent's failure link happens to have the same child, and it passes the dictionary `he`, `she`, `his`, `hers` for some nodes. The smallest counterexample is the dictionary `ab`, `b`. The node `ab` has parent `a` and edge `b`. The correct failure link is the node `b`, because `b` is the longest proper suffix of `ab` that is a node. The buggy assignment gives `fail(a)`, which is the root, and then the pattern `b` is never found inside `ab` by the failure chain. The trace is short enough to check by hand, and it is the test to write before trusting the build.

## Variants and extensions

- **Sparse transitions.** Store only the existing edges and follow failure links during the scan. The space drops to $O(L)$ nodes plus the edges, at the cost of a map lookup per transition.
- **Output links.** A second link per node jumps to the nearest terminal failure ancestor, so enumerating the matches at a position skips the non-terminal nodes on the chain. This is the right variant when every position must be reported.
- **The failure tree.** The failure links form a tree. Subtree sums, Euler tours and Fenwick trees over that tree answer offline questions such as "how many patterns occur in this interval of text positions".
- **Aho-Corasick and dynamic programming.** A DP over the automaton states counts the strings of length $n$ that avoid every pattern, or that contain a given set of patterns. Matrix exponentiation extends it to enormous lengths.
- **Aho-Corasick and segment trees.** When each pattern carries a weight that changes, a segment tree over the failure tree's Euler tour maintains the maximum or the sum of the weights of the patterns ending at a position.
- **Binary grouping.** Maintain a logarithmic number of static automata of different sizes, merge two equal-sized groups by rebuilding, and answer a query by summing over the groups. This supports insertion and deletion without rebuilding the whole dictionary.
- **Reversed patterns.** Build a second automaton over the reversed patterns and scan the reversed text. This counts the patterns that start at each position, which is what a sum over concatenations needs.
- **Alphabet compression.** Map the characters that actually occur to a small dense alphabet before building. The transition table shrinks and the cache behavior improves.
- **The suffix automaton.** If the text is fixed and the patterns are the queries, the suffix automaton of the text answers each query in linear time in the query, without rebuilding the pattern set.

## Contest strategy

1. Read the total length of the patterns before choosing the representation. A dense table of 26 entries per node is comfortable at $10^5$ characters and tight at $10^6$.
2. Build the trie, then the failure links in breadth-first order, then fill the missing transitions. Do not interleave the three steps.
3. Decide whether the problem wants counts, a yes-or-no answer, or the positions. Counts use integer propagation, existence uses boolean OR, and positions use output links.
4. Use a 64-bit counter from the first line of code. The number of matches can be quadratic in the input size and a 32-bit counter overflows silently.
5. Test the four small shapes explicitly: a pattern longer than the text, a pattern equal to the text, a pattern that is a suffix of another, and two identical patterns.
6. Differential-test against KMP on a thousand random dictionaries and texts of length at most ten. The two solutions share no code, so a disagreement localizes the bug quickly.
7. If the dictionary changes between queries, decide between rebuilding and binary grouping before writing the query loop. A static automaton cannot absorb a new pattern incrementally.
8. If there is only one pattern, stop and use KMP. The automaton is correct there too, but it is more code for no asymptotic gain.

## Worked problems

### Problem 1: which patterns appear

**Restatement.** Given a text of length $n \le 10^5$ and $k \le 5 \cdot 10^5$ patterns whose total length is at most $5 \cdot 10^5$, print `YES` for every pattern that occurs in the text and `NO` otherwise. This is CSES "Finding Patterns".

**Naive baseline.** Run KMP for each pattern. The cost is $O(kn + L)$, which is up to $5 \cdot 10^{10}$ character comparisons.

**Insight.** The automaton answers all patterns in one scan. A pattern occurs exactly when its terminal node is reachable in the failure tree from some state visited by the text.

**Derivation.** Build the automaton, scan the text, and mark every visited state. Propagate the marks from each node to its failure link in reverse breadth-first order. The answer for a pattern is the mark at its terminal node.

**Correctness.** By Lemma 2, the terminal node of a pattern is on the failure chain of a state exactly when the pattern is a suffix of that state's label. By Lemma 3, the state's label is a suffix of the text read so far. The mark reaches the terminal node exactly when the pattern ends at some text position, which is exactly when it occurs.

**Complexity.** $O(26L + n)$ time and $O(26L)$ space.

**Common wrong approach.** Checking only the states that are terminal during the scan. In the dictionary `he`, `she`, `his`, `hers` and the text `ushers`, the scan visits `she` but never visits `he` as a state, so `he` is reported as absent even though it occurs at index 2. The failure chain or the propagation is what finds it.

### Problem 2: sum over all concatenations

**Restatement.** Given a text $t$ of length at most $2 \cdot 10^5$ and $n \le 2 \cdot 10^5$ strings $s_i$ whose total length is at most $2 \cdot 10^5$, compute

$$
\sum_{i=1}^{n} \sum_{j=1}^{n} f(t, s_i + s_j),
$$

where $f(t, x)$ is the number of occurrences of $x$ in $t$. This is Codeforces 1202E, "You Are Given Some Strings...".

**Naive baseline.** For every ordered pair, build the concatenation and run KMP. There are $n^2$ pairs, so the cost is at least $n^2$ even before the search, which is $4 \cdot 10^{10}$ pairs at the limit.

**Insight.** Every occurrence of $s_i + s_j$ has a unique split point between the last character of $s_i$ and the first character of $s_j$. If `end[p]` is the number of patterns that end at position $p$, and `start[p]` is the number of patterns that start at position $p$, then the answer is

$$
\sum_{p=0}^{n} \text{end}[p-1] \cdot \text{start}[p],
$$

with the out-of-range values taken as zero.

**Derivation.** Build an automaton over the patterns and scan $t$. Precompute for every node the sum of the terminal multiplicities on its failure chain, which is the number of patterns ending at that state. Call it `out[v]`, and compute it in breadth-first order as `out[v] = term[v] + out[fail[v]]`. During the scan, record `end[p] = out[state]` after reading position $p$.

Build a second automaton over the reversed patterns and scan the reversed text. For a reversed state at position $q$, `outRev[state]` is the number of reversed patterns ending at $q$, which is the number of original patterns starting at $n - 1 - q$. Record those values as `start[p]`.

Finally, sum the products over the split points. Each occurrence of a concatenation is counted once, at its unique split, and each ordered pair is counted separately even when two pairs produce the same string.

**Correctness.** An occurrence of $s_i + s_j$ starting at $a$ ends at $a + \lvert s_i \rvert + \lvert s_j \rvert - 1$ and has its split after position $a + \lvert s_i \rvert - 1$. At that split, `end` counts $s_i$ and `start` counts $s_j$, so the product counts the occurrence. Conversely, a pair counted by the product at split $p$ has an occurrence of some $s_i$ ending at $p-1$ and an occurrence of some $s_j$ starting at $p$, which concatenate to an occurrence of $s_i + s_j$ spanning the split. The bijection is exact.

**Complexity.** $O(26L + n)$ time and $O(26L + n)$ space for the two automata and the two arrays of per-position counts.

**Common wrong approach.** Multiplying the total occurrence counts of $s_i$ and $s_j$ instead of the per-position counts. Two occurrences that are far apart do not form a concatenation, and the product overcounts every pair whose occurrences are not adjacent. The split formulation is what forces the positions to line up.

### Problem 3: a dictionary that changes

**Restatement.** Process $m \le 3 \cdot 10^5$ online queries over a set $D$ of strings whose total length is at most $3 \cdot 10^5$. A query either adds a string that is not present, deletes a string that is present, or asks how many occurrences of the strings currently in $D$ appear in a given string, counting every occurrence of every string. This is Codeforces 710F, "String Set Queries".

**Naive baseline.** Rebuild the automaton after every add and delete. The rebuild costs $O(26L)$, so the total is $O(26Lm)$, which is about $10^{12}$ operations at the limit. Running KMP for every string in $D$ per query is equally hopeless.

**Insight.** Aho-Corasick is static, because inserting a pattern can create new trie nodes and can change the failure links of existing nodes. A logarithmic number of static automata can represent a dynamic set instead. Keep the strings in groups whose sizes are distinct powers of two, like the carries of a binary counter. Each group has its own automaton. Inserting a string creates a group of size one, and two groups of the same size are merged by rebuilding one automaton over the union. A query scans the string through every group and sums the answers.

**Derivation.** For insertion, create a one-string group and then, while the next group has the same size, merge the two sets and rebuild. Each string participates in at most $O(\log m)$ merges, so the total rebuild cost is $O(26L \log m)$.

Deletion is handled by a second structure that holds the strings that have ever been deleted. Query the structure of inserted strings and subtract the structure of deleted strings. A string that is currently active is in the first structure and not the second, so it contributes once. A string that has been deleted is in both, so its contribution cancels. A string that was never inserted is in neither.

**Correctness.** The grouping invariant is that every set is partitioned into groups of distinct sizes, so every inserted string belongs to exactly one group and the query sums its occurrences exactly once. The subtraction removes exactly the strings that were deleted, because a deleted string is inserted into the deletion structure at the moment of deletion and remains there. The difference is the count over the current set $D$.

**Complexity.** An insertion causes at most $O(\log m)$ merges in the worst case and $O(1)$ amortized, and each merge rebuilds an automaton over the strings in the merged group. A string is rebuilt $O(\log m)$ times, so the total build is $O(26L \log m)$. A query scans its string through $O(\log m)$ automata, so the total query time is $O(\lvert s \rvert \log m)$ per query. The space is $O(26L)$ for the groups plus the arrays of the current query.

**Common wrong approach.** Inserting a pattern by adding its path to a static trie and leaving the new nodes with a failure link to the root. The new nodes can be suffixes of existing nodes, so the failure links and the filled transitions of nodes that already exist can change as well. The automaton becomes inconsistent, and the answers for the old patterns are wrong. The grouping rebuilds the affected automaton over the whole group, which restores every link and every transition.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks about one pattern or a set, and write down the total pattern length, the text length and whether the dictionary changes.
2. **Direct application.** Build the automaton for `he`, `she`, `his`, `hers` by hand, then implement it and check the failure links against the table in this article.
3. **Adaptation.** Write the three answer modes: a boolean per pattern, a count per pattern, and the list of patterns ending at each text position. Check that all three agree on the small examples.
4. **Combination.** Compute the per-position end counts of Problem 2 with a second automaton over the reversed patterns, and check the concatenation sum against a brute force on random small inputs.
5. **Challenge.** Implement the binary grouping of Problem 3, including the deletion structure, and compare its answers against a rebuild-after-every-query baseline on random operations.
6. **Transfer.** Recognize the failure tree inside another problem: a subtree sum over the failure tree, a path query on the trie, or a DP whose state is an automaton node. The automaton is often a component rather than the whole solution.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a node of the trie represent, and what does its failure link represent? (Formal model)
2. Why is the failure link the multi-pattern version of the KMP prefix function? (Key insight)
3. What is the recurrence for the failure link of a child, and which order makes it evaluable? (Algorithm derivation)
4. Why does the scan need no fallback loop once the missing transitions are filled? (Algorithm derivation)
5. After reading a text prefix, what exactly is the state? (Formal model, Lemma 3)
6. Why does a counter at the state count every pattern that ends there after propagation? (Correctness proof)
7. What is the smallest dictionary and text on which counting only terminal states gives a wrong answer? (Common mistakes)
8. Why is resetting the state to the root after a match wrong in Aho-Corasick? (Common mistakes)
9. What goes wrong with `fail[u] = fail[v]` instead of `go[fail[v]][c]`? (Implementation walkthrough)
10. When is a suffix automaton or a suffix array a better choice than Aho-Corasick? (Algorithm selection)
11. Why does a static automaton not absorb an insertion incrementally, and what replaces it? (Worked problems, Problem 3)
12. What is the memory cost of the dense transition table at $L = 10^6$, and what are the alternatives? (Complexity analysis)

## Further reading

- The one-pattern version of the failure function, and the proof that the search is linear, is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The trie that stores the patterns, and the alphabet factor that decides its representation, is in [the trie](/algorithms/strings/trie).
- The subject index places this technique beside the other string algorithms and lists what each one answers, in [the strings](/algorithms/strings/).
- The breadth-first traversal that computes the failure links in increasing depth is in [breadth-first search](/algorithms/graphs/bfs).
- The amortized argument that bounds a sequence of fallbacks by the number of increases of a potential is in [complexity analysis](/algorithms/foundations/complexity).
- The other direction of the same suffix question, where the pattern is fixed and the text is the variable, is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The fingerprint alternative for substring equality, which is faster to write but has collision risk, is in [rolling hash](/algorithms/strings/rolling-hash).
- The structure that indexes a fixed text for arbitrary pattern queries is in [the suffix array](/algorithms/strings/suffix-array).
- The tree structure that answers subtree and path queries over the failure tree is in [the segment tree](/algorithms/range-queries/segment-tree).
- The dynamic program that counts strings avoiding a set of patterns uses the automaton as its state space, in [bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp).
