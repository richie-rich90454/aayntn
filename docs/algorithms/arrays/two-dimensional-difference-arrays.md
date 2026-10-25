---
id: arrays.two-dimensional-difference-arrays
title: Two-dimensional difference arrays
summary: Turn a rectangle update on a grid into four corner writes, and recover the final grid with one two-dimensional prefix sum.
division: [silver, gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords:
    [
        two dimensional difference array,
        2d difference array,
        rectangle update,
        range update on a grid,
        corner markers,
        two dimensional prefix sum,
        imos,
    ]
prerequisites:
    required: [arrays.difference-arrays, arrays.two-dimensional-prefix-sums, foundations.complexity]
    recommended: [arrays.coordinate-compression, range-queries.fenwick-tree]
complexity:
    time: "O(RC + q)"
    space: "O(RC)"
assumptions:
    - Every update adds a constant to every cell of an axis-aligned rectangle.
    - The grid is read after all the updates, or the reads can be moved after them.
implementations: arrays.two-dimensional-difference-arrays
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/arrays.two-dimensional-difference-arrays.json";
</script>

## At a glance

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

A two-dimensional difference array is the inverse of a two-dimensional prefix sum, in the same way that a one-dimensional difference array is the inverse of a one-dimensional prefix sum. The grid is stored as the mixed differences between neighboring cells, so that adding a constant to a rectangle touches only four entries: the top-left corner, the two cells just past the right and bottom edges, and the cell diagonally past the bottom-right corner.

Each rectangle update then costs $O(1)$, and one two-dimensional prefix-sum pass at the end recovers the whole grid. A run with an $R \times C$ grid and $q$ updates costs $O(RC + q)$ time and $O(RC)$ space, against $O(RCq)$ for applying every update to every cell.

The technique has the same precondition as its one-dimensional version, and the precondition is the part that decides whether it applies at all: the updates must be **range additions of a constant**, and the values must be **read after the updates**. When reads and updates interleave, the structure to reach for is a two-dimensional Fenwick tree, not this one.

The construction is often called **two-dimensional imos** in Japanese contest material, and the four writes are the same inclusion-exclusion pattern that a two-dimensional prefix sum uses for queries, read backwards.

## Problem motivation

A city is divided into a grid of $R$ rows and $C$ columns of identical blocks. A snowplow makes $q$ passes. Each pass adds a fixed depth of snow to every block inside an axis-aligned rectangle, and after all the passes the city wants the snow depth of every block.

The constraints:

- $1 \le R, C \le 2000$, so the grid holds at most four million cells.
- $1 \le q \le 200\,000$ passes.
- Each pass adds a value between $-10^6$ and $10^6$, so a cell can reach $2 \cdot 10^{11}$ in magnitude.
- Every block is read once, after the last pass.

The naive answer applies each pass to every cell of its rectangle, at a cost of $O(RCq) = 8 \cdot 10^{11}$ additions in the worst case. Even a program that spends one nanosecond per addition would need more than ten minutes.

A better naive answer keeps one difference array per row. A rectangle that covers $h$ rows then costs $h$ row updates, so the total is $O(qR) = 4 \cdot 10^8$ and the program is still too slow in the worst case, because a rectangle can cover every row.

The answer that works is the two-dimensional version of the difference array: four writes per pass, and one pass over the grid at the end. The total is $O(RC + q) = 4.2 \cdot 10^6$ operations.

Notice what the statement is doing for the technique. The update is a **constant added to a rectangle**, which is the only kind of update a difference array handles cheaply. The reads happen **after** all the updates. If the statement asked for the depth of a cell between two passes, the four writes would not be enough, because the cells would have to be reconstructed before every read.

## Recognition patterns

A two-dimensional difference array is the right tool when all of the following hold.

- The data is a **grid** or a **matrix**.
- Each update is an **axis-aligned rectangle** and adds a **constant** to every cell inside it.
- The grid is **read after** the updates, or the reads can be reordered after them.
- The number of updated cells, summed over all updates, is much larger than the number of cells in the grid.

The phrases that signal it are "add $v$ to every cell in the rectangle", "paint the rectangle", "increment the sub-grid", and "after all the operations, print the grid". The phrase that rules it out is "after each operation, report the value at a cell", because that interleaves recovery with updates.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Every update adds a constant to a rectangle | Rules in the four-write update |
| An update sets a rectangle to a value | Rules out the four-write update; keep more state or use a segment tree |
| The grid is read only at the end | Rules in the single final prefix pass |
| Cells are read after every update | Rules out the difference array; use a two-dimensional Fenwick tree |
| $q = 1$ | Four writes are still fine, but a direct paint costs the same order as building the grid |
| $q \ge RC$ | The difference array is clearly worth it |
| $R \cdot C \ge 10^7$ | The difference array alone costs 80 MB or more; check the memory limit |
| The update is a triangle or a circle | Rules out the four-corner pattern; use a sweep line or a different decomposition |
| The quantity is a maximum or a minimum | Rules out the technique; it relies on addition and subtraction |

The last two rows are the important limits. A difference array is a statement about **addition**, not about arbitrary assignments, and the four-corner pattern is special to **rectangles**, not to arbitrary shapes.

<Synonyms terms="two-dimensional difference array, 2D difference array, 2D imos, rectangle update, corner markers" />

## Naive approach

The baseline applies every update to every cell of its rectangle.

```python
for r1, c1, r2, c2, value in updates:
    for r in range(r1 - 1, r2):
        for c in range(c1 - 1, c2):
            grid[r][c] += value
```

This is $O(RCq)$ and it is correct for every input. It is the reference implementation for the differential test: if a faster version disagrees with it on a random small grid, one of the two is wrong.

A second baseline keeps a one-dimensional difference array per row. For each update, it writes two markers in every row the rectangle covers.

```python
for r1, c1, r2, c2, value in updates:
    for r in range(r1 - 1, r2):
        row_diff[r][c1 - 1] += value
        row_diff[r][c2] -= value
```

This is $O(qR)$ and it is already much better than the cell-by-cell paint. It is still not good enough when the rectangles are tall, because the number of rows a rectangle covers is not bounded by a constant.

The two-dimensional difference array removes the remaining factor of $R$: the update becomes four writes, independent of the height and the width of the rectangle.

## Key insight

The insight is that the four-corner pattern is the two-dimensional version of "a range update is two writes", applied once per axis.

Start with the one-dimensional fact. For an array $a_1, \ldots, a_n$, the difference array is

$$
d_i = a_i - a_{i-1} \qquad \text{with } a_0 = 0.
$$

Adding $v$ to the range $[l, r]$ changes only $d_l$ by $+v$ and $d_{r+1}$ by $-v$. The differences strictly inside the range do not move, because both of their endpoints grow by the same $v$.

Now do the same thing along the rows, and then along the columns. The order does not matter, and the result is the **mixed second difference**

$$
D[i][j] = A[i][j] - A[i-1][j] - A[i][j-1] + A[i-1][j-1],
$$

with $A[0][j] = A[i][0] = A[0][0] = 0$. The grid $A$ is recovered from $D$ by a two-dimensional prefix sum:

$$
A[i][j] = \sum_{x=1}^{i} \sum_{y=1}^{j} D[x][y].
$$

That identity is the whole technique. The array $D$ is a faithful description of $A$, and the description is local: only cells near the boundaries of a rectangle change when the rectangle is updated.

For a rectangle $[r_1, r_2] \times [c_1, c_2]$, the indicator of the rectangle is the product of the indicator of the row interval and the indicator of the column interval. Its mixed difference is the product of the two one-dimensional differences, which has four nonzero entries:

$$
\begin{aligned}
D[r_1][c_1] &\mathrel{+}= v, \\
D[r_2+1][c_1] &\mathrel{-}= v, \\
D[r_1][c_2+1] &\mathrel{-}= v, \\
D[r_2+1][c_2+1] &\mathrel{+}= v.
\end{aligned}
$$

The signs are the signs of a product: $+$ at the top-left corner, $-$ at the two cells just past the edges, and $+$ again where the two negative markers overlap. The add-back is the same inclusion-exclusion term that appears in a two-dimensional prefix-sum query, and it is the term that people forget.

The four writes are $O(1)$ no matter how large the rectangle is. That is the entire gain.

## Visual intuition

Picture a $5 \times 5$ grid and a rectangle from row 2 to row 3 and from column 2 to column 3. In the difference array, only four cells are marked.

```text
      c=1  c=2  c=3  c=4  c=5
r=1    0    0    0    0    0
r=2    0   +v    0   -v    0
r=3    0    0    0    0    0
r=4    0   -v    0   +v    0
r=5    0    0    0    0    0
```

The top-left marker starts the addition. The marker just past the right edge cancels it for the columns to the right, and the marker just past the bottom edge cancels it for the rows below. The bottom-right marker cancels the second cancellation, so the region below and to the right of the rectangle returns to zero.

The recovery pass is easiest to see as two one-dimensional passes:

1. A **horizontal prefix sum** in every row turns the vertical markers into horizontal intervals.
2. A **vertical prefix sum** in every column then turns those intervals into the full rectangle.

Doing the passes in the other order works too, and so does the single two-dimensional recurrence. What matters is that both directions are accumulated.

```text
difference markers          after horizontal pass        after vertical pass
0  0  0  0  0               0  0  0  0  0                0  0  0  0  0
0  +  0  -  0               0  +  +  0  0                0  +  +  0  0
0  0  0  0  0               0  0  0  0  0                0  +  +  0  0
0  -  0  +  0               0  -  -  0  0                0  0  0  0  0
```

The final picture is the rectangle of value $v$ and zero everywhere else. That is exactly the update that was requested.

## Formal model

Let $A$ be an $R \times C$ grid, indexed from one, and extend it with a zero row at index $0$ and a zero column at index $0$.

::: math definition Definition
The **two-dimensional difference array** of $A$ is the $(R+1) \times (C+1)$ grid $D$ with

$$
D[i][j] = A[i][j] - A[i-1][j] - A[i][j-1] + A[i-1][j-1]
$$

for $1 \le i \le R$ and $1 \le j \le C$, and $D[i][j] = 0$ when $i = 0$ or $j = 0$.
:::

::: math definition Definition
A **rectangle update** is a tuple $(r_1, c_1, r_2, c_2, v)$ with $1 \le r_1 \le r_2 \le R$ and $1 \le c_1 \le c_2 \le C$. It adds $v$ to every cell $A[r][c]$ with $r_1 \le r \le r_2$ and $c_1 \le c \le c_2$.
:::

::: math lemma Lemma
If $D$ is the two-dimensional difference array of $A$, then for every $1 \le i \le R$ and $1 \le j \le C$,

$$
A[i][j] = \sum_{x=1}^{i} \sum_{y=1}^{j} D[x][y].
$$
:::

::: math lemma Lemma
Applying the rectangle update $(r_1, c_1, r_2, c_2, v)$ to $A$ changes exactly four entries of $D$:

$$
D[r_1][c_1] \mathrel{+}= v, \quad
D[r_2+1][c_1] \mathrel{-}= v, \quad
D[r_1][c_2+1] \mathrel{-}= v, \quad
D[r_2+1][c_2+1] \mathrel{+}= v.
$$

Every other entry of $D$ is unchanged.
:::

::: math recurrence Recurrence
The values are recovered by the in-place two-dimensional prefix sum

$$
D[i][j] \gets D[i][j] + D[i-1][j] + D[i][j-1] - D[i-1][j-1]
$$

for $i = 1, \ldots, R$ and $j = 1, \ldots, C$, in increasing order of both indices. After the recurrence, $D[i][j]$ holds $A[i][j]$.
:::

::: math theorem Theorem
Let $A$ start as any grid. Build its difference array $D$, apply a sequence of rectangle updates by the four-write rule, and recover the grid by the two-dimensional prefix sum. The recovered grid equals the grid that the same updates would produce if every one of them were applied cell by cell.
:::

The extra row at index $R + 1$ and the extra column at index $C + 1$ are part of the model. An update whose rectangle touches the last row writes to $D[R+1][c_1]$, and an update whose rectangle touches the last column writes to $D[r_1][C+1]$. Those entries are never printed, but they are what makes the rule uniform: without them, every update on a border would need a special case.

## Algorithm derivation

The state is the difference array $D$ with $R + 2$ rows and $C + 2$ columns, indexed from zero. The two extra rows and columns are padding: they let the four writes use $r_2 + 1$ and $c_2 + 1$ without a bounds check, and the recovery pass stops at $R$ and $C$.

The construction has two cases.

**The grid starts at zero.** Every entry of $D$ starts at zero. For each update, perform the four writes. At the end, run the two-dimensional prefix sum, and the entries $D[1..R][1..C]$ are the final values.

**The grid starts with given values.** Read the values into $D$, then convert them to differences. The conversion can be done in place with two one-dimensional passes:

1. For each row, replace every entry by its difference from the previous entry in the same row.
2. For each column, replace every entry by its difference from the previous entry in the same column.

After the row pass, $D[i][j]$ holds $A[i][j] - A[i][j-1]$. After the column pass, it holds the mixed difference. The order of the two passes can be swapped, but when both run in place the directions matter: the row pass goes left to right, and the column pass goes **bottom to top**, so each row's row-difference is used before it is overwritten by its mixed difference.

The update rule is the four writes above. It is correct because the mixed difference of a rectangle's indicator is supported on exactly those four cells, and because differentiation is linear: the difference of a sum of rectangles is the sum of their differences.

The recovery rule is the two-dimensional prefix sum. The recurrence

$$
D[i][j] \gets D[i][j] + D[i-1][j] + D[i][j-1] - D[i-1][j-1]
$$

is inclusion-exclusion: the rectangle ending at $(i,j)$ is the union of the rectangle ending at $(i-1,j)$ and the rectangle ending at $(i,j-1)$, with the overlap counted twice, plus the cell $(i,j)$ itself.

::: math invariant Invariant
After any number of rectangle updates, the two-dimensional prefix sum of $D$ over the rectangle $[1, i] \times [1, j]$ equals the value that the direct cell-by-cell application of those updates would place at $(i, j)$.
:::

The invariant is the reason the technique works, and it is worth stating in this form rather than as a statement about the four writes. The writes are only the mechanism; the invariant is the correctness condition.

## Step-by-step execution

Take a $3 \times 4$ grid of zeros, so the initial difference array is also all zeros. Apply two updates:

- Update 1: add $5$ to rows $1$ through $2$ and columns $1$ through $2$.
- Update 2: add $-3$ to rows $2$ through $3$ and columns $3$ through $4$.

**Update 1.** The four writes are $(1,1) \gets +5$, $(3,1) \gets -5$, $(1,3) \gets -5$, and $(3,3) \gets +5$.

$$
D = \begin{bmatrix}
5 & 0 & -5 & 0 & 0 \\
0 & 0 & 0 & 0 & 0 \\
-5 & 0 & 5 & 0 & 0 \\
0 & 0 & 0 & 0 & 0
\end{bmatrix}
$$

**Update 2.** The four writes are $(2,3) \gets -3$, $(4,3) \gets +3$, $(2,5) \gets +3$, and $(4,5) \gets -3$. The last two are in the padding column, which is fine.

$$
D = \begin{bmatrix}
5 & 0 & -5 & 0 & 0 \\
0 & 0 & -3 & 0 & 3 \\
-5 & 0 & 5 & 0 & 0 \\
0 & 0 & 3 & 0 & -3
\end{bmatrix}
$$

**Recovery, horizontal pass.** Add each cell to the cell on its left, within every row, over columns $1$ through $4$.

$$
D = \begin{bmatrix}
5 & 5 & 0 & 0 & 0 \\
0 & 0 & -3 & -3 & 0 \\
-5 & -5 & 0 & 0 & 0 \\
0 & 0 & 3 & 3 & 0
\end{bmatrix}
$$

**Recovery, vertical pass.** Add each cell to the cell above it, within every column, over rows $1$ through $3$.

$$
D = \begin{bmatrix}
5 & 5 & 0 & 0 & 0 \\
5 & 5 & -3 & -3 & 0 \\
0 & 0 & -3 & -3 & 0 \\
0 & 0 & 0 & 0 & 0
\end{bmatrix}
$$

The printed grid is the top-left $3 \times 4$ block:

```text
5  5  0  0
5  5 -3 -3
0  0 -3 -3
```

Check it directly. The top-left $2 \times 2$ block received $+5$. The bottom-right $2 \times 2$ block received $-3$. The cell $(2,1)$ is inside the first rectangle only, so it is $5$. The cell $(2,3)$ is inside the second rectangle only, so it is $-3$. The cell $(2,2)$ is inside the first rectangle and outside the second, so it is $5$. Every cell agrees.

## Correctness proof

::: math theorem Theorem
Let $D$ be the two-dimensional difference array of a grid $A$. After the four writes of a rectangle update $(r_1, c_1, r_2, c_2, v)$, and after the two-dimensional prefix-sum recovery, the grid equals the result of adding $v$ to every cell of the rectangle in $A$.
:::

::: math proof Proof
It is enough to prove the statement for one update and a zero grid, because differentiation and prefix summation are linear: a sequence of updates is the sum of their individual effects.

Consider the four writes on a zero difference array. Let $U$ be the result, and let $S$ be its two-dimensional prefix sum. For a cell $(i,j)$, the prefix sum is the sum of the four markers whose row is at most $i$ and whose column is at most $j$.

A marker is included exactly when the cell is at or after that marker in both coordinates. Checking the four cases:

- If $i < r_1$ or $j < c_1$, none of the four markers is included, so $S[i][j] = 0$.
- If $i \ge r_1$ and $j \ge c_1$ but the cell is not yet past the right or bottom edge, the top-left marker is included and neither cancellation marker is, so $S[i][j] = v$.
- If $i \ge r_2 + 1$ and $j \ge c_1$, the top-left marker and the bottom cancellation marker are both included, so their sum is $v - v = 0$.
- If $i \ge r_1$ and $j \ge c_2 + 1$, the top-left marker and the right cancellation marker are both included, so their sum is again $0$.
- If $i \ge r_2 + 1$ and $j \ge c_2 + 1$, all four markers are included, so their sum is $v - v - v + v = 0$.

In the first case the cell is outside the rectangle and the value is $0$. In the second case the cell is inside the rectangle and the value is $v$. In the remaining cases the cell is outside and the value is $0$. That is exactly the indicator of the rectangle multiplied by $v$, so $S$ is the requested update. $\square$
:::

::: math proof Proof
The recovery pass computes the two-dimensional prefix sum of $D$. By the definition of $D$ and the telescoping identity in the formal model, that prefix sum is $A$. The in-place recurrence

$$
D[i][j] \gets D[i][j] + D[i-1][j] + D[i][j-1] - D[i-1][j-1]
$$

is the standard inclusion-exclusion recurrence for the two-dimensional prefix sum, and it is applied in increasing order of both indices, so every value it reads has already been converted. By induction on $i + j$, after the update at $(i,j)$ the entry holds the sum of the original differences over $[1,i] \times [1,j]$, which is $A[i][j]$. $\square$
:::

The two proofs together cover the whole pipeline: the four writes produce the difference array of the updated grid, and the prefix pass turns that difference array back into the grid.

## Complexity analysis

**Building the difference array from the initial grid: $O(RC)$ time.** Two passes over the grid, one row-wise and one column-wise.

**Each rectangle update: $O(1)$ time.** Four additions on four cells. There is no dependence on the rectangle's height or width.

**Recovering the grid: $O(RC)$ time.** One two-dimensional prefix-sum pass, which performs a constant number of additions per cell.

**The whole run: $O(RC + q)$ time and $O(RC)$ auxiliary space.** The difference array has $(R+2)(C+2)$ entries, and the input grid can be folded into it, so the space is one grid rather than two.

::: math complexity Complexity
Two-dimensional difference arrays over an $R \times C$ grid with $q$ updates: $O(1)$ per rectangle update, $O(RC)$ to build and to recover, $O(RC + q)$ time in total, and $O(RC)$ space.
:::

The width of the accumulator is part of the complexity statement. With $q = 2 \cdot 10^5$ updates of magnitude $10^6$, a cell can reach $2 \cdot 10^{11}$, which does not fit in a 32-bit signed integer. The reference implementations use `long long` in C and C++, `long` in Java, `Int64` in Pascal, unbounded integers in Python, and `BigInt` in JavaScript. A 32-bit accumulator would silently wrap and produce plausible but wrong depths.

Memory is the other constraint that decides whether the technique is usable. The difference array holds $(R+2)(C+2)$ 64-bit entries. At $2000 \times 2000$ that is about 32 MB, which is comfortable. At $4000 \times 4000$ it is about 128 MB, which is not comfortable under a 64 MB limit. If the grid is sparse but the coordinates are large, coordinate compression is the answer, and it changes the space to $O(q)$ before the recovery pass.

The recovery pass can also be done in place, which is what the reference implementations do. There is no need to keep the original grid once its difference array has been built.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Rectangle additions, then one read of the whole grid | Two-dimensional difference array |
| Rectangle additions and point reads interleaved | Two-dimensional Fenwick tree |
| Rectangle additions and rectangle-sum queries interleaved | Two-dimensional Fenwick tree or a segment tree of segment trees |
| Static grid, many rectangle-sum queries | Two-dimensional prefix sums |
| Point updates and rectangle-sum queries | Two-dimensional Fenwick tree |
| Range assignment instead of range addition | A segment tree with lazy propagation, or two difference arrays |
| Rectangle additions with huge coordinates and few updates | Coordinate-compressed two-dimensional difference array |
| Range minimum or maximum over rectangles | Two-dimensional sparse table or segment tree |
| Union of rectangles and total covered area | Sweep line with a segment tree |
| One-dimensional range additions | One-dimensional difference array |

The distinction between the first two rows is the important one. A difference array answers "what is the grid after all the updates", not "what is this cell now". If the statement reads a cell between two updates, the four writes have not been accumulated yet, and the read is wrong.

The distinction between the first and the third row is the direction of the transformation. A prefix-sum table answers rectangle queries on a grid that does not change; a difference array applies rectangle changes to a grid that is read once. They are inverses, and choosing the wrong one produces a program that is either too slow or wrong.

## Reference implementations

The six programs implement the same contract. The input is

```text
R C
A[1][1] A[1][2] ... A[1][C]
...
A[R][1] ... A[R][C]
q
r1 c1 r2 c2 v
...
```

with one line per update, all coordinates one-based and inclusive. The output is the final grid, $R$ lines of $C$ integers separated by single spaces. An update whose rectangle covers the whole grid, a rectangle of a single cell, and a run with no updates at all are all valid.

The C, C++, Java, Pascal, Python and JavaScript programs are listed above with their variant selectors, the recommendation for each, the verification status and a link to the raw source. Every program builds the difference array from the input grid, applies the updates, and recovers the grid with a two-dimensional prefix sum. The Java class is named `Main` so the file can be submitted to a judge unchanged.

The programs use a padded array with two extra rows and two extra columns. The padding is not part of the output; it exists so that the writes at $r_2 + 1$ and $c_2 + 1$ are always in bounds, including when the rectangle touches the last row or the last column.

## Recursion decision

The algorithm is two nested loops, and there is no reason to write it recursively.

A recursive formulation of the two-dimensional prefix sum would compute each cell from its left, top, and top-left neighbors. It would have to memoize those neighbors or recompute them, and the recomputation gives an exponential number of calls on a grid. With memoization it becomes the iterative recurrence with extra function-call overhead and a recursion depth of up to $R + C$, which on a $2000 \times 2000$ grid is 4000 frames.

The iterative form has none of those problems. The row pass depends only on the previous cell in the same row, the column pass depends only on the previous cell in the same column, and the recovery recurrence depends only on cells that have already been processed. All three are naturally expressed as loops.

There is one place where recursion or divide-and-conquer earns its keep, and it is a different problem: when the updates and the queries are interleaved and must be processed offline, a divide-and-conquer over time (CDQ divide and conquer) can replace the two-dimensional Fenwick tree. That is an advanced technique, and it is not needed for the static version in this article.

The practical rule is the same in every language: use loops for the passes, and leave recursion for the problems that are actually recursive.

## Implementation walkthrough

Four details decide whether a two-dimensional difference solution is right.

**The size of the array.** Allocate $(R+2) \times (C+2)$ entries, not $R \times C$. The four writes use $r_2 + 1$ and $c_2 + 1$, which reach $R + 1$ and $C + 1$ when the rectangle touches the last row or column. The padding also gives every cell a zero neighbor at index zero, which removes the boundary cases from the difference construction.

**The order of the four writes.** Use the same order every time:

```cpp
diff[r1][c1] += value;
diff[r2 + 1][c1] -= value;
diff[r1][c2 + 1] -= value;
diff[r2 + 1][c2 + 1] += value;
```

The first write starts the rectangle. The second cancels it below the rectangle. The third cancels it to the right. The fourth cancels the overlap of the two cancellations. Writing the markers in this order makes the signs easy to check: $+$, $-$, $-$, $+$.

**The construction from a nonzero grid.** Read the values into the difference array, then run the row pass and the column pass. The row pass goes left to right and turns each row into its one-dimensional differences. The column pass then goes bottom to top and differences those rows vertically, so that each row's row-difference is read before the row above is overwritten. The result is the mixed difference. Swapping the two passes also works, provided the second pass runs in the direction that preserves the values it still needs.

**The recovery pass.** The in-place two-dimensional prefix sum is

```cpp
for (int i = 1; i <= rows; i++) {
    for (int j = 1; j <= cols; j++) {
        diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
    }
}
```

It must run in increasing order of both indices. The subtraction of the top-left cell is the inclusion-exclusion correction; without it, the overlap of the top and left rectangles is counted twice.

The reading and printing code is deliberately plain. The input is small enough that `scanf`, `cin` with synchronization disabled, or `BufferedReader` is fast enough; the output is one line per row, which avoids the trailing-space problem.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Writing the markers at $r_2$ and $c_2$ instead of $r_2 + 1$ and $c_2 + 1$ | The last row and column of the rectangle are not updated | The cancellation goes just past the rectangle |
| Using only three markers | The rectangle leaks below and to the right | The fourth marker is the add-back |
| Swapping the signs of the two cancellation markers | The rectangle is subtracted instead of added | Check the pattern $+$, $-$, $-$, $+$ |
| Forgetting the add-back at the bottom-right | The region past the rectangle keeps the value | Add $v$ at $(r_2+1, c_2+1)$ |
| Using a 32-bit accumulator | Large grids and many updates wrap silently | Use a 64-bit type |
| Allocating $R \times C$ entries | The writes at $R+1$ and $C+1$ are out of bounds | Allocate $(R+2) \times (C+2)$ |
| Running the recovery pass before the updates | The marks are not accumulated | Apply all updates first |
| Reading a cell in the middle of the updates | The read sees an unaccumulated difference | Use a two-dimensional Fenwick tree for interleaved reads |
| Mixing zero-based input with one-based markers | Every rectangle is shifted by one row and one column | Fix one convention in the code and in the comments |

### Why this fails: the missing add-back

The mistake that survives review most often is writing only three of the four markers. The code compiles, the sample usually passes, and the error appears only when a rectangle does not touch the bottom or right edge of the grid.

Take a $3 \times 3$ grid of zeros and one update: add $4$ to the single cell $(2,2)$. The correct writes are

$$
D[2][2] \mathrel{+}= 4, \quad
D[3][2] \mathrel{-}= 4, \quad
D[2][3] \mathrel{-}= 4, \quad
D[3][3] \mathrel{+}= 4.
$$

The recovery pass produces $4$ at $(2,2)$ and $0$ everywhere else.

Now omit the add-back at $(3,3)$. The difference array has $+4$ at $(2,2)$, $-4$ at $(3,2)$, and $-4$ at $(2,3)$. The recovered grid has $4$ at $(2,2)$, $0$ at $(3,2)$, $0$ at $(2,3)$, and $-4$ at $(3,3)$. The update leaked one cell down and one cell right, and the value at the bottom-right of the affected square is negative. In a grid with many updates, the leak spreads through every cell southeast of every rectangle.

The reason the mistake is natural is that the two cancellation markers look like the two writes of the one-dimensional update. In one dimension there are two writes; in two dimensions the cancellations themselves overlap, and the overlap has to be canceled. The fourth marker is not an optional correction. It is the difference of the difference, and without it the transformation is not the inverse of the prefix sum.

A second failure with the same root is placing the bottom-right marker at $(r_2, c_2)$ instead of $(r_2+1, c_2+1)$. That shortens the rectangle by one row and one column on the bottom-right corner, and it also corrupts the cell at the corner itself. The rule is uniform: every marker that ends a range is placed at the first index the range does not cover.

## Variants and extensions

- **Difference arrays over parity or XOR.** When the update is a toggle rather than an addition, replace addition with XOR and subtraction with XOR. The four-corner pattern is unchanged, and the recovery pass uses a two-dimensional prefix XOR. This is the shape of the "switching the lights" problem below.
- **Coordinate-compressed two-dimensional difference arrays.** If the rectangle coordinates are large but only $q$ distinct rows and columns matter, compress the coordinates, run the difference array on the compressed grid, and multiply each cell's value by the area of the rectangle it represents. The result is $O(q^2)$ space in the worst case, or $O(q \log q)$ with a sweep.
- **Difference arrays for coverage counting.** When every update adds one to a rectangle, the recovered value at a cell is the number of rectangles covering it. Counting the cells with value exactly $K$ is then a scan of the recovered grid, and it is the first half of the painting-the-barn problem.
- **Two-dimensional difference arrays with a nonzero initial grid.** Build the mixed difference of the initial grid, apply the updates, and recover. This is the version implemented by the six programs, and it is the one to use when the statement gives initial values rather than zeros.
- **Rectangle assignment.** A range assignment is not a constant addition, so four writes are not enough. One common approach keeps two difference arrays, one for the values and one for the assignments, and composes them; another uses a segment tree with lazy propagation.
- **Three-dimensional difference arrays.** The pattern generalizes to a box update in three dimensions: eight corner writes, with signs given by the parity of the corner. The recovery pass is a three-dimensional prefix sum.
- **Offline rectangle additions with point queries.** If the queries are known in advance, sweep one coordinate and maintain a one-dimensional difference array over the other. This avoids the full grid when the coordinates are large, and it is the standard sweep-line alternative.
- **Difference arrays inside a segment tree.** The lazy tag of a two-dimensional segment tree is a small difference array: the four corner markers are stored at the node that covers the rectangle, and they are pushed down only when a query needs the children.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Check the operation. A rectangle addition is four writes; a rectangle assignment is not.
2. Check the order. If a cell is read between two updates, stop and use a two-dimensional Fenwick tree.
3. Fix the indexing. Read one-based coordinates, allocate $(R+2) \times (C+2)$, and keep index zero as padding.
4. Use a 64-bit accumulator. Compute the largest possible value: $q$ updates of size $v$ reach $qv$, which is $2 \cdot 10^{11}$ under the stated constraints.
5. Write the four markers in the fixed order $+$, $-$, $-$, $+$, and check the bottom-right add-back explicitly.
6. Build the difference array from the initial grid before the first update, not after it.
7. Test four cases: an update covering the whole grid, an update of a single cell, an update touching the last row and column, and a run with no updates.
8. Compare against the cell-by-cell baseline on a small random grid. The random test catches sign errors that a hand-written sample does not.

## Worked problems

### Problem 1: Painting the Barn

**Restatement.** Given $N$ rectangles on a $200 \times 200$ grid and an integer $K$, compute the area covered by exactly $K$ coats of paint, then find the largest such area after painting up to two additional disjoint rectangles. Constraints: $1 \le N \le 10^5$ and $1 \le K \le N$.

**Naive baseline.** Paint every rectangle cell by cell, at a cost of $O(200^2 N) = 4 \cdot 10^9$ writes, and then try every pair of additional rectangles, which is far worse.

**Insight.** The coat count at every cell is a sum of rectangle indicators, so it is exactly a two-dimensional difference array followed by a prefix sum. Once the counts are known, only cells with $K$ coats and $K-1$ coats matter: painting a $K$-cell loses one unit of area, painting a $K-1$ cell gains one, and every other cell leaves the area unchanged.

**Derivation.** Build the difference array of the $N$ rectangles with four writes each, and recover the counts with a two-dimensional prefix sum. Replace a count of $K$ by $-1$, a count of $K-1$ by $+1$, and every other count by $0$. A single additional rectangle then has a value equal to the sum of this transformed grid over the rectangle, which is a maximum-subrectangle problem. For two disjoint rectangles, there is always a horizontal or vertical line that separates them, so compute the best rectangle in each of the four directions and combine the two sides of every line.

**Correctness.** The difference array produces the exact coat count at every cell, by the four-marker lemma. The transformed value of a rectangle is the change in the area covered exactly $K$ times, because each $K$-cell loses one and each $K-1$-cell gains one. The separating line exists for any two disjoint axis-aligned rectangles, so the combination of the four directional tables considers every disjoint pair.

**Complexity.** $O(200^2 + N)$ time to build and recover the counts, and $O(200^3)$ time for the maximum-subrectangle sweeps. The grid is fixed at $200 \times 200$, so the $O(200^3)$ term is about eight million operations.

**Common wrong approach.** Applying the two added rectangles one after the other without enforcing disjointness. The second rectangle then counts the cells changed by the first one twice, and the answer is too large.

### Problem 2: Clouds

**Restatement.** A sky is a $2000 \times 2000$ grid. There are $N$ rectangular clouds. For each cloud $k$, remove cloud $k$ and report how many cells are covered by no remaining cloud. Constraints: $1 \le N \le 2 \cdot 10^5$.

**Naive baseline.** Recompute the coverage of the whole grid for every cloud, at a cost of $O(N \cdot 2000^2)$, which is $8 \cdot 10^{11}$ operations.

**Insight.** The coverage count of every cell is a two-dimensional difference array of the $N$ rectangles. Removing a cloud only changes the cells that were covered by that cloud alone. If the total number of cells covered at least once is $T$, and cloud $k$ covers $U_k$ cells that no other cloud covers, the answer for $k$ is $2000^2 - T + U_k$.

**Derivation.** Apply all $N$ rectangles to the difference array and recover the coverage counts. During the recovery, count the cells with a positive count for $T$. For the unique cells, a cell with count one belongs to exactly one cloud, so keep for each cell the identifier of that cloud and increment $U_k$. The answer for cloud $k$ is then $2000^2 - T + U_k$.

**Correctness.** A cell stops being covered when cloud $k$ is removed exactly when its only covering cloud is $k$, which is exactly when its count is one and its recorded identifier is $k$. Every other cell either remains covered or remains uncovered, so the formula counts the uncovered cells after the removal.

**Complexity.** $O(2000^2 + N)$ time and $O(2000^2)$ space. The grid is four million cells, so the difference array is about 32 MB with 64-bit entries.

**Common wrong approach.** Recomputing the coverage for each cloud, or subtracting the whole area of cloud $k$ instead of only the cells it covers uniquely. The first is too slow; the second is wrong wherever clouds overlap.

### Problem 3: Switching the Lights

**Restatement.** A grid of $N$ rows and $M$ columns has an initial brightness $B[i][j]$. There are $Q$ operations, each toggling every light in an axis-aligned rectangle. A light toggled an odd number of times ends at twice its initial brightness; a light toggled an even number of times ends at its initial brightness. Print the total brightness after all operations. Constraints: $N, M \le 1500$ and $Q \le 2 \cdot 10^5$.

**Naive baseline.** Toggle every cell of every rectangle, at a cost of $O(NMQ) = 4.5 \cdot 10^{11}$ operations.

**Insight.** Only the parity of the number of toggles matters, and parity is addition modulo two. A rectangle toggle is therefore a rectangle addition of one over the integers, followed by a parity check, which is exactly the two-dimensional difference array with XOR or with an integer count.

**Derivation.** Build a difference array of $N+2$ rows and $M+2$ columns. For every operation, write $+1$ at the four corners of the rectangle. Recover the toggle count with a two-dimensional prefix sum, and add $B[i][j]$ to the answer a second time when the count is odd. The base answer is the sum of all initial brightnesses.

**Correctness.** The recovered value at a cell is the number of rectangles that contain it, by the four-marker lemma. Its parity is the parity of the number of toggles. A light contributes $B[i][j]$ in the base sum and one additional $B[i][j]$ exactly when the parity is odd, which is the stated final brightness.

**Complexity.** $O(NM + Q)$ time and $O(NM)$ space. The total brightness can reach $2 \cdot 1500^2 \cdot 10^4 = 4.5 \cdot 10^{10}$, so the accumulator must be 64-bit.

**Common wrong approach.** Counting the total number of toggles without reducing modulo two, or storing the brightness in a 32-bit integer. The first gives the wrong mode; the second overflows on a large grid.

## Practice progression

1. **Recognition.** Given a statement, decide whether a two-dimensional difference array applies. Look for rectangle additions and reads that happen after all the updates.
2. **Direct application.** Implement the four writes and the two-dimensional recovery for a grid of zeros, and verify the result against the cell-by-cell paint on random small grids.
3. **Initial values.** Extend the implementation to a grid with given initial values, using the row pass and the column pass to build the mixed difference.
4. **Adaptation.** Implement the parity version for toggles, and the coordinate-compressed version for large coordinates with few rectangles.
5. **Combination.** Combine the recovered coverage counts with a scan for cells covered exactly $K$ times, and with a maximum-subrectangle search for the best additional rectangle.
6. **Challenge.** Solve a problem where the reads are interleaved with the updates, discover that the difference array cannot answer them, and replace it with a two-dimensional Fenwick tree.
7. **Transfer.** Use the four-corner pattern where the grid is not explicit: in a sweep line over one coordinate, in a segment tree's lazy tag, and in a three-dimensional box update with eight corners.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Where exactly do the four writes of a rectangle update go, and what is the sign of each? (Key insight)
2. Why does the difference array need an extra row and an extra column? (Formal model)
3. What is the mixed difference of a grid, and how is it recovered? (Algorithm derivation)
4. Give the smallest grid and update for which the missing add-back produces a wrong value. (Common mistakes)
5. State the invariant that the four writes preserve, and say which part of the proof uses it. (Correctness proof)
6. Why is the update $O(1)$ while the recovery is $O(RC)$? (Complexity analysis)
7. When does the technique stop working, and what replaces it? (Algorithm selection)
8. How do you handle a grid with nonzero initial values? (Implementation walkthrough)
9. How does the parity version differ from the addition version? (Variants and extensions)
10. What is the largest value the stated constraints allow, and why does that decide the type of the accumulator? (Complexity analysis)
11. Why does the painting-the-barn solution transform counts of $K$ and $K-1$ into $-1$ and $+1$? (Worked problems)
12. Why is a single horizontal or vertical line enough to separate two disjoint rectangles? (Worked problems)

## Further reading

- The one-dimensional original, which this technique applies along each axis, is [difference arrays](/algorithms/arrays/difference-arrays).
- The inverse transformation, which answers static rectangle queries, is [two-dimensional prefix sums](/algorithms/arrays/two-dimensional-prefix-sums).
- The one-dimensional prefix sum that the recovery pass generalizes is [prefix sums](/algorithms/arrays/prefix-sums).
- The structure that handles interleaved updates and queries is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and the [segment tree](/algorithms/range-queries/segment-tree) generalizes it to non-additive quantities.
- The technique for large coordinates with few rectangles is [coordinate compression](/algorithms/arrays/coordinate-compression).
- The geometry technique that decomposes rectangle unions into events is the [sweep line](/algorithms/geometry/sweep-line).
- Every listing in this article, in all six languages, is collected on the [two-dimensional difference arrays source page](/implementations/arrays-two-dimensional-difference-arrays/).
