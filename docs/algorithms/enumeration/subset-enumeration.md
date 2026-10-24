---
id: enumeration.subset-enumeration
title: Subset enumeration
summary: List every subset of a set of n items with a bitmask, know when the count is too large to enumerate, and halve the exponent with a meet in the middle split.
division: [silver, gold]
subjects: [enumeration]
level: intermediate
importance: common-contest-technique
keywords:
    [
        subset enumeration,
        bitmask,
        subsets,
        multisets,
        combinations,
        meet in the middle,
        exponential search,
    ]
prerequisites:
    required: [foundations.binary-representation, foundations.complexity]
    recommended: [foundations.recursion, foundations.sorting]
complexity:
    time: "O(2^n) per mask, O(n 2^n) with the subsets materialized"
    space: "O(1) per mask, O(n) per subset"
assumptions:
    - The items are distinguishable by position, so two choices of different positions are counted separately unless the statement says otherwise.
    - The number of items is small enough that a mask fits in one machine word, or the mask is held in an arbitrary precision integer.
reviewed: false
---

## At a glance

A set of $n$ items has $2^n$ subsets. For small $n$ that number is tractable and for slightly larger $n$ it is not: $2^{20} \approx 10^6$ is comfortable, $2^{25} \approx 3.4 \times 10^7$ is on the edge, and $2^{40} \approx 10^{12}$ is not reachable by enumerating anything.

The representation is what decides which of those two regimes a problem falls into. A subset held as a **bitmask** occupies one machine word, so adding an item to a subset is one OR, testing membership is one AND, and the enumeration loop is a loop over integers from $0$ to $2^n - 1$. A subset held as a list of its elements costs time proportional to its size at every step, and the enumeration costs $O(n 2^n)$ instead of $O(2^n)$.

When the count is too large, the exponent can be halved rather than avoided. **Meet in the middle** splits the items into two halves, enumerates the $2^{n/2}$ subsets of each, and matches the two lists against each other. That is the difference between $10^{12}$ operations and $10^6$, and it is the technique that rescues problems whose $n$ is around forty.

This article also covers the case where the items are not distinct. A multiset has fewer sub-multisets than a set of the same size has subsets, and the counting is a product rather than a power.

## Problem motivation

A problem says: given $n \le 20$ integers, report how many subsets have sum equal to $W$.

The direct approach is to try all $2^{20} = 1\,048\,576$ subsets. For each one, add up the selected values and compare the total with $W$. That is about $20$ million additions, which finishes in a fraction of a second in C++ and in a couple of seconds in Python. The problem is solvable, and the enumeration is the intended solution.

Now change one number in the statement: $n \le 40$. The same algorithm needs $2^{40} \approx 1.1 \times 10^{12}$ subsets, and the program would need about a hundred days. The algorithm has not changed at all. The count has.

That is the lesson the article is built around: **for combinatorial problems, the count of states is the whole difficulty, and the job is to find a representation or a decomposition that makes the count affordable.** The two tools are the bitmask, which makes each state cheap, and the meet in the middle split, which makes the number of states affordable.

## Recognition patterns

Subset enumeration is the right tool when the problem asks about a choice of items and the number of choices is small enough to survive.

- **The statement bounds the count of items.** "At most 20 items", "at most 10 switches", "$n \le 24$".
- **The question is about a subset.** "Is there a subset whose sum is $W$", "how many subsets have an even sum", "the largest subset with sum at most $W$".
- **The items are small and few, and the alternatives are large.** The classic form: $n \le 20$ items, but the sums range up to $10^9$.
- **The problem is about a fixed number of items.** "How many ways to choose 3 of 10" is a binomial coefficient, and the enumeration of the combinations is the same loop with a popcount filter.

Subset enumeration is the wrong tool when any of these hold.

- The count of items is large and the question is not about a subset.
- The question is about a subset but with an additional structure that makes the subset enormous, such as "a subset with at most one item from each group".
- The same subset would be enumerated many times, which is a signal to enumerate _combinations_ of a multiset rather than index-subsets.

One number decides the boundary. Enumerating $2^n$ states with $O(1)$ work per state costs about $10^8$ states per second in C++, so $n = 26$ is roughly the limit for a simple per-state test. Enumerating with $O(n)$ work per state divides that limit by $n$.

## Naive approach

The baseline is to build each subset as a list and add it to a collection of subsets.

```python
from itertools import combinations

subsets = []
for size in range(n + 1):
    for combo in combinations(items, size):
        subsets.append(combo)
```

This is correct and it is $O(n 2^n)$ in time and $O(n 2^n)$ in memory, because every subset is materialized as a list of its elements and all of them are kept.

Two things are wrong with it for contest purposes. The memory is the killer: for $n = 20$ the total storage is about $20 \times 2^{20}$ element slots, tens of megabytes, and it grows exponentially. And the constant factor is large, because building a list and copying it is much more work per state than testing a mask.

The second baseline is to enumerate with recursion, choosing to include or exclude each item in turn.

```python
def enumerate_subsets(items, i, chosen, visit):
    if i == len(items):
        visit(chosen)
        return
    enumerate_subsets(items, i + 1, chosen, visit)
    enumerate_subsets(items, i + 1, chosen + [items[i]], visit)
```

This makes $2^{n+1}$ calls, so it is twice the states, and each call carries a list that is copied on the way down. It is the right shape for problems that need to _build_ the subsets, such as the subset-sum dynamic program, and the wrong shape for problems that only need to _test_ them.

## Key insight

The insight is that a subset of $n$ items can be named by a single integer.

Give the items the indices $0, 1, \dots, n-1$, and let bit $i$ of a mask be $1$ exactly when item $i$ is in the subset. Then the mask is a complete description of the subset, and the operations on subsets become operations on integers: to add item $i$, OR in $1 \ll i$; to remove it, AND with the complement; to test membership, AND with $1 \ll i$ and check for zero.

Because a mask is an integer, the subsets can be enumerated by counting.

The second insight is that $2^n$ need not be the count. Meet in the middle replaces one enumeration of $2^n$ states with two enumerations of $2^{n/2}$ states and a matching step, and matching is cheap when the partial results can be indexed. The exponent halves, which on a double-exponential scale is worth more than any constant factor.

## Formal model

Let $S = \{s_0, s_1, \dots, s_{n-1}\}$ be a set of $n$ distinct items.

::: math definition Definition
A **bitmask** for $S$ is a sequence $m = (m_0, m_1, \dots, m_{n-1})$ of
bits. It denotes the subset $S(m) = \{s_i : m_i = 1\}$. The map from masks
to subsets is a bijection, and the **weight** of a mask is the number of
set bits in it.
:::


::: math definition Definition
A **multiset** over a domain $D$ is a function $c : D \to \mathbb{N}$ that
gives the multiplicity of each value. Its sub-multisets are the functions
$c'$ with $0 \le c'(d) \le c(d)$ for every $d \in D$.
:::


::: math lemma Lemma
A multiset with multiplicities $c_1, c_2, \dots, c_m$ has exactly
$\prod_{i=1}^{m}(c_i + 1)$ sub-multisets.
:::


Two results are proved below. The first is that the loop over the masks $0, 1, \dots, 2^n - 1$ visits every subset of $S$ exactly once. The second is that the meet in the middle procedure decides whether a set of $n$ items has a subset with sum $W$ in $O(2^{n/2})$ expected time when the partial sums are maintained incrementally, and in $O(n\,2^{n/2})$ expected time when each mask is scanned, using $O(2^{n/2})$ space in either case.

## Algorithm derivation

### The mask loop, in three languages

C++17, with a 64-bit mask so that $n$ can be up to 64:

```cpp
const uint64_t limit = 1ULL << n;
for (uint64_t mask = 0; mask < limit; ++mask) {
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        if ((mask >> i) & 1ULL) total += a[i];
    }
    if (total == target) { /* ... */ }
}
```

Java, with a `long` mask and the same shape:

```java
long limit = 1L << n;
for (long mask = 0; mask < limit; mask++) {
    long total = 0;
    for (int i = 0; i < n; i++) {
        if (((mask >>> i) & 1L) != 0L) total += a[i];
    }
    if (total == target) { /* ... */ }
}
```

Python, where the integer is arbitrary precision and the mask needs no width at all:

```python
limit = 1 << n
for mask in range(limit):
    total = 0
    for i in range(n):
        if (mask >> i) & 1:
            total += a[i]
    if total == target:
        ...
```

### The enumeration order

All three loops visit the masks in increasing numeric order, from $0$ to $2^n - 1$, and item $i$ is represented by bit $i$, so item $0$ is the least significant bit and **item 0 varies fastest**.

For three items the order is exactly this:

| Mask | Binary | Subset      |
| ---- | ------ | ----------- |
| 0    | `000`  | $\{\}$      |
| 1    | `001`  | $\{0\}$     |
| 2    | `010`  | $\{1\}$     |
| 3    | `011`  | $\{0,1\}$   |
| 4    | `100`  | $\{2\}$     |
| 5    | `101`  | $\{0,2\}$   |
| 6    | `110`  | $\{1,2\}$   |
| 7    | `111`  | $\{0,1,2\}$ |

Two things follow. The order is _not_ the lexicographic order of the subsets, which would be $\{\}, \{0\}, \{1\}, \{2\}, \{0,1\}, \{0,2\}, \{1,2\}, \{0,1,2\}$. And the order is _not_ increasing in the sum of the selected values, even when all the values are positive: mask 3 sums $a_0 + a_1$ while mask 4 sums $a_2$, and nothing forces $a_0 + a_1 < a_2$.

If an order that changes one item at a time is wanted, the Gray code enumeration is the right one: consecutive masks differ in exactly one bit, so the sum can be updated in constant time instead of recomputed.

### Fixed-size subsets

When the problem asks for subsets of exactly $k$ items, the same loop works with a filter on the weight:

```python
for mask in range(1 << n):
    if mask.bit_count() == k:
        ...
```

The loop still visits all $2^n$ masks, but the states that matter are the $\binom{n}{k}$ of them, and for small $k$ the standard library's combination iterator is faster because it generates only those.

### Meet in the middle

Split the $n$ items into a left half $L$ and a right half $R$ of about $n/2$ items each. Enumerate the subsets of each half, recording the sum of each subset. Then, for every subset of $R$ with sum $t$, look for a subset of $L$ with sum $W - t$.

```python
left = {}
for mask in range(1 << (n // 2)):
    s = sum(a[i] for i in range(n // 2) if (mask >> i) & 1)
    left[s] = mask
for mask in range(1 << (n - n // 2)):
    s = sum(a[n // 2 + i] for i in range(n - n // 2) if (mask >> i) & 1)
    if target - s in left:
        # a solution exists
        break
```

The cost is two enumerations of $2^{n/2}$ masks and $2^{n/2}$ hash lookups. Scanning the items of a half for each mask adds a factor of $n$, so the total is $O(n\,2^{n/2})$; enumerating the masks in Gray code order and updating the sum in constant time removes that factor. For $n = 40$, there are about $10^6$ masks per half, which runs in well under a second in C++ and in a couple of seconds in Python, against $10^{12}$ for the direct enumeration.

Two refinements matter. When the counts are needed rather than the existence, store the _number_ of subsets giving each sum instead of one representative. And when the question is "how many subsets have a sum in $[L, R]$", sort the left sums and use two pointers against the sorted right sums, which turns the matching step into a linear scan.

### Multisets

A multiset with $m$ distinct values and multiplicities $c_1, \dots, c_m$ has $\prod (c_i + 1)$ sub-multisets, which is usually far fewer than the $2^{n}$ index-subsets of the underlying list. Enumerate them with a mixed-radix counter: one digit per distinct value, the digit ranging over $0, \dots, c_i$.

For example, the list $[1, 1, 2, 2, 2]$ has two values with multiplicities $2$ and $3$, so it has $(2+1)(3+1) = 12$ sub-multisets, while the index-subsets number $2^5 = 32$. When the question asks for distinct selections, the multiset enumeration is the correct one and the index enumeration over-counts.

The related count of combinations with repetition, choosing $r$ items from $m$ kinds without regard to order, is $\binom{m + r - 1}{r}$.

## Step-by-step execution

Take three items with values $a_0 = 5$, $a_1 = 3$, $a_2 = 8$, and a target of $8$.

1. Mask $0$: no bits set, total $0$. Not the target.
2. Mask $1$: bit $0$ set, total $5$. Not the target.
3. Mask $2$: bit $1$ set, total $3$. Not the target.
4. Mask $3$: bits $0$ and $1$ set, total $8$. The target. The subset is $\{0,1\}$.
5. The loop may stop here, or continue: mask $4$ gives $8$ as well, the subset $\{2\}$, so there are two solutions.

The order of the answers is not the order of the subsets in the lexicographic listing, and it is not the order of increasing sum. Both of those orders would need a different enumeration.

## Correctness proof

::: math theorem Theorem
The loop over the masks $0, 1, \dots, 2^n - 1$ visits every subset of $S$
exactly once.
:::


::: math proof Proof
**Injectivity.** Suppose two masks $m$ and $m'$ denote the same subset. Then
for every $i$, $s_i \in S(m)$ if and only if $s_i \in S(m')$, which means
$m_i = m'_i$ for every $i$ because the items are distinct. So $m = m'$.

**Surjectivity.** Let $T$ be any subset of $S$. Define the mask $m$ by $m_i = 1$ when $s_i \in T$ and $m_i = 0$ otherwise. Every $m_i$ is $0$ or $1$, so $0 \le m \le \sum_{i=0}^{n-1} 2^i = 2^n - 1$, so $m$ is one of the values the loop visits, and by construction $S(m) = T$.

Every subset is therefore visited, and no subset is visited twice. $\square$
:::


::: math theorem Theorem
The meet in the middle procedure decides whether a set of $n$ items has a
subset with sum $W$ in $O(2^{n/2})$ expected time and $O(2^{n/2})$ space.
:::


::: math proof Proof
**Correctness.** Suppose a solution exists, that is, a subset $T$ with sum
$W$. Write $T_L = T \cap L$ and $T_R = T \cap R$. By the bijection proved
above, the left enumeration visits the mask of $T_L$ and the right
enumeration visits the mask of $T_R$. When the right enumeration reaches
$T_R$, its sum is $t$, and the left enumeration stored the sum
$W - t$ of $T_L$ in the table, so the lookup finds it and the procedure
reports a solution.

Conversely, suppose the procedure reports a solution. It found a left subset and a right subset whose sums add to $W$. Their union is a subset of the $n$ items with sum $W$, so a solution exists.

**Cost.** Each half has $\lceil n/2 \rceil$ or $\lfloor n/2 \rfloor$ items, so each enumeration visits at most $2^{\lceil n/2 \rceil}$ masks. Each mask costs $O(n)$ to sum naively, and each lookup costs $O(1)$ expected, so the total is $O(n\,2^{n/2})$ expected time. The table holds one entry per distinct left sum, so it uses at most $O(2^{n/2})$ space. Enumerating the masks of a half in Gray code order, where consecutive masks differ in one bit, lets the partial sum be updated in constant time, and that removes the factor of $n$ and gives $O(2^{n/2})$ expected time. $\square$
:::


## Complexity analysis

| Task                                        | Time                     | Space             |
| ------------------------------------------- | ------------------------ | ----------------- |
| Enumerate masks, $O(1)$ work per subset     | $O(2^n)$                 | $O(1)$            |
| Enumerate masks, materializing each subset  | $O(n 2^n)$               | $O(n)$ per subset |
| Enumerate the subsets of a multiset         | $O(\prod (c_i + 1))$     | $O(m)$ per subset |
| Meet in the middle, existence of a solution | $O(n\,2^{n/2})$ expected | $O(2^{n/2})$      |
| Meet in the middle, counting solutions      | $O(n\,2^{n/2})$ expected | $O(2^{n/2})$      |

The constants differ sharply between languages. A C++ loop that tests a mask runs at roughly $10^8$ iterations per second; the same loop in Python runs at roughly $10^7$, because every iteration pays the cost of the interpreter. For $n = 25$ that is the difference between about a third of a second and about three seconds, and under a two-second limit it is the difference between accepted and rejected.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| $n \le 20$, one pass over the subsets | A bitmask loop |
| $n \le 20$, exactly $k$ items | A mask loop with a weight filter, or a combination iterator |
| $n \le 40$, a sum-like condition | Meet in the middle |
| $n$ larger, the values are bounded | A dynamic program over the values |
| The items have duplicates | Enumerate sub-multisets, not index-subsets |
| The question is about counts | Meet in the middle with multiplicities in the table |
| The subsets must come out in a specific order | Sort the masks, or use a Gray code |

## Recursion decision

The recursive form of the enumeration, which decides to include or exclude each item, has depth $n$ and makes $2^{n+1}$ calls. The depth is the problem: with $n = 40$ the recursion is forty frames deep, which is fine, but the _number of calls_ doubles the work, and for $n = 40$ the recursion visits $2^{41}$ nodes.

The mask loop avoids both problems: it has no recursion at all, and it visits exactly $2^n$ states. This is the one place where the iterative form is clearly the right answer, which is worth remembering precisely because [recursion](/algorithms/foundations/recursion) is usually the shorter code.

The recursive form earns its place when the state has to be built as it is explored, as in the subset-sum dynamic program, where each state is a subset of the first $i$ items and the transition adds one item.

## Implementation walkthrough

The loop bound and the mask width are the whole implementation.

```cpp
const uint64_t limit = 1ULL << n;   // the width matters as much as the bound
```

The bound `1ULL << n` is correct for $n \le 64$. For $n = 64$ it is $2^{64}$, which is one past the largest unsigned 64-bit value, so the comparison `mask < limit` is always true and the loop would never terminate; a program that needs all $2^{64}$ masks has no solution in this representation anyway, and the practical limit is $n \le 63$.

In Java, `1L << n` is correct for $n \le 63$, and `1 << 32` is not `1 << 32` at all: the shift count is reduced modulo 32, so the bound becomes $1$ and the loop body never runs. The same expression in C++ with an `int` literal is undefined behavior.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| `1 << n` with an `int` literal and $n = 32$ | The bound is wrong in Java and undefined in C++ | Use `1ULL << n` or `1L << n` |
| Iterating `for (i = 0; i <= (1 << n); i++)` | The last mask is out of range | Use `<` with the exclusive bound |
| Building the subset as a list for every mask | $O(n)$ work and $O(n)$ memory per state | Test the mask in place |
| Enumerating index-subsets of a list with duplicates | The same selection is counted many times | Enumerate sub-multisets |
| Assuming the mask order is the lexicographic order of subsets | The output order is wrong | Sort explicitly if the order matters |
| Storing all $2^n$ subsets before testing them | The memory explodes | Test each subset as it is generated |
| Forgetting that $n = 64$ overflows the bound | The loop never ends | Keep $n \le 63$ for a 64-bit mask |
| Using meet in the middle when the condition does not decompose | The halves cannot be matched | Check that the condition splits |

### Why this fails: the bound that is one bit too wide

The plausible wrong approach is to write the loop bound in the most natural way, `1 << n`, and to use it for whatever $n$ the statement allows.

The smallest counterexample is $n = 32$ in Java.

```java
long limit = 1L << n;   // this is fine
int badLimit = (int) (1 << n);   // this is not
```

In Java, the shift count in `1 << 32` is reduced modulo the width of the type, so `1 << 32` is `1 << 0`, which is $1$. The bound is therefore $1$, the loop `for (int mask = 0; mask < badLimit; mask++)` executes exactly one time, and the program reports that no subset of the 32 items satisfies the condition. The correct answer is either "yes" or "no", and the program answers "no" for every input without an error, without an exception, and without a wrong-looking number anywhere.

In C++ the identical expression is undefined behavior, because the shift count is not less than the width of the promoted left operand, so the same program may run forever, may report no subsets, or may do anything at all.

The same failure appears one step down. For $n = 31$ in C++, `1 << 31` does not fit in a signed 32-bit `int`, so the expression is undefined even though the mask it is used to build, $2^{31} - 1$, is a perfectly ordinary number. The mask must be built from a literal of the right width: `(1ULL << 31) - 1`.

A second failure comes from the other end. Enumerating the index-subsets of the list $[1, 1]$ produces four masks, and therefore four subsets: $\{\}$, $\{0\}$, $\{1\}$, and $\{0,1\}$. There are only three distinct selections of values: the empty one, one copy of the value $1$, and two copies of it. A problem that asks how many _different multisets_ can be formed counts three, and the mask enumeration answers four.

The lesson generalizes: **a mask enumeration counts choices of positions, not choices of values.** The two are the same thing only when the items are distinct.

## Variants and extensions

- **Gray code enumeration.** Consecutive masks differ in one bit, so the sum of a subset can be updated in constant time instead of recomputed. This is the standard technique when the per-subset work is otherwise large.
- **The subset-sum dynamic program.** Instead of enumerating subsets, keep a table of achievable sums, which costs $O(nW)$ time and $O(W)$ space for a target bound $W$. This is the right answer when $n$ is large and $W$ is moderate.
- **The complement trick.** When more than half the subsets are wanted, the complement of a subset has sum equal to the total minus the subset's sum, so half the enumeration answers the other half.
- **In-place subset generation.** The classic recursive algorithm generates the subsets of $n$ items in $O(1)$ amortized space by keeping an array of indices and moving only the last one between calls.
- **Enumerating by weight.** The generating function $\prod_{i=1}^{n}(1 + x^{a_i})$ has as its coefficients the number of subsets with each sum, and its computation is the same dynamic program in a different guise.

## Contest strategy

1. Count the states first. Write down $2^n$ and compare it with what the language and the time limit allow: about $10^8$ mask tests per second in C++ and about $10^7$ in Python.
2. If the count is too large, look for a decomposition before looking for a different algorithm. Meet in the middle turns $2^n$ into $2^{n/2}$, and it works whenever the condition splits into a left part and a right part that can be combined.
3. Choose the mask width deliberately. Write `1ULL << n` in C++ and `1L << n` in Java, and check the boundary of the statement.
4. Do not materialize the subsets. Test each mask in place, and keep a count rather than a list of lists.
5. Watch the duplicates. If the items can repeat, the index-subsets are not the selections the problem is counting.
6. When the answer is a count, keep counts in the table rather than representatives; the meet in the middle with multiplicities is the same algorithm with one more dictionary value.

## Worked problems

### Problem 1: subsets with sum $W$

**Restatement.** Given $n \le 20$ integers and a target $W$, report how many subsets have sum $W$.

**Naive baseline.** The mask loop with an $O(n)$ sum per mask, which costs $O(n 2^n)$ and about $2 \times 10^7$ additions for $n = 20$. That passes.

**Insight.** A mask names a subset, so no subset is ever built.

**Derivation.** Loop over the masks from $0$ to $2^n - 1$, compute the sum from the bits, and count the matches.

**Correctness.** By the bijection proved above, the loop visits every subset exactly once, so the count is the number of subsets with sum $W$.

**Complexity.** $O(n 2^n)$ time and $O(1)$ extra space.

**Common wrong approach.** Building a list of the selected indices for every mask, which costs the same time and much more memory.

### Problem 2: subset sum with $n = 40$

**Restatement.** Given $n \le 40$ integers and a target $W$, report whether some subset sums to $W$.

**Naive baseline.** The mask loop, which needs $2^{40} \approx 1.1 \times 10^{12}$ iterations and does not finish.

**Insight.** Split the items in half and match the two lists of partial sums.

**Derivation.** Enumerate the $2^{20}$ sums of the left half into a hash table, then enumerate the $2^{20}$ sums of the right half and look up the complement.

**Correctness.** Every subset decomposes uniquely into a left subset and a right subset, and the procedure examines that pair.

**Complexity.** $O(2^{n/2})$ expected time and $O(2^{n/2})$ space, against $O(2^n)$ for the direct enumeration.

**Common wrong approach.** Splitting the items but forgetting that the two halves must be matched by sum and not by index, which finds nothing.

### Problem 3: distinct selections from a multiset

**Restatement.** Given a list of $n \le 30$ values in which some values repeat, report how many distinct selections of values are possible.

**Naive baseline.** The mask loop, which counts index-subsets and therefore counts the same selection many times.

**Insight.** The count is the product of the multiplicities plus one.

**Derivation.** Group the values, and for each group choose how many copies to take, from $0$ to its multiplicity. Enumerate the choices with a mixed-radix counter.

**Correctness.** Each sub-multiset corresponds to exactly one choice of a count for each value, and the counter visits every such choice once.

**Complexity.** $O(\prod (c_i + 1))$ time and $O(m)$ space for $m$ distinct values.

**Common wrong approach.** Dividing the index-subsets by the number of equal items, which does not work when different items have different multiplicities.

## Practice progression

1. **Recognition.** Given a constraint on the number of items, decide whether enumeration, meet in the middle, or a dynamic program is the right family.
2. **Direct application.** Write the mask loop in your contest language and compute the sum of a mask from its bits.
3. **Adaptation.** Add a weight filter for the subsets of exactly $k$ items, and write the Gray code enumeration.
4. **Combination.** Solve a subset sum problem with $n = 40$ using meet in the middle, and one with $n = 200$ and a small target using the dynamic program.
5. **Challenge.** Count the number of subsets with sum in an interval using meet in the middle with sorted partial sums and two pointers, and compare it with the dynamic program for the same problem.
6. **Transfer.** Take a problem whose statement bounds the number of choices rather than the number of items, and decide whether the enumeration is over items, over subsets of groups, or over something else entirely.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. Why does a bitmask make the enumeration cheaper than a list of elements, in both time and space? (Key insight)
2. State the order in which the mask loop visits the subsets of three items, and say which item varies fastest. (Algorithm derivation)
3. Prove that the mask loop visits every subset exactly once. (Correctness proof)
4. How many sub-multisets does a multiset with multiplicities $c_1, \dots, c_m$ have, and why? (Formal model)
5. What does meet in the middle replace, and by how much does it reduce the number of states? (Algorithm derivation)
6. State the conditions under which meet in the middle applies, and give a condition that does not decompose. (Algorithm selection)
7. What is the smallest $n$ for which `1 << n` misbehaves in Java, and what exactly happens? (Common mistakes)
8. Why does enumerating the index-subsets of a list with duplicates give the wrong count? (Common mistakes)
9. Compare the number of mask tests per second in C++ and in Python, and say what that does to the largest usable $n$. (Complexity analysis)
10. When is the recursive form of the enumeration the right choice, and what does it cost? (Recursion decision)

## Further reading

- The bit operations that make the mask work, including the traps in the shift count and the mask width, are in [binary representation](/algorithms/foundations/binary-representation).
- The bounds that decide whether $2^n$ is affordable are in [complexity analysis](/algorithms/foundations/complexity).
- The sorting that a meet in the middle with sorted partial sums relies on is in [sorting](/algorithms/foundations/sorting).
- The recursion that the include-or-exclude formulation produces is described in [recursion](/algorithms/foundations/recursion).
