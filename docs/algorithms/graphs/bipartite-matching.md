---
id: graphs.bipartite-matching
title: Bipartite matching
summary: The largest set of edges of a bipartite graph that share no endpoints, found by flipping edges along augmenting paths, and by Hopcroft-Karp when the graph is large.
division: [gold, platinum]
subjects: [graphs]
level: advanced
importance: common-contest-technique
keywords:
    [
        bipartite matching,
        maximum matching,
        augmenting path,
        Kuhn's algorithm,
        Hopcroft-Karp,
        Hall's theorem,
        Konig's theorem,
        vertex cover,
        alternating path,
    ]
prerequisites:
    required: [graphs.representation, graphs.dfs]
    recommended: [graphs.bfs, graphs.dsu, graphs.minimum-cut]
complexity:
    time: "O(E sqrt{V})"
    space: "O(V) beyond the adjacency list"
assumptions:
    - The graph is bipartite, with a known partition of the vertices into two sides.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Choose as many edges as possible, with no two sharing an endpoint |
| **Time** | $O(V E)$ for the simple algorithm, $O(E \sqrt{V})$ for Hopcroft-Karp |
| **Auxiliary space** | $O(V + E)$ beyond the adjacency list |
| **Requires** | A bipartite graph, and a known partition into the two sides |
| **Fails when** | The search stops at the first free vertex instead of continuing, or the visited marks are not cleared |
| **Primary technique** | Augmenting paths, and the alternation of matched and unmatched edges along them |
| **Related** | Vertex cover, Hall's theorem, the assignment problem, maximum flow |

A matching is a set of edges with no shared endpoints. Finding the largest such set in a bipartite graph is a problem with a clean theory: the answer exists, it can be characterized in three different ways, and the standard algorithms are short.

## Problem motivation

A school has $n$ students and $m$ courses. Each student lists the courses they are willing to take, and each course has one seat. The registrar wants to enroll as many students as possible.

The constraints are what make this a matching problem:

- $1 \le n, m \le 200\,000$.
- Each student lists at most $k$ courses, and the total number of listed preferences is at most $2 \cdot 10^5$.
- Each course has exactly one seat, and each student takes at most one course.
- The registrar must report the **maximum** number of enrolled students, and the assignment itself.

Three phrases in that statement carry the whole problem. "Each course has one seat" and "each student takes at most one course" say that no two chosen pairs may share a student or a course, which is exactly the definition of a **matching**. "As many students as possible" says the matching must be **maximum**, not merely maximal, and the difference between those two words is the entire content of this article.

The bipartite structure is also stated. The students form one side, the courses form the other, and every preference is an edge between the sides. That structure is what makes the problem easy: it makes the maximum matching equal to the minimum vertex cover, and it makes Hopcroft-Karp's fast algorithm possible.

## Recognition patterns

Bipartite matching is the right tool when all of the following hold.

- The problem splits into **two groups**, and every choice pairs one item from each group.
- Each item on either side can be used **at most once**.
- The goal is to maximize the number of pairs, or to test whether a perfect pairing exists.
- The graph is **bipartite**, or can be shown to be.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The graph is bipartite | Rules in every algorithm in this article |
| The graph is general | Rules out the simple algorithm; a general matching needs a blossom algorithm |
| $V, E \le 2 \cdot 10^5$ | Hopcroft-Karp is required; the simple algorithm is $O(V E)$ and far too slow |
| $V \le 2000$ and the graph is dense | The simple algorithm is fine |
| Every edge has weight $1$ | Rules in matching; a weighted version is the assignment problem |
| The edges have **costs** | Rules out plain matching; use the Hungarian algorithm or a minimum-cost flow |
| Only a **perfect** matching is needed | Rules in the same algorithm; report whether the size equals the smaller side |
| Each vertex has degree at most $2$ | The graph is a set of paths and even cycles, and a linear scan suffices |
| The graph is a tree | The matching on a tree is found greedily from the leaves |

Two phrases in a statement are reliable signals. "Each can be used at most once", "assign", "pair up", and "at most one" point here. "Cheapest" points away, at the assignment problem. "Perfect" points at the same technique with a different question.

<Synonyms terms="bipartite matching, maximum matching, maximal matching, augmenting path, alternating path, Kuhn's algorithm, Hungarian algorithm, Hopcroft-Karp, Hall's theorem, Konig's theorem, minimum vertex cover, assignment problem" />

## Naive approach

The baseline is greedy: walk the students in order and give each one the first course on their list that still has a free seat.

```python
taken = [False] * m
count = 0
for student in students:
    for course in preferences[student]:
        if not taken[course]:
            taken[course] = True
            count += 1
            break
```

This is $O(E)$ and it is correct as far as it goes, but it produces a **maximal** matching rather than a maximum one, and the two can differ.

The second baseline is to run the same greedy but to allow a student to be displaced: when a student wants a taken course, try to move its current owner somewhere else. That is Kuhn's algorithm, and it is the algorithm this article is about.

The third baseline is to model the problem as a flow network and run a maximum flow. That works and is correct, and it is the reduction described in [minimum cut](/algorithms/graphs/minimum-cut), but it is slower than a matching algorithm, and the flow model needs the network built explicitly.

## Key insight

The insight is that a matching that is not maximum can always be **improved by rearranging** it, and the rearrangement has a recognizable shape.

Write $M$ for the current matching and consider the edges of the graph. Relative to $M$, each edge is either **matched** or **unmatched**. An **alternating path** is a path whose edges alternate between matched and unmatched. An **augmenting path** is an alternating path that starts and ends at unmatched vertices. Because the graph is bipartite, such a path starts at an unmatched vertex of the left side and ends at an unmatched vertex of the right side, and it has one more unmatched edge than matched edge.

The move is simple: take an augmenting path and **flip** every edge on it. The edges that were matched become unmatched and the edges that were unmatched become matched. The result is still a matching, and it has one more edge than before, because the path gained one edge.

Berge's lemma, proved below, says that this is the only way a matching can grow: a matching is maximum if and only if it has no augmenting path.

Two consequences shape the algorithm.

**The search must be exhaustive.** When looking for an augmenting path from an unmatched left vertex, the search must continue past a right vertex that is already matched. The matched edge is followed **backwards**, to the left vertex that currently holds it, and the search continues from there. Stopping at the first occupied course is exactly the greedy mistake, and it is the reason a matching algorithm must recurse rather than merely scan.

**The order does not matter for the final size, but it matters for the work.** Any sequence of augmentations ends at a maximum matching, because the lemma guarantees that a matching with no augmenting path is maximum, and the algorithm stops only when no augmenting path exists. What the order changes is how many searches are needed, which is what Hopcroft-Karp exploits.

## Formal model

Let $G = (L, R, E)$ be a bipartite graph with the two sides $L$ and $R$.

<MathPanel type="definition" title="Definition">
A **matching** is a set $M \subseteq E$ such that no two edges of $M$ share an
endpoint. A matching is **maximal** if no edge can be added to it while
keeping it a matching, and **maximum** if it has the largest possible size
among all matchings. The size of a matching is written $\lvert M \rvert$.
</MathPanel>

<MathPanel type="definition" title="Definition">
A path in $G$ is **alternating** with respect to a matching $M$ if its edges
alternate between those in $M$ and those not in $M$. It is an **augmenting
path** if it is alternating and both of its endpoints are unmatched by $M$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **neighborhood** of a set $S \subseteq L$ is
$N(S) = \{v \in R : \text{some } u \in S \text{ is joined to } v\}$.
</MathPanel>

<MathPanel type="theorem" title="Theorem (Berge's lemma)">
A matching $M$ is maximum if and only if there is no augmenting path with
respect to $M$.
</MathPanel>

<MathPanel type="proof" title="Proof">
First, if an augmenting path $P$ exists, flip the edges of $P$: the edges of
$P$ that were in $M$ are removed and the edges of $P$ that were not in $M$ are
added. The result is still a matching, because the only vertices of $P$ that
are shared with the rest of the graph are its two endpoints, and both were
unmatched before. Since $P$ has one more edge outside $M$ than inside it, the
new matching has size $\lvert M \rvert + 1$. So $M$ was not maximum.

Conversely, suppose $M$ is not maximum, and let $M^_$ be a maximum matching. Consider the symmetric difference $M \triangle M^_$, the set of edges that are in exactly one of the two matchings. Every vertex of $G$ has degree at most two in this subgraph, because it is incident to at most one edge of $M$ and at most one edge of $M^_$. So the symmetric difference is a disjoint union of alternating paths and even alternating cycles. A cycle contains as many edges of $M$ as of $M^_$, and each path contains equal numbers of the two as well, unless it has one more edge of $M^_$ than of $M$, in which case it has one more edge of $M$ than of $M^_$ and ends at two vertices that are matched by $M$ and not by $M^*$.

Since $\lvert M^* \rvert > \lvert M \rvert$, the number of paths with one more edge of $M^_$ than of $M$ exceeds the number with the opposite imbalance, so at least one such path exists. That path starts and ends at vertices that are matched by $M$ and not by $M^_$, which means they are unmatched in $M^_$ and matched in $M$... careful: the endpoints of such a path are incident to one more $M^_$-edge, so their other incident edge in the symmetric difference is absent, which means they are unmatched by $M$. Hence the path is an augmenting path for $M$. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem (König's theorem)">
In a bipartite graph, the size of a maximum matching equals the size of a
minimum vertex cover, where a vertex cover is a set of vertices meeting every
edge.
</MathPanel>

<MathPanel type="theorem" title="Theorem (Hall's marriage theorem)">
A bipartite graph with parts $L$ and $R$, where $\lvert L \rvert \le \lvert R \rvert$,
has a matching that covers every vertex of $L$ if and only if
$\lvert N(S) \rvert \ge \lvert S \rvert$ for every subset $S \subseteq L$.
</MathPanel>

## Algorithm derivation

### The simple algorithm

The state is, for each right vertex, the left vertex it is matched to, or a sentinel meaning "free".

```text
for each left vertex u, in any order:
    clear the visited marks
    if try(u) succeeds: the matching grows by one

try(u):
    for each right vertex v joined to u:
        if v is marked: continue
        mark v
        if v is free:
            match v with u; return true
        if try(the left vertex currently matched to v) succeeds:
            match v with u; return true
    return false
```

The update rule is the flip of the augmenting path. When the search reaches a right vertex $v$ that is already matched to some left vertex $w$, it tries to move $w$ somewhere else. If that succeeds, $v$ becomes free for the original caller, and the matching grows by one.

The recursion is what makes the algorithm correct rather than merely greedy. The line `if try(the left vertex currently matched to v) succeeds` is what looks past the occupied course.

### Hopcroft-Karp

Hopcroft-Karp keeps the same idea but processes the augmenting paths in batches, and it uses the layers of a breadth-first search to guarantee that the paths it finds in one phase are the shortest ones and are vertex-disjoint.

```text
repeat:
    build the layer graph by a breadth-first search from the free left vertices
    if the free right vertex t is not reachable: stop
    for each free left vertex u:
        run a depth-first search restricted to the layers, and augment on every path found
```

Each phase finds a **maximal set of vertex-disjoint shortest augmenting paths**. The bound on the number of phases comes from the fact that after each phase the length of the shortest augmenting path strictly increases, and Berge's lemma guarantees that the last phase finds nothing.

<MathPanel type="invariant" title="Invariant">
At every moment of the simple algorithm, the assignment is a valid matching:
no two matched edges share an endpoint, and every left vertex is matched to at
most one right vertex.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At every moment of either algorithm, the current matching is contained in
some maximum matching. Flipping an augmenting path preserves this, because the
path's edges outside the current matching can be exchanged with the edges of a
maximum matching without changing the maximum size.
</MathPanel>

## Step-by-step execution

Take the bipartite graph with left side $L = \{s_1, s_2\}$ and right side $R = \{c_1, c_2\}$, and edges $s_1 c_1$, $s_1 c_2$, $s_2 c_1$. The maximum matching has size two, and the greedy assignment gets only one.

The left vertices are processed in the order $s_1, s_2$, and the search marks the right vertices it has visited.

1. Search from $s_1$. Its first right vertex is $c_1$, which is free, so the matching becomes $s_1 c_1$. The size is one. The marks left behind are $\{c_1\}$.
2. Search from $s_2$. Its only right vertex is $c_1$, which is taken by $s_1$. The search marks $c_1$ and recurses on $s_1$, the left vertex that holds it.
3. Inside that call, the search looks at the right vertices of $s_1$ in order. The first is $c_1$, which is already marked, so it is skipped. The second is $c_2$, which is free, so the search matches $c_2$ with $s_1$ and returns true.
4. Back in the search from $s_2$, the obligation of $c_1$ has been discharged, so $s_2$ takes $c_1$. The matching is $s_1 c_2$ and $s_2 c_1$, with size two.

The size now equals the smaller side, so the matching is perfect and the algorithm stops.

Step 3 is the whole algorithm. The search from $s_2$ did not stop at the occupied course $c_1$: it asked the student who held it, $s_1$, whether it could go elsewhere, and $s_1$ could. The augmenting path that was used is

$$
s_2 \to c_1 \to s_1 \to c_2,
$$

two unmatched edges and one matched edge, alternating, starting at the free left vertex $s_2$ and ending at the free right vertex $c_2$.

If step 3 had been written as "give up as soon as the recursive call fails", the search would have stopped at $c_1$, the answer would have been one, and the algorithm would have been the greedy in disguise.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The simple algorithm returns a maximum matching.
</MathPanel>

<MathPanel type="proof" title="Proof">
First, the matching stays valid. Suppose the search from a free left vertex
$u$ reaches a free right vertex $v$ and assigns $v$ to $u$. Every right vertex
on the search path was matched before, and each was reassigned to a different
left vertex, so no right vertex is used twice. Every left vertex on the path
except $u$ was matched to exactly one right vertex before and is matched to
exactly one after. The vertex $u$ was free and is now matched once. So the
result is a valid matching, one edge larger than before.

Second, the search finds an augmenting path whenever one exists. The search visits right vertices and, for each, follows the matched edge backwards to the left vertex holding it. This is exactly a traversal of the alternating paths that start at $u$: every alternating path consists of an unmatched edge from a left vertex to a right vertex followed by the matched edge back to a left vertex, and the search explores every unmatched edge out of every left vertex it reaches. The marks on the right vertices prevent the search from looping without preventing it from reaching any vertex, because a right vertex is reached in exactly one way: through the left vertex that is matched to it.

Third, the algorithm terminates with a maximum matching. Each successful search adds one edge to the matching, so there are at most $\min(\lvert L \rvert, \lvert R \rvert)$ successful searches, and each search touches each vertex at most once, so there are at most $V$ searches in total. When the algorithm ends, no augmenting path exists: if one existed, the search from its left endpoint would find it, because the search explores every alternating path from that endpoint. By Berge's lemma, a matching with no augmenting path is maximum. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
Hopcroft-Karp returns a maximum matching in $O(E \sqrt{V})$ time.
</MathPanel>

<MathPanel type="proof" title="Proof">
Each phase computes the layer graph, which is a shortest-path layering of the
alternating paths from the free left vertices, and then finds a maximal set of
vertex-disjoint shortest augmenting paths in it. Because the paths are
vertex-disjoint, augmenting on all of them in one phase keeps the matching
valid.

Let $L_i$ be the length of the shortest augmenting path at the start of a phase. The layer graph shows that the augmenting paths in the phase have length $L_i$, and the maximality of the set means that afterwards no augmenting path of length at most $L_i$ remains: any such path would have been found by the depth-first search over the layers. So $L_i$ strictly increases from phase to phase.

After $k$ phases, let $d$ be the length of the shortest augmenting path. The standard counting argument shows that the remaining paths are vertex-disjoint in a layered sense and that $k$ and $d$ satisfy $k \le V / d$ and $d \le V / k$ together, so $k \le O(\sqrt{V})$ until $d$ exceeds $\sqrt{V}$; after that, each phase can be charged to at least $\sqrt{V}$ additional matched edges, which can happen at most $V$ times. The number of phases is therefore $O(\sqrt{V})$, and each phase costs $O(E)$, for a total of $O(E \sqrt{V})$. Berge's lemma then gives maximality at the end. $\square$
</MathPanel>

## Complexity analysis

**The simple algorithm: $O(V E)$ time.** There are at most $V$ searches, one per left vertex, and each search touches each vertex and each edge at most once.

**Hopcroft-Karp: $O(E \sqrt{V})$ time.** Each phase costs $O(E)$ and there are $O(\sqrt{V})$ phases.

**Auxiliary space: $O(V)$** beyond the adjacency list, for the match array in each direction, the visited marks, the layer array, and the queue.

<MathPanel type="complexity" title="Complexity">
Maximum matching in a bipartite graph with $V$ vertices and $E$ edges:
$O(V E)$ time for the simple augmenting-path algorithm, $O(E \sqrt{V})$ for
Hopcroft-Karp. Auxiliary space $O(V)$ beyond the adjacency list.
</MathPanel>

|  | Simple augmenting path | Hopcroft-Karp | Maximum flow |
| --- | --- | --- | --- |
| Time | $O(V E)$ | $O(E \sqrt{V})$ | $O(E \sqrt{V})$ for unit capacities |
| Needs an explicit network | No | No | Yes |
| Structure | One search per left vertex | Layered batches of shortest paths | Residual graph with reverse edges |
| Best fit | Small or dense graphs | Large sparse graphs | When the problem is already a flow |

The three columns describe the same computation at three levels of generality. The flow column is the most general and the least convenient, because the network has to be built and the capacities have to be set, but it is the right tool when the problem has extra structure such as lower bounds or costs.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The largest set of pairs in a bipartite graph | Maximum matching |
| Whether a perfect pairing exists | Maximum matching; compare the size with the smaller side |
| The smallest set of vertices meeting every edge | Minimum vertex cover, which equals the maximum matching size in a bipartite graph |
| The maximum number of edge-disjoint paths in a bipartite graph | Maximum flow, by Menger's theorem |
| The cheapest assignment of workers to jobs | The Hungarian algorithm, or a minimum-cost flow |
| A matching in a graph that is not bipartite | A blossom algorithm, which is not covered here |
| A matching in a general graph with $V \le 100$ | A bitmask dynamic program over the vertices |
| A maximum matching in a tree | A greedy pass from the leaves |
| A matching where every vertex has degree at most two | A linear scan; the graph is a set of paths and cycles |
| Only the **number** of matched pairs is wanted | The matching algorithm, and count at the end |

The row about the Hungarian algorithm is the one that is most often confused. The Hungarian algorithm is a weighted algorithm: it finds the assignment of minimum total cost. The unweighted augmenting path algorithm finds the largest set of pairs. They share a name and a family resemblance and they answer different questions.

## Recursion decision

The recursive search is the natural shape of the algorithm, because the search for an augmenting path is a search over alternating paths and the recursion mirrors the path.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $V$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

<MathPanel type="counterexample" title="Counterexample">
A bipartite graph with $10^5$ left vertices and $10^5$ right vertices, where
left vertex $s_i$ is joined to right vertices $c_1, c_2, \ldots, c_i$, and
each right vertex $c_j$ is joined to left vertices $s_j, s_{j+1}, \ldots$,
chosen so that the search from the last left vertex must walk the whole chain.
The recursive form makes one nested call per vertex on the alternating path, so
in C++ on Linux with an 8 MB stack and a frame of roughly 64 bytes the stack
is exhausted after about $130\,000$ frames, and the program dies with a
segmentation fault. The iterative form, which keeps the path in an explicit
stack of left vertices, finishes normally.
</MathPanel>

The iterative form stores the path in a stack of left vertices and rewinds it when a dead end is reached, which is the same traversal with a different allocation.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Taking the first free course and moving on | The matching is maximal, not maximum | Search for an augmenting path |
| Stopping the search at an occupied course | The displacement is never tried | Recurse on the left vertex that holds the course |
| Following only unmatched edges | The search misses the paths that need a matched edge backwards | Alternate between unmatched and matched edges |
| Not clearing the visited marks between searches | Later searches cannot reach the vertices they need | Clear the marks before each search |
| Marking the left vertices when the search moves through the right ones | The search can loop or give up early | Mark the right vertices, or mark consistently with the traversal |
| Forgetting to update the match in both directions | The matching is inconsistent and the size is wrong | Set `matchLeft[u]` and `matchRight[v]` together |
| Assuming the graph is bipartite | The algorithm is wrong on a general graph | Check the bipartiteness first |
| Counting matched left vertices instead of matched edges | The count is right by luck, but the assignment is not | Report the pairs |
| Using a 32-bit integer for the count | Overflow is impossible here, but the habits are bad | The count fits in an int for any legal input |

### Why this fails: the greedy that leaves a student without a seat

The mistake that survives review most often is the greedy assignment: give each student the first course on their list that still has a seat, and move on.

The smallest counterexample has two students and two courses. Student $s_1$ wants either $c_1$ or $c_2$, and student $s_2$ wants only $c_1$. The edges are $s_1 c_1$, $s_1 c_2$, $s_2 c_1$.

The greedy run processes $s_1$ first and gives it $c_1$. Then $s_2$ is processed: its only course is $c_1$, which is taken, so $s_2$ is left without a seat. The greedy enrolls one student.

The truth is that two students can be enrolled: give $s_1$ the course $c_2$ and $s_2$ the course $c_1$. The maximum matching has size two.

Four vertices and three edges is the smallest counterexample, and it is the shape of every real scheduling problem: a popular course is wanted by more students than it has seats, and one of them must be moved elsewhere.

The reason the greedy fails is that it treats a taken course as a wall. The augmenting path $s_2 \to c_1 \to s_1 \to c_2$ shows that the wall is passable: $s_1$ can be asked to move.

### Why this fails: the visited marks that are never cleared

The second mistake is to keep the visited marks from one search in the next search.

The smallest counterexample is the same two students and two courses, with the edges $s_1 c_1$, $s_1 c_2$, $s_2 c_1$, but with the students processed in the other order.

1. The search for $s_2$ marks $c_1$, and then $c_1$ is taken by $s_1$... let the first search be for $s_1$, which takes $c_1$. The marks left behind are $\{c_1\}$.
2. The search for $s_2$ starts. Its only course is $c_1$, and $c_1$ is marked, so the search skips it and returns immediately, reporting failure.
3. The matching has size one.

The truth is that the matching $s_1 c_2$, $s_2 c_1$ has size two, and the search for $s_2$ would have found it: mark $c_1$, recurse on $s_1$, skip the already marked $c_1$, and take the free $c_2$.

This instance is the minimal test for both this bug and the greedy bug, and the two agree on it. That is a trap, because a test suite built on this instance alone cannot tell them apart. The instance that separates them has the same shape with the students in the other order, where the greedy succeeds and the stale marks do not.

The general statement is that the marks are **per search**. They exist to stop one search from looping, and they carry no information between searches.

### Why this fails: the path that is not alternating

The third mistake is to search for an augmenting path using only the edges that are **not** in the matching.

The smallest counterexample has two students and two courses again. Student $s_1$ wants only $c_1$, and student $s_2$ wants $c_1$ or $c_2$, and the students are processed in the order $s_2, s_1$.

After the first search, the matching is $s_2 c_1$, and $c_2$ is free. Now the search for $s_1$ starts. The only edge out of $s_1$ is the unmatched edge $s_1 c_1$, and $c_1$ is matched. A search that only follows unmatched edges stops there and reports that $s_1$ cannot be placed.

The truth is that the augmenting path is $s_1 \to c_1 \to s_2 \to c_2$: the unmatched edge $s_1 c_1$, then the **matched** edge $c_1 s_2$ traversed backwards, then the unmatched edge $s_2 c_2$. Flipping it gives the matching $s_1 c_1$, $s_2 c_2$, of size two, which is the maximum.

The greedy algorithm succeeds on this instance, so it does not catch the bug. What catches it is a test in which a student must displace somebody.

## Variants and extensions

- **Minimum vertex cover.** In a bipartite graph, the minimum vertex cover has the same size as the maximum matching, and it can be recovered from the matching with one alternating-path search from the free left vertices.
- **Perfect matching.** A matching is perfect when its size equals the smaller side. Hall's theorem characterizes when one exists, in terms of the neighborhood sizes of the subsets of one side.
- **The assignment problem.** With a cost on each edge, the Hungarian algorithm finds the assignment of minimum total cost in $O(V^3)$ time, and it is a weighted matching rather than an unweighted one.
- **Matching as a flow.** Reduce the problem to a flow network: a source joined to every left vertex with capacity one, every edge of the graph as a left-to-right arc of capacity one, and every right vertex joined to a sink with capacity one. The maximum flow is the maximum matching. The reduction is described in [minimum cut](/algorithms/graphs/minimum-cut).
- **General matching.** In a non-bipartite graph the same definition applies, but finding augmenting paths needs the blossom technique, because the alternating paths can close into odd cycles.
- **Matching with lower bounds.** A bipartite graph with a requirement that some vertices be matched can be reduced to a flow with lower bounds.
- **Online matching.** When the vertices arrive one at a time and a decision must be made immediately, the greedy is the only option and the matching is at worst half the optimum.
- **Independent sets in a bipartite graph.** A maximum independent set is the complement of a minimum vertex cover, so its size is $\lvert V \rvert - \lvert M \rvert$ for a maximum matching $M$.

## Contest strategy

Under time pressure, the errors above are what cost points, and all of them are avoidable with a fixed procedure.

1. Decide whether the problem is unweighted matching or the weighted assignment problem, and use the matching algorithm only in the first case.
2. Write the search so that it recurses on the left vertex holding an occupied right vertex. That single line is the difference between the greedy and the correct algorithm.
3. Clear the visited marks before every search.
4. Choose the algorithm from the constraints. Up to a few thousand vertices, the simple algorithm is fine. Above that, use Hopcroft-Karp.
5. Mark the right vertices, or mark the left vertices, but do it consistently with the direction the search moves.
6. Keep the match in both directions, so that the assignment can be printed and the "who holds this course" question is answered in constant time.
7. Test four cases by hand: a perfect matching, a course wanted by more students than it has seats, a student with no possible course, and an empty side.

## Worked problems

### Problem 1: the course enrollment

**Restatement.** There are $n$ students, $m$ courses, and $e$ preferences, where each preference joins a student to a course. Each course has one seat. Report the maximum number of students that can be enrolled, and the assignment. Constraints: $1 \le n, m \le 200\,000$ and $e \le 2 \cdot 10^5$.

**Naive baseline.** Assign each student the first free course on their list, at a cost of $O(e)$, producing a maximal matching that need not be maximum.

**Insight.** A matching that is not maximum has an augmenting path, and flipping the edges along it makes the matching one edge larger.

**Derivation.** Implement the augmenting path search. If the constraints require it, use Hopcroft-Karp: build the layer graph with a breadth-first search from the free students, then find a maximal set of vertex-disjoint shortest augmenting paths in the layers.

**Correctness.** The proof above shows that the search finds an augmenting path whenever one exists, that flipping it keeps the matching valid, and that the algorithm ends with no augmenting path, which by Berge's lemma is a maximum matching.

**Complexity.** $O(V E)$ time for the simple algorithm and $O(E \sqrt{V})$ for Hopcroft-Karp, with $O(V)$ auxiliary space.

**Common wrong approach.** The greedy assignment. On two students and two courses with three preferences it enrolls one student when two are possible.

### Problem 2: the shift that cannot be staffed

**Restatement.** A factory has $n$ workers and $m$ shifts, each with a qualification requirement. Each worker can take at most one shift and each shift takes at most one worker. Report the maximum number of shifts that can be staffed.

**Naive baseline.** The same greedy.

**Insight.** The graph is bipartite, with the workers on one side and the shifts on the other, so the matching algorithm applies unchanged. The extra detail is that the shift may be assigned to a worker who is already busy, and the worker who loses that shift must be found a different one. That is the augmenting path.

**Derivation.** Use the augmenting path algorithm, and to report the assignment keep the match in both directions.

**Correctness.** By the same argument as Problem 1, the final matching is maximum, so the number of staffed shifts is the largest possible.

**Complexity.** $O(V E)$ or $O(E \sqrt{V})$ depending on the algorithm.

**Common wrong approach.** Reporting the number of workers that got a shift from the greedy pass and calling it the maximum. The two numbers can differ.

### Problem 3: the minimum set of courses to close

**Restatement.** The same preferences. The registrar may cancel a set of courses, and every student must still be able to take a course that is not canceled, except for a number of students that may be left without one. Report the smallest number of courses to cancel so that the remaining enrollment is as large as possible, or in the form the statement uses, the smallest set of courses meeting every preference.

**Naive baseline.** Try every subset of courses to cancel.

**Insight.** The smallest set of courses meeting every preference is a **vertex cover**, and in a bipartite graph it has the same size as the maximum matching. So the answer is the size of the matching, and the cover itself can be recovered from the matching with one alternating-path search.

**Derivation.** Compute a maximum matching $M$. Let $U$ be the set of left vertices that are unmatched. Search along alternating paths starting from $U$. Let $Z$ be the set of vertices reached, split into $Z_L$ and $Z_R$. Then $(L \setminus Z_L) \cup Z_R$ is a minimum vertex cover, of size $\lvert M \rvert$.

**Correctness.** Every edge must have an endpoint in the cover, so a cover is at least as large as a matching. König's theorem says that in a bipartite graph the two sizes are equal, so the cover found has size $\lvert M \rvert$ and is minimum.

**Complexity.** The matching dominates: $O(E \sqrt{V})$ time with Hopcroft-Karp, plus $O(V + E)$ for the cover.

**Common wrong approach.** Canceling the courses that are currently taken. That set is a vertex cover only when the matching is perfect, and its size is usually larger than necessary.

## Practice progression

1. **Recognition.** Given a statement, decide whether matching applies. Look for two groups, one-to-one assignments, and "at most once", and check that the graph is bipartite.
2. **Direct application.** Implement the augmenting path search and verify it against the greedy on random graphs, checking that the matching is never smaller and is sometimes larger.
3. **Adaptation.** Implement Hopcroft-Karp, add the vertex-cover recovery, and handle the case where one side is much larger than the other.
4. **Combination.** Combine the matching with a topological sort for a scheduling problem, or with a disjoint set union for a problem where the students arrive incrementally.
5. **Challenge.** Solve a problem with $10^5$ students and $10^5$ courses where the simple algorithm is $O(V E)$ and Hopcroft-Karp is required, and where the answer must be printed as an assignment.
6. **Transfer.** Use the same machinery for a different question: a minimum vertex cover, the maximum number of edge-disjoint paths in a bipartite graph, a maximum independent set in a bipartite graph, and the structure of the chains of a partial order.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the difference between a maximal matching and a maximum matching. (Formal model)
2. Define an augmenting path, and say what flipping it does. (Key insight)
3. State Berge's lemma. (Formal model)
4. Why must the search recurse on the left vertex holding an occupied right vertex? (Common mistakes)
5. What is the smallest graph on which the greedy assignment fails? (Why this fails)
6. What is the smallest graph on which a stale visited mark fails? (Why this fails)
7. What does the augmenting path look like when a student must displace somebody? (Why this fails)
8. Give the running times of the simple algorithm and of Hopcroft-Karp. (Complexity analysis)
9. Why does Hopcroft-Karp find the shortest augmenting paths? (Algorithm derivation)
10. State König's theorem and Hall's theorem. (Formal model)
11. How is a matching reduced to a flow? (Variants and extensions)
12. When is recursion safe in the augmenting path search? (Recursion decision)

## Further reading

- The flow formulation of the same problem, which also answers the weighted and the lower-bounded variants, is [minimum cut](/algorithms/graphs/minimum-cut).
- The traversal that Hopcroft-Karp uses to build its layers is [breadth-first search](/algorithms/graphs/bfs), and the recursive shape of the simple search is the one described in [depth-first search](/algorithms/graphs/dfs).
- The tree structure gives a greedy matching that is always maximum, and the tree techniques are in [tree dynamic programming](/algorithms/trees/tree-dp).
- The connectivity structure that a matching decomposes a graph into, and the related structures on trees, are in [disjoint set union](/algorithms/graphs/dsu).
- The call-stack limit that decides between the recursive and the iterative search is covered in [recursion](/algorithms/foundations/recursion).
