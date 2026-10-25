---
id: advanced.xor-bases
title: XOR bases
summary: Reduce a set of integers to an independent basis over the field of two elements, so the maximum XOR of a subset with a query value is found greedily in one pass over the bits.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        xor basis,
        linear basis,
        Gaussian elimination,
        maximum subset xor,
        linear independence,
        GF(2),
        rank,
    ]
prerequisites:
    required: [foundations.binary-representation, foundations.complexity]
    recommended: [enumeration.subset-enumeration, number-theory.modular-arithmetic]
complexity:
    time: "O((n + q) log A)"
    space: "O(log A)"
assumptions:
    - Every value is a non-negative integer below 2^30, so one 30-bit basis covers every input.
    - The queries are independent and may be answered in any order after the basis is built.
implementations: advanced.xor-bases
reviewed: false
---

<AlgorithmSummary algorithm="advanced.xor-bases" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="advanced.xor-bases" />

## At a glance

An XOR basis is a small set of numbers that has exactly the same subset XORs as the original set, but contains no redundant element. The original set may have $n$ numbers; the basis has at most one number per bit, so at most $30$ numbers when the values are below $2^{30}$.

The basis is built by Gaussian elimination over the field of two elements. Each inserted number is reduced by the basis vectors that already own its highest set bit, and it is either reduced to zero, which proves it was dependent, or it becomes the first basis vector with that pivot bit.

A query is then a greedy pass from the highest bit to the lowest. At each pivot, xoring the basis vector flips that bit and leaves every higher bit alone, so the choice that makes the current value larger is always the right one. The cost is $O(n \log A)$ to build and $O(\log A)$ per query, against $O(n 2^n)$ for enumerating subsets.

## Problem motivation

A key archive stores $n$ integers. A customer presents a challenge value $x$ and asks for the largest value that can be written as $x$ XOR the XOR of some subset of the archive. The archive is fixed, and there are $q$ customers.

The constraints are typical of a platinum problem: $n$ and $q$ reach $2 \cdot 10^5$, and every value is below $10^9$, hence below $2^{30}$. There are $2^n$ subsets, so enumerating them is impossible. There are $2^{30}$ possible XOR values, which is just over a billion, so a boolean table of every reachable value is also too large, and rebuilding it per query is worse.

The saving comes from linear algebra. The subset XORs form a vector space over the field with two elements: the vectors are the binary representations, addition is XOR, and scalar multiplication by $0$ or $1$ selects or discards a vector. A vector space with $30$ coordinates has dimension at most $30$, no matter how many numbers generated it. A basis of that space is therefore a summary of all $2^n$ subset XORs in at most $30$ numbers.

The same reduction answers several questions at once. Membership, the number of subsets that produce a value, the maximum value in the space, and the number of distinct values all follow from the basis and its size.

## Recognition patterns

XOR bases are the right tool when the statement contains some of these phrases.

- "The XOR of a subset", "the XOR of some of the numbers", "choose any subset".
- "The maximum possible XOR", "the largest value of $x \oplus y$ where $y$ is a subset XOR".
- "Can $x$ be represented as the XOR of a subset?", "count the subsets whose XOR is $x$".
- "Linear basis", "linear independence", "rank", "Gaussian elimination over GF(2)".
- "Each edge may be used any number of times", with a path length defined as an XOR.
- "The operations are XOR and the values are integers", which is the usual sign that a bitwise vector space is hiding in the problem.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| Up to $20$ values, and one subset question | Enumerating $2^n$ subsets is already enough |
| $n \ge 10^5$, values below $2^{30}$ | The basis is the intended solution |
| The question is about a contiguous subarray | A binary trie or a prefix structure, not a subset basis |
| The question is about a pair of elements | A binary trie, not a basis |
| The subset must have a fixed size or a fixed sum | A different dynamic program; the basis ignores both |
| The basis must answer range queries | A segment tree of bases, or prefix bases with snapshots |
| Values update between queries | Rebuild, or keep a basis in every segment tree node |
| The question is about a graph path | The cycle space of the graph, which the basis represents |

The last two rows are the extension that matters most. A basis is a static summary of a set, and the moment the set changes the summary has to change with it. The variants section returns to this point.

## Naive approach

The baseline enumerates every subset and keeps the largest XOR.

```cpp
std::uint32_t best = 0;
for (std::uint32_t mask = 0; mask < (1u << n); ++mask) {
    std::uint32_t value = 0;
    for (int i = 0; i < n; ++i) {
        if ((mask >> i) & 1u) value ^= a[i];
    }
    best = std::max(best, x ^ value);
}
```

This is correct, and it is the reference implementation for a differential test on small inputs. Its cost is $O(n 2^n)$, and even the usual Gray-code trick, which updates the subset XOR in one operation as the mask changes, still costs $O(2^n)$ per query.

The second baseline is dynamic programming over reachable values. Keep a boolean table of size $2^{30}$ and mark every value that some subset reaches. Each new number doubles the work in the worst case, so the table costs $O(n 2^{30})$ time and $2^{30}$ bits of memory. That is better than $2^n$ when $n$ is large, but it is still far beyond the limits.

The third baseline is full Gaussian elimination on an $n \times 30$ matrix. It is already the right idea, but it costs $O(n \cdot 30^2)$ if every row is reduced against every pivot, and it stores the whole matrix. The basis is the same elimination with two economies: a row is reduced only while it still has a pivot, and rows that reduce to zero are thrown away.

## Key insight

The insight is that **the set of subset XORs is a vector space of dimension at most $30$, and a triangular basis of that space makes the maximum query a per-bit greedy choice.**

Write every number as a vector of $30$ bits. XOR is addition in $\mathrm{GF}(2)^{30}$: each coordinate is added modulo two. The subset XORs are exactly the linear combinations with coefficients in $\{0, 1\}$, because a subset chooses each number once and XOR is its own inverse. Those combinations form a subspace, and the smallest set of numbers that generates the subspace is a basis.

The basis is kept in triangular form. The vector `basis[p]`, when it is nonzero, has highest set bit $p$, and there is at most one such vector for each $p$. A new number is inserted by walking down from the highest bit. At bit $p$, if the number has that bit set and `basis[p]` exists, xoring `basis[p]` clears the bit and does not disturb any higher bit. If no vector owns the bit, the number becomes `basis[p]` and the insertion stops. If the number becomes zero, it was a combination of the vectors already present, so it adds nothing to the space.

The triangular shape is what makes the query greedy. Suppose the current value is $x$ and the next pivot is $p$. No later basis vector has a bit above $p$, so the bits above $p$ are already final.

- If bit $p$ of $x$ is zero, xoring `basis[p]` sets it to one and adds $2^p$ to the value. Nothing later can clear that bit, so taking the vector is strictly better.
- If bit $p$ of $x$ is one, xoring `basis[p]` clears it and subtracts $2^p$. Nothing later can restore it, so skipping the vector is strictly better.

The greedy rule is therefore local, and the local choices compose into the global maximum.

## Visual intuition

Take the numbers $3$, $5$ and $6$, written with three bits, and insert them one at a time. A dash means that the pivot slot is still empty.

| Step | Value | Binary | `basis[2]` | `basis[1]` | `basis[0]` | What happens |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | - | - | - | - | - | The basis starts empty |
| 1 | 3 | 011 | - | 3 | - | Bit 1 is free, so 3 takes that pivot |
| 2 | 5 | 101 | 5 | 3 | - | Bit 2 is free, so 5 takes that pivot |
| 3 | 6 | 110 | 5 | 3 | - | $6 \oplus 5 = 3$, then $3 \oplus 3 = 0$, so 6 is dependent |

The third row is the elimination in action. The number $6$ has bit $2$ set, so it meets the vector $5$, and their XOR is $3$. That value has bit $1$ set, so it meets the vector $3$, and their XOR is $0$. The two reductions used both existing pivots, which is a proof that $6 = 5 \oplus 3$ and therefore that $6$ was already in the span.

The basis has two vectors, so the subspace has $2^2 = 4$ values: $0$, $3$, $5$ and $6$. That is the whole span of the three input numbers, compressed from three vectors to two.

Now picture the bit columns. Each pivot owns one column, and a basis vector is a row whose leftmost one is in its own pivot column. A new row descends the columns from left to right, canceling a one whenever the column already has an owner, until it either finds an empty pivot or becomes zero. This is exactly the row reduction of a matrix, with the columns ordered from the most significant bit to the least significant bit.

The query walks the same columns in the same order, but now the goal is not to reach zero. It is to make each column as large as possible, and the triangular shape guarantees that a choice made at one column is never undone later.

## Formal model

Let $B = 30$ and let $V = \{a_1, a_2, \ldots, a_n\}$ be a multiset of integers with $0 \le a_i < 2^B$.

::: math definition Definition
For a subset $S \subseteq \{1, \ldots, n\}$, the **subset XOR** is

$$
\bigoplus_{i \in S} a_i,
$$

with the empty subset producing $0$. The **span** of $V$ is the set of all subset XORs,

$$
\operatorname{span}(V) = \Bigl\{ \bigoplus_{i \in S} a_i : S \subseteq \{1, \ldots, n\} \Bigr\}.
$$
:::

::: math definition Definition
A **basis** of $V$ is a sequence $b_0, b_1, \ldots, b_{B-1}$ in which each $b_p$ is either $0$ or has its highest set bit at position $p$, and

$$
\operatorname{span}\{b_p : b_p \ne 0\} = \operatorname{span}(V).
$$

The vector $b_p$ is called the **pivot vector** of bit $p$.
:::

::: math lemma Lemma
The nonzero vectors of a basis are linearly independent over $\mathrm{GF}(2)$.
:::

::: math proof Proof
Order the nonzero pivot vectors by decreasing pivot. Consider a nonempty subset of them and let $b_p$ be the vector in the subset with the largest pivot. Every other selected vector has a smaller pivot, so it has a zero at bit $p$. The vector $b_p$ has a one at bit $p$, so the XOR of the subset has a one at bit $p$ and is not zero. Therefore no nonempty subset XORs to zero. $\square$
:::

::: math lemma Lemma
Let $r$ be the number of nonzero vectors in a basis of $V$. Then the span has exactly $2^r$ values, and every value in the span is produced by exactly $2^{n-r}$ subsets of $V$.
:::

::: math proof Proof
The $2^r$ choices of coefficients for the $r$ independent pivot vectors produce $2^r$ distinct values: if two choices produced the same value, their difference would be a nonzero combination equal to zero, contradicting independence.

The map from subsets of $V$ to the span is linear from $\mathrm{GF}(2)^n$ onto a space of dimension $r$. Its kernel has dimension $n - r$, hence $2^{n-r}$ elements, and the preimage of every value in the image has exactly that many elements. $\square$
:::

::: math lemma Lemma
The greedy query rule returns the largest value in the set $x \oplus \operatorname{span}(V)$.
:::

::: math proof Proof
Process the pivots from $B-1$ down to $0$. At pivot $p$, no vector with a smaller pivot has a one at bit $p$, so the bits above $p$ are final and bit $p$ can still be chosen freely by deciding whether to xor $b_p$. If $x$ has a zero at bit $p$, xoring $b_p$ changes the value from a number with bit $p$ zero to one with bit $p$ one while preserving all higher bits, so it increases the value. If $x$ has a one at bit $p$, xoring $b_p$ decreases it. The greedy rule takes exactly the increasing choice at every pivot, and the resulting value is maximal. $\square$
:::

The rank $r$ is the dimension of the span. It is at most $B$, and it is exactly the number of inserted numbers that did not reduce to zero.

## Algorithm derivation

The state is an array of $B$ pivot slots, all initially zero.

The insertion of a number $v$ is:

1. For $p$ from $B-1$ down to $0$:
2. If bit $p$ of $v$ is zero, continue.
3. If `basis[p]` is nonzero, set $v = v \oplus \texttt{basis[p]}$ and continue.
4. Otherwise set `basis[p] = v` and stop.
5. If the loop ends, $v$ is zero and the number was dependent.

The query for a value $x$ is:

1. For $p$ from $B-1$ down to $0$:
2. If `basis[p]` is nonzero and $(x \oplus \texttt{basis[p]}) > x$, set $x = x \oplus \texttt{basis[p]}$.
3. Print $x$.

```cpp
std::uint32_t basis[30] = {};
for (int k = 0; k < n; ++k) {
    std::uint32_t v = a[k];
    for (int p = 29; p >= 0; --p) {
        if (((v >> p) & 1u) == 0) continue;
        if (basis[p] != 0) {
            v ^= basis[p];
        } else {
            basis[p] = v;
            break;
        }
    }
}

for (int k = 0; k < q; ++k) {
    std::uint32_t x = query[k];
    for (int p = 29; p >= 0; --p) {
        if (basis[p] != 0 && (x ^ basis[p]) > x) {
            x ^= basis[p];
        }
    }
    std::cout << x << '\n';
}
```

The comparison `(x ^ basis[p]) > x` is a compact way to express the greedy choice. Because `basis[p]` has no bit above $p$, the comparison is decided by bit $p$ alone: the XOR is larger exactly when bit $p$ of $x$ is zero. An explicit bit test would be equally clear and slightly faster, but the comparison is harder to get backwards.

The basis is built once and never changes during the queries. Every query starts from its own copy of $x$, so the order of the queries does not matter.

## Step-by-step execution

Use the numbers $3$, $5$ and $6$ from the visual section, with $B = 3$ so that the trace fits on the page.

**Insertion.**

| Inserted value | Binary | Reduction | Basis after the step |
| --- | --- | --- | --- |
| 3 | 011 | Bit 1 is free, so 3 becomes `basis[1]` | `basis[1] = 3` |
| 5 | 101 | Bit 2 is free, so 5 becomes `basis[2]` | `basis[2] = 5`, `basis[1] = 3` |
| 6 | 110 | $6 \oplus 5 = 3$, then $3 \oplus 3 = 0$ | Unchanged |

The final basis is `basis[2] = 5` and `basis[1] = 3`. Bit 0 has no pivot vector.

**Query $x = 0$.**

| Pivot | `basis[p]` | Candidate | Larger? | Current value |
| ----- | ---------- | --------- | ------- | ------------- |
| 2     | 5          | 5         | Yes     | 5             |
| 1     | 3          | 6         | Yes     | 6             |
| 0     | 0          | 6         | No      | 6             |

The answer is $6$, which is the largest of $0$, $3$, $5$ and $6$.

**Query $x = 4$.**

| Pivot | `basis[p]` | Candidate | Larger? | Current value |
| ----- | ---------- | --------- | ------- | ------------- |
| 2     | 5          | 1         | No      | 4             |
| 1     | 3          | 7         | Yes     | 7             |
| 0     | 0          | 7         | No      | 7             |

The answer is $7 = 4 \oplus 3$. The set $4 \oplus \operatorname{span}(V)$ is $\{4, 7, 1, 2\}$, whose largest value is indeed $7$.

**Query $x = 6$.**

| Pivot | `basis[p]` | Candidate | Larger? | Current value |
| ----- | ---------- | --------- | ------- | ------------- |
| 2     | 5          | 3         | No      | 6             |
| 1     | 3          | 5         | No      | 6             |
| 0     | 0          | 6         | No      | 6             |

The answer is $6$, which comes from the empty subset. This query is worth noticing: the greedy rule may choose no vector at all, and that is a valid subset.

## Correctness proof

::: math theorem Theorem
After all insertions, the nonzero pivot vectors form a basis of $\operatorname{span}(V)$, and the greedy query returns the maximum of $x \oplus \operatorname{span}(V)$.
:::

::: math proof Proof
The insertion maintains two invariants: the span of the pivot vectors equals the span of the numbers inserted so far, and the pivot vectors are independent.

Initially both are true, because the basis is empty and no number has been inserted. Suppose the invariants hold before inserting $v$. If $v$ reduces to zero, then it was written as a sequence of XORs with pivot vectors, so $v$ is already in the span and adding it changes neither the span nor the independence. If $v$ stops at a free pivot $p$, then $v$ was replaced by $v \oplus c$, where $c$ is a combination of existing pivot vectors. The two values generate the same span together with the existing basis, because $v = (v \oplus c) \oplus c$. The new vector has pivot $p$, which no existing vector owns. A combination of vectors with pivots above $p$ has a nonzero highest pivot above $p$, while the new vector has a zero there; a combination of vectors with pivots below $p$ has a zero at $p$, while the new vector has a one there. So the enlarged set is independent. This proves the first part.

The greedy query is the second lemma, applied to the set $x \oplus \operatorname{span}(V)$. The pivots are visited from high to low, and at each pivot the choice that increases the current value is taken. No later pivot can alter a higher bit, so every choice is final, and the final value is the maximum. $\square$
:::

The theorem also explains the counting result. If the basis has $r$ nonzero vectors, the span has $2^r$ values and every value in it is reached by $2^{n-r}$ subsets. That fact is the whole solution of the counting variant in the worked problems.

## Complexity analysis

| Method                            | Time         | Space    |
| --------------------------------- | ------------ | -------- |
| Enumerate every subset            | $O(n 2^n)$   | $O(n)$   |
| Boolean table of reachable values | $O(n 2^B)$   | $O(2^B)$ |
| Full Gaussian elimination         | $O(n B^2)$   | $O(nB)$  |
| XOR basis                         | $O(nB + qB)$ | $O(B)$   |

**Building the basis.** Each number is examined once. The inner loop runs at most $B$ times, because every XOR clears the current highest bit and the highest bit strictly decreases. The build is therefore $O(nB)$.

**Answering a query.** The loop performs one comparison and at most one XOR per bit, so a query is $O(B)$.

**Memory.** The basis is an array of $B$ integers. The input numbers and the queries are streamed, so the programs do not store them. The space is $O(B)$, which is $30$ machine words.

With $B = 30$, the constants are small enough that the whole algorithm fits comfortably in a one-second limit for $n = q = 2 \cdot 10^5$. The work is about $1.2 \cdot 10^7$ operations, and each operation is a shift, a test, and occasionally an XOR.

The comparison with enumeration is the point of the technique. At $n = 30$, enumeration already costs about a billion subset visits, while the basis costs less than a thousand operations. At $n = 2 \cdot 10^5$, enumeration is not a candidate at all.

## Algorithm selection

| Situation                                   | What to use                                       |
| ------------------------------------------- | ------------------------------------------------- |
| Maximum of $x \oplus$ a subset XOR          | An XOR basis, with the greedy query               |
| Whether a value is a subset XOR             | An XOR basis, reducing the value to zero          |
| The number of subsets with a given XOR      | An XOR basis plus $2^{n-r}$                       |
| The number of distinct subset XORs          | An XOR basis; the answer is $2^r$                 |
| The $k$-th smallest subset XOR              | A reduced basis, then the bits of $k$             |
| The maximum XOR of a contiguous subarray    | A binary trie or prefix XORs with a trie          |
| The maximum XOR of a pair of elements       | A binary trie                                     |
| The minimum XOR path in a graph             | A cycle basis plus the DFS tree distances         |
| Prefix queries over a static array          | Prefix basis snapshots                            |
| Arbitrary range queries over a static array | A segment tree of bases                           |
| The values change between queries           | Rebuild, or a segment tree whose nodes hold bases |
| A system of XOR equations                   | Gaussian elimination on the augmented matrix      |

The rows that are easy to confuse are the subset rows and the contiguous rows. A basis summarizes arbitrary subsets, so it can say that a value is some subset XOR, but it cannot say that the value is the XOR of a contiguous block. Contiguity is a constraint on which subsets are allowed, and the basis has already forgotten it. Use a trie or a prefix structure for those problems.

The counting row is the other easy mistake. The number of subsets that produce a value is $2^{n-r}$, not $2^r$ and not $1$. The $r$ counts the independent directions, and the $n-r$ counts the dependent choices that can be made freely without changing the XOR.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read $n$.
2. Read $n$ integers, the values of the set.
3. Read $q$.
4. Read $q$ integers, the query values $x$.
5. Print, for each query, the maximum of $x \oplus$ a subset XOR, one value per line.

The input is whitespace-separated, so a line break may appear anywhere between two numbers. The number of queries comes after the whole set, not before it. The basis is built before the first query and is never modified afterwards.

All six variants use $B = 30$ and the same pivot rule, so they produce byte-identical output on the shared fixtures. The C and C++ variants store the basis in `std::uint32_t`, Java uses `int`, Python uses arbitrary-precision integers, Pascal uses `LongInt`, and JavaScript uses `Number` with unsigned shifts. Those choices are safe because every input and every query is below $2^{30}$: the sign bit is never set, and no value ever needs more than $30$ bits.

The C, C++, and Java variants read tokens with their standard buffered input or with a byte-buffer scanner. The Python variant reads the whole input once and splits it, which keeps the parsing loop out of the interpreter's per-token overhead. The Pascal variant gives every `Read` exactly one argument, which keeps it inside the subset of the language that the browser-based compiler accepts. The JavaScript variant reads standard input as one string and splits it, because Node has no synchronous line reader that is worth the complexity here.

The manifest publishes only the `program` variant. There is no reusable `minimal` variant because the technique is small enough to live in two loops: the caller has to decide the bit width, insert the set, and run the query greedy. A class would hide the basis array without making either loop clearer.

## Recursion decision

Both loops are iterative, and the recursion depth would be at most $B = 30$ either way. The recursion decision is therefore not about the call stack at all. It is about the shape of the search.

A recursive insertion can be written as "reduce the highest bit, then recurse on the remainder":

```cpp
void insert(std::uint32_t v, int p) {
    if (v == 0 || p < 0) return;
    if (((v >> p) & 1u) == 0) { insert(v, p - 1); return; }
    if (basis[p] != 0) { insert(v ^ basis[p], p - 1); return; }
    basis[p] = v;
}
```

It computes the same basis and uses at most $30$ frames, which is harmless in every language. The loop is still preferable, because the tail call is the whole computation and the loop makes the invariant "the pivot decreases every step" visible.

The recursion that must be avoided is over subsets. A recursive "include or exclude this number" search has depth $n$ and $2^n$ leaves, so it exceeds both the time limit and the stack. The basis replaces that recursion entirely rather than optimizing it.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB of stack | About $10^5$ frames | The loop; recursion over $30$ bits is also safe |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

## Implementation walkthrough

Four details decide whether an XOR-basis program is correct.

**The pivot owns the highest set bit.** When a number stops at pivot $p$, its bit $p$ must be one, and all higher bits must be zero. The insertion loop guarantees this because it descends from the top and never skips a set bit. If the loop is written from low to high, the pivot invariant breaks and the greedy query loses its proof.

**The query compares after the XOR.** The natural mistake is to test whether bit $p$ of $x$ is set and then XOR unconditionally. That reduces $x$ toward the minimum of its coset, not the maximum. The comparison `(x ^ basis[p]) > x` states the goal directly and is decided by bit $p$, because `basis[p]` has no higher bits.

```cpp
if (basis[p] != 0 && (x ^ basis[p]) > x) {
    x ^= basis[p];
}
```

**The bit width must cover the input.** Thirty bits cover every value below $2^{30}$. A value of exactly $2^{30}$ needs bit $30$, which the basis does not have, and the program would silently ignore its highest bit. Read the statement's bound and set $B$ from it; if the bound is $10^9$, then $30$ is enough, and if it is $10^{18}$, use $60$ bits and a 64-bit type.

**The basis is not reduced row echelon.** The insertion leaves each pivot vector's lower bits untouched. That is sufficient for the maximum query, because the greedy decision at a pivot depends only on that pivot and the bits above it. It is not sufficient for the $k$-th smallest query, which needs every pivot bit to be cleared from every other vector. The variants section describes the reduction step.

A compact and readable Python core is:

```python
basis = [0 for _ in range(30)]
for value in values:
    for bit in range(29, -1, -1):
        if not (value >> bit) & 1:
            continue
        if basis[bit]:
            value ^= basis[bit]
        else:
            basis[bit] = value
            break

for x in queries:
    for bit in range(29, -1, -1):
        if basis[bit] and (x ^ basis[bit]) > x:
            x ^= basis[bit]
```

The insertion loop and the query loop have the same shape, which is the reason the technique is easy to remember. The insertion wants to reach zero; the query wants to leave zero behind.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Writing the pivot loop from low to high | The pivot positions are wrong and the greedy query is invalid | Descend from the highest bit |
| Xoring every pivot whose bit is set in $x$ | The program reports the minimum of the coset, usually $0$ | XOR only when the result is larger |
| Starting the answer at $0$ instead of $x$ | The program returns the maximum subset XOR, ignoring the query | Start from $x$; the empty subset is allowed |
| Counting every inserted number as a basis vector | The count is $n$ instead of the rank, so the subset count is wrong | Count only the insertions that find a free pivot |
| Storing the numbers and rebuilding per query | The build cost is paid $q$ times | Build once, then answer each query in $O(B)$ |
| Using $29$ bits for values up to $10^9$ | Values with bit $29$ set, such as $10^9$, lose their top bit | Check the bound; $10^9 < 2^{30}$, so bits $0$ through $29$ are enough |
| Assuming the basis is reduced | The $k$-th smallest query returns a value that is not the $k$-th | Reduce the basis, or use a different construction |
| Forgetting that the empty subset XORs to zero | A query that can only use the empty subset reports nothing | Start from $x$ and let the greedy loop do nothing |

### Why this fails: minimizing instead of maximizing

The plausible wrong approach is to interpret the basis as a reduction machine. "If the current value has bit $p$ set, XOR the pivot to clear it" sounds like Gaussian elimination, and it is exactly what the insertion loop does. Applied to the query, it computes the smallest value in the coset, not the largest.

The smallest counterexample is two numbers, $1$ and $2$, and the query $x = 3$. The basis is `basis[1] = 2` and `basis[0] = 1`. The correct answer is $3$, because the empty subset is allowed and $3 \oplus 0 = 3$. The wrong query clears bit $1$ first, giving $3 \oplus 2 = 1$, then clears bit $0$, giving $1 \oplus 1 = 0$. It reports $0$, which is the minimum of the four values $3$, $2$, $1$, $0$.

The bug is not a small off-by-one. It reverses the objective. The insertion loop drives a value to zero because dependency is exactly what it is testing. The query loop must drive the value away from zero, and the comparison is what tells the loop which direction that is.

A second failure is starting the answer at $0$ and maximizing the subset XOR without the query. With the same input $1, 2$ and the query $x = 3$, that program returns $3$ by accident, because the largest subset XOR is $3$. Change the query to $x = 4$ and it still returns $3$, while the correct answer is $7 = 4 \oplus 3$. The query value has to be part of the initial state.

A third failure is a bit width that is one short. With values up to $10^9$, bit $29$ is set in the largest value, and a basis with only $29$ slots (bits $0$ through $28$) drops it. The program still compiles, still answers most queries, and is wrong exactly on the inputs that use the top bit. The fix is to derive $B$ from the bound rather than from the number of bits in a small example.

## Variants and extensions

- **Reduced row echelon basis.** After all insertions, clear each pivot bit from every other vector by walking the pivots from high to low. The resulting basis is unique and sorted by pivot, and the $k$-th smallest subset XOR is obtained by reading the bits of $k$ against the reduced vectors, with the empty subset handled as the zeroth value.
- **Prefix bases.** Insert the numbers from left to right and keep a snapshot of the basis whenever the rank increases. Because the rank grows at most $B$ times, there are at most $B$ snapshots, and a query about a prefix of length $l$ uses the last snapshot at or before $l$. This is the solution of the counting problem in the worked section.
- **Segment tree of bases.** Store a basis in every node and merge two bases by inserting the vectors of one into the other. A range basis costs $O(B^2 \log n)$ to assemble, and a range query then costs $O(B)$.
- **Cycle basis of a graph.** A graph's cycle space is a vector space over $\mathrm{GF}(2)$. The fundamental cycles of a DFS tree span it, so inserting the XOR of each non-tree edge gives a basis of every closed walk, and path queries become coset queries against that basis.
- **Gaussian elimination on an augmented matrix.** A system of XOR equations is a linear system over $\mathrm{GF}(2)$. The same elimination decides consistency and finds a solution; the only difference is that the right-hand side is carried along as an extra column.
- **64-bit values.** The same algorithm with $B = 60$ handles values below $2^{60}$, which covers most signed 64-bit inputs. The C and C++ variants use `std::uint64_t`, Java uses `long`, and Python needs no change at all.
- **Basis with a count of subsets.** Store, for each pivot, how many original numbers were folded into it. This answers counting queries without a separate prefix snapshot, at the cost of a more delicate insertion.
- **Matroid view.** Linear independence over $\mathrm{GF}(2)$ is a matroid, so the greedy algorithm that adds a vector whenever it is independent is the matroid greedy algorithm. That is the theoretical reason the insertion order does not affect the rank.

## Contest strategy

1. Decide that the problem is about subsets, not about contiguous ranges or pairs. The words "subset", "subsequence" and "any of the numbers" are the signal; "subarray" and "pair" are not.
2. Read the bound on the values and set $B$ to the number of bits it needs. For $10^9$ use $30$, for $10^{18}$ use $60$, and for a stated bit count use that count plus one if the bound is inclusive.
3. Build the basis before answering anything. Each number is inserted once, and the insertion is the only place where the pivot invariant is established.
4. Answer each query from a copy of $x$. The greedy loop never writes to the basis, so the queries can be answered online and in any order.
5. Count the rank separately if the problem asks for a number of subsets or a number of distinct values. The rank is the number of insertions that found a free pivot.
6. Test the boundary cases: a query of $0$, an input of $0$, a duplicate value, a value with the top bit set, and a query whose best subset is empty.
7. If the problem asks for the $k$-th smallest rather than the maximum, reduce the basis first. The triangular basis that answers the maximum is not enough for the order statistic.

## Worked problems

### Problem 1: (Zero XOR Subset)-less

**Restatement.** Given an array of $n$ integers, divide it into the maximum number of nonempty contiguous segments such that no nonempty subset of the segments has XOR $0$. Print $-1$ if no such division exists. Constraints: $n \le 2 \cdot 10^5$ and $a_i \le 10^9$.

**Naive baseline.** Enumerate all $2^{n-1}$ divisions, and for each one test every subset of its segments. The cost is far beyond the limit even for $n = 30$.

**Insight.** A set of segments is valid exactly when their XOR values are linearly independent over $\mathrm{GF}(2)$. The segment XORs are differences of prefix XORs, so their span is the span of the array values.

**Derivation.** Compute the XOR $T$ of the whole array. If $T = 0$, the whole array as one segment has XOR $0$, and for any division the XOR of all segments is also $T = 0$, so the full set of segments is a nonempty zero-XOR subset. No division works, and the answer is $-1$.

Otherwise, insert every array value into a basis and let $r$ be the rank. Every segment XOR lies in the span, so an independent set of segments has at most $r$ elements. For the lower bound, take a basis of the prefix XORs that includes the total $T = p_n$, order its indices increasingly, and cut the array at those indices. The segment XORs are independent: a zero-XOR subset of segments telescopes to a relation among the chosen basis prefixes, and if the subset is all segments its XOR is $p_n = T \ne 0$. So $r$ segments are achievable, and the answer is $r$.

**Correctness.** The upper bound is the dimension of the span. The lower bound constructs a division with one segment per basis vector and proves the segment values independent. Together they pin the answer at $r$, and the case $T = 0$ is excluded correctly because every division then contains a dependent full set.

**Complexity.** $O(nB)$ time and $O(B)$ space, with $B = 30$.

**Common wrong approach.** Printing the rank even when the total XOR is zero. The array $[1, 2, 3]$ has rank $2$, but every division has a zero-XOR subset of segments, so the correct answer is $-1$.

### Problem 2: Mahmoud and Ehab and yet another xor task

**Restatement.** Given an array of $n$ values and $q$ queries, each query gives $l$ and $x$ and asks for the number of subsequences of the first $l$ elements whose XOR is $x$, modulo $10^9 + 7$. Constraints: $n, q \le 10^5$ and every value and query is below $2^{20}$.

**Naive baseline.** For each query, run a dynamic program over the first $l$ elements with a table of size $2^{20}$. The cost is $O(q \cdot l \cdot 2^{20})$, and even one query at $l = 10^5$ is too slow.

**Insight.** The subsequences of the first $l$ elements span a space of rank $r_l$. If $x$ is outside that span the answer is $0$; otherwise exactly $2^{l-r_l}$ subsequences produce it.

**Derivation.** Insert the values from left to right and keep the current basis. Record the empty basis at length $0$ as the first snapshot, and record a new copy whenever an insertion increases the rank. A query with prefix $l$ uses the last recorded snapshot at or before $l$. Reduce $x$ against that basis; if it does not reach zero, print $0$. Otherwise print $2^{l-r}$ modulo $10^9 + 7$, where $r$ is the rank of the snapshot.

**Correctness.** The map from the $2^l$ subsequences to the span is linear and onto, so its kernel has dimension $l - r$ and every reachable value has exactly $2^{l-r}$ preimages. The snapshot is the basis of exactly the first $l$ values, so the membership test and the rank are the ones the query asks about.

**Complexity.** The basis changes at most $20$ times, because values are below $2^{20}$. Building all snapshots costs $O(n \cdot 20)$ time and $O(20^2)$ space, and each query costs $O(20)$ plus a modular exponentiation that can be precomputed for every prefix.

**Common wrong approach.** Using the final basis for every query. A query with a small $l$ must not see values that arrive after position $l$, and the rank and the membership answer both change with the prefix.

### Problem 3: Shortest Path Problem?

**Restatement.** An undirected connected graph has $n$ vertices, $m$ weighted edges, and possibly multiple edges and loops. The length of a walk is the XOR of its edge weights, counting an edge once for every traversal. Find the minimum length of a walk from vertex $1$ to vertex $n$. Constraints: $n, m \le 10^5$ and edge weights below $10^8$.

**Naive baseline.** Dijkstra does not apply, because XOR has no order compatible with addition: a longer prefix can XOR to a smaller value, and a visited vertex may need to be revisited. Enumerating walks is infinite in the presence of cycles.

**Insight.** Any walk from $1$ to $n$ is a simple tree path followed by a set of cycles. The cycle XORs form the cycle space of the graph, which is a vector space, and the reachable path lengths are one coset of that space.

**Derivation.** Run a DFS from vertex $1$ and compute `dist[v]`, the XOR along the tree path from $1$ to $v$. For every non-tree edge $(u, v, w)$, the fundamental cycle has XOR `dist[u] ^ dist[v] ^ w`; insert that value into a basis. The achievable walk lengths are `dist[n] ^ span(cycles)`, so the answer is the minimum of that coset. Compute it greedily from the highest bit down: if xoring the pivot clears the current bit, do it, because that strictly decreases the value and no lower pivot can restore the bit.

**Correctness.** Every walk differs from the tree path by a symmetric difference of cycles, and the fundamental cycles span every cycle, so the set of achievable walk lengths is `dist[n] ^ span(cycles)`. The greedy pass returns the minimum of that coset by the same highest-bit argument as the maximum query, with the comparison reversed.

**Complexity.** $O((n + m)B)$ time for the DFS, the insertion of every non-tree edge, and the final greedy pass, with $B = 30$. The space is $O(n + m + B)$.

**Common wrong approach.** Replacing every edge weight with its XOR distance and running Dijkstra. The triangle inequality fails for XOR, so Dijkstra can finalize a vertex with a value that a later cycle would improve.

## Practice progression

1. **Recognition.** Given a statement, decide whether the objects being combined are arbitrary subsets or contiguous ranges. Only the first uses a basis, and the second needs a trie or a prefix structure.
2. **Direct application.** Implement insertion and the maximum query for values below $2^{4}$, and compare the answers against enumeration on every subset of a random set of five numbers.
3. **Adaptation.** Answer membership, the number of distinct subset XORs, and the number of subsets per value from the same basis. Check that the three answers agree with enumeration.
4. **Combination.** Add prefix snapshots and solve the counting problem, then replace the snapshots with a segment tree of bases and answer range queries.
5. **Challenge.** Build the cycle basis of a graph and answer minimum and maximum path queries. Compare the results against a brute-force search over all simple paths on small graphs.
6. **Transfer.** Recognize the same elimination in a system of XOR equations, in a lights-out puzzle, and in the reduced basis that answers the $k$-th smallest subset XOR.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the vector space, and why is XOR the addition? (Key insight)
2. Why does a basis have at most $30$ vectors when the values are below $2^{30}$? (Formal model)
3. What invariant does the insertion loop maintain, and why does a free pivot preserve independence? (Correctness proof)
4. Why is the greedy query correct at each pivot, and why can a later pivot not undo it? (Formal model)
5. How many distinct subset XORs does a basis of rank $r$ represent, and how many subsets produce each one? (Formal model)
6. Why does the query compare `(x ^ basis[p]) > x` instead of testing bit $p$? (Implementation walkthrough)
7. What is the smallest counterexample to the "clear the bit" query, and what does it report? (Common mistakes)
8. Why is a triangular basis enough for the maximum but not for the $k$-th smallest? (Variants and extensions)
9. Why must the total XOR be nonzero in the segment-division problem? (Worked problems)
10. Why does Dijkstra fail on XOR path lengths, and what replaces it? (Worked problems)

## Further reading

- The representation that makes XOR a vector addition is [binary representation](/algorithms/foundations/binary-representation), which covers the bit operations used by every loop in this article.
- The enumeration that the basis replaces is [subset enumeration](/algorithms/enumeration/subset-enumeration); its Gray-code variant is the fastest correct baseline for small $n$.
- The offline technique that shares the subject with XOR bases is [parallel binary search](/algorithms/advanced/parallel-binary-search), and the subject index lists both in [the advanced algorithms](/algorithms/advanced/).
- The structure that turns a basis into a range structure is the [segment tree](/algorithms/range-queries/segment-tree), whose nodes can hold one basis each.
- The additive prefix table that the prefix snapshots resemble is [prefix sums](/algorithms/arrays/prefix-sums).
- The graph traversal behind the cycle basis is [depth-first search](/algorithms/graphs/dfs), which supplies the tree path and the fundamental cycles.
- The modular exponentiation used by the counting problem is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The dynamic program over subsets that the basis avoids is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack), a different use of the same include-or-exclude decision.
