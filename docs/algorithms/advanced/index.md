---
id: advanced.index
title: The Advanced algorithms and special techniques
summary: Techniques that do not fit any single subject, because they combine several of them or work on the problem instead of the data.
division: []
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        advanced,
        offline algorithms,
        parallel binary search,
        divide and conquer,
        randomized algorithms,
    ]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Advanced is the subject of techniques that do not fit cleanly into any other one. They are not harder because the underlying ideas are more complicated. They are harder because they combine several ordinary ideas into a structure that no single subject teaches.

Two patterns run through almost all of them. The first is the offline transformation: the problem asks many questions that are answered in order, and the technique rearranges the questions so that a single pass answers them all. The second is the substitution: the problem looks like one thing, and the technique replaces it with a different thing that is easier to compute.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Parallel binary search | $O((n + q) \log^2 n)$ | `searching.binary-search` | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |

The parallel binary search article is the worked example of the subject. It takes $q$ independent binary searches over the same data structure, observes that they all proceed in the same rounds, and answers them together in a single sweep per round.

## Recognition signals

- **"process all the operations offline"**, **"the operations are given in advance"**, **"the queries can be reordered"**. The offline signal is the strongest one in the subject, and it is worth checking first because it is invisible in the statement itself.
- **"for every $k$"**, **"find the smallest $k$ such that"**, repeated for many different data sets. This is the shape of a parallel binary search.
- **"$10^5$ queries"** that each look like a binary search but over the same array.
- **"the answers are monotone"**, **"as the parameter grows, the answer grows"**.
- **"the input is adversarial"**, **"guaranteed correct with high probability"**, **"a Monte Carlo algorithm"**. The randomization is a deliberate trade of a small error probability for a large speedup.
- **"union of sets"**, **"merge two structures"**, **"undo the last operation"**. The offline connectivity family.

The signal that rules the subject out is a problem that requires each answer before the next question is even read. Interactive problems are the opposite of offline problems, and the offline transformation does not apply to them.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Many binary searches over one data structure | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |
| Many connectivity queries, with edges added between them | An offline connectivity algorithm, which is not covered yet |
| The same subproblem is reached many times | Memoization, or a dynamic program |
| A quadratic loop over pairs that can be split | The divide-and-conquer closest-pair algorithm |
| The answer is monotone in a parameter | [Binary search on the answer](/algorithms/searching/) |
| A deterministic algorithm is too slow | A randomized one, with the error probability stated |
| The problem is a known hard one | Accept the complexity, and make the constant small |

## What this subject implies but does not yet cover

- **Offline dynamic connectivity.** Answering connectivity queries when edges are added between them, by segmenting the timeline and using a rollback disjoint set union. This is the standard technique for the hardest connectivity problems and it has no article yet.
- **The rollback disjoint set union.** The variant of the disjoint set union that supports undoing a merge, which is what makes the offline segmentation work. The ordinary [disjoint set union](/algorithms/graphs/dsu) cannot be rolled back, and that single fact is what the whole offline machinery exists to work around.
- **Persistent data structures.** Structures that keep every version, so that an old version can be queried, at the cost of $O(\log n)$ extra space per version. The persistent segment tree is the standard one.
- **Randomized algorithms.** The whole family: the fingerprinting of a set of strings, the randomized choice of a pivot in a quicksort-like algorithm, and the Monte Carlo versus Las Vegas distinction.
- **XOR bases.** A basis over the field of two elements, which answers the question of whether a value can be expressed as the XOR of a subset of a set in $O(\log n)$ per query, and which is how the maximum XOR subset problems are solved.
- **Bitset optimization.** Packing $64$ booleans into a machine word, which turns a dynamic program's inner loop into a few word operations and is the difference between passing and timing out on many problems.
- **Matroids.** The family of structures whose feasible sets have the exchange property, which is the theoretical reason some greedy algorithms are correct.
- **Game theory and Sprague-Grundy theory.** The theory of impartial two-player games, and the theorem that lets independent games be combined by XORing their Grundy values. The combinatorial games that appear in contests are usually small enough to solve by dynamic programming over the position, which is a more approachable route.

## Related subjects

- [Searching](/algorithms/searching/) supplies the binary search that parallel binary search runs many of at once.
- [Range query structures](/algorithms/range-queries/) supply the Fenwick tree, which is the workhorse of nearly every offline technique here.
- [Graphs](/algorithms/graphs/) supply the disjoint set union that the offline connectivity techniques extend.
- [Foundations](/algorithms/foundations/) supplies the complexity analysis that decides whether an offline transformation is affordable at all.
