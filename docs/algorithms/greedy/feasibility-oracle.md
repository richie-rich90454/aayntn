---
id: greedy.feasibility-oracle
title: Greedy with a feasibility oracle
summary: Take the lightest items first, and use a monotone feasibility test to decide how many of them fit inside a capacity.
division: [silver, gold]
subjects: [greedy]
level: intermediate
importance: common-contest-technique
keywords:
    [
        greedy,
        feasibility oracle,
        feasibility check,
        binary search on the answer,
        prefix sums,
        monotone predicate,
        capacity,
        lightest first,
        exchange argument,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [searching.binary-search, arrays.prefix-sums]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - Every item has a nonnegative weight, every item is worth exactly one unit, and the capacity is a nonnegative integer.
    - Feasibility is monotone in the count, so once k items no longer fit, no larger count can fit either.
implementations: greedy.feasibility-oracle
reviewed: false
---

<AlgorithmSummary algorithm="greedy.feasibility-oracle" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="greedy.feasibility-oracle" />

## At a glance

A budget of $W$ units and $n$ items, each with a weight. Every item is worth the same, so the objective is a count, and the only constraint is that the chosen items have total weight at most $W$. The task is to choose as many items as possible.

The greedy rule is to take the lightest items first. Sorting the weights and walking the sorted order until the next item no longer fits produces the answer in one pass. The proof is an exchange argument: for every $k$, the $k$ lightest items have the smallest total weight of any $k$ items, so if any $k$ items fit, the $k$ lightest ones fit.

The feasibility oracle is the same fact turned into a function. Let $P(k)$ be the total weight of the $k$ lightest items. Then $P(k) \le W$ is true exactly when some set of $k$ items fits. Because weights are nonnegative, $P(k)$ never decreases, so the predicate is monotone and the answer is the largest $k$ for which it holds. A scan walks the predicate one step at a time; a binary search jumps to its threshold. Both are correct, and the oracle view is the one that transfers to problems whose check is more expensive than a prefix sum.

The technique costs $O(n \log n)$ time, dominated by the sort, and $O(n)$ space. It is the unit-value cousin of the [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack): the moment the items have different values, the exchange argument breaks and the problem needs a dynamic program.

## Problem motivation

A cargo hold has a weight limit, and a shipper wants to move as many crates as possible in one trip. A student has a fixed budget and wants to buy as many books as possible from a list with different prices. A contest server has a memory limit and wants to run as many jobs as possible, each with a known footprint.

All three have the same shape.

- There are $1 \le n \le 200\,000$ items.
- Each item $i$ has a nonnegative weight $a_i$, with $0 \le a_i \le 10^9$.
- The capacity is $W$, with $0 \le W \le 10^{18}$.
- A set of items is feasible when its total weight is at most $W$.
- Every item is worth one unit, so the value of a set is its size.

The naive answer tries every subset, which is $2^n$ and hopeless for $n = 200$. A dynamic program over the capacity is also hopeless, because $W$ can be $10^{18}$ and the table would never fit in memory. The structure that saves the problem is that all items are worth the same: among two sets of the same size, the lighter one is never worse.

The problem is worth a full article because the same architecture appears with different feasibility checks. A binary search over a radius, a waiting time, or a number of buses needs a predicate that says whether a candidate answer is achievable, and that predicate is usually a greedy simulation. The sum version in this article is the smallest complete example of that architecture, and the one where every part can be proved without hand-waving.

## Recognition patterns

The technique is the right tool when all of the following hold.

- Every item is worth the same, and the objective is the number of items.
- The constraint is a single additive budget: the sum of the chosen weights must be at most $W$.
- The weights do not change when other items are chosen, so the cost of a set is the sum of its parts.
- There is no requirement on which items are chosen beyond the total, such as one item per category or a matching between items.

The phrases that signal it are "as many as possible", "total weight at most", "within a budget", "how many fit", and "at most $W$". The phrase that rules it out is "maximize the total value", because a weighted version does not have a greedy solution.

The constraint values decide which form of the technique to write.

| Constraint | What it rules |
| --- | --- |
| Every item is worth 1 | Rules in the lightest-first rule; distinct values need the knapsack |
| The budget is a sum of item weights | Rules in the prefix-sum oracle |
| $W \le 10^6$ and $n$ is small | A capacity dynamic program also works, but it is slower and uses more memory |
| $W$ is up to $10^{18}$ | Rules out any table indexed by the capacity |
| Items have different values | Rules out this technique entirely |
| Items are grouped, with one item per group | Rules out this technique; it is a matroid or matching problem |
| The answer is monotone and the check is a greedy simulation | Rules in the oracle architecture, even when the check is not a sum |
| Weights or the capacity can be negative | Outside this model; the $k$ lightest still minimize the sum, but monotonicity can fail when the capacity is negative |

The last row is a boundary of the model rather than a failure of the exchange argument. The $k$ lightest items minimize the total weight for every $k$ even when some weights are negative. What can fail is monotonicity when the capacity is negative: a prefix can be infeasible while a longer prefix is feasible again. This article assumes nonnegative weights and a nonnegative capacity, which is the physical case.

## Naive approach

The baseline enumerates every subset and keeps the largest feasible one.

```python
best = 0
for mask in range(1 << n):
    total = 0
    size = 0
    for i in range(n):
        if mask >> i & 1:
            total += weights[i]
            size += 1
    if total <= capacity:
        best = max(best, size)
```

This is $O(n 2^n)$, which is about $2 \cdot 10^5 \cdot 2^{200000}$ for the largest input. It is a correct specification of the problem and not a solution to anything.

The second baseline is a dynamic program over the capacity. Let `reachable[w]` be the largest number of items with total weight exactly $w$, and update it item by item. The table has $W + 1$ entries, so the cost is $O(nW)$ time and $O(W)$ space. With $W = 10^{18}$ the table does not exist, and even with $W = 10^6$ the product $nW$ is far too large.

The third baseline is the greedy rule applied to the input order, which is the mistake worth writing down.

```python
used = 0
count = 0
for weight in weights:          # input order, not sorted
    if used + weight <= capacity:
        used += weight
        count += 1
```

With weights $[3, 1, 1]$ and capacity $3$, this takes the $3$ and then stops, returning $1$. The correct answer is $2$, by taking the two ones. The greedy idea is right; the order is wrong.

## Key insight

The insight is that the lightest items are the cheapest way to buy a count.

Suppose an optimal set $S$ has $k$ items and does not contain the globally lightest item. Let $x$ be the heaviest item of $S$, and let $y$ be an item outside $S$ that is no heavier than $x$; the globally lightest item is such a $y$. Then $S' = S - \{x\} + \{y\}$ has the same size and a total weight no larger, because $y \le x$. Repeating this exchange turns any optimal set into the $k$ lightest items without ever making it infeasible. That is the whole argument, and it is what the formal proof below makes precise.

The same argument says something stronger: for each $k$, the $k$ lightest items have the minimum possible total weight among all sets of size $k$. So the question "does some set of $k$ items fit?" has a one-line answer, "do the $k$ lightest items fit?" This is the feasibility oracle.

::: math invariant Invariant
After the scan has taken the first $k$ items of the sorted order, the remaining capacity is $W - P(k)$, and every item that has not been examined weighs at least as much as the last item taken, when at least one item has been taken.
:::

The invariant says the scan never needs to look back. It also says why the scan can stop at the first item that does not fit: every later item is at least as heavy, so none of them fits either.

## Visual intuition

Draw the sorted weights as bars on a number line and measure the running total from the left. The answer is the last bar whose right edge is still at or before the capacity mark.

```text
capacity W = 12

0    1    3    7              14
|----|----|----|---------------|
[ 1 ][ 2 ][ 4 ][    7    ][ 9 ]
      three items fit          the fourth crosses the mark
```

The running total is the prefix-sum curve. It only moves up, because every bar has a nonnegative height. The answer is the index of the last point at or below the horizontal line $y = W$.

The picture to hold is a shelf of increasing height: the lightest crates go on first, and the shelf is full at the first crate that does not fit. A rule that picks a heavy crate first leaves a gap that no later crate can use, because every later crate is at least as heavy.

## Formal model

Let the weights be $a_1, a_2, \ldots, a_n$ with $a_i \ge 0$, and let $W \ge 0$ be the capacity. For a set $S \subseteq \{1, \ldots, n\}$, write

$$
w(S) = \sum_{i \in S} a_i.
$$

::: math definition Definition
A set $S$ is **feasible** when $w(S) \le W$. The **optimum** is the largest size of a feasible set,

$$
k^{\ast} = \max \{\, |S| : w(S) \le W \,\}.
$$
:::

After sorting, write the weights in nondecreasing order as

$$
a_{(1)} \le a_{(2)} \le \cdots \le a_{(n)}.
$$

::: math definition Definition
The **prefix weight** of a count $k$ is

$$
P(k) = \sum_{i=1}^{k} a_{(i)}, \qquad P(0) = 0.
$$

The **feasibility oracle** is the predicate

$$
\operatorname{feasible}(k) \iff P(k) \le W.
$$
:::

::: math lemma Lemma
For every subset $S$ with $|S| = k$, $w(S) \ge P(k)$.
:::

The lemma is the exchange argument in one line. Its proof is below, and it is the only nontrivial step in the whole technique.

::: math lemma Lemma
If every weight is nonnegative, then $P(k+1) \ge P(k)$ for every $0 \le k < n$. Consequently, $\operatorname{feasible}(k+1)$ implies $\operatorname{feasible}(k)$.
:::

Monotonicity is what makes the oracle searchable. It also says the feasible counts form a prefix $0, 1, \ldots, k^{\ast}$ of the possible counts.

## Algorithm derivation

The algorithm has two stages: an ordering stage and a counting stage.

**Ordering.** Sort the weights in nondecreasing order. This is the only place where the technique spends more than linear time.

**Counting by scan.** Keep a running total `used` and a count `count`, both initialized to zero. Walk the sorted weights. If the next weight is greater than the remaining capacity $W - \text{used}$, stop, because every later weight is at least as large. Otherwise add it and increment the count.

**Counting by oracle.** Build the prefix sums $P(0), P(1), \ldots, P(n)$, then binary search for the largest $k$ with $P(k) \le W$. The predicate is monotone, so the search is the standard upper-bound search.

The ordering stage feeds either counting form, and both produce the same number. The scan is the shorter program and the one to write when the whole array is available. The oracle form matters when the feasibility test is expensive or when the same predicate is queried many times; for the pure sum problem the scan is almost always the shorter choice.

::: math invariant Invariant
During the scan, `used` equals $P(k)$ for the current count $k$, and every item before the current position belongs to the prefix that `used` measures. Every item at or after the current position weighs at least $a_{(k+1)}$, when such an item exists.
:::

The scan never moves the current position backwards, and it never removes an item. The binary search never evaluates the predicate outside the remaining interval. Both are consequences of the same monotonicity.

## Step-by-step execution

Take weights $[4, 2, 9, 1, 7]$ and capacity $W = 12$.

Sorted, the weights are $[1, 2, 4, 7, 9]$, and the prefix weights are:

| $k$ | The $k$ lightest | $P(k)$ | $P(k) \le 12$ |
| --- | ---------------- | ------ | ------------- |
| 0   | empty            | 0      | yes           |
| 1   | 1                | 1      | yes           |
| 2   | 1, 2             | 3      | yes           |
| 3   | 1, 2, 4          | 7      | yes           |
| 4   | 1, 2, 4, 7       | 14     | no            |
| 5   | 1, 2, 4, 7, 9    | 23     | no            |

The largest feasible count is $3$.

The scan performs these steps.

- The remaining capacity is $12$, and the count is $0$.
- The first weight is $1$, which is at most $12$, so it is taken. The remaining capacity becomes $11$, and the count becomes $1$.
- The next weight is $2$, which is at most $11$, so it is taken. The remaining capacity becomes $9$, and the count becomes $2$.
- The next weight is $4$, which is at most $9$, so it is taken. The remaining capacity becomes $5$, and the count becomes $3$.
- The next weight is $7$, which is greater than $5$, so the scan stops. Every later weight is at least $7$, so none of them fits either.

The answer is $3$.

The binary search on the oracle takes these steps.

- The interval is $[0, 5]$. The upper middle is $3$, and $P(3) = 7 \le 12$, so the answer is at least $3$ and the interval becomes $[3, 5]$.
- The upper middle of $[3, 5]$ is $4$, and $P(4) = 14 > 12$, so the answer is below $4$ and the interval becomes $[3, 3]$.
- The interval has one point, so the answer is $3$.

Both traces visit the same threshold from opposite sides. The scan arrives from below, one item at a time; the binary search cuts the interval in half.

## Correctness proof

::: math lemma Lemma
For every subset $S$ with $|S| = k$, $w(S) \ge P(k)$.
:::

::: math proof Proof
Write the elements of $S$ in nondecreasing order as $s_1 \le s_2 \le \cdots \le s_k$.

For each $i$, the $i$ elements $s_1, \ldots, s_i$ are all at most $s_i$, so at least $i$ elements of the whole array are at most $s_i$. Therefore the $i$-th smallest element of the whole array is at most $s_i$:

$$
a_{(i)} \le s_i.
$$

Summing these inequalities over $i = 1, \ldots, k$ gives

$$
P(k) = \sum_{i=1}^{k} a_{(i)} \le \sum_{i=1}^{k} s_i = w(S).
$$

The set $S$ was arbitrary, so the bound holds for every set of size $k$. $\square$
:::

::: math theorem Theorem
The scan returns $k^{\ast}$, the largest size of a feasible set.
:::

::: math proof Proof
Let $k^{\ast}$ be the largest feasible count.

For every $k \le k^{\ast}$, monotonicity gives $P(k) \le P(k^{\ast}) \le W$, so the scan takes the $k$-th item and does not stop before reaching count $k^{\ast}$.

If $k^{\ast} = n$, the scan takes every item and returns $n = k^{\ast}$. Otherwise, $k^{\ast} + 1 \le n$ and maximality gives $P(k^{\ast}+1) > W$. At that point the remaining capacity is $W - P(k^{\ast})$, and the next weight is $a_{(k^{\ast}+1)}$, which is larger than the remaining capacity. The scan stops with count $k^{\ast}$, and every later item is at least as heavy, so no later item could have been taken.

No feasible set can be larger than $k^{\ast}$ by definition, and the prefix of size $k^{\ast}$ is itself feasible. Therefore the returned count is optimal. $\square$
:::

::: math theorem Theorem
$\operatorname{feasible}(k)$ is true if and only if some set of $k$ items has total weight at most $W$.
:::

::: math proof Proof
If some set $S$ of size $k$ is feasible, then the prefix lemma gives $P(k) \le w(S) \le W$, so the predicate is true.

Conversely, if the predicate is true, the $k$ lightest items form a set of size $k$ whose total weight is $P(k) \le W$, so that set is feasible. $\square$
:::

The binary search is correct because it searches a monotone predicate on a finite interval. At every step the lower end is feasible and the upper end is infeasible or still a candidate, and the interval shrinks. When the interval collapses, the lower end is the largest feasible count.

## Complexity analysis

**Time: $O(n \log n)$**, dominated by the sort. The scan is $O(n)$, because every weight is examined once and the loop stops early when the capacity is exhausted.

**Time with the oracle: $O(n \log n)$** for the sort, plus $O(n)$ for the prefix sums and $O(\log n)$ for the binary search. The search is never the bottleneck.

**Auxiliary space: $O(n)$** for the sorted array. The scan needs $O(1)$ additional space beyond the array. The oracle needs $O(n)$ additional space for the prefix sums; the scan avoids them entirely.

::: math complexity Complexity
Sorting: $O(n \log n)$. Scan: $O(n)$ time and $O(1)$ extra space. Oracle: $O(n)$ preprocessing and $O(\log n)$ queries. Total: $O(n \log n)$ time and $O(n)$ space.
:::

The arithmetic deserves a line of its own. With $n \le 2 \cdot 10^5$ and $a_i \le 10^9$, the largest possible total is $2 \cdot 10^{14}$, which fits in a signed 64-bit integer and is exactly representable as a double. A 32-bit accumulator overflows on the third item of weight $10^9$, and the scan then produces a wrong count without any warning. The C, C++, and Java reference programs use `long long` or `long`; Python integers are arbitrary precision, and JavaScript numbers are safe under the stated bounds because $2 \cdot 10^{14} < 2^{53}$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Equal values, additive budget, maximize the count | Sort ascending and scan, or use the prefix-sum oracle |
| Equal values, additive budget, minimize the count to reach a quota | Sort descending and scan |
| Distinct values, additive budget | 0/1 knapsack, not this technique |
| Equal values, one shared resource over time | Interval scheduling, not this technique |
| Equal values, deadlines or release times | Scheduling with deadlines, not this technique |
| A monotone answer and a greedy feasibility check | Binary search on the answer, with this oracle architecture |
| Two independent capacities | Not greedy in general; needs a two-dimensional dynamic program |
| One item per category | Reduce each category to its lightest item, then sort the representatives |
| Weights arrive one at a time and cannot all be stored | Keep a max-heap of the selected weights, and evict the heaviest when the budget is exceeded |
| Weights or the capacity can be negative | Outside this model; the scan still takes the lightest items, but a negative capacity can break monotonicity |

The streaming row is the one that surprises people. When the items arrive online, the scan over a sorted array is unavailable, but a max-heap of the selected weights recovers the same answer: push every item, and whenever the running total exceeds $W$, remove the heaviest item. The heap keeps a maximum-size feasible set of the items seen so far, and at the end it holds the answer. The proof is the same exchange argument applied at every prefix.

## Reference implementations

The manifest publishes one `program` variant per language, and all six solve exactly the stated problem: read $n$ and $W$, read $n$ weights, print the largest number of weights whose total is at most $W$.

- `c/program.c` uses `qsort` with a three-way comparator and a `long long` accumulator.
- `cpp17/program.cpp` uses `std::sort` and a range loop that stops at the first weight that does not fit.
- `java/Main.java` uses `Arrays.sort` on a `long[]`, a byte-oriented scanner, and a single `println`.
- `python/program.py` sorts a list of integers and scans it; Python integers remove the overflow concern entirely.
- `pascal/program.pas` uses an iterative bottom-up merge sort, `Int64` arithmetic, `SysUtils`, and one argument per `Read`, so it compiles under pas2js.
- `javascript/program.js` sorts with a numeric comparator and uses `Number` arithmetic, which is exact for the stated bounds.

The input and output contract is the same in every language. The first line contains $n$ and $W$, the next tokens are the $n$ weights in any order, and the output is one line holding the count. Whitespace is interchangeable, so the programs read token by token rather than line by line. No trailing space is printed, and the line ends with a newline.

The six programs differ mainly in how they sort and how they read. The counting loop is the same in all of them:

```text
used = 0
count = 0
for weight in sorted(weights):
    if weight > capacity - used:
        break
    used += weight
    count += 1
return count
```

The comparison is written as `weight > capacity - used` rather than `used + weight > capacity`. The two are equivalent while `used <= capacity`, but the first form cannot overflow a signed accumulator when the capacity is near the maximum of its type.

## Recursion decision

The algorithm itself is iterative in every language. There is no recursive helper to write, and adding one would only move the same loop onto the call stack.

The sort may recurse internally. The C library `qsort`, C++ `std::sort`, Java `Arrays.sort`, Python `list.sort`, and JavaScript `Array.prototype.sort` all choose their own strategies, and their recursion depth is logarithmic in practice. The Pascal version uses an iterative bottom-up merge sort so that the published listing has no recursion at all and is easy to compile under pas2js.

| Language | Sort used | Recursion | Verdict |
| --- | --- | --- | --- |
| C | `qsort` | Internal, implementation-defined | Fine; the comparator is the only code to review |
| C++ | `std::sort` | Introsort, $O(\log n)$ depth | Fine |
| Java | `Arrays.sort` | Dual-pivot quicksort, $O(\log n)$ depth | Fine |
| Python | `list.sort` | Timsort, $O(\log n)$ depth | Fine |
| Pascal | Bottom-up merge sort | None | Fine under pas2js |
| JavaScript | `Array.prototype.sort` | Engine-defined, $O(\log n)$ depth | Fine; the comparator must be numeric |

The binary search is also iterative. A recursive formulation would be correct but adds a call per halving for no benefit, and the iterative version makes the invariant on the interval explicit.

## Implementation walkthrough

Three details decide whether the implementation matches the statement.

**The order.** Sort ascending. Sorting descending answers the dual question, the minimum number of items needed to reach a quota, and it returns one item for the canonical example instead of three.

**The stopping rule.** Stop at the first weight that does not fit. Because the array is sorted, every later weight is at least as heavy, so continuing cannot find a smaller one. A version that skips the heavy weight and keeps scanning is not wrong on sorted input, but it is wasted work; a version that scans unsorted input is wrong, as the counterexample in the previous section shows.

**The accumulator width.** Use a signed 64-bit integer in C, C++, and Java. The capacity can be $10^{18}$ and the total can be $2 \cdot 10^{14}$, so a 32-bit type overflows long before the input limits are reached.

The C++ core is the shape the other languages copy.

```cpp
std::sort(weights.begin(), weights.end());

long long used = 0;
int count = 0;
for (long long weight : weights) {
    if (weight > capacity - used) {
        break;
    }
    used += weight;
    ++count;
}
```

The oracle form adds prefix sums and an upper-bound search.

```cpp
std::vector<long long> prefix(n + 1, 0);
for (int i = 0; i < n; ++i) {
    prefix[i + 1] = prefix[i] + weights[i];
}

int low = 0;
int high = n;
while (low < high) {
    int middle = low + (high - low + 1) / 2;
    if (prefix[middle] <= capacity) {
        low = middle;
    } else {
        high = middle - 1;
    }
}
```

The upper middle `low + (high - low + 1) / 2` is the detail that prevents an infinite loop. With the lower middle, the interval $[0, 1]$ would compute `middle = 0`, assign `low = 0`, and never shrink. The `+ 1` biases the midpoint upward, so a feasible middle always advances the lower end.

The Python version is short enough to read as pseudocode.

```python
weights.sort()
used = 0
count = 0
for weight in weights:
    if weight > capacity - used:
        break
    used += weight
    count += 1
print(count)
```

**Reading the input.** The Java version uses a byte-oriented scanner rather than `Scanner`, because $200\,000$ weights are enough to make `Scanner` the slowest part of the program. The Pascal version calls `Read` once per integer, which is required by the pas2js console unit. The C version reads with `scanf`, and the C++ version reads with `std::cin` after disabling synchronization.

**Writing the output.** The output is a single integer, so every language prints it directly. Java and JavaScript build no output buffer, because there is only one line.

**The Pascal sort.** The merge is the usual two-run merge over an auxiliary array. The comparison is `<`, and equal weights may be taken from either side; the output is a count, so stability is irrelevant.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Taking items in input order | A heavy early item blocks several light ones | Sort ascending first |
| Sorting descending | The scan returns the minimum count for a quota, not the maximum count for a budget | Sort ascending |
| Using a 32-bit accumulator | The total wraps and the count is too large | Use `long long`, `long`, or `Int64` |
| Adding before checking | The total can exceed the capacity by one item | Check `weight > capacity - used` before adding |
| Binary searching with the lower middle | The interval $[0, 1]$ never shrinks | Use the upper middle, `+ 1` |
| Allocating `n` prefix entries | The query for count $n$ reads past the end | Allocate $n + 1$ entries, with `prefix[0] = 0` |
| Assuming fractional items | A part of the next item is counted as a whole one | The problem says whole items; stop at the first that does not fit |
| Applying the rule to distinct values | A light item of low value displaces a heavy item of high value | Use the knapsack when values differ |
| Using floating point for the total | Sums above $2^{53}$ lose precision | Use integer arithmetic |
| Forgetting the empty set | A capacity smaller than every weight must return 0 | Initialize the count to 0 and let the loop stop immediately |

### Why this fails: the input-order greedy

The most common failure is not a subtle proof error but a missing sort. Take weights $[3, 1, 1]$ and capacity $3$.

- **Input order.** The first weight is $3$, which fits, so it is taken and the remaining capacity becomes $0$. Neither of the two ones fits, and the count is $1$.
- **Sorted order.** The weights are $[1, 1, 3]$. The first $1$ is taken, the second $1$ is taken, and the $3$ no longer fits. The count is $2$.

The input-order rule loses an item because the heavy item consumes the budget that two light items could have shared. Sorting is not an optimization detail; it is the step that makes the exchange argument true.

### Why this fails: heaviest first on a tight budget

The descending rule is the mirror mistake. Take weights $[2, 2, 3]$ and capacity $4$.

- **Heaviest first.** The $3$ is taken and the remaining capacity is $1$. Neither $2$ fits, so the count is $1$.
- **Lightest first.** The two $2$s are taken and the count is $2$.

Descending order answers a different question. It minimizes the number of items needed to reach a total, which is useful when the goal is to cover a quota, not when the goal is to pack as many items as possible.

## Variants and extensions

- **The average constraint.** [Middle Class](https://codeforces.com/problemset/problem/1334/B) asks for the largest group whose average is at least $x$. Cross multiplication turns the condition into "the sum of the $k$ richest people is at least $k \ast x$", which is the same oracle with the inequality reversed and the sort descending. The count is still found by scanning the sorted prefix sums.
- **The minimum count to reach a quota.** Minimize the number of items whose total reaches $W$. Sort descending and take the heaviest items until the total reaches the quota. The exchange argument is the mirror image, and the proof needs the values to be nonnegative for the same reason.
- **An oracle over a different check.** [Angry Cows](https://usaco.org/index.php?page=viewproblem2&cpid=594) and [Convention](https://usaco.org/index.php?page=viewproblem2&cpid=858) both binary search an answer, and both check a candidate with a greedy simulation rather than a prefix sum. The architecture is this article's, with the sum replaced by a covering or packing rule.
- **The streaming version.** When the weights arrive one at a time, keep a max-heap of the selected weights. Push each new weight and, while the running total exceeds $W$, remove the heaviest. The heap holds a maximum-size feasible set at every prefix, and the final size is the answer.
- **A cap on the number of items.** If the statement also limits the count to $m$, the answer is $\min(k^{\ast}, m)$, because the $m$ lightest items are also feasible whenever the $k^{\ast}$ lightest are. The extra cap costs nothing.
- **Two capacities.** When every item consumes two resources, the lightest-first rule can fail: a light item in the first resource may be heavy in the second. The problem becomes a two-dimensional knapsack and needs a dynamic program.
- **One item per category.** Replace each category by its lightest item first. Any chosen item can be swapped for that representative without increasing the total weight, so the category constraint disappears and this technique applies to the representatives.
- **The weighted objective.** When items have different values, the objective is the total value under the budget, and the problem is the [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack). The greedy rule can be arbitrarily far from optimal.
- **Implicit weights.** If the weights are generated by a formula and cannot be stored, the sum of the $k$ smallest can be computed by a selection algorithm, and the oracle can still binary search the count. This is an advanced variant; the direct scan is unavailable.

## Contest strategy

Under contest pressure, the errors above are what cost points, and the technique can be applied with a fixed procedure.

1. Check that every item is worth the same. If the items have values, stop: the greedy rule is wrong and a dynamic program is needed.
2. Check that the constraint is one additive budget. If there are two budgets or a per-category limit, the simple rule does not apply.
3. Sort ascending, and write the comparison as `weight <= capacity - used` rather than `used + weight <= capacity`.
4. Use a 64-bit accumulator in every language that has fixed-width integers.
5. Test four inputs by hand: one item that fits, one item that does not, all items fitting, and a capacity of zero.
6. If the count is the only output, the scan is enough. If the statement asks for a feasibility decision or binary searches the answer, write the oracle as a separate function and prove it monotone before searching.

The last step is the one that transfers to harder problems. In [Angry Cows](https://usaco.org/index.php?page=viewproblem2&cpid=594) the oracle is "can $K$ cows with radius $R$ cover every bale", and the greedy check places each cow as far right as possible. In [Convention](https://usaco.org/index.php?page=viewproblem2&cpid=858) the oracle is "can every cow wait at most $T$", and the greedy check fills each bus with the earliest arrivals that fit. The proof obligation moves from the sort to the oracle, but the architecture is unchanged.

## Worked problems

### Problem 1: the cargo hold

**Restatement.** $n$ crates have weights $a_i$. The hold carries at most $W$ total weight. Choose the largest number of crates whose total weight is at most $W$. Constraints: $1 \le n \le 200\,000$, $0 \le a_i \le 10^9$, $0 \le W \le 10^{18}$.

**Naive baseline.** Enumerate the subsets, at a cost of $O(n 2^n)$, or run a capacity dynamic program, at a cost of $O(nW)$.

**Insight.** For every $k$, the $k$ lightest crates have the smallest total weight of any $k$ crates, so they are feasible whenever any $k$ crates are.

**Derivation.** Sort the weights, keep a running total, and take each crate while it fits. Stop at the first crate that does not, because every later crate is at least as heavy.

**Correctness.** The prefix lemma gives the lower bound on every $k$-set, and the scan reaches the largest $k$ whose prefix weight is at most $W$. No larger set can fit.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, dominated by the sort.

**Common wrong approach.** Taking the crates in the order they arrive. The input $[3, 1, 1]$ with capacity $3$ returns $1$ instead of $2$.

### Problem 2: Angry Cows

**Restatement.** $n$ hay bales sit at distinct positions on a line. A cow launched with power $R$ destroys every bale within distance $R$ of where it lands. Given $K$ cows, find the smallest integer $R$ that can destroy every bale. Constraints: $1 \le n \le 50\,000$, $1 \le K \le 10$, positions up to $10^9$.

**Naive baseline.** Try every radius from $0$ to $10^9$, and for each one simulate every possible landing position. The radius range alone is too large, and the landing positions are continuous.

**Insight.** If radius $R$ works, every larger radius works, so the answer is the smallest feasible $R$ and can be binary searched. To test $R$, place the first cow so that it covers the leftmost remaining bale and reaches as far right as possible.

**Derivation.** Sort the positions. For a candidate $R$, take the leftmost uncovered bale at position $x$ and land a cow at $x + R$. That cow destroys every bale in $[x, x + 2R]$. Jump to the first bale beyond $x + 2R$ and repeat. If the number of cows used is at most $K$, the radius is feasible.

**Correctness.** The leftmost uncovered bale must be destroyed by some cow. Landing that cow as far right as possible still destroys the bale and covers a superset of the bales that any other landing position for that cow could cover, so the greedy placement never uses more cows than an optimal placement. The feasibility predicate is monotone in $R$, so the binary search returns the minimum.

**Complexity.** $O(n \log n)$ for the sort, $O(n)$ per feasibility check, and $O(\log 10^9) \approx 30$ checks, for $O(n \log n + n \log 10^9)$ time and $O(n)$ space.

**Common wrong approach.** Placing the cow at the bale itself. That covers $[x - R, x + R]$ instead of $[x, x + 2R]$, wastes the left half of the blast, and uses more cows than necessary.

### Problem 3: Convention

**Restatement.** $n$ cows arrive at times $t_i$. There are $M$ buses, each holding at most $C$ cows, and a bus may leave only after its last cow arrives. Assign every cow to a bus so that the maximum waiting time is as small as possible. Constraints: $1 \le n, M \le 100\,000$, $1 \le C \le n$, $0 \le t_i \le 10^9$.

**Naive baseline.** Try every assignment of cows to buses. The number of assignments is exponential in $n$.

**Insight.** If a maximum wait of $T$ is achievable, every larger $T$ is achievable, so the answer is monotone and can be binary searched. For a fixed $T$, the minimum number of buses is found greedily: fill each bus with the earliest cows that can wait at most $T$ and fit within $C$ seats.

**Derivation.** Sort the arrival times. For a candidate $T$, start a bus at the first remaining cow, whose arrival time is $s$. The bus can take at most $C$ cows, and only cows arriving at or before $s + T$. Take that prefix, start the next bus at the first cow beyond it, and count the buses. The candidate is feasible when the count is at most $M$.

**Correctness.** The first remaining cow must be on some bus, and that bus cannot leave later than $s + T$ without violating the bound for that cow. Leaving at $s + T$ and taking every cow that fits is at least as good as leaving earlier, because the cows it takes are exactly the ones that would otherwise expire soonest. Repeating the argument on the remaining suffix shows the greedy count is the minimum, and the predicate is monotone in $T$.

**Complexity.** $O(n \log n)$ for the sort, $O(n)$ per check, and $O(\log 10^9) \approx 30$ checks, for $O(n \log n + n \log 10^9)$ time and $O(n)$ space.

**Common wrong approach.** Checking only the total number of cows against $M \ast C$. The capacity condition is necessary but not sufficient, because the waiting bound can force more buses than the seat count suggests.

## Practice progression

1. **Recognition.** Given a statement, decide whether the items are worth the same and whether the constraint is one additive budget. Check the equal-value condition first.
2. **Direct application.** Implement the sort and the scan, and verify it against a subset enumeration on random small inputs.
3. **Oracle form.** Add prefix sums and an upper-bound binary search, and check that both forms return the same count on the same inputs.
4. **Adaptation.** Reverse the inequality for the average or quota version, and add the max-heap for the streaming version.
5. **Combination.** Combine the oracle with a binary search on a non-sum answer, as in Angry Cows or Convention, and prove that the greedy check is exact before searching.
6. **Transfer.** Recognize the architecture in problems whose check is a covering, packing, or scheduling simulation, and separate the monotone predicate from the greedy routine that evaluates it.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the greedy rule in one sentence, and say which order it sorts on. (Key insight)
2. Why do the $k$ lightest items have the smallest total weight of any $k$ items? (Correctness proof)
3. What is the feasibility oracle, and what does it return for a count $k$? (Formal model)
4. Why is the predicate monotone, and where is nonnegativity used? (Formal model)
5. Why can the scan stop at the first item that does not fit? (Algorithm derivation)
6. Give the smallest counterexample to the input-order greedy, and the answer it produces. (Common mistakes)
7. Why does sorting descending answer a different problem? (Common mistakes)
8. What is the time bound, and which part of it is the sort? (Complexity analysis)
9. Why is the comparison `weight > capacity - used` rather than `used + weight > capacity`? (Implementation walkthrough)
10. Why does the binary search use the upper middle? (Implementation walkthrough)
11. How does the streaming version replace the sort? (Variants and extensions)
12. How do Angry Cows and Convention use the same architecture with a different oracle? (Worked problems)

## Further reading

- The order that makes the prefix minimal is the subject of [sorting](/algorithms/foundations/sorting).
- The search that finds the threshold of a monotone predicate is [binary search](/algorithms/searching/binary-search).
- The running totals that turn the oracle into an $O(1)$ query are [prefix sums](/algorithms/arrays/prefix-sums).
- The problem that replaces the greedy rule when items have values is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The scheduling technique that handles deadlines and release times is [scheduling with deadlines and release times](/algorithms/greedy/scheduling-deadlines-and-release-times).
- The scan over sorted data that pairs items instead of counting them is [two pointers](/algorithms/searching/two-pointers).
