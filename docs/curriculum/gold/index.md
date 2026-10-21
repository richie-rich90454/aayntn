---
id: curriculum.gold
title: The Gold track
summary: Shortest paths, trees, dynamic programming, and the data structures that make the right solution expressible.
division: [gold]
subjects: []
level: advanced
importance: advanced-technique
keywords: [gold, curriculum, track, division]
prerequisites:
    required: []
    recommended: [start.from-ap-csa, start.discrete-mathematics, start.data-structures]
reviewed: false
---

The Gold track is where the algorithm has to be chosen rather than recognized, and where the constraint is set so that the obvious solution is just barely too slow. A Gold problem typically has a working $O(n^2)$ solution that misses the time limit by a factor of a few, and the fix is a state, a traversal, or a data structure that removes the quadratic factor.

The techniques here are also where the divisions genuinely differ from Silver. Silver problems are mostly about replacing a double loop; Gold problems are about choosing between several correct algorithms, each of which is fast enough for a different question.

## The techniques, in order

1. **[Dijkstra's algorithm](/algorithms/graphs/dijkstra)**. Shortest paths with nonnegative weights, and the first algorithm in the encyclopedia whose complexity depends on a data structure you choose.
2. **[0-1 BFS](/algorithms/graphs/0-1-bfs)**. The same question when the weights are only zero and one, in linear time rather than logarithmic.
3. **[Bellman-Ford](/algorithms/graphs/bellman-ford)**. Shortest paths when a weight may be negative, and the technique that detects a negative cycle.
4. **[Topological sort](/algorithms/graphs/topological-sort)**. An ordering of a directed acyclic graph, and the preprocessing step that many graph dynamic programs need.
5. **[Minimum spanning tree](/algorithms/graphs/mst)**. The cheapest way to connect everything, which is a different question from the cheapest path and is answered by a different algorithm.
6. **[Lowest common ancestor](/algorithms/trees/lca)**. The primitive of tree path queries, and the answer to "which node is the deepest common ancestor".
7. **[Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition)**. Splitting a path into a logarithmic number of segments, so that a path question becomes a sequence of range questions.
8. **[Tree dynamic programming](/algorithms/trees/tree-dp)**. Computing an answer for every node by combining the answers of its children, the tree-shaped form of dynamic programming.
9. **[The Fenwick tree](/algorithms/range-queries/fenwick-tree)**. A prefix-sum structure that can be updated, and the shortest route to "range sum with updates".
10. **[The segment tree](/algorithms/range-queries/segment-tree)**. The general range structure, which answers any associative question over a range.
11. **[0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack)**. The canonical dynamic program: a state, a recurrence, and an iteration order.
12. **[The longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence)**. The same idea with a different state, and a faster implementation than the quadratic one.
13. **[Binomial coefficients](/algorithms/combinatorics/binomial-coefficients)**. Counting rather than listing, the method that turns "how many ways" into arithmetic.
14. **[Modular arithmetic](/algorithms/number-theory/modular-arithmetic)**. Computing with numbers that overflow, and the standard reduction for a count that is too large to store.

## What you should be able to do at the end

You should be able to read a Gold statement and produce a solution whose complexity you can defend against the constraint, and you should be able to say why that solution is correct. Concretely, you should be able to:

- **Choose between correct algorithms.** A shortest-path problem has three answers, and the choice depends on the weights, not on the graph. Know the weight conditions of each one cold.
- **State a dynamic program.** Write down what the state means, what the transition is, why the transition is correct, and what the iteration order must be. The order is not optional: the wrong order lets one item be used twice.
- **Build a range structure.** Implement the Fenwick tree from the prefix-sum identity rather than from memory, so that you can reconstruct the update rule when you need it.
- **Model a tree problem.** Decide the root, decide what the state means for each node, and decide whether the answer needs a second pass from the root downward.
- **Count without enumerating.** Recognize when the answer is a count, and reach for a formula rather than a loop over the possibilities.
- **Prove the complexity.** Name the data structures the code actually uses, because the bound of a Fenwick tree with a binary search inside it is $O(\log^2 n)$ and not $O(\log n)$.

## The subjects this track draws on

- [Graphs and shortest paths](/algorithms/graphs/), which supplies four of the fourteen techniques.
- [Trees and decompositions](/algorithms/trees/), which supplies the three tree techniques.
- [Range query structures](/algorithms/range-queries/), which supplies the Fenwick tree and the segment tree.
- [Dynamic programming](/algorithms/dynamic-programming/), which supplies the two recurrence techniques.
- [Combinatorics](/algorithms/combinatorics/) and [Number theory](/algorithms/number-theory/), which supply the counting and the modular arithmetic.

## A note on the division

USACO does not publish a fixed syllabus, and the line between Gold and Silver is a statement about problem difficulty rather than about algorithms. Several techniques on this track appear in Silver problems, and the boundary is not sharp in either direction.

The list above is a curated route rather than an official one, and it deliberately repeats techniques that the [Silver track](/curriculum/silver/) already introduced, because a technique that appears once is not learned. The Platinum track continues from here rather than replacing this material. This track is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad, and completing it does not predict a result in any contest.
