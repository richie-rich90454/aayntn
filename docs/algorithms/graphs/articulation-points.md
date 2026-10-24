---
id: graphs.articulation-points
title: Articulation points
summary: The vertices whose removal disconnects a graph, found in one depth-first search by comparing each subtree's lowest reachable ancestor against the vertex's own discovery time.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords:
    [
        articulation point,
        cut vertex,
        low link,
        lowlink,
        depth-first search,
        biconnected components,
        vertex cut,
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
| **Problem** | Find the vertices whose removal increases the number of connected components |
| **Time** | $O(V + E)$ |
| **Auxiliary space** | $O(V)$ beyond the adjacency list |
| **Requires** | One depth-first search and a low-link value per vertex |
| **Fails when** | The root rule is folded into the general rule, or the low value is not propagated |
| **Primary technique** | Comparing a subtree's lowest reachable ancestor with a vertex's discovery time |
| **Related** | Bridges, biconnected components, the block-cut tree, minimum vertex cuts |

The whole algorithm is a depth-first search with one extra integer per vertex. The extra integer records the earliest vertex that a subtree can reach without passing through its own root, and a single comparison against that integer decides whether a vertex is a cut vertex.

## Problem motivation

A county is planning the installation of emergency shelters. If a town is destroyed, the county wants to know which other towns become isolated, and how many shelters are needed so that every town can still reach one.

The statement is short, and the constraints are what make it a graph problem:

- $1 \le n \le 200\,000$ towns, joined by $0 \le m \le 400\,000$ two-way roads.
- The county must report every town $v$ such that removing $v$ and its roads leaves the remaining towns in more pieces than before.
- The county must also report the minimum number of shelters needed so that every town can still reach one.

The phrase "removing $v$ and its roads leaves the remaining towns in more pieces" is the definition of an **articulation point**, also called a cut vertex. It is a question about the structure of the graph, not about the length of a path, so the shortest-path algorithms are the wrong family entirely.

The second question is what makes this more than a curiosity. The minimum number of shelters that can break the county into pieces is exactly the size of the smallest set of vertices whose removal disconnects the graph, and the minimum number of _roads_ that can do the same is the size of the smallest edge cut. Both questions are answered by the same low-link computation described here, together with the closely related [bridges](/algorithms/graphs/bridges).

## Recognition patterns

Articulation points are the right tool when all of the following hold.

- The problem asks what happens when **one vertex, or a set of vertices, is removed**.
- The graph is **undirected**. The low-link rule depends on every non-tree edge pointing back at an ancestor, which is only true in an undirected graph.
- The answer is a **set of vertices**, or a **count** of them, rather than a path.
- The graph is **static** for the duration of the computation.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 2 \cdot 10^5$, $m \le 4 \cdot 10^5$ | One depth-first search is comfortable; a matrix is not |
| The graph is directed | Rules this technique out; use a dominator tree or a flow-based vertex cut |
| $n \le 10^3$ and the graph is dense | An $O(V^2)$ reachability scan also works, but is slower than the same answer from a search |
| The graph has at most $500$ vertices and many removals are asked | Recomputing from scratch per query may beat a complicated structure |
| Only the count is wanted | One search still gives the count; do not build anything else |
| The graph is a tree | Every non-leaf vertex is an articulation point, and no edge is a bridge |

Two phrases in a statement are reliable signals. "If this city is destroyed", "after removing this station", and "so that no town is left unreachable" all point here. "The shortest path from A to B" points away, because that question is answered by a distance and not by a set.

<Synonyms terms="articulation point, cut vertex, separating vertex, low link, lowlink, dfs low-link, biconnected components, block-cut tree" />

## Naive approach

The baseline is to remove each vertex and run a connected-components count on the rest of the graph.

```python
def is_articulation(graph, v):
    seen = [False] * len(graph)
    stack = [u for u in graph[v]]
    for u in graph[v]:
        seen[u] = True
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

This is $O(V + E)$ per vertex, so $O(V(V + E))$ in total. At the maximum constraints that is $200\,000$ times a linear scan, which is on the order of $10^{11}$ edge examinations. Far too slow.

The second baseline is to remove the edges incident to a vertex one at a time and test connectivity with a disjoint set union. That is worse still, because each removal requires rebuilding or repairing the union-find structure.

The third baseline is a _reachability_ scan: for each pair of vertices, compute the number of vertices reachable from one without the other. That produces the same information but at $O(V^2)$ space, which is $4 \cdot 10^{10}$ entries at the maximum constraints.

All three baselines share a defect. They answer the question "is the graph still connected after removing $v$" by rebuilding information that a single search already knows.

## Key insight

The insight is that a depth-first search already computes, for every subtree, the answer to the question the removal asks.

Root the search anywhere. When the search visits a vertex $v$, it gives every vertex a **discovery time** $\text{disc}[v]$, the counter value at the moment $v$ is first reached. The counter increases by one per visit, so the discovery times are distinct and totally ordered.

Now consider a vertex $v$ that is not the root, and one of its children $u$ in the search tree. The subtree of $u$ is a set of vertices hanging below $v$. If that subtree can reach a **strict ancestor** of $v$ without passing through $v$, then removing $v$ leaves the subtree attached to the rest of the graph. If it cannot, then removing $v$ cuts the subtree off entirely.

So the question becomes: can the subtree of $u$ reach above $v$? The answer is a single number, and that number is the **low link**.

The low link of a vertex $v$ is the smallest discovery time reachable from $v$ by going down zero or more tree edges and then taking **at most one** back edge. Concretely,

$$
\text{low}[v] = \min\Bigl(
  \text{disc}[v],\
  \min_{u \text{ child of } v} \text{low}[u],\
  \min_{\substack{(v, w) \text{ back edge} \\ w \text{ ancestor of } v}} \text{disc}[w]
\Bigr).
$$

The comparison that decides everything is then $\text{low}[u] \ge \text{disc}[v]$. The inequality is non-strict, and that is the whole difference from the bridge rule. The subtree of $u$ may reach $v$ itself and still be cut off when $v$ is removed, so reaching $v$ does not save it. A subtree can only save itself by reaching something **above** $v$.

The root is a special case, because the root has no ancestor. A root with two or more children in the search tree is an articulation point, because two different child subtrees can only be joined through the root. A root with one child is not, because removing the root leaves that child's subtree, which is connected.

## Formal model

Let $G = (V, E)$ be an undirected graph.

::: math definition Definition
For a vertex $v$, let $G - v$ be the graph obtained by deleting $v$ and every
edge incident to it. The vertex $v$ is an **articulation point** of $G$ if the
number of connected components of $G - v$ is strictly greater than the number
of connected components of $G$. It is also called a cut vertex.
:::


::: math definition Definition
Fix a depth-first search of $G$ with a counter that starts at zero. The
**discovery time** $\text{disc}[v]$ is the counter value when $v$ is first
visited. The **low link** $\text{low}[v]$ is the smallest discovery time
reachable from $v$ by a path that goes down zero or more tree edges of the
search and then uses at most one edge from a vertex to one of its proper
ancestors.
:::


::: math definition Definition
An edge $\{u, w\}$ examined while $u$ is being expanded is a **back edge** if
$w$ is an ancestor of $u$ in the search tree and $w$ is not the parent of $u$.
In an undirected graph every edge that is not a tree edge is a back edge in
exactly one direction.
:::


::: math lemma Lemma
Let $v$ be a vertex that is not a root of the search, and let $u$ be a child
of $v$ in the search tree. Then the subtree of $u$ is connected to the
vertices outside the subtree of $v$ without passing through $v$ if and only if
$\text{low}[u] < \text{disc}[v]$.
:::


::: math lemma Lemma
Let $r$ be a root of the search. Then $r$ is an articulation point if and
only if it has at least two children in the search tree.
:::


::: math lemma Lemma
Let $v$ be a vertex and let $c_1, \ldots, c_k$ be its children in the search
tree. Then the number of connected components of $G - v$ is $k$ if $v$ is not a
root and every child $c_i$ satisfies $\text{low}[c_i] \ge \text{disc}[v]$, and
is at most $k$ otherwise. A root contributes $k - 1$ instead, since one of its
child subtrees is the rest of the component.
:::


## Algorithm derivation

The state is three arrays of length $V$: the discovery times, the low links, and a flag marking each vertex as an articulation point. The parent of each vertex is carried in the recursion, or in an explicit stack in the iterative form.

The update rule for the low link has three parts, and each part corresponds to one of the three terms of the definition.

1. On entering a vertex $v$, set $\text{disc}[v] = \text{low}[v] = \text{counter}$ and increase the counter.
2. For each neighbor $w$ of $v$: if $w$ is the parent of $v$, do nothing. If $w$ is unvisited, recurse on $w$ and then set $\text{low}[v] \gets \min(\text{low}[v], \text{low}[w])$. If $w$ is visited and is not the parent, and $\text{disc}[w] < \text{disc}[v]$, then $w$ is an ancestor and the edge is a back edge, so set $\text{low}[v] \gets \min(\text{low}[v], \text{disc}[w])$.
3. On leaving a vertex $v$, apply the articulation test.

The test is the one line that separates the two cases.

```text
if v is the root of its search tree:
    v is an articulation point if and only if it has at least two children
else:
    v is an articulation point if and only if some child u has low[u] >= disc[v]
```

The update is correct because the three terms of the low link are exhaustive: the smallest discovery time reachable from $v$ is either the vertex $v$ itself, or lies in one of its child subtrees, or is reached by a single back edge out of $v$. There is no other way out of the subtree, because every edge leaving the subtree of a child goes to an ancestor of $v$.

::: math invariant Invariant
When the search enters a vertex $v$, $\text{low}[v] = \text{disc}[v]$, and
$\text{low}[v]$ is the smallest discovery time reachable from $v$ by descending
tree edges and taking at most one back edge. When the search leaves $v$, this
value has been minimized over every child subtree and every back edge out of
$v$, and it is final.
:::


::: math invariant Invariant
When the search leaves a non-root vertex $v$, the flag of $v$ is set exactly
when the subtree of some child of $v$ has no route to a strict ancestor of
$v$. Such a subtree is disconnected from the rest of the graph by the removal
of $v$.
:::


## Step-by-step execution

Take the undirected graph on vertices $0,1,2,3,4,5$ with edges $0-1$, $0-2$, $1-3$, $1-4$, $2-3$, $3-5$. The adjacency lists, in the order the edges were read, are $0: (1,2)$, $1: (0,3,4)$, $2: (0,3)$, $3: (1,2,5)$, $4: (1)$, $5: (3)$.

The search starts at vertex $0$.

1. Enter $0$. $\text{disc}[0] = 0$, $\text{low}[0] = 0$. The counter is now 1.
2. Neighbor $1$ is unvisited, so enter $1$. $\text{disc}[1] = 1$, $\text{low}[1] = 1$. The counter is now 2.
3. At $1$, neighbor $0$ is the parent and is skipped. Neighbor $3$ is unvisited, so enter $3$. $\text{disc}[3] = 2$, $\text{low}[3] = 2$. The counter is now 3.
4. At $3$, neighbor $1$ is the parent and is skipped. Neighbor $2$ is unvisited, so enter $2$. $\text{disc}[2] = 3$, $\text{low}[2] = 3$.
5. At $2$, neighbor $0$ is visited and is not the parent, and $\text{disc}[0] = 0 < \text{disc}[2] = 3$, so this is a back edge and $\text{low}[2] \gets 0$. Neighbor $3$ is the parent and is skipped.
6. Leave $2$ and return to $3$. The child $2$ gives $\text{low}[3] \gets \min(2, 0) = 0$. Neighbor $5$ is unvisited, so enter $5$. $\text{disc}[5] = 4$, $\text{low}[5] = 4$. Leave $5$; $\text{low}[3]$ stays at $0$.
7. Leave $3$. Its children are $2$ and $5$. For child $2$, $\text{low}[2] = 0 < \text{disc}[3] = 2$, so the subtree of $2$ reaches the strict ancestor $0$ and survives. For child $5$, $\text{low}[5] = 4 \ge \text{disc}[3] = 2$, so the subtree of $5$ cannot reach above $3$. Therefore **$3$ is an articulation point**: removing it isolates vertex $5$.
8. Return to $1$. $\text{low}[1] \gets \min(1, 0) = 0$. Neighbor $4$ is unvisited, so enter $4$. $\text{disc}[4] = 5$, $\text{low}[4] = 5$.
9. Leave $1$. Its children are $3$ and $4$. For child $3$, $\text{low}[3] = 0 < \text{disc}[1] = 1$, so that subtree survives. For child $4$, $\text{low}[4] = 5 \ge \text{disc}[1] = 1$, so the subtree of $4$ cannot reach above $1$. Therefore **$1$ is an articulation point**: removing it isolates vertex $4$.
10. Return to $0$. $\text{low}[0] \gets \min(0, 0) = 0$. Neighbor $2$ is visited, is not the parent, and $\text{disc}[2] = 3 > \text{disc}[0] = 0$, so it is a descendant rather than an ancestor and the edge is ignored.
11. Leave $0$. It is the root and it has exactly one child, namely $1$, so it is **not** an articulation point. That is correct: removing $0$ leaves the edges $1-3$, $1-4$, $2-3$, $3-5$, which connect all five remaining vertices.

The articulation points are $1$ and $3$.

Now add a second component: the path $6-7-8$. The search restarts at $6$. Vertex $6$ is a root with one child, so it is not an articulation point. Vertex $7$ is not a root and its child $8$ has $\text{low}[8] = \text{disc}[8] \ge \text{disc}[7]$, so **$7$ is an articulation point**. The outer loop over the vertices is what finds it, and skipping that loop is a classic mistake.

## Correctness proof

::: math theorem Theorem
The algorithm marks exactly the articulation points of the graph.
:::


::: math proof Proof
First the low link. We show that when the search leaves a vertex $v$,
$\text{low}[v]$ is the smallest discovery time reachable from $v$ by descending
tree edges and then taking at most one back edge.

On entry, the only such time known is $\text{disc}[v]$, and the algorithm sets $\text{low}[v] = \text{disc}[v]$. Suppose the claim holds for a child $u$ of $v$ when the search leaves $u$; the claim is proved for $u$ by induction on the depth of the subtree. On return, the algorithm sets $\text{low}[v] \gets \min(\text{low}[v], \text{low}[u])$, which accounts for every vertex in the subtree of $u$ reachable from $v$ by descending one more tree edge. The algorithm also folds in $\text{disc}[w]$ for every back edge $(v, w)$, which accounts for every ancestor reachable in one step. Every path of the required shape out of the subtree of $v$ begins with either a tree edge to a child or a back edge out of $v$, so the two updates together cover all of them, and the claim follows. $\square$

Now a non-root vertex $v$ with a child $u$. By the lemma, the subtree of $u$ survives the removal of $v$ exactly when $\text{low}[u] < \text{disc}[v]$. So $\text{low}[u] \ge \text{disc}[v]$ is exactly the condition that the subtree of $u$ is disconnected from the rest of the graph when $v$ is removed. The algorithm marks $v$ exactly when some child satisfies that condition, which is exactly the condition that $v$ is an articulation point.

Now the root $r$ of a search tree. The child subtrees of $r$ are pairwise disconnected except through $r$, because in an undirected graph every non-tree edge joins a vertex to one of its ancestors, and no ancestor of $r$ exists. Removing $r$ therefore leaves exactly one component per child subtree, so the component count increases precisely when there are at least two children. The algorithm applies exactly that test.

Finally, every vertex belongs to exactly one search tree, and the outer loop starts one search per connected component, so every vertex is tested by exactly one of the two rules above, and the rule that applies to it is the right one. $\square$
:::


## Complexity analysis

**Time: $O(V + E)$.** Each vertex is entered once and left once, and each incident edge is examined at most twice, once from each endpoint. The articulation test at each vertex inspects its children, which costs $O(1)$ per child, so the total number of extra operations is $O(V)$.

**Auxiliary space: $O(V)$** beyond the adjacency list. The three arrays (discovery times, low links, and the flags) hold one entry per vertex. The recursion stack holds one frame per vertex on the current path, which is also $O(V)$; an iterative implementation replaces it with an explicit stack of the same size.

::: math complexity Complexity
Articulation points in an undirected graph with $V$ vertices and $E$ edges:
time $O(V + E)$, auxiliary space $O(V)$ beyond the adjacency list. One
depth-first search answers the question for every connected component at once.
:::


The bound is tight for a different reason than it is for a traversal. The search cannot stop early: every vertex must be visited, because a vertex that is not visited might still be an articulation point of its own component. The linear bound is a statement about the whole graph, not about the answer.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Vertices whose removal disconnects an undirected graph | Articulation points |
| Edges whose removal disconnects an undirected graph | [Bridges](/algorithms/graphs/bridges) |
| Blocks of an undirected graph, that is, maximal biconnected subgraphs | The same low-link computation, with a stack of edges |
| Minimum number of vertices whose removal disconnects the graph | A flow network with vertex splitting |
| Minimum number of edges whose removal disconnects the graph | A minimum cut, by [max-flow min-cut](/algorithms/graphs/minimum-cut) |
| Which vertices are reachable from a source | A plain traversal |
| Whether a directed graph has a cycle | A three-state depth-first search |
| The same question on a directed graph | Not covered here; the answer needs dominators |

The distinction between articulation points and bridges is worth stating precisely, because the two are computed from the same numbers and differ in exactly one place. An articulation point is a vertex whose removal disconnects the graph; a bridge is an edge whose removal disconnects the graph. The test for a vertex uses $\ge$ and the test for an edge uses $>$, and the reason for the difference is that a subtree may reach the articulation point itself and still be cut off, whereas an edge whose child's low link equals the parent's discovery time still has a route back to the parent through a different edge.

## Recursion decision

The low-link computation is naturally recursive, because the low value of a vertex is only final after all of its children have been processed. An iterative version is possible and is the right choice whenever the depth of the graph can be large.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $V$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A path graph on $10^6$ vertices, that is, a chain $0 - 1 - 2 - \cdots - 10^6 - 1$.
The graph is undirected, it satisfies every constraint above, and its
articulation points are exactly the $10^6 - 2$ interior vertices. The recursive
form makes one nested call per vertex, so in C++ on Linux with an 8 MB stack
and a frame of roughly 64 bytes the stack is exhausted after about $130\,000$
frames, and the program dies with a segmentation fault after visiting $13\%$ of
the graph. The iterative form finishes normally and reports the right set.
:::


The iterative form needs one extra piece of state that the recursive form gets for free: the index of the next neighbor to examine, stored alongside the vertex on the stack. That is what allows the iterative version to distinguish "just entered this vertex" from "returned to this vertex from a child", which is exactly what the articulation test needs.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Applying the general rule to the root | The root is reported on every path-like graph | Use the root rule: two or more children |
| Using the child-count rule for every vertex | Interior vertices of a path are missed | The child-count rule is only valid for the root |
| Forgetting to propagate the low link from children | Every vertex on a cycle is reported | Set `low[v] = min(low[v], low[u])` on return from a child |
| Writing `low[v] > disc[v]` instead of `>=` | A subtree that reaches only the articulation point is missed | Use `>=` for vertices and `>` for bridges |
| Treating an edge to a descendant as a back edge | The low link is polluted with a larger discovery time | Only fold in `disc[w]` when `disc[w] < disc[v]` |
| Running the search from vertex 1 only | Components that vertex 1 does not reach are never analyzed | Loop over all vertices and start a search at each unvisited one |
| Skipping the parent by vertex label rather than by edge identity | Parallel edges break the low link | Skip the specific tree edge to the parent |
| Counting a leaf as an articulation point | Spurious answers on trees | A leaf has no children and is never reported |
| Using a 64-bit counter where 32 bits would do | Nothing, but the arrays are twice as large | A counter over $V$ vertices fits in 32 bits |

### Why this fails: the root that is reported on a two-vertex path

The mistake that survives review most often is folding the root into the general rule, that is, testing every vertex with "does some child $u$ satisfy $\text{low}[u] \ge \text{disc}[v]$".

The smallest counterexample is a graph with two vertices and one edge: the path $0 - 1$.

The search starts at $0$, which is the root. It enters $1$, giving $\text{disc}[0] = 0$, $\text{disc}[1] = 1$, and $\text{low}[1] = 1$. The general rule applied to the root finds the child $1$ with $\text{low}[1] = 1 \ge \text{disc}[0] = 0$, so it reports $0$.

The truth is that removing vertex $0$ leaves the single vertex $1$, which is a connected graph with one component, exactly as many components as before. The component count did not increase, so $0$ is not an articulation point. The root rule would have said so: $0$ has one child, and one child is not two.

Two vertices and one edge is the smallest possible counterexample, and the failure is that a legal graph produces a spurious answer.

### Why this fails: the path interior that is missed

The opposite mistake is using the child-count rule everywhere, that is, reporting a vertex when it has two or more children in the search tree.

The smallest counterexample is a path with three vertices: $0 - 1 - 2$. The search from $0$ gives $1$ exactly one child, namely $2$, so the child-count rule does not report $1$.

The truth is that removing vertex $1$ leaves vertices $0$ and $2$ with no edge between them, which is two components where there was one. So $1$ is an articulation point, and the rule missed it.

The general statement is that the number of children in the search tree is unrelated to the number of components after the removal, except at the root. What matters is whether each child subtree has a route to a strict ancestor.

### Why this fails: the cycle whose vertices are all reported

The third mistake is forgetting to propagate the low link from a child to its parent, that is, leaving $\text{low}[v]$ at $\text{disc}[v]$ forever.

The smallest counterexample is a triangle: the vertices $0, 1, 2$ with edges $0-1$, $1-2$, $2-0$.

The search from $0$ enters $1$ and then $2$, and the edge $2-0$ is a back edge to the root, so $\text{low}[2] = \text{disc}[0] = 0$. Without propagation, $\text{low}[1]$ stays at $\text{disc}[1] = 1$. The test for vertex $1$ looks at its child $2$ and finds $\text{low}[2] = 0 < \text{disc}[1] = 1$, so it does not report $1$. Now remove the propagation entirely: $\text{low}[2]$ is still $0$, because $2$ is a leaf, so the test for $1$ still passes.

The failure appears one level deeper. Take the four-cycle $0 - 1 - 2 - 3 - 0$. The search from $0$ enters $1$, $2$, $3$, and the edge $3-0$ is a back edge, so $\text{low}[3] = 0$. With propagation, $\text{low}[2] = 0$ and $\text{low}[1] = 0$, and the test for vertex $1$ finds $\text{low}[2] = 0 < \text{disc}[1] = 1$, so $1$ is not reported. Without propagation, $\text{low}[2] = \text{disc}[2] = 2$, the test for vertex $1$ finds $\text{low}[2] = 2 \ge \text{disc}[1] = 1$, and the algorithm reports $1$.

The truth is that removing vertex $1$ from the four-cycle leaves the path $2 - 3 - 0$, which is connected, so $1$ is not an articulation point. The three-vertex triangle happens to survive the missing propagation only because the low value does not have to travel two levels to be tested.

## Variants and extensions

- **Bridges.** The same traversal, one comparison different. The edge from a parent to a child $u$ is a bridge exactly when $\text{low}[u] > \text{disc}[v]$. The full discussion is in [bridges](/algorithms/graphs/bridges).
- **Biconnected components.** Push each tree edge onto a stack as it is explored and pop it when a low link returns at or above the parent's discovery time. The edges popped together form one biconnected component.
- **The block-cut tree.** Contract each biconnected component into a node and keep the articulation points as separate nodes. The result is a tree, and every original vertex sits at a node of it. It is the structure that answers "how many independent cycles does this graph have", which is the count of blocks minus one.
- **Vertex connectivity.** The minimum number of vertices whose removal disconnects the graph is at most the number of articulation points, and for a graph with no articulation point it is at least two. Computing it exactly is a flow problem, described in [minimum cut](/algorithms/graphs/minimum-cut).
- **Counting the components after a removal.** The number of components of $G - v$ is one plus the number of children $u$ of $v$ with $\text{low}[u] \ge \text{disc}[v]$, for a non-root $v$. So the same traversal answers "how many pieces does the graph fall into if this town is destroyed", which is what the shelter problem actually asks.
- **Directed graphs.** The low-link rule fails on a directed graph because an edge may point sideways rather than back at an ancestor. The analogous structure is the dominator tree, which is computed with a different and considerably harder algorithm.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Decide the direction of the problem before writing code. Vertex removal is this article; edge removal is [bridges](/algorithms/graphs/bridges); both are one traversal with two tests.
2. Write the two rules down separately, on paper, before writing either. The root rule and the general rule are different sentences and must not be merged.
3. Use `>=` for the vertex test and `>` for the edge test, and say which is which out loud. Mixing them up is the single most common mistake in this family.
4. Run the search from every unvisited vertex. The outer loop is not optional unless the statement promises the graph is connected.
5. Test four shapes by hand: a single edge, a path, a triangle, and a star. The single edge catches the root rule, the path catches the child-count rule, the triangle catches the propagation, and the star catches a missing outer loop.
6. Write the plain traversal first and keep it as a reference. Compare the set of vertices it reaches with the set of vertices the low-link version treats as articulation points, on small random graphs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the towns that become isolated

**Restatement.** An undirected graph has $n$ towns and $m$ two-way roads. For each town $v$, report how many connected components the remaining towns form after $v$ and its roads are removed. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$.

**Naive baseline.** Remove each town in turn and run a connected-components count, at a cost of $O(V(V + E))$.

**Insight.** The number of components after removing a non-root vertex $v$ is one plus the number of its children $u$ with $\text{low}[u] \ge \text{disc}[v]$. The traversal computes all of these numbers in one pass.

**Derivation.** Run the depth-first search with the low-link update. Keep a counter that starts at one for every vertex, and increase it once for each child $u$ of $v$ with $\text{low}[u] \ge \text{disc}[v]$. For a root with $k$ children, the count is $k$.

**Correctness.** Each child subtree of $v$ with $\text{low}[u] \ge \text{disc}[v]$ is disconnected from the rest of the graph when $v$ is removed, and each other child subtree stays attached. So the components are the surviving subtrees plus one for each cut-off subtree, which is the number the algorithm reports.

**Complexity.** $O(V + E)$ time and $O(V)$ auxiliary space.

**Common wrong approach.** Reporting the articulation point or not as a boolean when the question asks for a count. A vertex in the middle of a path with three subtrees hanging off it produces three components, and the boolean loses that.

### Problem 2: the shelters that break the county apart

**Restatement.** The same graph. The county wants to place shelters so that removing them leaves the county in at least two pieces, and wants the minimum number of shelters.

**Naive baseline.** Try every subset of small size, or remove vertices one at a time and count the components.

**Insight.** When the graph has articulation points, a single vertex is enough, so the answer is one. The question only becomes interesting when the graph has no articulation point.

**Derivation.** Compute the articulation points. If there is at least one, the answer is one. If there are none, the graph is connected and has no cut vertex, so at least two vertices are needed, and the answer is the vertex connectivity, which is computed by building a flow network with vertex splitting and finding a minimum cut, as described in [minimum cut](/algorithms/graphs/minimum-cut).

**Correctness.** Removing any articulation point increases the number of components, so one shelter suffices, and zero never suffices because a graph with at least two vertices is connected to begin with. When there are no articulation points, no single vertex disconnects the graph, so the answer is at least two.

**Complexity.** $O(V + E)$ for the articulation points, plus the flow computation for the remaining case.

**Common wrong approach.** Reporting one whenever any articulation point exists, without checking that the county is larger than one vertex. A graph with two towns and one road has no articulation points and needs both towns removed to come apart.

### Problem 3: the railway network with a planned closure

**Restatement.** A railway network is an undirected graph. The authority will close exactly one station. Report, for every station, the number of stations that become unreachable from the rest of the network, and the total number of such critical stations.

**Naive baseline.** One search per station.

**Insight.** The same low-link computation gives both answers: the stations that become unreachable are the subtrees cut off by the removal, and their number is the number of children whose low link is at or above the station's discovery time.

**Derivation.** During the traversal, keep for each vertex the number of children $u$ with $\text{low}[u] \ge \text{disc}[v]$. A vertex is critical when that number is at least one, and it isolates exactly that many stations.

**Correctness.** A child subtree with $\text{low}[u] \ge \text{disc}[v]$ has no route to a strict ancestor of $v$, so the removal of $v$ separates it from every station outside it, and every station in it becomes unreachable. The subtrees are disjoint, so the count is exact.

**Complexity.** $O(V + E)$ time and $O(V)$ auxiliary space.

**Common wrong approach.** Reporting a leaf station as critical because it disconnects nothing but leaves itself unreachable. A leaf is not an articulation point, and the search naturally never marks it, because it has no children.

## Practice progression

1. **Recognition.** Given a statement, decide whether articulation points apply. Look for removal, destruction, isolation, and "still reachable", and check that the graph is undirected.
2. **Direct application.** Implement the search with the low link and the two rules, and verify the result against the naive remove-and-count approach on small random graphs.
3. **Adaptation.** Extend it to report the number of components after each removal, and to report the bridges of the same graph by changing one comparison.
4. **Combination.** Use the same traversal to extract the biconnected components with an edge stack, and build the block-cut tree from them.
5. **Challenge.** Solve a problem on a grid with $10^6$ cells where the recursion depth of the naive solution would exceed the stack, and produce the iterative version.
6. **Transfer.** Use the low link for a question that is not about cut vertices at all: the lowest common ancestor in a graph with cycles, the bridges in a grid of rooms, or the articulation points of a graph that is built lazily as the queries arrive.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of an articulation point in terms of connected components. (Formal model)
2. What does the low link of a vertex measure, and which three situations contribute to it? (Formal model)
3. Give the exact test for a non-root vertex and the exact test for a root. (Algorithm derivation)
4. Why is the vertex test `>=` while the bridge test is `>`? (Algorithm selection)
5. Why must the outer loop over all vertices be present? (Common mistakes)
6. What is the smallest graph on which applying the general rule to the root gives a wrong answer? (Why this fails)
7. What is the smallest graph on which the child-count rule misses an articulation point? (Why this fails)
8. What goes wrong when the low link is not propagated from children, and what is the smallest graph that shows it? (Why this fails)
9. What does the search examine once per vertex and once per edge, and what does that give? (Complexity analysis)
10. When is recursion safe here, and what is the failure mode when it is not? (Recursion decision)
11. How does the same traversal produce the biconnected components? (Variants and extensions)
12. What number of components does $G - v$ have, in terms of the children of $v$? (Worked problems)

## Further reading

- The same traversal with one comparison changed is the subject of [bridges](/algorithms/graphs/bridges), which also covers the edge-biconnected components.
- The traversal that produces the discovery times and the parent relation is [depth-first search](/algorithms/graphs/dfs); the three-state version of it detects cycles.
- The flow-based version of the same question, for a minimum number of vertices, is [minimum cut](/algorithms/graphs/minimum-cut), where vertex splitting turns a vertex cut into an edge cut.
- The [minimum spanning tree](/algorithms/graphs/mst) is the other classic question about the structure of an undirected graph, and the two share a traversal but not a purpose.
- The [graph representation](/algorithms/graphs/representation) article covers the adjacency list and the adjacency matrix, and the recursion and the call-stack limit are covered in [recursion](/algorithms/foundations/recursion).
