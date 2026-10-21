---
id: curriculum.bronze
title: The Bronze track
summary: Simulation, careful modeling, complete enumeration, and the discipline of reading a specification exactly.
division: [bronze]
subjects: []
level: introductory
importance: core-prerequisite
keywords: [bronze, curriculum, track, division]
prerequisites:
    required: []
    recommended: [start.from-ap-csa]
reviewed: false
---

The Bronze track is about doing exactly what the statement says, on a small enough input that trying every possibility is a legitimate way to find the answer. Most Bronze problems have a solution that a competent beginner can write in under an hour, and the difficulty is not in the algorithm. It is in reading the specification correctly, modeling the situation faithfully, and not losing a case to an off-by-one on the boundary.

That sounds like a low bar, and it is not. The Bronze division contains more failed submissions than any other, and the failures are overwhelmingly failures of attention rather than failures of knowledge. The techniques below are the ones that get you past that barrier.

## The techniques, in order

1. **[Complexity analysis](/algorithms/foundations/complexity)**. Learn to look at the constraint and say what is possible. If $n \le 100$, three nested loops are fine. If $n \le 10^5$, they are not. This one habit prevents most Bronze timeouts.
2. **[Recursion](/algorithms/foundations/recursion)**. Write a simulation as a recursive function that follows the statement literally, one rule at a time. Many Bronze problems describe a process in terms of smaller copies of itself.
3. **[Subset enumeration](/algorithms/enumeration/subset-enumeration)**. Enumerate every possible choice when the statement says "for each way to choose". A bitmask over $n \le 20$ items covers most of these.
4. **[Binary representation](/algorithms/foundations/binary-representation)**. The arithmetic of integers: what overflows, what the remainder of a division is, and how the width of a type decides whether your answer is right.
5. **[Backtracking](/algorithms/enumeration/backtracking)**. Try every arrangement, and undo the choice when it leads nowhere. This is the technique behind the permutation problems and behind every problem where you must decide what to do at each step.
6. **[Sorting](/algorithms/foundations/sorting)**. Put things in order. A surprising number of Bronze problems become simple once the input is sorted, because the statement's condition turns into a comparison between neighbors.

## What you should be able to do at the end

You should be able to take an unfamiliar statement and produce a correct submission without a technique you have not used before. Concretely, you should be able to:

- **Read a specification into a model.** Translate "each cow eats one unit of grass per minute" into an array of consumption rates, and know which direction time runs. Most Bronze bugs are modeling bugs, and they are found by asking what the smallest possible input is and tracing it by hand.
- **Choose a brute force that fits.** Look at the constraint, compute the number of cases, and confirm that the loop you are about to write finishes in time. Write the naive version first and keep it, because it is the reference for the fast version you will write later.
- **Handle the boundaries.** Zero, one, the maximum value, and the case where the answer does not exist. The common mistakes listed in every article of this encyclopedia apply with full force at this level.
- **Use the right integer type.** Know that a count of operations can overflow a 32-bit integer, and use a 64-bit one without being asked.
- **Debug a wrong answer instead of guessing.** Print the small case, trace it on paper, and find the step where the program and the trace disagree.

## The subjects this track draws on

- [Foundations and complexity](/algorithms/foundations/), which supplies the constraint analysis, the recursion, the sorting, and the integer arithmetic.
- [Enumeration and searching](/algorithms/enumeration/), which supplies the brute force and the backtracking.
- [Searching](/algorithms/searching/), which you will need as soon as a Bronze problem turns out to have a larger input than you expected.

## A note on the division

USACO does not publish a fixed syllabus, and there is no official list of the techniques a Bronze problem may use. The boundary between Bronze and Silver is a statement about problem difficulty, not about algorithms, and a greedy or prefix-sum technique can appear in a Bronze problem just as a simulation can appear in a Silver one.

The techniques above are a curated route rather than an official one, and they cross division boundaries deliberately. They are not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad, and finishing this track does not predict a result in any contest.
