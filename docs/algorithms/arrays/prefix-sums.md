---
id: arrays.prefix-sums
title: Prefix sums
summary: Precompute the running totals of an array once, so that every later range sum is a single subtraction.
division: [silver]
subjects: [arrays]
level: introductory
importance: core-prerequisite
keywords: [prefix sums, cumulative sum, running sum, range sum, partial sums]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.sorting, searching.binary-search]
complexity:
    time: "O(n + q)"
    space: "O(n)"
assumptions:
    - Queries are given after the array, so the prefix sums can be precomputed once.
implementations: arrays.prefix-sums
visualization: arrays.prefix-sums
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="arrays.prefix-sums" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="arrays.prefix-sums" />

Prefix sums are a way of spending $O(n)$ once so that every later question about a range of the array costs $O(1)$. The technique is to store the running total of the array: the sum of the first element, the sum of the first two, and so on. The sum of any range is then the difference of two stored totals.

The whole idea is one subtraction, and the whole difficulty is in the conventions around it: whether the array is indexed from zero or from one, whether the stored array has $n$ entries or $n + 1$, and whether the accumulator is wide enough for the largest value the statement allows.

The construction costs $O(n)$ time and $O(n)$ space, and each query costs $O(1)$ time, so a run with $n$ values and $q$ queries costs $O(n + q)$. The technique is only available when the array does not change after the queries are known, and that assumption is worth more than the arithmetic.

## Problem motivation

A sensor records the temperature of a room once a minute for a year, and stores the results in an array $a$ of $n$ values. A researcher then asks $q$ questions of the form "what was the average temperature between minute $l$ and minute $r$?".

The constraints:

- $1 \le n \le 100\,000$ readings.
- $1 \le q \le 100\,000$ questions.
- $|a_i| \le 10^9$, so a range sum can reach $10^{14}$ in magnitude.
- The readings never change.

The naive answer to each question is to add up the values in the range, which costs $O(r - l + 1)$ and therefore $O(nq) = 10^{10}$ additions over the whole run. That is far too slow, and it is slow for a reason that has nothing to do with the arithmetic: every question recomputes information that the previous question already computed.

Look at what the sum of a range is made of. The sum of $a_l$ through $a_r$ is the sum of the first $r$ values minus the sum of the first $l - 1$ values, because the second sum contains everything the first one contains except for the part we want. If those two partial sums are already stored, the answer is one subtraction.

That is the entire technique, and this article is about the details that make it work.

## Recognition patterns

Prefix sums are the right tool when all of the following hold.

- The array is **static**: no element is ever changed after the queries are known.
- There are **many** queries, or at least many more than one, and each query is about a **range** of the array.
- The quantity being queried is **additive**: a sum, a count of marked cells, a total weight.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $q = 1$ | Prefixing costs $O(n)$ for one query, and so does a single scan; prefer the scan |
| $q \ge n$ | Prefixing is clearly worth it: $O(n + q)$ against $O(nq)$ |
| Values are changed between queries | Rules out prefix sums; use a Fenwick tree |
| The queries arrive before the values | Rules out prefix sums; the totals do not exist yet |
| A maximum or minimum over a range is wanted | Rules out prefix sums; sums do not invert |
| $n \le 10^7$ and the memory limit is tight | The $n+1$ totals cost $8n$ bytes, so 80 MB; check the limit |

The phrases in a statement that signal this technique are "the array does not change", "given $q$ queries", "for each query" and "the sum of the elements from $l$ to $r$". The phrase that rules it out is "after each operation" or "the value at position $i$ is updated".

<Synonyms terms="prefix sums, cumulative sum, running sum, partial sums, summed area table" />

## Naive approach

The baseline is to add up the range for every query.

```python
for l, r in queries:
    total = 0
    for i in range(l - 1, r):
        total += a[i]
    print(total)
```

This is $O(nq)$ and it is the reference implementation for the differential test. If a faster version disagrees with it on a random input, one of the two is wrong.

There is a second baseline that is worth knowing, because it is the one people reach for when the queries arrive in order and it is only a constant factor better. Keep the sum of the previous range and repair it: when the new range is the old range shifted to the right, subtract the value that left it and add the value that entered it.

```python
total = 0
for l, r in queries:
    if r > previous_r:
        for i in range(previous_r, r):
            total += a[i]
    if l < previous_l:
        for i in range(l, previous_l):
            total -= a[i]
    previous_l, previous_r = l, r
```

This is a genuine improvement, and it is still $O(nq)$ in the worst case, because the ranges can jump around arbitrarily. It also has a bad property: it only works when the queries arrive in a particular order, so the query list has to be read before it can be answered. Prefixing has no such requirement, which is why it is the better answer even when the queries are sorted.

## Key insight

The insight is that a range sum is a difference of two prefix sums.

Write the sum of a range as a telescoping sum, where each term cancels against the next:

$$
\sum_{i=l}^{r} a_i \;=\; (a_1 + a_2 + \cdots + a_r) \;-\; (a_1 + a_2 + \cdots + a_{l-1}).
$$

The two sums in parentheses are exactly the running totals that the technique stores. The terms $a_1$ through $a_{l-1}$ appear in both and cancel, and what is left is the range we wanted.

So define the prefix array $P$ with $n + 1$ entries:

$$
P[0] = 0, \qquad P[i] = P[i-1] + a_i \quad \text{for } 1 \le i \le n.
$$

Then $P[i]$ is the sum of the first $i$ values, and the answer to a query is

$$
\operatorname{sum}(l, r) \;=\; P[r] - P[l-1].
$$

The empty prefix $P[0] = 0$ is what makes the formula work for a query that starts at the first element: $P[r] - P[0] = P[r]$. Storing the prefixes with an offset of one, from $P[0]$ to $P[n]$, is the reason the array has $n + 1$ entries and not $n$.

## Visual intuition

The laboratory below draws the array and the running totals above it. Each bar is a prefix sum, so the height of the $i$-th bar is the total of the first $i$ values.

A range query is then a subtraction of two bar heights. The segment between the bar at $l - 1$ and the bar at $r$ has exactly the height of the range sum, because the lower bar is the part of the total that belongs before the range and the upper bar is the total that belongs up to the end of it. The length of the highlighted segment is the answer.

Notice that the bars move up and down as the values themselves do: a negative reading pulls the running total down. The technique does not need the values to be positive, which is worth remembering, because the "cumulative sum" intuition sometimes suggests otherwise.

<AlgorithmPlayer algorithm="arrays.prefix-sums" />

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, indexed from one.

::: math definition Definition
The **prefix sum** $P[i]$ is the sum of the first $i$ values of the array:

$$
P[i] \;=\; \sum_{j=1}^{i} a_j \quad \text{for } 0 \le i \le n,
$$

with $P[0] = 0$ by convention. The array $P$ has $n + 1$ entries.
:::

::: math definition Definition
The **range sum** of the inclusive range $[l, r]$ is $S(l, r) = \sum_{i=l}^{r} a_i$, and it is $0$ when $l > r$.
:::

::: math lemma Lemma
For every $1 \le l \le r \le n$, the range sum satisfies $S(l, r) = P[r] - P[l-1]$.
:::

::: math recurrence Recurrence
The prefix sums are computed by the recurrence

$$
P[0] = 0, \qquad P[i] = P[i-1] + a_i \quad \text{for } i = 1, 2, \ldots, n.
$$

Every entry depends on exactly one earlier entry, so the array is built in a single left-to-right pass.
:::

## Algorithm derivation

The state is the prefix array $P$ of $n + 1$ entries, initialized so that $P[0] = 0$.

The update rule is: for $i$ from $1$ to $n$, set $P[i] = P[i-1] + a_i$.

The rule is correct by induction. Before the loop, $P[0] = 0$ is the sum of the first zero values, which is the empty sum. If $P[i-1]$ is the sum of the first $i - 1$ values, then adding $a_i$ gives the sum of the first $i$ values, which is $P[i]$.

The query rule is: answer $S(l, r)$ with $P[r] - P[l-1]$. By the lemma, that difference is exactly the range sum, because the terms before the range appear in both prefix sums and cancel.

The one structural choice that deserves a paragraph is the offset. The array is indexed from one in the problem, and the prefix array is indexed from zero, with $P[i]$ meaning "the sum of the first $i$ values". This offset is what makes $P[l-1]$ the right term to subtract for a range that starts at $l$, and it is the reason the prefix array has $n + 1$ entries. An alternative convention indexes the prefix array from one and stores $P[i] = a_1 + \cdots + a_i$ with $P[0] = 0$ unused; that wastes a slot and invites off-by-one errors, and this article does not use it.

::: math invariant Invariant
After the update for index $i$, the entries $P[0], P[1], \ldots, P[i]$ hold the sums of the first $0, 1, \ldots, i$ values of the array.
:::

## Step-by-step execution

Take the array $a = [3, -1, 4, 1, -5]$, indexed from one.

1. $P[0] = 0$.
2. $i = 1$: $P[1] = P[0] + a_1 = 0 + 3 = 3$.
3. $i = 2$: $P[2] = P[1] + a_2 = 3 + (-1) = 2$.
4. $i = 3$: $P[3] = P[2] + a_3 = 2 + 4 = 6$.
5. $i = 4$: $P[4] = P[3] + a_4 = 6 + 1 = 7$.
6. $i = 5$: $P[5] = P[4] + a_5 = 7 + (-5) = 2$.

The prefix array is $P = [0, 3, 2, 6, 7, 2]$. Now the queries.

- The range $[2, 4]$ is $P[4] - P[1] = 7 - 3 = 4$, which is $(-1) + 4 + 1 = 4$. Correct.
- The range $[1, 5]$ is $P[5] - P[0] = 2 - 0 = 2$, which is $3 - 1 + 4 + 1 - 5 = 2$. Correct.
- The range $[3, 3]$ is $P[3] - P[2] = 6 - 2 = 4$. Correct.

Notice that the prefix array is not sorted and is not monotone: it goes down at index two and again at index five. Nothing in the technique requires it to be, because no binary search is performed on it. That is the difference between prefix sums and the range-query structures, which do require an order.

## Correctness proof

::: math theorem Theorem
The construction produces a prefix array $P$ with $P[0] = 0$ and $P[i] = P[i-1] + a_i$, and for every query $(l, r)$ the program prints $S(l, r)$, the sum of the values from $l$ to $r$.
:::

::: math proof Proof
First the construction. The loop sets $P[0] = 0$ before it starts, which is the sum of the first zero values. Suppose the entry $P[i-1]$ holds the sum of the first $i - 1$ values. The update sets $P[i] = P[i-1] + a_i$, which is the sum of the first $i$ values. By induction, every entry of $P$ holds the sum of the corresponding prefix, and in particular $P[r]$ is the sum of the first $r$ values and $P[l-1]$ is the sum of the first $l-1$ values.

Now the query. Subtracting the two sums gives

$$
P[r] - P[l-1] \;=\; \sum_{j=1}^{r} a_j - \sum_{j=1}^{l-1} a_j \;=\; \sum_{j=l}^{r} a_j,
$$

because the first $l - 1$ terms appear in both sums and cancel. That is $S(l, r)$, so the printed value is correct. $\square$
:::

::: math proof Proof
The clipping rule in the reference program preserves correctness. A query whose range leaves the array is replaced by its intersection with the array, and a range that is empty after clipping has no values to sum, so the sum of the empty range is $0$, which the program prints.
:::

## Complexity analysis

**Building the prefix array: $O(n)$ time.** The loop performs one addition and one assignment per element, and it runs once.

**Each query: $O(1)$ time.** The answer is one subtraction of two array entries. There is no scan, and no search inside the prefix array.

**The whole run: $O(n + q)$ time** and **$O(n)$ auxiliary space**, since the prefix array has $n + 1$ entries and the queries are read and answered one at a time.

::: math complexity Complexity
Prefix sums over an array of $n$ values: $O(n)$ time to build, $O(1)$ time per query, $O(n + q)$ time in total, and $O(n)$ extra space for the $n + 1$ prefix entries.
:::

The width of the accumulator is part of the complexity statement, because it decides whether the answer is even correct. With $n = 10^5$ values of magnitude up to $10^9$, a prefix sum can reach $10^{14}$, which does not fit in a 32-bit signed integer, whose largest value is about $2.1 \cdot 10^9$. The reference implementations therefore use a 64-bit type: `long long` in C and C++, `long` in Java, `Int64` in Pascal, and `BigInt` in JavaScript, where a plain `Number` would silently lose the low bits beyond $2^{53}$.

Memory is worth checking too. The prefix array holds $n + 1$ 64-bit entries, so at $n = 10^7$ it costs about 80 MB, and at $n = 10^5$ it costs 800 KB. If the memory limit is tight, the values themselves may also have to be released after the prefix array is built, which is safe because the queries only need $P$.

## Algorithm selection

| Situation                            | What to use                                               |
| ------------------------------------ | --------------------------------------------------------- |
| Static array, many range-sum queries | Prefix sums                                               |
| Static array, one range-sum query    | A single scan                                             |
| Point updates and range-sum queries  | Fenwick tree                                              |
| Range updates and point queries      | Difference array                                          |
| Range sums on a grid                 | Two-dimensional prefix sums                               |
| Range minimum or maximum             | Segment tree or sparse table                              |
| Count of subarrays with a given sum  | Prefix sums together with a frequency map                 |
| Subarray sum by two pointers         | Prefix sums to test the sum in $O(1)$                     |
| Subarray sum with a sliding window   | The running sum of the window, which needs no extra array |

The last two rows are worth a note. A sliding window computes the sum of the current window directly, so it needs no prefix array at all, and it is the better tool when the window moves monotonically. Prefix sums earn their keep when the questions are scattered.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source.

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes two variants. The `minimal` variant is a reusable function that takes the values and returns a fresh array of $n + 1$ prefix sums; it performs no input and output, and in C and Pascal it writes into a caller-provided buffer instead of allocating, so the caller owns the storage. The `program` variant reads the values, then the number of queries, then the queries themselves, and prints one sum per line.

## Recursion decision

Prefix sums are a left-to-right fold, and a fold is naturally a loop.

The recursive formulation is possible and it is instructive:

```python
def prefix(i):
    if i == 0:
        return 0
    return prefix(i - 1) + a[i - 1]
```

It computes the same values, but it has two problems. The first is performance: it recomputes the same prefixes many times, so the whole array costs $O(n^2)$ unless the intermediate results are memoized, which turns it back into the loop. The second is the stack: the recursion depth is $n$, so on the array of $10^5$ readings it needs $10^5$ frames, and Python's default limit of 1000 is exceeded after the first hundred elements.

The language limits are the ones listed in the depth-first article, and they are the reason the answer is the same in every language.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB of stack | About $10^5$ frames | Use the loop; a chain of $10^5$ frames is close to the limit |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Use the loop |
| Python | Interpreter limit of 1000 | 1000 frames | Use the loop |
| Pascal | The operating system stack | Depends on the platform | Use the loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | Use the loop |

There is one place where recursion is the right tool, and it is worth naming: parallel prefix computation. When the prefix sums of an array are needed on many processors at once, the work is split into a scan, an up-sweep and a down-sweep, all three of which are naturally written recursively. That is a different problem from the one in this article, where one processor does all the work.

## Implementation walkthrough

Three details decide whether a prefix-sum solution is right.

**The size of the prefix array.** It has $n + 1$ entries, not $n$, because $P[0] = 0$ is the prefix of length zero and the first value needs a slot of its own.

**The order of the update.** The recurrence is $P[i] = P[i-1] + a[i-1]$ in zero-based code, which is the same formula as $P[i] = P[i-1] + a_i$ in one-based code. Writing the update as `prefix[i + 1] = prefix[i] + a[i]` keeps the two conventions apart, because the index of the value and the index of the prefix differ by one.

**The width of the accumulator.** The declaration of the prefix array decides whether the answer is correct. The reference implementation uses `std::vector<long long>`, `long[]`, `Int64` and `BigInt` for exactly this reason.

The clipping in the program variant is a defensive measure rather than a mathematical one:

```cpp
if (l < 1) { l = 1; }
if (r > n) { r = n; }
if (l > r) { std::cout << "0\n"; continue; }
```

A range that leaves the array is clipped to the part that is inside it, and a range that is empty after clipping has sum zero. Without the clip, the lookup $P[r] - P[l-1]$ would read outside the array.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Answering with $P[r] - P[l]$ | The element at position $l$ is left out | Subtract the prefix of length $l - 1$ |
| Allocating $n$ entries instead of $n + 1$ | The last prefix is written out of bounds | Allocate one extra entry for the empty prefix |
| Using 32-bit integers | The answer is wrong for large ranges, with no error message | Use a 64-bit type |
| Building the prefix array after reading the queries | The answers are computed from an empty array | Build the prefix array before the first query |
| Rebuilding the prefix array for every query | The cost is $O(nq)$ again | Build it once |
| Forgetting that the values may be negative | The prefix array is not monotone, and any binary search on it fails | Never binary search the prefix array |
| Assuming the prefix array can be updated | A point update changes every later prefix | Use a Fenwick tree when updates exist |
| Using $P[r] - P[l-1]$ with a zero-based query | Every answer is shifted by one element | Fix one convention and write it in a comment |

### Why this fails: the update that prefix sums cannot answer

The mistake that survives review most often is assuming that prefix sums can answer a question about an array that changed.

Take the array $a = [1, 2, 3]$ and build its prefix sums: $P = [0, 1, 3, 6]$. Now the statement says that the value at position $1$ is replaced by $10$, and the question is the sum of the first three elements. The correct answer is $10 + 2 + 3 = 15$.

The prefix array still says $P[3] = 6$, and the query $P[3] - P[0] = 6$ is the answer to the question about the _old_ array. The prefix sums did not fail; they faithfully describe an array that no longer exists. Repairing them means adding $9$ to $P[1]$, $P[2]$ and $P[3]$, that is, updating every entry from the changed position onward. That is $O(n)$ work per update, and $O(n)$ work per update is exactly what the naive scan of the range was doing. The structure has bought nothing.

The generalization is a condition on the whole technique: **prefix sums answer questions about a fixed array.** The moment the array changes, the totals must change with it, and the cost of maintaining them is the cost the technique was supposed to remove.

There is a second failure with the same root. If the queries arrive before the values do, there is no array to prefix, and the $O(n)$ construction cannot even start. A statement of the form "for each operation, either change the value at position $i$, or report the sum of the range" is exactly the case that rules prefix sums out, whatever the order of the operations inside it. The structure that handles it is a Fenwick tree, and the technique that handles the reverse case, range updates with point queries, is a difference array.

## Variants and extensions

- **Two-dimensional prefix sums.** Store the totals of every rectangle anchored at the top-left corner. A rectangle sum is four table lookups and three additions, and the same off-by-one discipline applies.
- **Prefix sums with a frequency map.** The running total $P[i]$ is itself the key to a hash map, and the number of subarrays with sum $K$ is the number of pairs of prefix values that differ by $K$. This turns a quadratic counting problem into a linear one.
- **Prefix sums on counts.** The technique is not about numbers: a prefix count of marked cells answers "how many marked cells are in the range", which is the same subtraction.
- **Two pointers with prefix sums.** When a window must satisfy a monotone condition, the prefix array turns the test of the window sum into $O(1)$, so the test can be made per position rather than per element.
- **Binary search on the answer with prefix sums.** To find the longest subarray whose average is at least $x$, subtract $x$ from every value and ask for a subarray with a non-negative sum, which the prefix sums and a binary search over the length answer.
- **Prefix sums of prefixes.** A second prefix array over $P$ answers questions about the sum of the prefix sums, which is how one computes a range of running averages.
- **Difference arrays.** The mirror image: store the differences between consecutive values, so that a range update is two changes and a prefix sum over the differences recovers the values.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Check the assumption first: the array must not change. If the statement contains the words "after each operation", stop and use a Fenwick tree.
2. Decide the indexing convention and write it in a comment. One-based queries with a one-based prefix array of $n + 1$ entries is the combination with the fewest off-by-one traps.
3. Use a 64-bit accumulator, and check the largest sum the statement allows before deciding.
4. Build the prefix array before the first query, not inside the query loop.
5. Test the three ranges explicitly: the whole array, a single element, and a range that starts at the first element.
6. Decide what to print for a query that is out of range, and make the program agree with the statement.

## Worked problems

### Problem 1: the temperature log

**Restatement.** An array of $n$ readings is given, then $q$ queries each naming an inclusive range $[l, r]$. Print the sum of the readings in each range. Constraints: $1 \le n \le 100\,000$, $1 \le q \le 100\,000$, and $|a_i| \le 10^9$.

**Naive baseline.** Add up the range for each query, at a cost of $O(nq) = 10^{10}$ additions.

**Insight.** The sum of a range is the difference of two prefix totals, and the prefix totals do not change.

**Derivation.** Build $P$ with $P[0] = 0$ and $P[i] = P[i-1] + a_i$. Answer each query with $P[r] - P[l-1]$.

**Correctness.** The telescoping identity shows that the two prefix totals differ by exactly the range sum, and the induction in the correctness proof shows that the construction computes the totals.

**Complexity.** $O(n + q)$ time and $O(n)$ extra space. The accumulator must be 64 bits, because a total can reach $10^{14}$.

**Common wrong approach.** Subtracting $P[l]$ instead of $P[l-1]$, which silently drops the element at position $l$ from every answer.

### Problem 2: counting the subarrays with sum $K$

**Restatement.** Given an array of $n$ integers, count the subarrays whose sum is exactly $K$. Constraints: $1 \le n \le 200\,000$ and $|a_i| \le 10^9$.

**Naive baseline.** Enumerate the $n(n+1)/2$ subarrays and add up each one, at a cost of $O(n^3)$ in total.

**Insight.** A subarray from $l$ to $r$ has sum $P[r] - P[l-1]$, so the question "how many pairs of prefix values differ by $K$" is the same question.

**Derivation.** Sweep the prefix array from left to right and keep a frequency map of the prefix values seen so far. Before counting the pairs that end at the current prefix value $p$, insert $p - K$ into the map if it is there, then add the frequency of $p - K$ to the answer, then increment the frequency of $p$. The map starts with the frequency of $0$ set to one, which accounts for the subarrays that start at the first element.

**Correctness.** Every subarray corresponds to exactly one pair of prefix indices $(l-1, r)$ with $P[r] - P[l-1] = K$, and the sweep counts each such pair exactly once, when it reaches the larger index. The frequency map holds the prefixes strictly before the current one, so no pair is counted twice and none is missed.

**Complexity.** $O(n)$ expected time with a hash map, or $O(n \log n)$ with an ordered map, and $O(n)$ space.

**Common wrong approach.** Inserting the current prefix into the map before querying it. The subarray of length zero then counts itself, and every answer is one too large.

### Problem 3: the longest good subarray

**Restatement.** Given an array of $n$ values and a number $x$, find the longest contiguous subarray whose average is at least $x$. Constraints: $1 \le n \le 100\,000$ and $1 \le x \le 10^6$.

**Naive baseline.** Try every subarray, compute its average, and keep the best, at a cost of $O(n^2)$.

**Insight.** The average of a range is at least $x$ exactly when the sum of the transformed values $b_i = a_i - x$ over the range is non-negative.

**Derivation.** Build the prefix sums $P$ of the transformed values. The condition on the range $[l, r]$ becomes $P[r] - P[l-1] \ge 0$, that is, $P[l-1] \le P[r]$. For each right end $r$, the best left end is the earliest index $j < r$ with $P[j] \le P[r]$, and the length is $r - j$. The earliest such $j$ is found by keeping the running minimum of the prefix values, together with the index at which it occurred.

**Correctness.** For a fixed right end $r$, the length of the range $[j+1, r]$ is $r - j$, so the longest valid range ending at $r$ uses the smallest admissible $j$. The running minimum of the prefix values is non-increasing, so the earliest index at which the minimum is attained is exactly that $j$, and taking the maximum of $r - j$ over all $r$ gives the longest valid range.

**Complexity.** $O(n)$ time and $O(n)$ space for the prefix sums. A variant that also handles the "at most $K$" form of the condition uses a monotone stack of prefix values instead of a running minimum, and the same prefix array serves both.

**Common wrong approach.** Comparing averages directly, which needs fractions and invites rounding errors. Subtracting $x$ from every value first turns the condition into an integer comparison.

## Practice progression

1. **Recognition.** Given a statement, decide whether prefix sums apply. Look for a static array, many queries, and an additive quantity.
2. **Direct application.** Implement the construction and the query for one-based ranges, and verify the answers against a brute-force scan on small random arrays.
3. **Adaptation.** Implement the two-dimensional version for rectangle sums, and the version that counts the subarrays with a given sum.
4. **Combination.** Combine prefix sums with a frequency map to count subarrays, and with two pointers to find the longest subarray with a bounded sum.
5. **Challenge.** Solve a problem with updates mixed in, and discover that prefix sums no longer work; solve it again with a Fenwick tree.
6. **Transfer.** Use prefix sums where they are not obvious: to test a window sum in a monotone scan, to compute the average of a range, and to answer "how many pairs of positions have a given difference of values" in linear time.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the identity that turns a range sum into a subtraction, and why does it hold? (Key insight)
2. Why does the prefix array have $n + 1$ entries rather than $n$? (Implementation walkthrough)
3. State the invariant of the construction loop and say which part of the proof uses it. (Correctness proof)
4. Give a concrete array and an update for which the prefix sums give a wrong answer, and say what repairing them costs. (Common mistakes)
5. What is the largest sum the stated constraints allow, and why does that decide the type of the accumulator? (Complexity analysis)
6. Which language-specific limits make the recursive form of the construction a bad idea? (Recursion decision)
7. When is a single scan better than building the prefix array? (Algorithm selection)
8. Why is a frequency map of prefix values the right tool for counting subarrays with a given sum? (Worked problems)
9. What must be true of the array for the technique to be applicable at all, and where in a statement does that show up? (Recognition patterns)
10. Why is a binary search on the prefix array a mistake? (Step-by-step execution)

## Further reading

- The two-dimensional version of the same idea is in [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The mirror image, in which a range update becomes two changes, is [difference arrays](/algorithms/arrays/difference-arrays).
- The structure to reach for when the array does change is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and the [segment tree](/algorithms/range-queries/segment-tree) generalizes it to non-additive quantities.
- The two-pointer technique, which often removes the need for prefix sums entirely, is in [two pointers](/algorithms/searching/two-pointers) and [sliding window](/algorithms/searching/sliding-window).
- Why an array must be sorted before it can be binary searched, which is the assumption the prefix array does _not_ satisfy, is in [binary search](/algorithms/searching/binary-search).
- Every listing in this article, in all six languages, is collected on the [prefix sums source page](/implementations/arrays-prefix-sums/).
