---
id: foundations.amortized-analysis
title: Amortized analysis
summary: Bound the total cost of a sequence of operations, not the worst case of one operation, by charging the expensive steps to the cheap steps that made them necessary.
division: [silver, gold]
subjects: [foundations]
level: intermediate
importance: core-prerequisite
keywords:
    [
        amortized analysis,
        aggregate method,
        accounting method,
        potential method,
        dynamic array,
        doubling,
        capacity,
        stack,
        monotonic stack,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [start.algorithm-analysis]
complexity:
    time: "O(n) total for n pushes, O(1) amortized per push"
    space: "O(n) for the array"
assumptions:
    - The sequence starts with an empty dynamic array whose capacity is one.
    - A resize copies every stored element and doubles the capacity before the new element is placed.
implementations: foundations.amortized-analysis
reviewed: false
---

## At a glance

Amortized analysis answers a question that a worst-case bound cannot answer: over a long sequence of operations, how much work does the sequence do in total? A single operation may be expensive, but if the expensive operations are rare and each one is paid for by many cheap operations, the average cost over the sequence can be small even though no individual operation is cheap.

The standard example is a dynamic array that doubles its capacity when it is full. The array starts with capacity one. The second push copies one element, the third copies two, the fifth copies four, the ninth copies eight, and so on. A push that triggers a resize of an array holding $k$ elements costs $k+1$ units: $k$ copies and one placement. That is a $\Theta(n)$ operation for an array of size $n$. Nevertheless, for $n \ge 1$, $n$ pushes copy at most $2n-2$ elements in total, so the whole sequence costs $O(n)$ and the amortized cost of one push is $O(1)$.

Three methods prove the same bound. The **aggregate method** sums the costs of all operations and divides. The **accounting method** charges each operation a fixed amount, saves the surplus, and pays for expensive operations from the savings. The **potential method** stores the surplus in a function of the data structure's state and shows that the function never goes negative. The three methods are equivalent in what they can prove, and the potential method is usually the easiest to write down.

This article derives the bound for the doubling array, proves it with all three methods, applies the same reasoning to a stack that supports multipop, and connects the argument to the monotonic stacks and two pointers that appear throughout the encyclopedia. The reference program reports the total number of copied elements and the final capacity for a given number of pushes.

## Problem motivation

A problem states: read $n$, then perform $n$ pushes into a dynamic array that starts with capacity one and doubles whenever it is full. Print the total number of elements copied during resizing and the final capacity.

The natural worst-case analysis is discouraging. At the moment of a resize the array holds $k$ elements, so the resize copies $k$ elements. Since $k$ can be as large as $n$, a single push can cost $\Theta(n)$. Multiplying the worst case by the number of pushes gives $O(n^2)$, which would rule out the data structure for $n=10^6$. That bound is a true upper bound, but it is not tight, and using it would reject an approach that is actually linear.

The gap between the two answers is the whole subject. The resize that copies $k$ elements happens only after $k$ pushes have filled the array. Those $k$ pushes are exactly the operations that created the need to copy. If each of them sets aside a little credit, the resize can be paid for without charging any single push the full $k$. Doubling is what makes the set-aside sufficient: the capacity grows geometrically, so the copy costs also grow geometrically, and a geometric series is dominated by its last term.

The same shape appears whenever a loop removes elements from a container. A stack loop that pops until the stack is empty can run for $n$ iterations in one call, which looks quadratic if the outer loop also runs $n$ times. But every element that is popped was pushed once, so the total number of pops over the whole run is at most the number of pushes. The expensive call is paid for by the pushes that preceded it.

## Recognition patterns

Reach for amortized analysis when the problem or the code has one of these shapes.

- **A resize or rebuild whose cost is proportional to the current size.** Dynamic arrays, hash tables that rehash when the load factor is exceeded, and buffers that compact when they fill.
- **A loop that removes elements from a container.** A `while` loop that pops a stack, a queue, or a heap until it is empty; each element can be removed at most once.
- **A monotonic stack or a monotonic queue.** Every index enters and leaves the structure once, even though one query may pop many indices.
- **A union-by-size or union-by-rank structure.** The smaller component is merged into the larger one, so each element changes component only $O(\log n)$ times.
- **A two-pointer scan.** Each pointer moves in one direction and never returns, so the total movement is linear even though one step may move a pointer far.
- **A statement that asks for a total over $q$ operations.** The per-operation worst case may be large, but the sum over the sequence is what the output requires.
- **A geometric series in the constraints.** When a quantity doubles or halves at every level, the total over all levels is proportional to the largest level.

The signal is not only the code. It is also the question. "What is the total number of copies?" and "What is the total number of pops?" are amortized questions. "What is the maximum latency of one operation?" is a worst-case question, and an amortized bound does not answer it.

Do not reach for amortized analysis when every operation must have a guaranteed bound. A real-time system that cannot tolerate a long resize, a persistent data structure in which an old version can be queried later, and an interactive problem with a per-query time limit are all places where the amortized argument does not give the guarantee that is needed.

## Naive approach

The baseline is to charge every operation its worst-case cost. For the dynamic array, the worst case is a resize that copies $k$ elements, so the baseline assigns $O(n)$ to every push and concludes $O(n^2)$ for $n$ pushes.

That reasoning is not wrong as a bound. It is wrong as a description of what happens. The array cannot resize on every push, because a resize doubles the capacity and the next resize needs at least as many new pushes as the array currently holds. The worst case is real, but it is not repeated $n$ times at the same size.

A second naive approach is to measure the average over a random input. That is an average-case analysis, not an amortized one. It assumes a distribution over inputs and says nothing about a particular sequence. Amortized analysis is deterministic: the bound holds for every sequence of operations, including the one an adversarial judge supplies.

A third naive approach is to count only the copies and forget the placements. For $n$ pushes the placements cost $n$, and for large $n$ they are the larger part of the total. The total work is the sum of both, which is why the final bound is $n$ plus the copy count, not the copy count alone.

## Key insight

The key insight is that an expensive operation is caused by the cheap operations that came before it, and doubling makes the debt collectible.

When the array is full at capacity $k$, it has been filled by $k$ pushes since it was empty, or by $k/2$ pushes since the previous resize. The resize copies $k$ elements. Charge each push a constant amount, save the part that is not spent, and the savings at the moment of the resize are enough to pay for the copy. Because the capacity doubles, the amount saved between resizes also doubles, so the savings account never runs dry.

The same idea is expressed by a potential function. The potential is a nonnegative number attached to the current state. It rises during cheap operations and falls during expensive ones. The amortized cost of an operation is its actual cost plus the change in potential. If the potential never goes negative, the sum of the amortized costs bounds the sum of the actual costs, and the final potential can only make the bound smaller.

The choice of potential is the creative step. For the doubling array, the potential is proportional to the number of elements minus the unused capacity, with a constant that keeps it nonnegative at the empty state. For a stack, the potential is simply the number of elements. For a union-find structure, the potential is more elaborate, but the accounting idea is the same: the expensive path compression is paid for by the finds that made the tree deep.

## Visual intuition

The copy costs of the doubling array form a geometric sequence. The following table lists every resize for the first seventeen pushes.

| Resize | Push that triggers it | Capacity before | Elements copied | Copies so far | Capacity after |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | 1 | 1 | 1 | 2 |
| 2 | 3 | 2 | 2 | 3 | 4 |
| 3 | 5 | 4 | 4 | 7 | 8 |
| 4 | 9 | 8 | 8 | 15 | 16 |
| 5 | 17 | 16 | 16 | 31 | 32 |

The gaps between successive trigger pushes are $1, 2, 4, 8$, and the copy costs are $1, 2, 4, 8, 16$. The two sequences are tied together by the doubling rule. After a resize at capacity $k$, the capacity is $2k$, so it takes $k$ more pushes to reach the next trigger. That next resize copies $2k$ elements, which is twice the number of pushes in the gap. The copy costs therefore grow at least as fast as the gaps, and the sum of the costs is bounded by twice the final cost.

The picture to keep in mind is a row of bars whose heights double and whose spacing also doubles. The total area of the bars is dominated by the last bar, not by the number of bars. A linear number of operations can therefore contain a logarithmic number of increasingly expensive resizes without becoming quadratic.

## Formal model

Let the operation sequence be $o_1, o_2, \dots, o_m$, and let $c_i$ be the actual cost of $o_i$ under a fixed cost model. Let $T(m) = \sum_{i=1}^{m} c_i$ be the total actual cost.

::: math definition Definition
The **amortized cost** of an operation in a sequence of $m$ operations is $T(m)/m$. A sequence has amortized cost $O(g(m))$ if $T(m) = O(m\,g(m))$ for every sequence of length $m$.
:::

This definition is about a sequence, not about a probability distribution. Every sequence of length $m$ must satisfy the bound.

::: math definition Definition
The **accounting method** assigns a charge $\hat c_i$ to operation $o_i$ such that for every prefix $j$,

$$
\sum_{i=1}^{j} \hat c_i \;\ge\; \sum_{i=1}^{j} c_i .
$$

The difference is a credit that is saved and spent later. If every charge is $O(g(m))$, the total actual cost is $O(m\,g(m))$.
:::

::: math definition Definition
The **potential method** defines a function $\Phi$ from states of the data structure to the nonnegative reals. If $D_{i}$ is the state after $o_i$, the amortized cost of $o_i$ is

$$
\hat c_i = c_i + \Phi(D_i) - \Phi(D_{i-1}).
$$

Because the sum telescopes,

$$
\sum_{i=1}^{m} c_i = \sum_{i=1}^{m} \hat c_i - \Phi(D_m) + \Phi(D_0) \;\le\; \sum_{i=1}^{m} \hat c_i
$$

whenever $\Phi(D_m) \ge \Phi(D_0)$.
:::

Now specialize to the dynamic array. A state is a pair $(s,k)$ where $s$ is the number of stored elements and $k$ is the capacity, with $0 \le s \le k$. The capacity is always a power of two, and the array starts at $(0,1)$.

A push has one of two costs. If $s < k$, the push stores one element and costs $1$. If $s = k$, the array first allocates capacity $2k$, copies the $k$ stored elements, and then stores the new element, so the push costs $k+1$. In both cases the size becomes $s+1$; in the second case the capacity becomes $2k$.

Let $K(n)$ be the smallest power of two that is at least $n$, with $K(0)=K(1)=1$. The final capacity after $n$ pushes is $K(n)$, and the number of copied elements is $K(n)-1$. The rest of the article proves both claims and uses them to bound the total work.

## Algorithm derivation

### The aggregate sum

Resizes happen when the array is full. Starting from capacity $1$, the capacities before successive resizes are

$$
1,\; 2,\; 4,\; \dots,\; 2^{j-1},
$$

where $j$ is the number of resizes. The total number of copied elements is therefore

$$
C(n) = 1 + 2 + 4 + \dots + 2^{j-1} = 2^{j} - 1.
$$

The capacity after the last resize is $2^{j}$. It is the smallest power of two that is at least $n$, because the push loop resizes exactly while the current capacity is smaller than $n$. Hence $C(n) = K(n)-1$.

The total work is the $n$ placements plus the copies:

$$
T(n) = n + C(n) = n + K(n) - 1.
$$

For $n \ge 1$, $K(n) < 2n$, so $C(n) < 2n - 1$ and $T(n) < 3n$. For $n=0$, both the copies and the placements are zero and the capacity stays at one.

### The accounting charge

Charge every push $3$ units. One unit pays for the placement of the new element, and two units are deposited in a savings account. The account is used only to pay for copies.

We prove that the balance never goes negative. Let $B_i$ be the balance after $i$ pushes. Initially $B_0=0$. If push $i$ does not resize, it spends $1$ of its $3$ units and adds $2$ to the balance, so $B_i = B_{i-1}+2$. If push $i$ resizes, then before the push the array holds $k$ elements at capacity $k$, and $i-1=k$. The copies performed before this moment number $k-1$, because the previous resizes copied $1, 2, 4, \dots, k/2$ elements and their sum is $k-1$. The actual cost before the push is therefore $k + (k-1) = 2k-1$, while the charges collected are $3k$. The balance is $B_{i-1} = 3k - (2k-1) = k+1$. The resize copies $k$ elements and places one new element, costing $k+1$, so the balance becomes $B_i = 0$. The balance is never negative, and the total charge $3n$ covers the total actual cost.

The charge of $3$ is not the only possible one, but it is the smallest constant charge that covers every sequence. A sequence of $2^{j}+1$ pushes has total cost $3n-3$, so any constant charge below $3$ fails for large enough $j$.

### The potential function

Define, after $i$ pushes,

$$
\Phi_i = 2i - k_i + 1,
$$

where $k_i$ is the capacity after $i$ pushes and $k_0=1$.

The potential is nonnegative. At $i=0$ it is $2 \ast 0 - 1 + 1 = 0$. For $i \ge 1$, the capacity $k_i$ is the smallest power of two that is at least $i$, so $k_i \le 2i$, and therefore $\Phi_i = 2i-k_i+1 \ge 1$.

Now compute the amortized cost of push $i$.

If the push does not resize, then $k_i = k_{i-1}$ and $c_i=1$. The potential changes by

$$
\Phi_i - \Phi_{i-1} = (2i-k_i+1) - (2(i-1)-k_{i-1}+1) = 2,
$$

so $\hat c_i = 1+2 = 3$.

If the push resizes, then $k_{i-1}=k$, $i-1=k$, and $k_i=2k$. The actual cost is $c_i=k+1$. The potential before the push is

$$
\Phi_{i-1} = 2k - k + 1 = k+1,
$$

and after the push it is

$$
\Phi_i = 2(k+1) - 2k + 1 = 3.
$$

The change is $3-(k+1) = 2-k$, so

$$
\hat c_i = (k+1) + (2-k) = 3.
$$

Every push has amortized cost exactly $3$ under this potential. Summing over $n$ pushes gives

$$
T(n) = 3n - \Phi_n + \Phi_0 = 3n - \Phi_n \le 3n,
$$

because $\Phi_n \ge 0$. This is the same result as the accounting argument, obtained by a different bookkeeping device.

### The same argument for a stack

A stack supports push, pop, and multipop, where multipop removes $t$ elements in one call. The actual cost of a multipop is $t$, which can be as large as the stack size. Define the potential to be the number of elements on the stack, so $\Phi \ge 0$ always.

- A push costs $1$ and increases the potential by $1$, so its amortized cost is $2$.
- A pop costs $1$ and decreases the potential by $1$, so its amortized cost is $0$.
- A multipop of $t$ elements costs $t$ and decreases the potential by $t$, so its amortized cost is $0$.

Every element that is popped was pushed once, so the total number of pops over any sequence is at most the number of pushes. The total actual cost is at most twice the number of pushes, which is $O(n)$ for $n$ pushes. The individual multipop can still be $\Theta(n)$; the bound is on the sequence.

## Step-by-step execution

Take $n=13$ pushes. The array starts at size $0$ and capacity $1$.

1. Push $1$: the array is not full, so the element is stored. Size $1$, capacity $1$, copies $0$.
2. Push $2$: the array is full at capacity $1$. Copy the one stored element, double the capacity to $2$, and store the new element. Copies $1$, size $2$.
3. Push $3$: the array is full at capacity $2$. Copy two elements, double to $4$, and store. Copies $3$, size $3$.
4. Push $4$: there is room, so no copy. Size $4$, capacity $4$, copies $3$.
5. Push $5$: the array is full at capacity $4$. Copy four elements, double to $8$, and store. Copies $7$, size $5$.
6. Pushes $6$ through $8$: there is room, so no copies. Size $8$, capacity $8$, copies $7$.
7. Push $9$: the array is full at capacity $8$. Copy eight elements, double to $16$, and store. Copies $15$, size $9$.
8. Pushes $10$ through $13$: there is room. The final capacity is $16$ and the total number of copies is $15$.

The resize trace is summarized below.

| Resize | Trigger push | Capacity before | Copied | Cumulative copies | Capacity after |
| ------ | ------------ | --------------- | ------ | ----------------- | -------------- |
| 1      | 2            | 1               | 1      | 1                 | 2              |
| 2      | 3            | 2               | 2      | 3                 | 4              |
| 3      | 5            | 4               | 4      | 7                 | 8              |
| 4      | 9            | 8               | 8      | 15                | 16             |

The final potential is $\Phi_{13} = 2 \ast 13 - 16 + 1 = 11$. The potential bound predicts a total cost of $3 \ast 13 - 11 = 28$. Directly, the $13$ placements plus $15$ copies also give $28$. The average cost per push is $28/13 \approx 2.15$, which is below the guaranteed upper bound of $3$.

As a second trace, consider the bracket string `(()())` with the stack rule that an opening bracket is pushed and a closing bracket pops one matching opening bracket. The operations are push, push, pop, push, pop, pop. There are three pushes and three pops, so the total work is six, even though the third operation could have popped a stack of size two and the last operation pops the remaining element. Every character enters the stack once and leaves at most once.

## Correctness proof

::: math theorem Theorem
After $n$ pushes into a dynamic array that starts at capacity one and doubles when full, the final capacity is $K(n)$, the smallest power of two that is at least $n$, and the total number of copied elements is $K(n)-1$.
:::

::: math proof Proof
The proof is by induction on the number of resizes.

If there is no resize, then $n \le 1$. The capacity remains $1$, no elements are copied, and $K(n)=1$, so the claims hold.

Suppose the array has just completed its $j$-th resize. Before that resize the capacity was $2^{j-1}$, so the resize copied $2^{j-1}$ elements and the new capacity is $2^{j}$. By induction, the copies before the resize were $1+2+\dots+2^{j-2}=2^{j-1}-1$. Adding the $2^{j-1}$ copies of the $j$-th resize gives $2^{j}-1$ copies in total.

The final capacity is a power of two. It is the smallest power of two that is at least $n$, because a resize occurs exactly when the array is full and the number of stored elements is still smaller than $n$. If the capacity were smaller than $n$, the next push would resize; if it were at least $n$, all remaining pushes would fit. Therefore the final capacity is $K(n)$ and the copy count is $K(n)-1$.
:::

::: math theorem Theorem
The total cost of $n$ pushes is at most $3n$, and the amortized cost of a push is at most $3$.
:::

::: math proof Proof
Use the potential $\Phi_i = 2i-k_i+1$ from the derivation. We showed that $\Phi_i \ge 0$ for every $i$, that $\Phi_0=0$, and that every push has amortized cost exactly $3$. Summing the amortized costs over the $n$ pushes gives

$$
\sum_{i=1}^{n} c_i = 3n - \Phi_n \le 3n.
$$

Dividing by $n$ gives an amortized cost of at most $3$ per push, which is $O(1)$.
:::

::: math theorem Theorem
The accounting scheme that charges every push $3$ units never lets the balance go negative, so the charges cover every actual cost.
:::

::: math proof Proof
Let $B_i$ be the balance after $i$ pushes. The only operations that withdraw from the account are resizes. At a resize that copies $k$ elements and places one new element, the balance before the resize is $k+1$, as computed in the derivation, and the withdrawal is $k+1$, so the balance after the operation is zero. Between resizes, every push adds $2$ to the balance and withdraws nothing. Since the balance starts at zero and every withdrawal is covered by the savings that preceded it, the balance is nonnegative after every push. The total charge is $3n$, so the total actual cost is at most $3n$.
:::

The two proofs establish the same bound by different means. The potential proof is usually shorter to write because it avoids reasoning about the exact moment of each withdrawal. The accounting proof is often easier to explain because it talks about saved credit rather than an abstract function.

## Complexity analysis

The dynamic array performs $n$ placements and at most $K(n)-1 < 2n$ copies, so the total work is $O(n)$. The amortized cost of one push is $O(1)$, while the worst-case cost of one push is $\Theta(n)$ at the moment of a resize.

| Quantity | Bound | Reason |
| --- | --- | --- |
| Copies for $n$ pushes | $K(n)-1$ | Sum of the geometric series of resize costs |
| Total work for $n$ pushes | $n+K(n)-1$ | Placements plus copies |
| Amortized cost of a push | at most $3$ | Potential argument |
| Worst-case cost of a push | $\Theta(n)$ | A resize at capacity $n/2$ copies $n/2$ elements |
| Final capacity | $K(n) < 2n$ for $n \ge 1$ | Smallest power of two at least $n$ |
| Space | $O(n)$ | The array stores $n$ elements and at most $n$ unused slots |

The constant in the amortized bound depends on the growth factor. With doubling, the total copy count is less than $2n$ and the potential charge is $3$. With a growth factor of $c>1$, the capacity after the $j$-th resize is $c^{j}$, the copy cost is $c^{j-1}$, and the total is

$$
\sum_{i=0}^{j-1} c^{i} = \frac{c^{j}-1}{c-1} \le \frac{c}{c-1}\,n,
$$

so the total remains $O(n)$, with a constant that grows as $c$ approaches $1$. The unused space grows with $c$, so the choice of $c$ is a tradeoff between copying and memory. A factor of $2$ is the usual compromise.

If the capacity grows by one instead of doubling, the copy costs are $1,2,3,\dots,n-1$, whose sum is $\Theta(n^2)$. The growth factor is what separates the linear structure from the quadratic one. A factor of $1$ is not a growth factor at all.

The reporting program in the reference implementations does not perform the pushes. It evaluates the resize recurrence directly, so its own running time is $O(\log n)$ and its auxiliary space is $O(1)$. The $O(n)$ bound above describes the modeled sequence, which is the object of the analysis.

## Algorithm selection

| Situation | What to use | Why |
| --- | --- | --- |
| Append-only sequence, length unknown | Dynamic array with doubling | $O(1)$ amortized append and compact storage |
| Length known in advance | Preallocated array | No copies and no unused capacity |
| Stack with nested removals | Array-backed stack | Every element is pushed and popped once |
| Monotonic stack or queue | Deque or array with a moving front | Each index enters and leaves once |
| Union and find with many merges | DSU with union by size and path compression | $O(\alpha(n))$ amortized per operation |
| Need a guaranteed per-operation bound | Balanced search tree or deamortized structure | Amortized bounds allow one long operation |
| Persistent versions of a structure | Path copying or a persistent tree | An old version can be charged again by a later query |
| Interactive latency bound | Preallocate or use a worst-case structure | A resize can stall one operation for $\Theta(n)$ |

The choice between amortized and worst-case is a choice about what the problem guarantees. A contest judge that runs one large test and measures the total time is satisfied by an amortized bound. A system that must answer every request within a fixed deadline is not. The same data structure can be correct in one setting and unacceptable in the other.

When two structures have the same amortized bound, prefer the one with the smaller constant and the simpler memory layout. A dynamic array with doubling has excellent cache behavior, which is why it often beats a balanced tree even when both are $O(\log n)$ or $O(1)$ amortized. The bound says what scales; the constant decides what passes.

## Reference implementations

The six reference programs implement the same contract.

```
Input:
  n

Output:
  one line with two integers: the total number of elements copied during
  resizing, and the final capacity.
```

The array starts at capacity one. A push that finds the array full copies every stored element, doubles the capacity, and then stores the new element. The programs compute the copy total by iterating over the resize events, not by storing the elements, because the number of copies depends only on the capacities.

| Language | File | Integer type | Note |
| --- | --- | --- | --- |
| C | `c/program.c` | `long long` | Reads with `scanf` and writes with `printf` |
| C++17 | `cpp17/program.cpp` | `long long` | Uses `std::cin` and `std::cout` |
| Java | `java/Main.java` | `long` | Class `Main`, reads with `Scanner` |
| Python | `python/program.py` | arbitrary precision | Reads one integer from standard input |
| Pascal | `pascal/program.pas` | `Int64` | Compiles under pas2js; one argument per `Read` |
| JavaScript | `javascript/program.js` | `Number` | Reads standard input with `fs.readFileSync` |

All six variants are `program` variants: they read standard input, write standard output, and are marked unverified until a reviewer runs them. The C, C++, Java, and Pascal versions use 64-bit integers because the copy total can exceed the range of a 32-bit signed integer for large $n$. Python integers are unbounded. JavaScript uses the double-precision `Number` type, which represents every integer up to $2^{53}$ exactly; that is far beyond the input sizes for which the final capacity is meaningful in this model.

The programs print one line with the copy count followed by the capacity, separated by a single space. The shared fixtures use the same format, so the six outputs are compared byte for byte after line-ending normalization.

## Recursion decision

The copy count can be defined recursively. If $C(n)$ is the number of copies for $n$ pushes, then $C(n)=0$ for $n \le 1$, and otherwise the last resize copies $K(n)/2$ elements and the rest of the count comes from the smaller instance:

$$
C(n) = C\!\left(\frac{K(n)}{2}\right) + \frac{K(n)}{2}.
$$

The recursion has depth $O(\log n)$, because the argument halves at every level. That depth is safe in every language in this encyclopedia, including Python's default limit of about one thousand frames: for $n \le 10^9$ the depth is at most thirty. A recursive implementation is therefore defensible.

The reference implementations use a loop instead. The loop has no base case, no return values, and no dependence on the call stack, and it reads exactly like the resize rule. The recursive form is useful for the proof, not for the code.

The recursion decision is different for the stack problems. A recursive descent that pushes and pops along the call stack has depth equal to the length of the input, which can reach $10^6$. In C and C++ that is a stack overflow risk at the default stack size, and in Python and JavaScript it is a hard limit that is much smaller. Use an explicit array-backed stack and an iterative scan. The explicit stack is also the structure that makes the amortized argument visible: each element is pushed once and popped once.

## Implementation walkthrough

The central loop is short:

```cpp
long long copies = 0;
long long capacity = 1;
while (capacity < n) {
    copies += capacity;
    capacity *= 2;
}
std::cout << copies << ' ' << capacity << '\n';
```

Each iteration models one resize. The array is full at `capacity`, so the resize copies `capacity` elements, and then the capacity doubles. The loop stops when the capacity is at least `n`, because no further push can trigger a resize. The final `capacity` is the answer for the second output, and `copies` is the answer for the first.

The loop does not allocate the array. That is not a shortcut in the analysis; it is the point of the aggregate method. The copy total depends only on the sequence of capacities, and the capacities depend only on $n$. Materializing the elements would add $O(n)$ time and $O(n)$ space without changing either output.

A literal simulation is also correct and is a useful check on small inputs:

```cpp
long long size = 0;
long long capacity = 1;
long long copies = 0;
for (long long i = 0; i < n; ++i) {
    if (size == capacity) {
        copies += capacity;
        capacity *= 2;
    }
    ++size;
}
```

The literal version performs $n$ pushes and is $O(n)$; the aggregate version is $O(\log n)$. Both produce the same two numbers. The aggregate version is the one used by the reference programs because it remains fast when $n$ is large.

The edge cases are $n=0$ and $n=1$. For $n=0$ the loop does not run, so the output is `0 1`: no elements were copied and the initial capacity is still one. For $n=1$ the output is also `0 1`, because the first push fits in the initial capacity. For $n=2$ the output is `1 2`, and for $n=3$ it is `3 4`.

The integer width matters. At $n=2^{30}+1$ the final capacity is $2^{31}=2{,}147{,}483{,}648$, which is one past the largest signed 32-bit integer, and the copy count is $2^{31}-1$. The values fit comfortably in a signed 64-bit integer. A 32-bit accumulator overflows in C and C++, wraps in Java, and loses exactness in JavaScript only after $2^{53}$. Use 64 bits in every compiled language unless the input bound proves that the final capacity is below $2^{31}$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Multiplying the worst-case push cost by $n$ | The bound becomes $O(n^2)$ and rejects a linear structure | Sum the sequence, not the worst case |
| Treating amortized as average-case | The bound is claimed only for random inputs | Prove it for every sequence; no distribution is used |
| Saying every push is $O(1)$ | A single resize is $\Theta(n)$ | Say $O(1)$ amortized, and state the worst case separately |
| Growing the capacity by one | The copy total becomes $\Theta(n^2)$ | Double, or multiply by a constant greater than one |
| Shrinking at half full | Push and pop around the threshold trigger repeated resizes | Shrink at a quarter full, or use a hysteresis gap |
| Counting the initial allocation as a copy | The answer is off by one | Copies happen only when a full array is resized |
| Using 32-bit arithmetic | The copy count overflows for large $n$ | Use 64-bit integers in C, C++, Java, and Pascal |
| Forgetting the final capacity | The second output is missing or stale | Track the capacity after the last resize |
| Assuming the capacity is exactly $n$ | The array usually has unused slots | The capacity is the next power of two at least $n$ |
| Charging a resize to the push that triggers it | That push looks $\Theta(n)$ and the total looks quadratic | Charge the preceding pushes, or use a potential |
| Applying an amortized bound to a persistent structure | An old version can be queried and charged again | Use a worst-case or persistent bound |
| Ignoring the constant in the growth factor | A factor of $1.01$ is linear in theory but slow in practice | Use a factor near $2$ unless memory dominates |

### Why this fails: multiplying the worst case by the number of operations

The plausible wrong analysis is this. A push can cost $\Theta(n)$ when it resizes. There are $n$ pushes. Therefore the total is $O(n^2)$.

The smallest counterexample is $n=4$. The capacities are $1,2,4,4$ after the four pushes. The resizes copy $1$ and $2$ elements, for a total of $3$ copies. The total work is $4$ placements plus $3$ copies, which is $7$. The naive bound gives $4 \ast 4 = 16$. The gap is not a constant factor that can be ignored; at $n=2^{k}$ the naive bound is $n^2$ while the actual work is $2n-1$.

The mistake is not the claim that one push can be expensive. The mistake is the assumption that the expensive case can happen at every step. A resize doubles the capacity, so the next resize cannot happen until the array has been filled again, and that takes at least as many pushes as the array currently holds. The expensive events are separated by the work that makes them possible.

A second plausible wrong analysis is this. The final capacity is less than $2n$, so the number of copies is less than $n$. Therefore the total work is less than $2n$.

The smallest counterexample is $n=5$. The final capacity is $8$ and the copies are $1+2+4=7$, which is greater than $n$. The correct bound is $K(n)-1$, and $K(n)$ can be almost $2n$, so the copy count can be almost $2n$, not $n$. The total is still $O(n)$, but the constant in the statement must be right.

### Why this fails: shrinking at the half-full threshold

A dynamic array that grows by doubling and shrinks by halving whenever the size falls to half the capacity can be forced into a resize on every operation. Start with capacity $4$ and size $4$. A push resizes to capacity $8$ and leaves size $5$. A pop returns the size to $4$, which is half of $8$, so the array shrinks to capacity $4$ with size $4$. The next push resizes again, and the next pop shrinks again. Each pair copies four elements, so $m$ pairs cost $\Theta(m^2)$.

The fix is hysteresis: shrink only when the size falls to a quarter of the capacity, and shrink to half the capacity. After a shrink the array is half full, and it takes a constant fraction of the new capacity in pops to reach the quarter-full threshold again. The potential argument can be extended to the shrink operation with the same geometric spacing.

## Variants and extensions

- **Growth factor.** Any constant factor $c>1$ gives $O(n)$ total copies, with a constant proportional to $1/(c-1)$. Doubling is the common choice because it balances copying against wasted space.
- **Shrinking.** A shrink policy needs hysteresis. Shrinking at half full can thrash, as the counterexample above shows. Shrinking at a quarter full preserves the amortized bound.
- **Reserved capacity.** If the final size is known, reserve it once. The copies disappear, and the unused space is exactly the difference between the reservation and the size.
- **Accounting on a stack.** The potential is the stack size. Push has amortized cost $2$, pop and multipop have amortized cost $0$. This is the argument behind every monotonic stack.
- **Union by size.** Each merge moves the smaller component into the larger one, so an element's component size at least doubles whenever it moves, and it moves at most $\log n$ times. Path compression adds the inverse Ackermann factor.
- **Splay trees.** The potential is a sum of logarithms of subtree sizes. A single access can be deep, but the sequence of accesses is amortized logarithmic.
- **Move-to-front lists.** The potential is the number of inversions, and an access at position $k$ removes $k-1$ inversions when it moves the element to the front, so the access has $O(1)$ amortized cost after an initial potential of $O(n^2)$.
- **Fibonacci heaps.** The potential counts the trees and the marked nodes. Decrease-key and delete-min are amortized constant and logarithmic even though one consolidation can be long.
- **Deamortization.** When a per-operation guarantee is required, the work of a resize can be spread over the preceding operations, or the structure can be rebuilt incrementally. The total work stays the same; the latency is smoothed.
- **Persistence.** In a persistent structure, an old version can be queried after the operation that paid for the work. The amortized credit may not be available in that version, so a worst-case bound or a different accounting is needed.

## Contest strategy

A fixed procedure for contest problems.

1. Read the operation sequence and the output. If the output is a total over the sequence, an amortized bound is a candidate.
2. Identify the expensive operation and the cheap operations that enable it. A resize is enabled by the pushes that filled the array; a pop is enabled by a push.
3. Write the aggregate sum first. It is the least error-prone method and often gives the exact count.
4. If the sum is not obvious, write a potential. The potential should rise on cheap operations and fall on expensive ones, and it must be nonnegative in every reachable state.
5. Check the potential at the empty state and at the moment just before the expensive operation. Those are the two places where an off-by-one constant appears.
6. State the worst-case cost separately. An amortized $O(1)$ operation can still be $\Theta(n)$ once, and the problem may ask for the maximum.
7. Check integer widths. The total copy count and the final capacity can exceed $2^{31}$ even when $n$ does not.
8. If the problem requires a per-operation guarantee, do not use an amortized structure unless the statement allows it.

## Worked problems

### Problem 1: Minimal string

**Restatement.** Given a string $s$ of length up to $10^5$, two operations are allowed. Move the first character of $s$ to the end of an auxiliary string $t$, or move the last character of $t$ to the end of the output string $u$. Both $s$ and $t$ must end empty. Find the lexicographically smallest $u$.

**Naive baseline.** At every step, try both moves and explore the resulting states. The number of states is exponential, and even a greedy search that rescans $s$ for its minimum character at every step costs $O(n^2)$.

**Insight.** The only reason to keep a character on $t$ is that a smaller character is still waiting in $s$. If the smallest remaining character of $s$ is at least the top of $t$, the top of $t$ can be output immediately. Otherwise, pushing from $s$ is safe because the smaller character must come out before the current top.

**Derivation.** Precompute the smallest character in every suffix of $s$, or maintain a count of the remaining characters. Keep $t$ as a stack. At each step, if $t$ is nonempty and its top is no larger than the smallest remaining character of $s$, pop it to $u$. Otherwise push the next character of $s$ onto $t$. When $s$ is exhausted, pop the rest of $t$.

**Correctness.** Suppose the smallest remaining character of $s$ is smaller than the top of $t$. That character must appear in $u$ before the top, because both are still available and the smaller one wins the lexicographic comparison. The only way to reach it is to push the characters above it in $s$, so pushing is forced. If the top of $t$ is no larger than every remaining character of $s$, no future character can be smaller, so outputting the top now is optimal. The greedy choice is therefore safe at every step, and the final string is minimal.

**Complexity.** Each character is pushed onto $t$ once and popped at most once. The suffix minima or the remaining counts are computed in one pass. The total time is $O(n)$ and the space is $O(n)$, even though a single step can pop many characters.

**Common wrong approach.** Rescanning $s$ for its minimum at every step, which restores the quadratic cost, or popping only when $t$ is lexicographically smaller than the rest of $s$ without considering equality, which can produce a nonminimal string when characters repeat.

### Problem 2: Longest Regular Bracket Sequence

**Restatement.** Given a string of `(` and `)` of length at most $10^6$, find the length of the longest substring that is a regular bracket sequence, and the number of substrings that attain that length. If no nonempty regular substring exists, print `0 1`.

**Naive baseline.** Check every substring and test whether it is regular. There are $\Theta(n^2)$ substrings and each test can take linear time, for $O(n^3)$. A prefix-sum test reduces each check to $O(1)$ but leaves $O(n^2)$ substrings.

**Insight.** A stack of indices can remember the last position at which the current regular run was broken. When a closing bracket matches an opening bracket, the length of the regular substring ending at the current position is the current index minus the index now on top of the stack.

**Derivation.** Push $-1$ as a base index. For each position $i$ from $0$ to $n-1$: if the character is `(`, push $i$. Otherwise pop the stack. If the stack becomes empty, push $i$ as the new base, because the current closing bracket cannot be part of any regular substring that started before it. If the stack is nonempty after the pop, the substring from `stack.top()+1` to $i$ is regular; its length is $i - \text{stack.top()}$. Update the maximum length and the count of substrings with that length. When a longer length appears, reset the count to one; when the same length appears again, increment it.

**Correctness.** After processing position $i$, the stack holds the indices of unmatched opening brackets and the base index of the current regular run. A closing bracket either matches the most recent unmatched opening bracket, in which case the segment between the new top and $i$ is a regular sequence, or it leaves the stack empty, in which case no regular substring can cross $i$. The update therefore sees every maximal regular substring exactly at its right endpoint, and the maximum and count are correct.

**Complexity.** Each index is pushed once and popped at most once, so the scan is $O(n)$ time and $O(n)$ space. The stack can grow to $n$ in the all-opening case, which is the worst case for space.

**Common wrong approach.** Counting regular subsequences instead of substrings, or forgetting the `0 1` output when the string has no regular substring. Another common error is resetting the count when a shorter regular substring is found, which loses the earlier maximum.

### Problem 3: Bracket Matching

**Restatement.** Given $n$ and a string of $n$ characters from `()[]{}`, decide whether it is a valid bracket sequence, where a valid sequence is empty, a valid sequence inside one pair of matching brackets, or the concatenation of two valid sequences.

**Naive baseline.** Repeatedly delete every adjacent matching pair `()`, `[]`, or `{}` until no deletion is possible. Each round scans the remaining string, and there can be $\Theta(n)$ rounds, so the baseline is $O(n^2)$.

**Insight.** A stack processes the string left to right and remembers the opening brackets that are still waiting for a match. A closing bracket must match the top of the stack; if it does not, no later character can repair the mismatch.

**Derivation.** Scan the string. On an opening bracket, push it. On a closing bracket, check that the stack is nonempty and that the top is the matching opening bracket. If not, the sequence is invalid. If it matches, pop. After the scan, the sequence is valid exactly when the stack is empty.

**Correctness.** The stack invariant is that its contents are the unmatched opening brackets in the order they appeared. A closing bracket can only match the most recent unmatched opening bracket, because any earlier one is separated by an opening bracket that has not been closed. If the top does not match, the string is invalid; if it does, removing the pair preserves the validity of the rest. At the end, a nonempty stack means some opening brackets were never closed, so the string is invalid.

**Complexity.** Each character is pushed at most once and popped at most once, so the scan is $O(n)$ time and $O(n)$ space. The multipop argument is not needed for the bound, but it explains why the single pass cannot be quadratic: the total number of pops is bounded by the total number of pushes.

**Common wrong approach.** Checking only that the counts of each bracket type are equal, which accepts `([)]`, or checking only parentheses and ignoring the other two types. Another common error is forgetting to verify that the stack is empty at the end, which accepts `((()`.

## Practice progression

1. **Recognition.** Given a loop that contains an inner `while` which pops from a container, decide whether the total work is linear or quadratic. Name the quantity that is charged and the quantity that pays.
2. **Direct application.** Compute the copy count and final capacity for $n=1,2,3,4,5,8,9,16,17$ by hand, then check the values against the formula $K(n)-1$.
3. **Adaptation.** Change the growth factor from $2$ to $3$ and derive the total copy count and the wasted space. Compare the constants with the doubling case.
4. **Combination.** Add a shrink rule that halves the capacity when the size falls to a quarter of the capacity. Prove that push and pop sequences remain $O(1)$ amortized.
5. **Challenge.** Prove that a monotonic stack that answers next-greater-element queries for $n$ values performs $O(n)$ pushes and pops in total, even though one query can pop many indices.
6. **Transfer.** Take a problem with a two-pointer scan and write the potential that charges each pointer movement to the element that leaves the window. Use it to prove the scan is linear.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the difference between amortized cost and worst-case cost, and which one describes a single operation? (At a glance)
2. State the aggregate, accounting, and potential methods in one sentence each. (Formal model)
3. Why is the accounting balance nonnegative at the moment of a resize? (Algorithm derivation)
4. Define the potential for the doubling array and show that it is nonnegative in every reachable state. (Correctness proof)
5. Compute the amortized cost of a push when the array resizes and when it does not. (Algorithm derivation)
6. Derive the total number of copies for $n$ pushes and the final capacity. (Algorithm derivation)
7. What happens to the total copy count if the capacity grows by one instead of doubling? (Complexity analysis)
8. Why does shrinking at half full cause thrashing, and what rule fixes it? (Common mistakes)
9. Give the potential for a stack with push, pop, and multipop, and the amortized cost of each. (Algorithm derivation)
10. When is an amortized bound not acceptable, even though it is a true bound? (Algorithm selection)

## Further reading

- The growth-rate notation and the cost model that this article assumes are in [complexity analysis](/algorithms/foundations/complexity).
- The call-stack limits that decide whether a recursive version is safe are in [recursion](/algorithms/foundations/recursion).
- The monotonic stack, which is the main contest application of the stack potential, is in [monotonic stack](/algorithms/arrays/monotonic-stack).
- The two-pointer scan, whose total movement is linear for the same reason, is in [two pointers](/algorithms/searching/two-pointers).
- The union-by-size argument and its inverse Ackermann bound are in [disjoint set union](/algorithms/graphs/dsu).
- The amortized updates of a Fenwick tree are analyzed in [Fenwick tree](/algorithms/range-queries/fenwick-tree).
- The course treatment of algorithm analysis, including recurrences and the machine model, is in [algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis).
- The memory model behind the array, including the difference between the stack and the heap, is in [computational foundations](/start/from-ap-csa/part-1-computational-foundations).
