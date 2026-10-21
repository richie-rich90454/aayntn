---
id: curriculum.silver
title: The Silver track
summary: Named techniques that replace the double loop, and the first graph algorithms.
division: [silver]
subjects: []
level: intermediate
importance: core-prerequisite
keywords: [silver, curriculum, track, division]
prerequisites:
    required: []
    recommended: [start.from-ap-csa, start.algorithm-analysis]
reviewed: false
---

The Silver track is where a problem stops being a simulation and starts being a technique. Almost every Silver problem has a quadratic solution, and the difficulty is recognizing that the quadratic solution is the wrong one and knowing which of a small number of standard improvements replaces it.

The techniques here are the ones that pay for themselves most often. A prefix sum, a binary search, a sort, a greedy choice, or a graph traversal accounts for the large majority of Silver problems, and each of them turns an $O(n^2)$ or $O(n \log n)$ question into an $O(n)$ or $O(\log n)$ one.

## The techniques, in order

1. **[Sorting](/algorithms/foundations/sorting)**. The most basic tool in the track, and the prerequisite for several others. Learning to sort also teaches how to compare objects by more than one key, which is how a greedy rule is usually applied.
2. **[Binary search](/algorithms/searching/binary-search)**. The first logarithmic technique, and the one that most often fails on a boundary condition. Learn the lower bound and the upper bound, and learn to write down whether the interval is inclusive or half-open.
3. **[Two pointers](/algorithms/searching/two-pointers)**. Linear time where a nested loop would be quadratic. The technique is simple and the discipline of not restarting the inner pointer is everything.
4. **[Sliding window](/algorithms/searching/sliding-window)**. The two-pointer technique with an explicit window, and the answer to every "longest run" and "at most $k$ distinct" problem.
5. **[Prefix sums](/algorithms/arrays/prefix-sums)**. Answer a range-sum question in constant time after a linear preprocessing step. Learn the index convention once and write it down.
6. **[Difference arrays](/algorithms/arrays/difference-arrays)**. The same idea running backwards: batch range updates instead of answering range queries.
7. **[Interval scheduling](/algorithms/greedy/interval-scheduling)**. The first greedy problem, and the first place where you have to argue that the local choice is safe rather than just assert it.
8. **[Graph representation](/algorithms/graphs/representation)**. The adjacency list, and the decision between a list and a matrix. Every graph technique below depends on it.
9. **[Breadth-first search](/algorithms/graphs/bfs)**. The shortest-path-in-unweighted-graphs algorithm, and the first traversal that uses a queue.
10. **[Depth-first search](/algorithms/graphs/dfs)**. The traversal that finds components, detects cycles, and produces topological orders, and the one whose recursive form is the model for backtracking.
11. **[Disjoint set union](/algorithms/graphs/dsu)**. Connectivity in almost constant time, and the structure behind the merging problems.

## What you should be able to do at the end

You should be able to look at a statement, name the technique it is asking for, and implement that technique correctly on the first attempt. Concretely, you should be able to:

- **Recognize the shape of the question.** "Sum over a range" means prefix sums. "First position where" means binary search. "Longest run with a property" means a sliding window. "Fewest moves" means breadth-first search. The recognition has to happen before you write anything.
- **Pick the right level of effort.** Know when a problem is $O(n^2)$-shaped and acceptable, and when it is $O(n^2)$-shaped and not. A Silver constraint of $n = 10^5$ rules out the double loop, and a constraint of $n = 2000$ allows it.
- **Model a problem as a graph.** Decide what a vertex is, decide whether the edges are directed, and build the adjacency list without an index error.
- **Give the correctness argument.** Not "it obviously works", but the reason: the invariant that the traversal maintains, the exchange argument that makes the greedy choice safe.
- **Bound your own solution.** State the time and the space before you submit, and compare them against the constraint.

## The subjects this track draws on

- [Searching](/algorithms/searching/), which supplies binary search, the two pointers, and the sliding window.
- [Arrays and sequences](/algorithms/arrays/), which supplies prefix sums and difference arrays.
- [Greedy methods](/algorithms/greedy/), which supplies interval scheduling.
- [Graphs and shortest paths](/algorithms/graphs/), which supplies the representation and the first three traversals.
- [Foundations and complexity](/algorithms/foundations/), which supplies sorting and the constraint analysis that every choice depends on.

## A note on the division

USACO does not publish a fixed syllabus, so there is no official boundary between the techniques a Silver problem may use and the techniques it may not. A Bronze problem can need a greedy choice, and a Silver problem can need a graph traversal, and the division describes the difficulty of the whole problem rather than the sophistication of any one part of it.

The list above is a curated route rather than an official one. Several of these techniques continue upward: binary search, sorting, and the traversals all appear again in Gold and Platinum problems in harder forms. It is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad, and completing this track does not predict a result in any contest.
