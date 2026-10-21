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

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Lowest common ancestor | $O(n \log n)$ to build, $O(\log n)$ per query | `graphs.representation` | [Lowest common ancestor](/algorithms/trees/lca) |
| Heavy-light decomposition | $O(n)$ to build, $O(\log^2 n)$ per path query | `trees.lca` | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| Tree dynamic programming | $O(n)$ | `graphs.dfs` | [Tree dynamic programming](/algorithms/trees/tree-dp) |

The three build on each other. The lowest common ancestor is the primitive: it answers "which vertex is the deepest common ancestor of these two". Heavy-light decomposition uses it to answer a general path question by splitting the path into a logarithmic number of segments. Tree dynamic programming does not need either, and is the more useful of the three in practice.

## Recognition signals

- **"rooted at"**, **"a tree with $n$ nodes"**, **"each node has exactly one parent"**. The tree is stated outright.
- **"the path from $u$ to $v$"**, **"on the way from $u$ to $v$"**, **"the route between two nodes"**. A path question.
- **"ancestor"**, **"descendant"**, **"the deepest common"**, **"the lowest node that is an ancestor of both"**.
- **"each node has a value"**, **"each node carries some weight"**, and the question asks for a maximum or a sum over a path.
- **"in every subtree"**, **"for each node, consider its subtree"**, **"choose some nodes so that no two are adjacent"**. This is the tree dynamic programming signal, and it is the one that appears most often in Gold and Platinum problems.
- **"the parent of"**, **"the children of"**, **"the root of the tree"**, and a statement that gives the parent of every node rather than the edges.

The signal that rules the subject out is "the shortest path" on a graph that is not stated to be a tree. The machinery here depends on there being exactly one path, and a general graph does not have that.

## Choosing a technique

| The question | What to use |
| --- | --- |
| The deepest common ancestor of two nodes | [Lowest common ancestor](/algorithms/trees/lca) |
| The distance between two nodes | The lowest common ancestor, with depths |
| The sum or maximum on a path | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| The best value achievable in every subtree | [Tree dynamic programming](/algorithms/trees/tree-dp) |
| A value on a path, and the tree is static with many queries | Heavy-light decomposition, or a Fenwick tree over an Euler tour |
| A value on a path, and the tree changes | A link-cut tree, which is not covered yet |
| The answer depends on every pair of nodes | The quadratic tree dynamic program, rerooted in $O(n)$ |
| A path in a general graph, not a tree | [Graphs](/algorithms/graphs/) |

## What this subject implies but does not yet cover

- **The Euler tour.** A numbering of the vertices in which every subtree occupies a contiguous interval, which turns a subtree query into a range query and a path query into two range queries. It is the foundation under the [Fenwick tree](/algorithms/range-queries/fenwick-tree) solution to tree path problems, and it has no article of its own.
- **Binary lifting.** The ancestor table that answers a lowest common ancestor query in $O(\log n)$. It is derived in full inside the [lowest common ancestor article](/algorithms/trees/lca), including the $O(n \log n)$ construction, but it does not have a page of its own.
- **Rerooting.** Running the tree dynamic program once in each direction so that every vertex can be treated as the root. It appears as a variant in the [tree dynamic programming article](/algorithms/trees/tree-dp), and the general two-pass rerooting technique does not have an article.
- **Centroid decomposition.** Splitting a tree at its centroid so that every recursive subproblem has at most half the vertices, which turns many "count the paths through a node" problems into $O(n \log n)$ searches.
- **Small-to-large merging.** Merging the children of a node by always merging the smallest structure into the largest, which gives $O(n \log n)$ for problems that attach a multiset to every node.
- **Virtual trees.** Compressing a tree down to the nodes that matter for one query, so that a query about $k$ marked nodes takes $O(k \log k)$ rather than $O(n)$.
- **Dynamic trees.** Link-cut trees and top trees, which support structural changes to a tree while answering path queries, and which are the right answer when the tree is not static.

## Related subjects

- [Graphs](/algorithms/graphs/) supplies the traversal that every tree algorithm starts from, and the tree dynamic programming article assumes a depth-first search.
- [Range query structures](/algorithms/range-queries/) supply the Fenwick tree and the segment tree that answer the range questions the Euler tour creates.
- [Dynamic programming](/algorithms/dynamic-programming/) is the general form of what the tree dynamic programming article specializes.
- [Advanced algorithms](/algorithms/advanced/) contains the offline techniques that a tree problem sometimes needs instead.
