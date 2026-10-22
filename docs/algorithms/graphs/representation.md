---
id: graphs.representation
title: Graph representation
summary: Choose between adjacency lists, adjacency matrices and edge lists, and understand how the choice changes the cost of the algorithms that run on top of it.
division: [silver, gold]
subjects: [graphs]
level: introductory
importance: core-prerequisite
keywords:
    [
        adjacency list,
        adjacency matrix,
        edge list,
        sparse graph,
        dense graph,
        implicit graph,
        grid graph,
        compressed sparse row,
    ]
prerequisites:
    required: [foundations.complexity, start.data-structures]
    recommended: [foundations.sorting, graphs.dsu]
complexity:
    time: "O(V + E) to build"
    space: "O(V + E) for an adjacency list"
assumptions:
    - The graph does not change while the algorithms run, unless the article says otherwise.
reviewed: false
---

## At a glance

Every graph algorithm needs one thing before it can start: a way to ask "who are the neighbors of this vertex?" and "does this edge exist?". The three classic representations answer those two questions with different costs, and the costs propagate upward into every algorithm built on top.

An **adjacency list** stores, for each vertex, the vertices it is joined to. It uses $O(V + E)$ space and answers a neighbor query in $O(\deg(v))$ time. It is the right answer for a sparse graph, which is what almost every contest graph is.

An **adjacency matrix** stores a table with one row and one column per vertex, holding a flag or a weight for every possible edge. It uses $O(V^2)$ space and answers both questions in $O(1)$ time. It is the right answer for a dense graph with few vertices, and it is a memory disaster for a sparse graph with many.

An **edge list** stores only the edges, as pairs. It uses $O(E)$ space, which is the smallest of the three, and it can answer almost no questions on its own: to find the neighbors of a vertex you must scan the entire list.

A **grid** is an implicit graph. The vertices are the cells and the edges are the side-adjacencies, and the graph is never stored at all, because the neighbor function can be computed from the coordinates of a cell in constant time. A grid of $10^6$ cells needs a visited array of $10^6$ booleans and no storage for the graph whatsoever.

The single most important consequence is this: **the representation decides the constant factors of every algorithm that runs on it, and sometimes it decides the exponent.** A breadth-first search on an adjacency list costs $O(V + E)$; on an adjacency matrix it costs $O(V^2)$, because each vertex must scan its whole row whether or not the row is full of edges.

## Problem motivation

A logistics company has $200\,000$ warehouses and $400\,000$ two-way roads. A dispatcher needs to know which warehouses are reachable from one depot, which pairs of warehouses are within two roads of each other, and which roads form a cycle. All three questions are answered by graph algorithms.

The representation is decided before any of them is written, and it is decided by the constraints.

- $V = 200\,000$ warehouses, $E = 400\,000$ roads.
- The average warehouse has degree four, because $2E / V = 4$.
- The memory limit is 256 MB.

Those numbers rule out the adjacency matrix immediately and for good. A matrix with one byte per entry needs $200\,000^2 = 4 \cdot 10^{10}$ bytes, which is 40 GB, one hundred and fifty times over the limit. The adjacency list needs $V + 2E = 10^6$ integers, which is 4 MB.

Notice that the ratio of edges to vertices is the thing that matters, and not the number of vertices by itself. The company has four roads per warehouse on average, so the graph is sparse, and a sparse graph and a dense graph want opposite data structures.

## Recognition patterns

The representation is chosen from the shape of the graph, not from preference. The signals are:

- **The ratio $E / V$.** A graph with $E$ of the order of $V$ is sparse and wants an adjacency list. A graph with $E$ of the order of $V^2$ is dense and may want a matrix.
- **The value of $V$ against the memory limit.** This is the strongest constraint, because $V^2$ grows so fast. At $V = 200\,000$ a byte-per-entry matrix is 40 GB.
- **The questions that will be asked.** Edge-existence tests favor a matrix; neighbor enumeration favors a list; sorting, serializing or streaming the edges favors an edge list.
- **Whether the graph is implicit.** A grid or a maze has a neighbor function, so it needs no stored graph at all.
- **Whether the graph changes.** A matrix that must be updated costs $O(1)$ per edge insertion; a list costs $O(1)$ per insertion as well, but a list of lists costs $O(\deg(v))$ per deletion because the element has to be found.

The constraint table below is worth keeping, because it turns the decision into arithmetic.

| Situation | $V$ | $E$ | Use |
| --- | --- | --- | --- |
| Road network, social network, dependency graph | $10^5$ to $10^6$ | $O(V)$ | Adjacency list |
| Small dense graph, bitset or boolean tests | $\le 2000$ | $O(V^2)$ | Adjacency matrix |
| Grid or maze | $10^6$ cells | implicit | Implicit graph, no storage |
| Edge set to be sorted, deduplicated or written out | any | $O(E)$ | Edge list |
| Graph built once and then queried many times | any | any | Compacted adjacency list |

## Naive approach

The baseline is the adjacency matrix, because it is the easiest to write down and the easiest to reason about.

```python
matrix = [[0] * n for _ in range(n)]

def add_edge(u, v, weight=1):
    matrix[u][v] = weight
    matrix[v][u] = weight          # only for an undirected graph
```

Three lines, and every question is answered in constant time. The problem is what the allocation itself costs, and on a large graph that cost is fatal.

The second baseline is the edge list, which is the smallest representation and the least useful one.

```python
edges = []

def add_edge(u, v, weight=1):
    edges.append((u, v, weight))
```

This is the natural output of reading the input, and it is a perfectly good intermediate form. The trouble starts when an algorithm needs the neighbors of one vertex.

The third baseline is a boolean array per vertex, which is an adjacency list with the neighbor information thrown away.

```python
neighbors = [[False] * n for _ in range(n)]
```

This is the worst of both worlds: it takes $O(V^2)$ space like a matrix, and it cannot enumerate neighbors without scanning a whole row.

## Key insight

The insight is that the right question is not "which representation is fastest in general" but "which question does the algorithm ask most often, and how expensive is that question in each representation".

A graph algorithm almost always wants to do one of three things: enumerate the neighbors of a vertex, ask whether a particular edge exists, or visit every edge once. The cost of each depends on the representation, and the costs are not comparable.

| Operation | Adjacency list | Adjacency matrix | Edge list |
| --- | --- | --- | --- |
| Space | $O(V + E)$ | $O(V^2)$ | $O(E)$ |
| Edge exists | $O(\deg(u))$ | $O(1)$ | $O(E)$ |
| Neighbors of $v$ | $O(\deg(v))$ | $O(V)$ | $O(E)$ |
| Visit every edge | $O(V + E)$ | $O(V^2)$ | $O(E)$ |
| Insert an edge | $O(1)$ amortized | $O(1)$ | $O(1)$ amortized |
| Delete an edge | $O(\deg(u))$ | $O(1)$ | $O(E)$ |
| Degree of $v$ | $O(1)$ with a counter, else $O(\deg(v))$ | $O(V)$ | $O(E)$ |

The pattern is clear. A list is fastest exactly where the graph is sparse, because $\deg(v)$ is small. A matrix is fastest exactly where the graph is dense, because the row scan is short compared to the table it is stored in. An edge list is only competitive for bulk operations over the whole edge set.

The second half of the insight is that the choice propagates. A breadth-first search does one thing: for each vertex it pops, it enumerates the neighbors. With a list that is $O(V + E)$ in total. With a matrix, each of the $V$ pops scans a row of length $V$, so the total is $O(V^2)$. The traversal did not change; the representation multiplied the cost by a factor of $V/E$.

## Visual intuition

The clearest picture is the same six-vertex graph stored three ways, with edges $0\!-\!1$, $0\!-\!2$, $1\!-\!3$, $2\!-\!3$, $3\!-\!4$.

**Adjacency list.** Three rows of boxes, one row per vertex, each holding the neighbors of that vertex:

```text
0: 1 2
1: 0 3
2: 0 3
3: 1 2 4
4: 3
5:
```

The picture is uneven: vertex 3 has a long row and vertex 5 has none. That unevenness is the sparsity made visible, and it is exactly why the list costs $O(V + E)$ instead of $O(V^2)$.

**Adjacency matrix.** A square of flags, with a 1 wherever there is an edge:

```text
      0  1  2  3  4  5
  0 [ 0  1  1  0  0  0 ]
  1 [ 1  0  0  1  0  0 ]
  2 [ 1  0  0  1  0  0 ]
  3 [ 0  1  1  0  1  0 ]
  4 [ 0  0  0  1  0  0 ]
  5 [ 0  0  0  0  0  0 ]
```

The picture is a square, and most of it is zeros. On this graph the matrix uses 36 cells to store 5 edges. On a graph with a million vertices it would use $10^{12}$ cells to store a few million edges.

**Edge list.** A flat list of pairs, with no index by vertex at all:

```text
(0,1) (0,2) (1,3) (2,3) (3,4)
```

The picture is short, and it is useless for the question "who are the neighbors of 3?". The answer requires reading all five pairs.

**The implicit grid.** A grid of cells with no storage at all. The neighbors of the cell in row $r$ and column $c$ are the four cells at $(r-1, c)$, $(r+1, c)$, $(r, c-1)$ and $(r, c+1)$, subject to the borders. The graph is the coordinate system, and the neighbor function is four comparisons.

## Formal model

Let $G = (V, E)$ be a graph with $V = \{v_1, \ldots, v_n\}$ and $E \subseteq V \times V$.

<MathPanel type="definition" title="Definition">
The **adjacency matrix** of $G$ is the $n \times n$ matrix $A$ with
$A_{ij} = 1$ when $\{v_i, v_j\} \in E$ and $A_{ij} = 0$ otherwise, for a
simple undirected graph. A weighted graph replaces the flag with the weight
and a missing edge with a sentinel.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **adjacency list** of $G$ assigns to each vertex $v_i$ the sequence
$L_i = (u_1, u_2, \ldots, u_{d_i})$ of the vertices adjacent to it, where
$d_i$ is the degree of $v_i$. The total length of all the sequences is
$2|E|$ for an undirected graph.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **edge list** of $G$ is a sequence of pairs $(u, v, w)$, one for each
edge, holding the endpoints and optionally the weight. It carries no
information about which vertex a given edge list belongs to, beyond what
the endpoints say.
</MathPanel>

<MathPanel type="definition" title="Definition">
A graph is **sparse** when $E = O(V)$ and **dense** when $E = \Theta(V^2)$.
A graph is **implicit** when the neighbor function of a vertex is
computable in $O(1)$ time from the vertex itself, without storing the
edges.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
For any graph, the sum of the degrees is $2|E|$. Therefore the adjacency
list stores exactly $2|E|$ neighbor entries, and the total length of the
list is $O(V + E)$ however the graph is shaped.
</MathPanel>

The lemma is the formal version of the uneven picture above. It says the list is never much bigger than the graph itself, which is the property the matrix lacks.

<MathPanel type="lemma" title="Lemma">
Let $G$ be a simple undirected graph and let $A$ be its adjacency matrix.
For every $i \ne j$, the entry $A_{ij}$ is $1$ if and only if the edge
$\{v_i, v_j\}$ exists, so an edge-existence test costs $O(1)$ with a
matrix and $O(\deg(v_i))$ with an adjacency list.
</MathPanel>

## Algorithm derivation

The derivation of a representation starts from the operations the algorithm will perform, and the way to do that is to write the operations down first and then ask what each representation can do.

Suppose the algorithm is a breadth-first search. It maintains a queue and a visited array, and for each vertex it pops it enumerates the neighbors of that vertex and visits the ones that are unvisited.

With an adjacency list, the enumeration for vertex $v$ is "walk the list $L_v$", which costs $O(\deg(v))$. Summed over all vertices, the traversal costs

$$
\sum_{v \in V} O(\deg(v)) \;=\; O(2|E|) \;=\; O(E),
$$

plus $O(V)$ for the queue and the visited array, for a total of $O(V + E)$.

With an adjacency matrix, the enumeration for vertex $v$ is "scan row $v$", which costs $O(n)$ whether or not the row has any edges in it. Summed over all vertices, the traversal costs $O(n \cdot n) = O(V^2)$.

The derivation is mechanical once the operations are named, and it is the reason the representation is a prerequisite of the traversal articles rather than a detail buried inside them.

The state of a representation is the storage itself, and there are two shapes worth distinguishing inside the list family.

<MathPanel type="invariant" title="Invariant">
A traversal that enumerates neighbors through an adjacency list visits
each edge exactly twice, once from each endpoint, so the total work of the
traversal is proportional to the number of stored neighbor entries.
</MathPanel>

The **list of lists** stores, for each vertex, a dynamically grown vector of neighbors. It is the easiest to write and the most forgiving, because the growth is automatic.

The **compacted list**, also called the compressed sparse row form, stores all the neighbor entries in one flat array and keeps, for each vertex, the offset where its entries begin and where they end. It is built in two passes: count the degrees, compute the prefix sums of the degrees to get the offsets, and then fill the flat array. It costs one extra array of $n + 1$ offsets and nothing else, and it is the fastest of the three because the neighbors of a vertex are contiguous in memory, which is what the cache wants.

## Step-by-step execution

Take the six-vertex graph with edges $0\!-\!1$, $0\!-\!2$, $1\!-\!3$, $2\!-\!3$, $3\!-\!4$, and build a compacted adjacency list for it.

**Pass one: count the degrees.**

```text
degree[0] = 2   degree[1] = 2   degree[2] = 2
degree[3] = 3   degree[4] = 1   degree[5] = 0
```

**Pass two: compute the offsets.** The start of vertex $v$ is the sum of the degrees of all the vertices before it.

```text
start[0] = 0   start[1] = 2   start[2] = 4
start[3] = 6   start[4] = 9   start[5] = 10
```

The array `start` has $n + 1 = 7$ entries, and the last one is the total number of neighbor entries, which is $2E = 10$.

**Pass three: fill the array.** Each edge $\{u, v\}$ contributes one entry to `u` and one to `v`.

```text
neighbors = [1, 2,  0, 3,  0, 3,  1, 2, 4,  3]
```

The neighbors of vertex 3 are `neighbors[6]` through `neighbors[8]`, which is the slice $[1, 2, 4]$.

Now the traversal. A depth-first search from vertex 0 pops 0, reads the slice `neighbors[0]` through `neighbors[1]`, which is $[1, 2]$, and pushes both. The cost of that step is $O(\deg(0)) = O(2)$, not $O(n) = O(6)$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
For every graph $G$, the three representations describe the same graph:
the adjacency list of a vertex contains exactly the vertices adjacent to
it, the adjacency matrix has a $1$ in exactly the positions of the edges,
and the edge list contains exactly one entry for each edge.
</MathPanel>

<MathPanel type="proof" title="Proof">
Fix an edge $\{u, v\}$ of $G$. When the adjacency list is built, the edge
contributes $u$ to the list of $v$ and $v$ to the list of $u$, and no
other edge contributes either, so $u$ is in the list of $v$ if and only if
$\{u, v\}$ is an edge. When the matrix is built, the edge sets the entry
at the position of $(u, v)$ and the entry at the position of $(v, u)$ to
$1$, and no other edge sets either, so the entry is $1$ if and only if
the edge exists. When the edge list is built, the edge appends one pair,
and the pairs appended are exactly the edges of $G$.

Conversely, an entry in the list of $v$, an entry equal to $1$ in the matrix, and a pair in the edge list are each produced by exactly one edge of $G$, so nothing appears in one representation that is not an edge.

The three representations therefore agree on the edges of $G$. Any algorithm that asks only about edges, neighbors and degrees gives the same answers on all three. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The compacted adjacency list returns the neighbors of every vertex
correctly.

Let `start` be the array of offsets built from the prefix sums of the degrees, so that the entries belonging to vertex $v$ occupy the positions `start[v]` through `start[v + 1] - 1`. The number of those positions is `start[v + 1] - start[v]`, which is the degree of $v$. The fill pass writes one entry into the block of each endpoint of every edge, so the block of $v$ receives exactly one entry for each edge incident to $v$, which is $\deg(v)$ entries, and it receives no entry from any other edge.

The block of $v$ therefore holds exactly the neighbors of $v$. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
A breadth-first search that enumerates neighbors through an adjacency list
runs in $O(V + E)$ time.

Every vertex is enqueued at most once, because a vertex is enqueued only when it is discovered and it is marked at that moment, so the queue operations cost $O(V)$. Each vertex is dequeued at most once, and the neighbors of the dequeued vertex are enumerated once, at a cost of $O(\deg(v))$. The total enumeration cost is $O(\sum_v \deg(v)) = O(2E)$, by the lemma on the sum of the degrees. The total is therefore $O(V + E)$. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The same breadth-first search on an adjacency matrix runs in $O(V^2)$
time.

A dequeue of vertex $v$ scans the whole row of $v$, which is $n$ entries, and the scan is not shortened by the row being mostly zeros. The search dequeues each of the $n$ vertices at most once, so the total scanning cost is $O(n^2)$. $\square$
</MathPanel>

## Complexity analysis

**Adjacency list.** Space is $O(V + E)$, by the lemma on the sum of the degrees. A neighbor enumeration is $O(\deg(v))$, and a full traversal is $O(V + E)$.

**Adjacency matrix.** Space is $O(V^2)$ entries, which is $V^2$ bytes for a boolean matrix and $8V^2$ bytes for a matrix of 64-bit weights. A neighbor enumeration is $O(V)$ and a full traversal is $O(V^2)$. An edge-existence test is $O(1)$.

**Edge list.** Space is $O(E)$. A full scan of the edges is $O(E)$, which is the best of the three, and a neighbor enumeration is $O(E)$, which is the worst.

**Implicit graph.** The graph itself costs $O(1)$ space, because it is not stored. The cost of a traversal is $O(V + E)$ where $E$ is the number of edges of the implicit graph, which for a grid of $RC$ cells with side-adjacency is $4RC$ edges, so the traversal is $O(RC)$. The auxiliary space is the visited array, $O(RC)$ booleans, or $O(RC)$ bits if it is packed.

<MathPanel type="complexity" title="Complexity">
Adjacency list: $O(V + E)$ space, $O(\deg(v))$ per neighbor query.
Adjacency matrix: $O(V^2)$ space, $O(1)$ per edge test, $O(V)$ per
neighbor query. Edge list: $O(E)$ space, $O(E)$ per neighbor query.
Implicit graph: $O(1)$ space for the graph itself.
</MathPanel>

The numbers that decide between them are worth computing before coding. A boolean matrix over $200\,000$ vertices is $4 \cdot 10^{10}$ bytes. A matrix of 64-bit weights over $20\,000$ vertices is $3.2 \cdot 10^9$ bytes. An adjacency list over $200\,000$ vertices and $400\,000$ edges is $10^6$ integers, or $4$ MB.

## Algorithm selection

| The algorithm asks for | Use | Why |
| --- | --- | --- |
| The neighbors of a vertex, many times | Adjacency list | $O(\deg(v))$ beats $O(V)$ |
| Whether one specific edge exists, many times, and $V$ is small | Adjacency matrix | $O(1)$ beats $O(\deg(v))$ |
| A dense graph with $V \le 2000$ | Adjacency matrix | The matrix fits, and the tests are constant time |
| A bipartite reachability test with many edge tests | Adjacency matrix, or a set per side | Edge existence dominates the running time |
| To sort, deduplicate or output the edges | Edge list | $O(E \log E)$ beats $O(V + E)$ |
| A grid, a maze, a board | Implicit graph | No storage for the graph at all |
| Every edge, in a fixed order | Edge list | $O(E)$ beats $O(V + E)$ |
| A traversal on a large sparse graph | Adjacency list | $O(V + E)$ beats $O(V^2)$ |
| Dijkstra with a priority queue | Adjacency list | $O((V + E) \log V)$ beats $O(V^2)$ |

The last row is worth spelling out. Dijkstra's algorithm on an adjacency matrix is the classic $O(V^2)$ implementation, in which the "priority queue" is a linear scan for the closest unvisited vertex. On an adjacency list with a binary heap it is $O((V + E) \log V)$. The heap is not the difference; the representation is.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Building an adjacency matrix because the graph has few edges | The matrix is $V^2$ regardless of how few edges there are | Decide on the ratio $E/V$, not on $E$ |
| Using a matrix of weights with $0$ for a missing edge | A real edge of weight zero is indistinguishable from no edge | Use a sentinel, or a separate presence bit |
| Iterating the whole row of a matrix when the graph is sparse | The traversal becomes $O(V^2)$ | Use a list |
| Scanning an edge list to find the neighbors of a vertex | Every neighbor query costs $O(E)$ | Build a list first |
| Forgetting the reverse direction in a directed graph | The traversal only follows the edges the way they point | Build a reverse list when the algorithm needs it |
| Assuming a grid needs no memory at all | The visited array is $O(V)$ and is forgotten | Budget for the visited array |
| Mixing up the row and the column of the matrix | The graph is silently transposed | Test a single edge before trusting the traversal |
| Using a 64-bit weight matrix without checking the memory | $8V^2$ bytes is a hundred times worse than a boolean matrix | Compute $8V^2$ against the limit before writing the code |

### Why this fails: the matrix that runs out of memory

The mistake that survives review most often is choosing the matrix because the algorithm asks a constant-time question. It is a reasonable-sounding reason, and the matrix does answer that one question perfectly.

The counterexample is a road network with $V = 20\,000$ junctions and $E = 40\,000$ roads, which is a perfectly ordinary sparse graph. The algorithm is a depth-first search from one junction, and the only question it ever asks is "who are the neighbors of this junction?".

The matrix version allocates $20\,000^2 = 4 \cdot 10^8$ entries. At one byte per entry that is 400 MB, which is more than a 256 MB limit, and the program is rejected by the memory checker before it runs a single line. With 64-bit weights it would be 3.2 GB.

The adjacency list version allocates $V + 2E = 100\,000$ integers, which is 400 KB, and the traversal visits every junction in a few milliseconds.

The point is not that the matrix is wrong. The point is that the matrix's cost does not depend on the number of edges, and the number of edges is the quantity that makes the graph interesting. A representation whose cost ignores the shape of the data is a bet that the shape will not matter, and the shape is exactly what the constraints tell you.

The generalizes into a rule: **choose the representation that costs what the data actually is.** A sparse graph should cost $O(V + E)$ to store, and if it does not, the wrong representation has been chosen.

A second failure with the same shape is the edge list. The smallest counterexample is a path on four vertices, $0 - 1 - 2 - 3$. To find the neighbors of vertex 2 with an edge list you scan all three edges; to find the neighbors of every vertex in a traversal you scan all three edges three times, for nine comparisons, against $V + E = 7$ for the list. The difference is small here, but the ratio is $V$ in general, and a traversal of a graph with a million vertices on an edge list costs a billion comparisons instead of a few million.

## Variants and extensions

- **The reverse adjacency list.** A second list holding, for each vertex, the vertices that point at it. It costs another $O(V + E)$ and it is what makes the in-degree computation of a topological sort $O(V + E)$ instead of $O(V + E)$ per vertex, and it is what the transitive closure of a directed graph needs.
- **The set per vertex.** A list of hash sets gives $O(1)$ edge-existence tests and $O(\deg(v))$ neighbor enumeration, at the cost of a large constant and a much larger memory footprint. On a graph with many edge-existence tests and a moderate number of vertices it beats both the list and the matrix.
- **The bitset matrix.** When the weights are not needed, one bit per entry replaces one byte, and the matrix of $V = 100\,000$ vertices costs 1.25 GB instead of 10 GB. It is still too large for most limits, and the words make the neighbor scan faster but not shorter.
- **The compacted list with sorted neighbors.** Sorting each neighbor list turns the "is $u$ a neighbor of $v$" test into a binary search over $O(\deg(v))$ entries, and it lets the list answer "is this edge present" in $O(\log \deg(v))$ with no extra memory. The sorting costs $O(E \log E)$ once.
- **The edge list with a hash index.** A hash map from a vertex to the indices of the edges that touch it turns the edge list into a list in $O(V + E)$ time to build, and it is the way to keep the edges in a canonical order while still answering neighbor queries.
- **The implicit graph as a first-class representation.** Whenever the neighbor function of a vertex is computable in $O(1)$, do not store the graph. Grids, mazes, chessboards, state spaces and the configuration space of a puzzle are all implicit, and the storage saved is proportional to the number of edges.
- **The graph as a hypergraph or a multigraph.** When an edge joins more than two vertices, or when there are several edges between the same pair, the adjacency list still works: the list of a vertex simply holds one entry per incident edge, and the entries repeat.

## Contest strategy

Under contest pressure, the errors above are what cost points, and the decision itself can be made in under a minute with the following procedure.

1. Compute the ratio $E / V$. If it is small, use an adjacency list and stop thinking about it.
2. Compute $V^2$ and compare it with the memory limit. If it does not fit with room to spare, the matrix is out, whatever the algorithm asks for.
3. Write down the operations the algorithm performs, and check each one against the table above. If edge-existence tests dominate and $V$ is small, consider a matrix or a set per vertex.
4. Build the graph in two passes when it is large: count the degrees, compute the offsets, then fill a flat array. This is the compacted form and it is both faster and smaller than a list of lists.
5. Remember the reverse list if the graph is directed and the algorithm needs the in-degrees.
6. For a grid, do not build a graph at all. Write the neighbor function, and budget the visited array separately.

## Worked problems

### Problem 1: the reachable warehouses

**Restatement.** An undirected graph has $n = 200\,000$ junctions and $m = 400\,000$ roads. Report the number of junctions reachable from junction 1. Constraints: 256 MB of memory.

**Naive baseline.** A matrix with one byte per entry needs $4 \cdot 10^{10}$ bytes, which does not fit. A list fits in 4 MB.

**Insight.** A sparse graph must be stored in $O(V + E)$ space, so the traversal can afford to visit every edge.

**Derivation.** Build the adjacency list, run the iterative depth-first search from junction 1, and count the marked vertices.

**Correctness.** The traversal argument in the correctness proof shows that the marked set is exactly the reachable set, and the sum-of-degrees lemma gives the $O(V + E)$ bound.

**Complexity.** $O(V + E)$ time and $O(V + E)$ space.

**Common wrong approach.** Building the matrix because the problem looks like a "graph problem" and then running out of memory. The representation is the whole difficulty in this problem.

### Problem 2: the dense graph of small pieces

**Restatement.** A graph has $n = 1500$ pieces and every pair of pieces is connected by a different weight. Report the weight of the edge between two given pieces, and find the total weight of all edges. Constraints: 256 MB of memory.

**Naive baseline.** An adjacency list of lists stores $n(n-1)$ entries, which is $2.25 \cdot 10^6$ pairs, and it is already affordable. But answering "what is the weight of the edge between $i$ and $j$" means scanning the list of $i$, which is $O(n)$.

**Insight.** When every pair is joined, the graph is dense and a matrix is the natural shape: the answer is one table lookup.

**Derivation.** Allocate a matrix of 64-bit weights, $1500^2 = 2.25 \cdot 10^6$ entries, which is 18 MB. Fill it while reading the edges, in $O(n^2)$ time.

**Correctness.** The matrix holds the weight of every pair by the first theorem, and the traversal over the matrix is unnecessary because the question is a lookup.

**Complexity.** $O(V^2)$ space and $O(V^2)$ to fill the matrix, and $O(1)$ per edge query. The total weight is a single pass over the upper triangle, which is $O(V^2)$.

**Common wrong approach.** Using a list of lists and answering each query by scanning. The program is correct and slow, and the slowness is $O(V)$ per query.

### Problem 3: the maze that is never stored

**Restatement.** A maze has $R$ rows and $C$ columns of cells. Some cells are walls. Count the connected components of open cells, where two cells are joined when they share a side. Constraints: $R, C \le 1000$, so at most $10^6$ cells.

**Naive baseline.** Build the graph explicitly: $10^6$ vertices and up to $2 \cdot 10^6$ edges, in an adjacency list of 12 MB. It fits, but it is 12 MB of memory spent to describe something that four lines of arithmetic already describe.

**Insight.** The grid is an implicit graph. The neighbor function of a cell is four comparisons, so the graph costs nothing to store.

**Derivation.** Keep a visited array of $RC$ booleans. For each cell in row-major order, if it is open and unvisited, count a component and flood-fill it, using the four side-adjacent cells as the neighbors, with the boundary conditions checked on the fly.

**Correctness.** The flood fill marks exactly the cells of one component, by the reachability argument, and the row-major scan starts a new flood fill exactly once per component.

**Complexity.** $O(RC)$ time and $O(RC)$ space for the visited array. The graph costs $O(1)$ space, and the edges are never enumerated, only recomputed.

**Common wrong approach.** Building the adjacency list anyway. The program is correct, and it uses twelve times more memory than it needs, which is the difference between fitting and not fitting on a tight limit.

## Practice progression

1. **Recognition.** Given a graph, compute $E / V$ and $V^2$ against the memory limit, and say which representation the constraints force.
2. **Direct application.** Build a list of lists and a compacted list for the same graph, and verify that they give the same neighbors for every vertex.
3. **Adaptation.** Build a matrix for a small dense graph, a reverse list for a directed graph, and a bitset matrix, and measure the memory of each.
4. **Combination.** Use a set per vertex for a graph with many edge-existence tests, and compare the running time against a matrix on the same instance.
5. **Challenge.** Write a traversal for a grid that uses no graph storage at all, and then write one that uses an explicit list, and compare the two on memory and time.
6. **Transfer.** Decide the representation for a problem you have not seen before by writing down the operations it needs and consulting the table, rather than by guessing.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. What are the space costs of the three representations, and why does only one of them depend on the shape of the graph? (Complexity analysis)
2. Why does a breadth-first search cost $O(V^2)$ on a matrix and $O(V + E)$ on a list? (Correctness proof)
3. What operation does the adjacency matrix answer in constant time that the list answers in $O(\deg(v))$? (Key insight)
4. Give a graph and a memory limit for which the adjacency matrix does not fit and the list fits comfortably. (Common mistakes)
5. Why is a grid an implicit graph, and what does the traversal cost in terms of the number of cells? (Visual intuition)
6. What does the sum-of-degrees lemma say, and which of the proofs uses it? (Formal model)
7. How is a compacted adjacency list built, and why is it faster than a list of lists? (Algorithm derivation)
8. When is an edge list the right structure, and what does it cost per neighbor query? (Algorithm selection)
9. Why does Dijkstra's algorithm cost $O(V^2)$ on a matrix, and what changes on a list? (Algorithm selection)
10. What is the reverse adjacency list for, and which algorithm needs it? (Variants and extensions)
11. How much memory does a 64-bit weight matrix over $20\,000$ vertices cost, compared with the adjacency list for the same graph? (Complexity analysis)
12. Which problem from the worked set would a matrix solve better, and which constraint makes the difference? (Worked problems)

## Further reading

- The traversal that assumes an adjacency list is in [depth-first search](/algorithms/graphs/dfs) and [breadth-first search](/algorithms/graphs/bfs).
- The shortest path algorithm whose representation choice changes the bound is in [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The structure that replaces the adjacency list when the edges are added and removed repeatedly is the [disjoint set union](/algorithms/graphs/dsu), described in the graph article.
- The two-dimensional structure that behaves like an implicit graph with an extra dimension is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The counting technique that turns a traversal into a table walk is in [prefix sums](/algorithms/arrays/prefix-sums).
- The data structures that the graph articles assume are introduced in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
