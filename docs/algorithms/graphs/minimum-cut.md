---
id: graphs.minimum-cut
title: Minimum cut
summary: The cheapest way to split a network into two parts, which the max-flow min-cut theorem identifies with the largest amount of traffic the network can carry.
division: [platinum]
subjects: [graphs]
level: advanced
importance: advanced-technique
keywords:
    [
        maximum flow,
        minimum cut,
        max-flow min-cut,
        residual graph,
        augmenting path,
        ford-fulkerson,
        edmonds-karp,
        dinic,
        stoer-wagner,
        global minimum cut,
        vertex cut,
    ]
prerequisites:
    required: [graphs.representation, graphs.dijkstra]
    recommended: [graphs.bfs, graphs.dsu, graphs.bellman-ford]
complexity:
    time: "O(V E^2) for Edmonds-Karp, O(V^2 E) for Dinic"
    space: "O(V + E)"
assumptions:
    - Every edge capacity is nonnegative, and the network is a directed flow network with a source and a sink.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find the cheapest partition of a network into two parts, or the largest amount of traffic it can carry |
| **Time** | $O(V E^2)$ for Edmonds-Karp, $O(V^2 E)$ for Dinic in general |
| **Auxiliary space** | $O(V + E)$ for the network and the residual graph |
| **Requires** | Nonnegative capacities |
| **Fails when** | The cut is computed from a set other than the residual-reachable set, or the edges in the wrong direction are counted |
| **Primary technique** | Augmenting paths in the residual graph |
| **Related** | Vertex cuts, node splitting, Menger's theorem, bipartite matching |

The max-flow min-cut theorem is the single most useful equality in practical graph algorithms. It says that the largest amount of traffic a network can carry equals the cheapest way to break it. Either question answers the other.

## Problem motivation

A pipeline company has a network of $n$ pumping stations joined by $m$ pipelines. Each pipeline $u \to v$ has a capacity: the maximum number of units per hour that can flow along it.

Two questions are asked, and they are the same question.

- **Flow question.** What is the largest amount of raw material that can be moved from the depot $s$ to the refinery $t$ every hour?
- **Cut question.** The company is considering a strike at one location that shuts a set of stations. How much does the strike have to cost before the network stops delivering at all? More precisely: what is the cheapest set of pipes to close so that no material can reach $t$?

The constraints are what make the problem interesting:

- $1 \le n \le 200\,000$ stations and $0 \le m \le 400\,000$ pipelines.
- Every capacity is a nonnegative integer.
- The network is directed, and each pipeline has a fixed direction.

The two questions look different and are identical. The max-flow min-cut theorem states that the largest flow equals the smallest cut, so once one is computed the other follows, and a program that reports the cut also reports the flow.

The cut question also has a version with no source and no sink: the **global minimum cut**, which is the cheapest partition of the network into two nonempty parts with no restriction on which part holds the depot. That is a harder problem and it has its own algorithm.

## Recognition patterns

Flow and cut are the right tools when all of the following hold.

- The problem asks **how much** can be sent, **through** a network, or what the **cheapest** way is to **separate** two sets of vertices is.
- The network has a natural **source** and **sink**, or the question asks for a partition with no restriction.
- Each edge has a **capacity**: a limit on how much may pass through it.
- The quantities are **additive**: the cost of a set of edges is the sum of their capacities.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Capacities are nonnegative integers | Rules in every augmenting-path algorithm; negative capacities need a different treatment |
| Capacities may be negative | Rules out the standard flow model; transform the network or use a flow with lower bounds |
| $n \le 10^3$ and $m \le 10^4$ | Any of the standard algorithms is comfortable |
| $n, m \le 2 \cdot 10^5$ | Dinic is required; Edmonds-Karp is too slow on a large sparse graph |
| Capacities are all equal to one | A much faster algorithm exists, and the problem is often a matching problem instead |
| The graph is undirected | Replace each edge by two antiparallel arcs of the same capacity |
| The question is about **vertices** rather than edges | Use node splitting to turn it into an edge cut |
| The question is the **global** minimum cut, with no source and sink | Use Stoer-Wagner in the undirected case, or $V - 1$ flow computations |
| The graph is a tree | Every edge is a cut edge; the flow is a single path and the min cut is the smallest capacity on it |

Two phrases in a statement are reliable signals. "How much can be sent" and "what is the cheapest way to disconnect" both point here. "The shortest path" points away, because that question has exactly one path per pair and no capacity.

<Synonyms terms="maximum flow, minimum cut, max-flow min-cut, residual graph, augmenting path, ford-fulkerson, edmonds-karp, dinic, stoer-wagner, global minimum cut, vertex cut, node splitting, edge connectivity" />

## Naive approach

The baseline for the flow question is to push material along paths greedily without ever taking it back.

```text
flow = 0
repeat:
    find any path from s to t using edges with remaining capacity
    if there is no such path: stop
    push the smallest remaining capacity along the path
    flow = flow + that amount
```

This is Ford-Fulkerson's algorithm, and it is correct when it terminates. The problem is that it need not terminate quickly. With the wrong capacities it can take an exponential number of augmentations, because each augmentation may push a single unit along a long detour.

The baseline for the cut question is to enumerate the partitions. There are $2^{n-1} - 1$ nontrivial partitions of $n$ vertices, which is hopeless at any size above thirty.

A third baseline is to remove each edge in turn and test reachability, which costs $O(m(V + E))$ and only finds cuts of size one.

All three baselines miss the structure that makes the problem tractable: the cut and the flow are the same number, and that number is found by improving a flow until it cannot be improved.

## Key insight

The insight is that **a cut is a lower bound on every flow, and the two can always be made equal**.

Start with the easy half. Take any flow $f$ and any partition of the vertices into a source side $S$ and a sink side $T$, with $s \in S$ and $t \in T$. Look at the net amount of material crossing from $S$ to $T$. Because material is conserved at every vertex other than $s$ and $t$, the net amount crossing the partition in one direction equals the total amount that left $s$, minus what came back. So the total flow value is at most the total capacity of the edges leaving $S$, and that total is the capacity of the cut.

This is _weak duality_: for every flow and every cut, the flow is at most the cut. It holds for every pair, so the maximum flow is at most the minimum cut.

The hard half is that the bound is always attained. Start with the flow of value zero and improve it. The improvement step uses the **residual graph**: for each edge $u \to v$ of capacity $c$, the residual graph has an edge $u \to v$ of capacity $c - f(u, v)$ and an edge $v \to u$ of capacity $f(u,v)$. The second edge is the important one. It says that material already in the pipe can be sent **backwards**, which is what lets a bad early choice be undone.

An **augmenting path** is a path from $s$ to $t$ in the residual graph. Sending material along it increases the flow by the smallest residual capacity on the path. When no augmenting path exists, the flow is maximum, and the vertices reachable from $s$ in the residual graph cut the network at exactly the flow value.

That is the whole algorithm, and the proof below shows both halves.

## Formal model

Let $G = (V, E)$ be a directed graph with a source $s$, a sink $t$, and a capacity $c(u, v) \ge 0$ on each edge.

::: math definition Definition
A **flow** is a function $f : E \to \mathbb{R}_{\ge 0}$ satisfying the
capacity constraint $f(u, v) \le c(u, v)$ for every edge, and the conservation
condition
$\sum_{u} f(u, v) = \sum_{w} f(v, w)$ for every vertex $v \notin \{s, t\}$.
Its **value** is $\lvert f \rvert = \sum_{u} f(s, u)$.
:::


::: math definition Definition
An **$s$-$t$ cut** is a partition $(S, T)$ of $V$ with $s \in S$ and $t \in T$.
Its **capacity** is
$c(S, T) = \sum_{\substack{(u, v) \in E \\ u \in S,\ v \in T}} c(u, v)$,
the total capacity of the edges that leave $S$. Only the edges in the
direction from $S$ to $T$ are counted.
:::


::: math definition Definition
The **residual graph** of a flow $f$ has, for each edge $(u,v)$ of $G$, an
edge $u \to v$ of residual capacity $c(u,v) - f(u,v)$ and an edge $v \to u$ of
residual capacity $f(u,v)$. The reverse edge exists so that material already
committed can be withdrawn.
:::


::: math theorem Theorem (the max-flow min-cut theorem)
For every flow network, the maximum value of a flow equals the minimum
capacity of an $s$-$t$ cut. That is, there exist a flow $f$ and a cut $(S, T)$
such that $\lvert f \rvert = c(S, T)$, and for every flow and every cut,
$\lvert f \rvert \le c(S', T')$.
:::


::: math lemma Lemma (weak duality)
For every flow $f$ and every $s$-$t$ cut $(S, T)$,
$\lvert f \rvert \le c(S, T)$.
:::


::: math proof Proof
By conservation, the net flow out of $S$ equals the net flow into $T$, and the
net flow out of $S$ is $\lvert f \rvert$ because $s$ is the only vertex of $S$
that is not conserved and $t$ is outside $S$. Writing the net flow as a sum
over the edges of the cut gives

$$
\lvert f \rvert = \sum_{\substack{(u,v) \in E \\ u \in S,\ v \in T}} f(u,v) \;-\; \sum_{\substack{(u,v) \in E \\ u \in T,\ v \in S}} f(u,v) \;\le\; \sum_{\substack{(u,v) \in E \\ u \in S,\ v \in T}} c(u,v) = c(S, T),
$$

because the second sum is nonnegative and the capacity constraint bounds the first term. $\square$
:::


## Algorithm derivation

The state is the flow on each edge, the residual capacities, and the total flow value.

The update rule is the augmenting path step.

```text
flow = 0 on every edge
repeat:
    find an augmenting path P from s to t in the residual graph
    if there is none: stop
    delta = the smallest residual capacity on P
    for each edge (u, v) on P, in order:
        f(u, v) = f(u, v) + delta
        residual capacity of u -> v decreases by delta
        residual capacity of v -> u increases by delta
    flow = flow + delta
```

The update is correct because pushing along an augmenting path keeps every constraint satisfied. The capacity constraint holds because $\delta$ is at most the residual capacity of every edge on the path. Conservation holds because every intermediate vertex on the path gains as much as it loses. The reverse edges are updated automatically, because withdrawing material from an edge is the same as sending material along the reverse direction.

The three standard implementations differ in how the augmenting path is found.

- **Ford-Fulkerson** finds any path, usually by a depth-first search. Its running time is $O(E \cdot \lvert f \rvert)$, which is only good when the capacities are small.
- **Edmonds-Karp** finds the path by a **breadth-first search**, so the path found is a shortest one. The running time is $O(V E^2)$.
- **Dinic** finds paths in layers, blocking off all the shortest paths at once with a level graph, and then repeats. The running time is $O(V^2 E)$ in general, $O(V^{2/3} E)$ for networks in which every edge has unit capacity, and $O(E \sqrt{V})$ for unit networks, which is the case that bipartite matching reduces to.

To recover the cut, once no augmenting path remains, compute the set $S$ of vertices reachable from $s$ in the residual graph. Then $(S, V \setminus S)$ is a minimum cut, and the edges leaving $S$ are the ones to close.

::: math invariant Invariant
At every moment, the current assignment is a valid flow: every edge carries at
most its capacity, and every vertex other than $s$ and $t$ is conserved. The
residual capacities are exactly the capacities that could still be used.
:::


::: math invariant Invariant
At every moment, $\lvert f \rvert \le c(S', T')$ for every $s$-$t$ cut
$(S', T')$, by weak duality. In particular, the current flow never exceeds the
value of the cut that will eventually be found.
:::


## Step-by-step execution

Take the network with vertices $s, a, t$ and edges $s \to a$ of capacity $3$, $a \to t$ of capacity $2$, and $s \to t$ of capacity $1$.

1. The flow is zero. The residual graph has $s \to a$ of capacity $3$, $a \to t$ of capacity $2$, and $s \to t$ of capacity $1$. A breadth-first search finds the shortest augmenting path, which is the single edge $s \to t$. The smallest residual capacity on it is $1$, so $f(s, t) = 1$ and the flow value is $1$. The residual capacity of $s \to t$ becomes $0$, and the residual capacity of $t \to s$ becomes $1$.
2. The next breadth-first search finds the path $s \to a \to t$. The smallest residual capacity on it is $\min(3, 2) = 2$, so $f(s, a) = 2$, $f(a, t) = 2$, and the flow value is $3$. The residual capacities become $s \to a: 1$, $a \to t: 0$, and the reverse edges get $a \to s: 2$ and $t \to a: 2$.
3. The next search finds no path from $s$ to $t$: the edge $a \to t$ is saturated, and the direct edge $s \to t$ is saturated. The algorithm stops with a flow of value $3$.
4. The residual-reachable set from $s$ is computed. From $s$ the residual edge $s \to a$ has capacity $1$, so $a$ is reachable. From $a$ the residual edge $a \to s$ leads back, and $a \to t$ has capacity $0$, so $t$ is not reachable. So $S = \{s, a\}$ and $T = \{t\}$.
5. The cut capacity is $c(s, t) + c(a, t) = 1 + 2 = 3$, which equals the flow value.

The minimum cut is the pair of edges $s \to t$ and $a \to t$, and closing either of them alone would not stop the flow, while closing both does. That is exactly what the cut of capacity $3$ says.

Now consider a modification: add an edge $t \to a$ of capacity $5$. The flow does not change, because $t$ is the sink and material never leaves it. The cut of capacity $3$ does not change either, because the new edge goes from $T$ to $S$ and cuts count only the edges from $S$ to $T$.

## Correctness proof

::: math theorem Theorem
When the algorithm stops, the set $S$ of vertices reachable from $s$ in the
residual graph defines a cut whose capacity equals the flow value, and the
flow is maximum.
:::


::: math proof Proof
First, the flow is valid at every stage. The initial flow of zero is valid.
Suppose the current flow is valid and an augmenting path $P$ is found. Let
$\delta$ be the smallest residual capacity on $P$. Pushing $\delta$ along $P$
does not exceed the capacity of any edge on it, because the residual capacity
of an edge $u \to v$ is $c(u,v) - f(u,v)$ and $\delta$ is at most that. Every
intermediate vertex of $P$ gains $\delta$ on one edge and loses $\delta$ on
another, so conservation is preserved. The vertices $s$ and $t$ are not
intermediate. So the new flow is valid and its value has increased by
$\delta$. $\square$

Now suppose the algorithm stops, so no augmenting path exists. Let $S$ be the set of vertices reachable from $s$ in the residual graph. Since there is no augmenting path, $t \notin S$.

Every edge $(u, v)$ with $u \in S$ and $v \notin S$ must be saturated. If it were not, the residual graph would have an edge $u \to v$ with positive residual capacity, and $v$ would be reachable from $s$ through $u$, a contradiction. So $f(u, v) = c(u, v)$ for every edge leaving $S$.

By conservation, the net flow out of $S$ equals $\lvert f \rvert$, and every edge leaving $S$ carries its full capacity while no edge entering $S$ carries flow back, because an edge entering $S$ with positive flow would give the residual graph an edge out of $S$, making its head reachable and hence in $S$, and the head of such an edge is in $S$ by assumption. So

$$
\lvert f \rvert = \sum_{\substack{(u,v) \in E \\ u \in S,\ v \notin S}} f(u,v) = \sum_{\substack{(u,v) \in E \\ u \in S,\ v \notin S}} c(u,v) = c(S, V \setminus S).
$$

By weak duality, every flow has value at most the capacity of every $s$-$t$ cut, and in particular at most $c(S, V \setminus S) = \lvert f \rvert$. So $\lvert f \rvert$ is at least the maximum flow value, and it is a valid flow, so it is exactly the maximum flow value, and the cut found is a minimum cut. $\square$
:::


::: math theorem Theorem (the global minimum cut)
Let $G$ be a directed graph and fix any vertex $s$. Then the global minimum
cut of $G$, that is, the minimum capacity over all partitions of $V$ into two
nonempty parts, equals $\min_{t \ne s} \operatorname{mincut}(s, t)$.
:::


::: math proof Proof
Every $s$-$t$ cut is a partition of $V$ into two nonempty parts, so
$\operatorname{mincut}(s,t) \ge \lambda$, where $\lambda$ is the global minimum cut. Now let
$(S, T)$ be a partition achieving $\lambda$. Some vertex $u$ lies in $S$ and
some vertex $v$ lies in $T$. Then the $u$-$v$ cut $(S, T)$ has capacity
$\lambda$, so $\operatorname{mincut}(u,v) \le \lambda$.

We need a bound involving the fixed vertex $s$. If $s \in S$, take $t = v$: the $s$-$v$ cut $(S,T)$ has capacity $\lambda$, so $\operatorname{mincut}(s,v) \le \lambda$, and therefore $\min_{t} \operatorname{mincut}(s,t) \le \lambda$. If $s \in T$, take $t = u$ and the same argument applies with the roles of the two parts exchanged. Together with the opposite inequality this gives equality. $\square$
:::


## Complexity analysis

**Edmonds-Karp: $O(V E^2)$ time.** Every augmenting path is found by a breadth-first search in $O(E)$ time, the path is shortest, and the shortest path length strictly increases after each augmentation, so there are at most $O(V)$ augmentations.

**Dinic: $O(V^2 E)$ time in general.** Each phase builds a level graph and finds a blocking flow in $O(V E)$ time, and there are at most $O(V)$ phases. When every edge has unit capacity the bound improves to $O(V^{2/3} E)$, and for a unit network, which is the shape that bipartite matching reduces to, it is $O(E \sqrt{V})$.

**Ford-Fulkerson: $O(E \lvert f \rvert)$ time** with integer capacities, because each augmentation increases the flow by at least one. The bound is only useful when the capacities are small.

**Global minimum cut.** Stoer-Wagner's algorithm computes the global minimum cut of an **undirected** graph in $O(V^3)$ time and $O(V^2)$ space. The alternative, by the theorem above, is $V - 1$ maximum-flow computations, which costs $O(V \cdot \text{maxflow})$ and is the method of choice for a directed graph.

**Auxiliary space: $O(V + E)$** for the network, the residual graph, and the arrays of capacities and flows.

::: math complexity Complexity
Maximum flow and minimum cut in a network with $V$ vertices and $E$ edges:
$O(V E^2)$ time for Edmonds-Karp, $O(V^2 E)$ for Dinic in general and
$O(E \sqrt{V})$ for unit networks. Global minimum cut of an undirected graph:
$O(V^3)$ time by Stoer-Wagner, or $V - 1$ maximum-flow computations.
:::


Two practical warnings belong here. The capacities must be stored in a type wide enough for the total flow, which can reach the sum of all capacities and is routinely larger than $2^{31}$. And the residual graph must be built explicitly, with the reverse edges, because the reverse edges are what makes the algorithm able to undo an early mistake.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The largest amount of traffic through a network | Maximum flow, then read the cut from the residual graph |
| The cheapest way to disconnect a source from a sink | The same computation; the answer is the cut |
| The cheapest partition of the network into two parts | Stoer-Wagner in the undirected case, or $V - 1$ flows |
| The minimum number of **vertices** whose removal disconnects $s$ from $t$ | Node splitting, then an edge cut |
| The maximum number of edge-disjoint paths from $s$ to $t$ | Maximum flow, by Menger's theorem |
| The minimum number of edges whose removal disconnects $s$ from $t$ | Maximum flow, by Menger's theorem |
| A matching between two sides of a graph | A flow network with unit capacities, or a dedicated matching algorithm |
| The cheapest way to ship the goods with per-unit costs | Minimum-cost flow, not maximum flow |
| Flows with a required minimum on some edges | A flow with lower bounds, transformed by a circulation |
| A graph with no capacities at all | Reachability, not flow |

The last two rows matter in contests, where the statement says "at least" on some edge or mentions a per-unit price. Both need a different algorithm, and reaching for maximum flow in those cases is a wasted afternoon.

## Recursion decision

The augmenting path search is the only part of the algorithm that could recurse, and it should not.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a breadth-first search with a queue is short |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A directed path $s \to v_1 \to v_2 \to \cdots \to v_{10^6} \to t$, with every
capacity equal to one. The maximum flow is one, and every augmenting path has
$10^6 + 2$ vertices. A recursive path search makes one nested call per vertex,
so in C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack
is exhausted after about $130\,000$ frames, and the program dies with a
segmentation fault before it has sent a single unit. The iterative breadth-first
search sends one unit and stops.
:::


The breadth-first search in Edmonds-Karp is naturally a queue, so there is no reason to write it recursively. Dinic's level graph is a layered structure built by a single breadth-first sweep, and its blocking flow is a depth-first search over the levels, which is the one place where an explicit stack is needed.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Not adding the reverse edges to the residual graph | The flow cannot be adjusted and the answer is wrong | Add $v \to u$ with residual capacity $f(u,v)$ for every edge $u \to v$ |
| Reading the cut from the set of vertices with positive flow | The cut is wrong | Read it from the residual-reachable set |
| Counting the edges from $T$ to $S$ as well | The reported cut is too large | Count only the edges leaving $S$ |
| Using a directed edge in the wrong direction | The flow is wrong | Keep the direction when building the residual graph |
| Reporting the $s$-$t$ min cut as the global min cut | The answer is too large | Use $V - 1$ flows, or Stoer-Wagner |
| Using a 32-bit integer for the total flow | The total overflows on a large network | Use a 64-bit type |
| Forgetting that a vertex with capacity zero still exists | The vertex set is wrong | Keep the zero-capacity vertices in the graph |
| Replacing an undirected edge by one arc in one direction | Half the capacity is lost | Use two antiparallel arcs |
| Stopping the augmentation at the first path found with a depth-first search | The running time can be exponential | Use a breadth-first search, that is Edmonds-Karp |

### Why this fails: the degree that is not the cut

The mistake that survives review most often is estimating the cut by looking at the degrees of the vertices, on the theory that the cheapest split isolates the cheapest vertex.

The smallest counterexample is two triangles joined by a single edge.

Take the vertices $\{a, b, c\}$ forming a triangle and the vertices $\{d, e, f\}$ forming a second triangle, joined by the edge $c-d$. Every edge has capacity one.

The degrees are: $a$ has two edges, $b$ has two, $c$ has three, $d$ has three, $e$ has two, $f$ has two. The smallest degree is two.

Now consider the cut that separates $\{d, e, f\}$ from $\{a, b, c\}$. The only edge crossing it is $c-d$, so the cut has capacity one. Every other cut has capacity at least two, because separating any vertex of degree two from the rest cuts two edges.

So the global minimum cut is one, while the smallest degree is two. An implementation that reports the smallest degree as the answer is wrong by a factor of two, and it is wrong in a way that no amount of testing on a tree would reveal, because in a tree the two numbers do agree.

The reason the two numbers differ is exactly the point of the whole subject. The cut that matters is the cheapest **partition**, and the cheapest partition is not always the isolation of a single vertex.

### Why this fails: the source cut that is not the global cut

The second mistake is reporting the minimum $s$-$t$ cut as the answer to a question about the global minimum cut.

Take four vertices $1, 2, 3, 4$ with undirected edges of capacities $c(1,2) = 100$, $c(2,3) = 1$, and $c(3,4) = 100$. The source is $1$ and the sink is $2$.

The maximum flow from $1$ to $2$ is $100$, because the only path from $1$ to $2$ is the direct edge. After the augmentation, the residual capacity of that edge is zero and $1$ has no other outgoing edge, so the residual-reachable set is $S = \{1\}$. The reported cut is $(\{1\}, \{2,3,4\})$, with capacity $100$.

The global minimum cut of the graph is the cut that separates $\{1,4\}$ from $\{2,3\}$, whose capacity is $c(2,3) = 1$. The cheapest partition of this network costs one, and the algorithm that reports $100$ is off by a factor of a hundred.

The reason is structural. The source and the sink force the partition: with $1$ on one side and $2$ on the other, the edge $c(1,2) = 100$ must cross the cut, so no cheap cut is available. The global minimum cut has no such restriction, and it can be anywhere in the graph.

### Why this fails: the cut that counts both directions

The third mistake is summing the capacities of all edges between the two parts, in both directions, rather than only the ones leaving the source side.

The smallest counterexample that shows it is the network used in the step-by-step section, with one extra edge: the vertices $s, a, t$, the edges $s \to a$ of capacity $3$, $a \to t$ of capacity $2$, $s \to t$ of capacity $1$, and $t \to a$ of capacity $5$.

The maximum flow is $3$, and the minimum cut is the pair $\{s \to t, a \to t\}$ with capacity $1 + 2 = 3$.

An implementation that sums the capacities in both directions across the partition $\{s, a\}$ against $\{t\}$ adds the edge $t \to a$ of capacity $5$, and reports $8$.

The truth is $3$. The edge $t \to a$ points into the source side, and a cut only counts what leaves it. The distinction is invisible in an undirected network, where every crossing edge is counted once either way, so the bug survives every undirected test case.

## Variants and extensions

- **Node splitting.** To find the minimum number of vertices whose removal disconnects $s$ from $t$, replace each vertex $v$ by two vertices joined by an edge of capacity one, give every other edge infinite capacity, and find the minimum cut. The result is a vertex cut.
- **Menger's theorem.** The maximum number of edge-disjoint paths from $s$ to $t$ equals the minimum size of an edge cut separating them, which is the minimum cut. The same holds for vertex-disjoint paths and vertex cuts.
- **Minimum-cost flow.** When each unit of flow has a cost as well as a capacity, the objective becomes the total cost rather than the total amount, and the algorithm becomes a successive-shortest-path method with potentials.
- **Flows with lower bounds.** When each edge must carry at least some amount, a circulation is constructed first and the network is transformed so that the lower bounds become zero.
- **Stoer-Wagner.** The $O(V^3)$ algorithm for the global minimum cut of an undirected graph, based on a maximum-adjacency search that contracts vertices.
- **Gomory-Hu trees.** A structure that answers the minimum cut between **every pair** of vertices with $V - 1$ flow computations, one for each vertex.
- **Unit networks.** When every edge has capacity one, Dinic's bound improves and the problem is often a bipartite matching, for which a dedicated algorithm is faster still.
- **Directed global minimum cut.** The minimum over all partitions of a directed graph is computed with a flow from each vertex to a super-sink, and is harder than the undirected case.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Read the statement twice and decide which of the three questions it is: a maximum flow, an $s$-$t$ minimum cut, or a global minimum cut. They have different answers.
2. Choose the algorithm from the constraints. A small network takes Edmonds-Karp; a large sparse network takes Dinic; an undirected global cut takes Stoer-Wagner.
3. Build the residual graph with the reverse edges from the start. Retrofitting them is the source of most wrong answers.
4. Read the cut from the residual-reachable set, never from the flow values.
5. Count only the edges leaving the source side.
6. Use a 64-bit type for the capacities and the total flow.
7. Test three networks by hand: a single edge, a triangle with a direct shortcut, and the graph $1 \xrightarrow{100} 2 \xrightarrow{1} 3 \xrightarrow{100} 4$. The third catches the confusion between the $s$-$t$ cut and the global cut.

## Worked problems

### Problem 1: the pipeline capacity

**Restatement.** A directed network has $n$ stations and $m$ pipelines, each with a nonnegative integer capacity. A source $s$ and a sink $t$ are given. Report the largest amount of material per hour that can reach $t$ from $s$. Constraints: $1 \le n \le 2\,000$ and $0 \le m \le 20\,000$.

**Naive baseline.** Ford-Fulkerson with a depth-first search for the augmenting path, whose running time is $O(E \cdot \lvert f \rvert)$ and can be very large when the capacities are large.

**Insight.** The flow value is bounded by the capacity of every cut, and a maximum flow can be found by pushing material along shortest residual paths until no such path exists.

**Derivation.** Build the residual graph, and repeat a breadth-first search from $s$; when it reaches $t$, push the smallest residual capacity along the path; otherwise stop.

**Correctness.** The proof above shows that the flow stays valid at every stage, that the algorithm stops only when no augmenting path remains, and that the residual-reachable set then defines a cut of exactly the flow value, which by weak duality is the maximum.

**Complexity.** $O(V E^2)$ time and $O(V + E)$ space. The total needs a 64-bit integer.

**Common wrong approach.** Building the residual graph with only the forward edges, so that material can never be withdrawn and the flow is stuck at the first choice.

### Problem 2: the strike that stops the network

**Restatement.** The same network. The company may shut a set of pipelines. Report the smallest total capacity of pipelines that must be shut so that no material can reach $t$ from $s$, and report which pipelines they are. Constraints: $1 \le n \le 2\,000$ and $0 \le m \le 20\,000$.

**Naive baseline.** Try every cut, or remove every pipeline and test reachability, at a cost of $O(m(V + E))$.

**Insight.** The minimum cut equals the maximum flow, so the same computation answers both questions.

**Derivation.** Compute a maximum flow. Then compute the set $S$ of vertices reachable from $s$ in the residual graph. The pipes to shut are exactly the pipes with one end in $S$ and the other outside it, and their total capacity is the answer.

**Correctness.** The proof above shows that the edges leaving $S$ are saturated and that the cut capacity equals the flow value. Every cut has capacity at least the flow value by weak duality, so this cut is the cheapest one, and shutting exactly those pipes stops all the flow.

**Complexity.** $O(V E^2)$ time, the same as before, plus one more traversal.

**Common wrong approach.** Shutting the pipes that carry flow. That set has the right size but not the right capacity, because a pipe may carry part of the flow while still having spare capacity.

### Problem 3: the global split of the network

**Restatement.** The same network, but with no source and no sink. The company wants to split the network into two nonempty parts so that the total capacity of the pipelines crossing the split is as small as possible. Report that capacity.

**Naive baseline.** Fix a station $s$ and compute the minimum cut from $s$ to every other station, then take the smallest. This is correct but costs $V - 1$ flow computations.

**Insight.** The global minimum cut is the minimum of the $s$-$t$ cuts for a **single** fixed $s$, so only $V - 1$ flows are needed, and the theorem above proves it.

**Derivation.** Fix any vertex $s$. For each other vertex $t$, compute the minimum $s$-$t$ cut and keep the smallest value and the corresponding partition.

**Correctness.** The theorem in the correctness section shows that for any fixed $s$, the minimum of $\operatorname{mincut}(s,t)$ over $t$ is exactly the global minimum cut.

**Complexity.** $O(V \cdot V E^2)$ time, which is $O(V^2 E^2)$ and is too slow for the largest networks. For an undirected network, Stoer-Wagner gives $O(V^3)$ instead, and that is the version to reach for.

**Common wrong approach.** Reporting the minimum $s$-$t$ cut for one arbitrary pair $(s,t)$ as the global cut. The global cut may lie far from that pair, and the answer can be arbitrarily larger.

## Practice progression

1. **Recognition.** Given a statement, decide whether flow applies. Look for capacities, "how much can be sent", "cheapest way to disconnect", and networks with a source and a sink.
2. **Direct application.** Implement Edmonds-Karp with the reverse edges, and check that the reported cut capacity equals the reported flow value.
3. **Adaptation.** Implement Dinic, add the node-splitting reduction for vertex cuts, and implement the global minimum cut by $V - 1$ flows.
4. **Combination.** Use a flow network to solve a matching problem, and use Menger's theorem to answer a question about the number of disjoint paths.
5. **Challenge.** Solve a problem with unit capacities and $10^5$ vertices, where the flow algorithms must use their improved bounds, and where the answer to the matching reduction is a bipartite matching.
6. **Transfer.** Use the same machinery for a different question: the minimum-cost flow of a supply chain, the maximum number of edge-disjoint paths in a grid, and the connectivity of a network after a set of failures.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the max-flow min-cut theorem precisely, including what a cut's capacity counts. (Formal model)
2. Give the weak duality inequality and prove it in two sentences. (Formal model)
3. Why does the residual graph contain reverse edges, and what do they represent? (Formal model)
4. What is an augmenting path, and why does pushing along it preserve every constraint? (Algorithm derivation)
5. How is the minimum cut recovered from a maximum flow, and why is that set the right one? (Correctness proof)
6. Why is the cut that is found when the algorithm stops equal to the flow value? (Correctness proof)
7. Give the running times of Ford-Fulkerson, Edmonds-Karp, and Dinic. (Complexity analysis)
8. How does the global minimum cut relate to the $s$-$t$ minimum cuts, and how many flows does it need? (Correctness proof)
9. How do you turn a vertex cut into an edge cut? (Variants and extensions)
10. What is the smallest graph on which the smallest degree differs from the minimum cut? (Why this fails)
11. Why must the cut count only the edges leaving the source side? (Why this fails)
12. When is recursion unsafe in the augmenting path search? (Recursion decision)

## Further reading

- The shortest-path algorithm that appears inside the flow algorithms, and the one that computes the distances used in a min-cost flow, is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The vertex-cut version of this problem, solved with the same low-link traversal, is [articulation points](/algorithms/graphs/articulation-points) and [bridges](/algorithms/graphs/bridges).
- The assignment problem, which is a flow network with unit capacities, is [bipartite matching](/algorithms/graphs/bipartite-matching).
- The traversal that finds the residual-reachable set is [breadth-first search](/algorithms/graphs/bfs).
- The network model that the flow algorithm assumes is covered in [graph representation](/algorithms/graphs/representation), and the call-stack limit is covered in [recursion](/algorithms/foundations/recursion).
