---
id: trees.binary-lifting
title: Binary lifting
summary: A table of the ancestors of every vertex, one row per power of two, so that any ancestor can be reached in logarithmic time.
division: [gold, platinum]
subjects: [trees]
level: intermediate
importance: common-contest-technique
keywords:
    [
        binary lifting,
        ancestor table,
        k-th ancestor,
        level ancestor,
        up table,
        jump pointers,
        doubling,
    ]
prerequisites:
    required: [graphs.bfs, foundations.complexity]
    recommended: [trees.lca, graphs.dfs]
complexity:
    time: "O(n log n) to build, O(log n) per query"
    space: "O(n log n)"
assumptions:
    - The input is a tree, or a forest, and it does not change while the queries are answered.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Move up a tree by a given number of edges, or find the ancestor at a given depth |
| **Time** | $O(n \log n)$ to build, $O(\log n)$ per query |
| **Auxiliary space** | $O(n \log n)$ for the table, $O(n)$ for the depths |
| **Requires** | A rooted tree and one traversal to find the parents and the depths |
| **Fails when** | The table has one row too few, or is built in the wrong order |
| **Primary technique** | Doubling, so that a walk of $d$ steps becomes $O(\log d)$ jumps |
| **Related** | The lowest common ancestor, heavy-light decomposition, the Euler tour |

Binary lifting is a table. The table has one row for each power of two, one column for each vertex, and the entry at row $k$ and column $v$ is the ancestor of $v$ that lies $2^k$ edges above it. Every upward walk is then a decomposition into powers of two.

## Problem motivation

A game has $n$ pieces on a board arranged as a tree: each piece sits on a node, and the nodes are connected by parent-child edges. A query asks how many moves a piece must make to reach a node $k$ levels above it, or which piece sits at a given height.

The constraints are what make the table necessary.

- $1 \le n \le 200\,000$ pieces.
- $1 \le q \le 200\,000$ queries.
- The board does not change while the queries run.

Walking up one edge at a time costs $O(n)$ per query, which is $O(nq) = 4 \cdot 10^{10}$ steps in the worst case. The case that hurts is a long chain, where every walk climbs to near the root.

The idea that fixes it is the one that powers the [lowest common ancestor](/algorithms/trees/lca) article: if the structure can jump by $2^k$ edges in a single step and the walk length is known in advance, then the walk length can be written in binary and covered in $O(\log n)$ jumps. This article is about the table itself, the two queries it answers, and the details that make it correct.

## Recognition patterns

Binary lifting is the right tool when all of the following hold.

- The structure is a **tree** or a **forest**, so that every vertex has a unique chain of ancestors.
- The queries ask about **ancestry**: the $k$-th ancestor, the ancestor at a given depth, the lowest common ancestor, or a distance.
- There are **many queries**, each of which would otherwise walk up the tree.
- The tree is **static**.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \ge 10^5$ | The table has $n \log_2 n$ entries, about $15$ MB at $n = 2 \cdot 10^5$ with 32-bit indices |
| $n \ge 10^7$ | The table is $760$ MB, which does not fit; use heavy-light decomposition or a different structure |
| $q = 1$ | One walk up the tree is enough |
| The tree changes between queries | The table must be rebuilt; use a dynamic structure such as a link-cut tree |
| The queries are known in advance | An offline disjoint set union sweep answers them in $O((n+q) \alpha(n))$ |
| The graph is not a tree | There is no single ancestor chain |
| The queries ask for a **path** | The table answers ancestry, not paths; use heavy-light decomposition |

Two phrases in a statement are reliable signals. "The $k$-th ancestor of", "the ancestor at depth $d$", and "how many edges up" point here. "The path from A to B" points away, because the table does not enumerate paths.

<Synonyms terms="binary lifting, binary lifting table, ancestor table, up table, k-th ancestor, level ancestor, jump pointers, doubling, jump table" />

## Naive approach

The baseline is to walk up the parent pointers one edge at a time.

```python
def kth_ancestor(parent, v, k):
    while k > 0:
        v = parent[v]
        k -= 1
    return v
```

This is $O(k)$ per query and $O(n)$ in the worst case. It is correct, it is short, and it is the reference implementation that every faster version should be checked against.

The second baseline is to precompute, for each vertex, the entire chain of its ancestors. That is $O(n^2)$ space in the worst case, which is $4 \cdot 10^{10}$ entries at $n = 200\,000$, and it is dead on arrival.

The third baseline is the square-root decomposition: split the chain of ancestors into blocks of $\sqrt{n}$ and store the block endpoints. It uses $O(n \sqrt{n})$ space and $O(\sqrt{n})$ per query, which is better than walking and worse than the table.

## Key insight

The insight is that a walk of $d$ steps can be replaced by a walk of $O(\log d)$ steps, provided the structure can jump by any power of two.

Define the table

$$
\text{up}[k][v] \;=\; \text{the ancestor of } v \text{ that lies } 2^k
\text{ edges above it}.
$$

Three properties make everything else follow.

**It is defined everywhere.** The root is declared to be its own ancestor, so $\text{up}[k][\text{root}] = \text{root}$ for every $k$, and no entry ever names a vertex that does not exist. This is a convenience, and it is also the reason a query for an ancestor that is too high silently returns the root rather than reporting a failure.

**It is built from itself.** The $2^k$-th ancestor of $v$ is the $2^{k-1}$-th ancestor of the $2^{k-1}$-th ancestor of $v$, so

$$
\text{up}[k][v] \;=\; \text{up}[k-1]\bigl[\text{up}[k-1][v]\bigr].
$$

Each row is a function of the row above it, so the whole table costs $O(n \log n)$ once the parents are known.

**Any distance can be walked.** Every integer $d$ has a binary representation, so $d$ is a sum of distinct powers of two, and a walk of $d$ steps is a sequence of $O(\log d)$ jumps.

The two queries are then immediate.

**The $k$-th ancestor.** Write $k$ in binary and, for each set bit $j$, move $v$ to $\text{up}[j][v]$. The jumps compose, so the total distance covered is the sum of the powers of two in the binary representation of $k$, which is exactly $k$.

**The level ancestor.** Given a vertex $v$ and a target depth $d$, the answer is the ancestor of $v$ at depth $d$, and the distance to climb is $\operatorname{depth}(v) - d$. This is the $k$-th ancestor query with $k = \operatorname{depth}(v) - d$, so the same table and the same code answer it. The difference between the two framings is not algorithmic but practical: the $k$-th ancestor is given a distance, while the level ancestor is given a destination, and the destination form is what a problem usually asks.

## Formal model

Let $T$ be a tree with vertex set $V$, rooted at a vertex $r$, and let $\operatorname{depth}(v)$ be the number of edges on the path from $r$ to $v$.

<MathPanel type="definition" title="Definition">
The **binary lifting table** is
$\text{up}[k][v] = $ the ancestor of $v$ that lies $2^k$ edges above it, with
the root declared to be its own ancestor. The table has
$K = \lfloor \log_2 n \rfloor + 1$ rows, with $k$ running from $0$ to
$K - 1$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **$k$-th ancestor** of a vertex $v$ is the ancestor of $v$ that lies $k$
edges above it. It exists exactly when $k \le \operatorname{depth}(v)$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **level ancestor** of a vertex $v$ at level $d$ is the unique ancestor of
$v$ whose depth is $d$. It exists exactly when
$0 \le d \le \operatorname{depth}(v)$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
For every $k$ and every vertex $v$, $\text{up}[k][v]$ is the ancestor of $v$
that lies $2^k$ edges above it, where the root is its own ancestor.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
The table has $K = \lfloor \log_2 n \rfloor + 1$ rows because the greatest
distance between two vertices of a tree with $n$ vertices is $n - 1$, and the
greatest power of two that can appear in the binary representation of an
integer at most $n - 1$ is at most $n - 1$ itself.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $v_0 = v$ and let $v_1, \ldots, v_t$ be obtained by moving $v_{i-1}$ to
$\text{up}[j_i][v_{i-1}]$ for some indices $j_i$. Then the depth of $v_t$ is
$\operatorname{depth}(v) - \sum_{i=1}^{t} 2^{j_i}$, clamped at zero.
</MathPanel>

## Algorithm derivation

The build rule has two stages. A breadth-first walk from the root fills the depth of every vertex, the parent of every vertex, and the row $\text{up}[0][v] = \operatorname{parent}(v)$. The remaining rows are then filled one at a time.

```text
K = floor(log2(n)) + 1
for k from 1 to K - 1:
    for each vertex v:
        up[k][v] = up[k-1][ up[k-1][v] ]
```

The update rule for the $k$-th ancestor query is a scan over the rows.

```text
lift(v, k):
    for j from 0 to K - 1:
        if the bit j of k is set:
            v = up[j][v]
    return v
```

The update rule for the level ancestor query is the same scan with a different distance.

```text
level_ancestor(v, d):
    if d > depth[v]: report that no such ancestor exists
    return lift(v, depth[v] - d)
```

Both updates are correct because the jumps compose and their total distance is the sum of the powers of two that were used, which the lemma records.

<MathPanel type="invariant" title="Invariant">
When the build reaches row $k$, row $k-1$ is complete and correct, and
$\text{up}[k-1][v]$ is the ancestor of $v$ that lies $2^{k-1}$ edges above it
for every vertex $v$.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
During a query, the accumulated lift is exactly the sum of the powers of two
whose bits have been set so far, and the current vertex is the ancestor of the
original vertex at distance that sum above it.
</MathPanel>

## Step-by-step execution

Take the tree with edges $0-1$, $0-2$, $1-3$, $1-4$, $2-5$, rooted at $0$. The depths are $0, 1, 1, 2, 2, 2$ for the vertices $0, 1, 2, 3, 4, 5$. There are $n = 6$ vertices, so $K = \lfloor \log_2 6 \rfloor + 1 = 3$ rows.

The row $0$ is the parent array.

| Vertex $v$ | $\text{up}[0][v]$ | $\text{up}[1][v]$ | $\text{up}[2][v]$ |
| ---------- | ----------------- | ----------------- | ----------------- |
| 0          | 0                 | 0                 | 0                 |
| 1          | 0                 | 0                 | 0                 |
| 2          | 0                 | 0                 | 0                 |
| 3          | 1                 | 0                 | 0                 |
| 4          | 1                 | 0                 | 0                 |
| 5          | 2                 | 0                 | 0                 |

Row $1$ is computed from row $0$ with the recurrence, and row $2$ from row $1$. Every entry in rows $1$ and $2$ is the root, because the deepest vertex in this tree is at depth two, so a jump of two or more edges lands on the root.

Now the $k$-th ancestor query for the pair $(5, 3)$, that is, the third ancestor of vertex $5$.

1. The binary representation of $3$ is $11$, so the set bits are $0$ and $1$.
2. Row $0$, bit $0$ is set, so $v \gets \text{up}[0][5] = 2$. The vertex $2$ is at depth $1$, which is one step above the depth $2$ of vertex $5$.
3. Row $1$, bit $1$ is set, so $v \gets \text{up}[1][2] = 0$. The vertex $0$ is at depth $0$.
4. The answer is $0$.

The walk is $5 \to 2 \to 0 \to 0$, and the third ancestor of vertex $5$ is the root, since the tree is only two levels deep.

Now the level ancestor query for the pair $(4, 1)$, that is, the ancestor of vertex $4$ at depth one.

1. The depth of vertex $4$ is $2$, and the target depth is $1$, so the climb is $2 - 1 = 1$.
2. The binary representation of $1$ is $1$, so the only set bit is $0$.
3. $v \gets \text{up}[0][4] = 1$, which is at depth $1$.
4. The answer is $1$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The build produces a table in which $\text{up}[k][v]$ is the ancestor of $v$
that lies $2^k$ edges above it.
</MathPanel>

<MathPanel type="proof" title="Proof">
The claim is an induction on $k$. For $k = 0$, the entry is the parent of $v$,
which is the ancestor one edge above it, and the root is its own parent by
convention.

Suppose row $k - 1$ is correct. The ancestor of $v$ that lies $2^k$ edges above it is the ancestor of the ancestor of $v$ that lies $2^{k-1}$ edges above it, and that ancestor is the one that lies a further $2^{k-1}$ edges above it. The recurrence stores exactly that value, because $\text{up}[k-1][\text{up}[k-1][v]]$ is by the induction hypothesis the $2^{k-1}$-th ancestor of the $2^{k-1}$-th ancestor of $v$. If $v$ is close enough to the root that the jump would go past it, the root's self-ancestor property clamps the value at the root, which is the only sensible answer. So every entry is correct. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
The query returns the $k$-th ancestor of the queried vertex, and the
level-ancestor query returns the ancestor at the requested depth.
</MathPanel>

<MathPanel type="proof" title="Proof">
Let $v_0$ be the queried vertex and let $j_1, \ldots, j_t$ be the indices of
the set bits of $k$, in the order the query takes them. The query replaces
$v_{i-1}$ by $\text{up}[j_i][v_{i-1}]$, which by the table lemma is the
ancestor of $v_{i-1}$ that lies $2^{j_i}$ edges above it. Since the
ancestors of a vertex are totally ordered, the ancestor of $v_{i-1}$ at
distance $2^{j_i}$ is also the ancestor of $v_0$ at distance
$\sum_{s \le i} 2^{j_s}$. By induction on $i$, $v_i$ is the ancestor of $v_0$
at distance $\sum_{s \le i} 2^{j_s}$ above it.

The binary representation of $k$ is the sum of the powers of two corresponding to its set bits, so $\sum_{s=1}^{t} 2^{j_s} = k$. Hence $v_t$ is the ancestor of $v_0$ at distance $k$, which is the $k$-th ancestor.

For the level ancestor, the ancestors of $v$ at the depths $\operatorname{depth}(v), \operatorname{depth}(v) - 1, \ldots, 0$ are exactly the $0$-th, $1$-th, $\ldots$, $\operatorname{depth}(v)$-th ancestors. The ancestor at depth $d$ is therefore the $\operatorname{depth}(v) - d$-th ancestor, and the query computes exactly that. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
The table has $K = \lfloor \log_2 n \rfloor + 1$ rows, and that many rows are
sufficient for every query the tree can produce.
</MathPanel>

<MathPanel type="proof" title="Proof">
The greatest distance between two vertices of a tree with $n$ vertices is
$n - 1$, so a query never asks for a climb longer than $n - 1$. The largest
power of two that appears in the binary representation of an integer at most
$n - 1$ is at most $n - 1$, and it is at most $2^{\lfloor \log_2 n \rfloor}$,
which is the jump of the last row. So $K$ rows cover every query, and the
largest jump the table offers is $2^{K-1} \ge n - 1$ when $n$ is a power of
two, which is more than enough. $\square$
</MathPanel>

## Complexity analysis

**The traversal: $O(n)$ time**, since a tree has $n - 1$ edges.

**Building the table: $O(n \log n)$ time.** There are $K = \lfloor \log_2 n \rfloor + 1$ rows and $n$ entries in each row, and each entry costs one table lookup and one store.

**Each query: $O(\log n)$ time.** The scan over the rows examines $K$ rows and performs at most one jump per row.

**Space: $O(n \log n)$** for the table, plus $O(n)$ for the depths and the traversal queue.

<MathPanel type="complexity" title="Complexity">
Binary lifting over a tree with $n$ vertices: $O(n \log n)$ time to build,
$O(\log n)$ per query, and $O(n \log n)$ extra space.
</MathPanel>

The width of the entries matters, because the table is the largest object in the program. At $n = 200\,000$ there are $19$ rows, so $3.8$ million entries, which is about $15$ MB with 32-bit indices and $30$ MB with 64-bit indices. A table of distances instead of ancestor indices would cost $O(n^2)$ and is not an option.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The $k$-th ancestor of a vertex | Binary lifting |
| The ancestor of a vertex at a given depth | Binary lifting |
| The lowest common ancestor of two vertices | Binary lifting, or an Euler tour with a sparse table |
| The distance between two vertices | Binary lifting with the depths |
| Many ancestor queries known in advance | A disjoint set union sweep, offline |
| The tree changes between queries | A link-cut tree |
| A sum or maximum over a path | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| The number of vertices in a subtree | The subtree sizes, which need no table at all |
| A single ancestor query | Walk up the parents |
| The tree is a chain | The depth alone answers everything |

The last row is worth a note, because it is the case in which the simplest approach is also the fastest. On a chain the ancestors of a vertex are all the vertices before it, so the $k$-th ancestor is determined by the depth alone and no table is needed.

## Recursion decision

The table is built with two loops and the query is a loop over the rows. Neither recurses. The traversal that finds the parents and the depths is the one place where the choice matters, and it should be iterative whenever the depth of the tree can be large.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a chain of $n$ vertices needs $n$ frames |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

<MathPanel type="counterexample" title="Counterexample">
A tree that is a chain on $10^6$ vertices, rooted at one end. The table is
built correctly and every query is answered correctly, but the recursive
traversal makes one nested call per vertex, so in C++ on Linux with an 8 MB
stack and a frame of roughly 64 bytes the stack is exhausted after about
$130\,000$ frames, and the program dies with a segmentation fault after
building $13\%$ of the table. The iterative traversal finishes normally.
</MathPanel>

The iterative traversal needs the index of the next neighbor to examine, stored alongside the vertex, so that it can tell "just entered this vertex" from "returned to this vertex from a child". That distinction matters for the table as well, because the table is built from the parents and the parents come from the traversal.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Allocating $\lfloor \log_2 n \rfloor$ rows | The longest jumps cannot be expressed | Allocate $\lfloor \log_2 n \rfloor + 1$ rows |
| Building the table column by column | Entries read a row that is not yet built | Build one whole row at a time |
| Starting the row loop at $k = 1$ but not filling row $0$ | Every entry is garbage | Fill row $0$ with the parents |
| Forgetting that the root is its own ancestor | Entries above the root are undefined | Initialize the root's column to the root |
| Not checking that the requested ancestor exists | The answer is the root, reported as if it were real | Test the depth before the query |
| Using a 32-bit index where the vertex count exceeds it | Out-of-range reads | Use a 64-bit index for very large trees |
| Jumping by powers of two in the wrong order | The jumps still compose, so this is harmless, but it surprises readers | Any order works; the query above uses increasing row order |
| Confusing the table with a distance table | $O(n^2)$ memory | Store ancestor indices, not distances |

### Why this fails: the table with one row too few

The mistake that survives review most often is allocating $\lfloor \log_2 n \rfloor$ rows instead of $\lfloor \log_2 n \rfloor + 1$.

The smallest counterexample is a chain of five vertices, $0 - 1 - 2 - 3 - 4$, rooted at $0$.

With $\lfloor \log_2 5 \rfloor = 2$ rows, the table offers jumps of $1$ and $2$, so the largest distance that can be expressed is $3$. Now ask for the fourth ancestor of vertex $4$. The truth is that the path from $4$ to the root is $4 \to 3 \to 2 \to 1 \to 0$, so the fourth ancestor is the root $0$.

With two rows, the query can climb at most $3$ edges, so it ends at vertex $1$ and reports $1$ as the answer. The truth is $0$.

The failure needs a tree whose depth exceeds the largest distance the short table can express, so it needs $n - 1 > 2^{\lfloor \log_2 n \rfloor} - 1$. That inequality holds first at $n = 5$, which is why five vertices is the smallest counterexample.

The general rule is that the table must offer a jump of at least $n - 1$, and the smallest power of two that is at least $n - 1$ is $2^{\lfloor \log_2 (n-1) \rfloor + 1}$ in the worst case, which is exactly what $\lfloor \log_2 n \rfloor + 1$ rows provide.

### Why this fails: the ancestor that does not exist

The second mistake is to rely on the root being its own ancestor without ever checking that the requested ancestor exists.

The smallest counterexample is a chain of four vertices, $0 - 1 - 2 - 3$, rooted at $0$. Vertex $3$ is at depth $3$, so its fourth ancestor does not exist.

The table answers $0$, because every jump past the root clamps there, and the program reports $0$ as if it were a real answer. The level-ancestor form fails the same way: a query for the ancestor of vertex $3$ at depth $-1$, or the $k$-th ancestor with $k > 3$, returns the root.

This is only a bug when the statement allows such a query. Many statements promise that the ancestor exists, and the code silently depends on the promise. The one-line test is to compare the requested depth with the depth of the vertex before the query, and to report a failure when the request is out of range.

### Why this fails: the table built in the wrong order

The third mistake is to build the table column by column, that is, to compute all the levels of one vertex before moving on to the next vertex.

The smallest counterexample has three vertices: a root $3$ with two children $0$ and $1$.

The parents are $\text{up}[0][0] = 3$, $\text{up}[0][1] = 3$, and $\text{up}[0][3] = 3$. Building column by column and processing the vertices in the order $0, 1, 3$, the entry $\text{up}[0][3]$ has not been written when the builder reaches vertex $0$ and tries to compute $\text{up}[1][0] = \text{up}[0][\text{up}[0][0]] = \text{up}[0][3]$. It reads whatever the array happened to contain, which is not $3$.

The truth is that the second ancestor of vertex $0$ is the root $3$, since the path is $0 \to 3 \to 3$. The buggy table reports whatever was in the uninitialized entry, which on a fresh array is $0$.

The general rule is that the recurrence reads row $k - 1$ and writes row $k$, so the rows must be built in order and each row must be complete before the next one starts. A column-major build is only safe when the parents are guaranteed to have smaller indices than their children, which is a property of the input that the algorithm should never assume.

## Variants and extensions

- **The lowest common ancestor.** The table answers it in $O(\log n)$, by lifting the deeper vertex and then descending together. The full treatment is in the [lowest common ancestor](/algorithms/trees/lca) article.
- **The distance between two vertices.** The distance is $\operatorname{depth}(u) + \operatorname{depth}(v) - 2\operatorname{depth}(\operatorname{lca}(u,v))$, so the same table answers it.
- **Constant-time level ancestors.** A longer decomposition of the tree, the ladder method, answers a level ancestor in $O(1)$ time with $O(n \log n)$ space, using the same doubling idea plus a set of jump pointers along long chains.
- **Heavy-light decomposition.** The other way to answer path queries, by splitting the tree into chains. It uses $O(n)$ space and $O(\log^2 n)$ per path query, against the $O(n \log n)$ space of the table.
- **Link-cut trees.** For a tree whose edges change, a link-cut tree answers ancestor and path queries with an amortized logarithmic cost per operation.
- **Offline ancestor queries.** A disjoint set union sweep answers all the ancestor queries of a static tree in $O((n + q) \alpha(n))$ time, which beats $O(q \log n)$ when $q$ is large and the queries are known in advance.
- **The doubling idea elsewhere.** The same table shape answers a jump query in a functional graph, where each vertex has one successor, and it is the standard tool for that problem.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Root the tree first, and write the root into a variable rather than hard-coding it.
2. Compute the number of rows as $\lfloor \log_2 n \rfloor + 1$, and write that formula in the code rather than a literal.
3. Build the table one whole row at a time, in increasing order of the row index.
4. Write the $k$-th ancestor query as a scan over the rows with a bit test, and use the same routine for the level ancestor.
5. Check the depth before answering a query whose ancestor might not exist.
6. Test three cases by hand: a vertex with itself, the parent of a root child, and a climb longer than the depth. The third is the one that catches the missing row.
7. Write the naive walk as a reference and compare on random pairs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the ancestor at a given height

**Restatement.** A tree of $n$ vertices is given, rooted at vertex $1$. Each query names a vertex $v$ and a depth $d$, and asks for the ancestor of $v$ at depth $d$. Constraints: $1 \le n, q \le 200\,000$.

**Naive baseline.** Walk up the parents to the requested depth, at a cost of $O(n)$ per query.

**Insight.** The climb is $\operatorname{depth}(v) - d$ edges, and any distance is a sum of powers of two.

**Derivation.** Build the table with a breadth-first traversal and the recurrence. Answer each query by scanning the rows and jumping whenever the corresponding bit of $\operatorname{depth}(v) - d$ is set.

**Correctness.** The proof above shows that the jumps compose and cover exactly the requested distance.

**Complexity.** $O(n \log n)$ to build, $O(\log n)$ per query, and $O(n \log n)$ space.

**Common wrong approach.** Answering with the depth alone, which is the distance rather than the vertex.

### Problem 2: the jumps of a piece on a game board

**Restatement.** A tree of $n$ squares is given. Each query names a square and a number $k$, and asks which square a piece reaches after $k$ upward moves. Constraints: $1 \le n, q \le 200\,000$, and $k < n$.

**Naive baseline.** Move up one edge at a time.

**Insight.** The binary representation of $k$ turns the walk into a set of jumps, and the table stores every jump size.

**Derivation.** Build the table and answer each query with the bit scan.

**Correctness.** The table lemma gives the correctness of each jump, and the sum of the jumps is $k$.

**Complexity.** $O(n \log n)$ to build, $O(\log n)$ per query.

**Common wrong approach.** Allocating too few rows, so that a large $k$ cannot be expressed at all. The constraint $k < n$ does not save the implementation, because the table must still offer a jump of size $n - 1$.

### Problem 3: the distance between two squares

**Restatement.** A tree of $n$ squares is given. Each query names two squares and asks for the number of edges on the path between them. Constraints: $1 \le n, q \le 200\,000$.

**Naive baseline.** Walk up from both squares until they meet, at a cost of $O(n)$ per query.

**Insight.** The path from $u$ to $v$ goes up from $u$ to the lowest common ancestor and down to $v$, so its length is the sum of the two depths minus twice the depth of the common ancestor.

**Derivation.** Build the table and the depths. Answer each query by lifting the deeper square to the depth of the other, then descending together from the largest row down, and finally reporting $\operatorname{depth}(u) + \operatorname{depth}(v) - 2\operatorname{depth}(w)$.

**Correctness.** The table lemma gives the correctness of the lifts, and the path decomposition gives the formula. The full treatment of the descent is in the [lowest common ancestor](/algorithms/trees/lca) article.

**Complexity.** $O(n \log n)$ to build, $O(\log n)$ per query.

**Common wrong approach.** Reporting the number of squares on the path instead of the number of edges, which is off by one on every query.

## Practice progression

1. **Recognition.** Given a statement, decide whether binary lifting applies. Look for ancestor queries, level queries, distance queries, and a static tree.
2. **Direct application.** Build the table and answer the $k$-th ancestor queries, then verify against the naive walk on random pairs.
3. **Adaptation.** Answer the level ancestor, the distance, and the lowest common ancestor queries, and notice that the last one needs a table entry per row in a different way.
4. **Combination.** Combine the table with a sparse table over an Euler tour to answer the lowest common ancestor in constant time, and with a disjoint set union to answer the queries offline.
5. **Challenge.** Solve a problem where the tree changes between queries and discover that the table cannot be maintained incrementally; then solve the offline version.
6. **Transfer.** Use the doubling idea elsewhere: the successor jumps of a functional graph, the subset-sum doubling in the [binary representation](/algorithms/foundations/binary-representation) article, or the ancestor table of a trie.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does $\text{up}[k][v]$ store, and what recurrence fills the table? (Formal model)
2. How many rows does the table have, and why is that many enough? (Formal model)
3. Why must the root be declared to be its own ancestor? (Formal model)
4. How does a walk of $d$ steps become $O(\log d)$ jumps? (Key insight)
5. What is the difference between the $k$-th ancestor and the level ancestor, and how are they related? (Formal model)
6. Why must the rows be built one at a time, in order? (Why this fails)
7. What is the smallest tree on which a table with too few rows gives a wrong answer? (Why this fails)
8. What happens when the requested ancestor does not exist, and how is it detected? (Why this fails)
9. How many table entries are there at $n = 200\,000$, and what do they cost in bytes? (Complexity analysis)
10. When is recursion unsafe, and what is the failure mode? (Recursion decision)
11. When is an offline disjoint set union sweep the better tool? (Algorithm selection)
12. What other problems does the doubling idea solve? (Variants and extensions)

## Further reading

- The query that the table was originally built for, and the two-phase descent that uses it, is the subject of the [lowest common ancestor](/algorithms/trees/lca) article.
- The other path-query technique, which uses $O(n)$ space instead of $O(n \log n)$, is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The traversal that finds the parents and the depths is [breadth-first search](/algorithms/graphs/bfs), and the recursive form of the same traversal is [depth-first search](/algorithms/graphs/dfs).
- The flattening that answers the ancestor question in constant time, by an interval test instead of a table, is [the Euler tour for trees](/algorithms/trees/euler-tour).
- The call-stack limit that decides between the recursive and the iterative traversal is covered in [recursion](/algorithms/foundations/recursion).
