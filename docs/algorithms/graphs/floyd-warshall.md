---
id: graphs.floyd-warshall
title: Floyd-Warshall and all-pairs shortest paths
summary: Shortest paths between every ordered pair of vertices, computed by adding one allowed intermediate vertex at a time to a matrix of distances.
division: [silver, gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords:
    [
        floyd-warshall,
        all-pairs shortest paths,
        transitive closure,
        negative cycle,
        dynamic programming,
    ]
prerequisites:
    required: [graphs.representation]
    recommended: [graphs.dijkstra, graphs.bfs, dynamic-programming.dag-dp]
complexity:
    time: "O(V^3)"
    space: "O(V^2)"
assumptions:
    - Edge weights may be negative.
    - The graph has no negative cycle, unless detecting one is the goal.
implementations: graphs.floyd-warshall
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/graphs.floyd-warshall.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

Floyd-Warshall computes the shortest distance between every ordered pair of vertices of a weighted graph. It keeps a matrix of tentative distances and, one vertex at a time, asks a single question of every pair: is the route that passes through the vertex just admitted cheaper than the best route found so far?

The algorithm is three nested loops over the vertices:

```text
for each vertex k:
    for each vertex i:
        for each vertex j:
            distance[i][j] = min(distance[i][j], distance[i][k] + distance[k][j])
```

That is the whole algorithm. There is no priority queue, no greedy choice, and no assumption that the weights are nonnegative. The outer loop must be the one over the intermediate vertex, and the order of the two inner loops is a free choice. The matrix is $V$ by $V$, so the space is $O(V^2)$, and the triple loop performs at most $V^3$ iterations, so the time is $O(V^3)$.

The technique is a dynamic program over a set of allowed intermediate vertices. After the first $k$ passes of the outer loop, the matrix holds the shortest distances that use only the first $k$ vertices as intermediates. When $k$ reaches $V$, every vertex is allowed, and the matrix holds the true distances.

## Problem motivation

A regional airline publishes a fare for every one-way flight it operates, and a travel agency wants to answer a long list of questions of the form "what is the cheapest route from airport $a$ to airport $b$?" The questions arrive offline, so the agency can afford to precompute.

The constraints:

- $1 \le n \le 400$ airports.
- $0 \le m \le 100\,000$ one-way flights.
- Every fare is an integer between $-1\,000$ and $1\,000$. A negative fare is a promotional discount, and a route may use several of them.
- The discounts never form a cycle of negative total fare.
- $1 \le q \le 100\,000$ questions, each naming two airports.

The number of questions is the first clue. Answering each one with a search from its source would cost $O(q(n + m) \log n)$, which is too slow. The second clue is the number of airports: with $n = 400$, a table of all $n^2$ distances has only $160\,000$ entries, and filling it by the triple loop costs $6.4 \cdot 10^7$ operations, which fits comfortably in a second.

The third clue is the negative fare. A single-source method that assumes nonnegative weights, such as [Dijkstra's algorithm](/algorithms/graphs/dijkstra), cannot be used at all. Floyd-Warshall does not care about the sign of a weight. It cares only that no cycle has negative total weight, because then the cheapest route between two airports would not exist: a traveler could loop forever and collect discounts.

This combination, a small dense graph, many pairs to answer, and weights that may be negative, is exactly the shape of the problem that Floyd-Warshall is for.

## Recognition patterns

Floyd-Warshall is the right tool when the following hold.

- The problem asks for distances between **many pairs**, or between **every pair**, rather than from one source.
- The number of vertices is **small**, typically at most a few hundred to a few thousand. The time is cubic, so $n = 500$ is comfortable and $n = 5\,000$ is not.
- The graph is **dense**, or at least dense enough that running a single-source algorithm from every vertex would be slower.
- **Weights may be negative**, as long as no negative cycle is reachable. This is the property that rules out Dijkstra.
- The answer is a **table**, or a set of queries that can all be answered from a table, rather than one number.

The constraint values that decide the technique are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| $n \le 500$, many pairs | Rules in Floyd-Warshall |
| $n \le 500$, one source | Rules in [Dijkstra's algorithm](/algorithms/graphs/dijkstra) or [breadth-first search](/algorithms/graphs/bfs), which are faster |
| $n \ge 10^5$ | Rules out Floyd-Warshall; use a single-source algorithm |
| $m \le 10^5$ with $n \le 500$ | The graph is dense; the cubic algorithm is the right shape |
| Negative weights, no negative cycle | Rules in Floyd-Warshall or [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| A negative cycle | Rules out finite answers; Floyd-Warshall can at least detect it |
| Unweighted graph | Rules out Floyd-Warshall as overkill; repeated breadth-first search is linear per source |
| Only reachability, no lengths | Rules in the Boolean version of the same triple loop |

Two phrases in a statement point at this technique. "Between every pair" and "for each query $(a, b)$" both suggest a table. So does "the graph is given as an adjacency matrix": a matrix input is often a hint that the intended solution works on the matrix.

<Synonyms terms="floyd-warshall, floyd warshall, all pairs shortest path, apsp, transitive closure" />

## Naive approach

There are three baselines, and each one loses for a different reason.

The first is to run [Dijkstra's algorithm](/algorithms/graphs/dijkstra) once from every vertex. With a binary heap, one run costs $O((V + E) \log V)$, so all $V$ runs cost $O(V(V + E) \log V)$. On a dense graph with $E = O(V^2)$ that is $O(V^3 \log V)$, slower than Floyd-Warshall by a logarithmic factor. On a sparse graph it is much faster, which is why this baseline is the right choice when the graph is sparse and the weights are nonnegative.

The second is to run [Bellman-Ford](/algorithms/graphs/bellman-ford) once from every vertex. One run costs $O(VE)$, so all runs cost $O(V^2 E)$, which is $O(V^4)$ on a dense graph. It handles negative weights, but it is too slow even for $n = 400$.

The third is to enumerate every simple path between every pair. That is exponential in the number of vertices, and it is the definition of the problem rather than a solution to it.

All three baselines share a weakness: they solve the all-pairs problem by solving $V$ separate single-source problems, and they never reuse the work of one source in the next. Floyd-Warshall reuses everything. It fills one table, and every entry of the table helps fill the others.

## Key insight

The insight is that a shortest path can be described by the set of vertices it is allowed to pass through, and that this set can be grown one vertex at a time.

Number the vertices $1, \ldots, n$, and let $D^{(k)}_{ij}$ be the length of the shortest path from $i$ to $j$ whose internal vertices all belong to $\{1, \ldots, k\}$. The endpoints $i$ and $j$ are not restricted; only the vertices in the middle are.

Now compare $D^{(k)}_{ij}$ with $D^{(k-1)}_{ij}$. A path that is allowed to use vertex $k$ either does not use it, in which case it was already allowed at step $k - 1$, or it uses $k$ somewhere in the middle. In the second case, split the path at $k$:

- The part from $i$ to $k$ uses only vertices of $\{1, \ldots, k - 1\}$ internally, because $k$ appears only at the split.
- The part from $k$ to $j$ uses only vertices of $\{1, \ldots, k - 1\}$ internally, for the same reason.

So the two parts have lengths $D^{(k-1)}_{ik}$ and $D^{(k-1)}_{kj}$, and the whole path has length $D^{(k-1)}_{ik} + D^{(k-1)}_{kj}$. Taking the better of the two cases gives the recurrence

$$
D^{(k)}_{ij} = \min\left(D^{(k-1)}_{ij},\ D^{(k-1)}_{ik} + D^{(k-1)}_{kj}\right).
$$

The recurrence is the whole algorithm. The base case $k = 0$ allows no intermediate vertices at all, so $D^{(0)}_{ij}$ is zero when $i = j$, the weight of the cheapest edge from $i$ to $j$ when one exists, and infinity otherwise.

The outer loop runs over $k$, and the two inner loops run over $i$ and $j$. The order of the inner loops does not matter: one indexes the row of the pivot and the other indexes its column, and neither can change the pivot entries during the pass. The order of the outer loop matters absolutely, and the [common mistakes](#common-mistakes) section shows a graph on which the wrong order gives a wrong answer.

## Visual intuition

Picture the distance matrix as a grid. Row $i$, column $j$ holds the best known distance from $i$ to $j$. When the outer loop reaches vertex $k$, the $k$-th row and the $k$-th column become the pivot: for every cell $(i, j)$ outside them, the algorithm compares the current value with the sum of the cell in the same row and the pivot column, $(i, k)$, and the cell in the pivot row and the same column, $(k, j)$.

The picture below shows one such comparison.

```text
              j
              |
   i -------- d[i][j]
   |           ^
   |           |  candidate = d[i][k] + d[k][j]
   v           |
   k ----------+
```

If the sum through $k$ is smaller, the cell is rewritten. The pivot row and the pivot column are read, and with no negative cycle the pass cannot change either of them, which is what makes the in-place update safe.

The other way to see the algorithm is as a sequence of matrices. The first matrix holds the direct flights. After the first pass, it also holds every route that changes planes once at vertex $1$. After the second pass, it holds every route that changes planes at vertices $1$ or $2$. After $n$ passes, it holds every route, with any number of changes.

The matrix has a property that makes the in-place update easy to reason about: an entry either stays the same or decreases, and it never increases, because the update is a minimum. That is also why a negative cycle is visible at the end: a vertex on a negative cycle eventually gets a negative distance to itself, since the cheapest route from the vertex to itself is the cycle that collects the discount.

## Formal model

Let $G = (V, E)$ be a directed graph with $V = \{1, \ldots, n\}$ and a weight function $w : E \to \mathbb{R}$. Parallel edges are allowed. The graph may also be undirected, in which case each undirected edge is stored as two directed edges of the same weight.

::: math definition Definition
The **length** of a path is the sum of the weights of its edges. The empty path from $i$ to $i$ has length zero.
:::

::: math definition Definition
The **distance** $\delta(i, j)$ is the minimum length of a path from $i$ to $j$, or $\infty$ when no path exists. When the graph has a negative cycle that $i$ can reach and from which $j$ is reachable, the distance is $-\infty$, because the cycle can be traversed any number of times.
:::

::: math definition Definition
A path from $i$ to $j$ is a **$k$-path** when every internal vertex of the path belongs to $\{1, \ldots, k\}$. The endpoints are not required to belong to that set.
:::

::: math definition Definition
$D^{(k)}_{ij}$ is the minimum length of a $k$-path from $i$ to $j$, or $\infty$ when no such path exists.
:::

::: math lemma Lemma
For every $k \ge 1$ and every pair $i, j$,

$$
D^{(k)}_{ij} = \min\left(D^{(k-1)}_{ij},\ D^{(k-1)}_{ik} + D^{(k-1)}_{kj}\right).
$$
:::

::: math lemma Lemma
If the graph has no negative cycle, then $D^{(n)}_{ij} = \delta(i, j)$ for every pair $i, j$.
:::

The two lemmas are the algorithm and its correctness, and both are proved in the correctness proof below.

## Algorithm derivation

The state is a single $n$ by $n$ matrix `distance`. The initialization is the base case of the recurrence:

1. Set `distance[i][j]` to infinity for every pair.
2. Set `distance[i][i]` to zero for every vertex.
3. For every edge $(i, j)$ of weight $w$, set `distance[i][j]` to the smaller of its current value and $w$.

Step 3 is a minimum rather than an assignment because parallel edges are allowed, and only the cheapest one can ever matter. It also converts an undirected input into the directed form, by writing the edge into both `distance[u][v]` and `distance[v][u]`.

The update is the recurrence, written as a loop:

```text
for k from 1 to n:
    for i from 1 to n:
        for j from 1 to n:
            if distance[i][k] + distance[k][j] < distance[i][j]:
                distance[i][j] = distance[i][k] + distance[k][j]
```

The comparison is skipped when either side of the sum is infinity, which is what the guarded form in the reference implementations does. Without the guard, a finite sentinel such as $4 \cdot 10^{18}$ added to itself would overflow a 64-bit integer.

The in-place update deserves a word, because the recurrence reads $D^{(k-1)}$ and the loop writes $D^{(k)}$ into the same cells. The cells that the $k$-th pass reads are the $k$-th row and the $k$-th column. Could the pass already have changed `distance[i][k]` before reading it? The only candidate that can rewrite that cell during the pass is `distance[i][k] + distance[k][k]`, because the pass only admits $k$ as an intermediate. With no negative cycle, `distance[k][k]` is zero: the empty path sets it to zero, and no route through $k$ can beat zero without forming a negative cycle. So the candidate equals the cell itself, and the cell cannot change. The same argument holds for `distance[k][j]`. Every read therefore sees a value from the previous layer, and the in-place matrix computes the same recurrence as two alternating matrices would. If a negative cycle exists, `distance[k][k]` can become negative, the read can change, and the values stop being finite shortest distances; the diagonal check at the end is what reports that case.

The initialization of the diagonal also deserves a word. Leaving `distance[i][i]` at infinity instead of zero breaks every path that starts or ends at $i$, because the recurrence can never add the empty prefix. Zero is the correct base case even when a negative self-loop exists; in that case the diagonal ends negative, which is the signal that the graph has a negative cycle.

::: math invariant Invariant
Immediately after the pass for vertex $k$, `distance[i][j]` equals $D^{(k)}_{ij}$ for every pair $i, j$, provided no negative cycle exists.
:::

The invariant is the algorithm. It starts true for $k = 0$, the initialization is its base case, the recurrence preserves it, and at $k = n$ it says that the matrix holds the true distances.

## Step-by-step execution

Take four vertices $a, b, c, d$ and five directed edges: $a \to b$ of weight $3$, $a \to c$ of weight $8$, $b \to c$ of weight $1$, $b \to d$ of weight $7$, and $c \to d$ of weight $2$. The true distance from $a$ to $c$ is $3 + 1 = 4$ through $b$, and the true distance from $a$ to $d$ is $3 + 1 + 2 = 6$ through $b$ and $c$.

The initial matrix $D^{(0)}$ is the direct-edge matrix. A dash stands for infinity.

|     | $a$ | $b$ | $c$ | $d$ |
| --- | --- | --- | --- | --- |
| $a$ | $0$ | $3$ | $8$ | --  |
| $b$ | --  | $0$ | $1$ | $7$ |
| $c$ | --  | --  | $0$ | $2$ |
| $d$ | --  | --  | --  | $0$ |

Now run the passes.

1. **$k = a$.** No edge enters $a$, so every `distance[i][a]` is infinity except for $a$ itself, and no pair improves. The matrix is unchanged.
2. **$k = b$.** The row of $b$ and the column of $b$ are the pivot. The pair $(a, c)$ improves: $3 + 1 = 4$ beats $8$. The pair $(a, d)$ improves: $3 + 7 = 10$ beats infinity. Every other pair keeps its value. The path $a \to b \to c$ has now been found.
3. **$k = c$.** The pair $(a, d)$ improves again: $4 + 2 = 6$ beats $10$. The pair $(b, d)$ improves: $1 + 2 = 3$ beats $7$. The path $a \to b \to c \to d$ has now been found, and it uses both $b$ and $c$ as intermediates.
4. **$k = d$.** No edge leaves $d$, so no pair improves. The matrix is final.

The final matrix is:

|     | $a$ | $b$ | $c$ | $d$ |
| --- | --- | --- | --- | --- |
| $a$ | $0$ | $3$ | $4$ | $6$ |
| $b$ | --  | $0$ | $1$ | $3$ |
| $c$ | --  | --  | $0$ | $2$ |
| $d$ | --  | --  | --  | $0$ |

The order of the passes is what found the long path. When $k = b$, the entry $(a, c)$ became $4$, which is a path through $b$. When $k = c$, that entry was read to improve $(a, d)$ to $6$. If the loop had processed $c$ before $b$, the improvement at $(a, c)$ would not yet have existed when $c$ was used, and $a \to b \to c \to d$ would have been missed. This is the failure that the [common mistakes](#common-mistakes) section turns into a concrete counterexample.

## Correctness proof

::: math theorem Theorem
Assume the graph has no negative cycle. When the algorithm terminates, `distance[i][j]` equals the true distance $\delta(i, j)$ for every pair $i, j$.
:::

::: math proof Proof
The proof is an induction on $k$, the number of vertices that are allowed as intermediates. The claim is that after the pass for $k$, the matrix entry at $(i, j)$ equals $D^{(k)}_{ij}$.

The base case is $k = 0$, which is the initialization. It allows no internal vertices, so it holds the empty path from $i$ to $i$ and the cheapest direct edge from $i$ to $j$, which is exactly the definition of a $0$-path.

For the inductive step, assume the claim for $k - 1$ and consider the pass for $k$. Let $P$ be a shortest $k$-path from $i$ to $j$. If $P$ does not pass through $k$ internally, then it is a $(k-1)$-path, and its length is $D^{(k-1)}_{ij}$, which is already in the cell. If $P$ does pass through $k$, split it at the first occurrence of $k$: the prefix from $i$ to $k$ and the suffix from $k$ to $j$ have only vertices of $\{1, \ldots, k-1\}$ as internal vertices. By the induction hypothesis their lengths are in `distance[i][k]` and `distance[k][j]`, so the candidate sum is at most the length of $P$. The pass takes the minimum of the old value and the candidate, so the new value is at most $D^{(k)}_{ij}$. It cannot be smaller, because every candidate is the length of an actual walk whose internal vertices lie in $\{1, \ldots, k\}$; if that walk repeats a vertex, removing the cycle between the repetitions gives a $k$-path that is no longer, since the graph has no negative cycle. Hence the entry equals $D^{(k)}_{ij}$.

At $k = n$, every vertex is allowed as an intermediate, so every path is an $n$-path. A shortest path is simple when there is no negative cycle, so its internal vertices are among the $n$ vertices and its length is $D^{(n)}_{ij}$. Therefore the matrix holds the true distances. $\square$
:::

::: math theorem Theorem
The graph has a negative cycle if and only if, after the algorithm terminates, `distance[v][v] < 0` for at least one vertex $v$.
:::

::: math proof Proof
If a vertex $v$ lies on a negative cycle, that cycle is a closed walk from $v$ to $v$ of negative length. By induction on the number of passes, after the pass for $k$ the entry `distance[i][j]` is at most the length of every walk from $i$ to $j$ whose internal vertices lie in $\{1, \ldots, k\}$. The initialization covers the direct edges. For the inductive step, split such a walk at its last occurrence of $k$: both parts then have internal vertices in $\{1, \ldots, k-1\}$, so the induction hypothesis bounds their lengths, and the pass can only lower the entries it reads. So the final entry at $(v, v)$ is at most the cycle length and is negative. If $v$ does not lie on a negative cycle but can reach one and be reached from it, the same argument applies to the round trip, so the diagonal entry at $v$ is also negative.

Conversely, if `distance[v][v] < 0` at the end, the algorithm has found a walk from $v$ to $v$ of negative length, because every value it writes is the length of a walk: the initial values are edges or the empty path, and each update concatenates two walks. A walk from a vertex to itself contains a cycle, and if the whole walk is negative then at least one of its cycles has negative weight. So the graph contains a negative cycle. $\square$
:::

::: math theorem Theorem
The algorithm terminates after exactly $n$ passes of the outer loop and at most $n^3$ iterations of the innermost loop, whatever the weights are.
:::

::: math proof Proof
Each of the three loops has exactly $n$ iterations; the guards skip work inside the loops but do not change their bounds. The loops contain no early exit and no data-dependent bound, so the count is fixed. $\square$
:::

The proof shows why the technique is robust and why it is expensive. Nothing about the order of the weights, the density of the graph, or the location of the negative edges changes the running time. The only thing that can go wrong is a negative cycle, and that is detected rather than silently producing wrong finite answers.

## Complexity analysis

**Time: $O(V^3)$.** The outer loop runs $V$ times, and each pass runs the pair loop $V^2$ times, so the bounds give at most $V^3$ iterations of the innermost statement. The two guards skip work when an entry is infinity, which helps on sparse graphs but does not change the worst case. There is no logarithmic factor, no heap, and no dependence on the number of edges.

**Auxiliary space: $O(V^2)$.** The distance matrix has $V^2$ entries. The algorithm needs no other array: the row and the column of the current intermediate are read directly from the matrix. If the paths themselves are wanted, a second $V^2$ matrix of next vertices is needed, which is still $O(V^2)$.

The constant factor is small and predictable, which is why the cubic bound is practical up to a few hundred vertices. A modern machine performs on the order of $10^8$ to $10^9$ simple inner iterations per second in C++ or Java, so $n = 500$ costs about $1.25 \cdot 10^8$ iterations and $n = 1\,000$ costs about $10^9$. Python is roughly fifty times slower per iteration, so the same limits are closer to $n = 200$ and $n = 300$.

::: math complexity Complexity
Floyd-Warshall: time $O(V^3)$, auxiliary space $O(V^2)$ for the distance matrix. Running Dijkstra from every vertex instead costs $O(V(V + E) \log V)$ time and $O(V + E)$ space, which is better on sparse graphs with nonnegative weights.
:::

Three practical warnings belong here.

First, the entries must be stored in a type that can hold a sum of two distances. With weights up to $10^9$ and a path of up to $V - 1$ edges, a distance can reach $4 \cdot 10^{14}$ for $V = 400$, which overflows a 32-bit integer. The 64-bit languages use a signed 64-bit type. Python uses arbitrary-precision integers, and JavaScript and the Pascal toolchain use JavaScript numbers, so a distance beyond $2^{53}$ loses precision in those two; the Pascal program keeps its sentinel below that boundary.

Second, the sentinel for infinity must be far enough away that no real distance reaches it, and the addition must be guarded so that two sentinels are never added. The C, C++ and Java reference programs use $4 \cdot 10^{18}$, the Pascal program uses $4 \cdot 10^{15}$ because of the precision limit above, and all of them skip the sum whenever either operand is the sentinel.

Third, the cubic loop is friendly to the cache when the matrix is stored as a flat array or as a vector of rows, because the inner loop walks along a row. A matrix stored as an array of columns would be much slower for no gain in clarity.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Distances between every pair, $V$ small | Floyd-Warshall |
| Distances from one source, weights nonnegative | [Dijkstra's algorithm](/algorithms/graphs/dijkstra) |
| Distances from one source, weights may be negative | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Distances from every source, weights nonnegative, graph sparse | Dijkstra from every vertex |
| Distances from every source, weights may be negative, graph sparse | Johnson's algorithm |
| Only reachability between every pair | The Boolean version of Floyd-Warshall, or [strongly connected components](/algorithms/graphs/strongly-connected-components) |
| Unweighted graph, one source | [Breadth-first search](/algorithms/graphs/bfs) |
| Unweighted graph, every pair | Breadth-first search from every vertex |
| A negative cycle must be found | Floyd-Warshall, or Bellman-Ford from a super-source |
| The graph is a tree | Two traversals, or [lowest common ancestor](/algorithms/trees/lca) queries |

The all-pairs algorithms differ in two dimensions: the weight assumption and the density they are good for. The table below puts them side by side.

|  | Floyd-Warshall | Dijkstra from every vertex | Johnson | Bellman-Ford from every vertex |
| --- | --- | --- | --- | --- |
| Weight assumption | Any, no negative cycle | Nonnegative | Any, no negative cycle | Any, no negative cycle |
| Time | $O(V^3)$ | $O(V(V + E) \log V)$ | $O(VE \log V)$ | $O(V^2 E)$ |
| Space | $O(V^2)$ | $O(V + E)$ | $O(V^2)$ | $O(V)$ |
| Negative cycle | Detected on the diagonal | Not detected | Detected by the reweighting step | Detected |
| Best fit | Dense small graphs | Sparse nonnegative graphs | Sparse graphs with negative edges | Small graphs, as a baseline |

The space column counts the working state of each algorithm. A problem that returns every pair also needs an $O(V^2)$ table of answers, whichever method fills it.

Bellman-Ford from every vertex is the simplest correct method and the slowest. Johnson reweights the graph with one Bellman-Ford run and then runs Dijkstra from every vertex, which is the right answer for a sparse graph with negative edges. Dijkstra from every vertex is the right answer for a sparse graph with nonnegative edges. Floyd-Warshall is the right answer when the graph is dense or when the matrix is wanted anyway, because its inner loop is so small that the asymptotic loss to Dijkstra is often a constant-factor win on dense inputs.

## Reference implementations

The manifest publishes six `program` variants, one in each of C, C++17, Java, Python, Pascal and JavaScript. They share one contract:

- The input is `n m`, followed by `m` lines `u v w` describing a directed edge from `u` to `v` of weight `w`, with vertices numbered from zero. The input ends after the edges; there is no source vertex.
- The output is `n` lines of `n` integers. The number in row `i`, column `j` is the shortest distance from `i` to `j`, and `-1` when `j` is unreachable from `i`.
- If the graph contains a negative cycle, the output is the single line `negative cycle`, because the true distances are then unbounded below.

All six programs initialize the diagonal to zero, keep the cheaper of two parallel edges, run the outer loop over the intermediate vertex, guard the sum against the sentinel, check the diagonal for a negative value, and print the same matrix. The output is byte-identical across the six languages. The C and C++ versions put standard output in binary mode on Windows so that the line feed stays a single byte; the other four write the byte directly.

The implementations store the matrix as a flat array in C, Java, Pascal and JavaScript, and as a vector of rows in C++ and Python. The flat layout keeps the row arithmetic explicit and makes the cache behavior of the inner loop obvious. The C++ version uses a reference to the current row so that the inner loop does not recompute the row index.

Two language notes are worth recording. The Java version reads tokens with a hand-written scanner rather than `java.util.Scanner`, because the matrix output is quadratic and the input side must not dominate. The Pascal version is compiled by the repository's Pascal-to-JavaScript toolchain, where `Int64` is represented by a JavaScript number; its sentinel is therefore kept below $2^{53}$, so every distance below the sentinel is exact.

## Recursion decision

Floyd-Warshall is iterative. The recurrence is naturally recursive, but the recursion would carry three indices and would recompute the same state unless it were memoized.

A memoized version stores $D^{(k)}_{ij}$ for every triple $(k, i, j)$, which is $V^3$ states and therefore $O(V^3)$ memory, worse than the iterative version's $O(V^2)$. A naive recursive version without memoization takes exponential time, because each state branches into two smaller states.

The recursive formulation is still useful as a mental model: define `solve(k, i, j)` as the shortest $k$-path from $i$ to $j$, and the two branches are "do not use $k$" and "use $k$". The iterative algorithm is that recursion with the $k$ dimension rolled up into the matrix, which is exactly the space optimization that makes the method practical.

The recursion depth would be $V$ in the worst case. The language limits are the usual ones.

| Language   | Default stack              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the loops  |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the loops  |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the loops  |
| Pascal     | The operating system stack | Depends on the platform | Use the loops  |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the loops  |

The recommendation is the same in every language: use the loops. There is no state to unwind and no early exit to design around, and the iterative version is both shorter and faster.

## Implementation walkthrough

Four short pieces carry the whole implementation.

The initialization writes the base case:

```cpp
for (int i = 0; i < n; ++i) {
    distance[i][i] = 0;
}
for (each edge (u, v, w)) {
    distance[u][v] = std::min(distance[u][v], w);
}
```

The diagonal is set to zero before the edges are read; with the minimum in the edge loop, a positive self-loop cannot replace it. The edge loop takes a minimum rather than an assignment, because a later parallel edge may be more expensive than an earlier one.

The triple loop is the algorithm:

```cpp
for (int k = 0; k < n; ++k) {
    for (int i = 0; i < n; ++i) {
        const long long through = distance[i][k];
        if (through == kInfinity) continue;
        for (int j = 0; j < n; ++j) {
            const long long rest = distance[k][j];
            if (rest == kInfinity) continue;
            distance[i][j] = std::min(distance[i][j], through + rest);
        }
    }
}
```

The outer loop over `k` is not negotiable. The two inner loops may be exchanged, and exchanging them can matter for the cache but never for the answer.

The negative cycle check runs after the loops:

```cpp
for (int v = 0; v < n; ++v) {
    if (distance[v][v] < 0) {
        // The graph has a negative cycle; the distances are unbounded below.
    }
}
```

Checking only `distance[0][0]` is not enough: a negative cycle may sit in a part of the graph that vertex zero cannot reach. Checking the whole diagonal is what makes the detection complete.

The output maps the sentinel to the contract's marker:

```cpp
const long long value = distance[i][j];
std::cout << (value == kInfinity ? -1 : value);
```

That mapping is the only place the sentinel is allowed to leak into the answer. Keeping it in one place makes it easy to change the sentinel or the marker.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Putting the intermediate loop innermost | Paths that need two intermediates are missed | Keep `k` as the outer loop |
| Forgetting the diagonal zeros | Every path that starts at a vertex loses its empty prefix, and the negative cycle check is unreliable | Set `distance[i][i] = 0` before the edges |
| Overwriting a parallel edge instead of taking the minimum | A cheap edge is replaced by a later, expensive one | Compare before writing |
| Using a sentinel and adding to it | The sum overflows and a negative number looks like a short path | Skip the sum when either operand is the sentinel |
| Using 32-bit distances | A long path wraps around and becomes negative | Use 64-bit integers |
| Checking one diagonal entry for a negative cycle | A cycle in another component is missed | Check every diagonal entry |
| Treating an undirected edge as one directed edge | Routes are missing in one direction | Write both directions |
| Running Floyd-Warshall on $n = 10^5$ | The program does not finish | Check the constraint before choosing the technique |
| Mapping infinity to a real distance | Unreachable pairs print a huge number or a negative one | Map the sentinel to the contract's marker |
| Reconstructing paths from a second matrix but forgetting to update it | The distance is right and the path is wrong | Update the next matrix in the same place the distance is improved |

### Why this fails: the i-j-k loop order

The mistake that survives review most often is the loop order. The recurrence is symmetric in the sense that the update compares $(i, j)$ with $(i, k) + (k, j)$, so it is tempting to write the loops as `for i, for j, for k`. That order is wrong, and it is wrong on small graphs.

Take four vertices $0, 1, 2, 3$ and these five directed edges:

| Edge      | Weight |
| --------- | ------ |
| $0 \to 2$ | $-1$   |
| $1 \to 2$ | $-2$   |
| $2 \to 3$ | $3$    |
| $3 \to 1$ | $3$    |
| $3 \to 2$ | $0$    |

There is no negative cycle: the simple cycles are $1 \to 2 \to 3 \to 1$ with total weight $-2 + 3 + 3 = 4$ and $2 \to 3 \to 2$ with total weight $3 + 0 = 3$.

The true distance from $0$ to $1$ is $0 \to 2 \to 3 \to 1$, of length $-1 + 3 + 3 = 5$. The correct algorithm finds it when the outer loop reaches vertex $3$: the entry $(0, 3)$ is already $2$, the entry $(3, 1)$ is $3$, and their sum is $5$.

Now run the wrong order. For $i = 0$ and $j = 1$, the inner loop over $k$ needs the entry $(0, 3)$, because that is the only way to reach $1$. But the entry $(0, 3)$ is computed when $j = 3$, which the outer loop visits after $j = 1$. At the moment $j = 1$ is processed, $(0, 3)$ is still infinity, so the candidate is infinity and the cell $(0, 1)$ is never improved. The final matrix reports that $0$ cannot reach $1$, when the true distance is $5$.

The failure is a data dependency on the order of the inner index. The `k` loop has to be outermost because a pass for $k$ assumes that every improvement through vertices smaller than $k$ has already been made. Putting $k$ innermost interleaves the passes, and an entry that a later pass would have supplied is read before it exists.

The fix is not a patch. Move `k` to the outside and leave the two inner loops in either order.

## Variants and extensions

- **Transitive closure.** Replace the minimum and the sum by logical OR and AND. The same triple loop then answers reachability instead of distance, and the diagonal zeros become reflexive edges. This is Warshall's original algorithm.
- **Path counting.** Replace the minimum by a sum and the addition by a multiplication. The matrix then counts the walks between every pair, which is the same recurrence over a different semiring.
- **Reconstruction.** Keep a matrix `next[i][j]`, initialized to `j` for every edge and to a sentinel for unreachable pairs. When the pass through $k$ improves $(i, j)$, set `next[i][j] = next[i][k]`. The route is recovered by following the next entries.
- **Minimax and maximin paths.** For a table of the largest edge on the best route (the bottleneck), replace the sum by a maximum and keep the outer minimum. For a table of the smallest edge on the best route (the widest route), replace the sum by a minimum and the outer minimum by a maximum. The triple loop is unchanged.
- **Johnson's reweighting.** Run Bellman-Ford once to compute a potential for every vertex, subtract the potentials from the edge weights, and run Dijkstra from every vertex. Johnson's algorithm is the sparse-graph answer when negative weights are present.
- **Exact-length paths.** Replace the minimum over two terms by a min-plus product of the adjacency matrix. Raising the matrix to the $K$-th power by repeated squaring finds the cheapest walk of exactly $K$ edges in $O(V^3 \log K)$.
- **Bitset acceleration.** For the Boolean version, store each row as a bitset. The update for a pair becomes a set union, and the inner loop runs about sixty-four times faster.
- **Two matrices instead of one.** Keep the previous layer and the current layer separate. The code is easier to prove correct, at the cost of doubling the memory and making the loop less cache-friendly.
- **A graph with an implicit edge set.** Floyd-Warshall needs the full matrix, so an implicit graph is a poor fit unless the number of vertices is tiny. Use a single-source algorithm in that case.

## Contest strategy

Under contest pressure, the decision and the implementation are both short, and the mistakes are predictable.

1. Read $n$ before anything else. If $n$ is at most about $500$ and the problem asks for many pairs, Floyd-Warshall is in play. If $n$ is $10^5$, it is not.
2. Count the queries. If there are many and the graph is static, precompute the table once. If there is one query, a single-source algorithm is better.
3. Read the sign of the weights. Negative weights with no negative cycle point at Floyd-Warshall or Bellman-Ford, not Dijkstra.
4. Decide the sentinel and the type before writing the loop. Use a 64-bit type, and guard the addition.
5. Write the `k` loop on the outside. Write the initialization in the order diagonal, edges, and take the minimum for parallel edges.
6. Check the whole diagonal for a negative value and decide what the problem wants in that case. Some statements guarantee that no negative cycle exists; then the check is a debug assertion rather than part of the answer.
7. Test on a graph with a cheaper two-edge route, a graph with a negative edge but no negative cycle, and a graph with a negative cycle. The three fixtures of this technique are exactly those cases.
8. If the problem also asks for the routes, keep the next matrix and test it on a case where the shortest path changes intermediate several times. A correct distance with a wrong route is a common way to lose points.

## Worked problems

### Problem 1: Vacation Planning

**Restatement.** Air Bovinia operates $N$ farms and $M$ one-way flights, each with a fare. Exactly $K$ farms are hubs, and every flight either leaves a hub or arrives at one. Given $Q$ ticket requests $(a, b)$, report how many of them are possible and the sum of the cheapest fare for each possible request. Constraints: $1 \le N \le 20\,000$, $1 \le K \le 200$, and $1 \le M \le 20\,000$.

**Naive baseline.** Run Floyd-Warshall on all $N$ farms. That is $8 \cdot 10^{12}$ operations at the maximum constraints, which is far too slow.

**Insight.** The flight restriction is the lever. Every route that uses a flight must pass through a hub, so the cheapest route from $a$ to $b$ can be written as $\min_h \left(\delta(a, h) + \delta(h, b)\right)$ over the hubs $h$. Only distances to and from hubs are needed.

**Derivation.** Compute the all-pairs distances among the $K$ hubs, either with Floyd-Warshall on the $K$ by $K$ hub table or with a Dijkstra run from each hub. Compute the distance from each farm to every hub, and from every hub to each farm, with the same runs on the graph and on the reversed graph. Then answer each request by scanning the $K$ hubs and taking the minimum. The count is the number of requests whose minimum is finite, and the total is the sum of those minima in a 64-bit integer.

**Correctness.** Every route from $a$ to $b$ either is a single flight or contains a hub as an intermediate vertex, because every flight touches a hub. Splitting the route at the first hub gives a prefix from $a$ to that hub and a suffix from the hub to $b$, and both are shortest paths in their own right. So the minimum over hubs is the true distance.

**Complexity.** $O(K^3 + K(N + M) \log N + QK)$ time with Floyd-Warshall for the hub table, and $O(KN)$ space for the distances to and from the hubs. At the maximum constraints the $K$ Dijkstra runs dominate, at a few hundred million operations, and each request costs one scan of the hubs.

**Common wrong approach.** Running Floyd-Warshall on all $N$ farms, which is correct and far too slow, or storing the total in a 32-bit integer, which overflows because $Q$ fares can each be large.

### Problem 2: Bessie's Birthday Buffet

**Restatement.** A field has $N$ patches of grass, each with a distinct quality, and each patch is connected to at most ten neighbors. Walking to an adjacent patch costs $E$ units of energy. Bessie starts at any patch, gains the quality of a patch when she eats there, and refuses to eat grass of a quality at or below the best quality she has already eaten. Report the maximum energy she can accumulate. Constraints: $1 \le N \le 1\,000$ and $1 \le E \le 10^6$.

**Naive baseline.** A search over the order in which the patches are eaten. The number of orders is exponential, and even a dynamic program over subsets is impossible at $N = 1\,000$.

**Insight.** Once the order of eaten qualities is fixed, the cost of moving between two eaten patches is the shortest distance between them. Because every move costs the same $E$, that distance is $E$ times the number of edges on a shortest route, which a breadth-first search from each patch computes.

**Derivation.** Fill an all-pairs table $d(u, v)$ by running a breadth-first search from every patch. Sort the patches by quality. Process them from the highest quality down, and let `best[u]` be the maximum energy of a route that **starts** by eating at $u$. After eating at $u$, Bessie either stops, or walks to a patch $v$ of higher quality and continues with the route counted by `best[v]`. So `best[u]` is the quality of $u$, or the quality of $u$ plus `best[v]` minus $E$ times the distance from $u$ to $v$, over every patch $v$ of higher quality. The answer is the largest `best[u]`.

**Correctness.** A route is a sequence of eaten patches of strictly increasing quality, separated by walks that do not eat. Replacing each walk by a shortest walk between its endpoints cannot increase the energy spent, so an optimal route exists whose movement cost is the all-pairs distance. Processing the qualities from high to low means every patch $v$ that can follow $u$ has already been processed, so `best[v]` is final when `best[u]` is computed. The dynamic program therefore considers every possible next patch after $u$, and the maximum over $u$ is the answer.

**Complexity.** $O(N(N + M))$ time for the $N$ breadth-first searches, where $M \le 5N$ is the number of paths, plus $O(N^2)$ for the dynamic program, and $O(N^2)$ space for the table. At $N = 1\,000$ that is about $10^7$ operations.

**Common wrong approach.** Using the direct edge between two patches instead of the shortest route through other patches. The sample itself needs the route through patch 5 to reach patch 3, so the direct-edge version is wrong on the sample.

### Problem 3: Redistributing Gifts

**Restatement.** There are $N$ cows and $N$ gifts, and cow $i$ initially holds gift $i$. Each cow has a complete preference list of the gifts. The cows may reassign the gifts so that every cow receives either her original gift or a gift she prefers to it. For each cow, report the most preferred gift she could receive in some valid reassignment. Constraints: $1 \le N \le 500$.

**Naive baseline.** Enumerate every permutation of the gifts and check whether it is valid. There are $N!$ permutations, which is impossible even for $N = 10$.

**Insight.** Build a directed graph on the cows with an edge $i \to j$ when cow $i$ is willing to receive gift $j$, that is, when $j = i$ or cow $i$ prefers gift $j$ to gift $i$. A valid reassignment is a partition of the vertices into simple cycles, and cow $i$ can receive gift $j$ exactly when some simple cycle contains the edge $i \to j$.

**Derivation.** Compute the transitive closure of the graph: a pair $(i, j)$ is reachable when there is a path from $i$ to $j$. A gift $j$ is attainable by cow $i$ exactly when $i$ can reach $j$ and $j$ can reach $i$, that is, when the two vertices lie in the same strongly connected component. The answer for cow $i$ is the first gift on her preference list that lies in her component.

**Correctness.** If $i$ and $j$ are in the same strongly connected component, there is a cycle through both, and the cycle can be used as the reassignment on that component while every other cow keeps her gift, so $j$ is attainable. Conversely, a valid reassignment that gives $j$ to $i$ is a permutation whose cycles include one through $i$ and $j$, so the graph has paths in both directions.

**Complexity.** $O(N^3)$ time and $O(N^2)$ space for the Boolean transitive closure with the triple loop, which is $1.25 \cdot 10^8$ operations at $N = 500$. A strongly connected components algorithm is linear and also correct, but the closure is the shortest correct code.

**Common wrong approach.** Using only the direct edges, which ignores the chains of swaps that make a distant gift attainable. Another common error is to compare gift numbers instead of positions in the preference list.

## Practice progression

1. **Recognition.** Given a statement, decide whether it needs all pairs or one source. Check $n$, the number of queries, and the sign of the weights. Write the decision down.
2. **Direct application.** Implement the triple loop over an adjacency matrix, with the diagonal zeros, the parallel-edge minimum, and the sentinel guard. Test it against a brute-force enumeration on graphs with four or five vertices.
3. **Adaptation.** Add the negative cycle check, the `-1` mapping, and the next matrix for path reconstruction. Then run the same code on an undirected graph by writing both directions.
4. **Combination.** Use the distance table inside a dynamic program, as in the buffet problem, or use the reachability table inside a graph problem, as in the gift problem.
5. **Optimization.** Store the matrix as a flat array, skip the unreachable entries, and measure the speedup. Then try the Boolean version with bitsets and compare.
6. **Challenge.** Solve a problem where $n$ is just small enough for the cubic loop but the constant factor matters, such as $n = 800$ in Python or $n = 2\,000$ in C++, and use the measurements to choose the language and the layout.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the recurrence that the algorithm uses, and say exactly which vertices a $k$-path is allowed to use internally. (Key insight, Formal model)
2. Why must the loop over the intermediate vertex be the outermost loop? (Algorithm derivation, Common mistakes)
3. Why is the in-place update safe when there is no negative cycle, and what changes when there is one? (Algorithm derivation)
4. What does the algorithm report for the four-vertex graph of the counterexample under the wrong loop order, and what is the true distance? (Common mistakes)
5. How does the diagonal of the final matrix detect a negative cycle, and why is checking one entry not enough? (Correctness proof)
6. Give the time and space bounds, and say which one changes if paths must be reconstructed. (Complexity analysis)
7. When is running Dijkstra from every vertex better than Floyd-Warshall, and when is Johnson's algorithm better than both? (Algorithm selection)
8. Why can the sentinel not simply be added to itself, and what does the guard look like? (Implementation walkthrough)
9. What is the Boolean version of the algorithm, and which problem in this article uses it? (Variants and extensions, Worked problems)
10. Why is the memoized recursive version worse in space than the iterative version? (Recursion decision)

## Further reading

- The single-source algorithm for nonnegative weights, and the reason it cannot handle a negative edge, is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The single-source algorithm that handles negative weights and detects negative cycles is [Bellman-Ford](/algorithms/graphs/bellman-ford).
- The linear-time special case for unweighted graphs is [breadth-first search](/algorithms/graphs/bfs), and the version for zero-one weights is [0-1 BFS](/algorithms/graphs/0-1-bfs).
- Johnson's algorithm reweights the graph with Bellman-Ford and then runs Dijkstra from every vertex; it is the sparse-graph counterpart of this article's technique.
- The storage choice between an adjacency matrix and an adjacency list is covered in [graph representation](/algorithms/graphs/representation).
- The same triple loop with Boolean values computes reachability, which is the transitive closure discussed under [strongly connected components](/algorithms/graphs/strongly-connected-components).
- Every listing in this article, in all six languages, is collected on the [Floyd-Warshall source page](/implementations/graphs-floyd-warshall/).
