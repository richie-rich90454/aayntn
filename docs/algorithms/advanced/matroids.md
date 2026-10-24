---
id: advanced.matroids
title: Matroids
summary: Abstract the families of sets on which greedy is optimal, so the graphic matroid explains why Kruskal's maximum spanning forest is correct and where the same exchange argument transfers.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        matroid,
        graphic matroid,
        exchange property,
        greedy algorithm,
        maximum spanning forest,
        Kruskal,
        matroid intersection,
    ]
prerequisites:
    required: [graphs.mst, foundations.sorting]
    recommended: [graphs.dsu, foundations.complexity, greedy.feasibility-oracle]
complexity:
    time: "O(m log m + (n + m) α(n))"
    space: "O(n + m)"
assumptions:
    - The graph is undirected and may be disconnected, so the answer is the weight of a spanning forest rather than of a spanning tree.
    - Every edge weight is a signed integer and the total weight fits in a signed 64-bit integer.
implementations: advanced.matroids
reviewed: false
---

## At a glance

A matroid is an abstraction of independence. It consists of a finite ground set $E$ and a family $\mathcal{I}$ of subsets of $E$ that contains the empty set, is closed under taking subsets, and satisfies the exchange property: if $A$ and $B$ are independent and $|A| < |B|$, then some element of $B \setminus A$ can be added to $A$ and keep it independent.

The acyclic edge sets of an undirected graph form the graphic matroid. Kruskal's algorithm is the greedy algorithm on that matroid: sort the edges by weight and add each edge whose endpoints lie in different components. The exchange property is what makes every greedy choice safe. At each step the chosen set can be exchanged for any optimal solution without losing weight, so after all steps the chosen set is optimal.

For a graph with $n$ vertices and $m$ edges, the cost is $O(m \log m + (n + m)\alpha(n))$ time and $O(n + m)$ space, dominated by the sort. The same argument proves the greedy rule for partition matroids, linear matroids, and transversal matroids, and it explains why the rule stops working as soon as two independent constraints must hold at once.

## Problem motivation

A consortium plans a fiber network between towns. Each possible link has a profit: the amount saved by using that link instead of the alternatives. A set of links that contains a cycle is wasteful, because any one link of the cycle can be removed and every town stays connected. The consortium therefore wants a set of links with no cycle that maximizes the total profit. If the map is disconnected, it wants a spanning tree of every connected component, which is a spanning forest of the whole graph.

The obvious algorithm tries every subset of links and keeps the best acyclic one. With $m = 40$ links there are already more than a trillion subsets, so the approach is only a reference for small instances. A better attempt starts from the heaviest link and repeatedly adds the heaviest link that keeps the chosen set acyclic. This is Kruskal's algorithm, and it is fast: one sort and one pass with a disjoint set union.

The question is why the local choice cannot be trapped by a bad early link. A greedy algorithm that takes the heaviest edge incident to a vertex can be trapped in other problems, and a greedy algorithm that takes the heaviest edge of a matching can be trapped as well. The difference is the exchange property, and proving that the acyclic sets have it is the whole content of the matroid argument.

The same structure appears whenever a problem asks for a maximum-weight set subject to an independence rule. Scheduling jobs before deadlines, choosing at most one item from each group, and choosing linearly independent vectors are all matroid problems. Recognizing the matroid tells you whether greedy is correct, and recognizing two matroids at once tells you that a harder polynomial algorithm is needed.

## Recognition patterns

The technique is a candidate when the statement contains one of these phrases.

- "Choose a subset of the items maximizing the total value such that no cycle is formed."
- "The chosen edges must connect the graph without creating a cycle."
- "At most one item may be chosen from each group."
- "The chosen vectors must be linearly independent."
- "Every job must be scheduled before its deadline, with at most one job per time slot."
- "If one feasible set is smaller than another, an element of the larger set can be added to the smaller one."

The constraint values and the shape of the feasible sets rule the technique in and out.

| Situation | What it rules |
| --- | --- |
| A single acyclicity constraint on the edges of an undirected graph | The graphic matroid; Kruskal's greedy rule |
| At most one element from each group | A partition matroid; greedy by weight |
| Linear independence over a field | A linear matroid; Gaussian elimination or an XOR basis |
| Jobs with deadlines and unit processing times | A transversal matroid; greedy by profit |
| Two independent constraints on the same ground set | Matroid intersection; plain greedy is not enough |
| Three or more matroid constraints | NP-hard in general |
| A constraint that is not hereditary, such as "the set must be connected" | Not a matroid; greedy can fail |
| A matching constraint | Not a matroid; greedy can fail |
| The feasible sets are not closed under subsets | Not an independence system at all |

The first row is the one this article proves. The fifth and sixth rows are the honest limit: the greedy theorem is a theorem about one matroid, and two matroids already require augmenting paths. The last three rows are the most common modeling errors. "The chosen edges must connect all vertices" is not hereditary, because a connected set can have a disconnected subset. "The chosen edges must form a matching" is hereditary but does not satisfy exchange, as the matching counterexample in Common mistakes shows.

## Naive approach

The baseline enumerates every subset of edges and keeps the heaviest one that is acyclic and spans every connected component.

```text
best = 0
for every subset S of the m edges:
    if S is acyclic and every component of the graph is spanned by S:
        best = max(best, total weight of S)
```

Testing acyclicity with a disjoint set union costs $O(n + m)$ per subset, so the whole enumeration costs $O(2^m (n + m))$ time and $O(n + m)$ space. It is correct by definition, and it is the reference implementation against which the greedy program is tested on small random graphs.

A second baseline sorts the edges ascending and runs the same disjoint-set rule. That computes a minimum spanning forest, not a maximum one. On a triangle whose edges have weights $1$, $2$, and $3$, the minimum spanning forest has weight $3$ and the maximum has weight $5$. The direction of the sort is not a detail; it is part of the objective.

A third baseline grows one tree at a time from a starting vertex, always taking the heaviest edge that leaves the current tree. This is Prim's algorithm. With a binary heap it costs $O(m \log n)$ on a connected graph and is a perfectly good answer, but it needs a restart for every connected component and it does not generalize to partition or linear matroids. The matroid argument belongs to Kruskal, so Kruskal is the reference here.

## Key insight

The first insight is that the family of forests satisfies the exchange property. Let $A$ and $B$ be forests with $|A| < |B|$. Suppose that no edge of $B \setminus A$ can be added to $A$. Then every such edge has both endpoints in the same connected component of the graph $(V, A)$. Every edge of $A \cap B$ also lies inside one of those components, so every edge of $B$ lies inside one component of $(V, A)$. If the components have sizes $s_1, s_2, \ldots, s_k$, then $B$ has at most $s_i - 1$ edges inside component $i$, because $B$ is acyclic. Summing gives

$$
|B| \le \sum_{i=1}^{k} (s_i - 1) = n - k = |A|,
$$

which contradicts $|A| < |B|$. Therefore an addable edge exists. This is the only structural fact the greedy proof needs.

The second insight is that the greedy choice is safe. Let $I$ be the current independent set and let $e$ be the heaviest element that can be added to $I$. Take a maximum-weight basis $B$ that contains $I$. If $e$ is in $B$, there is nothing to prove. Otherwise $B \cup \{e\}$ contains a unique circuit; removing a suitable edge $f$ of that circuit and adding $e$ gives another basis that still contains $I$. The edge $f$ was also addable to $I$, so its weight is at most the weight of $e$. The new basis is therefore at least as heavy as $B$, and it contains $I \cup \{e\}$. Inducting over the greedy steps proves optimality.

The third insight is that the independence test is cheap for a graphic matroid. A set of edges is acyclic exactly when every new edge joins two different connected components. A disjoint set union answers that question in near-constant amortized time, so the loop after the sort is almost linear.

The fourth insight is that the greedy algorithm stops at a maximal forest. If an edge joined two different components at the end, it would have joined two different components when it was considered, and it would have been added. Components only merge, never split, so no such edge exists. A maximal forest is a spanning forest: it contains a spanning tree of every connected component. The output is therefore a spanning forest, not merely some forest.

## Visual intuition

Picture the vertices as blocks of clay and the edges as bars between them, sorted from the longest bar to the shortest. Kruskal picks up each bar in turn. If the bar connects two different blocks, the blocks merge into one and the bar stays. If both ends are already in the same block, the bar would close a loop inside that block, so it is discarded.

| Edge | Endpoints | Weight | Blocks before | Decision               |
| ---- | --------- | ------ | ------------- | ---------------------- |
| a    | 1, 2      | 9      | 1, 2, 3, 4, 5 | take, merge 1 and 2    |
| b    | 3, 4      | 8      | 12, 3, 4, 5   | take, merge 3 and 4    |
| c    | 1, 3      | 7      | 12, 34, 5     | take, merge 12 and 34  |
| d    | 2, 4      | 6      | 1234, 5       | discard, same block    |
| e    | 4, 5      | 5      | 1234, 5       | take, merge 1234 and 5 |
| f    | 2, 5      | 4      | 12345         | discard, same block    |
| g    | 1, 5      | 3      | 12345         | discard, same block    |
| h    | 2, 3      | 2      | 12345         | discard, same block    |

After the fifth row every vertex is in one block, so the remaining bars cannot be taken. The chosen edges are a, b, c, and e, with total weight $9 + 8 + 7 + 5 = 29$.

The same picture has two local rules. The **cut rule** says that for any partition of the vertices into two sides, the heaviest edge crossing the partition is safe for a maximum spanning tree. If a maximum tree does not use it, adding it creates a cycle that crosses the partition at another edge $f$, and $w(f) \le w(e)$, so swapping $f$ for $e$ does not decrease the weight. The **cycle rule** says that the lightest edge on a cycle is never needed. If a maximum tree uses it, removing it splits the tree, and some other edge of the cycle reconnects the two sides with weight at least as large.

Kruskal uses the cycle rule directly. When an edge closes a cycle, every edge already on that cycle was considered earlier, so it is at least as heavy. The closing edge is therefore a lightest edge of the cycle and can be discarded. The cut rule is the same statement viewed from the other side, and it is the version that Prim's algorithm uses.

## Formal model

Let $G = (V, E)$ be an undirected graph with $n = |V|$ vertices and $m = |E|$ edges. A **forest** is a subset of edges that contains no cycle.

::: math definition Definition
A **matroid** is a pair $(E, \mathcal{I})$, where $\mathcal{I}$ is a family of subsets of $E$, such that:

1. $\varnothing \in \mathcal{I}$.
2. If $I \in \mathcal{I}$ and $J \subseteq I$, then $J \in \mathcal{I}$.
3. If $A, B \in \mathcal{I}$ and $|A| < |B|$, then there is an element $e \in B \setminus A$ with $A \cup \{e\} \in \mathcal{I}$.

The sets in $\mathcal{I}$ are **independent**, and the maximal ones are **bases**. A subset of $E$ that is not independent is **dependent**.
:::

::: math definition Definition
The **graphic matroid** of $G$ has ground set $E$, and a set $I \subseteq E$ is independent exactly when $I$ is a forest.
:::

::: math definition Definition
For a weight function $w : E \to \mathbb{Z}$, the weight of a set $S$ is

$$
w(S) = \sum_{e \in S} w(e).
$$

A **maximum-weight basis** is a basis of maximum weight. The **rank** of $S \subseteq E$ is

$$
r(S) = \max \{ |I| : I \subseteq S,\ I \in \mathcal{I} \}.
$$
:::

::: math lemma Lemma
The graphic matroid is a matroid.
:::

::: math proof Proof
The empty set is a forest, and every subset of a forest is a forest, so the first two axioms hold. For exchange, let $A$ and $B$ be forests with $|A| < |B|$. Suppose that no edge of $B \setminus A$ can be added to $A$. Then every edge of $B \setminus A$ has both endpoints in the same connected component of $(V, A)$, and every edge of $A \cap B$ does as well. Hence every edge of $B$ lies inside one component of $(V, A)$. If the components have sizes $s_1, \ldots, s_k$, the forest $B$ has at most $s_i - 1$ edges inside component $i$, so

$$
|B| \le \sum_{i=1}^{k} (s_i - 1) = n - k = |A|,
$$

a contradiction. Therefore some edge of $B \setminus A$ can be added to $A$. $\square$
:::

::: math lemma Lemma
For the graphic matroid, $r(S) = n - c(S)$, where $c(S)$ is the number of connected components of $(V, S)$, including isolated vertices.
:::

::: math proof Proof
Inside every component of $(V, S)$, a spanning tree has one fewer edge than the number of vertices, so $n - c(S)$ edges can be chosen without a cycle. A set of $n - c(S) + 1$ edges inside the components cannot be acyclic: a forest with that many edges would have $c(S) - 1$ components, but a subset of $S$ has no edge between two components of $S$, so it cannot have fewer than $c(S)$ components. Therefore the maximum independent subset of $S$ has size $n - c(S)$. $\square$
:::

::: math lemma Lemma
Let $B$ be a basis of a matroid and let $e \notin B$. Then $B \cup \{e\}$ contains a unique circuit $C$, and for every $f \in C \setminus \{e\}$, the set $B \setminus \{f\} \cup \{e\}$ is a basis.
:::

::: math proof Proof
Since $B$ is maximal independent, $B \cup \{e\}$ is dependent and contains a circuit. If two different circuits $C_1$ and $C_2$ were contained in $B \cup \{e\}$, both would contain $e$, because $B$ is independent, and their symmetric difference would contain a nonempty circuit inside $B$, a contradiction. So the circuit $C$ is unique.

For $f \in C \setminus \{e\}$, the set $B' = B \setminus \{f\} \cup \{e\}$ has $|B|$ elements. If $B'$ contained a circuit $C'$, then $C'$ would also be a circuit of $B \cup \{e\}$ and $C' \ne C$ because $f \notin C'$. That contradicts uniqueness, so $B'$ is independent and, having the same size as a basis, is a basis. $\square$
:::

::: math lemma Lemma
Let $I$ be independent and let $e$ be a maximum-weight element such that $I \cup \{e\}$ is independent. Then there is a maximum-weight basis $B$ with $I \cup \{e\} \subseteq B$.
:::

::: math proof Proof
Induct on the number of greedy choices. The base case is the empty set, where any maximum-weight basis contains $I$. Assume $B$ is a maximum-weight basis containing $I$. If $e \in B$, take $B$ itself. Otherwise $B \cup \{e\}$ contains a unique circuit $C$. The set $I \cup \{e\}$ is independent, so $C$ is not contained in $I \cup \{e\}$; therefore $C$ contains an element $f \notin I \cup \{e\}$. Since $C \subseteq B \cup \{e\}$ and $f \ne e$, we have $f \in B \setminus I$. The set $I \cup \{f\}$ is a subset of $B$ and is independent, so $f$ was a candidate when $e$ was chosen, which gives $w(e) \ge w(f)$. By the basis exchange lemma, $B' = B \setminus \{f\} \cup \{e\}$ is a basis. It contains $I \cup \{e\}$ and satisfies $w(B') \ge w(B)$, so it is a maximum-weight basis. $\square$
:::

::: math theorem Theorem
The greedy algorithm that sorts $E$ by decreasing weight and adds an element whenever the current set stays independent returns a maximum-weight basis.
:::

::: math proof Proof
After each greedy step, the lemma supplies a maximum-weight basis containing the chosen set. At the end the chosen set $G$ is maximal independent, hence a basis. A maximum-weight basis $B$ contains $G$, and every basis has the same cardinality, so $|B| = |G|$ and therefore $B = G$. The greedy set is a maximum-weight basis. $\square$
:::

::: math corollary Corollary
Kruskal's algorithm, run on the graphic matroid, returns a maximum-weight spanning forest.
:::

::: math proof Proof
The theorem gives a maximum-weight basis. A basis of the graphic matroid is a maximal forest. When an edge is rejected, its endpoints are already connected by the chosen edges, and later merges cannot disconnect them, so no rejected edge can be added at the end. The basis is therefore a spanning forest. $\square$
:::

The rank formula is the reason a spanning forest has exactly $n - c(E)$ edges. It also shows why every basis of the graphic matroid has the same size, which is the fact used at the end of the optimality proof.

## Algorithm derivation

The algorithm has four steps.

1. Read the $m$ edges and sort them by weight in decreasing order.
2. Create a disjoint set union with one singleton set per vertex.
3. Visit the edges in sorted order. If the endpoints are in different sets, unite the sets and add the weight to the total.
4. Print the total.

The disjoint set union is the independence oracle. A forest stays a forest exactly when the new edge joins two different components, and the union-find structure stores those components. A self-loop has equal endpoints and is never added. Parallel edges are handled without a special case: the first one may be added, and the second one is rejected because its endpoints are already connected.

```text
KRUSKAL-MAXIMUM(n, edges)
    sort edges by weight in decreasing order
    for v = 1 to n:
        parent[v] = v
        size[v] = 1
    total = 0
    for each (u, v, w) in edges:
        ru = FIND(u)
        rv = FIND(v)
        if ru != rv:
            UNION(ru, rv)
            total = total + w
    return total
```

The sort is the only step that needs a comparison, and it is also the only step whose cost depends on the order of the input. The union-find pass is almost linear. The algorithm never looks at an edge twice and never stores the chosen forest beyond the union-find arrays, because only the total weight is requested.

If the actual edges are needed, the same loop records the accepted edges. If the graph is disconnected, the loop simply runs out of edges and the recorded set is a spanning forest. No separate connectivity check is required: a component with $s$ vertices contributes exactly $s - 1$ accepted edges.

## Step-by-step execution

Take five vertices and the following eight edges.

| Edge | Endpoints | Weight |
| ---- | --------- | ------ |
| a    | 1, 2      | 9      |
| b    | 3, 4      | 8      |
| c    | 1, 3      | 7      |
| d    | 2, 4      | 6      |
| e    | 4, 5      | 5      |
| f    | 2, 5      | 4      |
| g    | 1, 5      | 3      |
| h    | 2, 3      | 2      |

The edges are already listed in decreasing order. The trace is below. A component is written as a set of vertices, and the notation $12$ means the set $\{1, 2\}$.

| Step | Edge | Weight | Components before | Decision                       | Total |
| ---- | ---- | ------ | ----------------- | ------------------------------ | ----- |
| 1    | a    | 9      | 1, 2, 3, 4, 5     | take, merge 1 and 2            | 9     |
| 2    | b    | 8      | 12, 3, 4, 5       | take, merge 3 and 4            | 17    |
| 3    | c    | 7      | 12, 34, 5         | take, merge 12 and 34          | 24    |
| 4    | d    | 6      | 1234, 5           | discard, 2 and 4 are connected | 24    |
| 5    | e    | 5      | 1234, 5           | take, merge 1234 and 5         | 29    |
| 6    | f    | 4      | 12345             | discard, 2 and 5 are connected | 29    |
| 7    | g    | 3      | 12345             | discard, 1 and 5 are connected | 29    |
| 8    | h    | 2      | 12345             | discard, 2 and 3 are connected | 29    |

The accepted edges are a, b, c, and e. They form the tree

$$
\{1, 2\},\ \{3, 4\},\ \{1, 3\},\ \{4, 5\},
$$

which connects all five vertices, and the total weight is $29$. The rejected edge d is the lightest edge of the cycle $1$--$2$--$4$--$3$--$1$ that d closes with the first three accepted edges, so the cycle rule says it is safe to discard. The same happens to f, g, and h after the fifth edge connects the last component.

A disconnected example changes only the last line of the trace. If vertex 5 had no incident edge, the loop would accept a, b, and c, reject d, then run out of edges, and the total would be $24$. The chosen set would be a spanning tree of the component $\{1, 2, 3, 4\}$ and a trivial tree of the component $\{5\}$, which is a spanning forest.

## Correctness proof

The proof has three parts: the graphic matroid is a matroid, the greedy choice is safe, and the final set is a spanning forest.

The first part is the exchange lemma proved in the formal model. It uses only the counting fact that a forest on $n$ vertices with $k$ components has $n - k$ edges. This is where the graph structure enters; every later step is matroid theory.

The second part is the greedy exchange lemma. At every step, the heaviest addable element can be included in some maximum-weight basis. The proof swaps it for an edge of the fundamental circuit that is no heavier, so the weight does not decrease. Induction over the steps gives a maximum-weight basis that contains every greedy choice. Since the greedy set is maximal, it is a basis, and a maximum-weight basis of the same size must equal it.

The third part is the spanning-forest corollary. A maximal forest cannot leave two components joined by an unchosen edge: that edge would have joined two different components when it was considered, so it would have been chosen. Components only merge, so the edge still joins two vertices of the same final component. A maximal forest therefore spans every connected component.

Ties do not affect the argument. The greedy exchange lemma uses $w(e) \ge w(f)$, and equality is enough. Different tie orders can produce different maximum spanning forests, but every one of them has the same total weight.

The proof also explains the failure of non-matroid greedy rules. The matching family in Common mistakes is hereditary and contains the empty set, but it fails the exchange axiom. The greedy exchange lemma has no replacement for the missing exchange property, and the greedy algorithm can be strictly worse than the optimum.

## Complexity analysis

| Method                                   | Time                             | Space      |
| ---------------------------------------- | -------------------------------- | ---------- |
| Exhaustive subsets                       | $O(2^m (n + m))$                 | $O(n + m)$ |
| Kruskal with a disjoint set union        | $O(m \log m + (n + m)\alpha(n))$ | $O(n + m)$ |
| Prim with a binary heap, connected graph | $O(m \log n)$                    | $O(n + m)$ |
| Boruvka                                  | $O(m \log n)$                    | $O(n + m)$ |

The sorting step costs $O(m \log m)$. The union-find pass performs at most $m$ finds and at most $n - 1$ unions. With union by size and path halving, the amortized cost per operation is $O(\alpha(n))$, where $\alpha$ is the inverse Ackermann function and is at most $4$ for any input that fits in memory. The total is $O(m \log m + (n + m)\alpha(n))$, which is $O(m \log m)$ whenever $m$ is at least a small fraction of $n$.

The space is $O(n + m)$: the edge array, the parent array, and the size array. The chosen forest does not need its own storage unless the edges must be printed, and even then the accepted edges are a subset of the input array.

The comparison with the exhaustive baseline is stark. At $n = 10^3$ and $m = 10^5$, the sort performs about $1.7 \ast 10^6$ comparisons, while the enumeration would need $2^{100000}$ subset tests. The greedy algorithm is not an optimization of the enumeration; it replaces it.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Maximum spanning tree of a connected graph | Kruskal with a disjoint set union |
| Maximum spanning forest of a disconnected graph | The same Kruskal pass; it stops when the edges run out |
| Dense graph given as an adjacency matrix | Prim in $O(n^2)$ |
| Need the actual edges of the forest | Kruskal and record the accepted edges |
| Need only the total weight | Kruskal and discard the edges |
| Weights may be negative and the forest must span every component | Keep Kruskal; negative edges are taken when they are needed |
| Weights may be negative and any independent set is allowed | Stop before taking a negative edge; this is a different problem |
| At most one edge per color, plus acyclicity | Weighted matroid intersection, not plain greedy |
| Directed edges and an arborescence is required | Edmonds' algorithm; the branching constraint is not a matroid greedy |
| A longest path or a Hamiltonian cycle | NP-hard; no matroid formulation helps |

The negative-weight row deserves emphasis. A basis of a matroid always has the full rank, so a maximum-weight basis may contain negative elements when they are the only way to connect a component. The maximum-weight independent set, without the requirement to be a basis, would drop them. The program in this article computes the basis, because the contract asks for a spanning forest. The fixture with the weights $-1$, $-2$, and $-3$ checks that the program accepts the negative edges that connect components instead of dropping all of them.

The color row is the boundary of the greedy theorem. Acyclicity is one matroid, and "at most one edge of each color" is a partition matroid. The intersection of two matroids is still polynomial, but it needs augmenting paths rather than a single sorted pass. Three matroids are already NP-hard in general.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read $n$ and $m$.
2. Read $m$ triples $u$, $v$, $w$, each describing an undirected edge of weight $w$.
3. Sort the edges by decreasing weight.
4. Add an edge whenever its endpoints are in different components.
5. Print the total weight of the resulting spanning forest, one integer per line.

The input is whitespace-separated, so a line break may appear anywhere between two numbers. Vertices are numbered from $1$ to $n$. The graph may be disconnected, may contain self-loops and parallel edges, and may have negative weights. The output is the sum over all components, including components that consist of a single vertex and contribute nothing.

The C and C++ variants store the total in `long long`, Java uses `long`, Python uses arbitrary-precision integers, Pascal uses `Int64`, and JavaScript uses `BigInt`. These choices are deliberate: the sum can exceed the range of a 32-bit integer even when every single weight fits in one. The JavaScript variant does not rely on the 53-bit exact range of `Number`, so it is correct for the full signed 64-bit sum.

The C variant sorts with `qsort`, the C++ variant with `std::sort`, Java with `Arrays.sort` on an object array, Python with `list.sort`, Pascal with an iterative merge sort, and JavaScript with `Array.prototype.sort`. All six comparators are strict and none of them subtracts two weights, so a comparison cannot overflow and the sort cannot be confused by ties.

The C, C++, and Java variants read tokens with buffered input or with a byte-buffer scanner. The Python variant reads the whole input once and splits it, which keeps the parsing loop out of the interpreter's per-token overhead. The Pascal variant reads one argument per `Read`, uses `SysUtils`, and avoids `IOResult`, which keeps it inside the subset that the browser-based compiler accepts. The JavaScript variant reads standard input as one string and splits it, because Node has no synchronous line reader worth the complexity here.

The manifest publishes only the `program` variant. A reusable `minimal` variant would need the caller to supply the edge array, the vertex count, and the weight type, and the algorithm itself is a sort plus a union-find loop. A class would hide the two arrays without making either step clearer, so the complete program is the better reference.

## Recursion decision

Kruskal's algorithm is iterative, and every part of it can be written without recursion. The sort is library code in five languages and a bottom-up merge in Pascal. The union-find find is a loop with path halving. The edge pass is a single loop.

The find operation is the only place where a recursive formulation is tempting:

```text
FIND(x)
    if parent[x] != x:
        parent[x] = FIND(parent[x])
    return parent[x]
```

That version is correct, but its depth is the height of the union-find tree. Union by size keeps the height at $O(\log n)$, and path compression keeps it even smaller in practice, so the recursion is harmless for $n$ up to the millions. The loop is still preferable, because it makes the path halving visible and because the iterative version cannot overflow the stack on a pathologically ordered input.

The Pascal merge sort is also written bottom-up. A top-down merge sort would have depth $O(\log m)$, which is at most about $18$ for the stated input, but the bottom-up version needs no frames at all and avoids the function-call overhead in the translated JavaScript.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB | About $10^5$ frames | The loop; recursion is unnecessary |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

The recursion that must be avoided is the exhaustive search over subsets. Its depth is $m$, and its number of leaves is $2^m$. The matroid argument replaces that recursion entirely rather than making it faster.

## Implementation walkthrough

Four details decide whether a Kruskal program is correct.

**The sort is descending, and the comparator is strict.** The comparator must return a negative number, zero, or a positive number according to whether the first weight is larger, equal, or smaller. Subtracting the weights is a common shortcut, but it overflows when the weights are large. Equal weights must still return zero, so compare without arithmetic.

```cpp
std::sort(edges.begin(), edges.end(), [](const Edge &a, const Edge &b) {
    if (a.weight != b.weight) {
        return a.weight > b.weight;
    }
    return false;
});
```

**The union-find test comes before the union.** An edge is added only when its endpoints have different roots. Calling `unite` first and then checking a flag is also correct if `unite` returns false for a cycle, but the roots must be computed before any parent pointer changes. Path halving compresses the path without changing the root, so it is safe inside the find.

```cpp
int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}
```

**The total is 64-bit.** A single weight may be small enough for an `int`, but the sum over $n - 1$ edges can exceed $2^{31} - 1$. Accumulate in `long long`, `long`, `Int64`, or a Python integer. The C variant uses `%lld`, the Java variant uses `long`, and the JavaScript variant uses `BigInt`.

**The graph may be disconnected.** The algorithm must not assume that $m \ge n - 1$ or that every vertex has an incident edge. A vertex with no edges is a component of size one and contributes zero. A component with $s$ vertices contributes $s - 1$ accepted edges. The total is the sum over all components, and no special case is needed in the loop.

A compact Python core is:

```python
edges.sort(reverse=True)
parent = list(range(n))
size = [1 for _ in range(n)]
total = 0

for weight, u, v in edges:
    ru = find(u)
    rv = find(v)
    if ru == rv:
        continue
    if size[ru] < size[rv]:
        ru, rv = rv, ru
    parent[rv] = ru
    size[ru] += size[rv]
    total += weight
```

The loop has one job: keep the invariant that every component of the chosen forest is exactly one set of the union-find structure. The invariant holds before the loop, and each accepted edge merges two sets that were different, so it holds after every iteration.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sorting ascending | The program returns a minimum spanning forest | Sort descending for a maximum |
| Using `a.weight - b.weight` as the comparator | The subtraction overflows for large weights | Compare with `>` and `<` |
| Using `>=` in the comparator | The order is not strict and the sort may corrupt the array | Return false for equal weights |
| Adding an edge before checking the roots | The chosen set can contain a cycle | Check the roots first |
| Accumulating in a 32-bit integer | The total wraps around | Use a 64-bit type or a Python integer |
| Dropping negative edges to "maximize" | The result is not a spanning forest | Keep negative edges that connect components |
| Assuming the graph is connected | An isolated vertex is ignored or the program crashes | Initialize every vertex in the union-find |
| Forgetting self-loops | A self-loop is added and creates a cycle | The root test rejects it automatically |
| Using a recursive find without union by size | The tree can become a path and the stack overflows | Use path halving and union by size |
| Treating the problem as a matching | Greedy takes a heavy edge and blocks two better ones | Check the exchange property first |

### Why this fails: a hereditary family without exchange

The matching family is the smallest useful counterexample to "greedy works for any hereditary family". Take a path with vertices $1$, $2$, $3$, $4$ and edges $(1, 2)$ of weight $2$, $(2, 3)$ of weight $3$, and $(3, 4)$ of weight $2$. The independent sets are the matchings: the empty set, the three single edges, and the pair $(1, 2)$ with $(3, 4)$. The family is hereditary, because every subset of a matching is a matching, and it contains the empty set. It is not a matroid.

Greedy sorts the edges $3$, $2$, $2$. It takes the middle edge $(2, 3)$ with weight $3$. The other two edges share a vertex with it, so both are rejected. The greedy total is $3$. The optimum is the matching of the two weight-$2$ outer edges, with total $4$.

The exchange axiom fails on $A = \{(2, 3)\}$ and $B = \{(1, 2), (3, 4)\}$. Here $|A| = 1 < 2 = |B|$, but neither edge of $B \setminus A$ can be added to $A$: each shares a vertex with the edge already chosen. The greedy exchange lemma has no edge $e$ to choose, so its proof cannot start. The example is minimal in the sense that weights $1, 2, 1$ would make the greedy total tie the optimum, so a strict failure needs the middle edge to be heavier than both alternatives.

### Why this fails: the wrong direction

The other common failure is the sign of the sort. On a triangle with weights $1$, $2$, and $3$, a maximum spanning tree uses the edges of weights $3$ and $2$ and has total $5$. A program that sorts ascending uses the edges of weights $1$ and $2$ and reports $3$. The program is a correct minimum spanning tree solver and a wrong maximum spanning forest solver at the same time.

A triangle is the smallest graph on which the two objectives can differ with a choice. On two edges the only spanning tree uses both edges, so the direction cannot matter. The bug appears as soon as there are three edges and two of them can be chosen.

## Variants and extensions

- **Minimum spanning forest.** Reverse the comparator, or negate every weight and use the maximum version. The matroid argument is identical.
- **Prim's algorithm.** Grow one tree from a starting vertex using the cut rule. With a binary heap it costs $O(m \log n)$ and is preferable on dense graphs, but it must be restarted for every connected component.
- **Boruvka's algorithm.** Every component chooses its lightest outgoing edge and the choices are merged in parallel. It also follows from the cut rule and is useful when the edges are generated implicitly.
- **Partition matroids.** The independent sets choose at most one element from each group. Sorting by weight and taking an element when its group is still free is the greedy algorithm.
- **Transversal matroids.** Scheduling unit jobs with deadlines is the standard example. Sort by profit and place each job in the latest free slot at or before its deadline.
- **Linear matroids.** The independent sets are linearly independent vectors. Gaussian elimination or an [XOR basis](/algorithms/advanced/xor-bases) is the independence oracle, and the same greedy rule builds a maximum-weight basis.
- **Truncated matroids.** The independent sets of size at most $k$ form a matroid. Kruskal stopped after $k$ edges is the greedy algorithm on the truncation, which is the Arctic Network variant.
- **Matroid intersection.** Two matroids on the same ground set. A maximum common independent set is found with augmenting paths, and the colorful spanning tree is the standard example. The King's Guards is a weighted instance.
- **Matroid union.** Several matroids on disjoint copies of the ground set, used for packing problems such as two disjoint spanning trees.
- **Dynamic MST.** When edges arrive over time, a [link-cut tree](/algorithms/trees/dynamic-trees) maintains the spanning forest and replaces the heaviest edge on the cycle. The matroid exchange property is the reason the replacement is local.
- **MST uniqueness.** An MST is unique exactly when every edge not in it is strictly heavier than every edge on the path it closes in the tree. Equal weights are the only source of ambiguity.
- **Matroid duality.** The dual of a graphic matroid is a cographic matroid, whose circuits are the minimal cuts. This is a different problem with the same vocabulary.

## Contest strategy

1. Identify the ground set and the independent sets. If the independent sets are forests, the graphic matroid applies directly.
2. Check the exchange property, or cite one of the standard matroids. If the family is hereditary but not exchange-closed, the greedy rule needs a different proof.
3. Decide whether the problem asks for a basis or for any independent set. A basis has full rank, so negative weights may be required; an independent set may drop them.
4. Sort once, in the direction of the objective. Write a strict comparator that does not subtract.
5. Use a disjoint set union with path halving and union by size. Initialize every vertex, including isolated ones.
6. Accumulate the answer in a 64-bit type. Test negative weights, self-loops, parallel edges, and an empty edge list.
7. If a second independent constraint appears, look for a matroid intersection formulation. If a third appears, check whether the problem is actually NP-hard before spending time on an algorithm.

## Worked problems

### Problem 1: Minimum Spanning Tree

**Restatement.** The input contains several test cases. Each case gives $n$ and $m$, then $m$ undirected edges with integer weights, and the input ends with the line `0 0`. For each case, print the cost of a minimum spanning tree, then the edges of one such tree with the smaller endpoint first and in lexicographic order. If no spanning tree exists, print `Impossible`.

**Naive baseline.** Enumerate all subsets of edges, test acyclicity and connectivity, and keep the cheapest spanning tree. The cost is exponential in $m$.

**Insight.** The acyclic sets form the graphic matroid, so Kruskal's rule returns a minimum spanning tree. A spanning tree on $n$ vertices has exactly $n - 1$ edges, so a run that accepts fewer edges proves that the graph is disconnected.

**Derivation.** Sort ascending, run Kruskal, and record the accepted edges. If the count is less than $n - 1$, print `Impossible`. Otherwise print the total, then sort the accepted edges by their endpoint pairs and print them. The lexicographic order is a presentation rule; the selection order is by weight.

**Correctness.** The matroid theorem gives a minimum-weight basis. The count test is exact because a forest on $n$ vertices with $n - 1$ edges is a spanning tree, and a disconnected graph cannot supply that many independent edges. The printed edge list is a reordering of the same tree, so it has the same cost.

**Complexity.** $O(m \log m + (n + m)\alpha(n))$ time and $O(n + m)$ space per test case. The output sort costs $O(n \log n)$, which is dominated by the edge sort.

**Common wrong approach.** Printing the accepted edges in the order Kruskal found them. That order is by weight, not lexicographic, and the judge compares the edge list exactly.

### Problem 2: Arctic Network

**Restatement.** There are $P$ outposts with integer coordinates and $S$ satellite channels. Two outposts with channels communicate directly; all other communication is by radio and requires distance at most $D$. Find the smallest $D$ that connects every outpost, and print it to two decimals.

**Naive baseline.** Enumerate the $S$ outposts that receive channels and, for each choice, compute a minimum spanning forest with $S$ components, one containing each chosen outpost. The number of choices is exponential in $S$ and $P$.

**Insight.** The satellite channels allow up to $S$ radio components, and using all of them can only relax the distance bound, so an optimal solution has exactly $S$ components. The radio links therefore form a spanning forest with $S$ components, which has $P - S$ edges. Kruskal's first $P - S$ accepted edges form the best such forest, and its heaviest edge is the answer.

**Derivation.** Build the complete graph on the outposts, using squared Euclidean distances as weights. Sort ascending and run Kruskal, stopping after $P - S$ accepted edges. The weight of the last accepted edge is $D^2$, so take its square root and print two decimals. Comparing squared distances avoids floating-point reordering of nearly equal edges.

**Correctness.** A forest with $S$ components is a basis of the truncation of the graphic matroid to $P - S$ edges, so the matroid greedy theorem makes Kruskal's forest minimum-weight. For the bottleneck objective, any forest with $P - S$ edges has a heaviest edge at least as large as the last edge Kruskal accepts, because below that threshold the graph still has more than $S$ components and cannot supply $P - S$ forest edges. The last accepted edge is therefore the smallest possible maximum radio distance.

**Complexity.** $O(P^2 \log P)$ time and $O(P^2)$ space, because the complete graph has $P(P - 1)/2$ edges. With $P \le 500$ the edge count is at most $124750$.

**Common wrong approach.** Building a full minimum spanning tree, then dropping the $S$ heaviest edges. A spanning forest with $S$ components keeps $P - S$ edges and drops $S - 1$ edges, so the off-by-one produces the wrong threshold.

### Problem 3: The King's Guards

**Restatement.** There are $n$ villages, $r$ roads with improvement costs, and $g$ guards. Each guard may be placed in a given subset of villages. Choose roads to improve and one village per guard so that every guard is placed, every village is reachable by exactly one guard, and no two guards can reach each other. Minimize the total cost, or print `-1` if no placement works.

**Naive baseline.** Enumerate the assignment of guards to villages, and for each assignment compute a minimum spanning forest with $g$ components, one containing each assigned village. The number of assignments is exponential.

**Insight.** Add a virtual root $0$. For every guard $i$ and every village $v$ in its subset, add a zero-cost edge from $0$ to $v$ with color $i$. A valid deployment is a spanning tree of the augmented graph that uses at most one edge of each guard color, with the village edges capped at $n - g$. That is a common basis of the graphic matroid and a partition matroid.

**Derivation.** The ground set is the road edges, which are uncolored and have capacity $n - g$, plus the root edges, which have one color per guard and capacity one. Find a minimum-weight common independent set of size $n$ with weighted matroid intersection. If no such set exists, print `-1`. The root edges of the solution identify the village chosen for each guard, and the road edges form a forest whose $g$ components each contain exactly one guard.

**Correctness.** In one direction, a valid deployment has $g$ guard villages and a forest of $n - g$ roads because each component has exactly one guard and there are $g$ components. Adding the root edges gives a spanning tree of the augmented graph with one edge per guard color, so it is a common basis. In the other direction, a common basis of size $n$ is a spanning tree with at most one root edge per guard and at most $n - g$ road edges. It has exactly $n$ edges, so it uses exactly $g$ root edges, one per guard, and $n - g$ road edges. Removing the root leaves $g$ components, each attached to exactly one guard, so the placement is valid.

**Complexity.** Weighted matroid intersection is polynomial. The standard augmenting-path implementation performs at most $n$ augmentations, and each exchange graph is built with independence oracle calls on the graphic matroid and the partition matroid. With $n \le 300$, at most about $45000$ road edges, and at most $90000$ root edges, the augmented graph stays small enough for a carefully implemented matroid intersection; the graphic oracle is the part that must be made efficient. The exact bound depends on the oracle, which is a disjoint set union rebuilt or rolled back for each test.

**Common wrong approach.** Finding a minimum spanning tree of the augmented graph without the color constraint. Every root edge costs zero, so the tree may use several root edges of the same guard and leave another guard unplaced. The color constraint is the partition matroid, and dropping it changes the problem.

## Practice progression

1. **Recognition.** Given a statement, list the ground set and the independent sets, and decide whether the exchange property holds.
2. **Direct application.** Implement Kruskal for a maximum spanning forest and compare it with the exhaustive enumeration on random graphs with up to ten edges.
3. **Adaptation.** Solve the minimum version and the version with $k$ components, and check that the comparator and the stopping rule are the only changes.
4. **Combination.** Model scheduling with deadlines as a transversal matroid, and compare the greedy schedule with a brute-force search on small instances.
5. **Challenge.** Implement a colorful spanning tree with matroid intersection, and test it against exhaustive enumeration on random small graphs with repeated colors.
6. **Transfer.** Recognize the graphic matroid in MST variants such as the second-best MST and the dynamic MST, and the linear matroid in XOR basis problems.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the three axioms of a matroid. (Formal model)
2. Prove that the graphic matroid satisfies the exchange axiom. (Formal model)
3. Why is a forest on $n$ vertices with $k$ components exactly $n - k$ edges? (Formal model)
4. State the greedy exchange lemma and explain the role of the circuit. (Formal model)
5. Why does the greedy algorithm return a basis rather than an arbitrary independent set? (Correctness proof)
6. Why is the final forest spanning? (Correctness proof)
7. What is the cost of the sort, the union-find pass, and the whole algorithm? (Complexity analysis)
8. Why must the total be stored in a 64-bit type? (Implementation walkthrough)
9. Give a hereditary family that is not a matroid, and show that greedy fails on it. (Common mistakes)
10. What changes when the graph is disconnected, and what changes when a second matroid constraint is added? (Algorithm selection and Variants and extensions)

## Further reading

- The subject index lists this technique beside the other advanced algorithms in [the advanced algorithms](/algorithms/advanced/).
- The spanning tree that this technique generalizes is in [minimum spanning trees](/algorithms/graphs/mst).
- The disjoint set union that supplies the independence oracle is in [the disjoint set union](/algorithms/graphs/dsu).
- The sort that dominates the running time is in [sorting](/algorithms/foundations/sorting).
- The loop invariant that the chosen set is always a forest is in [loop invariants](/algorithms/foundations/loop-invariants).
- The exchange argument in its simplest form is in [interval scheduling](/algorithms/greedy/interval-scheduling).
- The feasibility test that a greedy algorithm can use instead of a full construction is in [the feasibility oracle](/algorithms/greedy/feasibility-oracle).
- The linear matroid that uses the same greedy rule over bits is in [XOR bases](/algorithms/advanced/xor-bases).
- The offline batching of many independent searches is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The rollback structure that makes a matroid intersection oracle efficient is in [rollback disjoint set union](/algorithms/advanced/rollback-dsu) and [offline dynamic connectivity](/algorithms/advanced/offline-dynamic-connectivity).
- The matching problem whose independence system is not a matroid is in [bipartite matching](/algorithms/graphs/bipartite-matching).
- The dynamic forest that maintains an MST under edge insertions is in [dynamic trees](/algorithms/trees/dynamic-trees).
