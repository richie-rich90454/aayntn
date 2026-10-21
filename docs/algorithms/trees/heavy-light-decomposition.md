---
id: trees.heavy-light-decomposition
title: Heavy-light decomposition
summary: Split the tree into chains that follow the child with the largest subtree, flatten the chains into one array, and answer a path query in a logarithmic number of chain segments.
division: [platinum]
subjects: [trees]
level: advanced
importance: advanced-technique
keywords: [heavy light decomposition, hld, heavy path, light edge, subtree size, path query, chain]
prerequisites:
    required: [graphs.bfs, foundations.complexity]
    recommended: [trees.lca, arrays.prefix-sums]
complexity:
    time: "O(n) to build, O(log n) per path query"
    space: "O(n)"
assumptions:
    - "The tree is static: no node is added, removed or reweighted after the decomposition is built."
implementations: trees.heavy-light-decomposition
visualization: trees.heavy-light-decomposition
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="trees.heavy-light-decomposition" />

A heavy-light decomposition cuts a tree into chains. At every vertex, one child is designated **heavy**: the child whose subtree holds the most vertices. The chain follows heavy edges downward, so each chain is a path from a vertex down to a leaf or to a light edge. The chains are then flattened into one array, and the vertices of each chain occupy a contiguous range of it.

The payoff is that a path in the tree crosses only a logarithmic number of chains. The reason is a single inequality: a **light** edge, which is any edge that is not heavy, at least halves the size of the subtree it leads into. A path from the root to a leaf therefore contains at most $\lfloor \log_2 n \rfloor$ light edges, and each chain segment of the path is one contiguous range of the flattened array.

With prefix sums over the flattened array, a chain segment costs $O(1)$, so a path query costs $O(\log n)$ in total. With a segment tree over the same array it costs $O(\log^2 n)$. The build costs $O(n)$.

## Problem motivation

A power grid is a tree of substations, and each substation carries a load. The operator asks, many times a day, "what is the total load on the path from substation $u$ to substation $v$?"

The constraints are the whole problem.

- $1 \le n \le 200\,000$ substations.
- $1 \le q \le 200\,000$ queries, each naming a pair of substations.
- The tree does not change: no substation is added or removed.

Enumerating the path of every query is $O(n)$ per query, and the sum of the path lengths over all queries can be $O(nq) = 4 \cdot 10^{10}$.

The [lowest common ancestor](/algorithms/trees/lca) table helps, because the path splits at the lowest common ancestor into two upward paths. But the two upward paths are still long, and the table does not answer questions about the values along a path. A structure is needed that turns a path into a small number of contiguous ranges of an array, and that is exactly what the decomposition provides.

## Recognition patterns

Heavy-light decomposition is the right tool when all of the following hold.

- The structure is a **tree** or a **forest**.
- The questions are about **paths**: the sum of the values on a path, the maximum on a path, the number of marked vertices on a path.
- The tree is **static**. A node added later changes the subtree sizes of its whole ancestry, and the chains with it.
- The same path question is asked **many times**, or the values are updated often.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The tree is a chain | Every path is one range; a prefix sum over the chain order answers it |
| The tree changes between queries | The decomposition must be rebuilt; the chains depend on the subtree sizes |
| The question is about a single vertex | An ordinary tree dynamic program answers it |
| $q = 1$ | Walk the path once |
| $n \ge 10^6$ | The arrays cost about $40n$ bytes, so 40 MB; check the limit |
| The tree is balanced already | The decomposition still works, but the chains are short and a different technique may be simpler |

The phrases in a statement that signal this technique are "the sum of the weights on the path from $u$ to $v$" and "the maximum value on the path between two nodes". The phrase that rules it out is "the tree is updated", which points at a link-cut tree instead.

<Synonyms terms="HLD, heavy light decomposition, heavy path decomposition" />

## Naive approach

The baseline is to walk the path and sum the values.

```python
def path_sum(u, v):
    total = 0
    while u != v:
        if depth[u] < depth[v]:
            u, v = v, u
        total += values[u]
        u = parent[u]
    total += values[u]
    return total
```

This is $O(n)$ per query, and it is correct for any tree. It is also the reference implementation for the differential test.

The second baseline is to use the binary lifting table of the [lowest common ancestor](/algorithms/trees/lca) article and to accumulate the values along the way. It has the same $O(n)$ cost, because the number of edges on the path does not change.

The third baseline is to re-root the tree at every possible root and precompute the answer for each. That costs $O(n^2)$ time and memory, which at $n = 200\,000$ is $4 \cdot 10^{10}$ entries. The change-of-root technique in [tree dynamic programming](/algorithms/trees/tree-dp) is the linear-time version of the same idea, but it answers questions about _independent sets_ rather than about paths.

## Key insight

The insight is that a tree has a logarithmic number of "interesting" branches, and that the interesting branches can be identified by size alone.

**The heavy child.** At every vertex $u$ with at least one child, the heavy child is the child whose subtree holds the most vertices. Every other child is **light**. The heavy edges form chains, because each vertex has at most one heavy child and at most one heavy parent.

**The halving claim.** Let $c$ be a light child of $u$, and let $h$ be the heavy child of $u$. The subtree of $u$ contains the subtree of $u$ itself, the subtree of $h$, and the subtree of $c$, so

$$
\text{size}(u) \;\ge\; 1 + \text{size}(h) + \text{size}(c)
\;\ge\; 1 + 2\,\text{size}(c),
$$

where the second inequality holds because $h$ is the child with the largest subtree and $c$ is not it. Rearranging,

$$
\text{size}(c) \;\le\; \frac{\text{size}(u) - 1}{2} \;<\; \frac{\text{size}(u)}{2}.
$$

So **every light edge at least halves the size of the subtree**.

**The consequence.** On a path from the root to a leaf, the subtree sizes strictly decrease, and each light edge halves them. A path therefore crosses at most $\lfloor \log_2 n \rfloor$ light edges, and therefore at most $\lfloor \log_2 n \rfloor + 1$ chains. The same bound holds for the path between any two vertices, because that path is the union of two upward paths, each of which is a suffix of a root-to-vertex path.

**The flattening.** Write the chains into one array, one after the other, and each chain in depth order. The vertices of a chain then occupy a contiguous range of indices, and the prefix sums over that array turn a chain segment into one subtraction.

The whole technique is the combination of these four facts: the chains are few, the chains are contiguous, and the path is a union of few chain segments.

## Visual intuition

Draw the tree, and then draw every chain in a different color, starting each chain at a vertex whose edge from its parent is light. A chain is therefore a path of heavy edges, and it ends where a light edge begins.

Now draw the path from $u$ to $v$ on top of that picture. The path is broken into alternating pieces: a piece inside one chain, then a light edge, then a piece inside the next chain. The picture shows why the number of pieces is small: the light edges are exactly the edges where the subtree at least halves, so there can only be a handful of them.

The flattened array is the last picture. The vertices of one chain sit next to each other in the array, in the order of their depth, so a chain segment is an ordinary range of the array. That is what lets a segment tree or a prefix sum answer it.

The laboratory below draws the tree, the chains in color, and the flattened array underneath.

<AlgorithmPlayer algorithm="trees.heavy-light-decomposition" />

## Formal model

Let $T$ be a tree with vertex set $V$, rooted at $r$, and let $\text{value}(v)$ be the weight of a vertex.

<MathPanel type="definition" title="Definition">
The **subtree size** of a vertex $v$ is the number of vertices in the
subtree rooted at $v$, including $v$ itself. The **heavy child** of $v$ is
the child $c$ of $v$ with the largest subtree size. A child of $v$ that is
not the heavy child is a **light child**, and the edge to it is a **light
edge**.
</MathPanel>

<MathPanel type="definition" title="Definition">
A **chain** is a maximal path of heavy edges. It is identified by its top
vertex, called the **head** of the chain. The **position** of a vertex is
its index in the flattened array, where the chains are written one after
the other and each chain is written in depth order.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $c$ be a light child of $u$. Then
$\text{size}(c) \le (\text{size}(u) - 1)/2 < \text{size}(u)/2$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
A path from the root to any vertex crosses at most
$\lfloor \log_2 n \rfloor$ light edges, and therefore at most
$\lfloor \log_2 n \rfloor + 1$ chains.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $h$ be the head of the chain of a vertex $v$, and let $p$ be the
parent of $h$. The vertices of the chain segment from $h$ to $v$ occupy
the contiguous range $[\text{pos}(h), \text{pos}(v)]$ of the flattened
array, in increasing depth.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **path** from $u$ to $v$ is the unique set of vertices on the route
between them. Its weight is $\sum_{w \in \text{path}(u, v)} \text{value}(w)$,
and both endpoints are included.
</MathPanel>

## Algorithm derivation

The build has four stages.

1. **Orient the tree.** A breadth-first walk from the root fixes the parent and the depth of every vertex.
2. **Compute the subtree sizes.** Read the vertices in the reverse of the traversal order, so that every child is processed before its parent, and accumulate $\text{size}[u] = 1 + \sum_{c} \text{size}[c]$. In the same pass, record the child with the largest subtree as the heavy child.
3. **Flatten the chains.** For every vertex $v$ that is not the heavy child of its parent, walk down the heavy edges from $v$ and write the whole chain into the flattened array, recording the head and the position of each vertex on the way.
4. **Build the prefix sums.** Compute the running totals of the flattened array, so that any range of it is one subtraction.

The query rule has two parts. While the two endpoints lie in different chains, take the chain of the deeper endpoint, add the value of that chain segment, and move the endpoint to the parent of the chain's head. Once the two endpoints lie in the same chain, the rest of the path is the range between their positions, and it is one more subtraction.

The move in the loop crosses a light edge, because the head of a chain is by definition a vertex whose edge from its parent is light. That is why the loop runs only a logarithmic number of times.

<MathPanel type="invariant" title="Invariant">
At the start of every iteration of the query loop, the vertices already
counted are exactly the part of the path from the original endpoints up
to the current endpoints, and the remaining part of the path runs from the
current endpoint of $u$ to the current endpoint of $v$.
</MathPanel>

### Why the loop always makes progress

The loop compares the depths of the two _chain heads_, not the depths of the two endpoints, and it always moves the endpoint whose head is deeper. The head of the deeper chain is strictly below the head of the shallower chain, so the whole chain segment from the endpoint up to its head lies on the path and does not contain the other endpoint. The segment is therefore counted correctly, and the endpoint moves strictly upward, so the loop terminates.

When the two heads are at the same depth and the heads differ, either endpoint may be moved; the reference implementation keeps $u$ fixed in that case by the strict comparison.

## Step-by-step execution

Take the tree with edges $0-1$, $1-2$, $1-3$, rooted at $0$, and the values $1, 2, 3, 4$ for the vertices $0, 1, 2, 3$.

The subtree sizes are $\text{size}[3] = 1$, $\text{size}[2] = 1$, $\text{size}[1] = 3$, and $\text{size}[0] = 4$. The heavy child of $1$ is $2$ and the heavy child of $0$ is $1$.

There are two chains. The first starts at $0$ and follows the heavy edges $0 \to 1 \to 2$. The second starts at $3$, because the edge $1-3$ is light. The flattened array is therefore $[1, 2, 3, 4]$, with the positions $0, 1, 2, 3$ and the heads $0, 0, 0, 3$. The prefix sums are $[0, 1, 3, 6, 10]$.

Now query the path from $2$ to $3$.

1. The heads are $\text{head}[2] = 0$ and $\text{head}[3] = 3$, so they differ and the loop begins.
2. The depth of the head $0$ is $0$ and the depth of the head $3$ is $2$, so the deeper chain is the one of $3$. The endpoints are exchanged, so $u = 3$ and $v = 2$.
3. The segment from $3$ up to its head $3$ is the single vertex $3$. The contribution is $\text{prefix}[4] - \text{prefix}[3] = 10 - 6 = 4$.
4. The endpoint moves to the parent of the head, which is $1$. Now $\text{head}[1] = 0$ and $\text{head}[2] = 0$, so the loop ends.
5. Both endpoints are in one chain. The deeper one is $2$, so the contribution is $\text{prefix}[3] - \text{prefix}[1] = 6 - 1 = 5$.
6. The total is $4 + 5 = 9$, which is $3 + 2 + 4$: the values of the vertices $2$, $1$, and $3$ on the path.

Notice that the loop ran once. The path crossed one light edge, and the light edge halved the subtree: the subtree of $1$ has three vertices and the subtree of $3$ has one.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The decomposition satisfies the halving claim: every light edge leads into
a subtree that is strictly smaller than half of the subtree it leaves.
</MathPanel>

<MathPanel type="proof" title="Proof">
Let $u$ be a vertex and $c$ a light child of $u$. Since $c$ is not the
heavy child, $u$ has a heavy child $h$, and by the definition of the
heavy child, $\text{size}(h) \ge \text{size}(c)$. The subtree of $u$
contains $u$ itself, the subtree of $h$ and the subtree of $c$, and these
are disjoint, so

$$
\text{size}(u) \;\ge\; 1 + \text{size}(h) + \text{size}(c)
\;\ge\; 1 + 2\,\text{size}(c).
$$

Therefore $\text{size}(c) \le (\text{size}(u) - 1)/2 < \text{size}(u)/2$, which is the claim. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
A path between two vertices of a tree with $n$ vertices crosses at most
$\lfloor \log_2 n \rfloor + 1$ chains.
</MathPanel>

<MathPanel type="proof" title="Proof">
Let $w$ be the lowest common ancestor of the two endpoints. The path is
the union of the path from the first endpoint up to $w$ and the path from
the second endpoint up to $w$. Each of those is a suffix of a path from the
root, so it is enough to bound the number of light edges on a root-to-vertex
path.

On such a path, the subtree sizes strictly decrease, and by the previous theorem each light edge reduces the current subtree size to strictly less than half of it. Starting from at most $n$ and halving at each light edge, after $k$ light edges the subtree size is less than $n / 2^k$, and it is at least $1$. So $n / 2^k > 1$, which gives $k < \log_2 n$, hence $k \le \lfloor \log_2 n \rfloor$. Each chain boundary on the path is a light edge, so the path crosses at most $\lfloor \log_2 n \rfloor + 1$ chains. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
The path query returns the sum of the values of the vertices on the path
between the two endpoints, both included.
</MathPanel>

<MathPanel type="proof" title="Proof">
The build stage stores at each vertex the subtree size, which the previous
theorem uses, and it flattens the chains so that the vertices of a chain
occupy a contiguous range in depth order. That is the claim of the third
lemma above.

Now the query. At the start of each iteration, the invariant says that the counted vertices are exactly the part of the path below the current endpoints. The two endpoints lie in different chains. One of the two chain heads is deeper than the other, and the segment from the endpoint of the deeper chain up to its head lies entirely on the path, because the head is deeper than the other chain's head and therefore below the lowest common ancestor. The algorithm adds the value of that segment, which is one subtraction of two prefix sums over a contiguous range of the flattened array, and then moves the endpoint to the parent of the head. The counted part grows by exactly that segment, so the invariant is preserved.

Each iteration moves an endpoint up across a light edge, and by the second theorem there are at most $O(\log n)$ such edges on the path, so the loop terminates. When it terminates the two endpoints lie in one chain, and the remaining part of the path is exactly the range between their positions in the flattened array, because a chain is a path in the tree and the positions follow the depth. The algorithm adds that range as one more subtraction, and the two endpoints are counted exactly once, by the inclusive range. The total is therefore the sum of the values of all the vertices on the path. $\square$
</MathPanel>

## Complexity analysis

**The build: $O(n)$ time.** The traversal is $O(n)$, the subtree sizes are computed in one pass over the vertices, the chains are written into the flattened array once each, and the prefix sums are one more pass.

**Each path query: $O(\log n)$ time** with the prefix sums of the reference implementation, because the loop runs $O(\log n)$ times and each chain segment costs $O(1)$.

**Each path query: $O(\log^2 n)$ time** if the flattened array is supported by a [segment tree](/algorithms/range-queries/segment-tree) instead of by prefix sums, because each chain segment then costs $O(\log n)$. The manifest states the segment-tree bound at the top level and the prefix-sum bound per variant, and the reference implementations use the prefix sums.

**Space: $O(n)$** for the parent, depth, subtree size, heavy child, chain head and position arrays, plus the flattened array and its prefix sums. That is about $40n$ bytes at 64 bits for the two numeric arrays.

<MathPanel type="complexity" title="Complexity">
Heavy-light decomposition of a tree with $n$ vertices: $O(n)$ to build,
$O(\log n)$ per path query with prefix sums over the flattened array,
$O(\log^2 n)$ per path query with a segment tree over it, and $O(n)$ extra
space.
</MathPanel>

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Many path queries on a static tree | Heavy-light decomposition |
| Many ancestor queries on a static tree | Binary lifting |
| Path queries on a tree that changes | A link-cut tree |
| Many subtree queries on a static tree | Euler tour with a sparse table, or binary lifting with sizes |
| Independent sets and other subtree questions | Tree dynamic programming |
| One path query | Walk the path |
| A tree that is already a chain | A prefix sum over the chain order |

The first three rows are the standard division of the tree-query toolkit. Binary lifting answers questions about _ancestry_ and is logarithmic per query; heavy-light decomposition answers questions about _the contents of a path_ and is logarithmic per query once the decomposition is built; a link-cut tree does both but supports a tree that changes.

## Reference implementations

<CodeViewer algorithm="trees.heavy-light-decomposition" />

The manifest publishes two variants. The `minimal` variant is a reusable class whose constructor takes an adjacency list, a root, and the value of every vertex. It computes the subtree sizes, the heavy children, the chain heads and the positions, and it exposes the size of a subtree, the heavy child of a vertex, the head of a chain, the position of a vertex, and the sum of the values on a path. The `program` variant reads the tree, then the queries, and prints one path sum per line. The value of the vertex $i$ is $i + 1$.

## Recursion decision

The build and the query are both loops. The traversal that finds the parents and the depths is the one place where the choice matters, and the reference implementation uses an explicit queue.

The reason is the same as in the [lowest common ancestor](/algorithms/trees/lca) article: the depth of the tree can be $n - 1$, so a recursive traversal needs $n$ frames.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a chain of $n$ vertices needs $n$ frames |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

There is one place where recursion is natural rather than dangerous: the subtree sizes are a fold over the children, and a recursive post-order traversal computes them. It is still $O(n)$ deep in the worst case, so the iterative form with a reversed traversal order is the one to ship.

## Implementation walkthrough

The first decision is the order of the two build stages. The subtree sizes must be known before the heavy children can be chosen, and the heavy children must be known before the chains can be written. The reference implementation therefore computes the sizes in a separate pass over the traversal order in reverse.

The second decision is the order in which the chains are written. The reference implementation walks the traversal order and starts a chain at every vertex that is not the heavy child of its parent. Any order works, as long as each chain is written contiguously and in depth order.

The third decision is the comparison in the query loop. It compares the depths of the two chain heads:

```cpp
if (depth_[head_[u]] < depth_[head_[v]]) {
    const int swap = u;
    u = v;
    v = swap;
}
```

Comparing the depths of the endpoints instead would be wrong. The endpoint can be deep inside a long chain while the other endpoint's chain head is high up, and moving the deep endpoint up would then skip over vertices that are not on the path.

The fourth decision is the range of the final segment:

```cpp
total += prefix_[pos_[v] + 1] - prefix_[pos_[u]];
```

The `+ 1` is what makes the range inclusive of the vertex at `pos[v]`, and the two positions are in depth order because the chain is written in depth order.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Choosing the heavy child by the number of children | The halving claim fails and the query becomes linear | Choose by subtree size |
| Comparing the depths of the endpoints in the query loop | Vertices off the path are counted | Compare the depths of the chain heads |
| Writing a chain in an order other than depth order | The final segment is a reversed range | Write each chain from its head downward |
| Counting the chain head twice | Every path is overcounted by one or more | Move the endpoint to the parent of the head |
| Forgetting the inclusive end of the final range | The deeper endpoint is dropped | Add one to the upper position |
| Computing the subtree sizes top down | Every size is zero or wrong | Compute them from the leaves upward |
| Assuming the number of edges on a path is logarithmic | A chain has $n - 1$ edges on its longest path | Count chains, not edges |
| Rebuilding the decomposition after every update | The whole point of the structure is lost | Use a link-cut tree for a dynamic tree |

### Why this fails: the logarithmic path that is not logarithmic

The mistake that survives review most often is a claim about the shape of the paths that is nearly true, and the error is invisible until the decomposition is used on a chain.

The claim is that a path in a tree with $n$ vertices crosses $O(\log n)$ edges. It is false, and the smallest counterexample is a tree with three vertices in a row: the path from the first to the third crosses two edges, and $\log_2 3 \approx 1.58$.

Two vertices are not a counterexample, because the single edge of the path matches $\log_2 2 = 1$. Three vertices are the smallest tree with a path longer than the logarithmic bound, and a chain of $n$ vertices makes the error as large as possible: its longest path crosses $n - 1$ edges.

The statement that is true is about **light** edges, not about edges. Every edge of a chain is heavy, so a chain contributes $n - 1$ heavy edges and not one light edge. The correct bound is the one the halving claim gives: a path crosses at most $\lfloor \log_2 n \rfloor$ light edges, and therefore at most $\lfloor \log_2 n \rfloor + 1$ chains.

The distinction matters in the code. A query that walks _edges_ is linear. A query that walks _chains_ is logarithmic, because each chain segment is answered by one subtraction rather than by a step per edge.

There is a second failure with the same root, and it breaks the halving claim itself. Suppose the heavy child is chosen by the number of children rather than by the size of the subtree. Take a root $r$ with two children $a$ and $b$, where $a$ has four children, each of which has one child of its own, and $b$ has five children and no grandchildren. The subtree of $a$ has nine vertices and the subtree of $b$ has six. By the number of children, $b$ wins with five against four, so the edge to $a$ becomes light. But the subtree of $a$ has nine vertices and the subtree of $r$ has sixteen, and $9 > 16/2$, so the light edge did **not** halve the subtree. The logarithmic bound is gone, and on a tree built from repeated copies of this shape the query becomes linear.

The generalization is a condition on the whole technique: **the heavy child is the child with the largest subtree, not the child with the most children.** The subtree sizes are the only thing the halving claim talks about, and any other rule invalidates it.

## Variants and extensions

- **Path updates.** A range update over a path becomes $O(\log n)$ lazy updates, one per chain segment, on a segment tree over the flattened array.
- **Path minimum, maximum, and gcd.** The same decomposition, with the segment tree merging the appropriate quantity.
- **Path xor.** A segment tree over the flattened array, with the merge being the xor.
- **Counting marked vertices on a path.** The same shape, with the merge being a count.
- **The tree of the chains.** The chains form a path of chains, and the problem becomes a range query over that path.
- **A different weight.** The heavy child may be chosen by the number of marked vertices in the subtree rather than by the number of vertices, which is what some problems about marked nodes need.
- **Euler tour with a sparse table.** An alternative that answers path queries without a decomposition, at the price of $O(n \log n)$ memory.
- **Link-cut trees.** The dynamic counterpart, which supports a tree whose edges change, at an amortized logarithmic cost.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Compute the subtree sizes first and check a couple of them by hand. The heavy children are chosen from the sizes, so a wrong size ruins everything above it.
2. Choose the heavy child by subtree size, and when two children tie, choose either and say so in a comment.
3. Write the chains so that each one is contiguous and in depth order, and check one chain by eye against the tree.
4. In the query loop, compare the depths of the chain heads, not of the endpoints.
5. Test the four cases explicitly: a vertex with itself, a path along one chain, a path that crosses one light edge, and a path that crosses several.
6. Write the naive path walk as a reference and compare on random pairs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the total load on a path

**Restatement.** A tree of $n$ substations is given, each with a load. Each query names two substations and asks for the sum of the loads on the path between them, both endpoints included. Constraints: $1 \le n \le 200\,000$ and $1 \le q \le 200\,000$.

**Naive baseline.** Walk the path for every query, at a cost of $O(n)$ per query.

**Insight.** A path crosses only a logarithmic number of chains, and each chain segment is a contiguous range of the flattened array.

**Derivation.** Build the decomposition. On a query, loop while the two endpoints are in different chains, adding the segment from the deeper chain's endpoint to its head and moving that endpoint to the parent of the head. Finish with the range between the two positions.

**Correctness.** The invariant proof shows that the counted vertices are exactly the path, and the halving theorem shows that the loop runs $O(\log n)$ times.

**Complexity.** $O(n)$ to build, $O(\log n)$ per query, and $O(n)$ space.

**Common wrong approach.** Counting the chain head twice, because the segment ends at the head and the next segment starts at its parent.

### Problem 2: the maximum load on a path

**Restatement.** The same tree, and each query asks for the maximum load on the path between two substations. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Walk the path for every query, at a cost of $O(n)$.

**Insight.** The decomposition is the same, but the chain segment is answered by a segment tree over the flattened array rather than by a subtraction.

**Derivation.** Build the same decomposition, and build a segment tree over the flattened array whose merge is the maximum. On a query, take the same chain segments, and query the segment tree for the maximum over each segment, keeping the largest of the answers.

**Correctness.** The segments partition the path, so the largest of the segment maxima is the maximum over the path.

**Complexity.** $O(n)$ to build, $O(\log^2 n)$ per query, and $O(n)$ space.

**Common wrong approach.** Using the prefix sums of the flattened array, which can only answer sums and not maxima.

### Problem 3: counting the marked substations on a path

**Restatement.** A tree of $n$ substations is given, each marked or unmarked. Each query asks how many marked substations lie on the path between two substations. Constraints: $1 \le n \le 200\,000$, and the marks never change.

**Naive baseline.** Walk the path and count, at a cost of $O(n)$ per query.

**Insight.** The same decomposition, and the same flattened array, with the value of a vertex replaced by $1$ when it is marked and $0$ otherwise. Then the path sum is the count.

**Derivation.** Flatten the chains as before, but write the mark instead of the load into the flattened array. The prefix sums then answer every chain segment in constant time.

**Correctness.** Each segment contributes the number of marked vertices it holds, and the segments partition the path.

**Complexity.** $O(n)$ to build, $O(\log n)$ per query, and $O(n)$ space.

**Common wrong approach.** Using the load instead of the mark, which is right only when every vertex is marked.

## Practice progression

1. **Recognition.** Given a statement, decide whether the decomposition applies. Look for many path queries on a static tree.
2. **Direct application.** Build the decomposition and answer a path sum, then verify against the naive walk on random pairs.
3. **Adaptation.** Change the merge to a maximum and a count, using a segment tree over the flattened array.
4. **Combination.** Combine the decomposition with lazy propagation for path updates, and with the binary lifting table for the lowest common ancestor.
5. **Challenge.** Solve a problem where the tree changes between queries and discover that the chains go stale; then solve the version where the queries are known in advance, with an offline sweep.
6. **Transfer.** Use the idea behind the decomposition elsewhere: pick the largest part at every step so that the number of pieces is logarithmic, which is the same argument that makes a divide and conquer cost logarithmic rather than linear.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the heavy child of a vertex, and what is a light edge? (Formal model)
2. Prove that a light edge at least halves the subtree size. (Correctness proof)
3. Why does a path cross only a logarithmic number of chains? (Correctness proof)
4. What is the smallest tree on which the claim "a path crosses $O(\log n)$ edges" fails? (Why this fails)
5. Which depths are compared in the query loop, and why not the depths of the endpoints? (Implementation walkthrough)
6. How does the flattening turn a chain segment into a range? (Key insight)
7. What is the cost of a path query with prefix sums, and with a segment tree? (Complexity analysis)
8. Why does choosing the heavy child by the number of children break the halving claim? (Why this fails)
9. When is a link-cut tree the better tool? (Algorithm selection)
10. Why must the traversal that computes the parents be iterative? (Recursion decision)

## Further reading

- The ancestor table that answers the questions the decomposition does not, the lowest common ancestor among them, is in [lowest common ancestor](/algorithms/trees/lca).
- The subtree questions that the decomposition is often combined with are answered by [tree dynamic programming](/algorithms/trees/tree-dp).
- The structure that answers the chain segments when the quantity is not a sum is the [segment tree](/algorithms/range-queries/segment-tree), and the technique that answers a chain segment by a subtraction is [prefix sums](/algorithms/arrays/prefix-sums).
- The traversal that fixes the parents and the depths is [breadth-first search](/algorithms/graphs/bfs).
- Every listing in this article, in all six languages, is published in the reference implementations of this repository, in six languages each.
