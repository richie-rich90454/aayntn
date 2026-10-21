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

Three techniques cover almost all of it, and they are all about the same idea: use the relationship between neighboring elements to avoid looking at all of them. Binary search uses the relationship between an element and its neighbors to halve the range. The two-pointer technique uses the relationship between two positions to close the gap between them. The sliding window uses the fact that most of a window's contents do not change when the window moves by one.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Binary search | $O(\log n)$ | `searching.two-pointers` | [Binary search](/algorithms/searching/binary-search) |
| Two pointers | $O(n)$ | `foundations.complexity` | [Two pointers](/algorithms/searching/two-pointers) |
| Sliding window | $O(n)$ | `searching.two-pointers` | [Sliding window](/algorithms/searching/sliding-window) |

The order of the table is the order of dependence. The two-pointer technique is the simplest of the three, and the sliding window is the two-pointer technique with an explicit notion of a window. Binary search is listed last because it has the strictest precondition: the data must be sorted, and the predicate must be monotone.

## Recognition signals

- **"sorted"**, **"in increasing order"**, or **"the input is already ordered"**. This is the strongest signal in the subject, and it is the one that turns a linear scan into a logarithmic search.
- **"the smallest index such that"**, **"the first position where"**, **"the last position where"**. A question phrased about a _position_ rather than a value usually has a monotone predicate behind it.
- **"the largest value not exceeding"**, **"at most $k$"**, **"at least $k$"**. These are the boundary questions that the lower and upper bound variants of binary search answer.
- **"two numbers whose sum is"**, **"a pair"**, **"a subarray with sum"**. These are two-pointer problems, and the array is usually sorted precisely so that the two pointers can move toward each other.
- **"the longest run of"**, **"the longest window"**, **"the most consecutive"**, **"at most $k$ distinct"**. These are sliding-window problems, and the phrase "at most" is the standard signal that the window has a size limit rather than a fixed position.
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
| The predicate is monotone but the data is not sorted | Binary search over the _answer_, not over the data |

The last row is the one worth memorizing, and it is the subject's most useful trick. When a statement asks "what is the smallest $k$ such that something holds", and the condition only becomes easier as $k$ grows, you can binary search over $k$ and evaluate the condition with any linear-time method you like. The condition must be monotone in $k$, and that is the part that has to be argued rather than assumed.

## What this subject implies but does not yet cover

- **Binary search on the answer.** Searching over the value of the answer rather than over the data, with the monotonicity condition as the precondition. It is named as a variant in the [binary search article](/algorithms/searching/binary-search) and it is the standard tool for the "minimum capacity" and "minimum time" family of problems, but it does not have an article of its own.
- **The individual two-pointer patterns.** Partitioning an array around a pivot, the three-sum problem, the container with most water, and the palindrome check by two pointers. The [two pointers article](/algorithms/searching/two-pointers) derives the general technique; each of these patterns is a worked example there rather than a separate lesson.
- **The sliding window variants with a state machine.** Windows over a string with a variable number of distinct characters, the longest substring with $k$ distinct characters, and the minimum window that covers a set of characters. The general technique is in the [sliding window article](/algorithms/searching/sliding-window).
- **Search over a sorted range of indices.** Binary searching a sub-range of an array, and binary searching a vector of intervals to find the one that contains a point. This is an interval tree query, and it is a common contest shape that no article currently collects.

## Related subjects

- [Arrays and sequences](/algorithms/arrays/) supplies the prefix sums that turn a "sum of a range" question into an $O(1)$ lookup.
- [Greedy methods](/algorithms/greedy/) often ends with a binary search, because "the earliest time a thing can happen" is usually the answer a sliding window computes and a binary search then locates.
- [Advanced algorithms](/algorithms/advanced/) combines the two: parallel binary search runs many binary searches at once over a shared data structure.
- [Foundations](/algorithms/foundations/) supplies sorting, without which binary search is not available.
