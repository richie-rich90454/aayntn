---
id: enumeration.iterative-deepening
title: Iterative deepening
summary: Repeat a depth-limited depth-first search with growing limits, so the first successful limit is the shortest distance while the memory stays proportional to the depth.
division: [silver, gold]
subjects: [enumeration]
level: intermediate
importance: common-contest-technique
keywords:
    [iterative deepening, IDDFS, depth-limited search, shortest path, IDA*, memory-bounded search]
prerequisites:
    required: [foundations.recursion, graphs.dfs]
    recommended: [graphs.bfs, enumeration.backtracking, foundations.complexity]
complexity:
    time: "O(b^d) for branching factor b and solution depth d"
    space: "O(d) auxiliary, plus O(n + m) for the graph"
assumptions:
    - Every edge has the same cost, so the number of edges in a path is its length.
    - The successors of a vertex can be generated from the graph or the state in time proportional to the number of successors.
    - The solution depth is small enough that the last depth-limited search is affordable.
implementations: enumeration.iterative-deepening
reviewed: false
---

<AlgorithmSummary algorithm="enumeration.iterative-deepening" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="enumeration.iterative-deepening" />

## At a glance

Iterative deepening runs a depth-first search with a hard depth limit, starting at $0$ and increasing the limit by one after every failure. The first limit at which the search reaches the target is the length of a shortest path, because every smaller limit has already been refuted.

The technique is four decisions.

1. **The limit sequence.** The limits are $0, 1, 2, \ldots$ in steps of one. A step larger than one can find a solution but no longer proves that its length is minimal.
2. **The depth-limited search.** A depth-first search that refuses to descend past the current limit. It explores every simple path of length at most that limit.
3. **The path bookkeeping.** A marker on the vertices of the current path prevents cycles. It is cleared when a branch is abandoned. A global visited set is wrong here, because it can hide a shorter path behind a longer one.
4. **The stopping rule.** The first successful limit is reported together with the total number of vertices expanded across all limits. If no limit below $n$ succeeds, the target is unreachable.

The arithmetic is the reason the technique is practical despite the restarts. If the branching factor is $b$ and the distance is $d$, the last search visits $b^d$ leaves and the earlier searches together cost about $b^d/(b-1)$. The total is at most a factor of $b/(b-1)$ more than the last depth-limited search, and that factor is at most two. The memory is the depth of the current path, not the width of a frontier.

Iterative deepening is not a faster [breadth-first search](/algorithms/graphs/bfs). It is a breadth-first search with the queue replaced by the call stack, and the price is the repeated work at the top of the tree.

## Problem motivation

Take an undirected graph with $n$ vertices and $m$ edges, a start vertex $s$, and a target vertex $t$. Every edge has length one. The task is the number of edges on a shortest path from $s$ to $t$.

The standard answer is [breadth-first search](/algorithms/graphs/bfs): expand the vertices in order of distance, and the first time $t$ is removed from the queue its distance is final. BFS is linear in the size of the graph and is almost always the right choice when the graph fits in memory.

The case for iterative deepening appears when memory, not time, is the binding constraint. A BFS keeps a frontier of every vertex at the current distance, and on a wide graph that frontier can be most of the graph. A 1,000 by 1,000 maze can hold a frontier of $10^5$ to $10^6$ cells, while a depth-first search on the same maze needs only the current path, which is bounded by the number of cells and is often far shorter than the frontier. Iterative deepening keeps the depth-first memory and still returns a shortest path.

The second case is an implicit graph. In a puzzle, the vertices are board configurations and the edges are moves. The successor function is a few lines of code, but the set of visited configurations is large, and storing it may be impossible within the memory limit. The depth of a solution is often small even when the number of configurations is enormous. Iterative deepening stores only the current configuration and the move sequence, so it can run where a visited set cannot.

The six programs in this topic use a small graph so the repeated work is visible. They read $n$, $m$, $s$, $t$, then $m$ undirected edges, run depth-limited searches with limits $0, 1, \ldots, n-1$, and print the shortest distance together with the total number of vertices expanded across all limits. That second number is the cost of the restarts, measured rather than guessed.

## Recognition patterns

Iterative deepening is the right tool when most of these hold.

- The question asks for the **minimum number of moves**, the **fewest operations**, the **shortest sequence**, or the **smallest depth** at which a state is reachable.
- Every move has the same cost. The moment moves have different costs, the number of edges stops being the distance, and [Dijkstra](/algorithms/graphs/dijkstra) or [0-1 BFS](/algorithms/graphs/0-1-bfs) takes over.
- The state space is generated on the fly, or the visited set is too large to store.
- The solution depth is small, even if the number of states at that depth is large.
- The search order matters for a tie-break, such as the lexicographically smallest sequence of moves.
- A lower bound on the remaining distance is available, which turns the technique into IDA*.

The arithmetic below decides whether the repeated searches fit in the time limit. The column "one search" is the exact number of nodes in a complete $b$-ary tree of depth $d$, which is $\sum_{L=0}^{d} b^L = (b^{d+1}-1)/(b-1)$. The last column is the total over all limits divided by that one search, which is $b/(b-1)$.

| Branching $b$ | Depth $d$ | Nodes at depth $d$ | Nodes in one search | Restart factor |
| ------------- | --------- | ------------------ | ------------------- | -------------- |
| $2$           | $20$      | $1\,048\,576$      | $2\,097\,151$       | $2.000$        |
| $4$           | $8$       | $65\,536$          | $87\,381$           | $1.333$        |
| $10$          | $6$       | $1\,000\,000$      | $1\,111\,111$       | $1.111$        |
| $32$          | $5$       | $33\,554\,432$     | $34\,636\,833$      | $1.032$        |

The table has a satisfying shape: the larger the branching factor, the smaller the relative cost of the restarts, because almost all of the work is already in the last level. The unhappy case is a narrow tree with a large depth. With $b = 2$ and $d = 40$, the last level has about $10^{12}$ nodes, one complete search has about twice that, and the restarts double it again; the result is still impossible. Iterative deepening does not make an exponential search polynomial; it makes the memory linear in the depth.

Three situations rule the technique out.

- **The graph is small and explicit.** BFS visits each vertex once and is faster. Iterative deepening is a memory optimization, not a time optimization.
- **The depth is large and the branching is small.** The exponential tree is the bottleneck, and the restart overhead is the smaller problem. Look for a meet-in-the-middle split, a bidirectional search, or a better state representation.
- **The edges are weighted.** The first limit that reaches a vertex is not its shortest distance, so the central argument fails.

## Naive approach

The first baseline is BFS. It is correct, linear, and the thing iterative deepening is competing with.

```python
def bfs(adjacency, start, target):
    distance = [-1] * len(adjacency)
    distance[start] = 0
    queue = deque([start])
    while queue:
        vertex = queue.popleft()
        if vertex == target:
            return distance[vertex]
        for neighbor in adjacency[vertex]:
            if distance[neighbor] == -1:
                distance[neighbor] = distance[vertex] + 1
                queue.append(neighbor)
    return -1
```

The cost is $O(n + m)$ time and $O(n)$ memory for the distance array and the queue. On a graph that fits in memory, this is the right program.

The second baseline is a plain depth-first search. It uses $O(d)$ memory, but it has no reason to return a shortest path.

```python
def dfs(vertex, target, adjacency, visited, depth=0):
    visited[vertex] = True
    if vertex == target:
        return depth
    for neighbor in adjacency[vertex]:
        if not visited[neighbor]:
            found = dfs(neighbor, target, adjacency, visited, depth + 1)
            if found != -1:
                return found
    return -1
```

This program returns the length of the first path that DFS happens to find, which can be much longer than the shortest path. With a global visited set it also has the failure worked through in [Common mistakes](#common-mistakes): the first route to a vertex fixes its depth, and a longer route can block the shorter continuation.

The third baseline enumerates every simple path up to length $n-1$ and keeps the shortest. It is correct and uses the same path memory, but it has no reason to stop early: it explores every simple path up to $n-1$ even when a short answer exists, while iterative deepening stops at the first successful limit.

A fixed depth limit is not a solution either. If the limit is too small the search misses the answer, and if it is too large the search wastes work below the target. Iterative deepening is the systematic way to choose the limit: every limit is tried, and the first success is the answer.

## Key insight

The key observation is that a depth-limited search answers an exact question.

::: math lemma Lemma
For every limit $L$, the depth-limited search from $s$ returns true if and only if there is a path from $s$ to $t$ with at most $L$ edges.
:::

The proof has two directions. A returned path is a path in the graph and its length is at most $L$, because the search stops descending at depth $L$. Conversely, if a path of length at most $L$ exists, take a shortest such path. It is simple, because a repeated vertex can be cut out and shortens the path. The depth-first search considers every simple path from $s$ of length at most $L$, so it follows that path and reaches $t$.

The second observation is that the limits are tried in increasing order. Let $d$ be the true distance. For every $L < d$ the lemma says the search fails, because no path of length at most $L$ exists. At $L = d$ the search succeeds, because a shortest path of length $d$ exists. Therefore the first successful limit is exactly $d$.

The third observation is that restarting is affordable. Each search starts from scratch, but the searches grow geometrically, so the work already done is dominated by the work of the last search. The restarts cost a constant factor, not a logarithmic or linear factor.

The fourth observation is about the state that the search carries. The only information needed to extend a path is which vertices are on the current path. A global visited set is not equivalent, because it records that a vertex was reached, not how many edges remain in the budget. The formal model makes the distinction precise.

## Visual intuition

Draw a small search tree. The root is the start, each level is one more edge, and the target is one of the leaves at depth three.

```text
limit 0:   s                                  1 node
limit 1:   s                                  1 node at the root
           +-- a --+                          2 children expanded
limit 2:   s                                  1 node at the root
           +-- a --+                          2 children expanded
           |   +-- ...                        4 grandchildren expanded
           +-- b --+
               +-- ...
limit 3:   the whole tree down to depth 3     every node expanded again
```

The picture shows the repeated work. The root is expanded four times, the children three times, the grandchildren twice, and the leaves once. If every internal node has two children, the four searches expand $1 + 3 + 7 + 15 = 26$ nodes for a tree whose last level holds $8$ nodes. One complete search has $2^{4} - 1 = 15$ nodes, which is less than twice the last level; the restarts take the total to about three times that level.

The same picture explains the memory. At any moment the search holds one root-to-node path, not one whole level. The path in the picture has four vertices, no matter how wide the tree becomes. The breadth-first alternative holds the entire widest level, which is the last level of the picture.

The label on each block is the limit, not the distance from the root. A node at depth two is expanded in every search whose limit is at least two, because the search cannot know that the target is not below it. This is why the cost is a sum over limits rather than a single traversal.

The ellipsis under the children is the part that grows fastest. In a tree with branching $b$, the number of nodes at depth $L$ is $b^L$, and the total number of nodes up to depth $L$ is $(b^{L+1}-1)/(b-1)$. The ratio between the total and the last level is $b/(b-1)$, which is the number that decides whether the restarts are affordable.

## Formal model

Let $G = (V, E)$ be an undirected graph with $n = \lvert V \rvert$ vertices and $m = \lvert E \rvert$ edges. Write $\operatorname{dist}(s,t)$ for the number of edges on a shortest path from $s$ to $t$, with $\operatorname{dist}(s,s) = 0$ and $\operatorname{dist}(s,t) = \infty$ when no path exists.

::: math definition Definition
A **depth-limited search** $\operatorname{DLS}(s,t,L)$ is a depth-first search from $s$ that never descends below depth $L$. It maintains a marker on the vertices of the current path, and it may extend the path only to an unmarked neighbor. It reports success when it reaches $t$, witnessing a path of at most $L$ edges, and reports failure otherwise.
:::

A **simple path** is a path with no repeated vertex. Every shortest path is simple: if a vertex repeats, the segment between the two occurrences is a cycle, and removing it produces a shorter path.

::: math definition Definition
The **expansion count** $E(L)$ of one depth-limited search is the number of times the search enters a vertex, including the start, the target, and a vertex that is entered and immediately cut off by the depth limit. The **total expansion count** of iterative deepening is $\sum_{L=0}^{d} E(L)$ when the distance is $d$, and $\sum_{L=0}^{n-1} E(L)$ when the target is unreachable.
:::

::: math definition Definition
**Iterative deepening** runs $\operatorname{DLS}(s,t,L)$ for $L = 0, 1, 2, \ldots$ and stops at the first $L$ for which the search succeeds. If no search below $n$ succeeds, it reports that $t$ is unreachable.
:::

The upper bound $n-1$ is not arbitrary. A shortest path is simple, and a simple path on $n$ vertices has at most $n-1$ edges. If a path exists, a shortest one is found by limit $n-1$; if none exists, every limit fails.

::: math invariant Invariant
After $\operatorname{DLS}$ marks the vertex $v$ at depth $\ell$, the path marker is set exactly on the vertices of a simple path $s = v_0, v_1, \ldots, v_\ell = v$, and on no other vertices. When the call returns with failure, the marker is restored to the set it had on entry. A call that succeeds may leave the marker set, because the search terminates and no later call reads it.
:::

The invariant is the reason the search can share one marker array among all branches. On entry to a child, the marker has one more vertex; on a failed return, the child removes itself. A branch that is cut off by the depth limit also removes itself before returning.

::: math lemma Lemma
For every $L$, $\operatorname{DLS}(s,t,L)$ succeeds if and only if $\operatorname{dist}(s,t) \le L$.
:::

The lemma is proved in the next section. It is the entire correctness argument for the limit loop: the sequence of answers is a sequence of false values followed by true values, and the first true value is the distance.

## Algorithm derivation

The algorithm is two nested searches: an outer loop over limits and an inner depth-first search.

```text
function iterative_deepening(s, t):
    expanded = 0
    for L = 0 to n - 1:
        clear the path marker
        if depth_limited_search(s, 0, L):
            return L, expanded
    return -1, expanded

function depth_limited_search(v, depth, L):
    mark v on the path
    expanded = expanded + 1
    if v == t:
        return true
    if depth == L:
        unmark v
        return false
    for each neighbor u of v:
        if u is not marked:
            if depth_limited_search(u, depth + 1, L):
                return true
    unmark v
    return false
```

The order of the first four lines is deliberate. The vertex is marked before the target test, so the target is part of the path when it is reported. The expansion count is incremented before the target test, so the target itself counts as expanded. The depth test comes after the target test, so the start counts as a solution at limit zero when $s = t$. If the depth test came first, it would return failure before the target test and the case $s = t$ would be lost.

The limit loop runs to $n-1$, not forever. In a connected component with $n$ vertices, a simple path has at most $n-1$ edges. If the target is reachable, one of the limits up to $n-1$ succeeds. If none succeeds, the target is unreachable, and reporting $-1$ is correct rather than an admission of giving up.

The path marker is the only mutable state. It is an array of booleans indexed by vertex, and the recursive call sets one entry before descending and clears it after the loop. The clear must happen on every failing path out of the function: after the loop, before the return at the depth limit, and inside the child when its call fails. The early return on success deliberately leaves the marker dirty, because the search is over and the program prints the result immediately. If the function were reused after a success, the marker would have to be cleared by the caller.

The search does not use a global visited array. It uses a path marker, and the difference is the whole correctness argument. A global visited array would say "this vertex has been reached in this iteration", but the depth-limited search needs to know "this vertex is on the current path". A vertex reached by a longer route is not equivalent to the same vertex reached by a shorter route, because the longer route has less remaining budget.

There is a safe way to use more memory: store, for each vertex, the largest remaining depth with which it has been reached in the current iteration, and revisit it only when the new remaining depth is larger. That is a transposition table with a dominance test. It preserves correctness and can cut the search, but it adds a table whose size is the number of states, which is exactly the memory that iterative deepening was trying to avoid.

## Step-by-step execution

Use the graph from the second fixture: six vertices, start $1$, target $6$, and edges $1-2$, $1-3$, $2-4$, $3-4$, $4-5$, $5-6$. The adjacency lists are in input order, so vertex $1$ tries $2$ before $3$, and vertex $4$ tries $2$, then $3$, then $5$.

| Limit | Vertices entered, in order  | Expansions | Cumulative |
| ----- | --------------------------- | ---------- | ---------- |
| $0$   | $1$                         | $1$        | $1$        |
| $1$   | $1, 2, 3$                   | $3$        | $4$        |
| $2$   | $1, 2, 4, 3, 4$             | $5$        | $9$        |
| $3$   | $1, 2, 4, 3, 5, 3, 4, 2, 5$ | $9$        | $18$       |
| $4$   | $1, 2, 4, 3, 5, 6$          | $6$        | $24$       |

The limit-three row is worth walking through, because it is the longest failed search. The search enters $1$, descends to $2$, then to $4$. From $4$ it tries $2$, which is on the path and skipped, then $3$, which is entered at depth three and immediately cut off, then $5$, which is also entered at depth three and cut off. The search returns to $1$ and tries $3$. It descends to $4$, tries $2$ at depth three and cuts it off, skips $3$ because it is on the path, then enters $5$ at depth three and cuts it off. The target has not been reached, so limit three fails after nine entries.

At limit $4$, the search repeats the prefix $1, 2, 4, 3$. The vertex $3$ has no unmarked neighbor, so it returns. The search then enters $5$ at depth three, and from $5$ it enters $6$ at depth four. The target is found, and the limit is reported as $4$. The path is $1-2-4-5-6$.

The failure at limit three is the proof that no path of length at most three exists. The success at limit four is the proof that a path of length four exists. Together they prove that the distance is exactly four. The expansion count is the sum of the work done for every limit, including the two failed searches and the successful one, which is why it is larger than the six vertices that BFS would visit once.

The edge case $n = 1$, $m = 0$, $s = t = 1$ is the smallest instance. Limit zero enters the start, increments the count, sees that the vertex is the target, and returns. The output is $0$ and $1$. No other limit runs.

## Correctness proof

::: math theorem Theorem
Let $d = \operatorname{dist}(s,t)$, with $d = \infty$ when $t$ is unreachable. Iterative deepening returns $d$ and the total expansion count $\sum_{L=0}^{d} E(L)$ when $d$ is finite, and it returns $-1$ after limits $0$ through $n-1$ when $d = \infty$.
:::

::: math proof Proof
**The invariant.** The proof is by induction on the depth of the recursion. At the root, the marker contains only $s$, which is the simple path of length zero from $s$ to $s$. Suppose the invariant holds at a call for vertex $v$ at depth $\ell$. The search only recurses into an unmarked neighbor $u$, so the new path is still simple. It marks $u$ before the call; a failed call for $u$ unmarks $u$ before returning, so the state at the parent is restored on every failed return. A successful call ends the whole search before the parent reads the marker again, so its stale entries are harmless. The depth limit does not extend the path and unmarks on the failed exit; the target test returns success without unmarking, which is the successful case just described. Therefore the invariant holds at every call, and every failed return restores the state.

**The depth-limited search is complete for its budget.** Let $P$ be a simple path from $s$ to $t$ with at most $L$ edges. The search follows the vertices of $P$ in order. At the $j$-th vertex of $P$, the next vertex is unmarked, because $P$ is simple and the search has not visited it on this path. The recursion therefore reaches the end of $P$ unless it finds $t$ earlier, and it returns success. This proves that a path within the limit is never missed.

**The depth-limited search is sound.** Every successful return corresponds to a sequence of recursive calls from $s$ to $t$. Each call advances the depth by one and follows an edge, so the sequence is a path, and its length is at most $L$ because the search never descends past $L$. This proves that a success is a real path within the budget.

**The first successful limit is the distance.** By the two directions, the search at limit $L$ succeeds exactly when $d \le L$. For $L < d$ it fails, and at $L = d$ it succeeds. The loop tries the limits in increasing order, so the first success is at $L = d$.

**The upper bound.** If $d$ is finite, a shortest path is simple and has at most $n-1$ edges, so the loop reaches a successful limit no later than $n-1$. If no limit through $n-1$ succeeds, no path exists, and the loop returns $-1$.

**The count.** The expansion counter is incremented exactly once per call, before any return. The calls of the search at limit $L$ are exactly the entries counted by $E(L)$, because every call either reaches the target, is cut off by the depth limit, or explores its neighbors. The outer loop adds the counts of the limits in order, so the printed value is the stated sum. $\square$
:::

::: math proof Proof
The loop terminates because it has at most $n$ iterations and each depth-limited search is a finite tree: the depth is bounded by $L$, and a path cannot repeat a vertex. The recursion returns on success or after exhausting the unmarked neighbors, so each call finishes. $\square$
:::

## Complexity analysis

Let $b$ be the maximum number of neighbors of a vertex, and let $d$ be the distance from $s$ to $t$. A depth-limited search at limit $L$ enters at most the nodes of a complete $b$-ary tree of depth $L$. The number of calls is therefore at most

$$
1 + b + b^2 + \cdots + b^L = \frac{b^{L+1}-1}{b-1}
$$

for $b > 1$, and $L+1$ for $b = 1$. In the degenerate case $b = 1$ the graph is a path, each search is a single walk, and the total over the $d+1$ limits is $O(d^2)$; BFS is linear there, but the absolute work is tiny.

The total over the limits up to $d$ is at most

$$
\sum_{L=0}^{d} \frac{b^{L+1}-1}{b-1}
= \frac{b^{d+2} - (d+2)b + (d+1)}{(b-1)^2},
$$

which is dominated by the last depth-limited search, whose cost is about $b^{d+1}/(b-1)$. In the usual form, the time is $O(b^d)$, with a constant factor of at most $b/(b-1)$ relative to that last search. For $b = 2$ the factor is $2$; for $b = 10$ it is about $1.11$; for $b = 32$ it is about $1.03$.

The auxiliary space is the recursion stack, $O(d)$, plus the path marker and the graph representation. The marker is an array of $n$ entries in the reference programs, so the total is $O(n + m + d)$; on an implicit state space the marker can be a hash set of the current path, which is $O(d)$. The breadth-first alternative uses $O(n)$ for the queue and the distance array, and on an implicit space it uses memory proportional to the number of visited states. That difference is the reason to choose iterative deepening.

The table compares the two searches on an explicit graph.

| Measure               | BFS                      | Iterative deepening                      |
| --------------------- | ------------------------ | ---------------------------------------- |
| Time                  | $O(n + m)$               | $O(b^d)$                                 |
| Queue or stack        | $O(n)$                   | $O(d)$                                   |
| Visited or path state | $O(n)$ distance array    | $O(n)$ marker array, or $O(d)$ path set  |
| Shortest path         | Yes                      | Yes                                      |
| Repeats work          | No                       | Yes, by a factor of at most $b/(b-1)$    |
| Best when             | The graph fits in memory | Memory is tight or the graph is implicit |

The time bound is stated in terms of the answer depth, not $n$. A graph with a million vertices, a small degree, and a distance of three is easy for iterative deepening even if the graph itself is stored. A graph with a hundred vertices and a distance of fifty is not, because $b^{50}$ is hopeless for any $b \ge 2$.

The path-only search can visit the same vertex many times through different paths. That is not a bug; it is the search tree of simple paths. If a state has a compact representation, a transposition table can merge those visits, but the table reintroduces the memory cost. The safe merge stores the largest remaining depth seen for a state, not merely a boolean.

The expansion count is not a complexity class. It is an instrument. Run the program on the largest input you expect and compare the count with $b^d$. If the count is close to the bound, the search is behaving as predicted. If it is far below, the pruning is working. If it is far above, the graph has many paths to the same states and a better representation is needed.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Unweighted shortest path, memory is available | [Breadth-first search](/algorithms/graphs/bfs) |
| Unweighted shortest path, memory is tight | Iterative deepening |
| Implicit state space with a small solution depth | Iterative deepening |
| A good lower bound on the remaining distance | IDA*, iterative deepening with the bound |
| Weighted edges, non-negative weights | [Dijkstra](/algorithms/graphs/dijkstra) |
| Weights are zero or one | [0-1 BFS](/algorithms/graphs/0-1-bfs) |
| Negative weights, no negative cycles | [Bellman-Ford](/algorithms/graphs/bellman-ford) |
| All pairs of distances | [Floyd-Warshall](/algorithms/graphs/floyd-warshall) |
| The search tree is a DAG with overlapping states | Dynamic programming or a transposition table |
| The state space splits into two halves | [Meet in the middle](/algorithms/enumeration/meet-in-the-middle) |
| The constraints are local and the answer must be constructed | [Backtracking](/algorithms/enumeration/backtracking) |

The default is BFS. Iterative deepening is the answer to a memory limit, an implicit graph, or a tie-break that the depth-first order handles naturally. It is not the answer to a large depth: no amount of memory saving makes an exponential tree with depth forty affordable.

The distinction between iterative deepening and [backtracking](/algorithms/enumeration/backtracking) is the stopping condition. Backtracking explores a tree of partial assignments and prunes infeasible ones; it does not necessarily search by depth. Iterative deepening explores a graph of states and uses the depth limit as the correctness device for shortest paths. The two combine in IDA*, where the depth limit is tightened by a heuristic bound, and in branch and bound, where the bound is on the objective value rather than on the depth.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal, and JavaScript. There is no reusable minimal variant, because the depth-limited search and the limit loop together are short enough that the whole program is the reference.

The contract is fixed across all six files.

- **Input:** `n m s t`, then $m$ lines, each holding an undirected edge `u v`. The four numbers may be split across lines; every version reads them as whitespace-separated integers. Vertices are numbered $1$ through $n$.
- **Output:** one line holding the shortest distance and the total number of depth-first search entries, separated by one space. If $t$ is unreachable, the distance is `-1`.
- **Counting:** a vertex is expanded when the depth-limited search enters it. The count includes the start, the target, and a vertex that is cut off by the depth limit. It accumulates over every limit and is not reset between limits.
- **Assumptions:** $1 \le n$, $0 \le m$, and both endpoints of every edge are in $1 \ldots n$. The graph may contain cycles, parallel edges, and self-loops.

The language-specific choices are narrow.

- C uses a forward-star adjacency list with a tail pointer, so the neighbors of a vertex are visited in input order. The arrays are allocated from $n$ and $m$ and freed before exit.
- C++17 uses `std::vector<std::vector<int>>`, a `std::vector<char>` path marker, and `std::fill` between limits.
- Java uses `ArrayList` adjacency lists, `Arrays.fill`, and a `Scanner`, with the class named `Main` so the file can be submitted unchanged.
- Python raises the recursion limit to the number of vertices plus a margin, and uses a list of booleans for the path. Its integers do not overflow.
- Pascal uses dynamic arrays, appends at the tail so the neighbor order matches the other languages, reads each integer with its own `Read`, and uses `Int64` for the expansion count.
- JavaScript uses `Uint8Array` for the marker and `Number` for the count. The neighbor order is the input order.

All six are marked `unverified` until the validation job compiles them and compares their output on the shared fixtures. The fixtures include a chain, a branching graph, and the edge case $s = t$. The branching case is the one that catches a mismatch in adjacency order or in the definition of an expansion.

## Recursion decision

The recursion depth of the depth-limited search is the current limit, which is at most $n-1$. In the useful cases the distance is small, so the recursion is shallow. The limit loop itself is iterative and uses no stack.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Recursion is safe for shallow solutions |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Recursion is safe for shallow solutions |
| Python | Interpreter limit of 1000 | 1000 frames by default | Raise the limit to $n + 10$ as the programs do |
| Pascal | The operating system stack | Depends on the platform | Recursion is safe for shallow solutions |
| JavaScript | The V8 engine limit | About $10^4$ frames | Recursion is safe for shallow solutions |

The table hides one edge case. If the target is unreachable and the input is large, the loop eventually runs a search with limit $n-1$, and the recursion can reach depth $n-1$ even though no solution exists. A graph with $10^5$ vertices can overflow the stack in Java, Pascal, or JavaScript. There are two fixes. The first is an explicit stack of frames, which removes the recursion limit at the cost of a longer loop. The second is a connectivity check before the limit loop: a single BFS or DFS decides whether $t$ is in the component of $s$, and an unreachable target can be reported without running the deep search. The reference programs use the recursive form because the inputs in this topic are small and the recursion is the clearer statement of the algorithm.

The recursion also has a cost that is easy to underestimate. A depth-limited search at limit $L$ makes one call per expanded vertex, and the total count is the geometric sum. The call overhead is part of the constant factor in the complexity, and it is the reason a tight implementation keeps the per-call work to a marker write, a comparison, and a loop over the neighbors.

## Implementation walkthrough

The six lines that decide whether the implementation is right are the entry and the two exits.

```cpp
onPath[vertex] = 1;              // the choice
++expanded;
if (vertex == target) return true;
if (depth == limit) { onPath[vertex] = 0; return false; }

for (int neighbor : adjacency[vertex]) {
    if (!onPath[neighbor] && depthLimitedSearch(neighbor, depth + 1, limit)) {
        return true;
    }
}
onPath[vertex] = 0;              // the restore
return false;
```

The target test must come before the depth test. At limit zero, the search enters the start and must be allowed to report it as a solution when the start is the target. If the depth test came first, the search would return failure before checking the target.

The expansion counter must be incremented on entry, not on success. The first fixture is a chain: every limit below six expands the next prefix and then stops at the depth limit, so the counts are $1, 2, 3, 4, 5, 6, 7$ and the total is $28$. If the counter only counted vertices on successful paths, the printed total would be $7$, which is the length of the chain plus one, not the work done.

The marker must be cleared on the failed depth-limit exit and after the loop. The early success exit may leave the marker dirty, because the program prints the result and terminates. A version that calls the search again after a success would need to clear the marker first.

The outer loop must clear the marker between limits. The limits are independent searches, and a marker left over from the previous limit would make the next search believe that part of the old path is still occupied. That is the bug that produces a false negative at the first limit that should have succeeded.

The adjacency order must be consistent across languages if the expansion count is compared byte for byte. The C and Pascal versions append at the tail instead of pushing at the head, so all six languages visit the neighbors in the order the edges appear in the input. A head insertion reverses the order and changes the count without changing the distance.

The input parser should read four integers and then exactly $m$ pairs. It should not assume that the four header integers are on one line. The fixtures put `n m` on the first line and `s t` on the second, while a contest input may put all four on one line; a whitespace-based reader handles both.

Self-loops and parallel edges need no special case. A self-loop points to a vertex that is already on the path, so the marker skips it. Parallel edges produce duplicate neighbors, and the search explores each duplicate as a separate branch, which is correct and is part of the expansion count.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using a global visited set inside one limit | A longer route can block the shorter continuation | Use a path marker, or store the best remaining depth per vertex |
| Forgetting to clear the marker between limits | The second search thinks the first search's path is still occupied | Clear the whole marker at the top of each limit |
| Forgetting to unmark a failed branch | Sibling branches lose vertices that are not on their path | Unmark on every return path |
| Resetting the expansion count inside the loop | The output holds only the last limit's work | Keep one counter outside the loop |
| Counting only the vertices on the successful path | The printed count is the path length, not the work | Increment on entry to every call |
| Starting the limits at one | The case $s = t$ reports a positive distance | Start at zero and test the target before the depth limit |
| Stopping at $n$ instead of $n-1$ | One extra search runs, so the count is too large | A simple path has at most $n-1$ edges |
| Increasing the limit by two | The first success can be longer than the shortest path | Increase by one when the distance is required |
| Running iterative deepening on weighted edges | The first limit that reaches a vertex is not its distance | Use Dijkstra or 0-1 BFS |
| Forgetting the upper bound | An unreachable target loops forever | Stop after limit $n-1$ and report $-1$ |

### Why this fails: the visited array that hides the short path

The plausible wrong approach is to reuse the standard graph-search visited array inside each depth-limited search. The reasoning sounds right: a vertex only needs to be explored once per iteration, and the array makes the search linear in the graph. The result is a program that is fast, plausible, and wrong on a small graph.

Take four vertices with edges $1-2$, $2-3$, $1-3$, and $3-4$, start $1$, target $4$. The shortest path is $1-3-4$, of length two. The adjacency list of $1$ is $[2, 3]$, so the depth-first search tries $2$ first.

At limit two, the correct path-only search does this. It enters $1$, then $2$, then $3$ at depth two. The target is not reached because $4$ would be at depth three, so the search returns and unmarks $3$ and $2$. It then enters $3$ from $1$ at depth one, and enters $4$ at depth two. It reports distance two.

The visited-array version does this. It enters $1$, marks it, then enters $2$, then enters $3$ at depth two and marks it. The target is not reached, and the search returns. When it tries to enter $3$ from $1$, the vertex is already marked, so the branch is skipped. Limit two fails. At limit three, the search follows $1, 2, 3, 4$ and reports distance three.

The output is not obviously absurd: it is a positive distance and a valid path. It is simply not the shortest. The mechanism is exact. A visited array records that a vertex has been reached, not the depth at which it was reached. The first route to $3$ used two edges, leaving no budget for $4$; the second route used one edge, leaving exactly enough. The visited array cannot tell the two routes apart, so it discards the useful one.

The same bug corrupts the expansion count, because the search that fails at limit two expands fewer vertices than the correct search. The smallest counterexample is four vertices; three vertices do not expose it, because a triangle has no target beyond the third vertex. A differential test against BFS on random small graphs is the cheapest way to catch it.

The lesson generalizes: **the state of a depth-limited search is the current path, not the set of vertices ever reached.** Any optimization that merges two paths must preserve the remaining depth, and a boolean does not.

## Variants and extensions

- **IDA\***. Replace the fixed limit with $g + h$, where $g$ is the current depth and $h$ is an admissible lower bound on the remaining distance. The first limit that succeeds is still optimal, and the bound prunes branches that cannot beat it. The rotation game and the DNA sequence are the standard examples.
- **Bidirectional iterative deepening**. Run the depth-limited search from both ends and stop when the two frontiers meet. The meeting depth is the distance, and the work falls from $b^d$ to about $2b^{d/2}$ when the branching is symmetric.
- **Transposition table with remaining depth**. Store for each state the largest remaining budget with which it has been reached. Revisit a state only when the new budget is larger. This preserves correctness and can merge many paths, but it uses memory proportional to the number of states.
- **Depth-first branch and bound**. Keep the best objective value found so far and prune a branch when its optimiztic completion cannot beat it. The limit is on the objective, not on the depth, and the first solution is not necessarily optimal until the bound proves it.
- **Limit increments larger than one**. Safe only when the question is existence, not the minimum distance. If the limit jumps from $L$ to $L+2$, a solution of length $L+1$ is found at limit $L+2$, and the reported length is wrong.
- **Lexicographically first shortest path**. Try the neighbors in sorted order and stop at the first success at the optimal limit. The depth-first order then enumerates the shortest paths in lexicographic order, and the first one is the required tie-break.
- **Explicit-stack depth-limited search**. Replace the recursion with an explicit stack of frames when the depth can exceed the language's stack. The marker is restored when a frame is popped, exactly as it is restored when a call returns.
- **Iterative deepening on an infinite state space**. Completeness holds only when a solution exists at a finite depth. The loop must have a stopping condition supplied by the problem, such as a known upper bound on the answer.

## Contest strategy

1. **Check the edge weights.** If they are not all equal, stop and use the weighted shortest-path algorithm instead. Iterative deepening is a unit-weight technique.
2. **Estimate the depth and the branching.** If $b^d$ is far beyond the time limit, the answer is a better state representation, a meet-in-the-middle split, or a heuristic, not a faster loop.
3. **Check the memory limit.** If BFS fits, use BFS. If the visited set is the problem, iterative deepening is the natural replacement.
4. **Write the depth-limited search first.** Mark, count, test the target, test the depth limit, loop over unmarked neighbors, unmark, return. Read the six lines back before adding the outer loop.
5. **Write the limit loop.** Start at zero, stop at $n-1$, clear the marker at the top, and return $-1$ after the last failure.
6. **Instrument the expansion count.** Compare it with $b^d$ on the largest case. A count far above the prediction means the state is being revisited through many paths; a count far below means the pruning is doing real work.
7. **Test the edge cases.** The start equal to the target, a disconnected graph, a single edge, a cycle, a self-loop, and a parallel edge. Each one exercises a different line of the loop.
8. **Only then add the heuristic.** A bound that is not admissible turns an optimal search into a fast wrong answer. Prove that the bound never overestimates the remaining distance.

## Worked problems

### Problem 1: Power Calculus

**Restatement.** Starting from $x$, build $x^n$ using multiplications and divisions. Each operation combines two powers already present, and every intermediate exponent must be a positive integer. For $n \le 1000$, report the minimum number of operations.

**Naive baseline.** A breadth-first search over the set of exponents in the sequence stores every reachable sequence and grows quickly. A depth-first search without a bound has no reason to stop at the minimum.

**Insight.** The answer is a small depth, and a depth-limited search can decide whether $n$ is reachable within a fixed number of operations. The first limit that succeeds is optimal.

**Derivation.** Keep the exponents produced so far. At each step choose two of them, add or subtract, and continue when the result is positive. Prune with the largest exponent: one operation at most doubles it, so if the largest exponent times $2$ to the remaining depth is below $n$, the branch cannot reach $n$. A depth-local duplicate check removes sequences that differ only in the order of their operations.

**Correctness.** The doubling prune is sound because the new exponent is the sum or difference of two existing exponents, neither larger than the current maximum. If the maximum after all remaining operations is still below $n$, no completion reaches $n$. The depth-limited search explores every sequence within the limit, so the first successful limit is the minimum.

**Complexity.** The branching at depth $k$ is $O(k^2)$, and the depth is small for $n \le 1000$, so the search is practical with the prune. The memory is $O(d)$ for the current sequence.

**Common wrong approach.** Running BFS over all sequences without a visited set on the exponent sets, which explores the same exponents in every order.

### Problem 2: DNA sequence

**Restatement.** Given up to eight DNA strings of length at most five, find the length of the shortest string that contains every one of them as a subsequence.

**Naive baseline.** Merge the strings greedily in pairs. The result is a common supersequence, but not always the shortest one. A breadth-first search over all strings of increasing length stores a number of strings that grows as four to the length.

**Insight.** At depth $d$, ask whether a common supersequence of length at most $d$ exists. The answer length is at most the sum of the input lengths, which is at most $40$, so the limits are bounded.

**Derivation.** The state is the position reached in each input string. Appending a letter advances every string whose next unmatched letter is that letter. The remaining length is at least the longest unmatched suffix, because that suffix still has to appear. Prune when the current depth plus the longest suffix exceeds the limit. Only try the four letters, and skip a letter that advances no string.

**Correctness.** Every common supersequence is a sequence of letters, and the search considers every sequence up to the limit. The heuristic is admissible because each unmatched suffix must be completed, and one letter can advance a given string by at most one position. The first successful limit is therefore the minimum length.

**Complexity.** The worst case is $O(4^L)$ for answer length $L$, with $L \le 40$, and the heuristic cuts most branches. The memory is $O(L)$ plus the position array.

**Common wrong approach.** Greedily merging the two longest strings, then the result with the next, which can produce a supersequence longer than necessary.

### Problem 3: The Rotation Game

**Restatement.** A board of 24 cells holds three colors, eight cells each. Eight moves rotate lines of seven cells. Find the minimum number of moves that makes the eight center cells the same color, and among the shortest solutions report the lexicographically smallest move string.

**Naive baseline.** A breadth-first search over board configurations. The branching is eight and the number of configurations is enormous, so the queue and the visited set are the bottleneck.

**Insight.** The depth of a solution is small, and the count of the most frequent color in the center gives a lower bound on the moves still needed. A move changes at most one center cell, so the bound is admissible.

**Derivation.** Run iterative deepening with the bound $8 - c$, where $c$ is the largest count of a single color among the eight center cells. Prune when the current depth plus the bound exceeds the limit. Generate the moves in the order A through H, and skip the move that immediately reverses the previous one.

**Correctness.** Each move changes at most one center cell, so at least $8 - c$ cells must change and at least that many moves remain. The bound never overestimates. The search tries every move sequence within the limit, so the first successful limit is the minimum. The alphabetical move order makes the first success at that limit the lexicographically smallest shortest solution.

**Complexity.** The worst case is $O(8^L)$ for answer length $L$, with the heuristic cutting most branches. The memory is $O(L)$ for the board history and the move string.

**Common wrong approach.** Using the number of misplaced center cells without checking that the bound is admissible, or trying moves in an arbitrary order and failing the lexicographic tie-break.

## Practice progression

1. **Recognition.** Given a shortest-path or minimum-moves statement, decide whether the edges are unweighted and whether BFS fits in memory. Write the four decisions of iterative deepening before writing code.
2. **Direct application.** Implement the depth-limited search on a small graph and print the vertices in entry order. Confirm that the limit-three search repeats the prefix of the limit-two search.
3. **Counting.** Add the expansion counter and reproduce the $28$ and $24$ totals from the fixtures. Then explain why the chain expands more than the branching graph even though the branching graph has more edges.
4. **Correctness.** Replace the path marker with a global visited array and run the four-vertex counterexample. Confirm that the answer changes from two to three, then restore the marker.
5. **Combination.** Add an admissible heuristic and turn the search into IDA*. Use the DNA sequence problem and the rotation game as the two test cases.
6. **Transfer.** Take a puzzle or a planning problem with a successor function and no explicit graph. Write the depth-limited search with a compact state, then decide whether the state can be hashed for a transposition table.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four decisions every iterative-deepening search makes? (At a glance)
2. Why does a depth-limited search decide reachability within exactly its limit? (Key insight)
3. Why is the first successful limit the shortest distance? (Correctness proof)
4. What does the path marker record that a global visited array does not? (Formal model)
5. What is the smallest graph on which the visited-array version returns a longer distance, and what are the two answers? (Common mistakes)
6. Why is the total cost at most a factor of $b/(b-1)$ above the last search? (Complexity analysis)
7. When is BFS the better choice despite its memory use? (Algorithm selection)
8. Why must the target test come before the depth-limit test? (Implementation walkthrough)
9. Why does the limit loop stop at $n-1$? (Algorithm derivation)
10. What must be true about a heuristic before it can be used in IDA*? (Variants and extensions)

## Further reading

- The breadth-first search that iterative deepening imitates is in [breadth-first search](/algorithms/graphs/bfs), and the recursion underneath the depth-limited search is in [depth-first search](/algorithms/graphs/dfs).
- The general recursion pattern that the depth-first search follows is in [recursion](/algorithms/foundations/recursion).
- The pruning that turns a partial search into a faster one is in [backtracking](/algorithms/enumeration/backtracking), and the bound that turns it into an optimal search is in [branch and bound](/algorithms/enumeration/branch-and-bound).
- The exponential arithmetic that decides whether the search is affordable is in [complexity](/algorithms/foundations/complexity).
- The weighted shortest-path algorithm that replaces iterative deepening when the edges are not unit length is in [Dijkstra](/algorithms/graphs/dijkstra).
- The split that replaces a deep search when the state space can be divided is in [meet in the middle](/algorithms/enumeration/meet-in-the-middle).
