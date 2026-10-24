---
id: arrays.subarray-sums
title: Subarray sums
summary: Turn every question about the sum of a contiguous block into a question about the difference of two prefix sums, and count the blocks with a frequency map.
division: [silver, gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords: [subarray sums, prefix sums, two sum, count subarrays, running total, frequency map]
prerequisites:
    required: [arrays.prefix-sums]
    recommended: [foundations.complexity, searching.binary-search]
complexity:
    time: "O(n) expected with a frequency map, O(n log n) without one"
    space: "O(n)"
assumptions:
    - The blocks being counted are contiguous, so that each block is the difference of two prefix sums.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Count or find the contiguous blocks of an array whose sum is a given value |
| **Time** | $O(n)$ expected with a frequency map, $O(n \log n)$ without one |
| **Auxiliary space** | $O(n)$ |
| **Requires** | A running total, so that a block sum is a difference rather than a sum |
| **Fails when** | The blocks are not contiguous, or the values are not numbers |
| **Primary technique** | Reduce every block to a pair of prefix indices, which is a two-sum problem |
| **Sibling article** | The prefix sum table itself is in [prefix sums](/algorithms/arrays/prefix-sums) |

A contiguous block of an array is determined by two indices, and its sum is the difference of two prefix sums. That is the entire reduction, and it is worth spelling out, because it converts a question about $O(n^2)$ blocks into a question about $O(n)$ prefix values with one linear scan and a map.

The counting version is the one that appears in contests, and it has a sharp edge: the map must contain the running total _before_ the current element is added, so that the empty block is never counted and the blocks that start at the first element are not missed.

## Problem motivation

A ledger of $n$ transactions has one amount per day, and the amounts may be negative, because a refund is a negative amount. A regulator asks how many stretches of consecutive days have a net total of exactly zero.

The constraints:

- $1 \le n \le 200\,000$ days.
- $-10^9 \le a_i \le 10^9$.
- The answer is a count, and it can be as large as $\frac{n(n+1)}{2}$.

Enumerating the blocks is $O(n^2) \approx 2 \cdot 10^{10}$ blocks, and even computing each sum in $O(1)$ from a prefix sum table does not help, because the enumeration itself is the cost.

Negative values are what make the problem interesting. A sliding window works when the values are non-negative, because then the sum of a block grows with its length and a window that is too long can be shrunk. With refunds in the mix, a block that sums to zero can be preceded by an arbitrary amount, so the window idea collapses and the problem needs a different reduction.

The reduction is to notice that a block is a difference of two running totals, and that the question "how many differences equal zero" is a two-sum question about the running totals.

## Recognition patterns

Subarray sums are the right tool when all of the following hold.

- The object is a **contiguous block** of the array, sometimes called a subarray, a segment, a stretch or an interval.
- The question is about the **sum** of the block, or about a **count** of blocks with a given sum.
- The blocks are **contiguous**, not subsequences, and the order of the elements inside a block does not matter beyond the sum.
- The values may be **negative**, which rules the sliding window out.

The phrases that signal it are "the number of subarrays with sum $k$", "how many segments have a total of", "the longest subarray with sum at most $x$", "find two segments that add up to". The phrases that rule it out are "the number of subsequences" (not contiguous, and a different technique), "the number of subsets" (a subset enumeration), and "the sum of the elements at the given positions" (not a block).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 10^3$ | Enumerating the blocks is fine |
| $n \ge 10^5$ | Enumeration is fatal; the prefix reduction is required |
| All values are non-negative | A sliding window answers it in $O(n)$ with $O(1)$ space |
| Values may be negative | The sliding window is invalid; the prefix reduction is required |
| Values may be negative and the map is unavailable | Sort the prefix sums and use two pointers, at $O(n \log n)$ |
| The block is defined by positions, not by a sum | A prefix sum table answers it in $O(1)$ per query |

The fourth row is the decisive one, and it is worth stating as a rule: **a sliding window needs the values to be non-negative, and a prefix sum reduction works for any values.** The two techniques answer the same question with different assumptions.

<Synonyms terms="subarray sums, subsegment sums, prefix sum differences, count subarrays with sum, two sum reduction, running totals" />

## Naive approach

The baseline enumerates the blocks.

```python
def count_zero_sum(a):
    count = 0
    for i in range(len(a)):
        total = 0
        for j in range(i, len(a)):
            total += a[j]
            if total == 0:
                count += 1
    return count
```

This is $O(n^2)$ and it is correct for every array, with negative values included. It is the reference implementation for the differential test.

The second baseline keeps a running total and a hash map, which is the technique itself. It is included here because the difference between it and the implementation above is one data structure, and that data structure is where the subtlety lives.

## Key insight

The insight is that **a block is a difference of two running totals**.

Define the prefix sums by

$$
P_0 = 0, \qquad P_j = a_1 + a_2 + \cdots + a_j \quad (1 \le j \le n).
$$

The sum of the block from position $l$ to position $r$ is

$$
a_l + a_{l+1} + \cdots + a_r = P_r - P_{l-1}.
$$

So the blocks of the array are in one-to-one correspondence with the pairs of prefix indices $(i, j)$ with $0 \le i < j \le n$, and the block from $i+1$ to $j$ has sum $P_j - P_i$.

The question "how many blocks have sum $K$" is therefore the question "how many pairs $(i, j)$ with $i < j$ satisfy $P_j - P_i = K$". Rewriting,

$$
P_j - P_i = K \iff P_i = P_j - K.
$$

That is a two-sum question over the prefix sums, with the extra requirement that $i$ comes before $j$. The requirement is handled by scanning from left to right and keeping a map of the prefix sums already seen: when the scan is at $j$, the map holds exactly the values $P_0, P_1, \ldots, P_{j-1}$, and the number of blocks ending at $j$ with sum $K$ is the frequency of $P_j - K$ in that map.

The second half of the insight is about the condition. Because $P_j - P_i$ can be anything, the pair $(i, j)$ is genuinely a two-sum, and the classic "sort the array and use two pointers" solution does not apply: the prefix sums are not sorted, and sorting them would destroy the order constraint $i < j$. The frequency map is what preserves the order.

The same reduction answers the "at most $K$" version. The number of blocks with sum at most $K$ is the number of pairs $(i, j)$ with $i < j$ and $P_i \ge P_j - K$, which is a count of earlier prefix sums above a threshold. With a balanced tree over the earlier prefix sums, that count is $O(\log n)$ per position. With non-negative values the sliding window does the same job in $O(1)$ per position, because the sum of a block then grows with its length.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the array, and let $P_0 = 0$ and $P_j = \sum_{k=1}^{j} a_k$.

::: math definition Definition
A **block** of the array is a pair of indices $(l, r)$ with $1 \le l \le r \le n$. Its sum is $\sigma(l, r) = P_r - P_{l-1}$.
:::

::: math definition Definition
The **prefix pairs** of the array are the pairs $(i, j)$ with $0 \le i < j \le n$. The map $(l, r) \mapsto (l-1, r)$ is a bijection from the blocks to the prefix pairs, and it preserves the sum: $\sigma(l, r) = P_j - P_i$ for the pair $(i, j) = (l-1, r)$.
:::

::: math lemma Lemma
Let $c$ be a map that stores, for each prefix value, the number of times it has been seen. If the scan inserts $P_0, P_1, \ldots, P_{j-1}$ into $c$ before the position $j$ is processed, then $c(P_j - K)$ is exactly the number of blocks ending at $j$ whose sum is $K$.
:::

The lemma is the correctness of the counting algorithm. Every prefix index $i < j$ with $P_i = P_j - K$ gives a block $(i+1, j)$ with sum $K$, and every block ending at $j$ with sum $K$ gives such an $i$.

::: math invariant Invariant
When the scan is at position $j$, the map holds exactly the values $P_0, P_1, \ldots, P_{j-1}$, each with its multiplicity. The running total of the answer is the number of blocks ending at a position at most $j$ whose sum is $K$.
:::

## Algorithm derivation

The state is the current prefix sum, the map of the prefix sums seen so far, and the running answer.

1. Set the running total $P = 0$, insert $0$ into the map, and set the answer to zero.
2. For each value $a_j$ of the array:
3. Add $a_j$ to the running total, so that the running total is now $P_j$.
4. Add the frequency of $P_j - K$ to the answer.
5. Insert $P_j$ into the map.

Step 1 seeds the map with $P_0 = 0$, which is the prefix value before the first element. Without it, every block that starts at the first position is missed.

Step 4 must come before step 5. If the insertion came first, the map would contain $P_j$ itself, and the count would include the block $(j+1, j)$, which is empty and has sum zero. The count would then be right only for $K = 0$ and wrong for every other $K$, by exactly one per position.

The variant for the count of blocks with sum at most $K$ replaces the exact lookup with an order-statistic query, and the variant for the count with sum exactly $K$ on non-negative values is a sliding window that counts every shrink.

## Step-by-step execution

Take $a = [1, -1, 0, 1]$ and $K = 0$. The blocks with sum zero are the ones whose sum is zero; the prefix sums are $P_0 = 0$, $P_1 = 1$, $P_2 = 0$, $P_3 = 0$, $P_4 = 1$.

- Start: the map holds $\{0: 1\}$ and the answer is 0.
- $j = 1$, value 1. The running total is $P_1 = 1$. The map holds 0 once, and $P_1 - K = 1$ is not in it, so the answer stays 0. Insert 1. The map is $\{0: 1, 1: 1\}$.
- $j = 2$, value $-1$. The running total is $P_2 = 0$. The map holds 0 once, and $P_2 - K = 0$ is in it once, so the answer becomes 1. That one block is $(1, 2)$, the elements 1 and $-1$. Insert 0. The map is $\{0: 2, 1: 1\}$.
- $j = 3$, value 0. The running total is $P_3 = 0$. The map holds 0 twice, so the answer becomes 3. The blocks are $(1, 3)$ and $(3, 3)$. Insert 0. The map is $\{0: 3, 1: 1\}$.
- $j = 4$, value 1. The running total is $P_4 = 1$. The map holds 1 once, so the answer becomes 4. That block is $(2, 4)$, the elements $-1, 0, 1$. Insert 1. The map is $\{0: 3, 1: 2\}$.

The answer is 4, and the four blocks are the elements 1 and $-1$; the elements 1, $-1$ and 0; the single element 0; and the elements $-1$, 0 and 1. The empty block was not counted, because the insertion of $P_j$ always follows the query.

## Correctness proof

::: math theorem Theorem
The algorithm returns the number of contiguous blocks whose sum is $K$.
:::

::: math proof Proof
The invariant states that when the scan is at position $j$, the map holds exactly the values $P_0, \ldots, P_{j-1}$ with their multiplicities, and the answer is the number of blocks ending at a position at most $j$ with sum $K$.

The invariant holds before the scan starts, because the map holds $P_0 = 0$ once and there are no blocks yet.

Suppose it holds before the iteration for $j$. The running total becomes $P_j = P_{j-1} + a_j$, which is correct by the definition of the prefix sums.

By the lemma, the frequency of $P_j - K$ in the map is exactly the number of blocks ending at $j$ whose sum is $K$. Adding it to the answer therefore counts each such block once, and the answer becomes the number of blocks ending at a position at most $j$ with sum $K$.

Inserting $P_j$ into the map makes the map hold exactly $P_0, \ldots, P_j$, which is the invariant for the next iteration.

The loop ends after position $n$, so the answer counts every block of the array whose sum is $K$, and each exactly once, because a block has a unique last position. $\square$
:::

## Complexity analysis

**Time: $O(n)$ expected.** The scan is linear, and each map operation costs $O(1)$ expected. The expectation comes from the hashing; a worst-case bound needs a different map.

**Auxiliary space: $O(n)$**, because the map holds up to $n+1$ distinct prefix values. The prefix sums themselves do not have to be stored, only the running total, which keeps the working set at $O(n)$ for the map and $O(1)$ for everything else.

The variant that sorts the prefix sums and uses two pointers costs $O(n \log n)$ time and $O(n)$ space, and it needs no hash map, which matters in languages without a fast hash map or when the hash map is the target of adversarial input.

::: math complexity Complexity
Counting blocks with a given sum: $O(n)$ expected time and $O(n)$ space with a hash map, and $O(n \log n)$ time and $O(n)$ space by sorting the prefix sums. The non-negative special case is $O(n)$ time and $O(1)$ space with a sliding window.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count the blocks with sum exactly $K$, any values | Prefix sums and a frequency map |
| Count the blocks with sum exactly $K$, all values non-negative | A sliding window, in [sliding window](/algorithms/searching/sliding-window) |
| Count the blocks with sum at most $K$, all values non-negative | A sliding window |
| Count the blocks with sum at most $K$, any values | Prefix sums and an order-statistic tree |
| Find one block with sum exactly $K$ | Prefix sums and a frequency map, stopping at the first hit |
| Find two blocks that together cover the array with sum $K$ | Prefix sums, a map of the earliest prefix index per value |
| The sum of the block between two given positions | A prefix sum table, in [prefix sums](/algorithms/arrays/prefix-sums) |
| Count the subsequences with sum $K$ | Not this technique; the blocks are not contiguous |

## Recursion decision

The counting algorithm is a loop, and the map is the whole state. There is no recursive formulation that helps.

The recursion question belongs to the alternative that avoids the hash map. The divide-and-conquer count sorts the prefix sums and, at each merge step, counts the cross pairs whose difference is $K$ with two pointers. That recursion has depth $O(\log n)$, which is safe in every language.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursive merge sort is fine, since its depth is $\log_2 n$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Fine |
| Python | Interpreter limit of 1000 | 1000 frames | Fine at depth about 18, but the merge sort is slower than the hash map |
| Pascal | The operating system stack | Depends on the platform | Fine |
| JavaScript | The V8 engine limit | About $10^4$ frames | Fine |

The failure mode to avoid is not the depth of the sort but the temptation to write the counting itself recursively over the blocks, which has depth $O(n)$ and crashes on every language for $n = 200\,000$.

## Implementation walkthrough

The two lines that carry the technique are the query and the insertion, and their order is the whole correctness argument.

```cpp
count += seen[prefix - k];   // the blocks that end here
seen[prefix]++;              // and only then is this prefix available as a start
```

Two details matter. The map is seeded with the prefix value 0, which corresponds to $P_0$, so that the blocks starting at the first element are counted. And the query uses the value _before_ the increment, so that a block of length zero is never counted.

For the "at most $K$" variant the exact lookup becomes an order statistic, and the count of earlier prefix sums that are at least $P_j - K$ is the size of the map minus the count of those that are smaller.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting to seed the map with 0 | Every block starting at the first element is missed | Insert $P_0 = 0$ before the loop |
| Inserting before querying | The empty block is counted | Query first, insert second |
| Assuming the values are non-negative | A sliding window is used and it misses blocks | Use the prefix reduction |
| Comparing the running total to $K$ instead of looking up $P_j - K$ | Only blocks with sum exactly $P_j$ are found | Look up the complementary value |
| Forgetting that the answer can exceed $2^{31}-1$ | An overflow on a large count | Use a 64-bit counter |
| Sorting the prefix sums and then using the map | The order constraint $i < j$ is lost | Either the map or the sort, not both |
| Counting the empty block when $K = 0$ | The answer is one too large | Query before inserting |

### Why this fails: the missing prefix zero

The mistake that survives review is forgetting to seed the map with the running total before the first element. It is invisible on a random test with a small answer, and it is off by a small constant, so it often passes a quick check.

The smallest counterexample has one element. Take $a = [3]$ and $K = 3$.

The correct answer is 1: the single block consisting of the element 3 has sum 3.

The algorithm with an empty map starts with the running total at 0, and the running total only becomes 3 after the first element is added. At that point the map still holds nothing, because the only entry would have been the initial 0, which was never inserted. The lookup of $P_1 - K = 0$ finds nothing, the answer stays 0, and the block is missed.

The failure is systematic rather than a constant offset. Every block that starts at the first position is missed, and only those blocks. On $a = [1, -1, 1]$ with $K = 0$ the correct answer is 2, the blocks $(1, 2)$ and $(2, 3)$, and the flawed algorithm reports 1.

The second failure, in the other direction, is inserting before querying. Take $a = [1]$ and $K = 0$. The correct answer is 0, because the only block has sum 1. The flawed algorithm inserts $P_1 = 1$, then looks up $P_1 - K = 1$, finds the entry it just inserted, and counts the empty block $(2, 1)$. The answer is 1.

The lesson generalizes: **the map must contain exactly the prefix sums that come before the current position, and the empty block must never be counted.**

The third failure is the assumption that the values are non-negative. Take $a = [2, 2, -1]$ with $K = 3$. The blocks with sum 3 are exactly one, the whole array, since $2 + 2 - 1 = 3$. A sliding window that shrinks while the sum exceeds $K$ arrives at $r = 2$ with a window that starts at index 2, holding the elements 2 and $-1$ with sum 1, and the valid block that starts at index 1 is gone, because the window was forced to move past it at an earlier step. The window reports 0.

## Variants and extensions

- **The at most $K$ variant.** Replace the exact lookup with an order-statistic query over the earlier prefix sums.
- **The all subarrays variant.** With the window technique, the same shape answers "how many subarrays have all elements at most $K$", where the running quantity is a maximum rather than a sum.
- **Two blocks with a given combined sum.** The map stores the earliest prefix index for each prefix value, and a second scan finds the block that complements the first.
- **The longest block with sum $K$.** The map stores the earliest prefix index per value, and the answer is the maximum distance between the current position and the stored index.
- **Blocks with a sum in a range.** The same reduction with a range count over the earlier prefix sums.
- **Blocks in a two-dimensional grid.** The reduction applies row by row, with the prefix sums of each row, and the counting is done with a map per row.
- **The merge-sort count.** Sorting the prefix sums and counting the cross pairs at each merge counts the blocks with $O(n \log n)$ time and no hash map at all.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Check whether the values can be negative. If they can, the sliding window is out and the prefix reduction is in.
2. Write down the reduction before writing the code: a block $(l, r)$ is the pair $(l-1, r)$ of prefix indices.
3. Seed the map with 0, and keep the query before the insertion.
4. Use a 64-bit counter, because the answer can be $\frac{n(n+1)}{2}$, which is about $2 \cdot 10^{10}$.
5. If a hash map is not available, sort the prefix sums and count the pairs with two pointers, and prove the order constraint in the write-up.
6. Test three arrays by hand: a single element, an array of zeros, and an array with one negative value in the middle.

## Worked problems

### Problem 1: the stretches with a net total of zero

**Restatement.** Given $n$ amounts, some of them negative, count the contiguous blocks whose sum is zero. Constraints: $1 \le n \le 200\,000$, $-10^9 \le a_i \le 10^9$.

**Naive baseline.** Enumerating the blocks, at $O(n^2)$.

**Insight.** A block is a difference of two prefix sums, so a block sums to zero exactly when two prefix sums are equal.

**Derivation.** Run the algorithm of the derivation with $K = 0$, seeding the map with 0.

**Correctness.** The theorem shows that each block is counted exactly once, at its last position.

**Complexity.** $O(n)$ expected time and $O(n)$ space.

**Common wrong approach.** Forgetting to seed the map with 0, which loses every block that starts at the first position.

### Problem 2: the longest block with sum zero

**Restatement.** Given $n$ amounts, find the length of the longest contiguous block whose sum is zero, and its endpoints. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Enumerating the blocks, at $O(n^2)$.

**Insight.** Two equal prefix sums mark a zero-sum block between them, so the longest one joins the earliest and the latest occurrence of the same prefix value.

**Derivation.** Keep a map from each prefix value to the earliest index where it appeared. At each position, look up the current prefix value; if it is in the map, the block from that index to the current one sums to zero, and the answer is the longest such block.

**Correctness.** A block $(i+1, j)$ sums to zero exactly when $P_i = P_j$, and for a fixed $j$ the longest such block uses the earliest $i$ with that value, which is what the map stores.

**Complexity.** $O(n)$ expected time and $O(n)$ space.

**Common wrong approach.** Overwriting the stored index with the most recent one, which finds the shortest block instead of the longest.

### Problem 3: the number of blocks with sum at most $K$

**Restatement.** Given $n$ amounts, some of them negative, count the contiguous blocks whose sum is at most $K$. Constraints: $1 \le n \le 200\,000$, $-10^9 \le a_i \le 10^9$, $K \ge 0$.

**Naive baseline.** Enumerating the blocks, at $O(n^2)$.

**Insight.** The block count is the number of pairs of prefix indices with $P_i \ge P_j - K$, which is a range count over the earlier prefix sums.

**Derivation.** Maintain an order-statistic tree of the earlier prefix sums. At position $j$, count the entries that are at least $P_j - K$ and add that to the answer, then insert $P_j$.

**Correctness.** Each block is counted at its last position, and the tree holds exactly the earlier prefix sums, so the range count is exactly the number of valid blocks ending there.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Using a sliding window, which is only valid when the values are non-negative.

## Practice progression

1. **Recognition.** Given a statement, decide whether the prefix reduction applies. Look for "contiguous", "subarray", "segment", and check whether the values can be negative.
2. **Direct application.** Implement the count of blocks with sum exactly $K$, and verify it against the enumerating brute force on small random inputs, including negative values.
3. **Adaptation.** Implement the longest block with sum $K$, and the count of blocks with sum at most $K$ using an order-statistic tree.
4. **Combination.** Combine the prefix reduction with a frequency map to find two blocks that together cover the array, and with a sort to count the blocks with no hash map at all.
5. **Challenge.** Solve the two-dimensional version, where the blocks are rectangles in a grid, and show that the reduction applies row by row with one map per row.
6. **Transfer.** Recognize the reduction in a different shape: the number of zero-sum subsequences is a different question, but the counting of pairs of equal prefix sums reappears in the maximum subarray problem and in the balance point of an array.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the bijection between the blocks of an array and the pairs of prefix indices? (Formal model)
2. Why must the map be seeded with zero? (Common mistakes)
3. Why must the query come before the insertion? (Common mistakes)
4. When does the sliding window become valid, and when does it stop being valid? (Algorithm selection)
5. State the lemma that connects the map lookup to the number of blocks ending at a position. (Formal model)
6. Give the smallest array that breaks the algorithm when the map is not seeded. (Common mistakes)
7. What is the largest possible answer, and why does the counter have to be 64 bits? (Complexity analysis)
8. How do you count the blocks with sum at most $K$ when the values can be negative? (Key insight)
9. Why does sorting the prefix sums not work with the frequency map? (Key insight)
10. What is the time and space of the version that avoids the hash map? (Variants and extensions)
11. Why does the answer have to be a 64-bit counter, and what is its maximum? (Contest strategy)
12. Which languages would break on a recursive version, and how deep would it go? (Recursion decision)

## Further reading

- The prefix sum table, and the convention about indexing and widths, is in [prefix sums](/algorithms/arrays/prefix-sums).
- The window that answers the non-negative version of this problem is in [sliding window](/algorithms/searching/sliding-window).
- The scan that closes in from both ends, which counts the pairs of prefix sums without a map, is in [two pointers](/algorithms/searching/two-pointers).
- The two-sum problem that the reduction produces is in [binary search](/algorithms/searching/binary-search).
- The other way to turn a large value range into a small one is in [coordinate compression](/algorithms/arrays/coordinate-compression).
