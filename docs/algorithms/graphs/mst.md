---
id: graphs.mst
title: Minimum spanning tree
summary: Connect every vertex of a weighted graph with as little total weight as possible, without a cycle.
division: [gold, platinum]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [minimum spanning tree, mst, kruskal, prim, disjoint set union]
prerequisites:
    required: [graphs.representation, graphs.dsu]
    recommended: [graphs.dijkstra, greedy.interval-scheduling]
complexity:
    time: "O(E log E)"
    space: "O(V + E)"
assumptions:
    - The graph is undirected.
    - The edge weights may be negative, which Kruskal's algorithm and Prim's algorithm both tolerate.
reviewed: false
---

## Problem motivation

A county has $n$ towns joined by $m$ two-way roads, and every road has a construction cost. The county wants a road network in which every town can reach every other town, and it wants to spend as little as possible.

The constraints are what make the problem interesting:

- $1 \le n \le 200\,000$ towns.
- $0 \le m \le 400\,000$ two-way roads.
- Each road has a cost, and different roads have different costs.
- After the work is done, a truck must be able to drive from any town to any other town.

Two sentences in that statement carry the whole problem. "Every town can reach every other town" says the network must be **connected**. "As little as possible" says we are minimizing the **total** cost of the roads we build, not the cost of any single route.

What the statement does not say is where the cycles go. A road network with a cycle is wasteful: the roads of the cycle reach the same towns by two different routes, so one of them can be deleted without disconnecting anything, and the county keeps its cost. The answer is therefore always a network with no cycles.

A connected acyclic graph is a **tree**, and a tree on $n$ vertices has exactly $n - 1$ edges. So the task is exactly this: choose $n - 1$ edges that connect everything, and make their total cost as small as possible. That object is called a **minimum spanning tree**.

The framing explains why this is not a shortest-path problem. The question is not "what is the cheapest route from A to B" but "what is the cheapest set of roads that keeps everybody connected". A cheapest route is a path; a minimum spanning tree is a set of $n - 1$ edges. The two problems look similar from a distance and are answered by different algorithms.

## Recognition patterns

A minimum spanning tree is the right tool when all of the following hold.

- The problem asks to **connect** everything: every vertex reachable from every other vertex.
- The quantity to minimize is the **total** over a set of chosen edges.
- The graph is **undirected**.
- Each edge may be used at most once, and no cycle is required or wanted.

The phrases that point at the problem.

| Phrase in the statement | What it tells you |
| --- | --- |
| "minimum cost to connect everything" | The classic formulation; the answer is a minimum spanning tree |
| "cheapest way to keep everyone connected" | The total weight over a spanning tree |
| "each road may be built at most once" | There are no multiplicities; one road is one edge |
| "so that any town can reach any other town" | The connectivity requirement |
| "no road may be useless" | A tree; cycles are forbidden |
| "some towns may be left out" | Not a spanning tree; that is a Steiner tree, which is hard |

The last row is a trap worth naming. If the statement says that only the important towns must be connected and the rest may be ignored, the problem is the Steiner tree problem, which is NP-hard, and no greedy algorithm solves it. If every town must be connected, the minimum spanning tree is the answer.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The roads are two-way | Rules in the minimum spanning tree; a directed graph needs an arborescence |
| $n, m \le 2 \cdot 10^5$ | Both algorithms are comfortable |
| $m$ up to $10^7$ with $n \le 10^5$ | Kruskal with a sort is comfortable; an adjacency matrix is not |
| The graph is dense, $m = \Theta(n^2)$ | Rules out Kruskal's sort as the bottleneck; use Prim |
| The graph is disconnected | Rules out a single tree; the answer is a **forest** |
| Some towns may be left unconnected | Rules out the minimum spanning tree; that is a Steiner tree |
| The weights may be negative | Rules nothing out; both algorithms tolerate negative weights |

The last row surprises people, so it is worth saying explicitly. Unlike [Dijkstra's algorithm](/algorithms/graphs/dijkstra), a minimum spanning tree algorithm never compares one total path length against another, so it needs no assumption about the sign of the weights. A negative edge is simply an attractive edge, and both algorithms will happily take it.

One more structural requirement is that the graph must be undirected. When the statement says "the roads are undirected", that is a gift: each road is a single edge, and you add it once to the edge list rather than twice.

<Synonyms terms="minimum spanning tree, mst, kruskal, prim, kruskal's algorithm, prim's algorithm, minimum spanning forest" />

## Naive approach

The baseline is to enumerate the spanning trees and take the cheapest. How many are there? For the complete graph on $n$ labeled vertices the answer is $n^{n-2}$, by **Cayley's formula**. That is three trees for a triangle, but $6^{6-2} = 1296$ for six vertices and $10^{10}$ for a complete graph on eleven vertices. Enumerating candidate solutions is hopeless, and no contest will ask for it.

The second baseline is greedy without sorting. Take the roads in the order they appear in the input, and keep each one that does not close a cycle. This is wrong, and the failure is not subtle: the algorithm has no way of knowing that a cheap road available later would have been a better choice.

The third baseline is a shortest-path search. Run [Dijkstra's algorithm](/algorithms/graphs/dijkstra) from some town and keep the parent edges of the resulting shortest-path tree. That tree minimizes the total cost of the _routes from one source_, not the total cost of the network. On the graph used in the step-by-step section below, the shortest path tree rooted at vertex 1 contains the edge 1-4 of weight 7, while the minimum spanning tree rejects that edge and reaches vertex 4 along the chain 1-2-3-4 at a cost of 13.

So the first baseline is hopeless by counting and the second is wrong by construction. Both failures have the same repair: sort the edges, and then the greedy choice becomes provably safe.

## Key insight

The insight is that the cheapest edge across any cut is safe to take, and that one fact is enough to build the whole tree one edge at a time.

Here is the argument before the notation. Suppose you have already chosen some edges, and they are consistent with a minimum spanning tree; that is the hypothesis the proof will maintain. Look at the next edge you want to add. It separates the graph into two parts: the part you have reached and the part you have not. If that edge is the cheapest of all the edges crossing between the two parts, then some minimum spanning tree contains it.

Why? Take any minimum spanning tree. If it already contains your edge, there is nothing to prove. If not, adding your edge to it creates a cycle, and that cycle must cross the same partition somewhere else, through an edge that is at least as expensive as yours, because yours was the cheapest one across the partition. Swap the two edges: the result is still a tree, and it is no heavier, so it is still a minimum spanning tree, and now it contains your edge.

Two algorithms follow from this single fact, and they differ only in the order in which they take edges.

- **Kruskal's algorithm** takes the cheapest edge in the whole graph and keeps it unless it would close a cycle. Because it works globally, it needs to know whether two vertices are already connected, which is exactly the job of a [disjoint set union](/algorithms/graphs/dsu).
- **Prim's algorithm** grows one connected region. It takes the cheapest edge that leaves the region it has built, so the cut is always the boundary of that region, and the cheapest edge on the boundary is found with a priority queue.

Both are greedy, and the greedy step is exactly the cut property. The proof of that property is in the formal model, and the proof of the algorithms is in the correctness section.

## Formal model

Let $G = (V, E)$ be a connected undirected graph with a weight function $w : E \to \mathbb{R}$, where $V$ is the set of vertices and $E$ is the set of edges.

::: math definition Definition
A **spanning tree** of $G$ is a pair $(V, F)$ with $F \subseteq E$ such that the graph $(V, F)$ is connected and contains no cycle. Equivalently, $F$ has exactly $|V| - 1$ edges and every pair of vertices is joined by a path in $(V, F)$.
:::


::: math definition Definition
The **total weight** of an edge set $F$ is $w(F) = \sum_{e \in F} w(e)$. A **minimum spanning tree** of $G$ is a spanning tree $(V, F)$ whose total weight $w(F)$ is as small as possible among all spanning trees of $G$.
:::


::: math definition Definition
A **cut** of $G$ is a partition of $V$ into two nonempty sets $S$ and $V \setminus S$. An edge **crosses** the cut when one of its endpoints lies in $S$ and the other lies in $V \setminus S$.
:::


::: math lemma Lemma (the cut property)
Let $(S, V \setminus S)$ be any cut of a connected graph $G$, and let $e$ be an edge of minimum weight among the edges that cross the cut. Then there is a minimum spanning tree of $G$ that contains $e$.
:::


::: math proof Proof
Let $T$ be a minimum spanning tree of $G$, and let $F_T$ be its edge set. If $e$ belongs to $T$, the claim already holds.

Otherwise, add $e$ to $T$. Because $T$ is a tree, this creates exactly one cycle $C$, and $C$ consists of $e$ together with the path in $T$ between the two endpoints of $e$. That path starts on one side of the cut and ends on the other, so it contains at least one edge $f \ne e$ that crosses the cut. The edge $f$ crosses the same cut as $e$, and $e$ is a minimum-weight edge across that cut, so $w(e) \le w(f)$.

Now $T' = (V, (F_T \setminus \{f\}) \cup \{e\})$ is a spanning tree: removing $f$ from the cycle breaks it into a path, and putting $e$ back restores the tree. Its total weight satisfies

$$
w(T') = w(T) - w(f) + w(e) \le w(T).
$$

Since $T$ was a minimum spanning tree, no spanning tree has a smaller total weight, so $w(T') = w(T)$ and $T'$ is a minimum spanning tree as well. It contains $e$, which proves the claim. $\square$
:::


The exchange argument in that proof is the whole algorithm in miniature: take the edge you want, find an edge of comparable or greater weight that it can replace, and swap them.

## Algorithm derivation

### Kruskal's algorithm

The state is a forest $F$, initially empty, together with a disjoint set union over $V$ that records the connected components of $F$.

```text
sort the edges of E by non-decreasing weight
F = the empty set of edges
make every vertex of V a singleton set
for each edge {u, v} in sorted order:
    if find(u) == find(v):
        continue                 # the edge would close a cycle
    F = F union {{u, v}}
    unite(u, v)                 # merge the two components
    if |F| == n - 1:
        break
```

The update rule is one step of the scan, and it is correct because of the cut property applied to the cut that separates the component of $u$ from the rest of the graph.

Why that cut is the right one is the part worth understanding. When the edge $e = \{u, v\}$ is examined, every edge of smaller weight has already been examined. An edge that was examined and rejected had both endpoints in one component of the forest at that moment, and the forest only grows, so its endpoints are still in one component now. Therefore no edge of smaller weight crosses the cut around the component of $u$: such an edge would have been accepted, and an accepted edge cannot cross that cut. So $e$ is a lightest edge across the cut, and the cut property says some minimum spanning tree contains it.

::: math invariant Invariant
At every moment of Kruskal's algorithm, the accepted edges form a forest, and there is a minimum spanning tree of $G$ that contains every one of them. The same exchange argument, run inside the subgraph of the edges examined so far, gives the stronger statement that the accepted edges are a minimum spanning forest of that subgraph.
:::


### Prim's algorithm

The state is a set $S$ of reached vertices, starting from one vertex $r$, together with a min-priority queue of candidate edges crossing the cut $(S, V \setminus S)$.

```text
S = {r}
Q = a min-priority queue holding every edge incident to r, keyed by weight
while Q is not empty:
    (w, {u, v}) = extract the smallest entry of Q
    if u and v are both in S:
        continue                 # the entry is stale: the edge is internal now
    F = F union {{u, v}}
    S = S union {u, v}
    for every edge {v, x} incident to v with x not in S:
        insert the edge {v, x} into Q, keyed by its weight
```

The extracted edge is the cheapest of all the edges crossing the cut, so it is a lightest edge across that cut, and the cut property applies exactly as it did for Kruskal.

The reason a priority queue works is that the cut changes by exactly one vertex at a time. When a vertex $v$ joins $S$, the only edges that become candidates are the ones incident to $v$ that reach a vertex outside $S$; every other candidate was already in the queue. So the queue grows by the degree of the newly added vertex, and the smallest entry is exactly the cheapest edge across the current cut. The container is the same one used by [Dijkstra's algorithm](/algorithms/graphs/dijkstra), with a different key and a different invariant.

::: math invariant Invariant
At every moment of Prim's algorithm, the accepted edges form a tree on the vertex set $S$, and there is a minimum spanning tree of $G$ that contains every one of them. The priority queue holds an entry for every edge crossing the cut $(S, V \setminus S)$, together with stale entries for edges that have become internal.
:::


## Step-by-step execution

Take the undirected graph on vertices $1,2,3,4,5,6$ with these ten edges.

| Edge | Weight | Edge | Weight |
| ---- | ------ | ---- | ------ |
| 1-2  | 4      | 3-4  | 5      |
| 1-3  | 8      | 3-5  | 2      |
| 1-4  | 7      | 4-5  | 6      |
| 2-3  | 4      | 4-6  | 3      |
| 2-4  | 9      | 5-6  | 7      |

### Kruskal's algorithm

The edges in sorted order are 3-5 (2), 4-6 (3), 1-2 (4), 2-3 (4), 3-4 (5), 4-5 (6), 1-4 (7), 5-6 (7), 1-3 (8), 2-4 (9).

| Step | Edge | Weight | Decision | Reason                                        |
| ---- | ---- | ------ | -------- | --------------------------------------------- |
| 1    | 3-5  | 2      | accept   | 3 and 5 are in different components           |
| 2    | 4-6  | 3      | accept   | 4 and 6 are in different components           |
| 3    | 1-2  | 4      | accept   | 1 and 2 are in different components           |
| 4    | 2-3  | 4      | accept   | 2 and 3 are in different components           |
| 5    | 3-4  | 5      | accept   | 3 and 4 are in different components           |
| 6    | 4-5  | 6      | reject   | 4 and 5 are already connected through 3       |
| 7    | 1-4  | 7      | reject   | 1 and 4 are already connected through 2 and 3 |
| 8    | 5-6  | 7      | reject   | 5 and 6 are already connected through 3 and 4 |
| 9    | 1-3  | 8      | reject   | 1 and 3 are already connected through 2       |
| 10   | 2-4  | 9      | reject   | 2 and 4 are already connected through 3       |

After step 5 the forest has five edges, which is $n - 1 = 5$, so the algorithm can stop there. The tree is

$$
\{1\text{-}2,\ 2\text{-}3,\ 3\text{-}5,\ 3\text{-}4,\ 4\text{-}6\}
$$

with total weight $4 + 4 + 2 + 5 + 3 = 18$. Notice that the tie between the two weight-4 edges was harmless: they share vertex 2, so accepting one did not prevent the other, and both ended up in the tree. A tie between two edges that would close a cycle against each other is a different matter, and the two algorithms may then return different trees of the same total weight.

### Prim's algorithm

Now the same graph, started from vertex 1. The queue holds the edges crossing the boundary of the region built so far.

| Step | Cheapest edge on the boundary | Weight | Running total | Vertices in the tree |
| ---- | ----------------------------- | ------ | ------------- | -------------------- |
| 1    | 1-2                           | 4      | 4             | 1, 2                 |
| 2    | 2-3                           | 4      | 8             | 1, 2, 3              |
| 3    | 3-5                           | 2      | 10            | 1, 2, 3, 5           |
| 4    | 4-6                           | 3      | 13            | 1, 2, 3, 5, 6        |
| 5    | 3-4                           | 5      | 18            | 1, 2, 3, 4, 5, 6     |

The boundary after step 1 holds 1-3 (8), 1-4 (7), 2-3 (4) and 2-4 (9), so step 2 takes 2-3. After step 2 the boundary holds 1-4 (7), 2-4 (9), 3-4 (5) and 3-5 (2), so step 3 takes the cheap 3-5. After step 3 the boundary holds 1-4 (7), 2-4 (9), 3-4 (5), 4-5 (6), 4-6 (3) and 5-6 (7), so step 4 takes 4-6. The last boundary is 1-4 (7), 2-4 (9), 3-4 (5) and 4-5 (6), so step 5 takes 3-4.

Both algorithms return the same tree with the same total weight of 18. They are not required to return the same tree; a graph can have several minimum spanning trees of equal weight, and which one a program returns depends on the tie-breaking.

## Correctness proof

The proof needs one more fact, which is the safe edge version of the cut property.

::: math lemma Lemma (the safe edge property)
Let $F$ be a set of edges of a connected graph $G$, and suppose some minimum spanning tree $T$ contains $F$. Let $e \notin T$ be an edge such that $e$ closes no cycle with $F$, and such that $e$ has minimum weight among the edges crossing some cut that no edge of $F$ crosses. Then there is a minimum spanning tree $T'$ with $F \cup \{e\} \subseteq T'$.
:::


::: math proof Proof
Let $(S, V \setminus S)$ be the cut from the hypothesis, and let $u$ and $v$ be the endpoints of $e$, with $u \in S$ and $v \notin S$.

Let $P$ be the path in $T$ between $u$ and $v$. The path starts on one side of the cut and ends on the other, so it crosses the cut at least once; let $f$ be an edge of $P$ that crosses the cut. The edge $f$ is not in $F$, because no edge of $F$ crosses the cut, and $w(e) \le w(f)$, because $e$ is a minimum-weight edge across the cut.

Adding $e$ to $T$ creates the cycle $P \cup \{e\}$, so $T' = (V, (F_T \setminus \{f\}) \cup \{e\})$ is a spanning tree, and it contains $F \cup \{e\}$ because $f \notin F$. Its total weight satisfies

$$
w(T') = w(T) - w(f) + w(e) \le w(T).
$$

Since $T$ was a minimum spanning tree, $T'$ is one too. $\square$
:::


::: math theorem Theorem
Kruskal's algorithm returns a minimum spanning tree of a connected graph $G$.
:::


::: math proof Proof
The invariant is the one stated in the algorithm derivation: the accepted edges form a forest, and there is a minimum spanning tree of $G$ that contains every one of them. We prove it by induction on the number of accepted edges.

The base case is the empty forest, which is contained in every tree.

For the inductive step, suppose the invariant holds with accepted set $F$, and let $e = \{u, v\}$ be the next edge the algorithm accepts. Because $e$ did not close a cycle with the accepted edges, $u$ and $v$ lie in different components of $F$. Let $S$ be the vertex set of the component of $F$ that contains $u$.

The edge $e$ is a minimum-weight edge crossing the cut $(S, V \setminus S)$. To see this, take any edge $g$ that crosses the cut. If $g$ comes later than $e$ in the sorted order, then $w(g) \ge w(e)$ because the order is non-decreasing in weight. If $g$ came earlier, then its endpoints were in different components of the forest at that moment, because they are in different components now and the forest only grows; so the algorithm would have accepted $g$. But $g$ cannot be an accepted edge, because an accepted edge has both endpoints in one component of $F$, while $g$ crosses the cut around one of those components. This is a contradiction, so no such $g$ exists.

Therefore $e$ is a lightest edge across the cut, and no edge of $F$ crosses the cut. If $e$ is already in the minimum spanning tree promised by the induction hypothesis, the invariant is preserved immediately. Otherwise the safe edge lemma applies and produces a minimum spanning tree containing $F \cup \{e\}$. The invariant is preserved.

The algorithm ends with $|V| - 1$ accepted edges. A forest on $|V|$ vertices with $|V| - 1$ edges is connected, so the accepted edges form a spanning tree. By the invariant they are contained in a minimum spanning tree, and two spanning trees of the same graph with the same number of edges are the same edge set, so the accepted edges are a minimum spanning tree. $\square$
:::


Prim's algorithm has the same proof with one substitution. The cut is the boundary of the region $S$ instead of the boundary of one component, and the extracted edge is the cheapest of all the edges across that cut by construction, so the safe edge lemma applies with the same conclusion.

## Complexity analysis

**Kruskal's algorithm: $O(E \log E)$ time.** The sort dominates. The disjoint set union operations cost $O(E \alpha(V))$ in total, where $\alpha$ is the inverse Ackermann function, and the scan itself is $O(E)$. The auxiliary space is $O(V + E)$ for the sorted edge list and the union-find arrays.

For a simple graph, that is, one with at most one edge between each pair of vertices, $E \le \binom{|V|}{2}$, so $\log E = O(\log V)$ and the bound is also $O(E \log V)$. This is why the two forms of the bound are used interchangeably.

**A faster sort: $O(E \log V)$ or better with a bucket or radix sort.** When the weights are integers in a range of size $W$, a bucket sort costs $O(E + W)$ and a radix sort costs $O(E \cdot d)$ for $d$ passes over the digits of the weight. When $W$ is $O(V)$ or $O(E)$, the sort costs $O(E + V)$, which is inside $O(E \log V)$ and removes the logarithmic factor from the dominant term. This is the version to reach for when the statement says the costs are small integers and the graph is huge.

**Prim's algorithm with a binary heap: $O(E \log V)$ time.** Each vertex joins the tree once, each edge is examined at most twice, and the heap holds $O(E)$ entries, so there are $O(E)$ heap operations, each costing $O(\log E)$, which is $O(\log V)$ for a simple graph. The auxiliary space is $O(V + E)$ for the adjacency list and the heap.

**Prim's algorithm with an array: $O(V^2 + E)$ time.** Replace the heap with an array holding, for each vertex outside the tree, the weight of the cheapest edge reaching it. Scanning that array for the minimum costs $O(V)$ and happens $V$ times, so the scans cost $O(V^2)$, and the edge relaxations cost $O(E)$. The auxiliary space is $O(V)$ beyond the graph itself. This is the fastest option when $V$ is small and the graph is dense, and it never materializes an edge list.

**Why Kruskal needs the disjoint set union.** Kruskal's only question at each step is "are $u$ and $v$ already connected by the edges accepted so far?". The answer has to arrive in amortized constant time, and that is exactly what the [disjoint set union](/algorithms/graphs/dsu) provides with path compression and union by size. A naive implementation that searches the forest for the path between $u$ and $v$ costs $O(V)$ per edge, which turns $O(E \log E)$ into $O(VE + E \log E)$ and is far too slow at the maximum constraints.

Kruskal also needs the graph as an **edge list** rather than an adjacency list, because it sorts edges. The [graph representation](/algorithms/graphs/representation) article covers the difference between the two and why the edge list is the natural input for this algorithm.

::: math complexity Complexity
Kruskal's algorithm with a comparison sort: time $O(E \log E)$, auxiliary space
$O(V + E)$. With a bucket or radix sort over a weight range of size
$W$: time $O(E + W)$. Prim's algorithm with a binary heap: time
$O(E \log V)$, auxiliary space $O(V + E)$. Prim's algorithm with an array:
time $O(V^2 + E)$, auxiliary space $O(V)$ beyond the graph.
:::


## Algorithm selection

| Situation | What to use |
| --- | --- |
| A general undirected weighted graph | Kruskal, or Prim |
| A sparse graph, $E = O(V)$ | Either; Kruskal is the shorter code |
| A dense graph, $E = \Theta(V^2)$ | Prim with a binary heap; Kruskal's sort dominates |
| A small dense graph, $V \le 2000$ | Prim with an array, $O(V^2 + E)$ |
| The weights are small integers | Kruskal with a bucket sort |
| The graph is disconnected | Kruskal; it produces a forest with no extra work |
| Only the total weight is needed | Either; skip the bookkeeping of the tree |
| The tree itself is needed | Either; record the accepted edges |
| The graph is already a tree | Nothing to compute; the answer is the sum of all edge weights |
| At most three vertices | Solve it directly |

Two special cases are worth stating in full.

**The graph is already a tree.** If the graph is connected and has $|V| - 1$ edges, the graph itself is its own minimum spanning tree. Kruskal accepts every edge, because no edge ever closes a cycle, and Prim reaches every vertex from any start. The answer is the sum of all edge weights. A program that reads the edges, sorts them, and runs the union-find produces the right answer with no special case at all, which is the best outcome: the special case costs nothing to handle implicitly.

**Two or three vertices.** With one vertex the answer is 0. With two vertices the answer is the cheapest edge between them. With three vertices every spanning tree is a path with a center, so the answer is the smallest, over the three possible centers, of the sum of the two cheapest edges incident to that center. Writing this out by hand is rarely worth it, but it is a good way to check a general implementation on a small case.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Accepting an edge that closes a cycle | The result has more than $ | V | -1$ edges and is not a tree | Test whether the endpoints are already connected before accepting |
| Forgetting to sort the edges | The greedy choice is made in the wrong order and the answer is not minimal | Sort by weight before the scan |
| Treating a directed graph as undirected | The result does not reach every vertex from the root | A directed spanning tree must be an arborescence |
| Expecting the tree to contain the shortest path | The route inside the tree is longer than the shortest route | Use [Dijkstra's algorithm](/algorithms/graphs/dijkstra) for shortest paths |
| Using a 32-bit integer for the total | The sum overflows on a large graph | Use a 64-bit type |
| Assuming the graph is connected | The answer is a forest, or the task is impossible | Count the components or the accepted edges |
| Adding an undirected edge twice | The edge is charged twice in the total | Add each road once to the edge list |
| Merging the union-find sets before comparing them | The cycle test always fails | Compare the representatives first, merge afterwards |

### Why this fails: the edge that closes a cycle

The mistake is accepting every edge that looks cheap, without asking whether its endpoints are already connected.

The smallest counterexample is three vertices and three edges.

| Edge | Weight |
| ---- | ------ |
| 1-2  | 1      |
| 2-3  | 2      |
| 1-3  | 3      |

The minimum spanning tree is {1-2, 2-3} with total weight 3. An algorithm that accepts edges until it runs out of edges accepts all three, with total weight 6. The result has three edges on three vertices, so it contains a cycle, and it costs twice the answer. The failure is invisible in the output, because the result still connects every vertex.

The fix is one test: keep a disjoint set union, and accept an edge only when its two endpoints are in different sets.

### Why this fails: the edges that were never sorted

The mistake is iterating over the edges in the order they were read and applying the greedy rule anyway.

The same triangle shows it. Read the edges in the order 1-3 (3), 1-2 (1), 2-3 (2). The greedy rule accepts the first edge, accepts the second because it joins two different components, and rejects the third because it would close a cycle. The result is {1-3, 1-2} with total weight 4. The correct answer is 3.

The algorithm returned a valid spanning tree, it was not minimal, and nothing in the output signals the mistake. This is the failure that survives review most often, because the code looks exactly like the correct code with the sort deleted.

### Why this fails: the directed graph

The mistake is assuming that a minimum spanning tree is defined for a directed graph, and that the same greedy rule computes it.

A directed graph has no spanning tree in the undirected sense. The analogous object is an **arborescence**: a directed tree rooted at a vertex $r$ in which every other vertex is reachable from $r$ and every vertex except $r$ has exactly one incoming edge.

The smallest counterexample is three vertices and three directed edges.

| Edge   | Weight |
| ------ | ------ |
| 2 -> 3 | 1      |
| 1 -> 3 | 2      |
| 1 -> 2 | 3      |

The cheapest arborescence rooted at 1 must give vertex 2 an incoming edge, and 1 -> 2 is the only edge into vertex 2, so it costs 3. Vertex 3 can then be reached from 1 at a cost of 2 or from 2 at a cost of 1, so the cheapest arborescence is {1 -> 2, 2 -> 3} with total weight 4.

Kruskal's algorithm, run on the underlying undirected graph, sorts the edges as 2-3 (1), 1-3 (2), 1-2 (3), accepts the first two, rejects the third, and reports 3. Its answer is not an arborescence at all: vertex 2 has no incoming edge and cannot be reached from the root.

The failure is therefore not a wrong number but a wrong object. The undirected algorithm silently answers a different question, and the number it reports is smaller because the object it built is cheaper but weaker.

### Why this fails: the shortest path that the tree does not contain

The mistake is assuming that because the tree connects everything, the route it gives between two towns is the cheapest route between them.

The smallest counterexample that does not depend on tie-breaking is four vertices and four edges.

| Edge | Weight |
| ---- | ------ |
| 1-2  | 1      |
| 2-3  | 1      |
| 3-4  | 1      |
| 1-4  | 2      |

Kruskal sorts the edges as 1-2 (1), 2-3 (1), 3-4 (1), 1-4 (2). The first three already form a tree, so the answer is {1-2, 2-3, 3-4} with total weight 3, and the edge 1-4 is rejected because it would close a cycle. The tree is unique here, so there is no tie-breaking to hide behind.

The cheapest route from vertex 1 to vertex 4 is the single edge 1-4, which costs 2. The route the tree gives costs 1 + 1 + 1 = 3. The minimum spanning tree does not contain the shortest path.

The gap is not bounded by a small factor either. Take a path of $k$ unit-cost edges and add one extra edge of cost $1 + \varepsilon$ between its two ends. The unique minimum spanning tree is the path itself, so the route inside the tree between the two ends costs $k$, while the shortest route costs $1 + \varepsilon$.

The general statement is worth keeping straight, because it is easy to get backwards. The route inside the tree is a route in the graph, so it is never shorter than the shortest route; it can only be longer, and it can be much longer. The tree minimizes the total of all its edges, not the length of any individual path.

## Variants and extensions

- **The maximum spanning tree.** Run the same algorithm with the comparison reversed: take the heaviest available edge at each step, or equivalently run Kruskal on the negated weights. The cut property has a mirror form, in which a maximum-weight edge across a cut belongs to some maximum spanning tree, and the proof is the same with the inequalities reversed.
- **The minimum spanning forest.** If the graph is disconnected, no spanning tree exists. The same algorithm produces a minimum spanning forest: one minimum spanning tree per connected component, with $|V| - c$ edges in total, where $c$ is the number of components. Kruskal needs no change, because the union-find already tracks the components; Prim must be restarted from each unvisited vertex.
- **The bipartite minimum spanning tree.** If the graph is bipartite with parts $A$ and $B$, every spanning tree is bipartite as well and has $|A| + |B| - 1$ edges, and the degrees on the two sides sum to $|A| + |B| - 1$ each. Kruskal and Prim are unchanged; the bipartite structure changes the shape of the answer rather than the algorithm. Two traps come with it. The classic bipartite problem "give each of the $n$ interns a distinct mentor at minimum cost" is a matching problem, not a spanning tree problem, and the Hungarian algorithm is the right tool; the two are confused often because both are "minimum cost over a set of edges of a bipartite graph". And when the graph is complete bipartite and given as a matrix of costs, the edge set has $mn$ members and should never be materialized: a complete bipartite graph with 2000 vertices on each side has four million edges, and the memory of the edge list is the difference between fitting and not fitting.
- **The Chinese postman problem.** The classical problem asks for the shortest closed walk that traverses every edge of an undirected weighted graph at least once: a mail carrier who must walk every road and return to the depot. The answer is the sum of all edge weights plus the cost of repairing the parity of the degrees, because a closed walk visits every vertex an even number of times; the repair duplicates edges along shortest paths until every vertex has even degree, and the cheapest repair pairs up the odd-degree vertices with a minimum-weight perfect matching. The minimum spanning tree enters through the variants: in the rural postman problem only a subset of the edges is required, and the cheapest way to link the required edges into a single tour is governed by the minimum spanning tree of the subgraph they induce, because the tour must contain a spanning structure over them and the cheapest such structure is the tree.
- **The Steiner tree.** When some vertices may be left out, the cheapest connected subgraph is the Steiner tree, which allows extra vertices that are not in the input to serve as junctions. It is NP-hard, and the minimum spanning tree is the special case in which no extra vertices are allowed.
- **The minimum spanning tree with a bounded degree.** When the problem forbids a vertex from having too many incident edges, the greedy argument no longer applies, and the problem becomes harder.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Recognize the shape before anything else: "connect everything", "minimum total cost", and an undirected graph. Write down that the answer is a minimum spanning tree.
2. Decide what the output is. The total weight needs only an accumulator; the tree itself needs the accepted edges recorded, and a statement that asks for "the roads to build" usually needs the tree.
3. Choose the algorithm from the shape of the input. An edge list or a sparse graph means Kruskal, because sorting is cheap and the union-find is a few lines. A dense graph given as an adjacency list or a matrix means Prim.
4. Read the two statement phrases that decide the complexity. "At most one road between each pair of towns" means the graph is simple, so $E \le \binom{|V|}{2}$ and $\log E = O(\log V)$; it also means that an adjacency matrix of $|V|^2$ booleans is affordable for $|V| \le 2000$, which is exactly the regime where Prim with an array wins. "The roads are undirected" means each road is one edge, added once to the edge list; if you build an adjacency list, add the road to both endpoints' lists but count its weight once.
5. Use a 64-bit type for the total. It can reach $(|V| - 1) \cdot \max w$, which overflows a 32-bit integer on any large instance.
6. Check whether the graph is connected. If the statement does not promise it, decide in advance whether to report a forest or report that the task is impossible.
7. Write the union-find in the right order: compare the representatives first, merge afterwards. Merging first makes the cycle test always succeed.
8. Test three cases by hand before submitting: two vertices, a triangle, and two disconnected pairs of vertices. The triangle catches a missing cycle test and the disconnected case catches a missing component count.

## Worked problems

### Problem 1: connecting the villages

**Restatement.** An undirected graph has $n$ villages and $m$ two-way roads, each road with a nonnegative construction cost. Choose a set of roads so that every village can reach every other village, and report the minimum total cost. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$, with each cost at most $10^9$.

**Naive baseline.** Enumerate the spanning trees and take the cheapest. Cayley's formula puts the count at $n^{n-2}$ for the complete graph, which is hopeless. The second baseline, a greedy scan over the edges in input order, returns a spanning tree that is not minimal.

**Insight.** The cheapest edge across any cut can be taken without making the answer worse, so the edges can be added one at a time in increasing order of weight, and an edge is skipped only when it would close a cycle.

**Derivation.** Sort the edges by weight. Keep a disjoint set union over the villages. For each edge in sorted order, if its endpoints are in different sets, accept it, add its cost to the total, and merge the two sets. Stop when the accepted count reaches $n - 1$.

**Correctness.** The correctness proof shows that the accepted edges are always contained in some minimum spanning tree, and that at the end they form a spanning tree, so they are a minimum spanning tree.

**Complexity.** $O(E \log E)$ time and $O(V + E)$ space. The total needs a 64-bit integer, since it can reach $(n - 1) \cdot 10^9$.

**Common wrong approach.** Accepting an edge whenever it is cheap, without testing whether its endpoints are already connected. On a triangle of costs 1, 2 and 3, that returns a total of 6 instead of 3.

### Problem 2: the roads that get more expensive as you build

**Restatement.** The same graph, but the cost of building a road is not a fixed number. Each road has a base cost $c_e$, and the total price of a road is its base cost plus the number of roads that have already been built. The county may build the roads in any order it likes. Minimize the total price paid.

**Naive baseline.** Greedily build the cheapest road next, and repeat. This is wrong twice over: the choice of which road to build first changes the price of every later road, and the naive rule ignores that.

**Insight.** The surcharge does not depend on which roads are built, only on how many. If the county builds $n - 1$ roads, the surcharges are $0, 1, 2, \ldots, n - 2$ in some order, so their sum is always

$$
0 + 1 + 2 + \cdots + (n - 2) = \frac{(n-1)(n-2)}{2},
$$

a constant that depends on $n$ and on nothing else. A constant added to every candidate answer can be dropped, so minimizing the total price is exactly minimizing the sum of the base costs of a spanning tree, which is the minimum spanning tree.

**Derivation.** Compute the minimum spanning tree of the graph using the base costs, and report its total plus $(n-1)(n-2)/2$. The order of construction does not need to be planned at all, and it does not need to be reported.

**Correctness.** Every feasible solution builds $n - 1$ roads forming a spanning tree, and its total price is the sum of those base costs plus the constant above. The set of feasible solutions and the constant are the same for every solution, so the minimum spanning tree minimizes the total price as well.

**Complexity.** $O(E \log E)$ time, the same as before, plus one addition.

**Common wrong approach.** Treating the surcharge as part of the edge weight, so that the price of a road depends on when it is built. That produces a different graph for every order and no way to compare the orders.

### Problem 3: the survey of the wells

**Restatement.** There are $n$ wells at points in the plane. A pipe can be laid between any two wells, and the pipe between a given pair costs the Euclidean distance between them. All wells must be connected. Minimize the total length of pipe. Constraints: $1 \le n \le 2000$, with integer coordinates of absolute value at most $10^6$.

**Naive baseline.** Build the complete graph explicitly, with all $\binom{n}{2}$ edges, sort them, and run Kruskal. The complete graph on 2000 vertices has about two million edges, and storing them costs tens of megabytes before the sort begins.

**Insight.** The graph is complete, so the edge list is never needed. Prim's algorithm only ever asks for the cheapest edge from the region it has built to the rest of the vertices, and that is a scan over the array of best known distances.

**Derivation.** Keep an array `best[v]` holding, for each well outside the tree, the length of the shortest pipe from the tree to that well, initialized to the distance from the first well. Repeatedly pick the well with the smallest `best`, add it to the tree, and update every other well with the distance from the newly added well.

**Correctness.** The update keeps `best[v]` equal to the length of the cheapest pipe from any well in the tree to $v$, because a newly added well offers exactly one new candidate pipe to each remaining well. The smallest entry is therefore the cheapest edge crossing the cut, and the cut property applies with no change, so the proof of Prim's algorithm carries over unchanged.

**Complexity.** $O(n^2)$ time and $O(n)$ space beyond the coordinates. The square roots can be avoided entirely by comparing squared distances.

**Common wrong approach.** Materializing the complete edge list. The list is the largest object in the program and it buys nothing, because the algorithm never needs to look at an edge more than once.

## Practice progression

1. **Recognition.** Given a statement, decide whether a minimum spanning tree applies. Look for "connect everything", "minimum total cost", and "undirected", and check the constraint values for density and for whether the graph is promised to be connected.
2. **Direct application.** Implement Kruskal with a sort and a disjoint set union, and Prim with a binary heap, on the same random graphs, and check that they return the same total weight.
3. **Adaptation.** Implement Prim with an array for a dense graph, and a Kruskal with a bucket sort for small integer weights. Then handle a disconnected graph, which turns the answer into a forest.
4. **Combination.** Use a minimum spanning tree as the first stage of a larger problem: the rural postman tour, the set of roads to keep in a network, or the cheapest way to connect a set of terminals that must all be on one route.
5. **Challenge.** Solve a problem where the edge list is implicit, such as a graph over grid cells whose weights come from a formula, and where the constraints make $E$ far too large to enumerate.
6. **Transfer.** Use the cut property elsewhere: in the maximum spanning tree, in the exchange argument for other greedy algorithms, and in the matroid theory that explains why the greedy algorithm works for spanning trees but not for the shortest path problem.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does a minimum spanning tree have exactly $|V| - 1$ edges, and why is the answer always a tree rather than a connected graph with cycles? (Problem motivation)
2. Which phrases in a statement rule the technique in, and which constraint values rule it out? (Recognition patterns)
3. State the cut property, and give the exchange argument that proves it. (Formal model)
4. Which cut does Kruskal's algorithm use at each step, and why is the edge it takes a lightest edge across that cut? (Algorithm derivation)
5. Why can a minimum spanning tree algorithm tolerate negative weights when Dijkstra's algorithm cannot? (Recognition patterns)
6. What is the invariant of Kruskal's algorithm, and which lemma preserves it? (Correctness proof)
7. Why does Kruskal's algorithm need a disjoint set union, and what happens without one? (Complexity analysis)
8. Give the running times of Kruskal with a comparison sort, Kruskal with a bucket sort, Prim with a binary heap, and Prim with an array. (Complexity analysis)
9. Give a graph whose minimum spanning tree does not contain the shortest path between two of its vertices, and work out the two weights. (Common mistakes)
10. Why does the same greedy rule fail on a directed graph? (Common mistakes)
11. How does the Chinese postman problem use the minimum spanning tree? (Variants and extensions)
12. What changes when the cost of a road depends on how many roads have already been built, and why does the answer still come from a minimum spanning tree? (Worked problems)

## Further reading

- The structure Kruskal's algorithm leans on, with the path compression and union by size rules that make it fast, is in [disjoint set union](/algorithms/graphs/dsu).
- The algorithm that answers the different question about paths, with the same priority queue that Prim's algorithm uses, is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The graph representation that every algorithm here assumes, and the difference between an adjacency list, an adjacency matrix and an edge list, is in [graph representation](/algorithms/graphs/representation).
- The ordering of a directed acyclic graph, and the reason a directed graph needs an arborescence rather than a tree, is covered in [topological sort](/algorithms/graphs/topological-sort).
- The other classic greedy algorithm, and the exchange argument in its most polished form, is [interval scheduling](/algorithms/greedy/interval-scheduling).
