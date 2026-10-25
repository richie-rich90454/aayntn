---
id: dynamic-programming.profile-dp
title: Profile dynamic programming
summary: Count or optimize the tilings of a grid by sweeping one cell at a time and carrying a bitmask of the next c cells, which is the only part of the past that can still affect the future.
division: [gold, platinum]
subjects: [dynamic-programming]
level: advanced
importance: common-contest-technique
keywords: [profile dp, broken profile, frontier dp, domino tiling, transfer matrix, plug dp]
prerequisites:
    required:
        [foundations.complexity, foundations.binary-representation, dynamic-programming.bitmask-dp]
    recommended: [dynamic-programming.0-1-knapsack, foundations.recursion]
complexity:
    time: "O(rc 2^c)"
    space: "O(2^c)"
assumptions:
    - The grid has a small number of columns c, so that 2^c masks fit in memory.
    - Every domino covers two adjacent free cells, and a blocked cell must stay uncovered.
    - The reference programs use 64-bit counters, so the board is at most 12 by 12.
implementations: dynamic-programming.profile-dp
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/dynamic-programming.profile-dp.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

Profile dynamic programming counts the ways to tile a grid with dominoes by sweeping the cells in row-major order and keeping a bitmask of the **frontier**, the boundary between cells that are already decided and cells that are not. The mask has one bit per column. Bit $0$ describes the current cell, bit $1$ the cell to its right, and so on around the row and into the next row.

The sweep has only three cases at each cell. A blocked cell must not be covered. A cell whose bit is already set was covered by an earlier domino and only has to be passed over. A free cell whose bit is clear must be covered now, either by a horizontal domino that also covers the cell to its right, or by a vertical domino that also covers the cell directly below. The two placements write one new bit into the shifted mask.

The state space is $r c \cdot 2^c$ rather than $2^{rc}$, which is the whole reason the technique exists. A full $12 \times 12$ board has $53\,060\,477\,521\,960\,000$ tilings, far beyond enumeration, but the profile program examines only $144 \cdot 4096 = 589\,824$ mask states. The cost is $O(rc 2^c)$ time and $O(2^c)$ space, exponential in the number of columns and linear in the number of rows.

The technique is also called the **broken profile** dynamic program, because the frontier is not a straight row boundary: it is a jagged line that holds the unprocessed suffix of the current row and the already-committed prefix of the next row. The word "profile" is the same word used for the state of a transfer-matrix dynamic program, and the two ideas are the same one.

## Problem motivation

A flooring contractor has to cover a rectangular room with dominoes. Each domino is a $1 \times 2$ rectangle and may be laid horizontally or vertically. Some cells of the room are occupied by support columns, so those cells must remain uncovered. The contractor wants to know how many different layouts are possible, counting two layouts as different when at least one domino occupies a different pair of cells.

The constraints are what make the problem interesting:

- $1 \le r, c \le 12$ rows and columns.
- Each cell is free (written $0$) or blocked (written $1$).
- A domino covers two cells that share an edge, and no cell may be covered twice.
- Every free cell must be covered.
- The answer is printed exactly, with no modulus.

The number of layouts grows quickly even on small boards. A $2 \times 4$ board has $5$ tilings, a $3 \times 4$ board has $11$, an $8 \times 8$ board has $12\,988\,816$, and a $12 \times 12$ board has $53\,060\,477\,521\,960\,000$. A backtracking search that tries one domino at a time is correct, but it visits an enormous number of partial layouts that differ only in the order in which the same cells were covered. The order is irrelevant to the count, and the dynamic program removes it.

Notice what the problem is _not_ asking. It does not ask for the minimum number of dominoes; that number is forced by the area. It does not ask for a single layout; that would be a search problem, and a backtracking program would be shorter. It does not ask for the number of layouts of a full rectangle with no blocked cells; for that special case there is a closed-form product, and the profile program is unnecessary. The blocked cells are what make the general grid interesting, because a closed formula no longer applies and the shape of the free region becomes part of the input.

The same DP answers several neighboring questions without changing its skeleton: minimum cost, existence, the number of layouts modulo a prime, and the number of layouts that use an exact number of one tile type. That flexibility is why the profile state is worth learning rather than memorizing a formula for rectangles.

## Recognition patterns

Profile dynamic programming is the right tool when all of the following hold.

- The board is a **grid**, and the objects being placed cover a **small number of adjacent cells**: dominoes, trominoes, monomers, or small polyominoes.
- One dimension of the grid is **small**, usually at most about twenty columns, so that a mask with one bit per column fits in memory.
- The answer is a **count**, a **minimum cost**, or a **feasibility** question over covers.
- The placement of an object only affects cells **near the sweep line**. A domino reaches at most one row ahead, so the frontier needs one row of bits.
- The board may contain **blocked cells**, and the answer must respect them.

The constraint values decide whether the technique is affordable.

| Constraint | What it rules |
| --- | --- |
| $c \le 12$ | Comfortable; $4096$ masks and a 64-bit counter are enough for exact counts |
| $c \le 20$ | About one million masks; $rc2^c$ states and $O(2^c)$ memory, still feasible with care |
| $c \le 24$ | Possible in C++ with sparse states, but the dense table is already tens of megabytes per array |
| $c > 30$ | Rules out the flat mask; look for a closed form, a transfer matrix with few reachable states, or a different decomposition |
| Both dimensions are large and there are no blocked cells | A closed-form product for rectangles, or the FKT algorithm for planar matchings, is polynomial and avoids the exponential width |
| The tiles are connected in a way that must be tracked (a single loop, a Hamiltonian cycle) | A plain occupancy mask is not enough; the state must carry connectivity labels, which is plug DP |
| The question asks for **one** layout, not a count | Backtracking is shorter; the DP can reconstruct, but it stores more |
| The objects reach two or more rows ahead | The window must be wider, or the state must include more than one row |

Two phrases in a statement are strong signals. "Cover the board with $1 \times 2$ and $2 \times 1$ tiles" and "count the number of ways" are the definition of the domino-tiling instance. "The board has blocked cells" is the signal that a closed-form rectangle formula will not be enough. A phrase that rules the technique out is "the answer is modulo $10^9+7$" only when the width is large; the modulo itself is easy, but it does not reduce the $2^c$ state count.

<Synonyms terms="profile dp, broken profile dp, frontier dp, domino tiling, transfer matrix" />

## Naive approach

The baseline is a backtracking search that finds the first uncovered free cell and tries to cover it.

```python
def count(rows):
    r, c = len(rows), len(rows[0])
    free = {(i, j) for i in range(r) for j in range(c) if rows[i][j] == "0"}

    def search(remaining):
        if not remaining:
            return 1
        i, j = min(remaining)
        total = 0
        if (i, j + 1) in remaining:
            total += search(remaining - {(i, j), (i, j + 1)})
        if (i + 1, j) in remaining:
            total += search(remaining - {(i, j), (i + 1, j)})
        return total

    return search(free)
```

The code is correct for every board. It is also hopeless on a $12 \times 12$ board: the recursion tree has one node per partial tiling, and the same partial tiling is reached in many different orders. Even the number of complete tilings is $5.3 \times 10^{16}$, so no enumeration of them can finish.

A second baseline keeps a two-dimensional boolean table of covered cells and memoizes on that table. The state is then a subset of the $rc$ cells, so there are $2^{rc}$ states, which is worse than the number of tilings for any board of moderate size. The memoization is correct but useless: it replaces one exponential with a larger one.

The third baseline is the important one. It enumerates the mask of cells in the next row that are already covered by vertical dominoes, and fills each row recursively. That is already a profile DP, but it is usually written as a search over rows with a generated transition table. The version in this article is the same idea taken one cell at a time, which makes the state small, the transition local, and the proof a straightforward induction.

The reason all three baselines fail is the same. They remember the exact set of covered cells, but the future cannot see most of that set. A domino placed far above the sweep line can never touch the current cell, so the exact shape of the covered region above is irrelevant. The next section makes that observation precise.

## Key insight

The insight is that, at any moment during a row-major sweep, **only the next $c$ cells can already be covered**.

Suppose the sweep has processed every cell before cell $k$, and suppose a domino placed at some cell $p < k$ also covers a cell $q \ge k$. There are only two possibilities.

- If the domino is horizontal, then $q = p + 1 \le k$. Since $q \ge k$, this means $q = k$.
- If the domino is vertical, then $q = p + c \le (k - 1) + c = k + c - 1$.

So every commitment from the past lands in the window $[k, k + c - 1]$. No domino can reach $k + c$ or beyond, because the latest cell that could have started one is $k - 1$. The window has exactly $c$ cells, one per column, and a bitmask of $c$ bits records all of it.

The processed prefix is fully covered by construction. Its exact arrangement cannot matter, because no future domino can touch it. Two partial tilings that agree on the window have exactly the same possible futures, so they can be merged into one state. That merge is the entire dynamic program.

The state count drops from $2^{rc}$ to $rc \cdot 2^c$. The exponential is now in the width of the board, which is the dimension the statement keeps small, rather than in the area, which can be large.

## Visual intuition

The picture worth having in your head is a conveyor belt of $c$ cells moving through the grid in row-major order. Before cell $k$, the belt holds cells $k, k+1, \ldots, k+c-1$. Bit $d$ is $1$ when the cell in position $d$ is already covered by a domino placed earlier.

For a four-column board, just before cell $(1, 1)$ the belt holds

$$
\begin{array}{c|cccc}
\text{position} & 0 & 1 & 2 & 3 \\
\hline
\text{cell} & (1,1) & (1,2) & (1,3) & (2,0)
\end{array}
$$

The first three positions are the unprocessed suffix of row $1$. The last position is the first cell of row $2$. The frontier is therefore a broken line, not a straight row boundary: it runs along the current row to the right of the sweep, then drops to the next row on the left.

After the current cell is decided, the belt advances by one cell:

$$
\begin{array}{c|cccc}
\text{position} & 0 & 1 & 2 & 3 \\
\hline
\text{cell} & (1,2) & (1,3) & (2,0) & (2,1)
\end{array}
$$

The old bits $1, 2, 3$ become the new bits $0, 1, 2$. The new bit $3$ is the cell one row below the current cell, which is exactly the cell a vertical domino would cover. The new bit $0$ is the cell to the right, which is exactly the cell a horizontal domino would cover.

That is the whole geometry. A horizontal placement sets the new bit $0$. A vertical placement sets the new bit $c - 1$. A cell that is already covered, or a blocked cell, sets neither bit and simply advances the belt.

The same picture explains why the state is one row wide and not two. A vertical domino is the only object that crosses a row boundary, and it crosses exactly one row. If the tiles were $1 \times 3$ or L-shaped, a placement could reach further, and the belt would need more than $c$ positions.

## Formal model

Let the grid have $r$ rows and $c$ columns. Write cell $(i, j)$ with $0 \le i < r$ and $0 \le j < c$, and give it the row-major index $k = i c + j$. Let $g_k \in \{0, 1\}$ be the cell type, with $0$ for free and $1$ for blocked.

::: math definition Definition
A **tiling** is a set of dominoes, where a domino is either the pair $\{k, k+1\}$ with $j < c-1$, or the pair $\{k, k+c\}$ with $i < r-1$. The pairs are pairwise disjoint, every pair contains only free cells, and every free cell belongs to exactly one pair. The **count** is the number of distinct tilings.
:::

::: math definition Definition
For $0 \le k \le rc$ and a $c$-bit mask $m$, let $D_k(m)$ be the number of partial tilings of the cells $0, \ldots, k-1$ with the following properties.

- Every free cell before $k$ is covered exactly once, and no blocked cell is covered.
- For every $d$ with $0 \le d < c$ and $k+d < rc$, bit $d$ of $m$ is $1$ exactly when cell $k+d$ is covered by a domino whose other cell is before $k$.
- For every $d$ with $k+d \ge rc$, bit $d$ of $m$ is $0$.
- No domino covers a cell at or beyond $k+c$.
:::

The definition says that $m$ is the complete list of commitments that the past has made into the future window. The partial tiling itself is not stored, because only those commitments can affect what comes next.

::: math invariant Invariant
Before cell $k$, every reachable state $m$ with $D_k(m) > 0$ satisfies the conditions above. In particular, bit $0$ of $m$ says whether the current cell is already covered.
:::

The transition distinguishes the three cases at cell $k$. Let $s = m \gg 1$, the mask with the current bit dropped. The new bit $c-1$ of $s$ is $0$, because cell $k+c$ was outside the old window; it is the cell that enters the window when the belt advances.

::: math recurrence Recurrence
For a blocked cell $g_k = 1$,

$$
D_{k+1}(s) \mathrel{+}= D_k(m) \quad \text{if } m_0 = 0.
$$

For a free cell that is already covered, $g_k = 0$ and $m_0 = 1$,

$$
D_{k+1}(s) \mathrel{+}= D_k(m).
$$

For a free cell that is not covered, $g_k = 0$ and $m_0 = 0$, there are two placements:

$$
D_{k+1}(s + 1) \mathrel{+}= D_k(m)
$$

when $j + 1 < c$, $g_{k+1} = 0$, and $m_1 = 0$; and

$$
D_{k+1}\bigl(s + 2^{c-1}\bigr) \mathrel{+}= D_k(m)
$$

when $i + 1 < r$ and $g_{k+c} = 0$. The base state is $D_0(0) = 1$, and the answer is $D_{rc}(0)$.
:::

The additions are ordinary integer additions, and the two destination masks are different, so a state can receive contributions from several predecessors. The term $s + 1$ is valid because $m_1 = 0$ makes bit $0$ of $s$ zero. The term $s + 2^{c-1}$ is valid because the entering bit is zero before the vertical domino sets it.

The condition $m_1 = 0$ for a horizontal placement is the one that a careless implementation leaves out. Cell $k+1$ may already be covered by a vertical domino from the row above, and a horizontal domino would then overlap it. The vertical placement needs no analogous mask check, because cell $k+c$ is outside the old window and no earlier domino can have reached it. It does need the board check $g_{k+c} = 0$ and the boundary check $i + 1 < r$.

After the last cell, no cell remains to be covered and no commitment may remain, so the only valid mask is $0$. The answer is therefore $D_{rc}(0)$, not the sum of the final table.

## Algorithm derivation

Start from the recursive backtracking search and memoize on the pair $(k, \text{used})$ where `used` is the set of covered cells. The state is correct but too large. Replace `used` by the frontier mask: the previous section shows that the frontier contains every fact about `used` that the future can observe, and the processed prefix is already completely covered. The memoization table becomes an array indexed by $k$ and $m$.

The bottom-up evaluation visits the cells in row-major order, which is the same order as the recursion. At cell $k$, every transition writes to a state for $k+1$. The destination table is separate from the source table, so the update is not in place and there is no direction rule like the descending sweep of [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack). The two arrays are swapped after every cell, and the destination is cleared before the next cell.

The pseudocode is short enough to keep in view.

```python
dp = [0] * (1 << c)
dp[0] = 1

for i in range(r):
    for j in range(c):
        k = i * c + j
        nxt = [0] * (1 << c)
        for mask in range(1 << c):
            ways = dp[mask]
            if ways == 0:
                continue
            base = mask >> 1

            if grid[i][j] == 1:
                if (mask & 1) == 0:
                    nxt[base] += ways
            elif (mask & 1) != 0:
                nxt[base] += ways
            else:
                if j + 1 < c and grid[i][j + 1] == 0 and (mask & 2) == 0:
                    nxt[base | 1] += ways
                if i + 1 < r and grid[i + 1][j] == 0:
                    nxt[base | (1 << (c - 1))] += ways

        dp = nxt

print(dp[0])
```

The order of the three cases matters for readability but not for correctness. The blocked case comes first because a blocked cell is never a placement site. The already-covered case comes next because it is the only case in which the cell consumes a bit without producing one. The free case is the only one that branches.

The two placements are the only ways to cover a free cell that is not already covered. A horizontal domino covering the cell to its left would have been placed at $k-1$, and its bit would be set at position $0$ after the shift. A vertical domino covering the cell above would have been placed at $k-c$, and its bit would have traveled down the mask to position $0$. There is no third placement that covers $k$ and a future cell.

The input handling and the counter type are the only parts that vary between languages. The state machine is identical in all six reference programs.

## Step-by-step execution

Take a $2 \times 3$ board with no blocked cells.

$$
\begin{array}{ccc}
0 & 0 & 0 \\
0 & 0 & 0
\end{array}
$$

The mask has $c = 3$ bits. The table below lists every reachable mask after each cell, in binary, with the number of partial tilings that produce it.

| After cell | Reachable masks and counts   |
| ---------- | ---------------------------- |
| start      | `000`: 1                     |
| $(0,0)$    | `001`: 1, `100`: 1           |
| $(0,1)$    | `000`: 1, `011`: 1, `110`: 1 |
| $(0,2)$    | `001`: 1, `100`: 1, `111`: 1 |
| $(1,0)$    | `000`: 1, `011`: 2           |
| $(1,1)$    | `001`: 3                     |
| $(1,2)$    | `000`: 3                     |

The first cell has two choices. A horizontal domino produces `001`, because the new bit $0$ is the cell $(0,1)$. A vertical domino produces `100`, because the new bit $2$ is the cell $(1,0)$.

At $(0,1)$ the state `001` means the current cell is already covered, so it shifts to `000`. The state `100` is free at the current cell: a horizontal domino gives `011`, and a vertical domino gives `110`. The horizontal placement is allowed because bit $1$ of `100` is $0$, so the target cell $(0,2)$ is not already covered.

At $(0,2)$ the state `000` has no cell to its right, so the only placement is vertical, giving `100`. The state `011` has the current cell covered and shifts to `001`. The state `110` has the current cell free but bit $1$ set, which represents the cell $(1,0)$ covered by the vertical domino from the first row; a horizontal placement is therefore blocked, and the only choice is vertical, giving `111`.

At $(1,0)$ the state `001` shifts to `000`. The state `100` has the current cell free and no bit $1$, so a horizontal domino gives `011`. The state `111` has the current cell covered and shifts to `011`. Two different histories have now reached `011`, so its count is $2$.

At $(1,1)$ the state `000` can only place a horizontal domino, because the last row forbids vertical placements, giving `001`. The state `011` is already covered at the current cell and shifts to `001`, contributing its count of $2$. The total at `001` is $1 + 2 = 3$.

At $(1,2)$ the state `001` is covered and shifts to `000`, so the answer is $3$.

The three tilings are worth naming. One uses three vertical dominoes. One uses two horizontal dominoes over the first two columns and one vertical domino in the last column. One uses one vertical domino in the first column and two horizontal dominoes over the last two columns. The trace has counted exactly these three, with no duplicates from the order in which the placements were made.

A blocked cell changes only one row of the trace. If the center cell $(1,1)$ is blocked, the state that tries to place a domino on it is discarded, and the final count changes accordingly. The next sections prove that this local rule is complete.

## Correctness proof

::: math lemma Lemma
Before cell $k$, the mask $m$ contains every commitment that a domino placed before $k$ has made into the cells $k, \ldots, k+c-1$, and it contains no other information that the future needs.
:::

::: math proof Proof
Let a domino placed at cell $p < k$ cover a cell $q \ge k$. If the domino is horizontal, then $q = p + 1$. Since $p \le k-1$, $q \le k$, and since $q \ge k$, $q = k$. If the domino is vertical, then $q = p + c \le k - 1 + c = k + c - 1$. So every cross-boundary domino lands in the window.

Conversely, every cell in the window that is covered by a domino with its other cell before $k$ is represented by its bit. The processed prefix is fully covered and cannot be touched by a future domino, so its internal arrangement has no effect on any future placement. Two partial tilings with the same mask therefore have the same set of legal continuations. $\square$
:::

::: math lemma Lemma
For every cell $k$ and every mask $m$, the transitions of the recurrence produce exactly the partial tilings of the cells up to $k+1$ that extend the partial tilings counted by $D_k(m)$.
:::

::: math proof Proof
Consider a partial tiling counted by $D_k(m)$ and the cell $k$.

If $k$ is blocked, no domino may cover it. The partial tiling is valid exactly when $m_0 = 0$, and the new mask is $s$ because no new domino is placed.

If $k$ is free and $m_0 = 1$, the cell is already covered by a domino whose other cell is before $k$. No new domino may cover it, so the only extension leaves the placement unchanged and shifts the mask.

If $k$ is free and $m_0 = 0$, the cell is not covered, and it must be covered by a new domino because the sweep will never return to it. A new domino that covers $k$ and a cell after $k$ is either horizontal, covering $k+1$, or vertical, covering $k+c$. These are the only two possibilities. The horizontal case is legal exactly when $k+1$ is inside the row, free, and not already covered, which is the condition $j + 1 < c$, $g_{k+1} = 0$, and $m_1 = 0$. The vertical case is legal exactly when $k+c$ is inside the grid and free, which is $i + 1 < r$ and $g_{k+c} = 0$. The new mask is $s$ with bit $0$ set in the horizontal case, because cell $k+1$ is now covered, and $s$ with bit $c-1$ set in the vertical case, because cell $k+c$ is now covered. No other bits change.

The three cases are disjoint and exhaustive, so every extension is produced once and no invalid extension is produced. $\square$
:::

::: math theorem Theorem
The profile dynamic program computes the number of tilings of the grid.
:::

::: math proof Proof
The proof is an induction on $k$. The base is $D_0(0) = 1$: there are no cells before $0$, no commitments, and exactly one empty partial tiling.

Assume $D_k(m)$ is correct for every $m$. By the transition lemma, each partial tiling counted by $D_k(m)$ extends in exactly the ways described, and each extension is counted once in the destination state. So $D_{k+1}$ is correct for every mask.

After the last cell $k = rc$, there are no cells left, so the only mask with no commitment beyond the board is $0$. Every free cell has been covered by the induction, and no blocked cell has been covered because the blocked case requires $m_0 = 0$ and never places a domino. Therefore $D_{rc}(0)$ is exactly the number of complete tilings. $\square$
:::

The proof does not depend on the order in which the masks are visited, because the destination array is separate from the source array. It also does not depend on the language or on the counter type; those only affect how large a board can be represented.

## Complexity analysis

**Time: $O(rc 2^c)$.** There are $rc$ cells. At each cell the program visits all $2^c$ masks, and each visit performs a constant number of shifts, bit tests, additions, and array writes. The blocked and already-covered cases do one write; the free case does at most two.

**Auxiliary space: $O(2^c)$.** The program keeps two arrays of $2^c$ 64-bit counters, plus the $rc$-cell grid and a few scalars. The grid is the input, and the two arrays are the only state that scales with the mask.

The exponential is in the **width**, not in the area. A $1000 \times 10$ board has $10\,000$ cells but only $2^{10} = 1024$ masks, so the work is about $10^7$ mask visits. A $20 \times 20$ board has only $400$ cells but $2^{20} \approx 1.05 \times 10^6$ masks, so the work is about $4.2 \times 10^8$ mask visits and the two arrays need about 16 MB. The wide board is harder even though it has fewer cells.

If the grid has more rows than columns, the program can transpose it and use the smaller dimension as the profile width. The time becomes $O(rc 2^{\min(r,c)})$ and the space $O(2^{\min(r,c)})$, because the product $rc$ is unchanged by a transpose. The reference programs do not transpose, because the stated bound is $r, c \le 12$; a production solution should transpose whenever $c > r$.

The counter type is part of the complexity in practice. The number of tilings of a full $12 \times 12$ board is $53\,060\,477\,521\,960\,000$, which fits in a signed 64-bit integer but not in 32 bits. The largest full square that fits in a signed 64-bit integer is $12 \times 12$; a $14 \times 14$ board already has more than $10^{21}$ tilings. The reference programs therefore use `long long`, `long`, `Int64`, and `BigInt`. Python is unrestricted. JavaScript needs `BigInt` because $53\,060\,477\,521\,960\,000 > 2^{53} \approx 9.0 \times 10^{15}$.

::: math complexity Complexity
Profile dynamic programming on an $r \times c$ grid: $O(rc 2^c)$ time and $O(2^c)$ auxiliary space, with a 64-bit counter for boards up to $12 \times 12$. The bound is exponential in the number of columns and linear in the number of rows.
:::

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Domino tilings of a grid with $c \le 12$ | The profile DP in this article, with exact 64-bit counters |
| Domino tilings with $c \le 20$ and a long row count | The same DP with a modulus or a wider counter; $2^{20}$ masks is about one million |
| A full rectangle with no blocked cells | A closed-form product for the number of tilings; the profile DP is unnecessary |
| A general planar graph, not a grid | The FKT algorithm counts perfect matchings in polynomial time; profile DP is only for narrow graphs |
| Blocked cells break the rectangle formula | Profile DP, because the blocked cells become part of the input |
| A single loop or a Hamiltonian cycle must be counted | Plug DP, which stores connectivity labels in the mask instead of occupancy bits |
| Monomer tiles are allowed | Add a third transition that covers only the current cell; track the number of monomers if it is fixed |
| A fixed number of one tile type | Add that count to the state, or derive it from the covered area when the other tiles have fixed size |
| The strip is very long and has no blocked cells | Build the row transfer matrix and exponentiate it, or use a linear recurrence |
| A minimum cost rather than a count | Keep the same mask and replace addition with minimum and add the tile cost |
| Three dimensions | A profile over a whole slice; the state is $2^{\text{slice area}}$ and the technique is only practical for tiny slices |
| One layout rather than a count | Backtracking is shorter; the DP can reconstruct by storing a parent per state |

The row "a full rectangle with no blocked cells" is the one that surprises people. The closed-form product is faster, but it only applies to a complete rectangle. As soon as one cell is blocked, the product is gone, and the profile DP is the general tool.

The distinction between profile DP and plug DP is also worth stating plainly. A profile DP records **which** frontier cells are occupied. A plug DP records **how** the occupied cells are connected to one another, because a future tile may need to close a loop or join two components. The state of a plug DP is a sequence of labels, not a bitmask, and its size grows much faster.

## Reference implementations

The manifest publishes one `program` variant in each of the six languages. All six read the same input and print the same output.

| Language   | File                    | Counter     | Input routine                           |
| ---------- | ----------------------- | ----------- | --------------------------------------- |
| C          | `c/program.c`           | `long long` | `scanf` with `%s` for each row          |
| C++17      | `cpp17/program.cpp`     | `long long` | `std::cin` with a `std::string` per row |
| Java       | `java/Main.java`        | `long`      | `BufferedReader` and `StringTokenizer`  |
| Python     | `python/program.py`     | `int`       | `sys.stdin.buffer.read().split()`       |
| Pascal     | `pascal/program.pas`    | `Int64`     | a line reader and a tokenizer           |
| JavaScript | `javascript/program.js` | `BigInt`    | `input.split(/\s+/)`                    |

The input is `r c`, then $r$ rows of $c$ characters. The character `0` is a free cell and `1` is blocked. The output is one line with the count.

The control flow is the same in every file: two arrays of $2^c$ counters, a loop over the $rc$ cells, a loop over the masks, the three cases, and the two placements. The C variant keeps the grid in a flat `unsigned char` array and the profiles in `long long` arrays. The C++ variant uses `std::vector<long long>` and `std::fill`. Java fills a `long[]` and copies it back with `System.arraycopy`. Python uses lists of arbitrary-precision integers. Pascal uses dynamic arrays of `Int64` and reads the whole input a line at a time so that pas2js never needs `IOResult`. JavaScript uses arrays of `BigInt` and prints the result with `toString`.

The three shared fixtures are a $2 \times 4$ board with five tilings, a $3 \times 3$ board with the center blocked and two tilings, and a $1 \times 1$ free cell with no tiling. The last case is the smallest instance on which the answer is zero: the cell is free, but there is no cell to its right and no cell below it, so neither placement is legal.

## Recursion decision

The recursive form of the same DP is a function of $(k, \text{mask})$. The listing omits the memo table so that the recurrence stays visible; adding the table makes it the same dynamic program, and the depth is the same either way. It is useful for understanding and unnecessary for shipping.

```python
def solve(k, mask):
    if k == r * c:
        return 1 if mask == 0 else 0
    i, j = divmod(k, c)
    base = mask >> 1
    if grid[i][j] == 1:
        return solve(k + 1, base) if (mask & 1) == 0 else 0
    if (mask & 1) != 0:
        return solve(k + 1, base)
    total = 0
    if j + 1 < c and grid[i][j + 1] == 0 and (mask & 2) == 0:
        total += solve(k + 1, base | 1)
    if i + 1 < r and grid[i + 1][j] == 0:
        total += solve(k + 1, base | (1 << (c - 1)))
    return total
```

The recursion depth is at most $rc$, which is $144$ on the largest board in the stated range. That is inside every language's default stack, so the recursive form does not crash here. The iterative form is still the better default: it is shorter, it avoids the call overhead, it has no stack limit to reason about, and it is exactly the form the correctness proof describes.

The depth matters when the board is long in the row direction. A $1000 \times 10$ board has $10\,000$ cells, and a recursive implementation would need $10\,000$ frames. Python's default recursion limit is $1000$, so the recursive form fails on exactly the shape that the technique is meant to handle. The iterative sweep does not care.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; the loop is shorter |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; a long strip exceeds it |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative |

A second recursion appears in the row-by-row version, where a helper fills one row and recurses on the column. That helper is only $c$ frames deep, so it is safe, but the cell-by-cell formulation avoids it entirely.

## Implementation walkthrough

Three ideas carry the whole program.

**The mask is a window, not a row.** Bit $0$ is always the current cell, whatever its column. Bit $1$ is the cell immediately after it in row-major order. When the current cell is the last column of a row, bit $1$ is the first cell of the next row, not a cell outside the board. The shift handles the wrap automatically.

**The shift is the only bookkeeping.** After deciding the current cell, every old bit moves down by one position. Whatever was bit $d$ becomes bit $d-1$. The new bit $c-1$ is the cell one row below the current cell, and the new bit $0$ is the cell to the right. The code never has to know the column of a bit; it only has to set the correct end of the shifted mask.

**The three cases are ordered by what they do to the cell.** A blocked cell produces no placement and requires bit $0$ to be clear. An already-covered cell produces no placement and requires bit $0$ to be set. A free, uncovered cell produces exactly one placement. If the code reaches the end of the loop without placing anything on a free cell, the state is simply dropped.

The C++ core is small enough to read as a unit.

```cpp
const int base = mask >> 1;

if (grid[i][j] == '1') {
    if ((mask & 1) == 0) {
        next[base] += ways;
    }
} else if ((mask & 1) != 0) {
    next[base] += ways;
} else {
    if (j + 1 < c && grid[i][j + 1] == '0' && (mask & 2) == 0) {
        next[base | 1] += ways;
    }
    if (i + 1 < r && grid[i + 1][j] == '0') {
        next[base | (1 << (c - 1))] += ways;
    }
}
```

The horizontal branch checks three things: there is a cell to the right, that cell is free, and that cell is not already covered. The last check is `(mask & 2) == 0`. The $2 \times 2$ counterexample in the next section omits this check, and the difference is a correct count against an overcount.

The vertical branch checks two things: there is a row below, and the cell below is free. It does not check whether the cell below is already covered, because that cell is outside the current window and no earlier domino could have reached it. The bit is set in the new mask at position $c-1$, which is where the cell below will be when the belt advances.

The destination array is cleared before each cell, not once per row and not once per program. A state that was reachable after cell $k-1$ is not automatically reachable after cell $k$, and stale counts would be added to the new cell's transitions.

The answer is `dp[0]`, not the maximum or the sum of the final array. After the last cell there is no future cell to cover, so a nonzero mask would describe a commitment to a cell outside the board. The vertical branch already forbids such a commitment on the last row, and the horizontal branch cannot leave the row, so the final array has all of its mass in state $0$.

Two edge cases are worth testing by hand. A $1 \times 1$ free cell has no horizontal placement (there is no column to the right) and no vertical placement (there is no row below), so the answer is $0$. A $1 \times 1$ blocked cell has no free cell to cover, and the blocked branch passes the empty mask through, so the answer is $1$: the empty tiling is the unique tiling of a board with nothing to cover.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Treating bit $0$ as column $0$ instead of the current cell | The mask is shifted into the wrong position and the count is wrong | Remember that the mask is a window that moves with the sweep |
| Forgetting to shift the mask | The current cell is processed again and the profile never advances | Compute `base = mask >> 1` before every placement |
| Placing a horizontal domino without checking bit $1$ | The domino overlaps a vertical domino from the row above, so the answer is too large | Require `(mask & 2) == 0` before setting bit $0$ |
| Letting a horizontal domino cross the last column | The pair wraps to the next row and is not a domino | Require `j + 1 < c` |
| Letting a vertical domino leave the last row | The state commits to a cell outside the board | Require `i + 1 < r` |
| Clearing the destination array once instead of per cell | Counts from an earlier cell survive and are added again | Clear `next` at the start of every cell |
| Using 32-bit counters | The answer is silently truncated on boards such as $10 \times 11$ and larger | Use 64 bits, a modulus, or BigInt |
| Using a JavaScript `Number` for a $12 \times 12$ board | Counts above $2^{53}$ are rounded | Use `BigInt` |
| Printing the sum of the final array | If vertical placements on the last row are allowed, partial tilings that stick out of the board are included | Print `dp[0]` |
| Inverting the meaning of $0$ and $1$ | Free cells are treated as blocked and the answer is usually zero | State the convention once and use it everywhere |
| Transposing the grid but not the blocked cells | The profile width is right but the board is wrong | Transpose the grid values, not just the dimensions |
| Allowing a vertical domino on the last row and then taking `dp[0]` | The invalid states stay in the table and are excluded only by reading `dp[0]`; the program no longer represents tilings of the board | Forbid vertical placements on the last row |

### Why this fails: the horizontal domino that lands on a covered cell

The mistake that survives review most often is the missing `(mask & 2) == 0` test. The smallest board that exposes it is $2 \times 2$ with the top-left cell blocked.

$$
\begin{array}{cc}
1 & 0 \\
0 & 0
\end{array}
$$

The correct answer is $0$. The cell $(0,1)$ is free and has no cell to its right, so it must be covered by a vertical domino that also covers $(1,1)$. That leaves $(1,0)$ free, with no cell to its right that is free and no row below, so no tiling exists.

The correct trace is short.

- At $(0,0)$ the cell is blocked, the mask is `00`, and the blocked branch shifts to `00`.
- At $(0,1)$ the cell is free and uncovered. A horizontal placement is impossible because there is no column to the right. A vertical placement gives mask `10`, where bit $1$ represents $(1,1)$.
- At $(1,0)$ the cell is free and uncovered. The mask is `10`, so bit $1$ is set. A horizontal placement would cover $(1,0)$ and $(1,1)$, but $(1,1)$ is already covered by the vertical domino. The check `(mask & 2) == 0` fails, and no placement is made.
- The destination table is empty, and the final answer is $0$.

A program that omits the check takes the horizontal branch at $(1,0)$. The new mask is `01`, then at $(1,1)$ the bit $0$ is set and shifts to `00`. The program prints $1$, counting a layout in which $(1,1)$ is covered twice.

The general rule is worth memorizing: **a free cell may only be covered by a new domino if the target cell is not already represented in the mask.** For a horizontal domino the target is bit $1$. For a vertical domino the target is outside the window, so the mask cannot represent it; that is why the vertical case needs no bit check, only a board check.

## Variants and extensions

- **Transpose the board.** If $c > r$, swap the dimensions and the grid values. The profile width becomes $\min(r, c)$, and the time becomes $O(rc 2^{\min(r,c)})$. This is the first optimization to apply when the input allows a long, narrow board in either orientation.
- **Count modulo a prime.** Add `% MOD` after every addition and store the counters in 32-bit or 64-bit integers. The state machine is unchanged, and the board can be $1000 \times 10$ instead of $12 \times 12$. The CSES "Counting Tilings" problem is exactly this variant.
- **Allow $1 \times 1$ monomers.** At a free, uncovered cell, add a third transition that covers only the current cell: the new mask is `base`, with neither end bit set. If the number of monomers is fixed, add that count to the state; if it is not, the transition counts every mixture.
- **Use a straight row profile.** Instead of moving the window one cell at a time, keep the mask of vertical commitments into the next row and generate all compatible next masks for a whole row with a depth-first search. The state is still $2^c$, but the transition is a precomputed table. This is faster in practice for wide boards and harder to prove correct.
- **Exponentiate the row transfer.** For a fixed width and no blocked cells, the row-to-row transition is a $2^c \times 2^c$ matrix. Matrix exponentiation handles a strip with $10^{18}$ rows in $O(2^{3c} \log r)$ time, or faster with sparse matrices. This is the bridge between profile DP and transfer-matrix methods.
- **Track connectivity with plug DP.** When the tiling must form one loop, one path, or a connected region, an occupancy bit is not enough. Each frontier cell needs a label that says which component it belongs to, and the state becomes a sequence of labels. The technique is the same sweep with a richer frontier.
- **Reconstruct one layout.** Store a parent pointer or a choice bit for every `(cell, mask)` state, then walk backward from $(rc, 0)$. The memory becomes $O(rc2^c)$; if that is too much, recompute the DP backward from the end and choose the first legal predecessor.
- **Minimize a cost.** Replace the count with a minimum, initialize unreachable states to a large sentinel, and add the cost of each placed domino. The frontier and the transitions do not change.
- **Handle longer tiles.** A $1 \times 3$ vertical tile reaches $k + 2c$, so a one-row window is not enough. Either keep two rows of bits or process the board in a different order. The same issue appears with L-shaped trominoes, which can reach one row and one column ahead.
- **Add colors or orientations.** If cells have colors and a domino must match them, the transition checks the colors of both cells. If the domino has orientations that are distinguishable, multiply by the number of valid orientations at placement time, or add a bit for the orientation.

## Contest strategy

Under contest pressure, the profile DP is easy to write and easy to get subtly wrong. A fixed procedure prevents most of the errors.

1. Read the dimensions and decide which one is the profile width. If the number of columns is larger than the number of rows, transpose the grid before doing anything else.
2. Write the bit meaning down: bit $0$ is the current cell, bit $1$ is the cell to its right, and the new bit $c-1$ is the cell below. Do not start coding until this sentence is fixed.
3. Write the three cases in order: blocked, already covered, free and uncovered. The first two only shift; the third branches.
4. Write the horizontal conditions as a checklist: `j + 1 < c`, target free, `(mask & 2) == 0`. Write the vertical conditions as `i + 1 < r`, target free.
5. Decide the counter type from the maximum answer. For $12 \times 12$ use 64 bits; for JavaScript use `BigInt`; for a long strip with a modulus, reduce after every addition.
6. Test four boards by hand: $1 \times 1$ free (answer $0$), $1 \times 1$ blocked (answer $1$), $1 \times 2$ free (answer $1$), and $2 \times 2$ free (answer $2$). Then test the $2 \times 2$ board with the top-left cell blocked, which must answer $0$.
7. Differential-test against the backtracking baseline on random boards up to $4 \times 4$. The baseline is short enough to write in five minutes, and it catches the missing bit check immediately.
8. If $2^c$ is too large, do not micro-optimize the inner loop. Change the formulation: transpose, use a closed form, exponentiate a transfer matrix, or move to plug DP.

The $2 \times N$ case has a useful closed form for testing: the number of tilings is the Fibonacci number $F_{N+1}$, with $F_1 = F_2 = 1$. The sequence is $1, 2, 3, 5, 8, 13, \ldots$ for $N = 1, 2, 3, 4, 5, 6$. A profile program that disagrees with this sequence on a $2 \times N$ board has a bug in the horizontal or vertical transition, not in the input parser.

## Worked problems

### Problem 1: Counting Tilings

**Restatement.** Count the tilings of an $n \times m$ grid with $1 \times 2$ and $2 \times 1$ tiles, modulo $10^9+7$. Constraints: $1 \le n \le 10$ and $1 \le m \le 1000$. The sample $4 \times 7$ board has $781$ tilings.

**Naive baseline.** Backtracking over the cells. At $m = 1000$ the board has up to $10\,000$ cells, and the search tree is astronomical.

**Insight.** The short side is at most $10$, so a profile of $10$ bits has only $1024$ states. The long side contributes a linear factor, not an exponential one.

**Derivation.** Run the cell-by-cell DP with $c = n$. At each addition, reduce modulo $10^9+7$. If $n > m$, transpose the board so that the profile width is the smaller dimension. The answer is the state with mask $0$ after the last cell.

**Correctness.** The grid is the all-free special case of the formal model, and the modulo is applied to every addition, so the invariant and the induction are unchanged.

**Complexity.** $O(nm2^{\min(n,m)})$ time and $O(2^{\min(n,m)})$ space. At the maximum, $10 \cdot 1000 \cdot 1024 \approx 1.02 \times 10^7$ mask visits, which is comfortable for a one-second limit.

**Common wrong approach.** Using $m$ as the profile width. The mask then has up to $1000$ bits, and the table has $2^{1000}$ entries. The transpose is not an optimization here; it is the difference between a solution and no solution.

### Problem 2: Mondriaan's Dream

**Restatement.** Count the tilings of an $h \times w$ rectangle with $2 \times 1$ dominoes, for several test cases with $1 \le h, w \le 11$, terminated by `0 0`. The sample includes $2 \times 11$ with $144$ tilings and $4 \times 11$ with $51205$.

**Naive baseline.** Backtracking over the rectangle. At $11 \times 11$ the search is too large even though the board looks small.

**Insight.** The width is at most $11$, so $2^{11} = 2048$ masks. The height is also at most $11$, so the whole table is tiny. The only difficulty is processing several test cases and using a counter that does not overflow.

**Derivation.** For each test case, build an all-free grid of the given dimensions and run the profile DP. The answer is `dp[0]`. The largest nonzero count for $h, w \le 11$ is $3\,852\,472\,573\,499$ on a $10 \times 11$ board, which fits in a 64-bit integer but not in 32 bits. An $11 \times 11$ board has an odd number of cells and the answer is $0$, although the partial states along the way are larger than the final counts of the even boards.

**Correctness.** The formal model applies with no blocked cells. The multiple test cases are independent, and the state is reset for each one.

**Complexity.** $O(hw2^{\min(h,w)})$ time and $O(2^{\min(h,w)})$ space per test case. At $11 \times 11$ that is at most $121 \cdot 2048 \approx 2.48 \times 10^5$ mask visits, which is trivial.

**Common wrong approach.** Using a 32-bit counter. The $10 \times 11$ answer is about $3.85 \times 10^{12}$, which is well beyond the 32-bit range, and the program prints a truncated number with no error.

### Problem 3: Hanjo

**Restatement.** A room is $H$ meters by $W$ meters. Cover it with exactly $A$ mats of size $2 \times 1$ and exactly $B$ mats of size $1 \times 1$, where $2A + B = HW$ and $HW \le 16$. The $2 \times 1$ mats may be horizontal or vertical, and rotations and reflections count as different layouts. The sample $2 \times 2$ room with $A = 1$ and $B = 2$ has $4$ layouts, and the $4 \times 4$ room with $A = 8$ and $B = 0$ has $36$.

**Naive baseline.** Backtracking over the cells with a count of the $2 \times 1$ mats used. The area is at most $16$, so backtracking is actually feasible here, but the profile DP is the systematic version and scales to a longer strip.

**Insight.** A $1 \times 1$ mat is a monomer: at a free, uncovered cell it covers only the current cell and sets no bit in the mask. The number of $2 \times 1$ mats is fixed, so the state must also carry how many have been placed, or track the number of monomers and derive the rectangular count from $2A + B = HW$.

**Derivation.** Add a third choice at a free, uncovered cell: place a monomer, which advances the mask as `base` with no new bit. Add a dimension `a` to the state for the number of $2 \times 1$ mats placed so far, or track the number of monomers and use $2A + B = HW$. At the end, accept only the states with exactly $A$ rectangular mats. Transpose the room so that the profile width is $\min(H, W)$.

**Correctness.** The transition lemma is extended by one disjoint case: a monomer covers the current cell and no future cell. The induction is otherwise unchanged, and the final filter selects exactly the layouts with the required number of rectangular mats.

**Complexity.** $O(HW \cdot 2^{\min(H,W)} \cdot A)$ time and $O(2^{\min(H,W)} \cdot A)$ space. With $HW \le 16$ and $\min(H,W) \le 4$, the number of state visits is at most $16 \cdot 16 \cdot 8 = 2048$.

**Common wrong approach.** Counting every tiling with any number of $2 \times 1$ mats and then reporting the sum. The answer is too large, because layouts with fewer or more rectangular mats are included. The count of rectangular mats is part of the question, so it has to be part of the state or derived from a fixed total.

## Practice progression

1. **Recognition.** Given a tiling statement, decide whether the width is small enough for a profile DP. Look for a grid, small tiles, a count, and a dimension at most about twenty.
2. **Direct application.** Implement the all-free $r \times c$ version and check it against the Fibonacci sequence on $2 \times N$ boards and against a backtracking search on random $3 \times 3$ and $4 \times 4$ boards.
3. **Adaptation.** Add blocked cells, then add a $1 \times 1$ monomer transition, then add a modulus. Each change is local to one branch of the transition.
4. **Combination.** Transpose the grid so that the profile is the shorter side; run several test cases in one program; reconstruct one tiling from the DP table.
5. **Challenge.** Solve the $1000 \times 10$ modulo version of Counting Tilings, then the fixed-$A$ version of Hanjo, and explain why the state grows by a factor of $A$ in the second one.
6. **Transfer.** Recognize the same frontier in a different problem: a Hamiltonian path on a grid (plug DP), a spanning tree count on a narrow graph (connectivity states), or a three-dimensional tiling (a slice-sized mask).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does bit $d$ of the mask mean before cell $k$? (Formal model)
2. Why do $c$ bits suffice, and why can a domino not reach beyond $k+c-1$? (Key insight)
3. What are the three cases at a cell, and which of them branch? (Algorithm derivation)
4. What is the new mask after a horizontal placement, and after a vertical one? (Formal model)
5. Why must a horizontal placement check bit $1$, while a vertical placement does not? (Common mistakes)
6. What is the smallest board on which the missing bit check changes the answer, and what does the buggy program print? (Common mistakes)
7. Why is the answer `dp[0]` rather than the sum of the final array? (Correctness proof)
8. Why is the algorithm exponential in the width rather than in the area? (Complexity analysis)
9. What is the largest count on a $12 \times 12$ board, and which language needs `BigInt`? (Complexity analysis)
10. Why does a blocked cell require bit $0$ to be clear? (Formal model)
11. How does a $1 \times 1$ mat change the transition, and how does a fixed count of $2 \times 1$ mats change the state? (Variants and extensions)
12. When is a closed-form product or the FKT algorithm a better choice than profile DP? (Algorithm selection)
13. Why should the grid be transposed when the number of columns is larger than the number of rows? (Complexity analysis)

## Further reading

- The bit-level operations used throughout, including shifts, masks, and the meaning of the low bit, are covered in [binary representation](/algorithms/foundations/binary-representation).
- The general technique of making a set the state of a dynamic program is [bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp); profile DP is the special case in which the set is a sliding window.
- The one-dimensional table of [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) is a different kind of compression: it drops a row of the table, while profile DP drops the entire processed region except its frontier.
- The interval state of [interval dynamic programming](/algorithms/dynamic-programming/interval-dp) is a useful contrast: it remembers a contiguous range, while profile DP remembers a boundary.
- The layered graph view of [DAG dynamic programming](/algorithms/dynamic-programming/dag-dp) explains why the mask states form a directed acyclic graph and why the bottom-up order is a topological order.
- The backtracking baseline in this article is an instance of the search patterns in [recursion](/algorithms/foundations/recursion); the profile DP is what remains after the search is memoized and the state is minimized.
- The frontier is a separator in the grid graph. The representation of graphs by their edges and vertices is reviewed in [graph representation](/algorithms/graphs/representation), and the same separator idea appears in treewidth-based algorithms.
