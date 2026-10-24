---
id: range-queries.lazy-propagation
title: Lazy propagation
summary: Record a range update at a segment tree node and defer it to the children until a query actually needs them, so a range addition and a range sum both cost logarithmic time.
division: [gold, platinum]
subjects: [range-queries]
level: advanced
importance: common-contest-technique
keywords:
    [
        lazy propagation,
        lazy segment tree,
        range update,
        range add,
        range assign,
        deferred update,
        push down,
    ]
prerequisites:
    required: [range-queries.segment-tree, arrays.prefix-sums, foundations.complexity]
    recommended: [range-queries.fenwick-tree, arrays.difference-arrays]
complexity:
    time: "O(log n) per range update and per range query"
    space: "O(n)"
assumptions:
    - The query aggregate is associative and has an identity, so a node can cache the aggregate of its range.
    - A pending update can be applied to a whole node in constant time and composed with another pending update in constant time.
implementations: range-queries.lazy-propagation
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="range-queries.lazy-propagation" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="range-queries.lazy-propagation" />

A lazy segment tree is an ordinary [segment tree](/algorithms/range-queries/segment-tree) with one extra array. The tree stores the aggregate of every node, as before, and the extra array stores, at a node, an update that has already been applied to that node but not yet to its children.

The update is _deferred_ rather than performed. When a range update covers a node completely, the tree changes the node's cached aggregate and records the same change in the node's tag. It does not descend. The children keep their old values, which are now stale by exactly the amount in the tag. When a later operation has to look inside that node, it first pushes the tag to the two children, clears it, and only then descends.

That single postponement is what turns a range update from $O(n)$ into $O(\log n)$. A range is covered by $O(\log n)$ canonical nodes, and the update stops at each of them. The tags are the bookkeeping that lets the children catch up later.

The technique is not specific to sums. It works for any aggregate that an ordinary segment tree supports, provided the update can be applied to a whole node in constant time and two pending updates can be composed into one. Addition qualifies. Assignment qualifies. Addition followed by assignment qualifies with a two-part tag. A range update such as "replace every value by the smaller of its current value and $x$" does not qualify without a different structure.

## Problem motivation

A toll road has $n$ stations in a row, and every station counts the trucks that pass through it. Two kinds of instructions arrive during the day: "trucks will pass every station from $l$ to $r$, so add one to each of those counters", and "how many trucks passed stations $l$ through $r$ in total?"

The constraints are the whole problem.

- $1 \le n \le 200\,000$ stations.
- $1 \le q \le 200\,000$ instructions, each one an update or a query.
- The counters are nonnegative, and every answer fits in a signed 64-bit integer.

Adding one counter at a time for every instruction costs $O(nq)$, which is $4 \cdot 10^{10}$ increments. A [difference array](/algorithms/arrays/difference-arrays) makes the update $O(1)$ but makes the query $O(n)$. A [Fenwick tree](/algorithms/range-queries/fenwick-tree) with point updates gives $O(\log n)$ for both, but the update here is a range update: applying it as $n$ separate point updates restores the $O(n)$ cost.

An ordinary segment tree does not help by itself. Its update is a point assignment or a point addition: it descends to one leaf, changes it, and repairs the ancestors. A range update that follows the same rule must descend to every leaf in the range, which is again $O(n)$ work per instruction.

What is missing is permission to leave a node's children stale. The tree already caches the answer for the node. If the update covers the node, the cached answer can be corrected immediately with one multiplication, and the children can be repaired only when someone asks for them. That is the entire idea, and the rest of the technique is making the repair correct and cheap.

## Recognition patterns

Lazy propagation is the right tool when all of the following hold.

- The updates act on **whole ranges**, and the same update is applied to every element of the range.
- The queries ask for an **aggregate over a range**, and the aggregate is associative with an identity.
- The update can be **applied to a node in constant time** from the node's length and the aggregate, without looking at the individual values.
- The update can be **composed with another pending update** in constant time, so that a tag never grows into a list.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Range updates and range sums, and the operation is addition | A lazy segment tree works, but two Fenwick trees are smaller and faster |
| Range updates and range minima, maxima, or counts | A lazy segment tree is the standard answer |
| Range assignments and range sums | A lazy segment tree with an assignment tag |
| Range updates and point queries only | A difference array or a Fenwick tree is simpler |
| The update depends on the individual values, such as "set each value to its minimum with $x$" | A plain lazy tag is not enough; use segment tree beats or another structure |
| The array never changes | Prefix sums or a sparse table answer faster |
| $n \le 10^3$ | A direct loop over the range is fast enough |

The phrases in a statement that signal this technique are "add $v$ to every element from $l$ to $r$", "set every element in the range to $v$", and "report the sum, minimum, or maximum over the range". The phrase that rules it out is "set each element to the smaller of its current value and $v$", because the effect of that update on a node depends on which elements are already small.

<Synonyms terms="lazy propagation, lazy segment tree, deferred update, range add range sum, push-down tree" />

## Naive approach

The baseline is a direct loop for every range update, with a segment tree or a prefix sum table for the queries.

```cpp
void rangeAdd(std::vector<long long>& a, int left, int right, long long delta) {
    for (int i = left; i <= right; ++i) {
        a[i] += delta;
    }
}
```

This is $O(n)$ per update. With a prefix sum table rebuilt after every update, the query is $O(1)$ and the update is $O(n)$. With a Fenwick tree over the positions, both a point update and a range sum are $O(\log n)$, but the range update becomes $n$ point updates and costs $O(n \log n)$, which is worse than the direct loop.

The second baseline is a segment tree that descends to every leaf in the updated range. It visits $O(k \log n)$ nodes for a range of length $k$, and the worst case is $O(n)$ per update. It is correct, and it is the reference implementation for the differential test.

The third baseline is the one that matters for sums. Two Fenwick trees can support range addition and range sum in $O(\log n)$ per operation, by maintaining a difference array and a weighted difference array. That is a real alternative, and it is smaller than a lazy segment tree. It does not generalize to a maximum, a minimum, an assignment, or a count, which is why the lazy segment tree is still the technique worth learning.

The fourth baseline is an offline solution: read all the operations first, sort them, and sweep. It works when the statement allows it, and it is useless when the operations must be answered online.

## Key insight

The insight is that a node's cached aggregate and its children's cached aggregates are allowed to disagree, as long as the disagreement is recorded.

Take a node $v$ covering a range of length $\ell$. Suppose every element in that range is increased by $\delta$. The node's aggregate increases by $\delta \ast \ell$, which is one multiplication. The two children's aggregates also increase by $\delta$ times their lengths, but nobody has asked for them yet, so the tree can postpone that work.

The record of the postponement is the **tag**. After the update, the node holds

$$
\text{tree}[v] \;=\; \text{tree}[v] + \delta \ast \ell,
\qquad
\text{tag}[v] \;=\; \text{tag}[v] + \delta.
$$

The children are untouched. The tag says, in effect, "every element below this node still needs $\text{tag}[v]$ added to it".

When an operation has to descend into the node, it first **pushes** the tag:

$$
\text{tree}[c] \;=\; \text{tree}[c] + \text{tag}[v] \ast \ell_c
\quad\text{and}\quad
\text{tag}[c] \;=\; \text{tag}[c] + \text{tag}[v]
$$

for each child $c$, after which $\text{tag}[v] = 0$. Pushing preserves every element's true value: the child's aggregate gains exactly what the pending tag said it was missing.

The second half of the insight is **composition**. Two updates that land on the same node must not be stored as a list. For addition they collapse into one number, because adding $\delta_1$ and then $\delta_2$ is adding $\delta_1 + \delta_2$. For assignment they collapse into the later assignment, because the later one overwrites the earlier one. Constant-time composition is what keeps the tag $O(1)$ per node.

The worked array makes the bookkeeping concrete. Take

$$
a = [1,\; 2,\; 3,\; 4,\; 5,\; 6,\; 7,\; 8].
$$

Add $3$ to the range $[2, 6]$. The update stops at the node $[3,4]$ with tag $3$, at the node $[5,6]$ with tag $3$, and at the leaf $[2,2]$ with tag $3$. The root becomes $51$, which is the new total, but the leaves under $[3,4]$ and $[5,6]$ still hold their old values. The tags are the only evidence that the array changed.

## Visual intuition

Draw the segment tree with the array along the bottom. Under every node write two numbers: the cached aggregate and the tag. Initially every tag is zero.

A range update paints the canonical nodes that cover the range. At each painted node, the aggregate changes by the update applied to the whole node, and the tag grows by the update. The subtree below the painted node is not visited, so the picture below it looks exactly as it did before. That is the deferral: the paint stops at the node, and the tag is the wet paint that has not dried on the children.

A later query walks down from the root. Whenever it enters a node with a nonzero tag, it first paints the two children with the same tag and clears the parent's tag. The wet paint moves down one level. The query then continues into the children, which now hold correct values, and the parent is dry.

The picture also shows why the order of the two tests in the recursion matters. If the node is fully covered, the operation stops and never sees the tag. If the node is only partly covered, the operation must push before descending, because the children are exactly the part it is about to inspect.

The depth of the tree is logarithmic, so the paint moves down at most $\lceil \log_2 n \rceil$ levels during any one operation. A tag that is never pushed simply stays where it is until some query needs the subtree, which may be never.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, and let the segment tree over it be the usual complete binary tree in which each node $v$ covers a contiguous range $R(v)$.

::: math definition Definition
The **aggregate** of a range $[l, r]$ is $A(l, r) = a_l + a_{l+1} + \cdots + a_r$, with $A(l, r) = 0$ when $l > r$. The aggregate is the value the query returns.
:::

::: math definition Definition
A **tag** $\text{tag}[v]$ is a pending range addition at node $v$. It means that every element of $R(v)$ is to be increased by $\text{tag}[v]$, and that the increase has already been applied to $\text{tree}[v]$ but not to the descendants of $v$.
:::

::: math definition Definition
For a leaf $\ell$, the **effective value** is

$$
\operatorname{eff}(\ell) \;=\; \text{tree}[\ell] + \sum_{u \text{ strict ancestor of } \ell} \text{tag}[u].
$$

For an internal node $v$, the effective aggregate is $\operatorname{eff}(v) = \sum_{\ell \in R(v)} \operatorname{eff}(\ell)$.
:::

::: math lemma Lemma
For every node $v$, the effective aggregate satisfies

$$
\operatorname{eff}(v) \;=\; \text{tree}[v] + \bigl\lvert R(v) \bigr\rvert \ast \sum_{u \text{ strict ancestor of } v} \text{tag}[u].
$$
:::

::: math lemma Lemma
Applying $\delta$ at node $v$ and then applying $\epsilon$ at the same node is the same as applying $\delta + \epsilon$ once. The composition of two additions is their sum.
:::

::: math lemma Lemma
For an internal node $v$ whose children are $c_1$ and $c_2$,

$$
\text{tree}[v] \;=\; \text{tree}[c_1] + \text{tree}[c_2] + \text{tag}[v] \ast \bigl\lvert R(v) \bigr\rvert,
$$

and after a push of $v$ the same identity holds with $\text{tag}[v] = 0$.
:::

The invariant that the algorithm maintains is the first lemma together with the third. The first says that the effective values are always the true values of the array, no matter how many tags are waiting. The third says that the cached aggregates are internally consistent with the children once the node's own tag is accounted for.

## Algorithm derivation

The state is the tree of cached aggregates and the tag array, both of size $4n + 4$ for safety.

The **apply** rule for adding $\delta$ at a node covering $[lo, hi]$ is:

```text
apply(v, lo, hi, delta):
    tree[v] += delta * (hi - lo + 1)
    tag[v] += delta
```

It is constant time, and it is correct by the definition of a tag: the node's aggregate grows by $\delta$ for each of its elements, and the tag records that the children still owe the same increase.

The **push** rule is:

```text
push(v, lo, hi):
    if tag[v] == 0 or lo == hi: return
    mid = (lo + hi) / 2
    apply(2v, lo, mid, tag[v])
    apply(2v + 1, mid + 1, hi, tag[v])
    tag[v] = 0
```

The leaf guard is not an optimization. A leaf has no children, and applying the tag to indices $2v$ and $2v + 1$ would write outside the part of the array that belongs to the tree.

The **update** rule is:

```text
add(v, lo, hi, ql, qr, delta):
    if qr < lo or hi < ql: return
    if ql <= lo and hi <= qr:
        apply(v, lo, hi, delta)
        return
    push(v, lo, hi)
    mid = (lo + hi) / 2
    add(2v, lo, mid, ql, qr, delta)
    add(2v + 1, mid + 1, hi, ql, qr, delta)
    tree[v] = tree[2v] + tree[2v + 1]
```

The first test discards a disjoint node. The second test stops at a fully covered node, which is where the logarithm comes from. The third case is a partial overlap: the node's own tag is pushed so that the children become correct, the two children are updated, and the node is recomputed. The recomputation happens after the push, so $\text{tag}[v]$ is zero and the plain sum of the children is correct.

The **query** rule is the same shape:

```text
sum(v, lo, hi, ql, qr):
    if qr < lo or hi < ql: return 0
    if ql <= lo and hi <= qr: return tree[v]
    push(v, lo, hi)
    mid = (lo + hi) / 2
    return sum(2v, lo, mid, ql, qr) + sum(2v + 1, mid + 1, hi, ql, qr)
```

The query pushes for the same reason the update does. A fully covered node is returned without pushing, because its own aggregate already includes its own tag, and every tag above it was pushed on the way down. The children of that node may still be stale, but the query never reads them.

::: math invariant Invariant
At the moment the recursion enters a node $v$, every tag at a strict ancestor of $v$ has been pushed, so $\text{tree}[v]$ equals the true aggregate of $R(v)$. For every node, the identity of the third lemma holds between the node and its children.
:::

### Why the query has to push as well

It is tempting to push only during an update, on the grounds that a query does not change anything. That reasoning is wrong, and it is the most common way to write a tree that passes the first sample and fails the rest.

A query that descends into a node with a pending tag reads the children, and the children do not contain the tag. The query must push before it reads them, even though pushing mutates the tree. The mutation does not change any effective value; it only moves the pending update one level closer to the leaves. A query is allowed to do that.

A query that returns a fully covered node reads no children, so it does not need to push. Pushing there would be correct but wasted work. The rule is exactly: push when about to descend, never when about to return.

## Step-by-step execution

Use the array $a = [1, 2, 3, 4, 5, 6, 7, 8]$ and the tree over it. The initial cached aggregates are:

| Node  | Range   | Aggregate |
| ----- | ------- | --------- |
| root  | $[1,8]$ | 36        |
| left  | $[1,4]$ | 10        |
| right | $[5,8]$ | 26        |
|       | $[1,2]$ | 3         |
|       | $[3,4]$ | 7         |
|       | $[5,6]$ | 11        |
|       | $[7,8]$ | 15        |

Every tag starts at zero. Now add $3$ to the range $[2,6]$.

1. The root is partly covered, so it is not tagged. Its tag is zero, so the push does nothing, and the recursion descends into $[1,4]$ and $[5,8]$.
2. The node $[1,4]$ is partly covered. It descends into $[1,2]$ and $[3,4]$.
3. The node $[1,2]$ is partly covered. The leaf $[1,1]$ is disjoint. The leaf $[2,2]$ is fully covered, so its aggregate becomes $2 + 3 = 5$ and its tag becomes $3$.
4. The node $[1,2]$ is recomputed as $1 + 5 = 6$.
5. The node $[3,4]$ is fully covered, so its aggregate becomes $7 + 3 \ast 2 = 13$ and its tag becomes $3$. Its leaves are not touched.
6. The node $[1,4]$ is recomputed as $6 + 13 = 19$.
7. The node $[5,8]$ is partly covered. The node $[5,6]$ is fully covered, so its aggregate becomes $11 + 3 \ast 2 = 17$ and its tag becomes $3$. The node $[7,8]$ is disjoint.
8. The node $[5,8]$ is recomputed as $17 + 15 = 32$, and the root as $19 + 32 = 51$.

The true array after the update is $[1, 5, 6, 7, 8, 9, 7, 8]$, whose total is $51$. The leaves under $[3,4]$ still hold $3$ and $4$, and the leaves under $[5,6]$ still hold $5$ and $6$. The tags hold the difference.

Now query the range $[3,5]$.

1. The root is partly covered and has tag zero.
2. The node $[1,4]$ is partly covered. The node $[1,2]$ is disjoint. The node $[3,4]$ is fully covered, so the query returns $13$ without looking inside it.
3. The node $[5,8]$ is partly covered. The node $[5,6]$ is partly covered, so it pushes its tag $3$: the leaves become $8$ and $9$, and the tag of $[5,6]$ becomes zero. The leaf $[5,5]$ is fully covered and returns $8$. The leaf $[6,6]$ is disjoint.
4. The query returns $13 + 8 = 21$, which is $6 + 7 + 8$.

The push in step 3 changed the leaves and the tag, but not the answer to any question about the array. It only moved the pending update from the node to the leaves.

Now add $-2$ to the range $[4,8]$.

1. The root is partly covered. The node $[1,4]$ is partly covered. At $[3,4]$, the tag $3$ is pushed onto the leaves, which become $6$ and $7$, and the tag of $[3,4]$ becomes zero. The leaf $[4,4]$ is fully covered by the update, so it becomes $5$ and its tag becomes $1$. The node $[3,4]$ is recomputed as $6 + 5 = 11$.
2. The node $[5,8]$ is partly covered. The node $[5,6]$ is fully covered, so its aggregate becomes $17 - 2 \ast 2 = 13$ and its tag becomes $-2$. Its children are still $8$ and $9$.
3. The node $[7,8]$ is fully covered, so its aggregate becomes $15 - 2 \ast 2 = 11$ and its tag becomes $-2$. Its children are still $7$ and $8$.
4. The node $[5,8]$ is recomputed as $13 + 11 = 24$, the node $[1,4]$ is recomputed as $6 + 11 = 17$, and the root as $17 + 24 = 41$.

The true array is now $[1, 5, 6, 5, 6, 7, 5, 6]$, whose total is $41$. The final query of the whole array returns the root's aggregate $41$ immediately, without pushing any of the remaining tags. That is the payoff: an update that covered most of the array costs one multiplication and one tag addition at the nodes that were fully covered.

## Correctness proof

::: math theorem Theorem
If the invariant holds before an operation, then after any range addition or range query every effective value equals the corresponding value of the array, the query returns the aggregate of its range, and the invariant holds again.
:::

::: math proof Proof
The proof is an induction on the recursion. Consider an update that adds $\delta$ to $[ql, qr]$ at a node $v$ covering $[lo, hi]$, assuming the invariant holds at entry.

If $v$ is disjoint from the update, its subtree is unchanged, and the effective values in it are unchanged. If $v$ is fully covered, `apply` adds $\delta \ast (hi - lo + 1)$ to $\text{tree}[v]$ and $\delta$ to $\text{tag}[v]$. Every leaf in $R(v)$ gains exactly $\delta$: a leaf strictly below $v$ gains it from the new tag at $v$, and a leaf equal to $v$ gains it from $\text{tree}[v]$. Every leaf outside $R(v)$ has the same strict ancestors as before, so its effective value is unchanged. The identity between $v$ and its children still holds because $\text{tree}[v]$ and $\text{tag}[v]$ both grew by the matching amounts.

If $v$ is partly covered, `push` moves $\text{tag}[v]$ onto both children and clears it. For a leaf $\ell$ strictly below a child $c$, the strict ancestors before the push included $v$ with tag $\tau$, and after the push they include $c$ with tag increased by $\tau$ but not $v$; the sum of the tags on the strict path is unchanged. For the leaf that is $c$ itself, $\text{tree}[c]$ increased by $\tau$ while $v$'s tag disappeared, so its effective value is unchanged as well. The parent's identity still holds, now with $\text{tag}[v] = 0$. The recursion then updates the two children, and by the induction hypothesis each child's effective values are correct and its own invariant holds. The pull recomputes $\text{tree}[v]$ as the sum of the children, which is the correct aggregate because the tags above $v$ have already been pushed and the node's own tag is zero. This restores the invariant at $v$.

For a query, the argument is the same until a fully covered node is reached. At that node, every tag above the node has been pushed by the preceding steps, so by the invariant the node's aggregate is the true aggregate of its range. The disjoint case returns $0$, which is the identity of addition and changes no sum. The partial case pushes, recurses into both children, and adds the two results, which by the induction hypothesis are the aggregates of the two parts of the query range. Their sum is the aggregate of the whole range.

The recursion terminates because every call either returns or descends into a strictly smaller range, and the base cases are the leaves. $\square$
:::

::: math proof Proof
The push preserves the effective values by the path-sum argument above. The composition lemma holds because addition on the integers is associative: adding $\delta$ and then $\epsilon$ to a tag is the same as adding $\epsilon$ and then $\delta$, and both are the single addition of $\delta + \epsilon$. The third lemma is a direct calculation: for an internal node $v$ with children $c_1$ and $c_2$,

$$
\text{tree}[v] = \text{tree}[c_1] + \text{tree}[c_2] + \text{tag}[v] \ast \lvert R(v) \rvert
$$

holds after `apply`, because both sides grow by the same amount, and after `push`, because the tag term becomes zero and the children have absorbed the tag. $\square$
:::

## Complexity analysis

**Each range update: $O(\log n)$.** A range is decomposed into $O(\log n)$ canonical nodes. The recursion visits the two boundary paths, each of length $O(\log n)$, and stops at every canonical node. At each visited node the work is constant: one multiplication, one addition, and, on a partial node, one push. The push itself is constant because it touches two children.

**Each range query: $O(\log n)$.** The same decomposition applies, and the query merges the aggregates of $O(\log n)$ canonical nodes. Pushing during the descent is constant per visited node.

**Building the tree: $O(n)$.** A bottom-up build visits every node once. In the reference programs the array is all zero, so the build is just the allocation of zeroed arrays, which is still $O(n)$.

**Space: $O(n)$.** The tree and the tags each hold $4n + 4$ entries in the reference layout. With 64-bit entries that is $64n + 64$ bytes for the two arrays, so about $12.8$ MB at $n = 200\,000$.

::: math complexity Complexity
Lazy segment tree over $n$ values: $O(n)$ to build, $O(\log n)$ per range update, $O(\log n)$ per range query, and $O(n)$ extra space.
:::

The width of the accumulator is part of the statement. A range addition multiplies the delta by the length of the node's range, and a range sum accumulates those products. With $n = 200\,000$ and updates of magnitude $10^9$, a single addition can contribute $2 \cdot 10^{14}$ to one node, and the total can grow much larger. The reference implementations use a 64-bit type in C, C++, Java, and Pascal, an arbitrary-precision integer in Python, and a double-precision number in JavaScript. The JavaScript variant is exact only while every value stays below $2^{53}$ in magnitude, which is the documented limit of the educational JavaScript implementation.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Point updates and range sums | Fenwick tree |
| Range additions and point queries | Difference array or Fenwick tree |
| Range additions and range sums | Two Fenwick trees, or a lazy segment tree |
| Range assignments and range sums | Lazy segment tree |
| Range additions and range minima or maxima | Lazy segment tree |
| Range additions and range counts | Lazy segment tree |
| Range updates with a non-composable effect, such as a range minimum assignment | Segment tree beats or block decomposition |
| Static array, many queries | Prefix sums or a sparse table |
| Range updates and queries on a tree path | Heavy-light decomposition plus a lazy segment tree |

The third and fourth rows are the decision that this article exists for. When the only operation is addition, two Fenwick trees are smaller, faster, and easier to write. The lazy segment tree earns its keep when the update is an assignment, when the aggregate is a minimum or a maximum, or when the two kinds of update are mixed.

The two-Fenwick trick is worth knowing because it is a frequent source of confusion. It maintains the difference array and a weighted difference array, and it answers a range sum as a combination of four prefix sums. It cannot answer a range minimum, because a minimum does not survive subtraction. It also cannot handle an assignment, because an assignment is not a difference that can be added.

The last row is the combination that appears in tree problems. The heavy-light decomposition turns a path into $O(\log n)$ contiguous ranges of one flattened array, and the lazy segment tree handles each range. The tags compose across the ranges in the usual way; the only new detail is that the ranges arrive from the decomposition rather than from the input.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. Every one of them is a `program` variant: it reads the operations from standard input and writes one line per query, so the six outputs are comparable byte for byte.

The contract is fixed. The first line holds $n$ and $q$. The initial array is all zeros, which keeps the examples small and the six programs identical in behavior. Each of the next $q$ lines is one of:

- `1 l r delta`, which adds `delta` to every position in the inclusive range $[l, r]$;
- `2 l r`, which prints the sum of the inclusive range $[l, r]$.

The programs store the tree and the tags in arrays of size $4n + 4$, index the root at $1$, and recurse on $[lo, mid]$ and $[mid+1, hi]$. The only differences between them are the input and output calls and the integer type.

The C and C++ versions own their arrays explicitly. The C version allocates with `calloc` and frees both arrays before returning; the C++ version uses `std::vector`, so the destructor releases them. The Java version keeps the arrays on the heap and leaves the reclamation to the garbage collector. The Pascal version is a class whose constructor allocates the two dynamic arrays and whose destructor releases them. The Python and JavaScript versions model the tree as a class instance that owns its lists.

## Recursion decision

The lazy segment tree is recursive by nature, and the recursion is the right choice in every language here. The depth is the height of the tree, which is $\lceil \log_2 n \rceil$: eighteen frames for $n = 200\,000$, and twenty for a million.

| Language | Default stack | Depth needed | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Recursive is safe; the depth is logarithmic |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Recursive is safe |
| Python | Interpreter limit of 1000 | 1000 frames | Recursive is safe, and the limit is never approached |
| Pascal | The operating system stack | Depends on the platform | Recursive is safe |
| JavaScript | The V8 engine limit | About $10^4$ frames | Recursive is safe |

The reason is the same as in the [segment tree](/algorithms/range-queries/segment-tree): each level halves the range, so the depth is the number of bits in $n$, not the number of elements. The recursion is not a depth-first search over a chain, where the depth could be linear.

An iterative version is possible. It stores the tree in a power-of-two array and uses two indices that walk toward each other, and it keeps the tags on the nodes it visits. It is faster by a constant factor and considerably harder to get right, especially for a non-commutative aggregate. For a contest, the recursive version is the one to write first, and the iterative one is a micro-optimization to reach for only after the recursive version is correct and the time limit demands it.

## Implementation walkthrough

Five details decide whether the tree is correct.

**The layout.** The node covering $[lo, hi]$ lives at index $v$, its children at $2v$ and $2v+1$, and the arrays are sized $4n + 4$. The bound is safe because the largest index reached by a tree over $n$ leaves is below $4n$. Sizing the arrays to $2n$ is the classic out-of-bounds bug.

**The order of the tests.** The disjoint test comes first, the full-cover test second, and the push third. The full-cover test must come before the push, because a fully covered node is exactly the node whose tag we want to keep. If the push came first, a range update would walk all the way to the leaves and the technique would lose its point.

```cpp
void add(int node, int lo, int hi, int ql, int qr, long long delta) {
    if (qr < lo || hi < ql) {
        return;
    }
    if (ql <= lo && hi <= qr) {
        apply(node, lo, hi, delta);
        return;
    }
    push(node, lo, hi);
    int mid = lo + (hi - lo) / 2;
    add(node * 2, lo, mid, ql, qr, delta);
    add(node * 2 + 1, mid + 1, hi, ql, qr, delta);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
}
```

**The multiplication.** The tag is an amount per element, so applying it to a node multiplies by the node's length. In C and C++ the length is an `int`, and the multiplication must be done in 64 bits:

```cpp
tree[node] += delta * static_cast<long long>(hi - lo + 1);
```

Writing `delta * (hi - lo + 1)` with a 32-bit `delta` in a language that evaluates the product in 32 bits overflows before the assignment to the 64-bit tree. The bug appears only on large tests, which is the worst time to find it.

**The leaf guard.** `push` must not touch the children of a leaf. The leaf's tag is harmless because no query ever descends below it, and clearing it is unnecessary. The guard `lo == hi` is the simplest way to avoid writing at indices that belong to a different part of the tree.

The tag composition is the fifth detail, and it is the one that changes when the update changes. For addition, `tag[v] += delta`. For assignment, `tag[v] = value` and the node's aggregate becomes `value * length`; the previous tag is discarded because the new assignment overrides it. For a mix, the tag needs both a "has assignment" flag and an additive part, and the composition must respect the chronological order: an assignment clears the pending addition, while an addition after an assignment accumulates on top of the assigned value.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Pushing only during updates | A query reads children that lack a pending ancestor update, and the answer is wrong | Push whenever the recursion descends |
| Pushing before the full-cover test | Every covered node is pushed needlessly, and an implementation that then descends becomes linear | Test disjoint and full cover first |
| Forgetting to recompute the parent after a partial update | The root keeps a stale aggregate | Pull after the two recursive calls |
| Applying a tag to the children without multiplying by their lengths | The children's sums are wrong by a factor of their lengths | Apply the tag per element, times the range length |
| Clearing the tag before applying it | The pending update is lost | Apply to both children first, then clear |
| Composing an assignment tag as an addition | A later assignment is treated as another add, and the array drifts upward | Replace the tag on assignment, accumulate it on addition |
| Using a 32-bit accumulator | Large sums are silently wrong | Use 64 bits for the tree, the tags, and the delta |
| Sizing the arrays to $2n$ | The deepest nodes are written out of bounds | Use $4n + 4$ |
| Pushing at a leaf | The code writes to children that do not exist | Guard with `lo == hi` |
| Using lazy propagation for point updates | More memory and more code for no benefit | Use a Fenwick tree or an ordinary segment tree |

### Why this fails: the update that never reaches the children

The failure that survives review most often is a tree that pushes during updates but not during queries, or a tree that pulls a parent without first pushing its tag. Both have the same root: a cached aggregate is recomputed from children that never received the pending update.

Take $n = 2$, with both values initially zero. Add $5$ to $[1,2]$. The root is fully covered, so its aggregate becomes $10$ and its tag becomes $5$. The two leaves remain zero. Now add $1$ to $[1,1]$ without pushing the root first. The recursion descends to the first leaf, whose value becomes $1$, and then recomputes the root as $1 + 0 = 1$. The root's tag is still $5$, but the root's aggregate no longer includes the $10$ that the tag was supposed to represent.

A query of $[1,2]$ now returns the root's aggregate, which is $1$. The correct answer is $11$: the first position received $5 + 1 = 6$ and the second received $5$. The pending update was counted neither at the root nor at the leaves. The fix is to push the root before descending, which applies the $5$ to both leaves and clears the root's tag; the recomputation then gives $6 + 5 = 11$.

The second failure has the same shape with an assignment tag. Start with two zeros. Assign $5$ to $[1,2]$, so the root's tag is $5$ and its aggregate is $10$. Assign $3$ to $[1,2]$. If the tag is composed as an addition, it becomes $5 + 3 = 8$, and the aggregate either becomes $16$ if it is increased by $3 \ast 2$ or stays $10$ if it is overwritten. Both are wrong. The correct array is $[3,3]$, whose sum is $6$, and the correct tag is $3$, because the later assignment replaces the earlier one. The generalization is a condition on the tag: **the composition must implement the later update winning, not the sum of the two updates.** For addition the two coincide; for assignment they do not.

## Variants and extensions

- **Range addition, range sum.** The version in this article. The tag is a single number and composition is addition.
- **Range assignment, range sum.** The tag is the assigned value, and composition is replacement. Applying an assignment to a node sets its aggregate to the value times the node's length.
- **Mixed addition and assignment.** The tag holds a flag, an assigned value, and an additive part. An assignment clears the additive part; an addition adds to it. This is the tag that the CSES range-updates-and-sums problem requires.
- **Range addition, range minimum or maximum.** The tag is still a single addition, because adding the same amount to every element shifts the minimum and the maximum by that amount. The aggregate changes by the delta, not by the delta times the length.
- **Range addition, range gcd.** This does not work with a single lazy tag. The gcd of a set of numbers is not shifted by adding a constant to each of them, so the node cannot update its aggregate from the delta alone.
- **Range chmin and chmax.** These are the updates that defeat a plain tag. Segment tree beats stores the maximum, the second maximum, and the count of the maximum, and amortizes the descent over the updates.
- **Affine updates.** The tag is a pair $(m, b)$ meaning $x \mapsto m x + b$. Composition is function composition, and the order matters: applying $(m_1, b_1)$ and then $(m_2, b_2)$ gives $(m_2 m_1, m_2 b_1 + b_2)$.
- **Two-dimensional lazy propagation.** A tree over rows whose nodes hold trees over columns, with a tag in each dimension. Each operation is $O(\log^2 n)$.
- **Lazy propagation over a heavy-light decomposition.** The path is split into $O(\log n)$ ranges of one flattened array, and each range is updated lazily. This is the standard way to support path additions with subtree sums on a tree.
- **Implicit lazy propagation.** The tree allocates a node only when an operation first reaches it, which handles coordinate ranges too large to allocate. The tags work the same way.
- **An iterative lazy tree.** The tree is stored in a power-of-two array, and the tags are pushed along the two boundary paths before the query. It is faster and harder to debug.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the update and the query before writing code. Decide whether the update is an addition, an assignment, or a mix, and write the tag composition on paper.
2. Fix the indexing convention. The reference uses 1-indexed positions and the root at node $1$, and it writes the convention in a comment.
3. Write `apply`, `push`, and `pull` as three small functions, and keep the recursion free of inline arithmetic. The three functions are where the bugs live, and isolating them makes the differential test useful.
4. Test the four boundary cases explicitly: an update of the first position, an update of the last position, a query of the whole array, and a query of a single element.
5. Test two updates that overlap and then query the union, once with the second update fully inside the first and once with the second crossing its boundary. These are the cases that catch a missing push.
6. Keep the direct loop as a reference and compare on random small inputs. A disagreement is a counterexample, and a counterexample is worth more than an hour of reading the tree.
7. Check the accumulator width. The multiplication of the delta by the range length is the first place a 32-bit type overflows, and the total is the second.

## Worked problems

### Problem 1: Counting Haybales

**Restatement.** $N$ fields in a row hold some number of haybales. There are three instructions: add $C$ haybales to every field in $[A, B]$, report the minimum number in $[A, B]$, and report the sum over $[A, B]$. Constraints: $1 \le N \le 200\,000$, $1 \le Q \le 100\,000$, and the initial counts are at most $100\,000$.

**Naive baseline.** Apply the addition to each field in the range, at a cost of $O(N)$ per update. The minimum and the sum are then $O(N)$ scans per query, for $O(NQ)$ overall.

**Insight.** Both the minimum and the sum can be updated by an addition to a whole node: the sum grows by the delta times the node's length, and the minimum grows by the delta. The two aggregates share one tag.

**Derivation.** Store `sum` and `min` at every node. On a full cover, add the delta to `min`, add the delta times the length to `sum`, and add the delta to the tag. On a partial cover, push the tag, recurse into both children, and pull the two aggregates. The query returns both values for the canonical nodes and merges them with addition and minimum.

**Correctness.** The lazy invariant holds for each aggregate separately. The sum's effective value is the true sum by the first lemma, and the minimum's effective value is the true minimum because the same delta was applied to every element of the node, which shifts the minimum by that delta.

**Complexity.** $O(\log N)$ per instruction, $O(N)$ space, and 64-bit sums.

**Common wrong approach.** Forgetting to add the delta to the minimum at all, or adding the delta to the sum without multiplying by the node's length. The minimum is a per-element value; the sum is a total.

### Problem 2: Seating

**Restatement.** A row of $N$ seats starts empty. A party of size $p$ arrives and must be seated in the lowest contiguous block of $p$ empty seats, or turned away if no such block exists. A range $[a, b]$ of seats is then emptied. Report how many parties are turned away. Constraints: $1 \le N \le 500\,000$ and $1 \le M \le 300\,000$.

**Naive baseline.** Scan the seats from left to right for every arrival and clear the range directly. Both operations are $O(N)$, for $O(NM)$ overall.

**Insight.** Every node needs three summaries of its empty seats: the longest empty prefix, the longest empty suffix, and the longest empty run anywhere in the node. A gap that crosses the midpoint is the suffix of the left child plus the prefix of the right child. The update is an assignment of "full" or "empty" over a range, which is a lazy tag.

**Derivation.** Combine the three fields at a parent: the prefix is the left prefix, unless the whole left child is empty, in which case it extends into the right prefix; the suffix is symmetric; the best is the maximum of the two children's bests and the crossing gap. To seat a party of size $p$, descend from the root: if the left child's best is at least $p$, go left; otherwise, if the crossing gap is at least $p$, seat the party in the suffix of the left child and the matching prefix of the right child; otherwise go right. Once the starting seat is known, assign the block full. Emptying a range is a range assignment to empty. The lazy tag stores full, empty, or "no pending assignment".

**Correctness.** The summary of a node is a complete description of its empty seats: any maximal empty run is either inside the left child, inside the right child, or crosses the boundary, and the three fields capture all three possibilities. The descent returns the leftmost block of size $p$ because it tests the left child first, then the crossing gap, then the right child, which is the left-to-right order.

**Complexity.** $O(\log N)$ per arrival and per emptying, $O(N)$ space. The whole run is $O(N + M \log N)$.

**Common wrong approach.** Storing only the longest empty run and forgetting the prefix and the suffix. The crossing gap then cannot be computed, and a party that fits exactly across a midpoint is turned away.

### Problem 3: Range Updates and Sums

**Restatement.** An array of $N$ values is given. There are three operations: add $x$ to every element in $[a, b]$, set every element in $[a, b]$ to $x$, and report the sum over $[a, b]$. Constraints: $1 \le N, Q \le 200\,000$, and the values fit in a signed 64-bit integer.

**Naive baseline.** Apply every update element by element, which is $O(N)$ per operation, and answer every sum with a scan, which is another $O(N)$.

**Insight.** The node needs one tag that can represent both operations. The tag has a "has assignment" flag, an assigned value, and an additive part. The meaning is "apply the assignment first, then the addition". An assignment replaces both parts; an addition accumulates in the additive part, or in the assigned value if an assignment is already pending.

**Derivation.** `applySet(v, x)` sets `tree[v] = x * len(v)`, `set[v] = x`, `add[v] = 0`, and marks the set flag. `applyAdd(v, x)` adds `x * len(v)` to the tree and `x` to the additive part; if a set is pending, the addition is folded into the set value instead. `push(v)` applies the parent's set and then its add to each child, in that order, and clears the parent. The update and query recursions are the same as in the additive version.

**Correctness.** Each tag denotes a function on the elements: either $x \mapsto x + a$ or $x \mapsto s + a$. The composition of two such functions is another function of the same form, and the implementation computes that composition. The push applies the parent's function to each child, so the effective values are unchanged. The induction of the correctness proof then applies without modification.

**Complexity.** $O(\log N)$ per operation, $O(N)$ space.

**Common wrong approach.** Composing the set and the add in the wrong order. If a parent's assignment is applied before the child's older addition instead of overwriting it, the child's additive tag survives a set, and every later query adds a value that was supposed to be erased.

## Practice progression

1. **Recognition.** Given a statement, decide whether the update is a range update and whether the query aggregate is associative with an identity. Look for "add to every element in $[l, r]$" and "sum over $[l, r]$".
2. **Direct application.** Implement the additive tree with `apply`, `push`, and `pull`, and verify it against a direct loop on small random arrays.
3. **Adaptation.** Change the aggregate to a minimum and then to a maximum. Add an assignment tag and check that it replaces rather than accumulates.
4. **Combination.** Mix additions and assignments in one tag, and compose the two operations in the correct order. Test a sequence in which an assignment lands between two additions.
5. **Challenge.** Implement the Seating problem, where the tag is an assignment and the aggregate is a triple of empty-run lengths. Then implement a range chmin and discover why a plain tag is not enough.
6. **Transfer.** Put the lazy tree on a heavy-light decomposition and answer path updates with subtree sums. Then solve an offline problem with a sweep and a Fenwick tree, and compare the two approaches on the same input.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What exactly does a tag at a node mean, and which values already include it? (Formal model)
2. Why does a full-cover update stop at the node, and what would happen if it descended? (Key insight)
3. Why must a query push before reading the children, and why does a full-cover query not need to? (Algorithm derivation)
4. State the invariant and say which part of the proof uses the effective value of a leaf. (Correctness proof)
5. How many nodes does a range update visit, and why is that $O(\log n)$? (Complexity analysis)
6. What changes when the update is an assignment instead of an addition? (Variants and extensions)
7. Give the smallest array and the shortest sequence of operations that exposes a missing push. (Why this fails)
8. Why is the tag composed as a replacement for an assignment but as a sum for an addition? (Why this fails)
9. When are two Fenwick trees a better choice than a lazy segment tree? (Algorithm selection)
10. Why is the recursion safe in Python, and what would make it unsafe? (Recursion decision)

## Further reading

- The structure underneath the technique is the [segment tree](/algorithms/range-queries/segment-tree), which explains the layout, the merge, and the monoid requirements.
- The structure that handles point updates and range sums with less memory is the [Fenwick tree](/algorithms/range-queries/fenwick-tree); it cannot handle an assignment or a minimum.
- The one-dimensional special case of a range update and a point query is the [difference array](/algorithms/arrays/difference-arrays), and its article explains why the prefix sum recovers the value.
- The static case, where no update ever arrives, is answered by [prefix sums](/algorithms/arrays/prefix-sums) or a [sparse table](/algorithms/range-queries/sparse-table), both of which are simpler than a tree.
- The tree decomposition that turns a path into a logarithmic number of ranges is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition), and it is the usual place where a lazy segment tree meets a tree problem.
