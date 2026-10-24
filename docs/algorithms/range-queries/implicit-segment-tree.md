---
id: range-queries.implicit-segment-tree
title: Implicit segment trees
summary: Allocate a segment tree node only when an update reaches its interval, so a domain of a billion positions costs memory proportional to the operations instead of the domain.
division: [platinum]
subjects: [range-queries]
level: advanced
importance: specialized-technique
keywords:
    [
        implicit segment tree,
        dynamic segment tree,
        sparse segment tree,
        node pool,
        point update,
        range sum,
    ]
prerequisites:
    required: [range-queries.segment-tree, foundations.complexity]
    recommended: [range-queries.fenwick-tree, arrays.coordinate-compression]
complexity:
    time: "O(log C) per operation"
    space: "O(k log C) for k touched positions"
assumptions:
    - The coordinate domain is a fixed interval [1, C], and C may be far larger than the number of operations.
    - Every position starts at the identity value, so a node that was never created stands for a range whose values are all zero.
    - The operations are point additions and range sums; a range assignment or a range addition needs the lazy variant.
implementations: range-queries.implicit-segment-tree
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="range-queries.implicit-segment-tree" />

<CodeViewer algorithm="range-queries.implicit-segment-tree" />

An implicit segment tree is a [segment tree](/algorithms/range-queries/segment-tree) that creates a node only when an update first reaches the node's interval. The domain can be a billion positions, and the structure still uses memory proportional to the number of positions that were actually touched, not to the size of the domain.

The trick is not a different tree shape. The root still covers the whole domain, an internal node still splits its interval in half, and a query still merges the totals of the nodes it fully covers. The difference is that a child which was never needed is simply absent, and an absent child is known to represent a range whose values are all zero.

That single convention is what makes the structure work. A missing node is not an unknown value. It is the identity of the combining operation, so the query can return it without visiting anything below it.

The cost is logarithmic per operation and logarithmic per touched position in memory. The price is a requirement that the initial state be uniform, because the structure cannot skip a range whose values are not all the identity.

## Problem motivation

A ticket office sells seats in a stadium with one billion numbered seats. The office processes a stream of events. An event either sells or returns one seat, which changes the number of occupied seats at that position, or asks how many seats in a range are occupied.

The constraints are the whole problem.

- The seat numbers run from $1$ to $10^9$.
- There are up to $200\,000$ events.
- Every query names an inclusive range $[l, r]$.
- The answer to a query can reach $200\,000$, which fits in 32 bits, but the same program should also handle sums of weights that reach $2 \cdot 10^{14}$.

A plain array of one billion counters is 4 GB even with 32-bit counters, and 8 GB with the 64-bit counters that a weighted version would need. A full segment tree is worse: the usual $4C$ layout allocates four billion nodes, and at 16 bytes per node that is 64 GB. Neither structure is close to a contest memory limit.

The events, however, are few. At most $200\,000$ positions are ever updated, so at most $200\,000$ root-to-leaf paths are ever needed. Each path has about $30$ nodes, which gives roughly $6$ million nodes in the worst case, and most shared prefixes mean the real count is smaller. That gap between the size of the domain and the size of the work is exactly what an implicit tree exploits.

There is a second way to close the gap: read all events first, collect the coordinates that appear, and compress them. That works when the whole input is available before the first answer, and it is often the better choice. The implicit tree is for the online case, when queries must be answered as they arrive, or when the coordinates are not known until they are seen.

## Recognition patterns

An implicit segment tree is the right tool when all of the following hold.

- The coordinate domain is **large and fixed**: $10^9$, $10^{12}$, or the range of a 64-bit integer.
- The operations arrive **online**, or reading the whole input first is inconvenient.
- The **initial state is uniform**: every position is zero, empty, unripe, or whatever identity the aggregate uses.
- The updates are **point updates**, and the queries are **range queries**, or the updates are ranges that can be handled by the lazy variant.
- The number of touched positions is **small** compared with the domain.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $C \le 10^6$ and most positions are touched | An ordinary array-backed segment tree is faster and more cache-friendly |
| Every coordinate is known before the first query | Coordinate compression gives a smaller, simpler tree |
| The initial values are arbitrary and must be read | The input itself has $C$ values, so the domain is not really implicit |
| The queries ask for a maximum or a minimum on an empty range | Choose an identity that makes the absent node correct, such as $-\infty$ |
| The updates assign a value to a whole range | The lazy variant is required; a plain implicit tree loses the assignment |
| The number of operations is tiny and the domain is small | A plain array is enough |
| The query asks for the $k$-th smallest value | An implicit tree over the value domain works, and so does an order-statistic tree |

The phrases that signal this technique are "the positions are numbered up to $10^9$", "the values are up to $10^{12}$", and "answer the queries online". The phrase that rules it out is "the initial array is given", followed by a list of a billion values, because then the input alone is too large.

<Synonyms terms="implicit segment tree, dynamic segment tree, sparse segment tree, node pool" />

## Naive approach

The baseline allocates one leaf per position.

```cpp
std::vector<long long> value(c + 1, 0);

void add(int pos, long long delta) {
    value[pos] += delta;
}

long long rangeSum(int left, int right) {
    long long total = 0;
    for (int i = left; i <= right; ++i) {
        total += value[i];
    }
    return total;
}
```

The update is $O(1)$ and the query is $O(C)$. With $C = 10^9$ the array does not fit, and even if it did, a single full-range query would take a billion additions.

The second baseline is the ordinary segment tree stored in an array of $4C$ nodes. It answers both operations in $O(\log C)$ time, and it is the structure that this article modifies. The allocation is the problem, not the algorithm:

```cpp
std::vector<long long> tree(4LL * c, 0);
```

For $C = 10^9$ that constructor asks for four billion entries, which is 32 GB. On a 64-bit machine the allocation may succeed and then the process is killed by the memory limit; on a 32-bit index the multiplication overflows before the allocation is even attempted.

The third baseline is coordinate compression. Read every event, collect every position that an update touches and every endpoint that a query names, sort the coordinates, and replace each coordinate by its rank. A Fenwick tree or a segment tree over the ranks then costs $O(q \log q)$ memory, which is better than the implicit tree in practice.

Compression is not always available. The statement may require online answers, the input may arrive through an interactive protocol, or the coordinates may be generated from the previous answer. In those cases the set of coordinates is not known when the first query has to be answered, and the implicit tree is the structure that does not need to know it.

## Key insight

The insight has two halves.

**First half.** A node that was never created covers a range in which no update has ever happened. Every value in that range is still zero, so the total of the range is zero. The tree does not need the node to answer a query over it; it needs only the convention that a missing node means zero.

**Second half.** Creating a node is confined to the path that an update follows. A point update descends from the root to one leaf, so it can create at most one node per level. If the tree has height $h$, an update creates at most $h$ nodes, and the total after $q$ updates is at most $1 + qh$.

The first half is what makes the missing node meaningful. The second half is what makes the memory linear in the number of operations rather than in the domain.

Take the domain $[1, 8]$ and perform two updates: add $5$ at position $3$, then add $2$ at position $6$. The tree starts with only the root. The first update walks the left spine

$$
[1,8] \to [1,4] \to [3,4] \to [3,3],
$$

and the second walks

$$
[1,8] \to [5,8] \to [5,6] \to [6,6],
$$

creating the three new nodes on that path. After both updates there are seven nodes: the four nodes on the first path, with the root included, and the three new nodes on the second path. The nodes $[1,2]$, $[4,4]$, $[5,5]$, and $[7,8]$ were never created, and every one of them holds only zeros.

A full tree over eight positions has fifteen nodes. The implicit tree has seven. The difference grows with the domain: over $10^9$ positions a full tree has about two billion nodes, while two hundred thousand updates create at most about six million.

## Visual intuition

The tree below shows the same eight-position example. A box is an allocated node, and `null` marks an absent child, which is not stored at all.

```text
                     [1, 8] 7
                    /        \
              [1, 4] 5      [5, 8] 2
              /      \       /      \
           null    [3, 4] 5 [5, 6] 2  null
                    /  \      /  \
               [3, 3] 5 null null [6, 6] 2
```

Every allocated node lies on a root-to-leaf path that some update has walked. The missing nodes are exactly the ranges that no update has entered, and their totals are zero.

The shape has two useful properties. First, a path is shared by every update that falls into the same half of the domain, so the number of nodes grows much more slowly than the number of updates when the updates cluster. Second, a query that lands entirely inside a missing node stops at the missing node and returns zero, so the query never has to trace the absent subtree.

Draw the same picture for a domain of $10^9$. The root splits into two halves of $5 \cdot 10^8$, each half splits again, and after about thirty splits the intervals are single positions. A single update therefore draws a path of about thirty-one boxes, and the other two billion boxes in the full tree are never drawn.

## Formal model

Let $C$ be the size of the domain. The positions are $1, 2, \ldots, C$, and every position starts at zero.

::: math definition Definition
An **implicit segment tree** over $[1, C]$ is a binary tree whose nodes are created on demand. A node $v$ owns an interval $[\ell_v, r_v]$ and stores a value $\operatorname{sum}(v)$, together with the indices of its left and right children. The index $0$ is reserved for the **null node**, which has no interval and always has $\operatorname{sum}(0) = 0$.
:::

::: math definition Definition
A child of an allocated node is **absent** when its index is $0$. The interval that the absent child would cover is still well defined by the split of its parent, even though no node stores it.
:::

::: math definition Definition
The **height** of the tree is the number of edges on the longest root-to-leaf path. For a domain of size $C$ it is

$$
h = \left\lceil \log_2 C \right\rceil .
$$
:::

::: math invariant Invariant
For every allocated node $v$, $\operatorname{sum}(v)$ equals the total of the current values at the positions in $[\ell_v, r_v]$. For every absent child of an allocated node, every value in the interval that the child would cover is zero.
:::

The invariant is the whole contract. The first sentence says that an allocated node is always correct. The second says that skipping an absent node is always safe.

::: math lemma Lemma
If a node is absent, the total of the values in its interval is zero.
:::

::: math lemma Lemma
After $q$ point updates, an implicit segment tree over $[1, C]$ has at most

$$
1 + 1 + q \left( \left\lceil \log_2 C \right\rceil + 1 \right)
$$

allocated nodes, counting the null node and the root.
:::

The first lemma is proved by construction: a node is created only when an update enters its interval, and an update that would make a value in that interval nonzero must enter it. The second follows from the fact that each update walks one root-to-leaf path, and a path has at most $h + 1$ nodes.

## Algorithm derivation

The state is a node pool, a root index, and a counter of the next free index. Index $0$ is the null node and is never written after initialization. The root is created before any operation and covers $[1, C]$.

The update rule for adding $\delta$ at position $p$ is a recursive descent.

```text
add(v, lo, hi, p, delta):
    sum[v] += delta
    if lo == hi:
        return
    mid = lo + (hi - lo) / 2
    if p <= mid:
        if left[v] == 0:
            left[v] = new_node()
        add(left[v], lo, mid, p, delta)
    else:
        if right[v] == 0:
            right[v] = new_node()
        add(right[v], mid + 1, hi, p, delta)
```

The sum is increased at every node on the path, including the root and the leaf. Every one of those nodes covers $p$, so every one of them must see the change. A node that is not on the path does not cover $p$, so its total does not change.

The query rule for the inclusive range $[ql, qr]$ is the usual segment tree recursion, with one extra line at the top.

```text
query(v, lo, hi, ql, qr):
    if v == 0 or qr < lo or hi < ql:
        return 0
    if ql <= lo and hi <= qr:
        return sum[v]
    mid = lo + (hi - lo) / 2
    total = 0
    if ql <= mid:
        total += query(left[v], lo, mid, ql, qr)
    if qr > mid:
        total += query(right[v], mid + 1, hi, ql, qr)
    return total
```

The guard `v == 0` is the only difference from a full tree, and it is what makes the structure work. It returns the identity for the missing range without allocating anything.

The order of the two statements in the update matters. A child must be created before the recursive call, because the call needs a valid index. The sum can be updated either at entry or on the way back out; updating at entry is shorter because it does not need a pull-up after the recursive call, and it is correct because the parent's new total is the old total plus the same delta that the child receives.

The query must never create a node. A query is a read, and turning a read into a write would make the memory proportional to the ranges that were queried rather than to the positions that were updated. The next section shows how badly that choice fails.

## Step-by-step execution

Continue with the domain $[1, 8]$ and the two updates from the key insight.

1. The tree starts with the root $[1,8]$ and $\operatorname{sum} = 0$. The root is the only allocated node.
2. Add $5$ at position $3$. The root becomes $5$, the child $[1,4]$ is created with $5$, the child $[3,4]$ is created with $5$, and the leaf $[3,3]$ is created with $5$. The other child of each split stays absent.
3. Add $2$ at position $6$. The root becomes $7$, the child $[5,8]$ is created with $2$, the child $[5,6]$ is created with $2$, and the leaf $[6,6]$ is created with $2$.
4. Query $[1,8]$. The root is fully covered, so the answer is $\operatorname{sum}(\text{root}) = 7$.
5. Query $[3,4]$. The root is partial, $[1,4]$ is partial, and $[3,4]$ is fully covered. The answer is $5$.
6. Query $[1,2]$. The root is partial, $[1,4]$ is partial, and the child $[1,2]$ is absent. The answer is $0$.
7. Query $[5,8]$. The root is partial and $[5,8]$ is fully covered. The answer is $2$.
8. Add $-5$ at position $3$. The path $[1,8] \to [1,4] \to [3,4] \to [3,3]$ is walked, and the four totals become $2, 0, 0, 0$. The node $[3,4]$ still exists even though its total is zero; the structure never deletes nodes.
9. Query $[3,3]$ returns $0$, and query $[1,8]$ returns $2$.

The table records the allocation after each update.

| Operation       | Nodes created         | Root total |
| --------------- | --------------------- | ---------- |
| Start           | root $[1,8]$          | 0          |
| Add $5$ at $3$  | $[1,4], [3,4], [3,3]$ | 5          |
| Add $2$ at $6$  | $[5,8], [5,6], [6,6]$ | 7          |
| Add $-5$ at $3$ | none                  | 2          |

For $C = 10^9$ the same walk has about thirty splits instead of three. Position $3$ stays in the left half at every split until the interval is $[1,4]$, then moves right into $[3,4]$, then left into $[3,3]$. The exact sequence of intervals is determined by the midpoint rule, and the number of nodes is the height plus one.

## Correctness proof

::: math theorem Theorem
After every sequence of point additions, the invariant holds, and every range query returns the sum of the values in the requested range.
:::

::: math proof Proof
The proof is an induction on the operations.

Before any operation, the tree contains the root and the null node. Every value is zero, so the root's stored sum is correct and the second sentence of the invariant holds vacuously for the absent children of the root.

Suppose the invariant holds before an update that adds $\delta$ at position $p$. The update walks from the root toward the leaf for $p$. At every allocated node on the path, the interval contains $p$, so the invariant says the stored sum was the total of that interval before the update, and adding $\delta$ makes it the total after the update. If a child on the path is absent, the update creates it with sum zero before adding $\delta$; the interval of that child contains $p$, so the new sum $\delta$ is correct. A child that is not on the path is not visited. Its interval does not contain $p$, so none of its values changes, and its stored sum or its absence remains correct. The invariant is preserved.

Now consider a query. The recursion has three cases. If the node is null, the first lemma says the total of its interval is zero, which is what the query returns. If the node's interval is fully inside the query, the invariant says the stored sum is exactly the requested total. Otherwise the interval is split into its two children, which partition it, and the query adds the results of the children that overlap the requested range. By induction on the height, each recursive call returns the correct total for its part, and the parts are disjoint, so the sum is the total over the whole intersection. The range query is the union of the covered pieces, so its answer is the sum of the requested range.
:::

The proof relies on two facts that the implementation must preserve. A node is created only on an update path, which is what makes the absent-node lemma true. A query never creates a node and never writes a sum, which is what keeps the invariant true while answering. An implementation that allocates during a query can still be correct, but it loses the memory bound, and the next section treats that as a failure rather than a variant.

## Complexity analysis

**Each update: $O(\log C)$.** The descent halves the interval at every step, so it has at most $h + 1 = \lceil \log_2 C \rceil + 1$ levels. It creates at most one node per level and does constant work per node.

**Each query: $O(\log C)$.** A range query on a segment tree visits at most two boundary nodes per level and fully covers the nodes between them. The number of visited nodes is $O(h)$, and for a fixed number of levels it is bounded by $4h$. The null guard only removes work.

**Space: $O(1 + q \log C)$.** The null node and the root are constant, and each of the $q$ updates creates at most $h$ nodes. The bound counts the worst case in which no paths are shared; sharing only lowers it. With $q = 200\,000$ and $C = 10^9$, the bound is about $6.2$ million nodes.

**Bytes per node.** Two 32-bit child indices and one 64-bit sum occupy 16 bytes with natural alignment. At $6.2$ million nodes that is about 99 MB, which fits a 256 MB limit but not a 64 MB one. Replacing the 64-bit sum with a 32-bit one reduces each node to 12 bytes, about 74 MB, which still does not fit a 64 MB limit. When the limit is tight and the input is offline, compression is the better answer.

::: math complexity Complexity
An implicit segment tree over a domain of size $C$ performs a point update or a range query in $O(\log C)$ time, stores $O(1 + q \log C)$ nodes after $q$ updates, and needs no build time beyond creating the root.
:::

The width of the sum is part of the complexity statement, just as it is for a Fenwick tree. With $q = 200\,000$ updates of magnitude $10^9$, a total can reach $2 \cdot 10^{14}$, which does not fit in a signed 32-bit integer. The C, C++, Java, and Pascal listings use a 64-bit sum. JavaScript uses a Number, which is exact for integers below $2^{53}$, and Python integers are unbounded.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Small dense domain, many operations | Array-backed segment tree |
| All coordinates known before the first answer | Coordinate compression plus a Fenwick tree or segment tree |
| Large domain, online point updates and range sums | Implicit segment tree |
| Large domain, online range assignment and range sums | Implicit tree with lazy propagation |
| Large domain, only point updates and point queries | Hash map from position to value |
| Large value domain, order statistics or the $k$-th smallest | Implicit tree over values, or an order-statistic tree |
| Range $k$-th smallest with historical versions | Persistent segment tree, which is an implicit tree with shared nodes |
| Two-dimensional updates on a huge grid | Dynamic two-dimensional tree, or an offline sweep |
| The initial array is given in full | The domain is not sparse; use the ordinary structure |

The choice between compression and an implicit tree is a choice about when the coordinates become known. If the whole input can be read before the first output, compression wins on memory and constant factors. If the queries must be answered online, compression would require predicting future coordinates, and the implicit tree is the structure that does not.

The choice between an implicit tree and a Fenwick tree is a choice about the operation. A Fenwick tree needs an invertible operation, so it handles sums but not maxima. An implicit tree inherits the segment tree's flexibility: any associative operation with an identity can be stored, and the identity is what an absent node returns.

## Reference implementations

The manifest publishes one `program` variant for each of the six languages: C, C++17, Java, JavaScript, Pascal, and Python. Every variant implements the same stdin and stdout contract.

- The first line holds `m q`, where `m` is the size of the domain and `q` is the number of operations.
- An operation `1 p v` adds `v` to the 1-based position `p`.
- An operation `2 l r` prints the sum of the inclusive range `[l, r]`.
- Every position starts at zero, so no initial array is read.
- Exactly one line is printed for every query, in the order the queries appear.

The programs keep the node pool in three parallel arrays: the left child, the right child, and the sum. Index $0$ is the null node. A new node is appended only when an update descends into an absent child, and a query returns zero immediately when it reaches the null node. The C, C++, Java, and Pascal variants size or reserve the pool from `q` and the height of the domain; the Python and JavaScript variants grow it as nodes are created.

Every variant prints the same sequence of values, one per line, and nothing in the contract depends on the language, the pool layout, or whether the pool is preallocated.

## Recursion decision

The tree recurses, and the recursion depth is the height of the domain.

For $C = 10^9$ the height is $30$. For $C = 10^{18}$ it is $60$. Both are far below the default stack limits of every language in the repository's set, so the recursive formulation is safe. It is also the shortest way to express the invariant: the update descends one path, and the query splits into the two children that partition the current interval.

| Language | Default recursion limit | Verdict for a height of at most 60 |
| --- | --- | --- |
| C and C++ | The process stack, typically several megabytes | Recurse; a frame is tens of bytes |
| Java | About 512 KB to 1 MB of stack | Recurse; sixty frames are far below the limit |
| Python | 1000 frames by default | Recurse; sixty frames are safe, and raising the limit is unnecessary |
| Pascal | The process stack | Recurse; the same argument applies |
| JavaScript | Several thousand frames in current engines | Recurse; sixty frames are safe |

An iterative version is possible and is worth knowing. A point update can descend with a loop while recording the visited node indices in a small array, then walk the array backward to repair the sums. A range query can keep an explicit stack of `(node, lo, hi)` triples. Both versions replace the call stack with a heap array and are longer than the recursive version for no gain at these depths.

The recursion is not a place to be clever. The depth is logarithmic, the branching is two, and the work per frame is a constant number of arithmetic operations. The recursive form is the one to write.

## Implementation walkthrough

Five details decide whether the implementation is correct and fits in memory.

**The null sentinel.** Index $0$ must never be a real node. Initialize `used = 1`, allocate the null node at index $0$, then create the root at index $1$. A fresh child index of $0$ is then unambiguously absent, and `sum[0]` is zero. If the first real node is also index $0$, the null check and the root collide and the query returns zero for the whole tree.

**The pool capacity.** The number of nodes that an update can create is at most the height, because the root already exists. With $h = \lceil \log_2 C \rceil$, a safe bound is $2 + q(h + 1)$ nodes including the null node and the root. The extra term costs almost nothing and removes an off-by-one at the deepest level.

**Creating before descending.** The child must be allocated before the recursive call, because the call takes the child index. The sum of the parent is updated on entry, so the parent is already correct when the recursion returns and no separate pull-up is needed.

```cpp
void add(int v, int lo, int hi, int p, long long delta) {
    sum[v] += delta;
    if (lo == hi) return;
    int mid = lo + (hi - lo) / 2;
    if (p <= mid) {
        if (left[v] == 0) left[v] = newNode();
        add(left[v], lo, mid, p, delta);
    } else {
        if (right[v] == 0) right[v] = newNode();
        add(right[v], mid + 1, hi, p, delta);
    }
}
```

**The query guard.** The first line of the query must be the null check together with the disjointness check. The order does not matter, because both return zero, but neither can be omitted. Without the null check the query dereferences index $0$; without the disjointness check the query visits nodes outside the requested range.

**The midpoint.** Write `lo + (hi - lo) / 2`, not `(lo + hi) / 2`. For a domain near the top of the 32-bit range, the second form overflows before the division. The domains in this article are at most $10^9$, so the sum fits, but the habit costs nothing and protects the version that is extended to 64-bit coordinates.

The six programs also share a reading convention. They read all tokens, or read one value at a time, and they do not attempt to detect the end of the input beyond the stated count. A malformed stream is a broken test, not a case the algorithm has to survive, so the input contract is trusted at the boundary and every value inside the domain is used as given.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Allocating $4C$ nodes for the full tree | The allocation is tens of gigabytes | Allocate only the nodes that updates create |
| Using index $0$ for the root and for the null node | The query returns zero for the whole tree | Reserve $0$ for null and start real nodes at $1$ |
| Creating children on every query descent | A single query can materialize the whole domain | Return zero at a null node and never allocate in a query |
| Forgetting to create a child before recursing | The call receives index $0$ and writes to the null node | Create the child immediately before the call |
| Updating only the leaf | The root and the internal nodes keep stale totals | Add the delta at every node on the path |
| Using a 32-bit sum | Totals above $2.1 \cdot 10^9$ wrap silently | Use a 64-bit sum from the start |
| Computing the midpoint as `(lo + hi) / 2` | The sum overflows for domains near the integer limit | Use `lo + (hi - lo) / 2` |
| Reusing a deleted node without clearing its children | A later query follows a stale pointer into the wrong range | Delete nothing, or clear both child indices on reuse |
| Treating an implicit tree as the $2i$ / $2i+1$ array layout | The two meanings of "implicit" are different | This article allocates on demand; the array layout is a full tree |
| Adding a range assignment without a lazy tag | A later partial update loses the assigned value | Use the lazy variant and push the tag before descending |

### Why this fails: allocating during a query

The most tempting mistake is to make the query "complete" the tree. When the recursion reaches an absent node, the reasoning goes, the node must represent a range, so create it and continue. The code is easy to write and it returns the right answer, which is why the failure survives testing.

Take the domain $[1, 8]$ and an empty tree. Query the whole range with the allocating version. The root is present, so the query descends into both children, creates them, then creates their children, and stops only at the leaves. The query allocates all fifteen nodes of the full tree to discover that every value is zero.

The smallest counterexample is therefore the empty tree with one full-range query. The correct implementation returns zero at the root's absent children without descending. The allocating implementation returns zero too, but it has already paid for the whole tree. At $C = 10^9$ that is about two billion nodes, and the program runs out of memory before it prints the answer.

The fix is one line: check `v == 0` at the top of the query and return the identity. The structure is a read-only view of the allocated part during a query, and only an update may extend it.

### Why this fails: compressing coordinates online

A second plausible shortcut is to assign each new coordinate the next rank as it arrives, and to keep a Fenwick tree over the ranks. This is not coordinate compression; it is insertion order, and the ranks do not respect the coordinate order, so a range query over coordinates cannot be translated into a range of ranks.

Even the version that re-sorts the coordinates after every insertion fails. Suppose the first update is $5$ at coordinate $5$, and the second is $3$ at coordinate $3$. After the first update, coordinate $5$ has rank $1$ and its value sits at rank $1$. After the second update, the sorted order is $3, 5$, so coordinate $3$ should be rank $1$ and coordinate $5$ should be rank $2$. The stored value $5$ is still at rank $1$, but a query for coordinate $3$ now maps to rank $1$ and returns $5$ instead of $3$.

The repair is to collect every coordinate before assigning any rank. That is exactly what an offline solution does, and it is a fine solution when the input allows it. When the input does not allow it, the implicit tree keeps the original coordinates as the keys and never renumbers them, which is why it does not have this failure mode.

### Why this fails: a range assignment without a tag

A plain implicit tree can only add to one position at a time. If a range assignment is implemented by setting the sum of a fully covered node to `value * length` and stopping, a later partial update loses the assignment. Take $C = 2$, assign $5$ to $[1, 2]$, then add $-1$ at position $1$. The root's sum is $10$ and no tag records why. The partial update descends into the children, which are absent and therefore zero, adds $-1$ to the left child, and the root becomes $9$. The correct total is $5 + 5 - 1 = 9$, so this step happens to agree, but a query for $[2, 2]$ descends to an absent right child and returns $0$ instead of $5$. The assignment was stored only at the root and was never propagated. The fix is the lazy tag described in the variants section.

## Variants and extensions

- **Lazy propagation.** A node stores a pending operation in addition to its sum. A range assignment sets the sum to the value times the length and records the value; a range addition records the delta. Before descending into a partial overlap, the tag is pushed into the children, creating them if necessary. The node count stays $O(q \log C)$, and the per-operation time stays $O(\log C)$.
- **Persistent implicit trees.** Each update copies the nodes on its path instead of modifying them, and returns a new root. Untouched subtrees are shared between versions, so the structure becomes a persistent segment tree with $O(q \log C)$ total nodes and $O(\log C)$ new nodes per update.
- **Segment tree merging.** Two implicit trees over the same domain can be merged by recursively merging their roots. The cost is proportional to the number of overlapping allocated nodes, which is useful for small-to-large merging over a tree of sets.
- **Two-dimensional implicit trees.** An outer implicit tree over the first coordinate stores an inner implicit tree at each allocated node. A point update touches $O(\log^2 C)$ nodes and a rectangle query visits $O(\log^2 C)$ nodes, with memory proportional to the number of touched grid points times the logarithm squared.
- **Implicit trees over values.** The domain is the value range instead of the index range, and each node stores a count and a sum. The structure answers order-statistic queries, prefix counts, and the sum of the values at most $x$, which is the shape used by the salary problem below.
- **A sparse Fenwick tree.** A hash map can store the Fenwick tree entries that are touched, and the two walks read missing entries as zero. It has the same asymptotic time and memory, but worse constants and no support for a non-invertible operation. It is a useful fallback when only sums are needed.
- **Coordinate compression.** When every coordinate is known in advance, compression plus a dense Fenwick tree or segment tree is smaller and faster. The article on [coordinate compression](/algorithms/arrays/coordinate-compression) covers the transformation.
- **The other "implicit" tree.** Some authors call the array-backed layout with children at $2i$ and $2i+1$ an implicit segment tree, because the child links are computed rather than stored. That layout is a full tree. The name in this article follows the dynamic, sparse meaning used by the taxonomy.

## Contest strategy

1. Read the domain size and the number of operations before choosing a structure. If $4C$ nodes fit in memory, the ordinary tree is simpler and faster.
2. If the whole input can be read first, consider coordinate compression. It produces a smaller tree and avoids the node pool entirely.
3. If the answers must be online and the domain is large, choose the implicit tree and compute the height with a loop that doubles a bound until it reaches $C$.
4. Reserve index $0$ for null, create the root, and size the pool from $q$ and the height. Growth by doubling is also fine, but it must not change the meaning of an index.
5. Use a 64-bit sum. Compute the largest possible total from the constraints rather than assuming that the values are small.
6. Test the boundaries explicitly: an update at position $1$, an update at position $C$, a query of the whole domain, a query of one position, and a query before any update.
7. Test a negative update and a position that returns to zero. The node stays allocated, and the answer must still be correct.
8. Keep a brute-force version for small domains and compare on random inputs. A disagreement is a counterexample, and a counterexample is worth more than another reading of the code.
9. If the statement mentions a range assignment or a range addition, add the lazy tag before writing the rest of the solution. Retrofitting a tag after the point-update version works, but it is easier to test the tag from the start.
10. Measure the memory with the actual node count, not with the bound. Add a counter of allocations and print it during local testing; if the count is far below the bound, the domain is clustered and the pool can be smaller.

## Worked problems

### Problem 1: salary queries

**Restatement.** A company has $n$ employees, each with a salary. Process $q$ events. An event either changes one employee's salary to a new value, or asks how many employees have a salary in the inclusive range $[a, b]$. Constraints: $1 \le n, q \le 200\,000$ and every salary is at most $10^9$.

**Naive baseline.** Scan all employees for every count query, which costs $O(nq)$ and is $4 \cdot 10^{10}$ inspections in the worst case.

**Insight.** The tree is indexed by salary, not by employee. Each employee contributes one at the current salary, a change removes one count from the old salary and adds one at the new salary, and a query is a range sum over salaries.

**Derivation.** Build an implicit tree over $[1, 10^9]$ with a 64-bit or 32-bit count in each node. On a change, add $-1$ at the old salary and $+1$ at the new one. On a query, return the sum over $[a, b]$. The salary domain is large, but only the salaries that actually appear are ever inserted, so the tree stores $O((n + q) \log 10^9)$ nodes.

**Correctness.** Each employee contributes exactly one to the count at the salary they currently hold, so the total over an interval of salaries is exactly the number of employees whose salary lies in that interval. The point updates maintain that contribution when a salary changes.

**Complexity.** $O(\log 10^9)$ per event, $O((n + q) \log 10^9)$ nodes.

**Common wrong approach.** Adding the new salary without removing the old one, which double-counts the employee. A second wrong approach is to query by employee index instead of salary, which answers a different question.

### Problem 2: monkey and apple-trees

**Restatement.** A row of apple trees is numbered up to $10^9$. An operation either paints every tree in an interval as ripe, or asks how many trees in an interval are ripe. Every tree starts unripe.

**Naive baseline.** Keep one flag per tree. The array does not fit, and painting or counting an interval touches up to $10^9$ positions.

**Insight.** An absent node is a range in which no paint has ever happened, so every tree in it is unripe. A paint that fully covers a node can mark the whole node ripe in constant time, and a later partial paint must push that mark into the children.

**Derivation.** Each node stores the number of ripe trees in its interval and a tag that is either "no pending paint" or "the whole interval is ripe". A paint over a fully covered node sets the count to the interval length and records the tag. A partial paint pushes the tag to both children, creating them if needed, then recurses. A query returns the count of a fully covered node, the sum of the children for a partial overlap, and zero for an absent node.

**Correctness.** The tag says that every position in the node's interval is ripe. Pushing it to the children applies the same fact to each half, so no ripe tree is lost. The count of a fully covered node is the length of its interval, which is exactly the number of ripe trees in it. The query adds disjoint covered pieces, so it returns the exact count.

**Complexity.** $O(\log 10^9)$ per operation, with $O(q \log 10^9)$ nodes for $q$ operations.

**Common wrong approach.** Painting a range by descending to every leaf, which materializes the range and defeats the purpose of the implicit tree. A second wrong approach is to omit the tag and set only the sum of the covered node; the next partial paint loses the assignment, as the earlier failure passage shows.

### Problem 3: happiness

**Restatement.** Maintain a multiset of positive integers. The operations insert a value, erase one copy of a value, and test whether there is a value $x$ smaller than the total sum of the multiset such that the sum of the elements at most $x$ is smaller than $x$. The values reach $10^{12}$, and the operations are online. The original task is a library problem, so the grader calls the solution's functions rather than feeding one stdin stream.

**Naive baseline.** Keep a sorted list and scan it for every test. Insertion costs $O(n)$ and the test costs $O(n)$, which is too slow for a large number of operations.

**Insight.** Store the count and the sum of the values in a tree over the value domain. A prefix query returns both the number of elements at most $x$ and their total, and the test can skip a whole interval of candidates at once.

**Derivation.** Start at $x = 1$. Query the prefix sum $P(x)$. If $P(x) \ge x$, then every value $y$ in the interval $(x, P(x)]$ also satisfies $P(y) \ge y$, because enlarging the prefix can only increase its total. The next candidate worth testing is therefore $P(x) + 1$. If $x$ reaches the total sum of the multiset without a failure, no such value exists. The candidate sequence grows geometrically, so the test makes $O(\log V)$ prefix queries.

**Correctness.** The skip argument is the key: if the condition holds at $x$, it holds for every $y \le P(x)$, since $P(y) \ge P(x) \ge y$. Testing only the values just after each prefix total therefore cannot miss a counterexample. If the walk reaches the total sum without finding one, every value below the total has been covered by a skipped interval, so none exists.

**Complexity.** $O(\log V)$ per insertion or erasure, $O(\log^2 V)$ per test, and $O(q \log V)$ nodes for $q$ operations, where $V = 10^{12}$.

**Common wrong approach.** Testing only $x = 1$, or scanning every distinct value, which is linear in the number of distinct values. A second wrong approach is to store only counts; the skip argument needs the sum as well.

## Practice progression

1. **Recognition.** Given a statement, decide whether the domain is too large for a dense array and whether the coordinates are known in advance. The answer chooses between compression and an implicit tree.
2. **Direct application.** Implement the point addition and the range sum from this article, and verify them against a brute-force array on random small domains. Include a query before the first update and an update at the last position.
3. **Adaptation.** Replace the sum with a maximum, using $-\infty$ as the identity of an absent node, and then with a count, using zero. Check that the absent-node convention still returns the right identity.
4. **Combination.** Add lazy assignment and solve the apple-tree problem. Then add lazy addition and confirm that assignment and addition compose in the right order.
5. **Challenge.** Build a persistent version that keeps a root per prefix of the input and answers range $k$-th smallest queries. The nodes are shared, so the memory is still $O(n \log V)$.
6. **Transfer.** Use the value-domain tree for the happiness problem, where the query is not a range sum at all but a walk over prefix totals. The structure is the same; only the query changes.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does an absent node represent, and why is it safe to return zero from it? (Key insight)
2. How many nodes can one point update create, and why? (Formal model)
3. Why must the root exist before any operation, and why is index $0$ reserved? (Implementation walkthrough)
4. What happens if a query creates the children it visits? (Why this fails)
5. Why is the initial state required to be uniform? (Problem motivation)
6. State the invariant and say which part of the update proof uses it. (Correctness proof)
7. What is the height of the tree for $C = 10^9$, and how many nodes does an update visit? (Complexity analysis)
8. When is coordinate compression better than an implicit tree? (Algorithm selection)
9. Why does a range assignment need a lazy tag, and what goes wrong without one? (Why this fails)
10. Why is recursion safe here, and what is the iterative alternative? (Recursion decision)
11. How many bytes does a node take, and what does that imply at $q = 200\,000$? (Complexity analysis)
12. Why is the midpoint written as `lo + (hi - lo) / 2`? (Implementation walkthrough)

## Further reading

- The dense version of the same tree, with the full correctness argument for the query decomposition, is the [segment tree](/algorithms/range-queries/segment-tree) article.
- The structure that stores pending range operations at a node is [lazy propagation](/algorithms/range-queries/lazy-propagation), which turns the implicit tree into the range-assignment structure used by the apple-tree problem.
- The alternative for an invertible operation and known coordinates is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), which is smaller and faster when compression is available.
- The transformation that replaces large coordinates by ranks is [coordinate compression](/algorithms/arrays/coordinate-compression), and the article explains when the whole input must be read first.
- The static structure for range minima and maxima is the [sparse table](/algorithms/range-queries/sparse-table), which trades updates for constant-time queries.
- Every listing in this article, in all six languages, is collected on the [implicit segment tree source page](/implementations/range-queries-implicit-segment-tree/).
