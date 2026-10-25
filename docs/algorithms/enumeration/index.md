---
id: enumeration.index
title: The Enumeration and searching
summary: Solve a problem by trying every possibility, and cut the number of possibilities until the search fits inside the constraint.
division: []
subjects: [enumeration]
level: introductory
importance: core-prerequisite
keywords: [enumeration, brute force, backtracking, subset enumeration, exponential search]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Enumeration is the subject of problems that are solved by trying everything. The name sounds like an admission of defeat, and in a sense it is: a complete search is the technique you reach for when no structure lets you shortcut the search space.

That is not a weakness. Knowing the size of the search space and being able to make it fit is a contest skill in itself, because the search space of a problem is often the first thing worth computing. A problem with $n \le 20$ items has at most a million cases. A problem with $n \le 40$ has more than a trillion, and a problem with $n = 10^5$ has only one realistic answer: a formula, a greedy choice, or a structure that replaces the search entirely.

The techniques in this subject are the brute-force baseline, the way to write it so it is fast enough, and the two ways to halve the exponent.

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Subset enumeration | $O(2^n)$ per mask, $O(n 2^n)$ with the subsets materialized | $O(1)$ per mask, $O(n)$ per subset | `foundations.binary-representation` | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| Backtracking | $O(b^d \cdot t)$ in the worst case, far less with pruning | $O(d + s)$ | `foundations.recursion` | [Backtracking](/algorithms/enumeration/backtracking) |
| Permutations | $O(n \cdot n!)$ | $O(n)$ | `enumeration.backtracking` | [Permutations](/algorithms/enumeration/permutations) |
| Branch and bound | $O(b \cdot V)$, where $V$ is the number of surviving nodes | $O(n)$ | `enumeration.backtracking` | [Branch and bound](/algorithms/enumeration/branch-and-bound) |

The order of the table is the order of dependence. Subset enumeration is the flat version, in which the possibilities are independent of one another. Backtracking adds the dependency, in which a choice made early decides which choices remain. Permutations specialize the dependency to an ordering of every item. Branch and bound adds a bound to the dependency, so that a subtree whose best possible completion is already too bad is abandoned before it is explored.

The [subset enumeration article](/algorithms/enumeration/subset-enumeration) is also the encyclopedia's place for the meet in the middle split, which reduces $2^n$ to roughly $2^{n/2}$ by matching two half-size tables. That technique is not a separate article, but it is derived there in full.

## Recognition signals

Enumeration is the right tool when the constraint itself says the search space is small.

- **"$n \le 20$"**, or $n \le 22$, or any bound under about $25$ where every item is either taken or left. That is $2^{20}$, which a modern machine can enumerate in a second or two.
- **"choose exactly $k$ of $n$"**, where $k$ and $n$ are small. The number of cases is $\binom{n}{k}$, which is small exactly when $k$ is near the ends.
- **"in how many ways can you..."**, where the answer is a count and the count fits in a machine integer. If the count is the answer, an enumeration that counts is often the intended solution.
- **"permutation"**, **"arrangement"**, **"ordering of $n$"**, with $n \le 10$. That is $n!$ cases, which is $3\,628\,800$ at $n = 10$.
- **"assign"**, **"schedule"**, **"fill the positions"**, where a choice made in one place removes options from another. That is the dependency that makes backtracking the right tool rather than a flat mask.
- **"for every pair"**, **"for every triple"**, **"for every subset of size three"**, where the constraint makes the count acceptable. A statement that asks for all pairs of a $10^5$ element array is not this subject; it is a prefix-sum or a sorting problem.
- **"at most $n/2$ operations"** or a time limit that makes a cubic loop plausible.

The signal that rules enumeration out is a constraint above about $30$ combined with a condition that does not decompose. When $n$ is large and the answer depends on all the items, the search must be replaced by a structure.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Every item is taken or left, and $n \le 20$ | [Subset enumeration](/algorithms/enumeration/subset-enumeration) with a bitmask |
| The subsets are of a multiset and the duplicates matter | Subset enumeration with a multiplicity count per value |
| $n \le 40$ and the condition is a sum-like one | Meet in the middle, derived in the [subset enumeration article](/algorithms/enumeration/subset-enumeration) |
| Every ordering of the items must be tried, and $n \le 10$ | [Permutations](/algorithms/enumeration/permutations) |
| The choices depend on earlier choices, and a bad choice must be undone | [Backtracking](/algorithms/enumeration/backtracking) |
| The search can be cut short by a running bound | [Branch and bound](/algorithms/enumeration/branch-and-bound) |
| The bound must never overestimate the true best completion | Prove the bound is admissible first, as the [branch and bound article](/algorithms/enumeration/branch-and-bound) does |
| $n$ is large and the answer has a formula | Not this subject; read the [foundations](/algorithms/foundations/) page |

The admissible-bound row is the one to be careful about. A bound that is admissible never exceeds the true cost of any completion, so pruning on it is safe. A bound that is too weak prunes nothing and the search degenerates into brute force. A bound that is not admissible prunes the optimum, and the answer is silently wrong. The three cases look the same on paper and behave nothing alike.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Backtracking | O(b^d * t) in the worst case, far less with pruning | O(d + s) | `foundations.recursion` | [Backtracking](/algorithms/enumeration/backtracking) | Prose only |
| Branch and bound | O(b * V), where V is the number of surviving nodes | O(n) | `enumeration.backtracking` | [Branch and bound](/algorithms/enumeration/branch-and-bound) | Prose only |
| Complete search | O(n 2^n) for the subset contract, O(S c) for a candidate space of S candidates with a test of cost c | O(n) for the recursion, or O(1) beyond the input for a mask loop | `foundations.complexity` | [Complete search](/algorithms/enumeration/complete-search) | [Source](/implementations/enumeration-complete-search/) |
| Constraint propagation | O(N), where N is the number of visited nodes, which is 856189 for n = 12 | O(n) for the recursion and O(1) masks per frame | `enumeration.backtracking` | [Constraint propagation](/algorithms/enumeration/constraint-propagation) | [Source](/implementations/enumeration-constraint-propagation/) |
| Gray codes | O(n 2^n) | O(n) auxiliary | `foundations.binary-representation` | [Gray codes](/algorithms/enumeration/gray-codes) | [Source](/implementations/enumeration-gray-codes/) |
| Iterative deepening | O(b^d) for branching factor b and solution depth d | O(d) auxiliary, plus O(n + m) for the graph | `foundations.recursion` | [Iterative deepening](/algorithms/enumeration/iterative-deepening) | [Source](/implementations/enumeration-iterative-deepening/) |
| Meet in the middle | O(n 2^(n/2)) | O(2^(n/2)) | `enumeration.subset-enumeration` | [Meet in the middle](/algorithms/enumeration/meet-in-the-middle) | [Source](/implementations/enumeration-meet-in-the-middle/) |
| Permutations | O(n * n!) | O(n) | `enumeration.backtracking` | [Permutations](/algorithms/enumeration/permutations) | Prose only |
| Subset enumeration | O(2^n) per mask, O(n 2^n) with the subsets materialized | O(1) per mask, O(n) per subset | `foundations.binary-representation` | [Subset enumeration](/algorithms/enumeration/subset-enumeration) | Prose only |

<!-- aayntn:subject:end -->

## Related subjects

- [Searching](/algorithms/searching/) is the counterpart: it assumes the search space is too large and looks for a way to skip it.
- [Foundations](/algorithms/foundations/) supplies the complexity analysis that tells you whether enumeration is affordable.
- [Advanced algorithms](/algorithms/advanced/) takes the opposite approach, replacing a search with a batch of them that can be answered in parallel.
- [Dynamic programming](/algorithms/dynamic-programming/) is the systematic way to avoid re-solving the same subproblem that a naive enumeration would solve many times.
- The [academy](/start/) introduces exhaustive search as the first way to attack an unfamiliar statement, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
