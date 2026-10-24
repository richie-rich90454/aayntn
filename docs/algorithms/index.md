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

There are fourteen subjects, more than seventy techniques, and one method for reading every article. The index below is the map. Pick the subject that matches the idea you are looking for, read the subject page, and follow the technique from there.

## Why the organization is by subject

A division-based arrangement has a fatal flaw for an encyclopedia: it repeats itself. Greedy choice appears in a Bronze problem and in a Platinum problem. Binary search appears in every division from Silver upward. Sorting appears in all four. A reader who arrives at a problem and knows the technique but not the division learns nothing from being told which division it belongs to.

The idea behind a technique travels with the technique. The reason a greedy choice is safe is the same reason in a small interval problem and in a large scheduling problem. The reason a Fenwick tree answers prefix sums is the same reason regardless of who is asking. Arranging by idea means each idea is explained once, in one place, at the depth the idea deserves.

The division tracks still exist. They live in the [curriculum](/curriculum/), where they describe a route through the material rather than a classification of it. Use the subject pages when you want to understand a technique, and the curriculum when you want to decide what to learn next.

A second reason runs deeper. The recognition of a problem is what actually fails in a contest. A competitor who knows Dijkstra's algorithm but has not internalized the phrase "cheapest path with nonnegative weights" will not reach for it. A subject page is organized around the signals that point at its techniques, so the encyclopedia teaches recognition next to the algorithm rather than leaving it to the reader.

## The fourteen subjects

<!-- aayntn:subjects:start -->

| Subject | Techniques it contains | Page |
| --- | --- | --- |
| Foundations and complexity | Amortized analysis, Binary representation, Complexity analysis, Loop invariants, Recursion, Sorting, The time-memory tradeoff | [Foundations and complexity](/algorithms/foundations/) |
| Enumeration and searching | Backtracking, Branch and bound, Complete search, Constraint propagation, Gray codes, Iterative deepening, Meet in the middle, Permutations, Subset enumeration | [Enumeration and searching](/algorithms/enumeration/) |
| Searching | Binary search on the answer, Binary search, Parametric search, The sliding window variants with a state machine, Sliding window, Search over a sorted range of indices, Ternary search, The individual two-pointer patterns, Two pointers | [Searching](/algorithms/searching/) |
| Greedy methods | Greedy with a feasibility oracle, Interval scheduling, Sorting by several keys, Scheduling with deadlines and release times | [Greedy methods](/algorithms/greedy/) |
| Arrays and sequences | Coordinate compression, Difference arrays, Monotonic queue, Monotonic stack, Prefix sums over other operators, Prefix sums, Range hashing, Subarray sums, Two-dimensional difference arrays, Two-dimensional prefix sums, Two pointers on an array, Sliding window maximum | [Arrays and sequences](/algorithms/arrays/) |
| Range query structures | Fenwick tree, Implicit segment trees, Lazy propagation, Merge sort trees, Mo's algorithm, Persistent segment trees, Segment tree beats, Segment tree, Sparse table, Square-root decomposition, Wavelet trees | [Range query structures](/algorithms/range-queries/) |
| Graphs and shortest paths | 0-1 BFS, Articulation points, Bellman-Ford, Breadth-first search, Bipartite matching, The two-coloring test for a bipartite graph, Bridges, Depth-first search, Dijkstra's algorithm, Dominator trees, Disjoint set union, Euler tours in graphs, Floyd-Warshall and all-pairs shortest paths, The Hungarian algorithm, Johnson's algorithm, Minimum cost flow, Minimum cut, Minimum spanning tree, Graph representation, Strongly connected components, Topological sort | [Graphs and shortest paths](/algorithms/graphs/) |
| Trees and decompositions | Binary lifting, Centroid decomposition, Dynamic trees, Euler tour for trees, Heavy-light decomposition, Lowest common ancestor, Rerooting, Small-to-large merging, Tree dynamic programming, Tree hashing, Virtual trees | [Trees and decompositions](/algorithms/trees/) |
| Dynamic programming | 0/1 knapsack, The aliens trick, Bitmask dynamic programming, Convex hull trick, Dynamic programming on a directed acyclic graph, Digit dynamic programming, Divide-and-conquer optimization, Interval dynamic programming, Knuth optimization, The Li Chao tree, Longest increasing subsequence, Monotonic queue optimization, Profile dynamic programming, Subset transforms | [Dynamic programming](/algorithms/dynamic-programming/) |
| Strings | Aho-Corasick, Knuth-Morris-Pratt, The Manacher algorithm, The minimal rotation of a string, Palindrome trees (eertree), Rolling hash, Suffix array, The suffix automaton, Suffix trees, Trie, The Z algorithm | [Strings](/algorithms/strings/) |
| Number theory | Chinese remainder theorem, The discrete logarithm, Euler's totient function and Euler's theorem, The extended Euclidean algorithm, The fast Fourier transform, Matrix exponentiation, Miller-Rabin primality test, Modular arithmetic, The number-theoretic transform, Pollard's rho, Prime factorization, Sieve of Eratosthenes | [Number theory](/algorithms/number-theory/) |
| Combinatorics | Binomial coefficients, Burnside's lemma, Counting dynamic programming, Generating functions, The hook-length formula, Inclusion and exclusion, Integer partitions, Multinomial coefficients and the hypergeometric distribution, The reflection principle, Stars and bars | [Combinatorics](/algorithms/combinatorics/) |
| Computational geometry | Closest pair, Convex hull, Integer geometry, K-D trees, Point in polygon, Robust predicates, Rotating calipers, The smallest enclosing circle, Sweep line | [Computational geometry](/algorithms/geometry/) |
| Advanced algorithms and special techniques | Berlekamp-Massey, Bitset optimization, Offline dynamic connectivity, Parallel binary search, Persistent data structures, Quickselect and randomized selection, Randomized algorithms, The rollback disjoint set union, Game theory and Sprague-Grundy theory, XOR bases | [Advanced algorithms and special techniques](/algorithms/advanced/) |

<!-- aayntn:subjects:end -->

## The core algorithms

Every technique in the encyclopedia appears below with the bound it achieves, the lesson that must come first, and the article that derives it.

<!-- aayntn:core:start -->

| Technique | Time | Space | Requires | Article |
| --- | --- | --- | --- | --- |
| Berlekamp-Massey | O(n^2) | O(n) | `number-theory.modular-arithmetic` | [Berlekamp-Massey](/algorithms/advanced/berlekamp-massey) |
| Bitset optimization | O(nW / 32) | O(W / 32) | `foundations.binary-representation` | [Bitset optimization](/algorithms/advanced/bitset-optimization) |
| Offline dynamic connectivity | O(q log q log n) | O(n + q log q) | `graphs.dsu` | [Offline dynamic connectivity](/algorithms/advanced/offline-dynamic-connectivity) |
| Parallel binary search | O((N + Q) log^2 N) | O(N + Q) | `searching.binary-search` | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |
| Persistent data structures | O(1) per operation on the persistent stack | O(q) for q operations, one node per push | `foundations.complexity` | [Persistent data structures](/algorithms/advanced/persistent-data-structures) |
| Quickselect and randomized selection | O(n) expected with a random pivot, O(n^2) worst case | O(1) auxiliary in the iterative form, O(n) stack in the worst recursive form | `foundations.sorting` | [Quickselect and randomized selection](/algorithms/advanced/quickselect) |
| Randomized algorithms | O(n log n) expected comparisons, O(n^2) worst case | O(n) for the array, O(log n) expected recursion stack, O(n) in the worst case | `foundations.sorting` | [Randomized algorithms](/algorithms/advanced/randomized-algorithms) |
| The rollback disjoint set union | O(log n) per find or union, O(1) per rollback | O(n + q) for the forest and its history | `graphs.dsu` | [The rollback disjoint set union](/algorithms/advanced/rollback-dsu) |
| Game theory and Sprague-Grundy theory | O(M k + h) to tabulate the Grundy values up to the largest heap, where k moves are allowed | O(M + k) | `foundations.complexity` | [Game theory and Sprague-Grundy theory](/algorithms/advanced/sprague-grundy) |
| XOR bases | O((n + q) log A) | O(log A) | `foundations.binary-representation` | [XOR bases](/algorithms/advanced/xor-bases) |
| Coordinate compression | O(n log n + q log n) | O(n) | `foundations.sorting` | [Coordinate compression](/algorithms/arrays/coordinate-compression) |
| Difference arrays | O(n + q) | O(n) | `arrays.prefix-sums` | [Difference arrays](/algorithms/arrays/difference-arrays) |
| Monotonic queue | O(n) amortized | O(k) for a window of size k, O(n) without a window | `foundations.complexity` | [Monotonic queue](/algorithms/arrays/monotonic-queue) |
| Monotonic stack | O(n) | O(n) in the worst case | `foundations.complexity` | [Monotonic stack](/algorithms/arrays/monotonic-stack) |
| Prefix sums over other operators | O(n + q) | O(n) | `arrays.prefix-sums` | [Prefix sums over other operators](/algorithms/arrays/prefix-sums-over-other-operators) |
| Prefix sums | O(n + q) | O(n) | `foundations.complexity` | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Range hashing | O(n + q) | O(n) | `arrays.prefix-sums` | [Range hashing](/algorithms/arrays/range-hashing) |
| Subarray sums | O(n) expected with a frequency map, O(n log n) without one | O(n) | `arrays.prefix-sums` | [Subarray sums](/algorithms/arrays/subarray-sums) |
| Two-dimensional difference arrays | O(RC + q) | O(RC) | `arrays.difference-arrays` | [Two-dimensional difference arrays](/algorithms/arrays/two-dimensional-difference-arrays) |
| Two-dimensional prefix sums | O(RC + q) | O(RC) | `arrays.prefix-sums` | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) |
| Two pointers on an array | O(n) | O(1) in place, O(n) when a frequency map is needed | `foundations.complexity` | [Two pointers on an array](/algorithms/arrays/two-pointers) |
| Sliding window maximum | O(n) | O(k) besides the output | `foundations.complexity` | [Sliding window maximum](/algorithms/arrays/window-maximum) |
| Binomial coefficients | O(min(k, n-k)) per value | O(1) per value, O(k) for a Pascal table | `foundations.complexity` | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| Burnside's lemma | O(sqrt(n) * (sqrt(n) + log n)) | O(1) | `number-theory.modular-arithmetic` | [Burnside's lemma](/algorithms/combinatorics/burnside-lemma) |
| Counting dynamic programming | O(S * T) | O(S) | `dynamic-programming.0-1-knapsack` | [Counting dynamic programming](/algorithms/combinatorics/counting-dp) |
| Generating functions | O(nk) for the dynamic program | O(n) | `combinatorics.binomial-coefficients` | [Generating functions](/algorithms/combinatorics/generating-functions) |
| The hook-length formula | O(n + w) for a diagram of n cells and width w, plus O(log M) for the inverse | O(k + w) for k row lengths and w column heights | `foundations.complexity` | [The hook-length formula](/algorithms/combinatorics/hook-length-formula) |
| Inclusion and exclusion | O(2^m) | O(1) to O(m) | `combinatorics.binomial-coefficients` | [Inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) |
| Integer partitions | O(n sqrt n) | O(n) | `foundations.complexity` | [Integer partitions](/algorithms/combinatorics/integer-partitions) |
| Multinomial coefficients and the hypergeometric distribution | O(n + log p) per word | O(n) | `combinatorics.binomial-coefficients` | [Multinomial coefficients and the hypergeometric distribution](/algorithms/combinatorics/multinomial-coefficients) |
| The reflection principle | O(n + log p) | O(1) | `combinatorics.binomial-coefficients` | [The reflection principle](/algorithms/combinatorics/reflection-principle) |
| Stars and bars | O(min(k-1, n)) | O(1) | `combinatorics.binomial-coefficients` | [Stars and bars](/algorithms/combinatorics/stars-and-bars) |
| 0/1 knapsack | O(nW) | O(W) | `foundations.complexity` | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| The aliens trick | O(n log n log(S_n^2)) | O(n) | `dynamic-programming.0-1-knapsack` | [The aliens trick](/algorithms/dynamic-programming/aliens-trick) |
| Bitmask dynamic programming | O(n 2^n) | O(2^n) | `foundations.complexity` | [Bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp) |
| Convex hull trick | O(n + q) amortized | O(n) | `foundations.complexity` | [Convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) |
| Dynamic programming on a directed acyclic graph | O(V + E) | O(V) | `graphs.topological-sort` | [Dynamic programming on a directed acyclic graph](/algorithms/dynamic-programming/dag-dp) |
| Digit dynamic programming | O(D * S * b) | O(D * S) | `foundations.complexity` | [Digit dynamic programming](/algorithms/dynamic-programming/digit-dp) |
| Divide-and-conquer optimization | O(k n log n) | O(n) | `dynamic-programming.0-1-knapsack` | [Divide-and-conquer optimization](/algorithms/dynamic-programming/divide-and-conquer-optimization) |
| Interval dynamic programming | O(n^3) | O(n^2) | `foundations.complexity` | [Interval dynamic programming](/algorithms/dynamic-programming/interval-dp) |
| Knuth optimization | O(n^2) | O(n^2) | `dynamic-programming.interval-dp` | [Knuth optimization](/algorithms/dynamic-programming/knuth-optimization) |
| The Li Chao tree | O(log k) per insertion and per query, after O(q log q) preprocessing | O(q) total, O(k) for the tree | `foundations.complexity` | [The Li Chao tree](/algorithms/dynamic-programming/li-chao-tree) |
| Longest increasing subsequence | O(n log n) | O(n) | `foundations.sorting` | [Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| Monotonic queue optimization | O(n) | O(n) | `foundations.complexity` | [Monotonic queue optimization](/algorithms/dynamic-programming/monotonic-queue-optimization) |
| Profile dynamic programming | O(rc 2^c) | O(2^c) | `foundations.complexity` | [Profile dynamic programming](/algorithms/dynamic-programming/profile-dp) |
| Subset transforms | O(n 2^n) | O(2^n) | `foundations.complexity` | [Subset transforms](/algorithms/dynamic-programming/subset-transforms) |
| Backtracking | O(b^d * t) in the worst case, far less with pruning | O(d + s) | `foundations.recursion` | [Backtracking](/algorithms/enumeration/backtracking) |
| Branch and bound | O(b * V), where V is the number of surviving nodes | O(n) | `enumeration.backtracking` | [Branch and bound](/algorithms/enumeration/branch-and-bound) |
| Complete search | O(n 2^n) for the subset contract, O(S c) for a candidate space of S candidates with a test of cost c | O(n) for the recursion, or O(1) beyond the input for a mask loop | `foundations.complexity` | [Complete search](/algorithms/enumeration/complete-search) |
| Constraint propagation | O(N), where N is the number of visited nodes, which is 856189 for n = 12 | O(n) for the recursion and O(1) masks per frame | `enumeration.backtracking` | [Constraint propagation](/algorithms/enumeration/constraint-propagation) |
| Gray codes | O(n 2^n) | O(n) auxiliary | `foundations.binary-representation` | [Gray codes](/algorithms/enumeration/gray-codes) |
| Iterative deepening | O(b^d) for branching factor b and solution depth d | O(d) auxiliary, plus O(n + m) for the graph | `foundations.recursion` | [Iterative deepening](/algorithms/enumeration/iterative-deepening) |
| Meet in the middle | O(n 2^(n/2)) | O(2^(n/2)) | `enumeration.subset-enumeration` | [Meet in the middle](/algorithms/enumeration/meet-in-the-middle) |
| Permutations | O(n * n!) | O(n) | `enumeration.backtracking` | [Permutations](/algorithms/enumeration/permutations) |
| Subset enumeration | O(2^n) per mask, O(n 2^n) with the subsets materialized | O(1) per mask, O(n) per subset | `foundations.binary-representation` | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| Amortized analysis | O(n) total for n pushes, O(1) amortized per push | O(n) for the array | `foundations.complexity` | [Amortized analysis](/algorithms/foundations/amortized-analysis) |
| Binary representation | O(1) per word operation | O(1) | `start.computational-foundations` | [Binary representation](/algorithms/foundations/binary-representation) |
| Complexity analysis | a method, not an algorithm | a method, not an algorithm | `start.computational-foundations` | [Complexity analysis](/algorithms/foundations/complexity) |
| Loop invariants | O(n) to read the array, then O(log n) probes | O(n) for the array, O(1) auxiliary | `foundations.complexity` | [Loop invariants](/algorithms/foundations/loop-invariants) |
| Recursion | the cost of its recurrence | O(d) for the call stack | `start.computational-foundations` | [Recursion](/algorithms/foundations/recursion) |
| Sorting | O(n log n) | O(n) for merge sort, O(1) for heapsort | `foundations.complexity` | [Sorting](/algorithms/foundations/sorting) |
| The time-memory tradeoff | O(n) preprocessing and O(1) per query for the full block table; O(n/B + B) per query for block totals alone | O(n + n/B) = O(n) for the full table; O(n/B) = O(sqrt n) for block totals alone | `foundations.complexity` | [The time-memory tradeoff](/algorithms/foundations/time-memory-tradeoff) |
| Closest pair | O(n log n) | O(n) | `geometry.convex-hull` | [Closest pair](/algorithms/geometry/closest-pair) |
| Convex hull | O(n log n) | O(n) | `foundations.sorting` | [Convex hull](/algorithms/geometry/convex-hull) |
| Integer geometry | O(n log C) | O(n) | `number-theory.extended-euclidean` | [Integer geometry](/algorithms/geometry/integer-geometry) |
| K-D trees | O(n log^2 n) build with a full sort per node; O(log n) average per query and O(n) worst case | O(n) | `foundations.sorting` | [K-D trees](/algorithms/geometry/kd-trees) |
| Point in polygon | O(n) per query | O(1) per query | `geometry.convex-hull` | [Point in polygon](/algorithms/geometry/point-in-polygon) |
| Robust predicates | O(1) per query | O(1) | `foundations.complexity` | [Robust predicates](/algorithms/geometry/robust-predicates) |
| Rotating calipers | O(n log n) for the whole algorithm | O(n) | `geometry.convex-hull` | [Rotating calipers](/algorithms/geometry/rotating-calipers) |
| The smallest enclosing circle | O(n^3) worst case; O(n) expected with a random shuffle | O(n) for the points, O(1) auxiliary | `geometry.convex-hull` | [The smallest enclosing circle](/algorithms/geometry/smallest-enclosing-circle) |
| Sweep line | O(n log n) for the decision version | O(n) | `geometry.convex-hull` | [Sweep line](/algorithms/geometry/sweep-line) |
| 0-1 BFS | O(V + E) | O(V + E) | `graphs.bfs` | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Articulation points | O(V + E) | O(V) | `graphs.representation` | [Articulation points](/algorithms/graphs/articulation-points) |
| Bellman-Ford | O(VE) | O(V) | `graphs.representation` | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| Breadth-first search | O(V + E) | O(V + E) | `graphs.representation` | [Breadth-first search](/algorithms/graphs/bfs) |
| Bipartite matching | O(E sqrt{V}) | O(V) beyond the adjacency list | `graphs.representation` | [Bipartite matching](/algorithms/graphs/bipartite-matching) |
| The two-coloring test for a bipartite graph | O(V + E) | O(V + E) | `graphs.representation` | [The two-coloring test for a bipartite graph](/algorithms/graphs/bipartite-two-coloring) |
| Bridges | O(V + E) | O(V) | `graphs.representation` | [Bridges](/algorithms/graphs/bridges) |
| Depth-first search | O(V + E) | O(V + E) | `graphs.representation` | [Depth-first search](/algorithms/graphs/dfs) |
| Dijkstra's algorithm | O((V + E) log V) | O(V + E) | `graphs.representation` | [Dijkstra's algorithm](/algorithms/graphs/dijkstra) |
| Dominator trees | O(V E) per pass, two or three passes in practice | O(V + E) | `graphs.representation` | [Dominator trees](/algorithms/graphs/dominator-trees) |
| Disjoint set union | O((n + q) alpha(n)) | O(n) | `foundations.recursion` | [Disjoint set union](/algorithms/graphs/dsu) |
| Euler tours in graphs | O(V + E) | O(V) beyond the adjacency list and the output | `graphs.representation` | [Euler tours in graphs](/algorithms/graphs/euler-tour) |
| Floyd-Warshall and all-pairs shortest paths | O(V^3) | O(V^2) | `graphs.representation` | [Floyd-Warshall and all-pairs shortest paths](/algorithms/graphs/floyd-warshall) |
| The Hungarian algorithm | O(n^3) | O(n^2) | `graphs.bipartite-matching` | [The Hungarian algorithm](/algorithms/graphs/hungarian-algorithm) |
| Johnson's algorithm | O(VE + V(V + E) log V) | O(V + E) | `graphs.dijkstra` | [Johnson's algorithm](/algorithms/graphs/johnson) |
| Minimum cost flow | O(F (V + E) log V) | O(V + E) | `graphs.representation` | [Minimum cost flow](/algorithms/graphs/minimum-cost-flow) |
| Minimum cut | O(V E^2) for Edmonds-Karp, O(V^2 E) for Dinic | O(V + E) | `graphs.representation` | [Minimum cut](/algorithms/graphs/minimum-cut) |
| Minimum spanning tree | O(E log E) | O(V + E) | `graphs.representation` | [Minimum spanning tree](/algorithms/graphs/mst) |
| Graph representation | O(V + E) to build | O(V + E) for an adjacency list | `foundations.complexity` | [Graph representation](/algorithms/graphs/representation) |
| Strongly connected components | O(V + E) | O(V) for Tarjan, O(V + E) for Kosaraju | `graphs.representation` | [Strongly connected components](/algorithms/graphs/strongly-connected-components) |
| Topological sort | O(V + E) | O(V) | `graphs.representation` | [Topological sort](/algorithms/graphs/topological-sort) |
| Greedy with a feasibility oracle | O(n log n) | O(n) | `foundations.sorting` | [Greedy with a feasibility oracle](/algorithms/greedy/feasibility-oracle) |
| Interval scheduling | O(n log n) | O(n) | `foundations.sorting` | [Interval scheduling](/algorithms/greedy/interval-scheduling) |
| Sorting by several keys | O(n log n) | O(n) | `foundations.sorting` | [Sorting by several keys](/algorithms/greedy/multi-key-sorting) |
| Scheduling with deadlines and release times | O(n log n) | O(n) | `foundations.sorting` | [Scheduling with deadlines and release times](/algorithms/greedy/scheduling-deadlines-and-release-times) |
| Chinese remainder theorem | O(k log M) | O(1) | `number-theory.modular-arithmetic` | [Chinese remainder theorem](/algorithms/number-theory/chinese-remainder) |
| The discrete logarithm | O(sqrt m) modular multiplications per query | O(sqrt m) | `number-theory.modular-arithmetic` | [The discrete logarithm](/algorithms/number-theory/discrete-logarithm) |
| Euler's totient function and Euler's theorem | O(sqrt n) for one totient, O(log m) for one power | O(1) | `foundations.complexity` | [Euler's totient function and Euler's theorem](/algorithms/number-theory/euler-totient) |
| The extended Euclidean algorithm | O(log min(a, b)) | O(1) | `foundations.complexity` | [The extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean) |
| The fast Fourier transform | O(n log n) | O(n) | `foundations.complexity` | [The fast Fourier transform](/algorithms/number-theory/fft) |
| Matrix exponentiation | O(n^3 log k) | O(n^2) | `number-theory.modular-arithmetic` | [Matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) |
| Miller-Rabin primality test | O(k log n) modular multiplications with k = 12 | O(1) | `number-theory.modular-arithmetic` | [Miller-Rabin primality test](/algorithms/number-theory/miller-rabin) |
| Modular arithmetic | O(log m) per operation | O(1) | `foundations.complexity` | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |
| The number-theoretic transform | O(n log n) | O(n) | `number-theory.modular-arithmetic` | [The number-theoretic transform](/algorithms/number-theory/ntt) |
| Pollard's rho | expected O(n^{1/4}) iterations for a semiprime, each O(log n) | O(log n) for the stack of pending cofactors | `number-theory.modular-arithmetic` | [Pollard's rho](/algorithms/number-theory/pollard-rho) |
| Prime factorization | O(sqrt{n}) | O(1) | `foundations.complexity` | [Prime factorization](/algorithms/number-theory/prime-factorization) |
| Sieve of Eratosthenes | O(n log log n) | O(n) | `foundations.complexity` | [Sieve of Eratosthenes](/algorithms/number-theory/sieve) |
| Fenwick tree | O(log n) per operation | O(n) | `arrays.prefix-sums` | [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Implicit segment trees | O(log C) per operation | O(k log C) for k touched positions | `range-queries.segment-tree` | [Implicit segment trees](/algorithms/range-queries/implicit-segment-tree) |
| Lazy propagation | O(log n) per range update and per range query | O(n) | `range-queries.segment-tree` | [Lazy propagation](/algorithms/range-queries/lazy-propagation) |
| Merge sort trees | O(log^2 n) per rank query; O(log C log^2 n) per k-th smallest query | O(n log n) | `range-queries.segment-tree` | [Merge sort trees](/algorithms/range-queries/merge-sort-tree) |
| Mo's algorithm | O((n + q) sqrt n) for the batch, plus O(q log q) to sort | O(n + q) | `arrays.prefix-sums` | [Mo's algorithm](/algorithms/range-queries/mos-algorithm) |
| Persistent segment trees | O(n log n) to build; O(log n) per query | O(n log n) | `range-queries.segment-tree` | [Persistent segment trees](/algorithms/range-queries/persistent-segment-tree) |
| Segment tree beats | amortized O(log n) per operation | O(n) | `range-queries.segment-tree` | [Segment tree beats](/algorithms/range-queries/segment-tree-beats) |
| Segment tree | O(log n) per operation | O(n) | `arrays.prefix-sums` | [Segment tree](/algorithms/range-queries/segment-tree) |
| Sparse table | O(n log n) to build, O(1) per query | O(n log n) | `arrays.prefix-sums` | [Sparse table](/algorithms/range-queries/sparse-table) |
| Square-root decomposition | O(n) to build, O(1) per point update, O(sqrt n) per range query | O(n) | `arrays.prefix-sums` | [Square-root decomposition](/algorithms/range-queries/sqrt-decomposition) |
| Wavelet trees | O(log sigma) per k-th smallest or rank query; O(n log sigma) to build | O(n log sigma) prefix counts, plus O(n) working arrays | `range-queries.merge-sort-tree` | [Wavelet trees](/algorithms/range-queries/wavelet-tree) |
| Binary search on the answer | O(c log R) | O(1) beyond the check's own working space | `searching.binary-search` | [Binary search on the answer](/algorithms/searching/binary-search-on-answer) |
| Binary search | O(log n) | O(1) | `foundations.complexity` | [Binary search](/algorithms/searching/binary-search) |
| Parametric search | O(n log U) | O(1) | `searching.binary-search` | [Parametric search](/algorithms/searching/parametric-search) |
| The sliding window variants with a state machine | O(n) | O(1) for a fixed byte alphabet, O(sigma) for a hash map | `searching.sliding-window` | [The sliding window variants with a state machine](/algorithms/searching/sliding-window-variants) |
| Sliding window | O(n) | O(1) for a running sum, O(sigma) for a frequency map | `searching.two-pointers` | [Sliding window](/algorithms/searching/sliding-window) |
| Search over a sorted range of indices | O(log n) | O(1) | `searching.binary-search` | [Search over a sorted range of indices](/algorithms/searching/sorted-range-search) |
| Ternary search | O(log_{3/2}(L / varepsilon)) iterations, each costing two evaluations | O(1) | `foundations.complexity` | [Ternary search](/algorithms/searching/ternary-search) |
| The individual two-pointer patterns | O(n) | O(1) | `foundations.complexity` | [The individual two-pointer patterns](/algorithms/searching/two-pointer-patterns) |
| Two pointers | O(n) | O(1) | `foundations.complexity` | [Two pointers](/algorithms/searching/two-pointers) |
| Aho-Corasick | O(26L + n) for a lowercase alphabet | O(26L) for the transitions, where L is the total pattern length | `strings.trie` | [Aho-Corasick](/algorithms/strings/aho-corasick) |
| Knuth-Morris-Pratt | O(n + m) | O(m) | `foundations.complexity` | [Knuth-Morris-Pratt](/algorithms/strings/kmp) |
| The Manacher algorithm | O(n) | O(n) | `foundations.complexity` | [The Manacher algorithm](/algorithms/strings/manacher) |
| The minimal rotation of a string | O(n) | O(1) beyond the input string | `foundations.complexity` | [The minimal rotation of a string](/algorithms/strings/minimal-rotation) |
| Palindrome trees (eertree) | O(n) | O(n) | `foundations.complexity` | [Palindrome trees (eertree)](/algorithms/strings/palindrome-tree) |
| Rolling hash | O(n) to build, O(1) per substring query | O(n) for the two tables | `foundations.complexity` | [Rolling hash](/algorithms/strings/rolling-hash) |
| Suffix array | O(n log n) | O(n) | `foundations.sorting` | [Suffix array](/algorithms/strings/suffix-array) |
| The suffix automaton | O(26n) for a lowercase alphabet | O(26n) for the transition table | `strings.trie` | [The suffix automaton](/algorithms/strings/suffix-automaton) |
| Suffix trees | O(n^2) for the published quadratic construction; O(n) for both answers after the build | O(n) nodes with 27 child slots each | `strings.trie` | [Suffix trees](/algorithms/strings/suffix-tree) |
| Trie | O(L) per word | O(N) nodes, plus one pointer per alphabet symbol per node when the children are stored densely | `foundations.complexity` | [Trie](/algorithms/strings/trie) |
| The Z algorithm | O(n) to build, O(n + m) for a search | O(n) | `foundations.complexity` | [The Z algorithm](/algorithms/strings/z-algorithm) |
| Binary lifting | O(n log n) to build, O(log n) per query | O(n log n) | `graphs.bfs` | [Binary lifting](/algorithms/trees/binary-lifting) |
| Centroid decomposition | O(n log n) | O(n) | `graphs.dfs` | [Centroid decomposition](/algorithms/trees/centroid-decomposition) |
| Dynamic trees | O(log n) amortized per operation | O(n) | `trees.lca` | [Dynamic trees](/algorithms/trees/dynamic-trees) |
| Euler tour for trees | O(n) to build, O(log n) per query with a Fenwick tree | O(n) | `graphs.dfs` | [Euler tour for trees](/algorithms/trees/euler-tour) |
| Heavy-light decomposition | O(n) to build, O(log n) per path query | O(n) | `graphs.bfs` | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| Lowest common ancestor | O((n + m) log n) to build, O(log n) per query | O(n log n) | `graphs.bfs` | [Lowest common ancestor](/algorithms/trees/lca) |
| Rerooting | O(n) | O(n) | `graphs.dfs` | [Rerooting](/algorithms/trees/rerooting) |
| Small-to-large merging | O(n log n) expected | O(n) | `graphs.dfs` | [Small-to-large merging](/algorithms/trees/small-to-large-merging) |
| Tree dynamic programming | O(n) | O(n) | `graphs.bfs` | [Tree dynamic programming](/algorithms/trees/tree-dp) |
| Tree hashing | O(n log n + m log m) | O(n + m) | `trees.tree-dp` | [Tree hashing](/algorithms/trees/tree-hashing) |
| Virtual trees | O(n log n) to preprocess, O(k log k + k log n) per query | O(n log n) for the ancestor table, O(k) for the virtual tree | `trees.lca` | [Virtual trees](/algorithms/trees/virtual-tree) |

<!-- aayntn:core:end -->

The first row is the odd one out, and it is the most important. Complexity analysis is not a technique you apply to a problem; it is the tool that tells you which technique you can afford. Every bound in the other rows was produced by it.

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
