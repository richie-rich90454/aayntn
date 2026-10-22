---
id: arrays.difference-arrays
title: Difference arrays
summary: Turn a range update into two single-position writes, and recover the values with one prefix sum at the end.
division: [silver, gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords:
    [difference array, range update, point query, prefix sum, offline, sweep line, lazy propagation]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [range-queries.fenwick-tree, searching.two-pointers]
complexity:
    time: "O(n + q)"
    space: "O(n)"
assumptions:
    - Every update is a range update that adds a constant to every element of the range.
    - The values are read after the updates, or the queries can be reordered.
reviewed: false
---

## At a glance

A difference array stores, at each position, the difference between that element and the previous one. The transformation turns the expensive operation of a prefix-sum array into a cheap one, and turns the cheap one into an expensive one.

A **range update** that adds $v$ to every element of $[l, r]$ becomes **two single-position writes**: add $v$ to the difference at $l$, and subtract $v$ from the difference at $r + 1$. That is $O(1)$ per update, against $O(r - l + 1)$ for the update applied directly to the array.

Recovering the values is a **prefix sum**: the value at position $i$ is the sum of the differences at positions $1$ through $i$. That is $O(n)$ for the whole array, once.

The two operations have exchanged costs, and that exchange is the entire technique. A prefix-sum array answers range-sum queries in $O(1)$ and pays $O(n)$ to rebuild after a change; a difference array applies a range change in $O(1)$ and pays $O(n)$ to read the values back.

The comparison with the **Fenwick tree** is the practical question. The difference array is $O(1)$ per update and $O(n)$ to read everything, but it can only do that if all the updates come first. The Fenwick tree handles updates and queries in any order, at $O(\log n)$ each. When the operations interleave, the Fenwick tree is the right tool; when they do not, the difference array is faster and simpler.

## Problem motivation

A weather station records the temperature in $n$ cells of a one-dimensional strip, and the cells start at zero. The meteorologist then runs a sequence of adjustments: "add three degrees to cells 10 through 40", "subtract one degree from cells 5 through 100", and so on. At the end, every cell is read.

The constraints:

- $1 \le n \le 10^6$ cells.
- $q \le 10^5$ adjustments, each of the form "add $v$ to the range $[l, r]$".
- $|v| \le 10^6$, so a cell can reach $10^{11}$ in magnitude.
- Every cell is read once, after all the adjustments.

The naive answer applies each adjustment to the array directly, at a cost of $O(nq) = 10^{11}$ writes. Even at one nanosecond per write, that is more than a hundred seconds.

The answer that works writes two numbers per adjustment and reads the array once at the end, for a total of $O(n + q)$ work.

The structure of the problem is what makes this possible: the updates are **range additions of a constant**, and the reads happen at the end. Both facts are needed. An update that sets a range to a value rather than adding to it cannot be done with two writes, and a read in the middle of the sequence cannot be done with a single final pass.

## Recognition patterns

A difference array is the right tool when all of the following hold.

- Every update is a **range addition of a constant**, or a range assignment that can be converted into one.
- The values are read **after** the updates, or the queries can be reordered so that they are.
- The array is large and the number of updates is comparable to the number of cells.

The phrases that signal it are "add $v$ to every element of the range", "increment the interval", "after all the operations, print the array". The phrase that rules it out is "after each operation, report the value at position $i$", because that interleaves the reads with the writes.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Every update adds a constant to a range | Rules in the two-write update |
| An update sets a range to a value | Rules out the two-write update unless a second array is kept |
| The values are read only at the end | Rules in the single final prefix sum |
| The values are read after every update | Rules out the difference array; use a Fenwick tree |
| $q \ge n$ | The difference array is far better than writing each range |
| $q = 1$ | A single range write is as good as a difference array |
| Values may reach $10^{11}$ | The accumulator must be 64 bits |

## Naive approach

The baseline applies each update to the range.

```python
for value, left, right in updates:
    for i in range(left - 1, right):
        a[i] += value
```

This is $O(nq)$ and it is correct for every input. It is the reference implementation for the differential test.

The second baseline keeps the operations in a list and replays them when a value is read, which is $O(n)$ per read and no better.

The third baseline is a Fenwick tree, which is the right answer when the operations interleave, and which is compared with the difference array in the selection table below.

## Key insight

The insight is that a constant added to a whole interval changes the differences inside that interval by nothing at all.

Write the difference array $d$ of the value array $a$ as

$$
d_i = a_i - a_{i-1} \qquad \text{with } a_0 = 0.
$$

Now add $v$ to every element of $[l, r]$. Inside the interval, both $a_i$ and $a_{i-1}$ grow by $v$, so

$$
d_i = (a_i + v) - (a_{i-1} + v) = a_i - a_{i-1} = d_i.
$$

Every difference strictly inside the interval is unchanged. Only the two differences at the edges of the interval change:

- At $l$, the previous element $a_{l-1}$ did not change while $a_l$ did, so $d_l$ grows by $v$.
- At $r + 1$, the element $a_r$ changed while $a_{r+1}$ did not, so $d_{r+1}$ shrinks by $v$.

Two writes. That is the whole trick, and it is the same idea as the [prefix sums](/algorithms/arrays/prefix-sums) array read backwards: the prefix array stores running totals, and the difference array stores the gaps between them.

Recovering the values is the other half, and it is the definition read the other way:

$$
a_i = a_{i-1} + d_i = d_1 + d_2 + \cdots + d_i = \sum_{j=1}^{i} d_j.
$$

So the value at position $i$ is the prefix sum of the differences up to that position, and one pass over the difference array recovers the whole array.

## Visual intuition

The picture is an array of gaps rather than an array of values. Each cell holds how much bigger it is than the cell on its left.

```text
value:      3   1   4   1   5
difference: 3  -2   3  -3   4
```

The gap of 3 at the left is the jump from the implicit zero before the array. The gap of -2 says the second value is two less than the first.

Now add 4 to the whole array. The values become $7, 5, 8, 5, 9$, and the gaps are

```text
value:      7   5   8   5   9
difference: 7  -2   3  -3   4
```

Only the first gap changed, because the jump from the implicit zero is the only place where the value and its predecessor disagree about the update.

Now add 4 to the range $[2, 3]$ instead. The values become $3, 9, 12, 1, 5$, and the gaps are

```text
value:      3   9  12   1   5
difference: 3   6   3 -11   4
```

Exactly two gaps moved: the one at the left edge of the range and the one just past its right edge. The gaps inside the range are untouched, because the update lifted both of their endpoints equally.

That is the whole picture: **an update moves the boundary markers, and nothing in between knows that anything happened.**

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the value array and let $a_0 = 0$.

<MathPanel type="definition" title="Definition">
The **difference array** of $a$ is the array $d_1, d_2, \ldots, d_{n+1}$ with
$d_i = a_i - a_{i-1}$ for $1 \le i \le n$ and $d_{n+1} = 0$ when the
array is padded with a zero on the right. The array $a$ is recovered from
$d$ by the prefix sums $a_i = \sum_{j=1}^{i} d_j$.
</MathPanel>

<MathPanel type="definition" title="Definition">
A **range update** is a triple $(l, r, v)$ that adds the constant $v$ to
every element $a_l, a_{l+1}, \ldots, a_r$. The update is written on the
difference array as the two writes $d_l \gets d_l + v$ and
$d_{r+1} \gets d_{r+1} - v$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $a'$ be the array that results from applying the range update
$(l, r, v)$ to $a$, and let $d'$ be its difference array. Then
$d'_i = d_i$ for every $i \ne l$ and $i \ne r + 1$, and
$d'_l = d_l + v$ and $d'_{r+1} = d_{r+1} - v$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
For every $i$ with $1 \le i \le n$,
$\sum_{j=1}^{i} d_j = a_i$.
</MathPanel>

The second lemma is the statement that the transformation is reversible, and it is the reason the final pass is a prefix sum and not something else.

<MathPanel type="theorem" title="Theorem">
The difference array algorithm produces, for every position $i$, the
value that the direct application of all the range updates would produce.
</MathPanel>

## Algorithm derivation

The state is the difference array $d$ of $n + 1$ entries, all initialized to zero, matching an initial value array of zeros.

The update rule for a range update $(l, r, v)$ is: set $d_l \gets d_l + v$ and $d_{r+1} \gets d_{r+1} - v$.

The read rule is: for $i$ from $1$ to $n$, set $a_i \gets a_{i-1} + d_i$, starting from $a_0 = 0$.

The update rule is correct by the lemma on the difference array. The read rule is correct by the lemma on the prefix sum: after the update to $a_i$, the value is $a_{i-1} + d_i$, which is the running total of the differences.

<MathPanel type="invariant" title="Invariant">
After any number of updates, the prefix sum of the differences up to
position $i$ equals the value that the direct application of those
updates would place at position $i$.
</MathPanel>

The extra entry at position $n + 1$ is what makes the rule uniform. When the range ends at $n$, the update writes to $d_{n+1}$, which would otherwise be outside the array. With the extra entry, the rule needs no special case at all: the update at the right edge of the array is written the same way as every other update, and the final prefix sum simply stops before the extra entry.

## Step-by-step execution

Take an array of five zeros, and apply three updates: add 3 to $[2, 4]$, subtract 1 from $[3, 5]$, and add 10 to $[1, 2]$.

The difference array starts as $d = [0, 0, 0, 0, 0, 0]$, with six entries for five positions.

- **Update 1: add 3 to $[2, 4]$.** Write $d_2 \gets d_2 + 3$ and $d_5 \gets d_5 - 3$. The array is $d = [0, 3, 0, 0, -3, 0]$.
- **Update 2: subtract 1 from $[3, 5]$.** Write $d_3 \gets d_3 - 1$ and $d_6 \gets d_6 + 1$. The array is $d = [0, 3, -1, 0, -3, 1]$.
- **Update 3: add 10 to $[1, 2]$.** Write $d_1 \gets d_1 + 10$ and $d_3 \gets d_3 - 10$. The array is $d = [10, 3, -11, 0, -3, 1]$.

Now the final pass, taking the prefix sums.

- $a_1 = 10$.
- $a_2 = 10 + 3 = 13$.
- $a_3 = 13 + (-11) = 2$.
- $a_4 = 2 + 0 = 2$.
- $a_5 = 2 + (-3) = -1$.

The array is $a = [10, 13, 2, 2, -1]$. Checking it directly: position 1 gets only the third update, so 10. Position 2 gets the first and the third, so $3 + 10 = 13$. Position 3 gets the first and the second, so $3 - 1 = 2$. Position 4 gets the first and the second, so 2. Position 5 gets only the second, so $-1$. Every value agrees.

The whole thing took three updates of two writes each, so six writes, plus one pass of five additions. Direct application would have taken $3 + 3 + 2 = 8$ writes here, and the gap widens with the length of the ranges.

## Correctness proof

<MathPanel type="proof" title="Proof">
The update rule maintains the invariant.
</MathPanel>

<MathPanel type="proof" title="Proof">
The invariant says that the prefix sum of the differences up to position
$i$ equals the value the direct application of the updates so far would
place at position $i$.

It holds before any update, because all the differences are zero and the initial value array is all zeros.

Suppose it holds before a range update $(l, r, v)$. Consider the prefix sum at position $i$. If $i < l$, no difference at or before $i$ changed, so the prefix sum is unchanged, and the direct application also leaves position $i$ unchanged.

If $l \le i \le r$, exactly one of the changed differences is at or before $i$, namely the write of $+v$ at $l$. The prefix sum therefore grows by $v$, which is exactly what the direct application does to position $i$.

If $i > r$, both writes are at or before $i$, so the prefix sum grows by $v - v = 0$, and the direct application also leaves position $i$ unchanged.

The invariant is preserved in every case, so after all the updates it holds for the whole array. The final pass computes the prefix sums and therefore produces exactly the array that direct application would have produced. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The read rule recovers the values.
</MathPanel>

<MathPanel type="proof" title="Proof">
By the lemma, $a_i = \sum_{j=1}^{i} d_j$. The pass sets
$a_i = a_{i-1} + d_i$, and by induction $a_{i-1} = \sum_{j=1}^{i-1} d_j$
when the update is performed, so the value written at position $i$ is
$\sum_{j=1}^{i} d_j = a_i$. $\square$
</MathPanel>

## Complexity analysis

**Time: $O(n + q)$**, where $q$ is the number of updates. Each update is two writes, and the final pass is $n$ additions. The scan over the difference array does not depend on the number of updates, which is the whole point.

**Auxiliary space: $O(n)$** for the difference array, and $O(n)$ for the recovered values if they are kept. A difference array can be built in place over the value array, since the transformation is its own kind of overwrite, so the extra space can be $O(1)$ beyond the input when the values are read out in place.

<MathPanel type="complexity" title="Complexity">
Difference array: $O(1)$ per range update, $O(n)$ to recover all the
values, so $O(n + q)$ in total. The accumulator must be 64 bits when
the updates can accumulate beyond the 32-bit range.
</MathPanel>

The comparison with the Fenwick tree is the practical one.

|                               | Difference array                         | Fenwick tree |
| ----------------------------- | ---------------------------------------- | ------------ |
| Range update                  | $O(1)$                                   | $O(\log n)$  |
| Read one value                | $O(1)$ after a final pass, $O(n)$ before | $O(\log n)$  |
| Read a range sum              | $O(n)$ without extra work                | $O(\log n)$  |
| Read the whole array          | $O(n)$                                   | $O(n)$       |
| Updates and reads interleaved | Not supported directly                   | Supported    |
| Space                         | $O(n)$                                   | $O(n)$       |

The difference array wins on the update and loses on the read, and it only supports the pattern in which the reads come last.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Range updates, then one read of everything | Difference array |
| Range updates and point queries interleaved | Fenwick tree |
| Range updates and range-sum queries interleaved | Fenwick tree or segment tree |
| Point updates and range-sum queries | Fenwick tree or segment tree |
| Range assignment rather than range addition | Two difference arrays, one for the values and one for the changes |
| Rectangle updates on a grid | A two-dimensional difference array |
| Offline queries over one dimension, reordered by position | A difference array and a sweep |
| A static array with many range-sum queries | Prefix sums, which is the mirror image |

The seventh row is the technique's real strength. When the queries are known in advance, they can be sorted by position and answered during a single sweep, using the difference array as the event list. That is the shape of the standard offline sweep line.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Writing the end of the update at $r$ instead of $r + 1$ | The value at position $r + 1$ is wrong, and so is everything after it | The update ends just past the range |
| Allocating $n$ entries instead of $n + 1$ | A range ending at $n$ writes outside the array | Allocate the extra entry |
| Suffix-summing the differences instead of prefix-summing them | The values are wrong, and the error is silent | Prefix sum, always |
| Reading a value in the middle of the updates | The read is wrong, because the prefix sum has not been taken | Use a Fenwick tree for interleaved reads |
| Using a 32-bit accumulator | The answer is wrong when the updates accumulate | Use a 64-bit type |
| Trying to handle a range assignment with two writes | The values inside the range are wrong | Keep a second difference array for the changes |
| Forgetting that the difference of an array of zeros is not an array of zeros | The initial state is wrong when the input array is not zero | Build the differences from the input when the input is not zero |
| Using a hash map for the differences | The writes stop being $O(1)$ | Use an array indexed by position |

### Why this fails: the update that ends one position too early

The mistake that survives review most often is writing the second half of the update at $r$ instead of at $r + 1$. It is a one-character error, it compiles, and it produces a program that answers most queries correctly.

The smallest counterexample is an array of three zeros with a single update: add 5 to the positions 2 and 3, counting from one.

- **Correct.** Write $d_2 \gets d_2 + 5$ and $d_4 \gets d_4 - 5$. The difference array is $[0, 5, 0, -5]$, and the prefix sums are $[0, 5, 5]$. The array becomes $[0, 5, 5]$, which is right: positions 2 and 3 both gained 5.
- **Wrong.** Write $d_2 \gets d_2 + 5$ and $d_3 \gets d_3 - 5$. The difference array is $[0, 5, -5, 0]$, and the prefix sums are $[0, 5, 0]$. The array becomes $[0, 5, 0]$. The value at position 3 is 0 when it should be 5.

The error is not a rounding error that is small; it destroys the value at the end of the range and, in a longer array, everything after it. In a program that processes a hundred thousand updates, the damage spreads across the whole array.

The reason the mistake is so natural is that the right-hand end of the range is where the cancellation happens, and it is tempting to think of the cancellation as happening at $r$ rather than just after it. The cancellation happens exactly where the update stops, which is the position $r + 1$, because that is the first position the update does not reach.

The generalizes into a rule: **a range that covers positions $l$ through $r$ changes the markers at $l$ and at $r + 1$, and at no other position.** If the second marker is drawn at $r$, the range is one position too short and the value at $r$ is lost.

A second failure with the same root is the mirror-image confusion between the two arrays. The difference array is not the prefix-sum array read backwards, and the recovery step is a prefix sum, not a suffix sum. The smallest counterexample is the array $[1, 1]$, whose differences are $[1, 0]$. The prefix sums are $[1, 1]$, which is the array; the suffix sums are $[1, 0]$, which is not. The direction of the sum is what distinguishes the two arrays, and a difference array read with the wrong direction gives plausible numbers that are not the right ones.

## Variants and extensions

- **The two-dimensional difference array.** A rectangle update on a grid becomes four writes, one at each corner of the rectangle, and the values are recovered by a two-dimensional prefix sum. The technique is the same in both dimensions, and it is described in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- **The difference array for range assignment.** To set a range to a value rather than add to it, keep two difference arrays: one holding the values and one holding the changes, so that the assignment is a difference of two range additions.
- **The difference array for a mixed sequence.** When a range is added to and later a sub-range of it is assigned, the two arrays above are what keep the answer correct.
- **The offline sweep line.** When the queries are known in advance, sort them by position and sweep the array once, using the difference array as the event list. This is the standard way to solve the "each interval contributes to a range" problem in linear time.
- **The difference array over a Fenwick tree.** Applying a range update with a difference array and then reading values in a different order is possible when the reads can be sorted by position, which is the offline version of the Fenwick tree problem.
- **The difference array in a segment tree with lazy propagation.** The same two markers are the idea behind the lazy tag of a segment tree: instead of pushing the pending addition down to the children on every query, keep a marker at the node and push it only when the children are needed.
- **The difference array over a circular array.** A range that wraps around the end is two ranges, so it is four writes, and the recovery needs a circular prefix sum.
- **The difference array as an event list.** In a simulation with events at times, the difference array is the array of changes between consecutive event times, and the "values" are the prefix sums of the changes.

## Contest strategy

Under contest pressure, the errors above are what cost points, and the whole technique can be applied with a fixed procedure.

1. Check the operation first. A range addition is two writes; a range assignment is not.
2. Check the order of the operations. If a value is read between two updates, the difference array is the wrong tool and the Fenwick tree is the right one.
3. Allocate $n + 1$ entries, not $n$, and write the second marker at $r + 1$.
4. Use a 64-bit accumulator, and compute the largest value the statement allows: $q$ updates of size $v$ reach $qv$.
5. Decide the indexing convention and write it in a comment. One-based positions with a difference array indexed from one is the combination with the fewest off-by-one traps.
6. Test three cases by hand: an update covering the whole array, an update covering a single position, and an update ending at the last position.

## Worked problems

### Problem 1: the temperature corrections

**Restatement.** An array of $n$ cells starts at zero. There are $q$ operations, each adding a value to an inclusive range, and the final array is printed. Constraints: $1 \le n \le 10^6$, $q \le 10^5$, $|v| \le 10^6$.

**Naive baseline.** Apply every operation to the array, at a cost of $O(nq) = 10^{11}$ writes.

**Insight.** A range addition changes the differences only at the two edges of the range.

**Derivation.** Keep a difference array of $n + 1$ entries. For each operation, add $v$ at $l$ and subtract $v$ at $r + 1$. At the end, take one prefix-sum pass to produce the values.

**Correctness.** The invariant proof shows that the prefix sums of the differences always match the directly updated array, and the final pass computes those prefix sums.

**Complexity.** $O(n + q)$ time and $O(n)$ space. The values can reach $10^{11}$, so the accumulator must be 64 bits.

**Common wrong approach.** Writing the second marker at $r$ instead of $r + 1$, which loses the value at the end of the range and every value after it.

### Problem 2: the counting subarrays

**Restatement.** Given an array of $n$ integers, count the subarrays whose sum is exactly $K$. Constraints: $1 \le n \le 200\,000$, $|a_i| \le 10^9$.

**Naive baseline.** Enumerate the subarrays and sum each one, at a cost of $O(n^2)$.

**Insight.** A subarray from $l$ to $r$ sums to $P_r - P_{l-1}$, where $P$ is the prefix-sum array, so the question is how many pairs of prefix values differ by $K$.

**Derivation.** Build the prefix sums, then sweep them with a frequency map of the values seen so far. The map is seeded with the frequency of zero, which accounts for the subarrays that start at the first element. The map is queried before the insertion, so an element is never paired with itself.

**Correctness.** Every subarray corresponds to exactly one pair of prefix indices, and the sweep counts each pair when it reaches the larger index, so each is counted once and none is missed.

**Complexity.** $O(n)$ expected time and $O(n)$ space.

**Common wrong approach.** Inserting the current prefix value into the map before querying it, which counts the empty subarray and makes every answer one too large.

### Problem 3: the airplane seats

**Restatement.** An airplane has $n$ rows of $m$ seats. Every passenger who sits down blocks the aisle seat of their row for everyone behind them, and the question asks which rows are entirely free. Constraints: $n, m \le 1000$.

**Naive baseline.** For every row, look at every seat, at a cost of $O(nm)$, which is acceptable but does not answer the harder version of the problem.

**Insight.** Each blocked aisle seat is a range update on the rows behind it, so the whole problem is a set of range updates followed by a read of the whole array.

**Derivation.** For each passenger that blocks an aisle seat at row $r$, add one to the range $[r + 1, n]$. After all the passengers have been seated, take the prefix sum of the differences to get the number of blocked seats before each row, and report the rows whose count is zero.

**Correctness.** The invariant proof shows that the recovered count at each row is exactly the number of blocking passengers before it, so a row is free exactly when the count is zero.

**Complexity.** $O(nm + n)$ time and $O(n)$ space, dominated by reading the seating.

**Common wrong approach.** Marking the rows one at a time, which is the same $O(nm)$ and misses the point: the two-write update is what makes the technique general.

## Practice progression

1. **Recognition.** Given a statement, decide whether a difference array applies. Look for range additions of a constant, and check that the reads come after the writes.
2. **Direct application.** Implement the two-write update and the final prefix sum, and verify them against the direct application on random small inputs.
3. **Adaptation.** Implement the range assignment with two difference arrays, and the two-dimensional version with four writes per rectangle.
4. **Combination.** Combine the difference array with a sweep over sorted queries, and with a Fenwick tree to handle the version where the reads are interleaved.
5. **Challenge.** Solve a problem where the operations interleave, discover that the difference array cannot answer the interleaved reads, and replace it with a Fenwick tree.
6. **Transfer.** Recognize the two markers in a data structure that is not an array: the lazy tag of a segment tree, and the event list of an offline sweep line.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. Where exactly do the two writes of a range update go, and why? (Key insight)
2. Give the smallest instance on which the update ending at $r$ instead of $r + 1$ is wrong, and the value it produces. (Common mistakes)
3. How are the values recovered from the difference array, and why does that direction matter? (Algorithm derivation)
4. State the invariant and say which part of the proof uses each half of it. (Correctness proof)
5. Why is the difference array $O(1)$ per update while the prefix-sum array is $O(1)$ per query? (Key insight)
6. When does the difference array stop working, and what replaces it? (Algorithm selection)
7. Why does the difference array need $n + 1$ entries? (Common mistakes)
8. How does a rectangle update on a grid look in the two-dimensional version? (Variants and extensions)
9. What is the sweep-line technique, and how does the difference array take part in it? (Variants and extensions)
10. What is the largest value the stated constraints allow, and what does that do to the type of the accumulator? (Complexity analysis)
11. How do you handle a range assignment instead of a range addition? (Variants and extensions)
12. Which part of the algorithm would break if a value were read between two updates, and why? (Common mistakes)

## Further reading

- The mirror image of this technique, which turns a range sum into a subtraction, is in [prefix sums](/algorithms/arrays/prefix-sums).
- The grid version, in which a rectangle update becomes four writes, is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The structure that handles interleaved updates and queries is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and the comparison table above comes from that article.
- The generalization that handles non-additive queries is the [segment tree](/algorithms/range-queries/segment-tree).
- The two-pointer technique that answers some of the same questions without any extra array is in [two pointers](/algorithms/searching/two-pointers).
- The binary search that turns a monotone condition into a boundary is in [binary search](/algorithms/searching/binary-search).
