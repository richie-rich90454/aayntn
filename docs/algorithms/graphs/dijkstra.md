---
id: graphs.dijkstra
title: Dijkstra's algorithm
summary: Single-source shortest paths in a graph whose edge weights are all nonnegative, settled in order of increasing distance.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [shortest path, nonnegative weights, priority queue, greedy, relaxation]
prerequisites:
    required: [graphs.representation, graphs.bfs]
    recommended: [graphs.dfs]
complexity:
    time: "O((V + E) log V)"
    space: "O(V + E)"
assumptions:
    - Every edge weight is nonnegative.
implementations: graphs.dijkstra
visualization: graphs.dijkstra
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.dijkstra" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="graphs.dijkstra" />

Dijkstra's algorithm computes the distance from one source vertex to every other vertex of a graph whose edge weights are all nonnegative. It does so by repeatedly taking the vertex whose tentative distance is smallest, declaring that distance final, and relaxing the edges that leave it.

The whole algorithm is a distance array and a min-priority queue. The one rule that is not negotiable is that a vertex is _settled_ when it is extracted with the smallest tentative distance, and that once it is settled its distance is never revised. That rule is what the nonnegative assumption buys, and it is the rule that breaks the moment an edge has a negative weight.

The running time is $O((V + E) \log V)$ with a binary min-heap, and the auxiliary structures are the $V$-entry distance array and a heap that holds at most $O(E)$ entries. The space figure in the manifest, $O(V + E)$, also counts the adjacency list the search is given, because that list is the largest object in the program.

## Problem motivation

A courier company has a depot in town $s$ and a delivery van in every other town. Each road has a length, and the company wants to know, for every town, the length of the cheapest route from the depot to it.

The constraints:

- $1 \le n \le 200\,000$ towns.
- $0 \le m \le 400\,000$ two-way roads.
- Every road has a nonnegative length.
- The roads are not all the same length: some are motorways and some are gravel tracks.

The phrase "cheapest route" is what matters. Because the roads have different lengths, "fewest roads" and "shortest route" are different questions, and the second one is the one being asked. A breadth-first search answers the first question and is wrong for the second; the counterexample appears in the [breadth-first search](/algorithms/graphs/bfs) article and is repeated here. The question as stated is exactly the one that [Dijkstra's algorithm](/algorithms/graphs/dijkstra) answers, and this article is about why its answer is right.

The other thing to notice is that the question is about _one_ source. The depot is fixed, and every answer is measured from it. That is the signature of a single-source shortest-path problem, and it is what rules out an all-pairs method such as Floyd-Warshall, which would cost $O(V^3)$ and never finish.

## Recognition patterns

Dijkstra's algorithm is the right tool when all of the following hold.

- The problem asks for the **cheapest** or **shortest** path from **one source**, or for the cheapest path between **many pairs** whose sources are few.
- The edge weights are **nonnegative**: lengths, times, costs, capacities spent, or profits that are never negative.
- The graph is **static**: the weights do not change while the search runs.
- The answer must be produced for **every** vertex, rather than for one target, or the target is far away enough that a search from it would be wasteful.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| Every weight is at least zero | Rules in Dijkstra for shortest paths |
| Some weight is negative | Rules out Dijkstra; use [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Every weight is zero or one | Rules out Dijkstra as overkill; use [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Every weight is one | Rules out Dijkstra as overkill; use [breadth-first search](/algorithms/graphs/bfs) |
| $n, m \le 10^5$ | One Dijkstra run is comfortable; a Floyd-Warshall is not |
| Many sources, one target | Rules in a search from the target |
| Many sources and many targets | Rules in Floyd-Warshall, or a graph algorithm such as a [disjoint set union](/algorithms/graphs/dsu) |

Two words in a statement are reliable signals. "Cheapest", "minimum cost", "shortest distance" and "least time" all point at Dijkstra. "Fewest moves" and "fewest steps" point away from it, at a breadth-first search, because those count edges rather than weights. "Profit" and "loss" are ambiguous and need the sign of the weights to be read carefully.

<Synonyms terms="dijkstra, dijkstra's algorithm, single source shortest path, sssp" />

## Naive approach

The first baseline is the repeated minimum scan. Keep a distance array initialized to infinity, and repeatedly pick the unvisited vertex with the smallest recorded distance, relax its edges, and repeat.

```text
distance[s] = 0, every other distance is infinity
repeat:
    pick the unvisited vertex v with the smallest distance[v]
    if there is no such vertex: stop
    for each edge (v, w) with weight c:
        if distance[v] + c < distance[w]:
            distance[w] = distance[v] + c
```

This is correct, and it is the algorithm that Dijkstra's proof is really about. Its problem is the scan: finding the smallest of $n$ recorded distances costs $O(n)$ and happens once per settled vertex, so the whole search costs $O(V^2 + E)$. With $n = 200\,000$ that is $4 \cdot 10^{10}$ comparisons, which is far too slow.

The second baseline is a repeated relaxation of every edge, which is Bellman-Ford. It costs $O(VE)$, which at the maximum constraints is $8 \cdot 10^{10}$ edge examinations. It also handles negative weights, which Dijkstra does not.

The third baseline is a breadth-first search, which costs $O(V + E)$ and is the fastest of the three. It is also the wrong algorithm here, because it reports the number of roads rather than the length of the route.

## Key insight

The insight is that the cheapest path to a vertex can be certified by the cheapest path to its predecessor.

Write $\delta(v)$ for the length of a shortest path from the source to $v$, and $d(v)$ for the tentative distance the algorithm has recorded so far. When the algorithm settles a vertex $v$, it asserts that $d(v) = \delta(v)$, and from that moment the value is never revised.

The greedy step that makes this work is: **the vertex with the smallest tentative distance can be settled immediately, because no route found later can be cheaper.** Two facts support it.

First, $d(v)$ is always the length of an actual path from the source to $v$, because the only way a distance is written is by relaxing an edge that was itself reached by a path. So $d(v) \ge \delta(v)$ at every moment, and the distance can only ever improve downwards toward the truth.

Second, and this is where the nonnegative assumption is spent, consider any alternative route to $v$ that has not been found yet. It must leave the settled region through some vertex $x$ that is not settled, and $x$ has a tentative distance of at least $d(v)$, because $v$ was the smallest. The rest of the route from $x$ to $v$ consists of edges of nonnegative weight, so adding it cannot make the total smaller than $d(v)$. Therefore the route cannot beat the value that has just been declared final.

The argument fails the instant a weight is negative, because then the remaining part of the route can _subtract_ from the total. The counterexample in the [common mistakes](#common-mistakes) section works the numbers out.

## Visual intuition

The laboratory below runs the search on a graph you can type in. The number under each vertex is its tentative distance, the gold vertex is the one being expanded, a green vertex has a final distance and a blue vertex has only a tentative one.

Watch the priority queue on the right. It is not a queue: it is a heap, and the smallest entry is always taken first. Two things are worth watching closely.

The first is the moment a vertex turns green. That happens on extraction, not on discovery, and the narration says why: no later route can be cheaper. A vertex that is discovered twice therefore appears twice in the heap.

The second is the stale entry. When a shorter route to a vertex is found, the algorithm does not reach into the heap to change the old entry. It pushes a second entry and lets the heap sort them out. The old entry still surfaces later, and when it does the narration says "this entry is stale, so discard it". That is not an optimization to be removed; it is how the algorithm replaces a decrease-key operation that most binary heaps do not support.

<AlgorithmPlayer algorithm="graphs.dijkstra" />

## Formal model

Let $G = (V, E)$ be a directed or undirected graph with a weight function $w : E \to \mathbb{R}_{\ge 0}$, and let $s \in V$ be the source.

<MathPanel type="definition" title="Definition">
The **distance** $\delta(v)$ of a vertex $v$ from $s$ is the length of a
shortest path from $s$ to $v$, that is the smallest sum of edge weights over
all paths from $s$ to $v$. It is undefined, and written $\infty$, when no
such path exists.
</MathPanel>

<MathPanel type="definition" title="Definition">
A vertex $v$ is **settled** at a moment of the algorithm if it has been
extracted from the priority queue with a key equal to its current tentative
distance, so that the edge relaxation of its outgoing edges has just been
performed. A settled vertex is never relaxed again.
</MathPanel>

<MathPanel type="definition" title="Definition">
An edge $(u, v)$ of weight $c$ is **relaxed** at a moment of the algorithm
if the algorithm replaces the tentative distance of $v$ by
$d(u) + c$ whenever $d(u) + c < d(v)$ holds.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
At every moment of the algorithm, $d(v) \ge \delta(v)$ for every vertex $v$.
The equality holds exactly when $d(v)$ is the length of a path from $s$ to
$v$, which is true of every value the algorithm ever writes.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
When a vertex $v$ is settled, $d(v) = \delta(v)$, provided every weight in
the graph is nonnegative.
</MathPanel>

## Algorithm derivation

The state is a distance array `distance` of $V$ entries and a min-priority queue of pairs $(d, v)$.

The update rule is the relaxation of an edge. When the edge $(u, v)$ of weight $c$ is examined while $u$ is settled, the candidate value $c' = d(u) + c$ is compared with $d(v)$:

1. If $d(v)$ is infinity or $c' < d(v)$, set $d(v) \gets c'$ and push the pair $(c', v)$ onto the heap.
2. Otherwise the edge changes nothing and nothing is pushed.

The update is correct because it maintains the invariant of the lemma above: the new value is the length of an actual path from $s$ to $v$, namely the path that reaches $u$ followed by the edge $(u, v)$. The comparison keeps the smaller of the two known paths, so the recorded distance is never worse than the best path found so far.

The heap is the second half of the derivation, and it is where the greedy step enters. The heap hands back the smallest tentative distance in the graph, so the vertex that is settled next is the one that is currently cheapest. The proof below shows that this is safe.

The initialization is a detail worth stating. The source has distance zero and is pushed onto the heap before the loop starts; every other vertex starts at infinity. If the source is not pushed separately, it is discovered again through its own neighbors and the search starts from the wrong place.

<MathPanel type="invariant" title="Invariant">
At every moment of the search, every settled vertex has its true distance
recorded, and every unsettled vertex has a tentative distance that is the
length of some path from the source to it. The heap holds exactly the pairs
whose key is a tentative distance that has not yet been settled.
</MathPanel>

## Step-by-step execution

Take the directed graph on vertices $s, a, b, t$ with the edges $s \to a$ of weight $10$, $s \to b$ of weight $3$, $b \to a$ of weight $2$ and $a \to t$ of weight $4$.

1. Set $d(s) = 0$ and push $(0, s)$. Every other distance is infinity. The heap is $[(0, s)]$.
2. Extract $(0, s)$. It matches $d(s)$, so $s$ is settled. Relax $s \to a$: the candidate is $0 + 10 = 10$, which beats infinity, so $d(a) = 10$ and $(10, a)$ is pushed. Relax $s \to b$: the candidate is $0 + 3 = 3$, so $d(b) = 3$ and $(3, b)$ is pushed. The heap is $[(3, b), (10, a)]$.
3. Extract $(3, b)$. It matches $d(b)$, so $b$ is settled. Relax $b \to a$: the candidate is $3 + 2 = 5$, which is smaller than $d(a) = 10$, so $d(a) = 5$ and $(5, a)$ is pushed. The heap is $[(5, a), (10, a)]$.
4. Extract $(5, a)$. It matches $d(a)$, so $a$ is settled. Relax $a \to t$: the candidate is $5 + 4 = 9$, so $d(t) = 9$ and $(9, t)$ is pushed. The heap is $[(9, t), (10, a)]$.
5. Extract $(9, t)$. It matches $d(t)$, so $t$ is settled and $t$ has no outgoing edges. The heap is $[(10, a)]$.
6. Extract $(10, a)$. The current value of $d(a)$ is $5$, not $10$, so this entry is **stale**. It is discarded, and $a$ is not expanded a second time. The heap is empty and the search ends.

The final distances are $0$, $5$, $3$ and $9$ for $s$, $a$, $b$ and $t$. The true answer for $t$ is $3 + 2 + 4 = 9$ through $b$, which is what the search found, and the route through $a$ alone costs $10 + 4 = 14$.

Step 6 is the one that confuses readers, so it is worth naming: vertex $a$ was reached twice, first at tentative distance $10$ and then at tentative distance $5$. Both entries are in the heap, because the algorithm never edits an entry in place. The newer entry is extracted first, because $5 < 9 < 10$, and it settles $a$. The older entry survives in the heap until it surfaces, and at that point it no longer matches the recorded distance, so it is thrown away. The guard in the code that performs this check is one line:

```text
current, v = pop the smallest pair
if current != distance[v]:
    continue          # a shorter route was found later; this entry is stale
```

Removing that check does not change the answer, but it does change the work: the stale entry would expand $a$ a second time and relax its edges a second time with a distance that is too large.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
When the search terminates, $d(v) = \delta(v)$ for every vertex $v$ reachable
from the source, and $d(v) = \infty$ for every vertex that is not reachable.
</MathPanel>

<MathPanel type="proof" title="Proof">
We prove the key lemma first: when a vertex is settled, its tentative
distance is its true distance.

The proof is an induction on the number of vertices that have already been settled. The base case is the source. It is settled first, with $d(s) = 0$, and $\delta(s) = 0$ because the empty path is the only path of length zero that a nonnegative-weight graph can offer.

For the inductive step, let $u$ be the next vertex to be settled, and suppose for a contradiction that $d(u) > \delta(u)$. Take a shortest path $P = v_0, v_1, \ldots, v_k = u$ from the source to $u$, and let $i$ be the smallest index such that $v_i$ has not been settled. Such an index exists, because $u$ has not been settled, and $i \ge 1$, because the source has been.

Put $x = v_i$ and $y = v_{i-1}$. The vertex $y$ has been settled, so by the induction hypothesis $d(y) = \delta(y)$. When $y$ was settled, the edge $(y, x)$ was relaxed, so

$$
d(x) \le d(y) + w(y, x) = \delta(y) + w(y, x) = \delta(x),
$$

where the last equality holds because every prefix of a shortest path is itself a shortest path. Since $d(x)$ is also the length of an actual path, $d(x) \ge \delta(x)$, so $d(x) = \delta(x)$.

The vertex $x$ has not been settled, so it is in the heap with the key $d(x)$. The vertex $u$ was extracted as the smallest key, so $d(u) \le d(x)$. And because every weight on the suffix of $P$ from $x$ to $u$ is nonnegative, that suffix has nonnegative length and therefore $\delta(u) \ge \delta(x) = d(x)$. Putting the inequalities together,

$$
d(u) \le d(x) = \delta(x) \le \delta(u),
$$

which says $d(u) \le \delta(u)$, contradicting the assumption $d(u) > \delta(u)$. Hence $d(u) = \delta(u)$. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The search terminates, and every reachable vertex is settled.
</MathPanel>

<MathPanel type="proof" title="Proof">
Every relaxation pushes at most one entry onto the heap, and there is one
relaxation per edge per settled vertex. A vertex is settled at most once,
because after it is settled its distance never changes and its heap entry is
removed, so there are at most $V$ settlements and at most $E$ relaxations.
The heap therefore holds at most $E + 1$ entries and is emptied by the
search.

Every reachable vertex is settled: let $w$ be reachable, and let $v_0, \ldots, v_k = w$ be a simple path from the source to $w$. By induction on the index, each $v_i$ is settled: $v_0$ is the source, and when $v_i$ is settled the edge to $v_{i+1}$ is relaxed, so $v_{i+1}$ enters the heap and is eventually extracted. A vertex that is never settled is never given a finite distance, so its recorded value stays infinity, which is correct. $\square$
</MathPanel>

The exchange argument behind the induction is worth stating in words, because it is the part that is easy to get wrong. The proof does not assume that the settled region is already correct; it assumes only that the vertices _already settled_ are correct, and then shows that the next one is correct too. The exchange is the step where the suffix of the path is charged to the vertex $x$ that leaves the settled region: the algorithm pays for the rest of the route with the single value $d(x)$, and the nonnegative weights make that payment safe.

## Complexity analysis

**Time: $O((V + E) \log V)$.** Every vertex is settled at most once, and settling a vertex examines each of its incident edges once, so there are at most $E$ relaxations. Each relaxation pushes at most one entry onto the heap, and each extraction removes one entry. The heap holds at most $E + 1$ entries, so a push or a pop costs $O(\log E)$, which is $O(\log V)$ whenever the graph is simple, since $E = O(V^2)$. The total is therefore $O((V + E) \log V)$.

**Auxiliary space: $O(V + E)$.** The distance array holds $V$ entries. The heap holds at most one entry per successful relaxation, and there are at most $E$ of those, so the heap holds $O(E)$ entries. A binary heap does not support a decrease-key operation cheaply, which is exactly why the implementation pushes a second entry instead of editing the first one.

The graph itself is an adjacency list with $O(V + E)$ entries, so the total working set is the $O(V + E)$ figure recorded in the manifest.

<MathPanel type="complexity" title="Complexity">
Dijkstra's algorithm with a binary min-heap: time $O((V + E) \log V)$,
auxiliary space $O(V + E)$ for the distance array and the heap. A variant
that supports decrease-key keeps the heap at $O(V)$ entries and does not
change the time bound.
</MathPanel>

Two practical warnings belong here. First, the distances must be stored in a type that can hold a sum of weights: with $V$ edges of weight up to $10^9$, a shortest path can be $2 \cdot 10^{14}$, which overflows a 32-bit integer. The reference implementations use 64-bit integers, except in JavaScript, where a number beyond $2^{53}$ loses precision. Second, the heap operations dominate the running time, so a contest solution that pushes and pops manually should use a real priority queue rather than a sorted array.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Cheapest path from one source, weights nonnegative | Dijkstra's algorithm |
| Cheapest path from one source, weights zero or one | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Cheapest path from one source, weights may be negative | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Fewest edges from one source | [Breadth-first search](/algorithms/graphs/bfs) |
| Cheapest path between every pair of vertices | Floyd-Warshall |
| Cheapest path in a directed acyclic graph | A topological order, then relaxation |
| Cheapest path from many sources, one target | One search from the target |
| Which vertices are reachable | [Depth-first search](/algorithms/graphs/dfs) or breadth-first search |
| A minimum spanning tree | Kruskal with a [disjoint set union](/algorithms/graphs/dsu), or Prim |

The five shortest-path algorithms differ in exactly one dimension, the assumption they make about the weights, and in one other dimension, how many sources they answer for. The table below puts them side by side.

|  | Dijkstra | 0-1 BFS | Bellman-Ford | Floyd-Warshall |
| --- | --- | --- | --- | --- |
| Weight assumption | Nonnegative | Zero or one | Any, including negative | Any, but no negative cycle |
| Sources answered | One | One | One | All pairs |
| Container | Binary min-heap | Deque | None, repeated passes | Distance matrix |
| Time | $O((V + E) \log V)$ | $O(V + E)$ | $O(VE)$ | $O(V^3)$ |
| Space | $O(V + E)$ | $O(V + E)$ | $O(V)$ | $O(V^2)$ |
| Negative cycle | Not detected | Not detected | Detected | Detected, as a negative diagonal entry |
| Best fit | Large general graphs | Binary weights | Small graphs with negative weights | Dense small graphs |

Read the table from the bottom up when choosing. Floyd-Warshall answers more questions than Dijkstra and needs no assumption about the weights, but its $O(V^3)$ time only fits a graph of a few thousand vertices, and its $O(V^2)$ space only fits a few tens of thousands. Bellman-Ford drops the nonnegative assumption at the cost of a factor of $E$ in time. 0-1 BFS is the special case of Dijkstra in which the heap can be replaced by a deque, and it is the fastest of the three for binary weights. Dijkstra is the general answer, and it is the one to reach for when the statement does not narrow the weights down further.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source.

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes two variants in each of the six languages. The `minimal` variant is a reusable function that takes an adjacency list of weighted edges and a source, and writes the distance to every vertex into the caller's array, using $-1$ for the vertices the source cannot reach. The `program` variant parses a graph from standard input and prints the same distances, one line of space-separated numbers.

Both variants use a binary min-heap of $(d, v)$ pairs and both discard stale entries, so they agree on every input. The C version grows the heap buffer by doubling it, so the cost of a push is amortized constant apart from the sift; the C++ version uses `std::priority_queue` with the same ordering, and the Java version uses a `PriorityQueue` of a small `QueueEntry` class whose `compareTo` orders the entries by the distance field. Ties may be broken differently by different languages, which changes the order in which the distances are discovered but never the distances themselves.

## Recursion decision

Dijkstra's algorithm is iterative. There is no natural recursive form of it, because the recursive form would have to choose which vertex to expand next, and that choice is precisely the priority queue.

The recursive shape people try first is the depth-first search with a distance array, and it is wrong in a specific way: it settles vertices in discovery order rather than in order of distance, so the first distance it writes for a vertex is not necessarily the shortest one, and it never revisits the vertex. That is the depth-first search from the [depth-first search](/algorithms/graphs/dfs) article, and it computes the length of a tree-like path rather than the cheapest path.

The genuine recursive formulation processes one distance level per call, in the same way that a breadth-first search can be written level by level. Its recursion depth is the number of distinct tentative distances, which is at most $V$ but is usually far smaller. The language limits are the usual ones.

| Language   | Default stack              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the heap   |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the heap   |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the heap   |
| Pascal     | The operating system stack | Depends on the platform | Use the heap   |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the heap   |

The recommendation is the same in every language: use the heap. The heap holds $O(V + E)$ entries in this implementation, because it keeps a stale entry for every successful relaxation, and the loop is a loop.

## Implementation walkthrough

Three lines carry the whole algorithm.

```cpp
if (current != distance[v]) {
    continue;                 // a shorter route was found later
}
```

is the stale check, and it is the line most often left out.

```cpp
const long long candidate = current + weight;
if (distance[w] >= 0 && candidate >= distance[w]) {
    continue;                 // the relaxation would not improve anything
}
distance[w] = candidate;
heap.push({candidate, w});
```

is the relaxation, and the `distance[w] >= 0` test is what distinguishes "not yet reached" from "reached". The implementation stores $-1$ for an unreachable vertex, so the guard is not optional: without it, the comparison `candidate >= distance[w]` is true for every unreached vertex, because $-1$ is smaller than every candidate, and the relaxation would be refused. The vertex would then never be discovered at all.

The third line is the initialization, and it must happen before the loop:

```cpp
distance[source] = 0;
heap.push({0, source});
```

An edge whose weight is negative is not silently handled by the reference implementation of the program variant: the manifest says that such an edge is ignored when the graph is read, because the algorithm is only correct for nonnegative weights and quietly accepting a negative edge would produce a wrong answer rather than an error.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Applying the algorithm to a graph with a negative edge | A distance is finalized too early and is wrong | Check the weights; use Bellman-Ford |
| Forgetting the stale check | A vertex is expanded twice, which wastes time and adds entries | Test `current != distance[v]` on extraction |
| Using $-1$ as the distance of an unreached vertex without a guard | The relaxation is refused and the vertex is never reached | Guard with `distance[w] >= 0` |
| Initializing the source distance to infinity | The source is rediscovered through its own neighbors | Set the source distance to zero first |
| Using 32-bit integers for the distances | The sum overflows and the answer is wrong | Use a 64-bit type |
| Marking a vertex as visited when it is discovered | A later, shorter route to it is ignored | Settle on extraction, not on discovery |
| Pushing the source only when it is first relaxed | The search starts from the wrong vertex | Push the source explicitly |
| Sorting the adjacency list by weight | Nothing at all changes; it is not a substitute for the heap | Use a priority queue |
| Forgetting to test whether the target is reachable | The answer for an unreachable target is the sentinel | Test the sentinel before printing |

### Why this fails: the negative edge that breaks the greedy step

The mistake that survives review most often is running this algorithm on a graph that has a negative edge. It is invisible in the code, because the code is exactly the code for the nonnegative case, and it produces a plausible number rather than a crash.

Consider four vertices $s$, $a$, $b$ and $t$ with these edges:

| Edge      | Weight |
| --------- | ------ |
| $s \to a$ | $1$    |
| $s \to b$ | $4$    |
| $b \to a$ | $-6$   |
| $a \to t$ | $1$    |

The true distances are $\delta(a) = \min(1,\ 4 - 6) = -2$ and $\delta(t) = \delta(a) + 1 = -1$, reached along the route $s \to b \to a \to t$.

Now run Dijkstra on it.

1. $d(s) = 0$. Relaxing the two edges out of $s$ gives $d(a) = 1$ and $d(b) = 4$.
2. The smallest tentative distance is $1$, at $a$, so $a$ is settled with $d(a) = 1$. This is the claim that no later route can be cheaper.
3. Relaxing $a \to t$ gives $d(t) = 1 + 1 = 2$.
4. $t$ is settled with $d(t) = 2$, which is now final.
5. $b$ is settled with $d(b) = 4$. Relaxing $b \to a$ gives the candidate $4 - 6 = -2$, which is smaller than $d(a) = 1$, so the algorithm would like to set $d(a) = -2$. But $a$ was settled two steps ago, and its outgoing edge to $t$ was relaxed with the stale value $1$.

The algorithm reports $d(a) = 1$ and $d(t) = 2$. The true answers are $-2$ and $-1$. The reported distance to $t$ is three units too large, and it was reported as final before the cheaper route had even been discovered.

The failure is exactly at step 2, and the reason is the edge $b \to a$. The claim "no later route can be cheaper" rests on the route leaving the settled region through a vertex $x$ whose tentative distance is at least $d(a)$, and on the rest of the route not being able to subtract from that. With the weight $-6$, the rest of the route subtracts $6$ from $4$, and $4 - 6 = -2$ is below $d(a) = 1$. The greedy step has no defense against that, because the greedy step was only ever proved for nonnegative weights.

The fix is not a patch to the greedy step. It is to use an algorithm that does not have a greedy step: relax every edge repeatedly, as [Bellman-Ford](/algorithms/graphs/bellman-ford) does, and the same graph gives $d(a) = -2$ and $d(t) = -1$.

## Variants and extensions

- **Decrease-key instead of lazy deletion.** A heap that supports decrease-key keeps the entry for $v$ at its current best distance, so the stale entry never exists. The heap then holds $O(V)$ entries rather than $O(E)$, and the time bound is unchanged.
- **Bidirectional search.** Run one search from the source and one from the target and stop when they meet. On a graph of exponential growth this cuts the explored region roughly in half.
- **Early termination.** When a single target is wanted, stop as soon as the target is extracted. The distance of the target is final at that moment.
- **Multi-source search.** Push every source at distance zero before the loop. The result is the distance to the nearest source.
- **Shortest path trees.** Record the predecessor of each vertex when it is relaxed. The predecessors form a tree, and the route to any vertex is recovered by walking back up it.
- **The reweighting trick.** When a graph has negative edges but no negative cycle, potentials computed by Bellman-Ford can be subtracted from every weight to make them all nonnegative, after which Dijkstra applies. This is the engine of Johnson's algorithm.
- **A graph with an implicit edge set.** A grid with weighted moves is a graph whose edges are computed on demand. The search code does not change; only the neighbor function does.

## Contest strategy

Under contest pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Read the weights before writing code. Zero or one means 0-1 BFS, all one means breadth-first search, nonnegative means Dijkstra, and any negative value means Bellman-Ford. Write the decision down.
2. Decide the answer type before writing code: a distance that can exceed $2^{31}$ needs a 64-bit type, and the sentinel for an unreachable vertex must not be confused with a real distance.
3. Use a real priority queue, and push the source explicitly before the loop.
4. Keep the stale check. It is one line and it is the difference between a search that expands each vertex once and one that does not.
5. If the problem allows it, write the naive repeated-minimum-scan version first and use it as a reference on small random graphs. A disagreement between the two is a counterexample you can debug.
6. Decide whether the graph is directed before adding the edges, and add each edge in the right direction only.
7. If the statement allows negative weights anywhere, use Bellman-Ford. It is slower, and it is always correct.

## Worked problems

### Problem 1: the delivery network

**Restatement.** A road network has $n$ towns and $m$ two-way roads, each road with a nonnegative length. Given a depot town $s$, report the length of the cheapest route from $s$ to every town, and $-1$ for the towns that cannot be reached. Constraints: $1 \le n \le 200\,000$, $0 \le m \le 400\,000$, and every road length is at most $10^9$.

**Naive baseline.** Repeatedly pick the unvisited town with the smallest recorded distance and relax its roads. This is correct and costs $O(V^2 + E)$, which is $4 \cdot 10^{10}$ comparisons at the maximum constraints.

**Insight.** The lengths are nonnegative, so the town that currently has the smallest tentative distance has its final distance, and no later route can beat it.

**Derivation.** Keep a distance array initialized to $-1$ for "not yet reached". Set `distance[s] = 0` and push the pair $(0, s)$ onto a min-heap. While the heap is not empty, extract the pair $(d, v)$; if $d$ is not equal to `distance[v]`, discard it as stale; otherwise relax every road out of $v$, writing the new distance and pushing the new pair whenever the candidate is smaller.

**Correctness.** The exchange argument in the correctness proof shows that every settled vertex has its true distance, and that every reachable vertex is settled before the search ends. The vertices that are never settled keep the sentinel, which is the answer for them.

**Complexity.** $O((V + E) \log V)$ time and $O(V + E)$ space, including the adjacency list. The distances need a 64-bit type, because a cheapest route can be as long as $(V - 1) \cdot 10^9$.

**Common wrong approach.** Using breadth-first search because the graph is "just a graph". The search then reports the number of roads rather than their length, and it is wrong on any graph where the two differ.

### Problem 2: the grid with weighted moves

**Restatement.** A robot stands on a cell of an $R$ by $C$ grid. Moving right or up costs $1$, moving diagonally costs $2$, and some cells are blocked. Report the minimum cost to reach the target cell. Constraints: $1 \le R, C \le 1\,000$, so at most $10^6$ cells.

**Naive baseline.** A dynamic program over the rows, processing cells in row-major order. That works only when the moves always go right or down. The moment the robot is allowed to move in all four directions the grid has cycles, the row-major order is no longer a valid processing order, and the dynamic program does not terminate correctly.

**Insight.** The grid is an implicit graph whose vertices are the cells and whose edges are the legal moves, with the move cost as the weight. The weights are nonnegative, so the shortest-path algorithm applies, and the graph never has to be built.

**Derivation.** Run the ordinary search over the cells. The neighbor function of a cell is the list of legal moves from that cell, each with its cost. The distance array is indexed by the cell number $r \cdot C + c$, and the heap holds pairs of cost and cell number.

**Correctness.** The grid is exactly the graph of legal moves, and every legal route is a path in it, so the shortest-path distance of the target cell is the minimum cost of a legal route. The search computes that distance correctly by the theorem above.

**Complexity.** There are $RC$ vertices and at most $8RC$ edges, so the search costs $O(RC \log(RC))$ time and $O(RC)$ space, with no explicit adjacency list.

**Common wrong approach.** Forgetting that the diagonal move costs $2$ and treating every move as costing $1$, or forgetting that a blocked cell is skipped in the neighbor function but is still a vertex that must be marked.

### Problem 3: when the weights are not nonnegative

**Restatement.** A graph has $n$ vertices and $m$ edges, and the edge weights may be negative. Report whether the graph contains a negative cycle, and if it does not, report the shortest distance from a source to every vertex. Constraints: $1 \le n \le 1\,000$, $0 \le m \le 5\,000$.

**Naive baseline.** Run Dijkstra anyway. On the graph from the common mistakes section it reports $d(t) = 2$ when the true answer is $-1$, and it cannot detect a negative cycle at all.

**Insight.** Without the nonnegative assumption there is no greedy step, so the order in which vertices are settled no longer carries information. The replacement is to relax every edge repeatedly, which works because a shortest path has at most $V - 1$ edges.

**Derivation.** Set every distance to infinity and the source's distance to zero. Relax every edge of the graph, repeatedly, for $V - 1$ passes. If any distance still improves on the $V$-th pass, the graph contains a negative cycle.

**Correctness.** After $k$ passes, the recorded distance of every vertex is the length of the shortest path from the source using at most $k$ edges. A shortest path uses at most $V - 1$ edges, so $V - 1$ passes suffice, and a further improvement means a cycle of negative total weight exists.

**Complexity.** $O(VE)$ time and $O(V)$ space, which is $5 \cdot 10^6$ operations at the maximum constraints and comfortably inside the limit.

**Common wrong approach.** Running $V$ passes and stopping at the first pass with no change. That is an optimization, and it is correct only if the absence of change is detected after the pass that would have found the shortest paths, not before.

## Practice progression

1. **Recognition.** Given a statement, decide whether Dijkstra applies. Check the sign of the weights first, then the number of sources, then the constraint values. Write the decision down.
2. **Direct application.** Implement the search over an adjacency list, with the stale check, and verify it against the naive repeated-minimum scan on small random graphs.
3. **Adaptation.** Implement it over an implicit grid, over a graph with parallel edges, and over a graph where a vertex may be unreachable; then add the early termination for a single target and the predecessor array for path reconstruction.
4. **Combination.** Use a Dijkstra run to compute the shortest path tree and then answer reachability questions on it; or use it to find the cheapest cycle through a given vertex by running it from that vertex and taking the smallest edge back to the source.
5. **Challenge.** Solve a problem on a graph with $10^6$ vertices where the weights are up to $10^{15}$, so the distances need 64-bit arithmetic and the heap must not be searched linearly.
6. **Transfer.** Use the same machinery for a different question: the reweighting step of Johnson's algorithm, the minimax path problem, or the shortest path in a graph whose weights change over time.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What single assumption does Dijkstra make about the edge weights, and where in the proof is it used? (Key insight, Correctness proof)
2. State the exchange argument in your own words: why can the vertex with the smallest tentative distance be settled immediately? (Correctness proof)
3. Why does a shorter route to a vertex push a second entry onto the heap instead of changing the first one, and what happens when the old entry surfaces? (Implementation walkthrough)
4. What does the algorithm report for the four-vertex graph with the edge $b \to a$ of weight $-6$, and what are the true distances? (Common mistakes)
5. Give the five shortest-path algorithms and the weight assumption of each. (Algorithm selection)
6. Why is the running time $O((V + E) \log V)$ rather than $O(V + E)$? What changes if the heap supports decrease-key? (Complexity analysis)
7. Why must the distances be stored in a 64-bit type? (Implementation walkthrough)
8. When the graph has zero-weight edges, what property makes the greedy step safe? (Key insight)
9. Which constraint value tells you that a breadth-first search is enough, and which one rules Dijkstra out? (Recognition patterns)
10. Why is the recursive form of this algorithm not a depth-first search with a distance array? (Recursion decision)

## Further reading

- The queue-based sibling of this search, and the reason it counts roads rather than cost, is in [breadth-first search](/algorithms/graphs/bfs).
- The same search with a deque instead of a heap is [0-1 BFS](/algorithms/graphs/0-1-bfs), and it is linear.
- The version that handles negative weights and detects negative cycles is [Bellman-Ford](/algorithms/graphs/bellman-ford).
- The ordering of a directed acyclic graph, which is the right frame for a weighted graph that cannot contain a cycle, is [topological sort](/algorithms/graphs/topological-sort).
- The traversal that shares the shape but not the purpose is [depth-first search](/algorithms/graphs/dfs).
- The graph representation the search assumes, and the difference between an adjacency list and an adjacency matrix, are covered in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
- Every listing in this article, in all six languages, is collected on the [Dijkstra source page](/implementations/graphs-dijkstra/).
