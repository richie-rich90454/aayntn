---
id: trees.index
title: The Trees and decompositions
summary: Use the structure of a tree to answer path questions and to compute answers for every subtree at once.
division: []
subjects: [trees]
level: advanced
importance: advanced-technique
keywords: [trees, lowest common ancestor, heavy-light decomposition, tree dp, path queries]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Trees is the subject of problems whose input is a graph with no cycles, or where the input happens to be shaped like one. A tree is the structure that makes path questions tractable, because there is exactly one path between any two vertices and the ancestors of a vertex are totally ordered.

The subject divides in two. One half answers questions about a path: what is the value on the path from $u$ to $v$, how many nodes have a certain property, how far apart are two nodes. The other half computes an answer for every vertex by combining the answers of its children, which is the tree-shaped version of [dynamic programming](/algorithms/dynamic-programming/).

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Lowest common ancestor | $O((n + m) \log n)$ to build, $O(\log n)$ per query | $O(n \log n)$ | `graphs.bfs` | [Lowest common ancestor](/algorithms/trees/lca) |
| Heavy-light decomposition | $O(n)$ to build, $O(\log n)$ per path query | $O(n)$ | `trees.lca` | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| Tree dynamic programming | $O(n)$ | $O(n)$ | `graphs.bfs` | [Tree dynamic programming](/algorithms/trees/tree-dp) |
| Euler tour of a tree | $O(n)$ to flatten | $O(n)$ | `graphs.dfs` | [Euler tour of a tree](/algorithms/trees/euler-tour) |
| Binary lifting | $O(n \log n)$ to build, $O(\log n)$ per query | $O(n \log n)$ | `graphs.bfs` | [Binary lifting](/algorithms/trees/binary-lifting) |
| Rerooting | $O(n)$ | $O(n)$ | `trees.tree-dp` | [Rerooting](/algorithms/trees/rerooting) |
| Centroid decomposition | $O(n \log n)$ | $O(n)$ | `graphs.dfs` | [Centroid decomposition](/algorithms/trees/centroid-decomposition) |

The first four build on each other. The lowest common ancestor is the primitive: it answers "which vertex is the deepest common ancestor of these two". Binary lifting is the table that answers it, and the [lowest common ancestor article](/algorithms/trees/lca) derives it in full. Heavy-light decomposition uses the ancestor structure to answer a general path question by splitting the path into a logarithmic number of segments. The Euler tour turns a subtree into a contiguous interval, which is what lets a range structure answer a subtree question.

Tree dynamic programming does not need any of them, and it is the most useful of the seven in practice. Rerooting is its second pass, and the centroid decomposition is the one technique here that is about the shape of the tree rather than about a path.

The heavy-light row states the prefix-sum bound, which is what the reference implementation achieves. The same decomposition over a segment tree answers a path query in $O(\log^2 n)$, and the article gives both numbers.

## Recognition signals

- **"rooted at"**, **"a tree with $n$ nodes"**, **"each node has exactly one parent"**. The tree is stated outright.
- **"the path from $u$ to $v$"**, **"on the way from $u$ to $v$"**, **"the route between two nodes"**. A path question.
- **"ancestor"**, **"descendant"**, **"the deepest common"**, **"the lowest node that is an ancestor of both"**.
- **"each node has a value"**, **"each node carries some weight"**, and the question asks for a maximum or a sum over a path.
- **"in every subtree"**, **"for each node, consider its subtree"**, **"choose some nodes so that no two are adjacent"**. This is the tree dynamic programming signal, and it is the one that appears most often in Gold and Platinum problems.
- **"the parent of"**, **"the children of"**, **"the root of the tree"**, and a statement that gives the parent of every node rather than the edges.
- **"if the root were somewhere else"**, **"for every node, treat it as the root"**. That is rerooting, and it is the difference between one dynamic program and two.
- **"the number of pairs of nodes whose path passes through"**, **"count the paths of length $k$"**. That is the centroid decomposition, and it is the standard answer to "count the paths through a node" in near-linear time.

The signal that rules the subject out is "the shortest path" on a graph that is not stated to be a tree. The machinery here depends on there being exactly one path, and a general graph does not have that.

## Choosing a technique

| The question | What to use |
| --- | --- |
| The deepest common ancestor of two nodes | [Lowest common ancestor](/algorithms/trees/lca) |
| The distance between two nodes | The lowest common ancestor, with depths |
| The ancestor of a node $k$ levels above it | [Binary lifting](/algorithms/trees/binary-lifting) |
| The sum or maximum on a path | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| A value on a path, and the tree is static with many queries | Heavy-light decomposition, or a Fenwick tree over an [Euler tour](/algorithms/trees/euler-tour) |
| A value on a path, and the tree changes | [A link-cut tree](/algorithms/trees/dynamic-trees) |
| The best value achievable in every subtree | [Tree dynamic programming](/algorithms/trees/tree-dp) |
| The answer depends on every pair of nodes | [Rerooting](/algorithms/trees/rerooting), which is the quadratic tree program in $O(n)$ |
| The answer for every subtree of a tree that is built one node at a time | An [Euler tour](/algorithms/trees/euler-tour) with a Fenwick tree |
| Count the paths whose length is exactly $k$ | [Centroid decomposition](/algorithms/trees/centroid-decomposition) |
| A path in a general graph, not a tree | [Graphs](/algorithms/graphs/) |

The rerooting row is worth reading twice. The naive way to answer "for every node, treat it as the root" is to run the tree dynamic program once per root, which costs $O(n^2)$. The two-pass rerooting runs it once downward and once upward, with the sibling exclusion done in constant time, and it costs $O(n)$.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Binary lifting | O(n log n) to build, O(log n) per query | O(n log n) | `graphs.bfs` | [Binary lifting](/algorithms/trees/binary-lifting) | Prose only |
| Centroid decomposition | O(n log n) | O(n) | `graphs.dfs` | [Centroid decomposition](/algorithms/trees/centroid-decomposition) | Prose only |
| Dynamic trees | O(log n) amortized per operation | O(n) | `trees.lca` | [Dynamic trees](/algorithms/trees/dynamic-trees) | [Source](/implementations/trees-dynamic-trees/) |
| Euler tour for trees | O(n) to build, O(log n) per query with a Fenwick tree | O(n) | `graphs.dfs` | [Euler tour for trees](/algorithms/trees/euler-tour) | Prose only |
| Heavy-light decomposition | O(n) to build, O(log n) per path query | O(n) | `graphs.bfs` | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) | [Source](/implementations/trees-heavy-light-decomposition/) |
| Lowest common ancestor | O((n + m) log n) to build, O(log n) per query | O(n log n) | `graphs.bfs` | [Lowest common ancestor](/algorithms/trees/lca) | [Source](/implementations/trees-lca/) |
| Rerooting | O(n) | O(n) | `graphs.dfs` | [Rerooting](/algorithms/trees/rerooting) | Prose only |
| Small-to-large merging | O(n log n) expected | O(n) | `graphs.dfs` | [Small-to-large merging](/algorithms/trees/small-to-large-merging) | [Source](/implementations/trees-small-to-large-merging/) |
| The top-tree and rake-compress formulation | O(log n) amortized per operation | O(n) | `trees.lca` | [The top-tree and rake-compress formulation](/algorithms/trees/top-tree) | [Source](/implementations/trees-top-tree/) |
| Tree dynamic programming | O(n) | O(n) | `graphs.bfs` | [Tree dynamic programming](/algorithms/trees/tree-dp) | Prose only |
| Tree hashing | O(n log n + m log m) | O(n + m) | `trees.tree-dp` | [Tree hashing](/algorithms/trees/tree-hashing) | [Source](/implementations/trees-tree-hashing/) |
| Virtual trees | O(n log n) to preprocess, O(k log k + k log n) per query | O(n log n) for the ancestor table, O(k) for the virtual tree | `trees.lca` | [Virtual trees](/algorithms/trees/virtual-tree) | [Source](/implementations/trees-virtual-tree/) |

<!-- aayntn:subject:end -->

## Related subjects

- [Graphs](/algorithms/graphs/) supplies the traversal that every tree algorithm starts from, and the tree dynamic programming article assumes a depth-first search.
- [Range query structures](/algorithms/range-queries/) supply the Fenwick tree and the segment tree that answer the range questions the Euler tour creates.
- [Dynamic programming](/algorithms/dynamic-programming/) is the general form of what the tree dynamic programming article specializes.
- [Advanced algorithms](/algorithms/advanced/) contains the offline techniques that a tree problem sometimes needs instead.
- The [academy](/start/) introduces the tree as the structure with one path between two nodes, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
