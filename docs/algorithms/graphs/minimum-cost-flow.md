---
id: graphs.minimum-cost-flow
title: Minimum cost flow
summary: Maximum flow of minimum total cost in a directed network, found by augmenting along shortest paths in the residual graph while potentials keep every reduced cost nonnegative.
division: [platinum]
subjects: [graphs]
level: advanced
importance: advanced-technique
keywords: [minimum cost flow, max flow, residual graph, potentials, successive shortest paths]
prerequisites:
    required: [graphs.representation, graphs.dijkstra]
    recommended: [graphs.bellman-ford]
complexity:
    time: "O(F (V + E) log V)"
    space: "O(V + E)"
assumptions:
    - The network is directed.
    - Every capacity and cost is a nonnegative integer.
implementations: graphs.minimum-cost-flow
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.minimum-cost-flow" />

<CodeViewer algorithm="graphs.minimum-cost-flow" />

Minimum cost flow answers two questions at once. How much can be sent from a source $s$ to a sink $t$ through a network whose edges have capacities, and among all ways of sending that much, which one costs the least?

A maximum-flow algorithm answers only the first question. It treats every edge as equally desirable and stops as soon as no more flow can reach the sink, so the flow it returns may be needlessly expensive. Adding a cost to every edge turns the problem into an optimization over all maximum flows, and the extra structure changes the algorithm rather than merely the output.

The method in this article is **successive shortest paths with potentials**. Each round finds the cheapest way to add one more unit of flow in the _residual graph_, the graph that records both the unused capacity of every edge and the option of canceling flow already sent. A potential on every vertex reweights the residual arcs so that all of them look nonnegative, which lets Dijkstra's algorithm find that cheapest route. The flow is optimal for its value after every round, and it is maximum when the sink can no longer be reached.

The running time is $O(F (V + E) \log V)$, where $F$ is the value of the maximum flow. The space is $O(V + E)$, dominated by the residual graph, which stores two arcs for every edge of the input.

## Problem motivation

A freight company has warehouses connected by one-way truck routes. Each route $u \to v$ can carry a limited number of containers per day, and each container sent along it costs a fixed amount that depends on distance, tolls and fuel. The company wants to ship as many containers as possible from its main depot $s$ to a distribution center $t$, and it wants the cheapest schedule among all schedules that ship that maximum number.

The constraints:

- $1 \le n \le 2\,000$ warehouses.
- $1 \le m \le 10\,000$ one-way routes.
- Each capacity is an integer between $1$ and $10^9$.
- Each cost is an integer between $0$ and $10^9$.
- The total answer fits in a signed 64-bit integer.

Capacity makes this a flow problem rather than a shortest-path problem. A single cheapest route from $s$ to $t$ may have room for only a few containers, while a slightly more expensive route may have room for thousands. Choosing routes one at a time without revisiting earlier choices can therefore miss both a larger flow and a cheaper one.

Cost makes it more than a maximum-flow problem. Two schedules can both saturate every route out of the depot and still differ in price, because the same units can be routed through different middle warehouses. The answer is a pair: the maximum number of containers, and the minimum total cost of shipping that many.

The natural first attempt is to send flow along the cheapest available route, then along the next cheapest, and so on. That is a greedy algorithm, and it is wrong for the same reason the cheapest edge out of a vertex is not always part of a shortest path: a cheap route now can consume capacity that a later, better combination needs. The fix is not to avoid greedy choices, but to let the algorithm _undo_ them. The residual graph is what makes an earlier choice reversible.

## Recognition patterns

Minimum cost flow is the right tool when all of the following hold.

- Every edge carries **two numbers**: a capacity and a cost per unit.
- The objective is **linear in the flow**: the total cost is the sum of flow times cost, with no fixed charge and no discount for volume.
- The flow must be **conserved** at every vertex except the source and the sink.
- The question asks for either the **maximum flow and its minimum cost**, or a **fixed amount** of flow at minimum cost.
- Capacities are **integral**, so the optimal flow can be taken integral and each augmentation moves at least one unit.

The constraint values that rule the technique in and out are worth stating plainly.

| Statement says | What it rules |
| --- | --- |
| Capacities only, no costs | Rules in max flow, such as Dinic; min cost flow is unnecessary |
| Capacities and costs, maximum flow wanted | Rules in successive shortest paths |
| Capacities and costs, a required amount $F$ | Rules in the same algorithm with a different stopping rule |
| Each item used at most once, costs on pairs | Rules in an assignment problem, which is a min-cost flow special case |
| Capacities up to $10^9$ and flow value in the billions | Rules out unit-by-unit augmentation; use capacity or cost scaling |
| Some costs negative, no negative cycle | Rules in one Bellman-Ford pass to initialize the potentials |
| A negative cost cycle exists | The cost is unbounded below, so the instance has no finite answer |
| Only connectivity or reachability is asked | Rules out flow entirely; use a traversal |

Two phrases in a statement are reliable signals. "Maximum flow" together with "minimum cost", "cheapest schedule", or "least total price" points here. "Maximum flow" alone points at a max-flow algorithm. "Minimum cost" alone, with each item used exactly once, points at the assignment problem or the [Hungarian algorithm](/algorithms/graphs/hungarian-algorithm), which is the special case of this technique on a bipartite graph of unit capacities.

<Synonyms terms="minimum cost flow, min cost max flow, mcmf, successive shortest paths, min cost circulation" />

## Naive approach

The first baseline is to run a maximum-flow algorithm and ignore the costs. Dinic's algorithm computes a maximum flow in $O(V^2 E)$ time and never looks at the cost field. On a network with several maximum flows it returns whichever one its level graph happens to find, and that flow can be far more expensive than necessary.

The second baseline is the greedy route choice. Sort the edges by cost, send as much as possible along the cheapest route from $s$ to $t$, remove the saturated edges, and repeat. This is the algorithm the previous section already rejected, and it fails in two separate ways. It can stop before the flow is maximum, and even when it reaches a maximum flow it can pay too much.

The smallest failure is the network used in the [step-by-step execution](#step-by-step-execution) section:

| Edge      | Capacity | Cost |
| --------- | -------- | ---- |
| $0 \to 1$ | $1$      | $1$  |
| $0 \to 2$ | $1$      | $2$  |
| $1 \to 2$ | $1$      | $1$  |
| $1 \to 3$ | $1$      | $5$  |
| $2 \to 3$ | $1$      | $1$  |

With source $0$ and sink $3$, the cheapest route is $0 \to 1 \to 2 \to 3$ at cost $1 + 1 + 1 = 3$. Sending one unit along it saturates all three of its edges. The greedy algorithm then has no forward route to the sink, reports a flow of $1$, and stops. The true maximum flow is $2$: send one unit along $0 \to 1 \to 3$ and one along $0 \to 2 \to 3$, for a cost of $6 + 3 = 9$. Reaching it requires canceling the middle edge $1 \to 2$ of the first route, which a forward-only greedy algorithm cannot do.

The third baseline is to enumerate flows. Even on a small graph the number of feasible flows is exponential, and the capacities are far too large for unit-by-unit enumeration. The fourth baseline is linear programming. It is correct and polynomial, but a general simplex implementation is far more code than the problem needs, and the network structure admits a much simpler algorithm.

## Key insight

The insight is that an earlier routing decision should be treated as reversible, and the residual graph is the data structure that records how to reverse it.

After sending one unit along an edge $u \to v$ of cost $a$, the residual graph gains an arc $v \to u$ of capacity one and cost $-a$. Sending flow along that reverse arc cancels the original unit and refunds its cost. The residual graph therefore describes every feasible change to the current flow, not only the changes that add new edges.

Once the residual graph is in hand, the cheapest way to increase the flow by one unit is a shortest path from $s$ to $t$ in that graph. If the path uses only forward arcs, it adds new flow. If it uses a reverse arc, it reroutes flow that was already sent. Both are legal, and both are priced correctly.

There is one obstacle. A reverse arc has negative cost, so the residual graph has negative edges, and [Dijkstra's algorithm](/algorithms/graphs/dijkstra) does not apply to it. Running [Bellman-Ford](/algorithms/graphs/bellman-ford) every round would work but would cost $O(VE)$ per augmentation.

The second half of the insight removes that cost. Attach a **potential** $h(v)$ to every vertex and replace each residual cost $a(u,v)$ by the **reduced cost**

$$
a_h(u,v) = a(u,v) + h(u) - h(v).
$$

The potentials are chosen so that every reduced cost is nonnegative. The original cost of any path $P$ from $s$ to $t$ then differs from its reduced cost by a constant:

$$
\sum_{(u,v) \in P} a(u,v) = \sum_{(u,v) \in P} a_h(u,v) - h(s) + h(t).
$$

The telescoping sum cancels every intermediate potential, so the shortest reduced path is also the shortest original path. Dijkstra can find it on the nonnegative reduced costs, and the constant is restored when the cost is accumulated.

The potentials are not static. After a shortest-path computation, adding the reduced distance $d(v)$ to $h(v)$ preserves the nonnegativity of every reduced cost. This is the same update that makes [Johnson's algorithm](/algorithms/graphs/johnson) work, and it is the reason each augmentation can use a heap instead of a slower relaxation pass.

## Visual intuition

Picture the network as a road map with two labels on every road: how many trucks fit, and what one truck costs. The current flow is a set of trucks already on the map. The residual graph is a second map drawn on top of the first: every road with spare room appears in its original direction, and every road carrying traffic appears in the opposite direction with a negative price, meaning "remove one truck from this road and get the money back".

The algorithm is a repeated search on the second map. It asks for the cheapest way to add one more truck from the depot to the distribution center. The answer may travel forward on empty roads, backward on roads that are already full, or a mixture of the two. A backward move is not a mistake; it is a rerouting, and the negative price is the refund that makes the comparison fair.

The potentials are the second visual idea. Think of them as height labels on the vertices. The reduced cost of a road is its price plus the height of its tail minus the height of its head: the price of climbing from one height to another. A feasible potential makes every remaining road look like a downhill or flat climb. The labels are raised after each search by exactly the reduced distance, so the next search starts from an equally valid set of heights.

A useful thing to watch in any trace of the algorithm is the pair of arcs for one input edge. Before any flow is sent, only the forward arc has capacity. After one unit is sent, the forward arc has one unit less capacity and the backward arc has one unit more. If a later shortest path uses the backward arc, the two capacities move back toward their starting values, and the net effect is that the earlier choice has been undone without ever editing the flow array directly.

The trace in the next section is the smallest network where this happens, and it is worth following the two arcs of the edge $1 \to 2$ through both rounds.

## Formal model

Let $G = (V, E)$ be a directed graph. Every edge $e = (u,v)$ has an integer capacity $c(e) \ge 0$ and an integer cost $a(e) \ge 0$. Two distinguished vertices are the source $s$ and the sink $t$.

::: math definition Definition
A **flow** is a function $f : E \to \mathbb{R}_{\ge 0}$ with $0 \le f(e) \le c(e)$ for every edge, and with

$$
\sum_{e \in \delta^{+}(v)} f(e) - \sum_{e \in \delta^{-}(v)} f(e) = 0
$$

for every vertex $v$ other than $s$ and $t$. The **value** of the flow is the net amount leaving the source,

$$
|f| = \sum_{e \in \delta^{+}(s)} f(e) - \sum_{e \in \delta^{-}(s)} f(e),
$$

and its **cost** is

$$
\operatorname{cost}(f) = \sum_{e \in E} f(e) \, a(e).
$$
:::

::: math definition Definition
The **residual capacity** of a pair of vertices $(u,v)$ is

$$
r_f(u,v) = c(u,v) - f(u,v) + f(v,u),
$$

where a missing edge has capacity zero and flow zero. A **residual arc** is an ordered pair with $r_f(u,v) > 0$. Its residual cost is $a(u,v)$ when the arc is a forward edge and $-a(v,u)$ when it cancels flow on the opposite edge.
:::

::: math definition Definition
A **potential** is a function $h : V \to \mathbb{R}$. It is **feasible** for a residual graph if

$$
a(u,v) + h(u) - h(v) \ge 0
$$

for every residual arc $(u,v)$. The left-hand side is the **reduced cost** of the arc, written $a_h(u,v)$.
:::

::: math lemma Lemma
For any path $P$ from $s$ to $t$ and any potential $h$,

$$
\sum_{(u,v) \in P} a_h(u,v) = \sum_{(u,v) \in P} a(u,v) + h(s) - h(t).
$$
:::

::: math proof Proof
Expand the definition and telescope:

$$
\sum_{(u,v) \in P} \bigl(a(u,v) + h(u) - h(v)\bigr)
= \sum_{(u,v) \in P} a(u,v) + h(s) - h(t).
$$

Every interior vertex appears once with a positive sign and once with a negative sign, so only the endpoints survive. $\square$
:::

The optimization problem has two forms. In the **maximum** form, maximize $|f|$ first and minimize $\operatorname{cost}(f)$ among the flows with that value. In the **fixed-value** form, a target $F$ is given and the cost is minimized subject to $|f| = F$; if no such flow exists, the instance has no answer. The algorithm below solves the maximum form, and stopping it after $F$ units solves the fixed-value form.

## Algorithm derivation

The state is the residual graph, a potential array $h$ indexed by vertex, and two accumulators: the flow value and its cost.

The initialization is $h(v) = 0$ for every vertex. This is feasible exactly because every input cost is nonnegative: every residual arc is either an input edge with $a \ge 0$ or the reverse of an edge that currently carries no flow, and the latter does not exist until flow is sent.

Each round performs four steps.

1. Run Dijkstra from $s$ on the reduced costs $a_h$, ignoring arcs with zero residual capacity. Record the reduced distance $d(v)$ and the arc that last relaxed each vertex.
2. If $d(t)$ is infinite, the sink is unreachable in the residual graph. Stop: the current flow is maximum.
3. For every reachable vertex $v$, set $h(v) \gets h(v) + d(v)$. This keeps every reduced cost nonnegative.
4. Let $\Delta$ be the smallest residual capacity on the path from $s$ to $t$ found by following the recorded arcs backward. Push $\Delta$ units along the path, update both directions of every residual arc, add $\Delta$ to the flow, and add $\Delta \, (h(t) - h(s))$ to the cost.

The fourth step deserves a closer look. After the potential update, $h(t) - h(s)$ is exactly the original cost of the path just used. Before the update, the reduced length of the path is $d(t)$, and the lemma says the original length is $d(t) + h_{\text{old}}(t) - h_{\text{old}}(s)$. Since $h_{\text{new}}(t) = h_{\text{old}}(t) + d(t)$ and $h_{\text{new}}(s) = h_{\text{old}}(s) + d(s)$ with $d(s) = 0$, the original length is $h_{\text{new}}(t) - h_{\text{new}}(s)$. Accumulating the new difference is therefore correct, and accumulating the old one would miss the distance just traveled.

::: math invariant Invariant
Before every round, the current flow is feasible and has minimum cost among all flows of its value, and the potential $h$ is feasible for the current residual graph. Every residual arc that leaves a vertex reachable from $s$ has a nonnegative reduced cost.
:::

The invariant is established by induction. Initially the zero flow has value zero and cost zero, and the zero potential is feasible because costs are nonnegative. The preservation argument is in the correctness proof.

The loop terminates because every augmentation increases $|f|$ by at least one, capacities are integral, and the flow value cannot exceed the finite capacity of the cut around $s$. The number of rounds is therefore at most $F$.

## Step-by-step execution

Take the five-edge network from the naive-approach section, with $n = 4$, $s = 0$ and $t = 3$:

| Edge      | Capacity | Cost |
| --------- | -------- | ---- |
| $0 \to 1$ | $1$      | $1$  |
| $0 \to 2$ | $1$      | $2$  |
| $1 \to 2$ | $1$      | $1$  |
| $1 \to 3$ | $1$      | $5$  |
| $2 \to 3$ | $1$      | $1$  |

The potentials start at $[0,0,0,0]$, the flow is zero and the cost is zero.

1. Dijkstra on the original costs finds $0 \to 1 \to 2 \to 3$ with reduced distances $d = [0,1,2,3]$ and original cost $3$. Every vertex is reachable, so the potentials become $[0,1,2,3]$. The bottleneck is $1$, and the flow becomes $1$ at cost $3$.
2. The residual graph now has the reverse arcs $1 \to 0$ with cost $-1$, $2 \to 1$ with cost $-1$, and $3 \to 2$ with cost $-1$. The edges of the first path are saturated in the forward direction.
3. Reduced costs with the current potentials are $0$ on $0 \to 2$, $0$ on the reverse arc $2 \to 1$, and $3$ on $1 \to 3$. Dijkstra finds $0 \to 2 \to 1 \to 3$ with reduced length $3$. Its original cost is $3 + h(3) - h(0) = 3 + 3 = 6$: pay $2$ for $0 \to 2$, receive $1$ back for canceling $1 \to 2$, and pay $5$ for $1 \to 3$.
4. The reduced distances are $d = [0,0,0,3]$, so the potentials become $[0,1,2,6]$. The bottleneck is again $1$, the flow becomes $2$, and the cost becomes $3 + 6 = 9$.
5. The saturated arcs now separate $s$ from $t$: $0 \to 1$ and $0 \to 2$ are full, and $1 \to 3$ and $2 \to 3$ are full. Dijkstra finds no route, so the loop stops with flow $2$ and cost $9$.

The final flow is not the first flow plus a second disjoint route in the obvious sense. The second augmentation _canceled_ the middle edge $1 \to 2$ of the first route. The resulting flow uses $0 \to 1 \to 3$ and $0 \to 2 \to 3$, which is the cheaper of the two maximum flows. The reverse arc $2 \to 1$ is what allowed the algorithm to change its mind.

Notice also that the second path contains an edge of negative original cost. That is why the potentials are not an optimization detail: without them, Dijkstra would reject the negative arc or, worse, compute a wrong distance.

## Correctness proof

::: math theorem Theorem
When the algorithm stops, the flow is maximum, and among all flows of that value it has minimum cost. If the algorithm is stopped after $F$ units in the fixed-value form, the flow has minimum cost among all flows of value $F$.
:::

The proof has three parts: the potential update preserves feasibility, each augmentation is along a true shortest path, and the resulting flow is optimal for its value.

::: math lemma Lemma
If $h$ is feasible and $d(v)$ is the reduced distance from $s$ to $v$, then $h'(v) = h(v) + d(v)$ is feasible for every residual arc whose tail is reachable from $s$.
:::

::: math proof Proof
Let $(u,v)$ be a residual arc with $u$ reachable. Then $v$ is reachable as well, because the arc has positive residual capacity and Dijkstra can traverse it. The shortest-path inequality gives $d(v) \le d(u) + a_h(u,v)$. Therefore

$$
a_{h'}(u,v) = a_h(u,v) + d(u) - d(v) \ge 0.
$$

An arc whose tail is unreachable is never used by a search from $s$, so its reduced cost does not need to remain nonnegative for the algorithm to be correct. $\square$
:::

::: math lemma Lemma
The path chosen in a round is a shortest path from $s$ to $t$ in the current residual graph, and its original cost is $h_{\text{new}}(t) - h_{\text{new}}(s)$.
:::

::: math proof Proof
Dijkstra returns a path whose reduced length is $d(t)$, the minimum over all residual paths. The telescoping lemma converts reduced length to original length by adding $h_{\text{old}}(t) - h_{\text{old}}(s)$. After the update, that sum is exactly $h_{\text{new}}(t) - h_{\text{new}}(s)$. Since the conversion adds the same constant to every $s$-$t$ path, the path that is shortest in reduced cost is also shortest in original cost. $\square$
:::

::: math lemma Lemma
If the current flow is a minimum-cost flow of value $k$, then augmenting along a shortest residual path produces a minimum-cost flow of value $k + \Delta$.
:::

::: math proof Proof
Let $f$ be the current flow and let $f'$ be any flow of value $k + \Delta$ with smaller cost. Consider the difference $f' - f$ as a flow in the residual graph. It decomposes into an $s$-$t$ flow of value $\Delta$, which is a sum of $\Delta$ unit paths, plus a collection of cycles. Every cycle has nonnegative cost, because a negative-cost residual cycle would allow the cost of $f$ to be reduced without changing its value, contradicting the optimality of $f$. Each of the unit paths has cost at least the cost of a shortest path, so the $s$-$t$ part costs at least $\Delta \cdot \operatorname{cost}(P)$, where $P$ is the path the algorithm chose. Therefore

$$
\operatorname{cost}(f') \ge \operatorname{cost}(f) + \Delta \cdot \operatorname{cost}(P),
$$

where $P$ is the chosen shortest path. But $f + \Delta P$ is a feasible flow of value $k + \Delta$ with exactly that cost, so no $f'$ can be cheaper. $\square$
:::

::: math theorem Theorem
The algorithm terminates with a maximum flow, and that flow has minimum cost among all maximum flows.
:::

::: math proof Proof
Each round preserves feasibility of the flow and of the potentials by the first lemma, and the second lemma identifies a genuine shortest augmenting path. The third lemma proves by induction that after every round the flow is optimal for its value, starting from the zero flow.

When the sink becomes unreachable in the residual graph, no additional flow can be sent along any route. The max-flow min-cut theorem then says that the current flow is maximum, because the set of vertices reachable from $s$ forms a cut whose residual capacity is zero. The flow is therefore maximum, and the induction says it is the cheapest flow of that value. $\square$
:::

The exchange argument in the third lemma is the part worth remembering. The proof does not assume that the current flow is globally optimal. It assumes only that no cheaper flow of the _same_ value exists, and it uses the absence of a negative residual cycle to bound the cost of any larger flow. The shortest path is the cheapest way to cross from the old value to the new one, so taking it cannot be a mistake.

## Complexity analysis

**Time: $O(F (V + E) \log V)$.** Each round runs one Dijkstra on a graph with $V$ vertices and at most $2E$ residual arcs. With a binary heap and lazy deletion, that costs $O((V + E) \log V)$. The potential update is $O(V)$, the path walk is $O(V)$, and the residual updates are $O(V)$. The number of rounds is at most $F$, because each augmentation increases the flow value by at least one and the value never exceeds $F$. Multiplying gives the bound.

**Auxiliary space: $O(V + E)$.** The residual graph stores two arcs for every input edge, so $2E$ entries. The potentials, distances, previous-arc array and heap each hold $O(V)$ or $O(E)$ entries. The input graph itself is part of the $O(V + E)$ figure.

The bound depends on the flow value, which is a feature and a warning. If every capacity is at most $10^3$ and there are $10^3$ edges, then $F$ is at most $10^6$ and the algorithm is comfortable. If a single edge has capacity $10^9$, the flow value can be $10^9$, and even though each augmentation moves as much as the bottleneck allows, the worst case still has too many rounds for a contest limit. The two standard repairs are **capacity scaling**, which only augments along paths whose bottleneck is at least a threshold $\Delta$ and reduces $\Delta$ by a factor of two, and **cost scaling**, which works on the dual potentials instead of the primal flow. Both are outside the scope of this article, and both are the right choice when the statement allows capacities in the billions.

The cost accumulator needs care. A path can cost $10^9$ per edge and carry $10^9$ units, so a single augmentation can add $10^{18}$ to the total, and the total can be larger still. A 32-bit integer is never enough. Contest statements usually guarantee that the answer fits in 64 bits; when they do not, only an arbitrary-precision language is safe. The reference implementations use 64-bit integers, except Python, whose integers are arbitrary precision, and JavaScript, whose numbers lose exactness above $2^{53}$.

::: math complexity Complexity
Successive shortest paths with potentials: time $O(F (V + E) \log V)$ for a maximum flow of value $F$, auxiliary space $O(V + E)$. With a Bellman-Ford initialization for negative costs, add $O(VE)$ once. With capacity scaling, the number of augmentations falls to $O(E \log U)$ for a maximum capacity $U$.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Maximum flow, costs irrelevant | [Dinic's algorithm](/algorithms/graphs/minimum-cut) or another max-flow method |
| Maximum flow and minimum cost | Successive shortest paths with potentials |
| A fixed amount $F$ at minimum cost | The same algorithm, stopping after $F$ units |
| Assignment of people to tasks with costs | [Hungarian algorithm](/algorithms/graphs/hungarian-algorithm), or min-cost flow on unit capacities |
| Minimum-cost matching in a bipartite graph | Min-cost flow, or a specialized matching algorithm |
| Capacities in the billions | Capacity scaling or cost scaling |
| Negative costs but no negative cycle | One [Bellman-Ford](/algorithms/graphs/bellman-ford) pass to initialize the potentials |
| Negative cost cycle present | The cost is unbounded; detect it and report that |
| Edge-disjoint paths only | Max flow with unit capacities |
| Minimum cut with vertex capacities | Split vertices, then max flow |

The four methods in the table below are easy to confuse because they all involve flows or matchings. The differences are the objective and the structure of the graph.

|  | Max flow | Min-cost flow | Assignment | Min-cost matching |
| --- | --- | --- | --- | --- |
| Objective | Flow value | Flow value, then cost | Cost of a perfect matching | Cost of a maximum matching |
| Edge data | Capacity | Capacity and cost | Cost per pair | Cost per pair |
| Graph shape | Any directed graph | Any directed graph | Complete bipartite | Bipartite |
| Typical method | Dinic | Successive shortest paths | Hungarian | Min-cost flow or blossom |
| Time | $O(V^2 E)$ | $O(F (V + E) \log V)$ | $O(n^3)$ | Depends on the algorithm |

The assignment problem is the special case in which every capacity is one and the graph is bipartite. A min-cost flow solver handles it, but the Hungarian algorithm is smaller and faster for a dense square matrix. Reach for min-cost flow when the network has capacities greater than one, when vertices other than the two sides are present, or when the flow value is part of the answer.

## Reference implementations

The six listings above implement the same program variant. The input is $n$, $m$, $s$ and $t$, followed by $m$ lines $u$, $v$, capacity and cost, with zero-based directed edges. The output is one line with the maximum flow and its minimum cost, separated by a space.

All six use the same structure: a residual adjacency list that stores both directions of every edge, an index that points from an arc to its reverse, Dijkstra with reduced costs and lazy deletion, and a potential array that is updated after each search. The C and Pascal versions store the linked lists in flat arrays and recover the reverse arc with the exclusive-or of the index and one. The C++ version stores an explicit reverse index in each edge. The Java and Python versions store edges in per-vertex lists and update the reverse entry through that index. The JavaScript version does the same with plain objects.

The languages differ only in the details that a reader should expect. C and C++ use 64-bit integers and a hand-written binary heap or `std::priority_queue`. Java uses a byte scanner, a `PriorityQueue` of states ordered by distance, and a `StringBuilder` for output. Python uses `heapq` and tuples. Pascal uses a hand-written heap and dynamic arrays. JavaScript uses a hand-written heap and arrays of objects. Ties in the heap may be broken differently, which changes the order in which equal-cost paths are found but never the flow value or the total cost.

The Pascal and JavaScript listings are educational references, not USACO submission languages. Both begin with that note. The Pascal version also avoids 128-bit arithmetic and keeps its sentinel below $2^{53}$, because the reference compiler represents `Int64` as a JavaScript number.

## Recursion decision

Minimum cost flow is iterative. The outer loop sends one augmentation per round, and the inner work is Dijkstra, which is itself iterative. There is no natural recursive formulation, because the algorithm's state includes the residual graph and the potentials, and both are shared by every round.

The recursive shape people try first is a depth-first search for an augmenting path, the Ford-Fulkerson method. It is correct for maximum flow when capacities are integral, but it has no mechanism for choosing the cheapest path, so it does not solve the cost problem. On graphs with irrational capacities the naive version need not terminate at all, and on integral graphs it can be exponentially slow. Depth-first search is the right tool for reachability, not for an optimization over flows.

The second tempting recursion is a recursive Dijkstra. It is possible to write one, but the recursion depth is the number of settled vertices, and the heap is a better container than the call stack. The language limits below are the usual ones.

| Language   | Default stack              | Practical depth         | Recommendation            |
| ---------- | -------------------------- | ----------------------- | ------------------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the loop and the heap |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the loop and the heap |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the loop and the heap |
| Pascal     | The operating system stack | Depends on the platform | Use the loop and the heap |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the loop and the heap |

The outer loop is bounded by the flow value, not by the graph size, so a recursive implementation would also need a recursion depth proportional to $F$. That is a second reason to keep it iterative.

## Implementation walkthrough

Three pieces carry the algorithm.

The first is the addition of an edge together with its reverse:

```cpp
graph[u].push_back({v, static_cast<int>(graph[v].size()), cap, cost});
graph[v].push_back({u, static_cast<int>(graph[u].size()) - 1, 0, -cost});
```

The reverse arc starts with zero capacity and the negated cost. When $\Delta$ units are sent along the forward arc, the update is

```cpp
edge.cap -= add;
graph[edge.to][edge.rev].cap += add;
```

and the same two lines, applied to the reverse arc, undo the augmentation. The order matters when $u = v$; computing the reverse index before the second `push_back` is what keeps a self-loop consistent.

The second piece is the reduced cost and the potential update:

```cpp
const long long candidate = current + edge.cost + height[v] - height[edge.to];
if (candidate < distance[edge.to]) {
    distance[edge.to] = candidate;
    previousVertex[edge.to] = v;
    previousEdge[edge.to] = i;
    queue.push({candidate, edge.to});
}
```

After Dijkstra, every reachable vertex raises its potential by its final distance:

```cpp
for (int v = 0; v < n; v++) {
    if (distance[v] < INF) {
        height[v] += distance[v];
    }
}
```

A vertex that was not reached keeps its old potential. That is safe because no residual arc with positive capacity leaves the reachable set; if one did, its head would have been reached.

The third piece is the cost accumulation:

```cpp
flow += add;
total += add * (height[t] - height[s]);
```

Using the updated potentials is not a stylistic choice. The difference $h(t) - h(s)$ after the update is the original cost of the path just used. Using the previous potentials would omit the reduced distance and undercount every augmentation after the first.

Two guards are easy to forget. A source equal to the sink has no finite maximum flow, so the reference programs print `0 0` and stop. An edge with a negative capacity or an endpoint outside the vertex range is skipped while the input is read; silently accepting it would corrupt the residual graph.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Storing only forward edges | An earlier routing can never be canceled, so the flow can be too small | Add the reverse arc with cost $-a$ and capacity zero |
| Running Dijkstra on the original costs | Reverse arcs are negative and Dijkstra's greedy step fails | Use reduced costs and a feasible potential |
| Forgetting to update the potentials | Reduced costs become negative after the first augmentation | Add each reachable vertex's distance after every search |
| Accumulating cost with the old potentials | The total undercounts the current path | Use $h(t) - h(s)$ after the update |
| Using 32-bit integers | The cost overflows on large capacities or costs | Use 64-bit arithmetic |
| Ignoring zero-capacity edges | Dijkstra may "use" an edge that carries no flow | Test the residual capacity before relaxing |
| Treating a negative capacity as valid | The residual capacity becomes negative and the model breaks | Skip or reject such an edge while reading |
| Forgetting the fixed-value stopping rule | The program sends more than $F$ units and reports the wrong cost | Stop at $F$; print $-1$ if the sink is unreachable first |
| Assuming the first cheapest path is final | The flow can be maximum but more expensive than necessary | Keep the residual arcs and rerun the search |
| Recursing over the flow value | The call stack can overflow on a large $F$ | Use the iterative outer loop |
| Letting $s = t$ | The maximum flow is unbounded and the loop never ends | Guard the equality before the loop |
| Mixing up the reverse indices of parallel edges | An augmentation updates the wrong arc | Store the reverse index per arc, or pair the arcs and use exclusive-or |

### Why this fails: the greedy route that cannot be undone

Return to the five-edge network and send flow with a forward-only greedy algorithm. The cheapest route is $0 \to 1 \to 2 \to 3$, of cost $3$. After one unit, its three edges are full. The only remaining route out of the source is $0 \to 2$, and $2 \to 3$ is already full, so the algorithm stops at flow $1$.

The true maximum flow is $2$. The second unit needs the route $0 \to 2 \to 1 \to 3$, which uses the reverse of $1 \to 2$ to cancel the first unit on that edge. A forward-only algorithm never considers that move, because the reverse arc does not exist in its data structure.

The cost version of the same mistake is subtler. A forward-only algorithm that somehow reaches the maximum flow can still pay too much, because the cheapest maximum flow may require exchanging flow between two routes that both look saturated. In the residual graph that exchange is a cycle of negative cost, and the absence of such a cycle is exactly the certificate that the current flow is optimal. Successive shortest paths maintains that certificate at every round.

## Variants and extensions

- **Bellman-Ford initialization.** If some costs are negative, the zero potential is not feasible. Run Bellman-Ford from a virtual source joined to every vertex by a zero-cost edge, use the resulting distances as the initial potentials, and then run the ordinary algorithm. The virtual source is the [Johnson's algorithm](/algorithms/graphs/johnson) trick in disguise.
- **SPFA every round.** Replace Dijkstra with a queue-based shortest-path relaxation. This handles negative residual costs without a separate initialization, at the price of a much worse worst-case bound.
- **Capacity scaling.** Only augment along paths whose bottleneck is at least a threshold $\Delta$, then halve $\Delta$. This reduces the number of augmentations from $O(F)$ to $O(E \log U)$, which is the right choice when capacities are huge.
- **Cost scaling.** Work on the dual potentials and push flow along arcs whose reduced cost is small. It gives a polynomial bound that does not depend on the flow value, which is the standard method in libraries that must handle very large instances.
- **Lower bounds.** Replace an edge with a lower bound by subtracting the bound from both its capacity and the required flow at its endpoints, then add a super source and super sink to restore conservation.
- **Min-cost circulation.** Add an edge from $t$ to $s$ with infinite capacity and cost zero, or with a negative cost to reward flow. A negative-cost cycle then represents an improvement that does not change the source-to-sink value.
- **Vertex capacities.** Split every vertex into an in-copy and an out-copy joined by an edge whose capacity is the vertex limit. The min-cost flow algorithm does not change; only the graph does.
- **Assignment and matching.** Set every capacity to one and use the bipartite graph of allowed pairs. The same code solves the assignment problem, and the [Hungarian algorithm](/algorithms/graphs/hungarian-algorithm) is the specialized alternative.
- **Multi-source and multi-sink.** Join a super source to every source and every sink to a super sink with zero-cost, infinite-capacity edges, then solve the ordinary problem.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each is avoidable with a fixed procedure.

1. Read the statement for two numbers per edge. If only capacities appear, use a max-flow algorithm. If capacities and costs appear, write down whether the flow value is maximized or fixed before writing any code.
2. Decide the sign of the costs. If all are nonnegative, initialize the potentials to zero. If any is negative, plan a Bellman-Ford initialization or an SPFA-based search.
3. Build the residual graph with both directions of every edge. Store the reverse index explicitly, or add the pair consecutively and use the exclusive-or of the index.
4. Use 64-bit integers for the capacities, the distances, the potentials and the total cost.
5. Run Dijkstra on reduced costs, update the potentials for every reachable vertex, and then accumulate $\Delta \, (h(t) - h(s))$.
6. Stop when the sink is unreachable. In the fixed-value form, also stop after $F$ units and print the failure value if the sink disappears first.
7. Test on the smallest network where the first cheapest path has to be undone. If the answer is too small, the reverse arcs are missing. If the answer is too expensive, the potentials or the cost accumulation are wrong.
8. Keep a slow reference implementation, such as a Bellman-Ford-based successive shortest path, and compare the two on random small graphs. A disagreement is a counterexample you can trace.

## Worked problems

### Problem 1: the freight network

**Restatement.** A directed network has $n$ warehouses and $m$ routes. Route $i$ goes from $u_i$ to $v_i$, has capacity $c_i$ and costs $a_i$ per unit. Ship as many units as possible from $s$ to $t$, and among all ways of doing so, minimize the total cost. Report the flow value and the cost. Constraints: $1 \le n \le 2\,000$, $1 \le m \le 10\,000$, $1 \le c_i \le 10^9$ and $0 \le a_i \le 10^9$.

**Naive baseline.** Send flow along the cheapest available route until the route is saturated, remove it, and repeat. On the five-edge example this stops at flow $1$ while the answer is $2$, and on larger networks it can also return a maximum flow whose cost is too high.

**Insight.** The cheapest way to add one unit is a shortest path in the residual graph, and a reverse arc of cost $-a$ is how the algorithm cancels an earlier unit and refunds its cost.

**Derivation.** Initialize the potentials to zero. Each round runs Dijkstra on the reduced costs, stops if the sink is unreachable, raises the potentials of the reachable vertices by their reduced distances, finds the bottleneck on the recorded path, pushes that many units, and adds the bottleneck times $h(t) - h(s)$ to the total.

**Correctness.** The potential update preserves nonnegative reduced costs on every usable arc. The chosen path is a shortest residual path, so by the exchange argument no flow of the new value can be cheaper. When the sink is unreachable, the reachable set is a cut of zero residual capacity, so the flow is maximum.

**Complexity.** $O(F (V + E) \log V)$ time and $O(V + E)$ space. The flow value can be large, so the bound is stated in terms of $F$ rather than $n$ and $m$.

**Common wrong approach.** Running Dinic and then trying to reduce the cost by local edge swaps. A local swap can leave a negative residual cycle elsewhere, and finding all such cycles is exactly the problem the successive shortest path algorithm solves in one pass.

### Problem 2: the dream team

**Restatement.** $N$ competitive programrs each have a university $A_i$, a subject $B_i$ and a power $C_i$. A team is valid if no two members share a university and no two share a subject. Let $k$ be the largest valid team size. For every $i$ from $1$ to $k$, report the maximum total power of a valid team of exactly $i$ members. Constraints: $1 \le N \le 30\,000$, $1 \le A_i, B_i \le 150$ and $1 \le C_i \le 10^9$.

**Naive baseline.** Enumerate subsets of people, or run a separate maximum-weight matching for every team size. The first is exponential in $N$, and the second repeats work that the residual graph already contains.

**Insight.** A valid team is a matching between universities and subjects, and a matching of size $i$ is a flow of $i$ units from a source through universities and subjects to a sink. The power is a profit, so put $-C$ on the person edge and minimize the cost.

**Derivation.** Build a source, one vertex per university, one vertex per subject and a sink. Add a unit-capacity zero-cost edge from the source to every university, a unit-capacity edge of cost $-C$ from $A_i$ to $B_i$ for every person, and a unit-capacity zero-cost edge from every subject to the sink. The costs are negative, so compute one set of feasible potentials with Bellman-Ford from a virtual source before the first Dijkstra. Run one augmentation per team size and print the negated total cost after each one.

**Correctness.** Every integral flow of $i$ units selects $i$ person edges with distinct universities and distinct subjects, which is a valid team, and every valid team of size $i$ gives such a flow. The cost of the flow is the negation of its total power, so the minimum-cost flow of value $i$ is the maximum-power team of size $i$.

**Complexity.** The network has at most $302$ vertices and $N + 300$ edges, and the flow value is at most $150$. After the Bellman-Ford initialization, the augmentations cost $O(150 \cdot (N + 300) \log 300)$, which is comfortably inside the limit.

**Common wrong approach.** Sorting the people by power and taking the strongest compatible person at each step. A strong person can block two weaker people who together contribute more, and the flow formulation is what resolves that trade-off.

### Problem 3: the fixed flow with a failure case

**Restatement.** A directed network has $n$ vertices and $m$ edges, each with a capacity and a cost. Send exactly $F$ units from vertex $0$ to vertex $n - 1$ at minimum cost, or report that it is impossible. Constraints: $2 \le n \le 100$, $1 \le m \le 1\,000$, $0 \le F \le 1\,000$, and every capacity and cost is between $0$ and $1\,000$.

**Naive baseline.** Send as much as possible and hope the maximum flow is at least $F$. If it is larger, the program has sent too much and the reported cost is for the wrong value. If it is smaller, the program has no failure signal.

**Insight.** The fixed-value problem is the maximum problem with a different stopping rule. The successive shortest path loop is correct for every intermediate flow value, so it can stop as soon as exactly $F$ units have been sent.

**Derivation.** Run the ordinary algorithm. If the accumulated flow reaches $F$, stop and print the cost. If the sink becomes unreachable first, print $-1$. The bottleneck of the last augmentation may need to be clipped so that the flow does not overshoot $F$; with integral capacities, sending the full bottleneck and then subtracting the excess is not valid, so clip before updating the residuals.

**Correctness.** By the induction in the correctness proof, the flow after every augmentation is optimal for its value. Stopping at value $F$ therefore returns a minimum-cost flow of value $F$. If the sink is unreachable before $F$, the maximum flow is smaller than $F$, so no feasible flow of value $F$ exists.

**Complexity.** At most $F$ augmentations, each $O((V + E) \log V)$, for $O(F (V + E) \log V)$ time and $O(V + E)$ space. With $F \le 1\,000$ and $E \le 1\,000$, the largest instance is about one million heap operations.

**Common wrong approach.** Forgetting to clip the last augmentation and then printing the cost of a flow larger than $F$. The total cost is then correct for a different problem, and the judge rejects it on the first test where the last path has a bottleneck greater than the remaining demand.

## Practice progression

1. **Recognition.** Given a statement, decide whether it is max flow, min-cost flow, assignment, or plain shortest path. Write down the objective, the edge data and whether the flow value is fixed.
2. **Direct application.** Implement the residual graph, the reverse indices and one Dijkstra run on reduced costs. Verify that a single augmentation matches the cheapest route in the original graph.
3. **Adaptation.** Add the potential update and the cost accumulator, then test on the five-edge network where the first route must be canceled. Add the fixed-value stopping rule and the unreachable-sink failure case.
4. **Combination.** Solve an assignment instance by building the bipartite network and compare the answer with the [Hungarian algorithm](/algorithms/graphs/hungarian-algorithm). Add vertex capacities by splitting vertices, and add multiple sources with a super source.
5. **Challenge.** Handle a network whose capacities are up to $10^9$ by implementing capacity scaling, or initialize the potentials with Bellman-Ford and solve an instance whose costs are negative.
6. **Transfer.** Use the same residual-and-potential machinery for min-cost circulation, for the dual of a min-cost flow, or for a scheduling problem whose state graph has both capacities and costs.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does a maximum-flow algorithm not solve this problem, and what extra information does the cost field add? (Problem motivation)
2. What is a residual arc, what is its capacity, and what is its cost when it cancels flow? (Formal model)
3. Why is a reverse arc necessary for the five-edge example, and what does the algorithm do without it? (Common mistakes)
4. State the reduced cost and prove that a shortest reduced path is a shortest original path. (Key insight, Formal model)
5. Why are the initial potentials zero, and when is that no longer valid? (Algorithm derivation, Variants and extensions)
6. How are the potentials updated after a Dijkstra run, and why does the update preserve nonnegativity? (Correctness proof)
7. Why is the cost accumulated as $\Delta \, (h(t) - h(s))$ after the update rather than before it? (Implementation walkthrough)
8. Why is the algorithm optimal for every intermediate flow value, not only for the maximum? (Correctness proof)
9. What is the running time in terms of $F$, and what changes when capacities are huge? (Complexity analysis)
10. How does the fixed-value version differ from the maximum version, including the failure case? (Worked problems)
11. Why is the algorithm iterative, and why is depth-first augmentation not a substitute? (Recursion decision)
12. What does a negative residual cycle mean, and why can the final flow not contain one? (Correctness proof, Variants and extensions)

## Further reading

- The shortest-path search that runs inside every augmentation is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The algorithm that computes potentials when costs are negative is [Bellman-Ford](/algorithms/graphs/bellman-ford).
- The reweighting trick that makes those potentials nonnegative is developed in [Johnson's algorithm](/algorithms/graphs/johnson).
- The capacity-only version of the same residual graph is the subject of [minimum cut](/algorithms/graphs/minimum-cut).
- The unit-capacity bipartite special case is [bipartite matching](/algorithms/graphs/bipartite-matching), and its weighted form is the [Hungarian algorithm](/algorithms/graphs/hungarian-algorithm).
- The adjacency-list and residual-graph conventions assumed here are covered in [graph representation](/algorithms/graphs/representation).
- The all-pairs shortest-path problem that shares the potential idea is [Floyd-Warshall](/algorithms/graphs/floyd-warshall).
