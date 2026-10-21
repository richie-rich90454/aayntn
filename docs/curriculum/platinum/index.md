---
id: curriculum.platinum
title: The Platinum track
summary: Graph and tree decompositions, advanced range structures, dynamic-programming optimization, and the techniques that separate finalists from qualifiers.
division: [platinum]
subjects: []
level: advanced
importance: advanced-technique
keywords: [platinum, curriculum, track, division]
prerequisites:
    required: []
    recommended: [start.from-ap-csa, start.discrete-mathematics, start.data-structures]
reviewed: false
---

The Platinum track is about making the right solution expressible. A Platinum problem is usually not hard because the idea is obscure. It is hard because the constraint rules out the direct formulation, and the solver has to find the reformulation in which the answer becomes a state, or the structure in which the operation becomes cheap.

The techniques here are the ones that change the shape of a problem rather than the speed of a loop. They are also the techniques that most often require two ideas at once, which is why the track ends with a section on the technique the encyclopedia does not yet cover.

## The techniques, in order

1. **[Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition)**. The standard decomposition of a tree into a logarithmic number of chains, which turns every path question into a logarithmic number of range questions.
2. **[The segment tree](/algorithms/range-queries/segment-tree)**. The general range structure, and the one that answers questions about ranges of ranges.
3. **[The sparse table](/algorithms/range-queries/sparse-table)**. Constant-time range queries when nothing changes, and the technique behind many offline problems where the values are fixed and the queries are not.
4. **[Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums)**. The rectangle version, with the four-term inclusion and exclusion formula.
5. **[Knuth-Morris-Pratt](/algorithms/strings/kmp)**. Linear-time pattern matching, and the prefix function that every other string technique reuses.
6. **[The convex hull](/algorithms/geometry/convex-hull)**. The geometry analog of the prefix sum: discard the points that can never be extremal, and work with what remains.
7. **[The convex hull trick](/algorithms/dynamic-programming/convex-hull-trick)**. A dynamic program whose transition is a linear function, optimized to $O(n + q)$ amortized.
8. **[Parallel binary search](/algorithms/advanced/parallel-binary-search)**. Many binary searches over one data structure, answered together in a single sweep per round.
9. **[Longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence)**. The $O(n \log n)$ route, and the state definition that makes it possible.
10. **[Modular arithmetic](/algorithms/number-theory/modular-arithmetic)**. Fast exponentiation, the modular inverse, and the counts that must be reduced.
11. **[Binomial coefficients](/algorithms/combinatorics/binomial-coefficients)**. Counting without enumerating, at the scale where a count is astronomically large.

Several of these techniques also appear on the [Gold track](/curriculum/gold/). That is not a duplication to be removed. A Platinum problem is rarely built from a new algorithm; it is usually built from a familiar algorithm plus a constraint that the familiar version cannot meet, and the point of repeating the technique is to be able to reach for it under pressure.

## What you should be able to do at the end

You should be able to take a problem whose constraint defeats the obvious solution, identify which property of the obvious solution is responsible, and replace that property. Concretely, you should be able to:

- **Find the decomposition.** Know that a tree has a heavy path, that a grid has a row or a column, that a set of queries has a time dimension, and that a string has a border. Each of those is a place to cut the problem so that the pieces have a bounded number of states.
- **Optimize a recurrence instead of replacing it.** Read a $O(n^2)$ dynamic program and ask which of the known optimizations applies: does the transition have a monotone window, a monotone slope, a monotone decision boundary, or a quadrangle inequality?
- **Choose a structure by the operation, not by habit.** Reach for the segment tree when the aggregate is not a sum, and for the Fenwick tree when it is. Reach for the sparse table only when nothing changes after the preprocessing.
- **State the amortized cost.** An offline technique's bound is often amortized over the whole run, and the statement of it has to be exact, because a per-operation bound does not exist.
- **Explain what you left out.** A Platinum solution that meets the time limit by a small margin needs a fallback, and knowing the fallback is part of the solution.
- **Work within the limit.** Know the practical cost of a segment tree with $10^5$ leaves, a Fenwick tree with $10^6$ updates, and a convex hull trick with $10^6$ lines, because the constant factors decide the contest.

## What this track implies and the encyclopedia does not yet cover

The techniques below belong at this level and do not yet have an article of their own. Knowing they exist is part of knowing where the material ends.

- **Offline dynamic connectivity** and the rollback disjoint set union that supports it.
- **Persistent data structures**, and the persistent segment tree in particular.
- **Centroid decomposition** and **small-to-large merging** for tree problems.
- **Randomized algorithms**, and the distinction between a Monte Carlo algorithm and a Las Vegas one.
- **XOR bases** for the maximum-XOR-subset family of problems.
- **Bitset optimization**, which packs the inner loop of a dynamic program into machine words.
- **The matroid perspective**, which is the theoretical reason that some greedy algorithms are provably correct.
- **Sprague-Grundy theory**, the standard tool for impartial two-player games.

## The subjects this track draws on

- [Trees and decompositions](/algorithms/trees/), which supplies the heavy-light decomposition and the tree dynamic programming.
- [Range query structures](/algorithms/range-queries/), which supply the segment tree and the sparse table.
- [Dynamic programming](/algorithms/dynamic-programming/), which supplies the recurrence techniques and the convex hull trick.
- [Advanced algorithms](/algorithms/advanced/), which supplies the offline techniques.
- [Strings](/algorithms/strings/), [Computational geometry](/algorithms/geometry/), [Number theory](/algorithms/number-theory/), and [Combinatorics](/algorithms/combinatorics/), each of which contributes one technique that a Platinum problem can turn on.

## A note on the division

USACO does not publish a fixed syllabus, and there is no official list of what a Platinum problem may contain. The division is defined by the difficulty of the problems, and the difficulty comes from the setter's choice of constraint. A Platinum problem is very often a Gold problem with a tighter limit.

The list above is a curated route rather than an official one, and it is not a complete description of what a Platinum problem can require: several of the techniques it names have no article in this encyclopedia yet, and they are listed above so that the boundary is visible. This track is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad, and completing it does not predict a result in any contest.
