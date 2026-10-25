---
id: advanced.offline-dynamic-connectivity
title: Offline dynamic connectivity
summary: Read every operation first, store each edge on the segment-tree nodes that cover the times it is alive, and answer the queries at the leaves with a rollback union-find.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        offline dynamic connectivity,
        rollback union-find,
        segment tree over time,
        divide and conquer,
        edge lifetimes,
        fully dynamic graph,
    ]
prerequisites:
    required: [graphs.dsu]
    recommended:
        [
            advanced.rollback-dsu,
            range-queries.segment-tree,
            advanced.parallel-binary-search,
            foundations.complexity,
        ]
complexity:
    time: "O(q log q log n)"
    space: "O(n + q log q)"
assumptions:
    - The whole operation sequence is known before the first answer, so every edge can be assigned the intervals of time during which it is alive.
    - The union-find uses union by size and no path compression, so every merge is reversible in constant time.
implementations: advanced.offline-dynamic-connectivity
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/advanced.offline-dynamic-connectivity.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

Offline dynamic connectivity answers connectivity questions about a graph whose edges appear and disappear. It reads the entire operation sequence before producing an answer. Each edge is alive during one or more intervals of time. A segment tree over the timeline stores every interval in the $O(\log q)$ nodes that cover it, and a depth-first traversal of that tree keeps a rollback union-find of exactly the edges stored on the current path.

At a leaf, the union-find holds exactly the edges that are alive at that moment, so one `find` on each endpoint answers the query. The rollback is what makes the traversal possible. A plain union-find cannot delete an edge, because merging two sets destroys the information needed to split them. With union by size and no path compression, a merge changes only two array entries, and a stack of merge records can undo it in constant time.

The reference input in this article has only edge insertions and connectivity queries. That is the smallest instance of the technique: every inserted edge stays alive to the end, so its interval is a suffix of the timeline. The same machinery handles deletions by closing the interval of an edge when it is removed. The worked problems use the general form.

For $q$ operations on $n$ vertices the traversal costs $O(q\log q\log n)$ time and $O(n + q\log q)$ space. The alternative is to rebuild the graph for every query, which costs $O(q^2)$ in the worst case and is far too slow at the usual limits.

## Problem motivation

A city is building and closing roads. The road network is an undirected graph on $n$ districts. Over a day, a sequence of events opens a road, closes a road, or asks whether two districts are connected. The planning office wants the answer to every question at the moment it is asked.

When roads are only opened, the problem is easy. A disjoint set union merges the endpoints of every new road, and two districts are connected exactly when their representatives are equal. The component count is one counter that decreases on every successful merge. The structure is almost constant time per event, and no offline processing is needed.

Closing a road breaks this. Suppose the roads $(1,2)$ and $(2,3)$ were opened, so the union-find merged $\{1,2,3\}$, and then $(1,2)$ closes. The union-find still reports $1$ and $3$ as connected, but the surviving road $(2,3)$ does not connect them. The structure has forgotten which edges produced the merge, and even if it remembered them, it has no operation that splits a set back into the two pieces that were joined.

The naive repair is to rebuild the graph and its union-find after every event. With $q$ events that costs $O(q(n + m\log n))$ or, if the operations are replayed from the beginning each time, $O(q^2\alpha(n))$. At $q = 10^5$ the replay performs about $10^{10}$ merges, which is far beyond a contest time limit.

The problem is offline: the whole event sequence is in the input, so the entire timeline is known before the first answer is produced. Each road exists during an interval of time. The timeline can be cut into a segment tree, each road is stored in the nodes whose ranges it covers, and a query is answered at a leaf. The edges on the path from the root to that leaf are exactly the roads that are open at that moment.

That traversal needs a structure that can be pushed on the way down and popped on the way back. The push is a merge, and the pop is an undo. The rollback disjoint set union is that structure, and the segment tree over time is the schedule that tells it when to push and when to pop.

## Recognition patterns

Offline dynamic connectivity is the right tool when the statement contains some of these phrases.

- "Edges are added and removed", "roads open and close", "the graph changes between queries".
- "After each event", "at the moment of the query", "the graph at time $t$".
- "The operations are given in advance", "answer all queries offline", "you may reorder the queries".
- "For every query, report the number of connected components".
- "Is the graph bipartite after every update?", "does the graph contain an odd cycle?".
- "Each edge is active during an interval", "the edge exists from $l$ to $r$".
- "The operations form one timeline", with a mixture of updates and questions.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| Only insertions, queries online | A plain disjoint set union with path compression |
| Only insertions, queries offline | A single forward sweep; the segment tree is overhead |
| Insertions and deletions, queries offline | A segment tree over time plus a rollback union-find |
| Insertions and deletions, queries online | A fully dynamic connectivity structure, or a link-cut tree when the graph is a forest |
| Each edge lifetime is one known interval | The standard offline method |
| The graph is a forest and edges change | A link-cut tree, or an Euler tour tree |
| The answer is a component count | A rollback union-find with a counter |
| The answer is bipartiteness | A rollback union-find with a parity to the parent |
| The answer is an aggregate per component | A rollback union-find with counts stored at the roots |
| A query depends on an earlier answer | The simple interval fill does not apply |

The third row is the standard application. The fourth row is its honest limit. A query that depends on the answers of earlier queries cannot have its intervals computed in advance, because the future state of the graph is not known. The adaptive variant can still use the segment tree, but it fills the tree during the traversal instead of before it; this is the idea behind the hardest curated problem for this technique.

The second row is worth checking first. If every operation is an insertion, a plain union-find answers all queries in one pass, and the segment tree only adds constants. The offline machinery earns its keep when deletions are real.

## Naive approach

The first baseline rebuilds the union-find for every query from the list of edges that are alive at that moment.

```cpp
struct Edge { int u, v, first, last; };

// Dsu is any union-find; QUERY is the tag of a query operation.
for (int t = 1; t <= q; ++t) {
    if (op[t].type != QUERY) continue;
    Dsu dsu(n);
    for (const Edge& e : edges) {
        if (e.first <= t && t <= e.last) dsu.unite(e.u, e.v);
    }
    answer[t] = dsu.same(op[t].u, op[t].v);
}
```

This is correct, and it is the reference implementation for differential testing. With $E$ edge instances and $q$ queries, it costs $O(qE)$ merges plus $O(qn)$ for the initialization, which is $O(q(n+m))$ in the worst case.

The second baseline snapshots the two union-find arrays before every merge and restores them by copying.

```cpp
std::vector<int> saved_parent = parent;
std::vector<int> saved_size = size;
unite(u, v);
// later:
parent = saved_parent;   // O(n) per undo
size = saved_size;
```

This is correct. The merge is cheap, but the undo copies $O(n)$ entries. A traversal that performs $q\log q$ merges pays $O(nq\log q)$ for the undos alone, which is worse than rebuilding in many cases.

The third baseline recomputes the connected components with a breadth-first search at every query. Its cost is $O(q(n+m))$, and it throws away all the work of one query when the next one starts.

The naive version is still useful. It is the reference implementation for differential testing on small random inputs, and it is the fastest way to check that the interval boundaries in the fast version are right.

## Key insight

The insight has four parts, and each part removes one obstacle.

**Time is the axis, not the vertex set.** Every edge is alive during a set of times. A query at time $t$ depends only on the edges whose lifetimes contain $t$. Instead of maintaining the graph forward, the algorithm answers each query from a structure that is built for its time.

**A segment tree over time turns containment into a path.** Store each lifetime interval in the $O(\log q)$ nodes whose ranges it covers. For a leaf $t$, the edges stored on the root-to-leaf path are exactly the edges whose intervals contain $t$. An interval is stored at a node only when the node's range lies inside the interval, and a leaf lies inside that node exactly when its time lies in the interval.

**A depth-first traversal matches the nesting of the path.** The edges of a node are needed by every leaf below it and by no leaf outside it. Push them when the traversal enters the node, recurse, and pop them when it leaves. The union-find never deletes an arbitrary edge; it only undoes the most recent merges, which is exactly what a stack can do.

**No path compression.** Union by size keeps the trees shallow, and every merge changes only two entries: the parent of the smaller root and the size of the larger root. A frame that records those two entries and the old size restores the state exactly. Path compression would rewrite pointers outside the frame, and a rollback would leave the compressed pointers behind.

The first part is the offline transformation. The second part is the schedule. The third part is the traversal. The fourth part is what makes the traversal reversible.

## Visual intuition

Take eight moments and three edges. Edge A is alive during times $1$ through $4$, edge B during $3$ through $8$, and edge C during $6$ through $8$.

| Edge | Interval | Meaning                                    |
| ---- | -------- | ------------------------------------------ |
| A    | $[1, 4]$ | added at time $1$, removed before time $5$ |
| B    | $[3, 8]$ | added at time $3$, never removed           |
| C    | $[6, 8]$ | added at time $6$, never removed           |

The segment tree over $[1, 8]$ splits each range in half. Every interval is stored in the nodes that its range fully covers.

```text
                    [1, 8]
                   /      \
              [1, 4]        [5, 8]
             /      \       /      \
          [1, 2] [3, 4] [5, 6]   [7, 8]
                          /   \
                       [5, 5] [6, 6]
```

The buckets are: A at $[1,4]$; B at $[3,4]$ and $[5,8]$; C at $[6,6]$ and $[7,8]$. No interval is stored twice on one root-to-leaf path, because the canonical nodes that cover an interval are disjoint.

Reading the path to each leaf gives the graph at that moment:

| Leaf | Edges on the path | Alive edges |
| ---- | ----------------- | ----------- |
| 1    | A                 | A           |
| 2    | A                 | A           |
| 3    | A, B              | A, B        |
| 4    | A, B              | A, B        |
| 5    | B                 | B           |
| 6    | B, C              | B, C        |
| 7    | B, C              | B, C        |
| 8    | B, C              | B, C        |

The table matches the intervals directly, which is the whole point: a range-containment question has become a tree-path question.

Now walk the tree with a rollback union-find. The history column shows the frames as $(c \to r, s_0)$, meaning child $c$ was attached to root $r$ and the size of $r$ was $s_0$ before the merge.

| Step  | Node    | Edges pushed | History after                | Partition              |
| ----- | ------- | ------------ | ---------------------------- | ---------------------- |
| enter | $[1,8]$ | none         | empty                        | $\{1\}\{2\}\{3\}\{4\}$ |
| enter | $[1,4]$ | A            | $(2 \to 1, 1)$               | $\{1,2\}\{3\}\{4\}$    |
| leaf  | 1       | none         | $(2 \to 1, 1)$               | $\{1,2\}\{3\}\{4\}$    |
| leaf  | 2       | none         | $(2 \to 1, 1)$               | $\{1,2\}\{3\}\{4\}$    |
| enter | $[3,4]$ | B            | $(2 \to 1, 1), (3 \to 1, 2)$ | $\{1,2,3\}\{4\}$       |
| leaf  | 3       | none         | same                         | $\{1,2,3\}\{4\}$       |
| leaf  | 4       | none         | same                         | $\{1,2,3\}\{4\}$       |
| leave | $[3,4]$ | pop B        | $(2 \to 1, 1)$               | $\{1,2\}\{3\}\{4\}$    |
| leave | $[1,4]$ | pop A        | empty                        | $\{1\}\{2\}\{3\}\{4\}$ |
| enter | $[5,8]$ | B            | $(3 \to 2, 1)$               | $\{1\}\{2,3\}\{4\}$    |
| leaf  | 5       | none         | same                         | $\{1\}\{2,3\}\{4\}$    |
| enter | $[6,6]$ | C            | $(3 \to 2, 1), (4 \to 2, 2)$ | $\{1\}\{2,3,4\}$       |
| leaf  | 6       | none         | same                         | $\{1\}\{2,3,4\}$       |
| leave | $[6,6]$ | pop C        | $(3 \to 2, 1)$               | $\{1\}\{2,3\}\{4\}$    |
| enter | $[7,8]$ | C            | $(3 \to 2, 1), (4 \to 2, 2)$ | $\{1\}\{2,3,4\}$       |
| leaf  | 7       | none         | same                         | $\{1\}\{2,3,4\}$       |
| leaf  | 8       | none         | same                         | $\{1\}\{2,3,4\}$       |

The right subtree is the interesting one. It does not inherit the merge of A, because A is not on the path to $[5,8]$. The merge of B therefore attaches $3$ to $2$, not to $1$, and the frame records the size of $2$ rather than the size of $1$. The rollback at the end of the left subtree is what makes the two branches independent.

## Formal model

Let $V = \{1, 2, \ldots, n\}$ be the vertex set and let the operations be numbered $1$ through $q$. A **query** at time $t$ asks whether two vertices are connected in the graph $G_t$ formed by the edges alive at time $t$.

::: math definition Definition
An **edge instance** is one execution of an add operation. Two adds of the same unordered pair are different edge instances, because their lifetimes are independent.

The **lifetime** of an edge instance $e$ is a finite set of disjoint inclusive intervals $L(e) = \{ [l_1, r_1], [l_2, r_2], \ldots \}$ with $1 \le l_i \le r_i \le q$. The instance is alive at time $t$ exactly when $t \in [l_i, r_i]$ for some $i$.

The **state graph** at time $t$ is $G_t = (V, E_t)$, where $E_t$ is the set of edge instances alive at $t$.
:::

::: math definition Definition
Let $T$ be the segment tree over the leaf times $1, \ldots, q$. A node's **range** is the interval of leaf times below it. The **canonical decomposition** of an interval $[l, r]$ is the smallest set $D(l, r)$ of nodes whose ranges are pairwise disjoint and whose union is $[l, r]$.

The **bucket** of a node $v$, written $B(v)$, is the set of edge instances stored at $v$. The **path set** of a leaf $t$, written $P(t)$, is the union of the buckets of the nodes on the path from the root to $t$, including $t$ itself.
:::

::: math lemma Lemma
For every time $t$, the path set $P(t)$ is exactly $E_t$.
:::

::: math proof Proof
Fix an edge instance $e$ with lifetime $L(e)$ and a time $t$.

If $t \in L(e)$, then $t$ lies in exactly one interval $[l_i, r_i]$ of $L(e)$. The canonical decomposition of that interval partitions it into node ranges, so exactly one node $v \in D(l_i, r_i)$ has a range containing $t$. That node is an ancestor of leaf $t$, so $e \in B(v) \subseteq P(t)$.

If $t \notin L(e)$, then no interval of $L(e)$ contains $t$. Every node that stores $e$ has a range contained in one of those intervals, so no ancestor of leaf $t$ stores $e$. Therefore $e \notin P(t)$.

Both directions hold for every edge instance, and distinct instances are stored independently, so the path set and $E_t$ are equal as sets of instances. $\square$
:::

::: math lemma Lemma
Suppose a union-find uses union by size and never compresses a path. Let a merge attach child root $c$ under parent root $r$ and record the triple $(c, r, s_0)$, where $s_0$ was the size of $r$ before the merge. Restoring $p(c) = c$ and $s(r) = s_0$ returns the parent and size functions to the state immediately before that merge.
:::

::: math proof Proof
Before the merge, $c$ and $r$ were distinct roots, so $p(c) = c$ and $p(r) = r$. The merge changes exactly two entries: $p(c)$ becomes $r$, and $s(r)$ becomes $s_0 + s(c)$. Every other entry is untouched. Setting the two entries back to their previous values therefore restores the whole state. $\square$
:::

::: math definition Definition
A **checkpoint** is the current length of the history stack. The operation $\operatorname{rollbackTo}(h)$ pops frames until the history length is $h$ again, restoring each frame by the previous lemma.
:::

::: math lemma Lemma
At the moment just before the traversal processes a node $v$, every vertex is its own set or has been merged by an edge stored at a proper ancestor of $v$, and the history contains a frame for each successful merge among those edges.
:::

::: math proof Proof
The proof is an induction on the depth of $v$. The root has no proper ancestor, so every vertex is its own set and the history is empty.

Suppose the claim holds for a node $v$. The traversal records the checkpoint $h$, then merges every edge in $B(v)$. Each successful merge appends one frame; a redundant merge appends nothing. After this step the union-find contains the edges of the ancestors of $v$ and of $v$ itself, which are exactly the edges stored at the proper ancestors of each child of $v$. The history contains a frame for each successful merge among them. The claim therefore holds when the traversal enters either child.

After both children return, the traversal rolls back to $h$. By the rollback lemma, each frame pushed at $v$ is undone, and no frame of an ancestor is touched because $h$ counts all of them. The state returns to the one at entry, which is the state required when the parent continues with its sibling. $\square$
:::

## Algorithm derivation

The algorithm has three phases: read and build the lifetimes, place the intervals in the segment tree, and traverse the tree with the rollback union-find.

1. **Read the operations.** For every add, create a new edge instance and record its start time. If the same unordered pair is added again, that is a second instance with its own start. For every removal, find the instance of that pair that is currently alive, close its interval at $t-1$, and clear its start. At the end of the input, close every interval that is still open at $q$.
2. **Build the segment tree.** The tree covers the leaf times $1$ through $q$. Insert every lifetime interval with the standard recursive range insertion, which stores the interval in the $O(\log q)$ canonical nodes.
3. **Traverse.** At each node, record a checkpoint, merge the node's edges, recurse into the children, and roll back to the checkpoint. At a leaf that holds a query, answer it with a `find` on both endpoints.

```cpp
void add_interval(int node, int lo, int hi, int ql, int qr, int edge) {
    if (qr < lo || hi < ql) return;
    if (ql <= lo && hi <= qr) { bucket[node].push_back(edge); return; }
    int mid = (lo + hi) / 2;
    add_interval(node * 2, lo, mid, ql, qr, edge);
    add_interval(node * 2 + 1, mid + 1, hi, ql, qr, edge);
}

void solve(int node, int lo, int hi) {
    int checkpoint = dsu.checkpoint();
    for (int edge : bucket[node]) dsu.unite(edge_u[edge], edge_v[edge]);
    if (lo == hi) {
        if (op_type[lo] == 2) answer[lo] = dsu.same(op_u[lo], op_v[lo]);
    } else {
        int mid = (lo + hi) / 2;
        solve(node * 2, lo, mid);
        solve(node * 2 + 1, mid + 1, hi);
    }
    dsu.rollback_to(checkpoint);
}
```

The order inside the traversal is not negotiable. The checkpoint is taken before the node's edges are merged. The rollback happens after both children return, never between them. The answer is read at the leaf, after the leaf's own bucket has been merged.

The reference programs in this article are the insert-only specialization. An add at time $t$ opens an interval that ends at $q$, because nothing removes the edge. The general code above is the same shape with a removal operation that closes the interval at $t-1$.

## Step-by-step execution

Use the eight-moment instance from the visual intuition, with vertices $1$ through $4$ and these operations:

| Time | Operation      | Effect             |
| ---- | -------------- | ------------------ |
| 1    | add $(1,2)$    | A starts           |
| 2    | query $(1,2)$  | asks about A       |
| 3    | add $(2,3)$    | B starts           |
| 4    | query $(1,3)$  | asks about A and B |
| 5    | remove $(1,2)$ | A ends at time $4$ |
| 6    | add $(3,4)$    | C starts           |
| 7    | query $(3,4)$  | asks about B and C |
| 8    | query $(1,4)$  | asks about B and C |

The lifetimes are A $[1,4]$, B $[3,8]$, and C $[6,8]$. The buckets are the ones in the previous section: A at $[1,4]$, B at $[3,4]$ and $[5,8]$, C at $[6,6]$ and $[7,8]$.

The traversal visits the leaves in time order, so the answers are produced in the order the queries appear.

| Time | Path edges | Partition before the query | Output   |
| ---- | ---------- | -------------------------- | -------- |
| 2    | A          | $\{1,2\}\{3\}\{4\}$        | YES      |
| 4    | A, B       | $\{1,2,3\}\{4\}$           | YES      |
| 5    | B          | $\{1\}\{2,3\}\{4\}$        | no query |
| 6    | B, C       | $\{1\}\{2,3,4\}$           | no query |
| 7    | B, C       | $\{1\}\{2,3,4\}$           | YES      |
| 8    | B, C       | $\{1\}\{2,3,4\}$           | NO       |

The fifth moment is the one that shows why the offline method is not just a forward sweep. At time $5$, A is gone, so $1$ is isolated even though it was connected to $2$ at time $4$. The right subtree of the segment tree never saw A, because A's interval lies entirely in the left half. The rollback at the end of the left subtree is what removes A before the right subtree begins.

The queries at times $7$ and $8$ share the same path set, so the union-find is built once for both and only the `find` calls differ. That sharing is the economy of the traversal: one path is built for a whole range of leaves, not once per leaf.

## Correctness proof

::: math theorem Theorem
For every query at time $t$, the algorithm reports whether the two queried vertices are connected in $G_t$.
:::

::: math proof Proof
Fix a query at time $t$. By the path-set lemma, the edges stored on the path to leaf $t$ are exactly the edge instances alive at $t$. By the traversal lemma, after the traversal merges the bucket of leaf $t$ it has merged exactly those edges and no others, and its history contains a frame for each successful merge among them.

The union-find therefore represents the connected components of the graph $(V, E_t) = G_t$. Two vertices are connected in that graph exactly when repeated merging has put them in the same set, which is exactly when their representatives are equal. The algorithm answers YES in that case and NO otherwise.

The rollback after the leaf restores the state at the parent, so the answer of one query cannot leak into another. The traversal visits every leaf exactly once, so every query is answered. $\square$
:::

The proof has three independent obligations, and each is discharged by a different part of the design: the segment tree gives the path-set lemma, the rollback gives the traversal lemma, and the union-find gives the connectivity test. A bug in any one of them produces wrong answers, but the failures look different. A wrong interval boundary produces a wrong path set at a few leaves. A missing rollback produces wrong answers in a whole subtree. A wrong union-find frame produces wrong answers after the first undo.

## Complexity analysis

| Method | Time | Space |
| --- | --- | --- |
| Rebuild the graph and run BFS per query | $O(q(n+m))$ | $O(n+m)$ |
| Rebuild the union-find from the alive edges per query | $O(q(n + E\alpha(n)))$ | $O(n)$ |
| Snapshot and copy the arrays per undo | $O(n)$ per undo | $O(n)$ |
| Segment tree over time plus rollback union-find | $O(q\log q\log n)$ | $O(n + q\log q)$ |
| Online dynamic forest with a link-cut tree | $O(q\log n)$ amortized | $O(n)$ |

The offline bound has two layers. An interval is stored in $O(\log q)$ nodes, because each level of the segment tree contributes at most two canonical nodes to a range. With at most $q$ edge instances, the total number of stored copies is $O(q\log q)$. Each copy is merged once during the traversal and undone once. A merge costs two finds, and a find follows at most $\lfloor\log_2 n\rfloor$ parent pointers because the union-find uses union by size without compression. A rollback is a pop and two assignments, so it is $O(1)$.

The space is dominated by the buckets, which hold $O(q\log q)$ edge identifiers. The union-find and its history are $O(n)$ live memory, because a forest on $n$ vertices has at most $n-1$ successful merges on any root-to-leaf path. The answer array is $O(q)$.

At $q = 10^5$, the logarithm is about $17$, so the traversal stores on the order of $1.7 \times 10^6$ copies and performs a few times that many parent-pointer steps. That fits comfortably in a contest time limit. The rebuild baseline performs about $10^{10}$ merges at the same size, which does not.

The online link-cut tree is asymptotically better for a forest, but its constant factor and implementation size are much larger. For a general graph, a fully dynamic connectivity structure is even heavier. The offline method is the right choice whenever the operations are known in advance.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Only insertions, queries online | A plain [disjoint set union](/algorithms/graphs/dsu) with path compression |
| Only insertions, queries offline | A single forward sweep with a plain union-find |
| Insertions and deletions, queries offline | A segment tree over time plus a rollback union-find |
| Insertions and deletions, queries online | A fully dynamic connectivity structure, or a [link-cut tree](/algorithms/trees/dynamic-trees) when the graph is a forest |
| The answer is a component count | A rollback union-find with a counter |
| The answer is bipartiteness | A rollback union-find with a parity to the parent |
| The answer is an aggregate per component | A rollback union-find with counts stored at the roots |
| Every historical version must stay queryable | A persistent union-find, not a rollback one |
| The graph is a forest and edges change | A link-cut tree, or an Euler tour tree |
| A query depends on an earlier answer | Adapt the traversal, or use an online structure |
| The timeline is huge and the queries are few | Divide and conquer over the queries, or a sparse interval tree |

The third row is the canonical combination. The segment tree supplies the nesting, and the rollback structure supplies the undo. Neither is useful without the other in this problem: a segment tree alone cannot maintain the partition, and a rollback union-find alone has no schedule of when to merge.

The fourth row is the limit. The offline method needs the future operations, and an online query sequence does not provide them. A link-cut tree maintains connectivity under edge insertions and deletions when the graph stays a forest, and a fully dynamic connectivity structure is needed for a general graph. Both are much larger than a rollback union-find, and neither answers component-count queries without additional bookkeeping.

## Reference implementations

The manifest publishes one `program` variant in each of the six languages: C, C++17, Java, Python, Pascal and JavaScript. Each program reads the same input and writes the same output, so the six outputs are byte-identical after newline normalization.

The input begins with `n q`. The next `q` lines are operations of three forms:

- `1 u v` adds an undirected edge between $u$ and $v$;
- `2 u v` removes an edge that is currently present;
- `3 u v` asks whether $u$ and $v$ are connected at that moment.

The output is one line per `3` operation, holding `YES` or `NO`. Vertices are numbered from $1$ to $n$.

Because the whole input is read before anything is answered, the programs know the lifetime of every edge instance: a `1` opens it at the current time, a `2` closes it at the previous time, and an edge still alive at the end closes at $q$. Each lifetime is inserted into the segment tree over time. The traversal then carries the rollback union-find, merges the edges that cover the current node, and answers the queries stored at the leaves. A deletion therefore costs nothing beyond closing an interval; the proof obligation is that the rollback restores exactly the state the parent node expects.

The C program uses head and next arrays for the buckets, and the C++ program uses vectors of buckets. The Java program uses `BufferedReader` and a `StringBuilder`. The Python program reads the whole input once. The Pascal program reads one integer per `Read`, uses no `IOResult`, and avoids 128-bit integers, so it compiles under pas2js. The Pascal and JavaScript listings are educational references marked as such at the top of the file; they are not USACO submission languages.

## Recursion decision

The segment tree traversal is recursive, and its depth is $\lceil \log_2 q\rceil$, at most about $20$ for any timeline that fits in memory. That is harmless in every language. The recursion that is dangerous is the one that follows the input rather than the tree: a recursive `find` on a union-find without union by size can follow a chain of $n$ nodes and overflow the stack long before the algorithm produces an answer.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Recursive traversal, iterative find |
| Java | About $10^4$ frames | Recursive traversal, iterative find |
| Python | The interpreter limit of 1000 | Recursive traversal is safe at about $20$ levels; iterative find |
| Pascal | The operating system stack | Recursive traversal, iterative find |
| JavaScript | About $10^4$ frames | Recursive traversal, iterative find |

The rule is general: **recursion is safe when the depth is logarithmic in the input size, and the dangerous recursion is the one whose depth is the input size.** Union by size is what makes the depth of a find logarithmic. If the union-find attached roots arbitrarily, a chain of $n$ merges would make every find linear and a recursive find would overflow.

An iterative traversal with an explicit stack is possible. It needs a state for each node, either "enter" or "exit", and it must record the checkpoint on entry. The recursive version expresses the same order with less bookkeeping, and the depth is small, so the recursive version is the better default.

## Implementation walkthrough

Six decisions decide whether the implementation is correct.

**The time model.** The leaves are the operation times $1$ through $q$. An add at time $t$ opens an interval at $t$. A removal at time $t$ closes the current interval at $t-1$, because the edge is alive before the removal but not after it. At the end of the input, every open interval closes at $q$. Writing these three rules down before coding prevents most off-by-one bugs.

**The interval insertion.** Use the standard recursive range insertion. A node is fully covered when `ql <= lo && hi <= qr`; a node is disjoint when `qr < lo || hi < ql`. An interval decomposes into at most two nodes per level, so the insertion costs $O(\log q)$ and never stores an interval twice on one path.

**The merge frame.** A frame stores the child root, the parent root, and the old size of the parent root. Find both roots before recording anything. If they are equal, the merge is redundant and pushes nothing. If they differ, compare the sizes, swap if necessary, record, and only then change the arrays.

```cpp
struct Frame { int child, root, old_size; };

void unite(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return;                       // nothing to undo
    if (size[ra] < size[rb]) std::swap(ra, rb);
    history.push_back({rb, ra, size[ra]});
    parent[rb] = ra;
    size[ra] += size[rb];
}
```

**The checkpoint.** The checkpoint is the history length at entry. A node may perform zero merges, so the exit routine cannot pop a fixed number of frames. It pops until the length returns to the checkpoint. This also makes a redundant merge safe: it contributed no frame, so there is nothing extra to pop.

```cpp
void rollback_to(int checkpoint) {
    while ((int)history.size() > checkpoint) {
        Frame f = history.back();
        history.pop_back();
        parent[f.child] = f.child;
        size[f.root] = f.old_size;
    }
}
```

**The traversal order.** Merge the node's edges, then recurse into the left child, then recurse into the right child, then roll back. The rollback must not happen between the children. A node's edges are needed by both subtrees, so removing them after the left child answers the right child with a graph that is missing edges.

**The output order.** Answers are read at the leaves, and the leaves are visited in increasing time. Store each answer in an array indexed by time and print the array in order at the end. Printing from inside the traversal is also correct, because the visit order is the time order, but a buffered array avoids a flush per query.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Treating a removal as another merge | The edge stays alive, and later queries report false connections | Close the interval at $t-1$ on removal |
| Forgetting to close open intervals at the end | Edges that are never removed are missing from the tree | Close every open interval at $q$ after reading |
| Starting an interval at the removal time | The edge is alive during the wrong window | Record the start when the add is read |
| Rolling back before the second child | The right subtree is missing every edge of the current node | Roll back after both children return |
| Enabling path compression | Compressed pointers survive a rollback and join components that should be separate | Never compress in a rollback union-find |
| Recording the input endpoints instead of the roots | The rollback restores the wrong parent entries | Find both roots first, then record them |
| Restoring the parent but not the size | The next union by size chooses the wrong root, and later depths grow | Store the old size of the root that grew |
| Clearing the union-find between nodes | The ancestor edges disappear, and the leaf graph is wrong | Use a checkpoint and roll back only the current node |
| Storing an interval in every leaf it covers | The storage becomes $O(q^2)$ | Store it in the canonical nodes |
| Using the simple interval fill when answers are adaptive | The future colors or intervals are not known in advance | Schedule intervals during the traversal |

### Why this fails: the removal that is treated as a merge

The plausible wrong approach is to read the operations with a plain union-find and to treat every operation as a merge, because the graph "only grows" in the easy version. A removal is then either ignored or passed to `unite`, and the edge remains connected forever.

The smallest counterexample has two vertices and three operations. Write the removal as operation type `3`, the generalization described in the reference section:

```text
2 3
1 1 2
3 1 2
2 1 2
```

The correct answer is `NO`: the edge is added at time $1$, removed at time $2$, and the query at time $3$ sees an empty graph. A program that ignores the removal, or that merges the endpoints again when it sees the removal, reports `YES`.

One add and one query are not enough to expose the bug, because the edge is still alive at the query. The removal has to happen between the add and the query. The bug is silent in every test that only inserts edges. If the program is the insert-only reference from this article, the removal operation is not in its input at all, which is why the article is explicit about the specialization.

The second failure in the same area is the premature rollback. Take two vertices and three operations:

```text
2 3
1 1 2
2 1 2
2 1 2
```

Both queries should answer `YES`. A traversal that rolls back after the left leaf, or that treats the leaf as a complete node and pops its bucket before visiting the sibling, answers the second query `NO`. The edge was stored at an ancestor of both leaves, and the early pop removed it from the path. One edge and two queries are enough to expose this.

The third failure is specific to the adaptive variant. If the future lifetime of an edge depends on the answer to a query that has not been processed yet, precomputing all intervals assumes an answer that may be wrong. The smallest instance is a graph with one edge, two colors, and one repaint query that would create an odd cycle; a program that assumes the repaint is accepted schedules the edge in the wrong color and reports the wrong bipartiteness afterward. The fix is not a better interval boundary but a different schedule: fill the tree during the traversal, as the Painting Edges problem does.

The lesson is general: **the segment tree is only as correct as the lifetimes it stores, and a lifetime is only known when every operation that changes it is known.**

## Variants and extensions

- **A component counter.** Keep the number of components in the union-find. A successful merge decreases it by one, and a rollback increases it by one. The leaf answer is the counter directly, which turns the structure into an offline component-count oracle.
- **A parity union-find.** Store each vertex's color parity to its parent. A merge aligns the parities, and a merge inside one component detects an odd cycle when the two endpoints already have the same color. This answers bipartiteness queries after every update.
- **Per-component aggregates.** Store counts at the roots and maintain a global sum of the aggregate. When two roots merge, subtract their old contributions and add the new one. The Extending Set of Points problem uses counts of x-coordinates and y-coordinates this way.
- **Adaptive interval scheduling.** When the future lifetime depends on an answer, fill the segment tree during the traversal. At a leaf, the edge's next change is known from the input, so the new interval can be inserted after the query is answered. Each query schedules one interval, so the complexity stays $O(q\log q\log n)$.
- **Divide and conquer over the queries.** Instead of building a full segment tree in advance, recurse over the query range. At a node, insert the edges that are common to the whole range, recurse, and roll back. This uses less memory when the number of queries is much smaller than the number of operations, and it is the same nesting principle.
- **Sqrt decomposition over time.** Rebuild the graph every $B$ operations and handle the recent operations separately. It is simpler than a segment tree and is competitive when the updates are cheap and the queries are few, but its worst case is worse.
- **A link-cut tree.** When the graph stays a forest, a dynamic tree maintains connectivity under edge insertions and deletions in amortized logarithmic time. A general graph needs a fully dynamic connectivity structure instead. Both are much heavier than a rollback union-find and are the right answer only when the online requirement is real.
- **A persistent union-find.** When every historical version must remain queryable in arbitrary order, persistence keeps the old arrays instead of undoing changes. It costs $O(\log n)$ space per change and is a different technique.
- **A segment tree over values.** The same push-and-pop pattern works for a value domain rather than time: merge intervals on the way down, undo them on the way back, and answer at the leaves. The axis changes; the nesting does not.

## Contest strategy

1. Decide whether the problem is offline. If an answer is needed before the next operation is known, or if a query's result changes the future graph, the simple interval fill does not apply.
2. Choose the timeline. Every event is a time, and every query is answered at a leaf. If the statement asks for the state before the first event, add a leaf for that moment.
3. Build the lifetimes. Map each unordered pair to the start of its currently alive instance. On a removal, close the interval at $t-1$. At the end, close every open interval at $q$.
4. Choose the union-find payload. Connectivity needs only the parent array. A component count needs a counter. Bipartiteness needs a parity. An aggregate needs counts at the roots and a running total.
5. Estimate the memory before writing the tree. Each interval produces $O(\log q)$ copies, so the buckets hold $O(q\log q)$ integers. At $q = 2 \times 10^5$ that is a few million entries, which is comfortable in C++ and Java but needs care in Python and JavaScript.
6. Write the rollback union-find with union by size and no compression. Add the checkpoint and the rollback-to-checkpoint pair before writing the traversal.
7. Test against the naive rebuild on random small inputs. Include self-loops, duplicate edges, a query before any edge, a removal immediately after an add, and a long run of additions with no query.
8. Check the output order against the input order. A traversal that answers at the leaves is in time order, but a program that collects answers by edge or by component is not.

## Worked problems

### Problem 1: components under insertions and deletions

**Restatement.** There are $n$ vertices and $m$ initial edges. A sequence of $k$ events creates an edge or removes an existing edge. Before the first event and after every event, report the number of connected components.

**Naive baseline.** Rebuild the graph and run a breadth-first search after every event, which costs $O(k(n+m))$.

**Insight.** Every edge is alive during an interval of time. The initial edges start at the beginning of the timeline, a created edge starts at its event, a removed edge ends just before its removal, and every edge that survives to the end closes at the final moment. The leaves are the $k+1$ moments at which the answer is required.

**Derivation.** Read all events. Maintain, for every unordered pair, the start of its current alive interval. Initialize the initial edges at the first moment. On a creation, start the new edge at the event time. On a removal, close the interval at the moment just before the event. At the end, close every open interval. Insert all intervals into the segment tree over the $k+1$ moments, traverse it with a rollback union-find that carries a component counter, and print the counter at every leaf.

**Correctness.** At a leaf, the path contains exactly the edges alive at that moment, so the union-find represents the graph of that moment. The counter starts at $n$ and decreases by one for every successful merge, so it equals the number of connected components. The rollback restores the counter with the partition.

**Complexity.** $O((m+k)\log k\log n)$ time and $O(n + (m+k)\log k)$ space.

**Common wrong approach.** Forgetting the answer before the first event, which produces $k$ outputs instead of $k+1$, or closing a removed edge's interval at the event time instead of the moment before it.

### Problem 2: bipartiteness after every toggle

**Restatement.** An undirected graph on $n$ vertices starts empty. Each of $q$ queries names a pair of vertices; if the edge is absent it is added, and if it is present it is removed. After every query, report whether the graph is bipartite.

**Naive baseline.** Rebuild the graph after every query and test bipartiteness with a breadth-first search, which costs $O(q(n+q))$.

**Insight.** The toggles are known in advance, so each maximal run during which an edge is present becomes one interval. Bipartiteness is a connectivity property with parity: a graph is bipartite exactly when no component contains an odd cycle.

**Derivation.** Read all queries and build the intervals with a map from an unordered pair to its start time. Use a rollback union-find that stores a parity bit for each vertex relative to its parent. A merge between different components aligns the parities. A merge inside one component preserves bipartiteness exactly when the two endpoints have opposite parities; otherwise it creates an odd cycle. Keep a count of the components that currently contain an odd cycle, and answer YES at a leaf when the count is zero.

**Correctness.** The parity union-find maintains a valid two-coloring of every component as long as no odd cycle is inserted. An edge whose endpoints already have the same parity closes an odd cycle, and no other edge can do so. The path set at a leaf is the current graph, so the count is the number of odd-cycle components in that graph.

**Complexity.** $O(q\log q\log n)$ time and $O(n + q\log q)$ space.

**Common wrong approach.** Using a plain union-find without parity, which reports connectivity but not bipartiteness, or enabling path compression, which makes the rollback restore a stale parity.

### Problem 3: the size of a closure of points

**Restatement.** A set of points in the plane starts empty. Each query toggles one point. After every query, report the size of the closure obtained by repeatedly adding the fourth corner of every axis-aligned rectangle whose other three corners are present.

**Naive baseline.** Recompute the closure from scratch after every query, which costs at least $O(q^2)$ in the worst case.

**Insight.** Build a bipartite graph with one vertex for each distinct x-coordinate and one for each distinct y-coordinate, and one edge for each point. Completing rectangles is exactly the operation of making every connected component a complete bipartite graph. After the closure, a component with $a$ x-vertices and $b$ y-vertices contains all $a \cdot b$ possible points.

**Derivation.** Read all queries and turn each point into the intervals between a toggle that inserts it and the next toggle that erases it. Compress the x-coordinates and the y-coordinates into two disjoint ranges of vertex identifiers. Build the segment tree over time. In the rollback union-find, store at every root the number of x-vertices and the number of y-vertices in its component, and maintain the sum of their products over all roots. When two roots merge, subtract the two old products and add the new one. Undo the same arithmetic on rollback.

**Correctness.** The closure of a point set is the union of the complete bipartite graphs on the connected components of the x-y graph. A component with $a$ x-vertices and $b$ y-vertices therefore contributes exactly $a \cdot b$ points, and the running sum counts them all. The path set at a leaf is the current point set, so the leaf answer is the size of its closure.

**Complexity.** $O(q\log q\log n)$ time and $O(n + q\log q)$ space, where $n$ is the number of distinct coordinates.

**Common wrong approach.** Counting the points in the component instead of the distinct coordinates, which misses the points that the closure adds, or forgetting to restore the running total on rollback.

## Practice progression

1. **Recognition.** Given a statement, decide whether the operations are online or offline, whether the graph changes in both directions, and whether the answer is connectivity, a count, or a parity.
2. **Direct application.** Implement the insert-only reference, build the segment tree, and check the answers against a forward union-find. The two must agree on every input with no removals.
3. **Adaptation.** Add removals by closing intervals. Compare against a naive rebuild on random small inputs, including duplicate edges, self-loops, and queries before any edge.
4. **Payload.** Add a component counter, then a parity, then per-component counts with a running total. Check each against a brute-force recomputation.
5. **Combination.** Solve the bipartite checking and point closure problems. Measure the number of stored interval copies and the peak memory.
6. **Challenge.** Implement the adaptive scheduling of the painting problem, where the next interval is inserted at a leaf after the query is answered. Then solve the same problem with divide and conquer over the queries, without an explicit segment tree, and compare the two.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four parts of the key insight, and which obstacle does each remove? (Key insight)
2. Why does the path set of a leaf equal the set of edges alive at that time? (Formal model)
3. State the rollback lemma and prove it. (Formal model)
4. What is a checkpoint, and why can a node not pop a fixed number of frames? (Algorithm derivation)
5. Trace the eight-moment example through the right subtree. Why is B attached to 2 rather than to 1? (Visual intuition)
6. What is the cost of one interval insertion, and how many copies does an interval produce? (Complexity analysis)
7. Why is the offline method faster than rebuilding the union-find from the alive edges per query? (Complexity analysis)
8. What happens if the rollback is performed before the right child? (Common mistakes)
9. Why is path compression incompatible with rollback? (Common mistakes)
10. When does the simple interval fill fail, and what replaces it? (Variants and extensions)

## Further reading

- The union-find that this technique extends is in [the disjoint set union](/algorithms/graphs/dsu).
- The undo structure that makes the traversal possible is in [the rollback disjoint set union](/algorithms/advanced/rollback-dsu).
- The segment tree that supplies the timeline is in [the segment tree](/algorithms/range-queries/segment-tree).
- The offline recursion that shares work across queries is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The parity test that the bipartite variant performs is in [the two-coloring test for a bipartite graph](/algorithms/graphs/bipartite-two-coloring).
- The breadth-first search used as the brute-force baseline is in [breadth-first search](/algorithms/graphs/bfs).
- The online alternative for fully dynamic forests is in [dynamic trees](/algorithms/trees/dynamic-trees).
- The persistence idea that a persistent union-find uses is illustrated by [the persistent segment tree](/algorithms/range-queries/persistent-segment-tree).
- The subject index lists this technique beside the other offline methods in [the advanced algorithms](/algorithms/advanced/).
- The direct component-count problem is [Dynamic Connectivity](https://cses.fi/problemset/task/2133) on CSES.
- The parity problem is [Bipartite Checking](https://codeforces.com/problemset/problem/813/F) on Codeforces.
- The aggregate problem is [Extending Set of Points](https://codeforces.com/problemset/problem/1140/F) on Codeforces.
- The adaptive problem is [Painting Edges](https://codeforces.com/problemset/problem/576/E) on Codeforces.
