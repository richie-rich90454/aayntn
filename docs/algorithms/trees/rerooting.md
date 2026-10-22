---
id: trees.rerooting
title: Rerooting
summary: Run a tree dynamic program once in each direction so that every vertex can be treated as the root, using a down message and an up message per vertex.
division: [gold, platinum]
subjects: [trees]
level: advanced
importance: common-contest-technique
keywords:
    [
        rerooting,
        rerooted dp,
        down message,
        up message,
        change of root,
        two pass tree dp,
        contribution,
    ]
prerequisites:
    required: [graphs.dfs, trees.tree-dp]
    recommended: [foundations.recursion, graphs.bfs]
complexity:
    time: "O(n)"
    space: "O(n)"
assumptions:
    - The input is a tree, and the answer is wanted for every vertex with every vertex treated as the root.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Compute an answer that depends on the choice of root, for every possible root |
| **Time** | $O(n)$ for the whole tree |
| **Auxiliary space** | $O(n)$ for the messages |
| **Requires** | A tree, and an aggregate that can be combined associatively |
| **Fails when** | A child is included in its own exclusion list, or the two passes are merged |
| **Primary technique** | One down pass and one up pass, exchanging messages across each edge |
| **Related** | Tree dynamic programming, heavy-light decomposition, the Euler tour |

Rerooting is tree dynamic programming run twice. The first pass computes what each vertex knows about its own subtree. The second pass carries the other half of the information down from the root, so that every vertex ends up knowing about the whole tree.

## Problem motivation

A game has $n$ positions arranged as a tree. Each position has a value, and a player standing at a position may move to a neighboring position and collect its value, and so on, never revisiting a position. The rules ask, for every position, what is the largest total the player can collect starting there.

The constraints are what make the technique necessary.

- $1 \le n \le 200\,000$ positions.
- Every position has a nonnegative integer value.
- The rules ask for the answer at **every** position.

Running the tree dynamic program once per position costs $O(n^2)$, which is $4 \cdot 10^{10}$ at the maximum constraints.

The way out is to notice that the answer for a position does not depend on the root in the way the dynamic program seems to require. What a position needs to know is a single number about every direction: the best total obtainable by stepping into that direction. Those numbers can be computed once for the subtree side of each edge and once for the other side, and the two passes cost $O(n)$ together.

## Recognition patterns

Rerooting is the right tool when all of the following hold.

- The answer is wanted **for every vertex**, with **every vertex treated as the root** in turn.
- The problem is a **tree dynamic program** whose answer at a vertex combines the contributions of its neighbors.
- The graph is a **tree**, or a forest.
- The aggregate is **associative** and has an identity, so that contributions can be merged and left out.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The answer is wanted for one root only | Rules out rerooting; a single tree dynamic program is enough |
| $n \le 2 \cdot 10^5$ | Two linear passes are comfortable |
| The answer is wanted for a general graph | Rules out the technique; on a graph the messages can cycle |
| The aggregate is not associative, such as a set union without duplicates | Rules out the merge step; the technique needs a monoid |
| The tree changes between queries | The messages must be recomputed; there is no incremental version |
| Only the total over the whole tree is wanted | Rules out rerooting; one dynamic program suffices |
| The answer for a vertex is not a function of its neighbors' contributions | Rules out the technique entirely |

Two phrases in a statement are reliable signals. "For every node, if the tree were rooted there" and "starting from each node" point here. "Rooted at the first node" points away, because a single tree dynamic program answers it.

<Synonyms terms="rerooting, rerooted dynamic programming, down dp, up dp, two pass tree dp, change of root, message passing on a tree, contribution technique" />

## Naive approach

The baseline is to root the tree at each vertex in turn and run the ordinary tree dynamic program.

```python
for root in range(n):
    build the parent array with root as the root
    answer[root] = tree_dp(root)
```

This costs $O(n)$ per root because the dynamic program is linear, so the total is $O(n^2)$. At $n = 200\,000$ that is $4 \cdot 10^{10}$ operations.

The second baseline is to root the tree once and to try to fix up the answers by hand as the root moves from one vertex to a neighbor. This is the right intuition and it is easy to get wrong, because the change of root moves a whole subtree of the tree, and the amount of work per move has to be constant.

The third baseline is to compute the answer with a divide and conquer on the tree, splitting at the centroid. It works and gives $O(n \log n)$, but it is strictly more machinery than the two passes need.

## Key insight

The insight is that the answer at a vertex is a function of one number per neighbor, and that each of those numbers depends only on the side of the edge that neighbor is on.

Fix an edge $\{v, u\}$. Deleting it splits the tree into two components. The information that $u$ can contribute to $v$'s answer depends only on the component containing $u$, and the information that $v$ can contribute to $u$'s answer depends only on the other component. That is what makes the messages independent, and it is why they can be computed once each.

There are two messages per vertex.

**The down message** $\text{down}[v]$ is what $v$ reports to its parent: the best contribution that the subtree of $v$ can make, measured from $v$. It is computed from the children of $v$, so it is a bottom-up quantity.

**The up message** $\text{up}[v]$ is what the parent reports to $v$: the best contribution that the rest of the tree, the part outside the subtree of $v$, can make, measured from the parent. It is computed from the parent and from the siblings of $v$, so it is a top-down quantity.

The two messages meet at the vertex, and the answer is the vertex's own value combined with the best of the contributions from every direction.

The recurrence for the down message is the ordinary tree dynamic program. The recurrence for the up message is the same computation with one child removed, which is the whole difficulty: to report to $c$, the vertex $v$ must combine its own value, the up message it received, and the down messages of its children **other than $c$**.

There is no other edge to cross. Every vertex's answer is determined by messages that cross the edges incident to it, and each message crosses one edge, and there are $n - 1$ edges.

## Formal model

Let $T$ be a tree rooted at $r$, and let $w(v)$ be the value of a vertex. The running example asks for the largest total collectible along a path that starts at $v$ and does not revisit a vertex.

<MathPanel type="definition" title="Definition">
The **down message** of a vertex $v$ is
$$
\text{down}[v] = \max\Bigl(0,\ \max_{c \in \text{ch}(v)} \bigl(w(c) + \text{down}[c]\bigr)\Bigr),
$$
the largest total obtainable by a path that starts at $v$ and goes strictly
downward, not counting $w(v)$ itself. It is defined for every vertex.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **up message** of a vertex $v$ is the largest contribution that the part
of the tree outside the subtree of $v$ can make to $v$, measured from the
parent of $v$. For the root it is $0$, since nothing lies outside its subtree.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **answer** at a vertex $v$ is
$$
\text{answer}[v] = w(v) + \max\Bigl(0,\ \text{up}[v],\ \max_{c \in \text{ch}(v)} \bigl(w(c) + \text{down}[c]\bigr)\Bigr).
$$
The $0$ allows the path to stop at $v$, which matters when every direction
leads to a smaller total.
</MathPanel>

<MathPanel type="lemma" title="Lemma (the change of root)">
Let $u$ and $v$ be adjacent vertices, and let $T_u$ be the component of
$T - \{u, v\}$ that contains $u$. The contribution that $u$ makes to the
answer at $v$ depends only on $T_u$, and the contribution that $v$ makes to
the answer at $u$ depends only on the other component. In particular, the
answer at $v$ is determined by the messages crossing the edges incident to
$v$.
</MathPanel>

<MathPanel type="lemma" title="Lemma (the up recurrence)">
For a child $c$ of a vertex $v$,
$$
\text{up}[c] = w(v) + \max\Bigl(0,\ \text{up}[v],\ \max_{s \in \text{ch}(v),\ s \ne c} \bigl(w(s) + \text{down}[s]\bigr)\Bigr).
$$
The children other than $c$ are excluded because their subtrees are inside
the subtree of $v$, and reporting to $c$ must not count the direction that
leads back to $c$.
</MathPanel>

## Algorithm derivation

The build has two passes.

```text
the first pass, over the vertices in decreasing depth:
    down[v] = max(0, max over children c of (w(c) + down[c]))
    for each child c of v:
        remember the contribution w(c) + down[c] of c

the second pass, over the vertices in increasing depth:
    up[r] = 0
    for each child c of v:
        up[c] = w(v) + max(0, up[v], max over children s of v with s != c of (w(s) + down[s]))
    answer[v] = w(v) + max(0, up[v], max over children c of (w(c) + down[c]))
```

The exclusion of $c$ from the sibling list is the only fiddly part, and it is where the implementation has to be careful. The efficient way to do it is to keep the two largest sibling contributions at each vertex, together with the index of the vertex that produced the largest. Then the contribution of $c$ is excluded in constant time: if $c$ produced the largest, use the second largest, and otherwise use the largest.

The update rule for the up message is correct by the change-of-root lemma: the best path from $v$ that avoids the edge to $c$ either stops at $v$, continues into the parent side, or continues into a sibling subtree. Those are exactly the three terms.

<MathPanel type="invariant" title="Invariant">
After the first pass, for every vertex $v$, $\text{down}[v]$ is the largest
total obtainable by a downward path from $v$, and the down message of every
child of $v$ is final.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At every moment of the second pass, for the vertex $v$ being processed,
$\text{up}[v]$ is the correct contribution from outside the subtree of $v$, and
every vertex strictly above $v$ has already been processed with a correct up
message.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At every moment of the second pass, the down messages are unchanged, and the
answer computed for a vertex $v$ uses the contribution of every direction:
each child contributes $w(c) + \text{down}[c]$ and the parent side contributes
$\text{up}[v]$.
</MathPanel>

## Step-by-step execution

Take the chain $0 - 1 - 2$ with values $w = (100, 1, 1)$, rooted at $1$. The children of $1$ are $0$ and $2$.

The first pass, in decreasing depth.

1. Vertex $2$ is a leaf, so $\text{down}[2] = \max(0) = 0$. Its contribution to its parent is $w(2) + \text{down}[2] = 1$.
2. Vertex $0$ is a leaf, so $\text{down}[0] = 0$. Its contribution to its parent is $w(0) + \text{down}[0] = 100$.
3. Vertex $1$ takes the larger of the two contributions, so $\text{down}[1] = 100$. The two largest sibling contributions at $1$ are $100$ from vertex $0$ and $1$ from vertex $2$.

The second pass, in increasing depth.

4. The root is $1$, so $\text{up}[1] = 0$. The answer at $1$ is $w(1) + \max(0, 0, 100, 1) = 1 + 100 = 101$, which is the path $1 \to 0$.
5. Move to vertex $0$, which is a child of $1$. Its up message is $w(1) + \max(0, \text{up}[1] = 0, \text{siblings of } 0) = 1 + \max(0, 0, 1) = 2$, where the sibling contribution is $w(2) + \text{down}[2] = 1$. So $\text{up}[0] = 2$, meaning that from vertex $0$ the best continuation is $0 \to 1 \to 2$ worth $1 + 1 = 2$. The answer at $0$ is $w(0) + \max(0, \text{up}[0] = 2) = 100 + 2 = 102$, which is the path $0 \to 1 \to 2$.
6. Move to vertex $2$, which is a child of $1$. Its up message is $w(1) + \max(0, \text{up}[1] = 0, \text{siblings of } 2) = 1 + \max(0, 0, 100) = 101$. So $\text{up}[2] = 101$, which is the path $2 \to 1 \to 0$. The answer at $2$ is $w(2) + \max(0, 101) = 1 + 101 = 102$.

The answers are $102$, $101$, and $102$ for the vertices $0$, $1$, and $2$.

Step 5 is where the exclusion matters. When the message is sent to vertex $0$, the contribution of vertex $0$'s own subtree, which is $100$, must be left out of the sibling list. If it were not left out, the up message of $0$ would be $1 + \max(0, 0, 100) = 101$, and the answer at $0$ would be $100 + 101 = 201$, which corresponds to the impossible path $0 \to 1 \to 0$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The two passes compute the correct answer for every vertex.
</MathPanel>

<MathPanel type="proof" title="Proof">
First, the down messages. We prove by induction on the height of the subtree
that $\text{down}[v]$ is the largest total obtainable by a downward path from
$v$ that does not count $w(v)$.

For a leaf, the only such path is the empty one, and the recurrence gives $\max(0) = 0$, which is correct. For a vertex $v$ with children, a downward path from $v$ either stops at $v$, giving $0$, or enters the subtree of exactly one child $c$, giving $w(c) + \text{down}[c]$ by the induction hypothesis. The recurrence takes the largest of these, which is correct.

Now the coverage claim. We prove by induction on the depth of a vertex $v$ that $\text{up}[v]$ is correct when the second pass reaches $v$.

The base case is the root $r$. Nothing lies outside the subtree of $r$, so the contribution from outside is $0$, and the algorithm sets $\text{up}[r] = 0$.

For the inductive step, let $v$ be a vertex at depth $d > 0$, with parent $p$. By the induction hypothesis, $\text{up}[p]$ is correct, because $p$ is at depth $d - 1$ and has already been processed. Let $c$ be any child of $p$. The best path that starts at $p$ and does not enter the subtree of $c$ either stops at $p$, giving $0$, enters the parent side of $p$, giving $w(p) + \text{up}[p]$ by the induction hypothesis, or enters the subtree of a sibling $s$ of $c$, giving $w(s) + \text{down}[s]$ by the first part of the proof. These cases are exhaustive, because a path from $p$ that avoids the edge to $c$ must go into one of those three directions. Taking the largest gives $\text{up}[c]$ exactly, by the up recurrence lemma.

Since every vertex other than the root has a parent, and the second pass processes the vertices in increasing depth, every vertex is reached and every up message is correct.

Finally, the answer. By the change-of-root lemma, the answer at $v$ is determined by the contributions of its neighbors. Each child $c$ contributes $w(c) + \text{down}[c]$, by the first part of the proof, and the parent side contributes $\text{up}[v]$, by the second part. Adding $w(v)$ and taking the largest of those contributions and $0$ is therefore the correct answer. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
The two passes together touch every vertex a constant number of times, so the
whole computation is linear.
</MathPanel>

<MathPanel type="proof" title="Proof">
The first pass visits every vertex once and examines every edge twice, once
from each endpoint. The second pass visits every vertex once, and for each
child it scans the children of the parent, whose total over the whole pass is
at most the number of edges, that is $n - 1$. So the total work is $O(n)$.
$\square$
</MathPanel>

## Complexity analysis

**Time: $O(n)$.** Each pass is linear in the tree, and the sibling exclusion costs $O(1)$ per child when the two largest contributions are kept.

**Auxiliary space: $O(n)$** for the down messages, the up messages, the answers, the parent and depth arrays, and the traversal order.

<MathPanel type="complexity" title="Complexity">
Rerooting a tree dynamic program over a tree with $n$ vertices: $O(n)$ time
and $O(n)$ space, with two passes.
</MathPanel>

The exclusion of a child is the only part that can make the implementation quadratic, and the two-largest trick is what prevents it. A naive implementation that rescans all the children of the parent for each child costs $O(\sum_v \text{ch}(v)^2)$, which is $O(n^2)$ on a star.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| An answer that depends on the root, wanted for every root | Rerooting |
| An answer that depends on the root, wanted for one root | One tree dynamic program |
| The sum of the distances from every vertex to all the others | Rerooting, with a sum in place of a maximum |
| The number of vertices on a path | The [lowest common ancestor](/algorithms/trees/lca) and the depths |
| A maximum or a sum over a path | [Heavy-light decomposition](/algorithms/trees/heavy-light-decomposition) |
| A value over a subtree | The [Euler tour](/algorithms/trees/euler-tour) and a range-query structure |
| The same question on a general graph | Rules out rerooting; the messages can cycle |
| A tree that changes between queries | Rules out rerooting; recompute or use a dynamic structure |
| A divide and conquer over the tree is needed anyway | Centroid [decomposition](/algorithms/trees/centroid-decomposition) |

The general-graph row is worth stating carefully, because it is the reason the technique is a tree technique and not a graph technique. On a graph, a message sent from $u$ to $v$ depends on the messages coming into $u$, and those depend on messages coming into their senders, and the dependency can come back around to $u$. The two-pass order has no analogue on a graph.

## Recursion decision

The two passes are naturally expressed as loops over the vertices in a fixed order, and the order is produced by a traversal.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $n$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

<MathPanel type="counterexample" title="Counterexample">
A tree that is a chain on $10^6$ vertices. The two passes are linear and the
answers are correct, but the recursive traversal that produces the vertex
order makes one nested call per vertex, so in C++ on Linux with an 8 MB stack
and a frame of roughly 64 bytes the stack is exhausted after about
$130\,000$ frames, and the program dies with a segmentation fault after
processing $13\%$ of the tree. The iterative traversal, which keeps the
current vertex and the index of the next child to explore on an explicit
stack, finishes normally.
</MathPanel>

The iterative form is not harder to write here than in any other tree technique. The first pass needs the vertices in decreasing depth, which is the reverse of the traversal order, and the second pass needs them in increasing depth, which is the traversal order itself.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Including $c$ in the sibling list when computing $\text{up}[c]$ | The vertex's own branch is counted twice and the answer is impossible | Exclude $c$; keep the two largest contributions |
| Computing the up messages before the down messages are final | The sibling contributions are stale | Run the down pass completely first |
| Storing the up message in the same array as the down message | The down messages are destroyed and the answers are wrong | Use two arrays |
| Forgetting the $0$ term | A path that must stop at the vertex is not considered | Include the identity of the aggregate |
| Rescanning all the children for each child | $O(n^2)$ on a star | Keep the two largest contributions |
| Assuming the root's up message is the root's value | The first step is counted twice | The root's up message is $0$ |
| Rerooting a general graph | The messages cycle and the values are wrong | Use a technique that handles cycles |

### Why this fails: the branch that is counted twice

The mistake that survives review most often is forgetting to exclude the child that the message is being sent to.

The smallest counterexample is a chain of three vertices $0 - 1 - 2$ with values $100$, $1$, $1$, rooted at $1$.

The correct computation is the one in the step-by-step section. The down message of vertex $1$ is $\max(w(0) + \text{down}[0], w(2) + \text{down}[2]) = \max(100, 1) = 100$, and the up message of vertex $0$ is $w(1) + \max(0, \text{up}[1], \text{contribution of the sibling } 2) = 1 + 1 = 2$. The answer at $0$ is $100 + 2 = 102$, which is the path $0 \to 1 \to 2$.

With the mistake, the sibling list for vertex $0$ contains vertex $0$ itself, whose contribution is $100$. The up message of vertex $0$ becomes $1 + \max(0, 0, 100) = 101$, and the answer at $0$ becomes $100 + 101 = 201$.

The truth is $102$. The reported value of $201$ corresponds to the walk $0 \to 1 \to 0$, which visits vertex $0$ twice, and no such walk is legal.

Three vertices and two edges is the smallest counterexample, and it needs the child's own branch to be strictly better than every sibling, which is why the value $100$ is there.

### Why this fails: the up message computed too early

The second mistake is to compute the up messages inside the first pass, or to start the second pass before the down pass has finished.

The smallest counterexample has four vertices: a root $1$ with children $0$ and $2$, and a child $3$ of $2$. The values are $w(0) = 1$, $w(1) = 1$, $w(2) = 1$, and $w(3) = 100$.

The correct computation gives $\text{down}[3] = 0$, $\text{down}[2] = 100$, and $\text{down}[1] = \max(1, 1 + 100) = 101$. The up message of vertex $0$ is $w(1) + \max(0, \text{up}[1], w(2) + \text{down}[2]) = 1 + 101 = 102$, and the answer at $0$ is $1 + 102 = 103$, which is the path $0 \to 1 \to 2 \to 3$.

With the mistake, the up message of vertex $0$ is computed before the subtree of vertex $2$ has been processed, so the contribution of vertex $2$ is read as $w(2) + 0 = 1$ rather than $101$. The up message of $0$ becomes $1 + \max(0, 0, 1) = 2$, and the answer at $0$ becomes $3$.

The truth is $103$. The buggy answer is off by a factor of thirty, and the number of vertices is small enough that no one would notice without computing the answer by hand.

### Why this fails: the two messages in one array

The third mistake is to store the up message in the same array as the down message, which saves one array and destroys the answer.

The smallest counterexample is a chain of four vertices $0 - 1 - 2 - 3$ with every value equal to one, rooted at $0$.

The down messages are $\text{down}[3] = 0$, $\text{down}[2] = 1$, $\text{down}[1] = 2$, and $\text{down}[0] = 3$. The up messages are $\text{up}[0] = 0$, $\text{up}[1] = 1$, $\text{up}[2] = 2$, and $\text{up}[3] = 3$.

The answer at vertex $0$ uses the contribution of its child, which is $w(1) + \text{down}[1] = 1 + 2 = 3$, so the answer is $1 + 3 = 4$, which is the path $0 \to 1 \to 2 \to 3$ with four vertices.

With one array, the second pass overwrites $\text{down}[1]$ with $\text{up}[1] = 1$ on its way through. When the answer at vertex $0$ is finally assembled, the contribution of its child is read as $w(1) + 1 = 2$, and the answer is $1 + 2 = 3$.

The truth is $4$ and the buggy answer is $3$, and the failing query is the one about the root, which is the most natural query to check by hand because the whole path is visible.

## Variants and extensions

- **Sums instead of maxima.** The sum of the distances from every vertex to all the others is the canonical rerooting problem. The down message becomes $\text{down}[v] = \sum_{c} (\text{down}[c] + \text{size}[c])$, and the up message becomes $\text{up}[c] = \text{up}[v] + n - \text{size}[c]$.
- **Counts.** The number of paths of a given length, or the number of subtrees of a given size, are rerooting problems with a count in place of a maximum.
- **Any monoid.** The technique needs only that the aggregate be associative with an identity. The two-largest trick generalizes to keeping the whole multiset of contributions when the operation is not a maximum.
- **The division and conquer alternative.** [Centroid decomposition](/algorithms/trees/centroid-decomposition) answers the same questions in $O(n \log n)$ and is the right tool when the question is about paths rather than about the vertices.
- **Directed messages.** Instead of two messages per vertex, one can send a message along every directed edge, which is $2(n-1)$ messages, and then combine them at each vertex. This is the general form and it is what a message-passing implementation does.
- **Link-cut trees.** For a tree whose edges change, a link-cut tree maintains the messages with an amortized logarithmic cost per operation.
- **The interaction with heavy-light decomposition.** A path query can be answered by the rerooting idea when the path is a root-to-node path, and by heavy-light decomposition when it is a general path.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Decide whether the problem really is a rerooting problem. Look for "for every node" together with a root-dependent answer.
2. Write the down and the up recurrences on paper before writing any code, and mark clearly which child is excluded in each.
3. Keep the two largest sibling contributions at each vertex, so that the exclusion costs constant time.
4. Use two arrays, one for the down messages and one for the up messages.
5. Run the first pass completely before starting the second.
6. Test four shapes by hand: a single vertex, a path, a star, and a tree with a heavy branch next to a light one. The star is the one that catches a quadratic exclusion, and the heavy-and-light tree is the one that catches a missing exclusion.
7. Compute one answer by hand with a real walk over the tree, and compare it with what the code reports.

## Worked problems

### Problem 1: the longest collection from every position

**Restatement.** A tree has $n$ positions with nonnegative integer values. For each position, report the largest total collectible along a path that starts there and visits no position twice. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Root the tree at each position in turn and run the tree dynamic program, at a cost of $O(n^2)$.

**Insight.** The answer at a position is its own value plus the best contribution from each of its neighbors, and each contribution depends only on the side of the edge that neighbor is on.

**Derivation.** Run the down pass to compute $\text{down}[v]$ for every vertex, keeping the two largest child contributions at each vertex. Run the up pass to compute $\text{up}[c]$ for each child $c$ of $v$, excluding $c$ from the sibling list by using the second largest when $c$ produced the largest. The answer at $v$ is $w(v) + \max(0, \text{up}[v], \text{largest child contribution})$.

**Correctness.** The proof above shows that the down messages are the correct downward contributions, that the up messages are correct by induction on the depth, and that the answer combines every direction exactly once.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Excluding the child incorrectly, or not at all. On the chain with values $100$, $1$, $1$ the answer at the far end becomes $201$ instead of $102$.

### Problem 2: the total distance from every position

**Restatement.** A tree has $n$ positions. For each position, report the sum of the distances from it to every other position. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Run a search from every position, at a cost of $O(n^2)$.

**Insight.** The same message structure works with a sum in place of a maximum, and the up message has a particularly simple closed form.

**Derivation.** Compute the subtree sizes $\text{size}[v]$ and the down messages $\text{down}[v] = \sum_{c \in \text{ch}(v)} (\text{down}[c] + \text{size}[c])$, which is the sum of the distances from $v$ to the vertices in its subtree. Set $\text{up}[r] = 0$, and for each child $c$ of $v$ set $\text{up}[c] = \text{up}[v] + n - \text{size}[c]$. The answer at $v$ is $\text{down}[v] + \text{up}[v]$.

**Correctness.** The vertices outside the subtree of $c$ are the vertices in the subtree of $v$ but not of $c$, of which there are $\text{size}[v] - \text{size}[c]$ and each at distance one from $c$, together with the vertices outside the subtree of $v$, of which there are $n - \text{size}[v]$ and each at distance one plus its distance from $v$. Adding gives $\text{up}[c] = \text{up}[v] + n - \text{size}[c]$. The down message counts the vertices inside the subtree, so the two together count every vertex exactly once.

**Complexity.** $O(n)$ time and $O(n)$ space. The values fit in a 64-bit integer, because the sum of the distances can reach $O(n^2)$.

**Common wrong approach.** Forgetting the extra one step for the vertices outside the subtree of the parent, which makes every answer too small.

### Problem 3: the contribution of each subtree to the whole

**Restatement.** A tree has $n$ positions, each with a value. For each position, report the total value of the positions in the subtree of that position, when the tree is rooted at that position.

**Naive baseline.** Root the tree at each position and sum, at a cost of $O(n^2)$.

**Insight.** Rerooting with a sum is the standard technique, and the messages have the form "the total of my side of the edge".

**Derivation.** Compute the subtree sums and sizes in the down pass. In the up pass, for a child $c$ of $v$, the total of the side of $c$ is $\text{sub}[c] + \text{other}[c]$, where $\text{other}[c]$ is the total of the vertices outside the subtree of $c$, computed with the same parent-side formula used in Problem 2 but with the values in place of the distances.

**Correctness.** Every vertex belongs to exactly one side of the edge joining it to its parent, and the two sides partition the tree, so the two messages together give the total of the whole tree for every root.

**Complexity.** $O(n)$ time and $O(n)$ space.

**Common wrong approach.** Reporting the subtree sum of the chosen root, which is the answer for one root rather than for all of them.

## Practice progression

1. **Recognition.** Given a statement, decide whether rerooting applies. Look for "for every node" together with a root-dependent answer, and check that the graph is a tree.
2. **Direct application.** Implement the down and up passes for the running example, and verify each answer by walking the tree by hand.
3. **Adaptation.** Change the maximum to a sum, to a count, and to a minimum, and notice that the structure of the two passes does not change.
4. **Combination.** Combine the messages with a segment tree so that a message can exclude one child without the two-largest trick, and combine them with the subtree sizes for the distance problem.
5. **Challenge.** Solve a problem on a graph with cycles using the same messages and discover that the messages do not converge; then solve it with a flow or a strongly connected component computation.
6. **Transfer.** Use the message idea elsewhere: the divide and conquer over a tree in [centroid decomposition](/algorithms/trees/centroid-decomposition), the path sums in [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition), and the message passing that a link-cut tree performs.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the down message, and what is the up message? (Formal model)
2. Write the recurrence for the up message of a child $c$ of $v$. (Formal model)
3. Why must $c$ be excluded from the sibling list? (Why this fails)
4. Why does the two-pass order cover every vertex? (Correctness proof)
5. What is the induction that makes the up messages correct? (Correctness proof)
6. How is the exclusion done in constant time? (Algorithm derivation)
7. What is the smallest tree on which the exclusion mistake gives a wrong answer? (Why this fails)
8. What goes wrong when the up messages are computed before the down messages are final? (Why this fails)
9. What is the time and space of the two passes? (Complexity analysis)
10. When is recursion unsafe, and what is the failure mode? (Recursion decision)
11. Why does the technique not work on a general graph? (Algorithm selection)
12. How does the sum version differ from the maximum version? (Variants and extensions)

## Further reading

- The single-rooted version of this technique, and the details of the combining step, are in [tree dynamic programming](/algorithms/trees/tree-dp).
- The other technique for path questions on a tree, which answers a different question with a different data structure, is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The divide and conquer over the tree, which answers the same questions about paths, is [centroid decomposition](/algorithms/trees/centroid-decomposition).
- The traversal that produces the order in which the two passes run is [depth-first search](/algorithms/graphs/dfs).
- The flattening that answers subtree questions with a range query rather than with messages is [the Euler tour for trees](/algorithms/trees/euler-tour).
