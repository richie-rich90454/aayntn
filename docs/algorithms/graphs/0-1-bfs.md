---
id: graphs.0-1-bfs
title: 0-1 BFS
summary: Shortest paths in a graph whose edge weights are only zero or one.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [0-1 BFS, binary weights, shortest path, deque]
prerequisites:
    required: [graphs.bfs, graphs.representation]
    recommended: [graphs.dijkstra]
assumptions:
    - Every edge weight is zero or one.
reviewed: false
---

## Problem motivation

A cow stands in one field of a large pasture and wants to reach a set of other fields. Every field is one minute's walk from each of its neighbors, so walking an edge costs one minute. But some pairs of fields are joined by teleporters, and a teleportation is instantaneous, so it costs zero minutes.

The question is: what is the minimum number of minutes to reach each field?

The constraints are what make this interesting.

- The pasture is an $R$ by $C$ grid with $1 \le R, C \le 1\,000$, so at most $10^6$ fields.
- There are at most $100$ teleporters, each joining two fields.
- The cow may also be teleported _to_ any field from a teleporter, but not from an arbitrary field.

The pasture is a graph with $10^6$ vertices and about $4 \cdot 10^6$ edges. The weights are zero on the teleportation edges and one on the walking edges, so this is a shortest-path problem with binary weights, and the whole family of answers is open: not every edge costs the same, so a breadth-first search is wrong, but the weights never leave the set $\{0, 1\}$, so the general [Dijkstra's algorithm](/algorithms/graphs/dijkstra) pays for a priority queue it does not need.

A queue-based search that costs $O(V + E)$ would be ideal. This article is about how to get one.

## Recognition patterns

0-1 BFS is the right tool when all of the following hold.

- The problem asks for a **cheapest** path, and every edge weight is **zero or one**.
- Some moves are **free** and others cost a fixed amount: portals, teleporters, teleportation devices, a free coupon, a flip that costs nothing.
- The graph is large enough that the logarithmic factor of a priority queue is the difference between passing and timing out.
- The answer is needed for **every** vertex, or the target is far enough from the source that a targeted search is not cheaper.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Every weight is $0$ or $1$ | Rules in 0-1 BFS, the linear form |
| Every weight is $1$ | Rules in [breadth-first search](/algorithms/graphs/bfs) |
| Weights are nonnegative but larger | Rules out 0-1 BFS; use [Dijkstra](/algorithms/graphs/dijkstra) |
| Some weight is negative | Rules out both; use [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| $V, E \ge 10^6$ | Rules out $O(VE)$; rules in a linear algorithm |
| At most $10^3$ vertices, weights arbitrary | Rules in Dijkstra; the heap factor does not matter |

Two phrases in a statement are reliable signals. "Free" and "instant" point at a zero weight. "Costs a minute" or "costs one unit" point at a weight of one. A problem that says "you may move freely between these $k$ rooms, and otherwise every move costs one" is describing a 0-1 BFS without saying so.

<Synonyms terms="0-1 bfs, binary weight shortest path, zero-one bfs, deque shortest path" />

## Naive approach

The first baseline is a breadth-first search, and it is wrong here. The BFS counts the number of edges on a path, so it reports the number of moves rather than the number of minutes. A path that uses one teleportation and five walks costs six minutes but has six edges, while a path of seven walks costs seven minutes and also has seven edges: the search cannot tell them apart.

The second baseline is Dijkstra's algorithm with a binary min-heap. It is correct, and it runs in $O((V + E) \log V)$. On the pasture of a million fields and four million edges, the heap holds a few million entries and every push and pop costs about $22$ comparisons, so the search does roughly $10^8$ comparisons where $10^7$ would do.

The third baseline is Bellman-Ford, at $O(VE) = 4 \cdot 10^{12}$ edge examinations. It also handles weights that 0-1 BFS cannot, so it is not wrong, only slow.

The gap to close is a container that hands back the smallest tentative distance in $O(1)$ time, when only two distances can ever be at the front.

## Key insight

The insight is that with two weights, the priority queue can be replaced by a deque.

A binary min-heap answers the question "which vertex has the smallest tentative distance?" in $O(\log V)$. A 0-1 BFS answers it in $O(1)$, by keeping the pending vertices in a double-ended queue with a rule about which end to use:

- a relaxation through an edge of weight **zero** produces a candidate equal to the distance of the vertex being expanded, so the new entry goes to the **front** of the deque;
- a relaxation through an edge of weight **one** produces a candidate one larger, so the new entry goes to the **back**.

Why does that keep the deque sorted? Because the candidates produced by expanding a vertex at distance $d$ are only ever $d$ or $d + 1$. The deque starts with the single entry $(0, s)$. If the deque holds only entries with keys $d$ and $d + 1$, with the $d$'s in front, then popping the front removes a $d$, and the new candidates are $d$ or $d + 1$, which is exactly where the rule puts them. The range of keys in the deque never grows beyond two consecutive values, so the front is always the minimum.

That is the whole insight: **a deque with a two-ended push rule is a priority queue whose keys can take only two consecutive values**, and for such keys it is exact rather than approximate.

## Formal model

Let $G = (V, E)$ be a graph with a weight function $w : E \to \{0, 1\}$, and let $s \in V$ be the source.

<MathPanel type="definition" title="Definition">
The **distance** $\delta(v)$ of a vertex $v$ from $s$ is the length of a
shortest path from $s$ to $v$, where the length of a path is the sum of its
edge weights. It is written $\infty$ when no path exists.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **deque invariant** of a 0-1 BFS is the statement that at every moment
there is a value $d$ such that every entry in the deque has a key in
$\{d, d + 1\}$, and every entry with key $d$ comes before every entry with
key $d + 1$. The value $d$ is the key of the front entry, or the key of the
last entry removed from the front.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $d$ be the value in the deque invariant. Every candidate produced while
the front entry has key $d$ is either $d$ or $d + 1$, and neither is
smaller than $d$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Under the deque invariant, the front entry of the deque always has the
smallest key in the deque.
</MathPanel>

The lemma that ties it to the general case is the obvious one: if the front entry always has the smallest key, then the search settles vertices in non-decreasing distance order, which is exactly the condition that [Dijkstra's algorithm](/algorithms/graphs/dijkstra) needs.

## Algorithm derivation

The state is a distance array `distance` of $V$ entries and a deque of pairs $(d, v)$.

The update rule, when a vertex $v$ with distance $d$ is taken from the front of the deque and an edge $(v, w)$ of weight $c$ is relaxed:

1. If $d + c < \text{distance}[w]$, set $\text{distance}[w] \gets d + c$ and push the pair $(d + c, w)$ onto the **front** of the deque when $c = 0$, and onto the **back** when $c = 1$.
2. Otherwise the edge changes nothing.

The rule is correct because of the deque invariant. A candidate is never smaller than the key of the entry being expanded, since $c \ge 0$; and the candidate is at most one larger than it, since $c \le 1$. The deque therefore keeps its two-level structure, and the front is always the minimum.

Two details complete the derivation.

The first is the stale check. Just as in Dijkstra's algorithm, a vertex may be reached twice, and the older entry is discarded when it surfaces:

```text
d, v = deque.pop_front()
if d != distance[v]:
    continue          # a shorter route was found later; this entry is stale
```

The second is that a zero-weight edge is not free to ignore. A path of $10^6$ zero-weight edges is a legitimate shortest path, and the search must follow it.

<MathPanel type="invariant" title="Invariant">
At every moment of the search, the deque holds the deque invariant, every
vertex in the deque has a tentative distance equal to the key it was pushed
with, and the tentative distance of every vertex is the length of an actual
path from the source.
</MathPanel>

## Step-by-step execution

Take the directed graph on vertices $s, a, b, c, t$ with the edges $s \to a$ of weight $0$, $s \to b$ of weight $1$, $a \to b$ of weight $0$, $a \to c$ of weight $0$, $b \to c$ of weight $1$ and $c \to t$ of weight $1$.

1. Set $d(s) = 0$ and push $(0, s)$ onto the deque. The deque is $[(0, s)]$.
2. Pop the front $(0, s)$. It matches $d(s)$, so $s$ is settled. Relax $s \to a$: the candidate is $0 + 0 = 0$, so $d(a) = 0$ and $(0, a)$ goes to the **front**. Relax $s \to b$: the candidate is $0 + 1 = 1$, so $d(b) = 1$ and $(1, b)$ goes to the **back**. The deque is $[(0, a), (1, b)]$.
3. Pop the front $(0, a)$. It matches $d(a)$, so $a$ is settled. Relax $a \to b$: the candidate is $0 + 0 = 0$, which is smaller than $d(b) = 1$, so $d(b) = 0$ and $(0, b)$ goes to the **front**. Relax $a \to c$: the candidate is $0 + 0 = 0$, so $d(c) = 0$ and $(0, c)$ goes to the **front**. The deque is $[(0, c), (0, b), (1, b)]$.
4. Pop the front $(0, c)$. It matches $d(c)$, so $c$ is settled. Relax $c \to t$: the candidate is $0 + 1 = 1$, so $d(t) = 1$ and $(1, t)$ goes to the **back**. The deque is $[(0, b), (1, b), (1, t)]$.
5. Pop the front $(0, b)$. It matches $d(b)$, so $b$ is settled. Relax $b \to c$: the candidate is $0 + 1 = 1$, which is not smaller than $d(c) = 0$, so the edge changes nothing. The deque is $[(1, b), (1, t)]$.
6. Pop the front $(1, b)$. The current value of $d(b)$ is $0$, not $1$, so this entry is **stale** and is discarded. The deque is $[(1, t)]$.
7. Pop the front $(1, t)$. It matches $d(t)$, so $t$ is settled. The deque is empty and the search ends.

The final distances are $0$, $0$, $0$, $0$ and $1$ for $s$, $a$, $b$, $c$ and $t$. The route to $t$ is $s \to a \to c \to t$, which costs $0 + 0 + 1 = 1$.

Step 3 is the heart of the algorithm. Vertex $b$ was first reached from $s$ at distance $1$, and it was improved to $0$ through the zero-weight edge $a \to b$. The improvement pushed a _new_ entry to the front, and the old entry at distance $1$ survived in the deque until step 6, where it was discarded. In a breadth-first search the same graph could not even be represented, because the search has no way to express an edge that costs nothing.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
When the search terminates, the recorded distance of every vertex reachable
from the source is the length of a shortest path from the source to it, and
the distance of every unreachable vertex is unchanged.
</MathPanel>

<MathPanel type="proof" title="Proof">
We first prove the deque invariant by induction on the number of removals
from the front.

Initially the deque holds the single entry $(0, s)$, so the invariant holds with $d = 0$.

Suppose the invariant holds with the value $d$, and the front entry is removed. By the lemma, its key is $d$, and the remaining entries have keys in $\{d, d + 1\}$ with the $d$'s in front, so the invariant still holds for the remaining deque. Every candidate produced by relaxing an edge out of the expanded vertex is either $d$ or $d + 1$, since the weights are zero and one. A candidate equal to $d$ is pushed to the front, which places it before every entry with key $d + 1$, and a candidate equal to $d + 1$ is pushed to the back, which places it after every entry with key $d$. So the invariant is preserved in both cases. When the deque becomes empty of entries with key $d$, the value of $d$ advances by one and the invariant holds again with the new value. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The search settles vertices in non-decreasing order of their recorded
distance, and every settled vertex has its true distance.
</MathPanel>

<MathPanel type="proof" title="Proof">
By the deque invariant, the front entry always has the smallest key in the
deque, so the search always takes the vertex with the smallest tentative
distance, exactly as [Dijkstra's algorithm](/algorithms/graphs/dijkstra)
does. The two searches differ only in the container: the heap of the one is
the deque of the other, and every candidate that the heap would order by key
the deque also orders by key, because the deque invariant guarantees that
the front is the minimum. The greedy step of Dijkstra's algorithm is
therefore valid here, and its exchange argument shows that a settled vertex
has its true distance. The vertices that are never settled are never given a
finite distance, which is correct for the unreachable ones. $\square$
</MathPanel>

The last proof is deliberately short, and that is the point of the algorithm: 0-1 BFS is not a new shortest-path algorithm, it is Dijkstra's algorithm with a container that happens to be exact for two-valued keys.

## Complexity analysis

**Time: $O(V + E)$.** Every vertex is settled at most once, and settling a vertex examines each of its incident edges once, so there are at most $E$ relaxations. Every operation on a deque is $O(1)$ at both ends, and every relaxation pushes at most one entry, so the total work is $O(V + E)$.

**Auxiliary space: $O(V + E)$.** The distance array holds $V$ entries, and the deque holds at most one entry per successful relaxation, which is at most $E$ entries. The adjacency list that the search is given holds $O(V + E)$ entries, and that is the largest object in the program.

<MathPanel type="complexity" title="Complexity">
0-1 BFS over an adjacency list: time $O(V + E)$, auxiliary structures
$O(V + E)$ for the distance array and the deque, for a total of $O(V + E)$
including the adjacency list. Dijkstra's algorithm on the same graph costs
$O((V + E) \log V)$.
</MathPanel>

Two practical warnings belong here. First, a deque is not a list: in Python `list.pop(0)` is $O(n)$ because every remaining element is shifted, so use `collections.deque`. The same trap exists in Java with `ArrayList.remove(0)` and in JavaScript with `Array.prototype.shift`. Second, the push side matters. Pushing to the front of a list with `insert(0, x)` is also $O(n)$, so the container must be a real double-ended queue in every language.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Cheapest path, every weight is zero or one | 0-1 BFS |
| Fewest edges from one source | [Breadth-first search](/algorithms/graphs/bfs) |
| Cheapest path, weights nonnegative and arbitrary | [Dijkstra](/algorithms/graphs/dijkstra) |
| Cheapest path, weights may be negative | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Cheapest path in a directed acyclic graph | A [topological order](/algorithms/graphs/topological-sort), then relaxation |
| Cheap path between many pairs of vertices | Floyd-Warshall |
| Which vertices are reachable | [Depth-first search](/algorithms/graphs/dfs) or breadth-first search |
| A minimum spanning tree | Kruskal with a [disjoint set union](/algorithms/graphs/dsu), or Prim |

The boundary between 0-1 BFS and Dijkstra is the one worth memorizing. If every weight is zero or one, the deque is exact and the search is linear. If some weight is two or more, the deque invariant breaks: expanding a vertex at distance $d$ can now produce a candidate at distance $d + 2$, and the back of the deque may already hold an entry at distance $d + 1$ which is smaller. The deque is no longer sorted, and the answer becomes wrong.

## Recursion decision

0-1 BFS is iterative. There is no natural recursive form of it, for the same reason there is no natural recursive form of a breadth-first search: the container is the algorithm.

The recursive shape that does exist processes one distance level per call, using a set for the current level and a set for the next. Its recursion depth is the number of distinct distances, which is at most $V$ and is usually much smaller. The language limits are the usual ones.

| Language   | Default stack              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the deque  |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the deque  |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the deque  |
| Pascal     | The operating system stack | Depends on the platform | Use the deque  |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the deque  |

In every language, use the deque. The level-recursion form is useful for understanding the algorithm and for nothing else.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using a queue instead of a deque | The zero-weight edges are processed too late and the distances are wrong | Push weight-zero edges to the front |
| Pushing a weight-one edge to the front | The deque is no longer sorted and the minimum is not at the front | Weight one goes to the back |
| Forgetting the stale check | A vertex is expanded twice | Test `d != distance[v]` on removal |
| Forgetting to mark the source | The source is rediscovered through its own neighbors | Set `distance[s] = 0` before the loop |
| Assuming the weights are the numbers zero and one only after subtracting | The comparison between paths of different lengths is broken | Check the actual weight range |
| Using `list.pop(0)` | The search becomes $O(V^2)$ | Use a real deque |
| Treating a zero-weight edge as "no edge" | A whole region of the graph is unreachable | Zero-weight edges are still edges |
| Using $-1$ for "unreachable" without a guard | The relaxation is refused and the vertex is never discovered | Guard with `distance[w] >= 0` |
| Applying 0-1 BFS to weights in $\{1, 2\}$ | The answer is the number of edges of the cheaper path, not its cost | Use Dijkstra |

### Why this fails: the queue that loses the free edge

The mistake that survives review most often is porting the breadth-first search unchanged and forgetting that the front and the back of the container now mean different things.

Consider four vertices $s$, $a$, $b$ and $t$ with these edges:

| Edge      | Weight |
| --------- | ------ |
| $s \to a$ | $1$    |
| $s \to b$ | $0$    |
| $b \to a$ | $0$    |
| $a \to t$ | $0$    |

The true distances are $\delta(b) = 0$, $\delta(a) = 0$ and $\delta(t) = 0$, reached along the route $s \to b \to a \to t$, which costs nothing at all.

Now run the search with a plain first-in, first-out queue, marking a vertex when it is enqueued, which is exactly the breadth-first search with the weights added.

1. $d(s) = 0$. Pop $s$ and relax its edges. The candidate for $a$ is $0 + 1 = 1$, so $d(a) = 1$ and $a$ is enqueued. The candidate for $b$ is $0 + 0 = 0$, so $d(b) = 0$ and $b$ is enqueued. The queue is $[a, b]$.
2. Pop $a$, which is at the front with distance $1$. It is expanded, and the candidate for $t$ is $1 + 0 = 1$, so $d(t) = 1$ and $t$ is enqueued. The queue is $[b, t]$.
3. Pop $b$, which is at distance $0$. It is expanded, and the candidate for $a$ is $0 + 0 = 0$, which is smaller than $d(a) = 1$. But $a$ was already enqueued and marked, so the relaxation is refused and $d(a)$ stays $1$.
4. Pop $t$ with $d(t) = 1$. The search ends.

The search reports $d(t) = 1$. The true answer is $0$. The route $s \to b \to a \to t$ costs nothing, and the queue-based search cannot see it, because $a$ was expanded at distance $1$ before $b$ was expanded at distance $0$.

The same graph with a deque gives the right answer. The deque starts as $[(0, s)]$. Popping $s$ produces the candidate $1$ for $a$, which goes to the back, and the candidate $0$ for $b$, which goes to the front, so the deque is $[(0, b), (1, a)]$. Popping $b$ produces the candidate $0$ for $a$, which goes to the front, so the deque is $[(0, a), (1, a)]$. Popping $a$ at distance $0$ produces the candidate $0$ for $t$, which goes to the front, and the answer is $0$.

The lesson generalizes: **the container must hand back the smallest tentative distance, and only a two-ended container with the two-ended push rule does that.**

## Variants and extensions

- **Multi-source 0-1 BFS.** Push every source at distance zero before the loop. The result is the distance to the nearest source, which answers "which fire station is closest to this house" when some stations are reached by a free tunnel.
- **The state graph.** When the state includes something besides the position, as in "one coupon may be used for free", the vertices are the states and the weights are still zero and one.
- **Weights from a small set.** With weights in $\{0, 1, \ldots, k\}$ the same idea gives a bucket queue of $k + 1$ buckets, and the running time is $O(kV + E)$. This is Dial's algorithm.
- **Path reconstruction.** Record the predecessor of each vertex when it is relaxed, exactly as in Dijkstra's algorithm, and walk back up the predecessors at the end.
- **Counting the routes.** If the question is how many shortest routes there are, the same relaxation structure counts them: add the count of $v$ to the count of $w$ whenever a relaxation succeeds.
- **Unreachable vertices.** The sentinel must be distinguishable from a real distance, exactly as in the other shortest-path articles.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the weight range before writing code. Zero or one means 0-1 BFS; one means breadth-first search; nonnegative means Dijkstra; anything else means Bellman-Ford.
2. Check the range of the weights literally, by looking at the input format. A range written as "from 1 to $10^9$" is not a binary range, and a range written as "0 or 1" is.
3. Use a real double-ended queue, and remember which end each weight goes to: zero to the front, one to the back.
4. Keep the stale check, and set the distance of the source to zero before the loop.
5. Watch the sentinel. A distance of $-1$ for "unreachable" needs a guard in the relaxation, because a candidate of $0$ would look like an improvement on $-1$.
6. If the weights are not binary, do not rescale them by subtracting the minimum. Subtracting a constant per edge discounts the long paths, so it changes which path is shortest, and the answer it produces is wrong.

## Worked problems

### Problem 1: the pasture with teleporters

**Restatement.** An $R$ by $C$ grid of fields, with $R, C \le 1\,000$. The cow starts at the top-left field and can walk to a side-adjacent field in one minute. There are at most $100$ teleporters, each joining two fields, and using one costs no time. Report the minimum number of minutes to reach every field, and $-1$ for the fields that cannot be reached.

**Naive baseline.** A breadth-first search over the grid, counting steps. It reports the number of moves, and it reports a number of minutes that is too large whenever a teleportation is used.

**Insight.** Walking costs one and teleporting costs zero, so the graph has binary weights and the cheapest path is not the path with the fewest edges.

**Derivation.** Treat each field as a vertex of an implicit graph whose edges are the four side-adjacent moves, of weight one, and the teleportation edges, of weight zero. Run 0-1 BFS over it: the neighbor function returns the four adjacent fields with weight one, and the teleportation pairs with weight zero.

**Correctness.** The implicit graph contains exactly the legal moves with exactly their costs, so the shortest-path distance of a field is the minimum number of minutes to reach it. The theorem above shows that the search computes those distances.

**Complexity.** There are $RC \le 10^6$ vertices and $4RC + 200$ edges, so the search costs $O(RC)$ time and $O(RC)$ space, with no explicit adjacency list. A priority-queue version of the same search costs $O(RC \log(RC))$.

**Common wrong approach.** Forgetting that the teleportation is usable from the field on one end only when the cow is standing on it, and adding the teleportation as a symmetric edge from every field.

### Problem 2: the coupon

**Restatement.** A graph has $n$ towns and $m$ roads. Every road has a positive length. The traveler has one coupon that makes a single road free. Report the minimum total length of a route from the start town to the goal town, with and without the coupon, or the smaller of the two.

**Naive baseline.** Run Dijkstra once without the coupon. The answer is then not the minimum over all routes, because the cheapest route without the coupon may not be the cheapest route with it.

**Insight.** The state of the traveler is not just the town: it is the town together with the state of the coupon. The two states are "coupon unused" and "coupon used", so the graph has $2n$ vertices, and every edge still has weight zero or one once the coupon is accounted for.

**Derivation.** Build the state graph on $2n$ vertices: the vertex $(v, 0)$ means "at town $v$ with the coupon unused" and $(v, 1)$ means "at town $v$ with the coupon used". A road of length $c$ from $u$ to $v$ becomes the edge $((u, 0), (v, 1))$ of weight zero, which is the use of the coupon on that road, and the edge $((u, 0), (v, 0))$ of weight $c$, and the edge $((u, 1), (v, 1))$ of weight $c$. Run 0-1 BFS from $(s, 0)$ and read the distance of $(t, 0)$ and of $(t, 1)$.

**Correctness.** Every route in the original graph corresponds to a path in the state graph of the same total length, and every path in the state graph corresponds to a route in the original graph with the coupon used on at most one road. The minimum over the two target states is therefore the answer.

**Complexity.** The state graph has $2n$ vertices and $3m$ edges, so the search costs $O(n + m)$ time and $O(n + m)$ space.

**Common wrong approach.** Trying to handle the coupon inside the search without enlarging the vertex set, by keeping a single distance per town. The distance to a town with the coupon unused and the distance to the same town with the coupon used are different numbers, and one array cannot hold both.

### Problem 3: the rescaling that is not allowed

**Restatement.** A graph has $n$ towns and $m$ roads, and every road has a length of either one or two. Report the length of the shortest route from the start to the goal. The weights are _not_ zero or one.

**Naive baseline.** Subtract one from every weight to get weights in $\{0, 1\}$, run 0-1 BFS, and add one back per edge of the chosen route. This is wrong, and it is a common and plausible attempt.

**Insight.** Subtracting a constant from every edge changes the length of a path by that constant times the _number of edges_ in the path, so it reorders paths that use different numbers of edges. A long chain of cheap edges gets one unit of discount per edge and can end up looking cheaper than a single expensive edge, even when the true costs say the opposite.

**Derivation.** Use Dijkstra's algorithm with a priority queue, which costs $O((V + E) \log V)$.

**Correctness.** Dijkstra's greedy step needs only that the weights be nonnegative, and weights of one and two are nonnegative, so the theorem applies unchanged.

**Complexity.** $O((V + E) \log V)$ time and $O(V + E)$ space.

**Common wrong approach.** The rescaling above. Consider the four vertices $s$, $a$, $b$ and $t$ with the edges $s \to t$ of length $2$, and $s \to a$, $a \to b$ and $b \to t$ each of length $1$. The cheapest route is the single edge $s \to t$, of length $2$, while the three-edge route costs $3$. After subtracting one from every weight, the edges have lengths $1$, $0$, $0$ and $0$, and the rescaled search prefers the three-edge route, whose rescaled length is $0$, over the direct edge, whose rescaled length is $1$. Adding one back per edge to the three-edge route reports $3$, which is not the cheapest route. The routes have different edge counts, which is exactly the situation the subtraction destroys.

## Practice progression

1. **Recognition.** Given a statement, decide whether 0-1 BFS applies. Look for free moves, portals, coupons, flips that cost nothing, and for a weight range written literally as zero or one.
2. **Direct application.** Implement the search over an adjacency list and over a grid with four neighbors, and check it against Dijkstra on random binary-weight graphs.
3. **Adaptation.** Implement the multi-source version, the version that records predecessors to reconstruct the route, and the version that counts the number of shortest routes.
4. **Combination.** Build a state graph whose states include the coupon or the switch positions, so that the weights stay binary, and solve the problem with one linear search.
5. **Challenge.** Solve a problem on a graph with $10^6$ vertices and $4 \cdot 10^6$ edges where a priority-queue version exceeds the time limit and the deque version does not.
6. **Transfer.** Use the same container discipline for a different question: the level structure of a breadth-first search, Dial's algorithm for weights in $\{0, \ldots, k\}$, or a shortest-path search in a graph whose edges are added online.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does every edge weight have to be for this algorithm to be correct? (Recognition patterns)
2. Which end of the deque does a weight-zero edge go to, and which end does a weight-one edge go to? (Algorithm derivation)
3. State the deque invariant in your own words. (Formal model)
4. Why is the deque always handing back the smallest tentative distance? (Correctness proof)
5. Why is a plain breadth-first search wrong on this class of graphs? Give the smallest example you can. (Common mistakes)
6. What is the running time, and how does it compare with Dijkstra's algorithm on the same graph? (Complexity analysis)
7. Why is subtracting a constant from every weight not a way of using this algorithm on weights of one and two? (Worked problems)
8. What happens to the deque invariant when a weight of two appears? (Algorithm selection)
9. How would you solve the coupon problem, and how many vertices does the state graph have? (Worked problems)
10. Why is the recursion depth of the level-recursion form not the number of vertices? (Recursion decision)

## Further reading

- The general weighted version of this search, with the heap and the greedy step, is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The queue-based search that this one generalizes is [breadth-first search](/algorithms/graphs/bfs).
- The version that accepts negative weights is [Bellman-Ford](/algorithms/graphs/bellman-ford).
- The traversal that shares the shape but not the purpose is [depth-first search](/algorithms/graphs/dfs).
- The monotonic search that finds a boundary rather than a distance is [binary search](/algorithms/searching/binary-search).
- Every listing of the search in this article is collected with the other shortest-path implementations on the [Dijkstra source page](/implementations/graphs-dijkstra).
