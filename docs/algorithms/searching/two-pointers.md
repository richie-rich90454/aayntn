---
id: searching.two-pointers
title: Two pointers
summary: Keep two indices in an array and move them so that each step eliminates a provably impossible region, turning a quadratic search into a linear one.
division: [silver, gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords:
    [two pointers, opposite ends, same direction, monotone, pair sum, sorted array, elimination]
prerequisites:
    required: [foundations.complexity]
    recommended: [searching.binary-search, searching.sliding-window]
complexity:
    time: "O(n)"
    space: "O(1)"
assumptions:
    - The condition that the pointers exploit is monotone, so that a discarded region is provably empty.
reviewed: false
---

## At a glance

A two-pointer solution keeps two indices in an array and moves them in a fixed direction, so that every step of the search eliminates a region that provably contains no answer. The work is then linear in the length of the array, because each pointer visits each index at most once.

There are two families, and the difference between them is which ends the pointers start at.

The **opposite-end pattern** starts one pointer at the first index and one at the last, and moves them toward each other. It needs a monotone comparison on the sum or the difference of the two elements, and it is the right tool for a sorted array and a question about a pair: "do two elements sum to $T$?", "what is the largest $a_i + a_j$ with $i < j$?".

The **same-direction pattern** starts both pointers at the first index, with one always ahead of the other, and moves both to the right. It needs a monotone running quantity, such as a window sum that never decreases when the window grows. It is the right tool for "what is the longest window whose sum is at most $K$?" and for partitioning problems.

The reason both patterns are linear is the same in each case, and it is the reason they are also easy to get wrong: **every movement of a pointer must be justified by a proof that the region it leaves behind contains no answer.** When the justification is missing, the pointer moves anyway and the answer is lost.

## Problem motivation

A blood bank holds $n$ bags of plasma, each tagged with a volume in milliliters. The tags are sorted. A hospital needs two bags whose volumes add up to exactly $600$ ml, and it needs to know whether such a pair exists.

The constraints:

- $1 \le n \le 200\,000$ bags, with the tags sorted in non-decreasing order.
- The volumes lie between $1$ and $10^9$ milliliters.
- Only one query: is there a pair that sums to $600$?

The naive answer tries every pair, which is $O(n^2) = 4 \cdot 10^{10}$ comparisons. The sorted answer is a binary search for each element, which is $O(n \log n)$ and about $3.6 \cdot 10^6$ comparisons. The two-pointer answer is $O(n)$, which is about $2 \cdot 10^5$ comparisons and one pass over the array.

What makes the two-pointer answer possible is the sorted order, and specifically what the sorted order buys: when the sum of the two ends is too small, then the left end cannot be in any solution that also uses an element no larger than the right end. So the left end is discarded outright, and a whole row of the pair table goes away in a single step.

## Recognition patterns

Two pointers is the right tool when all of the following hold.

- The answer involves a **pair** of positions, or a **window** of positions.
- There is a **monotone** quantity: something that grows when a pointer moves right, or when the window grows.
- The problem does **not** ask for the _number_ of solutions, or asks for it in a way that a single scan can still count.

The phrases that signal it are "two elements", "a pair", "a subarray", "a contiguous stretch", "two bags", "two pointers". The phrases that rule it out are "how many pairs" (which usually needs a hash map), "a subsequence" (which is not contiguous), and anything that requires the elements to be considered in a non-sorted order.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The array is sorted | The opposite-end pattern becomes valid |
| The array is not sorted but all values are non-negative | The same-direction window pattern is valid |
| The array has negative values | Rules out the window pattern unless the condition is monotone anyway |
| The question asks for a count of pairs | A single scan may undercount; use a frequency map |
| $n \le 10^3$ | A quadratic solution is fine and simpler |
| The elements must be re-ordered to be used | Rules out the opposite-end pattern entirely |

## Naive approach

The baseline is the double loop.

```python
def has_pair(a, target):
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] + a[j] == target:
                return True
    return False
```

This is $O(n^2)$ and it is correct for every array, sorted or not. It is the reference implementation for the differential test: if the two-pointer version disagrees with it on a random sorted input, one of the two is wrong.

The second baseline is the binary search version, which is $O(n \log n)$: for each $i$, search for $target - a[i]$ in the part of the array after $i$. This is a perfectly good answer and it is often what people write first. The two-pointer version is faster, and it is also easier to get wrong, so it is worth knowing which to reach for under time pressure.

## Key insight

The insight is that a comparison can eliminate more than one candidate at a time, provided the array is monotone in the right way.

Consider the opposite-end pattern on a sorted array, with pointers $l$ at the left end and $r$ at the right end, and the question "is there a pair that sums to $T$?".

- If $a_l + a_r < T$, then $a_l$ cannot be part of any solution inside the current interval. The reason is that $a_l$ is the smallest element in the interval and $a_r$ is the largest, so $a_l + a_j \le a_l + a_r < T$ for every $j$ in the interval. Every pair that uses $l$ is impossible, so $l$ moves right.
- If $a_l + a_r > T$, then $r$ cannot be part of any solution inside the current interval, because $a_i + a_r \ge a_l + a_r > T$ for every $i$ in the interval. So $r$ moves left.

Each step removes an entire row or an entire column of the table of pairs, and the pairs removed are proved impossible rather than merely untried. The interval shrinks from both ends, and the loop ends when the two pointers meet.

The same-direction pattern has the same shape with a different reason. With a running sum over the window $[l, r]$:

- If the sum is too large, then $l$ must move right, because removing elements from the left is the only way to make the sum smaller.
- If the sum is small enough, then $r$ may move right, because extending the window can only make the sum larger.

What both patterns share is the reason the pointers never have to move backwards. Each movement is justified by a proof that a whole region is empty, and the regions removed are disjoint. Once a region is proved empty, it stays empty, and there is no reason to look at it again. That is why the total work is $O(n)$ and not $O(n^2)$.

## Visual intuition

The opposite-end pattern on the sorted array $[2, 4, 6, 8, 10]$ with the target $T = 12$ looks like a pair of hands closing in from both ends of a row.

```text
l                  r
2  4  6  8  10
```

- $2 + 10 = 12$: found, and the answer is immediate.
- If the target had been 14: $2 + 10 = 12 < 14$, so the left hand moves right. The left end 2 is gone for good, because no element in the row is larger than 10 and $2 + 10$ already falls short.
- If the target had been 10: $2 + 10 = 12 > 10$, so the right hand moves left.

The picture to hold is a shrinking interval with a _justified_ discard at each step. The interval shrinks in both patterns, but in the opposite-end pattern it shrinks from both sides, and in the same-direction pattern it shrinks only at the front while the back advances.

The same-direction pattern on $[1, 2, 3, 4, 5]$ with the limit $K = 8$ looks like a worm: the head advances one cell at a time and the tail follows when the worm is too long.

```text
l  r
1  2  3  4  5
```

The head is the right pointer and the tail is the left pointer. The tail only ever moves forward, and it moves only when the sum in the worm is too big.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be an array and let $1 \le l \le r \le n$ describe an interval of it.

::: math definition Definition
A quantity $f$ of an interval $[l, r]$ is **monotone in $l$** if
$f(l, r) \le f(l+1, r)$ for every $l < r$, and **monotone in $r$** if
$f(l, r) \le f(l, r+1)$ for every $l \le r$. A function is monotone when it
is monotone in the direction that matters for the question being asked.
:::


::: math definition Definition
The **opposite-end pattern** maintains two pointers $l$ and $r$ with
$l \le r$. It starts with $l = 1$ and $r = n$, and at each step it either
increases $l$ by one or decreases $r$ by one, until the pointers cross.
:::


::: math definition Definition
The **same-direction pattern** maintains two pointers $l$ and $r$ with
$l \le r$. It starts with $l = r = 1$. The right pointer always advances,
and the left pointer advances only when a condition requires it, so that
the interval $[l, r]$ is a window that only ever moves to the right.
:::


::: math lemma Lemma
Let $a_1 \le a_2 \le \cdots \le a_n$ and let $T$ be a target. If
$a_l + a_r < T$, then there is no index $j$ with $l < j \le r$ such that
$a_l + a_j = T$. If $a_l + a_r > T$, then there is no index $i$ with
$l \le i < r$ such that $a_i + a_r = T$.
:::


::: math lemma Lemma
Let every element of $a$ be non-negative. Then the window sum
$S(l, r) = \sum_{k=l}^{r} a_k$ is non-decreasing in $r$ and
non-increasing in $l$. That is, growing the window right never decreases
the sum, and growing it left never increases the sum.
:::


The second lemma is the monotonicity that the window pattern needs, and it is exactly what a negative number destroys.

## Algorithm derivation

The state is the pair of pointers, plus whatever running quantity the problem needs: the sum of the current window, the two endpoint values, or a count.

**The opposite-end pattern**, for a sorted array and a target $T$:

1. Set $l = 0$ and $r = n - 1$.
2. While $l < r$: compute $s = a_l + a_r$. If $s = T$, report the pair. If $s < T$, increase $l$. If $s > T$, decrease $r$.
3. If the pointers meet, report that no pair exists.

The update rule is correct by the lemma. When $s < T$, the index $l$ cannot be part of any solution that lies inside $[l, r]$, and the pairs that involve $l$ and an index below $l$ were already eliminated, so $l$ can be discarded permanently.

**The same-direction pattern**, for a window whose sum must be at most $K$:

1. Set $l = 0$ and $r = 0$, with a running sum of zero.
2. For each $r$: add $a_r$ to the sum. While the sum is greater than $K$, subtract $a_l$ and increase $l$.
3. Record the length $r - l + 1$ if it beats the best so far.

The update rule is correct by the second lemma. The inner loop terminates because removing a non-negative element never increases the sum, and it stops at the smallest $l$ for which the sum is at most $K$, which is the longest valid window ending at $r$.

::: math invariant Invariant
In the opposite-end pattern, every pair of indices with one index below
the current $l$ or one index above the current $r$ has been proved to be
an invalid answer, so the answer, if it exists, lies inside $[l, r]$.
:::


::: math invariant Invariant
In the same-direction pattern, at the end of the inner loop the left
pointer is the smallest index for which the window sum is at most $K$, so
the window $[l, r]$ is the longest valid window ending at $r$.
:::


## Step-by-step execution

Take the sorted array $a = [1, 3, 4, 6, 8, 11]$ and the target $T = 10$.

**Opposite-end pattern.**

- $l = 0$, $r = 5$: $a_0 + a_5 = 1 + 11 = 12 > 10$. The pair is too large, and by the lemma the right end 11 cannot be in any solution inside the interval, so $r$ becomes 4.
- $l = 0$, $r = 4$: $1 + 8 = 9 < 10$. Too small, and no element in the interval is larger than 8, so the left end 1 is discarded and $l$ becomes 1.
- $l = 1$, $r = 4$: $3 + 8 = 11 > 10$. The right end 8 is discarded, so $r$ becomes 3.
- $l = 1$, $r = 3$: $3 + 6 = 9 < 10$. The left end 3 is discarded, so $l$ becomes 2.
- $l = 2$, $r = 3$: $4 + 6 = 10 = T$. The pair is found.

The pointers made six moves, and the interval went from six elements to two. Nothing was tried twice.

**Same-direction pattern** on the same array with the limit $K = 9$.

- $r = 0$: the sum is 1, the window is $[0, 0]$, the length is 1.
- $r = 1$: the sum is 4, the length is 2.
- $r = 2$: the sum is 8, the length is 3.
- $r = 3$: the sum is 14, which is too large. Subtract $a_0 = 1$ and advance $l$ to 1: the sum is 13, still too large. Subtract $a_1 = 3$ and advance $l$ to 2: the sum is 10, still too large. Subtract $a_2 = 4$ and advance $l$ to 3: the sum is 6, which is at most 9. The window is $[3, 3]$ and the length is 1.
- $r = 4$: the sum is 14, too large. Subtract $a_3 = 6$ and advance $l$ to 4: the sum is 8, which is at most 9. The window is $[4, 4]$ and the length is 1.
- $r = 5$: the sum is 19, too large. Subtract $a_4 = 8$ and advance $l$ to 5: the sum is 11, too large. Subtract $a_5 = 11$ and advance $l$ to 6: the sum is 0, and the window is empty.

The best window seen was $[0, 2]$ with the sum 8 and the length 3.

## Correctness proof

::: math theorem Theorem
The opposite-end pattern on a sorted array reports a pair summing to $T$
if such a pair exists, and reports that none exists otherwise.
:::


::: math proof Proof
The invariant is that every pair with an index outside $[l, r]$ has been
proved invalid, so any solution lies inside $[l, r]$.

The invariant holds initially, because $[0, n-1]$ contains every index.

Suppose it holds at the start of an iteration, and let $s = a_l + a_r$.

If $s = T$, the pair $(l, r)$ is a solution, because $l < r$ is part of the loop condition, so the two indices are distinct.

If $s < T$, then by the lemma no index $j$ with $l < j \le r$ satisfies $a_l + a_j = T$. Every pair that uses the index $l$ and an index inside the interval is therefore invalid, and every pair that uses $l$ and an index outside the interval was already invalid by the invariant. So all pairs involving $l$ are invalid, and increasing $l$ preserves the invariant.

If $s > T$, the same argument with the roles exchanged shows that all pairs involving $r$ are invalid, and decreasing $r$ preserves the invariant.

The interval shrinks at every step, so the loop terminates. It terminates either by finding a solution, which is correct, or by reaching $l \ge r$, in which case the interval holds at most one index and the invariant says no solution exists. $\square$
:::


::: math theorem Theorem
The same-direction pattern, applied to an array of non-negative values,
returns the length of the longest contiguous window whose sum is at most
$K$.
:::


::: math proof Proof
Fix a right end $r$. We show that the window $[l, r]$ produced for this
$r$ is the longest valid window ending at $r$.

The inner loop removes elements from the left while the sum exceeds $K$, and by the monotonicity lemma removing a non-negative element never increases the sum, so the loop terminates. When it stops, the sum of $[l, r]$ is at most $K$, so the window is valid.

The loop stopped because the sum became at most $K$ for the first time since $l$ was last advanced. Every index $l' < l$ was discarded at a moment when the window $[l', r']$ had sum greater than $K$ for some $r' \le r$. Because the sum is non-decreasing in $r$, the window $[l', r]$ has sum at least as large as $[l', r']$ and therefore also exceeds $K$. So every window ending at $r$ that starts before $l$ is invalid.

Hence $[l, r]$ is the longest valid window ending at $r$. Taking the maximum over all $r$ gives the longest valid window in the array. $\square$
:::


## Complexity analysis

**Time: $O(n)$ for both patterns.** Each pointer moves at most $n$ times, and each move does a constant amount of work. This holds regardless of how many candidate pairs exist, because the elimination argument, not the enumeration, is what bounds the work.

**Auxiliary space: $O(1)$.** The two pointers and, in the window pattern, the running sum are the entire state. If the array must be sorted first, the sorting costs $O(n \log n)$ and the sort is the dominant term.

::: math complexity Complexity
Two pointers: $O(n)$ time and $O(1)$ auxiliary space, provided the array
is already monotone in the way the pattern requires. If a sort is needed
first, the total is $O(n \log n)$.
:::


The linear bound is the whole point of the technique, and it is worth stating what it saves. On $n = 200\,000$ elements, the double loop is $2 \cdot 10^{10}$ comparisons and the two-pointer scan is at most $4 \cdot 10^5$. The saving is not a constant factor.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Sorted array, is there a pair with a given sum | Opposite-end two pointers |
| Sorted array, the pair with the largest sum | Opposite-end two pointers |
| Sorted array, count of pairs with a given sum | Two pointers with a frequency map, or two binary searches per element |
| Non-negative values, longest window with a bounded sum | Same-direction sliding window |
| Unsorted array, count of pairs with a given sum | A hash map of the values seen so far |
| Unsorted array, is there a pair with a given sum | A hash map, not two pointers |
| Unsorted array, longest subarray with a bounded sum | A prefix sum and a monotone stack |
| The first element that is at least $x$ | Binary search, which is a one-pointer special case |
| A subarray with a given sum, values may be negative | Prefix sums and a hash map |

The fourth and last rows are the ones worth memorizing, because they are the cases where a two-pointer solution is silently wrong rather than merely slow.

## Recursion decision

The opposite-end scan is a loop, and the loop is the right form in every language. The window pattern is a loop too, and there is nothing in either of them that a call stack could hold better.

The recursion question belongs to the alternative formulations. A divide-and-conquer pair sum splits the array in half, solves each half, and combines the answers; its depth is $O(\log n)$, which is safe in every language. A formulation that recurses once per _element_, such as one that tries the left end and then recurses on the remainder of the array, has depth $O(n)$ and crashes on a large array.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | The loop; a recursive split at depth $\log_2 n$ is also fine |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

::: math counterexample Counterexample
A sorted array of $10^6$ elements searched with a recursive formulation that
considers one end at every level makes $10^6$ nested calls. In C++ on Linux,
with an 8 MB stack and a frame of roughly 64 bytes, the stack is exhausted
after about $130\,000$ frames, so the program dies with a segmentation fault
before it has examined $13\%$ of the array. The loop finishes the same array
in at most $2 \cdot 10^5$ comparisons. The input is legal and the answer is
well defined; only the choice of implementation is wrong.
:::


The rule of thumb is simple: if the recursion depth would be proportional to the length of the array, write the loop.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the opposite-end pattern on an unsorted array | Pairs are discarded without proof and the answer is missed | Sort first, or use a hash map |
| Using the window pattern on an array with negative values | The window is not the longest valid one | Require non-negative values, or use prefix sums |
| Moving the left pointer before checking the answer | A valid pair is missed | Check the equality before moving anything |
| Using `<=` where the condition is `<` | Off-by-one on the boundary | Write the comparison down in the code |
| Letting the pointers meet and reading a single element as a pair | The same element is used twice | Loop while $l < r$ |
| Counting the pairs inside the two-pointer loop | Some pairs are counted twice or not at all | Use a frequency map when the count is the question |
| Forgetting that the window pattern needs the sum to be maintained | The inner loop recomputes the sum and becomes quadratic | Maintain a running sum |
| Assuming the pointers may move backwards | The algorithm becomes exponential in the worst case | Prove the elimination before every move |

### Why this fails: the unsorted array that loses a real pair

The mistake that survives review most often is applying the opposite-end pattern to an array that is not sorted, because the pattern looks so obviously correct on the sorted case that the assumption goes unexamined.

The smallest counterexample is the array $[3, 1, 4]$ with the target $T = 5$. The correct answer is yes: the elements 1 and 4 sum to 5.

The two-pointer scan starts with $l = 0$ and $r = 2$.

- $a_0 + a_2 = 3 + 4 = 7 > 5$, so $r$ decreases to 1.
- $a_0 + a_1 = 3 + 1 = 4 < 5$, so $l$ increases to 1.
- Now $l = r = 1$, the loop condition $l < r$ fails, and the scan reports that no pair exists.

The pair 1 and 4 was thrown away at the very first step, and it was thrown away for a reason that is false on this array. The proof of the discard said "no element in the interval is larger than 4, so 3 cannot be in a solution", and that proof used the fact that $a_0$ is the smallest element of the interval. On the array $[3, 1, 4]$ the element 3 is not the smallest; 1 is, and 1 is exactly the element that would have completed the pair.

The generalizes into a rule: **the opposite-end pattern needs the comparison to be monotone over the whole remaining interval, and the sortedness is what provides it.** When the array is not sorted, the discard proof fails, and the algorithm discards a region that may still contain the answer.

The second failure, in the other direction, is the same kind of mistake with the window pattern. The array $[-1, 5, -2]$ with $K = 3$ asks for the longest window whose sum is at most 3. The whole array sums to 2, so the answer is 3. The window pattern shrinks the left pointer whenever the sum is too large, and the shrink at $r = 1$ removes the $-1$, which was worth nothing, and then removes the 5, and the window can never recover the length it lost. The scan returns 1. The reason is that a negative value breaks the monotonicity in the right-hand pointer, so growing the window can make the sum smaller, and a left pointer that has already moved past a valid start can never come back.

## Variants and extensions

- **Three pointers.** When a third quantity is needed, such as the maximum of $a_i - a_j$ with $i \le j$, a third pointer splits the interval and the three pointers move independently. The proof of each discard has to account for the others.
- **The opposite-end pattern on a non-sorted array with a hash map.** When the values are not monotone, the pair sum is answered by scanning the array and remembering the values seen so far, which is $O(n)$ expected time and needs no sorting.
- **Counting pairs with a bound.** To count the pairs with $a_i + a_j < T$ in a sorted array, both pointers move in one direction and every pair counted is counted once, because the smaller index of the pair is the one that is advanced.
- **The partition problems.** Moving zeros to the end, removing duplicates in place, and partitioning by a value are all the same-direction pattern with a comparison instead of a sum, and they run in one pass with $O(1)$ extra space.
- **The largest rectangle in a histogram.** A stack of indices replaces the second pointer, and the pattern is the same one: an index is discarded when a smaller height proves it can never be the limiting bar of a wider rectangle.
- **The two-pointer answer to a minimax problem.** The "container with the most water" problem is the opposite-end pattern where the quantity to maximize is the minimum of the two endpoint values times the width, and the elimination proof is the same shape.
- **The slow and fast pointer.** When one pointer must always be ahead of the other and both advance every step, the fast pointer is the loop variable and the slow pointer advances only when a condition holds. This is the same-direction pattern, and the array does not have to be sorted, because the condition being tested is on the elements rather than on a sum.
- **The window on a queue.** When the input arrives as a stream, the same-direction pattern becomes a queue of the window's contents, and the two pointers become the ends of the queue. The running sum is the only extra state.

## Contest strategy

Under contest pressure, the errors above are what cost points, and the decision between the patterns can be made quickly with the following procedure.

1. Decide what is being asked for: a pair, a window, or a count. A count usually wants a frequency map, not two pointers.
2. Check the monotonicity before writing the code. Is the array sorted? Are the values non-negative? Write the answer down in a comment.
3. Write the elimination proof on paper, in one sentence, for each direction the pointer can move. If a direction has no proof, the code is wrong.
4. Decide what to do at each of the three outcomes: equal, too small, too large. All three need a branch, and the equality branch must come first.
5. Test the boundaries: an array of one element, an array of two elements, and the case where the answer does not exist.
6. If the array must be sorted first, say so, because the $O(n \log n)$ sort dominates the $O(n)$ scan and the total is no longer linear.

## Worked problems

### Problem 1: two bags of 600 milliliters

**Restatement.** A sorted array of $n$ volumes is given. Report whether two distinct elements sum to 600, and if so, the two indices. Constraints: $1 \le n \le 200\,000$, values in $[1, 10^9]$.

**Naive baseline.** Try all $n(n-1)/2$ pairs, at a cost of $2 \cdot 10^{10}$ comparisons.

**Insight.** When the sum of the two ends is too small, the left end cannot be in any solution, because it is the smallest element in the remaining interval.

**Derivation.** Set $l = 0$, $r = n - 1$. While $l < r$, compare $a_l + a_r$ with 600 and move the appropriate pointer.

**Correctness.** The elimination lemma and the invariant in the correctness proof show that every discarded pair is impossible, so the scan finds a pair if and only if one exists.

**Complexity.** $O(n)$ time and $O(1)$ space, because the array is already sorted.

**Common wrong approach.** Using the same scan on an unsorted array. The scan still runs, and it still reports "no pair" on an array that has one.

### Problem 2: the longest stretch of cheap days

**Restatement.** A row of $n$ days has a price on each day. Find the longest contiguous stretch of days whose total price is at most $K$. Constraints: $1 \le n \le 200\,000$, prices are non-negative, $K \le 10^9$.

**Naive baseline.** Try every window and sum it, at a cost of $O(n^2)$.

**Insight.** Growing the window right never lowers the sum, so once the left end of a window is known to be too far left, it is too far left for every later right end as well.

**Derivation.** Maintain a running sum. For each right end, add the new value, and while the sum exceeds $K$, remove the leftmost value and advance the left pointer. Record the length after each shrink.

**Correctness.** The proof for the window theorem shows that the window produced for each right end is the longest valid one ending there, so the maximum over all right ends is the answer.

**Complexity.** $O(n)$ time and $O(1)$ space, because each element is added once and removed at most once.

**Common wrong approach.** Recomputing the window sum from scratch inside the inner loop, which is $O(n^2)$ and looks fine on small tests.

### Problem 3: the two-pointer answer to "count the pairs"

**Restatement.** Given an array of $n$ integers, count the pairs of indices $i < j$ with $a_i + a_j = T$. Constraints: $1 \le n \le 200\,000$, values may repeat.

**Naive baseline.** The double loop, at $O(n^2)$.

**Insight.** The two-pointer scan finds one pair at a time and cannot easily count all of them, because several pairs may share an endpoint.

**Derivation.** Use a hash map of the values seen so far. For each element, add the frequency of $T - a_i$ to the answer, then insert $a_i$ into the map. The map is queried before the insertion, so the element is never paired with itself.

**Correctness.** When the scan reaches index $j$, the map holds exactly the values at the indices before $j$, so the frequency of $T - a_j$ is the number of valid pairs ending at $j$. Every pair has exactly one larger index, so every pair is counted exactly once.

**Complexity.** $O(n)$ expected time and $O(n)$ space.

**Common wrong approach.** Using the two-pointer scan and counting the pairs it walks past. The scan discards a whole region at a time, so it cannot report how many pairs that region contained.

## Practice progression

1. **Recognition.** Given a statement, decide whether two pointers applies. Look for a pair, a window, and a monotone quantity, and check the sortedness or the sign of the values.
2. **Direct application.** Implement the opposite-end scan for a pair sum and the same-direction scan for the longest bounded-sum window, and verify both against a brute-force version on small random inputs.
3. **Adaptation.** Implement the pattern for the largest pair sum, for the count of pairs below a bound, and for the partitioning problems with a comparison instead of a sum.
4. **Combination.** Combine two pointers with a hash map to count pairs with duplicate values, and with a prefix sum array to answer window-sum questions on an array with negative values.
5. **Challenge.** Solve a problem where the two pointers must move at different speeds, such as the container with the most water, and prove the elimination for each direction.
6. **Transfer.** Recognize the pattern in a problem that does not mention pairs or windows: the maximum of $a_j - a_i$ over an interval, the longest subarray with a bounded average, and the partitioning of a permutation into a monotone prefix.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What must be true of the array for the opposite-end pattern, and what breaks without it? (Key insight)
2. State the elimination lemma for the case $a_l + a_r < T$. (Formal model)
3. Why do the pointers never move backwards, and what would go wrong if they did? (Key insight)
4. What monotonicity does the window pattern need, and which values destroy it? (Formal model)
5. Give the smallest array and target for which the opposite-end pattern reports "no pair" on an array that has one. (Common mistakes)
6. State the invariant of the opposite-end pattern and say which part of the proof uses it. (Correctness proof)
7. Why is the two-pointer solution $O(n)$ when the pair table is $O(n^2)$? (Complexity analysis)
8. When does a frequency map beat two pointers, and why? (Algorithm selection)
9. Why must the equality test come before the two movement branches? (Common mistakes)
10. What is the cost of sorting the array before the scan, and does the solution stay linear? (Complexity analysis)
11. How does the slow and fast pointer version differ from the window version? (Variants and extensions)
12. What does the running sum have to maintain, and what happens if it is recomputed? (Algorithm derivation)

## Further reading

- The window version of this technique, with the frequency map that makes the update constant time, is in [sliding window](/algorithms/searching/sliding-window).
- The one-pointer version, and the monotone predicate it needs, is in [binary search](/algorithms/searching/binary-search).
- The running totals that make a window sum computable in $O(1)$ are in [prefix sums](/algorithms/arrays/prefix-sums).
- The problem where a two-pointer solution is silently wrong, and the prefix sums that fix it, is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The greedy technique that solves a scheduling problem by a single choice is in [interval scheduling](/algorithms/greedy/interval-scheduling).
