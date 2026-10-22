---
id: dynamic-programming.longest-increasing-subsequence
title: Longest increasing subsequence
summary: Find the longest strictly increasing subsequence of a sequence in quadratic time with a dynamic program, and in n log n time with patience sorting.
division: [silver, gold]
subjects: [dynamic-programming]
level: intermediate
importance: common-contest-technique
keywords:
    [
        longest increasing subsequence,
        lis,
        patience sorting,
        tails array,
        dynamic programming,
        binary search,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [searching.binary-search, foundations.recursion]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The sequence is static, so that a value once read is never changed.
    - The comparison is a total order, so that "strictly less" is a transitive relation.
reviewed: false
---

## At a glance

The longest increasing subsequence problem asks for the longest sequence of elements of an input sequence, taken in their original order, such that the values strictly increase.

There are two answers, and they are worth learning together because the second one hides the first.

The **dynamic program** runs in $O(n^2)$ time and $O(n)$ space. It defines one state per position, the length of the best increasing subsequence that ends at that position, and each state looks at all the earlier positions. The answer is the largest state.

The **patience sorting** method runs in $O(n \log n)$ time and $O(n)$ space. It keeps a single array called the **tails array**, and the only operation it performs on that array is a binary search for the first element that is at least as large as the value being inserted. The length of the tails array is the length of the longest increasing subsequence.

The tails array is not the subsequence. Its length is the answer; its contents are a table of minimum endings, one per length, and the entries come from different subsequences. The article works through a concrete instance where reading the tails array as the answer produces a sequence that does not occur in the input at all.

## Problem motivation

A streaming service holds the watch history of ten million users as a sequence of the video identifiers each user watched, in order. The recommendation engine wants to know, for one user, the longest run of watched videos whose popularity scores strictly increase. The history is a sequence of $n = 10^6$ scores in the order they were watched, and the question is the length of the longest increasing subsequence of that sequence.

The constraint decides the algorithm. At $n = 10^6$, the quadratic dynamic program performs about $5 \times 10^{11}$ comparisons, which is minutes of work, and the contest time limit is two seconds. The $O(n \log n)$ method performs about $2 \times 10^7$ comparisons and finishes comfortably.

Both methods are worth knowing. The dynamic program is the one that generalizes to weighted versions, to counting versions, and to the variants where the sequence must satisfy extra conditions. The patience sorting method is the one that fits inside the time limit. A competitor who knows only the first will find the second unfamiliar, and a competitor who knows only the second will not be able to answer the "count the increasing subsequences" variant.

## Recognition patterns

The problem is a longest increasing subsequence problem when all of the following hold.

- The input is a **sequence**, and the answer must respect the original order. If the order may be rearranged, the answer is simply the number of distinct values.
- The question asks for a **maximum** over a family of subsequences.
- The values are compared with a **total order**, so that "strictly increasing" is meaningful.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| $n \le 2000$ | The $O(n^2)$ dynamic program passes easily |
| $n \le 10^5$ | The quadratic program is about $5 \times 10^9$ comparisons; use patience sorting |
| $n \le 10^6$ | Only patience sorting fits |
| The sequence changes between queries | Neither method applies directly; the structure must be rebuilt |
| The values are bounded by $W$ | A dynamic program over values, indexed by value, is often faster |

The last row is worth remembering. When the values are small, an alternative dynamic program indexed by value rather than by position computes the length in $O(n \log W)$ or even $O(n)$ time with a different formulation. The patience sorting method handles that case naturally, because its binary search is over the tails and not over the values.

Two phrases in a problem statement are strong signals. "Longest", "maximum", "best" point at a maximization. "Subsequence", "in the original order", "keeping the order" point at the ordering constraint that separates this problem from the much easier "longest increasing subset".

## Naive approach

The baseline is the quadratic dynamic program, written directly from the definition.

```python
def lis_length(a):
    n = len(a)
    best = [1] * n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i] and best[j] + 1 > best[i]:
                best[i] = best[j] + 1
    return max(best) if n else 0
```

The state is `best[i]`, the length of the longest increasing subsequence that ends at index $i$. The update is `best[i] = 1 + max(best[j])` over the indices $j < i$ with $a[j] < a[i]$. The answer is the largest entry.

This is $O(n^2)$ time and $O(n)$ space, it is correct, and it is the reference implementation for the differential test.

The second baseline is the recursive one, which is instructive precisely because it is wrong.

```python
def f(i):                       # the longest increasing subsequence starting at i
    best = 1
    for j in range(i + 1, len(a)):
        if a[i] < a[j]:
            best = max(best, 1 + f(j))
    return best
```

Without memoization this explores the same subsequences many times and costs $O(2^n)$ in the worst case, which is the case of a strictly increasing sequence. The dynamic program is exactly this function with a table of answers in front of it.

## Key insight

The dynamic program's insight is that **the best subsequence ending at $i$ only needs the best subsequences ending at earlier positions**. Any increasing subsequence ending at $i$ has a penultimate element $j$ with $j < i$ and $a[j] < a[i]$, so its length is at most $1 + \text{best}[j]$, and the bound is achieved by appending $a[i]$ to the best subsequence ending at $j$. That is the whole recurrence.

The patience sorting method's insight is different and sharper. It asks a different question: **among all increasing subsequences of length $k$ that have been seen so far, what is the smallest possible last element?**

That question has a beautiful answer, because the smallest last element is always the most useful one. A smaller last element is easier to extend: if a value $v$ can be appended to a subsequence ending in $u$, then it can also be appended to any subsequence ending in $u' < u$. So keeping only the minimum loses nothing.

Write that minimum in an array `tails`, where `tails[k]` is the smallest last element of an increasing subsequence of length $k+1$ seen so far. The array is sorted, because a subsequence of length $k+2$ contains one of length $k+1$ that ends earlier and smaller. So `tails` is strictly increasing, and the position of a new value $x$ in `tails` says exactly how long the longest increasing subsequence ending in $x$ is: it is one more than the position.

That gives the whole algorithm. For each value $x$, find the first position in `tails` whose value is at least $x$, replace it with $x$, and if there is no such position, append $x$. The length of `tails` at the end is the answer.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be a sequence of elements of a totally ordered set.

<MathPanel type="definition" title="Definition">
An **increasing subsequence** of $a$ is a sequence of indices
$i_1 < i_2 < \cdots < i_m$ with $a_{i_1} < a_{i_2} < \cdots < a_{i_m}$. Its
**length** is $m$. The **longest increasing subsequence** has the greatest
such length.
</MathPanel>

<MathPanel type="definition" title="Definition">
Let $D_i$ be the length of the longest increasing subsequence that ends at
index $i$. Then $D_i \ge 1$ for every $i$, and the length of the longest
increasing subsequence is $\max_i D_i$.
</MathPanel>

<MathPanel type="recurrence" title="Recurrence">
$$
D_i = 1 + \max\bigl(\{D_j : 1 \le j < i \text{ and } a_j < a_i\} \cup \{0\}\bigr).
$$
</MathPanel>

<MathPanel type="definition" title="Definition">
After the first $t$ elements have been processed, the **tails array** is the
sequence $T_0, T_1, \ldots$ where $T_k$ is the smallest last element of any
increasing subsequence of length $k+1$ that uses only the first $t$ elements.
A length with no such subsequence has no entry.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
The tails array is strictly increasing: if $T_k$ and $T_{k+1}$ both exist,
then $T_k < T_{k+1}$.
</MathPanel>

<MathPanel type="proof" title="Proof">
Let $u$ be an increasing subsequence of length $k+2$ ending in $T_{k+1}$. Its
first $k+1$ elements form an increasing subsequence of length $k+1$ that ends
in some value $w$ with $w < T_{k+1}$. By the definition of $T_k$, the
smallest such value, $T_k \le w < T_{k+1}$. Hence $T_k < T_{k+1}$. $\square$
</MathPanel>

## Algorithm derivation

### The quadratic program

Compute $D_1, D_2, \ldots, D_n$ in order. For each $i$, scan the earlier indices $j < i$ and take the largest $D_j$ among those with $a_j < a_i$. The answer is the largest $D_i$.

To reconstruct the subsequence, keep a parent pointer: for each $i$, record the index $j$ that achieved the maximum. Following the parents from the index of the largest $D_i$ walks backwards along an increasing subsequence.

### The linear-logarithmic method

Maintain the array `tails`, initially empty. For each value $x$ in the input order:

1. Find the first position $p$ in `tails` with `tails[p] >= x`. This is a lower bound search, and it is the only nontrivial step.
2. If $p$ is past the end of `tails`, append $x$. Otherwise replace `tails[p]` with $x$.

The length of `tails` is the answer.

The lower bound search is what makes the method $O(n \log n)$ rather than $O(n^2)$. It is exactly the [binary search](/algorithms/searching/binary-search) for the boundary of the predicate "is `tails[k] >= x`", and the predicate is monotone because `tails` is increasing.

The operation "replace the first element that is at least $x$" is the same operation that the patience sorting card game performs: the $x$ card is placed on the leftmost pile whose top card is at least $x$, and the number of piles at the end is the length of the longest increasing subsequence.

### Reconstructing the subsequence

The tails array does not record which input element produced each entry, so the patience sorting method does not directly produce a subsequence. There are two ways around this.

The first is to keep a parallel array `source` where `source[p]` records the index of the input element that most recently wrote `tails[p]`. This is not sufficient on its own, because an entry may later be overwritten by a smaller value.

The second, and the standard, way is to run the method once to obtain the length $L$, and then run a second pass that reconstructs the subsequence backwards. At each step, scan the input from the right for the last element that is smaller than the target value, and repeat with the target set to that element. This is $O(n)$ per element, so the reconstruction is $O(nL)$ in the worst case, which is why the quadratic program with parent pointers is sometimes preferable when the actual subsequence is required.

## Step-by-step execution

Take the sequence $3, 5, 1, 2$. The dynamic program gives these states:

| Index $i$ | $a_i$ | $D_i$ |
| --------- | ----- | ----- |
| 1         | 3     | 1     |
| 2         | 5     | 2     |
| 3         | 1     | 1     |
| 4         | 2     | 2     |

The maximum is $2$, so the longest increasing subsequence has length $2$. The sequence $3, 5$ is one such subsequence and $1, 2$ is another.

Now the patience sorting method, with the tails array after each step:

| Value $x$ | Position $p$ found by the lower bound | `tails` after the step |
| --------- | ------------------------------------- | ---------------------- |
| 3         | 0, the array is empty                 | $[3]$                  |
| 5         | 1, past the end                       | $[3, 5]$               |
| 1         | 0, since $3 \ge 1$                    | $[1, 5]$               |
| 2         | 1, since $5 \ge 2$                    | $[1, 2]$               |

The final tails array is $[1, 2]$ and its length is $2$, which agrees with the dynamic program.

Notice what happened at the third step. The value $1$ did not extend the subsequence; it replaced the entry $3$, because $1$ is a smaller ending for a subsequence of length $1$. The array kept the best ending for each length, and the best ending for length $1$ changed from $3$ to $1$ because a smaller ending can be extended more easily.

It is tempting to read the final array $[1, 2]$ as "the answer is the subsequence $1, 2$". In **this** instance that reading happens to be harmless: the values $1$ and $2$ do occur at positions $3$ and $4$ of the input, in that order, so $1, 2$ really is an increasing subsequence. The instance does not disprove the reading, and it is worth saying so plainly rather than pretending otherwise. What the instance does show is that the tails array has no memory of _which_ subsequence produced it: the entry $3$ that occupied position $0$ after the second step belonged to the subsequence $3, 5$, and the entry $1$ that replaced it belongs to a different subsequence entirely. The array is a table of minimum endings, not a record of a single solution.

The next section gives the instance where the reading fails outright.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The quadratic dynamic program computes $D_i$ correctly for every index $i$.
</MathPanel>

<MathPanel type="proof" title="Proof">
Fix an index $i$. Any increasing subsequence ending at $i$ is either the
single element $a_i$, of length $1$, or has a penultimate index $j$ with
$j < i$ and $a_j < a_i$. In the second case its length is at most
$1 + D_j$, by the correctness of the earlier states. Hence every increasing
subsequence ending at $i$ has length at most
$1 + \max(\{D_j : j < i, a_j < a_i\} \cup \{0\})$.

Conversely, let $j$ attain that maximum, if any such $j$ exists. Take a longest increasing subsequence ending at $j$, of length $D_j$, and append $a_i$. The result is an increasing subsequence ending at $i$, because $j < i$ and $a_j < a_i$. Its length is $D_j + 1$, so the bound is achieved.

The recurrence therefore gives exactly $D_i$. By induction on $i$, every state is correct, and $\max_i D_i$ is the length of the longest increasing subsequence. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
The patience sorting method computes the length of the longest increasing
subsequence.
</MathPanel>

<MathPanel type="proof" title="Proof">
The claim is that after processing $a_1, \ldots, a_t$, the length of the
tails array equals the length of the longest increasing subsequence of that
prefix.

**The update is correct.** Suppose $x = a_t$ is placed at position $p$, so that $p = 0$ or $T_{p-1} < x$, and $T_p \ge x$ or $p$ is past the end.

If $p$ is past the end, then the previous prefix had a tails array of length $p$, so by the inductive hypothesis it had an increasing subsequence of length $p$, and appending $x$ gives an increasing subsequence of length $p+1$, which is longer than any before, because the tails array was strictly increasing and $x$ exceeds every entry in it.

If $p$ is not past the end, then $T_{p-1} < x$, so the prefix has an increasing subsequence of length $p$ ending in $T_{p-1}$, and appending $x$ gives an increasing subsequence of length $p+1$ ending in $x$. Hence $x$ is a valid entry for position $p$. No entry for position $p$ can be smaller than $x$: if some $y < x$ were the last element of an increasing subsequence of length $p+1$ from the previous prefix, then $y < T_p$ would have been found at position $p$ by the lower bound, contradicting the minimality of $p$. So $x$ is exactly the new minimum ending for length $p+1$. Entries before $p$ are unchanged and remain minimal, and entries after $p$ are unchanged and remain minimal, because the new subsequence of length $p+1$ ends in $x$, which is at most $T_p \le T_q$ for $q > p$.

**The length is the answer.** By the definition of the tails array, a tails array of length $L$ means an increasing subsequence of length $L$ exists, and the strict increase of the tails array means no longer one exists at the time it was created; and by the argument above, the array never shrinks. The induction closes. $\square$
</MathPanel>

<MathPanel type="counterexample" title="Counterexample">
Let $a = 2, 3, 1$. The tails array after each step is $[2]$, $[2, 3]$,
$[1, 3]$. The final array is $[1, 3]$ and its length $2$ is the correct
length of the longest increasing subsequence. But $[1, 3]$ is **not** a
subsequence of the input: the value $3$ occurs at index $2$ and the value $1$
at index $3$, so in the input the $3$ comes before the $1$. The array reads
the values in an order the input never produces.
</MathPanel>

## Complexity analysis

| Method | Time | Space |
| --- | --- | --- |
| Quadratic dynamic program | $O(n^2)$ | $O(n)$ for the states, $O(n)$ more for the parents |
| Quadratic dynamic program with a value-indexed table | $O(n \log W)$ | $O(W)$ |
| Patience sorting | $O(n \log n)$ | $O(n)$ |
| Patience sorting with reconstruction | $O(n \log n + nL)$ | $O(n)$ |

The patience sorting bound is $O(n \log n)$ because each element performs one binary search over a tails array of length at most $n$, and each search costs $O(\log n)$.

The space bound is $O(n)$ for the tails array in the worst case, which happens when the input is already strictly increasing.

The constant matters in practice. A quadratic program in C++ performs about $5 \times 10^9$ comparisons at $n = 10^5$, and the same program in Python performs about $5 \times 10^9$ interpreted comparisons, which is minutes. The patience sorting method performs about $17$ comparisons per element at $n = 10^5$, in either language.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The length of the longest increasing subsequence | Patience sorting |
| The subsequence itself, with $n \le 10^4$ | The quadratic program with parents |
| The length of the longest **non-decreasing** subsequence | Patience sorting with an upper bound search |
| The number of increasing subsequences | A quadratic program with a count, or a Fenwick tree over the values |
| The longest increasing subsequence of a **subarray** | A merge sort tree, or the patience sorting method applied to every node |
| The longest increasing subsequence with a weight | A segment tree over the values, or the quadratic program with weights |
| An increasing subsequence in a grid | A different problem; the order is by rows then columns |
| The longest decreasing subsequence | Reverse the comparison, or reverse the sequence |

The third row is a trap that has ended many contest solutions. A **lower bound** search finds the first element that is at least $x$, which is the strict version. An **upper bound** search finds the first element that is greater than $x$, which computes the longest _non-decreasing_ subsequence instead. The two differ on repeated values, and on the sequence $2, 2$ the strict answer is $1$ while the non-decreasing answer is $2$.

## Recursion decision

The recursive formulation of this problem is the one in the naive approach: $f(i)$ is the length of the longest increasing subsequence starting at index $i$, and it calls $f(j)$ for every $j > i$ with $a_i < a_j$.

Its depth is $n$, which is dangerous in the languages with small stacks, but that is not the real problem. The real problem is that without memoization it is exponential, and the fix is the table that turns it into the quadratic program. The memoized recursive version has the same time and space as the iterative one, and its recursion depth is $n$.

The practical recommendation is to write the iterative version. The recurrence has a loop structure with no other recursive calls, the iterative form has no stack depth limit at all, and the two versions are the same number of lines.

| Language   | Stack for $n = 10^5$             | Recommendation |
| ---------- | -------------------------------- | -------------- |
| C and C++  | About $10^5$ frames fits in 8 MB | Iterative      |
| Java       | About $10^4$ frames              | Iterative      |
| Python     | The interpreter limit of 1000    | Iterative      |
| Pascal     | The operating system stack       | Iterative      |
| JavaScript | About $10^4$ frames              | Iterative      |

## Implementation walkthrough

The lower bound search is the whole algorithm, and it must be a _lower_ bound.

```cpp
int p = lower_bound(tails.begin(), tails.end(), x) - tails.begin();
if (p == static_cast<int>(tails.size())) {
    tails.push_back(x);
} else {
    tails[p] = x;
}
```

`std::lower_bound` returns the first position whose value is **not less than** $x$, which is exactly the first position with `tails[p] >= x`. Using `std::upper_bound` instead computes the longest non-decreasing subsequence and silently changes the answer on any input with repeated values.

The second detail is that the array must be replaced, not inserted. A common mistake is to insert $x$ and keep the old value, which makes the array grow by one on every step and turns the method back into the quadratic program with a worse constant.

The third detail is the strictness of the comparison inside the search. For the strictly increasing version the condition is `tails[mid] < x`, which finds the first position with `tails[mid] >= x`.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Printing the tails array as the answer | The output is a sequence that is not a subsequence | Reconstruct separately, or use the parent pointers of the quadratic program |
| Using `upper_bound` instead of `lower_bound` | The longest non-decreasing subsequence is computed | Decide whether the comparison is strict before you start |
| Inserting instead of replacing | The array grows on every step and the method becomes quadratic | Replace the entry at the found position |
| Confusing a subsequence with a subset | The order constraint is dropped and the answer is too large | Keep the indices, not just the values |
| Assuming the tails array is sorted after an update | The binary search is invalid | The lemma proves it is strictly increasing; replace in place |
| Recomputing the whole DP for each new element | The method is quadratic again | Keep the table, or use the tails array |
| Using a `float` comparison in the search | The order is not a total order and the search is meaningless | Compare the values the same way the problem does |

### Why this fails: the tails array is not a subsequence

The plausible wrong approach is to skip the reconstruction entirely. The tails array has the right length, its entries are increasing, and its entries all come from the input, so it looks exactly like the answer. A program that prints the tails array is short, clean, and wrong.

The smallest counterexample is the three-element sequence $2, 3, 1$.

| Step | Value | Lower bound position  | `tails`  |
| ---- | ----- | --------------------- | -------- |
| 1    | 2     | 0, the array is empty | $[2]$    |
| 2    | 3     | 1, past the end       | $[2, 3]$ |
| 3    | 1     | 0, since $2 \ge 1$    | $[1, 3]$ |

The final tails array is $[1, 3]$ and its length is $2$, which is the correct answer. The two longest increasing subsequences of $2, 3, 1$ are $2, 3$ and the single element $1$. There is no increasing subsequence of length $2$ that is $1, 3$, because the $1$ is at index $3$ and the $3$ is at index $2$: in the input the $3$ comes first.

Printing the tails array therefore prints $1, 3$, a sequence that does not occur in the input in that order. The length is right and the values are right, but the order is not, and the order is the entire content of a subsequence.

The earlier instance $3, 5, 1, 2$ is instructive precisely because it does not expose the bug. Its tails array is $[1, 2]$, and $1, 2$ does occur in the input at positions $3$ and $4$, so a program that printed the tails array would be accidentally right. That is what makes this mistake dangerous: it survives small random tests that happen to contain a witness and fails on the ones that do not.

Why does the array fail? Because the entries of the tails array come from _different_ subsequences. The entry $3$ at position $0$ after step 2 belongs to the subsequence $3, 5$; the entry $1$ that replaced it at step 3 belongs to the single element $1$; and the entry $2$ at position $1$ belongs to $1, 2$. The array records, for each length, the smallest ending that has been seen. It is a table of minima, not a witness.

The lesson generalizes: **a minimum-ending table tells you the length, and nothing about which elements produced it.** If the problem asks for the subsequence, the program must reconstruct it.

## Variants and extensions

- **Longest non-decreasing subsequence.** Replace the lower bound with an upper bound, so that equal values extend one another.
- **Longest decreasing subsequence.** Reverse the comparison, or reverse the sequence and compute the increasing version.
- **Counting the increasing subsequences.** Keep a Fenwick tree indexed by value, and add to each value the sum of the counts at all smaller values. The count is over values rather than positions, which requires the values to be compressed.
- **The longest increasing subsequence of every subarray.** Build a merge sort tree and answer with a binary search on the value domain at each node, or use the patience sorting method inside the merge sort.
- **Weighted version.** The quadratic program generalizes directly: replace the length with a weight and take the maximum instead of adding $1$.
- **Smallest values of the tails array.** The entry $T_k$ is the smallest possible last element of an increasing subsequence of length $k+1$, which is a useful fact in its own right for problems that ask about the smallest possible ending rather than about the length.

## Contest strategy

1. Read the comparison carefully. "Strictly increasing" and "non-decreasing" are different problems and the binary search differs.
2. Write down whether the problem wants the length or the subsequence. The length is $O(n \log n)$; the subsequence needs a reconstruction.
3. If the answer must be printed, never print the tails array. Use the quadratic program with parent pointers, or reconstruct backwards.
4. Check the maximum $n$. Above $5000$ the quadratic program is at risk, and above $10^5$ it is hopeless.
5. When in doubt, write the quadratic program first and use it as the reference. Then write the patience sorting method and compare the two lengths on random inputs. The lengths must agree on every input, and if they do not, the search is the wrong kind of search.
6. Do not confuse a subsequence with a subset. If the statement does not say "in the original order", it probably means a subset, and the answer is simpler than it looks.

## Worked problems

### Problem 1: the length of the longest increasing subsequence

**Restatement.** Given $n \le 2 \times 10^5$ integers, report the length of the longest strictly increasing subsequence.

**Naive baseline.** The quadratic program, about $2 \times 10^{10}$ comparisons at the maximum $n$.

**Insight.** The smallest possible last element of an increasing subsequence of each length is enough to answer the question, and those minima form a sorted array.

**Derivation.** Maintain the tails array. For each value, replace the first entry that is at least as large, or append.

**Correctness.** The theorem above proves that the length of the tails array is the length of the longest increasing subsequence.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Using an upper bound search, which computes the longest non-decreasing subsequence and differs on any input with repeated values, such as $2, 2$, where the strict answer is $1$ and the wrong answer is $2$.

### Problem 2: print the subsequence itself

**Restatement.** Given $n \le 5000$ integers, print one longest increasing subsequence.

**Naive baseline.** The quadratic program with a parent pointer, which produces the subsequence directly.

**Insight.** The dynamic program states already contain the answer; they only need the links between them.

**Derivation.** Compute $D_i$ for every index. Record, for each $i$, the index $j$ that achieved the maximum. Start at the index of the largest $D_i$ and follow the parents backwards, then reverse.

**Correctness.** The parent of $i$ is an index $j$ with $a_j < a_i$ whose subsequence is the longest one ending at $i$, so the chain of parents is an increasing subsequence of length $D_i$.

**Complexity.** $O(n^2)$ time and $O(n)$ space.

**Common wrong approach.** Printing the tails array, which produces a sequence that is not a subsequence of the input, as the counterexample $2, 3, 1$ shows.

### Problem 3: the number of increasing subsequences

**Restatement.** Given $n \le 10^5$ integers, count the strictly increasing subsequences of length exactly $3$, modulo $10^9 + 7$.

**Naive baseline.** Three nested loops, $O(n^3)$.

**Insight.** Counting needs a different state, because the answer is a sum over predecessors rather than a maximum.

**Derivation.** Let $c_i$ be the number of increasing subsequences of length $2$ ending at $i$. Then $c_i$ is the number of earlier indices $j$ with $a_j < a_i$. Sort the indices by value, and for each value compute the count of strictly smaller values seen so far with a Fenwick tree over the compressed values. The answer is the sum of the $c_i$.

**Correctness.** Each increasing pair $(j, i)$ with $j < i$ and $a_j < a_i$ is counted once, at $i$, and each such pair extends to exactly one increasing triple by choosing any $k > i$ with $a_i < a_k$, which the second pass counts.

**Complexity.** $O(n \log n)$ time and $O(n)$ space.

**Common wrong approach.** Using a Fenwick tree that stores the count at "less than or equal to" instead of "strictly less than", which counts the subsequences with equal values.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a subsequence, a substring, a subset, or a subarray, and write the comparison down.
2. **Direct application.** Implement the quadratic program, then the patience sorting method, and check that they agree on the length for a thousand random inputs.
3. **Adaptation.** Write the non-decreasing version, the decreasing version, and the version that prints the subsequence.
4. **Combination.** Combine the patience sorting method with a Fenwick tree over the values to count the increasing subsequences, and compare with the quadratic counting program on small inputs.
5. **Challenge.** Solve the longest increasing subsequence of every subarray with a merge sort tree, and compare the cost with a segment tree.
6. **Transfer.** Take a problem about a sequence of decisions and reduce it to a longest increasing subsequence: a chain of assignments with increasing values, or a scheduling problem with precedence constraints.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. State the recurrence for $D_i$ and say why the bound it gives is achieved. (Algorithm derivation)
2. What is the tails array, in terms of the subsequences it summarizes? (Formal model)
3. Why is the tails array sorted, and why does that make the binary search valid? (Formal model)
4. Trace the tails array for the sequence $3, 5, 1, 2$. (Step-by-step execution)
5. Why is the tails array of $3, 5, 1, 2$ a valid subsequence here, and why is that a coincidence rather than a rule? (Common mistakes)
6. What is the smallest sequence whose tails array is not a subsequence, and what does the tails array contain? (Common mistakes)
7. Which search finds a lower bound, and what does using the other one compute instead? (Implementation walkthrough)
8. What is the time complexity of each method, and what does it cost at $n = 10^6$? (Complexity analysis)
9. Which constraint value rules out the quadratic program? (Recognition patterns)
10. Why is the recursive formulation of this problem the one to avoid? (Recursion decision)

## Further reading

- The binary search that the patience sorting method performs is the same boundary search described in [binary search](/algorithms/searching/binary-search).
- The dynamic program that replaces a backtracking search when the constraints involve a global property is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The search over a tree of choices is in [backtracking](/algorithms/enumeration/backtracking).
- The counting formula for arrangements, and the reason the factorial overflows, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The arithmetic that a modular version of the counting needs is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
