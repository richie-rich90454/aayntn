---
id: range-queries.index
title: The Range query structures
summary: Answer questions about a range of an array, with updates arriving between the questions, in logarithmic time per operation.
division: []
subjects: [range-queries]
level: intermediate
importance: common-contest-technique
keywords: [range query, fenwick tree, segment tree, sparse table, point update, range sum]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Range query structures answer a question about a contiguous part of an array faster than a scan, and they keep answering correctly when the array changes between questions.

The subject exists because the techniques in [arrays](/algorithms/arrays/) assume the array is fixed. The moment a problem interleaves updates with queries, a prefix sum table computed once is no longer enough, and something that can be updated in place is needed.

Three structures cover most of the field, and they differ in the operations they support and in what they cost to build.

| Structure    | Build         | Update      | Query       | Space         |
| ------------ | ------------- | ----------- | ----------- | ------------- |
| Fenwick tree | $O(n)$        | $O(\log n)$ | $O(\log n)$ | $O(n)$        |
| Segment tree | $O(n)$        | $O(\log n)$ | $O(\log n)$ | $O(n)$        |
| Sparse table | $O(n \log n)$ | none        | $O(1)$      | $O(n \log n)$ |

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Fenwick tree | $O(\log n)$ per operation | $O(n)$ | `arrays.prefix-sums` | [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Segment tree | $O(\log n)$ per operation | $O(n)$ | `arrays.prefix-sums` | [Segment tree](/algorithms/range-queries/segment-tree) |
| Sparse table | $O(n \log n)$ to build, $O(1)$ per query | $O(n \log n)$ | `arrays.prefix-sums` | [Sparse table](/algorithms/range-queries/sparse-table) |

The Fenwick tree answers the questions that prefix sums answer, plus point updates, at a cost of $O(\log n)$ per query instead of $O(1)$. The segment tree answers a wider family of questions, at the price of a larger constant and a more complicated implementation. The sparse table answers in constant time but cannot be updated at all, so it serves only the static case.

The Fenwick tree is also the cheapest of the three to build. Its linear build is the one to reach for when $n$ is large, because inserting the values one by one costs $O(n \log n)$ and the difference matters at $n = 10^6$.

## Recognition signals

- **"after each operation"**, **"operations are given in order"**, **"then query"**. The interleaving of a change and a question is the defining signal.
- **"add $v$ to position $i$"**, **"set position $i$ to $v$"**, **"mark position $i$"**. A point update plus a range question is exactly the segment tree's contract.
- **"the sum of the current values in the range"**, **"the minimum value currently in the range"**, **"the number of marked positions in the range"**.
- **$n$ and $q$ both at $10^5$ or more**, with the operations given in the input rather than in the statement.
- **"the range is static"**, or **"all queries come after the array"**, combined with a large $q$. This is the sparse table's case, and it is the case where the $O(1)$ query matters.
- **"the sum of a range"** with no updates at all. That is a prefix sum, and building a segment tree for it is wasted work.
- **"the k-th smallest element in the range"**. That is an order statistic, and none of the three structures below answers it.

The signal that rules the subject out is a question about an arbitrary set of positions rather than a contiguous range. A segment tree does not answer "the sum of the elements at positions 1, 7, and 900" in logarithmic time.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Range sum, point updates | [Fenwick tree](/algorithms/range-queries/fenwick-tree) |
| Range minimum, maximum, or count, with updates | [Segment tree](/algorithms/range-queries/segment-tree) |
| Range minimum or sum, no updates, many queries | [Sparse table](/algorithms/range-queries/sparse-table) |
| Range sum, no updates, few queries | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Range updates and range sums | A difference array, or a lazy segment tree |
| The array values are coordinates rather than quantities | [Coordinate compression](/algorithms/arrays/coordinate-compression), then a Fenwick tree |
| The queries arrive and must be answered offline | [Parallel binary search](/algorithms/advanced/parallel-binary-search) with a Fenwick tree |
| The operation is a count of something over a range | A merge sort tree or a wavelet tree |
| The operation is an order statistic over a range | A merge sort tree or a wavelet tree |

The choice between the Fenwick tree and the segment tree is the one that matters most, because both are logarithmic. A Fenwick tree is a third of the code and answers sums and differences. A segment tree answers any associative operation: minimum, maximum, count, product, or a combination. Reach for the Fenwick tree when the operation is addition or subtraction and the segment tree when it is anything else.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Fenwick tree | O(log n) per operation | O(n) | `arrays.prefix-sums` | [Fenwick tree](/algorithms/range-queries/fenwick-tree) | [Source](/implementations/range-queries-fenwick-tree/) |
| Implicit segment trees | O(log C) per operation | O(k log C) for k touched positions | `range-queries.segment-tree` | [Implicit segment trees](/algorithms/range-queries/implicit-segment-tree) | [Source](/implementations/range-queries-implicit-segment-tree/) |
| Lazy propagation | O(log n) per range update and per range query | O(n) | `range-queries.segment-tree` | [Lazy propagation](/algorithms/range-queries/lazy-propagation) | [Source](/implementations/range-queries-lazy-propagation/) |
| Merge sort trees | O(log^2 n) per rank query; O(log C log^2 n) per k-th smallest query | O(n log n) | `range-queries.segment-tree` | [Merge sort trees](/algorithms/range-queries/merge-sort-tree) | [Source](/implementations/range-queries-merge-sort-tree/) |
| Mo's algorithm | O((n + q) sqrt n) for the batch, plus O(q log q) to sort | O(n + q) | `arrays.prefix-sums` | [Mo's algorithm](/algorithms/range-queries/mos-algorithm) | [Source](/implementations/range-queries-mos-algorithm/) |
| Persistent segment trees | O(n log n) to build; O(log n) per query | O(n log n) | `range-queries.segment-tree` | [Persistent segment trees](/algorithms/range-queries/persistent-segment-tree) | [Source](/implementations/range-queries-persistent-segment-tree/) |
| Segment tree | O(log n) per operation | O(n) | `arrays.prefix-sums` | [Segment tree](/algorithms/range-queries/segment-tree) | [Source](/implementations/range-queries-segment-tree/) |
| Segment tree beats | amortized O(log n) per operation | O(n) | `range-queries.segment-tree` | [Segment tree beats](/algorithms/range-queries/segment-tree-beats) | [Source](/implementations/range-queries-segment-tree-beats/) |
| Sparse table | O(n log n) to build, O(1) per query | O(n log n) | `arrays.prefix-sums` | [Sparse table](/algorithms/range-queries/sparse-table) | Prose only |
| Square-root decomposition | O(n) to build, O(1) per point update, O(sqrt n) per range query | O(n) | `arrays.prefix-sums` | [Square-root decomposition](/algorithms/range-queries/sqrt-decomposition) | [Source](/implementations/range-queries-sqrt-decomposition/) |
| Wavelet trees | O(log sigma) per k-th smallest or rank query; O(n log sigma) to build | O(n log sigma) prefix counts, plus O(n) working arrays | `range-queries.merge-sort-tree` | [Wavelet trees](/algorithms/range-queries/wavelet-tree) | [Source](/implementations/range-queries-wavelet-tree/) |

<!-- aayntn:subject:end -->

## Related subjects

- [Arrays and sequences](/algorithms/arrays/) is the special case with no updates, and it is the shortest way to understand what a range query structure is for.
- [Advanced algorithms](/algorithms/advanced/) uses the Fenwick tree as the workhorse of parallel binary search.
- [Trees and decompositions](/algorithms/trees/) contribute the other half of the segment tree idea, since a segment tree is a tree over ranges.
- The [academy](/start/) introduces the prefix sum that the Fenwick tree generalizes, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
