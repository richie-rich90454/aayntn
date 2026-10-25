---
id: strings.suffix-tree
title: Suffix trees
summary: Compress the trie of all suffixes into a tree whose edges are labeled by substrings, so the number of distinct substrings and the longest repeated substring are read from sums over the edges.
division: [gold, platinum]
subjects: [strings]
level: advanced
importance: advanced-technique
keywords:
    [
        suffix tree,
        compact trie,
        edge label,
        distinct substrings,
        longest repeated substring,
        generalized suffix tree,
        ukkonen,
        suffix links,
    ]
prerequisites:
    required: [strings.trie, foundations.complexity]
    recommended: [strings.suffix-array, strings.suffix-automaton, strings.kmp]
complexity:
    time: "O(n^2) for the published quadratic construction; O(n) for both answers after the build"
    space: "O(n) nodes with 27 child slots each"
assumptions:
    - The string has length at most 2000 in the published contract, so inserting every suffix and comparing characters is fast enough.
    - A sentinel outside the alphabet is appended, so no suffix is a prefix of another and every suffix ends at its own leaf.
    - The alphabet is small and fixed, so a node can carry one child slot per symbol.
    - The number of distinct substrings is accumulated in 64 bits, because it can exceed a 32-bit integer for a longer string.
implementations: strings.suffix-tree
reviewed: false
---

<AlgorithmSummary algorithm="strings.suffix-tree" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="strings.suffix-tree" />

## At a glance

A suffix tree of a string is the compact trie of all its suffixes. The suffixes share long prefixes, and the trie would repeat those prefixes at every depth; the suffix tree keeps only the branching points, so a string of length $n$ produces at most $2n+1$ nodes instead of $\Theta(n^2)$.

The compression turns substring questions into measurements on edges. Every point on an edge corresponds to exactly one distinct substring, and the number of integer points on the edge is its label length. Hence

$$
\#\{\text{distinct nonempty substrings of } s\} = \sum_{\text{edges}} \lvert \operatorname{label}(e) \rvert - (n+1),
$$

where the appended sentinel makes the number of suffixes $n+1$ and the subtraction removes exactly the substrings that contain the sentinel. In the language of nodes, the same sum is

$$
\sum_{v \ne \text{root}} \bigl(\operatorname{depth}(v) - \operatorname{depth}(\operatorname{parent}(v))\bigr) - (n+1),
$$

which is the "length range" of a node: the edge above $v$ represents one distinct substring for every integer length between the two depths.

The longest repeated substring has an equally short description: it is the string depth of the deepest node with at least two children. Such a node is the first branching point of two suffixes, and no interior point of an edge can be deeper without extending the same repeat to the end of the edge.

The published implementation builds the tree in $O(n^2)$ time by inserting the suffixes one at a time and splitting an edge whenever two suffixes diverge inside it. The contract caps $n$ at 2000, so this is fast: a string of 2000 characters builds in milliseconds in every language. Linear constructions exist, and the article separates the structural ideas, which are the real subject, from the construction that the listings use.

## Problem motivation

A fixed document of $n = 10^5$ characters is queried again and again. One client asks how many distinct substrings it contains. Another asks for the longest substring that occurs at least twice. A third supplies a short pattern and wants the number of occurrences, and a fourth supplies a second document and wants the longest string that appears in both. The document does not change between queries; only the questions do.

The obvious representation is a set of all substrings. There are $n(n+1)/2$ substrings counted with multiplicity, about $5 \cdot 10^9$ for $n = 10^5$, and their total length is $\Theta(n^3)$. Writing them down costs more time than the entire query session and more memory than the machine has.

The naive trie of all suffixes is smaller but still quadratic. A string such as `aaaa...a` has a suffix trie with $\Theta(n^2)$ nodes, because every suffix contributes a separate path and the paths do not share enough to compensate. At $n = 10^5$ the trie is out of the question, and even at $n = 2000$ the $2 \cdot 10^6$ nodes are a warning sign rather than a solution.

A suffix array is a correct alternative. It sorts the suffixes in $O(n \log n)$, and the number of distinct substrings is the total number of substrings minus the sum of the adjacent longest common prefixes. The longest repeated substring is the maximum of that array. That is a complete solution with less machinery than a suffix tree, but the array does not expose the tree structure, and questions about branching, colors, and subtrees need an extra layer of intervals and range queries.

The suffix tree keeps the structure explicitly. A repeated substring becomes a node, its occurrences become the leaves below that node, and the strings that share an occurrence set become one edge. Those three translations are what the harder problems need, and they are the reason the suffix tree is worth learning even when a suffix array would answer the two questions in this article.

The construction below is quadratic, and the article says so in every section where the bound matters. At $n \le 2000$ that is the right trade: the code is short enough to check by hand, it uses $O(n)$ memory, and it produces the true suffix tree rather than a surrogate. The linear-time Ukkonen construction is a separate topic, mentioned under variants and extensions.

## Recognition patterns

The suffix tree is the right tool when the statement contains some of these phrases.

- "Count the distinct substrings", "how many different substrings", "the number of different nonempty strings that occur in $s$".
- "Find the longest substring that occurs at least twice", "the longest repeated substring", "the longest string that appears in two documents".
- "For each substring, how many times does it occur", with a fixed text and many queries.
- "How many distinct substrings occur at least $k$ times", "the sum of a function over all distinct substrings".
- "Given two strings, find the longest common substring", or "the shortest common substring that is unique in both".
- "A fixed text and a stream of patterns", where the patterns are the queries and the text is the index.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One pattern, one text | KMP, with a smaller constant |
| A dictionary of patterns and one text | Aho-Corasick, which indexes the patterns |
| A fixed text and many substring questions | A suffix tree, a suffix array, or a suffix automaton |
| $n \le 2000$ | The quadratic construction in this article |
| $n = 10^5$ or more | Ukkonen, a suffix array plus LCP, or a suffix automaton |
| The answer counts distinct strings | Sum the edge lengths, then subtract the suffixes |
| The answer is the longest repeat | The deepest node with at least two children |
| Every occurrence must be located | Subtree leaves, or a suffix array interval |
| Uniqueness is required in each of several strings | A generalized tree with one color per string |
| The text changes between queries | Rebuild, or use a dynamic structure; a static tree does not absorb appends cheaply |
| The alphabet is large or unknown | Store edges in a hash map instead of a dense child table |
| The question is about prefixes of a fixed dictionary | A trie or Aho-Corasick, not a suffix tree |

The row that catches people is the third from the bottom. A suffix tree indexes one text. If the queries are patterns and the text is fixed, it answers each query by walking the pattern, without scanning the text again. If the dictionary is fixed and the texts change, Aho-Corasick is the right orientation. Both structures are tries, and confusing which side is indexed is the most common modeling error in this subject.

The other row worth reading twice is the one about uniqueness in several strings. A subtree in a generalized suffix tree contains leaves from every input string, and a node knows how many leaves of each color it has. That single fact answers "occurs once in each", "occurs in at least $k$ documents", and "the shortest common substring" with the same traversal.

## Naive approach

The first baseline enumerates every substring and inserts it into a hash set. It is correct, it is short, and it is the reference for small random tests.

```cpp
std::unordered_set<std::string> distinct_substrings(const std::string& s) {
    std::unordered_set<std::string> seen;
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        for (int j = i; j < static_cast<int>(s.size()); ++j) {
            seen.insert(s.substr(i, j - i + 1));
        }
    }
    return seen;
}
```

The number of insertions is $n(n+1)/2$, and each insertion copies up to $n$ characters, so the total work is $\Theta(n^3)$ and the memory is $\Theta(n^3)$ in the worst case. For $n = 2000$ it is already well over a billion character copies, which is why the baseline is only for tests of length ten or twenty.

The second baseline is the suffix trie. It stores every suffix in an ordinary trie, one node per character, and every node then represents a distinct substring.

```cpp
int suffix_trie_nodes(const std::string& s) {
    std::vector<std::array<int, 27>> go(1);
    go[0].fill(-1);
    int count = 1;
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        int v = 0;
        for (int j = i; j < static_cast<int>(s.size()); ++j) {
            int c = s[j] - 'a';
            if (go[v][c] == -1) {
                go[v][c] = count++;
                go.emplace_back();
                go.back().fill(-1);
            }
            v = go[v][c];
        }
    }
    return count;
}
```

This is $O(n^2)$ time and memory, and the count of nodes is exactly the number of distinct nonempty substrings plus one. That identity is the definition of the answer, but the structure is too large to build. The suffix tree is the same object with every non-branching chain of nodes contracted into one edge. At $n = 2000$ the trie has up to two million nodes; the compressed tree has at most four thousand.

The third baseline is a suffix array with a comparison sort. It runs in $O(n^2 \log n)$ worst case and $O(n)$ memory, and it is the right tool for the two questions of this article on large inputs. It is not a suffix tree, though, and it does not by itself answer the color and subtree questions that motivate the tree.

All three baselines are useful. The set is the correctness oracle, and the trie is the shape of the solution without the compression idea.

## Key insight

The suffix trie has one node for every prefix of every suffix, which means one node for every distinct substring. Most of those nodes have exactly one child: after reading a prefix that occurs only once, there is only one way to continue. A node with one child carries no branching information, so it can be merged with its child into a single edge whose label is the concatenation of the two old labels.

Doing that everywhere leaves a tree in which every internal node has at least two children. The number of leaves is the number of suffixes, and a tree with $L$ leaves and internal degree at least two has at most $L-1$ internal nodes. Hence the compressed tree has at most $2L-1$ nodes, which is linear in the number of suffixes. That is the entire compression argument.

What survives the compression is the part that answers substring questions.

- Every distinct substring of the text is a **locus**: either a node, or a point strictly inside an edge. The path from the root to the locus spells the substring, and the locus is unique because a trie has one path per string.
- The **edge length** is the number of integer points on the edge, and each of them is a different substring. Summing edge lengths therefore counts every distinct substring once.
- The **string depth** of a node is the length of the string it spells. A repeat is a string that is a prefix of two suffixes, so its locus has at least two leaves below it. If such a locus is inside an edge, sliding it down to the end of the same edge keeps the same leaves and makes the string longer, so the longest repeat is attained at a node, and specifically at a node with at least two children.

The sentinel is the second idea, and it removes every special case. Append a character that occurs nowhere in the text. Now no suffix is a prefix of another suffix, because the shorter suffix would have to end with the sentinel in the middle of the longer one. Every suffix ends at its own leaf, every suffix ends only when the sentinel is consumed, and the tree has exactly $n+1$ leaves.

The price of the sentinel is that the tree also contains substrings that use it. There are exactly $n+1$ of those, one per suffix, because the sentinel is the last character of the text and a substring that contains it must end at the last position. Subtract $n+1$ from the total edge length and only the substrings of the original text remain.

The construction is the third idea, and it is deliberately simple. Insert the suffixes in order. At each step, walk down from the root along the edges whose labels match the new suffix. If the walk consumes a whole edge, continue at its child. If it stops inside an edge, split that edge at the stopping point, attach the old continuation and a new leaf to the new internal node, and stop. If there is no child for the next character, attach a new leaf and stop. Each suffix touches at most $n$ edges and compares at most $n$ characters, so the whole build is $O(n^2)$.

## Visual intuition

Take `banana` and append the sentinel, giving `banana$`. The seven suffixes are `banana$`, `anana$`, `nana$`, `ana$`, `na$`, `a$` and `$`. The compressed trie is below. Leaves are marked with the starting position of the suffix they represent.

```text
root
├── "banana$"  leaf 0
├── "a"  (depth 1)
│   ├── "$"  leaf 5
│   └── "na"  (depth 3)
│       ├── "$"  leaf 3
│       └── "na$"  leaf 1
├── "na"  (depth 2)
│   ├── "$"  leaf 4
│   └── "na$"  leaf 2
└── "$"  leaf 6
```

The same tree as a table makes the arithmetic explicit. The depth of a node is the length of the string it spells, and the edge length is the depth minus the parent's depth.

| Parent | Node label | Depth | Edge length | Leaves below |
| ------ | ---------- | ----- | ----------- | ------------ |
| root   | `banana$`  | 7     | 7           | 0            |
| root   | `a`        | 1     | 1           | 1, 3, 5      |
| `a`    | `a$`       | 2     | 1           | 5            |
| `a`    | `ana`      | 3     | 2           | 1, 3         |
| `ana`  | `ana$`     | 4     | 1           | 3            |
| `ana`  | `anana$`   | 6     | 3           | 1            |
| root   | `na`       | 2     | 2           | 2, 4         |
| `na`   | `na$`      | 3     | 1           | 4            |
| `na`   | `nana$`    | 5     | 3           | 2            |
| root   | `$`        | 1     | 1           | 6            |

The edge lengths sum to $7+1+1+2+1+3+2+1+3+1 = 22$. There are seven suffixes, so the number of distinct nonempty substrings of `banana` is $22 - 7 = 15$. Direct enumeration confirms it: three of length one, three of length two, three of length three, three of length four, two of length five, and one of length six.

The internal nodes have depths $1$ (`a`), $2$ (`na`), and $3$ (`ana`). The deepest is $3$, so the longest repeated substring has length three, and `ana` is the witness: it occurs at positions 1 and 3.

The tree for `aaaa$` shows the other extreme. Every suffix is a prefix of the previous one, so the internal nodes form a chain.

```text
root
├── "a" (depth 1)
│   ├── "$" leaf 3
│   └── "a" (depth 2)
│       ├── "$" leaf 2
│       └── "a" (depth 3)
│           ├── "$" leaf 1
│           └── "a$" leaf 0
└── "$" leaf 4
```

The edge lengths are $1+1+1+2+1+1+1+1 = 9$, minus five suffixes gives four distinct substrings, and the deepest internal node is $3$, which is the length of `aaa`. Even in this degenerate shape the tree stays linear: the chain has one node per distinct prefix that branches, not one node per character of every suffix.

## Formal model

Let $s$ be a nonempty string over an alphabet $\Sigma$ with $\lvert s \rvert = n$. Let $\omega \notin \Sigma$ be the sentinel, and let $t = s\omega$ with $\lvert t \rvert = N = n+1$. The implementations use `$` for $\omega$.

::: math definition Definition
A **compact trie** of a set of strings is a rooted tree in which every edge carries a nonempty label, the labels of the edges leaving one node begin with distinct characters, every internal node has at least two children, and the path label of a node is the concatenation of the edge labels from the root to it.
:::

::: math definition Definition
The **suffix tree** $\operatorname{ST}(t)$ is the compact trie of the $N$ suffixes $t[i..N-1]$ for $0 \le i < N$. The **string depth** $\operatorname{depth}(v)$ of a node $v$ is the length of its path label. A **locus** is a pair $(e, k)$ where $e$ is an edge and $1 \le k \le \lvert \operatorname{label}(e) \rvert$; its string is the path label of the parent of $e$ followed by the first $k$ characters of the edge label. Every node other than the root is the locus with $k=\lvert \operatorname{label}(e) \rvert$ on its incoming edge, and the root represents the empty string.
:::

Because every suffix ends at the sentinel and the sentinel occurs once, no suffix is a prefix of another. Every suffix therefore ends at a distinct leaf, and the number of leaves is exactly $N$.

::: math lemma Lemma
A compact trie with $L$ leaves has at most $L-1$ internal nodes and at most $2L-1$ nodes in total.
:::

::: math proof Proof
Let $I$ be the number of internal nodes. Every node except the root has exactly one parent, so the number of edges is $I + L - 1$. Every edge leaves an internal node and every internal node has at least two children, so the number of edges is at least $2I$. Hence $I + L - 1 \ge 2I$, which gives $I \le L - 1$. The total number of nodes is $I + L$, which is at most $2L - 1$, and the bound is exact for $L = 1$ as well. $\square$
:::

For $\operatorname{ST}(t)$ this means at most $2N-1$ nodes, which is the bound that makes the structure linear. The published implementation reserves $2N+2$ nodes.

::: math lemma Lemma
The nonempty strings spelled by the loci of $\operatorname{ST}(t)$ are exactly the distinct nonempty substrings of $t$, each once.
:::

::: math proof Proof
Every nonempty substring of $t$ is a prefix of some suffix, so following its characters from the root reaches a unique locus: the path is unique in a tree, and the locus is either a node or a point inside the one edge that continues the path. Conversely, the path label of any locus is a prefix of the suffix that ends in the subtree below the locus, so it is a substring of $t$. Two different loci have different path labels, because the path from the root is unique and the edge labels are nonempty. $\square$
:::

::: math lemma Lemma
The number of distinct nonempty substrings of $s$ is

$$
\sum_{\text{edges } e} \lvert \operatorname{label}(e) \rvert - N.
$$
:::

::: math proof Proof
By the previous lemma, the sum of the edge lengths is the number of distinct nonempty substrings of $t$: each edge contributes one string for each of its integer points. A substring of $t$ contains the sentinel exactly when it ends at the last position, because the sentinel occurs nowhere else. Such a substring is a suffix of $t$, and there are $N$ distinct suffixes. Removing them leaves exactly the distinct nonempty substrings of $s$. $\square$
:::

The node form of the same identity uses the length range of a node:

$$
\sum_{v \ne \text{root}} \bigl(\operatorname{depth}(v) - \operatorname{depth}(\operatorname{parent}(v))\bigr) - N.
$$

Each term is the length of the edge above $v$, so the two sums are the same.

::: math lemma Lemma
The length of the longest repeated substring of $s$ is the maximum string depth of a node of $\operatorname{ST}(t)$ with at least two children, or $0$ if no such node exists.
:::

::: math proof Proof
A nonempty string $x$ is repeated exactly when it is a prefix of at least two suffixes of $t$. Its locus has at least two leaves below it. If the locus is strictly inside an edge, moving it to the bottom node of that edge does not change the set of leaves and strictly increases the length, so a longest repeat is attained at a node. A node with at least two leaves below it is exactly a node with at least two children, because every leaf below it is reached through a distinct child. Conversely, a node with two children is a prefix of two suffixes and therefore repeats. Since $s$ contains no sentinel, the maximum depth is at most $n$, and it is $0$ when the tree has no branching node. $\square$
:::

::: math lemma Lemma
For every locus on an edge whose lower node is $v$, the suffixes that have the locus string as a prefix are exactly the leaves in the subtree of $v$.
:::

::: math proof Proof
A suffix has the locus string as a prefix exactly when its path from the root passes through the locus. Every path that reaches a point inside the edge continues through the rest of the edge to $v$, and every path through $v$ reaches that point on the way, so the two sets of suffixes are equal. The suffixes are in bijection with the leaves, which gives the claim. $\square$
:::

This last lemma is the bridge to every occurrence question. It says that all points on one edge have the same occurrence set even though they spell different strings. That is why an edge can be summarized by its lower node and its length.

## Algorithm derivation

### Appending the sentinel

The first line of the construction appends the sentinel. It must be a character that cannot appear in $s$; a byte outside the lowercase range is enough.

```cpp
std::string t = s + '$';
const int N = static_cast<int>(t.size());
```

Two things follow. Every suffix is distinct, and no suffix is a prefix of another. Without the sentinel, the suffix `a` of `aaa` would end at an internal node, the leaf count would no longer equal the suffix count, and the subtraction in the distinct-count formula would be wrong.

### Inserting one suffix

The tree starts as a single root. The suffixes are inserted in increasing starting position. For a suffix starting at `pos`, the walk keeps a current node `v` and the position `pos` of the next unmatched character.

```cpp
int v = 0;
int pos = i;
for (;;) {
    int c = t[pos] == '$' ? 26 : t[pos] - 'a';
    int u = child[v * 27 + c];

    if (u == -1) {
        u = size++;
        edgeStart[u] = pos;
        edgeLen[u] = N - pos;
        depth[u] = depth[v] + edgeLen[u];
        child[v * 27 + c] = u;
        ++childCount[v];
        break;
    }

    int maxl = std::min(edgeLen[u], N - pos);
    int l = 0;
    while (l < maxl && t[edgeStart[u] + l] == t[pos + l]) ++l;

    if (l == edgeLen[u]) {
        v = u;
        pos += l;
        if (pos == N) break;
    } else {
        int w = size++;
        child[v * 27 + c] = w;
        edgeStart[w] = edgeStart[u];
        edgeLen[w] = l;
        depth[w] = depth[v] + l;

        int code = t[edgeStart[u] + l] == '$' ? 26 : t[edgeStart[u] + l] - 'a';
        child[w * 27 + code] = u;
        ++childCount[w];
        edgeStart[u] += l;
        edgeLen[u] -= l;

        int leaf = size++;
        edgeStart[leaf] = pos + l;
        edgeLen[leaf] = N - (pos + l);
        depth[leaf] = depth[w] + edgeLen[leaf];
        code = t[pos + l] == '$' ? 26 : t[pos + l] - 'a';
        child[w * 27 + code] = leaf;
        ++childCount[w];
        break;
    }
}
```

There are exactly three outcomes.

**No child by the next character.** The suffix diverges from every stored suffix at this node, so the whole remaining suffix becomes a new leaf edge. The edge length is `N - pos`.

**The walk consumes the entire edge.** The next characters of the suffix agree with the whole edge label, so the walk moves to the child and continues with `pos` advanced by the edge length. If `pos` reaches the end of `t`, the suffix is already a path of the tree. With the sentinel this can only happen for an identical suffix, which is not inserted twice, but the check keeps the code total.

**The walk stops inside the edge.** The first `l` characters agree and character `l` differs, or the suffix ends inside the edge. A new internal node `w` is created at the split point. The old child `u` keeps its subtree but its edge loses the first `l` characters, and the new leaf takes the rest of the suffix. The parent's pointer must be redirected from `u` to `w`; forgetting that line leaves `u` reachable from the parent and `w` unreachable, which is the failure discussed under common mistakes.

The two new children of `w` are exactly the old continuation and the new suffix. Their first characters differ by the definition of `l`, so the child slots are distinct and the compact-trie invariant is preserved.

### Reading the answers

After the build, one pass over the nodes computes both answers.

```cpp
long long total = 0;
int best = 0;
for (int v = 1; v < size; ++v) {
    total += edgeLen[v];
    if (childCount[v] >= 2) best = std::max(best, depth[v]);
}
long long distinct = total - N;
```

`edgeLen[v]` is the length of the edge above `v`, so the sum is the total edge length. The condition `childCount[v] >= 2` selects exactly the branching nodes, and the maximum depth among them is the longest repeat.

No sorting, no string comparison, and no second tree are needed. The pass is linear in the number of nodes, which is at most $2N$.

### Why the build is quadratic

The walk for suffix `i` visits at most $N-i$ edges, and the character comparisons within one edge also total at most $N-i$, because a comparison either advances along the suffix or stops the walk. Summing over all suffixes gives

$$
\sum_{i=0}^{N-1} (N-i) = \frac{N(N+1)}{2} = O(n^2).
$$

The number of created nodes is at most two per insertion, so the memory is $O(n)$ nodes. With 27 child slots per node, the table holds fewer than $54N$ integers, which is about 430 kilobytes at $N = 2001$. The quadratic factor is in time only.

## Step-by-step execution

Build the tree of `banana$` by inserting the suffixes in order. The table records the shared prefix, the action, and the nodes that remain after the insertion. Node names are descriptive rather than numeric.

| Step | Suffix    | Matched against | Action                                  | New nodes  |
| ---- | --------- | --------------- | --------------------------------------- | ---------- |
| 0    | `banana$` | root            | root has no `b`: add leaf               | `banana$`  |
| 1    | `anana$`  | root            | root has no `a`: add leaf               | `anana$`   |
| 2    | `nana$`   | root            | root has no `n`: add leaf               | `nana$`    |
| 3    | `ana$`    | `anana$`        | longest common prefix `ana`: split at 3 | `ana`, `$` |
| 4    | `na$`     | `nana$`         | longest common prefix `na`: split at 2  | `na`, `$`  |
| 5    | `a$`      | `ana` edge      | longest common prefix `a`: split at 1   | `a`, `$`   |
| 6    | `$`       | root            | root has no `$`: add leaf               | `$`        |

Step 3 is the first split. The suffix `ana$` and the stored suffix `anana$` agree on `ana` and differ on the fourth character, where one has `$` and the other has `n`. The edge `anana$` is split at depth three, and the new internal node has two children: the old suffix continues with `na$`, and the new suffix continues with `$`.

Step 5 splits the `ana` edge itself. The suffix `a$` agrees with the path `ana` on its first character and differs on the second, so a new node at depth one is inserted above `ana`. The old node keeps the label `na` and becomes a child of the new node, and the new leaf `$` becomes the other child.

The final tree is the one drawn in the visual section. Its edge lengths are

$$
7 + 1 + 1 + 2 + 1 + 3 + 2 + 1 + 3 + 1 = 22,
$$

so the distinct count is $22 - 7 = 15$. The branching nodes have depths $1$, $2$, and $3$, so the longest repeat has length $3$.

Now run the same two questions on `aaaa$`, whose suffixes are `aaaa$`, `aaa$`, `aa$`, `a$`, and `$`.

| Step | Suffix  | Matched against | Action                          | New nodes  |
| ---- | ------- | --------------- | ------------------------------- | ---------- |
| 0    | `aaaa$` | root            | add leaf                        | `aaaa$`    |
| 1    | `aaa$`  | `aaaa$`         | common prefix `aaa`: split at 3 | `aaa`, `$` |
| 2    | `aa$`   | `aaa` edge      | common prefix `aa`: split at 2  | `aa`, `$`  |
| 3    | `a$`    | `aa` edge       | common prefix `a`: split at 1   | `a`, `$`   |
| 4    | `$`     | root            | add leaf                        | `$`        |

The edge lengths sum to $9$, the distinct count is $9 - 5 = 4$, and the deepest branching node has depth $3$, which is the longest repeat (`aaa`). The final leaf for the full suffix is `a$` at depth five, and the sentinel is the final character of that edge; it is not a separate branching point.

## Correctness proof

::: math theorem Theorem
After all $N$ suffixes have been inserted, the structure is the compact trie of those suffixes, and the two reported values are the number of distinct nonempty substrings of $s$ and the length of its longest repeated substring.
:::

::: math proof Proof
**The invariant.** After each insertion, the structure is the compact trie of the suffixes inserted so far. The claim is inductive. It holds for the empty set, which is the root. Suppose it holds before inserting the suffix starting at `pos`. The walk follows the unique path that spells the longest prefix of the new suffix already present in the trie. If no child continues that prefix, the remaining suffix is a new leaf and the compact-trie properties hold because the new edge is the only edge with its first character below the current node. If the walk consumes whole edges, it simply follows the existing path, which is valid. If it stops inside an edge, the split creates the unique branching point where the new suffix leaves the old path; the two outgoing edges begin with different characters, the old subtree is unchanged below the split, and every other node is untouched. The parent pointer is redirected to the new internal node, so the old subtree remains reachable exactly once. Hence the invariant is preserved.

**The tree is the suffix tree.** After the last insertion, all suffixes are present, so by the invariant the structure is the compact trie of all suffixes of $t$, which is $\operatorname{ST}(t)$.

**The distinct count.** By Lemma 2 the edge lengths sum to the number of distinct nonempty substrings of $t$, and by Lemma 3 the substrings containing the sentinel are exactly the $N$ suffixes. The program subtracts $N$, so it reports the number of distinct nonempty substrings of $s$.

**The longest repeat.** By Lemma 4 the answer is the maximum depth of a node with at least two children, and the program takes exactly that maximum. When no such node exists, `best` stays zero, which is correct because no nonempty substring repeats.

**Termination and bounds.** Each insertion either creates a node or advances `pos` by a positive edge length, and `pos` never exceeds $N$, so every insertion terminates. At most two nodes are created per insertion, so the reserved capacity is sufficient. The two answers are read in one final pass. $\square$
:::

The proof depends on three implementation details that are easy to lose: the sentinel must be outside the alphabet, the parent pointer must be redirected to the split node, and the old edge must keep the characters after the split. Each of the four lemmas fails if one of them is missing.

## Complexity analysis

| Phase                                           | Cost                           |
| ----------------------------------------------- | ------------------------------ |
| Appending the sentinel and allocating the table | $O(n)$                         |
| Inserting all suffixes                          | $O(n^2)$ time, $O(n)$ nodes    |
| Summing the edge lengths                        | $O(n)$                         |
| Finding the deepest branching node              | $O(n)$                         |
| Whole construction                              | $O(n^2)$ time and $O(n)$ space |

The insertion bound deserves a second look because the walk can descend many edges. For one suffix, every step either consumes at least one character of the suffix or stops the walk, so the total number of edge visits and character comparisons is at most the suffix length. Summing the suffix lengths gives $n(n+1)/2$ comparisons in the worst case. A string of one repeated character realizes the bound, because every insertion walks down the whole chain before splitting near the bottom.

The space is linear because the number of nodes is at most $2N-1$. Each node stores four integers for the edge start, edge length, depth, and child count, plus 27 child slots. The child table dominates: $27 \ast 2N$ integers is about 432 kilobytes for $N=2000$ at four bytes each, and the actual arrays in the listings are about half a megabyte. The labels themselves are not copied; an edge stores a start position and a length into `t`.

The two queries are free after the build. There is no per-query cost because both answers are aggregates over all edges and nodes, not lookups of a supplied pattern. If the problem asks many pattern queries instead, the tree supports them by walking the pattern from the root in $O(\lvert p \rvert)$ time, but the published programs do not implement that walk.

The $O(n^2)$ factor is acceptable only because of the published bound $n \le 2000$. At $n = 10^5$ the comparison count is about $5 \cdot 10^9$, which does not fit in a time limit. A linear construction, or a suffix array with an LCP array, is required there, and the asymptotic difference is the whole reason those algorithms exist.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count the distinct substrings of one string | A suffix tree and its edge sum, or a suffix array and its LCP sum |
| Find the longest repeated substring | A suffix tree's deepest branching node, or the maximum LCP |
| Count the occurrences of one substring | Walk the tree once, or binary-search a suffix array |
| Many pattern queries on one fixed text | A suffix tree or a suffix automaton of the text |
| Many text queries against one dictionary | Aho-Corasick, which indexes the patterns |
| Longest common substring of two strings | A generalized suffix tree with leaf colors, or a suffix array |
| The shortest substring unique in each of two strings | A generalized suffix tree with per-color counts |
| Substrings that occur at least $k$ times | A suffix tree with subtree leaf counts |
| The text grows online | A suffix automaton, or Ukkonen's construction |
| $n \le 2000$ and the code must be short | The quadratic construction in this article |
| $n = 10^5$ or more | Ukkonen, a suffix array, or a suffix automaton |
| The alphabet is large | Edges in a hash map; the dense 27-slot table wastes memory |
| Memory is tight and queries are few | A suffix array, which stores one integer per suffix |

The first two rows are the ones this article implements. The next two are the orientation decision: a suffix tree indexes the text, and Aho-Corasick indexes the patterns. A problem that fixes the dictionary and changes the text is an Aho-Corasick problem even though the words "all occurrences" appear in it.

The generalized suffix tree is the standard answer for several strings. Concatenate the strings with distinct sentinels, build one tree, and color each leaf by the string it came from. A node's subtree then contains a multiset of colors, and the count of each color is the number of occurrences in that string. The sentinels keep the strings from sharing a suffix across a boundary.

The suffix automaton is the closest relative of the suffix tree: it is the minimal deterministic automaton of the substrings, and its suffix-link tree is the suffix tree of the reversed string in disguise. A problem that asks for end-position classes, occurrence counts, or online appends is often shorter with the automaton, while a problem that asks for branching, leaf colors, or subtree aggregates is often clearer with the tree.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal and JavaScript. They implement the same contract.

- The input is one line holding a nonempty string of lowercase Latin letters, at most 2000 characters.
- The program prints two lines.
- The first line holds the number of distinct nonempty substrings.
- The second line holds the length of the longest repeated substring, or $0$ when no substring repeats.

Every version appends `$`, stores the tree in flat arrays with 27 child slots per node, inserts every suffix, splits edges at the longest common prefix, and then sums the edge lengths and finds the deepest node with at least two children. Edge labels are start-and-length pairs, so the memory does not grow with the total length of the labels.

C, C++, Java and Pascal use a signed 64-bit accumulator for the distinct count. Python uses an arbitrary-precision integer, and JavaScript uses an ordinary number, which is exact at the published bound because the answer is below $2^{31}$. All six agree on the fixtures, including the single-character case where the second answer is zero.

The JavaScript and Pascal listings are educational reference implementations, because neither language is a USACO submission language. They are complete programs and run under the same validation as the other four. The Pascal version avoids console-result codes, reads the line with one `ReadLn`, strips a trailing carriage return, and uses `SysUtils`, so it compiles in the same restricted environment as the rest of the book.

The sources are under `implementations/strings/suffix-tree/`, with one directory per language and the source file named in the manifest. The manifest records the quadratic time and linear space of every variant, the input and output contract, and the verification status.

## Recursion decision

Both the construction and the answer pass are iterative. The construction is a loop over suffixes and an inner loop over edges, and the answer pass is a loop over node indices. No function calls itself.

A recursive version of the insertion is possible but pointless. The walk can descend $n$ edges before it splits, and a recursive descend would use one stack frame per edge. At the published bound of 2000 that is survivable in most languages, but Python's default limit of 1000 frames is below it, and the iterative loop is shorter anyway.

A recursive postorder traversal is a more interesting temptation. Sums over leaves, colors, and subtree counts are natural recursive computations, and the textbook presentation of a suffix tree often writes them that way. The problem is that the tree can be a chain of $n-1$ internal nodes, so the recursion depth is linear. An explicit stack, or a loop over nodes sorted by decreasing depth, avoids the limit.

One subtlety makes the loop over node indices unsafe as a postorder: after a split, the old child has a smaller index than its new parent. The creation order is therefore not a topological order of the final tree. A bottom-up pass must either use an explicit DFS order or sort the nodes by decreasing depth. The two answers in this article do not need a bottom-up pass, which is one reason the published code is so short.

| Language   | Practical recursion depth            | Recommendation                           |
| ---------- | ------------------------------------ | ---------------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative, for uniformity                |
| Java       | About $10^4$ frames                  | Iterative, because the chain can be long |
| Python     | The interpreter limit of 1000        | Iterative, without exception             |
| Pascal     | The operating system stack           | Iterative, for the same reason           |
| JavaScript | About $10^4$ frames                  | Iterative, to stay below the limit       |

The rule is simple: use loops for both the build and the aggregation, and reserve recursion for the type of tree where the depth is logarithmic.

## Implementation walkthrough

Five details decide whether the implementation is correct.

**The sentinel and its slot.** The sentinel must not collide with a letter. The listings map `$` to slot 26 and letters to 0 through 25. If the sentinel were left out, a suffix could end at an internal node, and the leaf count would no longer equal the number of suffixes.

**The edge representation.** An edge stores a starting position and a length in `t`, never a copied string. The character at offset `l` of an edge is `t[edgeStart[u] + l]`, and the comparison is bounded by the remaining suffix length as well as the edge length. Omitting the latter bound reads past the end of `t`.

**The split order.** Create the internal node, redirect the parent's child pointer to it, attach the old child with its shortened edge, then attach the new leaf. The parent redirection is the line that is easy to forget:

```cpp
int w = size++;
child[v * 27 + c] = w;          // the old child moves under the split node
edgeStart[w] = edgeStart[u];
edgeLen[w] = l;
depth[w] = depth[v] + l;
```

If the first line is missing, the old subtree stays attached to the parent and the new internal node is unreachable from the root. The final sum still visits every array slot, reachable or not, so it no longer equals the number of distinct substrings: it can be too large on one input and too small on another.

**The child slots after the split.** The first character of the old edge's remainder is read before `edgeStart[u]` is advanced, and the first character of the new leaf's remainder is read at `pos + l`. Both must lie strictly inside `t`; the sentinel guarantees that the new leaf is nonempty.

**The two aggregates.** The sum of `edgeLen` over non-root nodes is the total edge length, including the sentinel characters on leaf edges. Subtract the number of suffixes, which is `N`, not `n`. The longest repeat uses `childCount[v] >= 2`, which excludes leaves and also excludes a degenerate node with one child if one ever appears.

A compact version of the split, with the two child slots made explicit:

```cpp
int w = size++;
child[v * 27 + c] = w;
edgeStart[w] = edgeStart[u];
edgeLen[w] = l;
depth[w] = depth[v] + l;

int oldCode = t[edgeStart[u] + l] == '$' ? 26 : t[edgeStart[u] + l] - 'a';
child[w * 27 + oldCode] = u;
++childCount[w];
edgeStart[u] += l;
edgeLen[u] -= l;

int leaf = size++;
edgeStart[leaf] = pos + l;
edgeLen[leaf] = N - (pos + l);
depth[leaf] = depth[w] + edgeLen[leaf];
int newCode = t[pos + l] == '$' ? 26 : t[pos + l] - 'a';
child[w * 27 + newCode] = leaf;
++childCount[w];
```

The two codes are different by the definition of `l`, which is what makes the new node a valid compact-trie node. If they were equal, the split would have gone one character too far and the structure would violate the distinct-first-character rule.

For multiple test cases, every array must be reset or reallocated: the child table, the edge starts, the edge lengths, the depths, and the child counts. Allocating a fresh tree per case is simpler and is the safer choice when the total input is small.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Omitting the sentinel | A suffix that is a prefix of another ends at an internal node, and the leaf count is wrong | Append a character outside the alphabet |
| Not redirecting the parent pointer after a split | The old subtree stays under the parent and the new node is orphaned | Assign `child[v * 27 + c] = w` before attaching the children |
| Advancing the old edge start before reading its next character | The old continuation is attached to the wrong child slot | Read `t[edgeStart[u] + l]` first, then add `l` |
| Comparing past the end of the suffix | The scan reads the sentinel or beyond the string | Bound the comparison by `N - pos` as well as by the edge length |
| Subtracting `n` instead of `n + 1` | The sentinel suffix is counted as a valid distinct substring | Subtract `N`, the number of suffixes |
| Reporting a leaf's depth as a repeat | A leaf has one occurrence, so its string is not repeated | Require at least two children |
| Treating creation order as postorder | A split node is created after a child, so sums propagate in the wrong order | Use an explicit DFS or sort by decreasing depth |
| Using a 32-bit distinct count | The answer exceeds $2^{31}$ for strings much longer than the published bound | Use a 64-bit accumulator |
| Building a dense table for a huge alphabet | 27 slots per node becomes a large constant or an impossible table | Use a hash map for the children |

### Why this fails: the suffix that is a prefix

Take the string `aaa` without a sentinel. The suffixes are `aaa`, `aa`, and `a`, and the last two are prefixes of the first. The leaf for `a` would have to be an internal node, the leaf count would be one instead of three, and the distinct count would be wrong. Appending the sentinel gives `aaa$`, whose suffixes are `aaa$`, `aa$`, `a$`, and `$`; none is a prefix of another, every suffix ends at a leaf, and the subtraction of four suffixes is correct.

The same bug appears more quietly when the code treats `pos == N` as an ordinary descent. Without the sentinel, the insertion of a suffix can end inside an edge, and the code that only handles "no child" and "mismatch inside an edge" creates a leaf with length zero near the end. The guard is cheap, but the sentinel removes the case entirely.

### Why this fails: the orphaned split

Take `aaaa` and omit the parent redirection. The old child stays attached to its parent with a shortened edge, and the new internal node is unreachable from the root but still occupies array slots. The structure is no longer a compact trie, and the final sum still visits every slot regardless of reachability, so it no longer equals the number of distinct substrings: for `aaa` the buggy sum gives 2 instead of 3, and for `aaaa` it gives 6 instead of 4. Any string whose suffixes diverge inside an edge exposes it; the visual section's step table is the check to run by hand before trusting the build.

### Why this fails: counting the sentinel

For `z`, the tree has a leaf edge `z$` of length two and a leaf edge `$` of length one. The edge sum is three and the number of suffixes is two, so the distinct count is one. A program that subtracts `n = 1` reports two, inventing the string `z$` as a substring of `z`. The mistake is invisible on examples where every edge ends exactly at a letter boundary, which is why the single-character fixture exists.

## Variants and extensions

- **Ukkonen's construction.** Build the tree in linear time by extending every suffix at once and keeping suffix links. It is the standard industrial construction and the one to use when $n$ is large.
- **McCreight's construction.** The linear-time predecessor of Ukkonen, which inserts suffixes from longest to shortest and uses the previously computed path.
- **Suffix array plus LCP.** Sort the suffixes, compute the adjacent longest common prefixes with Kasai's algorithm, and build the tree with a stack in linear time. This is often the easiest linear-time tree to implement correctly.
- **Generalized suffix tree.** Concatenate several strings with distinct sentinels and color each leaf by its string. Subtree color counts answer document-frequency and common-substring questions.
- **Suffix links.** An internal node's suffix link points to the node of its longest proper suffix. The links make Ukkonen linear and turn the tree into the same structure as the suffix automaton's link tree.
- **Lowest common ancestor.** With an LCA structure on the tree, the longest common prefix of any two suffixes is the depth of their LCA, which answers substring comparisons in constant time.
- **Matching statistics.** Walk a pattern through the tree and record, at each position, the longest prefix of the remaining pattern that occurs in the text. This is the basis of many approximate-matching and compression algorithms.
- **Longest common substring of several strings.** Color the leaves, then find the deepest node whose subtree contains every color. The depth is the answer.
- **Document counting and range queries.** Store a Fenwick tree over the leaves of each node's subtree, or an Euler tour of the suffix-link tree, to answer how many documents contain a substring.
- **Sparse edges.** Replace the dense child table with a hash map or a sorted list when the alphabet is large. The time per transition grows logarithmically and the memory drops to the number of edges.
- **Dynamic and online texts.** Ukkonen appends characters, but deleting or inserting in the middle needs a different structure; suffix automata and balanced trees are the usual alternatives.
- **The suffix automaton.** It is the minimal automaton of all substrings and is dual to the suffix tree of the reversed string. Choose it when the queries are about end positions or online appends.
- **The suffix trie.** The uncompressed parent of the tree. It is quadratic, but it is the easiest way to explain why compression is possible and it is a useful correctness oracle for very short strings.

## Contest strategy

1. Decide which side is indexed. A fixed text with many pattern queries is a suffix-tree problem; a fixed dictionary with many text queries is an Aho-Corasick problem.
2. Read the bound before choosing the construction. Below about 5000 characters the quadratic tree is comfortable; at $10^5$ it is not, and the linear construction or a suffix array is required.
3. Append a sentinel that cannot occur in the input. Check that every suffix ends at a leaf before trusting any count.
4. Build the tree first, then answer. Do not interleave the aggregation with the insertion; the split changes the edge structure.
5. For distinct substrings, sum the edge lengths and subtract the number of suffixes. For the longest repeat, take the deepest node with two children.
6. For occurrence or uniqueness questions, use the leaf set of the lower node of an edge. All points on one edge share that set.
7. For two or more strings, concatenate with distinct sentinels and color the leaves. A node qualifies only when its subtree has the required colors.
8. Test four shapes explicitly: one character, all characters equal, all characters distinct, and a string where one suffix is a prefix of another before the sentinel is added.
9. Differential-test against the hash-set baseline on a thousand random strings of length at most ten. The two implementations share no code, so a disagreement localizes quickly.
10. Use a 64-bit accumulator for the distinct count even when the current bound seems small. The cost is one type declaration and the bug it prevents is silent.

## Worked problems

### Problem 1: the shortest substring unique in both strings

**Restatement.** Given two strings $s_1$ and $s_2$ of length at most 5000, find the smallest length of a string that occurs exactly once in $s_1$ and exactly once in $s_2$. If no such string exists, print `-1`. This is Codeforces 427D, "Match & Catch".

**Naive baseline.** Enumerate every substring of $s_1$, count its occurrences in both strings by scanning, and keep the shortest that occurs once in each. The enumeration is $O(n_1^2)$ candidates and each count is linear, so the total is cubic. Hashing makes the comparison of two substrings constant time but does not remove the quadratic number of candidates or the need to count occurrences.

**Insight.** Build the generalized suffix tree of `s1#s2$`, where `#` and `$` are distinct sentinels. Every locus is a common substring candidate, and the leaves below it are exactly its occurrences. A qualifying locus has one leaf of each color below it. By the occurrence lemma, every point on one edge has the same leaf set, so if the lower node qualifies, the shortest qualifying string on that edge is the one just below the parent.

**Derivation.** Concatenate the strings and build the tree. In a postorder, compute `cnt1[v]` and `cnt2[v]`, the numbers of leaves from each string in the subtree of $v$. For every internal node $v$ with `cnt1[v] == 1` and `cnt2[v] == 1`, the edge above $v$ represents lengths from `depth[parent[v]] + 1` to `depth[v]`, and all of them have the same two occurrence sets. The smallest length on that edge is the candidate. Take the minimum over all qualifying nodes, and report `-1` if none exists.

**Correctness.** A string occurs exactly once in each string exactly when its locus has one leaf of each color below it. The postorder counts are those leaf counts. The shortest string on the edge above a qualifying node is a prefix of the node's path, so it has the same leaves and still occurs once in each string. Conversely, a qualifying string inside an edge belongs to an edge whose lower node has the same leaves, and the edge's shallowest length is no longer than the string, so the minimum is found at a shallowest edge length. The answer is therefore the minimum over qualifying nodes of `depth[parent] + 1`.

**Complexity.** The quadratic construction costs $O((n_1+n_2)^2)$ time and $O(n_1+n_2)$ nodes. The postorder and the minimum cost $O(n_1+n_2)$. With Ukkonen or a suffix array the build is linear or $O(n \log n)$.

**Common wrong approach.** Taking `depth[v]` instead of `depth[parent[v]] + 1`. The node's own depth is the longest string on the edge, not the shortest, and the problem asks for the smallest length. Another wrong approach counts total occurrences instead of per-string occurrences: a string that occurs twice in $s_1$ and zero times in $s_2$ has two leaves but is not common.

### Problem 2: distinct substrings with a budget of bad letters

**Restatement.** Given a string $s$ of length at most 1500, a table that marks each of the 26 letters good or bad, and an integer $k$, count the distinct substrings of $s$ that contain at most $k$ bad letters. This is Codeforces 271D, "Good Substrings".

**Naive baseline.** Enumerate all $O(n^2)$ substrings, count their bad letters, and insert the good ones into a hash set. The number of candidates is about 1.1 million at $n = 1500$, and each insertion copies a string, so the total is $O(n^3)$ bytes in the worst case and the memory is quadratic.

**Insight.** The suffix tree partitions the distinct substrings into edge intervals: the edge above a node $v$ represents the lengths from `depth[parent[v]] + 1` to `depth[v]`. Along one edge, all lengths spell prefixes of the same path, so the number of bad letters is nondecreasing with the length. The valid lengths therefore form a prefix of the interval, and the count can be found with one binary search per edge.

**Derivation.** Build the tree of `s$` and compute a prefix sum `bad[0..n]` over the letters of $s$, where `bad[i]` is the number of bad letters in `s[0..i-1]`. For every node, store `rep[v]`, one starting position of a suffix in its subtree; it can be propagated from the leaves upward, or read from any leaf found by a DFS. For an edge from $p$ to $v$, the maximum original length is `depth[v]` when $v$ is internal and `depth[v] - 1` when $v$ is a leaf, because a leaf edge ends with the sentinel. If that maximum is at most `depth[p]`, the edge contributes nothing. Otherwise the bad count of the prefix of length $L$ is `bad[rep[v] + L] - bad[rep[v]]`, and a binary search finds the largest $L$ in the interval with that value at most $k$. The edge contributes `max(0, L - depth[p])`.

**Correctness.** Every distinct substring is exactly one locus on exactly one edge, so summing over edges counts each string once. On one edge, the locus strings are the prefixes of the path label, and the bad-letter count is monotone in the length. The binary search returns the last valid length, and the number of valid lengths above the parent is exactly the number of valid substrings represented by that edge. Internal edges end at a letter by construction; leaf edges have the sentinel as their last character, which is why the maximum is reduced by one.

**Complexity.** The quadratic build is $O(n^2)$ time and $O(n)$ space. The prefix sums are $O(n)$, and the binary search over all edges is $O(n \log n)$ because there are $O(n)$ nodes. At $n = 1500$ this is far below the limit. A suffix array with an LCP array gives the same edge decomposition in $O(n \log n)$ or $O(n)$.

**Common wrong approach.** Counting occurrences instead of distinct strings by multiplying the number of leaves below a node. The task asks for distinct contents, so each edge interval contributes lengths, not occurrences. Another wrong approach includes the sentinel edge in the count: the sentinel is not one of the 26 letters, and the substring containing it is not part of $s$.

### Problem 3: the best weighted substring under forbidden endings

**Restatement.** Given a string $s$ of length $n \le 2 \cdot 10^5$ and a binary string that marks some indices as forbidden, maximize $\lvert a \rvert \cdot f(a)$ over all strings $a$, where $f(a)$ is the number of occurrences of $a$ in $s$ that end at a non-forbidden index. This is Codeforces 873F, "Forbidden Indices".

**Naive baseline.** Enumerate every substring, count its valid occurrences by scanning, and take the maximum product. The enumeration is quadratic, each count is linear, and the total is cubic. Even with hashing the number of candidates is too large at the limit.

**Insight.** The weight of an occurrence depends on its end position, and the end position of a substring moves with its length, so in the original tree the weight is not constant along an edge. Reverse the string. An occurrence that ended at index $e$ becomes an occurrence that starts at index $n-1-e$ in the reversed string, and the start position of a suffix is fixed. In the reversed tree, every point on an edge has the same set of suffix leaves, so $f$ is constant along the edge, and the best length on the edge is its longest one.

**Derivation.** Let $r$ be the reversal of $s$ and build the tree of `r$`. For $0 \le j < n$, weight the leaf for suffix $j$ by one when the original end position $n-1-j$ is not forbidden, and by zero otherwise; the sentinel leaf has weight zero. In a postorder, sum the weights in every subtree into `w[v]`. For the edge from $p$ to $v$, every locus has occurrence set equal to the leaves of $v$, so its $f$ value is `w[v]`. The longest original string on that edge is `depth[v]` for an internal node and `depth[v] - 1` for a leaf, because the leaf edge ends with the sentinel. If that length is greater than `depth[p]`, the candidate is `length` times `w[v]`. The answer is the maximum over all edges, and zero is always attainable by taking no valid occurrence.

**Correctness.** Reversal is a bijection between substrings of $s$ and substrings of $r$, and it maps an occurrence ending at $e$ to an occurrence starting at $n-1-e$. The leaf weight therefore counts exactly the valid occurrences of the reversed string, and the subtree sum is $f$ for every locus on the edge. The deepest valid length on the edge is the largest $\lvert a \rvert$ with that $f$, so the product is maximized on that edge by that length. Taking the maximum over edges considers every distinct substring class once.

**Complexity.** The full solution needs a linear-time construction for $n = 2 \cdot 10^5$; with Ukkonen the build is $O(n)$ and the postorder is $O(n)$. The quadratic construction in this article is suitable only for small tests of the same idea. The memory is $O(n)$ nodes.

**Common wrong approach.** Using the original string and treating the subtree leaf count as $f$. The end index of an occurrence is `start + length - 1`, so two lengths on the same edge can end at different positions, and one may be forbidden while the other is not. The reversal is what makes the weight depend only on the leaf.

## Practice progression

1. **Recognition.** Given a statement, decide whether the fixed object is the text or the dictionary, and write down $n$, the number of queries, and whether the answer counts distinct strings or occurrences.
2. **Direct application.** Build the suffix tree of `banana$` by hand, list the edge labels and depths, and check the distinct count and the longest repeat against the drawing in this article.
3. **Construction drill.** Implement the quadratic insertion and print every split with the node labels, then compare the tree with the suffix trie for all strings of length at most four over a two-letter alphabet.
4. **Aggregation.** Add the two answers, then add subtree leaf counts and the deepest branching node. Check that the leaf counts match a brute-force occurrence count on random strings.
5. **Combination.** Solve the three worked problems in order: generalized colors, monotone edge counting, and the reversal trick. Each one adds one new way to summarize an edge.
6. **Transfer.** Replace the quadratic build with a suffix array plus LCP and rebuild the same tree with a stack. The two structures should produce identical edge intervals, which is the best check that the compression is understood rather than memorized.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is a locus, and why is every distinct substring exactly one locus? (Formal model)
2. Why does the sentinel make every suffix end at a leaf? (Key insight)
3. Why does a compact trie with $L$ leaves have at most $2L-1$ nodes? (Formal model, Lemma 1)
4. What exactly does the sum of the edge lengths count, and why is $N$ subtracted? (Formal model, Lemma 3)
5. Why is the longest repeated substring attained at a node rather than inside an edge? (Formal model, Lemma 4)
6. What are the three outcomes of inserting one suffix? (Algorithm derivation)
7. Which pointer must be redirected when an edge is split, and what breaks if it is not? (Implementation walkthrough)
8. Why is the build $O(n^2)$ even though every individual walk looks short? (Algorithm derivation, Complexity analysis)
9. Why is the memory linear when the number of substrings is quadratic? (Complexity analysis)
10. How does a generalized suffix tree answer "occurs exactly once in each string"? (Worked problems, Problem 1)
11. Why is the bad-letter count monotone along one edge, and why does that justify a binary search? (Worked problems, Problem 2)
12. Why does the forbidden-end problem reverse the string before building the tree? (Worked problems, Problem 3)

## Further reading

- The uncompressed ancestor of this structure, with the alphabet factor and the insertion loop, is in [the trie](/algorithms/strings/trie).
- The sorted-suffix alternative, with the LCP formula for distinct substrings, is in [the suffix array](/algorithms/strings/suffix-array).
- The automaton whose suffix-link tree is the suffix tree of the reversed string is in [the suffix automaton](/algorithms/strings/suffix-automaton).
- The one-pattern matching algorithm whose failure function is the ancestor of suffix links is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The linear-time pattern matching that avoids a tree altogether is in [the Z algorithm](/algorithms/strings/z-algorithm).
- The collision-prone shortcut for substring equality, which is often enough for the exercises, is in [rolling hash](/algorithms/strings/rolling-hash).
- The tree that compresses a set of marked nodes to their branching points uses the same compression idea, in [the virtual tree](/algorithms/trees/virtual-tree).
- The depth-first traversal that computes subtree sums without recursion is in [depth-first search](/algorithms/graphs/dfs).
- The range structure that answers subtree and interval queries over the leaves is in [the sparse table](/algorithms/range-queries/sparse-table).
- The amortized argument behind the linear-time constructions is in [complexity analysis](/algorithms/foundations/complexity).
