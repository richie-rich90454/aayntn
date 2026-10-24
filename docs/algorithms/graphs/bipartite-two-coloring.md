---
id: graphs.bipartite-two-coloring
title: The two-coloring test for a bipartite graph
summary: Decide whether an undirected graph can be split into two sides with every edge crossing, by coloring each component from one vertex and checking every edge to an already-colored neighbor.
division: [silver, gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [bipartite, two-coloring, odd cycle, graph coloring, conflict edge, breadth-first search]
prerequisites:
    required: [graphs.representation, graphs.bfs]
    recommended: [graphs.dfs, graphs.dsu]
complexity:
    time: "O(V + E)"
    space: "O(V + E)"
assumptions:
    - The graph is undirected, and every edge forbids the two endpoint colors from being equal.
implementations: graphs.bipartite-two-coloring
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.bipartite-two-coloring" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="graphs.bipartite-two-coloring" />

A graph is **bipartite** when its vertices can be split into two sides such that every edge has one endpoint on each side. The two-coloring test answers that question, and when the answer is yes it produces the split, by painting one vertex and forcing every neighbor to the opposite color.

The whole test is a traversal with a color array. The rule that is not negotiable is that an edge to an **already-colored** vertex must be checked for a conflict, not merely skipped. A traversal that colors only the vertices it discovers builds a bipartite spanning tree by construction, so it will happily return a coloring for a triangle; only the non-tree edge exposes the odd cycle.

The test costs $O(V + E)$ time, because every vertex enters the queue once and every adjacency entry is examined once. The color array and the queue hold $O(V)$ entries; the $O(V + E)$ space figure in the manifest includes the adjacency list the search is given.

## Problem motivation

A school has $n$ students and $m$ rival pairs. The principal must split the students into two teams so that the two students in every rival pair end up on different teams, and must either produce a split or report that none exists.

The constraints:

- $1 \le n \le 200\,000$ students.
- $0 \le m \le 200\,000$ rival pairs.
- Each pair is between two different students.
- The answer must assign every student, not only answer yes or no.

The phrase "every rival pair ends up on different teams" is a constraint between two variables, and the constraint has exactly one form: the two values must differ. Model each student as a vertex and each rival pair as an edge. A valid split is then a function $\mathrm{color} : V \to \{0, 1\}$ with $\mathrm{color}(u) \ne \mathrm{color}(v)$ on every edge, which is precisely a proper two-coloring. The question "does such a split exist" is the question "is the graph bipartite".

Two details in the statement matter. The graph may be **disconnected**: two groups of students with no rivalry between them can be split independently, and the colors of one component can be flipped without affecting the other. And the answer is a partition, not just a verdict, so the test has to keep the colors that it assigns.

The same shape appears whenever a statement says that two things must be **different**: enemies on opposite sides, adjacent cells on different colors of a checkerboard, variables that must take opposite truth values, or edges that must all point from one group to the other. Each is a graph two-coloring in disguise.

## Recognition patterns

The two-coloring test is the right tool when all of the following hold.

- The problem partitions objects into **two** groups, and every constraint says that two objects must be in **different** groups.
- The constraints are **pairwise**: each one involves exactly two objects and forbids one combination of their labels.
- The graph is **undirected** in the sense that a constraint between $a$ and $b$ is the same constraint read from $b$ to $a$.
- The goal is to decide whether a split exists, to produce one, or to use the split as a step of a larger algorithm.
- Every object must receive a label, including objects that appear in no constraint.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Every constraint is "these two differ" | Rules in the two-coloring test |
| Some constraints are "these two are equal" | Rules in a [disjoint set union](/algorithms/graphs/dsu) with parity, which handles both forms |
| A constraint says a vertex differs from itself | Rules out any two-coloring immediately; a self-loop is an odd cycle |
| $n, m \le 2 \cdot 10^5$ | One linear traversal is comfortable; a brute force over colorings is not |
| The graph is directed | The test is on the **underlying undirected** graph; add both arcs |
| Three or more colors are allowed | Rules out two-coloring; general graph coloring is hard |
| The split must have equal sides | Not answered by this test; balanced bipartition is a different, much harder problem |
| The graph is a tree or a forest | Always bipartite, so the test can be replaced by a direct construction |
| The graph is a grid with side-adjacency | The checkerboard coloring works without a traversal, unless blocked cells or extra edges break it |
| A certificate in the form of an odd cycle is required | The test is the right frame, but it must record parents to reconstruct the cycle |

Several phrases in a statement are reliable signals. "Divide into two groups", "two teams", "opposite sides", "enemies", "cannot be together", "bipartite", "two-colorable" and "odd cycle" point here. "At most $k$ colors" for $k \ge 3$ points away. "Friends must be together" is not a disequality and usually points at a [disjoint set union](/algorithms/graphs/dsu).

<Synonyms terms="bipartite graph, two-coloring, 2-coloring, bipartite check, odd cycle, graph coloring, conflict graph" />

## Naive approach

The first baseline is to try every assignment of two colors to the $n$ vertices.

```text
for each of the 2^n colorings:
    for each edge (u, v):
        if color[u] == color[v]: reject this coloring
    if no edge was rejected: accept
```

This is correct and it costs $O(2^n (V + E))$ time. At $n = 30$ it already examines about $10^9$ assignments before it looks at an edge, and at $n = 200\,000$ it cannot finish. The baseline is useful only as a reference for very small graphs.

The second baseline is to enumerate cycles and check the length of each one. A graph is bipartite exactly when every cycle is even, so this is correct in principle, but the number of cycles is exponential in the general case, and a graph with $10^5$ edges can have far more cycles than can be listed.

The third baseline is a traversal that colors each newly discovered vertex with the opposite color of its parent, and never looks at an edge whose other endpoint is already colored. This is the tempting one, because it is $O(V + E)$, it is shorter than the correct algorithm, and it is right on every tree. It is wrong on a triangle: the breadth-first tree uses two of the three edges, colors the third vertex with the opposite color of the root, and never notices that the third edge joins two vertices of the same color. The [common mistakes](#common-mistakes) section works this example out step by step.

## Key insight

The insight is that the color of one vertex **forces** the color of every neighbor, and the forcing propagates along paths.

Fix a connected component and a root $r$. If the graph has a valid two-coloring, the color of every vertex is forced by its distance from $r$: an edge changes the color, so a path of length $k$ from $r$ changes the color exactly $k$ times. Every vertex at an even distance from $r$ must receive the color of $r$, and every vertex at an odd distance must receive the other color. There is no choice left except flipping the whole component.

So run a breadth-first search from $r$ and color each vertex by the parity of its distance. When the search examines an edge $(u, v)$, both endpoints now have forced colors. If the colors differ, the edge agrees with the coloring. If they are equal, the edge **contradicts** the coloring, and no assignment can satisfy all constraints at once.

The contradiction is not a failure of the search. It is a proof that the graph is not bipartite, and the reason is parity. Suppose $u$ and $v$ have the same color. Their distances from $r$ then have the same parity, so the trail that walks from $r$ to $u$, crosses the edge to $v$, and walks back from $v$ to $r$ has length $d(u) + 1 + d(v)$, which is odd. A closed trail of odd length contains an odd cycle. A bipartite graph cannot contain one, because a cycle alternates between the two sides and therefore has even length. This is the whole test: a graph is bipartite if and only if it has no odd cycle.

An even cycle is never an obstruction. Color it alternately and the last edge closes on the opposite color, as it must, because an even number of alternations returns to where it started. The parity is the entire distinction, which is why the test looks for a parity conflict rather than for a cycle of any kind, and why a graph full of even cycles can still be bipartite. The smallest obstruction is a triangle, and the next smallest is a five-cycle.

## Visual intuition

Picture the search as a wave that leaves the root and paints rings.

The root is painted $0$. Every vertex at distance one is painted $1$, every vertex at distance two is painted $0$, and so on. Inside one ring all vertices have the same color, and consecutive rings have opposite colors. Tree edges always join consecutive rings, so they never cause trouble. The only edges that can cause trouble are the **chords** that join two vertices of the same ring, or more generally two rings of the same parity.

| Vertex            | $0$ | $1$ | $2$ | $3$ | $4$ | $5$ |
| ----------------- | --- | --- | --- | --- | --- | --- |
| Distance from $0$ | $0$ | $1$ | $2$ | $3$ | $2$ | $1$ |
| Color             | $0$ | $1$ | $0$ | $1$ | $0$ | $1$ |

The table is the six-cycle $0 - 1 - 2 - 3 - 4 - 5 - 0$ with the root at $0$. The edge $0 - 3$ is a chord: its endpoints have distances $0$ and $3$, of different parity, so it joins opposite colors and is harmless. The edge $2 - 5$ has distances $2$ and $1$, again harmless. Add the edge $2 - 4$ instead. Both endpoints have distance $2$ and color $0$, so the edge closes the triangle $2 - 3 - 4 - 2$; the search reports a conflict at the moment it examines that edge.

The queue is the frontier. Vertices leave it in order of increasing distance, which is why the distance parity is the same as the color. A vertex that is discovered twice keeps its first distance, because breadth-first search discovers it along a shortest path; the second edge is the one that must be checked, and it is exactly the edge that may expose an odd cycle.

## Formal model

Let $G = (V, E)$ be a finite undirected graph. A self-loop counts as an edge from a vertex to itself, and it makes a two-coloring impossible.

::: math definition Definition
A **proper two-coloring** of $G$ is a function $c : V \to \{0, 1\}$ such that $c(u) \ne c(v)$ for every edge $\{u, v\} \in E$.
:::

::: math definition Definition
The graph $G$ is **bipartite** if it has a proper two-coloring. The sets $c^{-1}(0)$ and $c^{-1}(1)$ are the two **sides** of the coloring.
:::

::: math definition Definition
A **cycle** is a closed walk with no repeated vertex except the first and the last. It is **odd** when the number of edges on it is odd.
:::

::: math lemma Lemma
If $G$ is bipartite, then every cycle of $G$ has even length.
:::

::: math lemma Lemma
Let $d(v)$ be the breadth-first distance from a root $r$. For every edge $\{u, v\}$ of $G$, $\lvert d(u) - d(v) \rvert \le 1$.
:::

::: math invariant Invariant
At every moment of the search, every colored vertex has the color $d(v) \bmod 2$, where $d(v)$ is its breadth-first distance from the root of its component. Every edge whose two endpoints are colored and whose colors agree has already been reported as a conflict.
:::

The second lemma holds because when $u$ is dequeued, every neighbor $v$ is either discovered with distance $d(u) + 1$ or was discovered earlier with a distance of at most $d(u) + 1$. The inequality is symmetric in $u$ and $v$, so the distances of an edge differ by at most one.

## Algorithm derivation

The state is a color array `color` with one entry per vertex, initialized to $-1$ for "not yet colored", and a first-in, first-out queue.

The algorithm processes one connected component at a time.

1. Find the smallest vertex $s$ with `color[s] == -1`. If there is none, the whole graph has been processed.
2. Set `color[s] = 0` and push $s$ onto the queue.
3. While the queue is not empty, pop the front vertex $u$.
4. For every neighbor $v$ of $u$:
    - If `color[v] == -1`, set `color[v] = 1 - color[u]` and push $v$.
    - Otherwise, if `color[v] == color[u]`, report that the graph is not bipartite and stop.
5. Go back to step 1 for the next component.

The update rule is forced, not chosen. When a vertex is popped, its own color is already final, because it was fixed when the vertex was discovered. Every uncolored neighbor must receive the opposite color, and every colored neighbor must already have that opposite color. A colored neighbor with the same color is a contradiction, and there is nothing to try instead.

The initialization of each component at color $0$ is also forced up to a flip. A valid coloring of a connected component is unique once the color of one vertex is fixed, because the colors propagate along paths. Seeding every component with $0$ therefore does not lose a solution: if a solution exists, flipping the colors of any component that starts with $1$ produces another solution that starts with $0$.

The traversal order matters for one reason only: breadth-first search discovers each vertex along a shortest path, so the color of a vertex is its distance parity. A depth-first search would also work, because it still propagates the opposite color along every tree edge and checks every back edge. What does not work is a traversal that ignores the back edges.

::: math invariant Invariant
Before each iteration of the inner loop, the queue holds exactly the discovered vertices that have not yet been dequeued, and every examined edge with two colored endpoints has different endpoint colors unless the search has already stopped.
:::

## Step-by-step execution

Take the graph on vertices $0, 1, \ldots, 7$ with the edges

$$
\{0,1\}, \{1,2\}, \{2,3\}, \{3,0\}, \{2,4\}, \{4,5\}, \{5,3\}, \{6,7\}.
$$

Vertices $0$ through $5$ form one component, vertices $6$ and $7$ form a second, and the graph is bipartite. Run the search from $0$.

1. `color[0] = 0`, queue $[0]$.
2. Pop $0$. Neighbors $1$ and $3$ are uncolored, so `color[1] = color[3] = 1` and the queue becomes $[1, 3]$.
3. Pop $1$. Neighbor $0$ has color $0$, which differs from $1$. Neighbor $2$ is uncolored, so `color[2] = 0` and the queue becomes $[3, 2]$.
4. Pop $3$. Neighbor $0$ has color $0$ and neighbor $2$ has color $0$, both different from $1$. Neighbor $5$ is uncolored, so `color[5] = 0` and the queue becomes $[2, 5]$.
5. Pop $2$. Neighbors $1$ and $3$ have color $1$, and neighbor $4$ is uncolored, so `color[4] = 1`. The queue becomes $[5, 4]$.
6. Pop $5$. Neighbors $3$ and $4$ both have color $1$, different from `color[5] = 0`. The queue becomes $[4]$.
7. Pop $4$. Neighbors $2$ and $5$ both have color $0$, different from `color[4] = 1`. The queue is empty.
8. The component is finished. Vertex $6$ is still uncolored, so seed it with `color[6] = 0`, push it, and pop it. Neighbor $7$ is uncolored, so `color[7] = 1`.

The final colors are

$$
0,\ 1,\ 0,\ 1,\ 1,\ 0,\ 0,\ 1
$$

in vertex order. Every edge joins a $0$ to a $1$, so this is a valid split.

Now add the edge $\{2, 5\}$ and run the search again. Steps 1 through 4 are unchanged. At step 5, vertex $2$ has color $0$, and its neighbor $5$ already has color $0$ from step 4. The colors agree, so the search reports that the graph is not bipartite. The edge closes the triangle $2 - 3 - 5 - 2$, which is an odd cycle, and no two-coloring can exist. The search does not need to examine the rest of the graph, because one odd cycle is already a proof.

The check at step 5 is the step that a traversal of tree edges alone would omit. Vertex $5$ was discovered from $3$, so the tree edge $3 - 5$ was colored correctly. The edge $2 - 5$ is not in the tree, and it is the only evidence that the triangle exists.

## Correctness proof

::: math theorem Theorem
The search reports a conflict if and only if $G$ is not bipartite. When it reports no conflict, the color array is a proper two-coloring of $G$.
:::

::: math proof Proof
First suppose the search reports no conflict. Every vertex is colored exactly once, because a vertex is colored only when its color is $-1$. Consider any edge $\{u, v\}$. Both endpoints are eventually colored, since the outer loop visits every vertex. When the first of the two endpoints was popped, the other was either uncolored, in which case it received the opposite color, or already colored, in which case the absence of a conflict means its color differs. Either way $c(u) \ne c(v)$. Hence the color array is a proper two-coloring, and $G$ is bipartite.

For the converse, suppose the search reports a conflict, on the edge $\{u, v\}$ with $c(u) = c(v)$. Colors are assigned as the parity of the breadth-first distance from the root of the component, by induction on the order of discovery: the root has color $0$ and distance $0$, and a newly discovered vertex receives the opposite color of a vertex at distance $d$, so it has distance $d + 1$ and color $(d + 1) \bmod 2$. Therefore $d(u)$ and $d(v)$ have the same parity.

Let $P_u$ be the breadth-first tree path from the root $r$ to $u$, and $P_v$ the tree path from $r$ to $v$. Walking $P_u$, then the edge $\{u, v\}$, then $P_v$ backward is a closed walk of length

$$
d(u) + 1 + d(v),
$$

which is odd because the two distances have the same parity. A closed walk of odd length contains an odd cycle: take a shortest odd closed walk, and if it repeats an internal vertex, split it at that vertex into two closed walks, one of which is odd and shorter, contradicting minimality. So $G$ contains an odd cycle. By the lemma, a bipartite graph has no odd cycle, so $G$ is not bipartite. $\square$
:::

::: math proof Proof
The two lemmas used above hold.

For the first lemma, if $G$ has a proper two-coloring $c$, walk around a cycle $v_0, v_1, \ldots, v_k = v_0$. Consecutive vertices have different colors, so the colors alternate $c(v_0), 1 - c(v_0), c(v_0), \ldots$. Returning to $v_0$ after $k$ steps requires that $k$ be even, because an odd number of alternations would end at $1 - c(v_0)$ instead of $c(v_0)$.

For the second lemma, when $u$ is popped its distance is $d(u)$, and every neighbor $v$ that is still uncolored receives $d(u) + 1$. If $v$ was already discovered, it was discovered from a vertex at distance at most $d(u)$, so $d(v) \le d(u) + 1$. Applying the same argument with the roles exchanged gives the other inequality. $\square$
:::

The proof of the conflict direction is the one worth remembering. The algorithm does not have to search for an odd cycle explicitly: the parity of the distances builds the cycle for free, and the conflicting edge is the last edge that closes it.

The two halves of the theorem are independent, and it is worth keeping them apart. The direction from no conflict to a proper coloring uses only the fact that every edge is examined, so it does not depend on the order of the traversal. The direction from a conflict to an odd cycle uses the parity invariant, which is specific to the way the traversal discovers vertices. A depth-first search satisfies a different version of the invariant: the color is the parity of the depth in the depth-first tree rather than the shortest-path distance, and the path between the endpoints of a same-color back edge still has even length, because the depths of its endpoints have the same parity and twice the depth of their lowest common ancestor is even. The tree path plus the back edge is again an odd cycle, so the same argument covers the depth-first variant.

The outer loop is also part of the correctness statement. A graph is bipartite exactly when every connected component is bipartite, and the colors of one component have no constraint linking them to another. The search proves each component independently, which is why a conflict in any one of them is enough to reject the whole graph, and why a component with no edges contributes no possibility of a conflict.

## Complexity analysis

**Time: $O(V + E)$.** Each vertex is pushed onto the queue at most once, because it is pushed only when its color changes from $-1$ to a value, and a color never changes back. Each pop examines the adjacency list of its vertex once. In an undirected graph every edge appears twice in the adjacency lists, so the total number of adjacency entries examined is at most $2E$. The outer loop scans the vertex array once, which is $O(V)$. The total is $O(V + E)$.

**Auxiliary space: $O(V)$.** The color array holds $V$ entries, and the queue holds at most $V$ entries. The adjacency list holds $2E$ entries and is part of the input, so the total working set is $O(V + E)$, which is the figure recorded in the manifest.

::: math complexity Complexity
The two-coloring test with breadth-first search: time $O(V + E)$, auxiliary space $O(V)$ beyond the adjacency list, or $O(V + E)$ including it. A depth-first search has the same bounds and the same result.
:::

Two practical warnings belong here. First, the test must run over **every** component, not only the component of vertex $0$; a disconnected graph is bipartite exactly when each of its components is, and a search from one vertex says nothing about the others. Second, the adjacency list must contain both directions of every undirected edge. If only the input direction is stored, a constraint is checked from one side only, and a conflicting edge can be missed.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Every constraint says two objects differ, and only two labels exist | The two-coloring test |
| Constraints mix "differ" and "equal" | A [disjoint set union](/algorithms/graphs/dsu) with parity |
| Constraints are implications of the form "$a$ or $b$" | A 2-SAT implication graph, with [strongly connected components](/algorithms/graphs/strongly-connected-components) |
| Three or more labels are allowed | General graph coloring, which is NP-hard; no linear test exists |
| A split is known and a maximum pairing is wanted | [Bipartite matching](/algorithms/graphs/bipartite-matching) |
| The graph is a tree | It is always bipartite; color by depth directly |
| The graph is a grid with side-adjacency and no extra edges | The checkerboard coloring by cell parity |
| An odd cycle must be exhibited | Two-coloring with a parent array, then walk the parent chain |
| The graph is directed and the edge directions matter | Not this test; use [topological sort](/algorithms/graphs/topological-sort) or strongly connected components |

The three techniques in the first rows differ in the **form of the constraint**, not in the size of the graph. Two-coloring handles disequality only. Parity DSU handles disequality and equality, including equality chains, because it stores the parity of the path between two elements. 2-SAT handles arbitrary clauses with two literals, which is a strictly more general language: a disequality is the pair of implications $a \to \lnot b$ and $b \to \lnot a$, but a clause such as "$a$ or $b$" cannot be written as a single disequality.

|  | Two-coloring | Parity DSU | 2-SAT |
| --- | --- | --- | --- |
| Constraint form | $x \ne y$ | $x = y$ or $x \ne y$ | $(x \lor y)$ |
| Time | $O(V + E)$ | $O((V + E)\,\alpha(V))$ | $O(V + E)$ |
| Space | $O(V + E)$ | $O(V)$ | $O(V + E)$ |
| Produces | A coloring | A consistency verdict | A truth assignment |
| Processes edges | Batch | Online | Batch |
| Best fit | Pure two-team splits | Equality and disequality mixed | General binary constraints |

Read the table by the constraints first. If every line of the input says "these two must differ", the two-coloring test is the smallest and fastest tool. If some lines say "these two must be equal", a plain coloring cannot express them and the parity DSU is the right frame. If a line can be satisfied by either of two alternatives, neither of the first two columns applies.

## Reference implementations

The six implementations are listed above, with the language and the variant selectors, the recommendation for each, the verification status and a link to the raw source. The manifest publishes one `program` variant in each of the six languages, so the six listings share a single input and output contract.

The contract is:

- The input is $n$ and $m$, followed by $m$ lines $u\ v$ with $0$-based undirected edges.
- A vertex index outside $0 \ldots n-1$ is ignored, and so is an edge whose line is incomplete.
- If the graph is bipartite, the program prints one line with the color of every vertex, $0$ or $1$, separated by spaces, in vertex order.
- If the graph is not bipartite, the program prints the single line `-1`.

The output is canonical, which makes the six versions byte-identical. Each component is seeded at its smallest uncolored vertex with color $0$, and the queue is processed in order, so the colors do not depend on the language.

The implementations differ only in their containers. The C version builds a forward-star adjacency list from two arrays and keeps the queue in a second array. The C++ version uses `std::vector<std::vector<int>>` and a vector queue with a head index. Java uses `ArrayDeque<Integer>` and an `ArrayList` per vertex, with a byte-level scanner because `java.util.Scanner` is too slow for the larger limits. Python uses a list of lists and an explicit head index, so the queue is a plain list with a moving front. Pascal uses a forward-star adjacency list and a queue array with a moving front. JavaScript uses nested arrays and a head index, and a number beyond $2^{53}$ never appears because the only values are vertex indices and colors.

All six are iterative, all six check edges to already-colored vertices, and all six run in $O(V + E)$ time. The manifest records them as unverified until the shared harness compiles and runs them against the fixtures.

## Recursion decision

The reference implementation is iterative. The recursive form of the same traversal is a depth-first search, and it is correct, but it puts one frame on the call stack per vertex along the current path, which can be $V$ frames deep.

The recursive shape is short:

```text
dfs(u, c):
    color[u] = c
    for each neighbor v of u:
        if color[v] == -1:
            dfs(v, 1 - c)
        else if color[v] == c:
            conflict = true
```

The recursion depth is the length of the longest simple path followed by the search, which is at most $V$. The language limits are the usual ones.

| Language   | Default stack              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Use the queue  |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the queue  |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the queue  |
| Pascal     | The operating system stack | Depends on the platform | Use the queue  |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the queue  |

The recommendation is the same in every language: use the queue. The iterative form has no depth limit, it makes the breadth-first distance parity explicit, and it processes the vertices in rings, which is exactly the order that makes the conflict argument easy to see.

## Implementation walkthrough

Three pieces carry the whole test.

The outer loop is what makes the search work on a disconnected graph:

```cpp
for (int s = 0; s < n; ++s) {
    if (color[s] != -1) {
        continue;                 // this component is already colored
    }
    color[s] = 0;
    queue.push_back(s);
    // ... sweep the component
}
```

The seeding of each component at $0$ is a choice, but it is a harmless one: any valid coloring of the component can be flipped as a whole.

The discovery rule is the line that propagates the color:

```cpp
if (color[v] == -1) {
    color[v] = color[u] ^ 1;
    queue.push_back(v);
}
```

The exclusive-or is the shortest way to write "the other color" when the colors are $0$ and $1$. It is not a trick that depends on the graph; it is the definition of a two-coloring.

The conflict check is the line that a traversal of tree edges alone omits:

```cpp
else if (color[v] == color[u]) {
    possible = false;             // the edge closes an odd cycle
}
```

The `else` is doing real work. It is reached only when $v$ already has a color, which means the edge is either a tree edge seen from the child side or a non-tree edge. In the first case the colors necessarily differ, because the child was assigned the opposite color. In the second case the colors may agree, and that is exactly the odd-cycle certificate.

A self-loop is caught by the same check without a special case. If $u = v$, then `color[v] == color[u]` is true the moment the edge is examined, so the program reports that the graph is not bipartite. That is the correct answer: a self-loop is a cycle of length one, which is odd.

Input handling has two details. The vertices are $0$-based in the contract, so an edge that names a vertex outside $0 \ldots n-1$ is ignored rather than allowed to index outside the arrays. And the whole graph must be read before the sweep starts, because the adjacency lists are needed in both directions; a streaming version needs the parity DSU instead.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Checking only the edges of the traversal tree | A triangle is reported as bipartite | Check every edge to an already-colored vertex |
| Forgetting the outer loop over components | A disconnected graph is judged by one component | Seed every uncolored vertex |
| Storing a directed edge in one direction only | A constraint is checked from one side only and can be missed | Add both directions for an undirected edge |
| Applying the test to a directed graph without deciding whether direction matters | The coloring may split the underlying graph but say nothing about the directed question | Decide whether the problem is about the underlying undirected graph or about reachability |
| Applying the test to a graph with a self-loop without expecting a conflict | The program reports non-bipartite, which is correct, but the writer may think it is a bug | A self-loop is an odd cycle; report it |
| Using a recursive traversal on $2 \cdot 10^5$ vertices | The call stack overflows | Use a queue or an explicit stack |
| Assuming the graph is connected | Isolated vertices are left uncolored or wrongly reported | Loop over all vertices |
| Using one label range internally and printing another without converting | The coloring is valid but does not match the required output format | Decide the label range before printing and convert once |
| Using a three-color greedy because "two colors might not be enough" | Extra colors can hide a conflict that two colors would expose | The question is exactly two colors |
| Thinking "no triangle" means bipartite | A five-cycle has no triangle and is not bipartite | The obstruction is any odd cycle, not only a triangle |

### Why this fails: coloring only the tree edges

The mistake that survives review most often is a traversal that colors the vertices it discovers and never checks an edge to a vertex that is already colored. It is invisible in the code, because the code looks like the correct breadth-first search with a color array.

Take the triangle on vertices $0, 1, 2$ with the edges $\{0,1\}$, $\{1,2\}$ and $\{2,0\}$, and run a breadth-first search from $0$.

1. `color[0] = 0`, queue $[0]$.
2. Pop $0$. Neighbors $1$ and $2$ are uncolored, so both receive color $1$. Queue $[1, 2]$.
3. Pop $1$. Neighbor $0$ has color $0$; the edge $0 - 1$ is a tree edge and agrees. Neighbor $2$ has color $1$, but the traversal only colors uncolored vertices and does not compare colors, so it skips the edge.
4. Pop $2$. Neighbor $0$ has color $0$ and agrees; neighbor $1$ has color $1$ and is skipped.
5. The queue is empty. The program prints `0 1 1` and claims the graph is bipartite.

The output is not a proper coloring: the edge $1 - 2$ joins two vertices of color $1$. The breadth-first tree contains only the edges $0 - 1$ and $0 - 2$, and a tree is always bipartite, so the traversal has proved only that the tree is bipartite. The edge $1 - 2$ is the one piece of evidence that the triangle exists, and the traversal threw it away.

The fix is one branch. When the neighbor already has a color, compare it with the current vertex's color and report a conflict if they agree. The corrected run reaches step 3, sees `color[2] == color[1]`, and stops with the correct answer.

The same failure occurs on every odd cycle, not only on a triangle. A five-cycle is discovered as a path of five vertices, colored alternately, and the closing edge joins the two ends, which have the same color. A traversal that ignores that closing edge reports a coloring that is not proper. The error is easy to miss on a five-cycle because the graph has no triangle, so a quick look for "the obvious obstruction" finds nothing. The obstruction is the parity of the cycle, not the presence of a smaller cycle inside it.

There is a second, quieter version of the same mistake: running the test from one component and stopping when the queue empties. On a graph with several components the first one may be bipartite while a later one contains a triangle. The color array makes the first component look correct, and the program prints a split that violates an edge in the unvisited part. The outer loop over all vertices is what prevents this, and it costs only one scan of the vertex array.

## Variants and extensions

- **Depth-first search.** Replace the queue with recursion or an explicit stack. The color propagation and the conflict check are identical, and the bounds do not change.
- **Parity disjoint set union.** Store each vertex with a parity relative to its set representative and merge sets with the xor of the constraint parities. It handles "equal" and "different" constraints together, and it can process edges as they arrive.
- **Odd cycle reconstruction.** Keep a parent array during the search. When a conflict is found on the edge $\{u, v\}$, walk both parent chains to their lowest common ancestor and concatenate the two paths with the edge. The result is an odd cycle, which is a certificate that the graph is not bipartite.
- **Counting the colorings.** A bipartite graph with $c$ connected components has exactly $2^c$ proper two-colorings, because each component can be flipped independently. Isolated vertices count as components, so a graph with no edges and $n$ vertices has $2^n$ colorings.
- **Grid coloring.** A grid with side-adjacency is bipartite, and the coloring is the parity of $r + c$. The traversal is unnecessary unless blocked cells or diagonal edges are added, and diagonal edges create triangles.
- **Bipartite double cover.** Replace every vertex $v$ by two copies $v_0$ and $v_1$, and every edge $\{u, v\}$ by the edges $\{u_0, v_1\}$ and $\{u_1, v_0\}$. The result is always bipartite, and it is the standard way to turn a general graph into a bipartite one.
- **Reduction to 2-SAT.** A disequality $x \ne y$ is the pair of implications $x \to \lnot y$ and $y \to \lnot x$. The implication graph can carry additional clauses, which is the extension to general binary constraints.
- **Matching after the split.** Once the sides are known, a [bipartite matching](/algorithms/graphs/bipartite-matching) can pair vertices across the split. The coloring is usually the preprocessing step, not the final answer.

## Contest strategy

Under contest pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Rewrite every constraint as an edge before writing code. If a constraint says "must differ", add an undirected edge; if it says "must be equal", stop and use a parity DSU instead.
2. Check for self-loops in the input. A pair with the same endpoint is an immediate "impossible", and it is easy to miss when the statement promises distinct endpoints.
3. Build the adjacency list with both directions, even when the input lists each edge once.
4. Loop over every vertex when seeding components, not only vertex $0$.
5. Check the edge to every already-colored neighbor, not only the tree edges. This is the single line that separates a correct solution from a wrong one.
6. Use an iterative traversal for the large limits. The recursive version is shorter and dies on a path of $200\,000$ vertices.
7. Print the labels the statement asks for. A $0$/$1$ coloring is usually accepted as is, but a problem that asks for teams $1$ and $2$ needs the $+1$.
8. If the graph has both equality and disequality constraints, do not force a two-coloring; switch to the parity DSU before spending time debugging.

## Worked problems

### Problem 1: splitting a class into two teams

**Restatement.** There are $n$ pupils and $m$ friendships. Divide the pupils into two teams so that no two friends are on the same team, and print the team of every pupil, or print `IMPOSSIBLE` if no such division exists. Constraints: $1 \le n \le 10^5$, $1 \le m \le 2 \cdot 10^5$.

**Naive baseline.** Try all $2^n$ team assignments and check every friendship. This is $O(2^n m)$ and is hopeless at $n = 10^5$.

**Insight.** A friendship is a disequality constraint. The pupils and friendships form an undirected graph, and a valid division is a proper two-coloring. A conflict on an edge is an odd cycle, and an odd cycle makes the division impossible.

**Derivation.** Build the adjacency list, color every component with a breadth-first search, and print `1` for color $0$ and `2` for color $1$. If any edge joins two vertices of the same color, print `IMPOSSIBLE`.

**Correctness.** The theorem above says that the search reports a conflict exactly when the graph is not bipartite. When there is no conflict, the color array is a proper two-coloring, so no friendship joins two members of the same team. When there is a conflict, the conflicting edge closes an odd cycle, and no assignment can satisfy all friendships on that cycle.

**Complexity.** $O(n + m)$ time and $O(n + m)$ space for the adjacency list, the color array and the queue.

**Common wrong approach.** Running the search only from pupil $1$. A class can have several disconnected friendship groups, and each group has to be colored; a single search leaves the other groups uncolored and their conflicts undetected.

### Problem 2: orienting the edges of a graph

**Restatement.** A connected undirected graph has $n$ vertices and $m$ edges. Direct every edge so that the resulting directed graph has no directed path of length two or more. Print `NO` if this is impossible; otherwise print `YES` and a string of $m$ bits, where bit $i$ is `0` if edge $i$ is directed from its first endpoint to its second and `1` otherwise. Constraints: $2 \le n \le 2 \cdot 10^5$, $n - 1 \le m \le 2 \cdot 10^5$.

**Naive baseline.** Try all $2^m$ orientations and test each one for a directed path of length two. This is exponential and cannot handle $m = 2 \cdot 10^5$.

**Insight.** A directed path of length two exists exactly when some vertex has one incoming edge and one outgoing edge. So every vertex must be a **source** (all incident edges outgoing) or a **sink** (all incident edges incoming). Two adjacent vertices cannot both be sources, because the edge between them would point out of both, and they cannot both be sinks, because it would point into both. Adjacent vertices must therefore be of opposite kinds, which is a two-coloring of the underlying graph.

**Derivation.** Run the two-coloring test on the underlying undirected graph. If it fails, print `NO`. Otherwise orient every edge from the color-$0$ side to the color-$1$ side, and print `0` when the input order of the edge agrees with that orientation and `1` when it does not.

**Correctness.** If the orientation exists, every vertex is a source or a sink, adjacent vertices have opposite kinds, and the two-coloring test succeeds. If the test succeeds, every vertex on side $0$ has only outgoing edges and every vertex on side $1$ has only incoming edges, so no directed path can leave a side-$1$ vertex; in particular no directed path of length two exists.

**Complexity.** $O(n + m)$ time and $O(n + m)$ space. The output string has $m$ characters.

**Common wrong approach.** Orienting each edge by the order in which it appears in the input. That produces a valid answer only by accident; the direction has to be derived from the two-coloring, and the printed bit has to be compared with the input order.

### Problem 3: constraints between values

**Restatement.** Given two sequences $A$ and $B$ of length $m$ over the values $1 \ldots n$, decide whether there is a binary sequence $X$ of length $n$ with $X_{A_i} \ne X_{B_i}$ for every $i$. Print `Yes` or `No`. Constraints: $1 \le n, m \le 2 \cdot 10^5$.

**Naive baseline.** Try every binary sequence $X$, which is $2^n$ candidates, and check all $m$ constraints for each one.

**Insight.** Each index is a vertex, and each pair $(A_i, B_i)$ is an undirected edge that forbids equal colors. The question is exactly whether this graph is bipartite. A pair with $A_i = B_i$ is a self-loop and is an immediate `No`, even though the statement may not say that the two values are distinct.

**Derivation.** Build the graph on the values $1 \ldots n$, run the two-coloring test, and print `Yes` if no conflict is found and `No` otherwise. The actual coloring is not required by the output, but keeping it is what makes the conflict detectable.

**Correctness.** A binary sequence $X$ satisfying every constraint is a proper two-coloring, and every proper two-coloring gives such a sequence. The test accepts exactly the bipartite graphs, so the output matches the existence of $X$. A self-loop is a cycle of length one, so it is rejected by the conflict check.

**Complexity.** $O(n + m)$ time and $O(n + m)$ space. The values are $1$-based in the statement, so the implementation subtracts one from each endpoint before storing it.

**Common wrong approach.** Treating the pairs as directed and adding only $A_i \to B_i$. The constraint $X_{A_i} \ne X_{B_i}$ is symmetric, so both directions are needed; with one direction, a cycle can be missed entirely. The second common mistake is forgetting the self-loop case, which is the one input that a graph without loops never produces.

## Practice progression

1. **Recognition.** Given a statement, decide whether the constraints have the form "these two differ". Check for equality constraints, self-loops and more than two labels before committing to the technique.
2. **Direct application.** Implement the breadth-first coloring over an adjacency list, with the conflict check, and test it on a path, an even cycle, a triangle and a disconnected graph.
3. **Adaptation.** Handle $1$-based input, print team numbers instead of colors, process multiple test cases, and reconstruct an odd cycle from the parent array when a conflict is found.
4. **Combination.** Use the coloring as the first step of a bipartite matching, of an orientation problem, or of a parity DSU that also has equality constraints.
5. **Challenge.** Process $2 \cdot 10^5$ vertices and edges with an iterative traversal, fast input in Java and Python, and an output format that must match byte for byte across six languages.
6. **Transfer.** Use the same parity argument on a signed graph, on the bipartite double cover, on the two-color constraint of a 2-SAT instance, or on the checkerboard coloring of a grid.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the two equivalent definitions of a bipartite graph, and why are they equivalent? (Formal model, Correctness proof)
2. Why must an edge to an already-colored vertex be checked, and what does a conflict prove? (Key insight, Common mistakes)
3. What does the algorithm output for the triangle $0 - 1 - 2 - 0$, and what would a tree-only traversal output? (Common mistakes)
4. Why is it safe to seed every component at color $0$? (Algorithm derivation)
5. Why is the running time $O(V + E)$ and not $O(V \log V)$ or $O(V E)$? (Complexity analysis)
6. Why must the adjacency list contain both directions of every undirected edge? (Implementation walkthrough, Common mistakes)
7. When does the statement call for a parity DSU instead of a plain two-coloring? (Algorithm selection)
8. How many proper two-colorings does a bipartite graph with $c$ connected components have? (Variants and extensions)
9. Why is a recursive traversal risky at $V = 2 \cdot 10^5$, and what replaces it? (Recursion decision)
10. What is the smallest counterexample to the claim "no triangle means bipartite"? (Common mistakes)
11. How does the algorithm change when the input contains a self-loop? (Implementation walkthrough, Worked problems)
12. What does the orientation problem add to the two-coloring test, and why does the coloring solve it? (Worked problems)

## Further reading

- The traversal that underlies this test, with its distance array and queue, is [breadth-first search](/algorithms/graphs/bfs).
- The same traversal with a stack instead of a queue, and the back-edge check that comes with it, is [depth-first search](/algorithms/graphs/dfs).
- The structure that handles "equal" and "different" constraints together is [disjoint set union](/algorithms/graphs/dsu), and its parity variant is described there.
- Once the two sides are known, the natural next question is [bipartite matching](/algorithms/graphs/bipartite-matching), which relies on the split.
- The ordering of a directed acyclic graph, which is the right frame for a graph with directions that matter, is [topological sort](/algorithms/graphs/topological-sort).
- The implication graph of a 2-SAT instance is analyzed with [strongly connected components](/algorithms/graphs/strongly-connected-components).
- The adjacency list and the adjacency matrix, and the cost of each, are covered in [graph representation](/algorithms/graphs/representation).
- The modeling step from a word problem to a graph is treated in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
- A flow formulation of the pairing problem that starts from a bipartite split is [minimum cut](/algorithms/graphs/minimum-cut).
