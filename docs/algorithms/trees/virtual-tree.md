---
id: trees.virtual-tree
title: Virtual trees
summary: Compress a tree to the marked vertices and their lowest common ancestors, so a query touches a set proportional to the marked vertices instead of the whole tree.
division: [platinum]
subjects: [trees]
level: advanced
importance: advanced-technique
keywords:
    [
        virtual tree,
        auxiliary tree,
        compressed tree,
        lca,
        preorder,
        marked vertices,
        stack construction,
    ]
prerequisites:
    required: [trees.lca, graphs.dfs, foundations.complexity]
    recommended: [trees.heavy-light-decomposition, trees.tree-dp]
complexity:
    time: "O(n log n) to preprocess, O(k log k + k log n) per query"
    space: "O(n log n) for the ancestor table, O(k) for the virtual tree"
assumptions:
    - The original tree is static, so the ancestor table and the preorder intervals stay valid.
    - The marked set is known when the query starts, so its virtual tree can be built for that query.
implementations: trees.virtual-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="trees.virtual-tree" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="trees.virtual-tree" />

A **virtual tree** of a set $S$ of vertices is the smallest subtree of the original tree that connects $S$, with every non-marked vertex of degree two suppressed. Its vertex set is $S$ together with the lowest common ancestor of every pair of vertices in $S$. Every edge of the virtual tree is therefore a path of the original tree, and it carries the length of that path.

For a nonempty set $S$, the size of the virtual tree is at most $2 \lvert S \rvert - 1$, no matter how large the original tree is. Building it needs two ingredients: the preorder interval of every vertex, and a data structure that answers lowest common ancestor queries. Sorting the marks by preorder, adding the lowest common ancestor of each pair of adjacent marks, and then rebuilding the tree with one stack pass costs $O(k \log k + k \log n)$ for a query with $k$ marks.

The important consequence is that a query never has to look at the vertices that are neither marked nor branch points. On a tree of $200\,000$ vertices, a query with ten marks touches at most nineteen virtual vertices.

## Problem motivation

A railway company maintains a tree of $n$ junctions. An inspection plan marks $k$ junctions that must be visited, and the inspector needs the total length of the smallest set of tracks that connects all of them. The company runs $q$ plans, and the sum of the plan sizes is bounded, but $n$ and $q$ are not.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ junctions.
- $1 \le q \le 200\,000$ plans.
- Each plan has $k$ marked junctions, and the sum of all $k$ is at most $200\,000$.
- The railway is a tree, so there is exactly one path between any two junctions.

The direct approach runs a traversal for every plan. A traversal costs $O(n)$, so the total is $O(nq)$, which is $4 \cdot 10^{10}$ steps in the worst case. The case that hurts is a large tree and many tiny plans: almost every vertex is irrelevant to every plan, but the traversal visits them all.

The problem is that the plans are small and the tree is large. If the irrelevant vertices could be discarded once, in proportion to the number of marks, each plan would cost $O(k \log n)$ instead of $O(n)$.

## Recognition patterns

A virtual tree is the right tool when all of the following hold.

- The structure is a **tree**, or a forest after adding a super-root.
- Many queries each name a **small set of marked vertices**.
- The answer depends on the marks and on the **branch points between them**, not on every vertex.
- The tree does **not change** between queries, so the ancestor table stays valid.
- The total size of all marked sets is **manageable**, even when a single set is large.

The constraint values that rule the technique in and out.

| Signal | What it means |
| --- | --- |
| $n$ is large and the sum of the set sizes is small | The virtual tree removes the irrelevant vertices |
| Every vertex is marked | There is nothing to compress; use a direct traversal |
| The tree changes between queries | The preorder and ancestor table are stale; rebuild or use a dynamic structure |
| The query asks for the vertices of a path, not only its length | The virtual tree stores compressed paths, so the internal vertices must be expanded separately |
| The structure is a general graph | There is no unique ancestor chain and no lowest common ancestor |
| The only output is the total weight of the minimal subtree | A cyclic distance sum answers it without building the virtual tree |
| The marks are known in advance and the query is offline | A virtual tree still works, and a different offline sweep may also work |

The phrase in a statement that signals this technique is "for each of the $q$ queries, the set of important vertices", together with a bound on the sum of the set sizes. The bound is the permission to spend time proportional to the set.

<Synonyms terms="virtual tree, auxiliary tree, compressed tree, mark set, Steiner tree" />

## Naive approach

The baseline is to prune the original tree for every query. Mark the vertices of the set, then repeatedly remove an unmarked leaf. When no unmarked leaf remains, every surviving edge belongs to the minimal subtree.

```python
from collections import deque


def steiner_weight(adj, edges, marked):
    marked = set(marked)
    n = len(adj)
    alive = [True] * n
    degree = [len(adj[v]) for v in range(n)]
    queue = deque(v for v in range(n) if degree[v] <= 1 and v not in marked)
    while queue:
        v = queue.popleft()
        if not alive[v]:
            continue
        alive[v] = False
        for u, _ in adj[v]:
            if alive[u]:
                degree[u] -= 1
                if degree[u] <= 1 and u not in marked:
                    queue.append(u)
    return sum(w for u, v, w in edges if alive[u] and alive[v])
```

This is correct, and it is the reference implementation for the differential test. It is $O(n)$ per query, so it is $O(nq)$ in total.

The second baseline is to add the path between every pair of marks. There are $O(k^2)$ pairs, and each path can be listed in $O(n)$, so the cost is $O(k^2 n)$; even with a lowest common ancestor table it is $O(k^2 \log n)$. At $k = 200\,000$ the pair count is $2 \cdot 10^{10}$, so this approach is dead on arrival.

The third baseline is worth knowing because it is sometimes the final answer. If the query only asks for the total weight, sort the marks by preorder and add the distance between each consecutive pair, including the pair formed by the last and the first mark. That cyclic sum is twice the weight of the minimal subtree. The approach is $O(k \log k + k \log n)$ and needs no virtual tree, but it does not produce the structure that a dynamic program or a greedy decision needs.

## Key insight

The insight is that a vertex which is not marked and has only one child leading to a mark cannot be a branch point. It lies in the middle of a corridor, and the whole corridor can be replaced by one weighted edge.

The vertices that can be branch points are exactly the lowest common ancestors of pairs of marks. Define

$$
V(S) \;=\; S \;\cup\; \{\, \operatorname{lca}(u,v) : u,v \in S \,\}.
$$

The virtual tree is the tree on $V(S)$ in which two vertices are joined when one is an ancestor of the other and no third vertex of $V(S)$ lies strictly between them. Its edge weight is the distance in the original tree between the two endpoints.

The vertex set has two properties that make the construction possible.

**It is closed under lowest common ancestors.** If $u$ and $v$ are in $V(S)$, then $\operatorname{lca}(u,v)$ is in $V(S)$. This is immediate for $u,v \in S$, and the lowest common ancestor of two vertices that are already lowest common ancestors is again a lowest common ancestor of two marks.

**It is enough to take adjacent marks.** Sort the marks in preorder as $x_1, x_2, \dots, x_m$. Then

$$
V(S) \;=\; S \;\cup\; \{\, \operatorname{lca}(x_i,x_{i+1}) : 1 \le i < m \,\}.
$$

The reason is the preorder property: if two marks lie in different child subtrees of a vertex $w$, then somewhere between them in preorder there is a last mark in the first subtree and a first mark in the next subtree, and the lowest common ancestor of that adjacent pair is $w$.

The size follows from the second property: there are $m$ marks and at most $m-1$ added ancestors, so

$$
\lvert V(S) \rvert \;\le\; 2 \lvert S \rvert - 1.
$$

The stack construction is the last piece. Process $V(S)$ in preorder and keep a stack of the vertices on the rightmost path of the virtual tree built so far. When a new vertex $x$ arrives, pop until the top of the stack is an ancestor of $x$. That top is the deepest virtual ancestor of $x$, so it is the virtual parent of $x$. Add the edge and push $x$.

The stack is correct because the vertex set is closed under lowest common ancestors. If $x$ belongs to a new branch of some vertex $w$, then $w$ is in $V(S)$ and is still on the stack; no other vertex can be the parent of $x$ in the virtual tree.

## Visual intuition

Draw the original tree as a road network, with the marked vertices painted red. The virtual tree keeps the red vertices and the junctions where two or more red branches meet. Every road between two such vertices is collapsed into a single edge whose length is the length of the whole road, including the unmarked towns in between.

The picture has two useful readings.

**The skeleton reading.** The minimal subtree connecting the red vertices is a skeleton inside the original tree. Suppressing degree-two vertices does not change the total length of the skeleton; it only removes the towns that are not junctions. The virtual tree is that skeleton with the corridors labeled by their lengths.

**The stack reading.** Walk through the original tree in preorder. The stack holds the rightmost path of the skeleton built so far. A new red vertex is a hook that pulls the path back to its deepest ancestor, and the part that is popped is a finished branch. The edge that is added is the corridor from that ancestor to the new vertex.

The two readings explain why the construction never needs to look at the unmarked leaves. They are not on any path between marks, and the pruning baseline would remove them immediately.

## Formal model

Let $T = (V,E)$ be a tree with a chosen root $r$, and let $w(e)$ be the weight of an edge. The tree is static: no vertex or edge changes after preprocessing.

::: math definition Definition
The **preorder interval** of a vertex $v$ is the pair $(\operatorname{tin}(v), \operatorname{tout}(v))$, where $\operatorname{tin}(v)$ is the position of $v$ in a depth-first preorder and $\operatorname{tout}(v)$ is one past the last position in the subtree of $v$. A vertex $u$ is an **ancestor** of $v$ exactly when $\operatorname{tin}(u) \le \operatorname{tin}(v) < \operatorname{tout}(u)$.
:::

::: math definition Definition
The **depth** $\operatorname{depth}(v)$ is the number of edges on the path from the root to $v$. The **root distance** $\operatorname{rootdist}(v)$ is the sum of the edge weights on that path. The **distance** between two vertices is

$$
\operatorname{dist}(u,v) \;=\; \operatorname{rootdist}(u) + \operatorname{rootdist}(v) - 2 \operatorname{rootdist}(\operatorname{lca}(u,v)).
$$
:::

::: math definition Definition
For a set $S \subseteq V$, the **virtual tree** $VT(S)$ has vertex set

$$
V(S) \;=\; S \;\cup\; \{\, \operatorname{lca}(u,v) : u,v \in S \,\}.
$$

Two vertices $p$ and $c$ of $V(S)$ are joined by an edge when $p$ is an ancestor of $c$ and no vertex of $V(S)$ lies strictly between them. The weight of that edge is $\operatorname{dist}(p,c)$.
:::

::: math lemma Lemma
$\lvert V(S) \rvert \le 2 \lvert S \rvert - 1$ for every nonempty set $S$.
:::

::: math lemma Lemma
Let $x_1, x_2, \dots, x_m$ be the vertices of a nonempty set $S$ sorted by preorder. Then

$$
V(S) \;=\; S \;\cup\; \{\, \operatorname{lca}(x_i,x_{i+1}) : 1 \le i < m \,\}.
$$
:::

::: math lemma Lemma
Let $p$ be the top of the stack after the pops for a vertex $c$ of $V(S)$, when the vertices are processed in preorder. Then $p$ is the parent of $c$ in $VT(S)$, unless $c$ is the first vertex, in which case $c$ is the root of $VT(S)$.
:::

::: math lemma Lemma
The sum of the weights of the edges of $VT(S)$ equals the weight of the minimal subtree of $T$ that connects $S$.
:::

## Algorithm derivation

The state has two parts: the original tree and the current virtual tree. The original tree is preprocessed once. The virtual tree is built per query and then discarded.

**Preprocessing.** Run one iterative depth-first traversal from the chosen root. It fills the parent, the edge depth, the weighted root distance, and the preorder interval of every vertex. Then build the binary lifting table

$$
\operatorname{up}[k][v] \;=\; \text{the ancestor of } v \text{ that lies } 2^k \text{ edges above it},
$$

with $\operatorname{up}[0][v] = \operatorname{parent}(v)$ and $\operatorname{up}[k][v] = \operatorname{up}[k-1][\operatorname{up}[k-1][v]]$. The root is its own ancestor.

**A query with marked set $S$.**

1. Read the marks. Ignore a vertex that is outside the tree or outside the root's component, and remove duplicates.
2. Sort the surviving marks by $\operatorname{tin}$.
3. If there are fewer than two marks, the answer is $0$.
4. Copy the marks into a node list. For each adjacent pair of marks, append their lowest common ancestor.
5. Sort the node list by $\operatorname{tin}$ and remove duplicates.
6. Walk the node list with a stack. For each vertex $c$, pop while the top is not an ancestor of $c$. If the stack is not empty, add $\operatorname{rootdist}(c) - \operatorname{rootdist}(p)$ to the total, where $p$ is the new top. Push $c$.
7. Return the total.

The stack step is the virtual tree construction. The edge is weighted by the difference of the root distances because $p$ is an ancestor of $c$, so the original path from $p$ to $c$ goes straight down the tree.

::: math invariant Invariant
Before a vertex $c$ of $V(S)$ is processed, the stack contains exactly the vertices on the path from the root of $VT(S)$ to the previous vertex in preorder, in increasing order of depth. Every edge of $VT(S)$ whose child has already been popped has been added to the total.
:::

The invariant explains the pop rule. A new vertex cannot be an ancestor of the previous vertex, because its preorder position would then be earlier. It can be a descendant of the top, or it can belong to a later subtree. Popping removes the branches that are finished; the first vertex that is still an ancestor is the virtual parent.

## Step-by-step execution

Take the tree with weighted edges

$$
0\!-\!1 : 2,\quad 0\!-\!2 : 3,\quad 1\!-\!3 : 4,\quad 1\!-\!4 : 5,\quad 2\!-\!5 : 6,\quad 2\!-\!6 : 7,
$$

rooted at $0$. A preorder traversal that visits the neighbors in the order they are listed produces the order $0,1,3,4,2,5,6$. The preprocessed values are below.

| Vertex | Parent | Depth | Root distance | $\operatorname{tin}$ | $\operatorname{tout}$ |
| ------ | ------ | ----- | ------------- | -------------------- | --------------------- |
| 0      | 0      | 0     | 0             | 0                    | 7                     |
| 1      | 0      | 1     | 2             | 1                    | 4                     |
| 2      | 0      | 1     | 3             | 4                    | 7                     |
| 3      | 1      | 2     | 6             | 2                    | 3                     |
| 4      | 1      | 2     | 7             | 3                    | 4                     |
| 5      | 2      | 2     | 9             | 5                    | 6                     |
| 6      | 2      | 2     | 10            | 6                    | 7                     |

Now query the marked set $S = \{3,4,5\}$.

The marks in preorder are $3,4,5$. The adjacent lowest common ancestors are $\operatorname{lca}(3,4) = 1$ and $\operatorname{lca}(4,5) = 0$. The closure is $\{0,1,3,4,5\}$, already in preorder. The stack trace is below.

| Step | Vertex | Popped | Stack top after pops | Added | Total | Stack after push |
| ---- | ------ | ------ | -------------------- | ----- | ----- | ---------------- |
| 1    | 0      | none   | empty                | 0     | 0     | 0                |
| 2    | 1      | none   | 0                    | 2     | 2     | 0, 1             |
| 3    | 3      | none   | 1                    | 4     | 6     | 0, 1, 3          |
| 4    | 4      | 3      | 1                    | 5     | 11    | 0, 1, 4          |
| 5    | 5      | 4, 1   | 0                    | 9     | 20    | 0, 5             |

The answer is $20$. The virtual tree has the edges $0\!-\!1$ of weight $2$, $1\!-\!3$ of weight $4$, $1\!-\!4$ of weight $5$, and $0\!-\!5$ of weight $9$. The last edge represents the original path $0\!-\!2\!-\!5$, whose middle vertex $2$ is not marked and has only one marked descendant, so it was suppressed. The total is $2+4+5+9=20$.

The other queries are shorter.

- For $S=\{3,4\}$, the closure is $\{1,3,4\}$ and the edges are $1\!-\!3$ and $1\!-\!4$, for a total of $4+5=9$.
- For $S=\{3\}$, there are fewer than two marks, so the total is $0$.
- For $S=\varnothing$, the total is $0$.

Notice that the root $0$ is not marked in the first query. It enters the closure only because it is the lowest common ancestor of $4$ and $5$. A virtual tree can contain many unmarked vertices; what it cannot contain is an unmarked vertex with only one marked branch below it.

## Correctness proof

::: math theorem Theorem
The closure built from the marks and the lowest common ancestors of adjacent marks in preorder is exactly $V(S)$.
:::

::: math proof Proof
Both sides are empty when $S$ is empty and equal to $S$ when $\lvert S \rvert = 1$, so assume at least two marks. The inclusion $S \cup \{\operatorname{lca}(x_i,x_{i+1})\} \subseteq V(S)$ is immediate because each adjacent pair consists of two marks. For the other inclusion, take any two marks $u$ and $v$ and let $w = \operatorname{lca}(u,v)$. If $w$ is one of $u$ or $v$, then $w \in S$. Otherwise $u$ and $v$ lie in two different child subtrees of $w$. Let $x_i$ be the last mark in preorder that lies in the child subtree containing $u$, and let $x_{i+1}$ be the next mark. Because $v$ lies in a different child subtree of $w$ and $w$ is the lowest common ancestor, $x_{i+1}$ also lies in the subtree of $w$, so $\operatorname{lca}(x_i,x_{i+1}) = w$. The pair is adjacent in the sorted order, so $w$ is added. Every lowest common ancestor of two marks is therefore present. $\square$
:::

::: math theorem Theorem
The stack pass adds exactly the edges of $VT(S)$, each with its correct weight.
:::

::: math proof Proof
Process the vertices of $V(S)$ in preorder. The first vertex is the shallowest vertex of $V(S)$, because an ancestor always precedes its descendants. It is the root of the virtual tree, and the stack starts empty, so no edge is added for it.

For a later vertex $c$, let $p$ be the vertex that remains on top after all vertices that are not ancestors of $c$ have been popped. Every vertex below $p$ on the stack is an ancestor of $p$, hence also an ancestor of $c$. The vertex $p$ is in $V(S)$ and is an ancestor of $c$. No vertex of $V(S)$ lies strictly between $p$ and $c$: such a vertex would be an ancestor of $c$ deeper than $p$, and it would still be on the stack, contradicting the choice of $p$. Therefore $p$ is the parent of $c$ in $VT(S)$.

The edge weight is $\operatorname{rootdist}(c) - \operatorname{rootdist}(p)$. Since $p$ is an ancestor of $c$, the original path from $p$ to $c$ is the downward path from $p$ to $c$, and its total weight is the difference of the root distances. Every edge of $VT(S)$ is added exactly once, when its child endpoint is processed, and no other edge is added. $\square$
:::

::: math theorem Theorem
The total weight of $VT(S)$ equals the weight of the minimal subtree of $T$ connecting $S$.
:::

::: math proof Proof
The minimal subtree is the union of the paths between all pairs of marks. Consider one edge of the virtual tree, from $p$ to $c$. Its internal vertices are not in $V(S)$: a mark there would be in $S \subseteq V(S)$, and a lowest common ancestor there would be in $V(S)$ by closure. Internal vertices therefore have degree two in the minimal subtree, and the virtual edge represents the whole original path between $p$ and $c$.

Every edge of the minimal subtree lies on a path between two marks. Walking that path from one mark to the other, the sequence of vertices of $V(S)$ partitions it into virtual edges. The virtual edges are edge-disjoint because $VT(S)$ is a tree, and their union is the minimal subtree. The sum of their weights is therefore the weight of the minimal subtree. $\square$
:::

## Complexity analysis

**Preprocessing: $O(n + m)$** time for the traversal, which is $O(n)$ because a tree has $m = n - 1$ edges.

**Building the ancestor table: $O(n \log n)$** time, since there are $O(\log n)$ rows and $n$ entries per row.

**A query with $k$ marks: $O(k \log k + k \log n)$** time. Filtering and deduplicating the marks is $O(k)$. Sorting them is $O(k \log k)$. There are at most $k-1$ lowest common ancestor queries, each $O(\log n)$. The closure has at most $2k-1$ vertices, so sorting and deduplicating it is $O(k \log k)$, and the stack pass is $O(k)$.

**Space: $O(n \log n)$** for the ancestor table, plus $O(n)$ for the traversal arrays, plus $O(k)$ for the marks, the closure, and the stack.

::: math complexity Complexity
Preprocessing a tree of $n$ vertices costs $O(n \log n)$ time and $O(n \log n)$ space. A query with $k$ marks costs $O(k \log k + k \log n)$ time and $O(k)$ extra space.
:::

The width of the table matters less than it did for a dense ancestor structure. At $n = 200\,000$, there are $\lfloor \log_2 n \rfloor + 1 = 18$ rows and $3.6$ million entries. At four bytes per entry, the table is about $14$ MB. The virtual tree itself is charged per query, and its arrays can be reused between queries.

If all queries are known in advance and their total size is $K$, the whole run costs

$$
O(n \log n + K \log n + \sum_{\text{queries}} k \log k).
$$

The sorting term is usually dominated by the ancestor queries unless a single query is very large.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Many queries, each with a small marked set, and the answer depends on branches | A virtual tree |
| The only output is the total weight of the minimal subtree | The cyclic distance sum; no virtual tree is needed |
| The query asks for a dynamic program or a greedy decision on the marked structure | A virtual tree, followed by a linear pass over it |
| Every vertex is marked | A direct tree traversal or tree dynamic program |
| The tree changes between queries | Rebuild the preprocessing, or use a dynamic tree structure |
| The structure is a general graph | No unique ancestor chain; use a different technique |
| A query has only two or three marks | Pairwise distances with an LCA table may be simpler |
| The query needs the actual vertices of every path | The virtual tree stores compressed paths; expand them explicitly |
| The marks are grouped by color or another key | Build one virtual tree per group, then combine the answers |

The first two rows are the ones that decide the shape of a contest solution. The virtual tree is not an end in itself; it is a way to make a later dynamic program, greedy, or counting argument affordable.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes the `program` variant in all six languages.

The `program` variant reads `n m`, then `m` lines `u v w` describing a 0-based undirected weighted tree, then `q`, then `q` lines. Each query line begins with the number of marks `k` and continues with `k` vertex indices. The root is the vertex $0$.

The output is one line per query, holding the total weight of the edges of the virtual tree of the marked vertices. A query with fewer than two distinct marks prints `0`. A mark outside $0 \dots n-1$, or outside the root's component, is ignored; duplicates count once. The answer is accumulated as a signed 64-bit integer in C, C++, Java and Pascal, as an unbounded integer in Python, and as a safe integer in JavaScript.

The C, C++, Java and Python listings are written for a USACO-style judge. The JavaScript and Pascal listings are educational references and are marked as such at the top of the file.

## Recursion decision

The traversal that fills the parent, the depth, the root distance, and the preorder interval is iterative. A tree with $n$ vertices can be a chain of depth $n-1$, so a recursive traversal needs $n$ frames.

The virtual tree construction is a stack loop, not a recursive traversal. The stack holds the rightmost virtual path, and it is bounded by the number of virtual vertices. A dynamic program over the virtual tree, if the problem needs one, can use an explicit postorder list rather than recursion.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a chain of $n$ vertices needs $n$ frames |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is not a wrong answer. It is a crash: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

## Implementation walkthrough

The first decision is the layout of the ancestor table. The reference implementation stores it in one flat array at the index `k * n + v`, so a single allocation holds every row and the row stride is the number of vertices. Java can use a two-dimensional array with the same indexing, and Python can use an `array('i')` to keep the entries at four bytes each.

The second decision is the ancestor test. The preorder interval is stored with an exclusive upper bound: `tout[v]` is one past the last preorder position in the subtree of `v`. The test is

```cpp
tin[u] <= tin[v] && tin[v] < tout[u]
```

An inclusive upper bound is the usual source of an off-by-one error when a vertex is its own ancestor.

The third decision is to keep the edge depth and the weighted root distance separate. The lowest common ancestor is found by lifting by the number of edges, so it uses `depth`. The virtual edge weight is a sum of edge weights, so it uses `distance`. Mixing the two produces a table that lifts by the wrong amount and a total that is too small or too large.

The fourth decision is deduplication. A query may repeat a mark, and a query may be large. Clearing a mark array of size $n$ for every query would cost $O(nq)$ and defeat the purpose. The reference implementation uses a stamp array:

```cpp
if (stamp[v] != query_id) {
    stamp[v] = query_id;
    marks.push_back(v);
}
```

Only the vertices that are actually marked are touched. The stamp array is allocated once and never cleared.

The fifth decision is the closure. Sort the marks by preorder, then append the lowest common ancestor of each adjacent pair. Sort the resulting list again and remove duplicates. The second sort is necessary because the added ancestors can appear anywhere in the preorder order, not only at the end.

```cpp
std::vector<int> nodes = marks;
for (std::size_t i = 0; i + 1 < marks.size(); ++i) {
    nodes.push_back(tree.lca(marks[i], marks[i + 1]));
}
std::sort(nodes.begin(), nodes.end(), by_preorder);
nodes.erase(std::unique(nodes.begin(), nodes.end()), nodes.end());
```

The sixth decision is the stack pass. The stack is not a depth-first search stack of the original tree; it is the rightmost path of the virtual tree.

```cpp
long long total = 0;
std::vector<int> stack;
for (int v : nodes) {
    while (!stack.empty() && !tree.is_ancestor(stack.back(), v)) {
        stack.pop_back();
    }
    if (!stack.empty()) {
        total += tree.distance[v] - tree.distance[stack.back()];
    }
    stack.push_back(v);
}
```

The answer is the accumulated total. There is no need to store the virtual adjacency list unless a later dynamic program needs it.

The seventh decision is the total width. The sum of many edge weights can exceed $2^{31}-1$ even when every individual weight fits in a 32-bit integer. Use `long long`, `long`, `Int64` or a Python integer. In JavaScript, keep the contract's total below $2^{53}$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sorting the marks by vertex index | The stack receives vertices out of preorder | Sort by `tin` |
| Sorting the closure by vertex index after adding ancestors | A descendant can appear before its ancestor and the stack pops the wrong branches | Sort the closure by `tin` as well |
| Omitting the lowest common ancestors | Two marks in different branches never meet, and the total misses the shared path | Add the LCA of every adjacent pair |
| Forgetting to deduplicate the closure | The same vertex is processed twice, so the stack can hold duplicates and the size bound is lost | Sort and call `unique`, or use a stamp |
| Using the edge depth as the edge weight | Weighted trees produce the wrong total | Keep `depth` and the weighted root distance separate |
| Using a 32-bit accumulator | A star with large weights overflows and prints a negative number | Use a signed 64-bit accumulator |
| Clearing a size-$n$ mark array for every query | The run becomes $O(nq)$ again | Use a query stamp |
| Building a full virtual adjacency list and clearing it per query | The clearing cost is $O(n)$ even when the virtual tree is tiny | Keep only the sorted closure and the stack |
| Recursing on the original tree | A chain of $n$ vertices overflows the call stack | Use an iterative traversal |
| Treating every virtual vertex as marked | Branch points are skipped in the later DP or count | Keep a separate mark flag |
| Assuming a virtual edge has weight one | Distances and totals are wrong | Weight it by the original path length |
| Forgetting that a vertex is its own ancestor | The equality case is mishandled | Use `tin[u] <= tin[v] < tout[u]` |

### Why this fails: two marks that never meet

The mistake that survives review most often is omitting the lowest common ancestors. Take the tree $0\!-\!1$, $0\!-\!2$, $1\!-\!3$, $2\!-\!4$, with unit weights, and mark $3$ and $4$. The marks in preorder are $3,4$. Without the closure, the stack pushes $3$, then sees that $4$ is not a descendant of $3$, pops $3$, finds an empty stack, and pushes $4$. The total is $0$. The correct total is $4$, along the path $3\!-\!1\!-\!0\!-\!2\!-\!4$.

Five vertices is the smallest tree on which this fails. The two marks must sit under different children of an unmarked lowest common ancestor, so the ancestor needs two children and each child needs a marked descendant: five vertices.

The second version is subtler. Take the tree $0\!-\!5$, $5\!-\!1$, $5\!-\!2$, with unit weights, and mark $1$ and $2$. The closure is $\{1,2,5\}$. If the closure is sorted by vertex index, the order is $1,2,5$. The stack pushes $1$, pops it when $2$ arrives, then pops $2$ when $5$ arrives and finds an empty stack. The total is $0$. The correct total is $2$, through the edges $5\!-\!1$ and $5\!-\!2$. Sorting by preorder gives $5,1,2$ and produces the right answer.

The generalization covers both versions: **the closure must contain every branch point, and it must be processed in preorder.** The marks alone are not enough, and the closure in the wrong order is just as bad.

A third failure is arithmetic rather than structural. A star with five edges of weight $10^9$ has a virtual tree of total weight $5 \cdot 10^9$. A signed 32-bit accumulator wraps around and prints a negative number. The individual edge weights fit in 32 bits; the total does not.

## Variants and extensions

- **Total weight without the virtual tree.** Sort the marks by preorder and add the distance between each consecutive pair, including the last and the first, then divide by two. The cyclic tour crosses every edge of the minimal subtree exactly twice.
- **Dynamic programming on the virtual tree.** Once the tree is built, a postorder pass can compute subtree counts, minimum cuts, knapsack values, or rerooting answers in time linear in the number of virtual vertices.
- **Counting pairs by edge contributions.** For a virtual edge of weight $w$ that separates $s$ marks from $k-s$ marks, the edge lies on $s \ast (k-s)$ pairs. Summing $w \ast s \ast (k-s)$ over the virtual edges answers a sum-of-distances query.
- **One virtual tree per color or group.** If the query is really a collection of independent groups, build a virtual tree per group. The total size is bounded by the total number of marked vertices, so the preprocessing is shared.
- **Virtual trees on a forest.** Add a super-root connected to every component root with a zero-weight edge, or build one virtual tree per component and combine the totals.
- **Constant-time lowest common ancestor.** Replace binary lifting with an Euler tour and a sparse table, or with a Schieber-Vishkin structure. The virtual tree construction then costs $O(k \log k)$ plus $O(1)$ per ancestor query.
- **Path aggregates.** Store a prefix sum along the root path for every vertex. A virtual edge weight can then be a sum, a minimum, a maximum, or any associative aggregate of the path.
- **Virtual trees over a trie or a suffix tree.** Those structures are rooted trees too, so the same construction compresses a set of strings or suffixes to their branching points.
- **Dynamic marked sets.** If the marks change between queries, the virtual tree must be rebuilt; the preprocessing of the original tree can be reused, but there is no general incremental virtual tree without a dynamic tree structure.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Read the constraints first. If the sum of the query sizes is bounded and the tree is large, write the virtual tree.
2. Root the tree at the vertex the statement names. If no root is named, choose $0$ and write it into a variable.
3. Preprocess once with an iterative traversal: parent, depth, weighted root distance, `tin`, `tout`.
4. Build the ancestor table with $\lfloor \log_2 n \rfloor + 1$ rows. Set the root to be its own ancestor.
5. For each query, deduplicate the marks with a stamp, sort by `tin`, add the LCA of adjacent marks, sort the closure by `tin`, and deduplicate again.
6. Run the stack pass and accumulate the answer in a 64-bit integer.
7. Test the edge cases explicitly: no marks, one mark, two marks in different branches, two marks where one is an ancestor of the other, duplicate marks, a chain, a star, and a tree with large weights.
8. Write the pruning baseline for small trees and compare on random cases. A disagreement is a counterexample worth more than an hour of reading.

If the problem needs a dynamic program on the virtual tree, write the DP as a second pass over the same sorted closure. Do not rebuild the virtual adjacency list with a size-$n$ array and clear it for every query.

## Worked problems

### Problem 1: isolating the important cities

**Restatement.** A tree of $n$ cities is given. Each of $q$ plans names $k_i$ important cities. The barbarians may capture non-important cities, and a captured city becomes impassable. For each plan, find the minimum number of cities to capture so that no two important cities remain connected, or report $-1$ if it is impossible. Constraints: $n \le 100\,000$, $q \le 100\,000$, and the sum of all $k_i$ is at most $100\,000$.

**Naive baseline.** Run a tree dynamic program over all $n$ cities for every plan, at a cost of $O(n)$ per plan and $O(nq)$ in total.

**Insight.** Only the important cities and their lowest common ancestors can affect the answer. The total number of important cities is $100\,000$, so all virtual trees together have linear size.

**Derivation.** Build the virtual tree of the important cities. If two important cities are joined by a direct road in the original tree, the answer is $-1$, because neither endpoint may be captured. Otherwise, run a postorder dynamic program on the virtual tree. A non-important virtual vertex that has two children still carrying an important city is captured once and disconnects both branches. A non-important vertex with one such child passes the connection upward. An important vertex keeps its own connection upward unless it can be isolated by capturing a non-important vertex on the path to the child.

**Correctness.** Each captured virtual vertex separates all important cities below it from the rest of the tree, and the dynamic program considers every such choice. The adjacency test is exactly the case in which no non-important vertex lies on the path between two important cities, so no capture can separate them.

**Complexity.** $O((n + \sum k_i) \log n)$ time and $O(n \log n + \max k_i)$ space.

**Common wrong approach.** Running the dynamic program on the original tree and hoping the important set is small. The dynamic program still visits every unmarked vertex.

### Problem 2: counting subtrees with one leaf color

**Restatement.** A tree of $N$ vertices is given, and vertex $i$ has color $A_i$. Count the nonempty subsets $S$ of vertices such that the induced subgraph on $S$ is a tree and every vertex of degree $1$ in that induced tree has the same color, modulo $998244353$. Constraints: $N \le 200\,000$.

**Naive baseline.** For each color $c$, run a dynamic program over the whole tree to count the subsets whose leaves have color $c$. There are up to $N$ colors, so the cost is $O(N^2)$.

**Insight.** For a fixed color $c$, only the vertices of color $c$ and their lowest common ancestors can be branching points of a valid subset. The virtual tree of the color class has size proportional to the class.

**Derivation.** Build one virtual tree per color. On that tree, a postorder dynamic program counts connected induced subtrees whose leaves are all color $c$. The state at a virtual vertex records whether the selected part below it is connected to the vertex and whether the vertex already has a selected child. A vertex of color $c$ may close a branch as a leaf or continue it as an internal vertex. For a fixed $c$, a one-vertex subset is counted only when its vertex has color $c$. Every non-color vertex in a larger selected subtree cannot be a leaf, so it needs either two selected children or one selected child and a connection to its parent.

**Correctness.** Every valid subset has a unique highest vertex in the virtual tree, and its selected part is a connected subtree below that vertex. The dynamic program counts each such part once, and the leaf condition is enforced exactly at the vertices with no selected child.

**Complexity.** The virtual trees together have $O(N)$ vertices, and the dynamic program is linear in them, so the total is $O(N \log N)$.

**Common wrong approach.** Counting only the vertices of color $c$ and forgetting the lowest common ancestors. A valid subset can branch at an uncolored vertex, and the branch point is not in the color class.

### Problem 3: sum of distances within each color

**Restatement.** A tree of $N$ vertices and a color $A_i$ for every vertex are given. Define $f(i,j)$ as the distance between $i$ and $j$ when $A_i = A_j$, and as $0$ otherwise. Compute the sum of $f(i,j)$ over all $i < j$. Constraints: $N \le 200\,000$.

**Naive baseline.** Compute the distance for every pair with a lowest common ancestor table, at a cost of $O(N^2 \log N)$.

**Insight.** Each color class can be handled independently. The marked vertices of one color and their lowest common ancestors form a virtual tree, and a virtual edge contributes to every pair that crosses it.

**Derivation.** For one color with $k$ vertices, build the virtual tree with edge weights equal to the original distances. For each virtual edge of weight $w$ from a parent to a child, let $s$ be the number of color vertices in the child's virtual subtree. The edge separates the class into $s$ and $k-s$ vertices, so it lies on exactly $s \ast (k-s)$ pairs. Add $w \ast s \ast (k-s)$. A postorder pass over the virtual tree supplies every $s$.

**Correctness.** A pair's path crosses a virtual edge exactly when its two endpoints lie on different sides of that edge. Summing the contributions over all virtual edges therefore counts every pair's distance exactly once.

**Complexity.** $O(N \log N)$ time and $O(N \log N)$ space, with a 64-bit accumulator.

**Common wrong approach.** Giving every virtual edge weight one. The internal vertices of a virtual edge are suppressed, so the edge represents a path whose length is the difference of the root distances.

## Practice progression

1. **Recognition.** Given a statement, decide whether the marked set is small enough for a virtual tree. Look for a bound on the sum of the set sizes.
2. **Direct application.** Build the virtual tree and print its total edge weight. Verify against the pruning baseline on random small trees.
3. **Adaptation.** Handle weighted edges and queries with duplicate, missing, or invalid marks. Add the empty-set and single-mark cases.
4. **Combination.** Run a dynamic program, a greedy decision, or an edge-contribution count on the virtual tree.
5. **Challenge.** Build one virtual tree per color or per group, and prove that the total size over all groups is linear.
6. **Transfer.** Use the same compression on a trie, a suffix tree, or a forest, and notice that the construction depends only on the preorder and the lowest common ancestor.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the vertex set of a virtual tree, and why is it closed under lowest common ancestors? (Formal model)
2. Why do the lowest common ancestors of adjacent marks in preorder suffice? (Key insight)
3. What is the size bound, and where does the bound come from? (Formal model)
4. Why must the closure be sorted by preorder before the stack pass? (Algorithm derivation)
5. What does the stack hold, and what does a pop mean? (Implementation walkthrough)
6. How is the weight of a virtual edge computed, and why is it a subtraction? (Algorithm derivation)
7. Why are the edge depth and the weighted root distance kept in separate arrays? (Implementation walkthrough)
8. What is the cost of one query, and which term dominates? (Complexity analysis)
9. When is the cyclic distance sum enough, and what does it not produce? (Algorithm selection)
10. What is the smallest tree on which omitting the lowest common ancestors gives a wrong answer? (Why this fails)

## Further reading

- The technique that answers the lowest common ancestor queries the virtual tree depends on is [lowest common ancestor](/algorithms/trees/lca).
- The tree dynamic programming that runs on the compressed structure is [tree dynamic programming](/algorithms/trees/tree-dp).
- The chain decomposition that answers path queries is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The traversal that produces the preorder intervals is [depth-first search](/algorithms/graphs/dfs), and its level-by-level form is [breadth-first search](/algorithms/graphs/bfs).
- The decomposition that turns a tree into an array and supports constant-time ancestor queries is [Euler tour](/algorithms/trees/euler-tour).
- The [USACO Guide virtual tree module](https://usaco.guide/plat/VT) develops the same construction with a worked example, and the [Codeforces article on virtual trees](https://codeforces.com/blog/entry/140066) proves the size bound in detail.
- Every listing in this article is published in the reference implementations of this repository in all six languages.
