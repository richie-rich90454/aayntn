---
id: enumeration.gray-codes
title: Gray codes
summary: List every n-bit string so that consecutive strings differ in exactly one bit, using a closed-form bit formula instead of a search.
division: [bronze, silver]
subjects: [enumeration]
level: intermediate
importance: specialized-technique
keywords:
    [
        gray code,
        reflected binary code,
        hypercube,
        hamiltonian cycle,
        bit manipulation,
        hamming distance,
    ]
prerequisites:
    required: [foundations.binary-representation]
    recommended: [enumeration.subset-enumeration, foundations.complexity]
complexity:
    time: "O(n 2^n)"
    space: "O(n) auxiliary"
assumptions:
    - The codes are emitted in binary reflected Gray code order, starting at zero.
    - n is at most 20, so one machine word holds every code and the 2^n lines remain practical to print.
implementations: enumeration.gray-codes
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/enumeration.gray-codes.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A Gray code is an ordering of all $2^n$ binary strings of length $n$ in which each string differs from the next in exactly one bit. The order is not the usual binary counting order. For two bits the Gray code is

$$
00,\; 01,\; 11,\; 10,
$$

while binary counting gives $00, 01, 10, 11$, and the step from $01$ to $10$ changes two bits at once.

The binary reflected Gray code, which is the version used throughout this article, has a closed form. For $0 \le i < 2^n$, the $i$-th code is

$$
g_n(i) = i \oplus (i \gg 1),
$$

where $\oplus$ is bitwise exclusive or and $\gg$ is a right shift. The entire program is a loop over $i$, one exclusive-or, and a loop over the bits of the result to print it with leading zeros.

The technique is four decisions.

1. **Which order.** The reflected order is the one with a closed form, a simple recursive construction, and the cyclic property that the last code differs from the first in one bit.
2. **How to compute the code.** The formula $i \oplus (i \gg 1)$ is constant time; the recursive reflection is the proof-friendly alternative.
3. **How to print it.** Every line must have exactly $n$ characters, so leading zeros are part of the output rather than decoration.
4. **Whether the cycle matters.** Some problems ask only for a path, and some require the last code to be adjacent to the first. The reflected code satisfies both.

The cost is dominated by the output. There are $2^n$ lines of $n$ characters, so every correct program spends $\Theta(n 2^n)$ time writing characters, and the arithmetic between the characters is constant time. Gray codes are therefore an output-bound technique: the interesting part is producing the right order with $O(1)$ work per line, not reducing an exponential search.

Gray codes and [subset enumeration](/algorithms/enumeration/subset-enumeration) visit the same $2^n$ objects. Subset enumeration visits them in mask order; a Gray code visits them so that one element is added or removed at each step. That difference is what makes Gray order useful when the state between two consecutive subsets must be updated cheaply.

## Problem motivation

The canonical statement is the one from [CSES Gray Code](https://cses.fi/problemset/task/2205): given $n$ with $1 \le n \le 16$, print $2^n$ lines of $n$ bits, starting at $0$, so that any two successive lines differ in exactly one bit. The judge accepts any valid Gray code, and the reflected code is one valid answer.

The naive program prints the integers from $0$ to $2^n - 1$ in binary, padded to $n$ bits. It prints every string exactly once and every line has the right width, but it is not a Gray code. For $n = 3$ the sequence begins

$$
000,\; 001,\; 010,\; 011,\; 100, \ldots
$$

and the step from $001$ to $010$ flips two bits, while the step from $011$ to $100$ flips three. Binary counting changes a suffix of bits at once, and the length of that suffix is the number of trailing ones in the counter.

The requirement is easy to state and surprisingly easy to get subtly wrong. A program can produce a valid Gray code and still fail because it prints $3$ instead of $11$, or because the second half of the reflection is copied in the wrong direction. Both failures produce $2^n$ lines and a plausible-looking sequence, so they survive a casual look.

Gray codes matter outside the judge as well. A rotary encoder that reports a position in ordinary binary can report a transient wrong value when several bits change at once; a Gray-coded disk changes one bit per step, so the transient is at most one position. In testing, a Gray sequence changes one input at a time, which makes it possible to attribute a failure to a single input. In algorithms, the same property lets a program enumerate all subsets while maintaining a running sum, a count, or a data structure with one insertion or deletion per step. The [subset enumeration](/algorithms/enumeration/subset-enumeration) article uses the masks; Gray order adds the one-change schedule.

The output size sets the limits before any algorithm does. At $n = 16$ there are $65\,536$ lines of $16$ characters, about $1.1$ MB. At $n = 20$ there are $1\,048\,576$ lines and about $22$ MB. At $n = 30$ the output is about $33$ GB, so no amount of bit-level cleverness makes the full listing practical. The reference programs therefore state $1 \le n \le 20$.

## Recognition patterns

Gray codes are the right tool when the statement contains one of these ideas.

- "Print all $2^n$ bit strings" together with "successive strings differ in exactly one bit".
- The phrase "Gray code", "reflected binary code", or "single-bit change".
- "Hamiltonian path" or "Hamiltonian cycle" on the $n$-dimensional hypercube.
- "Cut the number of changes", "minimize switching", or "one input changes at a time".
- "Find the $k$-th Gray code" or "decode a Gray code".
- "Enumerate all subsets, and update the answer after adding or removing one element".

The constraint values decide the shape of the program.

| Situation | What it rules |
| --- | --- |
| $n \le 20$ and the full list is required | Closed form, print $2^n$ lines; the output is the bottleneck |
| Only the $k$-th code is needed, $k < 2^n$ | $g(k) = k \oplus (k \gg 1)$ in constant time; $n$ may be much larger |
| A Gray encoding must be decoded | Prefix exclusive-or in $O(n)$ or $O(\log n)$ word operations |
| Consecutive subsets must differ by one element | Generate the flip position instead of the whole code |
| $n \ge 30$ and every code must be printed | The output is tens of gigabytes or more; recheck the problem |
| The required order is lexicographic | Gray order is not lexicographic; use binary counting or a sorted enumeration |
| The objects are permutations, not subsets | The one-change analogue is a combinatorial Gray code, not the bit formula |

The last table row is the one that decides most mistaken applications. A Gray code orders **fixed-length bit strings**. A problem that asks for all permutations in an order where consecutive permutations differ by one swap is a different object, covered by [permutations](/algorithms/enumeration/permutations). A problem that asks for all subsets in an order where consecutive subsets differ by one element is the subset version of Gray order, and it can be built from the bit version or from the revolving-door construction.

Three situations rule the technique out.

- **The order must be sorted.** The reflected code for $n = 2$ is $00, 01, 11, 10$, which is not lexicographic. If the judge compares against sorted output, Gray order is the wrong answer.
- **The graph is not a hypercube.** A Hamiltonian path in a general graph is NP-hard, and the Gray formula says nothing about it. [Backtracking](/algorithms/enumeration/backtracking) is the tool there.
- **The output is a count, not a list.** If the answer is the number of Gray codes or a property of one, the formula and a counting argument replace the enumeration.

## Naive approach

The first baseline is binary counting with zero padding.

```python
def binary_order(n):
    for value in range(1 << n):
        print(f"{value:0{n}b}")
```

This is correct as an enumeration of all $n$-bit strings, and it costs $O(n 2^n)$ time, which is optimal for the output. It fails the adjacency condition at every carry that crosses more than one bit. For $n = 2$ the step $01 \to 10$ changes two bits. For $n = 3$ the step $011 \to 100$ changes three bits.

The second baseline is the reflective construction, which builds the list level by level.

```python
def reflected(n):
    codes = [""]
    for _ in range(n):
        codes = ["0" + code for code in codes] + ["1" + code for code in reversed(codes)]
    return codes
```

This is correct. At each level, every old code appears once with a leading $0$, and once with a leading $1$ in reverse order. The leading bit is the only difference across the seam, and the reversal makes the last old code appear on both sides of the seam. The cost is $O(n 2^n)$ time and $O(n 2^n)$ characters of memory. For $n = 16$ it is about $1.1$ MB of payload and is perfectly acceptable; for $n = 20$ it is about $22$ MB and the string copies dominate. The construction is the standard first draft, and it is also the cleanest proof that the reflected code exists.

The third baseline is a depth-first search over the hypercube: start at $0^n$, try the neighbors in some order, and backtrack when a partial path cannot be completed. It is correct if it explores every alternative, and it finds a Hamiltonian path for the hypercube, but it can wander into dead ends and undo work. It is the right shape for a general graph and the wrong shape for the hypercube, where the answer has a formula.

The reference programs use neither the list construction nor the search. They use the closed form and print each code as it is computed, so the auxiliary space is one word and a few counters.

## Key insight

The insight is that the reflected Gray code is the image of ordinary counting under a linear bit map:

$$
g(i) = i \oplus (i \gg 1).
$$

Two facts make this useful.

**It is a bijection.** The map is invertible. If $g = i \oplus (i \gg 1)$, then

$$
i = g \oplus (g \gg 1) \oplus (g \gg 2) \oplus \cdots \oplus (g \gg (n-1)).
$$

The sum telescopes: the term $i \gg k$ for $1 \le k \le n-1$ appears once from the shift of $i$ and once from the shift of $i \gg 1$, so the duplicate terms cancel. What remains is $i \oplus (i \gg n)$, and $i \gg n = 0$ for $i < 2^n$. So every $n$-bit word appears exactly once as $i$ runs from $0$ to $2^n - 1$.

**Consecutive values differ in one bit.** Let $t = i + 1$, and let $p = \operatorname{ctz}(t)$ be the number of trailing zeros of $t$, which is the position of its least significant set bit. Then $i = t - 1$ and $t$ differ in exactly the bits $0, 1, \ldots, p$, so

$$
i \oplus (i + 1) = 2^{p+1} - 1.
$$

After shifting right by one, the same two values differ in the bits $0, 1, \ldots, p-1$:

$$
(i \gg 1) \oplus ((i + 1) \gg 1) = 2^p - 1.
$$

Exclusive-or the two equations and the low $p$ bits cancel:

$$
g(i) \oplus g(i + 1) = 2^p.
$$

A power of two has exactly one set bit, so exactly one bit changes. The position of that bit is the number of trailing zeros of $i + 1$, which is the ruler sequence $0, 1, 0, 2, 0, 1, 0, 3, \ldots$.

The reflection view explains the same order without algebra. To build the $(n+1)$-bit code from the $n$-bit code, write the old sequence with a leading $0$, then write the old sequence with a leading $1$ in reverse. The seam between the two copies changes only the leading bit, and the reversal keeps every step inside each copy adjacent. The first word is $0^{n+1}$, and the last word is $1\,0^n$, which differs from the first in the leading bit, so the cycle closes.

The formula is the part that makes the program short. The reflection is the part that makes the order obvious.

## Visual intuition

The two-bit code is a square, and the three-bit code is the same square plus a reflected copy above it.

```text
G_1:   0 ------- 1

G_2:   00 ------ 01
       |         |
       10 ------ 11
       (read 00, 01, 11, 10)

G_3:   000 --- 001 --- 011 --- 010
                               |
       100 --- 101 --- 111 --- 110
       (read the lower row left to right, then the upper row right to left)
```

Read the lower row from left to right, move up the seam, and read the upper row from right to left. Each horizontal step flips exactly one bit, the vertical seam between $010$ and $110$ flips the first bit, and the wrap from $100$ back to $000$ flips the first bit again. The picture is the recursive construction drawn as a ladder.

The same object is a Hamiltonian cycle on the cube. The eight vertices of the three-dimensional cube are the eight bit strings, and two vertices are joined when they differ in one bit. The Gray sequence walks every vertex once and returns to the start, so it uses exactly one edge per vertex.

The flip schedule is the ruler sequence. For four bits, the bit that changes between $g(i)$ and $g(i+1)$ is the position of the lowest set bit of $i + 1$.

| $i$ | $g_4(i)$ | flip to the next code |
| --- | -------- | --------------------- |
| 0   | 0000     | bit 0                 |
| 1   | 0001     | bit 1                 |
| 2   | 0011     | bit 0                 |
| 3   | 0010     | bit 2                 |
| 4   | 0110     | bit 0                 |
| 5   | 0111     | bit 1                 |
| 6   | 0101     | bit 0                 |
| 7   | 0100     | bit 3                 |
| 8   | 1100     | bit 0                 |

The pattern repeats: after the first eight codes, the lower three bits run through the same sequence in reverse with a leading $1$. The largest flip position grows slowly, and the sequence of positions is exactly the sequence of disk numbers, with the smallest disk numbered zero, in the optimal Tower of Hanoi solution.

## Formal model

Let $\{0,1\}^n$ be the set of binary words of length $n$. The Hamming distance $d_H(x, y)$ is the number of positions at which $x$ and $y$ differ.

::: math definition Definition
A **Gray code** of length $n$ is a sequence $G = (w_0, w_1, \ldots, w_{2^n-1})$ that contains every word of $\{0,1\}^n$ exactly once and satisfies $d_H(w_i, w_{i+1}) = 1$ for every $0 \le i < 2^n - 1$. It is **cyclic** when $d_H(w_{2^n-1}, w_0) = 1$ as well.
:::

::: math definition Definition
The **binary reflected Gray code** is the sequence $G_n = (g_n(0), g_n(1), \ldots, g_n(2^n-1))$ with

$$
g_n(i) = i \oplus (i \gg 1),
$$

where $i$ is written as an $n$-bit word and the shift discards the bit that falls off the end.
:::

::: math definition Definition
The **hypercube** $Q_n$ has vertex set $\{0,1\}^n$, with an edge between two vertices exactly when their Hamming distance is one. A Gray code is a Hamiltonian path in $Q_n$, and a cyclic Gray code is a Hamiltonian cycle.
:::

The inverse map is

$$
h_n(y) = y \oplus (y \gg 1) \oplus (y \gg 2) \oplus \cdots \oplus (y \gg (n-1)).
$$

::: math lemma Lemma
For every $n \ge 1$ and every $0 \le i < 2^n$, the word $g_n(i)$ has length $n$, and $h_n(g_n(i)) = i$. Therefore $g_n$ is a bijection on $\{0,1\}^n$.
:::

::: math lemma Lemma
For every $n \ge 1$ and every $0 \le i < 2^n - 1$,

$$
g_n(i) \oplus g_n(i+1) = 2^{\operatorname{ctz}(i+1)},
$$

where $\operatorname{ctz}(t)$ is the exponent of the largest power of two that divides $t$. Therefore consecutive codes differ in exactly one bit.
:::

::: math lemma Lemma
For every $n \ge 1$, $g_n(2^n - 1) = 2^{n-1}$ and $g_n(0) = 0$. Therefore the last and first codes differ in exactly one bit.
:::

::: math invariant Invariant
Before iteration $i$ of the generation loop, the program has printed exactly the codes $g_n(0), g_n(1), \ldots, g_n(i-1)$ in that order, each with exactly $n$ characters and a terminating newline. After the last iteration it has printed the entire sequence.
:::

The invariant is the bridge between the mathematical sequence and the output. The lemmas establish the properties of the sequence; the invariant establishes that the loop prints it without dropping a line, reordering a pair, or losing a leading zero.

## Algorithm derivation

Start with the definition. The sequence has one entry per index $i$ from $0$ to $2^n - 1$, and the entry is $g_n(i)$. The direct algorithm is therefore a loop with three steps per iteration: compute the code, write its $n$ bits, and write a newline.

```text
read n
for i from 0 to 2^n - 1:
    gray = i XOR (i >> 1)
    for bit from n - 1 down to 0:
        write (gray >> bit) AND 1
    write newline
```

The inner loop runs from the most significant bit to the least significant bit. Printing the bits from least significant to most significant also produces a valid Gray code, but a different one; the choice must be fixed once and used by every language version. The reference programs all print the most significant bit first.

The bits must be printed even when they are zero. The value $g_n(i)$ is an integer, and printing an integer in decimal drops its leading zeros. The inner loop is what preserves the width: it visits every one of the $n$ positions, including the positions above the highest set bit.

The same sequence can be produced incrementally. Start with $g = 0$ and print it. For $i = 1, 2, \ldots, 2^n - 1$, flip the bit at position $\operatorname{ctz}(i)$ and print the result.

```text
gray = 0
print gray
for i from 1 to 2^n - 1:
    gray = gray XOR (1 << ctz(i))
    print gray
```

This form is useful when the consumer needs the flip position rather than the code. It uses one expensive operation, the count of trailing zeros, which some languages provide as a builtin; otherwise it can be computed with a loop over at most $n$ bits.

The recursive form follows the reflection directly. It carries a direction flag because the second half of each level is the first half in reverse.

```python
def emit(level, word, forward):
    if level == 0:
        print("".join(word))
        return
    bits = ("0", "1") if forward else ("1", "0")
    word.append(bits[0])
    emit(level - 1, word, True)
    word.pop()
    word.append(bits[1])
    emit(level - 1, word, False)
    word.pop()
```

The recursive form has depth $n$ and makes $2^{n+1} - 1$ calls, so it is a teaching tool rather than the fastest implementation. The reference programs use the closed form.

The formula and the recursion are the same sequence. The first half of $G_n$ has leading bit $0$ and lower bits equal to $G_{n-1}$. The second half has leading bit $1$, and its lower bits are $G_{n-1}$ in reverse. The closed form proves the first half because $i < 2^{n-1}$ has no bit $n-1$, so $g_n(i) = g_{n-1}(i)$ in the lower bits. For the second half, write $i = 2^{n-1} + j$. The top bit of $g_n(i)$ is $1$, and the lower $n-1$ bits are those of $g_{n-1}(2^{n-1} - 1 - j)$, which is the reverse of the first half. The reflection is therefore not a coincidence; it is the closed form read from the top bit down.

## Step-by-step execution

Take $n = 3$. The loop runs $i = 0$ through $7$, and each iteration prints the three bits of $g_3(i)$.

| $i$ | $i$ in binary | $i \gg 1$ | $g_3(i)$ | printed | flip to the next   |
| --- | ------------- | --------- | -------- | ------- | ------------------ |
| 0   | 000           | 000       | 000      | 000     | bit 0              |
| 1   | 001           | 000       | 001      | 001     | bit 1              |
| 2   | 010           | 001       | 011      | 011     | bit 0              |
| 3   | 011           | 001       | 010      | 010     | bit 2              |
| 4   | 100           | 010       | 110      | 110     | bit 0              |
| 5   | 101           | 010       | 111      | 111     | bit 1              |
| 6   | 110           | 011       | 101      | 101     | bit 0              |
| 7   | 111           | 011       | 100      | 100     | bit 2, back to 000 |

Walk through the first few iterations.

1. **$i = 0$.** $0 \oplus 0 = 0$, so the first line is $000$. The program has printed the string $0^3$, which is the required starting point.
2. **$i = 1$.** $1 \oplus 0 = 1$, printed as $001$. The only difference from the previous line is the last bit.
3. **$i = 2$.** $2 \oplus 1 = 3$, printed as $011$. The middle bit flips on, and the last bit stays set.
4. **$i = 3$.** $3 \oplus 1 = 2$, printed as $010$. Only the last bit changes.
5. **$i = 4$.** $4 \oplus 2 = 6$, printed as $110$. Only the leading bit changes, from $0$ to $1$.
6. **$i = 5$.** $5 \oplus 2 = 7$, printed as $111$. The last bit flips.
7. **$i = 6$.** $6 \oplus 3 = 5$, printed as $101$. The middle bit flips off.
8. **$i = 7$.** $7 \oplus 3 = 4$, printed as $100$. The last bit flips. The last line differs from the first in the leading bit, so the sequence is cyclic.

The incremental view produces the same eight lines from a different starting point: start with $000$, then flip bit $0$ (giving $001$), bit $1$ ($011$), bit $0$ ($010$), bit $2$ ($110$), bit $0$ ($111$), bit $1$ ($101$), and bit $0$ ($100$). The positions are $\operatorname{ctz}(1)$ through $\operatorname{ctz}(7)$.

The recursive view builds the same sequence in three levels.

- $G_1 = (0, 1)$.
- $G_2 = (00, 01, 11, 10)$: prefix $0$ to $G_1$, then prefix $1$ to the reverse of $G_1$.
- $G_3 = (000, 001, 011, 010, 110, 111, 101, 100)$: prefix $0$ to $G_2$, then prefix $1$ to the reverse of $G_2$.

The middle seam of $G_3$ is $010 \to 110$, which changes one bit. The seams at every level have the same property.

For comparison, binary counting for $n = 3$ prints $000, 001, 010, 011, 100, 101, 110, 111$. The $001 \to 010$ step changes two bits, and the $011 \to 100$ step changes three. The strings are the same set; only the order is different, and the order is the entire problem.

## Correctness proof

::: math theorem Theorem
For every $n \ge 1$, the sequence $G_n$ is a cyclic Gray code: it contains every $n$-bit word exactly once, consecutive words differ in exactly one bit, the first word is $0^n$, and the last word differs from the first in exactly one bit.
:::

::: math proof Proof
**Every value is an $n$-bit word.** For $0 \le i < 2^n$, both $i$ and $i \gg 1$ are less than $2^n$, so their exclusive-or is less than $2^n$ and has an $n$-bit representation. The representation is padded with leading zeros when printed.

**Every value is distinct.** The inverse formula gives $h_n(g_n(i)) = i$ for every $i$. If $g_n(i) = g_n(j)$, applying $h_n$ to both sides gives $i = j$. Therefore the $2^n$ values $g_n(0), \ldots, g_n(2^n-1)$ are pairwise distinct. There are exactly $2^n$ words of length $n$, so the sequence contains every word exactly once.

**The inverse formula is correct.** Expand the definition of $h_n$:

$$
h_n(g_n(i)) = \bigoplus_{k=0}^{n-1} \bigl(g_n(i) \gg k\bigr)
= \bigoplus_{k=0}^{n-1} \bigl((i \gg k) \oplus (i \gg (k+1))\bigr).
$$

Every term $i \gg k$ for $1 \le k \le n-1$ appears twice and cancels, leaving $i \oplus (i \gg n)$. Since $i < 2^n$, the last term is zero, so the result is $i$.

**Consecutive values differ in one bit.** Fix $i$ with $0 \le i < 2^n - 1$, and put $t = i + 1$ and $p = \operatorname{ctz}(t)$. The binary representations of $t-1$ and $t$ agree above bit $p$, bit $p$ changes from $0$ to $1$, and bits $0$ through $p-1$ change from $1$ to $0$. Hence

$$
i \oplus t = 2^{p+1} - 1.
$$

Shifting both sides right by one drops bit $0$ from that mask:

$$
(i \gg 1) \oplus (t \gg 1) = 2^p - 1.
$$

Exclusive-or the two equations. The masks $2^{p+1}-1$ and $2^p-1$ agree on bits $0$ through $p-1$, so those bits cancel, and only bit $p$ remains:

$$
g_n(i) \oplus g_n(i+1) = 2^p.
$$

A power of two has exactly one set bit, so exactly one bit differs.

**The first and last values close the cycle.** The first value is $g_n(0) = 0 \oplus 0 = 0$. For $n = 1$ the last value is $1$ and the check is immediate. For $n \ge 2$ the last value is

$$
g_n(2^n-1) = (2^n-1) \oplus (2^{n-1}-1) = 2^{n-1},
$$

because the two operands agree on bits $0$ through $n-2$ and differ at bit $n-1$, so the exclusive-or leaves only bit $n-1$. The last value is the word with a single $1$ in the most significant position, so it differs from $0^n$ in exactly one bit. $\square$
:::

::: math proof Proof
The loop prints exactly the required output.
:::

The loop runs $i = 0, 1, \ldots, 2^n-1$, so it prints exactly $2^n$ lines. At iteration $i$ the value printed is $g_n(i)$, and the inner loop visits every bit position from $n-1$ down to $0$, so each line has exactly $n$ characters, including the leading zeros. The newline after each line makes the lines separate. The theorem above identifies the printed sequence as a cyclic Gray code, and $g_n(0) = 0$ gives the required starting line. Therefore the output satisfies every condition of the contract.

The argument is an invariant argument in disguise. Before iteration $i$ the program has printed the prefix $g_n(0), \ldots, g_n(i-1)$; the iteration appends $g_n(i)$ and preserves the invariant; after the final iteration the printed prefix is the whole sequence.

## Complexity analysis

**Time.** The loop runs $2^n$ times. Each iteration performs one exclusive-or, one shift, and $n$ bit tests, so the arithmetic and formatting cost $O(n)$ per line, or $O(n 2^n)$ in total. The output contains $2^n$ lines of $n$ characters plus $2^n$ newlines, which is $(n+1)2^n$ characters. Every correct program must write those characters, so $\Theta(n 2^n)$ is optimal for the full listing.

**Space.** The iterative reference uses one integer for $i$, one for the code, and a few loop counters, so the auxiliary space is $O(n)$ if the bits are produced one at a time, or $O(1)$ words if the output is streamed. The Python and JavaScript programs buffer all lines before writing, which trades $O(n 2^n)$ characters of memory for fewer write calls. That buffer is the only reason their memory is not constant; it can be removed by printing each line as it is formed.

**Bit width.** For $n \le 20$, a 32-bit unsigned integer holds $i$ and $g_n(i)$. For $n \le 30$, $2^n$ still fits in a signed 32-bit integer, but $n = 31$ is the first shift that overflows a signed 32-bit value, and the output at that size is already impractical. A program that computes only the $k$-th code can use a 64-bit type for $n \le 62$. The output size, not the integer width, is the real limit.

The table gives the output size for the values that matter.

| $n$ | Codes         | Characters printed | Approximate size |
| --- | ------------- | ------------------ | ---------------- |
| 1   | 2             | 4                  | 4 bytes          |
| 4   | 16            | 80                 | 80 bytes         |
| 10  | 1,024         | 11,264             | 11 KB            |
| 16  | 65,536        | 1,114,112          | 1.1 MB           |
| 20  | 1,048,576     | 22,020,096         | 22 MB            |
| 30  | 1,073,741,824 | 33,285,996,544     | 33 GB            |

The comparison with the naive reflection is instructive. Both methods are $\Theta(n 2^n)$ in time because both must write the same output. The reflection spends additional time copying strings at every level and stores the whole sequence; the closed form computes each code from its index and can print it immediately. The asymptotic class is the same, but the constant and the memory are not.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Print all codes, $n \le 20$ | The closed form $g(i) = i \oplus (i \gg 1)$ |
| Print only the $k$-th code | The same formula with $i = k$, no loop |
| Decode a Gray word back to its index | The prefix exclusive-or, $O(n)$ or $O(\log n)$ with doubling shifts |
| Print the flip positions instead of the codes | $\operatorname{ctz}(i)$ for $i = 1, \ldots, 2^n-1$ |
| Enumerate subsets with one update per step | Gray order over the bitmask, updating the running value |
| The order must be lexicographic | Binary counting or sorting, not Gray order |
| All permutations, consecutive by one swap | [Permutations](/algorithms/enumeration/permutations) with a combinatorial Gray code |
| A Hamiltonian path in a general graph | [Backtracking](/algorithms/enumeration/backtracking), not a Gray formula |
| A Hamiltonian cycle in a hypercube | The reflected code; it already closes the cycle |
| A cyclic matrix of all $(N+M)$-bit words | The product of an $N$-bit and an $M$-bit Gray code |

The distinction between the first and the fifth row matters. The first row produces a list of words. The fifth row uses the order as a schedule: the program starts with the empty subset, and each step adds or removes the element whose bit flips. If the program needs the changed element, the incremental form with $\operatorname{ctz}$ is more direct than diffing two consecutive codes.

The distinction between the first and the sixth row is the one that costs points. A Gray code is not sorted, and a problem that says "in increasing order" is not asking for one. Read the output specification before choosing the order.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal, and JavaScript. There is no `minimal` variant, because the algorithm is short enough that the complete program is the reference: each file reads the same input, computes the same closed form, and prints the same bytes.

The contract is fixed across all six files.

- **Input:** one integer $n$, with $1 \le n \le 20$.
- **Output:** $2^n$ lines. Line $i$ is the $n$-character binary representation of $i \oplus (i \gg 1)$, with leading zeros, for $i = 0, 1, \ldots, 2^n-1$. The first line is $0^n$.
- **Order:** binary reflected Gray code. The last line differs from the first in exactly one bit.
- **Fixtures:** the shared cases are $n = 1$, $n = 2$, and $n = 4$.

The language-specific choices are narrow.

- **C** uses `uint32_t`, `putchar`, and a manual bit loop, so no format string is needed and the width is explicit.
- **C++17** uses `std::uint32_t`, `std::cout`, and the same manual bit loop, with the standard stream synchronization disabled.
- **Java** reads with `Scanner` and writes through a `BufferedOutputStream`, one byte per bit; the class is `Main` so the file can be submitted unchanged.
- **Python** uses `1 << n`, the closed form, and `format(gray, f"0{n}b")`, then joins the lines and writes them once.
- **Pascal** uses `Integer`, `xor`, `shr`, and a manual bit loop with one `Write` per bit; it does not use 128-bit integers, and every `Read` has exactly one argument.
- **JavaScript** uses `readFileSync`, the closed form, `toString(2)` with `padStart(n, "0")`, and one `write` of the joined lines. The default `sort` and numeric formatting traps do not arise here.

The JavaScript and Pascal files begin with the required educational-reference notice, because neither language is a USACO submission language. All six variants are marked `unverified` until the validation job compiles them and compares their output on the shared fixtures. They are expected to be byte-identical on those fixtures, including the final newline.

## Recursion decision

The recursive form has depth $n$, which is at most 20 in this contract. Every language can handle that depth comfortably.

| Language   | Default stack              | Practical depth         | Verdict for depth 20 |
| ---------- | -------------------------- | ----------------------- | -------------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Recursion is safe    |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Recursion is safe    |
| Python     | Interpreter limit of 1000  | 1000 frames             | Recursion is safe    |
| Pascal     | The operating system stack | Depends on the platform | Recursion is safe    |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Recursion is safe    |

The stack is not the reason the reference programs are iterative. The reason is the number of calls. The recursive emitter makes $2^{n+1}-1$ calls, about two million at $n = 20$, while the closed-form loop makes $2^n$ iterations with no call overhead. The recursion also copies or appends a prefix at every node unless it uses a mutable buffer, and the copies add up to $O(n 2^n)$ character writes before the output is even printed.

When the recursive form is the clearer choice, use a mutable character array and undo the last character on the way back, exactly as a backtracking search restores its state.

```python
def emit(level, word, forward):
    if level == 0:
        print("".join(word))
        return
    first, second = ("0", "1") if forward else ("1", "0")
    word.append(first)
    emit(level - 1, word, True)
    word.pop()
    word.append(second)
    emit(level - 1, word, False)
    word.pop()
```

The direction flag is the part that is easy to omit. Without it, the second half is printed in the same order as the first, and the seam between the halves changes the lower bits as well as the leading bit. The result is not a Gray code.

The closed form has no recursion, no direction flag, and no restore step. For this technique, the iterative form wins on both clarity and constant factors.

## Implementation walkthrough

The core of the C++ program is four lines.

```cpp
const std::uint32_t total = 1u << n;
for (std::uint32_t i = 0; i < total; ++i) {
    const std::uint32_t gray = i ^ (i >> 1);
    for (int bit = n - 1; bit >= 0; --bit) {
        std::cout << ((gray >> bit) & 1u);
    }
    std::cout << '\n';
}
```

The Python core is shorter because the formatting library does the padding.

```python
for i in range(1 << n):
    gray = i ^ (i >> 1)
    lines.append(format(gray, f"0{n}b"))
```

Three details decide whether the output is correct.

**Padding.** The inner loop, or the format specifier, must cover all $n$ positions. Printing the integer directly produces the right order but the wrong width. The next section works through the smallest failure.

**The shift is logical.** In C and C++ the value is unsigned, so the shift is logical. In Java and JavaScript, `>>` on a negative signed value replicates the sign bit; `>>>` shifts in zeros. The loop index is nonnegative here, so both operators agree, but `>>>` documents the intent and stays correct if the code is reused on a word with the high bit set. In Pascal, `shr` on a nonnegative `Integer` is the logical shift for the stated range.

**The output is buffered.** At $n = 20$ the program writes 22 MB. C uses `putchar` on a buffered stream; C++ disables synchronization with stdio and unties `cin`; Java wraps `System.out` in a `BufferedOutputStream`; Python joins the lines and writes once; JavaScript joins and calls `write` once; Pascal relies on the runtime buffer. A program that writes one character at a time through an unbuffered API can be an order of magnitude slower than the arithmetic requires.

Two smaller details are worth a line.

- **The bound is exclusive.** The loop runs while $i < 2^n$, not $i \le 2^n$, so the last index is $2^n-1$ and the last code is $2^{n-1}$ in the reflected order.
- **The newline is part of the output.** Every line, including the last, ends with a newline. A missing final newline is a difference that some judges report and some tolerate; the fixtures require it.

The Pascal version spells the same steps out because it has no format string for binary. It reads one integer with `Read(N)`, computes `GrayCode := I xor (I shr 1)`, and prints each bit with `Write(IntToStr((GrayCode shr Bit) and 1))`. The parentheses make the intent explicit: shift first, then mask.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Printing the integer without padding | Lines have fewer than $n$ bits | Print every bit position, or use a zero-padded format |
| Using binary counting | Some consecutive lines differ in two or more bits | Use the reflected order or the closed form |
| Appending the second half in the same order | The seam between the halves changes several bits | Prefix 1 to the reversed first half |
| Using `>>` on a signed negative word | The sign bit is replicated and the bit pattern is wrong | Use `>>>` in Java and JavaScript, or an unsigned type |
| Shifting by $n$ in a 32-bit type | $1 \ll 31$ overflows a signed 32-bit value | Keep $n \le 20$, or use an unsigned or 64-bit type |
| Omitting the final newline | The last line is not a line | Write a newline after every code |
| Buffering nothing and writing per character | The program is much slower than the output requires | Buffer the output, or build the lines first |
| Confusing the forward and inverse maps | A decoded value is wrong | Forward is $g = i \oplus (i \gg 1)$; inverse is the prefix exclusive-or |
| Assuming the order is sorted | The output does not match a lexicographic specification | Check the required order before choosing Gray codes |

### Why this fails: the missing leading zeros

The plausible wrong approach is to trust the formula and print the resulting integer.

```python
def print_codes(n):
    for i in range(1 << n):
        print(i ^ (i >> 1))
```

For $n = 2$ this prints

```text
0
1
3
2
```

The order is a valid Gray code of the integers, and the steps $0 \to 1$, $1 \to 3$, $3 \to 2$ each change one bit. The output is still rejected, because the required lines are $00, 01, 11, 10$. The first line has one character instead of two, and the last two lines show $3$ and $2$ instead of $11$ and $10$.

The smallest case that exposes the bug is $n = 2$. For $n = 1$ the decimal output is $0, 1$, which happens to be exactly the required one-bit strings, so the bug is invisible. At $n = 2$ the value $3$ needs two bits, and the missing zero appears.

The failure is silent in the sense that the program prints the right number of lines and exits normally. It is not silent to a judge that compares strings: every line whose value has a leading zero differs from the expected line. The fix is to print the bits, not the integer, or to use a zero-padded binary format with width $n$.

The same section could be written about the opposite mistake. Binary counting has the right width and the wrong adjacency. A correct solution needs both properties, and a test that checks only the line count catches neither. The cheapest check is to compare every consecutive pair with a popcount of one, and to compare the last pair with the first when the problem asks for a cycle.

## Variants and extensions

- **The $k$-th code only.** Return $k \oplus (k \gg 1)$ without generating the prefix. For $n \le 62$ a 64-bit integer is enough. This is the form used when a problem asks for one position in the sequence rather than the whole list.
- **Inverse Gray code.** Decode with the prefix exclusive-or. A loop over the bits costs $O(n)$; the doubling form `g ^= g >> 1; g ^= g >> 2; g ^= g >> 4; ...` costs $O(\log n)$ word operations and is the standard bit trick. [CodeChef Gray Codes](https://www.codechef.com/problems/GRAYCODE) is the decoding exercise.
- **Successor generation.** Maintain the current code and flip bit $\operatorname{ctz}(i)$ at step $i$. This produces the flip positions directly and is the form used when each step must update a data structure.
- **Cyclic order.** The reflected code is already cyclic. If a problem asks for a path only, the same sequence works; if it asks for a cycle, the last-to-first edge is the extra guarantee.
- **Two-dimensional Gray matrix.** For an $N$ by $M$ toroidal matrix of all $(N+M)$-bit words, assign cell $(r, c)$ the value $(g_N(r) \ll M) \mid g_M(c)$. A horizontal step changes only the column code, a vertical step changes only the row code, and both codes are cyclic, so the wrap-around edges also change one bit. [SGU 249 Matrix](https://codeforces.com/problemsets/acmsguru/problem/99999/249) is this construction.
- **Balanced Gray codes.** In a balanced Gray code each bit position flips the same number of times, which is useful when the cost of a flip depends on the position. Balanced codes exist for many lengths, but the construction is more involved than the reflected code.
- **Combinatorial Gray codes.** The same one-change idea applies to combinations and permutations. The revolving-door order changes one combination by one swap of an included and an excluded element; the Steinhaus-Johnson-Trotter order changes one permutation by one adjacent transposition. These are covered with the enumeration of [permutations](/algorithms/enumeration/permutations).
- **$n$-ary Gray codes.** Over an alphabet of size $k$, consecutive words differ in one digit by one step modulo $k$. The binary formula does not generalize unchanged, and the construction depends on whether $k$ is even or odd.
- **Tower of Hanoi.** With the smallest disk numbered zero, the disk moved at step $i$ of the optimal solution is disk $\operatorname{ctz}(i)$, the same ruler sequence. The positions of the disks follow a Gray code, which is why the two problems share a pattern.
- **Snake-in-the-box.** A snake is an induced path in the hypercube, which is a Gray code with the extra condition that nonconsecutive vertices are not adjacent. Finding the longest snake is a hard combinatorial problem, and for $n \ge 3$ the reflected code has chords, so it is not one.

## Contest strategy

1. **Read the output specification twice.** Decide whether the judge requires a specific order, a specific starting word, or only any valid Gray code. The reflected code starting at $0^n$ satisfies the common cases.
2. **Compute the output size.** There are $(n+1)2^n$ characters. If that is beyond the limit, the problem is not asking for the full list, or the constraints are smaller than they look.
3. **Choose the form.** Use the closed form for the full list, the constant-time formula for one index, and the prefix exclusive-or for decoding. Do not build a list when a loop can print.
4. **Fix the width.** Pad every line to $n$ bits. Test $n = 2$, where the unpadded output first differs from the required one.
5. **Fix the bit width of the integer.** For the full list, $n \le 20$ is comfortable in 32 bits. For a $k$-th code with larger $n$, use 64 bits and check the shift.
6. **Buffer the output.** The arithmetic is not the bottleneck; the writes are. Use the buffered stream of the language, or join the lines and write once.
7. **Test the boundaries.** Run $n = 1$ (two lines, one bit), $n = 2$ (the square), and $n = 4$ (the first level where the most significant bit flips). Check the cycle if the statement asks for one.
8. **Check adjacency mechanically.** For each consecutive pair, compute the exclusive-or and count the set bits. The count must be one. Also check that the set of lines has size $2^n$ and no duplicates.
9. **Do not sort.** Sorting the lines destroys the adjacency property. If the statement asks for sorted output, it is not a Gray code problem.
10. **Keep the six versions aligned.** The bit order, the padding, and the newline must be identical across languages; a difference in any of them changes the output bytes.

## Worked problems

### Problem 1: print a Gray code

**Restatement.** This is [CSES Gray Code](https://cses.fi/problemset/task/2205). Given $n$ with $1 \le n \le 16$, print $2^n$ lines of $n$ bits so that successive lines differ in exactly one bit. The sample for $n = 2$ is $00, 01, 11, 10$.

**Naive baseline.** Print the integers $0$ through $2^n-1$ in binary. The output has the right set of strings and the right width, but the carry from $01$ to $10$ changes two bits.

**Insight.** The reflected code has the closed form $g(i) = i \oplus (i \gg 1)$. Consecutive indices differ in a suffix of bits, and the exclusive-or with the shifted value cancels all but the highest bit of that suffix.

**Derivation.** Loop $i$ from $0$ to $2^n-1$; compute $g$; print the $n$ bits of $g$ from most significant to least significant; print a newline. The first line is $0^n$ because $g(0) = 0$. The last line is $1\,0^{n-1}$, which differs from the first in the leading bit.

**Correctness.** The inverse formula shows that the $2^n$ values are distinct, so every $n$-bit word appears once. The trailing-zero calculation shows that each consecutive pair differs in exactly one bit. The first and last values differ in the leading bit, so the code is cyclic. The output loop prints every bit position, so the width is correct.

**Complexity.** $O(n 2^n)$ time and $O(n)$ auxiliary space, or $O(n 2^n)$ memory if the lines are buffered. At $n = 16$ the output is about $1.1$ MB.

**Common wrong approach.** Printing the integer without padding. The order is right, but $3$ appears instead of $11$ and the judge rejects the line. The bug is invisible at $n = 1$ and appears at $n = 2$.

### Problem 2: decode a Gray code

**Restatement.** This is [CodeChef Gray Codes](https://www.codechef.com/problems/GRAYCODE). The first line holds the number of test cases $t$; each of the next $t$ lines holds an integer that is the Gray encoding read as a binary number. For each case, print the integer that the encoding represents. The sample maps $0, 1, 2, 3, 4, 5, 6, 7$ to $0, 1, 3, 2, 7, 6, 4, 5$.

**Naive baseline.** Treat the input as an ordinary binary number. That returns the encoding itself, not the value it encodes. For the sample, the fourth line would print $3$ instead of $2$, and the seventh would print $6$ instead of $4$.

**Insight.** The forward map is $g = i \oplus (i \gg 1)$. The inverse is the prefix exclusive-or: $i = g \oplus (g \gg 1) \oplus (g \gg 2) \oplus \cdots$, stopping when the shifted value becomes zero.

**Derivation.** For each test case, set `value = 0` and repeatedly exclusive-or the current word into `value` while shifting the word right by one. The loop terminates when the word becomes zero. With a fixed bit length, the doubling form applies the same idea in $O(\log n)$ shifts: `value = g; value ^= value >> 1; value ^= value >> 2; value ^= value >> 4; ...`.

**Correctness.** The forward map is a bijection, and the telescoping identity $h_n(g_n(i)) = i$ proves that the prefix exclusive-or is its inverse. The doubling form computes the same prefix exclusive-or in a different order, so it returns the same value.

**Complexity.** $O(B)$ time per test case for the bit loop, where $B$ is the number of bits in the encoding, and $O(1)$ auxiliary space. The doubling form uses $O(\log B)$ shifts. The input and output dominate for a large number of cases.

**Common wrong approach.** Applying the forward formula once more. $g \oplus (g \gg 1)$ is not the inverse of $g$; it is the forward map applied to $g$. The inverse needs the whole prefix, not one shifted term.

### Problem 3: fill a cyclic matrix

**Restatement.** This is [SGU 249 Matrix](https://codeforces.com/problemsets/acmsguru/problem/99999/249). Given $N$ and $M$ with $N + M \le 20$, fill a matrix with $2^N$ rows and $2^M$ columns with the numbers $0$ through $2^{N+M}-1$, each exactly once, so that any two cells sharing a side differ in exactly one bit. The matrix is cyclic: the first and last columns are adjacent, and the first and last rows are adjacent. For $N = M = 1$ the sample is

```text
0 2
1 3
```

**Naive baseline.** Put the row-major index in each cell and convert it to binary. Adjacent cells in a row have consecutive indices, but a carry can change several low bits; the carry from the end of a row to the next row changes many bits, and the wrap-around from the last column to the first changes several as well.

**Insight.** A cyclic Gray code for the row index and a cyclic Gray code for the column index can be combined by concatenation. The cell value is $(g_N(r) \ll M) \mid g_M(c)$. A horizontal step changes one bit inside the $M$ low bits, and a vertical step changes one bit inside the $N$ high bits.

**Derivation.** Build the row codes $g_N(0), \ldots, g_N(2^N-1)$ and the column codes $g_M(0), \ldots, g_M(2^M-1)$ with the closed form. For each row $r$ and each column $c$, print the integer whose high $N$ bits are the row code and whose low $M$ bits are the column code. Print $2^M$ integers per line.

**Correctness.** The pair $(g_N(r), g_M(c))$ is unique for each cell because both maps are bijections, so every value from $0$ to $2^{N+M}-1$ appears exactly once. A horizontal step changes $c$ to $c+1$ or wraps from $2^M-1$ to $0$; the column code changes in one bit in both cases, and the row code is unchanged, so the whole value changes in one bit. A vertical step is symmetric. Therefore the matrix satisfies the adjacency condition in both directions, including the cyclic wrap.

**Complexity.** The matrix has $2^{N+M}$ cells, and each cell costs $O(N+M)$ time to format, so the total is $O((N+M)2^{N+M})$ time and $O(N+M)$ auxiliary space. The output itself has $2^{N+M}$ integers, so the time is output-bound.

**Common wrong approach.** Using ordinary binary row and column indices. The step from column $1$ to column $2$ changes two bits in the column index, so the concatenated value changes two bits, and the wrap from the last column to the first can change several bits as well. Both axes must use a cyclic Gray code.

## Practice progression

1. **Recognition.** Given a sequence of bit strings, decide whether it is a Gray code by computing the Hamming distance of every consecutive pair. Do the same for the wrap-around pair and say whether the code is cyclic. This is the check every later stage reuses.
2. **Direct application.** Implement the closed form for $n \le 4$ in your contest language. Print the bits with leading zeros and compare the output with the recursive reflection. Confirm that the two sequences are identical, not merely both valid.
3. **Adaptation.** Change the program to print only the $k$-th code, then to print the flip position between consecutive codes, then to decode a Gray word back to its index. Each change should touch one function, not the whole program.
4. **Combination.** Enumerate all subsets of a small array in Gray order and maintain the sum of the chosen elements with one addition or subtraction per step. Use the running sum to count the subsets that satisfy a threshold, and compare the result with the mask-order enumeration.
5. **Challenge.** Solve the two-dimensional cyclic matrix. Prove that the product construction is a bijection and that both the horizontal and the vertical wrap-around edges change one bit. Then try a balanced Gray code and count how often each bit flips.
6. **Transfer.** Find the ruler sequence in the Tower of Hanoi and explain why, with the smallest disk numbered zero, the disk moved at step $i$ is the disk at position $\operatorname{ctz}(i)$. Then read about combinatorial Gray codes for permutations and identify the operation that replaces the bit flip.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is a Gray code, and what extra condition makes it cyclic? (Formal model)
2. Why does $i \oplus (i \gg 1)$ change exactly one bit when $i$ increases by one? (Key insight)
3. What is the inverse map, and why does the prefix exclusive-or recover $i$? (Formal model)
4. How many lines and how many characters does the full output contain at $n = 16$ and at $n = 20$? (Complexity analysis)
5. What is the smallest $n$ at which unpadded decimal output is wrong, and what does the wrong program print? (Common mistakes)
6. Why is binary counting not a Gray code, and which is the first failing step for $n = 2$ and $n = 3$? (Naive approach)
7. What are the two halves of the reflection construction, and why is the second half reversed? (Visual intuition)
8. When is the recursive emitter preferable, and why do the reference programs avoid it? (Recursion decision)
9. Which shift operator is safe in Java and JavaScript when the sign bit may be set, and why? (Implementation walkthrough)
10. How do you construct a cyclic Gray matrix from two one-dimensional codes? (Variants and extensions)
11. When should you use subset enumeration or permutation enumeration instead of Gray order? (Algorithm selection)
12. What is the asymptotic lower bound for printing the full list, and why can no program beat it? (Complexity analysis)

## Further reading

- The bit operations that the formula relies on are developed in [binary representation](/algorithms/foundations/binary-representation), including shifts, masks, and exclusive-or.
- The same $2^n$ objects in mask order are the subject of [subset enumeration](/algorithms/enumeration/subset-enumeration), which is the natural comparison for the one-change order.
- The one-change analogue for permutations is [permutations](/algorithms/enumeration/permutations), where consecutive arrangements differ by a swap rather than a bit flip.
- The output-bound analysis and the exponential arithmetic are in [complexity](/algorithms/foundations/complexity).
- The general search that replaces the formula on a graph that is not a hypercube is [backtracking](/algorithms/enumeration/backtracking).
- The original CSES exercise is [Gray Code](https://cses.fi/problemset/task/2205); the inverse exercise is [CodeChef Gray Codes](https://www.codechef.com/problems/GRAYCODE); the two-dimensional construction is [SGU 249 Matrix](https://codeforces.com/problemsets/acmsguru/problem/99999/249).
