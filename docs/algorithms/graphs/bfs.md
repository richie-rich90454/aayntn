---
id: graphs.bfs
title: Breadth-first search
summary: Explore a graph level by level from a start vertex, so the first time a vertex is reached it is reached by a shortest path.
division: [silver, gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [breadth-first search, bfs, shortest path, queue, unweighted graph, levels]
prerequisites:
    required: [graphs.representation]
    recommended: [graphs.dfs, start.data-structures]
complexity:
    time: "O(V + E)"
    space: "O(V + E)"
assumptions:
    - Every edge has unit cost, so the BFS distance is the true shortest-path distance.
implementations: graphs.bfs
visualization: graphs.bfs
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.bfs" />

A breadth-first search explores a graph in rings. It visits every vertex at distance one from the start, then every vertex at distance two, and so on, so the traversal order is an order by distance. That single property is why a breadth-first search answers shortest-path questions in an unweighted graph, and it is the only reason.

The algorithm is a distance array and a first-in, first-out queue. The one rule that is not negotiable is that a vertex is marked when it is _enqueued_, not when it is dequeued. Marking on enqueue is what makes each vertex enter the queue exactly once, and it is what makes the recorded distance the first and only distance that vertex ever gets.

The traversal costs $O(V + E)$ time. The distance array holds $O(V)$ entries and the queue holds at most one entry per vertex, so the traversal's own working set is $O(V)$; the $O(V + E)$ figure in the manifest includes the adjacency list that the search is given.

## Problem motivation

A courier stands in a town and wants to reach a target town. The road map has $n$ towns and $m$ two-way roads, and every road takes exactly one hour to drive. The courier wants to know the fewest hours the trip can take.

The constraints:

- $1 \le n \le 200\,000$ towns.
- $0 \le m \le 400\,000$ roads.
- Every road has the same cost, one hour.

The phrase "fewest hours" is what matters. Because every road costs the same, "fewest hours" is the same question as "fewest roads", and the question becomes a question about the _number of edges_ in a path rather than about the sum of weights along it. That is the situation in which a breadth-first search is exactly the right tool.

Compare it with a road map where one road is a motorway and another is a dirt track. Then the fewest hours is a question about the sum of weights, the number of roads along the route is no longer the answer, and the breadth-first search computes the wrong thing. The article returns to this with a counterexample.

## Recognition patterns

A breadth-first search is the right tool when the question is about the _number of steps_ rather than the _cost of steps_.

- The problem asks for the **fewest moves**, **fewest edges**, **fewest steps** or **shortest path**, and every step costs the same.
- The graph is **unweighted**, or the weights are all equal.
- The problem asks for the **level** or **depth** at which a vertex appears, as in "how many moves from the start".
- Several sources must be compared: "**nearest** to any of these $k$ starting points".
- A grid has **unit cost** per step, and the obstacles are blocked cells.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| All edges have cost $1$ | Rules in breadth-first search for shortest paths |
| Edge weights differ, all positive | Rules out breadth-first search; use Dijkstra |
| Edge weights differ, some negative | Rules out breadth-first search and Dijkstra; use Bellman-Ford |
| Weights are $0$ or $1$ | Rules out plain breadth-first search; use 0-1 BFS |
| $n, m \le 10^5$ | One breadth-first search is comfortable; many are not |
| $q \le 10^5$ queries on a static graph | One search that records distances answers all of them |

Two phrases in a statement are reliable signals. "Fewest" or "minimum number of" points at breadth-first search. "Cheapest" or "minimum cost" points away from it, because a cost is a sum and a breadth-first search never sums anything.

<Synonyms terms="breadth-first search, bfs, breadth first search, level-order traversal, unweighted shortest path" />

## Naive approach

The first baseline is to walk without recording anything, exactly as in the depth-first article. On a graph with a cycle it never terminates.

The second baseline is the "repeated minimum scan". Keep a distance array initialized to infinity, and repeatedly pick the unvisited vertex with the smallest recorded distance, relax its edges, and repeat. This is the textbook algorithm for weighted graphs, and it is correct here, but the scan for the minimum is $O(V)$ per iteration, so the whole search costs $O(V^2 + E)$. With $n = 200\,000$ that is $4 \cdot 10^{10}$ comparisons, which is far too slow.

The third baseline is to run a full search for every query, at a cost of $O(q(V + E))$. This is what a reader reaches for when the queries arrive one at a time on a small graph, and it is unnecessary as soon as the graph is static: one search that records the distance to every vertex answers every query about that source.

## Key insight

The insight is that a first-in, first-out queue keeps the search in order of distance.

Think of the queue as a list of the vertices that have been discovered but not yet expanded, in the order they were discovered. The first vertex discovered is the start, at distance zero. When it is expanded, all of its neighbors are discovered and appended to the back of the queue, so they sit behind every vertex already in the queue. Those neighbors are at distance one. When the first of them is expanded, its neighbors are appended behind the rest of the distance-one vertices, so they are at distance two.

The queue therefore empties level by level. And because a vertex is marked at the moment it is enqueued, a vertex is discovered exactly once, at the earliest level at which it appears. So the distance recorded at discovery is already a shortest-path distance, and no relaxation or revisiting is ever needed.

The contrast with depth-first search is the whole point. A stack hands back the most recently discovered vertex, so the search goes as deep as it can and the order carries no information about distance. A queue hands back the least recently discovered vertex, so the order is by level and the order _is_ the answer.

## Visual intuition

The laboratory below runs the traversal on a graph you can type in. The number printed under each vertex is the distance at which it was discovered, and the queue is drawn as a horizontal strip beside the graph, with vertices entering at the right and leaving at the left.

Watch the levels. After the start vertex is expanded, the queue holds exactly the vertices at distance one. When the first of them is expanded, the vertices at distance two are appended behind the remaining distance-one vertices, so the queue never mixes the two levels. That is the whole mechanism, and it is why the number under a vertex is final the moment the vertex appears in the queue.

<AlgorithmPlayer algorithm="graphs.bfs" />

## Formal model

Let $G = (V, E)$ be an undirected graph with unit-cost edges and let $s \in V$ be the source.

<MathPanel type="definition" title="Definition">
For $k \ge 0$, let $L_0 = \{s\}$ and let

$$
L_{k+1} = \bigl\{ v \in V : v \notin L_0 \cup \cdots \cup L_k \text{ and some } u \in L_k \text{ has } \{u, v\} \in E \bigr\}.
$$

The set $L_k$ is the **level** of the vertices at distance $k$ from $s$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **distance** $d(v)$ of a vertex $v$ from $s$ is the length of a
shortest path from $s$ to $v$, that is, the smallest $k$ with $v \in L_k$.
The distance is undefined, and written $\infty$, when no path exists.
</MathPanel>

<MathPanel type="definition" title="Definition">
A **breadth-first search** of $G$ from $s$ is a traversal in which the
vertices waiting to be expanded are held in a first-in, first-out queue, so
that they are expanded in the order they were discovered, which is an
order of non-decreasing distance from $s$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
The levels partition the vertices reachable from $s$: every reachable
vertex belongs to exactly one $L_k$, and $v \in L_k$ if and only if
$d(v) = k$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
The queue of a breadth-first search holds vertices of at most two
consecutive levels at any moment, and every vertex of a lower level leaves
the queue before any vertex of a higher level enters it.
</MathPanel>

## Algorithm derivation

The state is a distance array `distance` of $n$ entries, initialized to $-1$ for "not yet discovered", and a queue.

The update rule is: when a vertex $w$ is first reached from a vertex $v$, set `distance[w] = distance[v] + 1` and push $w$ onto the back of the queue.

The rule is correct because of the level discipline of the queue. When $v$ is expanded, it is at some level $k$, so `distance[v] = k`. Every neighbor $w$ of $v$ that has not been discovered is at distance exactly $k + 1$, because a path of length $k+1$ exists through $v$, and no shorter path exists, because every vertex at a level below $k$ has already been expanded and every vertex at level $k$ has already been discovered. The recorded value is therefore the true distance.

The derivation of the initialization is equally important. The source is discovered at distance zero, so `distance[s] = 0` before the loop starts. If it is left at $-1$, the source is rediscovered through its own neighbors, and the level structure collapses.

<MathPanel type="invariant" title="Invariant">
At every moment of the search, the queue holds a suffix of the vertices of
one level followed by a prefix of the vertices of the next level, and every
vertex in the queue has its true distance recorded.
</MathPanel>

## Step-by-step execution

Take the undirected graph on vertices $0,1,2,3,4,5$ with edges $0\!-\!1$, $0\!-\!2$, $0\!-\!4$, $1\!-\!3$, $2\!-\!3$, $3\!-\!4$. Vertex $5$ is isolated. The adjacency lists are $0: (1,2,4)$, $1: (0,3)$, $2: (0,3)$, $3: (1,2,4)$, $4: (0,3)$, $5: ()$.

The search from $0$ proceeds like this.

1. Set `distance[0] = 0` and enqueue $0$. The queue is $[0]$.
2. Dequeue $0$, which is at distance zero. Its neighbors $1$, $2$ and $4$ are undiscovered, so each gets distance $1$ and is enqueued. The queue is $[1, 2, 4]$.
3. Dequeue $1$, which is at distance one. Its neighbor $0$ is already discovered; its neighbor $3$ is not, so $3$ gets distance $2$ and is enqueued. The queue is $[2, 4, 3]$.
4. Dequeue $2$, at distance one. Its neighbors $0$ and $3$ are both discovered, so nothing happens. The queue is $[4, 3]$.
5. Dequeue $4$, at distance one. Its neighbors $0$ and $3$ are both discovered. The queue is $[3]$.
6. Dequeue $3$, at distance two. All of its neighbors are discovered. The queue is empty and the search ends.

The distances are $0, 1, 1, 2, 1, -1$ for vertices $0$ through $5$. The minus one for vertex $5$ says that it is unreachable, which is true: it has no edges at all.

Notice step 3. Vertex $3$ is a neighbor of both $1$ and $2$, and it is discovered from $1$ at distance two. When $2$ is expanded later, $3$ is already discovered, so its distance is not overwritten. If it were overwritten it would still be two, but if the graph were such that a longer route reached it first, the overwrite would make the answer wrong. Marking at enqueue is what makes that impossible.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
When the search terminates, `distance[v]` is the length of a shortest path
from $s$ to $v$ for every vertex $v$ reachable from $s$, and it is $-1$ for
every vertex that is not reachable.
</MathPanel>

<MathPanel type="proof" title="Proof">
We prove first that every vertex taken out of the queue has its true
distance recorded, by induction over the number of dequeue operations.

The base case is the first dequeue. The only vertex in the queue is $s$, and `distance[s] = 0` was set before the loop, which is correct because the shortest path from $s$ to itself has length zero.

For the inductive step, suppose the vertex $v$ being dequeued has its true distance $k$ recorded. Every neighbor $w$ of $v$ that is still undiscovered receives the value $k + 1$. We show that $k + 1$ is the distance of $w$. There is a path from $s$ to $v$ of length $k$ by the induction hypothesis, and the edge $\{v, w\}$ extends it to a path of length $k + 1$, so $d(w) \le k + 1$. Suppose for a contradiction that $d(w) \le k$. Then $w$ lies in some level $L_j$ with $j \le k$. By the lemma about the queue, every vertex of a level at most $k$ is expanded before any vertex of a level above $k$ is expanded, and the expansion of $w$ would have discovered $w$ before $v$ was expanded. But $w$ is still undiscovered, a contradiction. Hence $d(w) = k + 1$, and the recorded value is correct.

It remains to show that the search terminates and reaches every reachable vertex. Each vertex is enqueued at most once, because it is marked at the moment it is enqueued, so the queue holds at most $n$ entries. Each dequeue examines the incident edges of one vertex, so at most $2E$ edge examinations happen, and the loop therefore ends. When it ends, the queue is empty, and every vertex reachable from $s$ has been enqueued: the induction above shows that a vertex of level $k$ is discovered while a vertex of level $k - 1$ is expanded, and the expansion of level $0$ is guaranteed. A vertex that was never enqueued was never discovered, so no path from $s$ reaches it, and its distance is correctly recorded as $-1$. $\square$
</MathPanel>

## Complexity analysis

**Time: $O(V + E)$.** Every vertex is enqueued at most once and dequeued at most once, because it is marked when it is enqueued. Dequeuing a vertex examines each of its incident edges once, and every edge is incident to two vertices, so at most $2E$ edge examinations happen in the whole search. The total is $O(V + E)$.

**Space.** The distance array holds $V$ entries, and the queue holds at most one entry per vertex, so the traversal's own working set is $O(V)$. The adjacency list that the search is given holds $O(V + E)$ entries, and that is the $O(V + E)$ figure recorded in the manifest: the search needs the graph, and the graph is the largest object in the program.

<MathPanel type="complexity" title="Complexity">
Breadth-first search over an adjacency list: time $O(V + E)$. Auxiliary
structures $O(V)$ for the distance array and the queue, for a total of
$O(V + E)$ including the adjacency list.
</MathPanel>

One practical warning belongs here. In Python, `list.pop(0)` is $O(n)$ because every remaining element is shifted, so a queue implemented with `pop(0)` turns the whole search into $O(V^2)$. Use `collections.deque`, or a list with a head index that only ever moves forward. The same trap exists in Java with `ArrayList.remove(0)`, and in JavaScript with `Array.prototype.shift`.

## Algorithm selection

| Situation                                        | What to use                                  |
| ------------------------------------------------ | -------------------------------------------- |
| Fewest edges from a source, all edges cost one   | Breadth-first search                         |
| Distance from a source on a grid                 | Breadth-first search                         |
| Nearest of several sources                       | Multi-source breadth-first search            |
| Bipartite test by two-coloring                   | Breadth-first search with alternating colors |
| Fewest moves on a board with $k$ states per cell | Breadth-first search on the state graph      |
| Cheapest path, positive weights                  | Dijkstra's algorithm                         |
| Cheapest path, weights zero or one               | 0-1 BFS                                      |
| Cheapest path, negative weights                  | Bellman-Ford                                 |
| Cheapest path in a DAG                           | Topological order plus relaxation            |
| Which vertices are reachable                     | Depth-first search or breadth-first search   |

The two rows that matter most are the first and the sixth. They differ in one word, "edges" against "cost", and that word decides the entire algorithm.

## Reference implementations

<CodeViewer algorithm="graphs.bfs" />

The manifest publishes two variants. The `minimal` variant is a reusable function that takes an adjacency list and a source and returns the distance to every vertex, using $-1$ for the vertices the source cannot reach; it performs no input and output of its own. The `program` variant reads the graph from standard input and prints the distances. Both use the same queue discipline, so the two agree vertex for vertex.

## Recursion decision

A breadth-first search has no natural recursive form, and that is worth understanding rather than working around.

The recursive form that people try first is not breadth-first at all. A function that recurses into each neighbor of a vertex produces a depth-first traversal, whatever the container in front of it. The genuine recursive formulation processes one level per call:

```text
bfs(source):
    frontier = {source}
    distance[source] = 0
    expand(frontier, 0)

expand(frontier, k):
    next = empty
    for v in frontier:
        for w in neighbors(v):
            if w is undiscovered:
                distance[w] = k + 1
                next.add(w)
    if next is not empty:
        expand(next, k + 1)
```

The recursion depth of this form is the number of levels, that is, the distance from the source to the farthest vertex. For most graphs that is small: a random graph on $10^5$ vertices has a diameter of the order of $\log n$, so the depth is a few dozen frames. But a path graph has diameter $V - 1$, and a graph that is a long chain of dense blobs is just as bad. So the depth of this formulation is unbounded in exactly the same way the depth of a recursive depth-first search is.

The language limits are the same ones listed in the depth-first article, and they decide the answer.

| Language   | Default stack              | Practical depth         | Recommendation         |
| ---------- | -------------------------- | ----------------------- | ---------------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the explicit queue |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the explicit queue |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the explicit queue |
| Pascal     | The operating system stack | Depends on the platform | Use the explicit queue |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the explicit queue |

A second language-specific decision belongs here, and it is about the queue rather than about recursion. Use a real double-ended queue where the language has one: `collections.deque` in Python, `ArrayDeque` in Java, `std::queue` or `std::deque` in C++, and a list with a head index in JavaScript and Pascal. A list with `pop(0)` is not a queue, it is a queue with an accidental quadratic cost.

## Implementation walkthrough

The two lines that carry the algorithm are the marking and the update.

```cpp
if (distance[w] >= 0) {
    continue;             // already discovered, its distance is final
}
distance[w] = distance[v] + 1;
queue.push_back(w);
```

The check uses `>= 0` rather than `!= -1`, and the order matters: the test must come before the assignment, because the assignment is what makes the distance final.

The queue in the reference implementation is a vector with a head index rather than a container that removes from the front:

```cpp
std::vector<int> queue;
queue.reserve(adj.size());
size_t head = 0;
queue.push_back(source);
while (head < queue.size()) {
    const int v = queue[head++];
    ...
}
```

The head index only moves forward, so every operation on the queue is $O(1)$ amortized, and the buffer is allocated once with the right capacity. The vertices stay in the buffer after they are processed, which costs $O(V)$ memory, and that is the price of the constant-time dequeue.

The last line of the function is the one that makes the two variants agree: the distance of a vertex is the length of a shortest path, so it is written once, at discovery, and never revised.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using a stack instead of a queue | The traversal is depth-first and the distances are wrong | Use a first-in, first-out queue |
| Marking the vertex when it is dequeued | A vertex is enqueued once per incoming edge, and the queue can hold $O(E)$ entries | Mark at enqueue |
| Forgetting `distance[source] = 0` | The source is rediscovered through its own neighbors | Set the distance of the source before the loop |
| Using $-1$ as the distance of the source | The source looks unreachable, and every other distance is off by one | The source is at distance zero |
| Using `pop(0)` on a Python list | The search becomes $O(V^2)$ | Use `collections.deque` or a head index |
| Applying breadth-first search to a weighted graph | The number of edges is reported instead of the cost | Check the weights first |
| Forgetting to test whether the target is reachable | The answer for an unreachable target is the sentinel | Test the sentinel before printing |
| Storing the distance of a vertex in the queue | The distance is recorded twice and can disagree | Keep the distance in the array only |

### Why this fails: the weighted graph where the edge count is not the cost

The mistake that survives review most often is assuming that a breadth-first search computes a shortest path in a graph whose edges have weights.

Consider three vertices $s$, $u$ and $t$, and three edges: $s - u$ with weight $10$, $u - t$ with weight $10$, and $s - t$ with weight $100$. This is the smallest graph in which the two notions of shortest differ.

A breadth-first search from $s$ finds $t$ at distance $1$, because the edge $s - t$ exists and every edge counts as one. The true cheapest route is $s \to u \to t$, which uses two edges and costs $20$. The breadth-first search reports a route that is five times more expensive than the cheapest one, and it reports the length of the wrong route.

The failure is not a rounding error, and it does not need a large graph to appear. Any graph with a cheap long path and an expensive short path breaks it, and a road map with a motorway is exactly that graph.

The reason the search cannot see the problem is structural. It has no place to put a cost. The distance of a vertex is set to `distance[v] + 1` when the vertex is first discovered, and there is no rule that says "compare this with the cost of the other route and take the smaller". The information needed to make that comparison is thrown away at the moment of discovery, and it cannot be recovered later because the vertex is never examined again.

The fix is to change the container. When the edges carry costs, the next vertex to expand must be the one with the smallest accumulated cost, not the one that was discovered first. That is Dijkstra's algorithm, and the queue is replaced by a priority queue. The proof of correctness then needs the extra condition that all costs are non-negative, because that is what makes a settled distance final.

## Variants and extensions

- **Multi-source breadth-first search.** Put every source in the queue at distance zero before the loop starts. The search then finds the distance to the _nearest_ source for every vertex, which answers "which fire station is closest to this house".
- **Bidirectional breadth-first search.** Run one search from the source and one from the target, and meet in the middle. On a graph of exponential growth this cuts the explored region from a ball of radius $d$ to two balls of radius $d/2$.
- **Bipartite test.** Color the source with one color and give every neighbor the opposite color. A conflict means the graph is not bipartite. The same test with depth-first search uses the three states.
- **Breadth-first search on a state graph.** When the position alone does not determine the legal moves, as in a fuel or a key problem, the state is a pair or a tuple, and the graph is the state graph. The search is unchanged; only the vertex set grows.
- **Breadth-first search with a depth limit.** Stop expanding a vertex once its distance reaches the limit, which turns the search into a bounded flood fill.
- **0-1 BFS.** When every edge has cost zero or one, the queue is replaced by a deque: a cost-zero neighbor is pushed to the front and a cost-one neighbor to the back. The search stays linear, and the distances are still shortest paths.
- **The two BFS trick.** Two breadth-first searches, one from each end of a diameter, give the diameter of a tree and its center.
- **Grid flood fill.** A grid of cells is an implicit graph, and the search is unchanged apart from the neighbor function.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the cost model before writing the search: one per edge, several per edge, or zero and one. The cost model picks the algorithm.
2. Decide whether the graph is directed, and if it is, add the edge in the right direction only.
3. Mark at enqueue, and set the distance of the source to zero before the loop. Write both lines before the loop body.
4. Use a real queue. In Python and Java, a list with `pop(0)` is the mistake that turns a linear search into a quadratic one.
5. Handle the unreachable case explicitly, with a sentinel and a test.
6. If there are many queries and the graph does not change, run one search and answer from the distance array.

## Worked problems

### Problem 1: the shortest trip

**Restatement.** An undirected graph has $n$ towns and $m$ two-way roads. Each road takes one hour. Given a start town $s$ and a target town $t$, report the fewest hours the trip can take, or $-1$ if $t$ cannot be reached. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$.

**Naive baseline.** Repeatedly pick the unvisited town with the smallest tentative distance and relax its roads. This is correct, and the scan for the minimum costs $O(V)$ per step, so the search costs $O(V^2 + E)$.

**Insight.** Every road costs the same, so the fewest hours is the fewest roads, and the towns must be expanded in order of increasing number of roads from the start.

**Derivation.** Keep a distance array initialized to $-1$. Enqueue $s$ with distance zero. While the queue is not empty, dequeue a town $v$, and for each neighbor $w$ that is still undiscovered, set the distance of $w$ to the distance of $v$ plus one and enqueue $w$.

**Correctness.** The level lemma says the queue holds the towns of one level followed by the towns of the next, so a town is always expanded after every town at a smaller distance. A town discovered at level $k$ is therefore reached by a path of $k$ edges, and no path with fewer edges exists, because a shorter path would have discovered it at a smaller level. The distance is a shortest-path distance.

**Complexity.** $O(V + E)$ time and $O(V)$ auxiliary space beyond the adjacency list.

**Common wrong approach.** Recording the distance of a town when it is dequeued rather than when it is enqueued. A town reachable by two roads of different lengths is then enqueued twice, and the second visit can overwrite a shorter distance with a longer one.

### Problem 2: the nearest of several stations

**Restatement.** There are $k$ fire stations on a map of $n$ towns joined by $m$ roads, each road one hour long. For every town, report the number of hours to the nearest station. Constraints: $1 \le n \le 10^5$, $0 \le m \le 2 \cdot 10^5$, and $1 \le k \le n$.

**Naive baseline.** Run one search from each station, at a cost of $k(V + E)$, which is $2 \cdot 10^{10}$ at the maximum constraints.

**Insight.** The nearest station is the nearest of several sources, and a single search can start from all of them at once.

**Derivation.** Initialize every station with distance zero and enqueue all of them before the loop. Then run the ordinary search. The only change is in the initialization: the queue starts with $k$ vertices instead of one, and the level structure now measures the distance to the nearest station rather than to one particular station.

**Correctness.** The proof of the ordinary search carries over with $s$ replaced by the set of stations. The level of a town is its distance to the nearest station, because a level-one town is one road from some station, a level-two town is two roads from some station and not one road from any, and so on.

**Complexity.** $O(V + E)$ time, independent of $k$, and $O(V)$ auxiliary space.

**Common wrong approach.** Enqueuing the stations one at a time, so that the first station's search finishes before the second one starts. The result is correct for the first station and wrong for the rest, because the towns already discovered by the first search keep their larger distances.

### Problem 3: the knight on the board

**Restatement.** A knight stands on the bottom-left square of an $8$ by $8$ chessboard and wants to reach the top-right square. Each move is a knight move. Report the fewest moves, or $-1$ if the square cannot be reached. Constraints: the board has $64$ squares and $336$ legal knight moves.

**Naive baseline.** Try every sequence of moves by increasing length, which is a breadth-first search without a visited array. The number of sequences of length $k$ grows like $8^k$, so this enumerates $8^k$ sequences instead of $64$ squares.

**Insight.** The squares are the vertices of an implicit graph, and the moves are the edges. Once a square has been reached, reaching it again adds nothing, because the remaining distance from that square is the same whichever route led to it.

**Derivation.** Enumerate the legal knight moves once, as a list of eight coordinate offsets. Treat the square $(r, c)$ as the vertex $r \cdot 8 + c$, and its neighbors as the squares that the offsets reach and that lie inside the board. Then run the ordinary breadth-first search from the starting square and read the distance of the target square.

**Correctness.** The reachability and distance arguments of the ordinary search apply, because the implicit graph is exactly the graph of legal moves. A square's recorded distance is the smallest number of knight moves that reaches it, which is the number the problem asks for.

**Complexity.** $O(V + E) = O(64 + 336)$ time and $O(V)$ space, which is far below the limit.

**Common wrong approach.** Forgetting that the knight may leave the board and come back, and refusing to move off the board at all. The rule that matters is that a move that leaves the board is not a legal move, not that a square outside the board is forbidden.

## Practice progression

1. **Recognition.** Given a statement, decide whether breadth-first search applies. Check the cost model first: one per edge, or something else.
2. **Direct application.** Implement the search over an adjacency list, and then over a grid with four neighbors and over a grid with eight neighbors.
3. **Adaptation.** Implement the multi-source version, and the version that reports the shortest path itself rather than only its length, by remembering the predecessor of each vertex.
4. **Combination.** Combine breadth-first search with a disjoint set union: run the search layer by layer and merge a vertex with its neighbor only when the neighbor is in the next layer, which is how the layers of two overlapping searches are found.
5. **Challenge.** Solve a problem on a state graph, where a state is a pair such as (position, remaining fuel), and the number of states is far larger than the number of positions.
6. **Transfer.** Use breadth-first search as the engine of a different question: the two BFS trick for the diameter of a tree, the bipartite test, or the level structure of a bipartite matching search.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why must a vertex be marked when it is enqueued rather than when it is dequeued? (Key insight)
2. State the invariant of the queue and explain how it gives the level structure. (Algorithm derivation)
3. Why does the proof need the claim that a vertex of a smaller level is always expanded first? (Correctness proof)
4. Give the smallest weighted graph on which breadth-first search reports the wrong shortest path, and say what it reports. (Common mistakes)
5. Why is `pop(0)` on a Python list a problem, and what should be used instead? (Complexity analysis)
6. What is the recursion depth of the recursive level formulation, and when is it small? (Recursion decision)
7. How does the multi-source version differ from the ordinary one, and what does its distance measure? (Variants and extensions)
8. Which constraint value tells you the cost model is uniform, and which one tells you the edges have costs of zero and one? (Recognition patterns)
9. Why is the target reached in the fewest hours the same question as the fewest roads, and what breaks when it is not? (Problem motivation)
10. What does the queue hold at any moment during the search? (Formal model)

## Further reading

- The stack-based sibling of this traversal, and the contrast between the two containers, is in [depth-first search](/algorithms/graphs/dfs).
- The weighted version of the same search is [Dijkstra's algorithm](/algorithms/graphs/dijkstra), and the version for costs of zero and one is [0-1 BFS](/algorithms/graphs/0-1-bfs).
- The graph representation that the search assumes is described in [graph representation](/algorithms/graphs/representation).
- Why a queue is a queue, and why `pop(0)` is not one, is covered in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
- The level structure of a breadth-first search is the same structure that a [segment tree](/algorithms/range-queries/segment-tree) is built on, and the two make a natural pair. (Compare [binary search](/algorithms/searching/binary-search) for the other monotone structure.)
- Every listing in this article, in all six languages, is collected on the [breadth-first search source page](/implementations/graphs-bfs).
