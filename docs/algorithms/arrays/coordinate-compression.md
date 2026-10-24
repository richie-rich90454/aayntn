---
id: arrays.coordinate-compression
title: Coordinate compression
summary: Replace the values of an array by their ranks, so that a structure indexed by value can be used on data whose values are large, sparse or symbolic.
division: [gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords: [coordinate compression, discretization, rank, order preserving map, offline queries]
prerequisites:
    required: [foundations.sorting]
    recommended: [foundations.complexity, range-queries.fenwick-tree]
complexity:
    time: "O(n log n + q log n)"
    space: "O(n)"
assumptions:
    - Only the relative order and the equality of the values matter to the question being asked.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Use a structure indexed by value on data whose values are too large to index directly |
| **Time** | $O(n \log n)$ |
| **Auxiliary space** | $O(n)$ |
| **Requires** | The question depends on the order of the values, not on their magnitudes |
| **Fails when** | The question asks for a difference, a sum, an average or a distance between values |
| **Primary technique** | An order-preserving bijection from the distinct values to the integers $0 \ldots m-1$ |
| **Sibling article** | The ordered structure that consumes the ranks is in [Fenwick tree](/algorithms/range-queries/fenwick-tree) |

Coordinate compression replaces each value by its rank among the distinct values of the data. Two values get the same rank exactly when they are equal, and a smaller value gets a smaller rank. After the replacement, a value range of size $10^9$ becomes a range of size $n$, and every structure indexed by value becomes affordable.

The technique is not a hash map with better constants. A hash map answers "have I seen this exact value?" in constant time and says nothing about order. Compression gives up the constant time and buys the total order, which is what the range structures need.

## Problem motivation

A sensor records $n$ readings. Each reading is a whole number of microvolts, and the instrument reports them as integers up to $10^9$. A controller must answer many questions of the form "how many readings fell in the interval $[100\,000, 200\,000]$?".

The constraints:

- $1 \le n \le 200\,000$ readings.
- $0 \le a_i \le 10^9$.
- Up to $200\,000$ queries, each an interval of values, all of them known before the readings are given.

The obvious structure is a Fenwick tree indexed by the value: add one at position $a_i$ for each reading, and answer an interval with two prefix sums. The trouble is the size. A tree with a billion positions would need a billion counters, which is several gigabytes, and the queries arrive before the readings, so the tree has to be sized from the values alone.

The values are huge but the readings are few. There are at most $200\,000$ distinct readings, so there are at most $200\,000$ distinct positions that can ever hold a count. Everything else is guaranteed to hold zero.

That observation is the whole technique. Replace each value by its rank, build the tree over the ranks, and every counter that would have been zero is now a position that simply does not exist.

## Recognition patterns

Coordinate compression is the right tool when all of the following hold.

- The question depends on the **order** of the values or on **equality**, not on their magnitudes.
- The values are **large**, **sparse**, **negative**, or **not integers at all**, so they cannot index an array directly.
- An **order-based structure** is needed: a Fenwick tree, a segment tree, a sorted container, or an order-statistic tree.
- The data is available **before** the queries, or the queries can be read and answered offline.

The phrases that signal it are "the values are up to $10^9$", "the values may be as large as $10^{18}$", "coordinates", "compressed", "discretize", "at most $10^9$ distinct". The phrases that rule it out are "the difference between the largest and the smallest", "the average", "the total of the values", "how far apart are two readings".

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $a_i \le 10^9$ with $n \le 10^5$ | Direct indexing costs $4$ GB; compression is required |
| $a_i \le 10^5$ with $n \le 10^5$ | Direct indexing costs $400$ KB; compression is optional |
| $a_i$ are arbitrary 64-bit integers | Compression is the only way to index by value |
| The values are strings or pairs | Compression still works, as long as there is a total order |
| The queries are not known until the data arrives | The queries must be compressed too, by binary search |
| The question needs a difference of values | Compression destroys the difference |

The last row is the one that catches people, and it is the subject of the counterexample below.

<Synonyms terms="coordinate compression, discretization, value compression, rank mapping, order preserving mapping" />

## Naive approach

The baseline is to index by value directly.

```cpp
const int MAX_VALUE = 1000000000;
std::vector<int> counts(MAX_VALUE + 1, 0);
for (int value : readings) ++counts[value];
```

This is correct and it is $O(1)$ per reading, but it allocates $4 \cdot 10^9$ bytes. The program does not run out of time; it runs out of memory, before it has read the input.

The second baseline is a sorted vector with binary search, which costs $O(\log n)$ per query and needs no compression at all. It is the right answer when the only question is "how many values are at most $x$" and the queries are few, and it is the right answer when the questions are not about counts at all.

The third baseline is a hash map of the values, which answers "how many times does $x$ occur" in constant time per query. It cannot answer "how many values are in $[l, r]$" without something extra.

## Key insight

The insight is that **most questions about a set of values only care about their order**.

Suppose the distinct values of the data, in increasing order, are

$$
v_0 < v_1 < \cdots < v_{m-1}.
$$

Define the **rank** of a value by

$$
\operatorname{rank}(x) = \bigl| \{ i : v_i \le x \} \bigr| - 1
$$

for $x$ among the values that occur, and by the same formula with $v_i < x$ for a value that does not occur. The map $v_i \mapsto i$ is a strictly increasing bijection from the distinct values to $\{0, 1, \ldots, m-1\}$.

A strictly increasing map preserves every comparison. So for any two values $x$ and $y$ that occur in the data,

$$
x < y \iff \operatorname{rank}(x) < \operatorname{rank}(y),
\qquad
x = y \iff \operatorname{rank}(x) = \operatorname{rank}(y).
$$

That is the whole content of the technique. Every algorithm that decides its behavior by comparing values behaves exactly the same on the ranks as on the values. A Fenwick tree that counts the values in an interval gives the same answer on the ranks, provided the interval is also compressed.

What the map does **not** preserve is the difference between two values, or their sum, or their ratio. The gap between $v_0$ and $v_{m-1}$ in the original data may be a billion, and in the compressed data it is $m - 1$. The compression is not a rescaling; it is a change of what the numbers mean.

The second half of the insight is what to do with values that do not occur in the data. A query threshold $x$ may lie between two consecutive values. The compressed answer is then the number of ranks strictly below $x$, which is exactly the number of distinct values $v_i < x$, and it is found by a binary search over the sorted distinct values. That is the "offline" part of the technique: the queries are translated into rank queries before any data arrives.

## Formal model

Let $V = \{v_0 < v_1 < \cdots < v_{m-1}\}$ be the sorted distinct values of a multiset $M$ of $n$ values.

::: math definition Definition
The **rank** of a value $x$ with respect to $V$ is
$$
\rho(x) = \bigl| \{ j \in \{0, \ldots, m-1\} : v_j < x \} \bigr|.
$$
It is the number of distinct values of the data that are strictly less than $x$,
so $\rho(x) \in \{0, 1, \ldots, m\}$ for an arbitrary $x$, and
$\rho(v_j) = j$ for every $j$.
:::


::: math definition Definition
A map $\rho$ is **order preserving** if $x < y$ implies $\rho(x) < \rho(y)$.
The compression of a multiset is the multiset in which every value $x$ is
replaced by $\rho(x)$.
:::


::: math lemma Lemma
For any two values $x$ and $y$ of the data, $x \le y$ if and only if
$\rho(x) \le \rho(y)$, and $x = y$ if and only if $\rho(x) = \rho(y)$. For an
arbitrary threshold $x$, the number of data values that are strictly less
than $x$ equals the number of data values whose rank is strictly less than
$\rho(x)$.
:::


The second half of the lemma is the statement that justifies compressing the queries as well: the count of values below a threshold is the same in both worlds.

::: math invariant Invariant
During the compression, the array of ranks has the same multiset of
comparison outcomes as the array of values: for every pair of indices $p$ and
$q$, the comparison between $a_p$ and $a_q$ is unchanged, and every rank is
the rank of its own value.
:::


## Algorithm derivation

The compression is done in three steps.

1. Copy the values into a list and sort it, then remove the duplicates. The result is the sorted distinct list $v_0 < v_1 < \cdots < v_{m-1}$.
2. For each value $a_i$, find $\rho(a_i)$ and store it.
3. For each query threshold $x$, find $\rho(x)$ by a binary search over the same list.

Step 1 costs $O(n \log n)$ for the sort and $O(n)$ for the deduplication. Step 2 costs $O(n \log m)$ if each rank is found by a binary search, and $O(n)$ if the ranks are assigned by a single sweep. Step 3 costs $O(q \log m)$ for $q$ queries.

The sweep in step 2 is the version to write when the time limit is tight. Sort the _indices_ of the array by the value at that index, then walk the sorted indices once, and assign the next rank each time the value changes. That is one sort and one linear pass, so the whole compression is $O(n \log n)$ with a small constant.

```cpp
std::vector<int> order(n);
std::iota(order.begin(), order.end(), 0);
std::sort(order.begin(), order.end(), [&](int p, int q) { return a[p] < a[q]; });

std::vector<int> rank(n);
int current = -1;
long long previous = 0;
bool first = true;
for (int index : order) {
    if (first || a[index] != previous) {
        ++current;
        first = false;
    }
    rank[index] = current;
    previous = a[index];
}
```

The counter `current` is the rank, and it is increased exactly when the value changes, which is what makes equal values share a rank.

## Step-by-step execution

Take $a = [500, 100, 500, 900, 300]$. The sorted distinct values are $100, 300, 500, 900$.

- The sweep visits the indices in the order of their values: index 1 (value 100), index 4 (value 300), index 0 (value 500), index 2 (value 500), index 3 (value 900).
- Index 1 is the first value, so the rank counter starts at 0. The rank of index 1 is 0.
- Index 4 has a new value, so the counter becomes 1. The rank of index 4 is 1.
- Index 0 has a new value, so the counter becomes 2. The rank of index 0 is 2.
- Index 2 has the same value as index 0, so the counter stays at 2. The rank of index 2 is 2.
- Index 3 has a new value, so the counter becomes 3. The rank of index 3 is 3.

The compressed array is $[2, 0, 2, 3, 1]$. The order of the elements is preserved: the value 500 still comes before the value 900, and the two occurrences of 500 still have the same rank.

A query with the threshold $x = 400$ is compressed by binary search over $[100, 300, 500, 900]$: the number of distinct values strictly below 400 is 2, so the compressed threshold is 2, and a Fenwick tree over ranks in $[0, 3]$ answers "how many readings are at most 400" with a prefix sum at 2, which counts the readings with ranks 0 and 1, that is, the readings 100 and 300.

## Correctness proof

::: math theorem Theorem
The compression preserves every comparison between two values of the data, and
for every threshold $x$ it preserves the number of data values that are
strictly less than $x$. Therefore any algorithm that answers the question by
comparing values and counting them returns the same answer on the compressed
data.
:::


::: math proof Proof
By construction the ranks are assigned in increasing order of value, and two
values share a rank exactly when they are equal. So for two values $x$ and
$y$ of the data, $x < y$ implies that $x$ is assigned a smaller rank than
$y$, because the sweep visits the values in increasing order and the counter
only increases when the value changes. Equal values are visited consecutively
and share the counter's value. The comparison between any two elements of
the array is therefore unchanged.

Now let $x$ be an arbitrary threshold and let $t$ be the number of distinct values of the data that are strictly less than $x$. By the definition of the rank, $\rho(x) = t$. An element $a_i$ of the data is strictly less than $x$ if and only if its rank is one of $0, 1, \ldots, t - 1$, so the number of elements strictly below $x$ is exactly the number of elements with rank below $\rho(x)$. The count is the same in both worlds.

An algorithm that decides everything by comparisons and counts therefore behaves identically on the compressed data, and in particular it returns the same answer. $\square$
:::


## Complexity analysis

**Time: $O(n \log n + q \log n)$.** The sort of the values or of the indices costs $O(n \log n)$. The rank assignment costs $O(n)$ with the sweep and $O(n \log n)$ with a binary search per element. Each of the $q$ query thresholds costs $O(\log n)$ to compress. The dominant term is the sort.

**Auxiliary space: $O(n)$** for the copy of the values, the sorted order, and the rank array. The compressed data structure itself is $O(m)$, where $m$ is the number of distinct values, and $m \le n$.

::: math complexity Complexity
Coordinate compression: $O(n \log n + q \log n)$ time and $O(n)$ auxiliary
space, with $O(n)$ for the rank assignment when it is done with a sweep and
$O(n \log n)$ when each rank is found by a binary search.
:::


The saving is worth stating in numbers. A Fenwick tree over the original values of a $10^9$ range needs $4 \cdot 10^9$ bytes. The same tree over the compressed ranks of $2 \cdot 10^5$ distinct values needs $800\,000$ bytes, and the queries are answered on exactly the same data.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count values in a range, values up to $10^9$ | Compression and a Fenwick tree |
| Same question, values up to $10^5$ and $n \le 10^5$ | Direct indexing, which is simpler and faster |
| Count occurrences of one exact value | A hash map, no compression needed |
| Order-statistic queries, the k-th smallest | A sorted array with binary search, or a segment tree over ranks |
| Sum of the values in a range | A prefix sum over the original values; compression destroys the sum |
| Merge many sorted lists | A sort, or a heap; compression is not needed |
| Compare two values for equality and nothing else | A hash map |

The second row is worth pausing on, because it is the case where compression is unnecessary. When the values are small enough to index directly, compression is extra work: a sort that may cost more than the direct allocation. Compression earns its place when the value range is much larger than the number of elements.

## Recursion decision

The compression itself is a sort, and every standard sort has a recursion depth of $O(\log n)$, which is safe in every language. The interesting case is a hand-written ordered structure built on the compressed ranks.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursive sort is fine; a recursive unbalanced tree is not |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | `Arrays.sort` on objects is a merge sort and is fine |
| Python | Interpreter limit of 1000 | 1000 frames | `sorted` is fine; a recursive merge sort on $2 \cdot 10^5$ elements is at depth about 18 and is fine |
| Pascal | The operating system stack | Depends on the platform | A recursive sort is fine |
| JavaScript | The V8 engine limit | About $10^4$ frames | `Array.prototype.sort` is fine |

The warning is about the tree that is built on top. A balanced tree over the compressed ranks has depth $O(\log n)$ and is safe. An unbalanced one, such as a binary search tree built by inserting the ranks in the order they appear in the data, has depth $O(n)$ in the worst case and overflows the stack in every language on a decreasing input.

## Implementation walkthrough

The two lines that carry the technique are the assignment of a new rank and the binary search for a query threshold.

```cpp
if (current == -1 || a[index] != previous) ++current;   // a new value, a new rank
rank[index] = current;
```

The condition compares against the _previous value_, not against the previous rank. Two equal values must share a rank, and comparing ranks would give every element its own rank.

For the query threshold, the binary search must find the number of distinct values strictly below the threshold, and the standard lower bound does exactly that.

```cpp
auto below = std::lower_bound(distinct.begin(), distinct.end(), threshold);
int compressed = static_cast<int>(below - distinct.begin());
```

Using `upper_bound` instead counts the values at most the threshold, and using a raw `std::find` gives the rank of the threshold only when the threshold actually occurs. Each of those is a different question.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the compressed rank as if it were the value | Every arithmetic answer is wrong | Keep the original values for arithmetic |
| Giving equal values different ranks | Counts and set membership break | Compare values, not ranks, when assigning |
| Forgetting to compress the query thresholds | The queries land in the wrong place | Binary search every threshold |
| Using `upper_bound` where `lower_bound` is meant | The threshold is counted on the wrong side | Decide whether the interval is closed |
| Compressing when the values are already small | Extra work, slower and longer | Index directly when the range is affordable |
| Compressing each query independently | The query ranks do not match the data ranks | Use the same sorted distinct list |
| Forgetting that the rank of a value not in the data is a count of smaller values | The threshold is off by one | Use `lower_bound` over the distinct list |

### Why this fails: the difference between two readings

The mistake that survives review is compressing the data and then forgetting that the question was about a magnitude. It is easy to do, because the compressed problem looks like a perfectly ordinary array problem.

The smallest counterexample has two elements. Take $a = [5, 7]$ and ask for the difference between the largest and the smallest value.

The correct answer is 2.

The compressed array is $[0, 1]$, because 5 is the smaller distinct value and 7 is the larger one. The difference of the compressed array is 1. The answer is wrong, and no amount of care in the compression changes it, because the compression destroyed the very quantity the question asked about.

The failure grows with the data. Take $a = [1, 1000]$: the correct difference is 999 and the compressed difference is 1. Take $a = [1, 2, 3, \ldots, 10^9]$: the correct difference is $10^9 - 1$ and the compressed difference is 9.

The second failure, in the other direction, is compressing the data but not the queries. Suppose the tree is built over the ranks and a query asks for the values at most $400\,000$. If the threshold is used as a rank, the tree counts the readings whose rank is at most $400\,000$, which is every reading, because there are at most $200\,000$ distinct values. The answer comes back as $n$ and looks like a legitimate number.

The lesson generalizes: **compression preserves order and equality, and nothing else.** Before compressing, write down what the question does with the numbers. If it ever adds, subtracts, multiplies or divides two values, the answer must come from the original values.

## Variants and extensions

- **Compressing the queries.** The offline version, where the query thresholds are translated into ranks by a binary search before the data arrives.
- **Two-dimensional compression.** For a grid, compress the row coordinates and the column coordinates separately. The pairs are then indices into a sparse structure.
- **Coordinate compression with multiplicities.** When the values are counts rather than positions, the compression can be applied to the cumulative counts, so that a rank means "the number of items at or below this value" rather than "the number of distinct values below it".
- **Stable compression.** When equal values must keep their relative order for some other purpose, assign the ranks by sorting the indices with a stable tie-break rather than by sorting the values.
- **Compressing a range that is not the data.** Sometimes the values to be compressed come from a different array, and the same sweep assigns ranks in both.
- **Rank and the original value together.** Keeping a table from rank back to the original value makes it possible to recover the value of an answer, which is what a problem that asks for the value rather than the count needs.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide whether the values can index an array directly. If they can and the range is small, do that instead.
2. Write down what the question does with the numbers. If it adds or subtracts them, keep the original values.
3. Compress the queries as well as the data, and do both with the same distinct list.
4. Decide whether a value equal to the threshold is counted, and use `lower_bound` or `upper_bound` accordingly.
5. Assign ranks with a sweep after one sort, rather than with a binary search per element, when the time limit is tight.
6. Test the compressed array by hand: the order must be the same, and equal values must still be equal.

## Worked problems

### Problem 1: counting the readings in an interval

**Restatement.** Given $n$ readings with values in $[0, 10^9]$ and $q$ queries, each asking how many readings lie in the closed interval $[l, r]$, report the answers. Constraints: $1 \le n, q \le 200\,000$.

**Naive baseline.** A scan of the readings for every query, at $O(nq)$.

**Insight.** Only the distinct readings matter, and there are at most $n$ of them.

**Derivation.** Compress the readings into ranks, build a Fenwick tree over the ranks with one increment per reading, and convert each query interval into a pair of rank bounds with two binary searches.

**Correctness.** The lemma shows that the count of readings in $[l, r]$ equals the count of readings whose ranks are in the compressed interval, and the Fenwick tree counts exactly those.

**Complexity.** $O(n \log n + q \log n)$ time and $O(n)$ space.

**Common wrong approach.** Using the query thresholds directly as tree indices, which counts the wrong readings.

### Problem 2: the k-th smallest reading

**Restatement.** Given $n$ readings and $q$ queries, each asking for the k-th smallest reading, report the answers. Constraints: $1 \le n, q \le 200\,000$, values up to $10^9$.

**Naive baseline.** Sort the readings and answer each query with one lookup, at $O(n \log n + q)$.

**Insight.** A sorted array of the original values answers the question directly, so the compression is only needed when a range structure is also required.

**Derivation.** Sort the readings, keep the original values, and for each query report the element at position $k - 1$.

**Correctness.** The k-th smallest element of a sorted array is the element at position $k - 1$, by the definition of the order statistic.

**Complexity.** $O(n \log n + q)$ time and $O(n)$ space.

**Common wrong approach.** Reporting the compressed rank instead of the value, which answers a different question.

### Problem 3: the most frequent reading in a range

**Restatement.** Given $n$ readings and $q$ queries over index ranges, report the most frequent reading in each range. Constraints: $1 \le n, q \le 200\,000$, values up to $10^9$.

**Naive baseline.** Count the readings of each range with a hash map, at $O(nq)$ expected time.

**Insight.** The readings must be indexed by value to be counted in a range, and the values are too large to index directly.

**Derivation.** Compress the readings into ranks, build a segment tree over the ranks that stores, for each node, the frequency of the most frequent value inside it, and merge two nodes by taking the larger frequency.

**Correctness.** The compression preserves equality, so the frequency of a value is the frequency of its rank, and the segment tree merges the correct answers of its two children.

**Complexity.** $O(n \log n + q \log n)$ time and $O(n)$ space.

**Common wrong approach.** Storing only the frequency in the segment tree and not the value that achieves it, so that the answer cannot be recovered.

## Practice progression

1. **Recognition.** Given a statement, decide whether compression applies. Look for large or sparse value ranges, and check that the question is about order or equality rather than magnitude.
2. **Direct application.** Implement the compression with a sort and a sweep, and verify that every comparison between two elements is unchanged.
3. **Adaptation.** Implement the compression of the query thresholds, and the two-dimensional version for a grid.
4. **Combination.** Use the compressed ranks to build a Fenwick tree, a segment tree and an order-statistic tree, and answer the same counting question with each.
5. **Challenge.** Compress a set of values that are not the data, such as the coordinates of a second array, and keep the two rank sets consistent.
6. **Transfer.** Recognize the same idea in a different setting: the sweep line that sorts events by coordinate, the ordered map that replaces a huge array of counters, and the offline algorithm that answers every query in one pass.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the compression preserve, and what does it destroy? (Key insight)
2. Give the smallest array on which compressing changes a difference. (Common mistakes)
3. State the definition of the rank of an arbitrary threshold. (Formal model)
4. Why must the query thresholds be compressed as well? (Key insight)
5. When is direct indexing better than compression? (Algorithm selection)
6. What does the sweep after the sort cost, and what does a binary search per element cost? (Complexity analysis)
7. Why do equal values have to share a rank, and what breaks if they do not? (Common mistakes)
8. When is `lower_bound` the right search and when is `upper_bound`? (Implementation walkthrough)
9. How do you recover the original value of an answer? (Variants and extensions)
10. What is the space of a Fenwick tree over the original values, and over the compressed ones? (Complexity analysis)
11. Why is a hash map not a substitute for compression? (Naive approach)
12. Which recursion depths are safe here, and which are not? (Recursion decision)

## Further reading

- The ordered structure that consumes the compressed ranks is in [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The other structure that consumes them, with range aggregates, is in [segment tree](/algorithms/range-queries/segment-tree).
- The running totals that answer range questions without any compression are in [prefix sums](/algorithms/arrays/prefix-sums).
- The sort that produces the distinct list is described in [sorting](/algorithms/foundations/sorting).
- The difference array, which is the other way to turn a large value range into a small one, is in [difference arrays](/algorithms/arrays/difference-arrays).
