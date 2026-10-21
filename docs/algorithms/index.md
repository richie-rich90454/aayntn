---
id: algorithms.overview
title: The algorithm encyclopedia
summary: Every technique a competitor needs, organized by the idea behind it rather than by the contest it appeared in.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [encyclopedia, algorithm index, subject index, technique index]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

This is the subject-based encyclopedia. It collects the techniques a competitor needs, and it arranges them by the idea that makes each one work rather than by the contest the technique first appeared in.

There are fourteen subjects, thirty-five techniques, and one method for reading every article. The index below is the map. Pick the subject that matches the idea you are looking for, read the subject page, and follow the technique from there.

## Why the organization is by subject

A division-based arrangement has a fatal flaw for an encyclopedia: it repeats itself. Greedy choice appears in a Bronze problem and in a Platinum problem. Binary search appears in every division from Silver upward. Sorting appears in all four. A reader who arrives at a problem and knows the technique but not the division learns nothing from being told which division it belongs to.

The idea behind a technique travels with the technique. The reason a greedy choice is safe is the same reason in a small interval problem and in a large scheduling problem. The reason a Fenwick tree answers prefix sums is the same reason regardless of who is asking. Arranging by idea means each idea is explained once, in one place, at the depth the idea deserves.

The division tracks still exist. They live in the [curriculum](/curriculum/), where they describe a route through the material rather than a classification of it. Use the subject pages when you want to understand a technique, and the curriculum when you want to decide what to learn next.

A second reason runs deeper. The recognition of a problem is what actually fails in a contest. A competitor who knows Dijkstra's algorithm but has not internalized the phrase "cheapest path with nonnegative weights" will not reach for it. A subject page is organized around the signals that point at its techniques, so the encyclopedia teaches recognition next to the algorithm rather than leaving it to the reader.

## The fourteen subjects

| Subject | Techniques it contains | Page |
| --- | --- | --- |
| Foundations and complexity | Complexity analysis, recursion, sorting, binary representation | [Foundations](/algorithms/foundations/) |
| Enumeration and searching | Subset enumeration, backtracking | [Enumeration](/algorithms/enumeration/) |
| Searching | Binary search, two pointers, sliding window | [Searching](/algorithms/searching/) |
| Greedy methods | Interval scheduling | [Greedy](/algorithms/greedy/) |
| Arrays and sequences | Prefix sums, two-dimensional prefix sums, difference arrays | [Arrays](/algorithms/arrays/) |
| Range query structures | Fenwick tree, segment tree, sparse table | [Range queries](/algorithms/range-queries/) |
| Graphs and shortest paths | Representation, depth-first search, breadth-first search, disjoint set union, Dijkstra, 0-1 BFS, Bellman-Ford, topological sort, minimum spanning tree | [Graphs](/algorithms/graphs/) |
| Trees and decompositions | Lowest common ancestor, heavy-light decomposition, tree dynamic programming | [Trees](/algorithms/trees/) |
| Dynamic programming | 0/1 knapsack, longest increasing subsequence | [Dynamic programming](/algorithms/dynamic-programming/) |
| Strings | Knuth-Morris-Pratt | [Strings](/algorithms/strings/) |
| Number theory | Modular arithmetic | [Number theory](/algorithms/number-theory/) |
| Combinatorics | Binomial coefficients | [Combinatorics](/algorithms/combinatorics/) |
| Computational geometry | Convex hull | [Geometry](/algorithms/geometry/) |
| Advanced algorithms and special techniques | Parallel binary search | [Advanced](/algorithms/advanced/) |

## The core algorithms

Every technique in the encyclopedia appears below with the bound it achieves, the lesson that must come first, and the article that derives it.

| Technique | Time | Space | Requires | Article |
| --- | --- | --- | --- | --- |
| Complexity analysis | a method, not an algorithm | a method, not an algorithm | none | [Complexity](/algorithms/foundations/complexity) |
| Recursion | $O(n)$ for linear recursion | $O(n)$ for the call stack | `foundations.complexity` | [Recursion](/algorithms/foundations/recursion) |
| Sorting | $O(n \log n)$ | $O(n)$ for merge sort | `foundations.complexity` | [Sorting](/algorithms/foundations/sorting) |
| Binary representation | $O(1)$ per word operation | $O(1)$ | `foundations.complexity` | [Binary representation](/algorithms/foundations/binary-representation) |
| Subset enumeration | $O(2^n)$ | $O(n)$ per subset | `foundations.recursion` | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| Backtracking | $O(n!)$ in the worst case | $O(n)$ for the current path | `foundations.recursion` | [Backtracking](/algorithms/enumeration/backtracking) |
| Binary search | $O(\log n)$ | $O(1)$ | `searching.two-pointers` | [Binary search](/algorithms/searching/binary-search) |
| Two pointers | $O(n)$ | $O(1)$ | `foundations.complexity` | [Two pointers](/algorithms/searching/two-pointers) |
| Sliding window | $O(n)$ | $O(1)$ | `searching.two-pointers` | [Sliding window](/algorithms/searching/sliding-window) |
| Interval scheduling | $O(n \log n)$ | $O(n)$ | `foundations.sorting` | [Interval scheduling](/algorithms/greedy/interval-scheduling) |
| Prefix sums | $O(n + q)$ | $O(n)$ | `foundations.complexity` | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Two-dimensional prefix sums | $O(nm + q)$ | $O(nm)$ | `arrays.prefix-sums` | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) |
| Difference arrays | $O(n + q)$ | $O(n)$ | `arrays.prefix-sums` | [Difference arrays](/algorithms/arrays/difference-arrays) |
| Fenwick tree | $O(\log n)$ per operation | $O(n)$ | `arrays.prefix-sums` | [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Segment tree | $O(\log n)$ per operation | $O(n)$ | `arrays.prefix-sums` | [Segment tree](/algorithms/range-queries/segment-tree) |
| Sparse table | $O(n \log n)$ to build, $O(1)$ per query | $O(n \log n)$ | `foundations.sorting` | [Sparse table](/algorithms/range-queries/sparse-table) |
| Graph representation | $O(V + E)$ to build | $O(V + E)$ | `foundations.complexity` | [Representation](/algorithms/graphs/representation) |
| Depth-first search | $O(V + E)$ | $O(V + E)$ | `graphs.representation` | [Depth-first search](/algorithms/graphs/dfs) |
| Breadth-first search | $O(V + E)$ | $O(V + E)$ | `graphs.representation` | [Breadth-first search](/algorithms/graphs/bfs) |
| Disjoint set union | $O(\alpha(n))$ amortized | $O(n)$ | `graphs.representation` | [Disjoint set union](/algorithms/graphs/dsu) |
| Dijkstra's algorithm | $O((V + E) \log V)$ | $O(V + E)$ | `graphs.representation` | [Dijkstra](/algorithms/graphs/dijkstra) |
| 0-1 BFS | $O(V + E)$ | $O(V + E)$ | `graphs.bfs` | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Bellman-Ford | $O(VE)$ | $O(V)$ | `graphs.dijkstra` | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Topological sort | $O(V + E)$ | $O(V)$ | `graphs.representation` | [Topological sort](/algorithms/graphs/topological-sort) |
| Minimum spanning tree | $O(E \log E)$ | $O(V + E)$ | `graphs.dsu` | [Minimum spanning tree](/algorithms/graphs/mst) |
| Lowest common ancestor | $O(n \log n)$ to build, $O(\log n)$ per query | $O(n \log n)$ | `graphs.representation` | [Lowest common ancestor](/algorithms/trees/lca) |
| Heavy-light decomposition | $O(n)$ to build, $O(\log^2 n)$ per path query | $O(n)$ | `trees.lca` | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| Tree dynamic programming | $O(n)$ | $O(n)$ | `graphs.dfs` | [Tree dynamic programming](/algorithms/trees/tree-dp) |
| 0/1 knapsack | $O(nW)$ | $O(W)$ | `foundations.complexity` | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| Longest increasing subsequence | $O(n \log n)$ | $O(n)$ | `foundations.sorting` | [Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| Knuth-Morris-Pratt | $O(n + m)$ | $O(m)$ | `foundations.complexity` | [KMP](/algorithms/strings/kmp) |
| Modular arithmetic | $O(\log m)$ per operation | $O(1)$ | `foundations.complexity` | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |
| Binomial coefficients | $O(\min(k, n-k))$ per value | $O(n)$ | `foundations.complexity` | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| Convex hull | $O(n \log n)$ | $O(n)$ | `foundations.sorting` | [Convex hull](/algorithms/geometry/convex-hull) |
| Parallel binary search | $O((n + q) \log^2 n)$ | $O(n + q)$ | `searching.binary-search` | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |

The first row is the odd one out, and it is the most important. Complexity analysis is not a technique you apply to a problem; it is the tool that tells you which technique you can afford. Every bound in the other thirty-four rows was produced by it.

## Choosing an algorithm

Read the statement, find the phrase in the left column, and go to the right one.

| The problem says | Reach for |
| --- | --- |
| "sorted", "the first index at least k" | [Binary search](/algorithms/searching/binary-search) |
| "the longest run", "the subarray with property" | [Sliding window](/algorithms/searching/sliding-window) |
| "the sum of a range", "sum of elements between i and j" | [Prefix sums](/algorithms/arrays/prefix-sums) |
| "add to a range", "increment every element in a range" | [Difference arrays](/algorithms/arrays/difference-arrays) |
| "range sum after updates" | [Segment tree](/algorithms/range-queries/segment-tree) |
| "static range minimum" | [Sparse table](/algorithms/range-queries/sparse-table) |
| "fewest steps", "unweighted edges", "minimum number of moves" | [Breadth-first search](/algorithms/graphs/bfs) |
| "cheapest path", "nonnegative weights" | [Dijkstra](/algorithms/graphs/dijkstra) |
| "weights may be negative" | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| "each task depends on another", "order the tasks" | [Topological sort](/algorithms/graphs/topological-sort) |
| "merge groups", "is this person in the same group" | [Disjoint set union](/algorithms/graphs/dsu) |
| "connect everything as cheaply as possible" | [Minimum spanning tree](/algorithms/graphs/mst) |
| "value on the path between two nodes" | [Lowest common ancestor](/algorithms/trees/lca) |
| "how many ways", "choose k of n" | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| "maximum total value under a weight limit" | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| "pattern appears inside a text" | [KMP](/algorithms/strings/kmp) |
| "answer modulo a prime", "avoid overflow" | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |
| "the outermost point", "the boundary of the set" | [Convex hull](/algorithms/geometry/convex-hull) |
| "n at most twenty", "every possible assignment" | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| "too many possibilities to try all" | [Backtracking](/algorithms/enumeration/backtracking) |
| "take the best option now, no regrets" | [Interval scheduling](/algorithms/greedy/interval-scheduling) |

The table is a first filter, not a decision. Read the recognition section of the subject page before you commit, because several rows overlap: a range minimum query with no updates is a sparse table, and the same query with updates is a segment tree, and the phrase "minimum" in the statement does not tell you which case you are in.

## How to read an article

Every article in this encyclopedia follows the same six-part method. Knowing the shape means you can read an article you have never seen and know where the answer to a given question will be.

1. **Motivation and recognition.** The article opens with a concrete problem and its constraints, states the naive baseline, and lists the phrases and the constraint values that select the technique. If you want to know whether a technique applies to a statement you are holding, this part answers it.
2. **The insight.** The article names the single observation that replaces the naive approach and gives a picture of it. This is the part to read slowly; it is the part that transfers.
3. **The model and the derivation.** The article states the problem formally, names the state the algorithm keeps, gives the update, and shows why the update preserves the invariant. The derivation is not skipped, and it is not asserted.
4. **Correctness and cost.** The article proves the claim it makes and then bounds the time and the space, naming the data structures that produce each bound.
5. **The code.** The article says when to choose this algorithm over its neighbors, shows the reference implementations, decides the recursion question for each language, walks through the lines that matter, and lists the mistakes that cost points.
6. **The contest.** The article closes with variants, a fixed procedure to follow under a clock, worked problems with their common wrong approaches, a six-stage practice ladder, a review checklist that names the section answering each question, and links to what to read next.

Read the method in that order once. After that, jump to the part you need: the recognition section when you are deciding, the derivation when you are learning, the checklist when you are revising.

## Coverage and review status

The encyclopedia is honest about what it has. Two levels of completeness appear in the frontmatter of every article.

A **tested implementation** means the technique has a manifest, six-language source listings, and a fixture suite that the build runs before the site is published. Twelve techniques currently ship one: binary search, prefix sums, the Fenwick tree, the segment tree, the disjoint set union, depth-first search, breadth-first search, Dijkstra's algorithm, the lowest common ancestor, heavy-light decomposition, the 0/1 knapsack, and the convex hull trick.

Every other article in the encyclopedia is **prose only**. It derives the technique, states its complexity, proves its correctness, and gives code inline, but it has no manifest and no compiled verification. The code in a prose article is written to be read, and reading it is the point; the claim that it compiles on every input is not made.

A smaller flag marks **reviewed** articles, which have been checked end to end against the article contract: the section order, the mathematics, the complexity claims, and the worked problems. At the time of writing, binary search is the only article in the encyclopedia that carries the flag. Treat every other article as accurate but unfinished, and report what you find.

Each subject page ends with a list of the techniques that its subject implies and that this encyclopedia does not yet cover. Those lists are the boundary of the material, and they are written so that you know when a problem needs something this site has not explained yet.

## Where to start

If you are new to competitive programming, the [academy](/start/) is the layer underneath this encyclopedia, and [From AP Computer Science A](/start/from-ap-csa/) is the bridge into it. Read that first, and the technique pages will make more sense because the vocabulary will already be familiar.

If you already know the standard techniques and want the derivation, start anywhere: pick a subject, read the article, and check the review checklist at the end against your own answers.
