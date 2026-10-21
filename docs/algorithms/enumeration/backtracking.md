---
id: enumeration.backtracking
title: Backtracking
summary: Search a tree of choices, prune the branches that cannot lead to a solution, and restore the state on the way back.
division: [silver, gold]
subjects: [enumeration]
level: intermediate
importance: common-contest-technique
keywords: [backtracking, search tree, pruning, branch and bound, recursion, state restoration]
prerequisites:
    required: [foundations.recursion, foundations.complexity]
    recommended: [enumeration.subset-enumeration, foundations.sorting]
assumptions:
    - The mutable state that the search changes can be restored exactly when a branch is abandoned.
    - A partial solution that already violates a constraint can be detected and discarded before it is completed.
reviewed: false
---

## At a glance

Backtracking is a search over a tree of partial solutions. Each node of the tree is one sequence of choices made so far, and each edge is one more choice. The whole algorithm is four decisions, and every backtracking problem in this encyclopedia is a different answer to the same four questions.

1. **What is the state?** The part of the world that a choice changes.
2. **What are the choices?** The list of moves available at a node.
3. **When do we prune?** The test that says a node cannot be completed.
4. **What do we restore?** The undo of the change, applied on the way back.

The pruning test is what separates backtracking from a brute-force enumeration. A brute-force enumeration tests the constraints once, at the leaf; a backtracking search tests them at every level and abandons a branch the moment it fails. On the eight-queens problem that difference is the difference between $16\,777\,216$ leaf tests and $2\,057$ visited nodes.

The restore step is what separates a correct backtracking search from one that returns a plausible wrong answer. It is also the step that is easiest to get wrong, because the undo must mirror the set of changes exactly, and a search that returns early can skip the undo.

## Problem motivation

Count the ways to place eight queens on an eight-by-eight chessboard so that no two queens attack each other. Two queens attack each other when they share a row, a column, or a diagonal.

The answer is $92$. The interesting part is the gap between the answer and the work needed to produce it.

The straightforward search puts one queen in each row, in each of the eight columns, and checks the attacks at the end. That is $8^8 = 16\,777\,216$ complete placements to examine, and each examination costs a constant amount of work. The program finishes in a fraction of a second in C++ and in a few seconds in Python, and it is correct.

Now add one line to the search: abandon a partial placement as soon as the queen just placed attacks a queen already on the board. The number of nodes the search actually visits falls from $16\,777\,216$ to $2\,057$, a factor of eight thousand, and the answer comes out of the same program with the same output.

That single line is the whole subject of this article. Backtracking is not a different algorithm from brute force; it is brute force with the hopeless branches removed early, and with the bookkeeping that lets the search reuse the work it has already done.

## Recognition patterns

Backtracking is the right tool when the problem statement contains some of these phrases.

- "How many ways", "find all", "list every", "does there exist", "the smallest solution".
- A small number of choices repeated, such as one queen per row, one digit per position, one item per box.
- Constraints that are **local**: they can be checked on a partial solution without completing it.
- The answer must be _constructed_, not merely computed, so a closed-form formula does not exist.

The constraint values that rule the technique in and out are worth stating plainly, because they decide the whole shape of the search.

| Situation | What it rules |
| --- | --- |
| Depth $\le 20$ and a per-node test of $O(1)$ | A pruned tree of at most $10^6$ nodes is comfortable |
| Depth $\le 30$ with a strong prune | Often still fine; pruning cuts the tree by orders of magnitude |
| Depth $\ge 40$ with a weak prune | The tree is too large; look for a decomposition |
| Constraints that can only be checked at the leaf | There is no pruning to be had; the search degenerates to brute force |
| Constraints that are global rather than local | Pruning is hard; the dynamic program in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) is usually better |

The last row is the one that decides most mistakes. A problem such as "place four rooks so that every row and column has exactly one, and the sum of the numbers in the chosen cells is $W$" cannot be pruned on the sum, because the sum only exists when the placement is complete. The rooks part can be pruned on; the sum part cannot. A search over that problem is exponential in the number of cells.

## Naive approach

The baseline is to generate every complete assignment and test it at the leaf.

```python
def count_placements(n):
    total = 0
    for assignment in product(range(n), repeat=n):   # n^n assignments
        if valid(assignment):
            total += 1
    return total
```

This is correct for any $n$ and any validity test. Its cost is the number of assignments times the cost of the test, which is $n^n$ times a constant for the eight-queens problem.

The second baseline, and the one most people write first, is the recursive one that prunes only on the constraint that is cheapest to check.

```python
def search(row):
    if row == n:
        return 1
    total = 0
    for col in range(n):
        if not attacks_anything(row, col):
            total += search(row + 1)
    return total
```

Notice what is missing: the change that placing a queen makes is never undone, because nothing records it. This version is correct only when the attacks can be recomputed from scratch for every candidate column, which is $O(n)$ work per candidate rather than $O(1)$. It is a correct program with the wrong complexity, and it is the natural first draft.

## Key insight

The insight is that **a partial solution can be tested before it is complete**, and that a partial solution which already violates a constraint can never be part of a full solution.

Formally, suppose the problem has constraints $C_1, C_2, \ldots$, and every constraint has the form "the partial solution must not violate $C_j$". A partial solution that violates $C_j$ cannot be extended to a solution, because extending it only adds choices, and adding choices never removes a violation. The partial solution is therefore **infeasible**, and the entire subtree below it contains no solution at all. Cutting that subtree off is safe, and it is exactly what the pruning test does.

Two consequences follow.

First, the prune test must be **sound**: it may only cut subtrees that contain no solution. A test that is too eager produces too few answers, and the failure is silent, because the program still prints a number.

Second, the test must be applied **as early as possible**. A constraint that depends only on the first $k$ choices should be tested after the $k$-th choice, not at the leaf. The eight-queens search tests all three constraint families after every placement, which is why its tree is small.

The third consequence is bookkeeping rather than mathematics: the search mutates shared state, so it must undo the mutation when it returns. The undo is what makes the sibling branch start from the same state the current branch started from.

## Formal model

Let $D$ be the set of decisions available at each step, and let a **partial solution** be a sequence $d_1, d_2, \ldots, d_k$ of decisions taken from $D$ in order.

<MathPanel type="definition" title="Definition">
A **search tree** for a problem instance is a rooted tree whose root is the
empty partial solution and whose nodes are partial solutions. A node $v$ has
one child for each way of extending $v$ by one more decision. A node is
**complete** when no further decision can be appended.
</MathPanel>

<MathPanel type="definition" title="Definition">
A node of the search tree is **feasible** if it extends to at least one
complete solution. **Pruning** is the removal of an infeasible node together
with the whole subtree below it.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **state** of a search is the collection of values that the choices have
changed and that the rest of the algorithm reads. The state is **restored**
at a node if, on returning from that node, the state is exactly what it was
when the node was entered.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Pruning an infeasible node removes no solution from the tree. Therefore a
search that prunes only infeasible nodes and visits every remaining node
finds every solution of the instance.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At the moment the search enters the node for a partial solution, the state
equals the state obtained by applying the decisions on the root-to-node path,
in order, to the initial state. When the search leaves the node, the state
equals the state it had on entry.
</MathPanel>

## Algorithm derivation

The recursive skeleton is the same in every language.

```python
def backtrack(state, depth):
    if depth == limit:
        record(state)
        return
    for choice in choices(state, depth):
        apply(state, choice)
        if feasible(state, depth):          # the prune test
            backtrack(state, depth + 1)
        undo(state, choice)                 # the restore
```

The **state** for the eight-queens problem is three collections: the columns that are occupied, and two sets of diagonal indices. A queen at row $r$ and column $c$ occupies column $c$, the diagonal $r - c$, and the diagonal $r + c$. Two queens attack each other exactly when they share one of those three labels, so the whole board fits in three containers.

The **choices** at row $r$ are the columns $c$ that are not occupied.

The **prune test** is then free: if $c$ is already in the occupied columns, or $r - c$ is already in one diagonal set, or $r + c$ is already in the other, the placement is infeasible and the branch is cut.

The **restore** is the exact inverse of the choice: remove $c$ from the occupied columns, remove $r - c$ from one diagonal set, and remove $r + c$ from the other. The three removals mirror the three insertions, one for one.

Two details in the skeleton above carry real weight. The `undo` must run on every path out of the loop body, including the path where the recursive call found a solution and returned early; a `return` placed above the `undo` leaks the change into the sibling branch. And the `record` call at the leaf must read the state, not a partially rebuilt copy, because the copy is what the bug usually corrupts.

## Step-by-step execution

Four queens on a four-by-four board. The answer is $2$. The board is searched row by row, and each row tries its columns in increasing order.

1. **Row 0, column 0.** Column $0$ is free, diagonal $-0 = 0$ is free, diagonal $0 + 0 = 0$ is free. The placement is feasible, so the search descends. State: columns $\{0\}$, diagonals $\{-0\}$ and $\{0\}$.
2. **Row 1, column 0.** Column $0$ is occupied, so this placement is infeasible and the branch is cut before descending.
3. **Row 1, column 1.** The diagonal $1 - 1 = 0$ is occupied, so the placement is infeasible and the branch is cut.
4. **Row 1, column 2.** Column $2$ is free, diagonal $-1$ is free, diagonal $3$ is free. Feasible, descend. State: columns $\{0, 2\}$, diagonals $\{-1, 0\}$ and $\{0, 3\}$.
5. **Row 2, column 0.** Column $0$ is occupied. Cut.
6. **Row 2, column 1.** The diagonal $2 + 1 = 3$ is occupied. Cut.
7. **Row 2, column 2.** Column $2$ is occupied. Cut.
8. **Row 2, column 3.** The diagonal $2 - 3 = -1$ is occupied. Cut. The subtree below row 1, column 2 is empty, and the search returns to row 1.
9. **Row 1, column 3.** Column $3$ is free, diagonal $-2$ is free, diagonal $4$ is free. Feasible, descend. State: columns $\{0, 3\}$, diagonals $\{-2, 0\}$ and $\{0, 4\}$.
10. **Row 2, column 1.** Column $1$ is free, diagonal $1$ is free, diagonal $3$ is free. Feasible, descend. State: columns $\{0, 1, 3\}$, diagonals $\{-2, 0, 1\}$ and $\{0, 3, 4\}$.
11. **Row 3, column 2.** Column $2$ is free, diagonal $3 - 2 = 1$ is free, diagonal $3 + 2 = 5$ is free. Feasible, descend to a complete placement: the columns of the queens are $0, 3, 1, 2$.
12. Back at row 3, the search restores the state to the state of row 2, column 1, and the remaining columns are all blocked, so the branch ends.
13. The remaining branches of rows 2 and 1 are similarly blocked or cut, and the search returns to row 0.

Row 0, column 1 is then tried and leads to the second solution, whose queen columns are $1, 3, 0, 2$. Rows 0 with columns $2$ and $3$ lead to nothing, and the total is $2$.

Two things in the trace are worth naming. At step 5 the search does not descend at all: the prune test rejects the placement without any further work, and the state is unchanged. At step 11 the state that the leaf reads is the state built by four insertions, one per level, each undone only after its subtree has been exhausted.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The backtracking search reports every solution of the instance exactly once,
provided that the prune test rejects only infeasible nodes and that the state
is restored on the way back.
</MathPanel>

<MathPanel type="proof" title="Proof">
**Soundness.** Every reported solution is feasible. A solution is reported
only at a complete node. Along the path to that node, every ancestor passed
the prune test, so no ancestor was infeasible, and an infeasible node cannot
have a feasible descendant, by the definition of feasibility. Therefore the
complete node is feasible, and the values it reports constitute a solution.

**Completeness.** Every solution is reported. Let $S$ be a solution and let $v$ be the node of the search tree whose root-to-node path is the sequence of decisions of $S$. Every node on that path is feasible, because $S$ extends it. By the lemma, pruning removes only infeasible subtrees, so no node on the path is ever pruned, and the search descends the whole path and reaches $v$. At $v$ the solution is recorded.

**No duplicates.** Each solution determines exactly one root-to-node path, because the decisions of the path are the decisions of the solution. Two different nodes therefore cannot report the same solution, and by completeness every solution is reported. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The state seen at every node is the state determined by the root-to-node
path.
</MathPanel>

<MathPanel type="proof" title="Proof">
The claim is the invariant. It holds at the root, where the state is the
initial state and the path is empty. Suppose it holds when a node is entered
and the search descends to a child by applying a choice. The choice changes
the state exactly as the corresponding edge of the tree changes the partial
solution, so the state at the child is the state obtained by applying the
path of the child, which is the path of the parent followed by the choice.
The invariant is preserved. When the search returns from the child, the
restore has undone exactly the change that was applied, so the state is again
the state of the parent. By induction the invariant holds at every node, and
in particular a leaf sees exactly the values of its path. $\square$
</MathPanel>

## Complexity analysis

The cost of a backtracking search is the number of **nodes visited**, not the number of leaves of the unpruned tree. If the tree has branching factor $b$ and depth $d$, the unpruned tree has $b^d$ leaves and about $b^d$ nodes, so the worst case is $O(b^d \cdot t)$ where $t$ is the cost of the test at a node. Backtracking is exponential in the worst case, and no amount of bookkeeping changes that.

What changes is the constant, and the constant is enormous. For eight queens the unpruned tree has $16\,777\,216$ leaves while the pruned search visits $2\,057$ nodes.

The auxiliary space is the depth of the recursion plus the size of the state, so $O(d + s)$ where $s$ is the number of state entries, for example $O(n)$ for the queen board.

The single number that matters when you are deciding whether backtracking is feasible is the **node count of the pruned tree**, and the only honest way to estimate it is to instrument the search and count. That is cheap to do and it converts a guess into a measurement.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Enumerate all solutions, constraints are local | Backtracking |
| Count solutions with local constraints | Backtracking with a counter |
| Does a solution exist | Backtracking with early exit |
| The smallest solution in some order | Backtracking with the best-so-far bound |
| Count subsets of a small set | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| The constraints involve sums of values | A dynamic program, for example [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| The constraints involve an increasing sequence | A dynamic program, for example [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence) |
| The constraints are on positions in a string | The prefix function of [KMP](/algorithms/strings/kmp) |
| The answer is a formula over counts | [Binomial coefficients](/algorithms/combinatorics/binomial-coefficients) |
| The answer is the boundary of a set of points | The [convex hull](/algorithms/geometry/convex-hull) |

The rule of thumb is that backtracking is right when the answer must be built and the constraints are local. Whenever the constraints involve a sum or a count over the whole assignment, a dynamic program replaces the search and turns the exponential into a polynomial.

## Recursion decision

The depth of a backtracking search is the number of decisions, which is usually the number of items or the number of rows. That is small by construction, because the algorithm only works when the depth is small.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Recursive is safe for every realistic backtracking depth |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Recursive is safe for every realistic backtracking depth |
| Python | Interpreter limit of 1000 | 1000 frames | Recursive is safe for every realistic backtracking depth |
| Pascal | The operating system stack | Depends on the platform | Recursive is safe for every realistic backtracking depth |
| JavaScript | The V8 engine limit | About $10^4$ frames | Recursive is safe for every realistic backtracking depth |

The table has a single conclusion: because a backtracking depth is bounded by the size of the input, and because a backtracking algorithm is only used when that size is small, the recursive form is almost always safe. The one exception is a search over a large implicit state, such as a maze with $10^6$ cells, where the depth is the length of the path and the iterative form with an explicit stack is the better choice.

The stack is not the only concern. The **restore** must also survive an exception or an early return. In C++ a destructor or a scope guard is the right tool; in Python a `try` and `finally` block is; in Java and JavaScript a `try` and `finally` block is the only portable answer. If the search can return early from inside the loop body, the restore has to be in the `finally`, not after the loop.

## Implementation walkthrough

The three lines that matter are the insertion and its exact mirror.

```cpp
columns.insert(col);                 // the choice
diagonalDown.insert(row - col);
diagonalUp.insert(row + col);

backtrack(row + 1);

columns.erase(col);                  // the restore, in the opposite order
diagonalDown.erase(row - col);
diagonalUp.erase(row + col);
```

The restore must undo the same set of things that the choice changed, and it must undo all of them even when the recursive call throws or returns early. A `scope guard` in C++ or a `finally` block in the other languages is the shortest way to guarantee that.

The prune test must be placed **before** the recursive call and after the insertion, or the test reads a state that does not yet include the choice. It must also be placed **before** the insertion if the test is about a value the choice would overwrite, in which case the restore must skip that value. The easiest rule is: insert, test, recurse, undo, in that order.

The order of the removals does not matter for sets, because the three containers are distinct. It does matter if the state is a single array in which the choice wrote several fields, because then the restore must put the fields back in the reverse order, exactly like popping a stack.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting to restore the state | Later branches see a state that is not theirs | Undo exactly what the choice changed |
| Restoring only some of the changes | A leftover mark blocks a valid branch | Keep the insertion and the restore adjacent in the code |
| Pruning on a condition that is not necessary | Valid solutions are discarded | Prove the test rejects only infeasible nodes |
| Testing the constraints at the leaf only | The tree is the full exponential tree | Test after every choice |
| Testing the constraints before the choice is applied | The test reads the wrong state | Insert, then test, then recurse |
| Returning early without restoring | The rest of the search is corrupted | Put the restore in a `finally` or a scope guard |
| Using a shared array without clearing it | The first solution's values leak into later ones | Restore, or copy the state at the leaf |
| Assuming the search is polynomial | The program times out on a larger input | Measure the node count |

### Why this fails: the column that stays occupied

The plausible wrong approach is to write the choice, the recursive call, and the restore, and then to move the restore _inside_ the loop body but below the recursive call, in a place where an early return skips it. Or, more simply, to write the insertion without the matching deletion, on the reasoning that "the search will not come back to this state anyway".

The smallest counterexample is the four-queens board.

A correct program reports $2$. A program that inserts the column and the two diagonals but never removes them reports $0$.

The mechanism is exact. After the first placement, at row 0, column 0, the column set permanently contains $0$. Every branch that tries column $0$ later is pruned as if the first queen were still on the board. The diagonals $0 - 0 = 0$ and $0 + 0 = 0$ are permanently occupied as well, so the diagonal that would rule out the queen at $(1, 1)$ is already ruled out for the wrong reason. The search therefore explores only the branches that a single queen would allow, and it never reaches a complete placement.

Three queens is not enough to expose the bug: the answer is $0$ for three queens, and the buggy program also reports $0$, so the two agree. Two queens is not enough either, for the same reason. One queen has a single placement and no second branch, so the bug cannot show. Four queens is the smallest board on which the correct answer and the buggy answer differ.

The failure is silent. The program prints a number, the number is not obviously absurd, and the reason it is wrong is a line that is missing rather than a line that is wrong. A differential test against a brute-force program on small boards is the cheapest way to catch it.

The lesson generalizes: **a backtracking search is correct only if the state at every node is the state its path describes.** Pruning without restoring, or restoring the wrong thing, produces a smaller answer rather than an error.

## Variants and extensions

- **Symmetry breaking.** When the problem is symmetric, search only one representative of each symmetric class and multiply the count. For the eight-queens board, fixing the first queen in the left half and doubling the answer halves the tree.
- **Branch and bound.** When the partial solution can be scored, keep the best score so far and abandon a branch as soon as it cannot beat it. This turns an exhaustive search into a branch-and-bound search and is the standard technique for assignment problems.
- **Memoization.** When two different paths reach the same state, compute the rest of the subtree once and reuse it. The state must be hashed, which restricts the technique to states that can be summarized.
- **Iterative form.** Replace the call stack with an explicit stack of decisions, and restore the state when a frame is popped. This removes the recursion limit at the cost of a more complicated loop.
- **Mixed branching.** Order the choices so that the most promising one is tried first, when the search is looking for one solution rather than all of them.

## Contest strategy

1. Write down the **state** first, in one sentence, before writing any code. If you cannot say which data the choices change, you do not yet know what to restore.
2. Write down the **prune test** and prove it is sound in one sentence: "if this holds, no completion is possible, because ...". A test you cannot justify is a test that will silently lose solutions.
3. Put the insertion, the test, the recursive call, and the restore on four consecutive lines, in that order. The adjacency is what makes the pairing reviewable.
4. Decide the **order** of the choices. Ascending order is the default; descending or heuristic order helps when you only need one solution.
5. Test on the smallest board and compare with a brute-force program. The difference between the two answers is the only evidence that the prune test is sound and the restore is complete.
6. Count the nodes on the largest input you expect. If the count is close to the exponential bound, look for a decomposition before you look for a faster language.

## Worked problems

### Problem 1: count the eight-queens placements

**Restatement.** Count the ways to place eight queens on an eight-by-eight board so that no two share a row, a column, or a diagonal.

**Naive baseline.** Enumerate all $8^8 = 16\,777\,216$ column assignments and test each one at the end.

**Insight.** A partial placement that already has two queens attacking each other can never become a complete placement, because adding queens does not remove attacks.

**Derivation.** Keep three containers: occupied columns, occupied diagonals $r - c$, and occupied diagonals $r + c$. For each row, try each column, insert the three labels, test the three memberships, recurse, and remove the three labels.

**Correctness.** The soundness and completeness arguments above apply verbatim: the prune test rejects only infeasible nodes, and the restore makes every node see its own state.

**Complexity.** $O(\text{nodes visited})$ time, which is $2\,057$ nodes for the eight-queens board, and $O(n)$ auxiliary space.

**Common wrong approach.** Testing the attacks by recomputing them from the board at every candidate placement. That is correct but costs $O(n)$ per candidate, and it grows the constant by a factor of $n$.

### Problem 2: subsets with a target sum, pruned

**Restatement.** Given $n \le 40$ integers and a target $W$, report how many subsets sum to $W$.

**Naive baseline.** Enumerate all $2^{40}$ subsets, which does not finish.

**Insight.** Two prunings are available. If the items are all positive, a partial sum that already exceeds $W$ can never come back, and a partial sum that is still short of $W$ when no items remain cannot reach it. A second pruning sorts the items and only takes the next item or skips it.

**Derivation.** Choose or skip each item in a fixed order. After the decision, compute the sum of the taken items and the sum of the items still available. Prune when the first exceeds $W$ or when the second cannot reach $W$. The counting form of [subset enumeration](/algorithms/enumeration/subset-enumeration) is the same loop with the prunings removed.

**Correctness.** Both prunings reject only infeasible nodes: a sum that exceeds $W$ cannot decrease if the items are positive, and a remaining available sum that is too small cannot increase the total to $W$. The completeness argument then applies.

**Complexity.** $O(\text{nodes visited})$ time, which is far below $2^{40}$ when the items are positive and the pruning is applied after every decision.

**Common wrong approach.** Applying the "sum cannot exceed $W$" pruning to a problem whose items may be negative. The pruning is only sound when every item is non-negative, which is a condition the statement must provide.

### Problem 3: a word search in a grid

**Restatement.** Given a grid of letters and a word, report whether the word appears, reading right, down, left, up, or along a diagonal, and report the first position where it does.

**Naive baseline.** For every cell and every one of the eight directions, read the letters in that direction and compare them with the word. That is $O(8 \cdot n \cdot m \cdot L)$ for a grid of $n$ by $m$ cells and a word of length $L$.

**Insight.** The prefix function of [KMP](/algorithms/strings/kmp) turns the comparison of the word against each line into a linear scan, and the grid can be read as $n + m - 1$ maximal lines per direction.

**Derivation.** Extract every line in every direction, run the linear-time string search on each, and stop at the first hit. This is a combination problem: the grid traversal is a loop, and the matching is KMP.

**Correctness.** Every occurrence of the word lies on a maximal line in one of the eight directions, and the extraction enumerates every maximal line exactly once per direction. The string search finds every occurrence on a line. Therefore the search finds every occurrence in the grid.

**Complexity.** $O(nm)$ to extract the lines, plus $O(nm)$ for the searches, plus the length of the word, so $O(nm + L)$ time and $O(L)$ auxiliary space for the prefix function.

**Common wrong approach.** Searching each cell in each direction with a naive comparison, which is $O(nmL)$ and times out on a large grid with a long word.

## Practice progression

1. **Recognition.** Given a problem statement, decide whether backtracking applies. Look for "count the ways", "find all", a small depth, and local constraints. Write down the prune test before you write any code.
2. **Direct application.** Implement the eight-queens search, then the same search for the twelve-queens board, and confirm that the node count falls when the prune test is applied at every level instead of at the leaf.
3. **Adaptation.** Write the general template: state, choices, prune test, restore. Make it count solutions, find one solution, and find the first solution in lexicographic order.
4. **Combination.** Combine backtracking with a dynamic program: use the search to place the items and the program to check the sum, as in a knapsack variant where the weights are small and the values are large.
5. **Challenge.** Solve a problem where the prune test is the hard part: the constraints are local but the test itself needs a greedy argument, such as placing rectangles so that no two overlap.
6. **Transfer.** Take a problem from a different subject and recognize it as backtracking: a matching problem, a tiling problem, or a scheduling problem. Write the four decisions down before the code.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four decisions every backtracking search makes? (At a glance)
2. Why is it safe to cut a subtree whose root already violates a constraint? (Key insight)
3. What must a prune test satisfy for the completeness argument to hold? (Correctness proof)
4. State the state invariant and say which half of the proof uses each half of it. (Correctness proof)
5. How many nodes does the pruned eight-queens search visit, and how many leaves does the unpruned tree have? (Complexity analysis)
6. What is the smallest board on which a missing restore changes the answer, and what does the buggy program report? (Common mistakes)
7. Why does the prune test belong after the insertion and before the recursive call? (Implementation walkthrough)
8. When should a backtracking problem be replaced by a dynamic program instead? (Algorithm selection)
9. Which constraint values rule backtracking out entirely? (Recognition patterns)
10. Under what circumstances must the restore live in a `finally` block rather than after the loop? (Recursion decision)

## Further reading

- The flat enumeration that backtracking generalizes is in [subset enumeration](/algorithms/enumeration/subset-enumeration), and the count of the states is what decides whether the search is affordable.
- The recursion that the search is written in is described in [recursion](/algorithms/foundations/recursion).
- The bounds that decide whether an exponential number of nodes is acceptable are in [complexity](/algorithms/foundations/complexity).
- The dynamic program that replaces a backtracking search when the constraints involve sums is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The monotone subsequence that a search can be replaced by is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The counting formula that replaces a search when the answer is a count of arrangements is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
