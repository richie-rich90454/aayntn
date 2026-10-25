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

Most of the techniques are the same shape: spend $O(n)$ once to build a table, then answer each later question in $O(1)$. What differs between them is what the table holds and which direction the question flows. Prefix sums build the running totals, so a question about a range becomes a subtraction. Difference arrays store the changes, so an update to a range becomes two writes and a question about a range becomes a prefix sum. Two-dimensional prefix sums do the same in a grid, where the inclusion and exclusion formula has four terms instead of two.

The rest of the subject is a different shape: a single linear scan that maintains an answer while it moves. The monotonic stack and the monotonic queue both keep a structure that discards an element as soon as it can never be the answer again, which is what turns an apparently quadratic inner loop into a linear scan.

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Prefix sums | $O(n + q)$ | $O(n)$ | `foundations.complexity` | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Two-dimensional prefix sums | $O(nm + q)$ | $O(nm)$ | `arrays.prefix-sums` | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) |
| Difference arrays | $O(n + q)$ | $O(n)$ | `arrays.prefix-sums` | [Difference arrays](/algorithms/arrays/difference-arrays) |
| Subarray sums | $O(n)$ expected | $O(n)$ | `arrays.prefix-sums` | [Subarray sums](/algorithms/arrays/subarray-sums) |
| Two pointers on an array | $O(n)$ | $O(1)$ | `foundations.complexity` | [Two pointers on an array](/algorithms/arrays/two-pointers) |
| Coordinate compression | $O(n \log n + q \log n)$ | $O(n)$ | `foundations.sorting` | [Coordinate compression](/algorithms/arrays/coordinate-compression) |
| Monotonic stack | $O(n)$ | $O(n)$ | `foundations.complexity` | [Monotonic stack](/algorithms/arrays/monotonic-stack) |
| Monotonic queue | $O(n)$ amortized | $O(k)$ for a window of size $k$ | `foundations.complexity` | [Monotonic queue](/algorithms/arrays/monotonic-queue) |
| Sliding window maximum | $O(n)$ | $O(k)$ besides the output | `foundations.complexity` | [Sliding window maximum](/algorithms/arrays/window-maximum) |

The $q$ in the first three bounds is the number of questions. A technique in this subject earns its keep when $q$ is large and the queries are not known until after the array has been read, because that is exactly the situation in which a per-query scan is too slow.

Two bounds need a word of explanation. The coordinate compression bound is $O(n \log n + q \log n)$, because the sort of the values is the dominant term and each query threshold also has to be compressed. The monotonic queue and the sliding window maximum both use $O(k)$ space rather than $O(n)$, because the structure only ever holds the elements inside the current window; the sliding window maximum also produces $n - k + 1$ output values, which is $O(n)$ and usually unavoidable.

## Recognition signals

- **"how many"** and **"sum"** together, with a range: "the sum of the elements from $l$ to $r$", "how many elements are at most $x$ in the first $i$ positions".
- **$q$ queries**, or **"there are up to $10^5$ operations"**, applied to an array of size $n$. The ratio of queries to elements is the signal: many queries over a fixed array means the work has to be moved before the queries arrive.
- **"for each operation"**, **"add $v$ to every element in the range"**, **"increment positions $l$ through $r$"**. Range updates point at difference arrays.
- **"after all operations, print the array"**. When the output is the final array rather than the answers, the updates are the natural thing to batch.
- **"a grid of $R$ rows and $C$ columns"** with a question about a rectangle, or a rectangle sum.
- **"the number of subarrays with sum $k$"**, which is a prefix sum plus a frequency map rather than a prefix sum alone.
- **"the next greater element"**, **"the largest element to the right of $i$"**, **"the number of visible pairs"**. These are monotonic stack questions, and the phrase "to the right of" is the signal.
- **"the maximum of every window of size $k$"**, **"the minimum of every window"**. These are monotonic queue questions, and the fixed window size is the signal.
- **"the values are large"**, **"up to $10^9$"**, **"the coordinates are arbitrary"**, where a structure indexed by value cannot be allocated. That is the signal for coordinate compression.

The signal that rules the subject out is a question about a set of positions that is not contiguous. "How many pairs of elements anywhere in the array differ by $k$" is not a range question, and a prefix sum does not answer it.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Range sum, no updates | [Prefix sums](/algorithms/arrays/prefix-sums) |
| Range sum and range updates | [Difference arrays](/algorithms/arrays/difference-arrays) |
| Range sum with updates, and the operations interleave with the queries | A [Fenwick tree](/algorithms/range-queries/fenwick-tree) or a [segment tree](/algorithms/range-queries/segment-tree) |
| Rectangle sum in a grid | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) |
| Rectangle update in a grid, read back at the end | A two-dimensional difference array |
| Range minimum with no updates | A [sparse table](/algorithms/range-queries/sparse-table) |
| Number of subarrays with a given sum | [Subarray sums](/algorithms/arrays/subarray-sums) |
| Number of subarrays with a property that does not decompose | A [sliding window](/algorithms/searching/sliding-window) |
| Count the pairs of one array that satisfy a condition | [Two pointers on an array](/algorithms/arrays/two-pointers) |
| The values are too large to index a structure by | [Coordinate compression](/algorithms/arrays/coordinate-compression), then the structure |
| The next greater or smaller element, on either side | [Monotonic stack](/algorithms/arrays/monotonic-stack) |
| The maximum or minimum of every window of a fixed size | [Monotonic queue](/algorithms/arrays/monotonic-queue) or the [sliding window maximum](/algorithms/arrays/window-maximum) |
| A single range question | Nothing; just sum the range directly |

The last row is worth stating because the table of techniques here is tempting. If there is one range question, a prefix-sum table is $O(n)$ of work for an $O(n)$ answer, and the direct sum is better in every way. These techniques pay off when the questions are many.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Coordinate compression | O(n log n + q log n) | O(n) | `foundations.sorting` | [Coordinate compression](/algorithms/arrays/coordinate-compression) | Prose only |
| Difference arrays | O(n + q) | O(n) | `arrays.prefix-sums` | [Difference arrays](/algorithms/arrays/difference-arrays) | Prose only |
| Monotonic queue | O(n) amortized | O(k) for a window of size k, O(n) without a window | `foundations.complexity` | [Monotonic queue](/algorithms/arrays/monotonic-queue) | Prose only |
| Monotonic stack | O(n) | O(n) in the worst case | `foundations.complexity` | [Monotonic stack](/algorithms/arrays/monotonic-stack) | Prose only |
| Prefix sums | O(n + q) | O(n) | `foundations.complexity` | [Prefix sums](/algorithms/arrays/prefix-sums) | [Source](/implementations/arrays-prefix-sums/) |
| Prefix sums over other operators | O(n + q) | O(n) | `arrays.prefix-sums` | [Prefix sums over other operators](/algorithms/arrays/prefix-sums-over-other-operators) | [Source](/implementations/arrays-prefix-sums-over-other-operators/) |
| Range hashing | O(n + q) | O(n) | `arrays.prefix-sums` | [Range hashing](/algorithms/arrays/range-hashing) | [Source](/implementations/arrays-range-hashing/) |
| Sliding window maximum | O(n) | O(k) besides the output | `foundations.complexity` | [Sliding window maximum](/algorithms/arrays/window-maximum) | Prose only |
| Subarray sums | O(n) expected with a frequency map, O(n log n) without one | O(n) | `arrays.prefix-sums` | [Subarray sums](/algorithms/arrays/subarray-sums) | Prose only |
| Two pointers on an array | O(n) | O(1) in place, O(n) when a frequency map is needed | `foundations.complexity` | [Two pointers on an array](/algorithms/arrays/two-pointers) | Prose only |
| Two-dimensional difference arrays | O(RC + q) | O(RC) | `arrays.difference-arrays` | [Two-dimensional difference arrays](/algorithms/arrays/two-dimensional-difference-arrays) | [Source](/implementations/arrays-two-dimensional-difference-arrays/) |
| Two-dimensional prefix sums | O(RC + q) | O(RC) | `arrays.prefix-sums` | [Two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums) | Prose only |

<!-- aayntn:subject:end -->

## Related subjects

- [Range query structures](/algorithms/range-queries/) generalize what happens here when updates arrive between the queries.
- [Searching](/algorithms/searching/) turns a prefix sum array into a searchable structure, because the running totals are sorted.
- [Graphs](/algorithms/graphs/) use the same prefix idea on trees, where a root-to-node path sum is a prefix sum on a path rather than on an interval.
- [Foundations](/algorithms/foundations/) supplies the indexing conventions that decide whether a prefix array has $n$ or $n + 1$ entries.
- The [academy](/start/) introduces the prefix sum and the difference array as one idea and its mirror image, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
