---
id: graphs.topological-sort
title: Topological sort
summary: A linear order of the vertices of a directed acyclic graph in which every edge points forward.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [topological sort, toposort, "Kahn's algorithm", dag, scheduling, cycle detection]
prerequisites:
    required: [graphs.representation]
    recommended: [graphs.dfs, graphs.bfs]
complexity:
    time: "O(V + E)"
    space: "O(V)"
assumptions:
    - The graph is directed.
    - The graph has no directed cycle, unless detecting a cycle is the goal.
reviewed: false
---

## Problem motivation

A school wants to publish the course schedule for the coming term. Some courses require others: _Calculus II_ requires _Calculus I_, and _Linear Algebra_ requires both. The school wants a list of all the courses in an order in which every course appears after the courses it requires.

The constraints:

- $1 \le n \le 100\,000$ courses.
- $0 \le m \le 200\,000$ prerequisite relations.
- A course may require several others, and several courses may require the same one.

Two questions hide in the request. The first is the ordering itself. The second is the possibility that the requirements contradict each other: if _Calculus I_ requires _Calculus II_ and _Calculus II_ requires _Calculus I_, no schedule exists, and a program that produces one anyway has produced nonsense.

Both questions have the same answer. A graph of prerequisites is a directed graph, an order in which every edge points forward is a _topological order_, and such an order exists exactly when the graph has no directed cycle.

## Recognition patterns

A topological sort is the right tool when all of the following hold.

- The problem states a set of **precedence** constraints: _must come before_, _requires_, _depends on_, _is a prerequisite of_.
- The constraints are expressed as a **directed graph** and the answer is an **ordering** of the vertices.
- The graph is **acyclic**, or the problem asks whether it is.
- The order itself is not important, only the fact that it satisfies every constraint, which is the common case.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The relations are directed and must be respected | Rules in a topological sort |
| The relations are symmetric | Rules it out; an undirected graph has no order to respect |
| The graph is a directed acyclic graph | Rules in a topological sort, in linear time |
| The graph may contain a cycle | Rules in a topological sort as a _cycle test_ |
| The graph is undirected | Rules it out; use [breadth-first search](/algorithms/graphs/bfs) or [depth-first search](/algorithms/graphs/dfs) for cycle detection |
| $n, m \le 10^5$ | One sort is comfortable |
| The order must be lexicographically smallest | Rules in a heap instead of a queue |

Two phrases in a statement are reliable signals. "Before", "requires", "prerequisite", "depends on" and "must be built first" all point at a topological sort. "Undirected", "connected" and "neighbor" point away from it, because an undirected graph has no direction to respect.

<Synonyms terms="topological sort, toposort, kahn's algorithm, topological ordering, dag ordering" />

## Naive approach

The first baseline is the repeated scan. Repeatedly scan every vertex that has not been placed yet, find one whose prerequisites have all been placed, and put it next.

```text
order = empty
remaining = every vertex
while remaining is not empty:
    for each vertex v in remaining:
        if every predecessor of v is already in order:
            append v to order
            remove v from remaining
            break
    if no vertex was appended:
        the constraints are contradictory
```

This is correct, and it is exactly the algorithm the efficient version generalizes. Its cost is the scan: each round inspects up to $V$ vertices and checks up to $E$ edges, and there are up to $V$ rounds, so the total is $O(V(V + E)) = O(V^2 + VE)$. At $n = 10^5$ that is $10^{10}$ operations.

The second baseline is the topological sort by repeated depth-first search, which costs $O(V + E)$ but requires the recursive depth-first search, and therefore the call stack, to hold a path of the graph.

## Key insight

The insight is that a directed acyclic graph always has a vertex with no incoming edge.

Suppose every vertex had an incoming edge. Start at any vertex and follow incoming edges backwards. Each vertex has one, so the walk never stops, and since the graph is finite it must revisit a vertex, which gives a directed cycle. That contradicts the acyclicity, so some vertex has in-degree zero.

That vertex can be placed first, because it depends on nothing. Remove it and its outgoing edges, and the remaining graph is still acyclic, so the argument repeats. Every vertex is eventually placed, and the order that results respects every edge.

This is Kahn's algorithm, and the only thing it adds to the naive scan is a bookkeeping device: instead of rescanning every vertex to find the ones whose in-degree has fallen to zero, it maintains the in-degrees and a queue of the vertices that have just reached in-degree zero. A vertex reaches in-degree zero exactly when its last predecessor is placed, so the queue is the list of the vertices that are now available, and nothing is ever scanned twice.

The second variant uses the structure of a depth-first search instead. Every directed acyclic graph has a vertex that can be placed last, and a depth-first search finds one for free: the vertex that finishes first can be placed last, because everything it points to finishes before it. Reversing the finish order gives a topological order.

## Formal model

Let $G = (V, E)$ be a directed graph.

::: math definition Definition
A **topological order** of $G$ is a sequence $v_1, v_2, \ldots, v_{|V|}$ of the vertices of $G$, each appearing exactly once, such that for every edge $(u, v) \in E$ the vertex $u$ appears before $v$ in the sequence.
:::

::: math definition Definition
A directed graph is **acyclic** if it contains no directed cycle. A **directed cycle** is a sequence of edges $v_0 \to v_1 \to \cdots \to v_k \to v_0$ with all the vertices distinct.
:::

::: math definition Definition
The **in-degree** of a vertex $v$ is the number of edges of $G$ that point into $v$. The in-degree of $v$ in the graph with a set $S$ of vertices removed is the number of its predecessors that are not in $S$.
:::

::: math theorem Theorem
A directed graph has a topological order if and only if it has no directed cycle.
:::

::: math lemma Lemma
Every nonempty directed acyclic graph has a vertex of in-degree zero.
:::

::: math lemma Lemma
Let $v$ be a vertex of in-degree zero in a directed acyclic graph. The graph with $v$ removed is still acyclic, and every topological order of the remaining graph that is prefixed by $v$ is a topological order of the whole graph.
:::

## Algorithm derivation

The state is an in-degree array `indegree` of $V$ entries, a queue of the vertices whose in-degree is zero, and the output list.

The update rule has two halves. When a vertex $v$ is taken from the queue and appended to the output, the in-degree of every vertex $w$ with an edge $v \to w$ is decreased by one, and any vertex whose in-degree becomes zero is appended to the queue.

The update is correct because of the lemma about in-degree zero. A vertex whose in-degree has fallen to zero has had all of its predecessors placed, so appending it to the output respects every edge that points into it. The edges that point out of it are handled when it is placed.

The initialization is the other half: the in-degree of each vertex is the number of edges pointing into it in the original graph, and the queue starts with the vertices whose in-degree is zero. If the queue starts empty while vertices remain, the graph has a cycle, by the lemma.

The depth-first variant keeps three states per vertex instead of the in-degree array. A vertex is unvisited, active (on the current path) or finished. The algorithm pushes a vertex onto the output list when it finishes, and the answer is the output list reversed.

::: math invariant Invariant
For Kahn's algorithm, at every moment the output list is a sequence in which every vertex appears after all of its predecessors that have been placed, and the queue holds exactly the unplaced vertices whose in-degree is zero. For the depth-first variant, the output list holds exactly the vertices that have finished, and every edge points from a later-finishing vertex to an earlier-finishing one, unless a cycle has been found.
:::

## Step-by-step execution

Take the directed graph on vertices $0, 1, 2, 3, 4$ with the edges $0 \to 1$, $0 \to 2$, $1 \to 3$, $2 \to 3$ and $3 \to 4$.

The in-degrees are $0$ for vertex $0$, $1$ for vertices $1$, $2$ and $4$, and $2$ for vertex $3$. The queue starts as $[0]$.

1. Take $0$ from the queue and append it to the order. The order is $[0]$. Decrease the in-degree of $1$ to $0$ and enqueue it; decrease the in-degree of $2$ to $0$ and enqueue it. The queue is $[1, 2]$.
2. Take $1$ and append it. The order is $[0, 1]$. Decrease the in-degree of $3$ to $1$, which is not zero, so nothing is enqueued. The queue is $[2]$.
3. Take $2$ and append it. The order is $[0, 1, 2]$. Decrease the in-degree of $3$ to $0$ and enqueue it. The queue is $[3]$.
4. Take $3$ and append it. The order is $[0, 1, 2, 3]$. Decrease the in-degree of $4$ to $0$ and enqueue it. The queue is $[4]$.
5. Take $4$ and append it. The order is $[0, 1, 2, 3, 4]$ and the queue is empty.

All five vertices were placed, so the graph is acyclic, and the order $[0, 1, 2, 3, 4]$ respects every edge.

The depth-first variant on the same graph gives a different order. Starting at $0$, it visits $1$, then $3$, then $4$, which finishes first. Vertex $3$ finishes next, then $1$, then it backtracks to $0$, visits $2$, finds that $3$ is already finished, and finishes $2$ and then $0$. The finish order is $4, 3, 1, 2, 0$, and the reversed order is $[0, 2, 1, 3, 4]$. That order is also valid, and the difference between the two outputs is worth noticing: **a topological order is not unique**, and a problem statement that asks for "a" valid order accepts either. A statement that asks for a specific one has to say which, and usually means the lexicographically smallest.

### The graph with a cycle

Now take the directed graph on vertices $0, 1, 2, 3, 4$ with the edges $0 \to 1$, $1 \to 2$, $2 \to 0$, and $4 \to 3$. Vertices $0$, $1$ and $2$ form a directed cycle.

Kahn's algorithm computes the in-degrees: $0$ has one incoming edge from $2$, $1$ has one from $0$, $2$ has one from $1$, $3$ has one from $4$, and $4$ has none. The queue starts as $[4]$.

1. Take $4$ and append it. The order is $[4]$. Decrease the in-degree of $3$ to $0$ and enqueue it. The queue is $[3]$.
2. Take $3$ and append it. The order is $[4, 3]$. Vertex $3$ has no outgoing edges, so the queue is now empty.
3. The queue is empty and only two of the five vertices were placed. The remaining vertices $0$, $1$ and $2$ form the cycle, and the algorithm reports that the graph is cyclic.

The depth-first variant detects the same cycle. Starting at $0$, it visits $0$, then $1$, then $2$, and when it examines the edge $2 \to 0$ it finds that $0$ is _active_, that is, on the current path. An edge to an active vertex closes a directed cycle, and the algorithm reports it.

The two variants detect the cycle in different ways and at different moments, but they agree on the answer, and they agree on the vertices involved: the cycle is $0 \to 1 \to 2 \to 0$ in both.

## Correctness proof

::: math theorem Theorem
If Kahn's algorithm places every vertex, the resulting order is a topological order. If it places fewer than $|V|$ vertices, the graph contains a directed cycle.
:::

::: math proof Proof
The first claim is by induction on the length of the output list. The list is empty, so the claim holds. Suppose the list is a sequence in which every placed vertex appears after all of its predecessors that are placed, and let $v$ be the next vertex taken from the queue. The queue holds only the unplaced vertices whose in-degree, counting only the unplaced predecessors, is zero. Every predecessor of $v$ that is unplaced is counted in that in-degree, so the count being zero means that no unplaced vertex points into $v$. Every predecessor of $v$ has therefore already been placed, and appending $v$ preserves the claim.

For the second claim, suppose the queue becomes empty while some vertices remain unplaced. Every remaining vertex then has at least one incoming edge from another remaining vertex, because a vertex whose remaining in-degree is zero would have been enqueued when its last remaining predecessor was placed. Starting at any remaining vertex and following an incoming edge backwards never stops, and the graph is finite, so some vertex repeats. The repeated part of the walk is a directed cycle. $\square$
:::

::: math theorem Theorem
If the graph is acyclic, the reverse of the finish order of a depth-first search is a topological order.
:::

::: math proof Proof
Let $u \to v$ be an edge. Suppose, for a contradiction, that $u$ finished before $v$. The search starts at $u$ or reaches $u$ first, and it explores every vertex reachable from $u$ before it finishes $u$. The vertex $v$ is reachable from $u$ along the edge $u \to v$, so $v$ was visited before $u$ finished, and it could not have finished before $u$ did, because a vertex finishes only after every vertex reachable from it has finished. So $v$ finishes after $u$, which is a contradiction.

Therefore, for every edge $u \to v$, the vertex $v$ finishes before $u$. Reversing the finish order therefore places $u$ before $v$ for every edge, which is the definition of a topological order. $\square$
:::

The second proof is the one that shows why the depth-first variant needs the three states. Without them, the search cannot tell "I have already been here" from "I am on the path in front of me", and the distinction is exactly what a cycle is.

## Complexity analysis

**Time: $O(V + E)$ for both variants.** For Kahn's algorithm, each vertex is enqueued at most once and appended to the order at most once, so the queue operations total $O(V)$, and each edge is examined once when its tail is placed, so the edge examinations total $O(E)$. For the depth-first variant, each vertex is entered and finished once and each edge is examined once, which is the same bound as every other traversal.

**Auxiliary space: $O(V)$.** The in-degree array and the state array hold one entry per vertex, and the queue holds at most one entry per vertex. The graph itself is $O(V + E)$.

::: math complexity Complexity
Topological sort by Kahn's algorithm: time $O(V + E)$, auxiliary space $O(V)$ beyond the adjacency list. The depth-first variant has the same bounds, and the recursive depth-first variant additionally uses $O(V)$ of call stack.
:::

Two practical warnings belong here. First, the depth-first variant needs the recursion depth to hold a path of the graph, which can be $V$ frames deep; the iterative form with an explicit stack is the safe one. Second, if the order must be lexicographically smallest, the queue becomes a min-heap and the running time becomes $O(V + E + V \log V)$.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Order the vertices so that every edge points forward | Kahn's algorithm or the depth-first variant |
| Does a directed graph contain a cycle | Kahn's algorithm, or a three-state [depth-first search](/algorithms/graphs/dfs) |
| Does an undirected graph contain a cycle | [Depth-first search](/algorithms/graphs/dfs) or [breadth-first search](/algorithms/graphs/bfs) |
| Earliest start time of each task | A topological order, then a longest-path pass |
| Cheapest path in a directed acyclic graph | A topological order, then relaxation |
| The lexicographically smallest valid order | Kahn's algorithm with a min-heap |
| Cheapest path, weights zero or one | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Cheapest path with arbitrary weights | [Dijkstra](/algorithms/graphs/dijkstra) |
| Which vertices are reachable | [Depth-first search](/algorithms/graphs/dfs) or breadth-first search |

The row that catches people is the second. Kahn's algorithm answers "is this graph acyclic" as a byproduct of its own failure: if the queue empties before every vertex is placed, the graph has a cycle. That is often cheaper than writing a separate cycle detector, and it produces the offending vertices as a byproduct.

## Recursion decision

The depth-first variant is the one that raises the question, and the answer is the same as it is for every other traversal in this encyclopedia: use the iterative form when the depth of the graph is not bounded.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative once $V$ can exceed $10^5$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative unless the depth is provably small |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash rather than a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

::: math counterexample Counterexample
Consider a directed path on $10^6$ vertices, that is, the chain $0 \to 1 \to 2 \to \cdots \to 10^6 - 1$, and the depth-first variant of the topological sort. The graph is acyclic, the constraints are met, and the answer is the reverse of the chain. The recursive form makes $10^6$ nested calls, each with a frame holding a loop index and a pointer to the adjacency list. In C++ on Linux, with an 8 MB stack and a frame of roughly 64 bytes, the stack is exhausted after about $130\,000$ frames, so the program dies with a segmentation fault before it has visited $13\%$ of the graph. Kahn's algorithm handles the same graph with a queue and never touches the stack.
:::

Kahn's algorithm has no recursive form at all, so it has no stack limit and no recursion decision to make. That is one more reason to prefer it in a contest.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Ignoring the vertices left over when the queue empties | A cyclic graph is reported as having an order | Compare the number placed with $V$ |
| Using a two-state depth-first search | A cyclic graph produces an order that violates an edge | Use three states: unvisited, active, finished |
| Forgetting to reverse the finish order | The order points backwards along every edge | Reverse the list |
| Counting out-degrees instead of in-degrees | The order is reversed relative to the edges | In-degree counts the prerequisites |
| Forgetting to decrement the in-degrees of the successors | The queue empties early and vertices are never placed | Decrease on every outgoing edge when a vertex is placed |
| Assuming the order is unique | The output differs from the expected output | A valid order is any order that respects the edges |
| Forgetting to run the search from every vertex | A cycle in another component is missed | Kahn's algorithm visits every component on its own |
| Returning the order of a graph with a cycle | The answer violates a constraint | Detect the cycle and report it |
| Assuming the finish order is the topological order | Every edge points backwards | The topological order is the reverse of the finish order |

### Why this fails: the two-state search that invents an order

The mistake that survives review most often is using a depth-first search with only two states, unvisited and visited, and forgetting that an edge back to a vertex on the _current path_ is different from an edge back to a vertex that has already been finished.

Consider the directed graph on vertices $0$, $1$ and $2$ with the edges $0 \to 1$, $1 \to 2$ and $2 \to 0$. The graph has a directed cycle, so it has no topological order at all.

The two-state search runs without complaint. It visits $0$, marks it visited, follows the edge to $1$, marks that visited, follows the edge to $2$, marks that visited, and then examines the edge $2 \to 0$. Vertex $0$ is already visited, so the edge is skipped and the search continues. Vertex $2$ finishes first, then $1$, then $0$, and the finish order is $2, 1, 0$. Reversed, the "topological order" is $0, 1, 2$.

That order is wrong, and it is wrong in a way that is not visible unless you check it: the edge $2 \to 0$ requires $2$ to come before $0$, and the order $0, 1, 2$ puts $0$ first. A consumer of this output would schedule course $0$ before course $2$, which is exactly the contradiction the graph was supposed to expose.

The same failure happens with Kahn's algorithm if the leftover vertices are ignored. The queue empties after the acyclic part of the graph is placed, the remaining vertices are simply not mentioned, and the output looks like a complete order that happens to be short.

The lesson generalizes: **a cycle detector has to distinguish the vertex on the current path from the vertex that was finished earlier**, and an order producer has to check that it placed every vertex before it claims to have produced an order. Both failures are silent, and both produce output that looks well formed.

## Variants and extensions

- **The lexicographically smallest order.** Replace the queue with a min-heap keyed by the vertex label. The cost becomes $O(V + E + V \log V)$.
- **The reverse order.** Running the algorithm on the graph with every edge reversed and reversing the answer gives the order in which every edge points backward, which is the order of a course plan where a course must be taken before the ones that require it.
- **The earliest start times.** In a topological order, the earliest start time of a vertex is its duration plus the largest earliest start time among its predecessors. One pass over the order answers it for every vertex.
- **The longest path in a directed acyclic graph.** The same pass, with the distance replaced by the longest path rather than the earliest start time, is the standard dynamic program on a DAG.
- **Detecting whether the order is unique.** The topological order is unique exactly when, at every step of Kahn's algorithm, exactly one vertex has in-degree zero. A graph with two candidates at some step has two orders.
- **Counting the orders.** The number of topological orders is the number of ways to break the ties, and it can be computed by multiplying the sizes of the candidate sets at each step of Kahn's algorithm.
- **Kahn's algorithm on an undirected graph.** It does not terminate correctly, because the notion of in-degree has no meaning there. Use a traversal for undirected cycle detection instead.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write down the direction of every relation before writing code. "A requires B" is the edge $B \to A$ or $A \to B$ depending on which end you call the predecessor, and getting it backwards produces a valid order of the wrong thing.
2. Decide whether the order must be unique or lexicographically smallest. If it must, use a min-heap for the queue and read the statement carefully for the tie-break rule.
3. Always compare the number of vertices placed with $V$. The count is the cycle test, and it costs nothing.
4. Prefer Kahn's algorithm in a contest: it is iterative, so there is no stack limit, and the cycle detection is free.
5. Use the depth-first variant when you also need the finish times, for instance for a low-link computation.
6. Test the three shapes by hand: an empty graph, a single edge, and a three-vertex cycle. The cycle is the one that catches a missing state.

## Worked problems

### Problem 1: the course schedule

**Restatement.** A school has $n$ courses and $m$ prerequisite relations, each of the form "course $a$ must be taken before course $b$". Report an order of the courses that respects every relation, or report that the requirements are contradictory. Constraints: $1 \le n \le 100\,000$, $0 \le m \le 200\,000$, and the course numbers are $0$ through $n - 1$.

**Naive baseline.** Repeatedly scan every remaining course for one whose prerequisites are all placed. This is $O(V(V + E))$, which is $10^{10}$ operations at the maximum constraints.

**Insight.** The relations form a directed acyclic graph, and a topological order is exactly a valid schedule. The graph is acyclic unless the requirements contradict each other, and that is what the algorithm should report.

**Derivation.** Count the incoming edges of each course. Put the courses with no incoming edge into a queue. Take a course from the queue, append it to the schedule, decrease the incoming count of each course that requires it, and enqueue any course whose count reaches zero. At the end, if fewer than $n$ courses were scheduled, the remaining ones contain a cycle.

**Correctness.** Each course is scheduled only after all of its prerequisites have been scheduled, because its incoming count reaches zero only then. If the queue empties early, the remaining courses all have an unscheduled prerequisite, and following the prerequisites backwards produces a cycle.

**Complexity.** $O(n + m)$ time and $O(n)$ space beyond the adjacency list.

**Common wrong approach.** Reporting the courses that were scheduled and ignoring the ones that were not. The output then looks like a schedule and silently drops the contradictory part of the requirements.

### Problem 2: the alien dictionary

**Restatement.** An alien alphabet has $k$ letters. A list of $m$ ordered pairs says that one letter comes before another in the alphabet. Report an ordering of the alphabet that satisfies every pair, or report that the pairs are inconsistent. Constraints: $2 \le k \le 26$ and $m \le 10\,000$.

**Naive baseline.** Enumerate the permutations of the alphabet, which is $26!$, and check each one against the pairs. Only the first few letters survive this approach.

**Insight.** Each pair is an edge of a directed graph on the letters, and a valid alphabet is a topological order of that graph. The graph is built from the pairs alone, so the words are not needed once the pairs are known.

**Derivation.** Add the edge $u \to v$ for every pair saying that $u$ comes before $v$. Run Kahn's algorithm on the letters that appear in the pairs. If fewer than $k$ letters are placed, the pairs are inconsistent, and the letters left over are exactly the ones involved in a cycle.

**Correctness.** An alphabet order satisfies every pair exactly when it places the first letter of each pair before the second, which is the definition of a topological order of the graph of pairs.

**Complexity.** $O(k + m)$ time and $O(k)$ space beyond the adjacency list.

**Common wrong approach.** Forgetting that a pair can be repeated or reversed, and adding the same edge twice, which double-counts the in-degree and makes the queue empty too early.

### Problem 3: the earliest finishing times

**Restatement.** A project has $n$ tasks. Each task has a duration, and some tasks must be completed before others may start. Report the earliest time each task can start, and the length of the whole project. Constraints: $1 \le n \le 10^5$, $0 \le m \le 2 \cdot 10^5$, and every duration is between $1$ and $10^4$.

**Naive baseline.** Compute the earliest start time of each task by scanning all of its predecessors, repeatedly, until nothing changes. This is Bellman-Ford's shape, and it is $O(VE)$.

**Insight.** The prerequisite graph is acyclic, so a topological order processes every task after all of its prerequisites, and a single pass in that order computes every earliest start time.

**Derivation.** Compute a topological order. Then walk the order, and for each task $t$ set

$$
\text{earliest}[t] = \text{duration}[t] + \max_{p \text{ a predecessor of } t} \text{earliest}[p],
$$

where the maximum over an empty set is zero. The length of the project is the maximum of the values $\text{earliest}[t] + \text{duration}[t]$.

**Correctness.** When a task is reached in the topological order, all of its predecessors have already been processed and their earliest start times are final, so the recurrence can be evaluated exactly. A task can only start when all of its prerequisites have finished, which is why the recurrence takes a maximum rather than a sum over the predecessors.

**Complexity.** $O(n + m)$ time and $O(n)$ space beyond the adjacency list. The naive baseline is $O(nm) = 2 \cdot 10^{10}$ operations.

**Common wrong approach.** Taking the sum of the durations of the predecessors rather than the maximum. The predecessors run in parallel, so the project waits for the slowest of them, not for all of them.

## Practice progression

1. **Recognition.** Given a statement, decide whether a topological sort applies. Look for precedence, prerequisites, dependencies, and build order, and check that the relations are directed.
2. **Direct application.** Implement Kahn's algorithm and the depth-first variant on the same graph, and check that both produce valid orders on acyclic graphs and both report the cycle on cyclic ones.
3. **Adaptation.** Implement the lexicographically smallest order with a min-heap, the reverse order, and the version that reports whether the order is unique.
4. **Combination.** Combine a topological order with a relaxation pass to compute the earliest start times of the tasks and the shortest path in a directed acyclic graph with arbitrary weights.
5. **Challenge.** Solve a problem on a graph with $10^6$ vertices and $2 \cdot 10^6$ edges where the recursive depth-first variant overflows the stack, and produce the iterative one.
6. **Transfer.** Use the order for a different question: the longest path in a directed acyclic graph, the earliest start times of a project, or the linear extension of a partial order given by a set of comparisons.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does every nonempty directed acyclic graph have a vertex of in-degree zero? (Key insight)
2. What does the count of placed vertices tell you at the end of Kahn's algorithm? (Correctness proof)
3. Why is the depth-first variant's answer the _reverse_ of the finish order? (Algorithm derivation)
4. Give a graph on which a two-state depth-first search produces an order that violates an edge. (Common mistakes)
5. How do the two variants detect the cycle $0 \to 1 \to 2 \to 0$, and when does each one notice? (Step-by-step execution)
6. What changes if the queue is replaced by a min-heap, and what does the running time become? (Variants and extensions)
7. Why is a topological order not unique, and how does that affect the output of a judged program? (Step-by-step execution)
8. Which language limits make the recursive depth-first variant dangerous? (Recursion decision)
9. How is the earliest start time of a task computed from the order, and why is it a maximum rather than a sum? (Worked problems)
10. What is the difference between counting in-degrees and out-degrees, and which one does the algorithm use? (Common mistakes)

## Further reading

- The traversal whose finish times the second variant is built on is [depth-first search](/algorithms/graphs/dfs).
- The queue-based sibling of that traversal is [breadth-first search](/algorithms/graphs/bfs), and the level structure it produces is a different way of ordering a graph.
- The shortest-path algorithm that a topological order replaces when the weights are arbitrary is [Dijkstra](/algorithms/graphs/dijkstra).
- The relaxation that a topological order makes possible in one pass is the one in [Bellman-Ford](/algorithms/graphs/bellman-ford).
- The structure that answers the connectivity questions that come up alongside scheduling is the [disjoint set union](/algorithms/graphs/dsu).
- Every listing of the traversal family is collected on the [depth-first search source page](/implementations/graphs-dfs/).
