---
id: number-theory.matrix-exponentiation
title: Matrix exponentiation
summary: Count the walks of a given length in a graph, or evaluate a linear recurrence at a huge index, by raising a matrix to a power with exponentiation by squaring.
division: [gold, platinum]
subjects: [number-theory]
level: advanced
importance: advanced-technique
keywords:
    [
        matrix exponentiation,
        adjacency matrix,
        walk counting,
        linear recurrence,
        exponentiation by squaring,
        fast power,
        overflow,
        fibonacci matrix,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic]
    recommended:
        [graphs.representation, dynamic-programming.0-1-knapsack, foundations.binary-representation]
complexity:
    time: "O(n^3 log k)"
    space: "O(n^2)"
assumptions:
    - The modulus is a positive integer, and the answer is required modulo that modulus.
    - Every intermediate product is reduced modulo the modulus before it is used again.
reviewed: false
---

## At a glance

The $k$-th power of the adjacency matrix of a graph counts the walks of length $k$ between its vertices. Exponentiation by squaring raises a matrix to a power in $O(\log k)$ matrix multiplications instead of $k$.

| Property | Value |
| --- | --- |
| **Problem** | Count the walks of length $k$ in a graph, or evaluate a linear recurrence at index $k$ |
| **Encoding** | The $(i,j)$ entry of $A^k$ is the number of walks of length $k$ from $i$ to $j$ |
| **Time** | $O(n^3 \log k)$ for an $n$ by $n$ matrix |
| **Auxiliary space** | $O(n^2)$ |
| **Requires** | A matrix of at most a few hundred rows, and a modulus |
| **Fails when** | The matrix is large, in which case the structure of the recurrence must be used instead |

The technique has two faces that are worth separating. It is a way to compute a power quickly, and it is a way to turn a linear recurrence into a matrix. The first is a technique in its own right; the second is where the contest problems are.

## Problem motivation

A robot moves on a graph with $n \le 200$ vertices and $m \le 5000$ edges. The problem asks for the number of walks of length exactly $k = 10^{18}$ from vertex $1$ to vertex $n$, modulo $10^9 + 7$.

The naive baseline is the dynamic program that the problem is obviously about: let $f(t)$ be the vector of the number of walks of length $t$ ending at each vertex, and compute $f(t+1)$ from $f(t)$ by adding the counts along the edges. That is $O(m)$ per step and $O(km)$ in total, and at $k = 10^{18}$ it never finishes.

The second baseline is worse. Writing the update as a matrix multiplication gives $f(t+1) = A f(t)$ for the adjacency matrix $A$, and iterating that directly costs $O(k n^3)$, which is worse than the $O(km)$ of the edge list, not better.

The insight is that the update is the same every time. After $k$ steps the vector is $A^k f(0)$, and the whole point of the $k$ steps is that they compose. Composition is multiplication, so the answer is a matrix power, and a matrix power is computed by squaring: $A^{2m} = (A^m)^2$, so a power of $k$ needs only $\lceil \log_2 k \rceil \approx 60$ matrix multiplications.

The second problem in the family is the same technique with a different encoding. A problem asks for the $10^{18}$-th Fibonacci number modulo $10^9+7$. The Fibonacci recurrence is linear, so it can be written as a $2 \times 2$ matrix recurrence, and the same squaring applies. The matrix is two rows, so the time is $O(8 \log k)$, which is instant.

## Recognition patterns

Matrix exponentiation is the right tool when the statement contains some of these phrases.

- "In how many ways", "count the paths", "the number of walks", "the number of routes of length $k$".
- A very large exponent or a very large number of steps, such as $10^{18}$, $10^9$, or "until the year 10^9".
- "The $n$-th term of the sequence", for a sequence given by a linear recurrence.
- A state that is updated by the same rule every step, where the number of steps is too large to simulate.
- A graph with a modest number of vertices, and a length that is not.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 200$ vertices | $n^3 \log k$ is about $60 \times 8 \times 10^6$, which runs in a few seconds |
| $n \le 1000$ vertices | $n^3 \log k$ is about $6 \times 10^{10}$, which is too slow |
| $k \le 10^5$ | The direct iteration is faster than the squaring, because the constant of the squaring is larger |
| $k = 10^{18}$ | Only the squaring is possible |
| The recurrence has order $d \le 10$ | The matrix is $d$ by $d$ and the whole thing is instant |
| The answer is wanted exactly | The count grows exponentially and does not fit, so the problem must want a modulus |
| The modulus is $10^9 + 7$ | The product of two residues fits in a signed 64-bit integer |
| The modulus is near $2^{63}$ | The product of two residues needs a 128-bit intermediate |

The third row is worth internalizing. Matrix exponentiation is not always the right answer. When the number of steps is small, the plain iteration is simpler and faster, and the difference is the constant factor of a matrix multiplication against a sparse edge traversal.

## Naive approach

The baseline is the iteration.

```python
def count_walks(n, edges, k, mod=10**9 + 7):
    ways = [0] * n
    ways[0] = 1
    for _ in range(k):
        nxt = [0] * n
        for u, v in edges:
            nxt[v] = (nxt[v] + ways[u]) % mod
        ways = nxt
    return ways[n - 1]
```

This is correct, it is $O(km)$, and it is the reference implementation for the differential test. It is also the answer for any problem where $k$ is small enough, and it should be written first so that the fast version has something to be checked against.

The second baseline is the matrix version of the same iteration, which is the trap.

```python
def power_naive(matrix, k, mod=10**9 + 7):
    result = identity(len(matrix))
    for _ in range(k):
        result = multiply(result, matrix, mod)
    return result
```

This is $O(k n^3)$ and it is strictly worse than the edge-list iteration, because a matrix multiplication touches every pair of rows whether or not there is an edge. It is the natural first attempt once the matrix encoding is understood, and it is the reason the squaring is worth learning.

## Key insight

The insight is that **the update is linear, and a linear update composes.**

Write the state of a walk as a column vector $f$ of counts, one per vertex. One step of the walk multiplies the state by a matrix $A$, the adjacency matrix of the graph: $f' = A f$. The entry $(A)_{ij}$ is the number of edges from $i$ to $j$, which is $1$ for a simple graph and more for a multigraph.

Because the update is the same matrix every step, $k$ steps give $f^{(k)} = A^k f^{(0)}$, and the number of walks of length $k$ from $s$ to $t$ is the $(s,t)$ entry of $A^k$. The proof is that multiplying by $A$ once extends every walk by one edge, and the matrix multiplication counts exactly the ways to choose the intermediate vertex.

The second insight is that **a power is computed from its own squares.** Since $A^{2m} = (A^m)^2$, the binary expansion of $k$ turns the power into a chain of squarings and a handful of multiplications. The invariant of the loop is

$$
\text{result} \cdot \text{base}^{e} = A^{k},
$$

and each iteration either squares the base and halves the exponent, or multiplies the result by the base and decrements the exponent. The loop ends when the exponent is zero, at which point the result is $A^k$.

The third insight is that **a linear recurrence has a matrix form.** A sequence satisfying $f(n) = c_1 f(n-1) + \cdots + c_d f(n-d)$ is exactly the sequence of first coordinates of the iterates of the companion matrix

$$
M = \begin{pmatrix}
c_1 & c_2 & \cdots & c_d \\
1 & 0 & \cdots & 0 \\
0 & 1 & \cdots & 0 \\
\vdots & & \ddots & \vdots
\end{pmatrix}.
$$

So a matrix power answers the "find the $n$-th term of a recurrence" problem, and the size of the matrix is the order of the recurrence, which is usually two or three.

## Formal model

Let $G = (V, E)$ be a directed graph with $n$ vertices.

::: math definition Definition
The **adjacency matrix** $A$ of $G$ is the $n$ by $n$ matrix with $A_{ij}$ equal to the number of edges from $i$ to $j$. A **walk of length $k$** from $i$ to $j$ is a sequence $v_0 = i, v_1, \ldots, v_k = j$ of vertices with an edge from $v_{t-1}$ to $v_t$ for every $t$. Vertices may repeat.
:::

::: math lemma Lemma
For every $k \ge 1$, the entry $(A^k)_{ij}$ equals the number of walks of length $k$ from $i$ to $j$.
:::

::: math proof Proof
The statement is clear for $k = 1$, because $A_{ij}$ is the number of edges from $i$ to $j$, which is the number of walks of length one. Assume it holds for $k$. Then

$$
(A^{k+1})_{ij} = \sum_{t=1}^{n} (A^k)_{it} A_{tj},
$$

and by the induction hypothesis $(A^k)_{it}$ counts the walks of length $k$ from $i$ to $t$, while $A_{tj}$ counts the edges from $t$ to $j$. Every walk of length $k+1$ from $i$ to $j$ has a unique vertex $t$ at position $k$, and it is obtained uniquely by choosing such a walk and such an edge, so the sum counts each walk exactly once. $\square$
:::

::: math invariant Invariant
During the exponentiation by squaring, the loop maintains $\text{result} \cdot \text{base}^{e} = A^{k}$ in the semiring of matrices modulo the modulus. Initialization holds because the result is the identity matrix, the base is $A$, and the exponent is $k$. Each iteration squares the base and halves the exponent when the exponent is even, which replaces $\text{base}^{e}$ by $(\text{base}^2)^{e/2}$ and leaves the product unchanged, and multiplies the result by the base and decrements the exponent when it is odd, which replaces $\text{base}^{e}$ by $\text{base}^{e-1}$ and absorbs the base into the result. The invariant is preserved, and at termination $e = 0$ the result is $A^{k}$.
:::

## Algorithm derivation

The multiplication of two matrices is the ordinary triple loop, with the reduction applied inside.

```cpp
Matrix multiply(const Matrix& a, const Matrix& b, long long mod) {
    const int n = (int)a.size();
    Matrix c(n, vector<long long>(n, 0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            long long acc = 0;
            for (int k = 0; k < n; ++k) {
                acc = (acc + a[i][k] * b[k][j]) % mod;
            }
            c[i][j] = acc;
        }
    }
    return c;
}
```

The reduction inside the innermost loop is not optional. The accumulator reaches $n (m-1)^2$ if it is not reduced, and for $n = 200$ and $m = 10^9 + 7$ that is about $2 \times 10^{20}$, which does not fit in a signed 64-bit integer.

The power is then the standard binary method.

```cpp
Matrix power(Matrix base, long long exponent, long long mod) {
    const int n = (int)base.size();
    Matrix result(n, vector<long long>(n, 0));
    for (int i = 0; i < n; ++i) result[i][i] = 1;
    while (exponent > 0) {
        if (exponent & 1) result = multiply(result, base, mod);
        base = multiply(base, base, mod);
        exponent >>= 1;
    }
    return result;
}
```

The order of the two statements inside the loop is not important for correctness, because multiplication of matrices is not commutative in general, but both the accumulator and the base are being multiplied by factors of $A$, and every power of $A$ commutes with every other power of $A$. The multiplication `result = multiply(result, base)` is the accumulation, and `base = multiply(base, base)` is the squaring.

The answer is then read out of the matrix. For the walk problem it is $(A^k)_{sn}$. For a recurrence of order $d$ with the state vector $(f(n), f(n-1), \ldots, f(n-d+1))$ it is the first coordinate of $M^{n-n_0}$ applied to the initial state.

## Step-by-step execution

Take the graph with two vertices and three edges: $1 \to 1$, $1 \to 2$ and $2 \to 1$. Its adjacency matrix is

$$
A = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}.
$$

We want the number of walks of length $5$ from vertex $1$ to vertex $1$.

**Squaring.** $A^2 = A \cdot A = \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$ and $A^4 = (A^2)^2 = \begin{pmatrix} 5 & 3 \\ 3 & 2 \end{pmatrix}$. The binary expansion of $5$ is $101$, so

$$
A^5 = A^4 \cdot A = \begin{pmatrix} 5 & 3 \\ 3 & 2 \end{pmatrix}
\begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}
= \begin{pmatrix} 8 & 5 \\ 5 & 3 \end{pmatrix}.
$$

**The answer.** The $(1,1)$ entry is $8$. To see why without a matrix, let $a(n)$ be the number of walks of length $n$ from vertex $1$ to vertex $1$, and $b(n)$ the number of walks of length $n$ from vertex $1$ to vertex $2$. A walk ends at vertex $1$ either by staying there or by coming back from vertex $2$, and it ends at vertex $2$ only by moving there, so $a(n+1) = a(n) + b(n)$ and $b(n+1) = a(n)$, with $a(0) = 1$ and $b(0) = 0$. The pairs are $(1,0)$, $(1,1)$, $(2,1)$, $(3,2)$, $(5,3)$, $(8,5)$ for $n = 0$ to $5$, so $a(5) = 8$. This is the Fibonacci sequence, and it is the same recurrence that the matrix encodes.

**The binary method.** With $k = 5$ the loop runs as follows. The result starts as the identity and the base as $A$. The exponent is $5$, which is odd, so the result becomes $A$ and the base becomes $A^2$, and the exponent becomes $2$. The exponent is even, so the base becomes $A^4$ and the exponent becomes $1$. The exponent is odd, so the result becomes $A \cdot A^4 = A^5$, the base becomes $A^8$, and the exponent becomes $0$. The loop ends with the result equal to $A^5$, and three matrix multiplications were used instead of five.

## Correctness proof

::: math theorem Theorem
The exponentiation by squaring returns $A^k$ modulo the modulus, and therefore the $(s,t)$ entry of the result is the number of walks of length $k$ from $s$ to $t$ modulo the modulus.
:::

::: math proof Proof
**The power.** The invariant is the statement in the panel above. It holds at initialization, because the identity matrix times $A^k$ is $A^k$. When the exponent is even, the loop replaces the base by its square and the exponent by its half, and $\text{base}^2{}^{e/2} = (\text{base}^2)^{e/2} = \text{base}^{e}$, so the product $\text{result} \cdot \text{base}^{e}$ is unchanged. When the exponent is odd, the loop replaces the result by $\text{result} \cdot \text{base}$, the base by its square and the exponent by $e-1$, and $\text{result} \cdot \text{base} \cdot (\text{base}^2)^{(e-1)/2} = \text{result} \cdot \text{base}^{e}$, so the product is again unchanged. The exponent is halved or decremented at every iteration, so it strictly decreases and the loop terminates. At termination $e = 0$ and the invariant reads $\text{result} = A^k$.

**The walk count.** The lemma proves that $(A^k)_{st}$ counts the walks of length $k$ from $s$ to $t$. All of the arithmetic is done modulo the modulus, and reduction is compatible with addition and multiplication, so the entries of the result are the residues of the exact counts.

**The overflow.** Every entry of the result and of the base is a residue, hence less than $m$. The product of two such entries is less than $m^2$, and the accumulator is reduced after every addition, so every intermediate value is less than $m^2$ as well. When $m \le 2^{31}$, the value $m^2$ is less than $2^{62}$ and a signed 64-bit integer suffices. When $m$ is larger, a 128-bit intermediate is required. $\square$
:::

## Complexity analysis

Let $n$ be the dimension of the matrix and $k$ the exponent.

- **Time:** $O(n^3 \log k)$ for the matrix multiplications, plus $O(n^2 \log k)$ for the accumulator updates, which are the smaller term. The number of multiplications is at most $2\lceil \log_2 k \rceil$.
- **Auxiliary space:** $O(n^2)$ for the result, the base and the product. The base is overwritten in place, so three matrices are enough.
- **For the recurrence form:** the matrix is $d$ by $d$, where $d$ is the order of the recurrence, so the time is $O(d^3 \log k)$. For the Fibonacci recurrence $d = 2$ and the whole computation is $O(\log k)$.

The log factor is the whole reason the technique exists. The comparison with the direct iteration is:

| Approach              | Time            | Beats it when                                     |
| --------------------- | --------------- | ------------------------------------------------- |
| Edge-list iteration   | $O(km)$         | $k$ is small                                      |
| Matrix iteration      | $O(k n^3)$      | never, unless the graph is dense                  |
| Matrix exponentiation | $O(n^3 \log k)$ | $k > n^2 \log k$, which holds for every large $k$ |

The space is worth one more note. The three matrices of size $n^2$ are $O(n^2)$ words, and for $n = 200$ that is $3 \times 40000$ words, which is about a megabyte. The space is never the problem; the time is.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The number of steps is at most $10^5$ | The direct iteration over the edges |
| The number of steps is at least $10^{12}$ | Matrix exponentiation |
| The $n$-th term of a linear recurrence | The companion matrix and a power |
| The $n$-th term of a recurrence with a large order | Linear recurrence algorithms such as Kitamasa |
| A count of walks in a graph with many vertices | The edge-list iteration, or a sparse formulation |
| The number of paths in a DAG | A topological-order dynamic program, which is $O(V+E)$ |
| A count that depends on more than the last few values | A different state, not a bigger matrix |
| A matrix power over a modulus | Reduce after every multiplication, never at the end |

The sixth row is the one that catches people. A graph that is a directed acyclic graph does not need a matrix at all, because the walks can be counted in topological order in linear time. The matrix is for graphs where the walks can go around in circles, which is exactly where the length becomes unbounded.

## Recursion decision

The recursive formulation of the binary power is safe, because its depth is the number of bits of the exponent.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the recursive form is also safe |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative; the recursive form is safe for an exponent below $2^{1000}$ but the call overhead is large |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The depth of the recursive power is $\lceil \log_2 k \rceil$, which is $60$ for $k = 10^{18}$. No language on the list is in danger.

The iterative form is still the better one, and the reason is the constant factor. The recursive form returns a matrix by value, so each of the $60$ levels copies an $n^2$ matrix on the way back up, and each level performs two multiplications. The iterative form performs the same number of multiplications and copies nothing, because it overwrites the base in place.

The recursion is worth writing once as a definition, because it makes the invariant $\text{result} \cdot \text{base}^{e} = A^k$ obvious, and then it should be replaced with the loop.

## Implementation walkthrough

Three lines decide whether the result is correct.

```cpp
acc = (acc + a[i][k] * b[k][j]) % mod;
```

The reduction is inside the innermost loop. A program that accumulates the whole dot product and reduces at the end computes a value of magnitude $n(m-1)^2$, and for $n = 200$ and $m = 10^9+7$ that is about $2 \times 10^{20}$, which overflows a signed 64-bit integer. The overflow is silent, and the result is a matrix of wrong numbers rather than a crash.

```cpp
if (exponent & 1) result = multiply(result, base, mod);
```

The accumulator is multiplied by the base only when the current bit of the exponent is set. A program that always multiplies computes $\text{base}^{\text{sum of the bit positions}}$ instead of $\text{base}^{k}$.

```cpp
base = multiply(base, base, mod);
exponent >>= 1;
```

The squaring and the halving must both happen, and the squaring must use the _old_ base. A program that squares after shifting still works, because the squaring does not depend on the exponent, but a program that halves the exponent before the squaring and forgets to square the last time computes $A^{\lfloor k/2 \rfloor}$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Reducing the dot product only at the end | Silent overflow, and a wrong answer | Reduce after every addition |
| Using `int` for the accumulator | The sum of two residues overflows | Use a 64-bit type |
| Forgetting the modulus in the accumulator | The exact count overflows almost immediately | Reduce inside the loop |
| Multiplying the result on every iteration | The exponent becomes the sum of the bit positions | Multiply only when the bit is set |
| Forgetting to reduce the base entries | The base grows without bound | Every multiplication reduces |
| Using `A` instead of the transpose for a directed graph | The counts run backwards | Build $A_{ij}$ for an edge from $i$ to $j$ |
| Counting simple paths instead of walks | The count is different, and much harder | A power of the adjacency matrix counts walks, with repetition allowed |

### Why this fails: the exact count that overflows before the answer does

The plausible wrong approach is to compute the power exactly, in a 64-bit integer, and reduce the result modulo the modulus at the very end. The reason it is plausible is that the final answer is small and the reduction at the end looks as though it would cancel the overflow. It does not, because the overflow happens in the middle.

The smallest counterexample is the graph with two vertices and all four possible edges, $1 \to 1$, $1 \to 2$, $2 \to 1$ and $2 \to 2$. Its adjacency matrix is

$$
A = \begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix},
$$

and $A^k = 2^{k-1} \begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}$, so the number of walks of length $k$ from vertex $1$ to vertex $1$ is $2^{k-1}$.

Now take $k = 64$. The exact count is $2^{63} = 9223372036854775808$, which is one more than $2^{63} - 1 = 9223372036854775807$, the largest signed 64-bit integer. The exact computation overflows, and the program prints a negative number or a wrapped value. The correct answer modulo $10^9 + 7$ is $2^{63} \bmod (10^9+7) = 291172004$.

$k = 63$ is the largest length at which the exact count still fits, because $2^{62}$ is comfortably inside the range, and $k = 64$ is therefore the smallest length at which the exact computation breaks. No smaller graph can expose the bug, because a graph with one vertex has a count of $1$ at every length.

The symptom is not a crash in most languages. In C++ and Java the overflow wraps around silently, and the program prints a number that is not the residue of anything.

The second failure in the same area is the one that costs time rather than correctness. The plausible approach of iterating the multiplication $k$ times computes $A^k$ exactly, with no overflow, and it is simply too slow: $O(k n^3)$ against $O(n^3 \log k)$. The two are equal in the number of matrix multiplications only when $k = \log k$, which is never. The square is not an optimization of the iteration; it is a different algorithm.

The lesson generalizes: **in a modular computation, the reduction is part of the arithmetic, not a finishing touch.** The same rule appears in [modular arithmetic](/algorithms/number-theory/modular-arithmetic), in the [binomial coefficients](/algorithms/combinatorics/binomial-coefficients), and in every counting dynamic program that reports a count modulo a prime.

## Variants and extensions

- **A sparse matrix.** A graph with $m$ edges has at most $m$ nonzero entries, and a multiplication that skips the zeros costs $O(n^2 m)$ or better, which can beat the dense $O(n^3)$ when $m$ is small.
- **The companion matrix.** A linear recurrence of order $d$ becomes a $d$ by $d$ matrix, and the size of the matrix is the order of the recurrence rather than the number of states.
- **Kitamasa and the characteristic polynomial.** When $d$ is large, the characteristic polynomial of the matrix gives a recurrence of order $d$ that can be evaluated in $O(d^2 \log k)$ without any matrix at all.
- **Cayley and Hamilton.** Every matrix satisfies its own characteristic polynomial, and that is the theorem that turns a power into a polynomial in the matrix.
- **The bipartite double cover.** A walk of even length in a bipartite graph is a walk in the doubled graph, and the walk count of an odd length is $0$.
- **The linear recurrence of a counting dynamic program.** A counting dynamic program over a fixed set of states produces a linear recurrence in the number of steps, and the matrix of its transitions is exactly the matrix of the update. See [counting dynamic programming](/algorithms/combinatorics/counting-dp).
- **The exponent as a sum of powers of two.** When only a few values of $A^k$ are needed, each can be computed by its own chain of squarings and the results combined.

## Contest strategy

1. Check the number of steps first. If it is at most $10^5$, write the direct iteration, which is simpler and faster.
2. Write the matrix with the convention $A_{ij}$ equal to the number of edges from $i$ to $j$, and check a two-vertex example by hand before trusting the code.
3. Put the modulus reduction inside the innermost loop, and size the accumulator type for $m^2$.
4. Write the power as the loop with an explicit accumulator and base, and test it on a small exponent against the naive multiplication.
5. Test the whole thing against the direct iteration for a small $k$ that is still large enough to need more than one squaring, such as $k = 13$. A single squaring is not enough to catch a wrong loop.
6. For a recurrence problem, write the first few terms by hand and check that the matrix reproduces them. A companion matrix with a transposed row is the classic mistake.
7. Keep the modulus and the matrix dimension in the same sentence when you ask for help, because they decide the runtime.

## Worked problems

### Problem 1: walks of a given length

**Restatement.** A directed graph has $n \le 200$ vertices and $m \le 5000$ edges. Count the walks of length exactly $k = 10^{18}$ from vertex $1$ to vertex $n$, modulo $10^9 + 7$.

**Naive baseline.** The edge-list iteration, $O(km)$, which is $5 \times 10^{21}$ steps.

**Insight.** The number of walks of length $k$ is the $(1,n)$ entry of $A^k$.

**Derivation.** Build the adjacency matrix, raise it to the power $k$ by exponentiation by squaring, and read off the entry.

**Correctness.** The lemma proves that the entry counts the walks, and the invariant proves that the power is computed correctly.

**Complexity.** $O(n^3 \log k)$ time and $O(n^2)$ space, which is about $60 \times 8 \times 10^6$ modular operations for $n = 200$.

**Common wrong approach.** Iterating the matrix multiplication $k$ times, which is $O(k n^3)$ and is worse than the edge list it replaced.

### Problem 2: a huge Fibonacci number

**Restatement.** Compute $F_{10^{18}} \bmod 10^9+7$, where $F_1 = F_2 = 1$.

**Naive baseline.** The iteration $f \leftarrow f + g$, $O(k)$ steps, which is $10^{18}$ steps.

**Insight.** The Fibonacci recurrence is a linear recurrence of order $2$, so it has a $2 \times 2$ companion matrix.

**Derivation.** With $M = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}$ the identity $M^k = \begin{pmatrix} F_{k+1} & F_k \\ F_k & F_{k-1} \end{pmatrix}$ holds, so the answer is the $(1,2)$ entry of $M^k$.

**Correctness.** The identity is the lemma applied to the graph with two vertices and the edges $1 \to 1$, $1 \to 2$, $2 \to 1$, whose walks of length $k$ from vertex $1$ to vertex $2$ are counted by $F_k$.

**Complexity.** $O(2^3 \log k)$ time and $O(2^2)$ space, which is about $60$ matrix multiplications of a $2 \times 2$ matrix.

**Common wrong approach.** Using the matrix $\begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}$ but reading the $(1,1)$ entry, which is $F_{k+1}$ and is off by one in the index.

### Problem 3: a counting dynamic program at a huge step count

**Restatement.** A sequence of tilings of a board of length $n$ with tiles of length $1$, $2$ and $3$ is defined, and the problem asks for the count at $n = 10^{18}$ modulo $10^9 + 7$.

**Naive baseline.** The dynamic program over the board, $O(n)$ time and $O(n)$ space, which is $10^{18}$ steps.

**Insight.** The counting dynamic program is a linear recurrence of order $3$, so it has a $3 \times 3$ matrix.

**Derivation.** The recurrence is $f(n) = f(n-1) + f(n-2) + f(n-3)$ with $f(0) = 1$, $f(1) = 1$, $f(2) = 2$, and the companion matrix is $\begin{pmatrix} 1 & 1 & 1 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{pmatrix}$. Raise it to the power $n$ and take the first coordinate of the product with the initial state $(2, 1, 1)$.

**Correctness.** The recurrence follows from the partition by the length of the first tile, and the matrix evaluates the recurrence exactly.

**Complexity.** $O(3^3 \log n)$ time and $O(3^2)$ space, which is $60 \times 27$ modular operations.

**Common wrong approach.** Using the wrong initial state, in particular $f(0) = 0$, which makes every subsequent count zero.

## Practice progression

1. **Recognition.** Given a statement, decide whether the count is a walk count, a recurrence term, or something else, and write down the matrix size that the technique will need.
2. **Direct application.** Implement the matrix multiplication and the binary power, and check the power against the naive multiplication for every exponent up to $20$ and every matrix of size at most $4$.
3. **Adaptation.** Write the companion matrix for a recurrence of order $d$, and the version that returns the whole vector rather than one entry.
4. **Combination.** Combine the matrix power with a counting dynamic program, using the transitions of the table as the matrix, and with [modular arithmetic](/algorithms/number-theory/modular-arithmetic), which is what makes the entries exact.
5. **Challenge.** Solve a problem with a graph of $n = 1000$ vertices and $k = 10^{18}$, and find the structure that reduces the matrix size below $n$, or the sparse multiplication that reduces the cost of the dense one.
6. **Transfer.** Recognize the technique in another subject: the number of paths in a graph after many steps, the number of tilings at a huge length, the number of binary strings of a huge length with a given number of ones, or the $n$-th term of any linear recurrence.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the lemma that connects the power of the adjacency matrix to walk counting, and prove it. (Formal model)
2. State the invariant of the binary power and show that each branch preserves it. (Formal model)
3. How many matrix multiplications does the binary power use, and why is that number logarithmic? (Key insight)
4. Write the companion matrix of a recurrence of order $d$, and explain where each row comes from. (Key insight)
5. Why must the reduction be inside the innermost loop, and what is the largest intermediate value? (Implementation walkthrough)
6. What is the largest $k$ for which the exact count of the complete two-vertex graph fits in a signed 64-bit integer? (Common mistakes)
7. Compare the time of the matrix exponentiation with the time of the edge-list iteration, and say which one wins for which $k$. (Complexity analysis)
8. When is the direct iteration better than the matrix power? (Algorithm selection)
9. What is the depth of the recursive power, and is it ever a problem? (Recursion decision)
10. Why is a directed acyclic graph not a matrix problem? (Algorithm selection)
11. How does a counting dynamic program become a matrix? (Variants and extensions)
12. What is the difference between a walk and a simple path, and which one does the matrix count? (Common mistakes)

## Further reading

- The arithmetic that keeps every entry of the matrix exact under a modulus, and the inverse that other methods need, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The counting dynamic program whose transitions become the matrix is in [counting dynamic programming](/algorithms/combinatorics/counting-dp).
- The generating function whose denominator gives the recurrence that the companion matrix encodes is in [generating functions](/algorithms/combinatorics/generating-functions).
- The representation of a graph, whose edge list and adjacency matrix are the two forms the walk count is computed from, is in [graph representation](/algorithms/graphs/representation).
- The linear recurrence of a knapsack, whose count is reported modulo a prime and whose matrix form is the same companion matrix, is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The binary representation of the exponent, which is what the squaring follows, is in [binary representation](/algorithms/foundations/binary-representation).
- The subject index lists this technique, [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation), beside the rest of the subject: [the number theory](/algorithms/number-theory/).
