---
id: searching.sliding-window
title: Sliding window
summary: Maintain a contiguous range of the array and move it across the data, so that each step tests one more candidate in constant time.
division: [silver, gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords:
    [
        sliding window,
        window,
        two pointers,
        frequency map,
        distinct characters,
        running sum,
        subarray,
    ]
prerequisites:
    required: [searching.two-pointers, foundations.complexity]
    recommended: [arrays.prefix-sums, searching.binary-search]
complexity:
    time: "O(n)"
    space: "O(1) for a running sum, O(sigma) for a frequency map"
assumptions:
    - The quantity that decides when the window moves is monotone, so that a window that fails can be repaired by moving one end only.
reviewed: false
---

## At a glance

A sliding window is a contiguous range of the array that moves across the data one position at a time, carrying enough information with it to test each position in constant time. The two ends of the window are the two pointers, and the whole technique is the discipline of deciding when each end moves.

There are two shapes. A **fixed-size window** always holds exactly $k$ elements; when the window advances, one element leaves on the left and one enters on the right, and the maintained value is updated with two arithmetic operations. A **variable-size window** holds however many elements the condition requires; the right end always advances, and the left end advances only when the window violates the condition.

When the condition is about the _contents_ of the window rather than about a sum, a **frequency map** keeps the counts of the values inside the window, and a small number of derived counters turns each window update into $O(1)$ work.

The technique costs $O(n)$ time and $O(1)$ or $O(k)$ space, and it is a specialization of the two-pointer pattern. The difference is emphasis: in a general two-pointer solution the pointers move for whatever reason the problem demands, while in a sliding window the window is the object of the problem, and the two ends move because the window's contents changed.

The condition that the technique needs is monotonicity. A window that satisfies the condition must not be spoiled by making it larger, or the left end can never catch up. That is the assumption that separates a sliding window from a search that does not work.

## Problem motivation

A server records the last minute of every request that arrives. A security analyst wants to know the longest run of requests during which no user made more than three requests.

The constraints:

- $1 \le n \le 200\,000$ log entries, each naming a user.
- The users are drawn from a string of at most $26$ letters.
- The question asks for the longest contiguous stretch of the log in which no user appears more than three times.

The naive answer tries every window and counts the users in it, at a cost of $O(n^2)$ for the enumeration and $O(n^3)$ if the counting is redone from scratch each time.

The answer that a sliding window gives is linear. The window's right end advances one entry at a time, and the left end advances only when some user is over the limit. Each entry is added to the window once and removed at most once, and the counts of the users in the window are maintained as the window moves, so the test of the condition costs $O(1)$.

The two hard parts of this problem are both about the maintenance rather than the movement. The first is that "no user appears more than three times" is not a question about a sum; it is a question about the whole multiset of values in the window. The second is that the answer to that question must be available in constant time, and that is what the frequency map is for.

## Recognition patterns

A sliding window is the right tool when all of the following hold.

- The answer concerns a **contiguous** range of the array. A subsequence is not a window.
- The condition is **monotone** in the window: making the window larger never turns an invalid window into a valid one.
- The maintained quantity can be **updated in constant time** when an element enters or leaves.

The phrases that signal it are "longest contiguous", "shortest window containing", "consecutive", "at most $k$ distinct", "no more than $m$ occurrences". The phrase that rules it out is "subsequence", and so is "the elements in any order".

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The window size is fixed at $k$ | The simplest form; the sum updates with two operations |
| The window size varies | The left end moves on its own schedule; the condition decides when |
| The condition is about a sum and the values may be negative | Rules out the variable-size form; use prefix sums |
| The condition is about distinct values | A frequency map with a distinct counter |
| The condition is about counts above a limit | A frequency map with an over-limit counter |
| $k$ is comparable to $n$ | The window is most of the array; a single pass still works |
| $q$ separate queries over different ranges | Rules out one shared window; use prefix sums |

## Naive approach

The baseline enumerates every window and tests it from scratch.

```python
best = 0
for start in range(n):
    for end in range(start, n):
        if valid(a[start:end + 1]):
            best = max(best, end - start + 1)
```

This is $O(n^2)$ windows and $O(n)$ per test, so $O(n^3)$ in the worst case. Even with a frequency map rebuilt per window it is $O(n^2)$, which is already too slow at $n = 200\,000$.

The second baseline is a single pass with a fresh count of the window on every step, which is $O(n^2)$ and is the mistake people make when they have understood the movement but not the maintenance.

## Key insight

The insight is that consecutive windows overlap, and the overlap is everything that matters.

Window $[l, r]$ and window $[l + 1, r + 1]$ share $r - l$ elements. Everything the two windows have in common can be carried over, and only the element that left and the element that arrived need to be processed. So if the maintained value can be updated from those two events in constant time, then a whole scan of the array costs $O(n)$ instead of $O(n^2)$.

That is the entire insight, and it has two parts that are sometimes confused.

The first part is the **movement**: the window advances, and each end moves in one direction only. This is the two-pointer discipline, and it is what bounds the total number of updates by $O(n)$.

The second part is the **maintenance**: the state that describes the window must be updatable from one entering element and one leaving element. For a sum, that is a subtraction and an addition. For a set of distinct values, it is a decrement of one count and an increment of another. For a multiset with limits, it is the same two operations plus the maintenance of one or two derived counters.

The second part is where the technique is won or lost, and it is the part that the frequency map exists to solve. A window of $k$ elements has $k$ distinct values in the general case, and no constant-size state can describe which values they are. The frequency map is that state: an array indexed by the value, holding the number of occurrences of each value inside the window. It is not constant space, but it is $O(k)$ or $O(\sigma)$ space, where $\sigma$ is the number of distinct values in the data, and its update is $O(1)$.

From the frequency map, the derived counters follow in constant time. Let `count[c]` be the number of occurrences of value $c$ in the window. Then:

- `distinct`, the number of values with `count[c] > 0`, changes only when a count crosses zero, that is, between 0 and 1.
- `over`, the number of values with `count[c] > 1`, changes only when a count crosses one, that is, between 1 and 2.

So when a value enters the window, at most two counters change, and the same is true when a value leaves. Each update is $O(1)$.

## Visual intuition

The window is a pair of hands on a strip of log entries. The right hand pushes entries in; the left hand pulls them out.

For a fixed-size window of three entries, the picture is simple: the right hand pushes, the left hand pulls, and the sum changes by "subtract what the left hand pulled, add what the right hand pushed".

```text
        l        r
a:  3   1   4   1   5   9   2   6
```

The window is the three entries between the hands, and after each step both hands have moved one position to the right.

For a variable-size window, the picture has a second rule. The right hand always moves. The left hand moves only when the condition fails, and it keeps moving until the condition holds again.

```text
          l      r
a:  3   1   4   1   5   9   2   6
```

Here the window is longer than the last one, because the condition permitted it to grow.

The picture worth having for the frequency map is of a row of counters, one per value, with the count of that value inside the window:

```text
value:   a  b  c  d
count:   2  0  1  1
distinct: 3
```

The `distinct` counter is 3 because three of the four counts are positive. Adding a `c` would raise `distinct` to 4, because the count of `c` crosses from 0 to 1. Adding a `b` when the count of `b` is 0 would also raise it, and adding an `a` when the count of `a` is 1 would raise `over` instead.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the array, and let a window be a pair of indices $(l, r)$ with $1 \le l \le r \le n$.

::: math definition Definition
A condition $C$ on a window is **monotone under growth** if, for every $l \le r \le r'$, $C(l, r)$ implies $C(l, r')$. A condition is **monotone under shrinkage** if $C(l, r)$ implies $C(l', r)$ for every $l \le l' \le r$. A window condition that is monotone under both is **monotone**, and a window algorithm that relies on the left end never retreating requires the condition to be monotone under shrinkage.
:::

::: math definition Definition
A **frequency map** of a window $[l, r]$ is a map `count` from the values in the array to the non-negative integers such that `count[v]` is the number of occurrences of $v$ in the window. The **distinct counter** is $|\{v : \text{count}[v] > 0\}|$ and the **over counter** is $|\{v : \text{count}[v] > 1\}|$.
:::

::: math lemma Lemma
Let $C$ be monotone under shrinkage. If the window $[l, r]$ violates $C$ and $[l+1, r]$ satisfies $C$, then no window ending at $r$ and starting at or before $l$ satisfies $C$.
:::

The lemma is the formal reason the left pointer never has to move backwards. The proof is in the correctness section.

::: math lemma Lemma
Adding or removing one element from a window changes the distinct counter by at most one and the over counter by at most one, and the change is determined by the count of the affected value before and after the update.
:::

## Algorithm derivation

The state is the window $(l, r)$ together with the maintained value: a running sum, a frequency map, and the derived counters.

**The fixed-size window.** The window always holds exactly $k$ elements. The update rule is: subtract $a_{l}$ from the sum, add $a_{r+1}$, advance both ends.

::: math invariant Invariant
After the window has been moved to $[l, r]$, the maintained sum equals $\sum_{k=l}^{r} a_k$, and the window holds exactly $k$ elements.
:::

**The variable-size window.** The right end advances by one at every step. The left end advances while the condition is violated.

::: math invariant Invariant
After the inner loop for a right end $r$ finishes, the window $[l, r]$ satisfies the condition, and every window ending at $r$ that starts before $l$ violates it.
:::

**The frequency map.** The state is `count`, a map from values to their occurrences in the window, together with `distinct` and, when the condition needs it, `over`.

The update rule for an element $v$ entering the window is:

1. If `count[v] == 0`, increase `distinct` by one.
2. If `count[v] == 1`, increase `over` by one.
3. Increase `count[v]` by one.

The update rule for an element $v$ leaving the window is the mirror image:

1. Decrease `count[v]` by one.
2. If `count[v] == 0`, decrease `distinct` by one.
3. If `count[v] == 1`, decrease `over` by one.

Each rule touches a constant number of counters, so each window update is $O(1)$ regardless of how many distinct values the window contains.

## Step-by-step execution

Take the string `abracadabra` and the question "the longest window with at most two distinct characters".

The frequency map and the counters start empty: `count` is empty, `distinct = 0`, `over = 0`, and the window is empty.

- **r = 0, 'a'.** The window is empty, so nothing leaves. `count['a']` is 0, so `distinct` becomes 1 and `count['a']` becomes 1. The window is `a`, with length 1. The condition holds.
- **r = 1, 'b'.** `count['b']` is 0, so `distinct` becomes 2 and `count['b']` becomes 1. The window is `ab`, with length 2. The condition holds, and the best length is 2.
- **r = 2, 'r'.** `count['r']` is 0, so `distinct` becomes 3. The window is `abr`, and $3 > 2$, so the condition fails. The left end moves: 'a' leaves, `count['a']` goes from 1 to 0, and `distinct` drops to 2. The window is `br`, which satisfies the condition. The best length is still 2.
- **r = 3, 'a'.** `count['a']` is 0, so `distinct` becomes 3. The window is `bra`, which fails. The left end moves: 'b' leaves, `count['b']` goes from 1 to 0, `distinct` drops to 2. The window is `ra`, length 2. The best is still 2.
- **r = 4, 'c'.** `count['c']` is 0, so `distinct` becomes 3. The window is `rac`, which fails. The left end moves: 'r' leaves, `count['r']` goes from 1 to 0, `distinct` drops to 2. The window is `ac`, length 2. The best is still 2.
- **r = 5, 'a'.** `count['a']` is 1, so `over` becomes 1 and `count['a']` becomes 2. The `distinct` counter is unchanged, because the count of 'a' did not cross zero. The window is `aca`, and `distinct` is 2, so the condition holds. The length is 3, and the best becomes 3.
- **r = 6, 'd'.** `count['d']` is 0, so `distinct` becomes 3. The window is `acad`, which fails. The left end moves: 'a' leaves, `count['a']` goes from 2 to 1, so `over` drops to 0. `distinct` is unchanged. The window is `cad`, with `distinct = 2` and length 3. The best stays 3.
- **r = 7, 'a'.** `count['a']` is 1, so `over` becomes 1 and `count['a']` becomes 2. The window is `cada`, `distinct` is 2, the condition holds, and the length is 4. The best becomes 4.
- **r = 8, 'b'.** `count['b']` is 0, so `distinct` becomes 3. The window `cadab` fails. The left end moves: 'c' leaves, `count['c']` goes from 1 to 0, `distinct` drops to 2. The window is `adab`, length 4. The best stays 4.
- **r = 9, 'r'.** `count['r']` is 0, so `distinct` becomes 3. The window `adabr` fails. The left end moves: 'a' leaves, `count['a']` goes from 2 to 1, so `over` drops to 0. The window is `dabr`, length 4. The best stays 4.
- **r = 10, 'a'.** `count['a']` is 1, so `over` becomes 1. The window is `dabra`, `distinct` is 2, and the length is 5. The best becomes 5.

The answer is 5, and the window is `dabra`. The whole scan took 11 right-pointer steps and 6 left-pointer steps, with $O(1)$ work per step.

## Correctness proof

::: math theorem Theorem
Let $C$ be a window condition that is monotone under shrinkage. The variable-size sliding window finds the longest window satisfying $C$.
:::

::: math proof Proof
Fix a right end $r$. We show that the window $[l, r]$ produced for this $r$ is the longest valid window ending at $r$.

When the inner loop stops, the window satisfies $C$, because the loop only advances the left end while the condition fails.

Suppose the left end advanced during this iteration, and let $l'$ be the index it advanced from. The window $[l', r]$ violated $C$. By the monotonicity under shrinkage, every window $[l'', r]$ with $l'' \le l'$ also violates $C$, since it is a growth of $[l', r]$.

Now suppose the left end did not advance during this iteration. Then it was left where an earlier iteration left it, and the same argument applied at that earlier iteration shows that every window starting before $l$ and ending at the earlier right end violated $C$. Monotonicity under growth then implies that every window starting before $l$ and ending at $r \ge$ the earlier right end also violates $C$.

In both cases, every window ending at $r$ that starts before $l$ is invalid, so $[l, r]$ is the longest valid window ending at $r$. Taking the maximum of the lengths over all $r$ gives the longest valid window in the array. $\square$
:::

::: math theorem Theorem
The frequency map and the derived counters describe the window exactly at every point of the scan.
:::

::: math proof Proof
The claim is by induction on the number of updates.

Initially the window is empty, every count is zero, and `distinct` and `over` are both zero, which is correct.

Suppose the state is correct before an update that adds a value $v$. The count of $v$ increases by one, and no other count changes, so the frequency map is still correct. The distinct counter changes if and only if the count of $v$ crosses zero, which happens exactly when it was 0 before the update, and the rule increments it in exactly that case. The over counter changes if and only if the count of $v$ crosses one, which happens exactly when it was 1 before the update, and the rule increments it in exactly that case.

The argument for a removal is the same with the inequalities reversed. By induction, the state is correct at every point of the scan. $\square$
:::

::: math proof Proof
The fixed-size window maintains the correct sum.
:::

::: math proof Proof
The sum of the window $[l, r]$ is $\sum_{k=l}^{r} a_k$. Moving the window to $[l+1, r+1]$ removes $a_l$ and adds $a_{r+1}$, so the update $\text{sum} \gets \text{sum} - a_l + a_{r+1}$ preserves the equality. The window also continues to hold exactly $k$ elements, because one leaves and one enters. $\square$
:::

## Complexity analysis

**Time: $O(n)$.** The right end advances $n$ times. The left end advances at most $n$ times, because it never moves backwards and it never passes the right end. Each step does $O(1)$ work: one addition or subtraction for a sum, and a constant number of counter updates for a frequency map.

**Auxiliary space: $O(1)$** for a fixed-size window over a sum, and **$O(\sigma)$** for a window over a frequency map, where $\sigma$ is the number of distinct values in the data. When the values are small integers the map is an array of counters of size $\sigma$; when they are characters it is an array of 26 or 128 counters; when they are arbitrary, a hash map costs $O(1)$ expected time per update instead of $O(1)$ worst case.

::: math complexity Complexity
Sliding window: $O(n)$ time. The space is $O(1)$ for a running sum and $O(\sigma)$ for a frequency map over $\sigma$ distinct values.
:::

The bound on the left pointer is what makes the scan linear rather than quadratic, and it holds only because the left pointer never retreats. The moment a solution moves the left pointer backwards, the argument that the total work is $O(n)$ no longer applies.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The longest window of exactly $k$ elements with the best sum | Fixed-size window with a running sum |
| The longest window with at most $d$ distinct values | Variable window with a frequency map and a distinct counter |
| The shortest window containing all the required values | Variable window, shrinking as much as possible |
| The longest window in which no value appears twice | Frequency map with an over counter |
| The longest window with a bounded sum, values non-negative | Variable window with a running sum |
| The longest window with a bounded sum, values may be negative | Prefix sums and a monotone stack |
| The longest window with a sum exactly $K$ | Prefix sums and a hash map |
| A count of the windows satisfying a condition | The same scan, counting instead of taking the maximum |
| The window over a graph, not an array | The same idea with a queue and a per-vertex counter |

The rows about negative values are the ones that catch people, and they are the reason the monotonicity assumption is stated in the frontmatter of this article rather than left implicit.

## Recursion decision

The window scan is a loop, and the loop is the right form in every language. There is no recursive formulation of a sliding window that improves on it, because the window's state is the whole story and the state does not fit on a call stack any better.

The recursion question belongs to the alternatives. A segment tree that answers the same questions about arbitrary ranges is written recursively with a depth of $O(\log n)$, which is safe in every language. A formulation that recurses once per _element_, such as one that tries every possible left end for a given right end, has depth $O(n)$ and crashes on a large array.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | The loop; a recursive segment tree at depth $\log_2 n$ is also fine |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

::: math counterexample Counterexample
A log of $10^6$ entries scanned with a recursive formulation that tries every possible left end for a given right end makes $10^6$ nested calls. In C++ on Linux, with an 8 MB stack and a frame of roughly 64 bytes, the stack is exhausted after about $130\,000$ frames, so the program dies with a segmentation fault before it has scanned $13\%$ of the log. The loop scans the same log in $10^6$ steps with a constant-size state. The input is legal and the answer is well defined; only the choice of implementation is wrong.
:::

The rule of thumb is simple: if the recursion depth would be proportional to the length of the array, write the loop.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Shrinking as much as possible when the problem wants the longest window | A correct-looking answer that is too small | Decide which of the two rules the question wants |
| Shrinking only as far as necessary when the problem wants the shortest window | A correct-looking answer that is too large | The same decision, in the other direction |
| Forgetting to remove the element that left the window | The maintained state describes a window that is too large | Update the state on every move of either end |
| Testing the condition before the shrink rather than after | The recorded window may be invalid | Test after the inner loop finishes |
| Using a running sum on values that may be negative | The window is not the longest valid one | Require non-negative values, or use prefix sums |
| Rebuilding the counts from scratch for each window | The scan becomes $O(n^2)$ | Maintain the counts as the window moves |
| Not counting the window that ends at the last element | The answer is short by one | Record the length after every right-end step |
| Assuming a window of distinct values is the same as a window of distinct characters | The alphabet size decides whether the map is an array or a hash map | Size the map by the data |

### Why this fails: the shrink rule that is one word off

The mistake that survives review most often is not a bug in the maintenance. It is the difference between the two shrink rules, which look identical in the code and mean opposite things.

For the **longest** window, the left end must move only as far as it has to: stop as soon as the condition holds. For the **shortest** window, the left end must move as far as it can: keep shrinking while the condition still holds. Writing one when the other is wanted gives an answer that looks entirely reasonable.

The smallest counterexample is the string `aab` with the condition "the window contains at least two distinct characters". The longest such window is `aab`, of length 3. The shortest is `ab`, of length 2. The two rules disagree, and the input has only three characters.

- With the **longest** rule, the left end stops as soon as the condition holds. At the third character the window is `aab` and it holds, so the answer is 3.
- With the **shortest** rule, the left end keeps moving while the condition holds. At the third character the window `aab` holds, so 'a' is removed; the window `ab` still holds, so 'a' is removed again; the window `b` does not hold, so the left end stops. The answer is 2.

Both programs are correct implementations of the rule they encode, and both run in linear time. Only one of them answers the question that was asked.

There is a second failure with the same root, and it is the one that produces answers that are too large. The "shortest window" rule requires the condition to be monotone under shrinkage: the window must keep satisfying the condition as it shrinks. The condition "contains at least two distinct characters" is monotone under shrinkage only until the window becomes too small, which is exactly why the shrink loop has to check the condition after each removal rather than removing a fixed number of elements. A version that removes elements in batches of one and only checks the condition at the end of the batch can remove a character that was needed.

A third failure, which is about the data rather than the rule, is the negative value. The window scan assumes that a smaller window is a more forgiving one. That is true when the values are non-negative, because removing an element never increases the sum, and it is false when the values may be negative, because removing a negative element increases the sum. The array $[-1, 5, -2]$ with the limit $K = 3$ is the smallest case where it shows: the whole array sums to 2, so the longest window with a sum at most 3 has length 3, and the scan returns 1, because the first shrink removed the $-1$ and the window could never get its length back. The [two pointers](/algorithms/searching/two-pointers) article works through that counterexample in full.

## Variants and extensions

- **The frequency map over a fixed alphabet.** When the values are characters, the map is an array of 26 or 128 counters, and the update is a single increment with no hashing at all. This is the difference between a hash map and an array in a window problem, and it is often the difference between passing and timing out.
- **The window over a queue or a stream.** The right end is the arrival of a new element and the left end is the removal of the oldest. The state is the same, and the two pointers become the two ends of a deque.
- **The window with two limits.** When the condition is "at most $d$ distinct values and at most $m$ occurrences of any one value", both counters are needed, and both are maintained in $O(1)$ per update.
- **The window over a graph.** A breadth-first search with a limit on how many times a vertex may be visited uses a per-vertex counter, and the frontier plays the role of the window.
- **The minimal window of a subsequence.** A variant of the shortest-window rule in which the window must contain a target sequence in order, and the left end is advanced by a separate matching pointer.
- **The counting version.** Instead of the best window, count the windows that satisfy the condition. The movement is identical and the answer is incremented instead of maximized, and the same care is needed about when the increment happens.
- **The window with a monotone predicate.** Replacing the sum by a monotone predicate over the window contents, such as "the window is a valid bracket sequence", keeps the technique, and the frequency map is replaced by a stack or a counter of unmatched openings.
- **The two-ended window.** When the condition depends on both ends rather than on the multiset of the contents, the window becomes a deque and the removal is from whichever end the condition needs.

## Contest strategy

Under contest pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write the condition down as a single sentence, and mark which parts of the window it talks about: the sum, the set of values, or the counts.
2. Decide the shrink rule before writing the loop: as little as possible for the longest window, as much as possible for the shortest.
3. Check the monotonicity. If the values may be negative and the condition is a sum, stop and use prefix sums.
4. Decide what the maintained state is, and write down how it changes when one element enters and when one leaves. If that is not $O(1)$, the algorithm will not be linear.
5. Test three shapes by hand: a window that never needs to shrink, a window that shrinks on every step, and a window that shrinks to empty.
6. Record the answer after the inner loop, not before it, and remember to consider the window that ends at the last element.

## Worked problems

### Problem 1: the longest run of quiet days

**Restatement.** A log of $n$ entries names a user for each request. Find the longest contiguous stretch in which no user appears more than three times. Constraints: $1 \le n \le 200\,000$, users are drawn from $26$ letters.

**Naive baseline.** Enumerate every window and count the users in it, at a cost of $O(n^3)$ with a naive count and $O(n^2)$ with a hash map rebuilt per window.

**Insight.** The counts of the users in the window are maintained as the window moves, so the condition is tested in constant time.

**Derivation.** Keep `count[26]`, a `distinct` counter, and an `over` counter for the values whose count exceeds one. The condition is `over == 0`. Advance the right end, and while the condition fails, remove the leftmost entry.

**Correctness.** The theorem for the variable-size window shows that the window produced for each right end is the longest valid one, and the theorem on the counters shows that the condition is evaluated correctly.

**Complexity.** $O(n)$ time and $O(26)$ space, which is $O(1)$.

**Common wrong approach.** Using `distinct` as the condition. The problem limits the number of occurrences of a single user, not the number of users, and the two conditions give different answers on a log like `aaaa`.

### Problem 2: the best window of exactly $k$ days

**Restatement.** Given $n$ daily revenues and a window size $k$, find the maximum total revenue of any $k$ consecutive days. Constraints: $1 \le n \le 200\,000$, revenues may be negative.

**Naive baseline.** Sum each of the $n - k + 1$ windows from scratch, at a cost of $O(nk)$.

**Insight.** Consecutive windows share $k - 1$ elements, so the sum of the next window is the sum of the previous one minus the value that left plus the value that arrived.

**Derivation.** Compute the sum of the first $k$ entries, record it, and then slide: subtract $a_{l}$, add $a_{l + k}$, and record the new sum.

**Correctness.** The proof on the fixed-size window shows that the maintained sum is the sum of the current window at every step, and every window of size $k$ is visited exactly once.

**Complexity.** $O(n)$ time and $O(1)$ space.

**Common wrong approach.** Forgetting to subtract the departing value. The answer is then the sum of the last $k$ entries plus everything that scrolled in, which is larger than any real window.

### Problem 3: the smallest window holding every required value

**Restatement.** Given a string $s$ and a set of required characters, find the shortest contiguous substring of $s$ that contains every required character at least once. Constraints: $|s| \le 200\,000$, the alphabet is lowercase English.

**Naive baseline.** Try every substring and test it, at a cost of $O(n^2)$.

**Insight.** The window must shrink as far as it can while it still contains everything, which is the opposite rule from the longest-window problem.

**Derivation.** Keep `count[26]` and a `missing` counter initialized to the number of required characters not yet seen. Advance the right end, and while `missing` is zero, record the window length and then remove the leftmost character.

**Correctness.** When the inner loop removes a character, the window still contains all the required ones at that moment, so the length recorded just before the removal is the length of a valid window. Every valid window is considered, because the left end only advances past a start once a valid window with that start has been recorded.

**Complexity.** $O(n)$ time and $O(26)$ space.

**Common wrong approach.** Using the longest-window shrink rule, which leaves the left end as early as possible and returns a window that is too long. On the string `aab` with the requirement of two distinct characters, the longest rule returns 3 and the shortest rule returns 2.

## Practice progression

1. **Recognition.** Given a statement, decide whether a sliding window applies. Look for "contiguous", a monotone condition, and a state that can be updated in constant time.
2. **Direct application.** Implement the fixed-size window over a sum and the variable-size window over a non-negative array, and check both against a brute-force enumeration.
3. **Adaptation.** Implement the frequency map with a distinct counter, then with an over counter, and then with both. Verify the counters against a recount after every update.
4. **Combination.** Combine the window with a hash map to count the windows that satisfy the condition, and with a two-pointer scan to find the window that satisfies it exactly once.
5. **Challenge.** Solve a problem whose values may be negative, discover that the window scan fails, and solve it again with prefix sums and a monotone stack.
6. **Transfer.** Recognize the window in a problem about a different data structure: the longest path with at most $k$ distinct edge weights in a graph, or the longest run in a stream of bytes.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the frequency map hold, and what do the distinct and over counters hold? (Formal model)
2. Why does each window update cost $O(1)$ even when the window contains many distinct values? (Key insight)
3. What is the difference between the shrink rule for the longest window and the one for the shortest window? (Common mistakes)
4. Give the smallest string on which the two shrink rules give different answers. (Common mistakes)
5. State the monotonicity the variable-size window needs, and give a case where it fails. (Formal model)
6. Why can the left pointer never move backwards? (Correctness proof)
7. What is the time bound, and which two facts establish it? (Complexity analysis)
8. When is a running sum enough, and when is a frequency map needed? (Algorithm selection)
9. Why does a fixed-size window need no frequency map? (Key insight)
10. What happens to the answer if the values may be negative, and which technique replaces the window? (Algorithm selection)
11. At what point in the inner loop should the length be recorded, and why? (Algorithm derivation)
12. How does the window scan over a graph differ from the window scan over an array? (Variants and extensions)

## Further reading

- The two-pointer discipline that the window is built on is in [two pointers](/algorithms/searching/two-pointers).
- The running totals that let a window sum be tested in $O(1)$ on an array with negative values are in [prefix sums](/algorithms/arrays/prefix-sums).
- The structure that answers the same questions with updates in between is the [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The grid version of the same cumulative idea is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The binary search that finds a boundary in a monotone array, which is the one-pointer relative of this technique, is in [binary search](/algorithms/searching/binary-search).
- The greedy technique that solves a scheduling problem by a single pass is in [interval scheduling](/algorithms/greedy/interval-scheduling).
