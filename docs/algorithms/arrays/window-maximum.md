---
id: arrays.window-maximum
title: Sliding window maximum
summary: Answer the maximum of every window of a fixed size in linear time by keeping the candidates in a deque whose values decrease from front to back.
division: [gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords: [window maximum, monotonic deque, sliding window maximum, deque, amortized analysis]
prerequisites:
    required: [foundations.complexity]
    recommended: [arrays.prefix-sums, start.data-structures]
complexity:
    time: "O(n)"
    space: "O(k) besides the output"
assumptions:
    - The window size is fixed and known before the scan starts.
    - Only the maximum is needed, so a candidate that is dominated can be discarded permanently.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Report the maximum of every window of length $k$ in an array of $n$ elements |
| **Time** | $O(n)$ |
| **Auxiliary space** | $O(k)$ |
| **Requires** | A window of fixed size, and a total order on the values |
| **Fails when** | The window size changes at every step, and the answer depends on the whole window |
| **Primary technique** | A deque of candidate indices whose values decrease from front to back |
| **Sibling article** | The general structure is in [monotonic queue](/algorithms/arrays/monotonic-queue) |

A deque is used, not a priority queue, and the reason is the shape of the question. Every window that ends at position $i$ shares $k-1$ elements with the window that ended at $i-1$, so most of the work of one answer is the work of the previous answer. The deque keeps exactly the candidates that can still be the maximum, in the order they will expire, and it discards a candidate the moment a newer and larger element arrives.

The technique is linear, but not because every step does constant work. A single step can discard half the deque. The linearity comes from an amortized argument: every element is inserted once and removed at most once.

## Problem motivation

A radar station tracks $n$ targets along a straight coastline. The station produces a report every second, and each report must name the farthest target among the last $k$ seconds.

The constraints:

- $1 \le n \le 10^6$ readings.
- $1 \le k \le n$, with $k$ fixed for the whole run.
- Each reading is an integer between $0$ and $10^9$.

The naive answer computes the maximum of each window from scratch, which costs $O(nk)$. With $k = 500\,000$ and $n = 10^6$ that is $5 \cdot 10^{11}$ comparisons, which no contest will allow.

The obvious improvement, maintaining a running maximum and recomputing it when the maximum leaves the window, is not enough either. The moment the maximum leaves, the new maximum is unknown, and recomputing it costs $O(k)$ again, so the worst case is still quadratic.

The problem needs a data structure that answers "what is the largest value in the last $k$ positions" in constant time per position, without rescanning. That structure is a deque with one extra rule.

## Recognition patterns

The sliding window maximum is the right tool when all of the following hold.

- The question asks for an **extreme value** of every window of a **fixed size**.
- The windows **overlap heavily**: consecutive windows share $k-1$ elements.
- The extreme value is a **maximum or a minimum**, not a median, a sum, or a distinct count.
- The window slides by a **fixed stride**, usually one position.

The phrases that signal it are "for every window of size $k$", "the maximum of the last $k$ readings", "the largest of every $k$ consecutive elements". The phrases that rule it out are "the sum of every window" (a prefix sum answers that in $O(1)$ per window), "the median" (needs an order-statistic structure), and "the number of distinct values in every window" (needs a different technique, though the deque is still useful).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 10^4$ | The naive $O(nk)$ scan is acceptable; the deque is optional |
| $n \ge 10^6$ | The naive scan is fatal; the deque is required |
| $k$ fixed for the whole input | The deque applies as written |
| $k$ varies from window to window | The deque must be rebuilt or the answer must come from a different structure |
| Values are real numbers | The technique still works; only the comparison matters |
| The question is about the _sum_ | Use a prefix sum instead; a deque cannot maintain a sum under deletion cheaply |

The last row is the boundary that separates this article from its siblings. A deque removes elements from the front when they expire, and a sum cannot be recovered from a deque, while a maximum can, because the maximum of the surviving candidates is always at the front.

<Synonyms terms="sliding window maximum, monotonic deque, decreasing deque, window max, deque maximum" />

## Naive approach

The baseline rescans each window.

```python
def window_maximum(a, k):
    return [max(a[i:i + k]) for i in range(len(a) - k + 1)]
```

This is $O(nk)$ time and $O(k)$ space for the slices. It is correct for every input, and it is the reference implementation for the differential test: if the deque version disagrees with it on a random input, one of the two is wrong.

The second baseline is the priority queue, which is the general-purpose answer to "the extreme of the last $k$ items".

```python
import heapq

def window_maximum_heap(a, k):
    heap = []            # (-value, index), negated because heapq is a min-heap
    out = []
    for i, value in enumerate(a):
        heapq.heappush(heap, (-value, i))
        if heap[0][1] <= i - k:
            heapq.heappop(heap)
        if i >= k - 1:
            out.append(-heap[0][0])
    return out
```

This is $O(n \log n)$ time and $O(n)$ space, because expired entries stay in the heap until they reach the top. It is a perfectly good answer and it is the right one when the window size varies, or when the extreme is not a simple comparison. It is also $O(\log n)$ per position where the deque is $O(1)$ amortized, and the gap matters at $n = 10^6$.

## Key insight

The insight is that **one candidate dominates another**.

Suppose two elements of the array, at positions $j < i$, satisfy $a_j \le a_i$. Consider any window that contains both. That window's maximum is not $a_j$, because $a_i$ is at least as large. Now consider any window that contains $j$ but not $i$: such a window ends before $i$ arrives, so it has already been answered by the time $i$ is processed.

So $j$ can never be the maximum of a window that is answered at or after the moment $i$ arrives. The element $a_j$ is _dominated_, and it can be dropped.

That single observation is the deque. The deque holds the surviving candidates, with their indices increasing from front to back. When a new element $a_i$ arrives, every candidate at the back whose value is at most $a_i$ is dominated by $i$ and is removed. Because the candidates' values decrease from front to back, the dominated ones are exactly a suffix of the deque, so the removals are cheap.

The front of the deque is then the maximum of the current window, because every element not in the deque is dominated by a newer element that is at least as large, and the surviving candidates are in decreasing value order.

The second half of the insight is the expiration rule. A candidate at index $j$ leaves the window when the window's right end passes $j + k - 1$, that is, when the right end reaches $j + k$. At that moment the candidate at the front is removed, and the next candidate becomes the answer. Because the indices in the deque increase from front to back, the expired candidates are always a prefix of the deque, so the expiration removals are cheap too.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the array and let $k$ be the window size. For each $i \ge k$, the answer for the window that ends at $i$ is

$$
M_i = \max(a_{i-k+1}, a_{i-k+2}, \ldots, a_i).
$$

::: math definition Definition
An element at position $j$ is **dominated** at position $i$ if $j < i$ and $a_j \le a_i$. A dominated element cannot be the maximum of any window whose right end is $i$ or greater, because every such window that contains $j$ also contains $i$ and $a_i \ge a_j$.
:::

::: math definition Definition
The **candidate deque** for the window ending at $i$ is the sequence of indices $d_1 < d_2 < \cdots < d_t$ with $d_1 \ge i - k + 1$ and $a_{d_1} > a_{d_2} > \cdots > a_{d_t}$, obtained from the full candidate list by removing every dominated index.
:::

::: math lemma Lemma
Let $j < i$ and $a_j \le a_i$. Then $j$ is not the maximum of any window whose right end is $i$ or greater.
:::

::: math lemma Lemma
The candidate deque for the window ending at $i$ is exactly the list of indices in $[i-k+1, i]$ that are not dominated by any later index in the same interval, and the maximum of that window is the value at the front.
:::

The second lemma is the correctness of the structure. The front of the deque is the largest surviving candidate, and every removed candidate is dominated by a surviving one, so the front holds the maximum of the whole window.

::: math invariant Invariant
At the end of the iteration for position $i$, the deque holds exactly the undominated indices of the window $[i-k+1, i]$, in increasing index order, with their values strictly decreasing from front to back. Every index of the window that is absent from the deque is dominated by an index that is present.
:::

## Algorithm derivation

The state is the deque of candidate indices and the output list.

1. For each index $i$ from $1$ to $n$:
2. Remove the front of the deque while its index is at most $i - k$, because those candidates have left the window.
3. Remove the back of the deque while its value is at most $a_i$, because $i$ dominates those candidates.
4. Append $i$ to the back.
5. If $i \ge k$, append the value at the front of the deque to the output.

The update rule is correct by the two lemmas. Step 2 removes exactly the candidates that are outside the window, and because the indices increase from front to back those are a prefix. Step 3 removes exactly the candidates that $i$ dominates, and because the values decrease from front to back those are a suffix. After step 4 the invariant holds, and step 5 reads the maximum, which is at the front by the second lemma.

The order of steps 2 and 3 does not matter for correctness, because the two sets of removals are disjoint: an expired candidate is outside the window, and a dominated candidate is inside it. Doing step 2 first keeps the deque short.

## Step-by-step execution

Take $a = [3, 1, 4, 1, 5, 9, 2, 6]$ with $k = 3$. The answers should be $4, 4, 5, 9, 9, 9$.

- $i = 1$, value 3. Nothing expires. The back holds 3, and $3 \le 3$, so it is removed and 1 is appended. The deque is $[1]$. The window is not full yet.
- $i = 2$, value 1. Nothing expires, because $1 > 2 - 3$. The back holds 3, and $3 \le 1$ is false, so nothing is removed. Append 2. The deque is $[1, 2]$, with values $3, 1$.
- $i = 3$, value 4. Nothing expires. The back holds 1, and $1 \le 4$, so 2 is removed. The back now holds 3, and $3 \le 4$, so 1 is removed as well. Append 3. The deque is $[3]$, with value 4. The window is $[3, 4]$, so the first answer is 4.
- $i = 4$, value 1. The front index 3 is greater than $4 - 3 = 1$, so nothing expires. The back holds 4, and $4 \le 1$ is false. Append 4. The deque is $[3, 4]$. The window is $[1, 4, 1]$, so the answer is 4.
- $i = 5$, value 5. The front index 3 is greater than 2, so nothing expires. The back holds 1, and $1 \le 5$, so 4 is removed. The back holds 4, and $4 \le 5$, so 3 is removed. Append 5. The deque is $[5]$. The window is $[4, 1, 5], so the answer is 5.
- $i = 6$, value 9. The front index 5 is greater than 3, so nothing expires. The back holds 5, and $5 \le 9$, so 5 is removed. Append 6. The deque is $[6]$. The window is $[1, 5, 9]$, so the answer is 9.
- $i = 7$, value 2. The front index 6 is greater than 4, so nothing expires. The back holds 9, and $9 \le 2$ is false. Append 7. The deque is $[6, 7]$. The window is $[5, 9, 2], so the answer is 9.
- $i = 8$, value 6. The front index 6 is greater than 5, so nothing expires. The back holds 2, and $2 \le 6$, so 7 is removed. The back holds 9, and $9 \le 6$ is false. Append 8. The deque is $[6, 8]$. The window is $[9, 2, 6], so the answer is the value at the front, which is 9.

The answers are $4, 4, 5, 9, 9, 9$, which are the maxima of the six windows.

Notice that in this run the deque never held more than two indices. That is not an accident of the data: the deque holds at most $k$ indices, and it holds exactly the elements that are still running records.

## Correctness proof

::: math theorem Theorem
For every $i \ge k$, the algorithm outputs the maximum of the window $[i-k+1, i]$.
:::

::: math proof Proof
The invariant states that after the iteration for $i$, the deque holds exactly the undominated indices of the window $[i-k+1, i]$, in increasing index order, with values strictly decreasing from front to back, and that every index of the window absent from the deque is dominated by an index that is present.

The invariant holds for the empty deque before the first iteration, since there is no window yet.

Suppose the invariant holds after the iteration for $i - 1$, and consider the iteration for $i$.

Step 2 removes the indices at most $i - k$. Those indices are outside the new window $[i-k+1, i]$, so they must go, and since the indices increase from front to back they form a prefix of the deque.

Step 3 removes the indices at the back whose values are at most $a_i$. By the first lemma, each of them is dominated by $i$, so each must go. Since the values decrease from front to back, the dominated indices form a suffix.

After these two steps the deque holds the indices of $[i-k+1, i]$ that are not dominated by any later index in the window, together with any index that was already dominated but had not yet been removed. The removal in step 3 deletes exactly the newly dominated ones, because an index that was dominated by an earlier element was already removed when that element arrived.

Appending $i$ in step 4 restores the decreasing-value order, because every remaining value is greater than $a_i$ and $i$ is now the last index. The invariant is preserved.

By the second lemma, the front of the deque holds the maximum of the window, so step 5 outputs the correct value. $\square$
:::

## Complexity analysis

**Time: $O(n)$.** The bound is amortized. Every index is appended once, and every index is removed at most once, either from the front when it expires or from the back when it is dominated. There are $n$ appends and at most $n$ removals, so the total work is $O(n)$ even though a single iteration can remove many indices.

The naive $nk$ bound is not achieved, because the removals are charged to the elements that are removed. A useful way to say it: the cost of the whole run is the number of pushes plus the number of pops, and both are at most $n$.

**Auxiliary space: $O(k)$.** The deque never holds more than $k$ indices, because every index in it is inside the current window. The output list holds $n - k + 1$ values if every answer must be stored, which is $O(n)$ and is usually unavoidable.

::: math complexity Complexity
Sliding window maximum by a monotonic deque: $O(n)$ time, amortized over the whole scan, and $O(k)$ auxiliary space besides the output. The same idea with a priority queue: $O(n \log n)$ time and $O(n)$ space.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Maximum of every window of a fixed size | This technique |
| Minimum of every window of a fixed size | The same technique, with the comparisons reversed |
| Sum of every window of a fixed size | A prefix sum, in $O(1)$ per window |
| Maximum of every window of a variable size | A priority queue, or a segment tree for range maxima |
| Maximum of every subarray ending at each position | A monotonic stack, in [monotonic stack](/algorithms/arrays/monotonic-stack) |
| The extreme of the whole array | A single scan, $O(n)$ time and $O(1)$ space |
| The k-th smallest of every window | An order-statistic tree, $O(n \log k)$ |

The third row is the one that separates this technique from the sliding window of the [sliding window](/algorithms/searching/sliding-window) article. A sum cannot be maintained under deletions by a deque, so it is answered with a prefix sum instead.

## Recursion decision

This technique is a loop. It has no recursive formulation, and none is needed: the deque carries all the state, and the recursion would only add frames.

The recursion question belongs to the alternative implementations. A divide-and-conquer maximum, in the style of the classic maximum subarray problem, answers a different question and is not faster. A recursive implementation of a segment tree that answers range maxima is $O(\log n)$ per query with a stack depth of $O(\log n)$, which is safe in every language.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursive segment tree is fine; the depth is logarithmic |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | A recursive segment tree is fine |
| Python | Interpreter limit of 1000 | 1000 frames | A recursive segment tree is fine at depth $\log_2 n \approx 20$ |
| Pascal | The operating system stack | Depends on the platform | A recursive segment tree is fine |
| JavaScript | The V8 engine limit | About $10^4$ frames | A recursive segment tree is fine |

The rule of thumb for this article: never recurse over the _elements_. A recursion whose depth is the length of the window is a bug waiting for a large $k$, and it is unnecessary, because the deque version has no recursion at all.

## Implementation walkthrough

The three lines that carry the technique are the two removals and the read.

```cpp
while (!dq.empty() && dq.front() <= i - k) dq.pop_front();   // expired
while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();     // dominated
dq.push_back(i);
if (i >= k) answer[i - k] = a[dq.front()];
```

The expiration test uses `<= i - k` rather than `< i - k + 1`. An index $j$ is inside the window $[i-k+1, i]$ exactly when $j \ge i - k + 1$, so an index at most $i - k$ is outside it. Writing the test the other way, with `$j < i - k + 1$, is the same statement and the same trap: an off-by-one here leaves a stale element at the front and the answer is wrong from that point on.

The dominance test is `<=`, not `<`. A new element with a value equal to the back's value dominates it, because the new element lives at least as long. Keeping the older one would leave a stale candidate in the deque that only gets removed one step later, and, worse, would break the strict decrease that the front-read depends on.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Reading the answer from the back of the deque | The answer is the minimum, not the maximum | Read the front |
| Keeping the deque in increasing value order | The front is the smallest | Keep values decreasing from front to back |
| Using `<` instead of `<=` in the dominance test | Equal values linger and the order invariant breaks | Use `<=` |
| Expiring with the wrong comparison | A stale element survives and the answers are wrong after that point | An index at most $i - k$ is outside the window |
| Expiring only one element per step | Wrong when the window jumps by more than one | Use a `while` loop |
| Reporting an answer before the window is full | The first answers are meaningless | Report only when $i \ge k$ |
| Assuming the deque holds $k$ elements | It holds the running records, which can be far fewer | Size the storage by $k$, not by $n$ |

### Why this fails: the deque in the wrong order

The mistake that survives review is building the deque in the wrong direction. It is easy to do, because the code that removes dominated elements looks the same in both directions; only the comparison at the front changes.

The smallest counterexample has two elements. Take $a = [1, 2]$ with $k = 2$.

The correct answer is 2, the maximum of the only window.

Build the deque in increasing value order instead of decreasing: after the first element the deque is $[1]$; the second element 2 is greater than the back value 1, so it is appended and the deque is $[1, 2]$. Reading the front gives 1, and the reported answer is 1.

The failure is not a coincidence of the data. An increasing deque keeps the _minimum_ at the front, so every answer the algorithm reports is the minimum of the window, and the maximum is at the back. The code runs, produces a plausible list of $n - k + 1$ numbers, and every one of them is the wrong extreme.

The lesson generalizes: **the direction of the order is what determines which extreme the front holds**, and the two versions of the algorithm differ only in one comparison.

The second failure, in the other direction, is forgetting the expiration rule. If the dominated removals are done but the expired ones are not, the deque keeps elements that are outside the window, and the front reports the maximum of the whole prefix of the array rather than of the window. On $a = [5, 1, 6]$ with $k = 2$, the correct answers are 5 and 6, and a deque that never expires reports 5 for both.

## Variants and extensions

- **The minimum.** Reverse the two comparisons, and the deque holds increasing values with the minimum at the front. The proof is identical with the order reversed.
- **The maximum of every subarray ending at each position.** Drop the window entirely: the deque then answers, for each position, the largest value among all subarrays that end there. This is the monotonic stack's cousin, and it is in [monotonic stack](/algorithms/arrays/monotonic-stack).
- **Windows of a variable size.** When the right end advances but the left end jumps, the same deque works, provided the expiration is done with a `while` loop and the dominance test is unchanged.
- **The k-th largest of every window.** The dominance test becomes "at most $k-1$ elements of the window are larger", and the deque keeps a bounded number of candidates. The amortized argument still holds.
- **Two deques at once.** Running the maximum version and the minimum version side by side answers both extremes of every window in one pass.
- **The sum, the count, and the extreme.** A deque maintains the extreme; a prefix sum maintains the sum; a frequency map maintains the count. Mixing them is the sliding window of the [sliding window](/algorithms/searching/sliding-window) article.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the direction of the order before writing the code: decreasing values for a maximum, increasing for a minimum.
2. Write down the expiration comparison as an inequality on indices, not on values.
3. Decide whether the answer is read from the front or the back, and check that it matches the order.
4. Test three cases by hand: $k = 1$, $k = n$, and an array that is entirely increasing.
5. Use `<=` in the dominance test and say why in a comment.
6. Check the answer count: there must be exactly $n - k + 1$ of them.

## Worked problems

### Problem 1: the farthest target in each report

**Restatement.** Given $n$ readings and a window size $k$, output the maximum of every window of length $k$, in order. Constraints: $1 \le n \le 10^6$, $1 \le k \le n$.

**Naive baseline.** Rescanning every window, at $O(nk)$.

**Insight.** A newer and larger reading dominates an older one, and a dominated reading can never be the maximum of any later window.

**Derivation.** Run the deque algorithm, expiring the front while it is outside the window, removing dominated candidates from the back, and reading the front.

**Correctness.** The invariant shows that the front holds the maximum of the current window.

**Complexity.** $O(n)$ time amortized and $O(k)$ auxiliary space.

**Common wrong approach.** Keeping the deque in increasing order, which silently reports the minimum of every window.

### Problem 2: the maximum of every subarray ending at each position

**Restatement.** Given an array $a$, output for each $i$ the maximum of all subarrays that end at $i$. Constraints: $1 \le n \le 10^6$, values in $[0, 10^9]$.

**Naive baseline.** For each $i$, scan back to the start of the array, at $O(n^2)$.

**Insight.** The same dominance argument applies, but there is no window to expire: the candidates are the running records of the prefix seen so far.

**Derivation.** Maintain a deque of indices with strictly decreasing values. For each position $i$, remove the back while its value is at most $a_i$, append $i$, and report the value at the front.

**Correctness.** Every element removed from the back is dominated by a newer and larger element, so it can never be the maximum of a subarray ending at or after that moment. The front is therefore the largest of the prefix, which is the largest of any subarray ending there.

**Complexity.** $O(n)$ time and $O(n)$ space in the worst case, because the deque can hold every element when the array is decreasing.

**Common wrong approach.** Expiring candidates by a window size, which this problem does not have, and therefore dropping the running maximum of a decreasing prefix.

### Problem 3: the sliding maximum of a circular array

**Restatement.** Given a circular array of $n$ readings and a window size $k$, output the maximum of every one of the $n$ circular windows of length $k$. Constraints: $1 \le n \le 10^6$, $1 \le k \le n$.

**Naive baseline.** Scan the array twice to build the doubled array, then run the linear solution on it, which costs $O(2n)$ time and space.

**Insight.** The windows that wrap around are exactly the windows of the doubled array, so no new machinery is needed.

**Derivation.** Concatenate the array with itself, run the deque algorithm on the doubled array, and keep the last $n$ answers.

**Correctness.** The window ending at position $i + n - 1$ of the doubled array is the circular window that starts at position $i$, so the answers line up one for one.

**Complexity.** $O(n)$ time and $O(n)$ space for the doubled array, or $O(n)$ time and $O(k)$ space if the wrap-around is handled with a modular index instead of a copy.

**Common wrong approach.** Emitting all $2n - k + 1$ answers of the doubled array instead of the last $n$ of them, which shifts every answer by one position.

## Practice progression

1. **Recognition.** Given a statement, decide whether the deque applies. Look for an extreme value of every window, check that the window size is fixed, and check that the extreme is a maximum or a minimum rather than a sum or a median.
2. **Direct application.** Implement the maximum version and the minimum version, and verify both against a rescanning brute force on small random inputs.
3. **Adaptation.** Implement the version with no window, which reports the maximum of every subarray ending at each position, and the version that reports both the maximum and the minimum of every window.
4. **Combination.** Combine the deque with a frequency map so that one pass reports both the maximum and the number of distinct values in every window.
5. **Challenge.** Solve the k-th largest of every window, where the dominance test must keep up to $k$ candidates rather than one, and prove the amortized bound still holds.
6. **Transfer.** Recognize the dominance argument in a different shape: the nearest greater element, the largest rectangle in a histogram, and the sliding window maximum of a stream that arrives one value at a time.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does it mean for an element to be dominated, and why can it be discarded? (Formal model)
2. Why can a dominated element never be the maximum of a later window? (Key insight)
3. State the invariant of the deque, including the order of the values. (Formal model)
4. Why is the bound on the total time $O(n)$ rather than $O(nk)$? (Complexity analysis)
5. Which end of the deque is removed by the expiration rule and which by the dominance rule, and why? (Algorithm derivation)
6. What happens if the deque is built in increasing value order instead of decreasing? (Common mistakes)
7. Give the smallest array and window size for which the wrong order reports a wrong answer. (Common mistakes)
8. Why is the expiration test written as "at most $i - k$"? (Implementation walkthrough)
9. How many auxiliary space does the deque need, and why is it not $O(n)$? (Complexity analysis)
10. Why is a priority queue the wrong structure when the window size is fixed? (Naive approach)
11. When does the deque need to report the maximum of a _subarray_ rather than of a window? (Variants and extensions)
12. Which languages would break on a recursive version, and how deep would it go? (Recursion decision)

## Further reading

- The general structure, with the minimum and the comparison against the stack, is in [monotonic queue](/algorithms/arrays/monotonic-queue).
- The version that keeps a running stack of candidates instead of a queue is in [monotonic stack](/algorithms/arrays/monotonic-stack).
- The window that carries a frequency map rather than an extreme is in [sliding window](/algorithms/searching/sliding-window).
- The ordered structure that answers the same question with more machinery is in [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The running totals that answer the sum of every window in $O(1)$ are in [prefix sums](/algorithms/arrays/prefix-sums).
