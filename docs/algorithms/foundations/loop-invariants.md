---
id: foundations.loop-invariants
title: Loop invariants
summary: State what stays true before and after every iteration, then use that statement to prove the loop correct and to choose its boundary conditions.
division: [bronze, silver]
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords:
    [
        loop invariant,
        invariant,
        induction,
        correctness,
        binary search,
        lower bound,
        half-open interval,
        termination,
        predicate,
        proof,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.recursion]
complexity:
    time: "O(n) to read the array, then O(log n) probes"
    space: "O(n) for the array, O(1) auxiliary"
assumptions:
    - The array is sorted in non-decreasing order.
    - One probe compares one array element with the target and costs one unit.
implementations: foundations.loop-invariants
reviewed: false
---

<AlgorithmSummary algorithm="foundations.loop-invariants" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="foundations.loop-invariants" />

## At a glance

A **loop invariant** is a statement about the variables of a loop that is true before the loop starts and remains true after every iteration. It is the contract between iterations: each pass may change the variables, but it may not break the statement. When the loop ends, the invariant plus the termination condition should imply the answer.

The running example is lower-bound binary search over a sorted array. The loop keeps two indices, `lo` and `hi`, and maintains the sentence

$$
\text{every index below } lo \text{ holds a value less than the target, and every index at or above } hi \text{ holds a value not less than the target.}
$$

At the start, `lo = 0` and `hi = n`, so both clauses are vacuous. Each probe compares the middle element with the target and moves exactly one boundary. When `lo == hi`, the two known regions meet, the unknown region is empty, and the meeting point is the lower bound. The program prints that index and the number of probes.

A correct invariant answers four questions.

| Question | For the running loop |
| --- | --- |
| Initialization | With `lo = 0` and `hi = n`, both known regions are empty, so the statement holds |
| Preservation | A probe at `mid` proves one side of `mid` is entirely on one side of the target |
| Termination | `hi - lo` is a nonnegative integer that strictly decreases |
| Sufficiency | The invariant implies `lo <= L <= hi`, so `lo == hi` gives `L = lo` |

Those four questions are the whole method. The rest of this article makes each of them precise, applies them to the running loop, and shows the same pattern in other loops.

## Problem motivation

The input is a sorted array of $n$ values and a target value. The output is the first index whose value is at least the target, using $n$ when every value is smaller, together with the number of probes the search performed. A linear scan performs up to $n$ comparisons and is obviously correct. Binary search performs at most $\lfloor \log_2 n \rfloor + 1$ probes for $n \ge 1$ and is not obviously correct.

The difficulty is not the halving. The difficulty is the boundary bookkeeping. A binary search has four independent choices: whether `hi` starts at `n` or `n - 1`, whether the loop condition is `lo < hi` or `lo <= hi`, whether the left update is `lo = mid` or `lo = mid + 1`, and whether the right update is `hi = mid` or `hi = mid - 1`. Some of the sixteen combinations are correct, some skip the answer, and some never terminate. Testing on the sample input usually catches none of the broken ones, because the sample tends to have distinct values and a target in the middle.

The same problem appears far away from binary search. A two-pointer window is correct only if the window property is restored after every move. A monotonic stack is correct only if the stack stays sorted after every push and pop. A greedy loop is correct only if every choice preserves the possibility of an optimal completion. In each case the code is short, the boundary is fragile, and the proof is a single sentence that must be true at every step.

That sentence is the invariant, and learning to write it is the difference between debugging a loop by changing `<` to `<=` at random and knowing which version is correct before running the program.

## Recognition patterns

Reach for a loop invariant when the code has one of these shapes.

- **A boundary between processed and unprocessed input.** The loop has consumed a prefix and has not yet looked at a suffix, and the answer depends on where the boundary settles.
- **A search for the first or last position satisfying a monotone predicate.** Lower bound, upper bound, "first day the total is at least $x$", "smallest capacity that finishes the work".
- **A two-pointer or sliding-window scan.** The window $[l, r)$ satisfies a property, and each pointer move must restore it.
- **A monotonic stack or queue.** The structure is sorted or has a known shape, and a pop is justified by that shape.
- **A prefix scan.** After processing position $i$, an accumulator holds the sum, count, maximum, or hash of the prefix $[0, i]$.
- **A greedy loop.** Each choice is safe because the remaining instance still has an optimal solution that extends the choice.
- **A dynamic program.** The table entry at a state holds the optimal value for that state, and the transition preserves the meaning.
- **A proof of termination.** A loop variant, usually a nonnegative integer that strictly decreases, is paired with the invariant.

The words in the statement that signal a boundary search are "first", "smallest index", "how many are less than", "sorted", "monotone", "at least", and "for all $i < j$". The words that signal a window are "subarray", "contiguous", "at most $k$", and "longest".

Do not force an invariant onto a loop whose body depends on the entire history in an unstructured way. If the only true statement is "the variables contain what the previous iterations put there", the invariant adds nothing. The technique pays off when the loop maintains a small summary that is strong enough to imply the answer.

## Naive approach

The baseline is to write the loop, run it on the sample, and trust it. That is how most binary searches are written, and it is a reasonable first draft. It is not a correctness argument, and it has a predictable blind spot: the failures live on the boundaries.

A search that fails to terminate on one input, returns the upper bound instead of the lower bound on another, or reads one element past the end on a third can still produce the correct output on a sample with distinct values and a target in the middle. Random testing against a linear scan is better than sample testing, but random arrays rarely produce the exact combination of duplicates, a missing target, and a boundary at the first or last index that exposes the bug.

The second naive approach is to trace one execution by hand. That proves one input, not all inputs. It is useful for finding a counterexample, and it is how the smallest counterexamples in this article were found, but it does not replace the general statement.

The third naive approach is to write a comment that restates the code: "`lo` is the left pointer and `hi` is the right pointer." That is a description, not an invariant. It says nothing about the array, so it cannot justify an update and cannot imply the answer.

The baseline that actually works is the linear scan, which is worth writing first as a reference:

```cpp
int lower_bound_linear(const std::vector<long long>& a, long long target) {
    for (int i = 0; i < static_cast<int>(a.size()); ++i) {
        if (!(a[i] < target)) return i;
    }
    return static_cast<int>(a.size());
}
```

This is $O(n)$ and it is correct for a sorted array. It is the oracle that the fast loop is tested against, and its invariant is simple: after examining position $i$, every index below $i$ is known to hold a value less than the target. The binary search is the same statement, maintained by halving instead of by stepping.

## Key insight

The key insight is that a loop does not need to know the answer at every step. It only needs to maintain a statement that is strong enough to imply the answer when the loop ends, and weak enough that every iteration can preserve it.

For lower-bound binary search, the statement is a three-region picture. To the left of `lo`, every value is known to be too small. To the right of `hi`, every value is known to be large enough. Between them is the only region that can still contain the boundary. A probe at `mid` either proves that `mid` and everything to its left is too small, or that `mid` and everything to its right is large enough. Either way, one known region grows and the unknown region shrinks. The loop ends when the unknown region is empty, and the two known regions meet at the boundary.

The sorted order is what makes the proof one line. If `a[mid] < target`, then for every $i \le mid$,

$$
a[i] \le a[mid] < target,
$$

because the array is sorted. If $a[mid] \ge target$, then for every $i \ge mid$,

$$
a[i] \ge a[mid] \ge target.
$$

Without sortedness, a probe tells you only about `mid`, and the halving argument collapses.

The same shape appears whenever a loop maintains a boundary. The invariant names the two sides, the body moves the boundary by one piece of evidence, and the sortedness or monotonicity is the lemma that lets one piece of evidence settle a whole side. The work is in choosing the statement so that it is both true initially and strong enough at the end.

## Visual intuition

The array is divided into three regions at every moment.

```
indices:   0   1   2   3   4   5   6   7
values:    1   3   3   5   8   8   8  13
           [ unknown ....................... )
           lo = 0                         hi = 8
```

Initially the unknown region is the whole array. After the first probe at `mid = 4`, the value `8` is not less than the target, so every index at or above `4` is known to be large enough and `hi` becomes `4`.

```
indices:   0   1   2   3 | 4   5   6   7
values:    1   3   3   5 | 8   8   8  13
           [ unknown     )[ known >= 8 )
           lo = 0      hi = 4
```

After the second probe at `mid = 2`, the value `3` is less than the target, so every index at or below `2` is known to be too small and `lo` becomes `3`.

```
indices:   0   1   2 | 3 | 4   5   6   7
values:    1   3   3 | 5 | 8   8   8  13
           [ < 8     )[?)[ >= 8 )
           lo = 3  hi = 4
```

After the third probe at `mid = 3`, the value `5` is less than the target, so `lo` becomes `4`. The unknown region is empty and both boundaries sit at index `4`.

| Region | Indices | What is known | Why it is known |
| --- | --- | --- | --- |
| Left | $[0, lo)$ | $a[i] < target$ | Each probe that moved `lo` proved a whole prefix is too small |
| Unknown | $[lo, hi)$ | Nothing yet | No probe has settled these positions |
| Right | $[hi, n)$ | $a[i] \ge target$ | Each probe that moved `hi` proved a whole suffix is large enough |

The picture to keep in mind is two walls closing on a boundary. The left wall only moves right, the right wall only moves left, and neither wall ever jumps past the boundary. When the walls meet, they meet exactly at the first position that is not less than the target.

## Formal model

Let $A$ be an array of $n$ values, sorted so that $A[i] \le A[j]$ whenever $0 \le i < j < n$. Let $t$ be the target.

::: math definition Definition
The predicate $P(i)$ is $A[i] < t$. It is **monotone** because the array is sorted: if $P(i)$ is false, then $P(j)$ is false for every $j > i$.
:::

::: math definition Definition
The **lower bound** of $t$ in $A$ is

$$
L = \min \{\, i \in \{0, 1, \ldots, n\} : i = n \text{ or } A[i] \ge t \,\}.
$$

Equivalently, $L$ is the number of elements of $A$ that are strictly less than $t$.
:::

::: math definition Definition
A state of the loop is a pair $(lo, hi)$ with $0 \le lo \le hi \le n$. The **invariant** $I(lo, hi)$ is the conjunction of two statements:

$$
\forall\, i \in [0, lo): A[i] < t
\qquad \text{and} \qquad
\forall\, i \in [hi, n): A[i] \ge t.
$$
:::

The first clause describes the known-small prefix, and the second clause describes the known-large suffix. The interval $[lo, hi)$ is the part that has not been decided.

::: math lemma Lemma
If $I(lo, hi)$ holds, then $lo \le L \le hi$.
:::

The lemma is the bridge between the invariant and the answer. It is proved in the correctness section. Its content is that the boundary cannot lie in either known region: it cannot be left of `lo` because every index there is too small, and it cannot be right of `hi` because every index there is large enough.

::: math definition Definition
A **probe** is one evaluation of $A[mid] < t$. Its cost is one unit, and the loop performs exactly one probe per iteration.
:::

The cost model counts a probe, an array read, an addition, and a comparison as one unit each. The probe count is therefore the number of iterations, which is the quantity the program prints.

## Algorithm derivation

### The loop skeleton

Start with the whole array unknown and shrink the unknown interval until it is empty.

```cpp
int lo = 0;
int hi = n;
int probes = 0;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    ++probes;
    if (a[mid] < target) {
        lo = mid + 1;
    } else {
        hi = mid;
    }
}
```

The loop condition is `lo < hi`, not `lo <= hi`, because the interval is half-open: it contains exactly the indices $i$ with $lo \le i < hi$. An empty half-open interval has `lo == hi`, so the loop must stop there. The condition `lo <= hi` belongs to a different, inclusive convention and must not be mixed with this one.

### Choosing the midpoint

The midpoint is

$$
mid = lo + \left\lfloor \frac{hi - lo}{2} \right\rfloor.
$$

Because $lo < hi$, the difference $d = hi - lo$ is at least one, so $\lfloor d/2 \rfloor \le d - 1$ and therefore $lo \le mid \le hi - 1$. The midpoint is always a valid index of the unknown interval, and it is never equal to `hi`.

Writing the midpoint as `lo + (hi - lo) / 2` also avoids the overflow of `(lo + hi) / 2` when both indices are large. The difference fits in the same integer type as the indices, and adding half of it to `lo` stays below `hi`.

### Case one: the midpoint is too small

Suppose $A[mid] < t$. For every $i \le mid$, sortedness gives $A[i] \le A[mid] < t$. The known-small region can therefore be extended from $[0, lo)$ to $[0, mid + 1)$. Setting

$$
lo' = mid + 1
$$

preserves the first clause. The second clause is unchanged because `hi` did not move, and the order $lo' \le hi$ holds because $mid < hi$.

### Case two: the midpoint is large enough

Suppose $A[mid] \ge t$. For every $i \ge mid$, sortedness gives $A[i] \ge A[mid] \ge t$. The known-large region can therefore be extended from $[hi, n)$ down to $[mid, n)$. Setting

$$
hi' = mid
$$

preserves the second clause. The first clause is unchanged because `lo` did not move, and the order $lo \le hi'$ holds because $lo \le mid$.

### Why the updates are asymmetric

The left update is `lo = mid + 1`, and the right update is `hi = mid`. The asymmetry is forced by the half-open convention. In the first case, `mid` itself is known to be too small, so it must leave the unknown interval and join the left region; `mid + 1` is the first index that is still unknown. In the second case, `mid` itself is known to be large enough, so it must join the right region; `mid` is the first index of that region.

Writing `hi = mid - 1` would drop `mid` from consideration even though it may be the answer, which is exactly the bug that makes a search return the previous index when the target appears once. Writing `lo = mid` would leave `mid` in the unknown interval even after it has been proved too small, so the interval would not shrink and the loop would not terminate.

### The progress measure

Let $m = hi - lo$ be the length of the unknown interval. In case one,

$$
m' = hi - (mid + 1) = m - \left\lfloor \frac{m}{2} \right\rfloor - 1 \le \left\lfloor \frac{m}{2} \right\rfloor,
$$

and in case two,

$$
m' = mid - lo = \left\lfloor \frac{m}{2} \right\rfloor.
$$

Both cases leave an interval of length at most $\lfloor m/2 \rfloor$. Since $m$ is a nonnegative integer and $m' < m$ whenever $m > 0$, the loop terminates. The quantity $m$ is the **loop variant**: the invariant says what is true, and the variant says why the loop stops.

### The probe bound

After $k$ probes, the interval length is at most $\lfloor n / 2^k \rfloor$. When $k = \lfloor \log_2 n \rfloor + 1$, the value $2^k$ is greater than $n$, so the length is zero and the loop has stopped. The worst case is attained when the target is at most $A[0]$: every probe then takes the `hi = mid` branch, and the lengths follow $n, \lfloor n/2 \rfloor, \lfloor n/4 \rfloor, \ldots, 0$. The number of probes is exactly $\lfloor \log_2 n \rfloor + 1$ in that case, so the bound is tight.

For $n = 0$ there is nothing to search, the loop body never runs, and the probe count is zero.

## Step-by-step execution

Take the array

```
index:  0  1  2  3  4  5  6  7
value:  1  3  3  5  8  8  8 13
```

and the target $8$. The initial state is `lo = 0`, `hi = 8`, `probes = 0`.

| Step | `lo` | `hi` | `mid` | `A[mid]` | `A[mid] < 8` | Action   | `probes` |
| ---- | ---- | ---- | ----- | -------- | ------------ | -------- | -------- |
| 1    | 0    | 8    | 4     | 8        | false        | `hi = 4` | 1        |
| 2    | 0    | 4    | 2     | 3        | true         | `lo = 3` | 2        |
| 3    | 3    | 4    | 3     | 5        | true         | `lo = 4` | 3        |

After step 3, `lo == hi == 4`, so the loop stops and the program prints `4 3`.

The invariant can be checked after each row. After step 1, every index at or above `4` holds a value at least `8`: the values are `8, 8, 8, 13`. After step 2, every index below `3` holds a value less than `8`: the values are `1, 3, 3`. After step 3, every index below `4` holds a value less than `8`: the values are `1, 3, 3, 5`. At every point the unknown interval is the only place the boundary can be, and at the end it is empty.

A second trace shows the other extreme. Take the array

```
index:  0  1  2  3  4  5
value:  2  4  6  8 10 12
```

and the target $20$.

| Step | `lo` | `hi` | `mid` | `A[mid]` | `A[mid] < 20` | Action   | `probes` |
| ---- | ---- | ---- | ----- | -------- | ------------- | -------- | -------- |
| 1    | 0    | 6    | 3     | 8        | true          | `lo = 4` | 1        |
| 2    | 4    | 6    | 5     | 12       | true          | `lo = 6` | 2        |

Now `lo == hi == 6 == n`, so the lower bound is $n$: every value is smaller than the target. The program prints `6 2`.

A third trace covers the smallest nonempty input. For the array `[7]` and the target `7`, the initial state is `lo = 0`, `hi = 1`. The probe at `mid = 0` reports false, so `hi = 0`, the loop stops, and the output is `0 1`. For the empty array, the initial state already has `lo == hi == 0`, no probe runs, and the output is `0 0`.

## Correctness proof

::: math theorem Theorem
The invariant $I(lo, hi)$ holds before the first iteration and is preserved by every iteration.
:::

::: math proof Proof
Before the loop, `lo = 0` and `hi = n`. The first clause ranges over the empty interval $[0, 0)$ and the second over the empty interval $[n, n)$, so both are vacuously true. The bounds $0 \le lo \le hi \le n$ hold as well.

Suppose $I(lo, hi)$ holds at the start of an iteration with $lo < hi$, and let $mid = lo + \lfloor (hi - lo)/2 \rfloor$. There are two cases.

If $A[mid] < t$, then for every $i \le mid$ we have $A[i] \le A[mid] < t$ by sortedness. Setting $lo' = mid + 1$ makes the first clause true for every $i < lo'$, because the indices $i < mid$ were already covered by the old invariant and $i = mid$ is covered by the new inequality. The second clause is unchanged because $hi$ did not move. Also $lo' = mid + 1 \le hi$ because $mid < hi$.

If $A[mid] \ge t$, then for every $i \ge mid$ we have $A[i] \ge A[mid] \ge t$ by sortedness. Setting $hi' = mid$ makes the second clause true for every $i \ge hi'$, because the indices $i > mid$ were already covered by the old invariant and $i = mid$ is covered by the new inequality. The first clause is unchanged because $lo$ did not move. Also $lo \le hi'$ because $lo \le mid$.

In both cases the invariant holds again, and the order $0 \le lo \le hi \le n$ is preserved. $\square$
:::

::: math theorem Theorem
If the loop terminates, its final value of `lo` is the lower bound $L$.
:::

::: math proof Proof
The loop stops exactly when `lo == hi`. By the invariant, every index below `lo` holds a value less than $t$, and every index at or above `hi = lo` holds a value not less than $t$. The first clause says that no index below `lo` can be $L$, so $L \ge lo$. The second clause says that `lo` itself, if it is below $n$, satisfies $A[lo] \ge t$, so $L \le lo$. If $lo = n$, the second clause is vacuous, but the first clause says every index is less than $t$, so $L = n$. In both cases $L = lo$. $\square$
:::

::: math theorem Theorem
The loop performs at most $\lfloor \log_2 n \rfloor + 1$ probes for $n \ge 1$, and there is an input that attains the bound.
:::

::: math proof Proof
Let $m_k$ be the length of the unknown interval after $k$ probes. The derivation shows $m_{k+1} \le \lfloor m_k / 2 \rfloor$, so by induction $m_k \le \lfloor n / 2^k \rfloor$. For $k = \lfloor \log_2 n \rfloor + 1$, the inequality $2^k > n$ holds, so $m_k = 0$ and the loop has stopped. Therefore the number of probes is at most $\lfloor \log_2 n \rfloor + 1$.

For tightness, take any target $t \le A[0]$. Every probe reports $A[mid] \ge t$, so every iteration takes the `hi = mid` branch and $m_{k+1} = \lfloor m_k / 2 \rfloor$. Starting from $m_0 = n$, the sequence reaches zero after exactly $\lfloor \log_2 n \rfloor + 1$ steps. $\square$
:::

The three theorems together say that the program prints the lower bound, that it always stops, and that it stops quickly. Notice that the first theorem does not mention the target's position, the second does not mention the number of probes, and the third does not mention the array values. Splitting the argument into initialization, preservation, sufficiency, and termination is what makes each part short enough to check.

## Complexity analysis

The search phase performs one probe per iteration and $O(1)$ work per probe, so its time is proportional to the probe count. For $n \ge 1$, the probe count is at most $\lfloor \log_2 n \rfloor + 1$ and can be that large, so the search is $\Theta(\log n)$ in the worst case and $O(\log n)$ in every case.

| Quantity | Bound | Reason |
| --- | --- | --- |
| Probes per search ($n \ge 1$) | at most $\lfloor \log_2 n \rfloor + 1$ | The interval at least halves every iteration |
| Worst-case probes | exactly $\lfloor \log_2 n \rfloor + 1$ | A target at most $A[0]$ always takes the right branch |
| Work per probe | $O(1)$ | One comparison, one addition, one assignment |
| Search time | $O(\log n)$ | Probes times constant work |
| Auxiliary space | $O(1)$ | Two indices and one counter |
| Input storage | $O(n)$ | The array must be read before it can be searched |
| Total program time | $O(n)$ | Reading the input dominates the search |

The last two rows are the ones that a bound on the algorithm alone would hide. The reference programs read all $n$ values before searching, so the program as a whole is linear in the input size. The search is logarithmic, but the input is not free. A problem that gives a sorted array and asks for $q$ lower-bound queries pays $O(n + q \log n)$: read once, then search many times. If the array arrives unsorted, add $O(n \log n)$ for the sort.

The probe count is a count under the stated cost model, not a stopwatch. A probe in C++ is a handful of machine instructions, a probe in Python is an interpreter dispatch and a list index, and a probe in JavaScript may be optimized by the just-in-time compiler or may not. The count is what the analysis compares; the constant is what the machine decides.

The table below makes the growth concrete.

| $n$       | $\lfloor \log_2 n \rfloor + 1$ | Linear scan in the worst case |
| --------- | ------------------------------ | ----------------------------- |
| 1         | 1                              | 1                             |
| 2         | 2                              | 2                             |
| 4         | 3                              | 4                             |
| 8         | 4                              | 8                             |
| 1,000     | 10                             | 1,000                         |
| 100,000   | 17                             | 100,000                       |
| 1,000,000 | 20                             | 1,000,000                     |

At one million elements the difference is more than four orders of magnitude. That difference is the reason binary search is worth the boundary bookkeeping.

## Algorithm selection

| Situation | What to use | Why |
| --- | --- | --- |
| Sorted array, one lower-bound query | This loop, or `std::lower_bound` | $O(\log n)$ probes, $O(1)$ auxiliary space |
| Sorted array, count of elements below $t$ | This loop; the returned index is the count | The lower bound counts the strictly smaller elements |
| Sorted array, upper bound | The same loop with $A[i] \le t$ as the predicate | The invariant's right region becomes $A[i] > t$ |
| Unsorted array, one query | Linear scan | Sorting costs more than the scan |
| Unsorted array, many queries | Sort, then this loop per query | The sort is paid once |
| Monotone feasibility over a numeric range | Binary search on the answer | The same invariant over a virtual array of answers |
| Data changes between queries | Fenwick tree or segment tree | A static binary search cannot see updates |
| Need the exact position of every equal element | Two lower/upper bounds | The pair delimits the equal range |
| Tiny array, clarity matters | Linear scan | The constant and the code are both smaller |
| Floating-point boundary | Fixed number of iterations | Exact equality at a boundary is not reliable |

The library functions deserve a note. `std::lower_bound` in C++ implements exactly this invariant and returns an iterator to the first element that is not less than the target, or `end()` when every element is smaller. Python's `bisect_left` returns the same index. Java's `Arrays.binarySearch` does not: it returns an unspecified index when the value appears more than once, so it cannot be used as a lower bound without an extra scan. If a problem asks for the first occurrence, write the loop or call a lower-bound helper.

The choice between a static search and a dynamic structure is a choice about the query mix. A binary search costs $O(\log n)$ and cannot answer a query about an array that changed after it was sorted. A Fenwick tree costs $O(\log n)$ per update and per query and handles changes, at the price of more code and more memory. If the array never changes, the search wins.

## Reference implementations

The six reference programs implement the same contract.

```
Input:
  n
  A[0] A[1] ... A[n-1]     (sorted in non-decreasing order)
  target

Output:
  one line with two integers: the lower-bound index and the number of probes.
```

The index is in the range $0$ to $n$, inclusive. The probe count is the number of loop iterations, which is the number of comparisons against the target. The array may be empty; in that case the index and the probe count are both zero.

| Language | File | Value type | Index type | Note |
| --- | --- | --- | --- | --- |
| C | `c/program.c` | `long long` | `int` | Reads with `scanf`, allocates the array with `malloc` |
| C++17 | `cpp17/program.cpp` | `long long` | `int` | Uses `std::vector` and `std::cin` |
| Java | `java/Main.java` | `long` | `int` | Class `Main`, reads with `Scanner` |
| Python | `python/program.py` | arbitrary precision | `int` | Reads all tokens from standard input |
| Pascal | `pascal/program.pas` | `Int64` | `LongInt` | Compiles under pas2js; `SysUtils`, one argument per `Read` |
| JavaScript | `javascript/program.js` | `Number` | `Number` | Reads standard input from the `process.stdin` stream |

All six variants are `program` variants: they read standard input, write standard output, and are marked unverified until a reviewer runs them. The compiled languages use 64-bit values because the target and the array values are not bounded by the statement. JavaScript's `Number` represents every integer up to $2^{53}$ exactly, which is far beyond the sizes for which the probe count is meaningful in this model.

Every program prints the same line, `index probes`, separated by a single space. The shared fixtures compare the six outputs byte for byte after line-ending normalization. The programs never print the array or the comparison that produced each step; the trace belongs in the article, not in the output.

The Pascal version is written to compile under pas2js as well as Free Pascal. It uses `SysUtils` for `IntToStr`, reads one argument per `Read` call, and avoids `IOResult`. The JavaScript and Pascal files open with the required educational-reference notice.

## Recursion decision

The loop has a natural recursive form. The function takes the interval and a probe counter by reference:

```cpp
int lower_bound_rec(const std::vector<long long>& a, int lo, int hi, long long target, int& probes) {
    if (lo >= hi) return lo;
    int mid = lo + (hi - lo) / 2;
    ++probes;
    if (a[mid] < target) return lower_bound_rec(a, mid + 1, hi, target, probes);
    return lower_bound_rec(a, lo, mid, target, probes);
}
```

The recursive form carries the same invariant, but on the arguments of the call instead of on the variables of a loop. The base case `lo >= hi` is the termination condition, and each recursive call applies one of the two preservation arguments from the loop proof.

The recursion depth is the number of probes, at most $\lfloor \log_2 n \rfloor + 1$. For $n = 10^6$ that is 20 frames, and for $n = 10^{18}$ it is 60, which is safe in every language in this encyclopedia. Unlike a recursion whose depth is $n$, this one cannot overflow the call stack at any input size that fits in memory.

The reference implementations use the loop anyway. The loop has no base case and no call overhead, and the recursive form is tail recursive, but not every language guarantees tail-call optimization. The recursive form is useful for the proof and for divide-and-conquer variants; the loop is the version to submit.

## Implementation walkthrough

The core of every reference program is the same short loop.

```cpp
int lo = 0;
int hi = n;
int probes = 0;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    ++probes;
    if (a[mid] < target) {
        lo = mid + 1;
    } else {
        hi = mid;
    }
}
```

The initialization makes the invariant vacuous. The condition is strict because the interval is half-open. The midpoint is computed before the probe so that the probe count matches the number of comparisons. The branch on `<` is the only place where the predicate appears; changing it to `<=` changes the answer from the lower bound to the upper bound. The two updates are asymmetric for the reasons in the derivation.

The output line is written once, after the loop:

```cpp
std::cout << lo << ' ' << probes << '\n';
```

The edge cases are worth checking in this order.

- **Empty array.** `n = 0`, so `lo = hi = 0`, the loop body does not run, and the output is `0 0`. No array access happens.
- **Single element equal to the target.** `n = 1`, the probe at `mid = 0` reports false, `hi` becomes zero, and the output is `0 1`. The boundary is the first index, which is also the last.
- **Target smaller than every element.** Every probe reports false, the right wall moves every time, and the output is `0` with $\lfloor \log_2 n \rfloor + 1$ probes.
- **Target larger than every element.** Every probe reports true, the left wall moves every time, and the output is `n` with fewer probes because the left branch discards the midpoint as well.
- **Duplicates of the target.** The first occurrence is returned because the predicate is strict: a value equal to the target belongs to the right region, so the right wall can move onto it but never past it.
- **Repeated values smaller than the target.** They are all in the left region, and the left wall passes them without a special case.

The input parsing has one subtlety. The target comes after the array, so the program must read exactly $n$ values before reading the target. A parser that reads all tokens into a list and indexes the target at position $n + 1$ is simpler and is what the Python and JavaScript versions do. The C, C++, Java, and Pascal versions read in order with a loop.

The integer width is the last detail. The indices fit in a 32-bit signed integer for every array that fits in memory, but the values and the target do not have a stated bound. The compiled versions use 64-bit values and 32-bit indices, which is the smallest combination that does not silently truncate a value. The midpoint formula uses the index type, so it cannot overflow even when `lo + hi` would.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using `lo <= hi` with a half-open interval | The loop repeats forever when `lo == hi` and the probe reports false | Use `lo < hi`, or switch entirely to inclusive bounds |
| Writing `hi = mid - 1` | The answer at `mid` is skipped when it is the lower bound | Write `hi = mid` |
| Writing `lo = mid` | The interval stalls at length one when the probe reports true, so the loop never terminates | Write `lo = mid + 1` |
| Using `A[i] <= t` in the predicate | The search returns the upper bound, not the lower bound | Use strict `<` for the lower bound |
| Starting with `hi = n - 1` and then writing `hi = mid` | The last element is never in the initial interval | Use `hi = n` with a half-open interval |
| Computing `(lo + hi) / 2` | Signed overflow when both indices are large | Use `lo + (hi - lo) / 2` |
| Counting probes outside the loop | The count is one even when the array is empty | Increment once per iteration, after computing `mid` |
| Claiming the invariant without sortedness | The one-line preservation proof is false | State sortedness as an assumption and use it in the proof |
| Making the invariant too weak | "The answer is somewhere in the array" does not justify an update | State both known regions, including the strictness |
| Forgetting `n = 0` | The program reads `a[0]` or prints a stale index | Handle the empty interval as a valid input |
| Mixing lower and upper bounds | Off-by-one counts when duplicates are present | Decide which boundary the problem asks for before coding |
| Testing only the sample | The boundary bugs survive | Test empty, single, duplicates, and both out-of-range targets |

### Why this fails: `while (lo <= hi)` with a half-open interval

The plausible mistake is to write the loop condition the way it appears in a textbook, `lo <= hi`, while keeping `hi = n` and `hi = mid`.

Take the array `[7]` and the target `7`. Initially `lo = 0` and `hi = 1`. The condition `0 <= 1` holds. The midpoint is `0`, the probe reports false because `7 < 7` is false, and the update sets `hi = 0`. The state is now `lo = 0`, `hi = 0`, and the condition `0 <= 0` still holds. The next iteration computes the same midpoint, performs the same probe, and makes the same update. The state never changes, so the loop never ends.

The smallest counterexample is therefore $n = 1$ with the target equal to the only element. The mistake is not the comparison itself: `lo <= hi` is correct for an inclusive interval in which `hi` is a candidate index. The mistake is mixing that condition with the half-open invariant. Choose one convention and write every line in it. With the half-open convention, the condition is `lo < hi`; with the inclusive convention, the condition is `lo <= hi`, the right update is `hi = mid - 1`, and the answer must be tracked separately because the loop can end without `lo` being the boundary.

### Why this fails: using `<=` in the predicate

The plausible mistake is to write `if (a[mid] <= target) lo = mid + 1;` because the goal is to find where the target stops being smaller.

Take the array `[3, 3]` and the target `3`. The correct lower bound is `0`, because the first element is already equal to the target. With the wrong predicate, the initial state is `lo = 0`, `hi = 2`. The midpoint is `1`, and `3 <= 3` is true, so `lo = 2`. The loop stops and returns `2`, which is the position just past the last equal element, not the first one.

The mistake is a change of predicate, not a change of loop shape. The invariant for the wrong predicate is "every index below `lo` holds a value at most the target, and every index at or above `hi` holds a value greater than the target". That invariant is perfectly consistent, and it finds the upper bound. It answers a different question. A problem that counts the elements strictly smaller than the target needs the strict predicate; a problem that counts the elements at most the target needs the non-strict one. Read the question, write the predicate, then write the invariant.

## Variants and extensions

- **Upper bound.** Change the predicate to $A[i] \le t$ and the right region to $A[i] > t$. The loop shape is identical, and the index is the first position greater than the target.
- **Equal range.** Run the lower bound and the upper bound. Their difference is the number of occurrences of the target, and the pair delimits them.
- **Binary search on the answer.** The array is virtual: position $k$ represents "is the answer at most $k$?", and the predicate is the feasibility check. The invariant is "every $k$ below `lo` is infeasible, every $k$ at or above `hi` is feasible". The search returns the smallest feasible $k$.
- **Last feasible value.** Use the same loop with the predicate negated or with a sentinel at the top of the range. The invariant becomes "every $k$ below `lo` is feasible, every $k$ at or above `hi` is infeasible", and the answer is `lo - 1`.
- **Two pointers.** The invariant is a property of the window $[l, r)$, such as "the sum is at most $S$" or "the window contains no duplicate". Moving a pointer must restore the property, and the answer is read when the window is valid.
- **Sliding window.** The window's counts or sum are exact for the current window. Adding the right element and removing the left element each restore the invariant, which is why the total work is linear even though one step may remove many elements.
- **Monotonic stack.** The stack is monotone after every push and pop. The pop loop restores the order, and the element that caused the pop is the next greater or next smaller element for every popped index, depending on the direction of the comparison.
- **Prefix sums.** Before iteration $i$, the entry `prefix[i]` equals the sum of the first $i$ values, and the body extends the array by one. The invariant is the definition of the prefix, and every query is a difference of two entries.
- **Selection sort.** After $i$ passes, the first $i$ positions hold the $i$ smallest elements in sorted order, and the remaining positions hold the rest. The invariant explains why the algorithm is correct without a second pass.
- **Euclidean algorithm.** The pair $(a, b)$ is replaced by $(b, a \bmod b)$, and the invariant is that the greatest common divisor does not change. The loop ends when the second value is zero, and the first value is the answer.
- **Fast exponentiation.** The invariant is that the accumulated result times the current base raised to the current exponent equals the original power. Squaring the base and halving the exponent preserve it, and the result is correct when the exponent reaches zero.
- **Dynamic programming.** The table entry for a state holds the optimal value for that state. The transition preserves the meaning, and the base cases initialize it. The invariant is indexed by the order in which states are filled.

## Contest strategy

A fixed procedure that survives time pressure.

1. Write the invariant in one sentence before writing the loop. Name the two known regions or the property that the window maintains.
2. Choose the interval convention. The half-open `[lo, hi)` is the default because it makes the empty interval `lo == hi` and removes the `n - 1` special case.
3. Write the predicate exactly as the problem states it. "First index with value at least $t$" is `A[i] < t` false; "first index with value greater than $t$" is `A[i] <= t` false.
4. Initialize the state so that the invariant is vacuous. The whole array unknown means `lo = 0` and `hi = n`.
5. Check the two updates against the invariant, not against intuition. Each update must extend exactly the region that the probe proved.
6. Prove termination with a variant: the interval length is a nonnegative integer that strictly decreases.
7. Count the probes or operations inside the loop, exactly once per iteration.
8. Test the boundaries: $n = 0$, $n = 1$, duplicates of the target, a target below every value, and a target above every value.
9. Use a library function only when its contract matches the question. `lower_bound` is a lower bound; `binarySearch` in Java is not.
10. If the search is on the answer rather than on an array, prove that the feasibility predicate is monotone before writing the loop, and add a sentinel at the top of the range.

The invariant is also the fastest way to review someone else's loop. Read the update lines first and ask what each one claims about the array. If the claims cannot both be true at the end, the loop is wrong regardless of what the sample output says.

## Worked problems

### Problem 1: Interesting drink

**Restatement.** There are $n$ shops, and shop $i$ sells a bottle for $x_i$ coins. For each of $q$ days, Vasiliy has $m_i$ coins and wants to know how many shops he can buy from. Constraints: $n, q \le 10^5$, prices up to $10^5$, budgets up to $10^9$.

**Naive baseline.** For each day, scan all $n$ prices and count the ones at most $m_i$. The work is $O(nq)$, which is $10^{10}$ comparisons at the limits and far too slow.

**Insight.** The count of prices at most $m$ is the position of the first price greater than $m$. After sorting the prices, that position is the boundary where the predicate "price at most $m$" becomes false.

**Derivation.** Sort the prices once. For each budget, run the search with `lo = 0`, `hi = n`, and the probe `a[mid] <= m`. The invariant is "every index below `lo` has a price at most $m$, and every index at or above `hi` has a price greater than $m$". When `lo == hi`, the index is exactly the number of affordable shops. Equality belongs to the left region because an equal price is affordable.

**Correctness.** Sorting does not change the multiset of prices. The invariant is initialized vacuously and preserved by the same argument as the running example, with `<=` in place of `<`. At termination, every affordable price is below `lo` and every unaffordable price is at or above `lo`, so `lo` is the count.

**Complexity.** Sorting is $O(n \log n)$, and each of the $q$ queries is $O(\log n)$, for $O(n \log n + q \log n)$ time and $O(n)$ space.

**Common wrong approach.** Re-sorting or re-scanning the prices for every day, which restores the quadratic or worse behavior, or using the strict predicate and reporting one shop too few when a price equals the budget.

### Problem 2: Cellular Network

**Restatement.** There are $n$ cities at positions $a_1 \le \cdots \le a_n$ and $m$ towers at positions $b_1 \le \cdots \le b_m$ on a line. A tower at $b$ covers a city at $a$ when $|a - b| \le r$. Find the smallest $r$ that covers every city. Constraints: $n, m \le 10^5$ and coordinates between $-10^9$ and $10^9$.

**Naive baseline.** For each city, scan all towers and keep the smallest distance. The work is $O(nm)$, which is $10^{10}$ distance computations at the limits and far too slow. Binary searching $r$ and testing coverage by rescanning all towers is also more work than necessary.

**Insight.** For one city, the nearest tower is either the first tower at or to the right of the city or the last tower strictly to its left. The lower-bound loop finds the first of those two, and the other is its predecessor.

**Derivation.** The tower positions are already sorted. For each city $a$, run the lower-bound loop on the towers with the target $a$ and the strict predicate `b[mid] < a`. The invariant is "every tower index below `lo` is strictly left of the city, and every tower index at or above `hi` is at or to the right of the city". At termination `lo` is the first tower at or to the right of $a$. The nearest tower is either `lo` (if `lo < m`) or `lo - 1` (if `lo > 0`), so take the minimum of the distances to those two candidates. The answer is the maximum of these per-city minima.

**Correctness.** Every tower with index below `lo` is strictly left of the city, so its distance is $a - b_j$, which is smallest at the largest such index, `lo - 1`. Every tower with index at least `lo` is at or to the right of the city, so its distance is $b_j - a$, which is smallest at the smallest such index, `lo`. The nearest tower is therefore one of the two candidates, and the boundary cases at the ends of the tower array have only one candidate. A radius smaller than the maximum per-city minimum leaves the city that attains the maximum uncovered, and a radius equal to the maximum covers every city, so the maximum is the smallest feasible radius.

**Complexity.** Each city performs $O(\log m)$ probes, for $O(n \log m)$ time and $O(1)$ auxiliary space beyond the input. The coordinates can differ by $2 \times 10^9$, which is close enough to the signed 32-bit limit that 64-bit arithmetic is the safe choice in the compiled languages.

**Common wrong approach.** Keeping only the first tower at or to the right of the city, which fails when the tower just to the left is closer, or keeping only the last tower to the left, which fails in the mirror case. Another common error is reading `b[lo]` or `b[lo - 1]` without checking that the index is inside the tower array, which fails when the city lies beyond every tower.

### Problem 3: Sagheer and Nubian Market

**Restatement.** There are $n$ souvenirs. Souvenir $i$ has base cost $a_i$. If Sagheer buys $k$ souvenirs with indices $x_1, \ldots, x_k$, the actual cost of souvenir $x_j$ is $a_{x_j} + x_j \ast k$. He has a budget $S$ and wants the largest $k$ he can afford, along with the minimum total cost for that $k$. Constraints: $n \le 10^5$, $a_i \le 10^5$, $S \le 10^9$.

**Naive baseline.** Try every $k$ from $n$ down to zero. For each $k$, compute the transformed costs, sort them, take the $k$ smallest, and compare the sum with $S$. There are $n$ values of $k$ and each check is $O(n \log n)$, for $O(n^2 \log n)$.

**Insight.** If $k$ souvenirs are affordable, then $k - 1$ souvenirs are affordable: take the same set and remove one item, and every remaining item is cheaper because the surcharge is $(k - 1) \ast x_j$ instead of $k \ast x_j$. Affordability is therefore monotone in $k$, and the largest affordable $k$ can be found by binary search.

**Derivation.** Define `cost(k)` as the sum of the $k$ smallest values of $a_i + i \ast k$ (with $i$ 1-based). The predicate `cost(k) <= S` is true for a prefix of the possible values $0, 1, \ldots, n$ and false afterward. Run the lower-bound-on-answer loop over the domain $[0, n + 1)$ with `lo = 0` and `hi = n + 1`. The invariant is "every $k$ below `lo` is affordable, and every $k$ at or above `hi` is not affordable". When `lo == hi`, the answer is `lo - 1`, the largest affordable $k$. Recompute `cost(k)` once more for that $k$ to print the minimum total.

**Correctness.** The monotonicity argument shows that the predicate has the prefix-true, suffix-false shape that the invariant requires. The loop's preservation and termination arguments are the same as in the running example, with $k$ in place of an array index. At the end, `lo` is the first unaffordable value, so `lo - 1` is the largest affordable one. The check recomputes the cost with the same $k$ used in the surcharge, so the printed total matches the selection.

**Complexity.** Each feasibility check transforms $n$ values and sorts them, which is $O(n \log n)$. The binary search performs $O(\log n)$ checks, for $O(n \log^2 n)$ time and $O(n)$ auxiliary space. At $n = 10^5$ the operation count is about $3 \times 10^7$, which fits comfortably in the time limit. The transformed costs reach $10^{10}$, so the total must be accumulated in a 64-bit integer.

**Common wrong approach.** Greedily taking the items with the smallest base costs, which ignores the index surcharge and fails when a large-index item has a small base cost. Another common error is using the answer's $k$ in the final cost computation but a different $k$ inside the check, which prints a total that does not correspond to the selected items.

## Practice progression

1. **Recognition.** Given a loop, write one sentence that is true before and after every iteration. If the sentence mentions only the variables, rewrite it until it mentions the data.
2. **Direct application.** Trace the lower-bound loop on `[1, 3, 3, 5, 8, 8, 8, 13]` for the targets `0`, `3`, `8`, and `20`. Count the probes and check the invariant after every step.
3. **Adaptation.** Rewrite the loop for the upper bound and state the new invariant. Then rewrite it for "the last index whose value is at most the target" and state the variant that proves termination.
4. **Combination.** Add a two-pointer window around the search. Maintain both invariants at once and prove that each pointer move restores only the property it can break.
5. **Challenge.** Prove that the probe bound $\lfloor \log_2 n \rfloor + 1$ is tight for $n \ge 1$, then construct an input for every such $n$ that attains it. Explain why the left branch can finish earlier.
6. **Transfer.** Take a problem you have already solved with a monotonic stack or a sliding window and write the invariant that you were implicitly maintaining. Use it to explain why a pop or a pointer move is safe.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four questions that a loop invariant must answer, and which one connects the invariant to the answer? (At a glance)
2. State the invariant of the lower-bound loop in words and in symbols. (Formal model)
3. Why is the left update `lo = mid + 1` while the right update is `hi = mid`? (Algorithm derivation)
4. What goes wrong with `hi = mid - 1`, and what goes wrong with `lo = mid`? (Algorithm derivation)
5. Why does the loop condition `lo <= hi` fail with a half-open interval? Give the smallest counterexample. (Common mistakes)
6. Why does using `<=` in the predicate return the upper bound, and when is that the right answer? (Common mistakes)
7. Prove that the invariant implies `lo <= L <= hi`. (Correctness proof)
8. Prove that the interval length strictly decreases, and derive the probe bound. (Algorithm derivation)
9. Why is the search $O(\log n)$ while the whole program is $O(n)$? (Complexity analysis)
10. When is a library lower bound safe to use, and when is a hand-written loop required? (Algorithm selection)

## Further reading

- The growth-rate notation and the cost model used for the probe count are in [complexity analysis](/algorithms/foundations/complexity).
- The call-stack limits that decide whether the recursive form is safe are in [recursion](/algorithms/foundations/recursion).
- The search technique that this loop implements, including its upper-bound and recursive forms, is in [binary search](/algorithms/searching/binary-search).
- The two-pointer and window invariants that reuse the same boundary argument are in [two pointers](/algorithms/searching/two-pointers).
- The monotonic stack, whose correctness is also an invariant on the stack's shape, is in [monotonic stack](/algorithms/arrays/monotonic-stack).
- The use of a monotone feasibility predicate over a numeric range is in [parametric search](/algorithms/searching/parametric-search).
- The order that makes the one-line preservation proof possible is in [sorting](/algorithms/foundations/sorting).
- The induction, contradiction, and pigeonhole techniques that support these proofs are in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
