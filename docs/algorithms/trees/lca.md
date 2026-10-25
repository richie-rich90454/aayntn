---
id: trees.lca
title: Lowest common ancestor
summary: A table of the ancestors of every vertex answers the lowest common ancestor of two vertices in logarithmic time.
division: [gold, platinum]
subjects: [trees]
level: intermediate
importance: common-contest-technique
keywords: [lowest common ancestor, lca, binary lifting, ancestor table, tree queries, depth]
prerequisites:
    required: [graphs.bfs, foundations.complexity]
    recommended: [graphs.dfs, trees.heavy-light-decomposition]
complexity:
    time: "O((n + m) log n) to build, O(log n) per query"
    space: "O(n log n)"
assumptions:
    - The input is a tree, so there is exactly one path between any two vertices.
implementations: trees.lca
visualization: trees.lca
reviewed: false
---

<script setup lang="ts">
import AlgorithmPlayer from "../../.vitepress/theme/laboratories/core/AlgorithmPlayer.vue";
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/trees.lca.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

The lowest common ancestor of two vertices is the deepest vertex that is an ancestor of both. The technique for answering queries about it is binary lifting: a table that stores, for every vertex and every $k$, the ancestor of that vertex which lies $2^k$ edges above it.

The table is built in $O(n \log n)$ from a single traversal of the tree, and every query is answered in $O(\log n)$ by two phases. The first phase lifts the deeper vertex until the two stand at the same depth. The second phase descends from the largest jump, moving both vertices up whenever the jump keeps them apart, and stops with the two vertices directly beneath their common ancestor.

The reason the second phase works is that the vertices stay equally deep throughout it, and a jump of size $2^k$ is safe exactly when the distance to the common ancestor is greater than $2^k$. Greedily taking the largest safe jump leaves the two vertices exactly one step below the answer.

## Problem motivation

A network of $n$ computers is connected in a tree. When a message is lost, the operator has to find the nearest computer above both endpoints that could have seen it, so that the log can be examined there.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ computers.
- $1 \le q \le 200\,000$ queries, each naming two computers.
- The graph is a tree, so there is exactly one path between any two computers.

Answering a query by walking up from both endpoints to the root is $O(n)$ per query, which is $O(nq) = 4 \cdot 10^{10}$ steps in the worst case. The case that hurts is a long chain: there the two walks meet at the root after thousands of steps each, and no amount of caching helps because every query is different.

The problem is that the walks move one edge at a time. If the structure could move a vertex up by $2^k$ edges in a single step, and could choose the step size greedily, each walk would take $O(\log n)$ steps instead of $O(n)$.

## Recognition patterns

Binary lifting for the lowest common ancestor is the right tool when all of the following hold.

- The structure is a **tree**, or a forest, so that every vertex has a unique path to the root.
- Many **queries** each name a **pair of vertices**.
- The questions are about **ancestry**, depth, or distances, rather than about paths that must be listed.
- The tree does **not change**. A node added later invalidates the whole table.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $q = 1$ | Walking up from both vertices once is enough |
| The tree changes between queries | The table must be rebuilt; use a dynamic structure or a different algorithm |
| The questions ask for the path itself | The table answers ancestry, not paths; use a different technique |
| The structure is a general graph | There is no single ancestor chain |
| $n \ge 10^6$ | The table costs $n \log n$ entries, so about 160 MB at 32 bits each; check the limit |
| The queries are known in advance | An offline sweep with a disjoint set union answers them in $O((n + q) \alpha(n))$ |

The phrase in a statement that signals this technique is "the lowest common ancestor of $u$ and $v$", together with "the distance between $u$ and $v$", which is $\operatorname{depth}(u) + \operatorname{depth}(v) - 2\operatorname{depth}(\operatorname{lca}(u, v))$.

<Synonyms terms="LCA, lowest common ancestor, common ancestor" />

## Naive approach

The baseline is to walk up from both vertices, one edge at a time, until the two walks meet.

```python
def lca_naive(u, v):
    while depth[u] > depth[v]:
        u = parent[u]
    while depth[v] > depth[u]:
        v = parent[v]
    while u != v:
        u = parent[u]
        v = parent[v]
    return u
```

This is $O(n)$ per query, and it is correct. It is also the reference implementation for the differential test.

The second baseline is to compute the answer once for every pair of vertices, which costs $O(n^2)$ time and $O(n^2)$ memory. At $n = 200\,000$ that is $4 \cdot 10^{10}$ entries, so the approach is dead on arrival for any constraint of that size.

The third baseline is an offline approach that is worth knowing. If all the queries are known in advance, sort them by their right endpoint, sweep the tree in depth-first order, and merge the vertex with its parent as soon as the vertex leaves the current subtree. A disjoint set union answers each query in amortized constant time. The total cost is $O((n + q) \alpha(n))$, which is better than the $O(q \log n)$ of binary lifting, but it needs the queries in advance and it is much harder to write.

## Key insight

The insight is that a walk of $d$ steps can be replaced by a walk of $O(\log d)$ steps, provided the structure can jump by any power of two.

Define the table

$$
\text{up}[k][v] \;=\; \text{the ancestor of } v \text{ that lies } 2^k
\text{ edges above it}.
$$

The table has three properties that make everything else follow.

**It is defined everywhere.** The root is declared to be its own ancestor, so $\text{up}[k][\text{root}] = \text{root}$ for every $k$, and no entry ever refers to a vertex that does not exist.

**It is built from itself.** The $2^k$-th ancestor of $v$ is the $2^{k-1}$-th ancestor of the $2^{k-1}$-th ancestor of $v$:

$$
\text{up}[k][v] \;=\; \text{up}[k-1]\bigl[\text{up}[k-1][v]\bigr].
$$

**Any distance can be walked.** A distance $d$ has a binary representation, so $d$ is a sum of distinct powers of two, and the walk can take one jump for each set bit of $d$. That is at most $\lfloor \log_2 n \rfloor + 1$ jumps.

The first phase of the query follows from the third property. The two vertices may stand at different depths, and the deeper one is lifted by exactly the difference, which is a sum of powers of two.

The second phase needs one more fact, and it is the heart of the article. Let $w$ be the lowest common ancestor of the two vertices. If they stand at the same depth $d$ above $w$, then the $2^k$-th ancestors of the two are _different_ exactly when $d \ge 2^k + 1$. If $d \le 2^k$, both $2^k$-th ancestors lie at or above $w$, and since they lie at the same depth they are the same vertex.

So a jump of size $2^k$ is safe precisely when it keeps both vertices strictly below $w$. Taking the largest safe jump greedily, from the largest $k$ down to the smallest, walks the two vertices down to the two children of $w$ and no further.

## Visual intuition

Draw the tree with the root at the top and the depth of each vertex written beside it. The lowest common ancestor of two vertices is the point where their two downward paths first meet.

The first phase of the query is visible as a shortening of the deeper path. The second phase is visible as a simultaneous climb of the two paths, and the interesting observation is that the two paths always stay the same distance apart during it, because both move by the same number of edges at every step.

Draw the ancestor table beside the tree as a grid, one row per power of two and one column per vertex. Reading a row from left to right, the entries are the ancestors at that distance. The query walks down the grid rather than up the tree, and every jump is a cell lookup.

The laboratory below draws the tree and the table together, and highlights the entry that each jump reads.

<AlgorithmPlayer algorithm="trees.lca" />

## Formal model

Let $T$ be a tree with vertex set $V$ and a chosen root $r$.

::: math definition Definition
The **parent** of a vertex $v \ne r$ is its unique neighbor on the path from $v$ to $r$. The **depth** of a vertex is the number of edges on the path from the root to it, so $\operatorname{depth}(r) = 0$. A vertex $u$ is an **ancestor** of $v$ if $u$ lies on the path from $v$ to $r$, and $u$ is a **strict ancestor** if $u \ne v$.
:::

::: math definition Definition
The **lowest common ancestor** of $u$ and $v$ is the deepest vertex that is an ancestor of both. It is unique, because the ancestors of $u$ and the ancestors of $v$ are both chains ending at the root, and two chains in a tree that share two vertices share the whole path between them.
:::

::: math definition Definition
The **binary lifting table** is $\text{up}[k][v]$ is the ancestor of $v$ that lies $2^k$ edges above it, with the root declared to be its own ancestor. The table has $\lfloor \log_2 n \rfloor + 1$ rows, because a tree of depth $n - 1$ needs only that many powers of two to express every distance.
:::

::: math lemma Lemma
Let $u$ and $v$ be distinct vertices at the same depth $d$ above their lowest common ancestor $w$. Then $\text{up}[k][u] \ne \text{up}[k][v]$ if and only if $d \ge 2^k + 1$.
:::

::: math lemma Lemma
Let $u$ and $v$ be at the same depth $d$ above their lowest common ancestor $w$, and let the greedy descent take jumps of sizes $2^{k_1} > 2^{k_2} > \cdots > 2^{k_t}$. Then $d - \sum_{i=1}^{t} 2^{k_i} = 1$, so the two vertices end up as the two children of $w$.
:::

::: math lemma Lemma
The distance between two vertices $u$ and $v$ is $\operatorname{depth}(u) + \operatorname{depth}(v) - 2\operatorname{depth}(\operatorname{lca}(u, v))$.
:::

## Algorithm derivation

The state is the table $\text{up}$ and the depth array.

The build rule has two stages. A breadth-first walk from the root fills the depth of every vertex and the parent of every vertex, and it sets $\text{up}[0][v]$ to the parent. The rest of the table is then filled row by row with $\text{up}[k][v] = \text{up}[k-1][\text{up}[k-1][v]]$.

The query rule has two phases.

1. If $\operatorname{depth}(u) < \operatorname{depth}(v)$, exchange $u$ and $v$. Let $d = \operatorname{depth}(u) - \operatorname{depth}(v)$. For every $k$ whose bit is set in $d$, set $u \gets \text{up}[k][u]$. Now both vertices stand at the same depth. If they are equal, that vertex is the answer.
2. Otherwise, for $k$ from the largest row down to $0$: if $\text{up}[k][u] \ne \text{up}[k][v]$, set $u \gets \text{up}[k][u]$ and $v \gets \text{up}[k][v]$. The answer is $\text{up}[0][u]$.

The update in phase two is correct by the lemma: the jump is taken exactly when it keeps both vertices strictly below the lowest common ancestor, so the ancestor is unchanged and the two vertices stay distinct.

::: math invariant Invariant
During phase two, the two vertices stand at the same depth, they are distinct, and their lowest common ancestor is the same vertex $w$ as at the start of the phase. The distance from either vertex to $w$ is a positive integer that decreases by $2^k$ whenever a jump of size $2^k$ is taken.
:::

## Step-by-step execution

Take the tree with edges $0-1$, $0-2$, $1-3$, $1-4$, rooted at $0$. The depths are $0, 1, 1, 2, 2$ for the vertices $0, 1, 2, 3, 4$, and the parent of a vertex is its neighbor toward the root.

The table has three rows, because $\lfloor \log_2 5 \rfloor + 1 = 3$:

| Vertex $v$ | $\text{up}[0][v]$ | $\text{up}[1][v]$ | $\text{up}[2][v]$ |
| ---------- | ----------------- | ----------------- | ----------------- |
| 0          | 0                 | 0                 | 0                 |
| 1          | 0                 | 0                 | 0                 |
| 2          | 0                 | 0                 | 0                 |
| 3          | 1                 | 0                 | 0                 |
| 4          | 1                 | 0                 | 0                 |

Now query the pair $(3, 4)$.

1. The depths are equal, so no lifting is needed and $u = 3$, $v = 4$.
2. They are not equal, so phase two begins.
3. $k = 2$: $\text{up}[2][3] = 0$ and $\text{up}[2][4] = 0$. They are equal, so no jump is taken. The two vertices are still $3$ and $4$.
4. $k = 1$: $\text{up}[1][3] = 0$ and $\text{up}[1][4] = 0$. Equal again, so no jump.
5. $k = 0$: $\text{up}[0][3] = 1$ and $\text{up}[0][4] = 1$. Equal, so no jump.
6. The answer is $\text{up}[0][3] = 1$.

Now query the pair $(2, 3)$.

1. The depths are $1$ and $2$, so the vertices are exchanged and $u = 3$, $v = 2$.
2. The difference is $1$, whose only set bit is $0$, so $u \gets \text{up}[0][3] = 1$.
3. Now $u = 1$ and $v = 2$, both at depth $1$. They are different, so phase two begins.
4. $k = 2$ and $k = 1$: both vertices reach $0$, so the ancestors are equal and no jump is taken.
5. $k = 0$: $\text{up}[0][1] = 0$ and $\text{up}[0][2] = 0$. Equal, so no jump.
6. The answer is $\text{up}[0][1] = 0$.

Notice in the first query that every level was rejected. That is the common case for siblings, and it is why the descent must run from the largest level down: a small jump taken first would have to be undone afterwards, and there is no way to undo it.

## Correctness proof

::: math theorem Theorem
The binary lifting query returns the lowest common ancestor of the two queried vertices.
:::

::: math proof Proof
First, the table is correct. The claim is by induction on $k$. For $k = 0$ the entry is the parent, which is the ancestor one edge above. Suppose the row $k - 1$ is correct. The $2^k$-th ancestor of $v$ is the ancestor of $v$ that lies $2^{k-1}$ edges above the $2^{k-1}$-th ancestor of $v$, which is exactly the entry the recurrence stores. Every entry is therefore correct, and the root being its own ancestor keeps the table defined everywhere.

Now the query. Let $w$ be the lowest common ancestor of the original pair.

The lifting phase moves the deeper vertex up by exactly the difference in depth, so it lands at the depth of the other vertex. Lifting never changes the lowest common ancestor, because the two vertices are moved to positions on their own paths toward the root, and the paths still meet at $w$. If the two vertices become equal, the common vertex is at the depth of $w$ and on both paths, so it is $w$.

Otherwise the two vertices are distinct and equally deep, at distance $d \ge 1$ above $w$. Consider phase two. By the lemma, the jump of size $2^k$ is taken exactly when $2^k \le d - 1$, where $d$ is the current distance. Processing the levels in decreasing order, the taken jumps are exactly the set bits of the binary representation of $d - 1$: the largest power of two that fits in $d - 1$ is taken first, the remaining amount is $d - 1$ minus that power, and the argument repeats on the remaining levels. The total lift is therefore $d - 1$, and the final distance is $d - (d - 1) = 1$.

So the two vertices finish at distance one above $w$, which means they are the two children of $w$, and the answer $\text{up}[0][u]$ is $w$. $\square$
:::

::: math proof Proof
The table has $\lfloor \log_2 n \rfloor + 1$ rows because the largest distance between two vertices of a tree with $n$ vertices is $n - 1$, and the largest power of two that can appear in the binary representation of a distance of at most $n - 1$ is at most $n - 1$ itself.
:::

## Complexity analysis

**The traversal: $O(n + m)$** time, which for a tree is $O(n)$ because $m = n - 1$.

**Building the table: $O(n \log n)$** time, since there are $O(\log n)$ rows and $n$ entries per row.

**Each query: $O(\log n)$** time. The lifting phase takes at most one jump per set bit of the depth difference, and the descent takes one step per row.

**Space: $O(n \log n)$** for the table, plus $O(n)$ for the depth array and the traversal queue.

::: math complexity Complexity
Binary lifting over a tree of $n$ vertices and $m$ edges: $O((n + m) \log n)$ time to build, $O(\log n)$ per query, and $O(n \log n)$ extra space.
:::

The width of the entries matters. The table stores vertex indices, so $4n \log_2 n$ bytes are needed at $n = 200\,000$, which is about $14$ MB. Storing a whole table of distances instead of ancestor indices would cost $O(n^2)$ and is not an option.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Many ancestor queries on a static tree | Binary lifting |
| Many ancestor queries known in advance | A disjoint set union sweep, offline |
| The tree changes between queries | A dynamic tree structure, or rebuild |
| One ancestor query | Walk up from both vertices |
| Distance between two vertices | Binary lifting, or an Euler tour with a sparse table |
| The sum of the values on a path | Heavy-light decomposition |
| A tree of maximum degree two, that is, a chain | The depth alone answers everything |

The last row is worth a note, because it is the case in which the simplest approach is also the fastest. On a chain the ancestors of a vertex are all the vertices before it, so the lowest common ancestor of two vertices is the shallower one, and no table is needed.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source.

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes two variants. The `minimal` variant is a reusable class whose constructor takes an adjacency list and a root, builds the table, and exposes the ancestor at a given power of two, the depth of a vertex, and the lowest common ancestor of a pair. The `program` variant reads `n m`, then the edges, then the queries, and prints one answer per query. The root is the vertex $0$, and a query that names a vertex outside the array is answered with $-1$.

## Recursion decision

The table is built with a loop over the rows and a loop over the vertices, and the query is a loop over the rows. Neither recurses.

The traversal that finds the parents and the depths is the one place where the choice matters, and the reference implementation makes it with an explicit queue rather than with recursion. The reason is that the depth of the tree can be $n - 1$, so a recursive traversal needs $n$ frames.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a chain of $n$ vertices needs $n$ frames |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is not a wrong answer. It is a crash: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

## Implementation walkthrough

The first decision is the layout of the table. The reference implementation stores it in a single flat array at the index `k * n + v`, so that one allocation holds every row and the row stride is the number of vertices. A two-dimensional array of vectors has the same content and one extra indirection per access, which matters because the query reads the table $O(\log n)$ times.

The second decision is the order of the two phases. Lifting comes first, because the descent requires the two vertices to be at the same depth, and the descent is only valid when they are.

The third decision is the direction of the descent loop:

```cpp
for (int k = levels_ - 1; k >= 0; k--) {
    const int ancestor_u = up_[row + static_cast<size_t>(u)];
    const int ancestor_v = up_[row + static_cast<size_t>(v)];
    if (ancestor_u != ancestor_v) {
        u = ancestor_u;
        v = ancestor_v;
    }
}
return up_[static_cast<size_t>(u)];
```

The loop runs from the largest level down, and the answer is taken from row $0$ after the loop. Both details are load-bearing. Running the loop upwards would take a small jump first, which cannot be undone, and taking the answer from the wrong row would return the ancestor of the ancestor.

The fourth decision is the equality test after the lifting phase:

```cpp
if (u == v) {
    return u;
}
```

It is the difference between the answer and one step too low, and the "why this fails" passage below works through what happens without it.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Returning the parent after the lifting phase | The answer is one step too low whenever the two branches diverge higher up | Run the descent phase |
| Omitting the equality test after the lifting phase | A vertex paired with itself returns its parent | Test `u == v` before the descent |
| Running the descent loop from the smallest level | A jump that is taken first cannot be undone | Run it from the largest level down |
| Lifting the shallower vertex | The vertices end up at different depths | Lift the deeper one |
| Forgetting that the root is its own ancestor | Entries above the root are undefined | Initialize the whole table to the root |
| Building the table before the depths | The rows are filled from garbage | Build the depths first, then the rows |
| Using the vertex's own label as its parent | The table describes a different tree | Set the parent during the traversal |
| Allocating $n$ rows of the table | The largest row index is out of bounds | Use $\lfloor \log_2 n \rfloor + 1$ rows |
| Forgetting that the input may be a forest | Vertices in another component have no answer | Run the traversal from every root, or report $-1$ |

### Why this fails: the answer that is one step too low

The mistake that survives review most often is a query that stops one step early. There are two versions of it, and both produce an answer that is an ancestor of the correct one.

**The version that skips the descent.** Suppose the query lifts the deeper vertex to the depth of the other and then returns the parent of the deeper one, without running the descent. Take the tree with edges $0-1$, $0-2$, $1-3$, $2-4$, rooted at $0$, and query the pair $(3, 4)$.

The depths of $3$ and $4$ are both $2$, so no lifting happens. The parent of $3$ is $1$, and the algorithm answers $1$. The true lowest common ancestor is $0$, because the paths $3 \to 1 \to 0$ and $4 \to 2 \to 0$ meet at the root.

Five vertices is the smallest tree on which this fails. The bug needs the two vertices to stand at the same depth and to sit under _different_ children of the root, so the root has at least two children, each of which has at least one child: five vertices.

**The version that skips the equality test.** This one is smaller. Take a tree with two vertices, $0-1$, rooted at $0$, and query the pair $(1, 1)$. The answer is $1$, because a vertex is its own lowest common ancestor. But a query that lifts, finds the two vertices equal, and falls through to the descent without testing equality ends up returning the parent of $1$, which is $0$.

Two vertices is the smallest possible counterexample, and the failure is a wrong answer on a completely legal query: a vertex paired with itself.

The generalization covers both versions: **the descent must run, and it must stop with the two vertices one step below the answer.** The lifting phase only puts the two vertices at the same depth; it says nothing about whether their paths have already met. The descent is what checks.

## Variants and extensions

- **Distance queries.** The distance between two vertices is $\operatorname{depth}(u) + \operatorname{depth}(v) - 2\operatorname{depth}(\operatorname{lca}(u, v))$, so the same table answers them.
- **The path between two vertices.** The path is the union of the two paths to the lowest common ancestor, and the lowest common ancestor is the splitting point of every path query.
- **K-th ancestor.** The lifting phase of the query is the whole answer: decompose the distance into powers of two and jump.
- **The number of vertices in a subtree.** Store the size at every vertex and subtract the size of the child below the lowest common ancestor.
- **Level ancestors in constant time.** With a longer decomposition of the tree, a single lookup answers the ancestor at a given depth.
- **LCA on a general graph.** The idea survives: run a disjoint set union over a depth-first forest and answer the queries offline.
- **LCA with a sparse table over an Euler tour.** The Euler tour lists every vertex on entering it and the lowest common ancestor of two vertices is the vertex with the smallest depth between their two entries in the tour, which a sparse table answers in constant time after an $O(n \log n)$ build.
- **Dynamic trees.** A link-cut tree answers ancestor and path queries on a tree whose edges change, at an amortized logarithmic cost per operation.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Root the tree first, and write the root into a variable. A hard-coded root is a bug waiting for the test case that disagrees with it.
2. Build the depths and the parents with an iterative traversal. The depth of the tree can be $n - 1$, and recursion will not survive that.
3. Write the query as two clearly separated phases, with the equality test between them.
4. Run the descent from the largest level down, and take the answer from row $0$ after the loop.
5. Test the four cases explicitly: a vertex with itself, two children of the root, an ancestor and a descendant, and two vertices in different branches of a deep tree.
6. Write the naive walk as a reference and compare on random pairs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the network operator

**Restatement.** A tree of $n$ computers is given. Each query names two computers, and the answer is their lowest common ancestor. Constraints: $1 \le n \le 200\,000$ and $1 \le q \le 200\,000$.

**Naive baseline.** Walk up from both computers until the walks meet, at a cost of $O(n)$ per query.

**Insight.** A walk of $d$ steps is a sum of powers of two, and the table stores the ancestor at every power of two, so a walk takes $O(\log n)$ jumps.

**Derivation.** Build the table with a breadth-first traversal and the recurrence $\text{up}[k][v] = \text{up}[k-1][\text{up}[k-1][v]]$. Answer each query with the lifting phase followed by the descent phase.

**Correctness.** The proof above shows that the lifting phase preserves the lowest common ancestor and that the descent leaves the two vertices one step below it.

**Complexity.** $O(n \log n)$ to build, $O(\log n)$ per query, and $O(n \log n)$ space.

**Common wrong approach.** Returning the parent of the deeper vertex after the lifting phase, which is one step too low whenever the branches diverge above that parent.

### Problem 2: the distance between two computers

**Restatement.** The same tree, and each query asks for the number of edges on the path between two computers. Constraints: $1 \le n \le 200\,000$ and $1 \le q \le 200\,000$.

**Naive baseline.** Walk up from both computers to their lowest common ancestor, count the steps on each side, and add them. This is $O(n)$ per query.

**Insight.** The two walks meet at the lowest common ancestor, so the distance is the sum of the two distances to it, which is the sum of the depths minus twice the depth of the ancestor.

**Derivation.** Answer the query with the same table, compute $w = \operatorname{lca}(u, v)$, and print $\operatorname{depth}(u) + \operatorname{depth}(v) - 2\operatorname{depth}(w)$.

**Correctness.** The path from $u$ to $v$ goes up from $u$ to $w$ and down to $v$, so its length is $\operatorname{depth}(u) - \operatorname{depth}(w) + \operatorname{depth}(v) - \operatorname{depth}(w)$.

**Complexity.** $O(\log n)$ per query, with the same table.

**Common wrong approach.** Reporting the number of vertices on the path instead of the number of edges, which is off by one on every query.

### Problem 3: the number of vertices in a subtree

**Restatement.** A tree of $n$ vertices is given, and each query asks how many vertices lie in the subtree of a given vertex. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Count the vertices of the subtree by traversal, at a cost of $O(n)$ per query.

**Insight.** The subtree of a vertex is the whole tree minus the part above it, and the part above it is bounded by the lowest common ancestor of the vertex and the root's other children.

**Derivation.** Compute the size of every subtree in one pass, from the leaves upward: $\text{size}[v] = 1 + \sum \text{size}[c]$ over the children $c$ of $v$. A query for the subtree of $v$ is then $\text{size}[v]$, which is $O(1)$. When the question asks for the number of vertices that are _neither_ $v$ nor below it, the answer is $n - \text{size}[v]$.

**Correctness.** Every vertex of the tree is either in the subtree of $v$ or outside it, and the sizes are computed from the leaves upward by induction, so each size counts exactly the vertices below its root.

**Complexity.** $O(n)$ to build, $O(1)$ per query, and $O(n)$ space.

**Common wrong approach.** Using the binary lifting table for this question, which can answer it but with $O(n \log n)$ memory when $O(n)$ would do.

## Practice progression

1. **Recognition.** Given a statement, decide whether binary lifting applies. Look for ancestor queries, distance queries, and a static tree.
2. **Direct application.** Build the table and answer the queries, then verify against the naive walk on random pairs.
3. **Adaptation.** Answer the distance, the $k$-th ancestor, and the subtree size questions, and notice that the last one does not need the table at all.
4. **Combination.** Combine the table with a sparse table over an Euler tour to answer ancestor queries in constant time, and with a disjoint set union to answer them offline.
5. **Challenge.** Solve a problem where the tree changes between queries and discover that the table cannot be maintained incrementally; then solve the offline version, where the queries are known in advance.
6. **Transfer.** Use the technique for something that is not an ancestor query: the lowest common ancestor of two nodes in a dynamic tree, the split point of a path in a path query, or the ancestor of a node in a trie.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does $\text{up}[k][v]$ store, and what recurrence fills the table? (Algorithm derivation)
2. Why must the root be declared to be its own ancestor? (Formal model)
3. When is a jump of size $2^k$ safe during the descent? (Key insight)
4. Why does the descent run from the largest level down? (Implementation walkthrough)
5. What is the smallest tree on which a query that stops after the lifting phase gives a wrong answer? (Why this fails)
6. State the invariant of the descent and say which part of the proof uses it. (Correctness proof)
7. Why is an iterative traversal necessary even though the query itself is logarithmic? (Recursion decision)
8. How many table entries are there, and what does that cost in bytes? (Complexity analysis)
9. Why is the tree's _shape_ irrelevant to the answer, and where is that used? (Formal model)
10. When is an offline disjoint set union sweep the better tool? (Algorithm selection)

## Further reading

- The technique that answers path queries on a tree, by splitting the tree into chains, is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The dynamic programming that uses ancestor relationships to compute subtree answers is [tree dynamic programming](/algorithms/trees/tree-dp).
- The traversal that produces the order the table is built from is [breadth-first search](/algorithms/graphs/bfs), and the recursive form of the same traversal is [depth-first search](/algorithms/graphs/dfs).
- The tree decomposition that turns the tree into an array, which is what makes a sparse table over an Euler tour possible, is described in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
- Every listing in this article, in all six languages, is published in the reference implementations of this repository, in six languages each.
