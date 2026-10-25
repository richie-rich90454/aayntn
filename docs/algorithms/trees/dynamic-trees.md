---
id: trees.dynamic-trees
title: Dynamic trees
summary: A link-cut tree stores the preferred paths of a forest in splay trees, so that links, cuts, and path aggregates cost amortized logarithmic time.
division: [platinum]
subjects: [trees]
level: advanced
importance: advanced-technique
keywords:
    [
        dynamic trees,
        link-cut tree,
        preferred path,
        splay tree,
        makeroot,
        access,
        dynamic forest,
        path sum,
    ]
prerequisites:
    required: [trees.lca, foundations.complexity]
    recommended:
        [trees.heavy-light-decomposition, range-queries.segment-tree, foundations.complexity]
complexity:
    time: "O(log n) amortized per operation"
    space: "O(n)"
assumptions:
    - The structure is a forest at every step, so every link joins two different trees.
    - The operations arrive online and are links, cuts, or path aggregates.
    - A path query names two vertices that lie in the same tree.
implementations: trees.dynamic-trees
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/trees.dynamic-trees.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

A **link-cut tree** maintains a forest while edges are inserted and removed. It does not store the forest directly. Instead, it chooses at every vertex at most one **preferred child**, and the preferred edges form vertex-disjoint **preferred paths**. Each preferred path is stored in a splay tree whose in-order is the path from its highest vertex to its lowest.

The central operation is **access**: it walks from a vertex to the root of its tree and makes the entire walk one preferred path. With access in hand, the other operations are short. Rerooting a tree is one access followed by a lazy reversal of the exposed path. A link adds one path-parent edge between two roots. A cut exposes the edge and removes it. A path query reroots one endpoint, accesses the other, and reads the aggregate stored at the root of the splay tree.

The cost is amortized $O(\log n)$ per operation and $O(n)$ memory. The logarithm is amortized, not worst case: a single access can touch a linear number of preferred paths, but the splay potential pays for the sequence.

## Problem motivation

A rail network is a forest of $n$ stations. Track is laid and lifted during maintenance, and the dispatcher repeatedly asks for the total number of passengers on the route between two stations.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ stations.
- $1 \le q \le 200\,000$ operations, each of which links two stations, cuts a track, or queries a path.
- The graph is always a forest, so a path exists exactly when the two stations are in the same tree.
- The operations arrive online; the answer to a query is needed before the next operation is read.

A path query can be answered by walking from both endpoints to their lowest common ancestor, which costs $O(n)$ on a chain. A link or a cut can be handled in constant time with adjacency sets, but then the walk is the bottleneck: $O(nq)$ is $4 \cdot 10^{10}$ steps.

The static tool for path aggregates is heavy-light decomposition, which answers a query in $O(\log n)$ after an $O(n)$ build. It is useless here because every link or cut changes the subtree sizes that define the heavy child. Rebuilding the decomposition after each structural operation costs $O(n)$ per operation, which is no better than the walk.

The problem is the mismatch between a structure that changes and a decomposition that is computed once. The decomposition has to become part of the update, not a preprocessing step.

## Recognition patterns

A link-cut tree is the right tool when all of the following hold.

- The structure is a **forest**, and edges are **inserted or removed** between queries.
- The queries ask about a **path**: its sum, its maximum, its length, or a composition along it.
- The queries arrive **online**, so an offline sweep cannot reorder them.
- The path query must be answered in **logarithmic amortized time**, and $n$ or $q$ is around $10^5$ or more.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The tree never changes | Heavy-light decomposition or binary lifting is simpler |
| Only connectivity is asked, and all operations are known in advance | A segment tree over time with a rollback disjoint set union |
| Only edge insertions, and only connectivity | A plain disjoint set union |
| The graph is not a forest | A link-cut tree maintains trees; general dynamic connectivity needs a different structure |
| Subtree aggregates under link and cut | A link-cut tree with virtual subtrees, or a top tree |
| The path aggregate is not commutative | A link-cut tree that stores both directions of the aggregate |
| $q \le 2000$ | Rebuilding a static structure after every operation is often fast enough |

The phrases in a statement that signal the technique are "the tree is updated", "add an edge between $u$ and $v$", "remove the edge between $u$ and $v$", and "while the graph remains a tree". The phrase that rules it out is "the tree is given", which points at the static techniques.

<Synonyms terms="link-cut tree, dynamic tree, preferred path, top tree" />

## Naive approach

The baseline keeps an adjacency set for every vertex and answers a path query with a breadth-first search.

```python
def path_sum_naive(source, target, adjacency, value):
    parent = {source: -1}
    queue = [source]
    for x in queue:
        if x == target:
            break
        for y in adjacency[x]:
            if y not in parent:
                parent[y] = x
                queue.append(y)
    total = 0
    x = target
    while x != -1:
        total += value[x]
        x = parent[x]
    return total
```

This is $O(n)$ per query and $O(n)$ memory. It is correct, and it is the reference implementation for a differential test.

The second baseline rebuilds a heavy-light decomposition after every link or cut. The rebuild is $O(n)$, and the query is $O(\log n)$, so the total is $O(nq)$ in the worst case. The constant is worse than the walk, and the code is longer.

The third baseline is offline. If every operation is known in advance, a segment tree over time and a rollback disjoint set union can answer connectivity in $O(\log q)$ per check. That does not answer path sums, because a rollback structure cannot aggregate values along a path without another layer.

The fourth baseline is a square-root decomposition: rebuild a static structure every $B$ operations and handle the last $B$ edges separately. It is a legitimate fallback, but the per-query cost has an extra factor and the implementation is delicate when cuts and links mix.

## Key insight

The insight is to make the decomposition follow the queries instead of the input. At any moment, mark at most one child of every vertex as **preferred**. The preferred edges form disjoint paths, and each path is stored in a balanced binary search tree keyed by depth.

The operation **access(x)** changes which child is preferred along the path from the root to $x$. It walks upward from $x$. At each vertex $y$ on the walk, it splays $y$ inside its path, detaches the old preferred child by replacing the right subtree, and attaches the path that was built in the previous step. After the loop, the entire root-to-$x$ path is one splay tree, and $x$ is its root.

Once the path is a splay tree, a path aggregate is a single value at its root. The remaining operations are consequences.

- **Reroot.** Access $x$, then reverse the exposed path lazily. Reversing the in-order of a path exchanges its top and bottom, so $x$ becomes the root of the represented tree.
- **Link.** Reroot $x$, then make $x$ a path-parent child of $y$. The edge $x$-$y$ is added; if the two vertices were already connected, the operation would create a cycle and is ignored.
- **Cut.** Reroot $x$, access $y$. The exposed splay tree is exactly the $x$-to-$y$ path. The edge exists precisely when $x$ is the direct predecessor of $y$, which is visible as `left[y] == x` and `right[x] == 0`. Removing that link removes exactly one edge.
- **Find root.** Access $x$ and walk to the leftmost vertex of its splay tree. That vertex is the root of the represented tree.

The amortized logarithm comes from the splay tree. A splay operation is amortized $O(\log n)$, and the preferred-path changes performed by access are charged to the same potential. The details are in the complexity section.

## Visual intuition

Draw the forest with the root at the top. Draw preferred edges as solid and the remaining edges as dashed. The solid edges form the preferred paths. Each solid path is one splay tree, drawn as a balanced binary tree beside the path; its in-order is the path from top to bottom.

An access is a change of mind about which child is preferred. Starting at $x$, the walk moves upward, turns the old preferred child of each visited vertex into a dashed edge, and turns the edge to the path just built into a solid one. The dashed edges are not forgotten: each one is a path-parent pointer from the top of a splay tree to its parent in the represented tree.

Rerooting is a reversal of the solid path from the old root to $x$. Picture the path as a list and read it backward. The dashed edges attached to its vertices do not move, because only the order inside the path changes.

The shape of the splay trees is irrelevant to the represented forest. Rotations change the tree but not the in-order, and the in-order is the path. This is the invariant to keep in mind while reading the code: a rotation is a local rearrangement of the same sequence.

No interactive laboratory is published for this technique, because the interesting state is the pair of structures, the forest and the splay forest, and the repository's player draws one graph at a time.

## Formal model

Let $F$ be a forest on the vertex set $V$, with one distinguished root per tree. The root is not fixed by the input; it is whatever the current sequence of links and reroots has made it.

::: math definition Definition
A **preferred child** of a vertex is either none or one of its children. A **preferred edge** joins a vertex to its preferred child. The preferred edges form vertex-disjoint **preferred paths**. The **auxiliary tree** of a preferred path is a splay tree whose in-order lists the path from its highest vertex to its lowest.
:::

::: math definition Definition
Every vertex has one `parent` pointer. If the vertex is an auxiliary child, the pointer is its splay parent. If it is the root of an auxiliary tree, the pointer is its **path-parent**, the parent of the top of the path in the represented forest. The two cases are distinguished by `is_aux_root`: a vertex is an auxiliary root when it is not a child of its parent in the splay tree.
:::

::: math definition Definition
Every vertex stores a `value`, a lazy `reversed` flag, and an **aggregate** of its auxiliary subtree. For a commutative aggregate such as a sum,

$$
\operatorname{total}(x) \;=\; \operatorname{total}(\operatorname{left}(x)) + \operatorname{total}(\operatorname{right}(x)) + \operatorname{value}(x).
$$

For an ordered aggregate, the node stores the composition from left to right and the composition from right to left, and a reversal swaps the two.
:::

::: math definition Definition
The operations of the structure are `link(x, y)`, `cut(x, y)`, `path(x, y)`, `make_root(x)`, `find_root(x)`, and `access(x)`. A `path` query returns the aggregate of the vertices on the unique path between $x$ and $y$, endpoints included.
:::

::: math lemma Lemma
The in-order of every auxiliary tree is a downward path in the represented forest, and the path-parent pointers connect the tops of those paths according to the represented edges.
:::

::: math lemma Lemma
After `access(x)`, the auxiliary tree that contains $x$ is exactly the path from the root of the represented tree to $x$, in that order.
:::

::: math lemma Lemma
After `make_root(x)`, the represented tree is unchanged as an undirected graph, and $x$ is its root.
:::

::: math lemma Lemma
After `make_root(x)` and `access(y)`, the edge $x$-$y$ exists if and only if `left[y] == x` and `right[x] == 0`.
:::

## Algorithm derivation

The state is six arrays indexed by a vertex: `left`, `right`, `parent`, `reversed`, `value`, and `total`.

The first primitive is the test that separates an auxiliary child from a path-parent child.

```python
def is_aux_root(x):
    p = parent[x]
    return p == 0 or (left[p] != x and right[p] != x)
```

The second primitive recomputes the aggregate after a structural change.

```python
def pull(x):
    total[x] = total[left[x]] + total[right[x]] + value[x]
```

The third primitive propagates one lazy reversal.

```python
def apply_reverse(x):
    if x == 0:
        return
    left[x], right[x] = right[x], left[x]
    reversed[x] ^= 1

def push(x):
    if reversed[x]:
        apply_reverse(left[x])
        apply_reverse(right[x])
        reversed[x] = 0
```

Before any splay, every reversal on the path from the auxiliary root to the target must be pushed down. A loop collects the path in an explicit stack and then pops it.

```python
def push_path(x):
    stack.clear()
    y = x
    stack.append(y)
    while not is_aux_root(y):
        y = parent[y]
        stack.append(y)
    while stack:
        push(stack.pop())
```

A rotation is the usual splay rotation, with one extra obligation: the subtree that changes parents must have its `parent` pointer updated, and both the old and the new root must be pulled.

```python
def rotate(x):
    y = parent[x]
    z = parent[y]
    x_is_right = right[y] == x
    middle = left[x] if x_is_right else right[x]
    if not is_aux_root(y):
        if left[z] == y:
            left[z] = x
        else:
            right[z] = x
    parent[x] = z
    if x_is_right:
        left[x] = y
        right[y] = middle
    else:
        right[x] = y
        left[y] = middle
    if middle:
        parent[middle] = y
    parent[y] = x
    pull(y)
    pull(x)
```

Splay pushes the path first, then performs the zig-zig or zig-zag rotations until $x$ is an auxiliary root.

The heart of the structure is access. The variable `last` is the auxiliary root of the path that has just been built below the current vertex. Splaying $y$ makes $y$ the root of its auxiliary tree; replacing the right subtree detaches the old preferred child and attaches the new path, whose top is exactly the next vertex on the root-to-$x$ walk.

```python
def access(x):
    last = 0
    y = x
    while y:
        splay(y)
        right[y] = last
        pull(y)
        last = y
        y = parent[y]
    splay(x)
```

The other operations are now one or two lines each.

```python
def make_root(x):
    access(x)
    apply_reverse(x)

def find_root(x):
    access(x)
    while True:
        push(x)
        if left[x] == 0:
            break
        x = left[x]
    splay(x)
    return x

def link(x, y):
    make_root(x)
    if find_root(y) != x:
        parent[x] = y

def cut(x, y):
    make_root(x)
    access(y)
    if left[y] == x and right[x] == 0:
        left[y] = 0
        parent[x] = 0
        pull(y)

def path_sum(x, y):
    make_root(x)
    access(y)
    return total[y]
```

The link is guarded by `find_root`. Without the guard, a link inside one tree would create a cycle, and the represented structure would no longer be a forest. The cut is guarded by the adjacency test, because removing `left[y]` on a longer path would detach a whole suffix instead of one edge.

::: math invariant Invariant
During one access, before the iteration that processes $y$, the auxiliary tree rooted at `last` has in-order equal to the part of the root-to-$x$ walk from the child of $y$ down to $x$, and the parent pointer of `last` is $y$. For the first iteration that part is empty and `last` is the null node.
:::

## Step-by-step execution

Take five vertices, initially isolated, each carrying the value of its label plus one: $1, 2, 3, 4, 5$.

The operations are:

```
link 0 1
link 1 2
link 2 3
path 0 3
cut 1 2
path 0 1
link 1 4
link 2 4
path 0 3
```

The following table traces the represented forest and the answer. The splay shapes are not shown because they depend on the rotation order; only the preferred paths matter for the result.

| Operation  | Represented edges | Path exposed by the last access | Answer           |
| ---------- | ----------------- | ------------------------------- | ---------------- |
| `link 0 1` | $0-1$             | none                            |                  |
| `link 1 2` | $2-1-0$           | none                            |                  |
| `link 2 3` | $3-2-1-0$         | none                            |                  |
| `path 0 3` | $3-2-1-0$         | $0-1-2-3$                       | $1+2+3+4 = 10$   |
| `cut 1 2`  | $0-1$, $2-3$      | $1-2$                           |                  |
| `path 0 1` | $0-1$, $2-3$      | $0-1$                           | $1+2 = 3$        |
| `link 1 4` | $0-1-4$, $2-3$    | none                            |                  |
| `link 2 4` | $0-1-4-2-3$       | none                            |                  |
| `path 0 3` | $0-1-4-2-3$       | $0-1-4-2-3$                     | $1+2+5+3+4 = 15$ |

The first query is worth following in detail.

1. `make_root(0)` accesses $0$. The represented tree is rooted at $3$, so access exposes the path $3-2-1-0$, and the reversal makes $0$ the root with the path $0-1-2-3$. No edge changes; only the orientation changes.
2. `access(3)` splays $3$, then walks to $2$, $1$, and $0$. At each step the old preferred child is replaced by the path just built. At the end, one auxiliary tree holds $0-1-2-3$ in that in-order, and $3$ is its splay root.
3. The total at $3$ is $1+2+3+4 = 10$.

The cut is the delicate step. `make_root(1)` makes $1$ the root, so the tree becomes $1$ with children $0$ and $2$, and $2$ has child $3$. `access(2)` exposes the path $1-2$. The in-order predecessor of $2$ is $1$, so `left[2] == 1` and `right[1] == 0`. Removing the left child of $2$ and clearing the parent of $1$ cuts exactly the edge $1-2$. The two components are $\{0,1\}$ and $\{2,3\}$.

After the two links through vertex $4$, the represented forest is the chain $0-1-4-2-3$, and the final query exposes it as one splay tree. The answer is the sum of all five labels plus one.

## Correctness proof

::: math theorem Theorem
Every operation of the link-cut tree preserves the forest and produces the documented result: `access(x)` exposes the root-to-$x$ path, `make_root(x)` makes $x$ the root, `link` and `cut` add and remove exactly one edge, `find_root(x)` returns the root of the represented tree, and `path_sum(x, y)` returns the sum of the values on the $x$-to-$y$ path.
:::

::: math proof Proof
The proof is by induction over the sequence of primitive operations. The invariant is that every auxiliary tree is a downward path in the represented forest, that its in-order is that path, and that every path-parent pointer is a represented edge.

A rotation preserves the in-order of the auxiliary tree. A splay is a sequence of rotations, so it preserves the in-order and only changes the shape. The push of a lazy reversal swaps the children of a node and marks them; when the reversal reaches the leaves, the in-order of the whole auxiliary tree is reversed, which is exactly the reverse of the path.

Consider one iteration of access at vertex $y$. Before it, the auxiliary tree rooted at `last` is the preferred path from the child of $y$ on the root-to-$x$ walk down to $x$. Splaying $y$ makes $y$ the root of its auxiliary tree. The old right subtree of $y$ is the part of $y$'s preferred path below $y$; replacing it with `last` detaches that part and attaches the new path. The detached subtree keeps $y$ as its path-parent, which is a represented edge, so the forest is unchanged. After the replacement, the in-order of the auxiliary tree rooted at $y$ is the old preferred path from its top down to $y$, followed by the path from the child of $y$ down to $x$. That is the preferred path from the old top down to $x$, and the parent pointer of $y$ is the path-parent of that old top, which is exactly the next vertex on the root-to-$x$ walk. The invariant of the loop therefore holds after every iteration. When the walk reaches the null path-parent, the last auxiliary tree contains the whole root-to-$x$ path. The final splay makes $x$ its root.

For `make_root(x)`, access has just made the root-to-$x$ path one auxiliary tree. Reversing its in-order changes the orientation of exactly that path and leaves every edge in place, so the undirected tree is unchanged and $x$ is now the highest vertex, that is, the root.

For `find_root(x)`, the root of the represented tree is the highest vertex on the root-to-$x$ path, which is the leftmost vertex of the auxiliary tree after access. The loop pushes lazy reversals before reading a left child, so it follows the true in-order and stops at the leftmost vertex. The final splay restores the auxiliary invariants.

For `link(x, y)`, `make_root(x)` makes $x$ the root of its tree. If `find_root(y)` is $x$, the two vertices are already in one tree and the link is correctly ignored. Otherwise, setting the path-parent of $x$ to $y$ adds exactly the edge $x$-$y$ and joins two trees, so the result is still a forest.

For `cut(x, y)`, `make_root(x)` makes $x$ the root and `access(y)` exposes the $x$-to-$y$ path. If the edge $x$-$y$ exists, $x$ is the in-order predecessor of $y$ and has no right child, because there is no vertex between them on the path. If the test passes, the left subtree of $y$ rooted at $x$ contains no vertex after $x$, so $x$ is the only vertex before $y$ on the exposed path and the path is exactly the edge $x$-$y$. Removing the left child of $y$ and clearing the parent of $x$ therefore removes exactly that edge. If the edge does not exist, at least one of the two conditions fails and nothing changes.

For `path_sum(x, y)`, `make_root(x)` makes $x$ the root and `access(y)` exposes the path from $x$ to $y$. The aggregate at $y$ is the sum of the whole auxiliary tree, which is the sum of the path, endpoints included. The lazy reversals only change the order, and a sum is invariant under order.

Every operation either changes no edge, adds one edge between two different trees, or removes one existing edge. The forest invariant is therefore preserved. $\square$
:::

::: math proof Proof
The aggregate invariant is maintained by `pull` after every change to a child pointer. A rotation changes only the two nodes whose children change, and both are pulled. Access pulls every vertex whose right child is replaced. A lazy reversal does not change a sum, and for an ordered aggregate it swaps the two stored directions. Therefore every stored total equals the aggregate of its auxiliary subtree.
:::

## Complexity analysis

**Splay: $O(\log n)$ amortized.** A splay tree with $n$ nodes has the standard potential bound; a sequence of splays costs $O((n + m) \log n)$ for $m$ operations.

**Access: $O(\log n)$ amortized.** The loop visits one vertex per preferred path on the root-to-$x$ walk. The standard link-cut analysis charges a preferred-path change to the same potential that pays for the splay, and the total over a sequence is $O((n + q) \log n)$.

**Each public operation: $O(\log n)$ amortized.** A link is a reroot, a find-root, and one pointer assignment. A cut is a reroot and an access. A path query is a reroot and an access. Each of these is a constant number of accesses.

**Space: $O(n)$.** There are six arrays of $n + 1$ entries and one explicit stack of $n + 1$ entries. No auxiliary tree node is allocated separately.

::: math complexity Complexity
A link-cut tree over a forest of $n$ vertices supports link, cut, find-root, reroot, and path aggregate in $O(\log n)$ amortized time per operation, with $O(n)$ memory.
:::

The amortized bound is not a worst-case bound. One access can walk through $\Theta(n)$ preferred paths, and one splay can be $\Theta(n)$ deep. A single operation on an adversarial sequence can therefore cost linear time; the bound is on the whole sequence. This is the same trade-off as any splay-based structure, and it is why the constant factor is small in practice.

The values matter. A path sum over $n = 200\,000$ vertices with values up to $10^9$ needs $2 \cdot 10^{14}$, which fits a signed 64-bit integer. The reference programs use `long long`, `long`, `Int64`, or a Python integer, and JavaScript numbers are exact below $2^{53}$, which covers the sum of at most $n$ labels for any realistic $n$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| A static tree, path sums | Heavy-light decomposition with a segment tree, or prefix sums |
| A static tree, ancestor or distance queries | Binary lifting |
| Edge insertions only, connectivity only | Disjoint set union |
| Offline fully dynamic connectivity | Segment tree over time with a rollback disjoint set union |
| Online forest, link, cut, and path aggregate | Link-cut tree |
| Online forest, subtree aggregates | Link-cut tree with virtual subtrees, or a top tree |
| General graph, dynamic connectivity | The Holm–de Lichtenberg–Thorup structure, or an offline rollback structure |
| Only the root of a dynamic tree | A link-cut tree, or an Euler tour tree with a designated root |
| A path aggregate that is not commutative | Link-cut tree with forward and reverse aggregates |
| A tree of maximum degree two, that is, a chain | An ordered set of breakpoints, or a link-cut tree |
| Very small $n$ or very few operations | Rebuild a static structure after every update |

The table is a decision procedure, not a list of equivalents. A link-cut tree is the only entry that combines arbitrary links, arbitrary cuts, and path aggregates online. If any one of those three requirements disappears, a simpler structure usually wins.

The top tree is the general answer for subtree aggregates, but it is substantially harder to implement. A link-cut tree with virtual subtree sizes is enough for many contest problems, and it is the version described in the extensions below.

## Reference implementations

The six implementations are linked above, with the language, the recommendation, the verification status, and the raw source.

The manifest publishes one `program` variant per language. Every program reads `n q`, then $q$ operations. A line is `link u v`, `cut u v`, or `path u v`, with 0-based vertices. The forest starts with $n$ isolated vertices. Vertex $v$ carries the value $v + 1$, so a path query prints the sum of the 1-based labels of the vertices on the path. The input guarantees that links join different trees, that cuts remove existing edges, and that a path query names two vertices in the same tree; the programs also ignore a link inside one tree and a cut of a missing edge.

The six programs produce byte-identical output. The C program switches standard output to binary mode so that the line feed is not translated on Windows. The Pascal program reads one operation per line, because the pas2js console unit supplies `ReadLn` for strings but not `Read` for strings; the other five programs split the whole input on whitespace. That is the only input-format difference, and it does not change the accepted language.

No `minimal` variant is published. The reusable core is the set of six arrays and the seven procedures; wrapping them in a class would hide the pointer discipline that the article is trying to teach. The program variants are short enough to read as the reference.

## Recursion decision

Every routine in the reference implementation is iterative.

The two places where recursion is tempting are the splay and the descent to the leftmost vertex in `find_root`. Both would recurse to the height of an auxiliary tree, which can be $n$ in the worst case. The splay is written as a loop over rotations, and `find_root` is written as a loop over left children. The lazy reversals are pushed with an explicit stack whose size is at most $n$.

| Place recursion is tempting | What the recursion would cost | What the reference does |
| --- | --- | --- |
| `splay` | An auxiliary tree can be a chain of $n$ nodes | A loop over rotations |
| `find_root` | The left spine can be $n$ nodes | A loop with `push` before each step |
| Building the forest | There is no build phase; the forest starts empty | One link per edge |
| A debugging traversal | The represented tree can be a chain | An explicit queue or stack in the test harness |

The languages differ in where the recursion would fail, but not in whether it would fail. C and C++ overflow the call stack, Java throws `StackOverflowError`, Python raises `RecursionError` at the interpreter limit, Pascal exhausts the platform stack, and JavaScript throws `RangeError`. The iterative version has none of these failure modes and is not longer.

The explicit stack in `push_path` is allocated once, with $n + 1$ entries. It is reused by every splay, so the splay loop performs no allocation. This matters in Java and JavaScript, where an allocation per splay would dominate the running time.

## Implementation walkthrough

The first decision is the indexing. The programs map the 0-based input vertex $v$ to the internal vertex $v + 1$, and use index $0$ as the null node. The null node has value $0$, total $0$, and no children. This removes every boundary test from the hot loops: `total[left[x]]` is safe when the child is $0$, and `parent[0]` is never read as a real vertex.

The second decision is the layout. All six arrays have $n + 1$ entries: `left`, `right`, `parent`, `reversed`, `value`, and `total`. A struct per node would add an indirection to every rotation. The flat arrays also make the C and C++ versions cache-friendly and the Pascal and Java versions straightforward to allocate.

The third decision is the meaning of `parent`. It is one pointer with two jobs, and `is_aux_root` is the only place that distinguishes them.

```cpp
bool is_aux_root(int x) {
    int p = parent[x];
    return p == 0 || (left[p] != x && right[p] != x);
}
```

A vertex is an auxiliary root exactly when it is not a child of its parent in the splay tree. In that case its parent pointer is a path-parent, which is a real edge of the represented forest. In the other case it is a splay parent, which is not an edge of the represented forest. Confusing the two is the single most common source of wrong answers.

The fourth decision is the order inside `access`. Splay $y$, replace the right child with `last`, pull $y$, set `last = y`, and only then move to `parent[y]`. The parent pointer must be read after the splay but before it is overwritten by anything else; in this order it is the path-parent of the auxiliary root $y$, which is the next vertex on the walk.

The fifth decision is the cut test.

```cpp
void cut(int x, int y) {
    make_root(x);
    access(y);
    if (left[y] == x && right[x] == 0) {
        left[y] = 0;
        parent[x] = 0;
        pull(y);
    }
}
```

`make_root(x)` is what makes the exposed path start at $x$ rather than at the old root. After the access, $x$ is the leftmost vertex of the exposed path. `left[y] == x` says that $x$ is the root of the left subtree of $y$, which places $x$ before $y$ but does not yet prove that nothing lies between them. `right[x] == 0` says that $x$ has no successor in that subtree, so the only vertex before $y$ is $x$ itself, which makes $x$ the immediate predecessor. Both conditions are necessary. The first alone holds in some non-adjacent configurations, and the second alone says nothing about which edge is being removed.

The sixth decision is the numeric type. `value` and `total` are 64-bit in C, C++, Java, and Pascal. Python integers are arbitrary precision. JavaScript numbers are doubles, and the reference program relies on the exact integer range below $2^{53}$; a path sum of $n$ labels is far below that for any input that fits in memory. If a future variant supports values up to $10^{18}$, JavaScript would need `BigInt`.

The seventh decision is input and output. The C, C++, Java, Python, and JavaScript versions tokenize the whole input and are indifferent to line breaks. The Pascal version reads the first line for `n` and `q`, then one line per operation, because of the limitations of the pas2js console unit. The output is one line per path query, with a trailing line feed, so the six outputs compare byte for byte.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Treating every `parent` pointer as a represented parent | Rotations move vertices through edges that do not exist | Use `is_aux_root` and the two-case meaning |
| Forgetting `push` before descending in `find_root` | A lazy reversal makes the left child stale, so the wrong vertex is returned | Push at every step of the descent |
| Forgetting the final `splay(x)` in `access` | The aggregate is read at a vertex that is not the auxiliary root | End access with `splay(x)` |
| Cutting without `make_root(x)` | The exposed path starts at the old root, so the test can fail and the edge remains | Always reroot the first endpoint |
| Cutting without the adjacency test | A whole suffix of the path is detached instead of one edge | Require `left[y] == x` and `right[x] == 0` |
| Linking two vertices in one tree | The represented structure gets a cycle | Reroot and compare `find_root(y)` with $x$ |
| Storing only one direction of a non-commutative aggregate | The answer for $u$ to $v$ is the answer for $v$ to $u$ | Store forward and reverse, and swap them on reversal |
| Using index $0$ as a real vertex | The null node is confused with vertex $0$ | Map input $v$ to $v + 1$ and keep $0$ null |
| Recomputing the total before the children are updated | The aggregate is stale after the next rotation | Pull after every child change, bottom-up |
| Recursing in splay or find-root | A stack overflow on a chain | Use loops and the explicit stack |
| Assuming a single access is worst-case logarithmic | An adversarial sequence can make one access linear | Quote the amortized bound, not a per-operation worst case |

### Why this fails: the cut that removes nothing

The most instructive failure is a cut that silently does nothing. Build the chain with `link 0 1` and `link 1 2`. The represented root is $2$, because each link reroots the first endpoint before attaching it. Now call `cut(0, 1)` without the `make_root(0)` step.

`access(1)` exposes the path from the current root to $1$, which is $2-1$. The vertex $0$ is below $1$ and is not on that path, so `left[1]` cannot be $0$; the test fails, the function returns without changing anything, and the edge $0-1$ is still there. The next `path 0 2` still returns $1+2+3 = 6$, and `find_root(0)` still reports the same root as `find_root(2)`. After the requested cut the two vertices are in different trees, so the correct structure has no path between $0$ and $2$ at all.

Two vertices is the smallest chain on which this happens. The bug is invisible in a test that only checks that the program does not crash. It is caught by a differential test against the naive forest, which is why the reference implementation for the test harness is a breadth-first walk.

The second version of the same failure is the cut that removes too much. Take the tree with edges $0-1$, $0-2$, and $1-3$, build it with links in that order, and call `cut(3, 0)`, which is not an edge. A defensive program should leave the tree alone. After `make_root(3)` and `access(0)`, the exposed path is $3-1-0$. A splay may leave `left[0] == 3` with `right[3] == 1`, because $3$ is the root of the left subtree but not the immediate predecessor of $0$. A version that omits the `right[3] == 0` condition sees `left[0] == 3`, detaches that whole left subtree, and clears the parent of $3$. The edge that actually disappears is $1-0$, not $3-0$: the components become $\{3,1\}$ and $\{0,2\}$, and `find_root(3)` and `find_root(2)` now differ even though the requested cut named a non-edge.

Four vertices is the smallest tree on which this version fails. The repair is the same for both versions: check both conditions, and treat a failed check as a no-op.

The generalization is short: **the cut test is a statement about adjacency, and adjacency is exactly "no vertex lies between the endpoints in the exposed path".** The left-subtree test alone does not express it, because the root of a left subtree can be far from the root's predecessor.

## Variants and extensions

- **Edge values.** Split every edge into a vertex that carries the edge value and connect it to both endpoints. A path query through edges becomes a vertex path query on the subdivided tree. This is the standard way to maintain a dynamic minimum spanning tree.
- **Subtree aggregates.** Keep a virtual contribution for the dashed children of every vertex and update it in `access` when the right child changes. The total then covers the whole represented subtree, not only the preferred path. This is the version needed for subtree sums under link and cut.
- **Ordered aggregates.** Store the composition from left to right and from right to left, and swap the two in `apply_reverse`. Every non-commutative monoid, such as a linear function or a string hash, needs this.
- **Path updates.** Add a lazy value to every vertex of a path. The same lazy machinery as a segment tree applies, with the splay tree as the underlying array.
- **Dynamic minimum spanning tree.** Maintain a spanning forest with a link-cut tree keyed by the maximum edge on a path. A new edge that closes a cycle replaces the maximum edge if it is shorter.
- **Dynamic connectivity.** A link-cut tree answers connectivity on a forest by comparing `find_root`. General graphs need a fully dynamic connectivity structure such as Holm–de Lichtenberg–Thorup, because an edge insertion can create a cycle that a tree cannot represent.
- **LCA in a dynamic tree.** Access $x$, then access $y$; the last vertex where the second access leaves the root-to-$y$ path is the lowest common ancestor.
- **Top trees.** A top tree is the general cluster-based structure that supports path and subtree aggregates, and it subsumes the link-cut tree. It is the right next step after this article, not a replacement for it.
- **Euler tour trees.** A balanced tree over the Euler tour of each component supports link, cut, and connectivity in logarithmic time, and is simpler when no path aggregate is needed.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. **Classify the problem first.** If the tree is static, use heavy-light decomposition or binary lifting. If the operations are offline, consider a rollback disjoint set union. Only a genuinely online sequence of links, cuts, and path aggregates needs a link-cut tree.
2. **Write the core once.** The order is `is_aux_root`, `pull`, `apply_reverse`, `push`, `push_path`, `rotate`, `splay`, `access`, `make_root`, `find_root`, `link`, `cut`. Test each against a small hand-built example before adding the input loop.
3. **Fix the indexing.** Use $1..n$ internally and reserve $0$ for null. Convert at the input boundary, once, and never again.
4. **Guard the structural operations.** A link inside one tree and a cut of a missing edge should be no-ops, not silent corruption. In a contest whose input guarantees validity, the guards cost one extra access and remove a class of infinite loops.
5. **Test the four shapes.** A single vertex, a chain, a star, and two trees joined and split repeatedly. The single vertex catches the null-node confusion. The chain catches stack and depth bugs. The star catches path-parent mistakes. The join-split sequence catches stale aggregates.
6. **Differential-test against the naive forest.** Generate random valid operations, answer them with a breadth-first walk, and compare. The generator must respect the forest invariant: link only across components, cut only existing edges, and query only within one component.
7. **Measure the constant.** A link-cut tree has a large constant. If $n$ and $q$ are small, rebuilding a static structure may be faster. If they are large, the splay loop is the hot spot, and a flat array layout is worth the extra code.
8. **Quote the right complexity.** Say amortized $O(\log n)$, and do not imply that a single operation has a worst-case bound of the same order.

## Worked problems

### Problem 1: a dynamic tree with path sums

**Restatement.** A tree of $n$ vertices is given with a value on every vertex. Each query either deletes an edge and adds another, changes one vertex value, or asks for the sum of the values on the path between two vertices. Constraints: $1 \le n, q \le 200\,000$, values up to $10^9$, and the graph is always a tree.

**Naive baseline.** Rebuild a heavy-light decomposition after every edge replacement, or walk the path with a breadth-first search. Both are $O(n)$ per operation.

**Insight.** The tree changes, but the path is still a path. A link-cut tree exposes it as one splay tree, and the sum is one value at the root of that splay tree.

**Derivation.** For a rewiring query, cut the old edge and link the new one. For a vertex update, splay the vertex, change its value, and pull. For a path query, reroot one endpoint and access the other.

**Correctness.** The exposed auxiliary tree is exactly the queried path, and its stored total is the sum of the values on it. The cut and link change exactly the named edges by the adjacency test and the root comparison.

**Complexity.** $O(\log n)$ amortized per operation and $O(n)$ memory.

**Common wrong approach.** Rebuilding the decomposition after each query. It is correct but too slow, and it hides the fact that the hard part is the update, not the query.

### Problem 2: a dynamic tree with an ordered path aggregate

**Restatement.** Every vertex holds a linear function $f_v(x) = a_v x + b_v$ modulo $998244353$. A query replaces an edge, sets one function, or asks for the composition of the functions on the path from $u$ to $v$, applied in that order to a given $x$. Constraints: $1 \le n, q \le 200\,000$.

**Naive baseline.** Walk the path from $u$ to $v$ and compose the functions one at a time, which is $O(n)$ per query.

**Insight.** Composition is associative but not commutative, so the splay node must know both directions. A reversal swaps them, exactly as it swaps the children.

**Derivation.** Store `forward` and `backward` compositions at every node. `pull` combines the left child, the node, and the right child for `forward`, and the reverse order for `backward`. `apply_reverse` swaps the two aggregates along with the children. A path query reroots $u$, accesses $v$, and evaluates `forward` at $v$.

**Correctness.** The in-order of the exposed splay tree is the path from $u$ to $v$. The forward aggregate composes in that order. The lazy reversal preserves the composition because it swaps the stored directions at every node it touches.

**Complexity.** $O(\log n)$ amortized per operation, with a constant factor about twice the sum version.

**Common wrong approach.** Storing only the sum or only the forward composition. The answer for $u$ to $v$ is then the answer for $v$ to $u$, which is wrong as soon as two functions do not commute.

### Problem 3: the minimum bottleneck odd paving

**Restatement.** Edges are added to an empty graph on $n$ vertices, one at a time, each with a length. After each addition, find the smallest possible maximum edge length of a subgraph in which every vertex has odd degree, or report that none exists. Constraints: $n \le 100\,000$ and $m \le 300\,000$.

**Naive baseline.** Run Kruskal from scratch after every insertion, which is $O(m \log m)$ per query.

**Insight.** A connected graph has an odd paving exactly when it has an even number of vertices, because the degree sum of the paved subgraph must be even and a spanning tree can be pruned from the leaves to realize any even component. The cheapest maximum edge is therefore the largest edge of a minimum spanning forest after trimming the longest removable edges.

**Derivation.** Maintain the minimum spanning forest of the inserted edges. An edge that closes a cycle replaces the longest edge on that cycle if it is shorter; a link-cut tree with edge nodes answers the maximum edge on the path and performs the replacement. After each insertion, remove the longest forest edge whose removal leaves both resulting components even, and stop when no such edge exists. The answer is the longest remaining edge, or $-1$ if some component is odd.

**Correctness.** The parity lemma reduces the paving condition to even component sizes. The minimum spanning forest minimizes the maximum edge for every threshold, and the trimming removes exactly the edges that are not needed to keep the components even. The link-cut tree maintains the forest under the replacements, so each step sees the true current forest.

**Complexity.** $O(m \log n)$ amortized, because each edge is inserted once and removed at most once, and every structural step is a constant number of link-cut operations.

**Common wrong approach.** Maintaining only connectivity with a disjoint set union. It cannot find the longest edge on the cycle, so it cannot decide which edge to replace, and it cannot support the removals.

## Practice progression

1. **Recognition.** Given a statement, decide whether the tree is static or dynamic, and whether the queries are online. Write one sentence justifying the choice.
2. **Direct application.** Implement the six arrays and the seven procedures. Answer path sums on a forest built by links only, then add cuts.
3. **Verification.** Write the breadth-first baseline and a random generator that respects the forest invariant. Compare on thousands of small cases before trusting the structure.
4. **Adaptation.** Replace the sum with a maximum, then with a linear function composition. Notice that the maximum needs no change to the reversal, while the composition needs two aggregates.
5. **Combination.** Add edge nodes and solve a dynamic minimum spanning tree. Add virtual subtrees and answer subtree sums under link and cut.
6. **Transfer.** Use the same access routine for a dynamic LCA, for a path update, and for a connectivity check. Read a top tree description and identify which parts of the link-cut tree it generalizes.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does one auxiliary tree represent, and what is its in-order? (Formal model)
2. What are the two meanings of a `parent` pointer, and how does `is_aux_root` distinguish them? (Implementation walkthrough)
3. What does `access(x)` do to the preferred paths on the root-to-$x$ walk? (Key insight)
4. Why does `make_root(x)` reverse the exposed path, and why does that not change the tree? (Correctness proof)
5. What are the two conditions in the cut test, and what does each one rule out? (Why this fails)
6. Why must `push` run before descending to the leftmost vertex in `find_root`? (Recursion decision and common mistakes)
7. Why is the complexity amortized rather than worst case? (Complexity analysis)
8. What changes when the path aggregate is not commutative? (Variants and extensions)
9. How are edge values represented, and why is a vertex value not enough? (Variants and extensions)
10. When is a link-cut tree the wrong tool even though the tree changes? (Algorithm selection)

## Further reading

- The static path technique that a link-cut tree generalizes is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The ancestry technique that answers the static version of many of these queries is [lowest common ancestor](/algorithms/trees/lca).
- The tree-to-array technique that supports subtree queries without structural changes is [Euler tour for trees](/algorithms/trees/euler-tour).
- The array structure whose lazy propagation the splay tree borrows is the [segment tree](/algorithms/range-queries/segment-tree).
- The connectivity structure that handles the offline or insertion-only cases is [disjoint set union](/algorithms/graphs/dsu).
- The traversal used by the differential test is [depth-first search](/algorithms/graphs/dfs), and its iterative form is what keeps the test harness safe on a chain.
- Every listing in this article, in all six languages, is published in the reference implementations of this repository, in six languages each.
