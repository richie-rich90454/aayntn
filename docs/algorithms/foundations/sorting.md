---
id: foundations.sorting
title: Sorting
summary: Put a sequence into order, and know which of the standard sorting algorithms to reach for when the keys are small, large, or merely comparable.
division: [bronze, silver]
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords:
    [
        sorting,
        merge sort,
        quicksort,
        heapsort,
        counting sort,
        radix sort,
        stability,
        comparison lower bound,
        comparator,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.recursion, searching.binary-search]
complexity:
    time: "O(n log n)"
    space: "O(n) for merge sort, O(1) for heapsort"
assumptions:
    - The comparison sorts in this article compare keys and never look inside the keys themselves.
    - The counting and radix sorts require keys that are integers of a bounded width.
reviewed: false
---

## At a glance

Sorting is the one algorithm every contest problem seems to need and few contest problems state directly. The decision has two axes. The first is what the algorithm is allowed to know about the keys: a **comparison sort** learns about them only by asking which of two is larger, and every comparison sort costs at least $\Omega(n \log n)$ because of that restriction. A **counting sort** or a **radix sort** looks at the keys directly, and can therefore be faster than $n \log n$, but only when the keys have the shape it needs.

The second axis is what the problem asks for beyond the sorted order. Ties matter in some problems and not in others, and the difference between a stable and an unstable sort is the difference between a correct answer and a wrong one that happens to pass.

Four facts carry most of the weight. Merge sort is stable and costs $O(n \log n)$ in every case. Quicksort is faster in practice and costs $\Theta(n^2)$ in the worst case, which is why it is paired with a fallback. Counting and radix sort beat comparison sorting when the keys are small integers. And a comparator must be a strict weak ordering, or the program has no defined behavior at all.

## Problem motivation

A problem says: given $n$ records, each with a key, produce them in non-decreasing order of key. That is all it says, and the answer to it determines the answer to every problem that contains it.

Sometimes the sorted order is the answer. Sometimes it is a precondition: the number of inversions, the number of distinct pairs with a given sum, the $k$-th smallest value, and the running maximum of a window are all easier after a sort, and some of them are much easier. The count of pairs whose sum is $K$ takes $O(n \log n)$ after a sort and $O(n^2)$ without one, and the constraint decides which of those two is a viable program.

The sorted order also interacts with the rest of the program. A sort that costs $O(n \log n)$ inside a loop over $n$ items costs $O(n^2 \log n)$ in total, which is the mistake of sorting inside a loop instead of sorting once. The bounds in [complexity analysis](/algorithms/foundations/complexity) are the tool for deciding whether a sort is affordable at all.

## Recognition patterns

Sorting is the right tool when the question is about **order** or about something that order makes cheap.

- The output must be in non-decreasing order.
- The question is a rank question: "how many elements are smaller than $x$", "what is the $k$-th smallest".
- The question is about pairs whose relative order matters: inversions, pairs summing to $K$, matching two sorted lists.
- The question is about a running maximum or a running minimum over a window, because order makes the windows contiguous.
- The data must be grouped, and the grouping key is a field of each record.

The constraint that decides the _algorithm_ is the shape of the keys.

| Key shape                         | What to use                                |
| --------------------------------- | ------------------------------------------ |
| Arbitrary comparable values       | Merge sort, quicksort, or the library sort |
| Small integers in a bounded range | Counting sort, $O(n + k)$                  |
| Fixed-width integers or strings   | Radix sort, $O(d(n + b))$                  |
| Many sorts of the same data       | Sort once and reuse the order              |

The key shape is the second thing to check. The first is whether the problem says anything about ties.

## Naive approach

The baseline is insertion sort: for each element, shift the larger elements of the sorted prefix right and insert it.

```cpp
void insertionSort(std::vector<int>& a) {
    for (int i = 1; i < static_cast<int>(a.size()); ++i) {
        int x = a[i], j = i - 1;
        while (j >= 0 && a[j] > x) {
            a[j + 1] = a[j];
            --j;
        }
        a[j + 1] = x;
    }
}
```

This is $O(n^2)$ in the worst case and $O(n)$ on an already sorted array, and it is _stable_, because it only shifts an element when it is strictly greater than the one being inserted.

Insertion sort is not the wrong answer. It is the right answer on small arrays, where it beats every other algorithm because its constant factor is tiny and it does no allocation. It is also the right answer for nearly sorted data, where the number of shifts is the number of inversions rather than the square of the size. Every practical comparison sort ends with it: `std::sort` in the C++ standard library switches to insertion sort for partitions below a threshold of about sixteen elements.

The baseline that is always wrong is selection sort written as "find the minimum of the unsorted part, swap it to the front". It is $O(n^2)$ on every input, including sorted ones, and it is unstable, so it is strictly worse than insertion sort on every axis.

## Key insight

The insight that separates the sorting algorithms is **what the algorithm is allowed to look at**.

A comparison sort may only ask questions of the form "is $a$ less than $b$?". That restriction has a price, and the price is a theorem: any comparison sort of $n$ distinct elements needs at least $\lceil \log_2 (n!) \rceil$ comparisons, which is $\Omega(n \log n)$. The proof is a decision tree: each comparison has two outcomes, so a strategy that makes $h$ comparisons can distinguish at most $2^h$ cases, and there are $n!$ orderings to distinguish.

A counting sort breaks the restriction by using the _values_ of the keys as indices. If the keys are integers in $[0, k]$, the algorithm counts how many times each value occurs and then places the elements in order, at a cost of $O(n + k)$. A radix sort breaks it in a different way: it sorts by the least significant digit first, then the next, and each pass is a counting sort over one digit.

The second insight is about **ties**. Two elements with equal keys are _equivalent_ as far as the order is concerned, and a stable sort is one that keeps equivalent elements in their original relative order. Stability is not a property of the problem; it is a property of the algorithm, and it decides whether the answer is reproducible.

## Formal model

Let $A = (a_0, a_1, \dots, a_{n-1})$ be a sequence of records, each with a key $k(a_i)$.

::: math definition Definition
A sorting algorithm is **comparison-based** if the only information it
obtains about the input is obtained by comparing pairs of elements. A sort
that inspects the keys themselves is **non-comparison**.
:::


::: math definition Definition
A sort is **stable** if for every two elements $a_i$ and $a_j$ with
$i < j$ and $k(a_i) = k(a_j)$, the sorted output places $a_i$ before
$a_j$.
:::


::: math definition Definition
A comparator is a **strict weak ordering** if it is irreflexive, that is,
never reports that an element is less than itself; transitive; and
asymmetric on distinct elements, so that exactly one of "less than" and
"greater than" holds between any two distinct elements. The standard
sorting functions require this, and a comparator that does not provide it
produces undefined behavior.
:::


::: math definition Definition
A **key** of an element is the value it is ordered by. A sort is by
**lexicographic** order on a tuple of keys when it compares the first key
that differs.
:::


## Algorithm derivation

### Merge sort

Split the sequence into two halves, sort each recursively, and merge the two sorted halves. The merge walks both halves with two pointers and takes whichever front element is smaller.

```cpp
void merge(std::vector<int>& a, std::vector<int>& tmp,
           int lo, int mid, int hi) {
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];   // <= keeps the sort stable
        else tmp[k++] = a[j++];
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi) tmp[k++] = a[j++];
    for (int p = lo; p <= hi; ++p) a[p] = tmp[p];
}
```

The recurrence is $T(n) = 2T(n/2) + O(n)$, which is $O(n \log n)$ by the master theorem. The equality in the comparison is what makes the sort stable: when two elements have equal keys, the one from the left half is taken first, and the left half held the earlier element.

### Quicksort and the pivot hazard

Partition the sequence around a pivot and recurse on the two parts. The cost depends entirely on the pivot's rank $k$:

$$
T(n) = T(k) + T(n - k - 1) + O(n).
$$

The best case, $k$ near the middle, gives $O(n \log n)$. The worst case, $k = 0$ every time, gives $O(n^2)$. That worst case is not exotic: it is what a first-element pivot does on an already sorted sequence, which is exactly the input a judge is likely to provide. The hazard is the reason every practical quicksort randomizes the pivot, takes the median of three, or both.

### The introspective fallback

The way out of the hazard is to bound the damage. An introspective sort runs quicksort, but counts the recursion depth; when the depth exceeds $2\lceil \log_2 n \rceil$, it abandons quicksort for the rest of the array and finishes with a heap sort, which is $O(n \log n)$ in the worst case. It also switches to insertion sort for partitions below about sixteen elements, where insertion sort is faster because its constant factor is smaller.

```cpp
void introSort(std::vector<int>& a, int lo, int hi, int depthLimit) {
    while (lo < hi) {
        if (hi - lo < 16) {
            insertionSort(a, lo, hi);
            return;
        }
        if (depthLimit == 0) {
            heapSort(a, lo, hi);      // the worst-case guarantee
            return;
        }
        --depthLimit;
        int mid = partitionMedianOfThree(a, lo, hi);
        introSort(a, mid + 1, hi, depthLimit);
        hi = mid - 1;
    }
}
```

The result is a sort whose worst case is $O(n \log n)$ and whose average case is as fast as quicksort's. This is the design of `std::sort` in the C++ standard library, and it is the right design for any sort you write yourself.

### Counting sort

Counting sort uses the values of the keys as indices.

```cpp
std::vector<int> countingSort(std::vector<int> a, int k) {
    std::vector<int> count(k + 1, 0);
    for (int x : a) ++count[x];
    for (int i = 1; i <= k; ++i) count[i] += count[i - 1];
    std::vector<int> out(a.size());
    for (int i = static_cast<int>(a.size()) - 1; i >= 0; --i)
        out[--count[a[i]]] = a[i];   // backwards, so the sort is stable
    return out;
}
```

The cost is $O(n + k)$: one pass to count, one pass to accumulate, one pass to place. The condition is that the keys are integers in $[0, k]$, and the payoff only exists when $k$ is comparable to $n$. Counting sort with $k = 10^9$ allocates a table of four billion entries and is a memory error rather than a speedup.

### Radix sort

Radix sort sorts by one digit at a time, from the least significant digit to the most significant, using a stable sort for each pass. Because each pass is stable, the order established by the previous passes survives.

```cpp
void radixSort(std::vector<uint32_t>& a) {
    for (int shift = 0; shift < 32; shift += 8) {
        std::array<int, 256> count{};
        for (uint32_t x : a) ++count[(x >> shift) & 0xFF];
        for (int i = 1; i < 256; ++i) count[i] += count[i - 1];
        std::vector<uint32_t> out(a.size());
        for (int i = static_cast<int>(a.size()) - 1; i >= 0; --i)
            out[--count[(a[i] >> shift) & 0xFF]] = a[i];
        a.swap(out);
    }
}
```

For 32-bit integers with 8-bit digits, that is four passes, each $O(n + 256)$, so $O(4(n + 256))$ overall. The condition is that the keys are fixed width, or that they can be padded to a fixed width without changing their order.

### Sorting a pair by a key

Sorting records whose key is one field of a pair is where the comparator rules bite.

```cpp
// by the second field, ties broken by the first
std::sort(v.begin(), v.end(), [](const auto& a, const auto& b) {
    if (a.second != b.second) return a.second < b.second;
    return a.first < b.first;
});
```

The comparator is a strict weak ordering: it is irreflexive, transitive, and it decides every pair of distinct elements. The version that compares only `a.second < b.second` is also a strict weak ordering, but it makes elements with equal second fields _equivalent_, and `std::sort` is not stable, so their relative order after the sort is unspecified.

Language by language, the standard sorts behave like this.

| Language | Function                 | Stable | Notes                            |
| -------- | ------------------------ | ------ | -------------------------------- |
| C++      | `std::sort`              | no     | introsort; $O(\log n)$ stack     |
| C++      | `std::stable_sort`       | yes    | merge based; $O(n)$ extra memory |
| Java     | `Arrays.sort(int[])`     | no     | dual-pivot quicksort             |
| Java     | `Arrays.sort(Integer[])` | yes    | TimSort                          |
| Python   | `sorted`                 | yes    | TimSort, $O(n)$ extra memory     |

## Step-by-step execution

Take the merge of two sorted runs, $A = [(1,a), (1,b)]$ and $B = [(1,c)]$, where the letter marks the original position and the number is the key.

1. Both fronts hold key $1$. The comparison `a[i] <= a[j]` is true, so $(1,a)$ is taken from the left run.
2. The fronts hold $(1,b)$ and $(1,c)$. The comparison is again true, so $(1,b)$ is taken from the left run.
3. The left run is exhausted, so $(1,c)$ is copied from the right run.

The result is $(1,a), (1,b), (1,c)$, and the original order of the three equal keys is preserved. Replace the comparison with `<` and step 2 takes $(1,c)$ from the right run instead, giving $(1,a), (1,c), (1,b)$: still sorted by key, no longer stable. Nothing about the keys changed; only the one character in the comparison did.

## Correctness proof

::: math theorem Theorem
Merge sort produces a non-decreasing ordering of the keys and preserves the
relative order of elements with equal keys.
:::


::: math proof Proof
We prove both claims by induction on the length $n$ of the sequence.

**Base case.** For $n \le 1$ the sequence is already sorted and there are no equal keys to reorder.

**Inductive step.** Let $n \ge 2$. The algorithm splits the sequence into a left half $L$ and a right half $R$, each of length less than $n$, and sorts each recursively. By the induction hypothesis, $L$ and $R$ are each sorted by key and each is stable.

The merge maintains the invariant that the output written so far is sorted by key and contains the smallest elements of $L \cup R$. At each step it compares the front elements of the two runs and copies the smaller one. If the keys differ, copying the smaller one keeps the output sorted and keeps the invariant. If the keys are equal, the algorithm copies from the left run, and the element copied from $L$ originally preceded the element copied from $R$ in the original sequence, because $L$ consists of the earlier elements and $R$ of the later ones. So equal keys keep their original relative order. When one run is exhausted, the remaining elements of the other are already sorted and are copied in order.

The output therefore contains every element exactly once, sorted by key, with equal keys in their original relative order. $\square$
:::


::: math theorem Theorem
Any comparison-based sorting algorithm on $n$ distinct elements performs
at least $\lceil \log_2 (n!) \rceil$ comparisons, and therefore at least
$\Omega(n \log n)$.
:::


::: math proof Proof
Model the algorithm as a binary decision tree whose internal nodes are
comparisons and whose leaves are outcomes. Sorting $n$ distinct elements
has $n!$ possible outcomes, one for each ordering of the input, and the
algorithm must distinguish them, so the tree has at least $n!$ leaves. A
binary tree of height $h$ has at most $2^h$ leaves, so the height is at
least $\log_2(n!)$. By Stirling's formula,
$\log_2(n!) = n \log_2 n - n \log_2 e + O(\log n)$, which is
$\Omega(n \log n)$. $\square$
:::


The lower bound says nothing about counting sort or radix sort, because neither is a comparison sort. They read the keys, and they are not bound by the theorem.

## Complexity analysis

| Algorithm      | Best          | Average       | Worst         | Extra space | Stable |
| -------------- | ------------- | ------------- | ------------- | ----------- | ------ |
| Insertion sort | $O(n)$        | $O(n^2)$      | $O(n^2)$      | $O(1)$      | yes    |
| Merge sort     | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$      | yes    |
| Quicksort      | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$      | $O(\log n)$ | no     |
| Heapsort       | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(1)$      | no     |
| Counting sort  | $O(n + k)$    | $O(n + k)$    | $O(n + k)$    | $O(k)$      | yes    |
| Radix sort     | $O(d(n + b))$ | $O(d(n + b))$ | $O(d(n + b))$ | $O(n + b)$  | yes    |

The $O(n)$ extra space of merge sort is the price of the array version; the linked-list version of merge sort, which splices the sorted runs together, uses only $O(\log n)$ extra space. The $O(1)$ extra space of heapsort is the reason it is the standard fallback for introsort.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Generic records, no size constraint | The library sort, `std::sort` or `sorted` |
| Ties must keep their input order | A stable sort: `std::stable_sort`, `Arrays.sort` on objects, `sorted` |
| Keys are integers in $[0, k]$ with $k \le c\,n$ | Counting sort, $O(n + k)$ |
| Keys are fixed-width integers | Radix sort, $O(d(n + b))$ |
| Data is nearly sorted | Insertion sort, $O(n + \text{inversions})$ |
| Sorting many small arrays | Sort each separately; do not build one big sort |
| Only the order of the keys matters | Sort indices instead of the records |

## Recursion decision

Merge sort is a recursive algorithm, and the recursion is the safe kind. Its depth is $O(\log n)$, because each level halves the problem, so a million elements need about twenty frames. That is within the limit of every language, and the merge sort in the C++ standard library is recursive for exactly this reason.

Quicksort is also recursive, and its recursion is not safe by itself. A degenerate pivot produces a recursion of depth $n$, which is the stack overflow described in [recursion](/algorithms/foundations/recursion). The introspective fallback solves this with a depth counter rather than by rewriting the algorithm as a loop: when the counter runs out, the sort stops recursing and finishes with a heap sort.

## Implementation walkthrough

Two details separate a sort that works from a sort that is subtly wrong.

The first is the comparison in the merge. `a[i] <= a[j]` takes from the left run on ties and keeps the sort stable; `a[i] < a[j]` takes from the right run and does not. On keys that are all distinct the two are identical, which is why the bug survives.

The second is the comparator for records. It must be a strict weak ordering, and the two ways to get that wrong are both common:

```cpp
// wrong: not a strict weak ordering, undefined behavior
return a.first < b.first && a.second < b.second;

// wrong: also not a strict weak ordering
return a.first < b.first || a.second < b.second;
```

Both are written by people who mean "compare the first key, then the second". The correct form compares one key at a time and returns as soon as it decides.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sorting inside a loop over the data | The sort cost is multiplied by the loop count | Sort once |
| Using `<` in the merge of merge sort | The sort is no longer stable | Use `<=` |
| Using `&&` or `\|\|` to combine keys | Undefined behavior in the standard sort | Compare one key at a time and return |
| Assuming the library sort is stable | Ties come out in an unspecified order | Use the stable variant when ties matter |
| Forgetting to specify the tie-break | The answer depends on the implementation | Always state the tie-break rule |
| Picking the first element as the pivot | $O(n^2)$ on sorted input | Randomize or take the median of three |
| Counting sort with an unbounded key range | A memory error instead of a speedup | Check that the range is comparable to $n$ |
| Comparing floats for equality in a comparator | A comparator that is not transitive | Compare with a tolerance or sort integers |

### Why this fails: the merge that takes from the wrong run

The plausible wrong approach is to write the merge with a strict `<` comparison, because the runs are sorted and "take the smaller one" is what the merge is supposed to do. The counterexample is two runs with equal keys.

Take $A = [(1,a), (1,b)]$ and $B = [(1,c)]$, where the number is the key and the letter marks the original position, so $a$ came before $b$ came before $c$.

With `a[i] <= a[j]`, the merge compares $1$ with $1$, takes $(1,a)$ from the left run, then compares $1$ with $1$ again, takes $(1,b)$ from the left run, and finally copies $(1,c)$ from the exhausted right run. The output is $(1,a), (1,b), (1,c)$, and the three equal keys keep their original order.

With `a[i] < a[j]`, the second comparison is false, so the merge takes $(1,c)$ from the right run. The output is $(1,a), (1,c), (1,b)$. The keys are still non-decreasing, so the sort still looks correct, and the input order of the equal elements has been destroyed. A problem that asks for "the pairs sorted by the second field, and by the first field when the seconds are equal" now has the wrong answer, and the answer is different from the one the judge computed.

This is the smallest possible failure: two elements on each side would suffice, and one element with an equal key on the right side is enough. Nothing about the input is unusual, and the output is still a valid sorting, which is why the bug survives review and shows up as a wrong answer rather than a crash.

The lesson generalizes: **stability is a property of the merge, not of the data, and the difference is one character.**

## Variants and extensions

- **Bottom-up merge sort.** Merge runs of size 1, 2, 4, 8, and so on, iteratively. It has the same bounds and needs no recursion.
- **Three-way partitioning.** When there are many equal keys, quicksort with a three-way partition puts all of them in the middle at once, which avoids the quadratic behavior that duplicate-heavy inputs otherwise cause.
- **The most significant digit variant of radix sort.** It sorts the top digit first and recurses, which avoids the passes over the whole array that the least significant digit variant needs, at the price of a more complicated implementation.
- **Sorting with a key function.** Many standard libraries accept a projection, so that the comparator is written once and reused.
- **Partial sorting.** When only the smallest $k$ elements are wanted, a heap of size $k$ finds them in $O(n \log k)$, and a quickselect finds them in $O(n)$ expected time.

## Contest strategy

1. Check the shape of the keys before the shape of the algorithm. Integers in a small range mean counting sort; fixed-width integers mean radix sort; anything else means a comparison sort.
2. Check whether ties matter. If the statement says "break ties by", write the tie-break into the comparator. If the output must match a stable order, use a stable sort.
3. Sort once, outside every loop. A sort inside a loop over the data multiplies the cost.
4. For a library sort, use the one that matches the tie rule, and remember that `std::sort` and `Arrays.sort(int[])` are not stable while `std::stable_sort`, `Arrays.sort(Integer[])`, and `sorted` are.
5. If you write your own quicksort, add the depth counter and the heap sort fallback, or randomize the pivot and accept the risk.
6. Test the sorted input, the reverse-sorted input, and the all-equal input. Those three are the ones that break sorts.

## Worked problems

### Problem 1: the $k$-th smallest

**Restatement.** Given $n$ numbers, report the $k$-th smallest, counting duplicates. Constraints: $n \le 10^7$, $1 \le k \le n$.

**Naive baseline.** Sort and index. The sort costs $O(n \log n)$ and the memory is $O(n)$ for the array plus $O(n)$ for the sort's workspace.

**Insight.** The answer is a selection, not a sort.

**Derivation.** Use quickselect: partition around a pivot, and recurse into the side that contains position $k$. The expected cost is $O(n)$.

**Correctness.** After a partition, the pivot's final position is its rank in sorted order, so exactly one side of the partition can contain the $k$-th element, and the recursion only ever discards the other side.

**Complexity.** $O(n)$ expected time and $O(1)$ extra space, against $O(n \log n)$ and $O(n)$ for the sort.

**Common wrong approach.** Sorting anyway because it is easier, which costs a factor of $\log n$ and twice the memory.

### Problem 2: counting pairs by rank

**Restatement.** Given $n$ integers, count the pairs $(i,j)$ with $i < j$ and $a_i \le a_j$. Constraints: $n \le 200\,000$.

**Naive baseline.** The double loop, which is $\Theta(n^2)$ and about $2 \times 10^{10}$ comparisons.

**Insight.** Once the array is sorted, the answer for each element is the number of elements after it that are at least as large, and a merge can count those pairs while it sorts.

**Derivation.** Merge sort, and in each merge add the number of remaining elements of the right run for every element taken from the left run.

**Correctness.** Every pair with $i < j$ and $a_i \le a_j$ is either inside a half or crosses between them, and the merge counts exactly the crossing ones, once each.

**Complexity.** $O(n \log n)$ time and $O(n)$ extra space.

**Common wrong approach.** Using a strict comparison in the merge and losing the pairs whose keys are equal, which is the stability bug from the common mistakes table.

### Problem 3: sorting records by two fields

**Restatement.** Given $n$ records with two integer fields, output them sorted by the second field, breaking ties by the first field.

**Naive baseline.** The comparator `a.first < b.first && a.second < b.second`, which is not a strict weak ordering and produces undefined behavior.

**Insight.** The comparator must compare one field at a time and return as soon as it decides.

**Derivation.** Compare the second field first; if the fields differ, return that comparison. Otherwise compare the first field.

**Correctness.** The relation defined is lexicographic order on the pair of keys, which is a total order and therefore a strict weak ordering, so the sort produces the unique lexicographically sorted sequence.

**Complexity.** $O(n \log n)$ time and $O(n)$ extra space for the library's merge-based sort.

**Common wrong approach.** Sorting by the second field only and hoping the ties fall the right way. The standard sort does not promise that, and the answer changes with the input.

## Practice progression

1. **Recognition.** Given a problem, decide whether it needs a sort at all, and if so, whether it needs a stable one.
2. **Direct application.** Implement merge sort and prove it stable.
3. **Adaptation.** Implement counting sort and radix sort, and check that they beat the comparison sort on the inputs where they should.
4. **Combination.** Count inversions inside a merge, and count pairs with equal keys inside a stable merge.
5. **Challenge.** Implement an introspective sort with a depth limit and a heap sort fallback, and construct an input that would have made the plain quicksort quadratic.
6. **Transfer.** Replace a comparison sort with a counting sort in a problem whose values are bounded, and measure the change in time and memory.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What distinguishes a comparison sort from a counting sort, and why does the distinction change the lower bound? (Key insight)
2. State the comparison lower bound and the decision tree argument behind it. (Correctness proof)
3. Why is the merge of merge sort stable, and which character in the code decides it? (Algorithm derivation)
4. What makes a quicksort quadratic, and which input triggers it? (Algorithm derivation)
5. What does an introspective sort do when the recursion gets too deep, and why is that enough to guarantee $O(n \log n)$? (Algorithm derivation)
6. State the conditions under which counting sort is faster than a comparison sort, and what happens when they do not hold. (Algorithm selection)
7. How many passes does a radix sort over 32-bit integers with 8-bit digits need, and why must each pass be stable? (Algorithm derivation)
8. Give a comparator that is not a strict weak ordering, and say what happens when it is used. (Implementation walkthrough)
9. Which of the standard sorts are stable, in C++, Java, and Python? (Algorithm derivation)
10. What is the smallest input for which an unstable merge produces a different answer, and why does the bug not show up as a crash? (Common mistakes)

## Further reading

- The bounds used throughout this article are derived in [complexity analysis](/algorithms/foundations/complexity).
- The two-pointer technique that exploits a sorted array is in [binary search](/algorithms/searching/binary-search), and it is the natural companion of a sorted array in problems about pairs.
- The recursion that merge sort is built from, and the depth rules that keep it safe, are in [recursion](/algorithms/foundations/recursion).
- The arithmetic that makes a counting sort possible, and the modular tricks that make a radix sort possible, are in [binary representation](/algorithms/foundations/binary-representation).
