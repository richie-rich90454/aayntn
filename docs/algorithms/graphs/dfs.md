---
id: graphs.dfs
title: Depth-first search
summary: Reach every vertex of a graph from a start vertex by following each branch to its end before backtracking.
division: [silver, gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [depth-first search, dfs, traversal, backtracking, stack]
prerequisites:
    required: [graphs.representation]
    recommended: [foundations.recursion, start.data-structures]
complexity:
    time: "O(V + E)"
    space: "O(V + E)"
assumptions:
    - The graph is undirected unless the article says otherwise.
implementations: graphs.dfs
visualization: graphs.dfs
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.dfs" />

A depth-first search explores a graph by following one branch as far as it goes and only then backtracking to the most recent vertex that still has an unexplored neighbor. The whole algorithm is a visited array and a container that hands back the most recently discovered vertex.

Two decisions matter before you write a line of code: whether that container is a stack or a queue, and whether a vertex is marked when it is discovered or when it is expanded. The first choice decides whether you get a depth-first or a breadth-first traversal. The second choice decides how much memory the traversal needs.

The traversal costs $O(V + E)$ time in every language and in every variant of it. The auxiliary space is $O(V)$ for the recursive form and $O(V + E)$ for the iterative form that marks a vertex when it is popped from the stack, because that form can hold the same vertex on the stack once per incident edge.

## Problem motivation

A road authority has a map of $n$ towns joined by $m$ two-way roads. A storm has closed some roads, and the authority must report how many towns are still reachable from the depot in town $1$, and list them.

The constraints are what make the problem interesting:

- $1 \le n \le 200\,000$ towns.
- $0 \le m \le 400\,000$ roads.
- The graph is undirected, and the answer depends only on the component of town $1$.

A traveler who keeps walking without recording where they have been will walk forever, because a road network contains cycles: the traveler goes from $a$ to $b$, back to $a$, off to $c$, back to $a$, and the walk never ends. Recording the towns already visited turns the walk into a traversal that terminates, and the count of visited towns is the answer.

Notice what the problem is _not_ asking. It does not ask for the shortest route, and it does not ask for a path at all. It asks for a set. That observation is what separates depth-first search from the algorithms in [breadth-first search](/algorithms/graphs/bfs) and [Dijkstra's algorithm](/algorithms/graphs/dijkstra): depth-first search is the right tool whenever the shape of the answer is a set of vertices, a tree of parent pointers, or an ordering derived from the search itself.

## Recognition patterns

Depth-first search is the right tool when all of the following hold.

- The problem asks which vertices are **reachable**, which components exist, or whether a **cycle** is present.
- The graph is **implicit**: the neighbors of a vertex are computed on demand rather than stored, as in a grid of cells.
- You need a **spanning forest**, a **topological order**, a **Eulerian trail**, or any other object that a search order defines.
- The graph is **static**: nothing changes while you search.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| $n \le 10^5$, $m \le 2 \cdot 10^5$ | An adjacency list and a linear traversal are both comfortable |
| $m \ge 10^7$ | An adjacency matrix costs $n^2$ space and is out; use an adjacency list |
| $n \le 10^3$ and the graph is dense | A matrix of $10^6$ booleans is acceptable and can be faster |
| The graph changes between queries | A single search is not enough; the graph must be re-searched or a dynamic structure is needed |

Two words in a problem statement are strong signals. "Reachable", "connected" and "component" all point at a search. "Fewest", "shortest" and "minimum" point away from it and towards breadth-first search or Dijkstra, because those questions are about the size of a path rather than about membership.

<Synonyms terms="depth-first search, dfs, depth first search, backtracking search, recursive graph traversal" />

## Naive approach

The baseline is to walk without recording anything.

```python
def walk(v):
    for w in adj[v]:
        walk(w)
```

This is not merely slow. On a graph with a cycle it never terminates, and on a tree with $n$ vertices it makes $2^n$ calls, because each vertex is reached once per path that leads to it.

The second baseline is a linear scan with an explicit visited array, which is the naive approach done right:

```python
visited = [False] * n
visited[0] = True
stack = [0]
while stack:
    v = stack.pop()
    for w in adj[v]:
        if not visited[w]:
            visited[w] = True
            stack.append(w)
```

This version is correct and linear. It is included here because the difference between it and the implementation in this article is exactly one line, and that one line is the subject of the complexity analysis below.

The third baseline is to answer reachability queries by running a search per query, which costs $O(q(V + E))$ and is the right thing to do when the queries arrive one at a time and the graph is small.

## Key insight

The insight is that a vertex only has to be expanded once.

The first time the traversal reaches a vertex, everything that can be reached from that vertex is discovered along with it, because the traversal will eventually look at every neighbor of every vertex it reaches. So the second time the traversal arrives at the same vertex, there is nothing left to do. Marking the vertex and refusing to expand it a second time is what makes the traversal linear rather than exponential.

From this one fact the rest follows. The traversal needs a container of vertices that are known but not yet expanded. To be _depth-first_, that container must be a last-in, first-out stack, so that the vertex most recently discovered is the next one expanded. To be _breadth-first_, it must be a first-in, first-out queue.

The same idea has a third form. A vertex can be in one of three states rather than two: unvisited, active (discovered, still being expanded), and finished (discovered, fully expanded). The extra state is what lets a depth-first search detect a cycle, because an edge that points back to an active vertex closes a loop.

## Visual intuition

The laboratory below runs the iterative traversal on a graph you can type in. The active vertex is marked in gold, a vertex that has been discovered but not yet expanded is marked in blue, and a vertex whose neighbors have all been examined is marked in green. The panel on the right shows the explicit stack, so you can watch it grow as neighbors are pushed and shrink as vertices are popped.

The narration states what just changed at each step, and it is worth reading it rather than watching the picture: the sentence "push the unvisited neighbor" is the moment the graph branches, and the sentence "all neighbors have been considered, so the traversal backtracks" is the moment the branch ends. Between those two moments the stack holds the path from the root to the active vertex.

<AlgorithmPlayer algorithm="graphs.dfs" />

## Formal model

Let $G = (V, E)$ be a graph and $s \in V$ the start vertex.

<MathPanel type="definition" title="Definition">
A **traversal** of $G$ from $s$ is a sequence $v_0 = s, v_1, \ldots, v_{k-1}$
of distinct vertices of $G$ such that $v_i$ and $v_{i+1}$ are joined by an
edge for every $0 \le i < k - 1$. The traversal is **complete** if every
vertex of $G$ reachable from $s$ appears in the sequence.
</MathPanel>

<MathPanel type="definition" title="Definition">
A traversal is **depth-first** if the vertices that have been discovered but
not yet expanded are held in a last-in, first-out stack, so that the vertex
most recently discovered is always the next one expanded.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **parent** of a vertex $v \ne s$ is the vertex from which $v$ was first
discovered. The parent relation is a forest: every vertex has at most one
parent, and following parent pointers from any vertex ends at $s$. It is
called the **DFS forest** of the search.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **state** of a vertex during the search is one of three values:
*unvisited*, if it has not been discovered; *active*, if it has been
discovered and its neighbors are still being examined; and *finished*, if it
has been discovered and every one of its neighbors has been examined.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $u$ be an active vertex and let $v$ be a neighbor of $u$ that is also
active. Then the DFS forest contains a path from $v$ to $u$, so the
directed graph has a cycle. In an undirected graph, every non-tree edge is
such an edge.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
In an undirected graph, the DFS forest of a search from $s$ has exactly the
connected component of $s$ as its vertex set, and every vertex of the
component other than $s$ has a parent inside the component.
</MathPanel>

## Algorithm derivation

The recursive form is the easiest to derive, because the call stack _is_ the stack of pending vertices.

The state is a boolean array `visited` of length $n$ and, implicitly, the call stack. The update rule is: on entry to the call for vertex $v$, set `visited[v] = true`; then for each neighbor $w$ of $v$ in turn, if `visited[w]` is false, make the recursive call for $w$.

The update is correct because marking $v$ before examining its neighbors is what prevents the traversal from re-entering $v$ through a cycle. The neighbor check `if not visited[w]` then skips exactly the neighbors that have already been handled, either because $w$ was expanded earlier or because $w$ is an ancestor of $v$ currently on the stack.

The iterative form replaces the call stack with an explicit one. The derivation has a subtlety that the two published variants disagree about, and it is worth being precise.

**Variant A, mark on pop.** Push the start vertex. While the stack is not empty, pop a vertex $v$; if $v$ is already visited, discard it; otherwise mark $v$, record it in the visit order, and push every neighbor of $v$ that is not yet visited.

This form reproduces the recursive visit order exactly, because the stack of pending vertices is the same list in both. It also allows the same vertex to sit on the stack several times: if $v$ is a neighbor of three different vertices that are expanded before $v$ is popped, then $v$ is pushed three times and only the first pop expands it. The stack therefore holds $O(V + E)$ entries, not $O(V)$.

**Variant B, mark on push.** Push the start vertex and mark it. While the stack is not empty, pop a vertex $v$, record it in the visit order, and push every neighbor $w$ that is not yet visited, marking $w$ as it is pushed.

This form keeps at most one entry per vertex on the stack, so the stack holds $O(V)$ entries. Its visit order differs from the recursive form, because the neighbors are expanded in the reverse of the order in which they were discovered rather than in the order of the recursive descent.

<MathPanel type="invariant" title="Invariant">
At every moment of the iterative search, the set of marked vertices is
exactly a set of vertices reachable from $s$ in the graph, and the stack
holds only marked or unmarked vertices of that same reachable set.
</MathPanel>

## Step-by-step execution

Take the undirected graph on vertices $0,1,2,3,4,5$ with edges $0\!-\!1$, $0\!-\!2$, $1\!-\!3$, $2\!-\!3$, $3\!-\!4$. Vertex $5$ is isolated. The adjacency lists, built in the order the edges are read, are $0: (1,2)$, $1: (0,3)$, $2: (0,3)$, $3: (1,2,4)$, $4: (3)$, $5: ()$.

The iterative search from $0$, marking on pop, proceeds like this.

1. Push $0$. The stack is $[0]$.
2. Pop $0$. It is unmarked, so mark it and record $0$. Its neighbors $1$ and $2$ are unmarked, so push $1$ then $2$. The stack is $[1, 2]$ and the visit order is $0$.
3. Pop $2$. It is unmarked, so mark it and record $2$. Its neighbor $0$ is marked and $3$ is unmarked, so push $3$. The stack is $[1, 3]$ and the visit order is $0, 2$.
4. Pop $3$. It is unmarked, so mark it and record $3$. Its neighbor $1$ is unmarked, so push $1$; $2$ is marked; $4$ is unmarked, so push $4$. The stack is $[1, 1, 4]$ and the visit order is $0, 2, 3$.
5. Pop $4$. It is unmarked, so mark it and record $4$. Its only neighbor $3$ is marked. The stack is $[1, 1]$ and the visit order is $0, 2, 3, 4$.
6. Pop $1$. It is unmarked, so mark it and record $1$. Both of its neighbors $0$ and $3$ are marked. The stack is $[1]$ and the visit order is $0, 2, 3, 4, 1$.
7. Pop $1$ again. It is already marked, so discard it. The stack is empty and the search ends.

The visit order is $0, 2, 3, 4, 1$. Note the duplicate $1$ on the stack in step 4 and the discarded pop in step 7: that is the price of marking on pop, and the reason this variant needs $O(V + E)$ stack space.

The recursive search from $0$ visits $0, 1, 3, 2, 4$ instead. The two orders differ, and the reachable set does not, which is why the canonical program prints the reachable vertices in increasing index order: the output must not depend on which traversal style produced it.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The iterative search marks exactly the vertices of $G$ that are reachable
from $s$, and it terminates.
</MathPanel>

<MathPanel type="proof" title="Proof">
First, every marked vertex is reachable. The proof is by induction on the
number of marking operations. The first marked vertex is $s$, which is
reachable from itself. Suppose the marked vertex is $v$, and $v$ is
reachable from $s$ by a path. A neighbor $w$ of $v$ that becomes marked
later is reachable from $s$ by that path followed by the edge $\{v, w\}$.
So every marked vertex is reachable from $s$.

Second, every reachable vertex is marked. Let $w$ be any vertex reachable from $s$, and let $s = u_0, u_1, \ldots, u_k = w$ be a simple path from $s$ to $w$ in $G$. We show that each $u_i$ is eventually marked. Suppose $u_0, \ldots, u_{i-1}$ are marked. When $u_{i-1}$ is expanded, its neighbor $u_i$ is examined. If $u_i$ is already marked there is nothing to prove. Otherwise $u_i$ is unmarked at that moment, so either it is pushed onto the stack, or it was already pushed earlier. In both cases $u_i$ sits on the stack, so it is eventually popped, and a pop of an unmarked vertex marks it. Hence $u_i$ is marked, and by induction $w$ is marked.

Finally, the search terminates. Each pop either marks a previously unmarked vertex or discards an already marked one. There are at most $n$ marking pops, and the total number of pushes is at most one for the start vertex plus one for each edge end examined, so at most $1 + 2m$ pushes. Each pop consumes one push, so the loop runs at most $1 + 2m$ times and the stack empties. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The recursive search marks exactly the same set of vertices as the iterative
search, and produces the same DFS forest.
</MathPanel>

<MathPanel type="proof" title="Proof">
The two searches differ only in where the pending vertices are held: in the
call stack for the recursive form, and in an explicit stack for the
iterative form. In the recursive form, the call for vertex $v$ is made at
the moment $v$ is expanded, and the neighbors of $v$ are examined in the
order they appear in the adjacency list; in the iterative form, $v$ is
expanded when it is popped, and the same neighbors are pushed in the same
order and popped in the reverse order. Since the stack is last-in,
first-out in both cases, the sequence of expanded vertices is the same
sequence, and each expansion examines the same neighbors in the same
order. The marked set and the parent relation are therefore identical. The
correctness of the iterative search above then applies to the recursive
search as well. $\square$
</MathPanel>

## Complexity analysis

The bounds below describe the two variants in this article's implementations, and they differ.

**Time: $O(V + E)$ for both variants.** Every vertex is expanded at most once, because a vertex is marked when it is expanded and a marked vertex is never expanded again. Expanding a vertex examines each of its incident edges once, and every edge is incident to two vertices, so at most $2E$ edge examinations happen in total. The number of pops is bounded by the number of pushes, which is at most $1 + 2E$. Both totals are $O(V + E)$.

**Auxiliary space: $O(V + E)$ for the iterative variant.** The visited array holds $V$ entries. The explicit stack holds one entry per push, and because this variant marks a vertex only when it is popped, a vertex can be pushed once per incident edge. A vertex of degree $d$ can be on the stack $d$ times at once, so the stack holds at most $1 + 2E$ entries in total over the run and at most $O(V + E)$ at any moment. The C implementation sizes its stack buffer exactly this way: one slot for the start vertex plus one for each edge end.

**Auxiliary space: $O(V)$ for the recursive variant.** The visited array holds $V$ entries, and the call stack holds at most one frame per vertex on the current path, which is at most $V$ frames. The marking happens on entry to the call, so no vertex is ever entered twice, and the space does not depend on the number of edges at all.

<MathPanel type="complexity" title="Complexity">
Iterative depth-first search that marks on pop: time $O(V + E)$,
auxiliary space $O(V + E)$. Recursive depth-first search that marks on
entry: time $O(V + E)$, auxiliary space $O(V)$. Marking on push makes the
iterative form use $O(V)$ auxiliary space as well, at the price of a
different visit order.
</MathPanel>

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Which vertices are reachable from $s$ | Depth-first search or breadth-first search |
| How many connected components | Depth-first search, one search per component |
| Does this undirected graph have a cycle | Depth-first search with three states |
| Does this directed graph have a cycle | Depth-first search with three states, over all vertices |
| A topological order of a directed acyclic graph | Depth-first search, or Kahn's algorithm |
| Fewest edges from $s$ to every vertex | Breadth-first search |
| Cheapest path with arbitrary positive weights | Dijkstra's algorithm |
| Cheapest path with possibly negative weights | Bellman-Ford |
| Minimum spanning tree | Kruskal with a disjoint set union, or Prim |
| An Eulerian trail | Hierholzer's algorithm, which is a depth-first search |

The last two rows matter as much as the first. Depth-first search is a waste of effort when the question is about the size of a path, because the depth-first order carries no information about path length.

## Reference implementations

<CodeViewer algorithm="graphs.dfs" />

The manifest for this algorithm publishes three variants. The `iterative` variant marks a vertex when it is popped, needs $O(V + E)$ auxiliary space, and is the recommended form. The `recursive` variant marks a vertex on entry, needs $O(V)$ auxiliary space, and is recommended only when the depth of the graph is known to be small. The `program` variant runs the iterative traversal and prints the reachable set in increasing index order, so that the six language versions produce identical output.

## Recursion decision

The recursive form is the one to learn, because it is the shortest and because it matches the way people describe the algorithm. Whether to ship it depends on how deep the recursion can get, and that limit is a property of the language and the platform rather than of the algorithm.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $V$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative, and the Pascal variant is educational only |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is not a wrong answer. It is a crash: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

<MathPanel type="counterexample" title="Counterexample">
Consider a path graph on $10^6$ vertices, that is, a chain
$0 - 1 - 2 - \cdots - 10^6 - 1$, and a search that starts at vertex $0$.
Every vertex is reachable, so the answer is $10^6$, and the traversal is
trivially correct. The recursive form, however, makes $10^6$ nested calls,
each with a frame holding a loop index and a pointer to the adjacency
list. In C++ on Linux, with an 8 MB stack and a frame of roughly 64 bytes,
the stack is exhausted after about $130\,000$ frames, so the program dies
with a segmentation fault before it has visited $13\%$ of the graph. The
iterative form traverses the same chain with a heap-allocated stack and
finishes normally. The graph is legal, the input constraints are met, and
the answer is well defined; only the choice of implementation is wrong.
</MathPanel>

The rule of thumb is simple: if $V$ can be as large as $10^5$ or more, write the iterative form. It is four lines longer and it cannot fail.

## Implementation walkthrough

Two lines carry the whole algorithm.

```cpp
if (visited[v]) {
    continue;          // reached through another edge; nothing to expand
}
visited[v] = 1;
```

and

```cpp
for (const int w : adj[v]) {
    if (!visited[w]) {
        stack.push_back(w);
    }
}
```

The check inside the push loop is an optimization, not a correctness requirement. It avoids pushing a vertex that is already known to be finished, but it cannot prevent a vertex from being pushed twice, because the marking happens later, when the vertex is popped. That is why the check on pop is the one that must be there.

The recursive form has the two checks in the opposite order, and the difference is what the complexity analysis is about:

```cpp
static void dfsVisit(const AdjacencyList& adj, int v,
                      std::vector<char>& visited, std::vector<int>& order) {
    visited[v] = 1;          // marked on entry, so v is entered once
    order.push_back(v);
    for (const int w : adj[v]) {
        if (!visited[w]) {
            dfsVisit(adj, w, visited, order);
        }
    }
}
```

Marking on entry means the function is never called twice for the same vertex, so the recursion depth is the depth of the tree and the auxiliary space is $O(V)$.

The program variant prints the reachable vertices in increasing index order rather than in visit order. Visit order depends on the variant and on the order the edges were read, and the six language implementations must agree byte for byte, so the output is normalized.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting to mark the start vertex | The start is expanded twice, or the search never terminates on a self-loop | Mark the start before the loop, or let the pop handle it |
| Expanding a vertex without checking whether it is marked | The search loops forever on any cycle | Check before expanding |
| Recursing into a neighbor without marking the current vertex | Infinite recursion on a cycle | Mark on entry, before the neighbor loop |
| Using a queue instead of a stack | The traversal is breadth-first and the visit order is wrong | Use a stack, or `push_back` and `pop_back` |
| Assuming the visit order is the same for all variants | The output differs between the recursive and iterative forms | Print a canonical order when the order is not specified |
| Sizing the visited array to $n - 1$ | An out-of-range write on the last vertex | Size it to $n$ |
| Trusting the vertex labels to be dense | A graph with labels $1 \ldots n$ indexed $0 \ldots n-1$ writes out of range | Shift the labels when reading the input |
| Forgetting the isolated vertices | A vertex of degree zero is never reached unless it is the start | Search from every unvisited vertex when counting components |

### Why this fails: the chain that overflows the call stack

The mistake that survives review most often is not a logic error at all. It is the choice of the recursive form for a graph whose depth approaches the size of the graph.

The smallest counterexample is a path graph: vertices $0$ through $10^6 - 1$, with the edge $\{i, i+1\}$ for every $i$. Nothing about this graph is unusual. It is undirected, it has $n = 10^6$ vertices and $n - 1$ edges, and a search from vertex $0$ should visit all of them.

The recursive form makes one nested call per vertex. In C++ on Linux, the default stack is 8 MB, and a frame for the function above occupies roughly 64 bytes, so the recursion dies after about $130\,000$ frames. The program prints nothing and exits with a segmentation fault, which the judge scores as a runtime error. The iterative form, with its stack in the heap, visits all $10^6$ vertices and prints the right answer.

There is a second version of the same mistake, in the other direction. A traversal that marks on pop but pushes every neighbor without checking whether it is already marked will still terminate, because the check on pop discards the duplicates, but the stack can grow to $O(V + E)$ entries. On a dense graph with $n = 200\,000$ and $m = 2 \cdot 10^7$ edges, that is $4 \cdot 10^7$ stack entries, which is 160 MB of integers. The graph fits in memory as an adjacency list and the traversal does not.

The lesson generalizes: **the marking point is the memory decision.** Mark on entry and the space is $O(V)$; mark on pop and the space is $O(V + E)$.

## Variants and extensions

- **Three states instead of two.** Replace the boolean `visited` with an integer in $\{0, 1, 2\}$ for unvisited, active and finished. A neighbor that is active when it is examined closes a cycle. This is the standard cycle detection algorithm, and it is what makes a depth-first search produce a topological order.
- **Topological order.** Run the three-state search over a directed acyclic graph and push each vertex onto a list when it finishes. The reverse of that list is a topological order.
- **Hierholzer's algorithm.** For an Eulerian trail, keep a stack of vertices and splice in unused edges when a vertex is exhausted. The result is an Eulerian trail, and the algorithm is a depth-first search with an extra rule.
- **Kosaraju's algorithm.** Two depth-first searches, one on the graph and one on the transpose, find the strongly connected components. The second search must run in reverse finish order, which is exactly what the finish times of a depth-first search provide.
- **Implicit graphs.** A grid of cells is a graph whose edges are computed on the fly. The traversal code does not change; only the neighbor function does.
- **The explicit-iterator variant.** To reproduce the recursive visit order with $O(V)$ space, store for each vertex the index of the next neighbor to examine, and push that index alongside the vertex. The traversal then pops a vertex only when its neighbor list is exhausted.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide the traversal order before writing code, and write it down: stack for depth-first, queue for breadth-first.
2. Decide the marking point before writing code: on entry for the recursive form, on pop for the iterative form.
3. Decide whether you need a visited array at all. If the graph is a tree, the parent edge is the only edge back, and no array is needed.
4. Test the three shapes by hand: a single isolated vertex, a path, and a cycle. The cycle is the one that catches a missing mark.
5. If the answer is an ordering, check whether the ordering depends on the neighbor order in the adjacency list. If it does, the problem is ambiguous or it wants a canonical output.
6. Check the stack depth against $V$ before committing to recursion.

## Worked problems

### Problem 1: the towns still reachable

**Restatement.** An undirected graph has $n$ towns and $m$ two-way roads. Given a start town $s$, report the number of towns reachable from $s$ and the towns themselves in increasing order. Constraints: $1 \le n \le 200\,000$ and $0 \le m \le 400\,000$.

**Naive baseline.** Walk the roads without recording where you have been. On a graph with a cycle this never terminates, and on a tree it makes $2^n$ calls.

**Insight.** A vertex only needs to be expanded once, because everything reachable from it is discovered when it is expanded.

**Derivation.** Keep a `visited` array of $n$ booleans. Push $s$ onto a stack. While the stack is not empty, pop a vertex; if it is marked, skip it; otherwise mark it, count it, and push each unmarked neighbor.

**Correctness.** The marking argument in the correctness proof shows that the marked set is exactly the reachable set, so the count and the list are the answer.

**Complexity.** $O(V + E)$ time and $O(V + E)$ auxiliary space for the iterative form, or $O(V)$ space for the recursive form on a graph whose depth is known to be small.

**Common wrong approach.** Marking the vertex when it is pushed and then forgetting the check when it is popped. The result is a vertex that is expanded twice, and on a graph with a triangle the search can revisit the same region forever.

### Problem 2: counting the lakes on a grid

**Restatement.** A field is a grid of $R$ rows and $C$ columns of cells; some cells are water. Two cells of water belong to the same lake if they share a side. Report the number of lakes. Constraints: $1 \le R, C \le 1\,000$, so at most $10^6$ cells.

**Naive baseline.** For every water cell, run a flood fill to find its lake. Each lake is filled once, so the total cost looks like $O(RC)$, but the naive implementation that does not mark cells as it goes repeats the same fill many times, and the version that does mark cells still pays a flood fill per lake.

**Insight.** The grid is an implicit graph: the neighbors of a cell are its four side-adjacent cells. The whole problem is "count the connected components", and a depth-first search with an outer loop over all cells does it in one pass.

**Derivation.** Keep a `visited` array of $RC$ booleans. For every cell in row-major order, if it is water and not visited, start a search from it, count one lake, and mark every cell the search reaches. The search itself is the iterative depth-first search of Problem 1, with the neighbor function replaced by "the four side-adjacent cells that are inside the grid and are water".

**Correctness.** Each search marks exactly the cells of one lake, by the reachability argument. A lake is counted once, when its first cell in row-major order is reached, and its remaining cells are marked, so no later cell starts a second search for the same lake. The count is therefore the number of lakes.

**Complexity.** Each cell is examined a constant number of times and each side is examined a constant number of times, so $O(RC)$ time and $O(RC)$ space.

**Common wrong approach.** Counting a lake when the search _starts_ rather than when it finishes, and also counting it again from a diagonal neighbor. If the problem uses diagonal adjacency, the neighbor function must have eight neighbors and the rule must be applied consistently.

### Problem 3: is the directed graph acyclic?

**Restatement.** A directed graph has $n$ vertices and $m$ directed edges. Report whether it contains a cycle. Constraints: $1 \le n \le 10^5$ and $m \le 2 \cdot 10^5$.

**Naive baseline.** For every vertex, follow the outgoing edges looking for a return to the start. The cost is $O(V(V + E))$, which is far too slow.

**Insight.** The three-state version of the search detects the cycle directly. If a vertex $v$ is examined and one of its neighbors $w$ is _active_, then $w$ is an ancestor of $v$ in the DFS forest, and the edge $v \to w$ closes a cycle.

**Derivation.** Give each vertex a state: $0$ unvisited, $1$ active, $2$ finished. On entry, set the state of $v$ to $1$. For each neighbor $w$: if the state of $w$ is $1$, report a cycle; if it is $0$, recurse on $w$ and then set the state of $w$ to $2$. After the neighbor loop, set the state of $v$ to $2$. Run the search from every unvisited vertex, because a cycle may live in a component that the first search never reaches.

**Correctness.** By the lemma, an active neighbor closes a cycle. In the other direction, take any cycle and let $v$ be the first vertex of it to be discovered. Its predecessor on the cycle is discovered before $v$ and is still active when $v$ is expanded, because the search has not yet returned from the subtree of that predecessor. So the edge to that predecessor is detected. The search therefore reports a cycle if and only if one exists.

**Complexity.** $O(V + E)$ time and $O(V)$ space for the recursive form.

**Common wrong approach.** Running the search only from vertex $1$. If the cycle lies in another component, the answer is wrong. The outer loop over all vertices is not optional.

## Practice progression

1. **Recognition.** Given a statement, decide whether a depth-first search applies. Look for reachability, components, cycles, grids, and implicit graphs. Write down whether the graph is directed.
2. **Direct application.** Implement the iterative search over an adjacency list and the recursive search over the same list. Verify that they mark the same set of vertices.
3. **Adaptation.** Implement the three-state search for cycle detection, and the finish-time search for a topological order of a directed acyclic graph.
4. **Combination.** Use a depth-first search to build a spanning forest, then run a disjoint set union over the forest edges to answer connectivity queries; or use the finish times of a depth-first search as the input to a low-link computation.
5. **Challenge.** Solve a problem on a grid with $10^6$ cells where the recursion depth of the naive solution would exceed the stack, and produce the iterative version.
6. **Transfer.** Use a depth-first search as the engine of a completely different task: enumerating the simple paths of a small graph, finding an Eulerian trail, or extracting the strongly connected components of a directed graph with two searches.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the one property of a vertex that makes a traversal linear rather than exponential? (Key insight)
2. Why does the iterative variant that marks on pop need $O(V + E)$ stack space while the recursive variant needs only $O(V)$? (Complexity analysis)
3. State the invariant of the iterative search and say which part of the proof uses each half of it. (Correctness proof)
4. Why do the recursive and the iterative searches visit the vertices in different orders, and why does the canonical program not print the visit order? (Step-by-step execution)
5. Give a graph on which the recursive form crashes and say what the maximum depth is on that graph. (Recursion decision)
6. What is the smallest change that turns the iterative search into a breadth-first search? (Key insight)
7. In a directed graph, what makes an edge a cycle, and which search state detects it? (Formal model)
8. Why must the search from every unvisited vertex be run when counting connected components? (Worked problems)
9. Which constraint value rules out the adjacency matrix, and which one forces you to use the iterative form? (Recognition patterns)
10. When the marking point changes, which two things change with it? (Common mistakes)

## Further reading

- The queue-based sibling of this traversal is in [breadth-first search](/algorithms/graphs/bfs); the two share a shape and differ in one container.
- The graph representation that every traversal assumes is described in [graph representation](/algorithms/graphs/representation).
- Stacks and queues, and why the choice between them is a statement about the problem, are covered in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
- The finish times of a depth-first search are the raw material of a [topological sort](/algorithms/graphs/topological-sort).
- The recursive form of the same idea, with an explicit stack discipline, is the subject of [backtracking](/algorithms/enumeration/backtracking).
- Every listing in this article, in all six languages, is collected on the [depth-first search source page](/implementations/graphs-dfs/).
