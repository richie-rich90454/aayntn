---
id: trees.top-tree
title: The top-tree and rake-compress formulation
summary: A top tree stores a forest as a balanced binary tree of clusters with at most two boundary vertices, merges them by rake and compress, and exposes a path so that one cluster answers the query.
division: [platinum]
subjects: [trees]
level: advanced
importance: advanced-technique
keywords:
    [
        top tree,
        rake,
        compress,
        cluster,
        boundary vertex,
        dynamic tree,
        link-cut tree,
        path aggregate,
        subtree aggregate,
        self-adjusting top tree,
    ]
prerequisites:
    required: [trees.lca, foundations.complexity]
    recommended:
        [
            trees.heavy-light-decomposition,
            trees.dynamic-trees,
            range-queries.segment-tree,
            foundations.amortized-analysis,
        ]
complexity:
    time: "O(log n) amortized per operation"
    space: "O(n)"
assumptions:
    - The structure is a forest at every step, so every link joins two different trees.
    - The operations arrive online and are links, cuts, vertex updates, and path or subtree queries.
    - A path query names two vertices that lie in the same tree.
implementations: trees.top-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="trees.top-tree" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="trees.top-tree" />

A top tree is a balanced binary tree that describes a forest. Every node of that binary tree is a **cluster**: a connected piece of the forest with an **interface** of at most two vertices, chosen so that every edge leaving the cluster touches the interface. The leaves of the top tree are single vertices or single edges, and every internal node merges two clusters that share exactly one interface vertex.

There are two ways to merge, and the difference between them is the whole idea.

- A **compress** concatenates two path-shaped clusters at a shared boundary vertex, so the shared vertex becomes internal and the two remaining boundaries become the boundaries of the result.
- A **rake** attaches a subtree-shaped cluster at a boundary vertex that stays a boundary, so the attached subtree hangs off the spine without becoming part of it.

Any sequence of rakes and compresses that ends with the whole component is a valid top tree. A balanced one has logarithmic height, so a link, a cut, or a value change rebuilds only logarithmically many clusters. A path query is answered by **exposing** the two endpoints: a sequence of merges and splits rearranges the top tree until the queried path is the spine of one cluster, and then the cluster's stored aggregate is the answer. A subtree query is answered by exposing the edge from the subtree root to its parent, which leaves the subtree as a cluster with a single boundary vertex.

The cost is $O(\log n)$ amortized per operation and $O(n)$ space. The price is conceptual: the cluster algebra, the boundary bookkeeping, and the rebalancing are all more delicate than the preferred-path machinery of a [link-cut tree](/algorithms/trees/dynamic-trees). The reference programs in this article therefore use a link-cut tree, which is the special case of a top tree in which every internal node is a compress and every rake is represented implicitly by a path-parent pointer. That choice is stated again, with its consequences, in [Reference implementations](#reference-implementations).

## Problem motivation

A network of $n$ servers is connected as a forest, and each server holds a value. Fibers are added and removed during the day, values are updated, and an operator asks for the sum of the values on the path between two servers.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ servers.
- $1 \le q \le 200\,000$ operations.
- Every operation is a link, a cut, a value change, or a path sum.
- The graph is a forest after every operation.

The static tools are gone on the first cut. [Binary lifting](/algorithms/trees/lca) and [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) both preprocess a fixed tree; a link changes the depth of a whole subtree, and a cut invalidates every chain that crossed the removed edge. Rebuilding the decomposition after every structural operation costs $O(n)$ per operation, which is $O(nq) = 4 \cdot 10^{10}$ steps in the worst case.

Answering a single path query by walking the path costs $O(n)$. A chain of $200\,000$ vertices makes every query touch the whole chain, and no cache helps because the next query names different endpoints.

The problem is that the structure has no stable decomposition. The decomposition itself must change with the forest, and it must change in logarithmic time. A top tree is a decomposition with exactly that property: it is a balanced description of the current forest, it can be restructured locally around the vertices a query names, and every restructuring touches only logarithmically many pieces.

## Recognition patterns

A top tree is the right tool when most of the following hold.

- The structure is a **forest** whose edges are inserted and removed online.
- The queries are **path aggregates** or **subtree aggregates**, not merely connectivity.
- Values change at individual vertices, and the aggregate must reflect the change immediately.
- The same structure must answer both kinds of aggregate, or the aggregate is not commutative and its order matters.
- The number of operations is large enough that a linear scan per operation is hopeless.

The constraint values that rule the technique in and out.

| Condition | What it rules |
| --- | --- |
| The tree never changes | Heavy-light decomposition or binary lifting; a top tree is unnecessary |
| Only connectivity is asked | A disjoint set union if edges are only added, or offline dynamic connectivity if they are also removed |
| Only path aggregates, and the tree changes | A link-cut tree is the simpler implementation of the same idea |
| Subtree aggregates, and the tree changes | A top tree, or an Euler tour tree with a balanced sequence |
| The operations are known in advance | Offline dynamic connectivity with a segment tree over time and a rollback structure may avoid dynamic trees entirely |
| Only links are used | A disjoint set union with component aggregates is enough |
| The tree is a chain | A balanced binary search tree or a segment tree over the chain |
| The tree is a star | A Fenwick tree over the leaves, with the center handled separately |
| $n \le 2000$ | Recompute the path or the subtree by a traversal |

The phrase in a statement that signals the technique is "the tree changes" together with "the sum on the path" or "the sum of the subtree". A statement that asks for both, or that changes the root between queries, is almost always a top-tree problem.

<Synonyms terms="top tree, rake-compress tree, RC tree, cluster decomposition, dynamic tree" />

## Naive approach

The baseline is to find the path by a traversal and add the values along it.

```python
def path_sum(adj, value, u, v):
    parent = {u: -1}
    stack = [u]
    while stack:
        x = stack.pop()
        if x == v:
            break
        for y in adj[x]:
            if y != parent[x]:
                parent[y] = x
                stack.append(y)
    total = 0
    x = v
    while x != -1:
        total += value[x]
        x = parent[x]
    return total
```

The traversal visits every vertex of the component in the worst case, so one query is $O(n)$ and all queries are $O(nq)$. The same bound applies to a subtree query, which can be answered by a traversal of the subtree.

The second baseline is to rebuild a static decomposition after every structural change. A link or a cut costs $O(n)$ to rebuild the depths, the ancestor table, or the heavy-light chains, and then a query costs $O(\log n)$ or $O(\log^2 n)$. That is an improvement on the query but not on the update, and an adversary who alternates a cut with a query makes the total $O(nq)$ again.

The third baseline is a matrix of all-pairs path sums. It costs $O(n^2)$ time and $O(n^2)$ memory, which is $4 \cdot 10^{10}$ entries at $n = 200\,000$. It also cannot survive a link or a cut without being recomputed.

The naive traversal is still worth writing. It is short, it is obviously correct, and it is the reference against which a dynamic structure is tested on small random inputs.

## Key insight

The insight is that a tree can be described recursively by two operations that are both local, and that both preserve a very small interface.

Take a connected piece $C$ of the forest and call a vertex of $C$ a **boundary** if an edge of the forest leaves $C$ at that vertex. Keep at most two boundaries. Then $C$ can be merged with another piece whenever the two share exactly one boundary vertex $b$.

- If $b$ is no longer needed as a boundary after the merge, the merge is a **compress**. The two spines are concatenated at $b$, so $b$ becomes internal and the two remaining boundaries become the boundaries of the result.
- If $b$ must stay a boundary, the merge is a **rake**. The piece that is absorbed was hanging below $b$, and the result keeps the spine of the other piece.

The two operations are exhaustive for the merges that a top tree needs, and each one computes the aggregate of the result from the two child aggregates in constant time. That is the first half of the insight.

The second half is that the description can be kept balanced. A top tree is a binary tree of these merges whose root is a whole component. If its height is $O(\log n)$, then a change to one leaf, or a restructuring around one vertex, touches only $O(\log n)$ clusters. A path query is a restructuring that makes the queried path the spine of one cluster; a subtree query is a restructuring that makes the subtree a cluster with one boundary.

The third half is the one that makes the structure practical: the restructuring can be done by rotations on the cluster tree, in the same way that a splay tree moves a node to the root. The rotations are local re-associations of rakes and compresses, so the aggregate is recomputed in constant time per rotation, and the amortized cost of an expose is logarithmic.

## Visual intuition

Draw the tree with the root at the top. A cluster is a rounded blob around a connected set of vertices, with a dot on each boundary vertex.

```text
    1 ----- 2 ----- 3
            |
            4
            |
            5
```

The path $1-2$ is a cluster with boundaries $1$ and $2$. The edge $2-3$ hangs below boundary $2$; vertex $3$ has no other edge, so the edge cluster can declare the single boundary $2$. The edge can therefore be raked onto the path while $2$ is still a boundary:

```text
    3                    <- raked subtree at 2
    |
    1 ----- 2            <- spine, boundaries 1 and 2
```

The result is still a cluster with boundaries $1$ and $2$, and its spine is $1-2$. The raked edge $2-3$ is not on the spine. That distinction is exactly what a path aggregate must preserve.

The spine is then extended by compress. Merging with the edge $2-4$ at $2$ makes $2$ internal and leaves boundaries $1$ and $4$:

```text
    3
    |
    1 ----- 2 ----- 4    <- spine, boundaries 1 and 4
```

A second compress with the edge $4-5$ at $4$ extends the spine to $5$:

```text
    3
    |
    1 ----- 2 ----- 4 ----- 5   <- spine, boundaries 1 and 5
```

The order matters. After the compress at $2$, vertex $2$ is no longer a boundary, so no further subtree can be raked there. The subtree at $3$ is raked first, while $2$ is still available.

The top tree draws this decomposition as a binary tree. A compress node has two path-shaped children; a rake node has a path-shaped child and a subtree-shaped child.

```text
              compress (at 4)
             /              \
        compress (at 2)      edge 4-5
        /           \
    rake (at 2)     edge 2-4
    /       \
 edge 1-2   edge 2-3
```

Read the diagram from the leaves up: the edge $2-3$ is raked at $2$ while $2$ is still a boundary, the result is compressed with $2-4$ at $2$, and the longer spine is compressed with $4-5$ at $4$. Read it from the root down: the spine is the part that survives every rake, and the raked pieces are the parts that hang off it.

The same picture explains the query. To ask for the path $1-5$, the spine is already $1-2-4-5$ and the edge $2-3$ is the raked piece, so the answer excludes $3$. To ask for the path $1-3$, the structure is restructured so that $1-2-3$ is the spine and the subtree $4-5$ is the raked piece.

## Formal model

Let $F = (V, E)$ be a forest, and let every vertex $v$ carry a value $a_v$.

::: math definition Definition
A **cluster** is a pair $(C, \partial C)$ where $C$ is a connected subgraph of $F$ and $\partial C \subseteq V(C)$ is a set of at most two vertices, called the **interface**, such that every edge of $F$ with exactly one endpoint in $V(C)$ has its endpoint in $V(C)$ inside $\partial C$.
:::

The interface is allowed to contain a vertex that has no edge leaving the cluster. It is an upper bound on the places where the cluster can still be joined to the rest of the forest, not an exact list of them. This generosity keeps the definitions short: a declared vertex with no outside edge simply cannot connect the cluster to anything new, so it does not change any aggregate.

::: math definition Definition
A cluster with $|\partial C| = 1$ is a **subtree cluster**, one with $|\partial C| = 2$ is a **path cluster**, and one with $\partial C = \emptyset$ is a **closed cluster**. A closed connected cluster is a whole component of the forest.
:::

::: math definition Definition
Let $A$ and $B$ be clusters whose vertex sets intersect in exactly one vertex $b$, with $b \in \partial A \cap \partial B$. Their **merge** at $b$ is the cluster with vertex set $V(A) \cup V(B)$ and edge set $E(A) \cup E(B)$. The merge is a **compress** when $b$ is removed from the interface and a **rake** when $b$ stays in the interface. A rake is allowed only when the absorbed cluster declares no boundary other than $b$; otherwise an edge leaving that cluster at another boundary would be left uncovered.
:::

::: math lemma Lemma
The merge of two clusters at a shared interface vertex is a cluster.
:::

::: math proof Proof
The union is connected because both parts are connected and they share $b$. Every edge leaving the union leaves one of the two parts, so by the interface condition it touches an interface vertex of that part. If the merge is a compress, every such vertex except $b$ is still in the declared interface. If the merge is a rake, the absorbed cluster has interface $\{b\}$, so every edge that leaves it touches $b$, and $b$ remains in the interface of the result. In both cases at most two vertices are declared, so the result is a cluster. $\square$
:::

::: math definition Definition
A **top tree** of a component is a binary tree whose leaves are vertex clusters and edge clusters of the component, whose internal nodes are rakes or compresses of their two children, and whose root is a cluster containing the whole component. The root may leave its interface empty, or it may declare one or two of its vertices as an over-approximation; an expose uses the latter form. The **height** of the top tree is its number of levels.
:::

The distinction between a rake and a compress is not a property of the two child clusters alone. The same two clusters can be merged either way, and the choice decides which vertices remain available for later merges. A compress consumes the shared boundary and produces a longer spine. A rake keeps the shared boundary and produces a spine with a subtree hanging from it.

::: math lemma Lemma
A cluster with interface $\{a, b\}$ contains a unique path from $a$ to $b$, and every vertex of the cluster is either on that path or in a subtree attached to a vertex of it.
:::

::: math proof Proof
The cluster is connected, so it contains a path from $a$ to $b$; the path is unique because the cluster is a subgraph of a forest. Remove the edges of that path. Every remaining component touches the path in exactly one vertex: it cannot touch it in two, because that would create a cycle together with the path. Attaching each component at its unique contact vertex gives the stated description. $\square$
:::

The path in the lemma is the **spine** of the cluster. For a subtree cluster with interface $\{a\}$, the spine is the single vertex $a$, and for a closed cluster the spine is empty.

## Algorithm derivation

The derivation has four parts: the summary, the merge rules, the construction, and the restructuring.

**The summary.** Every cluster stores enough information to answer the query, and the information is computed from the two children. For path sums, a path cluster stores four numbers:

- $\operatorname{spine}(C)$: the sum of the values on the spine from $a$ to $b$, including both endpoints.
- $\operatorname{spineLength}(C)$: the number of vertices on the spine from $a$ to $b$, including both endpoints.
- $\operatorname{total}(C)$: the sum of the values of every vertex in the cluster.
- $\operatorname{count}(C)$: the number of vertices in the cluster.

A subtree cluster stores the same four numbers with the spine equal to its single boundary vertex, so its spine sum is just the value of that vertex and its spine length is one. A closed cluster stores the total and the count, and its spine sum and spine length are zero.

**The merge rules.** Suppose the shared vertex is $b$. The spine of a compress is the concatenation of the two spines, so $b$ is counted twice and must be subtracted once. The total has the same double count. A rake keeps the spine of the path-shaped child, and the total adds the whole absorbed subtree, again subtracting the shared vertex once.

For a compress:

$$
\operatorname{spine}(C) = \operatorname{spine}(A) + \operatorname{spine}(B) - a_b,
$$

$$
\operatorname{total}(C) = \operatorname{total}(A) + \operatorname{total}(B) - a_b,
$$

$$
\operatorname{count}(C) = \operatorname{count}(A) + \operatorname{count}(B) - 1.
$$

The spine length follows the same rule: $\operatorname{spineLength}(C) = \operatorname{spineLength}(A) + \operatorname{spineLength}(B) - 1$, because the shared vertex is on both spines and is counted once in the result.

For a rake of a subtree $B$ with interface $\{b\}$ onto a path cluster $A$ that contains $b$:

$$
\operatorname{spine}(C) = \operatorname{spine}(A), \qquad
\operatorname{spineLength}(C) = \operatorname{spineLength}(A),
$$

$$
\operatorname{total}(C) = \operatorname{total}(A) + \operatorname{total}(B) - a_b,
$$

$$
\operatorname{count}(C) = \operatorname{count}(A) + \operatorname{count}(B) - 1.
$$

The subtraction is the single most common source of wrong answers. The shared vertex belongs to both children, and the sum of the children counts it twice.

**The construction.** Root every component at an arbitrary vertex. For a vertex $v$, build the subtree cluster of each child first. Let the heavy child be the one whose subtree has the most vertices. Start with the heavy child's cluster, whose interface contains $v$, and rake the light child clusters onto it at $v$ while $v$ is still a boundary. If there is no heavy child, start with the single vertex $v$ and rake every child cluster onto it. The result is a subtree cluster at $v$. When $v$ is attached to its parent, compress the edge to the parent at $v$, which makes $v$ internal and leaves the parent as the only boundary. The heavy child is the one whose subtree has the most vertices, so the spine loses at least half of its weight at every light rake. Raking the light children in a balanced binary order, instead of one after another, keeps the height logarithmic even at a vertex of high degree. The result is a top tree of height $O(\log n)$.

**The restructuring.** A path query names $u$ and $v$. The structure must be rearranged so that one cluster has interface $\{u, v\}$ and spine equal to the $u$-$v$ path. A self-adjusting top tree does this by exposing $u$ and then $v$: each expose splays the clusters on the path from the root of the top tree to the leaf that contains the vertex, and each splay is a sequence of local rake and compress re-associations. After both exposes, the path is the spine of the root cluster.

A link inserts a new edge cluster and merges it at its two endpoints; a cut exposes the edge, removes it, and closes the two resulting clusters; a value change updates a leaf and pulls the aggregates up to the root. Every one of these operations touches $O(\log n)$ clusters.

**Lazy updates.** A subtree add applies a value $x$ to every vertex of a cluster. Store a pending addition $t$ at the cluster, add $t \ast \operatorname{count}(C)$ to the total, and add $t \ast \operatorname{spineLength}(C)$ to the spine sum. Push the tag to the children before a rotation or a split. The spine length is stored beside the spine sum, so a lazy addition updates both in constant time.

## Step-by-step execution

Take the tree with edges $1-2$, $2-3$, $2-4$, $4-5$, and give every vertex the value $1$. The vertices are numbered from $1$ for this example.

**Build the leaves.** There are five vertex clusters and four edge clusters. The edge $2-3$ declares only the boundary $2$, because vertex $3$ has no edge other than $2-3$; this is the over-approximation rule from the formal model, used in the other direction to drop a vertex that cannot be a boundary.

| Cluster    | Interface | Spine sum | Spine length | Total | Count |
| ---------- | --------- | --------- | ------------ | ----- | ----- |
| edge $1-2$ | $\{1,2\}$ | 2         | 2            | 2     | 2     |
| edge $2-3$ | $\{2\}$   | 1         | 1            | 2     | 2     |
| edge $2-4$ | $\{2,4\}$ | 2         | 2            | 2     | 2     |
| edge $4-5$ | $\{4,5\}$ | 2         | 2            | 2     | 2     |

**Rake the edge $2-3$ onto the edge $1-2$ at $2$.** Both clusters have $2$ in their interface, and the absorbed cluster has no other boundary. The rake keeps $2$ as a boundary, so the result $R$ has interface $\{1,2\}$, spine $1-2$, spine sum $2$, spine length $2$, total $2 + 2 - 1 = 3$, and count $3$. The subtree at $3$ is now inside the cluster, but it is not on the spine.

**Compress $R$ with the edge $2-4$ at $2$.** The shared vertex $2$ becomes internal, so the result $S$ has interface $\{1,4\}$, spine $1-2-4$, spine sum $2 + 2 - 1 = 3$, spine length $2 + 2 - 1 = 3$, total $3 + 2 - 1 = 4$, and count $4$.

**Compress $S$ with the edge $4-5$ at $4$.** The result has interface $\{1,5\}$, spine $1-2-4-5$, spine sum $3 + 2 - 1 = 4$, spine length $3 + 2 - 1 = 4$, total $4 + 2 - 1 = 5$, and count $5$. Both $1$ and $5$ are leaves with no edge leaving the component, so declaring them as the root interface is a valid over-approximation, and the cluster contains the whole component.

The root spine is $1-2-4-5$, and the vertex $3$ hangs off $2$ as a raked subtree. That is exactly the path from $1$ to $5$, so a query for $1-5$ reads the root spine sum and returns $4$.

**Query the path $1-3$.** The structure is exposed at $1$ and $3$. The expose restructures the cluster tree so that the spine becomes $1-2-3$ and the piece $2-4-5$ is the raked subtree. The new spine sum is $1 + 1 + 1 = 3$, and the answer is $3$. The total remains $5$, because the whole cluster still contains all five vertices; only the spine changed.

**Change the value of $4$ to $10$.** The leaf cluster of $4$ is updated, and the aggregates on the path from that leaf to the root are recomputed. The total becomes $5 - 1 + 10 = 14$. A query for $1-5$ now returns $1 + 1 + 10 + 1 = 13$, and a query for $1-3$ still returns $3$.

**Cut $2-4$ and relink $2-5$.** The cut exposes the edge $2-4$, removes it, and closes the two clusters: $\{1,2,3\}$ and $\{4,5\}$. A query for $1-5$ now names vertices in different components, and the contract prints $0$. The link $2-5$ joins the clusters, and a query for $1-4$ returns $1 + 1 + 1 + 10 = 13$.

Notice that the build never touched a vertex twice. Every merge was constant work, and the only information that traveled upward was the four numbers (spine sum, spine length, total, count).

## Correctness proof

::: math theorem Theorem
After an expose of $u$ and $v$, the spine of the root cluster is exactly the path from $u$ to $v$ in the represented forest.
:::

::: math proof Proof
The expose is a sequence of splays and local re-associations. Each local step replaces one rake or compress by another with the same two child clusters and the same shared vertex, so the union of the clusters and their interfaces is unchanged. A splay only changes the shape of the cluster tree, not the set of clusters represented by its leaves. By induction on the number of steps, the root still represents the whole component.

What changes is which vertices are boundaries of the root cluster and which path is its spine. The expose of $u$ makes $u$ a boundary of the root and makes the path from the old root boundary to $u$ the new spine. The expose of $v$ then makes $v$ the second boundary, and the spine becomes the path between the two boundaries, which is the $u$-$v$ path. The two exposes compose because the second one preserves the first boundary while replacing the other. $\square$
:::

::: math theorem Theorem
The aggregate stored at a cluster is the aggregate of the subgraph it represents.
:::

::: math proof Proof
The proof is by induction on the height of the cluster. A leaf is a single vertex or a single edge, and its stored values are its values by definition.

For a compress at $b$, the union of the two children contains every vertex of the result, and the only vertex counted twice is $b$, which lies on both spines and in both totals. Subtracting $a_b$ once from each sum gives the sum over the union, and subtracting one from the count gives the number of distinct vertices. The spine of the result is the concatenation of the two spines, so its sum is the two spine sums minus the shared value.

For a rake at $b$, the result contains the path cluster and the absorbed subtree. The absorbed subtree has interface $\{b\}$, so $b$ is the only shared vertex; the total is the sum of the two totals minus $a_b$. The spine is unchanged, because the raked subtree is not on the path between the two boundaries of the result. The count subtracts the shared vertex once. The same argument applies when the raked cluster is attached to a subtree cluster, with the spine remaining the single boundary vertex. $\square$
:::

::: math theorem Theorem
A path query returns the sum of the values on the path between its two vertices, and a subtree query returns the sum of the values in the named subtree.
:::

::: math proof Proof
By the first theorem, the expose leaves a root cluster whose spine is the queried path. By the second theorem, the root's spine sum is the sum of the values on that spine, which is the path sum. The path query reads the spine sum and nothing else.

For a subtree query, expose the edge from the subtree root $v$ to its parent $p$. The cluster on the $v$ side of that edge has interface $\{v\}$, and its spine is the single vertex $v$; its total is the sum over the whole cluster, which is exactly the subtree of $v$ when the tree is rooted at $p$. The query reads the total of that cluster. $\square$
:::

The three theorems together are the contract of the structure. The first is structural, the second is algebraic, and the third connects the algebra to the statement.

## Complexity analysis

**The build.** A component with $n$ vertices has $n$ vertex clusters and $n - 1$ edge clusters. Building the initial top tree performs one merge per edge, so it costs $O(n)$ merges and $O(n)$ space. The balanced rake order costs no more than the merges themselves.

**One merge.** Constant time for a commutative aggregate: a fixed number of additions and subtractions. A non-commutative aggregate stores two directions and still costs constant time.

**One expose.** A self-adjusting top tree performs $O(\log n)$ amortized rotations. Each rotation is a local re-association of two merges, so the total is $O(\log n)$ amortized.

**One link or cut.** One expose plus a constant number of merges and splits, so $O(\log n)$ amortized.

**One value change.** One expose of the vertex, one leaf update, and one pull to the root, so $O(\log n)$ amortized.

**One path or subtree query.** One or two exposes and one read, so $O(\log n)$ amortized.

**Space.** One cluster per vertex and per edge, plus the pointers of the cluster tree, so $O(n)$.

::: math complexity Complexity
A top tree over a forest of $n$ vertices supports link, cut, vertex update, path aggregate, and subtree aggregate in $O(\log n)$ amortized time per operation, with $O(n)$ space.
:::

The logarithmic bound depends on balance. A top tree built by raking the children of a star one after another has height $n$, and then every operation is linear. The bound is a property of the construction, not of the word "top tree".

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static tree, path queries | Heavy-light decomposition or binary lifting |
| Dynamic tree, path aggregates only | A link-cut tree |
| Dynamic tree, path and subtree aggregates | A top tree, or a link-cut tree augmented with virtual subtree sizes |
| Dynamic tree, subtree aggregates only | An Euler tour tree with a balanced sequence, or a top tree |
| Dynamic tree, subtree add and subtree sum | A top tree with lazy tags, or an Euler tour tree with lazy tags |
| Only links, connectivity or component sums | A disjoint set union |
| Links and cuts, only connectivity | Offline dynamic connectivity, or a top tree |
| All operations known in advance | A segment tree over time with a rollback structure |
| The tree is a chain | A balanced binary search tree over the chain |
| The tree is a star | A Fenwick tree over the leaves |

The first three rows are the ones that matter in a contest. A link-cut tree is shorter than a top tree and is enough for path sums, path maximums, and path compositions. A top tree becomes worth its implementation cost when the query is about a subtree, when the aggregate needs both directions of the spine, or when the same structure must answer both kinds of question.

The Euler tour tree is the other general answer. It represents the tour of a rooted tree as a balanced sequence, so a subtree is a contiguous interval and a link or a cut is a constant number of sequence splits and concatenations. It handles subtree aggregates very well and path aggregates poorly. A top tree handles both, which is why it is the more general structure.

## Reference implementations

The six programs in this article maintain the same kind of forest that a top tree describes, but they do not implement the cluster tree. They implement a **link-cut tree**: a splay tree of preferred paths, with one path-parent pointer per auxiliary tree. This is stated here explicitly so that the code and the article do not pretend to be the same structure.

The correspondence is exact enough to be useful:

| Top-tree notion | Link-cut realization |
| --- | --- |
| A path cluster with two boundaries | One auxiliary splay tree, whose in-order is the preferred path |
| A compress of two path clusters | A splay concatenation, performed by `access` |
| A rake of a subtree onto a path | A path-parent pointer to the vertex above the preferred path |
| An expose of $u$ and $v$ | `make_root(u)` followed by `access(v)` |
| The spine aggregate | The `sum` field at the root of the exposed splay tree |
| A subtree cluster | A virtual subtree, represented by a path-parent pointer, not by an explicit node |

The link-cut tree is the special case in which every merge is a compress and every rake is implicit. That is enough for the contract of this article, which asks for path sums, cuts, links, and value changes. It is not enough for a subtree aggregate, which is why the worked problems below that ask for subtrees describe the top-tree or virtual-subtree extension rather than claiming that the reference program solves them unchanged.

The six programs share one contract. The input is $n$ and $q$, then $q$ lines. A line is `link u v`, `cut u v`, `set u x`, or `path u v`, with 0-based vertices. Every vertex starts with the value $1$. The output is one line per `path` operation, holding the sum of the values on the path. A link that would create a cycle is ignored, a cut of an edge that does not exist is ignored, and a path between two different trees prints `0`.

The language differences are mechanical:

- **C** owns its arrays with `calloc` and releases them with `free`, parses with `scanf`, and prints with `%lld`.
- **C++17** keeps the arrays in `std::vector`, uses `std::swap` for the reversal, and buffers nothing because `'\n'` is enough.
- **Java** is a single class named `Main`, reads operation words with `StreamTokenizer`, stores sums in `long`, and builds the output in a `StringBuilder`.
- **Python** reads all tokens at once, keeps the arrays as lists, and relies on Python integers, which do not overflow.
- **JavaScript** reads standard input with `node:fs`, stores indices in `Int32Array` and sums in `Float64Array`, and keeps every intermediate below $2^{53}$.
- **Pascal** reads one line at a time because the pas2js console unit supplies `ReadLn` for strings but not `Read` for strings, parses the line manually, and stores every sum in `Int64`. No 128-bit integer is used.

The JavaScript and Pascal listings are educational references; neither language is a USACO submission language. The C, C++17, Java, and Python listings are ordinary programs that read standard input and write standard output.

## Recursion decision

A static top tree is built by a recursion that returns the cluster of a subtree. That recursion is safe when the decomposition is balanced, because its depth is the height of the top tree, $O(\log n)$. It is not safe when the same code is used to walk the tree itself, because the tree can be a chain of $n$ vertices and the recursion depth becomes $n$.

The reference programs avoid recursion entirely. The splay tree is iterative, and `push_path` uses an explicit stack of at most $n$ entries. The initial forest has no edges, so there is no traversal to write.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative for the tree; a balanced top-tree build may recurse |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative for the tree |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative for the tree |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is not a wrong answer. It is a crash: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

## Implementation walkthrough

The reference implementation is a link-cut tree, and the walkthrough follows its operations. The choice is deliberate: a correct self-adjusting top tree is several hundred lines per language, and most of those lines are the splay of the cluster tree, which the link-cut tree already contains in a simpler form.

The layout is flat. Vertices are numbered $1$ through $n$, and index $0$ is the null node, so a child pointer of $0$ is safe to read.

```cpp
static bool is_aux_root(int x) {
    const int p = parent[x];
    return p == 0 || (left[p] != x && right[p] != x);
}
```

An auxiliary root has a parent pointer that is either null or a path-parent, not a splay parent. That single predicate distinguishes the two kinds of parent, and every splay operation depends on it.

`pull` recomputes the sum of an auxiliary subtree from its children and its own value:

```cpp
static void pull(int x) {
    sum[x] = sum[left[x]] + sum[right[x]] + value[x];
}
```

`access` is the restructuring operation. It walks up through the path-parent pointers, splays each vertex, and replaces its right child by the path that has just been built below it. The result is that the path from the represented root to $x$ is one auxiliary tree.

```cpp
static void access(int x) {
    int last = 0;
    for (int y = x; y != 0; y = parent[y]) {
        splay(y);
        right[y] = last;
        pull(y);
        last = y;
    }
    splay(x);
}
```

`make_root` exposes $x$ and reverses it, which makes $x$ the root of the represented tree. The reversal is lazy: it swaps the children and sets a flag, and `push` propagates the flag before a rotation reads the children.

The operations are then short:

```cpp
static void link(int x, int y) {
    make_root(x);
    if (find_root(y) != x) {
        parent[x] = y;
    }
}

static void cut(int x, int y) {
    make_root(x);
    access(y);
    if (left[y] == x && right[x] == 0) {
        left[y] = 0;
        parent[x] = 0;
        pull(y);
    }
}

static void set_value(int x, long long v) {
    access(x);
    value[x] = v;
    pull(x);
}

static long long path_sum(int x, int y) {
    if (find_root(x) != find_root(y)) {
        return 0;
    }
    make_root(x);
    access(y);
    return sum[y];
}
```

The guard in `link` is not optional. Without it, a link inside one tree creates a cycle, and the represented structure stops being a forest. The guard in `cut` is the adjacency test: after `make_root(x)` and `access(y)`, the vertex $x$ is adjacent to $y$ exactly when $x$ is the left child of $y$ and $x$ has no right child. Removing a larger left subtree would detach a whole suffix instead of one edge.

The guard in `path_sum` is part of this article's contract. A link-cut tree can be asked for the sum of a path only when the endpoints are connected; with the `find_root` test, the program prints `0` for a disconnected pair instead of returning an arbitrary aggregate from one of the two trees.

`set_value` is a point update. After `access(x)`, the vertex $x$ is the root of its auxiliary tree, so changing `value[x]` and calling `pull(x)` updates exactly the aggregates that contain it.

The top-tree view of these operations is the table in [Reference implementations](#reference-implementations). The important consequence is that the code is correct for path sums but would need virtual subtree aggregates, or a real cluster tree, before it could answer a subtree query.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Raking a cluster with two boundaries | One boundary is silently dropped and later merges are invalid | Rake only a subtree cluster whose interface is the shared vertex |
| Treating a rake as a compress | The raked subtree becomes part of the spine and inflates every path sum | Decide whether the shared vertex stays a boundary |
| Forgetting to subtract the shared vertex | Every merge adds one extra value | Subtract $a_b$ once from the total and from the spine sum |
| Subtracting the shared vertex twice | The boundary value disappears from every aggregate | Count it once in each child and subtract once in the parent |
| Using the spine sum for a subtree query | The answer omits the raked subtrees | Read the total of the one-boundary cluster |
| Using the total for a path query | The answer includes vertices that are not on the path | Read the spine sum of the exposed cluster |
| Not pushing the lazy tag before a rotation | The children are read with stale values and the aggregate is wrong | Push on every node on the access path |
| Building a top tree by sequential raking | A star produces a chain of height $n$ and every operation is linear | Rake in a balanced order and follow the heavy child |
| Exposing only one endpoint | The root cluster describes a subtree, not the path | Expose both $u$ and $v$ |
| Assuming path queries are connected | The aggregate is read from an arbitrary tree | Test the roots, or state that the input guarantees connectivity |
| Storing sums in 32-bit integers | A path of $200\,000$ values near $10^9$ overflows | Use 64-bit sums |
| Rebuilding the whole structure per operation | The asymptotic bound is lost | Restructure only the exposed path |

### Why this fails: the rake that is treated as a compress

Take the tree $1-2-3$ with a fourth vertex $4$ attached to $2$, and give every vertex the value $1$. The path $1-3$ has sum $3$.

Suppose the cluster $P$ for $1-2-3$ has interface $\{1,3\}$ and spine sum $3$. The edge $2-4$ is a subtree cluster at $2$ once the leaf endpoint $4$ is dropped from its interface. Vertex $2$ is not a boundary of $P$, so no merge at $2$ is legal. An implementation that checks only that $2$ lies in $P$, and treats the merge as a **compress**, removes $2$ from the interface and produces a cluster with interface $\{1,4\}$. Its spine is not the path $1-3$, because the union is not a path: vertex $2$ has three incident edges inside the union. The formula still computes a number:

$$
\operatorname{spine} = 3 + 2 - 1 = 4.
$$

A query for $1-3$ that reads this spine sum returns $4$, including vertex $4$, although $4$ is not on the path. The smallest counterexample is four vertices, and the error is exactly the sum of the values in the raked subtree other than the attachment vertex.

The correct build rakes the edge $2-4$ at $2$ before $2$ becomes internal: start with the edge $1-2$, rake $2-4$ at $2$, then compress with $2-3$. The rake keeps the spine $1-2$ with sum $2$ and total $3$. The compress with $2-3$ gives the spine $1-2-3$ with sum $3$ and total $4$. A query for $1-3$ returns $3$, and a query for $1-4$ returns $1 + 1 + 1 = 3$. The two merge types differ by which vertex remains a boundary, and that difference is the entire rake-compress distinction.

## Variants and extensions

- **Static top tree.** If the tree never changes, the top tree can be built once by centroid decomposition or by the heavy-child construction, and a path query combines the $O(\log n)$ clusters that cover the path. Updates are point updates along the cluster tree.
- **Self-adjusting top tree.** The splay-based version of Alstrup, Holm, de Lichtenberg, and Thorup supports link and cut. The rebalancing is the difficult part, and it is the version that gives the amortized logarithmic bound.
- **Link-cut tree.** The special case with only compress clusters and implicit rakes. It is the practical choice for path aggregates, and it is what the reference programs implement.
- **Euler tour tree.** A balanced sequence of the Euler tour supports subtree aggregates and link and cut, but a path aggregate needs a different decomposition.
- **Top tree with virtual subtree sizes.** A link-cut tree can answer subtree queries if every vertex also stores the total size or sum of the subtrees that are not on its preferred path, and the access operation updates that value at every path-parent change.
- **Non-commutative aggregates.** Store the spine sum in both directions and swap them when a path is reversed. A path composition such as a matrix product needs this.
- **Edge values.** Split every edge into an edge-vertex, or store the value on the child endpoint and exclude the top boundary from the aggregate. The split is simpler and costs $O(n)$ extra vertices.
- **Dynamic minimum spanning forest.** A top tree whose clusters store the maximum edge on a path supports the replacement step of an online MST algorithm.
- **Dynamic programming under updates.** A tree DP whose recurrence is a small monoid can be maintained by a top tree, which is the "top tree DP" technique used for dynamic maximum independent set and similar problems.

## Contest strategy

Under contest pressure, the implementation choice matters more than the theory. A fixed procedure:

1. Decide whether the query is about a **path**, a **subtree**, or both. This decides between a link-cut tree and a top tree or Euler tour tree.
2. If only path aggregates are needed, write a link-cut tree. It is shorter, it is well tested, and its `access` is the same restructuring that a top tree would perform.
3. If subtree aggregates are needed, consider the Euler tour tree first. It is easier to implement than a top tree and handles subtree intervals naturally.
4. If both are needed, or the aggregate is not commutative and must follow the path direction, write the top tree or augment the link-cut tree with both directions and virtual subtree values.
5. Number the vertices from $1$ and reserve $0$ for the null node. Every guard becomes simpler.
6. Test the small cases explicitly: one vertex, two vertices, a star, a chain, repeated identical links, cuts of missing edges, and a path across two components.
7. Write a brute-force path sum and compare on random small forests. A disagreement is a counterexample, not a reason to add a patch.
8. Use 64-bit sums. A path of $200\,000$ vertices with values near $10^9$ reaches $2 \cdot 10^{14}$.
9. Do not rebuild the decomposition after every operation. If the code does, it is not a dynamic tree, and the complexity is wrong.
10. State the contract for invalid operations in the comments: ignored link, ignored cut, or a printed zero. The judge's guarantees decide which one is needed.

## Worked problems

### Problem 1: Dynamic Tree Vertex Add Subtree Sum

**Restatement.** A tree of $N$ vertices is given with a value on every vertex. Process $Q$ operations: replace an edge, add $x$ to one vertex, and output the sum of the subtree of $v$ when $p$ is regarded as the parent across the edge $(v, p)$. Constraints: $N, Q \le 200\,000$ and values up to $10^9$.

**Naive baseline.** Find the subtree by a traversal from $v$ that avoids $p$, and sum it. A single query is $O(N)$, and a chain makes every query touch almost the whole tree.

**Insight.** The edge $(v, p)$ is the only connection between the subtree and the rest of the tree. If the cluster tree is exposed at that edge, the $v$ side is a cluster with a single boundary $v$, and its total is exactly the answer. The replacement of an edge is a cut followed by a link, and both are local restructuring operations.

**Derivation.** Root the cluster tree at the $v$ side of the exposed edge. A `0` operation cuts the old edge and links the new one. A `1` operation adds $x$ to the leaf of $p$ and pulls the aggregates to the root. A `2` operation exposes $(v, p)$, takes the one-boundary cluster on the $v$ side, and prints its total. A top tree does this directly. A link-cut tree needs virtual subtree sums, because the child clusters that are not on the preferred path are implicit.

**Correctness.** By the cluster invariant, every edge between the subtree of $v$ and the rest of the tree is the edge $(v, p)$, and that edge touches the boundary $v$. The one-boundary cluster therefore contains exactly the subtree, and its total counts every vertex once.

**Complexity.** $O(\log N)$ amortized per operation, $O(N)$ space.

**Common wrong approach.** Maintaining a static rooted tree and using a subtree-size array. A link or a cut changes the parent of a whole subtree, so the array is stale after the first structural operation.

### Problem 2: Dynamic Tree Subtree Add Subtree Sum

**Restatement.** The same dynamic tree, but a `1` operation adds $x$ to every vertex in the subtree of $v$ across the edge $(v, p)$, and a `2` operation asks for the sum of that subtree. Constraints: $N, Q \le 200\,000$.

**Naive baseline.** Traverse the subtree for every add and every query, which is $O(N)$ per operation.

**Insight.** A subtree is a one-boundary cluster, so a lazy tag on the cluster is enough. The total of the cluster grows by $x \ast \operatorname{count}$, and the tag is pushed only when the cluster is split or rotated.

**Derivation.** Expose the edge $(v, p)$. For an add, apply the tag to the one-boundary cluster on the $v$ side and pull its ancestors. For a query, expose the same edge and read the total. The cut and link operations are unchanged, but a cut must push the tags on the exposed path before it detaches the edge.

**Correctness.** The lazy tag is an affine update: it adds $x$ to every value in the cluster. The total and the spine sum are linear in the values, so adding $x \ast \operatorname{count}$ to the total and $x \ast \operatorname{spineLength}$ to the spine sum is exactly the effect of the update. Pushing before a split preserves the values of the children.

**Complexity.** $O(\log N)$ amortized per operation, $O(N)$ space.

**Common wrong approach.** Applying the tag only to the root of the exposed path and forgetting the raked subtrees. The raked subtrees are inside the cluster, so the count must include them, and the tag must reach them before the cluster is split.

### Problem 3: Great Fusion

**Restatement.** $N$ isolated planets are joined by links, one at a time, and the input guarantees that the graph stays a forest. A query names an existing edge $(x, y)$ and asks for its **load**: the number of simple paths that cross it. Constraints: $N, Q \le 100\,000$.

**Naive baseline.** Remove the edge and count the vertices on each side by two traversals. The product of the two counts is the number of paths, and the cost is $O(N)$ per query.

**Insight.** Removing the edge splits its tree into two components, and a path crosses the edge exactly when its endpoints lie in different components. The load is therefore $s_x \ast s_y$, where $s_x$ and $s_y$ are the sizes of the two sides. A top tree exposes the edge and reads the counts of the two one-boundary clusters.

**Derivation.** Maintain a cluster for every current component. A link adds an edge cluster and merges it at both endpoints. A query exposes the edge $(x, y)$, which makes the $x$ side and the $y$ side two one-boundary clusters, and prints the product of their counts. The product is formed in 64-bit arithmetic because the largest possible value is about $2.5 \ast 10^9$.

**Correctness.** The exposed edge is a bridge of its component, so the two sides are disconnected after its removal. Every simple path that crosses the edge has one endpoint on each side, and every pair of vertices on opposite sides determines exactly one such path. The product of the side sizes counts those pairs once.

**Complexity.** $O(\log N)$ amortized per operation, $O(N)$ space. With a link-cut tree, the same query needs virtual subtree sizes, and the product is read from the two sides after `make_root(x); access(y)`.

**Common wrong approach.** Using a disjoint set union and multiplying the sizes of the two whole components. The edge does not split the component at its endpoints' component sizes; it splits it into the part on the $x$ side and the part on the $y$ side, and only a dynamic tree structure can tell those apart after arbitrary links.

## Practice progression

1. **Recognition.** Given a statement, decide whether the tree changes and whether the query is a path, a subtree, or both. Write down which of the three structures applies: static decomposition, link-cut tree, or top tree.
2. **Direct application.** Implement a link-cut tree for path sums and compare it against a brute-force traversal on random small forests.
3. **The cluster algebra.** Draw the rake and compress merges for a five-vertex tree and compute the spine sum, total, and count by hand. Check the subtraction of the shared vertex at every merge.
4. **Adaptation.** Add the `set` operation and the connectivity guard. Then add a subtree query with virtual subtree sizes, and compare against a brute-force subtree sum.
5. **Lazy propagation.** Add a subtree add to the previous structure. Test an add followed by a cut, and an add followed by a link, on a small tree.
6. **Combination.** Solve a problem that asks for both a path aggregate and a subtree aggregate, and notice which parts of the top tree each query reads.
7. **Challenge.** Implement a static top tree by centroid decomposition, then a self-adjusting one. Measure the height on a star and on a chain, and confirm that the balanced construction is logarithmic on both.
8. **Transfer.** Use the same cluster idea for a dynamic maximum independent set, a dynamic diameter, or a dynamic minimum spanning forest.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is a cluster, and what does the interface guarantee? (Formal model)
2. What is the difference between a rake and a compress? (Key insight)
3. Why must the shared vertex be subtracted exactly once from the total? (Algorithm derivation)
4. Which aggregate does a path query read, and which does a subtree query read? (Correctness proof)
5. Why does a subtree query expose an edge rather than a pair of vertices? (Worked problems)
6. What happens to the height of a top tree if a star is raked sequentially? (Complexity analysis)
7. Why is the link-cut tree a special case of a top tree? (Reference implementations)
8. Why does `access` need to splay before it replaces the right child? (Implementation walkthrough)
9. What is the smallest counterexample to treating a rake as a compress? (Why this fails)
10. When is an Euler tour tree a better choice than a top tree? (Algorithm selection)
11. Why is a lazy subtree add multiplied by the count, and why does the spine use a different length? (Variants and extensions)
12. What does the cut guard test, and what happens without it? (Implementation walkthrough)

## Further reading

- The dynamic tree that stores preferred paths in splay trees is [dynamic trees](/algorithms/trees/dynamic-trees), the structure the reference programs implement.
- The static decomposition that solves the same path queries without link or cut is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The ancestor table that a static path query builds on is [lowest common ancestor](/algorithms/trees/lca).
- The decomposition that balances a tree by removing centroids is [centroid decomposition](/algorithms/trees/centroid-decomposition), and it is the usual way to build a static top tree.
- The offline treatment of a sequence of links and cuts is [offline dynamic connectivity](/algorithms/advanced/offline-dynamic-connectivity).
- The segment tree that stores the aggregates of a static path or subtree interval is [segment tree](/algorithms/range-queries/segment-tree).
- The accounting that turns the splay rotations into an amortized bound is [amortized analysis](/algorithms/foundations/amortized-analysis).
- The original self-adjusting top tree is described by Stephen Alstrup, Jacob Holm, Kristian de Lichtenberg, and Mikkel Thorup in "Maintaining information in fully dynamic trees with top trees"; the link-cut tree is described by Daniel Sleator and Robert Tarjan in "A data structure for dynamic trees".
