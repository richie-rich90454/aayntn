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

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Subset enumeration | $O(2^n)$ per mask, $O(n 2^n)$ with the subsets materialized | `foundations.recursion` | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| Backtracking | $O(n!)$ in the worst case, far less with pruning | `foundations.recursion` | [Backtracking](/algorithms/enumeration/backtracking) |

The [subset enumeration article](/algorithms/enumeration/subset-enumeration) is also the encyclopedia's place for the meet in the middle split, which reduces $2^n$ to roughly $2^{n/2}$ by matching two half-size tables. That technique is not a separate article, but it is derived there in full.

## Recognition signals

Enumeration is the right tool when the constraint itself says the search space is small.

- **"$n \le 20$"**, or $n \le 22$, or any bound under about $25$ where every item is either taken or left. That is $2^{20}$, which a modern machine can enumerate in a second or two.
- **"choose exactly $k$ of $n$"**, where $k$ and $n$ are small. The number of cases is $\binom{n}{k}$, which is small exactly when $k$ is near the ends.
- **"in how many ways can you..."**, where the answer is a count and the count fits in a machine integer. If the count is the answer, an enumeration that counts is often the intended solution.
- **"permutation"**, **"arrangement"**, **"ordering of $n$"**, with $n \le 10$. That is $n!$ cases, which is $3\,628\,800$ at $n = 10$.
- **"for every pair"**, **"for every triple"**, **"for every subset of size three"**, where the constraint makes the count acceptable. A statement that asks for all pairs of a $10^5$ element array is not this subject; it is a prefix-sum or a sorting problem.
- **"at most $n/2$ operations"** or a time limit that makes a cubic loop plausible.

The signal that rules enumeration out is a constraint above about $30$ combined with a condition that does not decompose. When $n$ is large and the answer depends on all the items, the search must be replaced by a structure.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Every item is taken or left, and $n \le 20$ | [Subset enumeration](/algorithms/enumeration/subset-enumeration) with a bitmask |
| The subsets are of a multiset and the duplicates matter | Subset enumeration with a multiplicity count per value |
| $n \le 40$ and the condition is a sum-like one | Meet in the middle, derived in the [subset enumeration article](/algorithms/enumeration/subset-enumeration) |
| Every ordering of the items must be tried, and $n \le 10$ | [Backtracking](/algorithms/enumeration/backtracking) |
| The choices depend on earlier choices, and a bad choice must be undone | [Backtracking](/algorithms/enumeration/backtracking) |
| The search can be cut short by a running bound | [Backtracking](/algorithms/enumeration/backtracking) with pruning |
| $n$ is large and the answer has a formula | Not this subject; read the [foundations](/algorithms/foundations/) page |

## What this subject implies but does not yet cover

These techniques belong to enumeration and do not yet have an article of their own.

- **Complete search as a subject.** The philosophy of exhaustive search as a baseline, and the discipline of writing a brute-force version first and using it as the reference for the fast one. The [academy](/start/from-ap-csa/) covers the contest craft around it; the encyclopedia does not yet have an article.
- **Branch and bound.** Pruning a search by an upper bound on the best answer still reachable. It is named in the [backtracking article](/algorithms/enumeration/backtracking) as the standard pruning rule, but the theory of bounds and the ordering that makes them bite are not written up.
- **Meet in the middle as its own article.** The technique is derived in full inside the [subset enumeration article](/algorithms/enumeration/subset-enumeration), including the counting variant with multiplicities, but it does not have a page of its own.
- **Ternary search.** Halving a unimodal function rather than a monotone predicate, and the difference between the two that binary search depends on. The [binary search article](/algorithms/searching/binary-search) explains the monotone requirement but not the unimodal case.
- **The branch-and-bound foundations.** The relationship between a search tree, a bound function, and a worst-case guarantee, and the fact that a bound that is not admissible degrades the guarantee from optimal to merely fast.

## Related subjects

- [Searching](/algorithms/searching/) is the counterpart: it assumes the search space is too large and looks for a way to skip it.
- [Foundations](/algorithms/foundations/) supplies the complexity analysis that tells you whether enumeration is affordable.
- [Advanced algorithms](/algorithms/advanced/) takes the opposite approach, replacing a search with a batch of them that can be answered in parallel.
- [Dynamic programming](/algorithms/dynamic-programming/) is the systematic way to avoid re-solving the same subproblem that a naive enumeration would solve many times.
