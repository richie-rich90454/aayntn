---
id: arrays.two-pointers
title: Two pointers on an array
summary: Move two indices through the same array so that each step retires a whole block of pairs, turning a quadratic pair search into a linear one.
division: [silver, gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords: [two pointers, pair counting, partitioning, in place, index pairs, duplicate removal]
prerequisites:
    required: [foundations.complexity]
    recommended: [arrays.prefix-sums, searching.binary-search]
complexity:
    time: "O(n)"
    space: "O(1) in place, O(n) when a frequency map is needed"
assumptions:
    - The condition on a pair is monotone in the array order, so that an index that is retired can never be needed again.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Count or find the pairs of indices of one array that satisfy a condition |
| **Time** | $O(n)$ |
| **Auxiliary space** | $O(1)$ in place, $O(n)$ when a frequency map is needed |
| **Requires** | Two indices into the _same_ array, and a condition that is monotone in the index order |
| **Fails when** | The condition is not monotone, so a retired index can still take part in a valid pair |
| **Primary technique** | Retire a block of pairs at each step instead of testing them one at a time |
| **Sibling article** | The sorted-sequence scan is in [two pointers](/algorithms/searching/two-pointers) |

The technique is the same in every variant. Two indices travel through one array, and each movement of an index removes a set of candidate pairs that is _proved_ to contain no answer. The total work is linear because the removed sets are disjoint and together cover the whole table of pairs.

The word that separates this article from its sibling is the array. Here both indices point into the same sequence, usually with one always ahead of the other, and the technique is used for counting pairs, for partitioning an array in place, and for the pair questions of the "two elements" family. The scan that starts at one end of a _sorted_ array and closes in from the other is a different technique with a different justification, and it has its own article.

## Problem motivation

A warehouse keeps a ledger of $n$ shipments. Each shipment has a weight, and the ledger is sorted by weight. A crane can lift two shipments at once, but only if their total weight is strictly below $K$. How many pairs of shipments can the crane lift?

The constraints:

- $1 \le n \le 200\,000$ shipments.
- The weights are sorted in non-decreasing order.
- $1 \le K \le 10^9$.

Testing every pair is $n(n-1)/2 \approx 2 \cdot 10^{10}$ tests. At a hundred million tests per second, that is more than three minutes of pure comparison, and the contest time limit is one or two seconds.

The answer has to come from a different shape of argument. Notice what the question is really asking: not "which pairs work", but "how many pairs work". A test per pair is the wrong unit of work. The unit of work should be a _block_ of pairs, retired all at once because the sorted order proves that none of them can work.

That is the whole reason the technique exists. A single comparison retires an entire row or column of the pair table, and $n$ comparisons retire the whole table.

## Recognition patterns

Two pointers on one array is the right tool when all of the following hold.

- The answer is a **count** or a **set of index pairs**, and both indices belong to the same array.
- The pairs are **ordered**: the statement says $i < j$, so a pair is counted once and not twice.
- The condition on a pair is **monotone** in the index order, so that retiring one index retires every pair that uses it.
- The array can be **sorted** or is **already sorted**, unless the condition is decomposed into a lookup, in which case a frequency map replaces the second index.

The phrases that signal it are "how many pairs", "how many ways to choose two", "count the pairs of indices", "move the zeros to the end", "remove the duplicates", "partition the array into". The phrases that rule it out are "how many subsequences" (not contiguous and not a pair), and "the number of pairs" when the condition is arbitrary and not monotone, because then no block can be retired.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| $n \le 10^3$ | A quadratic solution is comfortable; the technique is optional |
| $n \ge 10^5$ and the condition is monotone | A quadratic solution is fatal; the technique is required |
| The array is sorted, or can be sorted in $O(n \log n)$ | The opposite-ends sweep becomes valid |
| The array is unsorted and the condition is an equality | A frequency map replaces the second index |
| The array is unsorted and the condition is a range | Sorting is required; say so, because the sort dominates |
| Pairs are unordered in the statement | Fix an order yourself, or every pair is counted twice |

The last row is the one that quietly doubles an answer. If the statement says "two shipments" and does not distinguish first from second, then the array $[1, 2]$ has one pair, not two.

<Synonyms terms="two pointers, twin pointers, index pair scan, pair counting, in place partition, slow and fast pointers" />

## Naive approach

The baseline is the double loop.

```cpp
long long countPairs(const std::vector<int>& a, int k) {
    long long count = 0;
    for (int i = 0; i < static_cast<int>(a.size()); ++i) {
        for (int j = i + 1; j < static_cast<int>(a.size()); ++j) {
            if (a[i] + a[j] < k) ++count;
        }
    }
    return count;
}
```

This is $O(n^2)$ and it is correct for every array, sorted or not. It is the reference implementation for the differential test: if the fast version disagrees with it on a random sorted input, one of the two is wrong.

The second baseline is the frequency map, which answers the equality version of the question in linear expected time.

```python
def count_equal_pairs(a, target):
    seen = {}
    total = 0
    for value in a:
        total += seen.get(target - value, 0)   # query before insert, so i < j
        seen[value] = seen.get(value, 0) + 1
    return total
```

The map is not a two-pointer solution, but it is the same _pattern_: the scan position plays the role of the leading index, and the map plays the role of the trailing index. The map makes the trailing index free to be any earlier position at all, at the cost of $O(n)$ space and of only supporting an exact equality condition.

## Key insight

The insight is that a comparison can retire a **block** of pairs rather than one pair.

Take the sorted array and the condition $a_i + a_j < K$, with $i < j$. Put two indices in the array, $l$ at the front and $r$ at the back, and consider the block of pairs

$$
\{(l, j) : l < j \le r\}.
$$

There are $r - l$ of them.

- If $a_l + a_r < K$, then every pair in the block qualifies, because $a_j \le a_r$ for every $j \le r$ and therefore $a_l + a_j \le a_l + a_r < K$. The block contributes $r - l$ to the count, and the index $l$ can be retired.
- If $a_l + a_r \ge K$, then no pair in the _column_ $\{(i, r) : l \le i < r\}$ qualifies, because $a_i \ge a_l$ for every $i \ge l$ and therefore $a_i + a_r \ge a_l + a_r \ge K$. The index $r$ can be retired.

Each step retires one index and removes one row or one column of the pair table. The table has $n(n-1)/2$ cells, and the algorithm retires a full row or column per step, so it finishes after at most $n$ steps.

The second half of the insight is why the indices never move backwards. A retired index is retired _with proof_: every pair that uses it has been counted or has been proved to fail. The proof holds for the rest of the run, because the array does not change. There is therefore never a reason to look at a retired index again, and moving backwards would only re-read pairs that were already settled.

This is the difference from a nested loop. A nested loop does not _retire_ anything: it visits each pair, decides, and forgets. A two-pointer scan settles a block at a time, and the blocks are disjoint.

The same shape appears in the partitioning problems, where there is no count to make. In "move the zeros to the end", the two indices are a read position and a write position, and the write position never overtakes the read position. Each step settles the fate of one element. In "remove the duplicates in place", a slow index marks the settled prefix and a fast index scans ahead, and again each step settles one element.

## Formal model

Let $a_1 \le a_2 \le \cdots \le a_n$ be a sorted array, let $K$ be a threshold, and let

$$
\mathcal{P} = \{(i, j) : 1 \le i < j \le n\}
$$

be the set of ordered index pairs.

<MathPanel type="definition" title="Definition">
A condition $C(i, j)$ on ordered pairs is **monotone in the array order** if
there is an index $k$ such that $C(i, j)$ is true for every pair with $i < j$
and $a_i + a_j \ge a_k$, and false for every pair with $i < j$ and
$a_i + a_j < a_k$. In the counting problems below, $C(i, j)$ is the predicate
$a_i + a_j < K$, and the condition is monotone because the sorted order makes
$a_i + a_j$ grow with both indices.
</MathPanel>

<MathPanel type="definition" title="Definition">
An index $l$ is **retired** at a moment when every pair $(l, j)$ with
$l < j$ has either been counted or proved to fail. Retiring an index is
permanent: the array does not change, so a proof obtained at one moment
remains valid at every later moment.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $a$ be sorted and let $l < r$. If $a_l + a_r < K$ then $C(l, j)$ holds for
every $j$ with $l < j \le r$, so exactly $r - l$ pairs of the block qualify.
If $a_l + a_r \ge K$ then $C(i, r)$ fails for every $i$ with $l \le i < r$, so
no pair of the column qualifies.
</MathPanel>

The lemma is the whole engine. The first case retires $l$ and counts $r - l$ pairs; the second case retires $r$ and counts none.

<MathPanel type="invariant" title="Invariant">
At the start of every iteration of the sweep, every pair $(i, j)$ with $i < l$
has been counted or proved to fail, and every pair $(i, j)$ with $j > r$ has
been proved to fail. The pairs that are neither counted nor ruled out are
exactly the pairs $(i, j)$ with $l \le i < j \le r$.
</MathPanel>

## Algorithm derivation

The state is the pair of indices $(l, r)$ and the running count.

1. Set $l = 1$, $r = n$ and $count = 0$.
2. While $l < r$: if $a_l + a_r < K$, add $r - l$ to the count and increase $l$. Otherwise decrease $r$.
3. Return the count.

The update rule is correct by the lemma. In the first case the $r - l$ pairs of the block all qualify, so adding them is right, and the pairs that used $l$ and an index beyond $r$ were already ruled out by the invariant. In the second case the column is empty of answers, so decreasing $r$ discards nothing that was counted.

The variant for "how many pairs have sum exactly $K$" on an unsorted array replaces the second index with a frequency map, and the ordering rule matters: the map must be queried _before_ the current value is inserted, otherwise the element is paired with itself and the pair $(i, i)$ is counted.

The in-place partitioning variant uses the same idea with a different vocabulary. In "move the zeros to the end" there are three indices: `low` is the boundary between the zeros and the non-zeros, `mid` is the scan position, and `high` is the boundary between the non-zeros and the twos. `low` and `mid` move right, `high` moves left, and no index ever moves past another, because the regions they mark are disjoint.

## Step-by-step execution

Take the sorted array $a = [1, 3, 4, 6, 8, 11]$ with $K = 10$, counting the pairs with $a_i + a_j < 10$.

- $l = 1$, $r = 6$: $1 + 11 = 12 \ge 10$. The column at index 6 holds no answer, so $r$ becomes 5.
- $l = 1$, $r = 5$: $1 + 8 = 9 < 10$. The block of four pairs $(1, 2), (1, 3), (1, 4), (1, 5)$ all qualify, so the count becomes 4 and $l$ becomes 2.
- $l = 2$, $r = 5$: $3 + 8 = 11 \ge 10$. The column at index 5 holds no answer, so $r$ becomes 4.
- $l = 2$, $r = 4$: $3 + 6 = 9 < 10$. The block of two pairs $(2, 3)$ and $(2, 4)$ qualify, so the count becomes 6 and $l$ becomes 3.
- $l = 3$, $r = 4$: $4 + 6 = 10 \ge 10$. The column at index 4 holds no answer, so $r$ becomes 3.
- $l = 3 = r$: the loop ends.

The answer is 6, and the six qualifying pairs of values are $(1, 3), (1, 4), (1, 6), (1, 8), (3, 4)$ and $(3, 6)$, which is exactly the set of qualifying pairs in the array. Six comparisons settled the whole table of 15 pairs.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The sweep returns the number of ordered pairs $(i, j)$ with $1 \le i < j \le n$
and $a_i + a_j < K$.
</MathPanel>

<MathPanel type="proof" title="Proof">
The invariant states that every pair with a smaller index below $l$ has been
counted or proved to fail, and every pair with a larger index above $r$ has
been proved to fail, so the unsettled pairs are exactly those with
$l \le i < j \le r$.

The invariant holds initially, because $l = 1$ and $r = n$ enclose every pair.

Suppose it holds at the start of an iteration.

If $a_l + a_r < K$, then by the lemma every pair $(l, j)$ with $l < j \le r$ qualifies, so there are $r - l$ of them. The algorithm adds $r - l$ to the count and retires $l$. The pairs that use $l$ and an index above $r$ were already proved to fail by the invariant, so retiring $l$ settles every pair that uses it, and the invariant is preserved for the new value of $l$.

If $a_l + a_r \ge K$, then by the lemma no pair $(i, r)$ with $l \le i < r$ qualifies, and the pairs $(i, r)$ with $i < l$ were already settled by the first half of the invariant. The algorithm retires $r$, and the invariant is preserved for the new value of $r$.

In both cases exactly one index is retired, so after at most $n - 1$ steps the indices meet. At that moment the unsettled set of pairs is empty, so every pair has been counted or proved to fail. The count is therefore the number of qualifying pairs. $\square$
</MathPanel>

## Complexity analysis

**Time: $O(n)$.** The loop runs at most $n - 1$ times, because each iteration retires exactly one index, and each iteration performs a constant amount of work. The bound does not depend on how many pairs qualify.

**Auxiliary space: $O(1)$** for the sweep and for the in-place partitioning variants, because the only state is a handful of indices and one counter. The frequency-map variant costs $O(n)$ expected space and $O(n)$ expected time, with the expectation coming from the hashing.

The sort is a real cost and must be counted. If the array arrives unsorted, sorting it costs $O(n \log n)$ and the sweep then costs $O(n)$, so the total is $O(n \log n)$ and not $O(n)$. On $n = 200\,000$ the sort is about $3.6 \cdot 10^6$ comparisons against the sweep's $2 \cdot 10^5$, and the sort dominates. When the answer must be $O(n)$, the frequency-map variant is the one to reach for, because it needs no sort.

<MathPanel type="complexity" title="Complexity">
Two pointers on one array: $O(n)$ time and $O(1)$ auxiliary space, provided
the array is already monotone in the way the pattern needs. With a
frequency map in place of the second index: $O(n)$ expected time and $O(n)$
space. With a sort in front: $O(n \log n)$ total.
</MathPanel>

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Sorted array, count the pairs with a sum below a bound | The sweep, counting a block at a time |
| Sorted array, find one pair with a given sum | The closing scan in [two pointers](/algorithms/searching/two-pointers) |
| Unsorted array, count the pairs with an exact sum | A frequency map, queried before inserting |
| Partition the array by a value, in place | Two indices, one read and one write |
| Remove the duplicates from an array, in place | A slow index and a fast index |
| The condition on a pair is not monotone | A hash map, a sort, or a different technique entirely |
| The question is about subsequences rather than pairs | Backtracking, not two pointers |

The fourth row is the one that is most often forgotten. "Move the zeros to the end" has no count to make and no sorted order, and it is still a two-pointer problem, because the technique is about retiring work rather than about sums.

## Recursion decision

The sweep and the partitioning variants are loops. There is no recursive formulation that improves on them, and writing one costs frames without buying anything.

The recursion question belongs to the algorithms that _use_ the pattern internally. A recursive partition, as in quicksort, holds the same two-index argument but nests it inside the recursion. With a random pivot the expected recursion depth is $O(\log n)$ and the worst case is $O(n)$ when the pivot is always the smallest or the largest element.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Recurse only with a random pivot; iterate for an adversarial input |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Use a loop; the stack is too small for a sorted input |
| Python | Interpreter limit of 1000 | 1000 frames | Use a loop; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Use a loop, and keep the pivot choice explicit |
| JavaScript | The V8 engine limit | About $10^4$ frames | Use a loop; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python. The sweep itself never crashes, because it holds no recursion at all.

## Implementation walkthrough

The line that decides everything is the comparison, and the line that is most often wrong is the count.

```cpp
if (a[l] + a[r] < k) {
    count += r - l;   // every pair of the block qualifies, not just one
    ++l;
} else {
    --r;             // the column holds no answer
}
```

Two details matter. The count adds `r - l`, not 1, because the whole block qualifies at once. And the comparison is strict, `<`, exactly as the statement demands; using `<=` changes the answer on every pair whose sum is exactly $K$.

For the frequency-map variant the ordering of the two statements is the whole correctness argument.

```python
total += seen.get(target - value, 0)   # count the partners seen so far
seen[value] = seen.get(value, 0) + 1     # then record this value
```

Reversing those two lines counts every element as its own partner, which adds $n$ to the answer on a run of equal values.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Retiring an index without a monotonicity proof | Pairs are discarded that still qualify | Write the discard proof down before the code |
| Adding 1 instead of $r - l$ to the count | The block is undercounted | Count the whole block |
| Using a strict comparison where the statement is not | Off-by-one on every boundary pair | Copy the comparison from the statement |
| Querying the frequency map after inserting | The element is paired with itself | Query first, insert second |
| Counting unordered pairs twice | The answer is exactly doubled | Fix the order $i < j$ and say so |
| Forgetting that a sort dominates the runtime | The solution is $O(n \log n)$ and not $O(n)$ | Count the sort in the complexity |
| Letting the write index overtake the read index while partitioning | Elements are lost | Keep the two regions disjoint |

### Why this fails: the unsorted array that loses a valid pair

The mistake that survives review is applying the sweep to an array that is not sorted, because the sweep looks so obviously correct on the sorted case that the assumption goes unexamined.

The smallest counterexample has three elements. Take $a = [5, 1, 2]$ and $K = 6$.

The correct answer is 1. The three pairs are $(5, 1)$ with sum 6, $(5, 2)$ with sum 7, and $(1, 2)$ with sum 3. Only the last one is strictly below 6.

The sweep runs like this.

- $l = 1$, $r = 3$: $5 + 2 = 7 \ge 6$, so $r$ becomes 2.
- $l = 1$, $r = 2$: $5 + 1 = 6 \ge 6$, so $r$ becomes 1.
- Now $l = r = 1$ and the loop ends with a count of 0.

The pair $(1, 2)$ in one-based notation, the elements 1 and 2, sums to 3 and should have been counted, and it was never even considered. The algorithm retired index 2 on the very first step, claiming that no pair using that index qualifies. The claim was built on the rule "no element is smaller than $a_l$", and on this array the element at index 2 is 1, which is _smaller_ than the element 5 at index 1. The sorted order that the discard proof depends on is exactly what is missing.

Two elements are not enough to break it, because with two elements there is only one pair and the single comparison decides it correctly. Three is the smallest array that exposes the flaw.

The lesson generalizes: **a retired index is only safe when the condition is monotone in the index order.** Without that, the sweep settles pairs by a rule that is false for the data in front of it.

## Variants and extensions

- **Three indices for three regions.** The Dutch national flag partitions an array into zeros, non-zeros and twos with three indices, and the same discipline applies: each index marks a boundary, and no index crosses another.
- **Two pointers with a multiset.** When the condition needs the _largest_ partner rather than an exact one, the second index becomes a balanced tree, and the technique becomes a merge of a sweep and an ordered structure.
- **Pairs with a difference instead of a sum.** The lemma is identical with $a_r - a_l$ in place of $a_l + a_r$, and the monotonicity requirement becomes that the array is sorted in the direction the difference grows.
- **Counting in blocks of equal values.** When the array has many equal elements, the count can be inflated by the frequency of the retiring index rather than by a running total of one.
- **The same pattern on a string.** The characters of a string are an array of integers, and the technique applies to "count the pairs of positions whose characters differ".
- **Pairs across two different arrays.** When the condition compares $a_i$ with $b_j$, the same sweep works after merging the two arrays, and the merge is the extra step.

## Contest strategy

Under time pressure the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide whether the question is a count or a single pair. A count is a sweep; a single pair is the closing scan.
2. Write the discard proof for each direction the indices can move. One sentence each. If a direction has no proof, the code is wrong.
3. Decide the block size. In the counting sweep the block is $r - l$ pairs; in the partitioning variant it is one element.
4. Fix the order convention, $i < j$, and put it in a comment.
5. Test three arrays by hand: an array of one element, an array of two equal elements, and an array with the answer on both ends.
6. If a sort is needed, say so, and check that the total complexity still fits the constraint.

## Worked problems

### Problem 1: counting the crane's pairs

**Restatement.** A sorted array of $n$ weights is given. Count the ordered pairs $(i, j)$ with $i < j$ and $a_i + a_j < K$. Constraints: $1 \le n \le 200\,000$, $K \le 10^9$.

**Naive baseline.** The double loop, at $2 \cdot 10^{10}$ tests.

**Insight.** One comparison settles a whole block of $r - l$ pairs, because the sorted order bounds every pair in the block by the two endpoints.

**Derivation.** Run the sweep of the algorithm derivation, adding $r - l$ on each retirement of the left index.

**Correctness.** The invariant of the correctness proof shows that every pair is counted or proved to fail exactly once.

**Complexity.** $O(n)$ time and $O(1)$ space, since the array arrives sorted.

**Common wrong approach.** Adding 1 instead of $r - l$. The result is a plausible number, roughly the number of blocks, and it is wrong on every input where a block is larger than one.

### Problem 2: counting the pairs with an exact sum

**Restatement.** An unsorted array of $n$ integers is given. Count the pairs $(i, j)$ with $i < j$ and $a_i + a_j = K$. Constraints: $1 \le n \le 200\,000$, values may repeat.

**Naive baseline.** The double loop, at $2 \cdot 10^{10}$ tests.

**Insight.** The partner of the current element must be _earlier_ in the array, so a map of the values seen so far answers the question in constant time.

**Derivation.** For each element, add the frequency of $K - a_i$ to the count, then insert $a_i$ into the map. The query precedes the insert, so the element is never its own partner.

**Correctness.** When the scan reaches index $j$, the map holds exactly the values at the indices before $j$, so the frequency of $K - a_j$ is the number of valid pairs ending at $j$. Every pair has exactly one larger index, so every pair is counted exactly once.

**Complexity.** $O(n)$ expected time and $O(n)$ space.

**Common wrong approach.** Inserting before querying. On an array of $n$ equal values with $K = 2a$, the answer jumps by $n$.

### Problem 3: moving the zeros to the end

**Restatement.** An array of $n$ integers is given. Rewrite it so that all the zeros come last and the relative order of the other elements is preserved. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Count the zeros, then copy every nonzero element to its final position with a second array. This costs $O(n)$ time and $O(n)$ space.

**Insight.** The write position never overtakes the read position, so the array can be rewritten in place.

**Derivation.** Keep two indices: `write` for the next nonzero slot and `read` for the scan. For each element read, if it is nonzero, copy it to `write` and increase `write`. At the end, fill the remaining slots with zeros.

**Correctness.** The invariant is that the prefix before `write` holds exactly the nonzero elements read so far, in their original order. Every nonzero element is copied to the next free slot, so the relative order is preserved, and the suffix after the last nonzero slot is exactly the number of zeros that were read.

**Complexity.** $O(n)$ time and $O(1)$ space.

**Common wrong approach.** Swapping the nonzero element with the element at `write`. That destroys the relative order of the nonzeros, which the statement requires.

## Practice progression

1. **Recognition.** Given a statement, decide whether two pointers on one array applies. Look for a count of pairs, an in-place partition, and a monotone condition. Check whether the array is sorted and whether the pairs are ordered.
2. **Direct application.** Implement the counting sweep and the zero partition, and verify both against a brute-force version on small random inputs.
3. **Adaptation.** Implement the sweep for a difference condition, for the count of pairs with an exact sum using a frequency map, and for the three-region partition.
4. **Combination.** Combine the sweep with a prefix sum array to count subarrays with a bounded sum, and with a hash map to count pairs whose values differ by at most $k$.
5. **Challenge.** Solve a problem where the block size is not $r - l$ but the product of two frequencies, and prove that the blocks still partition the table of pairs.
6. **Transfer.** Recognize the pattern in a problem that never mentions pairs: removing duplicates from a linked list, partitioning a permutation by its median, and merging two sorted lists.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What has to be true of the condition on a pair for the sweep to be valid? (Recognition patterns)
2. State the block-retirement lemma in both of its cases. (Formal model)
3. Why do the indices never move backwards, and what would go wrong if they did? (Key insight)
4. State the invariant of the sweep and say which half of it is used in each case of the proof. (Correctness proof)
5. Give the smallest array that breaks the sweep on unsorted input, and say which pair it loses. (Common mistakes)
6. Why does the counting sweep add $r - l$ rather than 1? (Implementation walkthrough)
7. When is the frequency-map variant better than the sweep, and what does it cost? (Algorithm selection)
8. What does a sort in front of the sweep do to the complexity? (Complexity analysis)
9. In the zero partition, which invariant is preserved at every step? (Worked problems)
10. Which language limits decide whether the partitioning variant may be written recursively? (Recursion decision)
11. How many comparisons does the sweep on $n = 200\,000$ make, and how many does the double loop make? (Problem motivation)
12. What changes when the statement counts unordered pairs? (Common mistakes)

## Further reading

- The closing scan on a sorted array, and the proof that makes it linear, is in [two pointers](/algorithms/searching/two-pointers).
- The window that moves across the data while carrying a frequency map is in [sliding window](/algorithms/searching/sliding-window).
- The running totals that turn a range condition into a single comparison are in [prefix sums](/algorithms/arrays/prefix-sums).
- The one-pointer version of the same idea, and the monotone predicate it needs, is in [binary search](/algorithms/searching/binary-search).
- The recursive form of the partition, with the pivot choice that keeps its depth logarithmic, is in [backtracking](/algorithms/enumeration/backtracking).
