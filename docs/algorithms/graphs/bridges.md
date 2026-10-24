---
id: graphs.bridges
title: Bridges
summary: The edges whose removal disconnects an undirected graph, found in one depth-first search by asking whether a subtree can reach back to its parent.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords:
    [
        bridge,
        cut edge,
        low link,
        lowlink,
        biconnected components,
        edge-biconnected components,
        bridge tree,
    ]
prerequisites:
    required: [graphs.representation, graphs.dfs]
    recommended: [graphs.bfs, graphs.dsu]
complexity:
    time: "O(V + E)"
    space: "O(V)"
assumptions:
    - The graph is undirected, and the answer is computed independently for every connected component.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find the edges whose removal increases the number of connected components |
| **Time** | $O(V + E)$ |
| **Auxiliary space** | $O(V)$ beyond the adjacency list |
| **Requires** | One depth-first search and a low-link value per vertex |
| **Fails when** | The comparison is `>=` instead of `>` |
| **Primary technique** | Asking whether a subtree has a route back to its parent that avoids the tree edge |
| **Related** | Articulation points, edge-biconnected components, the bridge tree, minimum cuts |

A bridge is an edge that carries the entire connectivity of its graph. Remove it and the graph comes apart. Everything else in this article is machinery for answering that question in one linear pass.

## Problem motivation

A fiber network operator has $n$ junction stations joined by $m$ undirected links. A link is a **single point of failure** if losing it splits the network into pieces that can no longer talk to each other.

The constraints are what make this a graph problem:

- $1 \le n \le 200\,000$ stations and $0 \le m \le 400\,000$ links.
- For each link, the operator must decide whether its failure disconnects the network.
- The operator must also report the connected components that remain when a link fails.

A link that disconnects the network is called a **bridge**, and it is also called a cut edge.

The phrase "splits the network into pieces" is the definition, and it is structurally identical to the [articulation point](/algorithms/graphs/articulation-points) question, with the word "vertex" replaced by "edge". The two are computed from the same depth-first traversal, with the same low-link values, and they differ in exactly one place: one comparison character.

That last sentence is the whole article in miniature, and it is also the trap. The two tests are `low[child] >= disc[parent]` for vertices and `low[child] > disc[parent]` for edges, and mixing them up is the most common error in this family. The reason for the difference is the subject of the key insight below.

## Recognition patterns

Bridges are the right tool when all of the following hold.

- The problem asks what happens when **one edge is removed** or **one link fails**.
- The graph is **undirected**. The rule depends on every non-tree edge pointing back at an ancestor, which is only true in an undirected graph.
- The answer is a **set of edges**, or a **count**.
- The graph is **static** while the question is answered.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 2 \cdot 10^5$, $m \le 4 \cdot 10^5$ | One depth-first search is comfortable; an adjacency matrix is not |
| The graph is directed | Rules this technique out; the directed analogue needs a different machinery |
| $n \le 10^3$ and the graph is dense | A per-edge reachability check also works, but costs $O(E(V + E))$ |
| Only the number of bridges is wanted | One search still gives it; build nothing else |
| The graph is a tree | Every edge is a bridge, and the answer is all of them |
| The graph is a simple cycle | No edge is a bridge, and the answer is empty |
| The graph has parallel edges | The parent edge must be skipped by identity, not by vertex label |

Two phrases in a statement are reliable signals. "If this road is closed", "single point of failure", and "which connections are critical" all point here. "The cheapest route from A to B" points away, because that question is about a distance and not about a set.

<Synonyms terms="bridge, cut edge, critical edge, low link, lowlink, edge-biconnected component, bridge tree, 2-edge-connected" />

## Naive approach

The baseline is to remove each edge and count the connected components of what is left.

```python
def is_bridge(graph, u, v):
    seen = [False] * len(graph)
    seen[v] = True
    stack = [v]
    reached = 0
    while stack:
        x = stack.pop()
        reached += 1
        for y in graph[x]:
            if not seen[y]:
                seen[y] = True
                stack.append(y)
    return reached < len(graph) - 1
```

This is $O(V + E)$ per edge, so $O(E(V + E))$ in total. At the maximum constraints, with $m = 400\,000$ and $V = 200\,000$, that is on the order of $10^{11}$ operations. Far too slow.

The second baseline is to search for a cycle through each edge: an edge is a bridge exactly when it lies on no cycle. Finding a cycle through every edge costs $O(V(V + E))$ in the straightforward version, which is worse.

The third baseline is to compute the number of components before and after the removal using a disjoint set union with deletions. A disjoint set union cannot delete, so the baseline has to rebuild the structure per edge, which is the same $O(E(V + E))$ cost.

All three baselines rebuild information that a single traversal already produces.

## Key insight

The insight is that an edge is a bridge exactly when it lies on no cycle, and a depth-first search already knows whether a subtree can get back to its parent.

Start with the cycle characterization. An edge $e$ lies on a cycle if and only if there is a path from one endpoint of $e$ to the other that does not use $e$. If such a path exists, then removing $e$ leaves the endpoints connected, and since $e$ was part of a cycle, the rest of the graph is unaffected: $e$ is not a bridge. If no such path exists, then $e$ is the **only** way across the partition it induces, and removing it disconnects the graph.

Now take the depth-first search tree. Every edge is either a tree edge or a non-tree edge.

- A **non-tree edge** is never a bridge. The tree already contains a path between its two endpoints, and the non-tree edge together with that path forms a cycle.
- A **tree edge** from a parent $v$ to its child $u$ is a bridge exactly when the subtree of $u$ has no route back to $v$ or to anything above $v$ that avoids the tree edge.

The low link measures exactly that last condition. Recall that $\text{low}[u]$ is the smallest discovery time reachable from the subtree of $u$ by descending tree edges and then taking at most one back edge.

There are two cases:

- If $\text{low}[u] < \text{disc}[v]$, then the subtree of $u$ reaches a **strict ancestor** of $v$ without going through $v$. That route survives the removal of the edge $\{v, u\}$, so the edge is not a bridge.
- If $\text{low}[u] = \text{disc}[v]$, then the subtree of $u$ reaches $v$ itself, but by a back edge that is **not** the tree edge $\{v, u\}$. The tree edge is therefore still redundant: the back edge provides an alternative route from $u$ to $v$, so the edge is not a bridge.
- If $\text{low}[u] > \text{disc}[v]$, then the subtree of $u$ reaches neither $v$ nor anything above it. The tree edge is the only route, and it is a bridge.

So the test is $\text{low}[u] > \text{disc}[v]$, with a **strict** inequality.

This is exactly where the bridge test differs from the [articulation point](/algorithms/graphs/articulation-points) test. For a vertex, the subtree may reach the vertex itself and still be cut off when the vertex is removed, so the condition is $\ge$. For an edge, reaching the parent by any other route means the edge is redundant, so the condition is $>$. One character, and the two answers are different objects.

## Formal model

Let $G = (V, E)$ be an undirected graph.

::: math definition Definition
An edge $e \in E$ is a **bridge** of $G$ if the number of connected components of $G - e$ is strictly greater than the number of connected components of $G$. It is also called a cut edge.
:::

::: math definition Definition
An edge $e$ is a **bridge** if and only if it lies on no cycle. More precisely, $G - e$ has more components than $G$ exactly when there is no path in $G - e$ between the two endpoints of $e$.
:::

::: math definition Definition
Fix a depth-first search of $G$. The **discovery time** $\text{disc}[v]$ is the counter value when $v$ is first visited. The **low link** $\text{low}[v]$ is the smallest discovery time reachable from $v$ by descending tree edges and then taking at most one back edge, where a back edge joins a vertex to one of its proper ancestors.
:::

::: math definition Definition
An **edge-biconnected component** is a maximal set of edges such that any two of them lie on a common cycle. Contracting every edge-biconnected component of a connected graph into a single vertex produces a tree, called the **bridge tree**, and its edges are exactly the bridges of the original graph.
:::

::: math lemma Lemma
Let $\{v, u\}$ be a tree edge of the search, with $u$ a child of $v$. Then $\{v, u\}$ is a bridge if and only if $\text{low}[u] > \text{disc}[v]$.
:::

::: math lemma Lemma
No non-tree edge of the search is a bridge.
:::

::: math lemma Lemma
Let $G$ be connected with at least three vertices. If an edge $\{u, v\}$ is a bridge, then $u$ and $v$ are both articulation points of $G$. The converse does not hold.
:::

## Algorithm derivation

The state is the same as for [articulation points](/algorithms/graphs/articulation-points): discovery times, low links, and a flag per edge.

The update rule for the low link is unchanged. The test is what changes.

```text
on entering a vertex v:
    disc[v] = low[v] = counter++
    for each neighbor w of v:
        if w is the parent of v:            # skip the tree edge itself
            continue
        if w is unvisited:
            dfs(w)
            low[v] = min(low[v], low[w])
            if low[w] > disc[v]:           # the tree edge {v, w} is a bridge
                mark {v, w} as a bridge
        else if disc[w] < disc[v]:         # a back edge to an ancestor
            low[v] = min(low[v], disc[w])
```

The update is correct because the three sources of a smaller low value are exhaustive, exactly as in the articulation point algorithm: the vertex itself, a descendant subtree, or a single back edge.

The test is taken on the return from the child, because only then is $\text{low}[w]$ final. Taking it before the recursive call would compare an unfinished value.

::: math invariant Invariant
When the search leaves a vertex $v$, $\text{low}[v]$ is the smallest discovery time reachable from $v$ by descending tree edges and taking at most one back edge, and every edge on the path from $v$ to the root of the search tree has already been tested for being a bridge.
:::

::: math invariant Invariant
At every moment of the search, the set of marked bridges is exactly the set of bridges of the subgraph induced by the vertices visited so far, restricted to the edges of that subgraph.
:::

## Step-by-step execution

Take the undirected graph on vertices $0,1,2,3,4,5$ with edges $0-1$, $0-2$, $1-3$, $1-4$, $2-3$, $3-5$. The adjacency lists, in the order the edges were read, are $0: (1,2)$, $1: (0,3,4)$, $2: (0,3)$, $3: (1,2,5)$, $4: (1)$, $5: (3)$.

The search starts at vertex $0$.

1. Enter $0$. $\text{disc}[0] = 0$, $\text{low}[0] = 0$.
2. Enter $1$ from $0$. $\text{disc}[1] = 1$, $\text{low}[1] = 1$. The edge $\{0, 1\}$ is a tree edge.
3. At $1$, the neighbor $0$ is the parent and is skipped. Enter $3$ from $1$. $\text{disc}[3] = 2$, $\text{low}[3] = 2$. The edge $\{1, 3\}$ is a tree edge.
4. At $3$, the neighbor $1$ is the parent and is skipped. Enter $2$ from $3$. $\text{disc}[2] = 3$, $\text{low}[2] = 3$. The edge $\{3, 2\}$ is a tree edge.
5. At $2$, the neighbor $0$ is visited, is not the parent, and $\text{disc}[0] = 0 < \text{disc}[2] = 3$, so it is a back edge and $\text{low}[2] \gets 0$. The neighbor $3$ is the parent and is skipped. Leave $2$.
6. Return to $3$. Set $\text{low}[3] \gets \min(2, \text{low}[2] = 0) = 0$. Test the tree edge $\{3, 2\}$: is $\text{low}[2] = 0 > \text{disc}[3] = 2$? No. So $\{3, 2\}$ is **not** a bridge, which is right: the cycle $0 - 1 - 3 - 2 - 0$ contains it.
7. At $3$, enter $5$ from $3$. $\text{disc}[5] = 4$, $\text{low}[5] = 4$. Leave $5$. Return to $3$ and set $\text{low}[3] \gets \min(0, 4) = 0$. Test the tree edge $\{3, 5\}$: is $\text{low}[5] = 4 > \text{disc}[3] = 2$? Yes. So $\{3, 5\}$ **is a bridge**: vertex $5$ is a leaf.
8. Leave $3$. Return to $1$ and set $\text{low}[1] \gets \min(1, \text{low}[3] = 0) = 0$. Test the tree edge $\{1, 3\}$: is $\text{low}[3] = 0 > \text{disc}[1] = 1$? No. So $\{1, 3\}$ is **not** a bridge; it lies on the same cycle.
9. At $1$, enter $4$ from $1$. $\text{disc}[4] = 5$, $\text{low}[4] = 5$. Leave $4$. Return to $1$ and set $\text{low}[1] \gets \min(0, 5) = 0$. Test the tree edge $\{1, 4\}$: is $\text{low}[4] = 5 > \text{disc}[1] = 1$? Yes. So $\{1, 4\}$ **is a bridge**.
10. Leave $1$. Return to $0$ and set $\text{low}[0] \gets \min(0, 0) = 0$. Test the tree edge $\{0, 1\}$: is $\text{low}[1] = 0 > \text{disc}[0] = 0$? No. So $\{0, 1\}$ is **not** a bridge; it lies on the cycle $0 - 1 - 3 - 2 - 0$.
11. At $0$, the neighbor $2$ is visited, is not the parent, and $\text{disc}[2] = 3 > \text{disc}[0] = 0$, so it is a descendant and the edge is ignored. It is the non-tree edge of the cycle, and by the lemma it cannot be a bridge.

The bridges are $\{3, 5\}$ and $\{1, 4\}$. The non-tree edge $\{2, 0\}$ was never tested, and correctly so.

Now add the component $6 - 7 - 8$. The outer loop restarts the search at $6$ and the discovery times continue from $6$. The tree edges are $6 \to 7$ and $7 \to 8$, with $\text{low}[7] = 7$ and $\text{low}[8] = 8$. The test for $\{6, 7\}$ gives $7 > 6$, and the test for $\{7, 8\}$ gives $8 > 7$, so both are bridges. The bridge tree of this component is the path $\{6\} - \{7\} - \{8\}$.

## Correctness proof

::: math theorem Theorem
The algorithm marks exactly the bridges of the graph.
:::

::: math proof Proof
First, the low link. We show that when the search leaves a vertex $v$, $\text{low}[v]$ is the smallest discovery time reachable from $v$ by descending tree edges and then taking at most one back edge. On entry the algorithm sets $\text{low}[v] = \text{disc}[v]$, which is correct because $v$ itself is reachable with no edges at all. On return from a child $u$, the algorithm sets $\text{low}[v] \gets \min(\text{low}[v], \text{low}[u])$, which accounts for every vertex in the subtree of $u$; by induction on the depth this is correct for every child. The algorithm also folds in $\text{disc}[w]$ for every back edge $(v, w)$. Every path of the required shape out of $v$ starts with either a tree edge to a child or a back edge out of $v$, and there are no other ways out of the subtree in an undirected graph, so the value is final and correct. $\square$

Now a tree edge $\{v, u\}$ with $u$ a child of $v$. Suppose first that $\text{low}[u] > \text{disc}[v]$. Then no vertex of the subtree of $u$ is adjacent to $v$ or to any ancestor of $v$, because such a vertex would have discovery time at most $\text{disc}[v]$ and would lower the low link. Since every edge leaving the subtree of $u$ in an undirected graph goes to an ancestor of $u$, and the only such edges are the tree edge $\{v, u\}$ and back edges, removing $\{v, u\}$ separates the subtree of $u$ from the rest of the graph. So $\{v, u\}$ is a bridge.

Suppose instead that $\text{low}[u] \le \text{disc}[v]$. Then there is a vertex $w$ in the subtree of $u$ with $\text{disc}[w] \le \text{disc}[v]$ and an edge $\{w, z\}$ where $z$ is an ancestor of $v$, with $z \ne v$ in the first case and $z = v$ in the second. Then $w$ and $u$ are joined by a path inside the subtree of $u$, and the edge $\{w, z\}$ is not the tree edge $\{v, u\}$. So the endpoints of $\{v, u\}$ are still joined after $\{v, u\}$ is removed, and $\{v, u\}$ is not a bridge.

Finally, a non-tree edge $\{u, w\}$: the search tree already contains a path between $u$ and $w$, so the edge together with that path forms a cycle, and by the cycle characterization the edge is not a bridge. The algorithm never marks such an edge, which is correct.

The outer loop visits every vertex, so every tree edge of every search tree is tested exactly once, and the result is the set of all bridges. $\square$
:::

## Complexity analysis

**Time: $O(V + E)$.** Each vertex is entered once and left once, and each incident edge is examined at most twice. The bridge test itself costs $O(1)$ per tree edge, so it adds $O(V)$ operations.

**Auxiliary space: $O(V)$** beyond the adjacency list, for the discovery times, the low links, the flags, and either the recursion stack or an explicit stack of the same size.

::: math complexity Complexity
Bridges in an undirected graph with $V$ vertices and $E$ edges: time $O(V + E)$, auxiliary space $O(V)$ beyond the adjacency list. The edge biconnected components and the bridge tree are extracted from the same traversal at no extra asymptotic cost.
:::

The bridge answer and the [articulation point](/algorithms/graphs/articulation-points) answer cost exactly the same, which is the practical reason to compute both in one traversal whenever a statement mentions either. A problem that asks "which stations and which links are critical" is one search, not two.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Edges whose removal disconnects an undirected graph | Bridges, by the low-link rule |
| Vertices whose removal disconnects an undirected graph | [Articulation points](/algorithms/graphs/articulation-points) |
| Maximal edge-biconnected subgraphs | The same traversal, contracting the non-bridge edges |
| The structure of the bridges themselves | The bridge tree, obtained by contracting the components |
| Minimum number of edges whose removal disconnects the graph | A minimum cut, by [max-flow min-cut](/algorithms/graphs/minimum-cut) |
| Minimum number of vertices whose removal disconnects the graph | A flow network with vertex splitting |
| Which vertices are reachable from a source | A plain traversal |
| Edges that lie on no cycle in a directed graph | A different problem, needing dominators or a flow computation |
| A graph that is already a tree | Every edge is a bridge, with no computation at all |

The relation between articulation points and bridges is worth stating in one sentence. In a connected graph with at least three vertices, a bridge has articulation points at both of its endpoints, but an articulation point need not have a bridge at all. Two triangles that share a single vertex give an articulation point with no incident bridge: removing the shared vertex splits the graph in two, yet every edge still lies on a cycle.

## Recursion decision

The bridge computation is recursive in the same way the articulation point computation is, and for the same reason: the low link of a vertex is only final after every child has been processed.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $V$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A path graph on $10^6$ vertices, that is, a chain $0 - 1 - 2 - \cdots - 10^6 - 1$. Every one of the $10^6 - 1$ edges of this graph is a bridge, since removing any of them leaves two separate chains. The recursive form makes one nested call per vertex, so in C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack is exhausted after about $130\,000$ frames. The program dies with a segmentation fault after visiting $13\%$ of the graph, having reported the first $130\,000$ bridges. The iterative form finishes normally.
:::

The iterative form needs the index of the next neighbor to examine stored alongside the vertex, so that it can tell "just entered this vertex" from "returned to this vertex from a child". The bridge test belongs to the second case only.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Testing `low[child] >= disc[parent]` | Every cycle is reported as a bridge | Use the strict inequality `>` for edges |
| Not skipping the parent edge when updating the low link | The tree edge looks like a back edge and no bridge is ever found | Skip the specific tree edge to the parent |
| Taking the test before the recursive call | The low value is unfinished and the answer is wrong | Take the test on return from the child |
| Testing non-tree edges as well | Every cycle edge is reported | Only tree edges can be bridges |
| Skipping the parent by vertex label | Parallel edges break the low link | Skip the tree edge by identity |
| Running the search from vertex 1 only | Bridges in other components are missed | Loop over all vertices |
| Reporting the vertices of a cut as bridges | The two objects are confused | The vertex answer is the [articulation point](/algorithms/graphs/articulation-points) answer |
| Believing an articulation point always has a bridge | Wrong in both directions | Two triangles sharing a vertex refute it |
| Treating a self-loop as a bridge | A self-loop never disconnects anything | Ignore self-loops |

### Why this fails: the triangle that reports a bridge

The mistake that survives review most often is using `>=` instead of `>`, which is the comparison used for articulation points.

The smallest counterexample is a triangle: the vertices $0, 1, 2$ with edges $0-1$, $1-2$, $2-0$.

The search from $0$ enters $1$ and then $2$, and the edge $2-0$ is a back edge to the root, so $\text{low}[2] = \text{disc}[0] = 0$. On return to $1$, $\text{low}[1] = \min(\text{disc}[1], \text{low}[2]) = 0$. Now the test for the tree edge $\{0, 1\}$ compares $\text{low}[1] = 0$ with $\text{disc}[0] = 0$. With `>=` the comparison is true, and the algorithm reports $\{0, 1\}$ as a bridge.

The truth is that a triangle contains no bridge at all. Every edge lies on the cycle $0 - 1 - 2 - 0$, so removing any one of them leaves a path, which is connected. The set of bridges of the triangle is empty.

The triangle is the smallest possible counterexample, and it is a very common shape: a mutual connection between three peers is exactly the situation where a redundant link is mistakenly flagged.

### Why this fails: the single edge that is never reported

The opposite mistake is forgetting to skip the parent edge when updating the low link. The tree edge from a parent to a child then looks like a back edge to an ancestor, and the low link of every child becomes at most the discovery time of its parent.

The smallest counterexample is a graph with two vertices and one edge: the path $0 - 1$.

The search enters $0$ and then $1$. Without skipping the parent edge, the edge $\{0, 1\}$ is treated as a back edge and $\text{low}[1] \gets \min(\text{disc}[1], \text{disc}[0]) = 0$. The test for the tree edge $\{0, 1\}$ then compares $\text{low}[1] = 0$ with $\text{disc}[0] = 0$, and the strict inequality $0 > 0$ is false, so the edge is not reported.

The truth is that $\{0, 1\}$ is a bridge: removing it leaves two isolated vertices, so the component count goes from one to two.

Two vertices and one edge is the smallest possible counterexample, and here the algorithm reports nothing at all on a graph whose every edge is a bridge.

### Why this fails: the cycle edge that is counted as a bridge

The third mistake is testing the non-tree edges as well, on the theory that an edge with nothing above it looks fragile.

The triangle again shows it. The edge $\{2, 0\}$ is not in the search tree, and the algorithm never tests it, which is correct. A version of the algorithm that also inspects non-tree edges, using the same low-link comparison, would report $\{2, 0\}$ as well, since $\text{low}[2] = 0$ and $\text{disc}[0] = 0$ do not satisfy the strict inequality but a naive rule that ignores the tree condition might. In general a non-tree edge always lies on a cycle, so it is never a bridge, and the correct rule is to test tree edges only.

The generalization covers all three failures: **a bridge is a redundancy failure, so the question is always whether an alternative route exists, and the alternative route may be the vertex itself.** That is why the edge test is strict and the vertex test is not.

## Variants and extensions

- **Edge-biconnected components.** Contract every non-bridge edge. The resulting graph on each connected component is a tree, the **bridge tree**, and its edges are the bridges. It answers "how many independent failure routes are there" and it is the structure behind many network reliability questions.
- **The block-cut tree.** The companion structure for vertices. It uses the [articulation points](/algorithms/graphs/articulation-points) instead of the bridges, and it records the blocks of the graph rather than its components.
- **Counting the components after a failure.** The number of components of $G - e$ for a bridge $e$ is one more than the number of components of $G$, and the bridge tree tells you which side is which without recomputing anything.
- **Bridges in a directed graph.** The notion does not carry over directly. A directed edge whose removal destroys strong connectivity is a strong bridge, and finding them requires a flow computation on the directed graph and on the graph obtained by reversing each edge.
- **Two-edge-connected decomposition.** A graph is 2-edge-connected when it is connected and has no bridges. The question "is the graph 2-edge-connected" is answered by the bridge list being empty.
- **Online bridges.** When edges are added one at a time, a disjoint set union can maintain the bridge structure incrementally, at a cost of $O(\log n)$ amortized per insertion. The offline version in this article does not need it.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Decide the object before writing code. Edge removal is this article; vertex removal is [articulation points](/algorithms/graphs/articulation-points). Both are one traversal, so compute both if the statement mentions either.
2. Write down the two comparisons side by side, with the word "strict" next to the bridge test. Mixing them up is the single most common error in this family.
3. Skip the parent edge by identity, not by label. The check is `w == parent[v]`, and it must be a check on the edge rather than on the vertex if parallel edges are allowed.
4. Take the test on return from the child, never before the recursive call.
5. Only test tree edges. If the implementation keeps an edge list with an identifier, mark the bridge by that identifier.
6. Run the search from every unvisited vertex unless the statement promises the graph is connected.
7. Test four shapes by hand: a single edge, a path, a triangle, and two triangles sharing a vertex. The single edge catches a missing parent skip, the triangle catches the wrong comparison, and the last one separates the two notions.

## Worked problems

### Problem 1: the links that carry the whole network

**Restatement.** An undirected graph has $n$ stations and $m$ links. Report every link whose removal leaves the graph with more connected components than before. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$.

**Naive baseline.** Remove each link and count the components, at a cost of $O(E(V + E))$.

**Insight.** A link is a bridge exactly when it lies on no cycle, and a depth-first search already knows whether the subtree below a tree edge can reach back to its parent.

**Derivation.** Run the search with the low-link update. On return from a child $u$ of $v$, mark the edge $\{v, u\}$ when $\text{low}[u] > \text{disc}[v]$.

**Correctness.** The proof above shows that the strict inequality holds exactly when the subtree of $u$ has no route to $v$ or above it, which is exactly when the tree edge is the only way out of that subtree and hence a bridge. Non-tree edges are never bridges.

**Complexity.** $O(V + E)$ time and $O(V)$ auxiliary space.

**Common wrong approach.** Using `>=` instead of `>`. On a triangle that reports one edge as a bridge, and a triangle has no bridges.

### Problem 2: the components that remain after a failure

**Restatement.** The same graph. For each link that is a bridge, report the sizes of the two parts the graph falls into.

**Naive baseline.** For each bridge, remove it and run a component count.

**Insight.** The bridge tree already contains the answer. Contracting the non-bridge edges gives a tree in which the bridges are the edges, and the size of one side of a bridge is the sum of the component sizes on that side.

**Derivation.** Compute the bridges and the discovery times. For a bridge $\{v, u\}$ with $u$ a child of $v$, the subtree of $u$ has size $\text{size}[u]$ and is one of the two parts. The other part has size $n - \text{size}[u]$ for a connected graph.

**Correctness.** Removing a bridge splits its component into exactly the subtree of the child and everything else, because the bridge was the only edge between them. So the two sizes are the subtree size and its complement.

**Complexity.** $O(V + E)$ time, with the subtree sizes computed on return from each child.

**Common wrong approach.** Reporting the subtree size as the answer for the whole component, which ignores the vertices on the other side of the bridge.

### Problem 3: the network with a redundancy requirement

**Restatement.** The same graph, but the operator must report the smallest number of links to remove so that the network is disconnected, and whether the network already has that redundancy.

**Naive baseline.** Try every single link and check, then try pairs, and so on.

**Insight.** The smallest number of links that disconnects a graph is one if the graph has a bridge and at least two otherwise. The second half is the edge connectivity, and it is computed by a flow computation on the edge biconnected components.

**Derivation.** Compute the bridges. If any exist, the answer is one. If not, the graph is 2-edge-connected and the answer is its edge connectivity, which is the minimum cut of the flow network described in [minimum cut](/algorithms/graphs/minimum-cut).

**Correctness.** A bridge disconnects the graph by itself, so one link is sufficient and zero never is. When there are no bridges, no single link disconnects the graph, so the answer is at least two.

**Complexity.** $O(V + E)$ for the bridges, plus the flow computation.

**Common wrong approach.** Reporting one whenever the graph has more than one component to begin with. A graph that is already disconnected needs zero removals, and the question of how many links are needed to make it _more_ disconnected is a different question.

## Practice progression

1. **Recognition.** Given a statement, decide whether bridges apply. Look for removal, failure, redundancy, and "single point of failure", and check that the graph is undirected.
2. **Direct application.** Implement the traversal with the low link and the strict test, and verify against the naive remove-and-count approach on small random graphs.
3. **Adaptation.** Extend it to report the articulation points at the same time, to report the two component sizes for each bridge, and to build the bridge tree.
4. **Combination.** Use the bridge tree as the skeleton of a larger problem, such as the number of independent failure routes, or the way to add the fewest links that remove every single point of failure.
5. **Challenge.** Solve a problem on a grid of $10^6$ cells where the depth of the search exceeds the stack, and write the iterative version that still computes the low links correctly.
6. **Transfer.** Use the low link for a question that is not about bridges at all: the lowest common ancestor of two vertices in a graph with cycles, the strongly connected components of a directed graph, or the articulation points of a graph built lazily as the queries arrive.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of a bridge in terms of connected components. (Formal model)
2. Give the cycle characterization of a bridge. (Formal model)
3. Give the exact test, and say why the inequality is strict. (Algorithm derivation)
4. Why is the bridge test different from the articulation point test? (Key insight)
5. Why can a non-tree edge never be a bridge? (Formal model)
6. State the relation between a bridge and an articulation point, and give a graph where the converse fails. (Formal model)
7. What is the smallest graph on which `>=` reports a false bridge? (Why this fails)
8. What is the smallest graph on which forgetting to skip the parent edge reports no bridge at all? (Why this fails)
9. How is the bridge tree built, and what does it contain? (Variants and extensions)
10. What is the time and space of the whole computation, and why does the test not change it? (Complexity analysis)
11. When is recursion safe here, and what is the failure mode when it is not? (Recursion decision)
12. What does the algorithm report for the graph $0-1$, $0-2$, $1-3$, $1-4$, $2-3$, $3-5$? (Step-by-step execution)

## Further reading

- The same traversal with one comparison changed is the subject of [articulation points](/algorithms/graphs/articulation-points), which also covers the block-cut tree.
- The traversal that produces the discovery times and the parent relation is [depth-first search](/algorithms/graphs/dfs).
- The flow-based version of the same question, for a minimum number of edges, is [minimum cut](/algorithms/graphs/minimum-cut).
- The other classic question about the structure of an undirected graph, about the cheapest set of edges rather than the most fragile ones, is [minimum spanning tree](/algorithms/graphs/mst).
- The [graph representation](/algorithms/graphs/representation) article covers the adjacency list and the edge list, and the call-stack limit is covered in [recursion](/algorithms/foundations/recursion).
