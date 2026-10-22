---
id: searching.binary-search
title: Binary search
summary: Locate one element in a sorted array in logarithmic time by halving the search interval at every step.
division: [silver, gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords: [binary search, lower bound, upper bound, monotone predicate, sorted array]
prerequisites:
    required: [foundations.complexity, searching.two-pointers]
    recommended: [foundations.recursion]
complexity:
    time: "O(log n)"
    space: "O(1)"
assumptions:
    - The array is sorted in non-decreasing order.
    - The comparison against the target is monotone, so that the answer, if it exists, lies on one side of the midpoint.
implementations: searching.binary-search
visualization: searching.binary-search
reviewed: true
---

<AlgorithmSummary algorithm="searching.binary-search" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="searching.binary-search" />

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find a value in a sorted array, or the boundary at which a monotone predicate changes |
| **Time** | $O(\log n)$ |
| **Auxiliary space** | $O(1)$ iterative, $O(\log n)$ recursive |
| **Requires** | A sorted array, and a comparison that is monotone |
| **Fails when** | The array is not sorted, or the predicate changes truth value more than once |
| **Primary technique** | Halving, driven by a monotone predicate |
| **Implementations** | Six languages, in an iterative and a recursive form |

The rest of this article derives the technique, proves it, and shows the counterexample that breaks it.

## Problem motivation

You are given a sorted array of one million integers and a target value. Scanning the array takes a million comparisons. Halving the interval takes twenty.

That difference — a factor of fifty thousand — is the entire reason binary search is one of the first techniques every competitor learns. It is also the technique most often applied incorrectly, because the correctness of the halving step is a _precondition_ that the problem statement does not always state.

The specification calls for the _index_ of the target rather than its value, because the index is what lets you answer follow-up questions such as "how many elements are smaller than the target" without another pass.

## Recognition patterns

Binary search is the right tool when all of the following hold.

- The data is **sorted**, or can be sorted cheaply, and the question is about a **position** rather than about a sum.
- The question can be phrased as a **predicate** on a single element: "is `a[i] <= x`?"
- The predicate is **monotone**: it is false for a prefix and true for a suffix, or the other way round. It never flips back.

The third condition is the one that is usually missing. A predicate that is true for some elements, false for others, and true again is _not_ monotone, and halving will discard the answer.

<Synonyms terms="binary search, bisection, half-interval search, monotone search" />

## Naive approach

The baseline is a linear scan.

```cpp
int find(const std::vector<int>& a, int target) {
    for (int i = 0; i < static_cast<int>(a.size()); ++i) {
        if (a[i] == target) return i;
    }
    return -1;
}
```

This is `O(n)` and it is correct for _any_ array, sorted or not. It is the right answer when the data is not sorted, and it is the baseline you should always write first so that you have something to compare a faster solution against.

The linear scan is also the reference implementation for the differential test: if your binary search disagrees with the scan on a random input, one of the two is wrong.

## Key insight

In a sorted array, the midpoint partitions the answer space in half. If `a[mid]` is smaller than the target, then every element at or before `mid` is also smaller, so none of them can be the answer. The whole left half is discarded, and the search continues in `[mid + 1, hi]`.

That is the whole idea. Everything else — the choice of midpoint, the treatment of the boundary, the recursive form — is bookkeeping around this single observation.

The same argument works for any monotone predicate, not only for equality. Define

$$
P(i) = \begin{cases}
\text{true} & \text{if } a[i] \le x, \\
\text{false} & \text{otherwise.}
\end{cases}
$$

Because $P$ is monotone, the set $\{i : P(i) \text{ is true}\}$ is a suffix. The answer to "the first index where $P$ holds" is the boundary between the false prefix and the true suffix, and the boundary can be found by halving.

## Visual intuition

The laboratory below runs the algorithm on a real array. The gray cells have been discarded, the gold cell is the midpoint currently being compared, and the narration states the inequality that justifies each discard.

<AlgorithmPlayer algorithm="searching.binary-search" />

## Formal model

Let $A$ be a finite sequence of $n$ elements, sorted so that $A[i] \le A[j]$ whenever $i \le j$. Let $x$ be the target.

<MathPanel type="definition" title="Definition">
A predicate $P$ on the indices $\{0, \ldots, n-1\}$ is **monotone** if there is an index
$k$ such that $P(i)$ is false for every $i < k$ and true for every $i \ge k$. The value
$k$ is the *boundary* of the predicate.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **lower bound** of $x$ in $A$ is the smallest index $i$ such that $A[i] \ge x$, or
$n$ when no such index exists. The **upper bound** is the smallest index $i$ such that
$A[i] > x$.
</MathPanel>

The lower bound and the upper bound are two instances of the same boundary search with two different monotone predicates: $A[i] \ge x$ and $A[i] > x$.

<MathPanel type="lemma" title="Lemma">
If $A$ is sorted and $P$ is the predicate $A[i] \le x$, then the lower bound of $x$ is
the smallest index at which $P$ is false. Equivalently, the lower bound is one more than
the largest index at which $P$ is true.
</MathPanel>

## Algorithm derivation

The search maintains an inclusive interval $[lo, hi]$ of the indices that could still hold the answer, together with the invariant

$$
\text{the answer, if it exists, lies in } [lo, hi].
$$

The interval starts as $[0, n-1]$. At every step:

1. Compute $mid = lo + \lfloor (hi - lo)/2 \rfloor$.
2. If $A[mid] = x$, the answer is $mid$ and the search stops.
3. If $A[mid] < x$, the answer cannot be at or before $mid$, so $lo \gets mid + 1$.
4. Otherwise $A[mid] > x$, the answer cannot be at or after $mid$, so $hi \gets mid - 1$.

The loop stops when $lo > hi$, which means the interval is empty and the answer does not exist.

<MathPanel type="invariant" title="Invariant">
At the start of every iteration, the answer to the search lies in $[lo, hi]$. The
interval is halved at every step, so its length is at most $\lfloor n/2 \rfloor$ after
the first iteration and at most $1$ after $\lceil \log_2 n \rceil$ iterations.
</MathPanel>

### Why the midpoint is computed that way

`lo + (hi - lo) / 2` and `(lo + hi) / 2` agree when the indices are small. They differ when `lo + hi` overflows, which happens when the array is large enough that the sum of two indices exceeds the range of a 32-bit signed integer. Computing the difference first cannot overflow, because `hi - lo` is at most the length of the array.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The iterative search returns the index of the target when it is present, and $-1$
otherwise.
</MathPanel>

<MathPanel type="proof" title="Proof">
The invariant that the answer lies in $[lo, hi]$ holds initially, because the answer is
an index of the array and $[0, n-1]$ contains every index.

Suppose the invariant holds at the start of an iteration.

- If $A[mid] = x$, then $mid$ is an index of the target, and it is returned.
- If $A[mid] < x$, then by the sortedness of $A$, every index $i \le mid$ satisfies $A[i] \le A[mid] < x$, so no such index holds the target. The answer therefore lies in $[mid+1, hi]$, which is the new interval.
- If $A[mid] > x$, then every index $i \ge mid$ satisfies $A[i] \ge A[mid] > x$, so no such index holds the target. The answer therefore lies in $[lo, mid-1]$, which is the new interval.

In every case the invariant is preserved. The interval strictly shrinks, so the loop terminates. It terminates either by returning a correct index, or by reaching $lo > hi$, in which case the invariant says the answer lies in an empty interval, so the answer does not exist and $-1$ is correct. $\square$
</MathPanel>

## Complexity analysis

The interval length is at most halved at every iteration, so the number of iterations is $\lceil \log_2 n \rceil$. Each iteration does a constant amount of work.

- **Time:** $O(\log n)$.
- **Auxiliary space:** $O(1)$ for the iterative form, $O(\log n)$ for the recursive form, because the recursion depth is the number of iterations.

The input must already be sorted. If it is not, sorting it first costs $O(n \log n)$, which is more than the $O(n)$ a linear scan would have cost. That is why binary search is the wrong tool for unsorted data.

## Algorithm selection

| Situation                                 | What to use                              |
| ----------------------------------------- | ---------------------------------------- |
| Sorted array, one exact value             | Binary search                            |
| Sorted array, first position at least $x$ | Binary search for the lower bound        |
| Sorted array, count of elements below $x$ | Binary search for the lower bound        |
| Rotated sorted array                      | Binary search with a modified comparison |
| Unsorted array, one value                 | Linear scan                              |
| Unsorted array, many queries              | Sort once, then binary search            |

The last row is worth remembering: sorting once and then answering $q$ queries with binary search costs $O(n \log n + q \log n)$, which beats $O(qn)$ as soon as $q$ is large.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source.

## Recursion decision

The recursive form is included for teaching, not because it is the better choice.

<MathPanel type="counterexample" title="Counterexample">
A sorted array of $2^{20}$ elements searched with the recursive form needs about
$20$ stack frames, which every language handles. But a search that recurses once per
*element* — as the recursive binary search on an unbalanced variant, or a binary search
whose midpoint is computed incorrectly, does — will overflow the stack in C++ and Java
and crash the process. The iterative form cannot overflow, because it uses a loop.
</MathPanel>

In Python the recursion limit is a counter rather than a guard, and raising it does not make deep recursion safe: the interpreter still has to allocate the frames, and the operating system still has to grow the stack. The iterative form is the right answer in every language.

## Implementation walkthrough

The two lines that matter are the comparison and the update.

```cpp
if (a[mid] < target) {
    lo = mid + 1;   // the answer is strictly after mid
} else {
    hi = mid - 1;   // the answer is strictly before mid
}
```

The `+ 1` and the `- 1` are not interchangeable with `lo = mid` and `hi = mid`. Setting `lo = mid` instead of `lo = mid + 1` is the classic infinite loop: when $lo = hi = mid$ and $a[mid] < target$, the interval does not shrink.

The midpoint is computed as `lo + (hi - lo) / 2` rather than `(lo + hi) / 2` for the overflow reason given above.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Writing `lo = mid` instead of `lo = mid + 1` | The loop never terminates when the target is at the end | Keep the interval half-open, or use the inclusive form consistently |
| Forgetting the array must be sorted | The answer is silently wrong | Check the assumption in the problem statement |
| Assuming a non-monotone predicate | The answer is silently wrong | Write down the predicate and check that it is monotone |
| Using `(lo + hi) / 2` | Integer overflow on a large array | Compute the difference first |
| Returning the value instead of the index | Wrong when the value repeats | Decide which the problem asks for before you start |
| Off-by-one in the boundary variant | An off-by-one answer | Write down whether the interval is inclusive and keep that choice visible in the code |

### Why this fails: a non-monotone predicate

Suppose the array is sorted by a different key than the one you are searching by, or the predicate is "the element is prime". The halving step then discards the answer.

Consider the sorted array $[2, 3, 4, 5, 6]$ and the predicate "the element is even". The predicate is true at indices $0, 2, 4$ and false at $1, 3$, so it is not monotone. Searching for the first even element with the halving algorithm: $mid = 2$, the predicate holds, so the algorithm concludes "the answer is at or before $2$" and moves to $[0, 1]$. Then $mid = 0$, the predicate holds, and the algorithm moves to $[0, -1]$ — and returns the answer $0$, which happens to be right. Change the array to $[3, 4, 5, 6, 7]$ with the predicate "the element is even": $mid = 2$ gives $5$, the predicate fails, so the algorithm moves to $[3, 4]$. $mid = 3$ gives $6$, the predicate holds, so it moves to $[3, 2]$ and returns $3$ — the index of $6$. That is also right, by luck.

The failure appears when the boundary falls inside a run. The array $[1, 3, 4, 5, 7]$ with the predicate "the element is even" is the useful counterexample: $mid = 2$ gives $4$, the predicate holds, so the search moves to $[0, 1]$; $mid = 0$ gives $1$, the predicate fails, so the search moves to $[1, 1]$; $mid = 1$ gives $3$, the predicate fails, and the search returns nothing — even though $4$ at index $2$ satisfies the predicate and was discarded at the very first step. The answer is not merely wrong; the algorithm returns "not found" for a value that is present.

The lesson generalizes: **halving is only valid when the discarded half provably contains no answer.** That is a property of the predicate, not of the data.

## Variants and extensions

- **Lower bound** and **upper bound.** Replace the equality test with $A[mid] \ge x$ and $A[mid] > x$ respectively. The answer to "how many elements are at most $x$" is the lower bound of $x+1$.
- **Binary search on the answer.** When the question is "what is the smallest $k$ such that a monotone condition holds?", search over $k$ rather than over the data. The condition must be monotone in $k$, which is usually the part that is hard to see.
- **Rotated sorted array.** The comparison must first determine which half is sorted, because only the sorted half can be halved safely.
- **Floating point.** Use a fixed number of iterations rather than a condition on the interval, because the interval may not shrink when the values are very close.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and they are all avoidable with a fixed procedure.

1. Write down the interval convention: is it inclusive or half-open? Write it in the code as a comment.
2. Write the predicate down before writing the loop, and check that it is monotone.
3. Decide whether the answer is the index, the lower bound, or the count, and name the variable accordingly.
4. Test the three cases explicitly: the target is at the first position, at the last position, and absent.
5. If the problem allows a linear scan, write the linear scan first and keep it as the reference. A disagreement between the two is a counterexample you can debug.

## Worked problems

### Problem 1: the first index at least $x$

Given a sorted array and a value $x$, find the smallest index $i$ with $A[i] \ge x$, or $n$ if there is none.

**Observation.** The predicate $A[i] \ge x$ is monotone: once it holds, it holds for every larger index.

**Algorithm.** Binary search for the boundary. The subtlety is the half-open convention, which removes the off-by-one entirely:

```text
lo = 0, hi = n
while lo < hi:
    mid = (lo + hi) / 2
    if A[mid] < x: lo = mid + 1
    else:          hi = mid
return lo
```

**Why it is correct.** The invariant is that the answer lies in $[lo, hi]$. When $A[mid] < x$, no index at or before $mid$ qualifies, so $lo \gets mid+1$. Otherwise $mid$ itself qualifies, so the answer is at or before $mid$, and $hi \gets mid$. The loop ends with $lo = hi$, which is the answer.

**Complexity.** $O(\log n)$ time, $O(1)$ space.

### Problem 2: counting the elements below a threshold

Given a sorted array and a value $x$, count the elements that are strictly less than $x$.

**Observation.** The count is exactly the index of the first element that is at least $x$, which is the lower bound of $x$.

**Algorithm.** Run the lower-bound search and return the index. There is no need for a separate counting step, and no need to handle $x$ being smaller than every element: the lower bound is $0$ in that case.

**Complexity.** $O(\log n)$ time, $O(1)$ space.

### Problem 3: peak index in a mountain

Given an array that strictly increases and then strictly decreases, find the index of the largest element.

**Observation.** The predicate "the element is on the increasing side" is monotone within each half, but not over the whole array. This is the point of the problem: the naive halving is not valid, and a different halving is.

**Algorithm.** Compare $A[mid]$ with $A[mid+1]$. If $A[mid] < A[mid+1]$, the peak is at or after $mid$, so move the left bound to $mid$. Otherwise the peak is at or before $mid$, so move the right bound to $mid$.

**Why it works.** The comparison $A[mid] < A[mid+1]$ is true exactly on the increasing side, so the peak is never discarded. Each step halves the interval that still contains the peak.

**Complexity.** $O(\log n)$ time.

## Practice progression

1. **Recognition.** Given a problem statement, decide whether binary search applies. Write the predicate and check that it is monotone.
2. **Direct application.** Implement the lower bound and the upper bound on a sorted array.
3. **Adaptation.** Implement the search on a rotated sorted array, and on a sorted array of pairs where the comparison is on the second element.
4. **Combination.** Combine a binary search with a prefix-sum array to answer "how many pairs sum to $k$" in $O(n \log n)$ rather than $O(n^2)$.
5. **Challenge.** Solve a problem where the array is not sorted but a monotone predicate still exists over the _index_, such as "the first position at which the running maximum exceeds $k$".
6. **Transfer.** Use binary search on the answer rather than on the data: find the smallest number of rounds in which a simulation reaches a target.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What two conditions must hold for halving to be valid? (Recognition patterns)
2. Why does the interval halve at every step, and what is the resulting number of iterations? (Algorithm derivation)
3. State the invariant of the loop and show that it is preserved. (Correctness proof)
4. Why is `lo + (hi - lo) / 2` preferred over `(lo + hi) / 2`? (Implementation walkthrough)
5. Give a sorted array and a non-monotone predicate for which the halving returns the wrong answer. (Common mistakes)
6. When is sorting the array before searching a bad idea? (Complexity analysis)
7. What is the difference between the lower bound and the upper bound of a value, and which questions do they answer? (Variants and extensions)
8. In which languages would the recursive form be dangerous, and why? (Recursion decision)

## Further reading

- The "binary search on the answer" pattern, in the [interval scheduling](/algorithms/greedy/interval-scheduling) article's neighbor pages, is the single most useful extension in contests.
- The two-pointer and sliding-window techniques in [two pointers](/algorithms/searching/two-pointers) solve many of the same problems in linear time, and are often the better answer.
