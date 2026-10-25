---
id: graphs.johnson
title: Johnson's algorithm
summary: All-pairs shortest paths on a sparse directed graph whose weights may be negative, by computing one set of potentials with Bellman-Ford and then running Dijkstra from every vertex on the reweighted graph.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords:
    [all-pairs shortest paths, negative weights, reweighting, potentials, bellman-ford, dijkstra]
prerequisites:
    required: [graphs.dijkstra, graphs.bellman-ford]
    recommended: [graphs.representation, graphs.floyd-warshall]
complexity:
    time: "O(VE + V(V + E) log V)"
    space: "O(V + E)"
assumptions:
    - Edge weights may be negative.
    - The graph is directed, because an undirected negative edge is already a negative cycle of length two.
    - The graph has no negative cycle, unless detecting one is the goal.
implementations: graphs.johnson
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/graphs.johnson.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<CodeViewer :entry="algorithm" />

Johnson's algorithm computes the shortest distance between every ordered pair of vertices of a sparse directed graph whose edge weights may be negative. It does so in three phases: one Bellman-Ford run from a virtual source produces a _potential_ for every vertex, every edge is reweighted with those potentials so that all weights become nonnegative, and one Dijkstra run from every vertex produces the reweighted distances, which are then shifted back into the original units.

The three phases divide the work cleanly. Bellman-Ford is the only phase that sees a negative weight, and it sees all of them at once. Dijkstra is the only phase that pays for a priority queue, and it never sees a negative weight. The potentials are the bridge: they are a single array of $V$ numbers that records how much each vertex is "ahead" of the virtual source, and subtracting those numbers from the edges is what removes the negative signs.

The running time is $O(VE + V(V + E) \log V)$. The first term is the Bellman-Ford run, and the second is the $V$ Dijkstra runs. The space is $O(V + E)$: the graph itself, one distance array, one potential array, and a heap that holds at most $O(E)$ entries.

## Problem motivation

A courier company has a depot in every town, and it wants to know the cheapest route between every ordered pair of towns. Some roads charge a toll, and some roads pay a rebate, so a road may have a negative cost. The company also wants to know whether the rebates are consistent: if a round trip has a negative total cost, a van could drive it forever and the "cheapest route" would be unbounded.

The constraints:

- $1 \le n \le 2\,000$ towns.
- $0 \le m \le 5\,000$ one-way roads.
- Every road has an integer cost between $-10^6$ and $10^6$.
- A route may visit the same town more than once, so a negative cycle is a real possibility.
- The answer is wanted for every ordered pair, not for one depot.

The last two constraints are what make the problem interesting. If the graph were dense, the cubic [Floyd-Warshall](/algorithms/graphs/floyd-warshall) algorithm would be the natural answer, because its inner loop is tiny and it handles negative weights directly. With $n = 2\,000$, however, the cubic loop performs $8 \cdot 10^9$ iterations, which is several seconds of work even in C++ and far too slow in the languages used for the harder test cases.

If every weight were nonnegative, running [Dijkstra's algorithm](/algorithms/graphs/dijkstra) from every vertex would cost about $2 \cdot 10^8$ operations and fit comfortably. The negative rebates break that plan: Dijkstra settles a vertex when it is extracted, and a negative edge found later can undercut a distance that was already declared final. The counterexample in the [Dijkstra article](/algorithms/graphs/dijkstra) shows a reported distance of $2$ when the true distance is $-1$.

The remaining baseline is [Bellman-Ford](/algorithms/graphs/bellman-ford) from every vertex. It handles the negative weights correctly, and at these limits it performs about $2 \cdot 10^{10}$ edge relaxations, which does not fit either. Johnson's algorithm is the answer that keeps the speed of Dijkstra and the correctness of Bellman-Ford: it pays for Bellman-Ford once, not $V$ times.

## Recognition patterns

Johnson's algorithm is the right tool when all of the following hold.

- The problem asks for the distance between **every ordered pair**, or for enough pairs that a search from each source is natural.
- Some edge weights are **negative**, so Dijkstra cannot run on the original graph.
- The graph is **sparse**: $m$ is much smaller than $V^2$, so $V$ Dijkstra runs cost less than one cubic pass.
- The graph is **directed**, or it is undirected with nonnegative weights. An undirected edge of negative weight is a cycle of length two with twice that weight, which is a negative cycle.
- Either the graph is guaranteed to have **no negative cycle**, or the problem asks whether one exists.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| All pairs, $n \le 400$, any weights | Floyd-Warshall is simpler and often faster |
| All pairs, $n \le 2\,000$, $m \ll n^2$, some negative weights | Johnson's algorithm |
| All pairs, sparse, every weight nonnegative | Dijkstra from every vertex |
| All pairs, dense, some negative weights | Floyd-Warshall |
| One source, some negative weights | Bellman-Ford |
| One source, every weight nonnegative | Dijkstra |
| Undirected edge with a negative weight | A negative cycle of length two; not a shortest-path instance |
| A negative cycle may exist | Detect it before reporting any distance |

Two words in a statement are reliable signals. "Every pair", "all pairs" and "between every pair of cities" point at an all-pairs method, and the size of $n$ then chooses between Floyd-Warshall and Johnson. "Rebate", "refund", "discount" and "negative cost" point at Bellman-Ford or Johnson, and the number of sources chooses between them.

<Synonyms terms="johnson's algorithm, reweighting, potentials, reduced costs, all pairs shortest path" />

## Naive approach

The first baseline is Floyd-Warshall. Keep a $V$ by $V$ matrix, initialize the diagonal to zero, keep the cheaper of the parallel edges, and relax every pair through every intermediate vertex.

```text
for k in 0 .. V-1:
    for i in 0 .. V-1:
        for j in 0 .. V-1:
            distance[i][j] = min(distance[i][j], distance[i][k] + distance[k][j])
```

This is correct for negative weights, and a negative diagonal entry at the end detects a negative cycle. Its cost is $O(V^3)$ time and $O(V^2)$ space. At $V = 2\,000$ the time is the problem, not the space.

The second baseline is Bellman-Ford from every vertex. Each run relaxes every edge $V - 1$ times, so the whole computation costs $O(V^2 E)$. At $V = 2\,000$ and $E = 5\,000$ that is roughly $2 \cdot 10^{10}$ relaxations, an order of magnitude beyond a comfortable contest limit.

The third baseline is Dijkstra from every vertex. It costs $O(V(V + E) \log V)$, which is the right speed, and it is wrong: the greedy step assumes that no later route can be cheaper, and a negative edge is exactly a later route that is cheaper.

The fourth baseline is the one people try after hearing about reweighting: subtract something from every edge so that the negative signs disappear. The trap is that an arbitrary subtraction changes the answer. If the same constant is subtracted from every edge, a path with more edges is favored, and the shortest path can change. The subtraction has to depend on the endpoints of each edge, and the values that make it safe are the shortest distances from a single source, or any other feasible potential.

## Key insight

The insight is that a graph with negative edges can be turned into a graph with nonnegative edges without changing which path is shortest, provided the transformation is charged to the endpoints.

Add a virtual source $q$ and an edge of weight zero from $q$ to every vertex. Let $h(v)$ be the shortest distance from $q$ to $v$. The shortest-path inequality for the edge $(u, v)$ of weight $w$ says

$$
h(v) \le h(u) + w.
$$

Rearrange it:

$$
w + h(u) - h(v) \ge 0.
$$

The left-hand side is the **reduced weight** of the edge. It is nonnegative for every edge, by the inequality above. That is the whole trick: the potentials are the shortest distances from the virtual source, and the triangle inequality is exactly what certifies that the reweighted graph has no negative edge.

The second half of the insight is that reweighting does not change which path is shortest. For a path $P$ from $s$ to $t$ with edges $e_1, \ldots, e_k$, the reduced length telescopes:

$$
w_h(P) = \sum_{i=1}^{k} \bigl(w(e_i) + h(u_i) - h(v_i)\bigr) = w(P) + h(s) - h(t).
$$

Every intermediate vertex appears once with a plus sign and once with a minus sign, so all of them cancel. The reduced length of every path from $s$ to $t$ differs from its original length by the same amount, $h(s) - h(t)$. Comparing two paths from the same source to the same target therefore gives the same answer before and after reweighting. The shortest path is preserved even though the individual edge weights changed.

That is why one Bellman-Ford run is enough. It produces the potentials; after that, every source is an independent nonnegative-weight problem, and Dijkstra solves each one in the usual way. The original distances are recovered by undoing the endpoint shift.

## Visual intuition

Think of the potential $h(v)$ as the altitude of vertex $v$. The feasibility inequality $h(v) - h(u) \le w(u, v)$ says that the altitude can drop by at most the weight of the edge when the edge is traversed. The reduced weight is the slack in that inequality: it is zero on a tight edge, where the altitude drops by exactly the weight, and positive on a loose edge, where the drop is smaller.

Subtracting the potentials tilts the whole graph so that no edge goes downhill by more than its weight. A path from $s$ to $t$ loses the altitude difference $h(s) - h(t)$ no matter which route it takes, so the tilt is invisible when two routes are compared.

The example from the next section makes the numbers concrete. The original graph has a negative edge $1 \to 2$ of weight $-3$. The virtual source gives $h(2) = -3$, because the cheapest way to reach vertex $2$ is to start at the virtual source, go to vertex $1$ for free, and take that edge. The reduced weight of the negative edge is

$$
-3 + h(1) - h(2) = -3 + 0 - (-3) = 0.
$$

The negative sign has been absorbed by the potential of the target. The edge that used to violate the greedy assumption is now a zero-weight edge, and zero is allowed.

| Edge      | Weight $w$ | $h(u)$ | $h(v)$ | Reduced weight $w + h(u) - h(v)$ |
| --------- | ---------- | ------ | ------ | -------------------------------- |
| $0 \to 1$ | $4$        | $0$    | $0$    | $4$                              |
| $0 \to 2$ | $5$        | $0$    | $-3$   | $8$                              |
| $1 \to 2$ | $-3$       | $0$    | $-3$   | $0$                              |
| $2 \to 3$ | $2$        | $-3$   | $-1$   | $0$                              |
| $3 \to 0$ | $1$        | $-1$   | $0$    | $0$                              |

The table also shows why the reduced graph is not the original graph with a constant added to every edge. The edge $0 \to 1$ keeps its weight, while $0 \to 2$ grows from $5$ to $8$, because the potential of its target is lower. Each edge is adjusted by its own endpoints.

## Formal model

Let $G = (V, E)$ be a directed graph with a weight function $w : E \to \mathbb{R}$. Parallel edges and self-loops are allowed. The graph may have negative weights, but it must not have a negative cycle unless the problem asks for detection.

::: math definition Definition
A **potential** is a function $h : V \to \mathbb{R}$. It is **feasible** for $G$ if

$$
h(v) \le h(u) + w(u, v)
$$

for every edge $(u, v) \in E$.
:::

::: math definition Definition
The **reduced weight** of an edge $(u, v)$ under a potential $h$ is

$$
w_h(u, v) = w(u, v) + h(u) - h(v).
$$
:::

::: math definition Definition
The **virtual source** is a new vertex $q$ with an edge of weight zero to every vertex of $V$. Its shortest-path distances are the potentials the algorithm uses, so $h(v) = \delta(q, v)$.
:::

::: math lemma Lemma
If $h$ is feasible, then every reduced weight is nonnegative.
:::

::: math lemma Lemma
For every path $P$ from $s$ to $t$, $w_h(P) = w(P) + h(s) - h(t)$.
:::

::: math lemma Lemma
If $h$ is feasible, then a path is shortest under $w$ exactly when it is shortest under $w_h$.
:::

The lemmas are proved in the correctness section. The third one is the one that licenses running Dijkstra on the reweighted graph: it says the set of shortest paths is unchanged, not merely that some shortest path survives.

## Algorithm derivation

The state is the edge list, the potential array `height` of $V$ entries, and the reweighted adjacency list.

1. **Initialize the potentials.** Set `height[v] = 0` for every vertex. This is the same as relaxing the zero-weight edges out of the virtual source once: every vertex is reachable from $q$ at distance zero, and some are reachable more cheaply through negative edges.
2. **Relax every edge $V$ times.** For each pass, visit every edge $(u, v)$ of weight $w$ and set `height[v] = height[u] + w` whenever that value is smaller. If a pass makes no change, the potentials are final and the graph has no negative cycle that the virtual source can reach.
3. **Detect a negative cycle.** If the $V$-th pass still changes a potential, the graph has a negative cycle. Because the virtual source reaches every vertex, every cycle is reachable, so the test is complete.
4. **Reweight the edges.** Build an adjacency list in which the edge $(u, v)$ has weight $w + height[u] - height[v]$. Every such weight is nonnegative.
5. **Run Dijkstra from every source.** For each $s$, compute the reweighted distance `reduced[v]` to every vertex, with a binary min-heap and a stale-entry check.
6. **Recover the original distances.** For every reachable $v$, the answer is `reduced[v] - height[s] + height[v]`. For an unreachable $v$, print the sentinel.

The invariant is that `height[v]` is always the length of some walk from the virtual source to $v$, and after $k$ passes it is at most the length of every walk from $q$ to $v$ with at most $k + 1$ edges. The initialization is the case $k = 0$: the zero-weight edge from $q$ to $v$ is a walk of one edge. Each pass extends the bound by one edge.

::: math invariant Invariant
Before the first pass, `height[v]` is the length of the walk $q \to v$ for every vertex. After the $k$-th pass, `height[v]` is at most the length of every walk from $q$ to $v$ that uses at most $k + 1$ edges.
:::

The invariant explains both the termination and the detection. A shortest walk in a graph without a negative cycle can be chosen simple, so it uses at most $V$ edges including the virtual one. After $V - 1$ passes the potentials have stabilized. A change on the $V$-th pass therefore means that a walk with more than $V$ edges is still improving the distance, and such a walk must contain a negative cycle.

## Step-by-step execution

Take the directed graph on vertices $0, 1, 2, 3$ with these edges:

| Edge      | Weight |
| --------- | ------ |
| $0 \to 1$ | $4$    |
| $0 \to 2$ | $5$    |
| $1 \to 2$ | $-3$   |
| $2 \to 3$ | $2$    |
| $3 \to 0$ | $1$    |

**Potentials.** Every vertex starts at zero.

1. Pass 1. The edge $0 \to 1$ gives $0 + 4 = 4$, which does not beat $0$. The edge $1 \to 2$ gives $0 - 3 = -3$, so `height[2] = -3`. The edge $2 \to 3$ gives $-3 + 2 = -1$, so `height[3] = -1`. The edge $3 \to 0$ gives $-1 + 1 = 0$, which does not beat $0$. The potentials are now $[0, 0, -3, -1]$.
2. Pass 2. No edge improves its target: $1 \to 2$ now gives $-3$, which ties `height[2]`, and $2 \to 3$ gives $-1$, which ties `height[3]`. The pass makes no change, so the potentials are final and there is no negative cycle.

**Reweighting.** The reduced weights are the ones in the table of the visual intuition section: $4$, $8$, $0$, $0$ and $0$. Every one is nonnegative.

**Dijkstra from $0$.** The reduced distances are $0, 4, 4, 4$ for vertices $0, 1, 2, 3$. The route to $2$ is $0 \to 1 \to 2$, which costs $4 + 0 = 4$ in reduced units. Recovering the original values with `reduced[v] - height[0] + height[v]` gives

$$
0,\quad 4 + 0 = 4,\quad 4 - 3 = 1,\quad 4 - 1 = 3.
$$

The route $0 \to 1 \to 2$ costs $4 - 3 = 1$ in the original graph, which is cheaper than the direct edge of weight $5$.

**Dijkstra from $1$.** The reduced distances are all zero, because $1 \to 2$, $2 \to 3$ and $3 \to 0$ all have reduced weight zero. Recovering them with `reduced[v] - height[1] + height[v]` gives $0, 0, -3, -1$. The negative values are the original edge weights, which is correct: from vertex $1$, the cheapest route to vertex $2$ is the single negative edge.

**The full matrix.** Repeating the last two phases for every source gives

```text
0 4 1 3
0 0 -3 -1
3 7 0 2
1 5 2 0
```

The diagonal is zero, because the empty path always costs zero. The negative entries are the rebates, and the matrix is not symmetric, because the graph is directed.

The order of the $V$ Dijkstra runs does not matter. Each run starts from a fresh distance array and a fresh heap, and the potentials are read-only once they have been computed. That independence is what makes the $V$ runs easy to write as a loop.

## Correctness proof

::: math theorem Theorem
If the graph has no negative cycle, the algorithm reports $d(s, t)$ for every ordered pair $(s, t)$, and the sentinel for every pair that is not connected.
:::

::: math proof Proof
The first claim is that the potentials are feasible. The Bellman-Ford loop stops only after a complete pass makes no change. If some edge $(u, v)$ had $h(u) + w < h(v)$, that pass would have changed $h(v)$, so no such edge exists. Hence $h(v) \le h(u) + w(u, v)$ for every edge, which is exactly feasibility. $\square$
:::

::: math proof Proof
The second claim is that reweighting preserves path lengths up to the endpoint shift. For a path $P = v_0, v_1, \ldots, v_k$,

$$
w_h(P) = \sum_{i=1}^{k} \bigl(w(v_{i-1}, v_i) + h(v_{i-1}) - h(v_i)\bigr) = w(P) + h(v_0) - h(v_k),
$$

because every internal vertex appears once with each sign. The shift depends only on the endpoints, so for fixed $s$ and $t$ it is the same for every path. Therefore a path minimizes $w$ exactly when it minimizes $w_h$. $\square$
:::

::: math proof Proof
The third claim is that Dijkstra computes the right values on the reweighted graph. Every reduced weight is nonnegative by feasibility, so the greedy step is safe by the correctness of [Dijkstra's algorithm](/algorithms/graphs/dijkstra). For a reachable pair $(s, t)$, the reduced distance is $d_h(s, t) = d(s, t) + h(s) - h(t)$, and rearranging gives $d(s, t) = d_h(s, t) - h(s) + h(t)$, which is the value the program prints. An unreachable pair has reduced distance infinity, and the program prints the sentinel. $\square$
:::

::: math proof Proof
The fourth claim is that a negative cycle is reported exactly when one exists. The virtual source has a zero-weight edge to every vertex, so every cycle is reachable from it. If a negative cycle exists, walking around it repeatedly produces walks of unboundedly decreasing length, so the potentials can never stabilize and some edge relaxes on every pass; in particular, the $V$-th pass changes and the program reports the cycle. If no negative cycle exists, every shortest walk can be chosen simple, so it uses at most $V$ edges including the virtual edge, and $V - 1$ passes suffice to find it. The $V$-th pass then makes no change, and the program proceeds to the matrix. $\square$
:::

The proof does not assume that the graph is connected. The virtual source is what removes that case: every vertex has a finite potential, even when it is isolated from every real edge, and the reduced weights are still nonnegative. An isolated vertex is simply unreachable from every other real vertex, so its row and column are the sentinel except on the diagonal.

The proof also does not assume that the potentials are unique. If several shortest walks from the virtual source tie, Bellman-Ford records one of them, and any one of them is feasible. Different tie-breaking orders produce different potentials, different reduced weights, and the same final distances. That is why the six language versions may explore vertices in different orders and still agree byte for byte on the output.

## Complexity analysis

**Bellman-Ford: $O(VE)$.** There are at most $V$ passes, and each pass examines every edge once. The early exit when a pass makes no change improves the constant but not the bound.

**The $V$ Dijkstra runs: $O(V(V + E) \log V)$.** Each run settles at most $V$ vertices and relaxes at most $E$ edges. With a binary heap and lazy deletion, a push or a pop costs $O(\log E)$, which is $O(\log V)$ for a simple graph. The stale entries add at most one pop per successful relaxation, so the total is still $O((V + E) \log V)$ per source.

**Total time: $O(VE + V(V + E) \log V)$.** For a sparse graph with $E = O(V)$, this is $O(V^2 \log V)$, which is the reason to use Johnson instead of Floyd. For a dense graph with $E = O(V^2)$, it is $O(V^3 \log V)$, which is asymptotically worse than Floyd-Warshall's $O(V^3)$ with a much smaller constant, so Floyd wins on dense inputs.

**Auxiliary space: $O(V + E)$.** The adjacency list holds $O(V + E)$ entries; the potentials, the distance array and the heap hold $O(V)$ and $O(E)$ entries. The output matrix is $O(V^2)$ if it is materialized, but it can be printed one row at a time, and the reference program does exactly that.

Two practical warnings belong here. First, the potentials, the reduced weights and the distances must be stored in a type that can hold a sum of weights. With $V$ edges of weight up to $10^9$, a shortest path can be around $2 \cdot 10^{12}$, and the intermediate reduced values can be larger than the final answer; a 32-bit integer is not enough. The reference implementations use 64-bit integers, except in JavaScript, where a number beyond $2^{53}$ loses precision. Second, the heap operations dominate the running time in practice, so the $V$ runs should reuse one heap buffer and one distance array rather than allocate them per source.

::: math complexity Complexity
Johnson's algorithm: time $O(VE + V(V + E) \log V)$, auxiliary space $O(V + E)$. On a sparse graph the time is $O(V^2 \log V)$; on a dense graph Floyd-Warshall is preferable.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| All pairs, any weights, $n \le 400$ | Floyd-Warshall |
| All pairs, sparse, some negative weights, no negative cycle | Johnson's algorithm |
| All pairs, sparse, every weight nonnegative | Dijkstra from every vertex |
| All pairs, some negative weights, a negative cycle may exist | Johnson, with Bellman-Ford detection |
| One source, some negative weights | Bellman-Ford |
| One source, every weight nonnegative | Dijkstra |
| One source, weights zero or one | 0-1 BFS |
| Fewest edges, unweighted | Breadth-first search |
| All pairs, dense, negative cycle detection is the only goal | Floyd-Warshall or one Bellman-Ford run |

The table below puts the all-pairs methods side by side.

|  | Floyd-Warshall | Dijkstra from every vertex | Johnson | Bellman-Ford from every vertex |
| --- | --- | --- | --- | --- |
| Weight assumption | Any, but no negative cycle | Nonnegative | Any, but no negative cycle | Any |
| Negative cycle | Detected on the diagonal | Not detected | Detected by Bellman-Ford | Detected by the last pass |
| Time | $O(V^3)$ | $O(V(V + E) \log V)$ | $O(VE + V(V + E) \log V)$ | $O(V^2 E)$ |
| Space | $O(V^2)$ | $O(V + E)$ | $O(V + E)$ | $O(V)$ |
| Best fit | Dense small graphs | Sparse nonnegative graphs | Sparse graphs with negative edges | Small graphs, one source at a time |

Read the table from the density of the graph. Floyd-Warshall does the same cubic work whether the graph has ten edges or a million, so it is the wrong tool for a sparse graph with $n = 2\,000$. Repeated Bellman-Ford is correct on any graph without a negative cycle, but its $V^2 E$ time is the largest in the table and only fits when $V$ and $E$ are both small. Repeated Dijkstra is the fastest method when it applies, and Johnson is the version that makes it apply to negative weights by paying one Bellman-Ford run up front.

Johnson is not a replacement for Floyd-Warshall on dense inputs. The reweighting pass is cheap, but the $V$ Dijkstra runs on a dense graph touch $V^2$ edges each and cost $V^3 \log V$ in total, while Floyd's inner loop is a single comparison and addition. On a graph with $n = 500$ and every pair connected, Floyd is usually the faster program even though its asymptotic bound is worse.

## Reference implementations

The six implementations are published in the manifest with the language, the recommendation for each, the verification status and a link to the raw source. The manifest publishes one `program` variant in each of the six languages, and there is no `minimal` variant, because the output of this technique is a matrix rather than a single value that a reusable function can return.

All six programs implement the same contract.

- The first line holds $n$ and $m$.
- The next $m$ lines hold $u$, $v$ and $w$, with $0$-based vertices, a directed edge from $u$ to $v$, and an integer weight that may be negative.
- The input ends after the edges. There is no source vertex.
- The output is $n$ lines of $n$ integers. The $j$-th number of the $i$-th line is the distance from $i$ to $j$, and $-1$ when $j$ is unreachable from $i$.
- A graph with a negative cycle prints the single line `NEGATIVE CYCLE` instead of any distances.

The programs skip an edge whose endpoint is outside $0 \ldots n - 1$, treat a negative $m$ as zero, and print a single blank line when $n$ is not positive. Those choices are not part of the algorithm; they make malformed input deterministic so that the six language versions can be compared byte for byte.

The implementations differ only in their containers. The C version uses a hand-written binary heap over flat arrays and a linked list of arcs. The C++ version uses `std::priority_queue` with `std::greater`, which orders the pairs by distance and then by vertex. The Java version uses a hand-written heap over a pair of flat arrays, because a `PriorityQueue` of objects would allocate once per relaxation. The Python version uses `heapq` over tuples. The Pascal version uses a hand-written heap, and the JavaScript version uses two parallel arrays. Every version discards a heap entry whose key no longer matches the recorded distance, so a vertex that is reached twice is expanded once.

The output order is canonical: rows from $0$ to $n - 1$, columns from $0$ to $n - 1$, one space between numbers, one line feed after every row. Ties in the heap may be broken differently by different languages, which changes the order in which equal distances are discovered but never the distances themselves.

## Recursion decision

Johnson's algorithm is iterative. The Bellman-Ford phase is a pair of nested loops, and the Dijkstra phase is a loop around a heap. There is no natural recursive formulation of either, because both algorithms choose the next edge or the next vertex by a global rule: the cheapest tentative distance, or the next edge in the input order.

The recursive shape people try first is a depth-first search with a distance array, and it is wrong for the same reason it is wrong for Dijkstra: it settles vertices in discovery order rather than in order of distance, so the first distance it writes for a vertex need not be the shortest. A recursive Bellman-Ford is possible, but it merely reimplements the loops with a call stack and adds the language's recursion limit to the constraints.

| Language   | Default stack              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the loops  |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the loops  |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the loops  |
| Pascal     | The operating system stack | Depends on the platform | Use the loops  |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the loops  |

The recommendation is the same in every language. The Bellman-Ford phase is a fixed number of passes over a flat edge list, and the Dijkstra phase is a heap loop; neither is improved by recursion.

## Implementation walkthrough

The first two lines of the algorithm are the initialization and the relaxation. They are short, and both are easy to get subtly wrong.

```cpp
std::vector<long long> height(n, 0);
for (int pass = 0; pass < n; ++pass) {
    bool changed = false;
    for (const Edge& edge : edges) {
        const long long candidate = height[edge.from] + edge.weight;
        if (candidate < height[edge.to]) {
            height[edge.to] = candidate;
            changed = true;
        }
    }
    if (!changed) break;
    if (pass == n - 1) negative_cycle = true;
}
```

The initialization to zero is not a placeholder. It is the relaxation of the virtual source's edges, and it is what makes every potential finite. If only one vertex were initialized to zero, the other potentials would stay at infinity, the reduced weights would be meaningless, and the graph would appear disconnected.

The detection is the `pass == n - 1` test after a pass that changed something. Running fewer passes and skipping the test is the usual bug: the matrix looks right on every graph without a negative cycle, and the one test that contains a cycle produces a plausible but wrong matrix instead of the required report.

The reweighting is one line per edge:

```cpp
const long long reduced = edge.weight + height[edge.from] - height[edge.to];
adjacency[edge.from].push_back({edge.to, reduced});
```

The reduced weight is nonnegative by the feasibility lemma. It is worth adding a debug assertion in a local build, because a negative reduced weight means the Bellman-Ford phase did not converge, and Dijkstra will then produce a wrong answer that is hard to trace back to the potential.

The Dijkstra loop is the ordinary one, with the stale check:

```cpp
if (current != distance[v]) {
    continue;                 // a shorter route was found later
}
```

and the relaxation:

```cpp
const long long candidate = current + arc.weight;
if (candidate < distance[arc.to]) {
    distance[arc.to] = candidate;
    heap.push({candidate, arc.to});
}
```

The recovery is the line that is most often written with the wrong sign:

```cpp
const long long answer = distance[v] - height[source] + height[v];
```

Read it as "undo the shift that the source imposed and apply the shift that the target expects". The reduced distance is $d(s, t) + h(s) - h(t)$, so the original distance is the reduced distance minus $h(s)$ plus $h(t)$.

The sentinel is the last detail. The reference programs use a value near $4 \cdot 10^{18}$ for infinity and print $-1$ when the distance still equals it. The sentinel must never be added to a real weight. The potentials start at zero, so Bellman-Ford only ever adds finite values, and Dijkstra only pushes a vertex after a finite relaxation; a guard is still worth keeping if the initialization changes, because an overflow would happen before the comparison could decide anything.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Running Dijkstra on the original weights | A negative edge is discovered after its target was settled, and the distance is wrong | Reweight every edge first |
| Writing `distance[v] + height[source] - height[v]` | The shift is applied in the wrong direction, and the entry for the pair $(s, t)$ is wrong by $2(h(s) - h(t))$ | Use `distance[v] - height[source] + height[v]` |
| Using arbitrary values as potentials | Some reduced weights stay negative and Dijkstra is invalid | Use the shortest distances from the virtual source |
| Connecting the virtual source to one vertex only | Other potentials stay infinite or fail to absorb their negative edges | Initialize every potential to zero |
| Running only $V - 1$ passes and never testing the last one | A negative cycle is silently treated as a finite graph | Test for a change on the $V$-th pass |
| Forgetting that an undirected negative edge is a negative cycle | The program reports an unbounded answer for a valid-looking graph | Treat undirected negative edges as a cycle of length two |
| Using 32-bit integers for the potentials or the distances | A path sum overflows and the matrix contains negative garbage | Use a 64-bit type, and keep the sentinel below its limit |
| Reusing one distance array without resetting it | The second source inherits the first source's distances | Fill the array with the sentinel before every Dijkstra run |
| Treating $-1$ as a real distance | An unreachable vertex participates in a relaxation and becomes reachable | Test the sentinel before adding |
| Reporting a negative cycle that is not reachable from a source | The graph is rejected even though only some pairs are affected | The virtual source makes every cycle reachable, so this is the right global test |

### Why this fails: the sign of the recovery

The recovery formula is short enough to memorize incorrectly, and the error can survive a test suite whose graphs all have zero potentials. Take the graph with one edge $0 \to 1$ of weight $-2$. The virtual source gives $h(0) = 0$ and $h(1) = -2$. The reduced weight of the edge is $-2 + 0 - (-2) = 0$, so Dijkstra from $0$ reports the reduced distance $0$ to vertex $1$.

The correct recovery is

$$
0 - h(0) + h(1) = 0 - 0 + (-2) = -2.
$$

The incorrect recovery that adds the source potential and subtracts the target potential gives

$$
0 + h(0) - h(1) = 0 + 0 - (-2) = 2.
$$

The answer has the right magnitude and the wrong sign. On a larger graph the same mistake makes the entry for the pair $(s, t)$ wrong by $2(h(s) - h(t))$, which can look like a plausible alternative distance rather than an obvious bug.

The same failure appears if the original weights are restored by subtracting the potentials in the wrong order, or if the reweighted graph is built with $w - h(u) + h(v)$ instead of $w + h(u) - h(v)$. The reduced graph can then contain negative edges, and the failure moves from the recovery step to Dijkstra, where it is much harder to see. The invariant to check is that every reduced weight is at least zero before the first Dijkstra run.

## Variants and extensions

- **Early termination for a single target.** When only one target is wanted from a source, stop Dijkstra when the target is extracted. The same change applies to every source when the problem asks only for a few pairs.
- **Path reconstruction.** Record the predecessor of each vertex on every successful relaxation. The predecessors form a shortest-path tree for the source, and the route is recovered by walking back to the source and then adding the potentials back only to the distances, not to the edges.
- **Per-pair negative-cycle reports.** A global `NEGATIVE CYCLE` is enough when one cycle invalidates the whole matrix. When the problem asks which pairs are affected, mark the vertices that relax on the last Bellman-Ford pass, walk back $V$ predecessors to reach a cycle vertex, and propagate forward and backward from it. A pair is unbounded exactly when its source can reach a cycle and its target is reachable from that cycle.
- **Floyd-Warshall for dense graphs.** The cubic dynamic program needs no potentials, detects a negative cycle on the diagonal, and has a much smaller constant on dense inputs. Choosing between the two is a question of density, not of correctness.
- **Potentials for min-cost flow.** The same reweighting idea keeps residual edge costs nonnegative while augmenting along shortest paths, so each augmentation can use Dijkstra instead of Bellman-Ford. The potentials are updated by adding the distances after each augmentation.
- **A Fibonacci heap.** A heap with a decrease-key operation keeps at most $V$ entries per Dijkstra run and gives the same asymptotic bound with a smaller constant in theory. The binary heap with lazy deletion is the version that contest libraries actually provide.
- **Sparse graphs with zero-weight edges.** Nothing changes. Zero is nonnegative, so the reduced graph may contain zero-weight edges, and Dijkstra handles them exactly as it handles positive ones.

## Contest strategy

Under contest pressure, the errors above are what cost points, and each is avoidable with a fixed procedure.

1. **Read the number of sources before the weights.** If the statement asks for one source, Johnson is overkill; use Bellman-Ford or Dijkstra. If it asks for every pair, continue.
2. **Check the density.** Compute whether $V^3$ or $V(V + E) \log V$ is smaller. If the graph is dense, write Floyd-Warshall and skip the potentials entirely.
3. **Check the sign of the weights.** If every weight is nonnegative, run Dijkstra from every vertex. If some are negative, plan for Johnson and for the negative-cycle test.
4. **Decide the output contract before writing code.** Does the problem want a matrix, a minimum over pairs, or query answers? Does a negative cycle invalidate everything, or only some pairs? Write the contract down.
5. **Use a 64-bit type and a safe sentinel.** The potentials can be negative, and a path sum can exceed 32 bits even when every individual weight fits.
6. **Write the Bellman-Ford phase first, and test it on the negative-cycle sample.** If the detection is wrong, every later phase is wasted work.
7. **Assert that every reduced weight is nonnegative** in a local build, or add a temporary check that counts negative reduced edges. A count above zero means the potentials are wrong.
8. **Test the recovery on a one-edge graph with a negative weight.** The answer must be the weight itself. This catches the sign error before the full matrix is printed.

## Worked problems

### Problem 1: the minimum over all pairs

**Restatement.** A directed graph has $N \le 2\,000$ vertices, $M \le 5\,000$ edges, an integer cost between $-10^6$ and $10^6$ on every edge, and up to $100$ test cases. A path may visit the same vertex more than once. Report the minimum shortest-path distance over all ordered pairs of distinct vertices, or `-inf` when a negative cycle exists.

**Naive baseline.** Floyd-Warshall computes every pair in $O(N^3)$ time, which is about eight billion operations for the largest test. Bellman-Ford from every vertex costs $O(N^2 M)$, about twenty billion relaxations. Both are too slow.

**Insight.** The graph is sparse and the weights are negative, which is exactly the shape Johnson's algorithm was designed for. The virtual-source Bellman-Ford run also answers the `-inf` question: a change on the last pass means a negative cycle, and then the answer is immediately `-inf`.

**Derivation.** Read the edges, run the potential computation, and stop with `-inf` if the last pass changes a potential. Otherwise reweight every edge and run Dijkstra from each vertex. Recover each distance with the two potentials, ignore the diagonal, ignore the sentinel, and keep the smallest value seen.

**Correctness.** Without a negative cycle, the potentials are feasible, the reduced weights are nonnegative, and each Dijkstra run returns the correct reduced distance, which the recovery converts to the original distance. The minimum over the finite off-diagonal entries is therefore the requested value. With a negative cycle, the shortest walk is unbounded below, so `-inf` is correct.

**Complexity.** $O(NM + N(N + M) \log N)$ per test case, and $O(N + M)$ auxiliary space. At $N = 2\,000$ and $M = 5\,000$ the dominant term is about $2 \cdot 10^8$ heap operations, which fits in the three-second limit in C++ and Java.

**Common wrong approach.** Running Dijkstra from every vertex on the original graph and adding a special case for negative edges. The special case cannot repair a distance that was already settled, and the resulting matrix is wrong on the first graph where a negative edge points back into the settled region.

### Problem 2: the all-pairs matrix with a global cycle report

**Restatement.** A directed graph has $V \le 100$ vertices and $E \le 9\,900$ edges, with weights between $-2 \cdot 10^7$ and $2 \cdot 10^7$. Print the distance matrix, with `INF` for an unreachable pair, or the single line `NEGATIVE CYCLE` when the graph contains a negative cycle.

**Naive baseline.** At $V = 100$, Floyd-Warshall performs one million iterations and is the practical solution. The point of the problem here is not the running time but the output contract: every pair, a global cycle report, and a sentinel for unreachable pairs.

**Insight.** The small size makes this a verification harness for Johnson's algorithm. The potentials must be finite even when the graph is disconnected, the reduced weights must be nonnegative, and the recovered matrix must match the cubic dynamic program entry by entry.

**Derivation.** Run the virtual-source Bellman-Ford phase. If the last pass changes a potential, print `NEGATIVE CYCLE` and stop. Otherwise reweight the edges, run Dijkstra from every vertex, recover the distances, and print `INF` where the reduced distance is the sentinel. The only adaptation is the sentinel: the reference program prints $-1$, while this problem prints `INF`.

**Correctness.** The theorem of the correctness section applies to every reachable pair. An unreachable pair keeps the sentinel through the recovery, because the reduced distance is infinite and no potential can make it finite. The negative-cycle test is complete because the virtual source reaches every vertex.

**Complexity.** Johnson is $O(VE + V(V + E) \log V)$, which is overkill at $V = 100$ but still comfortably inside the limit. Floyd is $O(V^3)$ and simpler; either answer is accepted.

**Common wrong approach.** Printing the matrix before checking for a negative cycle. A single negative cycle can make many entries unbounded, and the required output is the single report line rather than a partially corrected matrix.

### Problem 3: the query version with per-pair unboundedness

**Restatement.** Several test cases follow. Each starts with $n \le 150$, $m \le 5\,000$ and $q \le 1\,000$, followed by $m$ directed edges with weights between $-1\,000$ and $1\,000$ and then $q$ queries. For each query $(u, v)$, print the distance, `Impossible` when $v$ is unreachable from $u$, or `-Infinity` when the distance is unbounded below. A blank line separates the output of consecutive test cases.

**Naive baseline.** Floyd-Warshall computes the matrix in $O(n^3)$ per test case, which is about three million operations at $n = 150$, and then answers each query in constant time. It is the intended solution at this size, and it handles the negative-cycle case with a diagonal scan.

**Insight.** Johnson's algorithm answers the finite pairs after one Bellman-Ford run and one Dijkstra run per vertex. The difficulty is not the distances but the classification: a negative cycle makes a pair unbounded only when the source can reach the cycle and the target is reachable from it. A single global flag would mark too many pairs.

**Derivation.** Run the potential computation. If it finishes without a negative cycle, reweight the edges, run Dijkstra from every vertex, recover each query in constant time, and print `Impossible` when the sentinel survives. If a negative cycle exists, find the vertices that relax on the last pass, walk back $n$ predecessors from each to land on a cycle vertex, mark every vertex reachable from a cycle vertex, mark every vertex that can reach a cycle vertex, and answer `-Infinity` exactly for the pairs whose source is in the second set and whose target is in the first.

**Correctness.** With no negative cycle, the reweighting theorem gives the exact distance for every pair. With a negative cycle, a walk can loop the cycle arbitrarily many times before continuing to the target, so the distance is unbounded below exactly when the source reaches the cycle and the target is reachable from it. The backward walk from a relaxed vertex lands on a cycle because the improving walk has more edges than vertices; the cycle is negative because the improvements continue.

**Complexity.** $O(nm + n(n + m) \log n)$ per test case for the distances, plus $O(n + m)$ for the reachability sweeps when a cycle exists. At $n = 150$ and $m = 5\,000$ this is small; Floyd is also small and simpler.

**Common wrong approach.** Printing `-Infinity` for every query as soon as any negative cycle is found. A cycle in one component does not affect a pair in another component, and a source that can reach a component downstream of a cycle may not be able to reach the cycle itself.

## Practice progression

1. **Recognition.** Given a statement, decide between Floyd-Warshall, repeated Dijkstra, and Johnson. Write down the number of sources, the sign of the weights, and the density before choosing.
2. **Direct application.** Implement the virtual-source Bellman-Ford phase and print the potentials. Check them against a brute-force Bellman-Ford from every real source on small graphs.
3. **Reweighting.** Build the reduced graph and assert that every reduced weight is nonnegative. Run one Dijkstra from one source and recover the distances; compare against the original graph with a cubic dynamic program.
4. **Negative cycles.** Add the last-pass test and verify it on a graph with a cycle in a disconnected component. The virtual source must still find it.
5. **Adaptation.** Solve the matrix-output problem and the minimum-over-pairs problem with the same core. Change only the printing and the aggregation.
6. **Combination.** Add per-pair unboundedness, path reconstruction through the predecessor array, or an early exit for a single target.
7. **Challenge.** Solve a sparse graph with $n = 2\,000$ and $m = 5\,000$ under a few seconds, with 64-bit weights and a negative cycle that is not reachable from the first source.
8. **Transfer.** Use the same potentials in a min-cost-flow implementation, where they keep the residual costs nonnegative after each augmentation, or use the same Bellman-Ford detection to classify which queries are unbounded.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does Johnson need Bellman-Ford at all, and why is one run enough? (Key insight)
2. What is a feasible potential, and which inequality defines it? (Formal model)
3. Write the reduced weight of an edge and prove it is nonnegative. (Correctness proof)
4. Why does reweighting preserve the shortest path, even though it changes every edge weight? (Key insight)
5. What is the recovery formula, and where does each of its two potential terms come from? (Implementation walkthrough)
6. How does the algorithm detect a negative cycle, and why does the virtual source make the test complete? (Algorithm derivation)
7. Why is the running time $O(VE + V(V + E) \log V)$ rather than $O(V^3)$? (Complexity analysis)
8. When is Floyd-Warshall the better choice despite its worse asymptotic bound? (Algorithm selection)
9. Why is an undirected edge with a negative weight already a negative cycle? (Recognition patterns)
10. What changes when the problem asks which pairs are unbounded instead of whether any cycle exists? (Variants and extensions)

## Further reading

- The reweighted phase is [Dijkstra's algorithm](/algorithms/graphs/dijkstra), and its correctness proof is the one Johnson borrows after the reweighting.
- The potential phase is [Bellman-Ford](/algorithms/graphs/bellman-ford), including the negative-cycle test that Johnson reuses.
- The dense all-pairs alternative is [Floyd-Warshall](/algorithms/graphs/floyd-warshall), which needs no potentials and detects a negative cycle on the diagonal.
- The adjacency list that both phases traverse is described in [graph representation](/algorithms/graphs/representation).
- The wider map of graph techniques, including where Johnson sits, is the [graphs index](/algorithms/graphs/).
- The ordering of a directed acyclic graph, which is the right frame when the graph cannot contain a cycle, is [topological sort](/algorithms/graphs/topological-sort).
- The data-structure background for the adjacency list and the heap is in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
