---
id: enumeration.constraint-propagation
title: Constraint propagation
summary: Carry the effect of every choice in a bitmask domain, so each branch tests all earlier constraints at once and the search visits thousands of nodes instead of millions.
division: [silver, gold]
subjects: [enumeration]
level: intermediate
importance: common-contest-technique
keywords:
    [constraint propagation, forward checking, bitmask, n-queens, domain, pruning, arc consistency]
prerequisites:
    required: [enumeration.backtracking, foundations.binary-representation]
    recommended: [foundations.recursion, foundations.complexity]
complexity:
    time: "O(N), where N is the number of visited nodes, which is 856189 for n = 12"
    space: "O(n) for the recursion and O(1) masks per frame"
assumptions:
    - Every constraint is local to the decision that violates it, so its effect on the remaining decisions can be summarized in a fixed-size state.
    - n is at most 12, so the propagated domain fits in one 32-bit word and the counters fit in a 64-bit integer.
    - The node count is the number of recursive calls, including the root and the leaves.
implementations: enumeration.constraint-propagation
reviewed: false
---

<AlgorithmSummary algorithm="enumeration.constraint-propagation" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="enumeration.constraint-propagation" />

## At a glance

Constraint propagation is the part of a search that turns a choice into knowledge. When a queen is placed, the squares it attacks are known immediately. Every later placement can consult that knowledge instead of rechecking the queen, and the cheapest way to hold it is a set of occupancy bits.

The running example is the counting form of the n-queens problem. Read $n$, place one queen in each row so that no two share a column or a diagonal, and print the number of placements together with the number of search nodes visited. For $n = 12$ the answer is $14\,200$ placements and $856\,189$ visited nodes. The unpruned tree has $12^{12} = 8\,916\,100\,448\,256$ leaves.

The method has three decisions, and they are the same in every problem that uses it.

1. **What does a choice remove?** A queen removes one column and two diagonals from every later row.
2. **How is the removal represented?** Three integers, one bit per column, for the column mask and the two diagonal masks.
3. **When is the representation refreshed?** When the row advances, the diagonal masks shift by one bit, because a diagonal moves one column sideways for each row downward.

The word _propagation_ is used because the effect of the choice is pushed into the domain of every future decision. In the n-queens program the push is a shift and an OR; the domain of the next row is then one AND-NOT away. There is no loop over the queens already placed and no board to scan.

The general form of the idea is forward checking: after assigning one variable, delete from every unassigned variable the values that the assignment forbids. Arc consistency repeats that deletion until nothing changes, and unit propagation in a SAT solver is another member of the family. The n-queens case is the smallest complete example, because one assignment determines the whole forbidden set of the next row, so one pass reaches the fixpoint.

The cost is $O(N)$ time for $N$ visited nodes, and $O(n)$ space for the recursion. The benefit is a tree with thousands of nodes instead of billions, and a per-node test that is a handful of bit operations instead of a scan.

Two limits are worth stating at the start. Propagation does not make the problem polynomial: the number of solutions itself grows quickly, and the node count grows with it. And a constraint that is not in the represented state is not being propagated, no matter how carefully the code checks it somewhere else.

## Problem motivation

Count the placements of $n$ queens on an $n$ by $n$ board so that no two queens attack each other. A queen attacks every square in its row, its column, and its two diagonals. One queen per row removes the row constraint by construction, so a placement is a sequence $c_0, c_1, \ldots, c_{n-1}$ of columns, and the three remaining constraints are:

- $c_i \ne c_j$ for $i \ne j$;
- $c_i - i \ne c_j - j$ for $i \ne j$;
- $c_i + i \ne c_j + j$ for $i \ne j$.

The input is a single integer $n$ with $0 \le n \le 12$. The output is one line with two integers: the number of placements and the number of nodes the search visits. The second number is what makes the technique visible. A correct answer without it says nothing about whether the search was pruned or merely survived.

The obvious program enumerates every sequence of columns and tests the three constraints at the end. It examines $n^n$ sequences. For $n = 8$ that is $16\,777\,216$ tests, and for $n = 12$ it is $8.9 \times 10^{12}$, which does not finish in any contest time limit.

The second obvious program tests the constraints as soon as a queen is placed, but recomputes the attacks by scanning the queens already on the board. That program visits the same search tree as the bitmask version, which is $2\,057$ nodes for $n = 8$, but it pays $O(n)$ work per candidate. The difference between the two programs is a constant factor, and a constant factor of eight is worth having, but it is not the main story.

The main story is the state. Once the board is summarized by three occupancy masks, placing a queen is one OR into each mask, and the legality test is one AND-NOT. The state is small enough to pass by value, so there is no undo step and no way to leave a stale mark behind. That is the property the rest of the article exploits.

The problem is also the gateway to a family of harder ones. A Sudoku solver carries a domain of digits for every empty cell. A graph coloring search carries the set of colors still available at every vertex. A SAT solver carries the set of clauses that become unit. All of them are the same three decisions: what a choice removes, how the removal is represented, and when the representation is refreshed.

## Recognition patterns

Constraint propagation is the right tool when a search assigns one variable at a time and the constraints between variables are local.

- The statement says "no two", "at most one per row", "each value exactly once", or "conflict".
- Every constraint can be checked against the choices already made, without waiting for the assignment to be complete.
- The set of values still allowed for a variable can be summarized in a word, a bitset, or a short array.
- The search has to enumerate or count many complete assignments, so the per-node cost matters.

The phrases that signal it are "place $n$ items", "count the placements", "no two share", "valid Sudoku", and "each row and column". The phrase that rules it out is "the sum of the chosen values", because a partial sum is not a domain and propagation has nothing to remove.

The constraint values decide which representation fits.

| Situation | What it rules |
| --- | --- |
| $n \le 12$ | Three 32-bit masks hold the whole state, and the counters fit in 64 bits |
| $n \le 62$ | Three 64-bit masks still fit one word in C++ and Java |
| $n > 62$ | The domain needs several words; propagation is still possible but the node count is usually the larger obstacle |
| Constraints are binary and local | A mask or a small set per variable is enough |
| Constraints involve a sum over the whole assignment | A dynamic program, not propagation |
| One queen is fixed by the input | Assign it first, then propagate from it |
| The board has blocked squares | Add a blocked mask to the three occupancy masks |
| The input is one complete placement to verify | No search at all; one linear scan |

The last row is a useful boundary. Verification is the prune test without the enumeration. If a problem only asks whether a given placement is valid, propagation buys nothing, and a scan is the honest solution.

## Naive approach

The baseline enumerates every column sequence and tests the constraints at the leaf.

```python
from itertools import product

def count_placements(n):
    total = 0
    for columns in product(range(n), repeat=n):
        if all(
            columns[i] != columns[j]
            and columns[i] - i != columns[j] - j
            and columns[i] + i != columns[j] + j
            for i in range(n)
            for j in range(i + 1, n)
        ):
            total += 1
    return total
```

This is correct for every $n$. It performs $n^n$ leaf tests and $O(n^2)$ work per test, so its cost is $O(n^{n+2})$ in the worst case. At $n = 8$ the leaf count alone is $16\,777\,216$.

The second baseline prunes at every level but recomputes the attacks from the list of placed queens.

```python
def search(row, placed):
    if row == n:
        return 1
    total = 0
    for col in range(n):
        if all(
            col != c and row - col != r - c and row + col != r + c
            for r, c in placed
        ):
            total += search(row + 1, placed + [(row, col)])
    return total
```

This is the correct shape, and it visits exactly the nodes the bitmask version visits. Its cost is $O(n \cdot N)$ instead of $O(N)$, because the inner `all` scans the queens already placed. The third baseline is the one that exposes the real gap: move the test to the leaf and the node count becomes $n^n$, while keeping the test at every level and the node count is $2\,057$ for $n = 8$.

The two changes are independent. Early testing changes the tree; propagation changes the price of the test. The article's program does both at once, and the node counter reports the first while the bit operations pay for the second.

## Key insight

A constraint is information, not a test to run later.

When a queen is placed at $(r, c)$, every square it attacks is determined. The column $c$ is attacked in every later row, the diagonal $r - c$ is attacked along one direction, and the diagonal $r + c$ is attacked along the other. Recording those three facts is enough to answer the only question the search ever asks: which columns are legal in the current row?

The answer is a set. The set has at most $n$ elements, and an integer has at least 32 bits, so the set can be the integer. Bit $c$ is one exactly when column $c$ is unavailable. Then the legal columns are

$$
\text{available} = \text{full} \;\&\; \lnot(\text{cols} \mid \text{down} \mid \text{anti}),
$$

where `full` has one bit for every column of the board.

The second half of the insight is how the diagonal masks stay aligned with the row. A queen on the diagonal $r - c = d$ attacks the square $(r + 1, c + 1)$ in the next row, because $(r + 1) - (c + 1) = d$. The column index grows by one, so the mask shifts left by one. A queen on the diagonal $r + c = s$ attacks $(r + 1, c - 1)$, so that mask shifts right by one. The shift is not an implementation detail; it is the propagation rule written in the only notation the machine has for sets of columns.

The third part is the one that makes the program short. The masks are passed to the recursive call by value. Each branch owns its state, the parent's state is untouched, and there is nothing to restore when the branch returns. Backtracking still happens, because the loop moves to the next bit after the call returns, but the undo step has disappeared.

## Visual intuition

Write the board as four columns numbered $0$ to $3$, with column $0$ in the least significant bit. The four bits, written `c3c2c1c0` from most to least significant, are the mask, and `1111` is the full board.

The first table follows the branch that produces a solution. Each row shows the mask after the queen of that row has been placed, and the last column shows the domain handed to the next row.

| Row | Chosen column | `cols` | `down` | `anti` | `available` at the next row |
| --- | ------------- | ------ | ------ | ------ | --------------------------- |
| 0   | 1, `0010`     | `0010` | `0100` | `0001` | `1000`                      |
| 1   | 3, `1000`     | `1010` | `1000` | `0100` | `0001`                      |
| 2   | 0, `0001`     | `1011` | `0010` | `0010` | `0100`                      |
| 3   | 2, `0100`     | `1111` | `1100` | `0011` | leaf                        |

Read the first row as follows. Column 1 is occupied, so `cols` is `0010`. The queen's $r - c$ diagonal is $-1$, which at row 1 attacks column 2, so `down` is `0100`. Its $r + c$ diagonal is $1$, which at row 1 attacks column 0, so `anti` is `0001`. The union is `0111`, its complement inside `1111` is `1000`, and the only legal column at row 1 is column 3.

The second table follows a branch that dies early.

| Row | Chosen column | `cols` | `down` | `anti` | `available` at the next row |
| --- | ------------- | ------ | ------ | ------ | --------------------------- |
| 0   | 0, `0001`     | `0001` | `0010` | `0000` | `1100`                      |
| 1   | 2, `0100`     | `0101` | `1100` | `0010` | `0000`                      |

After the queens at $(0, 0)$ and $(1, 2)$, every column of row 2 is attacked. Column 0 is attacked from above, column 1 by the $r + c$ diagonal, column 2 by the column itself, and column 3 by the $r - c$ diagonal. The domain is empty, and the search returns without ever reaching row 3.

The two tables together are the whole algorithm. The first shows why a solution is found, the second shows why a hopeless branch costs one node instead of a full subtree.

The visited nodes for $n = 4$ are distributed as $1, 4, 6, 4, 2$ over the five levels: the root, four placements of one queen, six placements of two, four placements of three, and two complete placements. The sum is $17$, which is the node count the fixtures pin.

## Formal model

A constraint satisfaction problem has a finite set of variables $X_0, \ldots, X_{n-1}$, a finite domain $D_i$ for each variable, and a set of constraints. A constraint is a relation on a subset of the variables; a partial assignment satisfies it when the assigned values appear together in the relation.

::: math definition Definition
A partial assignment $a$ on the variables $X_0, \ldots, X_{r-1}$ is **consistent** when every constraint whose variables are all assigned is satisfied by $a$.
:::

::: math definition Definition
The **domain of $X_i$ under $a$**, written $D_i(a)$, is the set of values $v \in D_i$ such that $a$ extended by $X_i = v$ is consistent.
:::

::: math definition Definition
A **propagator** for a constraint takes a partial assignment and removes from each $D_i(a)$ every value that cannot appear in any consistent completion. It is **sound** when every removed value appears in no completion. It reaches a **fixpoint** when no propagator can remove another value.
:::

For n-queens, the variables are the rows, every domain is $\{0, \ldots, n-1\}$, and the constraints are the three pairwise inequalities. The partial assignment after $r$ rows is the sequence $c_0, \ldots, c_{r-1}$. Its three masks are sets of columns at the current row:

$$
C_r = \{c_i : i < r\},
$$

$$
P_r = \{c_i + (r - i) : i < r\} \cap \{0, \ldots, n-1\},
$$

$$
M_r = \{c_i - (r - i) : i < r\} \cap \{0, \ldots, n-1\}.
$$

::: math lemma Lemma
Under the assignment $c_0, \ldots, c_{r-1}$, the domain of row $r$ is

$$
D_r = \{0, \ldots, n-1\} \setminus (C_r \cup P_r \cup M_r).
$$
:::

The three sets correspond to the three ways a queen can attack a square in row $r$. A queen at $(i, c_i)$ attacks column $c_i$; the square $(r, c_i + (r - i))$ lies on the same $r - c$ diagonal; and the square $(r, c_i - (r - i))$ lies on the same $r + c$ diagonal. Every element of $C_r \cup P_r \cup M_r$ is therefore a column that cannot receive a queen, and every other column can.

The masks update as the row advances:

$$
C_{r+1} = C_r \cup \{c_r\},
\qquad
P_{r+1} = ((P_r \cup \{c_r\}) + 1) \cap \{0, \ldots, n-1\},
\qquad
M_{r+1} = ((M_r \cup \{c_r\}) - 1) \cap \{0, \ldots, n-1\}.
$$

Adding one to every element of a set of columns is a left shift of its bitmask, and subtracting one is a right shift. The intersection with the board is the `& full` in the code. That is the complete translation from the mathematics to the three integers.

In the general vocabulary, the n-queens program performs forward checking. Assigning row $r$ immediately narrows the domain of every later row, and because the board is uniform, all later rows receive the same three removals, shifted by their distance from row $r$. The program stores the accumulated effect rather than a domain per row, which is why one word is enough.

A fixpoint loop is unnecessary here: the constraints are binary, and after one assignment every consequence for the next row is already in the masks. A Sudoku solver is different, because assigning one cell can empty the domain of a peer, whose emptied domain can empty another; that is where repeated propagation earns its cost.

The node count has a matching formal definition. A search node is a consistent partial assignment, and the root is the empty assignment. The program visits exactly those nodes, so

$$
N = 1 + \sum_{r=1}^{n} A_r,
$$

where $A_r$ is the number of consistent partial assignments of length $r$.

## Algorithm derivation

Start from the backtracking skeleton.

```python
def backtrack(state, row):
    if row == limit:
        record(state)
        return
    for choice in choices(state, row):
        apply(state, choice)
        if feasible(state, row):
            backtrack(state, row + 1)
        undo(state, choice)
```

The n-queens instance answers the four questions of [backtracking](/algorithms/enumeration/backtracking) as follows.

The state is the pair (row, three masks). The choices are the set bits of `available`. The prune test is the computation of `available` itself, because a column outside it is attacked and a column inside it is not. The undo is empty, because the state is passed by value.

The derivation of the update is three lines of substitution.

1. A queen at $(r, c)$ occupies column $c$, so the next column mask is `cols | bit`.
2. The same queen lies on the diagonal $r - c = d$. In row $r + 1$ that diagonal reaches column $c + 1$, so the next diagonal mask is `((down | bit) << 1)` clipped to the board.
3. The same queen lies on the diagonal $r + c = s$. In row $r + 1$ that diagonal reaches column $c - 1$, so the next anti-diagonal mask is `(anti | bit) >> 1`.

The recursion follows.

```python
def search(row, cols, down, anti):
    nodes += 1
    if row == n:
        count += 1
        return
    available = full & ~(cols | down | anti)
    while available:
        bit = available & -available
        available ^= bit
        search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >> 1)
```

Four details carry the correctness of the program.

- `bit = available & -available` isolates the lowest set bit. In two's complement, negating a number flips every bit above the lowest one, so the AND keeps exactly that one.
- `available ^= bit` clears the bit just tried. Without it, the loop would never advance.
- The left shift is masked with `full` so that a queen in the last column does not create a bit outside the board. The right shift cannot create such a bit, so it needs no mask.
- `nodes += 1` is the first statement of the call, so the root and the leaves are counted. The counter is not incremented for a candidate column that is rejected, because a rejected column never becomes a call.

The order of the bits is increasing column, because the lowest set bit is taken first. That order is irrelevant to the count, but it is exactly the lexicographic order that some of the worked problems require.

## Step-by-step execution

Four queens, columns tried in increasing order. The node numbers are the order in which the calls are entered.

1. **Row 0, node 1.** `available` is `1111`, so all four columns are legal. The root counts as a visited node.
2. **Row 1, node 2.** Column 0 was chosen. `cols` is `0001`, `down` is `0010`, `anti` is `0000`, and `available` is `1100`.
3. **Row 2, node 3.** Column 2 was chosen. The union of the three masks is `1111`, so `available` is `0000`. The branch dies at depth two, and no row 3 call is made.
4. **Row 2, node 4.** Back at row 1, column 3 is chosen instead. The masks are `cols = 1001`, `down = 0100`, `anti = 0100`, and `available` is `0010`.
5. **Row 3, node 5.** Column 1 is chosen. The masks block all four columns, so `available` is `0000`. This branch dies without a leaf.
6. **Row 1, node 6.** Back at the root, column 1 is chosen. `cols = 0010`, `down = 0100`, `anti = 0001`, and `available` is `1000`.
7. **Row 2, node 7.** Column 3 is chosen. `cols = 1010`, `down = 1000`, `anti = 0100`, and `available` is `0001`.
8. **Row 3, node 8.** Column 0 is chosen. `cols = 1011`, `down = 0010`, `anti = 0010`, and `available` is `0100`.
9. **Row 4, node 9.** Column 2 is chosen. The call is made with `row == 4`, so it increments the solution counter and returns. The placement is $1, 3, 0, 2$.
10. **Row 1, node 10.** Back at the root again, column 2 is chosen. `cols = 0100`, `down = 1000`, `anti = 0010`, and `available` is `0001`.
11. **Row 2, node 11.** Column 0 is chosen. `cols = 0101`, `down = 0010`, `anti = 0001`, and `available` is `1000`.
12. **Row 3, node 12.** Column 3 is chosen. `cols = 1101`, `down = 0100`, `anti = 0100`, and `available` is `0010`.
13. **Row 4, node 13.** Column 1 is chosen. The second solution is $2, 0, 3, 1$.
14. **Row 1, node 14.** The last root branch chooses column 3. `cols = 1000`, `down = 0000`, `anti = 0100`, and `available` is `0011`.
15. **Row 2, node 15.** Column 0 is chosen. `available` becomes `0100`.
16. **Row 3, node 16.** Column 2 is chosen. `available` becomes `0000`, so the branch dies.
17. **Row 2, node 17.** Column 1 is chosen instead. `available` becomes `0000`, and the whole search ends.

The totals are $17$ nodes and $2$ solutions. The level counts are $1, 4, 6, 4, 2$, as the visual table predicted. The two dead branches at nodes 3 and 5 are the ones that a leaf-only test would have explored to depth four, and the two at nodes 16 and 17 die at rows 3 and 2, so the search never descends to a fourth queen on those branches.

Notice what the trace does not contain. There is no undo between steps, because no call changed anything its parent can see. There is no scan of earlier queens, because the masks already hold their effect. The only state that changes between a call and its return is the two counters.

## Correctness proof

::: math lemma Lemma
At the entry of the call for row $r$ with masks `cols`, `down` and `anti`, bit $c$ of the three masks is set exactly when placing a queen at $(r, c)$ would attack a queen already placed in an earlier row.
:::

::: math proof Proof
The proof is an induction on $r$. For $r = 0$ there are no earlier queens and all three masks are zero, so the claim is vacuous.

Assume the claim for row $r$ and let the chosen column be $k$. The call for row $r + 1$ receives `cols | bit`, `((down | bit) << 1) & full`, and `(anti | bit) >> 1`.

A queen at $(r, k)$ attacks column $k$ in every later row, which is the new bit in `cols`. It also lies on the diagonal $r - k$, which reaches column $c$ in row $r + 1$ exactly when $c - (r + 1) = k - r$, that is $c = k + 1$. The left shift moves the bit for $k$ to $k + 1$, and a bit already in `down` at column $j$ moves to $j + 1$, which is the same diagonal relation one row later. The argument for `anti` is symmetric with $c = k - 1$ and a right shift. So the three masks at row $r + 1$ are exactly the columns attacked by the queens in rows $0$ through $r$, which is the claim. $\square$
:::

::: math theorem Theorem
The program prints the number of valid placements of $n$ queens and the number of visited nodes.
:::

::: math proof Proof
Soundness: every placement counted is valid. A call at row $r$ only chooses a bit $k$ that is outside `cols | down | anti`. By the lemma, no queen already placed attacks $(r, k)$. The placement built along the path therefore has no attacking pair, because every pair was checked when its later queen was placed.

Completeness: every valid placement is counted. Let $c_0, \ldots, c_{n-1}$ be a valid placement. At row $0$ the empty masks allow $c_0$. Suppose the call for row $r$ has been reached with the masks of $c_0, \ldots, c_{r-1}$. The bit for $c_r$ is not in any mask, because no earlier queen attacks $(r, c_r)$ in a valid placement. So the loop reaches that bit and makes the call for row $r + 1$. By induction the search reaches row $n$ with the placement, and the leaf increments the counter.

No placement is counted twice, because each leaf is reached by exactly one sequence of choices, and the loop clears each bit before moving on.

Node count: every call is made from exactly one parent call and corresponds to one consistent partial assignment; the root corresponds to the empty assignment. The calls therefore number one plus the consistent partial assignments of length at least one, which is the definition used in the formal model. $\square$
:::

The proof uses only two facts about the update: the shifts move a diagonal by one column per row, and the mask with `full` keeps the board finite. Neither fact depends on the language, which is why the six programs have the same correctness argument.

## Complexity analysis

Let $N$ be the number of visited nodes. Each call performs a constant number of bit operations and one iteration per child. Summed over the tree, the work is $O(N)$.

The masks are machine words, so each operation costs $O(1)$ for $n \le 12$. The recursion uses $n + 1$ frames and one word per mask per frame, so the auxiliary space is $O(n)$.

The interesting quantity is $N$, and it is measured rather than bounded.

| $n$ | Placements | Visited nodes | Leaves of the unpruned tree       |
| --- | ---------- | ------------- | --------------------------------- |
| 4   | 2          | 17            | $4^4 = 256$                       |
| 6   | 4          | 153           | $6^6 = 46\,656$                   |
| 8   | 92         | $2\,057$      | $8^8 = 16\,777\,216$              |
| 10  | 724        | $35\,539$     | $10^{10} = 10\,000\,000\,000$     |
| 12  | $14\,200$  | $856\,189$    | $12^{12} = 8\,916\,100\,448\,256$ |

The node count grows by a factor of about four to five per added row, while the unpruned leaf count grows by a factor of $n$ or more. The pruning is what makes the difference, and the masks are what make the pruning cheap enough to apply at every level.

The worst-case bound is still exponential. The search tree that keeps only the column constraint has at most $P(n, r)$ nodes at level $r$, where $P(n, r) = n!/(n - r)!$, so the whole tree has fewer than $e \ast n!$ nodes. For $n = 12$ that bound is about $1.3 \times 10^9$, and the diagonal masks cut it to $856\,189$. The bound is honest but useless for predicting the actual count; the table is what to use.

Both printed numbers fit in a signed 32-bit integer for $n \le 12$, since $856\,189 < 2^{31}$. The reference programs use 64-bit counters anyway, because the node count grows by a factor of about five per row and a 32-bit counter fails long before the board outgrows the mask. The C and C++ programs use `long long`, Java uses `long`, Pascal uses `Int64`, and Python and JavaScript use their native numbers.

The per-node cost is where the constant-factor win lives. A scan of the queens already placed costs up to $n$ comparisons per candidate. The masks cost three ORs, two shifts, one AND-NOT, and one bit extraction, all independent of $n$. On the $2\,057$ nodes of the eight-queens search the difference is small; on a problem with millions of nodes it is the difference between passing and not.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count all placements, $n \le 12$ | This technique |
| Verify one complete placement | One pass over the queens, no search |
| $n \le 62$ on a 64-bit machine | The same three masks in a 64-bit integer |
| $n$ beyond a machine word | Bitsets of several words, or a different algorithm |
| Sudoku | Forward checking with one domain per empty cell and the minimum-remaining-values rule |
| Graph coloring | Backtracking with forward checking, or DSATUR |
| Constraints are sums over all variables | Dynamic programming, for example [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| One solution with a bound on the score | [Branch and bound](/algorithms/enumeration/branch-and-bound) |
| Propositional clauses | Unit propagation inside a SAT solver |
| Constraints are linear inequalities over intervals | Difference constraints or interval propagation |

The rule of thumb is that propagation is right when the effect of one assignment on the rest of the search can be written down immediately and fits in a small state. When the effect is a sum, the state is a table of sums, and that is dynamic programming. When the effect is a bound, the state is the best score so far, and that is branch and bound.

## Reference implementations

The manifest publishes one `program` variant per language. All six read $n$, count the placements, and print the count and the number of visited nodes.

- `c/program.c` uses `scanf`, `int` masks, and `long long` counters, and prints with `%lld`.
- `cpp17/program.cpp` uses `std::cin` and `std::cout`, `int` masks, and `long long` counters.
- `java/Main.java` uses `Scanner`, `int` masks, and `long` counters; the class is `Main`.
- `python/program.py` reads every token from `sys.stdin.buffer` and recurses with the masks as arguments.
- `pascal/program.pas` uses `Integer` masks, `Int64` counters, `SysUtils`, and one argument per `Read`, so it compiles under pas2js.
- `javascript/program.js` reads the whole of stdin with `readFileSync(0)` and uses 32-bit bitwise operators with an unsigned right shift.

The input is one integer $n$ on a line by itself. The output is one line with two decimal integers separated by one space and terminated by a newline. The fixtures pin exactly those characters, and the six languages are compared after newline normalization.

The shared core is the same in every language.

```text
search(row, cols, down, anti):
    nodes += 1
    if row == n:
        count += 1
        return
    available = full & ~(cols | down | anti)
    while available != 0:
        bit = available & -available
        available = available ^ bit
        search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >> 1)
```

The node count is incremented at the entry of every call, including the root and the leaves. It counts consistent partial assignments, not candidate columns. This convention is part of the output contract, because a different convention produces a different second number for the same placement count.

Three language details are worth knowing before reading the listings. The C, C++, and Java versions use signed 32-bit masks, which is safe for $n \le 12$ because the shifted mask stays below $2^{13}$. The JavaScript version uses 32-bit bitwise operators, so the mask is limited to 30 columns, and it uses `>>>` for the right shift. The Python version relies on `& full` to keep the mask nonnegative; without it, Python's unbounded integers would produce an infinite two's-complement pattern.

## Recursion decision

The recursion depth is $n$, at most 12, so the call stack is never a concern. The stack holds one frame per row, not one frame per node.

| Language   | Default stack             | Practical depth         | Recommendation    |
| ---------- | ------------------------- | ----------------------- | ----------------- |
| C and C++  | 8 MB on Linux             | About $10^5$ frames     | Recursive is safe |
| Java       | 512 KB to 1 MB per thread | About $10^4$ frames     | Recursive is safe |
| Python     | Interpreter limit of 1000 | 1000 frames             | Recursive is safe |
| Pascal     | The host stack            | Depends on the platform | Recursive is safe |
| JavaScript | The V8 engine limit       | About $10^4$ frames     | Recursive is safe |

The one place where the recursion could matter is pas2js, where the compiled Pascal runs on the JavaScript stack. Twelve frames is far below the limit, so the published listing is safe there as well.

If a variant needed a depth in the thousands, the iterative form would replace the call stack with an explicit stack of `(row, available)` frames and restore the masks when a frame is popped. That form is longer and not needed here, because the depth is the board size.

The resource that does grow is the node count, and it is controlled by the pruning, not by the stack.

## Implementation walkthrough

The program is four lines inside a loop.

```cpp
int available = full & ~(cols | diag | anti);
while (available != 0) {
    int bit = available & -available;
    available ^= bit;
    search(row + 1, cols | bit, ((diag | bit) << 1) & full, (anti | bit) >> 1);
}
```

The first line computes the domain. The second isolates the lowest column. The third removes it so the loop advances. The fourth propagates the choice and descends.

The mask after the left shift is the only line that needs care. A queen in column $n - 1$ has a down-diagonal bit at $n - 1$; shifted left it becomes bit $n$, which is outside the board. The `& full` removes it. Without the mask the extra bit is harmless for the availability test, because that test also ANDs with `full`, but it breaks the invariant that every mask stays inside the board and it overflows a 32-bit word when $n = 31$. The right shift drops bit $0$, which is the correct behavior: the anti-diagonal of a queen in column $0$ leaves the board on the next row.

The counters are the only mutable state. In C and C++ they are file-scope `long long`; in Java they are static `long`; in Python they are `nonlocal`; in Pascal they are global `Int64`; in JavaScript they are module-level `let`. The masks are parameters, so no branch can see another branch's state.

The bit extraction is worth one more sentence. For a positive integer $x$, `x & -x` is the largest power of two that divides $x$, which is exactly the lowest set bit. The loop then clears that bit with XOR, so the next iteration finds the next column. The combination visits the set bits in increasing order without a shift or a scan.

Reading the input is deliberately minimal. The C version reads one `%d`, the C++ version one `int`, the Java version one `nextInt`, the Python version the first token, the Pascal version one `Read`, and the JavaScript version the first whitespace-separated token. No program depends on line structure, so a trailing blank line or an extra space changes nothing.

The output is one `printf`, one `cout`, one `println`, one `print`, one `WriteLn`, or one `console.log`, always with the count first and the node total second.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Dropping both diagonal masks | The search counts column permutations, not solutions: 24 instead of 2 at $n = 4$ | Represent every constraint a queen can violate |
| Forgetting `& full` after the left shift | The mask leaves the board; Python loops forever on a negative mask, and 32-bit languages overflow at $n = 31$ | Mask every left shift |
| Forgetting to clear the bit | The same column is retried forever | Clear the bit immediately after extracting it |
| Counting nodes only at the leaves | The node total equals the solution count | Increment at the entry of the call |
| Counting rejected candidates as nodes | The total depends on the test placement, not on the tree | Count calls, not loop iterations |
| Reading line by line | A blank line or a wrapped line loses the input | Read whitespace-separated tokens |
| Assuming $n \ge 1$ | The empty board has one placement and one node | State the convention, or reject $n = 0$ explicitly |
| Using a 32-bit counter | The node count overflows for larger boards | Use 64-bit counters |

The second row is the one that survives small tests. For $n \le 12$ the stray bit is removed by the `full &` in the availability test, so the answer and the node count are both correct. The bug only appears when the mask reaches the sign bit, or in Python, where a negative mask has infinitely many leading one bits and the loop never ends.

The third row is louder: the program hangs on the first branch. The fourth and fifth rows are silent, because both produce a number and the number looks plausible.

A subtler point is that swapping the roles of the two diagonals is harmless. The board is symmetric under a horizontal reflection, so the count and the node count are unchanged. That is a property of this problem, not a license to confuse the two masks in a problem where one diagonal is blocked or weighted.

### Why this fails: the missing diagonal

The plausible wrong approach is to propagate the column mask and leave the diagonals out. The column is the constraint that is easiest to see, and the code still prunes, so the program looks like a constraint propagation solution.

The smallest board on which the failure is visible with a nonzero correct answer is four queens. A correct program reports $2$ placements and $17$ nodes. The program with only the column mask reports $24$ placements and $65$ nodes.

The mechanism is exact. Without the diagonal masks, a placement is any sequence of distinct columns, and there are $n!$ of them. The search enumerates every permutation and accepts every one. For four queens that is $4! = 24$; for eight queens it is $8! = 40\,320$ instead of $92$, and the node count is $109\,601$ instead of $2\,057$.

The failure is silent. The program prints a number, the number is larger than the correct one, and nothing in the output says which constraint was lost. The only reliable test is a differential one: run the program against a brute-force checker on $n \le 6$ and compare both the count and the node total.

The lesson generalizes. A propagated state is a summary of the constraints that have been applied. A constraint that is not in the summary is not being propagated, even if a comment says it is. The first question to ask of any propagation code is which constraint each field represents, and the second is what removes it when a branch ends.

## Variants and extensions

- **Forward checking with one domain per variable.** Keep a set of remaining values for every unassigned variable, and delete the values that the new assignment forbids. Sudoku is the standard example: one cell removes a digit from its row, column, and box.
- **Arc consistency.** Repeat the deletion until no domain changes, as in AC-3. It is stronger than forward checking and costs more per node; it pays when the domains are large and the constraints are tight.
- **Minimum remaining values.** Branch on the variable with the smallest domain first. The tree shrinks because the most constrained decision is made while the fewest alternatives remain.
- **Symmetry breaking.** Fix the first queen to one half of the board and double the count. The node count roughly halves, and the count is still exact because the reflection is a bijection.
- **Wider masks.** A signed 64-bit integer handles boards up to 62 columns, and an unsigned one handles up to 63. Beyond that, use an array of words and shift the carry between words.
- **Memoization on the propagated state.** Two partial placements with the same row and the same three masks have the same set of completions, so the subtree can be cached by the state. The table is sparse for $n \le 12$, but the idea is the basis of dynamic programming over subsets.
- **Iterative search.** Replace the recursion with an explicit stack of frames. The masks make each frame small, and the restore is a pop.
- **Unit propagation.** In a SAT solver, a clause with one unassigned literal forces that literal. The forced value is propagated to every clause that contains the opposite literal, and the process repeats until a conflict or a fixpoint.

## Contest strategy

1. Write the variables, their domains, and the constraints before writing code. If a constraint cannot be named, it cannot be propagated.
2. Choose one field per constraint family. For n-queens that is three masks; for Sudoku it is a mask for every row, every column, and every box.
3. Propagate before the recursive call, never after. A test that runs after the descent is a leaf test with extra steps.
4. Keep the state per branch, not per program. Pass the masks by value or copy them; shared mutable state is where stale marks come from.
5. Count nodes on the largest input you expect. The count is the only honest measure of whether the pruning is working.
6. Differential-test against a brute force for $n \le 6$. Compare the count and the node total, not just the answer.
7. Reach for symmetry breaking and variable ordering only after the basic propagation is correct.

The last point is a warning against premature cleverness. A symmetry argument that is wrong changes the answer by a factor of two, and it is much harder to debug than a slow search.

## Worked problems

### Problem 1: all eight-queens placements that contain a fixed queen

Restatement. The board is the standard eight by eight. Each dataset gives the row and column of one queen that must be part of the placement. Print every placement containing that queen, with the rows of the queens in column order, one solution per line, in lexicographic order, under the two heading lines required by the statement.

Naive baseline. Enumerate $8^8 = 16\,777\,216$ column assignments, test each one, and keep the placements that contain the fixed queen. The statement explicitly warns against this.

Insight. The output is indexed by column, so search column by column. The fixed queen assigns one column immediately; the other seven columns choose a row, and the row, down-diagonal, and anti-diagonal masks propagate the attacks exactly as in the article, with the roles of rows and columns exchanged.

Derivation. Place the fixed queen first, set its three bits, and recurse on the columns to its right and left, or simply iterate columns in increasing order and skip the fixed one until its turn. At column 8, emit the eight rows. Because the columns are filled in increasing order and the rows are tried in increasing order, the output is lexicographic without a sort.

Correctness. Every emitted placement contains the fixed queen and has no attacking pair, by the mask lemma. Every valid placement containing the fixed queen appears, because its row in each column is in the domain at that column, so the search follows its path. The order is the order of the recursion, which is lexicographic on the row sequence.

Complexity. The search visits the nodes of the eight-queens tree with one column fixed, which is a small fraction of $2\,057$; the emitted output is the dominant cost. The unpruned alternative is $16\,777\,216$ leaves.

Common wrong approach. Printing only the solutions whose fixed queen is in the first column, or sorting the output after generating it in a different order.

### Problem 2: the eight-queens board with square values

Restatement. There are up to 20 boards, each an eight by eight grid of values from 1 to 99. Place eight nonattacking queens so that the sum of the values on their squares is as large as possible, and print each board's best sum right-justified in a field five characters wide.

Naive baseline. Try all $8^8$ placements per board and keep the best valid sum. With 20 boards that is $335$ million placements, and each one needs a validity check.

Insight. The masks cut the search to the $92$ valid placements plus the partial placements that lead to them. The score is an accumulator passed down the recursion, so no board copy is needed.

Derivation. Recurse row by row with the three masks and a running sum. At a leaf, update the best sum. A branch-and-bound cutoff is optional: if the running sum plus the largest value in every remaining row cannot beat the best, the branch can be abandoned. On an eight by eight board the plain search is already small.

Correctness. The search enumerates exactly the valid placements by the mask lemma, and the leaf takes the maximum of the sums over those placements. The fixed 8 by 8 size means no asymptotic argument is needed.

Complexity. $O(N)$ for $N$ visited nodes per board, with $N = 2\,057$ before any bound. The space is $O(1)$, because the board size is fixed.

Common wrong approach. Taking the eight largest squares greedily. The largest squares usually share rows, columns, or diagonals, so the greedy choice is not a placement at all.

### Problem 3: solving a Sudoku

Restatement. The input holds several test cases. Each is nine lines of nine digits, with 0 for an empty cell. Fill the empty cells so that every row, every column, and every 3 by 3 box contains each digit from 1 to 9 exactly once. Any valid solution is accepted.

Naive baseline. Try all $9^{81}$ digit assignments, or recurse cell by cell and rescan the row, the column, and the box for every candidate. The first does not finish; the second is correct but pays 27 checks per candidate.

Insight. Each cell's domain is the set of digits missing from its row, its column, and its box. One mask per row, one per column, and one per box give a cell's domain in one AND-NOT, exactly as the three queen masks do.

Derivation. Precompute the box index of every cell. At each step, choose the empty cell with the smallest domain; if any empty cell has an empty domain, backtrack immediately. Place a digit, update the three masks, recurse, and undo the three updates on the way back. The undo is real here, because the masks are shared arrays rather than values passed down.

Correctness. A digit is placed only if it is absent from the row, the column, and the box, so every completed grid is valid. Every valid completion is reached, because its digit for the chosen cell is in that cell's domain and the search tries every domain value. The minimum-remaining-values rule changes the order, not the set of solutions.

Complexity. The worst case is exponential in the number of empty cells, but the domains are small and the minimum-remaining-values rule keeps the tree narrow on real puzzles. The space is $O(81)$ for the grid and the masks.

Common wrong approach. Filling the cells in reading order without propagation and rescanning 27 cells per candidate. It is correct on easy puzzles and slow on the hard ones; the fix is the domain mask, not a faster language.

## Practice progression

1. **Recognition.** Given a placement problem, list the constraints, decide which are local, and say what a choice removes from the remaining decisions.
2. **Direct application.** Implement the n-queens counter with the three masks and confirm $2$, $92$, and $14\,200$ for $n = 4, 8, 12$.
3. **Adaptation.** Add a blocked-square mask and count the placements on a board with holes, then compare with a brute force for $n \le 6$.
4. **Combination.** Add a score per square and keep the best sum, as in the Sultan's Successors, with and without a bound.
5. **Challenge.** Solve Sudoku with per-cell domains and the minimum-remaining-values rule, and count the nodes on the hardest puzzle you can find.
6. **Transfer.** Take a graph coloring or a scheduling instance and write its propagation rule as a mask or a domain. If the rule is a sum, recognize that the problem wants a dynamic program instead.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the three decisions every propagation scheme makes? (At a glance)
2. Why does a queen's diagonal mask shift left on one diagonal and right on the other? (Key insight)
3. What does bit $c$ of `available` mean, and why is the domain exact? (Formal model)
4. Why is no undo needed in the n-queens program? (Algorithm derivation)
5. How many nodes does the four-queens search visit, and how are they distributed by level? (Step-by-step execution)
6. What happens to the count and the node total if both diagonal masks are dropped? (Common mistakes)
7. Why must the left shift be masked with `full`, and why does the right shift not need it? (Implementation walkthrough)
8. When is the node counter incremented, and what would change if it were incremented at the leaf only? (Reference implementations)
9. When should a propagation problem be replaced by a dynamic program? (Algorithm selection)
10. What is the difference between forward checking and arc consistency? (Variants and extensions)

## Further reading

- The search that propagation accelerates is [backtracking](/algorithms/enumeration/backtracking); the node invariant and the restore discipline are developed there.
- The bit representation that makes the masks cheap is [binary representation](/algorithms/foundations/binary-representation).
- The technique that uses a whole word as a vector of states is [bitset optimization](/algorithms/advanced/bitset-optimization).
- The dynamic program over subsets that replaces a search when the state is a mask is [bitmask DP](/algorithms/dynamic-programming/bitmask-dp).
- The bound that propagation improves but does not remove is [branch and bound](/algorithms/enumeration/branch-and-bound).
- The recursion that the search is written in is [recursion](/algorithms/foundations/recursion), and the cost model is [complexity](/algorithms/foundations/complexity).
