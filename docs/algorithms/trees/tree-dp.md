---
id: trees.tree-dp
title: Tree dynamic programming
summary: Root the tree, keep one state per vertex per parent decision, and merge the subtrees from the leaves upward.
division: [gold, platinum]
subjects: [trees]
level: intermediate
importance: common-contest-technique
keywords:
    [
        tree dp,
        tree dynamic programming,
        house robber on a tree,
        independent set,
        rerooting,
        change of root,
    ]
prerequisites:
    required: [graphs.bfs, foundations.complexity]
    recommended: [trees.lca, start.data-structures]
complexity:
    time: "O(n)"
    space: "O(n)"
assumptions:
    - "The tree is static: no vertex is added or removed while the dynamic program runs."
reviewed: false
---

## Problem motivation

A group of houses stands along a single road, and each house is connected to its neighbors. A thief cannot rob two houses that share a wall, because the neighbor will hear him. What is the largest amount the thief can take?

The classic version of the problem is a row of houses, and it is solved by a two-state dynamic program. Put the houses on a _tree_ instead of a row, where a house may have several neighbors, and the same idea still works, with one extra step: the houses have to be put in an order, and the order of a tree is the order of its depth-first traversal.

The constraints are what make the technique necessary.

- $1 \le n \le 200\,000$ houses.
- Each house has a non-negative value.
- The houses form a tree: $n - 1$ roads, connected.

Enumerating all the independent sets of a tree is exponential, and the number of them grows faster than $2^n$ for a star. The dynamic program computes the answer in $O(n)$, and the change-of-root technique computes the answer for _every_ possible root in $O(n)$ as well.

## Recognition patterns

Tree dynamic programming is the right tool when all of the following hold.

- The structure is a **tree** or a **forest**.
- The question is about a **subset of the vertices** chosen under a constraint, such as no two chosen vertices being adjacent.
- The constraint **crosses the boundary** of a subtree, so that a subtree cannot be solved in isolation.
- The tree is **static**.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The tree has $n \le 20$ vertices | A bitmask over the vertices answers it directly |
| The graph is not a tree | The decomposition into subtrees does not exist; use a graph technique |
| The constraint is a global one, such as "the total must be at most $K$" | The subproblems are not independent; the two-state merge does not apply |
| The tree changes between queries | The order and the states must be recomputed |
| Only one root matters | A single bottom-up pass is enough; the change of root is not needed |

The phrases in a statement that signal this technique are "no two chosen vertices may be adjacent", "each house may rob its neighbors but not both at once", and "choose a set of vertices maximizing the total weight".

<Synonyms terms="rerooting, reroot DP, re-rooting, tree dp" />

## Naive approach

The baseline is to enumerate all the subsets of the vertices and keep the best valid one.

```python
best = 0
for mask in range(1 << n):
    total = 0
    valid = True
    for v in range(n):
        if mask >> v & 1:
            total += value[v]
            for w in neighbors[v]:
                if mask >> w & 1:
                    valid = False
    if valid:
        best = max(best, total)
```

This is $O(n 2^n)$ and it is hopeless at $n = 200\,000$. It is worth writing for $n \le 20$, where it is a good reference implementation, and it is the reason the dynamic program is needed at all.

The second baseline is to solve the problem once for every possible root, which is what a naive reader does when the question mentions the root. That costs $O(n)$ per root and $O(n^2)$ in total, and the change-of-root technique is what brings it back to $O(n)$.

## Key insight

The insight is that a subtree cannot be summarized by one number, and the reason is the parent.

Consider a vertex $u$ and its children. If $u$ is **taken**, then none of its children may be taken, and the best you can do in each child subtree is the best that excludes the child. If $u$ is **not taken**, then each child may be taken or not, whichever is better.

Those are two different questions, and a single number cannot answer both. So the state has two values, one for each decision about $u$.

The second insight is that **the choice inside a child subtree does not depend on the other child subtrees**. The subtrees of two different children of $u$ are disjoint and there is no edge between them, so once $u$ is decided, the children can be optimized independently and their answers added. That is what makes the merge an addition rather than a search.

The third insight is that **the whole tree can be re-rooted for free**. The bottom-up computation gives the answer for one root. The change-of-root technique adds a second, top-down pass that computes the answer for every root in the same $O(n)$ time, by reusing the bottom-up results for the parts of the tree that do not change.

## Formal model

::: math definition Definition
Let $T$ be a tree rooted at $r$, and let $S(u)$ be the subtree of a vertex $u$, that is, $u$ together with all its descendants. The **parent** of $u$ is its unique neighbor on the path to $r$, and the **children** of $u$ are its other neighbors.
:::

::: math definition Definition
A selection of vertices is **valid** if no two selected vertices are adjacent. Its **weight** is the sum of the values of its selected vertices.
:::

::: math definition Definition
For a vertex $u$ and a state $s \in \{0, 1\}$, let $\text{down}[u][s]$ be the maximum weight of a valid selection inside $S(u)$ in which $u$ is selected if and only if $s = 1$.
:::

::: math definition Definition
For a vertex $u$ whose parent is $p$, let $\text{up}[u][s]$ be the maximum weight of a valid selection inside $V \setminus S(u)$ in which $p$ is selected if and only if $s = 1$.
:::

## Algorithm derivation

**The rooting.** Pick a root, and run a traversal from it. The traversal produces the parent of every vertex, the depth of every vertex, and an order in which every parent comes before its children. That order is all that is needed: the bottom-up pass walks it backwards, and the top-down pass walks it forwards.

**The bottom-up pass.** For a leaf $u$, $\text{down}[u][1] = \text{value}[u]$ and $\text{down}[u][0] = 0$. For an internal vertex $u$ with children $c$:

$$
\text{down}[u][1] \;=\; \text{value}[u] + \sum_{c} \text{down}[c][0],
$$

because taking $u$ forbids taking every child, and

$$
\text{down}[u][0] \;=\; \sum_{c} \max\bigl(\text{down}[c][0],\; \text{down}[c][1]\bigr),
$$

because not taking $u$ leaves each child free.

The answer for the tree rooted at $r$ is $\max(\text{down}[r][0], \text{down}[r][1])$.

**The top-down pass.** For the root, the outside of its subtree is empty, so $\text{up}[r][0] = \text{up}[r][1] = 0$. For a child $c$ of a vertex $u$:

$$
\text{up}[c][0] \;=\; \max\bigl(\text{up}[u][0], \text{up}[u][1]\bigr)
+ \sum_{c' \ne c} \max\bigl(\text{down}[c'][0], \text{down}[c'][1]\bigr),
$$

because $u$ is not selected, so its parent is free and every sibling subtree is free; and

$$
\text{up}[c][1] \;=\; \text{up}[u][0] + \text{value}[u]
+ \sum_{c' \ne c} \text{down}[c'][0],
$$

because $u$ is selected, so its parent may not be selected and none of its children may be selected.

The two final answers for a vertex $u$ are then

$$
\text{fullSkip}[u] \;=\; \max\bigl(\text{up}[u][0], \text{up}[u][1]\bigr) + \text{down}[u][0],
$$

$$
\text{fullTake}[u] \;=\; \text{up}[u][0] + \text{down}[u][1],
$$

which are the maximum weight of a valid selection of the **whole** tree that excludes $u$, and of one that includes $u$.

::: math invariant Invariant
$\text{down}[u][s]$ is the maximum weight of a valid selection inside $S(u)$ in which $u$ is selected if and only if $s = 1$. The invariant is preserved by the merge because the child subtrees of $u$ are pairwise disjoint and there is no edge between any two of them, so the choices inside them are independent once the state of $u$ is fixed, and the best combined choice is the sum of the best individual choices.
:::

### Why the merge is an addition and not a search

The invariant is what licenses the summation. Two conditions make it hold.

**Disjointness.** The subtrees of two different children of $u$ share no vertex, so a selection in one and a selection in the other cannot select the same vertex twice.

**No cross edges.** In a tree, two vertices are adjacent if and only if one is the parent of the other. A child of $u$ and a sibling of that child are therefore not adjacent, and their subtrees are not adjacent to each other. The only constraint that crosses between the subtrees is the one through $u$, and the state $s$ records exactly whether $u$ is taken.

In a general graph neither condition holds, and the same merge would be wrong, because the choices in the two parts would not be independent.

## Step-by-step execution

Take the tree with edges $0-1$, $0-2$, $1-3$, rooted at $0$, with the values $1, 2, 3, 4$ for the vertices $0, 1, 2, 3$.

**The bottom-up pass.** The traversal order is $0, 1, 2, 3$, and the reverse order is $3, 2, 1, 0$.

1. Vertex $3$ is a leaf: $\text{down}[3][1] = 4$ and $\text{down}[3][0] = 0$.
2. Vertex $2$ is a leaf: $\text{down}[2][1] = 3$ and $\text{down}[2][0] = 0$.
3. Vertex $1$ has the child $3$: $\text{down}[1][1] = 2 + \text{down}[3][0] = 2 + 0 = 2$, and $\text{down}[1][0] = \max(0, 4) = 4$.
4. Vertex $0$ has the children $1$ and $2$: $\text{down}[0][1] = 1 + \text{down}[1][0] + \text{down}[2][0] = 1 + 4 + 0 = 5$, and $\text{down}[0][0] = \max(\text{down}[1]) + \max(\text{down}[2]) = 4 + 3 = 7$.
5. The answer for the root $0$ is $\max(7, 5) = 7$, which is the selection $\{2, 3\}$ of weight $3 + 4$.

**The top-down pass.** The root has an empty outside, so $\text{up}[0][0] = \text{up}[0][1] = 0$.

1. For the child $1$ of $0$: $\text{up}[1][0] = 0 + \max(\text{down}[2][0], \text{down}[2][1]) = 0 + 3 = 3$, and $\text{up}[1][1] = 0 + 1 + \text{down}[2][0] = 1 + 0 = 1$.
2. For the child $2$ of $0$: $\text{up}[2][0] = 0 + \max(\text{down}[1][0], \text{down}[1][1]) = 0 + 4 = 4$, and $\text{up}[2][1] = 0 + 1 + \text{down}[1][0] = 1 + 4 = 5$.
3. For the child $3$ of $1$: $\text{up}[3][0] = \max(3, 1) + 0 = 3$, and $\text{up}[3][1] = 3 + 2 + 0 = 5$.

The final answers for every vertex are now:

| Vertex $u$ | Best selection containing $u$ | Best selection excluding $u$ |
| ---------- | ----------------------------- | ---------------------------- |
| 0          | 5                             | 7                            |
| 1          | 5                             | 7                            |
| 2          | 7                             | 5                            |
| 3          | 7                             | 5                            |

Read the table as a check. Excluding vertex $1$, the best selection is $\{2, 3\}$, of weight $7$. Excluding vertex $3$, the best is $\{1, 2\}$, of weight $5$, because $1$ and $3$ are adjacent and cannot both be taken.

## Correctness proof

::: math theorem Theorem
For every vertex $u$ and every state $s$, $\text{down}[u][s]$ is the maximum weight of a valid selection inside the subtree of $u$ in which $u$ is selected if and only if $s = 1$.
:::

::: math proof Proof
The claim is by induction on the height of $u$, processing the vertices in the reverse traversal order.

For a leaf $u$, the subtree is the single vertex $u$. A valid selection containing $u$ has weight $\text{value}[u]$, and one excluding $u$ has weight $0$, which is what the base case stores.

Now let $u$ be an internal vertex and suppose the claim holds for all its children. Consider a valid selection of $S(u)$ in which $u$ is selected. No child of $u$ may be selected, because each is adjacent to $u$. For each child $c$, the restriction of the selection to $S(c)$ is therefore a valid selection that excludes $c$, whose weight is at most $\text{down}[c][0]$ by the induction hypothesis. The total weight is at most $\text{value}[u] + \sum_c \text{down}[c][0]$, and that bound is attained by combining the optimal selections of the children that exclude them, which is valid because the subtrees are disjoint and no edge joins two of them. So the first recurrence is exact.

Now consider a valid selection in which $u$ is not selected. Each child $c$ may be selected or not, and the restriction to $S(c)$ has weight at most $\max(\text{down}[c][0], \text{down}[c][1])$. The same independence argument shows that the bounds can be attained simultaneously, so the second recurrence is exact. $\square$
:::

::: math theorem Theorem
The top-down pass computes, for every vertex $u$, the maximum weight of a valid selection of the whole tree that contains $u$, and of one that excludes $u$.
:::

::: math proof Proof
The claim is by induction on the depth of $u$. For the root, the outside of its subtree is empty, so both states are $0$, which is correct.

Suppose the claim holds for a vertex $u$, and let $c$ be a child of $u$. The outside of $S(c)$ is the disjoint union of the outside of $S(u)$, the vertex $u$ itself, and the subtrees of the other children of $u$.

If $u$ is not selected, then $u$ imposes no constraint on its parent, so the best contribution of the outside of $S(u)$ is $\max(\text{up}[u][0], \text{up}[u][1])$ by the induction hypothesis, and each sibling subtree is free, contributing $\max(\text{down}[c'][0], \text{down}[c'][1])$. That is the recurrence for $\text{up}[c][0]$.

If $u$ is selected, then $u$'s parent may not be selected, so the outside of $S(u)$ contributes $\text{up}[u][0]$; $u$ contributes its own value; and none of $u$'s children may be selected, so each sibling subtree contributes $\text{down}[c'][0]$. That is the recurrence for $\text{up}[c][1]$.

Finally, a valid selection of the whole tree that excludes $u$ is a valid selection of $S(u)$ that excludes $u$, together with a valid selection of the outside of $S(u)$ in which $u$'s parent is free, which is $\text{fullSkip}[u]$. A valid selection that includes $u$ forces $u$'s parent to be excluded, which is $\text{fullTake}[u]$. $\square$
:::

## Complexity analysis

**The traversal: $O(n)$ time** and $O(n)$ space for the parents, the depths, and the order.

**The bottom-up pass: $O(n)$ time.** Every vertex is visited once, and the sum over the children is charged to the children.

**The top-down pass: $O(n)$ time.** Every vertex is visited once, and the sum over the siblings is charged once per sibling pair, so the total is still $O(n)$.

**Space: $O(n)$**, for the two tables of two values per vertex.

::: math complexity Complexity
Tree dynamic programming over a tree of $n$ vertices: $O(n)$ time and $O(n)$ space for the bottom-up pass, and the same again for the change-of-root pass.
:::

The bottom-up pass alone is $O(n)$, and the change of root is another $O(n)$, so the whole thing is linear. The naive alternative, running the bottom-up pass once per root, is $O(n^2)$, and at $n = 200\,000$ that is $4 \cdot 10^{10}$ steps.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Maximum weight of a valid selection of a tree | Tree dynamic programming with two states |
| The same, for every possible root | The same, plus the change-of-root pass |
| Maximum weight of a valid selection of a general graph | A weighted matching or a maximum cut algorithm |
| A path instead of a tree | The house robber dynamic program, which is the two-state program on a path |
| $n \le 20$ | A bitmask over the vertices |
| The constraint is a global budget | Knapsack over the states, not a simple addition |
| The tree changes between queries | A link-cut tree, or a rebuild |

The fourth row is worth a note. A path is a tree whose every vertex has at most one child, and the two-state program on a path is exactly the familiar house robber dynamic program. Tree dynamic programming is the generalization of it, and the generalization adds only the sum over the children.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Keeping one state per vertex | The parent's value and a child's value are both taken | Keep two states, one per parent decision |
| Taking $u$ and also taking a child | Two adjacent vertices are selected | Use $\text{down}[c][0]$ in the taken state |
| Summing the sibling subtrees without excluding the child | The child's own subtree is counted twice | Sum over $c' \ne c$ |
| Processing the vertices in the wrong order | A child is read before it is computed | Walk the traversal order backwards for the bottom-up pass |
| Forgetting that the root has no outside | The first top-down values are wrong | Set both root values to zero |
| Assuming the answer is the same for every root | A question that depends on the root is answered wrongly | Compute the change of root |
| Recursing on a chain of $n$ vertices | The stack overflows | Use an iterative traversal and an explicit order |
| Using a 32-bit accumulator | A total of $n$ values overflows | Use a 64-bit type |

### Why this fails: the merge that forgets the parent

The mistake that survives review most often is summarizing a subtree with a single number, and it is the mistake that the two states exist to prevent.

Take the smallest tree there is with one edge: the vertices $0$ and $1$ with the values $1$ and $1$. A single-state program keeps one number `dp[u]` per vertex, and computes

$$
\text{dp}[u] \;=\; \text{value}[u] + \sum_{c} \text{dp}[c]
$$

when it takes $u$. The value of $u$ is added to the totals of its children, which is exactly the bug: a child that was itself taken cannot be taken at the same time as its parent.

Compute it. $\text{dp}[1] = 1$. Then $\text{dp}[0] = 1 + \text{dp}[1] = 2$. The program prints $2$.

The correct answer is $1$, because the two vertices are adjacent and at most one of them may be selected. Two vertices is the smallest possible counterexample, and it is a case that no amount of testing on larger inputs will forgive, because the error grows with the tree.

There is a second version of the same mistake that looks more reasonable and fails differently. A program that keeps one number but writes

$$
\text{dp}[u] \;=\; \max\Bigl(\text{value}[u],\; \sum_{c} \text{dp}[c]\Bigr)
$$

considers taking $u$ _alone_, and never takes $u$ together with anything below it. Take the path $0 - 1 - 2$ with the values $1, 2, 3$. Then $\text{dp}[2] = \max(3, 0) = 3$, $\text{dp}[1] = \max(2, 3) = 3$, and $\text{dp}[0] = \max(1, 3) = 3$. The program prints $3$, while the correct answer is $4$, from the selection $\{0, 2\}$, which takes the ends and skips the middle.

There is a third failure, and it is specific to the change-of-root pass: forgetting to exclude the child from the sum over the siblings. Take the three-vertex star with edges $0-1$ and $0-2$ and the values $1, 2, 3$. The best selection excluding the vertex $1$ is $\{2\}$, of weight $3$, because $0$ and $2$ are adjacent. A program that sums over _all_ the children of $0$ instead of over all but $1$ adds the subtree of $1$ into the outside of that subtree, and reports $5$, which is the weight of the selection $\{1, 2\}$, a set that contains the very vertex it was supposed to exclude.

The generalization covers all three: **the state has to record the decision that crosses the boundary.** The decision at $u$ is what the parent needs to know, and a number that does not record it cannot be merged with the numbers of the siblings.

## Variants and extensions

- **Three states.** When a vertex may be taken, not taken, or taken with a penalty, or when the constraint is about distance rather than adjacency, the state grows and the merge grows with it.
- **Maximum weight of a valid selection with a size limit.** Add the size to the state, at the cost of a factor of the limit in time and memory.
- **Counting instead of maximizing.** The same recurrences, with the maximum replaced by a sum and the base cases set to one.
- **The tree is a path.** The two-state program on a path is the house robber program, and the change of root is not needed.
- **A constraint over the whole tree.** A global budget turns the additive merge into a knapsack merge, and the complexity grows by the budget.
- **Rerooting for other quantities.** The same two passes compute, for every vertex, the best value of any quantity that decomposes over subtrees and depends on the parent state.
- **Link-cut trees.** For a tree that changes, the same two-state idea becomes a splay tree whose aggregates are maintained on rotation.
- **Tree automata.** The two states are the two states of an automaton, and the merge is the transition function.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Root the tree first and write down the root. Then write down the two states in words: "the best inside the subtree when the vertex is taken" and "the best inside the subtree when it is not".
2. Check the merge: does taking the vertex exclude the children? Does not taking it leave them free? Both answers belong in the recurrence before the code is written.
3. Process the vertices in the reverse of a traversal order, and keep the order in an array rather than recursing.
4. If the question mentions a root, remember that the answer for one root needs only the bottom-up pass, and the answers for all roots need the top-down pass as well.
5. Test the smallest cases by hand: a single vertex, an edge with two vertices, and a three-vertex star. The edge case is the one that catches a missing state.
6. Write the brute-force enumeration for $n \le 20$ and compare on random small trees.

## Worked problems

### Problem 1: the thief on the tree

**Restatement.** A tree of $n$ houses has a value at each house. Choose a set of houses with no two adjacent and maximize the total value. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Enumerate every subset, at a cost of $O(n 2^n)$.

**Insight.** Taking a vertex excludes its children, so a subtree needs two numbers rather than one.

**Derivation.** Root the tree, compute $\text{down}[u][0]$ and $\text{down}[u][1]$ from the leaves upward with the two recurrences, and answer with $\max(\text{down}[r][0], \text{down}[r][1])$.

**Correctness.** The induction proof shows that each state is the exact optimum for its constraint, and the independence of the child subtrees shows that the sum is attained.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Keeping one number per vertex, which adds a vertex and its child to the total.

### Problem 2: the best selection for every excluded vertex

**Restatement.** The same tree. For every vertex $u$, report the maximum weight of a valid selection that does **not** contain $u$. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Run the bottom-up pass once for every vertex as the excluded one, at a cost of $O(n^2)$.

**Insight.** Running the pass once per excluded vertex repeats almost all of its work, and the change-of-root pass reuses it.

**Derivation.** Compute $\text{down}$ for the whole tree, then compute $\text{up}$ from the root downward with the two recurrences, and report $\text{fullSkip}[u] = \max(\text{up}[u][0], \text{up}[u][1]) + \text{down}[u][0]$ for every vertex.

**Correctness.** The induction on the depth proves the recurrences for $\text{up}$, and the final formula splits the tree into the inside and the outside of the subtree.

**Complexity.** $O(n)$ time and $O(n)$ space, against $O(n^2)$ for the naive version.

**Common wrong approach.** Summing over all the children of $u$ instead of over all but $c$, which counts the subtree of $c$ twice.

### Problem 3: the vertex cover of a tree

**Restatement.** A tree of $n$ vertices has a value at each vertex. Choose a set of vertices covering every edge, that is, a set such that every edge has at least one endpoint in it, and maximize the total value of the chosen set. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Enumerate every subset, at a cost of $O(n 2^n)$.

**Insight.** A vertex cover of a tree is the complement of an independent set, so the constraint is the same one read the other way round: a vertex must be in the cover exactly when it must not be in an independent set. The two states therefore mean the opposite of what they meant before.

**Derivation.** Keep the same two states, with the meaning reversed: a state of $1$ means the vertex is **in** the cover. When $u$ is in the cover, every child may be free, and when $u$ is not in the cover, every child must be in it. So the recurrences swap:

$$
\text{down}[u][1] = \text{value}[u] + \sum_{c} \max(\text{down}[c][0], \text{down}[c][1]),
$$

$$
\text{down}[u][0] = \sum_{c} \text{down}[c][1].
$$

**Correctness.** The same independence argument applies, with the constraint reversed.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Using the independent set recurrences unchanged, which solves the wrong problem and gives the wrong answer on every input where the two differ.

## Practice progression

1. **Recognition.** Given a statement, decide whether tree dynamic programming applies. Look for a subset chosen under a local constraint.
2. **Direct application.** Implement the two-state bottom-up pass for the house robber on a tree, and verify against the brute force on small random trees.
3. **Adaptation.** Solve the vertex cover, the maximum independent set with a size limit, and the counting version.
4. **Combination.** Add the change-of-root pass, and combine the two passes with the binary lifting table of the [lowest common ancestor](/algorithms/trees/lca) article.
5. **Challenge.** Solve a problem on a general graph with the same shape of constraint and discover that the subtrees are not independent; then solve the tree version, where they are.
6. **Transfer.** Use the same two-pass shape for a different quantity that decomposes over subtrees: the best assignment of colors to a tree with adjacent vertices differently colored, or the number of independent sets of each size.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does a subtree need two states rather than one? (Key insight)
2. State the two recurrences of the bottom-up pass. (Algorithm derivation)
3. What is the invariant, and why does it make the merge an addition? (Formal model)
4. Why does the merge work in a tree but not in a general graph? (Algorithm derivation)
5. Give the smallest tree for which a one-state program gives a wrong answer. (Why this fails)
6. What are the recurrences of the change-of-root pass? (Algorithm derivation)
7. Why does the sum over the siblings have to exclude the child? (Common mistakes)
8. What do $\text{fullSkip}[u]$ and $\text{fullTake}[u]$ mean? (Formal model)
9. Why is the traversal iterative rather than recursive? (Contest strategy)
10. When is a bitmask over the vertices the better tool? (Algorithm selection)

## Further reading

- The ancestor table that answers the questions this technique does not, the lowest common ancestor among them, is in [lowest common ancestor](/algorithms/trees/lca).
- The structure that answers path questions on the same tree is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The traversal that produces the order the dynamic program is run in is [breadth-first search](/algorithms/graphs/bfs), and the recursive form of the same traversal is [depth-first search](/algorithms/graphs/dfs).
- The subset sum with a size limit, which is the third state mentioned above, is the same shape as the 0/1 knapsack program, where the size of the subset is the extra dimension and the weight is the objective.
- The vocabulary of subtrees, parents, and children is set out in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
