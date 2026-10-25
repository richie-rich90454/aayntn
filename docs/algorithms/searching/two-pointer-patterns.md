---
id: searching.two-pointer-patterns
title: The individual two-pointer patterns
summary: Treat the converging and same-direction pointer scans as two separate tools, and count every pair under a sum bound by turning each fit at the two ends into a whole row of answers.
division: [silver, gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords:
    [
        two pointers,
        converging pointers,
        same-direction pointers,
        pair count,
        sorted array,
        staircase boundary,
        monotone predicate,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [searching.binary-search, searching.sliding-window]
complexity:
    time: "O(n)"
    space: "O(1)"
assumptions:
    - The array is sorted in non-decreasing order before the scan.
    - Every pair sum that is compared fits in the signed 64-bit type used by the programs.
implementations: searching.two-pointer-patterns
reviewed: false
---

<AlgorithmSummary algorithm="searching.two-pointer-patterns" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="searching.two-pointer-patterns" />

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Count the index pairs $i < j$ with $a_i+a_j\le T$ in a sorted array |
| **Time** | $O(n)$ once the array is sorted; $O(n\log n)$ if a sort is needed |
| **Auxiliary space** | $O(1)$ beyond the array |
| **Requires** | A non-decreasing array, and a counter wide enough for $\frac{n(n-1)}{2}$ |
| **Converging pattern** | The ends move toward each other; a fit counts a whole row, a miss drops a whole column |
| **Same-direction pattern** | Both pointers move right; a window grows at the back and shrinks at the front |
| **Implementations** | Six languages, one program each, sharing a stdin/stdout contract |

"Two pointers" is an umbrella name for several scans that look alike and prove different things. This article separates the two that carry almost all of the contest weight, states what each one needs, and then uses the harder of the two, counting pairs under a sum bound, as the running example.

The **converging pattern** starts one pointer at each end of a sorted array and moves them toward each other. Every step either counts all the answers that share the current left endpoint or proves that the current right endpoint cannot be in any answer. It is the right tool for a pair whose sum or difference is bounded.

The **same-direction pattern** starts both pointers at the left end and moves them right, with the left one never passing the right one. The interval between them is a window, and the pattern is the right tool when the window has a quantity that grows as the window grows.

The two patterns share a proof style, not an update rule. Mixing up the rules is the most common way to lose an answer that is present in the input.

## Problem motivation

A parcel depot has weighed its outgoing boxes and stored the weights in non-decreasing order. A drone can carry two boxes at once, and its remaining capacity is $T$ kilograms. The dispatcher does not need to know which pair to load; the dispatcher needs to know **how many pairs fit**, so that the loading plan can be costed before any boxes move.

The constraints are the ones that make the question interesting:

- $1\le n\le 200\,000$ boxes, weights already sorted.
- $1\le a_i\le 10^9$ kilograms.
- One target $T$, with $0\le T\le 2\cdot 10^9$.

The double loop tries $\frac{n(n-1)}{2}$ pairs, which is about $2\ast 10^{10}$ comparisons at the largest size. A binary search per box is $O(n\log n)$, about $3.6\cdot 10^6$ comparisons. The converging scan is $O(n)$: at most $2\cdot 10^5$ steps, each of which looks at one pair of boxes.

The counting requirement is what makes this problem a better teacher than the usual "does any pair fit?" question. An existence scan may stop at the first fit. A counting scan may not: when the two ends fit, many other pairs with the same left end fit too, and all of them have to be added before the left end is discarded. The update that counts them is the entire difference between the two problems.

## Recognition patterns

The converging pattern is the right tool when all of the following hold.

- The input is an array of **pairs of positions**, and the array is **sorted** or can be sorted once.
- The quantity attached to a pair, such as $a_i+a_j$, is **monotone in each index**.
- The question asks for a **count**, an **existence**, or an **extreme value** under an inequality.

The same-direction pattern is the right tool when all of the following hold instead.

- The answer is a **contiguous window**.
- The window has a running quantity that is monotone in the window, such as a sum of non-negative values or a difference of the two endpoints.
- Shrinking the window from the left is the only way to restore the condition.

The phrases that signal the converging pattern are "two elements", "a pair", "two bags", "sum at most", "sum in a range", and "sorted". The phrases that signal the window pattern are "contiguous", "stretch", "longest window", and "at most $K$". The phrases that rule both out are "subsequence", which is not contiguous, and "count the pairs that sum to exactly $x$", where the answers concentrate on the equality case instead of filling a row.

The constraint values decide the rest.

| Constraint | What it decides |
| --- | --- |
| The array is already sorted | The converging scan applies as written |
| The array is unsorted | Sort once, and add $O(n\log n)$ to the total |
| Values may be negative | The converging scan still works; the window pattern does not |
| The question is only whether a pair exists | The scan may stop at the first fit, but the counting update is unnecessary |
| The question counts pairs with an exact sum | Group equal values or use a frequency map; a single row is usually not full |
| $n\le 1000$ | The double loop is simpler and fast enough |
| The answer may exceed $2^{31}-1$ | A 64-bit counter is mandatory |
| The values arrive as a stream | Two pointers need random access; use a Fenwick tree over compressed values |

## Naive approach

The reference solution is the double loop, and it is worth writing first because it defines the answer without any assumptions.

```python
def count_pairs(a, target):
    total = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] + a[j] <= target:
                total += 1
    return total
```

It is $O(n^2)$ and correct for every array, sorted or not. It is also the oracle for a differential test: any faster version that disagrees with it on a random small input is wrong.

The second baseline sorts the array and binary searches for each left endpoint.

```python
from bisect import bisect_right

def count_pairs(a, target):
    total = 0
    for i, value in enumerate(a):
        total += bisect_right(a, target - value, i + 1) - (i + 1)
    return total
```

This is $O(n\log n)$ and it is often the first correct solution under time pressure. It is a perfectly good answer. The two-pointer scan is faster and shorter, but the binary search version is easier to trust, because each left endpoint is handled independently and no argument about a shared pointer is needed.

The two baselines bracket the difficulty: one is obviously correct and slow, the other is correct and fast enough. The two-pointer version is correct and linear, and the price of the speed is that its correctness depends on the sorted order.

## Key insight

The pair table has one row per left index and one column per right index. The cell $(i,j)$ with $i < j$ is **valid** when $a_i+a_j\le T$. Sortedness makes the valid cells in each row a prefix: once a row fails at column $j$, it fails at every later column, because the values only grow to the right.

That gives the two moves.

- If the two ends fit, $a_l+a_r\le T$, then every index $j$ with $l < j \le r$ also fits, because $a_j\le a_r$. The scan has found not one pair but the whole rest of the row, and it can add $r-l$ to the answer in constant time.
- If the two ends do not fit, $a_l+a_r>T$, then the right end cannot pair with any other index at or after $l$, because every such value is at least $a_l$. The scan has proved a whole column invalid, and it can discard $r$ permanently.

Each step therefore removes either one row or one column from consideration, and the rows and columns it removes are disjoint. A table with $\frac{n(n-1)}{2}$ cells is consumed in at most $n-1$ steps, because each step moves one pointer and the pointers have only $n$ positions to visit between them.

The counting move is the part that does not exist in the existence version. An existence scan that finds $a_l+a_r\le T$ reports "yes" and stops, throwing away the other $r-l-1$ pairs in the row. A counting scan adds the entire row first, and only then moves on.

## Visual intuition

The array is a row of values with one hand at each end.

```text
l                       r
1  2  3  4  5  6  7  8
```

The left hand tests the smallest remaining value, the right hand tests the largest. If the two values fit, the left hand sweeps a whole group of partners into the answer and steps right. If they do not fit, the right hand steps left. The hands never move back, because every value they pass has been proved useless.

The same scan drawn on the pair table for $[1,2,3,4,5]$ with $T=5$ shows the staircase. A dot is a valid pair and an $x$ is an invalid one.

```text
        j=1  j=2  j=3  j=4
i=0      .    .    .    x
i=1           .    x    x
i=2                x    x
i=3                     x
```

The scan starts at the top-right corner, $(0,4)$, which is an $x$. That kills the whole fourth column, so the scan moves left to $(0,3)$, a dot. Row $0$ is then a prefix of three dots, and the scan adds all three at once before moving down to row $1$. The boundary between dots and crosses is a staircase, and the scan walks it once from top-right to bottom-left.

The same-direction pattern is a different animal. It looks like a worm moving through the array: the head advances one cell at a time, and the tail follows only when the worm has eaten too much.

```text
l  r
1  2  3  4  5  6  7  8
```

The head is the right pointer and the tail is the left pointer. The tail never passes the head and never moves backward. When the running quantity becomes too large, the tail moves right until the quantity is legal again.

## Formal model

::: math definition Definition
An array $a_0,a_1,\ldots,a_{n-1}$ is **non-decreasing** when $a_0\le a_1\le\cdots\le a_{n-1}$.
:::

::: math definition Definition
For $i < j$, the **pair predicate** is $P(i,j)=[a_i+a_j\le T]$, with brackets equal to $1$ when the statement holds and $0$ otherwise. The predicate is **up-left closed** when $P(i,j)=1$ implies $P(i',j')=1$ for every $i'\le i$ and $j'\le j$ with $i' < j'$.
:::

::: math definition Definition
For a left index $i$, let $r(i)$ be the largest $j$ with $i < j \le n-1$ and $P(i,j)=1$, and let $r(i)=i$ when no such $j$ exists. The **converging pattern** keeps pointers $l$ and $r$ with $l\le r$, starts at $(0,n-1)$, and at each step moves exactly one of them: $l$ increases when $P(l,r)=1$, and $r$ decreases otherwise.
:::

::: math definition Definition
The **same-direction pattern** keeps pointers $l\le r$, starts at $(0,0)$, and advances $r$ at every step while advancing $l$ only as far as a condition requires. The interval $[l,r]$ is the current window.
:::

::: math lemma Lemma
If $a$ is non-decreasing, then $r(0)\ge r(1)\ge\cdots\ge r(n-1)$.
:::

The proof is one line: if $j$ is valid for $i+1$, then $a_i+a_j\le a_{i+1}+a_j\le T$, so $j$ is valid for $i$ as well. A larger left value can only lose partners, never gain them.

::: math lemma Lemma
The number of valid pairs with left endpoint $i$ is $r(i)-i$, so the answer is $\sum_{i=0}^{n-2}\bigl(r(i)-i\bigr)$.
:::

The valid partners of $i$ are exactly the indices $i+1,\ldots,r(i)$. They form a contiguous run because the row is non-decreasing, so its length is the count.

::: math lemma Lemma
If every $a_k\ge 0$, the window sum $S(l,r)=\sum_{k=l}^{r}a_k$ is non-decreasing in $r$ and non-increasing in $l$.
:::

::: math invariant Invariant
In the converging pattern, before each iteration the counter equals $\sum_{i < l}\bigl(r(i)-i\bigr)$, and the right pointer satisfies $r\ge r(l)$. Every index above $r$ has already been proved invalid as a right endpoint for every left endpoint at least $l$.
:::

::: math invariant Invariant
In the same-direction pattern with non-negative values, after the inner loop the window $[l,r]$ is the longest window ending at $r$ whose sum is at most $K$.
:::

## Algorithm derivation

The converging count needs three pieces of state: the two pointers and a counter. The array is already sorted, so there is no preprocessing step.

1. Set $l=0$, $r=n-1$, and $total=0$.
2. While $l < r$, compare $a_l+a_r$ with $T$.
3. If $a_l+a_r\le T$, add $r-l$ to $total$ and increase $l$ by one. The added value is the number of partners of $l$ inside the current interval.
4. If $a_l+a_r>T$, decrease $r$ by one and add nothing. The right end has been proved useless.
5. When $l=r$, stop and report $total$.

The order of the branches matters only in that the fit case must include equality. Writing the three cases as "less", "greater", and "equal" is a common source of an off-by-one, because the equal case belongs with the fit case: a pair whose sum is exactly $T$ is allowed.

The derivation of the right pointer is the formal version of the row-and-column argument. At the start, $r=n-1\ge r(l)$. While the ends do not fit, the current $r$ is strictly greater than $r(l)$, so decrementing it keeps the invariant. The first time the ends fit, $r$ cannot be greater than $r(l)$, because $r(l)$ is the largest valid partner; therefore $r=r(l)$ exactly. The counter adds the whole row, and $l$ advances. Monotonicity of $r$ then gives $r\ge r(l+1)$ for the next iteration.

The same-direction pattern is derived the same way, with a running sum instead of two endpoint values.

1. Set $l=0$, $r=0$, and $S=0$.
2. For each new $r$, add $a_r$ to $S$.
3. While $S>K$, subtract $a_l$ from $S$ and increase $l$.
4. Record $r-l+1$ as a candidate answer.

The inner loop terminates because every subtraction removes a non-negative value, so $S$ cannot increase while $l$ advances. When the loop stops, $l$ is the smallest index for which the window ending at $r$ is legal, and that is the longest legal window ending at $r$.

## Step-by-step execution

Take $a=[1,2,3,4,5]$ and $T=5$. The correct answer is $4$: the value pairs are $\{1,2\}$, $\{1,3\}$, $\{1,4\}$, and $\{2,3\}$.

| Step | $l$ | $r$ | $a_l+a_r$ | Decision                   | $total$ |
| ---- | --- | --- | --------- | -------------------------- | ------- |
| 1    | 0   | 4   | 6         | Too large, discard $r$     | 0       |
| 2    | 0   | 3   | 5         | Fits, add $3$, advance $l$ | 3       |
| 3    | 1   | 3   | 6         | Too large, discard $r$     | 3       |
| 4    | 1   | 2   | 5         | Fits, add $1$, advance $l$ | 4       |
| 5    | 2   | 2   | —         | Pointers meet, stop        | 4       |

Step 2 is the counting step. The value pair $\{1,4\}$ fits, and so do $\{1,3\}$ and $\{1,2\}$; all three share the left endpoint and all three are added at once. Step 4 then adds the one remaining value pair $\{2,3\}$.

The right pointer moved from $4$ to $3$ to $2$, and the left pointer moved from $0$ to $1$ to $2$. The two pointers together made four moves, one per iteration, and no pair was examined twice.

Now the same-direction pattern on the same array with the limit $K=8$.

- $r=0$: $S=1$, window $[0,0]$, length $1$.
- $r=1$: $S=3$, length $2$.
- $r=2$: $S=6$, length $3$.
- $r=3$: $S=10>8$. Remove $a_0=1$, so $S=9$ and $l=1$; still too large. Remove $a_1=2$, so $S=7$ and $l=2$. The window is $[2,3]$ with length $2$.
- $r=4$: $S=12>8$. Remove $a_2=3$, so $S=9$ and $l=3$; still too large. Remove $a_3=4$, so $S=5$ and $l=4$. The window is $[4,4]$ with length $1$.

The best window is $[0,2]$ with sum $6$ and length $3$. Each element entered once and left at most once, so the total work was linear.

## Correctness proof

::: math theorem Theorem
On a non-decreasing array, the converging count returns $\sum_{i=0}^{n-2}\bigl(r(i)-i\bigr)$, which is the number of pairs $i < j$ with $a_i+a_j\le T$.
:::

::: math proof Proof
The proof is an induction on the iterations, using the invariant that the counter equals the number of valid pairs with left endpoint below $l$ and that $r\ge r(l)$.

The invariant holds at the start, when $l=0$, the counter is zero, and $r=n-1\ge r(0)$.

Suppose it holds at the start of an iteration with $l < r$.

If $a_l+a_r\le T$, then $r$ is a valid partner of $l$, so $r\le r(l)$. Together with $r\ge r(l)$, this gives $r=r(l)$. The counter gains $r-l=r(l)-l$, which is exactly the number of valid pairs with left endpoint $l$, and $l$ becomes $l+1$. The lemma on monotonicity gives $r(l)\ge r(l+1)$, so the new right pointer still satisfies the invariant.

If $a_l+a_r>T$, then $r$ is not a valid partner of $l$, so $r>r(l)$ because $r\ge r(l)$ and $r\ne r(l)$. Decreasing $r$ by one therefore leaves $r-1\ge r(l)$, and the counter is unchanged. Any pair that used the old $r$ as a right endpoint with a left endpoint at least $l$ is invalid, because $a_l+a_r$ is the smallest sum in that column and it already exceeds $T$.

Each iteration moves one pointer, and $l$ only increases while $r$ only decreases, so the loop terminates after at most $n-1$ iterations. At termination $l=r$. The invariant gives $r\ge r(l)$, while $r(l)\ge l$ by definition, so $r(l)=l$: no valid pair remains with a left endpoint at least $l$. Every valid pair has a left endpoint below $l$ and has been counted exactly once. $\square$
:::

::: math theorem Theorem
On an array of non-negative values, the same-direction scan returns the length of the longest contiguous window whose sum is at most $K$.
:::

::: math proof Proof
Fix a right end $r$ and consider the moment the inner loop stops. The window sum is at most $K$ by the loop condition, so the window is legal. Every index $l' < l$ was removed at some earlier time $r'\le r$ because $S(l',r')>K$. Since the values are non-negative, $S(l',r)\ge S(l',r')>K$, so no legal window ending at $r$ starts before $l$. Hence $[l,r]$ is the longest legal window ending at $r$.

Recording its length for every $r$ and keeping the maximum therefore yields the longest legal window in the array. Each element is added once and removed at most once, so the scan visits every element a constant number of times. $\square$
:::

## Complexity analysis

**Time: $O(n)$.** Each iteration of the converging scan moves either $l$ or $r$, and the two pointers start at the ends of the array. The total number of moves is at most $n-1$, so the number of iterations is at most $n-1$. The same-direction scan adds each element once and removes each element at most once, so it also performs $O(n)$ work.

**Auxiliary space: $O(1)$.** The pointers, the running sum, and the counter are the entire state. The array itself is the input.

**The cost of sorting.** If the input is not sorted, sorting costs $O(n\log n)$ and dominates the scan. The article and the programs assume the input is already sorted, which is why the stated complexity is linear. Sorting inside the loop, or re-sorting after each pointer move, destroys the bound.

**The width of the counter.** The answer can be as large as $\frac{n(n-1)}{2}$, which is about $2\ast 10^{10}$ for $n=200\,000$. That does not fit in a signed 32-bit integer, whose maximum is $2\,147\,483\,647$. The scan computes the count without enumerating the pairs, but the count itself still needs a 64-bit type in C, C++, Java, and Pascal. Python integers are unbounded. JavaScript numbers represent every integer up to $2^{53}$ exactly, which covers the largest possible count for any array that fits in memory.

::: math complexity Complexity
Converging count: $O(n)$ time and $O(1)$ auxiliary space after the input is sorted, with a 64-bit counter. Same-direction window: the same bounds, provided the window quantity is monotone.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Sorted array, count pairs with sum at most $T$ | Converging count, adding $r-l$ on a fit |
| Sorted array, does a pair with sum at most $T$ exist | Converging scan, stopping at the first fit |
| Sorted array, count pairs with sum in $[L,R]$ | Two converging counts, $F(R)-F(L-1)$ |
| Sorted array, maximum pair sum | The two ends alone; no scan is needed |
| Sorted array, count pairs with an exact sum | Group equal values or use a frequency map |
| Unsorted array, count pairs with sum at most $T$ | Sort once, then the converging count |
| Unsorted array, count pairs with an exact sum | A hash map of values seen so far |
| Non-negative array, longest window with sum at most $K$ | Same-direction window with a running sum |
| Array with negative values, longest window with sum at most $K$ | Not the window pattern; use prefix sums and a monotone structure |
| Sorted array, count pairs with difference at most $D$ | Same-direction pointer for each right end |
| The values arrive one at a time | A Fenwick tree over compressed values, not two pointers |

The exact-sum row is the one worth memorizing. The converging scan can find an exact pair, but it cannot count the exact pairs of a row in one step, because equality holds at a single column rather than on a prefix. Reaching for the scan and then counting by hand is how duplicate values turn into a wrong answer.

## Reference implementations

The manifest lists six programs, one per language, all with the same contract.

| Language | File | Input | Output |
| --- | --- | --- | --- |
| C | `c/program.c` | $n$, then $n$ sorted values, then $T$ | The number of pairs |
| C++17 | `cpp17/program.cpp` | Same | Same |
| Java | `java/Main.java` | Same | Same |
| Python | `python/program.py` | Same | Same |
| Pascal | `pascal/program.pas` | Same | Same |
| JavaScript | `javascript/program.js` | Same | Same |

The contract is: the first token is $n$; the next $n$ tokens are the values in non-decreasing order; the final token is the target $T$. The output is one integer followed by a newline.

The programs use signed 64-bit integers for the values, the pair sums, and the total in C, C++, Java, and Pascal. Python integers are unbounded. JavaScript numbers represent every count below $2^{53}$ exactly. The Pascal listing uses `Int64` and no 128-bit arithmetic.

All six programs print `0` when the input ends before the target or when $n < 0$. The array is buffered in every language, so the programs use $O(n)$ memory for the input even though the scan itself uses $O(1)$.

The JavaScript and Pascal listings are educational references, not USACO submission languages, and their file headers say so.

## Recursion decision

Both scans are loops, and the loop is the right form in every language. There is no subproblem to memoize, no divide step, and no state that a call frame would hold better than two local variables.

The recursion question belongs to alternative formulations. A divide-and-conquer pair count splits the sorted array in half, counts each half, and counts the cross pairs with a merge-like sweep; its depth is $O(\log n)$ and it is safe, but it is more code for the same asymptotic result. A formulation that recurses once per left endpoint, choosing a partner and then recursing on the rest, has depth $O(n)$ and crashes on a large array.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | The loop; a divide-and-conquer split at depth $\log_2 n$ is also fine |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

::: math counterexample Counterexample
A sorted array of $10^6$ elements scanned by a recursive function that handles one left endpoint per call makes $10^6$ nested calls. In C++ on Linux, with an 8 MB stack and a frame of roughly 64 bytes, the stack is exhausted after about $130\,000$ frames, so the program dies before it has handled $13\%$ of the array. The loop finishes the same array in at most $10^6$ pointer moves. The input is legal and the answer is well defined; only the implementation choice is wrong.
:::

The rule is simple: if the recursion depth would be proportional to the length of the array, write the loop.

## Implementation walkthrough

The whole algorithm is four lines inside a loop.

```cpp
long long total = 0;
int left = 0;
int right = n - 1;

while (left < right) {
    if (a[left] + a[right] <= target) {
        total += right - left;   // the whole row fits
        ++left;
    } else {
        --right;                 // the whole column fails
    }
}
```

Five details are worth checking before submitting.

1. **The loop condition is `left < right`.** A pair needs two distinct indices. With `left <= right`, a hit at a single index adds `right - left == 0`, so the answer happens to stay correct, but the invariant becomes harder to read and the guard no longer says what it means.
2. **The counting update is `right - left`, not `1`.** This is the difference between counting and existence. The partners of `left` are the indices `left + 1` through `right`, and there are `right - left` of them.
3. **The fit branch must include equality.** `<=` sends an exact hit into the counting branch; a strict `<` silently drops every pair whose sum equals the target.
4. **The counter is 64-bit.** The answer can exceed a signed 32-bit integer even when every value fits in one.
5. **The target is the last token.** Reading the target as part of the array, or forgetting that $n=0$ still has a target, shifts every subsequent value and produces a plausible wrong answer.

The Python and JavaScript versions follow the same loop and rely on unbounded or double-precision integers for the counter. The Java version reads with a buffered scanner and uses `long` for the values and the total. The Pascal version uses `Int64` for the values, the target, and the total, reads one argument per `Read`, and avoids `IOResult` and 128-bit integers so that it compiles under pas2js.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Adding one per fit instead of the whole row | The answer undercounts every row with more than one partner | Add `right - left` |
| Using `left <= right` as the loop condition | The guard no longer means "two distinct indices", and the reasoning becomes fragile | Use `left < right` |
| Testing `<` instead of `<=` | Pairs whose sum equals the target are lost | Include equality in the fit branch |
| Storing the counter in a 32-bit integer | Overflow once $n$ passes about 65,500 | Use `long long`, `long`, or `Int64` |
| Applying the converging scan to an unsorted array | Valid pairs are discarded without proof | Sort once before the scan |
| Sorting inside the loop | The solution becomes $O(n^2\log n)$ | Sort once, outside |
| Counting distinct values instead of index pairs | Duplicates are merged and the answer is too small | Count indices, or multiply by frequencies deliberately |
| Using the window pattern on negative values | The window shrinks past a valid start and cannot recover | Require non-negative values, or use prefix sums |
| Recomputing the window sum from scratch | The inner loop becomes quadratic | Maintain the running sum |

### Why this fails: the existence scan that counts one pair

The most instructive failure is a scan that is correct for existence and wrong for counting. Take $a=[1,2,3,4,5]$ and $T=5$, the same array as the trace.

An existence scan starts at $l=0$, $r=4$: $1+5=6>5$, so $r$ becomes $3$. Then $1+4=5$, the scan reports "yes", and it stops.

The count is not one. The value pairs $\{1,2\}$, $\{1,3\}$, $\{1,4\}$, and $\{2,3\}$ all fit, so the correct answer is four. The existence scan was entitled to stop because it had answered its own question. The counting scan is not: at the moment $1+4$ fits, the right pointer is at the largest valid partner of index $0$, so the other partners of index $0$ are indices $1$ and $2$, and both must be added before the left pointer moves.

The same mistake has a second form, which is to move both pointers on a fit. If both move, the row is abandoned before it is counted and the pair at the left end is lost. The fit branch moves only the left pointer; the right pointer stays where it is so that the next row can reuse the same boundary.

The window pattern has a matching failure. On $[-1,5,-2]$ with $K=3$, the whole array sums to $2$, so the longest legal window is the entire array, of length $3$. The window scan adds $-1$, then $5$, and the sum is $4>3$, so it removes the $-1$ and then the $5$; the negative value broke the monotonicity that the shrink argument needs, and the scan returns $1$. The lesson is the same in both patterns: the sorted order or the sign condition is not decoration, it is the premise of the discard.

## Variants and extensions

- **Strict bound.** Replace `<=` with `<` to count the pairs with $a_i+a_j < T$. The pointer movement is unchanged; only the fit branch changes.
- **Range of sums.** Count the pairs with $L\le a_i+a_j\le R$ as $F(R)-F(L-1)$, where $F$ is the at-most count. Two linear scans replace one.
- **Complement.** The pairs with sum greater than $T$ are all pairs minus the at-most count, which is useful when the strict version is easier to scan.
- **Two arrays.** Sort both arrays. For each value of the first array in increasing order, move a pointer down the second array to the largest partner that fits, and add the pointer position plus one. Each pointer moves once.
- **Three or more values.** Fix the first $k-2$ indices and run the converging count on the remaining suffix. The cost is $O(n^{k-1})$ after sorting, which is the standard $k$-sum reduction.
- **Bounded difference.** For each right end $j$, the valid left ends satisfy $a_i\ge a_j-D$, which is a suffix of the indices before $j$. A same-direction pointer that only moves right finds the first valid left end in $O(n)$ total.
- **The window pattern.** Longest window with sum at most $K$, smallest window with sum at least $K$, and the partition problems all use the same-direction rule with a comparison instead of a sum.
- **Duplicate values.** Counting index pairs keeps duplicates separate. Counting distinct value pairs requires grouping equal runs and multiplying their frequencies, which is easy to get wrong when a pair uses two copies of the same value.
- **Repeated targets.** The scan answers one target at a time, so several targets on one array cost one scan each. A shared sweep over the targets needs a different data structure.
- **Streaming input.** The two pointers need random access to both ends, so a stream is handled by a Fenwick tree over compressed values rather than by this pattern.

## Contest strategy

1. **Decide whether the question is existence, count, or an extreme value.** The pointer movement is similar, but the update on a fit is different, and that update is where the points are lost.
2. **Check the order before writing the loop.** Is the input sorted? If not, sort once and account for the $O(n\log n)$ term in the stated complexity.
3. **Write the elimination sentence for each direction.** "A fit counts the rest of the row" and "a miss proves the column empty" are the two sentences; if either is false, the pattern does not apply.
4. **Write the three outcomes explicitly.** Fit, too large, and the end of the loop. Keep equality inside the fit branch.
5. **Test the boundaries.** $n=0$, $n=1$, all values equal, all values negative, a target below every sum, and a target above every sum.
6. **Check the counter width.** Compute $\frac{n(n-1)}{2}$ for the largest $n$ and compare it with the maximum of the type before submitting.
7. **Prefer the binary-search version when time is short.** It is $O(n\log n)$ and much harder to get wrong; the two-pointer version is the optimization, not the first draft.

## Worked problems

### Problem 1: Number of Pairs

**Restatement.** Given an array of $n$ integers and two bounds $L$ and $R$, count the index pairs $i < j$ with $L\le a_i+a_j\le R$. Constraints: the sum of $n$ over all test cases is at most $200\,000$, and values reach $10^9$.

**Naive baseline.** Try every pair in every test case, which is quadratic per case.

**Insight.** The interval count is the difference of two prefix counts: $F(R)-F(L-1)$, where $F(x)$ counts the pairs with sum at most $x$. Each $F$ is the converging count of this article.

**Derivation.** Sort the array. Run the converging scan twice, once with target $R$ and once with target $L-1$, and subtract. The scan with target $L-1$ uses 64-bit arithmetic even when $L-1$ is negative.

**Correctness.** A pair counted by $F(R)$ but not by $F(L-1)$ has sum in $[L,R]$, and every pair in that interval is counted by exactly the difference. The scan itself is correct by the theorem.

**Complexity.** $O(n\log n)$ per test case for the sort, $O(n)$ for the two scans, and $O(n)$ memory.

**Common wrong approach.** Using one scan and trying to stop when the sum drops below $L$. The converging scan discards columns for the upper bound, so it cannot also enforce a lower bound in the same pass.

### Problem 2: Pair of Topics

**Restatement.** Two arrays $a$ and $b$ of length $n$ are given. Count the pairs $i < j$ with $a_i+a_j>b_i+b_j$. Constraints: $n\le 200\,000$, values reach $10^9$.

**Naive baseline.** Compare every pair, at $O(n^2)$.

**Insight.** Define $c_i=a_i-b_i$. The condition becomes $c_i+c_j>0$, which is a pair-sum inequality on a single array.

**Derivation.** Compute $c$, sort it, and count the complements with sum at most $0$ using the at-most scan, then subtract that count from $\frac{n(n-1)}{2}$. The result is the number of pairs with sum at least $1$, which is the same as sum greater than $0$.

**Correctness.** The transformation is an equivalence: $a_i+a_j>b_i+b_j$ if and only if $c_i+c_j>0$. Sorting permutes the indices but preserves the number of unordered index pairs, and the scan counts each unordered pair once by its left endpoint in sorted order.

**Complexity.** $O(n\log n)$ time and $O(n)$ memory for the difference array.

**Common wrong approach.** Forgetting that the inequality is strict. A pair with $c_i+c_j=0$ is not good, so the complement scan must use $c_i+c_j\le 0$; using that test for the direct count would include the equal pairs.

### Problem 3: Kefa and Company

**Restatement.** Each of $n$ friends has a money amount $m_i$ and a friendship factor $s_i$. Choose a group in which no member has at least $d$ more money than another, and maximize the total friendship factor. Constraints: $n\le 100\,000$, values reach $10^9$.

**Naive baseline.** Try every contiguous group after sorting, which is $O(n^2)$.

**Insight.** Sort the friends by money. A valid group is then a contiguous window, because the condition depends only on the poorest and richest members.

**Derivation.** Keep a window $[l,r]$ and the sum of its friendship factors. For each new $r$, add $s_r$. While $m_r-m_l\ge d$, subtract $s_l$ and advance $l$. Record the maximum sum seen.

**Correctness.** After sorting, any valid group can be extended to the contiguous window between its poorest and richest members without violating the gap condition, so an optimal group exists as a window. The inner loop removes exactly the members that make the gap too large, and the running sum is the sum of the remaining window.

**Complexity.** $O(n\log n)$ time for the sort and $O(n)$ for the scan, with $O(n)$ memory.

**Common wrong approach.** Using the converging pattern because the array is sorted. The quantity to maximize is a window sum, not a pair sum, so the correct pattern is the same-direction window.

## Practice progression

1. **Recognition.** Given ten statements, mark whether each asks for a pair, a window, or a count, and whether the input is sorted or non-negative. Write the one-sentence elimination argument for the two-pointer candidates.
2. **Direct application.** Implement the converging count and the same-direction longest window. Verify both against the double loop on random small inputs.
3. **Counting.** Change the converging scan from existence to count, then to a range count with $F(R)-F(L-1)$. Check the answers on arrays with many duplicates.
4. **Boundaries.** Test $n=0$, $n=1$, all-equal values, negative values, a target below all sums, and a target above all sums.
5. **Combination.** Solve the difference-array problem and the two-array problem, then a $k$-sum variant that fixes one index and reuses the count.
6. **Transfer.** Recognize the pattern in problems that do not say "pair": the maximum of $a_j-a_i$, the longest subarray with a bounded average, and the number of subarrays with a sum in a range.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a fit at the two ends prove about the rest of the row, and why? (Key insight)
2. What does a miss at the two ends prove about the rest of the column? (Key insight)
3. State the definition of $r(i)$ and the formula for the answer in terms of it. (Formal model)
4. Why is $r(i)$ non-increasing in $i$? (Formal model)
5. What are the two invariants of the converging scan, and which one uses monotonicity? (Correctness proof)
6. Why does the existence scan undercount on $[1,2,3,4,5]$ with $T=5$? (Common mistakes)
7. When can the right pointer stay still while the left pointer moves? (Algorithm derivation)
8. Why does the loop stop at $l=r$ rather than at $l=r+1$? (Correctness proof)
9. What is the largest possible answer for $n=200\,000$, and which type holds it? (Complexity analysis)
10. When is the window pattern the right choice, and what does a negative value break? (Algorithm selection)
11. Why does the range count need two scans rather than one? (Worked problems)
12. What is the cost of sorting, and does the solution remain linear after it? (Complexity analysis)

## Further reading

- [Two pointers](/algorithms/searching/two-pointers) is the umbrella treatment of both families, including the proof of the elimination lemma in its general form.
- [Sliding window](/algorithms/searching/sliding-window) develops the same-direction pattern for window conditions that are more complex than a sum.
- [Binary search](/algorithms/searching/binary-search) is the one-pointer alternative for each left endpoint, and the baseline that is easiest to trust.
- [Prefix sums](/algorithms/arrays/prefix-sums) make window sums computable in constant time and are the tool to reach for when values may be negative.
- [Interval scheduling](/algorithms/greedy/interval-scheduling) uses a sorted scan and a single justified choice, which is the same style of exchange argument applied to intervals instead of pairs.
