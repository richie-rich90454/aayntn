---
id: trees.centroid-decomposition
title: Centroid decomposition
summary: Split the tree at a vertex whose removal leaves only small pieces, so that every recursive subproblem has at most half the vertices.
division: [platinum]
subjects: [trees]
level: advanced
importance: advanced-technique
keywords:
    [
        centroid decomposition,
        centroid,
        tree divide and conquer,
        path counting,
        halving,
        distance pairs,
        heavy branch,
    ]
prerequisites:
    required: [graphs.dfs, foundations.complexity]
    recommended: [trees.tree-dp, graphs.dsu, trees.rerooting]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The input is a tree, and the components are found by removing vertices.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Answer a question about paths in a tree, by splitting the tree at balanced points |
| **Time** | $O(n \log n)$ for the whole decomposition |
| **Auxiliary space** | $O(n)$ |
| **Requires** | A tree, and a question that can be split by removing a vertex |
| **Fails when** | The pairs inside a single branch are not subtracted, or the histogram scan misses the equal-depth case |
| **Primary technique** | Remove a centroid, answer the paths that pass through it, and recurse |
| **Related** | Rerooting, tree dynamic programming, heavy-light decomposition |

A centroid is a vertex whose removal leaves nothing big behind. Repeatedly removing one splits the tree into pieces that shrink by half every time, and that geometric shrinking is what turns a quadratic question into a quasi-linear one.

## Problem motivation

Two people stand on a tree with $n$ vertices, and each vertex is either occupied or not. The question asks how many pairs of occupied vertices are exactly $k$ edges apart.

The constraints are what make the problem interesting.

- $1 \le n \le 200\,000$ vertices.
- $1 \le k \le n - 1$.
- Each vertex is either occupied or not, and the answer must be exact.

Checking every pair costs $O(n^2)$, which is $4 \cdot 10^{10}$ pairs at the maximum constraints. Even the version where only the occupied vertices are considered can be quadratic, because half the vertices can be occupied.

The reason the problem is hard is not the distance. Computing the distance between two vertices is easy, and the [lowest common ancestor](/algorithms/trees/lca) article shows it costs $O(\log n)$. The hard part is counting _all_ the pairs at once without looking at them.

The insight is to count the pairs that pass through one carefully chosen vertex, and then to recurse into the pieces left behind. The number of vertices the recursion visits at each level is $O(n)$, and the number of levels is $O(\log n)$, so the whole thing is $O(n \log n)$.

## Recognition patterns

Centroid decomposition is the right tool when all of the following hold.

- The question is about **pairs of vertices**, or about **paths**, and the answer must be counted rather than optimized.
- The tree is **static**.
- The question can be **split**: the pairs whose path passes through a chosen vertex can be answered separately from the pairs that lie entirely on one side of it.
- An **exact count** is wanted, not just an extreme value.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 2 \cdot 10^5$ | The $O(n \log n)$ bound is comfortable |
| Only an extreme value is wanted, such as the longest path | Rules out counting; use tree dynamic programming or rerooting instead |
| The question is about a **single** pair | Rules out counting; compute the distance directly |
| The tree changes between queries | The decomposition must be rebuilt |
| The graph is not a tree | Rules out the decomposition; the pieces do not separate cleanly |
| $k$ is close to $n$ | Rules out the usual implementation, which stores a histogram indexed by distance |
| The answer must be modulo a large number | Fine; the products in the histogram are the only concern |

Two phrases in a statement are reliable signals. "How many pairs", "count the ways", and "exactly $k$ edges apart" point here. "The longest path" and "the maximum sum" point away, because an extreme value does not need to be counted.

<Synonyms terms="centroid decomposition, centroid, tree divide and conquer, centroid of a tree, path counting, distance pairs, balanced split, heavy branch" />

## Naive approach

The baseline is to enumerate the pairs.

```python
count = 0
for a in occupied:
    for b in occupied:
        if a < b and distance(a, b) == k:
            count += 1
```

This costs $O(n^2)$ distance computations, each $O(\log n)$ with a lowest common ancestor structure, so it is far worse than the $4 \cdot 10^{10}$ bound already mentioned.

The second baseline is to search from every occupied vertex and count the vertices at distance exactly $k$. This is a breadth-first search per vertex with a depth limit, so it costs $O(n^2)$ in the worst case as well, though it is a smaller constant.

The third baseline is to use the [Euler tour](/algorithms/trees/euler-tour) and count pairs whose entry positions differ by a fixed amount, which works when the tree is a path but not in general.

## Key insight

The insight is that the tree can be split at a vertex so that every piece is small, and that the pairs can then be counted by where they sit relative to that vertex.

### The balanced split

A **centroid** of a tree $T$ is a vertex $c$ such that every connected component of $T - c$ contains at most $\lvert T \rvert / 2$ vertices. Every tree has one, and the reason is easy to see: root the tree anywhere and walk down from the root into any child whose subtree holds more than half the vertices. Such a child is unique at each step, and the walk must stop, and wherever it stops is a centroid.

Removing the centroid and recursing into each piece therefore produces a decomposition of depth at most $\lfloor \log_2 n \rfloor + 1$, because every piece has at most half as many vertices as its parent.

### Counting the pairs that pass through the centroid

Fix the centroid $c$ of the current piece $T$, and let $d(u)$ be the distance from $c$ to a vertex $u$.

If two vertices $a$ and $b$ lie in **different** pieces of $T - c$, or one of them is $c$ itself, then the path between them passes through $c$, and

$$
\operatorname{dist}(a, b) = d(a) + d(b).
$$

So the number of such pairs at distance exactly $k$ is the number of pairs whose depths sum to $k$, which is a question about a **histogram** of depths and is answered in linear time with two pointers.

If two vertices $a$ and $b$ lie in the **same** piece of $T - c$, their path does not pass through $c$, and their distance is

$$
\operatorname{dist}(a, b) = d(a) + d(b) - 2 d(\text{branch root}),
$$

which is strictly smaller than $d(a) + d(b)$. Those pairs are counted by the recursion into that piece.

The histogram of depths therefore counts both kinds of pairs, and the correction is to subtract, for each piece, the pairs inside it whose depths sum to $k$. That subtraction is exactly the same histogram computation applied to the piece alone.

## Formal model

Let $T$ be a tree with vertex set $V$, and let $M \subseteq V$ be the set of occupied vertices.

::: math definition Definition
A vertex $c$ of a tree $T$ is a **centroid** of $T$ if every connected component of $T - c$ contains at most $\lvert T \rvert / 2$ vertices. The pieces of $T - c$ are called the **branches** of $c$, and the vertex $c$ itself forms a branch of size one.
:::

::: math definition Definition
The **depth histogram** of a branch $B$ with respect to a vertex $c$ is the array $\text{cnt}[d]$ whose entry $d$ is the number of vertices of $B$ at distance exactly $d$ from $c$.
:::

::: math definition Definition
The **histogram pair count** of a histogram $\text{cnt}$ for a target $k$ is the number of unordered pairs of distinct occupied vertices whose two depths sum to $k$. When the two depths differ, it contributes $\text{cnt}[i] \cdot \text{cnt}[j]$; when they are equal, it contributes $\binom{\text{cnt}[i]}{2}$.
:::

::: math lemma Lemma (the centroid exists)
Every tree with at least one vertex has a centroid.
:::

::: math lemma Lemma (the size bound)
If $c$ is a centroid of $T$, then every branch of $c$ contains at most $\lvert T \rvert / 2$ vertices. Therefore a centroid decomposition of a tree with $n$ vertices has depth at most $\lfloor \log_2 n \rfloor + 1$.
:::

::: math lemma Lemma (the path through the centroid)
Let $a$ and $b$ be vertices of $T$ that do not lie in the same branch of the centroid $c$. Then $\operatorname{dist}(a, b) = d(a) + d(b)$, where $d(u)$ is the distance from $c$ to $u$.
:::

::: math lemma Lemma (the overcount)
Let $a$ and $b$ lie in the same branch of $c$, whose root is $r$. Then $\operatorname{dist}(a, b) = d(a) + d(b) - 2d(r)$, so $\operatorname{dist}(a, b) < d(a) + d(b)$.
:::

## Algorithm derivation

The state of the recursion is a set of vertices forming a connected piece of the tree, together with the target distance $k$.

```text
solve(piece):
    if the piece has fewer than two vertices: return 0
    c = the centroid of the piece
    compute d(u) and the branch of u for every vertex u of the piece
    build the total histogram over the whole piece
    total = pair_count(total_histogram, k)
    for each branch B of c:
        build the histogram of B
        total = total - pair_count(histogram of B, k)
    for each branch B of c:
        total = total + solve(B)
    return total
```

The pair count itself is a two-pointer scan.

```text
pair_count(cnt, k):
    i = 0, j = k
    result = 0
    while i <= j:
        if i + j == k:
            if i == j: result += cnt[i] * (cnt[i] - 1) / 2
            else:     result += cnt[i] * cnt[j]
            i = i + 1
            j = j - 1
        else if i + j < k: i = i + 1
        else:              j = j - 1
    return result
```

The scan is correct because it enumerates exactly the pairs of depths $(i, j)$ with $i + j = k$ and $i \le j$, and each such pair of depths contributes the number of vertex pairs it represents.

The subtraction is correct by the overcount lemma: a pair inside one branch is counted in the total histogram if and only if its depths sum to $k$, and it is counted in the branch histogram under exactly the same condition, so it is removed exactly once and never more. A pair in different branches is counted in the total histogram and in no branch histogram, so it survives.

The recursion then counts the pairs that lie entirely inside a branch, and by induction it counts exactly those whose distance is $k$.

::: math invariant Invariant
At every moment of the recursion, the pairs that the histogram counted and that have not been subtracted lie in different branches of the current centroid, and for such a pair the histogram condition $d(a) + d(b) = k$ is equivalent to $\operatorname{dist}(a, b) = k$.
:::

::: math invariant Invariant
Every ordered pair of occupied vertices is considered at exactly one level of the recursion: at the level of the first centroid that separates the two vertices into different branches.
:::

## Step-by-step execution

Take the path $p - c - m - u$ with four vertices, where $c$ is the centroid. The occupied vertices are $m$ and $u$, and the target distance is $k = 3$.

The centroid is $c$: removing $c$ leaves the branch $\{p\}$ of size one and the branch $\{m, u\}$ of size two, and both are at most $4 / 2 = 2$.

1. The distances from $c$ are $d(p) = 1$, $d(c) = 0$, $d(m) = 1$, and $d(u) = 2$.
2. The total histogram counts the occupied vertices: $\text{cnt}[1] = 1$ for $m$ and $\text{cnt}[2] = 1$ for $u$, with $\text{cnt}[0] = 0$ because $c$ is not occupied.
3. The pair count for $k = 3$: the pointer starts at $i = 0$ and $j = 3$. The sum $0 + 3 = 3$ matches, so the contribution is $\text{cnt}[0] \cdot \text{cnt}[3] = 0$. The pointers move to $i = 1$ and $j = 2$. The sum $1 + 2 = 3$ matches, so the contribution is $\text{cnt}[1] \cdot \text{cnt}[2] = 1$. The pointers move to $i = 2$ and $j = 1$, and the loop ends. The total is $1$.
4. The branch $\{p\}$ has no occupied vertices, so its pair count is $0$.
5. The branch $\{m, u\}$ has histogram $\text{cnt}[1] = 1$ and $\text{cnt}[2] = 1$, and the same scan gives a pair count of $1$. This is subtracted.
6. The running total is now $1 - 0 - 1 = 0$.
7. The recursion into $\{p\}$ returns $0$, because it has a single vertex. The recursion into $\{m, u\}$ finds the centroid $m$ or $u$; take $m$. The distances from $m$ within the branch are $d(m) = 0$ and $d(u) = 1$, and the two occupied vertices are at depths $0$ and $1$, whose sum is $1$, not $3$, so the branch contributes $0$ at this level and the recursion below it has nothing to add.
8. The final answer is $0$.

The truth is $0$, because the two occupied vertices $m$ and $u$ are one edge apart and not three. The pair was counted once in step 3 and removed once in step 5, and the removal is what makes the answer right.

Now the same tree with $k = 1$ instead.

1. The distances from $c$ are unchanged.
2. The total histogram is unchanged: $\text{cnt}[1] = 1$, $\text{cnt}[2] = 1$.
3. The pair count for $k = 1$: $i = 0$, $j = 1$, the sum is $1$, so the contribution is $\text{cnt}[0] \cdot \text{cnt}[1] = 0$. The pointers move to $i = 1$, $j = 0$, and the loop ends. The total is $0$.
4. The branch $\{m,u\}$ gives a pair count of $0$ as well, since the only occupied depth pair sums to $3$.
5. The running total is $0$.
6. The recursion into $\{m, u\}$ finds the centroid $m$, with depths $0$ and $1$ for the two occupied vertices, whose sum is $1$. The pair count is $\text{cnt}[0] \cdot \text{cnt}[1] = 1$, and the branch has only one branch, so nothing is subtracted. The answer from the recursion is $1$.
7. The final answer is $1$, which is correct: $m$ and $u$ are one edge apart.

## Correctness proof

::: math theorem Theorem
The algorithm returns the number of unordered pairs of occupied vertices whose distance is exactly $k$.
:::

::: math proof Proof
We prove by induction on the size of the piece that `solve(piece)` returns the correct count for that piece.

The base case is a piece with fewer than two vertices, which contains no pair at all, and the algorithm returns zero.

For the inductive step, let $c$ be the centroid of the piece $T$. Partition the unordered pairs of occupied vertices of $T$ into three kinds.

The first kind is the pairs that lie in different branches of $c$, including the pairs in which one vertex is $c$ itself. For such a pair, the path between the two vertices passes through $c$, so by the path-through-the- centroid lemma $\operatorname{dist}(a,b) = d(a) + d(b)$, and the pair is at distance $k$ if and only if its depths sum to $k$. Such a pair is counted in the total histogram exactly when the depths sum to $k$, and it is counted in no branch histogram. So the pairs of the first kind that survive the subtraction are exactly the ones at distance $k$, and each is counted once.

The second kind is the pairs that lie in the same branch of $c$. Such a pair is counted in the total histogram if and only if its depths sum to $k$, and it is counted in the histogram of that branch under exactly the same condition, because the branch histogram uses the same distances from $c$. So it is counted once and subtracted once, and it contributes nothing to the total. No pair of the second kind is counted twice or subtracted twice.

The third kind is the pairs that lie entirely inside a single branch. They are counted by the recursive call on that branch, which is correct by the induction hypothesis.

Every pair belongs to exactly one of the three kinds, and the kinds are disjoint, so the total returned by the algorithm is exactly the number of pairs at distance $k$. $\square$
:::

::: math theorem Theorem
The decomposition visits every vertex $O(\log n)$ times.
:::

::: math proof Proof
By the size bound lemma, every branch of a centroid has at most half as many vertices as its parent. Hence a vertex at depth $t$ of the decomposition belongs to a piece of at most $n / 2^t$ vertices, so it can be at depth at most $\lfloor \log_2 n \rfloor$. Each level of the decomposition processes every vertex of that level exactly once, so each vertex is processed at most $\lfloor \log_2 n \rfloor + 1$ times, and the total work is $O(n \log n)$. $\square$
:::

## Complexity analysis

**At each level: $O(n)$ time.** The search that computes the distances and the branches touches every vertex of the piece once, the histograms are built in time proportional to the number of vertices, and each two-pointer scan is proportional to the depth of the piece.

**Overall: $O(n \log n)$ time**, by the level argument above.

**Auxiliary space: $O(n)$.** The recursion has depth $O(\log n)$, and the piece sizes along the recursion path are at most $n, n/2, n/4, \ldots$, so the space held by the recursion is a geometric series that sums to $O(n)$.

::: math complexity Complexity
Centroid decomposition of a tree with $n$ vertices: $O(n \log n)$ time for the whole decomposition, and $O(n)$ space. A single level costs $O(n)$.
:::

Two practical warnings belong here. The histogram is indexed by distance, so its length is the depth of the piece, which is at most its size; allocating a histogram of length $n$ at every level costs $O(n \log n)$ space and should be avoided. And the pair counts are products of counts, so the answer needs a 64-bit integer: with $n$ occupied vertices the number of pairs can reach $n^2 / 2$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Counting pairs of vertices at a fixed distance | Centroid decomposition |
| Counting paths of a given shape through the tree | Centroid decomposition |
| The longest path, or a maximum over a path | [Tree dynamic programming](/algorithms/trees/tree-dp) or [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| An answer for every root, such as a sum of distances | [Rerooting](/algorithms/trees/rerooting) |
| A count over a subtree | The [Euler tour](/algorithms/trees/euler-tour) and a range-query structure |
| A subtree sum or count, computed for every vertex | A difference array over the flattened tree |
| Counting pairs on a path graph | A sliding window over the path, which is linear |
| A count that is not decomposable by separating a vertex | Rules out this technique |

The last row is the boundary of the technique. Centroid decomposition works because the pairs can be partitioned by the question "does the path between them pass through this vertex". A question that cannot be phrased that way does not decompose.

## Recursion decision

The recursion of the decomposition itself has depth $O(\log n)$, which is comfortable in every language. The traversal inside each piece is the part that can be deep.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative for the traversal; the decomposition recursion is shallow |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A tree that is a path on $10^6$ vertices. The decomposition recursion has depth about $20$, which is safe, but the traversal that computes the centroid and the distances inside each piece is a depth-first search that can reach a depth of $10^6$ if it is written recursively. In C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack is exhausted after about $130\,000$ frames, and the program dies with a segmentation fault on the first piece. The iterative traversal finishes the piece and the whole decomposition.
:::

The decomposition recursion itself is safe to write recursively, because its depth is logarithmic by the size bound. It is the traversal inside each piece that needs the iterative form.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting to subtract the branch counts | Pairs inside a branch are counted twice | Subtract the pair count of each branch |
| Missing the equal-depth case in the scan | Pairs at the same depth are never counted | Add $\binom{\text{cnt}[i]}{2}$ when $i = j$ |
| Choosing a vertex that is not a centroid | The decomposition becomes quadratic | Walk down the heavy branch to find the centroid |
| Allocating the histogram of length $n$ at every level | The space becomes $O(n \log n)$ | Size the histogram by the depth of the piece |
| Using a 32-bit integer for the answer | The count overflows | Use a 64-bit type |
| Forgetting that $c$ itself forms a branch | Pairs involving $c$ are missed | Include the centroid in the total histogram |
| Counting ordered pairs | The answer is twice too large | Count each unordered pair once |
| Recursing into the branches before the subtraction | The order does not matter, but the code becomes fragile | Do the counting at a level before recursing |

### Why this fails: the pair that is counted twice

The mistake that survives review most often is to count the pairs whose depths sum to $k$ over the whole piece and to recurse, without subtracting the pairs that lie inside a single branch.

The smallest counterexample is a path of four vertices $p - c - m - u$, where $c$ is the centroid, with $m$ and $u$ occupied and $k = 3$.

The distances from $c$ are $d(p) = 1$, $d(c) = 0$, $d(m) = 1$, and $d(u) = 2$. The total histogram has $\text{cnt}[1] = 1$ and $\text{cnt}[2] = 1$, and the pair count for $k = 3$ is $\text{cnt}[1] \cdot \text{cnt}[2] = 1$.

Without the subtraction, that $1$ survives into the answer. The truth is $0$, because $m$ and $u$ are one edge apart and not three. The pair was counted because the depths $1$ and $2$ happen to sum to $3$, but the path from $m$ to $u$ does not go through $c$.

Four vertices and three edges is the smallest counterexample, and it needs a branch with two occupied vertices at different depths whose sum happens to equal $k$.

### Why this fails: the pair at the same depth

The second mistake is to count only the pairs of different depths in the two-pointer scan, forgetting the case where the two depths are equal.

The smallest counterexample is a path of three vertices $x - c - y$, with $c$ as the centroid, with $x$ and $y$ occupied and $k = 2$.

The distances from $c$ are $d(x) = d(y) = 1$, so the histogram has $\text{cnt}[1] = 2$. The pair $x, y$ is at distance exactly $2$, and it is the only pair, so the answer is $1$.

The two-pointer scan reaches $i = 1$ and $j = 1$, where the sum is $2$, and the two depths are equal. The contribution is not $\text{cnt}[1] \cdot \text{cnt}[1]$ (which is $4$) and not $\text{cnt}[1]$ (which is $2$), but $\binom{2}{2} = 1$: the two occupied vertices at depth one give exactly one pair.

An implementation that handles only the case of two different depths reports $0$ on this graph. Three vertices and two edges is the smallest counterexample, and it is invisible whenever $k$ is odd, because then the equal-depth case never arises.

### Why this fails: the split that is not balanced

The third mistake is to split at an arbitrary vertex rather than at a centroid.

This is a performance counterexample rather than a wrong answer, and it is worth stating as one. Take a path on $n$ vertices and split it at the end of the path every time. The first piece has $n - 1$ vertices, the second has $n - 2$, and the total work is

$$
(n - 1) + (n - 2) + \cdots + 1 = O(n^2),
$$

which is $2 \cdot 10^{10}$ at $n = 200\,000$.

The centroid of a path is its middle vertex, and splitting there gives pieces of size at most $n / 2$, so the total work is $O(n \log n)$, a factor of $\log n$ smaller.

The failure is invisible on small inputs, and it is the reason the definition of a centroid has to be checked rather than assumed.

## Variants and extensions

- **Counting paths of a given length.** The same technique, with the histogram replaced by a convolution of the depth counts, which is a polynomial multiplication.
- **Counting paths through a vertex.** Without the subtraction, the histogram count is exactly the number of pairs whose path passes through the centroid, which is a useful quantity in its own right.
- **The divide and conquer on the tree.** The general form of the technique, used for problems that cannot be answered with a simple histogram.
- **Small to large merging.** A different way to handle the same "everything below a vertex" questions, with a merge of multisets instead of a decomposition. It is described in the [tree dynamic programming](/algorithms/trees/tree-dp) article.
- **A disjoint set union sweep.** The offline alternative to the decomposition for some queries, at the cost of $O((n+q) \alpha(n))$ instead of $O(n \log n)$ but with the queries sorted rather than the tree split.
- **Weighted versions.** When the vertices carry weights, the histogram entries are weights instead of counts, and the pair count multiplies weights rather than counting vertices.
- **The connection to the heaviest child.** The centroid of a tree is closely related to the heavy child used by [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition), and the two techniques share the idea that a tree has a small number of "large" directions.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Decide whether the question is a count of pairs or paths. An extreme value does not need this technique.
2. Find the centroid properly: compute the subtree sizes and walk down into the child that holds more than half the vertices.
3. Compute the distance from the centroid and the branch of every vertex in one traversal, and record both.
4. Build the total histogram over the whole piece, then subtract the histogram of each branch.
5. In the two-pointer scan, handle the case $i = j$ with a combination rather than a product.
6. Size the histogram by the depth of the piece, not by $n$.
7. Use a 64-bit integer for the counts and for the answer.
8. Test four pieces by hand: a single vertex, an edge, a path of three vertices with both ends occupied, and a path of four vertices with the middle two occupied.

## Worked problems

### Problem 1: the pairs at distance $k$

**Restatement.** A tree has $n$ vertices, each occupied or not, and a target distance $k$. Report the number of unordered pairs of occupied vertices at distance exactly $k$. Constraints: $1 \le n \le 200\,000$ and $1 \le k \le n - 1$.

**Naive baseline.** Enumerate the pairs, at a cost of $O(n^2)$.

**Insight.** A pair whose path passes through the centroid has distance equal to the sum of its two depths, and the pairs that do not pass through it lie entirely inside one branch.

**Derivation.** At each piece, find the centroid, build the total depth histogram, count the pairs whose depths sum to $k$ with two pointers, subtract the same count for each branch, and recurse into each branch.

**Correctness.** The proof above partitions the pairs into the ones that pass through the centroid and the ones that do not, shows that the subtraction removes exactly the false positives among the first kind, and shows that the recursion counts the second kind.

**Complexity.** $O(n \log n)$ time and $O(n)$ space. The answer needs a 64-bit integer.

**Common wrong approach.** Forgetting the subtraction, which reports pairs that lie inside a branch.

### Problem 2: the pairs whose path avoids a vertex

**Restatement.** The same tree, but the question asks for the number of pairs of occupied vertices whose path does **not** pass through a given vertex $v$. Constraints: $1 \le n \le 200\,000$ and $1 \le q \le 200\,000$, one query per vertex.

**Naive baseline.** One pass per query.

**Insight.** The decomposition computes, for every piece, the number of pairs whose path passes through that piece's centroid. A vertex $v$ lies on the path between $a$ and $b$ if and only if the first centroid that separates them lies on their path, so the number of pairs whose path avoids $v$ is the total number of pairs minus the ones counted at the level where $v$ is the centroid or where $v$ is separated.

**Derivation.** During the decomposition, accumulate the total number of occupied pairs. For every piece, record the number of pairs whose path passes through its centroid. The answer for a vertex $v$ is the total number of pairs minus the sum of the passing counts of the pieces on the path from the root of the decomposition down to $v$, which is a path query that the decomposition tree answers.

**Correctness.** Every pair is counted at exactly one level, the level of the first centroid separating it, and it passes through that centroid. So a pair passes through $v$ if and only if the separating centroid is $v$ or an ancestor of $v$ in the decomposition tree.

**Complexity.** $O(n \log n)$ for the decomposition and $O(n \log n)$ for the queries, with the answer for every vertex computed in the same pass.

**Common wrong approach.** Answering the query by counting the occupied vertices on each side of $v$ and multiplying, which counts the pairs whose path passes through $v$ rather than the ones that avoid it.

### Problem 3: the number of paths of a given length

**Restatement.** A tree has $n$ vertices, each occupied or not, and a target length $k$. Report the number of unordered pairs of occupied vertices joined by a path of exactly $k$ edges. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Enumerate the pairs.

**Insight.** The same decomposition, and the same histogram, except that the pair count needs the number of paths rather than the number of vertex pairs. At a given centroid, the number of paths of length $k$ from a vertex at depth $a$ to a vertex at depth $b$ is the number of ways to choose the intermediate vertices, which for a tree is one, so the vertex pair count is the path count and the same two-pointer scan works.

**Derivation.** As in Problem 1, but with the branches subtracted.

**Correctness.** As in Problem 1, since in a tree there is exactly one path between two vertices, so counting the vertex pairs counts the paths.

**Complexity.** $O(n \log n)$ time.

**Common wrong approach.** Using the count of vertex pairs at depth sum $k$ without subtracting the branches, which counts pairs whose path is shorter than $k$.

## Practice progression

1. **Recognition.** Given a statement, decide whether centroid decomposition applies. Look for "how many pairs", "count the paths", and a fixed distance.
2. **Direct application.** Implement the centroid finder and the histogram counting, and verify the answer against a brute-force pair enumeration on small random trees.
3. **Adaptation.** Change the distance to a path length, add weights to the vertices, and count the pairs whose path passes through a given vertex instead of avoiding it.
4. **Combination.** Combine the decomposition with a convolution for a length-dependent count, and with the decomposition tree to answer a query about every vertex at once.
5. **Challenge.** Solve a problem where the answer must be produced for every value of $k$ at once, and discover that the histogram scan does not scale to $n$ different values of $k$.
6. **Transfer.** Use the same idea elsewhere: the divide and conquer over a tree that answers general path questions, the small to large merging of [tree dynamic programming](/algorithms/trees/tree-dp), and the balanced split that [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) makes in a different way.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is a centroid, and how is one found in linear time? (Key insight)
2. State the size bound, and what it implies for the depth of the decomposition. (Formal model)
3. Why does a pair in different branches have distance equal to the sum of its depths? (Formal model)
4. Why does a pair inside a branch need to be subtracted, and what exactly is subtracted? (Algorithm derivation)
5. How does the two-pointer scan count the pairs of two equal depths? (Algorithm derivation)
6. What is the smallest tree on which a missing subtraction gives a wrong answer? (Why this fails)
7. What is the smallest tree on which the equal-depth case matters? (Why this fails)
8. Why must the split be balanced, and what happens if it is not? (Why this fails)
9. What are the time and space bounds, and where does the time go? (Complexity analysis)
10. Why is the recursion of the decomposition itself safe to write recursively? (Recursion decision)
11. What kind of question does this technique not decompose? (Algorithm selection)
12. How does the count relate to the number of paths between the vertices? (Worked problems)

## Further reading

- The technique that answers a question about the vertices of a tree, rather than about pairs, is [tree dynamic programming](/algorithms/trees/tree-dp), and its root-varying version is [rerooting](/algorithms/trees/rerooting).
- The other way of splitting a tree into a logarithmic number of pieces, used for path queries, is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The traversal that finds the centroid and the depths is [depth-first search](/algorithms/graphs/dfs).
- The flattening that answers subtree questions is [the Euler tour for trees](/algorithms/trees/euler-tour), and the ancestor test that appears in the path formulas is in the [lowest common ancestor](/algorithms/trees/lca) article.
- The call-stack limit that decides between the recursive and the iterative traversal inside a piece is covered in [recursion](/algorithms/foundations/recursion).
