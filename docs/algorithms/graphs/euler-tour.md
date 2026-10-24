---
id: graphs.euler-tour
title: Euler tours in graphs
summary: A walk that uses every edge of a graph exactly once, found by Hierholzer's algorithm, together with the degree conditions that decide whether such a walk exists at all.
division: [gold, platinum]
subjects: [graphs]
level: advanced
importance: advanced-technique
keywords:
    [
        euler tour,
        eulerian graph,
        eulerian trail,
        eulerian circuit,
        hierholzer,
        undirected traversal,
        route inspection,
        chinese postman,
    ]
prerequisites:
    required: [graphs.representation, graphs.dfs]
    recommended: [graphs.bfs, graphs.dsu]
complexity:
    time: "O(V + E)"
    space: "O(V) beyond the adjacency list and the output"
assumptions:
    - The graph is undirected, and every edge must be used exactly once.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find a walk that uses every edge of an undirected graph exactly once |
| **Time** | $O(V + E)$ |
| **Auxiliary space** | $O(V + E)$ for the adjacency list and the stack |
| **Requires** | An undirected graph, and the right degree condition |
| **Fails when** | The walk is built greedily instead of being spliced |
| **Primary technique** | Hierholzer's algorithm, which is a depth-first search with a stack of vertices and a list of output |
| **Related** | The Chinese postman problem, cycle decomposition, the planarity formula |

An Euler tour is a walk that uses every edge of a graph exactly once. Whether one exists is decided by the degrees alone, and finding it takes one linear pass.

## Problem motivation

A postal inspector has to walk every road of a district exactly once and return to the depot. The roads form an undirected graph with $n$ junctions and $m$ roads, and the inspector may not retrace a road, because retracing one would mean inspecting it twice.

The constraints are what make the problem a graph problem:

- $1 \le n \le 200\,000$ junctions and $0 \le m \le 400\,000$ roads.
- Every road must be walked **exactly once**.
- The walk must **return** to the starting junction.

A walk that uses every edge exactly once is called an **Euler trail**, and one that also returns to its start is called an **Euler circuit** or an Euler tour. The first thing the algorithm must decide is whether such a walk exists at all, and that decision does not require any search.

The second thing the problem needs is the **conditions** for existence, stated as a theorem rather than discovered by trial and error. The conditions are about the degrees of the vertices, and they are the same conditions that make the algorithm work.

The third thing is that a naive greedy walk does not work. It gets stuck, and the repair is not to be careful but to change the shape of the algorithm: the walk must be built on a stack so that unfinished loops can be spliced into the finished path.

One naming warning before anything else. "Euler tour" is used in two different senses in computer science. In a general graph it means what this article is about. In a **tree**, an Euler tour means a walk that lists each edge twice and flattens the tree into an array, and it is a completely different technique with a completely different purpose. That second technique is the subject of [the Euler tour for trees](/algorithms/trees/euler-tour).

## Recognition patterns

An Euler tour is the right tool when all of the following hold.

- The problem asks for a walk that **uses every edge exactly once**.
- The graph is **undirected**, or the statement gives an explicit direction for every edge.
- The walk must **start and end at the same vertex**, or the two endpoints are determined by the degree condition.
- The answer is a **sequence of vertices**, not a count.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The graph is undirected | Rules in the degree condition; a directed graph needs a flow computation |
| Every vertex has even degree | An Euler circuit exists |
| Exactly two vertices have odd degree | An Euler trail exists, from one odd vertex to the other |
| Four or more odd-degree vertices | No Euler trail exists at all |
| The graph is disconnected | Rules out any tour, unless the components are joined by edges the statement allows |
| The edges are **weighted** and the question is the shortest such walk | Rules out this article; that is the Chinese postman problem |
| The walk may use an edge **more than once** | Rules out this article; that is a route inspection problem with a flow solution |
| $m \ge 10^7$ | The adjacency list must be built with care, but the algorithm is still linear |

Two phrases in a statement are reliable signals. "Inspect every road exactly once", "walk every edge once", and "return to the depot" all point here. "The shortest such walk" points away, because it adds an optimization that this article does not solve.

<Synonyms terms="euler tour, eulerian graph, eulerian trail, eulerian path, eulerian circuit, hierholzer's algorithm, route inspection, postman tour, edge cover walk" />

## Naive approach

The baseline is a greedy walk: stand at a vertex, take any unused incident edge, mark it used, and repeat until no unused edge is left.

```text
current = start
tour = []
while current has an unused incident edge:
    take one such edge, mark it used
    tour.append(current)
    current = the other endpoint
```

This is the right instinct and the wrong algorithm. It uses every edge at most once, but it can stop while edges remain, and it never revisits a vertex that it has already left, which is exactly what a closed tour requires.

The second baseline is to search for cycles and splice them together by hand. Take any cycle, remove its edges, look for another cycle in what remains, and attach it. This is correct in spirit and painful in practice, because "remove its edges and look for another cycle" needs a fresh search each time and the splicing bookkeeping is easy to get wrong.

The third baseline is a walk that allows repeated edges, that is, the Chinese postman problem solved by brute force: duplicate edges until the degrees are even. That is a minimum-cost matching problem, not a walk construction, and it is the subject of a later section.

## Key insight

The insight is that the degree condition decides everything, and that the algorithm should be built so that a premature stop is impossible.

### The degree condition

Every time the walk enters a vertex it must also leave it, so the edges at a vertex are consumed in pairs, except at the two endpoints of an open trail. This gives the necessary condition: every vertex has even degree for a closed tour, and exactly two vertices have odd degree for an open trail.

The sufficiency is the content of Hierholzer's algorithm, and it is what makes the condition a theorem rather than a guess.

### Why the greedy walk gets stuck

In a graph where every vertex has even degree, a greedy walk can only ever get stuck at the **starting** vertex. At any other vertex, arriving uses one edge and the even degree guarantees at least one edge remains. So the greedy walk ends at the start, having used some of its edges, and it may have used all of them while leaving a cycle somewhere else untouched.

The repair is to change the shape of the algorithm. Instead of writing the walk down as it goes, keep the **partial walk on a stack** and write down the vertices only when they are finished. A vertex is finished when it has no unused edge left. Then, when the stack finally empties, the output is the reverse of the order in which the vertices were finished, and that output is a closed walk that uses every edge.

This is the whole idea: the stack remembers the unfinished part of the walk, so a loop that was entered and left can be spliced into the answer later.

### The splicing picture

Think of the greedy walk as producing a sequence of closed loops that share vertices. The stack-based algorithm walks one loop, returns to where it started, and then continues from there if there are unused edges. The vertices at which the loops join are exactly the places where the walk arrives at a vertex that already has unused edges.

The output is built in reverse because a vertex is only written down once the walk can no longer continue from it.

## Formal model

Let $G = (V, E)$ be an undirected graph.

::: math definition Definition
An **Euler trail** is a walk that uses every edge of $G$ exactly once. It is a **circuit** when it also ends at the vertex where it started. The graph $G$ is **Eulerian** when it has an Euler circuit, and **semi-Eulerian** when it has an Euler trail that is not a circuit.
:::

::: math definition Definition
Write $G'$ for the graph obtained from $G$ by deleting every vertex of degree zero. Then $G$ has an Euler circuit if and only if $G'$ is connected and every vertex of $G'$ has even degree. It has an Euler trail if and only if $G'$ is connected and exactly zero or two vertices of $G'$ have odd degree.
:::

::: math definition Definition
The **degree** of a vertex $v$ is the number of edges incident to it, counted with multiplicity, so a loop contributes two.
:::

::: math lemma Lemma
If a graph has an Euler circuit, then every vertex has even degree. If it has an Euler trail that is not a circuit, then exactly two vertices have odd degree, and they are the two endpoints of the trail.
:::

::: math lemma Lemma
In a graph in which every vertex has even degree, a walk that uses each edge at most once and never repeats an edge can only stop at the vertex where it started.
:::

::: math lemma Lemma
Let $G$ be connected with at least one edge, and let $T$ be the set of vertices of odd degree. Then $G$ has an Euler circuit if $T$ is empty, and an Euler trail from one vertex of $T$ to the other if $|T| = 2$. In both cases the trail exists.
:::

## Algorithm derivation

The state is an adjacency list in which edges can be removed, a stack of vertices, and an output list.

```text
for each vertex v:
    if v has an unused incident edge:
        push v onto the stack
        while the stack is not empty:
            v = the top of the stack
            if v has an unused incident edge {v, u}:
                remove {v, u} from the graph
                push u onto the stack
            else:
                pop v off the stack
                append v to the output
reverse the output
```

The three lines of the inner loop are the whole algorithm.

- Taking an edge and pushing its other endpoint extends the current partial walk.
- The **else** branch is the splice: the vertex has no unused edge, so the walk cannot continue from it, and the vertex is written down as finished.
- The reversal at the end puts the vertices back in the order they were walked.

The update rule is correct because the stack always holds a walk from the starting vertex to the top of the stack. Pushing an edge extends that walk. Popping a vertex whose edges are exhausted finalizes it. When the stack empties, the finalized vertices, read in reverse, form a closed walk.

::: math invariant Invariant
At every moment, the stack holds a sequence of vertices $v_0, v_1, \ldots, v_k$ such that $v_0$ is the starting vertex and the vertices $v_{i-1}$ and $v_i$ are joined by an edge that has been removed from the graph and not yet written to the output. The edges that have been removed but not yet output form a trail from $v_0$ to $v_k$.
:::

::: math invariant Invariant
Every edge removed from the graph is written to the output exactly once, and every edge written to the output has been removed from the graph. No edge is used twice.
:::

## Step-by-step execution

Take the graph on vertices $v, a, b, c, d$ with the six edges $v-a$, $a-b$, $b-v$, $a-c$, $c-d$, $d-a$. It is two triangles sharing the vertex $a$: the triangle $v, a, b$ and the triangle $a, c, d$. Every vertex has even degree: $v$, $b$, $c$ and $d$ have degree two, and $a$ has degree four.

The adjacency lists, in the order the edges were read, are $v: (a, b)$, $a: (v, b, c, d)$, $b: (a, v)$, $c: (a, d)$, $d: (c, a)$.

Start at $v$.

1. The stack is empty and $v$ has unused edges, so push $v$. The stack is $[v]$.
2. The top is $v$, which has an unused edge $v-a$. Remove $v-a$ and push $a$. The stack is $[v, a]$.
3. The top is $a$, which has an unused edge $a-b$ (the edge $a-v$ has been removed). Remove $a-b$ and push $b$. The stack is $[v, a, b]$.
4. The top is $b$, which has an unused edge $b-v$. Remove $b-v$ and push $v$. The stack is $[v, a, b, v]$.
5. The top is $v$, which has no unused edge left. Pop it and append it to the output. The stack is $[v, a, b]$ and the output is $[v]$.
6. The top is $b$, which has no unused edge left. Pop it and append it. The stack is $[v, a]$ and the output is $[v, b]$.
7. The top is $a$, which still has the unused edges $a-c$, $c-d$ and $d-a$. Remove $a-c$ and push $c$. The stack is $[v, a, c]$.
8. The top is $c$, which has an unused edge $c-d$. Remove it and push $d$. The stack is $[v, a, c, d]$.
9. The top is $d$, which has an unused edge $d-a$. Remove it and push $a$. The stack is $[v, a, c, d, a]$.
10. The top is $a$, which has no unused edge left. Pop it and append it. The stack is $[v, a, c, d]$ and the output is $[v, b, a]$.
11. The top is $d$, which has no unused edge left. Pop it and append it. The stack is $[v, a, c]$ and the output is $[v, b, a, d]$.
12. The top is $c$, which has no unused edge left. Pop it and append it. The stack is $[v, a]$ and the output is $[v, b, a, d, c]$.
13. The top is $a$, which has no unused edge left. Pop it and append it. The stack is $[v]$ and the output is $[v, b, a, d, c, a]$.
14. The top is $v$, which has no unused edge left. Pop it and append it. The stack is empty and the output is $[v, b, a, d, c, a, v]$.

The output is $[v, b, a, d, c, a, v]$, and reversing it gives the tour $v, a, c, d, a, b, v$, which uses the six edges exactly once and returns to $v$.

Step 7 is the splice in action. The walk had already returned to the neighborhood of $a$, and the second triangle was still untouched. The stack remembered the unfinished walk, so the algorithm could pick the second triangle up where the first one left off.

## Correctness proof

::: math theorem Theorem
Hierholzer's algorithm returns an Euler circuit of the graph it is run on, and the degree condition characterizes exactly when such a circuit or trail exists.
:::

::: math proof Proof
First, the existence condition. If a graph has an Euler circuit, then at every vertex the circuit arrives as often as it leaves, so the degree is even. If it has an open Euler trail, the same argument applies to every vertex except the two endpoints, which have odd degree. This proves necessity.

For sufficiency, let $G$ be connected with all degrees even, and let $T$ be any edge of $G$. Start a walk at one endpoint of $T$ and follow unused edges as long as possible. By the lemma, the walk can only stop at the vertex where it started, so it produces a closed walk $C$ using each edge at most once. If $C$ used every edge of $G$, it is an Euler circuit. Otherwise, remove the edges of $C$ from $G$. The remaining graph has all degrees even, since removing a closed walk removes an even number of edges at every vertex, and it has at least one edge. Choose a vertex $w$ of $C$ that is incident to a remaining edge; such a vertex exists because the remaining graph is nonempty and $G$ is connected. Run the same procedure from $w$ on the remaining graph, producing a second closed walk $C'$, and splice $C'$ into $C$ at $w$. Repeat until every edge has been used. The result is a closed walk using every edge exactly once, which is an Euler circuit. The construction is exactly what Hierholzer's algorithm performs, with the stack standing in for the recursive splicing. $\square$
:::

::: math proof Proof
Hierholzer's algorithm uses every edge of the graph exactly once and produces a closed walk.
:::

::: math proof Proof
Every edge is removed from the graph at the moment it is used, and an edge that has been removed is never removed again, so no edge is used twice.

Now consider the output. The stack always holds a trail from the starting vertex to the top of the stack, by the invariant: pushing a vertex extends the trail by one edge, and popping removes the last vertex of the trail without breaking the rest.

When the algorithm pops a vertex, that vertex has no unused incident edge. Every vertex is pushed exactly once per edge that enters it, so the number of pushes is one more than the number of edges used, and the number of pops equals the number of pushes. The output therefore has one more entry than the number of edges used, which is the length of a closed walk over those edges.

It remains to show that every edge is used. Suppose the algorithm ends with some edge unused. Consider the unused edges alone. Every vertex has even degree in the remaining graph, because the used edges form closed walks and each closed walk removes an even number of edges at every vertex it visits. The remaining graph is therefore nonempty and has a vertex of positive degree, say $w$. The vertex $w$ is incident to a used edge as well, because the graph is connected, and $w$ was popped at some point, which means that at the moment $w$ was popped it had no unused incident edge. All the edges incident to $w$ that were still unused at that moment are still unused now, since edges are only removed. So $w$ was popped with an unused incident edge, a contradiction.

Hence every edge is used, and the output reversed is a closed walk using every edge exactly once, which is an Euler circuit. $\square$
:::

::: math lemma Lemma
If a graph has exactly two vertices of odd degree, say $s$ and $t$, then it has an Euler trail from $s$ to $t$, and Hierholzer's algorithm started at $s$ produces one.
:::

::: math proof Proof
Add a new vertex $w$ and a new edge $\{w, s\}$. Then $w$ has degree one and $s$ now has even degree, while $t$ still has odd degree. Adding a second edge $\{w, t\}$ makes every degree even, and the resulting graph has an Euler circuit by the theorem. Removing the two new edges from that circuit leaves an Euler trail of the original graph from $s$ to $t$. $\square$
:::

## Complexity analysis

**Time: $O(V + E)$.** Each edge is removed from the graph exactly once, and each removal costs one stack push. Each vertex is popped once per push, and there is one push per edge plus one per starting vertex. The outer loop over the vertices is $O(V)$.

**Auxiliary space: $O(V + E)$** for the adjacency list, plus $O(V)$ for the stack and $O(V + E)$ for the output, which has one entry per edge.

::: math complexity Complexity
Euler circuit of an undirected graph with $V$ vertices and $E$ edges: time $O(V + E)$, auxiliary space $O(V)$ beyond the adjacency list and the output. The existence check costs $O(V + E)$ as well, by counting the degrees and running a traversal.
:::

The existence check is worth putting in the same bound. Counting the degrees is $O(V + E)$ over the adjacency list, and connectivity is one more traversal. A full implementation therefore checks the condition first and then either reports that no tour exists or constructs one, in $O(V + E)$ time either way.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| A walk using every edge exactly once | Hierholzer's algorithm |
| Whether such a walk exists | The degree condition and a connectivity check |
| A cycle that contains every edge | The same algorithm, started at any vertex |
| Decomposing a graph into edge-disjoint cycles | Hierholzer's algorithm applied to each cycle in turn |
| The shortest such walk, with weighted edges | The Chinese postman problem, with a minimum-weight perfect matching |
| The shortest such walk, in a directed graph | The Chinese postman problem, with a minimum-cost flow |
| A walk covering every edge at least once, in an undirected graph | The Chinese postman problem |
| An Euler circuit of a directed graph | The same algorithm, with the in-degree and out-degree condition |
| How many Euler circuits a graph has | The BEST theorem and the matrix-tree theorem |
| A walk using every edge at most once, of any length | A matching problem, solved with a flow |

The last two rows are the ones that most often turn out to be the actual question. "Inspect every road exactly once" is the pure Euler tour, but "inspect every road at least once" is the postman problem, and the difference is one word.

## Recursion decision

Hierholzer's algorithm is naturally recursive, because the walk into an unfinished loop and the walk back out of it nest. The iterative form replaces the call stack with an explicit stack of vertices, which is the same structure with a different allocation.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $E$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
A single cycle on $10^6$ vertices, that is, the edges $\{i, i+1\}$ for $0 \le i < 10^6 - 1$ together with the edge $\{10^6 - 1, 0\}$. The graph is legal, every degree is two, and the Euler circuit is the cycle itself. The recursive form makes one nested call per edge, so in C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack is exhausted after about $130\,000$ frames, and the program dies with a segmentation fault after inspecting $13\%$ of the roads. The iterative form finishes normally.
:::

The iterative form is only slightly longer than the recursive one, and it has a further advantage: the stack of the iterative form is exactly the stack that the recursive form would use, so the two produce the same output, and the iterative one can be debugged with a printed stack.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Building the walk greedily and appending as it goes | The walk stops early and the answer is a prefix | Use a stack and append only on pop |
| Forgetting to reverse the output | The tour is written backwards and is not a walk | Reverse the output at the end |
| Ignoring isolated vertices when checking the condition | A graph with a stray isolated vertex is wrongly rejected | Delete the degree-zero vertices before the connectivity check |
| Checking only the degrees and not the connectivity | A graph of two disjoint cycles is wrongly accepted | Run the traversal as well |
| Using the wrong condition for a directed graph | The answer is wrong | A directed graph needs equal in-degree and out-degree at every vertex |
| Not removing the edge from the graph | The same edge is used twice | Remove the edge when it is taken |
| Running the algorithm from a vertex of degree zero | The output is empty | Start from a vertex with an unused edge |
| Assuming an Euler trail always exists | The algorithm loops or returns nonsense | Check the number of odd-degree vertices first |
| Confusing Euler's formula with this | The wrong theorem is cited | Euler's formula is $V - E + F = 2$ for planar graphs |

### Why this fails: the greedy walk that stops with roads left

The mistake that survives review most often is the greedy walk: take any unused incident edge, move along it, repeat, and stop when there is none.

The smallest counterexample is two triangles sharing a single vertex, started from a vertex of one of the triangles that is not the shared one.

Take the vertices $v, a, b, c, d$ with the edges $v-a$, $a-b$, $b-v$, $a-c$, $c-d$, $d-a$. The triangles are $v, a, b$ and $a, c, d$, and they share the vertex $a$. Every degree is even: $a$ has degree four and the other four vertices have degree two, so an Euler circuit exists.

Start the greedy walk at $v$ and always take the first unused incident edge.

1. At $v$, take $v-a$.
2. At $a$, the edges $a-v$ is used, so take $a-b$.
3. At $b$, the edge $b-a$ is used, so take $b-v$.
4. Back at $v$, both of its edges are used. The walk stops.

The walk has used three of the six edges, and the triangle $a, c, d$ is entirely untouched. The greedy walk reports a tour of length four that visits five vertices and returns to the start, which looks like a perfectly valid closed walk, and it is not a tour at all.

The correct Euler circuit is $v, a, c, d, a, b, v$, which uses all six edges.

Five vertices and six edges is the smallest counterexample, because two cycles are needed before anything can be left over, and two triangles sharing a vertex is the smallest way to have two cycles that share an edge structure while still being reachable in one walk.

The reason the greedy walk fails is that it has no way to return to a place it has already been. The stack version does: at step 7 above, the algorithm pops back to $a$ and finds that $a$ still has unused edges, so it continues there. The stack is not a convenience; it is the mechanism that makes the splicing possible.

### Why this fails: the open trail that is reported as a closed one

The second mistake is using the circuit condition when the graph has two odd-degree vertices, and reporting the walk as a closed tour.

The smallest counterexample is a single edge between two vertices $a$ and $b$. The graph has two odd-degree vertices, so the only Euler trail is $a, b$, which starts at one odd vertex and ends at the other.

An implementation that accepts the graph because the number of odd-degree vertices is two, and then reports a **closed** circuit, produces a claim that is false on this graph. The walk $a, b$ starts at one vertex and ends at the other, so it is not a circuit, and no closed tour using the single edge exists at all.

The fix is not a patch. The start vertex of an open trail must be one of the two odd-degree vertices, and the answer must report both endpoints rather than claiming the walk closes.

### Why this fails: the two cycles that are not one tour

The third mistake is checking the degrees but forgetting the connectivity.

Take two disjoint triangles, on the vertices $\{a, b, c\}$ and $\{d, e, f\}$. Every degree is two, so the degree condition holds, but there is no walk that uses all six edges, because the walk can never get from the first triangle to the second.

The failure is invisible in the output of a naive implementation: the algorithm produces a perfectly good Euler circuit of the first triangle and stops, having used three of the six edges, and reports success.

The fix is one traversal: check that the graph with the degree-zero vertices removed is connected, before believing the degree condition.

## Variants and extensions

- **The Chinese postman problem.** The shortest closed walk that covers every edge at least once, in an undirected weighted graph. The answer is the sum of all edge weights plus the cost of a minimum-weight perfect matching on the odd-degree vertices, and the matching is found with a blossom algorithm.
- **The directed Chinese postman problem.** The same question in a directed graph, where the repair is a minimum-cost flow rather than a matching.
- **The route inspection problem.** A generalization where a subset of the edges must be covered and the rest are optional.
- **Counting Euler circuits.** The BEST theorem, combined with the matrix-tree theorem, gives the number of Euler circuits of a directed graph from the degrees and a spanning tree count.
- **Cycle decomposition.** A graph in which every edge lies on exactly one cycle decomposes into edge-disjoint cycles, and each cycle is found by running the algorithm on the graph that remains.
- **Euler circuits in a directed graph.** The condition becomes: the graph is connected when directions are ignored, and every vertex has equal in-degree and out-degree. The algorithm is otherwise unchanged.
- **The rural postman problem.** Covering a required subset of the edges, which is much harder and is often solved with a matching plus a dynamic program.
- **Euler's formula.** A different theorem entirely: for a connected planar graph, $V - E + F = 2$. It is sometimes called Euler's formula and is unrelated to the Euler tour, and confusing the two is a common mistake in writing.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Check the condition before writing the algorithm. Count the degrees, and if the number of odd-degree vertices is not zero or two, report that no tour exists.
2. Check the connectivity as well, on the graph with the degree-zero vertices removed.
3. Decide the start vertex: for a circuit, any vertex with an unused edge; for an open trail, one of the two odd-degree vertices.
4. Use a stack, and write the output on pop, not on push.
5. Reverse the output at the end.
6. Remove the edge from the graph when it is taken, so that no edge can be used twice.
7. Test four shapes by hand: a single edge, a triangle, two triangles sharing a vertex, and two disjoint triangles. The third catches the greedy mistake, and the fourth catches the missing connectivity check.

## Worked problems

### Problem 1: the inspection route

**Restatement.** An undirected graph has $n$ junctions and $m$ roads. Each road must be inspected exactly once, and the inspection must return to the starting junction. Report such a route, or report that none exists. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$.

**Naive baseline.** Walk greedily, taking any unused road, and stop when stuck.

**Insight.** The degree condition decides whether a route exists, and the stack-based walk splices the unfinished loops so that it can never stop early.

**Derivation.** Count the degrees. If some vertex has odd degree, the number of odd vertices must be exactly two, and the trail runs between them. Check connectivity on the graph with the degree-zero vertices removed. Then run Hierholzer's algorithm and reverse the output.

**Correctness.** The existence proof shows that the conditions are necessary and sufficient. The algorithm proof shows that every edge is used exactly once and that the output reversed is a closed walk.

**Complexity.** $O(V + E)$ time and $O(V)$ auxiliary space beyond the adjacency list and the output.

**Common wrong approach.** The greedy walk. On two triangles sharing a vertex it stops after three of the six roads.

### Problem 2: the directed inspection route

**Restatement.** The same problem, but every road has a fixed direction and the inspection must follow the directions.

**Naive baseline.** The same greedy walk.

**Insight.** The degree condition has a different form. Every time the walk arrives at a vertex it must also leave it, so the in-degree and the out-degree of every vertex must be equal, and the graph must be connected when directions are ignored.

**Derivation.** Check that the in-degree equals the out-degree at every vertex and that the underlying undirected graph is connected. Then run the same algorithm, treating each directed edge as an edge from its tail to its head.

**Correctness.** The degree argument is unchanged: arrivals and departures pair up at every vertex, so the two degrees must be equal. The sufficiency is the same construction, because reversing a directed cycle is a directed cycle and the splicing works the same way.

**Complexity.** $O(V + E)$ time.

**Common wrong approach.** Treating each directed road as an undirected edge, which is what happens when the edge list is built without recording the directions. The algorithm then reports a route that drives the wrong way down a one-way road.

### Problem 3: the shortest inspection tour

**Restatement.** The roads have lengths, and the inspection must cover every road **at least** once, returning to the depot. Report the minimum total length.

**Naive baseline.** Walk the Euler circuit when one exists, and otherwise guess which roads to traverse twice.

**Insight.** When a circuit exists, the answer is the sum of the lengths. When it does not, the odd-degree vertices must have their parity repaired, and the cheapest repair is a minimum-weight perfect matching on them.

**Derivation.** Sum the lengths of all the roads. Collect the vertices of odd degree. Find a minimum-weight perfect matching of those vertices, where the weight of a pair is the length of a shortest path between them, computed with a multi-source shortest path search from each odd vertex. Add the matching weight to the sum.

**Correctness.** Every closed walk covers each edge an even number of times, so the extra traversals must make every degree even. The extra traversals form a subgraph in which the odd-degree vertices are exactly the ones that need repair, and such a subgraph contains a perfect matching of them; the cheapest possible is found by the matching, and the shortest paths realize it. The theorem in the article above shows the repaired graph has an Euler circuit.

**Complexity.** The shortest paths cost $O(V + E)$ per odd vertex with a Dijkstra search, and the matching costs a blossom algorithm, which is $O(k^3)$ for $k$ odd vertices.

**Common wrong approach.** Doubling every edge on a minimum spanning tree. That repairs the parity only when the graph is a tree, and for a general graph it is far from the cheapest repair.

## Practice progression

1. **Recognition.** Given a statement, decide whether an Euler tour applies. Look for "every edge exactly once", "every road", and "return to the start", and check whether the graph is undirected.
2. **Direct application.** Implement the existence check and Hierholzer's algorithm, and verify the tour on a small graph by checking that every edge appears exactly once and the tour is closed.
3. **Adaptation.** Handle the open trail with two odd-degree vertices, the directed version, and the decomposition of a graph into edge-disjoint cycles.
4. **Combination.** Use the tour as the backbone of a larger problem: the postman route, the cycle decomposition of a plan, or the parity repair of a delivery network.
5. **Challenge.** Solve a problem with $10^7$ edges where the adjacency list must be built with an edge array and the edge removal done with a used flag rather than by erasing from a list.
6. **Transfer.** Use the same idea elsewhere: the route that covers every vertex rather than every edge, the Chinese postman with a required subset of edges, and the flow-based repair of a directed postman instance.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the two existence conditions, and say why isolated vertices are ignored. (Formal model)
2. Why does every vertex have even degree in a graph with an Euler circuit? (Formal model)
3. Why can a greedy walk only get stuck at its starting vertex? (Key insight)
4. What does the stack hold, and what does pushing and popping mean? (Algorithm derivation)
5. Why is the output reversed at the end? (Algorithm derivation)
6. What is the smallest graph on which the greedy walk stops early, and what does it report? (Why this fails)
7. What must be checked besides the degrees, and why? (Why this fails)
8. How does the condition change for a directed graph? (Variants and extensions)
9. What are the time and space bounds, and where does the time go? (Complexity analysis)
10. How does the Chinese postman problem repair the degrees? (Variants and extensions)
11. When is recursion safe here, and what is the failure mode? (Recursion decision)
12. Why is the Euler tour of a tree a different technique from this one? (Problem motivation)

## Further reading

- The traversal this algorithm resembles is [depth-first search](/algorithms/graphs/dfs), and the article there describes Hierholzer's algorithm as a depth-first search with one extra rule.
- The tree version of the name, which flattens a tree into an array rather than walking a graph, is [the Euler tour for trees](/algorithms/trees/euler-tour).
- The [graph representation](/algorithms/graphs/representation) article covers the adjacency list and how to remove an edge from it efficiently.
- The cheapest repair of the odd degrees, and the flow-based version for directed graphs, are the subject of [minimum cut](/algorithms/graphs/minimum-cut).
- The call-stack limit that decides between the recursive and the iterative form is covered in [recursion](/algorithms/foundations/recursion).
