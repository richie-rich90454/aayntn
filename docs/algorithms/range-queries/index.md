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

## What this subject implies but does not yet cover

- **Lazy propagation.** The rule that lets a segment tree apply a range update in $O(\log n)$ by deferring the update to the children until a query needs them. It is named in the [segment tree article](/algorithms/range-queries/segment-tree) as the extension that handles range updates, and it does not have an article of its own.
- **Persistent segment trees.** Keeping every version of the tree so that an old version can be queried, at the cost of $O(\log n)$ extra space per version. This is the standard route to the offline dynamic connectivity problems in [advanced algorithms](/algorithms/advanced/).
- **Implicit segment trees.** Building a tree over a value range so large that it cannot be allocated, letting the tree create nodes only where they are needed.
- **Segment tree beats.** Extending the segment tree with a second aggregate, such as the minimum and the second minimum, so that a range update can skip nodes where it would not change the answer.
- **Wavelet trees.** A different partition of the value axis that answers range order statistics and range counting in $O(\log n)$ without the merges of a segment tree.
- **Merge sort trees.** A segment tree whose nodes hold sorted lists, which answers a range order statistic in $O(\log^2 n)$ by binary searching inside each covered node.
- **Square-root decomposition.** Splitting the array into blocks of about $\sqrt{n}$ elements, giving $O(\sqrt{n})$ per operation and often passing when the logarithm is not needed.
- **Mo's algorithm.** Answering offline range queries in $O((n + q)\sqrt{n})$ by moving the endpoints of the range one element at a time and maintaining an answer that updates in constant time. It is the standard answer when the query is unusual enough that no aggregate fits.

## Related subjects

- [Arrays and sequences](/algorithms/arrays/) is the special case with no updates, and it is the shortest way to understand what a range query structure is for.
- [Advanced algorithms](/algorithms/advanced/) uses the Fenwick tree as the workhorse of parallel binary search.
- [Trees and decompositions](/algorithms/trees/) contribute the other half of the segment tree idea, since a segment tree is a tree over ranges.
- The [academy](/start/) introduces the prefix sum that the Fenwick tree generalizes, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
