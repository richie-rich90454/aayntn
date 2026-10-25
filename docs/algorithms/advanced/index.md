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

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Parallel binary search | $O((n + q) \log^2 n)$ | $O(n + q)$ | `searching.binary-search` | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |

The parallel binary search article is the worked example of the subject. It takes $q$ independent binary searches over the same data structure, observes that they all proceed in the same rounds, and answers them together in a single sweep per round.

The bound is $O((n + q) \log^2 n)$ because there are $O(\log n)$ rounds, and each round costs $O((n + q) \log n)$: the sweep applies each of the $n$ deliveries once at $O(\log n)$ per delivery, and each of the $q$ queries performs one check at $O(\log n)$. One independent search per query over a rebuilt tree would cost $O(qn \log n)$, so at $n = q = 10^5$ the parallel version is about two thousand times faster.

The subject holds ten registered algorithms, each with source listings in six languages. The complete table below lists every technique in the subject, with the article and the reference implementation where one exists.

## Recognition signals

- **"process all the operations offline"**, **"the operations are given in advance"**, **"the queries can be reordered"**. The offline signal is the strongest one in the subject, and it is worth checking first because it is invisible in the statement itself.
- **"for every $k$"**, **"find the smallest $k$ such that"**, repeated for many different data sets. This is the shape of a parallel binary search.
- **"$10^5$ queries"** that each look like a binary search but over the same array.
- **"the answers are monotone"**, **"as the parameter grows, the answer grows"**.
- **"the input is adversarial"**, **"guaranteed correct with high probability"**, **"a Monte Carlo algorithm"**. The randomization is a deliberate trade of a small error probability for a large speedup.
- **"union of sets"**, **"merge two structures"**, **"undo the last operation"**. The offline connectivity family.
- **"the $k$-th smallest"**, **"the median"**, **"a random element"**, without a full sort. That is selection, and it is a linear-time alternative to sorting.

The signal that rules the subject out is a problem that requires each answer before the next question is even read. Interactive problems are the opposite of offline problems, and the offline transformation does not apply to them.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Many binary searches over one data structure | [Parallel binary search](/algorithms/advanced/parallel-binary-search) |
| Many connectivity queries, with edges added between them | [Offline dynamic connectivity](/algorithms/advanced/offline-dynamic-connectivity) |
| The $k$-th smallest element, with no full sort | [Quickselect](/algorithms/advanced/quickselect) |
| The same subproblem is reached many times | Memoization, or a dynamic program |
| A quadratic loop over pairs that can be split | The divide-and-conquer closest-pair algorithm |
| The answer is monotone in a parameter | [Binary search on the answer](/algorithms/searching/binary-search-on-answer) |
| A deterministic algorithm is too slow | A randomized one, with the error probability stated |
| The problem is a known hard one | Accept the complexity, and make the constant small |

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Berlekamp-Massey | O(n^2) | O(n) | `number-theory.modular-arithmetic` | [Berlekamp-Massey](/algorithms/advanced/berlekamp-massey) | [Source](/implementations/advanced-berlekamp-massey/) |
| Bitset optimization | O(nW / 32) | O(W / 32) | `foundations.binary-representation` | [Bitset optimization](/algorithms/advanced/bitset-optimization) | [Source](/implementations/advanced-bitset-optimization/) |
| Game theory and Sprague-Grundy theory | O(M k + h) to tabulate the Grundy values up to the largest heap, where k moves are allowed | O(M + k) | `foundations.complexity` | [Game theory and Sprague-Grundy theory](/algorithms/advanced/sprague-grundy) | [Source](/implementations/advanced-sprague-grundy/) |
| Matroids | O(m log m + (n + m) α(n)) | O(n + m) | `graphs.mst` | [Matroids](/algorithms/advanced/matroids) | [Source](/implementations/advanced-matroids/) |
| Offline dynamic connectivity | O(q log q log n) | O(n + q log q) | `graphs.dsu` | [Offline dynamic connectivity](/algorithms/advanced/offline-dynamic-connectivity) | [Source](/implementations/advanced-offline-dynamic-connectivity/) |
| Parallel binary search | O((N + Q) log^2 N) | O(N + Q) | `searching.binary-search` | [Parallel binary search](/algorithms/advanced/parallel-binary-search) | Prose only |
| Persistent data structures | O(1) per operation on the persistent stack | O(q) for q operations, one node per push | `foundations.complexity` | [Persistent data structures](/algorithms/advanced/persistent-data-structures) | [Source](/implementations/advanced-persistent-data-structures/) |
| Quickselect and randomized selection | O(n) expected with a random pivot, O(n^2) worst case | O(1) auxiliary in the iterative form, O(n) stack in the worst recursive form | `foundations.sorting` | [Quickselect and randomized selection](/algorithms/advanced/quickselect) | [Source](/implementations/advanced-quickselect/) |
| Randomized algorithms | O(n log n) expected comparisons, O(n^2) worst case | O(n) for the array, O(log n) expected recursion stack, O(n) in the worst case | `foundations.sorting` | [Randomized algorithms](/algorithms/advanced/randomized-algorithms) | [Source](/implementations/advanced-randomized-algorithms/) |
| The rollback disjoint set union | O(log n) per find or union, O(1) per rollback | O(n + q) for the forest and its history | `graphs.dsu` | [The rollback disjoint set union](/algorithms/advanced/rollback-dsu) | [Source](/implementations/advanced-rollback-dsu/) |
| XOR bases | O((n + q) log A) | O(log A) | `foundations.binary-representation` | [XOR bases](/algorithms/advanced/xor-bases) | [Source](/implementations/advanced-xor-bases/) |

<!-- aayntn:subject:end -->

## Related subjects

- [Searching](/algorithms/searching/) supplies the binary search that parallel binary search runs many of at once.
- [Range query structures](/algorithms/range-queries/) supply the Fenwick tree, which is the workhorse of nearly every offline technique here.
- [Graphs](/algorithms/graphs/) supply the disjoint set union that the offline connectivity techniques extend.
- [Foundations](/algorithms/foundations/) supplies the complexity analysis that decides whether an offline transformation is affordable at all.
- The [academy](/start/) introduces the idea of changing the question rather than the algorithm, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
