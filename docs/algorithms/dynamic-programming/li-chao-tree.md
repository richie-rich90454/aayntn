---
id: dynamic-programming.li-chao-tree
title: The Li Chao tree
summary: Insert lines and ask for the smallest value at a point in logarithmic time, with no monotonicity condition on the slopes or on the query coordinates.
division: [platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        li chao tree,
        li chao segment tree,
        dynamic programming optimization,
        convex hull trick,
        lower envelope,
        line insertion,
        minimum query,
    ]
prerequisites:
    required: [foundations.complexity, range-queries.segment-tree]
    recommended: [dynamic-programming.convex-hull-trick, foundations.recursion]
complexity:
    time: "O(log k) per insertion and per query, after O(q log q) preprocessing"
    space: "O(q) total, O(k) for the tree"
assumptions:
    - Every query coordinate is known before the structure is built, or the domain of x is a bounded interval.
    - Lines are inserted and never deleted.
implementations: dynamic-programming.li-chao-tree
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/dynamic-programming.li-chao-tree.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

The Li Chao tree maintains a set of lines $y = m \ast x + b$ under two operations: insert a line, and report the smallest value at a given $x$ over every line inserted so far. The convex hull trick solves the same problem faster, but only when the lines arrive in slope order and the queries arrive in coordinate order. The Li Chao tree removes both conditions. The price is a logarithmic factor and a segment tree.

The structure is a segment tree over the possible query coordinates. Each node stores at most one line, and an insertion keeps at the node the better of the two candidates at the midpoint of that node's interval. An insertion compares the new line with the stored one at the midpoint, keeps the better line, and sends the loser down exactly one child. A query walks from the root to the leaf of its coordinate and takes the smallest value among the lines on that path.

That is the whole technique. The insertion visits one node per level, so it costs $O(\log k)$ for $k$ distinct query coordinates. The query visits one node per level, so it costs $O(\log k)$ as well. The tree itself uses $O(k)$ memory.

The tree is named after Li Chao, who popularized it in the Chinese competitive programming community. It is also called the Li Chao segment tree. It is the standard answer to "the transition is a minimum of lines, but the slopes are not monotone".

## Problem motivation

A freight broker collects quotes from carriers. Each quote is a fixed fee plus a rate per kilometer, so the price of a quote at distance $x$ is $y = m \ast x + b$. The quotes arrive one at a time, and the broker's customers ask for the cheapest price at a distance as soon as the quote book has changed.

The constraints are what make the problem interesting:

- Up to $2 \cdot 10^5$ operations in total, each either a new quote or a price request.
- The distance $x$ and the coefficients $m, b$ are arbitrary signed integers with $|m|, |b|, |x| \le 10^9$.
- Quotes are never withdrawn.
- Every request arrives after at least one quote, so the minimum is always over a non-empty set.
- Every value $m \ast x + b$ fits in a signed 64-bit integer.

Scanning every quote per request costs $O(n)$ per request, which is $O(nq) = 4 \cdot 10^{10}$ operations at the top of the range. The requests and the quotes are interleaved and in no useful order, so sorting the quotes by slope or the requests by distance is not allowed: the answer to an earlier request must not change when a later quote arrives.

The second reason to care is dynamic programming. A recurrence of the form

$$
\text{dp}[i] = \min_{j < i} \bigl(m_j \ast x_i + b_j\bigr) + c_i
$$

is a sequence of line insertions and point queries. The convex hull trick handles it when the slopes $m_j$ and the query points $x_i$ are both monotone. When either is not, the Li Chao tree handles it without changing the recurrence.

## Recognition patterns

The Li Chao tree is the right tool when all of the following hold.

- The operations are **insert a line** and **query the minimum (or maximum) at a point**.
- The lines arrive in **arbitrary slope order**, and the queries arrive at **arbitrary coordinates**.
- Lines are **never deleted**.
- The query coordinates are **bounded**, or all of them are known before the structure is built.

The coordinates do not need to be integers for the geometry, but integer coordinates are what the reference implementation supports. If the domain is a contiguous integer interval, the leaves are the integers. If only some coordinates are ever queried, the leaves are those coordinates, which is the coordinate-compressed form used below.

| Situation | What to use |
| --- | --- |
| Slopes non-decreasing, queries non-decreasing | The monotone convex hull trick, $O(1)$ amortized per operation |
| Slopes non-decreasing, queries arbitrary | The same hull with a binary search, $O(\log n)$ per query |
| Arbitrary slopes, insertions only, arbitrary queries | The Li Chao tree, $O(\log k)$ per operation |
| Arbitrary slopes, insertions and deletions | A segment tree over time with a Li Chao tree, or a dynamic hull |
| A line is active only on a range of $x$ | A Li Chao tree with range insertion, $O(\log^2 k)$ per line |
| The domain is $[-10^{18}, 10^{18}]$ and only a few coordinates are queried | Compress the queried coordinates, or use implicit nodes |
| The transition has a monotone opt split | Divide-and-conquer optimization, not a Li Chao tree |
| The functions cross more than once | The Li Chao tree does not apply |

Two phrases in a statement are strong signals. "Insert a line" and "find the minimum value at $x$" are the definition. A dynamic program whose transition expands to $m_j \ast x_i + b_j$, with the slope and the query point supplied by the input rather than generated in order, is the same problem in disguise.

<Synonyms terms="Li Chao tree, Li Chao segment tree, dynamic lower envelope, line container tree" />

## Naive approach

The baseline keeps every line in an array and scans the array for each query.

```python
lines = []

def add(m, b):
    lines.append((m, b))

def query(x):
    return min(m * x + b for m, b in lines)
```

The insertion is $O(1)$ and the query is $O(n)$, so a sequence of $q$ operations costs $O(nq)$ in the worst case. With $n = q = 2 \cdot 10^5$ that is $4 \cdot 10^{10}$ evaluations, far beyond a one-second limit.

A better baseline sorts the lines by slope and builds the lower envelope with the convex hull trick. Each insertion into the envelope costs $O(\log n)$ if the hull is maintained with a balanced structure, but a full rebuild after every insertion costs $O(n \log n)$, which is $O(n^2 \log n)$ over the whole input. The monotone stack version does not apply at all, because the slopes arrive in arbitrary order.

The third baseline is the offline divide-and-conquer optimization. It answers all queries in $O(n \log n)$ when the lines and queries are known in advance, but it requires the whole input before it can answer the first query. The Li Chao tree needs only a bounded domain, or an offline pass to collect the query coordinates, and then answers each operation in $O(\log k)$.

The brute-force scan is still worth writing. It is the reference for the differential test, and it is the version to compare against on random small inputs when the Li Chao tree disagrees with expectations.

## Key insight

The lower envelope of a set of lines is a concave piecewise-linear function. Each line is the minimum on one contiguous interval of the $x$-axis, and the intervals appear in slope order from left to right: the line with the largest slope is the minimum far to the left, and the line with the smallest slope is the minimum far to the right. This is the geometry the convex hull trick exploits.

The Li Chao tree exploits a weaker fact that survives arbitrary insertion order. Take any set of lines, and take any interval $[l, r]$ of the $x$-axis. Let $H$ be the line that is best at the midpoint of the interval, and let $L$ be any other line. The difference $L(x) - H(x)$ is linear in $x$, so it changes sign at most once. If $L$ is not better than $H$ at the left endpoint, and it is not better than $H$ at the midpoint, then it cannot be better anywhere in the left half: a linear function that is non-negative at two points is non-negative at every point between them. So $L$ can only win on the right half. If $L$ is better at the left endpoint but loses at the midpoint, the single crossing lies in the left half, so $L$ can only win on the left half.

That is the entire insertion rule. Store the line that wins at the midpoint at the node. Send the loser to the one child where it might still win. On the other child, the winner dominates the loser everywhere, so nothing is lost.

The structural consequence is the invariant that makes the query work: for every leaf $x$, the best line among all inserted lines is somewhere on the path from the root to that leaf. The query walks that path, evaluates every stored line at $x$, and returns the minimum. Lines that are not on the path cannot be the best at $x$, because at every branch the line that stayed above dominates the line that went to the other child.

## Visual intuition

The picture is a segment tree over the query coordinates. Every node owns an interval of coordinates and stores at most one line. The stored line is the best at the midpoint among the lines that have reached the node; it is not necessarily the best line at either endpoint, and a line stored closer to the root may still be better at that midpoint.

For eight coordinates $0, 1, \ldots, 7$ and the three lines

- $A(x) = 3x - 4$,
- $B(x) = -x + 10$,
- $C(x) = x$,

inserted in the order $A, B, C$, the tree ends up as follows.

| Node   | Interval          | Stored line | Why                                         |
| ------ | ----------------- | ----------- | ------------------------------------------- |
| 1      | $[0, 7]$          | $C$         | $C$ wins at the midpoint $x = 3$            |
| 2      | $[0, 3]$          | $A$         | $A$ was pushed left and the node was empty  |
| 3      | $[4, 7]$          | $B$         | $B$ was pushed right and the node was empty |
| 4 to 7 | shorter intervals | empty       | no line was pushed that far                 |

The lower envelope is $A$ on $[0, 2]$, $C$ on $[2, 5]$, and $B$ on $[5, 7]$. Each of the three lines is stored somewhere on the path of the leaves where it wins. A line may also sit on a path where a better line is closer to the root; the query takes the minimum, so that costs nothing.

A query at $x = 0$ follows the path $[0, 7] \to [0, 3] \to [0, 1] \to [0, 0]$ and evaluates $C(0) = 0$ and $A(0) = -4$. The answer is $-4$. A query at $x = 6$ follows $[0, 7] \to [4, 7] \to [6, 7]$ and evaluates $C(6) = 6$ and $B(6) = 4$. The answer is $4$.

The table above is the picture to keep: each line lives on the path of the leaves where it can still be the minimum, and the query reads exactly those paths.

## Formal model

Let $X = \{x_0 < x_1 < \cdots < x_{k-1}\}$ be the set of distinct coordinates that will ever be queried. In the reference implementation, $X$ is collected by reading the whole input before processing it. Collecting the coordinates does not change the order of the operations: the insertions and the queries are still applied in the order they appear.

::: math definition Definition
A **line** is a pair $(m, b)$ denoting the function $L(x) = m \ast x + b$. The **value** of a line at $x$ is $L(x)$.
:::

::: math definition Definition
The **Li Chao tree** over $X$ is a binary tree whose nodes correspond to intervals of indices. The root covers $[0, k-1]$. A node covering $[l, r]$ with $l < r$ has a left child covering $[l, \lfloor (l+r)/2 \rfloor]$ and a right child covering $[\lfloor (l+r)/2 \rfloor + 1, r]$. A leaf covers one index. Every node stores either one line or nothing.
:::

::: math invariant Invariant
After every operation, for every leaf index $i$ and every line $L$ inserted so far, either $L$ is stored on the path from the root to leaf $i$, or some line $H$ stored on that path satisfies $H(x_i) \le L(x_i)$.
:::

The invariant is stronger than "the best line is on the path", and the stronger form is what makes the insertion proof local: a line that is pushed away from a subtree is dominated there by the line that stayed.

::: math definition Definition
For a node covering $[l, r]$ with midpoint $d = \lfloor (l+r)/2 \rfloor$, the **insertion rule** for a new line $N$ and the stored line $H$ is:

$$
\begin{aligned}
\text{betterLeft} &= [N(x_l) < H(x_l)], \\
\text{betterMid} &= [N(x_d) < H(x_d)].
\end{aligned}
$$

If $\text{betterMid}$ holds, exchange $N$ and $H$. The line now held by $N$ is the loser. If $l = r$, stop. If $\text{betterLeft} \ne \text{betterMid}$, recurse into the left child with $N$; otherwise recurse into the right child with $N$.
:::

The strict inequality is arbitrary. Equality means the two lines have the same value, and either one may be kept; the answer is unchanged.

## Algorithm derivation

The starting point is the segment tree over $X$. Each insertion must decide, at every node on its way down, whether the new line can be the best somewhere in the node's interval, and if so, where.

Suppose the node covers $[l, r]$ with midpoint $d$, and it already stores $H$. Let $N$ be the incoming line. There are two candidates for the line that should stay at the node: the one that is better at $x_d$. The other one is the loser.

If $N$ wins at $x_d$, the node should store $N$; otherwise it should keep $H$. This is a constant-time decision, and it guarantees that the line stored at the node is the better of the two at the midpoint.

Now consider the loser $L$, and let $W$ be the winner. The difference $D(x) = L(x) - W(x)$ is linear. At $x_d$, $D(x_d) \ge 0$. There are two cases.

- If $L(x_l) < W(x_l)$, then $D(x_l) < 0$ and $D(x_d) \ge 0$. A linear function with a negative value at $x_l$ and a non-negative value at $x_d$ is non-negative for every index at or to the right of $d$. So $L$ can only beat $W$ in the left half, and it is pushed left.
- If $L(x_l) \ge W(x_l)$, then $D$ is non-negative at both $x_l$ and $x_d$. A linear function is non-negative at every index between those two points, so $L$ cannot beat $W$ in the left half. It may still beat $W$ in the right half, so it is pushed right.

The two cases are exactly the comparison $\text{betterLeft} \ne \text{betterMid}$ computed before the exchange. If the winner was the new line and the old line was better at the left endpoint, the loser is the old line and it goes left. If the winner was the old line and the new line was better at the left endpoint, the loser is the new line and it goes left. In both cases, the loser is the line that is better at the left endpoint, and it goes left; otherwise it goes right.

The insertion therefore does not need to know the intersection point, and it does not need to compare at the right endpoint. It only needs the values at the left endpoint and the midpoint.

The query is the second half. At every node on the path from the root to the leaf for $x_i$, evaluate the stored line at $x_i$ and keep the minimum. The invariant says that every inserted line is either stored on this path or dominated on this path, so the minimum over the path is the minimum over all inserted lines.

The empty node is the base case of the insertion. If a node stores nothing, the incoming line can be stored there immediately: it is the only line that has reached this subtree, so it is the best line at every leaf of the subtree among the lines that reached it. The lines that did not reach the subtree are dominated by lines above, by the same case analysis.

## Step-by-step execution

Use the coordinates $X = \{0, 1, 2, 3, 4, 5, 6, 7\}$ and the three lines $A(x) = 3x - 4$, $B(x) = -x + 10$, $C(x) = x$.

The root covers $[0, 7]$, so its midpoint is $x_3 = 3$. The left child covers $[0, 3]$ with midpoint $x_1 = 1$, and the right child covers $[4, 7]$ with midpoint $x_5 = 5$.

**Insert $A$.** The root is empty, so it stores $A$. No comparison is needed.

**Insert $B$.** The root stores $A$. At the left endpoint $x = 0$, $B(0) = 10$ and $A(0) = -4$, so $\text{betterLeft}$ is false. At the midpoint $x = 3$, $B(3) = 7$ and $A(3) = 5$, so $\text{betterMid}$ is false. The root keeps $A$, and $B$ is pushed right because the two comparisons agree.

The right child covers $[4, 7]$ and is empty, so it stores $B$.

**Insert $C$.** The root stores $A$. At $x = 0$, $C(0) = 0$ and $A(0) = -4$, so $\text{betterLeft}$ is false. At $x = 3$, $C(3) = 3$ and $A(3) = 5$, so $\text{betterMid}$ is true. The root exchanges the two lines and now stores $C$; the loser is $A$. The comparisons disagree, so $A$ is pushed left.

The left child covers $[0, 3]$ and is empty, so it stores $A$. The final tree has $C$ at the root, $A$ at the left child, and $B$ at the right child.

Now answer four queries.

- **$x = 0$.** The path is root, left child. $C(0) = 0$ and $A(0) = -4$, so the answer is $-4$.
- **$x = 2$.** The path is root, left child. $C(2) = 2$ and $A(2) = 2$, so the answer is $2$.
- **$x = 4$.** The path is root, right child. $C(4) = 4$ and $B(4) = 6$, so the answer is $4$.
- **$x = 6$.** The path is root, right child. $C(6) = 6$ and $B(6) = 4$, so the answer is $4$.

The lower envelope is $A$ up to $x = 2$, $C$ from $x = 2$ to $x = 5$, and $B$ from $x = 5$ onward. The three stored lines cover the three pieces, and each query sees the piece that owns its coordinate.

Notice that $A$ was stored at the root before it was displaced. Without the exchange at $x = 3$, the root would still hold $A$, and the query at $x = 4$ would compare $A(4) = 8$ with $B(4) = 6$ and answer $6$ instead of $4$, because $C$ would have been pushed into a subtree where it is no longer on the path of $x = 4$. The exchange is not an optimization; it is what keeps the midpoint winner available to the whole interval.

## Correctness proof

::: math lemma Lemma
Let $W$ and $L$ be two lines, and let $[l, r]$ be an interval of indices with midpoint $d$. If $W(x_d) \le L(x_d)$ and $W(x_l) \le L(x_l)$, then $W(x_i) \le L(x_i)$ for every $i \in [l, d]$.
:::

::: math proof Proof
Let $D(x) = L(x) - W(x)$. The function $D$ is linear because both lines are linear. At the two endpoints of the left half, $D(x_l) \ge 0$ and $D(x_d) \ge 0$. For any $x_i$ between $x_l$ and $x_d$, the value $D(x_i)$ is a convex combination of $D(x_l)$ and $D(x_d)$ with non-negative weights, so $D(x_i) \ge 0$. Therefore $L(x_i) \ge W(x_i)$. $\square$
:::

::: math lemma Lemma
Let $W$ and $L$ be two lines with $W(x_d) \le L(x_d)$. If $L(x_l) < W(x_l)$, then $L(x_i) \ge W(x_i)$ for every $i \in [d, r]$.
:::

::: math proof Proof
The difference $D = L - W$ is linear, $D(x_l) < 0$, and $D(x_d) \ge 0$. A non-constant linear function has at most one zero, so the sign change occurs at or before $x_d$, and $D$ is non-negative from $x_d$ to $x_r$. Hence $L(x_i) \ge W(x_i)$ on the right half. $\square$
:::

::: math theorem Theorem
The insertion rule preserves the invariant, and the query returns the minimum of every inserted line at the queried coordinate.
:::

::: math proof Proof
Suppose the invariant holds before an insertion of a line $N$ at a node covering $[l, r]$ with midpoint $d$. If the node is empty, the invariant is immediate: $N$ is stored on the path of every leaf in the subtree, and no other line reached the subtree.

Otherwise let $H$ be the stored line. Compare $N$ and $H$ at $x_l$ and $x_d$, and exchange them if $N$ wins at $x_d$, so that the node stores the winner $W$ and the loser $L$. By construction $W(x_d) \le L(x_d)$.

If $L(x_l) < W(x_l)$, the second lemma says that $L$ is no better than $W$ on the right half, so every leaf in the right half is still covered by $W$ at this node. The loser is pushed left, where it may still win. If $L(x_l) \ge W(x_l)$, the first lemma says that $L$ is no better than $W$ on the left half, so every leaf in the left half is still covered by $W$. The loser is pushed right, where it may still win. In both cases, the child that does not receive $L$ has a line $W$ that dominates $L$ throughout its interval, and the child that receives $L$ handles it recursively.

The recursion ends at a leaf, where the node stores one line or nothing; the invariant is immediate. By induction on the depth, every leaf still has a line on its path that is no worse than $N$, and the lines that were already inserted are unaffected. This proves the invariant for the insertion.

For the query at index $i$, let $L^{\ast}$ be the line with the smallest value at $x_i$ among all inserted lines. The invariant applied to $L^{\ast}$ gives a line $H$ on the root-to-leaf path with $H(x_i) \le L^{\ast}(x_i)$. Since $H$ is an inserted line, $H(x_i) \ge L^{\ast}(x_i)$ by the definition of $L^{\ast}$. Therefore $H(x_i) = L^{\ast}(x_i)$, and the minimum over the path is exactly the minimum over all inserted lines. $\square$
:::

The proof does not use the fact that the lines are straight. It uses only that the difference of two stored functions changes sign at most once. That is why the same tree handles parabolas with the same leading coefficient, and other families of pseudo-lines.

## Complexity analysis

**Preprocessing: $O(q \log q)$.** Reading the input and sorting the distinct query coordinates costs $O(q \log q)$ time and $O(q)$ space. The sorting is what allows the tree to be indexed by coordinate rank instead of by the raw coordinate value.

**Insertion: $O(\log k)$.** The insertion visits one node per level and does a constant amount of arithmetic per node. The tree over $k$ leaves has height $\lceil \log_2 k \rceil$, so an insertion costs at most about $\log_2 k + 1$ evaluations of two lines.

**Query: $O(\log k)$.** The query follows one root-to-leaf path and evaluates one line per node on the path. Finding the leaf index costs $O(\log k)$ with a binary search, or $O(1)$ if the index is stored with the operation during preprocessing.

**Memory: $O(k)$.** The segment tree has at most $4k$ nodes, each holding one line and one flag. The operation list and the coordinate list add $O(q)$.

For $q = 2 \cdot 10^5$, the height is at most $18$, so each operation performs a few dozen 64-bit multiplications. The bound is not pseudo-polynomial: the running time depends on the logarithm of the number of distinct coordinates, not on their magnitude.

Two practical details decide whether the answers are right. First, the evaluation $m \ast x + b$ must be done in 64 bits. With $|m|, |x| \le 10^9$, the product is at most $10^{18}$, and adding $|b| \le 10^{9}$ stays below $2^{63} - 1$. A 32-bit evaluation overflows long before the input limit. Second, the coordinate compression must preserve the order of the coordinates; sorting the raw values and removing duplicates does that, and mapping each query back to its rank must use the same sorted array.

::: math complexity Complexity
With $q$ operations and $k$ distinct query coordinates: $O(q \log q + q \log k)$ total time, $O(q + k)$ memory, and 64-bit arithmetic for every line evaluation.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Slopes and query coordinates are both non-decreasing | The monotone convex hull trick with a stack, $O(1)$ amortized |
| Slopes are non-decreasing but queries are arbitrary | The hull with a binary search over its breakpoints, $O(\log n)$ |
| Slopes are arbitrary and queries are arbitrary, insertions only | The Li Chao tree, $O(\log k)$ per operation |
| Lines are deleted as well as inserted | A segment tree over time with a Li Chao tree, or a balanced dynamic hull |
| Each line is active only on an interval of $x$ | A Li Chao tree with range insertion, $O(\log^2 k)$ per line |
| The coordinate range is huge but only a few points are queried | Coordinate compression, or a Li Chao tree with implicit nodes |
| The queries are all known and the lines can be sorted | Offline divide and conquer, $O(n \log n)$ total |
| The transition has a monotone divide point | Divide-and-conquer optimization or Knuth optimization |
| The functions can cross twice | Neither the hull nor the Li Chao tree applies |

The distinction between the last three rows is the one that separates a correct solution from a plausible one. The Li Chao tree is not a general-purpose function container. It requires that any two functions in the family cross at most once. Lines satisfy the condition; quadratic functions with different leading coefficients do not.

## Reference implementations

The six programs in the manifest all read the same input and print the same output. The first line holds $q$, the number of operations. Each of the next $q$ lines holds either `1 m b`, which inserts the line $y = m \ast x + b$, or `2 x`, which prints the minimum value at $x$ over every line inserted so far. A query is guaranteed to follow at least one insertion.

The manifest publishes one `program` variant in each language: C, C++17, Java, Python, Pascal, and JavaScript. All six use the same three ideas.

- They read every operation first and collect the distinct query coordinates.
- They compress the coordinates and build a Li Chao tree over the ranks.
- They replay the operations in input order, inserting lines and answering queries against the compressed tree.

The C, C++, Java, and Pascal versions use 64-bit integers. The Python version uses arbitrary-precision integers, and the JavaScript version uses `BigInt`, because a product of two values near $10^9$ is not exactly representable as a double.

The JavaScript and Pascal files are educational references. Neither language is a USACO submission language, and the Pascal file is written to compile under the pas2js compiler as well as under Free Pascal.

## Recursion decision

The insertion and the query are naturally recursive, and the recursion depth is the height of the tree. For $k$ distinct coordinates the height is $\lceil \log_2 k \rceil$. At $k = 2 \cdot 10^5$ that is $18$ frames, and even a domain of $10^{18}$ values with implicit nodes has a depth of only about $60$.

The recursion is therefore safe in every language. The C, C++, and Java versions use it for both operations; Python and JavaScript recurse only on the insertion, and Pascal keeps both operations in loops. The alternative to the recursion is a loop that carries the node index, the left bound, and the right bound, and updates them as it descends. The loop is slightly longer to read but avoids the call overhead; for this structure the overhead is irrelevant.

| Language   | Default stack              | Depth here | Recommendation    |
| ---------- | -------------------------- | ---------- | ----------------- |
| C and C++  | 8 MB on Linux              | At most 18 | Recursive is fine |
| Java       | 512 KB to 1 MB per thread  | At most 18 | Recursive is fine |
| Python     | Interpreter limit of 1000  | At most 18 | Recursive is fine |
| Pascal     | The operating system stack | At most 18 | Recursive is fine |
| JavaScript | The V8 engine limit        | At most 18 | Recursive is fine |

The depth is logarithmic, not linear, which is the difference between this structure and the naive recursive enumeration of subsets. A recursive implementation of the knapsack problem walks down $n$ levels; a recursive Li Chao tree walks down $\log k$ levels. The stack is not the constraint.

## Implementation walkthrough

The core of the C++ implementation is two functions.

```cpp
void add(Line nw, int node, int left, int right) {
    if (!used[node]) {
        used[node] = true;
        tree[node] = nw;
        return;
    }
    int mid = (left + right) / 2;
    bool betterLeft = eval(nw, xs[left]) < eval(tree[node], xs[left]);
    bool betterMid = eval(nw, xs[mid]) < eval(tree[node], xs[mid]);
    if (betterMid) {
        std::swap(tree[node], nw);
    }
    if (left == right) {
        return;
    }
    if (betterLeft != betterMid) {
        add(nw, node * 2, left, mid);
    } else {
        add(nw, node * 2 + 1, mid + 1, right);
    }
}

long long query(int node, int left, int right, int index) {
    long long best = used[node] ? eval(tree[node], xs[index]) : LLONG_MAX;
    if (left == right) {
        return best;
    }
    int mid = (left + right) / 2;
    long long child = index <= mid
        ? query(node * 2, left, mid, index)
        : query(node * 2 + 1, mid + 1, right, index);
    return std::min(best, child);
}
```

**The empty check.** A node that has never received a line stores the first line that reaches it. This is not an optimization: without it, the comparisons would treat a line that was never inserted as a real candidate.

**The two comparisons.** `betterLeft` and `betterMid` are computed before the exchange. They answer two different questions: whether the incoming line wins at the left endpoint, and whether it wins at the midpoint. The exchange makes the node hold the midpoint winner, and the comparison of the two booleans decides which half can still contain a point where the loser wins.

**The exchange.** `std::swap(tree[node], nw)` leaves the loser in `nw`. The recursion then carries the loser, not the original incoming line. A common bug is to swap the node's line but continue with the original variable, which duplicates the winner and drops the loser entirely.

**The child choice.** `betterLeft != betterMid` sends the loser left; otherwise it sends the loser right. Reversing this test is the second most common bug, and it produces a tree that answers some queries correctly, which makes it harder to notice.

**The query.** The query evaluates the line at every node on the path, including the root and the leaf, and returns the smallest value. It does not stop at the first empty node, because a line may have been pushed below an empty sibling.

**The coordinates.** The array `xs` holds the sorted distinct query coordinates. `eval(line, x)` is `line.m * x + line.b`, and it must be evaluated in 64 bits. The index passed to the query is the rank of the requested coordinate, found with `std::lower_bound`.

The input reader is token-based. It does not care whether the operations are on separate lines or separated by extra whitespace, which is what the statement's format guarantees but not what every test generator respects.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Recursing into both children | The insertion becomes linear in the number of lines | Send the loser down exactly one child |
| Reversing the child test | Some queries lose the line that owns their interval | Push left when the loser is better at the left endpoint |
| Forgetting the midpoint exchange | The better of the two candidates at the midpoint is pushed away and may be lost | Exchange first, then recurse with the loser |
| Querying only the leaf | The answer is the line at the leaf, not the best line on the path | Take the minimum over every node on the path |
| Using a 32-bit evaluation | The product overflows and the comparison is wrong | Use 64-bit integers, Python integers, or `BigInt` |
| Building the tree over raw coordinates | The array is huge and mostly empty | Compress the distinct query coordinates |
| Deleting a line by clearing its node | Lines below it are still needed, and the invariant breaks | Rebuild, or use a segment tree over time |
| Assuming monotone slopes | The tree still works, but it is slower than the hull | Use the hull when both monotonicities hold |

### Why this fails: the line pushed into the wrong child

Return to the three lines $A(x) = 3x - 4$, $B(x) = -x + 10$, and $C(x) = x$ on the coordinates $0, \ldots, 7$, inserted in the order $A, B, C$.

The correct insertion of $C$ at the root compares $C$ and $A$ at $x = 0$ and $x = 3$. $C$ loses at $x = 0$ and wins at $x = 3$, so the root keeps $C$ and $A$ is pushed left. The left child is empty, so $A$ is stored there.

Now suppose the program pushes $A$ right instead. The right child already stores $B$, so the insertion of $A$ continues there. At $x = 4$, $A(4) = 8$ and $B(4) = 6$, so $A$ loses at the left endpoint; at $x = 5$, $A(5) = 11$ and $B(5) = 5$, so $A$ loses at the midpoint as well. $A$ is pushed deeper into the right subtree, where it can no longer help the left end.

The query at $x = 0$ now finds only $C$ on the path and returns $0$. The correct answer is $A(0) = -4$. The line that owns the left end of the envelope is no longer on the path of the left end, so the query cannot see it.

The same failure appears if the midpoint exchange is omitted. The root keeps $A$ and $C$ is pushed left, because $C$ loses at the left endpoint and wins at the midpoint. The query at $x = 4$ then sees $A(4) = 8$ and $B(4) = 6$ but not $C(4) = 4$. The answer is $6$ instead of $4$. Both bugs produce a program that runs, prints plausible numbers, and is wrong on a small instance.

The rule to remember is the one the proof states: **the loser may only be sent to a half where it can still beat the winner, and the winner stays at the node so that the other half is covered.**

## Variants and extensions

- **The maximum instead of the minimum.** Negate every slope and every intercept, query the minimum, and negate the answer. Alternatively, reverse every comparison in the insertion and the query.
- **Range insertion.** A line is active only on an interval of $x$. Decompose the interval into $O(\log k)$ canonical nodes of the segment tree, and perform a normal Li Chao insertion into each. An insertion costs $O(\log^2 k)$ and a query still costs $O(\log k)$.
- **Implicit nodes.** When the coordinate range is huge and the queried coordinates are not known in advance, allocate a node only when an insertion first reaches it. The depth is the logarithm of the coordinate range, about $60$ for 64-bit coordinates.
- **Persistent Li Chao tree.** Copy the nodes on the insertion path instead of modifying them. Every version keeps the lines inserted up to that version, and a query can be answered against any historical version.
- **Rollback.** Record every node whose stored line changes during an insertion, and undo the changes in reverse order. This is the tool for an offline depth-first search over a segment tree of time.
- **Deletions.** Put each line's lifetime on a segment tree over time, add it to the Li Chao trees of the nodes that cover its lifetime, and answer queries at the leaves. The total cost is $O(q \log^2 q)$.
- **The Li Chao tree on a tree.** Merge the structures of the children with small-to-large insertion, or use DSU on tree with rollback. This is the standard solution for subtree line-query dynamic programs.
- **Pseudo-lines.** The proof only needs the difference of two functions to change sign at most once. Parabolas with the same leading coefficient, and other families with that property, work with the same code.
- **The dynamic convex hull.** When the operations are insert, delete, and maximum query, a dynamic line container backed by a multiset of slopes supports them in $O(\log n)$. The Li Chao tree is the simpler choice when there are no deletions and the domain is finite.

## Contest strategy

Under contest pressure, the Li Chao tree is usually a replacement for a slower transition, so the work is in recognizing the line and in getting the insertion rule exactly right.

1. Write the dynamic program in its quadratic form first, and make sure it is correct.
2. Expand the transition into $m_j \ast x_i + b_j$. The query variable is $x_i$; the slope and the intercept belong to the earlier state $j$.
3. Decide whether the query is a minimum or a maximum. Negate the coefficients for a maximum rather than writing a second tree.
4. Decide the domain. If the whole input is available, collect the distinct query coordinates and compress them. If the input is online, use a fixed bound or implicit nodes.
5. Use 64-bit arithmetic for the evaluation, and check the largest possible product before writing the code.
6. Implement the insertion with the two comparisons, the exchange, and exactly one recursive call. Test the child choice on a three-line example by hand.
7. Implement the query as the minimum over the path, not the value at the leaf.
8. Compare against the $O(nq)$ scan on random small inputs. Include duplicate slopes, negative coordinates, a single coordinate, and a query that arrives after only one insertion.
9. If the statement has deletions or line lifetimes, do not delete from the Li Chao tree. Build the segment tree over time and use rollback, or use the offline divide and conquer.

## Worked problems

### Problem 1: the direct line container

**Restatement.** Process $q$ operations. `0 a b` inserts the line $y = a \ast x + b$. `1 p` prints the minimum value at $p$ over every line inserted so far. Every query follows at least one insertion. Constraints: $q \le 2 \cdot 10^5$, $|a|, |b|, |p| \le 10^9$. This is the Library Checker problem [Line Add Get Min](https://judge.yosupo.jp/problem/line_add_get_min); the reference programs for this technique use the labels `1 m b` and `2 x` for the same two operations.

**Naive baseline.** Keep a list of lines and scan it for each query, at $O(nq)$.

**Insight.** Each line becomes available at a known time and never disappears, so a single Li Chao tree over the query coordinates is enough. The interleaving is handled by replaying the operations.

**Derivation.** Read all operations, collect the coordinates of the type-2 operations, sort them, and remove duplicates. Build the tree over the ranks. Replay the operations: a type-1 operation inserts a line; a type-2 operation finds the rank of $x$ and queries the path.

**Correctness.** The invariant of the tree holds after every insertion, and the query returns the minimum over all lines inserted so far, which is exactly the definition of the operation.

**Complexity.** $O(q \log q)$ preprocessing and $O(\log q)$ per operation, with $O(q)$ memory.

**Common wrong approach.** Sorting the lines by slope and using the monotone hull. The slopes arrive in arbitrary order, so the hull cannot be maintained as the lines arrive, and sorting them would put future lines into earlier queries. The program answers some queries correctly and fails as soon as the insertion order matters.

### Problem 2: a line that is active on a range

**Restatement.** Process $q$ operations. `0 l r a b` inserts the line $y = a \ast x + b$ for every $x$ with $l \le x < r$. `1 p` prints the minimum value at $p$ over every line active at $p$. Constraints: $q \le 2 \cdot 10^5$, and the coordinates and coefficients reach $10^9$ in absolute value. This is the Library Checker problem [Segment Add Get Min](https://judge.yosupo.jp/problem/segment_add_get_min).

**Naive baseline.** Store each line with its interval and scan every line for each query, at $O(nq)$.

**Insight.** A line that covers a range can be inserted into the canonical nodes of a segment tree over the coordinates. Each canonical node covers a subrange that is entirely inside the line's range, and the line is inserted into the Li Chao structure rooted at that node.

**Derivation.** Build the Li Chao tree over the compressed coordinates. To insert a line on $[l, r)$, recurse on the segment tree: if the node's interval is disjoint from $[l, r)$, stop; if it is contained in $[l, r)$, perform a normal Li Chao insertion at that node; otherwise recurse into both children. A point query walks the root-to-leaf path and takes the minimum over the lines stored at every node on the path.

**Correctness.** The range decomposes into disjoint canonical nodes, and a point $x$ in the range lies in exactly one of them. The line is inserted into that canonical node, or into a descendant of it if the ordinary insertion pushes it down. In the first case the query sees the line directly; in the second case the line that displaced it is on the query path and is no worse at $x$. Lines that do not cover $x$ are stored only in nodes whose intervals do not contain $x$, so they are not on the query path.

**Complexity.** A range insertion touches $O(\log k)$ canonical nodes, and each Li Chao insertion costs $O(\log k)$, so an insertion is $O(\log^2 k)$. A query is $O(\log k)$. The tree has $O(k)$ nodes, because the range insertion reuses the same Li Chao tree rather than building a separate tree per segment-tree node.

**Common wrong approach.** Inserting the line at the first canonical node and stopping. The line is then missing from the other pieces of its range, and queries in those pieces return a larger value.

### Problem 3: the tree dynamic program

**Restatement.** A rooted tree has a value $a_u$ and a value $b_u$ at every node. A jump from $u$ to any node $v$ in the subtree of $u$ costs $a_u \ast b_v$. A path is a sequence of jumps, and its cost is the sum of the jump costs. For every node, find the minimum cost of a path from that node to a leaf. The root is never a leaf, even if it has degree one. Constraints: $n \le 10^5$, $|a_u|, |b_u| \le 10^5$. This is Codeforces problem [932F, Escape Through Leaf](https://codeforces.com/problemset/problem/932/F).

**Naive baseline.** For every node, try every descendant as the first jump and recurse, which is $O(n^2)$ states and transitions.

**Insight.** Let $\text{dp}[u]$ be the answer for $u$. Then

$$
\text{dp}[u] = \min_{v \in \text{subtree}(u),\, v \ne u} \bigl(a_u \ast b_v + \text{dp}[v]\bigr),
$$

with $\text{dp}[u] = 0$ when $u$ is a leaf. Every node $v$ contributes the line $L_v(x) = b_v \ast x + \text{dp}[v]$. The query for $u$ is $L_v(a_u)$ minimized over the subtree of $u$, excluding $u$ itself.

**Derivation.** Process the tree bottom-up. Each node owns a Li Chao tree over the compressed $a$ values, with nodes allocated on demand, and a list of the lines it contains. A leaf has the empty structure, sets $\text{dp} = 0$, inserts its own line $b_u \ast x + 0$, and returns. An internal node takes the largest child structure, inserts every line of the other child structures into it, queries the merged structure at $a_u$ to obtain $\text{dp}[u]$, and then inserts its own line. The query is made before the node's own line is inserted, so a jump from $u$ to itself is never considered.

**Correctness.** By induction, the structure of a node contains exactly the lines of the nodes in its subtree, with the correct $\text{dp}$ values. The query at $a_u$ is the minimum of $a_u \ast b_v + \text{dp}[v]$ over the descendants, which is the recurrence. The base case is a leaf, whose answer is zero.

**Complexity.** Small-to-large merging inserts each line $O(\log n)$ times, and each insertion costs $O(\log n)$, so the total time is $O(n \log^2 n)$. The line lists and the dynamic Li Chao nodes use $O(n \log n)$ memory.

**Common wrong approach.** Querying after inserting the node's own line, which lets the query consider a jump from $u$ to itself. That transition is self-referential, because $\text{dp}[u]$ is the value being computed, and it makes the answers too small in a way that is easy to miss because the sample with a single node is not present.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a minimum of lines at points with arbitrary slopes and arbitrary query order. Look for a transition of the form $m_j \ast x_i + b_j$.
2. **Direct application.** Implement the compressed Li Chao tree and verify it against the scan on random instances with at most ten lines and ten queries.
3. **Adaptation.** Turn the minimum into a maximum, handle duplicate slopes, and handle a single query coordinate.
4. **Combination.** Add range insertion, then add a segment tree over time for deletions.
5. **Challenge.** Solve the tree dynamic program with small-to-large merging, and prove that each line is reinserted only $O(\log n)$ times.
6. **Transfer.** Recognize the same structure in a computational geometry problem, such as the lower envelope of a set of lines that is built incrementally.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does each node of the Li Chao tree store, and what does the invariant say about a line that is not stored on a path? (Formal model)
2. Why can the loser of the midpoint comparison be sent to only one child? (Key insight)
3. Which two evaluations decide the child, and why is the right endpoint not needed? (Algorithm derivation)
4. State the exchange and the child rule in the order the code performs them. (Implementation walkthrough)
5. Why is the query a minimum over the path rather than the value at the leaf? (Correctness proof)
6. What is the height of the tree, and what does that imply for recursion in each language? (Recursion decision)
7. Why does the structure need a finite domain or an offline pass over the queries? (Formal model)
8. What changes when the query asks for a maximum? (Variants and extensions)
9. How does range insertion change the time per line, and why does the memory stay linear? (Worked problems)
10. How does small-to-large merging bound the number of line insertions in the tree dynamic program? (Worked problems)
11. Give an input on which a wrong child choice produces a wrong answer. (Common mistakes)
12. Why is the evaluation type a correctness issue rather than a performance issue? (Complexity analysis)

## Further reading

- The monotone version of the same problem, and the two monotonicity conditions that the Li Chao tree removes, are in [convex hull trick](/algorithms/dynamic-programming/convex-hull-trick).
- The segment tree that the Li Chao tree is built on is described in [segment tree](/algorithms/range-queries/segment-tree); the range-insertion variant is the same decomposition applied to the line's active interval.
- The offline variant that handles deletions uses the segment tree over time, and the persistence idea is the subject of [persistent segment tree](/algorithms/range-queries/persistent-segment-tree).
- The coordinate ranks used as leaves are the same idea as [coordinate compression](/algorithms/arrays/coordinate-compression).
- The dynamic program that the tree optimizes has the shape of the recurrences in [tree dynamic programming](/algorithms/trees/tree-dp), and the subtree merging is the same argument as [small-to-large merging](/algorithms/trees/small-to-large-merging).
- A dynamic program whose state is a budget rather than a coordinate is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack); the Li Chao tree is the optimization to reach for when the budget is a coordinate and the transition is linear.
- The binary search that maps a coordinate to its leaf is [binary search](/algorithms/searching/binary-search), and the prefix sums that often supply the intercept are in [prefix sums](/algorithms/arrays/prefix-sums).
