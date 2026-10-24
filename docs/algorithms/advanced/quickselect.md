---
id: advanced.quickselect
title: Quickselect and randomized selection
summary: Find the k-th smallest element of an array by partitioning around a pivot and keeping only the side that holds the wanted rank, which costs linear time in expectation and constant extra space.
division: [silver, gold]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        quickselect,
        selection,
        order statistic,
        k-th smallest,
        median,
        median of three,
        partition,
        randomized algorithm,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [searching.binary-search, foundations.recursion]
complexity:
    time: "O(n) expected with a random pivot, O(n^2) worst case"
    space: "O(1) auxiliary in the iterative form, O(n) stack in the worst recursive form"
assumptions:
    - The array holds n >= 1 integers and the rank k satisfies 1 <= k <= n, so the answer always exists.
    - Every value fits in a signed 32-bit integer, so the comparison order is the same in all six languages.
    - The reference programs use the median of the first, middle, and last elements, so they follow the same deterministic sequence of partitions.
implementations: advanced.quickselect
reviewed: false
---

## At a glance

Quickselect finds the $k$-th smallest element of an array without sorting it. It partitions the array around a pivot, exactly as quicksort does, and then keeps only the side that contains the wanted rank. The other side is discarded without being sorted or even examined again.

The saving is the discard. A full sort orders every element, but a selection only has to place the one value at rank $k$. If each partition splits the current interval roughly in half, the work is $n + n/2 + n/4 + \cdots < 2n$, so the whole selection costs linear time. A random pivot makes that balanced split likely, which gives $O(n)$ expected time. An unlucky sequence of pivots still costs $O(n^2)$, so quickselect is an expected-linear algorithm, not a worst-case-linear one.

The reference programs use a deterministic median-of-three pivot with a three-way partition. The deterministic pivot makes all six languages follow the same sequence of partitions and protects sorted and reverse-sorted input; the three-way partition makes duplicate values disappear in one round instead of one at a time.

## Problem motivation

A dairy cooperative records the milk output of $n = 10^6$ cows and wants the median output: the value that splits the herd into two halves of equal size. Sorting all million readings costs about $n \log_2 n \approx 2 \ast 10^7$ comparisons. Selection costs about $2n \approx 2 \ast 10^6$ comparisons in the balanced case, an order of magnitude less, and it needs no second array.

The same question appears under many names. A leaderboard asks for the score of the contestant in $k$-th place. A budget is set at the 90th percentile of a list of costs. A geometry routine needs the median of a set of distances before it can prune a search. A quality-control report wants the 99th percentile of a fixed batch of measurements. In every case the input is a static array, the wanted rank is known, and the answer is one value rather than a total order.

The constraints decide whether selection is worth the extra code.

| Situation                    | What it suggests                                           |
| ---------------------------- | ---------------------------------------------------------- |
| $n \le 10^3$                 | Sorting is simpler and fast enough                         |
| $n \ge 10^6$ and one rank    | Selection is the natural tool                              |
| $k = 1$ or $k = n$           | A single scan finds the minimum or the maximum             |
| Many ranks of the same array | Sort once, then index in $O(1)$                            |
| Insertions between queries   | A Fenwick tree over the values, or an order-statistic tree |
| Ranks inside subarrays       | A wavelet tree or a persistent segment tree                |

The last three rows are the ones that catch people. Quickselect answers one rank of one static array. It is not a data structure: it cannot answer a second rank for free, it cannot absorb an insertion, and it does not restrict itself to a subarray. When the statement asks for many ranks, the sorting baseline or a dedicated structure wins.

## Recognition patterns

Quickselect is the right tool when the statement contains some of these phrases.

- "Find the $k$-th smallest element", "the $k$-th largest value", "the element in position $k$ of the sorted order".
- "Return the median", "the middle value", "the value that splits the data in half".
- "Without sorting the array", "in linear time", "better than $O(n \log n)$".
- "Only the rank matters, not the full order", "the top $k$ do not need to be sorted".
- "The array is static and only one rank is required".
- The C++ name `std::nth_element`, the Java pattern of a manual partition, or the phrase "quickselect" itself.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| One rank, one static array | Quickselect |
| $k = 1$ or $k = n$ | A scan; the partition machinery is overhead |
| $10^5$ ranks of the same array | Sort once; $Q$ selections cost $O(Qn)$ expected |
| The array changes between queries | An order-statistic tree or a Fenwick tree over compressed values |
| The rank is inside an arbitrary subarray | A wavelet tree or a persistent segment tree |
| The top $k$ must be printed in sorted order | Select, then sort the $k$ survivors |
| A worst-case linear guarantee is required | Median of medians, or introselect |
| Values are small bounded integers | Counting sort or prefix counts |

The fifth row is the most common mismatch. Quickselect does not know about subarrays: its partition touches everything between `lo` and `hi`, so restricting it to a subarray means paying $O(r - l)$ for every query. That is a different problem, with different structures.

## Naive approach

The baseline sorts the array and reads the rank directly.

```cpp
std::sort(a.begin(), a.end());
std::cout << a[k - 1] << '\n';
```

This is correct, short, and often fast enough. Its cost is $O(n \log n)$ time and, for the standard library sort, $O(\log n)$ stack space. It is also the reference implementation for a differential test: any selection routine must agree with it on every input.

The second baseline keeps the $k$ smallest values in a max-heap and discards everything larger.

```cpp
std::priority_queue<int> heap;
for (int value : a) {
    heap.push(value);
    if (static_cast<int>(heap.size()) > k) heap.pop();
}
std::cout << heap.top() << '\n';
```

This costs $O(n \log k)$ time and $O(k)$ space. It is the right answer when $k$ is tiny and the input arrives as a stream, because it never needs the whole array. When $k$ is close to $n$, it is worse than sorting, and when $k = n/2$ its $O(n \log k)$ bound is a logarithmic factor above the selection bound, with a larger constant as well.

The third baseline repeatedly scans for the minimum and removes it, once per rank. That costs $O(kn)$ time, which is quadratic in the middle of the array, and it destroys the input unless the scan is replaced with a mark array.

The sort baseline is the one to beat. At $n = 10^6$ it performs about $2 \ast 10^7$ comparisons, and at $n = 10^7$ it performs about $2.3 \ast 10^8$. Selection reduces both by roughly an order of magnitude at these sizes, which is where the technique earns its keep.

## Key insight

The insight is that **a partition places the pivot at its final sorted position, so one comparison with the rank tells you which side of the pivot the answer is on.**

After a three-way partition of the interval $[lo, hi]$ around a pivot value $p$, the interval is split into three blocks:

- positions $[lo, lt - 1]$ hold values strictly less than $p$;
- positions $[lt, gt]$ hold values equal to $p$;
- positions $[gt + 1, hi]$ hold values strictly greater than $p$.

All values in the first block are smaller than all values in the second, and all values in the second are smaller than all values in the third. Therefore the sorted order of the interval lists the three blocks in exactly that order, with no interleaving. The equal block occupies sorted positions $lt$ through $gt$.

Now let $t = k - 1$ be the zero-based rank that is wanted. If $t$ lies in $[lt, gt]$, the answer is $p$, because every value at those sorted positions is $p$. If $t < lt$, the answer is in the left block. If $t > gt$, the answer is in the right block. In the last two cases the other block cannot contain the answer: every value there is on the wrong side of the rank.

That is the whole saving. Quicksort partitions and then sorts both sides. Quickselect partitions and then descends into one side, so the discarded side is never touched again. The intervals shrink geometrically when the pivots are balanced, and the total work is the sum of a geometric series.

The pivot choice decides the shape of the series.

- A uniformly random pivot has a rank that is uniform over the interval. With probability at least $1/2$ the rank falls in the middle half, both sides have size at most $3/4$ of the interval, and the interval shrinks by a constant factor. The expected total work is linear.
- The median of the first, middle, and last elements is deterministic. It gives a good pivot on sorted and reverse-sorted arrays, where the first-element pivot is catastrophic, but an adversary who knows the rule can still force a bad split.
- The median of medians chooses the pivot recursively and guarantees a constant-factor shrink, which gives $O(n)$ worst-case time at a larger constant.

The reference programs take the second option because they must agree across languages. The article returns to the trade-off in the complexity and variants sections.

## Visual intuition

Picture the current interval as a row of values with a bracket around it. The pivot value $p$ is chosen from three sampled positions, and the partition rearranges the row into three colored blocks.

| Left block | Equal block | Right block |
| --- | --- | --- |
| values $< p$ | values $= p$ | values $> p$ |
| sorted positions $lo$ through $lt - 1$ | sorted positions $lt$ through $gt$ | sorted positions $gt + 1$ through $hi$ |

The wanted rank $t$ is a position on this row. One of three things happens.

- If $t$ lands on the equal block, the value there is $p$, and the search stops.
- If $t$ lands on the left block, the right block and the equal block are irrelevant, so the next interval is the left block.
- If $t$ lands on the right block, the left block and the equal block are irrelevant, so the next interval is the right block.

Take the array $[7, 1, 6, 2, 5, 3, 4]$ and the rank $k = 4$, so $t = 3$. The first, middle, and last values are $7$, $2$, and $4$, whose median is $4$.

The partition moves every value below $4$ to the front and leaves every value above $4$ at the back:

| Step  | Array                   | `lt` | `gt` | What moved                                    |
| ----- | ----------------------- | ---- | ---- | --------------------------------------------- |
| Start | $[7, 1, 6, 2, 5, 3, 4]$ | 0    | 6    | The pivot value is $4$                        |
| 1     | $[4, 1, 6, 2, 5, 3, 7]$ | 0    | 5    | $7 > 4$, swapped with the last value          |
| 2     | $[1, 4, 6, 2, 5, 3, 7]$ | 1    | 5    | $1 < 4$, moved to the front                   |
| 3     | $[1, 4, 3, 2, 5, 6, 7]$ | 1    | 4    | $6 > 4$, swapped with the last unplaced value |
| 4     | $[1, 3, 4, 2, 5, 6, 7]$ | 2    | 4    | $3 < 4$, moved to the front                   |
| 5     | $[1, 3, 2, 4, 5, 6, 7]$ | 3    | 4    | $2 < 4$, moved to the front                   |
| 6     | $[1, 3, 2, 4, 5, 6, 7]$ | 3    | 3    | $5 > 4$, swapped with itself                  |
| Done  | $[1, 3, 2, 4, 5, 6, 7]$ | 3    | 3    | The equal block is position 3                 |

The equal block is exactly position $3$, which is the wanted rank, so the answer is $4$. The three values to its left are smaller, the three to its right are larger, and none of them needed to be ordered.

The row picture also explains the failure mode. If the pivot is always the smallest value, the equal block is always position $lo$, and the next interval is everything to the right. The row shrinks by one position per round, and the sum $n + (n - 1) + \cdots + 1$ is quadratic. A balanced pivot cuts the row roughly in half and turns the sum into a geometric series.

## Formal model

Let $A = (a_0, a_1, \ldots, a_{n-1})$ be an array of $n$ integers and let $k$ be an integer with $1 \le k \le n$. Write $t = k - 1$ for the zero-based rank.

::: math definition Definition
The **$k$-th order statistic** of $A$ is the value at position $k - 1$ of the array obtained by sorting $A$ in non-decreasing order. In a multiset with duplicates, it is the value $x$ such that at most $k - 1$ elements are strictly less than $x$ and at most $n - k$ elements are strictly greater than $x$.
:::

::: math definition Definition
A **three-way partition** of the interval $[lo, hi]$ around a value $p$ returns indices $lt \le gt$ such that, after the partition,

$$
a_i < p \text{ for } lo \le i < lt, \qquad
a_i = p \text{ for } lt \le i \le gt, \qquad
a_i > p \text{ for } gt < i \le hi.
$$

The interval $[lt, gt]$ is the **equal block** of the partition.
:::

::: math lemma Lemma
After a three-way partition around $p$, the sorted order of the interval lists the left block, the equal block, and the right block in that order. Consequently, the equal block occupies sorted positions $lt$ through $gt$.
:::

::: math proof Proof
Every value in the left block is strictly less than $p$, every value in the equal block is $p$, and every value in the right block is strictly greater than $p$. Hence every left value precedes every equal value and every equal value precedes every right value in non-decreasing order. The left block has $lt - lo$ values, so it occupies sorted positions $lo$ through $lt - 1$; the equal block then occupies $lt$ through $gt$, and the right block occupies the rest. $\square$
:::

::: math lemma Lemma
Let $[lo, hi]$ be an interval that contains the wanted rank $t$, and let a three-way partition return $(lt, gt)$. Then:

- if $lt \le t \le gt$, the answer of the interval is the pivot $p$;
- if $t < lt$, the answer lies in $[lo, lt - 1]$;
- if $t > gt$, the answer lies in $[gt + 1, hi]$.
:::

::: math proof Proof
The first case is immediate from the previous lemma: every sorted position in $[lt, gt]$ holds $p$. If $t < lt$, then position $t$ is in the left block, so the answer is one of the left values; the right block and the equal block occupy positions at or after $lt > t$ and cannot contain it. The case $t > gt$ is symmetric. $\square$
:::

The lemma is the entire correctness argument for the descent. It remains to show that the interval always contains $t$ and that the loop terminates.

## Algorithm derivation

The state is an interval $[lo, hi]$ and the fixed zero-based rank $t$. The invariant is that the answer of the original array is the value at sorted position $t$ of the current interval.

1. If $lo = hi$, the interval has one element, so it is the answer.
2. Choose the pivot value $p$ as the median of $a_{lo}$, $a_{mid}$, and $a_{hi}$, where $mid = lo + \lfloor (hi - lo)/2 \rfloor$.
3. Partition $[lo, hi]$ into the three blocks of the definition.
4. If $t$ lies in the equal block, return $p$.
5. If $t < lt$, set $hi = lt - 1$. Otherwise set $lo = gt + 1$.
6. Repeat from step 1.

The median of three is computed with three comparisons on copies of the values, so the partition sees the same pivot in every language:

```cpp
int mid = lo + (hi - lo) / 2;
int x = a[lo], y = a[mid], z = a[hi];
if (x > y) std::swap(x, y);
if (y > z) std::swap(y, z);
if (x > y) std::swap(x, y);
const int pivot = y;
```

The partition is one left-to-right pass with two boundaries. `lt` is the first position that is not known to be below the pivot, and `gt` is the last position that is not known to be above it. The cursor `i` examines the unclassified middle.

```cpp
int lt = lo, i = lo, gt = hi;
while (i <= gt) {
    if (a[i] < pivot) {
        std::swap(a[lt], a[i]);
        ++lt;
        ++i;
    } else if (a[i] > pivot) {
        std::swap(a[i], a[gt]);
        --gt;
    } else {
        ++i;
    }
}
```

The asymmetry between the two branches is not an accident. A value below the pivot is swapped with the first position of the equal region, so it joins the left block; the value that arrives at `i` is a copy of the pivot, which needs no comparison, so `i` advances. A value above the pivot is replaced by a value from the back that has not been examined yet, so `i` must stay where it is and examine the new occupant.

The loop is iterative, and the interval strictly shrinks whenever it does not return, because the equal block is non-empty and is removed. The next interval is a subinterval of the current one, so the invariant is preserved by the lemma, and the process terminates at a single element.

## Step-by-step execution

Use the array $[9, 2, 8, 1, 7, 3, 6, 4, 5]$ and the rank $k = 6$, so $t = 5$. The sorted array is $[1, 2, 3, 4, 5, 6, 7, 8, 9]$, and the answer is $6$.

**Round 1.** The interval is $[0, 8]$, the midpoint is $4$, and the sampled values are $a_0 = 9$, $a_4 = 7$, $a_8 = 5$. Their median is $7$.

| Step  | Array                         | `lt` | `i` | `gt` | Action               |
| ----- | ----------------------------- | ---- | --- | ---- | -------------------- |
| Start | $[9, 2, 8, 1, 7, 3, 6, 4, 5]$ | 0    | 0   | 8    | $9 > 7$              |
| 1     | $[5, 2, 8, 1, 7, 3, 6, 4, 9]$ | 0    | 0   | 7    | $5 < 7$              |
| 2     | $[5, 2, 8, 1, 7, 3, 6, 4, 9]$ | 1    | 1   | 7    | $2 < 7$              |
| 3     | $[5, 2, 8, 1, 7, 3, 6, 4, 9]$ | 2    | 2   | 7    | $8 > 7$              |
| 4     | $[5, 2, 4, 1, 7, 3, 6, 8, 9]$ | 2    | 2   | 6    | $4 < 7$              |
| 5     | $[5, 2, 4, 1, 7, 3, 6, 8, 9]$ | 3    | 3   | 6    | $1 < 7$              |
| 6     | $[5, 2, 4, 1, 7, 3, 6, 8, 9]$ | 4    | 4   | 6    | $7 = 7$              |
| 7     | $[5, 2, 4, 1, 3, 7, 6, 8, 9]$ | 5    | 6   | 6    | $3 < 7$              |
| 8     | $[5, 2, 4, 1, 3, 6, 7, 8, 9]$ | 6    | 7   | 6    | $6 < 7$              |
| Done  | $[5, 2, 4, 1, 3, 6, 7, 8, 9]$ | 6    | 7   | 6    | Equal block $[6, 6]$ |

The equal block is position $6$, which is greater than $t = 5$, so the answer is in the left interval $[0, 5]$.

**Round 2.** The interval is $[0, 5]$, the midpoint is $2$, and the sampled values are $5$, $4$, and $6$. Their median is $5$.

| Step  | Array                | `lt` | `i` | `gt` | Action                        |
| ----- | -------------------- | ---- | --- | ---- | ----------------------------- |
| Start | $[5, 2, 4, 1, 3, 6]$ | 0    | 0   | 5    | $5 = 5$                       |
| 1     | $[5, 2, 4, 1, 3, 6]$ | 0    | 1   | 5    | $2 < 5$                       |
| 2     | $[2, 5, 4, 1, 3, 6]$ | 1    | 2   | 5    | $4 < 5$                       |
| 3     | $[2, 4, 5, 1, 3, 6]$ | 2    | 3   | 5    | $1 < 5$                       |
| 4     | $[2, 4, 1, 5, 3, 6]$ | 3    | 4   | 5    | $3 < 5$                       |
| 5     | $[2, 4, 1, 3, 5, 6]$ | 4    | 5   | 4    | $6 > 5$, equal block $[4, 4]$ |

The equal block is position $4$, which is less than $t = 5$, so the answer is in the right interval $[5, 5]$.

**Round 3.** The interval is the single position $5$, whose value is $6$. The answer is $6$, which matches the sorted array.

The trace shows the two directions of the descent. Round 1 went left, round 2 went right, and the interval shrank from nine elements to six to one. A quicksort would have sorted the discarded blocks as well; the selection never looked at them again.

## Correctness proof

::: math theorem Theorem
For every array of $n$ integers and every rank $k$ with $1 \le k \le n$, quickselect returns the $k$-th order statistic.
:::

::: math proof Proof
The proof is by induction on the length of the current interval.

The initial interval is $[0, n - 1]$, which contains the rank $t = k - 1$ because $0 \le t \le n - 1$.

Suppose the current interval $[lo, hi]$ contains $t$ and that the answer of the original array is the value at sorted position $t$ of this interval. If $lo = hi$, the interval has one element, so that element is the answer.

Otherwise the algorithm partitions the interval. By the partition lemma, the sorted order of the interval is the left block, the equal block, and the right block. If $t$ is in the equal block, every value at the sorted positions of the equal block is the pivot, so the pivot is the answer. If $t < lt$, the rank falls in the left block, and the algorithm sets the interval to exactly that block. If $t > gt$, the rank falls in the right block, and the algorithm sets the interval to exactly that block. In both cases the new interval contains $t$, and its sorted position $t$ is the same value as before, because the blocks are contiguous pieces of the same sorted order.

Each non-terminal round removes at least one position, the equal block, so the interval length strictly decreases. The induction therefore terminates at a single position, and that position holds the $k$-th order statistic. $\square$
:::

The duplicate case needs no separate argument. The equal block may contain several positions, and every one of them holds the same pivot value, so any $t$ inside the block has the same answer.

## Complexity analysis

| Method | Time | Extra space |
| --- | --- | --- |
| Sort, then index | $O(n \log n)$ | $O(\log n)$ stack for the sort |
| Max-heap of the $k$ smallest | $O(n \log k)$ | $O(k)$ |
| Repeated minimum scan | $O(kn)$ | $O(1)$ extra, with the input rearranged |
| Quickselect, random pivot | $O(n)$ expected | $O(1)$ iterative |
| Quickselect, median of three | $O(n)$ on random and sorted input | $O(1)$ iterative |
| Quickselect, median of three | $O(n^2)$ worst case | $O(1)$ iterative |
| Median of medians | $O(n)$ worst case | $O(n)$ extra in the simple form |

**One round.** The median of three costs three comparisons. The partition examines every element of the interval once and performs at most one swap per element, so a round on an interval of length $m$ costs $O(m)$ comparisons and swaps.

**Balanced pivots.** If every pivot split the interval in half, the lengths would be $n, n/2, n/4, \ldots$, and the total work would be at most $2n$. The convergence is geometric, so the constant is small even though the recursion has $O(\log n)$ levels.

**Random pivots.** Choose the pivot uniformly at random from the interval. Its rank is uniform, so with probability at least $1/2$ the rank lies in the middle half of the interval. In that case both sides have size at most $3m/4$, so the next interval has size at most $3m/4$ regardless of which side contains $t$. In the other case the next interval has size at most $m - 1 < m$. Therefore

$$
\mathbb{E}[m'] \le \frac{1}{2} \ast \frac{3m}{4} + \frac{1}{2} \ast m = \frac{7m}{8}.
$$

After $j$ rounds the expected length is at most $(7/8)^j n$, and the expected total work is at most

$$
\sum_{j \ge 0} \left(\frac{7}{8}\right)^j n = 8n.
$$

So the expected time is $O(n)$, with a constant below $8$ comparisons per element. The bound holds for every input, because the randomness is in the pivot, not in the data.

**Worst case.** If every pivot is the smallest or the largest value of its interval, the interval shrinks by one position per round, and the work is $n + (n - 1) + \cdots + 1 = O(n^2)$. The deterministic median-of-three rule has this behavior on inputs crafted against it, and a two-way partition with a strict comparison has it on an array of equal values. The three-way partition removes the equal-value case in a single round, but it cannot remove the crafted case. A uniform random pivot makes the worst case vanishingly unlikely, and median of medians removes it entirely at the cost of a larger constant.

**Space.** The iterative form keeps only `lo`, `hi`, `lt`, `gt`, `i`, and the pivot, so its auxiliary space is $O(1)$. The recursive form uses one frame per round, which is $O(\log n)$ expected and $O(n)$ in the worst case. The partition is in place, so the array is the only working storage.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One rank of one static array, $n$ large | Quickselect |
| $k = 1$ or $k = n$ | One scan for the minimum or maximum |
| All $k$ smallest values, in order | Select, then sort the $k$ survivors; or a heap |
| All $k$ smallest values, any order | Quickselect, or a heap of size $k$ |
| Many ranks of the same array | Sort once, then index |
| Insertions and rank queries interleaved | A Fenwick tree over compressed values, or an order-statistic tree |
| Ranks of arbitrary subarrays | A wavelet tree or a persistent segment tree |
| A stream with a fixed small $k$ | A max-heap of size $k$ |
| A stream with a moving median | Two heaps, or an order-statistic tree |
| A worst-case linear guarantee | Median of medians, or introselect |
| Values are bounded small integers | Counting sort, then index |

The rows that are easy to confuse are the static rows. Quickselect is not a preprocessing step: it rearranges the array and returns one value, and a second rank costs another full selection. When the statement has $Q$ ranks over one array, sorting once costs $O(n \log n + Q)$ and beats $Q$ selections. When the ranks are over subarrays, the array is not even the right object; a wavelet tree indexes the values so that each rank is answered in $O(\log n)$.

The other confusion is between selection and ordering. A heap of size $k$ produces the $k$ smallest values in $O(n \log k)$, and it can produce them in sorted order; quickselect produces the $k$-th value in $O(n)$ expected but leaves the smaller values in arbitrary order. If the output must be sorted, the heap or a final sort of the survivors is the right choice.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read $n$.
2. Read $n$ integers, the array values.
3. Read $k$, with $1 \le k \le n$.
4. Print the $k$-th smallest value.

The input is whitespace-separated, so a line break may appear anywhere between two numbers. Every variant uses the same median-of-three rule and the same three-way partition, so the six outputs are byte-identical on the shared fixtures. The pivot is computed from the values at `lo`, `mid`, and `hi` with the same three comparisons in the same order; no variant shuffles the array or uses a random number generator.

The variants differ only in storage and input.

- The C variant reads into a heap-allocated array, partitions it in place, and frees it before exiting. It is compiled with the strictest warning flags, so every conversion is explicit.
- The C++17 variant stores the array in a `std::vector<int>` and uses `std::swap`. It does not call `std::nth_element`, because the point of the listing is the partition itself.
- The Java variant keeps the array in an `int[]` and reads tokens through a byte-buffer scanner, which avoids the per-token overhead of `java.util.Scanner`. The source is `java/Main.java` and the class is `Main`.
- The Python variant reads the whole of standard input once and splits it, because a per-token read is the slowest part of a Python solution at this size. It uses a list and swaps in place.
- The Pascal variant uses a dynamic array of `LongInt`, one argument per `Read`, and no `IOResult`, so it stays inside the subset that the browser-based compiler accepts. It is an educational reference, not a USACO submission.
- The JavaScript variant reads standard input as one string, splits it, and uses `Number` for the values. It is an educational reference, not a USACO submission.

All six use signed 32-bit values. The comparisons never subtract or add the values, so no variant can overflow; the only arithmetic is on indices, and `mid = lo + (hi - lo) / 2` keeps that arithmetic below $n$ even when $n$ is close to the integer limit.

The manifest publishes no `minimal` variant. A reusable selection class would hide the two loops that the article is about, and the caller would still have to supply the pivot rule and the partition contract. The `program` variants are the complete statement of the algorithm.

## Recursion decision

The algorithm is naturally recursive: partition, then recurse into one side. The recursion depth is the number of rounds, which is $O(\log n)$ expected and $O(n)$ in the worst case.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB of stack | About $10^5$ frames | The loop; tail recursion may be optimized, but do not rely on it |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop, or raise the limit and accept the risk |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

The recursive skeleton is worth writing once, because it makes the invariant obvious:

```cpp
int select(int lo, int hi, int target) {
    if (lo == hi) return a[lo];
    const int pivot = median_of_three(lo, hi);
    const auto [lt, gt] = partition(lo, hi, pivot);
    if (target < lt) return select(lo, lt - 1, target);
    if (target > gt) return select(gt + 1, hi, target);
    return pivot;
}
```

The iterative version replaces the two tail calls with assignments to `lo` and `hi`. It is strictly better in a contest: it uses no stack, it avoids the worst-case overflow, and it makes the loop invariant visible in one screen. The only reason to write the recursive form is to explain the algorithm; the listings use the loop.

The recursion that must be avoided is the one that descends into both sides. That is quicksort, and it costs $O(n \log n)$ even when only one rank is wanted. The entire point of selection is to make the second call disappear.

## Implementation walkthrough

Four details decide whether a quickselect program is correct.

**The target is an absolute index.** The array is partitioned in place, and `lo` and `hi` move, but the wanted rank $t = k - 1$ never changes. If the code subtracts the discarded block from the rank, it must also switch to a relative rank for the recursive call; mixing the two conventions is the most common off-by-one. The listings keep $t$ absolute.

**The median of three is computed before the partition.** The three sampled values are copied into locals, sorted with three comparisons, and the middle copy becomes the pivot value. The partition then moves the values around, so reading `a[mid]` after the partition would return an unrelated element.

**A `>` swap does not advance the cursor.** In the three-way partition, the element swapped in from the right has not been examined. Incrementing `i` after that swap skips it and can leave a value on the wrong side of the equal block. The `<` swap does advance, because the element that arrives at `i` is the one that was at `lt`, which is a copy of the pivot from the equal region and needs no comparison.

```cpp
if (a[i] < pivot) {
    std::swap(a[lt], a[i]);
    ++lt;
    ++i;
} else if (a[i] > pivot) {
    std::swap(a[i], a[gt]);
    --gt;               // i stays; the new a[i] is unexamined
} else {
    ++i;
}
```

**The equal block is removed as a unit.** If the partition returns only a single pivot index and the code treats everything at or after that index as greater, duplicates of the pivot are compared again in every round, so an all-equal input removes one element per round and the cost becomes quadratic. The three-way loop returns both boundaries, and the next interval excludes the whole block.

A compact Python core is:

```python
def select(a, k):
    lo, hi, target = 0, len(a) - 1, k - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        x, y, z = a[lo], a[mid], a[hi]
        if x > y:
            x, y = y, x
        if y > z:
            y, z = z, y
        if x > y:
            x, y = y, x
        pivot = y
        lt, i, gt = lo, lo, hi
        while i <= gt:
            if a[i] < pivot:
                a[lt], a[i] = a[i], a[lt]
                lt += 1
                i += 1
            elif a[i] > pivot:
                a[i], a[gt] = a[gt], a[i]
                gt -= 1
            else:
                i += 1
        if target < lt:
            hi = lt - 1
        elif target > gt:
            lo = gt + 1
        else:
            return pivot
    return a[lo]
```

The loop has no base case other than `lo == hi`, which is the single remaining element. The function mutates the input, which is the price of constant extra space; a caller that needs the original order must pass a copy.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Recursing into both sides | The program is quicksort and costs $O(n \log n)$ | Recurse only into the side that contains $t$ |
| Subtracting the discarded block from the rank | The next round searches for the wrong rank | Keep $t$ absolute, or convert consistently |
| Forgetting the equal block | Duplicates are compared again in every round, so the cost degrades to quadratic | Use the three-way partition and return both boundaries |
| Advancing after a `>` swap | An unexamined value is skipped | Decrement `gt` and leave `i` alone |
| `mid = (lo + hi) / 2` | Integer overflow for very large arrays | Use `lo + (hi - lo) / 2` |
| First-element pivot on sorted input | Every round removes one element, $O(n^2)$ | Use median of three, a random pivot, or introselect |
| Two-way partition on all-equal input | Every round removes one element, $O(n^2)$ | Use the three-way partition |
| Assuming $O(n)$ worst case | A crafted test times out | State the expected bound, or use median of medians |
| Reusing the array after selection | The caller sees a permuted array | Document the mutation, or pass a copy |
| Recursing in Python without a limit | A bad pivot sequence raises `RecursionError` | Use the iterative loop |

### Why this fails: the side that does not contain the rank

The plausible wrong approach is to reason about the split the way one reasons about a binary search for the _last_ position below a threshold: "the pivot is at position $p$, so a rank above $p$ is on the right and a rank below $p$ is on the left". That part is right. The mistake is the boundary case: the equal block can be wider than one position, and a rank that falls inside it is neither to the left nor to the right.

The smallest counterexample for the wrong-side bug is two elements, $[2, 1]$, with $k = 1$. The sorted array is $[1, 2]$, so the answer is $1$. The median of $a_0 = 2$, $a_0 = 2$, and $a_1 = 1$ is $2$, so the partition places $1$ in the left block and $2$ in the equal block at position $1$. The wanted rank is $t = 0$, which is left of the equal block, so the answer is in $[0, 0]$ and equals $1$. A program that sends a rank below the equal block to the right reports $2$.

The bug is silent because it is an off-by-one in the direction of the descent, not an invalid memory access. One wrong side produces one wrong answer, and the answer is still an element of the array, so a test that only checks "the answer is present" finds nothing.

A second failure is a complexity failure rather than a correctness failure. Suppose the pivot is always the first element, and the input is sorted in increasing order. Every partition puts the pivot at the front and the next interval is everything to the right, so the lengths are $n, n - 1, \ldots, 1$ and the work is quadratic. The smallest shape is $[1, 2, 3, 4, 5]$ with $k = 5$: the correct median-of-three version reaches the answer in two rounds, while the first-element version needs four. The gap grows quadratically, and at $n = 10^5$ the first-element version performs about $5 \ast 10^9$ comparisons.

The lesson generalizes: **the split is only as good as the pivot, and a deterministic rule is only as good as the adversary's ignorance of it.** Median of three removes the sorted and reverse-sorted cases, the three-way partition removes the duplicate case, and a random pivot removes the crafted case. A production selection routine usually combines all three.

## Variants and extensions

- **Uniform random pivot.** Choose an index uniformly from $[lo, hi]$, swap it to `hi`, and partition. The expected time is $O(n)$ for every input, and the analysis is the geometric one from the complexity section. A contest program can seed the generator once; a reproducible test suite should fix the seed.
- **Median of medians (BFPRT).** Divide the interval into groups of five, find each group's median by insertion sort, take the median of those medians recursively, and partition around it. The pivot is guaranteed to be between the 30th and 70th percentiles, so the interval shrinks by a constant factor every round and the worst case is $O(n)$. The constant is large, so the method is used as a fallback rather than as the default.
- **Introselect.** Run quickselect, count the rounds, and switch to median of medians when the count exceeds a limit proportional to $\log n$. This is the strategy of `std::nth_element`, and it gives expected linear time in practice with a worst-case linear guarantee.
- **Floyd-Rivest.** Sample a small set of elements, estimate the rank of the target from the sample, and recurse only when the estimate is not tight enough. It is faster than plain quickselect in practice and is used by some standard libraries.
- **Three-way partition.** The variant used by the listings. It handles duplicate-heavy inputs in one round per distinct value and is the standard choice when the values are not unique.
- **Top-$k$ selection.** After selecting the $k$-th value, the first $k$ positions hold the $k$ smallest values in arbitrary order. Sorting those $k$ positions produces the top $k$ in $O(k \log k)$ additional time, which is the right approach when the output must be ordered.
- **$k$-th largest.** Run the same algorithm with the target $n - k$, or reverse the comparison. The two conventions differ by one and are a frequent source of off-by-one errors.
- **Weighted median.** Each element carries a weight, and the rank is defined by the cumulative weight. The partition is unchanged; only the comparison with the target becomes a comparison with a prefix weight.
- **Selection with a custom comparator.** The values can be records compared by a key; the partition and the median-of-three comparisons use the same comparator.
- **Range $k$-th queries.** A wavelet tree or a persistent segment tree answers a rank inside a subarray in $O(\log n)$. Quickselect is the wrong tool there because its partition is not restricted to the query range.
- **Streaming selection.** A max-heap of size $k$ keeps the $k$ smallest values of a stream, and two heaps keep the median. Neither can go back and repartition, so the offline quickselect does not apply.

## Contest strategy

1. Decide whether the problem asks for one rank or many. One rank of one static array is quickselect; many ranks are a sort or an order-statistic structure.
2. Check the indexing convention before writing the partition. The statement may use a 1-based rank, and the array is usually 0-based; write $t = k - 1$ once and use it everywhere.
3. If $k$ is very small, compare the heap bound $O(n \log k)$ with the selection bound before committing. For $k \le 10$, the heap is often faster in practice.
4. Use `std::nth_element` in C++ unless the problem requires a specific pivot rule. Most implementations use introselect, which adds a worst-case linear fallback and has a good constant. Java has no selection primitive, so the partition loop is the practical option.
5. Test the degenerate inputs: $n = 1$, $k = 1$, $k = n$, an all-equal array, a sorted array, a reverse-sorted array, and an array with negative values.
6. Do not assume the input stays in its original order. Selection permutes the array; if the problem needs the original order later, copy the array first or store the values with their indices.
7. State the complexity as expected $O(n)$ and worst-case $O(n^2)$. A judge with adversarial tests may need a random pivot or median of medians; a judge with random tests accepts median of three.
8. If the answer must be exact under duplicates, check which copy of the value the rank selects. The three-way block makes every copy equivalent, which is exactly what the order statistic asks for.

## Worked problems

### Problem 1: Find the Median

**Restatement.** Given an unsorted array of $n$ integers, where $n$ is odd, return the median: the element that has the same number of elements before and after it in sorted order.

**Naive baseline.** Sort the array and return `arr[n / 2]`. The cost is $O(n \log n)$ time and $O(\log n)$ stack space.

**Insight.** The median is the order statistic with rank $k = (n + 1) / 2$. Since $n$ is odd, the zero-based target is $t = (n - 1) / 2 = n / 2$, a single element.

**Derivation.** Run the median-of-three quickselect with the target $n / 2$. The partition places the pivot block, the comparison with the target chooses the side, and the loop stops when the block contains the target. No sort is needed, and the array is rearranged in place.

**Correctness.** The theorem applies with $k = (n + 1)/2$. The odd count guarantees a unique median position; duplicates do not matter because the equal block returns the same value for every position inside it.

**Complexity.** Expected $O(n)$ time, $O(1)$ auxiliary space in the iterative form, and $O(n)$ worst case.

**Common wrong approach.** Computing the average of the two middle elements. With an odd count there is only one middle element, and averaging `arr[n/2 - 1]` with `arr[n/2]` returns a value that need not be in the array and is not the median. A related error is using the 1-based formula on a 0-based array, which returns the element after the median.

### Problem 2: Who's in the Middle

**Restatement.** Given an odd number $N < 10^4$ of milk outputs, each between $1$ and $10^6$, print the median output.

**Naive baseline.** Sort the $N$ values and print `a[N / 2]`. At $N < 10^4$, the sort is fast enough; the cost is $O(N \log N)$.

**Insight.** The task is the order statistic of rank $(N + 1)/2$ in a static array. A selection finds it without ordering the rest.

**Derivation.** Apply quickselect with target $N / 2$. Because $N$ is odd, the median is a single element and no average is needed. The median-of-three pivot gives a balanced first partition on sorted and reverse-sorted input, and the three-way block handles repeated milk outputs.

**Correctness.** The theorem applies with $k = (N + 1)/2$ and $t = N/2$. The value at that sorted position is the median by definition.

**Complexity.** Expected $O(N)$ time and $O(1)$ auxiliary space. The sort baseline is $O(N \log N)$ and is also acceptable at this bound.

**Common wrong approach.** Averaging two values when the count is odd. This problem guarantees an odd count, so the average reports a value that is not in the input and is not the median. Another error is indexing a 1-based array at $N/2$, which is the element before the median.

### Problem 3: Median

**Restatement.** Given $n$ integers between $0$ and $10^9$, print the median. If $n$ is even, the median is the mean of the two middle values; if $n$ is odd, it is the single middle value.

**Naive baseline.** Sort the array in $O(n \log n)$ time and read the middle position or positions.

**Insight.** The answer depends on one or two order statistics: the lower middle at index $(n - 1)/2$ and the upper middle at index $n/2$. For odd $n$ the two indices coincide; for even $n$ they are adjacent.

**Derivation.** Select the lower middle, then select the upper middle if $n$ is even. For even $n$, combine the two selected values as the statement requires; the sum of two values at most $10^9$ still fits in a signed 32-bit integer, but a 64-bit accumulator removes the boundary question. Each selection is independent, and the array may be permuted between them.

**Correctness.** The lower and upper middle indices are exactly the positions that the definition names. For odd $n$ they are the same position, so the second selection is redundant but harmless.

**Complexity.** One selection is expected $O(n)$; two selections are still expected $O(n)$, with twice the constant. The space is $O(1)$ auxiliary.

**Common wrong approach.** Selecting only index $n/2$ for an even count. That is the upper middle, and it ignores the lower middle, so the average is replaced by one of the two inputs.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for one rank, many ranks, a rank inside a subarray, or a rank in a stream. Only the first is quickselect.
2. **Direct application.** Implement the median-of-three quickselect and compare its output with `std::sort` on every permutation of five random values.
3. **Adaptation.** Replace the two-way partition with the three-way partition and check an array of ten thousand equal values. The three-way version should finish in one round, while the two-way version degenerates.
4. **Combination.** Use selection to find the $k$-th value, then sort the first $k$ positions and print the top $k$ in order. Compare the cost with a heap of size $k$.
5. **Challenge.** Implement a uniform random pivot with a fixed seed and count the comparisons on sorted, reverse-sorted, random, and duplicate-heavy inputs. Then implement median of medians and compare the constants.
6. **Transfer.** Solve a range $k$-th query with a wavelet tree, and a streaming median with two heaps. Both answer order-statistic questions with a different structure, and neither uses quickselect.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a three-way partition guarantee about the three blocks, and why does the equal block occupy contiguous sorted positions? (Formal model)
2. Why does quickselect not need to examine the discarded side? (Key insight)
3. State the loop invariant and the two assignments that preserve it. (Algorithm derivation)
4. Why does the partition advance `i` after a `<` swap but not after a `>` swap? (Implementation walkthrough)
5. What is the smallest counterexample to sending a rank below the equal block to the right, and what does the buggy program report? (Common mistakes)
6. Why is the median-of-three rule better than the first-element pivot on sorted input? (Common mistakes)
7. Derive the expected $O(n)$ bound from the probability of a pivot in the middle half. (Complexity analysis)
8. What input makes a two-way partition quadratic, and how does the three-way partition fix it? (Complexity analysis)
9. When is sorting once better than $Q$ selections, and when is a wavelet tree better than both? (Algorithm selection)
10. Why can the recursive form overflow the stack while the iterative form cannot? (Recursion decision)

## Further reading

- [Sorting](/algorithms/foundations/sorting) covers quicksort, the partition that quickselect reuses, and the partial-sorting problem that selection solves.
- [Binary search](/algorithms/searching/binary-search) is the other technique that discards half the input after one comparison; the two share the idea of a monotone decision.
- [Complexity](/algorithms/foundations/complexity) covers the expected-versus-worst-case distinction and the geometric series used in the analysis.
- [Recursion](/algorithms/foundations/recursion) explains why the recursive form has a depth equal to the number of rounds.
- [Wavelet trees](/algorithms/range-queries/wavelet-tree) answer the $k$-th smallest query inside a subarray, which quickselect cannot do efficiently.
- [Persistent segment trees](/algorithms/range-queries/persistent-segment-tree) are the other standard structure for range order statistics.
- [Fenwick trees](/algorithms/range-queries/fenwick-tree) support the online version, where values are inserted and ranks are queried between insertions.
- [Coordinate compression](/algorithms/arrays/coordinate-compression) turns arbitrary values into the small ranks that the online structures index.
- [Parallel binary search](/algorithms/advanced/parallel-binary-search) is the offline technique for many monotone searches over one structure, the multi-query relative of selection.
- The subject index lists this technique beside the others in [the advanced algorithms](/algorithms/advanced/).
