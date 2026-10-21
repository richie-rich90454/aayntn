---
id: arrays.index
title: The Arrays and sequences
summary: Precompute something about an array once, so that every later question about a contiguous piece of it costs a single lookup.
division: []
subjects: [arrays]
level: introductory
importance: common-contest-technique
keywords: [arrays, prefix sums, difference arrays, cumulative sums, range queries]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Arrays and sequences is the subject of problems where the same array is asked about many times, or where a question about a contiguous range appears after the input has been read.

The technique is always the same shape: spend $O(n)$ once to build a table, then answer each later question in $O(1)$. What differs between the techniques in this subject is what the table holds and which direction the question flows.

Prefix sums build the running totals, so a question about a range becomes a subtraction. Difference arrays store the changes, so an update to a range becomes two writes and a question about a range becomes a prefix sum. Two-dimensional prefix sums do the same in a grid, where the inclusion and exclusion formula has four terms instead of two.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Prefix sums | $O(n + q)$ | `foundations.complexity` | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Two-dimensional prefix sums | $O(nm + q)$ | `arrays.prefix-sums` | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) |
| Difference arrays | $O(n + q)$ | `arrays.prefix-sums` | [Difference arrays](/algorithms/arrays/difference-arrays) |

The $q$ in each bound is the number of questions. A technique in this subject earns its keep when $q$ is large and the queries are not known until after the array has been read, because that is exactly the situation in which a per-query scan is too slow.

## Recognition signals

- **"how many"** and **"sum"** together, with a range: "the sum of the elements from $l$ to $r$", "how many elements are at most $x$ in the first $i$ positions".
- **$q$ queries**, or **"there are up to $10^5$ operations"**, applied to an array of size $n$. The ratio of queries to elements is the signal: many queries over a fixed array means the work has to be moved before the queries arrive.
- **"for each operation"**, **"add $v$ to every element in the range"**, **"increment positions $l$ through $r$"**. Range updates point at difference arrays.
- **"after all operations, print the array"**. When the output is the final array rather than the answers, the updates are the natural thing to batch.
- **"a grid of $R$ rows and $C$ columns"** with a question about a rectangle, or a rectangle sum.
- **"the number of subarrays with sum $k$"**, which is a prefix sum plus a frequency map rather than a prefix sum alone.

The signal that rules the subject out is a question about a set of positions that is not contiguous. "How many pairs of elements anywhere in the array differ by $k$" is not a range question, and a prefix sum does not answer it.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Range sum, no updates | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Range sum and range updates | [Difference arrays](/algorithms/arrays/difference-arrays) |
| Range sum with updates, and the operations interleave with the queries | A [Fenwick tree](/algorithms/range-queries/fenwick-tree) or a [segment tree](/algorithms/range-queries/segment-tree) |
| Rectangle sum in a grid | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) |
| Range minimum with no updates | A [sparse table](/algorithms/range-queries/sparse-table) |
| Number of subarrays with a given sum | Prefix sums and a frequency map |
| Number of subarrays with a property that does not decompose | A [sliding window](/algorithms/searching/sliding-window) |
| A single range question | Nothing; just sum the range directly |

The last row is worth stating because the table of techniques here is tempting. If there is one range question, a prefix-sum table is $O(n)$ of work for an $O(n)$ answer, and the direct sum is better in every way. These techniques pay off when the questions are many.

## What this subject implies but does not yet cover

- **Coordinate compression.** Replacing the values in an array with their ranks, so that a structure indexed by value can be used on data whose values are large or symbolic. It is the standard bridge from this subject to [range query structures](/algorithms/range-queries/), and no article collects it yet.
- **Monotonic stacks.** A stack that discards elements which can never be the answer again, giving $O(n)$ for the largest element in each window, the next greater element, and the number of visible pairs. This is the missing counterpart to the sliding window.
- **Monotonic queues.** A queue that discards from the front any element that a later element dominates, which keeps the minimum or maximum of a moving window in $O(1)$ amortized.
- **Sliding window minima.** The specific combination of a monotonic deque with a window, which answers the maximum or minimum of every window of a fixed length in $O(n)$ total.
- **Prefix sums over other operators.** Products, minimums, and counts of a predicate under a prefix operation, none of which support the subtraction trick that makes the ordinary prefix sum work.

## Related subjects

- [Range query structures](/algorithms/range-queries/) generalize what happens here when updates arrive between the queries.
- [Searching](/algorithms/searching/) turns a prefix sum array into a searchable structure, because the running totals are sorted.
- [Graphs](/algorithms/graphs/) use the same prefix idea on trees, where a root-to-node path sum is a prefix sum on a path rather than on an interval.
- [Foundations](/algorithms/foundations/) supplies the indexing conventions that decide whether a prefix array has $n$ or $n + 1$ entries.
