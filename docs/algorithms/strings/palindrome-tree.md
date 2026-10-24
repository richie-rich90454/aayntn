---
id: strings.palindrome-tree
title: Palindrome trees (eertree)
summary: Store every distinct palindromic substring of a string as a node of a tree with two roots and suffix links, so one pass counts the distinct palindromes and the total number of palindromic substrings.
division: [gold, platinum]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords:
    [
        palindromic tree,
        eertree,
        distinct palindromes,
        palindromic suffix,
        suffix link,
        palindrome occurrences,
    ]
prerequisites:
    required: [foundations.complexity, strings.kmp]
    recommended: [foundations.recursion, strings.manacher]
complexity:
    time: "O(n)"
    space: "O(n)"
assumptions:
    - The string is over a fixed alphabet, so a node can hold its transitions in a short adjacency list.
    - The whole string is available before the structure is built, so the tree is built in one left-to-right pass.
    - Comparing two characters takes constant time.
implementations: strings.palindrome-tree
reviewed: false
---

## At a glance

A palindrome tree, also called an **eertree**, stores every distinct palindromic substring of a string as one node of a tree. For a string of length $n$ it uses at most $n + 2$ nodes, and it is built in one left-to-right pass in $O(n)$ time and $O(n)$ space.

The tree has two roots. One root has length $-1$ and stands for an imaginary string, which lets a single character be created by wrapping the imaginary string. The other root has length $0$ and stands for the empty palindrome. Every other node is one distinct nonempty palindrome, and an edge labeled $c$ adds $c$ to both ends of its parent. The suffix link of a node points to the node of its longest proper palindromic suffix, which is the same idea as the failure link of [Knuth-Morris-Pratt](/algorithms/strings/kmp).

The whole method fits in one sentence: **when the character at the right end grows the current palindrome, the only palindrome that can be new is the longest palindromic suffix, because every shorter palindromic suffix already occurred as a prefix of it.**

That sentence is also the reason the structure is small. A string has at most $n$ distinct nonempty palindromic substrings, even though it has $\Theta(n^2)$ substrings, and the eertree stores exactly those distinct palindromes once each.

## Problem motivation

A bioinformatics pipeline receives a DNA read of $10^6$ characters and needs two numbers for a quality report: how many distinct palindromic substrings it contains, and how many palindromic substrings it contains in total, counting the same palindrome at different positions separately. A text editor has the same pair of questions while the user types, and a compression tool needs the occurrence count of every distinct palindrome so that it can replace the frequent ones.

The naive solution enumerates every substring, tests whether it is a palindrome, and inserts it into a hash set. There are about $n^2 / 2$ substrings, and comparing one of length $L$ costs $O(L)$, so the enumeration is $O(n^3)$ in the worst case. Expanding around every center is better: it finds all $O(n^2)$ palindromic occurrences in $O(n^2)$ time. Hashing each occurrence and inserting the hash into a set removes the duplicates with $O(n)$ memory, because a string has at most $n$ distinct palindromes, but it still performs $O(n^2)$ expansions and hashes.

The constraints rule both out. A read of $10^6$ characters has about $5 \times 10^{11}$ substrings, so no algorithm that touches each one fits in a time limit. The eertree touches each character once and creates at most one node per character, which is $10^6$ nodes for the read and a linear pass over them.

The same structure answers several questions that look different:

- the number of distinct palindromic substrings;
- the number of palindromic substrings counting multiplicity;
- the number of occurrences of every distinct palindrome;
- the longest palindromic suffix of every prefix;
- the number of palindromic suffixes ending at every position, which is the input to many counting problems.

The last two are the reason the tree is worth building even when only one of them is asked.

## Recognition patterns

The eertree is the right tool when the statement contains some of these phrases.

- "Distinct palindromic substrings", "how many different palindromes", "the number of unique palindromes".
- "Count the palindromic substrings", "the number of subpalindromes", where occurrences at different positions count separately.
- "For every palindrome, how many times does it occur", "the most frequent palindrome".
- "The longest palindromic suffix of every prefix", "the palindromic suffixes ending at each position".
- "Palindromic factorization", "split the string into the minimum number of palindromes", "count the partitions into palindromes".
- A string of length $10^5$ or $10^6$ where the number of distinct palindromes or their occurrences is required.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| $n \le 300$ | Enumerating every substring and testing it is fast enough, and it is the reference implementation |
| $n \le 10^6$ and distinct palindromes are required | The eertree is the direct linear solution |
| Only the longest palindromic substring is required | [Manacher](/algorithms/strings/manacher) is simpler and has a smaller constant |
| Only the total number of palindromic substrings is required | Manacher's radii can sum the total; the eertree also answers it |
| The occurrence count of every distinct palindrome is required | The eertree plus one propagation pass |
| The answer depends on the longest palindromic suffix of every prefix | The eertree records it in `last` at every step |
| Many queries on substrings of one fixed text | A suffix automaton, a suffix array or hashing, not a fresh eertree per query |
| The string is edited in the middle | A different structure; the eertree is built for one left-to-right pass |
| The alphabet is huge or the symbols are Unicode | Sparse transitions, because a dense table per node is not affordable |
| The question is about subsequences rather than substrings | A dynamic program, not a string structure |

The row that catches people is the first one about Manacher. Manacher computes the radius of the longest palindrome at every center in linear time, so it answers "the longest palindrome" and "the total number of palindromic substrings" without storing the distinct ones. The eertree is needed when the answer depends on the identity of each palindrome rather than only on its length or count.

The last row is the other trap. A palindromic subsequence is a different object from a palindromic substring, and the eertree does not help with it at all.

## Naive approach

The baseline enumerates every substring, checks it with a reverse comparison, and stores it in a set.

```cpp
std::set<std::string> distinct;
long long total = 0;
for (int i = 0; i < n; ++i) {
    for (int j = i; j < n; ++j) {
        std::string t = s.substr(i, j - i + 1);
        std::string r(t.rbegin(), t.rend());
        if (t == r) {
            distinct.insert(t);
            ++total;
        }
    }
}
```

This is correct for every input, and it is the reference for a differential test on small strings. It is also expensive in three separate ways. There are $\Theta(n^2)$ substrings, each substring is copied in $O(n)$ time, and each comparison and set insertion costs up to $O(n)$ more. The total is $O(n^3 \log n)$ in the worst case. The set holds at most $n$ distinct palindromes, but their total length is $\Theta(n^2)$ on a string such as `aaaa...a`, because the palindromes have lengths $1, 2, \ldots, n$.

The second baseline expands around every center. It avoids the substring copies and finds all $O(n^2)$ occurrences in $O(n^2)$ time, but it still has to deduplicate. Hashing each palindrome gives $O(1)$ comparisons on average, so the time stays $O(n^2)$ for the expansions and hashes, and the set holds $O(n)$ distinct hashes because a string has at most $n$ distinct palindromes. On a string of $10^6$ identical characters that is $5 \times 10^{11}$ expansions, which no time limit allows.

The eertree removes both the quadratic number of objects and the copies. It stores one node per distinct palindrome, not one per occurrence, and it recognizes the new palindromes while reading the string once.

## Key insight

Fix the right endpoint $i$. The palindromic suffixes of the prefix $S[0..i]$ are the palindromes that end at $i$. They are nested: if $Q$ and $P$ are palindromic suffixes with $\lvert Q \rvert < \lvert P \rvert$, then $Q$ is a suffix of $P$. Since $P$ is a palindrome, the suffix $Q$ is also a prefix of $P$. Therefore $Q$ occurs at the start of $P$, which ends before $i$, so $Q$ already occurred in the previous prefix.

That observation has two consequences, and they are the entire structure.

First, when the character $S[i]$ is appended, **at most one distinct palindrome can be new**, namely the longest palindromic suffix of $S[0..i]$ if it did not occur before. Every shorter palindromic suffix is a prefix of the longest one and occurred earlier. Hence a string of length $n$ has at most $n$ distinct nonempty palindromic substrings, and the eertree has at most $n + 2$ nodes.

Second, to find the longest palindromic suffix of $S[0..i]$, look at the palindromic suffixes of $S[0..i-1]$ in decreasing length and take the first one that can be extended by $S[i]$. A palindrome $P$ ending at $i-1$ is extendable by $c = S[i]$ exactly when the character before its occurrence is $c$. If such a $P$ exists, the new longest suffix is $c P c$. If none exists, the new suffix is the single character $c$.

The chain of palindromic suffixes of a prefix is exactly the chain of suffix links of its longest palindromic suffix. The eertree stores that chain once for every distinct palindrome, so the search for the extendable palindrome is a walk over suffix links rather than a fresh scan.

## Visual intuition

Take $S = \texttt{abba}$. The four distinct nonempty palindromes are `a`, `b`, `bb` and `abba`. The forest below has the imaginary root on the left and the empty root on the right. An edge labeled $c$ wraps its parent in $c$.

```text
        imaginary (-1)                  empty (0)
          /       \                        |
         a         b                       b
         |         |                       |
       "a"       "b"                     "bb"
                                           |
                                           a
                                           |
                                        "abba"
```

The empty root is drawn separately because its edge creates an even palindrome of length two. The edge from the imaginary root creates a single character, and the edge from `bb` wraps it into `abba`.

The suffix links cut across the tree.

| Node      | Palindrome   | Length | Suffix link |
| --------- | ------------ | ------ | ----------- |
| imaginary | none         | $-1$   | imaginary   |
| empty     | empty string | $0$    | imaginary   |
| `a`       | `a`          | $1$    | empty       |
| `b`       | `b`          | $1$    | empty       |
| `bb`      | `bb`         | $2$    | `b`         |
| `abba`    | `abba`       | $4$    | `a`         |

Read the suffix-link column from the bottom. The longest proper palindromic suffix of `abba` is `a`, not `bb`: `bb` occurs inside `abba`, but it is not a suffix. The longest proper palindromic suffix of `bb` is `b`, and the longest proper palindromic suffix of `a` is the empty string. The link of the empty string is the imaginary root, which terminates every walk.

The tree and the links together contain three different kinds of information: the tree says how a palindrome is built by wrapping a shorter one, the length says which substring it is, and the suffix link says which smaller palindrome is still available when the next character does not extend the current one.

## Formal model

Let $S$ be a string of length $n$ over an alphabet $\Sigma$, with characters indexed from $0$. For $0 \le l \le r < n$, write $S[l..r]$ for the substring from $l$ to $r$. A string $P$ is a **palindrome** when it equals its reverse. The empty string is a palindrome.

::: math definition Definition
A **palindromic suffix** of a prefix $S[0..i]$ is a suffix of that prefix that is a palindrome. The **longest palindromic suffix** is the one with the largest length; it is unique because two suffixes of different lengths cannot be equal.
:::

::: math definition Definition
An **eertree** of $S$ is a rooted forest with two roots, $\bot$ and $\varepsilon$. The root $\bot$ has length $-1$ and represents an imaginary string. The root $\varepsilon$ has length $0$ and represents the empty string. Every other node $v$ represents one distinct nonempty palindromic substring $P_v$ of $S$, and $\operatorname{len}(v) = \lvert P_v \rvert$.

For a node $v$ and a character $c$, an edge from $v$ to a node $u$ labeled $c$ means $P_u = c P_v c$, with the convention that $c P_{\bot} c$ is the single character $c$. The **suffix link** of a non-root node $v$, written $\operatorname{link}(v)$, is the node representing the longest proper palindromic suffix of $P_v$. For the roots, $\operatorname{link}(\bot) = \bot$ and $\operatorname{link}(\varepsilon) = \bot$.
:::

Every nonempty palindrome has exactly one parent: remove its first and last character. If the result has length $-1$, the parent is $\bot$ and the palindrome has length one. Otherwise the result is a shorter palindrome, and its node is the parent. The parent of a length-two palindrome is $\varepsilon$. This is why the two roots exist: they give every palindrome a parent without special cases in the tree.

::: math definition Definition
After the prefix $S[0..i]$ has been processed, $\operatorname{last}_i$ is the node of its longest palindromic suffix. The **occurrence count** $\operatorname{occ}(v)$ of a node $v$ is the number of positions $j$ such that $P_v$ ends at $j$.
:::

::: math lemma Lemma
For every node $v$, the sequence

$$
v,\; \operatorname{link}(v),\; \operatorname{link}(\operatorname{link}(v)),\; \ldots
$$

visits exactly the nodes whose palindromes are palindromic suffixes of $P_v$, in strictly decreasing length.
:::

::: math proof Proof
Every link is a proper suffix by definition, so every node on the sequence represents a palindromic suffix. Conversely, let $u$ be a node whose palindrome is a proper palindromic suffix of $P_v$. The longest proper palindromic suffix is $\operatorname{link}(v)$. Both $P_u$ and $P_{\operatorname{link}(v)}$ are suffixes of $P_v$ ending at the same position, and $\lvert P_u \rvert \le \lvert P_{\operatorname{link}(v)} \rvert$, so $P_u$ is a suffix of $P_{\operatorname{link}(v)}$. Repeating the argument moves down the sequence. The lengths strictly decrease, so the process stops at a root. $\square$
:::

::: math lemma Lemma
Let $c = S[i]$, and let $u$ be the longest palindromic suffix of $S[0..i-1]$ such that either $u = \bot$ or $i - 1 - \operatorname{len}(u) \ge 0$ and $S[i - 1 - \operatorname{len}(u)] = c$. Then $c P_u c$ is the longest palindromic suffix of $S[0..i]$.
:::

::: math proof Proof
The string $c P_u c$ is a suffix of $S[0..i]$: $P_u$ ends at $i-1$, the character before that occurrence is $c$, and the new character is $c$. It is a palindrome because $P_u$ is.

Now let $Q$ be any palindromic suffix of $S[0..i]$ with $\lvert Q \rvert \ge 2$. Then $Q = c P c$ for some string $P$. Since $Q$ is a palindrome, $P$ is a palindrome. Since $Q$ ends at $i$, $P$ ends at $i-1$, and the character before that occurrence is $c$, so $P$ is a palindromic suffix of $S[0..i-1]$ that can be extended by $c$. The maximality of $u$ gives $\lvert P \rvert \le \operatorname{len}(u)$, hence $\lvert Q \rvert \le \operatorname{len}(u) + 2$. If no nonempty palindromic suffix of length at least two exists, the only nonempty palindromic suffix is the single character $c = c P_{\bot} c$, and the claim holds with $u = \bot$. $\square$
:::

::: math lemma Lemma
When the character $S[i]$ is appended, at most one distinct palindromic substring is new.
:::

::: math proof Proof
Every new palindrome ending at $i$ is a palindromic suffix of $S[0..i]$. Let $P$ be the longest such suffix and let $Q$ be a shorter palindromic suffix. Because $P$ is a palindrome, its suffix $Q$ is also a prefix of $P$. Therefore $Q$ occurs at the start of $P$ and ends strictly before $i$, so $Q$ occurred in $S[0..i-1]$ and is not new. Hence only the longest palindromic suffix can be new. $\square$
:::

::: math lemma Corollary
A string of length $n$ has at most $n$ distinct nonempty palindromic substrings, and its eertree has at most $n + 2$ nodes.
:::

::: math proof Proof
Each position creates at most one new node, and the two roots are the only nodes that are not nonempty palindromes. $\square$
:::

::: math lemma Lemma
Let $v$ be a new node created for $P_v = c P_u c$ with $\operatorname{len}(v) \ge 2$. Let $w$ be the longest proper palindromic suffix of $P_u$ that can be extended by $c$, or $w = \bot$ if none can. Then the longest proper palindromic suffix of $P_v$ is $c P_w c$, and its node is the child of $w$ by $c$.
:::

::: math proof Proof
A proper palindromic suffix of $P_v$ of length at least two has the form $c P_z c$: it ends with $c$, and being a palindrome it starts with $c$; removing the two end characters leaves a proper palindromic suffix $P_z$ of $P_u$. The longest such suffix maximizes $\lvert P_z \rvert$ among the extendable proper palindromic suffixes of $P_u$, which is exactly $w$. The single-character suffix $c$ is $c P_{\bot} c$, which is the case $w = \bot$. The node for $c P_w c$ already exists because that palindrome ends at $i$ and is shorter than $P_v$, so by the previous lemma it is not new. It is the child of $w$ by $c$ by the definition of the tree. $\square$
:::

## Algorithm derivation

### The extension walk

The walk starts at the longest palindromic suffix of the previous prefix and follows suffix links until the current node can be extended by the new character.

```cpp
int get_link(int v, int i) {
    while (i - 1 - len[v] < 0 || s[i - 1 - len[v]] != s[i]) {
        v = link[v];   // the suffix is not preceded by s[i]
    }
    return v;
}
```

The bound is checked before the index is used, so the code never reads outside the string. The walk always terminates at the imaginary root: for $v = \bot$ the length is $-1$, the position $i - 1 - (-1)$ is $i$, and $S[i] = S[i]$ holds. The imaginary root is the sentinel that makes the single-character case a normal extension.

### Creating a node

Once the walk returns $u$, the palindrome $c P_u c$ is the new longest suffix. If the edge from $u$ by $c$ already exists, the node was created earlier and the walk simply follows the edge. Otherwise the node is created and its suffix link is computed.

```cpp
int u = get_link(last, i);
int c = s[i] - 'a';
if (next[u][c] == -1) {
    int v = nodes++;
    len[v] = len[u] + 2;
    if (len[v] == 1) {
        link[v] = 1;                 // a single character links to the empty root
    } else {
        int w = get_link(link[u], i);
        link[v] = next[w][c];        // the child exists by the suffix-link lemma
    }
    next[u][c] = v;
}
last = next[u][c];
++occ[last];
```

The suffix-link walk starts at $\operatorname{link}(u)$, not at $u$. Starting at $u$ would return $u$ itself for the character $c$, because $c P_u c$ was just made a child of $u$, and the link would point to the node it belongs to. The special case $\operatorname{len}(v) = 1$ is also essential: the longest proper palindromic suffix of a single character is the empty string, whose node is the empty root, while the general formula would find the single character itself.

### Counting occurrences

Every position increments the count of its longest palindromic suffix. A palindrome $P_v$ occurs ending at $j$ exactly when $v$ is on the suffix-link chain of $\operatorname{last}_j$, so one pass over the links pushes every count to all shorter palindromic suffixes.

```cpp
for (int v = nodes - 1; v >= 2; --v) {
    occ[link[v]] += occ[v];
}
long long total = 0;
for (int v = 2; v < nodes; ++v) {
    total += occ[v];
}
int distinct = nodes - 2;
```

The reverse order is valid because a suffix link always points to a node of smaller length, and a node of smaller length was created earlier. The two roots are skipped: they are not palindromic substrings that the problem counts.

## Step-by-step execution

Take $S = \texttt{abba}$. The roots are node $0$ (length $-1$) and node $1$ (length $0$). The table follows the insertion loop. The column "walk" lists the lengths of the nodes visited by the extension walk, including the node where it stops.

| $i$ | $c$ | `last` before | Walk over suffix links | $u$ | Action | `last` after | `occ` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `a` | empty | $0, -1$ | imaginary | create `a`, length $1$, link empty | `a` | `a`: 1 |
| 1 | `b` | `a` | $1, 0, -1$ | imaginary | create `b`, length $1$, link empty | `b` | `b`: 1 |
| 2 | `b` | `b` | $1, 0$ | empty | create `bb`, length $2$ | `bb` | `bb`: 1 |
| 3 | `a` | `bb` | $2$ | `bb` | create `abba`, length $4$ | `abba` | `abba`: 1 |

The walk column uses lengths rather than node numbers because the lengths are what the condition compares. At $i = 1$ the walk starts at `a` (length $1$), whose preceding position is $-1$, so it falls to the empty root (length $0$), whose preceding position is $0$ and holds `a` rather than `b`, and then to the imaginary root, which always succeeds. At $i = 2$ the empty root succeeds immediately because the character before the empty suffix is $S[1] = \texttt{b}$.

The suffix-link construction for the two new even palindromes is the part worth tracing separately.

| New node | $u$   | Start of link walk         | Visited               | $w$       | Link |
| -------- | ----- | -------------------------- | --------------------- | --------- | ---- |
| `bb`     | empty | link of empty is imaginary | imaginary             | imaginary | `b`  |
| `abba`   | `bb`  | link of `bb` is `b`        | `b`, empty, imaginary | imaginary | `a`  |

For `bb`, the link walk starts at the imaginary root and immediately finds that wrapping the imaginary string in `b` gives `b`, which is already a node. For `abba`, the walk starts at `b`, whose preceding character is $S[1] = \texttt{b}$ rather than `a`; the empty root fails because the preceding character is $S[2] = \texttt{b}$; the imaginary root succeeds, and wrapping it in `a` gives the existing node `a`. The link of `abba` is therefore `a`, not `bb`, which matches the table in the visual section.

After all four positions, the counts before propagation are one for each node: `a`, `b`, `bb` and `abba`. The reverse pass adds `abba` to its link `a`, and `bb` to its link `b`.

| Node   | Palindrome | Before propagation | Receives      | After propagation |
| ------ | ---------- | ------------------ | ------------- | ----------------- |
| `a`    | `a`        | 1                  | 1 from `abba` | 2                 |
| `b`    | `b`        | 1                  | 1 from `bb`   | 2                 |
| `bb`   | `bb`       | 1                  | none          | 1                 |
| `abba` | `abba`     | 1                  | none          | 1                 |

The distinct count is $6 - 2 = 4$. The total is $2 + 2 + 1 + 1 = 6$, which matches the six palindromic occurrences of `abba`: four single characters, one `bb`, and one `abba`.

## Correctness proof

::: math theorem Theorem
After the eertree of $S$ has been built and the occurrence counts have been propagated, the non-root nodes are in one-to-one correspondence with the distinct nonempty palindromic substrings of $S$, the value $\operatorname{occ}(v)$ is the number of occurrences of $P_v$, and $\operatorname{last}_i$ is the node of the longest palindromic suffix of $S[0..i]$.
:::

::: math proof Proof
The proof is by induction on the position $i$.

**The tree contains the right palindromes.** Before any character is read, the only nodes are the two roots. Suppose the claim holds after $S[0..i-1]$, and let $u$ be the node found by the extension walk. By the extension lemma, $c P_u c$ is the longest palindromic suffix of $S[0..i]$. If its edge already exists, the node was created at an earlier position and represents the same palindrome. Otherwise the algorithm creates it. Every node created this way represents a palindrome: it is $c P_u c$ with $P_u$ a palindrome. Every palindromic substring of $S[0..i]$ is either a substring of $S[0..i-1]$ or a palindromic suffix of $S[0..i]$; the first kind already has a node by the induction hypothesis, and the second kind is either the longest suffix just handled or a shorter palindromic suffix, which is a suffix of the longest one and therefore already has a node. Hence the node set is exactly the set of distinct nonempty palindromes.

**The links are correct.** For a new node $v = c P_u c$ of length at least two, the suffix-link lemma identifies the longest proper palindromic suffix as $c P_w c$, where $w$ is found by walking from $\operatorname{link}(u)$. The node for $c P_w c$ exists by the previous paragraph. For a node of length one, the longest proper palindromic suffix is the empty string, whose node is the empty root. The two roots link by definition: the imaginary root links to itself and the empty root links to the imaginary root. So every link points to the longest proper palindromic suffix.

**`last` is the longest suffix.** The extension lemma says that the node found by the walk is the longest palindromic suffix of $S[0..i]$, and the algorithm assigns it to `last`. This is the induction step for `last`.

**The occurrence counts are exact.** A node $v$ is incremented at position $j$ exactly when $P_v$ is the longest palindromic suffix of $S[0..j]$. At every position $j$, the palindromic suffixes of $S[0..j]$ are exactly the nodes on the suffix-link chain of $\operatorname{last}_j$, by the chain lemma. The reverse propagation adds the count of every node to its link, so after the pass the count of $v$ is the number of positions whose chain contains $v$. That is exactly the number of positions where $P_v$ ends, which is the definition of the occurrence count.

**The two answers follow.** The non-root nodes are the distinct nonempty palindromes, so their number is the distinct count. Summing their occurrence counts counts every palindromic occurrence once, so the sum is the total number of palindromic substrings counting multiplicity. $\square$
:::

## Complexity analysis

| Quantity          | Cost                                                                |
| ----------------- | ------------------------------------------------------------------- |
| Nodes             | At most $n + 2$                                                     |
| Edges             | At most $n$, one per non-root node                                  |
| Extension walks   | $O(n)$ suffix-link steps in total                                   |
| Node creation     | $O(1)$ amortized per character                                      |
| Transition lookup | $O(1)$ with a dense table, $O(\sigma)$ with a short adjacency list  |
| Propagation       | $O(n)$                                                              |
| Time              | $O(n)$ for a fixed alphabet, $O(n \log \sigma)$ with a balanced map |
| Space             | $O(n)$ with sparse transitions, $O(\sigma n)$ with a dense table    |

The node bound is the corollary of the one-new-palindrome lemma. Every position creates at most one node, and every node except the roots has exactly one incoming edge, so the edge count is at most $n$.

The walk bound is amortized. Let $\Phi_i = \operatorname{len}(\operatorname{last}_i)$ be the length of the longest palindromic suffix after position $i$. The new suffix is $c P_u c$ where $u$ lies on the suffix-link chain of the previous `last`, so $\operatorname{len}(u) \le \Phi_{i-1}$ and $\Phi_i \le \Phi_{i-1} + 2$. Every failed comparison in the extension walk replaces the current node by a shorter proper palindromic suffix, so the current length strictly decreases. The suffix-link construction for a new node starts one link below the node just found and continues the same descent. Since the length starts at $0$, increases by at most two per character, and never becomes negative, the total decrease over all walks is at most $2n + 1$. The total number of suffix-link steps is therefore $O(n)$.

The transition lookup depends on the representation. A dense table with one row of $\sigma$ integers per node gives $O(1)$ per lookup but costs $\sigma n$ integers of memory. For a $26$-letter alphabet and $n = 10^6$, the table alone is $26 \times 10^6$ integers, about $104$ megabytes, which is too much for many judges once the other arrays are counted. The published implementations use a short adjacency list per node. A node has at most $\sigma$ children, so a lookup scans at most $26$ entries, which is $O(\sigma) = O(1)$ for a fixed alphabet. The total time is still linear, with a larger constant. A balanced map per node gives $O(\log \sigma)$ per lookup and $O(n \log \sigma)$ time.

The counts can be large. The number of distinct palindromes is at most $n$ and fits in a 32-bit integer for every realistic input. The total number of palindromic substrings is at most $n(n+1)/2$, which reaches $5 \times 10^{11}$ at $n = 10^6$ and does not fit in 32 bits. The occurrence count of a single palindrome is at most $n$, but the sum needs a 64-bit integer. C, C++, Java and Pascal use a signed 64-bit type, Python uses arbitrary precision, and JavaScript uses a Number, which is exact below $2^{53}$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count distinct palindromic substrings | The eertree; every node is one distinct palindrome |
| Count palindromic substrings with multiplicity | The eertree with occurrence propagation, or Manacher's radii |
| Longest palindromic substring only | Manacher, which needs less memory and less code |
| Occurrences of every distinct palindrome | The eertree plus one reverse pass over the suffix links |
| Longest palindromic suffix of every prefix | The eertree, reading `last` after each character |
| Number of palindromic suffixes ending at each position | The eertree, using the depth of `last` in the suffix-link tree |
| Palindromic factorization or minimum palindrome partition | The eertree with series links |
| Count symmetric block partitions | The interleaving reduction plus an eertree DP with series links |
| Many substring queries on one fixed string | A suffix automaton, a suffix array or hashing |
| One pattern inside one text | KMP, not an eertree |
| The string changes in the middle | A different structure; the eertree is a one-pass construction |
| The alphabet is large or unknown | Sparse transitions or maps, not a dense table |

The first two rows are the decision this article exists for. The eertree is the only structure in this list that stores the distinct palindromes themselves. Manacher stores a radius per center, which is enough for the longest palindrome and for the total count, but it does not give a node per distinct palindrome and it cannot answer "how many times does this particular palindrome occur" without additional work.

The factorization rows are the advanced use. A partition of a string into palindromes is a path in the directed graph whose vertices are positions and whose edges are palindromic substrings. The eertree enumerates the palindromic suffixes of every prefix, and series links group them into arithmetic progressions so that the dynamic program does not pay for every suffix separately. The next two worked problems show the counting version and the symmetric-block version.

The row about many queries is the boundary of the technique. The eertree is built for one string and answers questions about prefixes of that string. If the queries ask about arbitrary substrings, the suffix structure of the whole text is the right tool, because an eertree of every substring would be quadratic.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal and JavaScript. They implement the same contract.

- The first line holds a string $S$ of lowercase Latin letters; it may be empty.
- The program prints two lines. The first line holds the number of distinct nonempty palindromic substrings of $S$. The second line holds the number of palindromic substrings of $S$, counting occurrences at different positions separately.
- If the input contains no characters, both answers are $0$.

Every version uses the same two-root eertree. The roots have lengths $-1$ and $0$. A suffix-link walk finds the longest palindromic suffix that can be extended by the new character, the edge either exists or creates one node, and the occurrence counts are pushed up the suffix links in reverse creation order. C, C++, Java and Pascal use a signed 64-bit type for the total. Python uses arbitrary-precision integers, and JavaScript uses a Number, which is exact for every string that fits in memory.

The transition table is sparse in all six versions. Each node owns a linked list of its children, stored in parallel arrays `head`, `to`, `next` and `label`. A node has at most $26$ children for the lowercase alphabet, so a lookup scans a short list and the memory stays linear. This is the representation that survives $n = 10^6$; the dense table of $26$ integers per node would need about $104$ megabytes for the table alone.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and are compiled and run by the same validation as the other four.

The sources are under `implementations/strings/palindrome-tree/`, with one directory per language and the source file named in the manifest. The manifest carries the time and space of every variant, its input and output contract, and the verification status.

## Recursion decision

The eertree is iterative in every version. The construction is a left-to-right loop, the extension is a `while` loop over suffix links, and the propagation is a reverse loop over node indices. A recursive formulation is possible but is a bad idea for two independent reasons.

The first is the call stack. The suffix links of a string of $n$ identical characters form a path of length $n$, because the longest proper palindromic suffix of `a` repeated $k$ times is `a` repeated $k-1$ times. A recursive walk on that chain uses $n$ frames, and every language in the implementation set has a smaller default stack than that for large $n$.

The second is the order. The propagation needs every child to be processed before its parent in the suffix-link tree. The creation order already provides that order, because a link points to a shorter palindrome that was created earlier. A recursive depth-first traversal would need an explicit tree and an explicit order, while the reverse loop over node indices is one pass and no recursion.

| Language   | Practical recursion depth            | Recommendation |
| ---------- | ------------------------------------ | -------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative      |
| Java       | About $10^4$ frames                  | Iterative      |
| Python     | The interpreter limit of 1000        | Iterative      |
| Pascal     | The operating system stack           | Iterative      |
| JavaScript | About $10^4$ frames                  | Iterative      |

The same decision applies to the tree itself. The eertree is a tree, but it is stored as an array of nodes with suffix links, not as a set of recursive objects. The array is what makes the reverse propagation possible.

## Implementation walkthrough

Five details decide whether an implementation is correct.

**The two roots.** The imaginary root must have length $-1$ and must link to itself. The empty root must have length $0$ and must link to the imaginary root. If the imaginary root is missing, a single character has no parent and the extension walk either reads outside the string or loops forever. If the empty root links to itself, the walk on a failed single-character extension never reaches a node whose preceding position is valid.

**The bound in the walk.** The condition is

```cpp
while (i - 1 - len[v] < 0 || s[i - 1 - len[v]] != s[i]) {
    v = link[v];
}
```

The left side of the `||` must be checked first. In C and C++, `||` short-circuits, so the index is not evaluated when it is negative. In a language without short-circuit evaluation, the bound has to be a separate `if` before the character comparison. The imaginary root makes the loop terminate, because its length is $-1$ and the computed position is $i$, where the character equals itself.

**The link walk starts at `link[u]`.** The new palindrome is $c P_u c$. Its proper suffixes of length at least two are $c P_z c$ for proper palindromic suffixes $P_z$ of $P_u$, and the longest one is found by walking from $\operatorname{link}(u)$. Starting at $u$ would consider $c P_u c$ itself, which is the new node, and would make the suffix link point to the node it belongs to.

**The length-one case.** A new node of length one has the empty string as its longest proper palindromic suffix, so its link is the empty root. The general walk would find the imaginary root and then the child of the imaginary root by $c$, which is the new node itself. The special case is one line and it is not optional.

**The propagation order.** The loop runs from the last created node down to node $2$. A suffix link always points to a node of smaller length, and the smaller palindrome was created at an earlier position, so its index is smaller. The reverse order therefore processes every node after all of its suffix-link children. A forward loop adds a node's count to its link before the node has received the counts of its own children, and the total comes out too small.

A compact version of the core, with the transition lookup written as a function:

```cpp
int find_child(int v, int c) {
    for (int e = head[v]; e != -1; e = next[e]) {
        if (label[e] == c) return to[e];
    }
    return -1;
}

for (int i = 0; i < n; ++i) {
    int u = get_link(last, i);
    int c = s[i] - 'a';
    int v = find_child(u, c);
    if (v == -1) {
        v = nodes++;
        len[v] = len[u] + 2;
        link[v] = (len[v] == 1) ? 1 : find_child(get_link(link[u], i), c);
        add_child(u, c, v);
    }
    last = v;
    ++occ[last];
}
```

The two calls to `get_link` are the only places where the walk appears. The first finds the parent, the second finds the parent of the suffix link. The second call starts at `link[u]`, and the child it looks for is guaranteed to exist by the suffix-link lemma.

The occurrence counts are 64-bit in the four compiled languages. A total of $n(n+1)/2$ reaches $5 \times 10^{11}$ at $n = 10^6$, so a 32-bit accumulator silently wraps around on the largest tests. The distinct count is at most $n$ and fits in 32 bits.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using only the empty root | Single characters have no parent, or the extension walk reads before the string | Keep the imaginary root with length $-1$ |
| Linking the empty root to itself | A failed walk never terminates at a valid sentinel | Link the empty root to the imaginary root |
| Starting the suffix-link walk at $u$ | The new node's link points to itself or to the wrong palindrome | Start at $\operatorname{link}(u)$ |
| Forgetting the length-one special case | The suffix link of a single character is itself | Link length one to the empty root |
| Counting only the longest suffix | The total is the number of positions, not the number of palindromic substrings | Propagate the counts over the suffix links |
| Propagating in creation order | A parent receives its children's counts before they are complete | Loop from the last node down to node $2$ |
| Using a 32-bit total | The sum wraps around above $2^{31}$ | Use a 64-bit type |
| Allocating a dense table for a large string | The table costs $\sigma n$ integers | Use a short adjacency list |
| Reading with `scanf("%s", ...)` | An empty or whitespace-containing line is misread | Read the whole line with `getline` or a growable buffer |
| Treating distinct and multiplicity as the same number | The two outputs are confused on every input with a repeated palindrome | Keep two separate sums |

### Why this fails: counting only the longest suffix

The plausible wrong approach is to increment one counter per position and print it as the total. The argument sounds right: every position has one longest palindromic suffix, so there are $n$ palindromic suffixes, one per position. That counts the number of positions, not the number of palindromic substrings.

The smallest counterexample is `aa`. Its palindromic substrings are `a` at position $0$, `a` at position $1$, and `aa` at positions $0$ through $1$, so the correct total is $3$ and the distinct count is $2$. The one-per-position counter reports $2$: one for `a` at position $0$ and one for `aa` at position $1$. The missing occurrence is the `a` at position $1$, which is a shorter palindromic suffix of `aa` and is not the longest suffix at its position.

The propagation pass is exactly what recovers it. Before propagation, `occ` holds one unit for `a` and one for `aa`. The reverse loop adds `occ[aa]` to `occ[link[aa]] = occ[a]`, so `a` becomes $2$ and the sum becomes $3$. On `aaaa`, the same bug reports $4$ instead of $10$, because the four longest suffixes have lengths $1, 2, 3, 4$ while the true counts are $4, 3, 2, 1$.

A second failure is close by. If the suffix link of `aa` is set to `aa` itself, the reverse loop adds the node's count to itself. On `aa` the total is accidentally still $3$, because the inflated count of `aa` is offset by the missing count of `a`, but the per-palindrome counts are wrong. The next character exposes the bug: on `aaa` the extension walk from `aa` follows the self-link forever, because `aa` cannot be extended by `a` at that position. The smallest input that hangs is `aaa`, and the smallest input whose per-palindrome counts are wrong is `aa`. The fix is the length-one special case and the start at $\operatorname{link}(u)$. The length-one special case keeps the link of a single character at the empty root, and the start at $\operatorname{link}(u)$ keeps the link of a longer palindrome at a proper suffix instead of at itself.

## Variants and extensions

- **Occurrence counts per position.** The depth of `last` in the suffix-link tree, with the empty root at depth zero, is the number of nonempty palindromic suffixes ending at the current position. It is the sum of the occurrence counts of the chain, and it answers "how many palindromic substrings end here" without a separate propagation.
- **Series links.** A series link groups a maximal run of suffix links whose length differences are equal. The palindromic suffixes of a prefix then split into $O(\log n)$ arithmetic progressions, and a dynamic program over palindrome partitions can evaluate each progression with one running sum instead of iterating over every suffix. This is the standard tool for palindromic factorization and for counting partitions into palindromes.
- **The interleaving reduction.** For a string of even length, interleaving the characters from the two ends turns a symmetric block partition into a partition into even-length palindromes. The next worked problem uses this reduction; it is the reason the eertree appears in problems that do not mention distinct palindromes at all.
- **Double-ended eertree.** Adding characters to both ends of the string is possible with a second `last` pointer and two-root bookkeeping. The structure is no longer a single left-to-right build, but the node and link definitions survive.
- **Palindromic tree over pairs.** For problems about two strings, the alphabet can be the set of pairs of characters. A palindrome over the pair alphabet represents a pair of equal substrings read from the two ends, which is the same trick as the interleaving reduction in a different costume.
- **Sparse transitions for large alphabets.** A map from character to child replaces the $26$-entry row. The time becomes $O(n \log \sigma)$ and the space stays $O(n)$.
- **Manacher instead of an eertree.** When only the longest palindrome or the total number of palindromic substrings is required, Manacher's radius array is smaller and faster. The eertree is for questions about the distinct palindromes themselves.
- **Suffix automaton or suffix array.** When the queries are about arbitrary substrings of a fixed text, the suffix structure of the whole text is the right index. The eertree is a prefix structure, not a general substring index.

## Contest strategy

1. Read the statement for the words "distinct", "different", "unique" and "how many times". The first group means the node count; the second means the occurrence sum. Getting this wrong is the most common failure on the easiest version of the problem.
2. Write the two roots and the extension walk on paper before writing code. Trace `abba` by hand. The tree has only six nodes, and the trace exposes every index bound.
3. Test the four smallest cases explicitly: `a`, `aa`, `ab`, `abba`. The first exercises the length-one link, the second exercises propagation, the third exercises the imaginary root on a mismatch, and the fourth exercises a link that is not the previous even palindrome.
4. Compare against a brute force on a few hundred random strings of length at most ten. The brute force is ten lines and it catches every off-by-one in the walk.
5. Use a 64-bit total from the first line of code. The total is quadratic in $n$ even though the structure is linear.
6. Choose the transition representation before writing the node struct. For $n \le 10^5$ a dense table is fine; for $n = 10^6$ it is $104$ megabytes and the sparse list is the safer choice.
7. If the problem asks for the longest palindromic suffix of every prefix, record `last` after every character and do not run a second pass.
8. If the problem asks for a palindrome partition, stop and read about series links before writing the dynamic program. The naive sum over every palindromic suffix is quadratic on a run of one character.
9. If the problem only asks for the longest palindrome, close this article and use Manacher. The eertree is more structure than the question needs.
10. If the input can be empty, decide what the two answers are before reading the string. Both counts are zero, and the structure has only the two roots.

## Worked problems

### Problem 1: distinct palindromes after every character

**Restatement.** Given a string $S$ of length $n \le 10^5$, after each character $S[i]$ print the number of distinct nonempty palindromic substrings of the prefix $S[0..i]$.

**Naive baseline.** For every prefix, enumerate every substring and insert the palindromic ones into a set. The prefixes have $\Theta(n^2)$ substrings in total, and the set operations add another factor, so the cost is at least quadratic and often cubic.

**Insight.** The eertree creates at most one node per character, and every non-root node is one distinct nonempty palindrome. The answer after position $i$ is therefore the current node count minus the two roots.

**Derivation.** Build the eertree incrementally. After processing $S[i]$, output `nodes - 2`.

**Correctness.** By the one-new-palindrome lemma, the node set after $i$ is exactly the set of distinct palindromic substrings of $S[0..i]$. The two roots are the only nodes that are not nonempty palindromes, so the node count minus two is the required number.

**Complexity.** $O(n)$ time and $O(n)$ space. The output itself has $n$ numbers.

**Common wrong approach.** Printing the number of palindromic suffixes of the current prefix, which is the length of the suffix-link chain of `last`, instead of the total number of distinct palindromes. The two agree on `aa` but differ on `aba`: after the last character the distinct palindromes are `a`, `b` and `aba`, so the answer is $3$, while the palindromic suffixes ending at the last position are `a` and `aba`, so the chain length is $2$.

### Problem 2: crossing pairs of palindromic substrings

**Restatement.** Given a string of length $n \le 2 \times 10^6$, count the unordered pairs of palindromic substrings, taken as occurrences, that share at least one position. Two occurrences of the same palindrome at different positions are different objects. The answer is taken modulo $51123987$.

**Naive baseline.** Enumerate every palindromic occurrence in $O(n^2)$ time and test every pair, which is $O(n^4)$ and hopeless at the constraint.

**Insight.** Count the complement. Two occurrences do not cross exactly when one ends strictly before the other starts. Every unordered pair is either crossing or disjoint, so the answer is the total number of pairs minus the number of disjoint pairs. The eertree gives the number of palindromic occurrences ending at every position in one pass: it is the number of nonempty palindromic suffixes of that prefix, which is the depth of `last` in the suffix-link tree when the empty root has depth zero and the imaginary root is ignored.

**Derivation.** Build the eertree of $S$. For each position $i$, let `end[i]` be the depth of `last` after reading $S[i]$; this is the number of palindromic occurrences ending at $i$. Let $T$ be the sum of `end`. Build the eertree of the reversed string and let `start[j]` be the depth after reading the reversed prefix, mapped back so that it counts occurrences starting at $j$. Sweep left to right with a running prefix sum of `end`; before adding `end[j]`, the prefix sum counts occurrences that end strictly before $j$, and each of them forms a disjoint pair with every occurrence that starts at $j$. Subtract that product sum from the total number of unordered pairs, $T(T-1)/2$, modulo $51123987$. Because the modulus is odd and the pair count needs a division by two, multiply by $(51123987 + 1) / 2 = 25561994$ modulo the same modulus.

**Correctness.** Every unordered pair of occurrences either intersects or is disjoint, and the two cases are exhaustive and exclusive. A disjoint pair has a unique later occurrence; if it starts at $j$, the earlier occurrence ends before $j$, so it is counted exactly once in the product for position $j$. The eertree depth is the number of palindromic suffixes ending at a position, which is the number of occurrences ending there, and the reversed pass gives the symmetric count for starts. The subtraction therefore removes exactly the disjoint pairs.

**Complexity.** $O(n)$ time and $O(n)$ space for the two eertrees. The modulo arithmetic is constant time per position.

**Common wrong approach.** Counting ordered pairs by forgetting the division by two, which doubles the answer. On `aa` the three occurrences are `a` at $0$, `a` at $1$ and `aa` at $0..1$; the crossing pairs are `(a at 0, aa)` and `(a at 1, aa)`, so the answer is $2$. The ordered count would report $4$. A 32-bit accumulator for the pair count also overflows, because $T$ can reach $2 \times 10^{12}$ on a string of repeated characters.

### Problem 3: symmetric block partitions

**Restatement.** Given a string $S$ of even length $n \le 10^6$, count the partitions of $S$ into an even number of nonempty blocks $p_1, p_2, \ldots, p_k$ such that $p_i = p_{k-i+1}$ for every $i$. The answer is taken modulo $10^9 + 7$.

**Naive baseline.** Enumerate every composition of $n$ into blocks, which is $2^{n-1}$ compositions, and test the symmetry condition. Even the dynamic programs that check palindromes naively cost $O(n^2)$ or worse.

**Insight.** Interleave the characters from the two ends of $S$ into a new string

$$
T = S[0]\,S[n-1]\,S[1]\,S[n-2]\,\ldots\,S[n/2-1]\,S[n/2].
$$

A block of $T$ of length $2L$ consists of $L$ characters from the left half of $S$ interleaved with $L$ characters from the right half in reverse order. It is a palindrome exactly when those two blocks of $S$ are equal. A symmetric partition of $S$ with $2m$ blocks therefore corresponds to a partition of $T$ into $m$ even-length palindromes, and the correspondence is one-to-one.

**Derivation.** Build the eertree of $T$. Let `dp[i]` be the number of ways to partition the prefix $T[0..i-1]$ into even-length palindromes, with `dp[0] = 1`. Then

$$
\operatorname{dp}[i] = \sum_{L \in \mathcal{P}_i,\; L \text{ even}} \operatorname{dp}[i-L],
$$

where $\mathcal{P}_i$ is the set of palindromic suffix lengths of $T[0..i-1]$. The eertree enumerates $\mathcal{P}_i$ as the suffix-link chain of `last`. The chain can be linear, so the sum is grouped by series links: a series is a maximal run of suffix links with the same length difference, the lengths in a series form an arithmetic progression, and one running sum per series evaluates every term of that progression. The number of series on a chain is $O(\log n)$, so each position costs $O(\log n)$ and the whole dynamic program costs $O(n \log n)$. The answer is `dp[n]`.

**Correctness.** The interleaving is a bijection between symmetric partitions of $S$ and partitions of $T$ into even-length palindromes. The dynamic program counts every partition of $T$ exactly once by its last block, and the eertree enumerates exactly the palindromic last blocks. The series-link grouping only rearranges the same sum, so it does not change the count.

**Complexity.** $O(n \log n)$ time and $O(n)$ space. The series-link dynamic program is the standard way to avoid the quadratic suffix enumeration; on a string of $n$ identical characters the plain chain has length $n$ at every position.

**Common wrong approach.** Allowing odd-length palindromes in $T$. An odd block of $T$ would pair a character from the left half with a character from the right half at the center, which does not correspond to an equal pair of blocks in $S$; the partition of $S$ would have an odd number of blocks or a block that crosses the center. On `abba`, the symmetric partition `a|bb|a` uses three blocks and is not allowed, and the only valid partition is `a|b|b|a` with four blocks. The transformed string is `aabb`, whose only even-palindromic partition is `aa|bb`; allowing odd palindromes would also accept `a|a|bb` or `aa|b|b`, which are wrong.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for the longest palindrome, the total number of palindromic substrings, the distinct palindromes, or the occurrences of each palindrome. Write down which of the four the eertree answers and which Manacher answers.
2. **Direct application.** Implement the two roots, the extension walk, the link construction and the propagation. Check the four strings `a`, `aa`, `ab`, `abba` against a brute force.
3. **Adaptation.** Modify the program to print the number of distinct palindromes after every prefix, then to print the number of palindromic suffixes ending at every position. Both changes are one line in the main loop, and they exercise the difference between the node count and the chain depth.
4. **Combination.** Add occurrence counts for every distinct palindrome and print the most frequent one. Then combine the eertree with a prefix-sum array to answer a query about palindromes ending in a range of positions.
5. **Challenge.** Implement the series-link dynamic program for the minimum palindrome partition and compare its running time against the plain suffix-chain version on a string of $10^5$ identical characters. The plain version is quadratic; the series version is near-linear.
6. **Transfer.** Recognize the interleaving reduction in a problem about symmetric block partitions, and recognize the reversed-string trick in a problem about palindromes starting at every position. Both are eertree applications that do not mention "distinct palindromes" in the statement.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does the eertree need two roots, and what length does each have? (Formal model)
2. Why is at most one distinct palindrome new at each position? (Key insight)
3. What does the suffix link of a node point to, and why is it the right fallback? (Formal model)
4. Why does the extension walk always terminate at the imaginary root? (Algorithm derivation)
5. Why does the suffix-link construction start at $\operatorname{link}(u)$ rather than at $u$? (Implementation walkthrough)
6. Why is a new node of length one linked to the empty root instead of the imaginary root? (Implementation walkthrough)
7. Why must the occurrence counts be propagated in reverse creation order? (Algorithm derivation)
8. What is the smallest string on which counting only the longest suffix gives the wrong total, and what are the two answers? (Common mistakes)
9. Why is the total number of distinct palindromes at most $n$, while the total number of palindromic substrings can be $\Theta(n^2)$? (Complexity analysis)
10. When is Manacher the better choice than the eertree? (Algorithm selection)
11. What does the interleaving reduction turn a symmetric block partition into, and why must the palindromes be even? (Worked problems)
12. Why does a dense transition table cost too much at $n = 10^6$, and what replaces it? (Complexity analysis)

## Further reading

- The subject index lists this technique beside the other string algorithms: [the strings](/algorithms/strings/).
- The failure-function idea that the suffix link generalizes is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The linear-time algorithm for the longest palindromic substring and for the total number of palindromic substrings is in [the Manacher algorithm](/algorithms/strings/manacher).
- The multi-pattern version of the same failure-link idea is in [Aho-Corasick](/algorithms/strings/aho-corasick).
- The hashing alternative for comparing many substrings in constant time is in [rolling hash](/algorithms/strings/rolling-hash).
- The suffix structure for queries about arbitrary substrings of a fixed text is in [suffix arrays](/algorithms/strings/suffix-array).
- The trie that stores a set of strings and their prefixes is in [tries](/algorithms/strings/trie).
- The dynamic program that counts factorizations by their last part is the same shape as [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The modular arithmetic used when the answer must be reduced modulo a prime is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The counting argument that subtracts the complement, used in the crossing-pairs problem, is the same idea as [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
