---
id: dynamic-programming.subset-transforms
title: Subset transforms
summary: Compute the sum of a function over every subset of every mask, and invert the result, with one pass per bit rather than one enumeration per mask.
division: [platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        zeta transform,
        mobius transform,
        sos dp,
        sum over subsets,
        superset sum,
        subset convolution,
        inclusion-exclusion,
        fast zeta transform,
    ]
prerequisites:
    required: [foundations.complexity, foundations.binary-representation]
    recommended:
        [
            dynamic-programming.bitmask-dp,
            enumeration.meet-in-the-middle,
            number-theory.modular-arithmetic,
        ]
complexity:
    time: "O(n 2^n)"
    space: "O(2^n)"
assumptions:
    - The universe has at most about twenty-four elements, so the table of 2^n masks fits in memory.
    - The values live in a commutative group, usually the integers modulo 1000000007, so addition is invertible and the passes can be reversed.
    - The required quantity is a sum over the subsets or the supersets of each mask, or a subset convolution assembled from those sums.
implementations: dynamic-programming.subset-transforms
reviewed: false
---

<AlgorithmSummary algorithm="dynamic-programming.subset-transforms" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="dynamic-programming.subset-transforms" />

## At a glance

A subset transform takes an array indexed by masks and produces another array indexed by masks, in which each entry aggregates a whole family of subsets. The **subset zeta transform** is

$$
\hat f[S] = \sum_{T \subseteq S} f[T].
$$

The **superset zeta transform** aggregates in the other direction:

$$
\hat f^{\uparrow}[S] = \sum_{T \supseteq S} f[T].
$$

The **Mobius transform** is the inverse of the subset transform:

$$
\check g[S] = \sum_{T \subseteq S} (-1)^{|S|-|T|} g[T].
$$

Each of the three can be computed for all $2^n$ masks in $O(n 2^n)$ time and $O(2^n)$ space. The method is one pass per bit: in pass $i$, every mask whose bit $i$ is set adds the value of the same mask with bit $i$ cleared. After $n$ passes, every mask has collected every submask. Reversing the passes with subtraction recovers the original array.

For $n = 3$ and

$$
f = (5, 0, 7, 1, 2, 0, 3, 4),
$$

indexed by masks $000, 001, \ldots, 111$, the subset transform is

$$
\hat f = (5, 5, 12, 13, 7, 7, 17, 22).
$$

The last entry is the sum of all eight values, and $\hat f[110] = 17 = 5 + 7 + 2 + 3$ is the sum over the four submasks of $110$. The naive computation of all eight entries examines $3^3 = 27$ pairs of nested masks; the transform examines $n 2^{n-1} = 12$ additions.

The technique is also called **sum over subsets**, abbreviated SOS, or the **fast zeta transform**. It is the Boolean-lattice case of an $n$-dimensional prefix sum: a mask is a vector of $n$ bits, and the subsets of a mask are exactly the vectors that are less than or equal to it in every coordinate.

## Problem motivation

Suppose a marketing database stores one weighted record for every subset of twenty customer segments. There are $2^{20}$ records, one per possible segment set, and an analyst wants the total weight of the records whose segment set is contained in a query set $S$, for every possible $S$. The database exports the weights as an array $f$ of length $2^{20}$, and the program must print the array $g$ with

$$
g[S] = \sum_{T \subseteq S} f[T] \pmod{10^9 + 7}.
$$

The direct method enumerates the submasks of every $S$. The total number of pairs $(S, T)$ with $T \subseteq S$ is

$$
\sum_{S} 2^{|S|} = \sum_{k=0}^{n} \binom{n}{k} 2^k = 3^n,
$$

which is $3^{20} \approx 3.5 \times 10^9$ at the stated limit. That is several seconds of work even in C++, and it is out of the question in the slower languages.

The transform reduces the work to $n 2^{n-1} \approx 10^7$ additions. The input itself has $2^{20}$ values, so the running time is only a factor of twenty above the cost of reading the input. That is the entire attraction of the technique: the exponential is still there, but the work per mask is reduced from $(3/2)^n \approx 3300$ to $n = 20$, a factor of about $166$.

The same computation answers several questions that do not look like subset sums at first.

- **Counting submasks.** If $f[T] = 1$ for every $T$ that appears in a collection, then $\hat f[S]$ is the number of collection members contained in $S$.
- **Counting supermasks.** The superset transform answers the dual question.
- **Inclusion-exclusion.** The Mobius transform is the Boolean-lattice form of inclusion-exclusion, and it converts a sum over contained sets into a sum over exact sets.
- **Subset convolution.** A ranked version of the transform multiplies two functions whose arguments partition a mask, which is the standard tool for counting partitions, coverings, and colorings.
- **Partial-match queries.** Two transforms, one over submasks and one over supermasks, answer a query that fixes some bits to zero, fixes some bits to one, and leaves the rest free.

The transform is therefore less a single algorithm than a change of basis for functions on masks. Once the array is in the transformed basis, subset sums become pointwise values, and many problems that look like they need a search become a scan.

## Recognition patterns

The subset transform is the right tool when all of the following hold.

- The objects are **masks over a universe of at most about twenty-four elements**.
- The question asks for **all $2^n$ answers at once**, or for enough queries that a per-query submask enumeration is too slow.
- Each answer is a sum over the **subsets** or the **supersets** of a mask.
- The operation is **addition**, or another operation with an inverse, so that the transform can be reversed when the problem needs exact-set information.
- The universe is fixed in advance, so a mask can be used as an array index.

The constraint values decide the technique quickly.

| Constraint | What it means |
| --- | --- |
| $n \le 16$ | Comfortable: $65\,536$ masks and about half a million additions |
| $n \le 20$ | The usual limit: a million masks and about ten million additions |
| $n \le 24$ | Possible with care: sixteen million masks and about two hundred million additions |
| $n > 24$ | The flat table is out; a sparse map, a meet-in-the-middle, or a different state is needed |
| $n \le 10^5$ | The universe is too large for a mask; this is not the technique |
| One query only | Enumerating the submasks of that one mask may be cheaper than building the whole table |
| A sum over pairs whose union is a mask | The plain subset zeta transform, pointwise product, then Mobius |
| A sum over pairs that split a mask into disjoint parts | Subset convolution with the rank coordinate, not the plain zeta transform |
| A minimum or maximum over subsets | The forward pass works, but the inverse does not; there is no subtraction to undo a minimum |
| The values are counts that must be exact, not modulo | The same loops work with arbitrary-precision integers, at a higher cost |

A phrase in a statement that points at this technique is "**for every subset**", "**sum over all submasks**", "**number of sets contained in**", or "**SOS**". A phrase that points at the inverse is "**exactly the set**", "**inclusion-exclusion**", or "**recover the original counts**". A problem that asks for "the sum over all pairs whose bitwise OR is $S$" is an OR convolution, which uses the same transform; a problem that asks for "the sum over all pairs whose bitwise XOR is $S$" uses the Walsh-Hadamard transform instead, and the two should not be confused.

There is also a size signal. When the statement gives an array of length $2^n$ and $n \le 20$, the input is already exponential, and the intended solution is almost always a transform over the mask index rather than a search inside each entry.

## Naive approach

The direct computation enumerates the submasks of every mask.

```python
def zeta_naive(f, n):
    g = [0] * (1 << n)
    for s in range(1 << n):
        t = s
        while True:
            g[s] += f[t]
            if t == 0:
                break
            t = (t - 1) & s
    return g
```

The idiom `t = (t - 1) & s` visits every submask of `s` exactly once, ending at zero. It is correct and compact, and it is the reference implementation for a differential test on small $n$.

The cost is $3^n$. Each of the $2^n$ masks contributes $2^{|S|}$ terms, and the binomial sum above evaluates to $3^n$. At $n = 16$ that is $43$ million additions, which is still tolerable; at $n = 20$ it is $3.5$ billion; at $n = 22$ it is $31$ billion. The growth ratio between consecutive values of $n$ is three, so one more bit triples the work.

A second naive method pushes each value to all of its supersets.

```python
def zeta_push(f, n):
    g = f[:]
    for t in range(1 << n):
        rest = ((1 << n) - 1) ^ t
        s = rest
        while True:
            g[t | s] += f[t]
            if s == 0:
                break
            s = (s - 1) & rest
    return g
```

This is the same $3^n$ count from the other side. It is useful as a conceptual step, because it shows that every value $f[T]$ has to reach every superset $S \supseteq T$. The transform is what happens when those copies are shared instead of repeated.

The redundancy is easy to see in the push version. A value at $T$ is copied to $T \cup \{0\}$, to $T \cup \{1\}$, and so on, and the copy at $T \cup \{0\}$ is then copied again to $T \cup \{0,1\}$, while $T$ is also copied directly to $T \cup \{0,1\}$. The transform avoids the second copy by making the first copy carry the sum.

## Key insight

The Boolean lattice is a product of $n$ two-element chains. A mask is a point $(b_0, \ldots, b_{n-1})$ with each $b_i \in \{0,1\}$, and $T \subseteq S$ means $T_i \le S_i$ for every coordinate. A sum over all $T \le S$ is therefore an $n$-dimensional prefix sum, and an $n$-dimensional prefix sum can be computed one axis at a time.

For an ordinary two-dimensional prefix sum, the efficient method is to sweep the rows and then the columns, not to apply inclusion-exclusion to all four corners of every rectangle. The subset transform is the same sweep in $n$ dimensions. The pass for bit $i$ sweeps axis $i$: it adds the half of the table where bit $i$ is zero to the half where bit $i$ is one. After the sweep, every entry has been summed over both values of that coordinate.

The key invariant is worth stating before the code. Let $B_i = \{i, i+1, \ldots, n-1\}$ be the bits that have not been swept yet. Before the pass for bit $i$, the entry at $S$ is

$$
g[S] = \sum_{T \subseteq S,\ T \cap B_i = S \cap B_i} f[T],
$$

meaning that $T$ ranges over the subsets of $S$ that agree with $S$ on every unswept bit, while the swept bits are free. At the start, no bit is swept and the sum has one term, $f[S]$. After the pass for bit $i$, the same statement holds with $B_i$ replaced by $B_{i+1}$, and after all $n$ passes the set is empty and the sum is over every $T \subseteq S$. Each pass only has to combine two already-computed sums, so the work per entry is constant.

The in-place update is safe because the two halves play different roles. In the pass for bit $i$, the half with bit $i$ equal to zero is only read, and the half with bit $i$ equal to one is only written. The source value `g[mask ^ bit]` is therefore still the value from the previous pass when it is used, no matter whether the loop runs over masks in increasing or decreasing order.

The inverse is the same sweep with subtraction. Each pass is a linear map $I + A_i$, where $A_i$ copies the zero half into the one half. The map $A_i$ satisfies $A_i^2 = 0$, because its output has bit $i$ set and its input is taken from the half with bit $i$ clear, so applying it twice gives zero. Hence $(I + A_i)^{-1} = I - A_i$, and the passes can be undone in reverse order. The passes commute, because they act on different coordinates, so the reverse order is the same as any other order.

## Visual intuition

The masks of a three-element universe form a cube. Draw the cube by layers of popcount, with the empty set at the bottom and the full set at the top.

```text
popcount 3:                 111
                     /      |      \
popcount 2:       110      101      011
                   |  \   / | \   /  |
popcount 1:       100      010      001
                     \      |      /
popcount 0:                 000
```

An edge joins a set to a set with one more element. The subset transform sends every value upward along every path: after all passes, the entry at a node is the sum of the values at that node and all of its descendants. The superset transform sends values downward in the same picture.

The three passes are easiest to see as a table. The columns are the array after each pass, and each pass fills the masks whose bit is set.

| Mask | Binary | $f$ | After bit 0 | After bit 1 | After bit 2 |
| ---- | ------ | --- | ----------- | ----------- | ----------- |
| 0    | 000    | 5   | 5           | 5           | 5           |
| 1    | 001    | 0   | 5           | 5           | 5           |
| 2    | 010    | 7   | 7           | 12          | 12          |
| 3    | 011    | 1   | 8           | 13          | 13          |
| 4    | 100    | 2   | 2           | 2           | 7           |
| 5    | 101    | 0   | 2           | 2           | 7           |
| 6    | 110    | 3   | 3           | 5           | 17          |
| 7    | 111    | 4   | 7           | 9           | 22          |

Read the passes from left to right.

- **Bit 0.** The odd masks receive their even neighbor: $g[1] = 0 + 5 = 5$, $g[3] = 1 + 7 = 8$, $g[5] = 0 + 2 = 2$, $g[7] = 4 + 3 = 7$.
- **Bit 1.** The masks with bit 1 set receive the value two positions to the left: $g[2] = 7 + 5 = 12$, $g[3] = 8 + 5 = 13$, $g[6] = 3 + 2 = 5$, $g[7] = 7 + 2 = 9$.
- **Bit 2.** The upper half receives the lower half: $g[4] = 2 + 5 = 7$, $g[5] = 2 + 5 = 7$, $g[6] = 5 + 12 = 17$, $g[7] = 9 + 13 = 22$.

The final row is the answer. The entry $g[6] = 17$ contains $f[0] + f[2] + f[4] + f[6] = 5 + 7 + 2 + 3$, which are exactly the four submasks of $110$. The entry $g[7] = 22$ contains all eight values.

The inverse table runs the same picture backward. Start from the final column and subtract in the order bit 2, bit 1, bit 0.

| Mask | Start | Undo bit 2 | Undo bit 1 | Undo bit 0 |
| ---- | ----- | ---------- | ---------- | ---------- |
| 0    | 5     | 5          | 5          | 5          |
| 1    | 5     | 5          | 5          | 0          |
| 2    | 12    | 12         | 7          | 7          |
| 3    | 13    | 13         | 8          | 1          |
| 4    | 7     | 2          | 2          | 2          |
| 5    | 7     | 2          | 2          | 0          |
| 6    | 17    | 5          | 3          | 3          |
| 7    | 22    | 9          | 7          | 4          |

The last column is the original array. The inverse is not a different algorithm; it is the same sweep with a minus sign, which is why a single implementation can support both directions.

The superset transform is the mirror image. In each pass, the masks with bit $i$ clear receive the value of the mask with bit $i$ set. On the cube, values flow down the edges rather than up.

## Formal model

Let $U = \{0, 1, \ldots, n-1\}$ be the universe. A **mask** is an integer in $[0, 2^n)$; the mask $S$ represents the set $\{i \in U : \text{bit } i \text{ of } S \text{ is } 1\}$. The **popcount** $\operatorname{pc}(S)$ is the number of set bits. The relation $T \subseteq S$ means that every set bit of $T$ is also set in $S$, which is the same as `(T & S) == T`.

::: math definition Definition
For a function $f$ on the masks, the **subset zeta transform** is the function $\hat f$ with

$$
\hat f[S] = \sum_{T \subseteq S} f[T].
$$

The **superset zeta transform** is the function $\hat f^{\uparrow}$ with

$$
\hat f^{\uparrow}[S] = \sum_{T \supseteq S} f[T].
$$

The **Mobius transform** of a function $g$ is

$$
\check g[S] = \sum_{T \subseteq S} (-1)^{|S|-|T|} g[T].
$$

The inverse of the superset transform has the same shape with the inclusion reversed:

$$
\check g^{\uparrow}[S] = \sum_{T \supseteq S} (-1)^{|T|-|S|} g[T].
$$
:::

::: math definition Definition
The **subset convolution** of two functions $f$ and $g$ is

$$
(f \ast g)[S] = \sum_{T \subseteq S} f[T] \, g[S \setminus T].
$$

The sum splits $S$ into two disjoint parts, so it is also called the **disjoint union convolution**. The **ranked zeta transform** of $f$ is the family of functions

$$
F_k[S] = \sum_{\substack{T \subseteq S \\ |T| = k}} f[T],
\quad k = 0, 1, \ldots, n.
$$
:::

::: math lemma Lemma
The subset zeta transform is the $n$-dimensional prefix sum of $f$ over the product of chains $\{0, 1\}^n$. It is computed by $n$ passes, one per coordinate, and the passes commute.
:::

::: math proof Proof
Write a mask as a vector $(b_0, \ldots, b_{n-1})$. The condition $T \subseteq S$ is exactly $T_i \le S_i$ for every $i$. A prefix sum over a product of chains is computed by sweeping one coordinate at a time, because the sweeps act on different coordinates and commute. Each sweep only reads values with the coordinate equal to zero and writes values with the coordinate equal to one, so the sweeps do not interfere. The coordinate order does not matter. $\square$
:::

::: math lemma Lemma
The Mobius transform inverts the subset zeta transform. The inverse of the superset zeta transform is the analogous sum over supersets, with the same parity signs.
:::

::: math proof Proof
For any $S$,

$$
\check{\hat f}[S]
= \sum_{T \subseteq S} (-1)^{|S|-|T|} \hat f[T]
= \sum_{T \subseteq S} (-1)^{|S|-|T|} \sum_{R \subseteq T} f[R]
= \sum_{R \subseteq S} f[R] \sum_{R \subseteq T \subseteq S} (-1)^{|S|-|T|}.
$$

The inner sum depends only on the number of elements of $S \setminus R$. It is $1$ when that number is zero, and otherwise it is $(1 - 1)^{|S|-|R|} = 0$ by the binomial theorem. Hence every term except $R = S$ vanishes, and the result is $f[S]$. The superset statement follows by replacing every mask with its complement. $\square$
:::

::: math lemma Lemma
If $F_k$ and $G_k$ are the ranked zeta transforms of $f$ and $g$, define

$$
H_k[S] = \sum_{j=0}^{k} F_j[S] \, G_{k-j}[S].
$$

After the Mobius transform of each $H_k$ in the mask coordinate, the value of the transformed $H_{|S|}$ at $S$ is $(f \ast g)[S]$.
:::

::: math proof Proof
The product $F_j[S]G_{k-j}[S]$ sums $f[A]g[B]$ over all pairs $A, B \subseteq S$ with $|A| = j$ and $|B| = k-j$. Summing over $j$ gives all pairs with $|A| + |B| = k$ and $A, B \subseteq S$. The Mobius transform in $S$ keeps exactly the pairs with $A \cup B = S$. When $k = |S|$, the equality $|A| + |B| = |A \cup B|$ forces $A \cap B = \emptyset$, so the surviving pairs are precisely the disjoint splits of $S$. $\square$
:::

::: math invariant Invariant
Before the pass for bit $i$, for every mask $S$,

$$
g[S] = \sum_{T \subseteq S,\ T \cap B_i = S \cap B_i} f[T],
\quad B_i = \{i, i+1, \ldots, n-1\}.
$$

After the pass, the same statement holds with $B_i$ replaced by $B_{i+1} = \{i+1, \ldots, n-1\}$.
:::

## Algorithm derivation

Start with a copy of the input, $g = f$. The pass for bit $i$ must turn the invariant for $B_i$ into the invariant for $B_{i+1}$. There are two cases.

- If bit $i$ of $S$ is zero, then every $T \subseteq S$ has bit $i$ zero, so the condition on $B_i$ is the same as the condition on $B_{i+1}$. The entry does not change.
- If bit $i$ of $S$ is one, a subset $T \subseteq S$ either has bit $i$ zero or one. The ones are already counted by the old $g[S]$. The zeros are exactly the subsets of $S \setminus \{i\}$ that agree with $S$ on $B_{i+1}$, and they are counted by the old $g[S \setminus \{i\}]$. The new value is the sum of the two.

That gives the update

$$
g[S] \mathrel{+}= g[S \setminus \{i\}] \quad \text{for every } S \text{ with bit } i \text{ set}.
$$

The pseudocode is short enough to write directly.

```python
def zeta(f, n, mod):
    g = f[:]
    for i in range(n):
        bit = 1 << i
        for mask in range(1 << n):
            if mask & bit:
                g[mask] = (g[mask] + g[mask ^ bit]) % mod
    return g
```

The order of the two loops can be reversed: the pass for a bit may process the masks in any order, because it only reads the half with that bit clear and only writes the half with that bit set. The passes themselves must be completed one at a time; mixing two bits in one pass would read entries that have already been changed by the other bit.

The branch inside the mask loop costs more than the addition in the compiled languages. The block form removes it.

```python
def zeta_blocks(f, n, mod):
    g = f[:]
    step = 1
    for _ in range(n):
        for base in range(0, 1 << n, step << 1):
            for off in range(step):
                target = base + step + off
                g[target] = (g[target] + g[base + off]) % mod
        step <<= 1
    return g
```

The block `[base, base + 2 \ast step)` is split into a lower half with bit $i$ clear and an upper half with bit $i$ set. The offset `off` walks both halves at once. This is also the cache-friendly form, because the two addresses are exactly `step` apart and the loop walks memory in order.

The superset transform changes the direction of the copy. For each bit, the lower half receives the upper half.

$$
g[S] \mathrel{+}= g[S \cup \{i\}] \quad \text{for every } S \text{ with bit } i \text{ clear}.
$$

The Mobius transform is the same pass with subtraction and with the update applied to the upper half.

$$
g[S] \mathrel{-}= g[S \setminus \{i\}] \quad \text{for every } S \text{ with bit } i \text{ set}.
$$

The inverse can be applied in any bit order. Reversing the order of the forward passes is the most obviously correct choice, and since the passes commute it is also the same as the forward order.

### The ranked form

For subset convolution, the rank is a second coordinate. Build $n+1$ arrays $F_0, \ldots, F_n$, where $F_k[T] = f[T]$ when $|T| = k$ and zero otherwise. Apply the subset zeta transform to each $F_k$. Do the same for $g$. Then for every mask $S$ and every rank $k$,

$$
H_k[S] = \sum_{j=0}^{k} F_j[S] \, G_{k-j}[S].
$$

Apply the Mobius transform to every $H_k$, and read the answer at rank $|S|$:

$$
(f \ast g)[S] = H_{|S|}[S].
$$

The rank arrays are the reason the subset convolution costs $O(n^2 2^n)$ rather than $O(n 2^n)$. There are $n+1$ arrays, each pass over one array costs $O(n 2^n)$, and the product step costs $O(n^2 2^n)$.

### The superset form

The superset transform is used when the query fixes bits to one rather than to zero. It is the same code with the block halves swapped. If both directions are needed, as in the partial-match problem, run the two transforms separately; they are independent.

## Step-by-step execution

Return to the array

$$
f = (5, 0, 7, 1, 2, 0, 3, 4).
$$

The first pass handles bit 0. It pairs each even mask with the odd mask one position above it.

| Pair         | Source | Target | New target |
| ------------ | ------ | ------ | ---------- |
| $(000, 001)$ | 5      | 0      | 5          |
| $(010, 011)$ | 7      | 1      | 8          |
| $(100, 101)$ | 2      | 0      | 2          |
| $(110, 111)$ | 3      | 4      | 7          |

The array is now $(5, 5, 7, 8, 2, 2, 3, 7)$. Each entry is the sum of the values in its block of two, and the block is the set of masks that differ only in bit 0.

The second pass handles bit 1. It pairs each mask whose bit 1 is zero with the mask two positions above it.

| Pair         | Source | Target | New target |
| ------------ | ------ | ------ | ---------- |
| $(000, 010)$ | 5      | 7      | 12         |
| $(001, 011)$ | 5      | 8      | 13         |
| $(100, 110)$ | 2      | 3      | 5          |
| $(101, 111)$ | 2      | 7      | 9          |

The array is now $(5, 5, 12, 13, 2, 2, 5, 9)$. An entry such as $g[110] = 5$ is the sum of $f[100]$ and $f[110]$, the two submasks of $110$ whose bit 2 is set; after the third pass the same entry becomes $17$, the sum over all four submasks.

The third pass handles bit 2. It pairs the lower half with the upper half.

| Pair         | Source | Target | New target |
| ------------ | ------ | ------ | ---------- |
| $(000, 100)$ | 5      | 2      | 7          |
| $(001, 101)$ | 5      | 2      | 7          |
| $(010, 110)$ | 12     | 5      | 17         |
| $(011, 111)$ | 13     | 9      | 22         |

The final array is $(5, 5, 12, 13, 7, 7, 17, 22)$. The entry at $111$ is $22$, which is the sum of the whole input. The entry at $101$ is $7 = f[000] + f[001] + f[100] + f[101] = 5 + 0 + 2 + 0$, which is the sum over the four submasks of $101$.

The inverse is just as mechanical. Undo bit 2 by subtracting the lower half from the upper half: $g[100] = 7 - 5 = 2$, $g[101] = 7 - 5 = 2$, $g[110] = 17 - 12 = 5$, $g[111] = 22 - 13 = 9$. Then undo bit 1: $g[010] = 12 - 5 = 7$, $g[011] = 13 - 5 = 8$, $g[110] = 5 - 2 = 3$, $g[111] = 9 - 2 = 7$. Then undo bit 0: $g[001] = 5 - 5 = 0$, $g[011] = 8 - 7 = 1$, $g[101] = 2 - 2 = 0$, $g[111] = 7 - 3 = 4$. The original array is recovered exactly.

The superset transform of the same input is a useful check. It should send the total, $22$, to the empty mask, because every mask is a superset of the empty mask. The full table is

$$
(22, 5, 15, 5, 9, 4, 7, 4).
$$

The entry at $001$ is $f[001] + f[011] + f[101] + f[111] = 0 + 1 + 0 + 4 = 5$, and the entry at $110$ is $f[110] + f[111] = 3 + 4 = 7$. The two transforms contain the same information in different bases; neither is a subset of the other.

## Correctness proof

::: math theorem Theorem
Before the pass for bit $i$, the array satisfies the stated invariant for $B_i$, and after the pass it satisfies the invariant for $B_{i+1}$. In particular, after all $n$ passes, $\hat f[S] = \sum_{T \subseteq S} f[T]$ for every mask $S$.
:::

::: math proof Proof
The proof is an induction on $i$. Before the first pass, $B_0 = \{0, \ldots, n-1\}$ and the condition $T \cap B_0 = S \cap B_0$ forces $T = S$, so the sum is $f[S]$.

Assume the invariant before the pass for bit $i$ and consider that pass. Let $S$ be a mask.

If bit $i$ of $S$ is zero, every $T \subseteq S$ has bit $i$ zero, so $T \cap B_i = S \cap B_i$ is equivalent to $T \cap B_{i+1} = S \cap B_{i+1}$. The pass does not change $g[S]$, and the invariant for $B_{i+1}$ holds.

If bit $i$ of $S$ is one, partition the subsets $T \subseteq S$ by bit $i$. The ones with bit $i$ equal to one contribute exactly the old $g[S]$, because every such $T$ automatically satisfies the bit $i$ part of the agreement. The ones with bit $i$ equal to zero are subsets of $S \setminus \{i\}$ that agree with $S$ on $B_{i+1}$, which is the same as agreeing with $S \setminus \{i\}$ on $B_{i+1}$; their sum is the old $g[S \setminus \{i\}]$. Adding the two gives the new $g[S]$, which is the invariant for $B_{i+1}$. The base case and the step together prove the claim, and at $i = n$ the set $B_n$ is empty, so the sum is over every $T \subseteq S$. $\square$
:::

::: math theorem Theorem
If the forward passes are followed by the same passes with subtraction in reverse order, every entry returns to its original value.
:::

::: math proof Proof
Let $A_i$ be the linear map that sends $g$ to the array with $(A_i g)[S] = g[S \setminus \{i\}]$ when bit $i$ of $S$ is set, and zero otherwise. The forward pass is $I + A_i$. The map $A_i$ is nilpotent: $A_i^2 = 0$, because the output of $A_i$ is supported on masks with bit $i$ set, while $A_i$ reads only masks with bit $i$ clear. Hence $(I + A_i)(I - A_i) = I - A_i^2 = I$, so the subtraction pass is the inverse. The maps for different bits commute, because each one changes only its own coordinate. Applying the inverses in reverse order therefore multiplies the forward maps to the identity. $\square$
:::

::: math theorem Theorem
The ranked construction of the formal model computes the subset convolution.
:::

::: math proof Proof
The zeta transform of $F_k$ is $F_k[S] = \sum_{T \subseteq S, |T| = k} f[T]$ by the subset theorem. The product $F_j[S]G_{k-j}[S]$ sums $f[A]g[B]$ over pairs with $A, B \subseteq S$, $|A| = j$, and $|B| = k-j$. Summing over $j$ gives every pair with $A, B \subseteq S$ and $|A| + |B| = k$. The Mobius transform in $S$, by the inversion theorem, keeps exactly the pairs with $A \cup B = S$. Setting $k = |S|$ makes the total size equal to the size of the union, so $A$ and $B$ are disjoint, and $B = S \setminus A$. Therefore the coefficient at rank $|S|$ is $\sum_{A \subseteq S} f[A]g[S \setminus A]$, which is the definition. $\square$
:::

## Complexity analysis

There are $n$ passes, and each pass performs one addition for every mask whose bit is set, which is $2^{n-1}$ additions. The total is $n 2^{n-1}$, written $O(n 2^n)$. The table has $2^n$ entries, so the space is $O(2^n)$. The input and the output are each $2^n$ values, so the transform is asymptotically optimal up to the factor $n$.

| $n$ | Masks $2^n$    | Additions $n 2^{n-1}$ | Naive pairs $3^n$    |
| --- | -------------- | --------------------- | -------------------- |
| 16  | $65\,536$      | $524\,288$            | $43\,046\,721$       |
| 20  | $1\,048\,576$  | $10\,485\,760$        | $3\,486\,784\,401$   |
| 22  | $4\,194\,304$  | $46\,137\,344$        | $31\,381\,059\,609$  |
| 24  | $16\,777\,216$ | $201\,326\,592$       | $282\,429\,536\,481$ |

At $n = 20$, the transform does about ten million additions and reads a million values. That is a fraction of a second in C++ and a couple of seconds in Python if the inner loop is written carefully. The naive method at the same size does three and a half billion additions, and the difference is the whole reason the technique exists.

Memory is the binding constraint for the largest $n$. An array of $2^{24}$ 32-bit integers is $64$ megabytes, which fits a typical $256$-megabyte limit but not a $64$-megabyte one. An array of 64-bit integers is $128$ megabytes at the same $n$. The plain transform needs one array; the ranked transform needs $n+1$ arrays, so subset convolution at $n = 20$ is about $84$ megabytes per function in 32-bit arithmetic and should be planned for.

The modulo operation is the other constant factor. When both operands are below $10^9 + 7$, their sum is below $2 \ast (10^9 + 7) < 2^{31}$, so a single conditional subtraction replaces `%`. The compiled implementations use that form; Python and JavaScript can afford `%` or a comparison, and their inner loops are dominated by the interpreter anyway.

The block order does not change the asymptotic count, but it changes the constant by a factor of two or three. The branch version tests every mask in every pass, for $n 2^n$ tests; the block version tests nothing and touches the two halves in order. On a modern cache, the block version is also the one that streams memory predictably.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Sum over all submasks of every mask | The subset zeta transform, $O(n 2^n)$ |
| Sum over all supermasks of every mask | The superset zeta transform, $O(n 2^n)$ |
| Recover the exact-set values from subset sums | The Mobius transform, $O(n 2^n)$ |
| Count pairs whose union is a mask, allowing overlaps | The subset zeta transform, pointwise product, then Mobius |
| Count disjoint splits of a mask | Subset convolution with the rank coordinate, $O(n^2 2^n)$ |
| Count pairs whose AND is a mask | The superset zeta transform with the same three steps |
| Count pairs whose XOR is a mask | The Walsh-Hadamard transform, not this transform |
| One query over one mask | Enumerate its submasks directly, $O(2^{\operatorname{pc}(S)})$ |
| A few thousand queries over a fixed array | The transform, unless $n$ is very small |
| Minimum or maximum over subsets | The forward pass only; the inverse is not available |
| A general partial-order sum | A transform on that poset, if it has a product structure; otherwise a different algorithm |
| $n > 24$ | A sparse map, meet-in-the-middle, or a different state |

The distinction between OR convolution and subset convolution is worth remembering. The OR convolution sums $f[A]g[B]$ over pairs with $A \cup B = S$, and it allows overlaps. The subset convolution sums over pairs with $A \cup B = S$ and $A \cap B = \emptyset$. The OR convolution needs only the plain zeta transform, because the union condition is exactly what the transform records; the subset convolution needs the rank to exclude overlaps. Using the plain transform for the disjoint version counts every overlapping pair that covers $S$, which is too large.

The transform is also not the right tool when the operation is not invertible. A minimum over subsets can be computed with the same forward pass, because $\min$ distributes over the union of the two halves, but there is no subtraction that undoes a minimum. If the problem only needs the forward direction, that is fine; if it needs inclusion-exclusion afterward, it is not.

## Reference implementations

The six programs in the manifest all read the same input and write the same output.

- The first line holds $n$, the number of elements in the universe.
- The second line holds the $2^n$ values $f[0], f[1], \ldots, f[2^n - 1]$, in mask order.
- The output is the $2^n$ values $\hat f[0], \ldots, \hat f[2^n - 1]$, separated by single spaces, on one line.

All six apply the subset transform in place with the block walk. A value is read only from the half whose current bit is clear, and written only to the half whose bit is set, so no temporary array is needed. Every addition is reduced modulo $10^9 + 7$.

The C, C++, Java, and Pascal versions use 32-bit signed integers. That is safe because both operands are below the modulus, so the sum is below $2 \cdot 10^9 + 14 < 2^{31} - 1$. The Python version uses arbitrary-precision integers, and the JavaScript version uses plain numbers; in JavaScript, the sum is also below $2^{31}$, so a double represents it exactly. No variant needs 64-bit arithmetic.

The JavaScript and Pascal files are educational references. Neither language is a USACO submission language. The Pascal source compiles under pas2js as well as under Free Pascal: it avoids `IOResult`, reads one argument per `Read`, includes `uses SysUtils`, and uses no 128-bit integer type.

The six variants are deliberately the same program. The only differences are the input routine, the output routine, and the length of the type name. That is the point of a reference implementation for a transform: the algorithm is the loop nest, and the rest is plumbing.

## Recursion decision

The transform has a natural recursive form. Split the array into the half with bit $n-1$ clear and the half with bit $n-1$ set, recurse on both halves with $n-1$ bits, and then add the lower half to the upper half. The recursion depth is $n$, which is at most $24$ for any instance that fits the table.

| Language   | Practical stack                      | Depth here | Recommendation                |
| ---------- | ------------------------------------ | ---------- | ----------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | At most 24 | Safe, but the loop is simpler |
| Java       | About $10^4$ frames                  | At most 24 | Safe, but the loop is simpler |
| Python     | The interpreter limit of $1000$      | At most 24 | Safe                          |
| Pascal     | The operating system stack           | At most 24 | Safe                          |
| JavaScript | About $10^4$ frames                  | At most 24 | Safe                          |

The recursion is therefore not a stack risk. It is a constant-factor risk: the recursive version needs a base case, a split, and a merge for every bit, and the merge has to know the two halves, which means passing indices or slices. The iterative block version does the same work with two integers, `base` and `off`, and no call overhead. For a transform whose whole cost is the inner loop, the iterative version is the one to submit.

The recursive view is still useful for understanding. It shows that the transform is a divide-and-conquer over the highest bit, and that the merge step is exactly the addition of the lower half to the upper half. If a problem needs the transform to be interleaved with another divide-and-conquer, such as a segment tree over the mask, the recursive shape may be the natural one to compose; for the plain transform, use the loop.

## Implementation walkthrough

The core of the C++ program is one triple loop.

```cpp
constexpr int MOD = 1000000007;

for (int bit = 0; bit < n; bit++) {
    const int step = 1 << bit;
    for (int base = 0; base < total; base += step << 1) {
        for (int off = 0; off < step; off++) {
            int &target = g[base + step + off];
            target += g[base + off];
            if (target >= MOD) {
                target -= MOD;
            }
        }
    }
}
```

The outer loop selects the bit. The middle loop selects a block of $2 \ast step$ consecutive masks. Inside that block, the first `step` masks have the bit clear and the next `step` masks have it set. The inner loop walks both halves together, so `base + off` is the source and `base + step + off` is the target.

For $n = 3$ and `bit = 1`, `step = 2` and the blocks are `[0, 4)` and `[4, 8)`. In the first block, the updates are $g[2] \mathrel{+}= g[0]$ and $g[3] \mathrel{+}= g[1]$. In the second block, they are $g[6] \mathrel{+}= g[4]$ and $g[7] \mathrel{+}= g[5]$. Those are exactly the four updates of the second pass in the step-by-step table.

The conditional subtraction is correct because `target` and the source are both in $[0, MOD)$. Their sum is in $[0, 2 \ast MOD - 2]$, so at most one subtraction is needed. If the input could be larger than the modulus, reduce it while reading; the inner loop must not assume anything beyond the invariant.

The superset transform changes two lines. The target is the lower half, and the source is the upper half.

```cpp
for (int bit = 0; bit < n; bit++) {
    const int step = 1 << bit;
    for (int base = 0; base < total; base += step << 1) {
        for (int off = 0; off < step; off++) {
            int &target = g[base + off];
            target += g[base + step + off];
            if (target >= MOD) {
                target -= MOD;
            }
        }
    }
}
```

The Mobius transform also changes two lines: the target is the upper half, the source is the lower half, and the operation is subtraction with a conditional addition.

```cpp
int &target = g[base + step + off];
target -= g[base + off];
if (target < 0) {
    target += MOD;
}
```

The initial reading and the final printing are the only parts that depend on the language. The C and C++ versions use `scanf` and `printf`, Java uses a byte-buffered scanner, Python splits the whole input, and JavaScript splits the decoded string. Each prints spaces between values and one newline at the end; the test harness normalizes the platform line ending, so the six outputs compare equal.

Two edge cases are handled by the loops themselves. When $n = 0$, `total = 1`, the outer loop runs zero times, and the program prints the single input value. When $n = 1$, there is one pass and two masks, and the second value becomes the sum of both. The guard `n < 0 || n > 24` rejects a mask width that would overflow the shift before any allocation happens.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Enumerating every submask of every mask | $3^n$ work; too slow at $n = 20$ | Use the $n$ passes |
| Adding the whole array to itself in a pass | Every value is counted many times | Add only the bit-clear half to the bit-set half |
| Updating both halves in one pass | The source is overwritten before it is read | Keep the direction fixed within a pass |
| Using the subset direction for a superset query | The answer counts the wrong family | Swap the halves, or complement the masks |
| Forgetting the modulo | The counts grow without bound and overflow | Reduce after every addition |
| Using `1 << n` for $n \ge 31$ | Undefined behavior or a negative size | Keep $n \le 24$, or use a 64-bit mask |
| Reading $n$ values instead of $2^n$ | The table is mostly zeros and the output is wrong | The input length is $2^n$, not $n$ |
| Applying the Mobius pass with addition | The original array is not recovered | Subtract the source from the target |
| Pointwise multiplying unranked transforms for subset convolution | Overlapping pairs are counted | Add the rank coordinate |
| Trying to invert a min or max transform | There is no subtraction that undoes a minimum | Use the forward pass only, or a different state |
| Taking the complement in 32 bits instead of $n$ bits | The index leaves the table or wraps | Mask with `(1 << n) - 1` |
| Assuming the input values are already below the modulus | The conditional subtraction is not enough | Reduce while reading |

### Why this fails: the unranked subset convolution

The plausible wrong approach to subset convolution is to apply the ordinary zeta transform to $f$ and $g$, multiply the two transformed arrays pointwise, and invert once. It looks like the convolution theorem for the OR convolution, and the only difference is that the definition asks for disjoint parts.

Take a two-element universe and the functions

$$
f[\{0\}] = 1, \quad f[\varnothing] = f[\{1\}] = f[\{0,1\}] = 0,
$$

$$
g[\{0\}] = 1, \quad g[\varnothing] = g[\{1\}] = g[\{0,1\}] = 0.
$$

The true subset convolution at $\{0\}$ is

$$
(f \ast g)[\{0\}] = f[\varnothing]g[\{0\}] + f[\{0\}]g[\varnothing] = 0 + 0 = 0,
$$

because the only way to split a singleton into two parts leaves one part empty, and both functions are zero there.

The unranked method computes $\hat f[\{0\}] = 1$ and $\hat g[\{0\}] = 1$, so the pointwise product is $1$. The Mobius inversion of a product that is $1$ at $\{0\}$ and zero at the empty mask is $1$ at $\{0\}$, and the program reports $1$. The value corresponds to the pair $(\{0\}, \{0\})$, whose union is $\{0\}$ but whose parts overlap. The OR convolution genuinely counts that pair; the subset convolution does not.

The rank coordinate excludes the pair because its total size is two, not one. At mask $\{0\}$, the answer is read at rank one, and the pair of two singletons contributes at rank two. That is why the ranked construction is not an optimization but a different transform: it remembers the size that the plain zeta transform forgets.

The lesson is the same one that applies to every transform: before using a convolution theorem, check which operation the theorem convolves. The zeta basis diagonalizes the OR convolution, the superset basis diagonalizes the AND convolution, and the ranked zeta basis diagonalizes the disjoint-union convolution. They are three different bases, even though the code that builds them looks almost identical.

## Variants and extensions

- **Superset zeta transform.** Reverse the halves, as above. It computes $\hat f^{\uparrow}[S] = \sum_{T \supseteq S} f[T]$ in the same time.
- **Mobius inversion.** Reverse the passes with subtraction. It is the inverse of either direction, with the sign and the direction adjusted.
- **Subset convolution.** Add the rank coordinate. The transform becomes $n+1$ zeta transforms, and the product becomes a convolution in the rank.
- **OR convolution.** Use the plain subset zeta transform, multiply pointwise, and invert. The result is $\sum_{A \cup B = S} f[A]g[B]$.
- **AND convolution.** Use the superset zeta transform in the same three steps. The result is $\sum_{A \cap B = S} f[A]g[B]$.
- **XOR convolution.** Use the Walsh-Hadamard transform. The subset transform does not diagonalize XOR, and applying it here gives a plausible but wrong answer.
- **Cover products.** For $\sum_{A \cup B = S, A \cap B = \emptyset} f[A]g[B]$ with a weight that depends on the sizes, keep the rank and read a different coefficient, or use a signed variant.
- **Min or max over subsets.** The forward pass works because the operation is associative and distributes over the two halves. The inverse does not exist in general. This is the forward half of the distance transform on the Boolean cube.
- **Sparse inputs.** If only $k$ masks have nonzero values and the number of queries is small, answer each query by scanning those $k$ masks in $O(k)$. The dense transform wins once the total query work exceeds $n 2^n$.
- **Multidimensional prefix sums.** The same sweep works on a product of chains of length greater than two, such as a grid of dimensions $d_1 \times \cdots \times d_k$. The Boolean cube is the case where every chain has length two.
- **Online updates.** If values change between queries, rebuilding the transform costs $O(n 2^n)$ per change. A small number of changes can be handled by enumerating the affected submasks, and a large number needs a different decomposition.
- **Transforms on other posets.** A tree poset admits a linear-time subtree sum, and a divisor lattice admits a Dirichlet convolution. The Boolean cube is the case where the fast zeta transform is both simple and widely useful.

## Contest strategy

1. **Count the masks first.** If $n$ is above $24$, the flat table is out. If $n$ is at most $20$, the transform is a candidate, and the input size alone is a strong hint.
2. **Write the definition before the code.** Decide whether the problem asks for a sum over submasks, a sum over supermasks, or an exact-set coefficient after inversion. The three answers use the same loops with different directions.
3. **Check whether one query or all queries are needed.** One query can enumerate its submasks in $O(2^{\operatorname{pc}(S)})$. All queries, or many queries, justify the full transform.
4. **Use the block loop.** It removes the branch and reads memory in order. The branch version is easier to remember, but the block version is what passes the time limit in the compiled languages.
5. **Reduce every addition.** Both operands must be below the modulus before the conditional subtraction. Reduce the input while reading, and never let a value grow past $2 \ast MOD$.
6. **Test the three smallest cases.** $n = 0$ checks the empty universe, $n = 1$ checks a single pass, and $n = 2$ checks that the two passes compose. A wrong direction usually shows up at $n = 1$.
7. **Differential-test against $3^n$.** For $n \le 8$, compare the transform with the submask enumeration on random arrays. This catches a swapped half faster than reading the code.
8. **For subset convolution, add the rank only after the plain transform works.** The rank turns a ten-line program into a thirty-line program, and debugging both at once is unnecessary.
9. **Measure the memory before submitting.** The ranked form is $n+1$ arrays. At $n = 20$ each array is about $4$ megabytes and the whole set is about $84$ megabytes, and the limit may be the binding constraint rather than the time.

## Worked problems

### Problem 1: the three counts

**Restatement.** Given a list of $n \le 2 \cdot 10^5$ integers with $x_i \le 10^6$, print for each element $x$ three counts: the number of elements $y$ with $x \mid y = x$, the number with $x \mathrel{\&} y = x$, and the number with $x \mathrel{\&} y \ne 0$. This is the CSES problem [Bit Problem](https://cses.fi/problemset/task/1654).

**Naive baseline.** For each $x$, scan the whole list and test the three conditions. That is $O(n^2)$, which is $4 \cdot 10^{10}$ comparisons at the limit.

**Insight.** The conditions are subset and superset conditions on the bits. The first says $y \subseteq x$, the second says $y \supseteq x$, and the third says $y$ is not disjoint from $x$. A frequency table over the masks plus the two zeta transforms answers the first two for every mask. The number of masks disjoint from $x$ is the subset count at the complement, so the third answer is $n$ minus that count.

**Derivation.** Let $F$ be the full mask $2^{20} - 1$; twenty bits are enough because $10^6 < 2^{20}$. Build `cnt[mask]` from the input. Apply the subset transform to obtain `sub[S] = sum cnt[T]` over $T \subseteq S$, and the superset transform to obtain `super[S] = sum cnt[T]` over $T \supseteq S$. For each $x$:

- The number of $y$ with $y \subseteq x$ is `sub[x]`.
- The number of $y$ with $y \supseteq x$ is `super[x]`.
- The number of $y$ disjoint from $x$ is `sub[F ^ x]`, because disjointness means $y \subseteq F \setminus x$. The third answer is $n$ minus that count.

**Correctness.** The subset transform is exactly the count of collection members contained in a mask, by the definition of the transform. The superset transform is its dual. The complement is a bijection between the submasks of $F \setminus x$ and the masks disjoint from $x$, so the subtraction leaves exactly the masks that share at least one set bit with $x$. Each of the three printed values is therefore the required count.

**Complexity.** $O(20 \cdot 2^{20} + n)$ time and $O(2^{20})$ space for the frequency table and the two transformed copies. The two transforms together are about $20$ million additions, and the input scan is at most $200$ thousand tests.

**Common wrong approach.** Taking the complement of $x$ in 32 bits, as `~x`, and using it as an index. The high bits are set, so the index is negative or far outside the table. The complement has to be masked to the $20$ bits of the universe.

### Problem 2: the disjoint splits

**Restatement.** Given $n \le 20$ and two arrays $f$ and $g$ of length $2^n$, compute

$$
h[S] = \sum_{T \subseteq S} f[T] \, g[S \setminus T] \pmod{998244353}
$$

for every mask $S$. This is the Library Checker problem [Subset Convolution](https://judge.yosupo.jp/problem/subset_convolution).

**Naive baseline.** For each $S$, enumerate its submasks and add the product. The cost is $3^n$, which is $3.5$ billion at $n = 20$.

**Insight.** The zeta transform diagonalizes the OR convolution but not the disjoint-union convolution. Adding the subset size as a rank restores the missing information: after the ranked transform, the rank records how many elements each part contributes, and the total rank detects an overlap.

**Derivation.** Build $n+1$ arrays $F_0, \ldots, F_n$ with $F_k[T] = f[T]$ when $|T| = k$ and zero otherwise. Zeta-transform each one. Do the same for $g$. For each mask $S$ and each $k$, compute

$$
H_k[S] = \sum_{j=0}^{k} F_j[S] \, G_{k-j}[S].
$$

Mobius-transform each $H_k$ in the mask coordinate, then read $h[S] = H_{|S|}[S] \bmod 998244353$.

**Correctness.** The ranked zeta transform at rank $k$ sums $f[T]$ over the submasks $T$ of $S$ with exactly $k$ elements. The product at ranks $j$ and $k-j$ therefore sums $f[A]g[B]$ over pairs contained in $S$ with $|A| + |B| = k$. The Mobius inversion keeps only the pairs whose union is exactly $S$. At rank $|S|$, a pair that covers $S$ and has total size $|S|$ cannot overlap, so the coefficient is the disjoint sum. This is the ranked-convolution theorem proved in the correctness section.

**Complexity.** $O(n^2 2^n)$ time and $O(n 2^n)$ memory. The rank dimension contributes a factor of $n$ to both. The transform itself is $n+1$ arrays times $n$ passes, the product step is a triangular sum over the ranks, and the inversion is the same $n+1$ passes again.

**Common wrong approach.** Multiplying the unranked zeta transforms pointwise and inverting once. That computes the OR convolution, which counts overlapping pairs; the two-singleton counterexample in the common mistakes section shows the difference on the smallest possible input.

### Problem 3: the partial-match queries

**Restatement.** There are $2^L$ snakes numbered $0, 1, \ldots, 2^L - 1$, and snake $i$ has a toxicity digit $S[i]$. Each snake is described by the $L$-bit binary expansion of its index. A complaint is a string $T$ of length $L$ over the characters `0`, `1`, and `?`: a `0` fixes that part to blue, a `1` fixes it to red, and a `?` leaves it free. For each complaint, report the sum of the toxicities of the snakes that match. Constraints: $1 \le L \le 20$ and $1 \le Q \le 10^6$. This is the JOI 2018 problem [Snake Escaping](https://oj.uz/problem/view/JOI18_snake_escaping).

**Naive baseline.** For each complaint, scan all $2^L$ snakes and test the fixed bits. That is $Q 2^L$, which is $10^6 \cdot 10^6 = 10^{12}$ tests at the limit.

**Insight.** A query is the intersection of a subset condition and a superset condition: the `0` positions must be unset, the `1` positions must be set, and the `?` positions are free. The subset sums and the superset sums answer each half, and inclusion-exclusion removes the positions that are incorrectly free. The three sets of positions partition $L$, so the smallest has size at most $\lfloor L/3 \rfloor \le 6$; the program can choose whichever of the three methods is cheapest.

**Derivation.** Let `sub[mask]` be the sum of $S[T]$ over $T \subseteq mask$, and `super[mask]` the sum over $T \supseteq mask$. Compute both with the transforms. For a query, let

- $A$ be the set of positions fixed to `0`,
- $B$ be the set of positions fixed to `1`,
- $C$ be the set of positions fixed to `?`.

Let `base` be the mask with the bits of $B$ set. Then:

- If $|C| \le 6$, enumerate every subset $X \subseteq C$ and add $S[\text{base} \mid X]$.
- Else if $|A| \le 6$, compute $\sum_{X \subseteq A} (-1)^{|X|} \text{super}[\text{base} \mid X]$.
- Else $|B| \le 6$, compute $\sum_{Y \subseteq B} (-1)^{|B|-|Y|} \text{sub}[C \mid Y]$.

The first formula is direct enumeration. The second uses inclusion-exclusion over the zero positions: `super[base | X]` sums every snake that contains the fixed one bits and the extra bits $X$, and the signs remove the snakes that have a forbidden one at a zero position. The third is the dual: `sub[C | Y]` sums snakes contained in the free positions plus the chosen one positions, and the signs force every one position to be set.

**Correctness.** In the first case, every assignment of the free positions gives exactly one matching mask, and the enumeration visits each one once. In the second case, the inclusion-exclusion indicator $\sum_{X \subseteq A} (-1)^{|X|} [X \subseteq M]$ is $1$ when $M$ has no bit of $A$, and $0$ otherwise, which is exactly the condition that the zero positions stay zero. In the third case, the indicator $\sum_{Y \subseteq B} (-1)^{|B|-|Y|} [M \subseteq C \cup Y]$ is $1$ when $M$ contains every bit of $B$, and $0$ otherwise, which is the condition that the one positions stay one. The three cases therefore compute the same sum on the masks that match the complaint.

**Complexity.** $O(L 2^L)$ to build both transforms and $O(2^{\min(|A|,|B|,|C|)}) \le O(2^{\lfloor L/3 \rfloor})$ per query. At $L = 20$ and $Q = 10^6$, that is about $20$ million transform operations plus $64$ million query operations. The memory is two tables of $2^L$ values.

**Common wrong approach.** Using only the subset transform and trying to force the `1` positions by subtraction. The subset sums know which masks are contained in a set, not which sets contain a fixed mask. The `1` positions need either the superset sums or the inclusion-exclusion over the missing bits, and mixing the two directions produces a count that is correct on all-`?` queries and wrong as soon as a `1` appears.

## Practice progression

1. **Recognition.** Given a statement, write the required quantity as a sum over $T \subseteq S$, over $T \supseteq S$, or as an exact-set coefficient after inversion. Decide which of the three transforms is the target before writing code.
2. **Direct application.** Implement the subset transform on an array of length $2^n$ for $n \le 8$, and check it against the submask enumeration on random arrays.
3. **Adaptation.** Add the superset direction and the Mobius inverse. Check that the inverse recovers the original array, and that the two directions are not accidentally swapped.
4. **Counting.** Solve the three-counts problem with a frequency table, and handle the complement inside the correct number of bits.
5. **Convolution.** Add the rank coordinate, implement subset convolution, and compare it with the $3^n$ definition on small random inputs.
6. **Combination.** Combine the transform with a second idea: a partial-match query split into three position sets, a chromatic-number DP over independent sets, or a covering count that needs one more inclusion-exclusion layer.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of the subset zeta transform and the superset zeta transform. (Formal model)
2. Why does the naive computation cost $3^n$, and what is the sum that proves it? (Naive approach)
3. What is the invariant before the pass for bit $i$, and what does the pass change it to? (Algorithm derivation)
4. Why is the in-place update safe, and which half is read and which is written? (Key insight)
5. Why does the inverse use subtraction, and why is the order of the inverse passes irrelevant? (Correctness proof)
6. How many additions does the transform perform at $n = 20$, and how does that compare with $3^{20}$? (Complexity analysis)
7. What does the plain zeta transform compute for an OR convolution, and why is that not the subset convolution? (Algorithm selection)
8. What is the smallest counterexample that separates the unranked product from the subset convolution, and what does the wrong program report? (Common mistakes)
9. How does the rank coordinate detect an overlap? (Formal model and Worked problems)
10. In the partial-match problem, why is one of the three position sets always small? (Worked problems)
11. When is a sparse push better than the dense transform? (Variants and extensions)
12. Why can a min-over-subsets transform not be inverted? (Algorithm selection)

## Further reading

- The mask state and the dynamic programs that use it are in [bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp).
- The subset relation as a directed acyclic graph, and the dynamic programs that run on it, are in [dynamic programming on a directed acyclic graph](/algorithms/dynamic-programming/dag-dp).
- The enumeration that the transform replaces is the submask loop used in [backtracking](/algorithms/enumeration/backtracking) and in the search patterns of [meet in the middle](/algorithms/enumeration/meet-in-the-middle).
- The bit encoding that makes a mask an array index is in [binary representation](/algorithms/foundations/binary-representation).
- The arithmetic that makes the counts fit in a machine word is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The prefix-sum analogy is easiest to see beside a [Fenwick tree](/algorithms/range-queries/fenwick-tree), which is a prefix sum over a different poset.
- The three worked problems are [Bit Problem](https://cses.fi/problemset/task/1654), [Subset Convolution](https://judge.yosupo.jp/problem/subset_convolution), and [Snake Escaping](https://oj.uz/problem/view/JOI18_snake_escaping).
