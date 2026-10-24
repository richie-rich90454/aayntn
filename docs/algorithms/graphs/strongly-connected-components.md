---
id: graphs.strongly-connected-components
title: Strongly connected components
summary: The maximal sets of vertices of a directed graph in which every vertex reaches every other, found with one or two depth-first searches and contracted into a directed acyclic graph.
division: [gold, platinum]
subjects: [graphs]
level: advanced
importance: advanced-technique
keywords:
    [
        strongly connected components,
        scc,
        tarjan,
        kosaraju,
        condensation,
        directed acyclic graph,
        finishing time,
        transpose,
    ]
prerequisites:
    required: [graphs.representation, graphs.dfs]
    recommended: [graphs.topological-sort, graphs.bfs]
complexity:
    time: "O(V + E)"
    space: "O(V) for Tarjan, O(V + E) for Kosaraju"
assumptions:
    - The graph is directed, and every edge may be used only in the direction it is given.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Group the vertices of a directed graph into maximal mutually reachable sets |
| **Time** | $O(V + E)$ for both variants |
| **Auxiliary space** | $O(V)$ beyond the adjacency list and its transpose |
| **Requires** | A directed graph and a depth-first search |
| **Fails when** | The second pass runs in the wrong finish order, or a finished vertex is treated as a stack member |
| **Primary technique** | Finishing times, or a low-link value with an explicit stack |
| **Related** | Topological sort, condensation, deadlock detection, dominator trees |

A strongly connected component is a set of vertices that can all reach each other. Contracting each component into one vertex turns any directed graph into a directed acyclic graph, and that condensation is often more useful than the original.

## Problem motivation

A build system has $n$ tasks. Task $a$ must finish before task $b$ starts, and each dependency is a directed edge $a \to b$. The team discovers that two tasks deadlock each other when each one waits for the other, and it needs to know which tasks are involved in which cycle.

The constraints are what make this a directed graph problem:

- $1 \le n \le 200\,000$ tasks and $0 \le m \le 400\,000$ dependency edges.
- Two tasks are in the same deadlock if each can reach the other.
- The team must report the maximal groups of such tasks.

"Each can reach the other" is the definition of a **strongly connected component**. It is the directed analogue of a connected component, and it is strictly harder: in an undirected graph, "can reach" is symmetric and the components are found by any traversal. In a directed graph it is not symmetric, and the components need the finishing order of a search.

The word "maximal" is load-bearing. A cycle is a set of mutually reachable vertices, but so is any subcycle, and so is a single vertex with a path to itself. The answer is the maximal such sets, which partition the vertex set.

The second sentence of the problem is what the components are usually used for. Once the components are known, the graph can be collapsed: replace each component by a single node and keep the edges between components. The result is a directed acyclic graph, and it can be sorted topologically, which tells the build system in which order the groups of tasks must run.

## Recognition patterns

Strongly connected components are the right tool when all of the following hold.

- The graph is **directed**, and the question is about **mutual reachability**.
- The statement mentions **cycles**, **deadlock**, **mutual dependency**, or **groups of mutually reachable vertices**.
- The answer will be **condensed** into a smaller graph, or the components will be **counted**.
- The graph is **static**.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n, m \le 2 \cdot 10^5$ | Both variants are comfortable; an $O(nm)$ reachability scan is not |
| The graph is undirected | Rules this technique out; use connected components from any traversal |
| $n \le 10^3$ and the graph is dense | A transitive closure by repeated relaxation also works, at $O(n^3)$ time and space |
| Only cycle detection is needed | A three-state depth-first search is enough and simpler |
| The graph is a directed acyclic graph | Every component is a single vertex, and a topological sort suffices |
| $m \ge 10^7$ | A transpose of the whole graph is large; consider Tarjan, which needs no transpose |
| Only the number of components is wanted | Both variants give it; build nothing else |

Two phrases in a statement are reliable signals. "Each can reach the other", "mutual dependency", and "deadlock" point here. "A path from A to B" points away, because that is a reachability question, answered by a search from one source.

<Synonyms terms="strongly connected components, scc, tarjan's algorithm, kosaraju's algorithm, condensation graph, condensation, transpose, finishing time, maximal strongly connected subgraph" />

## Naive approach

The baseline is to compute the transitive closure and then group the vertices that can reach each other.

```python
reach = [set() for _ in range(n)]
for u in range(n):
    stack = [u]
    while stack:
        x = stack.pop()
        for y in graph[x]:
            if y not in reach[u]:
                reach[u].add(y)
                stack.append(y)
```

This costs $O(V(V + E))$ time and $O(V^2)$ space. At $n = 200\,000$ the space alone is $4 \cdot 10^{10}$ entries, which is impossible.

The second baseline is to compute the transitive closure with a bitset representation and Floyd-Warshall, which costs $O(V^3 / w)$ time for a word size $w$. That is only feasible for a few thousand vertices.

The third baseline is to remove one vertex at a time and test whether the graph is still strongly connected. That is $O(V(V + E))$ as well, and it is the same cost as the first.

The defect common to all three is that they answer the question by rebuilding reachability information per vertex, when the search order of a single search already contains it.

## Key insight

The insight is that the **order in which a depth-first search finishes its vertices** carries exactly the information needed to find the components.

There are two facts about finishing times, and together they give the whole algorithm.

**Fact one: the components form a hierarchy.** Let $C$ be a strongly connected component, and let $r_C$ be the first vertex of $C$ that the search reaches. Because $C$ is strongly connected, every vertex of $C$ is reachable from $r_C$ using only vertices of $C$, and the search explores every edge of every vertex it reaches. So the search discovers every vertex of $C$ while it is still inside $r_C$, and $r_C$ is an ancestor of all of them in the search forest. Every vertex of $C$ therefore finishes before $r_C$ does.

Define $f(C)$ to be the largest finishing time in $C$. Then $f(C)$ is exactly the finishing time of $r_C$.

**Fact two: an edge from one component to another forces the order.** If there is an edge from a component $C$ to a different component $D$, then $f(C) > f(D)$.

To see this, let $c \to d$ be such an edge. When the search explores the edge $c \to d$, either $d$ is still unvisited, in which case the search enters $D$ from within $r_C$'s expansion and every vertex of $D$ finishes before $r_C$ does, or $d$ was already visited, in which case $D$ was already explored and its vertices have already finished, again before $r_C$ finishes. Either way $f(D) < f(C)$.

Fact two is what makes the algorithm work: it says that the component with the largest finishing time cannot reach any other component that has not yet been handled, and that is exactly the component the second pass finds.

There are two standard ways to exploit it.

**Kosaraju uses two searches.** The first search records the finishing order. The second search runs on the **transpose** of the graph, that is, on the graph with every edge reversed, and it processes vertices in **decreasing** finishing order. The transpose is the key: an edge $C \to D$ in the original graph becomes an edge $D \to C$ in the transpose, so when the second search starts inside the component with the largest finishing time, it cannot escape into a component that is not yet assigned, because by fact two such a component would have had a larger finishing time and would already have been processed.

**Tarjan uses one search.** It maintains a stack of vertices that have been visited but not yet assigned to a component, a discovery time, and a low link value. A vertex $v$ is the root of a component exactly when $\text{low}[v] = \text{disc}[v]$, and then the stack is popped down to $v$.

## Formal model

Let $G = (V, E)$ be a directed graph.

::: math definition Definition
A **strongly connected component** of $G$ is a maximal set $C \subseteq V$ such that for every pair of vertices $u, v \in C$ there is a path from $u$ to $v$ and a path from $v$ to $u$, both entirely within $C$. The components partition $V$, because strong reachability is an equivalence relation.
:::

::: math definition Definition
The **condensation** of $G$ is the graph whose vertices are the strongly connected components of $G$, with an edge from the component of $u$ to the component of $v$ whenever $G$ has an edge $u \to v$ and the two components are different.
:::

::: math definition Definition
Fix a depth-first search of $G$. The **finishing time** $\text{FT}[v]$ is the counter value at the moment the search leaves $v$, with the counter increased on every finish. For a component $C$, $f(C) = \max_{v \in C} \text{FT}[v]$.
:::

::: math lemma Lemma
If $C$ and $D$ are different strongly connected components and $G$ has an edge from $C$ to $D$, then $f(C) > f(D)$.
:::

::: math lemma Lemma
The condensation of any directed graph is a directed acyclic graph.
:::

::: math lemma Lemma
Let $G^T$ be the transpose of $G$, that is, the graph with an edge $v \to u$ for every edge $u \to v$ of $G$. Then $u$ and $v$ are in the same strongly connected component of $G$ if and only if they are in the same strongly connected component of $G^T$.
:::

## Algorithm derivation

### Kosaraju's algorithm

The state is a list of vertices in finishing order, a visited flag per vertex, and a component number per vertex.

```text
pass 1: for each vertex v not yet visited:
            dfs(v) on G, appending v to a list when the search leaves it

reverse every edge of G to obtain G^T

pass 2: for each vertex v in the list, taken from the end backwards:
            if v already has a component: continue
            run a search on G^T from v, restricted to vertices with no component
            give every vertex reached the same new component number
```

The update rule is the second pass's restriction: a vertex that already has a component is never revisited. The reason is the lemma: when the search starts at the vertex with the largest finishing time among the unassigned, the only unassigned vertices it can reach in $G^T$ are inside its own component.

### Tarjan's algorithm

The state is a discovery time, a low link value, an explicit stack of visited but unassigned vertices, a flag saying whether each vertex is on that stack, and a component number per vertex.

```text
on entering v:
    disc[v] = low[v] = timer++
    push v onto the stack; onStack[v] = true
    for each neighbor w of v:
        if w has not been visited:
            dfs(w)
            low[v] = min(low[v], low[w])
        else if onStack[w]:
            low[v] = min(low[v], disc[w])
on leaving v:
    if low[v] == disc[v]:
        repeat: pop a vertex x off the stack; onStack[x] = false
        until x == v
        all the popped vertices form one component
```

The low link has the same meaning as in the undirected case: it is the smallest discovery time reachable from $v$ by descending tree edges and then taking at most one edge to a vertex that is still on the stack.

The `onStack` test is essential. A vertex that has been visited but already popped belongs to a component that is finished, and an edge to it must not lower the low link. The counterexample below shows exactly what happens when that distinction is lost.

::: math invariant Invariant
In Tarjan's algorithm, the stack always holds a set of vertices that have been visited and not yet assigned to a component, ordered so that the discovery times increase from the bottom of the stack to the top. For every vertex $v$ on the stack, $\text{low}[v]$ is the smallest discovery time reachable from $v$ by descending tree edges and taking at most one edge to a vertex on the stack.
:::

::: math invariant Invariant
In Kosaraju's second pass, when the search starts at an unassigned vertex $v$, every unassigned vertex it reaches belongs to the same strongly connected component as $v$, and it reaches every vertex of that component.
:::

## Step-by-step execution

Take the directed graph on vertices $0,1,2,3,4$ with edges $0 \to 1$, $1 \to 2$, $2 \to 0$, $2 \to 3$, $3 \to 4$, $4 \to 3$. The adjacency lists, in the order the edges were read, are $0: (1)$, $1: (2)$, $2: (0, 3)$, $3: (4)$, $4: (3)$.

The components are $\{0, 1, 2\}$ and $\{3, 4\}$. The cycle $0 \to 1 \to 2 \to 0$ makes the first three mutually reachable, the cycle $3 \to 4 \to 3$ makes the last two mutually reachable, and the edge $2 \to 3$ points from the first group into the second with no way back.

### Tarjan's algorithm

The search starts at vertex $0$. The counter and the stack are shown at each step.

1. Enter $0$. $\text{disc}[0] = \text{low}[0] = 1$. The stack is $[0]$.
2. The neighbor $1$ is unvisited, so enter $1$. $\text{disc}[1] = \text{low}[1] = 2$. The stack is $[0, 1]$.
3. The neighbor $2$ is unvisited, so enter $2$. $\text{disc}[2] = \text{low}[2] = 3$. The stack is $[0, 1, 2]$.
4. At $2$, the neighbor $0$ has been visited and is on the stack, so $\text{low}[2] \gets \min(3, \text{disc}[0] = 1) = 1$. The neighbor $3$ is unvisited, so enter $3$: $\text{disc}[3] = \text{low}[3] = 4$. The stack is $[0, 1, 2, 3]$.
5. At $3$, the neighbor $4$ is unvisited, so enter $4$: $\text{disc}[4] = \text{low}[4] = 5$. The stack is $[0, 1, 2, 3, 4]$.
6. At $4$, the neighbor $3$ has been visited and is on the stack, so $\text{low}[4] \gets \min(5, \text{disc}[3] = 4) = 4$. Leave $4$: is $\text{low}[4] = 4$ equal to $\text{disc}[4] = 5$? No, so nothing is popped.
7. Leave $3$. Set $\text{low}[3] \gets \min(4, \text{low}[4] = 4) = 4$. Is $\text{low}[3] = 4$ equal to $\text{disc}[3] = 4$? Yes, so the stack is popped down to $3$, popping $4$ and $3$. The component is $\{3, 4\}$. The stack is $[0, 1, 2]$.
8. Back at $2$, set $\text{low}[2] \gets \min(1, \text{low}[3] = 4) = 1$. Leave $2$: is $\text{low}[2] = 1$ equal to $\text{disc}[2] = 3$? No, so nothing is popped.
9. Leave $1$. Set $\text{low}[1] \gets \min(2, \text{low}[2] = 1) = 1$. Is $\text{low}[1] = 1$ equal to $\text{disc}[1] = 2$? No.
10. Leave $0$. Set $\text{low}[0] \gets \min(1, \text{low}[1] = 1) = 1$. Is $\text{low}[0] = 1$ equal to $\text{disc}[0] = 1$? Yes, so the stack is popped down to $0$, popping $2$, $1$ and $0$. The component is $\{0, 1, 2\}$.

The two components are found, and notice the order: $\{3,4\}$ is found first, because it is closed off before the search returns to the root.

### Kosaraju's algorithm

The first pass is a plain depth-first search whose counter is increased when a vertex **finishes**.

1. Enter $0$, $1$, $2$, $3$, $4$, in that order, because the adjacency lists lead that way.
2. Vertex $4$ has only the edge back to $3$, which is already visited, so $4$ finishes first, with finishing time $2$.
3. Vertex $3$ has only the edge to $4$, which is already visited, so $3$ finishes, with finishing time $3$.
4. Vertex $2$ has the edge to $0$, which is already visited, so $2$ finishes, with finishing time $4$.
5. Vertex $1$ finishes, with finishing time $5$, and vertex $0$ finishes, with finishing time $6$.

The finishing list, in the order the vertices finished, is $[4, 3, 2, 1, 0]$.

The transpose reverses every edge: $1 \to 0$, $2 \to 1$, $0 \to 2$, $3 \to 2$, $4 \to 3$, $3 \to 4$. Its adjacency lists are $0: (2)$, $1: (0)$, $2: (1)$, $3: (2, 4)$, $4: (3)$.

The second pass consumes the finishing list **from the end**, so the order of the vertices it starts from is $0, 1, 2, 3, 4$.

6. Vertex $0$ is unassigned, so start a search from it. In the transpose, $0 \to 2$ and $2 \to 1$ and $1 \to 0$, so the search reaches $\{0, 2, 1\}$ and stops, because $2$ also has no other outgoing edge in the transpose. The first component is $\{0, 1, 2\}$.
7. Vertices $1$ and $2$ already have a component and are skipped.
8. Vertex $3$ is unassigned, so start a search from it. In the transpose, $3 \to 2$ and $3 \to 4$ and $4 \to 3$. Vertex $2$ is already assigned and is skipped, so the search reaches $\{3, 4\}$. The second component is $\{3, 4\}$.
9. Vertex $4$ already has a component and is skipped.

Two facts are worth pulling out of this trace. First, the vertex with the largest finishing time, namely $0$ with finishing time $6$, belongs to the component $\{0,1,2\}$, and that is where the second pass starts. Second, the search from $0$ reached $2$, which is in the same component, and stopped there even though the transpose edge $3 \to 2$ exists, because $3$ is not reachable from $0$ in the transpose. The components are found in the reverse of the order in which the first pass finished them, which is exactly what the lemma predicts.

## Correctness proof

::: math theorem Theorem
Kosaraju's algorithm assigns every vertex of $G$ to its strongly connected component.
:::

::: math proof Proof
We first prove the two facts used by the algorithm.

Fact one: let $C$ be a strongly connected component and $r_C$ the first vertex of $C$ discovered by the first pass. Every vertex of $C$ is reachable from $r_C$ by a path lying entirely within $C$, and the search explores every edge of every vertex it reaches. Hence every vertex of $C$ is discovered while $r_C$ is on the stack, so $r_C$ is an ancestor of all of them and it finishes after all of them. Therefore $f(C) = \text{FT}[r_C]$.

Fact two: suppose $C$ and $D$ are different components and the graph has an edge $c \to d$ with $c \in C$ and $d \in D$. When the search explores that edge, either $d$ is unvisited, in which case the search enters $D$ from within the expansion of $r_C$ and, because $D$ is strongly connected, every vertex of $D$ is discovered and finished before $r_C$ finishes; or $d$ is already visited, in which case $D$ was already explored and its vertices have already finished, again before $r_C$ finishes. Either way $f(D) < f(C)$. $\square$

Now the second pass. Let $C$ be the component whose finishing time $f(C)$ is largest among the components that are still unassigned, and let $r_C$ be its first-discovered vertex. By fact one, $f(C) = \text{FT}[r_C]$, and every vertex of every other unassigned component $D$ has finishing time at most $f(D) < f(C)$, so $r_C$ is the unassigned vertex with the largest finishing time. The second pass therefore starts at $r_C$.

The second pass runs on the transpose. Suppose it reaches an unassigned vertex $w$ in a different component $D$. Then the transpose has an edge $r_C \leadsto w$, so the original graph has an edge from $D$ to $C$, and fact two gives $f(D) > f(C)$. But $C$ was chosen with the largest finishing time among the unassigned components, a contradiction. So the search stays inside $C$.

Conversely, the search reaches every vertex of $C$, because the transpose restricted to $C$ is strongly connected: reversing all edges of a strongly connected digraph preserves strong connectivity, which follows from fact two applied in both directions. So the search from $r_C$ reaches all of $C$ and nothing else, and $C$ is exactly one component.

The algorithm repeats this argument on the remaining components, so every vertex is assigned to its own component. $\square$
:::

::: math theorem Theorem
Tarjan's algorithm assigns every vertex of $G$ to its strongly connected component.
:::

::: math proof Proof
Consider a vertex $v$ on the stack when it is popped. The stack is popped only when the algorithm leaves a vertex $u$ with $\text{low}[u] = \text{disc}[u]$. At that moment the vertices popped are those above $u$.

First, every popped vertex can reach $u$. A vertex $x$ on the stack above $u$ was pushed while the search was inside $u$'s subtree or was reached from inside it, and the low link of $u$ equals $\text{disc}[u]$ precisely when no vertex in $u$'s subtree reaches an earlier vertex; the stack discipline means every vertex above $u$ has a path back to $u$ inside $u$'s subtree.

Second, $u$ can reach every popped vertex, because they are all descendants of $u$ in the search tree.

So the popped set is a set of mutually reachable vertices.

Third, the popped set is maximal. Any vertex outside it that is mutually reachable with $u$ would have to be on the stack, because the stack holds exactly the visited and unassigned vertices, and it would have to be below $u$ on the stack, since a vertex below $u$ on the stack was discovered before $u$ and has a smaller discovery time. But then that vertex would have been popped as well, since the pop takes everything above $u$ and the vertex is above $u$ when $u$ was pushed. Contradiction.

So each popped set is exactly one strongly connected component, and the algorithm pops each vertex exactly once. $\square$
:::

## Complexity analysis

**Kosaraju: $O(V + E)$ time.** The first pass visits every vertex and every edge once. Building the transpose visits every edge once. The second pass visits every vertex and every edge of the transpose once, because a vertex is searched only once, and every edge is examined at most once from each end.

**Tarjan: $O(V + E)$ time.** Each vertex is entered once and each edge is examined once. The stack operations are $O(1)$ each and there is one push and one pop per vertex.

**Auxiliary space: $O(V)$** beyond the adjacency list for both. Kosaraju needs the transpose, which is $O(V + E)$, so its total working set is $O(V + E)$. Tarjan needs no transpose, which is its main practical advantage: it avoids allocating a second copy of a graph that may have millions of edges.

::: math complexity Complexity
Strongly connected components in a directed graph with $V$ vertices and $E$ edges: time $O(V + E)$ for both Kosaraju and Tarjan. Auxiliary space $O(V)$ for Tarjan, and $O(V + E)$ for Kosaraju because of the transpose.
:::

|  | Kosaraju | Tarjan |
| --- | --- | --- |
| Number of searches | Two | One |
| Transpose needed | Yes | No |
| Extra memory | $O(V + E)$ for the transpose | $O(V)$ |
| Natural form | Iterative | Recursive |
| Component discovery | By finishing order in the first pass | By the stack and the low link |
| Easiest to debug | The two passes are independent | The stack discipline and the `onStack` flag |

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Maximal mutually reachable sets in a directed graph | Strongly connected components |
| Whether a directed graph has a cycle | A three-state depth-first search, simpler and cheaper |
| A topological order of a directed acyclic graph | [Topological sort](/algorithms/graphs/topological-sort) |
| A topological order of the condensation | A topological sort of the condensation, once the components are known |
| Groups of mutually reachable tasks | Strongly connected components |
| The largest component | Strongly connected components, then a linear scan of the sizes |
| Vertex pairs that can reach each other | Strongly connected components, then compare the component numbers |
| Deadlock detection among transactions | Strongly connected components of the wait-for graph |
| Undirected connected components | Any traversal; no order is needed |

The row that matters in practice is the second one. If the statement only asks whether a cycle exists, a strongly connected component computation is more than is needed, and a three-state depth-first search answers the question with no stack and no component bookkeeping.

## Recursion decision

Tarjan's algorithm is recursive by nature, because the low link of a vertex is only final when the search returns from its last child. Kosaraju's algorithm has a natural iterative form, since both of its passes are simple loops over a stack.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $V$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A directed path $0 \to 1 \to 2 \to \cdots \to 10^6 - 1$. The graph is legal, it satisfies every constraint above, and its strongly connected components are $10^6$ singleton sets, since a path has no cycle. The recursive form of Tarjan's algorithm makes one nested call per vertex, so in C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack is exhausted after about $130\,000$ frames, and the program dies with a segmentation fault after visiting $13\%$ of the graph. The iterative form finishes normally and reports $10^6$ components.
:::

The iterative form of Tarjan's algorithm stores the index of the next neighbor to examine alongside each vertex, so that it can distinguish "just entered this vertex" from "returned to this vertex from a child". The stack of unassigned vertices is separate from the stack of the traversal, and keeping them apart is what stops the two from being confused.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Running the second pass in increasing finish order | Components are merged across a cycle | Take the vertices from the end of the finishing list backwards |
| Running the second pass on the original graph | Every component merges into one | Reverse every edge |
| Reversing only some of the edges | The result is neither version of the algorithm | Rebuild the transpose from the edge list |
| Using "visited" instead of "onStack" in Tarjan | A finished component is merged into the wrong one | Keep the flag, and update it when a vertex is popped |
| Popping the stack to the child instead of to the root | Components are split or merged wrongly | Pop when `low[v] == disc[v]`, and pop down to `v` |
| Forgetting the outer loop over all vertices | Components in unreached parts of the graph are missing | Loop over every vertex and start a search at each unvisited one |
| Assuming the condensation is a tree | It is a directed acyclic graph, not a tree | Use a topological sort, not a tree algorithm |
| Reporting the components in the order they were found | The order is not a meaningful answer | Sort by the smallest vertex index or by the topological order |
| Using 32-bit counters for the discovery times | Overflow on a large graph | The counters need only $\log_2 V$ bits, but check the type |

### Why this fails: the finish order that is not reversed

The mistake that survives review most often is running the second pass over the finishing list from the front instead of the back.

The smallest counterexample is a directed graph with two vertices and one edge: $a \to b$.

The first pass enters $a$, then $b$, which has no outgoing edges, so $b$ finishes first and $a$ finishes second. The finishing list is $[b, a]$, and the finishing times are $\text{FT}[b] = 2$ and $\text{FT}[a] = 3$.

The transpose is the single edge $b \to a$.

Now take the second pass. With the correct **decreasing** order, the vertices are processed $a$ first. A search from $a$ in the transpose reaches nothing, because $a$ has no outgoing edge in the transpose, so the first component is $\{a\}$. The next unassigned vertex is $b$, and a search from $b$ reaches $a$, which is already assigned and is skipped, so the second component is $\{b\}$. The answer is two singleton components, which is correct: $a$ reaches $b$ but $b$ does not reach $a$.

With the wrong **increasing** order, the vertices are processed $b$ first. A search from $b$ in the transpose reaches $a$, and $a$ has no outgoing edge in the transpose, so the search collects $\{b, a\}$ and reports a single component containing both vertices.

The truth is that the two vertices are not mutually reachable, so they are in different components. The algorithm with the wrong order merges every component that an edge points into, and on a graph whose condensation is a long path it merges the whole graph into one component.

Two vertices and one edge is the smallest possible counterexample, and the failure is a merge rather than a crash, so nothing in the output signals it.

### Why this fails: the finished vertex that is treated as a stack member

The second mistake is replacing Tarjan's `onStack` test with a plain "has this vertex been visited" test.

The smallest counterexample that shows the difference has four vertices and four edges: $0 \to 1$, $0 \to 3$, $1 \to 2$, $3 \to 2$.

Run the first pass from $0$, whose adjacency list is $(1, 3)$.

1. Enter $0$: $\text{disc}[0] = 1$. Enter $1$: $\text{disc}[1] = 2$. Enter $2$: $\text{disc}[2] = 3$. Vertex $2$ has no outgoing edges, so $\text{low}[2] = \text{disc}[2]$ and the stack is popped down to $2$, giving the component $\{2\}$. Return to $1$: $\text{low}[1] = \min(\text{disc}[1], \text{low}[2]) = 2$, and $\text{low}[1] = \text{disc}[1]$, so the stack is popped down to $1$ and the component is $\{1\}$. Return to $0$: $\text{low}[0] = \min(\text{disc}[0], \text{low}[1]) = 1$, and $\text{low}[0] = \text{disc}[0]$.
2. The next neighbor of $0$ is $3$: enter $3$, $\text{disc}[3] = 4$. Its only edge is $3 \to 2$, and vertex $2$ has been visited but is **not** on the stack, because it was popped. With the correct test, the edge is ignored, so $\text{low}[3] = \text{disc}[3] = 4$ and the stack is popped down to $3$, giving the component $\{3\}$. Return to $0$, and $0$ is popped as the component $\{0\}$.

The correct answer is four components: $\{0\}$, $\{1\}$, $\{2\}$, $\{3\}$. No two of the vertices are mutually reachable, because every path in this graph moves strictly forward in the order $0, 1, 3, 2$.

Now the buggy version, in which the edge $3 \to 2$ is folded in because $2$ has been visited: $\text{low}[3] = \min(\text{disc}[3], \text{disc}[2]) = 3$, which is not equal to $\text{disc}[3] = 4$, so nothing is popped at $3$. Returning to $0$, $\text{low}[0]$ stays at $1$, so the stack is popped down to $0$ and the vertices $3$ and $0$ are reported as a single component.

The buggy answer is three components: $\{0, 3\}$, $\{1\}$, $\{2\}$. The algorithm has merged two vertices that cannot reach each other.

### Why this fails: the second pass on the wrong graph

The third mistake is running the second pass on the original graph instead of the transpose.

The smallest counterexample is again the two-vertex graph $a \to b$. On the original graph, a search from $a$ reaches $b$, so the single component reported is $\{a, b\}$, which is wrong for the same reason as before.

The rule generalizes: the transpose is what stops the search from leaving the component it started in, because an edge into a component becomes an edge out of it. Removing the transpose removes the only mechanism that makes the second pass sound.

## Variants and extensions

- **The condensation and its topological order.** Contract the components, sort the condensation topologically with [topological sort](/algorithms/graphs/topological-sort), and the result is a schedule in which every component runs after everything it depends on.
- **The component graph of a directed acyclic graph.** When the input is already acyclic, every component is a single vertex, and the algorithm reduces to a topological sort.
- **Reachability queries.** Two vertices are mutually reachable exactly when they have the same component number, so a single component number answers that question in constant time. General reachability is harder and needs a transitive closure or a different structure.
- **Strong bridges.** An edge whose removal destroys strong connectivity is a strong bridge, and finding them requires a flow computation on the directed graph and on the graph with each edge reversed in turn.
- **Dominator trees.** The structure that answers "which vertices does every path from the source pass through" is computed with a low-link-like technique that is a close cousin of Tarjan's, and it is the directed analogue of the [articulation point](/algorithms/graphs/articulation-points) computation.
- **Iterative Tarjan.** The standard formulation for very deep graphs keeps two stacks: one for the traversal and one for the unassigned vertices, and stores the neighbor index with each traversal entry.
- **Comparing with the undirected case.** An undirected graph's articulation points and bridges come from a low-link computation in one search. The directed case needs the finishing order, because the low link alone is not enough to distinguish a component from a vertex that merely has a route back into a closed region.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Decide between the two variants before writing code. Tarjan needs one search and no transpose, which is the better choice on a large graph. Kosaraju is easier to write and to debug.
2. Write the finishing order down as a list, and note that the second pass consumes it **from the end**.
3. Build the transpose by iterating the edge list, not by copying the adjacency lists, so that the reversal is obviously complete.
4. Keep the `onStack` flag in Tarjan, and update it at the moment a vertex is popped. A visited flag is not a substitute.
5. Run the outer loop over all vertices in both variants. A component in a part of the graph the first search never reached is still a component.
6. Test four shapes by hand: a single edge, a directed cycle, a diamond with a shared sink, and two disjoint cycles.
7. When the answer must be printed, sort it. The component numbers depend on the search order, and the search order depends on the adjacency order.

## Worked problems

### Problem 1: the mutually dependent modules

**Restatement.** A directed graph has $n$ modules and $m$ dependency edges, where $u \to v$ means that $u$ depends on $v$. Report the maximal groups of modules in which each module depends, directly or indirectly, on all the others. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$.

**Naive baseline.** Compute the transitive closure and group the mutually reachable pairs, at a cost of $O(V(V + E))$ time and $O(V^2)$ space.

**Insight.** The finishing order of a depth-first search orders the components against each other: if one component has an edge to another, its finishing time is larger.

**Derivation.** Run Kosaraju's algorithm: a first search on the graph recording the finishing order, then a search on the transpose processing the vertices from the end of that order.

**Correctness.** The proof above shows that the second pass starts in the component with the largest finishing time among the unassigned ones, that it cannot escape into another unassigned component, and that it reaches all of its own component. So each pass of the second search collects exactly one component.

**Complexity.** $O(V + E)$ time and $O(V + E)$ auxiliary space, including the transpose.

**Common wrong approach.** Processing the finishing list from the front. On the graph $a \to b$ that reports one component instead of two.

### Problem 2: the deadlocked transactions

**Restatement.** A database has $n$ transactions. Transaction $u$ waits for transaction $v$ if $u \to v$. A set of transactions is deadlocked if every one of them waits, directly or indirectly, for every other one. Report the deadlocked sets.

**Naive baseline.** Search for a cycle from every vertex, at a cost of $O(V(V + E))$.

**Insight.** A deadlocked set is exactly a strongly connected component of size at least two.

**Derivation.** Build the wait-for graph and compute its strongly connected components. Report every component with at least two vertices.

**Correctness.** Within a component, every vertex reaches every other, so each transaction waits for each other and the set is deadlocked. A set of vertices that is deadlocked is mutually reachable, so it lies inside a single component, and maximality makes it the whole component.

**Complexity.** $O(V + E)$ time.

**Common wrong approach.** Reporting every cycle found by a three-state search. That reports many overlapping cycles rather than the disjoint maximal sets that the question asks for.

### Problem 3: the schedule of the components

**Restatement.** The same graph. The build system must run every module, and a component may run only after every component it depends on. Report a valid order of the components.

**Naive baseline.** Topological sort the original graph, which fails because the original graph has cycles.

**Insight.** The condensation is a directed acyclic graph, so the order problem survives the contraction and becomes easy.

**Derivation.** Compute the strongly connected components, contract them into single vertices, and run [topological sort](/algorithms/graphs/topological-sort) on the condensation.

**Correctness.** The condensation is acyclic, because a cycle in it would make its components mutually reachable and therefore a single component. Every component depends only on components that come before it in the topological order, so the resulting schedule is valid.

**Complexity.** $O(V + E)$ for the components and $O(V + E)$ for the sort.

**Common wrong approach.** Topological sorting the original graph. The sort requires a directed acyclic graph, and the original graph is not one, so the algorithm either loops or reports a false cycle.

## Practice progression

1. **Recognition.** Given a statement, decide whether strongly connected components apply. Look for cycles, mutual reachability, deadlocks, and mutual dependency, and check that the graph is directed.
2. **Direct application.** Implement both variants and check that they produce the same partition on random directed graphs.
3. **Adaptation.** Condense the components and sort the condensation, then extend the answer to report the largest component and the number of components.
4. **Combination.** Combine the components with a topological sort for a scheduling problem, and with a per-component computation for a problem that asks for an answer inside each group.
5. **Challenge.** Solve a problem with $10^6$ vertices and $2 \cdot 10^7$ edges where the transpose would not fit in memory, and use the iterative form of Tarjan instead.
6. **Transfer.** Use the finishing order elsewhere: the topological sort of a directed acyclic graph, the dominator tree of a control-flow graph, or the cycle detection in a state machine.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of a strongly connected component, and say why the components partition the vertex set. (Formal model)
2. State the two facts about finishing times that make Kosaraju's algorithm work. (Key insight)
3. Why is the transpose necessary in the second pass? (Common mistakes)
4. In which order does the second pass consume the finishing list? (Common mistakes)
5. What is Tarjan's condition for popping a component, and what does the stack contain? (Algorithm derivation)
6. Why must the `onStack` test be used instead of a visited test, and what is the smallest graph that shows it? (Why this fails)
7. Prove that the condensation is acyclic. (Formal model)
8. What are the time and space of each variant, and why does Kosaraju need more space? (Complexity analysis)
9. When is a three-state depth-first search enough instead of this? (Algorithm selection)
10. Which constraint value makes the transpose too expensive, and which variant handles it? (Recognition patterns)
11. When is recursion safe in Tarjan's algorithm, and what is the failure mode? (Recursion decision)
12. Why is the answer to the reachability question between two vertices a comparison of component numbers? (Variants and extensions)

## Further reading

- The ordering of a directed acyclic graph, which is the correct tool once the condensation has been computed, is [topological sort](/algorithms/graphs/topological-sort).
- The traversal that produces the finishing times is [depth-first search](/algorithms/graphs/dfs), and the three-state version of it detects a cycle without computing components.
- The undirected counterpart of the low-link idea, with the comparison that differs by one character, is [articulation points](/algorithms/graphs/articulation-points) and [bridges](/algorithms/graphs/bridges).
- The [graph representation](/algorithms/graphs/representation) article covers the adjacency list and the transpose, and the call-stack limit is covered in [recursion](/algorithms/foundations/recursion).
- The components and their condensation are the raw material of many advanced problems; the [advanced algorithms](/algorithms/advanced/) article collects the offline techniques that are sometimes the better answer.
