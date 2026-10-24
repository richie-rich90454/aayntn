---
id: arrays.monotonic-stack
title: Monotonic stack
summary: Answer the nearest greater element questions of an array in linear time by keeping the unresolved indices in a stack whose values decrease from bottom to top.
division: [gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords:
    [
        monotonic stack,
        next greater element,
        decreasing stack,
        largest rectangle in a histogram,
        stack,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.recursion, searching.binary-search]
complexity:
    time: "O(n)"
    space: "O(n) in the worst case"
assumptions:
    - The question is about the nearest element to the left or right with a larger or a smaller value.
    - A candidate that is dominated can be discarded permanently, because the newer element outlives it.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | For each position, find the nearest element to its left or right with a larger or a smaller value |
| **Time** | $O(n)$ |
| **Auxiliary space** | $O(n)$ in the worst case |
| **Requires** | A total order on the values, and a question about the _nearest_ qualifying element |
| **Fails when** | The question is about the extreme of a whole window, which a queue answers better |
| **Primary technique** | A stack of unresolved indices, decreasing in value from bottom to top |
| **Sibling article** | The queue-shaped version is in [monotonic queue](/algorithms/arrays/monotonic-queue) |

The stack holds the indices whose answer has not been found yet. When a new element arrives, it is larger than some of them, and for each of those it is the answer. Those indices are popped and settled, and the new element takes their place.

The whole technique is a single loop with two inner loops, and the correctness rests on one observation about what a newer element does to an older one. The linearity rests on a second observation: an index is pushed once and popped at most once, so the total number of stack operations is bounded by $2n$ no matter how the values are arranged.

## Problem motivation

A seismograph records $n$ readings. After each reading, a monitoring station must report the index of the next reading that is strictly greater than the current one, or $-1$ if there is none.

The constraints:

- $1 \le n \le 10^6$ readings.
- $0 \le a_i \le 10^9$.
- The output is one index per reading.

The naive answer scans forward from each position until it finds a larger value, which costs $O(n^2)$ in the worst case. On a decreasing array every scan runs to the end of the array, so the total is $\frac{n(n+1)}{2} \approx 5 \cdot 10^{11}$ comparisons.

The classic wrong turn is to compute the answers from right to left with a scan, which is the same quadratic algorithm with a different direction.

What the problem really asks is a _nearest_ question: for each position, the first position to the right that beats it. That is exactly the question a stack answers well, because a stack remembers the unresolved positions in the order they appeared, and the moment a new element settles one of them, that one is the most recent such element.

## Recognition patterns

The monotonic stack is the right tool when all of the following hold.

- The question is about the **nearest** element with a larger or a smaller value, to the left or to the right.
- The comparison is a **total order** on the values, so "greater" and "smaller" are unambiguous.
- The same comparison is used for every position, so one pass serves all of them.
- The answers are **independent**: each position's answer is not affected by the answers of the others.

The phrases that signal it are "the next greater element", "the closest larger value on the left", "the nearest smaller element to the right", "the first element to the right that is at least $x$". The phrases that rule it out are "the maximum of every window" (a queue answers that better), "the second largest element" (an order-statistic structure), and "the smallest element greater than $x$ anywhere" (a sorted structure).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 10^3$ | The quadratic scan is fine; the stack is a refinement |
| $n \ge 10^5$ | The quadratic scan is fatal |
| The comparison is strictly greater or strictly smaller | The stack applies as written |
| The comparison is "at least" or "at most" | The stack applies with the comparison changed |
| The values are not comparable, for example a set of intervals | The stack does not apply; a different structure is needed |
| The question asks for the extreme of a sliding range | Use a queue instead, in [monotonic queue](/algorithms/arrays/monotonic-queue) |

The third and fourth rows are a distinction worth keeping in mind. A stack with a strict comparison answers "the next _strictly_ greater element"; a stack with a weak comparison answers "the next element at least as large". Mixing them up changes the answer on arrays with equal values, and that is the most common source of a wrong answer in this technique.

<Synonyms terms="monotonic stack, decreasing stack, next greater element, nearest greater element, monotonic stack trick" />

## Naive approach

The baseline scans forward from every position.

```python
def next_greater(a):
    n = len(a)
    answer = [-1] * n
    for i in range(n):
        j = i + 1
        while j < n and a[j] <= a[i]:
            j += 1
        answer[i] = j if j < n else -1
    return answer
```

This is $O(n^2)$ and it is correct for every array. It is the reference implementation for the differential test.

The second baseline is the binary search version: for each position, search the sorted suffix. It is $O(n \log n)$ if the suffix is maintained as a sorted list, and it is worse than the stack in both time and space.

## Key insight

The insight is that **a newer element settles an older one**.

Suppose the scan has reached position $i$, and the stack holds indices $s_1 < s_2 < \cdots < s_t$ with

$$
a_{s_1} > a_{s_2} > \cdots > a_{s_t}.
$$

Each of these indices is still waiting for its next greater element. The values decrease from bottom to top, so the elements at the top are the smallest, and they are the ones most likely to be settled by the new value $a_i$.

If $a_{s_t} < a_i$, then $i$ is a greater element to the right of $s_t$. Is it the _nearest_ one? The indices between $s_t$ and $i$ were all popped from the stack when they arrived, precisely because they were smaller than something to their left. Hmm, that argument needs care. Let me state it correctly.

Every index between $s_t$ and $i$ was pushed after $s_t$ and popped before $i$ arrived, because it was dominated by something to its right. The lemma below states exactly what that implies, and it is the reason the popped index can be given the current index as its answer.

::: math lemma Lemma
When a new index $i$ arrives and the index $s$ at the top of the stack satisfies $a_s < a_i$, then $i$ is the nearest index to the right of $s$ with a value greater than $a_s$.
:::

The proof of the lemma is by contradiction on the nearest candidate. Suppose there were an index $u$ with $s < u < i$ and $a_u > a_s$. When $u$ arrived, the index $s$ was still on the stack, and since $a_u > a_s$ the pop loop would have removed $s$ and settled it. That contradicts $s$ still being on the stack when $i$ arrived. So no such $u$ exists, and $i$ is the nearest.

The corollary that makes the technique work is the amortization. Every index is pushed once, when the scan reaches it. Every index is popped at most once, when it is settled. The total number of stack operations is therefore at most $2n$, and the inner loops, which look quadratic, are in fact linear in total.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the array, and define

$$
G(i) = \min \{ j > i : a_j > a_i \},
$$

with $G(i) = -1$ when no such $j$ exists. The variant $S(i) = \min \{ j > i : a_j < a_i \}$ is the next strictly smaller element, and it is handled by reversing the comparisons.

::: math definition Definition
A **candidate index** for position $i$ is an index $j > i$ with $a_j > a_i$ that has not yet been reached by the scan. The **answer** $G(i)$ is the smallest candidate index, that is, the first one the scan reaches.
:::

::: math definition Definition
The **stack** is a sequence of indices $s_1 < s_2 < \cdots < s_t$ with $a_{s_1} > a_{s_2} > \cdots > a_{s_t}$, all of them unresolved. An index is **settled** when it is popped, and the index that pops it is its answer.
:::

::: math lemma Lemma
The stack always holds its indices in increasing index order, and its values in decreasing order from bottom to top.
:::

The lemma is immediate from the update rule: a new index is appended at the top, and only elements with a smaller value are popped, so the remaining values are all greater than the new one.

::: math invariant Invariant
At the end of the iteration for index $i$, the stack holds exactly the unresolved indices of the prefix $[1, i]$, in increasing index order and strictly decreasing value order, and every index already settled has been given its correct answer.
:::

## Algorithm derivation

The state is the stack of unresolved indices and the answer array.

1. For each index $i$ from $1$ to $n$:
2. While the stack is not empty and $a_{\text{top}} < a_i$, pop the top index $s$ and set the answer of $s$ to $i$.
3. Push $i$.

Step 2 is correct by the lemma: each popped index $s$ has $a_i > a_s$, and no index between $s$ and $i$ has a value greater than $a_s$, so $i$ is the nearest greater element to the right of $s$.

Step 3 preserves the decreasing-value property, because every value left on the stack is greater than $a_i$.

The variant for the next strictly _smaller_ element reverses the comparison in step 2. The variant for the previous greater element scans the array from right to left and keeps the same stack discipline.

## Step-by-step execution

Take $a = [2, 1, 4, 3, 5]$ and ask for the next strictly greater element of each position.

- $i = 1$, value 2. The stack is empty, so nothing is popped. Push 1. The stack is $[1]$.
- $i = 2$, value 1. The top holds 2, and $2 < 1$ is false, so nothing is popped. Push 2. The stack is $[1, 2]$, with values $2, 1$.
- $i = 3$, value 4. The top holds 1, and $1 < 4$, so index 2 is popped and its answer is 3. The top now holds 2, and $2 < 4$, so index 1 is popped and its answer is 3. The stack is empty, so push 3. The stack is $[3]$.
- $i = 4$, value 3. The top holds 4, and $4 < 3$ is false. Push 4. The stack is $[3, 4]$.
- $i = 5$, value 5. The top holds 3, and $3 < 5$, so index 4 is popped and its answer is 5. The top now holds 4, and $4 < 5$, so index 3 is popped and its answer is 5. Push 5. The stack is $[5]$.

The answers are $3, 3, 5, 5, -1$, which is correct: the element 4 at index 3 is greater than both 2 and 1, and the element 5 at index 5 is greater than both 4 and 3.

The stack never held more than two indices, and it emptied completely at index 3. The maximum stack depth is a property of the data: it is reached on a decreasing array, where nothing is ever popped and the stack grows to $n$ indices.

## Correctness proof

::: math theorem Theorem
For every index $s$, the algorithm reports the smallest index $j > s$ with $a_j > a_s$, or $-1$ when no such index exists.
:::

::: math proof Proof
The invariant states that the stack holds exactly the unresolved indices of the prefix, in increasing index order and strictly decreasing value order, and that every settled index has been given its correct answer.

The invariant holds initially, since the prefix is empty and the stack is empty.

Suppose it holds after the iteration for $i - 1$, and consider the iteration for $i$.

Let $s$ be an index popped during step 2. The pop happens because $a_s < a_i$, and by the lemma $i$ is the nearest index to the right of $s$ with a value greater than $a_s$. So the answer recorded for $s$ is correct. Every index popped during this iteration is settled, and each is settled correctly.

Now let $s$ remain on the stack after step 2. Then $a_s \ge a_i$, since the loop stops as soon as the top fails the test $a_{\text{top}} < a_i$, and the values below the top are even larger. The index $i$ therefore does not answer $s$, and $s$ stays unresolved, which is correct.

Step 3 pushes $i$. Every value left on the stack is at least $a_i$, so the decreasing-value property is preserved, and the index order is preserved because $i$ is larger than every index on the stack. The unresolved set is exactly the previous unresolved set minus the indices settled in step 2, plus $i$, which is correct because $i$ is unresolved until a later element settles it. The invariant is preserved.

Finally, consider an index $s$ that is never popped. It is never settled, and by the lemma no index to its right has a value greater than $a_s$, because such an index would have popped it. So $s$ has no next greater element, and $-1$ is the correct answer. Every other index was settled with the correct answer when it was popped. $\square$
:::

## Complexity analysis

**Time: $O(n)$.** The outer loop runs $n$ times. Every index is pushed once and popped at most once, so the total number of iterations of the inner `while` loop is at most $n$. The total is therefore at most $3n$ operations of the inner machinery.

The amortization is the whole point. A single iteration can pop $n$ indices, which is $O(n)$ for that iteration, but such an iteration must have pushed those indices earlier, and each of them is popped only once. The sum of all the inner loop costs is bounded by the number of pushes.

**Auxiliary space: $O(n)$** in the worst case, which is reached on a decreasing array where no element is ever popped. The stack holds at most $n$ indices, and the answer array holds $n$ entries.

::: math complexity Complexity
Monotonic stack: $O(n)$ time, amortized over the whole scan, and $O(n)$ auxiliary space in the worst case. The quadratic inner loop is amortized linear because every index is pushed once and popped at most once.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Nearest greater element to the right | This technique |
| Nearest smaller element to the left | The same technique, scanned from right to left |
| Nearest element with a value at least $x$ | The same technique with a weak comparison |
| Maximum of every window of a fixed size | A deque, in [monotonic queue](/algorithms/arrays/monotonic-queue) |
| Maximum of every subarray ending at a position | A deque or a stack, in [monotonic queue](/algorithms/arrays/monotonic-queue) |
| The second largest element of a range | An order-statistic tree, not a stack |
| The largest rectangle in a histogram | This technique, with a different aggregation |
| The count of subarrays in which a position is the maximum | This technique, with a count instead of an index |

The third and fourth rows are the boundary between the stack and the queue, and the choice follows from the question. A stack answers "the nearest", because it settles an index the moment the answer arrives. A queue answers "the extreme of a range", because it keeps the current range's candidates in expiration order.

## Recursion decision

The stack technique is a loop. There is no recursive formulation of it that improves on the loop, and a recursive one is actively dangerous, because the recursion depth would be the length of the array.

The question worth asking is whether a related problem should be solved recursively. The largest rectangle in a histogram has a recursive divide-and-conquer form that is often taught first, and it is exactly the form that crashes on a large input.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursion over $n = 10^6$ elements overflows the stack; use the loop |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The same; the crash is a `StackOverflowError` |
| Python | Interpreter limit of 1000 | 1000 frames | The same; the crash is a `RecursionError` |
| Pascal | The operating system stack | Depends on the platform | The same |
| JavaScript | The V8 engine limit | About $10^4$ frames | The same; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer, and it happens on exactly the inputs the constraints allow. A histogram of $10^6$ bars is legal, and the recursive form dies on it.

## Implementation walkthrough

The two lines that carry the technique are the pop loop and the push.

```cpp
while (!st.empty() && a[st.back()] < a[i]) {
    answer[st.back()] = i;   // i is the nearest greater element to the right
    st.pop_back();
}
st.push_back(i);
```

The comparison is `<` for the next _strictly_ greater element. Changing it to `<=` makes the algorithm answer "the next element at least as large", which is a different question. On an array with equal values the two answers differ, and on $a = [3, 3]$ the strict version gives $-1$ for both positions while the weak version gives 1 for the first.

The assignment happens inside the loop, before the pop. Writing it after the loop is a common mistake, because then only the last popped index receives an answer.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `<=` for a strictly greater question | Equal values are treated as answers | Match the comparison to the statement |
| Recording the answer when the index is pushed | Most positions never get an answer | Record it when the index is popped |
| Using a stack of values instead of indices | The answer cannot be reported as an index | Store the indices |
| Forgetting to initialize the answers to $-1$ | Unsettled positions hold garbage | Initialize the whole array |
| Mixing up the scan direction for a previous-element question | The answers are for the wrong side | Scan from right to left for previous greater |
| Assuming the stack is bounded by the window size | The space estimate is wrong | The stack can hold $n$ indices |
| Using a queue instead of a stack | The nearest answer is missed | The order of the unresolved indices matters |

### Why this fails: the answer recorded at the wrong moment

The mistake that survives review is recording the answer at the wrong time. It is easy to make, because the index $i$ really is greater than the element that is popped, and the mind wants to attach the answer to $i$ rather than to the popped element.

The smallest counterexample has two elements. Take $a = [1, 2]$ and ask for the next strictly greater element of each position.

The correct answers are $1$ and $-1$: the element 2 at index 2 is the nearest greater element to the right of the element 1 at index 1, and index 2 has nothing after it.

The wrong implementation records an answer when an index is _pushed_: when index 1 is pushed it is given the answer 2, and when index 2 is pushed it is given the answer $-1$. The answer for index 1 is never written, because index 1 was never popped. The output is $[-1, -1]$.

The failure is systematic and not a matter of a lucky small case. In a stack of length $t$, the wrong rule gives an answer to the new element at every push and never to the elements that were waiting, which is most of the array. On $a = [2, 1, 4, 3, 5]$ the wrong rule answers $[-1, 3, -1, 5, -1]$ where the correct answers are $[3, 3, 5, 5, -1]$.

The second failure is the comparison. If the statement asks for the next strictly greater element and the code uses `<=`, then on $a = [3, 3]$ the algorithm settles index 1 at index 2 and reports 2, even though 3 is not strictly greater than 3. Two elements are enough to break it.

The lesson generalizes: **in a stack technique the answer is delivered by the pop, not by the push**, because the pop is the moment at which the nearest qualifying element is known.

## Variants and extensions

- **The previous greater element.** Scan from right to left with the same stack discipline. The answer for an index is assigned when the index is pushed, because the current element is the nearest greater element to the left.
- **The next smaller element.** Reverse the comparison in the pop loop.
- **The largest rectangle in a histogram.** Pop an index when a smaller bar arrives, and use the popped index as the limiting bar of a rectangle that ends at the current position. The stack is unchanged; only the aggregation changes.
- **Trapping rain water.** The same stack, with the height of the popped bar and the current bar bounding a trapped volume.
- **The count of subarrays in which a position is the maximum.** When an index is popped, the number of subarrays in which it is the maximum is the product of the distances to the neighboring stack entries.
- **The sum of the subarray minimums.** The same, with the popped value multiplied by the same distances and summed.
- **The maximum width ramp.** The stack holds the indices of the decreasing prefix, and a second pass looks for the farthest matching end.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the comparison, exactly as the statement words it: strictly greater, at least, strictly smaller.
2. Write down which side the answer is on, and choose the scan direction accordingly.
3. Remember that the answer is delivered by the pop, and initialize the answers to the "not found" value.
4. Keep the indices, not the values, on the stack.
5. Test three arrays by hand: an increasing array, a decreasing array, and an array with two equal values.
6. Check the space: a decreasing array of $10^6$ elements puts $10^6$ indices on the stack.

## Worked problems

### Problem 1: the next greater reading

**Restatement.** Given $n$ readings, report for each position the index of the next strictly greater reading, or $-1$. Constraints: $1 \le n \le 10^6$.

**Naive baseline.** A forward scan from every position, at $O(n^2)$.

**Insight.** A newer element settles the older ones it dominates, and it is the nearest such element because the ones in between were settled even earlier.

**Derivation.** Run the stack algorithm of the derivation, with the pop loop assigning the answer of each popped index to the current index.

**Correctness.** The proof shows that each index is settled with its nearest greater element, and that an index never settled has none.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Assigning answers at push time, which leaves most positions unanswered.

### Problem 2: the largest rectangle in a histogram

**Restatement.** Given $n$ bar heights, report the area of the largest rectangle that fits under the bars. Constraints: $1 \le n \le 10^6$, heights in $[0, 10^5]$.

**Naive baseline.** For every pair of bars, take the smaller height and multiply by the width, at $O(n^2)$.

**Insight.** When a shorter bar arrives, it caps every taller bar that is still open, and the widest rectangle for each of those bars ends at the current position.

**Derivation.** Keep the stack of open bars with increasing indices and increasing heights. When the current height is smaller than the top's height, pop the top bar $s$, and take the rectangle of height $a_s$ and width $i - (new\ top) - 1$, where the new top is the bar to the left of the popped one, or $-1$ if the stack is empty.

**Correctness.** A bar is popped exactly when a shorter bar arrives, which is the first moment its rectangle cannot grow to the right. Its left limit is the bar below it on the stack, which is the nearest bar shorter than it. So the rectangle computed at the pop is the widest one of that height, and every candidate height is examined.

**Complexity.** $O(n)$ time and $O(n)$ space, by the same push-once-pop-once argument.

**Common wrong approach.** Using a recursive divide and conquer on an array of $10^6$ bars, which overflows the stack in every language.

### Problem 3: the number of subarrays in which a position is the maximum

**Restatement.** Given $n$ values, for each position report the number of subarrays in which that position holds the maximum. Constraints: $1 \le n \le 10^5$.

**Naive baseline.** For each position, scan left and right to find the nearest greater element on each side, at $O(n^2)$.

**Insight.** The nearest greater element on each side is exactly what the stack discovers, and the count is the product of the two distances.

**Derivation.** When an index $s$ is popped, the element below it on the stack is the nearest greater element to the left of $s$, and the current index is the nearest greater element to the right. The number of subarrays in which $s$ is the maximum is $(\text{left distance}) \times (\text{right distance})$.

**Correctness.** A subarray in which $s$ is the maximum must start after the nearest greater element on the left and end before the nearest greater element on the right, and every such subarray is valid.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Reporting the count of subarrays in which $s$ is the _unique_ maximum, which needs one more comparison on the side of the equal values.

## Practice progression

1. **Recognition.** Given a statement, decide whether the monotonic stack applies. Look for "nearest", "next", "closest", and check that the comparison is a total order.
2. **Direct application.** Implement the next greater and the next smaller element, and verify both against a quadratic brute force on small random inputs.
3. **Adaptation.** Implement the previous greater element by scanning from the right, and the weak-comparison variant for "at least".
4. **Combination.** Combine the stack with prefix sums to answer the sum of the subarray minimums over all subarrays, and with a running count to answer the number of subarrays in which each position is the maximum.
5. **Challenge.** Solve the largest rectangle in a histogram on $n = 10^6$ bars, and prove that the amortized bound holds for a histogram with many equal heights.
6. **Transfer.** Recognize the same mechanism in a different setting: the next greater element in a circular array, the maximum width ramp, and the stack that a depth-first search uses for its parent pointers.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the stack hold, and what is the order of its values? (Formal model)
2. Why is a popped index given the current index as its answer? (Key insight)
3. State the invariant of the stack. (Formal model)
4. Why is the total time $O(n)$ when a single iteration can pop $n$ indices? (Complexity analysis)
5. What is the smallest array that breaks the strict comparison? (Common mistakes)
6. What is the smallest array that breaks the push-time answer rule? (Common mistakes)
7. How does the scan direction change for a previous-element question? (Algorithm derivation)
8. What is the maximum stack depth, and on which input is it reached? (Complexity analysis)
9. Which language limits make a recursive version of the histogram problem fail, and on what input? (Recursion decision)
10. When is a queue the better structure than a stack? (Algorithm selection)
11. How does the histogram problem reuse the stack without changing it? (Variants and extensions)
12. Why must the answer be recorded inside the pop loop rather than after it? (Implementation walkthrough)

## Further reading

- The queue-shaped version of the same dominance argument is in [monotonic queue](/algorithms/arrays/monotonic-queue).
- The window that carries a frequency map is in [sliding window](/algorithms/searching/sliding-window).
- The other extreme of the sliding window, the maximum of every window, is in [sliding window maximum](/algorithms/arrays/window-maximum).
- The recursive enumeration that a stack implements is in [backtracking](/algorithms/enumeration/backtracking).
- The running totals that turn a range into a subtraction are in [prefix sums](/algorithms/arrays/prefix-sums).
