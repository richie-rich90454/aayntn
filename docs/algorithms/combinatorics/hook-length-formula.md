---
id: combinatorics.hook-length-formula
title: The hook-length formula
summary: Count the standard Young tableaux of a shape with one factorial divided by a product of hook lengths, and turn the division into a modular inverse.
division: [gold, platinum]
subjects: [combinatorics]
level: advanced
importance: specialized-technique
keywords:
    [
        hook length,
        hook-length formula,
        standard Young tableau,
        Young diagram,
        Frame-Robinson-Thrall,
        Robinson-Schensted-Knuth,
        linear extension,
        modular inverse,
    ]
prerequisites:
    required: [foundations.complexity, combinatorics.binomial-coefficients]
    recommended:
        [
            number-theory.modular-arithmetic,
            combinatorics.integer-partitions,
            combinatorics.multinomial-coefficients,
        ]
complexity:
    time: "O(n + w) for a diagram of n cells and width w, plus O(log M) for the inverse"
    space: "O(k + w) for k row lengths and w column heights"
assumptions:
    - The row lengths are non-increasing, so they describe a Young diagram with no gaps.
    - The answer is reported modulo a prime larger than every hook length, so each division is a multiplication by an inverse.
implementations: combinatorics.hook-length-formula
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/combinatorics.hook-length-formula.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A **Young diagram** is a left-aligned arrangement of cells whose row lengths never increase. If the row lengths are $\lambda_1 \ge \lambda_2 \ge \cdots \ge \lambda_k \ge 1$, the shape is written $\lambda = (\lambda_1, \ldots, \lambda_k)$, and the number of cells is $n = \lambda_1 + \cdots + \lambda_k$.

A **standard Young tableau** of shape $\lambda$ fills the $n$ cells with $1, 2, \ldots, n$, each exactly once, so that every row increases from left to right and every column increases from top to bottom. The number of such fillings is written $f^\lambda$.

The **hook** of a cell is the cell itself, the cells to its right in the same row, and the cells below it in the same column. Its size is the **hook length** $h_\lambda(i,j)$. The hook-length formula is

$$
f^\lambda = \frac{n!}{\prod_{(i,j) \in Y(\lambda)} h_\lambda(i,j)},
$$

where $Y(\lambda)$ is the set of cells of the diagram.

For the staircase shape $\lambda = (3,2,1)$ the hook lengths are

```text
5 3 1
3 1
1
```

so the product is $5 \ast 3 \ast 1 \ast 3 \ast 1 \ast 1 = 45$, and

$$
f^{(3,2,1)} = \frac{6!}{45} = \frac{720}{45} = 16.
$$

The first values are worth memorizing, because they are the fastest check on a new implementation.

| Shape     | $n$ | Hook product | $f^\lambda$ |
| --------- | --- | ------------ | ----------- |
| $(1)$     | 1   | 1            | 1           |
| $(2)$     | 2   | 2            | 1           |
| $(1,1)$   | 2   | 2            | 1           |
| $(3)$     | 3   | 3            | 1           |
| $(2,1)$   | 3   | 3            | 2           |
| $(2,2)$   | 4   | 12           | 2           |
| $(3,1)$   | 4   | 8            | 3           |
| $(3,2)$   | 5   | 24           | 5           |
| $(3,2,1)$ | 6   | 45           | 16          |
| $(5,4,1)$ | 10  | 12600        | 288         |

The table already shows the two extremes. A single row or a single column has exactly one tableau, no matter how long it is, because the increasing condition forces the numbers into one order. A shape that is both tall and wide has many tableaux, and the count grows quickly.

The formula is exact over the integers. When the answer is reported modulo a prime $M$, the factorial and the hook product are formed modulo $M$, and the division becomes a multiplication by the inverse of the product:

$$
f^\lambda \equiv n! \ast \left(\prod_{(i,j)} h_\lambda(i,j)\right)^{-1} \pmod M.
$$

The inverse exists when $M$ is prime and no hook length is a multiple of $M$. For the usual modulus $10^9 + 7$ and a diagram with at most a few million cells, every hook is far below the modulus, so the condition holds automatically.

## Problem motivation

A problem gives the row lengths of a Young diagram and asks how many ways the numbers $1$ through $n$ can be placed so that every row and every column increases. This is a count of standard Young tableaux, and it appears whenever a two-dimensional order has to be linearized.

The direct approach fills the cells one at a time in increasing order. At every step the next number may go into any empty cell whose upper and left neighbors are already filled, and the number of complete fillings is exactly $f^\lambda$. The enumeration is correct and hopeless at the same time: it visits every object it is supposed to count.

The standard dynamic program is better but still not enough. A state is the vector of how many cells have been filled in each row, and the state changes by adding one cell at a corner. The number of states is

$$
\prod_{i=1}^{k} (\lambda_i + 1),
$$

which is small for the staircase $(3,2,1)$ and enormous for a staircase with fifty-five cells. For $\lambda = (10,9,\ldots,1)$ the product is $11! = 39916800$, which is already uncomfortable, and the number of tableaux itself is

$$
44261486084874072183645699204710400,
$$

a thirty-five digit number. No enumeration reaches it, and no state table holds it without a modulus.

The hook-length formula answers in time proportional to the number of cells. It does not visit a single tableau. The whole content of the technique is the product in the denominator and the reason that product is exactly what the factorial has overcounted.

The second motivation is the modular version. A contest statement usually says that the answer is large and must be printed modulo $10^9 + 7$. The formula is a quotient, and a quotient modulo a prime is a multiplication by an inverse. The factorial and the hook product are both easy to reduce, and the inverse costs $O(\log M)$ multiplications by Fermat's little theorem. The result is a linear-time algorithm with a logarithmic tail.

## Recognition patterns

The hook-length formula is the right tool when a statement contains a shape and a monotone filling condition.

- "The rows have lengths $a_1 \ge a_2 \ge \cdots \ge a_k$" and the cells are left-aligned.
- "Fill the diagram with $1$ through $n$" so that rows and columns increase.
- "In how many ways can the students be arranged so that heights decrease along every row and every column?"
- "Count the ways to stack blocks so that each pile increases upward and each row of piles increases to the right."
- "The answer is the number of standard Young tableaux of this shape."
- A permutation problem that names the Robinson-Schensted-Knuth correspondence, or asks for a count over shapes with a prescribed first row and first column.
- A count of linear extensions of a poset whose Hasse diagram is a Young diagram, or a forest whose hook-length formula is the tree version.

The constraint values decide whether the formula is enough or whether it is only one ingredient.

| Situation | What it rules |
| --- | --- |
| The whole shape is given as row lengths, $n \le 10^6$ | The hook-length formula is the whole solution |
| The answer is exact and $n \le 20$ | The formula works with ordinary integers, or with a wide type |
| The answer is exact and $n$ is large | The quotient has to be formed by cancellation or big integers |
| The answer is modulo a prime larger than every hook | The modular formula works directly |
| The modulus can divide a hook length | The inverse does not exist; the quotient needs a valuation argument |
| The shape is skew, written $\lambda / \mu$ | The simple hook formula does not apply; use Aitken's determinant |
| The filling is semistandard, with weak rows and strict columns | Use the hook-content formula or a Schur polynomial |
| The shape is only partially filled | Use a dynamic program over the unfilled cells |
| The problem sums over many shapes | Apply the formula once per shape, after enumerating the partitions |

The last three rows are the ones that produce wrong answers rather than crashes. A skew shape is not a Young diagram, and the hook lengths of the outer shape alone do not count its tableaux. A semistandard filling allows repeated numbers, so its count is not $f^\lambda$. A partially filled diagram has extra constraints that the formula cannot see.

Orientation is a smaller trap. Transposing a diagram, which swaps rows and columns, does not change the number of tableaux, because transposition is a bijection on fillings. So a statement that says "rows increase" or "columns increase" describes the same count after a transpose. What does change the count is using the wrong dimension in the hook length: a cell's hook uses the row length to its right and the column height below it, and swapping those two numbers changes the product.

## Naive approach

The first baseline places the numbers in increasing order. At each step it tries every empty cell whose upper neighbor and left neighbor are already filled.

```python
def count_fillings(rows):
    k = len(rows)
    filled = [0] * k
    total = 0

    def place(value):
        nonlocal total
        if value > sum(rows):
            total += 1
            return
        for i in range(k):
            if filled[i] == rows[i]:
                continue
            if i > 0 and filled[i] == filled[i - 1]:
                continue
            filled[i] += 1
            place(value + 1)
            filled[i] -= 1

    place(1)
    return total
```

This is correct, and it costs exactly $f^\lambda$ leaves. For the staircase $(10,9,\ldots,1)$ that is the thirty-five digit number above, so the program never finishes.

The second baseline removes the largest number instead. The largest number must sit at a corner, a cell with no cell to its right and no cell below it. Removing it leaves a smaller Young diagram, so the count satisfies

$$
f^\lambda = \sum_{c \in \operatorname{corner}(\lambda)} f^{\lambda - c},
\qquad f^{\varnothing} = 1.
$$

Memoizing on the vector of row lengths turns the enumeration into a dynamic program.

```python
from functools import lru_cache

def count_tableaux(rows):
    @lru_cache(maxsize=None)
    def count(shape):
        if not any(shape):
            return 1
        total = 0
        for i in range(len(shape)):
            if shape[i] == 0:
                continue
            if i + 1 < len(shape) and shape[i] == shape[i + 1]:
                continue
            smaller = list(shape)
            smaller[i] -= 1
            total += count(tuple(smaller))
        return total

    return count(tuple(rows))
```

The state is the vector of filled row lengths. There are $\prod_i (\lambda_i + 1)$ states, so the program is fast on $(3,2,1)$ and dies on a wide rectangle. For a $100 \times 100$ square the state count is $101^{100}$, which is far beyond any machine, even though the hook-length formula answers the same instance with ten thousand cells.

The third baseline is the factorial formula in a fixed-width integer. It forms $n!$, then divides by the hook product. At $n = 21$ the factorial overflows a signed 64-bit integer, and at $n = 55$ it overflows by many orders of magnitude. The quotient may be representable while the numerator is not, which is exactly the case the formula has to handle with a modulus.

## Key insight

The insight is that **the hook lengths measure the overcount in the factorial, and the overcount is multiplicative.**

There are $n!$ ways to write the numbers $1$ through $n$ into the cells if no monotonicity is required. A standard tableau is one of those writings. The hook-length formula says that each standard tableau is counted exactly $\prod h_\lambda(i,j)$ times by the $n!$ writings, in a weighted sense, so dividing by that product leaves the number of tableaux.

That statement is not obvious, and the clean proof is a recurrence. Let $H(\lambda) = \prod_{u \in \lambda} h_\lambda(u)$ and define

$$
g(\lambda) = \frac{n!}{H(\lambda)}.
$$

The number $f^\lambda$ satisfies the corner recurrence. If $g$ satisfies the same recurrence and the same base case, then $g = f^\lambda$ by induction on $n$. The base case is the empty diagram, where $0! = 1$ and the empty product is $1$.

So the whole formula reduces to one identity:

$$
g(\lambda) = \sum_{c \in \operatorname{corner}(\lambda)} g(\lambda - c).
$$

Substituting the definition and canceling $(n-1)!$ leaves

$$
\sum_{c \in \operatorname{corner}(\lambda)} \frac{H(\lambda)}{H(\lambda - c)} = n.
$$

This is the identity the hook lengths were built to satisfy. Removing a corner $c = (r,s)$ changes only the hooks in row $r$ and column $s$: every hook to the left of $c$ in its row loses one cell, every hook above $c$ in its column loses one cell, and $c$ itself has hook length $1$. Therefore

$$
\frac{H(\lambda)}{H(\lambda - c)}
=
\prod_{i < r} \frac{h_\lambda(i,s)}{h_\lambda(i,s) - 1}
\ast
\prod_{j < s} \frac{h_\lambda(r,j)}{h_\lambda(r,j) - 1}.
$$

The right-hand side is exactly the sum of the probabilities that a random **hook walk** started at a uniformly random cell ends at $c$. A hook walk starts at a cell, stops if the cell is a corner, and otherwise moves uniformly to a cell in its hook other than itself. Every walk ends at exactly one corner, so the probabilities over all corners sum to $1$ for each starting cell. Summing over the $n$ starting cells gives $n$ on the right, which is the identity.

That is the whole mechanism. The hook lengths are not an arbitrary product chosen to make the division exact; they are the absorption probabilities of the hook walk, and the corner recurrence turns those probabilities into the formula. The formal model below states the walk and the identity precisely.

A small example shows the arithmetic. For $\lambda = (2,1)$ the hook lengths are $3, 1, 1$, so $H(\lambda) = 3$ and $g(\lambda) = 6/3 = 2$. The corners are the cell in the second row and the last cell of the first row, and removing either leaves $(1,1)$ or $(2)$, both of which have one tableau. The recurrence gives $1 + 1 = 2$, which agrees.

## Visual intuition

Draw the hook lengths inside the cells. For $\lambda = (5,4,1)$ the diagram is

```text
7 5 4 3 1
5 3 2 1
1
```

Along a row the hook length decreases by at least one, and by exactly one only while the column height stays the same. Down a column it also decreases by at least one, and by exactly one only while the row length stays the same. The corner cells always carry $1$, and every other cell carries the sum of its right arm, its leg, and itself.

The product is

$$
7 \ast 5 \ast 4 \ast 3 \ast 1 \ast 5 \ast 3 \ast 2 \ast 1 \ast 1 = 12600,
$$

and $10! = 3628800$, so $f^{(5,4,1)} = 3628800 / 12600 = 288$.

A staircase has a particularly clean hook pattern. For $\lambda = (6,5,4,3,2,1)$ the rows are

```text
11 9 7 5 3 1
9 7 5 3 1
7 5 3 1
5 3 1
3 1
1
```

Every entry is odd, and the product is the product of the odd numbers with the multiplicities shown. The count is $100742649$ modulo $10^9 + 7$; the exact count is $1100742656$, which is larger than the modulus, so the modular answer is already different from the exact one.

The identity $\sum_{\lambda \vdash n} (f^\lambda)^2 = n!$ is a useful global check. For $n = 4$ the shapes and counts are

| Shape       | $f^\lambda$ | $(f^\lambda)^2$ |
| ----------- | ----------- | --------------- |
| $(4)$       | 1           | 1               |
| $(3,1)$     | 3           | 9               |
| $(2,2)$     | 2           | 4               |
| $(2,1,1)$   | 3           | 9               |
| $(1,1,1,1)$ | 1           | 1               |

The squares sum to $1 + 9 + 4 + 9 + 1 = 24 = 4!$. The identity is the RSK correspondence: permutations are paired tableaux of the same shape, so each shape contributes the square of its count.

## Formal model

::: math definition Definition
A **partition** of $n$ is a non-increasing sequence of positive integers

$$
\lambda = (\lambda_1, \lambda_2, \ldots, \lambda_k),
\qquad
\lambda_1 \ge \lambda_2 \ge \cdots \ge \lambda_k \ge 1,
\qquad
\sum_{i=1}^{k} \lambda_i = n.
$$

Its **Young diagram** is

$$
Y(\lambda) = \{(i,j) : 1 \le i \le k,\ 1 \le j \le \lambda_i\}.
$$

The **conjugate partition** $\lambda'$ has $\lambda'_j = |\{i : \lambda_i \ge j\}|$, the number of cells in column $j$.
:::

::: math definition Definition
The **hook** of a cell $(i,j)$ is

$$
H_\lambda(i,j)
=
\{(i,j'): j' \ge j\}
\cup
\{(i',j): i' \ge i\}.
$$

Its size is the **hook length**

$$
h_\lambda(i,j) = \lambda_i - j + \lambda'_j - i + 1.
$$

The first term counts the cell and the cells to its right, the second counts the cells strictly below it, and the $+1$ adds the cell itself. The product of all hook lengths is written $H(\lambda)$.
:::

::: math definition Definition
A **standard Young tableau** of shape $\lambda$ is a bijection $T : Y(\lambda) \to \{1, 2, \ldots, n\}$ such that

$$
T(i,j) < T(i,j+1)
\quad\text{and}\quad
T(i,j) < T(i+1,j)
$$

whenever both cells exist. The number of standard Young tableaux of shape $\lambda$ is $f^\lambda$.
:::

A cell is a **corner** if it has no cell to its right and no cell below it. Equivalently, its hook length is $1$.

::: math theorem Corner recurrence
For every partition $\lambda$,

$$
f^\lambda = \sum_{c \in \operatorname{corner}(\lambda)} f^{\lambda - c},
\qquad
f^{\varnothing} = 1.
$$
:::

::: math proof Proof
In a standard tableau of shape $\lambda$, the number $n$ occupies a cell that has no cell to its right and no cell below it, because any such cell would have to contain a number larger than $n$. So $n$ sits at a corner $c$. Removing $c$ and the number $n$ leaves a standard tableau of shape $\lambda - c$. Conversely, every standard tableau of shape $\lambda - c$ becomes one of shape $\lambda$ when $n$ is written into the missing corner. The map is a bijection, and the corners are disjoint cases, so the counts add. The empty diagram has exactly one tableau, the empty filling. $\square$
:::

::: math theorem Frame-Robinson-Thrall
For every partition $\lambda$ of $n$,

$$
f^\lambda = \frac{n!}{\prod_{u \in Y(\lambda)} h_\lambda(u)}.
$$
:::

The proof uses the hook walk. The walk is a probabilistic object, but its absorption probabilities are rational numbers with exactly the hook products in the denominator, which is why the formula is an integer identity.

::: math definition Definition
A **hook walk** starts at a cell $u \in Y(\lambda)$. If $u$ is a corner, the walk stops. Otherwise it chooses a cell uniformly at random from $H_\lambda(u) \setminus \{u\}$ and moves there. The walk terminates because every move increases the row index, the column index, or both.
:::

Let $P(u,c)$ be the probability that a walk started at $u$ stops at the corner $c$.

::: math lemma Lemma
For a corner $c = (r,s)$,

$$
\sum_{u \in Y(\lambda)} P(u,c)
=
\frac{H(\lambda)}{H(\lambda - c)}.
$$
:::

::: math proof Proof sketch
Compress the walk to the rows and columns it visits. A walk that ends at $c$ uses a set $I \subseteq \{1, \ldots, r-1\}$ of rows above $c$ and a set $J \subseteq \{1, \ldots, s-1\}$ of columns to the left of $c$. After deleting the unused rows and columns, the walk becomes a monotone path from the top-left cell to $c$ in the rectangle whose rows are $I \cup \{r\}$ and whose columns are $J \cup \{s\}$, ordered as they were in the original diagram.

For positive numbers $x_i$ indexed by $I$ and $y_j$ indexed by $J$, the weighted sum over monotone paths is

$$
\sum_{\text{paths } L} \prod_{(i,j) \in L \setminus \{\text{end}\}} \frac{1}{x_i + y_j}
=
\prod_{i \in I} \frac{1}{x_i}
\prod_{j \in J} \frac{1}{y_j}.
$$

The identity follows by viewing the terms as the probabilities of a random walk that moves down with probability $x_i/(x_i+y_j)$ and right with probability $y_j/(x_i+y_j)$; every path has probability $\prod_i x_i \prod_j y_j$ times its weight, and the total probability is $1$.

Substitute $x_i = h_\lambda(i,s) - 1$ and $y_j = h_\lambda(r,j) - 1$. For a cell $(i,j)$ in the compressed rectangle, the hook lengths satisfy the algebraic identity $h_\lambda(i,j) - 1 = x_i + y_j$; the corner condition makes the two hook expressions add up exactly, which is the bookkeeping that turns each move probability into a path weight. Summing over all choices of $I$ and $J$ multiplies the two products by $(1 + 1/x_i)$ and $(1 + 1/y_j)$, so

$$
\sum_{u} P(u,c)
=
\prod_{i=1}^{r-1} \left(1 + \frac{1}{h_\lambda(i,s) - 1}\right)
\prod_{j=1}^{s-1} \left(1 + \frac{1}{h_\lambda(r,j) - 1}\right)
=
\prod_{i=1}^{r-1} \frac{h_\lambda(i,s)}{h_\lambda(i,s) - 1}
\prod_{j=1}^{s-1} \frac{h_\lambda(r,j)}{h_\lambda(r,j) - 1}.
$$

Removing $c$ decreases exactly the hooks in row $r$ to its left and column $s$ above it, each by $1$, and removes the hook of $c$ itself, which is $1$. The last product is therefore $H(\lambda)/H(\lambda-c)$. $\square$
:::

::: math proof Proof of the hook-length formula
Every hook walk stops at exactly one corner, so for every starting cell $u$,

$$
\sum_{c \in \operatorname{corner}(\lambda)} P(u,c) = 1.
$$

Summing over the $n$ starting cells and exchanging the two sums gives

$$
\sum_{c \in \operatorname{corner}(\lambda)} \frac{H(\lambda)}{H(\lambda - c)} = n.
$$

Now define $g(\lambda) = n! / H(\lambda)$. Then

$$
\sum_{c} g(\lambda - c)
=
\sum_{c} \frac{(n-1)!}{H(\lambda - c)}
=
\frac{(n-1)!}{H(\lambda)}
\sum_{c} \frac{H(\lambda)}{H(\lambda - c)}
=
\frac{(n-1)!}{H(\lambda)} \ast n
=
g(\lambda).
$$

So $g$ satisfies the corner recurrence and $g(\varnothing) = 1$. The tableau count $f$ satisfies the same recurrence and the same base case. By induction on $n$, $g(\lambda) = f^\lambda$ for every partition. $\square$
:::

::: math invariant Invariant
After the algorithm has processed the first $i$ rows, `heights[j]` equals the number of rows among those $i$ whose length is greater than $j$, and after all rows it equals $\lambda'_{j+1}$ in zero-based indexing.
:::

## Algorithm derivation

The input is the row count $k$ followed by the non-increasing row lengths $\lambda_1, \ldots, \lambda_k$. The algorithm computes four quantities:

1. The total number of cells $n = \sum_i \lambda_i$.
2. The column heights $c_j = |\{i : \lambda_i > j\}|$ for $j = 0, 1, \ldots, \lambda_1 - 1$.
3. The numerator $n!$ modulo $M$.
4. The denominator $\prod_{(i,j)} h(i,j)$ modulo $M$.

The answer is the numerator times the inverse of the denominator modulo $M$.

The column heights are the conjugate partition. They can be built in one pass over the cells: for every row $i$, increment `heights[j]` for each column $j < \lambda_i$. The total number of increments is exactly $n$, so this step is linear.

With zero-based indices, the hook length of cell $(i,j)$ is

$$
h(i,j) = \lambda_i - j + c_j - i - 1.
$$

The term $\lambda_i - j$ counts the cell and the cells to its right. The term $c_j - i$ counts the cells below it, including the cell itself once more. Subtracting one removes the double count.

```cpp
constexpr long long kModulus = 1000000007LL;

long long mod_pow(long long base, long long exponent) {
    long long result = 1;
    base %= kModulus;
    while (exponent > 0) {
        if (exponent & 1LL) result = result * base % kModulus;
        base = base * base % kModulus;
        exponent >>= 1;
    }
    return result;
}

const int width = (k > 0) ? rows[0] : 0;
std::vector<int> heights(width, 0);
for (int i = 0; i < k; ++i)
    for (int j = 0; j < rows[i]; ++j)
        ++heights[j];

long long numerator = 1;
for (long long i = 2; i <= n; ++i)
    numerator = numerator * i % kModulus;

long long denominator = 1;
for (int i = 0; i < k; ++i) {
    for (int j = 0; j < rows[i]; ++j) {
        const long long hook = 1LL * rows[i] - j + heights[j] - i - 1;
        denominator = denominator * hook % kModulus;
    }
}

const long long answer = numerator * mod_pow(denominator, kModulus - 2) % kModulus;
```

The empty diagram is a real case. If $k = 0$, then $n = 0$, the width is zero, both products are empty and equal to one, and the program prints $1$. The corner recurrence agrees: the empty filling is the unique tableau of the empty shape.

The exact version replaces the final inverse with an integer division. That is legal because the hook-length formula is an identity over the integers, so the product divides $n!$. It is only practical for small $n$, because the factorial has to be formed exactly. The modular version is the one that scales.

The code never stores the diagram's cells. The row lengths and the column heights are enough, and their total size is $O(k + w)$, where $w = \lambda_1$. The hook of every cell is evaluated once, straight from those two arrays.

## Step-by-step execution

Take $\lambda = (3,2,1)$, so $n = 6$. The column heights are $c_0 = 3$, $c_1 = 2$, $c_2 = 1$. Evaluate every cell.

| Row $i$ | Column $j$ | $\lambda_i$ | $c_j$ | Hook $\lambda_i - j + c_j - i - 1$ |
| ------- | ---------- | ----------- | ----- | ---------------------------------- |
| 0       | 0          | 3           | 3     | $3 - 0 + 3 - 0 - 1 = 5$            |
| 0       | 1          | 3           | 2     | $3 - 1 + 2 - 0 - 1 = 3$            |
| 0       | 2          | 3           | 1     | $3 - 2 + 1 - 0 - 1 = 1$            |
| 1       | 0          | 2           | 3     | $2 - 0 + 3 - 1 - 1 = 3$            |
| 1       | 1          | 2           | 2     | $2 - 1 + 2 - 1 - 1 = 1$            |
| 2       | 0          | 1           | 3     | $1 - 0 + 3 - 2 - 1 = 1$            |

The product is $5 \ast 3 \ast 1 \ast 3 \ast 1 \ast 1 = 45$, and $6! = 720$, so the answer is $720 / 45 = 16$.

Now reduce the same computation modulo $7$, which is small enough to show the inverse explicitly.

| Quantity                    | Value           | Modulo $7$ |
| --------------------------- | --------------- | ---------- |
| $6!$                        | 720             | 6          |
| Hook product                | 45              | 3          |
| Inverse of the hook product | $3^{-1}$        | 5          |
| Product                     | $6 \ast 5 = 30$ | 2          |
| Exact answer                | 16              | 2          |

The inverse is $5$ because $3 \ast 5 = 15 = 2 \ast 7 + 1$. The modular result $2$ agrees with $16 \bmod 7 = 2$.

For a larger case, take the staircase $\lambda = (10,9,8,7,6,5,4,3,2,1)$, with $n = 55$. The hook product modulo $10^9 + 7$ is $110516768$, and $55!$ modulo $10^9 + 7$ is $269199917$. The final multiplication gives

$$
269199917 \ast 110516768^{-1} \equiv 896330428 \pmod{10^9 + 7}.
$$

The exact count is $44261486084874072183645699204710400$, whose residue modulo $10^9 + 7$ is also $896330428$. The modular computation never forms the thirty-five digit number.

The hook pattern of the staircase is worth checking by hand. Row $0$ has hooks $19, 17, 15, \ldots, 1$, row $1$ has $17, 15, \ldots, 1$, and so on. Every entry is odd, and the last cell of every row is a corner with hook $1$. The product is therefore a product of odd numbers, with the smaller odd numbers appearing more often.

## Correctness proof

::: math theorem Theorem
Let $\lambda$ be a partition of $n$, represented by its non-increasing row lengths. The algorithm prints $f^\lambda \bmod M$, where $M = 10^9 + 7$.
:::

::: math proof Proof
The proof has three parts: the formula is the true count, the array `heights` produces the true hook lengths, and the modular arithmetic preserves the residue.

**The formula is the true count.** The Frame-Robinson-Thrall theorem, proved in the formal model, states that $f^\lambda = n! / H(\lambda)$. The proof is by induction on $n$: both sides satisfy the corner recurrence and both equal $1$ on the empty diagram. The hook walk lemma supplies the identity $\sum_c H(\lambda)/H(\lambda-c) = n$ that makes the induction work.

**The heights produce the hook lengths.** After the loop over rows, `heights[j]` is the number of rows whose length is greater than $j$, which is exactly the number of cells in column $j$. In one-based notation this is $\lambda'_{j+1}$. The code evaluates

$$
\lambda_i - j + \text{heights}[j] - i - 1
=
\lambda_i - (j+1) + \lambda'_{j+1} - (i+1) + 1,
$$

which is the hook length formula of the formal model with one-based indices $i+1$ and $j+1$. Every cell is visited exactly once, and the product accumulates every hook length.

**The modular arithmetic preserves the residue.** The numerator is $n! \bmod M$, because each multiplication is reduced. The denominator is $H(\lambda) \bmod M$, for the same reason. Every hook length is between $1$ and $n$, and $n < M$ by the stated assumptions, so no hook is divisible by $M$. Since $M$ is prime, $H(\lambda) \not\equiv 0 \pmod M$, and Fermat's little theorem gives

$$
H(\lambda)^{M-1} \equiv 1 \pmod M,
\qquad
H(\lambda)^{-1} \equiv H(\lambda)^{M-2} \pmod M.
$$

The binary exponentiation computes that power. Therefore the printed value is

$$
n! \ast H(\lambda)^{-1} \equiv \frac{n!}{H(\lambda)} = f^\lambda \pmod M.
$$

The empty case is covered by the same argument: $n = 0$, both products are $1$, and the output is $1 = f^{\varnothing}$. $\square$
:::

The induction in the first part deserves one more sentence. The corner recurrence counts tableaux by the position of the largest number, and the hook walk identity counts the same corners by the probability that a walk ends there. The two counts are different descriptions of the same partition of the $n!$ orderings, which is why the product formula is not an approximation but an identity.

## Complexity analysis

| Method | Time | Space | Requirement |
| --- | --- | --- | --- |
| Enumerate every filling | $O(f^\lambda)$ | $O(n)$ | Only for tiny diagrams |
| Corner dynamic program | $O\left(\prod_i (\lambda_i + 1)\right)$ | $O\left(\prod_i (\lambda_i + 1)\right)$ | The state count must fit in memory |
| Hook-length formula, exact | $O(n)$ big-integer multiplications | $\Theta(n \log n)$ bits for $n!$ | $n$ small enough for exact arithmetic |
| Hook-length formula, modular | $O(n + w + \log M)$ | $O(k + w)$ | $M$ prime and larger than every hook |
| Determinant formula | $O(k^3 + n)$ | $O(k^2)$ | The shape has few rows |

**Time.** Building the column heights visits every cell once, so it is $O(n)$. The factorial loop runs $n - 1$ times. The hook loop visits every cell once. The modular inverse is binary exponentiation with exponent $M - 2$, which takes $O(\log M)$ multiplications, about thirty for $M = 10^9 + 7$. The total is $O(n + w + \log M)$, and since $w \le n$, it is $O(n + \log M)$.

**Space.** The row lengths take $O(k)$ and the column heights take $O(w)$. No cell grid is stored, and the factorial and the product are single words. The total is $O(k + w)$, which is at most $O(n)$.

**Why the formula wins.** The corner dynamic program has one state per vector of filled row lengths. For a staircase with $m$ rows the state count is $(m+1)!$, which is already $39916800$ at $m = 10$ and astronomical at $m = 50$. The hook-length formula replaces that table with two arrays and a single pass. The only price is the modular inverse, which is logarithmic and independent of the shape.

**Exact arithmetic.** If the exact answer is required, the factorial has $\Theta(n \log n)$ bits by Stirling's approximation, and the hook product has a comparable size. The quotient is much smaller, but forming the numerator first is wasteful. The modular version avoids the issue entirely. For an exact answer, cancel the hook factors against the factorial while multiplying, or use a prime factorization of the hook product.

**Modulus limits.** The inverse exists only when $M$ is prime and $M$ does not divide the hook product. If $n \ge M$, then $n!$ is $0$ modulo $M$, and the quotient can have a nonzero residue after cancellation; the simple inverse is then wrong. With $n \le 10^6$ and $M = 10^9 + 7$, neither problem occurs.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One shape, exact answer, $n \le 20$ | Hook-length formula with integer division |
| One shape, exact answer, larger $n$ | Hook-length formula with cancellation or big integers |
| One shape modulo a prime larger than every hook | Hook-length formula with one Fermat inverse |
| The modulus can divide a hook length | Track the $p$-adic valuation of the numerator and denominator |
| The shape is a single row or a single column | The answer is $1$; the formula also gives $1$ |
| The shape is a rectangle with many rows | The formula still works; there is also a product simplification |
| The shape is a staircase | The formula with the odd hook pattern |
| The shape is skew, $\lambda / \mu$ | Aitken's determinant formula, not the simple hook product |
| The filling is semistandard | The hook-content formula or a Schur polynomial |
| The diagram is partially filled | Dynamic programming over the unfilled cells |
| The problem sums over every shape of $n$ | Enumerate the partitions and apply the formula to each |
| The problem counts permutations through RSK | Sum $(f^\lambda)^2$ over the shapes that satisfy the condition |
| The poset is a rooted forest | The tree hook-length formula, with subtree sizes in place of hook lengths |

The first row is the one to reach for when the statement gives a shape directly. The last two rows are the ones where the formula is an ingredient rather than the whole solution: RSK problems need a sum over shapes, and forest posets need the tree version.

If the input gives row lengths in an arbitrary order, sort them into non-increasing order first. A Young diagram is defined by a partition, and the multiset of row lengths is the shape. Sorting does not change the intended diagram; keeping an unsorted list changes the column heights and therefore every hook length.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read one integer $k$, the number of rows.
2. Read $k$ non-increasing row lengths whose sum is $n$.
3. Print $f^\lambda$ modulo $1000000007$ on one line.

The value $k = 0$ is valid and prints $1$ for the empty diagram. A single row and a single column are also valid and print $1$. The input is whitespace-separated, so the row lengths may be on one line or spread over several lines. All six variants produce the same output on the shared fixtures, and the comparison normalizes the platform line ending.

The variants differ only in how they store the rows, the heights, and the modular products:

- The C variant uses `malloc` for the row lengths and `calloc` for the column heights. Every modular product is a `long long`, because two residues near $10^9$ multiply to about $10^{18}$.
- The C++ variant uses `std::vector<int>` for both arrays and a `long long` for the running products. The stream is untied because input and output are not interleaved.
- The Java variant uses `int` arrays for the shape and `long` for the products. The input is read in one pass with a `StringTokenizer`, which avoids the overhead of a `Scanner` call per token.
- The Python variant reads the whole input once and uses lists of arbitrary-precision integers, so the factorial and the hook product need no explicit width.
- The Pascal variant uses dynamic arrays of `LongInt`. It gives every `Read` exactly one argument, uses no `IOResult`, and includes `SysUtils`, which keeps it inside the subset that compiles under pas2js. Because the browser compiler represents `Int64` with a JavaScript number, every modular product goes through a three-limb routine whose partial products stay below $2^{50}$.
- The JavaScript variant uses `BigInt` for every modular product. A `Number` cannot represent the product of two residues near $10^9$ exactly, and the error would corrupt the denominator. The row lengths and the heights stay `Number` because they are small.

The manifest publishes only the `program` variant. There is no reusable `minimal` variant because the technique is a single pass over the shape: a class or a function would have to expose the row array, the height array, the modulus, and the inverse, and the caller would still write the same loop. The program is the smallest complete statement of the method.

## Recursion decision

The corner recurrence is recursive in appearance: $f^\lambda$ is written in terms of $f^{\lambda-c}$. A memoized recursive version is therefore tempting.

```python
from functools import lru_cache

def count_tableaux(rows):
    @lru_cache(maxsize=None)
    def count(shape):
        if not any(shape):
            return 1
        total = 0
        for i in range(len(shape)):
            if shape[i] == 0:
                continue
            if i + 1 < len(shape) and shape[i] == shape[i + 1]:
                continue
            smaller = list(shape)
            smaller[i] -= 1
            total += count(tuple(smaller))
        return total

    return count(tuple(rows))
```

This computes the same values, but it has two problems. The first is the stack: the chain of removals has depth $n$, so a Python program hits the interpreter limit of 1000 frames at $n = 1000$. The second is the state table: it has $\prod_i (\lambda_i + 1)$ entries, which is the dynamic program the formula was meant to replace. The recursion saves no work; it only moves the table from an array into a dictionary and adds call overhead.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | About 8 MB of stack | About $10^5$ frames | The iterative formula; recursion at $n = 10^5$ is unsafe |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The iterative formula |
| Python | Interpreter limit of 1000 | 1000 frames | The iterative formula |
| Pascal | The operating system stack | Depends on the platform | The iterative formula |
| JavaScript | The V8 engine limit | About $10^4$ frames | The iterative formula |

The hook-length formula has no recursion at all. The only loops are the pass that builds the column heights, the factorial loop, the hook loop, and the exponentiation loop. The iterative version also handles the empty shape naturally, because every loop has an empty range and every product starts at one.

## Implementation walkthrough

Four details decide whether the program is correct.

**Build the column heights before the hooks.** The hook length of a cell needs the height of its column. The heights are the conjugate partition, and the cheapest way to build them is to increment every column of every row:

```cpp
for (int i = 0; i < k; ++i)
    for (int j = 0; j < rows[i]; ++j)
        ++heights[j];
```

The total work is the number of cells, not the number of rows times the width. If the rows were not sorted, this loop would still count cells, but the result would not be the conjugate of a partition, so sort the rows first.

**Use the zero-based hook formula consistently.** With zero-based indices,

$$
h(i,j) = \lambda_i - j + c_j - i - 1.
$$

The first two terms count the cell and its right arm. The next two count the cell and its leg. The final subtraction removes the cell's double count. A common error is to write `rows[i] - j + heights[j] - i`, which is one too large for every cell and multiplies the denominator by an extra factor that grows with the shape.

**Invert the denominator with Fermat, not with floating point.** The modulus is prime, so

```cpp
long long answer = numerator * mod_pow(denominator, kModulus - 2) % kModulus;
```

The exponent is $10^9 + 5$, which fits in a signed 32-bit integer, but the multiplication inside `mod_pow` needs 64 bits. In JavaScript the same multiplication needs `BigInt`; in Pascal it needs the limb routine because pas2js stores `Int64` in a double.

**Handle the empty and degenerate shapes.** If $k = 0$, the width is zero and both products are one, so the answer is one. If the shape is a single row or a single column, every hook length is a distinct positive integer, the product is $n!$, and the quotient is one. These cases are worth a fixture because they exercise the loop bounds and the empty array access.

A compact Python core is:

```python
n = sum(rows)
width = rows[0] if rows else 0
heights = [0] * width
for row in rows:
    for column in range(row):
        heights[column] += 1

numerator = 1
for value in range(2, n + 1):
    numerator = numerator * value % MODULUS

denominator = 1
for index, row in enumerate(rows):
    for column in range(row):
        hook = row - column + heights[column] - index - 1
        denominator = denominator * hook % MODULUS

answer = numerator * pow(denominator, MODULUS - 2, MODULUS) % MODULUS
```

This version reduces once per multiplication with `%`, which is fine in Python because the intermediate is a small multiple of the modulus. The C, C++, Java, and Pascal variants use the same structure with fixed-width integers, and the JavaScript variant uses `BigInt` for the two products.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using the row length instead of the column height | The hook of a cell is too small, and the answer is too large | Build `heights[j]` from the conjugate partition |
| Forgetting the `- 1` in the zero-based formula | Every hook is one too large, and the denominator is wrong | Derive the formula once with one-based indices, then translate |
| Forming $n!$ exactly in a fixed-width type | The factorial overflows long before the quotient does | Reduce the factorial modulo $M$ |
| Multiplying two residues in a JavaScript `Number` | The product exceeds $2^{53}$ and loses precision | Use `BigInt` or a limb routine |
| Inverting a denominator that is $0$ modulo $M$ | The inverse does not exist and the program crashes or prints nonsense | Check that $M$ is prime and $M$ is larger than every hook |
| Applying the formula to a skew shape | The hook product of the outer shape counts the wrong objects | Use Aitken's determinant for $\lambda / \mu$ |
| Treating a semistandard filling as standard | Repeated numbers are allowed, so the count is different | Use the hook-content formula |
| Assuming the rows are already sorted | The column heights are not the conjugate of a partition | Sort the row lengths into non-increasing order |
| Reading a full grid instead of row lengths | The input format is different, and the shape is ambiguous | Read $k$ and the $k$ row lengths |

### Why this fails: a hook built from the wrong dimension

Take $\lambda = (3,2,1)$ and compute the hook of the cell in row $1$, column $0$ (zero-based). The correct height of column $0$ is $3$, so the hook is

$$
2 - 0 + 3 - 1 - 1 = 3.
$$

A program that uses the row length instead of the column height computes

$$
2 - 0 + 2 - 1 - 1 = 2.
$$

Every other cell may be computed correctly, but the denominator becomes $5 \ast 3 \ast 1 \ast 2 \ast 1 \ast 1 = 30$ instead of $45$. The program prints $720 / 30 = 24$, while the correct answer is $16$. The result is a plausible integer, which is what makes the bug dangerous: nothing crashes, and the output is wrong by a factor that depends on the shape.

The same cell exposes the off-by-one error. Dropping the final `- 1` for that cell gives $4$ instead of $3$, and the denominator becomes $60$, so the program prints $12$. If the term is dropped for every cell, the product for this shape becomes $768$, which does not even divide $6!$.

The modular version has its own failure mode. If $M$ divides a hook length, the denominator is $0$ modulo $M$, and Fermat's little theorem gives $0^{M-2} = 0$, not an inverse. The program then prints $0$ or divides by zero, depending on the language. With $n < M$ this cannot happen, but a problem that allows $n \ge M$ needs a $p$-adic valuation of the numerator and the denominator before the inverse.

The lesson generalizes: **a quotient formula is only as good as its denominator.** The combinatorial identity is exact, but the modular evaluation is legal only when the denominator is invertible, and the hook computation is legal only when every hook is read from the correct row and column.

## Variants and extensions

- **Rectangular shapes.** For a rectangle with $a$ rows and $b$ columns, the hook lengths are $(a-i) + (b-j) + 1$ for $1 \le i \le a$ and $1 \le j \le b$. The formula becomes a double product. For a square, the count is the number of standard Young tableaux of the square, which is $2$ for $2 \times 2$, $42$ for $3 \times 3$, and $24024$ for $4 \times 4$.
- **Two-row shapes.** For $\lambda = (n-k,k)$ with $k \le n/2$, the hook product simplifies to

$$
f^{(n-k,k)} = \frac{n-2k+1}{n-k+1}\binom{n}{k}.
$$

This is the ballot-number form of the count, and it is a useful closed-form check on the product code.

- **Catalan shapes.** The two-row rectangle $(n,n)$ gives $f^{(n,n)} = C_n$, the $n$-th Catalan number. The hook formula reduces to $\frac{(2n)!}{(n+1)!n!}$, which is the reflection-principle count of Dyck paths.
- **Staircase shapes.** For $\delta_m = (m, m-1, \ldots, 1)$ the hooks are the odd numbers, with multiplicities $m, m-1, \ldots, 1$. The product is $\prod_{r=1}^{m}(2r-1)^{m-r+1}$, and the count is $n!$ divided by that product, where $n = m(m+1)/2$.
- **Skew shapes.** For $\lambda / \mu$, the number of standard skew tableaux is given by Aitken's determinant

$$
f^{\lambda/\mu} = n! \det\left[\frac{1}{(\lambda_i - \mu_j - i + j)!}\right]_{i,j=1}^{k},
$$

with the convention that $1/m! = 0$ for $m < 0$. The simple hook product is the special case $\mu = \varnothing$.

- **Semistandard tableaux.** If rows are weakly increasing and columns strictly increasing, the count with entries at most $m$ is the hook-content product $\prod_{(i,j)} (m + j - i)/h_\lambda(i,j)$, which is the specialization of the Schur polynomial $s_\lambda(1,1,\ldots,1)$ with $m$ ones. The standard case is the specialization with no repeated entries.
- **Forest posets.** For a rooted forest, the number of linear extensions is $n! / \prod_v \operatorname{subtree}(v)$, where the subtree size plays the role of the hook length. A Young diagram is a special case of a two-dimensional poset, and the tree formula is a different generalization of the same product idea.
- **RSK and permutation statistics.** The Robinson-Schensted-Knuth correspondence pairs permutations with two standard tableaux of the same shape, so the number of permutations whose RSK shape is $\lambda$ is $(f^\lambda)^2$. Summing over shapes gives $\sum_\lambda (f^\lambda)^2 = n!$, and restricting the shapes gives counts of permutations with prescribed LIS or LDS behavior.
- **The $q$-analogue.** The major index of a standard tableau gives a $q$-hook formula, which refines the count by a statistic. At $q = 1$ it reduces to the ordinary hook-length formula.

## Contest strategy

1. Decide whether the statement gives a shape, a permutation statistic, or a partially filled board. The hook-length formula applies directly only to the first.
2. Normalize the row lengths into non-increasing order. The multiset is the shape; the order in the input is not part of the structure.
3. Choose the arithmetic. For a small exact answer, integer division is fine. For a large or modular answer, reduce the factorial and the hook product and invert the product.
4. Check the modulus. The inverse needs a prime modulus, and the simple inverse needs every hook to be smaller than the modulus. If either condition fails, the program needs a valuation argument.
5. Build the column heights in one pass. Do not store the full grid; the row lengths and the heights contain every hook length.
6. Test the degenerate shapes: the empty diagram, a single row, a single column, and a two-by-two square. These catch loop bounds and index errors before the large cases.
7. If the count is a sum over shapes, write the shape enumeration first. The hook-length formula is then a function called once per shape, and the sum is easy to check against a brute force for small $n$.

## Worked problems

### Problem 1: Mr. Young's Picture Permutations

**Restatement.** Students stand in at most five rows, with row lengths non-increasing from back to front. Heights decrease from left to right in every row and from back to front in every column. Count the arrangements for each case; the input ends with a row count of $0$.

**Naive baseline.** The corner dynamic program over the vector of filled row lengths. With at most thirty students and five rows, the state count is at most $31^5$, which is too large for a comfortable margin, although the thirty-student limit prunes most of those states.

**Insight.** Reversing the heights turns the arrangement into a standard Young tableau of the shape given by the row lengths. The answer is $f^\lambda$.

**Derivation.** Build the column heights from the row lengths, multiply the hook lengths, and divide $n!$ by the product. The count is exact because $n \le 30$.

**Correctness.** The bijection between height arrangements and standard tableaux is exact: the tallest student becomes $1$, the next tallest becomes $2$, and the two decrease conditions become the row and column increase conditions. The hook-length formula then gives the number of tableaux.

**Complexity.** $O(n)$ time and $O(n)$ space per case, with $n \le 30$.

**Common wrong approach.** Using the row length as the leg of a hook, which ignores the column heights. At the cell in row $1$, column $0$ of the sample $3,2,1$, the row length is $2$ but the column height is $3$; the wrong hook makes the denominator $30$ and the program prints $24$ instead of $16$.

### Problem 2: Numbering Blocks

**Restatement.** Three piles contain $a_1 \ge a_2 \ge a_3$ blocks. Write $1$ through $N = a_1 + a_2 + a_3$ into the blocks so that each pile increases upward and each row of piles increases from left to right. Count the writings.

**Naive baseline.** Enumerate all $N!$ assignments and test the two conditions. With $N \le 9$ this is at most $362880$ assignments, which is feasible, and it is the reference implementation for small samples.

**Insight.** Transposing the picture turns the three piles into three rows of lengths $a_1, a_2, a_3$. The upward increase in a pile becomes the left-to-right increase in its row, and the left-to-right order of the piles becomes the top-to-bottom order of the rows, so the writings are exactly the standard Young tableaux of shape $(a_1,a_2,a_3)$.

**Derivation.** The shape has at most three rows and nine cells. Compute the hook lengths from the three row lengths, multiply them, and divide $N!$ by the product. The exact answer fits in a 32-bit integer.

**Correctness.** The transpose is a bijection on writings: it preserves the two incidences and exchanges the two directions. The resulting objects are standard tableaux, so the hook-length formula counts them.

**Complexity.** $O(N)$ time and $O(1)$ space, with $N \le 9$.

**Common wrong approach.** Assuming the answer is $N!$ divided by a factorial of the number of piles, or another multinomial count, which ignores the row and column increase conditions. The hook product is the factor that encodes both conditions.

### Problem 3: Disjoint LIS

**Restatement.** A permutation is good if it contains two increasing subsequences of length equal to its LIS that share no element. Given $n \le 75$, count the good permutations modulo $998244353$.

**Naive baseline.** Enumerate all $n!$ permutations and compute the LIS and the best two disjoint increasing subsequences by dynamic programming. At $n = 10$ this is already $3628800$ permutations, and at $n = 75$ it is hopeless.

**Insight.** The Robinson-Schensted-Knuth correspondence maps a permutation to a pair of standard Young tableaux of the same shape $\lambda$. The first row $\lambda_1$ is the LIS length, and Greene's theorem says the maximum total length of two disjoint increasing subsequences is $\lambda_1 + \lambda_2$. Two disjoint subsequences of length $\lambda_1$ exist exactly when $\lambda_1 + \lambda_2 \ge 2\lambda_1$, which is $\lambda_2 \ge \lambda_1$. Since the rows are non-increasing, this means $\lambda_1 = \lambda_2$.

**Derivation.** Enumerate every partition $\lambda$ of $n$ with $\lambda_1 = \lambda_2$. For each one, compute $f^\lambda$ with the hook-length formula, add $(f^\lambda)^2$ modulo $998244353$, and print the sum. The square appears because a permutation corresponds to a pair of tableaux of the same shape.

**Correctness.** RSK is a bijection between permutations and ordered pairs of standard tableaux of the same shape. Greene's theorem identifies the best two disjoint subsequences with the first two rows. The condition $\lambda_1 = \lambda_2$ is therefore necessary and sufficient, and the sum over shapes counts each good permutation exactly once.

**Complexity.** There are $p(75) = 8118264$ partitions in the worst case, but the shapes with equal first two rows are far fewer. Each hook computation costs $O(n)$, and the shape generation costs the number of partitions. With $n = 75$ the enumeration is comfortable in C++ and Java.

**Common wrong approach.** Counting only the rectangular shapes, or forgetting to square $f^\lambda$. A shape with $\lambda_1 = \lambda_2$ can have any number of rows below the second, and every such shape contributes. The sample $n = 6$ gives $5^2 + 9^2 + 5^2 + 1^2 = 132$ over the four shapes $(3,3)$, $(2,2,1,1)$, $(2,2,2)$, and $(1,1,1,1,1,1)$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the objects are standard tableaux, semistandard tableaux, skew tableaux, or linear extensions of a different poset. The formula applies directly only to the first.
2. **Direct application.** Implement the hook product for a shape and compare it with the corner dynamic program for every partition of $n \le 10$. The two counts must agree exactly.
3. **Modular arithmetic.** Replace the exact division with a factorial modulo $M$, a hook product modulo $M$, and one Fermat inverse. Check the result against the exact count for small shapes.
4. **Adaptation.** Handle the empty diagram, a single row, a single column, and a rectangle. Add the two-row closed form and the Catalan specialization as checks.
5. **Combination.** Use RSK to count permutations by shape, and sum $(f^\lambda)^2$ over the shapes that satisfy a condition. This is the step from a formula to a counting strategy.
6. **Transfer.** Recognize the formula inside a larger problem: a partially filled board that reduces to a shape after fixing some cells, a poset whose Hasse diagram is a forest, or a skew shape that needs Aitken's determinant. Where the count must be reduced, use [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Define the hook of a cell and write its length in terms of the row length and the column height. (Formal model)
2. State the hook-length formula and compute $f^{(3,2,1)}$ by hand. (At a glance)
3. Why does the corner recurrence hold, and what is the base case? (Formal model)
4. What does a hook walk do, and where does it stop? (Formal model)
5. Why does the hook walk identity imply the hook-length formula? (Correctness proof)
6. How are the column heights built, and why is the pass linear in the number of cells? (Algorithm derivation)
7. Why is the modular division a multiplication by an inverse, and when does the inverse fail to exist? (Complexity analysis)
8. What goes wrong if the leg of a hook is taken from the row length instead of the column height? (Common mistakes)
9. Why is a JavaScript `Number` unable to compute the modular product directly? (Reference implementations)
10. How does RSK turn a permutation count into a sum of squares of hook-length counts? (Worked problems)

## Further reading

- The counting argument behind the factorial, and the modular product that computes a binomial coefficient without overflow, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The unordered sums that produce the shapes counted here are in [integer partitions](/algorithms/combinatorics/integer-partitions).
- The multinomial count that divides a factorial by several factorials is the same cancellation idea in a simpler setting, in [multinomial coefficients](/algorithms/combinatorics/multinomial-coefficients).
- The formal power series that package the counts of a shape are in [generating functions](/algorithms/combinatorics/generating-functions).
- The reflection argument that gives the Catalan special case is in [the reflection principle](/algorithms/combinatorics/reflection-principle).
- The stars-and-bars bijection, which counts the weak compositions that underlie many shape counts, is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The counting dynamic program over states, which is the alternative when the shape is only partially fixed, is in [counting DP](/algorithms/combinatorics/counting-dp).
- The modular inverse and Fermat's little theorem that make the division legal are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The dynamic program that computes the LIS length, which RSK identifies with the first row of the shape, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The table-filling dynamic program that counts subsets, and is the reference for small shapes, is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The subject index lists this technique beside the counting arguments it builds on: [the combinatorics](/algorithms/combinatorics/).
