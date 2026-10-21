---
id: arrays.two-dimensional-prefix-sums
title: Two-dimensional prefix sums
summary: Precompute the total of every rectangle anchored at the top-left corner, so that any rectangle sum is four lookups and three additions.
division: [silver, gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords:
    [
        two dimensional prefix sums,
        summed area table,
        rectangle sum,
        2d prefix sum,
        inclusion exclusion,
        grid queries,
    ]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [range-queries.fenwick-tree, arrays.difference-arrays]
assumptions:
    - The grid never changes after the table is built.
    - Every query asks for the sum over an axis-aligned rectangle.
reviewed: false
---

## At a glance

A two-dimensional prefix sum table stores, at every cell, the total of the rectangle between the top-left corner of the grid and that cell. The table has $(R+1)(C+1)$ entries, and building it costs $O(RC)$.

The payoff is that the sum of any axis-aligned rectangle becomes four lookups and three additions. The rectangle from rows $r_1$ to $r_2$ and columns $c_1$ to $c_2$ has sum

$$
P[r_2][c_2] - P[r_1-1][c_2] - P[r_2][c_1-1] + P[r_1-1][c_1-1],
$$

where $P[i][j]$ is the total of the rectangle from $(1,1)$ to $(i,j)$. The formula is inclusion-exclusion, and the last term is the one that people forget: the two subtractions overlap in the top-left region, so it has to be added back.

The technique is the two-dimensional version of [prefix sums](/algorithms/arrays/prefix-sums) and it is the same trick applied twice. It is also known as the **summed area table**, which is the name it has in image processing, where the same table answers the question "how much light is in this rectangle of the image?" in constant time.

The comparison with a **Fenwick tree over one dimension** is worth understanding, because the two structures look interchangeable and are not. A 1-D Fenwick tree over the grid flattened row by row answers a _strip_ query in $O(\log(RC))$, but a general rectangle is not a contiguous range of the flattened array, so a single one-dimensional Fenwick tree cannot answer it at all. When the queries are static, the prefix sum table is the better structure; when the grid changes, the answer is a Fenwick tree of Fenwick trees, or a segment tree over rows.

## Problem motivation

A satellite images a field as a grid of $R$ rows and $C$ columns of cells, and each cell holds the amount of vegetation in it. A farmer wants to know the total vegetation in a rectangular plot, and asks many such questions.

The constraints:

- $1 \le R, C \le 2000$, so at most $4 \cdot 10^6$ cells.
- $q \le 2 \cdot 10^5$ queries, each naming a rectangle.
- The image never changes: it is taken once and queried many times.
- Each cell holds a value up to $10^6$, so a rectangle total can reach $4 \cdot 10^{12}$.

The naive answer sums the cells of each rectangle, at a cost of $O(RCq) = 8 \cdot 10^{11}$ additions, which is hopeless.

The answer that works builds a table of $4 \cdot 10^6$ running totals and then answers each query in constant time. The table costs about 32 MB with 64-bit entries, and the whole run costs $O(RC + q) = 4 \cdot 10^6$ operations.

Notice what the structure of the problem is doing for the technique: the grid is **static** and the quantity is **additive**. The moment either of those changes, the table stops being the right answer.

## Recognition patterns

A two-dimensional prefix sum is the right tool when all of the following hold.

- The data is a **grid** or a **matrix**.
- The queries are **axis-aligned rectangles**.
- The grid is **static**: it never changes after the table is built.
- The quantity is **additive**: a sum, a count of marked cells, a total weight.

The phrases that signal it are "sum of a rectangle", "the values in the sub-grid", "the total in the box from row $r_1$ to $r_2$", "how much of the field is inside the fence". The phrase that rules it out is "after each operation, change a cell", because that requires the table to be rebuilt.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $q \ge RC$ | The table is clearly worth building |
| $q = 1$ | One scan of the rectangle is enough |
| $R \cdot C \le 10^6$ | The table is 8 MB and is comfortable |
| $R \cdot C \ge 10^7$ | The table is 80 MB or more; check the memory limit before committing |
| The grid changes between queries | Rules out the table; use a Fenwick tree of Fenwick trees |
| The queries are not rectangles but arbitrary shapes | Rules out the table |
| The quantity is a maximum or a minimum | Rules out the table; sums do not invert |

## Naive approach

The baseline sums the rectangle for every query.

```python
for r1, c1, r2, c2 in queries:
    total = 0
    for r in range(r1 - 1, r2):
        for c in range(c1 - 1, c2):
            total += grid[r][c]
    print(total)
```

This is $O(RCq)$ and it is correct for every input. It is the reference implementation for the differential test.

The second baseline is a one-dimensional prefix sum per row, with the row totals summed per query. It is $O(RC)$ to build and $O(R \cdot C)$ per query, which is a large improvement and still too slow.

The third baseline is a Fenwick tree over the flattened grid, which is discussed in the selection section below.

## Key insight

The insight is the same as in one dimension, applied twice: the sum of a rectangle is a difference of larger rectangles.

A rectangle anchored at the top-left corner is called a **prefix rectangle**. The table $P$ stores one total per cell: $P[i][j]$ is the sum of the rectangle from $(1,1)$ to $(i,j)$.

Consider the query rectangle $Q$ from $(r_1, c_1)$ to $(r_2, c_2)$. Start with the big prefix rectangle $P[r_2][c_2]$, which contains $Q$ and also contains two other regions: the strip above $Q$ and the strip to the left of $Q$.

Subtracting the strip above, $P[r_1-1][c_2]$, removes everything above the query. Subtracting the strip to the left, $P[r_2][c_1-1]$, removes everything to the left. But those two strips overlap in the block above and to the left of the query, and that block has now been subtracted twice, so it has to be added back once. That is the fourth term.

The picture is the standard picture of inclusion-exclusion: one big rectangle, minus two overlapping strips, plus back the corner where they overlapped.

The second half of the insight is that the table can be built in one pass. The prefix rectangle at $(i,j)$ is the union of the prefix rectangle at $(i-1,j)$ and the prefix rectangle at $(i,j-1)$, with their overlap counted twice, and the cell $(i,j)$ added once:

$$
P[i][j] = a[i][j] + P[i-1][j] + P[i][j-1] - P[i-1][j-1].
$$

That is the same formula as the query, applied during the construction.

## Visual intuition

The picture is a grid of running totals, each one larger than the last, like a staircase of accumulations.

For the grid

```text
        c=1   c=2   c=3
r=1      1     3     6
r=2      6    14    24
r=3     15    33    54
```

each entry is the total of the rectangle above and to the left of it. The entry 14 in the middle is $1 + 2 + 5 + 6$, the sum of the top-left $2 \times 2$ block.

A query rectangle is then drawn as an inclusion-exclusion picture. Take the rectangle from rows 2 to 3 and columns 2 to 3 of the grid

```text
        c=1   c=2   c=3
r=1      1     3     6
r=2      6    14    24
r=3     15    33    54
```

- Start from the whole prefix rectangle $P[3][3] = 54$.
- Subtract the strip above, $P[1][3] = 6$, which leaves 48 and removes row 1.
- Subtract the strip to the left, $P[3][1] = 15$, which leaves 33 and removes column 1.
- The block above and to the left, $P[1][1] = 1$, was removed twice, so add it back: 34.

And $34 = 6 + 7 + 10 + 11$, which is the sum of the four cells in the query rectangle.

## Formal model

Let $a_{i,j}$ be the value at row $i$ and column $j$, with $1 \le i \le R$ and $1 \le j \le C$.

<MathPanel type="definition" title="Definition">
The **two-dimensional prefix sum** $P[i][j]$ is the sum of the
rectangle anchored at the top-left corner of the grid:

$$
P[i][j] = \sum_{x=1}^{i} \sum_{y=1}^{j} a_{x,y},
$$

with $P[0][j] = P[i][0] = 0$ for every $i$ and $j$. The table has $(R+1)(C+1)$ entries.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **rectangle sum** of the query $(r_1, c_1, r_2, c_2)$ is
$S(r_1, c_1, r_2, c_2) = \sum_{x=r_1}^{r_2} \sum_{y=c_1}^{c_2} a_{x,y}$,
where $1 \le r_1 \le r_2 \le R$ and $1 \le c_1 \le c_2 \le C$.
</MathPanel>

<MathPanel type="recurrence" title="Recurrence">
The table is built by

$$
P[i][j] = a_{i,j} + P[i-1][j] + P[i][j-1] - P[i-1][j-1]
$$

for $1 \le i \le R$ and $1 \le j \le C$, in row-major order.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
For every query,

$$
S(r_1, c_1, r_2, c_2) = P[r_2][c_2] - P[r_1-1][c_2] - P[r_2][c_1-1] + P[r_1-1][c_1-1].
$$

</MathPanel>

<MathPanel type="theorem" title="Theorem">
The construction and the query formula together answer every rectangle
sum query correctly.
</MathPanel>

## Algorithm derivation

The state is the table $P$ of $(R+1)(C+1)$ entries, with the row zero and the column zero filled with zeros.

The build rule is: for $i$ from 1 to $R$, for $j$ from 1 to $C$, set $P[i][j] = a_{i,j} + P[i-1][j] + P[i][j-1] - P[i-1][j-1]$.

The build rule is correct because the two prefix rectangles at $(i-1,j)$ and $(i,j-1)$ together cover the prefix rectangle at $(i,j)$ except for the cell $(i,j)$ itself, and they overlap in the prefix rectangle at $(i-1,j-1)$, which is therefore counted twice and has to be subtracted once.

The query rule is the lemma: read the four corners and combine them with the signs $+, -, -, +$.

<MathPanel type="invariant" title="Invariant">
After the build step for row $i$ and column $j$, the entry $P[i][j]$
holds the sum of the rectangle from $(1,1)$ to $(i,j)$, and every entry
in row zero or column zero holds zero.
</MathPanel>

The zero row and the zero column are not a convenience. They are what makes the formula work for a query that touches the first row or the first column, because the term $P[r_1-1][c_2]$ is $P[0][c_2]$ when $r_1 = 1$, and a prefix rectangle of height zero has sum zero.

## Step-by-step execution

Take the grid

```text
 1  2  3  4
 5  6  7  8
 9 10 11 12
```

and build the table row by row, with a row and a column of zeros around it.

- $P[1][1] = 1 + 0 + 0 - 0 = 1$.
- $P[1][2] = 2 + 0 + 1 - 0 = 3$.
- $P[1][3] = 3 + 0 + 3 - 0 = 6$.
- $P[1][4] = 4 + 0 + 6 - 0 = 10$.
- $P[2][1] = 5 + 1 + 0 - 0 = 6$.
- $P[2][2] = 6 + 3 + 6 - 1 = 14$.
- $P[2][3] = 7 + 6 + 14 - 3 = 24$.
- $P[2][4] = 8 + 10 + 24 - 6 = 36$.
- $P[3][1] = 9 + 6 + 0 - 0 = 15$.
- $P[3][2] = 10 + 14 + 15 - 6 = 33$.
- $P[3][3] = 11 + 24 + 33 - 14 = 54$.
- $P[3][4] = 12 + 36 + 54 - 24 = 78$.

The table is

```text
  0   0   0   0   0
  0   1   3   6  10
  0   6  14  24  36
  0  15  33  54  78
```

Now two queries.

**Query 1: rows 2 to 3, columns 2 to 3.** The formula gives $P[3][3] - P[1][3] - P[3][1] + P[1][1] = 54 - 6 - 15 + 1 = 34$. The four cells are 6, 7, 10 and 11, and $6 + 7 + 10 + 11 = 34$. Correct.

**Query 2: the whole grid.** The formula gives $P[3][4] - P[0][4] - P[3][0] + P[0][0] = 78 - 0 - 0 + 0 = 78$. The sum of the twelve cells is $10 + 26 + 42 = 78$. Correct.

**Query 3: row 1, columns 2 to 4.** The formula gives $P[1][4] - P[0][4] - P[1][1] + P[0][1] = 10 - 0 - 1 + 0 = 9$. The cells are 2, 3 and 4, and $2 + 3 + 4 = 9$. Correct, and this is the query that shows why the zero row has to exist.

## Correctness proof

<MathPanel type="proof" title="Proof">
The construction computes the prefix sums correctly.
</MathPanel>

<MathPanel type="proof" title="Proof">
We prove the invariant by induction over the row-major order.

Before the first step, every entry of row zero and of column zero is zero, which is the sum of the empty rectangle anchored at that corner.

Suppose the entries $P[i-1][j]$ and $P[i][j-1]$ and $P[i-1][j-1]$ hold their correct prefix sums. The prefix rectangle at $(i,j)$ is the union of the prefix rectangle at $(i-1,j)$ and the prefix rectangle at $(i,j-1)$, less their intersection, which is the prefix rectangle at $(i-1,j-1)$, plus the cell $(i,j)$ itself. The sum of the union is therefore

$$
P[i-1][j] + P[i][j-1] - P[i-1][j-1] + a_{i,j},
$$

which is exactly what the build rule writes into $P[i][j]$. The invariant is preserved, so every entry of the table is correct. $\square$
</MathPanel>

<MathPanel type="proof" title="Proof">
The query formula returns the sum of the query rectangle.
</MathPanel>

<MathPanel type="proof" title="Proof">
By the definition, $P[r_2][c_2]$ is the sum of every cell with
$1 \le x \le r_2$ and $1 \le y \le c_2$. The prefix rectangle
$P[r_1-1][c_2]$ is the sum of the cells of that region with $x < r_1$,
and the prefix rectangle $P[r_2][c_1-1]$ is the sum of the cells with
$y < c_1$. Subtracting the first removes the rows above the query and
subtracting the second removes the columns to the left of it.

The cells with $x < r_1$ and $y < c_1$ are removed twice, and every other cell outside the query is removed exactly once. Their total is $P[r_1-1][c_1-1]$, so adding it back leaves each cell of the query counted once and every other cell counted zero. The result is therefore $S(r_1, c_1, r_2, c_2)$. $\square$
</MathPanel>

## Complexity analysis

**Time: $O(RC)$ to build** and **$O(1)$ per query**, so $O(RC + q)$ for the whole run.

**Space: $O(RC)$** for the table, which has $(R+1)(C+1)$ entries. With 64-bit entries that is $8(R+1)(C+1)$ bytes: 8 MB for a $1000 \times 1000$ grid, 32 MB for a $2000 \times 2000$ grid, and 128 MB for a $4000 \times 4000$ grid, which is where the memory limit usually bites.

<MathPanel type="complexity" title="Complexity">
Two-dimensional prefix sums over an $R \times C$ grid: $O(RC)$ to build,
$O(1)$ per rectangle query, $O(RC + q)$ in total, and $O(RC)$ space.
</MathPanel>

The width of the accumulator is part of the correctness, not a detail. With $4 \cdot 10^6$ cells of value up to $10^6$, a prefix total reaches $4 \cdot 10^{12}$, which needs 64 bits.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static grid, rectangle sum queries | Two-dimensional prefix sums |
| Static grid, rectangle sum queries, small grid | The same, or a summed area table of 32-bit values |
| Static grid, one rectangle query | A single scan of the rectangle |
| Grid with point updates and rectangle sum queries | A Fenwick tree of Fenwick trees, or a segment tree over rows |
| Grid with rectangle updates and point queries | A two-dimensional difference array |
| Row-wise or column-wise sums only | A one-dimensional prefix sum per row, or a single Fenwick tree per column |
| Static grid, a maximum over a rectangle | A sparse table, or a segment tree |
| One-dimensional data, range sums | The one-dimensional prefix sums |
| Static grid, the count of marked cells in a rectangle | The same table, with the marked cells worth one and the rest zero |

The middle of the table is where the comparison with the Fenwick tree belongs, and it is worth being precise about it.

|  | Two-dimensional prefix sums | Fenwick tree over the flattened grid |
| --- | --- | --- |
| Build | $O(RC)$ | $O(RC \log(RC))$ |
| Point update | $O(RC)$ to rebuild | $O(\log(RC))$ |
| Query for a full-width strip | $O(1)$ | $O(\log(RC))$ |
| Query for a general rectangle | $O(1)$ | Not supported |
| Space | $O(RC)$ | $O(RC)$ |

The row in bold is the one that decides it. Flattening the grid row by row turns the grid into an array of $RC$ entries, and a one-dimensional Fenwick tree over that array answers a range of consecutive flattened positions in $O(\log(RC))$. A full-width strip of the grid is such a range, so a one-dimensional Fenwick tree does answer strip queries. A general rectangle is **not** a consecutive range of the flattened array, so a single one-dimensional Fenwick tree cannot answer it at all: the cells of a rectangle are scattered through the flattened array, and any single contiguous range in that array is a union of full rows or a union of partial rows in a single row.

That is the reason a Fenwick tree of Fenwick trees exists, and the reason the two-dimensional prefix sum is worth its memory when the grid is static.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting the fourth term of the query formula | The top-left corner region is subtracted twice, so the answer is too small | Add back $P[r_1-1][c_1-1]$ |
| Using $P[r_1][c_2]$ instead of $P[r_1-1][c_2]$ | The whole first row of the query is excluded | The strip above the query ends at $r_1 - 1$ |
| Allocating an $R \times C$ table | A query that touches the first row writes out of bounds | Allocate $(R+1)(C+1)$ entries |
| Using 32-bit totals | A wrong answer with no error message | Use a 64-bit type |
| Forgetting the subtraction in the build rule | The prefix totals count the overlap twice | Build with the same formula as the query |
| Confusing the row index with the column index | The table is the transpose, and every query is wrong | Fix the convention and write it in a comment |
| Rebuilding the table after each update | The cost is $O(RCq)$ | Use a dynamic structure |
| Using the table for a maximum query | The sum does not invert | Use a sparse table or a segment tree |

### Why this fails: the corner that is subtracted twice

The mistake that survives review most often is forgetting the fourth term of the query formula. It is one addition out of four, it compiles, and it produces an answer that is smaller than the truth by a constant that depends on the query, so it is easy to mistake for a rounding error.

The smallest counterexample is a $2 \times 2$ grid with a single-cell query.

```text
1  2
3  4
```

The table is

```text
  0   0   0
  0   1   3
  0   4  10
```

Query the cell $(2,2)$, whose value is 4.

- **Correct.** $P[2][2] - P[1][2] - P[2][1] + P[1][1] = 10 - 3 - 4 + 1 = 4$.
- **Without the corner.** $P[2][2] - P[1][2] - P[2][1] = 10 - 3 - 4 = 3$.

The answer is 3 instead of 4, and the error is exactly $P[1][1] = 1$, the sum of the top-left corner region.

The reason the corner needs adding back is that the two subtractions overlap. The strip above the query and the strip to the left of the query share the block above and to the left of the query, and that shared block is inside the big prefix rectangle twice, so it is subtracted twice. Every other cell outside the query is subtracted exactly once, and every cell inside it is subtracted zero times. Adding the shared block back exactly once fixes the count for every cell at once.

The error grows with the size of the corner. On a $2000 \times 2000$ grid of ones, a query for the bottom-right $1000 \times 1000$ block has a corner region worth $10^6$, so the answer comes out $10^6$ too small. There is no version of this mistake that is a small error.

The generalizes into a rule: **inclusion-exclusion over two overlapping regions needs the overlap added back.** The fourth term is not an adjustment; it is the correction that makes the count exact, and the same rule governs the build rule, where the same corner has to be subtracted.

A second failure with the same root is confusing the two index conventions. If the table is built with $P[i][j]$ meaning "rows 1 to $i$, columns 1 to $j$" and the query is written with the indices the other way round, every answer is wrong and the error is large enough to be obvious. The convention should be written in a comment next to the table, because the formula is symmetric enough that a swap is easy to make and hard to see.

## Variants and extensions

- **The two-dimensional difference array.** The mirror image: a rectangle update becomes four writes, one at each corner, and the values are recovered by the two-dimensional prefix sum. The two structures share the same geometry.
- **The summed area table.** The same table under the name it has in image processing, where it answers the question "how much of the image is inside this rectangle" in constant time and is the standard first step of a feature detector.
- **The Fenwick tree of Fenwick trees.** A Fenwick tree over the rows, each node holding a Fenwick tree over the columns. A point update and a rectangle sum both cost $O(\log R \log C)$, and the space is $O(RC)$. It is the right answer when the grid changes.
- **The segment tree over rows.** Each node holds a segment tree over the columns. It is more space than the Fenwick version and it supports the queries that the Fenwick version does not, such as the maximum over a rectangle.
- **The 2-D prefix sum of a 1-D array.** For a single row or a single column, the table degenerates to the one-dimensional prefix sum, and the same formula applies.
- **The offline sweep over queries.** When the grid is static but the queries are known, sorting the queries by row and sweeping with a running column sum answers them in $O(RC + q)$ with $O(C)$ extra space, which is less memory than the full table.
- **The weighted version.** A table of weighted prefix sums answers the question "what is the total value inside the rectangle, where each cell is worth a factor" in the same way.
- **The three-dimensional version.** The same construction in three dimensions gives a formula with eight terms, and the same inclusion-exclusion argument justifies it. It is rarely worth the memory.
- **The prefix sum of a sparse grid.** When most cells are zero, storing the table densely is wasteful and a map of the non-zero cells is better.

## Contest strategy

Under contest pressure, the errors above are what cost points, and the whole technique can be applied with a fixed procedure.

1. Check that the grid is static. If the statement contains "after each operation, change a cell", stop and use a Fenwick tree of Fenwick trees.
2. Compute the memory: $8(R+1)(C+1)$ bytes, and compare it with the limit before allocating.
3. Compute the largest total: $RC$ times the largest cell value, and choose the accumulator width.
4. Write the query formula once, in the correct order, and copy it rather than retyping it: big minus the top strip minus the left strip plus the corner.
5. Allocate the extra row and the extra column. A table of $R \times C$ entries cannot answer a query that touches the first row.
6. Test three queries by hand: the whole grid, a single corner cell, and a single cell in the middle.

## Worked problems

### Problem 1: the vegetation queries

**Restatement.** An $R \times C$ grid holds vegetation amounts. Answer $q$ queries, each naming a rectangle, with the sum of the values inside it. Constraints: $R, C \le 2000$, $q \le 2 \cdot 10^5$, values up to $10^6$.

**Naive baseline.** Sum each rectangle, at a cost of $O(RCq) = 8 \cdot 10^{11}$ additions.

**Insight.** A rectangle sum is a difference of four prefix rectangles, by inclusion-exclusion.

**Derivation.** Build the table $P$ of $(R+1)(C+1)$ totals with the build rule, then answer each query with the four-term formula.

**Correctness.** The construction proof shows the table holds the prefix rectangles, and the query proof shows the four-term formula counts every cell of the query once and every other cell zero times.

**Complexity.** $O(RC + q)$ time and $O(RC)$ space, which is 32 MB for the largest grid.

**Common wrong approach.** Dropping the fourth term, which makes every answer too small by the value of the top-left corner region.

### Problem 2: counting marked cells

**Restatement.** An $R \times C$ grid has some cells marked. Answer $q$ queries, each naming a rectangle, with the number of marked cells inside it. Constraints: $R, C \le 1000$, $q \le 10^5$.

**Naive baseline.** Scan each rectangle and count, at a cost of $O(RCq)$.

**Insight.** Counting is a sum: replace each marked cell by one and each other cell by zero, and the same table answers the queries.

**Derivation.** Build the table over the binary grid, or equivalently over the original grid and subtract the two prefix sums of the marks.

**Correctness.** The count of marked cells in a rectangle is the sum of the binary values in it, and the theorem applies to that sum.

**Complexity.** $O(RC + q)$ time and $O(RC)$ space.

**Common wrong approach.** Building a separate table of counts when the marks are already known to be static, and then forgetting that the two tables have to agree about the zero row.

### Problem 3: the maximum sub-rectangle

**Restatement.** An $R \times C$ grid holds values. Report the largest sum of any rectangle with its top-left corner at a given cell, or the largest sum of any rectangle in the whole grid. Constraints: $R, C \le 500$.

**Naive baseline.** For every top-left corner, extend the rectangle and keep the best, at a cost of $O(R^2 C^2)$ for the whole grid.

**Insight.** The prefix table makes the sum of any rectangle available in constant time, so the search over the corners is $O(R^2 C^2)$ in lookups but each is $O(1)$; for the version with a fixed top-left corner, the search is $O(RC)$.

**Derivation.** For every pair of rows $r_1, r_2$, the sum of the rectangle between them and the columns $c_1, c_2$ is a four-term lookup, so the best pair of columns can be found by scanning.

**Correctness.** The table gives the exact sum of every candidate, and every candidate is examined.

**Complexity.** $O(R^2 C^2)$ time for the unrestricted version, which is $6 \cdot 10^{10}$ at $R = C = 500$ and is therefore too slow. The version with a fixed top-left corner is $O(RC)$ and is the one the problem usually asks for.

**Common wrong approach.** Trying to use the prefix table for the maximum of a rectangle. A sum inverts, a maximum does not, and the table cannot answer that question at all.

## Practice progression

1. **Recognition.** Given a statement, decide whether a two-dimensional prefix sum applies. Look for a grid, rectangular queries, a static grid and an additive quantity.
2. **Direct application.** Build the table and answer the queries, and verify them against a brute-force scan on small random grids.
3. **Adaptation.** Build the two-dimensional difference array, and the version that answers the count of marked cells.
4. **Combination.** Combine the table with a binary search to answer a rectangle with a monotone condition, and with a sweep to reduce the memory when the queries are known in advance.
5. **Challenge.** Solve a problem where the grid changes between queries, discover that the table must be rebuilt, and replace it with a Fenwick tree of Fenwick trees.
6. **Transfer.** Recognize the same inclusion-exclusion pattern elsewhere: the three-dimensional prefix sum with its eight terms, and the offline sweep that replaces the table with a running sum.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. Write the query formula, and say which term each part of the rectangle contributes. (Key insight)
2. Why is the fourth term of the formula needed, and what happens without it? (Common mistakes)
3. Give the smallest grid and query on which the fourth term changes the answer. (Common mistakes)
4. State the build rule and explain the subtraction in it. (Algorithm derivation)
5. State the invariant of the build and say which part of the proof uses it. (Correctness proof)
6. Why does the table have $(R+1)(C+1)$ entries rather than $RC$? (Common mistakes)
7. Why can a one-dimensional Fenwick tree over the flattened grid not answer a general rectangle query? (Algorithm selection)
8. When does the Fenwick tree of Fenwick trees become the right answer? (Algorithm selection)
9. How much memory does the table cost at $R = C = 4000$, and what is the largest total it must hold? (Complexity analysis)
10. What is the one-dimensional version of this technique? (Variants and extensions)
11. How would you answer the query without building the whole table, and what does that cost? (Variants and extensions)
12. Which queries in the worked problems are the ones that catch a missing zero row? (Worked problems)

## Further reading

- The one-dimensional version of the same idea is in [prefix sums](/algorithms/arrays/prefix-sums).
- The mirror image, in which a rectangle update becomes four writes, is in [difference arrays](/algorithms/arrays/difference-arrays).
- The structure to reach for when the grid does change is the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and the [segment tree](/algorithms/range-queries/segment-tree) generalizes it to non-additive quantities.
- The offline technique that replaces the table with a sweep is in [two pointers](/algorithms/searching/two-pointers), and the window that answers a related question is in [sliding window](/algorithms/searching/sliding-window).
- The binary search that finds a boundary inside a monotone condition is in [binary search](/algorithms/searching/binary-search).
