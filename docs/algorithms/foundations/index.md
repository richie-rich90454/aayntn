---
id: foundations.index
title: The Foundations and complexity
summary: The vocabulary every other technique assumes, from bounding an algorithm to charging a recursive call for its cost.
division: []
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords: [foundations, complexity analysis, recursion, sorting, binary representation]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Foundations is the subject of the things every other subject assumes and almost no article re-explains. It covers four ideas: how to say that an algorithm is fast enough, how a recursive call is charged for its cost, how to put data in order, and how a machine represents an integer.

A problem that belongs to this subject rarely looks like a graph or a dynamic program. It looks like a statement whose constraint is the whole difficulty: an array of a million elements, a value that does not fit in a signed 32-bit integer, a recursion whose depth is not obvious from the statement. The recognition question for this subject is not "which algorithm do I use" but "does my approach fit in the budget, and does it overflow".

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Complexity analysis | a method for deriving bounds | none | [Complexity](/algorithms/foundations/complexity) |
| Recursion | $O(n)$ for linear recursion, $O(2^n)$ for the naive form | `foundations.complexity` | [Recursion](/algorithms/foundations/recursion) |
| Sorting | $O(n \log n)$ for merge, quicksort, and heapsort | `foundations.complexity` | [Sorting](/algorithms/foundations/sorting) |
| Binary representation | $O(1)$ per word operation | `foundations.complexity` | [Binary representation](/algorithms/foundations/binary-representation) |

Complexity analysis is listed first because it is the tool that produces every bound in the other thirty-four articles of this encyclopedia. Read it before you read anything else here, and read it again when a technique feels too expensive to use.

## Recognition signals

The phrases and constraints that point at this subject are less about the problem and more about the arithmetic around it.

- **"for all $1 \le i \le n$, where $n$ is at most $10^6$"**. A constraint of this size rules out every $O(n^2)$ approach and demands that you can name the cost of what you are about to write.
- **"the answer will not exceed $10^9$"**, or **"the number of ways"**, or **"modulo $10^9 + 7$"**. These are the signals of overflow, and they mean you must reason about the width of every accumulator you write.
- **"recursively"**, **"divide and conquer"**, or a statement that defines an object in terms of smaller versions of itself.
- **"sort"**, **"in increasing order"**, **"the $k$-th smallest"**, or **"rank"**. Ordering is a request for a technique from [sorting](/algorithms/foundations/sorting), and it is very often the first half of a two-step solution.
- **"a subset"**, **"each element either in or out"**, **"a bitmask of $n$ bits"**, or a constraint of $n \le 20$ over items that are individually chosen.
- **"print the answer modulo..."** combined with a value that overflows a 64-bit integer, which points at [modular arithmetic](/algorithms/number-theory/modular-arithmetic) rather than at this subject.

The word that most often signals this subject is simply "how many". A counting problem whose answer is large is not automatically a combinatorics problem; it is often a problem where the intermediate values overflow.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| You need to know whether an approach fits the constraint | [Complexity analysis](/algorithms/foundations/complexity) |
| The statement defines an object in terms of smaller versions of itself | [Recursion](/algorithms/foundations/recursion) |
| The recursion can go $10^5$ levels deep | Rewrite it as a loop; the depth is a language limit, not an algorithm limit |
| The answer needs the input in a canonical order | [Sorting](/algorithms/foundations/sorting) |
| You need order but stability matters | Merge sort or insertion sort, both of which are stable |
| You need order with only $O(1)$ extra space | Heapsort |
| The value is too large for a 64-bit integer | [Binary representation](/algorithms/foundations/binary-representation) with a big integer |
| A count grows past $2^{63}$ | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |
| You must pick or leave each of $n \le 20$ items | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |

## What this subject implies but does not yet cover

The following belong to this subject and do not yet have an article of their own.

- **Amortized analysis.** The reason a single `push` into a growing array can be linear while the whole sequence of pushes is linear, and the reason a disjoint set union operation is "almost" constant. The amortization argument inside the [disjoint set union article](/algorithms/graphs/dsu) is the only place it is currently worked out in full.
- **Loop invariants.** The formal statement that a loop maintains, and how to discover it. Every article in this encyclopedia states its invariant, but none of them explains how to find one.
- **The proof techniques.** Induction, contradiction, contrapositive, the pigeonhole principle, and the difference between a proof of an algorithm's correctness and a proof of its lower bound. The [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics) of the academy covers the mathematics; it does not yet connect it to the algorithm articles.
- **The time-memory tradeoff.** Why caching $O(n)$ answers to trade space for time is a decision rather than an accident, and how to decide which side to pay on when the memory limit is 256 megabytes.

## Related subjects

- [Searching](/algorithms/searching/) assumes sorting, because binary search is only valid on ordered data.
- [Number theory](/algorithms/number-theory/) takes the overflow rules from binary representation and turns them into a method.
- [Advanced algorithms](/algorithms/advanced/) assumes you can bound a technique precisely enough to notice that an offline version is faster.
- The [academy](/start/) introduces all four techniques here as part of a six-part course; this subject is the compact version for readers who already write programs.
