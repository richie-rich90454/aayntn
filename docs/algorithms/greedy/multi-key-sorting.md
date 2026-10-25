---
id: greedy.multi-key-sorting
title: Sorting by several keys
summary: Order records by a lexicographic comparison, where the first key decides and every later key only breaks a tie.
division: [bronze, silver]
subjects: [greedy]
level: introductory
importance: common-contest-technique
keywords: [multi-key sorting, lexicographic order, comparator, tie-breaking, stable sort, greedy]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended: [foundations.recursion]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - Every record carries the same fixed list of keys, and the required order is lexicographic with a stated direction for each key.
implementations: greedy.multi-key-sorting
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/greedy.multi-key-sorting.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

Sorting by several keys orders records by a lexicographic rule. In this article the rule is:

1. `a` ascending,
2. `b` descending,
3. `c` ascending.

The first key is the most significant one. It decides the order whenever two records differ on it. The second key is consulted only when the first keys are equal, and the third only when the first two are equal.

The greedy move is to fill each output position with the smallest remaining record under that rule. The move is forced rather than clever: any sorted sequence must begin with a minimum, and after that minimum is removed the remainder must again be sorted. That exchange argument is one line, and the rest of the technique is about computing the order efficiently and about the two ways to encode it.

A comparison sort is the batched form of the greedy selection. Instead of scanning for the minimum $n$ times, it compares records and moves each one a logarithmic number of times, so the cost falls from $O(n^2)$ to $O(n \log n)$.

The two encodings are worth knowing separately.

- **One composite comparator.** Write a function that compares `a`, then `b` in reverse, then `c`. Call the library sort once. This is the usual solution.
- **Stable passes from least significant to most significant.** Sort by `c`, then stably by `b` descending, then stably by `a`. Each pass refines the previous order, and the last pass is the one that dominates.

Both produce the same sequence. The composite comparator is shorter and is the one to write under contest pressure. The stable-pass version explains why the first key must be last, and it is the version that generalizes to radix sort and to a large number of keys.

## Problem motivation

A contest scoreboard has to be printed in a precise order: more solved problems first, then smaller total penalty, then smaller team number. An inventory list has to be printed by aisle ascending, shelf descending, and bin ascending. A list of sensor readings has to be ordered by station, then by time descending, then by reading ascending.

All three are the same problem. The statement gives a list of records with a fixed number of fields and a priority order over those fields. The output is the records rearranged so that the priority order holds for every pair.

The version used throughout this article has these constraints.

- $1 \le n \le 200\,000$ records.
- Each record is a triple $(a, b, c)$ of integers with $-10^9 \le a, b, c \le 10^9$.
- The required order is $a$ ascending, then $b$ descending, then $c$ ascending.
- Records that agree on all three keys are indistinguishable in the output, so their relative order does not matter.

The naive approach fills the output one position at a time by scanning all remaining records for the minimum. That is $O(n^2)$ comparisons, which is about $4 \cdot 10^{10}$ for the largest input, and it is too slow.

The same ordering is often only the first step of a larger algorithm. A sweep line sorts events by position; a greedy matching sorts candidates by one key and breaks ties by another. In those algorithms a wrong tie-break does not produce a wrong-looking answer immediately. It produces a plausible answer that fails one test, which is worse.

## Recognition patterns

Multi-key sorting is the right tool when all of the following hold.

- The records have a **fixed list of fields**, and every field is available before the sort begins.
- The required order is **lexicographic**: the first field decides, and later fields only break ties.
- The direction of each field is **stated**, and the directions may differ.
- The answer is a **permutation of the input**, not a subset and not a count.

The phrases that signal it are "ordered by", "break ties by", "first by ... then by ...", "in ascending order of ... and descending order of ...", and "print the records in the following order".

The phrases that rule it out are "maximize the total", which is an optimization rather than an ordering, and "output any valid order", which usually means the choice of order is free and a sort may not be needed at all.

| Constraint | What it rules |
| --- | --- |
| A fixed number of keys, all known in advance | A lexicographic comparator, one sort |
| Many keys, or an expensive key comparison | Stable passes from least to most significant, or a radix sort |
| Records that agree on every key must keep their input order | A stable sort, or the original index as an extra final key |
| Only the first $m$ records are needed | A partial sort or a heap of size $m$, not a full sort |
| One key is a fraction or another computed value | Compare exactly, by cross multiplication, not with floating point |
| The order must also satisfy "u before v" constraints | A topological sort, not a comparison sort |
| The comparison relation is not transitive | No comparison sort can work; fix the relation first |
| The output is a total value, not an order | A dynamic program or a greedy exchange argument, not this technique |

The last two rows are the traps. A comparison sort assumes a total preorder, and a comparator that violates transitivity can make a library sort return garbage or throw. A statement that asks for the best order under a sum objective is not asking for a lexicographic order at all.

## Naive approach

The literal greedy algorithm scans the remaining records for the minimum, removes it, and repeats.

```python
def order_naively(records):
    remaining = list(records)
    result = []
    while remaining:
        best = 0
        for i in range(1, len(remaining)):
            if comes_before(remaining[i], remaining[best]):
                best = i
        result.append(remaining.pop(best))
    return result
```

The scan costs $O(n)$ per output position, and `pop(best)` costs another $O(n)$ because every later element shifts. The total is $O(n^2)$ time and $O(n)$ space. It is a correct specification of the problem, and it is what the greedy argument proves correct, but it is not a solution for $n = 200\,000$.

The second baseline is the multi-pass sort written in the wrong order. It is worth writing down because it looks like the stable-pass technique and is not.

```python
records.sort(key=lambda r: r[0])          # a ascending
records.sort(key=lambda r: -r[1])         # b descending: this becomes the new primary key
records.sort(key=lambda r: r[2])          # c ascending: this overrides both
```

The final pass sorts by `c` alone, so the result is ordered by `c` and by nothing else. Passing over the keys from most significant to least significant can only work if each pass is stable and the passes are read in the opposite direction. The version above is neither.

A third baseline is the comparator written with subtraction:

```python
records.sort(key=cmp_to_key(lambda x, y: x[0] - y[0] or y[1] - x[1] or x[2] - y[2]))
```

This happens to work for the stated bounds because the differences fit in 64-bit arithmetic in Python. In C, C++, Java, and JavaScript the same expression can overflow for values near the limits of the type, so the reference implementations never use it.

## Key insight

A lexicographic comparison walks down the keys in priority order and stops at the first difference. That single sentence determines the whole implementation.

- The **first** key must be examined first, because it overrides everything after it.
- A later key participates only when every earlier key is equal.
- If the sort is done in several passes, the **last** pass must be on the most significant key, because a later pass overwrites the order produced by an earlier one.
- Every earlier pass must be **stable**, because a stable sort is the only one that preserves the order established for the keys it does not examine.

The greedy character is in the first difference. The algorithm never needs to look at the later keys of two records once an earlier key has decided their order. Each comparison spends its work only where the records are still tied.

::: math invariant Invariant
After the passes for keys $k, k-1, \ldots, j$ have been applied, the sequence is sorted by keys $j, j+1, \ldots, k$, and records that tie on key $j$ keep the order established by the passes for the less significant keys.
:::

The invariant is the reason the pass order is reversed. It is proved by induction in the correctness section.

The composite comparator is the same invariant collapsed into one function: each comparison starts at the first key and descends only as far as the tie requires.

## Visual intuition

The comparison is a decision tree. The top of the tree is the most significant key.

```text
compare a
├── a smaller  → left record first
├── a larger   → right record first
└── a equal    → compare b, with the direction reversed
    ├── b larger  → left record first
    ├── b smaller → right record first
    └── b equal   → compare c
        ├── c smaller → left record first
        ├── c larger  → right record first
        └── c equal   → the records are indistinguishable
```

The stable-pass view draws the same tree as a sequence of refinements. Each pass imposes one key, and the passes run from the bottom of the tree upward.

| Pass | Key and direction | What the pass fixes | What it must not disturb |
| --- | --- | --- | --- |
| 1 | `c` ascending | The order within every group of records that tie on `a` and `b` | Nothing yet |
| 2 | `b` descending | The order of the `b` groups, and the `c` order inside each group | The `c` order from pass 1 |
| 3 | `a` ascending | The order of the `a` groups, and everything inside each group | The whole order from pass 2 |

The picture to hold is a set of nested groups. The first key splits the records into groups. The second key orders the records inside each group. The third key orders the records inside each subgroup. Sorting the innermost groups first and then merging outward is exactly the stable-pass algorithm.

## Formal model

A record is a triple $r = (a_r, b_r, c_r)$ of integers. The required precedence relation is defined by three cases.

::: math definition Definition
For two records $r$ and $s$, write $r \prec s$ when at least one of the following holds:

1. $a_r < a_s$;
2. $a_r = a_s$ and $b_r > b_s$;
3. $a_r = a_s$, $b_r = b_s$, and $c_r < c_s$.

Write $r \sim s$ when $a_r = a_s$, $b_r = b_s$, and $c_r = c_s$. A sequence $r_1, r_2, \ldots, r_n$ is **sorted** when $r_i \preceq r_{i+1}$ for every $i$, where $r \preceq s$ means $r \prec s$ or $r \sim s$.
:::

The relation is a strict total order on the equivalence classes of $\sim$. That is the property a comparison sort needs.

::: math definition Definition
A comparison function $f(r, s)$ is **consistent** with $\prec$ when $f(r, s) < 0$ exactly if $r \prec s$, $f(r, s) = 0$ exactly if $r \sim s$, and $f(r, s) > 0$ exactly if $s \prec r$. A sort is **stable** when records that compare equal keep their relative input order.
:::

::: math lemma Lemma
The relation $\prec$ is irreflexive, transitive, and total on records that are not equivalent: for any two records, exactly one of $r \prec s$, $s \prec r$, or $r \sim s$ holds.
:::

The lemma is proved by walking down the keys. It is the reason the composite comparator is allowed to return early at the first difference.

::: math definition Definition
Let $k$ keys be given with a direction for each. The **stable-pass algorithm** applies a stable sort once per key, in reverse priority order: the least significant key first and the most significant key last. Each sort compares only its own key, in the direction stated for that key.
:::

For the running order, the passes are `c` ascending, then `b` descending, then `a` ascending.

## Algorithm derivation

Start from the greedy selection. At each step the next output record is the minimum of the remaining set under $\prec$. The first element of any sorted sequence is a minimum, so the greedy choice is forced. Removing it leaves the same problem on $n-1$ records, so the greedy algorithm is correct by induction.

The selection is correct and too slow. The replacement is a comparison sort with a comparator that implements $\prec$.

```text
compare(r, s):
    if r.a < s.a: return -1
    if r.a > s.a: return +1
    if r.b > s.b: return -1
    if r.b < s.b: return +1
    if r.c < s.c: return -1
    if r.c > s.c: return +1
    return 0
```

The shape is the decision tree from the previous section. The chain inspects at most three keys, and each step is a plain integer comparison. No subtraction appears, so no difference can overflow.

The alternative derivation is the one that explains the pass order. Suppose the records are already sorted by `c`. A stable sort by `b` descending reorders the `b` groups and leaves the `c` order untouched inside each group. A stable sort by `a` then reorders the `a` groups and leaves everything inside each group untouched. After the third pass, the sequence is ordered by `a`; within an `a` group it is ordered by `b`; and within an `(a, b)` group it is ordered by `c`.

The order of the passes is not a convention. Starting with `a` would put the least significant key last, and the final pass would then erase the work of the two before it.

::: math invariant Invariant
Before the pass for key $j$, the sequence is sorted by keys $j+1, \ldots, k$. The pass for key $j$ is stable and compares only key $j$, so afterwards the sequence is sorted by keys $j, j+1, \ldots, k$.
:::

The invariant also settles the direction question. Descending `b` is a comparison $b_r > b_s$ inside the pass, not a negation of the stored value. The negation trick works only when the type is wide enough to hold the negated value, and it silently fails at the minimum representable integer.

## Step-by-step execution

Take five records.

| Label | a   | b   | c   |
| ----- | --- | --- | --- |
| R1    | 2   | 5   | 1   |
| R2    | 1   | 3   | 4   |
| R3    | 2   | 9   | 2   |
| R4    | 1   | 3   | 1   |
| R5    | 2   | 9   | 1   |

The correct order is R4, R2, R5, R3, R1.

The composite comparator reaches that order directly. Consider the pair R5 and R3: their `a` values are equal, their `b` values are equal, and `c` is 1 versus 2, so R5 comes first. Consider R3 and R1: their `a` values are equal and `b` is 9 versus 5, so R3 comes first because `b` is descending. Consider R2 and R4: their `a` values are equal and their `b` values are equal, and `c` is 4 versus 1, so R4 comes first.

The stable-pass algorithm shows the same order being built from the inside out.

| Step                          | Sequence after the step |
| ----------------------------- | ----------------------- |
| Input                         | R1, R2, R3, R4, R5      |
| Stable sort by `c` ascending  | R1, R4, R5, R3, R2      |
| Stable sort by `b` descending | R5, R3, R1, R4, R2      |
| Stable sort by `a` ascending  | R4, R2, R5, R3, R1      |

Read the middle row carefully. The `b` values are 5, 3, 9, 9, 3 in the sequence before the pass. Descending by `b` puts the two 9s first, and their relative order is R5 then R3, which is the `c` order established by the previous pass. The 5 comes next, and the two 3s keep their `c` order, R4 then R2. The final pass moves the two `a = 1` records to the front without disturbing their `b` and `c` order.

If two records agree on all three keys, every comparison returns zero and either order is a valid output. The reference programs therefore do not need a fourth key. If the records carried a name or an original index that had to be preserved, that field would become the last key, and the order would again be total.

## Correctness proof

::: math theorem Theorem
The composite comparator returns a value consistent with $\prec$, and every correct comparison sort that uses it produces a sorted sequence.
:::

::: math proof Proof
Let $r$ and $s$ be two records. The comparator tests `a` first. If $a_r \ne a_s$, it returns a negative value exactly when $a_r < a_s$ and a positive value otherwise, without ever forming the difference, so case 1 of the definition decides and the result is consistent.

If $a_r = a_s$, the comparator tests `b` and returns negative exactly when $b_r > b_s$, which is case 2. If $b$ is also equal, it tests `c` and returns negative exactly when $c_r < c_s$, which is case 3. If all three keys are equal, it returns zero, which is exactly $r \sim s$.

So the comparator agrees with $\prec$ on every pair. A correct comparison sort returns a permutation in which no adjacent pair is out of order. If some pair were out of order, transitivity of $\prec$ would put an adjacent inversion somewhere in the sequence, contradicting the sort's postcondition. Therefore the output is sorted. $\square$
:::

::: math theorem Theorem
The stable-pass algorithm produces a sorted sequence.
:::

::: math proof Proof
Index the keys from least significant to most significant as $k, k-1, \ldots, 1$. The claim is that after the pass for key $j$, the sequence is sorted by keys $j, j+1, \ldots, k$.

For the first pass, $j = k$, and the pass sorts by key $k$ alone; the claim holds trivially.

Suppose the claim holds before the pass for key $j$. The pass is a stable sort by key $j$. Take two adjacent records $r$ and $s$ after the pass. If $r$ and $s$ differ on key $j$, the pass put them in the required direction, so the pair is in order on the first key that can distinguish them. If they agree on key $j$, stability guarantees that their relative order is the one they had before the pass. By the induction hypothesis that order is correct on keys $j+1, \ldots, k$, and since key $j$ is equal, it is correct on keys $j, j+1, \ldots, k$ as well.

Every adjacent pair is in order, so the sequence is sorted. Setting $j = 1$ gives the claim. $\square$
:::

::: math theorem Theorem
The greedy algorithm that repeatedly removes the minimum remaining record produces the sorted sequence.
:::

::: math proof Proof
Let $m$ be a minimum of the remaining records. In any sorted sequence, the first record must be a minimum: if the first record were $x$ and some later record $y$ satisfied $y \prec x$, then $y$ would have to appear before $x$, a contradiction. So every sorted sequence begins with a minimum, and the greedy choice is forced.

Removing $m$ leaves the same ordering problem on the remaining records. By induction on the number of records, the greedy algorithm sorts the remainder. Therefore the whole output is sorted. $\square$
:::

The exchange argument can also be phrased as an inversion count. Swapping an adjacent inverted pair strictly decreases the number of inverted pairs, so repeatedly swapping such a pair reaches a sequence with none. That sequence is the sorted one, and the greedy algorithm reaches it in one pass per output position.

## Complexity analysis

**Composite comparator.** The sort performs $O(n \log n)$ comparisons in the worst case. Each comparison inspects at most three integers and does constant work, so the total time is $O(n \log n)$. A merge sort or Timsort needs $O(n)$ auxiliary space; a quicksort needs $O(\log n)$ stack space on average and $O(n)$ in the worst case.

**Stable passes.** With $k$ keys, the algorithm performs $k$ sorts, each $O(n \log n)$, so the time is $O(k n \log n)$. Each stable merge needs $O(n)$ auxiliary space, reused between passes. For the three keys of this article, $k = 3$ is a constant and the bound is still $O(n \log n)$, with a larger constant than one composite sort.

**Output.** Printing the records costs $\Theta(n)$, which is dominated by the sort unless $n$ is tiny.

::: math complexity Complexity
Multi-key sorting of $n$ records with $k$ keys takes $O(n \log n)$ time with one composite comparator, or $O(k n \log n)$ time with stable passes. The auxiliary space is $O(n)$ for a stable merge sort, and the output itself is $\Theta(n)$.
:::

The comparison lower bound says that no comparison sort can beat $\Omega(n \log n)$ in the worst case for arbitrary keys. The bound is not a limitation of this technique; it is a property of learning the order from pairwise comparisons. When the keys are small integers, a radix sort can do better, but at $n = 200\,000$ the library sort is fast enough and far shorter.

The pass version is the one to choose when $k$ is large or the comparator is expensive. With $k$ passes, each comparison reads one key; with a composite comparator, each comparison may read all $k$ keys. When $k = 20$ and most records tie on the early keys, the pass version can be several times faster despite doing more comparisons overall.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| A fixed, small number of integer keys | One composite comparator and one sort |
| Many keys, or a comparator that is expensive to evaluate | Stable passes from least to most significant |
| Keys are small integers in a narrow range | Radix sort or counting sort on each pass |
| Records equal on all keys must keep their input order | A stable sort, or the input index as a final key |
| Only the first $m$ records are needed | A partial sort, or a heap of size $m$ |
| The order is by a fraction $p_i / q_i$ | Cross multiplication, not floating point |
| The order must respect precedence constraints | A topological sort |
| The records arrive one at a time and the order must be maintained | A balanced search tree with the same comparator |
| The comparison is not transitive | Fix the comparison; no sort can repair it |

The first two rows are the main decision. The composite comparator is shorter and is the default. The stable passes are the better choice when the key vector is long, when the keys are strings, or when each comparison would otherwise be expensive.

The fraction row is a correctness decision rather than a performance one. A `double` has 53 bits of mantissa, and a fraction of two values near $10^9$ can differ by less than $2^{-53}$, so two distinct fractions can compare equal. Cross multiplication with 64-bit integers keeps the comparison exact as long as the products fit; for numerators and denominators up to $10^9$ and $2 \cdot 10^9$, the product is at most about $2 \cdot 10^{18}$, which fits in a signed 64-bit integer.

The last row is the one that produces crashes rather than wrong answers. Java's TimSort throws `IllegalArgumentException: Comparison method violates its general contract!` when a comparator is inconsistent, and C++'s `std::sort` has undefined behavior on such a comparator. A relation that uses an epsilon, or one that compares only some fields in an inconsistent order, is not a total preorder.

## Reference implementations

The manifest publishes one `program` variant per language, and all six solve exactly the stated problem: read $n$, then $n$ triples, sort by $a$ ascending, then $b$ descending, then $c$ ascending, and print one triple per line.

- `c/program.c` uses `qsort` with a comparator built from explicit integer comparisons.
- `cpp17/program.cpp` uses `std::sort` with the same comparator shape.
- `java/Main.java` uses `Arrays.sort` on an array of records and a `StringBuilder` for the output.
- `python/program.py` uses a key function that returns the tuple `(a, -b, c)`.
- `pascal/program.pas` uses an iterative bottom-up merge sort, so it compiles under pas2js without recursion or console units beyond `SysUtils`.
- `javascript/program.js` uses `Array.prototype.sort` with a numeric comparator.

The Python key function is the shortest expression of the order, and it is safe because Python integers are arbitrary precision, so `-b` cannot overflow. The other five languages keep the descending key as a reversed comparison instead of a negated value.

The input and output contract is the same in every language: integers are whitespace-separated, the first token is $n$, and each output line contains the three fields of one record separated by single spaces. No trailing space is printed, and every line ends with a newline.

## Recursion decision

The comparator is not recursive in any language, and it should not be. It is called $O(n \log n)$ times, so a recursive helper would add call overhead to the hottest function in the program for no benefit.

The sort itself may recurse. Merge sort and Timsort recurse to a depth of about $\lceil \log_2 n \rceil$, which is 18 for $n = 200\,000$, and that is far below any language's stack limit. The C, C++, Java, Python, and JavaScript versions use the library sort, which chooses its own strategy. The Pascal version uses an iterative bottom-up merge sort so that the published listing has no recursion at all and is easy to compile under pas2js.

| Language | Sort used | Recursion | Verdict |
| --- | --- | --- | --- |
| C | `qsort` | Internal, implementation-defined | Fine; the comparator is the only code to review |
| C++ | `std::sort` | Introsort, $O(\log n)$ depth | Fine |
| Java | `Arrays.sort` | Timsort, $O(\log n)$ depth | Fine; an inconsistent comparator throws |
| Python | `list.sort` | Timsort, $O(\log n)$ depth | Fine |
| Pascal | Bottom-up merge sort | None | Fine under pas2js |
| JavaScript | `Array.prototype.sort` | Engine-defined, $O(\log n)$ depth | Fine; the comparator must return a number |

The Pascal choice is educational rather than necessary. A recursive merge sort would also compile, but the iterative merge is only a few lines longer and removes one thing that can go wrong in a browser-hosted compiler.

## Implementation walkthrough

Three details decide whether the implementation matches the statement.

**The comparison order.** Write the keys in the order the statement gives them. The first branch of the comparator is the first key. A comparator that checks `b` before `a` produces a different order even if every individual comparison is correct.

**The direction.** Ascending `a` is `a_r < a_s`. Descending `b` is `b_r > b_s`. Do not implement descending by negating the stored value unless the type is wide enough: if `b` is the minimum representable integer, `-b` overflows, and in Java and C++ the result is either the same negative value or undefined behavior. The reference implementations reverse the comparison instead.

**The final zero.** Every comparator must return zero when all keys are equal. Returning a nonzero value for equal records breaks the contract, and a sort may then reorder equal records unpredictably or throw.

The C comparator is the shape the other languages copy.

```c
static int compare_records(const void *left, const void *right) {
    const record *x = left;
    const record *y = right;
    if (x->a != y->a) {
        return x->a < y->a ? -1 : 1;
    }
    if (x->b != y->b) {
        return x->b > y->b ? -1 : 1;
    }
    if (x->c != y->c) {
        return x->c < y->c ? -1 : 1;
    }
    return 0;
}
```

The Python version replaces the branches with a key tuple.

```python
records.sort(key=lambda r: (r[0], -r[1], r[2]))
```

The tuple comparison is lexicographic by construction, which is exactly the required order. The negation is safe because Python integers do not overflow.

The Pascal version uses its own sort rather than relying on a library sort that the pas2js profile may not provide. The comparison function returns a boolean, and the merge is the usual two-pointer merge over an auxiliary array.

```pascal
function Before(const X, Y: TRecord): Boolean;
begin
  if X.A <> Y.A then
  begin
    Result := X.A < Y.A;
    Exit;
  end;
  if X.B <> Y.B then
  begin
    Result := X.B > Y.B;
    Exit;
  end;
  Result := X.C < Y.C;
end;
```

The merge loop copies the earlier record of the two runs first and advances that run's pointer. Equal records may be taken from either side; the output is identical because equal triples print the same three numbers, and taking from the left keeps the sort stable.

**Reading the input.** The Java version uses a byte-oriented scanner rather than `Scanner`, because $200\,000$ records is enough to make `Scanner` the slowest part of the program. The Pascal version calls `Read` once per integer, which is required by the pas2js console unit. The C and C++ versions read with `scanf` and `std::cin` after disabling synchronization.

**Writing the output.** Building the output in one buffer is faster than writing one line at a time in Java and JavaScript. The C and C++ versions write directly, which is fast enough with the standard streams in their default state.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Comparing with `a - b` | The difference overflows near the type limits | Use three-way comparisons |
| Sorting by the keys in priority order | The last pass overrides the earlier ones | Sort from least to most significant, or use one comparator |
| Using an unstable sort for the passes | Ties on the later keys are scrambled | Use a stable sort, or add the input index as a final key |
| Negating a key to get descending order | The minimum value overflows and sorts first | Reverse the comparison instead |
| Checking `b` before `a` | The order is by `b`, not by `a` | Keep the statement's priority order |
| Returning 1 instead of 0 for equal records | The comparator contract is broken | Return 0 on full equality |
| Using floating point for a rational key | Distinct fractions can compare equal | Cross multiply with 64-bit integers |
| Forgetting the tie-break entirely | The output depends on the sort's internals | Include every key the statement names |
| Printing a trailing space after each record | The output differs from the reference whitespace | Join the fields with single spaces and end with a newline |
| Sorting strings that hold numbers | `"10"` sorts before `"9"` | Parse the fields as integers before sorting |

### Why this fails: the unstable passes in the wrong order

The failure that survives review most often is the belief that "sort by `a`, then by `b`, then by `c`" means three passes in that order. It does not, and the smallest counterexample needs three records.

| Label | a   | b   | c   |
| ----- | --- | --- | --- |
| R1    | 1   | 5   | 0   |
| R2    | 2   | 9   | 0   |
| R3    | 1   | 7   | 0   |

The required order is R3, R1, R2: the `a = 1` records come first, and among them the larger `b` comes first.

- **Correct, last pass on `a`.** Sort by `b` descending: R2, R3, R1. Then stably sort by `a` ascending: the two `a = 1` records keep their order, giving R3, R1, R2.
- **Wrong, first pass on `a`.** Sort by `a` ascending: R1, R3, R2 (the two `a = 1` records can be in either order if the sort is unstable; both are valid at this point). Then sort by `b` descending, which is now the most significant key: R2, R3, R1. The final order is decided by `b` alone, and the `a` order is gone.

A related failure is a correctness failure rather than an ordering one. In a 32-bit signed integer, the negation of $-2\,147\,483\,648$ is $-2\,147\,483\,648$, because the positive value does not fit. A record with that `b` value sorts as if it had the smallest `b` instead of the largest one. The reference implementations never negate a key, and the Python version can negate safely only because its integers are unbounded.

A third failure appears with floating-point keys. Two fractions that differ by less than the precision of a `double` compare equal, and the tie-break silently decides the order. The fix is exact comparison, not a larger epsilon: an epsilon makes the relation nontransitive, which is worse than a tie.

## Variants and extensions

- **More than three keys.** The comparator gains one branch per key, and the stable-pass version gains one pass per key. Neither changes the asymptotic bound when the number of keys is fixed.
- **Mixed directions per key.** Each key carries a direction, and the comparator uses `<` or `>` accordingly. A direction table is clearer than a chain of negated values.
- **Computed keys.** When a key is a fraction, a sum, or another expression, compare the expression exactly. Cross multiplication is the standard tool for fractions; 64-bit integers cover products up to about $9 \cdot 10^{18}$.
- **Stable passes as radix sort.** If each key is a small integer, a counting sort per pass replaces the comparison sort and the algorithm becomes $O(n + k)$ per pass.
- **Partial sorting.** When only the first $m$ records are needed, a heap of size $m$ costs $O(n \log m)$ and avoids sorting the rest.
- **Grouping and then sorting.** When the output is grouped by one key and sorted inside each group, sort by the group key first, then sort each group by the remaining keys. This is the stable-pass idea applied to contiguous ranges.
- **Dynamic order.** When records are inserted and removed while the order must be maintained, a balanced search tree or an order-statistics tree with the same comparator replaces the sort.
- **Deterministic ties.** When equal records must keep their input order, add the original index as the last key. This makes the order total and removes any dependence on the sort's stability.
- **Sorting with a custom relation that is only a partial order.** This is not this technique. A partial order needs a topological sort, and a comparison sort may produce an arbitrary linear extension or fail.

## Contest strategy

Under contest pressure, the errors above are what cost points. A fixed procedure avoids them.

1. Write the comparison rule as a table before writing code: key, direction, and priority. The table is the specification.
2. Decide whether one comparator or several stable passes is shorter for the number of keys in the statement.
3. Write the comparator with one early return per key and a final `return 0`.
4. Never subtract values to build the comparator, and never negate a value to reverse a direction unless the range is known to be safe.
5. If the statement requires a deterministic order among records that tie on every stated key, add the input index as a final key.
6. Test five inputs by hand: all keys equal, only the first key equal, only the first two keys equal, negative values, and a single record.
7. Test the largest $n$ once. A correct $O(n^2)$ solution and a correct $O(n \log n)$ solution look the same on the samples.

The fifth step is the one that is easy to skip. A sort that is correct on the stated keys may still fail a checker that expects the records in input order among full ties, and the fix is one extra field in the comparator.

## Worked problems

### Problem 1: the contest rank list

**Restatement.** $n$ teams each have a number of solved problems $p_i$ and a total penalty $t_i$. Team $x$ ranks above team $y$ when $p_x > p_y$, or when $p_x = p_y$ and $t_x < t_y$. Teams with the same pair share the same block of places. Count how many teams share the $k$-th place. Constraints: $1 \le n \le 50$ and $1 \le p_i, t_i \le 50$. The problem is [Rank List](https://codeforces.com/problemset/problem/166/A).

**Naive baseline.** Compare every pair and count the teams that rank above the target, which is $O(n^2)$ and easy to get wrong at the tie boundaries.

**Insight.** The ranking is a two-key order: $p$ descending and $t$ ascending. Once the records are sorted, the teams sharing a place form one contiguous block of equal pairs.

**Derivation.** Sort by $p$ descending, then by $t$ ascending. Find the team at index $k - 1$ in the sorted array, and count how many records equal it.

**Correctness.** The sorted order is exactly the ranking order, so every team before the block ranks above it and every team after ranks below it. The size of the block is therefore the number of teams sharing the place.

**Complexity.** $O(n \log n)$ time and $O(n)$ space, with $n \le 50$.

**Common wrong approach.** Sorting equal-problem teams by descending penalty. The comparator is then inconsistent with the statement, and the sample still passes; the failure appears on the hidden tests.

### Problem 2: the coin-toss standings

**Restatement.** $n$ people have $A_i$ heads and $B_i$ tails. Person $i$ has success rate $A_i / (A_i + B_i)$. Sort the people by success rate descending, breaking ties by index ascending. Constraints: $2 \le n \le 200\,000$, $0 \le A_i, B_i \le 10^9$, and $A_i + B_i \ge 1$. The problem is [Standings](https://atcoder.jp/contests/abc308/tasks/abc308_c).

**Naive baseline.** Compute each rate as a `double` and sort. The rates are close enough for distinct fractions to collide, and the tie-break then decides the order incorrectly.

**Insight.** The comparison between $A_i / (A_i + B_i)$ and $A_j / (A_j + B_j)$ is equivalent to comparing $A_i (A_j + B_j)$ with $A_j (A_i + B_i)$, because both denominators are positive. The products fit in a signed 64-bit integer under the constraints.

**Derivation.** Store each record as $(A_i, B_i, i)$. The comparator computes the two cross products and compares them; on equality it compares the indices ascending. This is a two-key sort with a computed first key.

**Correctness.** The cross multiplication is an exact rearrangement of the fraction comparison, so the first key is compared correctly. The index is a total tie-break, so the comparator is a strict total order.

**Complexity.** $O(n \log n)$ time and $O(n)$ space. Each comparison does two multiplications of values up to about $2 \cdot 10^9$, whose products fit in 64 bits.

**Common wrong approach.** Using `double` for the rate. The sample passes because its fractions are far apart, and the hidden tests contain fractions that differ by less than the mantissa.

### Problem 3: the second-smallest producer

**Restatement.** Seven cows produce milk. The input is a log of $n$ entries, each a cow name and a positive amount. A cow absent from the log produces zero. Report the cow whose total production is the smallest total strictly above the minimum, or `Tie` when several cows share that total or no cow has it. Constraints: $1 \le n \le 100$ and each amount is at most 100. The problem is [Don't Be Last!](https://usaco.org/index.php?page=viewproblem2&cpid=687).

**Naive baseline.** For each cow, scan the log to total its production, then scan the totals repeatedly to find the second-smallest value. That is $O(n^2)$ and easy to write, and it is fast enough for $n \le 100$.

**Insight.** The answer is a two-key order over the seven cows: total ascending, then name ascending. The second-smallest total is the first distinct total above the minimum, and the name order decides the report when several cows share it.

**Derivation.** Total the log into a table of the seven cows. Sort the seven pairs by total ascending, then by name ascending. Skip the first distinct total, and inspect the next one. If exactly one cow has it, print the name; otherwise print `Tie`.

**Correctness.** The sorted order groups the cows by total. The first group is the minimum, and the second group is exactly the set of cows with the second-smallest total. The group has one member exactly when the answer is a single cow.

**Complexity.** $O(n + 7 \log 7)$ time and $O(1)$ space, since the number of cows is fixed.

**Common wrong approach.** Sorting only by total and reporting the first cow of the second group. When two cows tie, the statement asks for `Tie`, not for the alphabetically first cow.

## Practice progression

1. **Recognition.** Given a statement, underline the key phrases and write the priority table. Decide whether the order is lexicographic or an optimization.
2. **Direct application.** Implement the composite comparator for `a` ascending, `b` descending, `c` ascending, and check it against the naive selection on random small inputs.
3. **Adaptation.** Implement the same order with stable passes, then reverse the pass order deliberately and observe the wrong answer. The wrong version is worth writing once.
4. **Tie-breaking.** Add the input index as a final key and verify that the output is deterministic when all stated keys are equal.
5. **Computed keys.** Solve a ranking problem whose first key is a fraction, using cross multiplication, and compare against a `double` version on adversarial inputs.
6. **Combination.** Use multi-key sorting as the preprocessing step of a sweep: sort events by position, then by type, then by index, and check that the sweep's invariants depend on the tie-break.
7. **Transfer.** Recognize the same order in a problem that never says "sort": grouping records by one field and ordering each group by another is the same nested-group picture.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Which key decides the order when two records differ on it, and when is the next key consulted? (At a glance)
2. Why is the greedy choice of the minimum remaining record forced rather than merely optimal? (Correctness proof)
3. Why must the stable passes run from the least significant key to the most significant one? (Key insight)
4. What property must a sort have for the pass version to be correct, and why? (Formal model)
5. Why is negating a key a poor way to implement descending order? (Common mistakes)
6. What does the composite comparator return for two records that agree on all three keys, and what does that mean for the output? (Formal model)
7. What is the time bound with one comparator, and what is it with $k$ stable passes? (Complexity analysis)
8. When is the pass version faster than the composite comparator? (Complexity analysis)
9. Why can a `double` not be used to compare two fractions near $10^9$? (Algorithm selection)
10. What happens when a Java comparator is not transitive? (Algorithm selection)
11. In the rank-list problem, why does the tie group form a contiguous block after sorting? (Worked problems)
12. In the second-smallest problem, why does the algorithm print `Tie` instead of the alphabetically first tied cow? (Worked problems)

## Further reading

- The greedy technique that sorts intervals by one key and then sweeps is [interval scheduling](/algorithms/greedy/interval-scheduling).
- The two-pointer scan that consumes an order produced by this technique is [two pointers](/algorithms/searching/two-pointers).
- The search that finds a boundary in a sorted array is [binary search](/algorithms/searching/binary-search).
- The underlying comparison sort is developed in [sorting](/algorithms/foundations/sorting).
- The growth rates used in the complexity section are in [complexity](/algorithms/foundations/complexity).
