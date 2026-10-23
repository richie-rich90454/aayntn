---
id: reference.glossary
title: The glossary
summary: The vocabulary of the encyclopedia, defined in one line each, with a pointer to the article that teaches it.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [glossary, vocabulary, definitions, terminology]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

The encyclopedia uses a specific vocabulary, and a reader who does not know a word cannot read the sentence containing it. This page defines the terms that appear across more than one subject, each in a single sentence, with a link to the article that teaches it.

Terms are listed alphabetically. Where the encyclopedia does not yet have an article on a technique, the entry says so and points at the subject page that describes it, rather than pretending the technique is covered.

Where a term is taught in the [mathematical reference](/mathematics/), the link points there; where it is taught in an algorithm article, the link points at that article; and where it belongs to the contest process rather than to an algorithm, the link points at [Contest problem-solving literacy](/start/from-ap-csa/part-6-contest-literacy).

<dl>
<dt>Adjacency list</dt>
<dd>A representation of a graph in which each vertex stores the list of its neighbors. An undirected edge is stored twice, once in each endpoint's list. See <a href="/algorithms/graphs/representation">Graph representation</a>.</dd>

<dt>Adjacency matrix</dt>
<dd>A representation of a graph as a table indexed by vertices, where a cell holds whether an edge exists. It uses $O(V^2)$ space and answers an edge query in $O(1)$, and it is only competitive for dense graphs. See <a href="/algorithms/graphs/representation">Graph representation</a>.</dd>

<dt>Amortized</dt>
<dd>Describing a cost that is small on average over a sequence of operations, even when an individual operation can be expensive. See <a href="/start/from-ap-csa/part-2-algorithm-analysis">Algorithm analysis</a>.</dd>

<dt>Amortized analysis</dt>
<dd>The method of bounding the total cost of a sequence of operations by dividing it among the operations, rather than bounding each operation separately. Appending to a growing array is $O(n)$ in the worst individual case but $O(1)$ amortized. See <a href="/start/from-ap-csa/part-2-algorithm-analysis">Algorithm analysis</a>.</dd>

<dt>Backtracking</dt>
<dd>A search that builds a solution incrementally, abandons a partial solution as soon as it is shown to be impossible, and tries the next choice. See <a href="/algorithms/enumeration/backtracking">Backtracking</a>.</dd>

<dt>Base case</dt>
<dd>The branch of a recursive function that returns without recursing, and that therefore terminates the recursion. See <a href="/algorithms/foundations/recursion">Recursion</a>.</dd>

<dt>Bellman-Ford</dt>
<dd>A single-source shortest-path algorithm that handles negative edge weights in $O(VE)$ time, at the cost of being far slower than Dijkstra's algorithm. See <a href="/algorithms/graphs/bellman-ford">Bellman-Ford</a>.</dd>

<dt>Big O</dt>
<dd>An asymptotic upper bound on a function, written $O(f(n))$, that holds for all sufficiently large inputs. See <a href="/algorithms/foundations/complexity">Complexity analysis</a>.</dd>

<dt>Binary lifting</dt>
<dd>A table of ancestors in which entry $[v][k]$ is the ancestor of $v$ that is $2^k$ steps above it, built in $O(n \log n)$ and queried in $O(\log n)$. See <a href="/algorithms/trees/lca">Lowest common ancestor</a>.</dd>

<dt>Binary search</dt>
<dd>A search over a sorted range that discards half the remaining candidates at each step, taking $O(\log n)$ time. See <a href="/algorithms/searching/binary-search">Binary search</a>.</dd>

<dt>Bitmask</dt>
<dd>An integer whose bits encode a set of small choices, one bit per choice, so that subset enumeration becomes a loop over integers. See <a href="/algorithms/foundations/binary-representation">Binary representation</a>.</dd>

<dt>Brute force</dt>
<dd>The simplest program that computes the answer, written without optimization, used as a reference implementation and as a partial solution. See <a href="/start/from-ap-csa/part-6-contest-literacy">Contest problem-solving literacy</a>.</dd>

<dt>Cartesian tree</dt>
<dd>The tree formed from a sequence by making the smallest element the root and recursing on the parts to its left and right. Its nodes are in-order the original sequence. This encyclopedia does not yet have an article on it; see <a href="/algorithms/trees/">Trees and decompositions</a>.</dd>

<dt>Centroid decomposition</dt>
<dd>The technique of splitting a tree at a vertex whose removal leaves components of at most half the size, and recursing, which reduces many tree problems to $O(n \log n)$. This encyclopedia does not yet have an article on it; see <a href="/algorithms/trees/">Trees and decompositions</a>.</dd>

<dt>Connected component</dt>
<dd>A maximal set of vertices in which every pair is joined by a path. See <a href="/algorithms/graphs/bfs">Breadth-first search</a>.</dd>

<dt>Convex hull</dt>
<dd>The smallest convex polygon containing a given set of points, computable in $O(n \log n)$. See <a href="/algorithms/geometry/convex-hull">Convex hull</a> and <a href="/algorithms/geometry/">Computational geometry</a>.</dd>

<dt>Convex hull trick</dt>
<dd>The technique of maintaining a set of lines and querying their maximum at a given point, in $O(\log n)$ per operation after a $O(n \log n)$ build. See <a href="/algorithms/dynamic-programming/convex-hull-trick">Convex hull trick</a>.</dd>

<dt>Counterexample</dt>
<dd>A specific input on which a program produces a wrong answer, used as a witness that the program is incorrect. See <a href="/start/from-ap-csa/part-6-contest-literacy">Contest problem-solving literacy</a>.</dd>

<dt>Cross product</dt>
<dd>The scalar $x_1 y_2 - x_2 y_1$ of two vectors, whose sign gives the orientation of the three points that define them. See <a href="/algorithms/geometry/">Computational geometry</a> and <a href="/mathematics/">the mathematical reference</a>.</dd>

<dt>Cycle</dt>
<dd>A closed path in a graph that visits some vertex more than once. Detecting a cycle is the defining test of a depth-first search with three states. See <a href="/algorithms/graphs/dfs">Depth-first search</a>.</dd>

<dt>DAG</dt>
<dd>A directed acyclic graph, in which a topological order exists and every subproblem can be solved by processing vertices in that order. See <a href="/algorithms/graphs/topological-sort">Topological sort</a>.</dd>

<dt>Decomposition</dt>
<dd>The technique of splitting a problem into smaller independent or nearly independent subproblems whose answers combine into the original answer. See <a href="/algorithms/trees/heavy-light-decomposition">Heavy-light decomposition</a>.</dd>

<dt>Differential testing</dt>
<dd>Comparing an implementation under test against a trusted reference on the same inputs, so that a disagreement becomes a counterexample. See <a href="/start/from-ap-csa/part-6-contest-literacy">Contest problem-solving literacy</a>.</dd>

<dt>Difference array</dt>
<dd>An array in which a range update is recorded as two writes at its endpoints, so that the updated values are recovered by taking prefix sums. See <a href="/algorithms/arrays/difference-arrays">Difference arrays</a>.</dd>

<dt>Disjoint set union</dt>
<dd>A structure that maintains a partition of elements into sets and supports merging two sets and testing membership, in amortized $O(\alpha(n))$ time. See <a href="/algorithms/graphs/dsu">Disjoint set union</a>.</dd>

<dt>Dominance</dt>
<dd>The relation saying that one candidate is never better than another because it is no larger in every coordinate, so that the dominated candidate can be discarded. See <a href="/algorithms/dynamic-programming/longest-increasing-subsequence">Longest increasing subsequence</a>.</dd>

<dt>Dot product</dt>
<dd>The scalar $x_1 x_2 + y_1 y_2$ of two vectors, which relates the length of their sum to the angle between them. See <a href="/mathematics/">the mathematical reference</a>.</dd>

<dt>Dynamic programming</dt>
<dd>The technique of solving a problem by combining answers to overlapping subproblems, each computed once and stored. See <a href="/algorithms/dynamic-programming/">Dynamic programming</a>.</dd>

<dt>Euler tour</dt>
<dd>A numbering of the vertices of a tree in which every subtree occupies a contiguous interval, which turns a subtree query into a range query. See <a href="/algorithms/trees/lca">Lowest common ancestor</a>.</dd>

<dt>Exchange argument</dt>
<dd>A proof that a greedy choice is safe: take an optimal solution, find where it disagrees with the choice, swap the two, and show the result is still feasible and no worse. See <a href="/algorithms/greedy/interval-scheduling">Interval scheduling</a>.</dd>

<dt>Expected value</dt>
<dd>The probability-weighted average of the possible outcomes of a random variable, used to reason about randomized algorithms. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Extended Euclidean algorithm</dt>
<dd>The Euclidean algorithm extended to return the coefficients of Bézout's identity, which gives the modular inverse of an integer modulo another. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Factorial</dt>
<dd>The product of all integers from $1$ to $n$, written $n!$, which counts the orderings of $n$ distinct objects. See <a href="/algorithms/combinatorics/">Combinatorics</a>.</dd>

<dt>Fenwick tree</dt>
<dd>A structure that supports prefix sums and point updates in $O(\log n)$ time each, and range sums as a difference of two prefix sums. See <a href="/algorithms/range-queries/fenwick-tree">Fenwick tree</a>.</dd>

<dt>Fermat's little theorem</dt>
<dd>The statement that for a prime $p$ and an $a$ not divisible by $p$, $a^{p-1} \equiv 1 \pmod p$, which turns a modular inverse into a modular power. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Greedy algorithm</dt>
<dd>An algorithm that makes the locally best choice at each step and never revises it, and that is correct only when the choice can be proved safe. See <a href="/algorithms/greedy/">Greedy methods</a>.</dd>

<dt>Hash table</dt>
<dd>A structure that maps keys to values in expected constant time, using a hash function to place each key in a bucket. See <a href="/start/from-ap-csa/part-4-data-structures-and-modeling">Data structures and modeling</a>.</dd>

<dt>Heavy path</dt>
<dd>A path in a tree along which every vertex's largest child subtree continues, so that a path can be split into $O(\log n)$ heavy segments. See <a href="/algorithms/trees/heavy-light-decomposition">Heavy-light decomposition</a>.</dd>

<dt>Heavy-light decomposition</dt>
<dd>The technique of splitting tree paths into $O(\log n)$ segments, so that a path query becomes $O(\log n)$ range queries over a linearized tree. See <a href="/algorithms/trees/heavy-light-decomposition">Heavy-light decomposition</a>.</dd>

<dt>Implicit treap</dt>
<dd>A randomized balanced binary search tree whose positions are determined by the priorities of its nodes rather than by explicit keys, giving it $O(\log n)$ expected operations. This encyclopedia does not yet have an article on it; see <a href="/algorithms/advanced/">Advanced algorithms</a>.</dd>

<dt>Inclusion and exclusion</dt>
<dd>The counting technique that adds the sizes of overlapping sets and then subtracts their intersections, adding back the triple intersections and so on. See <a href="/mathematics/">the mathematical reference</a>.</dd>

<dt>Induction</dt>
<dd>A proof that a claim holds for every natural number by establishing a base case and a step from $k$ to $k+1$. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Invariant</dt>
<dd>A statement about the state of a program that holds before a loop and is preserved by each iteration, and whose truth at the end gives the answer. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Inversion</dt>
<dd>A pair of indices $i < j$ in a sequence whose values satisfy $a_i > a_j$, so that counting inversions measures how far the sequence is from sorted. See <a href="/algorithms/range-queries/fenwick-tree">Fenwick tree</a>.</dd>

<dt>Lazy propagation</dt>
<dd>The technique of deferring an update to the children of a node until a query forces it to be applied, so that a range update costs $O(\log n)$. See <a href="/algorithms/range-queries/segment-tree">Segment tree</a>.</dd>

<dt>Linear scan</dt>
<dd>A pass over the data in its natural order, examining each element once, which costs $O(n)$ time and $O(1)$ extra space. See <a href="/algorithms/arrays/prefix-sums">Prefix sums</a>.</dd>

<dt>Lower bound</dt>
<dd>The first index in a sorted range at which a predicate holds, found by binary search; the smallest value at which a monotone condition becomes true. See <a href="/algorithms/searching/binary-search">Binary search</a>.</dd>

<dt>Manhattan distance</dt>
<dd>The distance between two points measured as the sum of the absolute differences of their coordinates, which is the number of unit grid steps between them. See <a href="/algorithms/geometry/">Computational geometry</a>.</dd>

<dt>Memoization</dt>
<dd>Caching the result of a function call so that a repeated call with the same arguments returns the stored answer instead of recomputing it. See <a href="/algorithms/foundations/recursion">Recursion</a>.</dd>

<dt>Modular arithmetic</dt>
<dd>Arithmetic on the residues of integers modulo a fixed modulus, in which the answer is the unique representative in a stated range. See <a href="/algorithms/number-theory/">Number theory</a>.</dd>

<dt>Modular inverse</dt>
<dd>The value $a^{-1}$ with $a \cdot a^{-1} \equiv 1 \pmod m$, which turns division modulo $m$ into multiplication. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Monotonic queue</dt>
<dd>A deque whose elements are kept in increasing or decreasing order, so that the front always holds the extreme of the window; combined with a window it answers every window minimum in $O(n)$ total. See <a href="/algorithms/arrays/">Arrays and sequences</a> and <a href="/algorithms/searching/sliding-window">Sliding window</a>.</dd>

<dt>Monotonic stack</dt>
<dd>A stack whose elements are kept in increasing or decreasing order, so that elements made useless by a new arrival are discarded at once. This encyclopedia does not yet have an article on it; see <a href="/algorithms/searching/">Searching</a>.</dd>

<dt>Off-by-one error</dt>
<dd>A bug in which a loop bound or an index is off by exactly one, which usually shows up as a missing element at an end or an out-of-bounds access at the last iteration. See <a href="/start/from-ap-csa/part-6-contest-literacy">Contest problem-solving literacy</a>.</dd>

<dt>Offline query</dt>
<dd>A question whose answer may be computed after all the questions have been read, which allows the questions to be reordered and answered together. See <a href="/algorithms/advanced/">Advanced algorithms</a>.</dd>

<dt>Orientation test</dt>
<dd>The decision of whether three points turn left, turn right, or lie on a line, computed from the sign of a cross product. See <a href="/algorithms/geometry/">Computational geometry</a>.</dd>

<dt>Parent array</dt>
<dd>The array in which entry $v$ holds the parent of vertex $v$, which represents a rooted tree without storing any edges. See <a href="/algorithms/trees/tree-dp">Tree dynamic programming</a>.</dd>

<dt>Path compression</dt>
<dd>The disjoint set union optimization in which every visited node is repointed to the root of its set, flattening the structure and speeding later finds. See <a href="/algorithms/graphs/dsu">Disjoint set union</a>.</dd>

<dt>Pigeonhole principle</dt>
<dd>The statement that placing more objects than boxes forces some box to hold at least two objects, and the counting argument behind it. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Prefix sum</dt>
<dd>The running total of the first $k$ elements of an array, so that the sum of a range is the difference of two prefix sums. See <a href="/algorithms/arrays/prefix-sums">Prefix sums</a>.</dd>

<dt>Priority queue</dt>
<dd>A queue from which the element with the largest key is removed first, implemented with a binary heap, in $O(\log n)$ per operation. See <a href="/algorithms/graphs/dijkstra">Dijkstra's algorithm</a>.</dd>

<dt>Pruning</dt>
<dd>Abandoning a branch of a search as soon as it is known that it cannot lead to a valid solution, so that the search visits fewer states. See <a href="/algorithms/enumeration/backtracking">Backtracking</a>.</dd>

<dt>Range query</dt>
<dd>A question about a contiguous range of an array, such as its sum, minimum, or maximum, usually answered by a data structure built in advance. See <a href="/algorithms/range-queries/">Range query structures</a>.</dd>

<dt>Recursion</dt>
<dd>A function that calls itself on a smaller instance of the same problem, terminating at a base case. See <a href="/algorithms/foundations/recursion">Recursion</a>.</dd>

<dt>Sentinel</dt>
<dd>A distinguished value stored in a structure to mean "no value here", chosen so that it cannot be confused with a legitimate answer, such as $-\infty$ for a maximum over negatives. See <a href="/algorithms/range-queries/segment-tree">Segment tree</a>.</dd>

<dt>Segment tree</dt>
<dd>A tree over an array whose nodes store aggregates of their ranges, supporting range queries and range updates in $O(\log n)$ time each. See <a href="/algorithms/range-queries/segment-tree">Segment tree</a>.</dd>

<dt>Shortest path</dt>
<dd>A path between two vertices whose total weight is as small as possible, computed by breadth-first search when weights are equal, by Dijkstra's algorithm when they are nonnegative, and by Bellman-Ford when they may be negative. See <a href="/algorithms/graphs/dijkstra">Dijkstra's algorithm</a>.</dd>

<dt>Sieve of Eratosthenes</dt>
<dd>The method of marking the multiples of every prime up to $n$, producing every prime up to $n$ in $O(n \log \log n)$ time. See <a href="/start/from-ap-csa/part-3-discrete-mathematics">Discrete mathematics</a>.</dd>

<dt>Sliding window</dt>
<dd>The technique of maintaining a window over the data and moving its ends so that every index is added and removed at most once, giving $O(n)$ total time. See <a href="/algorithms/searching/sliding-window">Sliding window</a>.</dd>

<dt>Sparse table</dt>
<dd>A precomputed table of the aggregate of every range whose length is a power of two, giving $O(1)$ range queries on static data at the cost of $O(n \log n)$ space. See <a href="/algorithms/range-queries/sparse-table">Sparse table</a>.</dd>

<dt>Stars and bars</dt>
<dd>The formula for the number of ways to distribute $n$ identical items into $k$ distinct boxes, derived from the binomial coefficient by a bijection. See <a href="/algorithms/combinatorics/">Combinatorics</a> and <a href="/mathematics/">the mathematical reference</a>.</dd>

<dt>Stack overflow</dt>
<dd>The failure that occurs when a recursion consumes more call frames than the runtime has stack space, which crashes the process in C and C++, throws an error in Java, Python, and JavaScript, and is reported as a run-time error by a judge. See <a href="/start/from-ap-csa/part-1-computational-foundations">Computational foundations</a>.</dd>

<dt>Sweep line</dt>
<dd>The technique of moving a line across a set of events in sorted order, maintaining an active set, which answers many geometric and interval questions in linear time. See <a href="/algorithms/arrays/difference-arrays">Difference arrays</a>.</dd>

<dt>Tabulation</dt>
<dd>The bottom-up form of dynamic programming, in which a table is filled in a fixed order so that every needed entry has already been computed. See <a href="/algorithms/dynamic-programming/0-1-knapsack">0/1 knapsack</a>.</dd>

<dt>Time limit exceeded</dt>
<dd>The verdict for a program that was correct but did not finish a test within the allowed time, which is a complexity or constant-factor failure rather than a logical one. See <a href="/start/from-ap-csa/part-6-contest-literacy">Contest problem-solving literacy</a>.</dd>

<dt>Topological sort</dt>
<dd>An ordering of the vertices of a directed acyclic graph in which every edge points from an earlier vertex to a later one, computed in $O(V + E)$ time. See <a href="/algorithms/graphs/topological-sort">Topological sort</a>.</dd>

<dt>Tree</dt>
<dd>A connected acyclic graph, in which there is exactly one path between any two vertices and the ancestors of a vertex are totally ordered. See <a href="/algorithms/trees/">Trees and decompositions</a>.</dd>

<dt>Two pointers</dt>
<dd>The technique of maintaining two indices into a sequence and moving them by rules derived from the structure, so that a nested scan becomes a single pass. See <a href="/algorithms/searching/two-pointers">Two pointers</a>.</dd>

<dt>Union by size</dt>
<dd>The disjoint set union optimization in which the smaller set is always attached to the larger, which keeps the resulting trees shallow. See <a href="/algorithms/graphs/dsu">Disjoint set union</a>.</dd>

<dt>Upper bound</dt>
<dd>The first index in a sorted range at which a predicate stops holding, found by binary search; the smallest value past which a monotone condition fails. See <a href="/algorithms/searching/binary-search">Binary search</a>.</dd>

<dt>Wrong answer</dt>
<dd>The verdict for a program that ran and produced output differing from the expected output, which is a reasoning failure about the specification or the algorithm. See <a href="/start/from-ap-csa/part-6-contest-literacy">Contest problem-solving literacy</a>.</dd>

<dt>Zero-one BFS</dt>
<dd>The shortest-path algorithm for graphs whose edge weights are only zero or one, which uses a deque and runs in $O(V + E)$ time. See <a href="/algorithms/graphs/0-1-bfs">0-1 BFS</a>.</dd>
</dl>

## Reading the glossary

A definition here is deliberately short. The encyclopedia's articles do not repeat these definitions; they use them, and each article opens with its own formal statement of the problem it solves. When a definition here is not enough, follow the link.

If a term you meet in an article is not in this glossary, it is probably defined in the article that uses it, and it belongs to a technique that is described on a subject page but does not yet have an article of its own. The subject pages in the [encyclopedia](/algorithms/) each end with a list of the techniques they imply and do not yet cover, and those lists are the honest boundary of the material.
