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

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Graph representation | $O(V + E)$ to build | `foundations.complexity` | [Representation](/algorithms/graphs/representation) |
| Depth-first search | $O(V + E)$ | `graphs.representation` | [Depth-first search](/algorithms/graphs/dfs) |
| Breadth-first search | $O(V + E)$ | `graphs.representation` | [Breadth-first search](/algorithms/graphs/bfs) |
| Disjoint set union | $O(\alpha(n))$ amortized | `graphs.representation` | [Disjoint set union](/algorithms/graphs/dsu) |
| Dijkstra's algorithm | $O((V + E) \log V)$ | `graphs.representation` | [Dijkstra](/algorithms/graphs/dijkstra) |
| 0-1 BFS | $O(V + E)$ | `graphs.bfs` | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Bellman-Ford | $O(VE)$ | `graphs.dijkstra` | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Topological sort | $O(V + E)$ | `graphs.representation` | [Topological sort](/algorithms/graphs/topological-sort) |
| Minimum spanning tree | $O(E \log E)$ | `graphs.dsu` | [Minimum spanning tree](/algorithms/graphs/mst) |

The first entry is the one to read first. Every traversal, every shortest-path algorithm, and every connected-components structure in this subject starts from the same representation question: an adjacency list, an adjacency matrix, or an implicit neighbor function.

## Recognition signals

- **"towns"**, **"cities"**, **"roads"**, **"flights"**, **"edges"**, **"connections"**, **"friends"**, **"followers"**. The vocabulary of a graph problem is a giveaway, but it is not required: a grid of cells is a graph, a state space is a graph, and a dependency between tasks is a graph.
- **"connected"**, **"reachable"**, **"component"**, **"the same group"**.
- **"fewest"**, **"shortest"**, **"cheapest"**, **"minimum number of steps"**. These separate the three shortest-path algorithms from each other, and the difference is in the weights, not in the shape.
- **"each item depends on"**, **"must be done before"**, **"prerequisites"**. A partial order is a directed acyclic graph.
- **"connect everything"**, **"as cheaply as possible"**, **"a tree that spans"**. The spanning tree is not the same object as a shortest-path tree, and confusing them is a common error.
- **"merge"**, **"union"**, **"are they in the same set"**, **"group the items"**. The disjoint set union answers connectivity online, in almost constant time, without any traversal.

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
| The graph is a tree and the question is about a path | [Trees and decompositions](/algorithms/trees/) |

The weight column is the whole decision for shortest paths. Three sentences in the statement decide it: unweighted means breadth-first search, nonnegative means Dijkstra, and possibly negative means Bellman-Ford. The number of edges is the second decision, because $O(VE)$ is only affordable when $V$ is in the hundreds.

## What this subject implies but does not yet cover

- **Maximum flow and minimum cut.** The theory and the implementation of the augmenting-path algorithms, which are the answer to "how much flow can this network carry" and to a surprising number of problems that do not mention flow at all.
- **Bipartite matching and the Hungarian algorithm.** The assignment problem and its variations, and the connection to the König theorem.
- **Strongly connected components.** Tarjan's algorithm and Kosaraju's algorithm. Kosaraju's is described as a variant in the [depth-first search article](/algorithms/graphs/dfs), including the reason the second search runs in reverse finish order, but it does not have an article of its own.
- **Bridges and articulation points.** The low-link computation that uses the same depth-first forest, and the bridge-finding algorithm that is one more line of the same code.
- **Euler tours and Eulerian trails.** Hierholzer's algorithm is described as a depth-first search with an extra rule in the [depth-first search article](/algorithms/graphs/dfs), and it does not have an article of its own.
- **Johnson's algorithm**, which uses Bellman-Ford to remove the negative edges and then runs Dijkstra, and which is the standard answer when the graph is dense and some weights are negative.
- **A graph stored on the edges only**, the union-find style of graph traversal that avoids an adjacency list entirely when the edges arrive in a convenient order.

## Related subjects

- [Trees and decompositions](/algorithms/trees/) takes the acyclic case and adds the machinery for path queries.
- [Range query structures](/algorithms/range-queries/) supply the Fenwick tree, which appears inside the shortest-path algorithms as a distance array.
- [Dynamic programming](/algorithms/dynamic-programming/) takes over when the graph is a DAG and the answer depends on a path's internal structure rather than on its length.
- [Advanced algorithms](/algorithms/advanced/) contains the offline connectivity techniques, which are the disjoint set union taken to its limit.
