---
id: greedy.index
title: The Greedy methods
summary: Make the locally best choice at every step, and prove that no sequence of local choices can do worse.
division: []
subjects: [greedy]
level: intermediate
importance: common-contest-technique
keywords: [greedy, exchange argument, interval scheduling, locally optimal choice]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Greedy is the subject of problems where the right algorithm makes the best choice immediately, without reconsidering it, and where that choice can be proved to be part of an optimal solution.

The difficulty of greedy is never the implementation. A greedy algorithm is usually one loop and a comparison. The difficulty is the proof. A greedy solution that works on every input you tried is still wrong until you have shown that the local choice never costs you anything globally, and until that proof, you have a guess.

## The techniques in this subject

| Technique | Complexity | Prerequisite | Article |
| --- | --- | --- | --- |
| Interval scheduling | $O(n \log n)$ | `foundations.sorting` | [Interval scheduling](/algorithms/greedy/interval-scheduling) |

The interval scheduling article is the worked example of the subject. It shows the full shape of a greedy argument: sort by the end time, take the first interval, discard everything that overlaps it, and prove by exchange that each choice is safe.

## Recognition signals

Greedy problems share a recognizable vocabulary, because the statement has to promise that the local choice is safe.

- **"choose as many as possible"**, **"the maximum number of"**, **"the largest total"**, **"the minimum cost"**, where the objects are intervals, jobs, or tasks that occupy a time.
- **"each item takes a certain amount of time"** or **"has a start and a finish"**. Time-ordered resources are the classic greedy setting, because one choice excludes a contiguous block of the others.
- **"no two events may happen at the same time"**, **"the rooms must not conflict"**, **"the route must not revisit"**. These are conflict rules, and a conflict structure is what makes an interval overlap check meaningful.
- **"the values are non-negative"** or **"all weights are positive"**. Non-negativity is what allows a local maximum to be a global maximum.
- **"sort by"** appearing implicitly in the goal: "schedule as many meetings as possible", "use the fewest machines", "finish the fewest tasks last".

The signal that rules greedy out is a statement whose goal is a _combination_ whose parts interact in a way that makes the ordering of choices matter. If choosing the largest item first can leave a smaller item that could have been paired with it, greedy is wrong and you need [dynamic programming](/algorithms/dynamic-programming/).

## Choosing a technique

| The situation | What to use |
| --- | --- |
| Intervals that may not overlap, maximize the count | [Interval scheduling](/algorithms/greedy/interval-scheduling) by earliest finish |
| Intervals that may not overlap, maximize the total length | The opposite rule: sort by latest start |
| Tasks each with a deadline and a duration | Earliest deadline first, with a proof that the exchange preserves feasibility |
| Jobs with a profit and a deadline, one machine | Sort by profit and accept greedily, then repair with a deadline structure |
| Any exchange argument over a sorted order | Establish the exchange lemma first, then code the loop |
| The local choice can exclude a large item | Not greedy; use [dynamic programming](/algorithms/dynamic-programming/) |
| The order of choices can change what is available later | Not greedy; the problem is usually a graph |

## What this subject implies but does not yet cover

- **The exchange argument as a general tool.** The proof that the greedy article develops for one specific problem: take an optimal solution, find the place where it disagrees with the greedy choice, swap the two, and show the result is still feasible and no worse. Written up once, it applies to most greedy problems. This is the single most valuable missing lesson in the encyclopedia.
- **Sorting by several keys**, and the rule that a greedy algorithm over intervals needs a total order, not a partial one. Two intervals with the same end time need a tie-breaker, and the tie-breaker is sometimes the whole problem.
- **Greedy with a feasibility oracle.** Choosing the largest item that still leaves a feasible completion, which is a different argument from choosing the largest item outright.
- **Scheduling with deadlines and release times**, which is a matching problem in disguise and belongs to the boundary between greedy and [graphs](/algorithms/graphs/).
- **The matroid perspective.** The reason some greedy algorithms are provably correct and others are not: the feasible sets form a matroid, and a matroid has the exchange property that makes greedy work. It is named in the [advanced algorithms page](/algorithms/advanced/) as a technique not yet covered.

## Related subjects

- [Searching](/algorithms/searching/) is where a greedy solution often lands: "the earliest time this can be scheduled" is usually found by a sliding window and a binary search.
- [Dynamic programming](/algorithms/dynamic-programming/) is the alternative whenever the exchange argument fails, and comparing the two is the fastest way to decide which to write.
- [Foundations](/algorithms/foundations/) supplies the sort that almost every greedy algorithm begins with.
