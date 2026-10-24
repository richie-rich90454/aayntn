---
id: trees.euler-tour
title: Euler tour for trees
summary: Flatten a tree into an array in which every subtree occupies a contiguous interval, so that a subtree question becomes a range question.
division: [gold, platinum]
subjects: [trees]
level: advanced
importance: common-contest-technique
keywords:
    [
        euler tour,
        dfs order,
        flatten tree,
        tin,
        tout,
        subtree interval,
        offline queries,
        fenwick tree,
        difference array,
    ]
prerequisites:
    required: [graphs.dfs]
    recommended: [range-queries.fenwick-tree, arrays.prefix-sums, trees.lca]
complexity:
    time: "O(n) to build, O(log n) per query with a Fenwick tree"
    space: "O(n)"
assumptions:
    - The input is a tree rooted at a chosen vertex, and the tree does not change while the queries are answered.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Turn "everything inside a subtree" into "a contiguous stretch of an array" |
| **Time** | $O(n)$ to build, $O(\log n)$ per query with a Fenwick tree |
| **Auxiliary space** | $O(n)$ for the flattened array, the interval bounds, and the range structure |
| **Requires** | One depth-first search of the tree |
| **Fails when** | The exit bound is computed with the wrong convention, or the interval is scanned instead of indexed |
| **Primary technique** | A depth-first numbering in which the subtree of a vertex is a half-open interval |
| **Related** | Fenwick trees, segment trees, the lowest common ancestor, offline sweeps |

The name is shared with a different technique. An Euler tour of a **general graph** is a walk that uses every edge once; that is the subject of [the Euler tour for graphs](/algorithms/graphs/euler-tour). An Euler tour of a **tree** is this: a numbering of the vertices in which every subtree occupies one contiguous stretch of the numbering.

## Problem motivation

A company has $n$ employees arranged in a reporting tree. Every employee reports to exactly one manager, except the chief executive who reports to nobody. Each employee has a rating, and the human resources department needs to answer many questions of the form "what is the average rating of everyone in the subtree of this manager?"

The constraints are what make the flattening necessary.

- $1 \le n \le 200\,000$ employees.
- $1 \le q \le 200\,000$ queries, each naming a manager and a threshold on the rating.
- The tree is static: no employee changes manager while the queries run.

Answering a query by walking the subtree of the manager costs $O(\text{size of the subtree})$ per query. On a star tree with the chief executive at the center, every query about the chief executive walks $n$ vertices, so the total is $O(nq) = 4 \cdot 10^{10}$ steps.

The insight is that the tree has a natural **order** in which the subtree of a vertex is one contiguous block. Number the vertices in the order a depth-first search visits them, and that property holds for free. A block of an array is something every range-query structure can answer in logarithmic time, so the whole tree collapses into an array.

The second thing the numbering gives is the **inverse map**. Knowing the interval of a subtree tells you which vertices are in it. Knowing the position of a vertex tells you which vertex it is. Both directions are needed, and both are one array lookup.

## Recognition patterns

The flattened tree is the right tool when all of the following hold.

- The question is about **everything inside a subtree**, or about a **range of the tree**.
- The tree is **static**.
- There are **many queries**, so a per-query traversal is too slow.
- The answers are **aggregates** that can be computed with a prefix sum, a Fenwick tree, or a segment tree.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 2 \cdot 10^5$, $q \le 2 \cdot 10^5$ | The flattening plus a Fenwick tree is comfortable |
| $q = 1$ | A single traversal of the subtree is enough; the flattening is overhead |
| The tree changes between queries | The numbering must be rebuilt; use a dynamic structure |
| The question asks for a **path**, not a subtree | A path is two up-paths joined at an ancestor, and the flattening alone does not answer it |
| The aggregate is **not** decomposable | Rules out the prefix-sum and Fenwick approaches; use a segment tree or a different technique |
| Every employee has one manager and the structure is a tree | The flattening applies |
| The input is a general graph | Rules out the flattening; a depth-first forest gives one interval per component, not per subtree |

Two phrases in a statement are reliable signals. "Everyone under", "in the subtree of", and "all the descendants of" point here. "On the path from A to B" points away, and it is answered by the [lowest common ancestor](/algorithms/trees/lca) machinery instead.

<Synonyms terms="euler tour, euler tour of a tree, dfs order, preorder, flatten tree, tin, tout, entry time, exit time, subtree interval, offline queries, dfn ordering" />

## Naive approach

The baseline is to collect the subtree of a vertex into a list and scan it.

```python
def subtree_values(root, v):
    stack = [v]
    values = []
    while stack:
        x = stack.pop()
        values.append(value[x])
        for child in children[x]:
            stack.append(child)
    return values
```

This is $O(\text{size of the subtree})$ per query and $O(nq)$ in the worst case, which is too slow at the constraints above.

The second baseline is to answer each query with a fresh depth-first search that prunes at the target vertex. It has the same cost, and it also has to recompute the depths and the parents of the whole tree each time.

The third baseline is to use a **Fenwick tree over the depths**, which sounds right and is wrong. A Fenwick tree indexed by depth answers "how many vertices at depth $d$ are in the subtree of $v$", which is not a question anyone asked. Depth is not an order that keeps subtrees together.

## Key insight

The insight is that a depth-first search produces an order with a very special property: **the subtree of a vertex is a contiguous block**.

Here is why. A depth-first search enters a vertex, explores its entire subtree, and only then leaves it. Nothing outside the subtree can be visited in between, because the search never leaves a subtree before exhausting it. So the vertices of the subtree are visited consecutively, and no vertex from outside appears among them.

Numbering the vertices by the order of their **entry** gives an array $\text{order}[0], \text{order}[1], \ldots, \text{order}[n-1]$. Each vertex $v$ has an entry position $\text{tin}[v]$, and it has an exit position $\text{tout}[v]$ recorded when the search leaves it. With the convention that the counter is increased on entry only and that $\text{tout}[v]$ is the value of the counter at the moment the search leaves $v$, the subtree of $v$ is the half-open interval

$$
[\text{tin}[v],\ \text{tout}[v]).
$$

Two properties follow immediately and they are what the article is about.

**The interval property.** The vertices of the subtree of $v$ are exactly $\text{order}[\text{tin}[v]], \ldots, \text{order}[\text{tout}[v] - 1]$. The size of the subtree is therefore $\text{tout}[v] - \text{tin}[v]$, which is a number the array gives for free.

**The inverse map.** The array is a bijection: $\text{order}[i]$ is the vertex whose entry position is $i$, and $\text{tin}[v]$ is the position of $v$. So a range of the array can be translated back into a set of vertices, and a vertex can be translated into a position.

The ancestor test is the third property, and it is the one that makes the numbering worth having even without any range structure. A vertex $u$ is an ancestor of $v$ exactly when

$$
\text{tin}[u] \le \text{tin}[v] < \text{tout}[u],
$$

which is an interval containment test and takes constant time.

With the array in hand, every range-query structure becomes available. A prefix-sum array answers "the sum of the values in the subtree of $v$" in constant time. A Fenwick tree answers "the number of vertices in the subtree of $v$ with a value at least $k$" in logarithmic time, provided the vertices are added in the order of their values, which is the offline technique below.

## Formal model

Let $T$ be a tree with vertex set $V$ rooted at a vertex $r$, and let $\text{ch}(v)$ be the set of children of $v$.

::: math definition Definition
Fix a depth-first search of $T$ from $r$ and a counter that starts at zero and is increased once for every vertex entered. The **entry position** $\text{tin}[v]$ is the counter value at the moment $v$ is entered, and the **exit position** $\text{tout}[v]$ is the counter value at the moment the search leaves $v$. The **flattened array** is $\text{order}[i] = \text{the vertex with entry position } i$.
:::

::: math definition Definition
The **subtree interval** of a vertex $v$ is the half-open interval $I(v) = [\text{tin}[v], \text{tout}[v])$ of positions in the flattened array.
:::

::: math lemma Lemma (the subtree interval property)
For every vertex $v$, the set of vertices in the subtree of $v$ is exactly $\{ \text{order}[i] : \text{tin}[v] \le i < \text{tout}[v] \}$. In particular, the subtree has $\text{tout}[v] - \text{tin}[v]$ vertices.
:::

::: math lemma Lemma
For every pair of vertices $u$ and $v$, $u$ is an ancestor of $v$ if and only if $\text{tin}[u] \le \text{tin}[v] < \text{tout}[u]$.
:::

::: math lemma Lemma
The entries of the flattened array are distinct, so the map from a position to a vertex and the map from a vertex to a position are inverse to each other.
:::

## Algorithm derivation

The build rule is a single depth-first search.

```text
timer = 0
dfs(v):
    tin[v] = timer
    order[timer] = v
    timer = timer + 1
    for each child c of v:
        dfs(c)
    tout[v] = timer
```

The update is correct because the counter is increased exactly once per vertex, at the moment of entry, so the entries of the array are the entry positions in increasing order. And $\text{tout}[v]$ is recorded after all of $v$'s children have been explored, so it is the first position after the whole subtree.

Two offline techniques turn the interval into an answer.

**The difference array, for "every subtree at once".** Put the value of each vertex at its entry position in a difference array, and subtract it at its exit position. The prefix sums of that array then give, at position $\text{tin}[v]$, the sum of the values of the vertices in the subtree of $v$. The whole computation is $O(n)$.

**The Fenwick tree sweep, for "many threshold queries".** Build the Fenwick tree over the flattened array, where position $\text{tin}[u]$ holds the weight of the vertex $u$ if $u$ satisfies the query's condition and zero otherwise. A query is then the range sum over $I(v)$, which costs $O(\log n)$.

The sweep is what makes the threshold version work. Sort the vertices by their value, and sort the queries by their threshold. Then activate the vertices in increasing order of value, adding each one at its entry position, and answer the queries in increasing order of threshold. When a query with threshold $k$ is answered, exactly the vertices with value at least $k$ are active.

::: math invariant Invariant
During the build, the vertices already numbered form a set $S$ such that the subtree of every vertex that has been entered but not yet left is exactly a contiguous suffix of the numbered positions, and the subtree of every vertex that has been left is exactly a contiguous block.
:::

::: math invariant Invariant
During the Fenwick sweep, the Fenwick tree holds, at position $\text{tin}[u]$, the weight of the vertex $u$ if and only if $u$ has been activated, and zero otherwise. When a query with threshold $k$ is answered, the activated vertices are exactly those with value at least $k$.
:::

## Step-by-step execution

Take the tree with edges $0-1$, $0-2$, $1-3$, rooted at $0$. The children of $0$ are $1$ and $2$, and the child of $1$ is $3$.

1. Enter $0$: $\text{tin}[0] = 0$, $\text{order}[0] = 0$, and the counter becomes $1$.
2. Enter $1$: $\text{tin}[1] = 1$, $\text{order}[1] = 1$, and the counter becomes $2$.
3. Enter $3$: $\text{tin}[3] = 2$, $\text{order}[2] = 3$, and the counter becomes $3$. Vertex $3$ has no children, so $\text{tout}[3] = 3$.
4. Leave $1$: $\text{tout}[1] = 3$.
5. Enter $2$: $\text{tin}[2] = 3$, $\text{order}[3] = 2$, and the counter becomes $4$. Vertex $2$ has no children, so $\text{tout}[2] = 4$.
6. Leave $0$: $\text{tout}[0] = 4$.

The flattened array is $[0, 1, 3, 2]$, and the intervals are

| Vertex | Entry | Exit | Subtree interval | Vertices in the subtree |
| ------ | ----- | ---- | ---------------- | ----------------------- |
| 0      | 0     | 4    | $[0, 4)$         | 0, 1, 3, 2              |
| 1      | 1     | 3    | $[1, 3)$         | 1, 3                    |
| 2      | 3     | 4    | $[3, 4)$         | 2                       |
| 3      | 2     | 3    | $[2, 3)$         | 3                       |

Now a query with threshold $k$: "how many vertices in the subtree of $1$ have value at least $k$". Suppose the values are $10, 20, 30, 40$ for the vertices $0, 1, 3, 2$ in that array order.

Sort the vertices by value: $0$ with $10$, $1$ with $20$, $3$ with $30$, $2$ with $40$. Sort the queries by threshold. Take one query with threshold $20$ and one with threshold $40$.

1. The query with threshold $20$ comes first. Activate the vertices with value at least $20$, in increasing order: $1$ at position $1$, $3$ at position $2$, $2$ at position $3$. The Fenwick tree now holds $1$ at position $1$, $1$ at position $2$, and $1$ at position $3$, and $0$ at position $0$.
2. The answer for the subtree of $1$, which is the interval $[1, 3)$, is the sum over positions $1$ and $2$, which is $2$.
3. The query with threshold $40$ comes next. Activate $2$ at position $3$. It was already active, so nothing changes; more precisely, only the vertex $2$ has value at least $40$, and it was activated in the first step as well because its value $40$ is at least $20$.
4. The answer for the subtree of $1$ is still $2$, since neither $1$ nor $3$ has value at least $40$.

The sweep works because the active set only grows, and the queries are answered in increasing order of threshold.

## Correctness proof

::: math theorem Theorem
The build produces an array and two bounds per vertex such that the subtree of every vertex $v$ is exactly the half-open interval $[\text{tin}[v], \text{tout}[v])$ of the array.
:::

::: math proof Proof
Fix a vertex $v$. The counter is increased exactly once per vertex, at the moment that vertex is entered, so the positions $0, 1, \ldots, n-1$ are assigned to the vertices in the order of their entry, and each vertex gets a distinct position. Hence the array $\text{order}$ is a bijection between positions and vertices, and it is the inverse of the map $v \mapsto \text{tin}[v]$.

The search enters $v$ at the moment the counter is $\text{tin}[v]$. From that moment until the moment it leaves $v$, the search visits exactly the vertices in the subtree of $v$ and no others. To see the first part, the search leaves $v$ only after exploring every child of $v$, and by induction on the depth each child is explored exactly through its own subtree. To see the second part, the search never returns to $v$ once it has left it, because a vertex is expanded only once.

The positions assigned during that period are therefore $\text{tin}[v], \text{tin}[v] + 1, \ldots, \text{tout}[v] - 1$, where $\text{tout}[v]$ is the counter value at the moment of leaving $v$, because the counter has been increased once for each of those vertices and not since. So the vertices of the subtree occupy exactly the interval $[\text{tin}[v], \text{tout}[v])$. $\square$
:::

::: math theorem Theorem
The Fenwick sweep answers every query "how many vertices in the subtree of $v$ satisfy the condition" correctly.
:::

::: math proof Proof
The queries are answered in non-decreasing order of their threshold. Before a query with threshold $k$ is answered, the sweep has activated every vertex whose value is at least $k$ and no vertex whose value is below $k$: the activation list is sorted by value and is consumed in order, and a vertex is activated exactly when the sweep reaches its value, which happens before the first query with a threshold at least that value.

The Fenwick tree therefore holds, at position $\text{tin}[u]$, the weight of $u$ if $u$ satisfies the condition and zero otherwise. The range sum over $[\text{tin}[v], \text{tout}[v])$ is, by the subtree interval property, the sum of the weights of exactly the vertices in the subtree of $v$, which is the count the query asks for. $\square$
:::

## Complexity analysis

**Building the flattening: $O(n)$ time.** The search enters each vertex once and examines each edge twice.

**The difference-array version: $O(n)$ time for every subtree at once.** Each vertex contributes two updates to the difference array, and the prefix sums take one more linear pass.

**The Fenwick sweep: $O((n + q) \log n)$ time.** The sort of the vertices costs $O(n \log n)$, the sort of the queries costs $O(q \log q)$, each activation is one Fenwick update, and each query is one Fenwick range sum.

**Auxiliary space: $O(n)$** for the entry and exit bounds, the flattened array, the value array, and the Fenwick tree, plus $O(q)$ for the sorted queries.

::: math complexity Complexity
Flattening a tree with $n$ vertices: $O(n)$ time and $O(n)$ space. Answering $q$ subtree queries with a threshold: $O((n + q) \log n)$ time with a Fenwick tree, or $O(n + q)$ when the query is a plain sum and a difference array suffices.
:::

The difference-array case deserves the emphasis, because it is much faster than the Fenwick case and it is often the right answer. When the query asks for a sum over a subtree, the answer for **every** subtree is a prefix-sum computation on the flattened array, and it costs one linear pass. The Fenwick tree is needed only when the query has a threshold that is not known in advance, so the vertices cannot all be activated at once.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| A sum or a count over a subtree | The flattening with a prefix sum or a difference array |
| A threshold query over a subtree, answered offline | The flattening with a Fenwick tree sweep |
| A threshold query answered online, with updates | The flattening with a segment tree over the flattened array |
| Whether one vertex is an ancestor of another | The flattening and the interval test, in constant time |
| A query over a **path** | The [lowest common ancestor](/algorithms/trees/lca) and a path data structure |
| A query over a subtree of a **changing** tree | The flattening is invalid; use a dynamic structure |
| A query over a general graph | Not a tree problem; use a traversal |
| Every query asks about the whole tree | No flattening needed |

The row about the segment tree is worth expanding. Once the tree is an array, a segment tree over the array supports point updates and range queries in $O(\log n)$, which is what an online version of the threshold query needs. The Fenwick tree is the offline version of the same thing, and it is faster because it does not need the second array.

## Recursion decision

The flattening is produced by a depth-first search, and the search is the only place where recursion could occur.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $n$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A tree that is a path on $10^6$ vertices, rooted at one end. The flattening is trivially correct and the whole computation is linear, but the recursive search makes one nested call per vertex, so in C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack is exhausted after about $130\,000$ frames, and the program dies with a segmentation fault before it has numbered $13\%$ of the vertices. The iterative form, which keeps the current vertex and the index of the next child to explore on an explicit stack, finishes normally.
:::

The iterative form needs one extra piece of state: the index of the next child to explore. Without it, the search cannot tell "just entered this vertex" from "returned from the first child", and the exit bound would be recorded too early.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Treating the exit bound as inclusive | The subtree wrongly includes the vertex just after it | Use the half-open interval, or record `tout[v] = timer - 1` and use a closed interval |
| Recording the exit bound on entry | Every subtree is reported as a single vertex | Record `tout[v]` after the children are explored |
| Using one counter for entries and exits | The positions are not a bijection and the intervals overlap | Use a counter that is increased only on entry |
| Scanning the interval for each query | $O(nq)$ instead of $O((n+q) \log n)$ | Build a range-query structure over the flattened array |
| Indexing the Fenwick tree by depth | The range is not a subtree | Index it by the entry position |
| Forgetting to sort the queries by threshold | The active set does not match the query | Sort the queries and the vertices |
| Assuming the subtree is the interval from the entry to the parent's exit | The interval is wrong for every non-leaf | Use the vertex's own exit bound |
| Building the flattening from a different root than the queries assume | Every subtree is wrong | Fix the root before the search and use it in the queries |

### Why this fails: the subtree that includes its neighbor

The mistake that survives review most often is mixing the two conventions for the exit bound. The build records $\text{tout}[v]$ as the counter value at the moment the search leaves $v$, which makes the interval half-open, and the query then treats it as a closed interval.

The smallest counterexample is a tree with three vertices: the root $0$ with children $1$ and $2$, and no other edges.

The flattening gives $\text{tin}[0] = 0$, $\text{tin}[1] = 1$, $\text{tin}[2] = 2$, $\text{tout}[1] = 2$, $\text{tout}[2] = 3$, and $\text{tout}[0] = 3$. The array is $[0, 1, 2]$.

The subtree of vertex $1$ is $\{1\}$, and the half-open interval $[\text{tin}[1], \text{tout}[1]) = [1, 2)$ gives exactly that. The closed interval $[1, 2]$ gives the positions $1$ and $2$, which are the vertices $1$ and $2$, and vertex $2$ is not in the subtree of $1$.

The truth is that the subtree of $1$ has one vertex. The buggy interval has two. Every query about a subtree that is not the last one in the array is wrong, and the queries about the last subtree in the array are either wrong or out of range.

Three vertices and two edges is the smallest counterexample, and the failure is invisible on a tree where every subtree is a suffix of the array.

### Why this fails: the exit bound recorded too early

The second mistake is to record $\text{tout}[v]$ when the search enters $v$ rather than when it leaves.

The smallest counterexample is a tree with two vertices: the root $0$ with the single child $1$.

With the mistake, the search enters $0$, records $\text{tout}[0] = 1$, and then enters $1$, recording $\text{tin}[1] = 1$ and $\text{tout}[1] = 2$. The subtree of $0$ is reported as the interval $[0, 1)$, which is the single vertex $0$.

The truth is that the subtree of the root is the whole tree, which has two vertices. The subtree of $1$ is still correct, so a test suite that only queries leaves passes.

Two vertices and one edge is the smallest possible counterexample, and it is the shape of every real reporting tree at the top of the hierarchy, where the query that matters most is the one about the whole company.

### Why this fails: the interval that is scanned

The third mistake is to answer the query by walking the interval, which is correct and which is exactly what the flattening was supposed to avoid.

The smallest counterexample is a performance counterexample, and it is worth stating as one. Take a star tree with $n$ vertices: the root has $n-1$ children, and each child is a leaf. Ask $n$ queries, one for each vertex, each asking for the number of vertices in that subtree. The queries about the root each scan $n$ positions, so the total is $O(n^2)$, which is $4 \cdot 10^{10}$ at $n = 200\,000$.

The same queries against a Fenwick tree over the flattened array cost $O((n + q) \log n)$, which is a few million operations.

The failure is not a wrong answer but a timeout, and it survives every small test case, because on a tree of ten vertices the scan is instant. It is the reason the flattening must be paired with a range-query structure rather than used on its own.

## Variants and extensions

- **The double-entry tour.** A variant lists every vertex twice, once on entry and once on exit, giving an array of length $2n$. The first occurrence of a vertex is its entry position and the second is its exit position, and the lowest common ancestor of two vertices is the vertex of smallest depth between their first occurrences, which a sparse table answers in constant time. This is the form used by the [lowest common ancestor](/algorithms/trees/lca) machinery.
- **Updates.** A segment tree over the flattened array supports a change to a vertex's value together with a subtree query, in $O(\log n)$ per operation. The Fenwick tree supports the same thing when the updates are only additions.
- **Two-dimensional queries.** A query such as "count the vertices in the subtree of $v$ whose value is at least $k$" is a rectangle query in the pair of coordinates (entry position, value), and a Fenwick tree over the positions with the values handled by the offline sweep is the standard answer.
- **Path queries.** The flattening does not solve path queries by itself, but the entry and exit positions make the ancestor test constant time, which is the primitive that the path techniques need.
- **A forest.** Several trees can be flattened into one array by continuing the counter from one component to the next. The intervals stay correct, because the components occupy disjoint blocks.
- **The subtree size.** The size of the subtree of $v$ is $\text{tout}[v] - \text{tin}[v]$, which is the cheapest query the flattening answers.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Fix the root before writing anything, and use it in both the search and the queries.
2. Write down the interval convention in the code as a comment: half-open, and the exit bound is the counter at the moment of leaving.
3. Use one counter, increased on entry only.
4. Choose the range structure to match the query. A plain sum wants a prefix sum; a threshold query wants a Fenwick tree with a sweep, or a segment tree if updates arrive.
5. Test four shapes by hand: a single vertex, a path, a star, and a tree with a vertex that has several children. The star is the one that catches a scan instead of an index.
6. Print the answer of a small example by hand and check it against the interval. The interval table in the step-by-step section is the shape of that check.

## Worked problems

### Problem 1: the ratings of every subtree

**Restatement.** A tree has $n$ employees, each with a rating. For every employee, report the sum of the ratings in their subtree. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Compute the subtree size and the subtree sum for each vertex with a post-order traversal, at a cost of $O(n)$, which is in fact already optimal.

**Insight.** The flattening gives the same answer with a difference array, and it is the right foundation for the harder variants.

**Derivation.** Flatten the tree. For each vertex $u$, add $\text{rating}[u]$ at position $\text{tin}[u]$ and subtract it at position $\text{tout}[u]$ in a difference array. Take the prefix sums. The value at position $\text{tin}[v]$ is the sum of the ratings in the subtree of $v$.

**Correctness.** By the subtree interval property, the vertices of the subtree of $v$ occupy exactly the positions in $I(v)$, and the difference array contributes the rating of each vertex once to every prefix that contains its entry position and cancels it at the exit position, so exactly the positions in $I(v)$ keep the contribution.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Using the half-open interval with a closed-interval query, which adds the vertex just after the subtree.

### Problem 2: the threshold query about a subtree

**Restatement.** The same tree, and $q$ queries, each naming a vertex $v$ and a threshold $k$, asking how many vertices in the subtree of $v$ have a rating of at least $k$. Constraints: $1 \le n, q \le 200\,000$.

**Naive baseline.** Walk the subtree for each query, at a cost of $O(nq)$.

**Insight.** The subtree is an interval, so the query is a range query, and the threshold is handled by activating the vertices in increasing order of rating.

**Derivation.** Flatten the tree. Sort the vertices by rating and the queries by threshold. Sweep: activate each vertex at its entry position when the sweep reaches its rating, and answer each query with a Fenwick range sum over $I(v)$.

**Correctness.** The sweep activates exactly the vertices with rating at least the current threshold, and the Fenwick range sum over $I(v)$ counts exactly those of them that lie in the subtree of $v$.

**Complexity.** $O((n + q) \log n)$ time and $O(n + q)$ space.

**Common wrong approach.** Sorting the vertices but not the queries, so that the active set does not match the threshold being asked about.

### Problem 3: the ancestors of a vertex

**Restatement.** The same tree, and $q$ queries, each naming a vertex $v$ and asking for the number of its ancestors, including $v$ itself.

**Naive baseline.** Walk up the parents, at a cost of $O(n)$ per query.

**Insight.** The interval test answers the ancestor question in constant time, and the ancestors of $v$ are exactly the vertices whose intervals contain $\text{tin}[v]$.

**Derivation.** Flatten the tree. For a query about $v$, count the vertices $u$ with $\text{tin}[u] \le \text{tin}[v] < \text{tout}[u]$, which is a range counting query on the entry and exit positions. With a Fenwick tree over the exit positions and a sweep on the entry positions, the count is $O(\log n)$.

**Correctness.** By the ancestor lemma, $u$ is an ancestor of $v$ exactly when $\text{tin}[v]$ lies in $I(u)$, and the sweep counts the intervals that contain the point $\text{tin}[v]$.

**Complexity.** $O(n \log n + q \log n)$ time with the sweep, or $O(n + q)$ with a difference array, since every interval contributes one to the count of the points it contains and the difference array adds one at the entry and subtracts one at the exit.

**Common wrong approach.** Using the depth of a vertex, which counts the vertices on the root-to-vertex path rather than the ancestors, and is off by one for the root.

## Practice progression

1. **Recognition.** Given a statement, decide whether the flattening applies. Look for "subtree", "descendants", "under", and a static tree.
2. **Direct application.** Build the flattening and answer a subtree sum with a prefix sum, then verify the intervals by hand on a small tree.
3. **Adaptation.** Answer a threshold query with the Fenwick sweep, and add point updates with a segment tree over the flattened array.
4. **Combination.** Combine the flattening with a Fenwick tree to answer a two-dimensional query, and with the ancestor test to answer a path query.
5. **Challenge.** Solve a problem where the tree changes between queries and discover that the numbering is invalid; then solve the offline version, where all the queries are known in advance.
6. **Transfer.** Use the flattening for a different purpose: the double-entry tour that gives a constant-time lowest common ancestor, the range-query structures for a different subject, or the counting technique that answers "how many nodes are in the subtree" without a tree at all.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the subtree interval property precisely, including the convention. (Formal model)
2. Why does a depth-first search produce a contiguous block for a subtree? (Key insight)
3. What is the inverse map, and what is it used for? (Key insight)
4. Give the constant-time ancestor test. (Formal model)
5. How does the Fenwick sweep handle the threshold? (Algorithm derivation)
6. When is a difference array enough, and when is a Fenwick tree needed? (Complexity analysis)
7. What is the smallest tree on which a closed interval wrongly includes a vertex? (Why this fails)
8. What is the smallest tree on which an exit bound recorded on entry is wrong? (Why this fails)
9. What is the time and space of the flattening and of the sweep? (Complexity analysis)
10. How does the double-entry tour differ from this flattening? (Variants and extensions)
11. When is recursion unsafe in the search, and what is the failure mode? (Recursion decision)
12. Why does the flattening not answer path queries on its own? (Algorithm selection)

## Further reading

- The other meaning of the name, the walk that uses every edge of a graph once, is [the Euler tour for graphs](/algorithms/graphs/euler-tour).
- The range-query structures that the flattening makes available are the [Fenwick tree](/algorithms/range-queries/fenwick-tree) and the [segment tree](/algorithms/range-queries/segment-tree).
- The ancestor test and the path techniques that build on it are in the [lowest common ancestor](/algorithms/trees/lca) article.
- The traversal that produces the flattening is [depth-first search](/algorithms/graphs/dfs).
- The technique that answers a different question about the same tree, by combining the answers of the children, is [tree dynamic programming](/algorithms/trees/tree-dp).
