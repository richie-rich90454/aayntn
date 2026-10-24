---
id: strings.trie
title: Trie
summary: Store a set of strings in a tree that shares their common prefixes, so that a lookup, an insertion, and a prefix test all take time linear in the length of the key.
division: [silver, gold]
subjects: [strings]
level: intermediate
importance: common-contest-technique
keywords:
    [
        trie,
        prefix tree,
        dictionary tree,
        radix tree,
        compressed trie,
        prefix search,
        autocomplete,
        alphabet factor,
    ]
prerequisites:
    required: [foundations.complexity, foundations.binary-representation]
    recommended: [graphs.representation, graphs.dfs, enumeration.backtracking, strings.kmp]
complexity:
    time: "O(L) per word"
    space: "O(N) nodes, plus one pointer per alphabet symbol per node when the children are stored densely"
assumptions:
    - The set of strings is given in advance, or the alphabet is small enough that the nodes can be indexed directly.
    - The strings are compared character by character, and the comparison of two characters takes constant time.
    - The total length of the stored strings is within the memory limit of the dense representation.
reviewed: false
---

## At a glance

A trie is a tree whose edges are labeled with characters, and in which the path from the root to a node spells a **prefix** of the stored strings. The root spells the empty prefix, its children spell the one-character prefixes, and a node is marked when some stored string ends there.

The structure buys three things at once.

- A **lookup** of a word costs time linear in the length of the word, with no comparison against any other word.
- A **prefix query** costs time linear in the length of the prefix, and reports every word that starts with it.
- The **common prefixes are stored once**, so the space is proportional to the number of distinct prefixes rather than to the total length of the words.

The last point is also the structure's weakness. A trie over $n$ words of length $L$ has up to $nL$ nodes, and each node with a dense array of $|\Sigma|$ children costs $|\Sigma|$ pointers. The alphabet factor is the number that decides whether a trie fits in memory, and the **compressed trie** is the answer to it: it merges every node with exactly one child into its parent, and the node count drops to the number of words.

## Problem motivation

An autocomplete box holds a dictionary of $10^5$ words, each of length about $10$, and it must suggest every word that starts with what the user has typed so far. The user has typed `comp`.

The constraints are $10^5$ words of length at most $20$, over a lowercase alphabet.

The naive approach sorts the words and binary searches for the first word that starts with `comp`, then walks forward while the prefix still matches. The binary search costs $O(\log n)$ comparisons of words, and each comparison walks up to $20$ characters, so it costs $O(L \log n)$ character comparisons, and the scan after it costs $O(L)$ per word reported. It works, and it is the right answer when the dictionary is small.

The trie works differently. The four characters `c`, `o`, `m`, `p` select exactly one path in the tree, and the subtree below that node contains exactly the words that start with `comp`. The search costs four edge traversals, and the report is a walk of the subtree.

The cost of the trie is space. A dictionary of $10^5$ words of length $20$ has up to $2 \times 10^6$ nodes, and a dense array of $26$ children per node is $26 \times 2 \times 10^6$ pointers, or $416$ megabytes. The compressed trie has at most $2 \times 10^5$ nodes, and it fits in a few megabytes.

## Recognition patterns

A trie is the right tool when all of the following hold.

- The question is about **prefixes**: "which words start with this", "is this a prefix of any word", "how many words share this prefix".
- The strings share **long common prefixes**, so that storing the shared part once saves space or time.
- The alphabet is **small**, or the children are stored in a map rather than in a dense array.
- The set of strings is **known in advance**, so that the structure can be built once and queried many times.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| One lookup in a set of words | Rules out the trie; a hash set is shorter and faster |
| $10^5$ prefix queries | Rules in the trie |
| The alphabet is $26$ and the total length is $10^6$ | A dense trie is $26 \times 10^6$ pointers, or $208$ megabytes |
| The total length is $10^7$ | Rules out the dense trie entirely |
| The words are long and share long prefixes | Rules in the compressed trie |
| The words are long and share nothing | Rules out the trie; a hash set is smaller |
| The question is about substrings rather than prefixes | Rules out the trie; use a suffix array or a suffix automaton |
| The alphabet is Unicode | Rules out the dense representation; use a map |

The second-to-last row is worth pausing on. A trie over $n$ words of length $L$ has $O(nL)$ nodes whether or not the words share anything, and the sharing only saves space when the prefixes really are shared. A dictionary of $10^5$ random ten-letter words has about $10^6$ nodes, because the first three or four levels are shared and the rest are not.

The last row is the boundary of the whole subject. A trie answers prefix questions. The question "which words contain `xyz`" is a substring question, and the answer is a suffix array or a suffix automaton.

## Naive approach

The baseline is a hash set, with the prefix question answered by generating every prefix of the query.

```python
def prefix_matches(words, prefix):
    return [w for w in words if w.startswith(prefix)]
```

This is correct, and it is the reference implementation for the differential test. Its cost is $O(nL)$ per query, where $n$ is the number of words and $L$ the length of the prefix, because every word is examined.

The second baseline is the sorted array, with a binary search for the first word that has the prefix.

```python
def prefix_range(words, prefix):
    lo = bisect.bisect_left(words, prefix)
    hi = lo
    while hi < len(words) and words[hi].startswith(prefix):
        hi += 1
    return words[lo:hi]
```

This is correct, and it is $O(L \log n + kL)$ for a query that reports $k$ words. The binary search is a search over an ordered set, and the range it finds is exactly the words with the prefix.

The trie beats the sorted array by a factor of $\log n$ on the search and by nothing on the report, and it beats the hash set by a factor of $n$ on the prefix question. The sorted array is the right answer when there is one query, and it is the right answer when the memory limit is tight.

## Key insight

The insight is that **a set of strings has a natural tree structure, and the tree is shared**.

Two words that start with the same three characters share those three characters, and the trie stores them once. The node reached by following the edge labeled `c`, then `o`, then `m`, is the same node for every word beginning with `com`, and everything below it is exactly the set of words beginning with `com`.

That gives the two properties that the technique is used for.

- **The path spells the prefix.** A node is identified by the string on the path from the root to it, so the subtree rooted at a node is exactly the set of stored words having that node's string as a prefix.
- **The depth is the length of the key.** A lookup of a word of length $L$ walks $L$ edges, and there is no comparison against any other word. The cost does not depend on how many words are stored.

The second property is what separates the trie from the sorted array, and the first is what separates it from the hash set.

## Formal model

Let $\Sigma$ be the alphabet, and let $W$ be the set of stored words.

::: math definition Definition
A **trie** over an alphabet $\Sigma$ is a rooted tree in which every edge
is labeled with a character of $\Sigma$, such that no node has two
children with the same label. The **key** of a node is the string spelled
by the path from the root to that node. A node is **terminal** if some
stored word ends there, and **the words below a node** are the stored
words whose key has the node's key as a prefix.
:::


::: math definition Definition
The **word count** of a node is the number of stored words in its subtree.
It equals $1$ for a terminal node and the sum of the word counts of the
children otherwise.
:::


::: math lemma Lemma
A lookup of a word $w$ succeeds if and only if the path labeled by $w$
exists and ends at a terminal node.
:::


::: math proof Proof
By the definition of the trie, the path labeled by $w$ exists exactly when
every prefix of $w$ is the key of some node, which is exactly the
condition that $w$ is a prefix of some stored word. The path ends at a
terminal node exactly when some stored word equals $w$. So the lookup
succeeds exactly when $w$ is one of the stored words. $\square$
:::


::: math invariant Invariant
At every moment, the set of terminal nodes is exactly the set of stored
words, and the word count of every node is the number of stored words in
its subtree. Inserting a word marks one node as terminal and increases
the word count of every node on the path to it by one, so the invariant
is preserved.
:::


## Algorithm derivation

### The node structure

A node needs three things.

- The **children**, indexed by character.
- A **terminal flag**, saying whether a word ends here.
- A **word count**, saying how many words are below.

The children are the interesting part, and the choice is a trade of space for time.

| Representation | Children per node | Lookup of one character | Total space for $10^6$ nodes |
| --- | --- | --- | --- |
| A dense array of size $ | \Sigma | $ | $ | \Sigma | $ pointers | $O(1)$, no branching | $26 \times 8 = 208$ bytes, so $208$ megabytes |
| A sorted vector of pairs | variable | $O(\log | \Sigma | )$ | about $32$ bytes, so $32$ megabytes |
| A hash map | variable | $O(1)$ expected | about $64$ bytes, so $64$ megabytes |
| A linked list of children | variable | $O( | \Sigma | )$ | about $16$ bytes, so $16$ megabytes |

The dense array is the fastest and the most memory-hungry, and it is the right choice when the alphabet is a small fixed set of characters and the node count is moderate. The linked list is the smallest and the slowest, and it is the right choice when the alphabet is large and the branching factor is small, which is the usual situation for a compressed trie.

### The insertion

```text
insert(word):
    node = the root
    for each character c of word:
        if node has no child labeled c:
            create a child of node labeled c
        node = the child labeled c
    mark node as terminal
    increase the word count of every node on the path by one
```

The third line is what makes the prefix query possible. Without it, the number of words below a node would have to be computed by walking the subtree, which is $O(n)$ per query.

### The prefix query

```text
count_prefix(prefix):
    node = the root
    for each character c of prefix:
        if node has no child labeled c:
            return 0
        node = the child labeled c
    return the word count of node
```

The query is $O(L)$ for a prefix of length $L$, plus whatever the caller does to enumerate the subtree.

### The compressed trie

The **radix tree**, or compressed trie, merges every node that has exactly one child into its parent, and the edge to that child is labeled with a whole **string** rather than with a single character.

The node count of the compressed trie is at most $2n$ for $n$ words, because every internal node has at least two children. The path from the root to a node spells a prefix, but a prefix is now spelled by several edges rather than by one.

The lookup is still $O(L)$: walk the edges, and on each edge compare the edge label with the corresponding characters of the key, which advances the position in the key by the length of the label. The total work is proportional to the length of the key.

The compressed trie is the right structure when the words are long and share long prefixes, which is exactly the case in which the uncompressed trie wastes the most space. It is also the right structure for a dictionary that is built once and queried many times, because the construction cost is higher and the query cost is the same.

## Step-by-step execution

Insert the four words `car`, `card`, `care`, `cat` into a trie.

The root is the empty prefix. Its word count will be $4$.

**Inserting `car`.** The root has no child labeled `c`, so one is created. The `c` node has no child labeled `a`, so one is created. The `a` node has no child labeled `r`, so one is created. The `r` node is marked terminal, and the word counts of the root, the `c` node, the `a` node, and the `r` node each increase by one.

| Node  | Key     | Children | Terminal | Word count |
| ----- | ------- | -------- | -------- | ---------- |
| root  | (empty) | `c`      | no       | 1          |
| `c`   | `c`     | `a`      | no       | 1          |
| `ca`  | `ca`    | `r`      | no       | 1          |
| `car` | `car`   | none     | yes      | 1          |

**Inserting `card`.** The path `c`, `a`, `r` already exists, so no node is created; only the `r` node gains a child labeled `d`, and the `d` node is marked terminal. The word counts of the root, `c`, `ca`, `car`, and `card` each increase by one.

**Inserting `care`.** The path `c`, `a`, `r` exists, and the `r` node now has a child labeled `d` but not one labeled `e`, so the `e` node is created and marked terminal.

**Inserting `cat`.** The path `c`, `a` exists, and the `a` node has a child labeled `r` but not one labeled `t`, so the `t` node is created and marked terminal.

The final trie is

| Node   | Key     | Children | Terminal | Word count |
| ------ | ------- | -------- | -------- | ---------- |
| root   | (empty) | `c`      | no       | 4          |
| `c`    | `c`     | `a`      | no       | 4          |
| `ca`   | `ca`    | `r`, `t` | no       | 4          |
| `car`  | `car`   | `d`, `e` | no       | 3          |
| `card` | `card`  | none     | yes      | 1          |
| `care` | `care`  | none     | yes      | 1          |
| `cat`  | `cat`   | none     | yes      | 1          |

The node `car` has word count $3$, because three of the four words start with `car`. The node `ca` has word count $4$, because all of them do.

A query for the prefix `ca` walks two edges and returns $4$. A query for the prefix `car` walks three edges and returns $3$. A query for the prefix `can` walks two edges and finds no child labeled `n`, and returns $0$.

The compressed form of this trie has three nodes: the root, the node whose key is `ca` and whose edge label is `ca`, and one leaf for each of the four words. The `car` node is merged into the `card` and `care` leaves, because it has two children, and the `ca` node is merged with the `c` node, because the `c` node has one child.

## Correctness proof

::: math theorem Theorem
After any sequence of insertions, the terminal nodes of the trie are
exactly the inserted words, and the word count of every node is the number
of inserted words in its subtree.
:::


::: math proof Proof
The proof is an induction on the number of insertions.

**Base case.** The empty trie has one node, the root, which is not terminal, and its word count is $0$. There are no inserted words, so both claims hold.

**Inductive step.** Suppose the claims hold before an insertion of the word $w$. The insertion walks the path labeled by $w$, creating any node that does not exist, and marks the last node of the path as terminal. The path exists exactly when every prefix of $w$ is the key of a node, so after the insertion the terminal nodes are exactly the previously inserted words together with $w$.

The word count of a node changes only if the node is on the path, and for those nodes the count increases by exactly one, which is correct because the new word $w$ is in the subtree of every node on the path and in no other subtree. For a node off the path, neither the set of terminal nodes below it nor the set of words below it changes, so the count stays correct. $\square$
:::


::: math theorem Theorem
The prefix query returns the number of stored words that begin with the
given prefix.
:::


::: math proof Proof
If the walk fails, some prefix of the query is not the key of any node,
and by the lemma no stored word has that prefix, so the answer is $0$.

If the walk succeeds and ends at the node $v$, then $v$'s key is the query, so the stored words that begin with the query are exactly the stored words in the subtree of $v$, whose number is the word count of $v$ by the previous theorem. $\square$
:::


::: math lemma Lemma
A lookup of a word of length $L$ takes $O(L)$ time, and a prefix query
for a prefix of length $L$ takes $O(L)$ time, independently of the number
of stored words.
:::


::: math proof Proof
The walk follows one edge per character of the key, so it performs $L$
steps. Each step is a lookup in the children container of a node, which
costs $O(1)$ for a dense array, $O(\log |\Sigma|)$ for a sorted vector,
and $O(1)$ expected for a hash map. No stored word is examined, so the
cost does not depend on the number of words. $\square$
:::


## Complexity analysis

Let $n$ be the number of words, $L$ the maximum word length, $\Sigma$ the alphabet, and $N$ the number of nodes.

| Quantity | Cost |
| --- | --- |
| Nodes in an uncompressed trie | at most $nL + 1$, and in practice about $n \cdot \min(L, \log_\Sigma n)$ for random words |
| Nodes in a compressed trie | at most $2n$ |
| Space, dense children | $O(N | \Sigma | )$ pointers |
| Space, map children | $O(N)$ nodes plus the map overhead |
| Insertion | $O(L)$ |
| Lookup | $O(L)$ |
| Prefix query, count only | $O(L)$ |
| Prefix query, report every word | $O(L + k)$ for $k$ reported words |
| Building the trie | $O(\sum | w | )$ over all the words |

The alphabet factor is the number that decides whether the dense representation is possible. At $N = 10^6$ nodes, $|\Sigma| = 26$, and 8 bytes per pointer, the dense representation is $208$ megabytes. With $|\Sigma| = 128$ it is a gigabyte. With a map per node it is about $64$ megabytes.

The number of nodes is the other number. An uncompressed trie over $10^5$ words of length $20$ has at most $2 \times 10^6$ nodes, and a compressed trie has at most $2 \times 10^5$.

The comparison with the alternatives is worth putting in a table.

| Structure         | Lookup          | Prefix query       | Space        |
| ----------------- | --------------- | ------------------ | ------------ |
| Hash set          | $O(L)$ expected | $O(nL)$            | $O(\sum      | w      | )$          |
| Sorted array      | $O(L \log n)$   | $O(L \log n + kL)$ | $O(\sum      | w      | )$          |
| Uncompressed trie | $O(L)$          | $O(L + k)$         | $O(N         | \Sigma | )$ pointers |
| Compressed trie   | $O(L)$          | $O(L + k)$         | $O(n)$ nodes |

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Many prefix queries over a fixed dictionary | A trie, or a compressed trie |
| One lookup in a set of words | A hash set |
| Many lookups and no prefix queries | A hash set |
| The words are long and share long prefixes | A compressed trie |
| The alphabet is large or Unicode | A compressed trie with map children |
| The question is about substrings | A [suffix array](/algorithms/strings/suffix-array) or a suffix automaton |
| Many patterns matched at once in a text | Aho-Corasick, which is a trie with failure links |
| The question is about the number of distinct prefixes | A trie, with the word count |
| The question is about the longest common prefix of two words | A trie, or two suffix arrays |
| The words are added one at a time and queried immediately | A trie, because the structure is maintained incrementally |

The tenth row is the difference between a trie and a hash set, and it is worth naming: the trie answers the prefix question in the same time as the lookup, while a hash set answers it in time linear in the number of words. Neither is better in general, and the choice is decided by the ratio of prefix queries to lookups.

The last row is the difference between a trie and a sorted array, and it is decided by the number of insertions. A trie maintains itself incrementally at a cost of $O(L)$ per insertion, so a workload of many insertions and many prefix queries is exactly its case.

## Recursion decision

A trie is naturally recursive: the lookup for a key descends into the child labeled by the first character, and the lookup for the rest of the key is the lookup for that child. The recursion depth is the length of the key.

The lengths are the issue. A word in an ordinary dictionary has a length of at most $20$, and the depth is never a problem. A key that is a long string, such as a genomic sequence or a hash of length $10^5$, makes the depth $10^5$.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative for long keys; recursive is fine for words |
| Java | About $10^4$ frames | Iterative for long keys |
| Python | The interpreter limit of $1000$ | Iterative for long keys; the recursive form overflows past $1000$ |
| Pascal | The operating system stack | Iterative for long keys |
| JavaScript | About $10^4$ frames | Iterative for long keys |

The iterative form is the loop, and it is the same length as the recursive function once the loop is written:

```text
node = the root
for each character c of the key:
    if node has no child labeled c: return not found
    node = the child labeled c
return whether node is terminal
```

The recommendation is therefore: use the recursive form for a dictionary of words, where the depth is the length of a word, and the iterative form otherwise. The iterative form is also the one to use for the **compressed** trie, because the recursion there would have to handle a variable-length edge label, and a loop handles that with no extra work.

There is one more recursive routine worth naming. **Reporting every word with a given prefix** is naturally recursive, and its depth is the depth of the trie, not the length of the key. A trie whose words are $10^5$ characters long has a depth of $10^5$ in the uncompressed form, so the report should be a loop over an explicit stack of nodes as well.

## Implementation walkthrough

The children container is the decision that matters, and it is worth writing the two common versions.

```cpp
struct Node {
    std::array<int, 26> child;    // -1 for a missing child
    bool terminal = false;
    int words = 0;
};
```

A dense array of $26$ children makes the lookup a single array access, and it makes the memory $26$ times the number of nodes. The sentinel $-1$ is needed because the child index $0$ is a legitimate child.

The word count is the second detail.

```cpp
void insert(const std::string& word) {
    int node = 0;
    words[node]++;                 // the root counts every word
    for (char c : word) {
        int next = child[node][c - 'a'];
        if (next == -1) {
            next = (int)nodes.size();
            nodes.push_back(Node{});
            child[node][c - 'a'] = next;   // set the edge before the next push
        }
        node = next;
        words[node]++;
    }
    nodes[node].terminal = true;
}
```

The `words[node]++` on the way down is what makes the prefix query constant time after the walk. Forgetting it is a bug that shows up only in the count queries, which is why it is worth writing the increment at the top of the loop where it cannot be missed.

The third detail is the reallocation.

```cpp
nodes.push_back(Node{});
child[node][c - 'a'] = next;
```

The edge must be set **after** the push, because the push may reallocate the vector, which invalidates every reference into it. A program that takes a reference to `nodes[node]` before the push and writes through it afterwards is writing to freed memory. Reserving the capacity up front, or using indices rather than references, avoids the problem.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Omitting the terminal flag | A word that is a prefix of another is not found | Keep a separate terminal flag |
| Using the word count as the terminal flag | Every prefix of a word is reported as a word | Keep the two pieces of information apart |
| Not counting the words below a node | The prefix query is $O(n)$ instead of $O(1)$ | Increment the count on the way down |
| A dense array over a large alphabet | The memory blows up | Use a map, or compress the trie |
| Using the character code as the array index | An out-of-bounds access | Subtract the offset of the alphabet |
| Taking a reference into the node vector before a push | A write to freed memory | Use indices, or reserve the capacity |
| Forgetting the root in the count | The count for the empty prefix is $n - 1$ | Increment the root too |
| Confusing a prefix query with a substring query | The answer is wrong | Check the statement for the word "substring" |
| Inserting the words in sorted order and assuming the trie is sorted | The children are not in order | Sort the children explicitly if the order matters |

### Why this fails: the count that looks at the children

The plausible wrong approach is to answer a prefix query by looking at the **children** of the node the walk reaches, rather than at the node itself and its subtree. The reasoning is that the children are the words that continue the prefix, so counting them counts the matches.

It does not, because the node the walk reaches may itself be the end of a stored word.

The smallest counterexample is the dictionary $\{\texttt{a}, \texttt{ab}\}$ and the query "how many stored words begin with `a`?".

The correct answer is $2$.

The buggy program walks to the node whose key is `a`. That node is terminal, because the word `a` is stored, and it has exactly one child, the node whose key is `ab`, which is also terminal. The buggy program counts the children of the node it reached, finds one child, and reports $1$.

The word `a` is missing from the answer, and the mechanism is exact. The node the walk reaches **is** a stored word, and the children are the stored words that extend it. A prefix query asks for the words in the subtree, which is the node itself together with its descendants.

The fix is the word count, which counts the node itself when it is terminal and the children otherwise. The rule is

$$
\operatorname{words}(v) = \begin{cases}
1 + \sum_{w \text{ child of } v} \operatorname{words}(w) & \text{if } v \text{ is terminal}, \\
\sum_{w \text{ child of } v} \operatorname{words}(w) & \text{otherwise}.
\end{cases}
$$

The lesson generalizes: **a subtree includes its root.** Every structure that reports the contents of a subtree has to decide explicitly whether the root is part of it, and the two pieces of information, "is this a word" and "how many words are below", are not interchangeable.

## Variants and extensions

- **The compressed trie, or radix tree.** Merge every node with exactly one child into its parent, and label the edges with strings. The node count drops to at most $2n$, and it is the right structure for long words.
- **The double array trie.** A compressed trie whose node transitions are stored in a single flat array with a base and a check, which gives a very small memory footprint and a constant-time lookup. It is the standard structure in Japanese input method software.
- **Aho-Corasick.** The trie with failure links, which matches many patterns in one pass over the text. It is the standard answer to the "many patterns, one text" question.
- **The suffix trie.** The trie of all the suffixes of a string. It is the conceptual parent of the suffix tree, and its size is quadratic, which is why the suffix tree is compressed.
- **The ternary search tree.** A tree whose nodes hold a character and three children, ordered by the character. It balances the space of a map and the speed of an array, and it is the structure behind the GNU implementation of the `map` container.
- **The bitwise trie.** A trie over the bits of a number rather than over its characters. It answers the questions about the common prefix of two numbers, and it is the structure behind the binary trie for the problems about maximum XOR.
- **The sorted vector of children.** A middle ground between the dense array and the map, which is often the fastest of the three for a small branching factor.
- **The prefix count as a subtree size.** The word count is a special case of a more general annotation on a tree, and the same technique annotates a tree with the number of leaves below each node.

## Contest strategy

1. Count the characters. A trie over $10^5$ words of length $20$ is two million nodes, and the dense form of that is two hundred megabytes. Write down the memory figure before writing the structure.
2. Decide between the uncompressed and the compressed trie. The compressed one is the right answer whenever the words are long, and it costs more to build.
3. Decide how the children are stored. A dense array is the fastest; a map is the safest.
4. Keep the terminal flag and the word count apart. They answer different questions, and the count must include the node itself.
5. Increment the count on the way down, including at the root, so that the empty prefix is counted.
6. Use indices rather than references into the node container, because the container grows.
7. Check the statement for the word "prefix" against the word "substring". A substring question is a different technique, and the trie will not answer it.
8. When there is only one prefix query, sort the words and use a binary search. The trie is a structure for many queries.

## Worked problems

### Problem 1: the autocomplete

**Restatement.** There are $n \le 10^5$ words of length at most $20$ over a lowercase alphabet, and $q \le 10^5$ queries, each a prefix. Report the number of stored words that begin with each query prefix.

**Naive baseline.** Scan the words for every query, which is $O(qnL)$ and reaches $2 \times 10^{11}$ character comparisons.

**Insight.** The words with a given prefix are exactly the words in the subtree of one node, and the walk to that node costs the length of the prefix.

**Derivation.** Build the trie with a word count on every node, incremented on the way down. For each query, walk the prefix and report the word count of the node reached, or $0$ if the walk fails.

**Correctness.** The theorem of the correctness proof shows that the word count of a node is the number of stored words in its subtree, and the second theorem shows that the subtree of the node reached by the walk is exactly the set of words with the query prefix.

**Complexity.** $O(\sum |w|)$ to build and $O(L)$ per query, so $O(\sum |w| + qL)$ in total. The space is $O(N |\Sigma|)$ pointers for the dense form.

**Common wrong approach.** Counting the children of the node reached rather than the node itself, which misses the word that equals the prefix, as the counterexample in the common mistakes section shows.

### Problem 2: the longest common prefix of two words

**Restatement.** Given $n \le 10^5$ words, report the length of the longest common prefix of every pair of words that share a first character, or the maximum such length over all pairs.

**Naive baseline.** Compare every pair of words, which is $O(n^2 L)$.

**Insight.** The longest common prefix of two words is the length of the key of the deepest node that is an ancestor of both of their terminal nodes.

**Derivation.** Mark each terminal node with the index of the word that ends there. For each node, compute the number of terminal nodes in its subtree, and mark the node as a "branch point" when that number is at least two. The answer is the depth of the deepest branch point. The computation of the subtree counts is a single pass over the nodes in reverse order of their depth, which is a post-order traversal.

**Correctness.** Two words share a prefix of length $L$ exactly when both of their terminal nodes are below the node whose key is that prefix. The deepest such node is the longest common prefix, and it is exactly a node with at least two words below it.

**Complexity.** $O(\sum |w|)$ to build the trie and $O(N)$ for the traversal, against $O(n^2 L)$ for the naive comparison.

**Common wrong approach.** Comparing the words directly and reporting the longest common prefix of the two longest words, which is not the answer: two long words need not share a prefix with each other.

### Problem 3: the dictionary with a memory limit

**Restatement.** There are $n \le 2 \times 10^5$ words of length at most $10^5$, with a total length of at most $10^6$, and the memory limit is 64 megabytes. Report whether a given word is in the dictionary.

**Naive baseline.** A dense uncompressed trie, which costs $26 \times 8$ bytes per node, and the node count is up to $10^6$, so the dense form is $208$ megabytes.

**Insight.** A compressed trie merges the chains of single children, and the node count drops to at most $2n$, which is $4 \times 10^5$ nodes.

**Derivation.** Build the compressed trie directly: insert each word by walking the edges and splitting an edge when the new word diverges from it in the middle. The lookup walks the edges, and on each edge compares the edge label with the characters of the key.

**Correctness.** The compressed trie has the same paths as the uncompressed trie, so the same set of prefixes, so the same lookup answer. The compression only changes how a prefix is spelled, not which prefixes exist.

**Complexity.** $O(\sum |w|)$ to build and $O(L)$ per lookup, with $O(n)$ nodes and a space of a few megabytes. The uncompressed trie is $O(\sum |w|)$ nodes and does not fit.

**Common wrong approach.** Building the uncompressed trie and hoping the memory limit holds, which is exactly what the constraint forbids. The check has to be made against the node count and the alphabet size, and the product is the number that matters.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about prefixes or about substrings, and count the total length of the strings involved.
2. **Direct application.** Implement the trie with a dense array of children and the word count, and check it against a linear scan for the counts on small dictionaries.
3. **Adaptation.** Write the compressed trie, the version with a map of children, and the version that reports every word with a given prefix.
4. **Combination.** Combine the trie with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) or a [segment tree](/algorithms/range-queries/segment-tree) for a version that supports updates, and with a [suffix array](/algorithms/strings/suffix-array) for a version that answers substring queries.
5. **Challenge.** Build a compressed trie over $2 \times 10^5$ words with a total length of $10^7$, and measure the memory against the uncompressed form.
6. **Transfer.** Recognize a trie problem in a different shape: a bitwise trie for the maximum XOR pair, a trie of the prefixes for the "count the strings with a given prefix" family, or the failure links that turn a trie into an Aho-Corasick automaton.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. What does the path from the root to a node spell, and what does the subtree below a node contain? (Formal model)
2. Why is the lookup time independent of the number of stored words? (Formal model)
3. How many nodes does a trie over $n$ words have, and how many does a compressed trie have? (Complexity analysis)
4. What is the alphabet factor, and how large is the dense form at a million nodes? (Complexity analysis)
5. What are the two pieces of information a node needs besides its children, and why are they not interchangeable? (Implementation walkthrough)
6. What is the smallest counterexample that breaks the count that looks at the children? (Common mistakes)
7. When is the trie better than a hash set, and when is it better than a sorted array? (Algorithm selection)
8. What is the recursion depth of a lookup, and when is it dangerous? (Recursion decision)
9. Why does the prefix query need the word count rather than a subtree walk? (Algorithm derivation)
10. What is the compressed trie, and what does it merge? (Variants and extensions)
11. Which question does the trie answer that the suffix array does not? (Algorithm selection)

## Further reading

- The subject index lists this technique, [the trie](/algorithms/strings/trie), beside the other string algorithms in the encyclopedia.
- The subject overview, which lists the string techniques that are not yet covered, is at [the strings](/algorithms/strings/).
- The structure that answers the substring questions that a trie cannot is in [the suffix array](/algorithms/strings/suffix-array).
- The exact linear-time pattern search, which is the alternative for the "does this pattern occur" question, is in [Knuth-Morris-Pratt](/algorithms/strings/kmp).
- The tree representation whose node structure the trie borrows is covered in [graph representation](/algorithms/graphs/representation).
- The traversal that computes the subtree counts is in [depth-first search](/algorithms/graphs/dfs).
- The search over the strings that the trie replaces is in [backtracking](/algorithms/enumeration/backtracking).
- The bitwise version of the same structure, for numbers rather than for characters, is described in [binary representation](/algorithms/foundations/binary-representation).
