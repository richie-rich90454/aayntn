---
id: graphs.bellman-ford
title: Bellman-Ford
summary: Shortest paths in a graph whose edge weights may be negative, with detection of the negative cycles that make a shortest path unbounded.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [bellman-ford, negative weights, negative cycle, shortest path, relaxation]
prerequisites:
    required: [graphs.representation]
    recommended: [graphs.dijkstra, graphs.bfs]
complexity:
    time: "O(VE)"
    space: "O(V)"
assumptions:
    - Edge weights may be negative.
    - The graph has no negative cycle reachable from the source, unless detecting one is the goal.
reviewed: false
---

## Problem motivation

A freight company runs trucks between depots. Every lane has a cost, and the cost is the fuel the truck burns on that lane. On a few lanes the company receives a fuel rebate, so the cost of those lanes is negative.

The company wants to know, for every depot, the cheapest total fuel cost of a route that starts at the main depot and ends there.

The constraints:

- $1 \le n \le 1\,000$ depots.
- $0 \le m \le 10\,000$ lanes.
- Every lane cost is an integer with $-10^9 \le c \le 10^9$.

There is a second question hiding inside the first, and it is the more interesting one. If some loop of lanes has a total cost below zero, then a truck can drive around that loop as many times as it likes and finish with a smaller cost every time. The cheapest cost to some depot is then not a number at all: it is unbounded below, and the algorithm that answers the question has to say so rather than print a value.

Both halves of this problem need an algorithm that the nonnegative assumption of [Dijkstra's algorithm](/algorithms/graphs/dijkstra) forbids. This is that algorithm.

## Recognition patterns

Bellman-Ford is the right tool when all of the following hold.

- The edge weights may be **negative**: a rebate, a credit, a refund, a penalty paid to the traveler rather than by the traveler.
- The question is a **shortest path** or a **cheapest route**, so the answer is a sum of weights rather than a number of edges.
- The graph is **small enough** that $O(VE)$ is acceptable, which in practice means $n$ in the thousands and $m$ in the tens of thousands.
- The problem may ask whether a **negative cycle** exists, which is a question no nonnegative-weight algorithm can answer at all.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Some weight is negative | Rules in Bellman-Ford for shortest paths |
| All weights are nonnegative | Rules out Bellman-Ford as needed; use [Dijkstra](/algorithms/graphs/dijkstra) |
| All weights are zero or one | Rules in [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| $n \le 10^3$, $m \le 10^4$ | $10^7$ edge examinations, comfortably inside the limit |
| $n \ge 10^5$, $m \ge 10^6$ | $10^{11}$ edge examinations; Bellman-Ford is too slow |
| The graph is a directed acyclic graph | Rules in a [topological order](/algorithms/graphs/topological-sort) instead, which is linear |
| The problem asks for arbitrage | Rules in the negative-cycle test |

Two phrases in a statement are reliable signals. "Loss", "rebate", "credit", "profit" and "gain" often mean a negative cost. "Arbitrage", "profit cycle" and "can this be exploited" mean a negative cycle. A statement that says "the exchange rate may be less than one" is describing a multiplicative version of the same problem.

<Synonyms terms="bellman-ford, bellman ford, negative weight shortest path, negative cycle detection" />

## Naive approach

The first baseline is Dijkstra's algorithm, and it is wrong. The counterexample is worked out in full in the [common mistakes](#common-mistakes) section: on a four-vertex graph with a single negative edge, Dijkstra reports a cost of $2$ when the true cost is $-1$.

The second baseline is a single pass of relaxation over every edge. It computes the answer for paths that use at most one edge, which is not the question being asked, and it is wrong on the four-vertex graph above: after one pass in the order $(s,a)$, $(s,b)$, $(b,a)$, $(a,t)$ it happens to be right, but in the order $(s,b)$, $(a,t)$, $(b,a)$, $(s,a)$ it reports $2$ for $a$ and $3$ for $t$, both wrong.

The third baseline is a depth-first search with a distance array, which is the depth-first search of the [depth-first search](/algorithms/graphs/dfs) article and reports the length of a tree-like path rather than the cheapest path.

## Key insight

The insight is that a shortest path never needs to visit the same vertex twice.

A path that repeats a vertex contains a cycle. If no cycle of negative total weight is reachable, then every cycle in the graph has nonnegative total weight, and deleting such a cycle from a path cannot make the path longer. So the cheapest route is always a _simple_ path, and a simple path on $n$ vertices uses at most $n - 1$ edges.

That single observation turns the problem into a bounded one. If the shortest path uses at most $n - 1$ edges, then it is enough to relax every edge of the graph $n - 1$ times: after the $k$-th pass, the recorded distances are exactly the lengths of the cheapest paths that use at most $k$ edges.

And the same observation detects the negative cycle. If some edge can still be relaxed on the $n$-th pass, then some path using $n$ edges is cheaper than the cheapest path using $n - 1$ edges. A path with $n$ edges on $n$ vertices must repeat a vertex, and the repeated part is a cycle whose total weight must be negative. So the extra pass is not a formality: it is the test.

## Formal model

Let $G = (V, E)$ be a directed graph with a weight function $w : E \to \mathbb{R}$, and let $s \in V$ be the source.

<MathPanel type="definition" title="Definition">
A **walk** from $s$ to $v$ is a sequence of edges
$(s = v_0, v_1), \ldots, (v_{k-1}, v_k = v)$ that exist in $G$. Its
**length** is $\sum_{i=0}^{k-1} w(v_i, v_{i+1})$. A **path** is a walk with
no repeated vertex, and a **cycle** is a closed walk with no repeated vertex
apart from its ends.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **distance** $\delta(v)$ is the smallest length of any walk from $s$ to
$v$. It is written $\infty$ when no walk exists. It is well defined as a
finite number exactly when no negative cycle is reachable from $s$.
</MathPanel>

<MathPanel type="definition" title="Definition">
A cycle $C$ is **negative** if the sum of its edge weights is negative. A
negative cycle is **reachable** from $s$ if a walk from $s$ reaches some
vertex of $C$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If no negative cycle is reachable from $s$, then for every vertex $v$ there
is a path from $s$ to $v$ whose length is $\delta(v)$, and that path uses at
most $|V| - 1$ edges.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
A negative cycle is reachable from $s$ if and only if the relaxation of some
edge still succeeds after $|V| - 1$ passes.
</MathPanel>

## Algorithm derivation

The state is a distance array `distance` of $V$ entries, initialized to infinity except for the source, whose distance is zero.

The update rule is the relaxation of a single edge $(u, v)$ of weight $c$: if `distance[u] + c` is smaller than `distance[v]`, then set `distance[v] = distance[u] + c`.

The algorithm applies the update to every edge of the graph, in any order, and repeats. One full sweep over all edges is a **pass**.

The derivation of the number of passes follows the lemma about simple paths. A cheapest path uses at most $|V| - 1$ edges, and after $k$ passes the distances account for every path that uses at most $k$ edges. So $|V| - 1$ passes are enough to produce the correct distances, and one more pass is enough to detect a negative cycle.

The order of the edges within a pass does not affect the final answer. It affects how quickly the answer appears: a pass that happens to relax a long path in the right order can produce the final distances in a single sweep. This is worth knowing, because a contest solution that stops at the first pass with no change is correct, and one that does not stop is also correct but slower.

<MathPanel type="invariant" title="Invariant">
After $k$ passes, `distance[v]` is the length of the shortest walk from $s$ to
$v$ that uses at most $k$ edges, or $\infty$ if there is no such walk.
</MathPanel>

## Step-by-step execution

Take the directed graph on vertices $s$, $a$, $b$ and $t$ with the edges $s \to a$ of weight $1$, $s \to b$ of weight $4$, $b \to a$ of weight $-6$ and $a \to t$ of weight $1$. Read the edges in the order $(s, a)$, $(s, b)$, $(b, a)$, $(a, t)$.

1. Initialize $d(s) = 0$ and $d(a) = d(b) = d(t) = \infty$.
2. **Pass 1.** Relax $(s, a)$: the candidate is $0 + 1 = 1$, so $d(a) = 1$. Relax $(s, b)$: the candidate is $0 + 4 = 4$, so $d(b) = 4$. Relax $(b, a)$: the candidate is $4 + (-6) = -2$, which is smaller than $d(a) = 1$, so $d(a) = -2$. Relax $(a, t)$: the candidate is $-2 + 1 = -1$, so $d(t) = -1$.
3. **Pass 2.** Relax $(s, a)$: the candidate is $1$, which is not smaller than $-2$. Relax $(s, b)$: the candidate is $4$, which is not smaller than $4$. Relax $(b, a)$: the candidate is $-2$, which is not smaller than $-2$. Relax $(a, t)$: the candidate is $-1$, which is not smaller than $-1$. Nothing changes.
4. **Pass 3.** Nothing changes either. Since $n = 4$, the algorithm has now made $n - 1 = 3$ passes, so the distances are final: $d(s) = 0$, $d(a) = -2$, $d(b) = 4$ and $d(t) = -1$.
5. **The detection pass.** Relax every edge once more. Nothing improves, so there is no negative cycle reachable from $s$.

The answer is $d(t) = -1$, reached along the route $s \to b \to a \to t$ whose cost is $4 - 6 + 1 = -1$. Notice that the route Dijkstra's algorithm reports has cost $2$, and that the relaxation of the edge $b \to a$ is what makes the difference: it is the only edge with a negative weight, and it is the edge that the greedy step cannot see.

### The same algorithm on a graph with a negative cycle

Take three vertices $s$, $a$ and $b$ with the edges $s \to a$ of weight $1$, $a \to b$ of weight $-1$ and $b \to a$ of weight $-1$. The cycle $a \to b \to a$ has total weight $-2$.

1. **Pass 1.** Relax $(s, a)$: $d(a) = 1$. Relax $(a, b)$: the candidate is $1 - 1 = 0$, so $d(b) = 0$. Relax $(b, a)$: the candidate is $0 - 1 = -1$, which is smaller than $1$, so $d(a) = -1$.
2. **Pass 2.** Relax $(s, a)$: the candidate is $1$, which is not smaller than $-1$. Relax $(a, b)$: the candidate is $-1 - 1 = -2$, which is smaller than $0$, so $d(b) = -2$. Relax $(b, a)$: the candidate is $-2 - 1 = -3$, which is smaller than $-1$, so $d(a) = -3$.
3. **The detection pass**, which is pass $n = 3$ and is the first pass after the $n - 1 = 2$ passes that are needed for the distances. Relax $(a, b)$: the candidate is $-3 - 1 = -4$, which is smaller than $-2$. The relaxation succeeds, so the graph contains a negative cycle.

The distances are still decreasing at the end, which is the signature of a negative cycle: the truck can drive around the loop and get cheaper forever.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
If no negative cycle is reachable from the source, then after $|V| - 1$ passes
the recorded distance of every vertex is its true shortest-path distance, and
the detection pass finds no improvement.
</MathPanel>

<MathPanel type="proof" title="Proof">
We prove the invariant by induction on the number of passes.

Before any pass, the recorded distance of $v$ is the length of the shortest walk from $s$ to $v$ using at most zero edges, which is $0$ for $v = s$ and $\infty$ for every other vertex. The invariant holds.

Suppose the invariant holds after $k$ passes, and consider the $(k+1)$-st pass. Two things can happen to the distance of a vertex $v$.

If a relaxation of an edge $(u, v)$ succeeds, the new value is $d(u) + w(u, v)$. By the induction hypothesis, $d(u)$ is the length of a walk from $s$ to $u$ using at most $k$ edges, so the new value is the length of a walk to $v$ using at most $k + 1$ edges. The new value is therefore never smaller than the true minimum over such walks.

Conversely, let $W$ be a walk from $s$ to $v$ using at most $k + 1$ edges that is shortest among all such walks. Write it as $s = v_0, v_1, \ldots, v_{k+1} = v$, where the last $k$ edges are dropped to give a walk to $v_{k+1}$ using at most $k$ edges. By the induction hypothesis, after $k$ passes the recorded distance of $v_{k+1}$ is at most the length of that walk. When the edge $(v_{k+1}, v)$ is relaxed in the $(k+1)$-st pass, the candidate is therefore at most the length of $W$. So the recorded distance of $v$ is at most the length of $W$, and by the first half it is at least that length. It is therefore equal to it, which is the invariant. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
After $|V| - 1$ passes, and when no negative cycle is reachable from the
source, the recorded distance of every vertex is its shortest-path distance.
</MathPanel>

<MathPanel type="proof" title="Proof">
By the lemma about simple paths, when no negative cycle is reachable, the
shortest walk from $s$ to any vertex $v$ is a simple path, and such a path
uses at most $|V| - 1$ edges. The invariant says that after $|V| - 1$ passes
the recorded distance of $v$ is the length of the shortest walk from $s$ to
$v$ using at most $|V| - 1$ edges, which is the length of that simple path,
which is $\delta(v)$. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
The detection pass finds an improvement if and only if a negative cycle is
reachable from the source.
</MathPanel>

<MathPanel type="proof" title="Proof">
Suppose the detection pass, which is pass $|V|$, improves the distance of
some vertex $v$. Then there is a walk from $s$ to $v$ using $|V|$ edges that
is cheaper than the cheapest walk using at most $|V| - 1$ edges. A walk
with $|V|$ edges on $|V|$ vertices repeats a vertex, so it contains a cycle.
The cycle must have negative total weight, because deleting it would leave a
walk with fewer edges that is no longer than the original, contradicting the
strict improvement. So a negative cycle is reachable from $s$.

Conversely, suppose a negative cycle $C$ is reachable from $s$. After $|V| - 1$ passes the recorded distances are finite for every vertex on $C$, because a walk from $s$ to each of them exists. Traversing the cycle once more from any vertex of $C$ produces a walk that is cheaper than the walk that does not traverse it, so some edge of $C$ can still be relaxed, and the detection pass finds it. $\square$
</MathPanel>

## Complexity analysis

**Time: $O(VE)$.** There are at most $|V| - 1$ passes plus one detection pass, and each pass relaxes every edge once, so there are at most $|V| \cdot |E|$ relaxations. Each relaxation is a comparison and an assignment, so it is $O(1)$.

**Auxiliary space: $O(V)$.** The distance array holds $V$ entries, and the edge list is the input rather than an auxiliary structure. The algorithm does not copy the graph, and it does not need to.

<MathPanel type="complexity" title="Complexity">
Bellman-Ford: time $O(VE)$, auxiliary space $O(V)$ beyond the input graph.
Dijkstra's algorithm on the same graph costs $O((V + E) \log V)$, so
Bellman-Ford is the slower of the two by a factor of roughly $E / \log V$.
</MathPanel>

Two practical warnings belong here. First, the distances must be stored in a type that can hold a sum of $|V|$ weights of magnitude $10^9$, and the negative cycle detection makes the intermediate values grow without bound, so a 64-bit type is required. Second, the algorithm can stop early: if a pass changes nothing, the distances are final and the remaining passes cannot change them. That optimization is valid for the distances, but it removes the detection pass, so it cannot be used when the question is whether a negative cycle exists.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Cheapest path, weights may be negative | Bellman-Ford |
| Cheapest path, weights nonnegative | [Dijkstra](/algorithms/graphs/dijkstra) |
| Cheapest path, weights zero or one | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Cheapest path in a directed acyclic graph | A [topological order](/algorithms/graphs/topological-sort), then relaxation, in $O(V + E)$ |
| Fewest edges from one source | [Breadth-first search](/algorithms/graphs/bfs) |
| Does a negative cycle exist | Bellman-Ford, with the detection pass |
| Cheapest path between every pair | Floyd-Warshall, which also detects negative cycles on the diagonal |
| Which vertices are reachable | [Depth-first search](/algorithms/graphs/dfs) or breadth-first search |

The row that decides most contests is the third one. If the graph is guaranteed to be acyclic, a topological order lets the relaxation be done once, in $O(V + E)$, and the algorithm is strictly better than Bellman-Ford's $O(VE)$. Many problems that mention negative weights also mention that the graph is a directed acyclic graph, and the statement wording is worth reading closely.

## Recursion decision

Bellman-Ford is iterative in its standard form: the passes are a loop, and the relaxation is a statement.

The recursive shape that people try first relaxes a vertex and then recursively relaxes the vertex it leads to. That form does not compute the shortest paths, because it commits to one outgoing edge at a time rather than considering all of them, and it does not detect a negative cycle. The recursive shape that does work is the one that mirrors the passes: a function that relaxes every edge once and then calls itself, with a recursion depth of at most $|V|$.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Use the loop; the depth is at most $ | V | $ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Use the loop |
| Python | Interpreter limit of 1000 | 1000 frames | Use the loop; $ | V | $ can exceed the limit |
| Pascal | The operating system stack | Depends on the platform | Use the loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | Use the loop |

The recommendation is the loop, in every language. The recursion depth of the recursive form is the number of passes, which is $|V|$, and $|V|$ can be $10^5$ in a graph where the pass count is irrelevant.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Running Dijkstra on a graph with a negative edge | A distance is finalized too early and is wrong | Use Bellman-Ford when a weight is negative |
| Making $ | V | $ passes and calling it done | The last pass is the detection pass, and a negative cycle is reported as a distance | Make $ | V | - 1$ passes, then one detection pass |
| Stopping at the first pass with no change, then claiming there is no negative cycle | A negative cycle that starts later is missed | Run the full $n - 1$ passes before the detection pass |
| Forgetting to reset the distance of the source | The source keeps a stale value from the previous query | Reset the array for every query |
| Using a 32-bit distance | The sum overflows, and the negative cycle test overflows faster | Use a 64-bit type |
| Checking the negative cycle in the wrong graph | The cycle is not reachable from the source | State the reachability condition in the answer |
| Assuming the edge order inside a pass matters | It does not, and chasing it wastes time | Fix any order and do not revisit it |
| Relaxing only the outgoing edges of the source | The distances are the lengths of one-edge paths | Relax every edge of the graph in every pass |

### Why this fails: the graph that breaks Dijkstra

The mistake that survives review most often is running [Dijkstra's algorithm](/algorithms/graphs/dijkstra) on a graph that has a negative edge. It is invisible in the code, because the code is exactly the code for the nonnegative case, and it produces a plausible number rather than a crash.

Consider the four vertices $s$, $a$, $b$ and $t$ with these edges:

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

Bellman-Ford does not have a greedy step, so it does not have this failure. On the same graph it reports $d(a) = -2$ and $d(t) = -1$, as the [step-by-step execution](#step-by-step-execution) shows. The price is a factor of roughly $E / \log V$ in time, and the reason is that Bellman-Ford never has to decide which vertex to settle next: it relaxes everything, repeatedly, and lets the answer fall out.

The lesson generalizes: **a greedy step is only sound when the weights make the greedy choice safe, and no algorithm can have a greedy step over a problem whose answers depend on the order in which the alternatives are considered.**

## Variants and extensions

- **Early exit.** Stop at the first pass in which nothing changes. The distances are then final, and the algorithm can be much faster on graphs where the answer appears early. The negative cycle test is lost, so the full pass count must still be run when the question is about cycles.
- **The queue-based form.** Put a vertex on a queue when it is relaxed and process it until the queue is empty. This is the short-term path first algorithm, often called SPFA. It is the same relaxation rule with a different schedule, it is usually much faster in practice, and it is much harder to predict: its worst case is still $O(VE)$.
- **Negative cycle detection from any vertex.** To test the whole graph rather than the part reachable from one source, initialize every distance to zero. Every vertex then behaves like a source, so a cycle anywhere in the graph is detected.
- **Recovering the cycle.** When the detection pass finds an improvement, the predecessor array can be walked backwards $V$ times. Since a vertex repeats within $V$ steps, the repeated part of the walk is a negative cycle, and it can be reported.
- **Reweighting.** If no negative cycle is reachable, the values $\delta(v)$ form a set of potentials such that every reweighted weight $w'(u, v) = w(u, v) + \delta(u) - \delta(v)$ is nonnegative. The graph can then be solved by Dijkstra, and the answers are recovered by subtracting the potentials. This is Johnson's algorithm, and it is how Dijkstra is made to work on negative weights.
- **The multiplicative form.** An exchange rate $r$ from one currency to another becomes a weight $-\ln r$, and arbitrage is exactly the existence of a negative cycle.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Read the weights before writing code. Any negative weight rules out Dijkstra and rules in this algorithm.
2. Decide whether the question is about distances or about cycles. Both are answered by the same algorithm, but the cycle question needs the full pass count.
3. Decide whether the negative cycle must be reachable from the source. If the statement says "anywhere in the graph", initialize every distance to zero instead of only the source's.
4. Write the pass count down before writing the loop: $n - 1$ passes, then one detection pass. Writing it down is what prevents the off-by-one.
5. Use a 64-bit distance. The negative cycle test produces values that grow by the size of the cycle on every pass.
6. If the statement guarantees the graph is acyclic, use a topological order instead: one pass, linear time.
7. Test the four-vertex graph with a negative edge from this article on any implementation you write. It is the smallest case that separates the two algorithms.

## Worked problems

### Problem 1: the freight network with rebates

**Restatement.** A directed network has $n$ depots and $m$ lanes, and each lane has an integer cost, possibly negative. Given a source depot, report the cheapest total cost of a route to every depot, and $-1$ for the depots that cannot be reached. Report the answer as "unbounded" if any negative cycle is reachable from the source. Constraints: $1 \le n \le 1\,000$, $0 \le m \le 10\,000$, and every cost is between $-10^9$ and $10^9$.

**Naive baseline.** Dijkstra's algorithm. It is wrong on any graph with a negative lane, as the counterexample above shows.

**Insight.** A cheapest route is a simple route, so it uses at most $n - 1$ lanes, and the cheapest route to each depot can be found by relaxing every lane repeatedly.

**Derivation.** Initialize the distances to infinity and the source's to zero. For $n - 1$ passes, relax every lane in the graph. Then relax every lane once more: if any lane improves, a negative cycle is reachable.

**Correctness.** The invariant says that after $k$ passes the distances are the lengths of the cheapest walks using at most $k$ edges. After $n - 1$ passes those are the cheapest simple routes, and a further improvement means a negative cycle.

**Complexity.** $O(nm)$ time and $O(n)$ space, which is $10^7$ relaxations at the maximum constraints.

**Common wrong approach.** Reporting a distance for a depot that lies on or past a reachable negative cycle. The cheapest cost to such a depot is not a number, and the algorithm has to say so.

### Problem 2: arbitrage in a currency exchange

**Restatement.** There are $n$ currencies, and a table of exchange rates $r_{i,j}$, where converting one unit of currency $i$ gives $r_{i,j}$ units of currency $j$. Some rates are less than one. Report whether a round trip can turn a unit of money into more than a unit of money. Constraints: $2 \le n \le 100$ and at most $10^4$ exchange pairs.

**Naive baseline.** Enumerate all cycles of length two and three. This finds most arbitrage but misses longer cycles, and the number of cycles grows exponentially with the length.

**Insight.** Multiplication becomes addition through a logarithm. Assign the weight $w(i, j) = -\ln r_{i,j}$ to the edge from currency $i$ to currency $j$. A cycle multiplies its rates into a product $P$, and the sum of its weights is $-\ln P$. The product exceeds one exactly when the sum is negative, so arbitrage is exactly the existence of a negative cycle.

**Derivation.** Build the directed graph on the $n$ currencies with those weights, and run Bellman-Ford with every distance initialized to zero, so that a cycle anywhere in the graph is detected. Perform $n$ passes; if the $n$-th pass still improves a distance, report arbitrage.

**Correctness.** The transformation maps each cycle to a cycle whose weight is the negative logarithm of the product of its rates, so a negative cycle and a profitable round trip are the same object. The detection pass reports a negative cycle if and only if one exists.

**Complexity.** $O(nm)$ time and $O(n)$ space, which is $10^6$ relaxations.

**Common wrong approach.** Comparing floating point products around a cycle directly. Rounding makes a product of exactly one look like either more or less than one, and the comparison is not transitive in floating point. The logarithmic transform at least gives a single well-defined comparison per edge, and the cycle detection is then exact.

### Problem 3: the negative cycle out of reach

**Restatement.** A graph has $n$ vertices and $m$ directed edges with integer weights. Given a source $s$, report the cheapest distance from $s$ to every vertex, and separately report whether the whole graph contains a negative cycle, even one that $s$ cannot reach. Constraints: $1 \le n \le 1\,000$, $0 \le m \le 10\,000$.

**Naive baseline.** One Bellman-Ford run from $s$, and a second run from every vertex in turn to find the cycles. The second part costs $O(V^2 E)$.

**Insight.** The two questions have different scopes, and the scope is encoded in the initialization. A run from $s$ only reaches the component of $s$, but initializing every distance to zero makes every vertex behave like a source, so every cycle in the graph is reachable from some "source" and is detected in the same run.

**Derivation.** Run the algorithm twice. The first time, set the distance of $s$ to zero and every other distance to infinity, and make $n - 1$ passes followed by a detection pass; this answers the distance question and detects the cycles reachable from $s$. The second time, set every distance to zero and make $n$ passes; a relaxation in the last pass means a negative cycle exists anywhere in the graph.

**Correctness.** The first run is correct by the theorem. In the second run, every vertex has a finite distance from the start, so every cycle is reachable, and the detection pass finds it if it is negative.

**Complexity.** $O(nm)$ time for each run and $O(n)$ space, so $O(nm)$ in total.

**Common wrong approach.** Reporting that there is no negative cycle because the run from $s$ found none. The cycle in another component has no effect on the distances from $s$, and the statement asks about the whole graph.

## Practice progression

1. **Recognition.** Given a statement, decide whether Bellman-Ford applies. Look for negative weights, rebates, arbitrage, and losses, and check whether the graph is acyclic.
2. **Direct application.** Implement the relaxation loop with $n - 1$ passes and a separate detection pass, and check it against a brute-force search over all simple paths on graphs with at most eight vertices.
3. **Adaptation.** Add the early exit, add the multi-source initialization that detects a cycle anywhere in the graph, and add the predecessor array that lets you recover the cycle itself.
4. **Combination.** Use the potentials computed by Bellman-Ford to reweight a graph with negative edges and then run Dijkstra on it, which is the engine of Johnson's algorithm.
5. **Challenge.** Solve a problem on a graph with $n = 10^4$ and $m = 10^5$ where the $O(VE)$ bound is too slow, by exploiting the structure of the graph, such as a layered or acyclic layout.
6. **Transfer.** Use the same relaxation discipline for a different question: the longest path in a directed acyclic graph, which is a relaxation in reverse over a [topological order](/algorithms/graphs/topological-sort), or the arbitrage detection of Problem 2.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does the greedy step of Dijkstra's algorithm fail on a negative edge? (Common mistakes)
2. Why is $n - 1$ passes enough, and what does the extra pass test? (Key insight)
3. State the invariant of the algorithm. (Algorithm derivation)
4. Work the four-vertex graph with the edge $b \to a$ of weight $-6$ through both algorithms and say what each one reports. (Common mistakes)
5. What does the detection pass prove in both directions? (Correctness proof)
6. When is the negative cycle reachable from the source, and how is that encoded in the initialization? (Variants and extensions)
7. Why does the early exit break the cycle detection? (Complexity analysis)
8. Why is a topological order a better choice than this algorithm when the graph is acyclic? (Algorithm selection)
9. What does the exchange rate transformation $w = -\ln r$ turn arbitrage into? (Worked problems)
10. Why is the order of the edges inside a pass irrelevant? (Algorithm derivation)

## Further reading

- The nonnegative version of the same question, which is faster, is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The version that is linear when the weights are zero or one is [0-1 BFS](/algorithms/graphs/0-1-bfs).
- The queue-based search that answers the same questions when every edge costs one is [breadth-first search](/algorithms/graphs/bfs).
- The ordering that removes the need for repeated passes when the graph is acyclic is [topological sort](/algorithms/graphs/topological-sort).
- The traversal that shares the relaxation idea but not the purpose is [depth-first search](/algorithms/graphs/dfs).
- The structure that answers the reachability questions that come up in practice is the [disjoint set union](/algorithms/graphs/dsu).
- Every listing of the shortest-path family is collected on the [Dijkstra source page](/implementations/graphs-dijkstra/).
