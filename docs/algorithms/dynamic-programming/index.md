---
id: dynamic-programming.index
title: The Dynamic programming
summary: Solve a problem by defining the state that the answer depends on and writing the rule that carries one state to the next.
division: []
subjects: [dynamic-programming]
level: intermediate
importance: common-contest-technique
keywords: [dynamic programming, recurrence, state, knapsack, longest increasing subsequence]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Dynamic programming is the subject of problems whose answer is composed of answers to smaller versions of the same question. The technique is not "write a table". The technique is to find the state, define the meaning of each entry, and write the recurrence that relates the entries.

Everything else follows from that. The table size is the product of the state dimensions, the transition is the recurrence, and the iteration order is forced by which states depend on which. A competitor who can state the recurrence can write the code, and a competitor who cannot will spend the contest guessing.

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| 0/1 knapsack | $O(nW)$ | $O(W)$ | `foundations.complexity` | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| Longest increasing subsequence | $O(n \log n)$ | $O(n)$ | `foundations.sorting` | [Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| Convex hull trick | $O(n + q)$ amortized | $O(n)$ | `foundations.complexity` | [Convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) |
| Digit dynamic programming | $O(D \cdot S \cdot b)$ | $O(D \cdot S)$ | `foundations.complexity` | [Digit dynamic programming](/algorithms/dynamic-programming/digit-dp) |
| Bitmask dynamic programming | $O(n 2^n)$ | $O(2^n)$ | `enumeration.subset-enumeration` | [Bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp) |
| Interval dynamic programming | $O(n^3)$ | $O(n^2)$ | `foundations.recursion` | [Interval dynamic programming](/algorithms/dynamic-programming/interval-dp) |
| Directed acyclic graph dynamic programming | $O(V + E)$ | $O(V)$ | `graphs.topological-sort` | [Directed acyclic graph dynamic programming](/algorithms/dynamic-programming/dag-dp) |

The knapsack article is the canonical example: a state of "the best value with capacity at most $w$", a recurrence that either takes the item or does not, and an iteration order that guarantees each item is used at most once. The longest increasing subsequence article shows the same idea with a different state and a faster implementation, and the convex hull trick article shows what happens when the transition itself is the bottleneck.

The last four rows are the subject's other four shapes of state. The digit program makes the digits of a bound the state. The bitmask program makes a subset of items the state. The interval program makes a pair of endpoints the state. The directed acyclic graph program makes a vertex the state and lets the topological order supply the iteration order.

Three of the bounds need a word of explanation. The digit program's $D$ is the number of digits, $S$ is the number of distinct accumulator values, and $b$ is the base, which is $10$ for decimal digits, so the constant factor of ten is what matters in practice. The bitmask row is the subset form; the ordered form is $O(n^2 2^n)$ in time and $O(n 2^n)$ in space. The directed acyclic graph row counts the values only; the graph itself is $O(V + E)$.

## Recognition signals

- **"maximum total"**, **"minimum cost"**, **"largest possible"**, where the answer is built by combining independent choices.
- **"each item may be used at most once"**, **"each may be taken or left"**, **"choose a subset"**. The phrase decides between the 0/1 and the unbounded variants.
- **"the capacity is $W$"**, **"the total weight must not exceed"**, **"the value and the weight"**. The two-attribute formulation of knapsack, and the reason its table is indexed by capacity.
- **"the longest"** or **"the largest"** of something that ends at each position: "the longest increasing subsequence ending at $i$", "the best path ending at $i$". A recurrence over an ending position is the most common shape.
- **"partition the"**, **"break the"**, **"how many ways to split"**. A recurrence over a prefix length.
- **"for every prefix"** or **"for every suffix"**. The state is a prefix or a suffix, and the recurrence slides by one.
- **"the digits of"**, **"up to $N$"**, **"no digit equals"**, **"the digit sum is"**. That is a digit program, and it is the standard answer to a whole family of counting questions.
- **"the order of the items matters"**, **"which items come before which"**, with $n \le 20$. That is a bitmask program, and the bound of $20$ is the bound of the state size.
- **"the interval"**, **"the subarray"**, **"where the split happens"**. That is an interval program, and it is the shape of the matrix chain, the burst balloons, and the palindrome partition problems.
- **"in what order"**, **"a sequence of dependencies"**, **"a path through a graph"**. That is a directed acyclic graph program, and the topological sort supplies the iteration order for free.

The signal that rules the subject out is a question whose subproblems do not overlap, which is exactly the condition under which a greedy choice or a plain search is correct.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Choose items under a capacity, each used once | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| Choose items under a capacity, each usable repeatedly | Unbounded knapsack, the same table read in the other order |
| The longest increasing subsequence of a sequence | [Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| A recurrence whose transition is a linear function of the state | The [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) |
| A recurrence with $k$ dimensions, all small | A $k$-dimensional table |
| The state is a subset of $n$ items, with $n \le 20$ | [Bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp) |
| The state is the position inside a number | [Digit dynamic programming](/algorithms/dynamic-programming/digit-dp) |
| The state is a pair of endpoints | [Interval dynamic programming](/algorithms/dynamic-programming/interval-dp) |
| The state is a vertex of a directed acyclic graph | [Directed acyclic graph dynamic programming](/algorithms/dynamic-programming/dag-dp) |
| The number of states is exponential and the state repeats | Memoization over the recursive formulation |
| The subproblems do not overlap | Not this subject; use [greedy](/algorithms/greedy/) or [searching](/algorithms/searching/) |

The bottom row is the useful one. Before writing a table, check that the recursion really does revisit the same subproblems. If it does not, you are writing a search, and the search will be exponential.

## What this subject implies but does not yet cover

- **Profile dynamic programming.** A state that records the shape of the frontier of a partially built solution, which is how the traveling salesman problem and the plug-like grid problems are solved.
- **The Li Chao tree.** A structure that supports inserting a line and querying the minimum at a point in $O(\log n)$, without the monotone-slope condition the convex hull trick requires.
- **Divide-and-conquer optimization.** Computing a dynamic program in $O(n \log n)$ when the recurrence's transition ranges are monotone in the state index.
- **Knuth optimization.** The same speedup when the recurrence satisfies the quadrangle inequality, which is what makes the interval dynamic program fast.
- **Monotonic queue optimization.** Reducing a transition from $O(n^2)$ to $O(n)$ when the transition is a minimum over a sliding window of the previous row. The [monotonic queue article](/algorithms/arrays/monotonic-queue) builds the structure, but the dynamic program that uses it is not written up.
- **Subset transforms.** The fast zeta and Mobius transforms over the subsets of a set, which turn $O(3^n)$ subset convolution into $O(n 2^n)$. The subset sum transform is a variant of the [bitmask article](/algorithms/dynamic-programming/bitmask-dp), and the general transforms are not.
- **The aliens trick.** Lagrangian optimization, which removes a dimension from a minimization by penalizing the count and then searching for the penalty that makes the optimum change count, at the cost of a binary search over the penalty.

## Related subjects

- [Trees and decompositions](/algorithms/trees/) is dynamic programming over a tree, and the tree case is usually easier to state than the general case.
- [Graphs](/algorithms/graphs/) supplies the DAG on which many dynamic programs run.
- [Enumeration](/algorithms/enumeration/) is the naive version of the same idea: a dynamic program is an enumeration whose repeated subproblems have been merged.
- [Searching](/algorithms/searching/) often replaces a dynamic program whose recurrence can be rearranged into a monotone predicate.
- The [academy](/start/) introduces the recurrence as the way to write down an answer before the encyclopedia does, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
