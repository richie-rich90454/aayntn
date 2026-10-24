---
id: arrays.monotonic-queue
title: Monotonic queue
summary: Keep a first-in, first-out queue whose contents are monotone, so that the extreme of a moving range is always at the front of the queue.
division: [gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords: [monotonic queue, sliding window maximum, sliding window minimum, deque, dominance]
prerequisites:
    required: [foundations.complexity]
    recommended: [arrays.prefix-sums, start.data-structures]
complexity:
    time: "O(n) amortized"
    space: "O(k) for a window of size k, O(n) without a window"
assumptions:
    - The range slides in one direction, so the candidates expire in the order they were added.
    - The extreme is a maximum or a minimum, so a dominated candidate can be discarded permanently.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Report the maximum or the minimum of a range that slides across the data |
| **Time** | $O(n)$ |
| **Auxiliary space** | $O(k)$ for a window of size $k$, $O(n)$ without a window |
| **Requires** | A sliding range, a total order on the values, and an extreme that is a maximum or a minimum |
| **Fails when** | The range's ends move in both directions, or the extreme is a median |
| **Primary technique** | A queue whose elements expire in insertion order and whose values are monotone |
| **Sibling article** | The nearest-element version is in [monotonic stack](/algorithms/arrays/monotonic-stack) |

A monotonic queue is a queue with one extra rule: the values it holds are monotone, either decreasing from front to back or increasing. The rule is not decoration. It is what makes the front of the queue the answer, and it is what allows the queue to hold only a handful of elements instead of the whole window.

The queue is the right structure whenever a range slides across the data and the question is about an extreme. The stack, its sibling, is the right structure whenever the question is about the _nearest_ element. The two share one dominance argument and differ in the direction of their expiry, and this article is mostly about that difference.

## Problem motivation

A temperature station measures $n$ moments in time. Every minute the station must publish the highest and the lowest reading of the last $k$ minutes.

The constraints:

- $1 \le n \le 10^6$ readings.
- $1 \le k \le n$, fixed for the whole run.
- Each reading is an integer.

Scanning each window costs $O(nk)$, and the two extremes together cost twice that. At $n = 10^6$ and $k = 500\,000$ that is $10^{12}$ comparisons.

The interesting part of the problem is that the two answers are read from the same data with the same discipline. If the structure that answers "the maximum of the last $k$ readings" can also answer "the minimum of the last $k$ readings" with one comparison changed, then the structure is doing something real, and it is worth understanding rather than memorizing.

The naive improvement, keeping the maximum and recomputing it when the maximum leaves the window, is quadratic in the worst case: an array that rises and then falls forces a full rescan at every step.

## Recognition patterns

The monotonic queue is the right tool when all of the following hold.

- The question asks for the **maximum or the minimum** of a range that **slides** across the data.
- The range's ends move in **one direction** only, so the elements leave the range in the order they entered it.
- The extreme is a **comparison** against a single element, not a median, a sum, or a distinct count.
- Consecutive ranges **overlap**, so most of the work of one answer is the work of the previous answer.

The phrases that signal it are "the highest reading in the last $k$ minutes", "the maximum of every consecutive $k$ elements", "the cheapest price in the last $d$ days". The phrases that rule it out are "the sum of every window" (a prefix sum), "the median of every window" (an order-statistic tree), and "the maximum of every window of a varying size" (a segment tree, if the sizes vary arbitrarily).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 10^4$ | The $O(nk)$ scan is acceptable |
| $n \ge 10^6$ | The $O(nk)$ scan is fatal |
| The window size is fixed | The queue is bounded by $k$ indices |
| The window size grows | The queue is bounded by $n$ indices |
| Both the maximum and the minimum are asked | Two queues, or one queue per comparison direction |
| The range is a subarray chosen by the reader, not slid by position | A segment tree, in [segment tree](/algorithms/range-queries/segment-tree) |

The fourth row is worth a sentence of its own. A queue with no expiry at all, that is, one that never removes an element except by dominance, is still correct for the question "the maximum of every subarray ending at each position", and it holds up to $n$ indices. The window is what bounds the space, not the dominance rule.

<Synonyms terms="monotonic queue, monotone deque, sliding window maximum, sliding window minimum, deque maximum" />

## Naive approach

The baseline rescans each range.

```python
def window_maximum(a, k):
    return [max(a[i:i + k]) for i in range(len(a) - k + 1)]
```

This is $O(nk)$ time and it is correct for every input. It is the reference implementation for the differential test.

The second baseline is a balanced tree or a multiset that holds the current window and can report its extreme in $O(\log k)$. This is the general answer and it handles a window whose size changes, and it costs $O(n \log k)$ time and $O(k)$ space.

## Key insight

The insight is the same one the stack uses, with one addition.

**The dominance rule.** Suppose two elements of the range are at positions $j < i$ with $a_j \le a_i$. Any range that contains $j$ and ends at or after $i$ also contains $i$, and so the maximum of that range is not $a_j$. Any range that contains $j$ but ends before $i$ has already been answered. So $a_j$ can never be the maximum of a range that is still to come, and it can be discarded.

**The expiry rule.** A range that slides forward loses its oldest element first. If the candidates are kept in the order they entered the range, then the one that leaves first is at the front.

Put the two rules together and the structure falls out. The queue holds the candidates in the order they entered the range, so the front is the oldest, and the values are decreasing from front to back, so the front is also the largest. The front is therefore both the next to expire and the answer.

The order of the removals is what makes the structure cheap. The expired candidates are a prefix of the queue, because the queue is in insertion order. The dominated candidates are a suffix of the queue, because the values are monotone. Both removals are therefore a run of pops at one end, and no element in the middle of the queue is ever touched.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the array and let the range at step $i$ be the window $[i-k+1, i]$.

::: math definition Definition
A **decreasing monotone queue** for the window ending at $i$ is a sequence of indices $d_1 < d_2 < \cdots < d_t$ with $d_1 \ge i-k+1$ and $a_{d_1} > a_{d_2} > \cdots > a_{d_t}$. Every index of the window that is absent from the queue is dominated by an index that is present, where an index $j$ is **dominated** by $i$ when $j < i$ and $a_j \le a_i$.
:::

::: math definition Definition
The **increasing monotone queue** is the same object with the values in increasing order, and it is used to answer the minimum of the window.
:::

::: math lemma Lemma
Let $j < i$ and $a_j \le a_i$. Then $j$ is not the maximum of any window whose right end is at least $i$. A window whose right end is before $i$ has already been answered, and a window whose right end is at least $i$ contains $i$ as well as $j$, so its maximum is at least $a_i \ge a_j$.
:::

::: math lemma Lemma
The front of the decreasing monotone queue holds the maximum of the window, and the front of the increasing monotone queue holds the minimum.
:::

::: math invariant Invariant
At the end of the iteration for position $i$, the queue holds exactly the undominated indices of the window $[i-k+1, i]$, in increasing index order and strictly decreasing value order. Every index of the window that is absent from the queue is dominated by an index that is present.
:::

## Algorithm derivation

The state is the queue of candidate indices and the output list.

1. For each index $i$ from $1$ to $n$:
2. While the front of the queue is at most $i - k$, remove it, because it has left the window.
3. While the back of the queue has a value at most $a_i$, remove it, because $i$ dominates it.
4. Append $i$ to the back.
5. If $i \ge k$, report the value at the front.

Step 2 is correct because the expired candidates are a prefix of the queue: the indices increase from front to back, so the oldest ones are at the front. Step 3 is correct by the dominance lemma, and the dominated candidates are a suffix of the queue, because the values decrease from front to back. After step 4 the invariant holds, and step 5 reads the extreme, which is at the front by the second lemma.

The minimum version is the same algorithm with the comparison in step 3 reversed and the queue kept in increasing value order.

The version with no window is the same algorithm with step 2 omitted, and it answers "the extreme of every subarray ending at position $i$".

## Step-by-step execution

Take $a = [3, 1, 4, 1, 5]$ with $k = 3$, using a decreasing queue. The maxima of the windows are $4, 4, 5$.

- $i = 1$, value 3. Nothing expires. The queue is empty, so nothing is dominated. Append 1. The queue is $[1]$.
- $i = 2$, value 1. The front index 1 is greater than $2 - 3 = -1$, so nothing expires. The back holds 3, and $3 \le 1$ is false. Append 2. The queue is $[1, 2]$.
- $i = 3$, value 4. The front index 1 is greater than 0, so nothing expires. The back holds 1, and $1 \le 4$, so 2 is removed. The back now holds 3, and $3 \le 4$, so 1 is removed. Append 3. The queue is $[3]$. The window is $[3, 1, 4]$ and the answer is 4.
- $i = 4$, value 1. The front index 3 is greater than 1, so nothing expires. The back holds 4, and $4 \le 1$ is false. Append 4. The queue is $[3, 4]$. The window is $[1, 4, 1]$ and the answer is 4.
- $i = 5$, value 5. The front index 3 is greater than 2, so nothing expires. The back holds 1, and $1 \le 5$, so 4 is removed. The back now holds 4, and $4 \le 5$, so 3 is removed. Append 5. The queue is $[5]$. The window is $[4, 1, 5]$ and the answer is 5.

The answers are $4, 4, 5$, as expected. Notice that at step 5 the queue holds a single index even though the window holds three elements: the other two were dominated.

## Correctness proof

::: math theorem Theorem
For every $i \ge k$, the algorithm reports the maximum of the window $[i-k+1, i]$, and the mirrored algorithm reports its minimum.
:::

::: math proof Proof
The invariant states that after the iteration for $i$, the queue holds exactly the undominated indices of the window $[i-k+1, i]$, in increasing index order and strictly decreasing value order, and that every absent index of the window is dominated by a present one.

The invariant holds before the first iteration, since there is no window and the queue is empty.

Suppose it holds after the iteration for $i - 1$.

Step 2 removes the indices at most $i - k$. Those indices are outside the window $[i-k+1, i]$ and must go, and because the indices increase from front to back they form a prefix of the queue.

Step 3 removes the indices at the back whose values are at most $a_i$. By the dominance lemma each of them can never be the maximum of a later window, so each must go, and because the values decrease from front to back they form a suffix.

After these two steps the queue holds the indices of $[i-k+1, i]$ that are not dominated by a later index in the window, together with the indices that were already dominated and are still waiting to expire. Appending $i$ in step 4 restores the decreasing-value order, because every remaining value is greater than $a_i$, and the index order, because $i$ is the largest index so far. The invariant is preserved.

By the second lemma the front of the queue holds the maximum of the window, so step 5 reports the correct value. The proof for the minimum is identical with every comparison reversed. $\square$
:::

## Complexity analysis

**Time: $O(n)$ amortized.** Every index is appended once, and every index is removed at most once, either because it expired or because it was dominated. The total number of queue operations is therefore at most $2n$, and the inner `while` loops, which look quadratic, are linear in total. The amortization is what makes the technique linear, and it is exactly the same argument that the monotonic stack makes.

**Auxiliary space: $O(k)$** for a window of size $k$, because every index in the queue is inside the current window. Without a window the bound is $O(n)$, and it is reached on a decreasing array where nothing is ever removed.

::: math complexity Complexity
Monotonic queue: $O(n)$ time amortized and $O(k)$ auxiliary space for a window of size $k$. The same technique with a balanced tree: $O(n \log k)$ time and $O(k)$ space.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Maximum of every window of a fixed size | A decreasing monotone queue |
| Minimum of every window of a fixed size | An increasing monotone queue |
| Maximum of every subarray ending at a position | The same queue with no expiry, in [monotonic stack](/algorithms/arrays/monotonic-stack) |
| Nearest greater element to the right | A monotonic stack, in [monotonic stack](/algorithms/arrays/monotonic-stack) |
| Maximum of an arbitrary range chosen by the reader | A segment tree, in [segment tree](/algorithms/range-queries/segment-tree) |
| Maximum and minimum of every window | Two queues |
| Median of every window | Two balanced trees with a partitioned middle, not a monotone queue |
| Sum of every window | A prefix sum, in [prefix sums](/algorithms/arrays/prefix-sums) |

## Recursion decision

The monotone queue is a loop, and there is no recursive version of it worth writing. The structure exists precisely to avoid carrying a recursive state.

The recursion question belongs to the alternatives. A segment tree that answers range maxima can be written recursively, and its depth is $O(\log n)$, which is safe in every language. A divide-and-conquer maximum over the whole array has a depth of $O(\log n)$ as well. Neither is faster than the queue for a fixed window, and both are worse in constant factors.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursive segment tree is safe, since its depth is $\log_2 n$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Safe for the same reason |
| Python | Interpreter limit of 1000 | 1000 frames | Safe, since $\log_2 10^6 \approx 20$ |
| Pascal | The operating system stack | Depends on the platform | Safe |
| JavaScript | The V8 engine limit | About $10^4$ frames | Safe |

The rule for this article is that the depth must never be proportional to the length of the window. A recursive implementation that descends into the window once per element is a crash waiting for a large $k$, and there is no reason to write one.

## Implementation walkthrough

The three lines that carry the technique are the two removals and the read.

```cpp
while (!q.empty() && q.front() <= i - k) q.pop_front();   // expired
while (!q.empty() && a[q.back()] <= a[i]) q.pop_back();     // dominated
q.push_back(i);
if (i >= k) answer[i - k] = a[q.front()];
```

The two removals touch opposite ends of the queue, and the order matters for the space, not for the answer. Doing the expiry first keeps the queue as short as possible, because a dominated element that has already expired is removed for two reasons at once.

The comparison in the second line is `<=`, so that an equal value is treated as dominated by the newer one, which outlives it. The comparison in the first line is `<= i - k`, because an index $j$ is inside the window exactly when $j \ge i - k + 1$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Keeping a plain queue with no monotone rule | The front is the oldest element, not the extreme | Maintain the value order |
| Reading the answer from the back | The answer is the minimum, not the maximum | Read the front |
| Popping from the front when a new element dominates | The extreme is lost | Dominated elements leave from the back |
| Using `<` in the dominance test | Equal values linger and the strict order breaks | Use `<=` |
| Expiring only one element per step | Wrong when the window jumps by more than one | Use a `while` loop |
| Reporting before the window is full | The first answers are meaningless | Report only when $i \ge k$ |
| Forgetting that the minimum version reverses two comparisons | The minimum version computes the maximum | Reverse both comparisons |

### Why this fails: the queue without the monotone rule

The mistake that survives review is using a plain first-in, first-out queue, which is what most people build first, and then reading the front as the answer. The code is short and the queue is a familiar structure, so the missing rule is easy to overlook.

The smallest counterexample has two elements. Take $a = [1, 2]$ with $k = 2$.

The correct answer is 2, the maximum of the only window.

The plain queue pushes both elements and reports the front, which is the element 1, so it reports 1. On a longer array the error is systematic: the queue reports the _oldest_ element of the window rather than the largest one. On $a = [3, 1, 4, 1, 5]$ with $k = 3$ it reports $3, 1, 1$, where the true maxima are $4, 4, 5$.

The second failure is to pop from the wrong end when a new element dominates. Suppose the queue removes the front element when the incoming value is larger, on the theory that the front is the weakest. The smallest counterexample is $a = [2, 1, 3]$ with $k = 2$, where the true maxima are 2 and 3. The queue holds $[2]$; the element 1 arrives and is appended, giving $[2, 1]$; the element 3 arrives and the front is removed because 3 is larger, giving $[1, 3]$; the reported maximum is 1. The correct rule removes the _back_ of the queue, because the back holds the smallest values and they are the ones a new larger element dominates.

The lesson generalizes: **in a monotone queue, the front is the answer and the back is where the dominated elements go**, and every rule that confuses the two ends produces a plausible but wrong sequence.

## Variants and extensions

- **Both extremes at once.** Run one decreasing queue and one increasing queue over the same scan, and the maximum and the minimum of every window cost $O(n)$ together.
- **The k-th largest of every window.** The dominance test becomes "at most $k-1$ elements of the window are larger", and the queue keeps up to $k$ candidates. The amortization still holds.
- **The queue without a window.** Drop the expiry rule and the structure answers the extreme of every subarray ending at each position. This is where the queue and the stack meet.
- **Two monotone queues and a sliding window.** A window with a maximum and a minimum that both move, such as a range that can be extended at either end, needs a different structure.
- **The deque in a monotone queue implementation.** A `std::deque` supports the operations the technique needs at both ends, and an array with two indices is a faster substitute in practice.
- **The same domination for a product or a sum.** The dominance argument works for any function that is monotone in each argument, so the extreme of a product over a window can be maintained the same way.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide the direction of the value order first: decreasing for a maximum, increasing for a minimum.
2. Decide which end is the answer: the front, always.
3. Decide which end the dominated elements leave from: the back, always.
4. Write the expiry comparison as an inequality on indices.
5. Use `<=` in the dominance test, and say why in a comment.
6. Test three cases by hand: $k = 1$, $k = n$, and an array that is entirely increasing.

## Worked problems

### Problem 1: the highest and lowest reading of the last $k$ minutes

**Restatement.** Given $n$ readings and a window size $k$, report the maximum and the minimum of every window of length $k$. Constraints: $1 \le n \le 10^6$, $1 \le k \le n$.

**Naive baseline.** Two rescans of every window, at $O(nk)$.

**Insight.** The same dominance rule discards a candidate for the maximum and for the minimum; only the direction of the value order differs.

**Derivation.** Run the decreasing queue for the maxima and the increasing queue for the minima over the same scan, or run the algorithm twice with the comparison reversed.

**Correctness.** The proof of the theorem applies to each queue separately.

**Complexity.** $O(n)$ time and $O(k)$ space.

**Common wrong approach.** Using a plain queue for one of the two extremes, which reports the oldest element of the window.

### Problem 2: the extreme of every subarray ending at a position

**Restatement.** Given $n$ values, report for each position the maximum of all subarrays that end there. Constraints: $1 \le n \le 10^6$.

**Naive baseline.** A backward scan from every position, at $O(n^2)$.

**Insight.** The queue without an expiry rule keeps exactly the running records of the prefix, and the front is the largest of them.

**Derivation.** Remove the expiry step from the algorithm and keep the dominance step.

**Correctness.** Every element removed from the back is dominated by a newer and larger element, so it can never be the maximum of a subarray ending at or after that moment, and the front is therefore the maximum of the prefix.

**Complexity.** $O(n)$ time and $O(n)$ space in the worst case, since a decreasing array keeps every index.

**Common wrong approach.** Keeping the expiry rule, which discards candidates that are still valid.

### Problem 3: the maximum of every window in a circular array

**Restatement.** Given a circular array of $n$ readings and a window size $k$, report the maximum of every circular window of length $k$. Constraints: $1 \le n \le 10^6$, $1 \le k \le n$.

**Naive baseline.** Double the array and solve the linear problem, at $O(n)$ time and $O(n)$ space.

**Insight.** The wrap-around windows are the windows of the doubled array, so the technique transfers unchanged.

**Derivation.** Scan the doubled array with the queue, and keep the last $n$ answers.

**Correctness.** The window ending at position $i + n - 1$ of the doubled array is the circular window starting at position $i$.

**Complexity.** $O(n)$ time and $O(n)$ space for the doubled array, or $O(n)$ time and $O(k)$ space with a modular index.

**Common wrong approach.** Emitting every answer of the doubled array, which produces $2n - k + 1$ answers where $n$ are wanted.

## Practice progression

1. **Recognition.** Given a statement, decide whether the monotone queue applies. Look for an extreme value of a sliding range, and check that the extreme is a maximum or a minimum.
2. **Direct application.** Implement the decreasing and the increasing queues, and verify both against a rescanning brute force on small random inputs.
3. **Adaptation.** Implement the queue without an expiry rule, and the version that reports both extremes in one pass.
4. **Combination.** Combine the monotone queue with a frequency map to report both the maximum and the number of distinct values in every window.
5. **Challenge.** Solve the k-th largest of every window, where the dominance test must keep several candidates rather than one, and prove the amortized bound still holds.
6. **Transfer.** Recognize the dominance argument in a different shape: the nearest greater element, the largest rectangle in a histogram, and the maximum of a sliding window over a stream of values that never all fit in memory.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the two rules that make the queue monotone. (Key insight)
2. Why is the front of the queue both the answer and the next to expire? (Key insight)
3. State the invariant of the queue. (Formal model)
4. Why is the total time $O(n)$ even though the inner loops look quadratic? (Complexity analysis)
5. How does the monotonic queue differ from the monotonic stack, in the question it answers and in the order it keeps? (Key insight)
6. Which end of the queue do the dominated elements leave from, and which end do the expired ones leave from? (Algorithm derivation)
7. Give the smallest array that breaks the plain-queue version. (Common mistakes)
8. Why is the space $O(k)$ for a window and $O(n)$ without one? (Complexity analysis)
9. When does the queue need a balanced tree instead? (Algorithm selection)
10. Which comparison flips to turn the maximum version into the minimum version? (Implementation walkthrough)
11. Why does a recursive implementation of the window fail on a large $k$? (Recursion decision)
12. How does the queue version of "the extreme of every subarray ending at $i$" relate to the stack version? (Variants and extensions)

## Further reading

- The nearest-element version of the same dominance argument is in [monotonic stack](/algorithms/arrays/monotonic-stack).
- The sliding window maximum on its own, with the amortized argument spelled out, is in [sliding window maximum](/algorithms/arrays/window-maximum).
- The window that carries a frequency map rather than an extreme is in [sliding window](/algorithms/searching/sliding-window).
- The range structure that answers arbitrary ranges is in [segment tree](/algorithms/range-queries/segment-tree).
- The running totals that answer the sum of every window are in [prefix sums](/algorithms/arrays/prefix-sums).
