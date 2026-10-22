---
id: enumeration.branch-and-bound
title: Branch and bound
summary: Search a tree of partial solutions and cut off the branches that provably cannot beat the best solution found so far.
division: [gold]
subjects: [enumeration]
level: advanced
importance: advanced-technique
keywords: [branch and bound, pruning, lower bound, best first search, assignment problem]
prerequisites:
    required: [enumeration.backtracking, foundations.complexity]
    recommended: [enumeration.subset-enumeration, greedy.interval-scheduling]
complexity:
    time: "O(b * V), where V is the number of surviving nodes"
    space: "O(n)"
assumptions:
    - The cost of a partial solution can be bounded below by a cheap computation.
    - The bound never exceeds the cost of any completion of the partial solution.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Find the best of a huge set of solutions without building all of them |
| **Time** | $O(b \cdot V)$ for the nodes $V$ that survive the pruning, where $b$ is the cost of one bound |
| **Auxiliary space** | $O(n \cdot d)$ for the stack of depth $d$ and the $n$ values the bound needs |
| **Requires** | An admissible bound: a quantity that never exceeds the true cost of any completion |
| **Fails when** | The bound is not admissible, in which case the answer can be wrong, or when the bound is too weak, in which case nothing is pruned |
| **Primary technique** | A lower bound on each subtree, compared against the best complete solution so far |
| **Sibling article** | The tree search itself is in [backtracking](/algorithms/enumeration/backtracking) |

Branch and bound is a search over a tree of partial solutions with one extra idea: at every node, compute a bound on the best solution that could possibly live below it, and abandon the node when that bound cannot beat the best solution already found.

The bound is the whole technique. A bound that is too weak prunes nothing and the search degenerates into brute force. A bound that is not admissible prunes the optimum and the answer is wrong. Everything else is bookkeeping about how to compute the bound cheaply and how to order the search.

## Problem motivation

A hospital must assign $n$ nurses to $n$ shifts. Every nurse can work every shift, but each pairing has a cost, which is how unhappy the nurse would be. The total cost of an assignment is the sum of the costs of the $n$ pairings, and the hospital wants the cheapest assignment.

The constraints:

- $1 \le n \le 16$ nurses.
- $1 \le c_{ij} \le 10^6$ for the cost of nurse $i$ on shift $j$.
- Every nurse works exactly one shift, and every shift has exactly one nurse.

There are $n!$ assignments. At $n = 16$ that is $2 \cdot 10^{13}$, which no program finishes.

What makes the problem solvable is that an assignment is built one nurse at a time, and a partial assignment has a _floor_ on what it can possibly cost. Suppose nurse 1 has been given shift 1 for a cost of 4, and nurse 2 has been given shift 3 for a cost of 7. The cheapest nurse 2 could possibly be given among the remaining shifts is 2, and the cheapest nurse 3 could be given is 3, so no completion of this partial assignment can cost less than $4 + 7 + 2 + 3 = 16$.

Once the search has found a complete assignment costing 15, this partial assignment can be abandoned: nothing below it can be better than 16.

That is the whole idea, and the rest of the article is about making the bound cheap, making it tight, and keeping it admissible.

## Recognition patterns

Branch and bound is the right tool when all of the following hold.

- The problem is a **combinatorial optimization**: the best of many solutions.
- A solution is built **incrementally**, so that a partial solution has a well-defined cost.
- There is a **cheap lower bound** on the cost of any completion of a partial solution.
- The search space is too large to enumerate, which usually means $n$ is between 10 and 30.

The phrases that signal it are "the minimum cost", "the best assignment", "the shortest tour", "the least total", combined with a hint that the answer is built from parts. The phrases that rule it out are "the number of ways" (a count, not an optimization), "the sum of all" (an arithmetic formula), and any problem with no partial structure at all.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 8$ | A full enumeration is comfortable; the bound is optional |
| $9 \le n \le 16$ | The sweet spot for branch and bound with a decent bound |
| $n \ge 20$ | The tree is too large; use a bitmask dynamic program, which is $O(n 2^n)$ |
| $n \ge 100$ | The problem needs a polynomial algorithm, not a search |
| The costs are arbitrary | The bound must be computed from the data |
| The costs are non-negative | A partial cost is already a valid lower bound, which is the simplest bound of all |

The last row is the simplest case of the technique and it is worth knowing: if every cost is non-negative, then the cost already paid is a lower bound on the total, and pruning against it is free. It is the "budget" version of the technique, and it is what turns branch and bound into the common "is this partial solution still affordable" test.

<Synonyms terms="branch and bound, pruning with a bound, lower bound pruning, best first search, admissible heuristic, assignment problem search" />

## Naive approach

The baseline enumerates every solution.

```python
def best_assignment(cost):
    n = len(cost)
    best = float("inf")

    def recurse(worker, used, total):
        nonlocal best
        if worker == n:
            best = min(best, total)
            return
        for job in range(n):
            if not used[job]:
                used[job] = True
                recurse(worker + 1, used, total + cost[worker][job])
                used[job] = False

    recurse(0, [False] * n, 0)
    return best
```

This is $O(n \cdot n!)$ and it is correct. It is the reference implementation for the differential test.

The second baseline is a greedy assignment, which picks the cheapest available pair at each step. It is $O(n^2)$ and it is wrong in general, because the cheapest pair now can force an expensive pair later.

## Key insight

The insight is that **a partial solution has a floor**.

Write $c(S)$ for the cost of a complete solution $S$, and let $P$ be a partial solution with a set of already-made choices. Any complete solution $S$ that extends $P$ satisfies

$$
c(S) \ge b(P),
$$

where $b(P)$ is the **bound**. The bound is computed from $P$ and the data alone, without searching.

Two properties follow.

The first is **admissibility**. If $b(P)$ never exceeds the true cost of any completion of $P$, then $b(P)$ is a lower bound and the pruning is safe. Admissibility is a property of the _meaning_ of $b$, and it is the one thing that must be proved rather than assumed.

The second is the **pruning rule**. Let `best` be the cost of the cheapest complete solution found so far. If

$$
b(P) \ge \text{best},
$$

then no completion of $P$ can be better than `best`, so the whole subtree below $P$ is abandoned. Nothing in it can improve the answer.

The strength of the bound decides how much of the tree survives. A bound of zero, or a bound equal to the cost already paid, prunes nothing when the costs are positive. A bound that accounts for the competition between the remaining choices prunes almost everything. The technique is therefore not one algorithm but a family, and the family is ranked by the tightness of its bound.

The third piece is the **order of the search**. A bound that is tight enough still leaves the question of which node to expand first. The depth-first search expands the cheapest-looking child first, which finds a good `best` early and makes every later prune stronger. The best-first search expands the node with the smallest bound, which finds the optimum sooner but needs a priority queue.

## Formal model

Let $T$ be the tree of partial solutions, rooted at the empty one, with a cost $c(P)$ attached to each node and a set of complete solutions $\mathcal{C}(P)$ below it.

<MathPanel type="definition" title="Definition">
A function $b : T \to \mathbb{R}$ is a **bound** on the tree if it satisfies
$$
b(P) \le c(S) \quad \text{for every } P \in T \text{ and every } S \in \mathcal{C}(P).
$$
Such a function is **admissible**. A bound that can exceed the cost of some
completion is **inadmissible**, and pruning with it can discard the optimum.
</MathPanel>

<MathPanel type="definition" title="Definition">
Let $\text{best}$ be the cost of the cheapest complete solution found so far,
or $+\infty$ if none has been found. The **pruning rule** abandons a node $P$
when $b(P) \ge \text{best}$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If $b$ is admissible and the pruning rule abandons a node $P$, then no
solution in $\mathcal{C}(P)$ is strictly better than the current `best`.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At every moment, `best` is the cost of the cheapest complete solution the
search has found, and every node that has been abandoned lies in a subtree
whose solutions are all at least as expensive as `best` at the moment of the
abandonment.
</MathPanel>

## Algorithm derivation

The state is the partial solution, the cost paid so far, and `best`.

1. At a node with partial solution $P$:
2. Compute $b(P)$.
3. If $b(P) \ge \text{best}$, abandon this node and return.
4. If $P$ is complete, set `best` to the smaller of `best` and $c(P)$, and return.
5. Otherwise, for each available choice $x$ in increasing order of the bound it would produce, recurse into $P$ extended with $x$.

Step 3 comes before step 4 so that a complete solution is not discarded before it can update `best`. Actually the order matters only in that a complete node must never be pruned against itself, which happens because $b(P) = c(P)$ for a complete node and `best` is strictly greater than $c(P)$ at that moment unless the solution was already found.

The bound for the assignment problem is built as follows. Let $R$ be the set of shifts still free, and let $U$ be the set of nurses not yet assigned. Then

$$
b(P) = c(P) + \sum_{w \in U} \min_{j \in R} c_{wj}.
$$

Each unassigned nurse $w$ must take some shift $j \in R$, and every such shift costs at least $\min_{j \in R} c_{wj}$. The shifts chosen by different nurses are distinct, so the total cost of the remaining nurses is at least the sum of those minima, and the bound is admissible.

The bound is also cheap: computing the minimum for each unassigned nurse is $O(|U| \cdot |R|)$ at worst, and the minima can be updated as the search descends instead of recomputed.

## Step-by-step execution

Take three nurses and three shifts with the costs

$$
\begin{pmatrix}
2 & 9 & 9 \\
5 & 5 & 5 \\
1 & 9 & 9
\end{pmatrix}
$$

where the rows are the nurses and the columns are the shifts. The search assigns the nurses in order and tries the shifts in increasing index order.

- **Root.** The cost paid is 0 and `best` is $+\infty$. The bound is $2 + 5 + 1 = 8$, the sum of the cheapest shift for each nurse, which is below `best`, so the search continues.
- **Nurse 1 takes shift 1.** The cost paid is 2. The remaining shifts are 2 and 3, and the remaining nurses are 2 and 3. The bound is $2 + \min(5, 5) + \min(9, 9) = 2 + 5 + 9 = 16$, which is below $\infty$, so the search continues.
- **Nurse 2 takes shift 2.** The cost paid is 7. The bound is $7 + \min(9, 9) = 16$, still below $\infty$.
- **Nurse 3 takes shift 3.** The assignment is complete, with cost 16. `best` becomes 16.
- **Nurse 2 takes shift 3 instead.** The cost paid is 7, and the bound is $7 + \min(9, 9) = 16$. The bound is at least `best`, so the branch is abandoned. The only completion costs 16, which does not improve on `best`, so nothing is lost.
- **Back at the root, nurse 1 takes shift 2.** The cost paid is 9. The remaining shifts are 1 and 3, and the remaining nurses are 2 and 3. The bound is $9 + \min(5, 5) + \min(1, 9) = 9 + 5 + 1 = 15$, which is below `best` of 16, so the search continues.
- **Nurse 2 takes shift 1.** The cost paid is 14, and the bound is $14 + \min(9, 9) = 23 \ge 16$, so the branch is abandoned.
- **Nurse 2 takes shift 3.** The cost paid is 14, and the bound is $14 + \min(1, 9) = 15 < 16$, so the search continues.
- **Nurse 3 takes shift 1.** The assignment is complete with cost 15. `best` becomes 15.
- **Nurse 3 takes shift 2** is not tried, because shift 1 was the only one left.

The final answer is 15, which is the true optimum. The search visited nine of the sixteen nodes of the full tree, and it built two complete assignments instead of six.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
If the bound is admissible, the search returns the cost of a cheapest complete
solution.
</MathPanel>

<MathPanel type="proof" title="Proof">
The invariant states that `best` is the cost of the cheapest complete
solution found so far, and that every abandoned subtree contains only
solutions at least as expensive as the `best` at the moment of abandonment.

The invariant holds initially: `best` is $+\infty$ and no subtree has been abandoned.

Consider a node $P$ with bound $b(P)$.

If $b(P) \ge \text{best}$, then by the lemma no completion of $P$ is strictly better than `best`, so abandoning the subtree loses nothing, and the invariant is preserved.

If $P$ is complete, its cost $c(P)$ is a candidate for `best`, and the algorithm replaces `best` with the smaller of the two. The first half of the invariant is preserved, and no subtree is abandoned.

Otherwise the algorithm recurses into the children of $P$, and each child is handled by the same argument.

The search terminates because the tree is finite. At the end, `best` is the cost of some complete solution, and every solution that was not examined lives in an abandoned subtree whose solutions were all at least as expensive as `best` at the time of abandonment. Since `best` only decreases afterwards, no unexplored solution is cheaper than the reported one. The reported cost is therefore the optimum. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The theorem depends on admissibility and on nothing else. If the bound can
exceed the cost of some completion, the lemma fails, the pruning can discard
the optimum, and the conclusion does not follow.
</MathPanel>

## Complexity analysis

**Time: $O(b \cdot V)$, where $V$ is the number of nodes that survive the pruning and $b$ is the cost of one bound.** In the worst case $V$ is the whole tree, which is $O(n!)$ leaves and $O(n!)$ internal nodes for the assignment problem, so the technique does not improve the asymptotic worst case. What it improves is the typical case, and dramatically: a bound that is tight enough can cut a tree of $10^{13}$ nodes down to a few hundred thousand.

**Auxiliary space: $O(n)$ per level for the bound's working values, and $O(n)$ frames of recursion**, so the total is $O(n^2)$ for a naive implementation of the bound and $O(n)$ for one that keeps the state in a single array updated on the way down.

<MathPanel type="complexity" title="Complexity">
Branch and bound: $O(b \cdot V)$ time, where $V$ is the number of surviving
nodes and $b$ the cost of one bound, and $O(n)$ auxiliary space when the
bound is maintained incrementally. The worst case is the full tree, so the
technique trades a bound computation at every node for a much smaller tree.
</MathPanel>

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The assignment problem, $n \le 16$ | Branch and bound with a row-minimum bound |
| The assignment problem, $n \le 22$ | A bitmask dynamic program, at $O(n 2^n)$ time and $O(2^n)$ space |
| The assignment problem, any $n$ | The Hungarian algorithm, at $O(n^3)$ time |
| The traveling salesman, $n \le 12$ | Held and Karp's dynamic program, at $O(n^2 2^n)$ time |
| The traveling salesman, $n \le 20$ | Branch and bound with the held-Karp lower bound |
| A knapsack with a small capacity | A dynamic program, not a search |
| A scheduling problem with a deadline | Branch and bound, with the deadline as the budget |

The third row is the important one. Branch and bound is a contest technique for the range where the tree is too big to enumerate and the dynamic program is too big to store, and for $n \ge 20$ in the assignment problem a $2^{20}$ dynamic program is both simpler and more predictable than a search whose node count depends on the data.

## Recursion decision

The search recurses once per level of the solution, so the depth is the size of the solution, which is at most 16 or 20 in the problems that use this technique.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | The recursion is fine at depth 20 |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Fine |
| Python | Interpreter limit of 1000 | 1000 frames | Fine, but the function call overhead is significant at a million nodes |
| Pascal | The operating system stack | Depends on the platform | Fine |
| JavaScript | The V8 engine limit | About $10^4$ frames | Fine |

The recursion is never the problem here, because the depth is the size of the instance and the size is small by the time the technique applies. The performance problem is the number of nodes, and the way to reduce it is a tighter bound rather than a different recursion strategy.

## Implementation walkthrough

The three lines that carry the technique are the bound, the comparison, and the update.

```cpp
long long bound = paid;                       // the cost already paid
for (int w = worker; w < n; ++w) {
    int cheapest = INF;
    for (int j = 0; j < n; ++j) {
        if (!used[j]) cheapest = std::min(cheapest, cost[w][j]);
    }
    bound += cheapest;
}
if (bound >= best) return;                    // nothing below can beat best
```

The bound is the sum of a minimum per unassigned nurse, and the comparison is `>=` rather than `>`, because a completion that merely ties the best is not an improvement and can be skipped.

The `best` variable must be initialized to a value larger than every possible solution, and it must be updated only at a complete node. Initializing it to zero is the classic mistake, and it prunes the entire tree at once, so the search returns zero without looking at anything.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| The bound is not a lower bound | The optimum is pruned and the answer is wrong | Prove admissibility for each term of the bound |
| The bound is too weak | Nothing is pruned and the search is brute force | Add the conflict terms to the bound |
| `best` is initialized to zero | The whole tree is pruned at the root | Initialize it above the largest possible cost |
| The bound is recomputed from scratch at every node | The constant factor dominates the run | Maintain the minima incrementally |
| The prune uses `>` instead of `>=` | Equal-cost solutions are explored needlessly | Use `>=` |
| The bound is computed but never compared | The technique does nothing | Compare before recursing |
| The search expands the worst branch first | `best` stays bad and the pruning stays weak | Try the cheapest child first |

### Why this fails: the bound that is too generous

The mistake that survives review is using a quantity that is not a lower bound. The natural mistake is to bound a subtree by the cost of a **greedy completion** of it, because that completion is easy to compute and looks like a good estimate of the subtree.

The greedy completion is an **upper** bound on the subtree, not a lower one. It is the cost of one particular solution, and the subtree may contain a cheaper one.

The smallest counterexample is the assignment problem with three nurses and three shifts and the cost matrix

$$
\begin{pmatrix}
2 & 9 & 9 \\
5 & 5 & 5 \\
1 & 9 & 9
\end{pmatrix}.
$$

The true optimum is 15, achieved by nurse 1 on shift 3, nurse 2 on shift 2 and nurse 3 on shift 1.

The search proceeds as in the step-by-step execution, but with the greedy completion as the bound. The first complete assignment it reaches is nurse 1 on shift 1, nurse 2 on shift 2 and nurse 3 on shift 3, with cost 16, so `best` becomes 16.

Now the branch where nurse 1 takes shift 2 is examined. Its cost paid is 9, and the greedy completion of that node gives nurse 2 shift 1 for 5 and nurse 3 shift 3 for 9, a total of 23. Since 23 is at least `best`, the branch is abandoned.

But the subtree of that branch contains the optimum: nurse 1 on shift 2, nurse 2 on shift 3 and nurse 3 on shift 1 costs $9 + 5 + 1 = 15$, which is better than 16. The search pruned it, and the final answer is 16 instead of 15.

The failure is systematic rather than a one-off. A greedy completion is always at least as expensive as the optimum of the subtree, so it prunes the optimum in every subtree where the greedy is not optimal, and the greedy is not optimal for most instances.

The lesson generalizes: **a bound must be a lower bound on every completion, and an estimate of one completion is not a bound.**

The second failure is at the other extreme: a bound that is admissible but useless. If the bound is just the cost already paid, then in a problem where the costs are positive, the bound only prunes the branches that already cost more than the best, which happens rarely. The search then visits almost every node, and the technique buys nothing over the brute-force enumeration, with the added cost of a bound computation at every node.

## Variants and extensions

- **Best-first search.** Expand the node with the smallest bound first, using a priority queue. It finds the optimum sooner, at the cost of the queue.
- **Iterative deepening on the bound.** Run the search with a bound threshold that increases, so that only the nodes that could beat the current threshold are explored.
- **The Hungarian algorithm.** The assignment problem solved exactly in $O(n^3)$ by a sequence of adjustments to the cost matrix, which is the same idea of tightening a bound carried to its limit.
- **Held and Karp's bound.** The traveling salesman lower bound that uses the minimum outgoing and incoming edges at each vertex, which is much tighter than the naive bound.
- **Dynamic programming with memoization.** The bitmask version of the assignment problem stores the best completion of each set of used shifts, which is $O(n 2^n)$ and never explores a node twice.
- **The branch and bound for the knapsack.** The fractional bound, which relaxes the integrality of the weights, is the classic example of an admissible bound.
- **Diving and bounding.** A heuristic that greedily finds a good complete solution first, so that `best` is small before the exhaustive part begins.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write the bound down as a formula, and prove in one sentence that it never exceeds the cost of any completion.
2. Check the bound on a small instance by hand, against the known optimum.
3. Initialize `best` above every possible solution, and update it only at complete nodes.
4. Try the cheapest child first, so that `best` is good early.
5. Count the nodes. If the bound is not pruning most of them, it is too weak, and a dynamic program is probably the better answer.
6. Check the time per node as well as the number of nodes; a bound that costs $O(n)$ at every node can dominate a search that visits a million nodes.

## Worked problems

### Problem 1: the cheapest nurse assignment

**Restatement.** Assign $n$ nurses to $n$ shifts, minimizing the total cost of the pairings. Constraints: $1 \le n \le 16$, costs up to $10^6$.

**Naive baseline.** All $n!$ assignments, at $2 \cdot 10^{13}$ for $n = 16$.

**Insight.** Every unassigned nurse must cost at least its cheapest free shift, so the partial cost plus the sum of those minima is a floor on the subtree.

**Derivation.** Run the search of the algorithm derivation with the bound of the algorithm derivation, trying the cheapest free shift first at each node.

**Correctness.** The theorem applies, since the bound is admissible.

**Complexity.** $O(b \cdot V)$ time and $O(n)$ space, with $V$ far below the full tree for most cost matrices.

**Common wrong approach.** Bounding a subtree by a greedy completion, which prunes the optimum.

### Problem 2: the shortest tour of $n$ cities

**Restatement.** Given $n$ cities with pairwise distances, find the shortest round trip that visits every city once. Constraints: $1 \le n \le 12$, distances up to $10^6$, and the triangle inequality holds.

**Naive baseline.** All $(n-1)!$ tours, which is $39\,916\,800$ at $n = 12$.

**Insight.** A partial tour has a floor: the cost already paid, plus the cheapest edge out of the current city, plus the cheapest edge into each unvisited city that is not the current one.

**Derivation.** Run the search with that bound, and close the tour when all the cities have been visited.

**Correctness.** The bound is admissible, because each unvisited city must be entered by some edge costing at least its cheapest incoming edge, and those entries are distinct.

**Complexity.** $O(b \cdot V)$ time, with the triangle inequality making the bound reasonably tight.

**Common wrong approach.** Ignoring that the return edge to the start is still unpaid, which makes the bound too small and the pruning too eager.

### Problem 3: the most valuable knapsack under a budget

**Restatement.** Given $n$ items with weights and values and a budget $B$, maximize the total value with total weight at most $B$. Constraints: $1 \le n \le 40$, weights and values up to $10^4$.

**Naive baseline.** All $2^n$ subsets, which is $10^{12}$ at $n = 40$.

**Insight.** Relaxing the integrality of the remaining items gives a floor: sort the remaining items by value per unit of weight and fill the remaining budget fractionally.

**Derivation.** Run the search over the items, taking or skipping each, and prune with the fractional bound.

**Correctness.** The fractional relaxation is an upper bound on the value of any integral completion, so it is admissible and the pruning is safe.

**Complexity.** $O(n \cdot V)$ time, with the bound computed by sorting the remaining items at each node.

**Common wrong approach.** Computing the fractional bound without excluding the items already skipped, which makes the bound too large and prunes the optimum.

## Practice progression

1. **Recognition.** Given a statement, decide whether branch and bound applies. Look for an optimization over combinations, and ask whether a partial solution has a computable floor.
2. **Direct application.** Implement the assignment search with the row-minimum bound, and verify it against the full enumeration on instances of size up to 8.
3. **Adaptation.** Implement the traveling salesman version, and the knapsack version with the fractional bound.
4. **Combination.** Combine the bound with a best-first search over a priority queue, and with an initial greedy solution that sets `best` before the search starts.
5. **Challenge.** Derive a tighter bound for the assignment problem that accounts for two nurses competing for the same cheapest shift, and prove that it is still admissible.
6. **Transfer.** Recognize the same shape in a different setting: the scheduling of jobs with deadlines, the minimum cost of a set of paths covering a graph, and the exact cover problem.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is an admissible bound, and why does the technique fail without one? (Formal model)
2. State the pruning rule and the lemma that makes it safe. (Formal model)
3. Write the bound for the assignment problem and justify each term. (Algorithm derivation)
4. Why is `best` initialized above every possible cost? (Implementation walkthrough)
5. Give the smallest assignment problem where a greedy-completion bound prunes the optimum. (Common mistakes)
6. What does a bound that is too weak cost, and how is that different from a bound that is inadmissible? (Common mistakes)
7. What does the technique do to the worst case, and what does it do to the typical case? (Complexity analysis)
8. How does the order of the children affect the size of the search? (Key insight)
9. When is a bitmask dynamic program better than the search, and up to what size? (Algorithm selection)
10. What is the depth of the recursion, and why is it never the problem here? (Recursion decision)
11. Which of the two bounds in the step-by-step execution actually pruned a branch? (Step-by-step execution)
12. How is the bound kept cheap as the search descends? (Implementation walkthrough)

## Further reading

- The tree search that the pruning decorates is in [backtracking](/algorithms/enumeration/backtracking).
- The tree of subsets, which is the simplest tree to prune, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The arrangement tree, with its own order and successor rule, is in [permutations](/algorithms/enumeration/permutations).
- The greedy that supplies a first `best` is described in [interval scheduling](/algorithms/greedy/interval-scheduling).
- The dynamic program that replaces the search when the instance is too large is in [0-1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
