---
id: range-queries.segment-tree
title: Segment tree
summary: A binary tree over the array caches the total of every range in a node, so a point assignment and an inclusive range sum both cost logarithmic time.
division: [gold, platinum]
subjects: [range-queries]
level: intermediate
importance: common-contest-technique
keywords: [segment tree, range tree, point update, range query, monoid, associative operation]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [range-queries.fenwick-tree, searching.binary-search]
complexity:
    time: "O(log n) per operation"
    space: "O(n)"
assumptions:
    - The combining operation is associative, which is what lets a node cache the result of merging its two children.
implementations: range-queries.segment-tree
visualization: range-queries.segment-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="range-queries.segment-tree" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="range-queries.segment-tree" />

A segment tree is a complete binary tree laid over the array. Every node covers one contiguous range of positions and stores the result of combining the values in that range. The root covers everything, its two children cover the two halves, and the leaves hold the values themselves.

The two operations are mirror images. An assignment walks down to a leaf and merges the two children on the way back up. A query walks down into the children that overlap the range and merges the sums of the nodes that are fully covered. Both walks have length $O(\log n)$, and both merge $O(\log n)$ cached values.

The price of that generality is a requirement on the combining operation. The operation must be _associative_, so that the value of a range does not depend on how the tree happens to split it, and it must have an _identity_, so that a range that is empty, or a subtree that does not overlap the query, can be merged in without changing the result. Together those two properties make the operation a monoid, and the monoid framing is what separates a segment tree from a [Fenwick tree](/algorithms/range-queries/fenwick-tree), which needs an inverse as well.

## Problem motivation

A weather station records the depth of the water in a canal once an hour. A flood analyst asks, many times, "what was the highest level between hour $l$ and hour $r$?" and occasionally "the reading at hour $i$ was faulty, set it to $v$".

The constraints are the whole problem.

- $1 \le n \le 200\,000$ hours.
- $1 \le q \le 200\,000$ operations, each one an assignment or a query.
- $-10^9 \le a_i \le 10^9$, so a sum can reach $2 \cdot 10^{14}$ in magnitude.

Scanning the range for every query costs $O(nq) = 4 \cdot 10^{10}$ comparisons. Prefix sums reduce the query to $O(1)$, but the assignment then costs $O(n)$: the reading at hour $i$ appears in every prefix from $i$ onward, so all of them have to be repaired.

The statement asks for a _maximum_, not a sum. That detail decides the structure. A maximum cannot be taken apart again, so the prefix trick of the [Fenwick tree](/algorithms/range-queries/fenwick-tree) does not apply, and the segment tree is the answer.

## Recognition patterns

A segment tree is the right tool when all of the following hold.

- The operations are **point updates** and **range queries**, in any mix.
- The quantity is combined by an operation that is **associative**, so that the value of a range does not depend on the order of the pieces.
- The quantity is not additive, so that no cheaper structure applies.
- You want **one structure** that handles many different quantities without rewriting it.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The quantity is a sum and nothing changes | Prefix sums are simpler and use less memory |
| The quantity is a sum and there are updates | A Fenwick tree is smaller and simpler than a segment tree |
| The quantity is a maximum, a minimum, a gcd, or a product | A Fenwick tree is ruled out; a segment tree applies |
| Updates are range updates rather than point updates | The tree needs lazy propagation, which is a different technique |
| $q = 1$ | A single scan is enough |
| $n \ge 10^6$ | The tree costs $4n$ entries, so 32 MB at 64 bits each; check the limit |

The phrases in a statement that signal this technique are "assign the value at position $i$", "the maximum element between $l$ and $r$", and "the gcd of the elements in the range". The phrase that rules it out is "the array does not change", because a static array has better tools.

<Synonyms terms="segment tree, range tree, range query tree, sparse tree" />

## Naive approach

The baseline is a linear scan of the range for every query, with a direct write for every assignment.

```cpp
long long rangeMax(const std::vector<long long>& a, int left, int right) {
    long long best = a[left];
    for (int i = left + 1; i <= right; ++i) {
        if (a[i] > best) {
            best = a[i];
        }
    }
    return best;
}
```

This is $O(n)$ per query and $O(1)$ per assignment. It is correct for any array, and it is the reference implementation for the differential test.

The second baseline is a segment tree that answers range sums, which is exactly the [Fenwick tree](/algorithms/range-queries/fenwick-tree) problem. It is included here because the difference between the two structures is one requirement, and the difference between the two reference implementations is one line.

The third baseline is a **sorted** copy of the array with the updates buffered, answered with a binary search. It is $O(q \log q)$ overall when every update is known in advance, and it is the right answer for an offline problem whose queries never interleave with its updates. It is not an answer for an online problem.

## Key insight

The insight is that the tree can cache the answer for _every_ range, not just for the whole array, and that the cache is consistent because the combining operation is associative.

Formally, let the combining operation be $\star$. The tree stores, at the node that covers the range $[l, r]$, the value

$$
\text{tree}[v] \;=\; a_l \star a_{l+1} \star \cdots \star a_r.
$$

The parent of the node covering $[l, m]$ and the node covering $[m+1, r]$ holds

$$
\text{tree}[v] \;=\; \text{tree}[\text{left}] \star \text{tree}[\text{right}],
$$

and a leaf holds its own value. The recursion is the whole definition, and the tree is built once in $O(n)$.

The reason the cached value is _usable_ is associativity. If $\star$ were not associative, then $a \star (b \star c)$ and $(a \star b) \star c$ would be different numbers, and the tree's answer for a range would depend on which of the two groupings its layout happens to produce. The tree lays out the range $[1,4]$ as $(a_1 \star a_2) \star (a_3 \star a_4)$, but a query for $[1,3]$ assembles $(a_1 \star a_2) \star a_3$ and a query for $[2,4]$ assembles $a_2 \star (a_3 \star a_4)$. For the answer to be a function of the range alone, and not of the layout, the grouping must not matter. That is precisely what associativity gives.

The second half of the requirement is the identity element $e$, which satisfies $e \star x = x$ and $x \star e = x$ for every $x$. It is needed because the query walks into children that may not overlap the range at all, and the result of such a child has to be merged in without changing the answer. The merge of a real piece with an empty piece must be the real piece, and that is exactly what the identity guarantees.

## Visual intuition

Draw the tree with the array written along the bottom, one value per leaf, and each internal node showing the merged value of its two children.

The picture makes the query obvious. A query for $[l, r]$ paints the intervals it covers, and the covered intervals come in two shapes: whole nodes, which are read straight from the cache, and partial nodes, which are split. A query descends only into the children that overlap the range, and the number of nodes it visits is proportional to the number of boundaries between the leaves, which is $O(\log n)$.

The picture also makes the update obvious. An assignment changes one leaf, and the only nodes whose cached value can change are the ones on the path from that leaf to the root. That path has length $O(\log n)$, and every other node still holds the correct value because its range does not contain the changed position.

The laboratory below draws the tree and highlights the nodes the current operation touches.

<AlgorithmPlayer algorithm="range-queries.segment-tree" />

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, indexed from one.

::: math definition Definition
A **monoid** is a set $S$ together with a binary operation $\star$ and an
element $e \in S$ such that

- $\star$ is **associative**: $(x \star y) \star z = x \star (y \star z)$ for every $x, y, z \in S$;
- $e$ is the **identity**: $e \star x = x$ and $x \star e = x$ for every $x \in S$.
:::


::: math definition Definition
The **aggregate** of a range $[l, r]$ under $\star$ is
$A(l, r) = a_l \star a_{l+1} \star \cdots \star a_r$, with
$A(l, r) = e$ when $l > r$.
:::


::: math definition Definition
A **segment tree** over $a$ is a complete binary tree in which each node
$v$ covers a contiguous range $R(v)$ and stores
$\text{tree}[v] = A(R(v))$. A node covering $[l, r]$ has two children
covering $[l, m]$ and $[m+1, r]$ for some $m$, and the leaves cover single
positions.
:::


::: math lemma Lemma
If $\star$ is associative and $e$ is its identity, then the aggregate of a
range does not depend on how the range is partitioned into contiguous
pieces. In particular, if $[l, r]$ is partitioned into $[l_1, r_1],
[l_2, r_2], \ldots, [l_k, r_k]$ in order, then

$$
A(l, r) \;=\; A(l_1, r_1) \star A(l_2, r_2) \star \cdots \star A(l_k, r_k).
$$
:::


::: math lemma Lemma
A segment tree over $n$ positions has $O(n)$ nodes, and the depth of the
tree is $\lceil \log_2 n \rceil$.
:::


::: math lemma Lemma
Let $m$ be the number of positions of the range whose boundaries fall
strictly inside a node's range. A range query visits at most
$2 \lceil \log_2 n \rceil$ partial nodes and at most
$2 \lceil \log_2 n \rceil + 1$ whole nodes.
:::


## Algorithm derivation

The state is the tree of $2n - 1$ nodes, or the array of $4n + 4$ entries that the reference implementation uses to store it.

The build rule: at a leaf covering $[i, i]$, store $a_i$. At an internal node covering $[l, r]$, store the merge of its two children.

The assignment rule: descend to the leaf covering the position, write the new value there, and merge the two children on the way back up. Only the ancestors of the leaf change, because only they cover the position.

The query rule, at a node covering $[l, r]$:

1. If the node's range and the queried range are disjoint, return the identity $e$.
2. If the node's range is entirely inside the queried range, return the cached value.
3. Otherwise split the node into its two children, query each, and merge the two results.

The third case is where associativity is used. The two children return the aggregates of the parts of the queried range that fall inside them, and merging those two aggregates gives the aggregate of the whole range, because the children cover consecutive pieces and the merge of consecutive pieces is the aggregate of their union.

::: math invariant Invariant
After the build, and after every assignment, each node $v$ stores
$\text{tree}[v] = A(R(v))$ for its range $R(v)$.
:::


### The identity element in practice

The identity is a property of the operation, not of the array. For a sum it is $0$. For a maximum it is a value smaller than every element, which is written as a sentinel such as `numeric_limits<long long>::lowest()`. For a product it is $1$. For a gcd it is $0$, because $\gcd(0, x) = x$.

Choosing $0$ as the identity of a maximum is the classic mistake, and it is caught by a single negative element.

## Step-by-step execution

Take the array $a = [1, 2, 3, 4, 5]$ and the segment tree over it. The root covers $[1,5]$ and splits at $m = 3$. The node over $[1,3]$ splits at $m = 2$, and the node over $[4,5]$ splits at $m = 4$.

The cached values are:

| Node | Range   | Value |
| ---- | ------- | ----- |
| 1    | $[1,5]$ | 15    |
| 2    | $[1,3]$ | 6     |
| 3    | $[4,5]$ | 9     |
| 4    | $[1,2]$ | 3     |
| 5    | $[3,3]$ | 3     |
| 8    | $[1,1]$ | 1     |
| 9    | $[2,2]$ | 2     |

Now query the range $[2,4]$.

1. The root covers $[1,5]$. It overlaps and is not covered, so it splits.
2. The left child covers $[1,3]$. It overlaps and is not covered, so it splits.
3. The node over $[1,2]$ overlaps and is not covered, so it splits into the leaf $[1,1]$, which is disjoint and returns $0$, and the leaf $[2,2]$, which is fully covered and returns $2$. The merge is $0 + 2 = 2$.
4. The leaf $[3,3]$ is fully covered and returns $3$. The merge of the two children of the node over $[1,3]$ is $2 + 3 = 5$.
5. The right child covers $[4,5]$. It overlaps and is not covered, so it splits into the leaf $[4,4]$, which is fully covered and returns $4$, and the leaf $[5,5]$, which is disjoint and returns $0$. The merge is $4 + 0 = 4$.
6. The merge of the root's two children is $5 + 4 = 9$.

The answer is $9$, which is $2 + 3 + 4$. Six nodes were visited, and the answer is the sum of three cached values plus three identities.

Now assign $a_3 = 30$. The descent reaches the leaf over $[3,3]$, which is node $5$, and writes $30$ there. The merge back up gives the node over $[1,3]$ the value $3 + 30 = 33$, and the root the value $33 + 9 = 42$. Every other node is untouched, and every one of them still holds the correct value for its range.

## Correctness proof

::: math theorem Theorem
The segment tree maintains the invariant that every node stores the
aggregate of its range, and every range query returns the aggregate of the
requested range.
:::


::: math proof Proof
First the invariant after the build. The claim is by induction on the
height of the node. At a leaf covering $[i, i]$, the build stores $a_i$,
which is the aggregate of a single-element range. At an internal node
covering $[l, r]$ with children covering $[l, m]$ and $[m+1, r]$, the
induction hypothesis says that the children hold $A(l, m)$ and $A(m+1, r)$.
By associativity and the identity, their merge is
$A(l, m) \star A(m+1, r) = A(l, r)$, which is what the build stores.

Next the invariant after an assignment at position $i$. Only the ancestors of the leaf covering $i$ cover $i$, so only their cached values can change, and the assignment rewrites exactly those, each as the merge of its two children. The children of every rewritten node are already correct, by induction from the leaf upwards, so the merge is correct by the same argument as in the build. Every other node covers a range that does not contain $i$, so its cached value is unaffected and still correct.

Finally the query. At a node whose range is disjoint from the queried range, the algorithm returns the identity $e$, and $e \star x = x$, so the empty contribution changes nothing. At a node whose range is inside the queried range, the algorithm returns the cached value, which is the aggregate of that range by the invariant. At a node that straddles the boundary, the algorithm queries both children and merges the results. By the induction hypothesis, each child returns the aggregate of the part of the queried range that lies inside it, and by the lemma, the merge of those two consecutive pieces is the aggregate of the whole of the node's part of the queried range. The root's part is the whole queried range, so the returned value is its aggregate. $\square$
:::


::: math proof Proof
The number of nodes a query visits is $O(\log n)$. Only the nodes that
straddle a boundary of the queried range can be partial, and a range has
at most two boundaries per level of the tree. Each partial node spawns two
children, so the number of visited nodes is $O(\log n)$. The nodes that
are fully covered are the children of the partial ones, so there are also
$O(\log n)$ of them.
:::


## Complexity analysis

**Building: $O(n)$.** Every node is visited once and does constant work.

**Each assignment: $O(\log n)$.** The descent and the ascent each have length equal to the depth of the tree.

**Each query: $O(\log n)$.** By the lemma above, the query visits $O(\log n)$ nodes and merges $O(\log n)$ cached values.

**Space: $O(n)$.** A complete binary tree over $n$ leaves has $2n - 1$ nodes, and the reference implementation stores them in an array of $4n + 4$ entries, which is the standard safe bound for the $2v$ and $2v + 1$ indexing. With 64-bit entries that is $32n$ bytes, so $6.4$ MB at $n = 200\,000$.

::: math complexity Complexity
Segment tree over $n$ values: $O(n)$ to build, $O(\log n)$ per assignment,
$O(\log n)$ per range query, and $O(n)$ extra space.
:::


The width of the accumulator is part of the complexity statement. With $n = 200\,000$ values of magnitude up to $10^9$, a sum can reach $2 \cdot 10^{14}$, which does not fit in a 32-bit signed integer. The reference implementations use a 64-bit type.

## Algorithm selection

| Situation                                                 | What to use       |
| --------------------------------------------------------- | ----------------- |
| Static array, many range-sum queries                      | Prefix sums       |
| Static array, range minimum or maximum                    | Sparse table      |
| Point updates and range sums                              | Fenwick tree      |
| Point updates and range minima, maxima, gcds, or products | Segment tree      |
| Range updates and point queries                           | Difference array  |
| Range updates and range sums                              | Lazy segment tree |
| Range updates and range minima                            | Lazy segment tree |
| A static array with a single query                        | A single scan     |

The fourth row is the one this article exists for. The decision hinges on one property of the operation: whether it is invertible. A sum is invertible, so the Fenwick tree answers it with less memory and simpler code. A maximum is not, so the segment tree is the answer.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source.

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes two variants. The `minimal` variant is a reusable class with a constructor that builds the tree from an array of values, a `set` that assigns a position, and a `range_sum` that answers an inclusive range. The `program` variant reads `n q` and then $q$ operations, where `1 i v` assigns a value and `2 l r` prints the range sum. Every position starts at zero, because the input carries no initial values.

The assignment in the reference implementation replaces the value. A version that adds a delta to a position is the same code with `+=` in place of `=`, and it is the version the [Fenwick tree](/algorithms/range-queries/fenwick-tree) needs.

## Recursion decision

The segment tree is recursive by nature, and it is one of the rare algorithms where recursion is the right answer in every language. The depth of the recursion is the depth of the tree, which is $\lceil \log_2 n \rceil$: twenty frames for a million positions.

| Language | Default stack | Depth needed | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Recursive is safe; the depth is logarithmic |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Recursive is safe |
| Python | Interpreter limit of 1000 | 1000 frames | Recursive is safe, and the limit is never approached |
| Pascal | The operating system stack | Depends on the platform | Recursive is safe |
| JavaScript | The V8 engine limit | About $10^4$ frames | Recursive is safe |

The reason is the shape of the recursion. Each level halves the range, so the recursion depth is the number of bits in $n$, not the number of elements. Even $n = 10^{18}$ would need sixty frames.

The rule of thumb from the depth-first article is inverted here: when a recursion's depth is logarithmic in the size of the input, it is safe. The danger is a recursion whose depth is linear in the size of the input, and that is the shape to look for in the code you did not write.

## Implementation walkthrough

The layout of the tree in memory is the first decision. The reference implementation stores the node covering $[l, r]$ at the index `node`, its left child at `node * 2` and its right child at `node * 2 + 1`, in an array of `4 * n + 4` entries. The bound is safe because the largest index reached by a tree with $n$ leaves is less than $4n$.

The three cases of the query are the second decision, and the order of the tests matters:

```cpp
if (right < lo || hi < left) {
    return 0;                       // the identity of addition
}
if (left <= lo && hi <= right) {
    return tree[node];              // the cached value
}
```

The disjointness test comes first. If the containment test came first, a node that is disjoint from the range would fall through to the split and recurse forever, because a disjoint node is never contained in the range and the range is never contained in a disjoint node.

The merge of the two children comes last, and the order of the merge is the order of the ranges:

```cpp
return query(node * 2, lo, mid, left, right) +
       query(node * 2 + 1, mid + 1, hi, left, right);
```

The left child is merged first because it covers the earlier positions. For an operation that is not commutative, such as string concatenation or matrix multiplication, swapping the two terms produces a wrong answer without any error message.

The third decision is the width of the accumulator and the width of the identity. For a sum the identity is the integer $0$, which is exact. For a maximum the identity has to be smaller than every element that can occur, and the reference implementation for a sum does not have that problem because $0$ is an exact identity for addition.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using $0$ as the identity of a maximum | Any range with only negative values answers $0$ | Use a sentinel smaller than every value |
| Testing containment before disjointness | The query recurses forever | Test disjointness first |
| Swapping the two children in the merge | Wrong answers for a non-commutative operation | Merge in position order |
| Forgetting to merge on the way back up from an assignment | Every ancestor keeps a stale value | Merge at every node on the path |
| Sizing the array to $2n$ | The largest index is written out of bounds | Use $4n + 4$ |
| Treating the array as 0-indexed in one place and 1-indexed in another | Every answer is shifted | Fix the convention and write it in a comment |
| Using a 32-bit accumulator | Large sums are silently wrong | Use a 64-bit type |
| Assuming the operation may be non-associative | The answer depends on the layout of the tree | Require a monoid |
| Using a segment tree when the array never changes | More memory and more code for no benefit | Use prefix sums or a sparse table |

### Why this fails: the merge that depends on the grouping

The mistake that survives review most often is assuming that any binary operation can be merged, because the merge _looks_ like addition.

Associativity is what makes the cached value trustworthy, and without it the tree reports a number that depends on the shape of the tree rather than only on the range.

Take four values as IEEE 754 doubles: $a = [10^{16},\; 1,\; -10^{16},\; 1]$. The exact sum is $2$, but doubles cannot represent $10^{16} + 1$, so the rounding decides the answer.

The tree over $[1,4]$ groups the values in pairs:

$$
\text{tree}[1,2] = 10^{16} + 1 = 10^{16}, \qquad
\text{tree}[3,4] = -10^{16} + 1 = -10^{16},
$$

and then merges them:

$$
\text{tree}[1,4] = 10^{16} + (-10^{16}) = 0.
$$

A sequential accumulation over the same four values gives a different answer:

$$
((10^{16} + 1) + (-10^{16})) + 1 \;=\; 0 + 1 \;=\; 1.
$$

So the tree reports $0$ for the whole array and a sequential sum reports $1$, for the same four numbers. The tree is not buggy; it has faithfully computed its own grouping, and that grouping is not the grouping the reader had in mind. The same disagreement appears inside the tree: the query for $[1,3]$ returns $10^{16} + (-10^{16}) = 0$, while the query for $[2,4]$ returns $1 + (-10^{16} + 1) = -10^{16}$. Three different answers for three overlapping ranges of the same four numbers.

Four values is the smallest counterexample. With three values there is only one binary grouping available to a tree that splits at the midpoint, and the tree and a sequential fold agree. The moment the tree can group two pairs against each other, the disagreement appears.

The generalization is a condition on the whole technique: **the combining operation must be associative, so that the value of a range is a function of the range and not of the layout.** Integer addition, multiplication, minimum, maximum, gcd, lcm, and matrix multiplication are all associative and all work. Subtraction and division are not, and a segment tree over subtraction computes a left-to-right fold whose value depends on the tree's shape, which is a strange thing for a data structure to do.

There is a second failure with the same root, and its counterexample is smaller still: the wrong identity element. Take the array $a = [-5]$ and the query $[1,1]$. The correct maximum is $-5$. But a tree that merges with the identity $0$ computes $\max(0, -5) = 0$, because the disjoint child contributes the identity and the identity is not smaller than the value. One element is the smallest possible counterexample, and it is the reason the identity for a maximum has to be a sentinel rather than a number that happens to be zero.

## Variants and extensions

- **Lazy propagation.** When an update covers a whole range, the update is recorded at the node and pushed to the children only when a query needs them. This turns range updates into $O(\log n)$ operations.
- **Iterative segment tree.** A bottom-up version stores the leaves in a power-of-two array and answers queries with two indices walking toward each other. It is faster in practice and uses no recursion, and it needs care with the merge order for a non-commutative operation.
- **A segment tree over a different axis.** The same structure over the rows of a matrix answers rectangle queries, at a cost of $O(\log n \log m)$ per rectangle.
- **Point set, point change, and point add.** Three variants of the update that differ in one line: write, add, or set to a fixed value.
- **The maximum subarray segment tree.** Four values are cached per node, namely the total, the best prefix, the best suffix, and the best subarray, and the merge is a case analysis.
- **A merge-sort tree.** Each node stores the sorted list of its range, and a query counts the elements below a threshold by binary search in each visited node.
- **A persistent segment tree.** Every version keeps its own root, so old versions of the array remain queryable.
- **A Fenwick tree of segment trees**, for offline two-dimensional queries.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the operation and check its three properties: is it associative, does it have an identity, and is it commutative? The answers decide the structure, the sentinel, and the merge order.
2. Fix the indexing convention and write it in a comment.
3. Decide the identity before writing the query. For a maximum it is a sentinel, and the sentinel must be smaller than every value.
4. Test the four cases explicitly: an assignment at the first position, at the last position, a query of the whole array, and a query of a single element.
5. Check the accumulator width against the constraints.
6. Write the naive scan and keep it as a reference. A disagreement on a random input is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the canal levels

**Restatement.** An array of $n$ water levels is given. Each operation either assigns a value to a position or reports the maximum over an inclusive range. Constraints: $1 \le n \le 200\,000$, $1 \le q \le 200\,000$, and $-10^9 \le a_i \le 10^9$.

**Naive baseline.** Scan the range for every query, at a cost of $O(nq)$.

**Insight.** A maximum cannot be inverted, so no prefix trick applies. The segment tree caches the maximum of every range and merges two maxima into their maximum, which is associative and has the identity $-\infty$.

**Derivation.** Build the tree with the merge $\max$. On an assignment, descend to the leaf and merge the maxima on the way back up. On a query, return the sentinel for a disjoint node, the cached value for a covered node, and the maximum of the two children otherwise.

**Correctness.** The invariant proof applies to any monoid, and the maximum with the sentinel $-\infty$ is a monoid.

**Complexity.** $O(\log n)$ per operation and $O(n)$ space.

**Common wrong approach.** Merging with $0$ as the identity, which reports $0$ for any range of negative values.

### Problem 2: the number of distinct values in a range

**Restatement.** An array of $n$ values is given. Each operation either assigns a value to a position or reports the number of distinct values in an inclusive range. Constraints: $1 \le n \le 100\,000$ and $1 \le q \le 100\,000$.

**Naive baseline.** Copy the range into a set and count it, at a cost of $O(n \log n)$ per query.

**Insight.** The count of distinct values is not additive, so it does not merge. It is however the difference of two _counts of occurrences_, and the standard technique is to answer offline with the last occurrence of each value, using a Fenwick tree over the positions.

**Derivation.** Sort the queries by their right end. Sweep the array from left to right and keep, for each value, the position of its most recent occurrence. The distinct count of $[l, r]$ is then the number of values whose most recent occurrence is at or after $l$, which is the number of marked positions in $[l, r]$. A Fenwick tree over the positions holds a $1$ at each most recent occurrence and a $0$ elsewhere, so the count is a range sum. When a value arrives, its previous occurrence is unmarked and the new one is marked.

**Correctness.** A value occurs in $[l, r]$ exactly when its most recent occurrence up to $r$ is at or after $l$, so the marked positions in $[l, r]$ are in bijection with the distinct values of the range.

**Complexity.** $O((n + q) \log n)$ time overall, after sorting, and $O(n)$ space.

**Common wrong approach.** Trying to merge distinct counts at a node, which is not a well-defined operation and produces a number that is neither the count of the range nor any function of it.

### Problem 3: the largest gap between consecutive values

**Restatement.** An array of $n$ distinct values is given, sorted increasingly. Report the largest difference between two consecutive elements. Constraints: $1 \le n \le 200\,000$, and the values are given in sorted order.

**Naive baseline.** Scan the array once, at a cost of $O(n)$, which is already optimal.

**Insight.** The array never changes, so a tree is not needed at all. The question is a single scan, and the right answer is to say so.

**Derivation.** Keep the previous value and the largest gap seen so far. Compare the current value with the previous one and update the answer.

**Correctness.** Every consecutive pair is examined exactly once, and the running maximum of their differences is the largest gap.

**Complexity.** $O(n)$ time and $O(1)$ extra space.

**Common wrong approach.** Building a segment tree for it. The structure is correct and it will pass, but it spends $O(n)$ memory and $O(n)$ time to compute an answer that a single pass finds for free. Recognizing when not to use a data structure is part of the skill.

## Practice progression

1. **Recognition.** Given a statement, decide whether a segment tree applies. Look for point updates mixed with range queries, and check the operation for associativity and an identity.
2. **Direct application.** Implement the tree, the assignment, and the query, and verify against a brute-force scan on small random arrays.
3. **Adaptation.** Change the merge to a maximum, a gcd, and a string concatenation, and change the update from an assignment to an addition.
4. **Combination.** Use a segment tree for the maximum subarray problem, where four values are cached per node, and use a merge-sort tree to count the elements below a threshold.
5. **Challenge.** Solve a problem with range updates mixed in, and add the lazy propagation that makes the tree handle them.
6. **Transfer.** Use the structure for something that is not a range query at all: a binary search over a monotone function, a tournament bracket, or the merge step of a merge sort, which is the same tree in a different costume.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does a node of a segment tree store, and what does it store when the range is empty? (Formal model)
2. Why must the combining operation be associative, and what exactly goes wrong without it? (Why this fails)
3. What is the identity element for a sum, for a maximum, and for a product? (Algorithm derivation)
4. Which test comes first in the query, and what happens if the order is reversed? (Implementation walkthrough)
5. State the invariant and say which part of the proof uses it. (Correctness proof)
6. Why is the recursion depth of a segment tree safe in every language, while a depth-first search on a long chain is not? (Recursion decision)
7. Give a one-element array for which the wrong identity element gives a wrong answer. (Why this fails)
8. When is a Fenwick tree the better tool, and what property of the operation decides it? (Algorithm selection)
9. How many nodes does a range query visit, and why? (Complexity analysis)
10. Why does the merge order matter for a non-commutative operation? (Implementation walkthrough)

## Further reading

- The structure that answers the same questions with less memory, when the operation is invertible, is the [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The static version, which trades updates for constant time queries, is the [sparse table](/algorithms/range-queries/sparse-table).
- The technique that answers a range sum in constant time when nothing changes is [prefix sums](/algorithms/arrays/prefix-sums).
- The tree decomposition that puts a tree into chains and answers path queries in logarithmic time is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition), which uses a segment tree over the flattened array.
- Every listing in this article, in all six languages, is published in the reference implementations of this repository, in six languages each.
