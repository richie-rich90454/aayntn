---
id: searching.sliding-window-variants
title: The sliding window variants with a state machine
summary: Run the window as a five-state machine that grows, checks, shrinks, and records, so that the longest, shortest, fixed-size, and counting variants differ only in their transition table.
division: [silver, gold]
subjects: [searching]
level: intermediate
importance: common-contest-technique
keywords:
    [
        sliding window,
        state machine,
        longest window,
        shortest window,
        fixed-size window,
        distinct characters,
        frequency map,
        two pointers,
    ]
prerequisites:
    required: [searching.sliding-window, foundations.complexity]
    recommended: [searching.two-pointers, searching.binary-search]
complexity:
    time: "O(n)"
    space: "O(1) for a fixed byte alphabet, O(sigma) for a hash map"
assumptions:
    - The window predicate is monotone in the direction the selected variant relies on.
    - The alphabet is small enough to index a frequency array, or the implementation uses a hash map.
implementations: searching.sliding-window-variants
reviewed: false
---

## At a glance

A sliding window is a contiguous range of an array together with a small summary of its contents. The range is moved by two pointers, and the summary is updated when an element enters or leaves. The technique is linear because each pointer crosses the array once, and it is correct because the summary is enough to decide whether the current window satisfies the problem's condition.

The same scan supports several different questions. The **fixed-size** variant asks for the best window of exactly $m$ elements. The **longest** variant asks for the largest window that satisfies a condition. The **shortest** variant asks for the smallest one. The **counting** variant asks how many windows satisfy it. These are usually taught as separate tricks with separate code, and that is where most of the bugs come from.

This article gives them one specification. The window is a machine with five states: **grow**, **check**, **shrink**, **record**, and **done**. Every variant uses the same state layout; the summary inside it is whatever the problem needs. The variants differ only in the guard on a transition and in what the record state does.

| Variant | Question | Transition out of the check state |
| --- | --- | --- |
| Fixed-size | The best window of exactly $m$ elements | Record when the size is $m$, then slide |
| Longest | The largest window satisfying the condition | Valid: record, then grow. Invalid: shrink |
| Shortest | The smallest window satisfying the condition | Valid: record, then shrink. Invalid: grow |
| Counting | The number of windows satisfying the condition | Same as longest, but record adds $r-l+1$ |

The canonical program for this topic is the longest variant with the condition "at most $k$ distinct characters". It reads a string and an integer $k$, and prints the length of the longest substring that contains no more than $k$ different characters. A frequency map holds the counts of the characters in the window, and one extra integer holds the number of characters with a positive count. The scan is $O(n)$.

The state machine is a specification, not an allocation. The reference implementations do not build an enum or a table. They are two pointers and a loop, because that is the smallest code that realizes the transitions. Naming the states is what makes the transition table visible, and the transition table is what separates the variants.

## Problem motivation

A message feed labels every post with a topic. An analyst wants the longest consecutive stretch of the feed that mentions at most $k$ different topics, because a stretch with too many topics is a sign that the feed changed audience rather than continuing one conversation.

The constraints are the ones that make the question worth asking:

- The feed has up to $n = 200\,000$ posts.
- Every post carries one lowercase letter as its topic, so the alphabet has at most $26$ symbols.
- The bound $k$ is between $0$ and $26$.

The naive answer tries every stretch and counts the topics in it. There are $\frac{n(n+1)}{2}$ stretches, and counting a stretch from scratch costs $O(n)$, so the triple loop is $O(n^3)$. Rebuilding a frequency map for every stretch lowers that to $O(n^2)$, which is still about $2 \ast 10^{10}$ steps at the largest size.

The linear answer keeps the frequency map of one window and moves it. The right end adds a topic label, which changes at most one count and at most one derived counter. The left end removes a label, with the same constant cost. The condition is tested by comparing the derived counter with $k$. Each post enters the window once and leaves at most once, so the whole scan is $O(n)$.

The difficulty is not the movement. It is keeping the summary correct at both ends and knowing which end may move in which situation. Those are exactly the two things the state machine makes explicit.

## Recognition patterns

The window is the right tool when all of the following hold.

- The answer concerns a **contiguous** range of the sequence. A subsequence is not a window.
- The condition is **monotone in the direction the variant uses**. The longest variant needs a window that stays valid when it shrinks. The shortest variant needs a window that stays valid when it grows.
- The summary can be **updated in constant time** when one element enters or leaves.

The phrases that signal it are "longest contiguous", "shortest stretch containing", "consecutive", "at most $k$ distinct", "no more than $m$ occurrences", and "at most $k$ replacements". The phrase that rules it out is "subsequence". So does "the elements in any order", because then the answer is a subset rather than a range.

The constraint values decide the rest.

| Constraint | What it decides |
| --- | --- |
| The window has a fixed size $m$ | The fixed-size variant, with no predicate at all |
| The window size varies and the question asks for the longest | The longest variant, shrinking only while invalid |
| The question asks for the shortest valid window | The shortest variant, shrinking while valid |
| The condition is about distinct values | A frequency map with a distinct counter |
| The condition is about counts above a limit | A frequency map with an over-limit counter |
| The condition is a sum and the values are non-negative | The longest variant with a running sum |
| The condition is a sum and values may be negative | Not a window; use prefix sums |
| The question counts valid windows rather than finding one | The counting variant, adding $r-l+1$ on record |
| The alphabet is unbounded | A hash map, with expected $O(1)$ updates |
| $k$ is at least the number of distinct values in the whole input | The whole sequence is the answer |
| $k = 0$ | The empty window is the only valid one |

The last row is the edge the canonical code must handle without a special case. The negative-value row is the premise that forbids the longest variant: removing a negative number can increase a sum, so an invalid window can become valid by shrinking.

## Naive approach

The baseline enumerates every window and tests the condition from scratch.

```python
best = 0
for left in range(n):
    for right in range(left, n):
        if distinct(s[left:right + 1]) <= k:
            best = max(best, right - left + 1)
```

This is $O(n^2)$ windows and $O(n)$ per test, so $O(n^3)$ in the worst case. Even with a frequency map rebuilt per window it is $O(n^2)$, which is too slow at $n = 200\,000$.

A better baseline is binary search on the answer length. The predicate "there is a window of length $m$ with at most $k$ distinct characters" is monotone in $m$ for most window problems, and checking one length costs $O(n)$ with a fixed-size window, so the total is $O(n\log n)$. That baseline is correct and sometimes easier to trust, but it pays a logarithmic factor and it needs the same frequency map anyway.

| Approach | Time | Space | Comment |
| --- | --- | --- | --- |
| Enumerate and recount | $O(n^3)$ | $O(1)$ | The definition, and the oracle for small tests |
| Enumerate with an incremental map | $O(n^2)$ | $O(\sigma)$ | Better, still quadratic |
| Binary search on the length | $O(n\log n)$ | $O(\sigma)$ | Correct when the length predicate is monotone |
| The window state machine | $O(n)$ | $O(\sigma)$ | One pass, and the target of this article |

## Key insight

Consecutive windows overlap, and the overlap is everything that matters. Window $[l,r]$ and window $[l+1,r+1]$ share $r-l$ elements. Only the element that leaves and the element that arrives need to be processed, so if the summary can be updated from those two events in constant time, a whole scan costs $O(n)$.

For the distinct-character problem the summary is a frequency map plus one derived counter. Let `count[v]` be the number of occurrences of $v$ in the window, and let `distinct` be the number of values with `count[v] > 0`.

When a value $v$ enters:

1. If `count[v] == 0`, increase `distinct` by one.
2. Increase `count[v]` by one.

When a value $v$ leaves:

1. Decrease `count[v]` by one.
2. If `count[v] == 0`, decrease `distinct` by one.

The order of the test and the update is load-bearing. The entry test asks whether the count was zero **before** the increment, and the exit test asks whether it is zero **after** the decrement. Both tests detect the same event, a count crossing the boundary between zero and one, and that event is the only thing that changes the distinct counter.

The second insight is that the movement is independent of the summary. The summary says what is in the window. The movement says which end changes next. A variant is a choice of movement rule over the same summary, which is why the state machine table is the right way to describe the family.

The third insight is the asymmetry between the two extremes. The longest variant shrinks only while the condition is false, so it needs the condition to remain true when the window shrinks. The shortest variant shrinks while the condition is true, so it needs the condition to remain true when the window grows. These are opposite requirements, and a program that uses one rule for the other question is wrong even though both programs are linear.

## Visual intuition

The window is a pair of hands on a strip of characters. The right hand pushes a character in. The left hand pulls a character out. The summary sits between them.

```text
        l           r
s:  a   b   c   b   a
    0   1   2   3   4
    [-----------)
```

For the longest variant, the right hand always moves after a successful record. The left hand moves only when the window is invalid, and it keeps moving until the window is valid again.

```text
            l       r
s:  a   b   c   b   a
    0   1   2   3   4
        [-----------)
```

For the shortest variant the hands trade jobs. The right hand moves when the window is invalid. The left hand moves while the window is valid, and it stops at the first invalid window. The last valid window it saw is the narrowest one it needs to keep; any window that starts earlier and ends later extends it, so it cannot be shorter.

The summary is a row of counters, one per value, plus one counter for the number of non-zero entries.

```text
value:     a   b   c   d
count:     2   0   1   1
distinct:  3
```

The `distinct` counter is 3 because three counts are positive. Adding a `c` raises it to 4, because the count of `c` crosses from 0 to 1. Adding an `a` does not change it, because the count of `a` was already positive.

The state diagram has one branch that decides the variant.

```text
             push                 valid
  GROW ---------------> CHECK ---------------> RECORD
    ^                      |                      |
    |                      | invalid              | longest: back to GROW
    |                      v                      | shortest: to SHRINK
    |                   SHRINK <------------------+
    |                      |
    +----------------------+
             pop, then check
```

The diagram is the whole article. The state is the same in every box. The variants differ in which arrow leaves `CHECK` and which arrow leaves `RECORD`.

## Formal model

Let $s = s_0 s_1 \ldots s_{n-1}$ be a string over an alphabet $\Sigma$. A window is a pair $(l,r)$ with $0 \le l \le r < n$, and the empty window is written with $l = r+1$.

::: math definition Definition
The frequency map of a window $(l,r)$ is the function `count` from $\Sigma$ to the non-negative integers such that `count[v]` is the number of indices $i \in [l,r]$ with $s_i = v$. The distinct count is $D(l,r) = |\{v \in \Sigma : \text{count}[v] > 0\}|$.
:::

A predicate $P(l,r)$ is a condition on the window. For the canonical program, $P(l,r)$ is $D(l,r) \le k$.

::: math definition Definition
A predicate is **valid under shrinkage** if every subwindow of a valid window is valid. It is **valid under growth** if every superwindow of a valid window is valid. The longest variant requires the first property; the shortest variant requires the second.
:::

The canonical predicate is valid under shrinkage because removing an element cannot create a new distinct value. It is not valid under growth, because adding an element can create one. A covering predicate, such as "the window contains every required character", is valid under growth and not under shrinkage.

::: math definition Definition
For a fixed right end $r$, let $L(r)$ be the smallest $l \in [0,r+1]$ such that $P(l,r)$ holds, or $r+1$ when no non-empty window works.
:::

For the canonical predicate, the empty window always satisfies $D = 0 \le k$ when $k \ge 0$, so $L(r)$ always exists and is at most $r+1$. The longest valid window ending at $r$ has length $r - L(r) + 1$, which is zero when only the empty window works.

When $P$ is valid under growth, the valid starts for a fixed right end form a prefix. The shortest machine does not store the largest valid start, because it does not need it: once a valid window beginning at a start has been recorded, every future window beginning there or earlier is at least as long, so the start can be discarded.

::: math lemma Lemma
For the canonical predicate, $L(r)$ is non-decreasing in $r$.
:::

The proof is in the correctness section. The lemma is the formal reason the left pointer never has to move backwards. If a start was too far left to be valid at $r$, adding more characters at the right cannot make it valid at a later right end.

The machine state is a configuration $(l,r,\text{count},D,\text{answer})$. The transitions are:

- **Push:** if $r+1 < n$, set $r \gets r+1$, increment `count[s[r]]`, and increment $D$ exactly when that count was zero.
- **Pop:** if $l \le r$, decrement `count[s[l]]`, decrement $D$ exactly when that count becomes zero, and set $l \gets l+1$.
- **Check:** evaluate $P(l,r)$.
- **Record:** update the answer from the current window.

A run starts at $(0,-1,\text{empty},0,0)$ and ends when a push is requested with $r = n-1$. Every transition is $O(1)$.

## Algorithm derivation

The machine has five named states. The table gives the guard, the action, and the next state for the longest and shortest variants.

| State | Guard | Action | Longest next | Shortest next |
| --- | --- | --- | --- | --- |
| Grow | $r+1 < n$ | Push $s_{r+1}$ | Check | Check |
| Grow | $r+1 = n$ | None | Done | Done |
| Check | $P(l,r)$ holds | None | Record | Record if $l \le r$, else Grow |
| Check | $P(l,r)$ fails and $l \le r$ | None | Shrink | Grow |
| Check | $P(l,r)$ fails and $l > r$ | None | Grow | Grow |
| Record | Always | Update the answer | Grow | Shrink |
| Shrink | $l \le r$ | Pop $s_l$ | Check | Check |
| Shrink | $l > r$ | None | Check | Check |

The fixed-size variant replaces the check with a size comparison. The counting variant replaces the record action with an addition.

**The longest variant.** The right end advances first, so the window may become invalid. The left end then advances while the window is invalid. Once it is valid, the window is the longest valid window ending at that right end, because the left end has moved as little as possible. The machine records the length and goes back to grow.

::: math invariant Invariant
With $L(-1)=0$, at the start of a grow transition for right end $r$, the left end is $L(r-1)$ and the summary describes the window $[L(r-1),r-1]$. After the push and the shrink loop, the left end is $L(r)$ and the summary describes $[L(r),r]$.
:::

**The shortest variant.** The right end advances, and the window is valid by the growth property if it was valid before. The left end then advances while the window remains valid, and the machine records the length after every successful check and before every pop. When the window becomes invalid after removing the start $l-1$, that start and every earlier one are no longer useful: a future window beginning at $l-1$ or earlier extends the valid window that was just recorded, so it cannot be shorter. The machine then grows again.

::: math invariant Invariant
After the shrink loop for right end $r$, no valid window that starts before the left end and ends at or after $r$ can be shorter than a window already recorded.
:::

**The fixed-size variant.** There is no predicate. Push one element, and once the window holds $m$ elements, pop the oldest before recording. The state is a queue of length $m$, and the answer is updated at every full window.

**The counting variant.** It uses the longest transition table, but the record action adds $r-l+1$ instead of taking a maximum. At a fixed $r$, every start from $L(r)$ to $r$ is valid, so there are $r-L(r)+1$ valid windows ending at $r$.

The canonical program is the longest variant written as a loop.

```python
def longest_at_most_k(s, k):
    k = max(k, 0)
    count = {}
    left = 0
    distinct = 0
    best = 0

    for right, ch in enumerate(s):
        if count.get(ch, 0) == 0:
            distinct += 1
        count[ch] = count.get(ch, 0) + 1

        while distinct > k:
            out = s[left]
            count[out] -= 1
            if count[out] == 0:
                distinct -= 1
            left += 1

        best = max(best, right - left + 1)

    return best
```

The `while` is the shrink state. The length assignment after it is the record state. The loop over `right` is the grow state. The `if` inside the entry update is the only place the distinct counter rises, and the `if` inside the exit update is the only place it falls.

When $k = 0$, the push makes the window invalid, the shrink loop empties it, and the record writes a length of zero. That is the correct answer, because the only substring with no distinct characters is the empty one. When $k$ is negative, the same reasoning applies after clamping it to zero.

The canonical predicate is true on the empty window, so the machine may record zero and the program's initial `best = 0` is safe. A predicate that is false on the empty window, such as "at least two distinct characters", must initialize the answer to a sentinel and report that no window exists when the sentinel survives. The transitions are the same; only the meaning of the initial answer changes.

## Step-by-step execution

Take $s = \text{abcba}$ and $k = 2$. The machine starts with an empty window, an empty frequency map, and `distinct = 0`.

| Step | Right | Window after push | Distinct | State | Action              | Best |
| ---- | ----- | ----------------- | -------- | ----- | ------------------- | ---- |
| 0    | -     | empty             | 0        | Grow  | Ready               | 0    |
| 1    | `a`   | `a`               | 1        | Check | Valid, record 1     | 1    |
| 2    | `b`   | `ab`              | 2        | Check | Valid, record 2     | 2    |
| 3    | `c`   | `abc`             | 3        | Check | Invalid, shrink `a` | 2    |
| 4    | `c`   | `bc`              | 2        | Check | Valid, record 2     | 2    |
| 5    | `b`   | `bcb`             | 2        | Check | Valid, record 3     | 3    |
| 6    | `a`   | `bcba`            | 3        | Check | Invalid, shrink `b` | 3    |
| 7    | `a`   | `cba`             | 2        | Check | Valid, record 3     | 3    |

The answer is 3. The window `bcb` and the window `cba` are both longest, and the machine records whichever one it reaches last.

The scan made five pushes and two pops. The pop at step 3 removed `a` because the window `abc` had three distinct characters and the bound was two. The pop at step 6 removed `b` for the same reason. Every other step was a push followed by a record.

A trace for the edge case $s = \text{aaaa}$ and $k = 0$ is shorter. Each push makes `distinct = 1`, which is greater than zero, so the shrink loop immediately removes the character and leaves the empty window. The record writes zero every time, and the answer is zero.

## Correctness proof

::: math theorem Theorem
The frequency map and the distinct counter describe the window exactly after every push and every pop.
:::

::: math proof Proof
The claim is by induction on the number of transitions.

Initially the window is empty, every count is zero, and `distinct = 0`, which is correct.

Suppose the state is correct before a push of value $v$. The count of $v$ increases by one and no other count changes, so the frequency map remains correct. The distinct count changes exactly when the count of $v$ crosses from zero to one, because that is the only moment at which a value with a positive count appears. The push rule tests the count before the increment, so it increments `distinct` in exactly that case.

Suppose the state is correct before a pop of value $v$. The count of $v$ decreases by one and no other count changes. The distinct count changes exactly when the count of $v$ crosses from one to zero, because that is the only moment at which a value with a positive count disappears. The pop rule decrements the count first and tests it afterward, so it decrements `distinct` in exactly that case.

Both rules leave every unaffected count and the counter unchanged, so the state remains correct. By induction it is correct after every transition. $\square$
:::

::: math lemma Lemma
For the canonical predicate, $L(r)$ is non-decreasing in $r$.
:::

::: math proof Proof
Suppose $l < L(r)$. Then the window $[l,r]$ is invalid, so $D(l,r) > k$. The window $[l,r+1]$ contains every character of $[l,r]$, so its distinct count is at least $D(l,r)$, which is greater than $k$. Therefore $[l,r+1]$ is also invalid. Since every start before $L(r)$ is invalid at $r+1$, the smallest valid start at $r+1$ is at least $L(r)$. Hence $L(r+1) \ge L(r)$. $\square$
:::

::: math theorem Theorem
For the canonical predicate, the longest variant returns the maximum length of a valid window, which may be zero.
:::

::: math proof Proof
Fix a right end $r$. We show that after the shrink loop for $r$, the left end is $L(r)$ and the recorded length is the longest valid window ending at $r$.

Before the push, the left end is $L(r-1)$ by the invariant. By the lemma, $L(r-1) \le L(r)$, so the window after the push starts at or before the first valid start for $r$. If the window is invalid, the shrink loop removes characters one at a time. Every removal increases the left end by one, and the distinct count never increases, so the loop reaches a valid window. It stops at the first valid left end, which is $L(r)$ by definition. If the window is already valid, the loop does not run. The left end is $L(r-1)$, and the lemma gives $L(r-1) \le L(r)$, while the validity of $[L(r-1),r]$ gives $L(r) \le L(r-1)$. Hence the left end is $L(r)$.

The recorded length is $r - L(r) + 1$. Every valid window ending at $r$ has a start at least $L(r)$, so its length is at most the recorded length. The recorded window is itself valid, so it is a longest valid window ending at $r$.

Every valid window ends at some right end, and the scan visits every right end. Taking the maximum of the recorded lengths therefore gives the maximum over all valid windows. $\square$
:::

::: math theorem Theorem
The shortest variant returns the minimum length of a non-empty valid window, when one exists.
:::

::: math proof Proof
Let $[a,b]$ be a valid window of minimum length, if one exists. We show that the machine records a window of that length.

At the moment the scan reaches $b$, the left end $l$ is at most $a$. Suppose $l > a$. Then $l$ advanced past $a$ at some earlier right end $r_0 \le b$. The advance happened only after the machine had recorded the valid window $[a,r_0]$, because $a$ was the start being removed. Its length $r_0-a+1$ is at most $b-a+1$, so by minimality it equals the optimal length, and the optimum was recorded.

If $l \le a$, the window $[l,b]$ is a superwindow of $[a,b]$ and is valid under growth. The machine records it and then shrinks. Every window $[l',b]$ with $l \le l' \le a$ is also a superwindow of the optimal window, so all of them are valid; the shrink loop therefore reaches $a$ and records $[a,b]$ before it can stop.

Every recorded window is valid, so the minimum recorded length is at least the optimal length. The optimal length is recorded, so the two are equal. If no valid window exists, no record happens. $\square$
:::

::: math theorem Theorem
The counting variant returns the number of valid windows.
:::

::: math proof Proof
At a fixed right end $r$, the longest variant leaves the left end at $L(r)$. The valid starts are exactly $L(r), L(r)+1, \ldots, r$, because a window that starts later is a shrinkage of a valid window and the canonical predicate is valid under shrinkage. There are $r - L(r) + 1$ of them, which is the amount the record state adds. Summing over every right end counts every valid window exactly once by its right end. $\square$
:::

## Complexity analysis

**Time: $O(n)$.** The grow state pushes each of the $n$ characters exactly once. The shrink state pops each character at most once, because the left pointer never moves backwards and never passes the right pointer. Each transition does a constant number of operations: one array increment or decrement, two comparisons, and one length update. The total is at most $2n$ pushes and pops, so the scan is linear.

**Auxiliary space: $O(\sigma)$** for a frequency map over $\sigma$ distinct values. When the alphabet is a byte, the map is an array of 256 counters, which is $O(1)$. When the alphabet is unbounded, a hash map uses $O(\sigma)$ entries and expected $O(1)$ time per update. The input string itself is $O(n)$, but it is input rather than auxiliary space.

::: math complexity Complexity
The window scan of every variant runs in $O(n)$ time. The space is $O(1)$ for the canonical frequency map over a fixed alphabet and $O(\sigma)$ for a hash map over $\sigma$ distinct values; a summary such as the two monotonic deques of the range variant needs $O(n)$ space.
:::

The binary-search baseline is $O(n\log n)$ time and the same space. The state machine removes the logarithm by reusing the window between checks instead of rebuilding it. The quadratic baseline is $O(n^2)$ time because it reuses nothing.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The longest window with at most $k$ distinct values | The longest variant with a distinct counter |
| The longest window with at most $k$ replacements | The longest variant with a counter of bad positions |
| The longest window with a sum at most $T$, values non-negative | The longest variant with a running sum |
| The shortest window containing every required value | The shortest variant with a missing counter |
| The shortest window whose value range is at least $D$ | The shortest variant with two monotonic deques |
| The best window of exactly $m$ elements | The fixed-size variant |
| The number of windows satisfying the condition | The counting variant, adding $r-l+1$ on record |
| The longest window with a sum at most $T$, values may be negative | Prefix sums and a monotone structure, not a window |
| The number of windows with an exact sum | Prefix sums and a hash map |
| $k$ is at least the number of distinct values in the input | The whole input is the answer |
| $k = 0$ | The empty window, with length zero |
| The alphabet is large or unknown | A hash map instead of an array |

The negative-value row is the one that catches people. A window is a good summary only when removing an element cannot repair a violation. For a sum of non-negative values, removal never increases the sum, so the longest rule works. For a sum that may be negative, removal can increase the sum, and the left pointer can pass a start that would have become valid later. The prefix-sum technique in [prefix sums](/algorithms/arrays/prefix-sums) replaces the window there.

The shortest row with the deques is the same state machine with a different summary. The predicate is the difference between the maximum and minimum values in the window, and two monotonic deques maintain those extremes in constant amortized time. The transition table is unchanged.

## Reference implementations

The manifest lists six programs, one per language, all with the same contract.

| Language   | File                    | Input                                             |
| ---------- | ----------------------- | ------------------------------------------------- |
| C          | `c/program.c`           | The string and $k$ as whitespace-delimited tokens |
| C++17      | `cpp17/program.cpp`     | The same                                          |
| Java       | `java/Main.java`        | The string and $k$, on one line or two            |
| Python     | `python/program.py`     | The same                                          |
| Pascal     | `pascal/program.pas`    | The string on one line, then $k$                  |
| JavaScript | `javascript/program.js` | The same                                          |

The contract is: the first token is the string $s$, and the second token is the integer $k$. The string contains lowercase English letters and no whitespace. The output is one integer followed by a newline, the length of the longest substring with at most $k$ distinct characters.

| Input                | Output | Reason                                           |
| -------------------- | ------ | ------------------------------------------------ |
| `abcba`, $k=2$       | `3`    | `bcb` and `cba` are both longest                 |
| `aabacbebebe`, $k=3$ | `7`    | `cbebebe` is longest                             |
| `aaaa`, $k=0$        | `0`    | Only the empty window has no distinct characters |
| `z`, $k=1$           | `1`    | The whole string is valid                        |
| no input             | `0`    | The program has nothing to scan                  |

The C, C++, Java, Pascal, and JavaScript programs store a frequency array of 256 counters and one distinct count; the Python version uses a dictionary with the same distinct count. The string is buffered, so the input is $O(n)$ memory, while the window state is $O(1)$ auxiliary space for a byte alphabet and $O(\sigma)$ for the Python dictionary. The C, C++, Java, and Python versions use the language's ordinary integer type for the length; the length is at most $200\,000$, so it fits comfortably. The Pascal version uses `LongInt` for the counters and the length, reads the string with one `ReadLn`, reads $k$ with one `Read`, and uses `SysUtils`. It compiles under pas2js and avoids `IOResult` and 128-bit integers. The JavaScript and Pascal listings are educational references, not USACO submission languages, and their headers say so.

The programs treat a negative $k$ as zero. They print zero when the string or $k$ is missing. They do not assume that the string is non-empty, so the empty-input case is handled by the same first read.

## Recursion decision

The window scan is a loop, and the loop is the right form in every language. The state is two indices, one counter, and one array; a call frame holds none of it better than a local variable does. There is no subproblem to memoize and no divide step.

The recursion question belongs to the alternatives. A segment tree that answers the same question over arbitrary ranges is written recursively with a depth of $O(\log n)$, which is safe everywhere. A formulation that recurses once per character, trying every possible left end for one right end, has depth $O(n)$ and crashes on a large string.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | The loop; a segment tree at depth $\log_2 n$ is also fine |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

::: math counterexample Counterexample
A string of $10^6$ characters scanned by a recursive function that handles one left end per call makes $10^6$ nested calls. In C++ on Linux, with an 8 MB stack and a frame of roughly 64 bytes, the stack is exhausted after about $130\,000$ frames, so the program dies before it has scanned $13\%$ of the string. The loop scans the same string in $10^6$ pushes with a constant-size state. The input is legal and the answer is well defined; only the implementation choice is wrong.
:::

The rule is simple: if the recursion depth would be proportional to the length of the input, write the loop.

## Implementation walkthrough

The reference program does not allocate an enum for the five states. The states are the shape of the loop, and naming them is a reasoning device. The whole scan is four statements.

```cpp
int left = 0;
int distinct = 0;
int best = 0;
std::array<int, 256> count{};

for (int right = 0; right < static_cast<int>(s.size()); ++right) {
    const unsigned char in = static_cast<unsigned char>(s[right]);
    if (count[in] == 0) {
        ++distinct;
    }
    ++count[in];

    while (distinct > k) {
        const unsigned char out = static_cast<unsigned char>(s[left]);
        --count[out];
        if (count[out] == 0) {
            --distinct;
        }
        ++left;
    }

    best = std::max(best, right - left + 1);
}
```

Six details are worth checking before submitting.

1. **The entry test runs before the increment.** `count[in] == 0` is what detects a character entering the window for the first time. Testing after the increment always sees a positive count and never raises `distinct`.
2. **The exit test runs after the decrement.** `count[out] == 0` is what detects a character leaving the window for the last time. Testing before the decrement is correct only if the old count was one, which is a different condition and is easy to miss.
3. **The shrink is a `while`, not an `if`.** One removal may not be enough, because several distinct characters can be over the limit at once. The failure passage in the next section shows the smallest input where a single removal records an invalid window.
4. **The record runs after the shrink.** The length `right - left + 1` is the length of a valid window only at that point. Recording before the loop records the window that triggered the shrink.
5. **The byte is cast to `unsigned char` before indexing.** A signed `char` with a value above 127 becomes a negative index, which is undefined behavior in C and C++. The cast costs nothing and makes the 256-entry array safe for every byte.
6. **Zero is a valid window length.** When $k = 0$ the shrink loop empties the window, and `right - left + 1` becomes zero. The answer must allow zero, and the loop must not index `s[left]` after the last character has been removed. The condition `distinct > k` already stops at the empty window, because an empty window has `distinct = 0`.

The Python version uses a dictionary instead of the 256-entry array, so it handles any alphabet but pays hashing for each update. The Java version uses the same 256-entry array and `Math.max`. The Pascal version uses a 1-based string and `Length(S)`, and it reads the string with `ReadLn(S)` so that the newline is consumed before `Read(K)`. The JavaScript version uses `charCodeAt` and a 256-entry array, and it prints with an explicit newline because `process.stdout.write` does not add one.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Shrinking with `if` instead of `while` | An invalid window is recorded and the answer can be too large | Keep removing while the condition fails |
| Recording before the shrink | The recorded length belongs to an invalid window | Record after the shrink loop |
| Forgetting to decrement `distinct` when a count reaches zero | The counter stays too high and the window shrinks too far | Decrement after the count reaches zero |
| Decrementing `distinct` on every removal | The counter falls too low and invalid windows are accepted | Decrement only on the zero crossing |
| Using `right - left` instead of `right - left + 1` | Every answer is short by one | Count both endpoints |
| Rebuilding the frequency map for each window | The scan becomes $O(n^2)$ | Update the map on push and pop |
| Treating $k$ as a limit on occurrences rather than distinct values | The condition answers a different problem | Count distinct values, not total occurrences |
| Using a 26-entry array for arbitrary bytes | A non-letter byte indexes out of bounds | Size the map by the alphabet, or use a hash map |
| Mixing the longest and shortest transition tables | The answer is the opposite extreme | Decide the mode before writing the loop |
| Counting an empty window as length one | $k = 0$ returns one instead of zero | Compute the length from both indices, and allow zero |
| Leaving a negative $k$ unclamped | The shrink loop can run past the left end | Clamp $k$ to zero before scanning |

### Why this fails: the shrink that runs once

The failure that survives review most often is a single removal where a loop is needed. Take $s = \text{aabb}$ and $k = 1$.

The correct scan keeps `aa` and then `bb`, and returns 2. A program with `if (distinct > k)` instead of `while` behaves differently at the third character.

At $r = 2$ the window is `aab`, with counts $a=2$ and $b=1$, so `distinct = 2`. The check fails. One removal takes `a` out, leaving `ab` with `distinct = 2`, which is still invalid. The buggy program records the length 2 and continues. At $r = 3$ the window is `abb`, again with `distinct = 2`. One removal takes `a` out, leaving `bb` with `distinct = 1`, and the program records the length 3. The answer is 3, but the longest valid window is 2. The recorded window `abb` has two distinct characters, so it was never valid; the check simply did not run often enough.

The same input shows why the condition must be tested again after every removal. The shrink state is a loop because the number of removals needed is not known in advance.

A second failure is a distinct counter that never falls. Take $s = \text{abb}$ and $k = 1$. The correct answer is 2, from `bb`. If the program decrements `count[a]` but forgets to decrement `distinct` when that count reaches zero, the counter stays at 2 after `a` leaves. At $r = 1$ the window `ab` is invalid, and the program removes both characters while the stale counter insists that two distinct values are present. A guard that stops at the empty window then records nothing and leaves the best at 1; without the guard, the next removal reads past the end of the string. At $r = 2$ the fresh `b` raises the stale counter again. A counter that is maintained in one direction only is worse than no counter at all.

A third failure is using the wrong transition out of the record state. Take the predicate "the window contains at least two distinct characters" on $s = \text{aab}$. The longest valid window is `aab`, of length 3, and the shortest is `ab`, of length 2. The longest table records after the shrink loop and then grows, so it returns 3. The shortest table records before each pop and then shrinks, so it returns 2. Both programs are correct implementations of their own tables, and only one answers the question that was asked. The mode is not a detail of the code; it is the definition of the answer.

## Variants and extensions

- **The fixed-size window.** The predicate is replaced by a size comparison. Push one element, and once the window is full, pop the oldest before recording. The state is a queue, and the summary is whatever the problem asks for.
- **The longest window with a sum bound.** Replace the frequency map by a running sum. The update is one addition and one subtraction. The rule works only when the values are non-negative, because removal must not increase the sum.
- **The shortest covering window.** Keep a missing counter instead of a distinct counter. Record while the counter is zero, and pop until a required character disappears. This is the shortest table with a covering predicate.
- **The counting window.** Use the longest table and add $r-l+1$ at every record. The addition counts every valid start for the current right end, not just the longest one.
- **At most $k$ replacements.** For a binary string, count the positions that differ from the target character. The window is valid when that count is at most $k$, and the state machine is the longest variant.
- **Two limits at once.** Keep a distinct counter and an over-limit counter. The window is valid when both satisfy their bounds, and each update still touches a constant number of counters.
- **The min-max window.** When the predicate is the range of the values, maintain two monotonic deques. The state machine is the shortest variant, and the deques answer the minimum and maximum in constant amortized time.
- **The window over a stream.** The right end is the arrival of a new element and the left end is the removal of the oldest. The same transitions run, with the array replaced by a queue.
- **The two-ended window.** When the condition depends on both ends rather than on the multiset of the contents, the window becomes a deque and the removal happens at whichever end the condition requires.
- **The unbounded alphabet.** Replace the 256-entry array by a hash map. The transitions are unchanged; only the cost of an update changes from worst-case $O(1)$ to expected $O(1)$.
- **The segment-tree alternative.** When the window must support arbitrary range queries rather than one moving range, a segment tree or a sparse table replaces the state machine. The window is the right tool only when the range moves monotonically.

## Contest strategy

Under contest pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write the condition as one sentence, and mark whether it is monotone under shrinkage, under growth, or both. The longest table needs shrinkage, and the shortest table needs growth. If neither holds, the window is the wrong tool.
2. Choose the mode before writing code: fixed, longest, shortest, or counting. The mode decides the answer variable and the transition out of the record state.
3. Write the transition table on paper, including the empty-window guard. The code is then a direct translation, and the two loops cannot be confused.
4. Decide the summary and write its push and pop updates. If either update is not $O(1)$, the scan will not be linear.
5. Test five shapes: a window that never shrinks, a window that shrinks on every step, a window that shrinks to empty, $k = 0$, and $k$ at least the number of distinct values.
6. Check the integer widths. A length fits in 32 bits at these limits, but a sum of values may not, and a count of windows certainly may not.
7. Compare against the quadratic baseline on random small inputs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: Longest k-Good Segment

**Restatement.** Given an array of $n$ integers and an integer $k$, find any longest contiguous segment that contains at most $k$ different values. Output its 1-based left and right endpoints. Constraints: $1 \le k \le n \le 500\,000$ and $0 \le a_i \le 10^6$.

**Naive baseline.** Try every segment and count its distinct values from scratch, at $O(n^3)$, or rebuild a frequency map per segment, at $O(n^2)$.

**Insight.** The longest variant of the state machine applies directly. The frequency map is indexed by value, and the distinct counter decides when the window is too rich.

**Derivation.** Keep `count` over the value range, a distinct counter, and the best endpoints. For each right end, add `a[right]`. While `distinct > k`, remove `a[left]` and advance `left`. If the current length is the best so far, record `left + 1` and `right + 1`. The problem accepts any longest segment, so the tie-breaking rule does not matter.

**Correctness.** The theorem for the longest variant shows that the window after the shrink is the longest valid one ending at the current right end. Every valid segment ends at some right end, so the maximum over the recorded lengths is the global maximum. The recorded endpoints belong to the window that produced the length.

**Complexity.** $O(n)$ time and $O(V)$ space, where $V \le 10^6 + 1$ is the value range. A hash map lowers the space to $O(\sigma)$ and keeps expected $O(n)$ time.

**Common wrong approach.** Recording the length before the shrink. The window that triggers the shrink is invalid, and its length can exceed the true answer. A second wrong approach is printing the length instead of the two endpoints, which the statement asks for explicitly.

### Problem 2: Books

**Restatement.** Given $n$ books in a fixed order and $t$ free minutes, find the maximum number of consecutive books that can be read without exceeding $t$ minutes in total. Constraints: $1 \le n \le 100\,000$, $1 \le t \le 10^9$, and $1 \le a_i \le 10^4$.

**Naive baseline.** Try every starting book and read forward until the time runs out, at $O(n^2)$ in the worst case.

**Insight.** The chosen books are a contiguous window. The summary is the sum of their reading times. Because every reading time is positive, adding a book only increases the sum, so the longest variant with a sum bound applies.

**Derivation.** Keep `left`, `total`, and `best`. For each right end, add `a[right]` to `total`. While `total > t`, subtract `a[left]` and advance `left`. Record `right - left + 1`. The window that remains is the longest affordable run ending at the current book.

**Correctness.** The predicate is valid under shrinkage because removing a positive reading time decreases the sum. The same longest-variant argument applies with a running sum in place of the frequency map. The recorded window is valid, and every affordable run ends at some right end.

**Complexity.** $O(n)$ time and $O(1)$ auxiliary space. The total can reach $10^9$, so a 64-bit accumulator is the safe choice in C, C++, Java, and Pascal.

**Common wrong approach.** Sorting the books. The reading order is part of the problem, and sorting destroys it. A second wrong approach is using `if` instead of `while` when the sum exceeds $t$, which can leave the window over budget.

### Problem 3: Flowerpot

**Restatement.** Given $n$ raindrops at coordinates $(x_i,y_i)$, place a flowerpot of width $W$ on the $x$-axis. A drop inside the pot reaches the flowers after $y_i$ units of time. Find the minimum $W$ such that some placement collects rain for at least $D$ units of time, or print $-1$ if no placement does. Constraints: $1 \le n \le 100\,000$, $1 \le D \le 10^6$, and coordinates between $0$ and $10^6$.

**Naive baseline.** Try every pair of drops as the pot edges, at $O(n^2)$ placements, and compute the $y$ range of the drops inside each one.

**Insight.** Sort the drops by $x$. A pot then contains a contiguous window of the sorted drops. Its width is the $x$ difference between the outermost drops, and the rain duration is the difference between the maximum and minimum $y$ inside the window. Adding a drop can only increase the $y$ range, so the predicate is monotone under growth and the shortest variant applies.

**Derivation.** Sort by $x$. Keep a window and two monotonic deques, one for the minimum $y$ and one for the maximum $y$. For each right end, push its $y$ into both deques with the usual monotone maintenance. While the maximum minus the minimum is at least $D$, update the answer with $x[right] - x[left]$, remove the left drop from the deques if it is at either front, and advance `left`. If the answer was never updated, print $-1$.

**Correctness.** The shortest-variant theorem shows that the minimum over all recorded windows is the minimum valid width. The deques maintain the exact minimum and maximum of the current window, so the range test is exact. The scan records every window that could improve the answer before discarding its start, and taking the minimum over all recorded widths gives the minimum pot width. The $x$ order makes the width of a window the difference between its outermost coordinates.

**Complexity.** $O(n\log n)$ time for the sort and $O(n)$ for the scan, with $O(n)$ memory for the drops and the deques.

**Common wrong approach.** Using the $y$ difference as the pot width. The width is measured on the $x$-axis, while the $y$ difference is the time the rain takes. A second wrong approach is using the longest table and recording after the shrink, which leaves the pot as wide as possible instead of as narrow as possible.

## Practice progression

1. **Recognition.** Given ten statements, mark whether each asks for a longest, shortest, fixed-size, or counting window. Write the direction of monotonicity that each mode needs.
2. **Direct application.** Implement the longest at-most-$k$-distinct scan and compare it with the quadratic baseline on random strings of length at most 20.
3. **Adaptation.** Replace the frequency map by a running sum for the books problem, then by two monotonic deques for the flowerpot problem. Keep the transition table unchanged.
4. **Combination.** Add the counting record to the longest table, then add a second limit and an over-limit counter. Verify the counters against a recount after every update.
5. **Challenge.** Implement the shortest covering window, prove that no discarded start can lead to a smaller answer, and test the case where no window is valid.
6. **Transfer.** Recognize the same machine in a stream, in a two-ended window, and in a graph traversal with a visit limit.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the five states, and which state decides the variant? (Algorithm derivation)
2. Why does the longest variant need validity under shrinkage, and the shortest variant validity under growth? (Formal model)
3. What exactly does the distinct counter count, and when does it change? (Key insight)
4. Why is $L(r)$ non-decreasing, and why does that keep the left pointer from moving backwards? (Correctness proof)
5. Why is the shrink a `while` loop rather than an `if`? (Common mistakes)
6. What is the smallest input on which a single removal records an invalid window, and what does the program return? (Common mistakes)
7. What happens when a count reaches zero and the distinct counter is not decremented? (Common mistakes)
8. What does the program do when $k = 0$, and what is the correct answer? (Algorithm derivation)
9. What does the counting variant add at the record state, and why is that the number of valid windows ending there? (Variants and extensions)
10. What replaces the frequency map when the predicate is a sum? What replaces it when the predicate is a range? (Worked problems)
11. Why does the binary-search baseline pay a logarithm that the state machine avoids? (Complexity analysis)
12. When is a sliding window the wrong tool, even though the range is contiguous? (Algorithm selection)
13. Which two files in the implementation are educational references rather than submission languages? (Reference implementations)

## Further reading

- [Sliding window](/algorithms/searching/sliding-window) develops the fixed-size and variable-size forms, the frequency map, and the monotonicity assumption in more detail.
- [Two pointers](/algorithms/searching/two-pointers) proves the pointer discipline that the grow and shrink states rely on.
- [Binary search](/algorithms/searching/binary-search) is the one-pointer alternative for the length predicate, and the baseline that is easiest to trust.
- [Prefix sums](/algorithms/arrays/prefix-sums) is the replacement when the window condition stops being monotone, such as a sum over values that may be negative.
- [Parametric search](/algorithms/searching/parametric-search) generalizes the binary-search-on-answer baseline for problems whose feasibility check is itself a scan.
