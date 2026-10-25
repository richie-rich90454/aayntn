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

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Complexity analysis | A method, not an algorithm | A method, not an algorithm | `start.computational-foundations` | [Complexity](/algorithms/foundations/complexity) |
| Recursion | The cost of its recurrence | $O(d)$ for the call stack | `start.computational-foundations` | [Recursion](/algorithms/foundations/recursion) |
| Sorting | $O(n \log n)$ | $O(n)$ for merge sort, $O(1)$ for heapsort | `foundations.complexity` | [Sorting](/algorithms/foundations/sorting) |
| Binary representation | $O(1)$ per word operation | $O(1)$ | `foundations.complexity` | [Binary representation](/algorithms/foundations/binary-representation) |

Complexity analysis is listed first because it is the tool that produces every bound in the other articles of this encyclopedia. Read it before you read anything else here, and read it again when a technique feels too expensive to use.

The recursion row is the only one whose time cell is not a single bound, and that is deliberate. A recursive function costs the solution of its recurrence relation, so the article works three examples: $O(n \log n)$ for the divide-and-conquer form, $O(n^2)$ for the linear form with linear work per call, and $O(\varphi^n)$ for the naive Fibonacci form. Its space is the depth of the recursion, $O(d)$, which is a language limit as much as an algorithmic one.

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

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Amortized analysis | O(n) total for n pushes, O(1) amortized per push | O(n) for the array | `foundations.complexity` | [Amortized analysis](/algorithms/foundations/amortized-analysis) | [Source](/implementations/foundations-amortized-analysis/) |
| Binary representation | O(1) per word operation | O(1) | `start.computational-foundations` | [Binary representation](/algorithms/foundations/binary-representation) | Prose only |
| Complexity analysis | a method, not an algorithm | a method, not an algorithm | `start.computational-foundations` | [Complexity analysis](/algorithms/foundations/complexity) | Prose only |
| Loop invariants | O(n) to read the array, then O(log n) probes | O(n) for the array, O(1) auxiliary | `foundations.complexity` | [Loop invariants](/algorithms/foundations/loop-invariants) | [Source](/implementations/foundations-loop-invariants/) |
| Recursion | the cost of its recurrence | O(d) for the call stack | `start.computational-foundations` | [Recursion](/algorithms/foundations/recursion) | Prose only |
| Sorting | O(n log n) | O(n) for merge sort, O(1) for heapsort | `foundations.complexity` | [Sorting](/algorithms/foundations/sorting) | Prose only |
| The proof techniques | a method, not an algorithm | a method, not an algorithm | `foundations.loop-invariants` | [The proof techniques](/algorithms/foundations/proof-techniques) | [Source](/implementations/foundations-proof-techniques/) |
| The time-memory tradeoff | O(n) preprocessing and O(1) per query for the full block table; O(n/B + B) per query for block totals alone | O(n + n/B) = O(n) for the full table; O(n/B) = O(sqrt n) for block totals alone | `foundations.complexity` | [The time-memory tradeoff](/algorithms/foundations/time-memory-tradeoff) | [Source](/implementations/foundations-time-memory-tradeoff/) |

<!-- aayntn:subject:end -->

## Related subjects

- [Searching](/algorithms/searching/) assumes sorting, because binary search is only valid on ordered data.
- [Enumeration](/algorithms/enumeration/) spends its whole budget on the bounds that this subject derives.
- [Number theory](/algorithms/number-theory/) takes the overflow rules from binary representation and turns them into a method.
- [Advanced algorithms](/algorithms/advanced/) assumes you can bound a technique precisely enough to notice that an offline version is faster.
- The [academy](/start/) introduces all four techniques here as part of a six-part course, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it; this subject is the compact version for readers who already write programs.
