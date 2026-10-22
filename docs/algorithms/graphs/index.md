---
id: graphs.index
title: The Graphs and shortest paths
summary: Model the problem as vertices and edges, then choose a traversal, a connected-components structure, or a shortest-path algorithm to match the question.
division: []
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [graphs, traversal, shortest path, spanning tree, connected components, adjacency list]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Graphs is the subject of problems whose objects have no fixed position. There is no index to sort by and no natural order, so the only structure available is the set of things and the connections between them.

A graph problem in a contest usually begins as a modeling decision rather than an algorithmic one. The hard part is often deciding what a vertex is: a town, a person, a state, a state of a search, or a time. Every technique in this subject depends on that decision, because the number of vertices and the number of edges are what the complexity bounds are made of.

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Graph representation | $O(V + E)$ to build | $O(V + E)$ for an adjacency list | `foundations.complexity` | [Representation](/algorithms/graphs/representation) |
| Depth-first search | $O(V + E)$ | $O(V + E)$ iterative, $O(V)$ recursive | `graphs.representation` | [Depth-first search](/algorithms/graphs/dfs) |
| Breadth-first search | $O(V + E)$ | $O(V)$ auxiliary, $O(V + E)$ in total | `graphs.representation` | [Breadth-first search](/algorithms/graphs/bfs) |
| Disjoint set union | $O(\alpha(n))$ amortized per operation | $O(n)$ | `foundations.recursion` | [Disjoint set union](/algorithms/graphs/dsu) |
| Dijkstra's algorithm | $O((V + E) \log V)$ | $O(V + E)$ | `graphs.representation` | [Dijkstra](/algorithms/graphs/dijkstra) |
| 0-1 BFS | $O(V + E)$ | $O(V + E)$ | `graphs.bfs` | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Bellman-Ford | $O(VE)$ | $O(V)$ | `graphs.representation` | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Topological sort | $O(V + E)$ | $O(V)$ | `graphs.representation` | [Topological sort](/algorithms/graphs/topological-sort) |
| Minimum spanning tree | $O(E \log E)$ | $O(V + E)$ | `graphs.dsu` | [Minimum spanning tree](/algorithms/graphs/mst) |
| Articulation points | $O(V + E)$ | $O(V)$ | `graphs.dfs` | [Articulation points](/algorithms/graphs/articulation-points) |
| Bridges | $O(V + E)$ | $O(V)$ | `graphs.dfs` | [Bridges](/algorithms/graphs/bridges) |
| Strongly connected components | $O(V + E)$ | $O(V)$ for Tarjan, $O(V + E)$ for Kosaraju | `graphs.dfs` | [Strongly connected components](/algorithms/graphs/strongly-connected-components) |
| Euler tour | $O(V + E)$ | $O(V)$ beyond the adjacency list and the output | `graphs.dfs` | [Euler tour](/algorithms/graphs/euler-tour) |
| Minimum cut | $O(V E^2)$ for Edmonds-Karp, $O(V^2 E)$ for Dinic | $O(V + E)$ | `graphs.representation` | [Minimum cut](/algorithms/graphs/minimum-cut) |
| Bipartite matching | $O(E \sqrt{V})$ | $O(V)$ beyond the adjacency list | `graphs.representation` | [Bipartite matching](/algorithms/graphs/bipartite-matching) |

The first entry is the one to read first. Every traversal, every shortest-path algorithm, and every connected-components structure in this subject starts from the same representation question: an adjacency list, an adjacency matrix, or an implicit neighbor function.

Three of the rows are computed from the same depth-first forest. The articulation points, the bridges, and the strongly connected components all come out of one traversal with a low-link array, and a statement that mentions any two of them wants one search, not two.

Two rows are stated with the algorithm that earns the bound rather than the algorithm that earns the worst case. The matching row is $O(E \sqrt{V})$ for Hopcroft-Karp and $O(VE)$ for the simple augmenting-path search, and the cut row is $O(V E^2)$ for Edmonds-Karp and $O(V^2 E)$ for Dinic in general, with $O(E \sqrt{V})$ on a unit network.

## Recognition signals

- **"towns"**, **"cities"**, **"roads"**, **"flights"**, **"edges"**, **"connections"**, **"friends"**, **"followers"**. The vocabulary of a graph problem is a giveaway, but it is not required: a grid of cells is a graph, a state space is a graph, and a dependency between tasks is a graph.
- **"connected"**, **"reachable"**, **"component"**, **"the same group"**.
- **"fewest"**, **"shortest"**, **"cheapest"**, **"minimum number of steps"**. These separate the three shortest-path algorithms from each other, and the difference is in the weights, not in the shape.
- **"each item depends on"**, **"must be done before"**, **"prerequisites"**. A partial order is a directed acyclic graph.
- **"connect everything"**, **"as cheaply as possible"**, **"a tree that spans"**. The spanning tree is not the same object as a shortest-path tree, and confusing them is a common error.
- **"merge"**, **"union"**, **"are they in the same set"**, **"group the items"**. The disjoint set union answers connectivity online, in almost constant time, without any traversal.
- **"if this road is closed"**, **"which stations are critical"**, **"what breaks if this one fails"**. That is a bridge or an articulation point, and the answer comes out of the same low-link computation.
- **"mutually reachable"**, **"can every one of these reach every other"**. That is a strongly connected component, and the component is a vertex in the condensed graph.
- **"use every road exactly once"**, **"find a route that traverses every edge"**. That is an Euler tour, and the existence condition is a parity condition on the degrees rather than a search.
- **"how much can flow through"**, **"the weakest link"**, **"split the graph into two parts"**. That is a minimum cut, and it is the answer to a surprising number of problems that do not mention flow at all.
- **"assign"**, **"pair up"**, **"seat every student"**, **"match the workers to the jobs"**. That is bipartite matching, and the partition into the two sides is usually given.

The signal that rules the subject out is a statement where the objects have a fixed order that matters, such as a sequence or a range. Those are [arrays](/algorithms/arrays/) or [searching](/algorithms/searching/), not graphs.

## Choosing a technique

| The question | What to use |
| --- | --- |
| Which vertices are reachable from $s$ | [Depth-first search](/algorithms/graphs/dfs) or [breadth-first search](/algorithms/graphs/bfs) |
| How many connected components | A traversal from every unvisited vertex |
| Does this undirected graph contain a cycle | Depth-first search with three states |
| Does this directed graph contain a cycle | Depth-first search with three states, over every vertex |
| Fewest edges from $s$ to every vertex | [Breadth-first search](/algorithms/graphs/bfs) |
| Cheapest path, weights nonnegative | [Dijkstra](/algorithms/graphs/dijkstra) |
| Cheapest path, weights are zero or one | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Cheapest path, weights may be negative | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| An ordering that respects the dependencies | [Topological sort](/algorithms/graphs/topological-sort) |
| Group the items and test membership | [Disjoint set union](/algorithms/graphs/dsu) |
| Connect everything as cheaply as possible | [Minimum spanning tree](/algorithms/graphs/mst) |
| Which edges disconnect the graph when removed | [Bridges](/algorithms/graphs/bridges) |
| Which vertices disconnect the graph when removed | [Articulation points](/algorithms/graphs/articulation-points) |
| Which vertices are mutually reachable | [Strongly connected components](/algorithms/graphs/strongly-connected-components) |
| A route that uses every edge exactly once | [Euler tour](/algorithms/graphs/euler-tour) |
| How much can this network carry | [Minimum cut](/algorithms/graphs/minimum-cut) |
| Pair every item on the left with an item on the right | [Bipartite matching](/algorithms/graphs/bipartite-matching) |
| The cheapest path between every pair of vertices | Floyd-Warshall, which is not covered yet |
| The graph is undirected, weights may be negative, and all pairs are needed | Johnson's algorithm, which is not covered yet |
| The graph is a tree and the question is about a path | [Trees and decompositions](/algorithms/trees/) |

The weight column is the whole decision for shortest paths. Three sentences in the statement decide it: unweighted means breadth-first search, nonnegative means Dijkstra, and possibly negative means Bellman-Ford. The number of edges is the second decision, because $O(VE)$ is only affordable when $V$ is in the hundreds.

## What this subject implies but does not yet cover

- **The Hungarian algorithm.** The assignment problem, which is the weighted version of bipartite matching: assign every worker to a job at minimum total cost. The [bipartite matching article](/algorithms/graphs/bipartite-matching) covers the unweighted version, and the weighted version needs a different argument.
- **Minimum cost flow.** A flow network in which each unit of flow also carries a price, which turns the assignment problem and the transportation problem into one method. The [minimum cut article](/algorithms/graphs/minimum-cut) builds the network but stops at the unweighted case.
- **Floyd-Warshall and all-pairs shortest paths.** The $O(V^3)$ dynamic program over the path that goes through each vertex in turn, which is the standard answer when the graph is small and every pair is queried.
- **Johnson's algorithm**, which uses Bellman-Ford to remove the negative edges and then runs Dijkstra, and which is the standard answer when the graph is dense and some weights are negative.
- **The two-coloring test for a bipartite graph.** Assigning two colors so that no edge joins two vertices of the same color, which is one depth-first search and is the step before any matching algorithm when the partition is not given.
- **Dominator trees.** The tree that records which vertices dominate which others in a flow graph, computed in near-linear time and the standard answer to "must every path from $s$ to $t$ pass through $v$".

## Related subjects

- [Trees and decompositions](/algorithms/trees/) takes the acyclic case and adds the machinery for path queries.
- [Range query structures](/algorithms/range-queries/) supply the Fenwick tree, which appears inside the shortest-path algorithms as a distance array.
- [Dynamic programming](/algorithms/dynamic-programming/) takes over when the graph is a DAG and the answer depends on a path's internal structure rather than on its length.
- [Advanced algorithms](/algorithms/advanced/) contains the offline connectivity techniques, which are the disjoint set union taken to its limit.
- The [academy](/start/) introduces the graph as the model for anything with connections, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
