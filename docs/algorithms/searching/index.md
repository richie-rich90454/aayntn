---
id: searching.index
title: The Searching
summary: Find a position, a pair, or a window in a collection that is too large to check one element at a time.
division: []
subjects: [searching]
level: introductory
importance: core-prerequisite
keywords: [searching, binary search, two pointers, sliding window, monotone predicate]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Searching is the subject of problems that ask you to find something in a collection too large to inspect exhaustively. The collection is usually an array, and the answer is usually a position, a count, or a pair of indices.

Every technique in this subject is about the same idea: use the relationship between neighboring elements to avoid looking at all of them. Binary search uses the relationship between an element and its neighbors to halve the range. The two-pointer technique uses the relationship between two positions to close the gap between them. The sliding window uses the fact that most of a window's contents do not change when the window moves by one. Binary search on the answer applies the halving to a quantity that is not in the array at all.

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Binary search | $O(\log n)$ | $O(1)$ | `searching.two-pointers` | [Binary search](/algorithms/searching/binary-search) |
| Two pointers | $O(n)$ | $O(1)$ | `foundations.complexity` | [Two pointers](/algorithms/searching/two-pointers) |
| Sliding window | $O(n)$ | $O(1)$ for a running sum, $O(\sigma)$ for a frequency map | `searching.two-pointers` | [Sliding window](/algorithms/searching/sliding-window) |
| Binary search on the answer | $O(c \log R)$ | $O(1)$ beyond the check | `searching.binary-search` | [Binary search on the answer](/algorithms/searching/binary-search-on-answer) |
| Ternary search | $O(\log n)$ | $O(1)$ | `foundations.complexity` | [Ternary search](/algorithms/searching/ternary-search) |

The order of the table is the order of dependence. The two-pointer technique is the simplest, and the sliding window is the two-pointer technique with an explicit notion of a window. Binary search is listed next because it has the strictest precondition: the data must be sorted, and the predicate must be monotone. Binary search on the answer relaxes that precondition by moving the search off the data and onto the answer, and ternary search relaxes it in the other direction by weakening monotone into unimodal.

The $\sigma$ in the sliding window row is the number of distinct values in the data. A window over a running sum needs nothing but the sum itself; a window over a frequency map needs one counter per distinct value.

## Recognition signals

- **"sorted"**, **"in increasing order"**, or **"the input is already ordered"**. This is the strongest signal in the subject, and it is the one that turns a linear scan into a logarithmic search.
- **"the smallest index such that"**, **"the first position where"**, **"the last position where"**. A question phrased about a _position_ rather than a value usually has a monotone predicate behind it.
- **"the largest value not exceeding"**, **"at most $k$"**, **"at least $k$"**. These are the boundary questions that the lower and upper bound variants of binary search answer.
- **"two numbers whose sum is"**, **"a pair"**, **"a subarray with sum"**. These are two-pointer problems, and the array is usually sorted precisely so that the two pointers can move toward each other.
- **"the longest run of"**, **"the longest window"**, **"the most consecutive"**, **"at most $k$ distinct"**. These are sliding-window problems, and the phrase "at most" is the standard signal that the window has a size limit rather than a fixed position.
- **"the smallest $k$ such that"**, **"the minimum capacity"**, **"the least time"**, where the condition gets easier as $k$ grows. This is the signal for binary search on the answer, and it is invisible in the constraint values.
- **"the maximum is at"**, **"the minimum is at"**, **"the function rises then falls"**. A peak-finding question over a unimodal sequence is a ternary search, and it is rare enough that the phrase is worth remembering.
- **"$n \le 10^5$"** together with a nested loop over the same array. Two loops over the same collection is the shape of a two-pointer problem in disguise.

The signal that rules the subject out is a query that depends on the whole collection rather than on a contiguous part of it, such as "how many pairs across the entire array have a difference of $k$". That is a frequency-counting problem, and it belongs to [arrays](/algorithms/arrays/) or [hash maps](/start/from-ap-csa/part-4-data-structures-and-modeling).

## Choosing a technique

| The situation | What to use |
| --- | --- |
| The array is sorted and you want one element | [Binary search](/algorithms/searching/binary-search) |
| The array is sorted and you want a boundary | [Binary search](/algorithms/searching/binary-search) for the lower or upper bound |
| The array is not sorted and you want one element | A linear scan, or a hash set |
| The array is sorted and you want a pair with a given sum | [Two pointers](/algorithms/searching/two-pointers) |
| The array is not sorted and you want a pair with a given sum | Sort it, then use two pointers |
| You want the longest subarray with a property | [Sliding window](/algorithms/searching/sliding-window) |
| You want the longest subarray with sum at most $k$ | [Sliding window](/algorithms/searching/sliding-window) with a running sum |
| You want every subarray whose sum is exactly $k$ | [Prefix sums](/algorithms/arrays/prefix-sums) and a frequency map |
| The predicate is monotone but the data is not sorted | [Binary search on the answer](/algorithms/searching/binary-search-on-answer) |
| The array is unimodal and you want its peak | [Ternary search](/algorithms/searching/ternary-search) |
| The data is neither sorted nor unimodal | A linear scan, and the hope that the constraint allows it |

The binary search on the answer row is the one worth memorizing, and it is the subject's most useful trick. When a statement asks "what is the smallest $k$ such that something holds", and the condition only becomes easier as $k$ grows, you can binary search over $k$ and evaluate the condition with any linear-time method you like. The condition must be monotone in $k$, and that is the part that has to be argued rather than assumed. The cost is $O(c \log R)$, where $c$ is the cost of one check and $R$ is the width of the answer range, so the check is what has to be made cheap.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Binary search | O(log n) | O(1) | `foundations.complexity` | [Binary search](/algorithms/searching/binary-search) | [Source](/implementations/searching-binary-search/) |
| Binary search on the answer | O(c log R) | O(1) beyond the check's own working space | `searching.binary-search` | [Binary search on the answer](/algorithms/searching/binary-search-on-answer) | Prose only |
| Parametric search | O(n log U) | O(1) | `searching.binary-search` | [Parametric search](/algorithms/searching/parametric-search) | [Source](/implementations/searching-parametric-search/) |
| Search over a sorted range of indices | O(log n) | O(1) | `searching.binary-search` | [Search over a sorted range of indices](/algorithms/searching/sorted-range-search) | [Source](/implementations/searching-sorted-range-search/) |
| Sliding window | O(n) | O(1) for a running sum, O(sigma) for a frequency map | `searching.two-pointers` | [Sliding window](/algorithms/searching/sliding-window) | Prose only |
| Ternary search | O(log_{3/2}(L / varepsilon)) iterations, each costing two evaluations | O(1) | `foundations.complexity` | [Ternary search](/algorithms/searching/ternary-search) | Prose only |
| The individual two-pointer patterns | O(n) | O(1) | `foundations.complexity` | [The individual two-pointer patterns](/algorithms/searching/two-pointer-patterns) | [Source](/implementations/searching-two-pointer-patterns/) |
| The sliding window variants with a state machine | O(n) | O(1) for a fixed byte alphabet, O(sigma) for a hash map | `searching.sliding-window` | [The sliding window variants with a state machine](/algorithms/searching/sliding-window-variants) | [Source](/implementations/searching-sliding-window-variants/) |
| Two pointers | O(n) | O(1) | `foundations.complexity` | [Two pointers](/algorithms/searching/two-pointers) | Prose only |

<!-- aayntn:subject:end -->

## Related subjects

- [Arrays and sequences](/algorithms/arrays/) supplies the prefix sums that turn a "sum of a range" question into an $O(1)$ lookup.
- [Greedy methods](/algorithms/greedy/) often ends with a binary search, because "the earliest time a thing can happen" is usually the answer a sliding window computes and a binary search then locates.
- [Advanced algorithms](/algorithms/advanced/) combines the two: parallel binary search runs many binary searches at once over a shared data structure.
- [Foundations](/algorithms/foundations/) supplies sorting, without which binary search is not available.
- The [academy](/start/) introduces the linear scan and the binary search as the two ends of the same idea, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
