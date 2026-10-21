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

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| 0/1 knapsack | $O(nW)$ | `foundations.complexity` | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| Longest increasing subsequence | $O(n \log n)$ | `foundations.sorting` | [Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| Convex hull trick | $O(n + q)$ amortized | `foundations.complexity` | [Convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) |

The knapsack article is the canonical example: a state of "the best value with capacity at most $w$", a recurrence that either takes the item or does not, and an iteration order that guarantees each item is used at most once. The longest increasing subsequence article shows the same idea with a different state and a faster implementation, and the convex hull trick article shows what happens when the transition itself is the bottleneck.

## Recognition signals

- **"maximum total"**, **"minimum cost"**, **"largest possible"**, where the answer is built by combining independent choices.
- **"each item may be used at most once"**, **"each may be taken or left"**, **"choose a subset"**. The phrase decides between the 0/1 and the unbounded variants.
- **"the capacity is $W$"**, **"the total weight must not exceed"**, **"the value and the weight"**. The two-attribute formulation of knapsack, and the reason its table is indexed by capacity.
- **"the longest"** or **"the largest"** of something that ends at each position: "the longest increasing subsequence ending at $i$", "the best path ending at $i$". A recurrence over an ending position is the most common shape.
- **"partition the"**, **"break the"**, **"how many ways to split"**. A recurrence over a prefix length.
- **"for every prefix"** or **"for every suffix"**. The state is a prefix or a suffix, and the recurrence slides by one.

The signal that rules the subject out is a question whose subproblems do not overlap, which is exactly the condition under which a greedy choice or a plain search is correct.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Choose items under a capacity, each used once | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| Choose items under a capacity, each usable repeatedly | Unbounded knapsack, the same table read in the other order |
| The longest increasing subsequence of a sequence | [Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| A recurrence whose transition is a linear function of the state | The [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) |
| The recurrence has $k$ dimensions, all small | A $k$-dimensional table |
| The state is a subset of $n$ items, with $n \le 20$ | Bitmask dynamic programming |
| The number of states is exponential and the state repeats | Memoization over the recursive formulation |
| The subproblems do not overlap | Not this subject; use [greedy](/algorithms/greedy/) or [searching](/algorithms/searching/) |

The bottom row is the useful one. Before writing a table, check that the recursion really does revisit the same subproblems. If it does not, you are writing a search, and the search will be exponential.

## What this subject implies but does not yet cover

- **Digit dynamic programming.** Counting or optimizing over the digits of a number, with a state of the position, the prefix, and the tightness constraint. The standard solution to every problem of the form "count the numbers up to $N$ with no digit equal to $d$".
- **Bitmask dynamic programming.** A state that is a subset of items, held in an integer. The subject's natural companion to the [subset enumeration](/algorithms/enumeration/subset-enumeration) article.
- **Profile dynamic programming.** A state that records the shape of the frontier of a partially built solution, which is how the traveling salesman problem and the plug-like grid problems are solved.
- **Rerooting dynamic programming.** Computing the answer for every node of a tree when the tree is rooted at every node in turn. It appears as a variant in the [tree dynamic programming article](/algorithms/trees/tree-dp) but it has no article of its own.
- **The Li Chao tree.** A structure that supports inserting a line and querying the minimum at a point in $O(\log n)$, without the monotone-slope condition the convex hull trick requires.
- **Divide-and-conquer optimization.** Computing a dynamic program in $O(n \log n)$ when the recurrence's transition ranges are monotone in the state index.
- **Knuth optimization.** The same speedup when the recurrence satisfies the quadrangle inequality, which is what makes the interval dynamic program fast.
- **Monotonic queue optimization.** Reducing a transition from $O(n^2)$ to $O(n)$ when the transition is a minimum over a sliding window of the previous row.
- **Subset transforms.** The fast zeta and Mobius transforms over the subsets of a set, which turn $O(3^n)$ subset convolution into $O(n 2^n)$.
- **The convex hull trick**, which is the one optimization in this list that already has an article of its own, and which is listed in the table above.

## Related subjects

- [Trees and decompositions](/algorithms/trees/) is dynamic programming over a tree, and the tree case is usually easier to state than the general case.
- [Graphs](/algorithms/graphs/) supplies the DAG on which many dynamic programs run.
- [Enumeration](/algorithms/enumeration/) is the naive version of the same idea: a dynamic program is an enumeration whose repeated subproblems have been merged.
- [Searching](/algorithms/searching/) often replaces a dynamic program whose recurrence can be rearranged into a monotone predicate.
