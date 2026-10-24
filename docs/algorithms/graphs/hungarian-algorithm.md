---
id: graphs.hungarian-algorithm
title: The Hungarian algorithm
summary: A minimum-cost perfect matching between two equal-sized sides, found by keeping dual potentials feasible and augmenting along the cheapest alternating path.
division: [gold]
subjects: [graphs]
level: advanced
importance: common-contest-technique
keywords:
    [
        assignment problem,
        minimum-cost matching,
        dual potentials,
        augmenting path,
        Kuhn-Munkres,
        alternating tree,
    ]
prerequisites:
    required: [graphs.bipartite-matching, graphs.representation]
    recommended: [graphs.dijkstra]
complexity:
    time: "O(n^3)"
    space: "O(n^2)"
assumptions:
    - The two sides have the same size, so a perfect matching exists.
    - Every cost and every partial sum fits in a signed 64-bit integer.
implementations: graphs.hungarian-algorithm
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.hungarian-algorithm" />

<CodeViewer algorithm="graphs.hungarian-algorithm" />

The Hungarian algorithm solves the assignment problem: given an $n$ by $n$ matrix of costs, pair every row with a different column so that the total cost is as small as possible. The answer is a permutation, and its cost is the sum of the $n$ chosen cells.

The algorithm keeps three objects in step. A **matching** records which row is paired with which column. A pair of **potentials**, one per row and one per column, gives every cell a **slack**, the amount by which its cost exceeds the two potentials. A cell whose slack is zero is **tight**, and a matching made entirely of tight cells certifies its own optimality. The algorithm grows the matching along augmenting paths through tight cells, and when no such path exists it shifts the potentials to make the cheapest remaining edge tight.

That is the whole method. The subtle part is the shift: it must preserve the tightness of the edges already in the matching and keep every slack nonnegative. The dense implementation in this article does the shift with a few array updates, which is why the running time is $O(n^3)$ and the auxiliary space is $O(n)$ beyond the matrix.

Harold Kuhn published the method in 1955 and named it the Hungarian method because it extends the work of Dénes König and Jenő Egerváry. James Munkres simplified the presentation in 1957, so the algorithm is also called the Kuhn-Munkres algorithm.

| Property | Value |
| --- | --- |
| Problem | Pair $n$ rows with $n$ columns, each used once, minimizing the total cost |
| Input | An $n$ by $n$ matrix of integer costs |
| Output | The minimum total cost and an optimal permutation |
| Time | $O(n^3)$ |
| Auxiliary space | $O(n)$ beyond the $O(n^2)$ cost matrix |
| Key objects | Row and column potentials, slacks, and an alternating tree |
| Fails when | A potential is shifted with the wrong sign, or the total is accumulated in 32 bits |

## Problem motivation

A delivery company has $n$ couriers and $n$ routes. The company knows, for every courier and every route, the cost of assigning that courier to that route: fuel, overtime, and the penalty for a route that the courier does not know. It wants to assign each courier to exactly one route and each route to exactly one courier, so that the total cost is as small as possible, and it wants the assignment, not only the number.

The constraints are what make the problem interesting:

- $1 \le n \le 500$.
- Every cost is an integer with $|c_{ij}| \le 10^9$. A negative cost is a bonus, not an error.
- Each courier takes exactly one route, and each route is taken by exactly one courier.
- The company must report the minimum total cost and the assignment.

The "exactly one" in both directions is the defining constraint. It rules out the obvious greedy answers, because a cheap assignment for one courier can take away the only affordable route of another. It also rules out treating the rows and columns independently, because the choices interact through the shared columns.

The problem is a **minimum-cost perfect matching** in a complete bipartite graph. The rows are one side, the columns are the other, and the cost of the edge from row $i$ to column $j$ is $c_{ij}$. The graph is complete because every courier can take every route, and it is bipartite because a courier is never paired with another courier. The assignment is a perfect matching, and its cost is the sum of its edge costs.

An unweighted matching algorithm answers a different question. It finds the largest number of pairs and treats every edge as equally good, so it cannot tell a cheap assignment from an expensive one. The assignment problem needs the costs, and that is what the Hungarian algorithm adds to the matching machinery.

## Recognition patterns

The Hungarian algorithm is the right tool when all of the following hold.

- The problem splits into **two groups of equal size**, and every choice pairs one item from each group.
- Each item is used **exactly once**: every row gets one column and every column gets one row.
- The objective is the **sum of the chosen costs**, and the costs may differ from cell to cell.
- The costs are known in advance and do not change while the assignment is built.
- The instance is **dense**, or $n$ is small enough that an $O(n^3)$ algorithm is comfortable.

The constraint values that rule the technique in and out are worth stating plainly.

| Constraint | What it rules |
| --- | --- |
| Two equal sides, every pair allowed | Rules in the Hungarian algorithm |
| Each row and each column used exactly once | Rules in an assignment |
| The total cost is a sum over the chosen cells | Rules in linear assignment |
| The graph is sparse and $n$ is large | Rules out the dense cubic method; use min-cost flow |
| The goal is the number of pairs, not their cost | Rules in unweighted matching, not this algorithm |
| A worker may take several jobs | Rules out assignment; a flow with capacities fits |
| The cost depends on the order of the pairs | Rules out assignment; that is a traveling salesman problem |
| $n \le 20$ | A subset dynamic program is simpler, though this algorithm also works |

A handful of phrases in a statement are reliable signals. "Assign each item to exactly one", "one-to-one", "permutation", "minimum total cost" and "cost matrix" all point here. "Maximum number of pairs" points at unweighted matching. "Cheapest path" points at a shortest-path algorithm. "Each task can be split among several workers" points at a flow problem, because the right side no longer has capacity one.

The phrase "perfect matching" is ambiguous on its own. In an unweighted graph it asks whether every vertex can be matched, and an augmenting-path algorithm answers it. In a weighted complete bipartite graph it usually means the minimum-cost perfect matching, and the Hungarian algorithm answers that. The presence of a cost matrix is the tiebreaker.

<Synonyms terms="hungarian algorithm, hungarian method, kuhn-munkres algorithm, assignment problem, minimum cost matching, minimum weight perfect matching" />

## Naive approach

The first baseline is to enumerate every permutation. There are $n!$ of them, and each one costs $O(n)$ to evaluate.

```text
best = infinity
for every permutation p of 1..n:
    total = sum of c[i][p[i]] for i in 1..n
    best = min(best, total)
```

This is correct and it is the definition of the problem, but it is hopeless beyond $n = 10$. At $n = 10$ there are 3,628,800 permutations, which is already too slow for a one-second limit in a slow language. At $n = 20$ there are about $2.4 \cdot 10^{18}$, and at $n = 500$ the count is not a number a program can approach.

The second baseline is greedy. Pick the cheapest cell in the matrix, delete its row and column, and repeat. The following matrix shows why this fails.

$$
\begin{pmatrix}
1 & 2 \\
3 & 100
\end{pmatrix}
$$

The cheapest cell is the $1$ in the top left. Greedy takes it, which leaves the $100$ in the bottom right, for a total of $101$. The optimal assignment takes the $2$ and the $3$, for a total of $5$. The cheap cell was a trap: taking it forced the most expensive cell in the matrix.

Choosing the cheapest cell of each row in order fails on the same matrix. Row 1 takes the $1$, and row 2 is left with the $100$. Choosing the cheapest cell of each column in order fails in the same way. The failure is structural, not a matter of tie-breaking: any rule that fixes one cell without considering the alternatives for the other rows can be forced into an expensive completion.

The third baseline is a dynamic program over subsets. Let `dp[mask]` be the minimum cost of assigning the first $|mask|$ rows to the columns in `mask`. The recurrence tries every column in the mask for the next row. There are $2^n$ masks and $n$ transitions per mask, so the cost is $O(2^n n^2)$ time and $O(2^n)$ space. That is excellent for $n \le 20$ and impossible for $n = 500$.

The fourth baseline is a minimum-cost flow. Build a source, a node for every row, a node for every column, and a sink; give every row-to-column edge capacity one and cost $c_{ij}$, and send $n$ units. Successive shortest paths solves it in $O(n m \log n)$ time for $m$ edges, which is $O(n^3 \log n)$ on a dense matrix. It is the right answer when the graph is sparse, and it is more machinery than the dense assignment problem needs.

## Key insight

The insight is that a matching can carry a **certificate of optimality**, and the certificate is a pair of potentials.

Give every row $i$ a number $u_i$ and every column $j$ a number $v_j$. Call the pair **feasible** if

$$
u_i + v_j \le c_{ij} \quad \text{for every } i \text{ and } j.
$$

For any assignment $\sigma$, summing the inequality over the chosen cells gives

$$
\sum_{i=1}^{n} c_{i,\sigma(i)}
\ge \sum_{i=1}^{n} \left(u_i + v_{\sigma(i)}\right)
= \sum_{i=1}^{n} u_i + \sum_{j=1}^{n} v_j.
$$

Every row and every column appears exactly once in an assignment, so the right-hand side does not depend on $\sigma$. It is a lower bound on every assignment at once.

Now suppose the matching happens to use only cells where the inequality is an equality, that is $u_i + v_j = c_{ij}$. Those cells are called **tight**. Summing the equality over the matched cells gives the same lower bound, so the matching attains it. It is optimal, and the potentials prove it without comparing it to any other assignment.

The algorithm is therefore a search for a perfect matching made of tight cells. It starts with feasible potentials and an empty matching. It looks for an augmenting path through tight cells. If it finds one, it flips the path and the matching grows. If it does not, the tight cells are exhausted, and the algorithm changes the potentials so that at least one more cell becomes tight. The change is chosen to keep every slack nonnegative, so the lower bound survives. This is the primal-dual method: the matching is the primal solution, the potentials are the dual solution, and tightness is complementary slackness.

The one assumption that makes the search a shortest-path search is that every slack is nonnegative. A nonnegative slack is a nonnegative reduced cost, so the cheapest way out of the current tight region can be found greedily, exactly as Dijkstra's algorithm finds the closest unsettled vertex. The initialization $u_i = \min_j c_{ij}$ and $v_j = 0$ guarantees it for costs of either sign, because every entry of row $i$ is at least the row minimum.

## Visual intuition

Picture the cost matrix with the row potentials written in a margin on the left and the column potentials in a margin on the top. The slack of a cell is its cost minus the two margins. A tight cell has a slack of zero, and the equality graph is the set of tight cells.

The algorithm builds an **alternating tree** rooted at a free row. The tree alternates between rows and columns: a row is reached by a matched tight edge from a column, and a column is reached by a slack edge from a row. The root is the only free row in the tree; every other row entered the tree as the match of a column in the tree.

```text
row 3 -- col 3 == row 2 -- col 2 == row 1 -- col 1
         (slack 0)       (slack 1)       (slack 1)
```

The dashes are unmatched edges and the double lines are matched, tight edges. The numbers are the slacks before the first shift. The tree says: to give row 3 a column, take column 3 from row 2, move row 2 to column 2, and move row 1 to the free column 1. That is an augmenting path, and flipping it grows the matching.

When the tree does not reach a free column, the algorithm lowers the potentials on the tree by the smallest slack leaving it. In the picture, the first shift is $1$, the edge from row 2 to column 2; that makes the edge tight, adds column 2 to the tree, and adds its matched row, row 1. The next smallest slack is $1$ on the edge from row 1 to the free column 1, so the second shift is $1$ and the path can be flipped.

The matrix for this example is

```text
          col 1   col 2   col 3
row 1       3      [2]      7
row 2       6       4      [3]
row 3       5       8       1
```

with brackets on the tight cells after the first two phases. The third phase is the one that rearranges the matching, and the [step-by-step execution](#step-by-step-execution) works through its arithmetic.

The important visual point is that the tree never guesses. Every edge it follows is the cheapest edge out of the current tight region, so the path it finds is the cheapest augmenting path in the reduced costs. The potential shift is what makes the next edge of that path tight without breaking the tightness of the edges already in the matching.

## Formal model

Let $L$ be the set of rows and $R$ the set of columns, with $|L| = |R| = n$. The cost of the edge between row $i \in L$ and column $j \in R$ is $c_{ij} \in \mathbb{Z}$.

::: math definition Definition
An **assignment** is a bijection $\sigma : L \to R$. Its **cost** is $c(\sigma) = \sum_{i \in L} c_{i,\sigma(i)}$. The assignment problem asks for an assignment of minimum cost.
:::

::: math definition Definition
A pair of functions $u : L \to \mathbb{Z}$ and $v : R \to \mathbb{Z}$ is **feasible** if $u_i + v_j \le c_{ij}$ for every $i \in L$ and $j \in R$. The **slack** of the cell $(i,j)$ is $s_{ij} = c_{ij} - u_i - v_j$. The cell is **tight** when $s_{ij} = 0$. The **equality graph** is the bipartite graph of tight cells.
:::

::: math definition Definition
An **alternating tree** rooted at a free row $r$ is a tree in the bipartite graph whose root is $r$, whose edges alternate between unmatched and matched edges, and whose matched edges are tight. The rows of the tree are the root and the rows matched to the columns of the tree; the columns of the tree are reached by unmatched edges from those rows.
:::

The assignment problem has a linear-programming formulation. Let $x_{ij} = 1$ when row $i$ is assigned to column $j$ and $x_{ij} = 0$ otherwise.

$$
\min \sum_{i=1}^{n} \sum_{j=1}^{n} c_{ij} x_{ij}
$$

subject to

$$
\sum_{j=1}^{n} x_{ij} = 1 \text{ for every } i, \qquad
\sum_{i=1}^{n} x_{ij} = 1 \text{ for every } j, \qquad
x_{ij} \ge 0.
$$

The constraint matrix is totally unimodular, so the linear program has an integral optimum and its value is the value of the assignment problem. The dual is

$$
\max \sum_{i=1}^{n} u_i + \sum_{j=1}^{n} v_j
\quad \text{subject to} \quad
u_i + v_j \le c_{ij} \text{ for every } i, j.
$$

A feasible pair $(u, v)$ is exactly a feasible dual solution, and the lower bound in the previous section is weak duality.

::: math lemma Lemma (weak duality)
For every assignment $\sigma$ and every feasible pair $(u, v)$, $c(\sigma) \ge \sum_i u_i + \sum_j v_j$.
:::

::: math lemma Lemma (optimality certificate)
If $\sigma$ is an assignment and every matched cell is tight for a feasible pair $(u, v)$, then $\sigma$ is optimal.
:::

The two lemmas are proved in the [correctness proof](#correctness-proof). The first is a sum of inequalities, and the second is the observation that the lower bound is attained.

## Algorithm derivation

The state is four arrays of length $n + 1$:

- `u[i]` for the row potentials, with `u[0]` unused.
- `v[j]` for the column potentials, with `v[0]` reserved for the sentinel column.
- `p[j]` for the row matched to column $j$. The sentinel `p[0]` holds the free row that roots the current phase.
- `way[j]` for the column from which column $j$ was reached in the alternating tree.

The phase for row $i$ starts with `p[0] = i`, an empty tree, and `minv[j] = infinity` for every column. The loop that follows is a Dijkstra-like search over the columns.

1. Mark the current column `j0` as used. The row at the other end is `i0 = p[j0]`; for the sentinel column this is the free row that roots the phase.
2. For every unused column $j$, compute the slack `cur = c[i0][j] - u[i0] - v[j]` and keep the smallest slack seen for that column in `minv[j]`. Record in `way[j]` the tree column through which the row that offered that slack was reached.
3. Let `delta` be the smallest `minv[j]` over the unused columns, and let `j1` be the column that attains it.
4. Shift the potentials. For every used column $j$, decrease `v[j]` by `delta` and increase `u[p[j]]` by `delta`. For every unused column, decrease `minv[j]` by `delta`.
5. Set `j0 = j1`. If `p[j0] = 0`, the column is free and the phase ends; otherwise the matched row joins the tree and the loop continues.

The shift in step 4 is the only place where the dual changes, so it is worth checking what it does to the slacks.

- A row in the tree and a column in the tree: both potentials move in opposite directions, so the sum and the slack are unchanged.
- A row in the tree and a column outside it: the row potential rises by `delta`, so the slack falls by `delta`. It stays nonnegative because `delta` is the smallest slack on such an edge.
- A row outside the tree and a column in the tree: the column potential falls by `delta`, so the slack rises by `delta`.
- A row and a column both outside the tree: nothing changes.

The chosen edge therefore becomes tight, every previously tight edge in the tree stays tight, and no slack becomes negative. That is the invariant the proof needs.

After the loop reaches a free column, the matching is flipped along the path encoded by `way`. Starting from the free column `j0`, the loop

```text
while j0 != 0:
    j1 = way[j0]
    p[j0] = p[j1]
    j0 = j1
```

replaces the row of each column on the path by the row matched to the previous column. The last step assigns the free column to the root row, so the matching grows by exactly one.

::: math invariant Invariant
At the start of every phase, the potentials are feasible, every matched cell is tight, and the number of matched rows is one less than the phase index. During the phase, every column in the tree is matched except the sentinel, `minv[j]` is the smallest slack of an edge from a tree row to column $j$, and `way[j]` is the column through which that smallest slack was reached.
:::

The initialization deserves one line. The code sets `u[i]` to the minimum of row $i$ and leaves every `v[j]` at zero. This is feasible for costs of either sign, and it makes every row's cheapest cell tight from the start. If all costs are nonnegative, the all-zero pair is also feasible, but the row minima are safe in general and cost one row scan.

## Step-by-step execution

Take the $3$ by $3$ matrix

$$
\begin{pmatrix}
3 & 2 & 7 \\
6 & 4 & 3 \\
5 & 8 & 1
\end{pmatrix}.
$$

The row minima are $2$, $3$ and $1$, so the initial potentials are $u = (2, 3, 1)$ and $v = (0, 0, 0)$. The slacks are the matrix minus the row potentials:

$$
\begin{pmatrix}
1 & 0 & 5 \\
3 & 1 & 0 \\
4 & 7 & 0
\end{pmatrix}.
$$

**Phase 1, row 1.** The cheapest slack in row 1 is $0$ at column 2, and column 2 is free. The matching is row 1 to column 2. Nothing shifts.

**Phase 2, row 2.** The slacks in row 2 are $3$, $1$ and $0$, so the cheapest is column 3 at $0$. Column 3 is free, so the matching adds row 2 to column 3. Again nothing shifts.

**Phase 3, row 3.** The root row is row 3, and this phase needs the tree.

1. From row 3 the slacks are $4$, $7$ and $0$. Column 3 is cheapest at $0$, so it joins the tree. It is matched to row 2, so row 2 joins too.
2. The unused columns are 1 and 2. Row 2 offers $3$ and $1$; row 3 offers $4$ and $7$. The smallest is column 2 at $1$, so `delta = 1`: the tree rows rise by $1$, the tree columns fall by $1$, and the potentials become $u = (2, 4, 2)$ and $v_3 = -1$. Column 2's slack becomes $0$.
3. Column 2 joins the tree and is matched to row 1, so row 1 joins. Row 1's slack to column 1 is $1$; row 2's is $2$ after the first shift. The smallest is $1$, so `delta = 1` again: $u = (3, 5, 3)$, $v_2 = -1$, $v_3 = -2$, and column 1 becomes tight.
4. Column 1 is free. The `way` chain is column 1, then column 2, then column 3, then the sentinel. Flipping it matches row 1 to column 1, row 2 to column 2, and row 3 to column 3.

The final matching is the identity, with cost $3 + 4 + 1 = 8$. The final real potentials are $u = (3, 5, 3)$ and $(v_1, v_2, v_3) = (0, -1, -2)$, whose sum is $11 - 3 = 8$, matching the cost. Every matched cell is tight:

$$
u_1 + v_1 = 3 + 0 = 3, \qquad
u_2 + v_2 = 5 - 1 = 4, \qquad
u_3 + v_3 = 3 - 2 = 1.
$$

The printed output is the total $8$ and the $0$-based permutation $0\ 1\ 2$.

The second shift is the step that is easy to miss. Column 1 was visible from row 3 with slack $4$ and from row 2 with slack $3$, but row 1 offered $1$, and the second shift of $1$ made that edge tight. The path goes through all three rows, and the `way` array records that choice.

## Correctness proof

::: math theorem Theorem
The algorithm returns an assignment of minimum cost.
:::

::: math proof Proof
The proof has four parts: weak duality, the certificate, the invariant that the shifts preserve feasibility and tightness, and the termination of every phase.

**Weak duality.** Let $(u, v)$ be feasible and let $\sigma$ be any assignment. For every row $i$, $u_i + v_{\sigma(i)} \le c_{i,\sigma(i)}$. Summing over the rows and using the fact that $\sigma$ is a bijection,

$$
c(\sigma) = \sum_i c_{i,\sigma(i)}
\ge \sum_i u_i + \sum_i v_{\sigma(i)}
= \sum_i u_i + \sum_j v_j.
$$

**Certificate.** If every cell of $\sigma$ is tight, the same sum is an equality, so $c(\sigma) = \sum_i u_i + \sum_j v_j$. Weak duality says every assignment costs at least that bound, so $\sigma$ is optimal.

**The invariant.** Initially $(u, v)$ is feasible because $u_i = \min_j c_{ij} \le c_{ij}$ and $v_j = 0$. There is no matched cell, so tightness is vacuous. Suppose the invariant holds at the start of an iteration of the tree search. The shift changes a cell's slack by one of the four cases above: zero for a cell with both ends in the tree, $-delta$ for a row in the tree and a column outside it, $+delta$ for a row outside and a column in it, and zero for a cell with both ends outside. The first case preserves tightness, the second cannot make a slack negative because $delta$ is the minimum slack over exactly those cells, the third only increases a slack, and the fourth leaves the slack unchanged. Hence every slack stays nonnegative and every tight edge in the tree stays tight.

A matched cell has its column in the tree exactly when its row is in the tree: the root row is free, and every other tree row entered as the match of a tree column. So a matched edge either has both ends in the tree, where the shift cancels, or both ends outside, where nothing changes. It stays tight.

**Termination and augmentation.** In each iteration, one new column joins the tree. There are finitely many columns, so the loop cannot run forever without reaching a free column. It does reach one: if it only added matched columns, then after at most $n - 1$ additions all matched columns would be in the tree, and the next column with the smallest slack among the remaining columns would be free. The smallest slack is finite because the first iteration computed `minv` for every column. The `way` chain follows columns that joined the tree earlier, so it is simple and ends at the sentinel, whose row is the free root. Flipping the path matches the free column and the root row and leaves every other matched row matched, so the number of matched rows increases by one and the matching remains valid. Every edge on the path is tight after the shift, so the new matched cells are tight.

After $n$ phases there are $n$ matched rows and $n$ matched columns, which is a perfect matching. Its cells are all tight, so the certificate applies and the matching is optimal. The cost printed by the program is the sum of the matched costs, so it is the optimal cost. $\square$
:::

The exchange argument in the termination part is worth restating without symbols. The tree grows one column at a time, and each matched column it swallows brings its matched row with it. If the search never found a free column, it would eventually swallow every matched column, and the only columns left would be the free ones it was looking for. The cheapest slack out of the tree is always finite, so it cannot stall before that.

## Complexity analysis

**Time: $O(n^3)$.** There are $n$ phases. In one phase the tree loop runs at most $n + 1$ times, because each iteration adds one column and the phase stops at the latest when a free column is added. Inside one iteration, the scan over the columns is $O(n)$ and the potential update is $O(n)$. The phase therefore costs $O(n^2)$ and the whole algorithm costs $O(n^3)$.

The constant is small. The scan computes one subtraction and two comparisons per unused column, and the update is one addition or subtraction per column plus one per used column. At $n = 500$ the inner work is about $1.25 \cdot 10^8$ simple operations, which is comfortable in C++ and Java. Python is slower, but it handles the CSES limit of $n = 200$ without difficulty and is usable at $n = 500$ if the time limit is generous.

**Auxiliary space: $O(n)$ beyond the matrix.** The potentials, the matching, the `way` array, the `minv` array and the `used` array each hold $n + 1$ entries. The cost matrix is $O(n^2)$, and the manifest counts it because the program stores it rather than streaming the rows. No heap or adjacency list is needed: the complete bipartite graph is implicit in the matrix.

**The arithmetic range.** A sum of $n$ costs, each of magnitude at most $10^9$, reaches $5 \cdot 10^{11}$ at $n = 500$, which overflows a signed 32-bit integer. The potentials are signed and are updated by additions and subtractions, so they use the same 64-bit type. In JavaScript the safe-integer limit is $2^{53}$, which is about $9 \cdot 10^{15}$ and is far above the $5 \cdot 10^{11}$ of the stated constraints.

::: math complexity Complexity
The dense Hungarian algorithm: time $O(n^3)$, auxiliary space $O(n)$ beyond the $O(n^2)$ cost matrix. Every phase performs at most $n + 1$ tree iterations, and every iteration scans and updates $n$ columns.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Square cost matrix, every pair allowed, minimize the total | The Hungarian algorithm |
| The same, but maximize the total | Negate the costs and minimize; the optimal permutation is unchanged |
| Rectangular matrix with fewer rows than columns | Add zero-cost dummy rows for the unused columns |
| Rectangular matrix with fewer columns than rows | Add dummy columns, but give them a prohibitive cost unless leaving a row unassigned is allowed |
| Sparse bipartite graph with large $n$ | Min-cost flow with successive shortest paths |
| Unweighted bipartite matching | [Bipartite matching](/algorithms/graphs/bipartite-matching) and Hopcroft-Karp |
| Maximize the number of pairs with no costs | Unweighted matching, not the assignment problem |
| $n \le 20$ | A subset dynamic program, which is simpler to write |
| Costs depend on the order of the pairs | The traveling salesman problem, not assignment |
| A general graph rather than a bipartite one | A blossom algorithm for minimum-weight matching |

Two reductions are used often enough to state explicitly.

**Maximization.** If the objective is to maximize $\sum c_{i,\sigma(i)}$, replace every cost by $-c_{ij}$ and minimize. The optimal assignment is the same because negating every assignment's cost reverses the order. The potentials handle negative costs through the row-minimum initialization, so no separate algorithm is needed.

**Rectangular matrices.** If there are fewer rows than columns, add dummy rows whose cost is zero for every column. The dummy rows absorb the unused columns, and the real rows are matched to real columns. If there are fewer columns than rows, add dummy columns, but a zero-cost dummy column is a real choice: a row may take it instead of an expensive real column. That is correct only when leaving a row unassigned is allowed. When every row must be assigned, the dummy cost has to exceed any possible total, and the instance must still have a feasible assignment.

The distinction from min-cost flow is about density. The Hungarian algorithm assumes a complete bipartite graph, so its $O(n^3)$ bound does not improve when most cells are forbidden. Flow algorithms work with an explicit edge list and are faster when the graph is sparse. On a dense graph the flow network has $O(n^2)$ edges, and the extra logarithmic factor and the graph machinery make it slower than the specialized method.

## Reference implementations

The six listings above are complete programs rather than reusable functions. Each one reads $n$, then the $n$ lines of the matrix, and prints the minimum cost on the first line and the permutation on the second. The permutation is $0$-based: the first number is the column assigned to row 0, the second is the column assigned to row 1, and so on.

| Language   | File                    | Notes                                               |
| ---------- | ----------------------- | --------------------------------------------------- |
| C          | `c/program.c`           | A flat `long long` buffer and heap-allocated arrays |
| C++17      | `cpp17/program.cpp`     | `std::vector` and `std::min_element`                |
| Java       | `java/Main.java`        | `long` matrices and `StringTokenizer` input         |
| Python     | `python/program.py`     | Lists and arbitrary-precision integers              |
| Pascal     | `pascal/program.pas`    | Dynamic arrays and `Int64`                          |
| JavaScript | `javascript/program.js` | Arrays and numbers                                  |

All six use the same algorithm and the same loop order, so they break ties in the same way and produce byte-identical output on the fixtures. The fixtures are designed with unique optima anyway, so a different tie-break would not change the answer.

The C version stores the matrix in a flat buffer and indexes it as `i * n + j`, which keeps the allocation in one place. The C++ and Java versions use a vector of vectors and a two-dimensional array. The Python version relies on arbitrary-precision integers and needs no sentinel tuning. The Pascal version uses `High(Int64) div 4` as its infinity, which is safely larger than any slack and small enough that adding a shift cannot overflow. The JavaScript version uses `Number.MAX_SAFE_INTEGER / 4` for the same reason, and its totals stay below $2^{53}$ at the stated limits.

Every listing prints the cost by summing the chosen cells of the matrix rather than by reading the sentinel potential. The sentinel potential is not the negative cost once the row potentials start at the row minima, because the potential sum carries the initial row offset along. Summing the chosen cells is one loop, it cannot disagree with the permutation that is printed, and it works after any feasible initialization.

## Recursion decision

The Hungarian algorithm is iterative. Its outer structure is a loop over rows, its inner structure is a loop over columns, and the only part that could be written recursively is the walk back through the `way` array to flip the augmenting path. That walk has depth at most $n$, so it is not the recursion that decides the shape of the program.

The recursive form people sometimes write is a depth-first search for an augmenting path, in the style of Kuhn's unweighted matching algorithm. It is correct for the unweighted problem, and with the reduced costs it can be made to work for the weighted one, but it needs a recursive call per row on the path and it is harder to bound. The array walk used here visits each column on the path once and needs no stack at all.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Either form is safe at $n \le 500$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Either form is safe at $n \le 500$ |
| Python | Interpreter limit of 1000 | 1000 frames | Use the array walk, or raise the limit |
| Pascal | The operating system stack | Depends on the platform | Use the array walk |
| JavaScript | The V8 engine limit | About $10^4$ frames | Either form is safe at $n \le 500$ |

The recommendation is the same in every language: keep the array walk. It is shorter than the recursive version, it cannot overflow the stack, and the `way` array is already there because the tree search needs it. There is no divide-and-conquer recurrence in this algorithm, so there is nothing to gain from recursion.

## Implementation walkthrough

The core of the C++ listing is the phase loop. It starts by rooting the tree at row `i` and resetting the per-phase arrays.

```cpp
p[0] = i;
int j0 = 0;
std::fill(minv.begin(), minv.end(), infinity);
std::fill(used.begin(), used.end(), 0);
```

`p[0] = i` is the sentinel: column 0 is not a real column, and `p[0]` is the free row that the tree grows from. `j0 = 0` starts the search at the sentinel.

The tree iteration scans every unused column, records the best slack and the column that offered it, and picks the smallest slack.

```cpp
used[j0] = 1;
const int i0 = p[j0];
long long delta = infinity;
int j1 = 0;
for (int j = 1; j <= n; ++j) {
    if (used[j]) {
        continue;
    }
    const long long cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
    if (cur < minv[j]) {
        minv[j] = cur;
        way[j] = j0;
    }
    if (minv[j] < delta) {
        delta = minv[j];
        j1 = j;
    }
}
```

`cur` is the slack of the cell `(i0, j)`. `minv[j]` is the smallest slack seen for column $j$ from any tree row, and `way[j]` remembers the tree column through which that row was reached. The strict comparison means the first column with the smallest slack wins a tie, which makes the output deterministic.

The potential update is the dual step. Used columns are in the tree; their matched rows rise by `delta` and their own potentials fall by `delta`. Unused columns keep their slack in `minv`, so the same `delta` is subtracted from the stored slack instead of being recomputed.

```cpp
for (int j = 0; j <= n; ++j) {
    if (used[j]) {
        u[p[j]] += delta;
        v[j] -= delta;
    } else {
        minv[j] -= delta;
    }
}
```

For `j = 0`, `p[0]` is the free root row and `v[0]` is the sentinel potential. No real edge uses column 0, so this update only moves the row potential of the root; every real edge from the root loses the same `delta` from its slack, which is exactly the shift the proof describes.

The augmentation walks the `way` chain and reassigns the columns.

```cpp
do {
    const int j1 = way[j0];
    p[j0] = p[j1];
    j0 = j1;
} while (j0 != 0);
```

Each step gives column `j0` the row that was matched to `way[j0]`. The last step gives the free column the root row, because `p[0]` is the root. The loop stops at the sentinel, which has no real column to reassign.

The printed assignment is the inverse of `p`. For every real column $j$, the row `p[j]` owns it, so `assignment[p[j] - 1] = j - 1`. The total is then summed from the matrix.

Two range details are worth keeping in mind. The costs and the potentials are `long long`, because a total can exceed $2^{31}$. The sentinel `infinity` is a quarter of the largest 64-bit value, not the largest value itself, so that adding or subtracting a shift cannot overflow it; every real slack is far below that value. The C and C++ listings use `std::numeric_limits<long long>::max() / 4`, the Java and Pascal listings use the same bound through `Long.MAX_VALUE / 4` and `High(Int64) div 4`, and the C listing writes the bound as a literal.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Picking the cheapest cell greedily | A cheap cell can force a very expensive completion | Solve the whole assignment, or use the complete search as a baseline |
| Starting from zero potentials with a negative cost | The slacks can be negative, so the proof's nonnegative-slack invariant is lost | Initialize $u_i = \min_j c_{ij}$ |
| Subtracting `delta` from the row potentials and adding it to the columns | The chosen edge's slack grows, so it never becomes tight and the certificate is invalid | Add `delta` to the tree rows and subtract it from the tree columns |
| Updating only the chosen column or only the rows in the tree | The other slacks no longer match the potentials | Update every used column and every unused `minv` |
| Forgetting to reset `minv` and `used` per phase | Slack from the previous phase leaks into the new tree | Clear both arrays at the start of every phase |
| Treating `p[j]` as the assignment column of row $j$ | The printed permutation is the inverse of the answer | Build `assignment[p[j] - 1] = j - 1` |
| Summing the costs in 32-bit integers | The total can exceed $2^{31}$ for large costs and $n$ in the hundreds | Use `long long`, `long`, `Int64`, or Python integers |
| Stopping the phase on a used column instead of a free one | The path does not end at a free column, so the augmentation is invalid | Stop when `p[j0] = 0` |
| Padding a rectangular matrix with zero-cost dummy columns when costs are negative | A real row may prefer the dummy column to a negative real cost | Use a prohibitive dummy cost unless leaving the row unassigned is allowed |
| Assuming the optimum is unique | A judge that accepts any optimum is satisfied, but a fixture comparison is not | Use inputs with a unique optimum, or compare costs as well as permutations |

### Why this fails: the greedy choice

The mistake that survives review most often is the greedy one, because it looks like a shortest-path relaxation and it is correct on many small examples.

Take the $2$ by $2$ matrix

$$
\begin{pmatrix}
1 & 2 \\
3 & 100
\end{pmatrix}.
$$

The greedy scan sees the $1$ first and takes it. That removes row 1 and column 1, leaving the single cell $(2,2)$ with cost $100$. The reported total is $101$. The optimal assignment uses $(1,2)$ and $(2,1)$, with total $2 + 3 = 5$.

The failure is not caused by the order of the scan. If the scan starts at the $2$, it might take $(1,2)$ and then $(2,1)$, which is optimal, but a different matrix can make that choice fail instead. The problem is that a locally cheapest cell says nothing about the cells it removes from the other rows. The Hungarian algorithm repairs exactly this by allowing an augmenting path to take a cell back from an earlier row and give that row a different column.

The same matrix shows why a row-by-row greedy fails. Row 1 takes its minimum, the $1$ in column 1, and row 2 is forced to take the $100$. A row-by-row scan that tries the second-best cell for row 1 would find the optimum, but it would still fail on a larger matrix where the improvement requires moving three rows at once. The augmenting path is the general form of that repair.

A second failure mode is worth naming even though the code may still find the optimum on a particular instance. Starting with $u = v = 0$ is feasible only when every cost is nonnegative. With a negative cost, the initial slack is negative, and the proof that the cheapest slack is safe no longer applies. The listings avoid the question by starting from the row minima, which is feasible for every sign and costs one row scan. That is the initialization to copy, even if a particular test happens to pass with zeros.

## Variants and extensions

- **Maximum-weight assignment.** Negate the costs and minimize. The optimal permutation is unchanged. The row-minimum initialization handles the resulting negative entries.
- **Rectangular assignment.** Add dummy rows or columns. Dummy rows with cost zero are safe when there are fewer rows than columns, because the real rows still have to take real columns. Dummy columns need a prohibitive cost unless a row is allowed to remain unassigned.
- **Sparse assignment.** Build the bipartite graph explicitly and run successive shortest paths with potentials. The cost is $O(n m \log n)$ for $m$ edges, which beats the dense cubic method when $m$ is much smaller than $n^2$.
- **Jonker-Volgenant.** A shortest-augmenting-path implementation with a different bookkeeping of the duals. It has the same $O(n^3)$ worst case and is often faster in practice on dense matrices.
- **The auction algorithm.** A primal-dual method that bids on columns instead of building an alternating tree. It is easy to parallelize and is used for very large sparse instances.
- **Row and column reduction.** Subtracting the row minima, then the column minima, is a preprocessing step that creates many tight cells before the search starts. The row-minimum initialization of the listings is the first half of it.
- **Forbidden pairs.** Give a forbidden cell a cost larger than any feasible total, run the algorithm, and check whether the result uses a forbidden cell. If it does, the instance has no assignment that avoids the forbidden pairs. The large cost must not overflow the accumulator.
- **Sensitivity analysis.** The final potentials certify not only the optimum but also how much a single cost can change before the chosen assignment stops being optimal. That is the dual side of the same certificate.

## Contest strategy

Under contest pressure, these are the steps that keep an assignment problem from turning into a debugging session.

1. Confirm the shape before writing code: two equal sides, each used once, and a sum over the chosen cells. If any of the three is missing, the Hungarian algorithm is the wrong tool.
2. Read the required output format. Some judges want a permutation, some want $n$ pairs, and some accept any optimum. The reference program prints a $0$-based permutation; CSES, for example, wants $1$-based employee-task pairs.
3. Decide whether the objective is a minimum or a maximum. For a maximum, negate the costs and keep the same code.
4. Check the sign of the costs before choosing the initialization. Row minima are always safe; zero potentials are safe only when every cost is nonnegative.
5. Add up the worst-case total and pick the integer type. A total near $5 \cdot 10^{11}$ needs 64 bits, and the potentials need the same type.
6. Estimate the running time from $n^3$. A few hundred rows is comfortable; a few thousand dense rows is not, and a sparse instance of that size needs a flow algorithm.
7. Test $n = 1$, a matrix with a negative cost, a matrix with duplicate costs, and the $2$ by $2$ greedy trap. These four tests catch most initialization and indexing errors.
8. Keep a brute-force checker for $n \le 8$. It enumerates $8! = 40,320$ permutations, which is instant, and it turns a wrong answer into a counterexample you can trace.

The output is a common place to lose points after the algorithm is correct. Decide once whether the permutation maps rows to columns or columns to rows, write it down, and make the print loop match. The algorithm's `p` array maps columns to rows, so the printed permutation is its inverse; mixing the two produces a valid-looking permutation with the wrong cost.

## Worked problems

### Problem 1: Task Assignment

**Restatement.** A company has $n$ employees and $n$ tasks. The cost of employee $i$ doing task $j$ is $c_{ij}$. Assign every employee to exactly one task and every task to exactly one employee, minimizing the total cost. Print the cost and the assignment. Constraints: $1 \le n \le 200$ and $1 \le c_{ij} \le 1000$.

**Naive baseline.** Enumerate all $n!$ assignments and keep the cheapest. At $n = 200$ this is impossible, and even at $n = 12$ it is already $4.8 \cdot 10^8$ permutations.

**Insight.** The assignment is a perfect matching of employees to tasks, and the cost is a sum over its cells. The dual potentials give a lower bound, and a perfect matching of tight cells attains it.

**Derivation.** Build the $n$ by $n$ matrix, run the Hungarian algorithm, and read the matching from the column-to-row array. The judge wants $n$ lines with the employee and the task in $1$-based indexing, so add one to both coordinates; the reference program prints the $0$-based task of each employee on one line instead.

**Correctness.** The final matching is perfect and every matched cell is tight, so the certificate lemma applies. The total printed is the sum of the matched cells, which is the matching's cost.

**Complexity.** $O(n^3)$ time, about $8 \cdot 10^6$ operations at $n = 200$, and $O(n^2)$ space for the matrix. The costs are at most $1000$, so the total is at most $2 \cdot 10^5$ and 32-bit arithmetic would suffice, but the listings use 64-bit uniformly.

**Common wrong approach.** Taking the cheapest cell for the first employee and continuing greedily. On the sample, the cheapest cell overall is the $6$ at employee 3, task 1. Taking it first leads to $34$, one above the optimum $33$: the greedy choices are $6$, $7$, $9$ and $12$, while the optimal assignment is $9 + 7 + 10 + 7 = 33$.

### Problem 2: Assignment Problem

**Restatement.** Given an $n$ by $n$ matrix with entries of magnitude at most $10^9$, find a permutation $p$ minimizing $\sum_i a_{i,p_i}$. Print the minimum value and the permutation. Constraints: $1 \le n \le 500$, and the entries may be negative.

**Naive baseline.** Enumerating permutations is out of the question. A dynamic program over subsets is $O(2^n n^2)$ and is also out of the question at $n = 500$.

**Insight.** Negative entries mean the all-zero potentials are not feasible, because $u_i + v_j = 0$ can exceed a negative $a_{ij}$. Starting each row potential at its row minimum restores feasibility and keeps every slack nonnegative.

**Derivation.** Run the same algorithm with $u_i = \min_j a_{ij}$ and $v_j = 0$. The tree search and the shift are unchanged. Use 64-bit integers for the potentials and the total: an assignment can sum to $5 \cdot 10^{11}$.

**Correctness.** The row-minimum initialization is feasible, the invariant is preserved by every shift, and the final matching is perfect and tight. The certificate lemma gives optimality for a matrix with entries of either sign.

**Complexity.** $O(n^3)$ time, about $1.25 \cdot 10^8$ inner operations at $n = 500$, and $O(n^2)$ space. The inner loop is simple enough that C++ and Java are comfortable; Python is slower but still usable at the lower end of the range.

**Common wrong approach.** Initializing every potential to zero because "the potentials are just row and column offsets". With a negative entry, the reduced costs are negative, the proof's invariant is gone, and the code has no guarantee behind it. The fix is one line: seed `u[i]` with the row minimum.

### Problem 3: Trash

**Restatement.** There are $n$ containers, and container $i$ contains $a_{ij}$ units of trash type $j$. Sorting means giving each type its own container, with every container receiving exactly one type. Moving one unit from container $i$ to container $j$ costs $1$ when $i \ne j$ and $0$ when $i = j$. Minimize the total effort. Constraints: $1 \le n \le 150$ and $0 \le a_{ij} \le 100$.

**Naive baseline.** Simulate the moves, or assign each type to the container where it is most abundant and hope. Both are wrong in general, because the containers are a shared resource: the best container for one type may be the only reasonable container for another.

**Insight.** The total amount of trash is fixed. If type $j$ is assigned to container $i$, the $a_{ij}$ units already in container $i$ stay put, and every other unit of type $j$ moves once. The effort is therefore the total amount minus the amount that stays, so minimizing the effort is the same as maximizing the sum of the kept amounts.

**Derivation.** Let $T_j = \sum_i a_{ij}$ be the total amount of type $j$. Build the cost matrix $c_{ij} = T_j - a_{ij}$, which is the number of units of type $j$ that must move if the type is assigned to container $i$. Run the Hungarian algorithm on $c$ and report its total. Equivalently, negate $a$ and run the maximum version.

**Correctness.** Every sorting plan is a permutation of the types to the containers, and its effort is exactly $\sum_j c_{\pi(j),j}$ for that permutation. The algorithm returns the minimum over all permutations, so it returns the minimum effort. The kept amount for a plan is $\sum_j a_{\pi(j),j}$, and the effort is $\sum_j T_j$ minus that sum, so maximizing the kept amount and minimizing the effort are the same problem.

**Complexity.** $O(n^3)$ time, about $3.4 \cdot 10^6$ operations at $n = 150$, and $O(n^2)$ space. The total amount is at most $150 \cdot 150 \cdot 100 = 2.25 \cdot 10^6$, so 32-bit arithmetic would suffice, but the same 64-bit code is used throughout.

**Common wrong approach.** Setting the diagonal of the cost matrix to zero and the off-diagonal entries to $a_{ij}$. That models moving each type to its own container as free without checking which type is already there, and it reports zero for any matrix whose diagonal is not empty. The correct cost of assigning type $j$ to container $i$ is $T_j - a_{ij}$, which is zero only when container $i$ already holds all of type $j$. On the sample, the total is $979$, the best kept amount is $329$, and the answer is $650$.

## Practice progression

1. **Recognition.** Given a statement, decide whether it is an assignment problem. Look for two equal sides, an exactly-once constraint on both sides, and an objective that sums the chosen costs. Write the decision down.
2. **Direct application.** Implement the dense $O(n^3)$ algorithm from the pseudocode, with the row-minimum initialization and the `way` reconstruction. Test it against the $2$ by $2$ greedy trap and the $3$ by $3$ trace.
3. **Adaptation.** Handle negative costs, $n = 1$, duplicate costs, and a maximum-weight objective. Then change the output to $1$-based pairs and to a permutation, and verify both against the same matching.
4. **Combination.** Use the algorithm as a subroutine in a larger problem: assign jobs with eligibility restrictions by giving forbidden cells a prohibitive cost, or solve a transportation problem with capacities by expanding each capacity into several copies.
5. **Challenge.** Implement the sparse version with successive shortest paths and compare it with the dense version on a random graph with $n = 2000$ and $m = 10^5$. The dense version should be far too slow, and the sparse version should finish.
6. **Transfer.** Use the dual certificate to answer sensitivity questions: how much can one cost rise before the current assignment stops being optimal? Or use the same primal-dual idea on a different LP, such as the minimum-cost flow with supplies and demands.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the two objects that the algorithm keeps in step, and what does a tight cell mean? (Key insight)
2. Why does a perfect matching of tight cells prove its own optimality? (Formal model, Correctness proof)
3. State the four cases of the potential shift and the effect on the slack in each case. (Algorithm derivation)
4. Why must the row potentials start at the row minima when a cost is negative, and what fails if they start at zero? (Key insight, Common mistakes)
5. Why is each phase's search a shortest-path search, and what plays the role of the distance in Dijkstra's algorithm? (Visual intuition, Algorithm derivation)
6. How many iterations can one phase perform, and why does it always reach a free column? (Correctness proof, Complexity analysis)
7. Why is the printed permutation the inverse of the `p` array, and how is it built? (Implementation walkthrough)
8. What is the cost of the $3$ by $3$ trace, and why does the second shift make the edge from row 1 to column 1 tight? (Step-by-step execution)
9. When is the dense Hungarian algorithm the wrong choice, and what replaces it? (Algorithm selection)
10. Why does the row-minimum initialization make every slack nonnegative, and why is that property needed? (Algorithm derivation, Correctness proof)

## Further reading

- The unweighted version of the same matching machinery, with augmenting paths and Hall's theorem, is [bipartite matching](/algorithms/graphs/bipartite-matching).
- The shortest-path search that the tree loop mirrors, including the priority-queue version and the nonnegative-weight assumption, is [Dijkstra's algorithm](/algorithms/graphs/dijkstra).
- The flow formulation of bipartite matching, with capacities on the edges, is developed in [minimum cut](/algorithms/graphs/minimum-cut); the assignment problem is that network with a cost on every edge.
- The graph representation that the matrix encodes, and the difference between an adjacency matrix and an adjacency list, is covered in [graph representation](/algorithms/graphs/representation).
- The all-pairs method that answers a different question on the same matrix is [Floyd-Warshall](/algorithms/graphs/floyd-warshall).
- The spanning-tree problem that also uses a greedy exchange argument is [minimum spanning trees](/algorithms/graphs/mst), and the disjoint-set structure it uses is [disjoint set union](/algorithms/graphs/dsu).
- The language transition guide, including the matrix and array conventions used by the six listings, is [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
