---
id: graphs.dominator-trees
title: Dominator trees
summary: The tree of immediate dominators of a directed graph with one source, built in reverse postorder by intersecting the dominators of each vertex's predecessors.
division: [platinum]
subjects: [graphs]
level: advanced
importance: advanced-technique
keywords:
    [
        dominator,
        immediate dominator,
        dominator tree,
        critical vertex,
        control flow graph,
        dataflow,
        reverse postorder,
    ]
prerequisites:
    required: [graphs.representation, graphs.dfs]
    recommended: [graphs.dijkstra, trees.lca]
complexity:
    time: "O(V E) per pass, two or three passes in practice"
    space: "O(V + E)"
assumptions:
    - The graph is directed and every dominance question is measured from one source vertex.
    - Only the vertices the source can reach have a node in the dominator tree.
implementations: graphs.dominator-trees
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/graphs.dominator-trees.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<CodeViewer :entry="algorithm" />

A vertex $d$ **dominates** a vertex $v$ when every directed path from the source $s$ to $v$ passes through $d$. The relation is reflexive and transitive, and for a fixed $v$ the vertices that dominate it are totally ordered: if two of them were incomparable, a path could avoid one of them and reach the other, and appending the rest of the route would reach $v$ while avoiding the first. That chain has a deepest strict element, the **immediate dominator** of $v$, and drawing one edge from each vertex to its immediate dominator produces the **dominator tree**.

The tree is the compact form of the whole relation. The dominators of $v$ are exactly the ancestors of $v$ in the tree plus $v$ itself, so $V$ parent pointers store what would otherwise be $V$ sets of up to $V$ vertices. The parent of the source is the source, and a vertex the source cannot reach has no parent at all.

This article uses the **iterative dataflow algorithm** of Cooper, Harvey and Kennedy, not Lengauer-Tarjan. It runs a depth-first search from the source, numbers the vertices in reverse postorder, and then repeatedly replaces the parent of each vertex by the deepest common ancestor of its predecessors in the tree built so far. The passes stop when nothing changes. The algorithm is short, the code is the same in every language, and it is fast on the graphs that appear in contests.

One pass costs $O(VE)$ in the worst case, because finding a common ancestor can climb the tree once per edge, and the number of passes is bounded by the loop connectedness of the graph plus three. Two or three passes are typical. Lengauer-Tarjan computes the same tree in $O(E \alpha(V, E))$ and is the right choice when the worst case matters or the graph is enormous. The space is $O(V + E)$: the successor lists, the predecessor lists, and a handful of $V$-entry arrays.

## Problem motivation

A courier company has a hub in city $s$ and one-way flights between cities. A city is called **critical** for a destination when every possible route from the hub to that destination lands there. The company wants to know, for every destination, which cities are critical, because those are the places where a single delayed flight can ruin the delivery.

The same question appears in a compiler. A **control-flow graph** has one entry block, and an edge from one block to another means that execution can move directly between them. A block that dominates another block is executed on every route to it. Compiler optimizations use dominators to decide where a value is guaranteed to be computed, and the **dominance frontier**, which is derived from the tree, is the central object of the algorithm that converts a program to static single assignment form.

The constraints are the usual graph constraints:

- $1 \le n \le 200\,000$ vertices.
- $0 \le m \le 200\,000$ directed edges.
- One source $s$, given as a vertex number.
- The graph may have cycles, self-loops and parallel edges.

The naive formulation of the question is expensive. Testing whether $d$ dominates $v$ means deleting $d$ and checking whether $v$ is still reachable, which costs one graph traversal. Doing that for every pair is $O(V^2(V + E))$, and at $n = 200\,000$ it is hopeless. Representing the dominator set of every vertex explicitly is not much better: the sets can be as large as $V$, and the intersections that compute them touch all of those bits.

What makes the problem tractable is that the answer is a **tree**, not a family of sets. Every vertex needs one parent, and the parent is enough to answer every dominance question by walking upward. The rest of the article is about computing those parents without ever materializing a dominator set.

## Recognition patterns

The technique is the right one when all of the following hold.

- The graph is **directed**. Dominators are defined for directed paths; the undirected analogue is the articulation point, which answers a different question.
- There is **one source**, and every question is measured from it. If each vertex is its own source, the problem is asking for something else.
- The statement uses words such as **every path**, **every route**, **unavoidable**, **critical**, **must pass through**, or **cannot be bypassed**.
- The answer is about **vertices**, not edges. An edge that every path must use is a bridge-like object, and the two questions have different answers.
- The graph may contain **cycles**. A directed acyclic graph is a special case, and it has a simpler linear algorithm, but the general algorithm handles both.

| Signal in the statement | What it means |
| --- | --- |
| "lies on every route from $s$ to $t$" | The dominators of $t$ |
| "removing this vertex disconnects $s$ from $t$" | A strict dominator of $t$ |
| "the set of vertices that all paths share" | The dominator chain of the target |
| "one entry point, many exits" | A flow graph; a dominator tree is natural |
| "control dependence", "static single assignment" | The dominance frontier of the tree |
| "undirected graph, removing a vertex disconnects it" | [Articulation points](/algorithms/graphs/articulation-points), not dominators |
| "every shortest path" | Dominators of the shortest-path DAG, not of the whole graph |

Two distinctions are worth making early, because they cause most of the wrong answers.

The first is the difference between a dominator and an **articulation point**. Removing an articulation point disconnects an undirected graph, and the definition is symmetric in the two endpoints. Removing a dominator disconnects one particular source from one particular target, and the graph is directed, so the direction of every edge matters. In the graph $s \to a$, $s \to b$, $a \to b$, the vertex $a$ is not a dominator of $b$, because the route $s \to b$ avoids it, even though $a$ is an ancestor of $b$ in the depth-first search tree.

The second is the difference between all paths and **shortest paths**. A vertex that lies on every shortest path from $s$ to $t$ need not lie on every path. The usual solution to that problem runs a shortest-path algorithm, keeps only the edges that can appear on a shortest path, and builds a dominator tree of the resulting DAG. The dominator algorithm is the same; the graph it is given is different.

<Synonyms terms="dominator, dominator tree, immediate dominator, dominance, flow graph" />

## Naive approach

The first baseline is the deletion test. For every vertex $d$ and every vertex $v$, delete $d$ from the graph and run a reachability search from $s$. If $v$ is no longer reachable, $d$ dominates $v$. The cost is $O(V^2(V + E))$, which at the maximum constraints is about $8 \cdot 10^{15}$ edge examinations.

The second baseline is a fixed point over explicit sets. Give every vertex a bit set of the vertices that dominate it. Initialize the source to $\{s\}$ and every other reachable vertex to the set of all reachable vertices. Then repeatedly replace the set of $v$ by

$$
\mathrm{dom}(v) = \{v\} \cup \bigcap_{p \in \mathrm{pred}(v)} \mathrm{dom}(p),
$$

where the intersection runs over the reachable predecessors of $v$. Each pass costs $O(V^2 / w)$ word operations on a machine with $w$-bit words, and the number of passes is bounded by the height of the dominance relation. The memory is $O(V^2)$ bits, which is already $5$ gigabytes at $V = 200\,000$. The sets are correct, and they are far too large.

The third baseline exploits a topological order. In a directed acyclic graph, the predecessors of a vertex all appear before it, so the recurrence can be evaluated once in topological order and each set is built by a single intersection. That is much faster, and it is the right method for a DAG. It does not work on a general graph, because a back edge points at a vertex whose set has not been computed yet, and the evaluation has to be iterated to a fixed point anyway.

The fixed point of the second baseline is the object the algorithm wants. The problem is the representation: storing a set per vertex. The key observation is that the sets are nested along every edge of a tree, and only the deepest element of each set is needed to rebuild the whole set by walking upward.

## Key insight

The insight has two halves.

The first half is that **the dominators of a vertex form a chain**. Suppose $a$ and $b$ both dominate $v$ and neither dominates the other. Because $a$ does not dominate $b$, there is a path from $s$ to $b$ that avoids $a$. Because $b$ dominates $v$, the vertex $b$ lies on every path to $v$, so there is a path from $b$ to $v$. Concatenating the two gives a path from $s$ to $v$ that avoids $a$, contradicting the assumption that $a$ dominates $v$. Hence every two dominators of $v$ are comparable, and the chain has a deepest strict element. That element is $\mathrm{idom}(v)$, and the parent pointers form a tree.

The second half is that the parent can be computed from the **predecessors** alone:

$$
\mathrm{idom}(v) = \text{the deepest common dominator of the reachable predecessors of } v,
$$

for every reachable $v \ne s$. The reason is a restatement of the definition. A path from $s$ to $v$ ends with an edge $p \to v$, so a vertex $d \ne v$ lies on every path to $v$ exactly when it lies on every path to every predecessor $p$. The dominators of $v$ are therefore $\{v\}$ together with the intersection of the dominators of its predecessors, and the deepest element of that intersection is the deepest common ancestor of the predecessors in the dominator tree.

That is still circular, because the tree is what is being built. The resolution is to start with a spanning tree of the reachable vertices and refine it. The depth-first search supplies that tree and an order in which every parent precedes its children, so the first pass has a candidate for every vertex, and the later passes refine the candidates with the predecessors that were not available yet.

Reverse postorder is the third ingredient. Number the vertices in the reverse of the order in which the depth-first search finishes them. Every tree edge goes from a smaller number to a larger one, so an ancestor always has a smaller number than a descendant. The deepest common ancestor of two vertices is then found by repeatedly moving the one with the larger number to its parent. No sets are touched, and the walk visits at most one vertex per level of the tree.

Combining the three pieces gives the algorithm: one depth-first search for the order, then repeated passes over the reverse postorder, each vertex intersecting its predecessors by walking up the current tree. When a pass changes nothing, the tree satisfies the recurrence, and the recurrence has exactly one solution.

## Visual intuition

The graph below is small enough to trace by hand and contains the two features that matter: a cycle and an edge that is not part of the depth-first search tree.

| Edge | Tail | Head |
| ---- | ---- | ---- |
| 1    | 0    | 1    |
| 2    | 0    | 2    |
| 3    | 2    | 3    |
| 4    | 3    | 4    |
| 5    | 4    | 2    |
| 6    | 1    | 4    |

The depth-first search starts at $0$ and follows the adjacency lists in the order they were built. It goes $0 \to 1 \to 4 \to 2 \to 3$, then finds that $3$'s only successor, $4$, is already visited, and finishes $3$, then $2$, then $4$, then $1$, and finally $0$. The finishing order is $3, 2, 4, 1, 0$, so the reverse postorder is $0, 1, 4, 2, 3$.

| Vertex | Reverse-postorder number | First pass parent | Final parent |
| ------ | ------------------------ | ----------------- | ------------ |
| 0      | 0                        | 0                 | 0            |
| 1      | 1                        | 0                 | 0            |
| 2      | 3                        | 0                 | 0            |
| 3      | 4                        | 2                 | 2            |
| 4      | 2                        | 1                 | 0            |

The interesting cell is vertex $4$. In the first pass, its predecessor $3$ has not been processed yet, because $3$ comes later in reverse postorder. The only predecessor with a parent is $1$, so the first pass guesses that $1$ is the immediate dominator. In the second pass, $3$ has a parent, and the intersection of $1$ and $3$ climbs from $3$ to $2$ to $0$, then from $1$ to $0$, and discovers that the common ancestor is $0$. The guess is corrected.

That correction is why the algorithm iterates. A reverse postorder makes the first pass right for every edge that goes forward, but a back edge points at a vertex whose parent may still be a guess. The number of passes needed is the number of times a correction can propagate, which is small for the graphs that compilers and contests produce.

The tree that results has edges $0 \to 1$, $0 \to 2$, $2 \to 3$ and $0 \to 4$. Reading the ancestors of $4$ gives $\{0, 4\}$, which says that $0$ and $4$ are the only vertices on every path from $0$ to $4$. The route $0 \to 2 \to 3 \to 4$ avoids $1$, and the route $0 \to 1 \to 4$ avoids $2$ and $3$, so the answer is right.

There is no interactive player for this technique in the encyclopedia, so the table above stands in for it. The two columns that matter are the first-pass parent and the final parent: the difference between them is the work that the iteration does.

## Formal model

Let $G = (V, E)$ be a directed graph with a distinguished source $s \in V$. A vertex is **reachable** when some directed path from $s$ reaches it; the source is reachable through the empty path.

::: math definition Definition
A vertex $d$ **dominates** a vertex $v$, written $d \in \mathrm{dom}(v)$, when every directed path from $s$ to $v$ contains $d$. The relation is strict when $d \ne v$.
:::

::: math definition Definition
The **immediate dominator** of a reachable vertex $v \ne s$, written $\mathrm{idom}(v)$, is the unique strict dominator of $v$ that is dominated by every other strict dominator of $v$. The source is its own immediate dominator, $\mathrm{idom}(s) = s$.
:::

::: math definition Definition
The **dominator tree** is the tree on the reachable vertices in which the parent of $v \ne s$ is $\mathrm{idom}(v)$ and the root is $s$.
:::

::: math definition Definition
A **reverse postorder** of a depth-first search is the reverse of the order in which the search finishes its vertices. The position of $v$ in that order is written $\mathrm{rpo}(v)$.
:::

::: math lemma Lemma
For every reachable vertex $v \ne s$, the set $\mathrm{dom}(v)$ is totally ordered by dominance, and $\mathrm{idom}(v)$ is its deepest strict element.
:::

::: math lemma Lemma
For every reachable vertex $v \ne s$,

$$
\mathrm{dom}(v) = \{v\} \cup \bigcap_{p \in \mathrm{pred}(v)} \mathrm{dom}(p),
$$

where the intersection runs over the predecessors of $v$ that the source can reach.
:::

::: math lemma Lemma
In a depth-first search from $s$, every tree edge goes from a smaller reverse-postorder number to a larger one, so every ancestor of a vertex has a smaller number than the vertex itself.
:::

The lemmas are proved in the correctness section. The first two are the mathematical content of the algorithm; the third is what makes the intersection cheap.

## Algorithm derivation

The input is the successor list and the predecessor list of the graph, the number of vertices $n$, and the source $s$. The output is the immediate dominator of every vertex, with the conventions of the problem: the source prints $0$, an unreachable vertex prints $-1$, and a reachable vertex prints its parent.

The derivation has five steps.

1. **Search.** Run a depth-first search from $s$. Record the order in which vertices finish, then reverse it to obtain the reverse postorder. Give every visited vertex its position in that order. The search must be iterative, or a path of $n$ vertices overflows the call stack.
2. **Initialize.** Set $\mathrm{idom}(s) = s$ and leave every other entry unset. The unset value is $-1$, which is also the output for an unreachable vertex; the two uses do not collide because an unreachable vertex is never processed.
3. **Seed the intersection.** Process the reachable vertices in reverse postorder, skipping the source. For a vertex $v$, take the first predecessor whose immediate dominator is already set; that vertex is the initial candidate. Every reachable non-source vertex has at least one such predecessor: its depth-first search parent comes earlier in reverse postorder.
4. **Intersect.** For every other predecessor $p$ with a set immediate dominator, replace the candidate by the deepest common ancestor of the candidate and $p$ in the current tree. The ancestor walk uses the reverse-postorder numbers: while the candidate has the larger number, move it to its parent; while the predecessor has the larger number, move it to its parent; stop when they meet.
5. **Iterate.** If any vertex changed its immediate dominator during the pass, run another pass. Stop when a whole pass changes nothing.

The update is monotone. The current tree changes only by moving parents upward, and the candidate for a vertex is the deepest common ancestor of its predecessors in that tree. When the tree itself moves upward, the deepest common ancestor of a fixed set of vertices can only move upward as well. Every update therefore replaces a parent by a proper ancestor in the current tree, so the depth of that vertex strictly decreases, and depths never increase. No vertex can move more than $V$ times, and termination follows.

The intersection routine is the only part that needs the reverse postorder. Without it, an intersection would have to compare two full paths to the root, which costs $O(V)$ memory or a second traversal for every edge. With it, each step decreases the larger number, and the total number of steps is bounded by the depth of the current tree.

::: math invariant Invariant
At the end of every pass, every reachable vertex except the source has an immediate dominator, every immediate dominator is reachable, and the parent pointers form a tree rooted at the source. During a pass, the candidate for a vertex is always a common ancestor of the predecessors that have been intersected so far.
:::

## Step-by-step execution

Take the graph from the visual intuition section:

$$
0 \to 1,\quad 0 \to 2,\quad 2 \to 3,\quad 3 \to 4,\quad 4 \to 2,\quad 1 \to 4.
$$

The predecessor lists are $\mathrm{pred}(1) = \{0\}$, $\mathrm{pred}(2) = \{0, 4\}$, $\mathrm{pred}(3) = \{2\}$ and $\mathrm{pred}(4) = \{1, 3\}$.

The depth-first search from $0$ finishes $3, 2, 4, 1, 0$, so the reverse postorder is $0, 1, 4, 2, 3$ with positions $0, 1, 2, 3, 4$.

**Pass 1.**

1. Vertex $1$ has predecessor $0$. The candidate is $0$, so $\mathrm{idom}(1) = 0$.
2. Vertex $4$ has predecessors $1$ and $3$. Vertex $3$ is not set yet, so the candidate is $1$ and $\mathrm{idom}(4) = 1$.
3. Vertex $2$ has predecessors $0$ and $4$. The candidate starts at $0$. Intersecting with $4$: the number of $4$ is $2$, larger than the number of $0$, so $4$ moves to its parent $1$; the number of $1$ is $1$, still larger, so $1$ moves to $0$; the two meet at $0$. The candidate is $0$, so $\mathrm{idom}(2) = 0$.
4. Vertex $3$ has predecessor $2$. The candidate is $2$, so $\mathrm{idom}(3) = 2$.

The first pass ends with parents $0, 0, 0, 2, 1$ for vertices $0, 1, 2, 3, 4$.

**Pass 2.**

1. Vertex $1$ is unchanged.
2. Vertex $4$ has predecessors $1$ and $3$. The candidate starts at $1$. Intersecting with $3$: the number of $3$ is $4$, so $3$ moves to $2$; the number of $2$ is $3$, so $2$ moves to $0$; the number of $1$ is still $1$, so $1$ moves to $0$; the two meet at $0$. The candidate $0$ differs from the recorded parent $1$, so $\mathrm{idom}(4) = 0$.
3. Vertex $2$ has predecessors $0$ and $4$. The candidate starts at $0$. Intersecting with $4$: the number of $4$ is $2$, so $4$ moves to its new parent $0$; the two meet. The candidate stays $0$.
4. Vertex $3$ is unchanged.

**Pass 3.** No vertex changes, so the algorithm stops. The final parents are $0, 0, 0, 2, 0$, and the answer printed in index order is

```text
0 0 0 2 0
```

The first entry is the source, which prints $0$ by convention. Vertex $1$ is dominated by $0$, vertex $2$ by $0$, vertex $3$ by $2$, and vertex $4$ by $0$. The route $0 \to 1 \to 4$ and the route $0 \to 2 \to 3 \to 4$ have no vertex in common except $0$ and $4$, which is why $1$, $2$ and $3$ are not dominators of $4$.

The second pass is the part worth reading twice. The first pass was forced to guess $1$ for vertex $4$, because the only other predecessor, $3$, had not been processed yet. When $3$ finally has a parent, the intersection discovers that the two branches meet at $0$, and the guess is replaced.

## Correctness proof

::: math theorem Theorem
When the algorithm stops, $\mathrm{idom}(v)$ is the immediate dominator of every reachable vertex $v$, and every unreachable vertex still holds $-1$.
:::

::: math proof Proof
The depth-first search visits exactly the vertices reachable from $s$, so the reverse postorder contains exactly those vertices and no other. An unreachable vertex is never assigned a parent, so it prints $-1$. It remains to show that every reachable vertex gets its true immediate dominator.
:::

::: math lemma Lemma
The dominators of a reachable vertex form a chain.
:::

::: math proof Proof
Let $a$ and $b$ both dominate $v$, and suppose neither dominates the other. Since $a$ does not dominate $b$, there is a path from $s$ to $b$ that avoids $a$. Since $b$ dominates $v$, every path from $s$ to $v$ passes through $b$, so some path from $b$ to $v$ exists. Following the first path and then the second produces a path from $s$ to $v$ that avoids $a$, contradicting the assumption that $a$ dominates $v$. Hence $a$ and $b$ are comparable, and the whole set is a chain. $\square$
:::

::: math lemma Lemma
For a reachable vertex $v \ne s$, the dominators of $v$ are exactly $\{v\}$ together with the intersection of the dominators of its reachable predecessors.
:::

::: math proof Proof
Every path from $s$ to $v$ ends with an edge $p \to v$ for some predecessor $p$. A vertex $d \ne v$ lies on every such path exactly when it lies on every path from $s$ to every predecessor $p$: if some path to a predecessor avoids $d$, appending the edge to $v$ gives a path to $v$ that avoids $d$, and if every path to every predecessor contains $d$, then every path to $v$ contains $d$ before its last edge. Therefore $d \in \mathrm{dom}(v)$ exactly when $d$ belongs to $\mathrm{dom}(p)$ for every reachable predecessor $p$, which is the stated intersection. $\square$
:::

::: math lemma Lemma
If a parent function $P$ on the reachable vertices satisfies $P(s) = s$ and, for every $v \ne s$,

$$
P(v) = \text{the deepest common ancestor of the reachable predecessors of } v
$$

in the tree defined by $P$, then $P(v) = \mathrm{idom}(v)$ for every reachable $v$.
:::

::: math proof Proof
The proof is the standard fixed-point argument for dominance, and the two steps are worth separating.

First, $P(v)$ dominates $v$. Suppose a path from $s$ to $v$ avoids $P(v)$. Walk the path and let $y$ be the first vertex that lies in the subtree of $P(v)$ in the tree defined by $P$; the previous vertex $x$ is outside that subtree. The update rule makes $P(y)$ a common ancestor of all predecessors of $y$, including $x$, so $P(y)$ is an ancestor of $x$. But $y$ is a proper descendant of $P(v)$, so $P(y)$ lies in the subtree of $P(v)$, and an ancestor of a vertex outside a subtree cannot lie inside it. The contradiction shows that no path avoids $P(v)$.

Second, no strict dominator of $v$ is deeper than $P(v)$. Every dominator of $v$ that is not $v$ dominates every predecessor of $v$, by the same last-edge argument as the previous lemma. At convergence, that dominator is an ancestor of every predecessor in the tree defined by $P$, which is the standard induction part of the fixed-point argument, so it is a common ancestor of the predecessors. The recurrence chose the deepest common ancestor, so the dominator is an ancestor of $P(v)$. Hence $P(v)$ is the deepest strict dominator of $v$, which is $\mathrm{idom}(v)$ by definition. $\square$
:::

::: math proof Proof
Each pass either changes nothing or changes at least one parent. A change replaces the parent of a vertex by a proper ancestor in the current tree, and every update moves a parent strictly upward, so the total number of changes is finite. The algorithm therefore reaches a pass with no change, which means every vertex satisfies the recurrence of the previous lemma. By that lemma, the resulting function is the immediate dominator function. $\square$
:::

The proof of the fixed-point lemma is where the intuition lives. The first step says that a vertex chosen by the recurrence cannot be bypassed: if there were a path around it, the first edge of that path that enters its subtree would force a predecessor to have an ancestor outside the subtree, which the recurrence forbids. The second step says that no deeper dominator exists, because every dominator of $v$ is also a common ancestor of the predecessors, and the recurrence picked the deepest one.

The self-loop case is worth a sentence. A self-loop $v \to v$ adds $v$ to the predecessor list of $v$. The intersection routine treats it by climbing from $v$ to its current parent, so the loop contributes no new information and cannot make $v$ its own candidate. This is why the update is written as an intersection of vertices rather than as a literal intersection of predecessor sets.

## Complexity analysis

**The depth-first search: $O(V + E)$.** Each reachable vertex is pushed once, each edge out of a reachable vertex is examined once, and the postorder is reversed in one linear scan. The search is iterative, so its memory is the explicit stack of at most $V$ entries.

**One pass: $O(VE)$ in the worst case.** A pass processes every reachable vertex and every edge into it. The intersection of two vertices can climb the current tree one level per step, and the tree can be a path of length $V$, so a single intersection costs $O(V)$ and a single pass costs $O(V + E \cdot V)$. In practice the current tree is shallow and the average climb is short, which is why the method is fast on real inputs despite the pessimistic bound.

**The number of passes.** Kam and Ullman showed that the reverse-postorder iteration halts in at most $d(G) + 3$ passes, where $d(G)$ is the loop connectedness of the graph, the largest number of back edges on any acyclic path. For a reducible flow graph this is independent of the depth-first search tree; for an irreducible graph it depends on the tree, but it is still bounded by the depth of the graph. Two or three passes are typical. The worst case is $O(V)$ passes, which gives $O(V^2 E)$; this is the price of the simple algorithm.

**Space: $O(V + E)$.** The successor lists and the predecessor lists hold $2E$ entries. The visited array, the edge cursors, the postorder, the reverse postorder, the position array, the parent array and the explicit stack each hold $V$ entries. No dominator sets are stored, and that is the whole point of the representation.

::: math complexity Complexity
The iterative dataflow algorithm: time $O(VE)$ per pass, with at most $d(G) + 3$ passes, and auxiliary space $O(V + E)$. Lengauer-Tarjan computes the same tree in $O(E \alpha(V, E))$ time and $O(V + E)$ space.
:::

The practical warning is about the constant, not the bound. A pass touches every edge, and each intersection walks the current tree, so the algorithm is fastest when the tree is shallow. A graph whose dominator tree is a long path and whose edges point backward is the bad case; a chain of $n$ vertices with an edge from every vertex back to the previous one is easy, because each intersection climbs one level.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The dominators of one target in a directed graph | Build the dominator tree from the source and walk up from the target |
| The immediate dominator of every reachable vertex | The algorithm of this article, or Lengauer-Tarjan |
| An undirected graph and a vertex whose removal disconnects it | [Articulation points](/algorithms/graphs/articulation-points) |
| An undirected graph and an edge whose removal disconnects it | [Bridges](/algorithms/graphs/bridges) |
| Which vertices are reachable at all | [Depth-first search](/algorithms/graphs/dfs) or [breadth-first search](/algorithms/graphs/bfs) |
| The vertices on every **shortest** path | Build the shortest-path DAG, then its dominator tree |
| A DAG with a single source | Dominators in topological order, one pass, no iteration |
| A very large graph or an adversarial worst case | Lengauer-Tarjan |
| The dominance frontier, for static single assignment | The dominator tree, then the frontier construction |

The table below separates the three vertex-based questions that are easiest to confuse.

| Question | Graph | Object | Time |
| --- | --- | --- | --- |
| Which vertices lie on every path from $s$ to $v$ | Directed, one source | Dominator tree | $O(VE)$ per pass, near-linear in practice |
| Which vertices disconnect an undirected graph when removed | Undirected | Articulation points | $O(V + E)$ |
| Which vertices lie on every shortest path from $s$ to $v$ | Directed, weighted | Dominator tree of the shortest-path DAG | One shortest-path run plus one dominator run |
| Which vertices can reach $v$ | Directed | Reverse reachability | $O(V + E)$ |

The undirected questions are linear because the depth-first search exposes the answer directly through low-link values. Dominance is a directed question with one distinguished source, and the extra structure is what costs the extra time. Within the directed question, the choice is between the simple iterative algorithm and Lengauer-Tarjan: the former is a page of code with no clever data structure, the latter has a better worst case and a much larger constant in the implementation. For contest inputs up to a few hundred thousand vertices, the iterative version is usually the one that gets written.

## Reference implementations

The manifest publishes six **program** variants, one in each language. There is no separate minimal variant for this technique: the reusable object is the parent array, and the natural interface is a function that takes the two adjacency lists and the source.

All six programs parse the same input, in the order $n$, $m$, $s$, then $m$ pairs $u$ $v$. They ignore an edge whose endpoints fall outside $0 \ldots n-1$, they print one line of $n$ integers, they print $0$ for the source, and they print $-1$ for a vertex the source cannot reach. The output is canonical, so the six versions agree byte for byte on every fixture.

The implementations differ only in storage. The C and Java versions use a head array and linked edge arrays, because that avoids a second level of allocation for every vertex. The C++ version uses a vector of successor lists and a vector of predecessor lists. The Pascal version uses an array of dynamic arrays. Python and JavaScript use a list of lists. Every version runs the depth-first search with an explicit stack and an edge cursor per vertex, so no language's recursion limit is part of the algorithm.

The parent array is the only output. If a caller needs the full dominator set of a vertex, it walks from that vertex to the root; if it needs the subtree of a vertex, it walks down the children. Neither operation needs a second structure, which is why the parent array is the right interface.

## Recursion decision

The dominator computation itself is iterative. The fixed-point loop is a loop by definition, and the intersection is a while loop that climbs a tree. There is no natural recursive formulation of either.

The depth-first search has a recursive formulation, and it is the version most people write first. It is also the version that fails on a path of $200\,000$ vertices. The depth of the recursion equals the depth of the search tree, and a graph can be a single chain, so the worst case is exactly the input size.

| Language   | Default stack              | Practical depth         | Recommendation         |
| ---------- | -------------------------- | ----------------------- | ---------------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the explicit stack |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the explicit stack |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the explicit stack |
| Pascal     | The operating system stack | Depends on the platform | Use the explicit stack |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the explicit stack |

The iterative search keeps two arrays of $n$ entries, one for the stack and one for the current edge of each vertex. A vertex is pushed when it is first discovered, its cursor advances through its successor list while it sits on the stack, and it is popped and appended to the postorder when the cursor runs out. The result is the same postorder a recursive search would produce, with no recursion.

The dominator loop has a second reason to be iterative: the number of passes is not known in advance, and the loop has to be able to stop between passes. A recursive formulation would have to encode the pass structure as an extra parameter, and it would gain nothing.

## Implementation walkthrough

The heart of the algorithm is the intersection, and it fits in a few lines.

```cpp
while (a != b) {
    while (order[a] > order[b]) a = idom[a];
    while (order[b] > order[a]) b = idom[b];
}
return a;
```

Each comparison uses the reverse-postorder position. A larger position means a deeper vertex in the current tree, so the deeper vertex climbs. When the two positions are equal, the vertices are equal, because every position in the reverse postorder belongs to exactly one vertex.

The update loop is the second piece.

```cpp
int candidate = -1;
for (int p : pred[v]) {
    if (idom[p] == -1) continue;              // reachable only
    candidate = candidate == -1 ? p : intersect(p, candidate, idom, order);
}
if (candidate != -1 && idom[v] != candidate) {
    idom[v] = candidate;
    changed = true;
}
```

The `-1` test has two jobs. It skips a predecessor the source cannot reach, which has no reverse-postorder position and no parent. It also handles the first pass, when a predecessor that comes later in reverse postorder has not been assigned a parent yet. Skipping such a predecessor is safe because the next pass will see it.

The depth-first search is the third piece, and the cursor is what makes it iterative:

```cpp
if (nextEdge[v] < (int)adj[v].size()) {
    int w = adj[v][nextEdge[v]++];
    if (!visited[w]) {
        visited[w] = true;
        stack.push_back(w);
    }
} else {
    postorder.push_back(v);
    stack.pop_back();
}
```

A vertex is marked visited when it is pushed, not when it is popped. Marking on pop would push the same vertex many times and could make the stack grow with the number of edges; marking on push keeps it at $V$ entries and produces a genuine depth-first tree.

The output convention is the last detail. The program stores $-1$ for a vertex with no parent, and the source is its own parent in the internal array, but the required output prints $0$ for the source rather than $s$. The print loop therefore tests `v == source` first and prints $0$, then tests the parent array. A solution that prints the parent array directly is wrong whenever the source is not vertex $0$, which is why the fixtures include a source other than $0$.

All arithmetic is on vertex indices. There are no weights, no sums and no 64-bit values, so a 32-bit integer is enough for $n$ up to $2 \cdot 10^9$. The predecessor lists double the edge storage, which is still $O(V + E)$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using breadth-first order instead of reverse postorder | The first pass is much worse and the number of passes grows | Run a depth-first search and reverse its finishing order |
| Skipping the unreachable-predecessor test | An unset parent is read and the intersection walks off the tree | Skip a predecessor whose parent is $-1$ |
| Printing the parent of the source | The output is $s$ instead of $0$ when the source is not vertex $0$ | Test the source before printing |
| Printing $-1$ for the source | The output is wrong for every input whose source is not isolated | The source always prints $0$ |
| Using recursion for the depth-first search | A chain of $n$ vertices overflows the stack | Use an explicit stack and an edge cursor |
| Confusing dominators with articulation points | The answer includes vertices that are avoidable on a directed route | Check that the graph is directed and the source is fixed |
| Using the undirected low-link algorithm | It finds cut vertices, not dominators | Dominators need the intersection recurrence |
| Marking visited when a vertex is popped | The stack grows with the number of edges and the order is not a depth-first order | Mark when the vertex is pushed |
| Recomputing reachability for every removed vertex | $O(V^2(V + E))$ time | Use the tree, not deletion tests |
| Assuming the parent in the DFS tree is the dominator | The first pass can be wrong, as the worked trace shows | Iterate until no parent changes |

### Why this fails: the avoidable ancestor

The mistake that survives review most often is treating the depth-first search parent as the immediate dominator. It is a natural guess: the parent is the vertex that discovered the child, and in many small examples it is right. The graph from the worked trace shows why it is not.

The search tree has the edge $1 \to 4$, because $4$ was discovered from $1$. The other predecessor of $4$ is $3$, which is reached through $2$. The route $0 \to 2 \to 3 \to 4$ avoids $1$ entirely, so $1$ does not dominate $4$, and the parent in the search tree is not the parent in the dominator tree. The first pass of the algorithm makes exactly this mistake and records $1$; the second pass corrects it to $0$.

The same mistake appears in a different form when the graph is a shortest-path DAG. There, the depth-first search parent is often a shortest-path predecessor, and the first pass looks plausible on the samples. A single edge that reaches the target by a different route is enough to break it, and the failure is silent: the program prints a parent that is not a dominator, with no crash and no out-of-range index.

The fix is not a special case for the tree edge. It is to run the fixed point to convergence, which is exactly what the second pass does. If a solution is short on time, the safe optimization is to stop after the pass that changes nothing, not after the first pass.

## Variants and extensions

- **Lengauer-Tarjan.** The classical algorithm uses a depth-first search, the notion of a semidominator, and a disjoint-set structure with a minimum query to compute the tree in $O(E \alpha(V, E))$ time. It is the right choice when the worst case matters; the code is longer and the constant is larger.
- **The semidominator view.** Lengauer-Tarjan's proof is built on the semidominator of a vertex, which is the smallest reverse-postorder vertex that can reach it through a path whose internal vertices are all later in the order. The immediate dominator is either the semidominator or the immediate dominator of a vertex on a certain path.
- **Dominance frontiers.** The frontier of a vertex $d$ is the set of vertices $v$ such that $d$ dominates a predecessor of $v$ but $d$ does not strictly dominate $v$ itself. It is computed from the tree and the predecessor lists and is the key structure of the static single assignment construction.
- **Postdominators.** Reverse every edge and use the exit as the source. A vertex that postdominates $v$ lies on every path from $v$ to the exit, which is the usual notion of "control dependence".
- **Edge dominators.** Subdivide every edge or build the line graph, then compute vertex dominators on the result. An edge that every path must use becomes a vertex of degree two whose removal separates the source from the target.
- **Dominators in a DAG.** Process the vertices in topological order and intersect the parents of the predecessors once. No fixed point is needed, and the result is linear in the size of the graph.
- **Dynamic dominators.** When edges are inserted or deleted, the tree can be maintained without recomputing it from scratch. The algorithms are substantially more involved and are outside the scope of a contest library.
- **Multiple sources.** Add a virtual source with an edge to every real source and run the algorithm once. The virtual source is the root, and the parents of the real sources are the virtual vertex.
- **Implicit graphs.** A grid or a state space can compute its successors on demand. The algorithm does not change; only the successor function does.

## Contest strategy

Under contest pressure, the following order of decisions avoids the usual losses.

1. **Decide what the question is.** "Every path" means dominators. "Every shortest path" means a dominator tree of the shortest-path DAG. "Removing a vertex disconnects an undirected graph" means articulation points. Write the decision down before coding.
2. **Check the direction and the number of sources.** Dominators need a directed graph and one source. An undirected graph needs the low-link algorithm, not this one.
3. **Choose the algorithm.** For $n$ up to a few hundred thousand, the iterative dataflow version is short enough to write and fast enough in practice. If the statement is adversarial or the limit is in the millions, use Lengauer-Tarjan from a library.
4. **Build both adjacency lists.** The successors are needed for the search and the predecessors for the update. Building only the successors is the most common structural mistake.
5. **Use an iterative search.** The graph can be a chain. The recursive version is a stack overflow waiting for the one test that matters.
6. **Use reverse postorder, not discovery order.** The order is the difference between two passes and many passes, and it is the only reason the intersection can climb by index.
7. **Test the conventions.** The source prints $0$, an unreachable vertex prints $-1$, and a reachable vertex prints its parent. A fixture with a source other than $0$ catches the first of these; a disconnected fixture catches the second.
8. **Verify against a brute force on small graphs.** For $n \le 8$, compute the dominator sets by deleting each vertex and testing reachability, then compare the parent arrays. This is the cheapest insurance against a silent wrong answer.

## Worked problems

### Problem 1: the direct statement

**Restatement.** A directed graph has $N \le 200\,000$ vertices and $M \le 200\,000$ edges, with a source $S$. Print the parent of every vertex in the dominator tree rooted at $S$. A vertex the source cannot reach prints $-1$, and $p_S = S$.

**Naive baseline.** For every vertex $v$, delete each candidate $d$ and test whether $v$ is still reachable. This is $O(N^2(N + M))$ and cannot finish.

**Insight.** The parent array is exactly the immediate dominator array, and the iterative dataflow algorithm computes it in a few passes.

**Derivation.** Read the graph, build the successor and predecessor lists, run the depth-first search from $S$, reverse the finishing order, and iterate the predecessor intersection until no parent changes. Print the parent of each vertex, with the source's own convention.

**Correctness.** The theorem of the correctness section says the fixed point is the immediate dominator function. The source is its own parent by definition, and an unreachable vertex never receives a parent.

**Complexity.** $O((N + M) \cdot d)$ time for $d$ passes, with $d$ small in practice, and $O(N + M)$ space.

**Common wrong approach.** Printing $0$ for the source and forgetting that this problem prints $S$. The reference program's convention is $0$ for the source; the judge's convention is the source itself. The difference is invisible whenever $S = 0$ and wrong otherwise, which is why this case is called out in the statement.

### Problem 2: the critical cities

**Restatement.** A directed graph has $n \le 100\,000$ cities and $m \le 200\,000$ one-way flights. City $1$ is the start and city $n$ is the finish. Print the number of cities that lie on every route from $1$ to $n$, then those cities in increasing order. A route from $1$ to $n$ is guaranteed to exist.

**Naive baseline.** Delete each city and test whether $n$ is still reachable from $1$. Each test is a graph traversal, so the total is $O(n(n + m))$, which is too slow at the maximum.

**Insight.** The cities on every route to $n$ are the dominators of $n$, and they form the ancestor chain of $n$ in the dominator tree. Building the whole tree and walking up from $n$ is enough.

**Derivation.** Run the algorithm with source $1$. Start at city $n$ and follow parent pointers to the root, collecting every vertex on the path, including $n$ and $1$. Sort the labels, then print the count followed by the labels.

**Correctness.** By the definition of the tree, the ancestors of $n$ are exactly the strict dominators of $n$, and a vertex dominates $n$ exactly when every route from $1$ to $n$ passes through it. The upward walk therefore collects exactly the critical cities, and the sort puts them in the required order.

**Complexity.** $O((n + m) \cdot d)$ for the tree, plus $O(n \log n)$ for the sort of at most $n$ labels, and $O(n + m)$ space.

**Common wrong approach.** Collecting the critical cities in the order of the upward walk and printing them without sorting. The walk visits them from the target toward the source, which is decreasing order of depth, not increasing order of label. The count is right and the order is wrong, and the judge reports it as a wrong answer on every non-chain case.

### Problem 3: the sum of the important sisters

**Restatement.** A directed graph has $n \le 50\,000$ vertices and $m \le 100\,000$ edges, and the source is vertex $n$. Every vertex is reachable from the source. A vertex is an important sister of $v$ when it lies on every route from the source to $v$, and $v$ itself counts. For every vertex, print the sum of the labels of its important sisters. The input holds several test cases and ends at end of file.

**Naive baseline.** For every vertex $v$, delete each other vertex and test whether $v$ is still reachable from $n$. Each test is a traversal, so one case costs $O(n^2(n + m))$, which is far too slow at the maximum.

**Insight.** The important sisters of $v$ are exactly the dominators of $v$, and the dominators are the ancestors of $v$ in the dominator tree plus $v$ itself. The sum for a vertex is therefore the sum for its parent plus its own label.

**Derivation.** Read a case, build the successor and predecessor lists, and compute the dominator tree rooted at vertex $n$. Walk the vertices in reverse postorder, which visits every parent before its children, and set `sum[v] = sum[parent[v]] + v`. Print the sums in vertex order and repeat for the next case.

**Correctness.** By the definition of the tree, the ancestors of $v$ are exactly the strict dominators of $v$, and the vertex itself is the only dominator missing from that list. The running sum adds exactly those labels, so the value printed for $v$ is the total the statement asks for. The source is its own parent, and its sum is its own label, which matches the sample.

**Complexity.** $O((n + m) \cdot d)$ time for $d$ passes of the dominator computation, plus $O(n)$ for the sums, and $O(n + m)$ space per case. The largest possible sum is $1 + 2 + \cdots + 50\,000 = 1\,250\,025\,000$, which fits a signed 32-bit integer, but a 64-bit type is harmless.

**Common wrong approach.** Adding only the immediate dominator instead of every ancestor and the vertex itself. The immediate dominator is one important sister, not the whole set, and the answer is short by every other vertex on the root path. A second mistake is assuming the source is vertex $1$; this statement puts it at vertex $n$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about dominators, articulation points, bridges or plain reachability. Write the decision down and name the graph direction and the source.
2. **Direct application.** Implement the iterative algorithm for a graph with one source and print the parent array. Test it on a chain, a cycle and a disconnected graph.
3. **Intersection drill.** Trace `intersect` by hand on a graph with a cross edge and a back edge. Predict the first-pass parent and the final parent before running the code.
4. **Adaptation.** Answer a single-target question by walking up from the target, and a subtree question by storing the children. Add the shortest-path DAG construction and run the algorithm on it.
5. **Combination.** Build the dominance frontier from the tree and the predecessor lists, or count the vertices in the subtree of each node. Both need only the parent array and one extra traversal.
6. **Challenge.** Solve a graph with $n = 200\,000$ and $m = 200\,000$ under the time limit, with a source other than $0$, a disconnected component and a self-loop. Compare the output against a brute force on every small random graph you can generate.
7. **Transfer.** Replace the iterative solver with Lengauer-Tarjan on the same interface and verify that the two trees are identical. The parent array is the contract; the algorithm behind it is replaceable.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Define a dominator, a strict dominator and an immediate dominator for a directed graph with a source. (Formal model)
2. Why do the dominators of one vertex form a chain, and why does that make the immediate dominators a tree? (Key insight, Correctness proof)
3. What is the recurrence that computes the dominators of a vertex from its predecessors? (Formal model)
4. Why does the algorithm need a reverse postorder, and what property of that order makes the intersection a simple climb? (Algorithm derivation)
5. In the worked trace, why is vertex $4$'s first parent wrong, and what changes it in the second pass? (Step-by-step execution)
6. State the running time of one pass, the bound on the number of passes, and the space. (Complexity analysis)
7. What is the difference between a dominator and an articulation point? Give a graph where they disagree. (Recognition patterns, Common mistakes)
8. Why must the depth-first search be iterative, and how many entries does the explicit stack hold? (Recursion decision)
9. What does the program print for the source, and what does it print for an unreachable vertex? (Implementation walkthrough)
10. When is the dominator tree of a shortest-path DAG the right object, and when is it the wrong one? (Algorithm selection, Worked problems)

## Further reading

- The traversal that produces the reverse postorder, and the low-link values for the undirected questions, are in [depth-first search](/algorithms/graphs/dfs).
- The undirected analogue of "must pass through" is [articulation points](/algorithms/graphs/articulation-points), and the edge version is [bridges](/algorithms/graphs/bridges).
- A graph with no cycles can be processed in topological order, which gives a linear dominator algorithm; the order itself is explained in [topological sort](/algorithms/graphs/topological-sort).
- The structure that every path from the source must enter is closely related to [strongly connected components](/algorithms/graphs/strongly-connected-components), which condense a directed graph into a DAG.
- The shortest-path DAG on which the dominator tree is often built comes from [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The tree ancestor queries that answer "is $d$ a dominator of $v$" in constant time are covered by the [lowest common ancestor](/algorithms/trees/lca).
- The input format and the difference between an adjacency list and an adjacency matrix are covered in [graph representation](/algorithms/graphs/representation).
- The original iterative algorithm is described by Keith D. Cooper, Timothy J. Harvey and Ken Kennedy in "A Simple, Fast Dominance Algorithm", and the linear-time algorithm by Thomas Lengauer and Robert Endre Tarjan in "A Fast Algorithm for Finding Dominators in a Flowgraph".
