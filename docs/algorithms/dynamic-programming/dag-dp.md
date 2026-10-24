---
id: dynamic-programming.dag-dp
title: Dynamic programming on a directed acyclic graph
summary: Solve a problem whose states form a directed acyclic graph by processing the states in a topological order, so that every state is finished before any state that needs it.
division: [gold]
subjects: [dynamic-programming]
level: intermediate
importance: common-contest-technique
keywords:
    [
        dag dp,
        topological order,
        longest path in a dag,
        acyclic graph,
        dynamic programming on a graph,
        number of paths,
        relaxation in order,
    ]
prerequisites:
    required: [graphs.topological-sort, foundations.complexity]
    recommended:
        [graphs.dfs, graphs.representation, dynamic-programming.0-1-knapsack, foundations.recursion]
complexity:
    time: "O(V + E)"
    space: "O(V)"
assumptions:
    - The states and the transitions between them form a directed acyclic graph.
    - The value of a state is a function of the values of its predecessors, combined by an operation that is associative and monotone in each argument.
    - The graph is available, or can be built, before the computation starts.
reviewed: false
---

## At a glance

A dynamic program on a directed acyclic graph is a dynamic program whose states are the vertices of a graph and whose transitions are the edges. The only new idea is the **order**: because the graph has no cycles, there is an order of the vertices in which every vertex appears after all of its predecessors, and processing the vertices in that order makes every recurrence well defined.

The cost is $O(V + E)$ time and $O(V)$ auxiliary space, once the order is known. The order itself is found by a topological sort, which is $O(V + E)$ by the same kind of argument.

The technique covers a surprising range of problems: the longest path in a directed acyclic graph, the number of paths from a source, the earliest finish time of a project with precedence constraints, the cheapest way to satisfy a set of dependencies, and the longest sequence of comparable pairs of events.

The comparison worth remembering is with the shortest-path algorithms. The longest path problem in a general graph is hard, and in a directed acyclic graph it is linear. The acyclicity is the whole difference.

## Problem motivation

A company schedules four projects. Each project has a duration and a list of projects that must finish before it may start. Project $C$ cannot start until $A$ and $B$ are done, and project $D$ cannot start until $C$ is done. The question is the earliest time at which all four can be finished, and the answer is a number.

The constraints are $n \le 10^5$ projects and $m \le 2 \times 10^5$ dependencies.

The natural formulation is a longest-path problem: give each edge a duration, and the earliest finish time of a project is the longest path from the start to it. The difficulty is not the recurrence. It is the order, because the recurrence for a project refers to the projects it depends on, and there is no reason for those to come first in the input.

A program that processes the projects in the order they are given reads some values before they are computed. The program is wrong in a way that depends on the input order, which is the worst kind of wrong: it passes on some inputs and fails on others.

The topological sort fixes this. It produces an order in which every dependency comes before its dependent, and in that order every recurrence is ready when it is reached. The order is found in $O(V + E)$, and the whole program is linear.

## Recognition patterns

A dynamic program on a directed acyclic graph is the right tool when all of the following hold.

- The states form a **graph**: there are vertices, and there are transitions between them.
- The graph has **no cycles**, or the problem guarantees that a cycle cannot be part of a valid answer.
- The value of a state is determined by the values of its **predecessors**, combined by a rule such as a maximum, a minimum, a sum, or a count.
- The graph is **known before the computation**, so that a single pass in the right order suffices.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| The graph is acyclic | Rules in the technique |
| The graph has cycles but the answer is a shortest path | Rules out the technique; use [Dijkstra](/algorithms/graphs/dijkstra) or [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| The graph has cycles and the answer is a longest path | Rules out the technique; the problem is hard |
| $n, m \le 10^6$ | The linear program is required |
| The dependencies are given as a partial order | A topological sort is exactly what is needed |
| The states are generated on demand rather than given | Rules out the simple form; use memoized search |

The third row is the important one, and it is worth being precise about what "hard" means. The **longest path** problem in a general directed graph with nonnegative edge weights is at least as hard as the longest simple path problem, which is one of the canonical hard problems, and no polynomial algorithm is known for it. In a directed acyclic graph the same problem is linear. So the acyclicity is not a convenience; it is the difference between a solvable problem and an unsolvable one.

Two phrases in a statement point at the technique. "**Prerequisite**", "**depends on**", "**must come after**", and "**before**" describe a partial order. "**Directed**" without "**acyclic**" is a warning that the statement does not promise the order exists, and the program must detect the cycle or the statement is incomplete.

## Naive approach

The baseline relaxes the edges until nothing changes.

```text
repeat n times:
    for each edge (u, v) with weight w:
        if value[v] < value[u] + w:
            value[v] = value[u] + w
```

This is the Bellman-Ford relaxation, and it is correct for any graph without negative cycles. It is also $O(VE)$, which at $n = 10^5$ and $m = 2 \times 10^5$ is $2 \times 10^{10}$ edge examinations. The time limit does not allow it.

The reason the naive program needs $n$ passes is that a single pass processes the edges in the order they are given, and a value computed in one pass may need to be improved in a later pass. In a directed acyclic graph, a topological order removes the need for the second pass, because after the order is fixed every value is final the first time it is computed.

The second baseline is the memoized search, which is instructive because it is the same computation with the order discovered rather than chosen.

```python
def best(v):
    if v in memo:
        return memo[v]
    result = base_value(v)
    for u, w in incoming[v]:
        result = combine(result, best(u) + w)
    memo[v] = result
    return result
```

The recursion works because the graph is acyclic, so it terminates. The problem is the depth: on a chain of $10^5$ vertices it recurses $10^5$ frames deep, which crashes in every language except a C++ program with an enlarged stack.

## Key insight

The insight is that **acyclicity guarantees the existence of an order in which every recurrence is ready when it is reached**, and that the order can be computed in linear time.

The order is the topological order. A topological order of a directed acyclic graph is a permutation of the vertices in which, for every edge $u \to v$, the vertex $u$ appears before the vertex $v$.

::: math definition Definition
A **topological order** of a directed graph $G = (V, E)$ is a bijection
$\pi : V \to \{1, 2, \ldots, |V|\}$ such that for every edge $(u, v) \in E$,
$\pi(u) < \pi(v)$. A directed graph has a topological order if and only if
it has no directed cycle.
:::


::: math definition Definition
The **value** $d(v)$ of a vertex $v$ is defined by a recurrence over the
incoming edges of $v$. For the longest-path recurrence it is
$$
d(v) = \max\bigl(\{d(u) + w(u, v) : (u, v) \in E\} \cup \{0\}\bigr),
$$
with $d(s) = 0$ for a designated source $s$ and $d(v) = -\infty$ for a
vertex with no incoming edge and no source designation.
:::


::: math lemma Lemma
If $G$ is a directed acyclic graph, then in a topological order every
predecessor of a vertex appears before it, so the recurrence for a vertex
can be evaluated when the vertex is reached.
:::


::: math proof Proof
A topological order exists by the definition of acyclicity, and the
definition of a topological order says exactly that the predecessor
precedes the vertex. Every value the recurrence reads has therefore already
been computed. $\square$
:::


::: math invariant Invariant
When the program processes a vertex $v$, every predecessor $u$ of $v$ has
already been processed, and the recorded value $d(u)$ is final. The
recorded value $d(v)$ is the true value of $v$, and it never changes
afterwards.
:::


### Why the order matters

The order is not a convenience; it is what makes the single pass correct. Suppose the program processes the vertices in an arbitrary order and a vertex $v$ is processed before one of its predecessors $u$. Then $d(u)$ is still at its initial value, and the value written into $d(v)$ is too small. The program then never revisits $v$, so the value stays wrong.

The smallest instance of this failure is a chain of two vertices $a \to b$ with a weight of $1$, processed in the order $b$ then $a$. When $b$ is processed, $d(a)$ is still $-\infty$, so $d(b) = -\infty$. The answer is reported as $-\infty$ instead of $1$.

### The relation to memoized search

The memoized search and the topological program compute exactly the same values, and the proof above is the proof of both.

The correspondence is exact. In the memoized search, the value of a vertex is computed the first time it is reached, and it is computed by calling the values of its predecessors, recursively. The set of vertices whose values have been computed when $v$ is computed is the set of vertices that the recursion has already visited, and the recursion visits them in an order in which every predecessor precedes its successor. That order is a reverse topological order, and it is the order the depth-first search produces naturally.

The two programs differ in three ways.

|                 | Memoized search                  | Topological program                |
| --------------- | -------------------------------- | ---------------------------------- |
| Order           | Discovered during the search     | Computed in advance                |
| Recursion depth | Up to $                          | V                                  | $   | Zero |
| Table           | A hash table keyed by the vertex | A flat array indexed by the vertex |

The costs are the same: $O(V + E)$ time, because every edge is examined once and every vertex is computed once. The topological program is preferred in practice for the memory reason and the stack reason, and the memoized search is preferred for the reason that it is shorter and does not need the graph to be given as a separate object.

## Formal model

Let $G = (V, E)$ be a directed acyclic graph with a weight function $w : E \to \mathbb{R}$, and let $s \in V$ be a source.

::: math definition Definition
A **path** in $G$ is a sequence of vertices $v_0, v_1, \ldots, v_k$ with
$(v_{i-1}, v_i) \in E$ for every $i$. Its **length** is
$\sum_{i=1}^{k} w(v_{i-1}, v_i)$. A path is **$s$-rooted** if it starts
at $s$.
:::


::: math definition Definition
The **longest path distance** $\delta(v)$ of a vertex $v$ is the greatest
length of an $s$-rooted path from $s$ to $v$, and it is $-\infty$ when no
such path exists.
:::


::: math recurrence Recurrence
$$
d(v) = \max\bigl(\{d(u) + w(u, v) : (u, v) \in E\} \cup \{-\infty\}\bigr),
\qquad d(s) = 0.
$$
:::


::: math lemma Lemma
The recurrence computes $\delta(v)$ for every vertex $v$, in any order in
which every predecessor precedes its successor.
:::


::: math proof Proof
The proof is an induction on the position of $v$ in the order. For the
source, $d(s) = 0 = \delta(s)$, because the empty path has length zero and
every edge weight is at least zero.

Now let $v$ be a vertex that is not the source, and suppose every predecessor of $v$ already holds its true value. Every $s$-rooted path to $v$ ends with an edge $(u, v)$ for some predecessor $u$, and the part of the path before that edge is an $s$-rooted path to $u$, whose length is at most $\delta(u) = d(u)$. So the length of the path is at most $d(u) + w(u,v)$, and the length of the longest path to $v$ is at most the maximum of those values, which is $d(v)$.

Conversely, let $u$ be a predecessor attaining the maximum. There is an $s$-rooted path to $u$ of length $d(u)$, and appending the edge $(u, v)$ gives an $s$-rooted path to $v$ of length $d(u) + w(u,v) = d(v)$. So the bound is achieved. $\square$
:::


## Algorithm derivation

### Finding the order

The order is found by Kahn's algorithm, which is the one to write because it is iterative and it detects a cycle.

```text
indegree[v] = the number of edges into v, for every vertex v
queue = the vertices with indegree zero
order = the empty list
while the queue is not empty:
    take a vertex v from the queue
    append v to order
    for each edge (v, u):
        indegree[u] = indegree[u] - 1
        if indegree[u] == 0: push u onto the queue
```

The queue holds the vertices whose predecessors have all been processed. When a vertex is taken from the queue, every predecessor of it has already been taken, so the order is a topological order.

The alternative is a depth-first search that appends a vertex to the order when its recursion finishes. That is the same order, and it is the order the memoized search discovers anyway.

### The evaluation

```text
for each vertex v: d[v] = -infinity
d[s] = 0
for each vertex v in the topological order:
    for each edge (v, u) with weight w:
        if d[v] + w > d[u]:
            d[u] = d[v] + w
```

The relaxation is the same one that Bellman-Ford performs, and it is performed once per edge. The topological order is what makes the single pass sufficient.

### The variants

Three variants cover most of the problems.

- **Longest path.** Take the maximum instead of the minimum, and initialize the non-source vertices to $-\infty$ rather than $+\infty$.
- **Number of paths.** Take the sum instead of the maximum, and initialize $d[s] = 1$ and every other vertex to $0$. The answer is $d(t)$, and every addition is reduced modulo a prime if the count is large.
- **Minimum cost.** Take the minimum, with $+w$ replaced by $-w$ and the edge weights negated, or use the maximum of $-w$ added to the value.

## Step-by-step execution

Take the graph

| Edge      | Weight |
| --------- | ------ |
| $s \to a$ | 3      |
| $s \to b$ | 2      |
| $b \to a$ | 4      |
| $a \to c$ | 5      |
| $b \to c$ | 1      |

with the source $s$, and ask for the longest path distance of every vertex.

The in-degrees are $0$ for $s$, $2$ for $a$ (the edges $s \to a$ and $b \to a$), $1$ for $b$, and $2$ for $c$. The queue starts with $s$, and the order is built as follows.

| Step | Vertex taken | In-degrees after the update | Order so far |
| ---- | ------------ | --------------------------- | ------------ |
| 1    | $s$          | $a : 1$, $b : 0$, $c : 2$   | $s$          |
| 2    | $b$          | $a : 0$, $c : 1$            | $s, b$       |
| 3    | $a$          | $c : 0$                     | $s, b, a$    |
| 4    | $c$          | unchanged                   | $s, b, a, c$ |

Any order in which $b$ precedes $a$ (because of the edge $b \to a$), and $a$ and $b$ both precede $c$, is a topological order. The order built above is one of them.

Now the evaluation, in the order $s, b, a, c$.

| Vertex | Edges out | Relaxations | Values after |
| --- | --- | --- | --- |
| $s$ | $s \to a$ (3), $s \to b$ (2) | $d(a) = 0 + 3 = 3$, $d(b) = 0 + 2 = 2$ | $d(s)=0$, $d(a)=3$, $d(b)=2$, $d(c)=-\infty$ |
| $b$ | $b \to a$ (4), $b \to c$ (1) | $d(a) = \max(3, 2 + 4) = 6$, $d(c) = 2 + 1 = 3$ | $d(a)=6$, $d(c)=3$ |
| $a$ | $a \to c$ (5) | $d(c) = \max(3, 6 + 5) = 11$ | $d(c)=11$ |
| $c$ | none |  | $d(c)=11$ |

The final values are $0, 6, 2, 11$ for $s, a, b, c$. The longest path to $c$ is $s \to b \to a \to c$, of length $2 + 4 + 5 = 11$. The other two paths to $c$, of lengths $3 + 5 = 8$ and $2 + 1 = 3$, are both shorter.

The relaxation of $b \to a$ is the interesting one. The value $d(a)$ was already $3$, and it becomes $6$. The program is allowed to change a value that was computed earlier, because the order guarantees only that the _predecessors_ of a vertex are final when the vertex is processed, not that the value of a vertex is final when it is written. The value $d(a)$ is final after $a$ is processed, because every predecessor of $a$ has been processed by then.

Now the wrong order. The order $s, a, b, c$ is **not** a topological order, because it puts $a$ before $b$ and the edge $b \to a$ requires the opposite. Processing the vertices in it gives: $s$ sets $d(a) = 3$ and $d(b) = 2$; $a$ relaxes $a \to c$ and sets $d(c) = 3 + 5 = 8$; then $b$ relaxes $b \to a$ and improves $d(a)$ to $2 + 4 = 6$, but $a$ has already been processed, so its outgoing edge is never relaxed again with the improved value. The program ends with $d(c) = 8$, and the true value is $11$.

That is the failure the topological order prevents, and it is subtler than the obvious one. The program does not read a value that is still $-\infty$; it reads a value that is final but not yet _known_ to be final, because the vertex that would have improved it had not been processed yet.

## Correctness proof

::: math theorem Theorem
Let $G$ be a directed acyclic graph with a source $s$ and a weight
function $w$. The program that processes the vertices in a topological
order and relaxes every edge exactly once computes the longest path
distance $\delta(v)$ for every vertex $v$.
:::


::: math proof Proof
The proof is an induction on the position of the vertex in the topological
order.

**Base case.** The first vertex in a topological order has no incoming edges, so it can only be a source. Its value is set to $0$ and never changed, and the longest path distance of a source is $0$, since the empty path has length zero and every edge weight is nonnegative.

**Inductive step.** Let $v$ be a vertex other than the first, and suppose every vertex before $v$ holds its true longest path distance. When $v$ is processed, every predecessor $u$ of $v$ is before $v$ in the order, so $d(u) = \delta(u)$ at that moment.

Every $s$-rooted path to $v$ ends with an edge $(u, v)$, and the prefix of that path to $u$ is an $s$-rooted path, so its length is at most $\delta(u) = d(u)$. Therefore the length of the longest path to $v$ is at most $\max_{u} (d(u) + w(u,v))$.

Conversely, the program has relaxed every edge $(u, v)$ by the time it reaches $v$, because $u$ is before $v$ in the order. The value $d(v)$ at that moment is therefore the maximum of $d(u) + w(u,v)$ over the predecessors that have been processed, which is the maximum over all of them, because every predecessor has been processed. For the predecessor $u$ attaining the maximum, there is an $s$-rooted path to $u$ of length $d(u)$, and appending the edge gives an $s$-rooted path to $v$ of length $d(u) + w(u,v)$. So the bound is achieved.

Hence $d(v) = \delta(v)$ when $v$ is processed, and no later relaxation can change it, because every edge into $v$ has already been relaxed. The induction closes. $\square$
:::


::: math theorem Theorem
The vertex order produced by Kahn's algorithm is a topological order, and
the algorithm detects a cycle.
:::


::: math proof Proof
A vertex is appended to the order only when its in-degree reaches zero,
which happens only after every edge into it has been removed, which happens
only after every predecessor has been appended. So every predecessor
precedes the vertex, which is the definition of a topological order.

If the graph has a cycle $v_1 \to v_2 \to \cdots \to v_k \to v_1$, then no vertex of the cycle can ever reach in-degree zero, because the edge from the previous vertex of the cycle is still present. So the algorithm stops with the cycle unprocessed, and the number of vertices it processed is smaller than $|V|$. Checking that the order has $|V|$ entries is therefore a cycle detection. $\square$
:::


## Complexity analysis

| Quantity | Cost |
| --- | --- |
| Topological sort | $O(V + E)$ time, $O(V)$ space |
| The evaluation, one relaxation per edge | $O(V + E)$ time, $O(V)$ space for the values |
| The whole program | $O(V + E)$ time, $O(V + E)$ space including the graph |
| The memoized search instead | $O(V + E)$ time, $O(V)$ space, plus a stack of depth up to $ | V | $ |

The graph itself is usually the largest object, so the honest total is $O(V + E)$ space when the adjacency list is counted.

The linear bound is the reason the technique is worth learning. The naive relaxation is $O(VE)$, and the factor of $V$ is exactly the number of passes that the topological order removes.

One caveat belongs here. The topological sort is $O(V + E)$ only when the graph is given as an adjacency list. If the graph is given implicitly, as a grid whose neighbors are computed on demand, the constant grows but the bound does not change.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The longest path in a directed acyclic graph | This technique, $O(V + E)$ |
| The number of paths from a source to a target | This technique, with a sum and a base case of $1$ |
| The earliest finish time of a set of dependent tasks | This technique, with a maximum |
| The cheapest way to satisfy a set of dependencies | This technique, with a minimum |
| The shortest path with nonnegative weights | [Dijkstra](/algorithms/graphs/dijkstra), which does not need acyclicity |
| The shortest path with possibly negative weights | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| The longest path in a general graph | Not this technique; the problem is hard |
| A tree | This technique, since a tree is acyclic, or [tree dynamic programming](/algorithms/trees/tree-dp) |
| A graph that may have cycles but the answer is a shortest path | The shortest-path algorithms, not this one |

The sixth and the seventh rows are the pair that decides the technique. A shortest path in a general graph is a [Dijkstra](/algorithms/graphs/dijkstra) problem, and a longest path in a general graph is not solvable in polynomial time by any known method. Changing "shortest" to "longest" in a statement is the moment to check whether the graph is acyclic.

## Recursion decision

The memoized search is the recursive form, and its depth is the length of the longest path in the graph, which is at most $|V|$. On a chain of $10^5$ vertices it is $10^5$ frames deep, and that is past the limit in every language.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the recursive form is exactly at the edge |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of $1000$ | Iterative; the recursive form overflows for a chain longer than $1000$ |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The iterative form is the right answer in every language, and it is preferred for a second reason that has nothing to do with the stack: the topological order is a **byproduct** of the iterative sort, and it can be used for other things, such as reporting the order itself, or grouping the vertices into layers.

There is one recursive formulation that is safe and occasionally useful: the **divide and conquer** evaluation, which splits the graph into two halves at a vertex of the topological order and combines the two halves. Its depth is $O(\log |V|)$, which is safe everywhere, and it is the basis of the parallel evaluation of a very large dependency graph. It is not the right answer for a contest, where the iterative program is simpler.

## Implementation walkthrough

The two lines that matter are the decrement of the in-degree and the condition that pushes a vertex.

```cpp
for (int u : graph[v]) {
    if (--indegree[u] == 0) {
        queue.push(u);      // every predecessor of u has now been processed
    }
}
```

The decrement must happen for **every** outgoing edge, and the push must happen exactly when the in-degree reaches zero. Pushing on `<= 0` would push a vertex twice, and pushing before the decrement would push it too early.

The relaxation is the second line that matters.

```cpp
if (dist[v] != NEG_INF) {
    dist[u] = max(dist[u], dist[v] + weight);
}
```

The guard on the unreachable value is not optional. Without it, the program adds the weight to $-\infty$ and stores a value that is not $-\infty$, so the vertex looks reachable with a meaningless distance, and every later comparison against it is wrong.

The initialization is the third detail.

```cpp
dist[source] = 0;
for (int v = 0; v < n; ++v) {
    if (v != source) dist[v] = NEG_INF;
}
```

The order of the two statements matters: setting the source to zero after the loop would overwrite it with $-\infty$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Processing the vertices in the input order | The answer is wrong for some inputs and right for others | Compute a topological order first |
| Relaxing a vertex whose predecessor is still $-\infty$ | A meaningless distance is stored | Guard the relaxation on reachability |
| Setting the source to zero after the loop | The source looks unreachable | Initialize the source first |
| Using $0$ instead of $-\infty$ for the longest-path version | Unreachable vertices look reachable with distance zero | Use a true negative infinity |
| Forgetting to decrement the in-degree for every edge | A vertex is never processed, and the order is incomplete | Decrement inside the edge loop |
| Pushing a vertex when the in-degree becomes negative | The vertex is processed twice | Push only on an exact zero |
| Assuming a topological order exists | The program processes fewer vertices than it should | Check that the order has $ | V | $ entries |
| Using the sum for a longest-path problem | The program computes the total of all edges, not the longest chain | Match the operation to the question |
| Computing the order but forgetting to relax the edges | Every value stays at its initial value | The order and the evaluation are two steps |

### Why this fails: the one pass in the wrong order

The plausible wrong approach is to relax every edge once, in the order the edges are given, and take the result. It is correct on a graph whose edges happen to be listed in a usable order, and it is wrong on a graph whose edges are not.

The smallest counterexample is a graph with two vertices and one edge.

| Edge      | Weight |
| --------- | ------ |
| $a \to b$ | 1      |

The vertices are given in the order $b, a$, and the single edge is processed once. When the edge $a \to b$ is relaxed, the value of $a$ is still $-\infty$, so the value of $b$ stays $-\infty$. The program reports that $b$ is unreachable from $a$, when the path $a \to b$ exists and has length $1$.

The mechanism is exact. A single pass computes the value of a vertex from the values of its predecessors as they were when the edge was relaxed. If a predecessor has not been processed, its value is the initial one, and the relaxation contributes nothing useful. The program never revisits the vertex, so the error is permanent.

Adding a second pass would fix this instance, and that is precisely the point: the number of passes needed is the length of the longest path, and a topological order makes it exactly one. A program that loops until nothing changes is correct, and it is $O(VE)$ because the number of passes is the length of the longest chain, which is $O(V)$.

The lesson generalizes: **a single pass over a recurrence is correct only when the processing order makes every dependency ready.** The topological order is the guarantee, and the check that the order has $|V|$ entries is the guarantee that it exists.

## Variants and extensions

- **Counting paths.** Replace the maximum with a sum and the source value of $0$ with $1$. Every addition is reduced modulo a prime.
- **The earliest finish time.** Give each vertex a duration instead of the edges, and take the maximum of the predecessors' finish times plus the duration. This is the critical path method.
- **Parallel layers.** The topological order also gives a layering: a vertex's layer is one more than the maximum layer of its predecessors. The layers are the rounds of a parallel schedule.
- **Topological sorting of a dependency graph with a cycle.** A cycle means the dependencies are inconsistent. Kahn's algorithm detects it by producing fewer than $|V|$ vertices, and the vertices left over are in or after the cycle.
- **The transitive closure.** The set of vertices reachable from $v$ is computable by one pass in the reverse topological order, and the bitset version computes the closure of every vertex in $O(V \cdot |V| / 64)$ time.
- **The state graph.** A dynamic program over the _states_ of another computation is a dynamic program on a directed acyclic graph, provided the state transitions are acyclic. This is how many board game and puzzle problems are solved.
- **The layers of a Kahn's algorithm as a scheduling.** The order in which the algorithm takes the vertices from the queue is a valid schedule of independent tasks, and it is a natural greedy choice for a problem that asks for a schedule.

## Contest strategy

1. Check that the graph is acyclic before anything else. A statement that says "directed" but not "acyclic" may still be promising acyclicity in the constraints, and a statement that promises acyclicity says so in the first line.
2. Decide what the state of each vertex is, and write the recurrence for one vertex in one line. "The earliest finish time is the maximum over the predecessors' finish times plus the duration" is the sentence that produces the code.
3. Compute the topological order first, and check that it has as many vertices as the graph. A short order means a cycle.
4. Decide the initial value carefully. The longest-path version needs $-\infty$; the shortest-path version needs $+\infty$; the counting version needs $0$ everywhere and $1$ at the source.
5. Use a real infinity rather than a large negative number, and guard every relaxation on reachability.
6. If the graph is given implicitly, write a `for_each_edge` helper rather than building the adjacency list, and keep the topological sort on the same helper so the two cannot disagree.
7. When the answer is a count, reduce modulo the given prime after every addition.
8. If a shortest path in a general graph is what is wanted, stop and use [Dijkstra](/algorithms/graphs/dijkstra). The acyclic technique is not a generalization of it.

## Worked problems

### Problem 1: the earliest finish time

**Restatement.** There are $n \le 10^5$ tasks. Each task has a duration, and each task lists the tasks that must finish before it starts. Every dependency is satisfiable, so the graph is acyclic. Report the earliest time at which all tasks can be finished.

**Naive baseline.** Relax the edges until nothing changes, which is $O(VE) = 2 \times 10^{10}$ edge examinations.

**Insight.** The dependencies form a partial order, and a topological order of it is a schedule in which every task can be started.

**Derivation.** Compute the topological order with Kahn's algorithm. Set the finish time of every task with no predecessors to its own duration. Then, in the topological order, set the finish time of a task to its duration plus the maximum of the finish times of its predecessors.

**Correctness.** The induction on the topological order in the correctness proof applies with the vertex values replaced by finish times: the finish time of a task is its duration plus the latest finish of the tasks it waits for, and the maximum over the predecessors is the latest one.

**Complexity.** $O(V + E)$ time and $O(V + E)$ space including the graph. At the maximum constraints that is a few hundred thousand operations, which is well inside any time limit.

**Common wrong approach.** Processing the tasks in the order they are given, which produces a wrong answer for some inputs and the right one for others, as the two-vertex counterexample in the common mistakes section shows.

### Problem 2: the number of routes

**Restatement.** There are $n \le 10^5$ intersections and $m \le 2 \times 10^5$ one-way roads. The graph is acyclic. Report the number of routes from intersection $1$ to intersection $n$, modulo $10^9 + 7$.

**Naive baseline.** Enumerate the routes, which is exponential in the number of merges.

**Insight.** The number of routes to a vertex is the sum of the numbers of routes to its predecessors, and the sum does not care which route was taken, only how many there were.

**Derivation.** Compute the topological order. Set the count of the source to $1$ and every other count to $0$. In the topological order, for each edge $u \to v$, add the count of $u$ to the count of $v$, reducing modulo $10^9 + 7$.

**Correctness.** Every route to $v$ ends with an edge $u \to v$, and deleting that edge gives a route to $u$. The map from the routes to $v$ to the pairs (predecessor, route to the predecessor) is a bijection, so the count is the sum of the counts of the predecessors. The topological order guarantees that all of them are final when the sum is taken.

**Complexity.** $O(V + E)$ time and $O(V)$ space for the counts. Every addition is a single reduction, and the reduction is what keeps the count inside a machine word.

**Common wrong approach.** Forgetting that the source's count is $1$ and not $0$. A count of $0$ at the source means every other count is $0$ and the answer is $0$, which is a plausible-looking number rather than an error.

### Problem 3: the longest chain of comparisons

**Restatement.** There are $n \le 10^5$ people, and a set of pairs $(a, b)$ meaning that $a$ is taller than $b$. The pairs are consistent, so the relation is a partial order. Report the length of the longest chain of people, and the number of such chains modulo $10^9 + 7$.

**Naive baseline.** Sort the people by height and search, or run a longest-path program with $O(VE)$ relaxation.

**Insight.** The taller-than relation is acyclic, because a cycle would say that someone is taller than themselves. The graph of the pairs is therefore a directed acyclic graph, and the chains are the paths in it.

**Derivation.** Build the graph with an edge $b \to a$ for each pair $(a, b)$, compute a topological order, and then compute the longest path in the order. For the count, keep a second array and add the counts of the predecessors as well.

**Correctness.** A chain of people is exactly a path in the graph, and the acyclicity of the graph follows from the consistency of the relation. The longest path program therefore applies, and the counting variant of the same recurrence applies to the number of chains.

**Complexity.** $O(V + E)$ time and $O(V)$ space, where $E$ is the number of given pairs.

**Common wrong approach.** Treating the tallest person as a single source and assuming every chain passes through them. A chain need not include the tallest person at all, so the answer for a chain that omits them is not counted by a program that starts only from them.

## Practice progression

1. **Recognition.** Given a statement, decide whether the relations form a partial order, and write the recurrence for one vertex in one line.
2. **Direct application.** Implement the topological sort and the evaluation, and check them against a brute-force search over all paths on a graph with ten vertices.
3. **Adaptation.** Write the counting version, the minimum version, and the version that reports the layers of the schedule.
4. **Combination.** Combine the topological order with a [segment tree](/algorithms/range-queries/segment-tree) for a version with point updates, and with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) for a version with a range query inside the recurrence.
5. **Challenge.** Evaluate a dependency graph with $10^6$ vertices in parallel by layers, and report the depth of the critical path.
6. **Transfer.** Recognize a state graph in a different problem: a puzzle whose moves form a directed acyclic graph, a scheduling problem with release times, or a shortest path in a graph whose edges are known to be acyclic.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. What is a topological order, and what does acyclicity guarantee? (Formal model)
2. Why does the order matter, and what is the smallest graph on which the wrong order gives a wrong answer? (Key insight)
3. How does the memoized search relate to the topological program? (Key insight)
4. State the longest-path recurrence and say where the $-\infty$ initialization is needed. (Algorithm derivation)
5. How does Kahn's algorithm detect a cycle? (Correctness proof)
6. What is the time bound of the whole program, and what does the naive relaxation cost instead? (Complexity analysis)
7. Why is the value of a vertex allowed to change after the vertex has been processed? (Step-by-step execution)
8. What breaks if the relaxation is not guarded on reachability? (Implementation walkthrough)
9. When must a shortest path in a general graph use a different algorithm? (Algorithm selection)
10. In which languages does the recursive form overflow, and on what input? (Recursion decision)
11. How does the counting variant differ from the longest-path variant, in the recurrence and in the initialization? (Variants and extensions)

## Further reading

- The subject index lists this technique, [dynamic programming on a directed acyclic graph](/algorithms/dynamic-programming/dag-dp), beside the other dynamic programs in the encyclopedia.
- The ordering that the technique depends on is in [topological sort](/algorithms/graphs/topological-sort).
- The shortest-path algorithm that does not need acyclicity is in [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The relaxation that this technique does in one pass, done in many passes, is in [Bellman-Ford](/algorithms/graphs/bellman-ford).
- The same technique applied to a tree, where the order is the depth-first order, is in [tree dynamic programming](/algorithms/trees/tree-dp).
- The dynamic program that replaces a backtracking search when the constraints involve a global property is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The state graph of a search, where the acyclicity comes from a measure that decreases at every step, is the idea behind [bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp).
- The recursion whose depth is the problem here is described in [recursion](/algorithms/foundations/recursion).
