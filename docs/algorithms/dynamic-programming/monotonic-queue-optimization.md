---
id: dynamic-programming.monotonic-queue-optimization
title: Monotonic queue optimization
summary: Replace a minimum over the last k states of a dynamic program with a monotonic deque, turning an O(nk) transition into O(n).
division: [gold]
subjects: [dynamic-programming]
level: intermediate
importance: common-contest-technique
keywords:
    [
        monotonic queue optimization,
        sliding window minimum,
        deque,
        dynamic programming,
        transition optimization,
    ]
prerequisites:
    required: [foundations.complexity, arrays.monotonic-queue]
    recommended: [dynamic-programming.0-1-knapsack]
complexity:
    time: "O(n)"
    space: "O(n)"
assumptions:
    - The transition takes the minimum or maximum over a contiguous window of earlier states.
    - The window's lower bound never decreases, so candidates expire in the order they were added.
implementations: dynamic-programming.monotonic-queue-optimization
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/dynamic-programming.monotonic-queue-optimization.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

A dynamic program becomes quadratic when every state scans a range of earlier states. When that range is a window of the last $k$ positions, the scan is asking for a sliding window minimum, and a monotonic deque answers it in constant amortized time. The transition disappears, and the whole program runs in linear time.

The canonical recurrence is

$$
\text{dp}[i] \;=\; a[i] \;+\; \min_{j \in [\max(0,\,i-k),\,i-1]} \text{dp}[j],
\qquad \text{dp}[0] = 0.
$$

It describes a route that starts at position $0$, ends at position $n$, and makes hops of at most $k$ positions, where entering position $i$ costs $a[i]$. The state is the cheapest way to arrive at each position, and the transition chooses the cheapest legal predecessor.

The deque holds the indices of the candidates that are still alive, with their $\text{dp}$ values strictly increasing from front to back. The front is the minimum of the current window. Moving from $i-1$ to $i$ does three things: it expels the index that fell out of the window, it reads the front to compute $\text{dp}[i]$, and it removes from the back every candidate that the new index dominates.

That is the whole technique. It costs $O(n)$ time and $O(n)$ space for the $\text{dp}$ table, with a 64-bit accumulator because the answer can be far larger than a 32-bit integer.

## Problem motivation

A courier must travel along a line of $n$ checkpoints, numbered $1$ through $n$. Entering checkpoint $i$ costs $a[i]$ units, and $a[i]$ may be negative when the checkpoint pays a rebate. The courier starts at checkpoint $0$ with no cost, and a single hop may advance by at least one and at most $k$ checkpoints. The goal is to reach checkpoint $n$ with the smallest total entry cost.

The constraints are what make the problem interesting:

- $1 \le n \le 10^6$ checkpoints.
- $1 \le k \le n$, fixed for the whole trip.
- $|a[i]| \le 10^9$, so the answer lies between $-10^{15}$ and $10^{15}$ and needs a signed 64-bit integer.
- Every hop must advance, so the route has at most $n$ stops.

Let $\text{dp}[i]$ be the cheapest cost of reaching checkpoint $i$. The last hop arrives from some checkpoint $j$ with $i-k \le j \le i-1$, and the cost of that hop is $\text{dp}[j] + a[i]$. Therefore

$$
\text{dp}[i] \;=\; a[i] \;+\; \min_{\max(0,\,i-k) \le j \le i-1} \text{dp}[j].
$$

The lower bound is $\max(0, i-k)$ rather than $i-k$ because the route starts at $0$ and there is no checkpoint with a negative index. The upper bound is $i-1$ rather than $i$ because a hop must advance.

The direct evaluation scans $k$ entries per state. At $n = 10^6$ and $k = 5 \cdot 10^5$ that is about $5 \cdot 10^{11}$ operations, which is far beyond a contest time limit. The recurrence itself is not the problem; the repeated scan is.

A greedy rule does not repair it. Choosing the cheapest checkpoint that is currently reachable ignores the fact that the choice determines which checkpoints are reachable next, and a cheap checkpoint can be followed by an expensive gap. The minimum has to be taken over a window of complete state values, which is exactly what the deque provides.

## Recognition patterns

The monotonic queue optimization is the right tool when all of the following hold.

- The state is one-dimensional, or the transition is applied independently to every layer of a multidimensional table.
- The transition takes the **minimum or the maximum** of $\text{dp}[j]$ over a contiguous range of earlier indices.
- The range is a **window that slides right by one position**: here the window is $[i-k, i-1]$, and its lower bound never decreases.
- The contribution of $j$ does not depend on $i$. If the transition were $\text{dp}[j] + m_j x_i$, the candidates would be lines rather than numbers, and the deque would be the wrong structure.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| $n \le 5000$ and $k \le n$ | The quadratic transition may already be fast enough |
| $n \le 10^6$ and $k$ can be large | The deque is the intended solution |
| The range is a prefix $[0, i-1]$ | A running minimum is simpler than a deque |
| The range is the whole table, not a window | A single variable, not a deque |
| The range's left end can move backward | A segment tree or a multiset, because a deque cannot un-expire an index |
| The transition adds a term that depends on both $i$ and $j$ | The [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) or a Li Chao tree, depending on the term |
| The range is a window but the values change after insertion | A segment tree with point updates |
| The question asks for both the minimum and the maximum | Two deques, one increasing and one decreasing |

Two phrases in a statement are strong signals. "You may advance at most $k$ positions" or "the previous choice must be within $k$ indices" produces a window over the state index. "For every window of $k$ consecutive elements" produces the same window over an array, which is the [monotonic queue](/algorithms/arrays/monotonic-queue) itself; the optimization is what happens when the array being windowed is the $\text{dp}$ table.

<Synonyms terms="sliding window optimization, monotone deque DP, deque optimization, sliding window minimum DP" />

## Naive approach

The baseline is the recurrence written as two nested loops.

```python
def min_cost(a, k):
    n = len(a)
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        best = min(dp[max(0, i - k):i])
        dp[i] = a[i - 1] + best
    return dp[n]
```

The outer loop has $n$ iterations and the inner `min` visits at most $k$ entries, so the cost is $O(nk)$ and the space is $O(n)$.

This version is correct for every input, and it is the reference that the optimized program has to reproduce. It is worth writing first even when the deque is already understood: a disagreement between the two is a counterexample, and a counterexample is worth more than a long review.

The quadratic cost is easy to underestimate because $k$ is often small. At the top of the stated range it is not small. A single scan of $5 \cdot 10^5$ entries per state, repeated $10^6$ times, is the difference between a solution and a timeout.

There is also a recursive version with memoization, which is useful for thinking about the state but not for shipping. It is covered in the recursion decision below.

## Key insight

The insight is that the inner loop does not depend on the values of $a$. It only asks for the minimum of the last $k$ entries of $\text{dp}$, and that question is answered by the window that slides one position per step.

Two kinds of candidates can be discarded permanently.

**Expiry.** The window for state $i$ is $[i-k, i-1]$. An index $j$ with $j < i-k$ is too old for state $i$, and it will be too old for every later state as well. The indices expire in increasing order, so the oldest candidate is always at the front of a queue.

**Dominance.** Suppose $j < j'$ and $\text{dp}[j] \ge \text{dp}[j']$. For any future state $i$ that can use both of them, $j'$ is at least as cheap as $j$. Moreover, $j'$ stays inside the window at least as long as $j$, because it is later and expires later. So $j$ can never be the unique best choice again, and it can be removed now.

The candidates that survive both rules, kept in increasing order of index, have strictly increasing $\text{dp}$ values. The oldest survivor is at the front, and it is also the cheapest. The structure is a deque with a monotone interior, which is precisely the monotonic queue of the [monotonic queue](/algorithms/arrays/monotonic-queue) article, applied to the values of $\text{dp}$ instead of to the values of an array.

The two rules are what make the optimization correct. Expiry alone gives a queue that holds every index in the window, so the minimum still requires a scan. Dominance alone gives a monotone queue that discards some candidates, but the front may be stale. Together they keep exactly the candidates that can still win, and the front is the winner.

## Visual intuition

Draw the window as a horizontal interval over the indices $0, 1, \ldots, n$. The interval has length $k$ and slides to the right. The deque is a second, smaller interval inside it, holding only the indices that have not been dominated.

Read the deque from front to back. The indices increase, and the $\text{dp}$ values increase as well. The front is the oldest and cheapest candidate; the back is the newest and most expensive survivor. The entries between them form a staircase: each step is a later index with a strictly larger value.

When the window advances, three pictures change.

1. The left edge of the window moves past one index. If that index is at the front of the deque, it falls off. No other index can fall off, because the deque's indices are in increasing order.
2. The new index $i$ arrives at the right. It is about to become a candidate for later states, but it is not a candidate for itself.
3. Every survivor at the back whose value is at least $\text{dp}[i]$ is erased. Those indices are older than $i$ and no cheaper, so the staircase can only end at $i$.

The result is a deque that is shorter than the window in the interesting cases and never longer than $k + 1$ entries. On a strictly increasing array of $\text{dp}$ values, nothing is ever dominated, and the deque holds the whole window; on a decreasing array, each new value erases everything, and the deque holds one entry.

The step-by-step execution below draws the same staircase one state at a time.

## Formal model

Let $n$ be the number of checkpoints, $k$ the maximum hop length, and $a[1], \ldots, a[n]$ the entry costs.

::: math definition Definition
Let $W_0$ be empty, and for $i \ge 1$ let the **window** of state $i$ be $W_i = \{j \in \mathbb{Z} : \max(0, i-k) \le j \le i-1\}$. A **route** to $i$ is a sequence $0 = j_0 < j_1 < \cdots < j_m = i$ with $j_{r+1} - j_r \le k$ for every step. Its cost is $\sum_{r=1}^{m} a[j_r]$.
:::

::: math definition Definition
Let $\text{dp}[0] = 0$, and for $1 \le i \le n$ let $\text{dp}[i]$ be the minimum cost of a route to $i$. Equivalently,

$$
\text{dp}[i] \;=\; a[i] \;+\; \min_{j \in W_i} \text{dp}[j].
$$
:::

::: math definition Definition
An index $j$ is **dominated** by a later index $j'$ if $j < j'$ and $\text{dp}[j] \ge \text{dp}[j']$. A dominated index cannot be the strict minimum of any window that contains both.
:::

::: math lemma Lemma
If $j$ is dominated by $j'$, then for every state $i > j'$ with $j \in W_i$, the index $j'$ is also in $W_i$, and $\text{dp}[j'] \le \text{dp}[j]$. Since $j' > j$, it also stays in the window for at least as many future states as $j$.
:::

::: math lemma Lemma
After the deque has been updated for state $i$, its indices are strictly increasing, its $\text{dp}$ values are strictly increasing, and every index it holds is in $W_i \cup \{i\}$.
:::

The second lemma is the invariant that the implementation maintains. The correctness proof below shows that the front of the deque after expiry is the minimum of $W_i$.

## Algorithm derivation

The state is the array $\text{dp}[0 \ldots n]$ and a deque $D$ of indices. The deque is stored as an array with a head and a tail pointer, so a push at the back and a pop at either end are constant-time operations.

Initialization: $\text{dp}[0] = 0$, $D = [0]$.

For each $i$ from $1$ to $n$:

1. **Expire the front.** While $D$ is not empty and $D_{\text{front}} < i-k$, remove the front. The remaining indices are exactly those at least $i-k$, and because the previous step used the previous lower bound, this loop removes at most one index.
2. **Read the minimum.** Set $\text{dp}[i] = a[i] + \text{dp}[D_{\text{front}}]$. The front is in $W_i$ by step 1, and the invariant says it is the cheapest surviving candidate.
3. **Remove dominated candidates.** While $D$ is not empty and $\text{dp}[D_{\text{back}}] \ge \text{dp}[i]$, remove the back. Every removed index is older than $i$ and no cheaper, so it is dominated by $i$.
4. **Push the new index.** Append $i$ at the back.

After the loop, print $\text{dp}[n]$.

The order of the four steps is not cosmetic. Step 1 must precede step 2, because an expired index may still be at the front. Step 2 must precede step 4, because $i$ is not in its own window; pushing first would allow a self-transition. Step 3 must precede step 4 as written, because after the push the back is $i$ itself, and the comparison would remove it.

::: math invariant Invariant
Before step 1 of iteration $i$, the deque holds a subset of $W_{i-1} \cup \{i-1\}$ with strictly increasing indices and strictly increasing $\text{dp}$ values. It contains every index of $W_{i-1}$ that is not dominated by an index in $W_{i-1} \cup \{i-1\}$. After step 1 it holds a subset of $W_i$, and after step 4 the same statement holds with $i$ in place of $i-1$.
:::

The invariant is preserved by each step, and the correctness proof spells out why. The two boundary cases are worth naming here.

- **$k = 1$.** The window of state $i$ is the single index $i-1$. Every front is expired as soon as the next state is considered, so the deque holds at most two entries, and the recurrence is just a prefix sum.
- **$k \ge n$.** The lower bound is $0$ for every state, so nothing ever expires. The deque still removes dominated candidates, and the front is the minimum of the entire prefix. The route may jump from $0$ to any checkpoint.

A value of $k$ below $1$ makes the window empty. The programs clamp it to $1$, which is the smallest legal hop length.

## Step-by-step execution

Take $n = 5$, $k = 2$, and $a = [3, 1, 4, 1, 5]$. The window of state $i$ is $[\max(0, i-2), i-1]$.

| $i$ | $a[i]$ | Expired | Front index and $\text{dp}$ | $\text{dp}[i]$ | Deque after | Deque values |
| --- | --- | --- | --- | --- | --- | --- |
| 0 |  |  |  | 0 | $[0]$ | $[0]$ |
| 1 | 3 | none | $0$, $0$ | 3 | $[0, 1]$ | $[0, 3]$ |
| 2 | 1 | none | $0$, $0$ | 1 | $[0, 2]$ | $[0, 1]$ |
| 3 | 4 | $0$ | $2$, $1$ | 5 | $[2, 3]$ | $[1, 5]$ |
| 4 | 1 | none | $2$, $1$ | 2 | $[2, 4]$ | $[1, 2]$ |
| 5 | 5 | $2$ | $4$, $2$ | 7 | $[4, 5]$ | $[2, 7]$ |

Read the rows in order.

**$i = 1$.** The window is $[0, 0]$, so the only predecessor is $0$. $\text{dp}[1] = 3 + 0 = 3$. The back holds $0 < 3$, so nothing is removed, and index $1$ is pushed.

**$i = 2$.** The window is $[0, 1]$. The front is still $0$, with value $0$. $\text{dp}[2] = 1 + 0 = 1$. The back is index $1$ with value $3$, and $3 \ge 1$, so it is removed as dominated by $i = 2$. Pushing $2$ gives the deque $[0, 2]$, with values $0, 1$.

**$i = 3$.** The window is $[1, 2]$. Index $0$ is now too old, so it is removed from the front. The new front is $2$ with value $1$. $\text{dp}[3] = 4 + 1 = 5$. The back has value $1 < 5$, so nothing is removed. The deque is $[2, 3]$.

**$i = 4$.** The window is $[2, 3]$. Nothing expires. The front is $2$ with value $1$. $\text{dp}[4] = 1 + 1 = 2$. The back is $3$ with value $5 \ge 2$, so it is removed, and $4$ is pushed. The deque is $[2, 4]$, with values $1, 2$.

**$i = 5$.** The window is $[3, 4]$. Index $2$ is too old, so it is removed. The front is $4$ with value $2$. $\text{dp}[5] = 5 + 2 = 7$. The back has value $2 < 7$, so nothing is removed. The deque is $[4, 5]$.

The answer is $\text{dp}[5] = 7$. The route that attains it is $0 \to 2 \to 4 \to 5$, with costs $1 + 1 + 5 = 7$ and hops $2, 2, 1$, all within the limit.

Notice what the deque discarded. At $i = 2$, index $1$ had value $3$, and the new index $2$ had value $1$. Any future window that could use $1$ could also use $2$, and $2$ is cheaper and younger, so $1$ was never needed again. At $i = 5$, index $2$ was still the cheapest entry in the table, but it was outside the window; keeping it would have produced a route with a hop of length $3$.

## Correctness proof

::: math theorem Theorem
For every $i$ from $0$ to $n$, the algorithm assigns $\text{dp}[i]$ equal to the minimum cost of a route from $0$ to $i$ with hops of at most $k$.
:::

::: math proof Proof
The proof is by induction on $i$. The base case is $\text{dp}[0] = 0$: the empty route reaches $0$ at no cost, and it is the only route to $0$.

Assume the claim for every index below $i$. Every route to $i$ has a last hop from some $j \in W_i$, and its cost is the cost of a route to $j$ plus $a[i]$. By the induction hypothesis, the cheapest route whose last hop is $j$ costs $\text{dp}[j] + a[i]$. Therefore the minimum over $j \in W_i$ of $\text{dp}[j] + a[i]$ is the minimum cost of a route to $i$, which is the recurrence. It remains to show that the algorithm evaluates the minimum correctly.
:::

::: math proof Proof
The deque invariant. At the start, $D = [0]$, which is the only index of $W_1 \cup \{0\}$ and is trivially increasing.

Suppose the invariant holds before iteration $i$. Every entry of the deque is in $W_{i-1} \cup \{i-1\}$, whose smallest possible index is $\max(0, i-k-1)$, so the only entry that can be below $i-k$ is $i-k-1$. Step 1 removes exactly the indices in $W_{i-1}$ but not in $W_i$. The remaining indices are in $W_i$ and keep their order.

Step 2 reads the front. Since the deque's values increase from front to back, the front is the smallest value in the deque. Every index of $W_i$ that is not in the deque is dominated by some index that was in the deque when it was removed. That dominator cannot have expired while the dominated index is still in the window, because the dominator is younger; so it is still in the deque or was itself dominated by an even later, cheaper index. Following the chain of dominators ends at an entry of the deque, with a value no larger than the original. So the minimum of $W_i$ is attained inside the deque, and the front, being its smallest entry, attains it. Thus $\text{dp}[i] = a[i] + \min_{j \in W_i} \text{dp}[j]$.

Step 3 removes an index $j$ only when $j < i$ and $\text{dp}[j] \ge \text{dp}[i]$. For any future window that contains $j$, it also contains $i$ (because $i > j$ and the window's upper end is the state before the query), and $i$ is no more expensive. So $j$ is dominated and can be removed without changing any future minimum. Step 4 appends $i$, which is in $W_{i'} \cup \{i'\}$ for every later state $i'$ until it expires, and the values remain strictly increasing because every back entry with a value at least $\text{dp}[i]$ was removed.

The invariant therefore holds after iteration $i$, and by induction it holds for every state. Combined with the recurrence, the algorithm computes the minimum route cost for every $i$; in particular, it prints the minimum cost of reaching $n$. $\square$
:::

::: math proof Proof
The dominance lemma. Suppose $j < j'$ and $\text{dp}[j] \ge \text{dp}[j']$. For any state $i > j'$ with $j \in W_i$, the bounds give $i-k \le j < j' \le i-1$, so $j' \in W_i$. The value $\text{dp}[j']$ is no larger than $\text{dp}[j]$, so $j$ cannot be the unique minimizer of $W_i$. Since this holds for every later state that can use $j$, removing $j$ never changes the minimum of a window that could still use it. $\square$
:::

## Complexity analysis

**Time: $O(n)$.** Each index is pushed exactly once. It is removed from the back at most once, when a later and no more expensive candidate arrives, and from the front at most once, when it falls out of the window. The total number of deque operations is therefore at most $3n$, and each iteration does a constant amount of arithmetic. The $O(nk)$ scan is gone.

**Auxiliary space: $O(n)$.** The $\text{dp}$ table has $n + 1$ entries, and the deque has room for at most $k + 1$ indices. The input array can be streamed, so it need not be stored separately; the reference implementations read one value per iteration.

**The accumulator is 64 bits.** With $n = 10^6$ and $|a[i]| = 10^9$, the answer can reach $10^{15}$. A signed 64-bit integer holds it comfortably; a signed 32-bit integer does not. The JavaScript variant uses `BigInt`, which stays exact even if the bound on $a[i]$ is raised; for the stated bound a plain `Number` would also be exact because $10^{15} < 2^{53}$.

::: math complexity Complexity
Monotonic queue optimization for a window of length $k$ over $n$ states: $O(n)$ time, $O(n + k)$ space including the $\text{dp}$ table, and a 64-bit accumulator.
:::

The amortized argument is the important one. A single iteration may pop many indices from the back, and a single front removal is cheap, but no index is ever pushed twice. The total work is linear even though the worst single iteration can be expensive.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The transition is a minimum over the last $k$ states | The increasing deque described here, $O(n)$ |
| The transition is a maximum over the last $k$ states | The same deque with the comparison reversed, $O(n)$ |
| The range is a prefix $[0, i-1]$ | A running minimum, which needs no deque at all |
| $k = 1$ | Prefix sums, because every state depends only on the previous one |
| $k \ge n$ | A running minimum over the whole prefix, with no expiry |
| The range's left bound can move backward | A segment tree or a multiset, because a deque cannot restore an expired index |
| The transition is $\text{dp}[j] + m_j x_i$ | The [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) |
| The transition is $\text{dp}[j] + \text{cost}(j, i)$ with a monotone split | Divide-and-conquer optimization, not a deque |
| The state has several dimensions and the transition is per layer | One deque per layer, reused from layer to layer |
| The transition asks for both a minimum and a maximum | Two deques, one increasing and one decreasing |

The first two rows are the same algorithm with one inequality changed. The rows below them are the cases where the window is not a window, or where the window is not the only structure in the transition. Recognizing which of those cases applies is more valuable than memorizing the deque code.

## Reference implementations

The manifest publishes one `program` variant in each of the six languages: C, C++17, Java, Python, Pascal, and JavaScript. Each program reads `n k` and then the $n$ values of $a$, and prints $\text{dp}[n]$ on one line. The C, C++, Java, and Python versions keep the $\text{dp}$ array and the index deque in arrays or lists; the Pascal version uses dynamic arrays of `Int64` and `LongInt`; the JavaScript version uses `BigInt` for the values and ordinary numbers for the indices.

All six versions clamp a negative $n$ to zero and a non-positive $k$ to one. A negative $a[i]$ is legal, so the programs never assume that the costs are positive. The output is a single signed integer, and the six outputs are byte-identical apart from the platform line ending, which the test harness normalizes.

The reusable `minimal` variant that the knapsack article carries is not part of this topic. The whole algorithm is four statements inside the input loop, so a separate function would add an interface without hiding any complexity. The program variants are the reference.

## Recursion decision

The recurrence can be written recursively with memoization:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def solve(i):
    if i == 0:
        return 0
    return a[i - 1] + min(solve(j) for j in range(max(0, i - k), i))
```

Without memoization this explores every route, which is exponential when $k$ is large. With memoization it computes each state once, but the inner `min` still scans $k$ entries, so the cost is $O(nk)$ and the recursion depth is $n$.

The depth is the second reason not to ship it. The table below gives the practical limits of the languages in this repository.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; the loop is also shorter |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; $n$ can be $10^6$ |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative |

At $n = 10^6$, the recursive form fails in Python by hitting the interpreter limit, and it risks a stack overflow in Java and JavaScript. The iterative deque has no recursion, and its memory is explicit.

## Implementation walkthrough

Four lines carry the whole algorithm:

```cpp
while (head < tail && deque[head] < i - k) ++head;
dp[i] = a[i] + dp[deque[head]];
while (head < tail && dp[deque[tail - 1]] >= dp[i]) --tail;
deque[tail++] = i;
```

**The window bound.** The window is $[i-k, i-1]$, so an index is stale only when it is **strictly smaller** than $i-k$. Using `<= i - k` drops the index $i-k$, which is still a legal predecessor, and the answer becomes too large. Using `i - k - 1` keeps one stale index, which can produce a route with a hop of length $k+1$.

**Indices, not values.** The deque stores indices because the expiry rule needs to know how old each candidate is. A deque of values cannot tell whether its front has left the window, and the usual attempt to store only values silently drops the wrong candidate.

**The direction of the comparison.** The deque is increasing, so the front is the minimum. The back is popped while its value is at least the new value. The equality case matters for efficiency rather than correctness: if equal values are kept, the deque can hold many copies of the same value, but the front is still correct. Popping on equality keeps the newest copy, which expires last, and keeps the deque strictly increasing.

**The order of the operations.** Expire, read, pop, push. Reading before pushing is what prevents the state from using itself as a predecessor. With negative costs, a self-transition would be especially damaging, because it would look like a free improvement.

**The empty deque.** For $k \ge 1$, the previous index $i-1$ is always in the window, and it was pushed at the end of the previous iteration. After step 1, the deque is therefore non-empty, and `dp[deque[head]]` is always a valid read. Clamping $k$ to at least one is what makes this true.

**The accumulator.** The $\text{dp}$ values can be negative and can be as large as $10^{15}$ in absolute value. C uses `long long`, C++ uses `long long`, Java uses `long`, Pascal uses `Int64`, Python uses arbitrary precision, and JavaScript uses `BigInt`. A 32-bit type is the most common cause of a wrong answer that still looks plausible.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Scanning the window for every state | The program is $O(nk)$ and times out at the top of the range | Maintain the deque and read its front |
| Storing values instead of indices | The front cannot be checked for expiry, so stale minima are used | Store indices and read $\text{dp}[index]$ |
| Expiring with `<= i - k` | A legal predecessor is dropped and the answer is too large | Expire only when the index is `< i - k` |
| Never expiring | A cheap but stale index is used forever, so the answer is too small | Check the front before every query |
| Pushing $i$ before reading the minimum | The state uses itself as a predecessor | Read, then push |
| Popping the back with `>` instead of `>=` | Equal values accumulate; still correct, but the deque is not minimal | Pop while the back is at least the new value |
| Using a 32-bit accumulator | Overflow on large instances, with no error message | Use a signed 64-bit type, or `BigInt` in JavaScript |
| Treating $a$ as zero-indexed while $\text{dp}$ is one-indexed | Every cost is shifted by one position | Keep the input index and the state index in step |
| Forgetting the lower bound $\max(0, i-k)$ | The first states read negative indices | Clamp the window at $0$ |

### Why this fails: the minimum that never expires

The mistake that survives review most often is keeping the cheapest value without checking whether it is still inside the window.

Take $k = 1$ and $a = [0, 10, 10, 10]$. With a hop limit of one, the only route is to visit every checkpoint, so the correct answers are

$$
\text{dp} = [0, 0, 10, 20, 30].
$$

A program that maintains a single cheapest value and never expires it starts with $0$ at index $0$. At $i = 2$ it still uses the value $0$, so it computes $\text{dp}[2] = 10 + 0 = 10$, which happens to be right because $\text{dp}[1]$ is also $0$. At $i = 3$ it still uses $0$, so it computes $\text{dp}[3] = 10 + 0 = 10$ instead of $20$. At $i = 4$ it prints $10$ instead of $30$. The output is too small by exactly the cost of the hops that the program allowed itself to skip.

The value $0$ belongs to index $0$ or index $1$, and by state $3$ both of them are outside the window $[2, 2]$. An index that has left the window cannot be reached by a hop of length one, no matter how cheap its state was.

The rule that prevents this is the first operation of the loop: **before reading the minimum, remove every index that is outside the window.** The deque makes that removal cheap because the oldest index is at the front.

A second failure has the same root and the opposite symptom. With $k = 2$ and $a = [1, 100, 0]$, the correct table is $\text{dp} = [0, 1, 100, 1]$: the cheapest route to checkpoint $3$ is $0 \to 1 \to 3$, with cost $1 + 0 = 1$ and hops of length $1$ and $2$. A program that expires with `<=` instead of `<` removes index $0$ at $i = 2$, because $0 \le 2 - 2$. It then computes $\text{dp}[2] = 100 + \text{dp}[1] = 101$ instead of $100$, and at $i = 3$ it has already lost index $1$ as well, so it prints $101$ instead of $1$. One boundary comparison turns a correct route into an illegal shortcut, and the error is large enough to change the answer.

## Variants and extensions

- **Maximum instead of minimum.** Reverse both comparisons: the deque becomes decreasing from front to back, the back is popped while its value is at most the new value, and the front is the maximum. The Pictures with Kittens problem below is this variant.
- **Window with a different lower bound.** If the window is $[i-k, i-1]$ for a fixed $k$, the code is unchanged. If the window is $[i-r_i, i-1]$ with $r_i$ non-decreasing, the same deque works; if $r_i$ can decrease, it does not.
- **Two windows.** Keep an increasing deque for the minimum and a decreasing deque for the maximum. Each is maintained independently, and each costs linear time.
- **One deque per layer.** In a two-dimensional program $\text{dp}[c][i]$, the transition for layer $c$ scans layer $c-1$. A deque can be reused for each layer, so the total cost is the number of layers times the layer length.
- **Bounded knapsack.** When an item may be used up to $m$ times, the transition over the count is a window of size $m+1$ on each residue class modulo the item's weight. A deque per residue class reduces the count dimension to constant amortized time, which is the standard $O(nW)$ bounded-knapsack optimization.
- **Reconstruction.** Store the index of the chosen predecessor in a parent array whenever $\text{dp}[i]$ is assigned, then walk backward from $n$. The deque does not need to change.
- **A circular route.** Duplicate the array or handle the wrap explicitly; the window logic is unchanged, but the state space and the expiry rule have to respect the circle.
- **The deque as a standalone structure.** When the array is fixed and the queries are independent, the same code answers sliding window minima; that is the [monotonic queue](/algorithms/arrays/monotonic-queue) article, and the DP version is the special case where the array is generated on the fly.
- **A range that is not a window.** If the query range is arbitrary, the deque is replaced by a [segment tree](/algorithms/range-queries/segment-tree) or a sparse table. The DP transition is still a range minimum; only the structure changes.

## Contest strategy

Under contest pressure, the errors above are what cost points, and they are all avoidable with a fixed procedure.

1. Write the $O(nk)$ recurrence first, and test it against a brute-force enumeration on small instances. The optimized version is a change to the inner loop, not a change to the state.
2. Identify the window and write its two bounds explicitly. For this technique the window is $[i-k, i-1]$, and the lower bound must be clamped at $0$.
3. Decide whether the transition is a minimum or a maximum, and choose the direction of the deque accordingly.
4. Replace the inner scan with the four operations: expire, read, pop the back, push. Never reorder the read and the push.
5. Test $k = 1$ and $k = n$ before anything else. The first exercises expiry on every step; the second exercises a window that never expires.
6. Test negative values, a single checkpoint, and a value near $10^9$ repeated $10^6$ times. The last one is the accumulator test.
7. If the transition contains a term that depends on both the previous and the current index, stop. The deque is not the right structure, and the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick) or a segment tree may be.

## Worked problems

### Problem 1: Pictures with Kittens (hard version)

**Restatement.** A feed has $n$ pictures with beauty values $a[1], \ldots, a[n]$. Vova reposts exactly $x$ pictures, and every block of $k$ consecutive pictures must contain at least one reposted picture. Report the largest total beauty of the reposted pictures, or $-1$ if no valid choice exists. Constraints: $1 \le k, x \le n \le 5000$ and $a[i] \le 10^9$.

**Naive baseline.** Let $\text{dp}[c][i]$ be the largest beauty with exactly $c$ reposts and picture $i$ reposted last. Then

$$
\text{dp}[c][i] \;=\; a[i] \;+\; \max_{j \in [\max(0,\,i-k),\,i-1]} \text{dp}[c-1][j].
$$

The direct evaluation is $O(xnk)$, which is too large at the top of the range.

**Insight.** For a fixed $c$, the right-hand side is a sliding window maximum of the previous layer. A decreasing deque computes the whole layer in $O(n)$.

**Derivation.** Keep one deque per layer, or reuse a single deque after the previous layer has been fully computed. Initialize $\text{dp}[0][0] = 0$ and every other entry to a negative sentinel. For $c = 1, \ldots, x$, sweep $i$ from $1$ to $n$, expire indices below $i-k$, read the front as the best predecessor, and set $\text{dp}[c][i] = a[i] + \text{dp}[c-1][\text{front}]$. The final repost must be at least $n-k+1$, so the answer is the maximum of $\text{dp}[x][i]$ over $i \in [n-k+1, n]$, or $-1$ if every such entry is the sentinel.

**Correctness.** The condition on every $k$ consecutive pictures is equivalent to requiring consecutive reposts to be at most $k$ apart, together with the two boundary conditions. The recurrence enumerates the last repost, and the deque returns the best legal predecessor. Induction on $c$ gives the optimum for every count and position.

**Complexity.** $O(nx)$ time and $O(n)$ auxiliary space per layer, or $O(nx)$ if every layer is kept.

**Common wrong approach.** Taking the maximum over all positions instead of over the last $k$ positions, which produces a set of reposts with a gap of more than $k$ and violates the condition.

### Problem 2: Watching Fireworks is Fun

**Restatement.** A street has $n$ sections. There are $m$ fireworks, and the $i$-th launches at time $t_i$ from section $a_i$ with happiness $b_i$. Standing at section $x$ at that time earns $b_i - |a_i - x|$. You may move up to $d$ sections per unit of time and start anywhere at the initial time. Maximize the total happiness. Constraints: $n \le 150\,000$, $m \le 300$, $d \le n$.

**Naive baseline.** Let $\text{dp}[i][x]$ be the best happiness after the first $i$ fireworks, ending at section $x$, and let $\text{dp}[0][x] = 0$ everywhere. For $i \ge 1$,

$$
\text{dp}[i][x] \;=\; b_i - |a_i - x| \;+\; \max_{y \,:\, |x-y| \le d(t_i - t_{i-1})} \text{dp}[i-1][y].
$$

The direct evaluation is $O(mn^2)$.

**Insight.** For a fixed $i$, the reachable previous sections form an interval whose center is $x$ and whose width is fixed by the elapsed time. As $x$ increases, the interval slides, so the maximum is a sliding window maximum.

**Derivation.** For each firework, compute the previous layer's window maximum for every section with a decreasing deque, then add $b_i - |a_i - x|$. Clamp the interval to $[1, n]$. The initial layer is zero everywhere, because the starting section is arbitrary. Two fireworks at the same time have a window of one section, which the same code handles.

**Correctness.** Every route ending at section $x$ at time $t_i$ comes from some section $y$ at time $t_{i-1}$ with $|x-y| \le d(t_i - t_{i-1})$, and the window maximum is exactly the best such $y$. Induction over the fireworks gives the optimum.

**Complexity.** $O(nm)$ time and $O(n)$ space for two layers.

**Common wrong approach.** Using a window of a fixed size $d$ instead of width $2d(t_i - t_{i-1}) + 1$, or forgetting to clamp the window at the ends of the street.

### Problem 3: Cashback

**Restatement.** Given an array $a[1..n]$ and an integer $c$, partition the array into contiguous segments. The value of a segment of length $L$ is the sum of its elements minus the sum of its $\lfloor L/c \rfloor$ smallest elements. Minimize the total value of the partition. Constraints: $n, c \le 100\,000$ and $a[i] \le 10^9$.

**Naive baseline.** Let $\text{dp}[i]$ be the minimum value of a partition of the first $i$ elements. Enumerating the last segment gives

$$
\text{dp}[i] \;=\; \min_{0 \le j < i} \bigl(\text{dp}[j] + \text{value}(j+1, i)\bigr),
$$

which is $O(n^2)$ before the cost of a segment is even computed.

**Insight.** A segment shorter than $c$ has no discount, so its elements can be taken one at a time. A segment longer than $c$ can be cut into blocks of length $c$ plus a remainder, and cutting cannot increase the cost, because each block removes its own minimum. Therefore the only useful grouped move is a block of exactly $c$ elements.

**Derivation.** The recurrence becomes

$$
\text{dp}[i] \;=\; \min\bigl(\text{dp}[i-1] + a[i],\; \text{dp}[i-c] + S(i-c+1, i) - \min(a[i-c+1..i])\bigr),
$$

with the second candidate available only when $i \ge c$. Prefix sums give $S$ in constant time, and an increasing deque over the last $c$ elements gives the minimum. The deque is unchanged from the route problem; only the values it holds are $a$ rather than $\text{dp}$.

**Correctness.** Any partition can be refined by replacing every segment of length at least $c$ with blocks of length $c$ and single elements, and the refinement does not increase the total value: a block of $c$ removes its minimum, and the sum of the minima of the blocks is at least the sum of the $\lfloor L/c \rfloor$ smallest elements of the original segment. The recurrence enumerates the two possible forms of the last piece, so induction gives the optimum.

**Complexity.** $O(n)$ time and $O(n)$ space, with 64-bit sums.

**Common wrong approach.** Applying the discount to every segment of length at least $c$ instead of only to full blocks of $c$, which undercounts the cost of the remainder.

## Practice progression

1. **Recognition.** Given a recurrence, decide whether the transition is a window minimum or maximum over earlier states. Look for "at most $k$ steps", "within the last $k$ positions", or a fixed gap between consecutive choices.
2. **Direct application.** Write the $O(nk)$ version, then replace the inner loop with the deque. Compare the two on random inputs with $n \le 12$.
3. **Boundaries.** Test $k = 1$, $k = n$, $n = 1$, and an input where the cheapest state is the oldest. Check that the expiry condition is strict.
4. **Direction.** Change the minimum to a maximum and confirm that both comparisons reverse. Then implement a problem that needs both, such as a layered program with a maximum transition and a minimum transition.
5. **Layers.** Apply the deque to a two-dimensional program, one layer at a time, and count the total work. The Pictures with Kittens problem is the model.
6. **Transfer.** Find the deque inside a problem that never mentions hops: a partition with a block size, a game with a bounded move, or a knapsack with a bounded count. In each case, identify the window before writing the code.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the recurrence, the window, and the meaning of $\text{dp}[0]$. (Formal model)
2. Why is the lower bound $\max(0, i-k)$ rather than $i-k$? (Problem motivation)
3. What are the two reasons an index leaves the deque, and which end does each use? (Key insight)
4. State the deque invariant, including the order of the indices and the order of the values. (Formal model)
5. Why is the front the minimum of the current window after the expiry step? (Correctness proof)
6. Give an instance on which never expiring produces a wrong answer, and the number it prints. (Common mistakes)
7. What happens to the answer if the expiry test is `<= i - k` instead of `< i - k`? (Implementation walkthrough)
8. Why must the new state be pushed after the minimum is read? (Algorithm derivation)
9. What is the total number of front and back pops over the whole run, and why is the time linear? (Complexity analysis)
10. How does the technique change when the transition is a maximum? (Variants and extensions)
11. When is a segment tree the right structure instead of a deque? (Algorithm selection)
12. How do you recover the route, not just its cost? (Variants and extensions)

## Further reading

- The structure itself, with the sliding window maximum and minimum as its direct applications, is [monotonic queue](/algorithms/arrays/monotonic-queue).
- The nearest-element sibling, which keeps a stack instead of a queue, is [monotonic stack](/algorithms/arrays/monotonic-stack).
- The dynamic program that this article optimizes is the same shape as [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack), and the bounded variant uses the deque per residue class.
- When the transition is a minimum of lines rather than of numbers, the structure is the [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- When the window is replaced by an arbitrary range, the structure is a [segment tree](/algorithms/range-queries/segment-tree).
- Prefix sums, which make the block cost in the Cashback problem constant time, are in [prefix sums](/algorithms/arrays/prefix-sums).
- The longest increasing subsequence, another dynamic program whose transition can be reorganized around a structure, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- When the answer is monotone in a parameter, the search over that parameter is [binary search](/algorithms/searching/binary-search).
