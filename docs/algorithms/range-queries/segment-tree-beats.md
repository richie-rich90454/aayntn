---
id: range-queries.segment-tree-beats
title: Segment tree beats
summary: Store the two largest values and the count of the largest at every segment tree node, so a range chmin that lands between them changes one group per node and range sums stay correct in amortized logarithmic time.
division: [platinum]
subjects: [range-queries]
level: advanced
importance: advanced-technique
keywords:
    [
        segment tree beats,
        range chmin,
        range chmax,
        range cap,
        second maximum,
        amortized analysis,
        range sum,
    ]
prerequisites:
    required: [range-queries.segment-tree, foundations.complexity]
    recommended: [range-queries.lazy-propagation, range-queries.fenwick-tree]
complexity:
    time: "amortized O(log n) per operation"
    space: "O(n)"
assumptions:
    - The only update is a chmin, a cap of every value in a range at a common bound; the symmetric chmax works the same way on the minimum pair.
    - Every value and every cap is nonnegative, so a missing second maximum can be stored as -1.
    - The range sum is accumulated in a signed 64-bit integer.
implementations: range-queries.segment-tree-beats
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/range-queries.segment-tree-beats.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

Segment tree beats is a segment tree whose nodes remember more than the aggregate. For range chmin with range sums, every node stores four numbers: the sum of its range, the largest value $m_1$, the second largest _distinct_ value $m_2$, and the number of positions that hold $m_1$, written $c$.

The extra numbers answer one question exactly: _does this update change anything below the level of the maximum?_ A cap $x$ leaves a node alone when $m_1 \le x$. It touches only the maximum group when $m_2 < x < m_1$, because then every position above $x$ holds $m_1$ and nothing else moves. In that case the node absorbs the whole update in constant time:

$$
\text{sum} \;=\; \text{sum} - (m_1 - x) \ast c,
\qquad
m_1 \;=\; x.
$$

Every cap that is at or below the second maximum descends into the children. That is the entire technique: a new pruning rule, one more summary than a lazy segment tree keeps, and an amortized argument that the descents are rare.

The technique is usually called segment tree beats, and the name covers the whole family of segment trees whose update rule is decided by a small summary of each node. The same idea generalizes to range chmax and to a mixture of caps, floors, additions, and assignments, at the cost of more fields per node.

## Problem motivation

A battery farm has $n$ cells in a row, and cell $i$ currently holds $a_i$ units of charge. Two kinds of instructions arrive during the day:

- "No cell between $l$ and $r$ may hold more than $x$ units; clamp every cell in that range to $x$."
- "How much charge is stored in cells $l$ through $r$ in total?"

The constraints are the whole problem.

- $1 \le n \le 200\,000$ cells.
- $1 \le q \le 200\,000$ instructions, each one a clamp or a query.
- $0 \le a_i \le 10^9$ and $0 \le x \le 10^9$, so a range sum can reach $2 \cdot 10^{14}$.

Clamping every cell in the range costs $O(n)$ per instruction, which is $4 \cdot 10^{10}$ operations in the worst case. A [prefix sum](/algorithms/arrays/prefix-sums) table answers the query in constant time but has to be rebuilt after every clamp, and a rebuild is another $O(n)$.

A [Fenwick tree](/algorithms/range-queries/fenwick-tree) does not help either. Its update is a point update, and turning a range clamp into point updates costs $O(n \log n)$ per instruction.

The interesting baseline is a [lazy segment tree](/algorithms/range-queries/lazy-propagation). It handles a range addition because adding $\delta$ to every value in a node shifts the node's sum by $\delta$ times its length, which is one multiplication. A cap is not uniform in that way. The amount removed from a node's sum is

$$
\sum_{p \in R(v)} \max(0,\; a_p - x),
$$

which depends on how many values exceed $x$ and by how much. The node's sum alone cannot answer that, and neither can a single pending cap stored at the node. What the node is missing is a description of the _distribution_ of its largest values, and the smallest description that makes the update exact is the pair $(m_1, m_2)$ together with the count $c$.

## Recognition patterns

Segment tree beats is the right tool when all of the following hold.

- The update is a **cap** (chmin), a **floor** (chmax), or a small mixture of such monotone operations, applied to a whole range.
- The query asks for an **aggregate that can be repaired from the updated group**, such as a sum, a maximum, or a count.
- The update can be **absorbed by a node in constant time** whenever it affects only the node's extreme group.
- The values in a node are summarized well enough to decide, in constant time, whether a lower group is affected.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The update adds the same amount to every element | Use lazy propagation; a cap is not needed |
| The update assigns the same value to every element | Use lazy propagation with an assignment tag |
| The update is a cap and the query is only the range maximum | A lazy cap tag suffices; the maximum shifts by the cap without any distribution |
| The update is a cap and the query is a range sum | Segment tree beats with $(sum, m_1, m_2, c)$ |
| The update is a cap and the query is a count of values above a threshold | Store a sorted structure or use a different decomposition |
| The update is "modulo $x$" | The same pruning idea works with the maximum; the second maximum is not needed |
| The update is "divide by $x$" | A beats variant, or a segment tree that stops when the node is uniform |
| $n \le 10^3$ | A direct loop over the range is fast enough |
| The array never changes | Prefix sums or a sparse table answer faster |

The phrases in a statement that signal this technique are "replace $a_i$ by $\min(a_i, x)$", "no element may exceed $x$", "clamp every value in the range", and "report the sum over the range". The phrase that rules it out is "add $x$ to every element", because that update is uniform and a plain lazy tag already handles it.

<Synonyms terms="segment tree beats, beats, range chmin, range chmax, range cap, jiry_2 segment tree" />

## Naive approach

The baseline is a direct loop for every clamp.

```cpp
void rangeChmin(std::vector<long long>& a, int left, int right, long long x) {
    for (int i = left; i <= right; ++i) {
        a[i] = std::min(a[i], x);
    }
}
```

This is $O(n)$ per clamp. A query is another $O(n)$ scan, so the whole program is $O(nq)$.

The second baseline is an ordinary segment tree that descends to every leaf in the clamped range. It visits $O(k \log n)$ nodes for a range of length $k$, and the worst case is $O(n)$ per clamp. It is correct, and it is the reference implementation for a differential test.

The third baseline is a lazy segment tree that stores a pending cap at a node. A cap composes with another cap, because applying $x$ and then $y$ is the same as applying $\min(x, y)$. That makes a lazy cap tag correct for **range maximum queries**: the maximum of a node after a cap is the smaller of the old maximum and the cap. It is not correct for range sums, because the sum removed depends on how many values are above the cap, and the tag does not know that.

The fourth baseline is [square-root decomposition](/algorithms/range-queries/sqrt-decomposition). Each block keeps its values sorted, so a whole-block cap can be applied by binary search and a partial block is rebuilt. A clamp and a sum both cost $O(\sqrt{n} \log n)$. That is a real alternative, and it is often easier to get right than beats. The beats tree is faster and is the structure this article is about.

## Key insight

The insight is that a cap is almost uniform, and the second maximum measures exactly how far from uniform it is.

Take a node whose range holds a multiset $S$. Let

- $m_1$ be the largest value in $S$,
- $m_2$ be the largest value in $S$ that is strictly smaller than $m_1$, or $-1$ if all values are equal,
- $c$ be the number of positions that hold $m_1$.

Now cap every value at $x$. There are three cases.

**Case 1: $x \ge m_1$.** Nothing changes. The whole subtree can be skipped.

**Case 2: $m_2 < x < m_1$.** The values above $x$ are exactly the $c$ copies of $m_1$, because every other value is at most $m_2 < x$. All of them become $x$, so the sum drops by $(m_1 - x) \ast c$, the maximum becomes $x$, the second maximum is still $m_2$, and the count is still $c$. One subtraction settles the node, and its children are left alone.

**Case 3: $x \le m_2$.** The cap also reaches values that are not the maximum, so more than one group moves. The node cannot describe the result with its four numbers, and the update has to descend.

The middle case is the whole trick. The value $m_2$ is the largest value that is _not_ in the maximum group, so it is precisely the boundary between "only the maximum moves" and "something else moves too".

A small example makes the arithmetic concrete. Take

$$
S = \{10,\; 4,\; 7,\; 4\}.
$$

The summary is $m_1 = 10$, $m_2 = 7$, $c = 1$, and the sum is $25$.

Cap the range at $8$. Since $7 < 8 < 10$, case 2 applies: the single $10$ becomes $8$, the sum becomes $25 - 2 \ast 1 = 23$, and the new summary is $m_1 = 8$, $m_2 = 7$, $c = 1$. The array is $\{8, 4, 7, 4\}$.

Cap the range again at $6$. Now $m_2 = 7 \ge 6$, so case 3 applies and the update must descend. In the left half $\{8, 4\}$ the second maximum is $4$, so the cap at $6$ is absorbed there: $8$ becomes $6$ and the sum drops by $2$. In the right half $\{7, 4\}$ the same thing happens: $7$ becomes $6$. The two halves are then recombined into the root summary $(20, 6, 4, 2)$. The array is $\{6, 4, 6, 4\}$.

The second step shows why the descent is not a failure. It stops as soon as it reaches a node where the cap is uniform on the maximum group, which in this example is one level below the root.

## Visual intuition

Draw each node as a staircase of its distinct values, from the largest at the top to the smallest at the bottom. The top step has height $m_1$ and width $c$; the step below it has height $m_2$; the remaining steps are lower still.

```
        m1  +----------+  c positions
            |
        m2  +------+
            |
            +----------------  positions
```

A cap $x$ is a horizontal cut across the staircase.

- If the cut is above the top step, nothing is removed.
- If the cut is below the top step but above the second step, the top step is trimmed to the height of the cut. One rectangle disappears, and the staircase still has the same number of steps.
- If the cut reaches the second step, the top two steps merge into one step at the height of the cut, and the node can no longer say how many positions are on each of the merged levels. The picture has to be redrawn from the children.

Across the tree the cut propagates downward only where it reaches the second step. Most of the time it stops at a node near the top, which is why the total work is small.

The toy tree below shows the same object with the node ranges written beside it.

| Node | Range   | Sum | $m_1$ | $m_2$ | $c$ |
| ---- | ------- | --- | ----- | ----- | --- |
| 1    | $[1,4]$ | 25  | 10    | 7     | 1   |
| 2    | $[1,2]$ | 14  | 10    | 4     | 1   |
| 3    | $[3,4]$ | 11  | 7     | 4     | 1   |
| 4    | $[1,1]$ | 10  | 10    | $-1$  | 1   |
| 5    | $[2,2]$ | 4   | 4     | $-1$  | 1   |
| 6    | $[3,3]$ | 7   | 7     | $-1$  | 1   |
| 7    | $[4,4]$ | 4   | 4     | $-1$  | 1   |

The root's second maximum is $7$, which is the maximum of its right child. That is not an accident: the second largest value of a union is either the second largest of the child that holds the maximum or the maximum of the other child.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, indexed from one. Every node $v$ of the tree owns a contiguous range $R(v) = [l_v, r_v]$ of positions.

::: math definition Definition
The **summary** of a nonempty multiset $S$ of nonnegative integers is the quadruple $(s, m_1, m_2, c)$ where $s = \sum_{v \in S} v$, $m_1 = \max S$, $c = \lvert\{v \in S : v = m_1\}\rvert$, and $m_2 = \max\{v \in S : v < m_1\}$, with $m_2 = -1$ when every value of $S$ equals $m_1$.
:::

::: math definition Definition
The **cap** of a multiset $S$ at a bound $x$ is $C_x(S) = \{\min(v, x) : v \in S\}$. It is the multiset the range would hold after clamping every value at $x$.
:::

::: math definition Definition
A node $v$ is **settled** when its four stored fields are the summary of the values currently in $R(v)$. It is **one cap behind** when its fields are the summary of the values after every cap applied at its ancestors except the most recent one, which is still stored at the parent.
:::

::: math lemma Lemma
If $m_2 < x < m_1$, the summary of $C_x(S)$ is $(s - (m_1 - x)c,\; x,\; m_2,\; c)$.
:::

::: math lemma Lemma
If $m_1 \le x$, then $C_x(S) = S$, and the summary does not change.
:::

::: math lemma Lemma
If $x \le m_2$, the summary of $C_x(S)$ is not determined by the summary of $S$ alone.
:::

::: math proof Proof
Take $S = \{9, 8, 8, 1\}$ and $S' = \{9, 8, 5, 4\}$. Both have sum $26$, $m_1 = 9$, $m_2 = 8$, and $c = 1$, so their summaries are identical. Capping at $6$ gives $C_6(S) = \{6, 6, 6, 1\}$ with sum $19$, and $C_6(S') = \{6, 6, 5, 4\}$ with sum $21$. The same summary therefore leads to two different results, so no constant-time rule that reads only the summary can be correct. $\square$
:::

::: math definition Definition
A **pending cap** at a node $v$ is a value $x$ such that every value of $R(v)$ above $x$ has already been replaced by $x$ in the fields of $v$, but not in the fields of its descendants. The pending cap is stored implicitly: it is $m_1(v)$ after the update, and it is pushed to the children before any operation descends through $v$.
:::

::: math invariant Invariant
After every operation, each node is either settled or holds a pending cap. A node with a pending cap has $m_2(v) < m_1(v)$, and every value in its range is at most the cap. The children of a node with a pending cap are one cap behind, and a push brings them up to date.
:::

## Algorithm derivation

The derivation has four rules: apply, push, pull, and the recursive clamp. Each one follows from the summary definition.

**Pull.** Combining two settled children into a parent is a merge of two summaries. The sum is the sum of the sums. For the maximum there are three cases.

```text
pull(v):
    sum[v] = sum[2v] + sum[2v + 1]
    if m1[2v] == m1[2v + 1]:
        m1[v] = m1[2v]
        c[v]  = c[2v] + c[2v + 1]
        m2[v] = max(m2[2v], m2[2v + 1])
    else if m1[2v] > m1[2v + 1]:
        m1[v] = m1[2v]
        c[v]  = c[2v]
        m2[v] = max(m2[2v], m1[2v + 1])
    else:
        m1[v] = m1[2v + 1]
        c[v]  = c[2v + 1]
        m2[v] = max(m1[2v], m2[2v + 1])
```

The three cases are the only possibilities. When the two maxima are equal, the maximum group of the parent is the union of both groups, and the second maximum is the larger of the two second maxima. When the left maximum is larger, the parent's maximum group is the left one, and the second maximum is the larger of the left's second maximum and the right's maximum.

**Apply.** The constant-time absorption is one subtraction, guarded so that it never runs when it would be wrong.

```text
apply(v, x):
    if m1[v] <= x:
        return
    sum[v] -= (m1[v] - x) * c[v]
    m1[v] = x
```

The caller guarantees $m_2(v) < x < m_1(v)$, so exactly the $c(v)$ positions holding $m_1(v)$ change. The second maximum and the count are unchanged, because $x$ is still above $m_2(v)$, and the new maximum is $x$ with the same number of occurrences.

**Push.** A node that absorbed a cap still has stale children. Pushing applies the node's maximum as a cap to both children.

```text
push(v):
    apply(2v, m1[v])
    apply(2v + 1, m1[v])
```

The push is safe for the same reason the update is: if a child's maximum is above the parent's new maximum, then that child contains the old parent maximum, so the child's second maximum is at most the parent's second maximum, which the cap exceeded. The child therefore absorbs the cap through its own maximum group. If the child's maximum is already at most the cap, `apply` does nothing.

**Recursive clamp.** The update walks down only where it must.

```text
chmin(v, lo, hi, ql, qr, x):
    if qr < lo or hi < ql or m1[v] <= x:
        return
    if ql <= lo and hi <= qr and m2[v] < x:
        apply(v, x)
        return
    if lo == hi:
        apply(v, x)
        return
    push(v)
    mid = lo + (hi - lo) / 2
    chmin(2v, lo, mid, ql, qr, x)
    chmin(2v + 1, mid + 1, hi, ql, qr, x)
    pull(v)
```

The order of the tests is important. The disjoint test and the $m_1 \le x$ test are both early exits. The full-cover test with $m_2 < x$ is the constant-time absorption. The leaf guard is unreachable under the nonnegative contract, because a leaf has $m_2 = -1 < x$, but it protects the code if the sentinel is ever met by a negative bound. The push comes only after all three exits, and the pull repairs the parent after a partial descent.

**Query.** A sum query is an ordinary segment tree query with one addition: it pushes before descending.

```text
query(v, lo, hi, ql, qr):
    if qr < lo or hi < ql:
        return 0
    if ql <= lo and hi <= qr:
        return sum[v]
    push(v)
    mid = lo + (hi - lo) / 2
    return query(2v, lo, mid, ql, qr)
         + query(2v + 1, mid + 1, hi, ql, qr)
```

The push is not optional. A node that absorbed a cap has a correct sum but stale children, and a query that descends into them without pushing reads values that were already clamped at the parent.

The invariant is preserved by the four rules. `apply` keeps the node settled for the new cap. `push` moves the cap one level down without changing any effective value, because a cap applied to a child that is already at or below it is the identity. `pull` rebuilds a settled parent from two settled children. A query never changes the array, only the representation.

## Step-by-step execution

Take $a = [10, 4, 7, 4]$ with the tree from the visual section. Four operations follow.

| Step | Operation | Array after     | Root $(m_1, m_2, c, \text{sum})$ |
| ---- | --------- | --------------- | -------------------------------- |
| 0    | initial   | $[10, 4, 7, 4]$ | $(10, 7, 1, 25)$                 |
| 1    | `1 1 4 8` | $[8, 4, 7, 4]$  | $(8, 7, 1, 23)$                  |
| 2    | `2 2 3`   | $[8, 4, 7, 4]$  | $(8, 7, 1, 23)$                  |
| 3    | `1 1 4 6` | $[6, 4, 6, 4]$  | $(6, 4, 2, 20)$                  |
| 4    | `1 2 3 3` | $[6, 3, 3, 4]$  | $(6, 4, 1, 16)$                  |

**Step 1.** The root has $m_1 = 10$ and $m_2 = 7$. The cap $8$ lies strictly between them, so the root is fully covered and case 2 applies. Its sum drops by $(10 - 8) \ast 1 = 2$ and its maximum becomes $8$. The children are untouched. The true array is $[8, 4, 7, 4]$, whose root summary is indeed $(23, 8, 7, 1)$.

**Step 2.** The query $[2,3]$ reaches the root, which is only partly covered, so it pushes the pending cap $8$ onto both children. The left child has maximum $10$, so it absorbs the cap: its sum drops from $14$ to $12$ and its maximum becomes $8$. The right child has maximum $7$, below $8$, so nothing happens. The query then descends and returns $4$ from position $2$ and $7$ from position $3$, for $11$. The root is not recomputed, because the push did not change any effective value; its fields were already correct.

**Step 3.** The cap $6$ is below the root's second maximum $7$, so the root descends. It calls `push`, whose cap $8$ is now a no-op on both children, and then visits both halves. The left child has $m_1 = 8$ and $m_2 = 4$, so $4 < 6 < 8$ and it absorbs the cap: its sum drops from $12$ to $10$ and its maximum becomes $6$. The right child has $m_1 = 7$ and $m_2 = 4$, so $4 < 6 < 7$ and it absorbs the cap: its sum drops from $11$ to $10$ and its maximum becomes $6$. The pull then combines the two children, whose maxima are both $6$, into the root summary: count $2$, second maximum $4$, sum $20$.

**Step 4.** The cap $3$ on $[2,3]$ is below the root's second maximum $4$, so the root descends again. The left child is partly covered. It pushes its cap $6$ to the leaves: the first leaf, still storing $8$, becomes $6$, and the second leaf stays $4$. Position $1$ is outside the range, so the recursion skips it; position $2$ has maximum $4$ and second maximum $-1$, so it absorbs the cap and becomes $3$. The left child is pulled back to $(9, 6, 3, 1)$. The right child does the same around position $3$: the leaf storing $7$ becomes $6$ on the push, then $3$ on the cap, and the right child becomes $(7, 4, 3, 1)$. The root combines a left maximum $6$ with a right maximum $4$, producing $m_1 = 6$, $c = 1$, $m_2 = \max(3, 4) = 4$, and sum $16$.

The last step is the interesting one. The root's maximum never changes, yet the update still descends, because the cap reaches a value that is not the root's maximum. The descent stops at the leaves once the maximum group is alone.

## Correctness proof

::: math theorem Theorem
If the invariant holds before an operation, then after a range chmin or a range sum the root's fields are the summary of the true array, a query returns the sum of its range, and the invariant holds again.
:::

::: math proof Proof
The proof is an induction over the recursion, with three lemmas.

**The apply lemma.** Suppose $v$ is settled and $m_2(v) < x < m_1(v)$. The values above $x$ are precisely the $c(v)$ copies of $m_1(v)$, because every other value is at most $m_2(v) < x$. Replacing them by $x$ changes the sum by $(m_1(v) - x) \ast c(v)$, leaves the second maximum at $m_2(v)$ because $x > m_2(v)$, and leaves the count at $c(v)$ because the group still has the same size. The node is settled for the capped multiset, and the cap is recorded as its pending cap.

**The push lemma.** Suppose $v$ holds a pending cap $c = m_1(v)$, and a child $u$ is one cap behind. Every value in $R(u)$ is at most the parent's pre-cap maximum. If the child's stored maximum is at most $c$, applying the cap is the identity. Otherwise the child contains a value above $c$, which can only be the parent's pre-cap maximum, so the child's second maximum is at most the parent's second maximum, which was strictly below $c$ when the cap was stored. The child therefore absorbs the cap through its own maximum group, and its new fields are the summary of the child's values capped at $c$. The same argument applies to both children, so the push preserves every effective value and brings both children up to date.

**The pull lemma.** The three cases of the merge cover every way the two maximum groups can be arranged. If the maxima are equal, the parent's maximum group is their union; otherwise the larger maximum wins and the other child's maximum becomes a candidate for the parent's second maximum, together with the winner's own second maximum. In all three cases the count is the count of the winning group, the second maximum is the larger of the two remaining candidates, and the sum is the sum of the two children. The parent is settled.

Now consider a clamp at a node $v$. If $v$ is disjoint from the range, nothing in its subtree changes. If $m_1(v) \le x$, no value in the range exceeds $x$, so the cap is the identity. If $v$ is fully covered and $m_2(v) < x$, the apply lemma makes $v$ settled for the new values and leaves the children with a pending cap, which the invariant permits. Otherwise the algorithm pushes $v$, which by the push lemma keeps every effective value and settles both children, recurses into them, and pulls. By the induction hypothesis each child is settled after its recursion, and the pull lemma makes $v$ settled again. The recursion terminates because every call either returns or descends into a strictly smaller range, and the leaf case is caught by the apply rule.

For a query, the argument is the same until a fully covered node is reached. Along the descent, every pending cap on the path has been pushed by the query itself, so at a fully covered node the stored sum is the sum of its true values. The disjoint case returns $0$, the identity of addition. The partial case splits the query range into the parts inside the two children and adds their sums, which by the induction hypothesis are the true sums of those parts. Their union is the query range, so the answer is correct. $\square$
:::

::: math proof Proof
The invariant is established by the initial build: every leaf is settled, and each pull produces a settled parent from settled children. The operations preserve it by the argument above. The pending cap of a node is always its current maximum, and it is always strictly above the node's second maximum, because `apply` is only called when that condition holds. $\square$
:::

## Complexity analysis

**Each query: $O(\log n)$.** A query visits at most two boundary paths and the canonical nodes between them, which is the standard segment tree bound. Each visited node does constant work, and a node that is fully covered returns immediately.

**Each clamp: $O(\log n)$ amortized.** The operation itself follows two boundary paths, so it visits $O(\log n)$ nodes that are only partly covered. The extra work is the set of fully covered nodes where the cap is not uniform, so the recursion has to descend further. Charge each such descent to the node where it happens.

The potential is the total number of distinct values over all nodes of the tree. Initially it is $O(n \log n)$, because a node with $k$ leaves holds at most $k$ distinct values and the levels sum to $n \log n$. A cap never increases it: every value either stays the same or becomes $x$, so distinct values only merge. A fully covered descent at a node happens exactly when $x \le m_2(v)$, and then both $m_1(v)$ and $m_2(v)$ are at least $x$ and are both replaced by values at most $x$, so at least two distinct classes merge and the node's distinct count drops by at least one. Since a node's count never increases, all fully covered descents over the whole run consume at most the initial potential plus the per-operation boundary work, which is $O((n + q) \log n)$ in total. Each operation is therefore $O(\log n)$ amortized.

This is an amortized bound, not a worst-case one. A single clamp can visit many nodes, and the worst case for one operation is linear. The bound says that the expensive operations are paid for by the cheap ones.

**Building the tree: $O(n)$.** A bottom-up or recursive build visits every node once and does constant work per node.

**Space: $O(n)$.** The reference layout stores four arrays of $4n + 4$ entries: two 64-bit arrays for the sum and each maximum, and one 32-bit array for the count. At $n = 200\,000$ that is about $22$ MB.

::: math complexity Complexity
Segment tree beats over $n$ values with range chmin and range sum: $O(n)$ to build, $O(\log n)$ amortized per clamp, $O(\log n)$ per query, and $O(n)$ extra space.
:::

The accumulator width is part of the statement. With $n = 200\,000$ values of magnitude $10^9$, a sum reaches $2 \cdot 10^{14}$, which does not fit in a signed 32-bit integer, whose largest value is about $2.1 \cdot 10^9$. The reference implementations use a 64-bit sum and a 64-bit bound.

The combined version with range chmin, range chmax, and range add has a worse bound, conventionally stated as $O((n + q) \log^2 n)$ amortized. The extra logarithm comes from the interaction between the two bound families and the additive tag; the chmin-only version in this article is the simpler $O((n + q) \log n)$ case.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Point updates and range sums | Fenwick tree or segment tree |
| Range additions and range sums | Lazy segment tree, or two Fenwick trees |
| Range assignments and range sums | Lazy segment tree |
| Range chmin and range maximum queries only | A lazy cap tag on an ordinary segment tree |
| Range chmin and range sums | Segment tree beats with $(sum, m_1, m_2, c)$ |
| Range chmin, chmax, and range sums | Full segment tree beats with both extreme pairs |
| Range modulo and range sums | Maximum-pruned segment tree, the same idea with one field |
| Range division and range sums | Beats variant, or a tree that stops at uniform nodes |
| Static array, many queries | Prefix sums or a sparse table |
| $n \le 10^3$ | Direct loops |

The row that matters most is the fourth. When the query is only a maximum, a cap is uniform in the only way that matters: the node's maximum after the cap is the smaller of its old maximum and the cap. No distribution is needed, and a lazy tag is enough. The sum is what forces the second maximum into the node, because a sum needs to know how many values were above the cap.

The second row is the other common confusion. A range addition is uniform for every aggregate, so it never needs beats. If a statement mixes additions with caps, the tree needs both an additive tag and the two extreme pairs, which is the full version in the variants section.

## Reference implementations

The manifest publishes six `program` variants, one for each language. There is no separate reusable variant: the point of this technique is the interaction between the update rule and the recursion, and a minimal API without the recursion would hide exactly the part that is hard to get right.

The contract is fixed. The first line holds $n$ and $q$. The second line holds the $n$ initial values. Each of the next $q$ lines is one of:

- `1 l r x`, which replaces every value in the inclusive range $[l, r]$ by its minimum with $x$;
- `2 l r`, which prints the sum of the inclusive range $[l, r]$.

Every program stores the four arrays at size $4n + 4$, indexes the root at $1$, and recurses on $[lo, mid]$ and $[mid + 1, hi]$. The four fields live in four parallel arrays rather than in an array of structs, because the recursion touches one field at a time and the parallel layout keeps the hot loops small.

The C and C++ versions own their arrays explicitly: C allocates them with `malloc` and frees them before returning, and C++ keeps them in `std::vector`, so the class destructor releases them. Java keeps them on the heap and reads through a byte-buffered scanner. The Pascal version is a class whose constructor allocates the four dynamic arrays and whose destructor clears them. Python and JavaScript model the tree as a class instance that owns its lists. All six produce the same output on the shared fixtures, and all six were compared byte for byte.

The sentinel for a missing second maximum is $-1$. That is safe because the contract makes every value nonnegative, so a real second maximum is at least $0$. If a statement allowed negative values, the sentinel would have to be minus infinity instead.

## Recursion decision

The build, the clamp, and the query are all recursive, and the recursion is the right choice. Its depth is the height of the tree, which is $\lceil \log_2 n \rceil$: eighteen frames for $n = 200\,000$, and twenty for a million.

| Language | Default stack | Depth needed | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About 20 frames | Recursive is safe |
| Java | 512 KB to 1 MB per thread | About 20 frames | Recursive is safe |
| Python | Interpreter limit of 1000 | 20 frames | Recursive is safe without raising the limit |
| Pascal | The operating system stack | 20 frames | Recursive is safe |
| JavaScript | The V8 engine limit | 20 frames | Recursive is safe |

The depth is logarithmic because every call halves the range. This is not a depth-first search over a chain, where the depth could be linear.

An iterative version is possible but not attractive here. The array can be stored in a power-of-two layout and the recursion replaced by two boundary paths, but the beats update needs to know, at every visited node, whether the cap is uniform on the maximum group, and it needs to push the pending cap in the right order. A bottom-up implementation therefore carries an explicit stack of nodes and ranges, which is more code and more chances to push at the wrong time. The recursive version is the one to write first, and the iterative one is a micro-optimization for a time limit that the recursive version misses.

## Implementation walkthrough

Five details decide whether the tree is correct.

**The four fields.** `sum` is the sum of the node's range. `max1` is its largest value, `max2` is the largest value strictly below `max1`, and `count` is the number of positions equal to `max1`. The second maximum is a **distinct** value, not the second element of the range. With duplicate maxima, the count carries the multiplicity and the second maximum stays below the maximum.

**The merge.** The three cases of `pull` are worth writing once and reading twice:

```cpp
void pull(int node) {
    const int left = node * 2;
    const int right = left + 1;
    sum[node] = sum[left] + sum[right];
    if (max1[left] == max1[right]) {
        max1[node] = max1[left];
        count[node] = count[left] + count[right];
        max2[node] = std::max(max2[left], max2[right]);
    } else if (max1[left] > max1[right]) {
        max1[node] = max1[left];
        count[node] = count[left];
        max2[node] = std::max(max2[left], max1[right]);
    } else {
        max1[node] = max1[right];
        count[node] = count[right];
        max2[node] = std::max(max1[left], max2[right]);
    }
}
```

The equal case is the one that is easy to get wrong. When both children have the same maximum, the parent's max2 is not the left child's max2 and it is not the right child's max2: it is the larger of the two. Either child can hold the second largest value of the union.

**The order of the tests.** The clamp checks disjointness and the maximum prune first, the full cover with the second-maximum condition second, and the leaf guard third. The full-cover test must come before the push, because a fully covered node is exactly the node whose pending cap we want to record. If the push came first, every cap would walk to the leaves and the structure would be an ordinary segment tree.

```cpp
void chmin(int node, int lo, int hi, int left, int right, long long x) {
    if (right < lo || hi < left || max1[node] <= x) {
        return;
    }
    if (left <= lo && hi <= right && max2[node] < x) {
        applyCap(node, x);
        return;
    }
    if (lo == hi) {
        applyCap(node, x);
        return;
    }
    push(node);
    const int mid = lo + (hi - lo) / 2;
    chmin(node * 2, lo, mid, left, right, x);
    chmin(node * 2 + 1, mid + 1, hi, left, right, x);
    pull(node);
}
```

**The arithmetic.** The subtraction is a 64-bit operation even when the values fit in 32 bits, because the sum does not:

```cpp
sum[node] -= (max1[node] - x) * count[node];
```

Writing the product in 32 bits overflows before the assignment to the 64-bit sum. The same trap appears in the query: the sum of a long range needs the 64-bit type from the first addition, not only at the end.

**The push.** `push` has no leaf guard in the reference code, because it is only called from a branch where the node is not a leaf. A query that reaches a leaf either returns its sum or its disjoint zero, so it never pushes. A clamp that reaches a leaf applies the cap through the leaf guard. Removing the leaf guard from `push` is safe only if those two facts stay true; adding a guard is also fine, and it makes the function defensible on its own.

**The sentinel.** `max2 = -1` marks a node whose values are all equal. It is smaller than every legal value, so `max2 < x` behaves like "the cap is above every non-maximum value" for every nonnegative $x$. Negative values or negative caps would require a different sentinel, which is the one place where the nonnegative assumption is visible in the code.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Applying the cap when $m_2 \ge x$ | The sum is reduced by too little, because the non-maximum values above $x$ are ignored | Only absorb when $m_2 < x < m_1$ |
| Forgetting the push before descending in a query | The query reads a child that never received the parent's cap | Push at every partial node |
| Forgetting the push before descending in a clamp | The recursion recomputes the parent from stale children and loses the pending cap | Push after the three exits, before the two calls |
| Recomputing the parent without merging the second maxima | The next clamp's threshold is wrong and the tree descends too far or too little | Use the three-case merge |
| Storing the second largest _element_ instead of the second largest _distinct_ value | Duplicate maxima make the count and the threshold inconsistent | Skip every value equal to $m_1$ when computing $m_2$ |
| Using a 32-bit sum | Large ranges are silently wrong | Use 64 bits for the sum, the values, and the bound |
| Treating the cap as a range addition | The removed amount is charged to every position, not only to those above $x$ | Compute the removal from $m_1$, $x$, and $c$ |
| Sizing the arrays to $2n$ | The deepest node index is beyond the array | Use $4n + 4$ |
| Forgetting the leaf case | A cap below the sentinel recurses forever | Apply at a leaf before the recursive calls |
| Pushing before the full-cover test | Every cap walks to the leaves and the amortized bound is lost | Test the full cover and $m_2 < x$ first |

### Why this fails: the cap that is treated as an addition

The mistake that survives review most often is replacing the cap by a subtraction of the whole node's excess. The code looks reasonable: the node has a maximum $m_1$, the cap removes $m_1 - x$ from each position that holds it, so subtract $(m_1 - x) \ast c$ and stop. That is exactly right when $m_2 < x$, and exactly wrong when $m_2 \ge x$.

Take the two-element array $[9, 8]$ and cap it at $5$. The correct result is $[5, 5]$ with sum $10$. The root has $m_1 = 9$, $m_2 = 8$, $c = 1$, and sum $17$. The naive rule subtracts $(9 - 5) \ast 1 = 4$ and stops, leaving sum $13$, which corresponds to $[5, 8]$. The value $8$ was also above the cap and had to move. The second maximum $8$ is the number that says so, and the rule must not fire when $x \le m_2$.

The same failure appears in a lazier disguise. A tree stores a single pending cap at the node and applies it to the children during a later push. That is correct for a maximum query, because the maximum after a cap is the smaller of the old maximum and the cap. It is wrong for a sum, because the node's sum was never reduced by the values in the second group. There is no constant-time repair: the node would have to know how many values were above the cap, which is precisely what the sorted distribution supplies and what the four fields approximate.

A second failure has the same shape and a different cause. Start with $[7, 1]$, cap the whole range at $3$, and then query $[1,1]$. The root is fully covered by the cap and $m_2 = 1 < 3 < 7$, so it absorbs the cap: its sum becomes $8 - 4 = 4$, its maximum becomes $3$, and its children still hold $7$ and $1$. A query that descends without pushing reads the first leaf as $7$ and returns $7$, when the correct value is $3$. The query must push every pending cap on its path before it reads a child.

## Variants and extensions

- **Range chmax.** Store the minimum $m_1$, the second minimum $m_2$, and the count of the minimum instead. The rule is symmetric: absorb a bound when $m_1 < x < m_2$, and update the sum by $(x - m_1) \ast c$.
- **Range chmin and chmax together.** Keep both pairs, so six fields plus the sum and the two counts. A cap uses the maximum pair, a floor uses the minimum pair, and the two rules are independent as long as the pushes are ordered correctly.
- **Range addition plus chmin.** Add an additive tag that shifts the sum, both maxima, and both minima by the same amount. Pushing applies the addition first and the bounds second, because the bounds were recorded after the addition that was already folded into them. The bound becomes $O((n + q) \log^2 n)$.
- **Range assignment plus chmin.** The assignment tag replaces the node's fields, so it overrides any pending cap. The combination is common in problems that alternate "set the range" with "clamp the range".
- **Historical maximum.** Store, in addition to the current maximum, the largest value the node has ever held and the largest sum it has ever had. The tags grow into pairs of functions, and the technique is called segment tree beats with history.
- **Modulo updates.** A value is unchanged by a modulo exactly when it is below the modulus, so a node whose maximum is below the modulus can be skipped. A value that changes is at least halved, which gives a different amortized argument. The article's third worked problem is this variant.
- **Floor division updates.** A division of a whole range cannot be absorbed by a node unless every value in the node divides the same way. The useful pruning rule is to stop at a node whose maximum equals its minimum, apply the division as an assignment, and otherwise descend; a value that changes shrinks geometrically, which supplies the amortized bound.
- **Beats on a heavy-light decomposition.** A path is split into $O(\log n)$ ranges of a flattened array, and each range is clamped by the tree. The decomposition does not change; only the number of ranges per operation does.
- **Square-root decomposition instead of beats.** Each block keeps its values sorted, so a whole-block cap is a binary search and a partial block is a rebuild. It is slower by a square root and much easier to prove correct.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide what the update does to a single value. If it is "replace $v$ by $\min(v, x)$", the tree is a beats tree. If it is "add $x$", use lazy propagation and stop.
2. Write the three-case merge on paper before writing code. The equal-maximum case is the one that is usually wrong.
3. Decide the sentinel for a missing second maximum. With nonnegative values, $-1$ is enough. Write the assumption in a comment.
4. Write `applyCap`, `push`, and `pull` as three separate functions. The recursion should contain no arithmetic beyond the midpoint.
5. Put the tests in this order: disjoint, maximum prune, full cover with the second-maximum condition, leaf, push, recurse, pull.
6. Test the five boundary cases explicitly: a single element, a full-range cap, a cap above the maximum, a cap below the second maximum, and an array with duplicate maxima.
7. Keep the direct loop as a reference and compare on random small inputs. A disagreement is a counterexample, and a counterexample is worth more than an hour of reading the tree.
8. Check the accumulator width. The sum is the first thing to overflow, and the multiplication $(m_1 - x) \ast c$ is the second.

## Worked problems

### Problem 1: Gorgeous Sequence

**Restatement.** An array of $n$ values is given. Three operations follow: cap every value in $[x, y]$ at $t$, print the maximum of $[x, y]$, and print the sum of $[x, y]$. Constraints: the total number of positions and operations over all test cases reaches one million, the values are below $2^{31}$, and the input is large enough that buffered I/O matters.

**Naive baseline.** Clamp each position in the range and scan the range for each query, at a cost of $O(n)$ per operation.

**Insight.** A cap only moves values above $t$. A node whose maximum is at most $t$ is skipped; a node whose second maximum is below $t$ has only its maximum group moved, which is one subtraction once the count of that group is known. The same fields answer the maximum query directly.

**Derivation.** Store `sum`, `max1`, `max2`, and `count` at every node. The cap recursion is the one in this article. The maximum query is an ordinary range maximum, but it must push pending caps before descending, exactly like the sum query. The sum query is the ordinary range sum with the same push.

**Correctness.** The apply lemma covers the constant-time case, the pull lemma rebuilds the parent, and the push lemma keeps the effective values unchanged. The maximum query is correct because a pending cap can only lower a value, and pushing brings the child's maximum down to the parent's stored maximum before the child is read.

**Complexity.** $O(\log n)$ amortized per cap and $O(\log n)$ per query, with $O(n)$ space and 64-bit sums.

**Common wrong approach.** Using the count of all elements above $t$ rather than the count of the maximum. The count of the maximum is known; the count above an arbitrary threshold is not. The second maximum is what makes the threshold equal to the maximum group's boundary.

### Problem 2: Range Chmin Chmax Add Range Sum

**Restatement.** An array of $n$ values is given. Four operations follow: cap every value in $[l, r]$ at $x$, raise every value in $[l, r]$ to at least $x$, add $x$ to every value in $[l, r]$, and print the sum of $[l, r]$. Constraints: half a million positions and operations, and the sums exceed 32 bits.

**Naive baseline.** Apply each update position by position and scan each query, at a cost of $O(n)$ per operation.

**Insight.** A chmin needs the maximum pair and a chmax needs the minimum pair, and the two are independent summaries of the same range. An addition shifts every value in the range, so it shifts both pairs and the sum by a constant, which composes with the bounds. The node therefore stores the sum, both extreme pairs, both counts, and an additive tag.

**Derivation.** `applyChmin(v, x)` uses the rule of this article and updates the minimum pair only if the node's minimum is also above $x$, which can happen when the node has a single distinct value. `applyChmax` is symmetric. `applyAdd(v, x)` adds $x$ times the length to the sum and shifts all four extreme values by $x$. `push(v)` applies the addition first, then the chmin, then the chmax, because the bounds were recorded after the addition that is already folded into them. The recursions are the usual beats recursions, one for each bound, with a final pull.

**Correctness.** Each tag denotes a function on the values of the node, and the functions compose in the order they were applied. The push applies the parent's function to each child, so the effective values are unchanged. The apply lemma then covers each bound, and the pull lemma rebuilds the summary. The induction is the same as in the chmin-only proof, with the addition as a fourth case that shifts every field.

**Complexity.** $O((n + q) \log^2 n)$ amortized, with $O(n)$ space.

**Common wrong approach.** Pushing the addition without the bounds, or applying the bounds in the wrong order. An addition that lands after a cap must shift the stored cap; a cap that lands after an addition must be compared with the already-shifted maximum. Reversing the order leaves a stale bound that fires on a later operation.

### Problem 3: The Child and Sequence

**Restatement.** An array of $n$ values is given. Three operations follow: print the sum of $[l, r]$, replace every value in $[l, r]$ by its remainder modulo $x$, and assign a single position $k$ the value $x$. Constraints: $1 \le n, m \le 100\,000$, the values are positive, and the answers exceed 32 bits.

**Naive baseline.** Apply the modulo to every position in the range and scan the range for each sum, at a cost of $O(n)$ per operation.

**Insight.** A value $v$ is unchanged by "modulo $x$" exactly when $v < x$. A node whose maximum is below $x$ can therefore be skipped without looking inside. When the maximum is at least $x$, the recursion descends, and every value that actually changes is at least halved. Between two assignments a position can change only $O(\log A)$ times, where $A$ is the largest value.

**Derivation.** Store the maximum and the sum at every node. The modulo update returns immediately when the node's maximum is below $x$, and otherwise recurses into both children and pulls. The point assignment descends to the leaf and pulls on the way back. The sum query is the ordinary range sum. No second maximum is needed, because the skip condition is a comparison with the maximum rather than a union of two groups.

**Correctness.** A node with maximum below $x$ has every value below $x$, so the modulo is the identity on its whole range. Otherwise the recursion applies the modulo to each child, and the pull recomputes the sum from the children. The assignment writes one leaf and repairs its ancestors. The sum query merges disjoint blocks, so each value is counted once.

**Complexity.** A modulo descends only where some value is at least $x$, and each such value is halved. Each position is halved $O(\log A)$ times between assignments, so the total work is $O((n + m) \log n \log A)$, with $O(n)$ space.

**Common wrong approach.** Using the sum instead of the maximum as the skip test. A small sum does not imply that every value is below $x$: one large value can hide behind many small ones, and the modulo would be skipped on a range that still contains it.

## Practice progression

1. **Recognition.** Given a statement, decide whether the update is uniform (addition, assignment) or value-dependent (cap, floor, modulo). Uniform updates belong to lazy propagation; the value-dependent ones are where beats begins.
2. **Direct application.** Implement the chmin-only tree with the four fields, verify it against a direct loop on small random arrays, and print the tree after each operation to see where the cap stops.
3. **Adaptation.** Change the aggregate to a maximum and then to a minimum. Notice that the maximum query needs the same push as the sum query, while a maximum-only tree with a lazy cap tag does not need the second maximum at all.
4. **Combination.** Add a point assignment and a range addition to the same tree, and check the order in which the tags are pushed.
5. **Challenge.** Implement the full chmin/chmax/add tree, then solve the modulo problem with the maximum-pruned recursion and compare the two amortized arguments.
6. **Transfer.** Put the beats tree on a heavy-light decomposition and answer path caps with subtree sums. Then replace the tree by a sorted-block decomposition and compare the constants on the same input.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What do the four fields of a node mean, and which one is a count of positions rather than a value? (Formal model)
2. Why is the threshold for absorbing a cap the second maximum and not the minimum? (Key insight)
3. Why can a cap not be stored as a single lazy tag when the query is a sum? (Problem motivation)
4. State the three cases of the pull and say why the equal-maximum case takes the larger of the two second maxima. (Algorithm derivation)
5. Why must a query push before descending, and why does a fully covered query not need to? (Algorithm derivation)
6. Give two multisets with the same four fields whose caps at the same bound have different sums. (Formal model)
7. What is the potential in the amortized argument, and why does a fully covered descent decrease it? (Complexity analysis)
8. What changes when the update is a modulo instead of a cap? (Worked problems)
9. When is a lazy cap tag enough without the second maximum? (Algorithm selection)
10. Why is the recursion safe in Python, and what would make it unsafe? (Recursion decision)

## Further reading

- The structure underneath the technique is the [segment tree](/algorithms/range-queries/segment-tree), which explains the layout, the merge, and the monoid requirements.
- The technique that handles uniform updates with deferred tags is [lazy propagation](/algorithms/range-queries/lazy-propagation), and its article explains why a cap is the first update that escapes it.
- The structure that answers point updates and range sums with less memory is the [Fenwick tree](/algorithms/range-queries/fenwick-tree); it cannot answer a cap at all.
- The block decomposition that trades a square root for simplicity is [square-root decomposition](/algorithms/range-queries/sqrt-decomposition), and it is the fallback when a beats tree is too error-prone under time pressure.
- The tree decomposition that turns a path into a logarithmic number of ranges is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition), and it is the usual place where a beats tree meets a tree problem.
